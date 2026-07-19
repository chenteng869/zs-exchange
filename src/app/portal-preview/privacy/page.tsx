import { Metadata } from 'next';
import { PortalPrivacy } from '@/components/portal-preview/PortalPrivacy';

export const metadata: Metadata = {
  title: '隐私与数据合规中心 · 中萨数字科技交易所',
  description:
    '中萨数字科技交易所（ZSDEX）隐私与数据合规中心：个人数据透明 / 授权管理 / Cookie 偏好 / 数据导出 / 数据生命周期 / 监管框架。严格遵守个人信息保护法、GDPR 等数据保护法规。',
  robots: { index: false, follow: false },
};

export default function PrivacyPage() {
  return <PortalPrivacy />;
}
