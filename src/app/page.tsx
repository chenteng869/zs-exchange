import type { Metadata } from 'next';
import { FAQ_DATA } from '@/lib/constants';
import HomepageContent from './HomepageContent';

// ==================== SEO Metadata 配置 ====================
export const metadata: Metadata = {
  title: 'ZS Exchange | 中萨数字科技交易所 — 萨摩亚持牌 · 全球数字金融新枢纽',
  description:
    '持有🇼🇸萨摩亚政府颁发的交易所+证券交易所双牌照。三地协同(海南·萨摩亚·香港)，五大业务引擎驱动。安全、合规、专业的数字资产交易平台。',
  keywords: [
    'ZS Exchange',
    '中萨数科',
    '萨摩亚牌照',
    '数字货币交易所',
    '区块链',
    '加密货币',
  ],
  authors: [{ name: '中萨数字科技集团 / SinoSamoa Digital Technology Group' }],
  openGraph: {
    title: 'ZS Exchange | 中萨数字科技交易所',
    description: '萨摩亚持牌 · 全球数字金融新枢纽',
    type: 'website',
    locale: 'zh_CN',
    siteName: 'ZS Exchange',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ZS Exchange | 中萨数字科技交易所',
    description: '萨摩亚持牌 · 全球数字金融新枢纽',
  },
  robots: {
    index: true,
    follow: true,
  },
};

// ==================== JSON-LD 结构化数据 ====================
function generateJsonLd() {
  // Organization Schema - 集团信息 + 萨摩亚牌照
  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: '中萨数字科技集团 / SinoSamoa Digital Technology Group',
    alternateName: 'ZS Exchange / 中萨数字科技交易所',
    url: 'https://zs-exchange.com',
    logo: 'https://zs-exchange.com/logo.png',
    description:
      '持有萨摩亚政府颁发的数字资产交易所+证券交易所双牌照的全球数字金融新枢纽',
    foundingDate: '2024-01-15',
    address: [
      {
        '@type': 'PostalAddress',
        streetAddress: '海南省海口市龙华区国贸路2号时代广场27层',
        addressLocality: '海口',
        addressRegion: '海南',
        addressCountry: 'CN',
      },
      {
        '@type': 'PostalAddress',
        streetAddress: 'Level 2, Samoa Pacific Centre, Beach Road',
        addressLocality: 'Apia',
        addressCountry: 'WS',
      },
      {
        '@type': 'PostalAddress',
        streetAddress: '香港中环皇后大道中181号新纪元广场低座25楼2501-03室',
        addressLocality: '中环',
        addressRegion: '香港',
        addressCountry: 'HK',
      },
    ],
    contactPoint: [
      {
        '@type': 'ContactPoint',
        telephone: '+86-898-6677-8888',
        contactType: 'customer service',
        availableLanguage: ['Chinese', 'English'],
      },
      {
        '@type': 'ContactPoint',
        telephone: '+685-20-000',
        contactType: 'customer service',
        availableLanguage: ['Chinese', 'English'],
      },
    ],
    sameAs: [
      'https://twitter.com/zsexchange',
      'https://t.me/zsexchange',
      'https://github.com/zsexchange',
    ],
    knowsAbout: [
      {
        '@type': 'Thing',
        name: '萨摩亚数字资产交易所牌照 (DSAEX-2024-001)',
        description: 'Samoa Digital Assets Exchange License - 合法开展加密货币现货、衍生品交易业务',
      },
      {
        '@type': 'Thing',
        name: '萨摩亚证券交易牌照 (DSAST-2024-002)',
        description: 'Samoa Securities Trading License - 可开展STO(证券型代币发行)、数字证券交易等创新业务',
      },
    ],
  };

  // WebSite Schema
  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'ZS Exchange | 中萨数字科技交易所',
    alternateName: '中萨数科',
    url: 'https://zs-exchange.com',
    potentialAction: {
      '@type': 'SearchAction',
      target: 'https://zs-exchange.com/search?q={search_term_string}',
      'query-input': 'required name=search_term_string',
    },
    publisher: {
      '@type': 'Organization',
      name: '中萨数字科技集团',
    },
  };

  // FAQ Schema - 从 FAQ_DATA 动态生成
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQ_DATA.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };

  return [organizationSchema, websiteSchema, faqSchema];
}

// ==================== 首页主组件（服务端） ====================
export default function Home() {
  const jsonLdData = generateJsonLd();

  return (
    <>
      {/* JSON-LD 结构化数据 */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdData) }}
      />

      {/* 客户端首页内容 */}
      <HomepageContent />
    </>
  );
}
