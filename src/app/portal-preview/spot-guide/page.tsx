/**
 * /portal-preview/spot-guide - 现货交易教学（2026-07-18）
 * 资产来源：Stitch _17
 * 硬约束：只做教学说明，不进入真实交易
 */

import React from 'react';
import { PortalSection } from '@/components/portal-preview/PortalSection';
import { PortalSpotGuide } from '@/components/portal-preview/PortalSpotGuide';

export const metadata = {
  title: '现货交易教学 | ZSDEX 中萨数字科技交易所',
  description: '从充值到下单的现货交易完整流程教学',
};

export default function PortalPreviewSpotGuidePage() {
  return (
    <PortalSection
      eyebrow="SPOT GUIDE"
      title="现货交易教学"
      description="4 步学会现货交易，从充值到下单再到提现"
      background="white"
      spacing="lg"
    >
      <PortalSpotGuide />
    </PortalSection>
  );
}
