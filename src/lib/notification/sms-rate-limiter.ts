/**
 * 短信发送频率限制器（SmsRateLimiter）
 *
 * 职责：
 *  - 内存滑动窗口，按多维度计数
 *  - 规则：
 *      同一手机号 1 分钟内最多 1 条
 *      同一手机号 1 小时内最多 5 条
 *      同一手机号 1 天内最多 15 条
 *      同一 IP 1 小时内最多 20 条
 *      全局 1 秒内最多 100 条
 *  - 提供 check(phone, ip) → { allowed, retryAfterMs?, violation? }
 *  - 提供 reset(phone?) 用于测试
 *
 * 提示：
 *  - 当前为单实例内存实现；多实例部署请替换为 Redis 滑动窗口
 *  - 旧的记录会按需 lazy trim（避免长跑内存膨胀）
 */

import { logger } from '../logger';

// =============================================================================
// 公共类型 & 常量
// =============================================================================

export const RATE_LIMITS = {
  perPhonePerMinute: 1,
  perPhonePerHour: 5,
  perPhonePerDay: 15,
  perIpPerHour: 20,
  globalPerSecond: 100,
} as const;

export type RateLimitKey =
  | 'phone_minute'
  | 'phone_hour'
  | 'phone_day'
  | 'ip_hour'
  | 'global_second';

export interface RateLimitCheckResult {
  allowed: boolean;
  /** 当 allowed=false 时，剩余冷却时间（ms） */
  retryAfterMs?: number;
  /** 当 allowed=false 时，违反的规则 */
  violation?: RateLimitKey;
  /** 当前规则触发时的窗口剩余额度（用于埋点） */
  remaining?: number;
}

export interface RateLimitRule {
  key: RateLimitKey;
  /** 窗口长度（ms） */
  windowMs: number;
  /** 窗口内最大允许数 */
  max: number;
}

export interface SmsRateLimiterOptions {
  /** 自定义规则；不传则使用 RATE_LIMITS 默认值 */
  rules?: Partial<Record<RateLimitKey, { windowMs: number; max: number }>>;
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

  /** 添加事件，返回当前窗口内的总计数 */
  add(t: number, trim: boolean): number {
    if (trim) this.trim(t);
    this.events.push(t);
    return this.events.length;
  }

  /** 当前窗口内的事件数（不添加） */
  count(t: number, trim: boolean): number {
    if (trim) this.trim(t);
    return this.events.length;
  }

  /** 最早的过期时间戳 */
  oldestExpiry(t: number, trim: boolean): number {
    if (trim) this.trim(t);
    if (this.events.length === 0) return 0;
    return this.events[0] + this.windowMs;
  }

  /** 清空 */
  clear(): void {
    this.events.length = 0;
  }

  private trim(t: number): void {
    const cutoff = t - this.windowMs;
    // 找到第一个 > cutoff 的位置
    let i = 0;
    while (i < this.events.length && this.events[i] <= cutoff) i++;
    if (i > 0) this.events.splice(0, i);
  }
}

// =============================================================================
// SmsRateLimiter
// =============================================================================

export class SmsRateLimiter {
  private readonly rules: Record<RateLimitKey, RateLimitRule>;
  private readonly windows: Map<string, SlidingWindow> = new Map();
  private readonly lazyTrim: boolean;
  private readonly logger: typeof logger;
  private readonly now: () => number;

