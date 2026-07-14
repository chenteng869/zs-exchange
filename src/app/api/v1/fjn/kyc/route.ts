/**
 * FJN KYC Service REST API
 * /api/v1/fjn/kyc
 *
 * 文档：H018 §6
 *
 * KYC 端点（个人合规身份）：
 *  - GET  ?action=list                       列出 KYC
 *  - GET  ?action=detail&id=xxx              KYC 详情
 *  - GET  ?action=my-status                  当前用户最新 KYC
 *  - GET  ?action=summary                    KYC 汇总（byStatus + byLevel）
 *  - GET  ?action=review-logs                审核日志
 *  - POST action=submit                      提交 KYC (user)
 *  - POST action=approve                     通过 KYC (admin)
 *  - POST action=reject                      拒绝 KYC (admin)
 *  - POST action=manual-review               转人工 (admin)
 *  - POST action=expire                      标记过期 (admin/system)
 *  - POST action=resubmit                    重新提交 (user)
 *
 * KYB 端点（企业合规身份）：
 *  - GET  ?action=list-kyb                   列出 KYB
 *  - GET  ?action=kyb-detail&id=xxx          KYB 详情
 *  - GET  ?action=my-kyb-status              当前用户最新 KYB
 *  - GET  ?action=summary-kyb                KYB 汇总
 *  - POST action=submit-kyb                  提交 KYB (user)
 *  - POST action=approve-kyb                 通过 KYB (admin)
 *  - POST action=reject-kyb                  拒绝 KYB (admin)
 *  - POST action=manual-review-kyb           转人工 KYB (admin)
 *  - POST action=expire-kyb                  标记过期 KYB (admin/system)
 *
 * 合计 19 端点
 */

import { NextRequest } from 'next/server';
import { success, badRequest, notFound, serverError, created } from '@/lib/api/response';
import { handleApiError } from '@/lib/api/error-handler';
import { withAuth, withAdminAuth } from '@/lib/api/middleware';
import { logger } from '@/lib/logger';
import { FjnKycService } from '@/lib/fjn/services/kyc-service';
import { FjnError } from '@/lib/fjn/errors';
import { ALLOWED_MIME_TYPES, FILE_UPLOAD_LIMITS } from '@/lib/security/file-upload-guard';

// 强制动态路由：使用 nextUrl.searchParams 必须开启
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * 校验 OSS URL 是否指向允许的文件类型（基于扩展名嗅探，不下载文件）
 * 阻断伪造的 url（例如指向 .exe 改名为 .jpg 的 OSS 对象）
 */
function validateOssUrlExtension(url: string, allowedExts: string[]): boolean {
  if (typeof url !== 'string' || !url.startsWith('http')) return false;
  try {
    const u = new URL(url);
    const pathname = u.pathname.toLowerCase();
    // 提取最后一个 . 后的扩展名（去除 query 参数）
    const lastDot = pathname.lastIndexOf('.');
    if (lastDot === -1) return false;
    const ext = pathname.slice(lastDot + 1).split('/')[0].split('\\')[0];
    return allowedExts.includes(ext);
  } catch {
    return false;
  }
}

const KYC_ALLOWED_EXTS = ['jpg', 'jpeg', 'png', 'webp', 'heic', 'heif', 'pdf'];

// ============================================================
// GET handlers
// ============================================================
export async function GET(req: NextRequest) {
  const action = req.nextUrl.searchParams.get('action');
  switch (action) {
    // KYC 列表 / 详情 / 个人
    case 'list':
      return withAuth(req, () => listKycs(req));
    case 'detail':
      return withAuth(req, () => getKycDetail(req));
    case 'my-status':
      return withAuth(req, (ctx) => getMyKycStatus(ctx.userId));
    case 'summary':
      return withAdminAuth(req, () => getKycSummary());

    // KYB 列表 / 详情 / 个人
    case 'list-kyb':
      return withAuth(req, () => listKybs(req));
    case 'kyb-detail':
      return withAuth(req, () => getKybDetail(req));
    case 'my-kyb-status':
      return withAuth(req, (ctx) => getMyKybStatus(ctx.userId));
    case 'summary-kyb':
      return withAdminAuth(req, () => getKybSummary());

    // 审核日志（KYC + KYB 共用）
    case 'review-logs':
      return withAdminAuth(req, () => listReviewLogs(req));

    default:
      return badRequest(
        'Invalid action. Supported (GET): list, detail, my-status, summary, list-kyb, kyb-detail, my-kyb-status, summary-kyb, review-logs',
      );
  }
}

