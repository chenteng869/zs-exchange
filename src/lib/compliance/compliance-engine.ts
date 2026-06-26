/**
 * 合规自检引擎
 *
 * 每日 / 手动 / 触发的合规自检：
 *  - AML：监控大额转账（> CTR_THRESHOLD_USD）
 *  - CTF：监控可疑 IP（Tor / VPN / 已知代理）
 *  - KYC：检查过期证件
 *  - TravelRule：跨境转账 > TRAVEL_RULE_THRESHOLD_USD 是否带对手方信息
 *  - Sanctions：检查 OFAC SDN List（mock 50+ 条）
 *  - TransactionMonitoring：异常交易模式（拆分 / 高频）
 *
 * 告警订阅：onFinding / onAlert
 * 综合得分：getComplianceScore（按权重计算）
 *
 * @module lib/compliance/compliance-engine
 */

import { randomString } from '@/lib/auth/crypto';
import type {
  AlertHandler,
  ComplianceCategory,
  ComplianceCheck,
  ComplianceCheckType,
  ComplianceFinding,
  ComplianceSeverity,
  FindingHandler,
  RiskAlert,
} from './types';

// ============================================================================
// 关键常量
// ============================================================================

/** 美国 CTR 阈值：> 10,000 USD 必须报告 */
export const CTR_THRESHOLD_USD = 10_000;

/** 可疑活动报告阈值 */
export const SAR_THRESHOLD_USD = 5_000;

/** Travel Rule 阈值（≥ 3,000 USD 部分司法管辖区） */
export const TRAVEL_RULE_THRESHOLD_USD = 1_000;

/** KYC 1 年续期 */
export const KYC_RENEWAL_DAYS = 365;

/** 提前 30 天提醒 KYC 续期 */
export const KYC_EXPIRY_WARNING_DAYS = 30;

/** 异常时段（北京时间 02:00-06:00） */
const SUSPICIOUS_HOUR_START_BJ = 2;
const SUSPICIOUS_HOUR_END_BJ = 6;

const DAY_MS = 24 * 60 * 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;

// ============================================================================
// 合规自检权重
// ============================================================================

export const COMPLIANCE_SCORE_WEIGHTS: Record<ComplianceCategory, number> = {
  AML: 0.3,
  KYC: 0.25,
  TravelRule: 0.2,
  Sanctions: 0.15,
  TransactionMonitoring: 0.1,
  CTF: 0.0, // 并入 AML
};

// ============================================================================
// Mock 制裁名单（OFAC SDN 模拟）
// ============================================================================

