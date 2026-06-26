/**
 * 法币通道模块 - 统一类型定义 + 常量
 *
 * 覆盖：
 *  - 6 大支付通道（SWIFT / SEPA / ACH / FPS / PIX / UPI）+ CARD/PAYPAL
 *  - 25+ 法币
 *  - 银行账户管理
 *  - 报价 / 交易 / 限额
 *  - AML / KYC 检测
 *
 * 不引入任何第三方类型（保持纯 TS）。
 *
 * @module lib/fiat/types
 */

// =============================================================================
// 通道 / 方向 / 状态
// =============================================================================

export type FiatChannel =
  | 'SWIFT'
  | 'SEPA'
  | 'ACH'
  | 'FPS'
  | 'PIX'
  | 'UPI'
  | 'CARD'
  | 'PAYPAL';

export type FiatDirection = 'deposit' | 'withdraw';

export type FiatStatus =
  | 'pending'
  | 'submitted'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'rejected'
  | 'refunded';

export type KycTier = 'basic' | 'advanced' | 'institutional';

export type UserTier = 'starter' | 'verified' | 'pro' | 'vip';

// =============================================================================
// 银行账户
// =============================================================================

export interface BankAccount {
  id: string;
  userId: string;
  channel: FiatChannel;
  /** ISO 3166-1 alpha-2（如 'US' 'CN' 'EU'） */
  country: string;
  /** ISO 4217 货币代码（如 'USD' 'CNY' 'EUR'） */
  currency: string;
  holderName: string;
  bankName?: string;
  // 多种格式（按 channel 选填）
  accountNumber?: string;        // 账号
  routingNumber?: string;        // ABA / BSB
  iban?: string;                 // IBAN (EU)
  swift?: string;                // SWIFT/BIC
  pix?: string;                  // PIX (Brazil)
  vpa?: string;                  // UPI VPA (India)
  sortCode?: string;             // UK Sort Code
  ifsc?: string;                 // India IFSC
  isVerified: boolean;
  verifiedAt?: number;
  isPrimary: boolean;
  createdAt: number;
}

// =============================================================================
// 法币币种
// =============================================================================

export interface FiatCurrency {
  code: string;                // 'USD'
  name: string;                // 'US Dollar'
  symbol: string;              // '$'
  decimals: number;            // 2
  channels: FiatChannel[];     // 支持的入金渠道
  minDeposit: string;
  maxDeposit: string;
  minWithdraw: string;
  maxWithdraw: string;
  dailyLimit: string;
  monthlyLimit: string;
  yearlyLimit: string;
  fees: {
    depositRate: number;       // 0.005 = 0.5%
    withdrawRate: number;      // 0.01 = 1%
    fixedFee: string;          // 固定费用
    minFee: string;
    maxFee: string;
  };
}

// =============================================================================
// 交易
// =============================================================================

export interface FiatTransaction {
  id: string;
  userId: string;
  direction: FiatDirection;
  channel: FiatChannel;
  fiatCurrency: string;
  fiatAmount: string;
  fee: string;
  netAmount: string;            // 扣除手续费
  exchangeRate: string;         // 法币→USDT 汇率
  cryptoAmount?: string;        // 入账的 USDT 数量
  cryptoAsset: string;          // 'USDT'
  bankAccountId: string;
  status: FiatStatus;
  reference?: string;            // 银行流水号
  channelReference?: string;     // 渠道流水号
  rejectionReason?: string;
  createdAt: number;
  submittedAt?: number;
  completedAt?: number;
  expectedArrival: number;       // 预计到账时间
  events: FiatEvent[];
}

export type FiatEventType =
  | 'submitted'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'rejected'
  | 'refunded'
  | 'aml_check'
  | 'kyc_check';

export interface FiatEvent {
  type: FiatEventType;
  description: string;
  timestamp: number;
  meta?: Record<string, unknown>;
}

// =============================================================================
// 限额
// =============================================================================

export interface FiatLimits {
  userId: string;
  kycLevel: KycTier;
  tier: UserTier;
  dailyDeposit: { used: string; limit: string };
  dailyWithdraw: { used: string; limit: string };
  monthlyDeposit: { used: string; limit: string };
  monthlyWithdraw: { used: string; limit: string };
  yearlyDeposit: { used: string; limit: string };
  yearlyWithdraw: { used: string; limit: string };
  singleMaxDeposit: string;
  singleMaxWithdraw: string;
  updatedAt: number;
}

// =============================================================================
// 报价
// =============================================================================

export interface FiatQuote {
  id: string;
  channel: FiatChannel;
  fiatCurrency: string;
  cryptoAsset: string;
  fiatAmount: string;
  exchangeRate: string;
  fee: string;
  netCryptoAmount: string;
  expiresAt: number;            // 60s
  createdAt: number;
}

// =============================================================================
// 报表
// =============================================================================

export interface FiatReport {
  period: 'daily' | 'monthly';
  startTime: number;
  endTime: number;
  totalDeposit: string;
  totalWithdraw: string;
  totalFee: string;
  transactionCount: number;
  byChannel: Record<string, { count: number; amount: string }>;
  byCurrency: Record<string, { count: number; amount: string }>;
  byStatus: Record<string, number>;
}

// =============================================================================
// 通道基类接口
// =============================================================================

