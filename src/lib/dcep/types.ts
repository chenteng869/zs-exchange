/**
 * 数字人民币（DCEP / e-CNY）模块 - 统一类型定义 + 常量
 *
 * 覆盖：
 *  - 钱包状态 / 限额
 *  - 交易状态 / 方向
 *  - 4 级 KYC（匿名 / 弱实名 / 实名 / 强实名）
 *  - 央行侧 / 银行侧
 *  - 报价 / 报表
 *  - 错误
 *
 * 不引入任何第三方类型（保持纯 TS）。
 *
 * @module lib/dcep/types
 */

// =============================================================================
// 钱包 / 交易 / 方向 / 状态
// =============================================================================

export type DcepStatus = 'pending' | 'active' | 'frozen' | 'closed';

export type DcepTxStatus =
  | 'submitted'
  | 'confirmed'
  | 'completed'
  | 'failed'
  | 'rejected'
  | 'refunded';

export type DcepDirection = 'deposit' | 'withdraw';

export type KycLevel = 0 | 1 | 2 | 3;

export type IdType = '身份证' | '护照' | '港澳通行证' | '台湾通行证';

// =============================================================================
// 钱包
// =============================================================================

export interface DcepWallet {
  id: string;
  userId: string;
  /** DCEP 钱包 ID（央行侧） */
  walletId: string;
  /** DCEP 公钥（用于验证签名） */
  publicKey: string;
  status: DcepStatus;
  kycLevel: KycLevel;
  /** 日限额（字符串数字） */
  dailyLimit: string;
  /** 年限额 */
  yearlyLimit: string;
  /** 当日已用 */
  dailyUsed: string;
  /** 当年已用 */
  yearlyUsed: string;
  createdAt: number;
  activatedAt?: number;
}

// =============================================================================
// 交易
// =============================================================================

export interface DcepTransaction {
  id: string;
  userId: string;
  walletId: string;
  direction: DcepDirection;
  /** 数字人民币金额 */
  amount: string;
  /** 兑换的 USDT 数量 */
  cryptoAmount?: string;
  /** 兑换汇率（DCEP→USDT） */
  exchangeRate?: string;
  fee: string;
  status: DcepTxStatus;
  // 央行侧
  centralTxId?: string;
  centralTimestamp?: number;
  // 银行侧
  bankName?: string;
  bankAccount?: string;
  // 合规
  kycChecked: boolean;
  amlChecked: boolean;
  sanctionedChecked: boolean;
  rejectionReason?: string;
  createdAt: number;
  completedAt?: number;
}

// =============================================================================
// 报价
// =============================================================================

export interface DcepQuote {
  id: string;
  /** DCEP 金额 */
  dcepAmount: string;
  /** 兑换的 USDT 数量 */
  cryptoAmount: string;
  /** 汇率 */
  exchangeRate: string;
  fee: string;
  /** 过期时间（60s） */
  expiresAt: number;
  createdAt: number;
}

// =============================================================================
// KYC
// =============================================================================

export interface DcepKycInfo {
  userId: string;
  realName: string;
  idType: IdType;
  /** 加密存储 */
  idNumber: string;
  /** 加密存储 */
  phoneNumber: string;
  level: KycLevel;
  verifiedAt: number;
  /** 2 年有效 */
  expiresAt: number;
}

// =============================================================================
// 限额（按 KYC 等级）
// =============================================================================

export interface DcepLimitTier {
  single: string;
  daily: string;
  yearly: string;
}

export interface DcepLimits {
  userId: string;
  kycLevel: KycLevel;
  anonymous: DcepLimitTier;
  lightKyc: DcepLimitTier;
  fullKyc: DcepLimitTier;
  enhancedKyc: DcepLimitTier;
}

// =============================================================================
// 央行侧网关
// =============================================================================

export interface CentralSubmitOptions {
  walletId: string;
  amount: string;
  direction: DcepDirection;
  reference: string;
  bankName?: string;
  bankAccount?: string;
}

export interface CentralSubmitResult {
  centralTxId: string;
  status: DcepTxStatus;
  timestamp: number;
}

export interface CentralQueryResult {
  status: DcepTxStatus;
  amount: string;
  timestamp: number;
}

// =============================================================================
// 报表
// =============================================================================

export interface DcepReport {
  period: 'daily' | 'monthly';
  startTime: number;
  endTime: number;
  totalDeposit: string;
  totalWithdraw: string;
  totalFee: string;
  transactionCount: number;
  byStatus: Record<string, number>;
  /** 合规检查结果（保留 7 年） */
  retainedUntil: number;
}

// =============================================================================
// 合规
// =============================================================================

export interface ComplianceResult {
  passed: boolean;
  violations: string[];
  warnings: string[];
  checkedAt: number;
}

