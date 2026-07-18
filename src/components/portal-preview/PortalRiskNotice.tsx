'use client';

/**
 * PortalRiskNotice - 风险提示区（2026-07-18）
 * 资产来源：Stitch _15 风险提示
 */

import React from 'react';
import { AlertTriangle, Shield, TrendingDown, Globe, BookOpen, ExternalLink } from 'lucide-react';
import { BRAND } from './brand';

const RISKS = [
  {
    icon: TrendingDown,
    title: '价格波动风险',
    desc: '数字资产价格受市场情绪、宏观政策、技术迭代等多重因素影响，可能在短时间内出现剧烈波动。',
  },
  {
    icon: Globe,
    title: '政策与合规风险',
    desc: '各国对数字资产的监管政策持续调整，可能影响特定服务的可用性与合规边界。',
  },
  {
    icon: Shield,
    title: '技术安全风险',
    desc: '智能合约、私钥管理、热/冷钱包体系等环节均存在被攻击的可能性，请优先启用 MFA、硬件钱包等安全措施。',
  },
  {
    icon: BookOpen,
    title: '杠杆与合约风险',
    desc: '杠杆及合约交易可能导致本金全部损失，请确保充分理解强平机制、资金费率等关键概念后再行参与。',
  },
];

export function PortalRiskNotice() {
  return (
    <div className="space-y-6">
      {/* 顶部警示条 */}
      <div
        className="rounded-2xl p-6 flex items-start gap-4"
        style={{ backgroundColor: BRAND.dangerLt, border: `1px solid ${BRAND.danger}33` }}
      >
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: BRAND.danger, color: '#fff' }}
        >
          <AlertTriangle className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-base font-bold mb-1" style={{ color: BRAND.danger }}>
            数字资产交易存在重大风险，请理性评估自身风险承受能力
          </h3>
          <p className="text-sm" style={{ color: BRAND.text }}>
            投资数字资产可能导致您的本金全部损失，过往业绩不代表未来表现。
            请仅使用可承受损失的资金参与，并优先咨询专业的投资顾问。
          </p>
        </div>
      </div>

      {/* 风险点列表 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {RISKS.map((r) => {
          const Icon = r.icon;
          return (
            <div
              key={r.title}
              className="rounded-2xl p-5"
              style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}
            >
              <div className="flex items-start gap-3">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: BRAND.warningLt, color: BRAND.warning }}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold mb-1.5" style={{ color: BRAND.text }}>
                    {r.title}
                  </h4>
                  <p className="text-xs leading-relaxed" style={{ color: BRAND.textSub }}>
                    {r.desc}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 用户承诺 */}
      <div
        className="rounded-2xl p-6"
        style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}
      >
        <h3 className="text-base font-bold mb-3" style={{ color: BRAND.text }}>
          用户风险承诺
        </h3>
        <ul className="space-y-2 text-sm" style={{ color: BRAND.textSub }}>
          <li>· 我确认数字资产交易可能带来本金全部损失的风险。</li>
          <li>· 我确认用于交易的资金不影响本人及家庭基本生活。</li>
          <li>· 我已阅读并理解《用户协议》《风险提示》《免责声明》。</li>
          <li>· 我理解平台不对任何投资盈亏承担责任。</li>
        </ul>
      </div>

      <a
        href="#"
        className="inline-flex items-center gap-1.5 text-sm font-semibold transition-colors"
        style={{ color: BRAND.primary }}
      >
        阅读完整的风险提示与免责声明 <ExternalLink className="w-3.5 h-3.5" />
      </a>
    </div>
  );
}

export default PortalRiskNotice;
