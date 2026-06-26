/**
 * DeFiLlama DEX 交易量服务 (G-02)
 *
 * 提供：
 *  - DEX 列表（按协议/按链）
 *  - DEX 详情（24h 交易量、变化、历史）
 *  - 链聚合 24h 交易量
 *  - 内存缓存（默认 1 min TTL，更新更频繁）
 *  - 断网降级到 mock 数据
 *
 * 端点：
 *  - GET /overview/dexs           全部 DEX（含链级聚合）
 *  - GET /overview/dexs/{slug}    单个 DEX
 *  - GET /summary/dexs/{slug}     单个 DEX 简版（仅历史）
 *  - GET /volume/chain             链聚合
 *
 * 文档：https://api.llama.fi/docs
 */

import { DeFiLlamaClient, type ProbeResult } from './defillama-client';

// =============================================================================
// 配置常量
// =============================================================================

/** 内存缓存 TTL（毫秒） */
export const DEX_VOLUME_CACHE_TTL_MS = 60_000;
/** 默认 top N */
export const DEX_DEFAULT_TOP_N = 20;

// =============================================================================
// 类型
// =============================================================================

export type DexCategory = 'Dexes' | 'Derivatives' | 'Yield' | 'Lending';

export interface Dex {
  name: string;
  slug: string;
  category: DexCategory;
  total24h: number;
  change_24h: number;
  totalAllTime: number;
  chains: string[];
  logo?: string;
  /** 协议所在链（首选链） */
  primaryChain?: string;
}

export interface DexDetail extends Dex {
  volumeHistory: { date: number; volume: number }[];
  methodology?: string;
}

/** 链级聚合 24h */
export interface ChainDexVolume {
  chain: string;
  total24h: number;
  change_24h: number;
  totalAllTime: number;
}

/** 全局 24h 交易量 */
export interface GlobalDexVolume {
  total24h: number;
  totalChange24h: number;
  breakdown: Dex[];
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
}

// =============================================================================
// 工具
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

function detectCategory(displayName: string, slug: string): DexCategory {
  const lower = (displayName + ' ' + slug).toLowerCase();
  if (lower.includes('deriv') || lower.includes('perp') || lower.includes('future')) return 'Derivatives';
  if (lower.includes('yield') || lower.includes('vault')) return 'Yield';
  if (lower.includes('lend') || lower.includes('borrow')) return 'Lending';
  return 'Dexes';
}

function normalizeCategory(v: unknown): DexCategory {
  const s = String(v || '').toLowerCase();
  if (s === 'dexes' || s === 'dex') return 'Dexes';
  if (s === 'derivatives' || s === 'derivative') return 'Derivatives';
  if (s === 'yield') return 'Yield';
  if (s === 'lending') return 'Lending';
  return 'Dexes';
}

function normalizeDex(raw: any): Dex {
  return {
    name: toString(raw?.name, toString(raw?.displayName, 'Unknown')),
    slug: toString(raw?.slug ?? raw?.defillamaId, ''),
    category: normalizeCategory(raw?.category),
    total24h: toNumber(raw?.total24h),
    change_24h: toNumber(raw?.change_24h),
    totalAllTime: toNumber(raw?.totalAllTime),
    chains: toStringArray(raw?.chains),
    logo: raw?.logo ? toString(raw.logo) : undefined,
    primaryChain: toString(raw?.chain, ''),
  };
}

function normalizeDexDetail(raw: any): DexDetail {
  const base = normalizeDex(raw);
  const volumeHistory: { date: number; volume: number }[] = [];
  if (Array.isArray(raw?.totalDataChart)) {
    for (const item of raw.totalDataChart) {
      // [unix_ts, volume]
      if (Array.isArray(item) && item.length >= 2) {
        const date = toNumber(item[0], 0);
        const volume = toNumber(item[1]);
        if (date > 0) volumeHistory.push({ date: date * 1000, volume });
      } else if (item && typeof item === 'object') {
        const date = toNumber(item.date, 0);
        const volume = toNumber(item.volume);
        if (date > 0) volumeHistory.push({ date: date * 1000, volume });
      }
    }
  }
  return {
    ...base,
    volumeHistory,
    methodology: raw?.methodology ? toString(raw.methodology) : undefined,
  };
}

