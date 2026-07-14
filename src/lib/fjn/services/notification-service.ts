/**
 * Notification Service - 工业级通知服务
 *
 * 工业级 Solana-first 架构
 * 文档：docs/工业级最终方案：Solana-first 统一生态架构.md §5.6.3
 *
 * 职责：
 *  - send：单条通知（按 channels 分发）
 *  - sendBatch：批量通知
 *  - markRead / markAllRead：标记已读
 *  - 偏好管理：getPreferences / updatePreferences
 *  - 模板渲染：renderTemplate
 *  - 渠道分发：dispatchByChannel（in_app 同步、email/sms/push 异步）
 *  - 重试机制：retryFailed
 *  - 限流：rate limit per user
 *  - 清理：purgeExpired
 *
 * 数据落地：
 *  - 站内信：CoreNotification 表
 *  - 邮件/短信/推送：通过 outbox 事件分发到 worker
 *
 * 集成方式（业务 Service 调用）：
 *   await notificationService.send({
 *     userId, type: 'order.paid', variables: { orderNo, amount },
 *     priority: 'high', relatedType: 'order', relatedId,
 *   });
 */

import { Prisma } from '@prisma/client';
import { FjnServiceBase, FjnServiceOptions } from './base';
import {
  NOTIFICATION_TYPE,
  NOTIFICATION_CHANNEL,
  NOTIFICATION_PRIORITY,
  NOTIFICATION_STATUS,
  NOTIFICATION_DEFAULT_CHANNELS,
  NOTIFICATION_DEFAULT_TTL_HOURS,
  NOTIFICATION_MAX_RETRY,
  NOTIFICATION_RETRY_DELAY_MS,
  isValidNotificationType,
  isValidNotificationChannel,
  isValidNotificationPriority,
  isValidNotificationStatus,
  type FjnNotificationType,
  type FjnNotificationChannel,
  type FjnNotificationPriority,
  type FjnNotificationStatus,
} from './notification-state-machine';
import {
  NOTIFICATION_EVENTS,
  NOTIFICATION_EVENT_SOURCES,
  type FjnNotificationEventSource,
} from './notification-events';
import {
  NotificationTypeInvalidError,
  NotificationChannelInvalidError,
  NotificationPriorityInvalidError,
  NotificationUserIdRequiredError,
  NotificationTitleRequiredError,
  NotificationContentRequiredError,
  NotificationChannelsRequiredError,
  NotificationChannelDuplicateError,
  NotificationNotFoundError,
  NotificationAlreadyReadError,
  NotificationNotOwnerError,
  NotificationTemplateNotFoundError,
  NotificationTemplateRenderFailedError,
  NotificationVariableMissingError,
  NotificationChannelDispatchFailedError,
  NotificationPreferenceDisabledError,
  NotificationPreferenceInvalidError,
  NotificationRateLimitExceededError,
  NotificationBatchTooLargeError,
  NotificationRetryExhaustedError,
  NotificationExpiredError,
} from './notification-errors';

// ============================================================
// 1. 入参接口
// ============================================================

/** 发送通知 */
export interface SendNotificationInput {
  userId: string;
  type: FjnNotificationType;
  /** 通知标题（不填则用模板） */
  title?: string;
  /** 通知内容（不填则用模板） */
  content?: string;
  /** 渠道（不填则按 NOTIFICATION_DEFAULT_CHANNELS 自动选择） */
  channels?: FjnNotificationChannel[];
  /** 模板变量 */
  variables?: Record<string, string | number>;
  /** 优先级（默认 normal） */
  priority?: FjnNotificationPriority;
  /** 关联对象 */
  relatedType?: string;
  relatedId?: string;
  relatedNo?: string;
  /** 操作链接 */
  actionUrl?: string;
  /** 用户偏好（覆盖默认偏好，key = channel） */
  preferences?: Record<string, boolean>;
  /** 跳过用户偏好（admin/system 调用） */
  bypassPreference?: boolean;
  /** tx 上下文（事务内发送） */
  tx?: any;
}

/** 批量发送 */
export interface SendBatchInput {
  items: Array<Omit<SendNotificationInput, 'tx'>>;
  tx: any;
}

/** 标记已读 */
export interface MarkReadInput {
  notificationId: string;
  userId: string;
}

/** 标记全部已读 */
export interface MarkAllReadInput {
  userId: string;
  type?: FjnNotificationType;
  beforeTime?: Date;
}

