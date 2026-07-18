/**
 * /portal-preview/about - 关于我们（2026-07-18）
 * 资产来源：Stitch _10
 */

import React from 'react';
import { PortalSection } from '@/components/portal-preview/PortalSection';
import { PortalAboutSection } from '@/components/portal-preview/PortalAboutSection';

export const metadata = {
  title: '关于我们 | ZSDEX 中萨数字科技交易所',
  description: '了解中萨数字科技交易所的使命、价值观与发展历程',
};

export default function PortalPreviewAboutPage() {
  return (
    <PortalSection background="white" spacing="xl" containerClassName="max-w-5xl">
      <PortalAboutSection />
    </PortalSection>
  );
}
