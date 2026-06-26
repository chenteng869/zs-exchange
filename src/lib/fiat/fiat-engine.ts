/**
 * FiatEngine 业务层 (P2 Fiat)
 *
 * 职责：
 *  - 银行账户管理（CRUD + 验证）
 *  - 报价 / 交易（入金 / 出金）
 *  - 限额管理
 *  - AML/KYC 集成
 *  - 报表生成
 *
 * 集成：
 *  - CurrencyRegistry 汇率
 *  - AmlKycService 风控
 *  - 通道适配器（SWIFT/SEPA/ACH/FPS/PIX/UPI）
 *
 * 用法：
 *   const engine = new FiatEngine();
 *   await engine.addBankAccount(account);
 *   const tx = await engine.createDeposit({ userId, channel: 'ACH', fiatCurrency: 'USD', fiatAmount: '1000', bankAccountId });
 */

import { logger } from '../logger';
import { CurrencyRegistry, createCurrencyRegistry } from './currency-registry';
import { AmlKycService, type UserKycContext, createAmlKycService } from './aml-kyc';
import { SwiftChannel, createSwiftChannel } from './channels/swift';
import { SepaChannel, createSepaChannel } from './channels/sepa';
import { AchChannel, createAchChannel } from './channels/ach';
import { FpsChannel, PixChannel, UpiChannel, createFpsChannel, createPixChannel, createUpiChannel } from './channels/local-channels';
import {
  type BankAccount,
  type FiatChannel,
  type FiatChannelAdapter,
  type FiatCurrency,
  type FiatDirection,
  type FiatEvent,
  type FiatLimits,
  type FiatQuote,
  type FiatReport,
  type FiatStatus,
  type FiatTransaction,
  type KycTier,
  type UserTier,
  FiatError,
  FiatLimitError,
  FiatValidationError,
  KYC_LIMITS,
  QUOTE_EXPIRY_MS,
  SUPPORTED_FIAT_CURRENCIES,
  djb2,
  shortId,
} from './types';

// =============================================================================
// 用户 KYC / 限额存储（内存）
// =============================================================================

interface UserFiatState {
  userId: string;
  kycLevel: KycTier;
  tier: UserTier;
  fullName?: string;
  country?: string;
  kycExpiresAt?: number;
  bankAccounts: BankAccount[];
  transactions: FiatTransaction[];
  quotes: FiatQuote[];
  /** 累计额度（UTC ms 时间戳 → 金额） */
  dailyDeposit: { date: number; amount: string };
  dailyWithdraw: { date: number; amount: string };
  monthlyDeposit: { date: number; amount: string };
  monthlyWithdraw: { date: number; amount: string };
  yearlyDeposit: { date: number; amount: string };
  yearlyWithdraw: { date: number; amount: string };
}

// =============================================================================
// FiatEngine
// =============================================================================

export interface FiatEngineOptions {
  registry?: CurrencyRegistry;
  aml?: AmlKycService;
  channels?: Partial<Record<FiatChannel, FiatChannelAdapter>>;
  logger?: typeof logger;
  now?: () => number;
  /** 默认 KYC 等级（未设置时） */
  defaultKycLevel?: KycTier;
}

export class FiatEngine {
  private readonly registry: CurrencyRegistry;
  private readonly aml: AmlKycService;
  private readonly channels: Map<FiatChannel, FiatChannelAdapter>;
  private readonly logger: typeof logger;
  private readonly now: () => number;
  private readonly defaultKycLevel: KycTier;

  /** userId → state */
  private readonly users: Map<string, UserFiatState> = new Map();
  /** txId → transaction（全局） */
  private readonly txIndex: Map<string, FiatTransaction> = new Map();

  constructor(opts: FiatEngineOptions = {}) {
    this.registry = opts.registry ?? createCurrencyRegistry();
    this.aml = opts.aml ?? createAmlKycService();
    this.logger = opts.logger ?? logger;
    this.now = opts.now ?? (() => Date.now());
    this.defaultKycLevel = opts.defaultKycLevel ?? 'basic';

    this.channels = new Map();
    if (opts.channels) {
      for (const [k, v] of Object.entries(opts.channels)) {
        if (v) this.channels.set(k as FiatChannel, v);
      }
    }
    // 默认通道
    if (!this.channels.has('SWIFT')) this.channels.set('SWIFT', createSwiftChannel());
    if (!this.channels.has('SEPA')) this.channels.set('SEPA', createSepaChannel());
    if (!this.channels.has('ACH')) this.channels.set('ACH', createAchChannel());
    if (!this.channels.has('FPS')) this.channels.set('FPS', createFpsChannel());
    if (!this.channels.has('PIX')) this.channels.set('PIX', createPixChannel());
    if (!this.channels.has('UPI')) this.channels.set('UPI', createUpiChannel());
  }

