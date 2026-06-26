/**
 * APNs（Apple Push Notification service）HTTP/2 客户端 — L-02
 *
 * 端点：
 *   POST https://api.push.apple.com/3/device/{token}        # 生产
 *   POST https://api.sandbox.push.apple.com/3/device/{token} # 沙箱
 *
 * 鉴权：
 *   - provider authentication tokens（JWT，ES256）
 *   - 头：authorization: bearer {jwt}
 *   - JWT claims: { iss: teamId, iat: <seconds> }
 *   - JWT 缓存 55 分钟
 *
 * 必填 header：
 *   - apns-topic: {bundleId}              （background push 需带 -voip / -complication 后缀）
 *   - apns-push-type: alert | background | voip | complication | fileprovider | mdm
 *   - apns-priority: 10（alert）/ 5（background）
 *   - apns-expiration: <unix seconds>     （可选）
 *   - apns-collapse-id: <string>          （可选）
 *
 * 错误处理：
 *   - 410 Gone → invalid_token（用户卸载 / 关闭通知）
 *   - 429 Too Many Requests → rate_limited
 *   - 5xx / 网络错误 → 重试
 *   - 4xx（除 410）→ 失败
 *
 * 演示降级：
 *   - mockMode=true 或未提供 privateKey → 不发 HTTP，返回 mock messageId
 *
 * 用法：
 *   const client = new ApnsClient({
 *     teamId: 'ABCDE12345',
 *     keyId: 'FGHIJ67890',
 *     privateKey: '-----BEGIN PRIVATE KEY-----\n...',
 *     bundleId: 'com.example.app',
 *   });
 *   const r = await client.sendToToken('device-token', { title, body });
 */

import { logger as defaultLogger } from '../../logger';
import {
  base64UrlEncode,
  randomHex,
  APNS_JWT_CACHE_TTL_MS,
  PUSH_DEFAULT_TTL_SECONDS,
  PUSH_DEFAULT_PRIORITY,
  type ApnsConfig,
  type PushPayload,
  type PushResult,
} from './types';

// =============================================================================
// 内部：APNs 错误响应字段
// =============================================================================

interface ApnsErrorBody {
  reason?: string; // 'BadDeviceToken' | 'Unregistered' | 'DeviceTokenNotForTopic' | ...
  timestamp?: number;
}

// =============================================================================
// ApnsClient
// =============================================================================

export class ApnsClient {
  public readonly provider = 'APNS' as const;
  public readonly teamId: string;
  public readonly keyId: string;
  public readonly bundleId: string;
  public readonly production: boolean;
  public readonly mockMode: boolean;

  private readonly privateKey: string;
  private readonly apiBase: string;
  private readonly fetchImpl: typeof fetch;
  private readonly timeoutMs: number;
  private readonly maxRetries: number;
  private readonly backoffBaseMs: number;
  private readonly logger: typeof defaultLogger;
  private readonly now: () => number;

  /** JWT 缓存 */
  private cachedJwt: string | null = null;
  private cachedJwtExp: number = 0;

  constructor(opts: ApnsConfig) {
    if (!opts.bundleId && !opts.mockMode) {
      throw new Error('ApnsClient: bundleId is required');
    }
    if (!opts.teamId && !opts.mockMode) {
      throw new Error('ApnsClient: teamId is required');
    }
    if (!opts.keyId && !opts.mockMode) {
      throw new Error('ApnsClient: keyId is required');
    }

    this.teamId = opts.teamId ?? 'MOCKTEAM00';
    this.keyId = opts.keyId ?? 'MOCKKEY0000';
    this.bundleId = opts.bundleId ?? 'com.mock.app';
    this.production = opts.production ?? false;
    this.privateKey = opts.privateKey ?? '';
    this.mockMode = !!opts.mockMode || !opts.privateKey;
    this.apiBase = (opts.apiBase ?? this.defaultApiBase()).replace(/\/+$/, '');
    this.fetchImpl = opts.fetchImpl ?? (typeof fetch !== 'undefined' ? fetch : (() => {
      throw new Error('No fetch implementation available');
    })() as typeof fetch);
    this.timeoutMs = opts.timeoutMs ?? 8_000;
    this.maxRetries = opts.maxRetries ?? 3;
    this.backoffBaseMs = opts.backoffBaseMs ?? 400;
    this.logger = opts.logger ?? defaultLogger;
    this.now = opts.now ?? (() => Date.now());
  }

  private defaultApiBase(): string {
    return this.production
      ? 'https://api.push.apple.com'
      : 'https://api.sandbox.push.apple.com';
  }

  // -------------------------------------------------------------------------
  // 公共 API
  // -------------------------------------------------------------------------

