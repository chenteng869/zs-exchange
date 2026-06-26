'use client';

/**
 * H5 → Binance 公共 WebSocket 实时推送
 *
 *  - 单例：全局一个 WebSocket 连接（Combined Stream）订阅多个交易对
 *  - ticker 推送：<sym>@ticker（24h 行情）
 *  - kline  推送：<sym>@kline_<interval>（实时 K 线）
 *  - 自动重连：指数退避，最大 10s
 *  - 节流推送：ticker 1s 最多 1 次 / 交易对（避免 UI 抖动）
 *
 *  断线策略（决策 A）：
 *   - 任何订阅状态变 disconnected → 触发 onStatus('offline')
 *   - 业务层（H5 页面）应：
 *     1. 顶部显示"重连中..."指示
 *     2. K 线区域显示骨架屏
 *     3. 买入/卖出按钮置灰
 */

import { useEffect, useRef, useState } from 'react';
import { BinanceRestClient, normalizeWsTicker, normalizeKline, type BinanceWsCombinedMessage, BINANCE_WS_COMBINED } from './binance-client';
import type { Ticker } from './feed';
import type { Kline, KlineInterval } from './kline';
import { toBinanceStream } from './binance-client';
import { toBinanceSymbol } from '@/lib/h5/top20-pairs';

// =============================================================================
// 单例：全局 WebSocket 管理器
// =============================================================================

export type ConnStatus = 'connecting' | 'online' | 'offline';

type TickerListener = (t: Ticker) => void;
type KlineListener = (k: Kline) => void;
type StatusListener = (s: ConnStatus) => void;

interface SubKey {
  type: 'ticker' | 'kline';
  symbol: string;     // H5 格式：BTC/USDT
  interval?: KlineInterval;  // kline 用
}

class BinanceStreamSingleton {
  private ws: WebSocket | null = null;
  private status: ConnStatus = 'offline';
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private lastSend: Record<string, number> = {};   // 节流用
  private readonly throttleMs = 1000;

  // 订阅表：streamName -> Set<listener>
  private tickerSubs = new Map<string, Set<TickerListener>>();
  private klineSubs  = new Map<string, Set<KlineListener>>();
  private statusSubs = new Set<StatusListener>();

  // 当前已订阅流（用于重连时复用）
  private activeStreams = new Set<string>();

  // =====================================================================
  // 订阅 / 取消
  // =====================================================================

  subscribeTicker(symbol: string, cb: TickerListener): () => void {
    const stream = `${toBinanceSymbol(symbol)}@ticker`;
    let set = this.tickerSubs.get(stream);
    if (!set) {
      set = new Set();
      this.tickerSubs.set(stream, set);
    }
    set.add(cb);
    this.activeStreams.add(stream);
    this.ensureConnection();
    return () => {
      const s = this.tickerSubs.get(stream);
      if (!s) return;
      s.delete(cb);
      if (s.size === 0) {
        this.tickerSubs.delete(stream);
        this.activeStreams.delete(stream);
      }
    };
  }

  subscribeKline(symbol: string, interval: KlineInterval, cb: KlineListener): () => void {
    const stream = `${toBinanceSymbol(symbol)}@kline_${interval}`;
    let set = this.klineSubs.get(stream);
    if (!set) {
      set = new Set();
      this.klineSubs.set(stream, set);
    }
    set.add(cb);
    this.activeStreams.add(stream);
    this.ensureConnection();
    return () => {
      const s = this.klineSubs.get(stream);
      if (!s) return;
      s.delete(cb);
      if (s.size === 0) {
        this.klineSubs.delete(stream);
        this.activeStreams.delete(stream);
      }
    };
  }

  onStatus(cb: StatusListener): () => void {
    this.statusSubs.add(cb);
    cb(this.status);   // 立即推一次当前状态
    return () => {
      this.statusSubs.delete(cb);
    };
  }

  /** 当前状态快照（同步） */
  getStatus(): ConnStatus {
    return this.status;
  }

  // =====================================================================
  // 内部：连接管理
  // =====================================================================

  private setStatus(s: ConnStatus) {
    if (this.status === s) return;
    this.status = s;
    this.statusSubs.forEach((cb) => cb(s));
  }

  private ensureConnection() {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      this.resendSubscriptions();
      return;
    }
    if (this.activeStreams.size === 0) return;   // 没人订阅就不连
    this.connect();
  }

  private connect() {
    this.setStatus('connecting');
    try {
      this.ws = new WebSocket(BINANCE_WS_COMBINED);
    } catch (err) {
      console.error('[BinanceStream] WebSocket construct failed', err);
      this.scheduleReconnect();
      return;
    }

    this.ws.onopen = () => {
      this.setStatus('online');
      this.resendSubscriptions();
    };

    this.ws.onmessage = (ev) => {
      try {
        const msg = JSON.parse(ev.data) as BinanceWsCombinedMessage;
        this.dispatch(msg);
      } catch (err) {
        // 忽略非 JSON 帧
      }
    };

    this.ws.onerror = () => {
      // onerror 后通常跟着 onclose
    };

    this.ws.onclose = () => {
      this.setStatus('offline');
      this.ws = null;
      this.scheduleReconnect();
    };
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) return;
    if (this.activeStreams.size === 0) return;   // 没人订阅就不重连
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, 3000);
  }

  private resendSubscriptions() {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    if (this.activeStreams.size === 0) return;
    const payload = {
      method: 'SUBSCRIBE',
      params: Array.from(this.activeStreams),
      id: Date.now(),
    };
    this.ws.send(JSON.stringify(payload));
  }

  // =====================================================================
  // 内部：消息分发
  // =====================================================================

  private dispatch(msg: BinanceWsCombinedMessage) {
    const stream = msg.stream;
    if (!stream) return;
    const data = msg.data as any;

    if (stream.endsWith('@ticker')) {
      // 节流：每个流 1s 最多一次
      const now = Date.now();
      if (this.lastSend[stream] && now - this.lastSend[stream] < this.throttleMs) return;
      this.lastSend[stream] = now;

      const ticker = normalizeWsTicker(data);
      this.tickerSubs.get(stream)?.forEach((cb) => cb(ticker));
    } else if (stream.includes('@kline_')) {
      // K 线不做节流，UI 内自己决定
      const interval = stream.split('@kline_')[1] as KlineInterval;
      const kline = normalizeKline(data.k, data.s, interval);
      this.klineSubs.get(stream)?.forEach((cb) => cb(kline));
    }
  }
}

