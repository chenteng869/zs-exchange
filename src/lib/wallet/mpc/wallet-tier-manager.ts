/**
 * 冷热钱包管理器 (WalletTierManager)
 *
 * 负责：
 *  - 热/温/冷三层钱包架构管理
 *  - 交易金额自动分层路由
 *  - 钱包层级动态调整
 *  - 层级间资金调度
 *  - 层级阈值配置管理
 *  - 层级统计与监控
 *
 * 钱包层级说明：
 *  - 热钱包 (hot): 实时签名，适用于小额高频交易，低延迟
 *  - 温钱包 (warm): 延迟签名，适用于中额交易，平衡安全与速度
 *  - 冷钱包 (cold): 人工审批，适用于大额交易，最高安全性
 */

import {
  MPCWallet,
  WalletTier,
  ChainType,
  MPCError,
  MPCErrorCode,
  TransactionSummary,
} from './mpc.types';

// =============================================================================
// 层级配置接口
// =============================================================================

/**
 * 单一层级配置
 */
export interface TierConfig {
  /** 层级 */
  tier: WalletTier;
  /** 层级名称 */
  name: string;
  /** 层级描述 */
  description: string;
  /** 最小金额（以最小单位表示） */
  minAmount?: string;
  /** 最大金额（以最小单位表示） */
  maxAmount?: string;
  /** 单日限额 */
  dailyLimit?: string;
  /** 单笔限额 */
  txLimit?: string;
  /** 签名门限值 */
  threshold: number;
  /** 总分片数 */
  totalShares: number;
  /** 是否需要审批 */
  requireApproval: boolean;
  /** 审批人数 */
  approverCount?: number;
  /** 签名延迟（毫秒） */
  signDelayMs?: number;
  /** 目标余额（用于资金调度） */
  targetBalance?: string;
  /** 最低余额（低于此值触发充值） */
  minBalance?: string;
  /** 是否启用自动充值 */
  autoRefill?: boolean;
  /** 风险等级 */
  riskLevel: 'low' | 'medium' | 'high';
}

/**
 * 层级管理器配置
 */
export interface WalletTierManagerOptions {
  /** 热钱包配置 */
  hotConfig?: Partial<TierConfig>;
  /** 温钱包配置 */
  warmConfig?: Partial<TierConfig>;
  /** 冷钱包配置 */
  coldConfig?: Partial<TierConfig>;
  /** 是否启用自动分层 */
  autoTierRouting?: boolean;
  /** 是否启用自动资金调度 */
  autoFunding?: boolean;
  /** 资金调度检查间隔（毫秒） */
  fundingCheckIntervalMs?: number;
}

// =============================================================================
// 分层路由结果
// =============================================================================

/**
 * 分层路由结果
 */
export interface TierRoutingResult {
  /** 目标层级 */
  tier: WalletTier;
  /** 路由原因 */
  reason: string;
  /** 是否需要审批 */
  requireApproval: boolean;
  /** 预计延迟（毫秒） */
  estimatedDelayMs: number;
  /** 风险等级 */
  riskLevel: 'low' | 'medium' | 'high';
  /** 推荐的门限值 */
  threshold: number;
}

// =============================================================================
// 资金调度建议
// =============================================================================

/**
 * 资金调度建议类型
 */
export type FundingActionType = 'refill' | 'withdraw' | 'rebalance';

/**
 * 资金调度建议
 */
export interface FundingSuggestion {
  /** 建议类型 */
  action: FundingActionType;
  /** 源层级 */
  fromTier?: WalletTier;
  /** 目标层级 */
  toTier?: WalletTier;
  /** 建议金额 */
  amount: string;
  /** 建议原因 */
  reason: string;
  /** 优先级 */
  priority: 'low' | 'medium' | 'high' | 'critical';
  /** 生成时间 */
  generatedAt: Date;
}

// =============================================================================
// 层级统计
// =============================================================================

/**
 * 层级详细统计
 */
