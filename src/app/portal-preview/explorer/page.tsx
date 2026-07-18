/**
 * /portal-preview/explorer 路由
 *
 * Q05 P3.11 阶段交付物（2026-07-19）
 * - 11 页面：TreeGraph (Conflux) 区块链浏览器
 * - 7 大区块：Hero / KPI / 最新区块 / 实时交易 / 地址榜 / 合约榜 / 统计图
 * - 5 项交互：搜索 / 排序 / Tab 切换 / 详情 Drawer / 快捷键
 * - 4 处 Drawer：区块详情 / 交易详情 / 地址详情 / 合约详情
 * - 1+ 实时数据波动：区块高度 +1 / 全网算力漂移 / 实时交易流
 * - 3+ 动画：Stagger / CountUp / Hover
 * - 不接真实 API（mock 占位区块/交易/地址/合约）
 * - 不修改旧官网 / 旧 H5 / disabled pages
 * - 保持 v6 纯黑无色相 + ZSDEX 绿 primary
 * - 遵循 Q05 高风险合规词硬约束
 */

import React from 'react';
import { PortalExplorer } from '@/components/portal-preview/PortalExplorer';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '区块链浏览器 · 中萨数字科技交易所',
  description:
    '中萨数字科技交易所（ZSDEX）TreeGraph 区块链浏览器：实时区块高度 / 全网算力 / 交易查询 / 地址详情 / 合约榜 / 网络统计。',
  robots: { index: false, follow: false },
};

export default function ExplorerPage() {
  return <PortalExplorer />;
}
