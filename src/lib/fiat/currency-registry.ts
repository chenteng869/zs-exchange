/**
 * 法币币种注册表 (P2 Fiat)
 *
 * 职责：
 *  - 预定义 25 个法币币种（含限额、费率、渠道映射）
 *  - 维护法币 ↔ USD 汇率（mock 模式：固定演示汇率）
 *  - 提供 getCurrency / getAll / getRate 接口
 *  - 演示降级：API Key 缺失或服务端不可达时返回稳定 mock 数据
 *  - 不引入外部依赖
 *
 * 用法：
 *   const reg = new CurrencyRegistry();
 *   const usd = reg.getCurrency('USD');
 *   const rate = await reg.getRate('EUR', 'USDT');
 */

import { logger } from '../logger';
import type { FiatChannel, FiatCurrency } from './types';
import {
  SUPPORTED_FIAT_CURRENCIES,
  type SupportedFiatCurrency,
} from './types';

// =============================================================================
// 常量
// =============================================================================

const CURRENCY_API_BASE = 'https://api.exchangerate.host';
const CURRENCY_API_KEY =
  (typeof process !== 'undefined' && process.env?.CURRENCY_API_KEY) || '';

const DEFAULT_TIMEOUT_MS = 5_000;

/** mock 模式：USD = 1，其它法币相对 USD 的汇率（演示用） */
const MOCK_USD_RATES: Record<string, number> = {
  USD: 1,
  EUR: 1.08,
  GBP: 1.27,
  CNY: 0.14,
  JPY: 0.0067,
  KRW: 0.00075,
  HKD: 0.128,
  SGD: 0.74,
  AUD: 0.66,
  CAD: 0.74,
  INR: 0.012,
  BRL: 0.20,
  MXN: 0.058,
  CHF: 1.14,
  NZD: 0.61,
  THB: 0.028,
  MYR: 0.22,
  IDR: 0.000063,
  PHP: 0.018,
  VND: 0.000040,
  RUB: 0.011,
  ZAR: 0.054,
  TRY: 0.031,
  NGN: 0.00069,
  ARS: 0.0011,
};

// =============================================================================
// 类型
// =============================================================================

export interface CurrencyRegistryOptions {
  /** 自定义 API base（私有部署用） */
  apiBase?: string;
  /** 自定义 fetch */
  fetchImpl?: typeof fetch;
  /** 超时 ms */
  timeoutMs?: number;
  /** 强制 mock 模式 */
  mockMode?: boolean;
  /** 自定义 logger */
  logger?: typeof logger;
  /** 时钟注入 */
  now?: () => number;
  /** 自定义 mock 汇率（用于测试） */
  mockRates?: Record<string, number>;
}

// =============================================================================
// 预定义币种
// =============================================================================

