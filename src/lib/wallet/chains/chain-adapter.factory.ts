/**
 * ChainAdapter 工厂类
 *
 * 采用工厂模式 + 策略模式，实现适配器的动态注册和获取。
 * 支持单例缓存，确保同一链类型的适配器只创建一次。
 *
 * 设计原则：
 *  - 单一职责：工厂只负责适配器的创建和管理
 *  - 开闭原则：支持动态注册新适配器，无需修改工厂代码
 *  - 单例模式：同一链类型的适配器只创建一次
 *  - 依赖倒置：依赖抽象接口而非具体实现
 */

import {
  ChainAdapter,
  ChainType,
  AdapterConfig,
  ChainAdapterConstructor,
  ChainInfo,
  HealthCheckResult,
  AdapterEventType,
  AdapterEventListener,
  isValidChainType,
} from './chain-adapter.interface';

// ============================================================================
// 类型定义
// ============================================================================

/**
 * 适配器注册项
 */
interface AdapterRegistration {
  chainType: ChainType;
  constructor: ChainAdapterConstructor;
  defaultConfig?: AdapterConfig;
  displayName: string;
  description?: string;
  version?: string;
}

/**
 * 适配器实例缓存项
 */
interface AdapterCacheItem {
  adapter: ChainAdapter;
  chainType: ChainType;
  config: AdapterConfig;
  createdAt: number;
  lastAccessedAt: number;
  accessCount: number;
}

/**
 * 工厂配置选项
 */
export interface ChainAdapterFactoryOptions {
  defaultConfig?: AdapterConfig;
  enableCache?: boolean;
  maxCacheSize?: number;
  autoRegisterDefaults?: boolean;
}

/**
 * 适配器未注册错误
 */
export class AdapterNotRegisteredError extends Error {
  public readonly chainType: ChainType;

  constructor(chainType: ChainType) {
    super(`Adapter for chain type '${chainType}' is not registered`);
    this.name = 'AdapterNotRegisteredError';
    this.chainType = chainType;
  }
}

/**
 * 适配器已注册错误
 */
export class AdapterAlreadyRegisteredError extends Error {
  public readonly chainType: ChainType;

  constructor(chainType: ChainType) {
    super(`Adapter for chain type '${chainType}' is already registered`);
    this.name = 'AdapterAlreadyRegisteredError';
    this.chainType = chainType;
  }
}

/**
 * 无效链类型错误
 */
export class InvalidChainTypeError extends Error {
  public readonly chainType: string;

  constructor(chainType: string) {
    super(`Invalid chain type: '${chainType}'`);
    this.name = 'InvalidChainTypeError';
    this.chainType = chainType;
  }
}

// ============================================================================
// ChainAdapterFactory 类
// ============================================================================

/**
 * ChainAdapter 工厂类
 *
 * 负责管理所有链适配器的注册和获取。
 * 采用单例模式，全局只有一个工厂实例。
 *
 * 使用示例：
 * ```typescript
 * const factory = ChainAdapterFactory.getInstance();
 *
 * // 注册适配器
 * factory.registerAdapter(ChainType.EVM, EVMAdapter, { ... });
 *
 * // 获取适配器
 * const evmAdapter = factory.getAdapter(ChainType.EVM);
 *
 * // 列出所有已注册的适配器
 * const adapters = factory.listAdapters();
 * ```
 */
export class ChainAdapterFactory {
  // -------------------------------------------------------------------------
  // 单例实例
  // -------------------------------------------------------------------------

  private static instance: ChainAdapterFactory | null = null;

  // -------------------------------------------------------------------------
  // 私有属性
  // -------------------------------------------------------------------------

  private registrations: Map<ChainType, AdapterRegistration> = new Map();
  private adapterCache: Map<ChainType, AdapterCacheItem> = new Map();
  private eventListeners: Map<AdapterEventType, Set<AdapterEventListener>> = new Map();
  private options: ChainAdapterFactoryOptions;
  private isInitialized: boolean = false;

  // -------------------------------------------------------------------------
  // 构造函数
  // -------------------------------------------------------------------------

  private constructor(options: ChainAdapterFactoryOptions = {}) {
    this.options = {
      enableCache: true,
      maxCacheSize: 20,
      autoRegisterDefaults: true,
      ...options,
    };
  }

  // -------------------------------------------------------------------------
  // 单例方法
  // -------------------------------------------------------------------------

  /**
   * 获取工厂单例实例
   */
  public static getInstance(options?: ChainAdapterFactoryOptions): ChainAdapterFactory {
    if (!ChainAdapterFactory.instance) {
      ChainAdapterFactory.instance = new ChainAdapterFactory(options);
    } else if (options) {
      ChainAdapterFactory.instance.updateOptions(options);
    }
    return ChainAdapterFactory.instance;
  }

