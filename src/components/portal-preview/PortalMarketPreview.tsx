'use client';

/**
 * PortalMarketPreview - 首页行情预览（2026-07-18）
 * 硬约束：不显示假价格、假涨跌幅、假成交额
 * 全部用 "数据接入中" 状态标签代替
 */

import React from 'react';
import { ArrowUpRight, BarChart3 } from 'lucide-react';
import { BRAND } from './brand';
import { PortalStatusBadge } from './PortalStatusBadge';

const ROWS = [
  { pair: 'BTC / USDT', name: 'Bitcoin', color: '#F7931A' },
  { pair: 'ETH / USDT', name: 'Ethereum', color: '#627EEA' },
  { pair: 'CFX / USDT', name: 'Conflux', color: '#1652F0' },
  { pair: 'SOL / USDT', name: 'Solana', color: '#14F195' },
  { pair: 'BNB / USDT', name: 'BNB', color: '#F3BA2F' },
];

export function PortalMarketPreview() {
  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}
    >
      {/* Header */}
      <div
        className="px-5 py-3 flex items-center justify-between"
        style={{ borderBottom: `1px solid ${BRAND.border}` }}
      >
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4" style={{ color: BRAND.primary }} />
          <span className="text-sm font-bold" style={{ color: BRAND.text }}>
            实时行情
          </span>
          <PortalStatusBadge status="COMING" size="sm" />
        </div>
        <a
          href="/portal-preview/discover"
          className="text-xs font-semibold inline-flex items-center gap-1 transition-colors"
          style={{ color: BRAND.primary }}
        >
          查看更多 <ArrowUpRight className="w-3 h-3" />
        </a>
      </div>

      {/* Column header */}
      <div
        className="grid grid-cols-12 gap-2 px-5 py-2 text-[10px] font-semibold uppercase tracking-wider"
        style={{ color: BRAND.textMute, backgroundColor: BRAND.bg }}
      >
        <div className="col-span-5">币种</div>
        <div className="col-span-4 text-right">最新价</div>
        <div className="col-span-3 text-right">24h 涨跌</div>
      </div>

      {/* Rows */}
      {ROWS.map((r, idx) => (
        <div
          key={r.pair}
          className="grid grid-cols-12 gap-2 px-5 py-3 items-center transition-colors"
          style={{
            borderTop: idx === 0 ? 'none' : `1px solid ${BRAND.borderLt}`,
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = BRAND.cardHover)}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
        >
          <div className="col-span-5 flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
              style={{ backgroundColor: `${r.color}22`, color: r.color }}
            >
              {r.pair.split(' ')[0][0]}
            </div>
            <div>
              <div className="text-sm font-bold" style={{ color: BRAND.text }}>
                {r.pair}
              </div>
              <div className="text-[10px]" style={{ color: BRAND.textMute }}>
                {r.name}
              </div>
            </div>
          </div>
          <div className="col-span-4 text-right text-sm font-mono font-semibold" style={{ color: BRAND.textSub }}>
            接入中
          </div>
          <div className="col-span-3 text-right text-sm font-mono font-semibold" style={{ color: BRAND.textMute }}>
            -- %
          </div>
        </div>
      ))}

      {/* Footer hint */}
      <div
        className="px-5 py-3 text-center text-[10px]"
        style={{ color: BRAND.textMute, backgroundColor: BRAND.bg, borderTop: `1px solid ${BRAND.border}` }}
      >
        行情数据由行情服务提供 · 当前为静态预览，所有数字仅作占位展示
      </div>
    </div>
  );
}

export default PortalMarketPreview;
