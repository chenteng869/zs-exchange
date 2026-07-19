import { Metadata } from 'next';
import { PortalSupport } from '@/components/portal-preview/PortalSupport';

export const metadata: Metadata = {
  title: '客户支持中心 · 中萨数字科技交易所',
  description:
    '中萨数字科技交易所（ZSDEX）7×24 客户支持中心：工单中心 / FAQ 知识库 / 智能客服 / 联系渠道 / 服务状态 / 反馈建议。多语言多渠道支持，服务时效透明。',
  robots: { index: false, follow: false },
};

export default function SupportPage() {
  return <PortalSupport />;
}