/** 模板定义（运行时传入） */
export interface NotificationTemplate {
  type: FjnNotificationType;
  titleTemplate: string;
  contentTemplate: string;
  channels: FjnNotificationChannel[];
  variables: string[]; // 必填变量
  /** Locale 多语言 */
  locales?: Record<string, { title: string; content: string }>;
}

/** 更新偏好 */
export interface UpdatePreferencesInput {
  userId: string;
  preferences: Partial<Record<FjnNotificationChannel, boolean>>;
  /** 静音时段（小时，0-23） */
  quietHoursStart?: number;
  quietHoursEnd?: number;
  /** 静默模式 */
  muted?: boolean;
}

/** 分页查询 */
export interface ListNotificationsInput {
  userId: string;
  page?: number;
  pageSize?: number;
  read?: boolean;
  type?: FjnNotificationType;
  startTime?: Date;
  endTime?: Date;
}

// ============================================================
// 2. 返回类型
// ============================================================

export interface NotificationView {
  id: string;
  userId: string;
  type: string;
  title: string;
  content: string;
  read: boolean;
  actionUrl: string | null;
  channels: string[];
  priority: string;
  status: FjnNotificationStatus;
  relatedType: string | null;
  relatedId: string | null;
  relatedNo: string | null;
  retryCount: number;
  expiresAt: Date | null;
  createdAt: Date;
  readAt: Date | null;
}

export interface NotificationPreferences {
  userId: string;
  inApp: boolean;
  email: boolean;
  sms: boolean;
  push: boolean;
  webhook: boolean;
  quietHoursStart: number | null;
  quietHoursEnd: number | null;
  muted: boolean;
}

// ============================================================
// 3. Service 实现
// ============================================================

export class FjnNotificationService extends FjnServiceBase {
  /** 运行时模板注册表（key = type, value = NotificationTemplate） */
  private templates: Map<string, NotificationTemplate> = new Map();

  /** 用户限流（key = userId, value = { count, windowStart }） */
  private rateLimit: Map<string, { count: number; windowStart: number }> = new Map();

  /** 每用户每分钟最大通知数 */
  private readonly RATE_LIMIT_PER_MINUTE = 30;

  constructor(options: FjnServiceOptions = {}) {
    super({ ...options, serviceName: options.serviceName ?? 'FjnNotificationService' });
    this.registerDefaultTemplates();
  }

  // ==========================================================
  // 3.0 工具方法
  // ==========================================================

  private registerDefaultTemplates() {
    // 默认模板
    const defaults: NotificationTemplate[] = [
      {
        type: NOTIFICATION_TYPE.ORDER_PAID,
        titleTemplate: '订单已支付',
        contentTemplate: '您的订单 {orderNo} 已支付成功，金额 {amount} {currency}。',
        channels: ['in_app', 'email', 'sms'],
        variables: ['orderNo', 'amount', 'currency'],
      },
      {
        type: NOTIFICATION_TYPE.POINTS_EARNED,
        titleTemplate: '积分到账',
        contentTemplate: '您获得了 {amount} 积分，当前来源 {source}。',
        channels: ['in_app'],
        variables: ['amount', 'source'],
      },
      {
        type: NOTIFICATION_TYPE.NFT_MINTED,
        titleTemplate: 'NFT 已铸造',
        contentTemplate: '您的 {collectionName} NFT 已铸造成功 #{tokenId}。',
        channels: ['in_app', 'email'],
        variables: ['collectionName', 'tokenId'],
      },
      {
        type: NOTIFICATION_TYPE.RELEASE_CLAIMABLE,
        titleTemplate: '奖励可领取',
        contentTemplate: '您有 {amount} 奖励可领取，截止 {deadline}。',
        channels: ['in_app', 'email', 'sms', 'push'],
        variables: ['amount', 'deadline'],
      },
      {
        type: NOTIFICATION_TYPE.SPORTS_ENTRY_WON,
        titleTemplate: '竞猜胜利',
        contentTemplate: '您的投注 {entryNo} 已胜出，赢得 {payout}。',
        channels: ['in_app', 'email', 'sms', 'push'],
        variables: ['entryNo', 'payout'],
      },
      {
        type: NOTIFICATION_TYPE.SYSTEM_SECURITY_ALERT,
        titleTemplate: '安全告警',
        contentTemplate: '检测到您的账户存在异常活动：{description}',
        channels: ['in_app', 'email', 'sms', 'push'],
        variables: ['description'],
      },
    ];
    for (const t of defaults) {
      this.templates.set(t.type, t);
    }
  }

