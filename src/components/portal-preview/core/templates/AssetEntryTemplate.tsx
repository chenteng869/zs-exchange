/**
 * AssetEntryTemplate - 资产与钱包入口模板
 * 用途：资产、钱包、充值、提现入口说明
 * 设计系统：v6 纯黑无色相
 */

'use client';

import React from 'react';
import { BRAND } from '../../brand';

export interface AssetEntryTemplateProps {
  title: string;
  description?: string;
  breadcrumbs?: { label: string; href: string }[];
  depositUrl?: string;
  withdrawUrl?: string;
  transferUrl?: string;
  historyUrl?: string;
  riskDisclosure?: string;
  complianceNote?: string;
  children?: React.ReactNode;
}

export function AssetEntryTemplate({
  title,
  description,
  breadcrumbs,
  depositUrl = '/portal-preview/assets/deposit',
  withdrawUrl = '/portal-preview/assets/withdraw',
  transferUrl = '/portal-preview/assets/transfer',
  historyUrl = '/portal-preview/assets/history',
  riskDisclosure,
  complianceNote,
  children,
}: AssetEntryTemplateProps) {
  return (
    <div className="min-h-screen w-full" style={{ background: BRAND.bg, color: BRAND.text }}>
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="px-6 pt-6 text-sm" style={{ color: BRAND.textSub }}>
          {breadcrumbs.map((c, i) => (
            <span key={c.href}>
              {i > 0 && <span className="mx-2" style={{ color: BRAND.textMute }}>/</span>}
              <a href={c.href} className="hover:underline">{c.label}</a>
            </span>
          ))}
        </nav>
      )}

      <section className="px-6 md:px-12 py-12" style={{ background: `linear-gradient(180deg, ${BRAND.bg} 0%, ${BRAND.bgCard} 100%)`, borderBottom: `1px solid ${BRAND.border}` }}>
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-semibold mb-3" style={{ color: BRAND.text }}>{title}</h1>
          {description && <p className="text-base max-w-2xl" style={{ color: BRAND.textSub }}>{description}</p>}
        </div>
      </section>

      {/* 4 大操作入口 */}
      <section className="px-6 md:px-12 py-10">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: '充值', desc: '从外部钱包或银行账户充值', href: depositUrl, icon: '↓' },
            { label: '提现', desc: '提现到外部钱包或银行账户', href: withdrawUrl, icon: '↑' },
            { label: '转账', desc: '站内用户间转账', href: transferUrl, icon: '⇄' },
            { label: '历史', desc: '查看资产变动历史', href: historyUrl, icon: '◷' },
          ].map((op, i) => (
            <a
              key={op.label}
              href={op.href}
              className="rounded-lg p-6 transition-colors"
              style={{
                background: BRAND.bgCard,
                border: `1px solid ${BRAND.border}`,
                animation: `p4FadeUp 0.5s ease-out ${i * 60}ms both`,
              }}
            >
              <div className="text-3xl mb-2" style={{ color: BRAND.primary }}>{op.icon}</div>
              <div className="text-lg font-medium mb-1" style={{ color: BRAND.text }}>{op.label}</div>
              <div className="text-xs" style={{ color: BRAND.textSub }}>{op.desc}</div>
            </a>
          ))}
        </div>
      </section>

      {children && (
        <section className="px-6 md:px-12 py-6">
          <div className="max-w-6xl mx-auto">{children}</div>
        </section>
      )}

      {riskDisclosure && (
        <section className="px-6 md:px-12 py-8" style={{ background: BRAND.bgCard, borderTop: `1px solid ${BRAND.border}` }}>
          <div className="max-w-6xl mx-auto">
            <h3 className="text-base font-medium mb-3" style={{ color: BRAND.warning }}>风险披露</h3>
            <p className="text-sm" style={{ color: BRAND.textSub }}>{riskDisclosure}</p>
          </div>
        </section>
      )}

      {complianceNote && (
        <section className="px-6 md:px-12 py-4" style={{ background: BRAND.bgCard, borderTop: `1px solid ${BRAND.border}` }}>
          <div className="max-w-6xl mx-auto text-xs" style={{ color: BRAND.textSub }}>
            <span className="font-medium mr-2" style={{ color: BRAND.warning }}>合规提示：</span>
            {complianceNote}
          </div>
        </section>
      )}
    </div>
  );
}

export default AssetEntryTemplate;
