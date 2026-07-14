/**
 * File Service - 工业级文件服务
 *
 * 文档：docs/369福建老酒源代码-开发/H038-22 个 Service：File Service 文件服务.md
 *
 * 职责：
 *  - createUploadToken：签发上传令牌（按敏感度选桶 + 生成 objectKey）
 *  - completeUpload：确认上传完成（记录 checksum/size，状态 -> uploaded）
 *  - createSignedUrl：生成短期签名 URL（read/write）
 *  - list / getById：分页查询 / 详情
 *  - grantPermission / revokePermission：文件权限管理
 *  - recordAccess / listAccessLogs：访问审计
 *  - archive：归档
 *
 * 存储后端：当前为存储无关的占位实现（mockSignedStorageUrl），
 * 真实 S3/OSS/MinIO 对接、病毒扫描、WORM 存储属于后续基础设施建设范畴（H038 §14）。
 */

import { Prisma } from '@prisma/client';
import { FjnServiceBase, FjnServiceOptions } from './base';
import { FjnValidationError, FjnNotFoundError, FjnConflictError } from '../errors';
import {
  FILE_STATUS,
  FILE_SENSITIVITY,
  FILE_PERMISSION_STATUS,
  SIGNED_URL_STATUS,
  isValidFileSensitivity,
  canTransitFileStatus,
  type FjnFileStatus,
  type FjnFileSensitivity,
  type FjnFileType,
  type FjnFilePermissionType,
  type FjnFilePrincipalType,
  type FjnFileAccessAction,
  type FjnFileAccessResult,
  type FjnSignedUrlAction,
} from './file-state-machine';

// ============================================================
// 1. 入参接口
// ============================================================

export interface CreateUploadTokenInput {
  originalName: string;
  fileType: FjnFileType;
  mimeType: string;
  fileSize: number;
  sensitivity?: FjnFileSensitivity;
  ownerUserId?: string;
  businessType?: string;
  businessId?: string;
  metadata?: Prisma.InputJsonValue;
}

export interface CompleteUploadInput {
  fileId: string;
  checksum?: string;
  fileSize?: number;
}

export interface CreateSignedUrlInput {
  fileId: string;
  action: FjnSignedUrlAction;
  expiresInSeconds?: number;
  createdBy?: string;
}

export interface GrantPermissionInput {
  fileId: string;
  principalType: FjnFilePrincipalType;
  principalId: string;
  permission: FjnFilePermissionType;
  grantedBy?: string;
}

export interface RecordAccessInput {
  fileId: string;
  accessorType: 'user' | 'admin' | 'system';
  accessorId?: string;
  accessAction: FjnFileAccessAction;
  ipAddress?: string;
  deviceId?: string;
  result?: FjnFileAccessResult;
  reason?: string;
}

export interface ListFilesInput {
  page?: number;
  pageSize?: number;
  businessType?: string;
  businessId?: string;
  ownerUserId?: string;
  fileType?: FjnFileType;
  sensitivity?: FjnFileSensitivity;
  status?: FjnFileStatus;
}

const DEFAULT_EXPIRES_SECONDS = 900; // 15 分钟

// 按敏感度路由到不同桶（KYC 证件强制隔离到独立桶）
function resolveBucket(sensitivity: FjnFileSensitivity, fileType: FjnFileType): string {
  if (fileType === 'kyc_document' || sensitivity === FILE_SENSITIVITY.RESTRICTED) {
    return 'fjn-restricted-kyc';
  }
  if (sensitivity === FILE_SENSITIVITY.CONFIDENTIAL) {
    return 'fjn-confidential';
  }
  if (sensitivity === FILE_SENSITIVITY.PUBLIC) {
    return 'fjn-public';
  }
  return 'fjn-internal';
}

// 占位实现：真实环境应替换为 S3/OSS/MinIO 的预签名 URL 生成
function mockSignedStorageUrl(bucket: string, objectKey: string, action: FjnSignedUrlAction, expiresAt: Date): string {
  const ts = expiresAt.getTime();
  return `https://storage.local/${bucket}/${objectKey}?action=${action}&expires=${ts}&sig=mock`;
}

export class FjnFileService extends FjnServiceBase {
  constructor(options: FjnServiceOptions = {}) {
    super({ ...options, serviceName: options.serviceName ?? 'FjnFileService' });
  }

  // fileSize 是 Prisma BigInt，原生不可 JSON 序列化，统一转 string 后再返回给 API 层
  private toFileView(file: any): any {
    return { ...file, fileSize: file.fileSize?.toString?.() ?? file.fileSize };
  }

  private genNo(prefix: string): string {
    const ts = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const rand = Math.random().toString(36).slice(2, 10).toUpperCase();
    return `${prefix}${ts}${rand}`;
  }

