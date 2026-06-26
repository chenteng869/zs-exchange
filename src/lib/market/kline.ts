/**
 * K 线聚合器
 * - 从 trades 实时聚合成 K 线
 * - 支持 1m/5m/15m/1h/4h/1d
 */

import type { Trade } from './feed';

export type KlineInterval = '1m' | '5m' | '15m' | '30m' | '1h' | '4h' | '1d' | '1w';

export interface Kline {
  openTime: number;
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string;
  closeTime: number;
  trades: number;
}

const INTERVAL_MS: Record<KlineInterval, number> = {
  '1m': 60_000,
  '5m': 5 * 60_000,
  '15m': 15 * 60_000,
  '30m': 30 * 60_000,
  '1h': 60 * 60_000,
  '4h': 4 * 60 * 60_000,
  '1d': 24 * 60 * 60_000,
  '1w': 7 * 24 * 60 * 60_000,
};

export function bucketStart(t: number, interval: KlineInterval): number {
  const ms = INTERVAL_MS[interval];
  return Math.floor(t / ms) * ms;
}

export function generateKlineFromTrades(trades: Trade[], interval: KlineInterval): Kline[] {
  if (trades.length === 0) return [];
  const sorted = [...trades].sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  const buckets = new Map<number, Kline>();

  for (const t of sorted) {
    const ts = new Date(t.timestamp).getTime();
    const bStart = bucketStart(ts, interval);
    let k = buckets.get(bStart);
    if (!k) {
      k = {
        openTime: bStart,
        open: t.price,
        high: t.price,
        low: t.price,
        close: t.price,
        volume: '0',
        closeTime: bStart + INTERVAL_MS[interval] - 1,
        trades: 0,
      };
      buckets.set(bStart, k);
    }
    // 注意：open 在首笔确定后保持不变
    if (parseFloat(t.price) > parseFloat(k.high)) k.high = t.price;
    if (parseFloat(t.price) < parseFloat(k.low)) k.low = t.price;
    k.close = t.price;
    k.volume = (parseFloat(k.volume) + parseFloat(t.quantity)).toFixed(8);
    k.trades += 1;
  }
  return Array.from(buckets.values()).sort((a, b) => a.openTime - b.openTime);
}

/**
 * 生成历史 K 线（确定性，基于种子）
 *  - 用于演示/前端展示
 */
export function generateHistoricalKlines(
  symbol: string,
  interval: KlineInterval,
  count: number,
  endTime: number = Date.now(),
  basePrice: number = 100,
  seed: number = 1,
): Kline[] {
  const ms = INTERVAL_MS[interval];
  const out: Kline[] = [];
  let rng = seed;
  const nextRand = () => {
    rng = (rng * 9301 + 49297) % 233280;
    return rng / 233280;
  };
  let price = basePrice;
  for (let i = count - 1; i >= 0; i--) {
    const openTime = bucketStart(endTime - i * ms, interval);
    const open = price;
    // 一根 K 线内走 10 步
    let high = open;
    let low = open;
    let close = open;
    let vol = 0;
    for (let j = 0; j < 10; j++) {
      const drift = (nextRand() - 0.5) * 0.01;
      close = close * (1 + drift);
      if (close > high) high = close;
      if (close < low) low = close;
      vol += nextRand() * 0.5;
    }
    out.push({
      openTime,
      open: open.toFixed(2),
      high: high.toFixed(2),
      low: low.toFixed(2),
      close: close.toFixed(2),
      volume: vol.toFixed(4),
      closeTime: openTime + ms - 1,
      trades: Math.floor(nextRand() * 100) + 10,
    });
    price = close;
  }
  return out;
}
