export type VcFormat = 'jwt' | 'json-ld' | 'eip712';

export type VcType =
  | 'VerifiableCredential'
  | 'IdentityCredential'
  | 'EmailCredential'
  | 'PhoneCredential'
  | 'KycCredential'
  | 'MembershipCredential'
  | 'AcademicCredential'
  | 'EmploymentCredential'
  | 'AttestationCredential'
  | 'VoucherCredential';

export interface VerifiableCredential {
  '@context': string | string[];
  id?: string;
  type: string | string[];
  issuer: string | Issuer;
  issuanceDate: string;
  expirationDate?: string;
  credentialSubject: CredentialSubject;
  credentialStatus?: CredentialStatus;
  proof?: Proof;
  credentialSchema?: CredentialSchema;
  refreshService?: RefreshService;
  termsOfUse?: TermsOfUse[];
  evidence?: Evidence[];
}

export interface Issuer {
  id: string;
  name?: string;
  [key: string]: unknown;
}

export interface CredentialSubject {
  id?: string;
  [key: string]: unknown;
}

export interface CredentialStatus {
  id: string;
  type: string;
  statusListIndex?: string;
  statusListCredential?: string;
  revocationListIndex?: string;
  revocationListCredential?: string;
}

export interface Proof {
  type: string;
  created: string;
  verificationMethod: string;
  proofPurpose: string;
  signatureValue: string;
  challenge?: string;
  domain?: string;
  jws?: string;
  proofValue?: string;
}

export interface CredentialSchema {
  id: string;
  type: string;
}

export interface RefreshService {
  id: string;
  type: string;
}

export interface TermsOfUse {
  id?: string;
  type: string;
}

export interface Evidence {
  id?: string;
  type: string;
  [key: string]: unknown;
}

export interface VcIssuanceOptions {
  type: VcType[];
  issuerDid: string;
  subjectDid: string;
  credentialSubject: Record<string, unknown>;
  expirationDate?: string;
  credentialSchema?: CredentialSchema;
  credentialStatus?: CredentialStatus;
  format?: VcFormat;
  privateKey?: string;
  verificationMethodId?: string;
}

export interface VcVerificationResult {
  valid: boolean;
  errors: VcVerificationError[];
  warnings: VcVerificationWarning[];
}

export interface VcVerificationError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface VcVerificationWarning {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface VcRevocationOptions {
  credentialId: string;
  revocationListIndex?: string;
  reason?: string;
}

export interface VcRevocationRecord {
  revocationId: string;
  credentialId: string;
  did: string;
  revokedAt: number;
  reason?: string;
  revocationListIndex?: string;
}

export interface VcStatusList2021 {
  '@context': string[];
  id: string;
  type: string[];
  issuer: string;
  issuanceDate: string;
  credentialSubject: {
    id: string;
    type: string;
    statusListIndex: string;
    statusPurpose: string;
  };
  proof?: Proof;
}

export interface VcStorageRecord {
  storageId: string;
  credential: VerifiableCredential;
  credentialId: string;
  did: string;
  issuerDid: string;
  format: VcFormat;
  storedAt: number;
  updatedAt?: number;
}

export interface JwtVcPayload {
  iss: string;
  sub: string;
  aud?: string;
  exp?: number;
  nbf?: number;
  iat: number;
  jti: string;
  vc: {
    '@context': string[];
    type: string[];
    credentialSubject: Record<string, unknown>;
    credentialSchema?: CredentialSchema;
    credentialStatus?: CredentialStatus;
  };
}

export interface Eip712VcPayload {
  domain: {
    name: string;
    version: string;
    chainId: string;
    verifyingContract?: string;
  };
  types: Record<string, { name: string; type: string }[]>;
  primaryType: string;
  message: Record<string, unknown>;
}