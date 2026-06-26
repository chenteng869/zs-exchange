'use client';

import React, { forwardRef, useRef, useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ==================== 类型定义 ====================
interface GlowCardProps {
  children: React.ReactNode;
  /** 光效颜色, 默认品牌紫色 #7C3AED */
  glowColor?: string;
  /** 光效强度 0~1, 默认 0.15 */
  intensity?: number;
  /** 自定义类名 */
  className?: string;
  /** 是否显示边框发光效果 */
  borderGlow?: boolean;
}

/**
 * 发光卡片组件
 * 鼠标在卡片上移动时, 内部光斑跟随鼠标位置
 * 配合边框发光效果营造高级感
 *
 * @example
 * ```tsx
 * <GlowCard glowColor="#7C3AED" intensity={0.2}>
 *   <div>卡片内容</div>
 * </GlowCard>
 * ```
 */
const GlowCard = forwardRef<HTMLDivElement, GlowCardProps>(
  (
    {
      children,
      glowColor = '#7C3AED',
      intensity = 0.15,
      className = '',
      borderGlow = false,
    },
    forwardedRef,
  ) => {
    const ref = useRef<HTMLDivElement>(null);
    const [position, setPosition] = useState({ x: -100, y: -100 }); // 初始在不可见区域
    const [isHovering, setIsHovering] = useState(false);

    // 限制强度范围
    const clampedIntensity = Math.max(0, Math.min(1, intensity));

    // 鼠标移动时更新光斑位置
    const handleMouseMove = useCallback(
      (e: React.MouseEvent<HTMLDivElement>) => {
        if (!ref.current) return;

        const rect = ref.current.getBoundingClientRect();
        // 计算鼠标相对于卡片的位置百分比
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;

        setPosition({ x, y });
        setIsHovering(true);
      },
      [],
    );

    // 鼠标离开时光斑淡出
    const handleMouseLeave = useCallback(() => {
      setIsHovering(false);
    }, []);

    // 合并外部传入的 ref
    const setRefs = (node: HTMLDivElement | null) => {
      (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
      if (typeof forwardedRef === 'function') {
        forwardedRef(node);
      } else if (forwardedRef) {
        (forwardedRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
      }
    };

    // 将颜色转换为 rgba 格式用于渐变
    const hexToRgba = (hex: string, alpha: number): string => {
      const cleanHex = hex.replace('#', '');
      const r = parseInt(cleanHex.substring(0, 2), 16);
      const g = parseInt(cleanHex.substring(2, 4), 16);
      const b = parseInt(cleanHex.substring(4, 6), 16);
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    };

    return (
      <motion.div
        ref={setRefs}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className={`
          relative overflow-hidden rounded-xl bg-white/50 backdrop-blur-sm
          ${borderGlow ? `border border-[${glowColor}]/30` : ''}
          transition-shadow duration-300
          ${className}
        `}
        whileHover={
          borderGlow
            ? {
                boxShadow: `0 0 30px ${hexToRgba(glowColor, clampedIntensity * 0.5)}`,
              }
            : undefined
        }
      >
        {/* 卡片内容 */}
        <div className="relative z-10">{children}</div>

        {/* 光斑层 */}
        <AnimatePresence>
          {isHovering && (
            <motion.div
              className="absolute inset-0 pointer-events-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              style={{
                background: `radial-gradient(circle at ${position.x}% ${position.y}%, ${hexToRgba(glowColor, clampedIntensity)} 0%, transparent 60%)`,
              }}
            />
          )}
        </AnimatePresence>
      </motion.div>
    );
  },
);

GlowCard.displayName = 'GlowCard';

export default GlowCard;
export type { GlowCardProps };
