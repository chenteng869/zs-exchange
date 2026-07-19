import { Metadata } from 'next';
import { PortalAnalytics } from '@/components/portal-preview/PortalAnalytics';

export const metadata: Metadata = {
  title: '链上数据分析中心 · 中萨数字科技交易所',
  description:
    '中萨数字科技交易所（ZSDEX）链上数据分析中心：市场概览 / 链上指标 / 巨鲸追踪 / DeFi 数据 / NFT 数据 / 跨链数据 / 研究洞察 / 数据 API。构建"节点-跨链-DeFi-NFT-数据洞察"全维度数据闭环。',
  robots: { index: false, follow: false },
};

export default function AnalyticsPage() {
  return <PortalAnalytics />;
}
