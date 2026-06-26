/**
 * Web3 钱包模块 - 交易相关 DTO
 *
 * 包含链上交易构建、签名、广播、查询等操作的数据传输对象
 * 支持原生币转账、Token 转账、合约交互、Gas 估算等功能
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
  IsPositive,
  Min,
  Max,
  ValidateNested,
  IsObject,
  IsHexadecimal,
  Matches,
} from 'class-validator';
import { Type } from 'class-transformer';
import { BlockchainNetwork } from './wallet.dto';

// ============================================================
// 枚举定义
// ============================================================

/**
 * 交易类型枚举
 */
export enum TransactionType {
  NATIVE_TRANSFER = 'native_transfer',
  TOKEN_TRANSFER = 'token_transfer',
  CONTRACT_CALL = 'contract_call',
  CONTRACT_DEPLOY = 'contract_deploy',
  APPROVE = 'approve',
  SWAP = 'swap',
  STAKE = 'stake',
  UNSTAKE = 'unstake',
  BRIDGE = 'bridge',
  NFT_MINT = 'nft_mint',
  NFT_TRANSFER = 'nft_transfer',
  MULTI_SEND = 'multi_send',
}

/**
 * 交易状态枚举
 */
export enum TransactionStatus {
  PENDING = 'pending',
  SIGNED = 'signed',
  BROADCASTED = 'broadcasted',
  CONFIRMING = 'confirming',
  CONFIRMED = 'confirmed',
  FAILED = 'failed',
  REVERTED = 'reverted',
  CANCELLED = 'cancelled',
  DROPPED = 'dropped',
  REPLACED = 'replaced',
}

/**
 * 交易速度枚举
 */
export enum TransactionSpeed {
  SLOW = 'slow',
  NORMAL = 'normal',
  FAST = 'fast',
  INSTANT = 'instant',
  CUSTOM = 'custom',
}

/**
 * Gas 价格模式枚举
 */
export enum GasPriceMode {
  LEGACY = 'legacy',
  EIP1559 = 'eip1559',
}

// ============================================================
// 基础 DTO
// ============================================================

/**
 * 交易查询分页 DTO
 */
export class TransactionPaginationDto {
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
// 构建交易 DTO
// ============================================================

/**
 * 构建原生币转账交易 DTO
 */
export class BuildNativeTransferDto {
  @IsString()
  @IsNotEmpty()
  fromAddress: string;

  @IsString()
  @IsNotEmpty()
  toAddress: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^\d+(\.\d+)?$/)
  amount: string;

  @IsEnum(BlockchainNetwork)
  @IsNotEmpty()
  chain: BlockchainNetwork;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  memo?: string;
}

/**
 * 构建 Token 转账交易 DTO
 */
export class BuildTokenTransferDto {
  @IsString()
  @IsNotEmpty()
  fromAddress: string;

  @IsString()
  @IsNotEmpty()
  toAddress: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^\d+(\.\d+)?$/)
  amount: string;

  @IsString()
  @IsNotEmpty()
  tokenAddress: string;

  @IsEnum(BlockchainNetwork)
  @IsNotEmpty()
  chain: BlockchainNetwork;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(36)
  decimals?: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  memo?: string;
}

/**
 * 构建合约调用交易 DTO
 */
export class BuildContractCallDto {
  @IsString()
  @IsNotEmpty()
  fromAddress: string;

  @IsString()
  @IsNotEmpty()
  contractAddress: string;

  @IsString()
  @IsNotEmpty()
  functionName: string;

  @IsOptional()
  @IsArray()
  functionParams?: any[];

  @IsOptional()
  @IsString()
  @IsHexadecimal()
  data?: string;

  @IsString()
  @IsOptional()
  @Matches(/^\d+(\.\d+)?$/)
  value?: string;

  @IsEnum(BlockchainNetwork)
  @IsNotEmpty()
  chain: BlockchainNetwork;
}

/**
 * 构建 Approve 交易 DTO
 */
export class BuildApproveDto {
  @IsString()
  @IsNotEmpty()
  fromAddress: string;

  @IsString()
  @IsNotEmpty()
  tokenAddress: string;

  @IsString()
  @IsNotEmpty()
  spenderAddress: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^\d+(\.\d+)?$/)
  amount: string;

  @IsEnum(BlockchainNetwork)
  @IsNotEmpty()
  chain: BlockchainNetwork;

  @IsOptional()
  @IsBoolean()
  unlimited?: boolean = false;
}

/**
 * 批量转账接收人 DTO
 */
