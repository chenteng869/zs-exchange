/**
 * /portal-preview/risk - 风险提示（2026-07-18）
 * 资产来源：Stitch _15
 */

import React from 'react';
import { PortalSection } from '@/components/portal-preview/PortalSection';
import { PortalRiskNotice } from '@/components/portal-preview/PortalRiskNotice';

export const metadata = {
  title: '风险提示 | ZSDEX 中萨数字科技交易所',
  description: '数字资产交易存在重大风险，请理性评估自身风险承受能力',
};

export default function PortalPreviewRiskPage() {
  return (
    <PortalSection
      eyebrow="RISK DISCLOSURE"
      title="风险提示与免责声明"
      description="数字资产交易存在重大风险，请仔细阅读并理性评估自身风险承受能力"
      background="bg"
      spacing="lg"
    >
      <PortalRiskNotice />
    </PortalSection>
  );
}
