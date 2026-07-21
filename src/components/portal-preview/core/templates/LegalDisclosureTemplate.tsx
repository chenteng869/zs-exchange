/**
 * LegalDisclosureTemplate - 法律条款 / 风险披露模板
 * 用途：用户协议、隐私政策、风险披露、免责声明
 * 设计系统：v6 纯黑无色相
 */

'use client';

import React, { useState, useEffect } from 'react';
import { BRAND } from '../../brand';

export interface LegalSection {
  id: string;
  title: string;
  paragraphs: string[];
}

export interface BreadcrumbItem {
  label: string;
  href: string;
}

export interface LegalDisclosureTemplateProps {
  title: string;
  lastUpdated?: string;
  effectiveDate?: string;
  sections: LegalSection[];
  complianceNote?: string;
  version?: string;
  breadcrumbs?: BreadcrumbItem[];
  children?: React.ReactNode;
}

export function LegalDisclosureTemplate({
  title,
  lastUpdated,
  effectiveDate,
  sections,
  complianceNote,
  version,
  breadcrumbs,
  children,
}: LegalDisclosureTemplateProps) {
  const [activeId, setActiveId] = useState(sections[0]?.id || '');

  // 滚动联动目录
  useEffect(() => {
    const handler = () => {
      const ids = sections.map((s) => s.id);
      const offset = 100;
      for (const id of ids) {
        const el = document.getElementById(`legal-${id}`);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= offset && rect.bottom > offset) {
            setActiveId(id);
            break;
          }
        }
      }
    };
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, [sections]);

  const scrollTo = (id: string) => {
    const el = document.getElementById(`legal-${id}`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="min-h-screen w-full" style={{ background: BRAND.bg, color: BRAND.text }}>
      {/* Breadcrumbs */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav
          className="px-6 md:px-12 py-3 text-xs flex flex-wrap items-center gap-1"
          style={{ background: BRAND.bg, borderBottom: `1px solid ${BRAND.border}`, color: BRAND.textMute }}
          aria-label="Breadcrumb"
        >
          {breadcrumbs.map((item, idx) => (
            <span key={item.href + idx} className="flex items-center gap-1">
              {idx > 0 && <span aria-hidden="true">/</span>}
              {idx < breadcrumbs.length - 1 ? (
                <a href={item.href} style={{ color: BRAND.textSub }} className="hover:underline">
                  {item.label}
                </a>
              ) : (
                <span style={{ color: BRAND.text }}>{item.label}</span>
              )}
            </span>
          ))}
        </nav>
      )}

      {/* Hero */}
      <section className="px-6 md:px-12 py-12" style={{ background: `linear-gradient(180deg, ${BRAND.bg} 0%, ${BRAND.bgCard} 100%)`, borderBottom: `1px solid ${BRAND.border}` }}>
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-semibold mb-3" style={{ color: BRAND.text }}>{title}</h1>
          <div className="flex flex-wrap gap-4 text-sm" style={{ color: BRAND.textSub }}>
            {version && <span>版本：{version}</span>}
            {effectiveDate && <span>生效日期：{effectiveDate}</span>}
            {lastUpdated && <span>最后更新：{lastUpdated}</span>}
          </div>
        </div>
      </section>

      {/* 双栏：左侧目录 + 右侧内容 */}
      <section className="px-6 md:px-12 py-10">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-[240px_1fr] gap-8">
          {/* 目录 */}
          <aside
            className="hidden md:block sticky top-6 self-start rounded-lg p-4"
            style={{ background: BRAND.bgCard, border: `1px solid ${BRAND.border}`, maxHeight: 'calc(100vh - 80px)', overflowY: 'auto' }}
          >
            <div className="text-xs font-medium mb-3" style={{ color: BRAND.textMute }}>目录</div>
            <ol className="space-y-1">
              {sections.map((s, i) => (
                <li key={s.id}>
                  <button
                    onClick={() => scrollTo(s.id)}
                    className="w-full text-left text-sm px-2 py-1.5 rounded transition-colors"
                    style={{
                      background: activeId === s.id ? BRAND.primaryLt : 'transparent',
                      color: activeId === s.id ? BRAND.primary : BRAND.textSub,
                    }}
                  >
                    {i + 1}. {s.title}
                  </button>
                </li>
              ))}
            </ol>
          </aside>

          {/* 内容 */}
          <article>
            {sections.map((s) => (
              <div
                key={s.id}
                id={`legal-${s.id}`}
                className="mb-10 scroll-mt-20"
              >
                <h2 className="text-2xl font-semibold mb-4" style={{ color: BRAND.text }}>{s.title}</h2>
                <div className="space-y-3">
                  {s.paragraphs.map((p, i) => (
                    <p key={i} className="text-sm leading-7" style={{ color: BRAND.textSub }}>
                      {p}
                    </p>
                  ))}
                </div>
              </div>
            ))}
          </article>
        </div>
      </section>

      {children && (
        <section className="px-6 md:px-12 py-6">
          <div className="max-w-6xl mx-auto">{children}</div>
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
    </div>
  );
}

export default LegalDisclosureTemplate;
