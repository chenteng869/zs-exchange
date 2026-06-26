/**
 * DeFiLlama TVL 服务 (G-01)
 *
 * 提供：
 *  - 协议列表（全部 / 排序 / 搜索）
 *  - 协议详情（按链分布 TVL、时间序列）
 *  - 链 TVL
 *  - 全局 TVL
 *  - 内存缓存（默认 5 min TTL）
 *  - 断网降级到 mock 数据
 *
 * 端点：
 *  - GET /protocols                  全部协议
 *  - GET /protocol/{slug}            单个协议详情（含历史 + 链分布）
 *  - GET /v2/chains                  全部链 TVL
 *  - GET /v2/historicalChainTvl      全局历史 TVL
 *
 * 文档：https://api.llama.fi/docs
 */

import { DeFiLlamaClient, DefiLlamaError, DEFILLAMA_API_BASE, type ProbeResult } from './defillama-client';

// =============================================================================
// 配置常量
// =============================================================================

/** 内存缓存 TTL（毫秒） */
export const TVL_CACHE_TTL_MS = 5 * 60_000;
/** 默认一次返回 top N */
export const TVL_DEFAULT_TOP_N = 20;

// =============================================================================
// 类型
// =============================================================================

/** DeFiLlama /protocols 原始返回（最小化） */
export interface Protocol {
  id: string;
  name: string;
  slug: string;
  chain: string[];
  category: string;
  tvl: number;
  change_1d: number;
  change_7d: number;
  mcap?: number;
  logo: string;
  description?: string;
  url?: string;
}

/** DeFiLlama /protocol/{slug} 详情（最小化） */
export interface ProtocolDetail extends Protocol {
  currentChainTvls: Record<string, number>;
  tvlHistory: { date: number; tvl: number }[];
  raiseAmount?: number;
  audits?: string;
}

/** DeFiLlama /v2/chains 单条 */
export interface ChainTvl {
  geckoId: string | null;
  tvl: number;
  tokenSymbol: string;
  /** 协议 slug 列表（v2 接口附带） */
  protocols?: string[];
  /** 链名（驼峰） */
  name?: string;
  /** chainId（如果有） */
  chainId?: number;
}

/** 全局 TVL 汇总 */
export interface GlobalTvl {
  total: number;
  change_1d: number;
  updatedAt: number;
}

// =============================================================================
// 缓存
// =============================================================================

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

class TtlCache {
  private store: Map<string, CacheEntry<unknown>> = new Map();
  private readonly disabled: boolean;
  constructor(private readonly ttlMs: number) {
    this.disabled = ttlMs <= 0;
  }

  get<T>(key: string): T | null {
    if (this.disabled) return null;
    const entry = this.store.get(key) as CacheEntry<T> | undefined;
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return entry.value;
  }

  set<T>(key: string, value: T): void {
    if (this.disabled) return;
    this.store.set(key, { value, expiresAt: Date.now() + this.ttlMs });
  }

  delete(key: string): void {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }

  size(): number {
    return this.store.size;
  }
}

// =============================================================================
// 工具：数据归一化
// =============================================================================

function toNumber(v: unknown, fallback = 0): number {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'string') {
    const n = parseFloat(v);
    if (Number.isFinite(n)) return n;
  }
  return fallback;
}

function toString(v: unknown, fallback = ''): string {
  if (typeof v === 'string') return v;
  if (v == null) return fallback;
  return String(v);
}

function toStringArray(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.filter((x): x is string => typeof x === 'string');
}

/** 将 DeFiLlama /protocols 原始项归一化 */
function normalizeProtocol(raw: any): Protocol {
  return {
    id: toString(raw?.id),
    name: toString(raw?.name),
    slug: toString(raw?.slug),
    chain: toStringArray(raw?.chain),
    category: toString(raw?.category, 'Unknown'),
    tvl: toNumber(raw?.tvl),
    change_1d: toNumber(raw?.change_1d),
    change_7d: toNumber(raw?.change_7d),
    mcap: raw?.mcap !== undefined && raw?.mcap !== null ? toNumber(raw.mcap) : undefined,
    logo: toString(raw?.logo),
    description: raw?.description ? toString(raw.description) : undefined,
    url: raw?.url ? toString(raw.url) : undefined,
  };
}

