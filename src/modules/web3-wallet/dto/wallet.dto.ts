/**
 * Web3 钱包模块 - 钱包相关 DTO
 *
 * 包含钱包创建、查询、更新、删除等操作的数据传输对象
 * 支持多链钱包、HD 钱包、硬件钱包等多种钱包类型
 */

import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsBoolean,
  IsNumber,
  IsUUID,
  IsEmail,
  IsArray,
  MinLength,
  MaxLength,
  Matches,
  IsPositive,
  Min,
  Max,
  ValidateNested,
  IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';

// ============================================================
// 枚举定义
// ============================================================

/**
 * 钱包类型枚举
 */
export enum WalletType {
  EOA = 'eoa',
  HD = 'hd',
  MULTI_SIG = 'multi_sig',
  MPC = 'mpc',
  HARDWARE = 'hardware',
  SMART = 'smart',
  CUSTODIAL = 'custodial',
}

/**
 * 钱包状态枚举
 */
export enum WalletStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  FROZEN = 'frozen',
  SUSPENDED = 'suspended',
  PENDING = 'pending',
  DELETED = 'deleted',
}

/**
 * 区块链网络枚举
 */
export enum BlockchainNetwork {
  ETHEREUM = 'ethereum',
  BSC = 'bsc',
  POLYGON = 'polygon',
  ARBITRUM = 'arbitrum',
  OPTIMISM = 'optimism',
  AVALANCHE = 'avalanche',
  SOLANA = 'solana',
  TRON = 'tron',
  BITCOIN = 'bitcoin',
  BASE = 'base',
  LINEA = 'linea',
  ZKSYNC = 'zksync',
}

/**
 * 钱包安全等级枚举
 */
export enum WalletSecurityLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  ULTRA = 'ultra',
}

// ============================================================
// 基础 DTO
// ============================================================

/**
 * 分页查询基础 DTO
 */
export class PaginationDto {
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
  sortBy?: string;

  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';
}

/**
 * 钱包地址 DTO
 */
export class WalletAddressDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(512)
  address: string;

  @IsEnum(BlockchainNetwork)
  @IsNotEmpty()
  chain: BlockchainNetwork;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  tag?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  memo?: string;
}

// ============================================================
// 创建钱包 DTO
// ============================================================

/**
 * 创建钱包请求 DTO
 */
export class CreateWalletDto {
  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @IsEnum(WalletType)
  @IsNotEmpty()
  type: WalletType;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  name?: string;

  @IsEnum(BlockchainNetwork)
  @IsOptional()
  primaryChain?: BlockchainNetwork;

  @IsOptional()
  @IsArray()
  @IsEnum(BlockchainNetwork, { each: true })
  chains?: BlockchainNetwork[];

  @IsOptional()
  @IsBoolean()
  isHD?: boolean = false;

  @IsOptional()
  @IsNumber()
  @Min(0)
  hdIndex?: number = 0;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

/**
 * 创建 HD 钱包请求 DTO
 */
export class CreateHDWalletDto {
  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  name?: string;

  @IsEnum(BlockchainNetwork)
  @IsNotEmpty()
  primaryChain: BlockchainNetwork;

  @IsOptional()
  @IsArray()
  @IsEnum(BlockchainNetwork, { each: true })
  chains?: BlockchainNetwork[];

  @IsNumber()
  @Min(1)
  @Max(100)
  @IsOptional()
  initialAddressCount?: number = 1;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}

/**
 * 导入钱包请求 DTO
 */
export class ImportWalletDto {
  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @IsEnum(WalletType)
  @IsNotEmpty()
  type: WalletType;

  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(5000)
  privateKey: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  name?: string;

  @IsEnum(BlockchainNetwork)
  @IsOptional()
  chain?: BlockchainNetwork;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

/**
 * 通过助记词导入钱包 DTO
 */
export class ImportMnemonicDto {
  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(12)
  @MaxLength(500)
  mnemonic: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  passphrase?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  name?: string;

  @IsEnum(BlockchainNetwork)
  @IsNotEmpty()
  primaryChain: BlockchainNetwork;

  @IsOptional()
  @IsArray()
  @IsEnum(BlockchainNetwork, { each: true })
  chains?: BlockchainNetwork[];

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}

// ============================================================
// 查询钱包 DTO
// ============================================================

/**
 * 查询钱包列表请求 DTO
 */
export class QueryWalletDto extends PaginationDto {
  @IsUUID()
  @IsOptional()
  userId?: string;

  @IsEnum(WalletType)
  @IsOptional()
  type?: WalletType;

  @IsEnum(WalletStatus)
  @IsOptional()
  status?: WalletStatus;

  @IsEnum(BlockchainNetwork)
  @IsOptional()
  chain?: BlockchainNetwork;

  @IsOptional()
  @IsBoolean()
  isHD?: boolean;

  @IsString()
  @IsOptional()
  keyword?: string;
}

/**
 * 钱包详情响应 DTO
 */
export class WalletDetailDto {
  @IsString()
  id: string;

  @IsUUID()
  userId: string;

  @IsEnum(WalletType)
  type: WalletType;

  @IsString()
  name: string;

  @IsEnum(WalletStatus)
  status: WalletStatus;

  @IsEnum(BlockchainNetwork)
  primaryChain: BlockchainNetwork;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WalletAddressDto)
  addresses: WalletAddressDto[];

  @IsOptional()
  @IsBoolean()
  isHD?: boolean;

  @IsOptional()
  @IsNumber()
  hdIndex?: number;

  @IsEnum(WalletSecurityLevel)
  securityLevel: WalletSecurityLevel;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;

  @IsOptional()
  @IsObject()
  balance?: Record<string, string>;

  @IsOptional()
  createdAt?: Date;