  // ==========================================================
  // 1. 上传令牌
  // ==========================================================

  async createUploadToken(input: CreateUploadTokenInput) {
    if (!input.originalName) throw new FjnValidationError('originalName 必填');
    if (!input.mimeType) throw new FjnValidationError('mimeType 必填');
    if (!input.fileSize || input.fileSize <= 0) throw new FjnValidationError('fileSize 必须为正数');

    const sensitivity = input.sensitivity ?? FILE_SENSITIVITY.INTERNAL;
    if (!isValidFileSensitivity(sensitivity)) {
      throw new FjnValidationError('sensitivity 非法', { sensitivity });
    }
    const bucket = resolveBucket(sensitivity, input.fileType);
    const fileNo = this.genNo('FILE');
    const ext = input.originalName.includes('.') ? input.originalName.split('.').pop() : undefined;
    const objectKey = `${input.fileType}/${fileNo}${ext ? `.${ext}` : ''}`;

    const created = await (this.prisma as any).fileObject.create({
      data: {
        fileNo,
        bucket,
        objectKey,
        originalName: input.originalName,
        fileType: input.fileType,
        mimeType: input.mimeType,
        fileSize: input.fileSize,
        ownerUserId: input.ownerUserId ?? null,
        businessType: input.businessType ?? null,
        businessId: input.businessId ?? null,
        sensitivity,
        status: FILE_STATUS.PENDING_UPLOAD,
        metadata: input.metadata ?? undefined,
      },
    });

    const uploadUrl = mockSignedStorageUrl(bucket, objectKey, 'write', new Date(Date.now() + DEFAULT_EXPIRES_SECONDS * 1000));
    this.log('info', `upload token created: ${fileNo}`, { bucket, objectKey });
    return { file: this.toFileView(created), uploadUrl, expiresInSeconds: DEFAULT_EXPIRES_SECONDS };
  }

  async completeUpload(input: CompleteUploadInput) {
    return this.withTransaction(async (tx) => {
      const file = await (tx as any).fileObject.findUnique({ where: { id: input.fileId } });
      if (!file) throw new FjnNotFoundError('文件不存在', { fileId: input.fileId });
      const from = file.status as FjnFileStatus;
      if (!canTransitFileStatus(from, FILE_STATUS.UPLOADED)) {
        throw new FjnConflictError(`当前状态[${from}]不可标记为已上传`, { fileId: input.fileId, from });
      }
      const updated = await (tx as any).fileObject.update({
        where: { id: input.fileId },
        data: {
          status: FILE_STATUS.UPLOADED,
          checksum: input.checksum ?? null,
          fileSize: input.fileSize ?? file.fileSize,
          uploadedAt: new Date(),
        },
      });
      await this.emitEvent(tx, 'file.uploaded', { fileId: file.id, fileNo: file.fileNo, bucket: file.bucket });
      this.log('info', `upload completed: ${file.fileNo}`);
      return this.toFileView(updated);
    });
  }

  // ==========================================================
  // 2. 签名 URL
  // ==========================================================

  async createSignedUrl(input: CreateSignedUrlInput) {
    const file = await (this.prisma as any).fileObject.findUnique({ where: { id: input.fileId } });
    if (!file) throw new FjnNotFoundError('文件不存在', { fileId: input.fileId });
    if (file.status === FILE_STATUS.DELETED) {
      throw new FjnConflictError('文件已删除，无法生成签名链接', { fileId: input.fileId });
    }
    const expiresInSeconds = input.expiresInSeconds ?? DEFAULT_EXPIRES_SECONDS;
    const expiresAt = new Date(Date.now() + expiresInSeconds * 1000);
    const url = mockSignedStorageUrl(file.bucket, file.objectKey, input.action, expiresAt);
    const signedUrlNo = this.genNo('SURL');

    const created = await (this.prisma as any).fileSignedUrl.create({
      data: {
        signedUrlNo,
        fileId: input.fileId,
        action: input.action,
        expiresAt,
        createdBy: input.createdBy ?? null,
        status: SIGNED_URL_STATUS.ACTIVE,
      },
    });

    await this.recordAccess({
      fileId: input.fileId,
      accessorType: input.createdBy ? 'admin' : 'system',
      accessorId: input.createdBy,
      accessAction: input.action === 'write' ? 'upload' : 'view',
      result: 'success',
    });

    return { ...created, url };
  }

  // ==========================================================
  // 3. 查询
  // ==========================================================

  async getById(fileId: string) {
    const file = await (this.prisma as any).fileObject.findUnique({ where: { id: fileId } });
    if (!file) throw new FjnNotFoundError('文件不存在', { fileId });
    return this.toFileView(file);
  }

