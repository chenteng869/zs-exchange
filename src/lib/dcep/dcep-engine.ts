/**
 * DcepEngine - 业务层（数字人民币入金 / 出金）
 *
 * 职责：
 *  - 报价（DCEP → USDT，60s 过期）
 *  - 入金（deposit）：央行侧扣款 → 兑换 USDT → 入账
 *  - 出金（withdraw）：扣减 USDT → 央行侧出款
 *  - KYC 校验 / 限额检查 / AML 校验
 *  - 状态查询 / 用户交易列表
 *  - 日 / 月报表
 *  - 合规审计（保留 7 年）
 *
 * 与现有模块集成：
 *  - DcepWalletService：钱包 + 限额
 *  - DcepKycService：4 级 KYC
 *  - DcepPaymentGateway：央行网关
 *  - AmlKycService（fiat）：AML 检测
 *
 * 用法：
 *   const engine = new DcepEngine();
 *   const quote = await engine.getQuote('1000', 'USDT');
 *   const tx = await engine.deposit('user-1', { amount: '1000', bankName, bankAccount });
 *   // 7 年后通过 trackTransaction 仍可查询（演示）
 */

import { logger as defaultLogger } from '../logger';
import { AmlKycService, createAmlKycService } from '../fiat/aml-kyc';
import { DcepKycService, createDcepKycService } from './kyc-service';
import { DcepPaymentGateway, createDcepPaymentGateway } from './payment-gateway';
import { DcepWalletService, createDcepWalletService } from './wallet-service';
import {
  type ComplianceResult,
  type DcepDirection,
  type DcepQuote,
  type DcepReport,
  type DcepTransaction,
  type KycLevel,
  type SupportedDcepBank,
  DCEP_EXCHANGE_RATE_DEFAULT,
  DCEP_MIN_AMOUNT,
  DCEP_QUOTE_TTL_MS,
  DCEP_REPORT_RETENTION_DAYS,
  DCEP_SUPPORTED_BANKS,
  DcepAmlError,
  DcepError,
  DcepKycError,
  DcepLimitError,
  addAmount,
  compareAmount,
  djb2,
  shortId,
} from './types';

const ONE_DAY_MS = 24 * 3600_000;

// =============================================================================
// 业务层
// =============================================================================

export interface DepositOptions {
  amount: string;
  bankName?: SupportedDcepBank;
  bankAccount?: string;
  /** 引用号（外部） */
  reference?: string;
}

export interface WithdrawOptions {
  amount: string;
  bankName: SupportedDcepBank;
  bankAccount: string;
  /** 引用号（外部） */
  reference?: string;
}

export interface GetQuoteOptions {
  dcepAmount: string;
  cryptoAsset: string;
}

export interface DcepEngineOptions {
  walletService?: DcepWalletService;
  kycService?: DcepKycService;
  paymentGateway?: DcepPaymentGateway;
  amlService?: AmlKycService;
  /** DCEP → USDT 汇率（默认 1:1，演示） */
  exchangeRate?: string;
  /** 入金 / 出金手续费率（默认 0.001 = 0.1%） */
  feeRate?: number;
  logger?: typeof defaultLogger;
  now?: () => number;
}

export class DcepEngine {
  private readonly wallet: DcepWalletService;
  private readonly kyc: DcepKycService;
  private readonly gateway: DcepPaymentGateway;
  private readonly aml: AmlKycService;
  private readonly exchangeRate: string;
  private readonly feeRate: number;
  private readonly logger: typeof defaultLogger;
  private readonly now: () => number;

  /** id → 报价 */
  private readonly quotes: Map<string, DcepQuote> = new Map();
  /** id → 交易 */
  private readonly transactions: Map<string, DcepTransaction> = new Map();
  /** userId → 交易 id 列表 */
  private readonly userTxIds: Map<string, string[]> = new Map();
  /** 用户 USDT 余额（mock 入账） */
  private readonly usdtBalances: Map<string, string> = new Map();

  constructor(opts: DcepEngineOptions = {}) {
    this.wallet = opts.walletService ?? createDcepWalletService({ now: opts.now });
    this.kyc = opts.kycService ?? createDcepKycService({ now: opts.now });
    this.gateway = opts.paymentGateway ?? createDcepPaymentGateway({ now: opts.now });
    this.aml = opts.amlService ?? createAmlKycService({ now: opts.now });
    this.exchangeRate = opts.exchangeRate ?? DCEP_EXCHANGE_RATE_DEFAULT;
    this.feeRate = opts.feeRate ?? 0.001;
    this.logger = opts.logger ?? defaultLogger;
    this.now = opts.now ?? (() => Date.now());
  }

