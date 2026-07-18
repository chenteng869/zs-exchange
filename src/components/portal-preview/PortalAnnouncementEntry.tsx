'use client';

/**
 * PortalAnnouncementEntry - 公告入口卡片（2026-07-18）
 * 首页 & 公告页通用入口卡
 */

import React from 'react';
import { Megaphone, ArrowRight, Pin, Calendar } from 'lucide-react';
import { BRAND } from './brand';
import { PortalStatusBadge } from './PortalStatusBadge';

const SAMPLE = [
  { id: 1, title: '合规治理与信息披露机制更新公告', date: '2026-07-12', pinned: true },
  { id: 2, title: '新版用户协议与隐私政策更新说明', date: '2026-07-08', pinned: true },
  { id: 3, title: '关于行情服务接入进度的官方说明', date: '2026-07-05', pinned: false },
  { id: 4, title: '中萨数字科技交易所 2026 年第二季度透明度报告', date: '2026-06-30', pinned: false },
];

export function PortalAnnouncementEntry({ showAll = false }: { showAll?: boolean }) {
  const items = showAll ? SAMPLE : SAMPLE.slice(0, 3);
  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}
    >
      <div
        className="px-5 py-3 flex items-center justify-between"
        style={{ borderBottom: `1px solid ${BRAND.border}` }}
      >
        <div className="flex items-center gap-2">
          <Megaphone className="w-4 h-4" style={{ color: BRAND.primary }} />
          <span className="text-sm font-bold" style={{ color: BRAND.text }}>
            平台公告
          </span>
        </div>
        {!showAll && (
          <a
            href="/portal-preview/announcements"
            className="text-xs font-semibold inline-flex items-center gap-1 transition-colors"
            style={{ color: BRAND.primary }}
          >
            查看全部 <ArrowRight className="w-3 h-3" />
          </a>
        )}
      </div>

      <ul>
        {items.map((it, idx) => (
          <li key={it.id}>
            <a
              href="#"
              className="px-5 py-3 flex items-center gap-3 transition-colors"
              style={{ borderTop: idx === 0 ? 'none' : `1px solid ${BRAND.borderLt}` }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = BRAND.cardHover)}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              {it.pinned && <Pin className="w-3.5 h-3.5 flex-shrink-0" style={{ color: BRAND.warning }} />}
              {!it.pinned && <div className="w-3.5 h-3.5 flex-shrink-0" />}
              <span
                className="flex-1 text-sm font-medium truncate"
                style={{ color: BRAND.text }}
              >
                {it.title}
              </span>
              <span
                className="text-[11px] flex items-center gap-1 flex-shrink-0"
                style={{ color: BRAND.textMute }}
              >
                <Calendar className="w-3 h-3" />
                {it.date}
              </span>
            </a>
          </li>
        ))}
      </ul>

      <div
        className="px-5 py-2.5 flex items-center justify-between text-[10px]"
        style={{ color: BRAND.textMute, backgroundColor: BRAND.bg, borderTop: `1px solid ${BRAND.border}` }}
      >
        <span>共 {SAMPLE.length} 条公告 · 静态展示</span>
        <PortalStatusBadge status="COMING" size="sm" showDot={false} />
      </div>
    </div>
  );
}

export default PortalAnnouncementEntry;
