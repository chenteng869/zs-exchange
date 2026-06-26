/**
 * Nansen 告警管理（AlertManager）
 *
 * 职责：
 *  - 告警规则：CRUD
 *  - 信号评估：evaluateSignal(signal) -> Alert[]
 *  - 多通道投递：email / push / sms / webhook
 *  - 告警历史 + 未读管理
 *
 * 设计原则：
 *  - 复用现有 notification 模块（EmailService / PushService / SmsService）
 *  - 不直接绑定某一具体 service，构造时注入（方便测试 + 解耦）
 *  - 演示降级：未注入 service 时仅记录到历史，不实际发送
 */

import {
  Alert,
  AlertChannel,
  AlertPriority,
  AlertType,
  Chain,
  SignalType,
  SmartMoneySignal,
  WalletLabel,
  NANSEN_SMART_MONEY_FLOW_THRESHOLD_USD,
  NANSEN_WHALE_THRESHOLD_USD,
  genId,
} from './types';

// =============================================================================
// 规则
// =============================================================================

export type AlertRuleType =
  | 'smart_money_buy'      // 聪明钱买入某币种
  | 'whale_transfer'       // 鲸鱼转账 > 阈值
  | 'smart_money_net_flow' // 某币种聪明钱净流入 > 阈值
  | 'contract_upgrade';    // 合约升级（演示）

export interface AlertRule {
  id: string;
  type: AlertRuleType;
  name: string;
  /** 是否启用 */
  enabled: boolean;
  /** 适用链（空数组 = 全部） */
  chains: Chain[];
  /** 适用 token 地址（空数组 = 全部） */
  tokens: string[];
  /** 适用钱包标签（空数组 = 全部） */
  walletLabels: WalletLabel[];
  /** 阈值（USD） */
  thresholdUsd: number;
  /** 优先级 */
  priority: AlertPriority;
  /** 投递通道 */
  channels: AlertChannel[];
  /** 接收人 userId 列表 */
  recipients: string[];
  /** 接收人邮箱（email 通道专用） */
  recipientEmails: string[];
  /** webhook URL（webhook 通道专用） */
  webhookUrls: string[];
  /** 静默期（毫秒）：同一 rule 在该窗口内不重复触发 */
  cooldownMs: number;
  /** 创建时间 */
  createdAt: number;
  /** 上次触发时间 */
  lastTriggeredAt: number;
}

export interface AlertRuleInput {
  type: AlertRuleType;
  name?: string;
  enabled?: boolean;
  chains?: Chain[];
  tokens?: string[];
  walletLabels?: WalletLabel[];
  thresholdUsd?: number;
  priority?: AlertPriority;
  channels?: AlertChannel[];
  recipients?: string[];
  recipientEmails?: string[];
  webhookUrls?: string[];
  cooldownMs?: number;
}

// =============================================================================
// 通道接口（注入现有 notification 模块）
// =============================================================================

export interface AlertEmailChannel {
  sendSecurityAlert(
    userId: string,
    toEmail: string,
    alertType: string,
    vars: Record<string, string>,
  ): Promise<any>;
}

export interface AlertPushChannel {
  sendToUser(
    userId: string,
    payload: { title: string; body: string; data?: Record<string, any> },
  ): Promise<any[]>;
}

export interface AlertSmsChannel {
  sendCustom(userId: string, phone: string, body: string): Promise<any>;
}

export interface AlertWebhookChannel {
  /** 内置 fetch，可被测试注入 */
  fetchImpl?: typeof fetch;
}

export interface AlertManagerOptions {
  email?: AlertEmailChannel;
  push?: AlertPushChannel;
  sms?: AlertSmsChannel;
  webhook?: AlertWebhookChannel;
  logger?: {
    debug: (...args: any[]) => void;
    info: (...args: any[]) => void;
    warn: (...args: any[]) => void;
    error: (...args: any[]) => void;
  };
  now?: () => number;
  /** 最大历史数（超出 FIFO） */
  maxHistory?: number;
}

// =============================================================================
// AlertManager
// =============================================================================

