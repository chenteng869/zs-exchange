/**
 * /portal-preview/wallet 路由
 *
 * Q05 P3.33 阶段交付物（2026-07-19）
 * - 33 页面：钱包服务中心
 * - 9 Tabs：总览 / 现货钱包 / 合约钱包 / DeFi 钱包 / NFT 钱包 / 跨链钱包 / 硬件钱包 / 历史记录 / 帮助
 * - 与 P3.4 现货 + P3.25 做市 + P3.26 衍生品 + P3.27 量化 + P3.28 NFT + P3.29 DeFi +
 *   P3.30 跨链 + P3.31 节点 + P3.32 数据形成"用户-钱包-资产-链上"全场景闭环
 * - 不接真实 API（mock 占位余额/价格/流水/硬件设备/合规说明）
 * - 不修改旧官网 / 旧 H5 / disabled pages / brand.ts / SPEC.md
 * - 保持 v6 纯黑无色相 + ZSDEX 绿 primary
 * - 严格规避"承诺收益 / 保本 / 刚兑 / 稳赚 / 担保"等高风险合规词
 */

import React from 'react';
import { PortalWallet } from '@/components/portal-preview/PortalWallet';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '钱包服务中心 · 中萨数字科技交易所',
  description:
    '中萨数字科技交易所（ZSDEX）钱包服务中心：钱包总览 / 现货钱包 / 合约钱包 / DeFi 钱包 / NFT 钱包 / 跨链钱包 / 硬件钱包 / 历史记录。构建"用户-钱包-资产-链上"全场景闭环。',
  robots: { index: false, follow: false },
};

export default function WalletPage() {
  return <PortalWallet />;
}