  @IsOptional()
  updatedAt?: Date;
}

// ============================================================
// 更新钱包 DTO
// ============================================================

/**
 * 更新钱包信息 DTO
 */
export class UpdateWalletDto {
  @IsString()
  @IsOptional()
  @MaxLength(100)
  name?: string;

  @IsEnum(WalletStatus)
  @IsOptional()
  status?: WalletStatus;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

/**
 * 钱包重命名 DTO
 */
export class RenameWalletDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;
}

/**
 * 设置主钱包 DTO
 */
export class SetPrimaryWalletDto {
  @IsString()
  @IsNotEmpty()
  walletId: string;
}

// ============================================================
// 钱包地址管理 DTO
// ============================================================

/**
 * 生成新地址 DTO
 */
export class GenerateAddressDto {
  @IsEnum(BlockchainNetwork)
  @IsNotEmpty()
  chain: BlockchainNetwork;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  label?: string;

  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(10)
  count?: number = 1;
}

/**
 * 验证地址 DTO
 */
export class ValidateAddressDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(512)
  address: string;

  @IsEnum(BlockchainNetwork)
  @IsNotEmpty()
  chain: BlockchainNetwork;
}

/**
 * 地址验证结果 DTO
 */
export class AddressValidationResultDto {
  @IsBoolean()
  isValid: boolean;

  @IsString()
  @IsOptional()
  normalizedAddress?: string;

  @IsString()
  @IsOptional()
  format?: string;

  @IsString()
  @IsOptional()
  errorMessage?: string;
}

// ============================================================
// 钱包余额 DTO
// ============================================================

/**
 * 查询余额 DTO
 */
export class QueryBalanceDto {
  @IsEnum(BlockchainNetwork)
  @IsOptional()
  chain?: BlockchainNetwork;

  @IsString()
  @IsOptional()
  tokenAddress?: string;

  @IsOptional()
  @IsBoolean()
  includeFiat?: boolean = true;

  @IsString()
  @IsOptional()
  fiatCurrency?: string = 'USD';
}

/**
 * 余额详情 DTO
 */
export class BalanceDetailDto {
  @IsString()
  currency: string;

  @IsString()
  balance: string;

  @IsString()
  available: string;

  @IsString()
  frozen: string;

  @IsString()
  locked: string;

  @IsOptional()
  @IsString()
  fiatValue?: string;

  @IsOptional()
  @IsString()
  fiatCurrency?: string;

  @IsOptional()
  @IsNumber()
  decimals?: number;

  @IsOptional()
  @IsString()
  tokenAddress?: string;

  @IsEnum(BlockchainNetwork)
  chain: BlockchainNetwork;
}

/**
 * 钱包总余额 DTO
 */
export class TotalBalanceDto {
  @IsString()
  totalFiatValue: string;

  @IsString()
  fiatCurrency: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BalanceDetailDto)
  balances: BalanceDetailDto[];

  @IsNumber()
  lastUpdated: number;
}

// ============================================================
// 钱包安全 DTO
// ============================================================

/**
 * 导出私钥 DTO
 */
export class ExportPrivateKeyDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  @MaxLength(128)
  password: string;

  @IsString()
  @IsOptional()
  verificationCode?: string;
}

/**
 * 导出助记词 DTO
 */
export class ExportMnemonicDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  @MaxLength(128)
  password: string;

  @IsString()
  @IsOptional()
  verificationCode?: string;
}

/**
 * 导出私钥响应 DTO
 */
export class PrivateKeyExportDto {
  @IsString()
  privateKey: string;

  @IsEnum(BlockchainNetwork)
  chain: BlockchainNetwork;

  @IsString()
  address: string;

  @IsNumber()
  expiresAt: number;
}

/**
 * 助记词导出响应 DTO
 */
export class MnemonicExportDto {
  @IsString()
  mnemonic: string;

  @IsString()
  @IsOptional()
  passphrase?: string;

  @IsString()
  derivationPath: string;

  @IsNumber()
  expiresAt: number;
}

// ============================================================
// 钱包删除 DTO
// ============================================================

/**
 * 删除钱包 DTO
 */
export class DeleteWalletDto {
  @IsString()
  @IsOptional()
  @MaxLength(500)
  reason?: string;

  @IsBoolean()
  @IsOptional()
  confirmBackup?: boolean = false;
}

// ============================================================
// 钱包统计 DTO
// ============================================================

/**
 * 钱包统计信息 DTO
 */
export class WalletStatsDto {
  @IsNumber()
  totalWallets: number;

  @IsNumber()
  activeWallets: number;

  @IsNumber()
  totalAddresses: number;

  @IsNumber()
  supportedChains: number;

  @IsString()
  totalBalanceUsd: string;

  @IsNumber()
  todayTransactions: number;

  @IsNumber()
  pendingTransactions: number;
}

/**
 * 钱包操作记录 DTO
 */
export class WalletOperationLogDto {
  @IsString()
  id: string;

  @IsString()
  walletId: string;

  @IsString()
  action: string;

  @IsOptional()
  @IsString()
  details?: string;

  @IsString()
  ipAddress: string;

  @IsOptional()
  @IsString()
  userAgent?: string;

  @IsOptional()
  createdAt?: Date;
}

// ============================================================
// 批量操作 DTO
// ============================================================

/**
 * 批量查询钱包 DTO
 */
export class BatchQueryWalletsDto {
  @IsArray()
  @IsUUID('4', { each: true })
  walletIds: string[];
}

/**
 * 批量冻结/解冻钱包 DTO
 */
export class BatchFreezeWalletsDto {
  @IsArray()
  @IsUUID('4', { each: true })
  walletIds: string[];

  @IsEnum(WalletStatus)
  @IsNotEmpty()
  status: WalletStatus;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  reason?: string;
}
