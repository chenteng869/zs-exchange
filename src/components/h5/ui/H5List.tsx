'use client';

/**
 * H5List — 移动端统一列表组件
 *
 * 用于行情列表、资产列表、动态流等场景
 * 支持分隔线、箭头指示、点击态、左侧图标/头像
 */
import { ReactNode, CSSProperties } from 'react';

export interface H5ListItem {
  key: string;
  prefix?: ReactNode;      // 左侧图标 / 头像
  title: ReactNode;
  subtitle?: ReactNode;    // 次标题
  suffix?: ReactNode;      // 右侧内容（价格、金额等）
  arrow?: boolean;         // 显示右侧箭头 >
  onClick?: () => void;
}

interface H5ListProps {
  items: H5ListItem[];
  divided?: boolean;
  header?: ReactNode;
  style?: CSSProperties;
  itemStyle?: CSSProperties;
}

export default function H5List({
  items,
  divided = true,
  header,
  style,
  itemStyle,
}: H5ListProps) {
  return (
    <div
      style={{
        background:
          'linear-gradient(180deg, rgba(26, 36, 86, 0.55) 0%, rgba(21, 34, 74, 0.70) 100%)',
        border: '1px solid rgba(148, 163, 184, 0.18)',
        borderRadius: 12,
        overflow: 'hidden',
        ...style,
      }}
    >
      {header && (
        <div
          style={{
            padding: '10px 12px',
            fontSize: 11,
            color: '#7B89B8',
            borderBottom: '1px solid rgba(148, 163, 184, 0.10)',
          }}
        >
          {header}
        </div>
      )}

      {items.map((item, i) => (
        <div
          key={item.key}
          onClick={item.onClick}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '12px',
            cursor: item.onClick ? 'pointer' : 'default',
            borderBottom:
              divided && i < items.length - 1
                ? '1px solid rgba(148, 163, 184, 0.06)'
                : 'none',
            transition: 'background 0.15s',
            ...itemStyle,
          }}
        >
          {item.prefix && (
            <div style={{ flexShrink: 0 }}>{item.prefix}</div>
          )}

          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: 13,
                color: '#F8FAFC',
                fontWeight: 600,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {item.title}
            </div>
            {item.subtitle && (
              <div
                style={{
                  fontSize: 11,
                  color: '#7B89B8',
                  marginTop: 2,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {item.subtitle}
              </div>
            )}
          </div>

          <div style={{ flexShrink: 0, textAlign: 'right' }}>
            {item.suffix}
          </div>

          {item.arrow && (
            <span style={{ color: '#7B89B8', fontSize: 14, flexShrink: 0 }}>
              ›
            </span>
          )}
        </div>
      ))}
    </div>
  );
}