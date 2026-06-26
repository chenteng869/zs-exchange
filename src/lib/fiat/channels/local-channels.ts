/**
 * 本地支付通道 (P2 Fiat)
 *
 * 包含 3 个即时支付通道：
 *  - FpsChannel   UK Faster Payments (5s)
 *  - PixChannel   Brazil PIX (10s)
 *  - UpiChannel   India UPI (15s)
 *
 * 演示降级：API Key 缺失时返回稳定 mock 数据。
 *
 * 用法：
 *   const fps = new FpsChannel();
 *   const pix = new PixChannel();
 *   const upi = new UpiChannel();
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
// 通用接口
// =============================================================================

export interface LocalChannelOptions {
  apiBase?: string;
  apiKey?: string;
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
  maxRetries?: number;
  mockMode?: boolean;
  logger?: typeof logger;
  now?: () => number;
}

// =============================================================================
// UK Sort Code 校验
// =============================================================================

/**
 * UK Sort Code 校验
 *  - 6 位数字
 *  - 形如 12-34-56 或 123456
 */
export function validateSortCode(code: string): { valid: boolean; reason?: string } {
  if (!code) return { valid: false, reason: 'sort code is required' };
  const c = code.replace(/[-\s]/g, '');
  if (!/^\d{6}$/.test(c)) {
    return { valid: false, reason: 'sort code must be 6 digits' };
  }
  return { valid: true };
}

/** UK 账号校验（8 位数字） */
export function validateUkAccountNumber(account: string): { valid: boolean; reason?: string } {
  if (!account) return { valid: false, reason: 'account number is required' };
  const a = account.replace(/[-\s]/g, '');
  if (!/^\d{8}$/.test(a)) {
    return { valid: false, reason: 'UK account number must be 8 digits' };
  }
  return { valid: true };
}

// =============================================================================
// FpsChannel
// =============================================================================

const FPS_API_BASE = 'https://api.faster-payments.example';
const FPS_API_KEY =
  (typeof process !== 'undefined' && process.env?.FPS_API_KEY) || '';

const FPS_FEE_FIXED = '0.2';
const FPS_FEE_RATE = 0.0001;          // 0.01%
const FPS_FEE_MIN = '0.2';
const FPS_FEE_MAX = '2';
const FPS_SINGLE_MAX_GBP = '100000';

function computeFpsFee(amount: string): string {
  const n = Number(amount);
  if (!isFinite(n) || n <= 0) return '0';
  let fee = n * FPS_FEE_RATE + Number(FPS_FEE_FIXED);
  if (fee < Number(FPS_FEE_MIN)) fee = Number(FPS_FEE_MIN);
  if (fee > Number(FPS_FEE_MAX)) fee = Number(FPS_FEE_MAX);
  return fee.toFixed(2);
}

export class FpsChannel implements FiatChannelAdapter {
  public readonly channel = 'FPS' as const;
  private readonly apiBase: string;
  private readonly apiKey: string;
  private readonly fetchImpl: typeof fetch;
  private readonly timeoutMs: number;
  private readonly maxRetries: number;
  private readonly mockMode: boolean;
  private readonly logger: typeof logger;
  private readonly now: () => number;

  constructor(opts: LocalChannelOptions = {}) {
    this.apiBase = (opts.apiBase ?? FPS_API_BASE).replace(/\/+$/, '');
    this.apiKey = opts.apiKey ?? FPS_API_KEY;
    this.fetchImpl =
      opts.fetchImpl ??
      (typeof fetch !== 'undefined'
        ? fetch
        : (() => {
            throw new Error('FpsChannel: no fetch implementation available');
          })() as typeof fetch);
    this.timeoutMs = opts.timeoutMs ?? 4_000;
    this.maxRetries = opts.maxRetries ?? 1;
    this.mockMode = !!opts.mockMode || !this.apiKey;
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
    const fee = computeFpsFee(opts.amount);
    const expectedArrival = this.now() + CHANNEL_ARRIVAL_MS.FPS;
    if (this.mockMode) {
      return this.mockResult(opts.reference, fee, expectedArrival);
    }
    return this.callApi('/payments/incoming', opts, fee, expectedArrival);
  }

