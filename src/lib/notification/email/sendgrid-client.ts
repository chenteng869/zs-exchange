/**
 * SendGrid 邮件客户端（SendGridClient）
 *
 * 职责：
 *  - SendGrid v3 REST API 封装
 *  - 端点：https://api.sendgrid.com/v3/mail/send
 *  - 鉴权：Authorization: Bearer {apiKey}
 *  - 5xx / 429 触发指数退避重试（最多 3 次）
 *  - 429 尊重 X-RateLimit-Reset 响应头
 *  - 演示降级：API Key 含 "mock" 时直接返回 mock 结果
 *  - 退订管理（Suppression）API
 *  - 统计 API
 *
 * 用法：
 *   const client = new SendGridClient({ apiKey: 'SG.xxxx' });
 *   const r = await client.send({
 *     from: { email: 'noreply@smy.exchange', name: 'SMY Exchange' },
 *     to: { email: 'user@example.com' },
 *     subject: '...',
 *     text: '...',
 *     html: '...',
 *   });
 */

import { logger } from '../../logger';
import type {
  EmailAddress,
  EmailMessage,
  EmailResult,
  EmailStats,
  StatsAggregation,
  SuppressionEntry,
  SuppressionListResponse,
  SuppressionType,
} from './types';

// =============================================================================
// 公共类型 / 常量
// =============================================================================

export interface SendGridClientOptions {
  /** SendGrid API Key（SG. 开头）；含 "mock" 时进入演示降级 */
  apiKey: string;
  /** 自定义 API 基础地址，默认 https://api.sendgrid.com */
  apiBase?: string;
  /** 自定义 fetch 实现（测试 / SSR） */
  fetchImpl?: typeof fetch;
  /** 请求超时（ms），默认 8_000 */
  timeoutMs?: number;
  /** 最大重试次数（不含首次），默认 3 */
  maxRetries?: number;
  /** 退避基数（ms），默认 400 */
  backoffBaseMs?: number;
  /** 演示降级：跳过真实调用 */
  mockMode?: boolean;
  /** logger 注入 */
  logger?: typeof logger;
  /** 时钟注入 */
  now?: () => number;
}

const DEFAULT_TIMEOUT_MS = 8_000;
const DEFAULT_MAX_RETRIES = 3;
const DEFAULT_BACKOFF_BASE_MS = 400;
const API_BASE = 'https://api.sendgrid.com/v3';

// =============================================================================
// 内部：Personalization → EmailAddress 序列化
// =============================================================================

function toArray(a: EmailAddress | EmailAddress[] | undefined): EmailAddress[] {
  if (!a) return [];
  return Array.isArray(a) ? a : [a];
}

function toEmailString(a: EmailAddress): string {
  return a.name ? `${a.name} <${a.email}>` : a.email;
}

function normalizeEmails(arr: EmailAddress[] | undefined): string[] {
  if (!arr) return [];
  return arr.map((a) => a.email.trim().toLowerCase()).filter(Boolean);
}

// =============================================================================
// SendGridClient
// =============================================================================

export class SendGridClient {
  public readonly apiKey: string;
  public readonly mockMode: boolean;

  private readonly apiBase: string;
  private readonly fetchImpl: typeof fetch;
  private readonly timeoutMs: number;
  private readonly maxRetries: number;
  private readonly backoffBaseMs: number;
  private readonly logger: typeof logger;
  private readonly now: () => number;
  private readonly history: EmailResult[] = [];
  private readonly maxHistory = 1000;

  constructor(opts: SendGridClientOptions) {
    if (!opts.apiKey) throw new Error('SendGridClient: apiKey is required');

    this.apiKey = opts.apiKey;
    // API Key 含 "mock" 关键字时自动降级（演示模式）
    this.mockMode = !!opts.mockMode || /mock/i.test(opts.apiKey);
    this.apiBase = (opts.apiBase ?? API_BASE).replace(/\/+$/, '');
    this.fetchImpl = opts.fetchImpl ?? (typeof fetch !== 'undefined' ? fetch : (() => {
      throw new Error('No fetch implementation available');
    })() as typeof fetch);
    this.timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    this.maxRetries = opts.maxRetries ?? DEFAULT_MAX_RETRIES;
    this.backoffBaseMs = opts.backoffBaseMs ?? DEFAULT_BACKOFF_BASE_MS;
    this.logger = opts.logger ?? logger;
    this.now = opts.now ?? (() => Date.now());
  }

