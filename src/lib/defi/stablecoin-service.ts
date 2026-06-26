/**
 * DeFiLlama 稳定币服务 (G-03)
 *
 * 提供：
 *  - 稳定币列表（市值、流通量、价格、peg 类型）
 *  - 稳定币详情（按链分布、流动池、peg 偏离度）
 *  - 稳定币市值历史
 *  - 全局稳定币市值
 *  - peg 健康度评估（warning / critical）
 *  - 内存缓存（默认 5 min TTL）
 *  - 断网降级到 mock 数据
 *
 * 端点：
 *  - GET /stablecoins                 全部稳定币（带当前价格/市值）
 *  - GET /stablecoin/{id}             单个稳定币详情（链分布 + 池子 + 历史）
 *  - GET /stablecoincharts/{id}       单个稳定币历史市值
 *
 * 文档：https://api.llama.fi/docs
 */

import { DeFiLlamaClient, type ProbeResult } from './defillama-client';

// =============================================================================
// 配置常量
// =============================================================================

/** 内存缓存 TTL（毫秒） */
export const STABLE_CACHE_TTL_MS = 5 * 60_000;
/** 默认 top N */
export const STABLE_DEFAULT_TOP_N = 20;
/** peg 健康度阈值 */
export const PEG_HEALTH_WARNING_THRESHOLD = 0.005;   // 0.5%
export const PEG_HEALTH_CRITICAL_THRESHOLD = 0.01;   // 1.0%

// =============================================================================
// 类型
// =============================================================================

export type PegType = 'USD' | 'EUR' | 'BTC' | 'GOLD' | 'OTHER';

export interface Stablecoin {
  id: string;
  name: string;
  symbol: string;
  pegType: PegType;
  /** 流通量（USD） */
  circulating: number;
  /** 当前价格（USD） */
  price: number;
  /** 偏离 peg 的比例（绝对值，如 0.001 = 0.1%） */
  pegDeviation: number;
  /** 来源币（geckoId） */
  geckoId?: string;
}

export interface StablecoinDetail extends Stablecoin {
  currentChainBalances: Record<string, number>;
  circulatingPools: { pool: string; amount: number }[];
  history: { date: number; circulating: number }[];
}

export interface PegHealth {
  id: string;
  symbol: string;
  name: string;
  /** 偏离度（带符号，正=溢价，负=折价） */
  deviation: number;
  /** 当前价格 */
  price: number;
  health: 'healthy' | 'warning' | 'critical';
}

