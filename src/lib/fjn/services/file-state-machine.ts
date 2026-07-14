/**
 * File Service - 状态机 + 枚举 + 校验
 *
 * 文档：docs/369福建老酒源代码-开发/H038-22 个 Service：File Service 文件服务.md
 *
 * File 状态：pending_upload -> uploaded -> archived
 *                                       -> deleted
 * Permission 状态：active -> revoked
 * SignedUrl 状态：active -> used | expired
 */

export const FILE_STATUS = {
  PENDING_UPLOAD: 'pending_upload',
  UPLOADED: 'uploaded',
  ARCHIVED: 'archived',
  DELETED: 'deleted',
} as const;
export type FjnFileStatus = (typeof FILE_STATUS)[keyof typeof FILE_STATUS];

export const FILE_STATUS_TRANSITIONS: Record<FjnFileStatus, readonly FjnFileStatus[]> = {
  [FILE_STATUS.PENDING_UPLOAD]: [FILE_STATUS.UPLOADED, FILE_STATUS.DELETED],
  [FILE_STATUS.UPLOADED]: [FILE_STATUS.ARCHIVED, FILE_STATUS.DELETED],
  [FILE_STATUS.ARCHIVED]: [FILE_STATUS.DELETED],
  [FILE_STATUS.DELETED]: [],
} as const;

export const FILE_SENSITIVITY = {
  PUBLIC: 'public',
  INTERNAL: 'internal',
  CONFIDENTIAL: 'confidential',
  RESTRICTED: 'restricted', // 如 KYC 证件，走独立隔离桶
} as const;
export type FjnFileSensitivity = (typeof FILE_SENSITIVITY)[keyof typeof FILE_SENSITIVITY];

export const FILE_TYPE = {
  IMAGE: 'image',
  DOCUMENT: 'document',
  VIDEO: 'video',
  AUDIO: 'audio',
  KYC_DOCUMENT: 'kyc_document',
  OTHER: 'other',
} as const;
export type FjnFileType = (typeof FILE_TYPE)[keyof typeof FILE_TYPE];

export const FILE_PERMISSION_TYPE = {
  READ: 'read',
  WRITE: 'write',
  ADMIN: 'admin',
} as const;
export type FjnFilePermissionType = (typeof FILE_PERMISSION_TYPE)[keyof typeof FILE_PERMISSION_TYPE];

export const FILE_PERMISSION_STATUS = {
  ACTIVE: 'active',
  REVOKED: 'revoked',
} as const;
export type FjnFilePermissionStatus = (typeof FILE_PERMISSION_STATUS)[keyof typeof FILE_PERMISSION_STATUS];

export const FILE_PRINCIPAL_TYPE = {
  USER: 'user',
  ROLE: 'role',
  ADMIN: 'admin',
} as const;
export type FjnFilePrincipalType = (typeof FILE_PRINCIPAL_TYPE)[keyof typeof FILE_PRINCIPAL_TYPE];

export const FILE_ACCESS_ACTION = {
  VIEW: 'view',
  DOWNLOAD: 'download',
  UPLOAD: 'upload',
  DELETE: 'delete',
} as const;
export type FjnFileAccessAction = (typeof FILE_ACCESS_ACTION)[keyof typeof FILE_ACCESS_ACTION];

export const FILE_ACCESS_RESULT = {
  SUCCESS: 'success',
  DENIED: 'denied',
  FAILED: 'failed',
} as const;
export type FjnFileAccessResult = (typeof FILE_ACCESS_RESULT)[keyof typeof FILE_ACCESS_RESULT];

export const SIGNED_URL_ACTION = {
  READ: 'read',
  WRITE: 'write',
} as const;
export type FjnSignedUrlAction = (typeof SIGNED_URL_ACTION)[keyof typeof SIGNED_URL_ACTION];

export const SIGNED_URL_STATUS = {
  ACTIVE: 'active',
  USED: 'used',
  EXPIRED: 'expired',
} as const;
export type FjnSignedUrlStatus = (typeof SIGNED_URL_STATUS)[keyof typeof SIGNED_URL_STATUS];

export function isValidFileStatus(v: string): v is FjnFileStatus {
  return Object.values(FILE_STATUS).includes(v as FjnFileStatus);
}
export function isValidFileSensitivity(v: string): v is FjnFileSensitivity {
  return Object.values(FILE_SENSITIVITY).includes(v as FjnFileSensitivity);
}
export function canTransitFileStatus(from: FjnFileStatus, to: FjnFileStatus): boolean {
  return FILE_STATUS_TRANSITIONS[from]?.includes(to) ?? false;
}
export function assertTransitFileStatus(from: FjnFileStatus, to: FjnFileStatus): void {
  if (!canTransitFileStatus(from, to)) {
    throw new Error(`File status transition not allowed: ${from} -> ${to}`);
  }
}
