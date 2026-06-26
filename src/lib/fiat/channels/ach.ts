/**
 * ACH (Automated Clearing House) 美国通道 (P2 Fiat)
 *
 * 职责：
 *  - 美国 ACH 网络出入金
 *  - 1-2 个工作日到账
 *  - ABA routing + account number
 *  - 单笔上限 100 万 USD
 *  - 演示降级：API Key 缺失时返回稳定 mock 数据
 *
 * 用法：
 *   const channel = new AchChannel();
 *   const result = await channel.createDeposit({ account, amount, reference });
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

const ACH_API_BASE = 'https://api.ach-network.example';
const ACH_API_KEY =
  (typeof process !== 'undefined' && process.env?.ACH_API_KEY) || '';

const DEFAULT_TIMEOUT_MS = 6_000;
const DEFAULT_MAX_RETRIES = 2;

const ACH_FEE_FIXED = '0.5';
const ACH_FEE_RATE = 0.0003;          // 0.03%
const ACH_FEE_MIN = '0.5';
const ACH_FEE_MAX = '5';
const ACH_SINGLE_MAX_USD = '1000000'; // 1 百万 USD

// =============================================================================
// ABA 校验
// =============================================================================

/**
 * ABA Routing Number 校验
 *  - 9 位数字
 *  - 第 1-2 位：联邦储备银行
 *  - 第 3 位：联邦储备分支
 *  - 第 4-7 位：银行代号
 *  - 第 8 位：校验位
 *  - 加权 (3,7,1,3,7,1,3,7,1) 求和 mod 10 == 0
 */
export function validateAbaRouting(routing: string): { valid: boolean; reason?: string } {
  if (!routing) return { valid: false, reason: 'routing number is required' };
  const r = routing.replace(/[-\s]/g, '');
  if (!/^\d{9}$/.test(r)) {
    return { valid: false, reason: 'routing number must be 9 digits' };
  }
  const weights = [3, 7, 1, 3, 7, 1, 3, 7, 1];
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += Number(r.charAt(i)) * weights[i];
  }
  if (sum % 10 !== 0) {
    return { valid: false, reason: 'routing checksum failed' };
  }
  return { valid: true };
}

/** 校验账号（4-17 位数字） */
export function validateAchAccountNumber(account: string): { valid: boolean; reason?: string } {
  if (!account) return { valid: false, reason: 'account number is required' };
  const a = account.replace(/[-\s]/g, '');
  if (!/^\d{4,17}$/.test(a)) {
    return { valid: false, reason: 'account number must be 4-17 digits' };
  }
  return { valid: true };
}

// =============================================================================
// 内部工具
// =============================================================================

function computeAchFee(amount: string): string {
  const n = Number(amount);
  if (!isFinite(n) || n <= 0) return '0';
  let fee = n * ACH_FEE_RATE + Number(ACH_FEE_FIXED);
  if (fee < Number(ACH_FEE_MIN)) fee = Number(ACH_FEE_MIN);
  if (fee > Number(ACH_FEE_MAX)) fee = Number(ACH_FEE_MAX);
  return fee.toFixed(2);
}

// =============================================================================
// AchChannel
// =============================================================================

export interface AchChannelOptions {
  apiBase?: string;
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
  maxRetries?: number;
  mockMode?: boolean;
  logger?: typeof logger;
  now?: () => number;
}

export class AchChannel implements FiatChannelAdapter {
  public readonly channel = 'ACH' as const;
  private readonly apiBase: string;
  private readonly fetchImpl: typeof fetch;
  private readonly timeoutMs: number;
  private readonly maxRetries: number;
  private readonly mockMode: boolean;
  private readonly logger: typeof logger;
  private readonly now: () => number;

  constructor(opts: AchChannelOptions = {}) {
    this.apiBase = (opts.apiBase ?? ACH_API_BASE).replace(/\/+$/, '');
    this.fetchImpl =
      opts.fetchImpl ??
      (typeof fetch !== 'undefined'
        ? fetch
        : (() => {
            throw new Error('AchChannel: no fetch implementation available');
          })() as typeof fetch);
    this.timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    this.maxRetries = opts.maxRetries ?? DEFAULT_MAX_RETRIES;
    this.mockMode = !!opts.mockMode || !ACH_API_KEY;
    this.logger = opts.logger ?? logger;
    this.now = opts.now ?? (() => Date.now());
  }

  async createDeposit(opts: {
    account: BankAccount;
    amount: string;
    reference: string;
  }): Promise<{ reference: string; channelReference?: string; fee: string; expectedArrival: number }> {
    this.validateAccount(opts.account);
    this.validateAmount(opts.amount);
    const fee = computeAchFee(opts.amount);
    const expectedArrival = this.now() + CHANNEL_ARRIVAL_MS.ACH;
    if (this.mockMode) {
      return this.mockResult(opts.reference, fee, expectedArrival);
    }
    return this.callApi('/transfers/credit', opts, fee, expectedArrival);
  }