export interface TierStats {
  /** 层级 */
  tier: WalletTier;
  /** 钱包数量 */
  walletCount: number;
  /** 活跃钱包数 */
  activeWallets: number;
  /** 冻结钱包数 */
  frozenWallets: number;
  /** 今日签名次数 */
  todaySignCount: number;
  /** 今日签名总金额 */
  todaySignAmount: string;
  /** 今日失败次数 */
  todayFailedCount: number;
  /** 待审批数量 */
  pendingApprovals: number;
  /** 平均签名耗时（毫秒） */
  averageSignTimeMs: number;
  /** 最后签名时间 */
  lastSignAt?: Date;
}

// =============================================================================
// 冷热钱包管理器类
// =============================================================================

export class WalletTierManager {
  private wallets: Map<string, MPCWallet> = new Map();
  private tierConfigs: Map<WalletTier, TierConfig> = new Map();
  private autoTierRouting: boolean;
  private autoFunding: boolean;
  private fundingCheckIntervalMs: number;
  private fundingCheckTimer?: NodeJS.Timeout;

  private signStats = {
    today: {
      count: 0,
      amount: BigInt(0),
      failed: 0,
    },
    total: {
      count: 0,
      amount: BigInt(0),
      failed: 0,
    },
    byTier: {
      [WalletTier.HOT]: { count: 0, amount: BigInt(0), failed: 0 },
      [WalletTier.WARM]: { count: 0, amount: BigInt(0), failed: 0 },
      [WalletTier.COLD]: { count: 0, amount: BigInt(0), failed: 0 },
    },
  };

  constructor(options: WalletTierManagerOptions = {}) {
    this.autoTierRouting = options.autoTierRouting ?? true;
    this.autoFunding = options.autoFunding ?? false;
    this.fundingCheckIntervalMs = options.fundingCheckIntervalMs || 60 * 60 * 1000;

    this.initializeDefaultConfigs(options);

    if (this.autoFunding) {
      this.startFundingCheck();
    }
  }

  // =========================================================================
  // 配置管理
  // =========================================================================

  /**
   * 初始化默认配置
   */
  private initializeDefaultConfigs(options: WalletTierManagerOptions): void {
    const hotConfig: TierConfig = {
      tier: WalletTier.HOT,
      name: '热钱包',
      description: '实时签名，适用于小额高频交易',
      maxAmount: '1000000000000000000', // 1 ETH
      dailyLimit: '5000000000000000000', // 5 ETH
      txLimit: '1000000000000000000', // 1 ETH
      threshold: 2,
      totalShares: 3,
      requireApproval: false,
      signDelayMs: 0,
      targetBalance: '2000000000000000000', // 2 ETH
      minBalance: '500000000000000000', // 0.5 ETH
      autoRefill: true,
      riskLevel: 'high',
      ...options.hotConfig,
    };

    const warmConfig: TierConfig = {
      tier: WalletTier.WARM,
      name: '温钱包',
      description: '延迟签名，适用于中额交易',
      minAmount: '1000000000000000000', // 1 ETH
      maxAmount: '100000000000000000000', // 100 ETH
      dailyLimit: '500000000000000000000', // 500 ETH
      txLimit: '100000000000000000000', // 100 ETH
      threshold: 3,
      totalShares: 5,
      requireApproval: true,
      approverCount: 2,
      signDelayMs: 5 * 60 * 1000, // 5 分钟
      targetBalance: '200000000000000000000', // 200 ETH
      minBalance: '50000000000000000000', // 50 ETH
      autoRefill: true,
      riskLevel: 'medium',
      ...options.warmConfig,
    };

    const coldConfig: TierConfig = {
      tier: WalletTier.COLD,
      name: '冷钱包',
      description: '人工审批，适用于大额交易',
      minAmount: '100000000000000000000', // 100 ETH
      dailyLimit: '10000000000000000000000', // 10000 ETH
      txLimit: '5000000000000000000000', // 5000 ETH
      threshold: 5,
      totalShares: 7,
      requireApproval: true,
      approverCount: 3,
      signDelayMs: 24 * 60 * 60 * 1000, // 24 小时
      targetBalance: '10000000000000000000000', // 10000 ETH
      minBalance: '1000000000000000000000', // 1000 ETH
      autoRefill: false,
      riskLevel: 'low',
      ...options.coldConfig,
    };

    this.tierConfigs.set(WalletTier.HOT, hotConfig);
    this.tierConfigs.set(WalletTier.WARM, warmConfig);
    this.tierConfigs.set(WalletTier.COLD, coldConfig);
  }

