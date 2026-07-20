import { Metadata } from 'next';
import { PortalRwa } from '@/components/portal-preview/PortalRwa';

export const metadata: Metadata = {
  title: 'RWA 现实世界资产中心 · 中萨数字科技交易所',
  description:
    '中萨数字科技交易所（ZSDEX）RWA 现实世界资产中心：底层资产 / 发行方矩阵 / 托管机构 / 合规框架 / 生命周期事件 / 收益分配 / 预言机估值 / 流动性池 / 风险监控 / API 集成。构建"链下资产→上链→再质押→跨链流通→收益"全栈 RWA 能力栈。',
  robots: { index: false, follow: false },
};

export default function RwaPage() {
  return <PortalRwa />;
}
