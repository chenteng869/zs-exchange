/**
 * /portal-preview/launch 路由
 *
 * Q05 P3.7 阶段交付物（2026-07-19）
 * - 07 页面：Launchpad
 * - 8 大区块：Hero / KPI / Tab+搜索+排序 / 项目卡片 / 申购规则阶梯 / FAQ / 项目方入驻 / 安全提示
 * - 4 类交互：搜索 / 排序 / Tab / Drawer (项目详情/申购/规则/入驻) / 快捷键 (1/2/3/4 + / + Esc)
 * - 实时申购进度 ticker 2.5s 漂移 + 倒计时秒级
 * - 8 项目 mock：2 进行中 / 3 即将开始 / 3 已结束
 * - 不接真实 API（mock 占位申购进度 / 倒计时 / 收益）
 * - 不修改旧官网 / 旧 H5 / disabled pages
 * - 保持 v6 纯黑无色相 + ZSDEX 绿 primary
 */

import React from 'react';
import { PortalLaunch } from '@/components/portal-preview/PortalLaunch';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Launchpad · 中萨数字科技交易所',
  description:
    '中萨数字科技交易所 Launchpad 新币发行平台：2 项目进行中申购、3 即将开始、3 已结束回顾，阶梯额度（基础/完整/机构）+ 实时申购进度 + 秒级倒计时。',
  robots: { index: false, follow: false },
};

export default function LaunchPage() {
  return <PortalLaunch />;
}
