/**
 * Reporting Service - 状态机 + 枚举
 *
 * 工业级 Solana-first 架构
 * 文档：docs/工业级最终方案：Solana-first 统一生态架构.md §5.5.10
 * 业务规则：docs/369福建老酒源代码-开发/H015-23 个 Service 的工业级职责.md §3.20
 *
 * 报表域：
 *  - 销售报表（sales / order）：订单、GMV、支付成功率
 *  - 用户增长（user_growth）：注册、激活、KYC 转化
 *  - 推荐/团队/节点（referral / team / node）：奖励链路
 *  - 积分/可交易积分（points / tfj369）：账本快照
 *  - NFT / 算力 / 释放（nft / power / release）：链上对账
 *  - 财务/税务（finance / tax）：分账、税务计提
 *  - 风控（risk）：事件、案件、冻结
 *  - 链上资产（chain_asset）：链上/链下对账
 *
 * 周期维度：日 / 周 / 月 / 季度 / 年 / 自定义
 * 状态：generating → ready → failed
 */

export const REPORT_TYPE = {
  SALES: 'sales',
  ORDER: 'order',
  USER_GROWTH: 'user_growth',
  REFERRAL: 'referral',
  TEAM: 'team',
  NODE: 'node',
  POINTS: 'points',
  TFJ369: 'tfj369',
  NFT: 'nft',
  POWER: 'power',
  RELEASE: 'release',
  FINANCE: 'finance',
  TAX: 'tax',
  RISK: 'risk',
  CHAIN_ASSET: 'chain_asset',
  KYC: 'kyc',
  REFUND: 'refund',
  TREASURY: 'treasury',
  CUSTOM: 'custom',
} as const;
export type FjnReportType = (typeof REPORT_TYPE)[keyof typeof REPORT_TYPE];

/** 全部报表类型数组（用于校验） */
export const ALL_REPORT_TYPES: FjnReportType[] = Object.values(REPORT_TYPE) as FjnReportType[];

/** 报表周期粒度 */
export const REPORT_PERIOD_GRANULARITY = {
  DAILY: 'daily',
  WEEKLY: 'weekly',
  MONTHLY: 'monthly',
  QUARTERLY: 'quarterly',
  YEARLY: 'yearly',
  CUSTOM: 'custom',
} as const;
export type FjnReportPeriodGranularity =
  (typeof REPORT_PERIOD_GRANULARITY)[keyof typeof REPORT_PERIOD_GRANULARITY];

/** 报表生成状态 */
export const REPORT_STATUS = {
  GENERATING: 'generating',
  READY: 'ready',
  FAILED: 'failed',
  EXPIRED: 'expired',
} as const;
export type FjnReportStatus = (typeof REPORT_STATUS)[keyof typeof REPORT_STATUS];

/** 报表导出格式 */
export const REPORT_EXPORT_FORMAT = {
  JSON: 'json',
  CSV: 'csv',
  XLSX: 'xlsx',
  PDF: 'pdf',
} as const;
export type FjnReportExportFormat =
  (typeof REPORT_EXPORT_FORMAT)[keyof typeof REPORT_EXPORT_FORMAT];

/** 报表可见性 */
export const REPORT_VISIBILITY = {
  INTERNAL: 'internal',
  ADMIN: 'admin',
  PUBLIC: 'public',
} as const;
export type FjnReportVisibility =
  (typeof REPORT_VISIBILITY)[keyof typeof REPORT_VISIBILITY];

/** 报表触发方式 */
export const REPORT_TRIGGER = {
  MANUAL: 'manual',
  SCHEDULED: 'scheduled',
  EVENT: 'event',
} as const;
export type FjnReportTrigger = (typeof REPORT_TRIGGER)[keyof typeof REPORT_TRIGGER];

/** 报表状态机 */
export const REPORT_STATUS_TRANSITIONS: Record<FjnReportStatus, FjnReportStatus[]> = {
  [REPORT_STATUS.GENERATING]: [REPORT_STATUS.READY, REPORT_STATUS.FAILED],
  [REPORT_STATUS.READY]: [REPORT_STATUS.EXPIRED],
  [REPORT_STATUS.FAILED]: [REPORT_STATUS.GENERATING],
  [REPORT_STATUS.EXPIRED]: [],
};

