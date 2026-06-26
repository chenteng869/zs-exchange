'use client';

import { useState, useEffect } from 'react';
import { MEDIA_MOBILE } from '@/styles/responsive';

/**
 * 移动端检测 Hook
 *
 * 基于 768px 断点判断当前设备是否为移动端，
 * 同时结合 touch 设备检测增强准确性。
 *
 * @returns 是否为移动端设备
 *
 * @example
 * ```tsx
 * const isMobile = useIsMobile();
 * if (isMobile) {
 *   return <MobileLayout />;
 * }
 * return <DesktopLayout />;
 * ```
 */
export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // 媒体查询匹配
    const mql = window.matchMedia(MEDIA_MOBILE);
    setIsMobile(mql.matches);

    const handler = (event: MediaQueryListEvent) => {
      setIsMobile(event.matches);
    };

    mql.addEventListener('change', handler);

    // Touch 设备辅助检测（部分大屏触屏设备可能被误判）
    const hasTouchCapable =
      'ontouchstart' in window ||
      navigator.maxTouchPoints > 0;

    return () => {
      mql.removeEventListener('change', handler);
    };
  }, []);

  return isMobile;
}
