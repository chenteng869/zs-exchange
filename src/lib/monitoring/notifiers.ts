/**
 * 告警通知器（Notifiers）
 *
 * 内置实现：
 *  - ConsoleNotifier：彩色输出到 stdout/stderr
 *  - LogNotifier：调用项目 logger
 *  - WebhookNotifier：POST 到企业微信 / 钉钉 / Slack / 自定义
 *  - MultiNotifier：聚合多个 notifier
 *
 * 使用：
 *   const notifier = new MultiNotifier([
 *     new ConsoleNotifier(),
 *     new WebhookNotifier({ url: 'https://oapi.dingtalk.com/robot/send?access_token=xxx' }),
 *   ]);
 *   await notifier.notify(alert);
 */

import type { Alert, AlertSeverity, AlertStatus } from './alert-engine';

// =============================================================================
// 公共接口
// =============================================================================

export interface AlertNotifier {
  /** 通知器名称（用于 MultiNotifier 日志） */
  name: string;
  /** 发送告警通知 */
  notify(alert: Alert): Promise<void> | void;
}

// =============================================================================
// ConsoleNotifier
// =============================================================================

const SEVERITY_COLOR: Record<AlertSeverity, string> = {
  P0: '\x1b[41m\x1b[37m', // 红底白字
  P1: '\x1b[31m',         // 红字
  P2: '\x1b[33m',         // 黄字
  P3: '\x1b[36m',         // 青字
};

const STATUS_COLOR: Record<AlertStatus, string> = {
  firing: '\x1b[1m\x1b[31m',
  resolved: '\x1b[1m\x1b[32m',
  pending: '\x1b[1m\x1b[33m',
};

const RESET = '\x1b[0m';

export class ConsoleNotifier implements AlertNotifier {
  public readonly name = 'console';
  /** 是否启用颜色（默认自动检测） */
  public readonly color: boolean;
  /** 自定义输出流（默认 console.log/error） */
  public readonly stdout: (line: string) => void;
  public readonly stderr: (line: string) => void;

  constructor(opts: { color?: boolean; stdout?: (line: string) => void; stderr?: (line: string) => void } = {}) {
    this.color = opts.color ?? (typeof process !== 'undefined' && process.stdout && (process.stdout as any).isTTY === true);
    this.stdout = opts.stdout ?? ((line) => process.stdout.write(line + '\n'));
    this.stderr = opts.stderr ?? ((line) => process.stderr.write(line + '\n'));
  }

  notify(alert: Alert): void {
    const c = this.color;
    const sev = c ? SEVERITY_COLOR[alert.severity] : '';
    const sta = c ? STATUS_COLOR[alert.status] : '';
    const r = c ? RESET : '';
    const time = new Date(alert.firedAt).toISOString();
    const resolvedAt = alert.resolvedAt ? new Date(alert.resolvedAt).toISOString() : '';
    const ctxJson = Object.keys(alert.context).length > 0 ? ` ${JSON.stringify(alert.context)}` : '';
    const line = `${r}[${time}] ${sev}[${alert.severity}]${r} ${sta}${alert.status.toUpperCase()}${r} ` +
      `${alert.rule} - ${alert.message}${ctxJson}${resolvedAt ? ` (resolved: ${resolvedAt})` : ''}`;
    if (alert.status === 'firing' && (alert.severity === 'P0' || alert.severity === 'P1')) {
      this.stderr(line);
    } else {
      this.stdout(line);
    }
  }
}

// =============================================================================
// LogNotifier
// =============================================================================

/** logger 接口（与 src/lib/logger.ts 保持一致） */
export interface LoggerLike {
  debug: (...args: unknown[]) => void;
  info: (...args: unknown[]) => void;
  warn: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
}

/** 缺省 logger 兜底：当未提供 logger 时使用 console */
const defaultLogger: LoggerLike = {
  debug: (...args) => console.debug(...args),
  info: (...args) => console.info(...args),
  warn: (...args) => console.warn(...args),
  error: (...args) => console.error(...args),
};

