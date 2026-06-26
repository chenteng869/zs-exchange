/**
 * AML（反洗钱）检测模块
 *
 * 检测规则：
 *  - 大额交易（单笔 ≥ 10000 USDT）
 *  - 拆分交易（24h 内多笔小于阈值但累计 ≥ 阈值）
 *  - 高风险国家（FATF 黑/灰名单）
 *  - 异常 IP 地理位置（与用户常用 IP 国家不符）
 *  - 异常时间（北京时间 02:00-06:00 大额操作）
 *
 * @module lib/risk/aml
 */

import type { ID, ISODate, RiskEventType, RiskLevel } from '@/types/models';
import { RiskError } from '@/lib/auth/errors';
import { randomString } from '@/lib/auth/crypto';

// ============================================================================
// 配置
// ============================================================================

/** 大额交易阈值（USDT） */
export const LARGE_TX_THRESHOLD = 10_000;
/** 拆分检测窗口（小时） */
export const STRUCTURING_WINDOW_HOURS = 24;
/** 拆分检测：单笔上限 */
export const STRUCTURING_PER_TX_LIMIT = 9_500;
/** 拆分检测：窗口累计阈值 */
export const STRUCTURING_TOTAL_THRESHOLD = 10_000;
/** 同一窗口内拆分笔数触发线 */
export const STRUCTURING_TX_COUNT_LIMIT = 3;

/** FATF 高风险国家（黑名单 + 灰名单） */
export const HIGH_RISK_COUNTRIES: ReadonlySet<string> = new Set([
  // 黑名单
  'KP', 'IR', 'MM', // 朝鲜、伊朗、缅甸
  // 灰名单
  'AF', 'AL', 'BB', 'BF', 'KH', 'KY', 'HT', 'JM', 'JO', 'ML', 'MA', 'MZ',
  'NI', 'PK', 'PA', 'PH', 'SN', 'SS', 'SY', 'TZ', 'TR', 'UG', 'AE', 'YE',
  'ZW',
]);

/** 异常时段（北京时间 02:00-06:00） */
const SUSPICIOUS_HOUR_START_BJ = 2;
const SUSPICIOUS_HOUR_END_BJ = 6;

// ============================================================================
// 类型
// =====================================================================================

export interface AmlAlert {
  id: ID;
  userId: ID;
  type: RiskEventType;
  level: RiskLevel;
  reason: string;
  evidence: Record<string, unknown>;
  createdAt: ISODate;
}

export interface TransactionRecord {
  id: ID;
  userId: ID;
  /** USDT 等值金额 */
  amountUsdt: number;
  /** 交易发生时间 */
  occurredAt: ISODate;
  /** 交易类型 */
  type: 'deposit' | 'withdraw' | 'transfer' | 'trade';
  /** 收款国家（如提现） */
  country?: string;
  /** IP 国家 */
  ipCountry?: string;
  /** 用户常用 IP 国家 */
  userHomeCountry?: string;
  /** 交易地址 */
  address?: string;
}

// ============================================================================
// 内部存储（用户交易历史）
// ============================================================================

const txHistory: Map<ID, TransactionRecord[]> = new Map();

// ============================================================================
// 检测函数
// =====================================================================================

/**
 * 检测大额交易
 */
export const detectLargeTransaction = (tx: TransactionRecord): AmlAlert | null => {
  if (tx.amountUsdt >= LARGE_TX_THRESHOLD) {
    return buildAlert(tx, 'large_withdraw', 'high', '单笔交易金额超过大额阈值', {
      amountUsdt: tx.amountUsdt,
      threshold: LARGE_TX_THRESHOLD,
    });
  }
  return null;
};

/**
 * 检测拆分交易（structuring / smurfing）
 * 24h 内多笔单笔低于 9500 但累计 ≥ 10000
 */
