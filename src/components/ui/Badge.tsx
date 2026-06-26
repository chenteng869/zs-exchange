'use client';

import React, { forwardRef } from 'react';

/**
 * ZS Exchange Badge 组件 V4（通用）
 * 严格遵循《数字交易所官网与管理员后台色系搭配最佳方案 V1.0》
 *
 * 通用语义色（不分业务域）：
 *   success  ->  #16C784 (官网) / #16A34A (后台)
 *   danger   ->  #EA3943 (官网) / #DC2626 (后台)
 *   warning  ->  #F59E0B
 *   info     ->  #1677FF
 *   frozen   ->  #7C3AED
 *   high-risk->  #F97316
 *   default  ->  #6B7280
 *
 * 业务状态（用户/订单/充值提现/风控）请使用 StatusBadge
 */

export type BadgeVariant =
  | 'default'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'frozen'
  | 'high-risk'
  | 'up'
  | 'down'
  | 'samoa'
  | 'license';

export type BadgeSize = 'sm' | 'md';
export type BadgeTheme = 'web' | 'admin';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  theme?: BadgeTheme;
  dot?: boolean;
  pulse?: boolean;
}

// ==================== 颜色定义 ====================

const webColors: Record<BadgeVariant, string> = {
  default: '#6B7280',
  success: '#16C784',
  warning: '#F59E0B',
  danger: '#EA3943',
  info: '#1677FF',
  frozen: '#7C3AED',
  'high-risk': '#F97316',
  up: '#16C784',
  down: '#EA3943',
  samoa: '#C6A05E',
  license: '#7C3AED',
};

const adminColors: Record<BadgeVariant, string> = {
  default: '#6B7280',
  success: '#16A34A',
  warning: '#F59E0B',
  danger: '#DC2626',
  info: '#1677FF',
  frozen: '#7C3AED',
  'high-risk': '#F97316',
  up: '#16A34A',
  down: '#DC2626',
  samoa: '#C6A05E',
  license: '#7C3AED',
};

// ==================== 尺寸 ====================

const sizeStyles: Record<BadgeSize, string> = {
  sm: 'px-2 py-0.5 text-[11px] gap-1',
  md: 'px-2.5 py-1 text-xs gap-1.5',
};

const dotSizes: Record<BadgeSize, string> = {
  sm: 'w-1.5 h-1.5',
  md: 'w-2 h-2',
};

// ==================== 主组件 ====================

const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  (
    {
      variant = 'default',
      size = 'sm',
      theme = 'web',
      dot = false,
      pulse = false,
      className = '',
      children,
      ...props
    },
    ref,
  ) => {
    const color = (theme === 'admin' ? adminColors : webColors)[variant] || webColors.default;
    const rgba = hexToRgba(color, 0.12);

    const baseClasses = [
      'inline-flex items-center font-medium rounded-md whitespace-nowrap',
      'transition-colors duration-200',
      sizeStyles[size],
    ].join(' ');

    return (
      <span
        ref={ref}
        className={`${baseClasses} ${pulse ? 'animate-pulse' : ''} ${className}`}
        style={{
          backgroundColor: rgba,
          color: color,
          border: '1px solid transparent',
        }}
        {...props}
      >
        {dot && (
          <span
            className={`rounded-full inline-block shrink-0 ${dotSizes[size]}`}
            style={{ backgroundColor: color }}
            aria-hidden="true"
          />
        )}
        {children}
      </span>
    );
  },
);

Badge.displayName = 'Badge';

// ==================== 辅助函数 ====================

function hexToRgba(hex: string | undefined, alpha: number): string {
  if (!hex || typeof hex !== 'string') {
    return `rgba(107, 114, 128, ${alpha})`;
  }
  let h = hex.replace('#', '');
  if (h.length === 3) {
    h = h
      .split('')
      .map((c) => c + c)
      .join('');
  }
  if (h.length !== 6) return `rgba(107, 114, 128, ${alpha})`;
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  if (isNaN(r) || isNaN(g) || isNaN(b)) {
    return `rgba(107, 114, 128, ${alpha})`;
  }
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export default Badge;
// 类型已在文件内通过 `export interface/type` 声明，外部可通过 index.ts 统一导出
