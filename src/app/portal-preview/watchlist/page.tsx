/**
 * /portal-preview/watchlist 路由
 *
 * Q05 P3.35 阶段交付物（2026-07-19）
 * - 35 页面：自选与行情提醒中心
 * - 9 Tabs：总览 / 我的自选 / 热门榜单 / 涨跌榜 / 异动提醒 / 价格预警 / 资产估值 / 提醒订阅 / 帮助
 * - 与 P3.4 现货 + P3.32 链上数据分析 + P3.34 用户成长中心形成"行情-提醒-决策"全维度洞察闭环
 * - 不接真实 API（mock 占位行情/榜单/提醒/订阅数据）
 * - 不修改旧官网 / 旧 H5 / disabled pages / brand.ts / SPEC.md
 * - 保持 v6 纯黑无色相 + ZSDEX 绿 primary
 * - 严格规避"承诺收益 / 保本 / 刚兑 / 稳赚 / 担保"等高风险合规词
 */

import React from 'react';
import { PortalWatchlist } from '@/components/portal-preview/PortalWatchlist';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '自选与行情提醒中心 · 中萨数字科技交易所',
  description:
    '中萨数字科技交易所（ZSDEX）自选与行情提醒中心：我的自选 / 热门榜单 / 涨跌榜 / 异动提醒 / 价格预警 / 资产估值 / 提醒订阅。构建"行情-提醒-决策"全维度洞察闭环。',
  robots: { index: false, follow: false },
};

export default function WatchlistPage() {
  return <PortalWatchlist />;
}
