import { Metadata } from 'next';
import { PortalAggregator } from '@/components/portal-preview/PortalAggregator';

export const metadata: Metadata = {
  title: '跨链互操作与聚合路由中心 · 中萨数字科技交易所',
  description:
    '中萨数字科技交易所（ZSDEX）跨链互操作与聚合路由中心：多链网络 / 跨链桥 / DEX 聚合 / Swap 路由 / 原子交易 / 流动性池 / MEV 保护 / 跨链监控 / 路由策略 / API 接入。构建"桥接-路由-资产"全栈跨链互操作与最优路径执行闭环。',
  robots: { index: false, follow: false },
};

export default function AggregatorPage() {
  return <PortalAggregator />;
}
