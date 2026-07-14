/**
 * FJN Device Service REST API
 * /api/v1/fjn/device
 *
 * 文档：H021 §6
 *
 * 端点：
 *
 * Fingerprint 域：
 *  - GET  ?action=fingerprint-detail&id=xxx     指纹详情
 *  - GET  ?action=fingerprint-by-hash&hash=xxx 按 hash 查
 *  - POST action=fingerprint                    创建或更新指纹 (upsert)
 *  - POST action=create-fingerprint             强制创建
 *  - POST action=update-fingerprint-stats       更新统计
 *
 * UserDevice 域：
 *  - GET  ?action=list                          列出用户设备
 *  - GET  ?action=device-detail&id=xxx          设备详情
 *  - POST action=bind                           绑定设备 (user)
 *  - POST action=heartbeat                      心跳 (system)
 *  - POST action=trust                          信任设备 (user/admin)
 *  - POST action=untrust                        取消信任
 *  - POST action=block                          锁定设备 (admin)
 *  - POST action=unblock                        解除锁定
 *  - POST action=revoke                         吊销设备 (user/admin)
 *  - POST action=unbind                         解绑设备
 *
 * Blacklist 域：
 *  - GET  ?action=list-blacklist                列出黑名单
 *  - GET  ?action=blacklist-by-fingerprint&fp=  按指纹查
 *  - POST action=add-blacklist                  加入黑名单 (admin)
 *  - POST action=remove-blacklist               移除黑名单 (admin)
 *  - POST action=check-blacklist                实时检查 (核心)
 *
 * RiskAssessment 域：
 *  - GET  ?action=list-risk-assessments         列出风险评估
 *  - POST action=assess-risk                    触发风险评估 (核心)
 *  - POST action=dismiss-risk                   忽略评估
 *  - POST action=action-risk                    处置评估
 *
 * Challenge 域：
 *  - GET  ?action=list-challenges               列出挑战
 *  - POST action=issue-challenge                签发挑战 (核心)
 *  - POST action=verify-challenge               验证挑战
 *  - POST action=fail-challenge                 标记失败
 *  - POST action=cancel-challenge               取消挑战
 *  - POST action=expire-challenge               标记过期
 *
 * 汇总：
 *  - GET  ?action=summary                       设备汇总
 *
 * 合计 31 端点
 */

import { NextRequest } from 'next/server';
import { success, badRequest, notFound, serverError, created } from '@/lib/api/response';
import { handleApiError } from '@/lib/api/error-handler';
import { withAuth, withAdminAuth } from '@/lib/api/middleware';
import { logger } from '@/lib/logger';
import { FjnDeviceService } from '@/lib/fjn/services/device-service';
import { FjnError } from '@/lib/fjn/errors';

// 强制动态路由：使用 nextUrl.searchParams 必须开启
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// ============================================================
// GET handlers
// ============================================================
export async function GET(req: NextRequest) {
  const action = req.nextUrl.searchParams.get('action');
  switch (action) {
    // Fingerprint
    case 'fingerprint-detail':
      return withAuth(req, () => getFingerprintDetail(req));
    case 'fingerprint-by-hash':
      return withAuth(req, () => getFingerprintByHash(req));

    // UserDevice
    case 'list':
      return withAuth(req, () => listUserDevices(req));
    case 'device-detail':
      return withAuth(req, () => getUserDeviceDetail(req));

    // Blacklist
    case 'list-blacklist':
      return withAdminAuth(req, () => listBlacklist(req));
    case 'blacklist-by-fingerprint':
      return withAuth(req, () => getBlacklistByFingerprint(req));

    // RiskAssessment
    case 'list-risk-assessments':
      return withAuth(req, () => listRiskAssessments(req));

    // Challenge
    case 'list-challenges':
      return withAuth(req, () => listChallenges(req));

    // Summary
    case 'summary':
      return withAdminAuth(req, () => getDeviceSummary());

    default:
      return badRequest(
        'Invalid action. Supported (GET): fingerprint-detail, fingerprint-by-hash, list, device-detail, list-blacklist, blacklist-by-fingerprint, list-risk-assessments, list-challenges, summary',
      );
  }
}

