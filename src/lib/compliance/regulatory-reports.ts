/**
 * 监管报表服务
 *
 * 5 种监管报表：
 *  - CTR (Currency Transaction Report) 美国 > 10,000 USD
 *  - SAR (Suspicious Activity Report)
 *  - MIREL (MiCA Revenue Report) 欧盟
 *  - CARF (Crypto-Asset Reporting Framework) OECD
 *  - DAU (Daily Active User) 自有运营报表
 *
 * @module lib/compliance/regulatory-reports
 */

import { randomString } from '@/lib/auth/crypto';
import {
  CTR_THRESHOLD_USD,
} from './compliance-engine';
import type {
  GenerateCARFOptions,
  GenerateCTROptions,
  GenerateDAUOptions,
  GenerateMIRELOptions,
  GenerateSAROptions,
  ListReportsOptions,
  RegulatoryReport,
  RegulatoryReportStatus,
  RegulatoryReportType,
} from './types';

// ============================================================================
// 常量
// ============================================================================

const DEFAULT_PERSIST_PATH = '.compliance-reports.json';
const DAY_MS = 24 * 60 * 60 * 1000;

// ============================================================================
// 数据源注入
// ============================================================================

export interface RegulatoryReportDeps {
  /** 报告周期内所有交易 */
  getTransactionsInRange?: (start: number, end: number) => TransactionForReport[];
  /** 所有用户列表（用于 DAU 计算） */
  getUsers?: () => UserForReport[];
  /** 用户活跃事件 */
  getUserActivity?: (start: number, end: number) => UserActivityEvent[];
  /** 持久化 */
  writeFile?: (path: string, data: string) => Promise<void> | void;
  readFile?: (path: string) => Promise<string | null> | string | null;
  persistPath?: string;
}

export interface TransactionForReport {
  id: string;
  userId: string;
  type: 'deposit' | 'withdraw' | 'transfer' | 'trade';
  amountUsd: number;
  occurredAt: number;
  counterpartyName?: string;
  counterpartyAddress?: string;
  suspicious?: boolean;
  suspiciousReason?: string;
  jurisdiction?: string;
}

export interface UserForReport {
  id: string;
  country?: string;
  kycLevel?: 'basic' | 'advanced' | 'none';
  registeredAt: number;
}

export interface UserActivityEvent {
  userId: string;
  activityType: 'login' | 'trade' | 'withdraw' | 'deposit';
  occurredAt: number;
}

// ============================================================================
// RegulatoryReportService
// ============================================================================

export class RegulatoryReportService {
  private readonly reports: Map<string, RegulatoryReport> = new Map();
  private readonly deps: RegulatoryReportDeps;
  private readonly persistPath: string;

  constructor(deps: RegulatoryReportDeps = {}) {
    this.deps = deps;
    this.persistPath = deps.persistPath ?? DEFAULT_PERSIST_PATH;
  }

  // --------------------------------------------------------------------------
  // CTR
  // --------------------------------------------------------------------------

  /**
   * 生成货币交易报告（Currency Transaction Report）
   * 美国：单笔 > 10,000 USD 必须报告
   */
  async generateCTR(opts: GenerateCTROptions = {}): Promise<RegulatoryReport> {
    const now = Date.now();
    const period = opts.period ?? { start: now - DAY_MS, end: now };
    const threshold = opts.thresholdUsd ?? CTR_THRESHOLD_USD;

    const txs = this.deps.getTransactionsInRange?.(period.start, period.end) ?? [];
    const reportable = txs.filter(
      (t) => t.amountUsd > threshold && (t.type === 'deposit' || t.type === 'withdraw' || t.type === 'transfer'),
    );

    const data = {
      thresholdUsd: threshold,
      totalReportable: reportable.length,
      totalAmountUsd: reportable.reduce((s, t) => s + t.amountUsd, 0),
      transactions: reportable.map((t) => ({
        txId: t.id,
        userId: t.userId,
        type: t.type,
        amountUsd: t.amountUsd,
        occurredAt: t.occurredAt,
        counterparty: t.counterpartyName ?? null,
        jurisdiction: t.jurisdiction ?? 'Unknown',
      })),
      regulator: 'FinCEN',
      reportingJurisdiction: 'US',
    };

    const report: RegulatoryReport = {
      id: `rpt-ctr-${randomString(8)}`,
      type: 'CTR',
      jurisdiction: 'US',
      period,
      status: 'draft',
      generatedAt: now,
      data,
    };
    this.reports.set(report.id, report);
    this.persist();
    return { ...report };
  }

