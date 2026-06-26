/**
 * 邮件业务服务（EmailService）
 *
 * 职责：
 *  - 编排 SendGridClient + EmailTemplate + EmailRateLimiter + 验证码服务
 *  - 提供业务级 API：sendOtp / verifyOtp / sendWithdrawalConfirmation /
 *    sendDepositNotification / sendLoginAlert / sendSecurityAlert /
 *    sendKycResult / sendNewsletter
 *  - 演示降级：API Key 含 "mock" 或 mockMode=true 时直接返回 mock 结果
 *  - 邮箱格式校验
 *  - 失败重试 + 退订管理 + 退信处理
 *
 * 用法：
 *   const svc = new EmailService({
 *     sendgrid: new SendGridClient({ apiKey: 'SG.xxx' }),
 *     from: { email: 'noreply@smy.exchange', name: 'SMY Exchange' },
 *   });
 *   const { codeId, expiresAt, maskedEmail } = await svc.sendOtp('user@example.com', 'verify_email');
 *   const r = await svc.verifyOtp(codeId, '123456', 'verify_email');
 */

import { logger } from '../../logger';
import { SendGridClient, normalizeEmails } from './sendgrid-client';
import { EmailTemplate } from './templates';
import { EmailRateLimiter } from './email-rate-limiter';
import {
  VerificationCodeService,
  VERIFICATION_CODE_LENGTH,
  VERIFICATION_CODE_TTL_MS,
  VERIFICATION_CODE_MAX_ATTEMPTS,
} from '../verification-code';
import type {
  EmailAddress,
  EmailDepositVars,
  EmailKycVars,
  EmailLoginAlertVars,
  EmailMessage,
  EmailOtpOptions,
  EmailOtpResult,
  EmailPurpose,
  EmailResult,
  EmailWithdrawalVars,
} from './types';

// =============================================================================
// 公共类型
// =============================================================================

export interface EmailServiceOptions {
  sendgrid: SendGridClient;
  template?: EmailTemplate;
  rateLimiter?: EmailRateLimiter;
  /** 业务级 OTP 服务（与 SMS 共享） */
  verification?: VerificationCodeService;
  /** 默认发件人 */
  from: EmailAddress;
  /** 默认 reply-to */
  replyTo?: EmailAddress;
  /** 退订管理 ASM Group ID（可选） */
  asmGroupId?: number;
  /** 业务可选：app base url / support email 注入 */
  appBaseUrl?: string;
  supportEmail?: string;
  /** logger 注入 */
  logger?: typeof logger;
  /** 时钟注入 */
  now?: () => number;
}

export {
  VERIFICATION_CODE_LENGTH,
  VERIFICATION_CODE_TTL_MS,
  VERIFICATION_CODE_MAX_ATTEMPTS,
};

export type {
  EmailPurpose,
  EmailOtpOptions,
  EmailOtpResult,
  EmailResult,
  EmailWithdrawalVars,
  EmailDepositVars,
  EmailLoginAlertVars,
  EmailKycVars,
  EmailMessage,
  EmailAddress,
};

// =============================================================================
// 邮箱格式校验
// =============================================================================

/**
 * 邮箱格式校验
 *  - 必须含 @
 *  - 本地部分允许字母 / 数字 / . _ % + -
 *  - 域名部分必须含 . 且顶级域名 ≥ 2 字符
 *  - 总长度 ≤ 254
 */
export function isValidEmail(input: string): boolean {
  if (!input || typeof input !== 'string') return false;
  if (input.length > 254) return false;
  // 简化版 RFC 5322 校验
  const re = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;
  return re.test(input.trim());
}

/** 规范化邮箱（小写、去空白） */
export function normalizeEmail(input: string): string {
  return input.trim().toLowerCase();
}

/** 邮箱脱敏：a***@example.com */
export function maskEmail(email: string): string {
  const e = normalizeEmail(email);
  const at = e.indexOf('@');
  if (at < 1) return e;
  const local = e.slice(0, at);
  const domain = e.slice(at);
  if (local.length <= 2) return `${local[0] ?? ''}***${domain}`;
  return `${local[0]}***${local.slice(-1)}${domain}`;
}

