/**
 * Sports Compliance Service - 状态机 + 枚举
 *
 * 工业级 Solana-first 架构
 * 文档：docs/工业级最终方案：Solana-first 统一生态架构.md §5.5.8 + §2.4
 * 业务规则：docs/369福建老酒源代码-开发/H015-23 个 Service 的工业级职责.md
 *
 * Sports Compliance = 体育竞猜的合规校验
 * 工业级硬规则：
 *  - 体育竞猜默认不能全球开放
 *  - 必须走 Region + KYC + Risk + Limit + Audit + Oracle
 *  - 无牌照地区只能做积分竞猜 / 模拟竞猜 / NFT 纪念奖励
 *
 * 数据落地：sports_compliance_checks（独立表，结构清晰）
 *   - 9 步骤：region / age / kyc / sanctions / pep / risk / limit / sports_compliance / audit
 */

export const SPORTS_COMPLIANCE_CHECK_TYPE = {
  REGION: 'region',
  AGE: 'age',
  KYC: 'kyc',
  SANCTIONS: 'sanctions',
  PEP: 'pep',
  RISK: 'risk',
  LIMIT: 'limit',
  SPORTS_COMPLIANCE: 'sports_compliance',
  AUDIT: 'audit',
} as const;
export type FjnSportsComplianceCheckType =
  (typeof SPORTS_COMPLIANCE_CHECK_TYPE)[keyof typeof SPORTS_COMPLIANCE_CHECK_TYPE];

/** 检查结果 */
export const SPORTS_COMPLIANCE_RESULT = {
  PASS: 'pass',
  FAIL: 'fail',
  REVIEW: 'review',
} as const;
export type FjnSportsComplianceResult =
  (typeof SPORTS_COMPLIANCE_RESULT)[keyof typeof SPORTS_COMPLIANCE_RESULT];

/** 风险决策（与 Risk Service 保持一致） */
export const SPORTS_COMPLIANCE_RISK_DECISION = {
  ALLOW: 'allow',
  REVIEW: 'review',
  BLOCK: 'block',
} as const;
export type FjnSportsComplianceRiskDecision =
  (typeof SPORTS_COMPLIANCE_RISK_DECISION)[keyof typeof SPORTS_COMPLIANCE_RISK_DECISION];

/** PEP 状态 */
export const SPORTS_COMPLIANCE_PEP_STATUS = {
  NONE: 'none',
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
} as const;
export type FjnSportsCompliancePepStatus =
  (typeof SPORTS_COMPLIANCE_PEP_STATUS)[keyof typeof SPORTS_COMPLIANCE_PEP_STATUS];

/** 制裁名单 */
export const SPORTS_COMPLIANCE_SANCTIONS_LIST = {
  UN: 'UN',
  OFAC: 'OFAC',
  EU: 'EU',
  UK: 'UK',
  HKMA: 'HKMA',
  MAS: 'MAS',
  INTERNAL: 'INTERNAL',
} as const;
export type FjnSportsComplianceSanctionsList =
  (typeof SPORTS_COMPLIANCE_SANCTIONS_LIST)[keyof typeof SPORTS_COMPLIANCE_SANCTIONS_LIST];

/** 体育竞猜许可状态 */
export const SPORTS_COMPLIANCE_LICENSE_STATUS = {
  LICENSED: 'licensed',
  RESTRICTED: 'restricted',
  PROHIBITED: 'prohibited',
  GREY: 'grey',
} as const;
export type FjnSportsComplianceLicenseStatus =
  (typeof SPORTS_COMPLIANCE_LICENSE_STATUS)[keyof typeof SPORTS_COMPLIANCE_LICENSE_STATUS];

