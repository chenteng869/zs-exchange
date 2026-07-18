'use client';

/**
 * PortalDiscoverSection - 发现中心（2026-07-18）
 * 资产来源：Stitch _24
 * 展示树图生态、项目首发、研究报告
 */

import React from 'react';
import { Compass, Network, FileText, Flame, Calendar, Tag, ArrowRight } from 'lucide-react';
import { BRAND } from './brand';
import { PortalStatusBadge } from './PortalStatusBadge';

const TABS = [
  { key: 'treegraph', label: '树图生态', icon: Network },
  { key: 'launchpad', label: '新币首发', icon: Flame },
  { key: 'research', label: '研报中心', icon: FileText },
  { key: 'calendar', label: '事件日历', icon: Calendar },
] as const;

const TREE_ITEMS = [
  { title: 'Conflux 树图公链', desc: '高性能国产公链，亚太地区领先的合规 Layer1。', tag: '公链' },
  { title: 'CFX 生态 DeFi', desc: '10+ 主流 DeFi 协议，TVL 持续增长。', tag: 'DeFi' },
  { title: 'CFX 钱包生态', desc: '官方钱包 + 第三方硬件钱包多重支持。', tag: '钱包' },
  { title: 'CFX Studio 开发者基金', desc: '千万美元扶持早期开发者。', tag: '基金' },
];

const RESEARCH = [
  { title: '2026 Q2 数字资产行业研究报告', date: '2026-06-30', pages: '示例页数' },
  { title: 'CFX 生态发展白皮书 v2.0', date: '2026-05-18', pages: '示例页数' },
  { title: 'RWA 赛道专题：从概念到落地', date: '2026-04-12', pages: '示例页数' },
];

export function PortalDiscoverSection() {
  return (
    <div className="space-y-6">
      {/* Tab bar */}
      <div
        className="flex flex-wrap items-center gap-2 p-1.5 rounded-xl"
        style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}
      >
        {TABS.map((t, idx) => {
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              className="flex items-center gap-1.5 px-4 h-9 rounded-lg text-xs font-semibold transition-colors"
              style={{
                backgroundColor: idx === 0 ? BRAND.card : 'transparent',
                color: idx === 0 ? BRAND.primary : BRAND.textSub,
                boxShadow: idx === 0 ? '0 1px 2px rgba(15,23,42,0.04)' : 'none',
              }}
            >
              <Icon className="w-3.5 h-3.5" /> {t.label}
            </button>
          );
        })}
      </div>

      {/* 树图生态卡 */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Compass className="w-4 h-4" style={{ color: BRAND.primary }} />
          <h3 className="text-sm font-bold" style={{ color: BRAND.text }}>
            树图生态项目
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {TREE_ITEMS.map((it) => (
            <a
              key={it.title}
              href="#"
              className="rounded-2xl p-5 transition-all hover:-translate-y-1"
              style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}
            >
              <div className="flex items-center gap-1.5 mb-2">
                <Tag className="w-3 h-3" style={{ color: BRAND.primary }} />
                <span
                  className="text-[10px] font-bold uppercase tracking-wider"
                  style={{ color: BRAND.primary }}
                >
                  {it.tag}
                </span>
              </div>
              <h4 className="text-sm font-bold mb-1.5" style={{ color: BRAND.text }}>
                {it.title}
              </h4>
              <p className="text-xs" style={{ color: BRAND.textSub }}>
                {it.desc}
              </p>
            </a>
          ))}
        </div>
      </div>

      {/* 研报中心 */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <FileText className="w-4 h-4" style={{ color: BRAND.primary }} />
          <h3 className="text-sm font-bold" style={{ color: BRAND.text }}>
            研报中心
          </h3>
          <PortalStatusBadge status="BETA" size="sm" showDot={false} />
        </div>
        <div
          className="rounded-2xl overflow-hidden"
          style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}
        >
          {RESEARCH.map((r, idx) => (
            <a
              key={r.title}
              href="#"
              className="px-5 py-3 flex items-center gap-3 transition-colors"
              style={{ borderTop: idx === 0 ? 'none' : `1px solid ${BRAND.borderLt}` }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = BRAND.cardHover)}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              <FileText className="w-4 h-4 flex-shrink-0" style={{ color: BRAND.primary }} />
              <span className="flex-1 text-sm font-medium" style={{ color: BRAND.text }}>
                {r.title}
              </span>
              <span className="text-[11px]" style={{ color: BRAND.textMute }}>
                {r.date}
              </span>
              <span className="text-[11px] font-mono" style={{ color: BRAND.textMute }}>
                {r.pages}
              </span>
              <ArrowRight className="w-3.5 h-3.5" style={{ color: BRAND.textMute }} />
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

export default PortalDiscoverSection;
