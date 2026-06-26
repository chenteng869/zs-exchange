/**
 * Staking 质押服务
 *
 * 支持的质押类型：
 *  - 单币质押（Staking）
 *  - LP 质押（Farming）
 *  - 验证节点质押（Validator Staking）
 *  - 流动性质押（Lido 类）
 *  - 投票锁仓（veToken）
 *
 * 功能：
 *  - 质押 / 解押
 *  - 收益查询
 *  - 领取奖励
 *  - 自动复投
 *  - 解锁期管理
 *  - 验证节点管理
 *  - 委托 / 取消委托
 *  - APY 计算
 *  - 收益历史
 */

// ============================================================================
// 类型定义
// ============================================================================

export interface StakingPool {
  id: string;
  name: string;
  description: string;
  logoURI?: string;
  type: StakingPoolType;
  chain: string;
  chainId: number;
  contractAddress: string;
  stakingToken: StakingToken;
  rewardTokens: StakingToken[];
  totalStaked: string;
  totalStakedFormatted: string;
  totalStakedUsd?: string;
  apy: number;
  apyBreakdown?: ApYBreakdown;
  minStake: string;
  maxStake?: string;
  lockPeriod: number;
  unlockPeriod: number;
  earlyWithdrawPenalty: number;
  rewardRate: string;
  rewardsPerSecond?: string;
  startTimestamp: number;
  endTimestamp?: number;
  isActive: boolean;
  isVerified: boolean;
  riskLevel: 'low' | 'medium' | 'high';
  tvl?: string;
  tvlUsd?: string;
  userCount?: number;
  fee: number;
  platform: string;
  tags: string[];
}

export type StakingPoolType =
  | 'single'
  | 'lp'
  | 'validator'
  | 'liquid_staking'
  | 've_token'
  | 'launchpad';

export interface StakingToken {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  priceUsd?: string;
  logoURI?: string;
  isNative?: boolean;
}

export interface ApYBreakdown {
  baseApy: number;
  rewardApy: number;
  boostApy?: number;
  tradingFeeApy?: number;
  totalApy: number;
}

export interface UserStakingInfo {
  poolId: string;
  address: string;
  stakedAmount: string;
  stakedAmountFormatted: string;
  stakedUsd?: string;
  pendingRewards: RewardInfo[];
  totalEarned: RewardInfo[];
  stakeTimestamp: number;
  unlockTimestamp?: number;
  unlockAmount?: string;
  isStaking: boolean;
  isUnlocking: boolean;
  boostMultiplier?: number;
  lockEndTime?: number;
  veBalance?: string;
}

export interface RewardInfo {
  token: StakingToken;
  amount: string;
  amountFormatted: string;
  usdValue?: string;
}

export interface StakingTransaction {
  id: string;
  poolId: string;
  address: string;
  type: 'stake' | 'unstake' | 'claim' | 'delegate' | 'undelegate' | 'redelegate' | 'withdraw';
  amount: string;
  amountFormatted: string;
  token: StakingToken;
  txHash: string;
  timestamp: number;
  blockNumber?: number;
  status: 'pending' | 'success' | 'failed';
  unlockTime?: number;
}

export interface ValidatorInfo {
  address: string;
  name: string;
  description?: string;
  logoURI?: string;
  website?: string;
  commission: number;
  maxCommission: number;
  commissionChangeRate: number;
  totalStaked: string;
  totalStakedFormatted: string;
  totalStakedUsd?: string;
  votingPower: number;
  votingPowerPercent: number;
  status: 'active' | 'inactive' | 'jailed' | 'unbonding';
  uptime: number;
  apy: number;
  rank: number;
  delegatorCount?: number;
  minSelfDelegation?: string;
  unbondingPeriod: number;
  chainId: string;
}

