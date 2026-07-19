import { Metadata } from 'next';
import { PortalNft } from '@/components/portal-preview/PortalNft';

export const metadata: Metadata = {
  title: 'NFT 数字藏品中心 · 中萨数字科技交易所',
  description:
    '中萨数字科技交易所（ZSDEX）NFT 数字藏品中心：藏品发行 / 二级市场 / 创作者中心 / 拍卖行 / 盲盒 / IP 合作。构建"发行-市场-生态-IP"创意资产生态闭环。',
  robots: { index: false, follow: false },
};

export default function NftPage() {
  return <PortalNft />;
}
