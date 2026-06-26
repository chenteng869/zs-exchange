/**
 * 邮件通道（Email）统一出口
 *
 * 模块构成：
 *  - types            公共类型（EmailMessage / EmailResult / EmailAddress ...）
 *  - SendGridClient   SendGrid v3 REST API 客户端（含退订 / 退信 / 统计）
 *  - EmailTemplate    邮件模板（HTML + 文本双版本）
 *  - EmailRateLimiter 5 维滑动窗口限流
 *  - EmailService     业务编排层（OTP / 提现 / 充值 / 安全 / KYC / Newsletter）
 */

export * from './types';
export {
  SendGridClient,
  createSendGridClient,
  toArray,
  toEmailString,
  normalizeEmails,
} from './sendgrid-client';
export {
  EmailTemplate,
  createEmailTemplate,
  BUILTIN_TEMPLATES,
  BRAND_PRIMARY,
  BRAND_SUCCESS,
  BRAND_DANGER,
  BRAND_WARNING,
  UNSUBSCRIBE_PLACEHOLDER,
  APP_BASE_URL_PLACEHOLDER,
  SUPPORT_EMAIL_PLACEHOLDER,
  type EmailTemplateDefinition,
  type RenderedEmail,
} from './templates';
export {
  EmailRateLimiter,
  createEmailRateLimiter,
  RATE_LIMITS,
  type EmailRateLimitKey,
  type EmailRateLimitCheckResult,
  type EmailRateLimitRule,
  type EmailRateLimiterOptions,
} from './email-rate-limiter';
export {
  EmailService,
  createEmailService,
  EmailServiceError,
  isValidEmail,
  normalizeEmail,
  maskEmail,
  VERIFICATION_CODE_LENGTH,
  VERIFICATION_CODE_TTL_MS,
  VERIFICATION_CODE_MAX_ATTEMPTS,
  type EmailServiceOptions,
} from './email-service';