// ============================================================
// POST handlers
// ============================================================
export async function POST(req: NextRequest) {
  const action = req.nextUrl.searchParams.get('action');
  switch (action) {
    // Fingerprint
    case 'fingerprint':
      return withAuth(req, () => upsertFingerprint(req));
    case 'create-fingerprint':
      return withAuth(req, () => createFingerprint(req));
    case 'update-fingerprint-stats':
      return withAuth(req, () => updateFingerprintStats(req));

    // UserDevice
    case 'bind':
      return withAuth(req, (ctx) => bindDevice(req, ctx.userId));
    case 'heartbeat':
      return withAuth(req, () => heartbeatDevice(req));
    case 'trust':
      return withAuth(req, (ctx) => trustDevice(req, ctx.userId));
    case 'untrust':
      return withAuth(req, (ctx) => untrustDevice(req, ctx.userId));
    case 'block':
      return withAdminAuth(req, (ctx) => blockDevice(req, ctx.userId));
    case 'unblock':
      return withAdminAuth(req, (ctx) => unblockDevice(req, ctx.userId));
    case 'revoke':
      return withAuth(req, (ctx) => revokeDevice(req, ctx.userId));
    case 'unbind':
      return withAuth(req, (ctx) => unbindDevice(req, ctx.userId));

    // Blacklist
    case 'add-blacklist':
      return withAdminAuth(req, (ctx) => addToBlacklist(req, ctx.userId));
    case 'remove-blacklist':
      return withAdminAuth(req, (ctx) => removeFromBlacklist(req, ctx.userId));
    case 'check-blacklist':
      return withAuth(req, () => checkBlacklist(req));

    // RiskAssessment
    case 'assess-risk':
      return withAuth(req, () => assessDeviceRisk(req));
    case 'dismiss-risk':
      return withAdminAuth(req, (ctx) => dismissRisk(req, ctx.userId));
    case 'action-risk':
      return withAdminAuth(req, (ctx) => actionRisk(req, ctx.userId));

    // Challenge
    case 'issue-challenge':
      return withAuth(req, (ctx) => issueChallenge(req, ctx.userId));
    case 'verify-challenge':
      return withAuth(req, () => verifyChallenge(req));
    case 'fail-challenge':
      return withAuth(req, (ctx) => failChallenge(req, ctx.userId));
    case 'cancel-challenge':
      return withAuth(req, (ctx) => cancelChallenge(req, ctx.userId));
    case 'expire-challenge':
      return withAuth(req, () => expireChallenge(req));

    default:
      return badRequest(
        'Invalid action. Supported (POST): fingerprint, create-fingerprint, update-fingerprint-stats, bind, heartbeat, trust, untrust, block, unblock, revoke, unbind, add-blacklist, remove-blacklist, check-blacklist, assess-risk, dismiss-risk, action-risk, issue-challenge, verify-challenge, fail-challenge, cancel-challenge, expire-challenge',
      );
  }
}

// ============================================================
// Fingerprint handlers
// ============================================================

/** 指纹详情 */
async function getFingerprintDetail(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id');
  if (!id) return badRequest('Missing id');
  try {
    const svc = new FjnDeviceService();
    const fp = await svc.findFingerprintById(id);
    if (!fp) return notFound('Fingerprint not found');
    return success(fp);
  } catch (e: any) {
    if (e instanceof FjnError) return badRequest(e.message, { code: e.code });
    return handleApiError(e, 'api:fjn/device fingerprint-detail');
  }
}

/** 按 hash 查指纹 */
async function getFingerprintByHash(req: NextRequest) {
  const hash = req.nextUrl.searchParams.get('hash');
  if (!hash) return badRequest('Missing hash');
  try {
    const svc = new FjnDeviceService();
    const fp = await svc.findFingerprintByHash(hash);
    if (!fp) return notFound('Fingerprint not found');
    return success(fp);
  } catch (e: any) {
    if (e instanceof FjnError) return badRequest(e.message, { code: e.code });
    return handleApiError(e, 'api:fjn/device fingerprint-by-hash');
  }
}

/** 创建或更新指纹 */
async function upsertFingerprint(req: NextRequest) {
  try {
    const body = await req.json();
    const { fingerprint, userAgent, deviceType, osVersion, browserVersion, screenResolution, timezone, language, ipAddress, countryCode, userId } = body;
    if (!fingerprint) return badRequest('Missing required: fingerprint');
    const svc = new FjnDeviceService();
    const result = await svc.findOrCreateFingerprint({
      fingerprint, userAgent, deviceType, osVersion, browserVersion, screenResolution,
      timezone, language, ipAddress, countryCode, userId,
    });
    return success(result);
  } catch (e: any) {
    if (e instanceof FjnError) return badRequest(e.message, { code: e.code, context: e.context });
    return handleApiError(e, 'api:fjn/device fingerprint');
  }
}