  // -------------------------------------------------------------------------
  // 公共 API：send
  // -------------------------------------------------------------------------

  /** 发送单封邮件 */
  async send(message: EmailMessage): Promise<EmailResult> {
    // 必填校验
    if (!message.from?.email) {
      return this.recordResult({
        messageId: '',
        to: normalizeEmails(toArray(message.to)),
        status: 'failed',
        errorCode: 400,
        errorMessage: 'from.email is required',
        sentAt: this.now(),
      });
    }
    if (!message.subject) {
      return this.recordResult({
        messageId: '',
        to: normalizeEmails(toArray(message.to)),
        status: 'failed',
        errorCode: 400,
        errorMessage: 'subject is required',
        sentAt: this.now(),
      });
    }
    if (!message.text || !message.html) {
      return this.recordResult({
        messageId: '',
        to: normalizeEmails(toArray(message.to)),
        status: 'failed',
        errorCode: 400,
        errorMessage: 'text and html are required',
        sentAt: this.now(),
      });
    }
    const toList = toArray(message.to);
    if (toList.length === 0) {
      return this.recordResult({
        messageId: '',
        to: [],
        status: 'failed',
        errorCode: 400,
        errorMessage: 'to is required',
        sentAt: this.now(),
      });
    }

    // Mock 模式
    if (this.mockMode) {
      return this.recordResult(this.buildMockResult(message));
    }

    const body = this.toSendGridBody(message);
    return this.executeWithRetry(
      {
        url: `${this.apiBase}/mail/send`,
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(body),
      },
      message,
    );
  }

  /** 批量发送（并行） */
  async sendBatch(messages: EmailMessage[]): Promise<EmailResult[]> {
    return Promise.all(messages.map((m) => this.send(m)));
  }

  // -------------------------------------------------------------------------
  // 公共 API：Suppression
  // -------------------------------------------------------------------------

  /**
   * 查询抑制列表
   * 端点：GET /v3/suppression/{type}
   *  type: bounces | blocks | spam_reports | unsubscribes
   */
  async getSuppression(
    type: SuppressionType,
    email?: string,
  ): Promise<SuppressionListResponse | SuppressionEntry[]> {
    if (this.mockMode) {
      return email ? [] : [];
    }
    const qs = email ? `?email=${encodeURIComponent(email)}` : '';
    const url = `${this.apiBase}/suppression/${type}${qs}`;
    const resp = await this.requestJson('GET', url);
    return resp as SuppressionListResponse | SuppressionEntry[];
  }

  /**
   * 从抑制列表中删除（允许用户重新接收邮件）
   * 端点：DELETE /v3/suppression/{type}/{email}
   */
  async deleteSuppression(type: SuppressionType, email: string): Promise<void> {
    if (!email) throw new Error('SendGridClient.deleteSuppression: email is required');
    if (this.mockMode) return;
    const url = `${this.apiBase}/suppression/${type}/${encodeURIComponent(email)}`;
    await this.requestRaw('DELETE', url);
  }

  // -------------------------------------------------------------------------
  // 公共 API：Stats
  // -------------------------------------------------------------------------

  /**
   * 查询发送统计
   * 端点：GET /v3/stats?start_date=...&end_date=...&aggregated_by=day
   */
  async getStats(opts: {
    startDate: string;
    endDate: string;
    aggregatedBy?: StatsAggregation;
  }): Promise<EmailStats> {
    if (this.mockMode) {
      return {
        startDate: opts.startDate,
        endDate: opts.endDate,
        aggregatedBy: opts.aggregatedBy,
        metrics: [],
      };
    }
    const params = new URLSearchParams();
    params.set('start_date', opts.startDate);
    params.set('end_date', opts.endDate);
    if (opts.aggregatedBy) params.set('aggregated_by', opts.aggregatedBy);
    const url = `${this.apiBase}/stats?${params.toString()}`;
    const data = await this.requestJson('GET', url);
    return data as EmailStats;
  }

