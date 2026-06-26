/**
 * 邮件发送频率限制器（EmailRateLimiter）
 *
 * 职责：
 *  - 内存滑动窗口，按 5 维度计数
 *  - 规则：
 *      同邮箱 1 分钟内最多 1 条
 *      同邮箱 1 小时内最多 5 条
 *      同邮箱 1 天内最多 10 条
 *      同用户 1 天内最多 20 条
 *      全局 1 秒内最多 50 条
 *  - 提供 check(email, userId) → { allowed, retryAfterMs?, violation? }
 *  - 提供 reset(email?) 用于测试
 *
 * 提示：
 *  - 当前为单实例内存实现；多实例部署请替换为 Redis 滑动窗口
 *  - 旧的记录会按需 lazy trim（避免长跑内存膨胀）
 */

import { logger } from '../../logger';

// =============================================================================
// 公共类型 & 常量
// =============================================================================

export const RATE_LIMITS = {
  perEmailPerMinute: 1,
  perEmailPerHour: 5,
  perEmailPerDay: 10,
  perUserPerDay: 20,
  globalPerSecond: 50,
} as const;

export type EmailRateLimitKey =
  | 'email_minute'
  | 'email_hour'
  | 'email_day'
  | 'user_day'
  | 'global_second';

export interface EmailRateLimitCheckResult {
  allowed: boolean;
  /** 当 allowed=false 时，剩余冷却时间（ms） */
  retryAfterMs?: number;
  /** 当 allowed=false 时，违反的规则 */
  violation?: EmailRateLimitKey;
  /** 当前规则触发时的窗口剩余额度（用于埋点） */
  remaining?: number;
}

export interface EmailRateLimitRule {
  key: EmailRateLimitKey;
  /** 窗口长度（ms） */
  windowMs: number;
  /** 窗口内最大允许数 */
  max: number;
}

export interface EmailRateLimiterOptions {
  /** 自定义规则；不传则使用 RATE_LIMITS 默认值 */
  rules?: Partial<Record<EmailRateLimitKey, { windowMs: number; max: number }>>;
  /** 时钟注入（便于测试） */
  now?: () => number;
  /** logger */
  logger?: typeof logger;
  /** 是否懒清理（默认 true） */
  lazyTrim?: boolean;
}

// =============================================================================
// 内部：滑动窗口实现
// =============================================================================

class SlidingWindow {
  private readonly events: number[] = [];
  private windowMs: number;

  constructor(windowMs: number) {
    this.windowMs = windowMs;
  }

  setWindow(windowMs: number) {
    this.windowMs = windowMs;
  }

  add(t: number, trim: boolean): number {
    if (trim) this.trim(t);
    this.events.push(t);
    return this.events.length;
  }

  count(t: number, trim: boolean): number {
    if (trim) this.trim(t);
    return this.events.length;
  }

  oldestExpiry(t: number, trim: boolean): number {
    if (trim) this.trim(t);
    if (this.events.length === 0) return 0;
    return this.events[0] + this.windowMs;
  }

  clear(): void {
    this.events.length = 0;
  }

  private trim(t: number): void {
    const cutoff = t - this.windowMs;
    let i = 0;
    while (i < this.events.length && this.events[i] <= cutoff) i++;
    if (i > 0) this.events.splice(0, i);
  }
}

// =============================================================================
// EmailRateLimiter
// =============================================================================

export class EmailRateLimiter {
  private readonly rules: Record<EmailRateLimitKey, EmailRateLimitRule>;
  private readonly windows: Map<string, SlidingWindow> = new Map();
  private readonly lazyTrim: boolean;
  private readonly logger: typeof logger;
  private readonly now: () => number;

  constructor(opts: EmailRateLimiterOptions = {}) {
    this.lazyTrim = opts.lazyTrim !== false;
    this.logger = opts.logger ?? logger;
    this.now = opts.now ?? (() => Date.now());

    this.rules = {
      email_minute: {
        key: 'email_minute',
        windowMs: 60_000,
        max: RATE_LIMITS.perEmailPerMinute,
        ...(opts.rules?.email_minute ?? {}),
      },
      email_hour: {
        key: 'email_hour',
        windowMs: 60 * 60_000,
        max: RATE_LIMITS.perEmailPerHour,
        ...(opts.rules?.email_hour ?? {}),
      },
      email_day: {
        key: 'email_day',
        windowMs: 24 * 60 * 60_000,
        max: RATE_LIMITS.perEmailPerDay,
        ...(opts.rules?.email_day ?? {}),
      },
      user_day: {
        key: 'user_day',
        windowMs: 24 * 60 * 60_000,
        max: RATE_LIMITS.perUserPerDay,
        ...(opts.rules?.user_day ?? {}),
      },
      global_second: {
        key: 'global_second',
        windowMs: 1_000,
        max: RATE_LIMITS.globalPerSecond,
        ...(opts.rules?.global_second ?? {}),
      },
    };
  }

