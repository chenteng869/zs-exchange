'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

// ==================== 类型定义 ====================
export interface UsePriceAnimationOptions {
  duration?: number;
  decimals?: number;
}

export interface UsePriceAnimationReturn {
  displayValue: number;
  value: number;
  isAnimating: boolean;
  direction: 'up' | 'down' | 'none';
}

// ==================== 缓动函数: easeOutExpo ====================
function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
}

// ==================== 核心 Hook ====================
export function usePriceAnimation(
  targetValue: number,
  options: UsePriceAnimationOptions = {}
): UsePriceAnimationReturn {
  const { duration = 500, decimals = 2 } = options;

  const [displayValue, setDisplayValue] = useState(targetValue);
  const [isAnimating, setIsAnimating] = useState(false);
  const [direction, setDirection] = useState<'up' | 'down' | 'none'>('none');

  const rafRef = useRef<number>(0);
  const startTimeRef = useRef<number | null>(null);
  const startValueRef = useRef(targetValue);
  const prevTargetRef = useRef(targetValue);

  const animate = useCallback(
    (timestamp: number) => {
      if (startTimeRef.current === null) {
        startTimeRef.current = timestamp;
      }

      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeOutExpo(progress);

      const start = startValueRef.current;
      const current = start + (targetValue - start) * easedProgress;

      setDisplayValue(current);

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        setDisplayValue(targetValue);
        setIsAnimating(false);
      }
    },
    [targetValue, duration]
  );

  // 监听目标值变化，启动动画
  useEffect(() => {
    // 跳过首次渲染（初始值不需要动画）
    if (prevTargetRef.current === targetValue && startTimeRef.current === null) {
      return;
    }

    // 确定方向
    if (targetValue > prevTargetRef.current) {
      setDirection('up');
    } else if (targetValue < prevTargetRef.current) {
      setDirection('down');
    } else {
      setDirection('none');
    }

    // 取消之前的动画
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }

    // 启动新动画
    startValueRef.current = displayValue; // 从当前显示值开始
    startTimeRef.current = null;
    setIsAnimating(true);
    rafRef.current = requestAnimationFrame(animate);
    prevTargetRef.current = targetValue;
  }, [targetValue, animate]);

  // 清理
  useEffect(() => {
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  return {
    displayValue: parseFloat(displayValue.toFixed(decimals)),
    value: targetValue,
    isAnimating,
    direction,
  };
}

export default usePriceAnimation;
