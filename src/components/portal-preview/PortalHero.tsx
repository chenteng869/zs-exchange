'use client';

/**
 * PortalHero - 首页 Hero 区（2026-07-18）
 * 资产来源：Stitch _1 Hero Section（亮色改造）
 */

import React from 'react';
import { ArrowRight, PlayCircle, Sparkles, TrendingUp, ShieldCheck } from 'lucide-react';
import { BRAND } from './brand';
import { PortalStatusBadge } from './PortalStatusBadge';

export function PortalHero() {
  return (
    <section
      className="relative w-full overflow-hidden"
      style={{
        background: `linear-gradient(180deg, ${BRAND.bg} 0%, #ffffff 100%)`,
        borderBottom: `1px solid ${BRAND.border}`,
      }}
    >
      {/* 背景装饰：右上角光晕 */}
      <div
        className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full opacity-30 pointer-events-none"
        style={{ background: `radial-gradient(circle, ${BRAND.primary}33 0%, transparent 70%)` }}
      />
      <div
        className="absolute -bottom-40 -left-40 w-[400px] h-[400px] rounded-full opacity-20 pointer-events-none"
        style={{ background: `radial-gradient(circle, ${BRAND.purple}33 0%, transparent 70%)` }}
      />

      <div className="max-w-7xl mx-auto px-6 pt-20 pb-24 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* 左侧文案 */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2">
              <PortalStatusBadge status="OPEN" size="md" />
              <PortalStatusBadge status="BETA" size="md" />
              <PortalStatusBadge status="COMING" size="md" />
            </div>
            <h1
              className="text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight tracking-tight"
              style={{ color: BRAND.text }}
            >
              面向全球的<br />
              <span style={{ color: BRAND.primary }}>专业级</span>
              数字资产<br />
              基础设施
            </h1>
            <p
              className="text-base md:text-lg max-w-xl leading-relaxed"
              style={{ color: BRAND.textSub }}
            >
              基于树图 Conflux 生态打造，结合 AI 智算与分布式安全协议，
              为全球交易者提供亚毫秒级撮合、终端级风控与全链上透明储备证明。
            </p>

            <div className="flex flex-wrap gap-3 pt-2">
              <a
                href="/auth/register"
                className="inline-flex items-center gap-2 px-6 h-12 rounded-xl text-sm font-bold transition-all active:scale-95"
                style={{ backgroundColor: BRAND.primary, color: '#fff', boxShadow: `0 8px 20px ${BRAND.primary}33` }}
              >
                立即注册 <ArrowRight className="w-4 h-4" />
              </a>
              <a
                href="/portal-preview/spot-guide"
                className="inline-flex items-center gap-2 px-6 h-12 rounded-xl text-sm font-bold transition-colors"
                style={{ backgroundColor: BRAND.card, color: BRAND.text, border: `1px solid ${BRAND.border}` }}
              >
                <PlayCircle className="w-4 h-4" style={{ color: BRAND.primary }} /> 观看教程
              </a>
            </div>

            {/* 信任要素行 */}
            <div className="grid grid-cols-3 gap-3 pt-6 max-w-xl">
              {[
                { icon: ShieldCheck, label: '萨摩亚持牌', value: 'DSAEX-2024-001' },
                { icon: TrendingUp, label: '24h 成交额', value: '数据接入中', isStatus: true },
                { icon: Sparkles, label: '币种数量', value: '数据接入中', isStatus: true },
              ].map((it) => {
                const Icon = it.icon;
                return (
                  <div
                    key={it.label}
                    className="rounded-xl px-3 py-3"
                    style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}
                  >
                    <div className="flex items-center gap-1.5 mb-1.5" style={{ color: BRAND.primary }}>
                      <Icon className="w-3.5 h-3.5" />
                      <span className="text-[10px] font-semibold uppercase tracking-wider">{it.label}</span>
                    </div>
                    {it.isStatus ? (
                      <span className="text-xs font-medium" style={{ color: BRAND.textMute }}>
                        {it.value}
                      </span>
                    ) : (
                      <div className="text-xs font-bold" style={{ color: BRAND.text }}>
                        {it.value}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* 右侧示例数据卡（占位 + 状态） */}
          <div className="lg:col-span-5">
            <div
              className="rounded-3xl p-6 space-y-4"
              style={{
                backgroundColor: BRAND.card,
                border: `1px solid ${BRAND.border}`,
                boxShadow: '0 24px 48px -12px rgba(15,23,42,0.08)',
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm"
                    style={{ backgroundColor: BRAND.warningLt, color: BRAND.warning }}
                  >
                    ₿
                  </div>
                  <div>
                    <div className="text-sm font-bold" style={{ color: BRAND.text }}>
                      BTC / USDT
                    </div>
                    <div className="text-[10px]" style={{ color: BRAND.textMute }}>
                      Bitcoin · 现货
                    </div>
                  </div>
                </div>
                <PortalStatusBadge status="COMING" size="sm" />
              </div>

              {/* 占位 K 线 */}
              <div
                className="h-32 rounded-xl flex items-end gap-1 px-3 pb-3"
                style={{ backgroundColor: BRAND.bg }}
              >
                {[40, 60, 55, 80, 65, 95, 40, 70, 88, 50, 75, 90, 60, 82, 70].map((h, i) => (
                  <div
                    key={i}
                    className="flex-1 rounded-t"
                    style={{
                      height: `${h}%`,
                      background: i % 2 === 0 ? BRAND.primary : BRAND.success,
                      opacity: 0.4 + (h / 200),
                    }}
                  />
                ))}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg p-3" style={{ backgroundColor: BRAND.bg }}>
                  <div className="text-[10px] font-semibold mb-1" style={{ color: BRAND.textMute }}>
                    24H 最高
                  </div>
                  <div className="text-sm font-mono font-bold" style={{ color: BRAND.text }}>
                    暂未接入
                  </div>
                </div>
                <div className="rounded-lg p-3" style={{ backgroundColor: BRAND.bg }}>
                  <div className="text-[10px] font-semibold mb-1" style={{ color: BRAND.textMute }}>
                    24H 最低
                  </div>
                  <div className="text-sm font-mono font-bold" style={{ color: BRAND.text }}>
                    暂未接入
                  </div>
                </div>
              </div>

              <button
                className="w-full py-3 rounded-xl text-sm font-bold transition-all active:scale-95"
                style={{ backgroundColor: BRAND.primaryLt, color: BRAND.primary }}
              >
                去交易
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default PortalHero;