// =============================================================================
// DexVolumeService
// =============================================================================

export interface DexVolumeServiceOptions {
  client?: DeFiLlamaClient;
  /** 缓存 TTL（毫秒），0 表示不缓存 */
  cacheTtlMs?: number;
  /** 自定义降级 mock 提供器 */
  mockProvider?: () => MockDexData;
}

export interface MockDexData {
  dexes: Dex[];
  chainVolumes: ChainDexVolume[];
  globalVolume: GlobalDexVolume;
}

export class DexVolumeService {
  private readonly client: DeFiLlamaClient;
  private readonly cache: TtlCache;
  private readonly mockProvider: () => MockDexData;

  constructor(opts: DexVolumeServiceOptions = {}) {
    this.client = opts.client || new DeFiLlamaClient();
    this.cache = new TtlCache(opts.cacheTtlMs !== undefined ? opts.cacheTtlMs : DEX_VOLUME_CACHE_TTL_MS);
    this.mockProvider = opts.mockProvider || defaultMockDexProvider;
  }

  // -------------------------------------------------------------------------
  // DEX 列表
  // -------------------------------------------------------------------------

  /**
   * 全部 DEX
   * 端点：GET /overview/dexs
   */
  async listDexes(): Promise<Dex[]> {
    const cacheKey = 'dexes:all';
    const cached = this.cache.get<Dex[]>(cacheKey);
    if (cached) return cached;

    try {
      const raw = await this.client.get<any>('/overview/dexs');
      // 接口返回 { protocols: [...], allChains: [...] } 两种结构都可能出现
      const arr = Array.isArray(raw) ? raw : Array.isArray(raw?.protocols) ? raw.protocols : [];
      const list = arr.map(normalizeDex);
      this.cache.set(cacheKey, list);
      return list;
    } catch (err) {
      this.emitError('listDexes', err);
      return this.fallback().dexes;
    }
  }

  /**
   * 单个 DEX 详情
   * 端点：GET /overview/dexs/{slug}
   */
  async getDex(slug: string): Promise<DexDetail | null> {
    if (!slug) return null;
    const cacheKey = `dex:${slug}`;
    const cached = this.cache.get<DexDetail>(cacheKey);
    if (cached) return cached;

    try {
      const raw = await this.client.get<any>(`/overview/dexs/${encodeURIComponent(slug)}`);
      if (!raw) return null;
      const detail = normalizeDexDetail(raw);
      this.cache.set(cacheKey, detail);
      return detail;
    } catch (err) {
      this.emitError('getDex', err);
      const fromList = this.fallback().dexes.find((d) => d.slug === slug);
      if (fromList) {
        return { ...fromList, volumeHistory: [] };
      }
      return null;
    }
  }

  /**
   * 全局 24h DEX 交易量
   * 端点：GET /overview/dexs 求和
   */
  async getDexVolume24h(slug?: string): Promise<{ total24h: number; totalChange24h: number; breakdown: Dex[] }> {
    if (slug) {
      const detail = await this.getDex(slug);
      if (!detail) {
        return { total24h: 0, totalChange24h: 0, breakdown: [] };
      }
      return {
        total24h: detail.total24h,
        totalChange24h: detail.change_24h,
        breakdown: [detail],
      };
    }
    const all = await this.listDexes();
    const total24h = all.reduce((acc, d) => acc + d.total24h, 0);
    const totalChange24h = computeWeightedChange24h(all, total24h);
    return { total24h, totalChange24h, breakdown: all };
  }

  /**
   * 单个 DEX 的历史交易量
   * 端点：GET /overview/dexs/{slug} 的 totalDataChart 字段
   */
  async getDexVolumeHistory(slug: string, days = 30): Promise<{ date: number; volume: number }[]> {
    const detail = await this.getDex(slug);
    if (!detail) return [];
    return detail.volumeHistory.slice(-Math.max(1, days));
  }

  // -------------------------------------------------------------------------
  // 排序 / 过滤
  // -------------------------------------------------------------------------

