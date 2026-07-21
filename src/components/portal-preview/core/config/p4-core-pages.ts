/**
 * P4 核心门户骨架 - 300 页页面清单配置
 *
 * 任务编号：Q05-FrontPortal-P4-Core-Portal-Skeleton
 * 范围：A-J 共 10 个模块，300 页核心门户骨架
 * 编号：P4-0001 ~ P4-0300
 *
 * 本文件仅作为清单与元数据存储，不实现真实页面。
 * 真实骨架页面在 src/app/portal-preview/.../page.tsx 中按需实现。
 *
 * 字段说明详见 docs/front-portal/q05/p4-core-portal-skeleton-plan.md 第 4.3 节
 */

export type P4Module = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H' | 'I' | 'J';

export type P4PageType =
  | 'entry'        // 入口聚合
  | 'detail'       // 详情页
  | 'list'         // 列表页
  | 'form'         // 表单页
  | 'info'         // 说明页
  | 'status';      // 状态页（404/维护中/即将开放）

export interface P4PageMeta {
  /** P4-XXXX 编号 */
  id: string;
  /** 所属模块 A-J */
  module: P4Module;
  /** 页面标题（中文） */
  title: string;
  /** URL slug */
  slug: string;
  /** 完整路由（含动态段） */
  route: string;
  /** 页面类型 */
  pageType: P4PageType;
  /** 是否手写页面 */
  isHandwritten: boolean;
  /** 是否基于模板生成 */
  isTemplate: boolean;
  /** 是否内容驱动（MDX/Markdown/JSON） */
  isContentDriven: boolean;
  /** 是否需要登录态 */
  requiresAuth: boolean;
  /** 是否资金相关 */
  isFundsRelated: boolean;
  /** 是否交易相关 */
  isTradingRelated: boolean;
  /** 是否 KYC 相关 */
  isKycRelated: boolean;
  /** 是否强合规审核 */
  requiresStrictCompliance: boolean;
  /** 是否可静态预览（无需后端） */
  canStaticPreview: boolean;
  /** 是否纳入 sitemap */
  includeInSitemap: boolean;
  /** 简短说明 */
  description?: string;
}

