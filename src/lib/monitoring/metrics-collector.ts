/**
 * 指标采集器（MetricsCollector）
 *
 * 维护各种运行时指标的滑动窗口：
 *  - 每个 RPC 节点的延迟 / 成功 / 失败
 *  - 每个交易对的价格历史
 *  - 每个链的区块号历史
 *  - WebSocket 连接状态
 *
 * 内存占用：默认每个窗口保留 100 个样本
 *
 * 提供 P50 / P99 / 平均 / 最大 等聚合统计。
 */

// =============================================================================
// 滑动窗口
// =============================================================================

export class SlidingWindow<T> {
  private readonly buffer: T[] = [];
  private readonly maxSize: number;

  constructor(maxSize: number = 100) {
    this.maxSize = Math.max(1, maxSize);
  }

  /** 添加样本 */
  push(value: T): void {
    this.buffer.push(value);
    if (this.buffer.length > this.maxSize) {
      this.buffer.shift();
    }
  }

  /** 获取所有样本（只读副本） */
  values(): T[] {
    return this.buffer.slice();
  }

  /** 当前样本数 */
  size(): number {
    return this.buffer.length;
  }

  /** 是否为空 */
  isEmpty(): boolean {
    return this.buffer.length === 0;
  }

  /** 最新的样本 */
  last(): T | undefined {
    return this.buffer[this.buffer.length - 1];
  }

  /** 清空 */
  clear(): void {
    this.buffer.length = 0;
  }

  /** 最大容量 */
  capacity(): number {
    return this.maxSize;
  }
}

// =============================================================================
// 类型定义
// =============================================================================

/** RPC 调用结果 */
export interface RpcSample {
  /** 链名：ETH / BSC */
  chain: string;
  /** 节点 URL（用于区分多节点） */
  node: string;
  /** 延迟（ms），失败时为 0 或未设置 */
  latencyMs: number;
  /** 时间戳 */
  ts: number;
  /** 是否成功 */
  success: boolean;
  /** 错误信息（失败时） */
  error?: string;
}

/** 价格样本 */
export interface PriceSample {
  /** 交易对：BTC/USDT */
  symbol: string;
  /** 价格 */
  price: number;
  /** 来源：binance / okx / coinbase */
  source: string;
  /** 时间戳 */
  ts: number;
}

/** 区块样本 */
export interface BlockSample {
  /** 链名 */
  chain: string;
  /** 区块号 */
  blockNumber: number;
  /** 时间戳 */
  ts: number;
}

/** WebSocket 状态 */
export type WsStatus = 'connected' | 'disconnected' | 'connecting';

export interface WsStateSample {
  /** 名称（如 'binance'） */
  name: string;
  /** 当前状态 */
  status: WsStatus;
  /** 时间戳 */
  ts: number;
}

// =============================================================================
// 统计工具
// =============================================================================

/** 数字数组的 P50（中位数） */
export function percentile(values: number[], p: number): number {
  if (values.length === 0) return 0;
  const sorted = values.slice().sort((a, b) => a - b);
  // 线性插值索引：[0, length-1]
  const idx = Math.min(sorted.length - 1, Math.max(0, Math.floor((p / 100) * (sorted.length - 1))));
  return sorted[idx];
}

/** 数字数组平均值 */
export function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((s, v) => s + v, 0) / values.length;
}

/** 数字数组最大值 */
export function max(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((m, v) => (v > m ? v : m), -Infinity);
}

/** 数字数组最小值 */
export function min(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((m, v) => (v < m ? v : m), Infinity);
}

// =============================================================================
// MetricsCollector
// =============================================================================

export interface MetricsCollectorOptions {
  /** 每个窗口最大样本数，默认 100 */
  windowSize?: number;
  /** 时间提供者（用于测试） */
  now?: () => number;
}

export class MetricsCollector {
  private readonly windowSize: number;
  private readonly now: () => number;

  /** chain -> node -> SlidingWindow<RpcSample> */
  private readonly rpcWindows: Map<string, Map<string, SlidingWindow<RpcSample>>> = new Map();
  /** chain -> node -> 连续失败次数 */
  private readonly rpcConsecFailures: Map<string, Map<string, number>> = new Map();
  /** chain -> node -> 最近一次采样时间 */
  private readonly rpcLastSeen: Map<string, Map<string, number>> = new Map();

  /** symbol -> source -> SlidingWindow<PriceSample> */
  private readonly priceWindows: Map<string, Map<string, SlidingWindow<PriceSample>>> = new Map();

  /** chain -> SlidingWindow<BlockSample> */
  private readonly blockWindows: Map<string, SlidingWindow<BlockSample>> = new Map();

  /** name -> WsStateSample（保留历史以判断持续断开时长） */
  private readonly wsHistory: Map<string, SlidingWindow<WsStateSample>> = new Map();

  constructor(opts: MetricsCollectorOptions = {}) {
    this.windowSize = opts.windowSize ?? 100;
    this.now = opts.now ?? Date.now;
  }

  // -------------------------------------------------------------------------
  // RPC
  // -------------------------------------------------------------------------

