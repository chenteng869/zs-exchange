/**
 * 风控事件服务
 * 负责风控事件的记录、查询、统计和告警触发
 */

import {
  RiskEvent,
  RiskEventType,
  AlertLevel,
  EventQueryFilter,
  EventStatistics,
  AlertConfig,
  AlertChannel,
  RiskLevel,
  RiskDecision,
  RiskRuleResult,
} from './risk-engine.types';

/**
 * 告警回调函数类型
 */
export type AlertCallback = (event: RiskEvent) => void | Promise<void>;

/**
 * 风控事件服务类
 * 提供事件记录、查询、统计和告警功能
 */
export class RiskEventService {
  private events: Map<string, RiskEvent> = new Map();
  private eventListeners: Map<RiskEventType, Set<AlertCallback>> = new Map();
  private channelCallbacks: Map<AlertChannel, AlertCallback> = new Map();

  private alertConfig: AlertConfig = {
    enabled: true,
    minLevel: AlertLevel.WARNING,
    channels: ['in_app'],
    silencePeriod: 300,
  };

  private lastAlertTimestamps: Map<string, number> = new Map();
  private maxEvents = 10000;
  private eventIdCounter = 0;

  /**
   * 设置告警配置
   * @param config 配置
   */
  setAlertConfig(config: Partial<AlertConfig>): void {
    Object.assign(this.alertConfig, config);
  }

  /**
   * 获取告警配置
   */
  getAlertConfig(): AlertConfig {
    return { ...this.alertConfig };
  }

  /**
   * 生成唯一事件 ID
   */
  private generateEventId(): string {
    this.eventIdCounter++;
    return `event_${Date.now()}_${this.eventIdCounter}`;
  }

  /**
   * 根据事件类型和风险等级确定告警级别
   * @param eventType 事件类型
   * @param riskLevel 风险等级
   */
  private determineAlertLevel(
    eventType: RiskEventType,
    riskLevel?: RiskLevel
  ): AlertLevel {
    if (riskLevel) {
      switch (riskLevel) {
        case RiskLevel.CRITICAL:
          return AlertLevel.CRITICAL;
        case RiskLevel.HIGH:
          return AlertLevel.DANGER;
        case RiskLevel.MEDIUM:
          return AlertLevel.WARNING;
        case RiskLevel.LOW:
          return AlertLevel.INFO;
      }
    }

    const highRiskTypes = [
      RiskEventType.HIGH_RISK_BLOCKED,
      RiskEventType.BLACKLIST_BLOCKED,
      RiskEventType.PHISHING_BLOCKED,
    ];
    if (highRiskTypes.includes(eventType)) {
      return AlertLevel.DANGER;
    }

    const warningTypes = [
      RiskEventType.MEDIUM_RISK_WARNED,
      RiskEventType.LARGE_TRANSFER,
      RiskEventType.UNLIMITED_APPROVAL,
      RiskEventType.FREQUENT_TRANSACTIONS,
      RiskEventType.SUSPICIOUS_CONTRACT,
      RiskEventType.NEW_DEVICE_LOGIN,
      RiskEventType.ABNORMAL_LOCATION,
    ];
    if (warningTypes.includes(eventType)) {
      return AlertLevel.WARNING;
    }

    return AlertLevel.INFO;
  }

  /**
   * 生成事件标题
   * @param eventType 事件类型
   */
  private generateEventTitle(eventType: RiskEventType): string {
    const titles: Record<RiskEventType, string> = {
      [RiskEventType.HIGH_RISK_BLOCKED]: '高风险交易被阻止',
      [RiskEventType.MEDIUM_RISK_WARNED]: '中风险交易警告',
      [RiskEventType.NEW_DEVICE_LOGIN]: '新设备登录',
      [RiskEventType.ABNORMAL_LOCATION]: '异常位置登录',
      [RiskEventType.LARGE_TRANSFER]: '大额转账',
      [RiskEventType.BLACKLIST_BLOCKED]: '黑名单地址拦截',
      [RiskEventType.PHISHING_BLOCKED]: '钓鱼网站拦截',
      [RiskEventType.UNLIMITED_APPROVAL]: '无限授权检测',
      [RiskEventType.FREQUENT_TRANSACTIONS]: '高频交易',
      [RiskEventType.SUSPICIOUS_CONTRACT]: '可疑合约交互',
      [RiskEventType.USER_CONFIRMED_HIGH_RISK]: '用户确认高风险交易',
      [RiskEventType.RULE_CONFIG_CHANGED]: '风控规则配置变更',
      [RiskEventType.BLACKLIST_UPDATED]: '黑白名单更新',
    };
    return titles[eventType] || '风控事件';
  }