export class MultiSendRecipientDto {
  @IsString()
  @IsNotEmpty()
  address: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^\d+(\.\d+)?$/)
  amount: string;
}

/**
 * 构建批量转账交易 DTO
 */
export class BuildMultiSendDto {
  @IsString()
  @IsNotEmpty()
  fromAddress: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MultiSendRecipientDto)
  recipients: MultiSendRecipientDto[];

  @IsOptional()
  @IsString()
  tokenAddress?: string;

  @IsEnum(BlockchainNetwork)
  @IsNotEmpty()
  chain: BlockchainNetwork;
}

// ============================================================
// 签名交易 DTO
// ============================================================

/**
 * 签名交易请求 DTO
 */
export class SignTransactionDto {
  @IsUUID()
  @IsNotEmpty()
  walletId: string;

  @IsString()
  @IsNotEmpty()
  fromAddress: string;

  @IsEnum(BlockchainNetwork)
  @IsNotEmpty()
  chain: BlockchainNetwork;

  @IsObject()
  @IsNotEmpty()
  transaction: Record<string, any>;

  @IsOptional()
  @IsString()
  @MaxLength(128)
  password?: string;

  @IsOptional()
  @IsString()
  verificationCode?: string;

  @IsOptional()
  @IsObject()
  signOptions?: Record<string, any>;
}

/**
 * 签名消息 DTO
 */
export class SignMessageDto {
  @IsUUID()
  @IsNotEmpty()
  walletId: string;

  @IsString()
  @IsNotEmpty()
  address: string;

  @IsEnum(BlockchainNetwork)
  @IsNotEmpty()
  chain: BlockchainNetwork;

  @IsString()
  @IsNotEmpty()
  message: string;

  @IsOptional()
  @IsEnum(['personal', 'typed_data', 'eip712'])
  signType?: string = 'personal';

  @IsOptional()
  @IsObject()
  typedData?: Record<string, any>;

  @IsOptional()
  @IsString()
  @MaxLength(128)
  password?: string;
}

/**
 * 签名交易响应 DTO
 */
export class SignedTransactionDto {
  @IsString()
  signedTx: string;

  @IsString()
  txHash: string;

  @IsString()
  from: string;

  @IsEnum(BlockchainNetwork)
  chain: BlockchainNetwork;

  @IsNumber()
  signedAt: number;
}

/**
 * 签名消息响应 DTO
 */
export class SignedMessageDto {
  @IsString()
  signature: string;

  @IsString()
  address: string;

  @IsString()
  message: string;

  @IsEnum(BlockchainNetwork)
  chain: BlockchainNetwork;

  @IsNumber()
  signedAt: number;
}

// ============================================================
// 广播交易 DTO
// ============================================================

/**
 * 广播交易 DTO
 */
export class BroadcastTransactionDto {
  @IsString()
  @IsNotEmpty()
  signedTx: string;

  @IsEnum(BlockchainNetwork)
  @IsNotEmpty()
  chain: BlockchainNetwork;

  @IsOptional()
  @IsUUID()
  walletId?: string;

  @IsOptional()
  @IsEnum(TransactionType)
  type?: TransactionType;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

/**
 * 广播交易响应 DTO
 */
export class BroadcastResultDto {
  @IsString()
  txHash: string;

  @IsEnum(TransactionStatus)
  status: TransactionStatus;

  @IsEnum(BlockchainNetwork)
  chain: BlockchainNetwork;

  @IsNumber()
  broadcastedAt: number;

  @IsOptional()
  @IsString()
  explorerUrl?: string;
}

// ============================================================
// 交易查询 DTO
// ============================================================

/**
 * 查询交易列表 DTO
 */
export class QueryTransactionDto extends TransactionPaginationDto {
  @IsUUID()
  @IsOptional()
  userId?: string;

  @IsUUID()
  @IsOptional()
  walletId?: string;

  @IsEnum(TransactionType)
  @IsOptional()
  type?: TransactionType;

  @IsEnum(TransactionStatus)
  @IsOptional()
  status?: TransactionStatus;

  @IsEnum(BlockchainNetwork)
  @IsOptional()
  chain?: BlockchainNetwork;

  @IsString()
  @IsOptional()
  fromAddress?: string;

  @IsString()
  @IsOptional()
  toAddress?: string;

  @IsString()
  @IsOptional()
  txHash?: string;

  @IsString()
  @IsOptional()
  tokenAddress?: string;

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
}

/**
 * 交易详情 DTO
 */
export class TransactionDetailDto {
  @IsString()
  id: string;

  @IsUUID()
  userId: string;

  @IsUUID()
  walletId: string;

