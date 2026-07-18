/**
 * /portal-preview - P1 首页（2026-07-18）
 * 资产来源：Stitch _1（亮色改造）
 * 约束：不替换 / 旧首页，不接真实 API
 */

import React from 'react';
import { PortalHero } from '@/components/portal-preview/PortalHero';
import { PortalSection } from '@/components/portal-preview/PortalSection';
import { PortalMarketPreview } from '@/components/portal-preview/PortalMarketPreview';
import { PortalProductMatrix } from '@/components/portal-preview/PortalProductMatrix';
import { PortalAnnouncementEntry } from '@/components/portal-preview/PortalAnnouncementEntry';
import { BRAND } from '@/components/portal-preview/brand';
import { ShieldCheck, TrendingUp, Sparkles, ArrowRight } from 'lucide-react';

export const metadata = {
  title: 'ZSDEX 首页 | 中萨数字科技交易所',
  description: '面向全球的专业级数字资产基础设施',
};

export default function PortalPreviewHomePage() {
  return (
    <>
      <PortalHero />

      {/* 数据看板 */}
      <PortalSection
        background="bg"
        spacing="md"
        eyebrow="LIVE DATA"
        title="实时数据看板"
        description="全天候市场数据 · 由行情服务统一提供"
        action={
          <a
            href="/portal-preview/discover"
            className="inline-flex items-center gap-1 text-xs font-semibold"
            style={{ color: BRAND.primary }}
          >
            发现更多 <ArrowRight className="w-3 h-3" />
          </a>
        }
      >
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <PortalMarketPreview />
          <div
            className="rounded-2xl p-5"
            style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}
          >
            <h3 className="text-sm font-bold mb-4" style={{ color: BRAND.text }}>
              平台数据
            </h3>
            <div className="space-y-3">
              {[
                { label: '注册用户', value: '数据接入中', status: 'COMING' as const },
                { label: '上线币种', value: '数据接入中', status: 'COMING' as const },
                { label: '24H 成交', value: '数据接入中', status: 'COMING' as const },
                { label: '储备金率', value: '数据接入中', status: 'COMING' as const },
                { label: '在线客服', value: '7×24', status: 'OPEN' as const },
              ].map((row) => (
                <div
                  key={row.label}
                  className="flex items-center justify-between py-2"
                  style={{ borderBottom: `1px dashed ${BRAND.border}` }}
                >
                  <span className="text-xs" style={{ color: BRAND.textSub }}>
                    {row.label}
                  </span>
                  <span
                    className="text-sm font-mono font-bold"
                    style={{ color: row.status === 'OPEN' ? BRAND.text : BRAND.textMute }}
                  >
                    {row.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <PortalAnnouncementEntry />
        </div>
      </PortalSection>

      {/* 产品矩阵 */}
      <PortalSection
        eyebrow="PRODUCTS"
        title="产品矩阵"
        description="从现货到合约、从个人到机构，我们提供完整的数字资产服务"
      >
        <PortalProductMatrix />
      </PortalSection>

      {/* 信任要素 */}
      <PortalSection
        background="primaryLt"
        spacing="md"
        eyebrow="WHY ZSDEX"
        title="为什么选择 ZSDEX"
        description="合规体系 + 安全架构 + 极致体验，为用户打造真正可信赖的数字资产服务"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { icon: ShieldCheck, title: '合规先行', desc: '按业务线逐步对接国际主要市场的合规要求，构建多法域合规研究与观察体系。' },
            { icon: TrendingUp, title: '深度撮合', desc: '自研撮合引擎，亚毫秒级响应，承载高频量化与机构交易需求。' },
            { icon: Sparkles, title: 'AI 风控', desc: '基于 AI 的异常交易识别与链上追踪能力，覆盖账户、资产、行为三层。' },
          ].map((it) => {
            const Icon = it.icon;
            return (
              <div
                key={it.title}
                className="rounded-2xl p-5"
                style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.primary}22` }}
              >
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center mb-3"
                  style={{ backgroundColor: BRAND.primaryLt, color: BRAND.primary }}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold mb-1" style={{ color: BRAND.text }}>
                  {it.title}
                </h3>
                <p className="text-xs" style={{ color: BRAND.textSub }}>
                  {it.desc}
                </p>
              </div>
            );
          })}
        </div>
      </PortalSection>

      {/* CTA */}
      <PortalSection background="card" spacing="md">
        <div
          className="rounded-3xl p-8 md:p-12 text-center relative overflow-hidden"
          style={{
            background: `linear-gradient(135deg, ${BRAND.primaryContainer} 0%, ${BRAND.primaryDim} 100%)`,
            color: BRAND.onPrimary,
          }}
        >
          <h2 className="text-2xl md:text-3xl font-extrabold mb-3">
            准备好开启数字资产交易了吗？
          </h2>
          <p className="text-sm opacity-90 max-w-xl mx-auto mb-6">
            30 秒完成注册，开启合规、安全、专业的全球数字资产服务。
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <a
              href="/auth/register"
              className="inline-flex items-center gap-2 px-6 h-12 rounded-xl text-sm font-bold"
              style={{ backgroundColor: BRAND.card, color: BRAND.primary }}
            >
              立即注册 <ArrowRight className="w-4 h-4" />
            </a>
            <a
              href="/portal-preview/about"
              className="inline-flex items-center gap-2 px-6 h-12 rounded-xl text-sm font-bold"
              style={{ backgroundColor: BRAND.cardGlass, color: BRAND.onPrimary }}
            >
              了解我们
            </a>
          </div>
        </div>
      </PortalSection>
    </>
  );
}