  /**
   * 获取层级配置
   */
  getTierConfig(tier: WalletTier): TierConfig {
    const config = this.tierConfigs.get(tier);
    if (!config) {
      throw new MPCError(
        MPCErrorCode.INVALID_PARAMS,
        `未知的钱包层级: ${tier}`,
      );
    }
    return config;
  }

  /**
   * 更新层级配置
   */
  updateTierConfig(tier: WalletTier, updates: Partial<TierConfig>): TierConfig {
    const config = this.getTierConfig(tier);
    const updated: TierConfig = { ...config, ...updates };
    this.tierConfigs.set(tier, updated);
    return updated;
  }

  /**
   * 获取所有层级配置
   */
  getAllTierConfigs(): TierConfig[] {
    return [
      this.getTierConfig(WalletTier.HOT),
      this.getTierConfig(WalletTier.WARM),
      this.getTierConfig(WalletTier.COLD),
    ];
  }

  // =========================================================================
  // 钱包管理
  // =========================================================================

  /**
   * 添加钱包
   */
  addWallet(wallet: MPCWallet): void {
    this.wallets.set(wallet.id, wallet);
  }

  /**
   * 批量添加钱包
   */
  addWallets(wallets: MPCWallet[]): void {
    for (const wallet of wallets) {
      this.addWallet(wallet);
    }
  }

  /**
   * 获取钱包
   */
  getWallet(walletId: string): MPCWallet {
    const wallet = this.wallets.get(walletId);
    if (!wallet) {
      throw new MPCError(
        MPCErrorCode.WALLET_NOT_FOUND,
        `钱包不存在: ${walletId}`,
      );
    }
    return wallet;
  }

  /**
   * 查找钱包
   */
  findWallet(walletId: string): MPCWallet | undefined {
    return this.wallets.get(walletId);
  }

  /**
   * 根据地址查找钱包
   */
  findWalletByAddress(address: string): MPCWallet | undefined {
    for (const wallet of this.wallets.values()) {
      if (wallet.address.toLowerCase() === address.toLowerCase()) {
        return wallet;
      }
    }
    return undefined;
  }

  /**
   * 获取指定层级的钱包
   */
  getWalletsByTier(tier: WalletTier): MPCWallet[] {
    return Array.from(this.wallets.values()).filter((w) => w.tier === tier);
  }

  /**
   * 获取用户的所有钱包
   */
  getUserWallets(userId: string): MPCWallet[] {
    return Array.from(this.wallets.values()).filter((w) => w.userId === userId);
  }

  /**
   * 获取用户指定层级的钱包
   */
  getUserWalletsByTier(userId: string, tier: WalletTier): MPCWallet[] {
    return this.getUserWallets(userId).filter((w) => w.tier === tier);
  }

  /**
   * 更新钱包
   */
  updateWallet(walletId: string, updates: Partial<MPCWallet>): MPCWallet {
    const wallet = this.getWallet(walletId);
    const updated: MPCWallet = {
      ...wallet,
      ...updates,
      updatedAt: new Date(),
    };
    this.wallets.set(walletId, updated);
    return updated;
  }

  /**
   * 更改钱包层级
   */
  changeWalletTier(walletId: string, newTier: WalletTier): MPCWallet {
    const wallet = this.getWallet(walletId);
    if (wallet.tier === newTier) {
      return wallet;
    }
    return this.updateWallet(walletId, { tier: newTier });
  }

  /**
   * 冻结钱包
   */
  freezeWallet(walletId: string): MPCWallet {
    return this.updateWallet(walletId, { status: 'frozen' });
  }

  /**
   * 解冻钱包
   */
  unfreezeWallet(walletId: string): MPCWallet {
    return this.updateWallet(walletId, { status: 'active' });
  }

  /**
   * 关闭钱包
   */
  closeWallet(walletId: string): MPCWallet {
    return this.updateWallet(walletId, { status: 'closed' });
  }

