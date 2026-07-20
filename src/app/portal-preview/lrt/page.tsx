import { Metadata } from 'next';
import { PortalLrt } from '@/components/portal-preview/PortalLrt';

export const metadata: Metadata = {
  title: '流动性再质押中心 · 中萨数字科技交易所',
  description:
    '中萨数字科技交易所（ZSDEX）流动性再质押中心（LRT）：底层资产 / LST 池 / LRT 协议 / AVS 服务 / 收益层级 / 积分系统 / 跨链再质押 / 风险监控 / 策略组合 / 解质押队列 / API 集成。构建"挖矿-质押-再质押-收益层级-跨链流通"全栈再质押与收益聚合闭环。',
  robots: { index: false, follow: false },
};

export default function LrtPage() {
  return <PortalLrt />;
}
