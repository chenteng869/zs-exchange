export class VcIssueError extends Error {
  code: string;
  details?: Record<string, unknown>;

  constructor(message: string, code: string, details?: Record<string, unknown>) {
    super(message);
    this.code = code;
    this.details = details;
    this.name = 'VcIssueError';
  }
}

export class TemplateNotFoundError extends VcIssueError {
  constructor(templateId: string) {
    super(`Template ${templateId} not found`, 'TEMPLATE_NOT_FOUND', { templateId });
    this.name = 'TemplateNotFoundError';
  }
}

export class InvalidClaimError extends VcIssueError {
  constructor(claimName: string, reason: string) {
    super(`Invalid claim ${claimName}: ${reason}`, 'INVALID_CLAIM', { claimName, reason });
    this.name = 'InvalidClaimError';
  }
}

export class MissingRequiredClaimError extends VcIssueError {
  constructor(claimName: string) {
    super(`Missing required claim: ${claimName}`, 'MISSING_REQUIRED_CLAIM', { claimName });
    this.name = 'MissingRequiredClaimError';
  }
}

export class InvalidIssuerError extends VcIssueError {
  constructor(issuerDid: string, reason: string) {
    super(`Invalid issuer ${issuerDid}: ${reason}`, 'INVALID_ISSUER', { issuerDid, reason });
    this.name = 'InvalidIssuerError';
  }
}

export class IssuerNotTrustedError extends VcIssueError {
  constructor(issuerDid: string) {
    super(`Issuer ${issuerDid} is not trusted`, 'ISSUER_NOT_TRUSTED', { issuerDid });
    this.name = 'IssuerNotTrustedError';
  }
}

export class IssuerPermissionDeniedError extends VcIssueError {
  constructor(issuerDid: string, templateId: string) {
    super(`Issuer ${issuerDid} does not have permission to issue ${templateId}`, 'ISSUER_PERMISSION_DENIED', { issuerDid, templateId });
    this.name = 'IssuerPermissionDeniedError';
  }
}

export class InvalidSubjectError extends VcIssueError {
  constructor(subjectDid: string, reason: string) {
    super(`Invalid subject ${subjectDid}: ${reason}`, 'INVALID_SUBJECT', { subjectDid, reason });
    this.name = 'InvalidSubjectError';
  }
}

export class SchemaValidationError extends VcIssueError {
  constructor(message: string) {
    super(`Schema validation failed: ${message}`, 'SCHEMA_VALIDATION_ERROR');
    this.name = 'SchemaValidationError';
  }
}

export class SigningError extends VcIssueError {
  constructor(message: string) {
    super(`Signing failed: ${message}`, 'SIGNING_ERROR');
    this.name = 'SigningError';
  }
}

export class StorageError extends VcIssueError {
  constructor(message: string) {
    super(`Storage failed: ${message}`, 'STORAGE_ERROR');
    this.name = 'StorageError';
  }
}

export class CredentialAlreadyExistsError extends VcIssueError {
  constructor(credentialId: string) {
    super(`Credential ${credentialId} already exists`, 'CREDENTIAL_ALREADY_EXISTS', { credentialId });
    this.name = 'CredentialAlreadyExistsError';
  }
}

export class CredentialNotFoundError extends VcIssueError {
  constructor(credentialId: string) {
    super(`Credential ${credentialId} not found`, 'CREDENTIAL_NOT_FOUND', { credentialId });
    this.name = 'CredentialNotFoundError';
  }
}

export class UnsupportedFormatError extends VcIssueError {
  constructor(format: string) {
    super(`Unsupported VC format: ${format}`, 'UNSUPPORTED_FORMAT', { format });
    this.name = 'UnsupportedFormatError';
  }
}

export class TemplateAlreadyExistsError extends VcIssueError {
  constructor(templateId: string) {
    super(`Template ${templateId} already exists`, 'TEMPLATE_ALREADY_EXISTS', { templateId });
    this.name = 'TemplateAlreadyExistsError';
  }
}