function buildCurrencies(): FiatCurrency[] {
  const allChannels: FiatChannel[] = ['SWIFT', 'SEPA', 'ACH', 'FPS', 'PIX', 'UPI', 'CARD'];
  return [
    {
      code: 'USD',
      name: 'US Dollar',
      symbol: '$',
      decimals: 2,
      channels: ['SWIFT', 'ACH', 'CARD'],
      minDeposit: '100',
      maxDeposit: '1000000',
      minWithdraw: '50',
      maxWithdraw: '500000',
      dailyLimit: '50000',
      monthlyLimit: '500000',
      yearlyLimit: '5000000',
      fees: { depositRate: 0.005, withdrawRate: 0.01, fixedFee: '5', minFee: '5', maxFee: '100' },
    },
    {
      code: 'EUR',
      name: 'Euro',
      symbol: '€',
      decimals: 2,
      channels: ['SWIFT', 'SEPA', 'CARD'],
      minDeposit: '100',
      maxDeposit: '1000000',
      minWithdraw: '50',
      maxWithdraw: '500000',
      dailyLimit: '50000',
      monthlyLimit: '500000',
      yearlyLimit: '5000000',
      fees: { depositRate: 0.005, withdrawRate: 0.01, fixedFee: '5', minFee: '5', maxFee: '100' },
    },
    {
      code: 'GBP',
      name: 'British Pound',
      symbol: '£',
      decimals: 2,
      channels: ['SWIFT', 'FPS', 'CARD'],
      minDeposit: '100',
      maxDeposit: '500000',
      minWithdraw: '50',
      maxWithdraw: '250000',
      dailyLimit: '50000',
      monthlyLimit: '500000',
      yearlyLimit: '5000000',
      fees: { depositRate: 0.005, withdrawRate: 0.012, fixedFee: '5', minFee: '5', maxFee: '100' },
    },
    {
      code: 'CNY',
      name: 'Chinese Yuan',
      symbol: '¥',
      decimals: 2,
      channels: ['SWIFT', 'CARD'],
      minDeposit: '500',
      maxDeposit: '5000000',
      minWithdraw: '500',
      maxWithdraw: '2000000',
      dailyLimit: '200000',
      monthlyLimit: '2000000',
      yearlyLimit: '20000000',
      fees: { depositRate: 0.002, withdrawRate: 0.005, fixedFee: '10', minFee: '10', maxFee: '200' },
    },
    {
      code: 'JPY',
      name: 'Japanese Yen',
      symbol: '¥',
      decimals: 0,
      channels: ['SWIFT', 'CARD'],
      minDeposit: '10000',
      maxDeposit: '100000000',
      minWithdraw: '5000',
      maxWithdraw: '50000000',
      dailyLimit: '5000000',
      monthlyLimit: '50000000',
      yearlyLimit: '500000000',
      fees: { depositRate: 0.005, withdrawRate: 0.012, fixedFee: '500', minFee: '500', maxFee: '10000' },
    },
    {
      code: 'KRW',
      name: 'South Korean Won',
      symbol: '₩',
      decimals: 0,
      channels: ['SWIFT', 'CARD'],
      minDeposit: '100000',
      maxDeposit: '100000000',
      minWithdraw: '50000',
      maxWithdraw: '50000000',
      dailyLimit: '50000000',
      monthlyLimit: '500000000',
      yearlyLimit: '5000000000',
      fees: { depositRate: 0.008, withdrawRate: 0.015, fixedFee: '5000', minFee: '5000', maxFee: '100000' },
    },
    {
      code: 'HKD',
      name: 'Hong Kong Dollar',
      symbol: 'HK$',
      decimals: 2,
      channels: ['SWIFT', 'CARD'],
      minDeposit: '1000',
      maxDeposit: '5000000',
      minWithdraw: '500',
      maxWithdraw: '2000000',
      dailyLimit: '200000',
      monthlyLimit: '2000000',
      yearlyLimit: '20000000',
      fees: { depositRate: 0.005, withdrawRate: 0.012, fixedFee: '50', minFee: '50', maxFee: '1000' },
    },
    {
      code: 'SGD',
      name: 'Singapore Dollar',
      symbol: 'S$',
      decimals: 2,
      channels: ['SWIFT', 'CARD'],
      minDeposit: '100',
      maxDeposit: '500000',
      minWithdraw: '50',
      maxWithdraw: '250000',
      dailyLimit: '50000',
      monthlyLimit: '500000',
      yearlyLimit: '5000000',
      fees: { depositRate: 0.005, withdrawRate: 0.01, fixedFee: '5', minFee: '5', maxFee: '100' },
    },
    {
      code: 'AUD',
      name: 'Australian Dollar',
      symbol: 'A$',
      decimals: 2,
      channels: ['SWIFT', 'CARD'],
      minDeposit: '100',
      maxDeposit: '500000',
      minWithdraw: '50',
      maxWithdraw: '250000',
      dailyLimit: '50000',
      monthlyLimit: '500000',
      yearlyLimit: '5000000',
      fees: { depositRate: 0.005, withdrawRate: 0.012, fixedFee: '5', minFee: '5', maxFee: '100' },
    },
    {
      code: 'CAD',
      name: 'Canadian Dollar',
      symbol: 'C$',
      decimals: 2,
      channels: ['SWIFT', 'CARD'],
      minDeposit: '100',
      maxDeposit: '500000',
      minWithdraw: '50',
      maxWithdraw: '250000',
      dailyLimit: '50000',
      monthlyLimit: '500000',
      yearlyLimit: '5000000',
      fees: { depositRate: 0.005, withdrawRate: 0.01, fixedFee: '5', minFee: '5', maxFee: '100' },
    },
    {
      code: 'INR',
      name: 'Indian Rupee',
      symbol: '₹',
      decimals: 2,
      channels: ['SWIFT', 'UPI'],
      minDeposit: '1000',
      maxDeposit: '1000000',
      minWithdraw: '500',
      maxWithdraw: '500000',
      dailyLimit: '100000',
      monthlyLimit: '1000000',
      yearlyLimit: '10000000',
      fees: { depositRate: 0.005, withdrawRate: 0.008, fixedFee: '30', minFee: '30', maxFee: '500' },
    },
    {
      code: 'BRL',
      name: 'Brazilian Real',
      symbol: 'R$',
      decimals: 2,
      channels: ['SWIFT', 'PIX'],
      minDeposit: '500',
      maxDeposit: '500000',
      minWithdraw: '100',
      maxWithdraw: '200000',
      dailyLimit: '50000',
      monthlyLimit: '500000',
      yearlyLimit: '5000000',
      fees: { depositRate: 0.008, withdrawRate: 0.012, fixedFee: '10', minFee: '10', maxFee: '200' },
    },
    {
      code: 'MXN',
      name: 'Mexican Peso',
      symbol: 'Mex$',
      decimals: 2,
      channels: ['SWIFT', 'CARD'],
      minDeposit: '1000',
      maxDeposit: '5000000',
      minWithdraw: '500',
      maxWithdraw: '2000000',
      dailyLimit: '500000',
      monthlyLimit: '5000000',
      yearlyLimit: '50000000',
      fees: { depositRate: 0.008, withdrawRate: 0.015, fixedFee: '50', minFee: '50', maxFee: '1000' },
    },
    {
      code: 'CHF',
      name: 'Swiss Franc',
      symbol: 'CHF',
      decimals: 2,
      channels: ['SWIFT', 'SEPA', 'CARD'],
      minDeposit: '100',
      maxDeposit: '500000',
      minWithdraw: '50',
      maxWithdraw: '250000',
      dailyLimit: '50000',
      monthlyLimit: '500000',
      yearlyLimit: '5000000',
      fees: { depositRate: 0.005, withdrawRate: 0.012, fixedFee: '5', minFee: '5', maxFee: '100' },
    },
    {
      code: 'NZD',
      name: 'New Zealand Dollar',
      symbol: 'NZ$',
      decimals: 2,
      channels: ['SWIFT', 'CARD'],
      minDeposit: '100',
      maxDeposit: '500000',
      minWithdraw: '50',
      maxWithdraw: '250000',
      dailyLimit: '50000',
      monthlyLimit: '500000',
      yearlyLimit: '5000000',
      fees: { depositRate: 0.005, withdrawRate: 0.012, fixedFee: '5', minFee: '5', maxFee: '100' },
    },
    {
      code: 'THB',
      name: 'Thai Baht',
      symbol: '฿',
      decimals: 2,
      channels: ['SWIFT', 'CARD'],
      minDeposit: '3000',
      maxDeposit: '15000000',
      minWithdraw: '1500',
      maxWithdraw: '7500000',
      dailyLimit: '1500000',
      monthlyLimit: '15000000',
      yearlyLimit: '150000000',
      fees: { depositRate: 0.008, withdrawRate: 0.012, fixedFee: '100', minFee: '100', maxFee: '2000' },
    },
    {
      code: 'MYR',
      name: 'Malaysian Ringgit',
      symbol: 'RM',
      decimals: 2,
      channels: ['SWIFT', 'CARD'],
      minDeposit: '500',
      maxDeposit: '2000000',
      minWithdraw: '200',
      maxWithdraw: '1000000',
      dailyLimit: '200000',
      monthlyLimit: '2000000',
      yearlyLimit: '20000000',
      fees: { depositRate: 0.008, withdrawRate: 0.012, fixedFee: '20', minFee: '20', maxFee: '500' },
    },
    {
      code: 'IDR',
      name: 'Indonesian Rupiah',
      symbol: 'Rp',
      decimals: 0,
      channels: ['SWIFT', 'CARD'],
      minDeposit: '1000000',
      maxDeposit: '15000000000',
      minWithdraw: '500000',
      maxWithdraw: '5000000000',
      dailyLimit: '1000000000',
      monthlyLimit: '10000000000',
      yearlyLimit: '100000000000',
      fees: { depositRate: 0.01, withdrawRate: 0.015, fixedFee: '50000', minFee: '50000', maxFee: '1000000' },
    },
    {
      code: 'PHP',
      name: 'Philippine Peso',
      symbol: '₱',
      decimals: 2,
      channels: ['SWIFT', 'CARD'],
      minDeposit: '5000',
      maxDeposit: '25000000',
      minWithdraw: '2000',
      maxWithdraw: '10000000',
      dailyLimit: '2500000',
      monthlyLimit: '25000000',
      yearlyLimit: '250000000',
      fees: { depositRate: 0.01, withdrawRate: 0.015, fixedFee: '100', minFee: '100', maxFee: '2500' },
    },
    {
      code: 'VND',
      name: 'Vietnamese Dong',
      symbol: '₫',
      decimals: 0,
      channels: ['SWIFT', 'CARD'],
      minDeposit: '2000000',
      maxDeposit: '25000000000',
      minWithdraw: '1000000',
      maxWithdraw: '10000000000',
      dailyLimit: '2000000000',
      monthlyLimit: '20000000000',
      yearlyLimit: '200000000000',
      fees: { depositRate: 0.01, withdrawRate: 0.015, fixedFee: '50000', minFee: '50000', maxFee: '2000000' },
    },
    {
      code: 'RUB',
      name: 'Russian Ruble',
      symbol: '₽',
      decimals: 2,
      channels: ['SWIFT'],
      minDeposit: '5000',
      maxDeposit: '50000000',
      minWithdraw: '2500',
      maxWithdraw: '25000000',
      dailyLimit: '5000000',
      monthlyLimit: '50000000',
      yearlyLimit: '500000000',
      fees: { depositRate: 0.012, withdrawRate: 0.018, fixedFee: '200', minFee: '200', maxFee: '5000' },
    },
    {
      code: 'ZAR',
      name: 'South African Rand',
      symbol: 'R',
      decimals: 2,
      channels: ['SWIFT', 'CARD'],
      minDeposit: '1500',
      maxDeposit: '10000000',
      minWithdraw: '750',
      maxWithdraw: '5000000',
      dailyLimit: '1000000',
      monthlyLimit: '10000000',
      yearlyLimit: '100000000',
      fees: { depositRate: 0.01, withdrawRate: 0.015, fixedFee: '50', minFee: '50', maxFee: '1000' },
    },
    {
      code: 'TRY',
      name: 'Turkish Lira',
      symbol: '₺',
      decimals: 2,
      channels: ['SWIFT', 'CARD'],
      minDeposit: '5000',
      maxDeposit: '50000000',
      minWithdraw: '2500',
      maxWithdraw: '25000000',
      dailyLimit: '5000000',
      monthlyLimit: '50000000',
      yearlyLimit: '500000000',
      fees: { depositRate: 0.012, withdrawRate: 0.018, fixedFee: '100', minFee: '100', maxFee: '2500' },
    },
    {
      code: 'NGN',
      name: 'Nigerian Naira',
      symbol: '₦',
      decimals: 2,
      channels: ['SWIFT', 'CARD'],
      minDeposit: '50000',
      maxDeposit: '500000000',
      minWithdraw: '25000',
      maxWithdraw: '250000000',
      dailyLimit: '50000000',
      monthlyLimit: '500000000',
      yearlyLimit: '5000000000',
      fees: { depositRate: 0.015, withdrawRate: 0.02, fixedFee: '1000', minFee: '1000', maxFee: '20000' },
    },
    {
      code: 'ARS',
      name: 'Argentine Peso',
      symbol: '$',
      decimals: 2,
      channels: ['SWIFT'],
      minDeposit: '50000',
      maxDeposit: '500000000',
      minWithdraw: '25000',
      maxWithdraw: '250000000',
      dailyLimit: '50000000',
      monthlyLimit: '500000000',
      yearlyLimit: '5000000000',
      fees: { depositRate: 0.02, withdrawRate: 0.025, fixedFee: '5000', minFee: '5000', maxFee: '50000' },
    },
  ];
}

