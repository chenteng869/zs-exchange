/**
 * /portal-preview/research 路由
 *
 * Q05 P3.39 阶段交付物（2026-07-19）
 * - 39 页面：研究院与研报中心
 * - 9 Tabs：总览 / 每日研报 / 深度分析 / 机构观点 / 宏观研究 / AMA 课堂 / 研报订阅 / 行业数据 / 帮助
 * - 与 P3.21 客户支持 + P3.35 自选行情 + P3.38 社区论坛
 *   形成"数据 - 研究 - 教育 - 讨论"完整内容研究闭环
 * - 不接真实 API（mock 占位研报 / 机构 / 分析师 / AMA / 行业指标）
 * - 不修改旧官网 / 旧 H5 / disabled pages / brand.ts / SPEC.md
 * - 保持 v6 纯黑无色相 + ZSDEX 绿 primary
 * - 严格规避"承诺收益 / 保本 / 刚兑 / 稳赚 / 担保"等高风险合规词
 * - 研报内容仅为研究方向演示，不构成任何投资建议
 */

import React from 'react';
import { PortalResearch } from '@/components/portal-preview/PortalResearch';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '研究院与研报中心 · 中萨数字科技交易所',
  description:
    '中萨数字科技交易所（ZSDEX）研究院与研报中心：12,840+ 篇深度研报 · 320+ 认证分析师 · 7 大主题研究 · AMA 课堂实时互动。构建"数据 - 研究 - 教育 - 讨论"完整内容研究闭环。',
  robots: { index: false, follow: false },
};

export default function ResearchPage() {
  return <PortalResearch />;
}
