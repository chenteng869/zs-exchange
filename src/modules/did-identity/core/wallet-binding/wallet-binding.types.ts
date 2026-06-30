export type WalletBindingStatus = 'pending' | 'verified' | 'revoked';

export type BindingMethod = 'siwe' | 'caip10';

export interface WalletBindingChallenge {
  challengeId: string;
  did: string;
  address: string;
  chainId: string;
  nonce: string;
  message: string;
  expiresAt: number;
  createdAt: number;
}

export interface WalletBindingRecord {
  bindingId: string;
  did: string;
  address: string;
  chainId: string;
  method: BindingMethod;
  status: WalletBindingStatus;
  signedMessage?: string;
  signature?: string;
  verifiedAt?: number;
  revokedAt?: number;
  createdAt: number;
  updatedAt: number;
}

export interface SIWEMessageInput {
  domain: string;
  address: string;
  statement?: string;
  uri: string;
  version: string;
  chainId: number;
  nonce: string;
  issuedAt: string;
  expirationTime?: string;
  notBefore?: string;
  requestId?: string;
  resources?: string[];
}

export interface SIWEMessageParsed {
  domain: string;
  address: string;
  statement?: string;
  uri: string;
  version: string;
  chainId: number;
  nonce: string;
  issuedAt: string;
  expirationTime?: string;
  notBefore?: string;
  requestId?: string;
  resources?: string[];
}

export interface SIWEVerifyResult {
  valid: boolean;
  did?: string;
  address?: string;
  chainId?: number;
  error?: string;
  message?: SIWEMessageParsed;
}

export interface WalletBindingChallengeInput {
  did: string;
  address: string;
  chainId: string;
}

export interface WalletBindingInput {
  challengeId: string;
  signature: string;
}

export interface WalletBindingCreateInput {
  did: string;
  address: string;
  chainId: string;
  method: BindingMethod;
  signature?: string;
}

export interface WalletBindingRepository {
  save(record: WalletBindingRecord): Promise<void>;
  get(bindingId: string): Promise<WalletBindingRecord | undefined>;
  findByDid(did: string): Promise<WalletBindingRecord[]>;
  findByAddress(address: string): Promise<WalletBindingRecord[]>;
  findByDidAndAddress(did: string, address: string): Promise<WalletBindingRecord | undefined>;
  update(record: WalletBindingRecord): Promise<void>;
  delete(bindingId: string): Promise<void>;
  revokeByDid(did: string): Promise<void>;
  getAll(): Promise<WalletBindingRecord[]>;
}

export interface WalletBindingChallengeRepository {
  save(challenge: WalletBindingChallenge): Promise<void>;
  get(challengeId: string): Promise<WalletBindingChallenge | undefined>;
  findByDid(did: string): Promise<WalletBindingChallenge[]>;
  findByAddress(address: string): Promise<WalletBindingChallenge[]>;
  delete(challengeId: string): Promise<void>;
  deleteExpired(): Promise<void>;
  clear(): Promise<void>;
}

export interface WalletBindingPolicyConfig {
  maxBindingsPerDid: number;
  bindingExpirationDays: number;
  challengeExpirationMinutes: number;
  allowMultipleChains: boolean;
  requireVerifiedDid: boolean;
}

export interface WalletBindingResult {
  success: boolean;
  binding?: WalletBindingRecord;
  message?: string;
  error?: string;
}