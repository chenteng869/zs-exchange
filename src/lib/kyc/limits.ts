/**
 * KYC 等级限额配置
 *
 * 不同 KYC 等级对应不同的充提现与衍生品权限。
 * 限额单位为 USDT 等值（其他币种按实时汇率换算）。
 *
 * @module lib/kyc/limits
 */

import type { KycLevel, KycLimit } from '@/types/models';

// ============================================================================
// 等级限额表
// ============================================================================

/**
 * 等级限额映射
 * - Lv.0 未认证：禁止任何充提
 * - Lv.1 初级：邮箱 + 手机 + 身份证号（OCR 校验）
 * - Lv.2 高级：+ 人脸识别 + 地址证明
 * - Lv.3 企业：KYB 全套（3 人审批）
 */
export const KYC_LIMITS: Readonly<Record<KycLevel, KycLimit>> = Object.freeze({
  0: {
    level: 0,
    dailyDepositUsdt: '0',
    dailyWithdrawUsdt: '0',
    singleWithdrawUsdt: '0',
    monthlyWithdrawUsdt: '0',
    futuresEnabled: false,
    marginEnabled: false,
  },
  1: {
    level: 1,
    dailyDepositUsdt: '50000',     // 5 万 USDT/日
    dailyWithdrawUsdt: '10000',    // 1 万 USDT/日
    singleWithdrawUsdt: '5000',    // 5000 USDT/笔
    monthlyWithdrawUsdt: '100000', // 10 万 USDT/月
    futuresEnabled: false,
    marginEnabled: false,
  },
  2: {
    level: 2,
    dailyDepositUsdt: '500000',    // 50 万 USDT/日
    dailyWithdrawUsdt: '100000',   // 10 万 USDT/日
    singleWithdrawUsdt: '50000',   // 5 万 USDT/笔
    monthlyWithdrawUsdt: '1000000', // 100 万 USDT/月
    futuresEnabled: true,
    marginEnabled: true,
  },
  3: {
    level: 3,
    dailyDepositUsdt: '10000000',  // 1000 万 USDT/日
    dailyWithdrawUsdt: '5000000',  // 500 万 USDT/日
    singleWithdrawUsdt: '1000000', // 100 万 USDT/笔
    monthlyWithdrawUsdt: '50000000', // 5000 万 USDT/月
    futuresEnabled: true,
    marginEnabled: true,
  },
});

// ============================================================================
// 查询函数
// ============================================================================

/**
 * 获取指定等级的限额配置
 */
export const getKycLimit = (level: KycLevel): KycLimit => {
  return KYC_LIMITS[level] ?? KYC_LIMITS[0];
};

/**
 * 提升等级可用的功能（如某用户从 L1 → L2 解锁合约）
 */
export interface LevelUpgradeBenefit {
  level: KycLevel;
  newFeatures: string[];
  limitIncrease: {
    dailyDepositUsdt: string;
    dailyWithdrawUsdt: string;
    singleWithdrawUsdt: string;
    monthlyWithdrawUsdt: string;
  };
}

/**
 * 计算等级提升带来的变化
 */
export const diffKycLimit = (from: KycLevel, to: KycLevel): LevelUpgradeBenefit | null => {
  if (from >= to) return null;
  const before = getKycLimit(from);
  const after = getKycLimit(to);

  const newFeatures: string[] = [];
  if (!before.futuresEnabled && after.futuresEnabled) newFeatures.push('合约交易');
  if (!before.marginEnabled && after.marginEnabled) newFeatures.push('杠杆交易');

  return {
    level: to,
    newFeatures,
    limitIncrease: {
      dailyDepositUsdt: subtractUsdt(after.dailyDepositUsdt, before.dailyDepositUsdt),
      dailyWithdrawUsdt: subtractUsdt(after.dailyWithdrawUsdt, before.dailyWithdrawUsdt),
      singleWithdrawUsdt: subtractUsdt(after.singleWithdrawUsdt, before.singleWithdrawUsdt),
      monthlyWithdrawUsdt: subtractUsdt(after.monthlyWithdrawUsdt, before.monthlyWithdrawUsdt),
    },
  };
};

/** 简单减法（仅用于展示），异常返回 0 */
const subtractUsdt = (a: string, b: string): string => {
  try {
    const result = Number(a) - Number(b);
    if (!isFinite(result) || result < 0) return '0';
    return result.toString();
  } catch {
    return '0';
  }
};