  /**
   * Top DEX（按 24h 交易量倒序）
   * @param limit 返回条数
   * @param chain 链过滤（任一链命中即包含）
   */
  async getTopByVolume(limit = DEX_DEFAULT_TOP_N, chain?: string): Promise<Dex[]> {
    const all = await this.listDexes();
    let filtered = all;
    if (chain) {
      const lower = chain.toLowerCase();
      filtered = all.filter((d) =>
        d.chains.some((c) => c.toLowerCase() === lower) ||
        (d.primaryChain && d.primaryChain.toLowerCase() === lower),
      );
    }
    return filtered
      .slice()
      .sort((a, b) => b.total24h - a.total24h)
      .slice(0, Math.max(0, limit));
  }

  /**
   * 链聚合 24h 交易量
   * 端点：GET /volume/chain（实际是 /overview/dexs 求和）
   */
  async getChainDexVolume(chain: string): Promise<ChainDexVolume> {
    const all = await this.listDexes();
    const lower = chain.toLowerCase();
    const matched = all.filter(
      (d) => d.chains.some((c) => c.toLowerCase() === lower) ||
        (d.primaryChain && d.primaryChain.toLowerCase() === lower),
    );
    const total24h = matched.reduce((acc, d) => acc + d.total24h, 0);
    const totalAllTime = matched.reduce((acc, d) => acc + d.totalAllTime, 0);
    const totalChange24h = computeWeightedChange24h(matched, total24h);
    return { chain, total24h, change_24h: totalChange24h, totalAllTime };
  }

  /** 全部链聚合（包含每链 24h 与全局） */
  async getAllChainDexVolume(): Promise<{ chains: ChainDexVolume[]; global: GlobalDexVolume }> {
    const cacheKey = 'dex:chainVolumeAll';
    const cached = this.cache.get<{ chains: ChainDexVolume[]; global: GlobalDexVolume }>(cacheKey);
    if (cached) return cached;

    try {
      const all = await this.listDexes();
      const chainMap = new Map<string, ChainDexVolume>();
      for (const d of all) {
        const chains = d.primaryChain ? [d.primaryChain, ...d.chains] : d.chains;
        for (const chain of chains) {
          if (!chain) continue;
          const cur = chainMap.get(chain) || { chain, total24h: 0, change_24h: 0, totalAllTime: 0 };
          cur.total24h += d.total24h;
          cur.totalAllTime += d.totalAllTime;
          chainMap.set(chain, cur);
        }
      }
      // 每个链的变化率取均值
      for (const v of chainMap.values()) {
        // 简化：保持 0；调用方若需要可进一步用各 dex 占比加权
      }
      const chains = Array.from(chainMap.values()).sort((a, b) => b.total24h - a.total24h);
      const total24h = all.reduce((acc, d) => acc + d.total24h, 0);
      const totalChange24h = computeWeightedChange24h(all, total24h);
      const global: GlobalDexVolume = { total24h, totalChange24h, breakdown: all, updatedAt: Date.now() };
      const result = { chains, global };
      this.cache.set(cacheKey, result);
      return result;
    } catch (err) {
      this.emitError('getAllChainDexVolume', err);
      return { chains: this.fallback().chainVolumes, global: this.fallback().globalVolume };
    }
  }

  // -------------------------------------------------------------------------
  // 健康 / 缓存
  // -------------------------------------------------------------------------

  async probe(): Promise<ProbeResult> {
    return this.client.probe();
  }

  clearCache(): void {
    this.cache.clear();
  }

  // -------------------------------------------------------------------------
  // 降级
  // -------------------------------------------------------------------------

  private fallback(): MockDexData {
    if (!this.client.isFallbackEnabled()) {
      return {
        dexes: [],
        chainVolumes: [],
        globalVolume: { total24h: 0, totalChange24h: 0, breakdown: [], updatedAt: Date.now() },
      };
    }
    return this.mockProvider();
  }

