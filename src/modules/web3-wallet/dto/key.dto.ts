/**
 * Web3 钱包模块 - 密钥管理相关 DTO
 *
 * 包含密钥生成、存储、备份、恢复等操作的数据传输对象
 * 支持 HD 钱包、多链密钥派生、密钥加密存储等功能
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
  IsHexadecimal,
} from 'class-validator';
import { Type } from 'class-transformer';
import { BlockchainNetwork, WalletType } from './wallet.dto';

// ============================================================
// 枚举定义
// ============================================================

/**
 * 密钥类型枚举
 */
export enum KeyType {
  PRIVATE_KEY = 'private_key',
  MNEMONIC = 'mnemonic',
  KEYSTORE = 'keystore',
  SEED_PHRASE = 'seed_phrase',
  HD_KEY_SHARE = 'key_share',
}

/**
 * 密钥加密算法枚举
 */
export enum EncryptionAlgorithm {
  AES_256_GCM = 'aes-256-gcm',
  AES_256_CBC = 'aes-256-cbc',
  XSALSA20_POLY1305 = 'xsalsa20-poly1305',
  SCRYPT = 'scrypt',
  PBKDF2 = 'pbkdf2',
}

/**
 * 密钥存储类型枚举
 */
export enum KeyStorageType {
  LOCAL_ENCRYPTED = 'local_encrypted',
  HARDWARE_WALLET = 'hardware_wallet',
  CLOUD_ENCRYPTED = 'cloud_encrypted',
  MPC = 'mpc',
  KMS = 'kms',
}

/**
 * 派生路径用途枚举
 */
export enum DerivationPurpose {
  EXTERNAL = 'external',
  INTERNAL = 'internal',
  STAKE = 'stake',
  GOVERNANCE = 'governance',
}

// ============================================================
// 密钥生成 DTO
// ============================================================

/**
 * 生成私钥 DTO
 */
export class GeneratePrivateKeyDto {
  @IsEnum(BlockchainNetwork)
  @IsNotEmpty()
  chain: BlockchainNetwork;

  @IsEnum(KeyType)
  @IsOptional()
  keyType?: KeyType = KeyType.PRIVATE_KEY;

  @IsOptional()
  @IsString()
  @MaxLength(128)
  password?: string;

  @IsOptional()
  @IsEnum(EncryptionAlgorithm)
  encryptionAlgorithm?: EncryptionAlgorithm = EncryptionAlgorithm.AES_256_GCM;
}

/**
 * 生成助记词 DTO
 */
export class GenerateMnemonicDto {
  @IsOptional()
  @IsNumber()
  @Min(12)
  @Max(24)
  wordCount?: number = 12;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  passphrase?: string;

  @IsOptional()
  @IsEnum(BlockchainNetwork)
  primaryChain?: BlockchainNetwork = BlockchainNetwork.ETHEREUM;

  @IsOptional()
  @IsString()
  @MaxLength(128)
  password?: string;
}

/**
 * 生成 HD 钱包 DTO
 */
export class GenerateHDWalletDto {
  @IsOptional()
  @IsNumber()
  @Min(12)
  @Max(24)
  wordCount?: number = 12;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  passphrase?: string;

  @IsEnum(BlockchainNetwork)
  @IsNotEmpty()
  primaryChain: BlockchainNetwork;

  @IsOptional()
  @IsArray()
  @IsEnum(BlockchainNetwork, { each: true })
  chains?: BlockchainNetwork[];

  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(100)
  initialAddressCount?: number = 1;

  @IsOptional()
  @IsString()
  @MaxLength(128)
  password?: string;
}

// ============================================================
// 密钥派生 DTO
// ============================================================

/**
 * 派生密钥 DTO
 */
export class DeriveKeyDto {
  @IsString()
  @IsNotEmpty()
  masterKeyId: string;

  @IsEnum(BlockchainNetwork)
  @IsNotEmpty()
  chain: BlockchainNetwork;

  @IsOptional()
  @IsNumber()
  @Min(0)
  accountIndex?: number = 0;

  @IsOptional()
  @IsNumber()
  @Min(0)
  changeIndex?: number = 0;

  @IsOptional()
  @IsNumber()
  @Min(0)
  addressIndex?: number = 0;

  @IsOptional()
  @IsString()
  customPath?: string;

  @IsOptional()
  @IsString()
  @MaxLength(128)
  password?: string;
}

/**
 * 批量派生地址 DTO
 */
export class DeriveAddressesDto {
  @IsString()
  @IsNotEmpty()
  masterKeyId: string;

  @IsEnum(BlockchainNetwork)
  @IsNotEmpty()
  chain: BlockchainNetwork;

  @IsNumber()
  @Min(1)
  @Max(100)
  count: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  startIndex?: number = 0;

  @IsOptional()
  @IsEnum(DerivationPurpose)
  purpose?: DerivationPurpose = DerivationPurpose.EXTERNAL;

  @IsOptional()
  @IsString()
  @MaxLength(128)
  password?: string;
}

/**
 * 派生地址结果 DTO
 */