  constructor(opts: SmsRateLimiterOptions = {}) {
    this.lazyTrim = opts.lazyTrim !== false;
    this.logger = opts.logger ?? logger;
    this.now = opts.now ?? (() => Date.now());

    this.rules = {
      phone_minute: {
        key: 'phone_minute',
        windowMs: 60_000,
        max: RATE_LIMITS.perPhonePerMinute,
        ...(opts.rules?.phone_minute ?? {}),
      },
      phone_hour: {
        key: 'phone_hour',
        windowMs: 60 * 60_000,
        max: RATE_LIMITS.perPhonePerHour,
        ...(opts.rules?.phone_hour ?? {}),
      },
      phone_day: {
        key: 'phone_day',
        windowMs: 24 * 60 * 60_000,
        max: RATE_LIMITS.perPhonePerDay,
        ...(opts.rules?.phone_day ?? {}),
      },
      ip_hour: {
        key: 'ip_hour',
        windowMs: 60 * 60_000,
        max: RATE_LIMITS.perIpPerHour,
        ...(opts.rules?.ip_hour ?? {}),
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
  check(phone: string | undefined, ip: string | undefined): RateLimitCheckResult {
    return this.checkInternal(phone, ip, false);
  }

  /**
   * 预检 + 扣减：检查通过后立即在所有相关窗口里记录一次
   */
  checkAndConsume(phone: string | undefined, ip: string | undefined): RateLimitCheckResult {
    return this.checkInternal(phone, ip, true);
  }

  // -------------------------------------------------------------------------
  // 显式扣减（不预检）
  // -------------------------------------------------------------------------

  record(phone: string | undefined, ip: string | undefined): void {
    const t = this.now();
    if (phone) {
      this.getWindow(`phone:${phone}:${this.rules.phone_minute.key}`).add(t, this.lazyTrim);
      this.getWindow(`phone:${phone}:${this.rules.phone_hour.key}`).add(t, this.lazyTrim);
      this.getWindow(`phone:${phone}:${this.rules.phone_day.key}`).add(t, this.lazyTrim);
    }
    if (ip) {
      this.getWindow(`ip:${ip}:${this.rules.ip_hour.key}`).add(t, this.lazyTrim);
    }
    this.getWindow(`global:${this.rules.global_second.key}`).add(t, this.lazyTrim);
  }

  // -------------------------------------------------------------------------
  // 重置（测试 / 维护）
  // -------------------------------------------------------------------------

  /** 重置全部或单个 phone 的窗口 */
  reset(phone?: string): void {
    if (!phone) {
      this.windows.clear();
      return;
    }
    for (const k of Array.from(this.windows.keys())) {
      if (k.startsWith(`phone:${phone}:`)) this.windows.delete(k);
    }
  }

  /** 当前所有窗口条目数（用于监控） */
  size(): number {
    return this.windows.size;
  }

  // -------------------------------------------------------------------------
  // 规则查询
  // -------------------------------------------------------------------------

  getRule(key: RateLimitKey): RateLimitRule {
    return { ...this.rules[key] };
  }

  listRules(): RateLimitRule[] {
    return Object.values(this.rules).map((r) => ({ ...r }));
  }

  // -------------------------------------------------------------------------
  // 内部
  // -------------------------------------------------------------------------

  private checkInternal(
    phone: string | undefined,
    ip: string | undefined,
    consume: boolean,
  ): RateLimitCheckResult {
    const t = this.now();
    // 维度优先级：phone_minute > phone_hour > phone_day > ip_hour > global_second
    const checks: Array<{ rule: RateLimitRule; key: string }> = [];
    if (phone) {
      checks.push({ rule: this.rules.phone_minute, key: `phone:${phone}:${this.rules.phone_minute.key}` });
      checks.push({ rule: this.rules.phone_hour, key: `phone:${phone}:${this.rules.phone_hour.key}` });
      checks.push({ rule: this.rules.phone_day, key: `phone:${phone}:${this.rules.phone_day.key}` });
    }
    if (ip) {
      checks.push({ rule: this.rules.ip_hour, key: `ip:${ip}:${this.rules.ip_hour.key}` });
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
      // 全部通过，逐个 add
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
      // 默认窗口大小没关系，会被 setWindow 调整
      w = new SlidingWindow(60_000);
      // 解析 key 中携带的 windowMs 信息
      const parts = key.split(':');
      const ruleKey = parts[parts.length - 1] as RateLimitKey;
      w.setWindow(this.rules[ruleKey].windowMs);
      this.windows.set(key, w);
    }
    return w;
  }
}

// =============================================================================
// 工厂
// =============================================================================

export function createSmsRateLimiter(opts?: SmsRateLimiterOptions): SmsRateLimiter {
  return new SmsRateLimiter(opts);
}

export default SmsRateLimiter;