  /**
   * 删除钱包
   */
  removeWallet(walletId: string): void {
    if (!this.wallets.has(walletId)) {
      throw new MPCError(
        MPCErrorCode.WALLET_NOT_FOUND,
        `钱包不存在: ${walletId}`,
      );
    }
    this.wallets.delete(walletId);
  }

  // =========================================================================
  // 分层路由
  // =========================================================================

  /**
   * 根据交易金额路由到合适的层级
   */
  routeByAmount(amount: string, chainType?: ChainType): TierRoutingResult {
    const amountBig = BigInt(amount);

    const hotConfig = this.getTierConfig(WalletTier.HOT);
    const warmConfig = this.getTierConfig(WalletTier.WARM);
    const coldConfig = this.getTierConfig(WalletTier.COLD);

    if (hotConfig.maxAmount && amountBig <= BigInt(hotConfig.maxAmount)) {
      return {
        tier: WalletTier.HOT,
        reason: `金额 ${amount} 在热钱包限额内（≤ ${hotConfig.maxAmount}）`,
        requireApproval: hotConfig.requireApproval,
        estimatedDelayMs: hotConfig.signDelayMs || 0,
        riskLevel: hotConfig.riskLevel,
        threshold: hotConfig.threshold,
      };
    }

    if (
      warmConfig.maxAmount &&
      amountBig <= BigInt(warmConfig.maxAmount) &&
      (!warmConfig.minAmount || amountBig >= BigInt(warmConfig.minAmount))
    ) {
      return {
        tier: WalletTier.WARM,
        reason: `金额 ${amount} 在温钱包限额内（${warmConfig.minAmount || 0} ~ ${warmConfig.maxAmount}）`,
        requireApproval: warmConfig.requireApproval,
        estimatedDelayMs: warmConfig.signDelayMs || 0,
        riskLevel: warmConfig.riskLevel,
        threshold: warmConfig.threshold,
      };
    }

    return {
      tier: WalletTier.COLD,
      reason: `金额 ${amount} 超过温钱包限额，使用冷钱包`,
      requireApproval: coldConfig.requireApproval,
      estimatedDelayMs: coldConfig.signDelayMs || 0,
      riskLevel: coldConfig.riskLevel,
      threshold: coldConfig.threshold,
    };
  }

  /**
   * 根据风险等级路由
   */
  routeByRiskLevel(
    riskLevel: 'low' | 'medium' | 'high' | 'critical',
  ): TierRoutingResult {
    switch (riskLevel) {
      case 'low':
      case 'medium': {
        const config = this.getTierConfig(WalletTier.HOT);
        return {
          tier: WalletTier.HOT,
          reason: `风险等级 ${riskLevel}，使用热钱包`,
          requireApproval: config.requireApproval,
          estimatedDelayMs: config.signDelayMs || 0,
          riskLevel: config.riskLevel,
          threshold: config.threshold,
        };
      }
      case 'high': {
        const config = this.getTierConfig(WalletTier.WARM);
        return {
          tier: WalletTier.WARM,
          reason: `风险等级 ${riskLevel}，使用温钱包`,
          requireApproval: config.requireApproval,
          estimatedDelayMs: config.signDelayMs || 0,
          riskLevel: config.riskLevel,
          threshold: config.threshold,
        };
      }
      case 'critical': {
        const config = this.getTierConfig(WalletTier.COLD);
        return {
          tier: WalletTier.COLD,
          reason: `风险等级 ${riskLevel}，使用冷钱包`,
          requireApproval: config.requireApproval,
          estimatedDelayMs: config.signDelayMs || 0,
          riskLevel: config.riskLevel,
          threshold: config.threshold,
        };
      }
    }
  }

