import type { Metadata } from 'next';
import { PortalCompliance } from '@/components/portal-preview/PortalCompliance';

export const metadata: Metadata = {
  title: '合规与透明度研究中心 · 中萨数字科技交易所',
  description:
    '中萨数字科技交易所（ZSDEX）合规与透明度研究中心：全球合规研究方向 / AML·CFT 政策 / 隐私保护 / 风险管理 / 合规公告 / 研究合作网络。',
  robots: { index: false, follow: false },
};

export default function CompliancePage() {
  return <PortalCompliance />;
}
