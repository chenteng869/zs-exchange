export enum DidErrorCode {
  INVALID_DID = 2001,
  UNSUPPORTED_METHOD = 2002,
  DID_NOT_FOUND = 2003,
  DID_DEACTIVATED = 2004,
  INVALID_KEY_TYPE = 2005,
  KEY_NOT_FOUND = 2006,
  KEY_REVOKED = 2007,
  SIGNATURE_INVALID = 2008,
  VERIFICATION_FAILED = 2009,
  DID_RESOLUTION_FAILED = 2010,
  DID_CREATION_FAILED = 2011,
  DID_UPDATE_FAILED = 2012,
  DID_DELETION_FAILED = 2013,
  ANCHOR_FAILED = 2014,
  ANCHOR_NOT_FOUND = 2015,
  INVALID_DOCUMENT = 2016,
  MISSING_REQUIRED_FIELD = 2017,
  INVALID_FORMAT = 2018,
  PERMISSION_DENIED = 2019,
  INTERNAL_ERROR = 2020,
}

export class DidError extends Error {
  readonly code: number;
  readonly data?: unknown;

  constructor(code: number, message: string, data?: unknown) {
    super(message);
    this.name = 'DidError';
    this.code = code;
    this.data = data;
  }
}

export class InvalidDidError extends DidError {
  constructor(did: string, data?: unknown) {
    super(DidErrorCode.INVALID_DID, `Invalid DID: ${did}`, data);
    this.name = 'InvalidDidError';
  }
}

export class UnsupportedMethodError extends DidError {
  constructor(method: string, data?: unknown) {
    super(DidErrorCode.UNSUPPORTED_METHOD, `Unsupported DID method: ${method}`, data);
    this.name = 'UnsupportedMethodError';
  }
}

export class DidNotFoundError extends DidError {
  constructor(did: string, data?: unknown) {
    super(DidErrorCode.DID_NOT_FOUND, `DID not found: ${did}`, data);
    this.name = 'DidNotFoundError';
  }
}

export class DidDeactivatedError extends DidError {
  constructor(did: string, data?: unknown) {
    super(DidErrorCode.DID_DEACTIVATED, `DID deactivated: ${did}`, data);
    this.name = 'DidDeactivatedError';
  }
}

export class InvalidKeyTypeError extends DidError {
  constructor(keyType: string, data?: unknown) {
    super(DidErrorCode.INVALID_KEY_TYPE, `Invalid key type: ${keyType}`, data);
    this.name = 'InvalidKeyTypeError';
  }
}

export class KeyNotFoundError extends DidError {
  constructor(keyId: string, data?: unknown) {
    super(DidErrorCode.KEY_NOT_FOUND, `Key not found: ${keyId}`, data);
    this.name = 'KeyNotFoundError';
  }
}

export class KeyRevokedError extends DidError {
  constructor(keyId: string, data?: unknown) {
    super(DidErrorCode.KEY_REVOKED, `Key revoked: ${keyId}`, data);
    this.name = 'KeyRevokedError';
  }
}

export class SignatureInvalidError extends DidError {
  constructor(data?: unknown) {
    super(DidErrorCode.SIGNATURE_INVALID, 'Signature is invalid', data);
    this.name = 'SignatureInvalidError';
  }
}

export class VerificationFailedError extends DidError {
  constructor(message?: string, data?: unknown) {
    super(DidErrorCode.VERIFICATION_FAILED, message || 'Verification failed', data);
    this.name = 'VerificationFailedError';
  }
}

export class DidResolutionFailedError extends DidError {
  constructor(did: string, data?: unknown) {
    super(DidErrorCode.DID_RESOLUTION_FAILED, `DID resolution failed: ${did}`, data);
    this.name = 'DidResolutionFailedError';
  }
}

export class DidCreationFailedError extends DidError {
  constructor(message?: string, data?: unknown) {
    super(DidErrorCode.DID_CREATION_FAILED, message || 'DID creation failed', data);
    this.name = 'DidCreationFailedError';
  }
}

export class DidUpdateFailedError extends DidError {
  constructor(did: string, message?: string, data?: unknown) {
    super(DidErrorCode.DID_UPDATE_FAILED, `DID update failed: ${did}${message ? ` - ${message}` : ''}`, data);
    this.name = 'DidUpdateFailedError';
  }
}