export class LogNotifier implements AlertNotifier {
  public readonly name = 'log';
  private readonly logger: LoggerLike;

  constructor(opts: { logger?: LoggerLike } = {}) {
    this.logger = opts.logger ?? defaultLogger;
  }

  notify(alert: Alert): void {
    const payload = {
      rule: alert.rule,
      severity: alert.severity,
      status: alert.status,
      message: alert.message,
      context: alert.context,
      firedAt: new Date(alert.firedAt).toISOString(),
      resolvedAt: alert.resolvedAt ? new Date(alert.resolvedAt).toISOString() : undefined,
    };
    const line = `[alert] ${JSON.stringify(payload)}`;
    if (alert.status === 'resolved') {
      this.logger.info(line);
    } else if (alert.severity === 'P0' || alert.severity === 'P1') {
      this.logger.error(line);
    } else {
      this.logger.warn(line);
    }
  }
}

// =============================================================================
// WebhookNotifier
// =============================================================================

export type WebhookFormat = 'generic' | 'wecom' | 'dingtalk' | 'slack' | 'lark';

export interface WebhookNotifierOptions {
  /** Webhook URL */
  url: string;
  /** 消息格式（默认 generic） */
  format?: WebhookFormat;
  /** 自定义 fetch 实现（用于测试或 SSR） */
  fetchImpl?: typeof fetch;
  /** 请求超时（ms），默认 5_000 */
  timeoutMs?: number;
  /** 自定义转换函数（最高优先级） */
  transform?: (alert: Alert) => unknown;
  /** 自定义 HTTP 头 */
  headers?: Record<string, string>;
  /** 仅发送满足最低严重等级的告警 */
  minSeverity?: AlertSeverity;
}

const SEVERITY_RANK: Record<AlertSeverity, number> = { P0: 0, P1: 1, P2: 2, P3: 3 };

export class WebhookNotifier implements AlertNotifier {
  public readonly name = 'webhook';
  private readonly url: string;
  private readonly format: WebhookFormat;
  private readonly fetchImpl: typeof fetch;
  private readonly timeoutMs: number;
  private readonly transform?: (alert: Alert) => unknown;
  private readonly headers: Record<string, string>;
  private readonly minSeverity?: AlertSeverity;

  constructor(opts: WebhookNotifierOptions) {
    this.url = opts.url;
    this.format = opts.format ?? 'generic';
    this.fetchImpl = opts.fetchImpl ?? (typeof fetch !== 'undefined' ? fetch : (() => {
      throw new Error('No fetch implementation available');
    })() as typeof fetch);
    this.timeoutMs = opts.timeoutMs ?? 5_000;
    this.transform = opts.transform;
    this.headers = opts.headers ?? {};
    this.minSeverity = opts.minSeverity;
  }

