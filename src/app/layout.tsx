import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { safeJsonLd } from '@/lib/security/xss-guard';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
  // 预加载中文字体 fallback，避免中文页面切换时字体闪烁
  preload: true,
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: '#FFFFFF',
};

export const metadata: Metadata = {
  metadataBase: new URL('https://www.zs-exchange.com'),
  title: {
    default: 'ZS Exchange - 中萨数字科技交易所 | 持续推进合规治理与跨境合规研究',
    template: '%s | ZS Exchange',
  },
  description:
    '中萨数字科技集团旗下，面向国际化场景的数字资产交易与风控服务平台。',
  keywords: [
    'ZS Exchange',
    '中萨数科',
    '数字货币交易所',
    '加密货币',
    '区块链',
    'DeFi',
    'NFT',
    'IDO',
  ],
  authors: [{ name: 'ZS Exchange Team' }],
  openGraph: {
    title: 'ZS Exchange - 中萨数字科技交易所',
    description:
      '中萨数字科技集团旗下，面向国际化场景的数字资产交易与风控服务平台。',
    type: 'website',
    locale: 'zh_CN',
    siteName: 'ZS Exchange 中萨数字科技交易所',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ZS Exchange - 中萨数字科技交易所',
    description:
      '面向国际化场景的数字资产交易与风控服务平台。',
  },
  robots: {
    index: true,
    follow: true,
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'ZS Exchange 中萨数字科技交易所',
  url: 'https://www.zs-exchange.com',
  logo: 'https://www.zs-exchange.com/logo.png',
  description: '面向国际化场景的数字资产交易与风控服务平台',
  address: [
    { '@type': 'PostalAddress', addressLocality: '海口', addressCountry: 'CN' },
    { '@type': 'PostalAddress', addressLocality: 'Apia', addressCountry: 'WS' },
    { '@type': 'PostalAddress', addressLocality: '香港', addressCountry: 'HK' },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }}
        />
      </head>
      <body className={`${inter.variable} font-sans`}>
        {children}
      </body>
    </html>
  );
}
