import { Metadata } from 'next';
import { PortalDefi } from '@/components/portal-preview/PortalDefi';

export const metadata: Metadata = {
  title: 'DeFi 流动性挖矿中心 · 中萨数字科技交易所',
  description:
    '中萨数字科技交易所（ZSDEX）DeFi 流动性挖矿中心：流动性池 / 收益农场 / 双币理财 / 锁仓挖矿 / 推荐奖励 / 历史收益 / 申请入驻。构建"资产-衍生-量化-NFT-DeFi"全栈闭环。',
  robots: { index: false, follow: false },
};

export default function DefiPage() {
  return <PortalDefi />;
}