export class DerivedAddressDto {
  @IsString()
  address: string;

  @IsString()
  path: string;

  @IsNumber()
  index: number;

  @IsEnum(BlockchainNetwork)
  chain: BlockchainNetwork;

  @IsOptional()
  @IsString()
  publicKey?: string;
}

// ============================================================
// 密钥导入 DTO
// ============================================================

/**
 * 导入私钥 DTO
 */
export class ImportPrivateKeyDto {
  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(5000)
  privateKey: string;

  @IsEnum(BlockchainNetwork)
  @IsNotEmpty()
  chain: BlockchainNetwork;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(128)
  password?: string;

  @IsOptional()
  @IsEnum(EncryptionAlgorithm)
  encryptionAlgorithm?: EncryptionAlgorithm;
}

/**
 * 导入助记词 DTO
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

  @IsOptional()
  @IsString()
  @MaxLength(100)
  passphrase?: string;

  @IsEnum(BlockchainNetwork)
  @IsNotEmpty()
  primaryChain: BlockchainNetwork;

  @IsOptional()
  @IsArray()
  @IsEnum(BlockchainNetwork, { each: true })
  chains?: BlockchainNetwork[];

  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(128)
  password?: string;
}

/**
 * 导入 Keystore DTO
 */
export class ImportKeystoreDto {
  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @IsObject()
  @IsNotEmpty()
  keystore: Record<string, any>;

  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  password: string;

  @IsEnum(BlockchainNetwork)
  @IsNotEmpty()
  chain: BlockchainNetwork;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;
}

// ============================================================
// 密钥导出 DTO
// ============================================================

/**
 * 导出私钥请求 DTO
 */
export class ExportKeyDto {
  @IsString()
  @IsNotEmpty()
  keyId: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  @MaxLength(128)
  password: string;

  @IsOptional()
  @IsString()
  verificationCode?: string;

  @IsOptional()
  @IsEnum(KeyType)
  exportFormat?: KeyType;
}

/**
 * 导出私钥响应 DTO
 */
export class ExportedPrivateKeyDto {
  @IsString()
  privateKey: string;

  @IsString()
  address: string;

  @IsEnum(BlockchainNetwork)
  chain: BlockchainNetwork;

  @IsEnum(KeyType)
  format: KeyType;

  @IsNumber()
  expiresAt: number;
}

/**
 * 导出助记词响应 DTO
 */
export class ExportedMnemonicDto {
  @IsString()
  mnemonic: string;

  @IsOptional()
  @IsString()
  passphrase?: string;

  @IsString()
  derivationPath: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DerivedAddressDto)
  addresses: DerivedAddressDto[];

  @IsNumber()
  expiresAt: number;
}

// ============================================================
// 密钥加密 DTO
// ============================================================

/**
 * 加密私钥 DTO
 */
export class EncryptKeyDto {
  @IsString()
  @IsNotEmpty()
  privateKey: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  @MaxLength(128)
  password: string;

  @IsOptional()
  @IsEnum(EncryptionAlgorithm)
  algorithm?: EncryptionAlgorithm = EncryptionAlgorithm.AES_256_GCM;

  @IsOptional()
  @IsObject()
  options?: Record<string, any>;
}

/**
 * 解密私钥 DTO
 */
export class DecryptKeyDto {
  @IsString()
  @IsNotEmpty()
  encryptedKey: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  @MaxLength(128)
  password: string;

  @IsOptional()
  @IsEnum(EncryptionAlgorithm)
  algorithm?: EncryptionAlgorithm;
}

/**
 * 加密结果 DTO
 */
export class EncryptedKeyDto {
  @IsString()
  encryptedData: string;

  @IsEnum(EncryptionAlgorithm)
  algorithm: EncryptionAlgorithm;

  @IsString()
  salt: string;

  @IsOptional()
  @IsString()
  iv?: string;

  @IsOptional()
  @IsNumber()
  iterations?: number;

  @IsNumber()
  createdAt: number;
}

// ============================================================
// 密钥查询 DTO
// ============================================================

/**
 * 查询密钥列表 DTO
 */
export class QueryKeyDto {
  @IsUUID()
  @IsOptional()
  userId?: string;

  @IsEnum(KeyType)
  @IsOptional()
  type?: KeyType;

  @IsEnum(BlockchainNetwork)
  @IsOptional()
  chain?: BlockchainNetwork;

  @IsEnum(KeyStorageType)
  @IsOptional()
  storageType?: KeyStorageType;

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
 * 密钥详情 DTO
 */
export class KeyDetailDto {
  @IsString()
  id: string;

  @IsUUID()
  userId: string;

  @IsEnum(KeyType)
  type: KeyType;

  @IsEnum(KeyStorageType)
  storageType: KeyStorageType;

  @IsEnum(EncryptionAlgorithm)
  encryptionAlgorithm: EncryptionAlgorithm;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsEnum(BlockchainNetwork)
  chain?: BlockchainNetwork;

  @IsOptional()
  @IsBoolean()
  isHD?: boolean;

