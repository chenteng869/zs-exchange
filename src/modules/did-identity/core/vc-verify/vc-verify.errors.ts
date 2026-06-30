export class VcVerifyError extends Error {
  code: string;
  details?: Record<string, unknown>;

  constructor(message: string, code: string, details?: Record<string, unknown>) {
    super(message);
    this.code = code;
    this.details = details;
    this.name = 'VcVerifyError';
  }
}

export class InvalidFormatError extends VcVerifyError {
  constructor(message: string) {
    super(`Invalid VC format: ${message}`, 'INVALID_FORMAT');
    this.name = 'InvalidFormatError';
  }
}

export class MissingProofError extends VcVerifyError {
  constructor() {
    super('VC is missing proof', 'MISSING_PROOF');
    this.name = 'MissingProofError';
  }
}

export class InvalidProofError extends VcVerifyError {
  constructor(message: string) {
    super(`Invalid proof: ${message}`, 'INVALID_PROOF');
    this.name = 'InvalidProofError';
  }
}

export class SignatureVerificationError extends VcVerifyError {
  constructor(message: string) {
    super(`Signature verification failed: ${message}`, 'SIGNATURE_VERIFICATION_FAILED');
    this.name = 'SignatureVerificationError';
  }
}

export class CredentialExpiredError extends VcVerifyError {
  constructor(expirationDate: string) {
    super(`Credential expired on ${expirationDate}`, 'CREDENTIAL_EXPIRED', { expirationDate });
    this.name = 'CredentialExpiredError';
  }
}

export class CredentialRevokedError extends VcVerifyError {
  constructor(revokedAt?: string, reason?: string) {
    super(`Credential has been revoked${revokedAt ? ` on ${revokedAt}` : ''}${reason ? `: ${reason}` : ''}`, 'CREDENTIAL_REVOKED', { revokedAt, reason });
    this.name = 'CredentialRevokedError';
  }
}

export class SchemaValidationError extends VcVerifyError {
  constructor(message: string) {
    super(`Schema validation failed: ${message}`, 'SCHEMA_VALIDATION_FAILED');
    this.name = 'SchemaValidationError';
  }
}

export class IssuerNotTrustedError extends VcVerifyError {
  constructor(issuerDid: string) {
    super(`Issuer ${issuerDid} is not trusted`, 'ISSUER_NOT_TRUSTED', { issuerDid });
    this.name = 'IssuerNotTrustedError';
  }
}

export class InvalidIssuerError extends VcVerifyError {
  constructor(issuerDid: string, reason: string) {
    super(`Invalid issuer ${issuerDid}: ${reason}`, 'INVALID_ISSUER', { issuerDid, reason });
    this.name = 'InvalidIssuerError';
  }
}

export class InvalidSubjectError extends VcVerifyError {
  constructor(subjectId: string, reason: string) {
    super(`Invalid subject ${subjectId}: ${reason}`, 'INVALID_SUBJECT', { subjectId, reason });
    this.name = 'InvalidSubjectError';
  }
}

export class OnChainAnchorError extends VcVerifyError {
  constructor(message: string) {
    super(`On-chain anchor verification failed: ${message}`, 'ON_CHAIN_ANCHOR_FAILED');
    this.name = 'OnChainAnchorError';
  }
}

export class InvalidCredentialStructureError extends VcVerifyError {
  constructor(message: string) {
    super(`Invalid credential structure: ${message}`, 'INVALID_CREDENTIAL_STRUCTURE');
    this.name = 'InvalidCredentialStructureError';
  }
}