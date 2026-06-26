/**
 * 审批通知器 (ApprovalNotifier)
 *
 * 负责：
 *  - 审批请求的通知发送
 *  - 支持多种通知渠道（邮件、短信、站内信、Webhook）
 *  - 通知模板管理
 *  - 通知记录与重试
 */

import {
  ApprovalRequest,
  ApproverInfo,
  ApprovalStatus,
  MPCError,
  MPCErrorCode,
} from '../mpc.types';

// =============================================================================
// 通知渠道类型
// =============================================================================

export type NotificationChannel = 'email' | 'sms' | 'in_app' | 'webhook' | 'push';

// =============================================================================
// 通知类型
// =============================================================================

export type NotificationType =
  | 'approval_requested'
  | 'approval_approved'
  | 'approval_rejected'
  | 'approval_expired'
  | 'approval_reminder'
  | 'approval_completed';

// =============================================================================
// 通知配置接口
// =============================================================================

export interface NotificationConfig {
  /** 启用的通知渠道 */
  enabledChannels: NotificationChannel[];
  /** 邮件配置 */
  emailConfig?: EmailNotificationConfig;
  /** 短信配置 */
  smsConfig?: SmsNotificationConfig;
  /** 站内信配置 */
  inAppConfig?: InAppNotificationConfig;
  /** Webhook 配置 */
  webhookConfig?: WebhookNotificationConfig;
  /** 推送配置 */
  pushConfig?: PushNotificationConfig;
  /** 通知重试次数 */
  maxRetries: number;
  /** 重试间隔（毫秒） */
  retryIntervalMs: number;
  /** 提醒间隔（毫秒） */
  reminderIntervalMs: number;
  /** 最大提醒次数 */
  maxReminders: number;
}

/**
 * 邮件通知配置
 */
export interface EmailNotificationConfig {
  fromAddress: string;
  fromName: string;
  smtpHost?: string;
  smtpPort?: number;
  templates: Record<NotificationType, EmailTemplate>;
}

/**
 * 邮件模板
 */
export interface EmailTemplate {
  subject: string;
  body: string;
  htmlBody?: string;
}

/**
 * 短信通知配置
 */
export interface SmsNotificationConfig {
  provider: string;
  templates: Record<NotificationType, string>;
}

/**
 * 站内信通知配置
 */
export interface InAppNotificationConfig {
  templates: Record<NotificationType, InAppTemplate>;
}

/**
 * 站内信模板
 */
export interface InAppTemplate {
  title: string;
  content: string;
  actionUrl?: string;
}

/**
 * Webhook 通知配置
 */
export interface WebhookNotificationConfig {
  url: string;
  secret?: string;
  headers?: Record<string, string>;
}

/**
 * 推送通知配置
 */
export interface PushNotificationConfig {
  provider: string;
  templates: Record<NotificationType, PushTemplate>;
}

/**
 * 推送模板
 */
export interface PushTemplate {
  title: string;
  body: string;
  data?: Record<string, string>;
}

// =============================================================================
// 通知记录接口
// =============================================================================

export interface NotificationRecord {
  id: string;
  approvalRequestId: string;
  approverId: string;
  channel: NotificationChannel;
  type: NotificationType;
  status: 'pending' | 'sent' | 'failed';
  retryCount: number;
  maxRetries: number;
  sentAt?: Date;
  lastError?: string;
  createdAt: Date;
}

// =============================================================================
// 审批通知器类
// =============================================================================

export class ApprovalNotifier {
  private config: NotificationConfig;
  private notificationRecords: Map<string, NotificationRecord[]> = new Map();
  private reminderTimers: Map<string, NodeJS.Timeout> = new Map();

  constructor(config: Partial<NotificationConfig> = {}) {
    this.config = {
      enabledChannels: config.enabledChannels || ['in_app', 'email'],
      maxRetries: config.maxRetries || 3,
      retryIntervalMs: config.retryIntervalMs || 60 * 1000,
      reminderIntervalMs: config.reminderIntervalMs || 30 * 60 * 1000,
      maxReminders: config.maxReminders || 3,
      ...config,
    };
  }

  // ===========================================================================
  // 公共方法
  // ===========================================================================