  async createWithdraw(opts: {
    account: BankAccount;
    amount: string;
    reference: string;
  }): Promise<{ reference: string; channelReference?: string; fee: string; expectedArrival: number }> {
    this.validateAccount(opts.account);
    this.validateAmount(opts.amount);
    const fee = computeFpsFee(opts.amount);
    const expectedArrival = this.now() + CHANNEL_ARRIVAL_MS.FPS;
    if (this.mockMode) {
      return this.mockResult(opts.reference, fee, expectedArrival);
    }
    return this.callApi('/payments/outgoing', opts, fee, expectedArrival);
  }

  async getStatus(reference: string): Promise<FiatStatus> {
    if (!reference) return 'pending';
    if (this.mockMode) {
      const h = djb2(reference);
      // FPS 90% 概率即时到账
      const m = h % 100;
      if (m < 90) return 'completed';
      if (m < 99) return 'processing';
      return 'failed';
    }
    try {
      const resp = await this.fetchImpl(`${this.apiBase}/payments/${encodeURIComponent(reference)}`);
      if (!resp.ok) return 'pending';
      const data = (await resp.json()) as { status?: string };
      return normalizeLocalStatus(data.status);
    } catch {
      return 'pending';
    }
  }

  async getFees(opts: {
    fromCurrency: string;
    toCurrency: string;
    amount: string;
  }): Promise<{ fee: string; total: string }> {
    const fee = computeFpsFee(opts.amount);
    const total = (Number(opts.amount) + Number(fee)).toFixed(2);
    return { fee, total };
  }

  // -------------------------------------------------------------------------

  private validateAccount(account: BankAccount): void {
    if (!account.holderName) {
      throw new FiatValidationError('INVALID_ACCOUNT', 'holderName is required');
    }
    if (!account.sortCode) {
      throw new FiatValidationError('INVALID_ACCOUNT', 'sortCode is required for FPS');
    }
    const v = validateSortCode(account.sortCode);
    if (!v.valid) {
      throw new FiatValidationError('INVALID_SORT_CODE', v.reason ?? 'invalid sort code', {
        sortCode: account.sortCode,
      });
    }
    if (!account.accountNumber) {
      throw new FiatValidationError('INVALID_ACCOUNT', 'accountNumber is required for FPS');
    }
    const a = validateUkAccountNumber(account.accountNumber);
    if (!a.valid) {
      throw new FiatValidationError('INVALID_ACCOUNT_NUMBER', a.reason ?? 'invalid account', {
        accountNumber: account.accountNumber,
      });
    }
    if (account.currency !== 'GBP') {
      throw new FiatValidationError(
        'UNSUPPORTED_CURRENCY',
        `FPS only supports GBP, got ${account.currency}`,
      );
    }
  }

  private validateAmount(amount: string): void {
    const n = Number(amount);
    if (!isFinite(n) || n <= 0) {
      throw new FiatValidationError('INVALID_AMOUNT', 'amount must be positive number');
    }
    if (n > Number(FPS_SINGLE_MAX_GBP)) {
      throw new FiatValidationError(
        'AMOUNT_EXCEEDS_MAX',
        `FPS single max ${FPS_SINGLE_MAX_GBP} GBP`,
        { amount, max: FPS_SINGLE_MAX_GBP },
      );
    }
    const max = Number(CHANNEL_SINGLE_MAX_USD.FPS);
    if (n > max * 1.3) {
      throw new FiatValidationError('AMOUNT_EXCEEDS_MAX', `amount exceeds channel max ${max}`, {
        amount,
        max: CHANNEL_SINGLE_MAX_USD.FPS,
      });
    }
  }

  private mockResult(reference: string, fee: string, expectedArrival: number) {
    return {
      reference,
      channelReference: `FPS-MOCK-${djb2(reference).toString(16).toUpperCase()}`,
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
            Authorization: `Bearer ${this.apiKey}`,
          },
          body: JSON.stringify({
            reference: opts.reference,
            amount: opts.amount,
            currency: opts.account.currency,
            sortCode: opts.account.sortCode,
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
          await new Promise((r) => setTimeout(r, 100));
          continue;
        }
      }
    }
    this.logger.warn(`[FPS] ${path} failed, fallback to mock: ${(lastErr as Error)?.message}`);
    return this.mockResult(opts.reference, fee, expectedArrival);
  }
}

// =============================================================================
// Brazil PIX 校验
// =============================================================================