  // --------------------------------------------------------------------------
  // SAR
  // --------------------------------------------------------------------------

  /**
   * 生成可疑活动报告
   */
  async generateSAR(opts: GenerateSAROptions): Promise<RegulatoryReport> {
    if (!opts.userId) throw new Error('SAR requires userId');
    if (!opts.reason) throw new Error('SAR requires reason');

    const now = Date.now();
    const period = { start: now - 90 * DAY_MS, end: now };

    const txs = this.deps.getTransactionsInRange?.(period.start, period.end) ?? [];
    const userTxs = txs.filter((t) => t.userId === opts.userId);

    const data = {
      userId: opts.userId,
      reason: opts.reason,
      description: opts.description ?? '',
      relatedIds: opts.relatedIds ?? [],
      transactionCount: userTxs.length,
      totalAmountUsd: userTxs.reduce((s, t) => s + t.amountUsd, 0),
      suspiciousTransactions: userTxs
        .filter((t) => t.suspicious)
        .map((t) => ({
          txId: t.id,
          type: t.type,
          amountUsd: t.amountUsd,
          occurredAt: t.occurredAt,
          reason: t.suspiciousReason ?? 'flagged',
        })),
      regulator: 'FinCEN',
      reportingJurisdiction: 'US',
    };

    const report: RegulatoryReport = {
      id: `rpt-sar-${randomString(8)}`,
      type: 'SAR',
      jurisdiction: 'US',
      period,
      status: 'draft',
      generatedAt: now,
      data,
    };
    this.reports.set(report.id, report);
    this.persist();
    return { ...report };
  }

  // --------------------------------------------------------------------------
  // MIREL (MiCA 收入报告)
  // --------------------------------------------------------------------------

  /**
   * 生成 MiCA 收入报告（欧盟）
   */
  async generateMIREL(opts: GenerateMIRELOptions = {}): Promise<RegulatoryReport> {
    const now = Date.now();
    const period = opts.period ?? {
      start: new Date(now).getTime() - 30 * DAY_MS,
      end: now,
    };
    const jurisdiction = opts.jurisdiction ?? 'EU';

    const txs = this.deps.getTransactionsInRange?.(period.start, period.end) ?? [];
    const euTxs = txs.filter((t) => t.jurisdiction === 'EU' || !t.jurisdiction);
    const tradingRevenue = euTxs
      .filter((t) => t.type === 'trade')
      .reduce((s, t) => s + t.amountUsd * 0.001, 0); // 10 bps 平均费率
    const withdrawalFees = euTxs
      .filter((t) => t.type === 'withdraw')
      .reduce((s, t) => s + t.amountUsd * 0.001, 0);
    const depositRevenue = euTxs
      .filter((t) => t.type === 'deposit')
      .reduce((s, t) => s + t.amountUsd * 0.005, 0);

    const data = {
      jurisdiction,
      reportingFramework: 'MiCA',
      totalRevenueUsd: tradingRevenue + withdrawalFees + depositRevenue,
      breakdown: {
        tradingRevenue,
        withdrawalFees,
        depositRevenue,
      },
      transactionCount: euTxs.length,
      periodDays: Math.ceil((period.end - period.start) / DAY_MS),
      regulator: 'ESMA',
    };

    const report: RegulatoryReport = {
      id: `rpt-mirel-${randomString(8)}`,
      type: 'MIREL',
      jurisdiction,
      period,
      status: 'draft',
      generatedAt: now,
      data,
    };
    this.reports.set(report.id, report);
    this.persist();
    return { ...report };
  }

