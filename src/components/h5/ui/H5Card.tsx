'use client';

/**
 * H5Card — 极光玻璃质感卡片
 *
 * 统一所有页面的卡片容器样式，支持 variants:
 *   - default: 标准玻璃卡片
 *   - gold:   金色强调边框
 *   - pressed: 按压态（适合可点击卡片）
 *   - gradient: 渐变背景
 */
import { ReactNode, CSSProperties, MouseEvent } from 'react';

interface H5CardProps {
  children: ReactNode;
  variant?: 'default' | 'gold' | 'pressed' | 'gradient';
  onClick?: (e: MouseEvent<HTMLDivElement>) => void;
  style?: CSSProperties;
  padding?: string | number;
  className?: string;
}

const variantStyles: Record<string, CSSProperties> = {
  default: {
    background:
      'linear-gradient(180deg, rgba(26, 36, 86, 0.55) 0%, rgba(21, 34, 74, 0.70) 100%)',
    border: '1px solid rgba(148, 163, 184, 0.18)',
    boxShadow: 'none',
  },
  gold: {
    background:
      'linear-gradient(180deg, rgba(240, 185, 11, 0.10) 0%, rgba(21, 34, 74, 0.70) 100%)',
    border: '1px solid rgba(240, 185, 11, 0.25)',
    boxShadow: '0 0 24px rgba(240, 185, 11, 0.08)',
  },
  pressed: {
    background:
      'linear-gradient(180deg, rgba(56, 189, 248, 0.08) 0%, rgba(26, 36, 86, 0.60) 100%)',
    border: '1px solid rgba(56, 189, 248, 0.20)',
    boxShadow: '0 0 16px rgba(56, 189, 248, 0.06)',
    cursor: 'pointer',
  },
  gradient: {
    background:
      'linear-gradient(135deg, rgba(240, 185, 11, 0.15) 0%, rgba(56, 189, 248, 0.15) 100%)',
    border: '1px solid rgba(240, 185, 11, 0.25)',
    boxShadow: '0 0 24px rgba(240, 185, 11, 0.10)',
  },
};

export default function H5Card({
  children,
  variant = 'default',
  onClick,
  style,
  padding = 14,
  className,
}: H5CardProps) {
  const base: CSSProperties = {
    borderRadius: 16,
    padding,
    position: 'relative',
    overflow: 'hidden',
    backdropFilter: 'blur(20px) saturate(180%)',
    WebkitBackdropFilter: 'blur(20px) saturate(180%)',
    ...variantStyles[variant],
    ...style,
  };

  return (
    <div
      style={base}
      onClick={onClick}
      className={className}
    >
      {/* 顶部光晕装饰线 */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: '20%',
          right: '20%',
          height: 1,
          background:
            variant === 'gold'
              ? 'linear-gradient(90deg, transparent 0%, #FCD535 50%, transparent 100%)'
              : 'linear-gradient(90deg, transparent 0%, rgba(56,189,248,0.40) 50%, transparent 100%)',
          opacity: 0.6,
        }}
      />
      {children}
    </div>
  );
}