/** 强制创建指纹 */
async function createFingerprint(req: NextRequest) {
  try {
    const body = await req.json();
    const { fingerprint, userAgent, deviceType, osVersion, browserVersion, screenResolution, timezone, language, ipAddress, countryCode, userId } = body;
    if (!fingerprint) return badRequest('Missing required: fingerprint');
    const svc = new FjnDeviceService();
    const result = await svc.createFingerprint({
      fingerprint, userAgent, deviceType, osVersion, browserVersion, screenResolution,
      timezone, language, ipAddress, countryCode, userId,
    });
    return created(result);
  } catch (e: any) {
    if (e instanceof FjnError) return badRequest(e.message, { code: e.code, context: e.context });
    return handleApiError(e, 'api:fjn/device create-fingerprint');
  }
}

/** 更新指纹统计 */
async function updateFingerprintStats(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, riskLevel, visitCount } = body;
    if (!id) return badRequest('Missing required: id');
    const svc = new FjnDeviceService();
    const result = await svc.updateFingerprintStats(id, { riskLevel, visitCount });
    return success(result);
  } catch (e: any) {
    if (e instanceof FjnError) return badRequest(e.message, { code: e.code, context: e.context });
    return handleApiError(e, 'api:fjn/device update-fingerprint-stats');
  }
}

// ============================================================
// UserDevice handlers
// ============================================================

/** 列出用户设备 */
async function listUserDevices(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  const page = parseInt(p.get('page') || '1');
  const pageSize = parseInt(p.get('pageSize') || '20');
  const userId = p.get('userId') || undefined;
  const status = p.get('status') as any;
  const deviceType = p.get('deviceType') as any;
  const riskLevel = p.get('riskLevel') as any;

  try {
    const svc = new FjnDeviceService();
    const result = await svc.listUserDevices({ userId, status, deviceType, riskLevel, page, pageSize });
    return success(result);
  } catch (e: any) {
    if (e instanceof FjnError) return badRequest(e.message, { code: e.code, context: e.context });
    return handleApiError(e, 'api:fjn/device list');
  }
}

/** 设备详情 */
async function getUserDeviceDetail(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id');
  if (!id) return badRequest('Missing id');
  try {
    const svc = new FjnDeviceService();
    const device = await svc.findUserDeviceById(id);
    if (!device) return notFound('UserDevice not found');
    return success(device);
  } catch (e: any) {
    if (e instanceof FjnError) return badRequest(e.message, { code: e.code });
    return handleApiError(e, 'api:fjn/device device-detail');
  }
}

/** 绑定设备（核心） */
async function bindDevice(req: NextRequest, userId: string) {
  try {
    const body = await req.json();
    const { fingerprintId, fingerprint, deviceName, deviceType, ipAddress, countryCode, isPrimary, metadata, skipChallenge } = body;
    if (!fingerprint && !fingerprintId) return badRequest('Missing required: fingerprint or fingerprintId');
    const svc = new FjnDeviceService();
    const result = await svc.bindDevice({
      userId,
      fingerprintId,
      fingerprint,
      deviceName,
      deviceType,
      ipAddress,
      countryCode,
      isPrimary,
      metadata,
      skipChallenge,
    });
    return success(result);
  } catch (e: any) {
    if (e instanceof FjnError) return badRequest(e.message, { code: e.code, context: e.context });
    return handleApiError(e, 'api:fjn/device bind');
  }
}

/** 心跳 */
async function heartbeatDevice(req: NextRequest) {
  try {
    const body = await req.json();
    const { userDeviceId, ipAddress, countryCode, cityCode, sessionId, metadata } = body;
    if (!userDeviceId) return badRequest('Missing required: userDeviceId');
    const svc = new FjnDeviceService();
    const result = await svc.heartbeat({
      userDeviceId, ipAddress, countryCode, cityCode, sessionId, metadata,
    });
    return success(result);
  } catch (e: any) {
    if (e instanceof FjnError) return badRequest(e.message, { code: e.code, context: e.context });
    return handleApiError(e, 'api:fjn/device heartbeat');
  }
}

