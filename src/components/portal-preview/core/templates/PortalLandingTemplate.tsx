/**
 * PortalLandingTemplate - 落地页 / 品牌页模板
 * 用途：首页、品牌故事、生态、机构入口等
 * 设计系统：v6 纯黑无色相（BRAND.bg / BRAND.bgCard）
 */

'use client';

import React, { useEffect, useState, useRef } from 'react';
import { BRAND, STATUS } from '../../brand';

export interface PortalLandingTemplateProps {
  title: string;
  description?: string;
  breadcrumbs?: { label: string; href: string }[];
  heroTagline?: string;
  heroSubline?: string;
  heroPrimaryCta?: { label: string; href: string };
  heroSecondaryCta?: { label: string; href: string };
  kpis?: { label: string; value: number; suffix?: string; decimals?: number; tone?: 'up' | 'down' | 'flat' }[];
  featureSections?: { title: string; description: string; icon?: string }[];
  complianceNote?: string;
  status?: keyof typeof STATUS;
  children?: React.ReactNode;
}

/**
 * CountUp 数字滚动 hook（v6 强化版，requestAnimationFrame 缓动）
 */
function useCountUp(target: number, duration = 1200, enabled = true) {
  const [value, setValue] = useState(0);
  const startRef = useRef<number | null>(null);
  useEffect(() => {
    if (!enabled) return;
    let frame: number;
    const tick = (ts: number) => {
      if (startRef.current === null) startRef.current = ts;
      const elapsed = ts - startRef.current;
      const t = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3); // easeOutCubic
      setValue(target * eased);
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, duration, enabled]);
  return value;
}

/**
 * Stagger 入场动画 wrapper
 */
function StaggerItem({ children, index, className = '' }: { children: React.ReactNode; index: number; className?: string }) {
  return (
    <div
      className={className}
      style={{
        animation: `p4StaggerIn 0.6s ease-out ${index * 60}ms both`,
      }}
    >
      {children}
      <style jsx>{`
        @keyframes p4StaggerIn {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

function KpiCard({ label, value, suffix, decimals, tone }: PortalLandingTemplateProps['kpis'][number] & { index: number }) {
  const animated = useCountUp(value);
  const display = decimals ? animated.toFixed(decimals) : Math.floor(animated).toLocaleString();
  const toneColor = tone === 'up' ? BRAND.success : tone === 'down' ? BRAND.danger : BRAND.text;
  return (
    <div
      className="rounded-lg p-5"
      style={{
        background: BRAND.bgCard,
        border: `1px solid ${BRAND.border}`,
        minHeight: 110,
      }}
    >
      <div className="text-xs mb-2" style={{ color: BRAND.textSub }}>
        {label}
      </div>
      <div className="text-2xl font-semibold tracking-tight" style={{ color: toneColor }}>
        {display}
        {suffix && <span className="text-sm ml-1" style={{ color: BRAND.textSub }}>{suffix}</span>}
      </div>
    </div>
  );
}

export function PortalLandingTemplate({
  title,
  description,
  breadcrumbs,
  heroTagline,
  heroSubline,
  heroPrimaryCta,
  heroSecondaryCta,
  kpis = [],
  featureSections = [],
  complianceNote,
  status,
  children,
}: PortalLandingTemplateProps) {
  return (
    <div
      className="min-h-screen w-full"
      style={{ background: BRAND.bg, color: BRAND.text }}
    >
      {/* 1. 面包屑 */}
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

      {/* 2. Hero 区块 */}
      <section
        className="px-6 md:px-12 py-12 md:py-20"
        style={{
          background: `linear-gradient(180deg, ${BRAND.bg} 0%, ${BRAND.bgCard} 100%)`,
          borderBottom: `1px solid ${BRAND.border}`,
        }}
      >
        <div className="max-w-6xl mx-auto">
          {status && (
            <div
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs mb-6"
              style={{ background: STATUS[status].bg, color: STATUS[status].color }}
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: STATUS[status].dot }} />
              {STATUS[status].label}
            </div>
          )}
          <h1 className="text-3xl md:text-5xl font-semibold mb-4 tracking-tight" style={{ color: BRAND.text }}>
            {title}
          </h1>
          {heroTagline && (
            <p className="text-lg md:text-xl mb-3" style={{ color: BRAND.textSub }}>
              {heroTagline}
            </p>
          )}
          {heroSubline && (
            <p className="text-sm md:text-base max-w-2xl" style={{ color: BRAND.textMute }}>
              {heroSubline}
            </p>
          )}
          {description && (
            <p className="text-sm mt-4 max-w-2xl" style={{ color: BRAND.textMute }}>
              {description}
            </p>
          )}
          {(heroPrimaryCta || heroSecondaryCta) && (
            <div className="mt-8 flex flex-wrap gap-3">
              {heroPrimaryCta && (
                <a
                  href={heroPrimaryCta.href}
                  className="px-5 py-2.5 rounded-md text-sm font-medium transition-opacity hover:opacity-90"
                  style={{ background: BRAND.primaryContainer, color: BRAND.onPrimary }}
                >
                  {heroPrimaryCta.label}
                </a>
              )}
              {heroSecondaryCta && (
                <a
                  href={heroSecondaryCta.href}
                  className="px-5 py-2.5 rounded-md text-sm font-medium transition-colors"
                  style={{ background: 'transparent', color: BRAND.text, border: `1px solid ${BRAND.borderStrong}` }}
                >
                  {heroSecondaryCta.label}
                </a>
              )}
            </div>
          )}
        </div>
      </section>

      {/* 3. KPI 区块 */}
      {kpis.length > 0 && (
        <section className="px-6 md:px-12 py-10">
          <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4">
            {kpis.map((kpi, i) => (
              <StaggerItem key={kpi.label} index={i}>
                <KpiCard {...kpi} index={i} />
              </StaggerItem>
            ))}
          </div>
        </section>
      )}

      {/* 4. 特性区块 */}
      {featureSections.length > 0 && (
        <section className="px-6 md:px-12 py-10">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl font-semibold mb-8" style={{ color: BRAND.text }}>
              核心能力
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {featureSections.map((f, i) => (
                <StaggerItem key={f.title} index={i}>
                  <div
                    className="rounded-lg p-6 transition-colors"
                    style={{ background: BRAND.bgCard, border: `1px solid ${BRAND.border}`, minHeight: 160 }}
                  >
                    <div className="text-3xl mb-3" style={{ color: BRAND.primary }}>
                      {f.icon || '◆'}
                    </div>
                    <div className="text-base font-medium mb-2" style={{ color: BRAND.text }}>
                      {f.title}
                    </div>
                    <div className="text-sm" style={{ color: BRAND.textSub }}>
                      {f.description}
                    </div>
                  </div>
                </StaggerItem>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 5. 自定义 children 区块 */}
      {children && (
        <section className="px-6 md:px-12 py-10">
          <div className="max-w-6xl mx-auto">{children}</div>
        </section>
      )}

      {/* 6. 合规提示 */}
      {complianceNote && (
        <section
          className="px-6 md:px-12 py-6"
          style={{ background: BRAND.bgCard, borderTop: `1px solid ${BRAND.border}` }}
        >
          <div className="max-w-6xl mx-auto text-xs" style={{ color: BRAND.textSub }}>
            <span className="font-medium mr-2" style={{ color: BRAND.warning }}>合规提示：</span>
            {complianceNote}
          </div>
        </section>
      )}
    </div>
  );
}

export default PortalLandingTemplate;