  // -------------------------------------------------------------------------
  // 历史
  // -------------------------------------------------------------------------

  getHistory(limit = 100): EmailResult[] {
    return this.history.slice(-limit);
  }

  // -------------------------------------------------------------------------
  // 内部：转换为 SendGrid v3 body
  // -------------------------------------------------------------------------

  private toSendGridBody(m: EmailMessage): Record<string, unknown> {
    const personalizations: Array<Record<string, unknown>> = [];

    const personalization: Record<string, unknown> = {
      to: toArray(m.to).map((a) => ({ email: a.email, name: a.name })),
    };
    const cc = toArray(m.cc);
    if (cc.length > 0) {
      personalization.cc = cc.map((a) => ({ email: a.email, name: a.name }));
    }
    const bcc = toArray(m.bcc);
    if (bcc.length > 0) {
      personalization.bcc = bcc.map((a) => ({ email: a.email, name: a.name }));
    }
    if (m.headers && Object.keys(m.headers).length > 0) personalization.headers = m.headers;
    if (m.customArgs && Object.keys(m.customArgs).length > 0) personalization.custom_args = m.customArgs;
    if (typeof m.sendAt === 'number') personalization.send_at = Math.floor(m.sendAt / 1000);
    personalizations.push(personalization);

    const body: Record<string, unknown> = {
      personalizations,
      from: { email: m.from.email, name: m.from.name },
      subject: m.subject,
      content: [
        { type: 'text/plain', value: m.text },
        { type: 'text/html', value: m.html },
      ],
    };
    if (m.replyTo) body.reply_to = { email: m.replyTo.email, name: m.replyTo.name };
    if (m.attachments && m.attachments.length > 0) {
      body.attachments = m.attachments.map((a) => ({
        filename: a.filename,
        type: a.type,
        disposition: a.disposition ?? 'attachment',
        content_id: a.contentId,
        content: typeof a.content === 'string'
          ? a.content
          : Buffer.isBuffer(a.content)
            ? a.content.toString('base64')
            : String(a.content),
      }));
    }
    if (m.categories && m.categories.length > 0) body.categories = m.categories;
    if (m.asm) body.asm = { group_id: m.asm.groupId, groups_to_display: m.asm.groupsToDisplay };
    if (m.headers) body.headers = m.headers;

    return body;
  }

  // -------------------------------------------------------------------------
  // 内部：HTTP + 重试
  // -------------------------------------------------------------------------