export const P4_PAGES: P4PageMeta[] = [
  // ========== A. 首页与品牌门户 0001-0030 ==========
  { id: 'P4-0001', module: 'A', title: '首页门户', slug: '', route: '/portal-preview', pageType: 'entry', isHandwritten: true, isTemplate: true, isContentDriven: false, requiresAuth: false, isFundsRelated: false, isTradingRelated: false, isKycRelated: false, requiresStrictCompliance: false, canStaticPreview: true, includeInSitemap: true, description: '首页总入口' },
  { id: 'P4-0002', module: 'A', title: '关于我们', slug: 'about', route: '/portal-preview/about', pageType: 'info', isHandwritten: false, isTemplate: true, isContentDriven: true, requiresAuth: false, isFundsRelated: false, isTradingRelated: false, isKycRelated: false, requiresStrictCompliance: false, canStaticPreview: true, includeInSitemap: true },
  { id: 'P4-0003', module: 'A', title: '产品矩阵', slug: 'products', route: '/portal-preview/products', pageType: 'list', isHandwritten: false, isTemplate: true, isContentDriven: false, requiresAuth: false, isFundsRelated: false, isTradingRelated: false, isKycRelated: false, requiresStrictCompliance: false, canStaticPreview: true, includeInSitemap: true },
  { id: 'P4-0004', module: 'A', title: '生态系统', slug: 'ecosystem', route: '/portal-preview/ecosystem', pageType: 'info', isHandwritten: false, isTemplate: true, isContentDriven: true, requiresAuth: false, isFundsRelated: false, isTradingRelated: false, isKycRelated: false, requiresStrictCompliance: false, canStaticPreview: true, includeInSitemap: true },
  { id: 'P4-0005', module: 'A', title: 'App 下载', slug: 'download', route: '/portal-preview/download', pageType: 'info', isHandwritten: false, isTemplate: true, isContentDriven: false, requiresAuth: false, isFundsRelated: false, isTradingRelated: false, isKycRelated: false, requiresStrictCompliance: false, canStaticPreview: true, includeInSitemap: true },
  { id: 'P4-0006', module: 'A', title: '联系我们', slug: 'contact', route: '/portal-preview/contact', pageType: 'info', isHandwritten: false, isTemplate: true, isContentDriven: false, requiresAuth: false, isFundsRelated: false, isTradingRelated: false, isKycRelated: false, requiresStrictCompliance: false, canStaticPreview: true, includeInSitemap: true },
  { id: 'P4-0007', module: 'A', title: '品牌故事', slug: 'brand', route: '/portal-preview/brand', pageType: 'info', isHandwritten: false, isTemplate: true, isContentDriven: true, requiresAuth: false, isFundsRelated: false, isTradingRelated: false, isKycRelated: false, requiresStrictCompliance: false, canStaticPreview: true, includeInSitemap: true },
  { id: 'P4-0008', module: 'A', title: '安全中心', slug: 'security', route: '/portal-preview/security', pageType: 'info', isHandwritten: false, isTemplate: true, isContentDriven: true, requiresAuth: false, isFundsRelated: false, isTradingRelated: false, isKycRelated: false, requiresStrictCompliance: true, canStaticPreview: true, includeInSitemap: true },
  { id: 'P4-0009', module: 'A', title: '机构业务', slug: 'institutional', route: '/portal-preview/institutional', pageType: 'entry', isHandwritten: false, isTemplate: true, isContentDriven: false, requiresAuth: false, isFundsRelated: false, isTradingRelated: false, isKycRelated: false, requiresStrictCompliance: false, canStaticPreview: true, includeInSitemap: true },
  { id: 'P4-0010', module: 'A', title: '全球布局', slug: 'global', route: '/portal-preview/global', pageType: 'info', isHandwritten: false, isTemplate: true, isContentDriven: true, requiresAuth: false, isFundsRelated: false, isTradingRelated: false, isKycRelated: false, requiresStrictCompliance: true, canStaticPreview: true, includeInSitemap: true, description: '仅展示"重点市场与合规研究方向"，禁止表达为已持牌/已监管' },
  // P4-0011 ~ P4-0030 规划占位（不展开）

  // ========== B. 行情与市场入口 0031-0070 ==========
  { id: 'P4-0031', module: 'B', title: '行情总览', slug: 'markets', route: '/portal-preview/markets', pageType: 'entry', isHandwritten: true, isTemplate: true, isContentDriven: false, requiresAuth: false, isFundsRelated: false, isTradingRelated: false, isKycRelated: false, requiresStrictCompliance: false, canStaticPreview: true, includeInSitemap: true, description: '行情入口聚合页' },
  { id: 'P4-0032', module: 'B', title: '行情总览-详情', slug: 'markets/overview', route: '/portal-preview/markets/overview', pageType: 'list', isHandwritten: false, isTemplate: true, isContentDriven: false, requiresAuth: false, isFundsRelated: false, isTradingRelated: false, isKycRelated: false, requiresStrictCompliance: false, canStaticPreview: true, includeInSitemap: true },
  { id: 'P4-0033', module: 'B', title: '现货榜单', slug: 'markets/spot', route: '/portal-preview/markets/spot', pageType: 'list', isHandwritten: false, isTemplate: true, isContentDriven: false, requiresAuth: false, isFundsRelated: false, isTradingRelated: false, isKycRelated: false, requiresStrictCompliance: false, canStaticPreview: true, includeInSitemap: true },
  { id: 'P4-0034', module: 'B', title: '合约榜单', slug: 'markets/futures', route: '/portal-preview/markets/futures', pageType: 'list', isHandwritten: false, isTemplate: true, isContentDriven: false, requiresAuth: false, isFundsRelated: false, isTradingRelated: false, isKycRelated: false, requiresStrictCompliance: false, canStaticPreview: true, includeInSitemap: true },
  { id: 'P4-0035', module: 'B', title: '涨幅榜', slug: 'markets/rankings', route: '/portal-preview/markets/rankings', pageType: 'list', isHandwritten: false, isTemplate: true, isContentDriven: false, requiresAuth: false, isFundsRelated: false, isTradingRelated: false, isKycRelated: false, requiresStrictCompliance: false, canStaticPreview: true, includeInSitemap: true },
  { id: 'P4-0036', module: 'B', title: '新币榜', slug: 'markets/new', route: '/portal-preview/markets/new', pageType: 'list', isHandwritten: false, isTemplate: true, isContentDriven: false, requiresAuth: false, isFundsRelated: false, isTradingRelated: false, isKycRelated: false, requiresStrictCompliance: false, canStaticPreview: true, includeInSitemap: true },
  { id: 'P4-0037', module: 'B', title: '热搜榜', slug: 'markets/trending', route: '/portal-preview/markets/trending', pageType: 'list', isHandwritten: false, isTemplate: true, isContentDriven: false, requiresAuth: false, isFundsRelated: false, isTradingRelated: false, isKycRelated: false, requiresStrictCompliance: false, canStaticPreview: true, includeInSitemap: true },
  { id: 'P4-0038', module: 'B', title: '币种详情', slug: 'markets/[symbol]', route: '/portal-preview/markets/[symbol]', pageType: 'detail', isHandwritten: false, isTemplate: true, isContentDriven: false, requiresAuth: false, isFundsRelated: false, isTradingRelated: false, isKycRelated: false, requiresStrictCompliance: false, canStaticPreview: true, includeInSitemap: false, description: '动态路由 [symbol]' },
  // P4-0039 ~ P4-0070 规划占位（不展开）

  // ========== C. 交易产品入口 0071-0110 ==========
  { id: 'P4-0071', module: 'C', title: '交易中心', slug: 'trade', route: '/portal-preview/trade', pageType: 'entry', isHandwritten: true, isTemplate: true, isContentDriven: false, requiresAuth: false, isFundsRelated: false, isTradingRelated: true, isKycRelated: false, requiresStrictCompliance: false, canStaticPreview: true, includeInSitemap: true, description: '交易入口聚合页' },
  { id: 'P4-0072', module: 'C', title: '现货交易', slug: 'trade/spot', route: '/portal-preview/trade/spot', pageType: 'entry', isHandwritten: false, isTemplate: true, isContentDriven: false, requiresAuth: false, isFundsRelated: false, isTradingRelated: true, isKycRelated: false, requiresStrictCompliance: false, canStaticPreview: true, includeInSitemap: true },
  { id: 'P4-0073', module: 'C', title: '合约交易', slug: 'trade/futures', route: '/portal-preview/trade/futures', pageType: 'entry', isHandwritten: false, isTemplate: true, isContentDriven: false, requiresAuth: false, isFundsRelated: false, isTradingRelated: true, isKycRelated: false, requiresStrictCompliance: false, canStaticPreview: true, includeInSitemap: true },
  { id: 'P4-0074', module: 'C', title: '杠杆交易', slug: 'trade/margin', route: '/portal-preview/trade/margin', pageType: 'entry', isHandwritten: false, isTemplate: true, isContentDriven: false, requiresAuth: false, isFundsRelated: false, isTradingRelated: true, isKycRelated: false, requiresStrictCompliance: false, canStaticPreview: true, includeInSitemap: true },
  { id: 'P4-0075', module: 'C', title: '交易费率', slug: 'trade/fees', route: '/portal-preview/trade/fees', pageType: 'info', isHandwritten: false, isTemplate: true, isContentDriven: true, requiresAuth: false, isFundsRelated: true, isTradingRelated: true, isKycRelated: false, requiresStrictCompliance: true, canStaticPreview: true, includeInSitemap: true },
  { id: 'P4-0076', module: 'C', title: '交易规则', slug: 'trade/rules', route: '/portal-preview/trade/rules', pageType: 'info', isHandwritten: false, isTemplate: true, isContentDriven: true, requiresAuth: false, isFundsRelated: false, isTradingRelated: true, isKycRelated: false, requiresStrictCompliance: true, canStaticPreview: true, includeInSitemap: true },
  { id: 'P4-0077', module: 'C', title: '交易风险披露', slug: 'trade/risk-disclosure', route: '/portal-preview/trade/risk-disclosure', pageType: 'info', isHandwritten: false, isTemplate: true, isContentDriven: true, requiresAuth: false, isFundsRelated: true, isTradingRelated: true, isKycRelated: false, requiresStrictCompliance: true, canStaticPreview: true, includeInSitemap: true },
  // P4-0078 ~ P4-0110 规划占位（不展开）

  // ========== D. 账户与安全入口 0111-0145 ==========
  { id: 'P4-0111', module: 'D', title: '账户中心', slug: 'account', route: '/portal-preview/account', pageType: 'entry', isHandwritten: true, isTemplate: true, isContentDriven: false, requiresAuth: true, isFundsRelated: false, isTradingRelated: false, isKycRelated: true, requiresStrictCompliance: true, canStaticPreview: true, includeInSitemap: false, description: '账户入口聚合页' },
  { id: 'P4-0112', module: 'D', title: '登录', slug: 'account/login', route: '/portal-preview/account/login', pageType: 'form', isHandwritten: false, isTemplate: true, isContentDriven: false, requiresAuth: false, isFundsRelated: false, isTradingRelated: false, isKycRelated: false, requiresStrictCompliance: true, canStaticPreview: true, includeInSitemap: false },
  { id: 'P4-0113', module: 'D', title: '注册', slug: 'account/register', route: '/portal-preview/account/register', pageType: 'form', isHandwritten: false, isTemplate: true, isContentDriven: false, requiresAuth: false, isFundsRelated: false, isTradingRelated: false, isKycRelated: true, requiresStrictCompliance: true, canStaticPreview: true, includeInSitemap: false },
  { id: 'P4-0114', module: 'D', title: 'KYC 认证', slug: 'account/kyc', route: '/portal-preview/account/kyc', pageType: 'info', isHandwritten: false, isTemplate: true, isContentDriven: true, requiresAuth: true, isFundsRelated: false, isTradingRelated: false, isKycRelated: true, requiresStrictCompliance: true, canStaticPreview: true, includeInSitemap: false },
  { id: 'P4-0115', module: 'D', title: '账户安全', slug: 'account/security', route: '/portal-preview/account/security', pageType: 'info', isHandwritten: false, isTemplate: true, isContentDriven: true, requiresAuth: true, isFundsRelated: false, isTradingRelated: false, isKycRelated: false, requiresStrictCompliance: true, canStaticPreview: true, includeInSitemap: false },
  { id: 'P4-0116', module: 'D', title: '设备管理', slug: 'account/devices', route: '/portal-preview/account/devices', pageType: 'info', isHandwritten: false, isTemplate: true, isContentDriven: false, requiresAuth: true, isFundsRelated: false, isTradingRelated: false, isKycRelated: false, requiresStrictCompliance: true, canStaticPreview: true, includeInSitemap: false },
  { id: 'P4-0117', module: 'D', title: '反钓鱼', slug: 'account/anti-phishing', route: '/portal-preview/account/anti-phishing', pageType: 'info', isHandwritten: false, isTemplate: true, isContentDriven: true, requiresAuth: false, isFundsRelated: false, isTradingRelated: false, isKycRelated: false, requiresStrictCompliance: true, canStaticPreview: true, includeInSitemap: true },
  { id: 'P4-0118', module: 'D', title: '账户风控', slug: 'account/risk-control', route: '/portal-preview/account/risk-control', pageType: 'info', isHandwritten: false, isTemplate: true, isContentDriven: true, requiresAuth: false, isFundsRelated: false, isTradingRelated: false, isKycRelated: false, requiresStrictCompliance: true, canStaticPreview: true, includeInSitemap: true },
  // P4-0119 ~ P4-0145 规划占位（不展开）

  // ========== E. 资产与钱包入口 0146-0180 ==========
  { id: 'P4-0146', module: 'E', title: '资产中心', slug: 'assets', route: '/portal-preview/assets', pageType: 'entry', isHandwritten: true, isTemplate: true, isContentDriven: false, requiresAuth: true, isFundsRelated: true, isTradingRelated: false, isKycRelated: false, requiresStrictCompliance: false, canStaticPreview: true, includeInSitemap: false, description: '资产入口聚合页' },
  { id: 'P4-0147', module: 'E', title: '资产总览', slug: 'assets/overview', route: '/portal-preview/assets/overview', pageType: 'info', isHandwritten: false, isTemplate: true, isContentDriven: false, requiresAuth: true, isFundsRelated: true, isTradingRelated: false, isKycRelated: false, requiresStrictCompliance: false, canStaticPreview: true, includeInSitemap: false },
  { id: 'P4-0148', module: 'E', title: '钱包', slug: 'assets/wallet', route: '/portal-preview/assets/wallet', pageType: 'info', isHandwritten: false, isTemplate: true, isContentDriven: false, requiresAuth: true, isFundsRelated: true, isTradingRelated: false, isKycRelated: false, requiresStrictCompliance: false, canStaticPreview: true, includeInSitemap: false },
  { id: 'P4-0149', module: 'E', title: '充值', slug: 'assets/deposit', route: '/portal-preview/assets/deposit', pageType: 'info', isHandwritten: false, isTemplate: true, isContentDriven: true, requiresAuth: true, isFundsRelated: true, isTradingRelated: false, isKycRelated: true, requiresStrictCompliance: true, canStaticPreview: true, includeInSitemap: false },
  { id: 'P4-0150', module: 'E', title: '提现', slug: 'assets/withdraw', route: '/portal-preview/assets/withdraw', pageType: 'info', isHandwritten: false, isTemplate: true, isContentDriven: true, requiresAuth: true, isFundsRelated: true, isTradingRelated: false, isKycRelated: true, requiresStrictCompliance: true, canStaticPreview: true, includeInSitemap: false },
  { id: 'P4-0151', module: 'E', title: '转账', slug: 'assets/transfer', route: '/portal-preview/assets/transfer', pageType: 'info', isHandwritten: false, isTemplate: true, isContentDriven: true, requiresAuth: true, isFundsRelated: true, isTradingRelated: false, isKycRelated: false, requiresStrictCompliance: true, canStaticPreview: true, includeInSitemap: false },
  { id: 'P4-0152', module: 'E', title: '历史记录', slug: 'assets/history', route: '/portal-preview/assets/history', pageType: 'info', isHandwritten: false, isTemplate: true, isContentDriven: false, requiresAuth: true, isFundsRelated: true, isTradingRelated: false, isKycRelated: false, requiresStrictCompliance: false, canStaticPreview: true, includeInSitemap: false },
  { id: 'P4-0153', module: 'E', title: '资产费率', slug: 'assets/fees', route: '/portal-preview/assets/fees', pageType: 'info', isHandwritten: false, isTemplate: true, isContentDriven: true, requiresAuth: false, isFundsRelated: true, isTradingRelated: false, isKycRelated: false, requiresStrictCompliance: true, canStaticPreview: true, includeInSitemap: true },
  { id: 'P4-0154', module: 'E', title: '资产风险披露', slug: 'assets/risk-disclosure', route: '/portal-preview/assets/risk-disclosure', pageType: 'info', isHandwritten: false, isTemplate: true, isContentDriven: true, requiresAuth: false, isFundsRelated: true, isTradingRelated: false, isKycRelated: false, requiresStrictCompliance: true, canStaticPreview: true, includeInSitemap: true },
  // P4-0155 ~ P4-0180 规划占位（不展开）

  // ========== F. 机构业务入口 0181-0205 ==========
  { id: 'P4-0181', module: 'F', title: '机构业务总览', slug: 'institutional', route: '/portal-preview/institutional', pageType: 'entry', isHandwritten: false, isTemplate: true, isContentDriven: false, requiresAuth: false, isFundsRelated: false, isTradingRelated: false, isKycRelated: false, requiresStrictCompliance: false, canStaticPreview: true, includeInSitemap: true, description: '机构业务入口聚合页' },
  { id: 'P4-0182', module: 'F', title: 'VIP 客户', slug: 'institutional/vip', route: '/portal-preview/institutional/vip', pageType: 'info', isHandwritten: false, isTemplate: true, isContentDriven: true, requiresAuth: false, isFundsRelated: false, isTradingRelated: false, isKycRelated: false, requiresStrictCompliance: false, canStaticPreview: true, includeInSitemap: true },
  { id: 'P4-0183', module: 'F', title: '做市商', slug: 'institutional/market-maker', route: '/portal-preview/institutional/market-maker', pageType: 'info', isHandwritten: false, isTemplate: true, isContentDriven: true, requiresAuth: false, isFundsRelated: false, isTradingRelated: true, isKycRelated: false, requiresStrictCompliance: false, canStaticPreview: true, includeInSitemap: true },
  { id: 'P4-0184', module: 'F', title: '项目方', slug: 'institutional/project', route: '/portal-preview/institutional/project', pageType: 'info', isHandwritten: false, isTemplate: true, isContentDriven: true, requiresAuth: false, isFundsRelated: false, isTradingRelated: false, isKycRelated: false, requiresStrictCompliance: false, canStaticPreview: true, includeInSitemap: true },
  { id: 'P4-0185', module: 'F', title: '机构 API', slug: 'institutional/api', route: '/portal-preview/institutional/api', pageType: 'info', isHandwritten: false, isTemplate: true, isContentDriven: true, requiresAuth: false, isFundsRelated: false, isTradingRelated: true, isKycRelated: false, requiresStrictCompliance: false, canStaticPreview: true, includeInSitemap: true },
  { id: 'P4-0186', module: 'F', title: '资产托管', slug: 'institutional/custody', route: '/portal-preview/institutional/custody', pageType: 'info', isHandwritten: false, isTemplate: true, isContentDriven: true, requiresAuth: false, isFundsRelated: true, isTradingRelated: false, isKycRelated: false, requiresStrictCompliance: true, canStaticPreview: true, includeInSitemap: true },
  { id: 'P4-0187', module: 'F', title: '机构申请', slug: 'institutional/apply', route: '/portal-preview/institutional/apply', pageType: 'info', isHandwritten: false, isTemplate: true, isContentDriven: false, requiresAuth: false, isFundsRelated: false, isTradingRelated: false, isKycRelated: true, requiresStrictCompliance: true, canStaticPreview: true, includeInSitemap: true },
  // P4-0188 ~ P4-0205 规划占位（不展开）

  // ========== G. 帮助中心入口 0206-0240 ==========
  { id: 'P4-0206', module: 'G', title: '帮助中心', slug: 'help', route: '/portal-preview/help', pageType: 'entry', isHandwritten: true, isTemplate: true, isContentDriven: false, requiresAuth: false, isFundsRelated: false, isTradingRelated: false, isKycRelated: false, requiresStrictCompliance: false, canStaticPreview: true, includeInSitemap: true, description: '帮助中心入口聚合页' },
  { id: 'P4-0207', module: 'G', title: '新手入门', slug: 'help/getting-started', route: '/portal-preview/help/getting-started', pageType: 'info', isHandwritten: false, isTemplate: true, isContentDriven: true, requiresAuth: false, isFundsRelated: false, isTradingRelated: false, isKycRelated: false, requiresStrictCompliance: false, canStaticPreview: true, includeInSitemap: true },
  { id: 'P4-0208', module: 'G', title: '账户帮助', slug: 'help/account', route: '/portal-preview/help/account', pageType: 'info', isHandwritten: false, isTemplate: true, isContentDriven: true, requiresAuth: false, isFundsRelated: false, isTradingRelated: false, isKycRelated: true, requiresStrictCompliance: true, canStaticPreview: true, includeInSitemap: true },
  { id: 'P4-0209', module: 'G', title: 'KYC 帮助', slug: 'help/kyc', route: '/portal-preview/help/kyc', pageType: 'info', isHandwritten: false, isTemplate: true, isContentDriven: true, requiresAuth: false, isFundsRelated: false, isTradingRelated: false, isKycRelated: true, requiresStrictCompliance: true, canStaticPreview: true, includeInSitemap: true },
  { id: 'P4-0210', module: 'G', title: '充值帮助', slug: 'help/deposit', route: '/portal-preview/help/deposit', pageType: 'info', isHandwritten: false, isTemplate: true, isContentDriven: true, requiresAuth: false, isFundsRelated: true, isTradingRelated: false, isKycRelated: true, requiresStrictCompliance: true, canStaticPreview: true, includeInSitemap: true },
  { id: 'P4-0211', module: 'G', title: '提现帮助', slug: 'help/withdraw', route: '/portal-preview/help/withdraw', pageType: 'info', isHandwritten: false, isTemplate: true, isContentDriven: true, requiresAuth: false, isFundsRelated: true, isTradingRelated: false, isKycRelated: true, requiresStrictCompliance: true, canStaticPreview: true, includeInSitemap: true },
  { id: 'P4-0212', module: 'G', title: '交易帮助', slug: 'help/trading', route: '/portal-preview/help/trading', pageType: 'info', isHandwritten: false, isTemplate: true, isContentDriven: true, requiresAuth: false, isFundsRelated: false, isTradingRelated: true, isKycRelated: false, requiresStrictCompliance: true, canStaticPreview: true, includeInSitemap: true },
  { id: 'P4-0213', module: 'G', title: '安全帮助', slug: 'help/security', route: '/portal-preview/help/security', pageType: 'info', isHandwritten: false, isTemplate: true, isContentDriven: true, requiresAuth: false, isFundsRelated: false, isTradingRelated: false, isKycRelated: false, requiresStrictCompliance: true, canStaticPreview: true, includeInSitemap: true },
  { id: 'P4-0214', module: 'G', title: '常见问题 FAQ', slug: 'help/faq', route: '/portal-preview/help/faq', pageType: 'list', isHandwritten: false, isTemplate: true, isContentDriven: true, requiresAuth: false, isFundsRelated: false, isTradingRelated: false, isKycRelated: false, requiresStrictCompliance: false, canStaticPreview: true, includeInSitemap: true },
  { id: 'P4-0215', module: 'G', title: '帮助详情', slug: 'help/[slug]', route: '/portal-preview/help/[slug]', pageType: 'detail', isHandwritten: false, isTemplate: true, isContentDriven: true, requiresAuth: false, isFundsRelated: false, isTradingRelated: false, isKycRelated: false, requiresStrictCompliance: false, canStaticPreview: true, includeInSitemap: false, description: '动态路由 [slug]' },
  // P4-0216 ~ P4-0240 规划占位（不展开）

  // ========== H. 公告与规则入口 0241-0265 ==========
  { id: 'P4-0241', module: 'H', title: '公告中心', slug: 'announcements', route: '/portal-preview/announcements', pageType: 'entry', isHandwritten: true, isTemplate: true, isContentDriven: false, requiresAuth: false, isFundsRelated: false, isTradingRelated: false, isKycRelated: false, requiresStrictCompliance: false, canStaticPreview: true, includeInSitemap: true, description: '公告入口聚合页' },
  { id: 'P4-0242', module: 'H', title: '最新公告', slug: 'announcements/latest', route: '/portal-preview/announcements/latest', pageType: 'list', isHandwritten: false, isTemplate: true, isContentDriven: true, requiresAuth: false, isFundsRelated: false, isTradingRelated: false, isKycRelated: false, requiresStrictCompliance: false, canStaticPreview: true, includeInSitemap: true },
  { id: 'P4-0243', module: 'H', title: '上新公告', slug: 'announcements/listings', route: '/portal-preview/announcements/listings', pageType: 'list', isHandwritten: false, isTemplate: true, isContentDriven: true, requiresAuth: false, isFundsRelated: false, isTradingRelated: true, isKycRelated: false, requiresStrictCompliance: true, canStaticPreview: true, includeInSitemap: true },
  { id: 'P4-0244', module: 'H', title: '维护公告', slug: 'announcements/maintenance', route: '/portal-preview/announcements/maintenance', pageType: 'list', isHandwritten: false, isTemplate: true, isContentDriven: true, requiresAuth: false, isFundsRelated: false, isTradingRelated: false, isKycRelated: false, requiresStrictCompliance: false, canStaticPreview: true, includeInSitemap: true },
  { id: 'P4-0245', module: 'H', title: '规则公告', slug: 'announcements/rules', route: '/portal-preview/announcements/rules', pageType: 'list', isHandwritten: false, isTemplate: true, isContentDriven: true, requiresAuth: false, isFundsRelated: false, isTradingRelated: true, isKycRelated: false, requiresStrictCompliance: true, canStaticPreview: true, includeInSitemap: true },
  { id: 'P4-0246', module: 'H', title: '风险公告', slug: 'announcements/risk', route: '/portal-preview/announcements/risk', pageType: 'list', isHandwritten: false, isTemplate: true, isContentDriven: true, requiresAuth: false, isFundsRelated: true, isTradingRelated: true, isKycRelated: false, requiresStrictCompliance: true, canStaticPreview: true, includeInSitemap: true },
  { id: 'P4-0247', module: 'H', title: '公告详情', slug: 'announcements/[slug]', route: '/portal-preview/announcements/[slug]', pageType: 'detail', isHandwritten: false, isTemplate: true, isContentDriven: true, requiresAuth: false, isFundsRelated: false, isTradingRelated: false, isKycRelated: false, requiresStrictCompliance: false, canStaticPreview: true, includeInSitemap: false, description: '动态路由 [slug]' },
  // P4-0248 ~ P4-0265 规划占位（不展开）

  // ========== I. 合规与风险披露入口 0266-0285 ==========
  { id: 'P4-0266', module: 'I', title: '合规与披露', slug: 'legal', route: '/portal-preview/legal', pageType: 'entry', isHandwritten: true, isTemplate: true, isContentDriven: false, requiresAuth: false, isFundsRelated: false, isTradingRelated: false, isKycRelated: false, requiresStrictCompliance: true, canStaticPreview: true, includeInSitemap: true, description: '合规入口聚合页' },
  { id: 'P4-0267', module: 'I', title: '用户协议', slug: 'legal/terms', route: '/portal-preview/legal/terms', pageType: 'info', isHandwritten: false, isTemplate: true, isContentDriven: true, requiresAuth: false, isFundsRelated: false, isTradingRelated: false, isKycRelated: false, requiresStrictCompliance: true, canStaticPreview: true, includeInSitemap: true },
  { id: 'P4-0268', module: 'I', title: '隐私政策', slug: 'legal/privacy', route: '/portal-preview/legal/privacy', pageType: 'info', isHandwritten: false, isTemplate: true, isContentDriven: true, requiresAuth: false, isFundsRelated: false, isTradingRelated: false, isKycRelated: false, requiresStrictCompliance: true, canStaticPreview: true, includeInSitemap: true },
  { id: 'P4-0269', module: 'I', title: 'Cookie 政策', slug: 'legal/cookie', route: '/portal-preview/legal/cookie', pageType: 'info', isHandwritten: false, isTemplate: true, isContentDriven: true, requiresAuth: false, isFundsRelated: false, isTradingRelated: false, isKycRelated: false, requiresStrictCompliance: true, canStaticPreview: true, includeInSitemap: true },
  { id: 'P4-0270', module: 'I', title: '风险披露', slug: 'legal/risk-disclosure', route: '/portal-preview/legal/risk-disclosure', pageType: 'info', isHandwritten: false, isTemplate: true, isContentDriven: true, requiresAuth: false, isFundsRelated: true, isTradingRelated: true, isKycRelated: false, requiresStrictCompliance: true, canStaticPreview: true, includeInSitemap: true },
  { id: 'P4-0271', module: 'I', title: '免责声明', slug: 'legal/disclaimer', route: '/portal-preview/legal/disclaimer', pageType: 'info', isHandwritten: false, isTemplate: true, isContentDriven: true, requiresAuth: false, isFundsRelated: false, isTradingRelated: false, isKycRelated: false, requiresStrictCompliance: true, canStaticPreview: true, includeInSitemap: true },
  { id: 'P4-0272', module: 'I', title: '限制区域声明', slug: 'legal/restricted-regions', route: '/portal-preview/legal/restricted-regions', pageType: 'info', isHandwritten: false, isTemplate: true, isContentDriven: true, requiresAuth: false, isFundsRelated: false, isTradingRelated: false, isKycRelated: false, requiresStrictCompliance: true, canStaticPreview: true, includeInSitemap: true, description: '明确受限制区域与合规研究区域' },
  { id: 'P4-0273', module: 'I', title: 'AML / KYC 政策', slug: 'legal/aml-kyc', route: '/portal-preview/legal/aml-kyc', pageType: 'info', isHandwritten: false, isTemplate: true, isContentDriven: true, requiresAuth: false, isFundsRelated: false, isTradingRelated: false, isKycRelated: true, requiresStrictCompliance: true, canStaticPreview: true, includeInSitemap: true },
  { id: 'P4-0274', module: 'I', title: '合规研究方向', slug: 'legal/compliance-research', route: '/portal-preview/legal/compliance-research', pageType: 'info', isHandwritten: false, isTemplate: true, isContentDriven: true, requiresAuth: false, isFundsRelated: false, isTradingRelated: false, isKycRelated: false, requiresStrictCompliance: true, canStaticPreview: true, includeInSitemap: true, description: '仅展示"重点市场与合规研究方向"' },
  // P4-0275 ~ P4-0285 规划占位（不展开）

  // ========== J. 产业资产入口 0286-0300（含福建老酒369） ==========
  { id: 'P4-0286', module: 'J', title: '产业资产', slug: 'industry', route: '/portal-preview/industry', pageType: 'entry', isHandwritten: true, isTemplate: true, isContentDriven: false, requiresAuth: false, isFundsRelated: false, isTradingRelated: false, isKycRelated: false, requiresStrictCompliance: true, canStaticPreview: true, includeInSitemap: true, description: '产业资产入口聚合页' },
  { id: 'P4-0287', module: 'J', title: '福建老酒369', slug: 'industry/fujian-laojiu-369', route: '/portal-preview/industry/fujian-laojiu-369', pageType: 'entry', isHandwritten: true, isTemplate: true, isContentDriven: true, requiresAuth: false, isFundsRelated: false, isTradingRelated: false, isKycRelated: false, requiresStrictCompliance: true, canStaticPreview: true, includeInSitemap: true, description: '福建老酒369 入口级骨架（首批核心模块）' },
  { id: 'P4-0288', module: 'J', title: '福建老酒369 - 关于', slug: 'industry/fujian-laojiu-369/about', route: '/portal-preview/industry/fujian-laojiu-369/about', pageType: 'info', isHandwritten: false, isTemplate: true, isContentDriven: true, requiresAuth: false, isFundsRelated: false, isTradingRelated: false, isKycRelated: false, requiresStrictCompliance: true, canStaticPreview: true, includeInSitemap: true },
  { id: 'P4-0289', module: 'J', title: '福建老酒369 - H5 入口', slug: 'industry/fujian-laojiu-369/h5', route: '/portal-preview/industry/fujian-laojiu-369/h5', pageType: 'info', isHandwritten: false, isTemplate: true, isContentDriven: false, requiresAuth: false, isFundsRelated: false, isTradingRelated: false, isKycRelated: false, requiresStrictCompliance: true, canStaticPreview: true, includeInSitemap: true, description: '仅说明"H5 已经做好，移动端 H5 入口已具备"，不嵌入真实 H5 业务' },
  { id: 'P4-0290', module: 'J', title: '福建老酒369 - 产品介绍', slug: 'industry/fujian-laojiu-369/products', route: '/portal-preview/industry/fujian-laojiu-369/products', pageType: 'info', isHandwritten: false, isTemplate: true, isContentDriven: true, requiresAuth: false, isFundsRelated: false, isTradingRelated: false, isKycRelated: false, requiresStrictCompliance: true, canStaticPreview: true, includeInSitemap: true, description: 'P4 阶段仅展示入口和说明，不接真实认购' },
  { id: 'P4-0291', module: 'J', title: '福建老酒369 - 发行说明', slug: 'industry/fujian-laojiu-369/issuance', route: '/portal-preview/industry/fujian-laojiu-369/issuance', pageType: 'status', isHandwritten: false, isTemplate: true, isContentDriven: false, requiresAuth: false, isFundsRelated: true, isTradingRelated: false, isKycRelated: false, requiresStrictCompliance: true, canStaticPreview: true, includeInSitemap: false, description: 'P4 阶段 Coming Soon，不接真实发行' },
  { id: 'P4-0292', module: 'J', title: '福建老酒369 - 通证说明', slug: 'industry/fujian-laojiu-369/token', route: '/portal-preview/industry/fujian-laojiu-369/token', pageType: 'status', isHandwritten: false, isTemplate: true, isContentDriven: false, requiresAuth: false, isFundsRelated: true, isTradingRelated: false, isKycRelated: false, requiresStrictCompliance: true, canStaticPreview: true, includeInSitemap: false, description: 'P4 阶段 Coming Soon，不接真实发币' },
  { id: 'P4-0293', module: 'J', title: '福建老酒369 - 合规说明', slug: 'industry/fujian-laojiu-369/compliance', route: '/portal-preview/industry/fujian-laojiu-369/compliance', pageType: 'info', isHandwritten: false, isTemplate: true, isContentDriven: true, requiresAuth: false, isFundsRelated: false, isTradingRelated: false, isKycRelated: false, requiresStrictCompliance: true, canStaticPreview: true, includeInSitemap: true, description: '合规研究、监管观察' },
  { id: 'P4-0294', module: 'J', title: '福建老酒369 - 风险披露', slug: 'industry/fujian-laojiu-369/risk-disclosure', route: '/portal-preview/industry/fujian-laojiu-369/risk-disclosure', pageType: 'info', isHandwritten: true, isTemplate: true, isContentDriven: true, requiresAuth: false, isFundsRelated: false, isTradingRelated: false, isKycRelated: false, requiresStrictCompliance: true, canStaticPreview: true, includeInSitemap: true, description: '完整风险披露、免责声明' },
  // P4-0295 ~ P4-0300 规划占位（含其他产业资产入口）
];

