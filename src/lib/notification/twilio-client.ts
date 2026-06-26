/**
 * Twilio 短信客户端
 *
 * 职责：
 *  - Twilio REST API 2010-04-01 Messages 资源封装
 *  - HTTP Basic Auth（AccountSID : AuthToken，base64 编码）
 *  - 端点：https://api.twilio.com/2010-04-01/Accounts/{SID}/Messages.json
 *  - application/x-www-form-urlencoded 请求体
 *  - 自动重试：5xx / 429 触发指数退避（最多 3 次）
 *  - 演示降级：当 Twilio 不可用（mock 模式）时返回带 mock messageSid 的 SmsResult
 *
 * 用法：
 *   const client = new TwilioClient({
 *     accountSid: 'ACxxxx',
 *     authToken: 'xxxx',
 *     fromNumber: '+15005550006',
 *   });
 *   const result = await client.send({ to: '+8613800138000', body: 'hello' });
 */

import { logger } from '../logger';

// =============================================================================
// 公共类型
// =============================================================================

export interface SmsMessage {
  /** E.164 格式，例如 +8613800138000 */
  to: string;
  /** 短信正文 */
  body: string;
  /** 业务模板 ID（可选，仅用于打点） */
  templateId?: string;
  /** 模板变量（可选） */
  variables?: Record<string, string>;
}

export interface SmsResult {
  /** Twilio Message SID（或 mock 模拟 SID） */
  messageSid: string;
  /** 接收方手机号 */
  to: string;
  status:
    | 'queued'
    | 'sending'
    | 'sent'
    | 'delivered'
    | 'failed'
    | 'undelivered';
  errorCode?: number;
  errorMessage?: string;
  /** 价格（字符串，例如 "-0.0075"） */
  price?: string;
  /** 计价单位（例如 "USD"） */
  priceUnit?: string;
  /** 发送时间戳（毫秒） */
  sentAt: number;
}

export type SmsStatus = SmsResult['status'];

export interface TwilioClientOptions {
  /** Twilio Account SID，AC 开头 */
  accountSid: string;
  /** Twilio Auth Token */
  authToken: string;
  /** 发送方号码，E.164 格式 */
  fromNumber: string;
  /** 自定义 API 基础地址（用于测试 / 私有部署），默认官方端点 */
  apiBase?: string;
  /** 自定义 fetch 实现（用于测试 / SSR） */
  fetchImpl?: typeof fetch;
  /** 请求超时（ms），默认 8_000 */
  timeoutMs?: number;
  /** 最大重试次数（不含首次），默认 3 */
  maxRetries?: number;
  /** 退避基数（ms），默认 400 */
  backoffBaseMs?: number;
  /** 演示降级：跳过真实调用，返回 mock 结果 */
  mockMode?: boolean;
  /** 注入 logger（便于测试） */
  logger?: typeof logger;
  /** 时钟注入 */
  now?: () => number;
}

// =============================================================================
// 内部：Twilio 响应字段
// =============================================================================

interface TwilioApiResponse {
  sid?: string;
  status?: string;
  to?: string;
  error_code?: number | null;
  error_message?: string | null;
  price?: string | null;
  price_unit?: string | null;
  message?: string;
}

const DEFAULT_TIMEOUT_MS = 8_000;
const DEFAULT_MAX_RETRIES = 3;
const DEFAULT_BACKOFF_BASE_MS = 400;

// =============================================================================
// TwilioClient
// =============================================================================

export class TwilioClient {
  public readonly accountSid: string;
  public readonly authToken: string;
  public readonly fromNumber: string;
  public readonly mockMode: boolean;

  private readonly apiBase: string;
  private readonly fetchImpl: typeof fetch;
  private readonly timeoutMs: number;
  private readonly maxRetries: number;
  private readonly backoffBaseMs: number;
  private readonly logger: typeof logger;
  private readonly now: () => number;
  /** 发送历史（最近 1000 条），便于排查 */
  private readonly history: SmsResult[] = [];
  private readonly maxHistory = 1000;

