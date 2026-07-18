/**
 * /portal-preview/about 路由
 *
 * Q05 P3.10 阶段交付物（2026-07-19）
 * - 10 页面：关于我们
 * - 10 大区块：Hero / KPI / 平台简介 / 品牌愿景 / 核心优势 / 发展历程 / 核心团队 / 合作伙伴 / 联系我们 / FAQ
 * - 8 位核心团队成员 + 16+ 合作伙伴 mock + 9 节点发展时间线
 * - 团队详情 Drawer + 合作伙伴详情 Drawer + FAQ 折叠
 * - 不接真实 API（mock 占位团队/合作/时间线数据）
 * - 不修改旧官网 / 旧 H5 / disabled pages
 * - 保持 v6 纯黑无色相 + ZSDEX 绿 primary
 * - 规避高风险合规词：萨摩亚持牌 / MSA / DSAEX-2024-001 / 多牌照 / 战略合资
 */

import React from 'react';
import { PortalAbout } from '@/components/portal-preview/PortalAbout';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '关于我们 · 中萨数字科技交易所',
  description:
    '中萨数字科技交易所（ZSDEX）官方介绍：定义全球数字金融新标准。平台简介 / 品牌愿景 / 核心优势 / 发展历程 / 核心团队 / 合作伙伴 / 联系我们 / 常见问题。',
  robots: { index: false, follow: false },
};

export default function AboutPage() {
  return <PortalAbout />;
}