  /**
   * 发送审批请求通知
   */
  async notifyApprovalRequested(
    approvalRequest: ApprovalRequest,
    approvers: ApproverInfo[],
  ): Promise<void> {
    await this.sendNotifications(
      approvalRequest,
      approvers,
      'approval_requested',
    );
    this.scheduleReminders(approvalRequest, approvers);
  }

  /**
   * 发送审批通过通知
   */
  async notifyApprovalApproved(
    approvalRequest: ApprovalRequest,
    approver: ApproverInfo,
  ): Promise<void> {
    await this.sendNotification(
      approvalRequest,
      approver,
      'approval_approved',
    );
    this.clearReminders(approvalRequest.id);
  }

  /**
   * 发送审批拒绝通知
   */
  async notifyApprovalRejected(
    approvalRequest: ApprovalRequest,
    approver: ApproverInfo,
    reason: string,
  ): Promise<void> {
    await this.sendNotification(
      approvalRequest,
      approver,
      'approval_rejected',
      { reason },
    );
    this.clearReminders(approvalRequest.id);
  }

  /**
   * 发送审批过期通知
   */
  async notifyApprovalExpired(approvalRequest: ApprovalRequest): Promise<void> {
    await this.sendNotifications(
      approvalRequest,
      approvalRequest.approvers,
      'approval_expired',
    );
    this.clearReminders(approvalRequest.id);
  }

  /**
   * 发送审批完成通知
   */
  async notifyApprovalCompleted(
    approvalRequest: ApprovalRequest,
    finalStatus: ApprovalStatus,
  ): Promise<void> {
    await this.sendNotifications(
      approvalRequest,
      approvalRequest.approvers,
      'approval_completed',
      { finalStatus },
    );
    this.clearReminders(approvalRequest.id);
  }

  /**
   * 发送提醒通知
   */
  async sendReminder(approvalRequest: ApprovalRequest): Promise<void> {
    const pendingApprovers = approvalRequest.approvers.filter(
      (a) => !approvalRequest.approvedBy.includes(a.userId),
    );

    if (pendingApprovers.length === 0) return;

    await this.sendNotifications(
      approvalRequest,
      pendingApprovers,
      'approval_reminder',
    );
  }

  // ===========================================================================
  // 内部方法 - 通知发送
  // ===========================================================================

  /**
   * 批量发送通知
   */
  private async sendNotifications(
    approvalRequest: ApprovalRequest,
    approvers: ApproverInfo[],
    type: NotificationType,
    extraData?: Record<string, unknown>,
  ): Promise<void> {
    const promises = approvers.map((approver) =>
      this.sendNotification(approvalRequest, approver, type, extraData),
    );
    await Promise.allSettled(promises);
  }

  /**
   * 发送单个通知
   */
  private async sendNotification(
    approvalRequest: ApprovalRequest,
    approver: ApproverInfo,
    type: NotificationType,
    extraData?: Record<string, unknown>,
  ): Promise<void> {
    const channels = this.config.enabledChannels;

    for (const channel of channels) {
      try {
        await this.sendViaChannel(channel, approvalRequest, approver, type, extraData);
        this.recordNotification(approvalRequest.id, approver.userId, channel, type, 'sent');
      } catch (error) {
        this.recordNotification(
          approvalRequest.id,
          approver.userId,
          channel,
          type,
          'failed',
          error instanceof Error ? error.message : String(error),
        );
        await this.retryNotification(
          channel,
          approvalRequest,
          approver,
          type,
          extraData,
        );
      }
    }
  }

  /**
   * 通过指定渠道发送通知
   */
  private async sendViaChannel(
    channel: NotificationChannel,
    approvalRequest: ApprovalRequest,
    approver: ApproverInfo,
    type: NotificationType,
    extraData?: Record<string, unknown>,
  ): Promise<void> {
    switch (channel) {
      case 'email':
        await this.sendEmail(approvalRequest, approver, type, extraData);
        break;
      case 'sms':
        await this.sendSms(approvalRequest, approver, type, extraData);
        break;
      case 'in_app':
        await this.sendInApp(approvalRequest, approver, type, extraData);
        break;
      case 'webhook':
        await this.sendWebhook(approvalRequest, approver, type, extraData);
        break;
      case 'push':
        await this.sendPush(approvalRequest, approver, type, extraData);
        break;
      default:
        throw new MPCError(
          MPCErrorCode.INVALID_PARAMS,
          `不支持的通知渠道: ${channel}`,
        );
    }
  }