export const MOCK_SANCTIONS_LIST: string[] = [
  // ETH 地址
  '0x1234567890abcdef1234567890abcdef12345678',
  '0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef',
  '0x0000000000000000000000000000000000000000',
  '0xabcdef0123456789abcdef0123456789abcdef01',
  '0xbadc0ffee0123456789abcdef0123456789abcd',
  // BTC 地址（P2PKH 风格）
  '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
  '1CounterpartyXXXXXXXXXXXXXXXUWLpVr',
  '1BoatSLRHtKNngkdXEeobR76b53LETtpyT',
  '1F3sAm6ZtwLAUnj7d38pGFxtP3RVEvtsbV',
  '1Q1pE5vPGEEMqRcVRMbtBK842Y6Pzo6nK9',
  // TRX 地址
  'TLa2f6VPqDgRE67v1736s7bJ8Ray5wYjU7',
  'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t',
  'TB1z4w5m9p8kF7d3V2sR6nQ9xC5yH8jL2v',
  'TMuA6YqfCe94Re9z4Z7qB6mEyVf1HkJ4D2',
  // SOL 地址
  '5w6z5PW7C5f5d5e5f5g5h5i5j5k5l5m5n5o5p5q5r5s5t5u5v5w5x5y5z5a',
  '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
  '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM',
  // 已知诈骗地址
  '0x9999999999999999999999999999999999999999',
  '0x8888888888888888888888888888888888888888',
  '0x7777777777777777777777777777777777777777',
  '0x6666666666666666666666666666666666666666',
  '0x5555555555555555555555555555555555555555',
  // 暗网市场模拟
  '1M5d7Vf7q9rQy2bXz8wVvL5K8YpNvGt4Hs',
  '1N7Zrtm8z7VtP9rJtD3kBzS5uQ9wYpKvLtH',
  '0x1234abcd5678ef901234abcd5678ef901234abcd',
  '0xbeefbeefbeefbeefbeefbeefbeefbeefbeefbeef',
  '0xc0ffeec0ffeec0ffeec0ffeec0ffeec0ffeec0ff',
  '0xfacefacefacefacefacefacefacefacefaceface',
  // FATF 重点关注
  'TKrakenSanction20242024KrakenSanction2024',
  'TRussiaOligarch2024RussiaOligarch20242024',
  '0xLaunderyMixer2024LaunderyMixer2024Laund',
  'TBinanceHotWallet20242024BinanceHotWallet20',
  // 北朝鲜
  '0xDPRK2024DPRK2024DPRK2024DPRK2024DPRK2024',
  'TNorthKorea2024NorthKorea2024NorthKorea20',
  // 伊朗
  '0xIranSanction2024IranSanction2024IranSanct',
  'TIran20242024Iran20242024Iran20242024Iran20',
  // 俄罗斯
  '0xRussia2024Russia2024Russia2024Russia2024',
  'TRussia20242024Russia20242024Russia202420',
  // 缅甸
  'TMyanmar2024Myanmar2024Myanmar2024Myanmar2',
  '0xMyanmar2024Myanmar2024Myanmar2024Myanma',
  // 叙利亚
  'TSyria2024Syria2024Syria2024Syria2024Syria',
  // 委内瑞拉
  '0xVenezuela20242024Venezuela20242024Vene',
  // 古巴
  'TCuba2024Cuba2024Cuba2024Cuba2024Cuba2024',
  // 也门
  'TYemen2024Yemen2024Yemen2024Yemen2024Yemen',
  // 阿富汗
  'TAfghanistan2024Afghanistan2024Afghan2024',
  // 利比亚
  '0xLibya2024Libya2024Libya2024Libya2024L',
  // 索马里
  'TSomalia2024Somalia2024Somalia2024Somalia2',
  // 苏丹
  '0xSudan2024Sudan2024Sudan2024Sudan2024S',
  // 津巴布韦
  'TZimbabwe2024Zimbabwe2024Zimbabwe2024Zimb',
  // 白俄罗斯
  'TBelarus2024Belarus2024Belarus2024Belaru',
  // 阿根廷受制裁
  '0xArgentina2024Argentina2024Argentina20',
  // 香港受制裁
  'THK2024HK2024HK2024HK2024HK2024HK2024HK20',
];

// ============================================================================
// 已知 Tor 出口节点 / VPN 标记（mock）
// ============================================================================

const SUSPICIOUS_IPS: ReadonlySet<string> = new Set([
  '185.220.101.1',  // Tor
  '185.220.102.1',
  '199.249.230.114',
  '23.129.64.220',  // Tor
  '162.247.74.7',
  '162.247.74.74',
  '104.244.76.13',  // VPN
  '104.244.76.180',
  '107.189.30.60',  // VPN
]);

// ============================================================================
// 交易 / 用户记录（外部输入）
// ============================================================================

export interface TransactionInput {
  id: string;
  userId: string;
  amountUsd: number;
  type: 'deposit' | 'withdraw' | 'transfer' | 'trade';
  occurredAt: number;
  fromAddress?: string;
  toAddress?: string;
  /** 跨境标记 */
  crossBorder?: boolean;
  /** 对手方信息（Travel Rule） */
  counterparty?: {
    name?: string;
    address?: string;
    account?: string;
  };
  ipAddress?: string;
  country?: string;
  userHomeCountry?: string;
}

export interface KycRecordInput {
  userId: string;
  expiresAt: number;
  status: 'approved' | 'pending' | 'rejected' | 'expired';
  country?: string;
  level: 'basic' | 'advanced';
}

// ============================================================================
// ComplianceEngine
// ============================================================================

export interface ComplianceEngineDeps {
  /** 获取近 24h 交易 */
  getRecentTransactions?: (windowMs: number) => TransactionInput[];
  /** 获取所有 KYC 记录 */
  getAllKycRecords?: () => KycRecordInput[];
  /** 持久化回调 */
  writeFile?: (path: string, data: string) => Promise<void> | void;
  readFile?: (path: string) => Promise<string | null> | string | null;
  /** 持久化路径 */
  persistPath?: string;
}

