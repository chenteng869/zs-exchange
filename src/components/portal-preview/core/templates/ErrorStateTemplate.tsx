/**
 * ErrorStateTemplate - 错误 / 状态页模板
 * 用途：404、访问受限、维护中、即将开放、Coming Soon
 * 设计系统：v6 纯黑无色相
 */

'use client';

import React, { useEffect, useState } from 'react';
import { BRAND, STATUS } from '../../brand';

export type ErrorStateType = '404' | '403' | 'maintenance' | 'coming-soon' | 'empty' | 'restricted';

export interface ErrorStateTemplateProps {
  type: ErrorStateType;
  title?: string;
  description?: string;
  breadcrumbs?: { label: string; href: string }[];
  primaryAction?: { label: string; href: string };
  secondaryAction?: { label: string; href: string };
  children?: React.ReactNode;
}

const TYPE_CONFIG: Record<ErrorStateType, { code: string; defaultTitle: string; defaultDescription: string; status?: keyof typeof STATUS }> = {
  '404': { code: '404', defaultTitle: '页面未找到', defaultDescription: '您访问的页面不存在或已被移动' },
  '403': { code: '403', defaultTitle: '访问受限', defaultDescription: '您没有权限访问此页面' },
  'maintenance': { code: '503', defaultTitle: '系统维护中', defaultDescription: '系统正在维护，请稍后再试', status: 'MAINTENANCE' },
  'coming-soon': { code: '...', defaultTitle: '即将开放', defaultDescription: '该功能正在筹备中，敬请期待', status: 'SOON' },
  'empty': { code: '∅', defaultTitle: '暂无数据', defaultDescription: '当前页面暂无内容', status: 'EMPTY' },
  'restricted': { code: '!', defaultTitle: '区域受限', defaultDescription: '根据当地法律法规，本服务在您所在地区受限' },
};

export function ErrorStateTemplate({
  type,
  title,
  description,
  breadcrumbs,
  primaryAction,
  secondaryAction,
  children,
}: ErrorStateTemplateProps) {
  const config = TYPE_CONFIG[type];
  const [countdown, setCountdown] = useState(0);
  const finalTitle = title || config.defaultTitle;
  const finalDesc = description || config.defaultDescription;

  // 维护中：实时倒计时（示例 2 小时）
  useEffect(() => {
    if (type !== 'maintenance') return;
    setCountdown(7200);
    const id = setInterval(() => {
      setCountdown((c) => (c > 0 ? c - 1 : 0));
    }, 1000);
    return () => clearInterval(id);
  }, [type]);

  const formatCountdown = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen w-full flex flex-col" style={{ background: BRAND.bg, color: BRAND.text }}>
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="px-6 pt-6 text-sm" style={{ color: BRAND.textSub }}>
          {breadcrumbs.map((c, i) => (
            <span key={c.href}>
              {i > 0 && <span className="mx-2" style={{ color: BRAND.textMute }}>/</span>}
              <a href={c.href} className="hover:underline">{c.label}</a>
            </span>
          ))}
        </nav>
      )}

      <div className="flex-1 flex items-center justify-center px-6 py-20">
        <div className="text-center max-w-md">
          {config.status && (
            <div
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs mb-6"
              style={{ background: STATUS[config.status].bg, color: STATUS[config.status].color }}
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: STATUS[config.status].dot }} />
              {STATUS[config.status].label}
            </div>
          )}
          <div
            className="text-7xl md:text-8xl font-bold mb-4 tabular-nums"
            style={{ color: BRAND.textSub, animation: 'p4Pulse 2s ease-in-out infinite' }}
          >
            {config.code}
          </div>
          <h1 className="text-2xl md:text-3xl font-semibold mb-3" style={{ color: BRAND.text }}>
            {finalTitle}
          </h1>
          <p className="text-base mb-6" style={{ color: BRAND.textSub }}>{finalDesc}</p>

          {type === 'maintenance' && countdown > 0 && (
            <div className="mb-6 inline-block px-4 py-2 rounded-md" style={{ background: BRAND.bgCard, border: `1px solid ${BRAND.border}` }}>
              <div className="text-xs mb-1" style={{ color: BRAND.textMute }}>预计恢复</div>
              <div className="text-2xl font-mono tabular-nums" style={{ color: BRAND.primary }}>
                {formatCountdown(countdown)}
              </div>
            </div>
          )}

          {(primaryAction || secondaryAction) && (
            <div className="flex flex-wrap gap-3 justify-center">
              {primaryAction && (
                <a
                  href={primaryAction.href}
                  className="px-5 py-2.5 rounded-md text-sm font-medium"
                  style={{ background: BRAND.primaryContainer, color: BRAND.onPrimary }}
                >
                  {primaryAction.label}
                </a>
              )}
              {secondaryAction && (
                <a
                  href={secondaryAction.href}
                  className="px-5 py-2.5 rounded-md text-sm font-medium"
                  style={{ background: 'transparent', color: BRAND.text, border: `1px solid ${BRAND.borderStrong}` }}
                >
                  {secondaryAction.label}
                </a>
              )}
            </div>
          )}

          {children && <div className="mt-6">{children}</div>}
        </div>
      </div>

      <style jsx>{`
        @keyframes p4Pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}

export default ErrorStateTemplate;
