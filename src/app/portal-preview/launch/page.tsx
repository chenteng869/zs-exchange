import { Metadata } from 'next';
import { PortalLaunch } from '@/components/portal-preview/PortalLaunch';

export const metadata: Metadata = {
  title: 'Launch 项目发行 · 中萨数字科技交易所',
  description: '中萨数字科技交易所（ZSDEX）Launch 项目发行中心：当前认购 / 往期项目 / 社区投票上币 / 项目申请 / 排名榜。合规化数字资产发行服务。',
  robots: { index: false, follow: false },
};

export default function LaunchPage() {
  return <PortalLaunch />;
}