  @IsEnum(TransactionType)
  type: TransactionType;

  @IsEnum(TransactionStatus)
  status: TransactionStatus;

  @IsEnum(BlockchainNetwork)
  chain: BlockchainNetwork;

  @IsString()
  txHash: string;

  @IsString()
  fromAddress: string;

  @IsOptional()
  @IsString()
  toAddress?: string;

  @IsOptional()
  @IsString()
  contractAddress?: string;

  @IsString()
  amount: string;

  @IsOptional()
  @IsString()
  tokenSymbol?: string;

  @IsOptional()
  @IsString()
  tokenAddress?: string;

  @IsOptional()
  @IsNumber()
  decimals?: number;

  @IsString()
  gasLimit: string;

  @IsOptional()
  @IsString()
  gasPrice?: string;

  @IsOptional()
  @IsString()
  maxFeePerGas?: string;

  @IsOptional()
  @IsString()
  maxPriorityFeePerGas?: string;

  @IsOptional()
  @IsString()
  gasUsed?: string;

  @IsOptional()
  @IsString()
  transactionFee?: string;

  @IsOptional()
  @IsString()
  feeFiatValue?: string;

  @IsOptional()
  @IsNumber()
  nonce?: number;

  @IsOptional()
  @IsString()
  blockNumber?: string;

  @IsOptional()
  @IsNumber()
  blockTimestamp?: number;

  @IsOptional()
  @IsNumber()
  confirmations?: number;

  @IsOptional()
  @IsNumber()
  requiredConfirmations?: number;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  inputData?: string;

  @IsOptional()
  @IsObject()
  decodedData?: Record<string, any>;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;

  @IsOptional()
  createdAt?: Date;

  @IsOptional()
  updatedAt?: Date;

  @IsOptional()
  confirmedAt?: Date;
}

// ============================================================
// Gas 相关 DTO
// ============================================================

/**
 * Gas 价格 DTO
 */
export class GasPriceDto {
  @IsEnum(GasPriceMode)
  mode: GasPriceMode;

  @IsOptional()
  @IsString()
  gasPrice?: string;

  @IsOptional()
  @IsString()
  maxFeePerGas?: string;

  @IsOptional()
  @IsString()
  maxPriorityFeePerGas?: string;

  @IsNumber()
  gasLimit: number;

  @IsOptional()
  @IsString()
  estimatedFee?: string;

  @IsOptional()
  @IsString()
  feeFiatValue?: string;
}

/**
 * Gas 价格估算 DTO
 */
export class EstimateGasDto {
  @IsEnum(BlockchainNetwork)
  @IsNotEmpty()
  chain: BlockchainNetwork;

  @IsOptional()
  @IsString()
  fromAddress?: string;

  @IsOptional()
  @IsString()
  toAddress?: string;

  @IsOptional()
  @IsString()
  value?: string;

  @IsOptional()
  @IsString()
  data?: string;

  @IsOptional()
  @IsEnum(TransactionType)
  type?: TransactionType;
}

/**
 * Gas 费用估算响应 DTO
 */
export class GasEstimationDto {
  @IsEnum(BlockchainNetwork)
  chain: BlockchainNetwork;

  @IsEnum(GasPriceMode)
  mode: GasPriceMode;

  @IsNumber()
  gasLimit: number;

  @IsObject()
  slow: GasPriceInfoDto;

  @IsObject()
  normal: GasPriceInfoDto;

  @IsObject()
  fast: GasPriceInfoDto;

  @IsObject()
  instant: GasPriceInfoDto;

  @IsNumber()
  baseFee: number;

  @IsOptional()
  @IsNumber()
  priorityFee?: number;

  @IsNumber()
  updatedAt: number;
}

/**
 * Gas 价格详情 DTO
 */
export class GasPriceInfoDto {
  @IsOptional()
  @IsString()
  gasPrice?: string;

  @IsOptional()
  @IsString()
  maxFeePerGas?: string;

  @IsOptional()
  @IsString()
  maxPriorityFeePerGas?: string;

  @IsString()
  estimatedFee: string;

  @IsString()
  feeFiatValue: string;

  @IsNumber()
  estimatedTime: number;
}

// ============================================================
// 交易加速/取消 DTO
// ============================================================

/**
 * 加速交易 DTO
 */
export class SpeedUpTransactionDto {
  @IsString()
  @IsNotEmpty()
  txId: string;

  @IsEnum(TransactionSpeed)
  @IsOptional()
  speed?: TransactionSpeed;

  @IsOptional()
  @IsString()
  customGasPrice?: string;

