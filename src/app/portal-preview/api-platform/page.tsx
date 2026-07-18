import { Metadata } from 'next';
import { PortalApiPlatform } from '@/components/portal-preview/PortalApiPlatform';

export const metadata: Metadata = {
  title: 'API 开放平台 · 中萨数字科技交易所',
  description: '中萨数字科技交易所（ZSDEX）API 开放平台：REST API / WebSocket 实时行情 / 多语言 SDK / 沙盒测试环境 / 完整文档中心。99.99% SLA · 工业级稳定性。',
  robots: { index: false, follow: false },
};

export default function ApiPlatformPage() {
  return <PortalApiPlatform />;
}
