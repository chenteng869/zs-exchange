/**
 * /portal-preview/announcements - 公告中心（2026-07-18）
 * 资产来源：Stitch _8
 * 硬约束：只做静态入口，不接真实 API
 */

import React from 'react';
import { PortalSection } from '@/components/portal-preview/PortalSection';
import { PortalAnnouncementList } from '@/components/portal-preview/PortalAnnouncementList';

export const metadata = {
  title: '公告中心 | ZSDEX 中萨数字科技交易所',
  description: '平台公告、业务通知与透明度报告',
};

export default function PortalPreviewAnnouncementsPage() {
  return (
    <PortalSection
      eyebrow="ANNOUNCEMENTS"
      title="公告中心"
      description="平台公告、业务通知、透明报告的统一入口"
      background="bg"
      spacing="lg"
    >
      <PortalAnnouncementList />
    </PortalSection>
  );
}
