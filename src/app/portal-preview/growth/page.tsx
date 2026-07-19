/**
 * /portal-preview/growth 路由
 *
 * Q05 P3.34 阶段交付物（2026-07-19）
 * - 34 页面：用户成长中心
 * - 9 Tabs：总览 / 等级体系 / 积分中心 / 任务中心 / 推荐奖励 / 等级权益 / 活动中心 / 历史记录 / 帮助
 * - 与 P3.20 KYC + P3.24 生态合作 + P3.33 钱包服务中心形成"用户-资产-成长-激励"成长闭环
 * - 不接真实 API（mock 占位积分/等级/任务/活动/合规说明）
 * - 不修改旧官网 / 旧 H5 / disabled pages / brand.ts / SPEC.md
 * - 保持 v6 纯黑无色相 + ZSDEX 绿 primary
 * - 严格规避"承诺收益 / 保本 / 刚兑 / 稳赚 / 担保"等高风险合规词
 */

import React from 'react';
import { PortalGrowth } from '@/components/portal-preview/PortalGrowth';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '用户成长中心 · 中萨数字科技交易所',
  description:
    '中萨数字科技交易所（ZSDEX）用户成长中心：等级体系 / 积分中心 / 任务中心 / 推荐奖励 / 等级权益 / 活动中心 / 历史记录。构建"用户-资产-成长-激励"成长闭环。',
  robots: { index: false, follow: false },
};

export default function GrowthPage() {
  return <PortalGrowth />;
}