  // -------------------------------------------------------------------------
  // 用户管理
  // -------------------------------------------------------------------------

  private ensureUser(userId: string): UserFiatState {
    let u = this.users.get(userId);
    if (!u) {
      u = {
        userId,
        kycLevel: this.defaultKycLevel,
        tier: 'starter',
        bankAccounts: [],
        transactions: [],
        quotes: [],
        dailyDeposit: { date: 0, amount: '0' },
        dailyWithdraw: { date: 0, amount: '0' },
        monthlyDeposit: { date: 0, amount: '0' },
        monthlyWithdraw: { date: 0, amount: '0' },
        yearlyDeposit: { date: 0, amount: '0' },
        yearlyWithdraw: { date: 0, amount: '0' },
      };
      this.users.set(userId, u);
    }
    return u;
  }

  /** 设置用户 KYC 等级 + 资料 */
  setUserProfile(
    userId: string,
    profile: {
      kycLevel?: KycTier;
      tier?: UserTier;
      fullName?: string;
      country?: string;
      kycExpiresAt?: number;
    },
  ): UserFiatState {
    const u = this.ensureUser(userId);
    if (profile.kycLevel) u.kycLevel = profile.kycLevel;
    if (profile.tier) u.tier = profile.tier;
    if (profile.fullName) u.fullName = profile.fullName;
    if (profile.country) u.country = profile.country;
    if (profile.kycExpiresAt !== undefined) u.kycExpiresAt = profile.kycExpiresAt;
    return u;
  }

  getUserProfile(userId: string): UserFiatState | null {
    return this.users.get(userId) ?? null;
  }

  // -------------------------------------------------------------------------
  // 银行账户管理
  // -------------------------------------------------------------------------

  /** 添加银行账户 */
  async addBankAccount(
    input: Omit<BankAccount, 'id' | 'isVerified' | 'verifiedAt' | 'isPrimary' | 'createdAt'>,
  ): Promise<BankAccount> {
    // 校验通道 + 币种
    if (!this.registry.isSupported(input.currency)) {
      throw new FiatValidationError('UNSUPPORTED_CURRENCY', `currency ${input.currency} not supported`);
    }
    if (!this.registry.isChannelSupported(input.currency, input.channel)) {
      throw new FiatValidationError(
        'UNSUPPORTED_CHANNEL',
        `channel ${input.channel} not supported for ${input.currency}`,
      );
    }
    if (!input.holderName) {
      throw new FiatValidationError('INVALID_ACCOUNT', 'holderName is required');
    }
    const u = this.ensureUser(input.userId);
    const account: BankAccount = {
      ...input,
      id: shortId('acct', `${input.userId}:${u.bankAccounts.length}:${this.now()}`),
      isVerified: false,
      isPrimary: u.bankAccounts.length === 0,
      createdAt: this.now(),
    };
    u.bankAccounts.push(account);
    this.logger.info(`[Fiat] bank account added: ${account.id} (${input.channel} ${input.currency})`);
    return account;
  }

  /**
   * 验证银行账户（小额打款 / 微额校验）
   *  - 模拟：向账户打 0.01-0.99 随机金额
   *  - 返回验证码（用户需回填）
   */
  async verifyBankAccount(
    accountId: string,
    options: { autoVerify?: boolean; code?: string } = {},
  ): Promise<BankAccount> {
    const account = this.findBankAccount(accountId);
    if (!account) {
      throw new FiatValidationError('ACCOUNT_NOT_FOUND', `account ${accountId} not found`);
    }
    if (account.isVerified) {
      return account;
    }
    if (!options.autoVerify) {
      if (!options.code) {
        // 生成小额打款验证码
        const code = ((djb2(accountId + this.now().toString()) % 99) + 1).toString().padStart(2, '0');
        this.logger.info(`[Fiat] verification code for ${accountId}: ${code}`);
        return account; // 仍返回未验证账户，前端展示 code
      }
      // 简单校验：code 必须是 2 位数字（演示）
      if (!/^\d{2}$/.test(options.code)) {
        throw new FiatValidationError('INVALID_CODE', 'verification code must be 2 digits');
      }
    }
    account.isVerified = true;
    account.verifiedAt = this.now();
    this.logger.info(`[Fiat] bank account verified: ${accountId}`);
    return account;
  }