  // --------------------------------------------------------------------------
  // CARF (Crypto-Asset Reporting Framework)
  // --------------------------------------------------------------------------

  /**
   * 生成 CARF（OECD 加密资产报告框架）
   * 主要为税务机关间的自动信息交换
   */
  async generateCARF(opts: GenerateCARFOptions = {}): Promise<RegulatoryReport> {
    const now = Date.now();
    const period = opts.period ?? {
      start: new Date(now).getTime() - 365 * DAY_MS,
      end: now,
    };
    const jurisdiction = opts.jurisdiction ?? 'Global';

    const txs = this.deps.getTransactionsInRange?.(period.start, period.end) ?? [];
    const users = this.deps.getUsers?.() ?? [];
    const userMap = new Map(users.map((u) => [u.id, u]));

    // 按用户聚合交易
    const byUser = new Map<string, { count: number; totalUsd: number; country?: string }>();
    for (const t of txs) {
      const e = byUser.get(t.userId) ?? { count: 0, totalUsd: 0, country: userMap.get(t.userId)?.country };
      e.count += 1;
      e.totalUsd += t.amountUsd;
      byUser.set(t.userId, e);
    }

    const userReports = Array.from(byUser.entries()).map(([userId, v]) => {
      const u = userMap.get(userId);
      return {
        userId,
        country: u?.country ?? v.country ?? 'Unknown',
        kycLevel: u?.kycLevel ?? 'none',
        transactionCount: v.count,
        totalAmountUsd: v.totalUsd,
        reportable: v.totalUsd >= 50_000, // CARF 阈值（拟）
      };
    });

    const data = {
      framework: 'CARF',
      jurisdiction,
      reportingYear: new Date(period.end).getUTCFullYear(),
      reportableUsers: userReports.filter((r) => r.reportable),
      totalUsers: userReports.length,
      perUser: userReports,
      regulator: 'OECD / Local Tax Authority',
    };

    const report: RegulatoryReport = {
      id: `rpt-carf-${randomString(8)}`,
      type: 'CARF',
      jurisdiction,
      period,
      status: 'draft',
      generatedAt: now,
      data,
    };
    this.reports.set(report.id, report);
    this.persist();
    return { ...report };
  }

  // --------------------------------------------------------------------------
  // DAU
  // --------------------------------------------------------------------------

  /**
   * 生成日活用户报告
   */
  async generateDAU(opts: GenerateDAUOptions = {}): Promise<RegulatoryReport> {
    const now = Date.now();
    const targetDate = opts.date ?? now;
    const start = targetDate - DAY_MS;
    const end = targetDate;

    const events = this.deps.getUserActivity?.(start, end) ?? [];
    const users = this.deps.getUsers?.() ?? [];
    const dau = new Set(events.map((e) => e.userId));
    const newRegistrations = users.filter(
      (u) => u.registeredAt >= start && u.registeredAt < end,
    ).length;

    const trades = events.filter((e) => e.activityType === 'trade').length;
    const withdrawals = events.filter((e) => e.activityType === 'withdraw').length;
    const deposits = events.filter((e) => e.activityType === 'deposit').length;
    const logins = events.filter((e) => e.activityType === 'login').length;

    const data = {
      date: targetDate,
      dau: dau.size,
      totalUsers: users.length,
      newRegistrations,
      activityBreakdown: { trades, withdrawals, deposits, logins },
      dauRatio: users.length === 0 ? 0 : dau.size / users.length,
    };

    const report: RegulatoryReport = {
      id: `rpt-dau-${randomString(8)}`,
      type: 'DAU',
      jurisdiction: 'Global',
      period: { start, end },
      status: 'draft',
      generatedAt: now,
      data,
    };
    this.reports.set(report.id, report);
    this.persist();
    return { ...report };
  }

  // --------------------------------------------------------------------------
  // 提交
  // --------------------------------------------------------------------------

