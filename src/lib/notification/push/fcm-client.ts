/**
 * FCM（Firebase Cloud Messaging）HTTP v1 API 客户端 — L-01
 *
 * 端点：
 *   POST https://fcm.googleapis.com/v1/projects/{projectId}/messages:send
 *   POST https://oauth2.googleapis.com/token
 *
 * 鉴权：
 *   1. 用 service account private_key 签发 JWT（RS256）
 *   2. POST /token 换取 access_token（缓存 55 分钟）
 *   3. Bearer access_token 调 messages:send
 *
 * 错误处理：
 *   - UNREGISTERED / INVALID_ARGUMENT / SENDER_ID_MISMATCH → invalid_token
 *   - QUOTA_EXCEEDED / UNAVAILABLE / 5xx → 重试
 *   - 4xx（除上面） → 立即失败
 *
 * 演示降级：
 *   - mockMode=true → 不发 HTTP，直接返回 mock messageId
 *   - 未配置 projectId / serviceAccount → 自动 mock
 *
 * 用法：
 *   const client = new FcmClient({
 *     projectId: 'my-app',
 *     serviceAccount: { project_id, client_email, private_key },
 *   });
 *   const r = await client.sendToToken('token-xxx', { title, body });
 */

import { logger as defaultLogger } from '../../logger';
import {
  base64UrlEncode,
  randomHex,
  FCM_TOKEN_CACHE_TTL_MS,
  PUSH_DEFAULT_TTL_SECONDS,
  PUSH_DEFAULT_PRIORITY,
  type FcmConfig,
  type FcmServiceAccount,
  type PushPayload,
  type PushResult,
} from './types';

// =============================================================================
// 内部：FCM 响应字段
// =============================================================================

interface FcmMessageResponse {
  name?: string; // "projects/{project}/messages/{messageId}"
}

interface FcmErrorResponse {
  error?: {
    code?: number;
    message?: string;
    status?: string; // 'UNREGISTERED' | 'INVALID_ARGUMENT' | 'QUOTA_EXCEEDED' | 'UNAVAILABLE' | ...
    details?: any[];
  };
}

interface TokenResponse {
  access_token?: string;
  expires_in?: number;
  token_type?: string;
}

// =============================================================================
// FcmClient
// =============================================================================

export class FcmClient {
  public readonly provider = 'FCM' as const;
  public readonly projectId: string;
  public readonly mockMode: boolean;

  private readonly serviceAccount: FcmServiceAccount;
  private readonly apiBase: string;
  private readonly tokenUri: string;
  private readonly fetchImpl: typeof fetch;
  private readonly timeoutMs: number;
  private readonly maxRetries: number;
  private readonly backoffBaseMs: number;
  private readonly logger: typeof defaultLogger;
  private readonly now: () => number;

  /** access_token 缓存 */
  private cachedAccessToken: string | null = null;
  private cachedAccessTokenExp: number = 0;

  constructor(opts: FcmConfig) {
    if (!opts.projectId && !opts.mockMode) {
      throw new Error('FcmClient: projectId is required');
    }
    if (!opts.serviceAccount && !opts.mockMode) {
      throw new Error('FcmClient: serviceAccount is required');
    }

    this.projectId = opts.projectId;
    this.serviceAccount = opts.serviceAccount ?? {
      project_id: 'mock',
      client_email: 'mock@mock.iam.gserviceaccount.com',
      private_key: '-----BEGIN PRIVATE KEY-----\nMOCK\n-----END PRIVATE KEY-----\n',
    };
    this.mockMode = !!opts.mockMode || !opts.serviceAccount;
    this.apiBase = (opts.apiBase ?? 'https://fcm.googleapis.com').replace(/\/+$/, '');
    this.tokenUri = this.serviceAccount.token_uri ?? 'https://oauth2.googleapis.com/token';
    this.fetchImpl = opts.fetchImpl ?? (typeof fetch !== 'undefined' ? fetch : (() => {
      throw new Error('No fetch implementation available');
    })() as typeof fetch);
    this.timeoutMs = opts.timeoutMs ?? 8_000;
    this.maxRetries = opts.maxRetries ?? 3;
    this.backoffBaseMs = opts.backoffBaseMs ?? 400;
    this.logger = opts.logger ?? defaultLogger;
    this.now = opts.now ?? (() => Date.now());
  }

  // -------------------------------------------------------------------------
  // 公共 API
  // -------------------------------------------------------------------------

  /** 向单个 token 发送 */
  async sendToToken(token: string, payload: PushPayload): Promise<PushResult> {
    return this.send({ message: this.buildMessage({ token }, payload) }, token);
  }

  /** 向 topic 发送 */
  async sendToTopic(topic: string, payload: PushPayload): Promise<PushResult> {
    return this.send({ message: this.buildMessage({ topic }, payload) }, topic);
  }

