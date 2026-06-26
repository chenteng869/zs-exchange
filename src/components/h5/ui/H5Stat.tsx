'use client';

/**
 * H5Stat — 移动端数据统计展示
 *
 * 用于资产总览、行情涨跌、收益展示等场景
 * 支持数字格式化、涨跌颜色、标签描述
 */
import { CSSProperties, ReactNode } from 'react';

interface H5StatProps {
  label: string;
  value: string | number;
  prefix?: string;       // $ / ¥ / + 等前缀
  suffix?: string;       // USDT / % 等后缀
  change?: string;       // 涨跌幅（如 +2.34%）
  changeUp?: boolean;    // 涨（绿色）/ 跌（粉色）
  size?: 'sm' | 'md' | 'lg';
  align?: 'left' | 'center' | 'right';
  style?: CSSProperties;
  children?: ReactNode;  // 额外内容（如进度条）
}

const sizeMap: Record<string, { label: number; value: number; suffix: number }> = {
  sm: { label: 10, value: 16, suffix: 11 },
  md: { label: 11, value: 22, suffix: 12 },
  lg: { label: 12, value: 30, suffix: 14 },
};

export default function H5Stat({
  label,
  value,
  prefix,
  suffix,
  change,
  changeUp,
  size = 'md',
  align = 'left',
  style,
  children,
}: H5StatProps) {
  const s = sizeMap[size];
  const numericValue = typeof value === 'string'
    ? parseFloat(value.replace(/[^0-9.-]/g, ''))
    : value;
  const formattedValue =
    typeof numericValue === 'number' && !isNaN(numericValue)
      ? numericValue.toLocaleString('en-US', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })
      : value;

  return (
    <div
      style={{
        textAlign: align,
        ...style,
      }}
    >
      <div style={{ fontSize: s.label, color: '#7B89B8', marginBottom: 2 }}>
        {label}
      </div>
      <div
        style={{
          fontSize: s.value,
          fontWeight: 800,
          color: '#F8FAFC',
          lineHeight: 1.2,
        }}
      >
        {prefix && (
          <span style={{ fontSize: s.value * 0.6, color: '#B4C0E0', marginRight: 2 }}>
            {prefix}
          </span>
        )}
        {formattedValue}
        {suffix && (
          <span style={{ fontSize: s.suffix, color: '#7B89B8', marginLeft: 4, fontWeight: 500 }}>
            {suffix}
          </span>
        )}
      </div>

      {change !== undefined && (
        <div
          style={{
            fontSize: s.suffix,
            fontWeight: 600,
            color: changeUp !== false ? '#34D399' : '#F472B6',
            marginTop: 2,
          }}
        >
          {change}
        </div>
      )}

      {children}
    </div>
  );
}