/**
 * P4 核心门户骨架 - 导航与入口配置
 *
 * 任务编号：Q05-FrontPortal-P4-Core-Portal-Skeleton
 * 范围：顶部导航 + 侧栏 + 移动 Tab + 面包屑
 *
 * 本文件为导航菜单数据源，运行时由 PortalHeader / PortalSidebar /
 * PortalMobileBottomTabs / PortalBreadcrumbs 读取。
 *
 * 全部 v6 纯黑无色相配色从 brand.ts 导入，禁止硬编码颜色。
 */

import { BRAND, STATUS } from '../../brand';

export interface P4NavItem {
  /** 菜单 key（唯一） */
  key: string;
  /** 中文标签 */
  label: string;
  /** 目标路由 */
  href: string;
  /** 是否外部链接 */
  external?: boolean;
  /** 是否新窗口 */
  newWindow?: boolean;
  /** 子菜单 */
  children?: P4NavItem[];
  /** 状态徽章 */
  status?: keyof typeof STATUS;
  /** 是否强合规页面（用于显示合规标签） */
  requiresCompliance?: boolean;
  /** 是否隐藏（占位未启用） */
  hidden?: boolean;
}

export interface P4NavGroup {
  /** 分组 key */
  key: string;
  /** 分组中文标签 */
  label: string;
  /** 菜单项 */
  items: P4NavItem[];
}

/**
 * 顶部导航 - 主菜单（一级）
 * 顺序：首页 / 行情 / 交易 / 资产 / 账户 / 机构 / 产业 / 帮助 / 公告 / 规则
 */
export const P4_HEADER_NAV: P4NavItem[] = [
  {
    key: 'home',
    label: '首页',
    href: '/portal-preview',
  },
  {
    key: 'markets',
    label: '行情',
    href: '/portal-preview/markets',
    children: [
      { key: 'markets-overview', label: '行情总览', href: '/portal-preview/markets/overview' },
      { key: 'markets-spot', label: '现货榜单', href: '/portal-preview/markets/spot' },
      { key: 'markets-futures', label: '合约榜单', href: '/portal-preview/markets/futures' },
      { key: 'markets-rankings', label: '涨幅榜', href: '/portal-preview/markets/rankings' },
      { key: 'markets-new', label: '新币榜', href: '/portal-preview/markets/new' },
      { key: 'markets-trending', label: '热搜榜', href: '/portal-preview/markets/trending' },
    ],
  },
  {
    key: 'trade',
    label: '交易',
    href: '/portal-preview/trade',
    children: [
      { key: 'trade-spot', label: '现货交易', href: '/portal-preview/trade/spot' },
      { key: 'trade-futures', label: '合约交易', href: '/portal-preview/trade/futures' },
      { key: 'trade-margin', label: '杠杆交易', href: '/portal-preview/trade/margin' },
      { key: 'trade-fees', label: '交易费率', href: '/portal-preview/trade/fees', requiresCompliance: true },
      { key: 'trade-rules', label: '交易规则', href: '/portal-preview/trade/rules', requiresCompliance: true },
      { key: 'trade-risk', label: '交易风险披露', href: '/portal-preview/trade/risk-disclosure', requiresCompliance: true },
    ],
  },
  {
    key: 'assets',
    label: '资产',
    href: '/portal-preview/assets',
    children: [
      { key: 'assets-overview', label: '资产总览', href: '/portal-preview/assets/overview' },
      { key: 'assets-wallet', label: '钱包', href: '/portal-preview/assets/wallet' },
      { key: 'assets-deposit', label: '充值', href: '/portal-preview/assets/deposit', requiresCompliance: true },
      { key: 'assets-withdraw', label: '提现', href: '/portal-preview/assets/withdraw', requiresCompliance: true },
      { key: 'assets-transfer', label: '转账', href: '/portal-preview/assets/transfer', requiresCompliance: true },
      { key: 'assets-history', label: '历史记录', href: '/portal-preview/assets/history' },
      { key: 'assets-fees', label: '资产费率', href: '/portal-preview/assets/fees', requiresCompliance: true },
      { key: 'assets-risk', label: '资产风险披露', href: '/portal-preview/assets/risk-disclosure', requiresCompliance: true },
    ],
  },
  {
    key: 'account',
    label: '账户',
    href: '/portal-preview/account',
    children: [
      { key: 'account-login', label: '登录', href: '/portal-preview/account/login' },
      { key: 'account-register', label: '注册', href: '/portal-preview/account/register' },
      { key: 'account-kyc', label: 'KYC 认证', href: '/portal-preview/account/kyc', requiresCompliance: true },
      { key: 'account-security', label: '账户安全', href: '/portal-preview/account/security', requiresCompliance: true },
      { key: 'account-devices', label: '设备管理', href: '/portal-preview/account/devices' },
      { key: 'account-anti-phishing', label: '反钓鱼', href: '/portal-preview/account/anti-phishing', requiresCompliance: true },
      { key: 'account-risk', label: '账户风控', href: '/portal-preview/account/risk-control', requiresCompliance: true },
    ],
  },
  {
    key: 'institutional',
    label: '机构',
    href: '/portal-preview/institutional',
    children: [
      { key: 'inst-vip', label: 'VIP 客户', href: '/portal-preview/institutional/vip' },
      { key: 'inst-mm', label: '做市商', href: '/portal-preview/institutional/market-maker' },
      { key: 'inst-project', label: '项目方', href: '/portal-preview/institutional/project' },
      { key: 'inst-api', label: '机构 API', href: '/portal-preview/institutional/api' },
      { key: 'inst-custody', label: '资产托管', href: '/portal-preview/institutional/custody', requiresCompliance: true },
      { key: 'inst-apply', label: '机构申请', href: '/portal-preview/institutional/apply' },
    ],
  },
  {
    key: 'industry',
    label: '产业',
    href: '/portal-preview/industry',
    status: 'HOT',
    children: [
      { key: 'ind-laojiu', label: '福建老酒369', href: '/portal-preview/industry/fujian-laojiu-369', status: 'HOT', requiresCompliance: true },
      { key: 'ind-laojiu-about', label: '老酒369 - 关于', href: '/portal-preview/industry/fujian-laojiu-369/about' },
      { key: 'ind-laojiu-h5', label: '老酒369 - H5 入口', href: '/portal-preview/industry/fujian-laojiu-369/h5' },
      { key: 'ind-laojiu-compliance', label: '老酒369 - 合规', href: '/portal-preview/industry/fujian-laojiu-369/compliance', requiresCompliance: true },
      { key: 'ind-laojiu-risk', label: '老酒369 - 风险披露', href: '/portal-preview/industry/fujian-laojiu-369/risk-disclosure', requiresCompliance: true },
    ],
  },
  {
    key: 'help',
    label: '帮助',
    href: '/portal-preview/help',
  },
  {
    key: 'announcements',
    label: '公告',
    href: '/portal-preview/announcements',
  },
  {
    key: 'legal',
    label: '规则',
    href: '/portal-preview/legal',
    requiresCompliance: true,
  },
];