/** 信任设备 */
async function trustDevice(req: NextRequest, operatorId: string) {
  try {
    const body = await req.json();
    const { id, reason, riskScore } = body;
    if (!id) return badRequest('Missing required: id');
    const svc = new FjnDeviceService();
    const result = await svc.trustDevice(id, { reason, riskScore, operatorId });
    return success(result);
  } catch (e: any) {
    if (e instanceof FjnError) return badRequest(e.message, { code: e.code, context: e.context });
    return handleApiError(e, 'api:fjn/device trust');
  }
}

/** 取消信任 */
async function untrustDevice(req: NextRequest, operatorId: string) {
  try {
    const body = await req.json();
    const { id, reason } = body;
    if (!id) return badRequest('Missing required: id');
    const svc = new FjnDeviceService();
    const result = await svc.untrustDevice(id, { reason, operatorId });
    return success(result);
  } catch (e: any) {
    if (e instanceof FjnError) return badRequest(e.message, { code: e.code, context: e.context });
    return handleApiError(e, 'api:fjn/device untrust');
  }
}

/** 锁定设备 */
async function blockDevice(req: NextRequest, operatorId: string) {
  try {
    const body = await req.json();
    const { id, reason } = body;
    if (!id) return badRequest('Missing required: id');
    const svc = new FjnDeviceService();
    const result = await svc.blockDevice(id, { reason, operatorId });
    return success(result);
  } catch (e: any) {
    if (e instanceof FjnError) return badRequest(e.message, { code: e.code, context: e.context });
    return handleApiError(e, 'api:fjn/device block');
  }
}

/** 解除锁定 */
async function unblockDevice(req: NextRequest, operatorId: string) {
  try {
    const body = await req.json();
    const { id, reason } = body;
    if (!id) return badRequest('Missing required: id');
    const svc = new FjnDeviceService();
    const result = await svc.unblockDevice(id, { reason, operatorId });
    return success(result);
  } catch (e: any) {
    if (e instanceof FjnError) return badRequest(e.message, { code: e.code, context: e.context });
    return handleApiError(e, 'api:fjn/device unblock');
  }
}

/** 吊销设备 */
async function revokeDevice(req: NextRequest, operatorId: string) {
  try {
    const body = await req.json();
    const { id, reason } = body;
    if (!id) return badRequest('Missing required: id');
    const svc = new FjnDeviceService();
    const result = await svc.revokeDevice(id, { reason, operatorId });
    return success(result);
  } catch (e: any) {
    if (e instanceof FjnError) return badRequest(e.message, { code: e.code, context: e.context });
    return handleApiError(e, 'api:fjn/device revoke');
  }
}

/** 解绑设备 */
async function unbindDevice(req: NextRequest, operatorId: string) {
  try {
    const body = await req.json();
    const { id, reason } = body;
    if (!id) return badRequest('Missing required: id');
    const svc = new FjnDeviceService();
    const result = await svc.unbindDevice(id, { reason, operatorId });
    return success(result);
  } catch (e: any) {
    if (e instanceof FjnError) return badRequest(e.message, { code: e.code, context: e.context });
    return handleApiError(e, 'api:fjn/device unbind');
  }
}

// ============================================================
// Blacklist handlers
// ============================================================

/** 列出黑名单 */
async function listBlacklist(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  const page = parseInt(p.get('page') || '1');
  const pageSize = parseInt(p.get('pageSize') || '20');
  const reason = p.get('reason') as any;
  const blacklistSource = p.get('blacklistSource') as any;
  const status = p.get('status') as any;

  try {
    const svc = new FjnDeviceService();
    const result = await svc.listBlacklist({ reason, blacklistSource, status, page, pageSize });
    return success(result);
  } catch (e: any) {
    if (e instanceof FjnError) return badRequest(e.message, { code: e.code, context: e.context });
    return handleApiError(e, 'api:fjn/device list-blacklist');
  }
}

/** 按指纹查黑名单 */
async function getBlacklistByFingerprint(req: NextRequest) {
  const fp = req.nextUrl.searchParams.get('fingerprint');
  if (!fp) return badRequest('Missing fingerprint');
  try {
    const svc = new FjnDeviceService();
    const result = await svc.findBlacklistByFingerprint(fp);
    return success(result ?? { matched: false });
  } catch (e: any) {
    if (e instanceof FjnError) return badRequest(e.message, { code: e.code });
    return handleApiError(e, 'api:fjn/device blacklist-by-fingerprint');
  }
}