/** 地区许可映射（核心硬规则：默认无牌照） */
export const SPORTS_COMPLIANCE_REGION_LICENSE: Record<string, FjnSportsComplianceLicenseStatus> = {
  CN: SPORTS_COMPLIANCE_LICENSE_STATUS.PROHIBITED,
  US: SPORTS_COMPLIANCE_LICENSE_STATUS.RESTRICTED,
  GB: SPORTS_COMPLIANCE_LICENSE_STATUS.LICENSED,
  MT: SPORTS_COMPLIANCE_LICENSE_STATUS.LICENSED,
  AU: SPORTS_COMPLIANCE_LICENSE_STATUS.LICENSED,
  PH: SPORTS_COMPLIANCE_LICENSE_STATUS.LICENSED,
  SG: SPORTS_COMPLIANCE_LICENSE_STATUS.LICENSED,
  JP: SPORTS_COMPLIANCE_LICENSE_STATUS.LICENSED,
  KR: SPORTS_COMPLIANCE_LICENSE_STATUS.LICENSED,
  // 默认不在表内：grey（仅积分竞猜/模拟竞猜/NFT 纪念奖励）
};

/** 默认风险分数阈值 */
export const SPORTS_COMPLIANCE_DEFAULT_RISK_SCORE_BLOCK = 80;
export const SPORTS_COMPLIANCE_DEFAULT_RISK_SCORE_REVIEW = 50;

/** 默认日上限 / 单笔上限（FJ369 等价） */
export const SPORTS_COMPLIANCE_DEFAULT_DAILY_LIMIT = '1000.0000';
export const SPORTS_COMPLIANCE_DEFAULT_PER_TX_LIMIT = '300.0000';

/** 默认最低年龄 */
export const SPORTS_COMPLIANCE_MIN_AGE = 18;

/** 默认 KYC 等级要求（无牌照地区只要 NONE，有牌照地区要 BASIC+） */
export const SPORTS_COMPLIANCE_LICENSED_KYC_LEVEL = 'BASIC';

/** 默认链 */
export const SPORTS_COMPLIANCE_DEFAULT_CHAIN_ID = 'devnet';

/** 校验器 */
export const isValidSportsComplianceCheckType = (v: string): v is FjnSportsComplianceCheckType =>
  Object.values(SPORTS_COMPLIANCE_CHECK_TYPE).includes(v as any);

export const isValidSportsComplianceResult = (v: string): v is FjnSportsComplianceResult =>
  Object.values(SPORTS_COMPLIANCE_RESULT).includes(v as any);

export const isValidSportsComplianceRiskDecision = (
  v: string,
): v is FjnSportsComplianceRiskDecision =>
  Object.values(SPORTS_COMPLIANCE_RISK_DECISION).includes(v as any);

export const isValidSportsCompliancePepStatus = (
  v: string,
): v is FjnSportsCompliancePepStatus =>
  Object.values(SPORTS_COMPLIANCE_PEP_STATUS).includes(v as any);

export const isValidSportsComplianceSanctionsList = (
  v: string,
): v is FjnSportsComplianceSanctionsList =>
  Object.values(SPORTS_COMPLIANCE_SANCTIONS_LIST).includes(v as any);

export const isValidSportsComplianceLicenseStatus = (
  v: string,
): v is FjnSportsComplianceLicenseStatus =>
  Object.values(SPORTS_COMPLIANCE_LICENSE_STATUS).includes(v as any);

/** 9 步骤顺序（runFullCompliance 用） */
export const SPORTS_COMPLIANCE_FULL_CHECK_STEPS: FjnSportsComplianceCheckType[] = [
  SPORTS_COMPLIANCE_CHECK_TYPE.REGION,
  SPORTS_COMPLIANCE_CHECK_TYPE.AGE,
  SPORTS_COMPLIANCE_CHECK_TYPE.KYC,
  SPORTS_COMPLIANCE_CHECK_TYPE.SANCTIONS,
  SPORTS_COMPLIANCE_CHECK_TYPE.PEP,
  SPORTS_COMPLIANCE_CHECK_TYPE.RISK,
  SPORTS_COMPLIANCE_CHECK_TYPE.LIMIT,
  SPORTS_COMPLIANCE_CHECK_TYPE.SPORTS_COMPLIANCE,
  SPORTS_COMPLIANCE_CHECK_TYPE.AUDIT,
];
