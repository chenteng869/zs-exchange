/**
 * DcepWalletService - 钱包管理 + 限额管理
 *
 * 职责：
 *  - 创建 / 激活 / 冻结 / 关闭钱包
 *  - 查询钱包
 *  - KYC 等级限额管理
 *  - 每日 / 每年限额扣减 / 重置
 *
 * 与现有 fiat 模块的限额管理对齐：金额均为 string 数字。
 *
 * 用法：
 *   const walletSvc = new DcepWalletService();
 *   const wallet = walletSvc.createWallet('user-1', 2);
 *   walletSvc.activateWallet(wallet.id, '123456');
 *   const r = walletSvc.checkLimit('user-1', '1000');
 *   if (r.passed) walletSvc.consumeLimit('user-1', '1000');
 */

import { logger as defaultLogger } from '../logger';
import {
  type DcepLimitTier,
  type DcepLimits,
  type DcepWallet,
  type KycLevel,
  DCEP_KYC_LIMITS,
  DcepError,
  DcepLimitError,
  addAmount,
  compareAmount,
  djb2,
  shortId,
  subAmount,
} from './types';

// =============================================================================
// 用户限额记录
// =============================================================================

interface UserLimitState {
  userId: string;
  kycLevel: KycLevel;
  dailyUsed: string;
  yearlyUsed: string;
  /** UTC ms 时间戳（用于判断是否跨日 / 跨年） */
  dailyResetAt: number;
  yearlyResetAt: number;
}

const ONE_DAY_MS = 24 * 3600_000;
// 简化：用 365 天作为年窗口
const ONE_YEAR_MS = 365 * 24 * 3600_000;

// =============================================================================
// DcepWalletService
// =============================================================================

export interface DcepWalletServiceOptions {
  logger?: typeof defaultLogger;
  now?: () => number;
}

export class DcepWalletService {
  private readonly logger: typeof defaultLogger;
  private readonly now: () => number;
  /** walletId → wallet */
  private readonly wallets: Map<string, DcepWallet> = new Map();
  /** userId → walletId（每用户 1 个） */
  private readonly userWallets: Map<string, string> = new Map();
  /** userId → 限额状态 */
  private readonly limits: Map<string, UserLimitState> = new Map();

  constructor(opts: DcepWalletServiceOptions = {}) {
    this.logger = opts.logger ?? defaultLogger;
    this.now = opts.now ?? (() => Date.now());
  }

  // -------------------------------------------------------------------------
  // 钱包管理
  // -------------------------------------------------------------------------

  /**
   * 创建钱包（默认 pending，等待激活）
   */
  createWallet(userId: string, kycLevel: KycLevel): DcepWallet {
    if (this.userWallets.has(userId)) {
      throw new DcepError('WALLET_EXISTS', `user ${userId} already has a DCEP wallet`);
    }
    const now = this.now();
    const id = shortId('wlt', `${userId}:${now}:${Math.random()}`);
    const walletId = `dcepw-${djb2(`${userId}${now}`).toString(16).padStart(10, '0')}`;
    const publicKey = `04${djb2(`pubkey:${userId}:${now}`).toString(16).padStart(64, '0')}`;

    const tier = DCEP_KYC_LIMITS[kycLevel];

    const wallet: DcepWallet = {
      id,
      userId,
      walletId,
      publicKey,
      status: 'pending',
      kycLevel,
      dailyLimit: tier.daily,
      yearlyLimit: tier.yearly,
      dailyUsed: '0',
      yearlyUsed: '0',
      createdAt: now,
    };
    this.wallets.set(id, wallet);
    this.userWallets.set(userId, id);
    this.limits.set(userId, {
      userId,
      kycLevel,
      dailyUsed: '0',
      yearlyUsed: '0',
      dailyResetAt: now + ONE_DAY_MS,
      yearlyResetAt: now + ONE_YEAR_MS,
    });
    this.logger.info(`[DCEP] wallet created: ${id} for user ${userId}, kyc=${kycLevel}`);
    return wallet;
  }

  /**
   * 激活钱包（短信码 6 位）
   */
  activateWallet(walletId: string, smsCode: string): DcepWallet {
    const wallet = this.getWallet(walletId);
    if (!wallet) {
      throw new DcepError('WALLET_NOT_FOUND', `wallet ${walletId} not found`);
    }
    if (wallet.status === 'active') {
      return wallet;
    }
    if (wallet.status === 'closed') {
      throw new DcepError('WALLET_CLOSED', `wallet ${walletId} is closed`);
    }
    if (wallet.status === 'frozen') {
      throw new DcepError('WALLET_FROZEN', `wallet ${walletId} is frozen`);
    }
    if (!/^\d{6}$/.test(smsCode)) {
      throw new DcepError('INVALID_SMS_CODE', 'SMS code must be 6 digits');
    }
    // mock：演示码 123456 通过
    if (smsCode !== '123456') {
      throw new DcepError('INVALID_SMS_CODE', 'SMS code is incorrect');
    }
    wallet.status = 'active';
    wallet.activatedAt = this.now();
    this.logger.info(`[DCEP] wallet activated: ${walletId}`);
    return wallet;
  }

  /**
   * 冻结钱包
   */
  freezeWallet(walletId: string, reason: string): DcepWallet {
    const wallet = this.getWallet(walletId);
    if (!wallet) {
      throw new DcepError('WALLET_NOT_FOUND', `wallet ${walletId} not found`);
    }
    if (wallet.status === 'closed') {
      throw new DcepError('WALLET_CLOSED', `wallet ${walletId} is closed`);
    }
    wallet.status = 'frozen';
    this.logger.warn(`[DCEP] wallet frozen: ${walletId}, reason: ${reason}`);
    return wallet;
  }

