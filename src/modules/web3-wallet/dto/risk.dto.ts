/**
 * Web3 钱包模块 - 风控相关 DTO
 *
 * 包含交易风控、地址风险、AML/KYC 检查等操作的数据传输对象
 * 支持实时风控扫描、风险评分、黑白名单等功能
 */

import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsBoolean,
  IsNumber,
  IsUUID,
  IsArray,
  MinLength,
  MaxLength,
  Min,
  Max,
  ValidateNested,
  IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';
import { BlockchainNetwork } from './wallet.dto';
import { TransactionType } from './transaction.dto';

// ============================================================
// 枚举定义
// ============================================================

/**
 * 风险等级枚举
 */
export enum RiskLevel {
  SAFE = 'safe',
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
  UNKNOWN = 'unknown',
}

/**
 * 风险类型枚举
 */
export enum RiskType {
  ADDRESS_RISK = 'address_risk',
  TRANSACTION_RISK = 'transaction_risk',
  CONTRACT_RISK = 'contract_risk',
  AML_RISK = 'aml_risk',
  SANCTIONS_RISK = 'sanctions_risk',
  PHISHING_RISK = 'phishing_risk',
  HACKED_FUNDS = 'hacked_funds',
  MIXER_RISK = 'mixer_risk',
  DARKNET_RISK = 'darknet_risk',
  FRAUD_RISK = 'fraud_risk',
}

/**
 * 风控规则状态枚举
 */
export enum RiskRuleStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  TESTING = 'testing',
  DEPRECATED = 'deprecated',
}

/**
 * 风控动作枚举
 */
export enum RiskAction {
  ALLOW = 'allow',
  WARN = 'warn',
  BLOCK = 'block',
  REVIEW = 'review',
  FREEZE = 'freeze',
  ESCALATE = 'escalate',
}

/**
 * 黑白名单类型枚举
 */
export enum WatchlistType {
  BLACKLIST = 'blacklist',
  WHITELIST = 'whitelist',
  GREYLIST = 'greylist',
  SANCTIONS = 'sanctions',
}

// ============================================================
// 地址风控 DTO
// ============================================================

/**
 * 地址风险扫描 DTO
 */
export class ScanAddressRiskDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(512)
  address: string;

  @IsEnum(BlockchainNetwork)
  @IsNotEmpty()
  chain: BlockchainNetwork;

  @IsOptional()
  @IsArray()
  @IsEnum(RiskType, { each: true })
  checkTypes?: RiskType[];

  @IsOptional()
  @IsBoolean()
  deepScan?: boolean = false;
}

/**
 * 地址风险评估结果 DTO
 */
export class AddressRiskResultDto {
  @IsString()
  address: string;

  @IsEnum(BlockchainNetwork)
  chain: BlockchainNetwork;

  @IsEnum(RiskLevel)
  overallRiskLevel: RiskLevel;

  @IsNumber()
  @Min(0)
  @Max(100)
  riskScore: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RiskFactorDto)
  riskFactors: RiskFactorDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WatchlistMatchDto)
  watchlistMatches: WatchlistMatchDto[];

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;

  @IsNumber()
  scannedAt: number;
}

/**
 * 风险因子 DTO
 */
export class RiskFactorDto {
  @IsEnum(RiskType)
  type: RiskType;

  @IsEnum(RiskLevel)
  level: RiskLevel;

  @IsNumber()
  @Min(0)
  @Max(100)
  score: number;

  @IsString()
  description: string;

  @IsOptional()
  @IsObject()
  details?: Record<string, any>;

  @IsOptional()
  @IsArray()
  evidence?: string[];
}

/**
 * 黑白名单匹配 DTO
 */
export class WatchlistMatchDto {
  @IsEnum(WatchlistType)
  listType: WatchlistType;

  @IsString()
  listName: string;

  @IsEnum(RiskLevel)
  severity: RiskLevel;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsString()
  source?: string;
}

/**
 * 批量地址扫描 DTO
 */
export class BatchScanAddressesDto {
  @IsArray()
  @IsString({ each: true })
  @MaxLength(50, { each: true })
  addresses: string[];

  @IsEnum(BlockchainNetwork)
  @IsNotEmpty()
  chain: BlockchainNetwork;

  @IsOptional()
  @IsBoolean()
  deepScan?: boolean = false;
}

/**
 * 批量地址扫描结果 DTO
 */
export class BatchAddressRiskResultDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AddressRiskResultDto)
  results: AddressRiskResultDto[];

  @IsNumber()
  totalScanned: number;

  @IsNumber()
  highRiskCount: number;

  @IsNumber()
  mediumRiskCount: number;

  @IsNumber()
  lowRiskCount: number;

  @IsNumber()
  safeCount: number;
}

