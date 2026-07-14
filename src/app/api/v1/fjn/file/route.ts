/**
 * FJN File Service REST API
 * /api/v1/fjn/file
 *
 * 文档：H038
 *
 * 端点：
 *  - GET  ?action=list                    文件列表
 *  - GET  ?action=detail&id=xxx           文件详情
 *  - GET  ?action=permission-list&fileId  权限列表
 *  - GET  ?action=access-log-list&fileId  访问日志
 *  - POST action=create-upload-token      创建上传令牌
 *  - POST action=complete-upload          确认上传完成
 *  - POST action=create-signed-url        生成签名 URL
 *  - POST action=grant-permission         授予权限 (admin)
 *  - POST action=revoke-permission        撤销权限 (admin)
 *  - POST action=archive                  归档 (admin)
 */

import { NextRequest } from 'next/server';
import { success, badRequest, notFound } from '@/lib/api/response';
import { handleApiError } from '@/lib/api/error-handler';
import { withAdminAuth } from '@/lib/api/middleware';
import { FjnFileService } from '@/lib/fjn/services/file-service';
import { FjnError } from '@/lib/fjn/errors';
import { validateFileMetadata, ALLOWED_MIME_TYPES, FILE_UPLOAD_LIMITS } from '@/lib/security/file-upload-guard';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const action = req.nextUrl.searchParams.get('action');
  switch (action) {
    case 'list':
      return withAdminAuth(req, () => listFiles(req));
    case 'detail':
      return withAdminAuth(req, () => getFileDetail(req));
    case 'permission-list':
      return withAdminAuth(req, () => listPermissions(req));
    case 'access-log-list':
      return withAdminAuth(req, () => listAccessLogs(req));
    default:
      return badRequest('Invalid action. Supported (GET): list, detail, permission-list, access-log-list');
  }
}

export async function POST(req: NextRequest) {
  const action = req.nextUrl.searchParams.get('action');
  switch (action) {
    case 'create-upload-token':
      return withAdminAuth(req, (ctx) => createUploadToken(req, ctx.userId));
    case 'complete-upload':
      return withAdminAuth(req, () => completeUpload(req));
    case 'create-signed-url':
      return withAdminAuth(req, (ctx) => createSignedUrl(req, ctx.userId));
    case 'grant-permission':
      return withAdminAuth(req, (ctx) => grantPermission(req, ctx.userId));
    case 'revoke-permission':
      return withAdminAuth(req, (ctx) => revokePermission(req, ctx.userId));
    case 'archive':
      return withAdminAuth(req, (ctx) => archiveFile(req, ctx.userId));
    default:
      return badRequest('Invalid action. Supported (POST): create-upload-token, complete-upload, create-signed-url, grant-permission, revoke-permission, archive');
  }
}

async function listFiles(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  const page = parseInt(p.get('page') || '1');
  const pageSize = parseInt(p.get('pageSize') || '20');
  const businessType = p.get('businessType') || undefined;
  const businessId = p.get('businessId') || undefined;
  const ownerUserId = p.get('ownerUserId') || undefined;
  const fileType = (p.get('fileType') as any) || undefined;
  const sensitivity = (p.get('sensitivity') as any) || undefined;
  const status = (p.get('status') as any) || undefined;
  try {
    const svc = new FjnFileService();
    const result = await svc.list({ businessType, businessId, ownerUserId, fileType, sensitivity, status, page, pageSize });
    return success(result);
  } catch (e: any) {
    if (e instanceof FjnError) return badRequest(e.message, { code: e.code, context: e.context });
    return handleApiError(e, 'api:fjn/file list');
  }
}

async function getFileDetail(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id');
  if (!id) return badRequest('Missing id');
  try {
    const svc = new FjnFileService();
    const file = await svc.getById(id);
    return success(file);
  } catch (e: any) {
    if (e instanceof FjnError) return notFound(e.message);
    return handleApiError(e, 'api:fjn/file detail');
  }
}

async function listPermissions(req: NextRequest) {
  const fileId = req.nextUrl.searchParams.get('fileId');
  if (!fileId) return badRequest('Missing fileId');
  try {
    const svc = new FjnFileService();
    const result = await svc.listPermissions(fileId);
    return success({ items: result });
  } catch (e: any) {
    if (e instanceof FjnError) return badRequest(e.message, { code: e.code, context: e.context });
    return handleApiError(e, 'api:fjn/file permission-list');
  }
}

async function listAccessLogs(req: NextRequest) {
  const fileId = req.nextUrl.searchParams.get('fileId');
  if (!fileId) return badRequest('Missing fileId');
  const limit = parseInt(req.nextUrl.searchParams.get('limit') || '50');
  try {
    const svc = new FjnFileService();
    const result = await svc.listAccessLogs(fileId, limit);
    return success({ items: result });
  } catch (e: any) {
    if (e instanceof FjnError) return badRequest(e.message, { code: e.code, context: e.context });
    return handleApiError(e, 'api:fjn/file access-log-list');
  }
}

