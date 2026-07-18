'use client';

/**
 * PortalEmptyState - 空状态组件（2026-07-18）
 *
 * 5 种状态：
 *   - 数据接入中（带 loading 动画）
 *   - 暂无数据
 *   - 即将开放
 *   - 维护中
 *   - 登录后查看（带 CTA）
 */

import React from 'react';
import { Inbox, Wrench, Lock, Clock, Loader2 } from 'lucide-react';
import { BRAND, type StatusKey } from './brand';
import PortalStatusBadge from './PortalStatusBadge';

interface PortalEmptyStateProps {
  status: StatusKey;
  title?: string;
  description?: string;
  ctaLabel?: string;
  onCtaClick?: () => void;
  className?: string;
}

const meta: Record<StatusKey, { icon: React.ElementType; defaultTitle: string; defaultDesc: string }> = {
  OPEN: { icon: Inbox, defaultTitle: '暂无内容', defaultDesc: '当前模块运行中，暂无内容展示。' },
  BETA: { icon: Clock, defaultTitle: '内测中', defaultDesc: '该功能正在内测中，敬请期待。' },
  SOON: { icon: Clock, defaultTitle: '即将开放', defaultDesc: '该功能即将上线，目前为预览占位。' },
  MAINTENANCE: { icon: Wrench, defaultTitle: '维护中', defaultDesc: '系统维护中，预计 2 小时内恢复。' },
  COMING: { icon: Loader2, defaultTitle: '数据接入中', defaultDesc: '正在对接上游数据源，预计 24-48 小时内完成接入。' },
  EMPTY: { icon: Inbox, defaultTitle: '暂无数据', defaultDesc: '当前未发现可展示的内容。' },
  PRIVATE: { icon: Lock, defaultTitle: '登录后查看', defaultDesc: '该内容需要登录后才能查看完整信息。' },
};

export function PortalEmptyState({
  status,
  title,
  description,
  ctaLabel,
  onCtaClick,
  className = '',
}: PortalEmptyStateProps) {
  const m = meta[status];
  const Icon = m.icon;
  const isLoading = status === 'COMING' || status === 'BETA';
  return (
    <div
      className={`flex flex-col items-center justify-center text-center py-12 px-6 rounded-2xl ${className}`}
      style={{
        backgroundColor: BRAND.card,
        border: `1px dashed ${BRAND.border}`,
      }}
    >
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
        style={{ backgroundColor: BRAND.bgAlt, color: BRAND.textMute }}
      >
        <Icon
          className={`w-8 h-8 ${isLoading ? 'animate-spin' : ''}`}
          style={{ animationDuration: isLoading ? '3s' : undefined }}
        />
      </div>
      <h3 className="text-lg font-semibold mb-2" style={{ color: BRAND.text }}>
        {title ?? m.defaultTitle}
      </h3>
      <p className="text-sm max-w-md mb-4" style={{ color: BRAND.textSub }}>
        {description ?? m.defaultDesc}
      </p>
      <PortalStatusBadge status={status} size="sm" />
      {ctaLabel && onCtaClick && (
        <button
          onClick={onCtaClick}
          className="mt-4 px-5 py-2 rounded-lg text-sm font-semibold transition-all active:scale-95"
          style={{ backgroundColor: BRAND.primary, color: '#fff' }}
        >
          {ctaLabel}
        </button>
      )}
    </div>
  );
}

export default PortalEmptyState;
