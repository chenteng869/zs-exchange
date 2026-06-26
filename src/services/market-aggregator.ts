/**
 * 行情聚合服务 (多源 + 降级)
 *
 * 数据源优先级:
 *   1. Binance  (主)
 *   2. OKX      (备)
 *   3. Bybit    (备)
 *   4. CoinGecko (聚合所有币种)
 *   5. CryptoCompare (历史/转换)
 *   6. Mock     (兜底)
 *
 * 策略:
 *   - 实时报价: 优先 Binance,失败时切 OKX/Bybit
 *   - 全市场列表:  CoinGecko
 *   - 历史K线:    Binance -> CryptoCompare
 *   - 汇率换算:  CryptoCompare
 *   - 链上 TVL:  DefiLlama
 */

import { logger } from '@/lib/logger';
import {
  BINANCE_REST_BASE,
  BINANCE_WS_BASE,
} from '@/lib/market/binance-client';

const COINGECKO_BASE = 'https://api.coingecko.com/api/v3';
const CRYPTOCOMPARE_BASE = 'https://min-api.cryptocompare.com/data';
const DEFILLAMA_BASE = 'https://api.llama.fi';
const OKX_REST_BASE = 'https://www.okx.com/api/v5';
const BYBIT_REST_BASE = 'https://api.bybit.com/v5';

// ============================================================================
// 类型
// ============================================================================

export interface AggregatedTicker {
  symbol: string;
  base: string;
  quote: string;
  last: number;
  bid: number;
  ask: number;
  high24h: number;
  low24h: number;
  vol24h: number;
  quoteVol24h: number;
  change24h: number;
  changeAbs24h: number;
  ts: number;
  source: 'binance' | 'okx' | 'bybit' | 'coingecko' | 'cryptocompare' | 'mock';
  /** 当多源对比时,sources[].price */
  sources?: Array<{ name: string; price: number; ts: number }>;
}

export interface AggregatedOHLC {
  ts: number;
  o: number; h: number; l: number; c: number; v: number;
}

export interface GlobalMarketData {
  totalMarketCap: number;
  totalVolume24h: number;
  btcDominance: number;
  ethDominance: number;
  marketCapChange24h: number;
  activeCryptocurrencies: number;
  ts: number;
}

export interface FearGreedIndex {
  value: number;        // 0-100
  classification: 'extreme_fear' | 'fear' | 'neutral' | 'greed' | 'extreme_greed';
  ts: number;
}

// ============================================================================
// Binance REST
// ============================================================================

async function fetchBinance(symbols?: string[]): Promise<AggregatedTicker[]> {
  const r = await fetch(`${BINANCE_REST_BASE}/api/v3/ticker/24hr`, {
    signal: AbortSignal.timeout(8000),
  });
  if (!r.ok) throw new Error(`Binance ${r.status}`);
  const data: any[] = await r.json();
  const symSet = symbols && symbols.length ? new Set(symbols) : null;
  return data
    .filter((t) => t.symbol.endsWith('USDT') && (!symSet || symSet.has(t.symbol)))
    .slice(0, 100)
    .map((t) => toTicker(t, 'binance'));
}

async function fetchBinanceKlines(symbol: string, interval = '1h', limit = 200): Promise<AggregatedOHLC[]> {
  const r = await fetch(
    `${BINANCE_REST_BASE}/api/v3/klines?symbol=${symbol.toUpperCase()}&interval=${interval}&limit=${limit}`,
    { signal: AbortSignal.timeout(8000) }
  );
  if (!r.ok) throw new Error(`Binance K ${r.status}`);
  const data: any[] = await r.json();
  return data.map((k) => ({ ts: k[0], o: +k[1], h: +k[2], l: +k[3], c: +k[4], v: +k[5] }));
}

// ============================================================================
// OKX
// ============================================================================

async function fetchOKX(symbols?: string[]): Promise<AggregatedTicker[]> {
  const r = await fetch(`${OKX_REST_BASE}/market/tickers?instType=SPOT`, {
    signal: AbortSignal.timeout(8000),
  });
  if (!r.ok) throw new Error(`OKX ${r.status}`);
  const j: any = await r.json();
  if (j.code !== '0') throw new Error(`OKX code ${j.code}`);
  const data: any[] = j.data;
  const symSet = symbols && symbols.length ? new Set(symbols) : null;
  return data
    .filter((t) => t.instId.endsWith('-USDT') && (!symSet || symSet.has(t.instId.replace('-', ''))))
    .slice(0, 100)
    .map((t) => {
      const sym = t.instId.replace('-', '');
      return {
        symbol: sym,
        base: t.baseCcy,
        quote: t.quoteCcy,
        last: +t.last,
        bid: +t.bidPx,
        ask: +t.askPx,
        high24h: +t.high24h,
        low24h: +t.low24h,
        vol24h: +t.vol24h,
        quoteVol24h: +t.volCcy24h,
        change24h: +t.chg24h * 100,  // OKX 返回小数
        changeAbs24h: +t.last - +t.open24h,
        ts: +t.ts,
        source: 'okx' as const,
      };
    });
}

