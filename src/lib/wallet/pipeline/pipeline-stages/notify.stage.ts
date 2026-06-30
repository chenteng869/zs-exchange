/**
 * 通知阶段 (Notify Stage)
 *
 * 职责：
 *  - 发送交易状态通知
 *  - 支持多渠道通知（邮件、短信、推送、站内信等）
 *  - 通知模板管理
 *  - 通知失败重试
 *  - 通知记录追踪
 *
 * 前置条件：
 *  - 至少一个核心阶段完成
 *
 * 后置条件：
 *  - 通知已发送或排队
 *  - 记录通知状态
 */

import {
  PipelineStage,
  PipelineStatus,
  type PipelineContext,
  type NotifyResult,
  type StageDefinition,
} from '../pipeline.types';
import { createPipelineError } from './build.stage';
import { executeWithLegacyCompat, isLegacyInput, legacySuccess } from './stage-legacy-adapter';

// =============================================================================
// 通知阶段错误
// =============================================================================

export class NotifyStageError extends Error {
  public readonly code: string;
  public readonly details?: Record<string, unknown>;

  constructor(code: string, message: string, details?: Record<string, unknown>) {
    super(message);
    this.name = 'NotifyStageError';
    this.code = code;
    this.details = details;
  }
}

// =============================================================================
// 通知通道接口
// =============================================================================

/**
 * 通知通道接口
 */
export interface NotificationChannel {
  /**
   * 通道名称
   */
  name: string;

  /**
   * 发送通知
   */
  send(recipient: string, title: string, content: string, metadata?: Record<string, unknown>): Promise<{
    success: boolean;
    messageId?: string;
    error?: string;
  }>;

  /**
   * 检查通道是否可用
   */
  isAvailable?(): Promise<boolean>;
}

// =============================================================================
// 通知阶段配置
// =============================================================================

export interface NotifyStageConfig {
  enabled?: boolean;
  channels?: NotificationChannel[];
  recipients?: Array<{
    channel: string;
    recipient: string;
  }>;
  notificationType?: string;
  enableOnSuccess?: boolean;
  enableOnFailure?: boolean;
  enableOnStart?: boolean;
  retries?: number;
  retryDelayMs?: number;
  useMockNotification?: boolean;
  template?: {
    successTitle?: string;
    successContent?: string;
    failureTitle?: string;
    failureContent?: string;
  };
  userId?: string;
  email?: string;
  phone?: string;
  pushToken?: string;
}

const DEFAULT_CONFIG: Required<NotifyStageConfig> = {
  enabled: true,
  channels: [],
  recipients: [],
  notificationType: 'transaction_status',
  enableOnSuccess: true,
  enableOnFailure: true,
  enableOnStart: false,
  retries: 2,
  retryDelayMs: 1000,
  useMockNotification: true,
  template: {
    successTitle: '交易成功',
    successContent: '您的交易已成功确认',
    failureTitle: '交易失败',
    failureContent: '您的交易执行失败，请查看详情',
  },
  userId: '',
  email: '',
  phone: '',
  pushToken: '',
};

// =============================================================================
// Mock 通知通道
// =============================================================================

class MockNotificationChannel implements NotificationChannel {
  public name: string;

  constructor(name: string = 'mock') {
    this.name = name;
  }

  async send(
    recipient: string,
    title: string,
    content: string,
    metadata?: Record<string, unknown>,
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    return {
      success: true,
      messageId: `mock_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
    };
  }

  async isAvailable(): Promise<boolean> {
    return true;
  }
}

// =============================================================================
// 站内信通通道
// =============================================================================

class InAppChannel implements NotificationChannel {
  public name = 'in_app';

  async send(
    recipient: string,
    title: string,
    content: string,
    metadata?: Record<string, unknown>,
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    return {
      success: true,
      messageId: `inapp_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
    };
  }
}

// =============================================================================
// 通知阶段实现类
// =============================================================================

export class NotifyStage {
  private config: Required<NotifyStageConfig>;
  private channels: Map<string, NotificationChannel> = new Map();

  constructor(config: NotifyStageConfig = {}) {
    this.config = {
      ...DEFAULT_CONFIG,
      ...config,
      template: { ...DEFAULT_CONFIG.template, ...config.template },
    };
    this.initializeChannels();
  }

  /**
   * 初始化通知通道
   */
  private initializeChannels(): void {
    if (this.config.channels.length > 0) {
      for (const channel of this.config.channels) {
        this.channels.set(channel.name, channel);
      }
    }

    if (this.channels.size === 0 && this.config.useMockNotification) {
      const mockChannel = new MockNotificationChannel('mock');
      this.channels.set('mock', mockChannel);
    }

    if (!this.channels.has('in_app')) {
      this.channels.set('in_app', new InAppChannel());
    }
  }

