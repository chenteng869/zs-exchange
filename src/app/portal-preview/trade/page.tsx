/**
 * /portal-preview/trade 路由
 *
 * Q05 P3.4 阶段交付物（2026-07-19）
 * - 04 页面：交易大厅
 * - 6 大交易类型：现货 / 合约 / 策略 / 模拟 / 规则 / 费率
 * - 16 主流交易对 + mock 实时 ticker
 * - 不接真实 API（mock 占位价格）
 * - 不修改旧官网 / 旧 H5 / disabled pages
 * - 保持 v6 纯黑无色相 + ZSDEX 绿 primary
 */

import React from 'react';
import { PortalTrade } from '@/components/portal-preview/PortalTrade';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '交易大厅 · 中萨数字科技交易所',
  description:
    '中萨数字科技交易所交易大厅：现货 / 合约 / 策略 / 模拟 / 规则 / 费率六大交易类型，16 主流交易对实时行情、24h 成交、持仓量、资金费率。',
  robots: { index: false, follow: false },
};

export default function TradePage() {
  return <PortalTrade />;
}
