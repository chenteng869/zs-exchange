/**
 * 行情快照：K 线 / Ticker / 24h 统计
 *
 *  - K 线按 interval 聚合 trades
 *  - Ticker 由当前 OrderBook + 24h 统计聚合
 *  - 24h 统计：open/high/low/volume/quoteVolume/change
 */

import type {
  Decimal,
  Kline,
  KlineInterval,
  OrderBookSnapshot,
  Ticker,
  Trade,
} from '@/types/models';
import { decAdd, decCmp, decDiv, decIsZero, decMul, decSub, decTruncate } from './decimal';

const INTERVAL_MS: Record<KlineInterval, number> = {
  '1m': 60_000,
  '5m': 5 * 60_000,
  '15m': 15 * 60_000,
  '30m': 30 * 60_000,
  '1h': 60 * 60_000,
  '4h': 4 * 60 * 60_000,
  '1d': 24 * 60 * 60_000,
  '1w': 7 * 24 * 60 * 60_000,
  '1M': 30 * 24 * 60 * 60_000,
};

/** 把 ISO date 解析为 ms。 */
function ts(iso: string): number {
  return Date.parse(iso);
}

/** 给定时间戳和 interval，计算所在 bar 的开始时间（ms）。 */
export function bucketStart(timeMs: number, interval: KlineInterval): number {
  const step = INTERVAL_MS[interval];
  if (step === 0) return timeMs;
  return Math.floor(timeMs / step) * step;
}

/**
 * 从 trade 列表聚合 K 线（按时间正序）。
 * - trades 需按 executedAt 升序
 */
export function generateKline(trades: Trade[], interval: KlineInterval): Kline[] {
  if (trades.length === 0) return [];
  const klines: Kline[] = [];
  let cur: Kline | null = null;
  for (const t of trades) {
    const tMs = ts(t.executedAt);
    const start = bucketStart(tMs, interval);
    const step = INTERVAL_MS[interval];
    const end = start + step - 1;
    if (!cur || cur.openTime !== start) {
      // 收口上一根
      if (cur) klines.push(cur);
      const quote = decTruncate(decMul(t.price, t.quantity), 8);
      cur = {
        openTime: start,
        open: t.price,
        high: t.price,
        low: t.price,
        close: t.price,
        volume: t.quantity,
        quoteVolume: quote,
        trades: 1,
        closeTime: end,
      };
    } else {
      cur.high = decCmp(t.price, cur.high) > 0 ? t.price : cur.high;
      cur.low = decCmp(t.price, cur.low) < 0 ? t.price : cur.low;
      cur.close = t.price;
      cur.volume = decAdd(cur.volume, t.quantity);
      cur.quoteVolume = decAdd(cur.quoteVolume, decTruncate(decMul(t.price, t.quantity), 8));
      cur.trades += 1;
    }
  }
  if (cur) klines.push(cur);
  return klines;
}

/**
 * 根据当前 OrderBook + 24h trades 聚合 Ticker。
 *  - open24h = 24h 之前最近一根 K 线的 close；或 24h 区间首根 K 的 open
 *  - 如果没有 24h 数据：open24h = lastPrice
 */
export function generateTicker(
  symbol: string,
  baseAsset: string,
  quoteAsset: string,
  book: OrderBookSnapshot,
  trades24h: Trade[],
  lastPrice?: Decimal
): Ticker {
  const stat = calculate24hStats(trades24h);
  const lp = lastPrice ?? stat.lastPrice ?? '0';
  const open = stat.open24h ?? lp;
  const changeAbs = decSub(lp, open);
  // 涨跌幅 % = (last - open) / open * 100
  const changePctNum = decIsZero(open) ? '0' : decTruncate(decMul(divStr(lp, open), '100'), 4);

  const bestBid = book.bids[0]?.price ?? '0';
  const bestAsk = book.asks[0]?.price ?? '0';
  const bestBidQty = book.bids[0]?.quantity ?? '0';
  const bestAskQty = book.asks[0]?.quantity ?? '0';

  return {
    symbol,
    baseAsset,
    quoteAsset,
    lastPrice: lp,
    bidPrice: bestBid,
    askPrice: bestAsk,
    bidQty: bestBidQty,
    askQty: bestAskQty,
    open24h: open,
    high24h: stat.high24h,
    low24h: stat.low24h,
    volume24h: stat.volume24h,
    quoteVolume24h: stat.quoteVolume24h,
    change24h: changePctNum,
    changeAbs24h: changeAbs,
    updatedAt: new Date().toISOString(),
  };
}

/** 24h 统计。 */
export interface Stats24h {
  open24h: Decimal | null;
  high24h: Decimal;
  low24h: Decimal;
  volume24h: Decimal;
  quoteVolume24h: Decimal;
  lastPrice: Decimal | null;
  trades: number;
}

export function calculate24hStats(trades: Trade[], now: number = Date.now()): Stats24h {
  const cutoff = now - 24 * 60 * 60 * 1000;
  const inWindow = trades.filter((t) => ts(t.executedAt) >= cutoff);
  if (inWindow.length === 0) {
    return {
      open24h: null,
      high24h: '0',
      low24h: '0',
      volume24h: '0',
      quoteVolume24h: '0',
      lastPrice: trades.length > 0 ? trades[trades.length - 1].price : null,
      trades: 0,
    };
  }
  let high = inWindow[0].price;
  let low = inWindow[0].price;
  let vol: Decimal = '0';
  let qvol: Decimal = '0';
  for (const t of inWindow) {
    if (decCmp(t.price, high) > 0) high = t.price;
    if (decCmp(t.price, low) < 0) low = t.price;
    vol = decAdd(vol, t.quantity);
    qvol = decAdd(qvol, decTruncate(decMul(t.price, t.quantity), 8));
  }
  return {
    open24h: inWindow[0].price,
    high24h: high,
    low24h: low,
    volume24h: vol,
    quoteVolume24h: qvol,
    lastPrice: inWindow[inWindow.length - 1].price,
    trades: inWindow.length,
  };
}

/** 简单的 string 除法（精度 12 位） */
function divStr(a: string, b: string, precision: number = 12): string {
  return decDiv(a, b, precision);
}
