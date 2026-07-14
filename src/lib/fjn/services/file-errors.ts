/**
 * File Service - 异常体系
 *
 * 文档：docs/369福建老酒源代码-开发/H038-22 个 Service：File Service 文件服务.md
 *
 * 异常层级：
 *  FjnFileError（基类）
 *  ├── FjnFileValidationError
 *  ├── FjnFileNotFoundError
 *  ├── FjnFileConflictError
 *  ├── FjnFileStateTransitionError
 *  ├── FjnFilePermissionDeniedError
 *  ├── FjnFileUploadError
 *  ├── FjnFileSignatureError
 *  └── FjnFileStorageError
 */

import { FjnError, FjnErrorContext } from '../errors';

// ============================================================
// Error Codes
// ============================================================

export const FILE_ERROR_CODES = {
  VALIDATION: 'FILE_VALIDATION',
  NOT_FOUND: 'FILE_NOT_FOUND',
  CONFLICT: 'FILE_CONFLICT',
  STATE_TRANSITION: 'FILE_STATE_TRANSITION',
  PERMISSION_DENIED: 'FILE_PERMISSION_DENIED',
  UPLOAD_FAILED: 'FILE_UPLOAD_FAILED',
  SIGNATURE_FAILED: 'FILE_SIGNATURE_FAILED',
  STORAGE_FAILED: 'FILE_STORAGE_FAILED',
  TOKEN_EXPIRED: 'FILE_TOKEN_EXPIRED',
  TOKEN_USED: 'FILE_TOKEN_USED',
  CHECKSUM_MISMATCH: 'FILE_CHECKSUM_MISMATCH',
  SIZE_MISMATCH: 'FILE_SIZE_MISMATCH',
  ARCHIVED: 'FILE_ARCHIVED',
  DELETED: 'FILE_DELETED',
} as const;

export type FjnFileErrorCode =
  (typeof FILE_ERROR_CODES)[keyof typeof FILE_ERROR_CODES];

// ============================================================
// Error Classes
// ============================================================

export class FjnFileError extends FjnError {
  public readonly fileErrorCode: FjnFileErrorCode;

  constructor(code: FjnFileErrorCode, message: string, context?: FjnErrorContext) {
    super({ code: 'FJN_INTERNAL' as any, message, context });
    (this as { name: string }).name = 'FjnFileError';
    this.fileErrorCode = code;
  }
}

export class FjnFileValidationError extends FjnFileError {
  constructor(message: string, context?: FjnErrorContext) {
    super(FILE_ERROR_CODES.VALIDATION, message, context);
    (this as { name: string }).name = 'FjnFileValidationError';
  }
}

export class FjnFileNotFoundError extends FjnFileError {
  constructor(fileId: string, kind: 'file' | 'permission' | 'access_log' | 'signed_url' | 'upload_token' = 'file') {
    super(FILE_ERROR_CODES.NOT_FOUND, `${kind} not found: ${fileId}`, { fileId, kind });
    (this as { name: string }).name = 'FjnFileNotFoundError';
  }
}

export class FjnFileConflictError extends FjnFileError {
  constructor(message: string, fileId?: string) {
    super(FILE_ERROR_CODES.CONFLICT, message, fileId ? { fileId } : undefined);
    (this as { name: string }).name = 'FjnFileConflictError';
  }
}

export class FjnFileStateTransitionError extends FjnFileError {
  constructor(from: string, to: string, fileId?: string) {
    super(FILE_ERROR_CODES.STATE_TRANSITION, `Illegal state transition: ${from} -> ${to}`, { fileId, from, to });
    (this as { name: string }).name = 'FjnFileStateTransitionError';
  }
}

export class FjnFilePermissionDeniedError extends FjnFileError {
  constructor(message: string, fileId?: string) {
    super(FILE_ERROR_CODES.PERMISSION_DENIED, message, fileId ? { fileId } : undefined);
    (this as { name: string }).name = 'FjnFilePermissionDeniedError';
  }
}

export class FjnFileUploadError extends FjnFileError {
  constructor(
    subCode: 'UPLOAD_FAILED' | 'CHECKSUM_MISMATCH' | 'SIZE_MISMATCH' | 'TOKEN_EXPIRED' | 'TOKEN_USED',
    message: string,
    context?: FjnErrorContext,
  ) {
    super(FILE_ERROR_CODES[subCode], message, context);
    (this as { name: string }).name = 'FjnFileUploadError';
  }
}

export class FjnFileSignatureError extends FjnFileError {
  constructor(message: string, fileId?: string) {
    super(FILE_ERROR_CODES.SIGNATURE_FAILED, message, fileId ? { fileId } : undefined);
    (this as { name: string }).name = 'FjnFileSignatureError';
  }
}

export class FjnFileStorageError extends FjnFileError {
  constructor(message: string, bucket: string, objectKey: string) {
    super(FILE_ERROR_CODES.STORAGE_FAILED, message, { bucket, objectKey });
    (this as { name: string }).name = 'FjnFileStorageError';
  }
}