  // -------------------------------------------------------------------------
  // 主入口
  // -------------------------------------------------------------------------

  /**
   * 预检：是否允许发送？
   * 注意：本方法不会扣减额度（用 checkAndConsume 才会扣减）
   */
  check(email: string | undefined, userId: string | undefined): EmailRateLimitCheckResult {
    return this.checkInternal(email, userId, false);
  }

  /**
   * 预检 + 扣减：检查通过后立即在所有相关窗口里记录一次
   */
  checkAndConsume(email: string | undefined, userId: string | undefined): EmailRateLimitCheckResult {
    return this.checkInternal(email, userId, true);
  }

  // -------------------------------------------------------------------------
  // 显式扣减（不预检）
  // -------------------------------------------------------------------------

  record(email: string | undefined, userId: string | undefined): void {
    const t = this.now();
    if (email) {
      this.getWindow(`email:${email}:${this.rules.email_minute.key}`).add(t, this.lazyTrim);
      this.getWindow(`email:${email}:${this.rules.email_hour.key}`).add(t, this.lazyTrim);
      this.getWindow(`email:${email}:${this.rules.email_day.key}`).add(t, this.lazyTrim);
    }
    if (userId) {
      this.getWindow(`user:${userId}:${this.rules.user_day.key}`).add(t, this.lazyTrim);
    }
    this.getWindow(`global:${this.rules.global_second.key}`).add(t, this.lazyTrim);
  }

  // -------------------------------------------------------------------------
  // 重置（测试 / 维护）
  // -------------------------------------------------------------------------

  /** 重置全部或单个 email / userId 的窗口 */
  reset(email?: string, userId?: string): void {
    if (!email && !userId) {
      this.windows.clear();
      return;
    }
    for (const k of Array.from(this.windows.keys())) {
      if (email && k.startsWith(`email:${email}:`)) this.windows.delete(k);
      if (userId && k.startsWith(`user:${userId}:`)) this.windows.delete(k);
    }
  }

  /** 当前所有窗口条目数（用于监控） */
  size(): number {
    return this.windows.size;
  }

  // -------------------------------------------------------------------------
  // 规则查询
  // -------------------------------------------------------------------------

  getRule(key: EmailRateLimitKey): EmailRateLimitRule {
    return { ...this.rules[key] };
  }

  listRules(): EmailRateLimitRule[] {
    return Object.values(this.rules).map((r) => ({ ...r }));
  }

  // -------------------------------------------------------------------------
  // 内部
  // -------------------------------------------------------------------------

  private checkInternal(
    email: string | undefined,
    userId: string | undefined,
    consume: boolean,
  ): EmailRateLimitCheckResult {
    const t = this.now();
    // 维度优先级：email_minute > email_hour > email_day > user_day > global_second
    const checks: Array<{ rule: EmailRateLimitRule; key: string }> = [];
    if (email) {
      checks.push({ rule: this.rules.email_minute, key: `email:${email}:${this.rules.email_minute.key}` });
      checks.push({ rule: this.rules.email_hour, key: `email:${email}:${this.rules.email_hour.key}` });
      checks.push({ rule: this.rules.email_day, key: `email:${email}:${this.rules.email_day.key}` });
    }
    if (userId) {
      checks.push({ rule: this.rules.user_day, key: `user:${userId}:${this.rules.user_day.key}` });
    }
    checks.push({ rule: this.rules.global_second, key: `global:${this.rules.global_second.key}` });

    for (const { rule, key } of checks) {
      const w = this.getWindow(key);
      const current = w.count(t, this.lazyTrim);
      if (current >= rule.max) {
        const expiry = w.oldestExpiry(t, this.lazyTrim);
        const retryAfterMs = Math.max(0, expiry - t);
        return {
          allowed: false,
          violation: rule.key,
          retryAfterMs,
          remaining: 0,
        };
      }
    }

    if (consume) {
      for (const { rule, key } of checks) {
        this.getWindow(key).add(t, this.lazyTrim);
      }
    }

    // 计算剩余额度（最严格的维度）
    const minRemaining = checks.reduce((min, { rule, key }) => {
      const w = this.getWindow(key);
      return Math.min(min, rule.max - w.count(t, this.lazyTrim));
    }, Number.MAX_SAFE_INTEGER);

    return {
      allowed: true,
      remaining: Number.isFinite(minRemaining) ? minRemaining : 0,
    };
  }

  private getWindow(key: string): SlidingWindow {
    let w = this.windows.get(key);
    if (!w) {
      w = new SlidingWindow(60_000);
      const parts = key.split(':');
      const ruleKey = parts[parts.length - 1] as EmailRateLimitKey;
      w.setWindow(this.rules[ruleKey].windowMs);
      this.windows.set(key, w);
    }
    return w;
  }
}

// =============================================================================
// 工厂
// =============================================================================

export function createEmailRateLimiter(opts?: EmailRateLimiterOptions): EmailRateLimiter {
  return new EmailRateLimiter(opts);
}

export default EmailRateLimiter;