  /** 向 condition 发送 */
  async sendToCondition(condition: string, payload: PushPayload): Promise<PushResult> {
    return this.send({ message: this.buildMessage({ condition }, payload) }, condition);
  }

  /**
   * 验证 token 是否有效（试发一条 silent 消息）
   *  - true  → 有效（即使内容校验失败）
   *  - false → UNREGISTERED / INVALID_ARGUMENT 等
   */
  async validateToken(token: string): Promise<boolean> {
    if (this.mockMode) return true;
    const r = await this.sendToToken(token, {
      title: '__validate__',
      body: 'validate',
      data: { __validate: '1' },
      ttlSeconds: 60,
    });
    return r.status !== 'invalid_token';
  }

  // -------------------------------------------------------------------------
  // 内部：构造 FCM message payload
  // -------------------------------------------------------------------------

  private buildMessage(
    target: { token?: string; topic?: string; condition?: string },
    payload: PushPayload,
  ): Record<string, any> {
    const ttl = payload.ttlSeconds ?? PUSH_DEFAULT_TTL_SECONDS;
    const priority = payload.priority ?? PUSH_DEFAULT_PRIORITY;

    const msg: Record<string, any> = {
      ...target,
      notification: {
        title: payload.title,
        body: payload.body,
        ...(payload.imageUrl ? { image: payload.imageUrl } : {}),
      },
      data: this.sanitizeData(payload.data),
      android: {
        priority: priority === 'high' ? 'HIGH' : 'NORMAL',
        ttl: `${ttl}s`,
        ...(payload.collapseKey ? { collapse_key: payload.collapseKey } : {}),
        ...(payload.iconUrl ? { notification: { icon: payload.iconUrl } } : {}),
        ...(payload.clickAction ? { notification: { click_action: payload.clickAction } } : {}),
      },
      apns: {
        headers: {
          ...(payload.collapseKey ? { 'apns-collapse-id': payload.collapseKey } : {}),
        },
        payload: {
          aps: {
            ...(payload.badge !== undefined ? { 'badge': payload.badge } : {}),
            ...(payload.sound ? { 'sound': payload.sound } : {}),
            ...(payload.categoryId ? { 'category': payload.categoryId } : {}),
            ...(payload.threadId ? { 'thread-id': payload.threadId } : {}),
          },
        },
      },
    };

    return msg;
  }

  /** FCM data 字段必须是 string:string */
  private sanitizeData(data?: Record<string, string>): Record<string, string> | undefined {
    if (!data) return undefined;
    const out: Record<string, string> = {};
    for (const k of Object.keys(data)) {
      out[k] = String(data[k]);
    }
    return out;
  }

  // -------------------------------------------------------------------------
  // 内部：HTTP + 重试
  // -------------------------------------------------------------------------

