/**
 * /portal-preview/kyc-guide - KYC 教学（2026-07-18）
 * 资产来源：Stitch _16
 * 硬约束：只做流程说明，不接真实 KYC
 */

import React from 'react';
import { PortalSection } from '@/components/portal-preview/PortalSection';
import { PortalKycGuide } from '@/components/portal-preview/PortalKycGuide';

export const metadata = {
  title: 'KYC 实名认证教学 | ZSDEX 中萨数字科技交易所',
  description: '实名认证流程教学与等级说明',
};

export default function PortalPreviewKycGuidePage() {
  return (
    <PortalSection
      eyebrow="KYC GUIDE"
      title="实名认证教学"
      description="4 步完成 KYC，畅享完整服务"
      background="white"
      spacing="lg"
    >
      <PortalKycGuide />
    </PortalSection>
  );
}
