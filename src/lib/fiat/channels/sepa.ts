/**
 * SEPA (Single Euro Payments Area) 通道 (P2 Fiat)
 *
 * 职责：
 *  - 欧元区国家/UK 的法币出入金
 *  - 1 个工作日到账
 *  - IBAN 必填
 *  - 单笔上限 100 万 EUR
 *  - 演示降级：API Key 缺失时返回稳定 mock 数据
 *
 * 用法：
 *   const channel = new SepaChannel();
 *   const result = await channel.createWithdraw({ account, amount, reference });
 */

import { logger } from '../../logger';
import {
  CHANNEL_ARRIVAL_MS,
  CHANNEL_SINGLE_MAX_USD,
  type BankAccount,
  type FiatChannelAdapter,
  type FiatStatus,
  FiatValidationError,
  djb2,
} from '../types';

// =============================================================================
// 常量
// =============================================================================

const SEPA_API_BASE = 'https://api.sepa-network.example';
const SEPA_API_KEY =
  (typeof process !== 'undefined' && process.env?.SEPA_API_KEY) || '';

const DEFAULT_TIMEOUT_MS = 6_000;
const DEFAULT_MAX_RETRIES = 2;

const SEPA_FEE_FIXED = '1.5';         // EUR
const SEPA_FEE_RATE = 0.0005;         // 0.05%
const SEPA_FEE_MIN = '1.5';
const SEPA_FEE_MAX = '15';
const SEPA_SINGLE_MAX_EUR = '1000000'; // 1 百万 EUR

// =============================================================================
// IBAN 校验
// =============================================================================

/**
 * 完整 IBAN 校验（mod-97 算法）
 *  - 去空格、转大写
 *  - 移动国家代码到末尾
 *  - 字母→数字映射
 *  - mod 97 == 1 即合法
 */
export function validateIban(iban: string): { valid: boolean; reason?: string; country?: string } {
  if (!iban) return { valid: false, reason: 'IBAN is required' };
  const cleaned = iban.replace(/\s+/g, '').toUpperCase();
  if (cleaned.length < 15 || cleaned.length > 34) {
    return { valid: false, reason: `IBAN length invalid: ${cleaned.length}` };
  }
  if (!/^[A-Z]{2}\d{2}[A-Z0-9]+$/.test(cleaned)) {
    return { valid: false, reason: 'IBAN format invalid' };
  }
  // 移动前 4 位到末尾
  const rearranged = cleaned.slice(4) + cleaned.slice(0, 4);
  // 字母→数字
  let numeric = '';
  for (const ch of rearranged) {
    if (ch >= '0' && ch <= '9') {
      numeric += ch;
    } else if (ch >= 'A' && ch <= 'Z') {
      numeric += (ch.charCodeAt(0) - 55).toString();
    } else {
      return { valid: false, reason: 'IBAN contains invalid characters' };
    }
  }
  // mod 97 (处理大数)
  const mod = mod97(numeric);
  if (mod !== 1) {
    return { valid: false, reason: 'IBAN mod-97 check failed' };
  }
  return { valid: true, country: cleaned.slice(0, 2) };
}

/** 大整数 mod 97（分段处理避免精度丢失） */
function mod97(s: string): number {
  let remainder = 0;
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i) - 48;
    if (c < 0 || c > 9) return -1;
    remainder = (remainder * 10 + c) % 97;
  }
  return remainder;
}

// =============================================================================
// 内部工具
// =============================================================================

function computeSepaFee(amount: string, currency: string): string {
  const n = Number(amount);
  if (!isFinite(n) || n <= 0) return '0';
  let fee = n * SEPA_FEE_RATE + Number(SEPA_FEE_FIXED);
  if (fee < Number(SEPA_FEE_MIN)) fee = Number(SEPA_FEE_MIN);
  if (fee > Number(SEPA_FEE_MAX)) fee = Number(SEPA_FEE_MAX);
  // SEPA 内部用 EUR
  const decimals = currency === 'JPY' ? 0 : 2;
  return fee.toFixed(decimals);
}

// =============================================================================
// SepaChannel
// =============================================================================

export interface SepaChannelOptions {
  apiBase?: string;
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
  maxRetries?: number;
  mockMode?: boolean;
  logger?: typeof logger;
  now?: () => number;
}

export class SepaChannel implements FiatChannelAdapter {
  public readonly channel = 'SEPA' as const;
  private readonly apiBase: string;
  private readonly fetchImpl: typeof fetch;
  private readonly timeoutMs: number;
  private readonly maxRetries: number;
  private readonly mockMode: boolean;
  private readonly logger: typeof logger;
  private readonly now: () => number;

  constructor(opts: SepaChannelOptions = {}) {
    this.apiBase = (opts.apiBase ?? SEPA_API_BASE).replace(/\/+$/, '');
    this.fetchImpl =
      opts.fetchImpl ??
      (typeof fetch !== 'undefined'
        ? fetch
        : (() => {
            throw new Error('SepaChannel: no fetch implementation available');
          })() as typeof fetch);
    this.timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    this.maxRetries = opts.maxRetries ?? DEFAULT_MAX_RETRIES;
    this.mockMode = !!opts.mockMode || !SEPA_API_KEY;
    this.logger = opts.logger ?? logger;
    this.now = opts.now ?? (() => Date.now());
  }

  async createDeposit(opts: {
    account: BankAccount;
    amount: string;
    reference: string;
  }): Promise<{ reference: string; channelReference?: string; fee: string; expectedArrival: number }> {
    this.validateAccount(opts.account);
    this.validateAmount(opts.amount, opts.account.currency);
    const fee = computeSepaFee(opts.amount, opts.account.currency);
    const expectedArrival = this.now() + CHANNEL_ARRIVAL_MS.SEPA;
    if (this.mockMode) {
      return this.mockResult(opts.reference, fee, expectedArrival);
    }
    return this.callApi('/credit-transfers/incoming', opts, fee, expectedArrival);
  }