// =============================================================================
// CurrencyRegistry
// =============================================================================

export class CurrencyRegistry {
  private readonly apiBase: string;
  private readonly fetchImpl: typeof fetch;
  private readonly timeoutMs: number;
  private readonly mockMode: boolean;
  private readonly logger: typeof logger;
  private readonly now: () => number;
  private readonly mockRates: Record<string, number>;
  private readonly cache: Map<string, FiatCurrency>;
  /** 汇率缓存 { 'USD->EUR': { rate, ts } } */
  private readonly rateCache: Map<string, { rate: string; ts: number }>;
  /** 汇率缓存 TTL（毫秒） */
  private readonly rateTtlMs: number;

  constructor(opts: CurrencyRegistryOptions = {}) {
    this.apiBase = (opts.apiBase ?? CURRENCY_API_BASE).replace(/\/+$/, '');
    this.fetchImpl =
      opts.fetchImpl ??
      (typeof fetch !== 'undefined'
        ? fetch
        : (() => {
            throw new Error('CurrencyRegistry: no fetch implementation available');
          })() as typeof fetch);
    this.timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    this.mockMode = !!opts.mockMode || !CURRENCY_API_KEY;
    this.logger = opts.logger ?? logger;
    this.now = opts.now ?? (() => Date.now());
    this.mockRates = opts.mockRates ?? MOCK_USD_RATES;
    this.cache = new Map();
    this.rateCache = new Map();
    this.rateTtlMs = 60_000; // 1 分钟

    const all = buildCurrencies();
    for (const c of all) {
      this.cache.set(c.code, c);
    }
  }