  /** 向单个 device token 发送 */
  async sendToToken(token: string, payload: PushPayload): Promise<PushResult> {
    return this.send(token, payload);
  }

  /**
   * 验证 token 是否有效（dry-run：apns-priority=5 + apns-push-type=alert 试发）
   *  - 200 / actual delivery → true
   *  - 410 / BadDeviceToken / Unregistered → false
   */
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
  // 内部：构造 APNs payload + 发送
  // -------------------------------------------------------------------------

  private buildPayload(payload: PushPayload): Record<string, any> {
    const aps: Record<string, any> = {
      alert: {
        title: payload.title,
        body: payload.body,
      },
    };
    if (payload.badge !== undefined) aps.badge = payload.badge;
    if (payload.sound) aps.sound = payload.sound;
    if (payload.categoryId) aps.category = payload.categoryId;
    if (payload.threadId) aps['thread-id'] = payload.threadId;
    if (payload.imageUrl) {
      aps.mutableContent = 1;
    }

    const out: Record<string, any> = { aps };
    if (payload.data) {
      for (const k of Object.keys(payload.data)) {
        out[k] = payload.data[k];
      }
    }
    return out;
  }

  private buildHeaders(payload: PushPayload, jwt: string): Record<string, string> {
    const ttl = payload.ttlSeconds ?? PUSH_DEFAULT_TTL_SECONDS;
    const priority = payload.priority ?? PUSH_DEFAULT_PRIORITY;
    const now = Math.floor(this.now() / 1000);

    return {
      authorization: `bearer ${jwt}`,
      'apns-topic': this.bundleId,
      'apns-push-type': 'alert',
      'apns-priority': priority === 'high' ? '10' : '5',
      'apns-expiration': String(now + ttl),
      ...(payload.collapseKey ? { 'apns-collapse-id': payload.collapseKey } : {}),
    };
  }