  /**
   * 发送邮件通知
   */
  private async sendEmail(
    approvalRequest: ApprovalRequest,
    approver: ApproverInfo,
    type: NotificationType,
    extraData?: Record<string, unknown>,
  ): Promise<void> {
    if (!approver.email) return;

    const template = this.config.emailConfig?.templates[type];
    if (!template) return;

    const subject = this.renderTemplate(template.subject, approvalRequest, approver, extraData);
    const body = this.renderTemplate(template.body, approvalRequest, approver, extraData);

    console.log(`[Email] 发送邮件到 ${approver.email}: ${subject}`);
    console.log(`[Email] 内容: ${body}`);
  }

  /**
   * 发送短信通知
   */
  private async sendSms(
    approvalRequest: ApprovalRequest,
    approver: ApproverInfo,
    type: NotificationType,
    extraData?: Record<string, unknown>,
  ): Promise<void> {
    if (!approver.phone) return;

    const template = this.config.smsConfig?.templates[type];
    if (!template) return;

    const message = this.renderTemplate(template, approvalRequest, approver, extraData);

    console.log(`[SMS] 发送短信到 ${approver.phone}: ${message}`);
  }

  /**
   * 发送站内信通知
   */
  private async sendInApp(
    approvalRequest: ApprovalRequest,
    approver: ApproverInfo,
    type: NotificationType,
    extraData?: Record<string, unknown>,
  ): Promise<void> {
    const template = this.config.inAppConfig?.templates[type];
    if (!template) return;

    const title = this.renderTemplate(template.title, approvalRequest, approver, extraData);
    const content = this.renderTemplate(template.content, approvalRequest, approver, extraData);

    console.log(`[InApp] 发送站内信给 ${approver.userId}: ${title}`);
    console.log(`[InApp] 内容: ${content}`);
  }

  /**
   * 发送 Webhook 通知
   */
  private async sendWebhook(
    approvalRequest: ApprovalRequest,
    approver: ApproverInfo,
    type: NotificationType,
    extraData?: Record<string, unknown>,
  ): Promise<void> {
    const webhookConfig = this.config.webhookConfig;
    if (!webhookConfig?.url) return;

    const payload = {
      type,
      approvalRequestId: approvalRequest.id,
      approverId: approver.userId,
      approverName: approver.userName,
      title: approvalRequest.title,
      description: approvalRequest.description,
      status: approvalRequest.status,
      createdAt: approvalRequest.createdAt,
      expiresAt: approvalRequest.expiresAt,
      transactionSummary: approvalRequest.transactionSummary,
      extraData,
    };

    console.log(`[Webhook] 发送 Webhook 到 ${webhookConfig.url}`);
    console.log(`[Webhook] Payload: ${JSON.stringify(payload)}`);
  }

  /**
   * 发送推送通知
   */
  private async sendPush(
    approvalRequest: ApprovalRequest,
    approver: ApproverInfo,
    type: NotificationType,
    extraData?: Record<string, unknown>,
  ): Promise<void> {
    const template = this.config.pushConfig?.templates[type];
    if (!template) return;

    const title = this.renderTemplate(template.title, approvalRequest, approver, extraData);
    const body = this.renderTemplate(template.body, approvalRequest, approver, extraData);

    console.log(`[Push] 发送推送给 ${approver.userId}: ${title}`);
    console.log(`[Push] 内容: ${body}`);
  }

  // ===========================================================================
  // 内部方法 - 重试机制
  // ===========================================================================

