export type WalletBindingStatus = 'pending' | 'confirmed' | 'revoked';

export type WalletBindingType = 'siwe' | 'caip-10' | 'eip-712' | 'personal-sign';

export interface WalletBinding {
  bindingId: string;
  did: string;
  userId?: string;
  blockchainAddress: string;
  chainId: string;
  chainNamespace: string;
  bindingType: WalletBindingType;
  status: WalletBindingStatus;
  signature?: string;
  message?: string;
  signedAt?: number;
  confirmedAt?: number;
  revokedAt?: number;
  createdAt: number;
}

export interface SiweMessage {
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

export interface SiweVerificationResult {
  valid: boolean;
  did?: string;
  address?: string;
  error?: string;
  message?: SiweMessage;
}

export interface Caip10Link {
  chainId: string;
  accountId: string;
  did: string;
}

export interface WalletBindingCreateOptions {
  did: string;
  blockchainAddress: string;
  chainId: string;
  chainNamespace: string;
  bindingType: WalletBindingType;
  message?: string;
  signature?: string;
}

export interface WalletBindingVerificationOptions {
  bindingId: string;
  signature: string;
  message: string;
}

export interface MultiChainBinding {
  did: string;
  userId?: string;
  bindings: WalletBinding[];
  primaryBindingId?: string;
}

export interface WalletBindingEvent {
  eventId: string;
  bindingId: string;
  did: string;
  type: 'created' | 'confirmed' | 'revoked';
  timestamp: number;
  data?: Record<string, unknown>;
}