/**
 * 侧栏导航 - 按页面类型分组
 */
export const P4_SIDEBAR_NAV: Record<string, P4NavGroup[]> = {
  /** 合规披露页侧栏 */
  legal: [
    {
      key: 'legal-pages',
      label: '合规与披露',
      items: [
        { key: 'legal-terms', label: '用户协议', href: '/portal-preview/legal/terms' },
        { key: 'legal-privacy', label: '隐私政策', href: '/portal-preview/legal/privacy' },
        { key: 'legal-cookie', label: 'Cookie 政策', href: '/portal-preview/legal/cookie' },
        { key: 'legal-risk', label: '风险披露', href: '/portal-preview/legal/risk-disclosure' },
        { key: 'legal-disclaimer', label: '免责声明', href: '/portal-preview/legal/disclaimer' },
        { key: 'legal-restricted', label: '限制区域声明', href: '/portal-preview/legal/restricted-regions' },
        { key: 'legal-aml', label: 'AML / KYC 政策', href: '/portal-preview/legal/aml-kyc' },
        { key: 'legal-research', label: '合规研究方向', href: '/portal-preview/legal/compliance-research' },
      ],
    },
  ],
  /** 帮助中心侧栏 */
  help: [
    {
      key: 'help-start',
      label: '入门',
      items: [
        { key: 'help-home', label: '帮助中心', href: '/portal-preview/help' },
        { key: 'help-getting-started', label: '新手入门', href: '/portal-preview/help/getting-started' },
        { key: 'help-faq', label: '常见问题', href: '/portal-preview/help/faq' },
      ],
    },
    {
      key: 'help-account',
      label: '账户与身份',
      items: [
        { key: 'help-account', label: '账户帮助', href: '/portal-preview/help/account' },
        { key: 'help-kyc', label: 'KYC 帮助', href: '/portal-preview/help/kyc' },
        { key: 'help-security', label: '安全帮助', href: '/portal-preview/help/security' },
      ],
    },
    {
      key: 'help-funds',
      label: '资金',
      items: [
        { key: 'help-deposit', label: '充值帮助', href: '/portal-preview/help/deposit' },
        { key: 'help-withdraw', label: '提现帮助', href: '/portal-preview/help/withdraw' },
      ],
    },
    {
      key: 'help-trading',
      label: '交易',
      items: [
        { key: 'help-trading', label: '交易帮助', href: '/portal-preview/help/trading' },
      ],
    },
  ],
  /** 公告侧栏 */
  announcements: [
    {
      key: 'ann-categories',
      label: '公告分类',
      items: [
        { key: 'ann-latest', label: '最新公告', href: '/portal-preview/announcements/latest' },
        { key: 'ann-listings', label: '上新公告', href: '/portal-preview/announcements/listings' },
        { key: 'ann-maintenance', label: '维护公告', href: '/portal-preview/announcements/maintenance' },
        { key: 'ann-rules', label: '规则公告', href: '/portal-preview/announcements/rules' },
        { key: 'ann-risk', label: '风险公告', href: '/portal-preview/announcements/risk' },
      ],
    },
  ],
  /** 产业资产侧栏（含福建老酒369） */
  industry: [
    {
      key: 'ind-overview',
      label: '产业资产',
      items: [
        { key: 'ind-home', label: '产业资产总览', href: '/portal-preview/industry' },
        { key: 'ind-laojiu', label: '福建老酒369', href: '/portal-preview/industry/fujian-laojiu-369', status: 'HOT' },
      ],
    },
    {
      key: 'ind-laojiu-sub',
      label: '福建老酒369',
      items: [
        { key: 'ind-laojiu-about', label: '关于', href: '/portal-preview/industry/fujian-laojiu-369/about' },
        { key: 'ind-laojiu-h5', label: 'H5 入口', href: '/portal-preview/industry/fujian-laojiu-369/h5' },
        { key: 'ind-laojiu-products', label: '产品介绍', href: '/portal-preview/industry/fujian-laojiu-369/products' },
        { key: 'ind-laojiu-compliance', label: '合规说明', href: '/portal-preview/industry/fujian-laojiu-369/compliance', requiresCompliance: true },
        { key: 'ind-laojiu-risk', label: '风险披露', href: '/portal-preview/industry/fujian-laojiu-369/risk-disclosure', requiresCompliance: true },
        { key: 'ind-laojiu-issuance', label: '发行说明', href: '/portal-preview/industry/fujian-laojiu-369/issuance', status: 'SOON' },
        { key: 'ind-laojiu-token', label: '通证说明', href: '/portal-preview/industry/fujian-laojiu-369/token', status: 'SOON' },
      ],
    },
  ],
};