  /**
   * 记录风控事件
   * @param eventType 事件类型
   * @param data 事件数据
   * @param options 选项
   */
  recordEvent(
    eventType: RiskEventType,
    data?: Partial<RiskEvent>,
    options?: {
      riskLevel?: RiskLevel;
      triggerAlert?: boolean;
    }
  ): RiskEvent {
    const alertLevel = this.determineAlertLevel(eventType, options?.riskLevel);
    const title = this.generateEventTitle(eventType);

    const event: RiskEvent = {
      eventId: this.generateEventId(),
      eventType,
      level: alertLevel,
      title,
      isRead: false,
      isHandled: false,
      createdAt: new Date(),
      ...data,
    };

    this.events.set(event.eventId, event);
    this.cleanupOldEvents();

    if (options?.triggerAlert !== false) {
      this.triggerAlert(event);
    }

    this.notifyListeners(eventType, event);

    return event;
  }

  /**
   * 从决策结果记录事件
   * @param decision 风控决策
   * @param ruleResults 规则结果
   * @param userId 用户 ID
   * @param walletAddress 钱包地址
   */
  recordDecisionEvent(
    decision: RiskDecision,
    ruleResults: RiskRuleResult[],
    userId?: string,
    walletAddress?: string
  ): RiskEvent[] {
    const events: RiskEvent[] = [];

    if (decision.level === RiskLevel.CRITICAL || decision.level === RiskLevel.HIGH) {
      let eventType = RiskEventType.HIGH_RISK_BLOCKED;

      if (decision.matchedRules.some((r) => r.ruleCode === 'BLACKLIST_ADDRESS' || r.ruleCode === 'BLACKLIST_CONTRACT')) {
        eventType = RiskEventType.BLACKLIST_BLOCKED;
      } else if (decision.matchedRules.some((r) => r.ruleCode === 'PHISHING_DOMAIN')) {
        eventType = RiskEventType.PHISHING_BLOCKED;
      }

      const event = this.recordEvent(eventType, {
        userId,
        walletAddress,
        decisionId: decision.decisionId,
        description: decision.reasons.join('；'),
        data: {
          riskScore: decision.riskScore.totalScore,
          riskLevel: decision.level,
          action: decision.action,
          matchedRules: decision.matchedRules.map((r) => r.ruleCode),
        },
      }, {
        riskLevel: decision.level,
        triggerAlert: true,
      });
      events.push(event);
    }

    if (decision.level === RiskLevel.MEDIUM) {
      const event = this.recordEvent(RiskEventType.MEDIUM_RISK_WARNED, {
        userId,
        walletAddress,
        decisionId: decision.decisionId,
        description: decision.reasons.join('；'),
        data: {
          riskScore: decision.riskScore.totalScore,
          riskLevel: decision.level,
          action: decision.action,
        },
      }, {
        riskLevel: decision.level,
        triggerAlert: this.alertConfig.minLevel <= AlertLevel.WARNING,
      });
      events.push(event);
    }

    for (const rule of ruleResults.filter((r) => r.matched)) {
      let ruleEventType: RiskEventType | null = null;

      switch (rule.ruleCode) {
        case 'LARGE_TRANSFER':
          ruleEventType = RiskEventType.LARGE_TRANSFER;
          break;
        case 'UNLIMITED_APPROVAL':
        case 'NFT_APPROVAL_FOR_ALL':
          ruleEventType = RiskEventType.UNLIMITED_APPROVAL;
          break;
        case 'FREQUENT_TRANSACTIONS':
          ruleEventType = RiskEventType.FREQUENT_TRANSACTIONS;
          break;
        case 'SUSPICIOUS_CONTRACT':
          ruleEventType = RiskEventType.SUSPICIOUS_CONTRACT;
          break;
      }

      if (ruleEventType) {
        const event = this.recordEvent(ruleEventType, {
          userId,
          walletAddress,
          ruleCode: rule.ruleCode,
          decisionId: decision.decisionId,
          description: rule.reason,
          data: rule.detail,
        }, {
          riskLevel: rule.level,
          triggerAlert: false,
        });
        events.push(event);
      }
    }

    return events;
  }