// ============================================================
// POST handlers
// ============================================================
export async function POST(req: NextRequest) {
  const action = req.nextUrl.searchParams.get('action');
  switch (action) {
    // KYC 操作
    case 'submit':
      return withAuth(req, (ctx) => submitKyc(req, ctx.userId));
    case 'approve':
      return withAdminAuth(req, (ctx) => approveKyc(req, ctx.userId));
    case 'reject':
      return withAdminAuth(req, (ctx) => rejectKyc(req, ctx.userId));
    case 'manual-review':
      return withAdminAuth(req, (ctx) => manualReviewKyc(req, ctx.userId));
    case 'expire':
      return withAdminAuth(req, () => expireKyc(req));
    case 'resubmit':
      return withAuth(req, (ctx) => resubmitKyc(req, ctx.userId));

    // KYB 操作
    case 'submit-kyb':
      return withAuth(req, (ctx) => submitKyb(req, ctx.userId));
    case 'approve-kyb':
      return withAdminAuth(req, (ctx) => approveKyb(req, ctx.userId));
    case 'reject-kyb':
      return withAdminAuth(req, (ctx) => rejectKyb(req, ctx.userId));
    case 'manual-review-kyb':
      return withAdminAuth(req, (ctx) => manualReviewKyb(req, ctx.userId));
    case 'expire-kyb':
      return withAdminAuth(req, () => expireKyb(req));

    default:
      return badRequest(
        'Invalid action. Supported (POST): submit, approve, reject, manual-review, expire, resubmit, submit-kyb, approve-kyb, reject-kyb, manual-review-kyb, expire-kyb',
      );
  }
}

// ============================================================
// KYC GET handlers
// ============================================================

/** 列出 KYC 记录（多维过滤 + 分页） */
async function listKycs(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  const page = parseInt(p.get('page') || '1');
  const pageSize = parseInt(p.get('pageSize') || '20');
  const kycStatus = p.get('kycStatus') || p.get('status') as any;
  const kycLevel = p.get('kycLevel') as any;
  const userId = p.get('userId') || undefined;
  const reviewerId = p.get('reviewerId') || undefined;
  const documentCountry = p.get('documentCountry') || undefined;

  try {
    const svc = new FjnKycService();
    const result = await svc.listKycs({
      userId,
      reviewerId,
      kycStatus,
      kycLevel,
      documentCountry,
      page,
      pageSize,
    });
    return success(result);
  } catch (e: any) {
    if (e instanceof FjnError) return badRequest(e.message, { code: e.code, context: e.context });
    return handleApiError(e, 'api:fjn/kyc list');
  }
}

/** KYC 详情 */
async function getKycDetail(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id');
  if (!id) return badRequest('Missing id');
  try {
    const svc = new FjnKycService();
    const kyc = await svc.findKycById(id);
    if (!kyc) return notFound('KYC not found');
    return success(kyc);
  } catch (e: any) {
    if (e instanceof FjnError) return badRequest(e.message, { code: e.code });
    return handleApiError(e, 'api:fjn/kyc detail');
  }
}

/** 当前用户的最新 KYC */
async function getMyKycStatus(userId: string) {
  try {
    const svc = new FjnKycService();
    const kyc = await svc.findLatestKycByUserId(userId);
    return success({ userId, kyc: kyc ?? null });
  } catch (e: any) {
    if (e instanceof FjnError) return badRequest(e.message, { code: e.code });
    return handleApiError(e, 'api:fjn/kyc my-status');
  }
}

/** KYC 汇总（byStatus + byLevel） */
async function getKycSummary() {
  try {
    const svc = new FjnKycService();
    const result = await svc.getKycSummary();
    return success(result);
  } catch (e: any) {
    if (e instanceof FjnError) return badRequest(e.message, { code: e.code });
    return handleApiError(e, 'api:fjn/kyc summary');
  }
}

