/**
 * 限额检查模块
 *
 * - 日充值限额
 * - 日提现限额
 * - 单笔提现限额
 * - 月提现限额
 *
 * 内部维护滚动窗口使用量（基于内存 Map）。
 * 生产环境可对接 Redis 原子计数器。
 *
 * @module lib/risk/limits
 */

import type { ID, ISODate, KycLevel } from '@/types/models';
import { getKycLimit } from '@/lib/kyc/limits';
import { RiskError } from '@/lib/auth/errors';

// ============================================================================
// 类型
// =====================================================================================

export type LimitType = 'deposit' | 'withdraw';

export interface LimitUsage {
  /** 当日累计（USDT） */
  daily: number;
  /** 当月累计（USDT） */
  monthly: number;
  /** 日限额（USDT） */
  dailyLimit: number;
  /** 月限额（USDT） */
  monthlyLimit: number;
  /** 单笔限额（USDT） */
  singleLimit: number;
  /** 距离日上限剩余（USDT） */
  dailyRemaining: number;
  /** 距离月上限剩余（USDT） */
  monthlyRemaining: number;
  /** 限额等级 */
  kycLevel: KycLevel;
  /** 统计窗口起点（ISO） */
  windowStart: ISODate;
}

interface UsageRecord {
  ts: number;        // ms timestamp
  amountUsdt: number;
  type: LimitType;
}

interface UserState {
  kycLevel: KycLevel;
  records: UsageRecord[];
}

// ============================================================================
// 存储
// ============================================================================

const state: Map<ID, UserState> = new Map();

const getOrCreate = (userId: ID, kycLevel: KycLevel): UserState => {
  let s = state.get(userId);
  if (!s) {
    s = { kycLevel, records: [] };
    state.set(userId, s);
  } else {
    s.kycLevel = kycLevel;
  }
  return s;
};

const trim = (records: UsageRecord[]): UsageRecord[] => {
  const cutoff = Date.now() - 31 * 24 * 3600 * 1000; // 31 天
  return records.filter((r) => r.ts >= cutoff);
};

// ============================================================================
// 检查
// ============================================================================

/**
 * 检查单笔限额
 */
export const checkSingleLimit = (
  userId: ID,
  kycLevel: KycLevel,
  type: LimitType,
  amountUsdt: number
): { passed: boolean; reason?: string; limit: number } => {
  if (amountUsdt <= 0) {
    return { passed: false, reason: '金额必须大于 0', limit: 0 };
  }
  const limit = Number(getKycLimit(kycLevel).singleWithdrawUsdt);
  if (type === 'withdraw' && amountUsdt > limit) {
    return {
      passed: false,
      reason: `单笔提现超过限额 ${limit} USDT，当前 KYC 等级 ${kycLevel}`,
      limit,
    };
  }
  if (type === 'deposit' && amountUsdt > Number(getKycLimit(kycLevel).dailyDepositUsdt)) {
    // 充值按日累计判断（这里仅检查单笔不超过日限）
    return {
      passed: false,
      reason: `单笔充值超过日累计限额`,
      limit: Number(getKycLimit(kycLevel).dailyDepositUsdt),
    };
  }
  return { passed: true, limit };
};

/**
 * 检查日累计限额
 */
export const checkDailyLimit = (
  userId: ID,
  kycLevel: KycLevel,
  type: LimitType,
  amountUsdt: number
): { passed: boolean; reason?: string; limit: number; used: number } => {
  if (amountUsdt <= 0) {
    return { passed: false, reason: '金额必须大于 0', limit: 0, used: 0 };
  }
  const s = getOrCreate(userId, kycLevel);
  s.records = trim(s.records);

  const dayStart = new Date();
  dayStart.setUTCHours(0, 0, 0, 0);
  const dayStartTs = dayStart.getTime();
  const used = s.records
    .filter((r) => r.type === type && r.ts >= dayStartTs)
    .reduce((sum, r) => sum + r.amountUsdt, 0);

  const limit = Number(
    type === 'deposit'
      ? getKycLimit(kycLevel).dailyDepositUsdt
      : getKycLimit(kycLevel).dailyWithdrawUsdt
  );

  if (used + amountUsdt > limit) {
    return {
      passed: false,
      reason: `日累计${type === 'deposit' ? '充值' : '提现'}超限（已用 ${used} / ${limit} USDT）`,
      limit,
      used,
    };
  }
  return { passed: true, limit, used: used + amountUsdt };
};

