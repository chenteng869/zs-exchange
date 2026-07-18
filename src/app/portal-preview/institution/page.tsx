/**
 * /portal-preview/institution - 机构服务（2026-07-18）
 * 资产来源：Stitch _12
 * 硬约束：只做介绍，不接 KYB
 */

import React from 'react';
import { PortalSection } from '@/components/portal-preview/PortalSection';
import { PortalInstitutionSection } from '@/components/portal-preview/PortalInstitutionSection';

export const metadata = {
  title: '机构服务 | ZSDEX 中萨数字科技交易所',
  description: '为机构客户提供 OTC、做市、托管、API 等一站式服务',
};

export default function PortalPreviewInstitutionPage() {
  return (
    <PortalSection
      eyebrow="INSTITUTIONAL"
      title="机构服务"
      description="OTC 大宗、做市商计划、资产托管、API 量化、企业账户一应俱全"
      background="white"
      spacing="xl"
    >
      <PortalInstitutionSection />
    </PortalSection>
  );
}