// ============================================================
// KYC POST handlers
// ============================================================

/** 提交 KYC */
async function submitKyc(req: NextRequest, userId: string) {
  try {
    const body = await req.json();
    const { kycLevel, provider, documentType, documentCountry, documentNumberHash, documentFrontUrl, documentBackUrl, selfieUrl, expiresDays, metadata } = body;
    if (!documentType || !documentCountry) {
      return badRequest('Missing required: documentType, documentCountry');
    }
    // P0-5: 服务端校验 OSS URL 文件扩展名（阻断伪造的 .exe/.jsp 改名为 .jpg）
    if (documentFrontUrl && !validateOssUrlExtension(documentFrontUrl, KYC_ALLOWED_EXTS)) {
      return badRequest('documentFrontUrl has disallowed file extension', { code: 'DISALLOWED_FILE_EXT' });
    }
    if (documentBackUrl && !validateOssUrlExtension(documentBackUrl, KYC_ALLOWED_EXTS)) {
      return badRequest('documentBackUrl has disallowed file extension', { code: 'DISALLOWED_FILE_EXT' });
    }
    if (selfieUrl && !validateOssUrlExtension(selfieUrl, KYC_ALLOWED_EXTS)) {
      return badRequest('selfieUrl has disallowed file extension', { code: 'DISALLOWED_FILE_EXT' });
    }
    const svc = new FjnKycService();
    const result = await svc.submitKyc({
      userId,
      kycLevel,
      provider,
      documentType,
      documentCountry,
      documentNumberHash,
      documentFrontUrl,
      documentBackUrl,
      selfieUrl,
      expiresDays,
      metadata,
    });
    return created(result);
  } catch (e: any) {
    if (e instanceof FjnError) return badRequest(e.message, { code: e.code, context: e.context });
    return handleApiError(e, 'api:fjn/kyc submit');
  }
}

/** 通过 KYC */
async function approveKyc(req: NextRequest, reviewerId: string) {
  try {
    const body = await req.json();
    const { id, reviewNote, expiresDays } = body;
    if (!id) return badRequest('Missing required: id');
    const svc = new FjnKycService();
    const result = await svc.approveKyc(id, { reviewerId, reviewNote, expiresDays });
    return success(result);
  } catch (e: any) {
    if (e instanceof FjnError) return badRequest(e.message, { code: e.code, context: e.context });
    return handleApiError(e, 'api:fjn/kyc approve');
  }
}

/** 拒绝 KYC */
async function rejectKyc(req: NextRequest, reviewerId: string) {
  try {
    const body = await req.json();
    const { id, reviewNote } = body;
    if (!id || !reviewNote) return badRequest('Missing required: id, reviewNote');
    const svc = new FjnKycService();
    const result = await svc.rejectKyc(id, { reviewerId, reviewNote });
    return success(result);
  } catch (e: any) {
    if (e instanceof FjnError) return badRequest(e.message, { code: e.code, context: e.context });
    return handleApiError(e, 'api:fjn/kyc reject');
  }
}

/** 转人工复核 */
async function manualReviewKyc(req: NextRequest, reviewerId: string) {
  try {
    const body = await req.json();
    const { id, reviewNote } = body;
    if (!id) return badRequest('Missing required: id');
    const svc = new FjnKycService();
    const result = await svc.manualReviewKyc(id, { reviewerId, reviewNote });
    return success(result);
  } catch (e: any) {
    if (e instanceof FjnError) return badRequest(e.message, { code: e.code, context: e.context });
    return handleApiError(e, 'api:fjn/kyc manual-review');
  }
}

/** 标记过期 */
async function expireKyc(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, reason } = body;
    if (!id) return badRequest('Missing required: id');
    const svc = new FjnKycService();
    const result = await svc.expireKyc(id, { reason });
    return success(result);
  } catch (e: any) {
    if (e instanceof FjnError) return badRequest(e.message, { code: e.code, context: e.context });
    return handleApiError(e, 'api:fjn/kyc expire');
  }
}

