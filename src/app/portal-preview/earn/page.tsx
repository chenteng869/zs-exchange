/**
 * /portal-preview/earn 路由
 *
 * Q05 P3.8 阶段交付物（2026-07-19）
 * - 08 页面：收益中心
 * - 4 大产品类型：活期 / 定期 / 质押 / 跟单
 * - 11+ 理财产品 + mock 实时 APR 波动
 * - 我的持仓 + 收益计算器 + FAQ
 * - 不接真实 API（mock 占位利率）
 * - 不修改旧官网 / 旧 H5 / disabled pages
 * - 保持 v6 纯黑无色相 + ZSDEX 绿 primary
 */

import React from 'react';
import { PortalEarn } from '@/components/portal-preview/PortalEarn';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '收益中心 · 中萨数字科技交易所',
  description:
    '中萨数字科技交易所收益中心：活期理财 / 定期理财 / 质押挖矿 / 跟单四大产品类型，11+ 理财产品，APR 最高 42.50%，收益计算器、我的持仓、常见问题。',
  robots: { index: false, follow: false },
};

export default function EarnPage() {
  return <PortalEarn />;
}