// 全局单例
let _singleton: BinanceStreamSingleton | null = null;
function getStream(): BinanceStreamSingleton {
  if (typeof window === 'undefined') {
    // SSR 阶段：返回空操作代理对象（避免服务端崩）
    return new BinanceStreamSingleton();
  }
  if (!_singleton) _singleton = new BinanceStreamSingleton();
  return _singleton;
}

// =============================================================================
// React Hooks
// =============================================================================

/**
 * 订阅单个交易对的实时 ticker
 * @returns ticker / status
 *
 * 用法：
 *   const { ticker, status } = useTicker('BTC/USDT');
 *   if (status !== 'online') return <Skeleton />;
 *   return <span>{ticker.lastPrice}</span>;
 */
export function useTicker(symbol: string | null | undefined) {
  const [ticker, setTicker] = useState<Ticker | null>(null);
  const [status, setStatus] = useState<ConnStatus>('offline');

  useEffect(() => {
    if (!symbol) return;
    const stream = getStream();
    const offStatus = stream.onStatus(setStatus);
    const offTicker = stream.subscribeTicker(symbol, (t) => {
      setTicker(t);
    });
    return () => {
      offStatus();
      offTicker();
    };
  }, [symbol]);

  return { ticker, status };
}

/**
 * 订阅多个交易对的实时 ticker（首页 / Markets 列表用）
 * @returns Map<symbol, Ticker> / status
 */
export function useTickers(symbols: readonly string[]) {
  const [map, setMap] = useState<Map<string, Ticker>>(new Map());
  const [status, setStatus] = useState<ConnStatus>('offline');

  useEffect(() => {
    if (symbols.length === 0) return;
    const stream = getStream();
    const offStatus = stream.onStatus(setStatus);
    const offs = symbols.map((s) =>
      stream.subscribeTicker(s, (t) => {
        setMap((prev) => {
          const next = new Map(prev);
          next.set(s, t);
          return next;
        });
      }),
    );
    return () => {
      offStatus();
      offs.forEach((f) => f());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symbols.join(',')]);

  return { tickers: map, status };
}

/**
 * 订阅单个交易对的实时 K 线
 * @returns kline / status
 *
 * 注意：这是单根 K 线推送，UI 需要自行维护 K 线数组（合并到历史数据里）
 */
export function useKlineStream(symbol: string | null | undefined, interval: KlineInterval | null | undefined) {
  const [lastKline, setLastKline] = useState<Kline | null>(null);
  const [status, setStatus] = useState<ConnStatus>('offline');

  useEffect(() => {
    if (!symbol || !interval) return;
    const stream = getStream();
    const offStatus = stream.onStatus(setStatus);
    const offKline = stream.subscribeKline(symbol, interval, (k) => {
      setLastKline(k);
    });
    return () => {
      offStatus();
      offKline();
    };
  }, [symbol, interval]);

  return { lastKline, status };
}

// =============================================================================
// REST 客户端（用于拉历史 K 线 / 批量 ticker 初始化）
// =============================================================================

/** 全局 REST 客户端（懒构造） */
let _rest: BinanceRestClient | null = null;
function getRest(): BinanceRestClient {
  if (!_rest) _rest = new BinanceRestClient();
  return _rest;
}

/**
 * 拉历史 K 线
 * @param symbol  H5 格式 "BTC/USDT"
 * @param interval Binance interval "15m" / "1h" / "1d" 等
 * @param limit   根数（最大 1000）
 */
export async function fetchKlines(
  symbol: string,
  interval: KlineInterval,
  limit = 90,
): Promise<Kline[]> {
  const rest = getRest();
  const raws = await rest.getKlines(toBinanceStream(symbol, false), interval, { limit });
  return raws.map((r) => normalizeKline(r, symbol, interval));
}

/**
 * 批量拉 24h ticker（用于页面初始化填充，避免 WS 推送到达前的空白）
 * @param symbols H5 格式交易对列表
 */
export async function fetchTickers(symbols: readonly string[]): Promise<Ticker[]> {
  if (symbols.length === 0) return [];
  const rest = getRest();
  const binanceSymbols = symbols.map((s) => toBinanceStream(s, false));
  const raws = await rest.get24hTickers(binanceSymbols);
  return raws.map((r) => normalizeWsTicker(r as any));
}