  private async executeWithRetry(
    req: { url: string; method: string; headers: Record<string, string>; body: string },
    msg: EmailMessage,
  ): Promise<EmailResult> {
    const tos = normalizeEmails(toArray(msg.to));
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

        // 202 Accepted = SendGrid 已接收
        if (resp.status === 202 || (resp.status >= 200 && resp.status < 300)) {
          // SendGrid Mail Send 成功时，message-id 在 x-message-id 头中
          const messageId = resp.headers?.get?.('x-message-id') ?? '';
          return this.recordResult({
            messageId,
            to: tos,
            status: 'queued',
            sentAt: this.now(),
          });
        }

        // 429 限流：尊重 X-RateLimit-Reset
        if (resp.status === 429) {
          const reset = parseRateLimitReset(resp.headers?.get?.('x-ratelimit-reset'));
          const waitMs = reset ?? this.backoff(attempt);
          lastError = new Error(`SendGrid 429 rate limited`);
          this.logger.warn(`[SendGridClient] 429 attempt=${attempt} waitMs=${waitMs} to=${tos.join(',')}`);
          await this.sleep(waitMs);
          continue;
        }

        // 401 立即失败
        if (resp.status === 401) {
          const errText = await safeText(resp);
          return this.recordResult({
            messageId: '',
            to: tos,
            status: 'failed',
            errorCode: 401,
            errorMessage: `[401] ${errText || 'Unauthorized'}`,
            sentAt: this.now(),
          });
        }

        // 5xx：可重试
        if (resp.status >= 500 && resp.status < 600) {
          lastError = new Error(`SendGrid 5xx: ${resp.status}`);
          this.logger.warn(`[SendGridClient] 5xx=${resp.status} attempt=${attempt} to=${tos.join(',')}`);
          await this.sleep(this.backoff(attempt));
          continue;
        }

        // 其它 4xx：不可重试
        const errText = await safeText(resp);
        let errMessage = errText;
        try {
          const parsed = JSON.parse(errText) as { errors?: Array<{ message: string; field?: string }> };
          if (parsed.errors && parsed.errors.length > 0) {
            errMessage = parsed.errors.map((e) => e.message).join('; ');
          }
        } catch {
          // errText 非 JSON，保留原值
        }
        return this.recordResult({
          messageId: '',
          to: tos,
          status: 'failed',
          errorCode: resp.status,
          errorMessage: `[${resp.status}] ${errMessage}`,
          sentAt: this.now(),
        });
      } catch (err) {
        lastError = err as Error;
        this.logger.warn(`[SendGridClient] network error attempt=${attempt} to=${tos.join(',')}: ${lastError.message}`);
        await this.sleep(this.backoff(attempt));
      } finally {
        clearTimeout(timer);
      }
    }

    // 重试耗尽
    return this.recordResult({
      messageId: '',
      to: tos,
      status: 'failed',
      errorCode: -1,
      errorMessage: `SendGrid send failed after ${this.maxRetries + 1} attempts: ${lastError?.message ?? 'unknown'}`,
      sentAt: this.now(),
    });
  }

  private async requestJson(method: string, url: string): Promise<unknown> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const resp = await this.fetchImpl(url, {
        method,
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          Accept: 'application/json',
        },
        signal: controller.signal,
      });
      if (!resp.ok) {
        const errText = await safeText(resp);
        throw new Error(`SendGrid ${method} ${url} failed: ${resp.status} ${errText}`);
      }
      return await resp.json();
    } finally {
      clearTimeout(timer);
    }
  }

  private async requestRaw(method: string, url: string): Promise<void> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const resp = await this.fetchImpl(url, {
        method,
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          Accept: 'application/json',
        },
        signal: controller.signal,
      });
      // 204 No Content / 200 / 202 视为成功
      if (!(resp.status >= 200 && resp.status < 300)) {
        const errText = await safeText(resp);
        throw new Error(`SendGrid ${method} ${url} failed: ${resp.status} ${errText}`);
      }
    } finally {
      clearTimeout(timer);
    }
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

  private recordResult(result: EmailResult): EmailResult {
    this.history.push(result);
    if (this.history.length > this.maxHistory) {
      this.history.splice(0, this.history.length - this.maxHistory);
    }
    return result;
  }

  private buildMockResult(msg: EmailMessage): EmailResult {
    const id = `MOCK${randomHex(24)}`;
    return {
      messageId: id,
      to: normalizeEmails(toArray(msg.to)),
      status: 'queued',
      sentAt: this.now(),
    };
  }
}

// =============================================================================
// 工具函数
// =============================================================================

/**
 * 解析 X-RateLimit-Reset 头
 * SendGrid 语义：该字段是 UTC 0 点到重置时间的秒数
 */
function parseRateLimitReset(raw: string | null | undefined): number | null {
  if (!raw) return null;
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) return null;
  // 当前距离 0 点的秒数 + 重置秒数 = 等待秒数
  const nowSec = Math.floor(Date.now() / 1000);
  const nowOfDay = nowSec % 86400;
  let waitSec = n - nowOfDay;
  if (waitSec < 0) waitSec += 86400; // 跨天
  if (waitSec > 60) waitSec = 60; // 最多等 60s，避免卡死
  return waitSec * 1000;
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

export function createSendGridClient(opts: SendGridClientOptions): SendGridClient {
  return new SendGridClient(opts);
}

export default SendGridClient;

// 复用：toArray 与 toEmailString
export { toArray, toEmailString, normalizeEmails };
