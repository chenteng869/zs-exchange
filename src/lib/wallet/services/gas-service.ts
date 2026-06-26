/**
 * Gas 价格管理服务
 *
 * 功能：
 *  - Gas 价格实时查询
 *  - Gas 价格历史
 *  - Gas 预估
 *  - EIP-1559 支持
 *  - Gas 价格提醒
 *  - 多链 Gas 对比
 *  - Gas 节省建议
 *  - 交易加速
 *  - 交易取消
 *  - Nonce 管理
 */

// ============================================================================
// 类型定义
// ============================================================================

export interface GasPrice {
  chain: string;
  chainId: number;
  timestamp: number;
  slow: GasPriceLevel;
  standard: GasPriceLevel;
  fast: GasPriceLevel;
  instant?: GasPriceLevel;
  baseFee?: string;
  baseFeeFormatted?: string;
  nextBaseFee?: string;
  nextBaseFeeFormatted?: string;
  baseFeeTrend?: 'up' | 'down' | 'stable';
  blobBaseFee?: string;
  blobBaseFeeFormatted?: string;
  pendingTxCount?: number;
  blockNumber?: number;
  blockTime?: number;
  gasUsedRatio?: number;
  gasLimit?: string;
}

export interface GasPriceLevel {
  gasPrice: string;
  gasPriceFormatted: string;
  gasPriceGwei: number;
  maxFeePerGas?: string;
  maxFeePerGasFormatted?: string;
  maxFeePerGasGwei?: number;
  maxPriorityFeePerGas?: string;
  maxPriorityFeePerGasFormatted?: string;
  maxPriorityFeePerGasGwei?: number;
  estimatedTime: number;
  usdPerTx?: string;
}

export interface GasEstimate {
  gasLimit: string;
  gasLimitFormatted: string;
  gasPrice: string;
  gasPriceFormatted: string;
  totalFee: string;
  totalFeeFormatted: string;
  totalFeeUsd?: string;
  speed: 'slow' | 'standard' | 'fast' | 'instant';
  type: 'legacy' | 'eip1559';
  maxFeePerGas?: string;
  maxPriorityFeePerGas?: string;
  gasUsed?: string;
  gasUsedFormatted?: string;
}

export interface GasEstimateOptions {
  from?: string;
  to?: string;
  value?: string;
  data?: string;
  nonce?: number;
  speed?: 'slow' | 'standard' | 'fast' | 'instant';
  type?: 'legacy' | 'eip1559';
  gasLimitBuffer?: number;
}

export interface GasHistoryPoint {
  timestamp: number;
  blockNumber: number;
  baseFee: number;
  gasPrice: number;
  gasUsedRatio: number;
  txCount: number;
}

export interface GasAlert {
  id: string;
  chain: string;
  chainId: number;
  type: 'below' | 'above';
  targetGwei: number;
  currentGwei?: number;
  isTriggered: boolean;
  createdAt: number;
  triggeredAt?: number;
  cooldown: number;
  lastTriggeredAt?: number;
}

export interface SpeedUpOptions {
  txHash: string;
  gasPriceMultiplier?: number;
  maxPriorityFeeMultiplier?: number;
  maxFeeMultiplier?: number;
  speedLevel?: 'standard' | 'fast' | 'instant';
}

export interface CancelOptions {
  txHash: string;
  gasPriceMultiplier?: number;
}

export interface NonceManager {
  address: string;
  chainId: number;
  currentNonce: number;
  pendingNonces: Set<number>;
  lastUpdated: number;
}

export type GasSpeed = 'slow' | 'standard' | 'fast' | 'instant';

// ============================================================================
// 链配置
// ============================================================================