export class AlertManager {
  private readonly rules: Map<string, AlertRule> = new Map();
  private readonly history: Alert[] = [];
  private readonly email?: AlertEmailChannel;
  private readonly push?: AlertPushChannel;
  private readonly sms?: AlertSmsChannel;
  private readonly webhook?: AlertWebhookChannel;
  private readonly logger: NonNullable<AlertManagerOptions['logger']>;
  private readonly now: () => number;
  private readonly maxHistory: number;
  private ruleSeq = 0;

  constructor(opts: AlertManagerOptions = {}) {
    this.email = opts.email;
    this.push = opts.push;
    this.sms = opts.sms;
    this.webhook = opts.webhook;
    this.logger = opts.logger || {
      debug: () => {},
      info: () => {},
      warn: () => {},
      error: () => {},
    };
    this.now = opts.now || (() => Date.now());
    this.maxHistory = opts.maxHistory ?? 1_000;
  }

  // -------------------------------------------------------------------------
  // 规则 CRUD
  // -------------------------------------------------------------------------

  addRule(input: AlertRuleInput): AlertRule {
    this.ruleSeq += 1;
    const id = `rule_${this.ruleSeq}_${Date.now().toString(36)}`;
    const rule: AlertRule = {
      id,
      type: input.type,
      name: input.name || this.defaultRuleName(input.type),
      enabled: input.enabled !== false,
      chains: input.chains || [],
      tokens: input.tokens || [],
      walletLabels: input.walletLabels || [],
      thresholdUsd: input.thresholdUsd ?? this.defaultThresholdFor(input.type),
      priority: input.priority ?? this.defaultPriorityFor(input.type),
      channels: input.channels || ['push'],
      recipients: input.recipients || [],
      recipientEmails: input.recipientEmails || [],
      webhookUrls: input.webhookUrls || [],
      cooldownMs: input.cooldownMs ?? 5 * 60_000,
      createdAt: this.now(),
      lastTriggeredAt: 0,
    };
    this.rules.set(id, rule);
    return rule;
  }

  removeRule(id: string): boolean {
    return this.rules.delete(id);
  }

  getRule(id: string): AlertRule | undefined {
    return this.rules.get(id);
  }

  listRules(): AlertRule[] {
    return Array.from(this.rules.values());
  }

  enableRule(id: string): boolean {
    const r = this.rules.get(id);
    if (r) {
      r.enabled = true;
      return true;
    }
    return false;
  }

  disableRule(id: string): boolean {
    const r = this.rules.get(id);
    if (r) {
      r.enabled = false;
      return true;
    }
    return false;
  }

  // -------------------------------------------------------------------------
  // 评估
  // -------------------------------------------------------------------------

  /**
   * 评估一条信号，返回触发的告警列表（已应用 cooldown）
   */
  evaluateSignal(signal: SmartMoneySignal): Alert[] {
    const out: Alert[] = [];
    for (const rule of this.rules.values()) {
      if (!rule.enabled) continue;
      if (!this.ruleApplies(rule, signal)) continue;
      if (this.now() - rule.lastTriggeredAt < rule.cooldownMs) continue;
      const alert = this.buildAlert(rule, signal);
      if (alert) {
        rule.lastTriggeredAt = this.now();
        this.history.push(alert);
        if (this.history.length > this.maxHistory) {
          this.history.splice(0, this.history.length - this.maxHistory);
        }
        out.push(alert);
      }
    }
    return out;
  }

  /** 主动触发一次告警（用于外部事件，如合约升级） */
  trigger(alert: Omit<Alert, 'id' | 'triggeredAt' | 'isRead'>): Alert {
    const full: Alert = {
      ...alert,
      id: genId('alert'),
      triggeredAt: this.now(),
      isRead: false,
    };
    this.history.push(full);
    if (this.history.length > this.maxHistory) {
      this.history.splice(0, this.history.length - this.maxHistory);
    }
    return full;
  }