export class ComplianceEngine {
  private readonly findings: ComplianceFinding[] = [];
  private readonly checks: ComplianceCheck[] = [];
  private readonly alerts: RiskAlert[] = [];
  private readonly findingHandlers: Set<FindingHandler> = new Set();
  private readonly alertHandlers: Set<AlertHandler> = new Set();

  private readonly deps: ComplianceEngineDeps;
  private lastDailyCheckAt?: number;
  private readonly persistPath: string;

  constructor(deps: ComplianceEngineDeps = {}) {
    this.deps = deps;
    this.persistPath = deps.persistPath ?? '.compliance-engine.json';
  }

  // --------------------------------------------------------------------------
  // 自检入口
  // --------------------------------------------------------------------------

  /**
   * 每日自检
   */
  async runDailyCheck(): Promise<ComplianceCheck> {
    const checkId = `chk-daily-${randomString(8)}`;
    const findings: ComplianceFinding[] = [];

    findings.push(...this.runAmlChecks());
    findings.push(...this.runCtfChecks());
    findings.push(...this.runKycChecks());
    findings.push(...this.runTravelRuleChecks());
    findings.push(...this.runSanctionsChecks());
    findings.push(...this.runTransactionMonitoringChecks());

    for (const f of findings) this.findings.push(f);
    for (const f of findings) this.emitFinding(f);

    const check: ComplianceCheck = {
      id: checkId,
      type: 'daily',
      category: 'AML',
      passed: !findings.some((f) => f.severity === 'critical' || f.severity === 'high'),
      score: this.scoreFindings(findings),
      findings,
      executedAt: Date.now(),
      nextCheckAt: Date.now() + DAY_MS,
    };
    this.checks.push(check);
    this.lastDailyCheckAt = check.executedAt;
    this.persist();
    return { ...check };
  }

  /**
   * 手动自检
   */
  async runManualCheck(category: ComplianceCategory): Promise<ComplianceCheck> {
    const checkId = `chk-manual-${randomString(8)}`;
    const findings = this.runCategoryChecks(category);
    for (const f of findings) this.findings.push(f);
    for (const f of findings) this.emitFinding(f);

    const check: ComplianceCheck = {
      id: checkId,
      type: 'manual',
      category,
      passed: !findings.some((f) => f.severity === 'critical' || f.severity === 'high'),
      score: this.scoreFindings(findings),
      findings,
      executedAt: Date.now(),
    };
    this.checks.push(check);
    this.persist();
    return { ...check };
  }

  /**
   * 触发式自检（高风险事件后调用）
   */
  async runTriggeredCheck(reason: string): Promise<ComplianceCheck> {
    const checkId = `chk-trig-${randomString(8)}`;
    const findings = this.runCategoryChecks('Sanctions')
      .concat(this.runCategoryChecks('AML'));

    for (const f of findings) this.findings.push(f);
    for (const f of findings) this.emitFinding(f);

    const check: ComplianceCheck = {
      id: checkId,
      type: 'triggered',
      category: 'AML',
      passed: !findings.some((f) => f.severity === 'critical' || f.severity === 'high'),
      score: this.scoreFindings(findings),
      findings,
      executedAt: Date.now(),
      executedBy: 'system',
      notes: reason,
    };
    this.checks.push(check);
    this.persist();
    return { ...check };
  }

  // --------------------------------------------------------------------------
  // 各类检查
  // --------------------------------------------------------------------------

  private runCategoryChecks(category: ComplianceCategory): ComplianceFinding[] {
    switch (category) {
      case 'AML': return this.runAmlChecks();
      case 'CTF': return this.runCtfChecks();
      case 'KYC': return this.runKycChecks();
      case 'TravelRule': return this.runTravelRuleChecks();
      case 'Sanctions': return this.runSanctionsChecks();
      case 'TransactionMonitoring': return this.runTransactionMonitoringChecks();
      default: return [];
    }
  }

