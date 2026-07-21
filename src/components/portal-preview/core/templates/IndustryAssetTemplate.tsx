/**
 * IndustryAssetTemplate - 产业资产入口模板
 * 用途：福建老酒369 入口、未来产业资产入口
 * 设计系统：v6 纯黑无色相
 */

'use client';

import React, { useState, useEffect } from 'react';
import { BRAND, STATUS } from '../../brand';

export interface IndustryAssetEntry {
  key: string;
  title: string;
  description: string;
  href: string;
  status?: keyof typeof STATUS;
  badge?: string;
  features?: string[];
}

export interface IndustryAssetTemplateProps {
  title: string;
  description?: string;
  breadcrumbs?: { label: string; href: string }[];
  isMainAsset?: boolean;        // 是否主资产入口（福建老酒369 用）
  assetName?: string;            // 资产名
  assetTagline?: string;
  kpis?: { label: string; value: number; suffix?: string; decimals?: number }[];
  entries?: IndustryAssetEntry[];
  riskDisclosure?: string;
  complianceNote?: string;
  h5ReadyNote?: string;          // H5 入口说明（H5 已经做好）
  children?: React.ReactNode;
}

function useCountUp(target: number, duration = 1200) {
  const [v, setV] = useState(0);
  useEffect(() => {
    let frame: number;
    const start = performance.now();
    const tick = (ts: number) => {
      const t = Math.min((ts - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setV(target * eased);
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, duration]);
  return v;
}

export function IndustryAssetTemplate({
  title,
  description,
  breadcrumbs,
  isMainAsset = false,
  assetName,
  assetTagline,
  kpis = [],
  entries = [],
  riskDisclosure,
  complianceNote,
  h5ReadyNote,
  children,
}: IndustryAssetTemplateProps) {
  const [activeEntry, setActiveEntry] = useState<IndustryAssetEntry | null>(null);

  return (
    <div className="min-h-screen w-full" style={{ background: BRAND.bg, color: BRAND.text }}>
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

      {/* Hero */}
      <section
        className="px-6 md:px-12 py-16"
        style={{
          background: isMainAsset
            ? `linear-gradient(180deg, ${BRAND.bg} 0%, ${BRAND.bgCard} 50%, ${BRAND.bg} 100%)`
            : `linear-gradient(180deg, ${BRAND.bg} 0%, ${BRAND.bgCard} 100%)`,
          borderBottom: `1px solid ${BRAND.border}`,
        }}
      >
        <div className="max-w-6xl mx-auto">
          {isMainAsset && (
            <div
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs mb-6"
              style={{ background: BRAND.primaryLt, color: BRAND.primary }}
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: BRAND.primary }} />
              首批核心一级模块
            </div>
          )}
          {assetName && (
            <div className="text-lg mb-2" style={{ color: BRAND.textSub }}>{assetName}</div>
          )}
          <h1 className="text-4xl md:text-5xl font-semibold mb-4 tracking-tight" style={{ color: BRAND.text }}>
            {title}
          </h1>
          {assetTagline && (
            <p className="text-lg md:text-xl mb-3" style={{ color: BRAND.textSub }}>{assetTagline}</p>
          )}
          {description && (
            <p className="text-sm md:text-base max-w-2xl" style={{ color: BRAND.textMute }}>{description}</p>
          )}
        </div>
      </section>

      {/* KPI */}
      {kpis.length > 0 && (
        <section className="px-6 md:px-12 py-10">
          <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4">
            {kpis.map((kpi, i) => (
              <KpiCard key={kpi.label} {...kpi} index={i} />
            ))}
          </div>
        </section>
      )}

      {/* H5 已就绪提示（仅福建老酒369 主入口显示） */}
      {h5ReadyNote && (
        <section className="px-6 md:px-12 py-6">
          <div className="max-w-6xl mx-auto">
            <div
              className="rounded-lg p-5 flex items-start gap-4"
              style={{ background: BRAND.bgCard, border: `1px solid ${BRAND.primary}` }}
            >
              <div className="text-2xl flex-shrink-0" style={{ color: BRAND.primary }}>✓</div>
              <div>
                <div className="text-base font-medium mb-1" style={{ color: BRAND.text }}>移动端 H5 入口已就绪</div>
                <div className="text-sm" style={{ color: BRAND.textSub }}>{h5ReadyNote}</div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 子入口 */}
      {entries.length > 0 && (
        <section className="px-6 md:px-12 py-10">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl font-semibold mb-6" style={{ color: BRAND.text }}>子模块入口</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {entries.map((e, i) => (
                <div
                  key={e.key}
                  onClick={() => setActiveEntry(e)}
                  className="rounded-lg p-5 cursor-pointer transition-all hover:scale-[1.01]"
                  style={{
                    background: BRAND.bgCard,
                    border: `1px solid ${BRAND.border}`,
                    animation: `p4FadeUp 0.5s ease-out ${i * 60}ms both`,
                    minHeight: 160,
                  }}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="text-lg font-medium" style={{ color: BRAND.text }}>{e.title}</div>
                    {e.status && (
                      <div className="text-xs px-2 py-0.5 rounded" style={{ background: STATUS[e.status].bg, color: STATUS[e.status].color }}>
                        {STATUS[e.status].label}
                      </div>
                    )}
                    {e.badge && !e.status && (
                      <div className="text-xs px-2 py-0.5 rounded" style={{ background: BRAND.primaryLt, color: BRAND.primary }}>
                        {e.badge}
                      </div>
                    )}
                  </div>
                  <p className="text-sm mb-3" style={{ color: BRAND.textSub }}>{e.description}</p>
                  {e.features && e.features.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {e.features.slice(0, 3).map((f) => (
                        <span key={f} className="text-xs px-2 py-0.5 rounded" style={{ background: BRAND.cardElevated, color: BRAND.textMute }}>
                          {f}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {children && (
        <section className="px-6 md:px-12 py-6">
          <div className="max-w-6xl mx-auto">{children}</div>
        </section>
      )}

      {riskDisclosure && (
        <section className="px-6 md:px-12 py-8" style={{ background: BRAND.bgCard, borderTop: `1px solid ${BRAND.border}` }}>
          <div className="max-w-6xl mx-auto">
            <h3 className="text-base font-medium mb-3" style={{ color: BRAND.warning }}>风险披露</h3>
            <p className="text-sm" style={{ color: BRAND.textSub }}>{riskDisclosure}</p>
          </div>
        </section>
      )}

      {complianceNote && (
        <section className="px-6 md:px-12 py-4" style={{ background: BRAND.bgCard, borderTop: `1px solid ${BRAND.border}` }}>
          <div className="max-w-6xl mx-auto text-xs" style={{ color: BRAND.textSub }}>
            <span className="font-medium mr-2" style={{ color: BRAND.warning }}>合规提示：</span>
            {complianceNote}
          </div>
        </section>
      )}

      {activeEntry && (
        <div
          className="fixed inset-0 z-50 flex justify-end"
          style={{ background: BRAND.overlay }}
          onClick={() => setActiveEntry(null)}
        >
          <div
            className="w-full max-w-md h-full p-6 overflow-y-auto"
            style={{ background: BRAND.cardElevated, color: BRAND.text }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-2xl font-semibold" style={{ color: BRAND.text }}>{activeEntry.title}</h2>
              <button
                onClick={() => setActiveEntry(null)}
                className="px-3 py-1 rounded-md text-sm"
                style={{ background: BRAND.bgCard, color: BRAND.textSub }}
              >
                关闭
              </button>
            </div>
            <p className="text-sm mb-4" style={{ color: BRAND.textSub }}>{activeEntry.description}</p>
            {activeEntry.features && (
              <>
                <h3 className="text-sm font-medium mb-2" style={{ color: BRAND.textSub }}>核心能力</h3>
                <ul className="space-y-2 mb-6">
                  {activeEntry.features.map((f, i) => (
                    <li key={i} className="text-sm flex gap-2" style={{ color: BRAND.text }}>
                      <span style={{ color: BRAND.primary }}>·</span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </>
            )}
            <a
              href={activeEntry.href}
              className="block text-center px-5 py-2.5 rounded-md text-sm font-medium"
              style={{ background: BRAND.primaryContainer, color: BRAND.onPrimary }}
            >
              进入 {activeEntry.title}
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

function KpiCard({ label, value, suffix, decimals, index }: { label: string; value: number; suffix?: string; decimals?: number; index: number }) {
  const v = useCountUp(value);
  return (
    <div
      className="rounded-lg p-5"
      style={{ background: BRAND.bgCard, border: `1px solid ${BRAND.border}`, minHeight: 110, animation: `p4FadeUp 0.5s ease-out ${index * 60}ms both` }}
    >
      <div className="text-xs mb-2" style={{ color: BRAND.textSub }}>{label}</div>
      <div className="text-2xl font-semibold tabular-nums" style={{ color: BRAND.text }}>
        {decimals ? v.toFixed(decimals) : Math.floor(v).toLocaleString()}
        {suffix && <span className="text-sm ml-1" style={{ color: BRAND.textSub }}>{suffix}</span>}
      </div>
    </div>
  );
}

export default IndustryAssetTemplate;
