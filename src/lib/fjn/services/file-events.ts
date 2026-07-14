/**
 * File Service - 事件常量 + Payload
 *
 * 文档：docs/369福建老酒源代码-开发/H038-22 个 Service：File Service 文件服务.md
 *
 * 7 个 outbox 事件（File 5 + Permission 2 + Access 1）
 *
 * 设计：所有事件 payload 都通过 FjnFileEventPayload 联合类型校验，
 * 写 outbox 时由 file-service 在事务内创建（见 src/lib/fjn/services/base.ts withTransaction）。
 */

export const FILE_EVENT = {
  UPLOAD_TOKEN_ISSUED: 'file.upload_token.issued',
  UPLOAD_COMPLETED: 'file.upload.completed',
  SIGNED_URL_ISSUED: 'file.signed_url.issued',
  FILE_ARCHIVED: 'file.archived',
  FILE_DELETED: 'file.deleted',
  PERMISSION_GRANTED: 'file.permission.granted',
  PERMISSION_REVOKED: 'file.permission.revoked',
  ACCESS_RECORDED: 'file.access.recorded',
} as const;

export type FjnFileEventType = (typeof FILE_EVENT)[keyof typeof FILE_EVENT];

/** 全部 8 个事件枚举数组（用于校验） */
export const FILE_EVENT_TYPES: readonly FjnFileEventType[] = [
  FILE_EVENT.UPLOAD_TOKEN_ISSUED,
  FILE_EVENT.UPLOAD_COMPLETED,
  FILE_EVENT.SIGNED_URL_ISSUED,
  FILE_EVENT.FILE_ARCHIVED,
  FILE_EVENT.FILE_DELETED,
  FILE_EVENT.PERMISSION_GRANTED,
  FILE_EVENT.PERMISSION_REVOKED,
  FILE_EVENT.ACCESS_RECORDED,
] as readonly FjnFileEventType[];

export function isValidFileEventType(t: string): t is FjnFileEventType {
  return FILE_EVENT_TYPES.includes(t as FjnFileEventType);
}

// ============================================================
// Event Payloads
// ============================================================

/** 公共基础字段：所有文件事件都有 fileId */
export interface FjnFileEventBase {
  fileId: string;
  fileNo: string;
  bucket: string;
  objectKey: string;
  occurredAt: string; // ISO
}

export interface FjnFileUploadTokenIssuedPayload extends FjnFileEventBase {
  userId: string;
  uploadTokenId: string;
  uploadToken: string;
  expiresAt: string;
  fileSize: number;
  mimeType: string;
  sensitivity: 'public' | 'internal' | 'confidential' | 'restricted';
}

export interface FjnFileUploadCompletedPayload extends FjnFileEventBase {
  userId: string;
  uploadTokenId: string;
  fileSize: number;
  checksumSha256: string;
  completedAt: string;
}

export interface FjnFileSignedUrlIssuedPayload extends FjnFileEventBase {
  userId: string;
  signedUrlId: string;
  url: string;
  action: 'read' | 'write';
  expiresAt: string;
}

export interface FjnFileArchivedPayload extends FjnFileEventBase {
  userId: string;
  archiveReason: string;
  archivedAt: string;
}

export interface FjnFileDeletedPayload extends FjnFileEventBase {
  userId: string;
  deleteReason: string;
  deletedAt: string;
}

export interface FjnFilePermissionGrantedPayload extends FjnFileEventBase {
  filePermissionId: string;
  grantedBy: string;
  grantedTo: string; // userId | roleId
  permissionType: 'read' | 'write' | 'owner';
  grantedAt: string;
}

export interface FjnFilePermissionRevokedPayload extends FjnFileEventBase {
  filePermissionId: string;
  revokedBy: string;
  revokedFrom: string;
  revokeReason: string;
  revokedAt: string;
}

export interface FjnFileAccessRecordedPayload extends FjnFileEventBase {
  accessLogId: string;
  userId: string;
  action: 'read' | 'write' | 'delete' | 'download';
  result: 'allowed' | 'denied';
  ip: string;
  userAgent: string;
  accessedAt: string;
}

export type FjnFileEventPayload =
  | FjnFileUploadTokenIssuedPayload
  | FjnFileUploadCompletedPayload
  | FjnFileSignedUrlIssuedPayload
  | FjnFileArchivedPayload
  | FjnFileDeletedPayload
  | FjnFilePermissionGrantedPayload
  | FjnFilePermissionRevokedPayload
  | FjnFileAccessRecordedPayload;