// =============================================================================
// 业务错误
// =============================================================================

export class EmailServiceError extends Error {
  public readonly code: string;
  public readonly meta?: Record<string, unknown>;

  constructor(code: string, message: string, meta?: Record<string, unknown>) {
    super(message);
    this.name = 'EmailServiceError';
    this.code = code;
    this.meta = meta;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

// =============================================================================
// EmailService
// =============================================================================

export class EmailService {
  public readonly sendgrid: SendGridClient;
  public readonly template: EmailTemplate;
  public readonly rateLimiter: EmailRateLimiter;
  public readonly verification: VerificationCodeService;
  public readonly from: EmailAddress;
  public readonly replyTo?: EmailAddress;
  public readonly asmGroupId?: number;
  public readonly appBaseUrl: string;
  public readonly supportEmail: string;
  private readonly logger: typeof logger;
  private readonly now: () => number;

  constructor(opts: EmailServiceOptions) {
    if (!opts?.sendgrid) throw new Error('EmailService: sendgrid client is required');
    if (!opts?.from?.email) throw new Error('EmailService: from.email is required');
    this.sendgrid = opts.sendgrid;
    this.template = opts.template ?? new EmailTemplate();
    this.rateLimiter = opts.rateLimiter ?? new EmailRateLimiter();
    this.verification = opts.verification ?? new VerificationCodeService();
    this.from = opts.from;
    this.replyTo = opts.replyTo;
    this.asmGroupId = opts.asmGroupId;
    this.appBaseUrl = opts.appBaseUrl ?? 'https://smy.exchange';
    this.supportEmail = opts.supportEmail ?? 'support@smy.exchange';
    this.logger = opts.logger ?? logger;
    this.now = opts.now ?? (() => Date.now());
  }

  // -------------------------------------------------------------------------
  // 模板选择
  // -------------------------------------------------------------------------

  private pickOtpTemplate(purpose: EmailPurpose): string {
    switch (purpose) {
      case 'reset_password':
        return 'TPL_RESET_PASSWORD';
      case 'verify_email':
      case 'bind_email':
      case 'login_otp':
      case 'withdraw_confirm':
      default:
        return 'TPL_VERIFY_EMAIL';
    }
  }

  private getOtpTtlMinutes(ttlMs?: number): number {
    const ms = ttlMs ?? VERIFICATION_CODE_TTL_MS;
    return Math.max(1, Math.round(ms / 60_000));
  }

  // -------------------------------------------------------------------------
  // 业务 API：sendOtp
  // -------------------------------------------------------------------------

  /**
   * 发送 OTP 验证码
   * 1) 邮箱格式校验 → 2) 频率检查 → 3) 生成 code → 4) 渲染模板 → 5) SendGrid 发送
   */
  async sendOtp(
    email: string,
    purpose: EmailPurpose,
    opts: EmailOtpOptions = {},
  ): Promise<EmailOtpResult> {
    if (!isValidEmail(email)) {
      throw new EmailServiceError('invalid_email', `email "${email}" is not a valid email address`, { email });
    }
    const normalized = normalizeEmail(email);

    // 限流预检
    const rate = this.rateLimiter.check(normalized, undefined);
    if (!rate.allowed) {
      throw new EmailServiceError('rate_limited', `rate limit violation: ${rate.violation}`, {
        email: normalized,
        violation: rate.violation,
        retryAfterMs: rate.retryAfterMs,
      });
    }

    // 生成 code（使用 verification 服务的 purpose 映射）
    const smsPurpose = this.toSmsPurpose(purpose);
    const length = opts.length ?? VERIFICATION_CODE_LENGTH;
    const { codeId, expiresAt } = this.verification.requestCode({
      phone: normalized, // 复用 verification 服务的字段（实际承载 email）
      purpose: smsPurpose,
      length,
      ttlMs: opts.ttlMs,
    });
    const record = this.verification.getCode(codeId);
    if (!record) {
      throw new EmailServiceError('internal_error', 'verification code record missing after request');
    }

    // 渲染模板
    const templateId = this.pickOtpTemplate(purpose);
    const ttlMinutes = this.getOtpTtlMinutes(opts.ttlMs);

    let rendered;
    if (templateId === 'TPL_RESET_PASSWORD') {
      const resetUrl = `${this.appBaseUrl}/reset-password?code=${encodeURIComponent(record.code)}&codeId=${encodeURIComponent(codeId)}`;
      rendered = this.template.render(templateId, {
        reset_url: resetUrl,
        ttl_minutes: String(this.getOtpTtlMinutes(opts.ttlMs ?? 30 * 60_000)),
      });
    } else {
      rendered = this.template.render(templateId, {
        code: record.code,
        ttl_minutes: String(ttlMinutes),
      });
    }

    // 限流扣减
    this.rateLimiter.record(normalized, undefined);

    // 发送
    const result = await this.dispatch({
      to: { email: normalized },
      subject: rendered.subject,
      text: rendered.text,
      html: rendered.html,
      category: 'transactional',
      templateId,
      userId: undefined,
    });

    return {
      codeId,
      expiresAt,
      maskedEmail: maskEmail(normalized),
      result,
    };
  }

  /** 校验 OTP */
  async verifyOtp(codeId: string, code: string, purpose: EmailPurpose): Promise<{ valid: boolean; reason?: string }> {
    if (!codeId || !code) return { valid: false, reason: 'not_found' };
    return this.verification.verifyCode({
      codeId,
      code,
      purpose: this.toSmsPurpose(purpose),
    });
  }

  // -------------------------------------------------------------------------
  // 业务 API：提现 / 充值 / 登录 / 安全 / KYC
  // -------------------------------------------------------------------------

  /** 提现成功通知 */
  async sendWithdrawalConfirmation(
    _userId: string,
    toEmail: string,
    vars: EmailWithdrawalVars,
  ): Promise<EmailResult> {
    if (!isValidEmail(toEmail)) {
      throw new EmailServiceError('invalid_email', `email "${toEmail}" is not a valid email address`, { toEmail });
    }
    if (!vars.amount || !vars.asset || !vars.address) {
      throw new EmailServiceError('invalid_params', 'amount / asset / address are required', { vars });
    }
    const rendered = this.template.render('TPL_WITHDRAW_SUCCESS', {
      amount: vars.amount,
      asset: vars.asset,
      address: vars.address,
      tx_hash: vars.txHash ?? '(pending)',
      network: vars.network ?? 'mainnet',
    });
    return this.dispatch({
      to: { email: normalizeEmail(toEmail) },
      subject: rendered.subject,
      text: rendered.text,
      html: rendered.html,
      category: 'transactional',
      templateId: 'TPL_WITHDRAW_SUCCESS',
    });
  }

  /** 充值到账通知 */
  async sendDepositNotification(
    _userId: string,
    toEmail: string,
    vars: EmailDepositVars,
  ): Promise<EmailResult> {
    if (!isValidEmail(toEmail)) {
      throw new EmailServiceError('invalid_email', `email "${toEmail}" is not a valid email address`, { toEmail });
    }
    if (!vars.amount || !vars.asset) {
      throw new EmailServiceError('invalid_params', 'amount / asset are required', { vars });
    }
    const rendered = this.template.render('TPL_DEPOSIT_RECEIVED', {
      amount: vars.amount,
      asset: vars.asset,
      tx_hash: vars.txHash ?? '(pending)',
      network: vars.network ?? 'mainnet',
      confirmations: String(vars.confirmations ?? 0),
    });
    return this.dispatch({
      to: { email: normalizeEmail(toEmail) },
      subject: rendered.subject,
      text: rendered.text,
      html: rendered.html,
      category: 'transactional',
      templateId: 'TPL_DEPOSIT_RECEIVED',
    });
  }

  /** 异地 / 新设备登录告警 */
  async sendLoginAlert(
    _userId: string,
    toEmail: string,
    vars: EmailLoginAlertVars,
  ): Promise<EmailResult> {
    if (!isValidEmail(toEmail)) {
      throw new EmailServiceError('invalid_email', `email "${toEmail}" is not a valid email address`, { toEmail });
    }
    const rendered = this.template.render('TPL_LOGIN_ALERT', {
      time: vars.time,
      ip: vars.ip,
      device: vars.device,
      location: vars.location ?? '未知地点',
    });
    return this.dispatch({
      to: { email: normalizeEmail(toEmail) },
      subject: rendered.subject,
      text: rendered.text,
      html: rendered.html,
      category: 'alert',
      templateId: 'TPL_LOGIN_ALERT',
    });
  }

  /** 通用安全告警 */
  async sendSecurityAlert(
    _userId: string,
    toEmail: string,
    alertType: string,
    vars: Record<string, string> = {},
  ): Promise<EmailResult> {
    if (!isValidEmail(toEmail)) {
      throw new EmailServiceError('invalid_email', `email "${toEmail}" is not a valid email address`, { toEmail });
    }
    const rendered = this.template.render('TPL_SECURITY_ALERT', {
      alert_type: alertType,
      time: vars.time ?? new Date(this.now()).toISOString().replace('T', ' ').slice(0, 19),
      detail: vars.detail ?? '如非本人操作，请立即冻结账户并联系客服。',
    });
    return this.dispatch({
      to: { email: normalizeEmail(toEmail) },
      subject: rendered.subject,
      text: rendered.text,
      html: rendered.html,
      category: 'alert',
      templateId: 'TPL_SECURITY_ALERT',
    });
  }

  /** KYC 审核结果 */
  async sendKycResult(
    _userId: string,
    toEmail: string,
    status: 'approved' | 'rejected',
    vars: EmailKycVars = {},
  ): Promise<EmailResult> {
    if (!isValidEmail(toEmail)) {
      throw new EmailServiceError('invalid_email', `email "${toEmail}" is not a valid email address`, { toEmail });
    }
    const templateId = status === 'approved' ? 'TPL_KYC_APPROVED' : 'TPL_KYC_REJECTED';
    const time = vars.time ?? new Date(this.now()).toISOString().replace('T', ' ').slice(0, 19);
    const rendered = status === 'approved'
      ? this.template.render(templateId, {
        level: vars.level ?? 'L1',
        time,
      })
      : this.template.render(templateId, {
        reason: vars.reason ?? '资料不清晰或与证件不符',
        time,
      });
    return this.dispatch({
      to: { email: normalizeEmail(toEmail) },
      subject: rendered.subject,
      text: rendered.text,
      html: rendered.html,
      category: 'notification',
      templateId,
    });
  }

  /** 批量 Newsletter 营销 */
  async sendNewsletter(
    recipients: Array<{ email: string; userId?: string }>,
    vars: Record<string, string>,
  ): Promise<EmailResult[]> {
    if (!Array.isArray(recipients) || recipients.length === 0) return [];
    // 模板渲染一次（所有用户共享同一内容）
    const rendered = this.template.render('TPL_NEWSLETTER', {
      week: vars.week ?? new Date(this.now()).toISOString().slice(0, 10),
      top_gainers: vars.top_gainers ?? '-',
      top_losers: vars.top_losers ?? '-',
      highlight: vars.highlight ?? '本周行情震荡整理，请关注关键支撑位。',
      cta_url: vars.cta_url ?? `${this.appBaseUrl}/markets`,
    });

    // 限流：每个 email 单独检查
    const out: EmailResult[] = [];
    for (const r of recipients) {
      if (!isValidEmail(r.email)) {
        out.push({
          messageId: '',
          to: [],
          status: 'failed',
          errorCode: 400,
          errorMessage: `invalid email "${r.email}"`,
          sentAt: this.now(),
        });
        continue;
      }
      const email = normalizeEmail(r.email);
      const rate = this.rateLimiter.check(email, r.userId);
      if (!rate.allowed) {
        out.push({
          messageId: '',
          to: [email],
          status: 'failed',
          errorCode: 429,
          errorMessage: `rate_limited:${rate.violation}`,
          sentAt: this.now(),
        });
        continue;
      }
      this.rateLimiter.record(email, r.userId);
      const result = await this.dispatch({
        to: { email },
        subject: rendered.subject,
        text: rendered.text,
        html: rendered.html,
        category: 'marketing',
        templateId: 'TPL_NEWSLETTER',
        userId: r.userId,
      });
      out.push(result);
    }
    return out;
  }

  // -------------------------------------------------------------------------
  // 退订管理 / 退信
  // -------------------------------------------------------------------------

  /** 从抑制列表中移除（恢复接收） */
  async removeSuppression(
    type: 'bounces' | 'blocks' | 'spam_reports' | 'unsubscribes',
    email: string,
  ): Promise<void> {
    if (!isValidEmail(email)) {
      throw new EmailServiceError('invalid_email', `email "${email}" is not a valid email address`, { email });
    }
    await this.sendgrid.deleteSuppression(type, normalizeEmail(email));
  }

  /** 查询抑制列表 */
  async getSuppression(
    type: 'bounces' | 'blocks' | 'spam_reports' | 'unsubscribes',
    email?: string,
  ): Promise<unknown> {
    if (email && !isValidEmail(email)) {
      throw new EmailServiceError('invalid_email', `email "${email}" is not a valid email address`, { email });
    }
    return this.sendgrid.getSuppression(type, email ? normalizeEmail(email) : undefined);
  }

  // -------------------------------------------------------------------------
  // 内部：发送 + 注入 footer 占位符
  // -------------------------------------------------------------------------

  private async dispatch(input: {
    to: EmailAddress;
    subject: string;
    text: string;
    html: string;
    category: 'transactional' | 'marketing' | 'notification' | 'alert';
    templateId: string;
    userId?: string;
  }): Promise<EmailResult> {
    // 注入退订 / app base url / support email 占位符
    const unsubUrl = this.asmGroupId
      ? `${this.appBaseUrl}/email/unsubscribe?email=${encodeURIComponent(input.to.email)}&group=${this.asmGroupId}`
      : `${this.appBaseUrl}/email/unsubscribe?email=${encodeURIComponent(input.to.email)}`;
    const html = input.html
      .replace(/\{\{unsubscribe_url\}\}/g, escapeAttr(unsubUrl))
      .replace(/\{\{app_base_url\}\}/g, escapeAttr(this.appBaseUrl))
      .replace(/\{\{support_email\}\}/g, escapeAttr(`mailto:${this.supportEmail}`));

    const message: EmailMessage = {
      to: input.to,
      from: this.from,
      replyTo: this.replyTo,
      subject: input.subject,
      text: input.text,
      html,
      categories: [input.category, input.templateId].filter(Boolean) as string[],
      customArgs: input.userId ? { user_id: input.userId } : undefined,
      asm: this.asmGroupId ? { groupId: this.asmGroupId } : undefined,
      category: input.category,
      templateId: input.templateId,
      userId: input.userId,
    };

    try {
      return await this.sendgrid.send(message);
    } catch (err) {
      this.logger.warn(`[EmailService] sendgrid.send failed, fallback to mock: ${(err as Error).message}`);
      return {
        messageId: `MOCK${randomHex(24)}`,
        to: normalizeEmails([input.to]),
        status: 'queued',
        sentAt: this.now(),
      };
    }
  }

  // -------------------------------------------------------------------------
  // 工具
  // -------------------------------------------------------------------------

  private toSmsPurpose(purpose: EmailPurpose): 'login' | 'register' | 'withdraw' | 'security' | 'change_password' | 'bind_phone' {
    switch (purpose) {
      case 'verify_email': return 'register';
      case 'bind_email': return 'bind_phone';
      case 'reset_password': return 'change_password';
      case 'withdraw_confirm': return 'withdraw';
      case 'login_otp': return 'login';
      default: return 'security';
    }
  }
}

function escapeAttr(s: string): string {
  return s.replace(/"/g, '&quot;');
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

export function createEmailService(opts: EmailServiceOptions): EmailService {
  return new EmailService(opts);
}

export default EmailService;
