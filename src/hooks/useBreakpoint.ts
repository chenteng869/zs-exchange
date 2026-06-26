'use client';

import { useState, useEffect, useCallback } from 'react';
import { breakpointValues } from '@/styles/responsive';

type BreakpointName = keyof typeof breakpointValues;

/**
 * 断点检测 Hook
 *
 * 返回当前窗口对应的断点名，基于 resize 事件监听（debounced 150ms）。
 * 服务端渲染期间默认返回 'xs'。
 *
 * @returns 当前断点名: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'
 *
 * @example
 * ```tsx
 * const bp = useBreakpoint();
 * // bp === 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'
 * ```
 */
export function useBreakpoint(): BreakpointName {
  const [breakpoint, setBreakpoint] = useState<BreakpointName>('xs');

  const getBreakpoint = useCallback((): BreakpointName => {
    const width = window.innerWidth;
    const sortedEntries = Object.entries(breakpointValues).sort(
      ([, a], [, b]) => a - b,
    );

    let current: BreakpointName = 'xs';
    for (const [name, value] of sortedEntries) {
      if (width >= value) {
        current = name as BreakpointName;
      } else {
        break;
      }
    }
    return current;
  }, []);

  useEffect(() => {
    setBreakpoint(getBreakpoint());

    let timer: ReturnType<typeof setTimeout>;

    const handleResize = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        setBreakpoint(getBreakpoint());
      }, 150);
    };

    window.addEventListener('resize', handleResize, { passive: true });
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timer);
    };
  }, [getBreakpoint]);

  return breakpoint;
}
