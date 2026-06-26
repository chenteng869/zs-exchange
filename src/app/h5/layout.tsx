/**
 * H5 移动端独立布局
 * 特点：
 *   - 顶部安全区适配
 *   - 极光玻璃卡片
 *   - 底部 Tab 固定导航
 *   - 隐藏 PC 端 Navbar
 *   - 包装 wagmi/viem Provider（Web3 钱包）
 */
import { ReactNode } from 'react';
import H5Layout from '@/components/h5/H5Layout';
import { H5ClientProviders } from '@/components/h5/H5ClientProviders';

export const metadata = {
  title: 'ZS Exchange H5 - 移动版',
  description: 'ZS Exchange 移动端，随时随地数字资产交易',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#0F1B3D',
};

export default function H5RootLayout({ children }: { children: ReactNode }) {
  return (
    <H5ClientProviders>
      <H5Layout>{children}</H5Layout>
    </H5ClientProviders>
  );
}
