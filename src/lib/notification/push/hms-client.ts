/**
 * HMS（华为推送）客户端 — L-03
 *
 * 端点：
 *   POST https://push-api.cloud.huawei.com/v1/{appId}/messages:send
 *   POST https://oauth-login.cloud.huawei.com/oauth2/v3/token   （拿 access_token）
 *
 * 鉴权：
 *   1. POST /oauth2/v3/token，grant_type=client_credentials，client_id=appId，client_secret=appSecret
 *   2. 缓存 access_token 55 分钟
 *   3. POST messages:send 携带 Authorization: Bearer {access_token}
 *
 * 错误处理（华为返回 code 字段）：
 *   - 80300002 / 80300007 → invalid_token
 *   - 80100000 → rate_limited
 *   - 5xx → 重试
 *   - 其他 4xx → 失败
 *
 * 演示降级：
 *   - mockMode=true 或未提供 appId/appSecret → mock 成功
 *
 * 用法：
 *   const client = new HmsClient({
 *     appId: '100xxxxx',
 *     appSecret: 'xxxx',
 *   });
 *   const r = await client.sendToToken('hms-token', { title, body });
 */

import { logger as defaultLogger } from '../../logger';
import {
  randomHex,
  HMS_TOKEN_CACHE_TTL_MS,
  PUSH_DEFAULT_TTL_SECONDS,
  PUSH_DEFAULT_PRIORITY,
  type HmsConfig,
  type PushPayload,
  type PushResult,
} from './types';

// =============================================================================
// 内部：HMS 响应字段
// =============================================================================

interface HmsSendResponse {
  code?: string;     // 业务错误码（字符串，HMS 返回如 '80300002'）
  msg?: string;
  requestId?: string;
}

interface HmsTokenResponse {
  access_token?: string;
  expires_in?: number;
  token_type?: string;
}

interface HmsErrorBody {
  code?: string;
  message?: string;
}

// =============================================================================
// 错误码表
// =============================================================================

/** 设备 token 失效 */
const HMS_INVALID_TOKEN_CODES = new Set([
  '80300002', // 设备 token 失效
  '80300007', // 设备 token 非法
  '80300008', // 设备不属于该应用
]);

/** 限流 */
const HMS_RATE_LIMITED_CODES = new Set([
  '80100000', // 系统级限流
  '80100001', // 应用级限流
]);

// =============================================================================
// HmsClient
// =============================================================================

export class HmsClient {
  public readonly provider = 'HMS' as const;
  public readonly appId: string;
  public readonly mockMode: boolean;

  private readonly appSecret: string;
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

  constructor(opts: HmsConfig) {
    if (!opts.appId && !opts.mockMode) {
      throw new Error('HmsClient: appId is required');
    }
    if (!opts.appSecret && !opts.mockMode) {
      throw new Error('HmsClient: appSecret is required');
    }

    this.appId = opts.appId ?? '100000000';
    this.appSecret = opts.appSecret ?? 'MOCK_SECRET';
    this.mockMode = !!opts.mockMode || !opts.appSecret;
    this.apiBase = (opts.apiBase ?? 'https://push-api.cloud.huawei.com').replace(/\/+$/, '');
    this.tokenUri = 'https://oauth-login.cloud.huawei.com/oauth2/v3/token';
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
    return this.send({
      payload,
      target: { token: [token] },
      isMock: false,
    }, token);
  }

  /** 向 topic 发送 */
  async sendToTopic(topic: string, payload: PushPayload): Promise<PushResult> {
    return this.send({
      payload,
      target: { topic },
      isMock: false,
    }, topic);
  }

  /** 刷新 access_token（缓存满前可主动调用） */
  async refreshToken(): Promise<string> {
    this.cachedAccessToken = null;
    this.cachedAccessTokenExp = 0;
    return this.getAccessToken();
  }

  /** 验证 token */
  async validateToken(token: string): Promise<boolean> {
    if (this.mockMode) return true;
    const r = await this.sendToToken(token, {
      title: '__validate__',
      body: 'validate',
      ttlSeconds: 60,
    });
    return r.status !== 'invalid_token';
  }

  // -------------------------------------------------------------------------
  // 内部：构造 HMS message
  // -------------------------------------------------------------------------

