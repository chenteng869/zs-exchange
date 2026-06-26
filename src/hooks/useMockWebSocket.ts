'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

// ==================== 类型定义 ====================
export interface WSMessage {
  type: 'ticker' | 'trade' | 'orderbook' | 'kline';
  symbol: string;
  data: any;
  timestamp: number;
}

export interface UseMockWSOptions {
  symbols?: string[];
  interval?: number;
  autoConnect?: boolean;
}

export interface UseMockWSReturn {
  isConnected: boolean;
  messages: WSMessage[];
  latestPrices: Record<string, number>;
  subscribe: (symbols: string[]) => void;
  unsubscribe: (symbols: string[]) => void;
  disconnect: () => void;
  reconnect: () => void;
}

// ==================== 初始价格基准 (来自 mock-data) ====================
const BASE_PRICES: Record<string, number> = {
  BTCUSDT: 67234.56,
  ETHUSDT: 3456.78,
  BNBUSDT: 587.34,
  SOLUSDT: 172.45,
  XRPUSDT: 0.5234,
  ADAUSDT: 0.4567,
  DOGEUSDT: 0.1234,
  DOTUSDT: 7.89,
  AVAXUSDT: 35.67,
  LINKUSDT: 14.56,
  POLUSDT: 0.5678,
  UNIUSDT: 9.87,
  ATOMUSDT: 8.76,
  LTCUSDT: 84.56,
  SHIBUSDT: 0.00002345,
  APTUSDT: 9.23,
  ARBUSDT: 1.12,
  OPUSDT: 2.34,
  FILUSDT: 5.67,
  NEARUSDT: 6.78,
};

// ==================== 核心 Hook ====================
export function useMockWebSocket(options: UseMockWSOptions = {}): UseMockWSReturn {
  const {
    symbols = Object.keys(BASE_PRICES),
    interval = 1000,
    autoConnect = true,
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<WSMessage[]>([]);
  const [latestPrices, setLatestPrices] = useState<Record<string, number>>({});
  const [subscribedSymbols, setSubscribedSymbols] = useState<Set<string>>(new Set(symbols));

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptRef = useRef(0);
  const pricesRef = useRef<Record<string, number>>({});
  const isMountedRef = useRef(true);

  // 最大重连延迟 30s
  const MAX_RECONNECT_DELAY = 30000;

  // 生成随机价格波动 ±0.1% ~ ±2%
  const generatePriceFluctuation = useCallback((symbol: string): number => {
    const base = BASE_PRICES[symbol] ?? pricesRef.current[symbol] ?? 100;
    const fluctuationPercent = (Math.random() * 2.1 - 1.05) / 100; // -1.05% ~ +1.05%
    return base * (1 + fluctuationPercent);
  }, []);

  // 推送模拟消息
  const pushTick = useCallback(() => {
    if (!isMountedRef.current) return;

    const newPrices: Record<string, number> = { ...pricesRef.current };
    const newMessages: WSMessage[] = [];

    subscribedSymbols.forEach((symbol) => {
      const newPrice = generatePriceFluctuation(symbol);
      newPrices[symbol] = newPrice;

      const message: WSMessage = {
        type: 'ticker',
        symbol,
        data: {
          price: newPrice,
          change24h: (Math.random() * 12 - 5), // -5% ~ +7%
          volume24h: Math.random() * 1000000000,
        },
        timestamp: Date.now(),
      };
      newMessages.push(message);
    });

    pricesRef.current = newPrices;
    setLatestPrices(newPrices);
    setMessages((prev) => [...prev.slice(-200), ...newMessages]); // 保留最近200条
  }, [subscribedSymbols, generatePriceFluctuation]);

  // 连接 (模拟)
  const connect = useCallback(() => {
    if (intervalRef.current) return;

    // 模拟连接延迟 300ms
    setTimeout(() => {
      if (!isMountedRef.current) return;
      setIsConnected(true);
      reconnectAttemptRef.current = 0;

      intervalRef.current = setInterval(pushTick, interval);
    }, 300);
  }, [interval, pushTick]);

  // 断开
  const disconnect = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    setIsConnected(false);
    reconnectAttemptRef.current = 0;
  }, []);

  // 重连 (指数退避)
  const reconnect = useCallback(() => {
    disconnect();

    const delay = Math.min(1000 * Math.pow(2, reconnectAttemptRef.current), MAX_RECONNECT_DELAY);
    reconnectAttemptRef.current += 1;

    setIsConnected(false);

    reconnectTimeoutRef.current = setTimeout(() => {
      if (isMountedRef.current) {
        connect();
      }
    }, delay);
  }, [disconnect, connect]);

  // 订阅交易对
  const subscribe = useCallback((newSymbols: string[]) => {
    setSubscribedSymbols((prev) => {
      const next = new Set(prev);
      newSymbols.forEach((s) => next.add(s));
      return next;
    });
  }, []);

  // 取消订阅
  const unsubscribe = useCallback((removeSymbols: string[]) => {
    setSubscribedSymbols((prev) => {
      const next = new Set(prev);
      removeSymbols.forEach((s) => next.delete(s));
      return next;
    });
  }, []);

  // 自动连接 & 清理
  useEffect(() => {
    isMountedRef.current = true;

    if (autoConnect) {
      connect();
    }

    return () => {
      isMountedRef.current = false;
      disconnect();
    };
  }, [autoConnect, connect, disconnect]);

  // 模拟随机断线重连 (概率极低，约每 60-120s 可能触发一次)
  useEffect(() => {
    if (!isConnected) return;

    const randomDisconnect = Math.random() * 120000 + 60000; // 60s-180s
    const timeout = setTimeout(() => {
      if (isMountedRef.current && isConnected && Math.random() < 0.15) {
        // 15% 概率模拟断线
        reconnect();
      }
    }, randomDisconnect);

    return () => clearTimeout(timeout);
  }, [isConnected, reconnect]);

  return {
    isConnected,
    messages,
    latestPrices,
    subscribe,
    unsubscribe,
    disconnect,
    reconnect,
  };
}

export default useMockWebSocket;