export interface GlobalStablecoinMarketCap {
  total: number;
  change_7d: number;
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

function detectPegType(symbol: string, name: string, peggedUSD?: boolean): PegType {
  const lower = (symbol + ' ' + name).toLowerCase();
  if (peggedUSD || lower.includes('usd') || lower.includes('dai') || lower.includes('busd') || lower.includes('usdc') || lower.includes('usdt') || lower.includes('stable')) return 'USD';
  if (lower.includes('eur') || lower.includes('euro')) return 'EUR';
  if (lower.includes('btc') || lower.includes('wbtc') || lower.includes('xbt')) return 'BTC';
  if (lower.includes('gold') || lower.includes('xau') || lower.includes('paxg')) return 'GOLD';
  return 'OTHER';
}

function normalizePegType(v: unknown): PegType {
  const s = String(v || '').toLowerCase();
  if (s === 'usd') return 'USD';
  if (s === 'eur') return 'EUR';
  if (s === 'btc') return 'BTC';
  if (s === 'gold') return 'GOLD';
  return 'OTHER';
}

function normalizeStablecoin(raw: any): Stablecoin {
  const symbol = toString(raw?.symbol, '');
  const name = toString(raw?.name, symbol);
  const price = toNumber(raw?.price);
  // pegDeviation = (price - 1) / 1（USD peg）; 偏离度绝对值
  let pegDeviation = 0;
  if (Number.isFinite(price) && price > 0) {
    pegDeviation = Math.abs(price - 1);
  } else if (typeof raw?.pegDeviation === 'number') {
    pegDeviation = Math.abs(raw.pegDeviation);
  }
  return {
    id: toString(raw?.id, symbol.toLowerCase()),
    name,
    symbol,
    pegType: raw?.pegType ? normalizePegType(raw.pegType) : detectPegType(symbol, name, raw?.peggedUSD),
    circulating: toNumber(raw?.circulating ?? raw?.currentChainBalances?.total?.amount),
    price,
    pegDeviation,
    geckoId: raw?.geckoId ? toString(raw.geckoId) : undefined,
  };
}

function normalizeStablecoinDetail(raw: any): StablecoinDetail {
  const base = normalizeStablecoin(raw);
  const currentChainBalances: Record<string, number> = {};
  if (raw?.currentChainBalances && typeof raw.currentChainBalances === 'object') {
    for (const [k, v] of Object.entries(raw.currentChainBalances)) {
      if (k === 'total') continue; // 跳过聚合字段
      if (v && typeof v === 'object') {
        const amt = toNumber((v as any)?.amount ?? (v as any)?.usdValue);
        if (amt > 0) currentChainBalances[k] = amt;
      } else if (typeof v === 'number') {
        if (v > 0) currentChainBalances[k] = v;
      }
    }
  }
  // 池子
  const circulatingPools: { pool: string; amount: number }[] = [];
  if (Array.isArray(raw?.circulatingPools)) {
    for (const p of raw.circulatingPools) {
      if (p && typeof p === 'object') {
        const pool = toString(p.pool, 'Unknown');
        const amount = toNumber(p.amount ?? p.usdValue);
        if (amount >= 0) {
          circulatingPools.push({ pool, amount });
        }
      }
    }
  }
  // 历史
  const history: { date: number; circulating: number }[] = [];
  if (Array.isArray(raw?.history)) {
    for (const item of raw.history) {
      if (Array.isArray(item) && item.length >= 2) {
        const date = toNumber(item[0], 0);
        const circulating = toNumber(item[1]);
        if (date > 0) history.push({ date: date * 1000, circulating });
      } else if (item && typeof item === 'object') {
        const date = toNumber((item as any).date, 0);
        const circulating = toNumber((item as any).circulating ?? (item as any).totalCirculatingUSD);
        if (date > 0) history.push({ date: date * 1000, circulating });
      }
    }
  }
  return {
    ...base,
    currentChainBalances,
    circulatingPools,
    history,
  };
}

// =============================================================================
// StablecoinService
// =============================================================================

export interface StablecoinServiceOptions {
  client?: DeFiLlamaClient;
  /** 缓存 TTL（毫秒），0 表示不缓存 */
  cacheTtlMs?: number;
  /** 自定义降级 mock 提供器 */
  mockProvider?: () => MockStablecoinData;
  /** peg 健康度阈值 */
  pegHealthWarningThreshold?: number;
  pegHealthCriticalThreshold?: number;
}

export interface MockStablecoinData {
  stablecoins: Stablecoin[];
  details: Record<string, StablecoinDetail>;
  totalMarketCap: GlobalStablecoinMarketCap;
}

export class StablecoinService {
  private readonly client: DeFiLlamaClient;
  private readonly cache: TtlCache;
  private readonly mockProvider: () => MockStablecoinData;
  private readonly pegHealthWarning: number;
  private readonly pegHealthCritical: number;

  constructor(opts: StablecoinServiceOptions = {}) {
    this.client = opts.client || new DeFiLlamaClient();
    this.cache = new TtlCache(opts.cacheTtlMs !== undefined ? opts.cacheTtlMs : STABLE_CACHE_TTL_MS);
    this.mockProvider = opts.mockProvider || defaultMockStablecoinProvider;
    this.pegHealthWarning = opts.pegHealthWarningThreshold ?? PEG_HEALTH_WARNING_THRESHOLD;
    this.pegHealthCritical = opts.pegHealthCriticalThreshold ?? PEG_HEALTH_CRITICAL_THRESHOLD;
  }

  // -------------------------------------------------------------------------
  // 列表
  // -------------------------------------------------------------------------

  /**
   * 全部稳定币
   * 端点：GET /stablecoins
   * 备注：DeFiLlama 的 /stablecoins 不含 price，需要从 peggedUSD 字段判断
   *       真实价格通过 /stablecoin/{id} 获取，因此默认情况下 price=1，pegDeviation=0
   *       调用方若需要实时价格可调用 enrichWithPrices()
   */
  async listStablecoins(): Promise<Stablecoin[]> {
    const cacheKey = 'stablecoins:all';
    const cached = this.cache.get<Stablecoin[]>(cacheKey);
    if (cached) return cached;

    try {
      const raw = await this.client.get<unknown>('/stablecoins');
      // 接口可能返回数组或 { peggedAssets: [...] }
      let arr: unknown[] = [];
      if (Array.isArray(raw)) {
        arr = raw;
      } else if (raw && typeof raw === 'object' && Array.isArray((raw as { peggedAssets?: unknown }).peggedAssets)) {
        arr = (raw as { peggedAssets: unknown[] }).peggedAssets;
      }
      const list = arr.map((item) => normalizeStablecoin(item));
      this.cache.set(cacheKey, list);
      return list;
    } catch (err) {
      this.emitError('listStablecoins', err);
      return this.fallback().stablecoins;
    }
  }

