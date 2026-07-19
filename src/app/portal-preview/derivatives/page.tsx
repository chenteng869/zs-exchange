import { Metadata } from 'next';
import { PortalDerivatives } from '@/components/portal-preview/PortalDerivatives';

export const metadata: Metadata = {
  title: '衍生品交易中心 · 中萨数字科技交易所',
  description:
    '中萨数字科技交易所（ZSDEX）衍生品交易中心：永续合约 / 交割合约 / 加密期权 / 资金费率 / 强平监控 / 量化策略 / 申请接入。构建"现货-合约-做市"三角协同闭环。',
  robots: { index: false, follow: false },
};

export default function DerivativesPage() {
  return <PortalDerivatives />;
}