/** 重新提交 KYC */
async function resubmitKyc(req: NextRequest, userId: string) {
  try {
    const body = await req.json();
    const { id, kycLevel, provider, documentType, documentCountry, documentNumberHash, documentFrontUrl, documentBackUrl, selfieUrl, metadata } = body;
    if (!id || !documentType || !documentCountry) {
      return badRequest('Missing required: id, documentType, documentCountry');
    }
    // P0-5: 服务端校验 OSS URL 文件扩展名
    if (documentFrontUrl && !validateOssUrlExtension(documentFrontUrl, KYC_ALLOWED_EXTS)) {
      return badRequest('documentFrontUrl has disallowed file extension', { code: 'DISALLOWED_FILE_EXT' });
    }
    if (documentBackUrl && !validateOssUrlExtension(documentBackUrl, KYC_ALLOWED_EXTS)) {
      return badRequest('documentBackUrl has disallowed file extension', { code: 'DISALLOWED_FILE_EXT' });
    }
    if (selfieUrl && !validateOssUrlExtension(selfieUrl, KYC_ALLOWED_EXTS)) {
      return badRequest('selfieUrl has disallowed file extension', { code: 'DISALLOWED_FILE_EXT' });
    }
    const svc = new FjnKycService();
    const result = await svc.resubmitKyc(id, {
      kycLevel,
      provider,
      documentType,
      documentCountry,
      documentNumberHash,
      documentFrontUrl,
      documentBackUrl,
      selfieUrl,
      metadata,
      operatorId: userId,
    });
    return success(result);
  } catch (e: any) {
    if (e instanceof FjnError) return badRequest(e.message, { code: e.code, context: e.context });
    return handleApiError(e, 'api:fjn/kyc resubmit');
  }
}

// ============================================================
// KYB GET handlers
// ============================================================

/** 列出 KYB */
async function listKybs(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  const page = parseInt(p.get('page') || '1');
  const pageSize = parseInt(p.get('pageSize') || '20');
  const kybStatus = p.get('kybStatus') || p.get('status') as any;
  const userId = p.get('userId') || undefined;
  const reviewerId = p.get('reviewerId') || undefined;
  const registrationCountry = p.get('registrationCountry') || undefined;

  try {
    const svc = new FjnKycService();
    const result = await svc.listKybs({
      userId,
      reviewerId,
      kybStatus,
      registrationCountry,
      page,
      pageSize,
    });
    return success(result);
  } catch (e: any) {
    if (e instanceof FjnError) return badRequest(e.message, { code: e.code, context: e.context });
    return handleApiError(e, 'api:fjn/kyc list-kyb');
  }
}

/** KYB 详情 */
async function getKybDetail(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id');
  if (!id) return badRequest('Missing id');
  try {
    const svc = new FjnKycService();
    const kyb = await svc.findKybById(id);
    if (!kyb) return notFound('KYB not found');
    return success(kyb);
  } catch (e: any) {
    if (e instanceof FjnError) return badRequest(e.message, { code: e.code });
    return handleApiError(e, 'api:fjn/kyc kyb-detail');
  }
}

/** 当前用户的最新 KYB */
async function getMyKybStatus(userId: string) {
  try {
    const svc = new FjnKycService();
    const kyb = await svc.findLatestKybByUserId(userId);
    return success({ userId, kyb: kyb ?? null });
  } catch (e: any) {
    if (e instanceof FjnError) return badRequest(e.message, { code: e.code });
    return handleApiError(e, 'api:fjn/kyc my-kyb-status');
  }
}

/** KYB 汇总 */
async function getKybSummary() {
  try {
    const svc = new FjnKycService();
    const result = await svc.getKybSummary();
    return success(result);
  } catch (e: any) {
    if (e instanceof FjnError) return badRequest(e.message, { code: e.code });
    return handleApiError(e, 'api:fjn/kyc summary-kyb');
  }
}

// ============================================================
// KYB POST handlers
// ============================================================