export interface ValidatorDelegation {
  validatorAddress: string;
  delegatorAddress: string;
  amount: string;
  amountFormatted: string;
  usdValue?: string;
  reward: string;
  rewardFormatted: string;
  rewardUsd?: string;
  delegatedAt?: number;
}

export interface UnbondingDelegation {
  validatorAddress: string;
  delegatorAddress: string;
  amount: string;
  amountFormatted: string;
  completionTime: number;
  creationHeight?: number;
}

export interface StakingStats {
  totalPools: number;
  totalStakedUsd: string;
  avgApy: number;
  highestApy: number;
  totalRewardEarnedUsd: string;
  activePools: number;
  userCount: number;
}

export interface StakingFilterOptions {
  chain?: string;
  type?: StakingPoolType;
  minApy?: number;
  maxApy?: number;
  riskLevel?: string;
  isActive?: boolean;
  isVerified?: boolean;
  platform?: string;
  sortBy?: 'apy' | 'tvl' | 'newest' | 'popular';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}

// ============================================================================
// 示例质押池
// ============================================================================

export const STAKING_POOLS: StakingPool[] = [
  {
    id: 'eth-lido',
    name: 'Lido ETH Staking',
    description: '流动性质押 ETH，获得 stETH 收益凭证',
    type: 'liquid_staking',
    chain: 'ethereum',
    chainId: 1,
    contractAddress: '0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84',
    stakingToken: {
      address: '0x0000000000000000000000000000000000000000',
      symbol: 'ETH',
      name: 'Ethereum',
      decimals: 18,
      isNative: true,
    },
    rewardTokens: [
      {
        address: '0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84',
        symbol: 'stETH',
        name: 'Lido Staked ETH',
        decimals: 18,
      },
    ],
    totalStaked: '8500000000000000000000000',
    totalStakedFormatted: '8500000',
    apy: 3.8,
    apyBreakdown: {
      baseApy: 3.8,
      rewardApy: 0,
      totalApy: 3.8,
    },
    minStake: '10000000000000000',
    lockPeriod: 0,
    unlockPeriod: 0,
    earlyWithdrawPenalty: 0,
    rewardRate: '0',
    startTimestamp: 1609459200,
    isActive: true,
    isVerified: true,
    riskLevel: 'low',
    tvl: '8500000000',
    userCount: 300000,
    fee: 0.1,
    platform: 'Lido',
    tags: ['Liquid Staking', 'ETH', 'Blue Chip'],
  },
  {
    id: 'bnb-venus',
    name: 'Venus BNB Supply',
    description: '在 Venus 协议中供应 BNB 赚取利息',
    type: 'single',
    chain: 'bsc',
    chainId: 56,
    contractAddress: '0xA07c5b74C9B40447a954e1466938b865b6BBea36',
    stakingToken: {
      address: '0x0000000000000000000000000000000000000000',
      symbol: 'BNB',
      name: 'BNB',
      decimals: 18,
      isNative: true,
    },
    rewardTokens: [
      {
        address: '0xcF6BB5389c92Bdda8a3747Ddb454cB7a64626C63',
        symbol: 'XVS',
        name: 'Venus',
        decimals: 18,
      },
    ],
    totalStaked: '500000000000000000000000',
    totalStakedFormatted: '500000',
    apy: 5.2,
    apyBreakdown: {
      baseApy: 2.5,
      rewardApy: 2.7,
      totalApy: 5.2,
    },
    minStake: '10000000000000000',
    lockPeriod: 0,
    unlockPeriod: 0,
    earlyWithdrawPenalty: 0,
    rewardRate: '0',
    startTimestamp: 1627776000,
    isActive: true,
    isVerified: true,
    riskLevel: 'medium',
    tvl: '150000000',
    userCount: 80000,
    fee: 0,
    platform: 'Venus',
    tags: ['Lending', 'BNB', 'DeFi'],
  },
  {
    id: 'matic-aave',
    name: 'Aave Polygon MATIC',
    description: '在 Aave 上存款 MATIC',
    type: 'single',
    chain: 'polygon',
    chainId: 137,
    contractAddress: '0x6d80113e533a2C0fe82EaBD35f1875DcEA89Ea97',
    stakingToken: {
      address: '0x0000000000000000000000000000000000000000',
      symbol: 'MATIC',
      name: 'Polygon',
      decimals: 18,
      isNative: true,
    },
    rewardTokens: [
      {
        address: '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619',
        symbol: 'WETH',
        name: 'Wrapped Ether',
        decimals: 18,
      },
    ],
    totalStaked: '30000000000000000000000000',
    totalStakedFormatted: '30000000',
    apy: 4.5,
    apyBreakdown: {
      baseApy: 2.8,
      rewardApy: 1.7,
      totalApy: 4.5,
    },
    minStake: '1000000000000000000',
    lockPeriod: 0,
    unlockPeriod: 0,
    earlyWithdrawPenalty: 0,
    rewardRate: '0',
    startTimestamp: 1625097600,
    isActive: true,
    isVerified: true,
    riskLevel: 'low',
    tvl: '24000000',
    userCount: 120000,
    fee: 0,
    platform: 'Aave',
    tags: ['Lending', 'MATIC', 'DeFi'],
  },
  {
    id: 'cake-pool',
    name: 'Cake Pool',
    description: '质押 CAKE 赚取更多 CAKE',
    type: 'single',
    chain: 'bsc',
    chainId: 56,
    contractAddress: '0x73feaa1eE314F8c655E354234017bE2193C9E24E',
    stakingToken: {
      address: '0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82',
      symbol: 'CAKE',
      name: 'PancakeSwap',
      decimals: 18,
    },
    rewardTokens: [
      {
        address: '0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82',
        symbol: 'CAKE',
        name: 'PancakeSwap',
        decimals: 18,
      },
    ],
    totalStaked: '250000000000000000000000000',
    totalStakedFormatted: '250000000',
    apy: 12.5,
    apyBreakdown: {
      baseApy: 12.5,
      rewardApy: 0,
      totalApy: 12.5,
    },
    minStake: '1000000000000000000',
    lockPeriod: 0,
    unlockPeriod: 0,
    earlyWithdrawPenalty: 0,
    rewardRate: '0',
    startTimestamp: 1617235200,
    isActive: true,
    isVerified: true,
    riskLevel: 'medium',
    tvl: '375000000',
    userCount: 500000,
    fee: 0,
    platform: 'PancakeSwap',
    tags: ['DEX', 'CAKE', 'Yield'],
  },
];

