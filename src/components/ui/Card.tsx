﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿import React, { forwardRef } from 'react';

/**
 * ZS Exchange Card 组件 V4
 * 严格遵循 V1.0 第4/5/7章
 *   官网深色：default = #0F1830 卡片 + #1E293B 边框
 *   后台浅色：light = #FFFFFF 卡片 + #E5E7EB 边框
 *   glass   = 玻璃拟态（深色 + 半透明）
 *   cta     = 蓝紫渐变边框（Web3/生态模块）
 */

type CardVariant = 'default' | 'glass' | 'light' | 'cta';
type CardTheme = 'web' | 'admin';
type CardPadding = 'sm' | 'md' | 'lg' | 'none';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  theme?: CardTheme;
  padding?: CardPadding;
  hoverable?: boolean;
}

// V1.0 文档：4.1 官网主色板 / 7.2 后台主色板
const variantStyles: Record<CardVariant, Record<CardTheme, string>> = {
  default: {
    web: 'bg-[#0F1830] border border-[#1E293B] text-[#F8FAFC]',
    admin: 'bg-white border border-[#E5E7EB] text-[#0F1830]',
  },
  glass: {
    web: 'bg-[#0B1220]/80 backdrop-blur-md border border-[#1E293B] text-[#F8FAFC]',
    admin: 'bg-white/80 backdrop-blur-md border border-[#E5E7EB] text-[#0F1830]',
  },
  light: {
    web: 'bg-[#0F172A] border border-[#1E293B] text-[#F8FAFC]',
    admin: 'bg-white border border-[#E5E7EB] text-[#0F1830] shadow-sm',
  },
  cta: {
    // V1.0 4.2 蓝紫渐变
    web: 'bg-[#0F1830] border border-transparent text-[#F8FAFC] relative',
    admin: 'bg-white border border-transparent text-[#0F1830] relative',
  },
};

const paddingStyles: Record<CardPadding, string> = {
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
  none: 'p-0',
};

const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    { variant = 'default', theme = 'web', padding = 'md', hoverable = true, className = '', children, style, ...props },
    ref,
  ) => {
    const hoverClass = hoverable
      ? theme === 'web'
        ? 'hover:-translate-y-1 hover:shadow-[0_8px_24px_rgba(22,119,255,0.20)] hover:border-[#1677FF]'
        : 'hover:-translate-y-1 hover:shadow-md hover:border-[#1677FF]'
      : '';

    return (
      <div
        ref={ref}
        className={`
          rounded-xl transition-all duration-300 ease-out
          ${variantStyles[variant][theme]}
          ${paddingStyles[padding]}
          ${hoverClass}
          ${className}
        `}
        style={style}
        {...props}
      >
        {children}
      </div>
    );
  },
);

Card.displayName = 'Card';

export default Card;
export type { CardProps, CardVariant, CardTheme, CardPadding };