export const detectStructuring = (tx: TransactionRecord): AmlAlert | null => {
  const history = txHistory.get(tx.userId) ?? [];
  const txTime = Date.parse(tx.occurredAt);
  const windowStart = txTime - STRUCTURING_WINDOW_HOURS * 3600 * 1000;

  const inWindow = history.filter((t) => {
    const tTime = Date.parse(t.occurredAt);
    return tTime >= windowStart && tTime <= txTime && t.type === tx.type;
  });

  if (inWindow.length === 0) return null;

  const total = inWindow.reduce((sum, t) => sum + t.amountUsdt, 0) + tx.amountUsdt;
  const allUnderLimit = [...inWindow, tx].every(
    (t) => t.amountUsdt < STRUCTURING_PER_TX_LIMIT
  );

  if (
    allUnderLimit &&
    inWindow.length + 1 >= STRUCTURING_TX_COUNT_LIMIT &&
    total >= STRUCTURING_TOTAL_THRESHOLD
  ) {
    return buildAlert(tx, 'aml_alert', 'high', '检测到拆分交易行为', {
      windowHours: STRUCTURING_WINDOW_HOURS,
      txCount: inWindow.length + 1,
      totalUsdt: total,
      threshold: STRUCTURING_TOTAL_THRESHOLD,
    });
  }
  return null;
};

/**
 * 检测高风险国家
 */
export const detectHighRiskCountry = (tx: TransactionRecord): AmlAlert | null => {
  if (tx.country && HIGH_RISK_COUNTRIES.has(tx.country.toUpperCase())) {
    return buildAlert(tx, 'aml_alert', 'critical', '对手方位于 FATF 高风险国家', {
      country: tx.country,
    });
  }
  return null;
};

/**
 * 检测异常 IP 地理位置
 */
export const detectAnomalousIp = (tx: TransactionRecord): AmlAlert | null => {
  if (!tx.ipCountry) return null;
  if (!tx.userHomeCountry) return null;
  if (tx.ipCountry === tx.userHomeCountry) return null;
  // IP 国家与用户常用国家不符 + 涉及大额或敏感操作
  if (tx.amountUsdt >= LARGE_TX_THRESHOLD) {
    return buildAlert(tx, 'login_anomaly', 'medium', 'IP 地理位置与常用地不符且发生大额操作', {
      ipCountry: tx.ipCountry,
      homeCountry: tx.userHomeCountry,
      amountUsdt: tx.amountUsdt,
    });
  }
  return null;
};

/**
 * 检测异常时间（北京时间凌晨 02:00-06:00 大额操作）
 */
export const detectAnomalousTime = (tx: TransactionRecord): AmlAlert | null => {
  if (tx.amountUsdt < LARGE_TX_THRESHOLD) return null;
  const date = new Date(tx.occurredAt);
  // 转换为北京时间（UTC+8）
  const bjHour = (date.getUTCHours() + 8) % 24;
  if (bjHour >= SUSPICIOUS_HOUR_START_BJ && bjHour < SUSPICIOUS_HOUR_END_BJ) {
    return buildAlert(tx, 'aml_alert', 'medium', '凌晨时段发生大额操作', {
      bjHour,
      window: [SUSPICIOUS_HOUR_START_BJ, SUSPICIOUS_HOUR_END_BJ],
      amountUsdt: tx.amountUsdt,
    });
  }
  return null;
};

/**
 * 综合检测
 * 返回所有命中的告警
 */
export const runAmlChecks = (tx: TransactionRecord): AmlAlert[] => {
  const alerts: AmlAlert[] = [];
  const checks = [
    detectLargeTransaction,
    detectStructuring,
    detectHighRiskCountry,
    detectAnomalousIp,
    detectAnomalousTime,
  ];
  for (const check of checks) {
    try {
      const result = check(tx);
      if (result) alerts.push(result);
    } catch (e) {
      if (!(e instanceof RiskError)) {
        throw e;
      }
      // 单个检测器失败不影响其他
    }
  }
  // 同步写入历史
  const history = txHistory.get(tx.userId) ?? [];
  history.push(tx);
  // 仅保留最近 7 天
  const cutoff = Date.now() - 7 * 24 * 3600 * 1000;
  const trimmed = history.filter((t) => Date.parse(t.occurredAt) >= cutoff);
  txHistory.set(tx.userId, trimmed);
  return alerts;
};

// ============================================================================
// 工具
// =====================================================================================

const buildAlert = (
  tx: TransactionRecord,
  type: RiskEventType,
  level: RiskLevel,
  reason: string,
  evidence: Record<string, unknown>
): AmlAlert => ({
  id: `aml_${Date.now()}_${randomString(6)}`,
  userId: tx.userId,
  type,
  level,
  reason,
  evidence,
  createdAt: new Date().toISOString(),
});

/** 清空历史（测试用） */
export const _resetAmlHistory = (): void => {
  txHistory.clear();
};

/** 获取某用户历史交易 */
export const getAmlHistory = (userId: ID): TransactionRecord[] => {
  return [...(txHistory.get(userId) ?? [])];
};