// ============================================================================
// 示例验证人
// ============================================================================

export const COSMOS_VALIDATORS: ValidatorInfo[] = [
  {
    address: 'cosmosvaloper1sxx9mszve0gaedz5ld7qdkjkfv8z992ax69k08',
    name: 'Binance Staking',
    description: '全球最大的加密货币交易所',
    commission: 0.05,
    maxCommission: 0.1,
    commissionChangeRate: 0.01,
    totalStaked: '35000000000000',
    totalStakedFormatted: '35000000',
    votingPower: 5.2,
    votingPowerPercent: 5.2,
    status: 'active',
    uptime: 99.98,
    apy: 12.5,
    rank: 1,
    delegatorCount: 150000,
    unbondingPeriod: 21,
    chainId: 'cosmoshub-4',
  },
  {
    address: 'cosmosvaloper1sjllsnramtg3ewxqwwrwjxfgc4n4ef9u2lcd2e',
    name: 'Everstake',
    description: '专业的质押服务提供商',
    commission: 0.05,
    maxCommission: 0.08,
    commissionChangeRate: 0.005,
    totalStaked: '28000000000000',
    totalStakedFormatted: '28000000',
    votingPower: 4.2,
    votingPowerPercent: 4.2,
    status: 'active',
    uptime: 99.95,
    apy: 12.8,
    rank: 2,
    delegatorCount: 120000,
    unbondingPeriod: 21,
    chainId: 'cosmoshub-4',
  },
];

