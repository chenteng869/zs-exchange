import { Metadata } from 'next';
import { PortalProvenance } from '@/components/portal-preview/PortalProvenance';

export const metadata: Metadata = {
  title: '链上资产溯源与证明中心 · 中萨数字科技交易所',
  description:
    '中萨数字科技交易所（ZSDEX）链上资产溯源与证明中心：资产注册 / 链上证明 / 跨链锚定 / 审计记录 / 信任节点 / 合规证据 / 资产图谱 / API 集成。构建"桥接-数据-资产-策略"全栈可观测、可验证的链上资产闭环。',
  robots: { index: false, follow: false },
};

export default function ProvenancePage() {
  return <PortalProvenance />;
}