export class DidDeletionFailedError extends DidError {
  constructor(did: string, message?: string, data?: unknown) {
    super(DidErrorCode.DID_DELETION_FAILED, `DID deletion failed: ${did}${message ? ` - ${message}` : ''}`, data);
    this.name = 'DidDeletionFailedError';
  }
}

export class AnchorFailedError extends DidError {
  constructor(did: string, chainId: string, data?: unknown) {
    super(DidErrorCode.ANCHOR_FAILED, `Anchor failed for DID ${did} on chain ${chainId}`, data);
    this.name = 'AnchorFailedError';
  }
}

export class AnchorNotFoundError extends DidError {
  constructor(did: string, data?: unknown) {
    super(DidErrorCode.ANCHOR_NOT_FOUND, `Anchor not found for DID: ${did}`, data);
    this.name = 'AnchorNotFoundError';
  }
}

export class InvalidDocumentError extends DidError {
  constructor(message?: string, data?: unknown) {
    super(DidErrorCode.INVALID_DOCUMENT, message || 'Invalid DID document', data);
    this.name = 'InvalidDocumentError';
  }
}

export class MissingRequiredFieldError extends DidError {
  constructor(field: string, data?: unknown) {
    super(DidErrorCode.MISSING_REQUIRED_FIELD, `Missing required field: ${field}`, data);
    this.name = 'MissingRequiredFieldError';
  }
}

export class InvalidFormatError extends DidError {
  constructor(message?: string, data?: unknown) {
    super(DidErrorCode.INVALID_FORMAT, message || 'Invalid format', data);
    this.name = 'InvalidFormatError';
  }
}

export class PermissionDeniedError extends DidError {
  constructor(message?: string, data?: unknown) {
    super(DidErrorCode.PERMISSION_DENIED, message || 'Permission denied', data);
    this.name = 'PermissionDeniedError';
  }
}

export class DidInternalError extends DidError {
  constructor(message?: string, data?: unknown) {
    super(DidErrorCode.INTERNAL_ERROR, message || 'Internal error', data);
    this.name = 'DidInternalError';
  }
}

export const getDidError = (code: number, message?: string, data?: unknown): DidError => {
  switch (code) {
    case DidErrorCode.INVALID_DID:
      return new InvalidDidError(message || '', data);
    case DidErrorCode.UNSUPPORTED_METHOD:
      return new UnsupportedMethodError(message || '', data);
    case DidErrorCode.DID_NOT_FOUND:
      return new DidNotFoundError(message || '', data);
    case DidErrorCode.DID_DEACTIVATED:
      return new DidDeactivatedError(message || '', data);
    case DidErrorCode.INVALID_KEY_TYPE:
      return new InvalidKeyTypeError(message || '', data);
    case DidErrorCode.KEY_NOT_FOUND:
      return new KeyNotFoundError(message || '', data);
    case DidErrorCode.KEY_REVOKED:
      return new KeyRevokedError(message || '', data);
    case DidErrorCode.SIGNATURE_INVALID:
      return new SignatureInvalidError(data);
    case DidErrorCode.VERIFICATION_FAILED:
      return new VerificationFailedError(message, data);
    case DidErrorCode.DID_RESOLUTION_FAILED:
      return new DidResolutionFailedError(message || '', data);
    case DidErrorCode.DID_CREATION_FAILED:
      return new DidCreationFailedError(message, data);
    case DidErrorCode.DID_UPDATE_FAILED:
      return new DidUpdateFailedError(message || '', undefined, data);
    case DidErrorCode.DID_DELETION_FAILED:
      return new DidDeletionFailedError(message || '', undefined, data);
    case DidErrorCode.ANCHOR_FAILED:
      return new AnchorFailedError(message || '', '', data);
    case DidErrorCode.ANCHOR_NOT_FOUND:
      return new AnchorNotFoundError(message || '', data);
    case DidErrorCode.INVALID_DOCUMENT:
      return new InvalidDocumentError(message, data);
    case DidErrorCode.MISSING_REQUIRED_FIELD:
      return new MissingRequiredFieldError(message || '', data);
    case DidErrorCode.INVALID_FORMAT:
      return new InvalidFormatError(message, data);
    case DidErrorCode.PERMISSION_DENIED:
      return new PermissionDeniedError(message, data);
    case DidErrorCode.INTERNAL_ERROR:
      return new DidInternalError(message, data);
    default:
      return new DidError(code, message || 'Unknown DID error', data);
  }
};