// ============================================================================
// Staking 服务
// ============================================================================

export class StakingService {
  private pools: Map<string, StakingPool> = new Map();
  private userStaking: Map<string, Map<string, UserStakingInfo>> = new Map();
  private validators: Map<string, ValidatorInfo[]> = new Map();
  private delegations: Map<string, ValidatorDelegation[]> = new Map();
  private transactions: StakingTransaction[] = [];
  private autoCompound: Map<string, Set<string>> = new Map();
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private cacheTTL: number = 60 * 1000;

  constructor() {
    this.initializePools();
  }

  private initializePools(): void {
    for (const pool of STAKING_POOLS) {
      this.pools.set(pool.id, pool);
    }
  }

  // ========================================================================
  // 质押池管理
  // ========================================================================

  /**
   * 获取所有质押池
   */
  getPools(options: StakingFilterOptions = {}): { pools: StakingPool[]; total: number } {
    let pools = Array.from(this.pools.values());

    if (options.chain) {
      pools = pools.filter((p) => p.chain === options.chain);
    }
    if (options.type) {
      pools = pools.filter((p) => p.type === options.type);
    }
    if (options.minApy !== undefined) {
      pools = pools.filter((p) => p.apy >= options.minApy!);
    }
    if (options.maxApy !== undefined) {
      pools = pools.filter((p) => p.apy <= options.maxApy!);
    }
    if (options.riskLevel) {
      pools = pools.filter((p) => p.riskLevel === options.riskLevel);
    }
    if (options.isActive !== undefined) {
      pools = pools.filter((p) => p.isActive === options.isActive);
    }
    if (options.isVerified !== undefined) {
      pools = pools.filter((p) => p.isVerified === options.isVerified);
    }
    if (options.platform) {
      pools = pools.filter((p) => p.platform === options.platform);
    }

    const sortBy = options.sortBy || 'apy';
    const sortOrder = options.sortOrder || 'desc';
    pools.sort((a, b) => {
      let diff = 0;
      switch (sortBy) {
        case 'apy':
          diff = a.apy - b.apy;
          break;
        case 'tvl':
          diff = parseFloat(a.tvl || '0') - parseFloat(b.tvl || '0');
          break;
        case 'newest':
          diff = a.startTimestamp - b.startTimestamp;
          break;
        case 'popular':
          diff = (a.userCount || 0) - (b.userCount || 0);
          break;
      }
      return sortOrder === 'desc' ? -diff : diff;
    });

    const total = pools.length;
    const page = options.page || 1;
    const pageSize = options.pageSize || 20;
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    pools = pools.slice(start, end);

    return { pools, total };
  }

  /**
   * 获取单个质押池
   */
  getPool(poolId: string): StakingPool | undefined {
    return this.pools.get(poolId);
  }

  /**
   * 添加质押池
   */
  addPool(pool: StakingPool): void {
    this.pools.set(pool.id, pool);
  }

  // ========================================================================
  // 用户质押信息
  // ========================================================================

  /**
   * 获取用户质押信息
   */
  async getUserStakingInfo(address: string, poolId: string): Promise<UserStakingInfo | null> {
    const cacheKey = `user_staking:${address}:${poolId}`;
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      return cached.data;
    }

    const userPools = this.userStaking.get(address);
    const info = userPools?.get(poolId);
    if (info) {
      this.cache.set(cacheKey, { data: info, timestamp: Date.now() });
      return info;
    }

    const pool = this.pools.get(poolId);
    if (!pool) return null;

