/**
 * /portal-preview/institution 路由
 *
 * Q05 P3.12 阶段交付物（2026-07-19）
 * - 12 页面：机构服务终端
 * - 9 大区块：Hero / 实时 KPI / 产品矩阵 / 服务等级 / 实时流动性 / API 能力 / KYB 流程 / 合作伙伴 / FAQ
 * - 8+ 交互：搜索 / 排序 / Tab 切换 / 分类过滤 / FAQ 折叠 / 详情 Drawer / 快捷键 / 回到顶部
 * - 5+ Drawer：产品详情 / 套餐详情 / API 详情 / 伙伴详情 / 流程步骤详情
 * - 4+ 实时数据：连接数 / 延迟 / 订单 / AUM（每 2.5s 漂移）
 * - 4+ 动画：Stagger / CountUp / Hover / 实时 pulse
 * - 8 个机构产品 + 4 个服务等级 + 16 家全球伙伴 + 12 个 FAQ
 * - 不接真实 API，所有数据 mock 占位
 * - 不修改旧官网 / 旧 H5 / disabled pages
 * - 保持 v6 纯黑无色相 + ZSDEX 绿 primary
 * - 遵循 Q05 高风险合规词硬约束
 */

import React from 'react';
import { PortalInstitution } from '@/components/portal-preview/PortalInstitution';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '机构服务 · 中萨数字科技交易所',
  description:
    '中萨数字科技交易所（ZSDEX）机构服务终端：OTC 大宗交易 / 做市商计划 / 多签资产托管 / API 量化 / KYB 认证 / 全球服务伙伴。',
  robots: { index: false, follow: false },
};

export default function InstitutionPage() {
  return <PortalInstitution />;
}