/**
 * 检查月累计限额
 */
export const checkMonthlyLimit = (
  userId: ID,
  kycLevel: KycLevel,
  type: LimitType,
  amountUsdt: number
): { passed: boolean; reason?: string; limit: number; used: number } => {
  if (type !== 'withdraw') {
    return { passed: true, limit: 0, used: 0 };
  }
  if (amountUsdt <= 0) {
    return { passed: false, reason: '金额必须大于 0', limit: 0, used: 0 };
  }
  const s = getOrCreate(userId, kycLevel);
  s.records = trim(s.records);

  const monthStart = new Date();
  monthStart.setUTCDate(1);
  monthStart.setUTCHours(0, 0, 0, 0);
  const monthStartTs = monthStart.getTime();
  const used = s.records
    .filter((r) => r.type === 'withdraw' && r.ts >= monthStartTs)
    .reduce((sum, r) => sum + r.amountUsdt, 0);

  const limit = Number(getKycLimit(kycLevel).monthlyWithdrawUsdt);
  if (used + amountUsdt > limit) {
    return {
      passed: false,
      reason: `月累计提现超限（已用 ${used} / ${limit} USDT）`,
      limit,
      used,
    };
  }
  return { passed: true, limit, used: used + amountUsdt };
};

/**
 * 综合检查（单笔 + 日 + 月）
 */
export const checkAllLimits = (
  userId: ID,
  kycLevel: KycLevel,
  type: LimitType,
  amountUsdt: number
): { passed: boolean; checks: Record<string, ReturnType<typeof checkSingleLimit>> } => {
  const checks: Record<string, ReturnType<typeof checkSingleLimit>> = {
    single: checkSingleLimit(userId, kycLevel, type, amountUsdt),
    daily: checkDailyLimit(userId, kycLevel, type, amountUsdt),
    monthly: checkMonthlyLimit(userId, kycLevel, type, amountUsdt),
  };
  const passed = Object.values(checks).every((c) => c.passed);
  return { passed, checks };
};

/**
 * 获取当前使用情况
 */
export const getLimitUsage = (
  userId: ID,
  kycLevel: KycLevel,
  type: LimitType = 'withdraw'
): LimitUsage => {
  const s = getOrCreate(userId, kycLevel);
  s.records = trim(s.records);

  const dayStart = new Date();
  dayStart.setUTCHours(0, 0, 0, 0);
  const dayStartTs = dayStart.getTime();
  const daily = s.records
    .filter((r) => r.type === type && r.ts >= dayStartTs)
    .reduce((sum, r) => sum + r.amountUsdt, 0);

  const monthStart = new Date();
  monthStart.setUTCDate(1);
  monthStart.setUTCHours(0, 0, 0, 0);
  const monthStartTs = monthStart.getTime();
  const monthly = s.records
    .filter((r) => r.type === type && r.ts >= monthStartTs)
    .reduce((sum, r) => sum + r.amountUsdt, 0);

  const limitCfg = getKycLimit(kycLevel);
  const dailyLimit = Number(
    type === 'deposit' ? limitCfg.dailyDepositUsdt : limitCfg.dailyWithdrawUsdt
  );
  const monthlyLimit = Number(limitCfg.monthlyWithdrawUsdt);
  const singleLimit = Number(limitCfg.singleWithdrawUsdt);

  return {
    daily,
    monthly,
    dailyLimit,
    monthlyLimit,
    singleLimit,
    dailyRemaining: Math.max(0, dailyLimit - daily),
    monthlyRemaining: Math.max(0, monthlyLimit - monthly),
    kycLevel,
    windowStart: dayStart.toISOString(),
  };
};

/**
 * 记录用量（成功交易后调用）
 */
export const recordUsage = (
  userId: ID,
  kycLevel: KycLevel,
  type: LimitType,
  amountUsdt: number
): void => {
  if (amountUsdt <= 0) {
    throw new RiskError('RISK_INVALID_AMOUNT', 'Amount must be > 0');
  }
  const s = getOrCreate(userId, kycLevel);
  s.records.push({ ts: Date.now(), amountUsdt, type });
  s.records = trim(s.records);
};

/** 重置某用户计数（测试用） */
export const _resetLimitUsage = (userId?: ID): void => {
  if (userId) {
    state.delete(userId);
  } else {
    state.clear();
  }
};
