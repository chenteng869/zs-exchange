'use client';

/**
 * PortalRiskNotice - 风险提示区（2026-07-19 P3.1 增强版）
 * 资产来源：Stitch _15 风险提示
 * 增强：6 大风险点、风险等级标签、风险等级统计
 */

import React from 'react';
import { AlertTriangle, Shield, TrendingDown, Globe, BookOpen, ServerCrash, FileCheck, ExternalLink } from 'lucide-react';
import { BRAND } from './brand';

type RiskLevel = '高' | '中' | '低';

const LEVEL_BG: Record<RiskLevel, string> = {
  高: 'rgba(246, 70, 93, 0.15)',
  中: 'rgba(255, 169, 64, 0.15)',
  低: 'rgba(176, 176, 176, 0.10)',
};
const LEVEL_COLOR: Record<RiskLevel, string> = {
  高: BRAND.danger,
  中: BRAND.warning,
  低: BRAND.textSub,
};

const RISKS: Array<{
  icon: React.ElementType;
  title: string;
  desc: string;
  level: RiskLevel;
}> = [
  {
    icon: TrendingDown,
    title: '价格波动风险',
    desc: '数字资产价格受市场情绪、宏观政策、技术迭代等多重因素影响，可能在短时间内出现剧烈波动。',
    level: '高',
  },
  {
    icon: Globe,
    title: '政策与合规风险',
    desc: '各国对数字资产的监管政策持续调整，可能影响特定服务的可用性与合规边界，请关注所在地区最新监管动态。',
    level: '高',
  },
  {
    icon: Shield,
    title: '技术安全风险',
    desc: '智能合约、私钥管理、热/冷钱包体系等环节均存在被攻击的可能性，请优先启用 MFA、硬件钱包等安全措施。',
    level: '中',
  },
  {
    icon: BookOpen,
    title: '杠杆与合约风险',
    desc: '杠杆及合约交易可能导致本金全部损失，请确保充分理解强平机制、资金费率等关键概念后再行参与。',
    level: '高',
  },
  {
    icon: FileCheck,
    title: 'KYC / 反洗钱风险',
    desc: '平台按合规要求开展 KYC 与可疑交易监测，未完成认证或触发风控规则的账户可能面临功能限制。',
    level: '中',
  },
  {
    icon: ServerCrash,
    title: '服务中断与流动性风险',
    desc: '极端行情下可能出现撮合延迟、行情刷新滞后或流动性不足，请合理设置止损并避免满仓操作。',
    level: '中',
  },
];

export function PortalRiskNotice() {
  const highCount = RISKS.filter((r) => r.level === '高').length;
  const midCount = RISKS.filter((r) => r.level === '中').length;
  const lowCount = RISKS.filter((r) => r.level === '低').length;

  return (
    <div className="space-y-6">
      {/* 顶部警示条 */}
      <div
        className="rounded-2xl p-6 flex items-start gap-4"
        style={{ backgroundColor: BRAND.dangerLt, border: `1px solid ${BRAND.danger}33` }}
      >
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: BRAND.danger, color: BRAND.onPrimary }}
        >
          <AlertTriangle className="w-6 h-6" />
        </div>
        <div className="flex-1">
          <h3 className="text-base font-bold mb-1" style={{ color: BRAND.danger }}>
            数字资产交易存在重大风险，请理性评估自身风险承受能力
          </h3>
          <p className="text-sm leading-relaxed" style={{ color: BRAND.text }}>
            投资数字资产可能导致您的本金全部损失，过往业绩不代表未来表现。
            请仅使用可承受损失的资金参与，并优先咨询专业的投资顾问。
          </p>
        </div>
      </div>

      {/* 风险等级统计 */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { level: '高' as const, count: highCount, label: '高风险' },
          { level: '中' as const, count: midCount, label: '中风险' },
          { level: '低' as const, count: lowCount, label: '低风险' },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-xl p-3 flex items-center gap-3"
            style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}
          >
            <div
              className="text-2xl font-extrabold w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: LEVEL_BG[s.level], color: LEVEL_COLOR[s.level] }}
            >
              {s.count}
            </div>
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: BRAND.textMute }}>
                {s.label}
              </div>
              <div className="text-xs" style={{ color: BRAND.textSub }}>
                {s.label}等级风险点
              </div>
            </div>
          </div>
        ))}
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
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <h4 className="text-sm font-bold" style={{ color: BRAND.text }}>
                      {r.title}
                    </h4>
                    <span
                      className="text-[10px] font-bold px-1.5 py-0.5 rounded flex-shrink-0"
                      style={{ backgroundColor: LEVEL_BG[r.level], color: LEVEL_COLOR[r.level] }}
                    >
                      风险等级 · {r.level}
                    </span>
                  </div>
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