// ============================================================
// 交易风控 DTO
// ============================================================

/**
 * 交易风险评估 DTO
 */
export class EvaluateTransactionRiskDto {
  @IsEnum(TransactionType)
  @IsNotEmpty()
  type: TransactionType;

  @IsEnum(BlockchainNetwork)
  @IsNotEmpty()
  chain: BlockchainNetwork;

  @IsString()
  @IsNotEmpty()
  fromAddress: string;

  @IsString()
  @IsNotEmpty()
  toAddress: string;

  @IsString()
  @IsNotEmpty()
  amount: string;

  @IsOptional()
  @IsString()
  tokenAddress?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  data?: string;

  @IsUUID()
  @IsOptional()
  userId?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

/**
 * 交易风险评估结果 DTO
 */
export class TransactionRiskResultDto {
  @IsEnum(RiskLevel)
  overallRiskLevel: RiskLevel;

  @IsNumber()
  @Min(0)
  @Max(100)
  riskScore: number;

  @IsEnum(RiskAction)
  recommendedAction: RiskAction;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RiskFactorDto)
  riskFactors: RiskFactorDto[];

  @IsArray()
  @IsString({ each: true })
  triggeredRules: string[];

  @IsOptional()
  @IsString()
  @MaxLength(500)
  reviewNotes?: string;

  @IsNumber()
  evaluatedAt: number;
}

/**
 * 交易风控决策 DTO
 */
export class TransactionRiskDecisionDto {
  @IsString()
  @IsNotEmpty()
  transactionId: string;

  @IsEnum(RiskAction)
  @IsNotEmpty()
  decision: RiskAction;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;

  @IsUUID()
  @IsOptional()
  reviewedBy?: string;
}

// ============================================================
// 风控规则 DTO
// ============================================================

/**
 * 创建风控规则 DTO
 */
export class CreateRiskRuleDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @IsEnum(RiskType)
  @IsNotEmpty()
  type: RiskType;

  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  description: string;

  @IsObject()
  @IsNotEmpty()
  conditions: Record<string, any>;

  @IsEnum(RiskAction)
  @IsNotEmpty()
  action: RiskAction;

  @IsEnum(RiskLevel)
  @IsOptional()
  severity?: RiskLevel = RiskLevel.MEDIUM;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  priority?: number = 50;

  @IsOptional()
  @IsEnum(RiskRuleStatus)
  status?: RiskRuleStatus = RiskRuleStatus.ACTIVE;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

/**
 * 风控规则 DTO
 */
export class RiskRuleDto {
  @IsString()
  id: string;

  @IsString()
  name: string;

  @IsEnum(RiskType)
  type: RiskType;

  @IsString()
  description: string;

  @IsObject()
  conditions: Record<string, any>;

  @IsEnum(RiskAction)
  action: RiskAction;

  @IsEnum(RiskLevel)
  severity: RiskLevel;

  @IsNumber()
  priority: number;

  @IsEnum(RiskRuleStatus)
  status: RiskRuleStatus;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;

  @IsOptional()
  @IsNumber()
  triggerCount?: number;

  @IsOptional()
  createdAt?: Date;

  @IsOptional()
  updatedAt?: Date;
}

/**
 * 更新风控规则 DTO
 */
export class UpdateRiskRuleDto {
  @IsString()
  @IsOptional()
  @MaxLength(100)
  name?: string;

  @IsEnum(RiskType)
  @IsOptional()
  type?: RiskType;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;

  @IsObject()
  @IsOptional()
  conditions?: Record<string, any>;

  @IsEnum(RiskAction)
  @IsOptional()
  action?: RiskAction;

  @IsEnum(RiskLevel)
  @IsOptional()
  severity?: RiskLevel;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  priority?: number;

  @IsOptional()
  @IsEnum(RiskRuleStatus)
  status?: RiskRuleStatus;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

/**
 * 查询风控规则 DTO
 */
export class QueryRiskRulesDto {
  @IsEnum(RiskType)
  @IsOptional()
  type?: RiskType;

  @IsEnum(RiskRuleStatus)
  @IsOptional()
  status?: RiskRuleStatus;

  @IsEnum(RiskAction)
  @IsOptional()
  action?: RiskAction;

  @IsEnum(RiskLevel)
  @IsOptional()
  severity?: RiskLevel;

  @IsString()
  @IsOptional()
  keyword?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  pageSize?: number = 20;
}

// ============================================================
// 黑白名单 DTO
// ============================================================

/**
 * 添加地址到监控列表 DTO
 */
export class AddToWatchlistDto {
  @IsEnum(WatchlistType)
  @IsNotEmpty()
  listType: WatchlistType;

