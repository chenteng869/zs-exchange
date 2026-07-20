import { Metadata } from 'next';
import { PortalPortfolio } from '@/components/portal-preview/PortalPortfolio';

export const metadata: Metadata = {
  title: '资产组合与配置中心 · 中萨数字科技交易所',
  description:
    '中萨数字科技交易所（ZSDEX）资产组合与配置中心：多链资产聚合 / 智能组合管理 / 自动再平衡 / 盈亏归因 / 税务报告 / 风险监控 / 智能策略 / 业绩归因。构建"链上资产→跨链→再质押→现实资产→组合配置→再平衡→税务"全栈资产配置能力栈。',
  robots: { index: false, follow: false },
};

export default function PortfolioPage() {
  return <PortalPortfolio />;
}