/** 加入黑名单 */
async function addToBlacklist(req: NextRequest, operatorId: string) {
  try {
    const body = await req.json();
    const { fingerprint, reason, blacklistSource, refNo, description, validFrom, expiresDays, expiresAt, metadata } = body;
    if (!fingerprint || !reason) return badRequest('Missing required: fingerprint, reason');
    const svc = new FjnDeviceService();
    const result = await svc.addToBlacklist({
      fingerprint, reason, blacklistSource, refNo, description,
      validFrom: validFrom ? new Date(validFrom) : undefined,
      expiresDays, expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      metadata,
      operatorId,
    });
    return created(result);
  } catch (e: any) {
    if (e instanceof FjnError) return badRequest(e.message, { code: e.code, context: e.context });
    return handleApiError(e, 'api:fjn/device add-blacklist');
  }
}

/** 移除黑名单 */
async function removeFromBlacklist(req: NextRequest, operatorId: string) {
  try {
    const body = await req.json();
    const { id, reason } = body;
    if (!id) return badRequest('Missing required: id');
    const svc = new FjnDeviceService();
    const result = await svc.removeFromBlacklist(id, { reason, operatorId });
    return success(result);
  } catch (e: any) {
    if (e instanceof FjnError) return badRequest(e.message, { code: e.code, context: e.context });
    return handleApiError(e, 'api:fjn/device remove-blacklist');
  }
}

/** 实时黑名单检查 */
async function checkBlacklist(req: NextRequest) {
  try {
    const body = await req.json();
    const { fingerprint } = body;
    if (!fingerprint) return badRequest('Missing required: fingerprint');
    const svc = new FjnDeviceService();
    const result = await svc.checkBlacklist({ fingerprint });
    return success(result);
  } catch (e: any) {
    if (e instanceof FjnError) return badRequest(e.message, { code: e.code });
    return handleApiError(e, 'api:fjn/device check-blacklist');
  }
}

// ============================================================
// RiskAssessment handlers
// ============================================================

/** 列出风险评估 */
async function listRiskAssessments(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  const page = parseInt(p.get('page') || '1');
  const pageSize = parseInt(p.get('pageSize') || '20');
  const userId = p.get('userId') || undefined;
  const userDeviceId = p.get('userDeviceId') || undefined;
  const fingerprint = p.get('fingerprint') || undefined;
  const riskLevel = p.get('riskLevel') as any;
  const status = p.get('status') as any;

  try {
    const svc = new FjnDeviceService();
    const result = await svc.listRiskAssessments({
      userId, userDeviceId, fingerprint, riskLevel, status, page, pageSize,
    });
    return success(result);
  } catch (e: any) {
    if (e instanceof FjnError) return badRequest(e.message, { code: e.code, context: e.context });
    return handleApiError(e, 'api:fjn/device list-risk-assessments');
  }
}

/** 触发风险评估（核心） */
async function assessDeviceRisk(req: NextRequest) {
  try {
    const body = await req.json();
    const { fingerprint, userId, userDeviceId, factors, kycLevel, ipAddress, countryCode, notes } = body;
    if (!fingerprint || !factors) return badRequest('Missing required: fingerprint, factors');
    const svc = new FjnDeviceService();
    const result = await svc.assessDeviceRisk({
      fingerprint, userId, userDeviceId, factors, kycLevel, ipAddress, countryCode, notes,
    });
    return success(result);
  } catch (e: any) {
    if (e instanceof FjnError) return badRequest(e.message, { code: e.code, context: e.context });
    return handleApiError(e, 'api:fjn/device assess-risk');
  }
}

/** 忽略风险评估 */
async function dismissRisk(req: NextRequest, operatorId: string) {
  try {
    const body = await req.json();
    const { id, notes } = body;
    if (!id) return badRequest('Missing required: id');
    const svc = new FjnDeviceService();
    const result = await svc.dismissRiskAssessment(id, { notes, operatorId });
    return success(result);
  } catch (e: any) {
    if (e instanceof FjnError) return badRequest(e.message, { code: e.code, context: e.context });
    return handleApiError(e, 'api:fjn/device dismiss-risk');
  }
}

/** 处置风险评估 */
async function actionRisk(req: NextRequest, operatorId: string) {
  try {
    const body = await req.json();
    const { id, notes } = body;
    if (!id) return badRequest('Missing required: id');
    const svc = new FjnDeviceService();
    const result = await svc.actionRiskAssessment(id, { notes, operatorId });
    return success(result);
  } catch (e: any) {
    if (e instanceof FjnError) return badRequest(e.message, { code: e.code, context: e.context });
    return handleApiError(e, 'api:fjn/device action-risk');
  }
}