  @IsOptional()
  @IsString()
  customMaxFeePerGas?: string;

  @IsOptional()
  @IsString()
  customMaxPriorityFeePerGas?: string;

  @IsOptional()
  @IsNumber()
  @Min(10)
  @Max(1000)
  bumpPercent?: number = 20;
}

/**
 * 取消交易 DTO
 */
export class CancelTransactionDto {
  @IsString()
  @IsNotEmpty()
  txId: string;

  @IsEnum(TransactionSpeed)
  @IsOptional()
  speed?: TransactionSpeed;

  @IsOptional()
  @IsString()
  customGasPrice?: string;
}

// ============================================================
// 交易历史 DTO
// ============================================================

/**
 * 获取链上交易历史 DTO
 */
export class GetChainTransactionHistoryDto extends TransactionPaginationDto {
  @IsString()
  @IsNotEmpty()
  address: string;

  @IsEnum(BlockchainNetwork)
  @IsNotEmpty()
  chain: BlockchainNetwork;

  @IsEnum(TransactionType)
  @IsOptional()
  type?: TransactionType;

  @IsString()
  @IsOptional()
  tokenAddress?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  startTime?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  endTime?: number;
}

/**
 * 链上交易简要信息 DTO
 */
export class ChainTransactionBriefDto {
  @IsString()
  txHash: string;

  @IsEnum(BlockchainNetwork)
  chain: BlockchainNetwork;

  @IsEnum(TransactionType)
  type: TransactionType;

  @IsEnum(TransactionStatus)
  status: TransactionStatus;

  @IsString()
  from: string;

  @IsString()
  to: string;

  @IsString()
  value: string;

  @IsOptional()
  @IsString()
  tokenSymbol?: string;

  @IsOptional()
  @IsString()
  tokenAddress?: string;

  @IsOptional()
  @IsNumber()
  blockNumber?: number;

  @IsOptional()
  @IsNumber()
  timestamp?: number;

  @IsOptional()
  @IsString()
  txFee?: string;
}

// ============================================================
// 交易收据 DTO
// ============================================================

/**
 * 获取交易收据 DTO
 */
export class GetTransactionReceiptDto {
  @IsString()
  @IsNotEmpty()
  txHash: string;

  @IsEnum(BlockchainNetwork)
  @IsNotEmpty()
  chain: BlockchainNetwork;
}

/**
 * 交易收据 DTO
 */
export class TransactionReceiptDto {
  @IsString()
  transactionHash: string;

  @IsNumber()
  transactionIndex: number;

  @IsString()
  blockHash: string;

  @IsNumber()
  blockNumber: number;

  @IsString()
  from: string;

  @IsOptional()
  @IsString()
  to?: string;

  @IsNumber()
  cumulativeGasUsed: number;

  @IsNumber()
  gasUsed: number;

  @IsString()
  contractAddress: string;

  @IsArray()
  logs: any[];

  @IsString()
  logsBloom: string;

  @IsNumber()
  status: number;

  @IsString()
  effectiveGasPrice: string;

  @IsEnum(BlockchainNetwork)
  chain: BlockchainNetwork;
}

// ============================================================
// Nonce 管理 DTO
// ============================================================

/**
 * 获取 Nonce DTO
 */
export class GetNonceDto {
  @IsString()
  @IsNotEmpty()
  address: string;

  @IsEnum(BlockchainNetwork)
  @IsNotEmpty()
  chain: BlockchainNetwork;

  @IsOptional()
  @IsEnum(['latest', 'pending', 'earliest'])
  blockTag?: string = 'latest';
}

/**
 * Nonce 响应 DTO
 */
export class NonceDto {
  @IsString()
  address: string;

  @IsEnum(BlockchainNetwork)
  chain: BlockchainNetwork;

  @IsNumber()
  nonce: number;

  @IsOptional()
  @IsNumber()
  pendingNonce?: number;

  @IsNumber()
  updatedAt: number;
}

// ============================================================
// 交易统计 DTO
// ============================================================

/**
 * 交易统计 DTO
 */
export class TransactionStatsDto {
  @IsNumber()
  totalTransactions: number;

  @IsNumber()
  todayTransactions: number;

  @IsNumber()
  pendingTransactions: number;

  @IsNumber()
  confirmedTransactions: number;

  @IsNumber()
  failedTransactions: number;

  @IsString()
  totalVolumeUsd: string;

  @IsString()
  todayVolumeUsd: string;

  @IsString()
  totalFeesUsd: string;

  @IsNumber()
  averageConfirmationTime: number;
}
