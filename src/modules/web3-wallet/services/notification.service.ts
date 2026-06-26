/**
 * Web3 钱包模块 - 通知服务
 *
 * 提供通知管理功能，包括交易通知、安全通知、系统通知等
 * 支持多种通知渠道和通知偏好设置
 */

import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';

@Injectable()
export class NotificationService {
  private notifications: Map<string, NotificationItem[]> = new Map();
  private preferences: Map<string, NotificationPreferences> = new Map();
  private unreadCounts: Map<string, number> = new Map();

  /**
   * 获取通知列表
   *
   * @param userId 用户ID
   * @param type 通知类型（可选）
   * @param isRead 是否已读（可选）
   * @param page 页码
   * @param pageSize 每页数量
   * @returns 通知列表和总数
   */
  async getNotifications(
    userId: string,
    type?: NotificationType,
    isRead?: boolean,
    page: number = 1,
    pageSize: number = 20,
  ): Promise<{ list: NotificationItem[]; total: number }> {
    let userNotifications = this.notifications.get(userId) || [];

    if (type) {
      userNotifications = userNotifications.filter((n) => n.type === type);
    }

    if (isRead !== undefined) {
      userNotifications = userNotifications.filter((n) => n.isRead === isRead);
    }

    userNotifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const total = userNotifications.length;
    const start = (page - 1) * pageSize;
    const list = userNotifications.slice(start, start + pageSize);

    return { list, total };
  }

  /**
   * 获取通知详情
   *
   * @param userId 用户ID
   * @param notificationId 通知ID
   * @returns 通知详情
   */
  async getNotificationById(userId: string, notificationId: string): Promise<NotificationItem> {
    const userNotifications = this.notifications.get(userId) || [];
    const notification = userNotifications.find((n) => n.id === notificationId);

    if (!notification) {
      throw new NotFoundException('通知不存在');
    }

    return notification;
  }