/**
 * 移动端底部 Tab（保留 P3 的 5 个 Tab）
 */
export const P4_MOBILE_TABS: P4NavItem[] = [
  { key: 'tab-home', label: '首页', href: '/portal-preview' },
  { key: 'tab-markets', label: '行情', href: '/portal-preview/markets' },
  { key: 'tab-trade', label: '交易', href: '/portal-preview/trade' },
  { key: 'tab-assets', label: '资产', href: '/portal-preview/assets' },
  { key: 'tab-me', label: '我的', href: '/portal-preview/account' },
];

/**
 * 面包屑 - 路径别名映射
 */
export const P4_BREADCRUMB_LABELS: Record<string, string> = {
  '/portal-preview': '首页',
  '/portal-preview/markets': '行情',
  '/portal-preview/trade': '交易',
  '/portal-preview/assets': '资产',
  '/portal-preview/account': '账户',
  '/portal-preview/institutional': '机构业务',
  '/portal-preview/industry': '产业资产',
  '/portal-preview/help': '帮助中心',
  '/portal-preview/announcements': '公告',
  '/portal-preview/legal': '合规与披露',
  '/portal-preview/industry/fujian-laojiu-369': '福建老酒369',
  '/portal-preview/industry/fujian-laojiu-369/about': '关于',
  '/portal-preview/industry/fujian-laojiu-369/h5': 'H5 入口',
  '/portal-preview/industry/fujian-laojiu-369/products': '产品介绍',
  '/portal-preview/industry/fujian-laojiu-369/issuance': '发行说明',
  '/portal-preview/industry/fujian-laojiu-369/token': '通证说明',
  '/portal-preview/industry/fujian-laojiu-369/compliance': '合规说明',
  '/portal-preview/industry/fujian-laojiu-369/risk-disclosure': '风险披露',
};

/**
 * 福建老酒369 强合规标签配置
 */
export const P4_LAOJIU_369_COMPLIANCE_BADGE: {
  label: string;
  color: string;
  bg: string;
  tooltip: string;
} = {
  label: '首批核心模块',
  color: BRAND.primary,
  bg: BRAND.primaryLt,
  tooltip: '福建老酒369 已在 5000 页架构中前置为首批核心一级模块，本页面仅展示入口级骨架',
};

/**
 * 通过路径生成面包屑
 */
export function buildBreadcrumbs(pathname: string): { label: string; href: string }[] {
  const segments = pathname.split('/').filter(Boolean);
  const crumbs: { label: string; href: string }[] = [];
  let acc = '';
  for (const seg of segments) {
    acc += `/${seg}`;
    const label = P4_BREADCRUMB_LABELS[acc] || seg;
    crumbs.push({ label, href: acc });
  }
  return crumbs;
}

/**
 * 通过 route 查找导航项
 */
export function findNavItemByRoute(route: string, items: P4NavItem[] = P4_HEADER_NAV): P4NavItem | undefined {
  for (const item of items) {
    if (item.href === route) return item;
    if (item.children) {
      const found = findNavItemByRoute(route, item.children);
      if (found) return found;
    }
  }
  return undefined;
}
