/**
 * 网络管理器
 *
 * 功能：
 *  - 链添加
 *  - 链切换
 *  - 自定义 RPC
 *  - RPC 健康检查
 *  - 多链管理
 *
 * 遵循标准：
 *  - EIP-3085: wallet_addEthereumChain
 *  - EIP-3326: wallet_switchEthereumChain
 */

import type { ChainConfig, AddEthereumChainParams, SwitchEthereumChainParams } from '../sdk.types';
import { getAllBuiltinChains, findChainById, sortChainsByPriority } from './chain-list';

/**
 * 网络管理器类
 */
export class NetworkManager {
  /** 支持的链列表 */
  private supportedChains: ChainConfig[] = [];

  /** 自定义链列表 */
  private customChains: ChainConfig[] = [];

  /** 已销毁标志 */
  private destroyed: boolean = false;

  /** 存储键 */
  private storageKey: string = 'wallet_sdk_custom_chains';

  /** RPC 健康状态缓存 */
  private rpcHealthCache: Map<string, { healthy: boolean; latency: number; timestamp: number }> = new Map();

  /** 健康检查间隔（毫秒） */
  private readonly HEALTH_CHECK_INTERVAL = 60000;

  /** 健康检查超时（毫秒） */
  private readonly HEALTH_CHECK_TIMEOUT = 5000;

  // ==========================================================================
  // 构造函数
  // ==========================================================================

  constructor(
    private readonly sdk: any,
  ) {}

  // ==========================================================================
  // 初始化与销毁
  // ==========================================================================

  /**
   * 初始化网络管理器
   */
  public async initialize(): Promise<void> {
    if (this.destroyed) return;

    this.loadCustomChains();
    this.loadSupportedChains();

    console.log('[NetworkManager] 初始化完成');
  }

  /**
   * 销毁网络管理器
   */
  public destroy(): void {
    this.destroyed = true;
    this.rpcHealthCache.clear();
    console.log('[NetworkManager] 已销毁');
  }

  // ==========================================================================
  // 链查询
  // ==========================================================================

  /**
   * 获取所有支持的链
   */
  public getSupportedChains(): ChainConfig[] {
    const allChains = [...this.supportedChains, ...this.customChains];
    return sortChainsByPriority(allChains);
  }

  /**
   * 获取自定义链列表
   */
  public getCustomChains(): ChainConfig[] {
    return [...this.customChains];
  }

  /**
   * 获取主网链列表
   */
  public getMainnetChains(): ChainConfig[] {
    return this.getSupportedChains().filter(c => !c.testnet);
  }

  /**
   * 获取测试网链列表
   */
  public getTestnetChains(): ChainConfig[] {
    return this.getSupportedChains().filter(c => c.testnet);
  }

  /**
   * 根据链 ID 获取链配置
   */
  public getChainById(chainId: number): ChainConfig | undefined {
    return findChainById(chainId, this.getSupportedChains());
  }

  /**
   * 根据链名称获取链配置
   */
  public getChainByName(name: string): ChainConfig | undefined {
    const allChains = this.getSupportedChains();
    return allChains.find(c =>
      c.chainName.toLowerCase() === name.toLowerCase() ||
      c.shortName?.toLowerCase() === name.toLowerCase()
    );
  }

  /**
   * 兼容旧接口：根据链 ID 获取链配置
   */
  public getChain(chainId: number): ChainConfig | undefined {
    return this.getChainById(chainId);
  }

  /**
   * 兼容旧接口：检查链是否存在
   */
  public hasChain(chainId: number): boolean {
    return this.isChainSupported(chainId);
  }

  /**
   * 检查链是否受支持
   */
  public isChainSupported(chainId: number): boolean {
    return !!this.getChainById(chainId);
  }

  // ==========================================================================
  // 自定义链管理
  // ==========================================================================

  /**
   * 添加自定义链
   */
  public async addCustomChain(chainConfig: ChainConfig): Promise<void> {
    if (this.destroyed) return;

    const existingIndex = this.customChains.findIndex(c => c.chainId === chainConfig.chainId);

    if (existingIndex !== -1) {
      this.customChains[existingIndex] = {
        ...this.customChains[existingIndex],
        ...chainConfig,
      };
    } else {
      this.customChains.push({
        ...chainConfig,
        enabled: chainConfig.enabled ?? true,
        priority: chainConfig.priority ?? 500,
      });
    }

    this.saveCustomChains();
    console.log(`[NetworkManager] 自定义链已添加: ${chainConfig.chainName} (${chainConfig.chainId})`);
  }

  /**
   * 删除自定义链
   */
  public async removeCustomChain(chainId: number): Promise<void> {
    if (this.destroyed) return;

    const index = this.customChains.findIndex(c => c.chainId === chainId);
    if (index !== -1) {
      const chain = this.customChains[index];
      this.customChains.splice(index, 1);
      this.saveCustomChains();
      console.log(`[NetworkManager] 自定义链已删除: ${chain.chainName} (${chain.chainId})`);
    }
  }

