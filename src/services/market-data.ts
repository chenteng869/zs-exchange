/**
 * 行情数据统一接入 (REAL)
 *
 * 数据源:
 *  - 实时行情:  Binance 公共 WS (无需 API Key)
 *  - REST:      Binance / OKX / Bybit
 *  - 全市场:    CoinGecko
 *  - 链上:      DefiLlama
 *
 * 失败自动降级:  任意数据源失败时,自动回退到内置 mock,保证演示不中断
 */

import { logger } from '@/lib/logger';
import {
  BINANCE_REST_BASE,
  BINANCE_WS_BASE,
} from '@/lib/market/binance-client';

// ----------------------------------------------------------------------------
// 类型
// ----------------------------------------------------------------------------

export interface RealTicker {
  symbol: string;        // BTCUSDT
  base: string;          // BTC
  quote: string;         // USDT
  last: number;
  bid: number;
  ask: number;
  high24h: number;
  low24h: number;
  vol24h: number;
  quoteVol24h: number;
  change24h: number;     // %
  changeAbs24h: number;
  ts: number;
  source: 'binance' | 'okx' | 'bybit' | 'coingecko' | 'mock';
}

export interface RealOHLC {
  ts: number;
  o: number; h: number; l: number; c: number; v: number;
}

// ----------------------------------------------------------------------------
// Binance REST
// ----------------------------------------------------------------------------

async function fetchBinanceTickers(symbols?: string[]): Promise<RealTicker[]> {
  const r = await fetch(`${BINANCE_REST_BASE}/api/v3/ticker/24hr`, {
    signal: AbortSignal.timeout(8000),
  });
  if (!r.ok) throw new Error(`Binance ${r.status}`);
  const data: any[] = await r.json();
  const map: Record<string, string> = {
    BTCUSDT: 'BTC', ETHUSDT: 'ETH', BNBUSDT: 'BNB', SOLUSDT: 'SOL',
    XRPUSDT: 'XRP', ADAUSDT: 'ADA', DOGEUSDT: 'DOGE', AVAXUSDT: 'AVAX',
    MATICUSDT: 'MATIC', DOTUSDT: 'DOT', LINKUSDT: 'LINK', TONUSDT: 'TON',
  };
  const symSet = symbols && symbols.length ? new Set(symbols) : null;
  return data
    .filter((t) => t.symbol.endsWith('USDT') && (!symSet || symSet.has(t.symbol)))
    .slice(0, 100)
    .map((t) => {
      const base = t.symbol.replace(/USDT$/, '');
      return {
        symbol: t.symbol,
        base: map[t.symbol] || base,
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
        source: 'binance' as const,
      };
    });
}

async function fetchBinanceOHLC(symbol: string, interval = '1h', limit = 200): Promise<RealOHLC[]> {
  const r = await fetch(
    `${BINANCE_REST_BASE}/api/v3/klines?symbol=${symbol.toUpperCase()}&interval=${interval}&limit=${limit}`,
    { signal: AbortSignal.timeout(8000) }
  );
  if (!r.ok) throw new Error(`Binance K ${r.status}`);
  const data: any[] = await r.json();
  return data.map((k) => ({
    ts: k[0], o: +k[1], h: +k[2], l: +k[3], c: +k[4], v: +k[5],
  }));
}

// ----------------------------------------------------------------------------
// CoinGecko
// ----------------------------------------------------------------------------

const COINGECKO_BASE = 'https://api.coingecko.com/api/v3';

async function fetchCoinGeckoGlobal(): Promise<{
  totalMarketCap: number; totalVolume24h: number; btcDominance: number; marketCapChange24h: number;
}> {
  const r = await fetch(`${COINGECKO_BASE}/global`, { signal: AbortSignal.timeout(8000) });
  if (!r.ok) throw new Error(`CG ${r.status}`);
  const j: any = await r.json();
  return {
    totalMarketCap: j.data.total_market_cap.usd,
    totalVolume24h: j.data.total_volume.usd,
    btcDominance: j.data.market_cap_percentage.btc,
    marketCapChange24h: j.data.market_cap_change_percentage_24h_usd,
  };
}

// ----------------------------------------------------------------------------
// DefiLlama (链上 TVL)
// ----------------------------------------------------------------------------

const DEFILLAMA_BASE = 'https://api.llama.fi';

export interface ChainTVL {
  chain: string;
  tvl: number;
  change24h: number;
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
      }));
  } catch (e) {
    logger.warn('[market] DefiLlama fail, fallback mock', e);
    return mockChainTVL();
  }
}

// ----------------------------------------------------------------------------
// 导出 — 带降级
// ----------------------------------------------------------------------------