  /**
   * 触发告警
   * @param event 风控事件
   */
  private triggerAlert(event: RiskEvent): void {
    if (!this.alertConfig.enabled) return;

    const levelOrder = [AlertLevel.INFO, AlertLevel.WARNING, AlertLevel.DANGER, AlertLevel.CRITICAL];
    const eventLevelIndex = levelOrder.indexOf(event.level);
    const minLevelIndex = levelOrder.indexOf(this.alertConfig.minLevel);

    if (eventLevelIndex < minLevelIndex) return;

    const silenceKey = `${event.eventType}_${event.userId || 'global'}`;
    const lastAlertTime = this.lastAlertTimestamps.get(silenceKey) || 0;
    const now = Date.now();

    if (now - lastAlertTime < this.alertConfig.silencePeriod * 1000) {
      return;
    }

    this.lastAlertTimestamps.set(silenceKey, now);

    for (const channel of this.alertConfig.channels) {
      const callback = this.channelCallbacks.get(channel);
      if (callback) {
        try {
          callback(event);
        } catch (error) {
          console.error(`Alert channel ${channel} error:`, error);
        }
      }
    }
  }

  /**
   * 注册告警渠道回调
   * @param channel 告警渠道
   * @param callback 回调函数
   */
  registerAlertChannel(channel: AlertChannel, callback: AlertCallback): void {
    this.channelCallbacks.set(channel, callback);
  }

  /**
   * 移除告警渠道回调
   * @param channel 告警渠道
   */
  unregisterAlertChannel(channel: AlertChannel): boolean {
    return this.channelCallbacks.delete(channel);
  }

  /**
   * 添加事件监听器
   * @param eventType 事件类型
   * @param callback 回调函数
   */
  addEventListener(eventType: RiskEventType, callback: AlertCallback): void {
    let listeners = this.eventListeners.get(eventType);
    if (!listeners) {
      listeners = new Set();
      this.eventListeners.set(eventType, listeners);
    }
    listeners.add(callback);
  }

  /**
   * 移除事件监听器
   * @param eventType 事件类型
   * @param callback 回调函数
   */
  removeEventListener(eventType: RiskEventType, callback: AlertCallback): boolean {
    const listeners = this.eventListeners.get(eventType);
    if (!listeners) return false;
    return listeners.delete(callback);
  }

  /**
   * 通知所有监听器
   * @param eventType 事件类型
   * @param event 事件
   */
  private notifyListeners(eventType: RiskEventType, event: RiskEvent): void {
    const listeners = this.eventListeners.get(eventType);
    if (listeners) {
      for (const callback of listeners) {
        try {
          callback(event);
        } catch (error) {
          console.error('Event listener error:', error);
        }
      }
    }
  }

  /**
   * 获取事件详情
   * @param eventId 事件 ID
   */
  getEvent(eventId: string): RiskEvent | null {
    return this.events.get(eventId) || null;
  }

  /**
   * 查询事件列表
   * @param filter 过滤条件
   */
  queryEvents(filter: EventQueryFilter = {}): {
    events: RiskEvent[];
    total: number;
    page: number;
    pageSize: number;
  } {
    let result = Array.from(this.events.values());

    if (filter.eventType && filter.eventType.length > 0) {
      result = result.filter((e) => filter.eventType!.includes(e.eventType));
    }

    if (filter.level && filter.level.length > 0) {
      result = result.filter((e) => filter.level!.includes(e.level));
    }

    if (filter.userId) {
      result = result.filter((e) => e.userId === filter.userId);
    }

    if (filter.walletAddress) {
      result = result.filter((e) => e.walletAddress === filter.walletAddress);
    }

    if (filter.startTime) {
      result = result.filter((e) => e.createdAt >= filter.startTime!);
    }

    if (filter.endTime) {
      result = result.filter((e) => e.createdAt <= filter.endTime!);
    }

    if (filter.isRead !== undefined) {
      result = result.filter((e) => e.isRead === filter.isRead);
    }

    if (filter.isHandled !== undefined) {
      result = result.filter((e) => e.isHandled === filter.isHandled);
    }

    result.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    const total = result.length;
    const page = filter.page || 1;
    const pageSize = filter.pageSize || 20;
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const pagedEvents = result.slice(startIndex, endIndex);

    return {
      events: pagedEvents,
      total,
      page,
      pageSize,
    };
  }

