/**
 * 链注册表（ChainRegistry）
 *
 * 目标：聚合多个 ChainClient，让业务层能：
 *  - 按 ChainId 检索客户端
 *  - 一次查询跨链 / 跨代币的所有余额
 *  - 一次性探测所有链的健康状态
 *
 * 默认实现（createDefaultRegistry）：
 *  - ETH + BSC + TRON
 *  - 接收可选 API Key
 *  - SOL / BTC 暂不注册（保留扩展位）
 */

import {
  EvmChainClientAdapter,
  TronChainClientAdapter,
  type ChainClient,
  type ChainId,
  type ChainBalance,
  type TokenRef,
  type ProbeResult,
} from './chain-client';
import { RpcError } from './rpc-client';

// =============================================================================
// 类型
// =============================================================================

/** 链代币查询项（包含所属链） */
export interface ChainTokenQuery {
  chain: ChainId;
  token: TokenRef;
  /** 钱包地址（如果省略，使用 registry 默认地址） */
  address?: string;
}

export interface CreateDefaultRegistryOptions {
  apiKeys?: {
    eth?: string;
    bsc?: string;
    tron?: string;
  };
  /** 自定义端点 */
  endpoints?: {
    eth?: string[];
    bsc?: string[];
    tron?: string[];
    polygon?: string[];
    arbitrum?: string[];
    optimism?: string[];
  };
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
  fallbackToDemo?: boolean;
  /** 启动时是否立即启动健康检查（默认 false） */
  autoStart?: boolean;
}

export class ChainNotRegisteredError extends RpcError {
  constructor(chain: ChainId) {
    super('CHAIN_NOT_REGISTERED', `Chain ${chain} is not registered in ChainRegistry`);
  }
}

// =============================================================================
// ChainRegistry
// =============================================================================

export class ChainRegistry {
  private readonly clients: Map<ChainId, ChainClient> = new Map();

  /** 注册一个 ChainClient（覆盖已存在的） */
  register(chainId: ChainId, client: ChainClient): void {
    if (client.chain !== chainId) {
      throw new Error(`ChainClient.chain (${client.chain}) mismatch with registration key (${chainId})`);
    }
    this.clients.set(chainId, client);
  }

  /** 移除一个 ChainClient */
  unregister(chainId: ChainId): boolean {
    const c = this.clients.get(chainId);
    if (c) {
      c.stop();
      this.clients.delete(chainId);
      return true;
    }
    return false;
  }

  /** 获取 ChainClient */
  getClient(chainId: ChainId): ChainClient {
    const c = this.clients.get(chainId);
    if (!c) throw new ChainNotRegisteredError(chainId);
    return c;
  }

  /** 检查是否已注册 */
  hasClient(chainId: ChainId): boolean {
    return this.clients.has(chainId);
  }

  /** 列出已注册的链 */
  listChains(): ChainId[] {
    return Array.from(this.clients.keys());
  }

  // -------------------------------------------------------------------------
  // 余额聚合
  // -------------------------------------------------------------------------

  /**
   * 并行查询多链 + 多代币余额。
   *  - queries: 查询项列表（每项包含 chain + token + address）
   *  - 任意一条失败不会中断整体流程；失败的项通过 onError 回调处理
   */
  async getBalances(
    queries: ChainTokenQuery[],
    onError?: (err: Error, q: ChainTokenQuery) => void,
  ): Promise<ChainBalance[]> {
    if (queries.length === 0) return [];
    const tasks = queries.map(async (q): Promise<ChainBalance | null> => {
      try {
        const client = this.getClient(q.chain);
        if (q.token.isNative || (!q.token.contractAddress && !q.token.mint)) {
          return await client.getNativeBalance(q.address || '');
        }
        return await client.getTokenBalance(q.address || '', q.token);
      } catch (err) {
        if (onError) onError(err as Error, q);
        return null;
      }
    });
    const results = await Promise.all(tasks);
    return results.filter((b): b is ChainBalance => b !== null);
  }

  // -------------------------------------------------------------------------
  // 健康聚合
  // -------------------------------------------------------------------------

  /** 并行探测所有链 */
  async getAllChainsHealth(): Promise<Map<ChainId, ProbeResult>> {
    const out = new Map<ChainId, ProbeResult>();
    if (this.clients.size === 0) return out;
    const entries = Array.from(this.clients.entries());
    const probed = await Promise.all(
      entries.map(async ([id, client]) => {
        try {
          const r = await client.probe();
          return [id, r] as const;
        } catch {
          const fallback: ProbeResult = {
            chain: id,
            reachable: false,
            healthy: false,
          };
          return [id, fallback] as const;
        }
      }),
    );
    for (const [id, r] of probed) out.set(id, r);
    return out;
  }