export interface FiatChannelAdapter {
  readonly channel: FiatChannel;
  createDeposit(opts: {
    account: BankAccount;
    amount: string;
    reference: string;
  }): Promise<{ reference: string; channelReference?: string; fee: string; expectedArrival: number }>;
  createWithdraw(opts: {
    account: BankAccount;
    amount: string;
    reference: string;
  }): Promise<{ reference: string; channelReference?: string; fee: string; expectedArrival: number }>;
  getStatus(reference: string): Promise<FiatStatus>;
  getFees(opts: {
    fromCurrency: string;
    toCurrency: string;
    amount: string;
  }): Promise<{ fee: string; total: string }>;
}

// =============================================================================
// 错误
// =============================================================================

export class FiatError extends Error {
  public readonly code: string;
  public readonly status?: number;
  public readonly meta?: Record<string, unknown>;
  constructor(code: string, message: string, opts: { status?: number; meta?: Record<string, unknown> } = {}) {
    super(message);
    this.name = 'FiatError';
    this.code = code;
    this.status = opts.status;
    this.meta = opts.meta;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class FiatValidationError extends FiatError {
  constructor(code: string, message: string, meta?: Record<string, unknown>) {
    super(code, message, { meta });
    this.name = 'FiatValidationError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class FiatLimitError extends FiatError {
  constructor(code: string, message: string, meta?: Record<string, unknown>) {
    super(code, message, { meta });
    this.name = 'FiatLimitError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class FiatAmlError extends FiatError {
  constructor(code: string, message: string, meta?: Record<string, unknown>) {
    super(code, message, { meta });
    this.name = 'FiatAmlError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

// =============================================================================
// 关键常量
// =============================================================================

export const SUPPORTED_FIAT_CURRENCIES = [
  'USD', 'EUR', 'GBP', 'CNY', 'JPY', 'KRW', 'HKD', 'SGD', 'AUD', 'CAD',
  'INR', 'BRL', 'MXN', 'CHF', 'NZD', 'THB', 'MYR', 'IDR', 'PHP', 'VND',
  'RUB', 'ZAR', 'TRY', 'NGN', 'ARS',
] as const;

export type SupportedFiatCurrency = (typeof SUPPORTED_FIAT_CURRENCIES)[number];

/** KYC 等级限额（USD 等值） */
export const KYC_LIMITS: Record<KycTier, {
  daily: string; monthly: string; yearly: string;
}> = {
  basic: { daily: '1000', monthly: '5000', yearly: '30000' },
  advanced: { daily: '50000', monthly: '200000', yearly: '1000000' },
  institutional: { daily: 'unlimited', monthly: 'unlimited', yearly: 'unlimited' },
};

/** 货币交易报告（CTR）阈值（USD） */
export const CTR_THRESHOLD = '10000';
/** 可疑活动报告（SAR）阈值（USD） */
export const SAR_THRESHOLD = '5000';
/** AML 高风险国家（FATF 黑名单 + 灰名单） */
export const AML_HIGH_RISK_COUNTRIES = ['IR', 'KP', 'SY', 'CU'];

/** 报价过期时间（毫秒） */
export const QUOTE_EXPIRY_MS = 60_000;

/** 默认小数位（法币 = 2，JPY/KRW/VND/IDR = 0） */
export const ZERO_DECIMAL_FIAT = new Set(['JPY', 'KRW', 'VND', 'IDR', 'HUF']);

/** 通道预计到账时间（毫秒） */
export const CHANNEL_ARRIVAL_MS: Record<FiatChannel, number> = {
  SWIFT: 2 * 24 * 3600_000,       // 1-3 工作日，取 2
  SEPA: 1 * 24 * 3600_000,        // 1 工作日
  ACH: 1.5 * 24 * 3600_000,       // 1-2 工作日
  FPS: 5_000,                      // 5 秒
  PIX: 10_000,                     // 10 秒
  UPI: 15_000,                     // 15 秒
  CARD: 30_000,                    // 30 秒
  PAYPAL: 60_000,                  // 1 分钟
};

/** 通道单笔最大金额（USD 等值） */
export const CHANNEL_SINGLE_MAX_USD: Record<FiatChannel, string> = {
  SWIFT: '10000000',
  SEPA: '1000000',
  ACH: '1000000',
  FPS: '100000',
  PIX: '50000',
  UPI: '10000',
  CARD: '50000',
  PAYPAL: '60000',
};

// =============================================================================
// 工具函数
// =============================================================================

/** 把法币金额换算为最小单位 */
export function toFiatMinor(amount: string, currency: string): bigint {
  const decimals = ZERO_DECIMAL_FIAT.has(currency.toUpperCase()) ? 0 : 2;
  const [int, frac = ''] = amount.split('.');
  const padded = (frac + '0'.repeat(decimals)).slice(0, decimals);
  return BigInt((int || '0') + padded);
}

export function fromFiatMinor(minor: bigint, currency: string): string {
  const decimals = ZERO_DECIMAL_FIAT.has(currency.toUpperCase()) ? 0 : 2;
  if (decimals === 0) return minor.toString();
  const sign = minor < 0n ? '-' : '';
  const abs = minor < 0n ? -minor : minor;
  const str = abs.toString().padStart(decimals + 1, '0');
  const int = str.slice(0, str.length - decimals);
  const frac = str.slice(str.length - decimals);
  return `${sign}${int}.${frac}`.replace(/\.?0+$/, '') || '0';
}

/** djb2 hash（用于稳定 mock 数据） */
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