/** 周期粒度 → 期间格式映射 */
export const REPORT_PERIOD_FORMAT_REGEX: Record<FjnReportPeriodGranularity, RegExp> = {
  [REPORT_PERIOD_GRANULARITY.DAILY]: /^\d{4}-\d{2}-\d{2}$/,
  [REPORT_PERIOD_GRANULARITY.WEEKLY]: /^\d{4}-W\d{2}$/,
  [REPORT_PERIOD_GRANULARITY.MONTHLY]: /^\d{4}-\d{2}$/,
  [REPORT_PERIOD_GRANULARITY.QUARTERLY]: /^\d{4}-Q[1-4]$/,
  [REPORT_PERIOD_GRANULARITY.YEARLY]: /^\d{4}$/,
  [REPORT_PERIOD_GRANULARITY.CUSTOM]: /^CUSTOM-[A-Za-z0-9_-]{1,32}$/,
};

/** 默认报表过期天数（30 天） */
export const REPORT_DEFAULT_EXPIRES_DAYS = 30;

/** 报表最大汇总层级（用于 summary 嵌套） */
export const REPORT_MAX_SUMMARY_DEPTH = 3;

/** 校验器 */
export const isValidReportType = (v: string): v is FjnReportType =>
  Object.values(REPORT_TYPE).includes(v as any);

export const isValidReportStatus = (v: string): v is FjnReportStatus =>
  Object.values(REPORT_STATUS).includes(v as any);

export const isValidReportPeriodGranularity = (
  v: string,
): v is FjnReportPeriodGranularity =>
  Object.values(REPORT_PERIOD_GRANULARITY).includes(v as any);

export const isValidReportExportFormat = (v: string): v is FjnReportExportFormat =>
  Object.values(REPORT_EXPORT_FORMAT).includes(v as any);

export const isValidReportVisibility = (v: string): v is FjnReportVisibility =>
  Object.values(REPORT_VISIBILITY).includes(v as any);

export const isValidReportTrigger = (v: string): v is FjnReportTrigger =>
  Object.values(REPORT_TRIGGER).includes(v as any);

/** 状态流转校验 */
export const canTransitReportStatus = (
  from: FjnReportStatus,
  to: FjnReportStatus,
): boolean => (REPORT_STATUS_TRANSITIONS[from] ?? []).includes(to);

export const assertTransitReportStatus = (
  from: FjnReportStatus,
  to: FjnReportStatus,
): void => {
  if (!canTransitReportStatus(from, to)) {
    throw new Error(
      `[Reporting] Illegal status transition: ${from} -> ${to}`,
    );
  }
};

/** 终态判定 */
export const isTerminalReportStatus = (s: FjnReportStatus): boolean =>
  s === REPORT_STATUS.EXPIRED;

/** 校验周期格式 */
export const isValidReportPeriod = (
  period: string,
  granularity: FjnReportPeriodGranularity,
): boolean => {
  const regex = REPORT_PERIOD_FORMAT_REGEX[granularity];
  if (!regex) return false;
  return regex.test(period);
};

/** 由日期推断粒度 */
export const inferPeriodGranularity = (period: string): FjnReportPeriodGranularity => {
  if (REPORT_PERIOD_FORMAT_REGEX[REPORT_PERIOD_GRANULARITY.DAILY].test(period))
    return REPORT_PERIOD_GRANULARITY.DAILY;
  if (REPORT_PERIOD_FORMAT_REGEX[REPORT_PERIOD_GRANULARITY.WEEKLY].test(period))
    return REPORT_PERIOD_GRANULARITY.WEEKLY;
  if (REPORT_PERIOD_FORMAT_REGEX[REPORT_PERIOD_GRANULARITY.MONTHLY].test(period))
    return REPORT_PERIOD_GRANULARITY.MONTHLY;
  if (REPORT_PERIOD_FORMAT_REGEX[REPORT_PERIOD_GRANULARITY.QUARTERLY].test(period))
    return REPORT_PERIOD_GRANULARITY.QUARTERLY;
  if (REPORT_PERIOD_FORMAT_REGEX[REPORT_PERIOD_GRANULARITY.YEARLY].test(period))
    return REPORT_PERIOD_GRANULARITY.YEARLY;
  return REPORT_PERIOD_GRANULARITY.CUSTOM;
};

/**
 * 报表类型 → 默认粒度映射
 */