  // -------------------------------------------------------------------------
  // 报价
  // -------------------------------------------------------------------------

  /**
   * 获取报价（DCEP → USDT，60s 过期）
   */
  async getQuote(dcepAmount: string, cryptoAsset: string): Promise<DcepQuote> {
    if (!dcepAmount || compareAmount(dcepAmount, DCEP_MIN_AMOUNT) < 0) {
      throw new DcepError('INVALID_AMOUNT', `amount must be ≥ ${DCEP_MIN_AMOUNT}`);
    }
    if (cryptoAsset.toUpperCase() !== 'USDT') {
      throw new DcepError('UNSUPPORTED_ASSET', `crypto asset ${cryptoAsset} not supported (only USDT)`);
    }
    const ts = this.now();
    const id = shortId('q', `${dcepAmount}:${cryptoAsset}:${ts}:${Math.random()}`);
    const feeNum = Number(dcepAmount) * this.feeRate;
    const fee = feeNum.toFixed(2);
    const net = (Number(dcepAmount) - Number(fee)).toFixed(2);
    const cryptoAmount = (Number(net) * Number(this.exchangeRate)).toFixed(2);
    const quote: DcepQuote = {
      id,
      dcepAmount,
      cryptoAmount,
      exchangeRate: this.exchangeRate,
      fee,
      expiresAt: ts + DCEP_QUOTE_TTL_MS,
      createdAt: ts,
    };
    this.quotes.set(id, quote);
    return quote;
  }

  // -------------------------------------------------------------------------
  // 入金（deposit）
  // -------------------------------------------------------------------------

  /**
   * 入金：DCEP → USDT
   */
  async deposit(userId: string, opts: DepositOptions): Promise<DcepTransaction> {
    if (!opts.amount || compareAmount(opts.amount, DCEP_MIN_AMOUNT) < 0) {
      throw new DcepError('INVALID_AMOUNT', `amount must be ≥ ${DCEP_MIN_AMOUNT}`);
    }

    // 1) KYC 校验
    this.checkKycForTransaction(userId, 'deposit');

    // 2) 钱包存在 & active
    const wallet = this.wallet.getUserWallet(userId);
    if (!wallet) {
      throw new DcepError('NO_WALLET', `user ${userId} has no DCEP wallet`);
    }
    if (wallet.status !== 'active') {
      throw new DcepError('WALLET_NOT_ACTIVE', `wallet status is ${wallet.status}`);
    }

    // 3) 限额检查
    const limit = this.wallet.checkLimit(userId, opts.amount);
    if (!limit.passed) {
      throw new DcepLimitError('LIMIT_EXCEEDED', limit.reason ?? 'limit exceeded');
    }

    // 4) AML
    const amlResult = await this.aml.checkDeposit(userId, opts.amount, 'CNY', {
      kycLevel: 'basic',
      fullName: this.kyc.getKycInfo(userId)?.realName,
    });
    if (!amlResult.passed) {
      throw new DcepAmlError('AML_BLOCKED', amlResult.blocks[0] ?? 'AML blocked');
    }

    // 5) 创建交易（submitted）
    const tx = this.createTransaction(userId, wallet.id, 'deposit', opts.amount, {
      bankName: opts.bankName,
      bankAccount: opts.bankAccount,
    });
    this.transactions.set(tx.id, tx);
    this.pushUserTx(userId, tx.id);

    // 6) 央行侧提交
    try {
      const sub = await this.gateway.submitTransaction({
        walletId: wallet.walletId,
        amount: opts.amount,
        direction: 'deposit',
        reference: opts.reference ?? tx.id,
        bankName: opts.bankName,
        bankAccount: opts.bankAccount,
      });
      tx.centralTxId = sub.centralTxId;
      tx.centralTimestamp = sub.timestamp;
      tx.status = 'confirmed';
    } catch (err) {
      tx.status = 'failed';
      tx.rejectionReason = (err as Error).message;
      this.logger.error(`[DCEP] deposit central submit failed: ${(err as Error).message}`);
      throw err;
    }

    // 7) 兑换 + 入账
    const fee = (Number(opts.amount) * this.feeRate).toFixed(2);
    const net = (Number(opts.amount) - Number(fee)).toFixed(2);
    const cryptoAmount = (Number(net) * Number(this.exchangeRate)).toFixed(2);
    tx.exchangeRate = this.exchangeRate;
    tx.fee = fee;
    tx.cryptoAmount = cryptoAmount;
    this.creditUsdt(userId, cryptoAmount);
    this.wallet.consumeLimit(userId, opts.amount);

    // 8) 完成
    tx.status = 'completed';
    tx.completedAt = this.now();
    this.logger.info(`[DCEP] deposit completed: ${tx.id}, user=${userId}, amount=${opts.amount}, crypto=${cryptoAmount}`);
    return tx;
  }

