/**
 * AccountEntryTemplate - 账户与安全入口模板
 * 用途：登录、注册、KYC、安全中心入口说明
 * 设计系统：v6 纯黑无色相
 */

'use client';

import React, { useState } from 'react';
import { BRAND, STATUS } from '../../brand';

export interface AccountEntryTemplateProps {
  title: string;
  description?: string;
  breadcrumbs?: { label: string; href: string }[];
  loginUrl?: string;
  registerUrl?: string;
  kycUrl?: string;
  securityFeatures?: { icon: string; title: string; description: string }[];
  kycSteps?: { title: string; description: string }[];
  complianceNote?: string;
  children?: React.ReactNode;
}

export function AccountEntryTemplate({
  title,
  description,
  breadcrumbs,
  loginUrl = '/portal-preview/account/login',
  registerUrl = '/portal-preview/account/register',
  kycUrl = '/portal-preview/account/kyc',
  securityFeatures = [],
  kycSteps = [],
  complianceNote,
  children,
}: AccountEntryTemplateProps) {
  const [activeSection, setActiveSection] = useState<'login' | 'kyc' | 'security'>('login');

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

      {/* Hero */}
      <section className="px-6 md:px-12 py-12" style={{ background: `linear-gradient(180deg, ${BRAND.bg} 0%, ${BRAND.bgCard} 100%)`, borderBottom: `1px solid ${BRAND.border}` }}>
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-semibold mb-3" style={{ color: BRAND.text }}>{title}</h1>
          {description && <p className="text-base max-w-2xl" style={{ color: BRAND.textSub }}>{description}</p>}
        </div>
      </section>

      {/* 三大入口 */}
      <section className="px-6 md:px-12 py-10">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-4">
          <a
            href={loginUrl}
            className="rounded-lg p-6 transition-colors"
            style={{ background: BRAND.bgCard, border: `1px solid ${BRAND.border}` }}
          >
            <div className="text-3xl mb-3" style={{ color: BRAND.primary }}>→</div>
            <div className="text-lg font-medium mb-2" style={{ color: BRAND.text }}>登录</div>
            <div className="text-sm" style={{ color: BRAND.textSub }}>使用您的账户凭证进入平台</div>
          </a>
          <a
            href={registerUrl}
            className="rounded-lg p-6 transition-colors"
            style={{ background: BRAND.bgCard, border: `1px solid ${BRAND.border}` }}
          >
            <div className="text-3xl mb-3" style={{ color: BRAND.primary }}>+</div>
            <div className="text-lg font-medium mb-2" style={{ color: BRAND.text }}>注册</div>
            <div className="text-sm" style={{ color: BRAND.textSub }}>创建新账户，开启数字资产之旅</div>
          </a>
          <a
            href={kycUrl}
            className="rounded-lg p-6 transition-colors"
            style={{ background: BRAND.bgCard, border: `1px solid ${BRAND.border}` }}
          >
            <div className="text-3xl mb-3" style={{ color: BRAND.warning }}>!</div>
            <div className="text-lg font-medium mb-2" style={{ color: BRAND.text }}>KYC 认证</div>
            <div className="text-sm" style={{ color: BRAND.textSub }}>完成身份认证，解锁更多功能</div>
          </a>
        </div>
      </section>

      {/* Tab 切换 + 内容 */}
      <section className="px-6 md:px-12 py-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex gap-1 mb-6">
            {[
              { key: 'login' as const, label: '登录说明' },
              { key: 'kyc' as const, label: 'KYC 流程' },
              { key: 'security' as const, label: '安全中心' },
            ].map((t) => (
              <button
                key={t.key}
                onClick={() => setActiveSection(t.key)}
                className="px-4 py-2 rounded-md text-sm font-medium"
                style={{
                  background: activeSection === t.key ? BRAND.bgCard : 'transparent',
                  color: activeSection === t.key ? BRAND.text : BRAND.textSub,
                  border: `1px solid ${activeSection === t.key ? BRAND.borderStrong : 'transparent'}`,
                }}
              >
                {t.label}
              </button>
            ))}
          </div>

          {activeSection === 'login' && (
            <div className="rounded-lg p-6" style={{ background: BRAND.bgCard, border: `1px solid ${BRAND.border}` }}>
              <h3 className="text-lg font-medium mb-3" style={{ color: BRAND.text }}>登录方式</h3>
              <ul className="space-y-2 text-sm" style={{ color: BRAND.textSub }}>
                <li>· 邮箱 + 密码</li>
                <li>· 手机号 + 验证码</li>
                <li>· 钱包签名（Web3 登录）</li>
                <li>· 二次验证（2FA）</li>
              </ul>
            </div>
          )}

          {activeSection === 'kyc' && kycSteps.length > 0 && (
            <div className="rounded-lg p-6" style={{ background: BRAND.bgCard, border: `1px solid ${BRAND.border}` }}>
              <h3 className="text-lg font-medium mb-4" style={{ color: BRAND.text }}>KYC 流程</h3>
              <ol className="space-y-3">
                {kycSteps.map((step, i) => (
                  <li key={i} className="flex gap-3">
                    <div
                      className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium"
                      style={{ background: BRAND.primaryContainer, color: BRAND.onPrimary }}
                    >
                      {i + 1}
                    </div>
                    <div>
                      <div className="font-medium" style={{ color: BRAND.text }}>{step.title}</div>
                      <div className="text-sm" style={{ color: BRAND.textSub }}>{step.description}</div>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {activeSection === 'security' && securityFeatures.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {securityFeatures.map((f, i) => (
                <div
                  key={f.title}
                  className="rounded-lg p-5"
                  style={{ background: BRAND.bgCard, border: `1px solid ${BRAND.border}` }}
                >
                  <div className="text-2xl mb-2" style={{ color: BRAND.primary }}>{f.icon}</div>
                  <div className="text-base font-medium mb-1" style={{ color: BRAND.text }}>{f.title}</div>
                  <div className="text-sm" style={{ color: BRAND.textSub }}>{f.description}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {children && (
        <section className="px-6 md:px-12 py-6">
          <div className="max-w-6xl mx-auto">{children}</div>
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

export default AccountEntryTemplate;