  // -------------------------------------------------------------------------
  // 生命周期
  // -------------------------------------------------------------------------

  /** 启动所有客户端的健康检查 */
  startAll(): void {
    for (const c of this.clients.values()) c.start();
  }

  /** 停止所有客户端 */
  stopAll(): void {
    for (const c of this.clients.values()) c.stop();
  }
}

// =============================================================================
// 工厂函数
// =============================================================================

/**
 * 默认 API key 提供器（可被环境变量覆盖）
 */
function getEnvApiKey(name: string): string | undefined {
  if (typeof process !== 'undefined' && process.env) {
    return process.env[name] || process.env[`REACT_APP_${name}`] || process.env[`NEXT_PUBLIC_${name}`];
  }
  return undefined;
}

/**
 * 统一 Alchemy API Key（2026-07-11 升级）
 *  - 一把 key 访问 12+ 链
 *  - 优先级：ALCHEMY_API_KEY > ETH_API_KEY > INFURA_API_KEY
 */
function getAlchemyApiKey(): string | undefined {
  return getEnvApiKey('ALCHEMY_API_KEY')
    || getEnvApiKey('ETH_API_KEY')
    || getEnvApiKey('INFURA_API_KEY');
}

/**
 * 创建默认 ChainRegistry
 * 2026-07-11 升级：注册 5 条 EVM 链（ETH/BSC/Polygon/Arbitrum/Optimism）+ TRON
 * 全部优先 Alchemy → 公共节点 fallback
 */
export function createDefaultRegistry(opts: CreateDefaultRegistryOptions = {}): ChainRegistry {
  const registry = new ChainRegistry();
  const apiKeys = opts.apiKeys || {};
  const endpoints = opts.endpoints || {};
  const alchemyKey = getAlchemyApiKey();

  // ETH（Alchemy → PublicNode → 其他）
  if (!endpoints.eth || endpoints.eth.length > 0) {
    registry.register('ETH', new EvmChainClientAdapter('ETH', {
      apiKey: apiKeys.eth || alchemyKey,
      endpoints: endpoints.eth,
      fetchImpl: opts.fetchImpl,
      timeoutMs: opts.timeoutMs,
      fallbackToDemo: opts.fallbackToDemo,
    }));
  }

  // BSC（Alchemy → 官方 → 公共节点）
  if (!endpoints.bsc || endpoints.bsc.length > 0) {
    registry.register('BSC', new EvmChainClientAdapter('BSC', {
      apiKey: apiKeys.bsc || alchemyKey,
      endpoints: endpoints.bsc,
      fetchImpl: opts.fetchImpl,
      timeoutMs: opts.timeoutMs,
      fallbackToDemo: opts.fallbackToDemo,
    }));
  }

  // Polygon（2026-07-11 新增）
  if (!endpoints.polygon || endpoints.polygon.length > 0) {
    registry.register('POLYGON', new EvmChainClientAdapter('POLYGON', {
      apiKey: alchemyKey,
      endpoints: endpoints.polygon,
      fetchImpl: opts.fetchImpl,
      timeoutMs: opts.timeoutMs,
      fallbackToDemo: opts.fallbackToDemo,
    }));
  }

  // Arbitrum（2026-07-11 新增）
  if (!endpoints.arbitrum || endpoints.arbitrum.length > 0) {
    registry.register('ARBITRUM', new EvmChainClientAdapter('ARBITRUM', {
      apiKey: alchemyKey,
      endpoints: endpoints.arbitrum,
      fetchImpl: opts.fetchImpl,
      timeoutMs: opts.timeoutMs,
      fallbackToDemo: opts.fallbackToDemo,
    }));
  }

  // Optimism（2026-07-11 新增）
  if (!endpoints.optimism || endpoints.optimism.length > 0) {
    registry.register('OPTIMISM', new EvmChainClientAdapter('OPTIMISM', {
      apiKey: alchemyKey,
      endpoints: endpoints.optimism,
      fetchImpl: opts.fetchImpl,
      timeoutMs: opts.timeoutMs,
      fallbackToDemo: opts.fallbackToDemo,
    }));
  }

  // TRON（保持原有 TronGrid 兼容，未纳入 Alchemy）
  if (!endpoints.tron || endpoints.tron.length > 0) {
    registry.register('TRON', new TronChainClientAdapter({
      apiKey: apiKeys.tron || getEnvApiKey('TRON_API_KEY') || getEnvApiKey('TRONGRID_API_KEY'),
      endpoints: endpoints.tron,
      fetchImpl: opts.fetchImpl,
      timeoutMs: opts.timeoutMs,
      fallbackToDemo: opts.fallbackToDemo,
    }));
  }

  if (opts.autoStart) registry.startAll();
  return registry;
}
