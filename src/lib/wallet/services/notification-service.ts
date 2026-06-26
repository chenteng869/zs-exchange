/**
 * 通知服务模块
 *
 * 通知类型：
 *  - 交易通知
 *  - 价格告警
 *  - 安全告警
 *  - 系统通知
 *  - DApp 请求通知
 *  - 桥接状态通知
 *  - 质押收益通知
 *  - 治理投票通知
 *
 * 通知渠道：
 *  - 应用内通知
 *  - 浏览器通知
 *  - 邮件通知
 *  - 短信通知
 *  - Telegram Bot
 *  - Discord Webhook
 *  - Webhook
 */

// ============================================================================
// 类型定义
// ============================================================================

export interface Notification {
  id: string;
  type: NotificationType;
  category: NotificationCategory;
  title: string;
  message: string;
  description?: string;
  icon?: string;
  image?: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  status: 'unread' | 'read' | 'archived';
  createdAt: number;
  updatedAt: number;
  readAt?: number;
  expiresAt?: number;
  data?: Record<string, any>;
  actions?: NotificationAction[];
  channels: NotificationChannel[];
  sender?: string;
  transactionHash?: string;
  chainId?: number;
  isSticky?: boolean;
  isSilent?: boolean;
  groupId?: string;
  relatedId?: string;
}

export type NotificationType =
  | 'transaction_received'
  | 'transaction_sent'
  | 'transaction_confirmed'
  | 'transaction_failed'
  | 'transaction_speedup'
  | 'transaction_cancel'
  | 'price_alert'
  | 'price_surge'
  | 'price_drop'
  | 'security_alert'
  | 'new_device'
  | 'new_login'
  | 'phishing_warning'
  | 'malicious_contract'
  | 'system_update'
  | 'system_maintenance'
  | 'wallet_backup_reminder'
  | 'dapp_request'
  | 'dapp_connection'
  | 'dapp_permission_change'
  | 'bridge_initiated'
  | 'bridge_completed'
  | 'bridge_failed'
  | 'staking_reward'
  | 'staking_unlocked'
  | 'governance_proposal'
  | 'governance_vote_reminder'
  | 'airdrop_available'
  | 'token_listing'
  | 'nft_listing'
  | 'nft_offer'
  | 'custom';

export type NotificationCategory =
  | 'transaction'
  | 'price'
  | 'security'
  | 'system'
  | 'dapp'
  | 'bridge'
  | 'staking'
  | 'governance'
  | 'nft'
  | 'other';

export type NotificationChannel =
  | 'in_app'
  | 'browser'
  | 'email'
  | 'sms'
  | 'telegram'
  | 'discord'
  | 'webhook'
  | 'push';

export interface NotificationAction {
  id: string;
  label: string;
  type: 'primary' | 'secondary' | 'danger';
  action: string;
  url?: string;
  method?: string;
  params?: Record<string, any>;
}

export interface NotificationSettings {
  enabled: boolean;
  doNotDisturb: DoNotDisturbSettings;
  channels: Record<NotificationChannel, ChannelSettings>;
  categories: Record<NotificationCategory, CategorySettings>;
  sounds: Record<string, SoundSettings>;
  vibration: boolean;
  badgeEnabled: boolean;
  previewInLockScreen: boolean;
  groupByCategory: boolean;
  maxNotifications: number;
  autoClearDays: number;
}

export interface DoNotDisturbSettings {
  enabled: boolean;
  startTime: string;
  endTime: string;
  allowUrgent: boolean;
  allowFrom?: string[];
}

export interface ChannelSettings {
  enabled: boolean;
  minPriority: 'low' | 'normal' | 'high' | 'urgent';
  sound?: string;
  vibration?: boolean;
  badge?: boolean;
}

export interface CategorySettings {
  enabled: boolean;
  channels: NotificationChannel[];
  sound?: string;
  vibrate?: boolean;
  badge?: boolean;
}

export interface SoundSettings {
  name: string;
  file: string;
  volume: number;
  vibration?: boolean;
}

export interface NotificationFilter {
  type?: NotificationType;
  category?: NotificationCategory;
  status?: 'unread' | 'read' | 'archived';
  priority?: string;
  channel?: NotificationChannel;
  startDate?: number;
  endDate?: number;
  search?: string;
  groupId?: string;
  sortBy?: 'createdAt' | 'priority';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}

