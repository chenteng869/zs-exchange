import { Metadata } from 'next';
import { PortalMonitor } from '@/components/portal-preview/PortalMonitor';

export const metadata: Metadata = {
  title: '资产安全监控中心 · 中萨数字科技交易所',
  description:
    '中萨数字科技交易所（ZSDEX）资产安全监控中心：实时风控仪表盘 / 异常告警 / 大额监控 / 应急冻结 / 规则引擎 / 审计追溯。内部风险监测与应急处置演示。',
  robots: { index: false, follow: false },
};

export default function MonitorPage() {
  return <PortalMonitor />;
}
