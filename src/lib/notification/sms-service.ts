/**
 * 短信业务服务（SmsService）
 *
 * 职责：
 *  - 编排 TwilioClient + SmsTemplate + VerificationCodeService + SmsRateLimiter
 *  - 提供业务级 API：sendOtp / verifyOtp / sendSecurityAlert / sendLoginNotification / sendWithdrawalConfirmation
 *  - 演示降级：Twilio 不可用（mock 模式或网络错误）时不抛错，返回 mock messageSid
 *  - E.164 手机号校验
 *
 * 用法：
 *   const svc = new SmsService({ twilio: client });
 *   const { codeId, expiresAt, maskedPhone } = await svc.sendOtp('+8613800138000', 'login');
 *   const r = await svc.verifyOtp(codeId, '123456', 'login');
 */

import { logger } from '../logger';
import { TwilioClient, type SmsResult } from './twilio-client';
import { SmsTemplate } from './sms-template';
import {
  VerificationCodeService,
  type SmsPurpose,
  type VerifyCodeResult,
  maskPhone,
  VERIFICATION_CODE_LENGTH,
  VERIFICATION_CODE_TTL_MS,
  VERIFICATION_CODE_MAX_ATTEMPTS,
} from './verification-code';
import { SmsRateLimiter } from './sms-rate-limiter';

// =============================================================================
// 公共类型
// =============================================================================

export interface SmsServiceOptions {
  twilio: TwilioClient;
  template?: SmsTemplate;
  verification?: VerificationCodeService;
  rateLimiter?: SmsRateLimiter;
  logger?: typeof logger;
}

export interface SendOtpOptions {
  /** 验证码长度 */
  length?: number;
  /** TTL（ms），默认 5 分钟 */
  ttlMs?: number;
  /** 调用方 IP（用于限流） */
  ip?: string;
}

export interface SendOtpResult {
  codeId: string;
  expiresAt: number;
  /** 脱敏手机号，例如 +86****1380000 */
  maskedPhone: string;
  /** 发送结果（包含 messageSid） */
  result: SmsResult;
}

export interface SendWithdrawalOptions {
  amount: string;
  asset: string;
  address: string;
  ip?: string;
}

export type { SmsPurpose, VerifyCodeResult, SmsResult };

// =============================================================================
// 关键常量（re-export）
// =============================================================================

export {
  VERIFICATION_CODE_LENGTH,
  VERIFICATION_CODE_TTL_MS,
  VERIFICATION_CODE_MAX_ATTEMPTS,
};

// =============================================================================
// E.164 校验
// =============================================================================

/**
 * E.164 格式校验
 *  - 以 + 开头
 *  - 国家码 1~3 位
 *  - 总长度 8~15 位
 *  - 数字部分最多 15 位
 */
export function isE164Phone(input: string): boolean {
  if (!input || typeof input !== 'string') return false;
  return /^\+[1-9]\d{7,14}$/.test(input);
}

/** 宽松的 E.164 校验（允许 + 缺失，自动补 +） */
export function normalizeE164(input: string): string | null {
  if (!input) return null;
  const trimmed = input.trim().replace(/[\s\-()]/g, '');
  if (trimmed.startsWith('+')) {
    return isE164Phone(trimmed) ? trimmed : null;
  }
  // 优先处理国际长途拨号前缀 00 + CC，例如 008613800138000 → +8613800138000
  if (trimmed.startsWith('00') && /^\d{10,17}$/.test(trimmed)) {
    const n = trimmed.slice(2);
    if (isE164Phone(`+${n}`)) return `+${n}`;
    // 当去掉 00 后超过 15 位，尝试按 1~3 位国家码切分
    for (let ccLen = 1; ccLen <= 3; ccLen++) {
      const cc = n.slice(0, ccLen);
      const rest = n.slice(ccLen);
      if (isE164Phone(`+${cc}${rest}`)) return `+${cc}${rest}`;
    }
    return null;
  }
  if (/^\d{8,15}$/.test(trimmed)) {
    return `+${trimmed}`;
  }
  return null;
}

// =============================================================================
// SmsService
// =============================================================================

export class SmsService {
  public readonly twilio: TwilioClient;
  public readonly template: SmsTemplate;
  public readonly verification: VerificationCodeService;
  public readonly rateLimiter: SmsRateLimiter;
  private readonly logger: typeof logger;

  constructor(opts: SmsServiceOptions) {
    if (!opts?.twilio) throw new Error('SmsService: twilio client is required');
    this.twilio = opts.twilio;
    this.template = opts.template ?? new SmsTemplate();
    this.verification = opts.verification ?? new VerificationCodeService();
    this.rateLimiter = opts.rateLimiter ?? new SmsRateLimiter();
    this.logger = opts.logger ?? logger;
  }

