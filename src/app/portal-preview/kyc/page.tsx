import { Metadata } from 'next';
import { PortalKyc } from '@/components/portal-preview/PortalKyc';

export const metadata: Metadata = {
  title: 'KYC/实名认证中心 · 中萨数字科技交易所',
  description:
    '中萨数字科技交易所（ZSDEX）KYC/实名认证中心：个人认证 / 企业 KYB / 高级认证 / 多因子认证 / 认证状态 / 资料管理。仅作为合规研究方向参考，不构成任何监管认证承诺。',
  robots: { index: false, follow: false },
};

export default function KycPage() {
  return <PortalKyc />;
}