  private runAmlChecks(): ComplianceFinding[] {
    const out: ComplianceFinding[] = [];
    const txs = this.getRecentTxs(DAY_MS);
    for (const tx of txs) {
      if (tx.amountUsd >= CTR_THRESHOLD_USD) {
        const severity: ComplianceSeverity = tx.amountUsd >= 5 * CTR_THRESHOLD_USD ? 'high' : 'medium';
        out.push(this.buildFinding({
          severity,
          category: 'AML',
          message: `大额交易 ${tx.amountUsd} USD (≥ ${CTR_THRESHOLD_USD} CTR 阈值)`,
          evidence: {
            txId: tx.id,
            userId: tx.userId,
            amountUsd: tx.amountUsd,
            type: tx.type,
          },
          recommendation: '需生成 CTR 报告并向 FinCEN 提交',
        }));
      }
    }
    return out;
  }

  private runCtfChecks(): ComplianceFinding[] {
    const out: ComplianceFinding[] = [];
    const txs = this.getRecentTxs(DAY_MS);
    const suspiciousUsers = new Set<string>();

    for (const tx of txs) {
      if (tx.ipAddress && SUSPICIOUS_IPS.has(tx.ipAddress)) {
        suspiciousUsers.add(tx.userId);
        out.push(this.buildFinding({
          severity: 'medium',
          category: 'CTF',
          message: `可疑 IP ${tx.ipAddress}（Tor/VPN 出口节点）`,
          evidence: {
            txId: tx.id,
            userId: tx.userId,
            ipAddress: tx.ipAddress,
          },
          recommendation: '触发增强身份验证（Step-up KYC）',
        }));
      }

      if (tx.country && tx.userHomeCountry && tx.country !== tx.userHomeCountry
        && tx.amountUsd >= SAR_THRESHOLD_USD) {
        out.push(this.buildFinding({
          severity: 'low',
          category: 'CTF',
          message: `跨国交易 ${tx.userHomeCountry} -> ${tx.country}`,
          evidence: { txId: tx.id, userId: tx.userId, amountUsd: tx.amountUsd },
        }));
      }
    }
    return out;
  }

  private runKycChecks(): ComplianceFinding[] {
    const out: ComplianceFinding[] = [];
    const records = this.deps.getAllKycRecords?.() ?? [];
    const now = Date.now();
    for (const rec of records) {
      const daysLeft = Math.floor((rec.expiresAt - now) / DAY_MS);
      if (rec.status === 'expired' || daysLeft < 0) {
        out.push(this.buildFinding({
          severity: 'high',
          category: 'KYC',
          message: `用户 KYC 已过期 (${rec.userId})`,
          evidence: { userId: rec.userId, expiresAt: rec.expiresAt, daysLeft },
          recommendation: '暂停提现功能，强制重新认证',
        }));
      } else if (daysLeft <= KYC_EXPIRY_WARNING_DAYS) {
        out.push(this.buildFinding({
          severity: daysLeft <= 7 ? 'medium' : 'low',
          category: 'KYC',
          message: `KYC 即将过期 (剩余 ${daysLeft} 天) (${rec.userId})`,
          evidence: { userId: rec.userId, expiresAt: rec.expiresAt, daysLeft },
          recommendation: '邮件 + 站内信提醒用户续期',
        }));
      }
    }
    return out;
  }

  private runTravelRuleChecks(): ComplianceFinding[] {
    const out: ComplianceFinding[] = [];
    const txs = this.getRecentTxs(DAY_MS);
    for (const tx of txs) {
      if (tx.amountUsd < TRAVEL_RULE_THRESHOLD_USD) continue;
      if (!tx.crossBorder) continue;
      const cp = tx.counterparty;
      if (!cp || !cp.name || !cp.address) {
        out.push(this.buildFinding({
          severity: 'high',
          category: 'TravelRule',
          message: `跨境转账 ${tx.amountUsd} USD 缺少对手方信息`,
          evidence: { txId: tx.id, userId: tx.userId, counterparty: cp ?? null },
          recommendation: '退回交易，要求补充 Originator / Beneficiary 信息',
        }));
      }
    }
    return out;
  }

