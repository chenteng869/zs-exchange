/**
 * 行情 API — 调用 /api/v1/perp/market
 * 官网 + H5 共用
 */

import { apiGet, apiPost } from './client';

export interface MarketTicker {
  symbol: string;
  lastPrice: string;
  open24h: string;
  high24h: string;
  low24h: string;
  change24h: string;
  changePercent24h: string;
  volume24h: string;
  quoteVolume24h: string;
  bestBid: string;
  bestAsk: string;
  fundingRate: string;
  nextFundingTime: number;
  openInterest: string;
  maxLeverage: number;
  updatedAt: number;
}

export interface OrderBook {
  symbol: string;
  timestamp: number;
  bids: [string, string][];
  asks: [string, string][];
}

export interface Kline {
  openTime: number;
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string;
  quoteVolume: string;
  tradeCount: number;
}

export interface RecentTrade {
  id: string;
  symbol: string;
  price: string;
  quantity: string;
  side: string;
  timestamp: number;
}

export interface FundingRate {
  symbol: string;
  fundingRate: string;
  predictedRate: string;
  nextFundingTime: number;
  fundingIntervalHours: number;
  premiumIndex: string;
  interestRate: string;
}

const BASE = '/api/v1/perp/market';

export const marketApi = {
  getTicker: (symbol = 'BTCUSDT') =>
    apiGet<MarketTicker>(`${BASE}?action=ticker&symbol=${symbol}`),

  getOrderBook: (symbol = 'BTCUSDT', limit = 20) =>
    apiGet<OrderBook>(`${BASE}?action=orderbook&symbol=${symbol}&limit=${limit}`),

  getKlines: (symbol = 'BTCUSDT', interval = '1h', limit = 100) =>
    apiGet<number[][]>(`${BASE}?action=klines&symbol=${symbol}&interval=${interval}&limit=${limit}`),

  getRecentTrades: (symbol = 'BTCUSDT', limit = 50) =>
    apiGet<RecentTrade[]>(`${BASE}?action=trades&symbol=${symbol}&limit=${limit}`),

  getFundingRate: (symbol = 'BTCUSDT') =>
    apiGet<FundingRate>(`${BASE}?action=funding-rate&symbol=${symbol}`),

  getContracts: () =>
    apiGet<any[]>(`${BASE}?action=contracts`),
};

/** 格式化价格涨跌 */
export function fmtChange(pct: string | number): { text: string; up: boolean } {
  const n = parseFloat(String(pct));
  const up = n >= 0;
  return { text: `${up ? '+' : ''}${n.toFixed(2)}%`, up };
}

/** 格式化大数字 */
export function fmtVolume(v: string | number): string {
  const n = parseFloat(String(v));
  if (n >= 1e9) return `${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(2)}K`;
  return n.toFixed(2);
}

/** 格式化价格（去掉多余小数） */
export function fmtPrice(p: string | number): string {
  const n = parseFloat(String(p));
  if (n >= 1000) return n.toLocaleString('en-US', { maximumFractionDigits: 2 });
  if (n >= 1) return n.toFixed(4);
  return n.toFixed(6);
}
