'use client';

/**
 * H5Form — 移动端统一表单组件
 *
 * 包含 Input / Textarea / Select / SubmitButton
 * Input 内置搜索框模式
 */
import {
  ChangeEvent,
  ReactNode,
  CSSProperties,
  KeyboardEvent,
} from 'react';

/* ---------- Input ---------- */
interface H5InputProps {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  prefix?: ReactNode;   // 左侧图标
  type?: 'text' | 'password' | 'number';
  maxLength?: number;
  disabled?: boolean;
  style?: CSSProperties;
  onKeyDown?: (e: KeyboardEvent<HTMLInputElement>) => void;
  autoFocus?: boolean;
}

export function H5Input({
  value,
  onChange,
  placeholder,
  prefix,
  type = 'text',
  maxLength,
  disabled,
  style,
  onKeyDown,
  autoFocus,
}: H5InputProps) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '10px 14px',
        background: 'rgba(15, 27, 61, 0.50)',
        border: '1px solid rgba(148, 163, 184, 0.18)',
        borderRadius: 10,
        transition: 'border-color 0.2s',
        ...style,
      }}
    >
      {prefix && (
        <span style={{ color: '#7B89B8', fontSize: 16, flexShrink: 0 }}>
          {prefix}
        </span>
      )}
      <input
        type={type}
        value={value}
        onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        disabled={disabled}
        autoFocus={autoFocus}
        onKeyDown={onKeyDown}
        style={{
          flex: 1,
          background: 'transparent',
          border: 'none',
          outline: 'none',
          color: '#F8FAFC',
          fontSize: 14,
          lineHeight: '20px',
          minHeight: 20,
          width: '100%',
        }}
      />
    </div>
  );
}

/* ---------- Textarea ---------- */
interface H5TextareaProps {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
  maxLength?: number;
  style?: CSSProperties;
}

export function H5Textarea({
  value,
  onChange,
  placeholder,
  rows = 3,
  maxLength,
  style,
}: H5TextareaProps) {
  return (
    <textarea
      value={value}
      onChange={(e: ChangeEvent<HTMLTextAreaElement>) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      maxLength={maxLength}
      style={{
        width: '100%',
        padding: '10px 14px',
        background: 'rgba(15, 27, 61, 0.50)',
        border: '1px solid rgba(148, 163, 184, 0.18)',
        borderRadius: 10,
        color: '#F8FAFC',
        fontSize: 14,
        outline: 'none',
        resize: 'none',
        boxSizing: 'border-box',
        lineHeight: 1.5,
        ...style,
      }}
    />
  );
}

/* ---------- Select ---------- */
interface H5SelectOption {
  label: string;
  value: string;
}

interface H5SelectProps {
  value: string;
  onChange: (v: string) => void;
  options: H5SelectOption[];
  style?: CSSProperties;
}

export function H5Select({ value, onChange, options, style }: H5SelectProps) {
  return (
    <select
      value={value}
      onChange={(e: ChangeEvent<HTMLSelectElement>) => onChange(e.target.value)}
      style={{
        width: '100%',
        padding: '10px 14px',
        background: 'rgba(15, 27, 61, 0.50)',
        border: '1px solid rgba(148, 163, 184, 0.18)',
        borderRadius: 10,
        color: '#F8FAFC',
        fontSize: 14,
        outline: 'none',
        cursor: 'pointer',
        ...style,
      }}
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}

/* ---------- SubmitButton ---------- */
interface H5SubmitButtonProps {
  children: ReactNode;
  onClick?: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'gold' | 'blue' | 'ghost';
  fullWidth?: boolean;
  style?: CSSProperties;
}

export function H5SubmitButton({
  children,
  onClick,
  loading,
  disabled,
  variant = 'gold',
  fullWidth = true,
  style,
}: H5SubmitButtonProps) {
  const variantStyle: Record<string, CSSProperties> = {
    gold: {
      background: 'linear-gradient(135deg, #F0B90B 0%, #FCD535 100%)',
      color: '#0F1B3D',
      boxShadow: '0 4px 16px rgba(240, 185, 11, 0.30)',
    },
    blue: {
      background: 'linear-gradient(135deg, #38BDF8 0%, #6366F1 100%)',
      color: '#0F1B3D',
      boxShadow: '0 4px 16px rgba(56, 189, 248, 0.30)',
    },
    ghost: {
      background: 'rgba(148, 163, 184, 0.10)',
      border: '1px solid rgba(148, 163, 184, 0.20)',
      color: '#F8FAFC',
      boxShadow: 'none',
    },
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      style={{
        width: fullWidth ? '100%' : 'auto',
        padding: '12px 24px',
        borderRadius: 12,
        border: 'none',
        fontSize: 15,
        fontWeight: 700,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.4 : 1,
        transition: 'opacity 0.2s',
        ...variantStyle[variant],
        ...style,
      }}
    >
      {loading ? '处理中...' : children}
    </button>
  );
}