'use client';

import React, { useState, useCallback, forwardRef, useId } from 'react';
import { motion } from 'framer-motion';

/**
 * ZS Exchange Tabs 组件 V4
 * 严格遵循 V1.0 文档
 *
 * 激活指示色：#1677FF（电光蓝主品牌色）
 * 后台：白底 + 浅灰分隔，激活文字 #0F1830
 * 官网：深底 + 深灰分隔，激活文字 #F8FAFC
 */

interface Tab {
  id: string;
  label: React.ReactNode;
  icon?: React.ReactNode;
  disabled?: boolean;
}

type TabsTheme = 'web' | 'admin';

interface TabsProps {
  tabs: Tab[];
  defaultTabId?: string;
  onChange?: (tabId: string) => void;
  className?: string;
  tabClassName?: string;
  theme?: TabsTheme;
}

const Tabs = forwardRef<HTMLDivElement, TabsProps>(
  (
    { tabs, defaultTabId, onChange, className = '', tabClassName = '', theme = 'admin' },
    ref,
  ) => {
    const generatedId = useId();
    const [activeTab, setActiveTab] = useState(
      defaultTabId || (tabs.length > 0 ? tabs[0].id : ''),
    );

    const handleChange = useCallback(
      (tabId: string) => {
        setActiveTab(tabId);
        onChange?.(tabId);
      },
      [onChange],
    );

    // 主题色
    const borderColor = theme === 'web' ? '#1E293B' : '#E5E7EB';
    const activeText = theme === 'web' ? '#F8FAFC' : '#0F1830';
    const inactiveText = theme === 'web' ? '#94A3B8' : '#6B7280';
    const indicatorColor = '#1677FF';

    return (
      <div ref={ref} className={`w-full ${className}`}>
        {/* Tab Headers */}
        <div
          className="flex gap-1"
          style={{ borderBottom: `1px solid ${borderColor}` }}
          role="tablist"
        >
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                role="tab"
                aria-selected={isActive}
                disabled={tab.disabled}
                onClick={() => !tab.disabled && handleChange(tab.id)}
                className={`
                  relative flex items-center gap-2 px-4 py-2.5 text-sm font-medium
                  transition-colors duration-200 whitespace-nowrap cursor-pointer
                  ${tab.disabled ? 'opacity-40 cursor-not-allowed' : ''}
                  ${tabClassName}
                `}
                style={{
                  color: isActive ? activeText : inactiveText,
                  fontWeight: isActive ? 600 : 500,
                }}
                onMouseEnter={(e) => {
                  if (!isActive && !tab.disabled) {
                    e.currentTarget.style.color = activeText;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.color = inactiveText;
                  }
                }}
              >
                {tab.icon && <span className="shrink-0">{tab.icon}</span>}
                {tab.label}
                {isActive && (
                  <motion.div
                    layoutId={`${generatedId}-tab-indicator`}
                    className="absolute bottom-[-1px] left-0 right-0 h-0.5 rounded-full"
                    style={{ background: indicatorColor }}
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  },
);

Tabs.displayName = 'Tabs';

export default Tabs;
export type { TabsProps, Tab, TabsTheme };