  /** 注册模板 */
  registerTemplate(template: NotificationTemplate) {
    this.templates.set(template.type, template);
  }

  /** 渲染模板 */
  private renderTemplate(
    template: string,
    variables: Record<string, string | number>,
  ): string {
    return template.replace(/\{(\w+)\}/g, (_, key) => {
      const v = variables[key];
      if (v === undefined || v === null) return `{${key}}`;
      return String(v);
    });
  }

  /** 校验限流 */
  private checkRateLimit(userId: string) {
    const now = Date.now();
    const window = this.rateLimit.get(userId);
    if (!window || now - window.windowStart > 60_000) {
      this.rateLimit.set(userId, { count: 1, windowStart: now });
      return;
    }
    if (window.count >= this.RATE_LIMIT_PER_MINUTE) {
      throw new NotificationRateLimitExceededError({
        userId,
        count: window.count,
        limit: this.RATE_LIMIT_PER_MINUTE,
      });
    }
    window.count++;
  }

  /** 发出 outbox 事件 */
  private async emitEvent(
    tx: any,
    eventType: string,
    payload: Record<string, unknown>,
    source: FjnNotificationEventSource = NOTIFICATION_EVENT_SOURCES.NOTIFICATION_SERVICE,
  ): Promise<void> {
    await (tx as any).outboxEvent.create({
      data: {
        eventType,
        payload: { ...payload, occurred_at: new Date().toISOString(), source },
        status: 'pending',
        retryCount: 0,
      },
    });
  }

  // ==========================================================
  // 3.1 send 核心
  // ==========================================================

  /**
   * 发送通知
   *  - 校验必填 + 限流
   *  - 应用模板（如有）
   *  - 写站内信（CoreNotification）
   *  - 触发 email/sms/push outbox 事件
   *  - 写 outbox SENT 事件
   */
  async send(input: SendNotificationInput) {
    if (!input.userId) throw new NotificationUserIdRequiredError();
    if (!isValidNotificationType(input.type)) {
      throw new NotificationTypeInvalidError({ type: input.type });
    }
    if (input.priority && !isValidNotificationPriority(input.priority)) {
      throw new NotificationPriorityInvalidError({ priority: input.priority });
    }

    const priority = input.priority ?? NOTIFICATION_PRIORITY.NORMAL;
    const channels = input.channels ?? NOTIFICATION_DEFAULT_CHANNELS[input.type] ?? ['in_app'];
    if (channels.length === 0) {
      throw new NotificationChannelsRequiredError({ type: input.type });
    }
    // 校验去重
    const unique = new Set(channels);
    if (unique.size !== channels.length) {
      throw new NotificationChannelDuplicateError({ channels });
    }
    for (const c of channels) {
      if (!isValidNotificationChannel(c)) {
        throw new NotificationChannelInvalidError({ channel: c });
      }
    }

    // 限流
    if (!input.bypassPreference) {
      this.checkRateLimit(input.userId);
    }

    // 应用模板
    let title = input.title;
    let content = input.content;
    if (!title || !content) {
      const template = this.templates.get(input.type);
      if (template) {
        // 校验必填变量
        if (input.variables) {
          for (const v of template.variables) {
            if (input.variables[v] === undefined) {
              throw new NotificationVariableMissingError({
                type: input.type,
                variable: v,
              });
            }
          }
        }
        title = title || this.renderTemplate(template.titleTemplate, input.variables ?? {});
        content = content || this.renderTemplate(template.contentTemplate, input.variables ?? {});
      } else {
        if (!title) throw new NotificationTitleRequiredError({ type: input.type });
        if (!content) throw new NotificationContentRequiredError({ type: input.type });
      }
    }

    // 计算 expiresAt
    const ttlHours = NOTIFICATION_DEFAULT_TTL_HOURS[priority] ?? 72;
    const expiresAt = new Date(Date.now() + ttlHours * 3600 * 1000);

    // 事务
    const tx = input.tx ?? this.prisma;

    const created = await (tx as any).coreNotification.create({
      data: {
        userId: input.userId,
        type: input.type,
        title: title!,
        content: content!,
        read: false,
        actionUrl: input.actionUrl ?? null,
      },
    });

    // 触发渠道分发
    for (const channel of channels) {
      if (channel === NOTIFICATION_CHANNEL.IN_APP) {
        // 站内信已直接写入
        await this.emitEvent(tx, NOTIFICATION_EVENTS.CHANNEL_DELIVERED, {
          notificationId: created.id,
          channel: NOTIFICATION_CHANNEL.IN_APP,
          userId: input.userId,
          deliveredAt: new Date().toISOString(),
        });
      } else {
        // 邮件/短信/推送/Webhook：触发 outbox 事件，由 worker 异步分发
        await this.emitEvent(tx, NOTIFICATION_EVENTS.CHANNEL_DISPATCHED, {
          notificationId: created.id,
          channel,
          userId: input.userId,
          title,
          content,
          variables: input.variables ?? {},
          priority,
          relatedType: input.relatedType ?? null,
          relatedId: input.relatedId ?? null,
          relatedNo: input.relatedNo ?? null,
          actionUrl: input.actionUrl ?? null,
          expiresAt: expiresAt.toISOString(),
        });
      }
    }

    await this.emitEvent(tx, NOTIFICATION_EVENTS.SENT, {
      notificationId: created.id,
      userId: input.userId,
      type: input.type,
      channels,
      priority,
      relatedType: input.relatedType ?? null,
      relatedId: input.relatedId ?? null,
    });

    this.log('info', `Notification sent: ${input.type}`, {
      userId: input.userId,
      channels,
      priority,
    });

    return {
      id: created.id,
      userId: input.userId,
      type: input.type,
      title: title!,
      content: content!,
      read: false,
      actionUrl: input.actionUrl ?? null,
      channels,
      priority,
      status: NOTIFICATION_STATUS.SENT,
      relatedType: input.relatedType ?? null,
      relatedId: input.relatedId ?? null,
      relatedNo: input.relatedNo ?? null,
      retryCount: 0,
      expiresAt,
      createdAt: created.createdAt,
      readAt: null,
    } as NotificationView;
  }

