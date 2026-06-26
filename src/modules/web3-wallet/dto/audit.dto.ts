/**
 * Web3 钱包模块 - 审计相关 DTO
 *
 * 包含审计日志、操作记录、变更追踪等数据传输对象
 * 支持完整的审计追踪和合规报告生成
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
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';

// ============================================================
// 枚举定义
// ============================================================

/**
 * 审计日志类型枚举
 */
export enum AuditLogType {
  WALLET_CREATE = 'wallet_create',
  WALLET_DELETE = 'wallet_delete',
  WALLET_UPDATE = 'wallet_update',
  WALLET_FREEZE = 'wallet_freeze',
  WALLET_UNFREEZE = 'wallet_unfreeze',
  KEY_EXPORT = 'key_export',
  KEY_IMPORT = 'key_import',
  KEY_GENERATE = 'key_generate',
  TRANSACTION_CREATE = 'transaction_create',
  TRANSACTION_SIGN = 'transaction_sign',
  TRANSACTION_BROADCAST = 'transaction_broadcast',
  TRANSACTION_SPEEDUP = 'transaction_speedup',
  TRANSACTION_CANCEL = 'transaction_cancel',
  APPROVAL_CREATE = 'approval_create',
  APPROVAL_APPROVE = 'approval_approve',
  APPROVAL_REJECT = 'approval_reject',
  MPC_SIGNING_START = 'mpc_signing_start',
  MPC_SIGNING_COMPLETE = 'mpc_signing_complete',
  RISK_ALERT = 'risk_alert',
  RISK_BLOCK = 'risk_block',
  ADDRESS_WHITELIST_ADD = 'address_whitelist_add',
  ADDRESS_BLACKLIST_ADD = 'address_blacklist_add',
  LOGIN = 'login',
  LOGOUT = 'logout',
  PASSWORD_CHANGE = 'password_change',
  TWO_FA_ENABLE = 'two_fa_enable',
  TWO_FA_DISABLE = 'two_fa_disable',
  API_KEY_CREATE = 'api_key_create',
  API_KEY_DELETE = 'api_key_delete',
  SETTINGS_CHANGE = 'settings_change',
}

/**
 * 审计操作状态枚举
 */
export enum AuditStatus {
  SUCCESS = 'success',
  FAILED = 'failed',
  PENDING = 'pending',
  PARTIAL = 'partial',
}

/**
 * 审计日志模块枚举
 */
export enum AuditModule {
  WALLET = 'wallet',
  KEY = 'key',
  TRANSACTION = 'transaction',
  MPC = 'mpc',
  RISK = 'risk',
  ADDRESS = 'address',
  DAPP = 'dapp',
  AUTH = 'auth',
  SYSTEM = 'system',
}

// ============================================================
// 审计日志 DTO
// ============================================================

/**
 * 创建审计日志 DTO
 */
export class CreateAuditLogDto {
  @IsEnum(AuditModule)
  @IsNotEmpty()
  module: AuditModule;

  @IsEnum(AuditLogType)
  @IsNotEmpty()
  action: AuditLogType;

  @IsEnum(AuditStatus)
  @IsOptional()
  status?: AuditStatus = AuditStatus.SUCCESS;

  @IsUUID()
  @IsOptional()
  operatorId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  operatorName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  operatorRole?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  targetId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  targetType?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  details?: string;

  @IsOptional()
  @IsObject()
  beforeData?: Record<string, any>;

  @IsOptional()
  @IsObject()
  afterData?: Record<string, any>;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  ipAddress?: string;

  @IsOptional()
  @IsString()
  @MaxLength(512)
  userAgent?: string;

  @IsOptional()
  @IsString()
  @MaxLength(512)
  requestId?: string;

  @IsOptional()
  @IsNumber()
  duration?: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  errorMessage?: string;
}

/**
 * 审计日志详情 DTO
 */
export class AuditLogDetailDto {
  @IsString()
  id: string;

  @IsEnum(AuditModule)
  module: AuditModule;

  @IsEnum(AuditLogType)
  action: AuditLogType;

  @IsEnum(AuditStatus)
  status: AuditStatus;

  @IsUUID()
  operatorId: string;

  @IsOptional()
  @IsString()
  operatorName?: string;

  @IsOptional()
  @IsString()
  operatorRole?: string;

