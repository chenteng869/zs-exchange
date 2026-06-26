'use client';

import { useRef } from 'react';
import { useScroll, useTransform, type MotionValue } from 'framer-motion';

// ==================== 类型定义 ====================
interface UseParallaxReturn {
  ref: React.RefObject<HTMLElement | null>;
  transform: MotionValue<string>;
}

/**
 * 视差滚动 Hook
 * 基于滚动位置生成 CSS transform, 实现视差效果
 *
 * @param speed - 视差速度系数, 范围 0~1, 默认 0.3
 *   - 0: 无视差效果
 *   - 1: 最大视差位移
 *
 * @example
 * ```tsx
 * const { ref, transform } = useParallax(0.5);
 * return <div ref={ref} style={{ y: transform }}>背景层</div>
 * ```
 */
export function useParallax(speed: number = 0.3): UseParallaxReturn {
  // 限制速度范围在 0~1 之间
  const clampedSpeed = Math.max(0, Math.min(1, speed));
  const ref = useRef<HTMLElement | null>(null);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });

  // 将滚动进度转换为 Y 轴偏移值
  // scrollYProgress 从 0→1 时, y 从正偏移到负偏移, 形成视差
  const transform = useTransform(
    scrollYProgress,
    [0, 1],
    [`${clampedSpeed * 100}px`, `${-clampedSpeed * 100}px`],
  );

  return { ref, transform };
}

export type { UseParallaxReturn };