export interface NotificationStats {
  total: number;
  unread: number;
  today: number;
  thisWeek: number;
  byCategory: Record<string, number>;
  byType: Record<string, number>;
  byPriority: Record<string, number>;
  unreadByCategory: Record<string, number>;
}

export interface WebhookConfig {
  id: string;
  name: string;
  url: string;
  method: 'POST' | 'GET';
  headers?: Record<string, string>;
  secret?: string;
  events: NotificationType[];
  enabled: boolean;
  createdAt: number;
  lastTriggered?: number;
  failureCount?: number;
}

export interface NotificationGroup {
  id: string;
  name: string;
  category: NotificationCategory;
  count: number;
  unreadCount: number;
  lastNotification?: Notification;
  notifications: Notification[];
}

// ============================================================================
// 默认配置
// ============================================================================

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  enabled: true,
  doNotDisturb: {
    enabled: false,
    startTime: '22:00',
    endTime: '08:00',
    allowUrgent: true,
  },
  channels: {
    in_app: { enabled: true, minPriority: 'low' },
    browser: { enabled: true, minPriority: 'normal' },
    email: { enabled: false, minPriority: 'high' },
    sms: { enabled: false, minPriority: 'urgent' },
    telegram: { enabled: false, minPriority: 'high' },
    discord: { enabled: false, minPriority: 'high' },
    webhook: { enabled: false, minPriority: 'normal' },
    push: { enabled: true, minPriority: 'normal' },
  },
  categories: {
    transaction: {
      enabled: true,
      channels: ['in_app', 'push', 'browser'],
    },
    price: {
      enabled: true,
      channels: ['in_app', 'push'],
    },
    security: {
      enabled: true,
      channels: ['in_app', 'push', 'browser', 'email'],
    },
    system: {
      enabled: true,
      channels: ['in_app'],
    },
    dapp: {
      enabled: true,
      channels: ['in_app', 'push'],
    },
    bridge: {
      enabled: true,
      channels: ['in_app', 'push'],
    },
    staking: {
      enabled: true,
      channels: ['in_app'],
    },
    governance: {
      enabled: false,
      channels: ['in_app', 'email'],
    },
    nft: {
      enabled: false,
      channels: ['in_app'],
    },
    other: {
      enabled: true,
      channels: ['in_app'],
    },
  },
  sounds: {
    default: { name: 'Default', file: 'default.mp3', volume: 0.5 },
    transaction: { name: 'Transaction', file: 'transaction.mp3', volume: 0.6 },
    security: { name: 'Security', file: 'security.mp3', volume: 0.8, vibration: true },
  },
  vibration: true,
  badgeEnabled: true,
  previewInLockScreen: true,
  groupByCategory: true,
  maxNotifications: 500,
  autoClearDays: 30,
};

// ============================================================================
// 通知服务
// ============================================================================

export class NotificationService {
  private notifications: Notification[] = [];
  private settings: NotificationSettings;
  private webhooks: WebhookConfig[] = [];
  private eventListeners: Map<string, Function[]> = new Map();
  private maxNotifications: number = 500;
  private unreadCount: number = 0;
  private isInitialized: boolean = false;
  private browserPermission: NotificationPermission = 'default';

  constructor(settings?: Partial<NotificationSettings>) {
    this.settings = { ...DEFAULT_NOTIFICATION_SETTINGS, ...settings };
    this.maxNotifications = this.settings.maxNotifications;
  }

  // ========================================================================
  // 初始化
  // ========================================================================

  /**
   * 初始化通知服务
   */
  async initialize(): Promise<boolean> {
    if (this.isInitialized) return true;

    try {
      if (typeof window !== 'undefined' && 'Notification' in window) {
        this.browserPermission = Notification.permission;
      }

      this.isInitialized = true;
      return true;
    } catch (e) {
      console.error('Failed to initialize notification service:', e);
      return false;
    }
  }

