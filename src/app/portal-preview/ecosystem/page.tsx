import { Metadata } from 'next';
import { PortalEcosystem } from '@/components/portal-preview/PortalEcosystem';

export const metadata: Metadata = {
  title: '生态合作中心 · 中萨数字科技交易所',
  description:
    '中萨数字科技交易所（ZSDEX）生态合作中心：节点生态 / 生态合作伙伴 / 流动性提供方 / 生态基金 / 生态活动 / 合作申请。构建"机构-API-发行-生态"四方协同闭环。',
  robots: { index: false, follow: false },
};

export default function EcosystemPage() {
  return <PortalEcosystem />;
}