  private ruleApplies(rule: AlertRule, signal: SmartMoneySignal): boolean {
    if (rule.chains.length > 0 && !rule.chains.includes(signal.chain)) return false;
    if (rule.tokens.length > 0) {
      const sig = signal.token.address.toLowerCase();
      if (!rule.tokens.some((t) => t.toLowerCase() === sig)) return false;
    }
    switch (rule.type) {
      case 'smart_money_buy':
        return (
          (signal.signalType === 'buy' || signal.signalType === 'accumulate') &&
          Number(signal.amountUsd) >= rule.thresholdUsd
        );
      case 'whale_transfer':
        return Number(signal.amountUsd) >= rule.thresholdUsd;
      case 'smart_money_net_flow':
        // 单条信号：只触发买入/积累类型且金额 >= 阈值
        return (
          (signal.signalType === 'buy' || signal.signalType === 'accumulate') &&
          Number(signal.amountUsd) >= rule.thresholdUsd
        );
      case 'contract_upgrade':
        // 演示：仅当 signal 标记了 'CONTRACT_UPGRADE' rule 时
        return signal.triggeredRules?.includes('CONTRACT_UPGRADE') || false;
      default:
        return false;
    }
  }

  private buildAlert(rule: AlertRule, signal: SmartMoneySignal): Alert | null {
    const type = this.mapAlertType(rule.type);
    const title = this.buildTitle(rule, signal);
    const description = this.buildDescription(rule, signal);
    return {
      id: genId('alert'),
      type,
      priority: rule.priority,
      chain: signal.chain,
      title,
      description,
      data: {
        ruleId: rule.id,
        ruleType: rule.type,
        signal,
        // 复制发送所需的字段（避免外部查找）
        rule: {
          recipients: [...rule.recipients],
          recipientEmails: [...rule.recipientEmails],
          webhookUrls: [...rule.webhookUrls],
          channels: [...rule.channels],
        },
        walletAddress: signal.walletAddress,
        tokenSymbol: signal.token.symbol,
        amountUsd: signal.amountUsd,
        txHash: signal.txHash,
      },
      triggeredAt: this.now(),
      isRead: false,
      channels: [...rule.channels],
    };
  }

  private mapAlertType(t: AlertRuleType): AlertType {
    switch (t) {
      case 'smart_money_buy':
        return 'smart_money_buy';
      case 'whale_transfer':
        return 'whale_movement';
      case 'smart_money_net_flow':
        return 'smart_money_buy';
      case 'contract_upgrade':
        return 'liquidity_change';
    }
  }

  private buildTitle(rule: AlertRule, signal: SmartMoneySignal): string {
    switch (rule.type) {
      case 'smart_money_buy':
        return `Smart Money 买入 ${signal.token.symbol} ($${Number(signal.amountUsd).toLocaleString()})`;
      case 'whale_transfer':
        return `鲸鱼转账 ${signal.token.symbol} ($${Number(signal.amountUsd).toLocaleString()})`;
      case 'smart_money_net_flow':
        return `${signal.token.symbol} 聪明钱净流入 $${Number(signal.amountUsd).toLocaleString()}`;
      case 'contract_upgrade':
        return `合约升级告警: ${signal.token.symbol}`;
    }
  }

  private buildDescription(rule: AlertRule, signal: SmartMoneySignal): string {
    const short = signal.walletAddress.length > 12
      ? `${signal.walletAddress.slice(0, 6)}...${signal.walletAddress.slice(-4)}`
      : signal.walletAddress;
    return [
      `链: ${signal.chain}`,
      `信号类型: ${signal.signalType}`,
      `钱包: ${short}`,
      `金额: ${signal.amount} ($${Number(signal.amountUsd).toLocaleString()})`,
      `Tx: ${signal.txHash.slice(0, 10)}...`,
      `置信度: ${(signal.confidence * 100).toFixed(1)}%`,
    ].join(' | ');
  }

  // -------------------------------------------------------------------------
  // 发送
  // -------------------------------------------------------------------------

