import { Metadata } from 'next';
import { PortalSecurity } from '@/components/portal-preview/PortalSecurity';

export const metadata: Metadata = {
  title: '安全中心 · 中萨数字科技交易所',
  description: '中萨数字科技交易所（ZSDEX）安全中心：7x24 SOC 安全运营 / 实时威胁监测 / 多因素认证 / 资产多重保护 / 风控规则引擎 / 应急响应通道。',
  robots: { index: false, follow: false },
};

export default function SecurityPage() {
  return <PortalSecurity />;
}