  // -------------------------------------------------------------------------
  // 出金（withdraw）
  // -------------------------------------------------------------------------

  /**
   * 出金：USDT → DCEP
   */
  async withdraw(userId: string, opts: WithdrawOptions): Promise<DcepTransaction> {
    if (!opts.amount || compareAmount(opts.amount, DCEP_MIN_AMOUNT) < 0) {
      throw new DcepError('INVALID_AMOUNT', `amount must be ≥ ${DCEP_MIN_AMOUNT}`);
    }
    if (!opts.bankName || !DCEP_SUPPORTED_BANKS.includes(opts.bankName)) {
      throw new DcepError('UNSUPPORTED_BANK', `bank ${opts.bankName} is not supported`);
    }
    if (!opts.bankAccount) {
      throw new DcepError('MISSING_BANK_ACCOUNT', 'bankAccount is required');
    }

    // 1) KYC
    this.checkKycForTransaction(userId, 'withdraw');

    // 2) 钱包 active
    const wallet = this.wallet.getUserWallet(userId);
    if (!wallet) {
      throw new DcepError('NO_WALLET', `user ${userId} has no DCEP wallet`);
    }
    if (wallet.status !== 'active') {
      throw new DcepError('WALLET_NOT_ACTIVE', `wallet status is ${wallet.status}`);
    }

    // 3) 限额
    const limit = this.wallet.checkLimit(userId, opts.amount);
    if (!limit.passed) {
      throw new DcepLimitError('LIMIT_EXCEEDED', limit.reason ?? 'limit exceeded');
    }

    // 4) AML（含银行账户）
    const amlResult = await this.aml.check(userId, opts.amount, 'CNY', 'withdraw', {
      kycLevel: 'basic',
      fullName: this.kyc.getKycInfo(userId)?.realName,
      holderCountry: 'CN',
    });
    if (!amlResult.passed) {
      throw new DcepAmlError('AML_BLOCKED', amlResult.blocks[0] ?? 'AML blocked');
    }

    // 5) 余额检查
    const balance = this.getUsdtBalance(userId);
    const fee = (Number(opts.amount) * this.feeRate).toFixed(2);
    const usdtNeeded = (Number(opts.amount) * Number(this.exchangeRate)).toFixed(2);
    if (compareAmount(balance, usdtNeeded) < 0) {
      throw new DcepError('INSUFFICIENT_BALANCE', `USDT balance ${balance} < required ${usdtNeeded}`);
    }

    // 6) 创建交易
    const tx = this.createTransaction(userId, wallet.id, 'withdraw', opts.amount, {
      bankName: opts.bankName,
      bankAccount: opts.bankAccount,
    });
    tx.fee = fee;
    tx.exchangeRate = this.exchangeRate;
    tx.cryptoAmount = usdtNeeded;
    this.transactions.set(tx.id, tx);
    this.pushUserTx(userId, tx.id);

    // 7) 扣减 USDT
    this.debitUsdt(userId, usdtNeeded);

    // 8) 央行侧出款
    try {
      const sub = await this.gateway.submitTransaction({
        walletId: wallet.walletId,
        amount: opts.amount,
        direction: 'withdraw',
        reference: opts.reference ?? tx.id,
        bankName: opts.bankName,
        bankAccount: opts.bankAccount,
      });
      tx.centralTxId = sub.centralTxId;
      tx.centralTimestamp = sub.timestamp;
      tx.status = 'confirmed';
    } catch (err) {
      // 央行失败：回滚 USDT
      this.creditUsdt(userId, usdtNeeded);
      tx.status = 'failed';
      tx.rejectionReason = (err as Error).message;
      throw err;
    }

    // 9) 消费限额
    this.wallet.consumeLimit(userId, opts.amount);

    tx.status = 'completed';
    tx.completedAt = this.now();
    this.logger.info(`[DCEP] withdraw completed: ${tx.id}, user=${userId}, amount=${opts.amount}`);
    return tx;
  }

