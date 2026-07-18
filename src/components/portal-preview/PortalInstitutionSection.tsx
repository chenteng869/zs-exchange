'use client';

/**
 * PortalInstitutionSection - 机构服务介绍（2026-07-18）
 * 资产来源：Stitch _12
 * 硬约束：只做介绍，不接 KYB
 */

import React from 'react';
import { Building2, Briefcase, LineChart, Lock, Network, Phone, Mail } from 'lucide-react';
import { BRAND } from './brand';
import { PortalStatusBadge } from './PortalStatusBadge';

const SERVICES = [
  {
    icon: LineChart,
    title: 'OTC 大宗交易',
    desc: '为机构客户提供大额场外撮合服务，支持 BTC / ETH / USDT / CFX 等主流币种，单笔门槛以实际咨询为准。',
  },
  {
    icon: Network,
    title: '做市商计划',
    desc: '为专业做市商提供负 maker 费率、API 优先通道、专项流动性池与一对一技术支持。',
  },
  {
    icon: Building2,
    title: '资产托管',
    desc: '面向家族办公室、基金的合规数字资产托管方案，支持多签 + 冷热分离 + 审计对接。',
  },
  {
    icon: Lock,
    title: 'API 量化接入',
    desc: '提供 REST 与 WebSocket 双通道量化接口，支持 50+ 交易对毫秒级行情与下单。',
  },
  {
    icon: Briefcase,
    title: '企业账户',
    desc: '支持企业 KYB 认证、多层级账户管理、内部转账白名单、定制化财务对账。',
  },
  {
    icon: Phone,
    title: '专属客户经理',
    desc: '机构客户享有 1v1 客户经理 + 24/7 优先工单通道，确保任何问题第一时间响应。',
  },
];

export function PortalInstitutionSection() {
  return (
    <div className="space-y-8">
      {/* 顶图 */}
      <div
        className="rounded-3xl p-8 md:p-12 relative overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${BRAND.primary} 0%, ${BRAND.primaryDim} 100%)`,
          color: '#fff',
        }}
      >
        <div
          className="absolute -right-20 -top-20 w-72 h-72 rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle, #fff 0%, transparent 70%)' }}
        />
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 mb-4">
            <Building2 className="w-5 h-5" />
            <span className="text-xs font-bold uppercase tracking-widest">Institutional</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-extrabold mb-4 leading-tight">
            为机构客户提供<br />
            一站式数字资产服务
          </h2>
          <p className="text-sm md:text-base opacity-90 leading-relaxed">
            从 OTC 大宗到做市商计划，从资产托管到企业账户——
            我们为对冲基金、家族办公室、专业做市商等机构客户提供深度定制化的数字资产服务方案。
          </p>
        </div>
      </div>

      {/* 6 大服务卡 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {SERVICES.map((s) => {
          const Icon = s.icon;
          return (
            <div
              key={s.title}
              className="rounded-2xl p-5"
              style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center mb-3"
                style={{ backgroundColor: BRAND.primaryLt, color: BRAND.primary }}
              >
                <Icon className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold mb-1.5" style={{ color: BRAND.text }}>
                {s.title}
              </h3>
              <p className="text-xs leading-relaxed" style={{ color: BRAND.textSub }}>
                {s.desc}
              </p>
            </div>
          );
        })}
      </div>

      {/* 联系 */}
      <div
        className="rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
        style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}
      >
        <div>
          <h3 className="text-base font-bold mb-1" style={{ color: BRAND.text }}>
            商务联系
          </h3>
          <p className="text-xs" style={{ color: BRAND.textSub }}>
            欢迎发邮件或来电咨询，我们的机构团队会在 1 个工作日内回复您。
          </p>
        </div>
        <div className="flex flex-col md:flex-row gap-3 text-xs">
          <a
            href="mailto:institution@zs-exchange.com"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg font-semibold"
            style={{ backgroundColor: BRAND.primaryLt, color: BRAND.primary }}
          >
            <Mail className="w-3.5 h-3.5" /> institution@zs-exchange.com
          </a>
          <PortalStatusBadge status="BETA" size="md" showDot={false} />
        </div>
      </div>
    </div>
  );
}

export default PortalInstitutionSection;
