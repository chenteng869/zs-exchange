/**
 * Web3 钱包模块 - MPC (Multi-Party Computation) 相关 DTO
 *
 * 包含多方计算、门限签名、密钥分片等操作的数据传输对象
 * 支持 2-2、2-3、t-n 等多种签名模式和审批流程
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
 * MPC 钱包类型枚举
 */
export enum MPCWalletType {
  TWO_TWO = '2-2',
  TWO_THREE = '2-3',
  THREE_FIVE = '3-5',
  CUSTOM = 'custom',
}

/**
 * MPC 密钥分片状态枚举
 */
export enum KeyShareStatus {
  PENDING = 'pending',
  GENERATED = 'generated',
  VERIFIED = 'verified',
  REVOKED = 'revoked',
  EXPIRED = 'expired',
}

/**
 * MPC 签名会话状态枚举
 */
export enum SigningSessionStatus {
  CREATED = 'created',
  WAITING_APPROVAL = 'waiting_approval',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  SIGNING = 'signing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled',
}

/**
 * MPC 参与者角色枚举
 */
export enum ParticipantRole {
  ADMIN = 'admin',
  SIGNER = 'signer',
  APPROVER = 'approver',
  OBSERVER = 'observer',
}

/**
 * 审批策略类型枚举
 */
export enum ApprovalPolicyType {
  ANY = 'any',
  ALL = 'all',
  MAJORITY = 'majority',
  THRESHOLD = 'threshold',
  HIERARCHICAL = 'hierarchical',
}

// ============================================================
// MPC 钱包管理 DTO
// ============================================================

/**
 * 创建 MPC 钱包 DTO
 */
export class CreateMPCWalletDto {
  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @IsEnum(MPCWalletType)
  @IsNotEmpty()
  type: MPCWalletType;

  @IsEnum(BlockchainNetwork)
  @IsNotEmpty()
  chain: BlockchainNetwork;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  name?: string;

  @IsNumber()
  @Min(2)
  @Max(10)
  totalParticipants: number;

  @IsNumber()
  @Min(1)
  @Max(10)
  threshold: number;

  @IsArray()
  @IsString({ each: true })
  participantIds: string[];

  @IsEnum(ApprovalPolicyType)
  @IsOptional()
  approvalPolicy?: ApprovalPolicyType = ApprovalPolicyType.THRESHOLD;

  @IsOptional()
  @IsNumber()
  @Min(1)
  approvalThreshold?: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}

/**
 * MPC 钱包详情 DTO
 */
export class MPCWalletDetailDto {
  @IsString()
  id: string;

  @IsUUID()
  userId: string;

  @IsEnum(MPCWalletType)
  type: MPCWalletType;

  @IsEnum(BlockchainNetwork)
  chain: BlockchainNetwork;

  @IsString()
  name: string;

  @IsString()
  address: string;

  @IsString()
  status: string;

  @IsNumber()
  totalParticipants: number;

  @IsNumber()
  threshold: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MPCParticipantDto)
  participants: MPCParticipantDto[];

  @IsEnum(ApprovalPolicyType)
  approvalPolicy: ApprovalPolicyType;

  @IsOptional()
  @IsNumber()
  approvalThreshold?: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  createdAt?: Date;

  @IsOptional()
  updatedAt?: Date;
}

/**
 * MPC 参与者 DTO
 */
export class MPCParticipantDto {
  @IsString()
  id: string;

  @IsUUID()
  userId: string;

  @IsString()
  username: string;

  @IsEnum(ParticipantRole)
  role: ParticipantRole;

  @IsEnum(KeyShareStatus)
  keyShareStatus: KeyShareStatus;

  @IsOptional()
  @IsString()
  publicKey?: string;

  @IsOptional()
  @IsNumber()
  shareIndex?: number;

  @IsOptional()
  @IsNumber()
  joinedAt?: number;
}

// ============================================================
// 密钥分片 DTO
// ============================================================

/**
 * 生成密钥分片 DTO
 */
export class GenerateKeySharesDto {
  @IsString()
  @IsNotEmpty()
  walletId: string;

  @IsArray()
  @IsString({ each: true })
  participantIds: string[];