  private async send(body: { message: Record<string, any> }, tokenKey: string): Promise<PushResult> {
    if (this.mockMode) {
      return this.buildMockResult(tokenKey, 'success');
    }

    const url = `${this.apiBase}/v1/projects/${this.projectId}/messages:send`;
    const accessToken = await this.getAccessToken();

    let lastError: Error | null = null;
    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), this.timeoutMs);
      try {
        const resp = await this.fetchImpl(url, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify(body),
          signal: controller.signal,
        });

        if (resp.ok) {
          const data = (await resp.json()) as FcmMessageResponse;
          // name 形如 "projects/{project}/messages/{messageId}"
          const messageId = data.name?.split('/').pop() ?? `FCM-MOCK-${randomHex(16)}`;
          return {
            messageId,
            provider: this.provider,
            token: tokenKey,
            status: 'success',
            sentAt: this.now(),
          };
        }

        const errText = await safeText(resp);
        let errBody: FcmErrorResponse = {};
        try {
          errBody = JSON.parse(errText) as FcmErrorResponse;
        } catch {
          // 非 JSON
        }
        const code = errBody.error?.code ?? resp.status;
        const status = errBody.error?.status;
        const message = errBody.error?.message ?? errText;

        // invalid_token 类：UNREGISTERED / INVALID_ARGUMENT / SENDER_ID_MISMATCH
        if (
          status === 'UNREGISTERED' ||
          status === 'INVALID_ARGUMENT' ||
          status === 'SENDER_ID_MISMATCH' ||
          code === 404
        ) {
          return {
            messageId: '',
            provider: this.provider,
            token: tokenKey,
            status: 'invalid_token',
            errorCode: String(code),
            errorMessage: `[${status ?? code}] ${message}`,
            sentAt: this.now(),
          };
        }

        // 限流（429）
        if (resp.status === 429) {
          lastError = new Error(`FCM 429: ${message}`);
          this.logger.warn(`[FcmClient] 429 attempt=${attempt} token=${tokenKey}`);
          await this.sleep(this.backoff(attempt));
          continue;
        }

        // 5xx：可重试
        if (resp.status >= 500 && resp.status < 600) {
          lastError = new Error(`FCM 5xx ${resp.status}: ${message}`);
          this.logger.warn(`[FcmClient] 5xx=${resp.status} attempt=${attempt}`);
          await this.sleep(this.backoff(attempt));
          continue;
        }

        // 其他 4xx：立即失败
        return {
          messageId: '',
          provider: this.provider,
          token: tokenKey,
          status: 'failed',
          errorCode: String(code),
          errorMessage: `[${status ?? code}] ${message}`,
          sentAt: this.now(),
        };
      } catch (err) {
        lastError = err as Error;
        this.logger.warn(`[FcmClient] network error attempt=${attempt}: ${lastError.message}`);
        await this.sleep(this.backoff(attempt));
      } finally {
        clearTimeout(timer);
      }
    }

    return {
      messageId: '',
      provider: this.provider,
      token: tokenKey,
      status: 'failed',
      errorCode: '-1',
      errorMessage: `FCM send failed after ${this.maxRetries + 1} attempts: ${lastError?.message ?? 'unknown'}`,
      sentAt: this.now(),
    };
  }

  // -------------------------------------------------------------------------
  // 内部：OAuth 2.0 access token
  // -------------------------------------------------------------------------

  private async getAccessToken(): Promise<string> {
    const now = this.now();
    if (this.cachedAccessToken && this.cachedAccessTokenExp > now) {
      return this.cachedAccessToken;
    }

    const jwt = await this.signServiceAccountJwt();
    const resp = await this.fetchImpl(this.tokenUri, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: jwt,
      }).toString(),
    });
    if (!resp.ok) {
      const errText = await safeText(resp);
      throw new Error(`FCM token exchange failed: ${resp.status} ${errText}`);
    }
    const data = (await resp.json()) as TokenResponse;
    if (!data.access_token) {
      throw new Error('FCM token exchange: no access_token in response');
    }
    this.cachedAccessToken = data.access_token;
    // expires_in 单位是秒，减去 5 分钟缓冲
    const ttl = (data.expires_in ?? 3600) * 1000 - 5 * 60_000;
    this.cachedAccessTokenExp = now + Math.min(ttl, FCM_TOKEN_CACHE_TTL_MS);
    return this.cachedAccessToken!;
  }

  /**
   * 用 service account private_key 签发 JWT（RS256）
   * 符合 https://developers.google.com/identity/protocols/oauth2/service-account
   */
  private async signServiceAccountJwt(): Promise<string> {
    // 仅在 Node 端运行；edge 端用 jose 替代（这里只 demo Node）
    if (typeof window !== 'undefined' || typeof require === 'undefined') {
      throw new Error('FcmClient: JWT signing is only supported in Node runtime');
    }
    // 动态 require 以避免浏览器打包报错
    const crypto = require('crypto') as typeof import('crypto');

    const now = Math.floor(this.now() / 1000);
    const header = { alg: 'RS256', typ: 'JWT' };
    const payload = {
      iss: this.serviceAccount.client_email,
      scope: 'https://www.googleapis.com/auth/firebase.messaging',
      aud: this.tokenUri,
      iat: now,
      exp: now + 3600,
    };

    const headerB64 = base64UrlEncode(JSON.stringify(header));
    const payloadB64 = base64UrlEncode(JSON.stringify(payload));
    const signingInput = `${headerB64}.${payloadB64}`;

    const signer = crypto.createSign('RSA-SHA256');
    signer.update(signingInput);
    signer.end();
    const signature = signer.sign(this.serviceAccount.private_key);
    const sigB64 = base64UrlEncode(signature);

    return `${signingInput}.${sigB64}`;
  }

  // -------------------------------------------------------------------------
  // 工具
  // -------------------------------------------------------------------------

  private backoff(attempt: number): number {
    const base = this.backoffBaseMs * Math.pow(2, attempt);
    const jitter = Math.random() * this.backoffBaseMs;
    return base + jitter;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private buildMockResult(token: string, status: 'success' | 'failed'): PushResult {
    return {
      messageId: `FCM-MOCK-${randomHex(16)}`,
      provider: this.provider,
      token,
      status,
      sentAt: this.now(),
    };
  }
}

// =============================================================================
// 工具
// =============================================================================

async function safeText(resp: Response): Promise<string> {
  try {
    return await resp.text();
  } catch {
    return '';
  }
}

// =============================================================================
// 工厂
// =============================================================================

export function createFcmClient(opts: FcmConfig): FcmClient {
  return new FcmClient(opts);
}

export default FcmClient;
