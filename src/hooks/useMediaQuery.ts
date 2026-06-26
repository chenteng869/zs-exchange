'use client';

import { useState, useEffect } from 'react';

/**
 * 媒体查询 Hook
 *
 * 监听指定 CSS 媒体查询的匹配状态，返回布尔值。
 * 服务端渲染期间默认返回 false（安全降级）。
 *
 * @param query - CSS 媒体查询字符串，如 '(max-width: 768px)'
 * @returns 当前是否匹配该媒体查询
 *
 * @example
 * ```tsx
 * const isMobile = useMediaQuery('(max-width: 768px)');
 * const isTablet = useMediaQuery('(min-width: 769px) and (max-width: 1024px)');
 * ```
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    // SSR 安全：仅在客户端创建 MediaQueryList
    const mql = window.matchMedia(query);
    setMatches(mql.matches);

    const handler = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    // 兼容新旧 API
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, [query]);

  return matches;
}
