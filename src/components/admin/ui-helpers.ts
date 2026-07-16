/**
 * Admin UI 共享工具（2026-07-11）
 *
 * 提供工业级页面所需的所有共享工具：
 *  - BRAND 品牌色系统
 *  - cardBaseStyle 基础卡片样式
 *  - sectionTitleStyle 区块标题样式
 *  - useCountUp 数字滚动 hook
 *  - useLiveFloat 实时数据波动 hook
 *  - staggerDelay 错位入场动画延迟计算
 *  - hashFnv32a 简易 hash（用于稳定 key/颜色）
 */

import { useEffect, useRef, useState, CSSProperties } from 'react';

// =============================================================================
// 品牌色系统（参考 jiashi-admin M02-6 Marketplace）
// =============================================================================

export const BRAND = {
  primary:   '#1652F0',  primaryLt: '#EEF2FF',
  success:   '#059669',  successLt: '#ECFDF5',
  gold:      '#D97706',  goldLt:    '#FEF3C7',
  purple:    '#7C3AED',  purpleLt:  '#F3E8FF',
  cyan:      '#0891B2',  cyanLt:    '#CFFAFE',
  rose:      '#E11D48',  roseLt:    '#FFE4E6',
  text:      '#0F172A',  textSub:   '#64748B',  textMute: '#94A3B8',
  border:    '#E2E8F0',  borderLt:  '#F1F5F9',
  bg:        '#F8FAFC',  card:      '#FFFFFF',
} as const;

// =============================================================================
// 基础样式
// =============================================================================

export const cardBaseStyle: CSSProperties = {
  background: BRAND.card,
  border: `1px solid ${BRAND.borderLt}`,
  borderRadius: 12,
  boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)',
};

export const sectionTitleStyle: CSSProperties = {
  fontSize: 14,
  fontWeight: 600,
  color: BRAND.text,
  marginBottom: 12,
  marginTop: 4,
  display: 'flex',
  alignItems: 'center',
  gap: 8,
};

// =============================================================================
// Hooks
// =============================================================================

/**
 * CountUp 数字滚动（rAF 缓动）
 * @param target 目标值
 * @param duration 缓动时长（ms）
 */
export function useCountUp(target: number, duration = 1000): number {
  const [value, setValue] = useState(target);
  const startRef = useRef<number | null>(null);
  const fromRef = useRef(target);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    fromRef.current = value;
    startRef.current = null;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    const tick = (now: number) => {
      if (startRef.current === null) startRef.current = now;
      const elapsed = now - startRef.current;
      const t = Math.min(1, elapsed / duration);
      // easeOutCubic
      const eased = 1 - Math.pow(1 - t, 3);
      const current = fromRef.current + (target - fromRef.current) * eased;
      setValue(current);
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        setValue(target);
      }
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, duration]);

  return Math.round(value);
}

/**
 * 实时数据波动（每隔 intervalMs 在 [target + min, target + max] 区间随机漂移）
 * 用于"在线人数 / 待审批数 / 告警数"等"呼吸感"指标
 */
export function useLiveFloat(target: number, opts: { min?: number; max?: number; intervalMs?: number } = {}): number {
  const { min = -1, max = 1, intervalMs = 5000 } = opts;
  const [value, setValue] = useState(target);
  const anchorRef = useRef(target);

  useEffect(() => {
    anchorRef.current = target;
  }, [target]);

  useEffect(() => {
    const tick = () => {
      const range = max - min + 1;
      const delta = min + Math.floor(Math.random() * range);
      const next = Math.max(0, anchorRef.current + delta);
      setValue(next);
    };
    const id = setInterval(tick, intervalMs);
    return () => clearInterval(id);
  }, [min, max, intervalMs]);

  return value;
}

// =============================================================================
// 工具
// =============================================================================

/**
 * 错位入场动画延迟
 *  返回 `delay-${ms}ms` 字符串，CSS 中通过 animation-delay 引用
 *
 *  示例：
 *  <div style={{ animation: `fadeIn 0.3s ${staggerDelay(i, 50)} both` }} />
 */
export function staggerDelay(index: number, step = 60, max = 600): string {
  const d = Math.min(index * step, max);
  return d + 'ms';
}

/**
 * 32-bit FNV-1a hash（用于稳定 key/颜色）
 */
export function hashFnv32a(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

// =============================================================================
// 数字格式化
// =============================================================================

export function fmtCompact(n: number): string {
  if (n >= 1e9) return (n / 1e9).toFixed(2) + 'B';
  if (n >= 1e6) return (n / 1e6).toFixed(2) + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
  return n.toFixed(0);
}

export function fmtUsd(n: number, digits = 0): string {
  return '$' + n.toLocaleString('en-US', { maximumFractionDigits: digits });
}

export function fmtPercent(n: number, digits = 2): string {
  return n.toFixed(digits) + '%';
}

export function fmtTimeAgo(ts: number): string {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return s + ' 秒前';
  if (s < 3600) return Math.floor(s / 60) + ' 分钟前';
  if (s < 86400) return Math.floor(s / 3600) + ' 小时前';
  return Math.floor(s / 86400) + ' 天前';
}

export function fmtDate(d: Date | string | number): string {
  const date = typeof d === 'string' || typeof d === 'number' ? new Date(d) : d;
  return date.toLocaleString('zh-CN');
}
