export type VcFormat = 'jwt' | 'jsonld' | 'eip712';

export type VcStatus = 'issued' | 'revoked' | 'expired';

export interface VcCredentialSchema {
  id: string;
  type: string;
  version: string;
  name: string;
  description?: string;
  properties: Record<string, unknown>;
  required?: string[];
}

export interface VcIssuerInfo {
  did: string;
  name: string;
  url?: string;
  image?: string;
}

export interface VcSubject {
  id: string;
  [key: string]: unknown;
}

export interface VcClaim {
  type: string;
  value: unknown;
  proof?: {
    type: string;
    value: string;
  };
}

export interface VcCredential {
  id: string;
  type: string[];
  issuer: VcIssuerInfo | string;
  issuanceDate: string;
  expirationDate?: string;
  credentialSubject: VcSubject;
  credentialSchema?: VcCredentialSchema;
  proof?: VcProof;
  status?: VcStatus;
  [key: string]: unknown;
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

export interface VcIssueInput {
  templateId: string;
  issuerDid: string;
  subjectDid: string;
  claims: Record<string, unknown>;
  format?: VcFormat;
  expirationDate?: string;
  credentialSchema?: VcCredentialSchema;
  options?: VcIssueOptions;
}

export interface VcIssueOptions {
  includeProof: boolean;
  sign: boolean;
  store: boolean;
  anchorOnChain: boolean;
}

export interface VcIssuePipelineInput {
  input: VcIssueInput;
  actorDid: string;
}

export interface VcIssuePipelinePrepared {
  input: VcIssueInput;
  credential: VcCredential;
  template: VcTemplate;
  issuerInfo: VcIssuerInfo;
}

export interface VcIssuePipelineResult {
  success: boolean;
  credential?: VcCredential;
  credentialId?: string;
  proof?: VcProof;
  error?: string;
  auditId?: string;
}

export interface VcTemplate {
  templateId: string;
  name: string;
  description?: string;
  type: string;
  schemaId: string;
  format: VcFormat;
  claims: VcTemplateClaim[];
  requiredClaims: string[];
  optionalClaims: string[];
  defaultExpirationDays?: number;
  supportedChains?: string[];
  createdAt: number;
  updatedAt: number;
}

export interface VcTemplateClaim {
  name: string;
  type: string;
  required: boolean;
  description?: string;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    enum?: string[];
  };
  defaultValue?: unknown;
}

export interface VcIssueAuditRecord {
  auditId: string;
  credentialId: string;
  issuerDid: string;
  subjectDid: string;
  actorDid: string;
  templateId: string;
  format: VcFormat;
  status: VcStatus;
  createdAt: number;
  details?: Record<string, unknown>;
}

export interface VcTemplateRepository {
  save(template: VcTemplate): Promise<void>;
  get(templateId: string): Promise<VcTemplate | undefined>;
  findByType(type: string): Promise<VcTemplate[]>;
  getAll(): Promise<VcTemplate[]>;
  update(template: VcTemplate): Promise<void>;
  delete(templateId: string): Promise<void>;
}

export interface VcCredentialRepository {
  save(credential: VcCredential): Promise<void>;
  get(credentialId: string): Promise<VcCredential | undefined>;
  findBySubject(subjectId: string): Promise<VcCredential[]>;
  findByIssuer(issuerDid: string): Promise<VcCredential[]>;
  findByType(type: string): Promise<VcCredential[]>;
  update(credential: VcCredential): Promise<void>;
  revoke(credentialId: string): Promise<void>;
  getAll(): Promise<VcCredential[]>;
}

export interface VcIssueAuditRepository {
  save(record: VcIssueAuditRecord): Promise<void>;
  get(auditId: string): Promise<VcIssueAuditRecord | undefined>;
  findByCredentialId(credentialId: string): Promise<VcIssueAuditRecord[]>;
  findByActorDid(actorDid: string): Promise<VcIssueAuditRecord[]>;
  findByIssuerDid(issuerDid: string): Promise<VcIssueAuditRecord[]>;
  getAll(): Promise<VcIssueAuditRecord[]>;
}