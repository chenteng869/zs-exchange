/**
 * HelpCenterTemplate - 帮助中心模板
 * 用途：FAQ、教程、帮助详情
 * 设计系统：v6 纯黑无色相
 */

'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { BRAND } from '../../brand';

export interface HelpArticle {
  id: string;
  category: string;
  title: string;
  summary: string;
  content: string;
  helpful: number;
}

export interface HelpCenterTemplateProps {
  title?: string;
  description?: string;
  breadcrumbs?: { label: string; href: string }[];
  categories?: string[];
  articles?: HelpArticle[];
  showSearch?: boolean;
  complianceNote?: string;
  children?: React.ReactNode;
}

export function HelpCenterTemplate({
  title = '帮助中心',
  description = '查找常见问题解答与使用教程',
  breadcrumbs,
  categories = [],
  articles = [],
  showSearch = true,
  complianceNote,
  children,
}: HelpCenterTemplateProps) {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [selected, setSelected] = useState<HelpArticle | null>(null);

  // 快捷键：/ 聚焦搜索，Esc 关闭详情
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        const el = document.getElementById('p4-help-search') as HTMLInputElement | null;
        el?.focus();
      } else if (e.key === 'Escape' && selected) {
        setSelected(null);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [selected]);

  const filtered = useMemo(() => {
    let list = articles;
    if (activeCategory !== 'all') {
      list = list.filter((a) => a.category === activeCategory);
    }
    if (search) {
      const s = search.toLowerCase();
      list = list.filter((a) => a.title.toLowerCase().includes(s) || a.summary.toLowerCase().includes(s) || a.content.toLowerCase().includes(s));
    }
    return list;
  }, [articles, activeCategory, search]);

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
          <p className="text-base max-w-2xl" style={{ color: BRAND.textSub }}>{description}</p>
          {showSearch && (
            <div className="mt-6 relative max-w-xl">
              <input
                id="p4-help-search"
                type="text"
                placeholder="搜索问题（按 / 聚焦，Esc 关闭）"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full px-4 py-2.5 rounded-md text-sm outline-none"
                style={{ background: BRAND.bgCard, color: BRAND.text, border: `1px solid ${BRAND.border}` }}
              />
            </div>
          )}
        </div>
      </section>

      {/* 分类 Tab */}
      {categories.length > 0 && (
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
            {categories.map((c) => (
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
                {c}
              </button>
            ))}
          </div>
        </section>
      )}

      {/* 文章列表 */}
      <section className="px-6 md:px-12 py-6">
        <div className="max-w-6xl mx-auto">
          {filtered.length === 0 ? (
            <div className="rounded-lg p-12 text-center" style={{ background: BRAND.bgCard, border: `1px solid ${BRAND.border}` }}>
              <div className="text-sm" style={{ color: BRAND.textMute }}>未找到相关文章</div>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((a, i) => (
                <div
                  key={a.id}
                  onClick={() => setSelected(a)}
                  className="rounded-lg p-5 cursor-pointer transition-colors"
                  style={{
                    background: BRAND.bgCard,
                    border: `1px solid ${BRAND.border}`,
                    animation: `p4FadeUp 0.5s ease-out ${i * 40}ms both`,
                  }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-base font-medium mb-1" style={{ color: BRAND.text }}>{a.title}</div>
                      <div className="text-sm" style={{ color: BRAND.textSub }}>{a.summary}</div>
                    </div>
                    <div
                      className="text-xs px-2 py-0.5 rounded flex-shrink-0"
                      style={{ background: BRAND.cardElevated, color: BRAND.textMute }}
                    >
                      {a.category}
                    </div>
                  </div>
                </div>
              ))}
            </div>
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

      {/* 详情 Drawer */}
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
                <div className="text-xs mb-1" style={{ color: BRAND.textMute }}>{selected.category}</div>
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
            <div className="mt-8 text-xs" style={{ color: BRAND.textMute }}>
              {selected.helpful} 人觉得有帮助
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default HelpCenterTemplate;
