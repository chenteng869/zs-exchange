/**
 * /portal-preview/wallet 路由
 *
 * Q05 P3.5 阶段交付物（2026-07-19）
 * - 05 页面：钱包总览
 * - 6 大子模块：充值 / 提现 / 兑换 / 资金流水 / 地址管理 / 安全中心
 * - 18 主流币种余额 + 6 充值网络 + 资产分布 + 最近流水
 * - 不接真实 API（mock 占位余额/价格/流水）
 * - 不修改旧官网 / 旧 H5 / disabled pages
 * - 保持 v6 纯黑无色相 + ZSDEX 绿 primary
 */

import React from 'react';
import { PortalWallet } from '@/components/portal-preview/PortalWallet';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '钱包总览 · 中萨数字科技交易所',
  description:
    '中萨数字科技交易所钱包总览：18 主流币种余额、6 充值网络、资产分布、多币种资产表、最近资金流水。充值 / 提现 / 兑换 / 地址管理 / 安全中心。',
  robots: { index: false, follow: false },
};

export default function WalletPage() {
  return <PortalWallet />;
}