  /** 批量发送 */
  async sendBatch(input: SendBatchInput) {
    if (!input.tx) {
      throw new NotificationBatchTooLargeError({ reason: 'tx is required' });
    }
    if (input.items.length > 1000) {
      throw new NotificationBatchTooLargeError({ size: input.items.length, max: 1000 });
    }
    const results: NotificationView[] = [];
    for (const item of input.items) {
      const r = await this.send({ ...item, tx: input.tx });
      results.push(r);
    }
    await this.emitEvent(input.tx, NOTIFICATION_EVENTS.BATCH_SENT, {
      count: results.length,
    });
    return results;
  }

  // ==========================================================
  // 3.2 标记已读
  // ==========================================================

  async markRead(input: MarkReadInput) {
    if (!input.notificationId) throw new NotificationNotFoundError();
    const notif = await (this.prisma as any).coreNotification.findUnique({
      where: { id: input.notificationId },
    });
    if (!notif) throw new NotificationNotFoundError({ notificationId: input.notificationId });
    if (notif.userId !== input.userId) {
      throw new NotificationNotOwnerError({ notificationId: input.notificationId });
    }
    if (notif.read) throw new NotificationAlreadyReadError({ notificationId: input.notificationId });

    const updated = await (this.prisma as any).coreNotification.update({
      where: { id: input.notificationId },
      data: { read: true, readAt: new Date() },
    });

    await this.emitEvent(this.prisma, NOTIFICATION_EVENTS.READ, {
      notificationId: input.notificationId,
      userId: input.userId,
      readAt: updated.readAt.toISOString(),
    });

    this.log('info', `Notification read: ${input.notificationId}`);
    return updated;
  }

  async markAllRead(input: MarkAllReadInput) {
    const where: any = { userId: input.userId, read: false };
    if (input.type) where.type = input.type;
    if (input.beforeTime) where.createdAt = { lt: input.beforeTime };

    const result = await (this.prisma as any).coreNotification.updateMany({
      where,
      data: { read: true, readAt: new Date() },
    });

    await this.emitEvent(this.prisma, NOTIFICATION_EVENTS.READ_ALL, {
      userId: input.userId,
      count: result.count,
      type: input.type ?? null,
    });

    this.log('info', `All notifications read: ${result.count} for user ${input.userId}`);
    return { count: result.count };
  }

  // ==========================================================
  // 3.3 偏好管理
  // ==========================================================