  private runSanctionsChecks(): ComplianceFinding[] {
    const out: ComplianceFinding[] = [];
    const txs = this.getRecentTxs(7 * DAY_MS);
    const sanctionsSet = new Set(MOCK_SANCTIONS_LIST.map((a) => a.toLowerCase()));
    for (const tx of txs) {
      for (const addr of [tx.fromAddress, tx.toAddress]) {
        if (!addr) continue;
        if (sanctionsSet.has(addr.toLowerCase())) {
          out.push(this.buildFinding({
            severity: 'critical',
            category: 'Sanctions',
            message: `OFAC 制裁名单命中: ${addr}`,
            evidence: { txId: tx.id, userId: tx.userId, address: addr },
            recommendation: '立即冻结交易 + 生成 SAR 报告',
          }));
        }
      }
    }
    return out;
  }

  private runTransactionMonitoringChecks(): ComplianceFinding[] {
    const out: ComplianceFinding[] = [];
    const txs = this.getRecentTxs(DAY_MS);
    const userTxs = new Map<string, TransactionInput[]>();
    for (const tx of txs) {
      const arr = userTxs.get(tx.userId) ?? [];
      arr.push(tx);
      userTxs.set(tx.userId, arr);
    }
    for (const [userId, list] of userTxs.entries()) {
      // 拆分检测：单笔 < 1 万但 24h 内累计 ≥ 1 万
      const total = list.reduce((s, t) => s + t.amountUsd, 0);
      const large = list.filter((t) => t.amountUsd >= 5_000).length;
      if (total >= CTR_THRESHOLD_USD && large >= 3) {
        out.push(this.buildFinding({
          severity: 'high',
          category: 'TransactionMonitoring',
          message: `可疑拆分：24h 累计 ${total} USD（${list.length} 笔）`,
          evidence: { userId, totalUsd: total, txCount: list.length },
          recommendation: '生成 SAR 报告',
        }));
      }
      // 异常时段（北京时间 02:00-06:00）
      const suspiciousHour = list.some((t) => {
        const hour = new Date(t.occurredAt).getUTCHours() - 8;
        const normalized = ((hour % 24) + 24) % 24;
        return normalized >= SUSPICIOUS_HOUR_START_BJ
          && normalized < SUSPICIOUS_HOUR_END_BJ
          && t.amountUsd >= SAR_THRESHOLD_USD;
      });
      if (suspiciousHour) {
        out.push(this.buildFinding({
          severity: 'low',
          category: 'TransactionMonitoring',
          message: `用户 ${userId} 在异常时段发生大额操作`,
          evidence: { userId },
        }));
      }
    }
    return out;
  }

  // --------------------------------------------------------------------------
  // 评分
  // --------------------------------------------------------------------------

  /**
   * 综合合规得分（0-100）
   */
  getComplianceScore(): number {
    if (this.checks.length === 0) return 100;
    // 取最近一次 daily check，否则取最近一次
    const daily = this.checks.filter((c) => c.type === 'daily');
    const last = daily[daily.length - 1] ?? this.checks[this.checks.length - 1];
    if (!last) return 100;
    return last.score;
  }

  /**
   * 一次性将 findings 转化为综合分数
   * - 每个 finding 按严重度扣分（critical: 25, high: 10, medium: 4, low: 1, info: 0）
   * - 应用权重（CTF 计入 AML）
   */
  private scoreFindings(findings: ComplianceFinding[]): number {
    const deduction: Record<ComplianceSeverity, number> = {
      critical: 25, high: 10, medium: 4, low: 1, info: 0,
    };
    let totalDeduct = 0;
    for (const f of findings) {
      const w = COMPLIANCE_SCORE_WEIGHTS[f.category as ComplianceCategory] ?? 1;
      totalDeduct += deduction[f.severity] * w;
    }
    return Math.max(0, Math.round(100 - totalDeduct));
  }

  // --------------------------------------------------------------------------
  // 查询
  // --------------------------------------------------------------------------

  getFindings(severity?: ComplianceSeverity): ComplianceFinding[] {
    const all = this.findings.map((f) => ({ ...f }));
    if (severity) return all.filter((f) => f.severity === severity);
    return all;
  }

  getChecks(opts?: { type?: ComplianceCheckType; limit?: number }): ComplianceCheck[] {
    let all = this.checks.map((c) => ({ ...c }));
    if (opts?.type) all = all.filter((c) => c.type === opts.type);
    if (opts?.limit) all = all.slice(-opts.limit);
    return all;
  }

  getLastCheck(): ComplianceCheck | null {
    if (this.checks.length === 0) return null;
    return { ...this.checks[this.checks.length - 1] };
  }

