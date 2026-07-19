import { Metadata } from 'next';
import { PortalMaker } from '@/components/portal-preview/PortalMaker';

export const metadata: Metadata = {
  title: '做市商与流动性中心 · 中萨数字科技交易所',
  description:
    '中萨数字科技交易所（ZSDEX）做市商与流动性中心：做市商体系 / 流动性池 / 报价深度 / 流动性挖矿 / 跟单做市 / 费率体系 / 申请入驻。构建"做市-API-发行-生态-流动性"五方协同闭环。',
  robots: { index: false, follow: false },
};

export default function MakerPage() {
  return <PortalMaker />;
}
