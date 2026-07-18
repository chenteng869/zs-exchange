'use client';

/**
 * PortalAnnouncementList - 公告中心完整列表（2026-07-18）
 * 资产来源：Stitch _8
 * 硬约束：只做静态入口，不接真实 API
 */

import React, { useState } from 'react';
import { Megaphone, Search, Pin, Calendar, Tag } from 'lucide-react';
import { BRAND } from './brand';
import { PortalStatusBadge } from './PortalStatusBadge';

const ALL = [
  { id: 1, cat: 'platform', title: '关于萨摩亚金融业监管牌照 DSAEX-2024-001 续期公告', date: '2026-07-12', pinned: true },
  { id: 2, cat: 'platform', title: '新版用户协议与隐私政策更新说明', date: '2026-07-08', pinned: true },
  { id: 3, cat: 'market', title: '关于行情服务接入进度的官方说明', date: '2026-07-05', pinned: false },
  { id: 4, cat: 'report', title: '中萨数字科技交易所 2026 年第二季度透明度报告', date: '2026-06-30', pinned: false },
  { id: 5, cat: 'platform', title: '关于风控模型升级的预告', date: '2026-06-25', pinned: false },
  { id: 6, cat: 'market', title: '新增 CFX/USDT、ETH/USDT 永续合约说明', date: '2026-06-20', pinned: false },
  { id: 7, cat: 'platform', title: '关于客服系统切换的公告', date: '2026-06-15', pinned: false },
  { id: 8, cat: 'report', title: '2026 Q1 链上储备金审计报告', date: '2026-04-02', pinned: false },
  { id: 9, cat: 'market', title: '关于下线部分小币种交易对的说明', date: '2026-03-28', pinned: false },
  { id: 10, cat: 'platform', title: '关于双重验证（MFA）强制开启的公告', date: '2026-03-15', pinned: false },
];

const CAT = [
  { key: 'all', label: '全部' },
  { key: 'platform', label: '平台公告' },
  { key: 'market', label: '业务通知' },
  { key: 'report', label: '透明报告' },
];

const catMap: Record<string, { label: string; color: string; bg: string }> = {
  platform: { label: '平台公告', color: BRAND.primary, bg: BRAND.primaryLt },
  market: { label: '业务通知', color: BRAND.warning, bg: BRAND.warningLt },
  report: { label: '透明报告', color: BRAND.info, bg: BRAND.infoLt },
};

export function PortalAnnouncementList() {
  const [active, setActive] = useState('all');
  const [keyword, setKeyword] = useState('');

  const filtered = ALL.filter((it) => {
    if (active !== 'all' && it.cat !== active) return false;
    if (keyword && !it.title.includes(keyword)) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* 过滤栏 */}
      <div
        className="rounded-2xl p-4 flex flex-col md:flex-row items-stretch md:items-center gap-3"
        style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}
      >
        <div
          className="flex items-center gap-2 px-3 h-10 rounded-lg flex-1 max-w-md"
          style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}
        >
          <Search className="w-4 h-4" style={{ color: BRAND.textMute }} />
          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="搜索公告标题…"
            className="flex-1 outline-none bg-transparent text-sm"
            style={{ color: BRAND.text }}
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {CAT.map((c) => (
            <button
              key={c.key}
              onClick={() => setActive(c.key)}
              className="px-3 h-9 rounded-lg text-xs font-semibold transition-colors"
              style={{
                backgroundColor: active === c.key ? BRAND.primary : BRAND.bg,
                color: active === c.key ? '#fff' : BRAND.textSub,
                border: `1px solid ${active === c.key ? BRAND.primary : BRAND.border}`,
              }}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* 列表 */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}
      >
        {filtered.length === 0 ? (
          <div className="p-12 text-center">
            <Megaphone className="w-10 h-10 mx-auto mb-3" style={{ color: BRAND.textMute }} />
            <div className="text-sm" style={{ color: BRAND.textSub }}>
              暂无匹配公告
            </div>
          </div>
        ) : (
          filtered.map((it, idx) => {
            const c = catMap[it.cat];
            return (
              <a
                key={it.id}
                href="#"
                className="block px-5 py-4 transition-colors"
                style={{ borderTop: idx === 0 ? 'none' : `1px solid ${BRAND.borderLt}` }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = BRAND.cardHover)}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <div className="flex items-start gap-3">
                  {it.pinned ? (
                    <Pin className="w-4 h-4 flex-shrink-0 mt-1" style={{ color: BRAND.warning }} />
                  ) : (
                    <div className="w-4 h-4 flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold mb-2" style={{ color: BRAND.text }}>
                      {it.title}
                    </h3>
                    <div className="flex items-center gap-3 text-[10px]" style={{ color: BRAND.textMute }}>
                      <span
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded font-semibold"
                        style={{ backgroundColor: c.bg, color: c.color }}
                      >
                        <Tag className="w-2.5 h-2.5" /> {c.label}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> {it.date}
                      </span>
                    </div>
                  </div>
                </div>
              </a>
            );
          })
        )}
      </div>

      <div className="text-center text-[10px]" style={{ color: BRAND.textMute }}>
        公告中心为静态展示 · 真实公告数据接入中
        <PortalStatusBadge status="COMING" size="sm" showDot={false} className="ml-2" />
      </div>
    </div>
  );
}

export default PortalAnnouncementList;