  /**
   * 发送通知
   *
   * @param userId 用户ID
   * @param type 通知类型
   * @param title 标题
   * @param content 内容
   * @param metadata 元数据
   * @param priority 优先级
   * @param channels 通知渠道
   * @returns 发送的通知
   */
  async sendNotification(
    userId: string,
    type: NotificationType,
    title: string,
    content: string,
    metadata?: Record<string, any>,
    priority: NotificationPriority = NotificationPriority.NORMAL,
    channels: NotificationChannel[] = [NotificationChannel.IN_APP],
  ): Promise<NotificationItem> {
    const userNotifications = this.notifications.get(userId) || [];

    const notificationId = 'notif_' + this.generateRandomId();

    const notification: NotificationItem = {
      id: notificationId,
      userId,
      type,
      title,
      content,
      metadata,
      priority,
      channels,
      isRead: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    userNotifications.unshift(notification);
    this.notifications.set(userId, userNotifications);

    const currentUnread = this.unreadCounts.get(userId) || 0;
    this.unreadCounts.set(userId, currentUnread + 1);

    return notification;
  }

  /**
   * 批量发送通知
   *
   * @param userIds 用户ID列表
   * @param type 通知类型
   * @param title 标题
   * @param content 内容
   * @param metadata 元数据
   * @returns 发送的通知数量
   */
  async batchSendNotifications(
    userIds: string[],
    type: NotificationType,
    title: string,
    content: string,
    metadata?: Record<string, any>,
  ): Promise<number> {
    let count = 0;

    for (const userId of userIds) {
      await this.sendNotification(userId, type, title, content, metadata);
      count++;
    }

    return count;
  }

  /**
   * 标记通知为已读
   *
   * @param userId 用户ID
   * @param notificationId 通知ID
   * @returns 更新后的通知
   */
  async markAsRead(userId: string, notificationId: string): Promise<NotificationItem> {
    const userNotifications = this.notifications.get(userId) || [];
    const index = userNotifications.findIndex((n) => n.id === notificationId);

    if (index === -1) {
      throw new NotFoundException('通知不存在');
    }

    if (!userNotifications[index].isRead) {
      userNotifications[index].isRead = true;
      userNotifications[index].readAt = new Date();
      userNotifications[index].updatedAt = new Date();

      const currentUnread = this.unreadCounts.get(userId) || 0;
      if (currentUnread > 0) {
        this.unreadCounts.set(userId, currentUnread - 1);
      }
    }

    this.notifications.set(userId, userNotifications);

    return userNotifications[index];
  }

  /**
   * 标记全部通知为已读
   *
   * @param userId 用户ID
   * @param type 通知类型（可选）
   * @returns 标记的数量
   */
  async markAllAsRead(userId: string, type?: NotificationType): Promise<number> {
    const userNotifications = this.notifications.get(userId) || [];
    let count = 0;

    for (const notification of userNotifications) {
      if (!notification.isRead && (!type || notification.type === type)) {
        notification.isRead = true;
        notification.readAt = new Date();
        notification.updatedAt = new Date();
        count++;
      }
    }

    this.notifications.set(userId, userNotifications);
    this.unreadCounts.set(userId, 0);

    return count;
  }

  /**
   * 删除通知
   *
   * @param userId 用户ID
   * @param notificationId 通知ID
   */
  async deleteNotification(userId: string, notificationId: string): Promise<void> {
    const userNotifications = this.notifications.get(userId) || [];
    const index = userNotifications.findIndex((n) => n.id === notificationId);

    if (index === -1) {
      throw new NotFoundException('通知不存在');
    }

    const wasUnread = !userNotifications[index].isRead;

    userNotifications.splice(index, 1);
    this.notifications.set(userId, userNotifications);

    if (wasUnread) {
      const currentUnread = this.unreadCounts.get(userId) || 0;
      if (currentUnread > 0) {
        this.unreadCounts.set(userId, currentUnread - 1);
      }
    }
  }

  /**
   * 清空所有通知
   *
   * @param userId 用户ID
   * @param type 通知类型（可选）
   * @returns 删除的数量
   */
  async clearAllNotifications(userId: string, type?: NotificationType): Promise<number> {
    const userNotifications = this.notifications.get(userId) || [];
    const initialCount = userNotifications.length;

    if (type) {
      const remaining = userNotifications.filter((n) => n.type !== type);
      this.notifications.set(userId, remaining);

      const unreadRemaining = remaining.filter((n) => !n.isRead).length;
      this.unreadCounts.set(userId, unreadRemaining);

      return initialCount - remaining.length;
    } else {
      this.notifications.set(userId, []);
      this.unreadCounts.set(userId, 0);
      return initialCount;
    }
  }

  /**
   * 获取未读通知数量
   *
   * @param userId 用户ID
   * @param type 通知类型（可选）
   * @returns 未读数量
   */
  async getUnreadCount(userId: string, type?: NotificationType): Promise<number> {
    if (!type) {
      return this.unreadCounts.get(userId) || 0;
    }

    const userNotifications = this.notifications.get(userId) || [];
    return userNotifications.filter((n) => !n.isRead && n.type === type).length;
  }

  /**
   * 获取通知偏好设置
   *
   * @param userId 用户ID
   * @returns 通知偏好设置
   */
  async getPreferences(userId: string): Promise<NotificationPreferences> {
    return this.preferences.get(userId) || this.getDefaultPreferences();
  }

  /**
   * 更新通知偏好设置
   *
   * @param userId 用户ID
   * @param preferences 偏好设置
   * @returns 更新后的偏好设置
   */
  async updatePreferences(
    userId: string,
    preferences: Partial<NotificationPreferences>,
  ): Promise<NotificationPreferences> {
    const current = this.preferences.get(userId) || this.getDefaultPreferences();

    const updated: NotificationPreferences = {
      ...current,
      ...preferences,
      updatedAt: new Date(),
    };

    this.preferences.set(userId, updated);

    return updated;
  }

  /**
   * 发送交易通知
   *
   * @param userId 用户ID
   * @param walletId 钱包ID
   * @param txHash 交易哈希
   * @param type 交易类型
   * @param amount 金额
   * @param chain 链
   * @param status 状态
   */
  async sendTransactionNotification(
    userId: string,
    walletId: string,
    txHash: string,
    type: string,
    amount: string,
    chain: string,
    status: string,
  ): Promise<void> {
    const titleMap: Record<string, string> = {
      incoming: '收到转账',
      outgoing: '转账成功',
      failed: '交易失败',
      confirmed: '交易已确认',
    };

    const title = titleMap[type] || '交易通知';
    const content = `交易状态: ${status}`;

    await this.sendNotification(
      userId,
      NotificationType.TRANSACTION,
      title,
      content,
      {
        walletId,
        txHash,
        amount,
        chain,
        status,
      },
      NotificationPriority.NORMAL,
      [NotificationChannel.IN_APP, NotificationChannel.PUSH],
    );
  }

  /**
   * 发送安全通知
   *
   * @param userId 用户ID
   * @param event 安全事件
   * @param details 详情
   * @param severity 严重程度
   */
  async sendSecurityNotification(
    userId: string,
    event: string,
    details: string,
    severity: NotificationPriority = NotificationPriority.HIGH,
  ): Promise<void> {
    await this.sendNotification(
      userId,
      NotificationType.SECURITY,
      `安全提醒: ${event}`,
      details,
      { event },
      severity,
      [NotificationChannel.IN_APP, NotificationChannel.PUSH, NotificationChannel.EMAIL],
    );
  }

  /**
   * 发送系统通知
   *
   * @param userId 用户ID
   * @param title 标题
   * @param content 内容
   */
  async sendSystemNotification(userId: string, title: string, content: string): Promise<void> {
    await this.sendNotification(
      userId,
      NotificationType.SYSTEM,
      title,
      content,
      undefined,
      NotificationPriority.NORMAL,
      [NotificationChannel.IN_APP],
    );
  }

  /**
   * 获取通知统计
   *
   * @param userId 用户ID
   * @returns 统计信息
   */
  async getStats(userId: string): Promise<Record<string, any>> {
    const userNotifications = this.notifications.get(userId) || [];
    const unread = userNotifications.filter((n) => !n.isRead).length;

    const byType: Record<string, number> = {};
    const byReadStatus = {
      read: userNotifications.filter((n) => n.isRead).length,
      unread,
    };

    for (const notification of userNotifications) {
      byType[notification.type] = (byType[notification.type] || 0) + 1;
    }

    return {
      total: userNotifications.length,
      unread,
      byType,
      byReadStatus,
    };
  }

  // ============================================================
  // 私有方法
  // ============================================================

  /**
   * 获取默认偏好设置
   */
  private getDefaultPreferences(): NotificationPreferences {
    return {
      pushEnabled: true,
      emailEnabled: true,
      inAppEnabled: true,
      transactionNotifications: true,
      securityNotifications: true,
      systemNotifications: true,
      priceAlerts: true,
      quietHoursEnabled: false,
      quietHoursStart: '22:00',
      quietHoursEnd: '08:00',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  /**
   * 生成随机 ID
   */
  private generateRandomId(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }
}

/**
 * 通知类型
 */
enum NotificationType {
  TRANSACTION = 'transaction',
  SECURITY = 'security',
  SYSTEM = 'system',
  PRICE_ALERT = 'price_alert',
  WALLET = 'wallet',
  MARKETING = 'marketing',
}

/**
 * 通知优先级
 */
enum NotificationPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent',
}

/**
 * 通知渠道
 */
enum NotificationChannel {
  IN_APP = 'in_app',
  PUSH = 'push',
  EMAIL = 'email',
  SMS = 'sms',
}

/**
 * 通知项
 */
interface NotificationItem {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  content: string;
  metadata?: Record<string, any>;
  priority: NotificationPriority;
  channels: NotificationChannel[];
  isRead: boolean;
  readAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 通知偏好设置
 */
interface NotificationPreferences {
  pushEnabled: boolean;
  emailEnabled: boolean;
  inAppEnabled: boolean;
  transactionNotifications: boolean;
  securityNotifications: boolean;
  systemNotifications: boolean;
  priceAlerts: boolean;
  quietHoursEnabled: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
  createdAt: Date;
  updatedAt: Date;
}