  private async send(token: string, payload: PushPayload): Promise<PushResult> {
    if (this.mockMode) {
      return {
        messageId: `APNS-MOCK-${randomHex(16)}`,
        provider: this.provider,
        token,
        status: 'success',
        sentAt: this.now(),
      };
    }

    const url = `${this.apiBase}/3/device/${token}`;
    const body = this.buildPayload(payload);

    let lastError: Error | null = null;
    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      const jwt = await this.getJwt();
      const headers = this.buildHeaders(payload, jwt);

      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), this.timeoutMs);
      try {
        const resp = await this.fetchImpl(url, {
          method: 'POST',
          headers,
          body: JSON.stringify(body),
          signal: controller.signal,
        });

        if (resp.ok) {
          // APNs 成功：body 为空，messageId 用 apns-id header
          const apnsId = resp.headers.get('apns-id') ?? `APNS-${randomHex(16)}`;
          return {
            messageId: apnsId,
            provider: this.provider,
            token,
            status: 'success',
            sentAt: this.now(),
          };
        }

        const errText = await safeText(resp);
        let errBody: ApnsErrorBody = {};
        try {
          errBody = JSON.parse(errText) as ApnsErrorBody;
        } catch {
          // 非 JSON
        }
        const reason = errBody.reason ?? `HTTP_${resp.status}`;

        // 410 Gone → invalid_token
        if (resp.status === 410) {
          return {
            messageId: '',
            provider: this.provider,
            token,
            status: 'invalid_token',
            errorCode: '410',
            errorMessage: `APNs Gone: ${reason}`,
            sentAt: this.now(),
          };
        }

        // 400 BadDeviceToken → invalid_token
        if (resp.status === 400 && (reason === 'BadDeviceToken' || reason === 'Unregistered' || reason === 'DeviceTokenNotForTopic')) {
          return {
            messageId: '',
            provider: this.provider,
            token,
            status: 'invalid_token',
            errorCode: resp.status.toString(),
            errorMessage: `APNs ${resp.status}: ${reason}`,
            sentAt: this.now(),
          };
        }

        // 429 限流
        if (resp.status === 429) {
          lastError = new Error(`APNs 429: ${reason}`);
          this.logger.warn(`[ApnsClient] 429 attempt=${attempt} token=${token}`);
          await this.sleep(this.backoff(attempt));
          continue;
        }

        // 5xx：可重试
        if (resp.status >= 500 && resp.status < 600) {
          lastError = new Error(`APNs 5xx ${resp.status}: ${reason}`);
          this.logger.warn(`[ApnsClient] 5xx=${resp.status} attempt=${attempt}`);
          await this.sleep(this.backoff(attempt));
          continue;
        }

        // 其他：失败
        return {
          messageId: '',
          provider: this.provider,
          token,
          status: 'failed',
          errorCode: resp.status.toString(),
          errorMessage: `APNs ${resp.status}: ${reason}`,
          sentAt: this.now(),
        };
      } catch (err) {
        lastError = err as Error;
        this.logger.warn(`[ApnsClient] network error attempt=${attempt}: ${lastError.message}`);
        await this.sleep(this.backoff(attempt));
      } finally {
        clearTimeout(timer);
      }
    }

    return {
      messageId: '',
      provider: this.provider,
      token,
      status: 'failed',
      errorCode: '-1',
      errorMessage: `APNs send failed after ${this.maxRetries + 1} attempts: ${lastError?.message ?? 'unknown'}`,
      sentAt: this.now(),
    };
  }

  // -------------------------------------------------------------------------
  // 内部：ES256 JWT（自实现，零依赖）
  // -------------------------------------------------------------------------

  /**
   * APNs provider authentication tokens
   *  - 头部: { "alg": "ES256", "kid": "{keyId}" }
   *  - 载荷: { "iss": "{teamId}", "iat": <seconds> }
   *  - 签名: ES256（P-256）
   */
  private async getJwt(): Promise<string> {
    const now = this.now();
    if (this.cachedJwt && this.cachedJwtExp > now) {
      return this.cachedJwt;
    }

    if (typeof window !== 'undefined' || typeof require === 'undefined') {
      throw new Error('ApnsClient: JWT signing is only supported in Node runtime');
    }
    const crypto = require('crypto') as typeof import('crypto');

    const header = { alg: 'ES256', kid: this.keyId, typ: 'JWT' };
    const payload = { iss: this.teamId, iat: Math.floor(now / 1000) };
    const headerB64 = base64UrlEncode(JSON.stringify(header));
    const payloadB64 = base64UrlEncode(JSON.stringify(payload));
    const signingInput = `${headerB64}.${payloadB64}`;

    // Node 原生 createSign('SHA256') 支持 EC key（P-256）
    const signer = crypto.createSign('SHA256');
    signer.update(signingInput);
    signer.end();
    let derSig: Buffer;
    try {
      derSig = signer.sign(this.privateKey);
    } catch (err) {
      throw new Error(`ApnsClient: JWT signing failed (${(err as Error).message}). privateKey must be EC P-256 PEM.`);
    }

    // DER -> JOSE (r || s) 转换
    const jose = derToJose(derSig, 32);
    const sigB64 = base64UrlEncode(jose);

    const jwt = `${signingInput}.${sigB64}`;
    this.cachedJwt = jwt;
    this.cachedJwtExp = now + APNS_JWT_CACHE_TTL_MS;
    return jwt;
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

/**
 * 将 ASN.1 DER (ECDSA) 签名转换为 JOSE 格式（r || s）
 *  - DER:  0x30 [len] 0x02 [rLen] [r] 0x02 [sLen] [s]
 *  - JOSE: 64 字节（r 32 + s 32）
 */
function derToJose(der: Buffer, keySize: number = 32): Buffer {
  // 简单解析：找到两个 0x02 标记
  if (der.length < 8 || der[0] !== 0x30) {
    throw new Error('derToJose: invalid DER signature');
  }
  const out = Buffer.alloc(keySize * 2);

  // 找到第一个 0x02 (r)
  let idx = 2; // 跳过 0x30 + total length
  if (der[idx] !== 0x02) {
    throw new Error('derToJose: expected INTEGER tag for r');
  }
  idx++;
  let rLen = der[idx];
  idx++;
  let r = der.subarray(idx, idx + rLen);
  idx += rLen;

  // 跳过 0x00 前缀（防止 r 为负数）
  if (r.length > keySize && r[0] === 0x00) {
    r = r.subarray(1);
  }
  if (r.length > keySize) {
    r = r.subarray(r.length - keySize);
  }
  r.copy(out, keySize - r.length);

  // 第二个 0x02 (s)
  if (der[idx] !== 0x02) {
    throw new Error('derToJose: expected INTEGER tag for s');
  }
  idx++;
  const sLen = der[idx];
  idx++;
  let s = der.subarray(idx, idx + sLen);
  if (s.length > keySize && s[0] === 0x00) {
    s = s.subarray(1);
  }
  if (s.length > keySize) {
    s = s.subarray(s.length - keySize);
  }
  s.copy(out, keySize * 2 - s.length);

  return out;
}

// =============================================================================
// 工厂
// =============================================================================

export function createApnsClient(opts: ApnsConfig): ApnsClient {
  return new ApnsClient(opts);
}

export { derToJose };
export default ApnsClient;
