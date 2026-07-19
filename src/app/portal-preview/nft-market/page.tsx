/**
 * /portal-preview/nft-market 路由
 *
 * Q05 P3.36 阶段交付物（2026-07-19）
 * - 36 页面：NFT 二级市场与 IP 流通中心
 * - 9 Tabs：总览 / 我的持仓 / 一级申购 / IP 合作市场 / 二级挂单 / 拍卖中心 / 稀有度榜单 / 流通记录 / 帮助
 * - 与 P3.18 Launch 项目发行 + P3.24 生态合作 + P3.28 NFT 数字藏品形成
 *   "一级发行 - IP 合作 - 数字藏品 - 二级流通"完整 NFT 资产生态闭环
 * - 不接真实 API（mock 占位藏品/挂单/拍卖/IP 数据）
 * - 不修改旧官网 / 旧 H5 / disabled pages / brand.ts / SPEC.md
 * - 保持 v6 纯黑无色相 + ZSDEX 绿 primary
 * - 严格规避"承诺收益 / 保本 / 刚兑 / 稳赚 / 担保"等高风险合规词
 */

import React from 'react';
import { PortalNftMarket } from '@/components/portal-preview/PortalNftMarket';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'NFT 二级市场与 IP 流通中心 · 中萨数字科技交易所',
  description:
    '中萨数字科技交易所（ZSDEX）NFT 二级市场与 IP 流通中心：我的持仓 / 一级申购 / IP 合作市场 / 二级挂单 / 拍卖中心 / 稀有度榜单 / 流通记录。构建"一级发行 - IP 合作 - 数字藏品 - 二级流通"完整 NFT 资产生态闭环。',
  robots: { index: false, follow: false },
};

export default function NftMarketPage() {
  return <PortalNftMarket />;
}
