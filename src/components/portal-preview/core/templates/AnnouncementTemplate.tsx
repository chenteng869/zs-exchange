/**
 * AnnouncementTemplate - 公告与规则模板
 * 用途：公告列表、公告详情
 * 设计系统：v6 纯黑无色相
 */

'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { BRAND } from '../../brand';

export interface Announcement {
  id: string;
  title: string;
  category: 'latest' | 'listings' | 'maintenance' | 'rules' | 'risk';
  date: string;
  summary: string;
  content: string;
  pinned?: boolean;
}

export interface AnnouncementTemplateProps {
  title?: string;
  breadcrumbs?: { label: string; href: string }[];
  announcements?: Announcement[];
  complianceNote?: string;
  children?: React.ReactNode;
}

const CATEGORY_LABELS: Record<Announcement['category'], string> = {
  latest: '最新',
  listings: '上新',
  maintenance: '维护',
  rules: '规则',
  risk: '风险',
};

export function AnnouncementTemplate({
  title = '公告中心',
  breadcrumbs,
  announcements = [],
  complianceNote,
  children,
}: AnnouncementTemplateProps) {
  const [activeCategory, setActiveCategory] = useState<Announcement['category'] | 'all'>('all');
  const [selected, setSelected] = useState<Announcement | null>(null);

  // Esc 关闭
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selected) setSelected(null);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [selected]);

  const filtered = useMemo(() => {
    if (activeCategory === 'all') return announcements;
    return announcements.filter((a) => a.category === activeCategory);
  }, [announcements, activeCategory]);

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

      <section className="px-6 md:px-12 py-12" style={{ background: `linear-gradient(180deg, ${BRAND.bg} 0%, ${BRAND.bgCard} 100%)`, borderBottom: `1px solid ${BRAND.border}` }}>
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-semibold mb-3" style={{ color: BRAND.text }}>{title}</h1>
          <p className="text-base" style={{ color: BRAND.textSub }}>查看最新公告、上新公告、维护公告、规则与风险提示</p>
        </div>
      </section>

      <section className="px-6 md:px-12 py-6">
        <div className="max-w-6xl mx-auto flex flex-wrap gap-1">
          <button
            onClick={() => setActiveCategory('all')}
            className="px-4 py-2 rounded-md text-sm"
            style={{
              background: activeCategory === 'all' ? BRAND.bgCard : 'transparent',
              color: activeCategory === 'all' ? BRAND.text : BRAND.textSub,
              border: `1px solid ${activeCategory === 'all' ? BRAND.borderStrong : 'transparent'}`,
            }}
          >
            全部
          </button>
          {(Object.keys(CATEGORY_LABELS) as Announcement['category'][]).map((c) => (
            <button
              key={c}
              onClick={() => setActiveCategory(c)}
              className="px-4 py-2 rounded-md text-sm"
              style={{
                background: activeCategory === c ? BRAND.bgCard : 'transparent',
                color: activeCategory === c ? BRAND.text : BRAND.textSub,
                border: `1px solid ${activeCategory === c ? BRAND.borderStrong : 'transparent'}`,
              }}
            >
              {CATEGORY_LABELS[c]}
            </button>
          ))}
        </div>
      </section>

      <section className="px-6 md:px-12 py-6">
        <div className="max-w-6xl mx-auto space-y-2">
          {filtered.length === 0 ? (
            <div className="rounded-lg p-12 text-center" style={{ background: BRAND.bgCard, border: `1px solid ${BRAND.border}` }}>
              <div className="text-sm" style={{ color: BRAND.textMute }}>暂无公告</div>
            </div>
          ) : (
            filtered.map((a, i) => (
              <div
                key={a.id}
                onClick={() => setSelected(a)}
                className="rounded-lg p-4 cursor-pointer transition-colors"
                style={{
                  background: BRAND.bgCard,
                  border: `1px solid ${BRAND.border}`,
                  animation: `p4FadeUp 0.4s ease-out ${i * 30}ms both`,
                }}
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2 flex-1">
                    {a.pinned && (
                      <span className="text-xs px-2 py-0.5 rounded" style={{ background: BRAND.warning, color: '#000' }}>置顶</span>
                    )}
                    <span className="text-base font-medium" style={{ color: BRAND.text }}>{a.title}</span>
                  </div>
                  <span className="text-xs flex-shrink-0" style={{ color: BRAND.textMute }}>{a.date}</span>
                </div>
                <div className="text-sm" style={{ color: BRAND.textSub }}>{a.summary}</div>
                <div className="mt-2">
                  <span className="text-xs px-2 py-0.5 rounded" style={{ background: BRAND.cardElevated, color: BRAND.textMute }}>
                    {CATEGORY_LABELS[a.category]}
                  </span>
                </div>
              </div>
            ))
          )}
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

      {selected && (
        <div
          className="fixed inset-0 z-50 flex justify-end"
          style={{ background: BRAND.overlay }}
          onClick={() => setSelected(null)}
        >
          <div
            className="w-full max-w-2xl h-full p-6 overflow-y-auto"
            style={{ background: BRAND.cardElevated, color: BRAND.text }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <div className="text-xs mb-1" style={{ color: BRAND.textMute }}>{CATEGORY_LABELS[selected.category]} · {selected.date}</div>
                <h2 className="text-2xl font-semibold" style={{ color: BRAND.text }}>{selected.title}</h2>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="px-3 py-1 rounded-md text-sm"
                style={{ background: BRAND.bgCard, color: BRAND.textSub }}
              >
                关闭 (Esc)
              </button>
            </div>
            <p className="text-sm mb-4" style={{ color: BRAND.textSub }}>{selected.summary}</p>
            <div className="text-sm whitespace-pre-wrap" style={{ color: BRAND.text, lineHeight: 1.8 }}>
              {selected.content}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AnnouncementTemplate;