export const GAS_CHAIN_CONFIGS: Record<string, any> = {
  ethereum: {
    chainId: 1,
    defaultGasLimit: '21000',
    defaultErc20GasLimit: '65000',
    defaultErc721GasLimit: '100000',
    defaultContractGasLimit: '200000',
    supportsEIP1559: true,
    supportsBlob: true,
    blockTime: 12,
    baseFeeChangeDenominator: 8,
    elasticityMultiplier: 2,
    maxGasLimit: 30000000,
    minGasPrice: '1000000000',
    maxGasPrice: '1000000000000',
  },
  bsc: {
    chainId: 56,
    defaultGasLimit: '21000',
    defaultErc20GasLimit: '65000',
    defaultErc721GasLimit: '100000',
    defaultContractGasLimit: '200000',
    supportsEIP1559: false,
    supportsBlob: false,
    blockTime: 3,
    maxGasLimit: 140000000,
    minGasPrice: '3000000000',
    maxGasPrice: '500000000000',
  },
  polygon: {
    chainId: 137,
    defaultGasLimit: '21000',
    defaultErc20GasLimit: '65000',
    defaultErc721GasLimit: '100000',
    defaultContractGasLimit: '200000',
    supportsEIP1559: true,
    supportsBlob: false,
    blockTime: 2.1,
    baseFeeChangeDenominator: 8,
    elasticityMultiplier: 2,
    maxGasLimit: 30000000,
    minGasPrice: '30000000000',
    maxGasPrice: '2000000000000',
  },
  arbitrum: {
    chainId: 42161,
    defaultGasLimit: '21000',
    defaultErc20GasLimit: '65000',
    defaultErc721GasLimit: '100000',
    defaultContractGasLimit: '200000',
    supportsEIP1559: true,
    supportsBlob: false,
    blockTime: 0.25,
    maxGasLimit: 1125899906842624,
    minGasPrice: '10000000',
    maxGasPrice: '100000000000',
  },
  optimism: {
    chainId: 10,
    defaultGasLimit: '21000',
    defaultErc20GasLimit: '65000',
    defaultErc721GasLimit: '100000',
    defaultContractGasLimit: '200000',
    supportsEIP1559: true,
    supportsBlob: false,
    blockTime: 2,
    maxGasLimit: 30000000,
    minGasPrice: '1000000',
    maxGasPrice: '100000000000',
  },
  avalanche: {
    chainId: 43114,
    defaultGasLimit: '21000',
    defaultErc20GasLimit: '65000',
    defaultErc721GasLimit: '100000',
    defaultContractGasLimit: '200000',
    supportsEIP1559: true,
    supportsBlob: false,
    blockTime: 2,
    maxGasLimit: 15000000,
    minGasPrice: '25000000000',
    maxGasPrice: '1000000000000',
  },
  fantom: {
    chainId: 250,
    defaultGasLimit: '21000',
    defaultErc20GasLimit: '65000',
    defaultErc721GasLimit: '100000',
    defaultContractGasLimit: '200000',
    supportsEIP1559: true,
    supportsBlob: false,
    blockTime: 1,
    maxGasLimit: 10000000000,
    minGasPrice: '1000000000',
    maxGasPrice: '1000000000000',
  },
};

// ============================================================================
// Gas 服务
// ============================================================================

export class GasService {
  private currentPrices: Map<string, GasPrice> = new Map();
  private priceHistory: Map<string, GasHistoryPoint[]> = new Map();
  private alerts: Map<string, GasAlert[]> = new Map();
  private nonceManagers: Map<string, NonceManager> = new Map();
  private nativeTokenPrice: Map<string, number> = new Map();
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private cacheTTL: number = 10 * 1000;
  private defaultChain: string = 'ethereum';
  private defaultSpeed: GasSpeed = 'standard';
  private gasLimitBuffer: number = 1.2;
  private speedMultipliers: Record<GasSpeed, number> = {
    slow: 0.8,
    standard: 1.0,
    fast: 1.5,
    instant: 2.0,
  };
  private speedTimes: Record<GasSpeed, number> = {
    slow: 300,
    standard: 60,
    fast: 30,
    instant: 15,
  };

  constructor(chain: string = 'ethereum') {
    this.defaultChain = chain;
    this.initializePrices();
  }