  /**
   * 重置单例实例（主要用于测试）
   */
  public static resetInstance(): void {
    if (ChainAdapterFactory.instance) {
      ChainAdapterFactory.instance.destroy();
      ChainAdapterFactory.instance = null;
    }
  }

  // -------------------------------------------------------------------------
  // 配置管理
  // -------------------------------------------------------------------------

  /**
   * 更新工厂配置
   */
  public updateOptions(options: Partial<ChainAdapterFactoryOptions>): void {
    this.options = { ...this.options, ...options };
    this.emitEvent('chainChanged', { options: this.options });
  }

  /**
   * 获取当前配置
   */
  public getOptions(): ChainAdapterFactoryOptions {
    return { ...this.options };
  }

  // -------------------------------------------------------------------------
  // 适配器注册
  // -------------------------------------------------------------------------

  /**
   * 注册链适配器
   *
   * @param chainType 链类型
   * @param constructor 适配器构造函数
   * @param defaultConfig 默认配置
   * @param options 注册选项
   * @throws AdapterAlreadyRegisteredError 如果该链类型已注册
   * @throws InvalidChainTypeError 如果链类型无效
   */
  public registerAdapter(
    chainType: ChainType | string,
    constructor: ChainAdapterConstructor,
    defaultConfig?: AdapterConfig,
    options?: {
      displayName?: string;
      description?: string;
      version?: string;
      override?: boolean;
    },
  ): void {
    const validChainType = this.validateChainType(chainType);

    if (this.registrations.has(validChainType) && !options?.override) {
      throw new AdapterAlreadyRegisteredError(validChainType);
    }

    const registration: AdapterRegistration = {
      chainType: validChainType,
      constructor,
      defaultConfig,
      displayName: options?.displayName || validChainType,
      description: options?.description,
      version: options?.version,
    };

    this.registrations.set(validChainType, registration);
    this.clearAdapterCache(validChainType);

    this.emitEvent('chainChanged', {
      action: 'register',
      chainType: validChainType,
      registration,
    });
  }

  /**
   * 批量注册适配器
   */
  public registerAdapters(
    adapters: Array<{
      chainType: ChainType | string;
      constructor: ChainAdapterConstructor;
      defaultConfig?: AdapterConfig;
      displayName?: string;
      description?: string;
      version?: string;
    }>,
  ): void {
    for (const adapter of adapters) {
      this.registerAdapter(
        adapter.chainType,
        adapter.constructor,
        adapter.defaultConfig,
        {
          displayName: adapter.displayName,
          description: adapter.description,
          version: adapter.version,
        },
      );
    }
  }

  /**
   * 注销适配器
   *
   * @param chainType 链类型
   * @returns 是否成功注销
   */
  public unregisterAdapter(chainType: ChainType | string): boolean {
    const validChainType = this.validateChainType(chainType);
    const existed = this.registrations.delete(validChainType);
    this.clearAdapterCache(validChainType);

    if (existed) {
      this.emitEvent('chainChanged', {
        action: 'unregister',
        chainType: validChainType,
      });
    }

    return existed;
  }

  /**
   * 检查适配器是否已注册
   */
  public isAdapterRegistered(chainType: ChainType | string): boolean {
    try {
      const validChainType = this.validateChainType(chainType);
      return this.registrations.has(validChainType);
    } catch {
      return false;
    }
  }

  // -------------------------------------------------------------------------
  // 适配器获取
  // -------------------------------------------------------------------------

  /**
   * 获取链适配器实例
   *
   * 如果启用了缓存且缓存中存在，则直接返回缓存的实例。
   * 否则创建新实例并缓存。
   *
   * @param chainType 链类型
   * @param config 可选的配置（会覆盖默认配置）
   * @returns 适配器实例
   * @throws AdapterNotRegisteredError 如果该链类型未注册
   */
  public getAdapter(chainType: ChainType | string, config?: AdapterConfig): ChainAdapter {
    const validChainType = this.validateChainType(chainType);
    const registration = this.registrations.get(validChainType);

    if (!registration) {
      throw new AdapterNotRegisteredError(validChainType);
    }

    if (this.options.enableCache && !config) {
      const cached = this.adapterCache.get(validChainType);
      if (cached) {
        cached.lastAccessedAt = Date.now();
        cached.accessCount++;
        return cached.adapter;
      }
    }

    const mergedConfig = this.mergeConfig(registration.defaultConfig, config);
    const adapter = new registration.constructor(mergedConfig);

    if (this.options.enableCache && !config) {
      this.cacheAdapter(validChainType, adapter, mergedConfig);
    }

    return adapter;
  }