  /** 删除银行账户 */
  removeBankAccount(accountId: string): boolean {
    for (const u of this.users.values()) {
      const idx = u.bankAccounts.findIndex((a) => a.id === accountId);
      if (idx >= 0) {
        const removed = u.bankAccounts.splice(idx, 1)[0];
        if (removed.isPrimary && u.bankAccounts.length > 0) {
          u.bankAccounts[0].isPrimary = true;
        }
        this.logger.info(`[Fiat] bank account removed: ${accountId}`);
        return true;
      }
    }
    return false;
  }

  /** 获取用户银行账户 */
  getUserBankAccounts(userId: string): BankAccount[] {
    return [...(this.users.get(userId)?.bankAccounts ?? [])];
  }

  /** 设置主账户 */
  setPrimaryAccount(userId: string, accountId: string): BankAccount {
    const u = this.users.get(userId);
    if (!u) throw new FiatValidationError('USER_NOT_FOUND', `user ${userId} not found`);
    for (const a of u.bankAccounts) {
      a.isPrimary = a.id === accountId;
    }
    return u.bankAccounts.find((a) => a.id === accountId)!;
  }

  private findBankAccount(accountId: string): BankAccount | null {
    for (const u of this.users.values()) {
      const a = u.bankAccounts.find((x) => x.id === accountId);
      if (a) return a;
    }
    return null;
  }

  // -------------------------------------------------------------------------
  // 报价
  // -------------------------------------------------------------------------

  /**
   * 获取法币 → 加密币的报价
   *  - 60s 过期
   *  - 含手续费
   */
  async getQuote(opts: {
    userId: string;
    channel: FiatChannel;
    fiatCurrency: string;
    cryptoAsset?: string;
    fiatAmount: string;
  }): Promise<FiatQuote> {
    if (!opts.userId) throw new FiatValidationError('USER_NOT_FOUND', 'userId is required');
    if (!opts.channel) throw new FiatValidationError('INVALID_CHANNEL', 'channel is required');
    if (!this.registry.isSupported(opts.fiatCurrency)) {
      throw new FiatValidationError('UNSUPPORTED_CURRENCY', `currency ${opts.fiatCurrency} not supported`);
    }
    const ccy = this.registry.getCurrency(opts.fiatCurrency)!;
    const channelCheck = this.registry.validateDepositAmount(opts.fiatCurrency, opts.fiatAmount);
    if (!channelCheck.valid) {
      throw new FiatValidationError('INVALID_AMOUNT', channelCheck.reason ?? 'amount invalid');
    }
    const channel = this.channels.get(opts.channel);
    if (!channel) {
      throw new FiatValidationError('UNSUPPORTED_CHANNEL', `channel ${opts.channel} not available`);
    }
    const feeInfo = await channel.getFees({
      fromCurrency: opts.fiatCurrency,
      toCurrency: opts.cryptoAsset ?? 'USDT',
      amount: opts.fiatAmount,
    });
    const rate = await this.registry.getRate(opts.fiatCurrency, opts.cryptoAsset ?? 'USDT');
    const netFiat = (Number(opts.fiatAmount) - Number(feeInfo.fee)).toFixed(ccy.decimals);
    const netCrypto = (Number(netFiat) * Number(rate)).toFixed(8);
    const quote: FiatQuote = {
      id: shortId('q', `${opts.userId}:${opts.channel}:${this.now()}:${Math.random()}`),
      channel: opts.channel,
      fiatCurrency: opts.fiatCurrency,
      cryptoAsset: opts.cryptoAsset ?? 'USDT',
      fiatAmount: opts.fiatAmount,
      exchangeRate: rate,
      fee: feeInfo.fee,
      netCryptoAmount: netCrypto,
      expiresAt: this.now() + QUOTE_EXPIRY_MS,
      createdAt: this.now(),
    };
    const u = this.ensureUser(opts.userId);
    u.quotes.push(quote);
    // 清理过期 quote
    this.cleanupQuotes(u);
    return quote;
  }

