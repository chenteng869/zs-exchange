/**
 * /portal-preview/otc 路由
 *
 * Q05 P3.37 阶段交付物（2026-07-19）
 * - 37 页面：场外大宗交易中心
 * - 9 Tabs：总览 / RFQ 询价 / 大宗挂单 / 信用额度 / 成交记录 / 做市商对接 / 结算管理 / 机构服务 / 帮助
 * - 与 P3.25 做市商与流动性 + P3.33 钱包服务 + P3.35 自选行情 + P3.36 NFT 市场形成
 *   "询价 - 报价 - 撮合 - 结算 - 风控"完整 OTC 大宗交易闭环
 * - 不接真实 API（mock 占位 RFQ / 挂单 / 信用 / 结算 / 机构数据）
 * - 不修改旧官网 / 旧 H5 / disabled pages / brand.ts / SPEC.md
 * - 保持 v6 纯黑无色相 + ZSDEX 绿 primary
 * - 严格规避"承诺收益 / 保本 / 刚兑 / 稳赚 / 担保"等高风险合规词
 */

import React from 'react';
import { PortalOtc } from '@/components/portal-preview/PortalOtc';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '场外大宗交易中心 · 中萨数字科技交易所',
  description:
    '中萨数字科技交易所（ZSDEX）场外大宗交易中心（OTC Desk）：RFQ 询价 / 大宗挂单 / 信用额度 / 成交记录 / 做市商对接 / 结算管理 / 机构服务。构建"询价 - 报价 - 撮合 - 结算 - 风控"完整 OTC 大宗交易闭环。',
  robots: { index: false, follow: false },
};

export default function OtcPage() {
  return <PortalOtc />;
}
