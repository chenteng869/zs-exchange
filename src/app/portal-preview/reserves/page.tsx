/**
 * /portal-preview/reserves 路由
 *
 * Q05 P3.13 阶段交付物（2026-07-19）
 * - 13 页面：资产储备证明中心（Proof of Reserves）
 * - 9 大区块：Hero / 实时 KPI / 1:1 承诺 + Merkle 验证 / 资产覆盖明细 / 冷钱包公示 / 审计报告 / 风控体系 / 历史快照 / 验证教程 / 底部 CTA
 * - 8+ 交互：搜索 / 排序 / Tab 切换 / 网络过滤 / 详情 Drawer / 地址显示切换 / 快捷键
 * - 4+ Drawer：Merkle 验证 / 冷钱包详情 / 审计报告 / 教程步骤
 * - 4+ 实时数据：总储备金 / 平均储备率 / 24h 充值 / 24h 提现
 * - 4+ 动画：Stagger / CountUp / Hover / 实时 pulse / fadeInUp / slideInRight
 * - 8 大币种储备 + 8 个冷钱包 + 8 份审计报告 + 6 个历史快照 + 4 步教程
 * - 不接真实 API，所有数据 mock 占位
 * - 不修改旧官网 / 旧 H5 / disabled pages
 * - 保持 v6 纯黑无色相 + ZSDEX 绿 primary
 * - 遵循 Q05 高风险合规词硬约束
 */

import React from 'react';
import { PortalReserves } from '@/components/portal-preview/PortalReserves';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '资产储备证明 · 中萨数字科技交易所',
  description:
    '中萨数字科技交易所（ZSDEX）资产储备证明中心：1:1 准备金承诺 / Merkle Tree 验证 / 冷钱包公示 / 第三方审计 / 实时储备率监控。',
  robots: { index: false, follow: false },
};

export default function ReservesPage() {
  return <PortalReserves />;
}