/**
 * PIX Key 校验
 *  - CPF: 11 位数字
 *  - CNPJ: 14 位数字
 *  - Email: 标准 email
 *  - Phone: +55 11 9XXXX-XXXX
 *  - Random: 32 字符 hex
 */
export function validatePixKey(key: string): { valid: boolean; reason?: string; type?: string } {
  if (!key) return { valid: false, reason: 'PIX key is required' };
  const k = key.trim();
  // CPF
  if (/^\d{11}$/.test(k)) {
    if (validateCpfDigits(k)) return { valid: true, type: 'CPF' };
    return { valid: false, reason: 'CPF check digits invalid' };
  }
  // CNPJ
  if (/^\d{14}$/.test(k)) {
    if (validateCnpjDigits(k)) return { valid: true, type: 'CNPJ' };
    return { valid: false, reason: 'CNPJ check digits invalid' };
  }
  // Email
  if (/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(k)) {
    return { valid: true, type: 'EMAIL' };
  }
  // Phone
  if (/^\+55\d{10,11}$/.test(k.replace(/[\s-]/g, ''))) {
    return { valid: true, type: 'PHONE' };
  }
  // Random
  if (/^[a-zA-Z0-9-]{32,36}$/.test(k)) {
    return { valid: true, type: 'RANDOM' };
  }
  return { valid: false, reason: 'PIX key format invalid' };
}

/** CPF 校验位 */
function validateCpfDigits(cpf: string): boolean {
  if (/^(\d)\1{10}$/.test(cpf)) return false;
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += Number(cpf.charAt(i)) * (10 - i);
  let r = (sum * 10) % 11;
  if (r === 10) r = 0;
  if (r !== Number(cpf.charAt(9))) return false;
  sum = 0;
  for (let i = 0; i < 10; i++) sum += Number(cpf.charAt(i)) * (11 - i);
  r = (sum * 10) % 11;
  if (r === 10) r = 0;
  return r === Number(cpf.charAt(10));
}

/** CNPJ 校验位 */
function validateCnpjDigits(cnpj: string): boolean {
  if (/^(\d)\1{13}$/.test(cnpj)) return false;
  const w1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const w2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  let s = 0;
  for (let i = 0; i < 12; i++) s += Number(cnpj.charAt(i)) * w1[i];
  let r = s % 11;
  const d1 = r < 2 ? 0 : 11 - r;
  if (d1 !== Number(cnpj.charAt(12))) return false;
  s = 0;
  for (let i = 0; i < 13; i++) s += Number(cnpj.charAt(i)) * w2[i];
  r = s % 11;
  const d2 = r < 2 ? 0 : 11 - r;
  return d2 === Number(cnpj.charAt(13));
}

// =============================================================================
// PixChannel
// =============================================================================

const PIX_API_BASE = 'https://api.pix.example';
const PIX_API_KEY =
  (typeof process !== 'undefined' && process.env?.PIX_API_KEY) || '';

const PIX_FEE_FIXED = '0.5';
const PIX_FEE_RATE = 0.0005;          // 0.05%
const PIX_FEE_MIN = '0.5';
const PIX_FEE_MAX = '5';
const PIX_SINGLE_MAX_BRL = '50000';

function computePixFee(amount: string): string {
  const n = Number(amount);
  if (!isFinite(n) || n <= 0) return '0';
  let fee = n * PIX_FEE_RATE + Number(PIX_FEE_FIXED);
  if (fee < Number(PIX_FEE_MIN)) fee = Number(PIX_FEE_MIN);
  if (fee > Number(PIX_FEE_MAX)) fee = Number(PIX_FEE_MAX);
  return fee.toFixed(2);
}

export class PixChannel implements FiatChannelAdapter {
  public readonly channel = 'PIX' as const;
  private readonly apiBase: string;
  private readonly apiKey: string;
  private readonly fetchImpl: typeof fetch;
  private readonly timeoutMs: number;
  private readonly maxRetries: number;
  private readonly mockMode: boolean;
  private readonly logger: typeof logger;
  private readonly now: () => number;

