/**
 * User MFA REST API
 * /api/v1/user/mfa
 *
 * 端点（使用 ?action=xxx 模式）：
 *  - GET  ?action=status                  获取 MFA 状态
 *  - POST action=enroll                   启用 MFA（生成密钥+备份码）
 *  - POST action=activate                 激活 MFA（验证第一个 TOTP 码）
 *  - POST action=verify                   验证 MFA（敏感操作前调用）
 *  - POST action=regenerate-backup       重新生成备份码（需先验证）
 *  - POST action=disable                  关闭 MFA（需先验证）
 *
 * 审计：每次 enroll/activate/verify/disable/regenerate 都写入 fjn_user_mfa_audit_logs
 *
 * 错误码：
 *  - MFA_NOT_ENROLLED      未启用
 *  - MFA_INVALID_CODE      验证码错误
 *  - MFA_LOCKED            连续失败被锁定
 *  - MFA_ALREADY_ACTIVE    已激活
 *  - MFA_VERIFY_REQUIRED   需要先 verify
 */

import { NextRequest } from 'next/server';
import { success, badRequest, error } from '@/lib/api/response';
import { handleApiError } from '@/lib/api/error-handler';
import { requireAuth, AuthContext } from '@/lib/api/auth';
import { mfaService } from '@/lib/auth/mfa-service';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import {
  markMfaVerified,
  isMfaRecentlyVerified,
  clearMfaVerified,
  getMfaVerifiedStatus,
  MFA_TTL_SECONDS,
  MFA_TTL_MS,
} from '@/lib/auth/mfa-ttl-store';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// ============================================================
// 业务常量
// ============================================================
const MFA_MAX_FAILED_ATTEMPTS = 5;
const MFA_LOCK_DURATION_MINUTES = 15;

// ============================================================
// GET - MFA 状态
// ============================================================
export async function GET(req: NextRequest) {
  return requireAuth(req, async (ctx: AuthContext) => {
    const action = req.nextUrl.searchParams.get('action') || 'status';

    try {
      if (action === 'status') {
        return await getStatus(ctx);
      }
      return badRequest(`Invalid GET action: ${action}. Supported: status`);
    } catch (e) {
      return handleApiError(e, 'api:user/mfa GET');
    }
  });
}

// ============================================================
// POST - enroll / activate / verify / regenerate / disable
// ============================================================
export async function POST(req: NextRequest) {
  return requireAuth(req, async (ctx: AuthContext) => {
    const action = req.nextUrl.searchParams.get('action');
    if (!action) {
      return badRequest('Missing action. Supported: enroll, activate, verify, regenerate-backup, disable');
    }

    try {
      const body = await req.json().catch(() => ({}));

      switch (action) {
        case 'enroll':
          return await enroll(ctx, req, body);
        case 'activate':
          return await activate(ctx, req, body);
        case 'verify':
          return await verify(ctx, req, body);
        case 'regenerate-backup':
          return await regenerateBackup(ctx, req, body);
        case 'disable':
          return await disable(ctx, req, body);
        default:
          return badRequest(
            `Invalid action: ${action}. Supported: enroll, activate, verify, regenerate-backup, disable`,
          );
      }
    } catch (e) {
      return handleApiError(e, `api:user/mfa POST ${action}`);
    }
  });
}

// ============================================================
// Handlers
// ============================================================

async function getStatus(ctx: AuthContext) {
  const mfa = await prisma.fjnUserMfa.findUnique({
    where: { userId: ctx.userId },
    select: {
      id: true,
      status: true,
      method: true,
      activatedAt: true,
      lastUsedAt: true,
      failedAttempts: true,
      lockedUntil: true,
      backupCodes: true,
      createdAt: true,
    },
  });

  const isActive = mfa?.status === 'active';
  const now = new Date();
  const isLocked = mfa?.lockedUntil ? mfa.lockedUntil > now : false;
  const remainingLockMinutes = isLocked
    ? Math.ceil((mfa!.lockedUntil!.getTime() - now.getTime()) / 60000)
    : 0;

  return success({
    active: isActive,
    status: mfa?.status || 'not_enrolled',
    method: mfa?.method || null,
    activatedAt: mfa?.activatedAt || null,
    lastUsedAt: mfa?.lastUsedAt || null,
    backupCodesRemaining: mfa?.backupCodes?.length ?? 0,
    failedAttempts: mfa?.failedAttempts ?? 0,
    locked: isLocked,
    lockedUntil: mfa?.lockedUntil || null,
    remainingLockMinutes,
    recentlyVerified: await isMfaRecentlyVerified(ctx.userId),
    verifyTtlSeconds: (await getMfaVerifiedStatus(ctx.userId)).ttlSeconds ?? 0,
  });
}

async function enroll(ctx: AuthContext, req: NextRequest, body: any) {
  const email = body.email || ctx.user.email;
  if (!email) {
    return badRequest('Missing email (or user has no email)');
  }

  // 检查是否已激活
  const existing = await prisma.fjnUserMfa.findUnique({ where: { userId: ctx.userId } });
  if (existing && existing.status === 'active') {
    return error('MFA_ALREADY_ACTIVE', 'MFA is already active. Disable it first to re-enroll.', 400);
  }

  const result = await mfaService.enroll({ userId: ctx.userId, userEmail: email });
  await logAudit(ctx, req, 'enroll', null, true, 'MFA enrollment initiated');

  return success({
    secret: result.secret,
    otpauthUri: result.otpauthUri,
    backupCodes: result.backupCodes,
    message: 'Scan the QR code with Google Authenticator / Authy, then call /activate with a valid code.',
  });
}