  /**
   * 安全获取适配器（失败返回 null）
   */
  public tryGetAdapter(chainType: ChainType | string, config?: AdapterConfig): ChainAdapter | null {
    try {
      return this.getAdapter(chainType, config);
    } catch {
      return null;
    }
  }

  /**
   * 获取所有已注册的适配器
   */
  public listAdapters(): Array<{
    chainType: ChainType;
    displayName: string;
    description?: string;
    version?: string;
    isCached: boolean;
  }> {
    const result: Array<{
      chainType: ChainType;
      displayName: string;
      description?: string;
      version?: string;
      isCached: boolean;
    }> = [];

    for (const [chainType, registration] of this.registrations.entries()) {
      result.push({
        chainType,
        displayName: registration.displayName,
        description: registration.description,
        version: registration.version,
        isCached: this.adapterCache.has(chainType),
      });
    }

    return result.sort((a, b) => a.displayName.localeCompare(b.displayName));
  }

  /**
   * 获取所有支持的链信息
   */
  public getAllChainInfos(): ChainInfo[] {
    const chainInfos: ChainInfo[] = [];

    for (const [chainType] of this.registrations.entries()) {
      try {
        const adapter = this.getAdapter(chainType);
        const chains = adapter.getSupportedChains();
        for (const chainKey of chains) {
          try {
            chainInfos.push(adapter.getChainInfo(chainKey));
          } catch {
            // 跳过获取失败的链
          }
        }
      } catch {
        // 跳过获取失败的适配器
      }
    }

    return chainInfos;
  }

  // -------------------------------------------------------------------------
  // 缓存管理
  // -------------------------------------------------------------------------

  /**
   * 缓存适配器实例
   */
  private cacheAdapter(chainType: ChainType, adapter: ChainAdapter, config: AdapterConfig): void {
    if (this.adapterCache.size >= (this.options.maxCacheSize || 20)) {
      this.evictOldestCache();
    }

    const cacheItem: AdapterCacheItem = {
      adapter,
      chainType,
      config,
      createdAt: Date.now(),
      lastAccessedAt: Date.now(),
      accessCount: 1,
    };

    this.adapterCache.set(chainType, cacheItem);
  }

  /**
   * 清除指定适配器的缓存
   */
  public clearAdapterCache(chainType?: ChainType | string): void {
    if (chainType) {
      const validChainType = this.validateChainType(chainType);
      this.adapterCache.delete(validChainType);
    } else {
      this.adapterCache.clear();
    }

    this.emitEvent('cacheCleared', { chainType });
  }

  /**
   * 获取缓存统计信息
   */
  public getCacheStats(): {
    size: number;
    maxSize: number;
    items: Array<{
      chainType: ChainType;
      createdAt: number;
      lastAccessedAt: number;
      accessCount: number;
    }>;
  } {
    const items = Array.from(this.adapterCache.values()).map((item) => ({
      chainType: item.chainType,
      createdAt: item.createdAt,
      lastAccessedAt: item.lastAccessedAt,
      accessCount: item.accessCount,
    }));

    return {
      size: this.adapterCache.size,
      maxSize: this.options.maxCacheSize || 20,
      items,
    };
  }

  /**
   * 淘汰最旧的缓存项
   */
  private evictOldestCache(): void {
    let oldestChainType: ChainType | null = null;
    let oldestTime = Infinity;

    for (const [chainType, item] of this.adapterCache.entries()) {
      if (item.lastAccessedAt < oldestTime) {
        oldestTime = item.lastAccessedAt;
        oldestChainType = chainType;
      }
    }

    if (oldestChainType) {
      this.adapterCache.delete(oldestChainType);
    }
  }

  // -------------------------------------------------------------------------
  // 配置合并
  // -------------------------------------------------------------------------

  /**
   * 合并配置
   */
  private mergeConfig(
    defaultConfig?: AdapterConfig,
    overrideConfig?: AdapterConfig,
  ): AdapterConfig {
    const baseConfig = this.options.defaultConfig || {};
    const regDefault = defaultConfig || {};
    const override = overrideConfig || {};

    return {
      ...baseConfig,
      ...regDefault,
      ...override,
      extra: {
        ...baseConfig.extra,
        ...regDefault.extra,
        ...override.extra,
      },
    };
  }

  // -------------------------------------------------------------------------
  // 验证方法
  // -------------------------------------------------------------------------

  /**
   * 验证链类型
   */
  private validateChainType(chainType: ChainType | string): ChainType {
    if (isValidChainType(chainType)) {
      return chainType;
    }
    throw new InvalidChainTypeError(String(chainType));
  }

  // -------------------------------------------------------------------------
  // 事件系统
  // -------------------------------------------------------------------------

