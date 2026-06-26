/**
 * SWIFT 国际电汇通道 (P2 Fiat)
 *
 * 职责：
 *  - 封装 SWIFT 网络的电汇出入金
 *  - 1-3 个工作日到账
 *  - 演示降级：API Key 缺失时返回稳定 mock 数据
 *  - 提供 IBAN/SWIFT 校验
 *
 * 用法：
 *   const channel = new SwiftChannel();
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

const SWIFT_API_BASE = 'https://api.swift-network.example';
const SWIFT_API_KEY =
  (typeof process !== 'undefined' && process.env?.SWIFT_API_KEY) || '';

const DEFAULT_TIMEOUT_MS = 8_000;
const DEFAULT_MAX_RETRIES = 2;

const SWIFT_FEE_FIXED = '25';          // 25 USD/笔
const SWIFT_FEE_RATE = 0.001;          // 0.1%
const SWIFT_FEE_MIN = '25';
const SWIFT_FEE_MAX = '150';

// =============================================================================
// 校验工具
// =============================================================================

/** 校验 SWIFT/BIC（8 或 11 位，AAAA BB CC XXX 格式） */
export function validateSwift(code: string): { valid: boolean; reason?: string } {
  if (!code) return { valid: false, reason: 'SWIFT/BIC is required' };
  const c = code.toUpperCase().replace(/\s/g, '');
  if (!/^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}([A-Z0-9]{3})?$/.test(c)) {
    return { valid: false, reason: 'invalid SWIFT/BIC format' };
  }
  return { valid: true };
}

/** 计算 SWIFT 手续费 */
function computeSwiftFee(amount: string): string {
  const n = Number(amount);
  if (!isFinite(n) || n <= 0) return '0';
  let fee = n * SWIFT_FEE_RATE + Number(SWIFT_FEE_FIXED);
  if (fee < Number(SWIFT_FEE_MIN)) fee = Number(SWIFT_FEE_MIN);
  if (fee > Number(SWIFT_FEE_MAX)) fee = Number(SWIFT_FEE_MAX);
  return fee.toFixed(2);
}

// =============================================================================
// SwiftChannel
// =============================================================================

export interface SwiftChannelOptions {
  apiBase?: string;
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
  maxRetries?: number;
  mockMode?: boolean;
  logger?: typeof logger;
  now?: () => number;
}

export class SwiftChannel implements FiatChannelAdapter {
  public readonly channel = 'SWIFT' as const;
  private readonly apiBase: string;
  private readonly fetchImpl: typeof fetch;
  private readonly timeoutMs: number;
  private readonly maxRetries: number;
  private readonly mockMode: boolean;
  private readonly logger: typeof logger;
  private readonly now: () => number;

  constructor(opts: SwiftChannelOptions = {}) {
    this.apiBase = (opts.apiBase ?? SWIFT_API_BASE).replace(/\/+$/, '');
    this.fetchImpl =
      opts.fetchImpl ??
      (typeof fetch !== 'undefined'
        ? fetch
        : (() => {
            throw new Error('SwiftChannel: no fetch implementation available');
          })() as typeof fetch);
    this.timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    this.maxRetries = opts.maxRetries ?? DEFAULT_MAX_RETRIES;
    this.mockMode = !!opts.mockMode || !SWIFT_API_KEY;
    this.logger = opts.logger ?? logger;
    this.now = opts.now ?? (() => Date.now());
  }

  // -------------------------------------------------------------------------
  // 公共 API
  // -------------------------------------------------------------------------

  /**
   * 创建入金（银行 → 平台）
   *  1. 校验账户 country / currency / swift
   *  2. mock：返回稳定 reference
   *  3. 真实：调用 SWIFT API
   */
  async createDeposit(opts: {
    account: BankAccount;
    amount: string;
    reference: string;
  }): Promise<{ reference: string; channelReference?: string; fee: string; expectedArrival: number }> {
    this.validateAccount(opts.account);
    this.validateAmount(opts.amount);
    const fee = computeSwiftFee(opts.amount);
    const expectedArrival = this.now() + CHANNEL_ARRIVAL_MS.SWIFT;

    if (this.mockMode) {
      const channelRef = `SWT-MOCK-${djb2(opts.reference).toString(16).toUpperCase()}`;
      return {
        reference: opts.reference,
        channelReference: channelRef,
        fee,
        expectedArrival,
      };
    }
    return this.callSwiftApi('/deposits', opts, fee, expectedArrival);
  }