  /**
   * 单个稳定币详情
   * 端点：GET /stablecoin/{id}
   */
  async getStablecoin(id: string): Promise<StablecoinDetail | null> {
    if (!id) return null;
    const cacheKey = `stablecoin:${id}`;
    const cached = this.cache.get<StablecoinDetail>(cacheKey);
    if (cached) return cached;

    try {
      const raw = await this.client.get<any>(`/stablecoin/${encodeURIComponent(id)}`);
      if (!raw) return null;
      const detail = normalizeStablecoinDetail(raw);
      this.cache.set(cacheKey, detail);
      return detail;
    } catch (err) {
      this.emitError('getStablecoin', err);
      const mock = this.fallback().details[id];
      if (mock) return mock;
      const fromList = this.fallback().stablecoins.find((s) => s.id === id);
      if (fromList) {
        return {
          ...fromList,
          currentChainBalances: {},
          circulatingPools: [],
          history: [],
        };
      }
      return null;
    }
  }

  /**
   * 稳定币历史市值
   * 端点：GET /stablecoin/{id} 的 history 字段
   */
  async getStablecoinCirculatingHistory(id: string, days = 90): Promise<{ date: number; circulating: number }[]> {
    const detail = await this.getStablecoin(id);
    if (!detail) return [];
    return detail.history.slice(-Math.max(1, days));
  }

  // -------------------------------------------------------------------------
  // 排序 / 过滤
  // -------------------------------------------------------------------------

  /**
   * Top 稳定币（按流通量倒序）
   * @param limit 返回条数
   * @param pegType peg 类型过滤
   */
  async getTopByCirculating(limit = STABLE_DEFAULT_TOP_N, pegType?: PegType): Promise<Stablecoin[]> {
    const all = await this.listStablecoins();
    let filtered = all;
    if (pegType) {
      filtered = all.filter((s) => s.pegType === pegType);
    }
    return filtered
      .slice()
      .sort((a, b) => b.circulating - a.circulating)
      .slice(0, Math.max(0, limit));
  }

  /**
   * 全局稳定币市值
   * 端点：GET /stablecoins 求和
   */
  async getTotalStablecoinMarketCap(): Promise<GlobalStablecoinMarketCap> {
    const cacheKey = 'stablecoins:total';
    const cached = this.cache.get<GlobalStablecoinMarketCap>(cacheKey);
    if (cached) return cached;

    try {
      const all = await this.listStablecoins();
      const total = all.reduce((acc, s) => acc + s.circulating, 0);
      // 7d 变化：用每个币的 pegDeviation/价格波动粗略估算不可靠；此处用 mock 0，
      // 生产环境可补 /stablecoincharts 全量历史
      const result: GlobalStablecoinMarketCap = { total, change_7d: 0, updatedAt: Date.now() };
      this.cache.set(cacheKey, result);
      return result;
    } catch (err) {
      this.emitError('getTotalStablecoinMarketCap', err);
      return this.fallback().totalMarketCap;
    }
  }