  // -------------------------------------------------------------------------
  // 查询
  // -------------------------------------------------------------------------

  /** 按 code 获取法币配置（不区分大小写） */
  getCurrency(code: string): FiatCurrency | null {
    return this.cache.get(code.toUpperCase()) ?? null;
  }

  /** 获取所有支持的法币 */
  getAll(): FiatCurrency[] {
    return Array.from(this.cache.values());
  }

  /** 检查是否支持某法币 */
  isSupported(code: string): boolean {
    return this.cache.has(code.toUpperCase());
  }

  /** 检查通道是否支持 */
  isChannelSupported(currencyCode: string, channel: FiatChannel): boolean {
    const c = this.getCurrency(currencyCode);
    if (!c) return false;
    return c.channels.includes(channel);
  }

  /** 列出所有支持的法币 code */
  listCodes(): string[] {
    return Array.from(this.cache.keys());
  }

  // -------------------------------------------------------------------------
  // 汇率
  // -------------------------------------------------------------------------

  /**
   * 获取汇率（from → to）
   *  - mock 模式：使用固定演示汇率
   *  - 真实模式：调 exchangerate.host（演示降级：失败 → mock）
   *  - 支持 USD 作为中间货币
   *  - 缓存 1 分钟
   */
  async getRate(from: string, to: string): Promise<string> {
    const f = from.toUpperCase();
    const t = to.toUpperCase();
    if (f === t) return '1';
    const cacheKey = `${f}->${t}`;
    const cached = this.rateCache.get(cacheKey);
    if (cached && this.now() - cached.ts < this.rateTtlMs) {
      return cached.rate;
    }
    let rate = '1';
    if (this.mockMode) {
      rate = this.computeMockRate(f, t);
    } else {
      try {
        rate = await this.fetchRate(f, t);
      } catch (err) {
        this.logger.warn(
          `[Fiat] fetchRate(${f}->${t}) failed: ${(err as Error).message}, fallback to mock`,
        );
        rate = this.computeMockRate(f, t);
      }
    }
    this.rateCache.set(cacheKey, { rate, ts: this.now() });
    return rate;
  }

