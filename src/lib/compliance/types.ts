/**
 * 合规与牌照管理系统 - 类型定义
 *
 * 涵盖：
 *  - 多种加密资产服务牌照（MSB / Samoa DLT / MiCA / Estonia MTR / FINTRAC / FinCEN / AUSTRAC / MAS）
 *  - 合规自检结果（AML / CTF / KYC / TravelRule / Sanctions / TransactionMonitoring）
 *  - 法务文档版本管理（Terms / Privacy / Cookie / AML / Risk Disclosure / Fee）
 *  - 用户披露与接受记录
 *  - 监管报表（CTR / SAR / MIREL / CARF / DAU）
 *
 * @module lib/compliance/types
 */

// ============================================================================
// 牌照
// ============================================================================

/** 支持的牌照类型 */
export type LicenseType =
  | 'MSB'                 // FinCEN MSB（美国）
  | 'SAMOA_DLT'           // 萨摩亚 DLT 牌照
  | 'MICA'                // 欧盟 MiCA
  | 'ESTONIA_MTR'         // 爱沙尼亚 MTR/MTF
  | 'CANADA_FINTRAC'      // 加拿大 FINTRAC MSB
  | 'US_FINCEN'           // 美国 FinCEN MSB（同 MSB，区分监管机构）
  | 'AUSTRALIA_AUSTRAC'   // 澳大利亚 AUSTRAC
  | 'SINGAPORE_MAS';      // 新加坡 MAS MPI

export type LicenseStatus =
  | 'pending'    // 申请中
  | 'active'     // 有效
  | 'expired'    // 已过期
  | 'suspended'  // 暂停
  | 'revoked';   // 吊销

export interface License {
  id: string;
  type: LicenseType;
  /** 牌照编号 */
  number: string;
  /** 司法管辖区 */
  jurisdiction: string;
  /** 监管机构 */
  regulator: string;
  status: LicenseStatus;
  /** 签发时间（ms） */
  issuedAt: number;
  /** 到期时间（ms） */
  expiresAt: number;
  /** 业务范围 */
  scope: string[];
  /** 牌照附加条件 */
  conditions?: string[];
  /** 监管联系邮箱 */
  contactEmail?: string;
  /** 牌照文件 URL（mock） */
  documentUrl?: string;
  /** 备注 */
  notes?: string;
}

// ============================================================================
// 合规自检
// ============================================================================

export type ComplianceCategory =
  | 'AML'
  | 'CTF'
  | 'KYC'
  | 'TravelRule'
  | 'Sanctions'
  | 'TransactionMonitoring';

export type ComplianceCheckType = 'daily' | 'manual' | 'triggered';

export type ComplianceSeverity = 'info' | 'low' | 'medium' | 'high' | 'critical';

export interface ComplianceFinding {
  id: string;
  severity: ComplianceSeverity;
  category: ComplianceCategory | string;
  message: string;
  evidence?: Record<string, any>;
  recommendation?: string;
  createdAt: number;
}

export interface ComplianceCheck {
  id: string;
  type: ComplianceCheckType;
  category: ComplianceCategory;
  passed: boolean;
  /** 综合得分 0-100 */
  score: number;
  findings: ComplianceFinding[];
  executedAt: number;
  /** 下次检查时间（ms） */
  nextCheckAt?: number;
  executedBy?: string;
  /** 备注 */
  notes?: string;
}

// ============================================================================
// 法务文档
// ============================================================================

export type LegalDocumentType =
  | 'terms'              // 服务条款
  | 'privacy'            // 隐私政策
  | 'cookie'             // Cookie 政策
  | 'aml'                // 反洗钱政策
  | 'risk_disclosure'    // 风险披露
  | 'fee_schedule';      // 费率表

export type LegalLanguage = 'en' | 'zh' | 'ja' | 'ko' | 'es' | 'fr' | 'de' | 'ru';

export type LegalJurisdiction = 'Global' | 'EU' | 'US' | 'APAC' | 'Samoa' | 'Estonia' | 'Canada';