  /**
   * 重试发送通知
   */
  private async retryNotification(
    channel: NotificationChannel,
    approvalRequest: ApprovalRequest,
    approver: ApproverInfo,
    type: NotificationType,
    extraData?: Record<string, unknown>,
  ): Promise<void> {
    for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
      await this.delay(this.config.retryIntervalMs);

      try {
        await this.sendViaChannel(channel, approvalRequest, approver, type, extraData);
        this.updateNotificationRecord(
          approvalRequest.id,
          approver.userId,
          channel,
          type,
          'sent',
          attempt,
        );
        return;
      } catch (error) {
        this.updateNotificationRecord(
          approvalRequest.id,
          approver.userId,
          channel,
          type,
          'failed',
          attempt,
          error instanceof Error ? error.message : String(error),
        );
      }
    }
  }

  // ===========================================================================
  // 内部方法 - 提醒机制
  // ===========================================================================

  /**
   * 安排提醒
   */
  private scheduleReminders(
    approvalRequest: ApprovalRequest,
    approvers: ApproverInfo[],
  ): void {
    let reminderCount = 0;

    const timer = setInterval(() => {
      reminderCount++;
      if (reminderCount > this.config.maxReminders) {
        this.clearReminders(approvalRequest.id);
        return;
      }

      this.sendReminder(approvalRequest).catch(console.error);
    }, this.config.reminderIntervalMs) as unknown as NodeJS.Timeout;

    this.reminderTimers.set(approvalRequest.id, timer);
  }

  /**
   * 清除提醒
   */
  private clearReminders(approvalRequestId: string): void {
    const timer = this.reminderTimers.get(approvalRequestId);
    if (timer) {
      clearInterval(timer);
      this.reminderTimers.delete(approvalRequestId);
    }
  }

  // ===========================================================================
  // 内部方法 - 通知记录
  // ===========================================================================

  /**
   * 记录通知
   */
  private recordNotification(
    approvalRequestId: string,
    approverId: string,
    channel: NotificationChannel,
    type: NotificationType,
    status: 'pending' | 'sent' | 'failed',
    lastError?: string,
  ): void {
    const record: NotificationRecord = {
      id: this.generateId(),
      approvalRequestId,
      approverId,
      channel,
      type,
      status,
      retryCount: 0,
      maxRetries: this.config.maxRetries,
      sentAt: status === 'sent' ? new Date() : undefined,
      lastError,
      createdAt: new Date(),
    };

    const key = `${approvalRequestId}:${approverId}`;
    const records = this.notificationRecords.get(key) || [];
    records.push(record);
    this.notificationRecords.set(key, records);
  }

  /**
   * 更新通知记录
   */
  private updateNotificationRecord(
    approvalRequestId: string,
    approverId: string,
    channel: NotificationChannel,
    type: NotificationType,
    status: 'pending' | 'sent' | 'failed',
    retryCount: number,
    lastError?: string,
  ): void {
    const key = `${approvalRequestId}:${approverId}`;
    const records = this.notificationRecords.get(key) || [];
    const record = records.find(
      (r) => r.channel === channel && r.type === type && r.status === 'failed',
    );

    if (record) {
      record.status = status;
      record.retryCount = retryCount;
      record.lastError = lastError;
      if (status === 'sent') {
        record.sentAt = new Date();
      }
    }
  }

  /**
   * 获取通知记录
   */
  getNotificationRecords(approvalRequestId: string): NotificationRecord[] {
    const allRecords: NotificationRecord[] = [];
    for (const [key, records] of this.notificationRecords.entries()) {
      if (key.startsWith(approvalRequestId)) {
        allRecords.push(...records);
      }
    }
    return allRecords.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  // ===========================================================================
  // 工具方法
  // ===========================================================================

  /**
   * 渲染模板
   */
  private renderTemplate(
    template: string,
    approvalRequest: ApprovalRequest,
    approver: ApproverInfo,
    extraData?: Record<string, unknown>,
  ): string {
    let result = template;

    result = result.replace(/\{\{approverName\}\}/g, approver.userName);
    result = result.replace(/\{\{title\}\}/g, approvalRequest.title);
    result = result.replace(/\{\{description\}\}/g, approvalRequest.description || '');
    result = result.replace(/\{\{status\}\}/g, approvalRequest.status);
    result = result.replace(
      /\{\{createdAt\}\}/g,
      approvalRequest.createdAt.toLocaleString(),
    );
    result = result.replace(
      /\{\{expiresAt\}\}/g,
      approvalRequest.expiresAt.toLocaleString(),
    );

    if (extraData) {
      for (const [key, value] of Object.entries(extraData)) {
        result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), String(value));
      }
    }

    return result;
  }

  /**
   * 延迟
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * 生成 ID
   */
  private generateId(): string {
    return `notif_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
  }

  /**
   * 更新配置
   */
  updateConfig(config: Partial<NotificationConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * 获取当前配置
   */
  getConfig(): NotificationConfig {
    return { ...this.config };
  }

  /**
   * 清理资源
   */
  dispose(): void {
    for (const timer of this.reminderTimers.values()) {
      clearInterval(timer);
    }
    this.reminderTimers.clear();
  }
}
