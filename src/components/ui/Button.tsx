'use client';

import React, { forwardRef, useState } from 'react';

/**
 * ZS Exchange Button 组件 V4
 * 严格遵循《数字交易所官网与管理员后台色系搭配最佳方案 V1.0》第13章
 *
 * 官网主按钮：背景 #1677FF，文字 #FFFFFF，hover #4096FF，圆角 8-12px
 * 官网副按钮：透明 + #334155 边框，hover 边框 #1677FF
 * CTA 按钮：蓝紫渐变 #1677FF → #7C3AED
 * 后台主操作：#1677FF
 * 后台成功操作：#16A34A
 * 后台危险操作：#DC2626
 * 后台警告操作：#F59E0B
 * 高风险操作必须二次确认（业务侧保障）
 */

export type ButtonVariant =
  | 'primary'        // 官网主按钮 / 后台主操作 - #1677FF
  | 'secondary'      // 副按钮 - 透明 + 边框
  | 'outline'        // 轮廓按钮 - 透明 + 边框（secondary 别名）
  | 'cta'            // CTA 渐变按钮 - 蓝紫渐变
  | 'success'        // 成功操作 - #16A34A / #16C784
  | 'danger'         // 危险操作 - #DC2626 / #EA3943
  | 'warning'        // 警告操作 - #F59E0B
  | 'ghost'          // 幽灵按钮 - 无背景无边框
  | 'link';          // 链接按钮

export type ButtonSize = 'sm' | 'md' | 'lg';

export type ButtonTheme = 'web' | 'admin';
/** 主题：web 官网/交易页（#EA3943 下跌红），admin 后台（#DC2626 错误红） */

export interface ButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'type'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  theme?: ButtonTheme;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  block?: boolean;
  type?: 'button' | 'submit' | 'reset';
}

// ==================== 主题色板（V1.0 第13章） ====================

const webPalette = {
  primary: '#1677FF',
  primaryHover: '#4096FF',
  primaryActive: '#0958D9',
  cta: 'linear-gradient(135deg, #1677FF 0%, #7C3AED 100%)',
  ctaHover: 'linear-gradient(135deg, #4096FF 0%, #9050F0 100%)',
  secondaryBorder: '#334155',
  secondaryBorderHover: '#1677FF',
  secondaryText: '#F8FAFC',
  secondaryTextHover: '#1677FF',
  success: '#16C784',
  successHover: '#0EA371',
  danger: '#EA3943',
  dangerHover: '#D11A24',
  warning: '#F59E0B',
  warningText: '#0F1830',
  ghostText: '#94A3B8',
  ghostHover: 'rgba(255,255,255,0.04)',
};

const adminPalette = {
  primary: '#1677FF',
  primaryHover: '#4096FF',
  primaryActive: '#0958D9',
  cta: 'linear-gradient(135deg, #1677FF 0%, #7C3AED 100%)',
  ctaHover: 'linear-gradient(135deg, #4096FF 0%, #9050F0 100%)',
  secondaryBorder: '#D1D5DB',
  secondaryBorderHover: '#1677FF',
  secondaryText: '#0F1830',
  secondaryTextHover: '#1677FF',
  success: '#16A34A',
  successHover: '#15803D',
  danger: '#DC2626',
  dangerHover: '#B91C1C',
  warning: '#F59E0B',
  warningText: '#0F1830',
  ghostText: '#6B7280',
  ghostHover: 'rgba(0,0,0,0.04)',
};

// ==================== 变体样式 ====================

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-sm gap-1.5',
  md: 'h-10 px-5 text-sm gap-2',
  lg: 'h-12 px-7 text-base gap-2.5',
};

const spinnerSizes: Record<ButtonSize, string> = {
  sm: 'w-3.5 h-3.5',
  md: 'w-4 h-4',
  lg: 'w-5 h-5',
};

