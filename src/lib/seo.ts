import type { Metadata } from 'next';

const SITE_URL = 'https://www.zs-exchange.com';
const SITE_NAME = 'ZS Exchange 中萨数字科技交易所';

interface GeneratePageMetadataOptions {
  /** 页面标题 (不含站点名后缀，由 template 自动追加) */
  title: string;
  /** 页面描述 */
  description?: string;
  /** 关键词列表 */
  keywords?: string[];
  /** 页面路径 (相对于根目录, 如 '/about') */
  path?: string;
  /** Open Graph 图片 URL */
  ogImage?: string;
}

/**
 * 生成标准页面 Metadata
 *
 * 统一 ZS Exchange 站点的 SEO 元数据格式，
 * 所有页面应通过此函数生成 metadata 以保持一致性。
 *
 * @example
 * ```tsx
 * export const metadata = generatePageMetadata({
 *   title: '关于我们',
 *   description: '了解 ZS Exchange 的团队与愿景',
 *   path: '/about',
 *   keywords: ['关于', '团队', '愿景'],
 * });
 * ```
 */
export function generatePageMetadata(
  options: GeneratePageMetadataOptions
): Metadata {
  const { title, description, keywords, path, ogImage } = options;

  return {
    title,
    description:
      description ||
      `${title} - ${SITE_NAME}，萨摩亚政府双牌照合规数字资产交易平台。`,
    keywords: keywords?.join(', '),
    openGraph: {
      title,
      description:
        description ||
        `${title} - ${SITE_NAME}，萨摩亚政府双牌照合规数字资产交易平台。`,
      url: `${SITE_URL}${path || ''}`,
      siteName: SITE_NAME,
      locale: 'zh_CN',
      type: 'website' as const,
      ...(ogImage ? { images: [ogImage] } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description:
        description ||
        `${title} - ${SITE_NAME}`,
      ...(ogImage ? { images: [ogImage] } : {}),
    },
    robots: {
      index: true,
      follow: true,
    },
    alternates: {
      canonical: `${SITE_URL}${path || ''}`,
    },
  };
}