  @IsString()
  @IsNotEmpty()
  @MaxLength(512)
  address: string;

  @IsEnum(BlockchainNetwork)
  @IsNotEmpty()
  chain: BlockchainNetwork;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  reason: string;

  @IsEnum(RiskLevel)
  @IsOptional()
  severity?: RiskLevel = RiskLevel.HIGH;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  source?: string;

  @IsOptional()
  @IsNumber()
  expiresAt?: number;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

/**
 * 监控列表项 DTO
 */
export class WatchlistItemDto {
  @IsString()
  id: string;

  @IsEnum(WatchlistType)
  listType: WatchlistType;

  @IsString()
  address: string;

  @IsEnum(BlockchainNetwork)
  chain: BlockchainNetwork;

  @IsString()
  reason: string;

  @IsEnum(RiskLevel)
  severity: RiskLevel;

  @IsOptional()
  @IsString()
  source?: string;

  @IsOptional()
  @IsNumber()
  expiresAt?: number;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;

  @IsOptional()
  createdAt?: Date;
}

/**
 * 查询监控列表 DTO
 */
export class QueryWatchlistDto {
  @IsEnum(WatchlistType)
  @IsOptional()
  listType?: WatchlistType;

  @IsEnum(BlockchainNetwork)
  @IsOptional()
  chain?: BlockchainNetwork;

  @IsEnum(RiskLevel)
  @IsOptional()
  severity?: RiskLevel;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  keyword?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  pageSize?: number = 20;
}

// ============================================================
// 风控事件 DTO
// ============================================================

/**
 * 风控事件 DTO
 */
export class RiskEventDto {
  @IsString()
  id: string;

  @IsEnum(RiskType)
  type: RiskType;

  @IsEnum(RiskLevel)
  severity: RiskLevel;

  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  transactionHash?: string;

  @IsOptional()
  @IsEnum(BlockchainNetwork)
  chain?: BlockchainNetwork;

  @IsOptional()
  @IsUUID()
  userId?: string;

  @IsOptional()
  @IsObject()
  details?: Record<string, any>;

  @IsOptional()
  @IsEnum(['new', 'reviewing', 'resolved', 'dismissed'])
  status?: string;

  @IsOptional()
  @IsUUID()
  assignedTo?: string;

  @IsOptional()
  createdAt?: Date;

  @IsOptional()
  updatedAt?: Date;
}

/**
 * 查询风控事件 DTO
 */
export class QueryRiskEventsDto {
  @IsEnum(RiskType)
  @IsOptional()
  type?: RiskType;

  @IsEnum(RiskLevel)
  @IsOptional()
  severity?: RiskLevel;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsUUID()
  @IsOptional()
  userId?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  startTime?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  endTime?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  pageSize?: number = 20;
}

// ============================================================
// 风控统计 DTO
// ============================================================

/**
 * 风控统计 DTO
 */
export class RiskStatsDto {
  @IsNumber()
  totalScanned: number;

  @IsNumber()
  todayScanned: number;

  @IsNumber()
  highRiskCount: number;

  @IsNumber()
  mediumRiskCount: number;

  @IsNumber()
  lowRiskCount: number;

  @IsNumber()
  blockedTransactions: number;

  @IsNumber()
  warnedTransactions: number;

  @IsNumber()
  activeRules: number;

  @IsNumber()
  watchlistSize: number;

  @IsNumber()
  openEvents: number;
}

/**
 * AML 检查 DTO
 */
export class AmlCheckDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(512)
  address: string;

  @IsEnum(BlockchainNetwork)
  @IsNotEmpty()
  chain: BlockchainNetwork;

  @IsUUID()
  @IsOptional()
  userId?: string;

  @IsOptional()
  @IsBoolean()
  fullReport?: boolean = false;
}

/**
 * AML 检查结果 DTO
 */
export class AmlCheckResultDto {
  @IsString()
  address: string;

  @IsEnum(BlockchainNetwork)
  chain: BlockchainNetwork;

  @IsBoolean()
  passed: boolean;

  @IsEnum(RiskLevel)
  overallRisk: RiskLevel;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AmlFindingDto)
  findings: AmlFindingDto[];

  @IsOptional()
  @IsString()
  reportUrl?: string;

  @IsNumber()
  checkedAt: number;
}

/**
 * AML 发现项 DTO
 */
export class AmlFindingDto {
  @IsEnum(RiskType)
  type: RiskType;

  @IsEnum(RiskLevel)
  severity: RiskLevel;

  @IsString()
  description: string;

  @IsOptional()
  @IsString()
  source?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsNumber()
  amount?: number;
}
