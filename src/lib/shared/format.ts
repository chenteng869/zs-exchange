/**
 * 共享格式化工具
 *
 *  - 价格（自适应精度）
 *  - 时间（按周期格式化）
 *  - 紧凑数字（1.2K / 3.4M）
 */

// =============================================================================
// 价格
// =============================================================================

/** 价格自适应精度（>=1000 取整；>=1 保留 2 位；>=0.01 保留 4 位；其余 6 位） */
export function fmtPrice(p: number): string {
  if (!isFinite(p) || p === 0) return '0';
  const abs = Math.abs(p);
  if (abs >= 10000) return p.toLocaleString('en-US', { maximumFractionDigits: 0 });
  if (abs >= 1000) return p.toLocaleString('en-US', { maximumFractionDigits: 1 });
  if (abs >= 1) return p.toFixed(2);
  if (abs >= 0.01) return p.toFixed(4);
  return p.toFixed(6);
}

/** 解析价格字符串（含千分位逗号） */
export function parsePrice(s: string | number): number {
  if (typeof s === 'number') return s;
  return parseFloat(String(s).replace(/,/g, '')) || 0;
}

/** USDT 后缀价格 */
export function fmtUsdt(p: number): string {
  return `${fmtPrice(p)} USDT`;
}

// =============================================================================
// 时间
// =============================================================================

import type { PeriodKey } from './candles';

/** 时间戳 → HH:mm（分钟级周期） */
export function fmtHM(time: number): string {
  const d = new Date(time);
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

/** 时间戳 → MM-DD HH:mm（小时级以上周期） */
export function fmtMDHM(time: number): string {
  const d = new Date(time);
  return `${pad2(d.getMonth() + 1)}-${pad2(d.getDate())} ${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

/** 时间戳 → YYYY-MM-DD（天级） */
export function fmtYMD(time: number): string {
  const d = new Date(time);
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

/** 按周期格式化时间戳 */
export function fmtTimeByPeriod(time: number, period: PeriodKey): string {
  if (period === '1D') return fmtYMD(time);
  if (period === '4H' || period === '1H') return fmtMDHM(time);
  return fmtHM(time);
}

function pad2(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

// =============================================================================
// 紧凑数字
// =============================================================================

/** 紧凑数字 1234 → "1.2K"  1234567 → "1.2M" */
export function fmtCompact(n: number, digits = 1): string {
  if (!isFinite(n)) return '—';
  const abs = Math.abs(n);
  if (abs >= 1e9) return `${(n / 1e9).toFixed(digits)}B`;
  if (abs >= 1e6) return `${(n / 1e6).toFixed(digits)}M`;
  if (abs >= 1e3) return `${(n / 1e3).toFixed(digits)}K`;
  return n.toFixed(0);
}

/** 货币 1,234,567 → "1,234,567" */
export function fmtInt(n: number): string {
  if (!isFinite(n)) return '—';
  return Math.round(n).toLocaleString('en-US');
}
