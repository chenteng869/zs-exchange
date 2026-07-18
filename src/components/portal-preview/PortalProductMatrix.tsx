'use client';

/**
 * PortalProductMatrix - 产品矩阵（2026-07-19 P3.1 增强版）
 * 资产来源：Stitch _1 Feature Matrix
 * 增强：增加业务能力维度、行业标签、能力详情
 */

import React from 'react';
import { TrendingUp, Repeat, Wallet, Layers, Coins, PieChart, ArrowUpRight } from 'lucide-react';
import { BRAND, type StatusKey } from './brand';
import { PortalStatusBadge } from './PortalStatusBadge';

interface ProductItem {
  icon: React.ElementType;
  title: string;
  desc: string;
  capabilities: string[];
  status: StatusKey;
  audience: '个人' | '机构' | '全用户';
}

const ITEMS: ProductItem[] = [
  {
    icon: TrendingUp,
    title: '现货交易',
    desc: '主流币种深度撮合',
    capabilities: ['限价 / 市价 / 止损单', '0.01% 起 Maker 费率', '移动端 / Web / API'],
    status: 'SOON',
    audience: '全用户',
  },
  {
    icon: Repeat,
    title: '永续合约',
    desc: '支持杠杆交易（最高杠杆以实际页面为准）',
    capabilities: ['最高 125x 杠杆', '全仓 / 逐仓模式', '资金费率每 8h 结算'],
    status: 'SOON',
    audience: '个人',
  },
  {
    icon: Wallet,
    title: '资产管理',
    desc: '多账户统一视图',
    capabilities: ['现货 / 合约 / 理财统一账户', '多币种资产看板', '资产划转 / 提现一站式'],
    status: 'BETA',
    audience: '全用户',
  },
  {
    icon: Layers,
    title: '树图专区',
    desc: 'CFX 生态项目首发',
    capabilities: ['CFX / 生态代币专区', '新项目首发申购', 'Conflux 跨链资产支持'],
    status: 'BETA',
    audience: '全用户',
  },
  {
    icon: Coins,
    title: 'DeFi 收益',
    desc: '活期 / 定期理财',
    capabilities: ['活期 / 定期 / 结构化', 'USDT / USDC 稳定币理财', '每日计息 / 自动复投'],
    status: 'SOON',
    audience: '全用户',
  },
  {
    icon: PieChart,
    title: '机构服务',
    desc: 'OTC / API / 做市',
    capabilities: ['大宗 OTC 询价', 'FIX / REST / WebSocket API', '做市商 / 量化机构接入'],
    status: 'BETA',
    audience: '机构',
  },
];

const AUDIENCE_BG: Record<ProductItem['audience'], string> = {
  个人: 'rgba(68, 219, 244, 0.10)',
  机构: 'rgba(20, 184, 129, 0.10)',
  全用户: 'rgba(176, 176, 176, 0.08)',
};

const AUDIENCE_COLOR: Record<ProductItem['audience'], string> = {
  个人: BRAND.info,
  机构: BRAND.primary,
  全用户: BRAND.textSub,
};

export function PortalProductMatrix() {
  return (
    <div className="space-y-6">
      {/* 业务能力统计行 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: '产品线', value: '6' },
          { label: '能力维度', value: '18+' },
          { label: '目标用户', value: '个人 / 机构' },
          { label: '开放状态', value: 'BETA / SOON' },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-xl px-4 py-3"
            style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}
          >
            <div className="text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: BRAND.textMute }}>
              {s.label}
            </div>
            <div className="text-sm font-bold" style={{ color: BRAND.text }}>
              {s.value}
            </div>
          </div>
        ))}
      </div>

      {/* 产品矩阵主网格 */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {ITEMS.map((it) => {
          const Icon = it.icon;
          return (
            <a
              key={it.title}
              href="#"
              className="group rounded-2xl p-5 transition-all hover:-translate-y-1 relative"
              style={{
                backgroundColor: BRAND.card,
                border: `1px solid ${BRAND.border}`,
                boxShadow: BRAND.shadow,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = `${BRAND.primary}55`;
                e.currentTarget.style.boxShadow = `0 8px 24px rgba(20, 184, 129, 0.12)`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = BRAND.border;
                e.currentTarget.style.boxShadow = BRAND.shadow;
              }}
            >
              <div className="flex items-center justify-between mb-3">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110"
                  style={{ backgroundColor: BRAND.primaryLt, color: BRAND.primary }}
                >
                  <Icon className="w-6 h-6" />
                </div>
                <PortalStatusBadge status={it.status} size="sm" showDot={false} />
              </div>
              <h3 className="text-sm font-bold mb-1" style={{ color: BRAND.text }}>
                {it.title}
              </h3>
              <p className="text-[11px] mb-3 leading-relaxed" style={{ color: BRAND.textSub }}>
                {it.desc}
              </p>

              {/* 能力列表 */}
              <ul className="space-y-1 mb-3">
                {it.capabilities.map((cap) => (
                  <li
                    key={cap}
                    className="text-[10px] flex items-start gap-1"
                    style={{ color: BRAND.textMute }}
                  >
                    <span style={{ color: BRAND.primary }}>·</span>
                    <span>{cap}</span>
                  </li>
                ))}
              </ul>

              <div className="flex items-center justify-between pt-2" style={{ borderTop: `1px solid ${BRAND.borderLt}` }}>
                <span
                  className="text-[10px] font-semibold px-1.5 py-0.5 rounded"
                  style={{
                    backgroundColor: AUDIENCE_BG[it.audience],
                    color: AUDIENCE_COLOR[it.audience],
                  }}
                >
                  {it.audience}
                </span>
                <ArrowUpRight
                  className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                  style={{ color: BRAND.textMute }}
                />
              </div>
            </a>
          );
        })}
      </div>
    </div>
  );
}

export default PortalProductMatrix;