// ============================================================================
// Bybit
// ============================================================================

async function fetchBybit(symbols?: string[]): Promise<AggregatedTicker[]> {
  const r = await fetch(`${BYBIT_REST_BASE}/market/tickers?category=spot`, {
    signal: AbortSignal.timeout(8000),
  });
  if (!r.ok) throw new Error(`Bybit ${r.status}`);
  const j: any = await r.json();
  if (j.retCode !== 0) throw new Error(`Bybit retCode ${j.retCode}`);
  const data: any[] = j.result.list;
  const symSet = symbols && symbols.length ? new Set(symbols) : null;
  return data
    .filter((t: any) => t.symbol.endsWith('USDT') && (!symSet || symSet.has(t.symbol)))
    .slice(0, 100)
    .map((t: any) => ({
      symbol: t.symbol,
      base: t.baseCoin || t.symbol.replace('USDT', ''),
      quote: 'USDT',
      last: +t.lastPrice,
      bid: +t.bid1Price,
      ask: +t.ask1Price,
      high24h: +t.highPrice24h,
      low24h: +t.lowPrice24h,
      vol24h: +t.volume24h,
      quoteVol24h: +t.turnover24h,
      change24h: +t.price24hPcnt * 100,
      changeAbs24h: 0,
      ts: +t.time,
      source: 'bybit' as const,
    }));
}

// ============================================================================
// CoinGecko
// ============================================================================

async function fetchCoinGeckoTickers(symbols?: string[]): Promise<AggregatedTicker[]> {
  const ids = 'bitcoin,ethereum,binancecoin,solana,ripple,cardano,dogecoin,avalanche-2,matic-network,polkadot,chainlink,toncoin';
  const r = await fetch(`${COINGECKO_BASE}/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true&include_last_updated_time=true`, {
    signal: AbortSignal.timeout(8000),
  });
  if (!r.ok) throw new Error(`CG ${r.status}`);
  const data: any = await r.json();
  return Object.entries(data).map(([id, d]: [string, any]) => {
    const base = id.toUpperCase().slice(0, 4);
    return {
      symbol: `${base}USDT`,
      base,
      quote: 'USDT',
      last: d.usd,
      bid: d.usd * 0.9995,
      ask: d.usd * 1.0005,
      high24h: d.usd * 1.04,
      low24h: d.usd * 0.96,
      vol24h: 0,
      quoteVol24h: 0,
      change24h: d.usd_24h_change || 0,
      changeAbs24h: 0,
      ts: d.last_updated_at * 1000,
      source: 'coingecko' as const,
    };
  });
}

async function fetchCoinGeckoGlobal(): Promise<GlobalMarketData> {
  const r = await fetch(`${COINGECKO_BASE}/global`, { signal: AbortSignal.timeout(8000) });
  if (!r.ok) throw new Error(`CG ${r.status}`);
  const j: any = await r.json();
  const d = j.data;
  return {
    totalMarketCap: d.total_market_cap.usd,
    totalVolume24h: d.total_volume.usd,
    btcDominance: d.market_cap_percentage.btc,
    ethDominance: d.market_cap_percentage.eth,
    marketCapChange24h: d.market_cap_change_percentage_24h_usd,
    activeCryptocurrencies: d.active_cryptocurrencies,
    ts: d.updated_at * 1000,
  };
}

// ============================================================================
// CryptoCompare
// ============================================================================

async function fetchCryptoCompareKlines(symbol: string, interval = 'hour', limit = 200): Promise<AggregatedOHLC[]> {
  const r = await fetch(
    `${CRYPTOCOMPARE_BASE}/v2/histo${interval}?fsym=${symbol.toUpperCase()}&tsym=USD&limit=${limit}`,
    { signal: AbortSignal.timeout(8000) }
  );
  if (!r.ok) throw new Error(`CC ${r.status}`);
  const j: any = await r.json();
  if (j.Response === 'Error') throw new Error(j.Message);
  return j.Data.Data.map((k: any) => ({
    ts: k.time * 1000,
    o: k.open, h: k.high, l: k.low, c: k.close, v: k.volumefrom,
  }));
}

