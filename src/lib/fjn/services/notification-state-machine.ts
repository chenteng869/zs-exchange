/**
 * Notification Service - 状态机 + 枚举
 *
 * 工业级 Solana-first 架构
 * 文档：docs/工业级最终方案：Solana-first 统一生态架构.md §5.6.3
 *
 * Notification = 通知系统
 *  - 站内信（CoreNotification 表）
 *  - 邮件 / 短信 / 推送（通过 outbox 事件由 worker 异步分发）
 *  - 模板系统：title + content + variables
 *  - 优先级：low / normal / high / urgent
 *  - 状态：pending / sent / failed / bounced
 *  - 偏好：userNotificationPreferences（JSON 存）
 *
 * 集成方式：
 *   await notificationService.send({
 *     userId, type, title, content, channels: ['in_app', 'email'],
 *     variables: { orderNo, amount }, priority: 'high', relatedType, relatedId
 *   });
 */

export const NOTIFICATION_TYPE = {
  // KYC
  KYC_SUBMITTED: 'kyc.submitted',
  KYC_APPROVED: 'kyc.approved',
  KYC_REJECTED: 'kyc.rejected',
  KYC_REVIEW: 'kyc.review',
  // 订单
  ORDER_CREATED: 'order.created',
  ORDER_PAID: 'order.paid',
  ORDER_SHIPPED: 'order.shipped',
  ORDER_DELIVERED: 'order.delivered',
  ORDER_CANCELLED: 'order.cancelled',
  ORDER_REFUNDED: 'order.refunded',
  // 积分 / 余额
  POINTS_EARNED: 'points.earned',
  POINTS_SPENT: 'points.spent',
  POINTS_LOCKED: 'points.locked',
  POINTS_UNLOCKED: 'points.unlocked',
  POINTS_CONVERTED: 'points.converted',
  POINTS_EXPIRING: 'points.expiring',
  // NFT
  NFT_MINTED: 'nft.minted',
  NFT_TRANSFERRED: 'nft.transferred',
  NFT_LISTED: 'nft.listed',
  NFT_SOLD: 'nft.sold',
  NFT_UPGRADED: 'nft.upgraded',
  // 释放 / 奖励
  RELEASE_CALCULATED: 'release.calculated',
  RELEASE_CLAIMABLE: 'release.claimable',
  RELEASE_CLAIMED: 'release.claimed',
  REWARD_PAID: 'reward.paid',
  // 审批
  APPROVAL_CREATED: 'approval.created',
  APPROVAL_APPROVED: 'approval.approved',
  APPROVAL_REJECTED: 'approval.rejected',
  APPROVAL_EXECUTED: 'approval.executed',
  // 合规 / 风控
  COMPLIANCE_PASSED: 'compliance.passed',
  COMPLIANCE_FAILED: 'compliance.failed',
  RISK_BLOCKED: 'risk.blocked',
  RISK_WARNING: 'risk.warning',
  // 体育
  SPORTS_ENTRY_PLACED: 'sports.entry.placed',
  SPORTS_ENTRY_WON: 'sports.entry.won',
  SPORTS_ENTRY_LOST: 'sports.entry.lost',
  // 商城
  MALL_ORDER_PAID: 'mall.order.paid',
  MALL_ORDER_SHIPPED: 'mall.order.shipped',
  // 系统
  SYSTEM_MAINTENANCE: 'system.maintenance',
  SYSTEM_ANNOUNCEMENT: 'system.announcement',
  SYSTEM_SECURITY_ALERT: 'system.security_alert',
  // 通用
  CUSTOM: 'custom',
} as const;
export type FjnNotificationType = (typeof NOTIFICATION_TYPE)[keyof typeof NOTIFICATION_TYPE];

/** 通知渠道 */
export const NOTIFICATION_CHANNEL = {
  IN_APP: 'in_app',
  EMAIL: 'email',
  SMS: 'sms',
  PUSH: 'push',
  WEBHOOK: 'webhook',
} as const;
export type FjnNotificationChannel =
  (typeof NOTIFICATION_CHANNEL)[keyof typeof NOTIFICATION_CHANNEL];

/** 优先级 */
export const NOTIFICATION_PRIORITY = {
  LOW: 'low',
  NORMAL: 'normal',
  HIGH: 'high',
  URGENT: 'urgent',
} as const;
export type FjnNotificationPriority =
  (typeof NOTIFICATION_PRIORITY)[keyof typeof NOTIFICATION_PRIORITY];

/** 状态 */
export const NOTIFICATION_STATUS = {
  PENDING: 'pending',
  SENT: 'sent',
  FAILED: 'failed',
  BOUNCED: 'bounced',
  SKIPPED: 'skipped',
} as const;
export type FjnNotificationStatus =
  (typeof NOTIFICATION_STATUS)[keyof typeof NOTIFICATION_STATUS];