  /** 校验并获取 quote（按 id） */
  consumeQuote(userId: string, quoteId: string): FiatQuote {
    const u = this.users.get(userId);
    if (!u) throw new FiatValidationError('USER_NOT_FOUND', `user ${userId} not found`);
    const q = u.quotes.find((x) => x.id === quoteId);
    if (!q) throw new FiatValidationError('QUOTE_NOT_FOUND', `quote ${quoteId} not found`);
    if (q.expiresAt < this.now()) {
      throw new FiatValidationError('QUOTE_EXPIRED', 'quote has expired');
    }
    return q;
  }

  private cleanupQuotes(u: UserFiatState): void {
    const now = this.now();
    u.quotes = u.quotes.filter((q) => q.expiresAt > now);
  }

  // -------------------------------------------------------------------------
  // 交易
  // -------------------------------------------------------------------------

  /** 创建入金 */
  async createDeposit(opts: {
    userId: string;
    channel: FiatChannel;
    fiatCurrency: string;
    fiatAmount: string;
    bankAccountId: string;
    quoteId?: string;
    cryptoAsset?: string;
    ipCountry?: string;
  }): Promise<FiatTransaction> {
    return this.createTransaction('deposit', opts);
  }

  /** 创建出金 */
  async createWithdraw(opts: {
    userId: string;
    channel: FiatChannel;
    fiatCurrency: string;
    fiatAmount: string;
    bankAccountId: string;
    quoteId?: string;
    ipCountry?: string;
  }): Promise<FiatTransaction> {
    return this.createTransaction('withdraw', opts);
  }

