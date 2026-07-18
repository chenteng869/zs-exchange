'use client';

/**
 * PortalAboutSection - 关于我们（2026-07-18）
 * 资产来源：Stitch _10
 */

import React from 'react';
import { Building2, ShieldCheck, Globe, Users, Award, Target, Heart, Sparkles } from 'lucide-react';
import { BRAND } from './brand';
import { PortalStatusBadge } from './PortalStatusBadge';

const VALUES = [
  { icon: ShieldCheck, title: '合规先行', desc: '萨摩亚持牌经营，主动接受监管与第三方审计。' },
  { icon: Globe, title: '全球视野', desc: '立足亚太，辐射全球，连接传统金融与数字资产。' },
  { icon: Heart, title: '用户为本', desc: '透明费率、24/7 客服、用户资产安全高于一切。' },
  { icon: Sparkles, title: '技术创新', desc: '持续投入 AI、风控、链上清算等基础设施。' },
];

const TIMELINE = [
  { year: '2024.03', event: '中萨数字科技集团在萨摩亚注册成立。' },
  { year: '2024.08', event: '获得萨摩亚金融业监管局 DSAEX 数字资产交易牌照。' },
  { year: '2025.02', event: '与树图 Conflux 达成战略合作，CFX/USDT 交易对上线。' },
  { year: '2025.11', event: '平台进入公测阶段，启动内测用户招募。' },
  { year: '2026.05', event: '启动 2.0 品牌升级，发布全新官网门户预览版。' },
];

const LICENSES = [
  { code: 'DSAEX-2024-001', name: '数字资产交易牌照', issuer: '萨摩亚 MSA' },
  { code: 'DSAST-2024-002', name: '数字资产托管牌照', issuer: '萨摩亚 MSA' },
];

export function PortalAboutSection() {
  return (
    <div className="space-y-10">
      {/* 顶部横幅 */}
      <div
        className="rounded-3xl p-8 md:p-12 relative overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${BRAND.bg} 0%, #ffffff 100%)`,
          border: `1px solid ${BRAND.border}`,
        }}
      >
        <div className="max-w-2xl">
          <div
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest mb-4"
            style={{ backgroundColor: BRAND.primaryLt, color: BRAND.primary }}
          >
            <Building2 className="w-3 h-3" /> About ZSDEX
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold mb-4 leading-tight" style={{ color: BRAND.text }}>
            连接传统金融与<br />
            <span style={{ color: BRAND.primary }}>数字资产世界</span>
          </h1>
          <p className="text-sm md:text-base leading-relaxed" style={{ color: BRAND.textSub }}>
            中萨数字科技交易所（ZSDEX）由中萨数字科技集团于 2024 年在萨摩亚注册成立，
            是面向全球用户的合规数字资产交易平台。我们以"合规、透明、安全"为基石，
            为用户提供现货、合约、OTC、做市、托管等一站式数字资产服务。
          </p>
        </div>
      </div>

      {/* 价值主张 */}
      <div>
        <h2 className="text-xl font-extrabold mb-4" style={{ color: BRAND.text }}>
          我们的价值观
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {VALUES.map((v) => {
            const Icon = v.icon;
            return (
              <div
                key={v.title}
                className="rounded-2xl p-5"
                style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}
              >
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center mb-3"
                  style={{ backgroundColor: BRAND.primaryLt, color: BRAND.primary }}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold mb-1.5" style={{ color: BRAND.text }}>
                  {v.title}
                </h3>
                <p className="text-xs" style={{ color: BRAND.textSub }}>
                  {v.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* 大事记 */}
      <div>
        <h2 className="text-xl font-extrabold mb-4" style={{ color: BRAND.text }}>
          发展历程
        </h2>
        <div
          className="rounded-2xl p-6"
          style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}
        >
          {TIMELINE.map((t, idx) => (
            <div key={t.year} className="flex gap-4 relative">
              <div className="flex flex-col items-center">
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0 mt-1.5"
                  style={{ backgroundColor: BRAND.primary, boxShadow: `0 0 0 4px ${BRAND.primaryLt}` }}
                />
                {idx !== TIMELINE.length - 1 && (
                  <div
                    className="w-px flex-1 mt-1"
                    style={{ backgroundColor: BRAND.border, minHeight: 40 }}
                  />
                )}
              </div>
              <div className="pb-6 flex-1">
                <div
                  className="text-xs font-mono font-bold mb-1"
                  style={{ color: BRAND.primary }}
                >
                  {t.year}
                </div>
                <div className="text-sm" style={{ color: BRAND.text }}>
                  {t.event}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 牌照 */}
      <div id="license">
        <h2 className="text-xl font-extrabold mb-4" style={{ color: BRAND.text }}>
          牌照与合规
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {LICENSES.map((l) => (
            <div
              key={l.code}
              className="rounded-2xl p-5 flex items-start gap-4"
              style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: BRAND.successLt, color: BRAND.success }}
              >
                <Award className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <div className="text-xs font-mono font-bold mb-1" style={{ color: BRAND.primary }}>
                  {l.code}
                </div>
                <h3 className="text-sm font-bold mb-1" style={{ color: BRAND.text }}>
                  {l.name}
                </h3>
                <p className="text-xs" style={{ color: BRAND.textSub }}>
                  发证机构：{l.issuer}
                </p>
              </div>
              <PortalStatusBadge status="OPEN" size="sm" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default PortalAboutSection;