async function activate(ctx: AuthContext, req: NextRequest, body: any) {
  const { code } = body;
  if (!code) {
    return badRequest('Missing code (6-digit TOTP)');
  }
  if (!/^\d{6}$/.test(code)) {
    return badRequest('code must be 6 digits');
  }

  try {
    const result = await mfaService.activate({ userId: ctx.userId, code });
    await logAudit(ctx, req, 'activate', 'totp', true, 'MFA activated');
    // 激活后直接标记为已通过
    await markMfaVerified(ctx.userId, 'totp');
    return success({ ...result, message: 'MFA activated successfully' });
  } catch (e: any) {
    await logAudit(ctx, req, 'activate', 'totp', false, e.message);
    throw e;
  }
}

async function verify(ctx: AuthContext, req: NextRequest, body: any) {
  const { code } = body;
  if (!code) {
    return badRequest('Missing code (6-digit TOTP or 10-char backup code)');
  }

  // 检查是否被锁定
  const mfaRecord = await prisma.fjnUserMfa.findUnique({ where: { userId: ctx.userId } });
  if (mfaRecord?.lockedUntil && mfaRecord.lockedUntil > new Date()) {
    return error(
      'MFA_LOCKED',
      `Too many failed attempts. Try again in ${Math.ceil(
        (mfaRecord.lockedUntil.getTime() - Date.now()) / 60000,
      )} minutes.`,
      429,
    );
  }

  try {
    const result = await mfaService.verify({ userId: ctx.userId, code });
    if (!result.valid) {
      // 增加失败计数
      const newFailedCount = (mfaRecord?.failedAttempts || 0) + 1;
      const updateData: any = { failedAttempts: newFailedCount };
      if (newFailedCount >= MFA_MAX_FAILED_ATTEMPTS) {
        updateData.lockedUntil = new Date(Date.now() + MFA_LOCK_DURATION_MINUTES * 60 * 1000);
        updateData.failedAttempts = 0; // 重置
      }
      if (mfaRecord) {
        await prisma.fjnUserMfa.update({
          where: { userId: ctx.userId },
          data: updateData,
        });
      }
      await logAudit(ctx, req, 'verify_fail', null, false, 'Invalid code');
      return error(
        'MFA_INVALID_CODE',
        newFailedCount >= MFA_MAX_FAILED_ATTEMPTS
          ? `Account locked for ${MFA_LOCK_DURATION_MINUTES} minutes`
          : `Invalid code (${MFA_MAX_FAILED_ATTEMPTS - newFailedCount} attempts remaining)`,
        401,
      );
    }

    // 验证成功
    await prisma.fjnUserMfa.update({
      where: { userId: ctx.userId },
      data: {
        failedAttempts: 0,
        lockedUntil: null,
        lastUsedAt: new Date(),
        lastUsedCounter: BigInt(Math.floor(Date.now() / 1000 / 30)),
      },
    });
    await markMfaVerified(ctx.userId, result.method);
    await logAudit(ctx, req, 'verify_success', result.method, true, 'MFA verified');

    return success({
      valid: true,
      method: result.method,
      verifiedForSeconds: MFA_TTL_SECONDS,
      message: 'MFA verified. You can now perform sensitive operations within 5 minutes.',
    });
  } catch (e: any) {
    await logAudit(ctx, req, 'verify_fail', null, false, e.message);
    throw e;
  }
}

async function regenerateBackup(ctx: AuthContext, req: NextRequest, body: any) {
  const { code } = body;
  if (!code) {
    return badRequest('Missing code (current TOTP required to regenerate backup codes)');
  }
  // 先验证当前 TOTP
  const v = await mfaService.verify({ userId: ctx.userId, code });
  if (!v.valid) {
    return error('MFA_INVALID_CODE', 'Current TOTP code is invalid', 401);
  }
  const result = await mfaService.regenerateBackupCodes({ userId: ctx.userId });
  await logAudit(ctx, req, 'regenerate_backup', null, true, '10 new backup codes generated');
  return success({
    backupCodes: result.backupCodes,
    message: 'Save these codes in a safe place. Old codes are invalidated.',
  });
}

async function disable(ctx: AuthContext, req: NextRequest, body: any) {
  const { code } = body;
  if (!code) {
    return badRequest('Missing code (current TOTP required to disable MFA)');
  }
  // 先验证当前 TOTP
  const v = await mfaService.verify({ userId: ctx.userId, code });
  if (!v.valid) {
    return error('MFA_INVALID_CODE', 'Current TOTP code is invalid', 401);
  }
  await mfaService.disable({ userId: ctx.userId });
  await clearMfaVerified(ctx.userId);
  await logAudit(ctx, req, 'disable', null, true, 'MFA disabled');
  return success({ success: true, message: 'MFA disabled' });
}

// ============================================================
// Audit Log
// ============================================================
async function logAudit(
  ctx: AuthContext,
  req: NextRequest | undefined,
  action: string,
  method: string | null,
  success: boolean,
  reason?: string,
) {
  try {
    await prisma.fjnUserMfaAuditLog.create({
      data: {
        userId: ctx.userId,
        action,
        method,
        success,
        reason: reason?.slice(0, 255),
        ipAddress: req?.headers?.get?.('x-forwarded-for') || null,
        userAgent: req?.headers?.get?.('user-agent')?.slice(0, 500) || null,
      } as any,
    });
  } catch (e) {
    logger.warn('[mfa] audit log failed:', e);
  }
}
