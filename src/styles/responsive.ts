/**
 * ZS Exchange 响应式工具模块
 *
 * 断点定义与 tailwind.config.ts 保持一致
 * 提供媒体查询构建函数和断点常量
 */

// ==================== 断点定义 ====================

/** CSS 媒体查询用断点值 (字符串) */
export const breakpoints = {
  xs: '480px',
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

/** Hook / JS 逻辑用断点数值 */
export const breakpointValues = {
  xs: 480,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const;

export type Breakpoint = keyof typeof breakpoints;

// ==================== 媒体查询构建器 ====================

/**
 * 构建最小宽度媒体查询字符串
 * @example minBreakpoint('md') => '(min-width: 768px)'
 */
export function minBreakpoint(bp: Breakpoint): string {
  return `(min-width: ${breakpoints[bp]})`;
}

/**
 * 构建最大宽度媒体查询字符串
 * @example maxBreakpoint('md') => '(max-width: 767px)'
 */
export function maxBreakpoint(bp: Breakpoint): string {
  const value = breakpointValues[bp];
  return `(max-width: ${value - 1}px)`;
}

/**
 * 构建范围媒体查询字符串
 * @example betweenBreakpoint('sm', 'lg') => '(min-width: 640px) and (max-width: 1023px)'
 */
export function betweenBreakpoint(minBp: Breakpoint, maxBp: Breakpoint): string {
  return `${minBreakpoint(minBp)} and ${maxBreakpoint(maxBp)}`;
}

// ==================== 预定义常用媒体查询 ====================

/** 移动端 (<= 768px) */
export const MEDIA_MOBILE = `(max-width: ${breakpointValues.md - 1}px)`;

/** 平板端 (769px ~ 1024px) */
export const MEDIA_TABLET = `(min-width: ${breakpointValues.md + 1}px) and (max-width: ${breakpointValues.lg}px)`;

/** 桌面端 (>= 1025px) */
export const MEDIA_DESKTOP = `(min-width: ${breakpointValues.lg + 1}px)`;

/** 非移动端 (>= 769px) */
export const MEDIA_NON_MOBILE = `(min-width: ${breakpointValues.md + 1}px)`;

// ==================== CSS-in-JS 媒体查询字符串生成器 ====================

/**
 * 媒体查询快捷生成器（用于 styled-components / CSS-in-JS 场景）
 *
 * @example
 * ```ts
 * media.up('md')    => '@media (min-width: 768px)'
 * media.down('md')  => '@media (max-width: 768px)'
 * media.between('sm', 'lg') => '@media (min-width: 640px) and (max-width: 1024px)'
 * ```
 */
export const media = {
  up: (bp: Breakpoint) => `@media (min-width: ${breakpoints[bp]})`,
  down: (bp: Breakpoint) => `@media (max-width: ${breakpoints[bp]})`,
  between: (min: Breakpoint, max: Breakpoint) =>
    `@media (min-width: ${breakpoints[min]}) and (max-width: ${breakpoints[max]})`,
} as const;