  // -------------------------------------------------------------------------
  // 状态 / 查询
  // -------------------------------------------------------------------------

  /**
   * 跟踪交易（查询央行侧最新状态）
   */
  async trackTransaction(id: string): Promise<DcepTransaction> {
    const tx = this.transactions.get(id);
    if (!tx) {
      throw new DcepError('TX_NOT_FOUND', `transaction ${id} not found`);
    }
    if (tx.centralTxId) {
      const r = await this.gateway.queryTransaction(tx.centralTxId);
      if (r.status !== tx.status && r.status !== 'submitted') {
        // 央行侧完成则覆盖
        tx.status = r.status;
        if (r.status === 'completed' && !tx.completedAt) {
          tx.completedAt = this.now();
        }
      }
    }
    return tx;
  }

  /**
   * 查询交易
   */
  getTransaction(id: string): DcepTransaction | null {
    return this.transactions.get(id) ?? null;
  }

  /**
   * 查询用户交易列表
   */
  getUserTransactions(userId: string, limit: number = 50): DcepTransaction[] {
    const ids = this.userTxIds.get(userId) ?? [];
    const arr = ids
      .map((id) => this.transactions.get(id))
      .filter((t): t is DcepTransaction => Boolean(t));
    return arr.slice(-limit).reverse();
  }

  /**
   * 查询 USDT 余额
   */
  getUsdtBalance(userId: string): string {
    return this.usdtBalances.get(userId) ?? '0';
  }

  // -------------------------------------------------------------------------
  // 报表
  // -------------------------------------------------------------------------

  /**
   * 日报表（指定日期 YYYY-MM-DD，北京时间）
   */
  async getDailyReport(date: string): Promise<DcepReport> {
    const { start, end } = parseDay(date);
    return this.buildReport('daily', start, end);
  }

  /**
   * 月报表（YYYY-MM）
   */
  async getMonthlyReport(month: string): Promise<DcepReport> {
    const { start, end } = parseMonth(month);
    return this.buildReport('monthly', start, end);
  }

  // -------------------------------------------------------------------------
  // 合规
  // -------------------------------------------------------------------------

  /**
   * 合规检查
   */
  async complianceCheck(txId: string): Promise<ComplianceResult> {
    const tx = this.transactions.get(txId);
    const checkedAt = this.now();
    if (!tx) {
      return {
        passed: false,
        violations: [`transaction ${txId} not found`],
        warnings: [],
        checkedAt,
      };
    }
    const violations: string[] = [];
    const warnings: string[] = [];

    // 1. 限额
    const limit = this.wallet.checkLimit(tx.userId, tx.amount);
    if (!limit.passed) {
      violations.push(limit.reason ?? 'limit exceeded');
    }

    // 2. KYC
    if (!tx.kycChecked) {
      violations.push('KYC not checked');
    }
    if (!tx.amlChecked) {
      violations.push('AML not checked');
    }
    if (!tx.sanctionedChecked) {
      warnings.push('sanctions not checked');
    }

    // 3. 央行侧
    if (!tx.centralTxId) {
      violations.push('no central bank transaction id');
    }

    // 4. 状态
    if (tx.status === 'failed' || tx.status === 'rejected') {
      warnings.push(`transaction final status: ${tx.status}`);
    }

    return {
      passed: violations.length === 0,
      violations,
      warnings,
      checkedAt,
    };
  }

  // -------------------------------------------------------------------------
  // 内部
  // -------------------------------------------------------------------------

  private checkKycForTransaction(userId: string, direction: DcepDirection): void {
    if (!this.kyc.isKycValid(userId)) {
      throw new DcepKycError('KYC_INVALID', `user ${userId} KYC is missing or expired`);
    }
    const level = this.kyc.getKycLevel(userId);
    if (level < 1) {
      throw new DcepKycError('KYC_LEVEL_TOO_LOW', 'DCEP requires at least level 1 KYC');
    }
  }