async function createUploadToken(req: NextRequest, ownerUserId: string) {
  try {
    const body = await req.json();
    const { originalName, fileType, mimeType, fileSize, sensitivity, businessType, businessId } = body;
    if (!originalName || !fileType || !mimeType || !fileSize) {
      return badRequest('Missing required: originalName, fileType, mimeType, fileSize');
    }
    // P0-5: 服务端文件元数据校验（OSS 直传场景：客户端仅传元数据，文件已上传到 OSS）
    const allowedMimes = fileType === 'image'
      ? [...ALLOWED_MIME_TYPES.IMAGE]
      : fileType === 'document'
        ? [...ALLOWED_MIME_TYPES.DOCUMENT]
        : [...ALLOWED_MIME_TYPES.IMAGE, ...ALLOWED_MIME_TYPES.DOCUMENT];
    const maxSize = fileType === 'document'
      ? FILE_UPLOAD_LIMITS.DOCUMENT_MAX_SIZE
      : FILE_UPLOAD_LIMITS.IMAGE_MAX_SIZE;
    const safeMeta = validateFileMetadata(
      { originalName, mimeType, fileSize: Number(fileSize) },
      { allowedMimes, maxSize, userId: ownerUserId },
    );
    const svc = new FjnFileService();
    const result = await svc.createUploadToken({
      originalName: safeMeta.safeName,
      fileType,
      mimeType: safeMeta.mime,
      fileSize: Number(fileSize),
      sensitivity,
      ownerUserId,
      businessType,
      businessId,
    });
    return success({ ...result, ossKey: safeMeta.ossKey });
  } catch (e: any) {
    if (e instanceof FjnError) return badRequest(e.message, { code: e.code, context: e.context });
    return handleApiError(e, 'api:fjn/file create-upload-token');
  }
}

async function completeUpload(req: NextRequest) {
  try {
    const { fileId, checksum, fileSize } = await req.json();
    if (!fileId) return badRequest('Missing required: fileId');
    const svc = new FjnFileService();
    const result = await svc.completeUpload({ fileId, checksum, fileSize });
    return success(result);
  } catch (e: any) {
    if (e instanceof FjnError) return badRequest(e.message, { code: e.code, context: e.context });
    return handleApiError(e, 'api:fjn/file complete-upload');
  }
}

async function createSignedUrl(req: NextRequest, createdBy: string) {
  try {
    const { fileId, action, expiresInSeconds } = await req.json();
    if (!fileId || !action) return badRequest('Missing required: fileId, action');
    const svc = new FjnFileService();
    const result = await svc.createSignedUrl({ fileId, action, expiresInSeconds, createdBy });
    return success(result);
  } catch (e: any) {
    if (e instanceof FjnError) return badRequest(e.message, { code: e.code, context: e.context });
    return handleApiError(e, 'api:fjn/file create-signed-url');
  }
}

async function grantPermission(req: NextRequest, grantedBy: string) {
  try {
    const body = await req.json();
    const { fileId, principalType, principalId, permission } = body;
    if (!fileId || !principalType || !principalId || !permission) {
      return badRequest('Missing required: fileId, principalType, principalId, permission');
    }
    const svc = new FjnFileService();
    const result = await svc.grantPermission({ fileId, principalType, principalId, permission, grantedBy });
    return success(result);
  } catch (e: any) {
    if (e instanceof FjnError) return badRequest(e.message, { code: e.code, context: e.context });
    return handleApiError(e, 'api:fjn/file grant-permission');
  }
}

async function revokePermission(req: NextRequest, revokedBy: string) {
  try {
    const { permissionId } = await req.json();
    if (!permissionId) return badRequest('Missing required: permissionId');
    const svc = new FjnFileService();
    const result = await svc.revokePermission(permissionId, revokedBy);
    return success(result);
  } catch (e: any) {
    if (e instanceof FjnError) return badRequest(e.message, { code: e.code, context: e.context });
    return handleApiError(e, 'api:fjn/file revoke-permission');
  }
}

async function archiveFile(req: NextRequest, operatorId: string) {
  try {
    const { fileId } = await req.json();
    if (!fileId) return badRequest('Missing required: fileId');
    const svc = new FjnFileService();
    const result = await svc.archive(fileId, operatorId);
    return success(result);
  } catch (e: any) {
    if (e instanceof FjnError) return badRequest(e.message, { code: e.code, context: e.context });
    return handleApiError(e, 'api:fjn/file archive');
  }
}