async function fetchFearGreed(): Promise<FearGreedIndex> {
  const r = await fetch('https://api.alternative.me/fng/?limit=1', { signal: AbortSignal.timeout(8000) });
  if (!r.ok) throw new Error(`FNG ${r.status}`);
  const j: any = await r.json();
  const d = j.data[0];
  const v = +d.value;
  let classification: FearGreedIndex['classification'] = 'neutral';
  if (v < 25) classification = 'extreme_fear';
  else if (v < 45) classification = 'fear';
  else if (v < 55) classification = 'neutral';
  else if (v < 75) classification = 'greed';
  else classification = 'extreme_greed';
  return { value: v, classification, ts: +d.timestamp * 1000 };
}

// ============================================================================
// DefiLlama
// ============================================================================

export interface ChainTVL {
  chain: string;
  tvl: number;
  change24h: number;
  protocols: number;
}

export async function fetchChainTVL(): Promise<ChainTVL[]> {
  try {
    const r = await fetch(`${DEFILLAMA_BASE}/v2/chains`, { signal: AbortSignal.timeout(8000) });
    if (!r.ok) throw new Error(`DL ${r.status}`);
    const data: any[] = await r.json();
    return data
      .filter((c) => c.tvl > 0)
      .slice(0, 30)
      .map((c) => ({
        chain: c.name,
        tvl: c.tvl,
        change24h: c.change_1d || 0,
        protocols: c.protocols || 0,
      }));
  } catch (e) {
    logger.warn('[market] DefiLlama fail', e);
    return [];
  }
}

// ============================================================================
// 统一出口 (带降级)
// ============================================================================

function toTicker(t: any, source: 'binance' | 'okx' | 'bybit'): AggregatedTicker {
  return {
    symbol: t.symbol,
    base: t.symbol.replace(/USDT$/, ''),
    quote: 'USDT',
    last: +t.lastPrice,
    bid: +t.bidPrice,
    ask: +t.askPrice,
    high24h: +t.highPrice,
    low24h: +t.lowPrice,
    vol24h: +t.volume,
    quoteVol24h: +t.quoteVolume,
    change24h: +t.priceChangePercent,
    changeAbs24h: +t.priceChange,
    ts: t.closeTime || Date.now(),
    source,
  };
}

export const marketAggregator = {
  /**
   * 获取报价 — 自动在 Binance / OKX / Bybit 之间切换
   */
  async getTickers(symbols?: string[]): Promise<AggregatedTicker[]> {
    const sources = [
      { name: 'binance', fn: fetchBinance },
      { name: 'okx', fn: fetchOKX },
      { name: 'bybit', fn: fetchBybit },
      { name: 'coingecko', fn: fetchCoinGeckoTickers },
    ];
    for (const s of sources) {
      try {
        logger.info(`[market] trying ${s.name}`);
        const t = await s.fn(symbols);
        if (t.length) return t;
      } catch (e) {
        logger.warn(`[market] ${s.name} fail, fallback next`);
      }
    }
    return mockTickers(symbols);
  },

  /**
   * 多源对比:同时拉 Binance + OKX,展示价差
   */
  async compare(symbol: string): Promise<{ symbol: string; sources: Array<{ name: string; price: number; ts: number }> }> {
    const sources: Array<{ name: string; price: number; ts: number }> = [];
    await Promise.allSettled([
      fetchBinance([symbol]).then((d) => d[0] && sources.push({ name: 'binance', price: d[0].last, ts: d[0].ts })),
      fetchOKX([symbol]).then((d) => d[0] && sources.push({ name: 'okx', price: d[0].last, ts: d[0].ts })),
      fetchBybit([symbol]).then((d) => d[0] && sources.push({ name: 'bybit', price: d[0].last, ts: d[0].ts })),
    ]);
    return { symbol, sources };
  },

  /**
   * K线:优先 Binance,失败时用 CryptoCompare
   */
  async getKlines(symbol: string, interval = '1h', limit = 200): Promise<AggregatedOHLC[]> {
    try {
      return await fetchBinanceKlines(symbol, interval, limit);
    } catch (e) {
      logger.warn('[market] Binance K fail, try CC', e);
      try {
        return await fetchCryptoCompareKlines(symbol.replace('USDT', ''), 'hour', limit);
      } catch (e2) {
        logger.warn('[market] CC K fail, fallback mock', e2);
        return mockOHLC(limit);
      }
    }
  },

  /**
   * 全市场数据
   */
  async getGlobal(): Promise<GlobalMarketData | null> {
    try {
      return await fetchCoinGeckoGlobal();
    } catch (e) {
      logger.warn('[market] CG global fail', e);
      return null;
    }
  },

  /**
   * 恐惧贪婪指数
   */
  async getFearGreed(): Promise<FearGreedIndex | null> {
    try {
      return await fetchFearGreed();
    } catch (e) {
      logger.warn('[market] FNG fail', e);
      return null;
    }
  },

  /**
   * 链上 TVL
   */
  fetchChainTVL,

  /**
   * WS 实时 ticker
   */
  createStream(symbols: string[]) {
    return new AggregatedStream(symbols);
  },
};

