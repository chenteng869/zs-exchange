import { Metadata } from 'next';
import { PortalAdvisor } from '@/components/portal-preview/PortalAdvisor';

export const metadata: Metadata = {
  title: '智能投顾与策略订阅中心 · 中萨数字科技交易所',
  description:
    '中萨数字科技交易所（ZSDEX）智能投顾与策略订阅中心：Robo / 人工 / 混合投顾 / 策略订阅 / 信号分发 / 跟单 / 回测 / 风险分析 / 资产配置 / 执行 / 订阅者 / 报告。构建"策略-组合-投顾"AI 闭环。',
  robots: { index: false, follow: false },
};

export default function AdvisorPage() {
  return <PortalAdvisor />;
}
