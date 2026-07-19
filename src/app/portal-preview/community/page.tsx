/**
 * /portal-preview/community 路由
 *
 * Q05 P3.38 阶段交付物（2026-07-19）
 * - 38 页面：社区与论坛中心
 * - 9 Tabs：总览 / 热门话题 / 我的主页 / 板块分类 / 创作中心 / 官方公告 / 活动投票 / 积分奖励 / 帮助
 * - 与 P3.21 客户支持 + P3.30 跨链桥 + P3.35 自选行情 + P3.36 NFT 市场
 *   形成"支持 - 桥 - 社区 - 行情 - 生态"完整用户共建与内容生态闭环
 * - 不接真实 API（mock 占位话题 / 帖子 / 用户 / 投票 / 积分数据）
 * - 不修改旧官网 / 旧 H5 / disabled pages / brand.ts / SPEC.md
 * - 保持 v6 纯黑无色相 + ZSDEX 绿 primary
 * - 严格规避"承诺收益 / 保本 / 刚兑 / 稳赚 / 担保"等高风险合规词
 */

import React from 'react';
import { PortalCommunity } from '@/components/portal-preview/PortalCommunity';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '社区与论坛中心 · 中萨数字科技交易所',
  description:
    '中萨数字科技交易所（ZSDEX）社区与论坛中心：热门话题 / 我的主页 / 板块分类 / 创作中心 / 官方公告 / 活动投票 / 积分奖励。构建"支持 - 桥 - 社区 - 行情 - 生态"完整用户共建与内容生态闭环。',
  robots: { index: false, follow: false },
};

export default function CommunityPage() {
  return <PortalCommunity />;
}
