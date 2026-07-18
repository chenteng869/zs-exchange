/**
 * /portal-preview/buy-crypto 路由
 *
 * Q05 P3.2 阶段交付物（2026-07-19）
 * - 02 页面：买币
 * - 不接真实 API（mock 占位）
 * - 不修改旧官网 / 旧 H5 / disabled pages
 * - 保持 v6 纯黑无色相 + ZSDEX 绿 primary
 */

import React from 'react';
import { PortalBuyCrypto } from '@/components/portal-preview/PortalBuyCrypto';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '买币 · 中萨数字科技交易所',
  description:
    '提供快捷买币、P2P、OTC 大宗、法币通道四种方式，覆盖从 100 元到千万级交易额的不同场景。',
  robots: { index: false, follow: false },
};

export default function BuyCryptoPage() {
  return <PortalBuyCrypto />;
}