  private async createTransaction(
    direction: FiatDirection,
    opts: {
      userId: string;
      channel: FiatChannel;
      fiatCurrency: string;
      fiatAmount: string;
      bankAccountId: string;
      quoteId?: string;
      cryptoAsset?: string;
      ipCountry?: string;
    },
  ): Promise<FiatTransaction> {
    if (!opts.userId) throw new FiatValidationError('USER_NOT_FOUND', 'userId is required');
    if (!opts.channel) throw new FiatValidationError('INVALID_CHANNEL', 'channel is required');
    if (!opts.bankAccountId) throw new FiatValidationError('INVALID_ACCOUNT', 'bankAccountId is required');

    // 校验币种
    if (!this.registry.isSupported(opts.fiatCurrency)) {
      throw new FiatValidationError('UNSUPPORTED_CURRENCY', `currency ${opts.fiatCurrency} not supported`);
    }

    // 校验金额
    const amountCheck = direction === 'deposit'
      ? this.registry.validateDepositAmount(opts.fiatCurrency, opts.fiatAmount)
      : this.registry.validateWithdrawAmount(opts.fiatCurrency, opts.fiatAmount);
    if (!amountCheck.valid) {
      throw new FiatValidationError('INVALID_AMOUNT', amountCheck.reason ?? 'amount invalid');
    }

    // 银行账户
    const account = this.findBankAccount(opts.bankAccountId);
    if (!account) {
      throw new FiatValidationError('ACCOUNT_NOT_FOUND', `bankAccount ${opts.bankAccountId} not found`);
    }
    if (account.userId !== opts.userId) {
      throw new FiatValidationError('ACCOUNT_NOT_OWNED', 'bank account does not belong to user');
    }
    if (!account.isVerified) {
      throw new FiatValidationError('ACCOUNT_UNVERIFIED', 'bank account must be verified first');
    }
    if (account.channel !== opts.channel) {
      throw new FiatValidationError(
        'CHANNEL_MISMATCH',
        `bank account channel ${account.channel} != transaction channel ${opts.channel}`,
      );
    }
    if (account.currency !== opts.fiatCurrency) {
      throw new FiatValidationError(
        'CURRENCY_MISMATCH',
        `bank account currency ${account.currency} != transaction currency ${opts.fiatCurrency}`,
      );
    }

    // 通道
    const channel = this.channels.get(opts.channel);
    if (!channel) {
      throw new FiatValidationError('UNSUPPORTED_CHANNEL', `channel ${opts.channel} not available`);
    }

    // quote
    if (opts.quoteId) {
      this.consumeQuote(opts.userId, opts.quoteId);
    }

    // 用户上下文
    const u = this.ensureUser(opts.userId);
    const context: Partial<UserKycContext> = {
      userId: opts.userId,
      kycLevel: u.kycLevel,
      country: u.country,
      fullName: u.fullName,
      kycExpiresAt: u.kycExpiresAt,
      holderCountry: account.country,
    };

    // AML/KYC 检测
    const amlResult = direction === 'deposit'
      ? await this.aml.checkDeposit(opts.userId, opts.fiatAmount, opts.fiatCurrency, context)
      : await this.aml.checkWithdraw(opts.userId, opts.fiatAmount, opts.fiatCurrency, account, context);
    if (!amlResult.passed) {
      throw new FiatError('AML_BLOCKED', amlResult.blocks[0] ?? 'AML blocked', {
        status: 403,
        meta: { blocks: amlResult.blocks, alerts: amlResult.alerts },
      });
    }

    // 限额检查
    const limitCheck = this.checkLimit(opts.userId, direction, opts.fiatAmount, opts.fiatCurrency);
    if (!limitCheck.passed) {
      throw new FiatLimitError('LIMIT_EXCEEDED', limitCheck.reason ?? 'limit exceeded', {
        meta: limitCheck,
      });
    }

    // 计算汇率 + 加密币金额
    const rate = await this.registry.getRate(opts.fiatCurrency, opts.cryptoAsset ?? 'USDT');
    const feeInfo = this.registry.computeFee(opts.fiatCurrency, direction, opts.fiatAmount);
    const cryptoAmount = (Number(feeInfo.netAmount) * Number(rate)).toFixed(8);

    // 创建订单
    const txId = shortId('fiat', `${opts.userId}:${opts.channel}:${this.now()}:${Math.random()}`);
    const now = this.now();
    const tx: FiatTransaction = {
      id: txId,
      userId: opts.userId,
      direction,
      channel: opts.channel,
      fiatCurrency: opts.fiatCurrency,
      fiatAmount: opts.fiatAmount,
      fee: feeInfo.fee,
      netAmount: feeInfo.netAmount,
      exchangeRate: rate,
      cryptoAmount: direction === 'deposit' ? cryptoAmount : undefined,
      cryptoAsset: opts.cryptoAsset ?? 'USDT',
      bankAccountId: opts.bankAccountId,
      status: 'pending',
      createdAt: now,
      expectedArrival: now + (opts.channel === 'SWIFT' ? 2 * 24 * 3600_000
        : opts.channel === 'SEPA' ? 24 * 3600_000
        : opts.channel === 'ACH' ? 1.5 * 24 * 3600_000
        : opts.channel === 'FPS' ? 5_000
        : opts.channel === 'PIX' ? 10_000
        : opts.channel === 'UPI' ? 15_000
        : 30_000),
      events: [{
        type: 'submitted',
        description: `Transaction submitted via ${opts.channel}`,
        timestamp: now,
      }],
    };

    // 记录 aml_check / kyc_check
    tx.events.push({
      type: 'aml_check',
      description: 'AML check passed',
      timestamp: now,
      meta: { warnings: amlResult.warnings, alerts: amlResult.alerts },
    });

    // 调用通道
    try {
      const channelResult = direction === 'deposit'
        ? await channel.createDeposit({ account, amount: opts.fiatAmount, reference: txId })
        : await channel.createWithdraw({ account, amount: opts.fiatAmount, reference: txId });
      tx.channelReference = channelResult.channelReference;
      tx.expectedArrival = channelResult.expectedArrival;
      // 优先使用 channel fee
      if (Number(channelResult.fee) > 0) {
        const channelFee = Number(channelResult.fee);
        const newNet = (Number(opts.fiatAmount) - channelFee).toFixed(this.registry.getCurrency(opts.fiatCurrency)!.decimals);
        tx.fee = channelFee.toFixed(this.registry.getCurrency(opts.fiatCurrency)!.decimals);
        tx.netAmount = newNet;
        const newCrypto = (Number(newNet) * Number(rate)).toFixed(8);
        if (direction === 'deposit') tx.cryptoAmount = newCrypto;
      }
      tx.status = 'submitted';
      tx.submittedAt = this.now();
      tx.events.push({
        type: 'submitted',
        description: `Submitted to ${opts.channel}`,
        timestamp: this.now(),
        meta: { channelReference: channelResult.channelReference },
      });
    } catch (err) {
      tx.status = 'failed';
      tx.rejectionReason = (err as Error).message;
      tx.events.push({
        type: 'failed',
        description: `Channel failed: ${(err as Error).message}`,
        timestamp: this.now(),
      });
    }

    u.transactions.push(tx);
    this.txIndex.set(tx.id, tx);
    this.updateLimits(opts.userId, direction, opts.fiatAmount, opts.fiatCurrency);
    return tx;
  }

