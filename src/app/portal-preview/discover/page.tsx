/**
 * /portal-preview/discover - 发现中心（2026-07-18）
 * 资产来源：Stitch _24
 */

import React from 'react';
import { PortalSection } from '@/components/portal-preview/PortalSection';
import { PortalDiscoverSection } from '@/components/portal-preview/PortalDiscoverSection';

export const metadata = {
  title: '发现中心 | ZSDEX 中萨数字科技交易所',
  description: '树图生态、新币首发、研报中心、事件日历',
};

export default function PortalPreviewDiscoverPage() {
  return (
    <PortalSection
      eyebrow="DISCOVER"
      title="发现中心"
      description="树图生态项目、新币首发、研究报告与行业事件一站式导航"
      background="bg"
      spacing="lg"
    >
      <PortalDiscoverSection />
    </PortalSection>
  );
}