  /** 创建出金（平台 → 银行） */
  async createWithdraw(opts: {
    account: BankAccount;
    amount: string;
    reference: string;
  }): Promise<{ reference: string; channelReference?: string; fee: string; expectedArrival: number }> {
    this.validateAccount(opts.account);
    this.validateAmount(opts.amount);
    const fee = computeSwiftFee(opts.amount);
    const expectedArrival = this.now() + CHANNEL_ARRIVAL_MS.SWIFT;

    if (this.mockMode) {
      const channelRef = `SWT-MOCK-${djb2(opts.reference).toString(16).toUpperCase()}`;
      return {
        reference: opts.reference,
        channelReference: channelRef,
        fee,
        expectedArrival,
      };
    }
    return this.callSwiftApi('/withdrawals', opts, fee, expectedArrival);
  }

  /** 查询状态（mock 模式：按 reference 稳定返回） */
  async getStatus(reference: string): Promise<FiatStatus> {
    if (!reference) return 'pending';
    if (this.mockMode) {
      const h = djb2(reference);
      // 90% 完成 / 7% 处理中 / 2% 失败 / 1% 已退款
      const m = h % 100;
      if (m < 90) return 'completed';
      if (m < 97) return 'processing';
      if (m < 99) return 'failed';
      return 'refunded';
    }
    // 真实 API
    try {
      const url = `${this.apiBase}/transfers/${encodeURIComponent(reference)}`;
      const resp = await this.fetchImpl(url);
      if (!resp.ok) return 'pending';
      const data = (await resp.json()) as { status?: string };
      return normalizeSwiftStatus(data.status);
    } catch {
      return 'pending';
    }
  }

  /** 计算手续费 */
  async getFees(opts: {
    fromCurrency: string;
    toCurrency: string;
    amount: string;
  }): Promise<{ fee: string; total: string }> {
    const fee = computeSwiftFee(opts.amount);
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
    if (!account.swift) {
      throw new FiatValidationError('INVALID_ACCOUNT', 'SWIFT/BIC is required for SWIFT channel');
    }
    const v = validateSwift(account.swift);
    if (!v.valid) {
      throw new FiatValidationError('INVALID_SWIFT', v.reason ?? 'invalid SWIFT', { swift: account.swift });
    }
    if (account.iban) {
      // 简单 IBAN 长度校验
      if (account.iban.length < 15 || account.iban.length > 34) {
        throw new FiatValidationError('INVALID_IBAN', 'invalid IBAN length', { iban: account.iban });
      }
    }
  }

  private validateAmount(amount: string): void {
    const n = Number(amount);
    if (!isFinite(n) || n <= 0) {
      throw new FiatValidationError('INVALID_AMOUNT', 'amount must be positive number');
    }
    const max = Number(CHANNEL_SINGLE_MAX_USD.SWIFT);
    if (n > max) {
      throw new FiatValidationError('AMOUNT_EXCEEDS_MAX', `amount exceeds channel max ${max}`, {
        amount,
        max: CHANNEL_SINGLE_MAX_USD.SWIFT,
      });
    }
  }

  private async callSwiftApi(
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
            Authorization: `Bearer ${SWIFT_API_KEY}`,
          },
          body: JSON.stringify({
            reference: opts.reference,
            amount: opts.amount,
            swift: opts.account.swift,
            iban: opts.account.iban,
            holder: opts.account.holderName,
            currency: opts.account.currency,
          }),
          signal: controller.signal,
        });
        clearTimeout(timer);
        if (!resp.ok) {
          throw new Error(`HTTP ${resp.status}`);
        }
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
          const backoff = Math.min(2000, 200 * 2 ** attempt);
          await new Promise((r) => setTimeout(r, backoff));
          continue;
        }
      }
    }
    // 降级到 mock
    this.logger.warn(`[Swift] ${path} failed, fallback to mock: ${(lastErr as Error)?.message}`);
    const channelRef = `SWT-MOCK-${djb2(opts.reference).toString(16).toUpperCase()}`;
    return {
      reference: opts.reference,
      channelReference: channelRef,
      fee,
      expectedArrival,
    };
  }
}

function normalizeSwiftStatus(s?: string): FiatStatus {
  const v = (s ?? '').toLowerCase();
  if (v.includes('complete') || v.includes('success') || v.includes('credited')) return 'completed';
  if (v.includes('process') || v.includes('pending') || v.includes('submitted')) return 'processing';
  if (v.includes('reject')) return 'rejected';
  if (v.includes('refund')) return 'refunded';
  if (v.includes('fail') || v.includes('cancel')) return 'failed';
  return 'pending';
}

export function createSwiftChannel(opts?: SwiftChannelOptions): SwiftChannel {
  return new SwiftChannel(opts);
}

export default SwiftChannel;
