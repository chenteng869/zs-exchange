'use client';

/**
 * H5Tabs — 移动端滑动式 Tab 切换
 *
 * 支持水平滚动 + 下划线指示器
 * 适用于行情筛选、资产分类等场景
 */
import { CSSProperties, useRef, useEffect } from 'react';

export interface H5Tab {
  key: string;
  label: string;
  badge?: string | number;  // 角标数字
}

interface H5TabsProps {
  tabs: H5Tab[];
  activeKey: string;
  onChange: (key: string) => void;
  style?: CSSProperties;
  scrollable?: boolean;
}

export default function H5Tabs({
  tabs,
  activeKey,
  onChange,
  style,
  scrollable = true,
}: H5TabsProps) {
  const activeRef = useRef<HTMLButtonElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollable && activeRef.current && containerRef.current) {
      const container = containerRef.current;
      const active = activeRef.current;
      const offset = active.offsetLeft - container.offsetLeft - 16;
      container.scrollTo({ left: offset, behavior: 'smooth' });
    }
  }, [activeKey, scrollable]);

  return (
    <div
      ref={containerRef}
      style={{
        display: 'flex',
        gap: 4,
        overflowX: scrollable ? 'auto' : 'hidden',
        scrollbarWidth: 'none',
        paddingBottom: 2,
        ...style,
      }}
    >
      {tabs.map((tab) => {
        const active = tab.key === activeKey;
        return (
          <button
            key={tab.key}
            ref={active ? activeRef : undefined}
            onClick={() => onChange(tab.key)}
            style={{
              flex: scrollable ? '0 0 auto' : 1,
              padding: '8px 16px',
              borderRadius: 16,
              background: active
                ? 'linear-gradient(135deg, #F0B90B 0%, #FCD535 100%)'
                : 'rgba(148, 163, 184, 0.10)',
              color: active ? '#0F1B3D' : '#B4C0E0',
              border: 'none',
              fontSize: 13,
              fontWeight: active ? 700 : 500,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              position: 'relative',
              transition: 'all 0.15s',
            }}
          >
            {tab.label}
            {tab.badge !== undefined && (
              <span
                style={{
                  position: 'absolute',
                  top: -4,
                  right: -4,
                  minWidth: 16,
                  height: 16,
                  borderRadius: 8,
                  background: '#F472B6',
                  color: '#fff',
                  fontSize: 10,
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '0 4px',
                }}
              >
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}