  getAlerts(): RiskAlert[] {
    return this.alerts.map((a) => ({ ...a }));
  }

  getLastDailyCheckAt(): number | undefined {
    return this.lastDailyCheckAt;
  }

  // --------------------------------------------------------------------------
  // 订阅
  // --------------------------------------------------------------------------

  onFinding(handler: FindingHandler): () => void {
    this.findingHandlers.add(handler);
    return () => this.findingHandlers.delete(handler);
  }

  onAlert(handler: AlertHandler): () => void {
    this.alertHandlers.add(handler);
    return () => this.alertHandlers.delete(handler);
  }

  /**
   * 手动推送告警
   */
  raiseAlert(alert: Omit<RiskAlert, 'id' | 'createdAt'>): RiskAlert {
    const full: RiskAlert = {
      ...alert,
      id: `alert-${randomString(8)}`,
      createdAt: Date.now(),
    };
    this.alerts.push(full);
    for (const h of this.alertHandlers) h(full);
    this.persist();
    return { ...full };
  }

  resolveAlert(id: string, resolvedBy: string): RiskAlert | null {
    const a = this.alerts.find((x) => x.id === id);
    if (!a) return null;
    a.resolvedAt = Date.now();
    a.resolvedBy = resolvedBy;
    this.persist();
    return { ...a };
  }

  // --------------------------------------------------------------------------
  // 内部
  // --------------------------------------------------------------------------

  private emitFinding(f: ComplianceFinding): void {
    for (const h of this.findingHandlers) {
      try {
        h({ ...f });
      } catch (err) {
        // eslint-disable-next-line no-console
        console.warn('finding handler error:', err);
      }
    }
  }

  private buildFinding(args: {
    severity: ComplianceSeverity;
    category: ComplianceCategory | string;
    message: string;
    evidence?: Record<string, any>;
    recommendation?: string;
  }): ComplianceFinding {
    return {
      id: `find-${randomString(8)}`,
      severity: args.severity,
      category: args.category,
      message: args.message,
      evidence: args.evidence,
      recommendation: args.recommendation,
      createdAt: Date.now(),
    };
  }

  private getRecentTxs(windowMs: number): TransactionInput[] {
    if (!this.deps.getRecentTransactions) return [];
    const cutoff = Date.now() - windowMs;
    return this.deps.getRecentTransactions(windowMs).filter(
      (t) => t.occurredAt >= cutoff,
    );
  }

  // --------------------------------------------------------------------------
  // 持久化
  // --------------------------------------------------------------------------

  private persist(): void {
    if (!this.deps.writeFile) return;
    try {
      const data = JSON.stringify({
        findings: this.findings,
        checks: this.checks,
        alerts: this.alerts,
        lastDailyCheckAt: this.lastDailyCheckAt,
      });
      void this.deps.writeFile(this.persistPath, data);
    } catch {
      /* ignore */
    }
  }

  async load(): Promise<void> {
    if (!this.deps.readFile) return;
    try {
      const data = await this.deps.readFile(this.persistPath);
      if (!data) return;
      const parsed = JSON.parse(data) as {
        findings: ComplianceFinding[];
        checks: ComplianceCheck[];
        alerts: RiskAlert[];
        lastDailyCheckAt?: number;
      };
      this.findings.length = 0;
      this.checks.length = 0;
      this.alerts.length = 0;
      this.findings.push(...parsed.findings);
      this.checks.push(...parsed.checks);
      this.alerts.push(...parsed.alerts);
      this.lastDailyCheckAt = parsed.lastDailyCheckAt;
    } catch {
      /* ignore */
    }
  }

  // --------------------------------------------------------------------------
  // 测试辅助
  // --------------------------------------------------------------------------

  _reset(): void {
    this.findings.length = 0;
    this.checks.length = 0;
    this.alerts.length = 0;
    this.lastDailyCheckAt = undefined;
  }
}

// ============================================================================
// 默认单例
// ============================================================================

let _default: ComplianceEngine | null = null;
export const getDefaultComplianceEngine = (
  deps?: ComplianceEngineDeps,
): ComplianceEngine => {
  if (!_default) _default = new ComplianceEngine(deps);
  return _default;
};