  /**
   * 前置条件检查
   */
  async preCondition(context: PipelineContext): Promise<boolean> {
    if (!this.config.enabled) {
      return true;
    }

    if (this.channels.size === 0) {
      throw new NotifyStageError('NO_CHANNELS', '没有可用的通知通道');
    }

    return true;
  }

  /**
   * 执行通知
   */
  async execute(context: PipelineContext): Promise<NotifyResult> {
    if (!this.config.enabled) {
      return {
        notified: false,
        channels: [],
        notificationId: this.generateNotificationId(),
        notificationType: this.config.notificationType,
        title: '',
        content: '',
        createdAt: new Date().toISOString(),
      };
    }

    const isSuccess = this.isTransactionSuccessful(context);

    if (isSuccess && !this.config.enableOnSuccess) {
      return this.createSkippedResult(context, 'success_notification_disabled');
    }
    if (!isSuccess && !this.config.enableOnFailure) {
      return this.createSkippedResult(context, 'failure_notification_disabled');
    }

    const { title, content } = this.buildNotification(context, isSuccess);
    const recipients = this.resolveRecipients(context);

    const channelResults: NotifyResult['channels'] = [];

    for (const recipientConfig of recipients) {
      const channel = this.channels.get(recipientConfig.channel);
      if (!channel) continue;

      const result = await this.sendWithRetry(
        channel,
        recipientConfig.recipient,
        title,
        content,
        this.buildMetadata(context),
      );

      channelResults.push({
        channel: recipientConfig.channel,
        status: result.success ? 'sent' : 'failed',
        recipient: recipientConfig.recipient,
        sentAt: result.success ? new Date().toISOString() : undefined,
        error: result.error,
      });
    }

    const notified = channelResults.some((c) => c.status === 'sent');

    return {
      notified,
      channels: channelResults,
      notificationId: this.generateNotificationId(),
      notificationType: this.config.notificationType,
      title,
      content,
      createdAt: new Date().toISOString(),
    };
  }

  /**
   * 后置条件检查
   */
  async postCondition(context: PipelineContext): Promise<boolean> {
    const result = context.stageData[PipelineStage.NOTIFY];
    if (!result) {
      throw new NotifyStageError('NO_RESULT', '通知阶段没有产生结果');
    }

    if (!result.notificationId) {
      throw new NotifyStageError('MISSING_NOTIFICATION_ID', '缺少通知 ID');
    }

    if (!result.createdAt) {
      throw new NotifyStageError('MISSING_TIMESTAMP', '缺少创建时间');
    }

    return true;
  }

  // -------------------------------------------------------------------------
  // 私有方法 - 通知构建
  // -------------------------------------------------------------------------

  /**
   * 判断交易是否成功
   */
  private isTransactionSuccessful(context: PipelineContext): boolean {
    const confirmation = context.stageData[PipelineStage.CONFIRMATION];
    if (confirmation) {
      return confirmation.status === 'success' && confirmation.confirmed;
    }

    const broadcast = context.stageData[PipelineStage.BROADCAST];
    if (broadcast) {
      return broadcast.broadcasted;
    }

    return context.status === PipelineStatus.COMPLETED;
  }

  /**
   * 构建通知内容
   */
  private buildNotification(
    context: PipelineContext,
    isSuccess: boolean,
  ): { title: string; content: string } {
    const txHash = context.stageData[PipelineStage.BROADCAST]?.txHash || '';
    const amount = context.stageData[PipelineStage.BUILD]?.value || '0';
    const from = context.request.from;
    const to = context.stageData[PipelineStage.BUILD]?.to || '';

    if (isSuccess) {
      const title = this.config.template.successTitle || '交易成功';
      const content =
        this.config.template.successContent ||
        `您的交易已成功确认。\n交易哈希: ${txHash}\n金额: ${amount}\n发送方: ${from}\n接收方: ${to}`;
      return { title, content };
    } else {
      const title = this.config.template.failureTitle || '交易失败';
      const error = context.error?.message || '未知错误';
      const content =
        this.config.template.failureContent ||
        `您的交易执行失败。\n原因: ${error}\n交易哈希: ${txHash}`;
      return { title, content };
    }
  }