// =============================================================================
// 错误
// =============================================================================

export class DcepError extends Error {
  public readonly code: string;
  public readonly meta?: Record<string, unknown>;
  constructor(code: string, message: string, meta?: Record<string, unknown>) {
    super(message);
    this.name = 'DcepError';
    this.code = code;
    this.meta = meta;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class DcepKycError extends DcepError {
  constructor(code: string, message: string, meta?: Record<string, unknown>) {
    super(code, message, meta);
    this.name = 'DcepKycError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class DcepLimitError extends DcepError {
  constructor(code: string, message: string, meta?: Record<string, unknown>) {
    super(code, message, meta);
    this.name = 'DcepLimitError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class DcepAmlError extends DcepError {
  constructor(code: string, message: string, meta?: Record<string, unknown>) {
    super(code, message, meta);
    this.name = 'DcepAmlError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

// =============================================================================
// 关键常量
// =============================================================================

/** 1 DCEP = 1 CNY */
export const DCEP_EXCHANGE_RATE_DEFAULT = '1';

/** 最小交易金额 */
export const DCEP_MIN_AMOUNT = '0.01';

/** 弱实名 1000 元/笔 */
export const DCEP_MAX_AMOUNT_LIGHT = '1000';

/** 报价 TTL：60s */
export const DCEP_QUOTE_TTL_MS = 60_000;

/** KYC 有效期：2 年 */
export const DCEP_KYC_VALIDITY_DAYS = 730;

/** 交易报告保留：7 年（央行要求） */
export const DCEP_REPORT_RETENTION_DAYS = 2555;

/** KYC 等级限额 */
export const DCEP_KYC_LIMITS: Record<KycLevel, DcepLimitTier> = {
  0: { single: '0', daily: '0', yearly: '0' },
  1: { single: '1000', daily: '5000', yearly: '50000' },
  2: { single: '50000', daily: '200000', yearly: '1000000' },
  3: { single: 'unlimited', daily: 'unlimited', yearly: 'unlimited' },
};

/** 央行网关（mock 端点） */
export const DCEP_CENTRAL_API = 'https://api.dcep.example.com/v1';

/** 央行 API Key（演示用） */
export const DCEP_CENTRAL_API_KEY = 'mock-central-bank-api-key';

/** 关联银行列表（演示） */
export const DCEP_SUPPORTED_BANKS = [
  '工商银行',
  '建设银行',
  '中国银行',
  '农业银行',
  '交通银行',
  '招商银行',
  '邮储银行',
] as const;

export type SupportedDcepBank = (typeof DCEP_SUPPORTED_BANKS)[number];

// =============================================================================
// 工具函数
// =============================================================================

/** djb2 hash（稳定 mock） */
export function djb2(input: string): number {
  let hash = 5381;
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 33) ^ input.charCodeAt(i);
  }
  return hash >>> 0;
}

/** 生成短 ID（mock 用） */
export function shortId(prefix: string, input: string): string {
  return `${prefix}-${djb2(input).toString(16).padStart(8, '0')}`;
}

/** 比较 string 数字（仅正数） */
export function compareAmount(a: string, b: string): number {
  const na = Number(a);
  const nb = Number(b);
  if (Number.isNaN(na) || Number.isNaN(nb)) return 0;
  if (na > nb) return 1;
  if (na < nb) return -1;
  return 0;
}

/** string 加法（仅 DCEP 元，2 位小数） */
export function addAmount(a: string, b: string): string {
  // 转最小单位（分）运算
  const toMinor = (v: string): bigint => {
    const [int = '0', frac = ''] = v.split('.');
    return BigInt(int) * 100n + BigInt((frac + '00').slice(0, 2));
  };
  const fromMinor = (m: bigint): string => {
    const sign = m < 0n ? '-' : '';
    const abs = m < 0n ? -m : m;
    const int = abs / 100n;
    const frac = abs % 100n;
    return `${sign}${int.toString()}.${frac.toString().padStart(2, '0')}`;
  };
  return fromMinor(toMinor(a) + toMinor(b));
}

/** string 减法（仅 DCEP 元，2 位小数） */
export function subAmount(a: string, b: string): string {
  const toMinor = (v: string): bigint => {
    const [int = '0', frac = ''] = v.split('.');
    return BigInt(int) * 100n + BigInt((frac + '00').slice(0, 2));
  };
  const fromMinor = (m: bigint): string => {
    const sign = m < 0n ? '-' : '';
    const abs = m < 0n ? -m : m;
    const int = abs / 100n;
    const frac = abs % 100n;
    return `${sign}${int.toString()}.${frac.toString().padStart(2, '0')}`;
  };
  return fromMinor(toMinor(a) - toMinor(b));
}
