﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿'use client';

import React, { forwardRef, useEffect, useRef, useState } from 'react';
import { useInView, motion } from 'framer-motion';

// ==================== 类型定义 ====================
interface CountUpAnimatedProps {
  /** 目标数字 */
  end: number;
  /** 动画持续时间 (毫秒), 默认 2000 */
  duration?: number;
  /** 前缀文字, 如 '$' */
  prefix?: string;
  /** 后缀文字, 如 '%' 或 'M' */
  suffix?: string;
  /** 小数位数, 默认 0 */
  decimals?: number;
  /** 自定义类名 */
  className?: string;
  /** 趋势方向: 'up' 涨(绿), 'down' 跌(红) */
  trend?: 'up' | 'down' | null;
}

// ==================== easeOutExpo 缓动函数 ====================
function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
}

// ==================== 千分位格式化 ====================
function formatNumber(value: number, decimals: number): string {
  const fixed = value.toFixed(decimals);
  // 分割整数和小数部分
  const [intPart, decPart] = fixed.split('.');
  // 整数部分添加千分位逗号
  const formatted = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return decPart ? `${formatted}.${decPart}` : formatted;
}

// ==================== 组件 ====================
const CountUpAnimated = forwardRef<HTMLSpanElement, CountUpAnimatedProps>(
  (
    {
      end,
      duration = 2000,
      prefix = '',
      suffix = '',
      decimals = 0,
      className = '',
      trend = null,
    },
    forwardedRef,
  ) => {
    const [displayValue, setDisplayValue] = useState(0);
    const rafRef = useRef<number>(0);
    const startTimeRef = useRef<number | null>(null);
    const ref = useRef<HTMLSpanElement>(null);
    const isInView = useInView(ref, { once: true, margin: '-50px', amount: 0.3 });
    const hasAnimatedRef = useRef(false);

    // 合并外部传入的 ref
    const setRefs = (node: HTMLSpanElement | null) => {
      (ref as React.MutableRefObject<HTMLSpanElement | null>).current = node;
      if (typeof forwardedRef === 'function') {
        forwardedRef(node);
      } else if (forwardedRef) {
        (forwardedRef as React.MutableRefObject<HTMLSpanElement | null>).current = node;
      }
    };

    // 数字滚动动画
    useEffect(() => {
      // 只在进入视口且未动画过时触发
      if (!isInView || hasAnimatedRef.current) return;

      // 检测减少动画偏好
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        setDisplayValue(end);
        return;
      }

      hasAnimatedRef.current = true;

      const animate = (timestamp: number) => {
        if (startTimeRef.current === null) {
          startTimeRef.current = timestamp;
        }

        const elapsed = timestamp - startTimeRef.current;
        const progress = Math.min(elapsed / duration, 1);
        const easedProgress = easeOutExpo(progress);

        setDisplayValue(easedProgress * end);

        if (progress < 1) {
          rafRef.current = requestAnimationFrame(animate);
        }
      };

      rafRef.current = requestAnimationFrame(animate);

      return () => {
        if (rafRef.current) {
          cancelAnimationFrame(rafRef.current);
        }
      };
    }, [isInView, end, duration]);

    // 趋势指示器颜色
    const trendColor =
      trend === 'up'
        ? 'text-success'
        : trend === 'down'
          ? 'text-danger'
          : '';

    const trendIcon =
      trend === 'up' ? (
        <span className="ml-1 text-success">↑</span>
      ) : trend === 'down' ? (
        <span className="ml-1 text-danger">↓</span>
      ) : null;

    return (
      <motion.span
        ref={setRefs}
        className={`inline-block font-mono tabular-nums font-bold ${className} ${trendColor}`}
        initial={{ opacity: 0, scale: 0.5 }}
        animate={isInView ? { opacity: 1, scale: 1 } : {}}
        transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
      >
        {prefix}
        {formatNumber(displayValue, decimals)}
        {suffix}
        {trendIcon}
      </motion.span>
    );
  },
);

CountUpAnimated.displayName = 'CountUpAnimated';

export default CountUpAnimated;
export type { CountUpAnimatedProps };
