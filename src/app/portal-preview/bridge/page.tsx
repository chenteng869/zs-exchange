import { Metadata } from 'next';
import { PortalBridge } from '@/components/portal-preview/PortalBridge';

export const metadata: Metadata = {
  title: '跨链桥中心 · 中萨数字科技交易所',
  description:
    '中萨数字科技交易所（ZSDEX）跨链桥中心：跨链桥 / 跨链路线 / 流动性 / 验证节点 / 桥接资产 / 历史交易 / 申请接入。构建"资产-衍生-量化-NFT-DeFi-跨链"全栈闭环。',
  robots: { index: false, follow: false },
};

export default function BridgePage() {
  return <PortalBridge />;
}
