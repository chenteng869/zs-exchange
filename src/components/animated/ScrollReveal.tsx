'use client';

import React, { forwardRef, useEffect, useRef, useState } from 'react';
import { motion, useInView, type Variants } from 'framer-motion';

// ==================== 类型定义 ====================
type ScrollDirection = 'up' | 'down' | 'left' | 'right';

interface ScrollRevealProps {
  children: React.ReactNode;
  /** 入场方向, 默认 'up' */
  direction?: ScrollDirection;
  /** 动画延迟 (秒), 默认 0 */
  delay?: number;
  /** 动画持续时间 (秒), 默认 0.5 */
  duration?: number;
  /** 自定义类名 */
  className?: string;
  /** 是否只触发一次, 默认 true */
  once?: boolean;
  /** 自定义变体, 可覆盖内置变体 */
  variants?: Variants;
}

// ==================== 方向映射 ====================
const directionVariants: Record<ScrollDirection, Variants> = {
  up: {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0 },
  },
  down: {
    hidden: { opacity: 0, y: -40 },
    visible: { opacity: 1, y: 0 },
  },
  left: {
    hidden: { opacity: 0, x: 40 },
    visible: { opacity: 1, x: 0 },
  },
  right: {
    hidden: { opacity: 0, x: -40 },
    visible: { opacity: 1, x: 0 },
  },
};

// ==================== 检测减少动画偏好 ====================
function usePrefersReducedMotion(): boolean {
  const [prefersReduced, setPrefersReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReduced(mq.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReduced(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  return prefersReduced;
}

// ==================== 组件 ====================
const ScrollReveal = forwardRef<HTMLDivElement, ScrollRevealProps>(
  (
    {
      children,
      direction = 'up',
      delay = 0,
      duration = 0.5,
      className = '',
      once = true,
      variants,
    },
    forwardedRef,
  ) => {
    const innerRef = useRef<HTMLDivElement>(null);
    const isInView = useInView(innerRef, {
      once,
      margin: '-50px',
      amount: 0.1,
    });
    const prefersReduced = usePrefersReducedMotion();

    // 合并外部传入的 ref
    const setRefs = (node: HTMLDivElement | null) => {
      (innerRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
      if (typeof forwardedRef === 'function') {
        forwardedRef(node);
      } else if (forwardedRef) {
        (forwardedRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
      }
    };

    // 使用自定义变体或内置方向变体
    const activeVariants = variants || directionVariants[direction];

    // 为 visible 状态注入 transition 配置
    const finalVariants: Variants = {
      ...activeVariants,
      visible: {
        ...activeVariants.visible,
        transition: {
          ...(typeof activeVariants.visible === 'object' && 'transition' in activeVariants.visible
            ? (activeVariants.visible as { transition?: object }).transition || {}
            : {}),
          delay,
          duration,
          ease: [0.25, 0.1, 0.25, 1],
        },
      },
    };

    // 减少动画偏好时直接显示
    if (prefersReduced) {
      return (
        <div ref={setRefs} className={className}>
          {children}
        </div>
      );
    }

    return (
      <motion.div
        ref={setRefs}
        initial="hidden"
        animate={isInView ? 'visible' : 'hidden'}
        variants={finalVariants}
        className={className}
      >
        {children}
      </motion.div>
    );
  },
);

ScrollReveal.displayName = 'ScrollReveal';

export default ScrollReveal;
export type { ScrollRevealProps, ScrollDirection };