  @IsNumber()
  @Min(2)
  @Max(10)
  totalShares: number;

  @IsNumber()
  @Min(1)
  @Max(10)
  threshold: number;
}

/**
 * 密钥分片 DTO
 */
export class KeyShareDto {
  @IsString()
  shareId: string;

  @IsNumber()
  shareIndex: number;

  @IsString()
  participantId: string;

  @IsEnum(KeyShareStatus)
  status: KeyShareStatus;

  @IsOptional()
  @IsString()
  publicKey?: string;

  @IsOptional()
  @IsNumber()
  generatedAt?: number;

  @IsOptional()
  @IsNumber()
  verifiedAt?: number;
}

/**
 * 验证密钥分片 DTO
 */
export class VerifyKeyShareDto {
  @IsString()
  @IsNotEmpty()
  walletId: string;

  @IsString()
  @IsNotEmpty()
  shareId: string;

  @IsString()
  @IsNotEmpty()
  proof: string;
}

/**
 * 密钥分片验证结果 DTO
 */
export class KeyShareVerificationResultDto {
  @IsBoolean()
  isValid: boolean;

  @IsString()
  shareId: string;

  @IsOptional()
  @IsString()
  errorMessage?: string;

  @IsOptional()
  @IsNumber()
  verifiedAt?: number;
}

// ============================================================
// MPC 签名会话 DTO
// ============================================================

/**
 * 创建签名会话 DTO
 */
export class CreateSigningSessionDto {
  @IsString()
  @IsNotEmpty()
  walletId: string;

  @IsEnum(TransactionType)
  @IsNotEmpty()
  transactionType: TransactionType;

  @IsObject()
  @IsNotEmpty()
  transactionData: Record<string, any>;

  @IsEnum(BlockchainNetwork)
  @IsNotEmpty()
  chain: BlockchainNetwork;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsNumber()
  @Min(60)
  @Max(86400)
  expiresIn?: number = 3600;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

/**
 * 签名会话详情 DTO
 */
export class SigningSessionDetailDto {
  @IsString()
  id: string;

  @IsString()
  walletId: string;

  @IsEnum(SigningSessionStatus)
  status: SigningSessionStatus;

  @IsEnum(TransactionType)
  transactionType: TransactionType;

  @IsObject()
  transactionData: Record<string, any>;

  @IsEnum(BlockchainNetwork)
  chain: BlockchainNetwork;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SigningApprovalDto)
  approvals: SigningApprovalDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SigningParticipantDto)
  participants: SigningParticipantDto[];

  @IsNumber()
  requiredSignatures: number;

  @IsNumber()
  currentSignatures: number;

  @IsOptional()
  @IsString()
  signature?: string;

  @IsOptional()
  @IsString()
  signedTx?: string;

  @IsOptional()
  @IsString()
  txHash?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;

  @IsNumber()
  expiresAt: number;

  @IsNumber()
  createdAt: number;

  @IsOptional()
  @IsNumber()
  completedAt?: number;
}

/**
 * 签名审批 DTO
 */
export class SigningApprovalDto {
  @IsString()
  id: string;

  @IsString()
  approverId: string;

  @IsString()
  approverName: string;

  @IsEnum(['approved', 'rejected', 'pending'])
  status: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  comment?: string;

  @IsOptional()
  @IsNumber()
  approvedAt?: number;
}

/**
 * 签名参与者 DTO
 */
export class SigningParticipantDto {
  @IsString()
  participantId: string;

  @IsString()
  participantName: string;

  @IsBoolean()
  hasSigned: boolean;

  @IsOptional()
  @IsNumber()
  signedAt?: number;

  @IsOptional()
  @IsString()
  signatureShare?: string;
}

/**
 * 审批签名会话 DTO
 */
export class ApproveSigningSessionDto {
  @IsString()
  @IsNotEmpty()
  sessionId: string;

  @IsBoolean()
  @IsNotEmpty()
  approved: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  comment?: string;

  @IsOptional()
  @IsString()
  verificationCode?: string;
}

/**
 * 提交签名分片 DTO
 */
export class SubmitSignatureShareDto {
  @IsString()
  @IsNotEmpty()
  sessionId: string;

  @IsString()
  @IsNotEmpty()
  shareId: string;

