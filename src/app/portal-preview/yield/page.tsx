/**
 * P3.49 流动性挖矿与收益聚合中心 - 路由
 * 与 P3.43 流动性再质押 + P3.45 资产组合 + P3.46 智能投顾 形成
 * "质押-组合-投顾-收益聚合" 完整收益能力栈
 */

import { Metadata } from 'next';
import { PortalYield } from '@/components/portal-preview/PortalYield';

export const metadata: Metadata = {
  title: '流动性挖矿与收益聚合中心 · 中萨数字科技交易所',
  description:
    '中萨数字科技交易所（ZSDEX）流动性挖矿与收益聚合中心：单币挖矿 / 流动性池 / 双币理财 / LP 挖矿 / 质押 / 收益聚合器 / 加速卡 / 推荐奖励 / 锁仓 / 收益历史 / 帮助中心。聚合 18 挖矿活动 / 12 流动性池 / 6 双币理财 / 14 LP 挖矿 / 5 收益聚合器 / 80+ 加速卡 / 5 推荐等级，覆盖挖矿全链路能力。',
  robots: { index: false, follow: false },
};

export default function YieldPage() {
  return <PortalYield />;
}