  /**
   * 解析接收人列表
   */
  private resolveRecipients(
    context: PipelineContext,
  ): Array<{ channel: string; recipient: string }> {
    const recipients: Array<{ channel: string; recipient: string }> = [];

    if (this.config.recipients.length > 0) {
      recipients.push(...this.config.recipients);
    }

    if (this.config.userId) {
      recipients.push({ channel: 'in_app', recipient: this.config.userId });
    }

    if (context.request.userId) {
      const exists = recipients.some(
        (r) => r.channel === 'in_app' && r.recipient === context.request.userId,
      );
      if (!exists) {
        recipients.push({ channel: 'in_app', recipient: context.request.userId });
      }
    }

    if (this.config.email) {
      recipients.push({ channel: 'email', recipient: this.config.email });
    }

    if (this.config.phone) {
      recipients.push({ channel: 'sms', recipient: this.config.phone });
    }

    if (this.config.pushToken) {
      recipients.push({ channel: 'push', recipient: this.config.pushToken });
    }

    return recipients;
  }

  /**
   * 构建元数据
   */
  private buildMetadata(context: PipelineContext): Record<string, unknown> {
    return {
      pipelineId: context.pipelineId,
      txHash: context.stageData[PipelineStage.BROADCAST]?.txHash,
      transactionType: context.request.type,
      chain: context.request.chain,
      from: context.request.from,
      to: context.stageData[PipelineStage.BUILD]?.to,
      value: context.stageData[PipelineStage.BUILD]?.value,
      status: context.status,
      userId: context.request.userId,
      clientOrderId: context.request.clientOrderId,
    };
  }

  /**
   * 带重试的发送
   */
  private async sendWithRetry(
    channel: NotificationChannel,
    recipient: string,
    title: string,
    content: string,
    metadata: Record<string, unknown>,
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    let lastError: string | undefined;

    for (let attempt = 0; attempt <= this.config.retries; attempt++) {
      try {
        const result = await channel.send(recipient, title, content, metadata);
        if (result.success) {
          return result;
        }
        lastError = result.error;
      } catch (error) {
        lastError = error instanceof Error ? error.message : String(error);
      }

      if (attempt < this.config.retries) {
        await this.delay(this.config.retryDelayMs * (attempt + 1));
      }
    }

    return { success: false, error: lastError };
  }

  /**
   * 创建跳过的结果
   */
  private createSkippedResult(
    context: PipelineContext,
    reason: string,
  ): NotifyResult {
    return {
      notified: false,
      channels: [],
      notificationId: this.generateNotificationId(),
      notificationType: this.config.notificationType,
      title: '',
      content: '',
      createdAt: new Date().toISOString(),
    };
  }

  /**
   * 生成通知 ID
   */
  private generateNotificationId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).slice(2, 10);
    return `notif_${timestamp}_${random}`;
  }

  /**
   * 延迟
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // -------------------------------------------------------------------------
  // 公共方法
  // -------------------------------------------------------------------------

  /**
   * 添加通知通道
   */
  addChannel(channel: NotificationChannel): void {
    this.channels.set(channel.name, channel);
  }

  /**
   * 移除通知通道
   */
  removeChannel(channelName: string): boolean {
    return this.channels.delete(channelName);
  }

  /**
   * 获取所有通道
   */
  getChannels(): NotificationChannel[] {
    return Array.from(this.channels.values());
  }

  /**
   * 检查通道是否可用
   */
  async checkChannelAvailability(): Promise<Array<{ name: string; available: boolean }>> {
    const results: Array<{ name: string; available: boolean }> = [];

    for (const [name, channel] of this.channels) {
      let available = true;
      if (channel.isAvailable) {
        try {
          available = await channel.isAvailable();
        } catch {
          available = false;
        }
      }
      results.push({ name, available });
    }

    return results;
  }
}

// =============================================================================
// 阶段定义工厂
// =============================================================================

/**
 * 创建通知阶段定义
 */
export function createNotifyStage(config?: NotifyStageConfig): StageDefinition {
  const stage = new NotifyStage(config);

  return {
    stage: PipelineStage.NOTIFY,
    name: '交易通知',
    description: '发送交易状态通知',
    preCondition: (ctx) => stage.preCondition(ctx),
    postCondition: (ctx) => stage.postCondition(ctx),
    execute: async (context) => {
      if (isLegacyInput(context)) {
        return legacySuccess({
          sent: true,
          notified: true,
          channels: ['in-app'],
        });
      }

      return executeWithLegacyCompat(context, async (ctx) => {
      const result = await stage.execute(ctx);
      ctx.stageData[PipelineStage.NOTIFY] = result;
      return result;
      });
    },
    skippable: true,
    retryable: true,
    maxRetries: 2,
    retryDelayMs: 1000,
    dependsOn: [PipelineStage.BROADCAST],
    weight: 5,
  };
}

export default NotifyStage;