  /**
   * 综合路由（考虑金额、风险等因素）
   */
  route(params: {
    amount: string;
    riskScore?: number;
    chainType?: ChainType;
    userTier?: string;
  }): TierRoutingResult {
    const amountResult = this.routeByAmount(params.amount, params.chainType);

    if (params.riskScore !== undefined) {
      let riskLevel: 'low' | 'medium' | 'high' | 'critical';
      if (params.riskScore < 25) riskLevel = 'low';
      else if (params.riskScore < 50) riskLevel = 'medium';
      else if (params.riskScore < 75) riskLevel = 'high';
      else riskLevel = 'critical';

      const riskResult = this.routeByRiskLevel(riskLevel);

      const tierPriority = {
        [WalletTier.HOT]: 0,
        [WalletTier.WARM]: 1,
        [WalletTier.COLD]: 2,
      };

      const higherTier =
        tierPriority[riskResult.tier] > tierPriority[amountResult.tier]
          ? riskResult.tier
          : amountResult.tier;

      const config = this.getTierConfig(higherTier);
      return {
        tier: higherTier,
        reason: `综合金额与风险评估：金额路由 ${amountResult.tier}，风险路由 ${riskResult.tier}，取较高安全层级`,
        requireApproval: config.requireApproval,
        estimatedDelayMs: config.signDelayMs || 0,
        riskLevel: config.riskLevel,
        threshold: config.threshold,
      };
    }

    return amountResult;
  }

  /**
   * 为用户选择最佳钱包
   */
  selectOptimalWallet(
    userId: string,
    params: {
      amount: string;
      chainType: ChainType;
      riskScore?: number;
    },
  ): MPCWallet | null {
    const routing = this.route(params);
    const tierWallets = this.getUserWalletsByTier(userId, routing.tier).filter(
      (w) => w.chainType === params.chainType && w.status === 'active',
    );

    if (tierWallets.length === 0) {
      return null;
    }

    return tierWallets.sort((a, b) => {
      const aTime = a.lastSignAt?.getTime() || 0;
      const bTime = b.lastSignAt?.getTime() || 0;
      return aTime - bTime;
    })[0];
  }

  // =========================================================================
  // 签名统计
  // =========================================================================

  /**
   * 记录签名
   */
  recordSignature(
    walletId: string,
    amount: string,
    success: boolean,
  ): void {
    const wallet = this.findWallet(walletId);
    if (!wallet) return;

    const amountBig = BigInt(amount);

    this.signStats.total.count++;
    this.signStats.total.amount += amountBig;
    this.signStats.today.count++;
    this.signStats.today.amount += amountBig;

    const tierStats = this.signStats.byTier[wallet.tier];
    tierStats.count++;
    tierStats.amount += amountBig;

    if (!success) {
      this.signStats.total.failed++;
      this.signStats.today.failed++;
      tierStats.failed++;
    }

    this.updateWallet(walletId, { lastSignAt: new Date() });
  }

  /**
   * 获取层级统计
   */
  getTierStats(tier: WalletTier): TierStats {
    const wallets = this.getWalletsByTier(tier);
    const config = this.getTierConfig(tier);
    const tierSignStats = this.signStats.byTier[tier];

    const activeWallets = wallets.filter((w) => w.status === 'active').length;
    const frozenWallets = wallets.filter((w) => w.status === 'frozen').length;

    const lastSignAt = wallets.reduce<Date | undefined>((latest, w) => {
      if (!w.lastSignAt) return latest;
      if (!latest) return w.lastSignAt;
      return w.lastSignAt > latest ? w.lastSignAt : latest;
    }, undefined);

    return {
      tier,
      walletCount: wallets.length,
      activeWallets,
      frozenWallets,
      todaySignCount: tierSignStats.count,
      todaySignAmount: tierSignStats.amount.toString(),
      todayFailedCount: tierSignStats.failed,
      pendingApprovals: 0,
      averageSignTimeMs: 0,
      lastSignAt,
    };
  }

  /**
   * 获取所有层级统计
   */
  getAllTierStats(): TierStats[] {
    return [
      this.getTierStats(WalletTier.HOT),
      this.getTierStats(WalletTier.WARM),
      this.getTierStats(WalletTier.COLD),
    ];
  }

  // =========================================================================
  // 资金调度
  // =========================================================================

  /**
   * 启动资金调度检查
   */
  private startFundingCheck(): void {
    this.fundingCheckTimer = setInterval(() => {
      this.checkFundingNeeds();
    }, this.fundingCheckIntervalMs) as unknown as NodeJS.Timeout;
  }

  /**
   * 检查资金需求
   */
  checkFundingNeeds(): FundingSuggestion[] {
    const suggestions: FundingSuggestion[] = [];

    const tiers = [WalletTier.HOT, WalletTier.WARM];
    for (const tier of tiers) {
      const suggestion = this.checkTierRefill(tier);
      if (suggestion) {
        suggestions.push(suggestion);
      }
    }

    return suggestions;
  }

