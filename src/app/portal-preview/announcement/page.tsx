/**
 * /portal-preview/announcement 路由
 *
 * Q05 P3.9 阶段交付物（2026-07-19）
 * - 09 页面：公告中心
 * - 4 大分类：最新 / 上币 / 系统维护 / 活动
 * - 12+ 公告 mock 数据 + 详情 Drawer + 系统运行状态实时面板
 * - 搜索 / 标签过滤 / 排序 / 置顶 / 热门 Top / 分页
 * - 不接真实 API（mock 占位公告数据）
 * - 不修改旧官网 / 旧 H5 / disabled pages
 * - 保持 v6 纯黑无色相 + ZSDEX 绿 primary
 */

import React from 'react';
import { PortalAnnouncement } from '@/components/portal-preview/PortalAnnouncement';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '公告中心 · 中萨数字科技交易所',
  description:
    '中萨数字科技交易所公告中心：上币动态 / 系统维护 / 活动福利 / 政策更新四大类统一入口，12+ 公告详情、热门 Top5、系统运行状态实时面板。',
  robots: { index: false, follow: false },
};

export default function AnnouncementPage() {
  return <PortalAnnouncement />;
}
