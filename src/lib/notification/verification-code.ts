/**
 * 验证码服务（VerificationCodeService）
 *
 * 职责：
 *  - 生成 N 位数字验证码（默认 6）
 *  - 内存存储：id → VerificationCode
 *  - 过期校验（默认 5 分钟）
 *  - 尝试次数限制（默认 5 次，防爆破）
 *  - 一次性使用（校验后立即失效，防重放）
 *  - 显式失效接口
 *
 * 用法：
 *   const svc = new VerificationCodeService();
 *   const { codeId, expiresAt } = await svc.requestCode({ phone: '+8613800138000', purpose: 'login' });
 *   const r = await svc.verifyCode({ codeId, code: '123456', purpose: 'login' });
 *
 * 安全说明：
 *  - 内存存储仅用于单实例部署；生产环境建议改为 Redis 等共享存储
 *  - 默认 TTL 较短，5 次错误后强制失效，必须重新申请
 */

import { logger } from '../logger';

// =============================================================================
// 公共类型
// =============================================================================

export type SmsPurpose =
  | 'login'
  | 'register'
  | 'withdraw'
  | 'security'
  | 'change_password'
  | 'bind_phone';

export interface VerificationCode {
  id: string;
  phone: string;
  purpose: SmsPurpose;
  code: string;
  createdAt: number;
  expiresAt: number;
  attempts: number;
  maxAttempts: number;
  used: boolean;
}

export interface RequestCodeOptions {
  phone: string;
  purpose: SmsPurpose;
  /** 验证码长度，默认 6 */
  length?: number;
  /** 覆盖默认 TTL（ms） */
  ttlMs?: number;
  /** 覆盖默认 max attempts */
  maxAttempts?: number;
  /** 注入 code（用于测试）；不传则随机生成 */
  code?: string;
}

export interface VerifyCodeOptions {
  codeId: string;
  code: string;
  purpose: SmsPurpose;
}

export interface VerifyCodeResult {
  valid: boolean;
  reason?: 'not_found' | 'expired' | 'max_attempts' | 'mismatch' | 'wrong_purpose' | 'used';
}

export interface RequestCodeResult {
  codeId: string;
  expiresAt: number;
}

// =============================================================================
// 关键常量
// =============================================================================

export const VERIFICATION_CODE_LENGTH = 6;
export const VERIFICATION_CODE_TTL_MS = 5 * 60 * 1000; // 5 分钟
export const VERIFICATION_CODE_MAX_ATTEMPTS = 5;

// =============================================================================
// VerificationCodeService
// =============================================================================

export class VerificationCodeService {
  private readonly codes: Map<string, VerificationCode> = new Map();
  private readonly defaultLength: number;
  private readonly defaultTtlMs: number;
  private readonly defaultMaxAttempts: number;
  private readonly logger: typeof logger;
  private readonly now: () => number;
  private readonly idGenerator: () => string;
  private readonly codeGenerator: (length: number) => string;
  /** 同一 phone + purpose 仅保留最新一未过期 code（避免堆积） */
  private readonly replaceExisting: boolean;

  constructor(opts: {
    defaultLength?: number;
    defaultTtlMs?: number;
    defaultMaxAttempts?: number;
    logger?: typeof logger;
    now?: () => number;
    idGenerator?: () => string;
    codeGenerator?: (length: number) => string;
    replaceExisting?: boolean;
  } = {}) {
    this.defaultLength = opts.defaultLength ?? VERIFICATION_CODE_LENGTH;
    this.defaultTtlMs = opts.defaultTtlMs ?? VERIFICATION_CODE_TTL_MS;
    this.defaultMaxAttempts = opts.defaultMaxAttempts ?? VERIFICATION_CODE_MAX_ATTEMPTS;
    this.logger = opts.logger ?? logger;
    this.now = opts.now ?? (() => Date.now());
    this.idGenerator = opts.idGenerator ?? (() => randomHex(16));
    this.codeGenerator = opts.codeGenerator ?? defaultCodeGenerator;
    this.replaceExisting = opts.replaceExisting ?? true;
  }

  // -------------------------------------------------------------------------
  // 申请验证码
  // -------------------------------------------------------------------------

