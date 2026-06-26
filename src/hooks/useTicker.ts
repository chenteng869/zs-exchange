'use client';

import { useMemo, useState, useEffect } from 'react';
import { useMockWebSocket } from './useMockWebSocket';

// ==================== 类型定义 ====================
export interface TickerData {
  symbol: string;
  baseAsset: string;
  quoteAsset: string;
  price: number;
  change24h: number;
  changePercent24h: number;
  high24h: number;
  low24h: number;
  volume24h: number;
  lastUpdate: Date;
}

export interface UseTickerOptions {
  symbols?: string[];
  interval?: number;
}

export interface UseTickerReturn {
  tickers: TickerData[];
  getBySymbol: (symbol: string) => TickerData | undefined;
  isLoading: boolean;
  error: string | null;
  isConnected: boolean;
}

// ==================== 基础数据映射 ====================
const SYMBOL_META: Record<string, { baseAsset: string; quoteAsset: string }> = {
  BTCUSDT: { baseAsset: 'BTC', quoteAsset: 'USDT' },
  ETHUSDT: { baseAsset: 'ETH', quoteAsset: 'USDT' },
  BNBUSDT: { baseAsset: 'BNB', quoteAsset: 'USDT' },
  SOLUSDT: { baseAsset: 'SOL', quoteAsset: 'USDT' },
  XRPUSDT: { baseAsset: 'XRP', quoteAsset: 'USDT' },
  ADAUSDT: { baseAsset: 'ADA', quoteAsset: 'USDT' },
  DOGEUSDT: { baseAsset: 'DOGE', quoteAsset: 'USDT' },
  DOTUSDT: { baseAsset: 'DOT', quoteAsset: 'USDT' },
  AVAXUSDT: { baseAsset: 'AVAX', quoteAsset: 'USDT' },
  LINKUSDT: { baseAsset: 'LINK', quoteAsset: 'USDT' },
  POLUSDT: { baseAsset: 'POL', quoteAsset: 'USDT' },
  UNIUSDT: { baseAsset: 'UNI', quoteAsset: 'USDT' },
  ATOMUSDT: { baseAsset: 'ATOM', quoteAsset: 'USDT' },
  LTCUSDT: { baseAsset: 'LTC', quoteAsset: 'USDT' },
  SHIBUSDT: { baseAsset: 'SHIB', quoteAsset: 'USDT' },
  APTUSDT: { baseAsset: 'APT', quoteAsset: 'USDT' },
  ARBUSDT: { baseAsset: 'ARB', quoteAsset: 'USDT' },
  OPUSDT: { baseAsset: 'OP', quoteAsset: 'USDT' },
  FILUSDT: { baseAsset: 'FIL', quoteAsset: 'USDT' },
  NEARUSDT: { baseAsset: 'NEAR', quoteAsset: 'USDT' },
};

const DEFAULT_SYMBOLS = [
  'BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'SOLUSDT', 'XRPUSDT',
  'ADAUSDT', 'DOGEUSDT', 'DOTUSDT', 'AVAXUSDT', 'LINKUSDT',
  'POLUSDT', 'UNIUSDT', 'ATOMUSDT', 'LTCUSDT', 'SHIBUSDT',
  'APTUSDT', 'ARBUSDT', 'OPUSDT', 'FILUSDT', 'NEARUSDT',
];

// ==================== 核心 Hook ====================
export function useTicker(opts: UseTickerOptions = {}): UseTickerReturn {
  const { symbols = DEFAULT_SYMBOLS, interval = 1000 } = opts;
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const { latestPrices, messages, isConnected } = useMockWebSocket({
    symbols,
    interval,
    autoConnect: true,
  });

  // 从最新消息中提取涨跌幅数据
  const changeMap = useMemo(() => {
    const map: Record<string, number> = {};
    for (let i = messages.length - 1; i >= 0; i--) {
      const msg = messages[i];
      if (msg.type === 'ticker' && !(msg.symbol in map)) {
        map[msg.symbol] = msg.data?.change24h ?? 0;
      }
      if (Object.keys(map).length >= symbols.length) break;
    }
    return map;
  }, [messages, symbols]);

  // 组装 TickerData 数组
  const tickers: TickerData[] = useMemo(() => {
    return symbols.map((symbol) => {
      const price = latestPrices[symbol] ?? 0;
      const meta = SYMBOL_META[symbol] ?? { baseAsset: symbol.replace(/USDT|USD/, ''), quoteAsset: 'USDT' };
      const changePercent = changeMap[symbol] ?? (isMounted ? Math.random() * 10 - 4 : 0);

      return {
        symbol,
        baseAsset: meta.baseAsset,
        quoteAsset: meta.quoteAsset,
        price,
        change24h: price * (changePercent / 100),
        changePercent24h: changePercent,
        high24h: isMounted ? price * (1 + Math.abs(changePercent) / 100 + Math.random() * 0.02) : price,
        low24h: isMounted ? price * (1 - Math.abs(changePercent) / 100 - Math.random() * 0.02) : price,
        volume24h: isMounted ? Math.random() * 1000000000 : 0,
        lastUpdate: new Date(),
      };
    });
  }, [latestPrices, changeMap, symbols, isMounted]);

  // 查找函数 — 不使用 useCallback，直接用 useMemo 包裹保证稳定引用
  const getBySymbol = useMemo(() => {
    return (symbol: string): TickerData | undefined =>
      tickers.find((t) => t.symbol === symbol);
  }, [tickers]);

  return {
    tickers,
    getBySymbol,
    isLoading: !isConnected,
    error: null,
    isConnected,
  };
}

export default useTicker;
