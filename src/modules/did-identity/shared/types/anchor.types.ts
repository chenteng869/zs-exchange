export type AnchorStatus = 'pending' | 'confirmed' | 'failed' | 'revoked';

export type AnchorType = 'did-registry' | 'credential-hash' | 'revocation-root';

export interface AnchorTransaction {
  anchorId: string;
  did: string;
  type: AnchorType;
  chainId: string;
  chainNamespace: string;
  transactionHash: string;
  blockNumber?: number;
  blockTimestamp?: number;
  status: AnchorStatus;
  data?: string;
  gasUsed?: string;
  gasPrice?: string;
  createdAt: number;
  confirmedAt?: number;
  failedAt?: number;
  failureReason?: string;
}

export interface AnchorContractInfo {
  chainId: string;
  chainNamespace: string;
  contractAddress: string;
  contractName: string;
  contractVersion: string;
  abi: Record<string, unknown>[];
  deployedAt: number;
}

export interface AnchorOptions {
  did: string;
  type: AnchorType;
  chainId: string;
  chainNamespace: string;
  data?: string;
  algorithm?: 'keccak256' | 'sha256' | 'sha3-256' | string;
}

export interface AnchorResult {
  did: string;
  hash: string;
  chainId: string;
  timestamp: string;
  status: AnchorStatus;
  blockNumber: number | null;
  transactionHash: string | null;
}

export interface AnchorVerificationResult {
  valid: boolean;
  existsOnChain: boolean;
  confirmed: boolean;
  transactionHash?: string;
  blockNumber?: number;
  blockTimestamp?: number;
  error?: string;
}

export interface CredentialHashOnChain {
  hashId: string;
  credentialId: string;
  did: string;
  hash: string;
  chainId: string;
  transactionHash: string;
  blockNumber: number;
  anchoredAt: number;
}

export interface RevocationRoot {
  rootId: string;
  did: string;
  rootHash: string;
  chainId: string;
  transactionHash: string;
  blockNumber: number;
  anchoredAt: number;
  revokedCredentialIds: string[];
}

export interface AnchorMetrics {
  totalAnchors: number;
  confirmedAnchors: number;
  failedAnchors: number;
  averageConfirmationTime: number;
  totalGasUsed: string;
}