  @IsOptional()
  @IsString()
  targetId?: string;

  @IsOptional()
  @IsString()
  targetType?: string;

  @IsOptional()
  @IsString()
  details?: string;

  @IsOptional()
  @IsObject()
  beforeData?: Record<string, any>;

  @IsOptional()
  @IsObject()
  afterData?: Record<string, any>;

  @IsOptional()
  @IsString()
  ipAddress?: string;

  @IsOptional()
  @IsString()
  userAgent?: string;

  @IsOptional()
  @IsString()
  requestId?: string;

  @IsOptional()
  @IsNumber()
  duration?: number;

  @IsOptional()
  @IsString()
  errorMessage?: string;

  @IsOptional()
  @IsDateString()
  createdAt?: Date;
}

/**
 * 查询审计日志 DTO
 */
export class QueryAuditLogDto {
  @IsEnum(AuditModule)
  @IsOptional()
  module?: AuditModule;

  @IsEnum(AuditLogType)
  @IsOptional()
  action?: AuditLogType;

  @IsEnum(AuditStatus)
  @IsOptional()
  status?: AuditStatus;

  @IsUUID()
  @IsOptional()
  operatorId?: string;

  @IsOptional()
  @IsString()
  operatorName?: string;

  @IsOptional()
  @IsString()
  targetId?: string;

  @IsOptional()
  @IsString()
  targetType?: string;

  @IsOptional()
  @IsString()
  ipAddress?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  startTime?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  endTime?: number;

  @IsOptional()
  @IsString()
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

  @IsOptional()
  @IsString()
  sortBy?: string = 'createdAt';

  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';
}

// ============================================================
// 变更日志 DTO
// ============================================================

/**
 * 变更日志 DTO
 */
export class ChangeLogDto {
  @IsString()
  id: string;

  @IsString()
  tableName: string;

  @IsString()
  recordId: string;

  @IsEnum(['insert', 'update', 'delete'])
  operation: string;

  @IsOptional()
  @IsObject()
  beforeValue?: Record<string, any>;

  @IsOptional()
  @IsObject()
  afterValue?: Record<string, any>;

  @IsUUID()
  changedBy: string;

  @IsOptional()
  @IsString()
  changedByName?: string;

  @IsOptional()
  @IsDateString()
  createdAt?: Date;
}

/**
 * 查询变更日志 DTO
 */
export class QueryChangeLogDto {
  @IsOptional()
  @IsString()
  tableName?: string;

  @IsOptional()
  @IsString()
  recordId?: string;

  @IsOptional()
  @IsEnum(['insert', 'update', 'delete'])
  operation?: string;

  @IsUUID()
  @IsOptional()
  changedBy?: string;

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
// 审计报告 DTO
// ============================================================

/**
 * 生成审计报告 DTO
 */
export class GenerateAuditReportDto {
  @IsEnum(AuditModule)
  @IsOptional()
  module?: AuditModule;

  @IsUUID()
  @IsOptional()
  operatorId?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  startTime: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  endTime: number;

  @IsOptional()
  @IsArray()
  @IsEnum(AuditLogType, { each: true })
  actionTypes?: AuditLogType[];

  @IsOptional()
  @IsEnum(['daily', 'weekly', 'monthly', 'custom'])
  period?: string = 'custom';

  @IsOptional()
  @IsString()
  @MaxLength(100)
  reportName?: string;
}

/**
 * 审计报告 DTO
 */
export class AuditReportDto {
  @IsString()
  reportId: string;

  @IsString()
  reportName: string;

  @IsOptional()
  @IsEnum(AuditModule)
  module?: AuditModule;

  @IsNumber()
  startTime: number;

  @IsNumber()
  endTime: number;

  @IsObject()
  summary: AuditReportSummaryDto;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AuditLogDetailDto)
  logs: AuditLogDetailDto[];

  @IsOptional()
  @IsArray()
  charts?: any[];

  @IsNumber()
  totalCount: number;

  @IsNumber()
  generatedAt: number;

  @IsOptional()
  @IsString()
  downloadUrl?: string;
}

/**
 * 审计报告摘要 DTO
 */
export class AuditReportSummaryDto {
  @IsNumber()
  totalActions: number;

  @IsNumber()
  successCount: number;

  @IsNumber()
  failedCount: number;

  @IsNumber()
  pendingCount: number;