/** 默认渠道映射（按类型） */
export const NOTIFICATION_DEFAULT_CHANNELS: Record<string, FjnNotificationChannel[]> = {
  [NOTIFICATION_TYPE.KYC_SUBMITTED]: ['in_app'],
  [NOTIFICATION_TYPE.KYC_APPROVED]: ['in_app', 'email', 'sms'],
  [NOTIFICATION_TYPE.KYC_REJECTED]: ['in_app', 'email'],
  [NOTIFICATION_TYPE.ORDER_CREATED]: ['in_app'],
  [NOTIFICATION_TYPE.ORDER_PAID]: ['in_app', 'email', 'sms'],
  [NOTIFICATION_TYPE.ORDER_SHIPPED]: ['in_app', 'sms'],
  [NOTIFICATION_TYPE.ORDER_DELIVERED]: ['in_app', 'email'],
  [NOTIFICATION_TYPE.ORDER_CANCELLED]: ['in_app', 'email'],
  [NOTIFICATION_TYPE.ORDER_REFUNDED]: ['in_app', 'email', 'sms'],
  [NOTIFICATION_TYPE.POINTS_EARNED]: ['in_app'],
  [NOTIFICATION_TYPE.POINTS_SPENT]: ['in_app'],
  [NOTIFICATION_TYPE.POINTS_LOCKED]: ['in_app'],
  [NOTIFICATION_TYPE.POINTS_UNLOCKED]: ['in_app'],
  [NOTIFICATION_TYPE.POINTS_CONVERTED]: ['in_app', 'email'],
  [NOTIFICATION_TYPE.POINTS_EXPIRING]: ['in_app', 'email'],
  [NOTIFICATION_TYPE.NFT_MINTED]: ['in_app', 'email'],
  [NOTIFICATION_TYPE.NFT_TRANSFERRED]: ['in_app', 'email'],
  [NOTIFICATION_TYPE.NFT_SOLD]: ['in_app', 'email', 'sms'],
  [NOTIFICATION_TYPE.RELEASE_CLAIMABLE]: ['in_app', 'email', 'sms', 'push'],
  [NOTIFICATION_TYPE.RELEASE_CLAIMED]: ['in_app', 'email', 'sms'],
  [NOTIFICATION_TYPE.REWARD_PAID]: ['in_app', 'email', 'sms'],
  [NOTIFICATION_TYPE.APPROVAL_CREATED]: ['in_app', 'email'],
  [NOTIFICATION_TYPE.APPROVAL_APPROVED]: ['in_app', 'email'],
  [NOTIFICATION_TYPE.APPROVAL_REJECTED]: ['in_app', 'email'],
  [NOTIFICATION_TYPE.COMPLIANCE_FAILED]: ['in_app', 'email'],
  [NOTIFICATION_TYPE.RISK_BLOCKED]: ['in_app', 'email', 'sms'],
  [NOTIFICATION_TYPE.SPORTS_ENTRY_WON]: ['in_app', 'email', 'sms', 'push'],
  [NOTIFICATION_TYPE.SPORTS_ENTRY_LOST]: ['in_app'],
  [NOTIFICATION_TYPE.SYSTEM_SECURITY_ALERT]: ['in_app', 'email', 'sms', 'push'],
  [NOTIFICATION_TYPE.SYSTEM_MAINTENANCE]: ['in_app', 'email', 'push'],
};

/** 默认过期时间（小时）按优先级 */
export const NOTIFICATION_DEFAULT_TTL_HOURS: Record<string, number> = {
  [NOTIFICATION_PRIORITY.LOW]: 168,
  [NOTIFICATION_PRIORITY.NORMAL]: 72,
  [NOTIFICATION_PRIORITY.HIGH]: 24,
  [NOTIFICATION_PRIORITY.URGENT]: 4,
};

/** 默认重试次数 */
export const NOTIFICATION_MAX_RETRY = 3;

/** 默认重试延迟（毫秒） */
export const NOTIFICATION_RETRY_DELAY_MS = 60_000;

/** 校验器 */
export const isValidNotificationType = (v: string): v is FjnNotificationType =>
  Object.values(NOTIFICATION_TYPE).includes(v as any);
export const isValidNotificationChannel = (v: string): v is FjnNotificationChannel =>
  Object.values(NOTIFICATION_CHANNEL).includes(v as any);
export const isValidNotificationPriority = (v: string): v is FjnNotificationPriority =>
  Object.values(NOTIFICATION_PRIORITY).includes(v as any);
export const isValidNotificationStatus = (v: string): v is FjnNotificationStatus =>
  Object.values(NOTIFICATION_STATUS).includes(v as any);