  constructor(opts: LocalChannelOptions = {}) {
    this.apiBase = (opts.apiBase ?? PIX_API_BASE).replace(/\/+$/, '');
    this.apiKey = opts.apiKey ?? PIX_API_KEY;
    this.fetchImpl =
      opts.fetchImpl ??
      (typeof fetch !== 'undefined'
        ? fetch
        : (() => {
            throw new Error('PixChannel: no fetch implementation available');
          })() as typeof fetch);
    this.timeoutMs = opts.timeoutMs ?? 4_000;
    this.maxRetries = opts.maxRetries ?? 1;
    this.mockMode = !!opts.mockMode || !this.apiKey;
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
    const fee = computePixFee(opts.amount);
    const expectedArrival = this.now() + CHANNEL_ARRIVAL_MS.PIX;
    if (this.mockMode) {
      return this.mockResult(opts.reference, fee, expectedArrival);
    }
    return this.callApi('/pix/receive', opts, fee, expectedArrival);
  }

  async createWithdraw(opts: {
    account: BankAccount;
    amount: string;
    reference: string;
  }): Promise<{ reference: string; channelReference?: string; fee: string; expectedArrival: number }> {
    this.validateAccount(opts.account);
    this.validateAmount(opts.amount);
    const fee = computePixFee(opts.amount);
    const expectedArrival = this.now() + CHANNEL_ARRIVAL_MS.PIX;
    if (this.mockMode) {
      return this.mockResult(opts.reference, fee, expectedArrival);
    }
    return this.callApi('/pix/send', opts, fee, expectedArrival);
  }

  async getStatus(reference: string): Promise<FiatStatus> {
    if (!reference) return 'pending';
    if (this.mockMode) {
      const h = djb2(reference);
      const m = h % 100;
      if (m < 93) return 'completed';
      if (m < 99) return 'processing';
      return 'failed';
    }
    try {
      const resp = await this.fetchImpl(`${this.apiBase}/pix/${encodeURIComponent(reference)}`);
      if (!resp.ok) return 'pending';
      const data = (await resp.json()) as { status?: string };
      return normalizeLocalStatus(data.status);
    } catch {
      return 'pending';
    }
  }

  async getFees(opts: {
    fromCurrency: string;
    toCurrency: string;
    amount: string;
  }): Promise<{ fee: string; total: string }> {
    const fee = computePixFee(opts.amount);
    const total = (Number(opts.amount) + Number(fee)).toFixed(2);
    return { fee, total };
  }

  // -------------------------------------------------------------------------

  private validateAccount(account: BankAccount): void {
    if (!account.holderName) {
      throw new FiatValidationError('INVALID_ACCOUNT', 'holderName is required');
    }
    if (!account.pix) {
      throw new FiatValidationError('INVALID_ACCOUNT', 'PIX key is required');
    }
    const v = validatePixKey(account.pix);
    if (!v.valid) {
      throw new FiatValidationError('INVALID_PIX', v.reason ?? 'invalid PIX key', { pix: account.pix });
    }
    if (account.currency !== 'BRL') {
      throw new FiatValidationError(
        'UNSUPPORTED_CURRENCY',
        `PIX only supports BRL, got ${account.currency}`,
      );
    }
  }

  private validateAmount(amount: string): void {
    const n = Number(amount);
    if (!isFinite(n) || n <= 0) {
      throw new FiatValidationError('INVALID_AMOUNT', 'amount must be positive number');
    }
    if (n > Number(PIX_SINGLE_MAX_BRL)) {
      throw new FiatValidationError(
        'AMOUNT_EXCEEDS_MAX',
        `PIX single max ${PIX_SINGLE_MAX_BRL} BRL`,
        { amount, max: PIX_SINGLE_MAX_BRL },
      );
    }
    const max = Number(CHANNEL_SINGLE_MAX_USD.PIX);
    if (n > max * 5) {
      throw new FiatValidationError('AMOUNT_EXCEEDS_MAX', `amount exceeds channel max ${max}`, {
        amount,
        max: CHANNEL_SINGLE_MAX_USD.PIX,
      });
    }
  }

  private mockResult(reference: string, fee: string, expectedArrival: number) {
    return {
      reference,
      channelReference: `PIX-MOCK-${djb2(reference).toString(16).toUpperCase()}`,
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
            Authorization: `Bearer ${this.apiKey}`,
          },
          body: JSON.stringify({
            reference: opts.reference,
            amount: opts.amount,
            currency: opts.account.currency,
            pixKey: opts.account.pix,
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
          await new Promise((r) => setTimeout(r, 100));
          continue;
        }
      }
    }
    this.logger.warn(`[PIX] ${path} failed, fallback to mock: ${(lastErr as Error)?.message}`);
    return this.mockResult(opts.reference, fee, expectedArrival);
  }
}