  requestCode(opts: RequestCodeOptions): RequestCodeResult {
    const length = opts.length ?? this.defaultLength;
    const ttlMs = opts.ttlMs ?? this.defaultTtlMs;
    const maxAttempts = opts.maxAttempts ?? this.defaultMaxAttempts;

    const code = opts.code ?? this.codeGenerator(length);
    if (!new RegExp(`^\\d{${length}}$`).test(code)) {
      throw new Error(`VerificationCodeService: code must be ${length} digits`);
    }

    const now = this.now();
    const id = this.idGenerator();

    // 同一 phone + purpose 仅保留最新一未过期 code
    if (this.replaceExisting) {
      for (const [key, vc] of this.codes) {
        if (vc.phone === opts.phone && vc.purpose === opts.purpose && !vc.used && vc.expiresAt > now) {
          this.codes.delete(key);
        }
      }
    }

    const record: VerificationCode = {
      id,
      phone: opts.phone,
      purpose: opts.purpose,
      code,
      createdAt: now,
      expiresAt: now + ttlMs,
      attempts: 0,
      maxAttempts,
      used: false,
    };
    this.codes.set(id, record);

    this.logger.info(`[VerificationCodeService] issued code id=${id} phone=${maskPhone(opts.phone)} purpose=${opts.purpose} ttl=${ttlMs}ms`);

    return { codeId: id, expiresAt: record.expiresAt };
  }

  // -------------------------------------------------------------------------
  // 校验验证码
  // -------------------------------------------------------------------------

  verifyCode(opts: VerifyCodeOptions): VerifyCodeResult {
    const record = this.codes.get(opts.codeId);
    if (!record) {
      return { valid: false, reason: 'not_found' };
    }
    if (record.used) {
      return { valid: false, reason: 'used' };
    }
    if (record.purpose !== opts.purpose) {
      return { valid: false, reason: 'wrong_purpose' };
    }
    const now = this.now();
    if (record.expiresAt <= now) {
      // 过期：主动失效
      record.used = true;
      return { valid: false, reason: 'expired' };
    }
    if (record.attempts >= record.maxAttempts) {
      record.used = true;
      return { valid: false, reason: 'max_attempts' };
    }
    record.attempts += 1;

    if (record.code !== opts.code) {
      // 错误：达到上限则强制失效
      if (record.attempts >= record.maxAttempts) {
        record.used = true;
        return { valid: false, reason: 'max_attempts' };
      }
      return { valid: false, reason: 'mismatch' };
    }

    // 校验成功：立即失效（防重放）
    record.used = true;
    return { valid: true };
  }

  // -------------------------------------------------------------------------
  // 显式失效
  // -------------------------------------------------------------------------

  invalidateCode(codeId: string): boolean {
    const record = this.codes.get(codeId);
    if (!record) return false;
    record.used = true;
    return true;
  }

  // -------------------------------------------------------------------------
  // 查询（仅供测试 / 调试）
  // -------------------------------------------------------------------------

  getCode(codeId: string): VerificationCode | undefined {
    const r = this.codes.get(codeId);
    return r ? { ...r } : undefined;
  }

  size(): number {
    return this.codes.size;
  }

  /** 清空所有验证码（用于测试） */
  clear(): void {
    this.codes.clear();
  }

  /** 清理已失效 / 过期的记录 */
  cleanup(): number {
    const now = this.now();
    let removed = 0;
    for (const [k, v] of this.codes) {
      if (v.used || v.expiresAt <= now) {
        this.codes.delete(k);
        removed++;
      }
    }
    return removed;
  }
}

// =============================================================================
// 工具函数
// =============================================================================

function defaultCodeGenerator(length: number): string {
  const max = Math.pow(10, length);
  return String(Math.floor(Math.random() * max)).padStart(length, '0');
}

function randomHex(len: number): string {
  const chars = '0123456789abcdef';
  let out = '';
  for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * 16)];
  return out;
}

/** 手机号脱敏：+8613800138000 → +86****1380000 */
export function maskPhone(phone: string): string {
  if (!phone || phone.length < 7) return phone;
  if (phone.startsWith('+')) {
    const cc = phone.slice(0, 3); // 假设 +CC 是 1~3 位
    const rest = phone.slice(3);
    if (rest.length <= 4) return phone;
    return `${cc}****${rest.slice(-4)}`;
  }
  if (phone.length <= 7) return phone;
  return `****${phone.slice(-4)}`;
}

// =============================================================================
// 工厂
// =============================================================================

export function createVerificationCodeService(
  opts?: ConstructorParameters<typeof VerificationCodeService>[0],
): VerificationCodeService {
  return new VerificationCodeService(opts);
}

export default VerificationCodeService;