// ============================================================================
// WebSocket Stream
// ============================================================================

export class AggregatedStream {
  private ws: WebSocket | null = null;
  private subs: Set<string> = new Set();
  private callbacks: Set<(t: AggregatedTicker) => void> = new Set();
  private reconnectTimer: any = null;
  private pingTimer: any = null;

  constructor(symbols: string[] = []) {
    symbols.forEach((s) => this.subs.add(s.toLowerCase()));
  }

  on(cb: (t: AggregatedTicker) => void) {
    this.callbacks.add(cb);
    return () => this.callbacks.delete(cb);
  }

  connect() {
    if (this.ws) return;
    if (this.subs.size === 0) {
      ['btcusdt', 'ethusdt', 'bnbusdt', 'solusdt'].forEach((s) => this.subs.add(s));
    }
    const url = `${BINANCE_WS_BASE}/${Array.from(this.subs).join('@ticker/')}@ticker`;
    try {
      this.ws = new WebSocket(url);
    } catch (e) {
      this.scheduleReconnect();
      return;
    }
    this.ws.onmessage = (ev) => {
      try {
        const arr = JSON.parse(ev.data);
        const d = Array.isArray(arr) ? arr[0]?.data : arr;
        if (!d) return;
        const t: AggregatedTicker = {
          symbol: d.s,
          base: d.s.replace(/USDT$/, ''),
          quote: 'USDT',
          last: +d.c, bid: +d.b, ask: +d.a,
          high24h: +d.h, low24h: +d.l,
          vol24h: +d.v, quoteVol24h: +d.q,
          change24h: +d.P, changeAbs24h: +d.p,
          ts: d.E,
          source: 'binance',
        };
        this.callbacks.forEach((cb) => cb(t));
      } catch {}
    };
    this.ws.onclose = () => this.scheduleReconnect();
    this.pingTimer = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) this.ws.send('ping');
    }, 30_000);
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) return;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, 5000);
  }

  close() {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    if (this.pingTimer) clearInterval(this.pingTimer);
    this.ws?.close();
    this.ws = null;
  }
}

// ============================================================================
// Mock 兜底
// ============================================================================

const MOCK_BASE: Record<string, number> = {
  BTC: 67890, ETH: 3450, BNB: 580, SOL: 142, XRP: 0.62, ADA: 0.45,
  DOGE: 0.13, AVAX: 32, MATIC: 0.72, DOT: 7.2, LINK: 14.5, TON: 6.8,
};

function mockTickers(symbols?: string[]): AggregatedTicker[] {
  const list = symbols && symbols.length ? symbols : Object.keys(MOCK_BASE);
  return list.map((sym) => {
    const base = sym.replace(/USDT$/, '');
    const last = MOCK_BASE[base] || 1 + Math.random() * 100;
    const change = (Math.random() - 0.5) * 8;
    return {
      symbol: `${base}USDT`,
      base, quote: 'USDT',
      last: +(last * (1 + change / 100)).toFixed(4),
      bid: +(last * 0.9995).toFixed(4),
      ask: +(last * 1.0005).toFixed(4),
      high24h: +(last * 1.04).toFixed(4),
      low24h: +(last * 0.96).toFixed(4),
      vol24h: Math.random() * 50000 + 1000,
      quoteVol24h: Math.random() * 2_000_000_000,
      change24h: +change.toFixed(2),
      changeAbs24h: +(last * change / 100).toFixed(4),
      ts: Date.now(),
      source: 'mock' as const,
    };
  });
}

function mockOHLC(n: number): AggregatedOHLC[] {
  const out: AggregatedOHLC[] = [];
  let p = 67000;
  for (let i = 0; i < n; i++) {
    const o = p;
    const c = p + (Math.random() - 0.5) * 200;
    const h = Math.max(o, c) + Math.random() * 100;
    const l = Math.min(o, c) - Math.random() * 100;
    out.push({ ts: Date.now() - (n - i) * 3600_000, o, h, l, c, v: Math.random() * 1000 });
    p = c;
  }
  return out;
}

export default marketAggregator;
