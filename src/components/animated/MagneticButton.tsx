'use client';

import React, { forwardRef, useRef, useCallback } from 'react';
import { motion, useSpring, useMotionValue } from 'framer-motion';

// ==================== 类型定义 ====================
interface MagneticButtonProps {
  children: React.ReactNode;
  /** 磁性吸附强度 (px), 默认 30 */
  strength?: number;
  /** 自定义类名 */
  className?: string;
  /** 是否禁用磁性效果 */
  disabled?: boolean;
}

/**
 * 磁性按钮组件
 * 鼠标靠近时按钮轻微跟随鼠标位置, 实现微交互效果
 * 使用 framer-motion useSpring 实现平滑过渡
 *
 * @example
 * ```tsx
 * <MagneticButton strength={40}>
 *   <button>点击我</button>
 * </MagneticButton>
 * ```
 */
const MagneticButton = forwardRef<HTMLDivElement, MagneticButtonProps>(
  ({ children, strength = 30, className = '', disabled = false }, forwardedRef) => {
    const ref = useRef<HTMLDivElement>(null);

    // 使用 spring 动画实现平滑回弹
    const x = useSpring(useMotionValue(0), {
      stiffness: 300,
      damping: 20,
    });

    const y = useSpring(useMotionValue(0), {
      stiffness: 300,
      damping: 20,
    });

    // 鼠标移动时计算偏移
    const handleMouseMove = useCallback(
      (e: React.MouseEvent<HTMLDivElement>) => {
        if (disabled || !ref.current) return;

        const rect = ref.current.getBoundingClientRect();
        // 计算鼠标相对于元素中心的偏移
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        const deltaX = e.clientX - centerX;
        const deltaY = e.clientY - centerY;

        // 限制最大偏移量
        x.set(Math.max(-strength, Math.min(strength, deltaX * 0.3)));
        y.set(Math.max(-strength, Math.min(strength, deltaY * 0.3)));
      },
      [strength, disabled, x, y],
    );

    // 鼠标离开时回弹到原位
    const handleMouseLeave = useCallback(() => {
      x.set(0);
      y.set(0);
    }, [x, y]);

    // 合并外部传入的 ref
    const setRefs = (node: HTMLDivElement | null) => {
      (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
      if (typeof forwardedRef === 'function') {
        forwardedRef(node);
      } else if (forwardedRef) {
        (forwardedRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
      }
    };

    return (
      <motion.div
        ref={setRefs}
        style={{ x, y }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className={`inline-block ${className}`}
      >
        {children}
      </motion.div>
    );
  },
);

MagneticButton.displayName = 'MagneticButton';

export default MagneticButton;
export type { MagneticButtonProps };