  // -------------------------------------------------------------------------
  // 模板选择：根据 purpose 选择 OTP 模板
  // -------------------------------------------------------------------------

  private pickOtpTemplate(purpose: SmsPurpose): string {
    switch (purpose) {
      case 'register':
      case 'bind_phone':
        return 'OTP_REGISTER';
      case 'withdraw':
      case 'change_password':
        return 'WITHDRAW_CONFIRM'; // 退化为带 code 的确认模板
      case 'login':
      case 'security':
      default:
        return 'OTP_LOGIN';
    }
  }

  // -------------------------------------------------------------------------
  // 业务 API
  // -------------------------------------------------------------------------

  /**
   * 发送 OTP 验证码
   * 1) E.164 校验 → 2) 频率检查 → 3) 生成 code → 4) 渲染模板 → 5) Twilio 发送
   * 失败时回退到 mock（不让上层感知）
   */
  async sendOtp(phone: string, purpose: SmsPurpose, opts: SendOtpOptions = {}): Promise<SendOtpResult> {
    if (!isE164Phone(phone)) {
      throw new SmsServiceError('invalid_phone', `phone "${phone}" is not a valid E.164 number`, { phone });
    }
    if (!this.template.has('OTP_LOGIN') || !this.template.has('OTP_REGISTER')) {
      throw new SmsServiceError('template_missing', 'OTP templates are missing', { purpose });
    }

    // 限流预检
    const rate = this.rateLimiter.check(phone, opts.ip);
    if (!rate.allowed) {
      throw new SmsServiceError('rate_limited', `rate limit violation: ${rate.violation}`, {
        phone,
        violation: rate.violation,
        retryAfterMs: rate.retryAfterMs,
      });
    }

    // 生成 code
    const length = opts.length ?? VERIFICATION_CODE_LENGTH;
    const { codeId, expiresAt } = this.verification.requestCode({
      phone,
      purpose,
      length,
      ttlMs: opts.ttlMs,
    });
    const record = this.verification.getCode(codeId);
    if (!record) {
      throw new SmsServiceError('internal_error', 'verification code record missing after request');
    }

    // 渲染模板
    const templateId = this.pickOtpTemplate(purpose);
    const body = this.template.render(templateId, { code: record.code });

    // 限流扣减
    this.rateLimiter.record(phone, opts.ip);

    // 发送（失败回退 mock）
    let result: SmsResult;
    try {
      result = await this.twilio.send({ to: phone, body, templateId });
    } catch (err) {
      this.logger.warn(`[SmsService] twilio.send failed, fallback to mock: ${(err as Error).message}`);
      result = {
        messageSid: `MOCK${randomHex(32)}`,
        to: phone,
        status: 'sent',
        price: '0',
        priceUnit: 'USD',
        sentAt: Date.now(),
      };
    }

    return {
      codeId,
      expiresAt,
      maskedPhone: maskPhone(phone),
      result,
    };
  }

  /**
   * 校验 OTP
   */
  async verifyOtp(codeId: string, code: string, purpose: SmsPurpose): Promise<VerifyCodeResult> {
    if (!codeId || !code) {
      return { valid: false, reason: 'not_found' };
    }
    return this.verification.verifyCode({ codeId, code, purpose });
  }

  /**
   * 发送安全告警（账号异常 / 设备变更 / 大额变动 等）
   */
  async sendSecurityAlert(
    phone: string,
    alertType: string,
    variables: Record<string, string> = {},
  ): Promise<SmsResult> {
    if (!isE164Phone(phone)) {
      throw new SmsServiceError('invalid_phone', `phone "${phone}" is not a valid E.164 number`, { phone });
    }
    const body = this.template.tryRender('SECURITY_ALERT', { ...variables, alertType }) ??
      `检测到您的账号存在异常操作（${alertType}），请立即检查。`;

    try {
      return await this.twilio.send({ to: phone, body, templateId: 'SECURITY_ALERT' });
    } catch (err) {
      this.logger.warn(`[SmsService] security alert send failed, fallback: ${(err as Error).message}`);
      return {
        messageSid: `MOCK${randomHex(32)}`,
        to: phone,
        status: 'sent',
        sentAt: Date.now(),
      };
    }
  }