  private buildMessage(
    target: { token?: string[]; topic?: string },
    payload: PushPayload,
  ): Record<string, any> {
    const ttl = payload.ttlSeconds ?? PUSH_DEFAULT_TTL_SECONDS;
    const priority = payload.priority ?? PUSH_DEFAULT_PRIORITY;

    return {
      target,
      push_options: {
        ...(payload.collapseKey ? { collapse_group: payload.collapseKey } : {}),
        ttl: `${ttl}s`,
        bi_tag: payload.collapseKey,
      },
      payload: {
        notification: {
          title: payload.title,
          body: payload.body,
          ...(payload.imageUrl ? { image: payload.imageUrl } : {}),
        },
        data: JSON.stringify(payload.data ?? {}),
        android: {
          notification: {
            ...(payload.iconUrl ? { icon: payload.iconUrl } : {}),
            ...(payload.clickAction ? { click_action: payload.clickAction } : {}),
            default_sound: payload.sound === 'silent' ? false : true,
            importance: priority === 'high' ? 'HIGH' : 'NORMAL',
          },
        },
      },
    };
  }

  // -------------------------------------------------------------------------
  // 内部：HTTP + 重试
  // -------------------------------------------------------------------------

  private async send(
    args: {
      payload: PushPayload;
      target: { token?: string[]; topic?: string };
      isMock: boolean;
    },
    tokenKey: string,
  ): Promise<PushResult> {
    if (this.mockMode) {
      return this.buildMockResult(tokenKey, 'success');
    }

    const url = `${this.apiBase}/v1/${this.appId}/messages:send`;
    const accessToken = await this.getAccessToken();
    const body = this.buildMessage(args.target, args.payload);

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

        const text = await safeText(resp);
        let errBody: HmsErrorBody = {};
        try {
          errBody = JSON.parse(text) as HmsErrorBody;
        } catch {
          // 非 JSON
        }
        const code = errBody.code ?? String(resp.status);
        const message = errBody.message ?? text;

        if (resp.ok && (code === '80000000' || code === '0' || code === '')) {
          return {
            messageId: `HMS-${randomHex(16)}`,
            provider: this.provider,
            token: tokenKey,
            status: 'success',
            sentAt: this.now(),
          };
        }

        // 业务错误码
        if (HMS_INVALID_TOKEN_CODES.has(code)) {
          return {
            messageId: '',
            provider: this.provider,
            token: tokenKey,
            status: 'invalid_token',
            errorCode: code,
            errorMessage: message,
            sentAt: this.now(),
          };
        }

        if (HMS_RATE_LIMITED_CODES.has(code) || resp.status === 429) {
          lastError = new Error(`HMS rate limited: ${code} ${message}`);
          this.logger.warn(`[HmsClient] rate limited code=${code} attempt=${attempt}`);
          await this.sleep(this.backoff(attempt));
          continue;
        }

        if (resp.status >= 500 && resp.status < 600) {
          lastError = new Error(`HMS 5xx ${resp.status}: ${message}`);
          this.logger.warn(`[HmsClient] 5xx=${resp.status} attempt=${attempt}`);
          await this.sleep(this.backoff(attempt));
          continue;
        }

        return {
          messageId: '',
          provider: this.provider,
          token: tokenKey,
          status: 'failed',
          errorCode: code,
          errorMessage: `[${code}] ${message}`,
          sentAt: this.now(),
        };
      } catch (err) {
        lastError = err as Error;
        this.logger.warn(`[HmsClient] network error attempt=${attempt}: ${lastError.message}`);
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
      errorMessage: `HMS send failed after ${this.maxRetries + 1} attempts: ${lastError?.message ?? 'unknown'}`,
      sentAt: this.now(),
    };
  }

  // -------------------------------------------------------------------------
  // 内部：access_token
  // -------------------------------------------------------------------------

  private async getAccessToken(): Promise<string> {
    const now = this.now();
    if (this.cachedAccessToken && this.cachedAccessTokenExp > now) {
      return this.cachedAccessToken;
    }

    const resp = await this.fetchImpl(this.tokenUri, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: this.appId,
        client_secret: this.appSecret,
      }).toString(),
    });
    if (!resp.ok) {
      const errText = await safeText(resp);
      throw new Error(`HMS token exchange failed: ${resp.status} ${errText}`);
    }
    const data = (await resp.json()) as HmsTokenResponse;
    if (!data.access_token) {
      throw new Error('HMS token exchange: no access_token in response');
    }
    this.cachedAccessToken = data.access_token;
    const ttl = (data.expires_in ?? 3600) * 1000 - 5 * 60_000;
    this.cachedAccessTokenExp = now + Math.min(ttl, HMS_TOKEN_CACHE_TTL_MS);
    return this.cachedAccessToken!;
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
      messageId: `HMS-MOCK-${randomHex(16)}`,
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

export function createHmsClient(opts: HmsConfig): HmsClient {
  return new HmsClient(opts);
}

export { HMS_INVALID_TOKEN_CODES, HMS_RATE_LIMITED_CODES };
export default HmsClient;
