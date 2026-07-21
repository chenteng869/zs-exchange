import { Metadata } from 'next';
import { PortalDeveloper } from '@/components/portal-preview/PortalDeveloper';

export const metadata: Metadata = {
  title: '开发者门户与 SDK 下载中心 · 中萨数字科技交易所',
  description:
    '中萨数字科技交易所（ZSDEX）开发者门户与 SDK 下载中心：API 目录 / SDK 下载 / 沙箱环境 / Webhook 回调 / 限额配额 / 错误码字典 / 接入审核 / 代码示例 / 变更日志 / 服务状态。构建"投顾-机构-开发者生态"完整接入通道。',
  robots: { index: false, follow: false },
};

export default function DeveloperPage() {
  return <PortalDeveloper />;
}
