/**
 * P5.0 核心产品矩阵 - 导航与入口矩阵
 *
 * 任务编号：Q05-FrontPortal-P5.0-Core-Product-Matrix-Plan
 * 范围：P5 1000 页的导航矩阵规划
 *
 * 本文件仅作为 P5.0 阶段规划级导航矩阵，**不接入**现有页面 runtime。
 * 真实运行期导航由 P4 既有 `p4-navigation.ts` 承担，本文件供 P5.1+ 阶段扩展使用。
 *
 * 全部 v6 纯黑无色相配色从 brand.ts 导入，禁止硬编码颜色。
 */

import type { P5BatchId, P5Domain } from './p5-core-pages';

export interface P5NavItem {
  /** 菜单 key（唯一） */
  key: string;
  /** 中文标签 */
  label: string;
  /** 目标路由 */
  href: string;
  /** 是否外部链接 */
  external?: boolean;
  /** 子菜单 */
  children?: P5NavItem[];
  /** 是否强合规页面（用于显示合规标签） */
  requiresCompliance?: boolean;
  /** 是否隐藏（占位未启用） */
  hidden?: boolean;
  /** 关联 batch（用于追踪） */
  relatedBatch?: P5BatchId;
}

export interface P5DomainNavGroup {
  /** 一级域 */
  domain: P5Domain;
  /** 域中文标签 */
  label: string;
  /** 路由前缀 */
  routePrefix: string;
  /** 关联 batch */
  relatedBatches: P5BatchId[];
  /** 菜单项 */
  items: P5NavItem[];
}

/**
 * P5.0 阶段导航矩阵（按一级域分组）
 *
 * 不在此处实现 runtime 导航。P5.1 起按 batch 接入 PortalHeader 等组件。
 */