  async list(input: ListFilesInput = {}) {
    const page = input.page ?? 1;
    const pageSize = Math.min(input.pageSize ?? 20, 100);
    const where: any = {};
    if (input.businessType) where.businessType = input.businessType;
    if (input.businessId) where.businessId = input.businessId;
    if (input.ownerUserId) where.ownerUserId = input.ownerUserId;
    if (input.fileType) where.fileType = input.fileType;
    if (input.sensitivity) where.sensitivity = input.sensitivity;
    if (input.status) where.status = input.status;

    const [items, total] = await Promise.all([
      (this.prisma as any).fileObject.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      (this.prisma as any).fileObject.count({ where }),
    ]);
    return { items: items.map((f: any) => this.toFileView(f)), total, page, pageSize };
  }

  // ==========================================================
  // 4. 权限
  // ==========================================================

  async grantPermission(input: GrantPermissionInput) {
    const file = await (this.prisma as any).fileObject.findUnique({ where: { id: input.fileId } });
    if (!file) throw new FjnNotFoundError('文件不存在', { fileId: input.fileId });
    const created = await (this.prisma as any).filePermission.create({
      data: {
        fileId: input.fileId,
        principalType: input.principalType,
        principalId: input.principalId,
        permission: input.permission,
        grantedBy: input.grantedBy ?? null,
        status: FILE_PERMISSION_STATUS.ACTIVE,
      },
    });
    this.log('info', `permission granted on file ${file.fileNo}`, { principalId: input.principalId, permission: input.permission });
    return created;
  }

  async revokePermission(permissionId: string, revokedBy?: string) {
    return this.withTransaction(async (tx) => {
      const perm = await (tx as any).filePermission.findUnique({ where: { id: permissionId } });
      if (!perm) throw new FjnNotFoundError('权限记录不存在', { permissionId });
      if (perm.status === FILE_PERMISSION_STATUS.REVOKED) return perm;
      const updated = await (tx as any).filePermission.update({
        where: { id: permissionId },
        data: { status: FILE_PERMISSION_STATUS.REVOKED, revokedAt: new Date() },
      });
      this.log('info', `permission revoked: ${permissionId}`, { revokedBy });
      return updated;
    });
  }

  async listPermissions(fileId: string) {
    return (this.prisma as any).filePermission.findMany({
      where: { fileId },
      orderBy: { grantedAt: 'desc' },
    });
  }

  // ==========================================================
  // 5. 访问审计
  // ==========================================================

  async recordAccess(input: RecordAccessInput) {
    const accessNo = this.genNo('ACC');
    return (this.prisma as any).fileAccessLog.create({
      data: {
        accessNo,
        fileId: input.fileId,
        accessorType: input.accessorType,
        accessorId: input.accessorId ?? null,
        accessAction: input.accessAction,
        ipAddress: input.ipAddress ?? null,
        deviceId: input.deviceId ?? null,
        result: input.result ?? 'success',
        reason: input.reason ?? null,
      },
    });
  }

  async listAccessLogs(fileId: string, limit = 50) {
    return (this.prisma as any).fileAccessLog.findMany({
      where: { fileId },
      orderBy: { createdAt: 'desc' },
      take: Math.min(Math.max(limit, 1), 200),
    });
  }

  // ==========================================================
  // 6. 归档
  // ==========================================================

  async archive(fileId: string, operatorId?: string) {
    return this.withTransaction(async (tx) => {
      const file = await (tx as any).fileObject.findUnique({ where: { id: fileId } });
      if (!file) throw new FjnNotFoundError('文件不存在', { fileId });
      const from = file.status as FjnFileStatus;
      if (!canTransitFileStatus(from, FILE_STATUS.ARCHIVED)) {
        throw new FjnConflictError(`当前状态[${from}]不可归档`, { fileId, from });
      }
      const updated = await (tx as any).fileObject.update({
        where: { id: fileId },
        data: { status: FILE_STATUS.ARCHIVED, archivedAt: new Date() },
      });
      await this.emitEvent(tx, 'file.archived', { fileId, fileNo: file.fileNo, operatorId });
      this.log('info', `file archived: ${file.fileNo}`, { operatorId });
      return this.toFileView(updated);
    });
  }

  // ==========================================================
  // 私有
  // ==========================================================

  private async emitEvent(tx: any, eventType: string, payload: Record<string, unknown>): Promise<void> {
    try {
      await (tx as any).outboxEvent.create({
        data: {
          eventType,
          payload: { ...payload, occurred_at: new Date().toISOString() },
          status: 'pending',
          retryCount: 0,
        },
      });
    } catch (e) {
      this.log('warn', `emitEvent ${eventType} failed`, { error: String(e) });
    }
  }
}

export function createFjnFileService(options?: FjnServiceOptions): FjnFileService {
  return new FjnFileService(options);
}
