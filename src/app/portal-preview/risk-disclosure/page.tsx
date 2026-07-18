import type { Metadata } from 'next';
import { PortalRiskDisclosure } from '@/components/portal-preview/PortalRiskDisclosure';

export const metadata: Metadata = {
  title: '数字资产投资风险披露声明 · 中萨数字科技交易所',
  description:
    '中萨数字科技交易所（ZSDEX）数字资产投资风险披露声明中心：8 大风险类别 / 资产风险 / 交易风险 / 历史案例 / 投资者教育 / 风险测评 / 紧急应对。',
  robots: { index: false, follow: false },
};

export default function RiskDisclosurePage() {
  return <PortalRiskDisclosure />;
}