/** 将 DeFiLlama /protocol/{slug} 详情归一化 */
function normalizeProtocolDetail(raw: any): ProtocolDetail {
  const base = normalizeProtocol(raw);
  const currentChainTvls: Record<string, number> = {};
  if (raw?.currentChainTvls && typeof raw.currentChainTvls === 'object') {
    for (const [k, v] of Object.entries(raw.currentChainTvls)) {
      // 过滤掉 tvl 字段和以 "Own token" / "Staking" 结尾的聚合项
      if (typeof v === 'number' && Number.isFinite(v) && v > 0) {
        currentChainTvls[k] = v;
      }
    }
  }
  // tvl 字段是时间序列 [{ date: unix, totalLiquidityUSD: number }]
  const tvlHistory: { date: number; tvl: number }[] = [];
  if (Array.isArray(raw?.tvl)) {
    for (const item of raw.tvl) {
      if (item && typeof item === 'object') {
        const date = toNumber(item.date, 0);
        const tvl = toNumber(item.totalLiquidityUSD);
        if (date > 0) {
          tvlHistory.push({ date: date * 1000, tvl });
        }
      }
    }
  }
  return {
    ...base,
    currentChainTvls,
    tvlHistory,
    raiseAmount: raw?.raiseAmount !== undefined && raw?.raiseAmount !== null ? toNumber(raw.raiseAmount) : undefined,
    audits: raw?.audits ? toString(raw.audits) : undefined,
  };
}

// =============================================================================
// TvlService
// =============================================================================

export interface TvlServiceOptions {
  client?: DeFiLlamaClient;
  /** 缓存 TTL（毫秒），0 表示不缓存 */
  cacheTtlMs?: number;
  /** 自定义降级 mock 提供器 */
  mockProvider?: () => MockTvlData;
}

export interface MockTvlData {
  protocols: Protocol[];
  chainTvls: ChainTvl[];
  globalTvl: GlobalTvl;
}

export class TvlService {
  private readonly client: DeFiLlamaClient;
  private readonly cache: TtlCache;
  private readonly mockProvider: () => MockTvlData;

  constructor(opts: TvlServiceOptions = {}) {
    this.client = opts.client || new DeFiLlamaClient();
    this.cache = new TtlCache(opts.cacheTtlMs !== undefined ? opts.cacheTtlMs : TVL_CACHE_TTL_MS);
    this.mockProvider = opts.mockProvider || defaultMockTvlProvider;
  }

  // -------------------------------------------------------------------------
  // 协议列表
  // -------------------------------------------------------------------------

  /**
   * 全部协议
   * 端点：GET /protocols
   */
  async listProtocols(): Promise<Protocol[]> {
    const cacheKey = 'protocols:all';
    const cached = this.cache.get<Protocol[]>(cacheKey);
    if (cached) return cached;

    try {
      const raw = await this.client.get<any[]>('/protocols');
      const list = (raw || []).map(normalizeProtocol);
      this.cache.set(cacheKey, list);
      return list;
    } catch (err) {
      this.emitError('listProtocols', err);
      return this.fallback().protocols;
    }
  }

  /**
   * 单个协议详情
   * 端点：GET /protocol/{slug}
   */
  async getProtocol(slug: string): Promise<ProtocolDetail | null> {
    if (!slug) return null;
    const cacheKey = `protocol:${slug}`;
    const cached = this.cache.get<ProtocolDetail>(cacheKey);
    if (cached) return cached;

    try {
      const raw = await this.client.get<any>(`/protocol/${encodeURIComponent(slug)}`);
      if (!raw) return null;
      const detail = normalizeProtocolDetail(raw);
      this.cache.set(cacheKey, detail);
      return detail;
    } catch (err) {
      this.emitError('getProtocol', err);
      const fromList = this.fallback().protocols.find((p) => p.slug === slug);
      if (fromList) {
        return {
          ...fromList,
          currentChainTvls: { [fromList.chain[0] || 'Ethereum']: fromList.tvl },
          tvlHistory: [],
        };
      }
      return null;
    }
  }

  /**
   * 协议 TVL 时间序列
   * 端点：GET /protocol/{slug} 的 tvl 字段
   */
  async getProtocolTvlHistory(slug: string): Promise<{ date: number; tvl: number }[]> {
    const detail = await this.getProtocol(slug);
    return detail?.tvlHistory || [];
  }

  // -------------------------------------------------------------------------
  // 链 TVL
  // -------------------------------------------------------------------------

  /**
   * 链 TVL
   * 端点：GET /v2/chains
   */
  async getChainTvl(chain: string): Promise<ChainTvl | null> {
    if (!chain) return null;
    const list = await this.listChainTvls();
    const found = list.find(
      (c) => (c.name || c.tokenSymbol || '').toLowerCase() === chain.toLowerCase(),
    );
    if (found) return found;
    // 模糊匹配
    const fuzzy = list.find(
      (c) => (c.name || c.tokenSymbol || '').toLowerCase().includes(chain.toLowerCase()),
    );
    return fuzzy || null;
  }