  /**
   * 标记事件为已读
   * @param eventId 事件 ID
   */
  markAsRead(eventId: string): boolean {
    const event = this.events.get(eventId);
    if (event) {
      event.isRead = true;
      return true;
    }
    return false;
  }

  /**
   * 标记所有事件为已读
   * @param userId 用户 ID（可选）
   */
  markAllAsRead(userId?: string): number {
    let count = 0;
    for (const event of this.events.values()) {
      if (!event.isRead && (!userId || event.userId === userId)) {
        event.isRead = true;
        count++;
      }
    }
    return count;
  }

  /**
   * 处理事件
   * @param eventId 事件 ID
   * @param result 处理结果
   * @param handledBy 处理人
   */
  handleEvent(eventId: string, result: string, handledBy?: string): boolean {
    const event = this.events.get(eventId);
    if (event) {
      event.isHandled = true;
      event.handleResult = result;
      event.handledBy = handledBy;
      event.handledAt = new Date();
      return true;
    }
    return false;
  }

  /**
   * 获取事件统计
   * @param userId 用户 ID（可选）
   */
  getStatistics(userId?: string): EventStatistics {
    const events = userId
      ? Array.from(this.events.values()).filter((e) => e.userId === userId)
      : Array.from(this.events.values());

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(todayStart.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const levelCounts = {
      [AlertLevel.INFO]: 0,
      [AlertLevel.WARNING]: 0,
      [AlertLevel.DANGER]: 0,
      [AlertLevel.CRITICAL]: 0,
    };

    const typeCounts: Record<RiskEventType, number> = {} as Record<RiskEventType, number>;
    for (const type of Object.values(RiskEventType)) {
      typeCounts[type] = 0;
    }

    let todayCount = 0;
    let weekCount = 0;
    let monthCount = 0;
    let unreadCount = 0;
    let unhandledCount = 0;
    let blockedCount = 0;
    let userConfirmedCount = 0;

    for (const event of events) {
      levelCounts[event.level]++;

      if (event.eventType in typeCounts) {
        typeCounts[event.eventType]++;
      }

      if (event.createdAt >= todayStart) todayCount++;
      if (event.createdAt >= weekStart) weekCount++;
      if (event.createdAt >= monthStart) monthCount++;

      if (!event.isRead) unreadCount++;
      if (!event.isHandled) unhandledCount++;

      if (
        event.eventType === RiskEventType.HIGH_RISK_BLOCKED ||
        event.eventType === RiskEventType.BLACKLIST_BLOCKED ||
        event.eventType === RiskEventType.PHISHING_BLOCKED
      ) {
        blockedCount++;
      }

      if (event.eventType === RiskEventType.USER_CONFIRMED_HIGH_RISK) {
        userConfirmedCount++;
      }
    }

    return {
      totalEvents: events.length,
      levelCounts,
      typeCounts,
      todayCount,
      weekCount,
      monthCount,
      unreadCount,
      unhandledCount,
      blockedCount,
      userConfirmedCount,
    };
  }

  /**
   * 清理旧事件
   */
  private cleanupOldEvents(): void {
    if (this.events.size <= this.maxEvents) return;

    const sorted = Array.from(this.events.values()).sort(
      (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
    );

    const toRemove = sorted.slice(0, this.events.size - this.maxEvents);
    for (const event of toRemove) {
      this.events.delete(event.eventId);
    }
  }

  /**
   * 删除事件
   * @param eventId 事件 ID
   */
  deleteEvent(eventId: string): boolean {
    return this.events.delete(eventId);
  }

  /**
   * 清除所有事件
   */
  clearAllEvents(): void {
    this.events.clear();
  }

  /**
   * 获取事件总数
   */
  getEventCount(): number {
    return this.events.size;
  }

  /**
   * 导出事件数据
   * @param filter 过滤条件
   */
  exportEvents(filter: EventQueryFilter = {}): string {
    const { events } = this.queryEvents({ ...filter, pageSize: 10000 });
    return JSON.stringify(events, null, 2);
  }
}

export const riskEventService = new RiskEventService();
