/**
 * P5.0 核心产品矩阵 - 1000 页配置底座
 *
 * 任务编号：Q05-FrontPortal-P5.0-Core-Product-Matrix-Plan
 * 范围：1000 页核心产品矩阵，10 batch × 100 页
 * 编号：P5-0001 ~ P5-1000
 *
 * 本文件仅作为 P5.0 阶段规划配置底座，包含：
 *   - 10 batch 元数据（不含 1000 条展开配置）
 *   - P5 页面类型定义
 *   - P5 模板 key 命名空间
 *   - P5 域枚举
 *   - P5 合规等级枚举
 *
 * 真实 1000 条页面配置将在 P5.1 起按 batch 逐步生成。
 * 本阶段不展开 1000 条数组，避免单文件膨胀。
 *
 * 字段说明详见 docs/front-portal/q05/p5-core-product-matrix-plan.md 第 17 章
 */

// ==================== 核心常量 ====================

/** P5.0 总规划页数 */
export const P5_TOTAL_PLANNED_PAGES = 1000;

/** 每个 batch 的页数 */
export const P5_BATCH_SIZE = 100;

/** P5.0 batch 总数 */
export const P5_BATCH_COUNT = 10;

/** P5.0 起始编号 */
export const P5_FIRST_PAGE_ID = 'P5-0001';

/** P5.0 结束编号 */
export const P5_LAST_PAGE_ID = 'P5-1000';

// ==================== 类型定义 ====================

/** P5.0 批次 ID（P5-B01 ~ P5-B10） */
export type P5BatchId =
  | 'P5-B01'
  | 'P5-B02'
  | 'P5-B03'
  | 'P5-B04'
  | 'P5-B05'
  | 'P5-B06'
  | 'P5-B07'
  | 'P5-B08'
  | 'P5-B09'
  | 'P5-B10';

/** P5 一级业务域 */
export type P5Domain =
  | 'markets'
  | 'products'
  | 'assets'
  | 'account'
  | 'security'
  | 'compliance'
  | 'help'
  | 'announcements'
  | 'legal'
  | 'institutional'
  | 'api'
  | 'research'
  | 'academy'
  | 'industry'
  | 'fujian-laojiu-369'
  | 'regions'
  | 'status';

/** P5 模板 key 命名空间（P4 既有 + P5 规划新增） */
export type P5TemplateKey =
  // P4 既有（继续复用，不重复造）
  | 'PortalLandingTemplate'
  | 'MarketEntryTemplate'
  | 'ProductEntryTemplate'
  | 'AccountEntryTemplate'
  | 'AssetEntryTemplate'
  | 'HelpCenterTemplate'
  | 'AnnouncementTemplate'
  | 'LegalDisclosureTemplate'
  | 'IndustryAssetTemplate'
  | 'ErrorStateTemplate'
  // P5 规划新增（P5.1+ 按需实现）
  | 'ProductMatrixTemplate'
  | 'MarketSymbolTemplate'
  | 'AssetSymbolTemplate'
  | 'KycStepTemplate'
  | 'SecurityGuideTemplate'
  | 'ComplianceGuideTemplate'
  | 'ApiDocTemplate'
  | 'ResearchArticleTemplate'
  | 'AcademyLessonTemplate'
  | 'LeaderboardTemplate'
  | 'LockupDisclosureTemplate'
  | 'LaunchpadInfoTemplate'
  | 'RwaAssetTemplate'
  | 'FujianLaojiuProductTemplate'
  | 'RiskDisclosureDetailTemplate';

/** P5 合规等级 */
export type P5ComplianceLevel = 'low' | 'medium' | 'high' | 'strict';

/** P5 实施模式 */
export type P5ImplementationMode = 'static' | 'dynamic-segment' | 'content-driven';

/** P5 页面状态 */
export type P5Status = 'planned' | 'skeleton' | 'in-progress' | 'done';

/** P5 路由模式（用于动态段） */
export type P5RoutePattern = 'static' | '[symbol]' | '[slug]';

/** P5 核心页面定义（最小字段集合） */
export interface P5CorePageDefinition {
  /** 编号 P5-XXXX */
  id: string;
  /** 所属 batch */
  batch: P5BatchId;
  /** 一级域 */
  domain: P5Domain;
  /** 中文标题 */
  title: string;
  /** 完整路由 */
  route: string;
  /** 模板 key */
  template: P5TemplateKey;
  /** 合规等级 */
  complianceLevel: P5ComplianceLevel;
  /** 实施模式 */
  implementationMode: P5ImplementationMode;
  /** 当前状态 */
  status: P5Status;
  /** 路由模式（用于动态段识别） */
  routePattern?: P5RoutePattern;
  /** 简短说明（可选） */
  description?: string;
}

