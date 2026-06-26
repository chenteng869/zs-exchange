export type WalletKeyType =
  | 'mnemonic'
  | 'private_key'
  | 'mpc'
  | 'hardware'
  | 'watch_only';

export type ChainType =
  | 'evm'
  | 'solana'
  | 'bitcoin'
  | 'tron';

export type SignType =
  | 'message'
  | 'personal_sign'
  | 'typed_data'
  | 'transaction';

export interface EncryptedPayload {
  version: 'v1';
  algorithm: 'aes-256-gcm';
  kdf: 'scrypt';
  salt: string;
  iv: string;
  tag: string;
  ciphertext: string;
}

export interface CreateMnemonicKeyInput {
  userId: string;
  walletId: string;
  password: string;
  strength?: 128 | 160 | 192 | 224 | 256;
}

export interface ImportMnemonicInput {
  userId: string;
  walletId: string;
  mnemonic: string;
  password: string;
}

export interface ImportPrivateKeyInput {
  userId: string;
  walletId: string;
  privateKey: string;
  password: string;
  chainType: ChainType;
}

export interface DerivedEvmAccount {
  address: string;
  publicKey: string;
  privateKey: string;
  derivationPath: string;
}

export interface DerivedSolanaAccount {
  address: string;
  publicKey: string;
  privateKey: string;
  derivationPath: string;
}

export interface DerivedBitcoinAccount {
  address: string;
  publicKey: string;
  privateKey: string;
  wif: string;
  derivationPath: string;
  scriptType: 'legacy' | 'nested-segwit' | 'native-segwit' | 'taproot';
}

export interface DerivedTronAccount {
  address: string;
  publicKey: string;
  privateKey: string;
  derivationPath: string;
}

export interface SignMessageInput {
  walletId: string;
  userId: string;
  address: string;
  password: string;
  message: string;
  chainType: ChainType;
}

export interface SignTypedDataInput {
  walletId: string;
  userId: string;
  address: string;
  password: string;
  domain: Record<string, unknown>;
  types: Record<string, unknown>;
  message: Record<string, unknown>;
  chainType: ChainType;
}

export interface SignEvmTransactionInput {
  walletId: string;
  userId: string;
  address: string;
  password: string;
  tx: {
    to?: string;
    value?: string;
    data?: string;
    nonce?: number;
    gasLimit?: string;
    gasPrice?: string;
    maxFeePerGas?: string;
    maxPriorityFeePerGas?: string;
    chainId: number;
  };
}

export interface SignSolanaTransactionInput {
  walletId: string;
  userId: string;
  address: string;
  password: string;
  unsignedTx: string;
}

export interface SignBitcoinTransactionInput {
  walletId: string;
  userId: string;
  address: string;
  password: string;
  psbt: string;
}

export interface SignTronTransactionInput {
  walletId: string;
  userId: string;
  address: string;
  password: string;
  transaction: Record<string, unknown>;
}

export interface SignResult {
  signature?: string;
  rawTransaction?: string;
  publicKey?: string;
}

export interface KeyMaterialRecord {
  id: string;
  walletId: string;
  keyType: WalletKeyType;
  encryptionVersion: string;
  encryptedMnemonic?: string;
  encryptedPrivateKey?: string;
  publicKey?: string;
  keyRef?: string;
  derivationRoot?: string;
  kmsProvider?: string;
  status: 'active' | 'rotated' | 'revoked' | 'compromised';
  createdAt: Date;
  updatedAt: Date;
}

export interface KeyRiskAssessment {
  allowed: boolean;
  riskScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  reasons: string[];
  action: 'allow' | 'warn' | 'second_confirm' | 'delay' | 'manual_review' | 'reject';
}

export interface WatchOnlyWalletInput {
  userId: string;
  walletId: string;
  address: string;
  chainType: ChainType;
  publicKey?: string;
}

export interface HardwareWalletInput {
  userId: string;
  walletId: string;
  deviceType: 'ledger' | 'trezor' | 'keystone' | 'onekey';
  deviceId: string;
  addresses: Array<{
    address: string;
    publicKey: string;
    derivationPath: string;
    chainType: ChainType;
  }>;
}

export interface MPCWalletInput {
  userId: string;
  walletId: string;
  partyId: string;
  keyRef: string;
  mpcProvider: string;
  addresses: Array<{
    address: string;
    publicKey: string;
    chainType: ChainType;
  }>;
}

export interface ExportKeyInput {
  walletId: string;
  userId: string;
  password: string;
  exportType: 'mnemonic' | 'private_key' | 'keystore';
  chainType?: ChainType;
  address?: string;
}

export interface ExportKeyResult {
  exportType: string;
  data: string;
  address?: string;
  chainType?: ChainType;
  exportedAt: Date;
}

export interface VerifyBackupInput {
  walletId: string;
  userId: string;
  password: string;
  backupData: string;
  backupType: 'mnemonic' | 'private_key' | 'keystore';
}

export interface VerifyBackupResult {
  valid: boolean;
  address?: string;
  chainType?: ChainType;
  matched: boolean;
}

export interface SignAuditLogEntry {
  id: string;
  walletId: string;
  userId: string;
  address: string;
  chainType: ChainType;
  signType: string;
  timestamp: Date;
  riskScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  action: 'allow' | 'warn' | 'second_confirm' | 'delay' | 'manual_review' | 'reject';
  success: boolean;
  errorCode?: string;
  txHash?: string;
  toAddress?: string;
  amount?: string;
  dappDomain?: string;
  deviceId?: string;
  ipAddress?: string;
}

export interface KeyRotationInput {
  walletId: string;
  userId: string;
  oldPassword: string;
  newPassword: string;
  rotationReason?: string;
}

export interface DestroyKeyInput {
  walletId: string;
  userId: string;
  password: string;
  confirmText: string;
  destroyReason?: string;
}

export interface DestroyKeyResult {
  success: boolean;
  walletId: string;
  destroyedAt: Date;
  backupRequired: boolean;
}

export interface MultiPasswordDerivationInput {
  walletId: string;
  userId: string;
  primaryPassword: string;
  secondaryPassword: string;
  chainType: ChainType;
  index?: number;
}

export interface HardwareWalletSignInput {
  walletId: string;
  userId: string;
  address: string;
  chainType: ChainType;
  signType: SignType;
  payload: unknown;
  deviceId?: string;
}

export interface MPCSignInput {
  walletId: string;
  userId: string;
  address: string;
  chainType: ChainType;
  signType: SignType;
  payload: unknown;
  partyId?: string;
}

export interface RiskRuleConfig {
  ruleCode: string;
  enabled: boolean;
  threshold?: number;
  action?: 'allow' | 'warn' | 'second_confirm' | 'delay' | 'manual_review' | 'reject';
  parameters?: Record<string, unknown>;
}

export interface RiskScoreWeights {
  amountRisk: number;
  addressRisk: number;
  contractRisk: number;
  deviceRisk: number;
  locationRisk: number;
  behaviorRisk: number;
}

export interface LargeAmountThreshold {
  evm: string;
  solana: string;
  bitcoin: string;
  tron: string;
}

export interface DerivedAccount {
  address: string;
  publicKey: string;
  derivationPath: string;
  chainType: ChainType;
}