  /**
   * 跟踪 / 刷新交易状态
   *  - 调通道 getStatus
   *  - 状态机：pending → submitted → processing → completed / failed
   */
  async trackTransaction(id: string): Promise<FiatTransaction> {
    const tx = this.txIndex.get(id);
    if (!tx) {
      throw new FiatValidationError('TX_NOT_FOUND', `transaction ${id} not found`);
    }
    if (tx.status === 'completed' || tx.status === 'failed' || tx.status === 'rejected' || tx.status === 'refunded') {
      return tx;
    }
    const channel = this.channels.get(tx.channel);
    if (!channel || !tx.channelReference) {
      return tx;
    }
    try {
      const newStatus = await channel.getStatus(tx.channelReference);
      if (newStatus !== tx.status) {
        const oldStatus = tx.status;
        tx.status = newStatus;
        if (newStatus === 'completed') {
          tx.completedAt = this.now();
        }
        tx.events.push({
          type: newStatus === 'completed' ? 'completed' : newStatus === 'failed' ? 'failed' : 'processing',
          description: `Status changed from ${oldStatus} to ${newStatus}`,
          timestamp: this.now(),
        });
      }
    } catch (err) {
      this.logger.warn(`[Fiat] trackTransaction ${id} failed: ${(err as Error).message}`);
    }
    return tx;
  }

  /** 获取单笔交易 */
  getTransaction(id: string): FiatTransaction | null {
    return this.txIndex.get(id) ?? null;
  }

  /** 获取用户交易 */
  getUserTransactions(userId: string, limit?: number): FiatTransaction[] {
    const txs = this.users.get(userId)?.transactions ?? [];
    return limit ? txs.slice(-limit) : [...txs];
  }

  /**
   * 取消未提交交易
   *  - 仅在 status='pending' 时可取消
   */
  async cancelTransaction(id: string): Promise<boolean> {
    const tx = this.txIndex.get(id);
    if (!tx) return false;
    if (tx.status !== 'pending') {
      throw new FiatValidationError('CANNOT_CANCEL', `transaction in status ${tx.status} cannot be cancelled`);
    }
    tx.status = 'failed';
    tx.rejectionReason = 'cancelled by user';
    tx.events.push({
      type: 'failed',
      description: 'Cancelled by user',
      timestamp: this.now(),
    });
    return true;
  }

  // -------------------------------------------------------------------------
  // 限额
  // -------------------------------------------------------------------------

  /** 获取用户限额（含已用/剩余） */
  async getLimits(userId: string): Promise<FiatLimits> {
    const u = this.ensureUser(userId);
    const kycLimits = KYC_LIMITS[u.kycLevel];
    const isUnlimited = (v: string) => v === 'unlimited';
    const safeLimit = (v: string, max: string) => (isUnlimited(v) ? 'unlimited' : (Number(v) > Number(max) ? v : max));
    const now = this.now();
    return {
      userId,
      kycLevel: u.kycLevel,
      tier: u.tier,
      dailyDeposit: { used: u.dailyDeposit.amount, limit: safeLimit(kycLimits.daily, '50000') },
      dailyWithdraw: { used: u.dailyWithdraw.amount, limit: safeLimit(kycLimits.daily, '50000') },
      monthlyDeposit: { used: u.monthlyDeposit.amount, limit: safeLimit(kycLimits.monthly, '500000') },
      monthlyWithdraw: { used: u.monthlyWithdraw.amount, limit: safeLimit(kycLimits.monthly, '500000') },
      yearlyDeposit: { used: u.yearlyDeposit.amount, limit: safeLimit(kycLimits.yearly, '5000000') },
      yearlyWithdraw: { used: u.yearlyWithdraw.amount, limit: safeLimit(kycLimits.yearly, '5000000') },
      singleMaxDeposit: '1000000',
      singleMaxWithdraw: '500000',
      updatedAt: now,
    };
  }

