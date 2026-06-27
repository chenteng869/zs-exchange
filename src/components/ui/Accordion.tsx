﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿'use client';

import React, { useState, forwardRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * ZS Exchange Accordion 组件 V4
 * 严格遵循 V1.0 文档
 *
 * 后台：白底 + #E5E7EB 分割，hover 蓝
 * 官网：深底 + #1E293B 分割，hover 蓝
 * 标题色：#0F1830 (后台) / #F8FAFC (官网)
 * 描述色：#6B7280 (后台) / #94A3B8 (官网)
 * 图标色：#1677FF（电光蓝）
 */

interface AccordionItemProps {
  title: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
  className?: string;
  icon?: React.ReactNode;
}

type AccordionTheme = 'web' | 'admin';

const AccordionItem: React.FC<AccordionItemProps & { theme?: AccordionTheme }> = ({
  title,
  children,
  defaultOpen = false,
  className = '',
  icon,
  theme = 'admin',
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [hovered, setHovered] = useState(false);

  // V1.0 主题色
  const borderColor = theme === 'web' ? '#1E293B' : '#E5E7EB';
  const titleColor = theme === 'web' ? '#F8FAFC' : '#0F1830';
  const titleHover = '#1677FF';
  const descColor = theme === 'web' ? '#94A3B8' : '#6B7280';
  const iconColor = theme === 'web' ? '#94A3B8' : '#6B7280';
  const accentColor = '#1677FF';

  return (
    <div
      className={className}
      style={{ borderBottom: `1px solid ${borderColor}` }}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="
          w-full flex items-center justify-between gap-3 py-4 px-1
          text-left text-base cursor-pointer
        "
        style={{
          color: hovered ? titleHover : titleColor,
          fontWeight: 500,
          background: 'transparent',
          border: 'none',
          padding: '16px 4px',
          width: '100%',
          textAlign: 'left',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          transition: 'color 0.2s ease',
        }}
        aria-expanded={isOpen}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {icon && (
            <span
              className="shrink-0"
              style={{ color: accentColor, display: 'inline-flex' }}
            >
              {icon}
            </span>
          )}
          {title}
        </span>
        <motion.svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="shrink-0"
          style={{ color: iconColor }}
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
        >
          <polyline points="6 9 12 15 18 9" />
        </motion.svg>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden"
          >
            <div
              className="pb-4 px-1 text-sm leading-relaxed"
              style={{ color: descColor }}
            >
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

interface AccordionProps {
  children: React.ReactNode;
  className?: string;
  theme?: AccordionTheme;
}

const Accordion = forwardRef<HTMLDivElement, AccordionProps>(
  ({ children, className = '', theme = 'admin' }, ref) => {
    return (
      <div ref={ref} className={className}>
        {React.Children.map(children, (child) => {
          if (React.isValidElement(child)) {
            return React.cloneElement(
              child as React.ReactElement<AccordionItemProps & { theme: AccordionTheme }>,
              { theme },
            );
          }
          return child;
        })}
      </div>
    );
  },
);

Accordion.displayName = 'Accordion';

export { AccordionItem };
export default Accordion;
export type { AccordionProps, AccordionItemProps, AccordionTheme };
