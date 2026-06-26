'use client';

/**
 * 行情数据 Hook — 轮询自有后端
 * 替代直连 Binance WS（国内被墙）
 *
 * 优先级：Binance WS（若可用）→ 后端 API 轮询（保底）
 * 轮询间隔：3s（保持数据新鲜度）
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { marketApi, type MarketTicker, fmtPrice, fmtChange, fmtVolume } from '@/lib/api/market';

// ─── 单 ticker ───────────────────────────────────────────────────────────────

export function useTickerData(symbol: string | null | undefined, intervalMs = 3000) {
  const [ticker, setTicker] = useState<MarketTicker | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);

  const fetch = useCallback(async () => {
    if (!symbol) return;
    try {
      const data = await marketApi.getTicker(symbol);
      if (mountedRef.current) {
        setTicker(data);
        setError(null);
        setLoading(false);
      }
    } catch (e: any) {
      if (mountedRef.current) {
        setError(e.message);
        setLoading(false);
      }
    }
  }, [symbol]);

  useEffect(() => {
    mountedRef.current = true;
    if (!symbol) { setLoading(false); return; }

    fetch();
    timerRef.current = setInterval(fetch, intervalMs);
    return () => {
      mountedRef.current = false;
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [symbol, intervalMs, fetch]);

  return { ticker, loading, error };
}

// ─── 多 ticker（行情列表用）────────────────────────────────────────────────

export function useTickersData(symbols: string[], intervalMs = 4000) {
  const [tickers, setTickers] = useState<Map<string, MarketTicker>>(new Map());
  const [loading, setLoading] = useState(true);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);
  const key = symbols.join(',');

  const fetchAll = useCallback(async () => {
    if (symbols.length === 0) return;
    try {
      const results = await Promise.allSettled(
        symbols.map((s) => marketApi.getTicker(s))
      );
      if (!mountedRef.current) return;
      setTickers((prev) => {
        const next = new Map(prev);
        results.forEach((r, i) => {
          if (r.status === 'fulfilled' && r.value && !r.value.error) {
            next.set(symbols[i], r.value);
          }
        });
        return next;
      });
      setLoading(false);
    } catch {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  useEffect(() => {
    mountedRef.current = true;
    fetchAll();
    timerRef.current = setInterval(fetchAll, intervalMs);
    return () => {
      mountedRef.current = false;
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [fetchAll, intervalMs]);

  return { tickers, loading };
}

// ─── K 线 ────────────────────────────────────────────────────────────────────

export interface KlineBar {
  openTime: number;
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string;
  time: string;      // 格式化后的时间标签
}

export function useKlineData(
  symbol: string | null | undefined,
  interval = '1h',
  limit = 100,
  intervalMs = 10000,
) {
  const [klines, setKlines] = useState<KlineBar[]>([]);
  const [loading, setLoading] = useState(true);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);

  const fetch = useCallback(async () => {
    if (!symbol) return;
    try {
      const raw = await marketApi.getKlines(symbol, interval, limit);
      if (!mountedRef.current) return;
      const bars: KlineBar[] = raw.map((r) => ({
        openTime: r[0] as number,
        open: String(r[1]),
        high: String(r[2]),
        low: String(r[3]),
        close: String(r[4]),
        volume: String(r[5]),
        time: new Date(r[0] as number).toLocaleTimeString('zh-CN', {
          hour: '2-digit', minute: '2-digit',
        }),
      }));
      setKlines(bars);
      setLoading(false);
    } catch {
      setLoading(false);
    }
  }, [symbol, interval, limit]);

  useEffect(() => {
    mountedRef.current = true;
    if (!symbol) { setLoading(false); return; }
    fetch();
    timerRef.current = setInterval(fetch, intervalMs);
    return () => {
      mountedRef.current = false;
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [symbol, intervalMs, fetch]);

  return { klines, loading };
}

// ─── 订单簿 ───────────────────────────────────────────────────────────────────

export interface OrderLevel {
  price: number;
  amount: number;
  total: number;
}

export interface OrderBookData {
  bids: OrderLevel[];
  asks: OrderLevel[];
  timestamp: number;
}

export function useOrderBook(symbol: string | null | undefined, intervalMs = 2000) {
  const [book, setBook] = useState<OrderBookData>({ bids: [], asks: [], timestamp: 0 });
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);

  const fetch = useCallback(async () => {
    if (!symbol) return;
    try {
      const raw = await marketApi.getOrderBook(symbol, 20);
      if (!mountedRef.current) return;
      let cumBid = 0;
      let cumAsk = 0;
      const bids: OrderLevel[] = (raw.bids ?? []).slice(0, 20).map(([p, a]) => {
        const price = parseFloat(p);
        const amount = parseFloat(a);
        cumBid += amount;
        return { price, amount, total: cumBid };
      });
      const asks: OrderLevel[] = (raw.asks ?? []).slice(0, 20).map(([p, a]) => {
        const price = parseFloat(p);
        const amount = parseFloat(a);
        cumAsk += amount;
        return { price, amount, total: cumAsk };
      });
      setBook({ bids, asks, timestamp: raw.timestamp ?? Date.now() });
    } catch {
      // keep previous data on error
    }
  }, [symbol]);

  useEffect(() => {
    mountedRef.current = true;
    if (!symbol) return;
    fetch();
    timerRef.current = setInterval(fetch, intervalMs);
    return () => {
      mountedRef.current = false;
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [symbol, intervalMs, fetch]);

  return book;
}

// ─── 最近成交 ─────────────────────────────────────────────────────────────────

export interface TradeRecord {
  id: string;
  price: number;
  amount: number;
  side: 'buy' | 'sell';
  time: string;
}

export function useRecentTrades(symbol: string | null | undefined, limit = 20, intervalMs = 3000) {
  const [trades, setTrades] = useState<TradeRecord[]>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);

  const fetch = useCallback(async () => {
    if (!symbol) return;
    try {
      const raw = await marketApi.getRecentTrades(symbol, limit);
      if (!mountedRef.current) return;
      setTrades(raw.map((t) => ({
        id: t.id,
        price: parseFloat(t.price),
        amount: parseFloat(t.quantity),
        side: t.side as 'buy' | 'sell',
        time: new Date(t.timestamp).toLocaleTimeString('zh-CN', {
          hour: '2-digit', minute: '2-digit', second: '2-digit',
        }),
      })));
    } catch {
      // keep previous on error
    }
  }, [symbol, limit]);

  useEffect(() => {
    mountedRef.current = true;
    if (!symbol) return;
    fetch();
    timerRef.current = setInterval(fetch, intervalMs);
    return () => {
      mountedRef.current = false;
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [symbol, intervalMs, fetch]);

  return trades;
}

// ─── 格式化工具（re-export 方便页面直接用）───────────────────────────────────
export { fmtPrice, fmtChange, fmtVolume };