export interface LegalDocument {
  id: string;
  type: LegalDocumentType;
  /** 语义化版本 '1.0.0' */
  version: string;
  jurisdiction: LegalJurisdiction;
  language: LegalLanguage;
  /** Markdown / HTML 内容 */
  content: string;
  /** 生效时间（ms） */
  effectiveAt: number;
  /** 发布时间（ms） */
  publishedAt: number;
  /** 发布人 */
  publishedBy: string;
  /** 是否需要用户重新接受 */
  requiresAcceptance: boolean;
  /** 已接受用户数 */
  acceptanceCount?: number;
  /** 文档摘要 */
  summary?: string;
  /** 关联牌照类型 */
  relatedLicenses?: LicenseType[];
}

/** 用户对法务文档的接受记录 */
export interface UserAcceptance {
  id: string;
  userId: string;
  documentId: string;
  documentVersion: string;
  acceptedAt: number;
  ipAddress: string;
  userAgent: string;
}

// ============================================================================
// 监管报表
// ============================================================================

export type RegulatoryReportType =
  | 'CTR'    // Currency Transaction Report（美国 > 10,000 USD）
  | 'SAR'    // Suspicious Activity Report
  | 'MIREL'  // MiCA Revenue Report（欧盟）
  | 'CARF'   // Crypto-Asset Reporting Framework（OECD）
  | 'DAU';   // Daily Active User Report

export type RegulatoryReportStatus = 'draft' | 'submitted' | 'acknowledged' | 'rejected';

export interface RegulatoryReport {
  id: string;
  type: RegulatoryReportType;
  jurisdiction: string;
  /** 报告周期 */
  period: { start: number; end: number };
  status: RegulatoryReportStatus;
  /** 报表生成时间 */
  generatedAt: number;
  /** 提交时间 */
  submittedAt?: number;
  /** 报告数据 */
  data: any;
  /** 数字签名（mock） */
  signature?: string;
  /** 提交人 */
  submittedBy?: string;
  /** 备注 */
  notes?: string;
}

// ============================================================================
// 风险监控
// ============================================================================

export interface RiskAlert {
  id: string;
  /** 风险等级 */
  level: ComplianceSeverity;
  /** 来源（AML / Sanctions / KYC ...） */
  source: ComplianceCategory | string;
  /** 关联用户 / 交易 */
  refType: 'transaction' | 'user' | 'license' | 'system';
  refId: string;
  message: string;
  metadata?: Record<string, any>;
  createdAt: number;
  resolvedAt?: number;
  resolvedBy?: string;
}

// ============================================================================
// 告警订阅
// ============================================================================

export type FindingHandler = (finding: ComplianceFinding) => void;
export type AlertHandler = (alert: RiskAlert) => void;

// ============================================================================
// 报表输入参数
// ============================================================================

export interface GenerateCTROptions {
  /** 报告周期（默认 24h） */
  period?: { start: number; end: number };
  /** 阈值（默认 10000 USD） */
  thresholdUsd?: number;
}

export interface GenerateSAROptions {
  userId: string;
  /** 可疑原因 */
  reason: string;
  /** 关联交易/事件 ID */
  relatedIds?: string[];
  /** 自由描述 */
  description?: string;
}

export interface GenerateMIRELOptions {
  period?: { start: number; end: number };
  jurisdiction?: string;
}

export interface GenerateCARFOptions {
  period?: { start: number; end: number };
  jurisdiction?: string;
}

export interface GenerateDAUOptions {
  /** 单日时间戳 */
  date?: number;
}

export interface ListReportsOptions {
  type?: RegulatoryReportType;
  jurisdiction?: string;
  status?: RegulatoryReportStatus;
  limit?: number;
}

export interface ListLicensesOptions {
  type?: LicenseType;
  jurisdiction?: string;
  status?: LicenseStatus;
}

// ============================================================================
// 持久化形状
// ============================================================================

export interface CompliancePersistence {
  licenses: License[];
  checks: ComplianceCheck[];
  findings: ComplianceFinding[];
  documents: LegalDocument[];
  acceptances: UserAcceptance[];
  reports: RegulatoryReport[];
  alerts: RiskAlert[];
  /** 上次每日自检时间 */
  lastDailyCheckAt?: number;
}
