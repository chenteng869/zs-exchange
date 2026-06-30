export type IssuerStatus = 'active' | 'suspended' | 'revoked';

export type IssuerTrustLevel = 'trusted' | 'verified' | 'unverified' | 'suspicious';

export interface IssuerInfo {
  issuerId: string;
  did: string;
  name: string;
  description?: string;
  logoUrl?: string;
  websiteUrl?: string;
  email?: string;
  status: IssuerStatus;
  trustLevel: IssuerTrustLevel;
  supportedSchemas: string[];
  supportedCredentialTypes: string[];
  createdAt: number;
  updatedAt?: number;
}

export interface IssuerRegistrationOptions {
  did: string;
  name: string;
  description?: string;
  logoUrl?: string;
  websiteUrl?: string;
  email?: string;
  supportedSchemas?: string[];
  supportedCredentialTypes?: string[];
}

export interface IssuerVerificationResult {
  valid: boolean;
  didExists: boolean;
  didActive: boolean;
  trustLevel: IssuerTrustLevel;
  errors: IssuerVerificationError[];
}

export interface IssuerVerificationError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface TrustRegistryEntry {
  entryId: string;
  issuerDid: string;
  issuerInfo: IssuerInfo;
  trusted: boolean;
  trustLevel: IssuerTrustLevel;
  trustedBy: string;
  trustedAt: number;
  expiresAt?: number;
  revocationReason?: string;
}

export interface TrustRegistryQueryOptions {
  issuerDid?: string;
  trustLevel?: IssuerTrustLevel;
  status?: IssuerStatus;
  limit?: number;
  offset?: number;
}

export interface IssuerMetrics {
  issuerId: string;
  totalCredentialsIssued: number;
  totalCredentialsRevoked: number;
  activeCredentials: number;
  averageCredentialLifetime: number;
  verificationRate: number;
  lastActivityAt: number;
}

export interface IssuerPolicy {
  policyId: string;
  issuerId: string;
  maxCredentialLifetime?: number;
  allowedSchemaIds: string[];
  allowedCredentialTypes: string[];
  requireIdentityVerification: boolean;
  requireKyc: boolean;
  createdAt: number;
  updatedAt?: number;
}