  async getPreferences(userId: string): Promise<NotificationPreferences> {
    // 简化：从 user 记录中读 metadata.notificationPreferences
    const user = await (this.prisma as any).coreUser.findUnique({
      where: { id: userId },
    });
    const meta = (user?.metadata as any) ?? {};
    const prefs = meta.notificationPreferences ?? {};
    return {
      userId,
      inApp: prefs.inApp ?? true,
      email: prefs.email ?? true,
      sms: prefs.sms ?? false,
      push: prefs.push ?? true,
      webhook: prefs.webhook ?? false,
      quietHoursStart: prefs.quietHoursStart ?? null,
      quietHoursEnd: prefs.quietHoursEnd ?? null,
      muted: prefs.muted ?? false,
    };
  }

  async updatePreferences(input: UpdatePreferencesInput) {
    const user = await (this.prisma as any).coreUser.findUnique({
      where: { id: input.userId },
    });
    if (!user) throw new NotificationUserIdRequiredError();
    const meta = (user.metadata as any) ?? {};
    const newPrefs = {
      ...(meta.notificationPreferences ?? {}),
      ...input.preferences,
      ...(input.quietHoursStart !== undefined ? { quietHoursStart: input.quietHoursStart } : {}),
      ...(input.quietHoursEnd !== undefined ? { quietHoursEnd: input.quietHoursEnd } : {}),
      ...(input.muted !== undefined ? { muted: input.muted } : {}),
    };
    await (this.prisma as any).coreUser.update({
      where: { id: input.userId },
      data: {
        metadata: { ...meta, notificationPreferences: newPrefs } as Prisma.InputJsonValue,
      },
    });
    await this.emitEvent(this.prisma, NOTIFICATION_EVENTS.PREFERENCE_UPDATED, {
      userId: input.userId,
      preferences: newPrefs,
    });
    this.log('info', `Notification preferences updated for ${input.userId}`);
    return this.getPreferences(input.userId);
  }

  // ==========================================================
  // 3.4 查询
  // ==========================================================

  async list(input: ListNotificationsInput) {
    const page = input.page ?? 1;
    const pageSize = Math.min(input.pageSize ?? 20, 100);
    const where: any = { userId: input.userId };
    if (input.read !== undefined) where.read = input.read;
    if (input.type) where.type = input.type;
    if (input.startTime || input.endTime) {
      where.createdAt = {};
      if (input.startTime) where.createdAt.gte = input.startTime;
      if (input.endTime) where.createdAt.lte = input.endTime;
    }

    const [items, total, unread] = await Promise.all([
      (this.prisma as any).coreNotification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      (this.prisma as any).coreNotification.count({ where }),
      (this.prisma as any).coreNotification.count({
        where: { userId: input.userId, read: false },
      }),
    ]);

    return {
      items: items.map((n: any) => ({
        id: n.id,
        userId: n.userId,
        type: n.type,
        title: n.title,
        content: n.content,
        read: n.read,
        actionUrl: n.actionUrl,
        channels: ['in_app'],
        priority: 'normal',
        status: 'sent' as FjnNotificationStatus,
        relatedType: null,
        relatedId: null,
        relatedNo: null,
        retryCount: 0,
        expiresAt: null,
        createdAt: n.createdAt,
        readAt: n.readAt,
      })) as NotificationView[],
      total,
      unread,
      page,
      pageSize,
    };
  }

  /** 管理后台：跨用户列出通知（分页） */
  async adminList(input: { userId?: string; type?: FjnNotificationType; read?: boolean; page?: number; pageSize?: number } = {}) {
    const page = input.page ?? 1;
    const pageSize = Math.min(input.pageSize ?? 20, 100);
    const where: any = {};
    if (input.userId) where.userId = input.userId;
    if (input.type) where.type = input.type;
    if (input.read !== undefined) where.read = input.read;

    const [items, total] = await Promise.all([
      (this.prisma as any).coreNotification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      (this.prisma as any).coreNotification.count({ where }),
    ]);

    return { items, total, page, pageSize };
  }

  // ==========================================================
  // 3.5 工具：清理过期
  // ==========================================================

  async purgeExpired(olderThanDays = 30) {
    const before = new Date(Date.now() - olderThanDays * 86400 * 1000);
    const result = await (this.prisma as any).coreNotification.deleteMany({
      where: { createdAt: { lt: before } },
    });
    this.log('info', `Purged ${result.count} expired notifications`);
    return { purged: result.count };
  }
}

// 工厂函数
export function createFjnNotificationService(options: FjnServiceOptions = {}) {
  return new FjnNotificationService(options);
}