export const P5_DOMAIN_NAV_GROUPS: readonly P5DomainNavGroup[] = [
  {
    domain: 'markets',
    label: '行情与市场',
    routePrefix: '/portal-preview/markets',
    relatedBatches: ['P5-B01'],
    items: [
      { key: 'markets-overview', label: '行情总览', href: '/portal-preview/markets' },
      { key: 'markets-spot', label: '现货榜单', href: '/portal-preview/markets/spot' },
      { key: 'markets-futures', label: '合约榜单', href: '/portal-preview/markets/futures' },
      { key: 'markets-rankings', label: '涨幅榜', href: '/portal-preview/markets/rankings' },
    ],
  },
  {
    domain: 'products',
    label: '交易产品',
    routePrefix: '/portal-preview/products',
    relatedBatches: ['P5-B01'],
    items: [
      { key: 'products-overview', label: '产品总览', href: '/portal-preview/products' },
      { key: 'products-spot', label: '现货产品', href: '/portal-preview/products/spot' },
      { key: 'products-futures', label: '合约产品', href: '/portal-preview/products/futures' },
      { key: 'products-options', label: '期权产品', href: '/portal-preview/products/options' },
    ],
  },
  {
    domain: 'assets',
    label: '资产',
    routePrefix: '/portal-preview/assets',
    relatedBatches: ['P5-B01'],
    items: [
      { key: 'assets-overview', label: '资产总览', href: '/portal-preview/assets' },
      { key: 'assets-deposit', label: '充值说明', href: '/portal-preview/assets/deposit' },
      { key: 'assets-withdraw', label: '提现说明', href: '/portal-preview/assets/withdraw' },
    ],
  },
  {
    domain: 'account',
    label: '账户',
    routePrefix: '/portal-preview/account',
    relatedBatches: ['P5-B01', 'P5-B02'],
    items: [
      { key: 'account-overview', label: '账户中心', href: '/portal-preview/account' },
      { key: 'account-profile', label: '个人资料', href: '/portal-preview/account/profile' },
      { key: 'account-auth', label: '登录/注册', href: '/portal-preview/account/auth' },
    ],
  },
  {
    domain: 'security',
    label: '安全',
    routePrefix: '/portal-preview/security',
    relatedBatches: ['P5-B02'],
    items: [
      { key: 'security-overview', label: '安全中心', href: '/portal-preview/security' },
      { key: 'security-2fa', label: '双重验证', href: '/portal-preview/security/2fa' },
      { key: 'security-passkey', label: 'Passkey', href: '/portal-preview/security/passkey' },
    ],
  },
  {
    domain: 'compliance',
    label: '合规',
    routePrefix: '/portal-preview/compliance',
    relatedBatches: ['P5-B02', 'P5-B04'],
    items: [
      { key: 'compliance-overview', label: '合规中心', href: '/portal-preview/compliance' },
      { key: 'compliance-kyc', label: 'KYC 流程', href: '/portal-preview/compliance/kyc' },
      { key: 'compliance-aml', label: 'AML 政策', href: '/portal-preview/compliance/aml' },
    ],
  },
  {
    domain: 'help',
    label: '帮助',
    routePrefix: '/portal-preview/help',
    relatedBatches: ['P5-B03'],
    items: [
      { key: 'help-overview', label: '帮助中心', href: '/portal-preview/help' },
      { key: 'help-faq', label: 'FAQ', href: '/portal-preview/help/faq' },
      { key: 'help-guides', label: '新手指南', href: '/portal-preview/help/guides' },
    ],
  },
  {
    domain: 'announcements',
    label: '公告',
    routePrefix: '/portal-preview/announcements',
    relatedBatches: ['P5-B03'],
    items: [
      { key: 'announcements-list', label: '公告列表', href: '/portal-preview/announcements' },
      { key: 'announcements-maintenance', label: '系统维护', href: '/portal-preview/announcements/maintenance' },
      { key: 'announcements-upgrade', label: '升级通知', href: '/portal-preview/announcements/upgrade' },
    ],
  },
  {
    domain: 'legal',
    label: '法务',
    routePrefix: '/portal-preview/legal',
    relatedBatches: ['P5-B04'],
    items: [
      { key: 'legal-overview', label: '法务总览', href: '/portal-preview/legal' },
      { key: 'legal-terms', label: '用户协议', href: '/portal-preview/legal/terms' },
      { key: 'legal-privacy', label: '隐私政策', href: '/portal-preview/legal/privacy' },
      { key: 'legal-cookie', label: 'Cookie 政策', href: '/portal-preview/legal/cookie' },
      { key: 'legal-risk', label: '风险披露', href: '/portal-preview/legal/risk-disclosure' },
    ],
  },
  {
    domain: 'institutional',
    label: '机构业务',
    routePrefix: '/portal-preview/institutional',
    relatedBatches: ['P5-B06'],
    items: [
      { key: 'institutional-overview', label: '机构业务总览', href: '/portal-preview/institutional' },
      { key: 'institutional-custody', label: '托管服务', href: '/portal-preview/institutional/custody' },
      { key: 'institutional-mm', label: '做市商', href: '/portal-preview/institutional/market-maker' },
    ],
  },
  {
    domain: 'api',
    label: 'API',
    routePrefix: '/portal-preview/api',
    relatedBatches: ['P5-B06'],
    items: [
      { key: 'api-overview', label: 'API 总览', href: '/portal-preview/api' },
      { key: 'api-rest', label: 'REST API', href: '/portal-preview/api/rest' },
      { key: 'api-websocket', label: 'WebSocket API', href: '/portal-preview/api/websocket' },
      { key: 'api-sdks', label: 'SDK 下载', href: '/portal-preview/api/sdks' },
    ],
  },
  {
    domain: 'research',
    label: '研究院',
    routePrefix: '/portal-preview/research',
    relatedBatches: ['P5-B07'],
    items: [
      { key: 'research-overview', label: '研究院总览', href: '/portal-preview/research' },
      { key: 'research-reports', label: '研报中心', href: '/portal-preview/research/reports' },
      { key: 'research-glossary', label: '术语表', href: '/portal-preview/research/glossary' },
    ],
  },
  {
    domain: 'academy',
    label: '学院',
    routePrefix: '/portal-preview/academy',
    relatedBatches: ['P5-B07'],
    items: [
      { key: 'academy-overview', label: '学院总览', href: '/portal-preview/academy' },
      { key: 'academy-tutorials', label: '教程', href: '/portal-preview/academy/tutorials' },
      { key: 'academy-courses', label: '课程', href: '/portal-preview/academy/courses' },
    ],
  },
  {
    domain: 'industry',
    label: '产业资产',
    routePrefix: '/portal-preview/industry',
    relatedBatches: ['P5-B05', 'P5-B08'],
    items: [
      { key: 'industry-overview', label: '产业资产总览', href: '/portal-preview/industry' },
      { key: 'industry-rwa', label: 'RWA 资产', href: '/portal-preview/industry/rwa' },
      { key: 'industry-supply', label: '供应链', href: '/portal-preview/industry/supply-chain' },
    ],
  },
  {
    domain: 'fujian-laojiu-369',
    label: '福建老酒369',
    routePrefix: '/portal-preview/industry/fujian-laojiu-369',
    relatedBatches: ['P5-B05'],
    items: [
      { key: 'laojiu-overview', label: '老酒369 总览', href: '/portal-preview/industry/fujian-laojiu-369' },
      { key: 'laojiu-about', label: '关于老酒369', href: '/portal-preview/industry/fujian-laojiu-369/about' },
      { key: 'laojiu-products', label: '产品介绍', href: '/portal-preview/industry/fujian-laojiu-369/products' },
      { key: 'laojiu-risk', label: '风险披露', href: '/portal-preview/industry/fujian-laojiu-369/risk-disclosure' },
    ],
  },
  {
    domain: 'regions',
    label: '区域市场',
    routePrefix: '/portal-preview/regions',
    relatedBatches: ['P5-B09'],
    items: [
      { key: 'regions-overview', label: '区域市场总览', href: '/portal-preview/regions' },
      { key: 'regions-asia', label: '亚洲市场', href: '/portal-preview/regions/asia' },
      { key: 'regions-europe', label: '欧洲市场', href: '/portal-preview/regions/europe' },
      { key: 'regions-americas', label: '美洲市场', href: '/portal-preview/regions/americas' },
    ],
  },
  {
    domain: 'status',
    label: '状态',
    routePrefix: '/portal-preview/status',
    relatedBatches: ['P5-B10'],
    items: [
      { key: 'status-404', label: '404 未找到', href: '/portal-preview/status/404' },
      { key: 'status-500', label: '500 服务异常', href: '/portal-preview/status/500' },
      { key: 'status-maintenance', label: '系统维护', href: '/portal-preview/status/maintenance' },
      { key: 'status-sitemap', label: 'Sitemap', href: '/portal-preview/status/sitemap' },
    ],
  },
] as const;

/** P5 一级域导航（运行时取用版本） */
export type P5DomainNavigation = typeof P5_DOMAIN_NAV_GROUPS[number];
