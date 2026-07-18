/**
 * /portal-preview/mobile - H5 移动端预览（2026-07-18）
 * 资产来源：Stitch h5_11
 * 约束：仅静态预览，不接真实 API
 */

import React from 'react';
import { BRAND } from '@/components/portal-preview/brand';
import { PortalMobileHero } from '@/components/portal-preview/PortalMobileHero';
import { PortalMobileBottomTabs } from '@/components/portal-preview/PortalMobileBottomTabs';
import { PortalStatusBadge } from '@/components/portal-preview/PortalStatusBadge';
import { PortalMarketPreview } from '@/components/portal-preview/PortalMarketPreview';
import { PortalProductMatrix } from '@/components/portal-preview/PortalProductMatrix';
import { PortalAnnouncementEntry } from '@/components/portal-preview/PortalAnnouncementEntry';

export const metadata = {
  title: 'ZSDEX H5 移动端 | 中萨数字科技交易所',
  description: 'H5 移动端预览版（内部展示）',
};

export default function PortalPreviewMobilePage() {
  return (
    <div
      className="mx-auto"
      style={{
        maxWidth: 480,
        backgroundColor: BRAND.bg,
        minHeight: 'calc(100vh - 64px)',
        padding: 16,
        paddingBottom: 80,
      }}
    >
      {/* 顶部说明 */}
      <div className="mb-3 flex items-center justify-between">
        <h1 className="text-base font-extrabold" style={{ color: BRAND.text }}>
          H5 移动端预览
        </h1>
        <PortalStatusBadge status="BETA" size="sm" />
      </div>

      <PortalMobileHero />

      <div className="h-3" />

      {/* 行情卡（复用桌面组件） */}
      <PortalMarketPreview />

      <div className="h-3" />

      {/* 功能矩阵 */}
      <h2 className="text-sm font-bold mb-2" style={{ color: BRAND.text }}>
        全部功能
      </h2>
      <PortalProductMatrix />

      <div className="h-3" />

      {/* 公告入口 */}
      <PortalAnnouncementEntry />

      <PortalMobileBottomTabs active="home" />
    </div>
  );
}
