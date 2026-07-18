'use client';

/**
 * PortalStatusBadge - 标准化状态标签（2026-07-18）
 *
 * 5 大状态：
 *   - 正常运行 OPEN
 *   - 内测中 BETA
 *   - 即将开放 SOON
 *   - 维护中 MAINTENANCE
 *   - 数据接入中 COMING
 *   - 暂无数据 EMPTY
 *   - 登录后查看 PRIVATE
 *
 * 满足 P1 硬约束："所有未接入业务统一使用状态标签"
 */

import React from 'react';
import { BRAND, STATUS, type StatusKey } from './brand';

interface PortalStatusBadgeProps {
  status: StatusKey;
  size?: 'sm' | 'md' | 'lg';
  showDot?: boolean;
  className?: string;
}

const sizeClasses: Record<NonNullable<PortalStatusBadgeProps['size']>, string> = {
  sm: 'text-[10px] px-2 py-0.5',
  md: 'text-xs px-2.5 py-1',
  lg: 'text-sm px-3 py-1.5',
};

export function PortalStatusBadge({
  status,
  size = 'md',
  showDot = true,
  className = '',
}: PortalStatusBadgeProps) {
  const s = STATUS[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-medium ${sizeClasses[size]} ${className}`}
      style={{
        color: s.color,
        backgroundColor: s.bg,
        border: `1px solid ${s.color}22`,
      }}
    >
      {showDot && (
        <span
          className="w-1.5 h-1.5 rounded-full animate-pulse"
          style={{ backgroundColor: s.dot }}
        />
      )}
      {s.label}
    </span>
  );
}

export default PortalStatusBadge;
