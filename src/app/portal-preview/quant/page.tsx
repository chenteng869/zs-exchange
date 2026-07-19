import { Metadata } from 'next';
import { PortalQuant } from '@/components/portal-preview/PortalQuant';

export const metadata: Metadata = {
  title: '量化交易中心 · 中萨数字科技交易所',
  description:
    '中萨数字科技交易所（ZSDEX）量化交易中心：策略商城 / 信号订阅 / 跟单做市 / 量化赛事 / 策略开发 / 历史业绩 / 申请入驻。构建"现货-合约-做市-量化"四元协同闭环。',
  robots: { index: false, follow: false },
};

export default function QuantPage() {
  return <PortalQuant />;
}