/**
 * 按模块分组的页面快捷查询
 */
export const P4_PAGES_BY_MODULE: Record<P4Module, P4PageMeta[]> = {
  A: P4_PAGES.filter((p) => p.module === 'A'),
  B: P4_PAGES.filter((p) => p.module === 'B'),
  C: P4_PAGES.filter((p) => p.module === 'C'),
  D: P4_PAGES.filter((p) => p.module === 'D'),
  E: P4_PAGES.filter((p) => p.module === 'E'),
  F: P4_PAGES.filter((p) => p.module === 'F'),
  G: P4_PAGES.filter((p) => p.module === 'G'),
  H: P4_PAGES.filter((p) => p.module === 'H'),
  I: P4_PAGES.filter((p) => p.module === 'I'),
  J: P4_PAGES.filter((p) => p.module === 'J'),
};

/**
 * 模块元数据
 */
export const P4_MODULE_META: Record<P4Module, { code: string; name: string; range: string; count: number }> = {
  A: { code: 'A', name: '首页与品牌门户', range: '0001-0030', count: 30 },
  B: { code: 'B', name: '行情与市场入口', range: '0031-0070', count: 40 },
  C: { code: 'C', name: '交易产品入口', range: '0071-0110', count: 40 },
  D: { code: 'D', name: '账户与安全入口', range: '0111-0145', count: 35 },
  E: { code: 'E', name: '资产与钱包入口', range: '0146-0180', count: 35 },
  F: { code: 'F', name: '机构业务入口', range: '0181-0205', count: 25 },
  G: { code: 'G', name: '帮助中心入口', range: '0206-0240', count: 35 },
  H: { code: 'H', name: '公告与规则入口', range: '0241-0265', count: 25 },
  I: { code: 'I', name: '合规与风险披露入口', range: '0266-0285', count: 20 },
  J: { code: 'J', name: '产业资产入口', range: '0286-0300', count: 15 },
};

/**
 * 强合规审核页面（requiresStrictCompliance = true）
 */
export const P4_STRICT_COMPLIANCE_PAGES: P4PageMeta[] = P4_PAGES.filter((p) => p.requiresStrictCompliance);

/**
 * 静态可预览页面（canStaticPreview = true）
 */
export const P4_STATIC_PREVIEW_PAGES: P4PageMeta[] = P4_PAGES.filter((p) => p.canStaticPreview);

/**
 * sitemap 收录页面
 */
export const P4_SITEMAP_PAGES: P4PageMeta[] = P4_PAGES.filter((p) => p.includeInSitemap);

/**
 * 通过 route 查询页面
 */
export function findP4PageByRoute(route: string): P4PageMeta | undefined {
  return P4_PAGES.find((p) => p.route === route);
}

/**
 * 通过 id 查询页面
 */
export function findP4PageById(id: string): P4PageMeta | undefined {
  return P4_PAGES.find((p) => p.id === id);
}

/**
 * 福建老酒369 相关页面
 */
export const P4_LAOJIU_369_PAGES: P4PageMeta[] = P4_PAGES.filter((p) =>
  p.route.startsWith('/portal-preview/industry/fujian-laojiu-369')
);