  /**
   * 提交报表（mock：状态变为 submitted，并加签名）
   */
  async submitReport(id: string, signature?: string): Promise<RegulatoryReport> {
    const rpt = this.reports.get(id);
    if (!rpt) throw new Error(`Report not found: ${id}`);
    if (rpt.status !== 'draft') {
      throw new Error(`Report is not in draft: ${rpt.status}`);
    }
    rpt.status = 'submitted';
    rpt.submittedAt = Date.now();
    rpt.signature = signature ?? this.mockSign(rpt);
    this.persist();
    return { ...rpt };
  }

  /**
   * 标记报表为已收讫 / 拒绝
   */
  updateStatus(id: string, status: RegulatoryReportStatus, notes?: string): RegulatoryReport {
    const rpt = this.reports.get(id);
    if (!rpt) throw new Error(`Report not found: ${id}`);
    rpt.status = status;
    if (notes) rpt.notes = (rpt.notes ? rpt.notes + '\n' : '') +
      `[${new Date().toISOString()}] ${status}: ${notes}`;
    this.persist();
    return { ...rpt };
  }

  // --------------------------------------------------------------------------
  // 查询
  // --------------------------------------------------------------------------

  getReport(id: string): RegulatoryReport | null {
    const r = this.reports.get(id);
    return r ? { ...r } : null;
  }

  listReports(opts: ListReportsOptions = {}): RegulatoryReport[] {
    let all = Array.from(this.reports.values()).map((r) => ({ ...r }));
    if (opts.type) all = all.filter((r) => r.type === opts.type);
    if (opts.jurisdiction) all = all.filter((r) => r.jurisdiction === opts.jurisdiction);
    if (opts.status) all = all.filter((r) => r.status === opts.status);
    if (opts.limit) all = all.slice(-opts.limit);
    return all.sort((a, b) => b.generatedAt - a.generatedAt);
  }

  /**
   * 统计
   */
  stats(): Record<RegulatoryReportType, { total: number; submitted: number; draft: number }> {
    const out: Record<RegulatoryReportType, { total: number; submitted: number; draft: number }> = {
      CTR: { total: 0, submitted: 0, draft: 0 },
      SAR: { total: 0, submitted: 0, draft: 0 },
      MIREL: { total: 0, submitted: 0, draft: 0 },
      CARF: { total: 0, submitted: 0, draft: 0 },
      DAU: { total: 0, submitted: 0, draft: 0 },
    };
    for (const r of this.reports.values()) {
      out[r.type].total += 1;
      if (r.status === 'submitted' || r.status === 'acknowledged') out[r.type].submitted += 1;
      if (r.status === 'draft') out[r.type].draft += 1;
    }
    return out;
  }

  // --------------------------------------------------------------------------
  // 内部
  // --------------------------------------------------------------------------

  private mockSign(report: RegulatoryReport): string {
    // 简单 mock 签名：id + timestamp 的 hash
    const data = `${report.id}|${report.type}|${report.submittedAt ?? report.generatedAt}`;
    let h = 0;
    for (let i = 0; i < data.length; i++) {
      h = (h * 31 + data.charCodeAt(i)) | 0;
    }
    return `0x${(h >>> 0).toString(16).padStart(8, '0')}${randomString(16)}`;
  }

  private persist(): void {
    if (!this.deps.writeFile) return;
    try {
      const data = JSON.stringify(Array.from(this.reports.values()), null, 2);
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
      const parsed = JSON.parse(data) as RegulatoryReport[];
      this.reports.clear();
      for (const r of parsed) this.reports.set(r.id, r);
    } catch {
      /* ignore */
    }
  }

  // --------------------------------------------------------------------------
  // 测试辅助
  // --------------------------------------------------------------------------

  _reset(): void {
    this.reports.clear();
  }
}

// ============================================================================
// 默认单例
// ============================================================================

let _default: RegulatoryReportService | null = null;
export const getDefaultRegulatoryReportService = (
  deps?: RegulatoryReportDeps,
): RegulatoryReportService => {
  if (!_default) _default = new RegulatoryReportService(deps);
  return _default;
};
