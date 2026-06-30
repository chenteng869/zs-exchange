export enum VcErrorCode {
  INVALID_CREDENTIAL = 3001,
  CREDENTIAL_NOT_FOUND = 3002,
  CREDENTIAL_EXPIRED = 3003,
  CREDENTIAL_REVOKED = 3004,
  ISSUER_NOT_TRUSTED = 3005,
  ISSUER_NOT_FOUND = 3006,
  SCHEMA_NOT_FOUND = 3007,
  SCHEMA_VALIDATION_FAILED = 3008,
  SIGNATURE_INVALID = 3009,
  VERIFICATION_FAILED = 3010,
  ISSUANCE_FAILED = 3011,
  REVOCATION_FAILED = 3012,
  CREDENTIAL_STATUS_INVALID = 3013,
  INVALID_FORMAT = 3014,
  MISSING_REQUIRED_FIELD = 3015,
  PERMISSION_DENIED = 3016,
  INTERNAL_ERROR = 3017,
  INVALID_ISSUER_DID = 3018,
  INVALID_SUBJECT_DID = 3019,
  CREDENTIAL_TYPE_NOT_SUPPORTED = 3020,
}

export class VcError extends Error {
  readonly code: number;
  readonly data?: unknown;

  constructor(code: number, message: string, data?: unknown) {
    super(message);
    this.name = 'VcError';
    this.code = code;
    this.data = data;
  }
}

export class InvalidCredentialError extends VcError {
  constructor(message?: string, data?: unknown) {
    super(VcErrorCode.INVALID_CREDENTIAL, message || 'Invalid verifiable credential', data);
    this.name = 'InvalidCredentialError';
  }
}

export class CredentialNotFoundError extends VcError {
  constructor(credentialId: string, data?: unknown) {
    super(VcErrorCode.CREDENTIAL_NOT_FOUND, `Credential not found: ${credentialId}`, data);
    this.name = 'CredentialNotFoundError';
  }
}

export class CredentialExpiredError extends VcError {
  constructor(credentialId: string, expirationDate: string, data?: unknown) {
    super(VcErrorCode.CREDENTIAL_EXPIRED, `Credential expired: ${credentialId} (expired at: ${expirationDate})`, data);
    this.name = 'CredentialExpiredError';
  }
}

export class CredentialRevokedError extends VcError {
  constructor(credentialId: string, revokedAt?: string, data?: unknown) {
    super(VcErrorCode.CREDENTIAL_REVOKED, `Credential revoked: ${credentialId}${revokedAt ? ` (revoked at: ${revokedAt})` : ''}`, data);
    this.name = 'CredentialRevokedError';
  }
}

export class IssuerNotTrustedError extends VcError {
  constructor(issuerDid: string, data?: unknown) {
    super(VcErrorCode.ISSUER_NOT_TRUSTED, `Issuer not trusted: ${issuerDid}`, data);
    this.name = 'IssuerNotTrustedError';
  }
}

export class IssuerNotFoundError extends VcError {
  constructor(issuerDid: string, data?: unknown) {
    super(VcErrorCode.ISSUER_NOT_FOUND, `Issuer not found: ${issuerDid}`, data);
    this.name = 'IssuerNotFoundError';
  }
}

export class SchemaNotFoundError extends VcError {
  constructor(schemaId: string, data?: unknown) {
    super(VcErrorCode.SCHEMA_NOT_FOUND, `Schema not found: ${schemaId}`, data);
    this.name = 'SchemaNotFoundError';
  }
}

export class SchemaValidationFailedError extends VcError {
  constructor(schemaId: string, errors: string[], data?: unknown) {
    super(VcErrorCode.SCHEMA_VALIDATION_FAILED, `Schema validation failed for ${schemaId}: ${errors.join(', ')}`, data);
    this.name = 'SchemaValidationFailedError';
  }
}

export class VcSignatureInvalidError extends VcError {
  constructor(data?: unknown) {
    super(VcErrorCode.SIGNATURE_INVALID, 'Credential signature is invalid', data);
    this.name = 'VcSignatureInvalidError';
  }
}

export class VcVerificationFailedError extends VcError {
  constructor(message?: string, data?: unknown) {
    super(VcErrorCode.VERIFICATION_FAILED, message || 'Credential verification failed', data);
    this.name = 'VcVerificationFailedError';
  }
}

export class IssuanceFailedError extends VcError {
  constructor(message?: string, data?: unknown) {
    super(VcErrorCode.ISSUANCE_FAILED, message || 'Credential issuance failed', data);
    this.name = 'IssuanceFailedError';
  }
}

export class RevocationFailedError extends VcError {
  constructor(credentialId: string, message?: string, data?: unknown) {
    super(VcErrorCode.REVOCATION_FAILED, `Credential revocation failed: ${credentialId}${message ? ` - ${message}` : ''}`, data);
    this.name = 'RevocationFailedError';
  }
}

