'use client';

/**
 * PortalSection - 区块容器（统一 padding/最大宽度/标题模式）
 */

import React from 'react';
import { BRAND } from './brand';

interface PortalSectionProps {
  id?: string;
  eyebrow?: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  containerClassName?: string;
  background?: 'white' | 'bg' | 'card' | 'primaryLt';
  spacing?: 'md' | 'lg' | 'xl';
}

const bgMap = {
  white: '#FFFFFF',
  bg: BRAND.bg,
  card: BRAND.card,
  primaryLt: BRAND.primaryLt,
} as const;

const spacingMap = {
  md: 'py-12',
  lg: 'py-16',
  xl: 'py-24',
} as const;

export function PortalSection({
  id,
  eyebrow,
  title,
  description,
  action,
  children,
  className = '',
  containerClassName = '',
  background = 'white',
  spacing = 'lg',
}: PortalSectionProps) {
  return (
    <section
      id={id}
      className={`w-full ${spacingMap[spacing]} ${className}`}
      style={{ backgroundColor: bgMap[background] }}
    >
      <div className={`max-w-7xl mx-auto px-6 ${containerClassName}`}>
        {(title || eyebrow || description || action) && (
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-10">
            <div className="max-w-2xl">
              {eyebrow && (
                <div
                  className="text-xs font-bold uppercase tracking-widest mb-2"
                  style={{ color: BRAND.primary }}
                >
                  {eyebrow}
                </div>
              )}
              {title && (
                <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight" style={{ color: BRAND.text }}>
                  {title}
                </h2>
              )}
              {description && (
                <p className="text-sm md:text-base mt-3" style={{ color: BRAND.textSub }}>
                  {description}
                </p>
              )}
            </div>
            {action && <div className="flex-shrink-0">{action}</div>}
          </div>
        )}
        {children}
      </div>
    </section>
  );
}

export default PortalSection;