// =============================================================================
// India UPI 校验
// =============================================================================

/**
 * UPI VPA 校验
 *  - 形如 username@bankhandle
 *  - bankhandle 常见后缀：okicici/oksbi/okaxis/okhdfcbank/paytm/ybl/ibl
 */
export function validateUpiVpa(vpa: string): { valid: boolean; reason?: string; handle?: string } {
  if (!vpa) return { valid: false, reason: 'UPI VPA is required' };
  const v = vpa.trim().toLowerCase();
  if (!/^[a-z0-9._-]{3,50}@[a-z]{2,20}$/.test(v)) {
    return { valid: false, reason: 'UPI VPA format invalid (expect user@handle)' };
  }
  const handle = v.split('@')[1];
  return { valid: true, handle };
}

/** 校验 IFSC（11 位：4 字母银行 + 0 + 6 位分支） */
export function validateIfsc(ifsc: string): { valid: boolean; reason?: string } {
  if (!ifsc) return { valid: false, reason: 'IFSC is required' };
  const v = ifsc.toUpperCase();
  if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(v)) {
    return { valid: false, reason: 'IFSC format invalid (4 letters + 0 + 6 alphanumeric)' };
  }
  return { valid: true };
}

// =============================================================================
// UpiChannel
// =============================================================================

const UPI_API_BASE = 'https://api.upi.example';
const UPI_API_KEY =
  (typeof process !== 'undefined' && process.env?.UPI_API_KEY) || '';

const UPI_FEE_FIXED = '5';
const UPI_FEE_RATE = 0.002;
const UPI_FEE_MIN = '5';
const UPI_FEE_MAX = '20';
const UPI_SINGLE_MAX_INR = '100000';

function computeUpiFee(amount: string): string {
  const n = Number(amount);
  if (!isFinite(n) || n <= 0) return '0';
  let fee = n * UPI_FEE_RATE + Number(UPI_FEE_FIXED);
  if (fee < Number(UPI_FEE_MIN)) fee = Number(UPI_FEE_MIN);
  if (fee > Number(UPI_FEE_MAX)) fee = Number(UPI_FEE_MAX);
  return fee.toFixed(2);
}

export class UpiChannel implements FiatChannelAdapter {
  public readonly channel = 'UPI' as const;
  private readonly apiBase: string;
  private readonly apiKey: string;
  private readonly fetchImpl: typeof fetch;
  private readonly timeoutMs: number;
  private readonly maxRetries: number;
  private readonly mockMode: boolean;
  private readonly logger: typeof logger;
  private readonly now: () => number;

  constructor(opts: LocalChannelOptions = {}) {
    this.apiBase = (opts.apiBase ?? UPI_API_BASE).replace(/\/+$/, '');
    this.apiKey = opts.apiKey ?? UPI_API_KEY;
    this.fetchImpl =
      opts.fetchImpl ??
      (typeof fetch !== 'undefined'
        ? fetch
        : (() => {
            throw new Error('UpiChannel: no fetch implementation available');
          })() as typeof fetch);
    this.timeoutMs = opts.timeoutMs ?? 4_000;
    this.maxRetries = opts.maxRetries ?? 1;
    this.mockMode = !!opts.mockMode || !this.apiKey;
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
    const fee = computeUpiFee(opts.amount);
    const expectedArrival = this.now() + CHANNEL_ARRIVAL_MS.UPI;
    if (this.mockMode) {
      return this.mockResult(opts.reference, fee, expectedArrival);
    }
    return this.callApi('/collect', opts, fee, expectedArrival);
  }