// ============================================================
// Challenge handlers
// ============================================================

/** 列出挑战 */
async function listChallenges(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  const page = parseInt(p.get('page') || '1');
  const pageSize = parseInt(p.get('pageSize') || '20');
  const userId = p.get('userId') || undefined;
  const userDeviceId = p.get('userDeviceId') || undefined;
  const status = p.get('status') as any;
  const challengeType = p.get('challengeType') as any;

  try {
    const svc = new FjnDeviceService();
    const result = await svc.listChallenges({ userId, userDeviceId, status, challengeType, page, pageSize });
    return success(result);
  } catch (e: any) {
    if (e instanceof FjnError) return badRequest(e.message, { code: e.code, context: e.context });
    return handleApiError(e, 'api:fjn/device list-challenges');
  }
}

/** 签发挑战 */
async function issueChallenge(req: NextRequest, operatorId: string) {
  try {
    const body = await req.json();
    const { userId, userDeviceId, challengeType, trigger, target, codeHash, ipAddress, userAgent, expiresInMinutes, maxAttempts, metadata } = body;
    if (!userId || !userDeviceId || !challengeType || !trigger || !target) {
      return badRequest('Missing required: userId, userDeviceId, challengeType, trigger, target');
    }
    const svc = new FjnDeviceService();
    const result = await svc.issueChallenge({
      userId, userDeviceId, challengeType, trigger, target, codeHash, ipAddress, userAgent,
      expiresInMinutes, maxAttempts, metadata,
      operatorId,
    });
    return created(result);
  } catch (e: any) {
    if (e instanceof FjnError) return badRequest(e.message, { code: e.code, context: e.context });
    return handleApiError(e, 'api:fjn/device issue-challenge');
  }
}

/** 验证挑战 */
async function verifyChallenge(req: NextRequest) {
  try {
    const body = await req.json();
    const { challengeId, codeHash, ipAddress } = body;
    if (!challengeId || !codeHash) return badRequest('Missing required: challengeId, codeHash');
    const svc = new FjnDeviceService();
    const result = await svc.verifyChallenge({ challengeId, codeHash, ipAddress });
    return success(result);
  } catch (e: any) {
    if (e instanceof FjnError) return badRequest(e.message, { code: e.code, context: e.context });
    return handleApiError(e, 'api:fjn/device verify-challenge');
  }
}

/** 标记挑战失败 */
async function failChallenge(req: NextRequest, operatorId: string) {
  try {
    const body = await req.json();
    const { id, reason } = body;
    if (!id) return badRequest('Missing required: id');
    const svc = new FjnDeviceService();
    const result = await svc.failChallenge(id, { reason, operatorId });
    return success(result);
  } catch (e: any) {
    if (e instanceof FjnError) return badRequest(e.message, { code: e.code, context: e.context });
    return handleApiError(e, 'api:fjn/device fail-challenge');
  }
}

/** 取消挑战 */
async function cancelChallenge(req: NextRequest, operatorId: string) {
  try {
    const body = await req.json();
    const { id, reason } = body;
    if (!id) return badRequest('Missing required: id');
    const svc = new FjnDeviceService();
    const result = await svc.cancelChallenge(id, { reason, operatorId });
    return success(result);
  } catch (e: any) {
    if (e instanceof FjnError) return badRequest(e.message, { code: e.code, context: e.context });
    return handleApiError(e, 'api:fjn/device cancel-challenge');
  }
}

/** 标记挑战过期 */
async function expireChallenge(req: NextRequest) {
  try {
    const body = await req.json();
    const { id } = body;
    if (!id) return badRequest('Missing required: id');
    const svc = new FjnDeviceService();
    const result = await svc.expireChallenge(id);
    return success(result);
  } catch (e: any) {
    if (e instanceof FjnError) return badRequest(e.message, { code: e.code, context: e.context });
    return handleApiError(e, 'api:fjn/device expire-challenge');
  }
}

// ============================================================
// Summary
// ============================================================

/** 设备汇总 */
async function getDeviceSummary() {
  try {
    const svc = new FjnDeviceService();
    const result = await svc.getDeviceSummary();
    return success(result);
  } catch (e: any) {
    if (e instanceof FjnError) return badRequest(e.message, { code: e.code });
    return handleApiError(e, 'api:fjn/device summary');
  }
}