  @IsOptional()
  @IsString()
  derivationPath?: string;

  @IsOptional()
  @IsNumber()
  lastUsedAt?: number;

  @IsOptional()
  @IsNumber()
  createdAt: number;

  @IsOptional()
  @IsNumber()
  updatedAt: number;
}

// ============================================================
// 密钥备份 DTO
// ============================================================

/**
 * 创建密钥备份 DTO
 */
export class CreateKeyBackupDto {
  @IsString()
  @IsNotEmpty()
  keyId: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  @MaxLength(128)
  password: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  hint?: string;

  @IsOptional()
  @IsEnum(EncryptionAlgorithm)
  encryptionAlgorithm?: EncryptionAlgorithm;
}

/**
 * 密钥备份 DTO
 */
export class KeyBackupDto {
  @IsString()
  backupId: string;

  @IsString()
  encryptedData: string;

  @IsEnum(EncryptionAlgorithm)
  encryptionAlgorithm: EncryptionAlgorithm;

  @IsOptional()
  @IsString()
  hint?: string;

  @IsNumber()
  createdAt: number;

  @IsNumber()
  expiresAt: number;
}

/**
 * 恢复密钥备份 DTO
 */
export class RestoreKeyBackupDto {
  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsNotEmpty()
  backupId: string;

  @IsString()
  @IsNotEmpty()
  encryptedData: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  @MaxLength(128)
  password: string;
}

// ============================================================
// 密钥验证 DTO
// ============================================================

/**
 * 验证私钥 DTO
 */
export class ValidatePrivateKeyDto {
  @IsString()
  @IsNotEmpty()
  privateKey: string;

  @IsEnum(BlockchainNetwork)
  @IsNotEmpty()
  chain: BlockchainNetwork;

  @IsOptional()
  @IsString()
  expectedAddress?: string;
}

/**
 * 验证助记词 DTO
 */
export class ValidateMnemonicDto {
  @IsString()
  @IsNotEmpty()
  mnemonic: string;

  @IsOptional()
  @IsNumber()
  @Min(12)
  @Max(24)
  expectedWordCount?: number;
}

/**
 * 密钥验证结果 DTO
 */
export class KeyValidationResultDto {
  @IsBoolean()
  isValid: boolean;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  publicKey?: string;

  @IsOptional()
  @IsString()
  errorMessage?: string;

  @IsOptional()
  @IsArray()
  warnings?: string[];
}

// ============================================================
// 助记词相关 DTO
// ============================================================

/**
 * 助记词词表类型
 */
export enum MnemonicLanguage {
  ENGLISH = 'english',
  CHINESE_SIMPLIFIED = 'chinese_simplified',
  CHINESE_TRADITIONAL = 'chinese_traditional',
  JAPANESE = 'japanese',
  KOREAN = 'korean',
  FRENCH = 'french',
  SPANISH = 'spanish',
}

/**
 * 生成助记词选项 DTO
 */
export class MnemonicOptionsDto {
  @IsOptional()
  @IsNumber()
  @Min(12)
  @Max(24)
  wordCount?: number = 12;

  @IsOptional()
  @IsEnum(MnemonicLanguage)
  language?: MnemonicLanguage = MnemonicLanguage.ENGLISH;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  passphrase?: string;
}

// ============================================================
// 密钥轮换 DTO
// ============================================================

/**
 * 密钥轮换 DTO
 */
export class RotateKeyDto {
  @IsString()
  @IsNotEmpty()
  keyId: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  @MaxLength(128)
  currentPassword: string;

  @IsOptional()
  @IsString()
  @MinLength(6)
  @MaxLength(128)
  newPassword?: string;

  @IsOptional()
  @IsEnum(EncryptionAlgorithm)
  newAlgorithm?: EncryptionAlgorithm;
}

/**
 * 密钥删除 DTO
 */
export class DeleteKeyDto {
  @IsString()
  @IsNotEmpty()
  keyId: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  @MaxLength(128)
  password: string;

  @IsOptional()
  @IsBoolean()
  confirmDelete?: boolean = false;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}

// ============================================================
// 密钥安全 DTO
// ============================================================

/**
 * 密钥安全策略 DTO
 */
export class KeySecurityPolicyDto {
  @IsBoolean()
  requirePasswordForExport: boolean;

  @IsBoolean()
  require2FAForExport: boolean;

  @IsOptional()
  @IsNumber()
  @Min(1)
  maxExportPerDay?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  autoLockTimeout?: number;

  @IsOptional()
  @IsBoolean()
  biometricEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  hardwareWalletRequired?: boolean;
}

/**
 * 密钥使用记录 DTO
 */
export class KeyUsageLogDto {
  @IsString()
  id: string;

  @IsString()
  keyId: string;

  @IsString()
  action: string;

  @IsOptional()
  @IsString()
  ipAddress?: string;

  @IsOptional()
  @IsString()
  userAgent?: string;

  @IsOptional()
  @IsBoolean()
  success?: boolean;

  @IsNumber()
  timestamp: number;
}