export async function getTickers(symbols?: string[]): Promise<RealTicker[]> {
  try {
    return await fetchBinanceTickers(symbols);
  } catch (e) {
    logger.warn('[market] Binance fail, fallback mock', e);
    return mockTickers(symbols);
  }
}

export async function getOHLC(symbol: string, interval = '1h', limit = 200): Promise<RealOHLC[]> {
  try {
    return await fetchBinanceOHLC(symbol, interval, limit);
  } catch (e) {
    logger.warn('[market] Binance K fail, fallback mock', e);
    return mockOHLC(limit);
  }
}

export async function getGlobal(): Promise<{
  totalMarketCap: number; totalVolume24h: number; btcDominance: number; marketCapChange24h: number;
}> {
  try {
    return await fetchCoinGeckoGlobal();
  } catch (e) {
    logger.warn('[market] CG fail, fallback mock', e);
    return {
      totalMarketCap: 2_540_000_000_000,
      totalVolume24h: 89_500_000_000,
      btcDominance: 52.3,
      marketCapChange24h: 1.2,
    };
  }
}

// ----------------------------------------------------------------------------
// Mock 降级
// ----------------------------------------------------------------------------

const MOCK_BASE_PRICES: Record<string, number> = {
  BTC: 67890, ETH: 3450, BNB: 580, SOL: 142, XRP: 0.62, ADA: 0.45,
  DOGE: 0.13, AVAX: 32, MATIC: 0.72, DOT: 7.2, LINK: 14.5, TON: 6.8,
};

function mockTickers(symbols?: string[]): RealTicker[] {
  const list = symbols && symbols.length ? symbols : Object.keys(MOCK_BASE_PRICES);
  return list.map((sym) => {
    const base = sym.replace(/USDT$/, '');
    const last = MOCK_BASE_PRICES[base] || 1 + Math.random() * 100;
    const change = (Math.random() - 0.5) * 8;
    return {
      symbol: `${base}USDT`,
      base,
      quote: 'USDT',
      last: +(last * (1 + change / 100)).toFixed(4),
      bid: +((last * 0.9995)).toFixed(4),
      ask: +((last * 1.0005)).toFixed(4),
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

function mockOHLC(n: number): RealOHLC[] {
  const out: RealOHLC[] = [];
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

function mockChainTVL(): ChainTVL[] {
  return [
    { chain: 'Ethereum', tvl: 78_500_000_000, change24h: 1.8 },
    { chain: 'BSC', tvl: 8_900_000_000, change24h: -0.5 },
    { chain: 'Arbitrum', tvl: 5_300_000_000, change24h: 2.3 },
    { chain: 'Base', tvl: 4_200_000_000, change24h: 3.1 },
    { chain: 'Solana', tvl: 4_800_000_000, change24h: 1.5 },
    { chain: 'Polygon', tvl: 1_900_000_000, change24h: -0.8 },
    { chain: 'Optimism', tvl: 1_400_000_000, change24h: 0.9 },
    { chain: 'Avalanche', tvl: 1_200_000_000, change24h: -1.2 },
  ];
}

// ----------------------------------------------------------------------------
// WebSocket 实时 ticker
// ----------------------------------------------------------------------------

export type TickerCallback = (t: RealTicker) => void;

export class RealMarketStream {
  private ws: WebSocket | null = null;
  private subs: Set<string> = new Set();
  private callbacks: Set<TickerCallback> = new Set();
  private reconnectTimer: any = null;
  private pingTimer: any = null;

  constructor(symbols: string[] = []) {
    symbols.forEach((s) => this.subs.add(s.toLowerCase()));
  }

  on(cb: TickerCallback) { this.callbacks.add(cb); return () => this.callbacks.delete(cb); }

  connect() {
    if (this.ws) return;
    const streams = Array.from(this.subs);
    if (streams.length === 0) {
      // 默认订阅主流
      ['btcusdt', 'ethusdt', 'bnbusdt', 'solusdt'].forEach((s) => this.subs.add(s));
    }
    const url = `${BINANCE_WS_BASE}/${Array.from(this.subs).join('@ticker/')}@ticker`;
    try {
      this.ws = new WebSocket(url);
    } catch (e) {
      logger.warn('[market] WS create fail', e);
      this.scheduleReconnect();
      return;
    }
    this.ws.onmessage = (ev) => {
      try {
        const arr = JSON.parse(ev.data);
        const d = Array.isArray(arr) ? arr[0]?.data : arr;
        if (!d) return;
        const t: RealTicker = {
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
      } catch { /* ignore */ }
    };
    this.ws.onclose = () => this.scheduleReconnect();
    this.ws.onerror = () => { /* will trigger onclose */ };
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

export default {
  getTickers, getOHLC, getGlobal, fetchChainTVL, RealMarketStream,
};