/** P5 batch 元数据 */
export interface P5BatchDefinition {
  /** batch ID */
  id: P5BatchId;
  /** 编号范围（含） */
  range: {
    start: number;
    end: number;
  };
  /** 起始编号（字符串） */
  startId: string;
  /** 结束编号（字符串） */
  endId: string;
  /** batch 主题 */
  title: string;
  /** 描述 */
  description: string;
  /** 一级域清单 */
  domains: P5Domain[];
  /** 路由前缀 */
  routePrefix: string;
  /** 主模板清单 */
  primaryTemplates: P5TemplateKey[];
  /** 合规等级 */
  complianceLevel: P5ComplianceLevel;
  /** 备注（硬约束） */
  notes: string;
}

// ==================== Batch 元数据（10 batch） ====================

/**
 * P5 10 批元数据定义
 *
 * 关键修正：
 *   P5-B08 范围为 P5-0701 ~ P5-0800（与 P5-B07 P5-0601 ~ P5-0700 衔接）
 *
 * 不在此处展开 1000 条页面配置。P5.1 起按 batch 逐个落地。
 */
export const P5_BATCHES: readonly P5BatchDefinition[] = [
  {
    id: 'P5-B01',
    range: { start: 1, end: 100 },
    startId: 'P5-0001',
    endId: 'P5-0100',
    title: '核心交易与市场入口',
    description: 'markets / products / assets / trading education / account entrance 入口',
    domains: ['markets', 'products', 'assets', 'account'],
    routePrefix: '/portal-preview/markets',
    primaryTemplates: [
      'MarketEntryTemplate',
      'ProductEntryTemplate',
      'AssetEntryTemplate',
      'MarketSymbolTemplate',
      'AssetSymbolTemplate',
    ],
    complianceLevel: 'medium',
    notes: 'B01 优先复用 P4 MarketEntryTemplate，新增 MarketSymbolTemplate 支撑 [symbol] 动态段。',
  },
  {
    id: 'P5-B02',
    range: { start: 101, end: 200 },
    startId: 'P5-0101',
    endId: 'P5-0200',
    title: '账户、安全、KYC、资产安全',
    description: 'account / security / kyc / wallet guidance / risk notices',
    domains: ['account', 'security', 'compliance'],
    routePrefix: '/portal-preview/account',
    primaryTemplates: [
      'AccountEntryTemplate',
      'SecurityGuideTemplate',
      'KycStepTemplate',
      'ErrorStateTemplate',
    ],
    complianceLevel: 'high',
    notes: 'KYC 与 security 相关页面须使用 strict 合规等级，强制包含完整风险提示。',
  },
  {
    id: 'P5-B03',
    range: { start: 201, end: 300 },
    startId: 'P5-0201',
    endId: 'P5-0300',
    title: '帮助中心与公告中心',
    description: 'help / announcements / faq / guides / support flows',
    domains: ['help', 'announcements'],
    routePrefix: '/portal-preview/help',
    primaryTemplates: [
      'HelpCenterTemplate',
      'AnnouncementTemplate',
      'LeaderboardTemplate',
    ],
    complianceLevel: 'low',
    notes: 'help / announcements 允许使用 [slug] 动态段，但不滥用。',
  },
  {
    id: 'P5-B04',
    range: { start: 301, end: 400 },
    startId: 'P5-0301',
    endId: 'P5-0400',
    title: '法务、合规、风险披露',
    description: 'legal / compliance / disclosures / terms / jurisdiction notices',
    domains: ['legal', 'compliance'],
    routePrefix: '/portal-preview/legal',
    primaryTemplates: [
      'LegalDisclosureTemplate',
      'ComplianceGuideTemplate',
      'RiskDisclosureDetailTemplate',
    ],
    complianceLevel: 'strict',
    notes: '法务与合规页全部 strict 合规等级，必须包含完整免责声明与风险提示。',
  },
  {
    id: 'P5-B05',
    range: { start: 401, end: 500 },
    startId: 'P5-0401',
    endId: 'P5-0500',
    title: '福建老酒369 产业资产专区',
    description: 'fujian-laojiu-369 / issuance info / product / brand / risk disclosure',
    domains: ['industry', 'fujian-laojiu-369'],
    routePrefix: '/portal-preview/industry/fujian-laojiu-369',
    primaryTemplates: [
      'IndustryAssetTemplate',
      'FujianLaojiuProductTemplate',
      'LockupDisclosureTemplate',
      'LaunchpadInfoTemplate',
      'RiskDisclosureDetailTemplate',
    ],
    complianceLevel: 'strict',
    notes:
      '【硬约束】不接真实发行/认购/通证/资产登记系统；不出现"发币即上市"、"上线必涨"等表达；每个页面必须包含完整风险提示。',
  },
  {
    id: 'P5-B06',
    range: { start: 501, end: 600 },
    startId: 'P5-0501',
    endId: 'P5-0600',
    title: '机构与 API',
    description: 'institutional / api / custody / market maker / broker',
    domains: ['institutional', 'api'],
    routePrefix: '/portal-preview/institutional',
    primaryTemplates: [
      'PortalLandingTemplate',
      'ApiDocTemplate',
    ],
    complianceLevel: 'medium',
    notes: 'API 文档页严格使用静态路由，不接真实 API 业务系统。',
  },
  {
    id: 'P5-B07',
    range: { start: 601, end: 700 },
    startId: 'P5-0601',
    endId: 'P5-0700',
    title: '研究院与学院',
    description: 'research / academy / glossary / reports / tutorials',
    domains: ['research', 'academy'],
    routePrefix: '/portal-preview/research',
    primaryTemplates: [
      'ResearchArticleTemplate',
      'AcademyLessonTemplate',
      'HelpCenterTemplate',
    ],
    complianceLevel: 'low',
    notes: '研报与学院内容驱动型，research / academy 允许使用 [slug] 动态段。',
  },
  {
    id: 'P5-B08',
    range: { start: 701, end: 800 },
    startId: 'P5-0701',
    endId: 'P5-0800',
    title: 'RWA 与产业资产扩展',
    description: 'industry / rwa / supply chain / asset disclosure',
    domains: ['industry'],
    routePrefix: '/portal-preview/industry',
    primaryTemplates: [
      'IndustryAssetTemplate',
      'RwaAssetTemplate',
      'RiskDisclosureDetailTemplate',
    ],
    complianceLevel: 'high',
    notes:
      '【编号修正】P5-B08 范围为 P5-0701 ~ P5-0800（与 P5-B07 P5-0601 ~ P5-0700 衔接）。仅"产业资产信息化展示"，不出现"代币化资产稳赚"等表达。',
  },
  {
    id: 'P5-B09',
    range: { start: 801, end: 900 },
    startId: 'P5-0801',
    endId: 'P5-0900',
    title: '区域市场与多语言预留',
    description: 'global / regions / language placeholders / market observation',
    domains: ['regions'],
    routePrefix: '/portal-preview/regions',
    primaryTemplates: [
      'PortalLandingTemplate',
      'ComplianceGuideTemplate',
    ],
    complianceLevel: 'high',
    notes:
      '【硬约束】仅"重点市场与合规研究方向"措辞；禁止表达为已持牌/已监管/已获许可。',
  },
  {
    id: 'P5-B10',
    range: { start: 901, end: 1000 },
    startId: 'P5-0901',
    endId: 'P5-1000',
    title: '错误页、状态页、索引页、长尾支撑页',
    description: 'status / sitemap / error states / tag pages / index pages / fallback',
    domains: ['status'],
    routePrefix: '/portal-preview/status',
    primaryTemplates: [
      'ErrorStateTemplate',
    ],
    complianceLevel: 'low',
    notes: '长尾支撑页，不引入新模板，复用 ErrorStateTemplate 等 P4 既有模板。',
  },
] as const;

