'use client';

/**
 * PortalFeeSection - 费率说明区（2026-07-18）
 * 资产来源：Stitch _9 费率说明
 */

import React from 'react';
import { Check, HelpCircle } from 'lucide-react';
import { BRAND } from './brand';
import { PortalStatusBadge } from './PortalStatusBadge';

const TIERS = [
  {
    name: '普通用户',
    tag: 'BETA' as const,
    spotMaker: '0.10%',
    spotTaker: '0.10%',
    contractMaker: '0.02%',
    contractTaker: '0.05%',
    benefits: ['示例：每日提现额度', '标准撮合优先级', '基础 API 调用'],
  },
  {
    name: 'VIP 1',
    tag: 'SOON' as const,
    spotMaker: '0.09%',
    spotTaker: '0.09%',
    contractMaker: '0.015%',
    contractTaker: '0.04%',
    benefits: ['每日 200 BTC 等值提现额度', '提高撮合优先级', 'API 频率 10/秒'],
    highlighted: true,
  },
  {
    name: 'VIP 2',
    tag: 'SOON' as const,
    spotMaker: '0.08%',
    spotTaker: '0.08%',
    contractMaker: '0.01%',
    contractTaker: '0.03%',
    benefits: ['示例：机构级提现额度', '撮合优先队列', 'API 频率更高', '专属客户经理'],
  },
  {
    name: '机构做市商',
    tag: 'BETA' as const,
    spotMaker: '低至 -0.005%',
    spotTaker: '0.04%',
    contractMaker: '-0.01%',
    contractTaker: '0.025%',
    benefits: ['协商提现额度', '顶级撮合通道', 'API 频率更高', 'OTC 通道', '1v1 技术对接'],
  },
];

export function PortalFeeSection() {
  return (
    <div className="space-y-6">
      {/* Highlights */}
      <div
        className="rounded-2xl p-6"
        style={{ backgroundColor: BRAND.primaryLt, border: `1px solid ${BRAND.primary}22` }}
      >
        <h3 className="text-base font-bold mb-3" style={{ color: BRAND.primary }}>
          费率优势
        </h3>
        <ul className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm" style={{ color: BRAND.text }}>
          {[
            '使用平台币抵扣手续费，可再享 25% 折扣',
            'VIP 用户可申请 maker 返佣，长期挂单赚手续费',
            '机构做市商可协商负 maker 费率，欢迎联系商务',
          ].map((t) => (
            <li key={t} className="flex items-start gap-2">
              <Check className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: BRAND.primary }} />
              <span>{t}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Tier table */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {TIERS.map((t) => (
          <div
            key={t.name}
            className="rounded-2xl p-5 flex flex-col"
            style={{
              backgroundColor: BRAND.card,
              border: t.highlighted ? `2px solid ${BRAND.primary}` : `1px solid ${BRAND.border}`,
              boxShadow: t.highlighted ? `0 8px 24px ${BRAND.primary}22` : 'none',
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-base font-bold" style={{ color: BRAND.text }}>
                {t.name}
              </h4>
              <PortalStatusBadge status={t.tag} size="sm" />
            </div>
            <div className="space-y-2 mb-4">
              <FeeRow label="现货 Maker（示例）" value={t.spotMaker} />
              <FeeRow label="现货 Taker（示例）" value={t.spotTaker} />
              <FeeRow label="合约 Maker（示例）" value={t.contractMaker} />
              <FeeRow label="合约 Taker（示例）" value={t.contractTaker} />
            </div>
            <ul className="space-y-1.5 mt-auto">
              {t.benefits.map((b) => (
                <li key={b} className="flex items-start gap-1.5 text-[11px]" style={{ color: BRAND.textSub }}>
                  <Check className="w-3 h-3 flex-shrink-0 mt-0.5" style={{ color: BRAND.success }} />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <p
        className="flex items-center gap-1.5 text-xs"
        style={{ color: BRAND.textMute }}
      >
        <HelpCircle className="w-3.5 h-3.5" />
        费率以最终下单页为准 · 平台保留根据市场情况调整费率的权力
      </p>
    </div>
  );
}

function FeeRow({ label, value }: { label: string; value: string }) {
  return (
    <div
      className="flex items-center justify-between text-xs py-1.5"
      style={{ borderBottom: `1px dashed ${BRAND.border}` }}
    >
      <span style={{ color: BRAND.textSub }}>{label}</span>
      <span className="font-mono font-semibold" style={{ color: BRAND.text }}>
        {value}
      </span>
    </div>
  );
}

export default PortalFeeSection;