  /**
   * 请求浏览器通知权限
   */
  async requestBrowserPermission(): Promise<NotificationPermission> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'denied';
    }

    try {
      const permission = await Notification.requestPermission();
      this.browserPermission = permission;
      return permission;
    } catch (e) {
      return 'denied';
    }
  }

  // ========================================================================
  // 发送通知
  // ========================================================================

  /**
   * 发送通知
   */
  async send(
    notification: Omit<Notification, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'channels'> & {
      channels?: NotificationChannel[];
    }
  ): Promise<Notification> {
    const fullNotification: Notification = {
      id: `notif_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      status: 'unread',
      channels: notification.channels || ['in_app'],
      priority: notification.priority || 'normal',
      ...notification,
    };

    if (this.shouldSend(fullNotification)) {
      this.notifications.unshift(fullNotification);
      this.unreadCount++;
      this.cleanupOldNotifications();
      this.emit('notification', fullNotification);
      this.emit('unread_count_changed', this.unreadCount);

      if (fullNotification.channels.includes('browser')) {
        this.sendBrowserNotification(fullNotification);
      }

      if (fullNotification.channels.includes('webhook')) {
        this.triggerWebhooks(fullNotification);
      }
    }

    return fullNotification;
  }

  private shouldSend(notification: Notification): boolean {
    if (!this.settings.enabled) return false;

    const categorySettings = this.settings.categories[notification.category];
    if (!categorySettings?.enabled) return false;

    if (this.isDoNotDisturb()) {
      if (notification.priority !== 'urgent' || !this.settings.doNotDisturb.allowUrgent) {
        return false;
      }
    }

    const hasValidChannel = notification.channels.some((channel) => {
      const channelSettings = this.settings.channels[channel];
      if (!channelSettings?.enabled) return false;
      return this.isPrioritySufficient(notification.priority, channelSettings.minPriority);
    });

    return hasValidChannel;
  }

  private isPrioritySufficient(
    priority: string,
    minPriority: string
  ): boolean {
    const priorities = ['low', 'normal', 'high', 'urgent'];
    const priorityIndex = priorities.indexOf(priority);
    const minIndex = priorities.indexOf(minPriority);
    return priorityIndex >= minIndex;
  }

  private isDoNotDisturb(): boolean {
    if (!this.settings.doNotDisturb.enabled) return false;

    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const { startTime, endTime } = this.settings.doNotDisturb;

    if (startTime <= endTime) {
      return currentTime >= startTime && currentTime < endTime;
    } else {
      return currentTime >= startTime || currentTime < endTime;
    }
  }

  // ========================================================================
  // 浏览器通知
  // ========================================================================

  private sendBrowserNotification(notification: Notification): void {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    if (this.browserPermission !== 'granted') return;
    if (notification.isSilent) return;

    try {
      const browserNotif = new Notification(notification.title, {
        body: notification.message,
        icon: notification.icon,
        tag: notification.id,
        requireInteraction: notification.priority === 'urgent',
        silent: notification.isSilent || false,
      });

      browserNotif.onclick = () => {
        this.emit('notification_clicked', notification);
        browserNotif.close();
      };

      setTimeout(() => {
        browserNotif.close();
      }, 5000);
    } catch (e) {
      console.error('Failed to send browser notification:', e);
    }
  }

  // ========================================================================
  // Webhook
  // ========================================================================

  private async triggerWebhooks(notification: Notification): Promise<void> {
    for (const webhook of this.webhooks) {
      if (!webhook.enabled) continue;
      if (!webhook.events.includes(notification.type)) continue;

      try {
        await fetch(webhook.url, {
          method: webhook.method,
          headers: {
            'Content-Type': 'application/json',
            ...webhook.headers,
          },
          body: JSON.stringify(notification),
        });
        webhook.lastTriggered = Date.now();
      } catch (e) {
        console.error(`Webhook ${webhook.name} failed:`, e);
        webhook.failureCount = (webhook.failureCount || 0) + 1;
      }
    }
  }

  /**
   * 添加 Webhook
   */
  addWebhook(webhook: Omit<WebhookConfig, 'id' | 'createdAt'>): string {
    const newWebhook: WebhookConfig = {
      ...webhook,
      id: `webhook_${Date.now()}`,
      createdAt: Date.now(),
    };
    this.webhooks.push(newWebhook);
    return newWebhook.id;
  }

  /**
   * 移除 Webhook
   */
  removeWebhook(webhookId: string): boolean {
    const index = this.webhooks.findIndex((w) => w.id === webhookId);
    if (index > -1) {
      this.webhooks.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * 获取 Webhook 列表
   */
  getWebhooks(): WebhookConfig[] {
    return [...this.webhooks];
  }

  // ========================================================================
  // 通知管理
  // ========================================================================

  /**
   * 获取通知列表
   */
  getNotifications(filter: NotificationFilter = {}): {
    notifications: Notification[];
    total: number;
    page: number;
    pageSize: number;
  } {
    let notifications = [...this.notifications];

    if (filter.type) {
      notifications = notifications.filter((n) => n.type === filter.type);
    }
    if (filter.category) {
      notifications = notifications.filter((n) => n.category === filter.category);
    }
    if (filter.status) {
      notifications = notifications.filter((n) => n.status === filter.status);
    }
    if (filter.priority) {
      notifications = notifications.filter((n) => n.priority === filter.priority);
    }
    if (filter.channel) {
      notifications = notifications.filter((n) => n.channels.includes(filter.channel!));
    }
    if (filter.startDate) {
      notifications = notifications.filter((n) => n.createdAt >= filter.startDate!);
    }
    if (filter.endDate) {
      notifications = notifications.filter((n) => n.createdAt <= filter.endDate!);
    }
    if (filter.groupId) {
      notifications = notifications.filter((n) => n.groupId === filter.groupId);
    }
    if (filter.search) {
      const search = filter.search.toLowerCase();
      notifications = notifications.filter(
        (n) =>
          n.title.toLowerCase().includes(search) ||
          n.message.toLowerCase().includes(search) ||
          n.description?.toLowerCase().includes(search)
      );
    }

    const sortBy = filter.sortBy || 'createdAt';
    const sortOrder = filter.sortOrder || 'desc';
    notifications.sort((a, b) => {
      let diff = 0;
      switch (sortBy) {
        case 'createdAt':
          diff = a.createdAt - b.createdAt;
          break;
        case 'priority':
          const priorities = ['low', 'normal', 'high', 'urgent'];
          diff = priorities.indexOf(a.priority) - priorities.indexOf(b.priority);
          break;
      }
      return sortOrder === 'desc' ? -diff : diff;
    });

    const total = notifications.length;
    const page = filter.page || 1;
    const pageSize = filter.pageSize || 20;
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    notifications = notifications.slice(start, end);

    return { notifications, total, page, pageSize };
  }

  /**
   * 标记为已读
   */
  markAsRead(notificationId: string): boolean {
    const notification = this.notifications.find((n) => n.id === notificationId);
    if (!notification) return false;

    if (notification.status === 'unread') {
      notification.status = 'read';
      notification.readAt = Date.now();
      notification.updatedAt = Date.now();
      this.unreadCount = Math.max(0, this.unreadCount - 1);
      this.emit('unread_count_changed', this.unreadCount);
    }

    return true;
  }

  /**
   * 标记所有为已读
   */
  markAllAsRead(category?: NotificationCategory): number {
    let count = 0;
    for (const notification of this.notifications) {
      if (notification.status === 'unread') {
        if (category && notification.category !== category) continue;
        notification.status = 'read';
        notification.readAt = Date.now();
        notification.updatedAt = Date.now();
        count++;
      }
    }
    this.unreadCount = Math.max(0, this.unreadCount - count);
    this.emit('unread_count_changed', this.unreadCount);
    return count;
  }

  /**
   * 归档通知
   */
  archive(notificationId: string): boolean {
    const notification = this.notifications.find((n) => n.id === notificationId);
    if (!notification) return false;

    if (notification.status === 'unread') {
      this.unreadCount = Math.max(0, this.unreadCount - 1);
    }

    notification.status = 'archived';
    notification.updatedAt = Date.now();
    this.emit('unread_count_changed', this.unreadCount);
    return true;
  }

  /**
   * 删除通知
   */
  remove(notificationId: string): boolean {
    const index = this.notifications.findIndex((n) => n.id === notificationId);
    if (index > -1) {
      if (this.notifications[index].status === 'unread') {
        this.unreadCount = Math.max(0, this.unreadCount - 1);
      }
      this.notifications.splice(index, 1);
      this.emit('unread_count_changed', this.unreadCount);
      return true;
    }
    return false;
  }

  /**
   * 清除所有通知
   */
  clearAll(): void {
    this.notifications = [];
    this.unreadCount = 0;
    this.emit('unread_count_changed', 0);
  }

  /**
   * 获取未读数量
   */
  getUnreadCount(category?: NotificationCategory): number {
    if (!category) return this.unreadCount;

    let count = 0;
    for (const n of this.notifications) {
      if (n.status === 'unread' && n.category === category) {
        count++;
      }
    }
    return count;
  }

  // ========================================================================
  // 分组
  // ========================================================================

  /**
   * 获取分组通知
   */
  getGroupedNotifications(): NotificationGroup[] {
    const groups: Map<string, NotificationGroup> = new Map();

    for (const notification of this.notifications) {
      const groupKey = this.settings.groupByCategory ? notification.category : (notification.groupId || 'other');

      let group = groups.get(groupKey);
      if (!group) {
        group = {
          id: groupKey,
          name: this.getCategoryName(notification.category),
          category: notification.category,
          count: 0,
          unreadCount: 0,
          notifications: [],
        };
        groups.set(groupKey, group);
      }

      group.count++;
      group.notifications.push(notification);
      if (notification.status === 'unread') {
        group.unreadCount++;
      }
      if (!group.lastNotification || notification.createdAt > group.lastNotification.createdAt) {
        group.lastNotification = notification;
      }
    }

    return Array.from(groups.values()).sort((a, b) => {
      const aTime = a.lastNotification?.createdAt || 0;
      const bTime = b.lastNotification?.createdAt || 0;
      return bTime - aTime;
    });
  }

  private getCategoryName(category: NotificationCategory): string {
    const names: Record<NotificationCategory, string> = {
      transaction: '交易',
      price: '价格',
      security: '安全',
      system: '系统',
      dapp: 'DApp',
      bridge: '跨链桥',
      staking: '质押',
      governance: '治理',
      nft: 'NFT',
      other: '其他',
    };
    return names[category] || category;
  }

  // ========================================================================
  // 统计
  // ========================================================================

  getStats(): NotificationStats {
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;
    const oneWeek = 7 * oneDay;

    let today = 0;
    let thisWeek = 0;
    const byCategory: Record<string, number> = {};
    const byType: Record<string, number> = {};
    const byPriority: Record<string, number> = {};
    const unreadByCategory: Record<string, number> = {};

    for (const n of this.notifications) {
      byCategory[n.category] = (byCategory[n.category] || 0) + 1;
      byType[n.type] = (byType[n.type] || 0) + 1;
      byPriority[n.priority] = (byPriority[n.priority] || 0) + 1;

      if (n.status === 'unread') {
        unreadByCategory[n.category] = (unreadByCategory[n.category] || 0) + 1;
      }

      if (now - n.createdAt < oneDay) today++;
      if (now - n.createdAt < oneWeek) thisWeek++;
    }

    return {
      total: this.notifications.length,
      unread: this.unreadCount,
      today,
      thisWeek,
      byCategory,
      byType,
      byPriority,
      unreadByCategory,
    };
  }

  // ========================================================================
  // 设置
  // ========================================================================

  /**
   * 获取设置
   */
  getSettings(): NotificationSettings {
    return { ...this.settings };
  }

  /**
   * 更新设置
   */
  updateSettings(settings: Partial<NotificationSettings>): void {
    this.settings = { ...this.settings, ...settings };
    this.maxNotifications = this.settings.maxNotifications;
    this.emit('settings_changed', this.settings);
  }

  /**
   * 启用/禁用通知
   */
  setEnabled(enabled: boolean): void {
    this.settings.enabled = enabled;
    this.emit('settings_changed', this.settings);
  }

  /**
   * 设置免打扰
   */
  setDoNotDisturb(enabled: boolean, startTime?: string, endTime?: string): void {
    this.settings.doNotDisturb.enabled = enabled;
    if (startTime) this.settings.doNotDisturb.startTime = startTime;
    if (endTime) this.settings.doNotDisturb.endTime = endTime;
    this.emit('settings_changed', this.settings);
  }

  // ========================================================================
  // 便捷方法
  // ========================================================================

  /**
   * 发送交易通知
   */
  async sendTransactionNotification(
    direction: 'sent' | 'received',
    amount: string,
    token: string,
    txHash: string,
    chainId: number,
    counterparty: string
  ): Promise<Notification> {
    const type = direction === 'sent' ? 'transaction_sent' : 'transaction_received';
    const title = direction === 'sent' ? `发送 ${token}` : `收到 ${token}`;
    const message = direction === 'sent'
      ? `已发送 ${amount} ${token} 到 ${counterparty.slice(0, 8)}...`
      : `收到 ${amount} ${token} 来自 ${counterparty.slice(0, 8)}...`;

    return this.send({
      type,
      category: 'transaction',
      title,
      message,
      priority: 'normal',
      transactionHash: txHash,
      chainId,
      data: { amount, token, counterparty, direction },
    });
  }

  /**
   * 发送价格告警
   */
  async sendPriceAlert(
    token: string,
    direction: 'up' | 'down',
    price: string,
    changePercent: number
  ): Promise<Notification> {
    const type = direction === 'up' ? 'price_surge' : 'price_drop';
    const title = `${token} 价格${direction === 'up' ? '上涨' : '下跌'}警报`;
    const message = `${token} 当前价格 $${price}，24小时${direction === 'up' ? '涨幅' : '跌幅'} ${Math.abs(changePercent).toFixed(2)}%`;

    return this.send({
      type,
      category: 'price',
      title,
      message,
      priority: changePercent > 10 ? 'high' : 'normal',
      data: { token, price, changePercent, direction },
    });
  }

  /**
   * 发送安全告警
   */
  async sendSecurityAlert(
    alertType: string,
    title: string,
    message: string,
    priority: 'high' | 'urgent' = 'high',
    data?: Record<string, any>
  ): Promise<Notification> {
    return this.send({
      type: 'security_alert' as NotificationType,
      category: 'security',
      title,
      message,
      priority,
      data,
    });
  }

  // ========================================================================
  // 事件系统
  // ========================================================================

  /**
   * 监听事件
   */
  on(event: string, callback: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }

  /**
   * 移除监听
   */
  off(event: string, callback: Function): boolean {
    const listeners = this.eventListeners.get(event);
    if (!listeners) return false;
    const index = listeners.indexOf(callback);
    if (index > -1) {
      listeners.splice(index, 1);
      return true;
    }
    return false;
  }

  private emit(event: string, data: any): void {
    const listeners = this.eventListeners.get(event);
    if (!listeners) return;
    for (const listener of listeners) {
      try {
        listener(data);
      } catch (e) {
        console.error(`Notification event listener error (${event}):`, e);
      }
    }
  }

  // ========================================================================
  // 清理
  // ========================================================================

  private cleanupOldNotifications(): void {
    if (this.notifications.length <= this.maxNotifications) return;

    const toRemove = this.notifications.length - this.maxNotifications;
    for (let i = 0; i < toRemove; i++) {
      const removed = this.notifications.pop();
      if (removed?.status === 'unread') {
        this.unreadCount = Math.max(0, this.unreadCount - 1);
      }
    }

    this.emit('unread_count_changed', this.unreadCount);
  }

  /**
   * 清理过期通知
   */
  cleanupExpired(): number {
    const now = Date.now();
    let removed = 0;

    this.notifications = this.notifications.filter((n) => {
      if (n.expiresAt && now > n.expiresAt) {
        if (n.status === 'unread') this.unreadCount--;
        removed++;
        return false;
      }
      return true;
    });

    this.emit('unread_count_changed', this.unreadCount);
    return removed;
  }

  /**
   * 销毁服务
   */
  destroy(): void {
    this.notifications = [];
    this.eventListeners.clear();
    this.webhooks = [];
    this.unreadCount = 0;
  }
}

// ============================================================================
// 默认导出
// ============================================================================

export default {
  NotificationService,
  DEFAULT_NOTIFICATION_SETTINGS,
};
