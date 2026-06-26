/**
 * 邮件通道公共类型
 *
 * 职责：
 *  - 统一抽象 EmailMessage / EmailResult / EmailAddress / EmailAttachment
 *  - 隔离上层业务（EmailService）与 SendGrid 客户端
 *  - 支持事务 + 营销邮件双通道
 *
 * SendGrid v3 API 文档：
 *  - https://docs.sendgrid.com/api-reference/mail-send/mail-send
 */

// =============================================================================
// 地址
// =============================================================================

export interface EmailAddress {
  email: string;
  name?: string;
}

// =============================================================================
// 附件
// =============================================================================

export interface EmailAttachment {
  filename: string;
  /** base64 字符串或 Buffer */
  content: Buffer | string;
  /** MIME 类型，例如 "application/pdf" */
  type: string;
  /** disposition，默认 "attachment" */
  disposition?: 'attachment' | 'inline';
  /** inline 图片 content_id（HTML 中以 cid:xxx 引用） */
  contentId?: string;
}

// =============================================================================
// 邮件
// =============================================================================

export type EmailCategory =
  | 'transactional' // 事务（验证码 / 提现 / 安全告警）
  | 'marketing'     // 营销（活动 / Newsletter）
  | 'notification'  // 通知（系统消息）
  | 'alert';        // 安全告警

export interface EmailMessage {
  to: EmailAddress | EmailAddress[];
  cc?: EmailAddress | EmailAddress[];
  bcc?: EmailAddress | EmailAddress[];
  from: EmailAddress;
  replyTo?: EmailAddress;
  subject: string;
  /** 纯文本（必填，用于兼容老客户端 / 减少垃圾邮件评分） */
  text: string;
  /** HTML 正文（必填） */
  html: string;
  attachments?: EmailAttachment[];
  /** 自定义 SMTP 头 */
  headers?: Record<string, string>;
  /** SendGrid 分类（用于统计） */
  categories?: string[];
  /** 自定义透传参数（SendGrid Event Webhook 回调带回） */
  customArgs?: Record<string, string>;
  /** 定时发送（毫秒时间戳） */
  sendAt?: number;
  /** 订阅管理组（SendGrid ASM） */
  asm?: {
    groupId: number;
    /** 在页脚附加退订链接（默认 true） */
    groupsToDisplay?: number[];
  };
  /** 业务类型（用于上层打点） */
  category?: EmailCategory;
  /** 业务模板 ID（用于打点 / 跟踪） */
  templateId?: string;
  /** 关联用户 ID（用于打点 / 跟踪） */
  userId?: string;
}

// =============================================================================
// 发送结果
// =============================================================================

export type EmailStatus =
  | 'queued'      // 已入 SendGrid 队列
  | 'sent'        // SendGrid 已接收
  | 'delivered'   // 已送达（webhook 回调）
  | 'failed'      // 失败（4xx / 5xx / 网络错误）
  | 'bounced'     // 退信
  | 'spam';       // 被举报为垃圾邮件

export interface EmailResult {
  /** SendGrid x-message-id（X-Message-Id 头） */
  messageId: string;
  /** 收件人地址列表（规范化后） */
  to: string[];
  status: EmailStatus;
  errorCode?: number;
  errorMessage?: string;
  /** 发送时间戳（毫秒） */
  sentAt: number;
}

// =============================================================================
// 抑制（Suppression）
// =============================================================================

export type SuppressionType = 'bounces' | 'blocks' | 'spam_reports' | 'unsubscribes';

export interface SuppressionEntry {
  email: string;
  createdAt: number;
  reason?: string;
  /** 类型相关字段：bounce 时为 "hard"/"soft"；block 时为 IP 等 */
  type?: string;
  status?: string;
}

export interface SuppressionListResponse {
  entries: SuppressionEntry[];
  nextCursor?: string;
}

// =============================================================================
// 统计
// =============================================================================

export type StatsAggregation = 'day' | 'week' | 'month';

export interface EmailStats {
  startDate: string;
  endDate: string;
  aggregatedBy?: StatsAggregation;
  metrics: Array<{
    metric: string;
    type: 'global' | 'subuser' | 'subuser_prefix';
    data: Array<{
      date: string;
      stats: Record<string, number>;
    }>;
  }>;
}

// =============================================================================
// 业务层类型（供 EmailService 使用）
// =============================================================================

export type EmailPurpose =
  | 'verify_email'
  | 'reset_password'
  | 'withdraw_confirm'
  | 'login_otp'
  | 'bind_email';

export interface EmailOtpOptions {
  length?: number;
  ttlMs?: number;
  ip?: string;
}

export interface EmailOtpResult {
  codeId: string;
  expiresAt: number;
  /** 脱敏邮箱，例如 a***@example.com */
  maskedEmail: string;
  result: EmailResult;
}

export interface EmailWithdrawalVars {
  amount: string;
  asset: string;
  address: string;
  txHash?: string;
  network?: string;
}

export interface EmailDepositVars {
  amount: string;
  asset: string;
  txHash?: string;
  network?: string;
  confirmations?: number;
}

export interface EmailLoginAlertVars {
  ip: string;
  device: string;
  location?: string;
  time: string;
}

export interface EmailKycVars {
  reason?: string;
  level?: string;
  time?: string;
}