  constructor(opts: TwilioClientOptions) {
    if (!opts.accountSid) throw new Error('TwilioClient: accountSid is required');
    if (!opts.authToken) throw new Error('TwilioClient: authToken is required');
    if (!opts.fromNumber) throw new Error('TwilioClient: fromNumber is required');

    this.accountSid = opts.accountSid;
    this.authToken = opts.authToken;
    this.fromNumber = opts.fromNumber;
    this.mockMode = !!opts.mockMode;
    this.apiBase = (opts.apiBase ?? 'https://api.twilio.com').replace(/\/+$/, '');
    this.fetchImpl = opts.fetchImpl ?? (typeof fetch !== 'undefined' ? fetch : (() => {
      throw new Error('No fetch implementation available');
    })() as typeof fetch);
    this.timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    this.maxRetries = opts.maxRetries ?? DEFAULT_MAX_RETRIES;
    this.backoffBaseMs = opts.backoffBaseMs ?? DEFAULT_BACKOFF_BASE_MS;
    this.logger = opts.logger ?? logger;
    this.now = opts.now ?? (() => Date.now());
  }

  /** Basic Auth 头：base64(AccountSID:AuthToken) */
  private buildAuthHeader(): string {
    const token = typeof Buffer !== 'undefined'
      ? Buffer.from(`${this.accountSid}:${this.authToken}`).toString('base64')
      : btoa(`${this.accountSid}:${this.authToken}`);
    return `Basic ${token}`;
  }

  /** 构造 endpoint URL */
  private endpointUrl(): string {
    return `${this.apiBase}/2010-04-01/Accounts/${this.accountSid}/Messages.json`;
  }

  // -------------------------------------------------------------------------
  // 公共 API
  // -------------------------------------------------------------------------

  /** 发送单条短信 */
  async send(opts: SmsMessage): Promise<SmsResult> {
    if (!opts.to) {
      return this.recordResult({
        messageSid: '',
        to: opts.to,
        status: 'failed',
        errorCode: 21211,
        errorMessage: 'to is required',
        sentAt: this.now(),
      });
    }
    if (!opts.body) {
      return this.recordResult({
        messageSid: '',
        to: opts.to,
        status: 'failed',
        errorCode: 21610,
        errorMessage: 'body is required',
        sentAt: this.now(),
      });
    }

    // Mock 模式：直接返回 mock SID
    if (this.mockMode) {
      return this.recordResult(this.buildMockResult(opts.to, 'sent'));
    }

    const body = new URLSearchParams();
    body.set('To', opts.to);
    body.set('From', this.fromNumber);
    body.set('Body', opts.body);
    if (opts.templateId) body.set('StatusCallback', `template=${encodeURIComponent(opts.templateId)}`);

    return this.executeWithRetry({
      url: this.endpointUrl(),
      method: 'POST',
      headers: {
        Authorization: this.buildAuthHeader(),
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
      },
      body: body.toString(),
    }, opts.to, opts.templateId);
  }

  /** 批量发送（并行） */
  async sendBatch(messages: SmsMessage[]): Promise<SmsResult[]> {
    return Promise.all(messages.map((m) => this.send(m)));
  }