  async createWithdraw(opts: {
    account: BankAccount;
    amount: string;
    reference: string;
  }): Promise<{ reference: string; channelReference?: string; fee: string; expectedArrival: number }> {
    this.validateAccount(opts.account);
    this.validateAmount(opts.amount, opts.account.currency);
    const fee = computeSepaFee(opts.amount, opts.account.currency);
    const expectedArrival = this.now() + CHANNEL_ARRIVAL_MS.SEPA;
    if (this.mockMode) {
      return this.mockResult(opts.reference, fee, expectedArrival);
    }
    return this.callApi('/credit-transfers/outgoing', opts, fee, expectedArrival);
  }

  async getStatus(reference: string): Promise<FiatStatus> {
    if (!reference) return 'pending';
    if (this.mockMode) {
      const h = djb2(reference);
      const m = h % 100;
      if (m < 95) return 'completed';
      if (m < 99) return 'processing';
      return 'failed';
    }
    try {
      const resp = await this.fetchImpl(`${this.apiBase}/transactions/${encodeURIComponent(reference)}`);
      if (!resp.ok) return 'pending';
      const data = (await resp.json()) as { status?: string };
      return normalizeSepaStatus(data.status);
    } catch {
      return 'pending';
    }
  }

  async getFees(opts: {
    fromCurrency: string;
    toCurrency: string;
    amount: string;
  }): Promise<{ fee: string; total: string }> {
    const fee = computeSepaFee(opts.amount, opts.fromCurrency);
    const total = (Number(opts.amount) + Number(fee)).toFixed(2);
    return { fee, total };
  }

  // -------------------------------------------------------------------------
  // 内部
  // -------------------------------------------------------------------------

  private validateAccount(account: BankAccount): void {
    if (!account.holderName) {
      throw new FiatValidationError('INVALID_ACCOUNT', 'holderName is required');
    }
    if (!account.iban) {
      throw new FiatValidationError('INVALID_ACCOUNT', 'IBAN is required for SEPA channel');
    }
    const v = validateIban(account.iban);
    if (!v.valid) {
      throw new FiatValidationError('INVALID_IBAN', v.reason ?? 'invalid IBAN', { iban: account.iban });
    }
    if (account.currency !== 'EUR') {
      throw new FiatValidationError(
        'UNSUPPORTED_CURRENCY',
        `SEPA only supports EUR, got ${account.currency}`,
      );
    }
  }

  private validateAmount(amount: string, currency: string): void {
    const n = Number(amount);
    if (!isFinite(n) || n <= 0) {
      throw new FiatValidationError('INVALID_AMOUNT', 'amount must be positive number');
    }
    // SEPA 限额 100 万 EUR
    if (currency === 'EUR' && n > Number(SEPA_SINGLE_MAX_EUR)) {
      throw new FiatValidationError(
        'AMOUNT_EXCEEDS_MAX',
        `SEPA single max ${SEPA_SINGLE_MAX_EUR} EUR`,
        { amount, max: SEPA_SINGLE_MAX_EUR },
      );
    }
    const max = Number(CHANNEL_SINGLE_MAX_USD.SEPA);
    if (n > max * 1.1) {
      // USD 等值 1.1 倍缓冲
      throw new FiatValidationError('AMOUNT_EXCEEDS_MAX', `amount exceeds channel max ${max}`, {
        amount,
        max: CHANNEL_SINGLE_MAX_USD.SEPA,
      });
    }
  }

  private mockResult(reference: string, fee: string, expectedArrival: number) {
    return {
      reference,
      channelReference: `SEPA-MOCK-${djb2(reference).toString(16).toUpperCase()}`,
      fee,
      expectedArrival,
    };
  }

  private async callApi(
    path: string,
    opts: { account: BankAccount; amount: string; reference: string },
    fee: string,
    expectedArrival: number,
  ): Promise<{ reference: string; channelReference?: string; fee: string; expectedArrival: number }> {
    const url = `${this.apiBase}${path}`;
    let lastErr: unknown;
    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), this.timeoutMs);
        const resp = await this.fetchImpl(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${SEPA_API_KEY}`,
          },
          body: JSON.stringify({
            reference: opts.reference,
            amount: opts.amount,
            currency: opts.account.currency,
            iban: opts.account.iban,
            holder: opts.account.holderName,
          }),
          signal: controller.signal,
        });
        clearTimeout(timer);
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const data = (await resp.json()) as { channelReference?: string };
        return {
          reference: opts.reference,
          channelReference: data.channelReference,
          fee,
          expectedArrival,
        };
      } catch (err) {
        lastErr = err;
        if (attempt < this.maxRetries) {
          await new Promise((r) => setTimeout(r, 200 * 2 ** attempt));
          continue;
        }
      }
    }
    this.logger.warn(`[SEPA] ${path} failed, fallback to mock: ${(lastErr as Error)?.message}`);
    return this.mockResult(opts.reference, fee, expectedArrival);
  }
}

function normalizeSepaStatus(s?: string): FiatStatus {
  const v = (s ?? '').toLowerCase();
  if (v.includes('accept') || v.includes('settled') || v.includes('complete')) return 'completed';
  if (v.includes('process') || v.includes('accept') || v.includes('pending')) return 'processing';
  if (v.includes('reject')) return 'rejected';
  if (v.includes('return')) return 'refunded';
  if (v.includes('fail')) return 'failed';
  return 'pending';
}

export function createSepaChannel(opts?: SepaChannelOptions): SepaChannel {
  return new SepaChannel(opts);
}

export default SepaChannel;
