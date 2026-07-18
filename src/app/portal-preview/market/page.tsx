/**
 * /portal-preview/market 路由
 *
 * Q05 P3.3 阶段交付物（2026-07-19）
 * - 03 页面：行情中心
 * - 6 大分类：热搜 / 涨幅 / 跌幅 / 成交额 / 树图生态 / 自选
 * - 不接真实 API（mock 占位价格）
 * - 不修改旧官网 / 旧 H5 / disabled pages
 * - 保持 v6 纯黑无色相 + ZSDEX 绿 primary
 */

import React from 'react';
import { PortalMarket } from '@/components/portal-preview/PortalMarket';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '行情中心 · 中萨数字科技交易所',
  description:
    '中萨数字科技交易所行情总览：热搜、涨幅、跌幅、成交额、树图生态资产、自选列表。提供价格 ticker、24h 涨跌、成交额、走势图与币种详情。',
  robots: { index: false, follow: false },
};

export default function MarketPage() {
  return <PortalMarket />;
}