  private createTransaction(
    userId: string,
    walletId: string,
    direction: DcepDirection,
    amount: string,
    extra: { bankName?: string; bankAccount?: string },
  ): DcepTransaction {
    const ts = this.now();
    return {
      id: shortId('dcep', `${userId}:${direction}:${ts}:${Math.random()}`),
      userId,
      walletId,
      direction,
      amount,
      fee: '0',
      status: 'submitted',
      bankName: extra.bankName,
      bankAccount: extra.bankAccount,
      kycChecked: true,
      amlChecked: true,
      sanctionedChecked: true,
      createdAt: ts,
    };
  }

  private pushUserTx(userId: string, txId: string): void {
    const list = this.userTxIds.get(userId) ?? [];
    list.push(txId);
    this.userTxIds.set(userId, list);
  }

  private creditUsdt(userId: string, amount: string): void {
    const cur = this.usdtBalances.get(userId) ?? '0';
    this.usdtBalances.set(userId, addAmount(cur, amount));
  }

  private debitUsdt(userId: string, amount: string): void {
    const cur = this.usdtBalances.get(userId) ?? '0';
    this.usdtBalances.set(userId, addAmount(cur, `-${amount}`));
  }

  private buildReport(period: 'daily' | 'monthly', start: number, end: number): DcepReport {
    let totalDeposit = '0';
    let totalWithdraw = '0';
    let totalFee = '0';
    let count = 0;
    const byStatus: Record<string, number> = {};
    for (const tx of this.transactions.values()) {
      if (tx.createdAt < start || tx.createdAt >= end) continue;
      if (tx.direction === 'deposit') {
        totalDeposit = addAmount(totalDeposit, tx.amount);
      } else {
        totalWithdraw = addAmount(totalWithdraw, tx.amount);
      }
      totalFee = addAmount(totalFee, tx.fee);
      byStatus[tx.status] = (byStatus[tx.status] ?? 0) + 1;
      count += 1;
    }
    return {
      period,
      startTime: start,
      endTime: end,
      totalDeposit,
      totalWithdraw,
      totalFee,
      transactionCount: count,
      byStatus,
      retainedUntil: this.now() + DCEP_REPORT_RETENTION_DAYS * ONE_DAY_MS,
    };
  }

  // -------------------------------------------------------------------------
  // 测试用
  // -------------------------------------------------------------------------

  /** 重置所有状态（测试用） */
  reset(): void {
    this.wallet.reset();
    this.kyc.reset();
    this.gateway.reset();
    this.quotes.clear();
    this.transactions.clear();
    this.userTxIds.clear();
    this.usdtBalances.clear();
  }

  /** 暴露子服务（测试断言用） */
  getWalletService(): DcepWalletService { return this.wallet; }
  getKycService(): DcepKycService { return this.kyc; }
  getPaymentGateway(): DcepPaymentGateway { return this.gateway; }
}

// =============================================================================
// 报表工具
// =============================================================================

function parseDay(date: string): { start: number; end: number } {
  // date: YYYY-MM-DD（北京时区）
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!m) throw new DcepError('INVALID_DATE', `invalid date format: ${date}, expected YYYY-MM-DD`);
  const [, y, mo, d] = m;
  // 北京时区 00:00 = UTC 16:00 (前一日)
  const startBj = Date.UTC(Number(y), Number(mo) - 1, Number(d), 0, 0, 0);
  const start = startBj - 8 * 3600_000;
  const end = start + ONE_DAY_MS;
  return { start, end };
}

function parseMonth(month: string): { start: number; end: number } {
  const m = /^(\d{4})-(\d{2})$/.exec(month);
  if (!m) throw new DcepError('INVALID_MONTH', `invalid month format: ${month}, expected YYYY-MM`);
  const [, y, mo] = m;
  const startBj = Date.UTC(Number(y), Number(mo) - 1, 1, 0, 0, 0);
  const start = startBj - 8 * 3600_000;
  const nextMonth = Number(mo) === 12
    ? Date.UTC(Number(y) + 1, 0, 1, 0, 0, 0)
    : Date.UTC(Number(y), Number(mo), 1, 0, 0, 0);
  const end = nextMonth - 8 * 3600_000;
  return { start, end };
}

export function createDcepEngine(opts?: DcepEngineOptions): DcepEngine {
  return new DcepEngine(opts);
}

export default DcepEngine;