  /**
   * 从 EIP-3085 参数添加链
   */
  public addChainFromParams(params: AddEthereumChainParams): ChainConfig {
    const chainId = parseInt(params.chainId, 16);

    const chainConfig: ChainConfig = {
      chainId,
      chainName: params.chainName,
      chainType: 'evm',
      nativeCurrency: params.nativeCurrency,
      rpcUrls: params.rpcUrls,
      blockExplorers: params.blockExplorerUrls?.map((url, index) => ({
        name: `Explorer ${index + 1}`,
        url,
        standard: 'EIP3091' as const,
      })),
      iconUrl: params.iconUrls?.[0],
      shortName: params.nativeCurrency.symbol.toLowerCase(),
      networkId: chainId,
      priority: 500,
      enabled: true,
    };

    this.addCustomChain(chainConfig);
    return chainConfig;
  }

  // ==========================================================================
  // RPC 管理
  // ==========================================================================

  /**
   * 获取链的 RPC URL 列表
   */
  public getRpcUrls(chainId: number): string[] {
    const chain = this.getChainById(chainId);
    return chain?.rpcUrls || [];
  }

  /**
   * 获取链的当前最佳 RPC URL
   */
  public async getBestRpcUrl(chainId: number): Promise<string | null> {
    const rpcUrls = this.getRpcUrls(chainId);
    if (rpcUrls.length === 0) return null;

    let bestRpc: string | null = null;
    let bestLatency = Infinity;

    for (const rpcUrl of rpcUrls) {
      const health = await this.checkRpcHealth(rpcUrl, chainId);
      if (health.healthy && health.latency < bestLatency) {
        bestRpc = rpcUrl;
        bestLatency = health.latency;
      }
    }

    return bestRpc || rpcUrls[0];
  }

  /**
   * 检查 RPC 健康状态
   */
  public async checkRpcHealth(rpcUrl: string, chainId: number): Promise<{ healthy: boolean; latency: number }> {
    const cacheKey = `${chainId}:${rpcUrl}`;
    const cached = this.rpcHealthCache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < this.HEALTH_CHECK_INTERVAL) {
      return { healthy: cached.healthy, latency: cached.latency };
    }

    try {
      const startTime = Date.now();
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.HEALTH_CHECK_TIMEOUT);

      const response = await fetch(rpcUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'eth_blockNumber',
          params: [],
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const latency = Date.now() - startTime;
      const healthy = response.ok;

      this.rpcHealthCache.set(cacheKey, {
        healthy,
        latency,
        timestamp: Date.now(),
      });

      return { healthy, latency };
    } catch {
      const result = { healthy: false, latency: this.HEALTH_CHECK_TIMEOUT };
      this.rpcHealthCache.set(cacheKey, {
        ...result,
        timestamp: Date.now(),
      });
      return result;
    }
  }

  /**
   * 添加自定义 RPC
   */
  public addCustomRpc(chainId: number, rpcUrl: string): void {
    const chainIndex = this.customChains.findIndex(c => c.chainId === chainId);
    if (chainIndex !== -1) {
      this.customChains[chainIndex].rpcUrls.push(rpcUrl);
      this.saveCustomChains();
    }
  }

  /**
   * 移除自定义 RPC
   */
  public removeCustomRpc(chainId: number, rpcUrl: string): void {
    const chainIndex = this.customChains.findIndex(c => c.chainId === chainId);
    if (chainIndex !== -1) {
      const rpcIndex = this.customChains[chainIndex].rpcUrls.indexOf(rpcUrl);
      if (rpcIndex !== -1) {
        this.customChains[chainIndex].rpcUrls.splice(rpcIndex, 1);
        this.saveCustomChains();
      }
    }
  }

  // ==========================================================================
  // Gas 设置
  // ==========================================================================

  /**
   * 获取链的 Gas 配置
   */
  public getGasConfig(chainId: number): ChainConfig['gasConfig'] | undefined {
    const chain = this.getChainById(chainId);
    return chain?.gasConfig;
  }

  /**
   * 检查链是否支持 EIP-1559
   */
  public supportsEIP1559(chainId: number): boolean {
    const config = this.getGasConfig(chainId);
    return config?.eip1559 ?? true;
  }

  // ==========================================================================
  // 区块浏览器
  // ==========================================================================

  /**
   * 获取区块浏览器 URL
   */
  public getBlockExplorerUrl(chainId: number, type: 'tx' | 'address' | 'block', hash: string): string | null {
    const chain = this.getChainById(chainId);
    if (!chain?.blockExplorers || chain.blockExplorers.length === 0) {
      return null;
    }

    const baseUrl = chain.blockExplorers[0].url.replace(/\/$/, '');

    switch (type) {
      case 'tx':
        return `${baseUrl}/tx/${hash}`;
      case 'address':
        return `${baseUrl}/address/${hash}`;
      case 'block':
        return `${baseUrl}/block/${hash}`;
      default:
        return null;
    }
  }

  // ==========================================================================
  // 内部方法
  // ==========================================================================

  /**
   * 加载支持的链
   */
  private loadSupportedChains(): void {
    const builtinChains = getAllBuiltinChains();
    this.supportedChains = builtinChains.filter(c => c.enabled !== false);
  }

  /**
   * 从存储加载自定义链
   */
  private loadCustomChains(): void {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        this.customChains = JSON.parse(stored);
      }
    } catch (error) {
      console.error('[NetworkManager] 加载自定义链失败', error);
      this.customChains = [];
    }
  }

  /**
   * 保存自定义链到存储
   */
  private saveCustomChains(): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.customChains));
    } catch (error) {
      console.error('[NetworkManager] 保存自定义链失败', error);
    }
  }
}