  /**
   * 添加事件监听器
   */
  public addEventListener(event: AdapterEventType, listener: AdapterEventListener): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(listener);
  }

  /**
   * 移除事件监听器
   */
  public removeEventListener(event: AdapterEventType, listener: AdapterEventListener): boolean {
    const listeners = this.eventListeners.get(event);
    if (!listeners) return false;
    return listeners.delete(listener);
  }

  /**
   * 触发事件
   */
  private emitEvent(event: AdapterEventType, data?: any): void {
    const listeners = this.eventListeners.get(event);
    if (!listeners) return;

    for (const listener of listeners) {
      try {
        listener(event, data);
      } catch (error) {
        console.error(`Error in event listener for ${event}:`, error);
      }
    }
  }

  // -------------------------------------------------------------------------
  // 健康检查
  // -------------------------------------------------------------------------

  /**
   * 检查所有适配器的健康状态
   */
  public async checkAllHealth(): Promise<HealthCheckResult[]> {
    const results: HealthCheckResult[] = [];

    for (const [chainType] of this.registrations.entries()) {
      try {
        const adapter = this.getAdapter(chainType);
        const blockNumber = await adapter.getBlockNumber();
        results.push({
          chainKey: chainType,
          reachable: true,
          healthy: true,
          blockNumber,
        });
      } catch (error) {
        results.push({
          chainKey: chainType,
          reachable: false,
          healthy: false,
          errorMessage: error instanceof Error ? error.message : String(error),
        });
      }
    }

    return results;
  }

  // -------------------------------------------------------------------------
  // 初始化与销毁
  // -------------------------------------------------------------------------

  /**
   * 初始化工厂
   */
  public initialize(): void {
    if (this.isInitialized) return;

    this.isInitialized = true;
    this.emitEvent('chainChanged', { action: 'initialize' });
  }

  /**
   * 销毁工厂实例
   */
  public destroy(): void {
    for (const cached of this.adapterCache.values()) {
      try {
        cached.adapter.clearCache();
      } catch {
        // 忽略销毁时的错误
      }
    }

    this.adapterCache.clear();
    this.eventListeners.clear();
    this.isInitialized = false;
  }

  // -------------------------------------------------------------------------
  // 工具方法
  // -------------------------------------------------------------------------

  /**
   * 根据链 Key 自动识别链类型并获取适配器
   *
   * @param chainKey 链标识（如 'ethereum', 'bsc', 'solana' 等）
   * @param config 可选配置
   * @returns 适配器实例或 null
   */
  public getAdapterByChainKey(chainKey: string, config?: AdapterConfig): ChainAdapter | null {
    const chainType = this.detectChainType(chainKey);
    if (!chainType) return null;
    return this.tryGetAdapter(chainType, config);
  }

  /**
   * 根据链 Key 检测链类型
   *
   * 这是一个简化的实现，实际项目中可以根据链 ID 或其他特征更精确地识别。
   */
  public detectChainType(chainKey: string): ChainType | null {
    const lowerKey = chainKey.toLowerCase();

    const evmPatterns = [
      'eth', 'ethereum', 'bsc', 'binance', 'polygon', 'matic', 'avalanche', 'avax',
      'arbitrum', 'arb', 'optimism', 'op', 'fantom', 'ftm', 'base', 'zksync',
      'gnosis', 'xdai', 'cronos', 'cro', 'klaytn', 'celo', 'harmony', 'one',
      'moonbeam', 'glmr', 'moonriver', 'movr', 'linea', 'starknet',
    ];

    if (evmPatterns.some((p) => lowerKey.includes(p))) {
      return ChainType.EVM;
    }

    if (lowerKey.includes('sol') || lowerKey.includes('solana')) {
      return ChainType.SOLANA;
    }

    if (lowerKey.includes('btc') || lowerKey.includes('bitcoin')) {
      return ChainType.BITCOIN;
    }

    if (lowerKey.includes('cosmos') || lowerKey.includes('atom') || lowerKey.includes('osmo')) {
      return ChainType.COSMOS;
    }

    if (lowerKey.includes('tron') || lowerKey.includes('trx')) {
      return ChainType.TRON;
    }

    return null;
  }

  /**
   * 获取已注册的链类型数量
   */
  public getRegisteredCount(): number {
    return this.registrations.size;
  }

  /**
   * 获取缓存的适配器数量
   */
  public getCachedCount(): number {
    return this.adapterCache.size;
  }
}

// ============================================================================
// 默认导出
// ============================================================================

export default {
  ChainAdapterFactory,
  AdapterNotRegisteredError,
  AdapterAlreadyRegisteredError,
  InvalidChainTypeError,
};