  @IsString()
  @IsNotEmpty()
  signatureShare: string;

  @IsOptional()
  @IsString()
  publicKey?: string;
}

// ============================================================
// 审批策略 DTO
// ============================================================

/**
 * 创建审批策略 DTO
 */
export class CreateApprovalPolicyDto {
  @IsString()
  @IsNotEmpty()
  walletId: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @IsEnum(ApprovalPolicyType)
  @IsNotEmpty()
  type: ApprovalPolicyType;

  @IsOptional()
  @IsNumber()
  @Min(1)
  threshold?: number;

  @IsArray()
  @IsString({ each: true })
  approverIds: string[];

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsObject()
  rules?: Record<string, any>;
}

/**
 * 审批策略 DTO
 */
export class ApprovalPolicyDto {
  @IsString()
  id: string;

  @IsString()
  walletId: string;

  @IsString()
  name: string;

  @IsEnum(ApprovalPolicyType)
  type: ApprovalPolicyType;

  @IsOptional()
  @IsNumber()
  threshold?: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PolicyApproverDto)
  approvers: PolicyApproverDto[];

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsObject()
  rules?: Record<string, any>;

  @IsBoolean()
  isActive: boolean;

  @IsOptional()
  createdAt?: Date;

  @IsOptional()
  updatedAt?: Date;
}

/**
 * 策略审批人 DTO
 */
export class PolicyApproverDto {
  @IsString()
  userId: string;

  @IsString()
  username: string;

  @IsEnum(ParticipantRole)
  role: ParticipantRole;

  @IsOptional()
  @IsNumber()
  weight?: number;
}

/**
 * 更新审批策略 DTO
 */
export class UpdateApprovalPolicyDto {
  @IsString()
  @IsOptional()
  @MaxLength(100)
  name?: string;

  @IsEnum(ApprovalPolicyType)
  @IsOptional()
  type?: ApprovalPolicyType;

  @IsOptional()
  @IsNumber()
  @Min(1)
  threshold?: number;

  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  approverIds?: string[];

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsObject()
  rules?: Record<string, any>;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

// ============================================================
// MPC 查询 DTO
// ============================================================

/**
 * 查询 MPC 钱包列表 DTO
 */
export class QueryMPCWalletsDto {
  @IsUUID()
  @IsOptional()
  userId?: string;

  @IsEnum(MPCWalletType)
  @IsOptional()
  type?: MPCWalletType;

  @IsEnum(BlockchainNetwork)
  @IsOptional()
  chain?: BlockchainNetwork;

  @IsString()
  @IsOptional()
  status?: string;

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

/**
 * 查询签名会话列表 DTO
 */
export class QuerySigningSessionsDto {
  @IsString()
  @IsOptional()
  walletId?: string;

  @IsEnum(SigningSessionStatus)
  @IsOptional()
  status?: SigningSessionStatus;

  @IsEnum(TransactionType)
  @IsOptional()
  transactionType?: TransactionType;

  @IsEnum(BlockchainNetwork)
  @IsOptional()
  chain?: BlockchainNetwork;

  @IsUUID()
  @IsOptional()
  participantId?: string;

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
// MPC 统计 DTO
// ============================================================

/**
 * MPC 钱包统计 DTO
 */
export class MPCStatsDto {
  @IsNumber()
  totalWallets: number;

  @IsNumber()
  activeWallets: number;

  @IsNumber()
  totalParticipants: number;

  @IsNumber()
  pendingSessions: number;

  @IsNumber()
  todaySessions: number;

  @IsNumber()
  totalSignatures: number;

  @IsNumber()
  averageSigningTime: number;

  @IsNumber()
  successRate: number;
}

/**
 * MPC 安全审计 DTO
 */
export class MPCAuditLogDto {
  @IsString()
  id: string;

  @IsString()
  walletId: string;

  @IsString()
  action: string;

  @IsOptional()
  @IsString()
  sessionId?: string;

  @IsUUID()
  operatorId: string;

  @IsString()
  operatorName: string;

  @IsOptional()
  @IsString()
  ipAddress?: string;

  @IsOptional()
  @IsObject()
  details?: Record<string, any>;

  @IsNumber()
  timestamp: number;
}
