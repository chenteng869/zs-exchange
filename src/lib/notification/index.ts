/**
 * 通知服务（Notification）统一出口
 *
 * 模块构成：
 *  - TwilioClient              Twilio REST API 客户端
 *  - SmsTemplate               短信模板（OTP / 提现 / 安全告警）
 *  - VerificationCodeService   验证码生成 / 校验 / 防重放
 *  - SmsRateLimiter            4 维滑动窗口限流
 *  - SmsService                短信业务编排层（含 E.164 校验 + 失败降级）
 *  - Email                     SendGrid 邮件通道（L-05，含模板 / 限流 / 退订 / 退信）
 *  - FcmClient / ApnsClient / HmsClient  三大推送厂商适配器（L-01/02/03）
 *  - PushService               推送业务编排层（设备注册 / 路由 / 批量 / 统计）
 */

// Twilio
export {
  TwilioClient,
  createTwilioClient,
  type SmsMessage,
  type SmsResult,
  type SmsStatus,
  type TwilioClientOptions,
} from './twilio-client';

// Template
export {
  SmsTemplate,
  createSmsTemplate,
  BUILTIN_TEMPLATES,
  type SmsTemplateDefinition,
} from './sms-template';

// Verification Code
export {
  VerificationCodeService,
  createVerificationCodeService,
  maskPhone,
  VERIFICATION_CODE_LENGTH,
  VERIFICATION_CODE_TTL_MS,
  VERIFICATION_CODE_MAX_ATTEMPTS,
  type SmsPurpose,
  type VerificationCode,
  type RequestCodeOptions,
  type RequestCodeResult,
  type VerifyCodeOptions,
  type VerifyCodeResult,
} from './verification-code';

// Rate Limiter
export {
  SmsRateLimiter,
  createSmsRateLimiter,
  RATE_LIMITS,
  type RateLimitKey,
  type RateLimitCheckResult,
  type RateLimitRule,
  type SmsRateLimiterOptions,
} from './sms-rate-limiter';

// Service (business orchestration)
export {
  SmsService,
  createSmsService,
  SmsServiceError,
  isE164Phone,
  normalizeE164,
  type SmsServiceOptions,
  type SendOtpOptions,
  type SendOtpResult,
  type SendWithdrawalOptions,
} from './sms-service';

// Email channel (SendGrid) — L-05
export * as Email from './email';

// Push Types
export {
  defaultProviderFor,
  base64UrlEncode,
  base64UrlDecode,
  randomHex,
  PUSH_DEFAULT_TTL_SECONDS,
  PUSH_DEFAULT_PRIORITY,
  PUSH_BATCH_SIZE,
  APNS_JWT_CACHE_TTL_MS,
  FCM_TOKEN_CACHE_TTL_MS,
  HMS_TOKEN_CACHE_TTL_MS,
  type PushProvider,
  type DevicePlatform,
  type PushStatus,
  type PushPriority,
  type DeviceToken,
  type PushPayload,
  type PushResult,
  type FcmConfig,
  type FcmServiceAccount,
  type ApnsConfig,
  type HmsConfig,
} from './push/types';

// FCM
export {
  FcmClient,
  createFcmClient,
} from './push/fcm-client';

// APNs
export {
  ApnsClient,
  createApnsClient,
  derToJose,
} from './push/apns-client';

// HMS
export {
  HmsClient,
  createHmsClient,
  HMS_INVALID_TOKEN_CODES,
  HMS_RATE_LIMITED_CODES,
} from './push/hms-client';

// Push Service
export {
  PushService,
  createPushService,
  type PushStats,
  type PushEventHandler,
  type PushServiceOptions,
} from './push/push-service';