// ==================== 主组件 ====================

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      theme = 'web',
      isLoading = false,
      leftIcon,
      rightIcon,
      block = false,
      className = '',
      disabled,
      children,
      type = 'button',
      style,
      onMouseEnter,
      onMouseLeave,
      onMouseDown,
      onMouseUp,
      ...props
    },
    ref,
  ) => {
    const isDisabled = disabled || isLoading;
    const palette = theme === 'admin' ? adminPalette : webPalette;
    const [hovered, setHovered] = useState(false);
    const [pressed, setPressed] = useState(false);

    // 计算当前样式
    let currentStyle: React.CSSProperties = {};

    switch (variant) {
      case 'primary':
        currentStyle = {
          background: pressed
            ? palette.primaryActive
            : hovered
            ? palette.primaryHover
            : palette.primary,
          color: '#FFFFFF',
        };
        break;

      case 'secondary':
      case 'outline':
        currentStyle = {
          background: 'transparent',
          color: hovered ? palette.secondaryTextHover : palette.secondaryText,
          border: `1px solid ${hovered ? palette.secondaryBorderHover : palette.secondaryBorder}`,
        };
        break;

      case 'cta':
        currentStyle = {
          background: hovered ? palette.ctaHover : palette.cta,
          color: '#FFFFFF',
          boxShadow: hovered
            ? '0 6px 20px rgba(22, 119, 255, 0.40)'
            : '0 4px 16px rgba(22, 119, 255, 0.30)',
          transform: hovered ? 'translateY(-1px)' : 'none',
        };
        break;

      case 'success':
        currentStyle = {
          background: hovered ? palette.successHover : palette.success,
          color: '#FFFFFF',
        };
        break;

      case 'danger':
        currentStyle = {
          background: hovered ? palette.dangerHover : palette.danger,
          color: '#FFFFFF',
        };
        break;

      case 'warning':
        currentStyle = {
          background: palette.warning,
          color: palette.warningText,
        };
        break;

      case 'ghost':
        currentStyle = {
          background: hovered ? palette.ghostHover : 'transparent',
          color: palette.ghostText,
        };
        break;

      case 'link':
        currentStyle = {
          background: 'transparent',
          color: hovered ? palette.primaryHover : palette.primary,
          padding: 0,
          height: 'auto',
          textDecoration: hovered ? 'underline' : 'none',
        };
        break;
    }

    // 基础类
    const baseClasses = [
      'inline-flex items-center justify-center font-medium',
      'rounded-lg select-none whitespace-nowrap',
      'transition-all duration-200 ease-out',
      'focus:outline-none focus-visible:ring-2',
      isDisabled
        ? 'opacity-50 cursor-not-allowed'
        : 'cursor-pointer',
      block ? 'w-full' : '',
      sizeStyles[size],
    ].join(' ');

    return (
      <button
        ref={ref}
        type={type}
        className={`${baseClasses} ${className}`}
        style={{
          ...currentStyle,
          ...style,
          // 焦点环颜色
          boxShadow: isDisabled
            ? currentStyle.boxShadow
            : `${currentStyle.boxShadow || ''} ${variant !== 'link' ? '0 0 0 2px transparent' : ''}`.trim(),
          ['--tw-ring-color' as string]: palette.primary,
        } as React.CSSProperties}
        disabled={isDisabled}
        aria-busy={isLoading || undefined}
        onMouseEnter={(e) => {
          if (!isDisabled) setHovered(true);
          onMouseEnter?.(e);
        }}
        onMouseLeave={(e) => {
          setHovered(false);
          setPressed(false);
          onMouseLeave?.(e);
        }}
        onMouseDown={(e) => {
          if (!isDisabled) setPressed(true);
          onMouseDown?.(e);
        }}
        onMouseUp={(e) => {
          setPressed(false);
          onMouseUp?.(e);
        }}
        {...props}
      >
        {isLoading ? (
          <svg
            className={`animate-spin ${spinnerSizes[size]}`}
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
        ) : (
          leftIcon && <span className="shrink-0 inline-flex">{leftIcon}</span>
        )}
        {children && <span className="truncate">{children}</span>}
        {!isLoading && rightIcon && <span className="shrink-0 inline-flex">{rightIcon}</span>}
      </button>
    );
  },
);

Button.displayName = 'Button';

export default Button;