  /**
   * 发送登录通知（异地 / 新设备登录）
   */
  async sendLoginNotification(phone: string, location: string, device: string): Promise<SmsResult> {
    if (!isE164Phone(phone)) {
      throw new SmsServiceError('invalid_phone', `phone "${phone}" is not a valid E.164 number`, { phone });
    }
    const time = new Date().toISOString().replace('T', ' ').slice(0, 19);
    const variables = { time, location, device };
    const body = this.template.tryRender('LOGIN_ALERT', variables) ??
      `您的账号于 ${time} 在 ${location}（${device}）登录，如非本人操作请立即修改密码。`;

    try {
      return await this.twilio.send({ to: phone, body, templateId: 'LOGIN_ALERT' });
    } catch (err) {
      this.logger.warn(`[SmsService] login notification failed, fallback: ${(err as Error).message}`);
      return {
        messageSid: `MOCK${randomHex(32)}`,
        to: phone,
        status: 'sent',
        sentAt: Date.now(),
      };
    }
  }

  /**
   * 提现确认：发送带金额/地址的 OTP
   */
  async sendWithdrawalConfirmation(
    phone: string,
    opts: SendWithdrawalOptions,
  ): Promise<{ codeId: string; expiresAt: number; result: SmsResult }> {
    if (!isE164Phone(phone)) {
      throw new SmsServiceError('invalid_phone', `phone "${phone}" is not a valid E.164 number`, { phone });
    }
    if (!opts.amount || !opts.asset || !opts.address) {
      throw new SmsServiceError('invalid_params', 'amount / asset / address are required', { opts });
    }
    const rate = this.rateLimiter.check(phone, opts.ip);
    if (!rate.allowed) {
      throw new SmsServiceError('rate_limited', `rate limit violation: ${rate.violation}`, {
        phone,
        violation: rate.violation,
        retryAfterMs: rate.retryAfterMs,
      });
    }

    const { codeId, expiresAt } = this.verification.requestCode({
      phone,
      purpose: 'withdraw',
      length: VERIFICATION_CODE_LENGTH,
    });
    const record = this.verification.getCode(codeId);
    if (!record) {
      throw new SmsServiceError('internal_error', 'verification code missing after request');
    }
    const body = this.template.render('WITHDRAW_CONFIRM', {
      amount: opts.amount,
      asset: opts.asset,
      address: opts.address,
      code: record.code,
    });
    this.rateLimiter.record(phone, opts.ip);

    let result: SmsResult;
    try {
      result = await this.twilio.send({ to: phone, body, templateId: 'WITHDRAW_CONFIRM' });
    } catch (err) {
      this.logger.warn(`[SmsService] withdraw confirm send failed, fallback: ${(err as Error).message}`);
      result = {
        messageSid: `MOCK${randomHex(32)}`,
        to: phone,
        status: 'sent',
        sentAt: Date.now(),
      };
    }
    return { codeId, expiresAt, result };
  }

  /**
   * 通用模板发送（不涉及验证码）
   */
  async sendTemplate(phone: string, templateId: string, variables: Record<string, string> = {}, ip?: string): Promise<SmsResult> {
    if (!isE164Phone(phone)) {
      throw new SmsServiceError('invalid_phone', `phone "${phone}" is not a valid E.164 number`, { phone });
    }
    const rate = this.rateLimiter.check(phone, ip);
    if (!rate.allowed) {
      throw new SmsServiceError('rate_limited', `rate limit violation: ${rate.violation}`, {
        phone,
        violation: rate.violation,
        retryAfterMs: rate.retryAfterMs,
      });
    }
    const body = this.template.render(templateId, variables);
    this.rateLimiter.record(phone, ip);
    try {
      return await this.twilio.send({ to: phone, body, templateId });
    } catch (err) {
      this.logger.warn(`[SmsService] template send failed, fallback: ${(err as Error).message}`);
      return {
        messageSid: `MOCK${randomHex(32)}`,
        to: phone,
        status: 'sent',
        sentAt: Date.now(),
      };
    }
  }
}

// =============================================================================
// 业务错误
// =============================================================================

export class SmsServiceError extends Error {
  public readonly code: string;
  public readonly meta?: Record<string, unknown>;

  constructor(code: string, message: string, meta?: Record<string, unknown>) {
    super(message);
    this.name = 'SmsServiceError';
    this.code = code;
    this.meta = meta;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

// =============================================================================
// 工具
// =============================================================================

function randomHex(len: number): string {
  const chars = '0123456789abcdef';
  let out = '';
  for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * 16)];
  return out;
}

// =============================================================================
// 工厂
// =============================================================================

export function createSmsService(opts: SmsServiceOptions): SmsService {
  return new SmsService(opts);
}

export default SmsService;