  /**
   * 关闭钱包（不可逆）
   */
  closeWallet(walletId: string): DcepWallet {
    const wallet = this.getWallet(walletId);
    if (!wallet) {
      throw new DcepError('WALLET_NOT_FOUND', `wallet ${walletId} not found`);
    }
    wallet.status = 'closed';
    this.logger.warn(`[DCEP] wallet closed: ${walletId}`);
    return wallet;
  }

  /**
   * 查询钱包（按 wallet.id）
   */
  getWallet(walletId: string): DcepWallet | null {
    return this.wallets.get(walletId) ?? null;
  }

  /**
   * 查询用户的钱包
   */
  getUserWallet(userId: string): DcepWallet | null {
    const id = this.userWallets.get(userId);
    if (!id) return null;
    return this.wallets.get(id) ?? null;
  }

  /**
   * 列出所有钱包（测试 / 审计用）
   */
  listWallets(): DcepWallet[] {
    return Array.from(this.wallets.values());
  }

  // -------------------------------------------------------------------------
  // 限额管理
  // -------------------------------------------------------------------------

  /**
   * 查询用户限额（按 KYC 等级）
   */
  getLimits(userId: string): DcepLimits {
    const state = this.limits.get(userId);
    const kycLevel = state?.kycLevel ?? 0;
    return {
      userId,
      kycLevel,
      anonymous: DCEP_KYC_LIMITS[0],
      lightKyc: DCEP_KYC_LIMITS[1],
      fullKyc: DCEP_KYC_LIMITS[2],
      enhancedKyc: DCEP_KYC_LIMITS[3],
    };
  }

  /**
   * 检查限额
   */
  checkLimit(userId: string, amount: string): { passed: boolean; reason?: string } {
    this.maybeResetLimits(userId);
    const state = this.limits.get(userId);
    if (!state) {
      return { passed: false, reason: 'user has no DCEP wallet' };
    }
    const tier = DCEP_KYC_LIMITS[state.kycLevel];

    // 单笔限额
    if (tier.single !== 'unlimited' && compareAmount(amount, tier.single) > 0) {
      return {
        passed: false,
        reason: `exceeds single transaction limit ${tier.single} for KYC ${state.kycLevel}`,
      };
    }

    // 日累计 + 本笔
    if (tier.daily !== 'unlimited') {
      const totalDaily = addAmount(state.dailyUsed, amount);
      if (compareAmount(totalDaily, tier.daily) > 0) {
        return {
          passed: false,
          reason: `exceeds daily limit ${tier.daily} for KYC ${state.kycLevel}`,
        };
      }
    }

    // 年累计 + 本笔
    if (tier.yearly !== 'unlimited') {
      const totalYearly = addAmount(state.yearlyUsed, amount);
      if (compareAmount(totalYearly, tier.yearly) > 0) {
        return {
          passed: false,
          reason: `exceeds yearly limit ${tier.yearly} for KYC ${state.kycLevel}`,
        };
      }
    }

    return { passed: true };
  }

  /**
   * 消费限额（按 KYC 等级累计）
   */
  consumeLimit(userId: string, amount: string): void {
    this.maybeResetLimits(userId);
    const state = this.limits.get(userId);
    if (!state) {
      throw new DcepLimitError('LIMIT_NO_STATE', `user ${userId} has no DCEP wallet`);
    }
    state.dailyUsed = addAmount(state.dailyUsed, amount);
    state.yearlyUsed = addAmount(state.yearlyUsed, amount);
    // 同步到 wallet
    const wallet = this.getUserWallet(userId);
    if (wallet) {
      wallet.dailyUsed = state.dailyUsed;
      wallet.yearlyUsed = state.yearlyUsed;
    }
    this.logger.debug(`[DCEP] consumed ${amount} for user ${userId}, daily=${state.dailyUsed}, yearly=${state.yearlyUsed}`);
  }

  /**
   * 重置每日限额（系统 cron 调用 / 测试用）
   */
  resetDailyLimits(): void {
    const now = this.now();
    for (const state of this.limits.values()) {
      state.dailyUsed = '0';
      state.dailyResetAt = now + ONE_DAY_MS;
      const wallet = this.getUserWallet(state.userId);
      if (wallet) wallet.dailyUsed = '0';
    }
  }

  /**
   * 重置年度限额（系统 cron 调用 / 测试用）
   */
  resetYearlyLimits(): void {
    const now = this.now();
    for (const state of this.limits.values()) {
      state.yearlyUsed = '0';
      state.yearlyResetAt = now + ONE_YEAR_MS;
      const wallet = this.getUserWallet(state.userId);
      if (wallet) wallet.yearlyUsed = '0';
    }
  }

  // -------------------------------------------------------------------------
  // 测试用
  // -------------------------------------------------------------------------

  /** 清空状态（测试用） */
  reset(): void {
    this.wallets.clear();
    this.userWallets.clear();
    this.limits.clear();
  }

  // -------------------------------------------------------------------------
  // 内部
  // -------------------------------------------------------------------------

  private maybeResetLimits(userId: string): void {
    const state = this.limits.get(userId);
    if (!state) return;
    const now = this.now();
    if (now >= state.dailyResetAt) {
      state.dailyUsed = '0';
      state.dailyResetAt = now + ONE_DAY_MS;
    }
    if (now >= state.yearlyResetAt) {
      state.yearlyUsed = '0';
      state.yearlyResetAt = now + ONE_YEAR_MS;
    }
  }
}

export function createDcepWalletService(opts?: DcepWalletServiceOptions): DcepWalletService {
  return new DcepWalletService(opts);
}

export default DcepWalletService;
