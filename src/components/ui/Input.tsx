﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿'use client';

import React, { forwardRef, useId, useState } from 'react';

/**
 * ZS Exchange Input 组件 V4
 * 严格遵循 V1.0 第13章（按钮标准）
 *
 * 焦点色：#1677FF（电光蓝主品牌色）
 * 错误色：#DC2626（后台错误红）/ #EA3943（官网下跌红）
 * 后台输入框：#FFFFFF 背景 + #E5E7EB 边框
 * 官网输入框：#0B1220 背景 + #1E293B 边框
 */

type InputTheme = 'web' | 'admin';

interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  theme?: InputTheme;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      theme = 'admin',
      className = '',
      id,
      onFocus,
      onBlur,
      ...props
    },
    ref,
  ) => {
    const generatedId = useId();
    const inputId = id || generatedId;
    const [focused, setFocused] = useState(false);

    // 主题基础色
    const baseBg = theme === 'web' ? '#0B1220' : '#FFFFFF';
    const baseBorder = theme === 'web' ? '#1E293B' : '#E5E7EB';
    const focusBorder = '#1677FF';
    const textColor = theme === 'web' ? '#F8FAFC' : '#0F1830';
    const placeholderColor = theme === 'web' ? '#64748B' : '#9CA3AF';
    const iconColor = theme === 'web' ? '#94A3B8' : '#6B7280';
    const labelColor = theme === 'web' ? '#94A3B8' : '#6B7280';
    const helperColor = theme === 'web' ? '#64748B' : '#9CA3AF';
    const errorColor = theme === 'admin' ? '#DC2626' : '#EA3943';
    const errorBg = theme === 'admin' ? 'rgba(220,38,38,0.08)' : 'rgba(234,57,67,0.08)';

    const currentBorder = error ? errorColor : focused ? focusBorder : baseBorder;
    const currentShadow = focused
      ? `0 0 0 3px ${error ? 'rgba(220,38,38,0.15)' : 'rgba(22,119,255,0.15)'}`
      : 'none';

    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium"
            style={{ color: labelColor }}
          >
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {leftIcon && (
            <span
              className="absolute left-3 z-10 pointer-events-none inline-flex"
              style={{ color: iconColor }}
            >
              {leftIcon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            className={`
              w-full rounded-lg outline-none
              text-sm transition-all duration-200 ease-out
              disabled:opacity-50 disabled:cursor-not-allowed
              ${leftIcon ? 'pl-10' : 'pl-4'}
              ${rightIcon ? 'pr-10' : 'pr-4'}
              py-2.5
              ${className}
            `}
            style={{
              backgroundColor: baseBg,
              border: `1px solid ${currentBorder}`,
              color: textColor,
              boxShadow: currentShadow,
            }}
            placeholder={props.placeholder}
            aria-invalid={!!error}
            aria-describedby={
              error
                ? `${inputId}-error`
                : helperText
                ? `${inputId}-helper`
                : undefined
            }
            onFocus={(e) => {
              setFocused(true);
              onFocus?.(e);
            }}
            onBlur={(e) => {
              setFocused(false);
              onBlur?.(e);
            }}
            {...props}
          />
          {rightIcon && (
            <span
              className="absolute right-3 z-10 pointer-events-none inline-flex"
              style={{ color: iconColor }}
            >
              {rightIcon}
            </span>
          )}
        </div>
        {error && (
          <p
            id={`${inputId}-error`}
            className="text-xs font-medium"
            style={{ color: errorColor, backgroundColor: errorBg, padding: '4px 8px', borderRadius: 4 }}
            role="alert"
          >
            {error}
          </p>
        )}
        {!error && helperText && (
          <p
            id={`${inputId}-helper`}
            className="text-xs"
            style={{ color: helperColor }}
          >
            {helperText}
          </p>
        )}
      </div>
    );
  },
);

Input.displayName = 'Input';

export default Input;
export type { InputProps, InputTheme };