  @IsObject()
  actionBreakdown: Record<string, number>;

  @IsObject()
  moduleBreakdown: Record<string, number>;

  @IsObject()
  operatorBreakdown: Record<string, number>;

  @IsOptional()
  @IsNumber()
  riskEvents?: number;

  @IsOptional()
  @IsNumber()
  highRiskActions?: number;
}

// ============================================================
// 登录审计 DTO
// ============================================================

/**
 * 登录日志 DTO
 */
export class LoginLogDto {
  @IsString()
  id: string;

  @IsUUID()
  userId: string;

  @IsOptional()
  @IsString()
  username?: string;

  @IsOptional()
  @IsString()
  ipAddress?: string;

  @IsOptional()
  @IsString()
  userAgent?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsEnum(['success', 'failed', 'locked', '2fa_required'])
  status: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  failureReason?: string;

  @IsOptional()
  @IsString()
  deviceType?: string;

  @IsOptional()
  @IsString()
  os?: string;

  @IsOptional()
  @IsString()
  browser?: string;

  @IsOptional()
  @IsDateString()
  createdAt?: Date;
}

/**
 * 查询登录日志 DTO
 */
export class QueryLoginLogDto {
  @IsUUID()
  @IsOptional()
  userId?: string;

  @IsOptional()
  @IsString()
  username?: string;

  @IsOptional()
  @IsString()
  ipAddress?: string;

  @IsOptional()
  @IsEnum(['success', 'failed', 'locked', '2fa_required'])
  status?: string;

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
// API 访问日志 DTO
// ============================================================

/**
 * API 访问日志 DTO
 */
export class ApiAccessLogDto {
  @IsString()
  id: string;

  @IsUUID()
  userId?: string;

  @IsOptional()
  @IsUUID()
  apiKeyId?: string;

  @IsString()
  endpoint: string;

  @IsString()
  method: string;

  @IsNumber()
  statusCode: number;

  @IsNumber()
  responseTime: number;

  @IsNumber()
  requestSize: number;

  @IsNumber()
  responseSize: number;

  @IsOptional()
  @IsString()
  ipAddress?: string;

  @IsOptional()
  @IsString()
  userAgent?: string;

  @IsOptional()
  @IsString()
  errorMessage?: string;

  @IsOptional()
  @IsDateString()
  createdAt?: Date;
}

/**
 * 查询 API 访问日志 DTO
 */
export class QueryApiAccessLogDto {
  @IsUUID()
  @IsOptional()
  userId?: string;

  @IsOptional()
  @IsUUID()
  apiKeyId?: string;

  @IsOptional()
  @IsString()
  endpoint?: string;

  @IsOptional()
  @IsString()
  method?: string;

  @IsOptional()
  @IsNumber()
  statusCode?: number;

  @IsOptional()
  @IsString()
  ipAddress?: string;

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
// 审计统计 DTO
// ============================================================

/**
 * 审计统计 DTO
 */
export class AuditStatsDto {
  @IsNumber()
  totalLogs: number;

  @IsNumber()
  todayLogs: number;

  @IsObject()
  moduleDistribution: Record<string, number>;

  @IsObject()
  actionDistribution: Record<string, number>;

  @IsObject()
  statusDistribution: Record<string, number>;

  @IsNumber()
  uniqueOperators: number;

  @IsNumber()
  failedActions: number;

  @IsNumber()
  riskEvents: number;

  @IsNumber()
  apiRequests: number;

  @IsNumber()
  loginAttempts: number;

  @IsNumber()
  failedLogins: number;
}

/**
 * 审计导出 DTO
 */
export class AuditExportDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AuditLogDetailDto)
  data: AuditLogDetailDto[];

  @IsString()
  format: string;

  @IsNumber()
  totalCount: number;

  @IsNumber()
  exportedAt: number;
}

/**
 * 审计保留策略 DTO
 */
export class AuditRetentionPolicyDto {
  @IsNumber()
  retentionDays: number;

  @IsBoolean()
  autoArchive: boolean;

  @IsOptional()
  @IsNumber()
  archiveAfterDays?: number;

  @IsOptional()
  @IsString()
  archiveLocation?: string;

  @IsBoolean()
  immutableStorage: boolean;

  @IsOptional()
  @IsObject()
  moduleSettings?: Record<string, any>;
}