// ==================== 工具函数 ====================

/** 根据编号 P5-XXXX 提取数字 */
export function p5IdToNumber(id: string): number {
  const m = /^P5-(\d{4})$/.exec(id);
  if (!m) {
    throw new Error('Invalid P5 id: ' + id);
  }
  return parseInt(m[1], 10);
}

/** 根据数字生成 P5-XXXX 编号 */
export function numberToP5Id(n: number): string {
  if (n < 1 || n > P5_TOTAL_PLANNED_PAGES) {
    throw new Error('P5 number out of range: ' + n);
  }
  return 'P5-' + n.toString().padStart(4, '0');
}

/** 根据 ID 查询所属 batch */
export function getP5BatchById(id: string): P5BatchDefinition | undefined {
  const n = p5IdToNumber(id);
  return P5_BATCHES.find((b) => n >= b.range.start && n <= b.range.end);
}

/** 列出所有 batch 起始 ID */
export const P5_BATCH_START_IDS: readonly string[] = P5_BATCHES.map((b) => b.startId);

/** 列出所有 batch 结束 ID */
export const P5_BATCH_END_IDS: readonly string[] = P5_BATCHES.map((b) => b.endId);

/** P5 总编号范围（字符串元组） */
export const P5_ID_RANGE: readonly [string, string] = [P5_FIRST_PAGE_ID, P5_LAST_PAGE_ID] as const;