  recordRpcLatency(chain: string, node: string, latencyMs: number): void {
    this.ensureRpc(chain, node);
    const win = this.rpcWindows.get(chain)!.get(node)!;
    win.push({ chain, node, latencyMs, ts: this.now(), success: true });
    this.rpcLastSeen.get(chain)!.set(node, this.now());
  }

  recordRpcFailure(chain: string, node: string, error: string): void {
    this.ensureRpc(chain, node);
    const win = this.rpcWindows.get(chain)!.get(node)!;
    win.push({ chain, node, latencyMs: 0, ts: this.now(), success: false, error });
    const prev = this.rpcConsecFailures.get(chain)!.get(node) || 0;
    this.rpcConsecFailures.get(chain)!.set(node, prev + 1);
  }

  recordRpcSuccess(chain: string, node: string, latencyMs: number): void {
    // 同时记录成功 + 重置连续失败
    this.recordRpcLatency(chain, node, latencyMs);
    this.rpcConsecFailures.get(chain)?.set(node, 0);
  }

  /** 节点的连续失败次数（自上次重置以来） */
  getConsecutiveFailures(chain: string, node: string): number {
    return this.rpcConsecFailures.get(chain)?.get(node) ?? 0;
  }

  /** 获取某链某节点的最近延迟（ms，失败样本忽略） */
  getRecentLatencies(chain: string, node: string): number[] {
    const win = this.rpcWindows.get(chain)?.get(node);
    if (!win) return [];
    return win.values().filter(s => s.success).map(s => s.latencyMs);
  }

  /** 某链所有节点的平均延迟（ms） */
  getChainAverageLatency(chain: string): number {
    const nodes = this.rpcWindows.get(chain);
    if (!nodes) return 0;
    const all: number[] = [];
    for (const win of nodes.values()) {
      for (const s of win.values()) {
        if (s.success) all.push(s.latencyMs);
      }
    }
    return mean(all);
  }

  /** 某链某节点的 P50 / P99 延迟 */
  getNodeLatencyStats(chain: string, node: string): { p50: number; p99: number; mean: number; max: number; count: number } {
    const values = this.getRecentLatencies(chain, node);
    return {
      p50: percentile(values, 50),
      p99: percentile(values, 99),
      mean: mean(values),
      max: max(values),
      count: values.length,
    };
  }

  /** 某链的 P50 / P99 延迟（跨节点） */
  getChainLatencyStats(chain: string): { p50: number; p99: number; mean: number; max: number; count: number } {
    const nodes = this.rpcWindows.get(chain);
    if (!nodes) return { p50: 0, p99: 0, mean: 0, max: 0, count: 0 };
    const all: number[] = [];
    for (const win of nodes.values()) {
      for (const s of win.values()) {
        if (s.success) all.push(s.latencyMs);
      }
    }
    return {
      p50: percentile(all, 50),
      p99: percentile(all, 99),
      mean: mean(all),
      max: max(all),
      count: all.length,
    };
  }

  /** 某链的成功率（0..1） */
  getChainSuccessRate(chain: string): number {
    const nodes = this.rpcWindows.get(chain);
    if (!nodes) return 1;
    let total = 0;
    let success = 0;
    for (const win of nodes.values()) {
      for (const s of win.values()) {
        total++;
        if (s.success) success++;
      }
    }
    return total === 0 ? 1 : success / total;
  }

  /** 主节点（最近成功次数最多的）URL */
  getPrimaryNode(chain: string): string | null {
    const nodes = this.rpcWindows.get(chain);
    if (!nodes || nodes.size === 0) return null;
    let best: { node: string; success: number } | null = null;
    for (const [node, win] of nodes.entries()) {
      const success = win.values().filter(s => s.success).length;
      if (!best || success > best.success) {
        best = { node, success };
      }
    }
    return best?.node ?? null;
  }

  /** 列出某链所有节点 */
  listNodes(chain: string): string[] {
    return Array.from(this.rpcWindows.get(chain)?.keys() ?? []);
  }

  // -------------------------------------------------------------------------
  // 价格
  // -------------------------------------------------------------------------

  recordPrice(symbol: string, price: number, source: string): void {
    if (!this.priceWindows.has(symbol)) {
      this.priceWindows.set(symbol, new Map());
    }
    const sources = this.priceWindows.get(symbol)!;
    if (!sources.has(source)) {
      sources.set(source, new SlidingWindow<PriceSample>(this.windowSize));
    }
    sources.get(source)!.push({ symbol, price, source, ts: this.now() });
  }

  /** 某交易对的所有源最新价格 */
  getLatestPricesBySource(symbol: string): Record<string, number> {
    const sources = this.priceWindows.get(symbol);
    if (!sources) return {};
    const out: Record<string, number> = {};
    for (const [src, win] of sources.entries()) {
      const last = win.last();
      if (last) out[src] = last.price;
    }
    return out;
  }