  /** 检查单笔限额（按方向） */
  checkLimit(
    userId: string,
    direction: FiatDirection,
    amount: string,
    currency: string,
  ): { passed: boolean; reason?: string } {
    const u = this.ensureUser(userId);
    const kycLimits = KYC_LIMITS[u.kycLevel];
    if (kycLimits.daily === 'unlimited') return { passed: true };
    // 计算 USD 等值
    const rateMap: Record<string, number> = {
      USD: 1, EUR: 1.08, GBP: 1.27, CNY: 0.14, JPY: 0.0067, KRW: 0.00075, HKD: 0.128, SGD: 0.74, AUD: 0.66, CAD: 0.74,
      INR: 0.012, BRL: 0.20, MXN: 0.058, CHF: 1.14, NZD: 0.61, THB: 0.028, MYR: 0.22, IDR: 0.000063, PHP: 0.018, VND: 0.000040,
      RUB: 0.011, ZAR: 0.054, TRY: 0.031, NGN: 0.00069, ARS: 0.0011,
    };
    const amountUsd = Number(amount) * (rateMap[currency.toUpperCase()] ?? 1);
    const dailyLimit = Number(kycLimits.daily);
    const monthlyLimit = Number(kycLimits.monthly);
    const yearlyLimit = Number(kycLimits.yearly);
    if (amountUsd > dailyLimit) {
      return {
        passed: false,
        reason: `exceeds KYC ${u.kycLevel} daily limit ${kycLimits.daily} USD`,
      };
    }
    const used = direction === 'deposit' ? u.dailyDeposit : u.dailyWithdraw;
    if (Number(used.amount) + amountUsd > dailyLimit) {
      return {
        passed: false,
        reason: `daily ${direction} limit exceeded (used ${used.amount}, requested ${amountUsd}, limit ${kycLimits.daily})`,
      };
    }
    return { passed: true };
  }

  /** 更新累计额度（内部） */
  private updateLimits(
    userId: string,
    direction: FiatDirection,
    amount: string,
    currency: string,
  ): void {
    const u = this.users.get(userId);
    if (!u) return;
    const rateMap: Record<string, number> = {
      USD: 1, EUR: 1.08, GBP: 1.27, CNY: 0.14, JPY: 0.0067, KRW: 0.00075, HKD: 0.128, SGD: 0.74, AUD: 0.66, CAD: 0.74,
      INR: 0.012, BRL: 0.20, MXN: 0.058, CHF: 1.14, NZD: 0.61, THB: 0.028, MYR: 0.22, IDR: 0.000063, PHP: 0.018, VND: 0.000040,
      RUB: 0.011, ZAR: 0.054, TRY: 0.031, NGN: 0.00069, ARS: 0.0011,
    };
    const usd = Number(amount) * (rateMap[currency.toUpperCase()] ?? 1);
    const today = Math.floor(this.now() / 86_400_000);
    const month = Math.floor(this.now() / (30 * 86_400_000));
    const year = Math.floor(this.now() / (365 * 86_400_000));
    if (direction === 'deposit') {
      if (u.dailyDeposit.date !== today) {
        u.dailyDeposit = { date: today, amount: '0' };
      }
      if (u.monthlyDeposit.date !== month) {
        u.monthlyDeposit = { date: month, amount: '0' };
      }
      if (u.yearlyDeposit.date !== year) {
        u.yearlyDeposit = { date: year, amount: '0' };
      }
      u.dailyDeposit.amount = (Number(u.dailyDeposit.amount) + usd).toFixed(2);
      u.monthlyDeposit.amount = (Number(u.monthlyDeposit.amount) + usd).toFixed(2);
      u.yearlyDeposit.amount = (Number(u.yearlyDeposit.amount) + usd).toFixed(2);
    } else {
      if (u.dailyWithdraw.date !== today) {
        u.dailyWithdraw = { date: today, amount: '0' };
      }
      if (u.monthlyWithdraw.date !== month) {
        u.monthlyWithdraw = { date: month, amount: '0' };
      }
      if (u.yearlyWithdraw.date !== year) {
        u.yearlyWithdraw = { date: year, amount: '0' };
      }
      u.dailyWithdraw.amount = (Number(u.dailyWithdraw.amount) + usd).toFixed(2);
      u.monthlyWithdraw.amount = (Number(u.monthlyWithdraw.amount) + usd).toFixed(2);
      u.yearlyWithdraw.amount = (Number(u.yearlyWithdraw.amount) + usd).toFixed(2);
    }
  }