export class CredentialStatusInvalidError extends VcError {
  constructor(statusId: string, data?: unknown) {
    super(VcErrorCode.CREDENTIAL_STATUS_INVALID, `Invalid credential status: ${statusId}`, data);
    this.name = 'CredentialStatusInvalidError';
  }
}

export class VcInvalidFormatError extends VcError {
  constructor(message?: string, data?: unknown) {
    super(VcErrorCode.INVALID_FORMAT, message || 'Invalid credential format', data);
    this.name = 'VcInvalidFormatError';
  }
}

export class VcMissingRequiredFieldError extends VcError {
  constructor(field: string, data?: unknown) {
    super(VcErrorCode.MISSING_REQUIRED_FIELD, `Missing required field: ${field}`, data);
    this.name = 'VcMissingRequiredFieldError';
  }
}

export class VcPermissionDeniedError extends VcError {
  constructor(message?: string, data?: unknown) {
    super(VcErrorCode.PERMISSION_DENIED, message || 'Permission denied', data);
    this.name = 'VcPermissionDeniedError';
  }
}

export class VcInternalError extends VcError {
  constructor(message?: string, data?: unknown) {
    super(VcErrorCode.INTERNAL_ERROR, message || 'Internal error', data);
    this.name = 'VcInternalError';
  }
}

export class InvalidIssuerDidError extends VcError {
  constructor(did: string, data?: unknown) {
    super(VcErrorCode.INVALID_ISSUER_DID, `Invalid issuer DID: ${did}`, data);
    this.name = 'InvalidIssuerDidError';
  }
}

export class InvalidSubjectDidError extends VcError {
  constructor(did: string, data?: unknown) {
    super(VcErrorCode.INVALID_SUBJECT_DID, `Invalid subject DID: ${did}`, data);
    this.name = 'InvalidSubjectDidError';
  }
}

export class CredentialTypeNotSupportedError extends VcError {
  constructor(type: string, data?: unknown) {
    super(VcErrorCode.CREDENTIAL_TYPE_NOT_SUPPORTED, `Credential type not supported: ${type}`, data);
    this.name = 'CredentialTypeNotSupportedError';
  }
}

export const getVcError = (code: number, message?: string, data?: unknown): VcError => {
  switch (code) {
    case VcErrorCode.INVALID_CREDENTIAL:
      return new InvalidCredentialError(message, data);
    case VcErrorCode.CREDENTIAL_NOT_FOUND:
      return new CredentialNotFoundError(message || '', data);
    case VcErrorCode.CREDENTIAL_EXPIRED:
      return new CredentialExpiredError(message || '', '', data);
    case VcErrorCode.CREDENTIAL_REVOKED:
      return new CredentialRevokedError(message || '', undefined, data);
    case VcErrorCode.ISSUER_NOT_TRUSTED:
      return new IssuerNotTrustedError(message || '', data);
    case VcErrorCode.ISSUER_NOT_FOUND:
      return new IssuerNotFoundError(message || '', data);
    case VcErrorCode.SCHEMA_NOT_FOUND:
      return new SchemaNotFoundError(message || '', data);
    case VcErrorCode.SCHEMA_VALIDATION_FAILED:
      return new SchemaValidationFailedError(message || '', [], data);
    case VcErrorCode.SIGNATURE_INVALID:
      return new VcSignatureInvalidError(data);
    case VcErrorCode.VERIFICATION_FAILED:
      return new VcVerificationFailedError(message, data);
    case VcErrorCode.ISSUANCE_FAILED:
      return new IssuanceFailedError(message, data);
    case VcErrorCode.REVOCATION_FAILED:
      return new RevocationFailedError(message || '', undefined, data);
    case VcErrorCode.CREDENTIAL_STATUS_INVALID:
      return new CredentialStatusInvalidError(message || '', data);
    case VcErrorCode.INVALID_FORMAT:
      return new VcInvalidFormatError(message, data);
    case VcErrorCode.MISSING_REQUIRED_FIELD:
      return new VcMissingRequiredFieldError(message || '', data);
    case VcErrorCode.PERMISSION_DENIED:
      return new VcPermissionDeniedError(message, data);
    case VcErrorCode.INTERNAL_ERROR:
      return new VcInternalError(message, data);
    case VcErrorCode.INVALID_ISSUER_DID:
      return new InvalidIssuerDidError(message || '', data);
    case VcErrorCode.INVALID_SUBJECT_DID:
      return new InvalidSubjectDidError(message || '', data);
    case VcErrorCode.CREDENTIAL_TYPE_NOT_SUPPORTED:
      return new CredentialTypeNotSupportedError(message || '', data);
    default:
      return new VcError(code, message || 'Unknown VC error', data);
  }
};