/** 提交 KYB */
async function submitKyb(req: NextRequest, userId: string) {
  try {
    const body = await req.json();
    const { companyName, registrationCountry, provider, registrationNumberHash, companyAddress, beneficialOwnerInfo, businessLicenseUrl, taxInfo, expiresDays, metadata } = body;
    if (!companyName || !registrationCountry) {
      return badRequest('Missing required: companyName, registrationCountry');
    }
    // P0-5: 服务端校验 KYB 营业执照 URL 文件扩展名
    if (businessLicenseUrl && !validateOssUrlExtension(businessLicenseUrl, KYC_ALLOWED_EXTS)) {
      return badRequest('businessLicenseUrl has disallowed file extension', { code: 'DISALLOWED_FILE_EXT' });
    }
    const svc = new FjnKycService();
    const result = await svc.submitKyb({
      userId,
      companyName,
      registrationCountry,
      provider,
      registrationNumberHash,
      companyAddress,
      beneficialOwnerInfo,
      businessLicenseUrl,
      taxInfo,
      expiresDays,
      metadata,
    });
    return created(result);
  } catch (e: any) {
    if (e instanceof FjnError) return badRequest(e.message, { code: e.code, context: e.context });
    return handleApiError(e, 'api:fjn/kyc submit-kyb');
  }
}

/** 通过 KYB */
async function approveKyb(req: NextRequest, reviewerId: string) {
  try {
    const body = await req.json();
    const { id, reviewNote, expiresDays } = body;
    if (!id) return badRequest('Missing required: id');
    const svc = new FjnKycService();
    const result = await svc.approveKyb(id, { reviewerId, reviewNote, expiresDays });
    return success(result);
  } catch (e: any) {
    if (e instanceof FjnError) return badRequest(e.message, { code: e.code, context: e.context });
    return handleApiError(e, 'api:fjn/kyc approve-kyb');
  }
}

/** 拒绝 KYB */
async function rejectKyb(req: NextRequest, reviewerId: string) {
  try {
    const body = await req.json();
    const { id, reviewNote } = body;
    if (!id || !reviewNote) return badRequest('Missing required: id, reviewNote');
    const svc = new FjnKycService();
    const result = await svc.rejectKyb(id, { reviewerId, reviewNote });
    return success(result);
  } catch (e: any) {
    if (e instanceof FjnError) return badRequest(e.message, { code: e.code, context: e.context });
    return handleApiError(e, 'api:fjn/kyc reject-kyb');
  }
}

/** 转人工复核 KYB */
async function manualReviewKyb(req: NextRequest, reviewerId: string) {
  try {
    const body = await req.json();
    const { id, reviewNote } = body;
    if (!id) return badRequest('Missing required: id');
    const svc = new FjnKycService();
    const result = await svc.manualReviewKyb(id, { reviewerId, reviewNote });
    return success(result);
  } catch (e: any) {
    if (e instanceof FjnError) return badRequest(e.message, { code: e.code, context: e.context });
    return handleApiError(e, 'api:fjn/kyc manual-review-kyb');
  }
}

/** 标记过期 KYB */
async function expireKyb(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, reason } = body;
    if (!id) return badRequest('Missing required: id');
    const svc = new FjnKycService();
    const result = await svc.expireKyb(id, { reason });
    return success(result);
  } catch (e: any) {
    if (e instanceof FjnError) return badRequest(e.message, { code: e.code, context: e.context });
    return handleApiError(e, 'api:fjn/kyc expire-kyb');
  }
}

// ============================================================
// 审核日志 (共用)
// ============================================================

/** 列出审核日志 */
async function listReviewLogs(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  const page = parseInt(p.get('page') || '1');
  const pageSize = parseInt(p.get('pageSize') || '20');
  const targetType = p.get('targetType') as any;  // 'kyc' | 'kyb'
  const targetId = p.get('targetId') || undefined;
  const reviewerId = p.get('reviewerId') || undefined;

  try {
    const svc = new FjnKycService();
    const result = await svc.listReviewLogs({
      targetType,
      targetId,
      reviewerId,
      page,
      pageSize,
    });
    return success(result);
  } catch (e: any) {
    if (e instanceof FjnError) return badRequest(e.message, { code: e.code, context: e.context });
    return handleApiError(e, 'api:fjn/kyc review-logs');
  }
}
