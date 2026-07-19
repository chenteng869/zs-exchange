import { Metadata } from 'next';
import { PortalValidator } from '@/components/portal-preview/PortalValidator';

export const metadata: Metadata = {
  title: '节点 / 验证人中心 · 中萨数字科技交易所',
  description:
    '中萨数字科技交易所（ZSDEX）节点 / 验证人中心：节点列表 / 质押治理 / 节点监控 / 提案投票 / 验证人详情 / 申请加入。构建"跨链-节点-验证-治理"基础设施 + 治理闭环。',
  robots: { index: false, follow: false },
};

export default function ValidatorPage() {
  return <PortalValidator />;
}