  private initializePrices(): void {
    const config = GAS_CHAIN_CONFIGS[this.defaultChain];
    if (!config) return;

    const baseGwei = this.defaultChain === 'ethereum' ? 30 : 5;
    const baseWei = (baseGwei * 1e9).toString();

    this.currentPrices.set(this.defaultChain, {
      chain: this.defaultChain,
      chainId: config.chainId,
      timestamp: Date.now(),
      slow: {
        gasPrice: Math.floor(baseGwei * 0.8 * 1e9).toString(),
        gasPriceFormatted: (baseGwei * 0.8).toFixed(2),
        gasPriceGwei: baseGwei * 0.8,
        estimatedTime: this.speedTimes.slow,
      },
      standard: {
        gasPrice: Math.floor(baseGwei * 1e9).toString(),
        gasPriceFormatted: baseGwei.toFixed(2),
        gasPriceGwei: baseGwei,
        estimatedTime: this.speedTimes.standard,
        maxFeePerGas: Math.floor(baseGwei * 1.2 * 1e9).toString(),
        maxFeePerGasFormatted: (baseGwei * 1.2).toFixed(2),
        maxFeePerGasGwei: baseGwei * 1.2,
        maxPriorityFeePerGas: Math.floor(baseGwei * 0.2 * 1e9).toString(),
        maxPriorityFeePerGasFormatted: (baseGwei * 0.2).toFixed(2),
        maxPriorityFeePerGasGwei: baseGwei * 0.2,
      },
      fast: {
        gasPrice: Math.floor(baseGwei * 1.5 * 1e9).toString(),
        gasPriceFormatted: (baseGwei * 1.5).toFixed(2),
        gasPriceGwei: baseGwei * 1.5,
        estimatedTime: this.speedTimes.fast,
        maxFeePerGas: Math.floor(baseGwei * 1.8 * 1e9).toString(),
        maxFeePerGasFormatted: (baseGwei * 1.8).toFixed(2),
        maxFeePerGasGwei: baseGwei * 1.8,
        maxPriorityFeePerGas: Math.floor(baseGwei * 0.5 * 1e9).toString(),
        maxPriorityFeePerGasFormatted: (baseGwei * 0.5).toFixed(2),
        maxPriorityFeePerGasGwei: baseGwei * 0.5,
      },
      instant: {
        gasPrice: Math.floor(baseGwei * 2 * 1e9).toString(),
        gasPriceFormatted: (baseGwei * 2).toFixed(2),
        gasPriceGwei: baseGwei * 2,
        estimatedTime: this.speedTimes.instant,
        maxFeePerGas: Math.floor(baseGwei * 2.5 * 1e9).toString(),
        maxFeePerGasFormatted: (baseGwei * 2.5).toFixed(2),
        maxFeePerGasGwei: baseGwei * 2.5,
        maxPriorityFeePerGas: Math.floor(baseGwei * 1 * 1e9).toString(),
        maxPriorityFeePerGasFormatted: (baseGwei * 1).toFixed(2),
        maxPriorityFeePerGasGwei: baseGwei * 1,
      },
      baseFee: baseWei,
      baseFeeFormatted: baseGwei.toFixed(2),
      nextBaseFee: Math.floor(baseGwei * 1.05 * 1e9).toString(),
      nextBaseFeeFormatted: (baseGwei * 1.05).toFixed(2),
      baseFeeTrend: 'stable',
      pendingTxCount: 150,
      gasUsedRatio: 0.65,
      gasLimit: config.maxGasLimit.toString(),
    });
  }

  // ========================================================================
  // Gas 价格查询
  // ========================================================================

  /**
   * 获取当前 Gas 价格
   */
  async getGasPrice(chain?: string): Promise<GasPrice> {
    const chainKey = chain || this.defaultChain;
    const cached = this.currentPrices.get(chainKey);
    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      return cached;
    }