  /** mock 模式汇率计算：法币 → 目标法币
   *  mockRates 存储为「1 单位法币 = X USD」（如 CNY: 0.14 = 1 CNY = 0.14 USD）
   *  from→to = (from→USD) / (to→USD) = mockRates[from] / mockRates[to]
   */
  private computeMockRate(from: string, to: string): string {
    if (from === to) return '1';
    const fromUsd = this.mockRates[from] ?? 1;
    const toUsd = this.mockRates[to] ?? 1;
    const rate = fromUsd / toUsd;
    return rate.toFixed(8);
  }

  /** 真实 API 获取汇率 */
  private async fetchRate(from: string, to: string): Promise<string> {
    const url = `${this.apiBase}/latest?base=${from}&symbols=${to}&access_key=${CURRENCY_API_KEY}`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const resp = await this.fetchImpl(url, { signal: controller.signal });
      if (!resp.ok) {
        throw new Error(`HTTP ${resp.status}`);
      }
      const data = (await resp.json()) as { rates?: Record<string, number> };
      const r = data.rates?.[to];
      if (typeof r !== 'number' || !isFinite(r) || r <= 0) {
        throw new Error(`invalid rate: ${r}`);
      }
      return r.toFixed(8);
    } finally {
      clearTimeout(timer);
    }
  }

  // -------------------------------------------------------------------------
  // 工具
  // -------------------------------------------------------------------------

  /** 校验金额是否在币种允许范围内（deposit） */
  validateDepositAmount(currencyCode: string, amount: string): { valid: boolean; reason?: string } {
    const c = this.getCurrency(currencyCode);
    if (!c) return { valid: false, reason: `unsupported currency: ${currencyCode}` };
    const n = Number(amount);
    if (!isFinite(n) || n <= 0) return { valid: false, reason: 'amount must be positive number' };
    if (n < Number(c.minDeposit)) return { valid: false, reason: `below minDeposit ${c.minDeposit}` };
    if (n > Number(c.maxDeposit)) return { valid: false, reason: `exceeds maxDeposit ${c.maxDeposit}` };
    return { valid: true };
  }

  /** 校验金额是否在币种允许范围内（withdraw） */
  validateWithdrawAmount(currencyCode: string, amount: string): { valid: boolean; reason?: string } {
    const c = this.getCurrency(currencyCode);
    if (!c) return { valid: false, reason: `unsupported currency: ${currencyCode}` };
    const n = Number(amount);
    if (!isFinite(n) || n <= 0) return { valid: false, reason: 'amount must be positive number' };
    if (n < Number(c.minWithdraw)) return { valid: false, reason: `below minWithdraw ${c.minWithdraw}` };
    if (n > Number(c.maxWithdraw)) return { valid: false, reason: `exceeds maxWithdraw ${c.maxWithdraw}` };
    return { valid: true };
  }

  /** 计算手续费 */
  computeFee(
    currencyCode: string,
    direction: 'deposit' | 'withdraw',
    amount: string,
  ): { fee: string; netAmount: string } {
    const c = this.getCurrency(currencyCode);
    if (!c) {
      return { fee: '0', netAmount: amount };
    }
    const rate = direction === 'deposit' ? c.fees.depositRate : c.fees.withdrawRate;
    const fixed = Number(c.fees.fixedFee);
    const min = Number(c.fees.minFee);
    const max = Number(c.fees.maxFee);
    const amt = Number(amount);
    let fee = amt * rate + fixed;
    if (fee < min) fee = min;
    if (fee > max) fee = max;
    const feeStr = fee.toFixed(c.decimals);
    const net = (amt - fee).toFixed(c.decimals);
    return { fee: feeStr, netAmount: net };
  }

  /** 列出币种支持的通道 */
  getSupportedChannels(currencyCode: string): FiatChannel[] {
    return [...(this.getCurrency(currencyCode)?.channels ?? [])];
  }

  /** 把 SupportedFiatCurrency 类型转换为字符串数组 */
  static getSupportedCodes(): string[] {
    return [...SUPPORTED_FIAT_CURRENCIES];
  }
}

// =============================================================================
// 工厂
// =============================================================================

export function createCurrencyRegistry(opts?: CurrencyRegistryOptions): CurrencyRegistry {
  return new CurrencyRegistry(opts);
}

export default CurrencyRegistry;
