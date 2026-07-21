import { Metadata } from 'next';
import { PortalInstitution } from '@/components/portal-preview/PortalInstitution';

export const metadata: Metadata = {
  title: '机构服务与做市商合作中心 · 中萨数字科技交易所',
  description:
    '中萨数字科技交易所（ZSDEX）机构服务与做市商合作中心：机构准入 / KYB 审核 / PB 交易 / 信用额度 / 大宗撮合 / 流动性分成 / 报告白盒 / 风险对冲 / 联合做市 / API 接入。构建"做市-衍生-机构-AI 投顾"完整机构服务能力栈。',
  robots: { index: false, follow: false },
};

export default function InstitutionPage() {
  return <PortalInstitution />;
}