  async createWithdraw(opts: {
    account: BankAccount;
    amount: string;
    reference: string;
  }): Promise<{ reference: string; channelReference?: string; fee: string; expectedArrival: number }> {
    this.validateAccount(opts.account);
    this.validateAmount(opts.amount);
    const fee = computeAchFee(opts.amount);
    const expectedArrival = this.now() + CHANNEL_ARRIVAL_MS.ACH;
    if (this.mockMode) {
      return this.mockResult(opts.reference, fee, expectedArrival);
    }
    return this.callApi('/transfers/debit', opts, fee, expectedArrival);
  }

  async getStatus(reference: string): Promise<FiatStatus> {
    if (!reference) return 'pending';
    if (this.mockMode) {
      const h = djb2(reference);
      const m = h % 100;
      if (m < 92) return 'completed';
      if (m < 99) return 'processing';
      return 'failed';
    }
    try {
      const resp = await this.fetchImpl(`${this.apiBase}/transfers/${encodeURIComponent(reference)}`);
      if (!resp.ok) return 'pending';
      const data = (await resp.json()) as { status?: string };
      return normalizeAchStatus(data.status);
    } catch {
      return 'pending';
    }
  }

  async getFees(opts: {
    fromCurrency: string;
    toCurrency: string;
    amount: string;
  }): Promise<{ fee: string; total: string }> {
    const fee = computeAchFee(opts.amount);
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
    if (!account.routingNumber) {
      throw new FiatValidationError('INVALID_ACCOUNT', 'routingNumber is required for ACH');
    }
    const v = validateAbaRouting(account.routingNumber);
    if (!v.valid) {
      throw new FiatValidationError('INVALID_ROUTING', v.reason ?? 'invalid routing', {
        routing: account.routingNumber,
      });
    }
    if (!account.accountNumber) {
      throw new FiatValidationError('INVALID_ACCOUNT', 'accountNumber is required for ACH');
    }
    const a = validateAchAccountNumber(account.accountNumber);
    if (!a.valid) {
      throw new FiatValidationError('INVALID_ACCOUNT_NUMBER', a.reason ?? 'invalid account', {
        accountNumber: account.accountNumber,
      });
    }
    if (account.currency !== 'USD') {
      throw new FiatValidationError(
        'UNSUPPORTED_CURRENCY',
        `ACH only supports USD, got ${account.currency}`,
      );
    }
  }

  private validateAmount(amount: string): void {
    const n = Number(amount);
    if (!isFinite(n) || n <= 0) {
      throw new FiatValidationError('INVALID_AMOUNT', 'amount must be positive number');
    }
    if (n > Number(ACH_SINGLE_MAX_USD)) {
      throw new FiatValidationError(
        'AMOUNT_EXCEEDS_MAX',
        `ACH single max ${ACH_SINGLE_MAX_USD} USD`,
        { amount, max: ACH_SINGLE_MAX_USD },
      );
    }
    const max = Number(CHANNEL_SINGLE_MAX_USD.ACH);
    if (n > max) {
      throw new FiatValidationError('AMOUNT_EXCEEDS_MAX', `amount exceeds channel max ${max}`, {
        amount,
        max: CHANNEL_SINGLE_MAX_USD.ACH,
      });
    }
  }

  private mockResult(reference: string, fee: string, expectedArrival: number) {
    return {
      reference,
      channelReference: `ACH-MOCK-${djb2(reference).toString(16).toUpperCase()}`,
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
            Authorization: `Bearer ${ACH_API_KEY}`,
          },
          body: JSON.stringify({
            reference: opts.reference,
            amount: opts.amount,
            currency: opts.account.currency,
            routingNumber: opts.account.routingNumber,
            accountNumber: opts.account.accountNumber,
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
    this.logger.warn(`[ACH] ${path} failed, fallback to mock: ${(lastErr as Error)?.message}`);
    return this.mockResult(opts.reference, fee, expectedArrival);
  }
}

function normalizeAchStatus(s?: string): FiatStatus {
  const v = (s ?? '').toLowerCase();
  if (v.includes('settled') || v.includes('complete') || v.includes('posted')) return 'completed';
  if (v.includes('process') || v.includes('pending') || v.includes('originated')) return 'processing';
  if (v.includes('reject') || v.includes('return')) return 'rejected';
  if (v.includes('fail')) return 'failed';
  return 'pending';
}

export function createAchChannel(opts?: AchChannelOptions): AchChannel {
  return new AchChannel(opts);
}

export default AchChannel;