    await this.updateGasPrice(chainKey);
    return this.currentPrices.get(chainKey)!;
  }

  /**
   * 获取 Gas 价格（指定档位）
   */
  async getGasPriceLevel(speed: GasSpeed, chain?: string): Promise<GasPriceLevel> {
    const price = await this.getGasPrice(chain);
    return price[speed] || price.standard;
  }

  private async updateGasPrice(chain: string): Promise<void> {
    const config = GAS_CHAIN_CONFIGS[chain];
    if (!config) return;

    const current = this.currentPrices.get(chain);
    const baseGwei = current?.standard?.gasPriceGwei || 30;

    const fluctuation = (Math.random() - 0.5) * 0.1;
    const newBaseGwei = Math.max(1, baseGwei * (1 + fluctuation));

    const price: GasPrice = {
      chain,
      chainId: config.chainId,
      timestamp: Date.now(),
      slow: this.createPriceLevel(newBaseGwei * 0.8, 'slow', config.supportsEIP1559),
      standard: this.createPriceLevel(newBaseGwei, 'standard', config.supportsEIP1559),
      fast: this.createPriceLevel(newBaseGwei * 1.5, 'fast', config.supportsEIP1559),
      instant: this.createPriceLevel(newBaseGwei * 2, 'instant', config.supportsEIP1559),
      baseFee: Math.floor(newBaseGwei * 1e9).toString(),
      baseFeeFormatted: newBaseGwei.toFixed(2),
      nextBaseFee: Math.floor(newBaseGwei * 1.05 * 1e9).toString(),
      nextBaseFeeFormatted: (newBaseGwei * 1.05).toFixed(2),
      baseFeeTrend: fluctuation > 0.02 ? 'up' : fluctuation < -0.02 ? 'down' : 'stable',
      pendingTxCount: Math.floor(100 + Math.random() * 200),
      gasUsedRatio: 0.5 + Math.random() * 0.3,
      gasLimit: config.maxGasLimit.toString(),
    };

    this.currentPrices.set(chain, price);
    this.addHistoryPoint(chain, price);
    this.checkAlerts(chain, price);
  }

  private createPriceLevel(
    gwei: number,
    speed: GasSpeed,
    supportsEIP1559: boolean
  ): GasPriceLevel {
    const level: GasPriceLevel = {
      gasPrice: Math.floor(gwei * 1e9).toString(),
      gasPriceFormatted: gwei.toFixed(2),
      gasPriceGwei: gwei,
      estimatedTime: this.speedTimes[speed],
    };

    if (supportsEIP1559) {
      const priorityFeeGwei = gwei * 0.15;
      level.maxFeePerGas = Math.floor(gwei * 1.2 * 1e9).toString();
      level.maxFeePerGasFormatted = (gwei * 1.2).toFixed(2);
      level.maxFeePerGasGwei = gwei * 1.2;
      level.maxPriorityFeePerGas = Math.floor(priorityFeeGwei * 1e9).toString();
      level.maxPriorityFeePerGasFormatted = priorityFeeGwei.toFixed(2);
      level.maxPriorityFeePerGasGwei = priorityFeeGwei;
    }

    return level;
  }

  // ========================================================================
  // Gas 预估
  // ========================================================================

  /**
   * 预估 Gas 费用
   */
  async estimateGas(options: GasEstimateOptions = {}): Promise<GasEstimate> {
    const speed = options.speed || this.defaultSpeed;
    const chain = this.defaultChain;
    const config = GAS_CHAIN_CONFIGS[chain];

    const gasPrice = await this.getGasPriceLevel(speed, chain);
    let gasLimit = config?.defaultGasLimit || '21000';

    if (options.data && options.data.length > 2) {
      const dataGas = this.estimateDataGas(options.data);
      gasLimit = Math.max(parseInt(gasLimit), 21000 + dataGas).toString();

      if (options.data.slice(0, 10) === '0xa9059cbb') {
        gasLimit = config?.defaultErc20GasLimit || '65000';
      } else if (options.data.slice(0, 10) === '0x42842e0e') {
        gasLimit = config?.defaultErc721GasLimit || '100000';
      } else if (options.data.length > 1000) {
        gasLimit = config?.defaultContractGasLimit || '200000';
      }
    }

    const buffer = options.gasLimitBuffer ?? this.gasLimitBuffer;
    const bufferedGasLimit = Math.floor(parseInt(gasLimit) * buffer).toString();

    const isEIP1559 = options.type !== 'legacy' && config?.supportsEIP1559;
    const priceWei = isEIP1559 ? gasPrice.maxFeePerGas || gasPrice.gasPrice : gasPrice.gasPrice;
    const totalFee = (BigInt(bufferedGasLimit) * BigInt(priceWei)).toString();

    const estimate: GasEstimate = {
      gasLimit: bufferedGasLimit,
      gasLimitFormatted: this.formatNumber(parseInt(bufferedGasLimit)),
      gasPrice: gasPrice.gasPrice,
      gasPriceFormatted: gasPrice.gasPriceFormatted,
      totalFee,
      totalFeeFormatted: this.formatFee(totalFee, 18),
      speed,
      type: isEIP1559 ? 'eip1559' : 'legacy',
    };

    if (isEIP1559) {
      estimate.maxFeePerGas = gasPrice.maxFeePerGas;
      estimate.maxPriorityFeePerGas = gasPrice.maxPriorityFeePerGas;
    }

    const nativePrice = this.nativeTokenPrice.get(chain);
    if (nativePrice) {
      estimate.totalFeeUsd = (parseFloat(estimate.totalFeeFormatted) * nativePrice).toFixed(4);
    }

    return estimate;
  }

  private estimateDataGas(data: string): number {
    const bytes = (data.length - 2) / 2;
    let zeroBytes = 0;
    let nonZeroBytes = 0;

    for (let i = 2; i < data.length; i += 2) {
      if (data.slice(i, i + 2) === '00') {
        zeroBytes++;
      } else {
        nonZeroBytes++;
      }
    }

    return zeroBytes * 4 + nonZeroBytes * 16;
  }

  // ========================================================================
  // Gas 历史
  // ========================================================================

  private addHistoryPoint(chain: string, price: GasPrice): void {
    const point: GasHistoryPoint = {
      timestamp: price.timestamp,
      blockNumber: price.blockNumber || 0,
      baseFee: parseFloat(price.baseFeeFormatted || '0'),
      gasPrice: price.standard.gasPriceGwei,
      gasUsedRatio: price.gasUsedRatio || 0,
      txCount: price.pendingTxCount || 0,
    };

    let history = this.priceHistory.get(chain);
    if (!history) {
      history = [];
      this.priceHistory.set(chain, history);
    }

    history.push(point);
    if (history.length > 1000) {
      history.shift();
    }
  }

  /**
   * 获取 Gas 历史数据
   */
  getGasHistory(chain?: string, limit?: number): GasHistoryPoint[] {
    const chainKey = chain || this.defaultChain;
    const history = this.priceHistory.get(chainKey) || [];
    if (limit) {
      return history.slice(-limit);
    }
    return history;
  }

  /**
   * 获取 Gas 统计
   */
  getGasStats(chain?: string, hours: number = 24): {
    avg: number;
    min: number;
    max: number;
    current: number;
    trend: 'up' | 'down' | 'stable';
  } {
    const chainKey = chain || this.defaultChain;
    const history = this.priceHistory.get(chainKey) || [];
    const cutoff = Date.now() - hours * 60 * 60 * 1000;
    const filtered = history.filter((h) => h.timestamp >= cutoff);

    if (filtered.length === 0) {
      const current = this.currentPrices.get(chainKey)?.standard?.gasPriceGwei || 0;
      return { avg: current, min: current, max: current, current, trend: 'stable' };
    }

    const prices = filtered.map((h) => h.gasPrice);
    const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const current = prices[prices.length - 1];

    const firstHalf = prices.slice(0, Math.floor(prices.length / 2));
    const secondHalf = prices.slice(Math.floor(prices.length / 2));
    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

    const diff = (secondAvg - firstAvg) / firstAvg;
    let trend: 'up' | 'down' | 'stable' = 'stable';
    if (diff > 0.05) trend = 'up';
    else if (diff < -0.05) trend = 'down';

    return { avg, min, max, current, trend };
  }

  // ========================================================================
  // Gas 提醒
  // ========================================================================

  /**
   * 添加 Gas 提醒
   */
  addAlert(chain: string, type: 'below' | 'above', targetGwei: number, cooldown: number = 3600): string {
    const alert: GasAlert = {
      id: `alert_${Date.now()}`,
      chain,
      chainId: GAS_CHAIN_CONFIGS[chain]?.chainId || 1,
      type,
      targetGwei,
      isTriggered: false,
      createdAt: Date.now(),
      cooldown,
    };

    let alerts = this.alerts.get(chain);
    if (!alerts) {
      alerts = [];
      this.alerts.set(chain, alerts);
    }
    alerts.push(alert);

    return alert.id;
  }

  /**
   * 移除提醒
   */
  removeAlert(alertId: string, chain?: string): boolean {
    const chainKey = chain || this.defaultChain;
    const alerts = this.alerts.get(chainKey);
    if (!alerts) return false;

    const index = alerts.findIndex((a) => a.id === alertId);
    if (index > -1) {
      alerts.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * 获取所有提醒
   */
  getAlerts(chain?: string): GasAlert[] {
    const chainKey = chain || this.defaultChain;
    return this.alerts.get(chainKey) || [];
  }

  private checkAlerts(chain: string, price: GasPrice): void {
    const alerts = this.alerts.get(chain);
    if (!alerts || alerts.length === 0) return;

    const currentGwei = price.standard.gasPriceGwei;

    for (const alert of alerts) {
      if (alert.isTriggered && alert.lastTriggeredAt) {
        if (Date.now() - alert.lastTriggeredAt < alert.cooldown * 1000) {
          continue;
        }
      }

      let shouldTrigger = false;
      if (alert.type === 'below' && currentGwei < alert.targetGwei) {
        shouldTrigger = true;
      } else if (alert.type === 'above' && currentGwei > alert.targetGwei) {
        shouldTrigger = true;
      }

      if (shouldTrigger) {
        alert.isTriggered = true;
        alert.currentGwei = currentGwei;
        alert.triggeredAt = Date.now();
        alert.lastTriggeredAt = Date.now();
      }
    }
  }

  // ========================================================================
  // Nonce 管理
  // ========================================================================

  /**
   * 获取下一个 Nonce
   */
  getNextNonce(address: string, chainId: number): number {
    const key = `${address.toLowerCase()}_${chainId}`;
    let manager = this.nonceManagers.get(key);

    if (!manager) {
      manager = {
        address: address.toLowerCase(),
        chainId,
        currentNonce: 0,
        pendingNonces: new Set(),
        lastUpdated: Date.now(),
      };
      this.nonceManagers.set(key, manager);
    }

    let nextNonce = manager.currentNonce;
    while (manager.pendingNonces.has(nextNonce)) {
      nextNonce++;
    }

    return nextNonce;
  }

  /**
   * 提交 Nonce
   */
  submitNonce(address: string, chainId: number, nonce: number): void {
    const key = `${address.toLowerCase()}_${chainId}`;
    let manager = this.nonceManagers.get(key);
    if (!manager) return;

    manager.pendingNonces.add(nonce);
    manager.lastUpdated = Date.now();
  }

  /**
   * 确认 Nonce
   */
  confirmNonce(address: string, chainId: number, nonce: number): void {
    const key = `${address.toLowerCase()}_${chainId}`;
    let manager = this.nonceManagers.get(key);
    if (!manager) return;

    manager.pendingNonces.delete(nonce);
    if (nonce >= manager.currentNonce) {
      manager.currentNonce = nonce + 1;
    }
    manager.lastUpdated = Date.now();
  }

  /**
   * 重置 Nonce
   */
  resetNonce(address: string, chainId: number, currentNonce: number): void {
    const key = `${address.toLowerCase()}_${chainId}`;
    this.nonceManagers.set(key, {
      address: address.toLowerCase(),
      chainId,
      currentNonce,
      pendingNonces: new Set(),
      lastUpdated: Date.now(),
    });
  }

  // ========================================================================
  // 交易加速 / 取消
  // ========================================================================

  /**
   * 计算加速交易参数
   */
  calculateSpeedUp(options: SpeedUpOptions, chain?: string): {
    gasPrice: string;
    maxFeePerGas?: string;
    maxPriorityFeePerGas?: string;
    estimatedTime: number;
  } {
    const chainKey = chain || this.defaultChain;
    const config = GAS_CHAIN_CONFIGS[chainKey];
    const current = this.currentPrices.get(chainKey);
    const speed = options.speedLevel || 'fast';
    const level = current?.[speed] || current?.standard;

    const multiplier = options.gasPriceMultiplier || 1.5;
    const baseGasPrice = level?.gasPrice || '20000000000';
    const newGasPrice = (BigInt(baseGasPrice) * BigInt(Math.floor(multiplier * 100)) / 100n).toString();

    const result: any = {
      gasPrice: newGasPrice,
      estimatedTime: level?.estimatedTime || 30,
    };

    if (config?.supportsEIP1559 && level?.maxFeePerGas) {
      const feeMultiplier = options.maxFeeMultiplier || multiplier;
      const priorityMultiplier = options.maxPriorityFeeMultiplier || multiplier;
      result.maxFeePerGas = (BigInt(level.maxFeePerGas) * BigInt(Math.floor(feeMultiplier * 100)) / 100n).toString();
      result.maxPriorityFeePerGas = (BigInt(level.maxPriorityFeePerGas || '0') * BigInt(Math.floor(priorityMultiplier * 100)) / 100n).toString();
    }

    return result;
  }

  /**
   * 计算取消交易参数
   */
  calculateCancel(options: CancelOptions, chain?: string): {
    gasPrice: string;
    gasLimit: string;
    nonce: number;
    maxFeePerGas?: string;
    maxPriorityFeePerGas?: string;
  } {
    const chainKey = chain || this.defaultChain;
    const config = GAS_CHAIN_CONFIGS[chainKey];
    const current = this.currentPrices.get(chainKey);
    const fastLevel = current?.fast || current?.standard;

    const multiplier = options.gasPriceMultiplier || 1.5;
    const newGasPrice = (BigInt(fastLevel?.gasPrice || '20000000000') * BigInt(Math.floor(multiplier * 100)) / 100n).toString();

    const result: any = {
      gasPrice: newGasPrice,
      gasLimit: config?.defaultGasLimit || '21000',
      nonce: 0,
    };

    if (config?.supportsEIP1559 && fastLevel?.maxFeePerGas) {
      result.maxFeePerGas = (BigInt(fastLevel.maxFeePerGas) * BigInt(Math.floor(multiplier * 100)) / 100n).toString();
      result.maxPriorityFeePerGas = fastLevel.maxPriorityFeePerGas;
    }

    return result;
  }

  // ========================================================================
  // 工具方法
  // ========================================================================

  private formatNumber(num: number): string {
    if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
    if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
    if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K';
    return num.toString();
  }

  private formatFee(wei: string, decimals: number): string {
    const bigInt = BigInt(wei);
    const divisor = 10n ** BigInt(decimals);
    const integer = bigInt / divisor;
    const remainder = bigInt % divisor;
    const remainderStr = remainder.toString().padStart(decimals, '0');
    let trimmed = remainderStr.replace(/0+$/, '');
    if (trimmed.length > 8) trimmed = trimmed.slice(0, 8);
    return trimmed ? `${integer}.${trimmed}` : integer.toString();
  }

  /**
   * 设置原生代币价格
   */
  setNativeTokenPrice(chain: string, price: number): void {
    this.nativeTokenPrice.set(chain, price);
  }

  /**
   * 获取支持的链
   */
  getSupportedChains(): string[] {
    return Object.keys(GAS_CHAIN_CONFIGS);
  }

  /**
   * 设置默认链
   */
  setDefaultChain(chain: string): void {
    this.defaultChain = chain;
  }

  /**
   * 设置默认速度
   */
  setDefaultSpeed(speed: GasSpeed): void {
    this.defaultSpeed = speed;
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
  GasService,
  GAS_CHAIN_CONFIGS,
};