  // -------------------------------------------------------------------------
  // 报表
  // -------------------------------------------------------------------------

  /** 日报（UTC ms timestamp 0 点的日期） */
  async getDailyReport(date: number): Promise<FiatReport> {
    const startTime = Math.floor(date / 86_400_000) * 86_400_000;
    const endTime = startTime + 86_400_000;
    return this.buildReport('daily', startTime, endTime);
  }

  /** 月报（30 天） */
  async getMonthlyReport(month: number): Promise<FiatReport> {
    const startTime = Math.floor(month / (30 * 86_400_000)) * (30 * 86_400_000);
    const endTime = startTime + 30 * 86_400_000;
    return this.buildReport('monthly', startTime, endTime);
  }

  private buildReport(period: 'daily' | 'monthly', startTime: number, endTime: number): FiatReport {
    const txs = Array.from(this.txIndex.values()).filter(
      (t) => t.createdAt >= startTime && t.createdAt < endTime,
    );
    // 计入「已生效」交易：completed / submitted / processing
    // 不计入 failed / rejected / refunded
    const activeStatuses: FiatStatus[] = ['completed', 'submitted', 'processing', 'pending'];
    const isActive = (s: FiatStatus) => activeStatuses.includes(s);
    const totalDeposit = txs.filter((t) => t.direction === 'deposit' && isActive(t.status))
      .reduce((s, t) => s + Number(t.fiatAmount), 0)
      .toFixed(2);
    const totalWithdraw = txs.filter((t) => t.direction === 'withdraw' && isActive(t.status))
      .reduce((s, t) => s + Number(t.fiatAmount), 0)
      .toFixed(2);
    const totalFee = txs.filter((t) => isActive(t.status))
      .reduce((s, t) => s + Number(t.fee), 0)
      .toFixed(2);
    const byChannel: Record<string, { count: number; amount: string }> = {};
    const byCurrency: Record<string, { count: number; amount: string }> = {};
    const byStatus: Record<string, number> = {};
    for (const t of txs) {
      const ch = byChannel[t.channel] ?? (byChannel[t.channel] = { count: 0, amount: '0' });
      ch.count += 1;
      ch.amount = (Number(ch.amount) + Number(t.fiatAmount)).toFixed(2);
      const cc = byCurrency[t.fiatCurrency] ?? (byCurrency[t.fiatCurrency] = { count: 0, amount: '0' });
      cc.count += 1;
      cc.amount = (Number(cc.amount) + Number(t.fiatAmount)).toFixed(2);
      byStatus[t.status] = (byStatus[t.status] ?? 0) + 1;
    }
    return {
      period,
      startTime,
      endTime,
      totalDeposit,
      totalWithdraw,
      totalFee,
      transactionCount: txs.length,
      byChannel,
      byCurrency,
      byStatus,
    };
  }

  // -------------------------------------------------------------------------
  // 工具
  // -------------------------------------------------------------------------

  /** 获取 CurrencyRegistry（用于子模块） */
  getRegistry(): CurrencyRegistry {
    return this.registry;
  }

  /** 获取 AmlKycService */
  getAmlService(): AmlKycService {
    return this.aml;
  }

  /** 获取通道 */
  getChannel(channel: FiatChannel): FiatChannelAdapter | undefined {
    return this.channels.get(channel);
  }

  /** 全局统计 */
  getStats(): {
    users: number;
    bankAccounts: number;
    transactions: number;
    quotes: number;
  } {
    let ba = 0;
    let qt = 0;
    for (const u of this.users.values()) {
      ba += u.bankAccounts.length;
      qt += u.quotes.length;
    }
    return {
      users: this.users.size,
      bankAccounts: ba,
      transactions: this.txIndex.size,
      quotes: qt,
    };
  }

  /** 测试用：清空所有数据 */
  _reset(): void {
    this.users.clear();
    this.txIndex.clear();
  }
}

// =============================================================================
// 工厂
// =============================================================================

export function createFiatEngine(opts?: FiatEngineOptions): FiatEngine {
  return new FiatEngine(opts);
}

export default FiatEngine;

// 重新导出 SUPPORTED_FIAT_CURRENCIES
export { SUPPORTED_FIAT_CURRENCIES };