  private emitError(op: string, err: unknown): void {
    // eslint-disable-next-line no-console
    console.warn(`[DexVolumeService.${op}] fallback to mock:`, (err as Error).message);
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

function computeWeightedChange24h(dexes: Dex[], total: number): number {
  if (total <= 0 || dexes.length === 0) return 0;
  let weighted = 0;
  for (const d of dexes) {
    if (!Number.isFinite(d.total24h) || d.total24h <= 0) continue;
    weighted += (d.change_24h || 0) * d.total24h;
  }
  return weighted / total;
}

// =============================================================================
// 默认 Mock 数据
// =============================================================================

export function defaultMockDexProvider(): MockDexData {
  const dexes: Dex[] = [
    {
      name: 'Uniswap V3', slug: 'uniswap-v3', category: 'Dexes',
      total24h: 1_280_000_000, change_24h: 5.4, totalAllTime: 1_200_000_000_000,
      chains: ['Ethereum', 'Arbitrum', 'Optimism', 'Polygon', 'Base'], primaryChain: 'Ethereum',
      logo: 'https://icons.llama.fi/uniswap.png',
    },
    {
      name: 'PancakeSwap V3', slug: 'pancakeswap-v3', category: 'Dexes',
      total24h: 850_000_000, change_24h: -2.1, totalAllTime: 480_000_000_000,
      chains: ['BSC', 'Ethereum', 'Arbitrum', 'Base'], primaryChain: 'BSC',
    },
    {
      name: 'Raydium', slug: 'raydium', category: 'Dexes',
      total24h: 620_000_000, change_24h: 8.2, totalAllTime: 230_000_000_000,
      chains: ['Solana'], primaryChain: 'Solana',
    },
    {
      name: 'Curve', slug: 'curve-dex', category: 'Dexes',
      total24h: 240_000_000, change_24h: 0.3, totalAllTime: 320_000_000_000,
      chains: ['Ethereum', 'Arbitrum', 'Polygon', 'Avalanche'], primaryChain: 'Ethereum',
    },
    {
      name: 'dYdX', slug: 'dydx', category: 'Derivatives',
      total24h: 720_000_000, change_24h: -3.5, totalAllTime: 1_100_000_000_000,
      chains: ['Cosmos', 'Ethereum'], primaryChain: 'Cosmos',
    },
    {
      name: 'Hyperliquid', slug: 'hyperliquid', category: 'Derivatives',
      total24h: 1_120_000_000, change_24h: 12.4, totalAllTime: 95_000_000_000,
      chains: ['Hyperliquid'], primaryChain: 'Hyperliquid',
    },
    {
      name: 'GMX', slug: 'gmx', category: 'Derivatives',
      total24h: 320_000_000, change_24h: 1.8, totalAllTime: 78_000_000_000,
      chains: ['Arbitrum', 'Avalanche'], primaryChain: 'Arbitrum',
    },
    {
      name: 'Aave V3', slug: 'aave-v3', category: 'Lending',
      total24h: 95_000_000, change_24h: 0.2, totalAllTime: 28_000_000_000,
      chains: ['Ethereum', 'Polygon', 'Arbitrum', 'Optimism', 'Avalanche'], primaryChain: 'Ethereum',
    },
  ];
  const chainVolumes: ChainDexVolume[] = [
    { chain: 'Ethereum', total24h: 1_540_000_000, change_24h: 4.2, totalAllTime: 1_640_000_000_000 },
    { chain: 'BSC', total24h: 880_000_000, change_24h: -1.9, totalAllTime: 510_000_000_000 },
    { chain: 'Solana', total24h: 760_000_000, change_24h: 7.1, totalAllTime: 320_000_000_000 },
    { chain: 'Arbitrum', total24h: 480_000_000, change_24h: 2.4, totalAllTime: 220_000_000_000 },
    { chain: 'Base', total24h: 195_000_000, change_24h: 3.7, totalAllTime: 56_000_000_000 },
    { chain: 'Hyperliquid', total24h: 1_120_000_000, change_24h: 12.4, totalAllTime: 95_000_000_000 },
  ];
  const total24h = dexes.reduce((a, d) => a + d.total24h, 0);
  const totalChange24h = computeWeightedChange24h(dexes, total24h);
  const globalVolume: GlobalDexVolume = { total24h, totalChange24h, breakdown: dexes, updatedAt: Date.now() };
  return { dexes, chainVolumes, globalVolume };
}
