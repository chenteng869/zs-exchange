'use client';

/**
 * PortalProductMatrix - 产品矩阵（2026-07-18）
 * 资产来源：Stitch _1 Feature Matrix
 */

import React from 'react';
import { TrendingUp, Repeat, Wallet, Layers, Coins, PieChart, ArrowUpRight } from 'lucide-react';
import { BRAND, type StatusKey } from './brand';
import { PortalStatusBadge } from './PortalStatusBadge';

const ITEMS: Array<{
  icon: React.ElementType;
  title: string;
  desc: string;
  status: StatusKey;
}> = [
  { icon: TrendingUp, title: '现货交易', desc: '主流币种深度撮合', status: 'SOON' },
  { icon: Repeat, title: '永续合约', desc: '支持杠杆交易（最高杠杆以实际页面为准）', status: 'SOON' },
  { icon: Wallet, title: '资产管理', desc: '多账户统一视图', status: 'BETA' },
  { icon: Layers, title: '树图专区', desc: 'CFX 生态项目首发', status: 'BETA' },
  { icon: Coins, title: 'DeFi 收益', desc: '活期 / 定期理财', status: 'SOON' },
  { icon: PieChart, title: '机构服务', desc: 'OTC / API / 做市', status: 'BETA' },
];

export function PortalProductMatrix() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {ITEMS.map((it) => {
        const Icon = it.icon;
        return (
          <a
            key={it.title}
            href="#"
            className="group rounded-2xl p-5 transition-all hover:-translate-y-1"
            style={{
              backgroundColor: BRAND.card,
              border: `1px solid ${BRAND.border}`,
              boxShadow: '0 1px 2px rgba(15,23,42,0.04)',
            }}
          >
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center mb-3 transition-transform group-hover:scale-110"
              style={{ backgroundColor: BRAND.primaryLt, color: BRAND.primary }}
            >
              <Icon className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold mb-1" style={{ color: BRAND.text }}>
              {it.title}
            </h3>
            <p className="text-[11px] mb-3" style={{ color: BRAND.textSub }}>
              {it.desc}
            </p>
            <PortalStatusBadge status={it.status} size="sm" showDot={false} />
          </a>
        );
      })}
    </div>
  );
}

export default PortalProductMatrix;
