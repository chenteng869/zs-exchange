'use client';

/**
 * H5 → 真实 Ticker 适配层
 *
 *  把 Binance 的 Ticker 格式统一转成 H5 各页面使用的字段：
 *    price   = ticker.lastPrice
 *    change  = "+x.xx%" / "-x.xx%"
 *    up      = change24h >= 0
 *    volume  = 24h quote volume (USDT)，按 compact 格式
 *    high    = high24h
 *    low     = low24h
 */

import type { Ticker } from '@/lib/market/feed';
import { fmtPrice, fmtCompact, fmtPct } from '@/lib/shared';

export interface H5PairView {
  symbol: string;
  name: string;
  price: string;      // 数字字符串
  change: string;     // "+1.23%"
  up: boolean;
  volume: string;     // "24.5亿" 风格（compact + 亿/万）
  high: string;
  low: string;
  /** 原始 ticker（高级用法） */
  _raw?: Ticker;
}

/** Ticker → H5 视图 */
export function tickerToH5View(symbol: string, name: string, t: Ticker): H5PairView {
  const change = parseFloat(t.change24h);
  const quoteVol = parseFloat(t.volume24h) * parseFloat(t.lastPrice);
  return {
    symbol,
    name,
    price: fmtPrice(parseFloat(t.lastPrice)),
    change: fmtPct(change / 100, 2),
    up: change >= 0,
    volume: fmtVolumeCN(quoteVol),
    high: fmtPrice(parseFloat(t.high24h)),
    low: fmtPrice(parseFloat(t.low24h)),
    _raw: t,
  };
}

/** 把大额成交量格式化成中文友好的 "24.5亿" 风格 */
export function fmtVolumeCN(v: number): string {
  if (!isFinite(v) || v <= 0) return '0';
  if (v >= 1e8) return `${(v / 1e8).toFixed(2)}亿`;
  if (v >= 1e4) return `${(v / 1e4).toFixed(2)}万`;
  return v.toFixed(2);
}

/** 把 ticker 变化量格式化为带色字符（"#34D399" / "#F472B6"） */
export function changeColor(up: boolean): string {
  return up ? '#34D399' : '#F472B6';
}

// 兜底：fmtCompact 暴露
export { fmtCompact };
