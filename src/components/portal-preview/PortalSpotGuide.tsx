'use client';

/**
 * PortalSpotGuide - 现货交易教学（2026-07-18）
 * 资产来源：Stitch _17
 * 硬约束：只做教学说明，不进入真实交易
 */

import React from 'react';
import { BookOpen, ArrowRight, TrendingUp, Wallet, ShoppingCart, CheckCircle2, Info } from 'lucide-react';
import { BRAND } from './brand';
import { PortalStatusBadge } from './PortalStatusBadge';

const STEPS = [
  {
    icon: Wallet,
    title: '充值资产',
    desc: '前往「资产」页面，将 USDT 或其他主流币充值至现货账户。',
    tips: ['支持链：Ethereum / BSC / Polygon / Conflux', '最小充值额度视币种而定'],
  },
  {
    icon: ShoppingCart,
    title: '选择交易对',
    desc: '在「行情」或「交易」页面选择想要买入/卖出的币对。',
    tips: ['建议先熟悉 BTC/USDT、ETH/USDT 等主流对', '关注 24H 成交量与价格波动'],
  },
  {
    icon: TrendingUp,
    title: '下单',
    desc: '选择限价单 / 市价单 / 止损单等订单类型，填写价格与数量。',
    tips: ['限价单：指定价格挂单', '市价单：按当前最优价格立即成交', '止损单：用于风控'],
  },
  {
    icon: CheckCircle2,
    title: '查询与提现',
    desc: '在「订单」/「成交」中查看历史，在「资产」中发起提现。',
    tips: ['提现前请确认已开启 MFA', '链上确认时间因链而异（通常 1-30 分钟）'],
  },
];

const CONCEPTS = [
  { k: '限价单 (Limit)', v: '按指定价格挂单，未成交前可撤销。' },
  { k: '市价单 (Market)', v: '按当前市场最优价格立即成交。' },
  { k: 'Maker / Taker', v: '挂单方为 Maker，吃单方为 Taker，费率不同。' },
  { k: '最小成交单位', v: '不同交易对的最小下单数量不同。' },
  { k: '成交优先级', v: '价格优先 → 时间优先 → VIP 等级优先。' },
];

export function PortalSpotGuide() {
  return (
    <div className="space-y-8">
      {/* 4 步流程 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {STEPS.map((s, idx) => {
          const Icon = s.icon;
          return (
            <div
              key={s.title}
              className="rounded-2xl p-5"
              style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}
            >
              <div className="flex items-center justify-between mb-3">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: BRAND.primaryLt, color: BRAND.primary }}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <span
                  className="text-[10px] font-mono font-bold"
                  style={{ color: BRAND.textMute }}
                >
                  STEP {idx + 1}
                </span>
              </div>
              <h3 className="text-sm font-bold mb-1.5" style={{ color: BRAND.text }}>
                {s.title}
              </h3>
              <p className="text-xs mb-2" style={{ color: BRAND.textSub }}>
                {s.desc}
              </p>
              <ul className="space-y-1">
                {s.tips.map((t) => (
                  <li
                    key={t}
                    className="text-[10px] flex items-start gap-1"
                    style={{ color: BRAND.textMute }}
                  >
                    <span style={{ color: BRAND.primary }}>·</span> {t}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>

      {/* 关键概念 */}
      <div>
        <h3 className="text-base font-bold mb-3" style={{ color: BRAND.text }}>
          关键概念速查
        </h3>
        <div
          className="rounded-2xl overflow-hidden"
          style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}
        >
          {CONCEPTS.map((c, idx) => (
            <div
              key={c.k}
              className="grid grid-cols-12 gap-3 px-5 py-3 text-xs"
              style={{ borderTop: idx === 0 ? 'none' : `1px solid ${BRAND.borderLt}` }}
            >
              <div className="col-span-4 font-bold" style={{ color: BRAND.primary }}>
                {c.k}
              </div>
              <div className="col-span-8" style={{ color: BRAND.textSub }}>
                {c.v}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 教学提示 */}
      <div
        className="rounded-2xl p-5 flex items-start gap-3"
        style={{ backgroundColor: BRAND.infoLt, border: `1px solid ${BRAND.info}22` }}
      >
        <Info className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: BRAND.info }} />
        <div className="text-xs" style={{ color: BRAND.text }}>
          <strong>教学说明：</strong>本页仅为现货交易教学与说明，不会进入真实交易。
          实际交易请前往<strong> 个人中心 → 现货交易 </strong>。
          <PortalStatusBadge status="PRIVATE" size="sm" showDot={false} className="ml-2" />
        </div>
      </div>
    </div>
  );
}

export default PortalSpotGuide;