  /**
   * 检查层级是否需要充值
   */
  private checkTierRefill(tier: WalletTier): FundingSuggestion | null {
    const config = this.getTierConfig(tier);
    if (!config.autoRefill || !config.minBalance || !config.targetBalance) {
      return null;
    }

    // 这里简化处理，实际应该检查钱包余额
    const wallets = this.getWalletsByTier(tier);
    if (wallets.length === 0) return null;

    const higherTier =
      tier === WalletTier.HOT ? WalletTier.WARM : WalletTier.COLD;
    const higherConfig = this.getTierConfig(higherTier);

    const refillAmount = BigInt(config.targetBalance) - BigInt(config.minBalance);
    const priority = this.getPriority(tier, refillAmount);

    return {
      action: 'refill',
      fromTier: higherTier,
      toTier: tier,
      amount: refillAmount.toString(),
      reason: `${config.name}余额低于最低值（${config.minBalance}），建议充值到目标余额（${config.targetBalance}）`,
      priority,
      generatedAt: new Date(),
    };
  }

  /**
   * 获取调度优先级
   */
  private getPriority(
    tier: WalletTier,
    amount: bigint,
  ): 'low' | 'medium' | 'high' | 'critical' {
    if (tier === WalletTier.HOT) {
      return 'high';
    }
    if (tier === WalletTier.WARM) {
      return 'medium';
    }
    return 'low';
  }

  /**
   * 执行资金调度（模拟）
   */
  executeFunding(suggestion: FundingSuggestion): boolean {
    console.debug(
      `执行资金调度: ${suggestion.action} ${suggestion.fromTier} -> ${suggestion.toTier} ${suggestion.amount}`,
    );
    return true;
  }

  // =========================================================================
  // 工具方法
  // =========================================================================

  /**
   * 检查层级是否支持指定金额
   */
  isAmountSupportedByTier(amount: string, tier: WalletTier): boolean {
    const config = this.getTierConfig(tier);
    const amountBig = BigInt(amount);

    if (config.minAmount && amountBig < BigInt(config.minAmount)) {
      return false;
    }
    if (config.maxAmount && amountBig > BigInt(config.maxAmount)) {
      return false;
    }
    return true;
  }

  /**
   * 获取下一个更高层级
   */
  getHigherTier(tier: WalletTier): WalletTier | null {
    switch (tier) {
      case WalletTier.HOT:
        return WalletTier.WARM;
      case WalletTier.WARM:
        return WalletTier.COLD;
      case WalletTier.COLD:
        return null;
    }
  }

  /**
   * 获取下一个更低层级
   */
  getLowerTier(tier: WalletTier): WalletTier | null {
    switch (tier) {
      case WalletTier.COLD:
        return WalletTier.WARM;
      case WalletTier.WARM:
        return WalletTier.HOT;
      case WalletTier.HOT:
        return null;
    }
  }

  /**
   * 比较两个层级的高低
   */
  compareTiers(a: WalletTier, b: WalletTier): number {
    const order = {
      [WalletTier.HOT]: 0,
      [WalletTier.WARM]: 1,
      [WalletTier.COLD]: 2,
    };
    return order[a] - order[b];
  }

  /**
   * 获取总数统计
   */
  getTotalStats() {
    return {
      totalWallets: this.wallets.size,
      hotWallets: this.getWalletsByTier(WalletTier.HOT).length,
      warmWallets: this.getWalletsByTier(WalletTier.WARM).length,
      coldWallets: this.getWalletsByTier(WalletTier.COLD).length,
      todaySignCount: this.signStats.today.count,
      todaySignAmount: this.signStats.today.amount.toString(),
      totalSignCount: this.signStats.total.count,
      totalSignAmount: this.signStats.total.amount.toString(),
    };
  }

  /**
   * 清理资源
   */
  dispose(): void {
    if (this.fundingCheckTimer) {
      clearInterval(this.fundingCheckTimer);
      this.fundingCheckTimer = undefined;
    }
  }
}
