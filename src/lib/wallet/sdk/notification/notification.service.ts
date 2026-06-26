/**
 * 通知服务
 *
 * 功能：
 *  - 交易通知
 *  - 签名通知
 *  - 安全通知
 *  - 连接通知
 *  - 通知历史记录
 *  - 未读计数
 */

import type { WalletNotification, NotificationType, NotificationLevel, NotificationAction } from '../sdk.types';

/**
 * 通知服务类
 */
export class NotificationService {
  /** 通知列表 */
  private notifications: WalletNotification[] = [];

  /** 已销毁标志 */
  private destroyed: boolean = false;

  /** 最大通知数量 */
  private readonly MAX_NOTIFICATIONS = 100;

  /** 存储键 */
  private storageKey: string = 'wallet_sdk_notifications';

  /** 通知监听器 */
  private listeners: Set<(notification: WalletNotification) => void> = new Set();

  // ==========================================================================
  // 构造函数
  // ==========================================================================

  constructor(
    private readonly sdk: any,
  ) {}

  // ==========================================================================
  // 初始化与销毁
  // ==========================================================================

  /**
   * 初始化通知服务
   */
  public async initialize(): Promise<void> {
    if (this.destroyed) return;

    this.loadNotifications();
    console.log('[NotificationService] 初始化完成');
  }

  /**
   * 销毁通知服务
   */
  public destroy(): void {
    this.destroyed = true;
    this.listeners.clear();
    console.log('[NotificationService] 已销毁');
  }

  // ==========================================================================
  // 发送通知
  // ==========================================================================

  /**
   * 发送通知
   */
  public notify(options: {
    type: NotificationType;
    level: NotificationLevel;
    title: string;
    message: string;
    data?: Record<string, any>;
    txHash?: string;
    sessionId?: string;
    duration?: number;
    actions?: NotificationAction[];
  }): WalletNotification {
    if (this.destroyed) {
      return {} as WalletNotification;
    }

    const notification: WalletNotification = {
      id: this.generateId(),
      type: options.type,
      level: options.level,
      title: options.title,
      message: options.message,
      data: options.data,
      timestamp: Date.now(),
      read: false,
      txHash: options.txHash,
      sessionId: options.sessionId,
      duration: options.duration,
      actions: options.actions,
    };

    this.notifications.unshift(notification);

    if (this.notifications.length > this.MAX_NOTIFICATIONS) {
      this.notifications = this.notifications.slice(0, this.MAX_NOTIFICATIONS);
    }

    this.saveNotifications();
    this.emitNotification(notification);

    return notification;
  }

  /**
   * 发送交易通知
   */
  public notifyTransaction(
    title: string,
    message: string,
    txHash: string,
    level: NotificationLevel = 'info',
    data?: Record<string, any>
  ): WalletNotification {
    return this.notify({
      type: 'transaction',
      level,
      title,
      message,
      txHash,
      data,
      duration: 5000,
    });
  }

  /**
   * 发送签名通知
   */
  public notifySignature(
    title: string,
    message: string,
    level: NotificationLevel = 'info',
    data?: Record<string, any>
  ): WalletNotification {
    return this.notify({
      type: 'signature',
      level,
      title,
      message,
      data,
      duration: 3000,
    });
  }

  /**
   * 发送安全通知
   */
  public notifySecurity(
    title: string,
    message: string,
    level: NotificationLevel = 'warning',
    data?: Record<string, any>
  ): WalletNotification {
    return this.notify({
      type: 'security',
      level,
      title,
      message,
      data,
    });
  }

  /**
   * 发送连接通知
   */
  public notifyConnection(
    title: string,
    message: string,
    sessionId?: string,
    level: NotificationLevel = 'info',
    data?: Record<string, any>
  ): WalletNotification {
    return this.notify({
      type: 'connection',
      level,
      title,
      message,
      sessionId,
      data,
      duration: 4000,
    });
  }

  /**
   * 发送网络通知
   */
  public notifyNetwork(
    title: string,
    message: string,
    level: NotificationLevel = 'info',
    data?: Record<string, any>
  ): WalletNotification {
    return this.notify({
      type: 'network',
      level,
      title,
      message,
      data,
      duration: 3000,
    });
  }

  // ==========================================================================
  // 通知查询
  // ==========================================================================

  /**
   * 获取所有通知
   */
  public getNotifications(): WalletNotification[] {
    return [...this.notifications];
  }

  /**
   * 获取未读通知
   */
  public getUnreadNotifications(): WalletNotification[] {
    return this.notifications.filter(n => !n.read);
  }

  /**
   * 获取已读通知
   */
  public getReadNotifications(): WalletNotification[] {
    return this.notifications.filter(n => n.read);
  }

  /**
   * 按类型获取通知
   */
  public getNotificationsByType(type: NotificationType): WalletNotification[] {
    return this.notifications.filter(n => n.type === type);
  }

  /**
   * 获取未读通知数量
   */
  public getUnreadCount(): number {
    return this.getUnreadNotifications().length;
  }

  /**
   * 根据 ID 获取通知
   */
  public getNotificationById(id: string): WalletNotification | undefined {
    return this.notifications.find(n => n.id === id);
  }

  // ==========================================================================
  // 通知操作
  // ==========================================================================

  /**
   * 标记通知为已读
   */
  public markAsRead(id: string): void {
    const notification = this.notifications.find(n => n.id === id);
    if (notification) {
      notification.read = true;
      this.saveNotifications();
    }
  }

  /**
   * 标记所有通知为已读
   */
  public markAllAsRead(): void {
    this.notifications.forEach(n => {
      n.read = true;
    });
    this.saveNotifications();
  }

  /**
   * 标记未读
   */
  public markAsUnread(id: string): void {
    const notification = this.notifications.find(n => n.id === id);
    if (notification) {
      notification.read = false;
      this.saveNotifications();
    }
  }

  /**
   * 删除通知
   */
  public removeNotification(id: string): void {
    const index = this.notifications.findIndex(n => n.id === id);
    if (index !== -1) {
      this.notifications.splice(index, 1);
      this.saveNotifications();
    }
  }

  /**
   * 清空所有通知
   */
  public clearAll(): void {
    this.notifications = [];
    this.saveNotifications();
  }

  /**
   * 清空已读通知
   */
  public clearRead(): void {
    this.notifications = this.notifications.filter(n => !n.read);
    this.saveNotifications();
  }

  // ==========================================================================
  // 事件监听
  // ==========================================================================

  /**
   * 添加通知监听器
   */
  public addListener(listener: (notification: WalletNotification) => void): void {
    this.listeners.add(listener);
  }

  /**
   * 移除通知监听器
   */
  public removeListener(listener: (notification: WalletNotification) => void): void {
    this.listeners.delete(listener);
  }

  // ==========================================================================
  // 内部方法
  // ==========================================================================

  /**
   * 触发通知事件
   */
  private emitNotification(notification: WalletNotification): void {
    this.listeners.forEach(listener => {
      try {
        listener(notification);
      } catch (error) {
        console.error('[NotificationService] 通知监听器错误', error);
      }
    });
  }

  /**
   * 生成通知 ID
   */
  private generateId(): string {
    return `notif_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
  }

  /**
   * 从存储加载通知
   */
  private loadNotifications(): void {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        this.notifications = JSON.parse(stored);
      }
    } catch (error) {
      console.error('[NotificationService] 加载通知失败', error);
      this.notifications = [];
    }
  }

  /**
   * 保存通知到存储
   */
  private saveNotifications(): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.notifications));
    } catch (error) {
      console.error('[NotificationService] 保存通知失败', error);
    }
  }
}
