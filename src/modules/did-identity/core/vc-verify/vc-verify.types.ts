export type VcVerifyStatus = 'valid' | 'invalid' | 'warning' | 'revoked' | 'expired';

export type VcFormat = 'jwt' | 'jsonld' | 'eip712';

export interface VcVerifyInput {
  credential: unknown;
  options?: VcVerifyOptions;
}

export interface VcVerifyOptions {
  verifySignature: boolean;
  checkExpiration: boolean;
  checkRevocation: boolean;
  validateSchema: boolean;
  checkIssuerTrust: boolean;
  verifyOnChainAnchor: boolean;
}

export interface VcVerifyResult {
  valid: boolean;
  status: VcVerifyStatus;
  credential?: unknown;
  errors: VcVerifyError[];
  warnings: VcVerifyWarning[];
  checks: VcVerifyCheck[];
}

export interface VcVerifyError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface VcVerifyWarning {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface VcVerifyCheck {
  checkId: string;
  name: string;
  result: 'pass' | 'fail' | 'warning';
  error?: VcVerifyError;
  warning?: VcVerifyWarning;
}

export interface VcParsed {
  format: VcFormat;
  credential: unknown;
  proof?: VcProof;
  issuer: string;
  subject: string;
  issuanceDate: Date;
  expirationDate?: Date;
  type: string[];
}

export interface VcProof {
  type: string;
  created: string;
  proofPurpose: string;
  verificationMethod: string;
  signature?: string;
  jws?: string;
  [key: string]: unknown;
}

export interface VcRevocationStatus {
  revoked: boolean;
  revokedAt?: Date;
  reason?: string;
}

export interface VcSchemaValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface IssuerTrustInfo {
  trusted: boolean;
  issuerDid: string;
  name?: string;
  reputation?: number;
}

export interface OnChainAnchorInfo {
  anchored: boolean;
  chainId?: string;
  blockHash?: string;
  transactionHash?: string;
  anchoredAt?: Date;
}
