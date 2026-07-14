/**
 * Notification Service - 事件定义
 *
 * 工业级 Solana-first 架构
 */

export const NOTIFICATION_EVENTS = {
  SENT: 'notification.sent',
  SENT_FAILED: 'notification.sent_failed',
  CHANNEL_DISPATCHED: 'notification.channel.dispatched',
  CHANNEL_DELIVERED: 'notification.channel.delivered',
  CHANNEL_FAILED: 'notification.channel.failed',
  CHANNEL_BOUNCED: 'notification.channel.bounced',
  READ: 'notification.read',
  READ_ALL: 'notification.read_all',
  BATCH_SENT: 'notification.batch_sent',
  PREFERENCE_UPDATED: 'notification.preference.updated',
  RETRY_SCHEDULED: 'notification.retry.scheduled',
} as const;

export const NOTIFICATION_EVENT_SOURCES = {
  NOTIFICATION_SERVICE: 'notification_service',
  USER: 'user',
  SYSTEM: 'system',
  WORKER: 'notification_worker',
  ADMIN: 'admin',
} as const;

export type FjnNotificationEvent =
  (typeof NOTIFICATION_EVENTS)[keyof typeof NOTIFICATION_EVENTS];

export type FjnNotificationEventSource =
  (typeof NOTIFICATION_EVENT_SOURCES)[keyof typeof NOTIFICATION_EVENT_SOURCES];

export interface NotificationSentPayload {
  notificationId: string;
  userId: string;
  type: string;
  channels: string[];
  priority: string;
  relatedType?: string;
  relatedId?: string;
}

export interface NotificationChannelDispatchedPayload {
  notificationId: string;
  channel: string;
  userId: string;
  externalId?: string; // 邮件 message-id / SMS sid / push token
  attemptedAt: string;
}

export interface NotificationChannelDeliveredPayload {
  notificationId: string;
  channel: string;
  userId: string;
  deliveredAt: string;
}

export interface NotificationReadPayload {
  notificationId: string;
  userId: string;
  readAt: string;
}

export type FjnNotificationEventPayload =
  | NotificationSentPayload
  | NotificationChannelDispatchedPayload
  | NotificationChannelDeliveredPayload
  | NotificationReadPayload
  | Record<string, unknown>;
