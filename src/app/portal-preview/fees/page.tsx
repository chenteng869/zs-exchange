/**
 * /portal-preview/fees - 费率说明（2026-07-18）
 * 资产来源：Stitch _9
 */

import React from 'react';
import { PortalSection } from '@/components/portal-preview/PortalSection';
import { PortalFeeSection } from '@/components/portal-preview/PortalFeeSection';

export const metadata = {
  title: '费率说明 | ZSDEX 中萨数字科技交易所',
  description: '透明、清晰的费率体系，覆盖现货、合约、OTC 全场景',
};

export default function PortalPreviewFeesPage() {
  return (
    <PortalSection
      eyebrow="FEES"
      title="费率说明"
      description="透明、清晰的费率体系，覆盖现货、合约、OTC 全场景"
      background="white"
      spacing="lg"
    >
      <PortalFeeSection />
    </PortalSection>
  );
}