  /**
   * 全部链 TVL
   * 端点：GET /v2/chains
   */
  async listChainTvls(): Promise<ChainTvl[]> {
    const cacheKey = 'chains:all';
    const cached = this.cache.get<ChainTvl[]>(cacheKey);
    if (cached) return cached;

    try {
      const raw = await this.client.get<any[]>('/v2/chains');
      const list = (raw || []).map((item): ChainTvl => ({
        geckoId: item?.geckoId ?? null,
        tvl: toNumber(item?.tvl),
        tokenSymbol: toString(item?.tokenSymbol, ''),
        name: item?.name ? toString(item.name) : undefined,
        chainId: item?.chainId !== undefined ? toNumber(item.chainId) : undefined,
        protocols: Array.isArray(item?.protocols) ? item.protocols.filter((x: unknown) => typeof x === 'string') : undefined,
      }));
      this.cache.set(cacheKey, list);
      return list;
    } catch (err) {
      this.emitError('listChainTvls', err);
      return this.fallback().chainTvls;
    }
  }

  /**
   * 全局 TVL（所有链求和）
   * 端点：GET /v2/chains
   */
  async getGlobalTvl(): Promise<GlobalTvl> {
    const cacheKey = 'global:tvl';
    const cached = this.cache.get<GlobalTvl>(cacheKey);
    if (cached) return cached;

    try {
      const list = await this.listChainTvls();
      const total = list.reduce((acc, c) => acc + toNumber(c.tvl), 0);
      // 计算 1d 变化（用 protocols 的 change_1d 加权平均）
      const protocols = await this.listProtocols();
      const change1d = computeWeightedChange1d(protocols, total);
      const result: GlobalTvl = { total, change_1d: change1d, updatedAt: Date.now() };
      this.cache.set(cacheKey, result);
      return result;
    } catch (err) {
      this.emitError('getGlobalTvl', err);
      return this.fallback().globalTvl;
    }
  }

  // -------------------------------------------------------------------------
  // 排序 / 过滤 / 搜索
  // -------------------------------------------------------------------------

  /**
   * Top 协议（按 TVL 倒序）
   * @param limit 返回条数
   * @param category 类别过滤
   */
  async getTopByTvl(limit = TVL_DEFAULT_TOP_N, category?: string): Promise<Protocol[]> {
    const all = await this.listProtocols();
    let filtered = all;
    if (category) {
      const lower = category.toLowerCase();
      filtered = all.filter((p) => p.category.toLowerCase() === lower);
    }
    return filtered
      .slice()
      .sort((a, b) => b.tvl - a.tvl)
      .slice(0, Math.max(0, limit));
  }

  /**
   * 模糊搜索协议（按 name / slug / symbol）
   * @param query 关键词
   */
  async searchProtocols(query: string): Promise<Protocol[]> {
    if (!query) return [];
    const all = await this.listProtocols();
    const lower = query.toLowerCase();
    return all.filter(
      (p) =>
        p.name.toLowerCase().includes(lower) ||
        p.slug.toLowerCase().includes(lower) ||
        p.category.toLowerCase().includes(lower) ||
        p.chain.some((c) => c.toLowerCase().includes(lower)),
    );
  }

  // -------------------------------------------------------------------------
  // 健康 / 缓存
  // -------------------------------------------------------------------------

  /** 探测后端可达性 */
  async probe(): Promise<ProbeResult> {
    return this.client.probe();
  }

  /** 清空缓存 */
  clearCache(): void {
    this.cache.clear();
  }

  // -------------------------------------------------------------------------
  // 降级
  // -------------------------------------------------------------------------

  private fallback(): MockTvlData {
    if (!this.client.isFallbackEnabled()) {
      return { protocols: [], chainTvls: [], globalTvl: { total: 0, change_1d: 0, updatedAt: Date.now() } };
    }
    return this.mockProvider();
  }

  private emitError(op: string, err: unknown): void {
    // eslint-disable-next-line no-console
    console.warn(`[TvlService.${op}] fallback to mock:`, (err as Error).message);
    // 仅当有监听器时 emit（避免 EventEmitter 未处理错误）
    const client = this.client as unknown as { listenerCount?: (e: string) => number; emit?: (e: string, ...args: unknown[]) => boolean };
    if (client.listenerCount && client.listenerCount('error') > 0) {
      client.emit?.('error', { op, err });
    }
  }
}

// =============================================================================
// 工具
// =============================================================================

function computeWeightedChange1d(protocols: Protocol[], total: number): number {
  if (total <= 0 || protocols.length === 0) return 0;
  let weighted = 0;
  for (const p of protocols) {
    if (!Number.isFinite(p.tvl) || p.tvl <= 0) continue;
    weighted += (p.change_1d || 0) * p.tvl;
  }
  return weighted / total;
}

