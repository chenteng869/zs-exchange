'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

// ==================== 类型定义 ====================
interface UseScrollAnimationOptions {
  /** 触发阈值, 默认 0.1 */
  threshold?: number;
  /** 是否只触发一次, 默认 true */
  triggerOnce?: boolean;
  /** 根元素边距, 默认 '-50px' */
  rootMargin?: string;
  /** 动画延迟 (ms), 用于交错动画 */
  delay?: number;
}

interface UseScrollAnimationReturn {
  ref: React.RefObject<HTMLElement | null>;
  isInView: boolean;
}

/**
 * 滚动触发动画 Hook
 * 基于 IntersectionObserver 实现元素进入视口检测
 *
 * @example
 * ```tsx
 * const { ref, isInView } = useScrollAnimation({ delay: 200 });
 * return <div ref={ref} className={isInView ? 'opacity-100' : 'opacity-0'}>内容</div>
 * ```
 */
export function useScrollAnimation(
  options: UseScrollAnimationOptions = {},
): UseScrollAnimationReturn {
  const {
    threshold = 0.1,
    triggerOnce = true,
    rootMargin = '-50px',
    delay = 0,
  } = options;

  const ref = useRef<HTMLElement | null>(null);
  const [isInView, setIsInView] = useState(false);
  const hasTriggeredRef = useRef(false);

  // 检测用户是否偏好减少动画
  const prefersReducedMotion = useRef(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    prefersReducedMotion.current = mediaQuery.matches;

    if (prefersReducedMotion.current) {
      setIsInView(true);
      return;
    }

    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          if (triggerOnce && hasTriggeredRef.current) return;
          hasTriggeredRef.current = true;

          if (delay > 0) {
            setTimeout(() => setIsInView(true), delay);
          } else {
            setIsInView(true);
          }

          if (triggerOnce) {
            observer.unobserve(element);
          }
        } else if (!triggerOnce) {
          setIsInView(false);
        }
      },
      { threshold, rootMargin },
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [threshold, triggerOnce, rootMargin, delay]);

  return { ref, isInView };
}

export type { UseScrollAnimationOptions, UseScrollAnimationReturn };