  async notify(alert: Alert): Promise<void> {
    if (this.minSeverity && SEVERITY_RANK[alert.severity] > SEVERITY_RANK[this.minSeverity]) {
      return;
    }
    const body = this.buildBody(alert);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      await this.fetchImpl(this.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...this.headers },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
    } catch (err) {
      // 静默失败：webhook 失败不应中断其他通知器
      // eslint-disable-next-line no-console
      console.error(`[WebhookNotifier] ${this.url} failed:`, (err as Error).message);
    } finally {
      clearTimeout(timer);
    }
  }

  private buildBody(alert: Alert): unknown {
    if (this.transform) return this.transform(alert);
    const text = `[${alert.severity}] ${alert.status.toUpperCase()} ${alert.rule} - ${alert.message}`;
    switch (this.format) {
      case 'wecom':
        return {
          msgtype: 'markdown',
          markdown: {
            content: `## ${text}\n` +
              `> 触发时间: ${new Date(alert.firedAt).toISOString()}\n` +
              (alert.resolvedAt ? `> 恢复时间: ${new Date(alert.resolvedAt).toISOString()}\n` : '') +
              (Object.keys(alert.context).length > 0 ? `> 上下文: \`${JSON.stringify(alert.context)}\`\n` : ''),
          },
        };
      case 'dingtalk':
        return {
          msgtype: 'markdown',
          markdown: {
            title: `Alert ${alert.severity}`,
            text: `## ${text}\n` +
              `**触发**: ${new Date(alert.firedAt).toISOString()}\n` +
              (alert.resolvedAt ? `**恢复**: ${new Date(alert.resolvedAt).toISOString()}\n` : '') +
              (Object.keys(alert.context).length > 0 ? `**上下文**: ${JSON.stringify(alert.context)}\n` : ''),
          },
        };
      case 'slack':
        return {
          text,
          attachments: [{
            color: alert.severity === 'P0' ? 'danger' : alert.severity === 'P1' ? 'warning' : 'good',
            fields: [
              { title: 'Rule', value: alert.rule, short: true },
              { title: 'Status', value: alert.status, short: true },
              { title: 'Fired At', value: new Date(alert.firedAt).toISOString(), short: false },
              ...(alert.resolvedAt ? [{ title: 'Resolved At', value: new Date(alert.resolvedAt).toISOString(), short: false }] : []),
            ],
          }],
        };
      case 'lark':
        return {
          msg_type: 'interactive',
          card: {
            header: { title: { tag: 'plain_text', content: `[${alert.severity}] ${alert.rule}` } },
            elements: [
              { tag: 'div', text: { tag: 'lark_md', content: `**${text}**` } },
              { tag: 'div', text: { tag: 'lark_md', content: `**触发时间**: ${new Date(alert.firedAt).toISOString()}` } },
              ...(alert.resolvedAt ? [{ tag: 'div', text: { tag: 'lark_md', content: `**恢复时间**: ${new Date(alert.resolvedAt).toISOString()}` } }] : []),
              ...(Object.keys(alert.context).length > 0
                ? [{ tag: 'div', text: { tag: 'lark_md', content: `**上下文**: ${JSON.stringify(alert.context)}` } }]
                : []),
            ],
          },
        };
      case 'generic':
      default:
        return { ...alert, firedAtIso: new Date(alert.firedAt).toISOString() };
    }
  }
}

// =============================================================================
// MultiNotifier
// =============================================================================

export class MultiNotifier implements AlertNotifier {
  public readonly name: string;
  private readonly notifiers: AlertNotifier[];

  constructor(notifiers: AlertNotifier[] = [], name = 'multi') {
    this.notifiers = notifiers.slice();
    this.name = name;
  }

  add(notifier: AlertNotifier): void {
    this.notifiers.push(notifier);
  }

  size(): number {
    return this.notifiers.length;
  }

  async notify(alert: Alert): Promise<void> {
    const results = await Promise.allSettled(
      this.notifiers.map(async (n) => {
        try {
          await n.notify(alert);
        } catch (err) {
          // 单个 notifier 失败不应中断其他
          // eslint-disable-next-line no-console
          console.error(`[MultiNotifier] ${n.name} failed:`, (err as Error).message);
        }
      }),
    );
    // 静默忽略 rejected
    void results;
  }
}

// =============================================================================
// 工厂函数
// =============================================================================

export function createConsoleNotifier(opts?: ConstructorParameters<typeof ConsoleNotifier>[0]): ConsoleNotifier {
  return new ConsoleNotifier(opts);
}

export function createLogNotifier(opts?: ConstructorParameters<typeof LogNotifier>[0]): LogNotifier {
  return new LogNotifier(opts);
}

export function createWebhookNotifier(opts: WebhookNotifierOptions): WebhookNotifier {
  return new WebhookNotifier(opts);
}