  /** 某交易对最近 N 秒内的价格历史（按时间合并所有源） */
  getPriceHistory(symbol: string, withinMs: number): PriceSample[] {
    const sources = this.priceWindows.get(symbol);
    if (!sources) return [];
    const cutoff = this.now() - withinMs;
    const out: PriceSample[] = [];
    for (const win of sources.values()) {
      for (const s of win.values()) {
        if (s.ts >= cutoff) out.push(s);
      }
    }
    out.sort((a, b) => a.ts - b.ts);
    return out;
  }

  /** 某交易对 1 分钟内价格最大变化率（0..1） */
  getPriceChangeRatio(symbol: string, windowMs: number = 60_000): number {
    const history = this.getPriceHistory(symbol, windowMs);
    if (history.length < 2) return 0;
    let min = Infinity;
    let max = -Infinity;
    for (const h of history) {
      if (h.price < min) min = h.price;
      if (h.price > max) max = h.price;
    }
    if (!isFinite(min) || !isFinite(max) || min === 0) return 0;
    return (max - min) / min;
  }

  /** 某交易对多源偏离度（max-min / min） */
  getPriceDeviation(symbol: string): { deviation: number; min: number; max: number; sources: number } {
    const latest = this.getLatestPricesBySource(symbol);
    const prices = Object.values(latest);
    if (prices.length < 2) return { deviation: 0, min: 0, max: 0, sources: prices.length };
    const mn = min(prices);
    const mx = max(prices);
    return {
      deviation: mn === 0 ? 0 : (mx - mn) / mn,
      min: mn,
      max: mx,
      sources: prices.length,
    };
  }

  /** 列出已记录的交易对 */
  listSymbols(): string[] {
    return Array.from(this.priceWindows.keys());
  }

  // -------------------------------------------------------------------------
  // 区块
  // -------------------------------------------------------------------------

  recordBlock(chain: string, blockNumber: number): void {
    if (!this.blockWindows.has(chain)) {
      this.blockWindows.set(chain, new SlidingWindow<BlockSample>(this.windowSize));
    }
    this.blockWindows.get(chain)!.push({ chain, blockNumber, ts: this.now() });
  }

  /** 获取某链最新区块号 */
  getLatestBlock(chain: string): number | null {
    const win = this.blockWindows.get(chain);
    if (!win) return null;
    const last = win.last();
    return last ? last.blockNumber : null;
  }

  /** 区块更新间隔（ms）= 最新区块时间 - 上一区块时间 */
  getBlockUpdateAgeMs(chain: string): number {
    const win = this.blockWindows.get(chain);
    if (!win) return Infinity;
    const samples = win.values();
    if (samples.length === 0) return Infinity;
    const last = samples[samples.length - 1];
    return this.now() - last.ts;
  }

  // -------------------------------------------------------------------------
  // WebSocket
  // -------------------------------------------------------------------------

  recordWsStatus(name: string, status: WsStatus): void {
    if (!this.wsHistory.has(name)) {
      this.wsHistory.set(name, new SlidingWindow<WsStateSample>(50));
    }
    this.wsHistory.get(name)!.push({ name, status, ts: this.now() });
  }

  /** WebSocket 当前是否处于断开状态 */
  isWsDisconnected(name: string): boolean {
    const win = this.wsHistory.get(name);
    if (!win) return true;
    const last = win.last();
    return !last || last.status === 'disconnected';
  }

  /** WebSocket 断开持续时长（ms） */
  getWsDisconnectDurationMs(name: string): number {
    const win = this.wsHistory.get(name);
    if (!win) return 0;
    const samples = win.values();
    if (samples.length === 0) return 0;
    const last = samples[samples.length - 1];
    if (last.status === 'connected') return 0;
    // 找到最近一次 disconnected 状态开始的时间（从尾向前扫描，跳过所有非 connected 状态）
    let disconnectStartTs: number = last.ts;
    for (let i = samples.length - 1; i >= 0; i--) {
      if (samples[i].status === 'connected') {
        // 当前连续断开段从 i+1 开始
        disconnectStartTs = i + 1 < samples.length ? samples[i + 1].ts : last.ts;
        break;
      }
      disconnectStartTs = samples[i].ts;
    }
    return this.now() - disconnectStartTs;
  }

  // -------------------------------------------------------------------------
  // 内部
  // -------------------------------------------------------------------------

  private ensureRpc(chain: string, node: string): void {
    if (!this.rpcWindows.has(chain)) {
      this.rpcWindows.set(chain, new Map());
      this.rpcConsecFailures.set(chain, new Map());
      this.rpcLastSeen.set(chain, new Map());
    }
    const chainMap = this.rpcWindows.get(chain)!;
    if (!chainMap.has(node)) {
      chainMap.set(node, new SlidingWindow<RpcSample>(this.windowSize));
      this.rpcConsecFailures.get(chain)!.set(node, 0);
      this.rpcLastSeen.get(chain)!.set(node, this.now());
    }
  }

  // -------------------------------------------------------------------------
  // 维护
  // -------------------------------------------------------------------------

  clear(): void {
    this.rpcWindows.clear();
    this.rpcConsecFailures.clear();
    this.rpcLastSeen.clear();
    this.priceWindows.clear();
    this.blockWindows.clear();
    this.wsHistory.clear();
  }
}

export default MetricsCollector;