  async sendAlert(alert: Alert): Promise<{ email: number; push: number; sms: number; webhook: number; skipped: string[] }> {
    const result = { email: 0, push: 0, sms: 0, webhook: 0, skipped: [] as string[] };

    for (const ch of alert.channels) {
      try {
        switch (ch) {
          case 'email': {
            if (!this.email) { result.skipped.push('email:no_service'); break; }
            if (alert.data?.rule?.recipientEmails) {
              for (const e of alert.data.rule.recipientEmails) {
                await this.email.sendSecurityAlert('', e, alert.type, {
                  time: new Date(alert.triggeredAt).toISOString(),
                  detail: alert.description,
                });
                result.email++;
              }
            } else {
              // 缺省投递：尝试 alert.data.recipients 关联的邮箱
              result.skipped.push('email:no_recipient_emails');
            }
            break;
          }
          case 'push': {
            if (!this.push) { result.skipped.push('push:no_service'); break; }
            const recipients: string[] = alert.data?.rule?.recipients || [];
            for (const uid of recipients) {
              const r = await this.push.sendToUser(uid, {
                title: alert.title,
                body: alert.description,
                data: { alertId: alert.id, type: alert.type, chain: alert.chain },
              });
              result.push += r?.length || 0;
            }
            if (recipients.length === 0) result.skipped.push('push:no_recipients');
            break;
          }
          case 'sms': {
            if (!this.sms) { result.skipped.push('sms:no_service'); break; }
            result.skipped.push('sms:no_phone_binding');
            break;
          }
          case 'webhook': {
            const urls: string[] = alert.data?.rule?.webhookUrls || [];
            if (urls.length === 0) { result.skipped.push('webhook:no_urls'); break; }
            const fetchImpl = this.webhook?.fetchImpl || (typeof fetch !== 'undefined' ? fetch : null);
            if (!fetchImpl) { result.skipped.push('webhook:no_fetch'); break; }
            for (const url of urls) {
              try {
                await fetchImpl(url, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(alert),
                });
                result.webhook++;
              } catch (err) {
                this.logger.warn(`AlertManager: webhook ${url} failed: ${(err as Error).message}`);
              }
            }
            break;
          }
        }
      } catch (err) {
        this.logger.warn(`AlertManager: channel ${ch} failed: ${(err as Error).message}`);
      }
    }
    return result;
  }

  // -------------------------------------------------------------------------
  // 历史
  // -------------------------------------------------------------------------

  getAlerts(opts: { unreadOnly?: boolean; type?: AlertType; limit?: number } = {}): Alert[] {
    let arr = this.history.slice().reverse();
    if (opts.unreadOnly) arr = arr.filter((a) => !a.isRead);
    if (opts.type) arr = arr.filter((a) => a.type === opts.type);
    if (opts.limit) arr = arr.slice(0, opts.limit);
    return arr;
  }

  markAsRead(id: string): boolean {
    const a = this.history.find((x) => x.id === id);
    if (a) {
      a.isRead = true;
      return true;
    }
    return false;
  }

  markAllAsRead(): number {
    let n = 0;
    for (const a of this.history) {
      if (!a.isRead) {
        a.isRead = true;
        n++;
      }
    }
    return n;
  }

  clearHistory(): void {
    this.history.length = 0;
  }

  getStats(): { total: number; unread: number; byType: Record<AlertType, number> } {
    const byType: Record<AlertType, number> = {
      smart_money_buy: 0,
      smart_money_sell: 0,
      large_transfer: 0,
      whale_movement: 0,
      token_unlock: 0,
      liquidity_change: 0,
    };
    let unread = 0;
    for (const a of this.history) {
      byType[a.type] = (byType[a.type] || 0) + 1;
      if (!a.isRead) unread++;
    }
    return { total: this.history.length, unread, byType };
  }

  // -------------------------------------------------------------------------
  // 内部
  // -------------------------------------------------------------------------

  private defaultThresholdFor(t: AlertRuleType): number {
    switch (t) {
      case 'smart_money_buy':
        return 100_000;
      case 'whale_transfer':
        return NANSEN_WHALE_THRESHOLD_USD;
      case 'smart_money_net_flow':
        return NANSEN_SMART_MONEY_FLOW_THRESHOLD_USD;
      case 'contract_upgrade':
        return 0;
    }
  }

  private defaultPriorityFor(t: AlertRuleType): AlertPriority {
    switch (t) {
      case 'smart_money_buy':
        return 'medium';
      case 'whale_transfer':
        return 'high';
      case 'smart_money_net_flow':
        return 'high';
      case 'contract_upgrade':
        return 'critical';
    }
  }

  private defaultRuleName(t: AlertRuleType): string {
    switch (t) {
      case 'smart_money_buy':
        return 'Smart Money 买入';
      case 'whale_transfer':
        return '鲸鱼转账';
      case 'smart_money_net_flow':
        return '聪明钱净流入';
      case 'contract_upgrade':
        return '合约升级';
    }
  }
}