// =============================================================================
// 默认 Mock 数据（合理非全 0）
// =============================================================================

export function defaultMockTvlProvider(): MockTvlData {
  const protocols: Protocol[] = [
    {
      id: '1', name: 'Lido', slug: 'lido', chain: ['Ethereum'],
      category: 'Liquid Staking', tvl: 32_450_000_000, change_1d: 0.5, change_7d: 3.2, mcap: 2_400_000_000,
      logo: 'https://icons.llama.fi/lido.png', url: 'https://lido.fi',
      description: 'Liquid staking for Ethereum and other assets',
    },
    {
      id: '2', name: 'EigenLayer', slug: 'eigenlayer', chain: ['Ethereum'],
      category: 'Restaking', tvl: 18_700_000_000, change_1d: -1.2, change_7d: 5.1, mcap: 0,
      logo: 'https://icons.llama.fi/eigenlayer.png', url: 'https://eigenlayer.xyz',
    },
    {
      id: '3', name: 'Aave', slug: 'aave', chain: ['Ethereum', 'Polygon', 'Arbitrum', 'Optimism', 'Avalanche'],
      category: 'Lending', tvl: 12_350_000_000, change_1d: 0.8, change_7d: 2.5, mcap: 1_500_000_000,
      logo: 'https://icons.llama.fi/aave.png', url: 'https://aave.com',
    },
    {
      id: '4', name: 'Uniswap', slug: 'uniswap', chain: ['Ethereum', 'Arbitrum', 'Optimism', 'Polygon', 'Base'],
      category: 'Dexes', tvl: 6_800_000_000, change_1d: 0.3, change_7d: 1.8, mcap: 4_200_000_000,
      logo: 'https://icons.llama.fi/uniswap.png', url: 'https://uniswap.org',
    },
    {
      id: '5', name: 'MakerDAO', slug: 'makerdao', chain: ['Ethereum'],
      category: 'CDP', tvl: 4_900_000_000, change_1d: -0.4, change_7d: 0.9, mcap: 0,
      logo: 'https://icons.llama.fi/makerdao.png', url: 'https://makerdao.com',
    },
    {
      id: '6', name: 'Curve', slug: 'curve-dex', chain: ['Ethereum', 'Arbitrum', 'Polygon', 'Avalanche'],
      category: 'Dexes', tvl: 2_350_000_000, change_1d: 0.1, change_7d: -0.5, mcap: 480_000_000,
      logo: 'https://icons.llama.fi/curve.png',
    },
    {
      id: '7', name: 'Pendle', slug: 'pendle', chain: ['Ethereum', 'Arbitrum', 'BSC', 'Mantle'],
      category: 'Yield', tvl: 6_700_000_000, change_1d: 1.2, change_7d: 4.3, mcap: 720_000_000,
      logo: 'https://icons.llama.fi/pendle.png',
    },
    {
      id: '8', name: 'Spark', slug: 'spark', chain: ['Ethereum', 'Gnosis'],
      category: 'Lending', tvl: 3_200_000_000, change_1d: 0.6, change_7d: 2.1, mcap: 0,
      logo: 'https://icons.llama.fi/spark.png',
    },
  ];
  const chainTvls: ChainTvl[] = [
    { geckoId: 'ethereum', name: 'Ethereum', tokenSymbol: 'ETH', tvl: 65_400_000_000, chainId: 1 },
    { geckoId: 'arbitrum', name: 'Arbitrum', tokenSymbol: 'ARB', tvl: 3_120_000_000, chainId: 42161 },
    { geckoId: 'polygon-ecosystem-token', name: 'Polygon', tokenSymbol: 'POL', tvl: 1_850_000_000, chainId: 137 },
    { geckoId: 'optimism', name: 'Optimism', tokenSymbol: 'OP', tvl: 920_000_000, chainId: 10 },
    { geckoId: 'avalanche-2', name: 'Avalanche', tokenSymbol: 'AVAX', tvl: 750_000_000, chainId: 43114 },
    { geckoId: 'binancecoin', name: 'BSC', tokenSymbol: 'BNB', tvl: 1_400_000_000, chainId: 56 },
    { geckoId: 'base', name: 'Base', tokenSymbol: 'ETH', tvl: 2_650_000_000, chainId: 8453 },
  ];
  const total = chainTvls.reduce((a, c) => a + c.tvl, 0);
  const globalTvl: GlobalTvl = { total, change_1d: 0.45, updatedAt: Date.now() };
  return { protocols, chainTvls, globalTvl };
}
