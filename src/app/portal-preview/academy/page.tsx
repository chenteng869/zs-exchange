import { Metadata } from 'next';
import { PortalAcademy } from '@/components/portal-preview/PortalAcademy';

export const metadata: Metadata = {
  title: '数字资产学院 · 中萨数字科技交易所',
  description: '中萨数字科技交易所（ZSDEX）数字资产学院：系统化课程 / 视频教程 / 学习路径 / 认证体系 / 实战案例 / 知识图谱。仅供学习研究，不构成投资建议。',
  robots: { index: false, follow: false },
};

export default function AcademyPage() {
  return <PortalAcademy />;
}