  /** 查询短信状态（GET Message 资源） */
  async getStatus(messageSid: string): Promise<SmsStatus> {
    if (!messageSid) throw new Error('TwilioClient.getStatus: messageSid is required');
    if (this.mockMode) return 'sent';

    const url = `${this.apiBase}/2010-04-01/Accounts/${this.accountSid}/Messages/${messageSid}.json`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const resp = await this.fetchImpl(url, {
        method: 'GET',
        headers: {
          Authorization: this.buildAuthHeader(),
          Accept: 'application/json',
        },
        signal: controller.signal,
      });
      if (!resp.ok) {
        const errText = await safeText(resp);
        throw new Error(`Twilio GET failed: ${resp.status} ${errText}`);
      }
      const data = (await resp.json()) as TwilioApiResponse;
      const status = normalizeStatus(data.status);
      return status;
    } catch (err) {
      this.logger.warn(`[TwilioClient] getStatus failed sid=${messageSid}: ${(err as Error).message}`);
      throw err;
    } finally {
      clearTimeout(timer);
    }
  }

  /** 取得最近 N 条历史（默认 100） */
  getHistory(limit = 100): SmsResult[] {
    return this.history.slice(-limit);
  }

  // -------------------------------------------------------------------------
  // 内部：HTTP + 重试
  // -------------------------------------------------------------------------

  private async executeWithRetry(
    req: { url: string; method: string; headers: Record<string, string>; body: string },
    to: string,
    templateId?: string,
  ): Promise<SmsResult> {
    let lastError: Error | null = null;
    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), this.timeoutMs);
      try {
        const resp = await this.fetchImpl(req.url, {
          method: req.method,
          headers: req.headers,
          body: req.body,
          signal: controller.signal,
        });
        if (resp.ok) {
          const data = (await resp.json()) as TwilioApiResponse;
          return this.recordResult({
            messageSid: data.sid ?? '',
            to: data.to ?? to,
            status: normalizeStatus(data.status),
            errorCode: data.error_code ?? undefined,
            errorMessage: data.error_message ?? undefined,
            price: data.price ?? undefined,
            priceUnit: data.price_unit ?? undefined,
            sentAt: this.now(),
          });
        }

        // 429 限流：退避重试
        if (resp.status === 429) {
          lastError = new Error(`Twilio rate limited: 429`);
          this.logger.warn(`[TwilioClient] 429 from Twilio, attempt=${attempt}, to=${to}`);
          await this.sleep(this.backoff(attempt));
          continue;
        }

        // 5xx：可重试
        if (resp.status >= 500 && resp.status < 600) {
          lastError = new Error(`Twilio 5xx: ${resp.status}`);
          this.logger.warn(`[TwilioClient] 5xx=${resp.status} attempt=${attempt} to=${to}`);
          await this.sleep(this.backoff(attempt));
          continue;
        }

        // 4xx（除 429）：不可重试，立即返回失败
        const errText = await safeText(resp);
        let errCode = 0;
        let errMessage = errText;
        try {
          const parsed = JSON.parse(errText) as TwilioApiResponse;
          errCode = parsed.error_code ?? resp.status;
          errMessage = parsed.message ?? parsed.error_message ?? errText;
        } catch {
          // errText 非 JSON，保留原值
        }
        return this.recordResult({
          messageSid: '',
          to,
          status: 'failed',
          errorCode: errCode,
          errorMessage: `[${resp.status}] ${errMessage}` + (templateId ? ` template=${templateId}` : ''),
          sentAt: this.now(),
        });
      } catch (err) {
        lastError = err as Error;
        this.logger.warn(`[TwilioClient] network error attempt=${attempt} to=${to}: ${lastError.message}`);
        await this.sleep(this.backoff(attempt));
      } finally {
        clearTimeout(timer);
      }
    }

    // 重试耗尽：标记为 failed
    return this.recordResult({
      messageSid: '',
      to,
      status: 'failed',
      errorCode: -1,
      errorMessage: `Twilio send failed after ${this.maxRetries + 1} attempts: ${lastError?.message ?? 'unknown'}`,
      sentAt: this.now(),
    });
  }

  /** 指数退避（带抖动） */
  private backoff(attempt: number): number {
    const base = this.backoffBaseMs * Math.pow(2, attempt);
    const jitter = Math.random() * this.backoffBaseMs;
    return base + jitter;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private recordResult(result: SmsResult): SmsResult {
    this.history.push(result);
    if (this.history.length > this.maxHistory) {
      this.history.splice(0, this.history.length - this.maxHistory);
    }
    return result;
  }

  private buildMockResult(to: string, status: SmsStatus): SmsResult {
    const sid = `MOCK${randomHex(32)}`;
    return {
      messageSid: sid,
      to,
      status,
      price: '-0.0075',
      priceUnit: 'USD',
      sentAt: this.now(),
    };
  }
}

// =============================================================================
// 工具函数
// =============================================================================

function normalizeStatus(s?: string | null): SmsStatus {
  switch ((s ?? '').toLowerCase()) {
    case 'queued': return 'queued';
    case 'sending': return 'sending';
    case 'sent': return 'sent';
    case 'delivered': return 'delivered';
    case 'failed': return 'failed';
    case 'undelivered': return 'undelivered';
    default: return 'queued';
  }
}

async function safeText(resp: Response): Promise<string> {
  try {
    return await resp.text();
  } catch {
    return '';
  }
}

function randomHex(len: number): string {
  const chars = '0123456789abcdef';
  let out = '';
  for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * 16)];
  return out;
}

// =============================================================================
// 工厂
// =============================================================================

export function createTwilioClient(opts: TwilioClientOptions): TwilioClient {
  return new TwilioClient(opts);
}

export default TwilioClient;