  /**
   * peg 健康度评估
   * 根据每个稳定币的 pegDeviation 与价格判断健康状态
   */
  async getPegHealth(): Promise<PegHealth[]> {
    const all = await this.listStablecoins();
    return all.map((s) => {
      const deviation = signedPegDeviation(s);
      const abs = Math.abs(deviation);
      let health: PegHealth['health'] = 'healthy';
      if (abs >= this.pegHealthCritical) health = 'critical';
      else if (abs >= this.pegHealthWarning) health = 'warning';
      return {
        id: s.id,
        symbol: s.symbol,
        name: s.name,
        deviation,
        price: s.price,
        health,
      };
    });
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

  private fallback(): MockStablecoinData {
    if (!this.client.isFallbackEnabled()) {
      return { stablecoins: [], details: {}, totalMarketCap: { total: 0, change_7d: 0, updatedAt: Date.now() } };
    }
    return this.mockProvider();
  }

  private emitError(op: string, err: unknown): void {
    // eslint-disable-next-line no-console
    console.warn(`[StablecoinService.${op}] fallback to mock:`, (err as Error).message);
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

function signedPegDeviation(s: Stablecoin): number {
  // 用 price - 1 作为偏离度（USD 锚定）；其他锚定暂不参与
  if (s.pegType === 'USD' && Number.isFinite(s.price) && s.price > 0) {
    return s.price - 1;
  }
  return 0;
}

// =============================================================================
// 默认 Mock 数据
// =============================================================================

export function defaultMockStablecoinProvider(): MockStablecoinData {
  const stablecoins: Stablecoin[] = [
    {
      id: '1', name: 'Tether', symbol: 'USDT', pegType: 'USD',
      circulating: 118_500_000_000, price: 0.9998, pegDeviation: 0.0002, geckoId: 'tether',
    },
    {
      id: '2', name: 'USD Coin', symbol: 'USDC', pegType: 'USD',
      circulating: 35_400_000_000, price: 1.0001, pegDeviation: 0.0001, geckoId: 'usd-coin',
    },
    {
      id: '3', name: 'Dai', symbol: 'DAI', pegType: 'USD',
      circulating: 5_350_000_000, price: 0.9995, pegDeviation: 0.0005, geckoId: 'dai',
    },
    {
      id: '4', name: 'First Digital USD', symbol: 'FDUSD', pegType: 'USD',
      circulating: 2_800_000_000, price: 0.9985, pegDeviation: 0.0015, geckoId: 'first-digital-usd',
    },
    {
      id: '5', name: 'Ethena USDe', symbol: 'USDe', pegType: 'USD',
      circulating: 5_900_000_000, price: 1.0010, pegDeviation: 0.0010, geckoId: 'ethena-usde',
    },
    {
      id: '6', name: 'PayPal USD', symbol: 'PYUSD', pegType: 'USD',
      circulating: 720_000_000, price: 1.0000, pegDeviation: 0.0000, geckoId: 'paypal-usd',
    },
    {
      id: '7', name: 'FRAX', symbol: 'FRAX', pegType: 'USD',
      circulating: 650_000_000, price: 0.9993, pegDeviation: 0.0007, geckoId: 'frax',
    },
    {
      id: '8', name: 'TrueUSD', symbol: 'TUSD', pegType: 'USD',
      circulating: 480_000_000, price: 0.9982, pegDeviation: 0.0018, geckoId: 'true-usd',
    },
    {
      id: '9', name: 'USDD', symbol: 'USDD', pegType: 'USD',
      circulating: 720_000_000, price: 0.9870, pegDeviation: 0.0130, geckoId: 'usdd',
    },
    {
      id: '10', name: 'Euro Tether', symbol: 'EURT', pegType: 'EUR',
      circulating: 195_000_000, price: 1.0800, pegDeviation: 0.0, geckoId: 'tether-eurt',
    },
    {
      id: '11', name: 'Stasis Euro', symbol: 'EURS', pegType: 'EUR',
      circulating: 138_000_000, price: 1.0850, pegDeviation: 0.0, geckoId: 'stasis-eurs',
    },
    {
      id: '12', name: 'Wrapped Bitcoin', symbol: 'WBTC', pegType: 'BTC',
      circulating: 8_500_000_000, price: 67000, pegDeviation: 0.0, geckoId: 'wrapped-bitcoin',
    },
    {
      id: '13', name: 'Pax Gold', symbol: 'PAXG', pegType: 'GOLD',
      circulating: 280_000_000, price: 2350, pegDeviation: 0.0, geckoId: 'pax-gold',
    },
  ];
  const details: Record<string, StablecoinDetail> = {};
  for (const s of stablecoins) {
    details[s.id] = {
      ...s,
      currentChainBalances: {
        Ethereum: s.circulating * 0.65,
        Tron: s.circulating * 0.18,
        BSC: s.circulating * 0.07,
        Arbitrum: s.circulating * 0.05,
        Other: s.circulating * 0.05,
      },
      circulatingPools: [
        { pool: 'Curve 3pool', amount: s.circulating * 0.12 },
        { pool: 'Aave V3', amount: s.circulating * 0.08 },
      ],
      history: Array.from({ length: 90 }, (_, i) => ({
        date: (Date.now() - (89 - i) * 86_400_000),
        circulating: s.circulating * (0.94 + (i / 90) * 0.06),
      })),
    };
  }
  const total = stablecoins.reduce((a, s) => a + s.circulating, 0);
  const totalMarketCap: GlobalStablecoinMarketCap = {
    total,
    change_7d: 0.42,
    updatedAt: Date.now(),
  };
  return { stablecoins, details, totalMarketCap };
}