export const REPORT_TYPE_DEFAULT_GRANULARITY: Record<FjnReportType, FjnReportPeriodGranularity> = {
  [REPORT_TYPE.SALES]: REPORT_PERIOD_GRANULARITY.DAILY,
  [REPORT_TYPE.ORDER]: REPORT_PERIOD_GRANULARITY.DAILY,
  [REPORT_TYPE.USER_GROWTH]: REPORT_PERIOD_GRANULARITY.DAILY,
  [REPORT_TYPE.REFERRAL]: REPORT_PERIOD_GRANULARITY.MONTHLY,
  [REPORT_TYPE.TEAM]: REPORT_PERIOD_GRANULARITY.MONTHLY,
  [REPORT_TYPE.NODE]: REPORT_PERIOD_GRANULARITY.MONTHLY,
  [REPORT_TYPE.POINTS]: REPORT_PERIOD_GRANULARITY.DAILY,
  [REPORT_TYPE.TFJ369]: REPORT_PERIOD_GRANULARITY.DAILY,
  [REPORT_TYPE.NFT]: REPORT_PERIOD_GRANULARITY.WEEKLY,
  [REPORT_TYPE.POWER]: REPORT_PERIOD_GRANULARITY.DAILY,
  [REPORT_TYPE.RELEASE]: REPORT_PERIOD_GRANULARITY.MONTHLY,
  [REPORT_TYPE.FINANCE]: REPORT_PERIOD_GRANULARITY.MONTHLY,
  [REPORT_TYPE.TAX]: REPORT_PERIOD_GRANULARITY.MONTHLY,
  [REPORT_TYPE.RISK]: REPORT_PERIOD_GRANULARITY.WEEKLY,
  [REPORT_TYPE.CHAIN_ASSET]: REPORT_PERIOD_GRANULARITY.DAILY,
  [REPORT_TYPE.KYC]: REPORT_PERIOD_GRANULARITY.WEEKLY,
  [REPORT_TYPE.REFUND]: REPORT_PERIOD_GRANULARITY.DAILY,
  [REPORT_TYPE.TREASURY]: REPORT_PERIOD_GRANULARITY.DAILY,
  [REPORT_TYPE.CUSTOM]: REPORT_PERIOD_GRANULARITY.CUSTOM,
};

/** 报表类型 → 默认可见性 */
export const REPORT_TYPE_DEFAULT_VISIBILITY: Record<FjnReportType, FjnReportVisibility> = {
  [REPORT_TYPE.SALES]: REPORT_VISIBILITY.INTERNAL,
  [REPORT_TYPE.ORDER]: REPORT_VISIBILITY.INTERNAL,
  [REPORT_TYPE.USER_GROWTH]: REPORT_VISIBILITY.ADMIN,
  [REPORT_TYPE.REFERRAL]: REPORT_VISIBILITY.ADMIN,
  [REPORT_TYPE.TEAM]: REPORT_VISIBILITY.ADMIN,
  [REPORT_TYPE.NODE]: REPORT_VISIBILITY.ADMIN,
  [REPORT_TYPE.POINTS]: REPORT_VISIBILITY.INTERNAL,
  [REPORT_TYPE.TFJ369]: REPORT_VISIBILITY.ADMIN,
  [REPORT_TYPE.NFT]: REPORT_VISIBILITY.PUBLIC,
  [REPORT_TYPE.POWER]: REPORT_VISIBILITY.ADMIN,
  [REPORT_TYPE.RELEASE]: REPORT_VISIBILITY.PUBLIC,
  [REPORT_TYPE.FINANCE]: REPORT_VISIBILITY.INTERNAL,
  [REPORT_TYPE.TAX]: REPORT_VISIBILITY.INTERNAL,
  [REPORT_TYPE.RISK]: REPORT_VISIBILITY.ADMIN,
  [REPORT_TYPE.CHAIN_ASSET]: REPORT_VISIBILITY.ADMIN,
  [REPORT_TYPE.KYC]: REPORT_VISIBILITY.INTERNAL,
  [REPORT_TYPE.REFUND]: REPORT_VISIBILITY.INTERNAL,
  [REPORT_TYPE.TREASURY]: REPORT_VISIBILITY.INTERNAL,
  [REPORT_TYPE.CUSTOM]: REPORT_VISIBILITY.ADMIN,
};