    const newInfo: UserStakingInfo = {
      poolId,
      address,
      stakedAmount: '0',
      stakedAmountFormatted: '0',
      pendingRewards: pool.rewardTokens.map((t) => ({
        token: t,
        amount: '0',
        amountFormatted: '0',
      })),
      totalEarned: pool.rewardTokens.map((t) => ({
        token: t,
        amount: '0',
        amountFormatted: '0',
      })),
      stakeTimestamp: 0,
      isStaking: false,
      isUnlocking: false,
    };

    return newInfo;
  }

  /**
   * 获取用户所有质押
   */
  async getUserAllStaking(address: string): Promise<UserStakingInfo[]> {
    const userPools = this.userStaking.get(address);
    if (!userPools) return [];
    return Array.from(userPools.values());
  }

  /**
   * 质押
   */
  async stake(
    address: string,
    poolId: string,
    amount: string
  ): Promise<StakingTransaction> {
    const pool = this.pools.get(poolId);
    if (!pool) throw new Error('Pool not found');
    if (!pool.isActive) throw new Error('Pool is not active');

    const tx: StakingTransaction = {
      id: `stake_${Date.now()}`,
      poolId,
      address,
      type: 'stake',
      amount,
      amountFormatted: this.formatAmount(amount, pool.stakingToken.decimals),
      token: pool.stakingToken,
      txHash: '0x' + '0'.repeat(64),
      timestamp: Date.now(),
      status: 'pending',
    };

    this.transactions.unshift(tx);

    let userPools = this.userStaking.get(address);
    if (!userPools) {
      userPools = new Map();
      this.userStaking.set(address, userPools);
    }

    let info = userPools.get(poolId);
    if (!info) {
      info = {
        poolId,
        address,
        stakedAmount: '0',
        stakedAmountFormatted: '0',
        pendingRewards: pool.rewardTokens.map((t) => ({
          token: t,
          amount: '0',
          amountFormatted: '0',
        })),
        totalEarned: pool.rewardTokens.map((t) => ({
          token: t,
          amount: '0',
          amountFormatted: '0',
        })),
        stakeTimestamp: Date.now(),
        isStaking: true,
        isUnlocking: false,
      };
      userPools.set(poolId, info);
    }

    info.stakedAmount = (BigInt(info.stakedAmount) + BigInt(amount)).toString();
    info.stakedAmountFormatted = this.formatAmount(info.stakedAmount, pool.stakingToken.decimals);
    info.isStaking = true;

    tx.status = 'success';
    return tx;
  }

  /**
   * 解押
   */
  async unstake(
    address: string,
    poolId: string,
    amount: string
  ): Promise<StakingTransaction> {
    const pool = this.pools.get(poolId);
    if (!pool) throw new Error('Pool not found');

    const userPools = this.userStaking.get(address);
    const info = userPools?.get(poolId);
    if (!info || BigInt(info.stakedAmount) < BigInt(amount)) {
      throw new Error('Insufficient staked amount');
    }

    const tx: StakingTransaction = {
      id: `unstake_${Date.now()}`,
      poolId,
      address,
      type: 'unstake',
      amount,
      amountFormatted: this.formatAmount(amount, pool.stakingToken.decimals),
      token: pool.stakingToken,
      txHash: '0x' + '0'.repeat(64),
      timestamp: Date.now(),
      status: 'pending',
      unlockTime: Date.now() + pool.unlockPeriod * 24 * 60 * 60 * 1000,
    };

    this.transactions.unshift(tx);

    info.stakedAmount = (BigInt(info.stakedAmount) - BigInt(amount)).toString();
    info.stakedAmountFormatted = this.formatAmount(info.stakedAmount, pool.stakingToken.decimals);
    info.isUnlocking = true;
    info.unlockTimestamp = tx.unlockTime;
    info.unlockAmount = amount;

    if (BigInt(info.stakedAmount) === 0n) {
      info.isStaking = false;
    }

    tx.status = 'success';
    return tx;
  }

  /**
   * 领取奖励
   */
  async claimRewards(address: string, poolId: string): Promise<StakingTransaction> {
    const pool = this.pools.get(poolId);
    if (!pool) throw new Error('Pool not found');

    const tx: StakingTransaction = {
      id: `claim_${Date.now()}`,
      poolId,
      address,
      type: 'claim',
      amount: '0',
      amountFormatted: '0',
      token: pool.rewardTokens[0],
      txHash: '0x' + '0'.repeat(64),
      timestamp: Date.now(),
      status: 'pending',
    };

    this.transactions.unshift(tx);

    const userPools = this.userStaking.get(address);
    const info = userPools?.get(poolId);
    if (info) {
      for (let i = 0; i < info.pendingRewards.length; i++) {
        info.totalEarned[i].amount = (
          BigInt(info.totalEarned[i].amount) + BigInt(info.pendingRewards[i].amount)
        ).toString();
        info.totalEarned[i].amountFormatted = this.formatAmount(
          info.totalEarned[i].amount,
          info.totalEarned[i].token.decimals
        );
        info.pendingRewards[i].amount = '0';
        info.pendingRewards[i].amountFormatted = '0';
      }
    }

    tx.status = 'success';
    return tx;
  }

  // ========================================================================
  // 自动复投
  // ========================================================================

  /**
   * 启用自动复投
   */
  enableAutoCompound(address: string, poolId: string): boolean {
    let pools = this.autoCompound.get(address);
    if (!pools) {
      pools = new Set();
      this.autoCompound.set(address, pools);
    }
    pools.add(poolId);
    return true;
  }

  /**
   * 禁用自动复投
   */
  disableAutoCompound(address: string, poolId: string): boolean {
    const pools = this.autoCompound.get(address);
    if (!pools) return false;
    return pools.delete(poolId);
  }

  /**
   * 检查是否启用自动复投
   */
  isAutoCompoundEnabled(address: string, poolId: string): boolean {
    return this.autoCompound.get(address)?.has(poolId) ?? false;
  }

  // ========================================================================
  // 验证人管理（PoS 链）
  // ========================================================================

  /**
   * 获取验证人列表
   */
  async getValidators(chainId: string): Promise<ValidatorInfo[]> {
    const cacheKey = `validators:${chainId}`;
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      return cached.data;
    }

    let validators = this.validators.get(chainId) || [];
    if (validators.length === 0 && chainId === 'cosmoshub-4') {
      validators = COSMOS_VALIDATORS;
      this.validators.set(chainId, validators);
    }

    this.cache.set(cacheKey, { data: validators, timestamp: Date.now() });
    return validators;
  }

  /**
   * 委托
   */
  async delegate(
    delegatorAddress: string,
    validatorAddress: string,
    amount: string,
    chainId: string
  ): Promise<StakingTransaction> {
    const tx: StakingTransaction = {
      id: `delegate_${Date.now()}`,
      poolId: validatorAddress,
      address: delegatorAddress,
      type: 'delegate',
      amount,
      amountFormatted: amount,
      token: { address: '', symbol: 'ATOM', name: 'Cosmos', decimals: 6 },
      txHash: '0x' + '0'.repeat(64),
      timestamp: Date.now(),
      status: 'pending',
    };

    this.transactions.unshift(tx);
    tx.status = 'success';
    return tx;
  }

  /**
   * 取消委托
   */
  async undelegate(
    delegatorAddress: string,
    validatorAddress: string,
    amount: string,
    chainId: string
  ): Promise<StakingTransaction> {
    const tx: StakingTransaction = {
      id: `undelegate_${Date.now()}`,
      poolId: validatorAddress,
      address: delegatorAddress,
      type: 'undelegate',
      amount,
      amountFormatted: amount,
      token: { address: '', symbol: 'ATOM', name: 'Cosmos', decimals: 6 },
      txHash: '0x' + '0'.repeat(64),
      timestamp: Date.now(),
      status: 'pending',
      unlockTime: Date.now() + 21 * 24 * 60 * 60 * 1000,
    };

    this.transactions.unshift(tx);
    tx.status = 'success';
    return tx;
  }

  /**
   * 获取委托信息
   */
  async getDelegations(
    delegatorAddress: string,
    chainId: string
  ): Promise<ValidatorDelegation[]> {
    return this.delegations.get(delegatorAddress) || [];
  }

  // ========================================================================
  // 交易历史
  // ========================================================================

  getTransactions(
    address?: string,
    poolId?: string,
    type?: string,
    page: number = 1,
    pageSize: number = 20
  ): { transactions: StakingTransaction[]; total: number } {
    let transactions = [...this.transactions];

    if (address) {
      transactions = transactions.filter((t) => t.address === address);
    }
    if (poolId) {
      transactions = transactions.filter((t) => t.poolId === poolId);
    }
    if (type) {
      transactions = transactions.filter((t) => t.type === type);
    }

    const total = transactions.length;
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    transactions = transactions.slice(start, end);

    return { transactions, total };
  }

  // ========================================================================
  // 统计
  // ========================================================================

  getStats(): StakingStats {
    const pools = Array.from(this.pools.values());
    const activePools = pools.filter((p) => p.isActive);
    const totalStakedUsd = pools.reduce(
      (sum, p) => sum + parseFloat(p.tvl || '0'),
      0
    );
    const avgApy = activePools.length > 0
      ? activePools.reduce((sum, p) => sum + p.apy, 0) / activePools.length
      : 0;
    const highestApy = Math.max(...pools.map((p) => p.apy));

    return {
      totalPools: pools.length,
      totalStakedUsd: totalStakedUsd.toFixed(2),
      avgApy,
      highestApy,
      totalRewardEarnedUsd: '0',
      activePools: activePools.length,
      userCount: pools.reduce((sum, p) => sum + (p.userCount || 0), 0),
    };
  }

  /**
   * 计算 APY
   */
  calculateApy(
    rewardRatePerSecond: string,
    totalStaked: string,
    rewardTokenPrice: number,
    stakingTokenPrice: number
  ): number {
    const rewardRate = parseFloat(rewardRatePerSecond);
    const staked = parseFloat(totalStaked);
    if (staked === 0) return 0;

    const yearReward = rewardRate * 365 * 24 * 60 * 60;
    const apy = (yearReward * rewardTokenPrice) / (staked * stakingTokenPrice) * 100;
    return apy;
  }

  /**
   * 预估收益
   */
  estimateRewards(
    poolId: string,
    amount: string,
    days: number = 365
  ): RewardInfo[] {
    const pool = this.pools.get(poolId);
    if (!pool) return [];

    const dailyRate = pool.apy / 100 / 365;
    const rewardAmount = parseFloat(amount) * dailyRate * days;

    return pool.rewardTokens.map((token) => ({
      token,
      amount: Math.floor(rewardAmount * 10 ** token.decimals).toString(),
      amountFormatted: rewardAmount.toFixed(token.decimals),
    }));
  }

  // ========================================================================
  // 工具函数
  // ========================================================================

  private formatAmount(amount: string, decimals: number): string {
    const bigInt = BigInt(amount);
    const divisor = 10n ** BigInt(decimals);
    const integer = bigInt / divisor;
    const remainder = bigInt % divisor;
    const remainderStr = remainder.toString().padStart(decimals, '0');
    let trimmed = remainderStr.replace(/0+$/, '');
    if (trimmed.length > 6) trimmed = trimmed.slice(0, 6);
    return trimmed ? `${integer}.${trimmed}` : integer.toString();
  }

  /**
   * 清除缓存
   */
  clearCache(): void {
    this.cache.clear();
  }
}

// ============================================================================
// 默认导出
// ============================================================================

export default {
  StakingService,
  STAKING_POOLS,
  COSMOS_VALIDATORS,
};