  async createWithdraw(opts: {
    account: BankAccount;
    amount: string;
    reference: string;
  }): Promise<{ reference: string; channelReference?: string; fee: string; expectedArrival: number }> {
    this.validateAccount(opts.account);
    this.validateAmount(opts.amount);
    const fee = computeUpiFee(opts.amount);
    const expectedArrival = this.now() + CHANNEL_ARRIVAL_MS.UPI;
    if (this.mockMode) {
      return this.mockResult(opts.reference, fee, expectedArrival);
    }
    return this.callApi('/pay', opts, fee, expectedArrival);
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
      const resp = await this.fetchImpl(`${this.apiBase}/txn/${encodeURIComponent(reference)}`);
      if (!resp.ok) return 'pending';
      const data = (await resp.json()) as { status?: string };
      return normalizeLocalStatus(data.status);
    } catch {
      return 'pending';
    }
  }

  async getFees(opts: {
    fromCurrency: string;
    toCurrency: string;
    amount: string;
  }): Promise<{ fee: string; total: string }> {
    const fee = computeUpiFee(opts.amount);
    const total = (Number(opts.amount) + Number(fee)).toFixed(2);
    return { fee, total };
  }

  // -------------------------------------------------------------------------

  private validateAccount(account: BankAccount): void {
    if (!account.holderName) {
      throw new FiatValidationError('INVALID_ACCOUNT', 'holderName is required');
    }
    if (!account.vpa) {
      throw new FiatValidationError('INVALID_ACCOUNT', 'UPI VPA is required');
    }
    const v = validateUpiVpa(account.vpa);
    if (!v.valid) {
      throw new FiatValidationError('INVALID_VPA', v.reason ?? 'invalid VPA', { vpa: account.vpa });
    }
    if (account.ifsc) {
      const f = validateIfsc(account.ifsc);
      if (!f.valid) {
        throw new FiatValidationError('INVALID_IFSC', f.reason ?? 'invalid IFSC', { ifsc: account.ifsc });
      }
    }
    if (account.currency !== 'INR') {
      throw new FiatValidationError(
        'UNSUPPORTED_CURRENCY',
        `UPI only supports INR, got ${account.currency}`,
      );
    }
  }

  private validateAmount(amount: string): void {
    const n = Number(amount);
    if (!isFinite(n) || n <= 0) {
      throw new FiatValidationError('INVALID_AMOUNT', 'amount must be positive number');
    }
    if (n > Number(UPI_SINGLE_MAX_INR)) {
      throw new FiatValidationError(
        'AMOUNT_EXCEEDS_MAX',
        `UPI single max ${UPI_SINGLE_MAX_INR} INR`,
        { amount, max: UPI_SINGLE_MAX_INR },
      );
    }
    const max = Number(CHANNEL_SINGLE_MAX_USD.UPI);
    if (n > max * 8) {
      // INR ≈ 1/83 USD
      throw new FiatValidationError('AMOUNT_EXCEEDS_MAX', `amount exceeds channel max ${max}`, {
        amount,
        max: CHANNEL_SINGLE_MAX_USD.UPI,
      });
    }
  }

  private mockResult(reference: string, fee: string, expectedArrival: number) {
    return {
      reference,
      channelReference: `UPI-MOCK-${djb2(reference).toString(16).toUpperCase()}`,
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
            Authorization: `Bearer ${this.apiKey}`,
          },
          body: JSON.stringify({
            reference: opts.reference,
            amount: opts.amount,
            currency: opts.account.currency,
            vpa: opts.account.vpa,
            ifsc: opts.account.ifsc,
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
          await new Promise((r) => setTimeout(r, 100));
          continue;
        }
      }
    }
    this.logger.warn(`[UPI] ${path} failed, fallback to mock: ${(lastErr as Error)?.message}`);
    return this.mockResult(opts.reference, fee, expectedArrival);
  }
}

function normalizeLocalStatus(s?: string): FiatStatus {
  const v = (s ?? '').toLowerCase();
  if (v.includes('success') || v.includes('complete') || v.includes('settled')) return 'completed';
  if (v.includes('process') || v.includes('pending') || v.includes('submitted')) return 'processing';
  if (v.includes('reject')) return 'rejected';
  if (v.includes('refund') || v.includes('return')) return 'refunded';
  if (v.includes('fail') || v.includes('declin')) return 'failed';
  return 'pending';
}

export function createFpsChannel(opts?: LocalChannelOptions): FpsChannel {
  return new FpsChannel(opts);
}
export function createPixChannel(opts?: LocalChannelOptions): PixChannel {
  return new PixChannel(opts);
}
export function createUpiChannel(opts?: LocalChannelOptions): UpiChannel {
  return new UpiChannel(opts);
}
