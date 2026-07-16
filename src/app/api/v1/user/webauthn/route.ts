/**
 * WebAuthn / FIDO2 API
 * /api/v1/user/webauthn
 *
 * 端点（使用 ?action=xxx 模式）：
 *  - GET  ?action=credentials            列出用户的所有凭证
 *  - POST action=register-options        生成注册选项
 *  - POST action=register-verify         验证注册响应
 *  - POST action=authenticate-options    生成认证选项
 *  - POST action=authenticate-verify     验证认证响应
 *  - POST action=revoke                  撤销凭证
 *
 * 审计：所有操作记录到 fjn_user_mfa_audit_logs（action='webauthn_*'）
 */

import { NextRequest } from 'next/server';
import { success, badRequest, notFound, forbidden } from '@/lib/api/response';
import { handleApiError } from '@/lib/api/error-handler';
import { requireAuth, AuthContext } from '@/lib/api/auth';
import {
  generateWebAuthnRegistrationOptions,
  verifyWebAuthnRegistration,
  generateWebAuthnAuthenticationOptions,
  verifyWebAuthnAuthentication,
  listUserCredentials,
  revokeCredential,
} from '@/lib/auth/webauthn-service';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// ============================================================
// GET - 列出凭证
// ============================================================
export async function GET(req: NextRequest) {
  return requireAuth(req, async (ctx: AuthContext) => {
    const action = req.nextUrl.searchParams.get('action') || 'credentials';

    try {
      if (action === 'credentials') {
        return await listCredentials(ctx);
      }
      return badRequest(`Invalid GET action: ${action}. Supported: credentials`);
    } catch (e) {
      return handleApiError(e, 'api:user/webauthn GET');
    }
  });
}

// ============================================================
// POST
// ============================================================
export async function POST(req: NextRequest) {
  return requireAuth(req, async (ctx: AuthContext) => {
    const action = req.nextUrl.searchParams.get('action');
    if (!action) {
      return badRequest(
        'Missing action. Supported: register-options, register-verify, authenticate-options, authenticate-verify, revoke',
      );
    }

    try {
      const body = await req.json().catch(() => ({}));

      switch (action) {
        case 'register-options':
          return await registerOptions(ctx, req, body);
        case 'register-verify':
          return await registerVerify(ctx, req, body);
        case 'authenticate-options':
          return await authenticateOptions(ctx, req, body);
        case 'authenticate-verify':
          return await authenticateVerify(ctx, req, body);
        case 'revoke':
          return await revoke(ctx, req, body);
        default:
          return badRequest(`Invalid action: ${action}`);
      }
    } catch (e) {
      return handleApiError(e, `api:user/webauthn POST ${action}`);
    }
  });
}

// ============================================================
// Handlers
// ============================================================

async function listCredentials(ctx: AuthContext) {
  const credentials = await listUserCredentials(ctx.userId);

  return success({
    total: credentials.length,
    credentials: credentials.map((c: any) => ({
      id: c.id,
      aaguid: c.aaguid,
      deviceName: c.deviceName,
      deviceType: c.deviceType,
      backupEligible: c.backupEligible,
      backupState: c.backupState,
      userVerified: c.userVerified,
      transports: c.transports,
      lastUsedAt: c.lastUsedAt,
      registeredAt: c.registeredAt,
    })),
  });
}

async function registerOptions(ctx: AuthContext, req: NextRequest, body: any) {
  const user = await prisma.coreUser.findUnique({
    where: { id: ctx.userId as any },
    select: { id: true, username: true, email: true } as any,
  });
  if (!user) {
    return notFound('User not found');
  }

  const options = await generateWebAuthnRegistrationOptions({
    userId: ctx.userId,
    userName: (user as any).email || (user as any).username,
    userDisplayName: (user as any).username,
    authenticatorType: body.authenticatorType || 'any',
    userVerification: body.userVerification || 'preferred',
  });

  return success({ options });
}

async function registerVerify(ctx: AuthContext, req: NextRequest, body: any) {
  if (!body.response) {
    return badRequest('Missing response in body');
  }

  const result = await verifyWebAuthnRegistration({
    userId: ctx.userId,
    response: body.response,
    deviceName: body.deviceName,
    ipAddress: req.headers.get('x-forwarded-for') || undefined,
    userAgent: req.headers.get('user-agent') || undefined,
  });

  if (!result.verified) {
    await logAudit(ctx, req, 'webauthn_register_fail', null, false, result.error);
    return badRequest(result.error || 'Registration verification failed');
  }

  await logAudit(ctx, req, 'webauthn_register_success', null, true, `credId: ${result.credentialId?.slice(0, 16)}...`);

  return success({
    verified: true,
    credentialId: result.credentialId,
    aaguid: result.aaguid,
    fmt: result.fmt,
    userVerified: result.userVerified,
    message: 'WebAuthn credential registered successfully',
  });
}

async function authenticateOptions(ctx: AuthContext, req: NextRequest, body: any) {
  const options = await generateWebAuthnAuthenticationOptions({
    userId: ctx.userId,
    userVerification: body.userVerification || 'preferred',
  });

  return success({ options });
}

async function authenticateVerify(ctx: AuthContext, req: NextRequest, body: any) {
  if (!body.response) {
    return badRequest('Missing response in body');
  }

  const result = await verifyWebAuthnAuthentication({
    userId: ctx.userId,
    response: body.response,
    ipAddress: req.headers.get('x-forwarded-for') || undefined,
    userAgent: req.headers.get('user-agent') || undefined,
  });

  if (!result.verified) {
    await logAudit(ctx, req, 'webauthn_auth_fail', null, false, result.error);
    return badRequest(result.error || 'Authentication verification failed');
  }

  // 验证成功：标记 MFA TTL
  const { markMfaVerified } = await import('@/lib/auth/mfa-ttl-store');
  await markMfaVerified(ctx.userId, 'webauthn');

  await logAudit(ctx, req, 'webauthn_auth_success', null, true, `credId: ${result.credentialId?.slice(0, 16)}...`);

  return success({
    verified: true,
    credentialId: result.credentialId,
    newCounter: result.newCounter,
    userVerified: result.userVerified,
    message: 'WebAuthn authentication successful',
  });
}

async function revoke(ctx: AuthContext, req: NextRequest, body: any) {
  const { credentialId } = body;
  if (!credentialId) {
    return badRequest('Missing credentialId');
  }

  const revoked = await revokeCredential(ctx.userId, credentialId);
  if (!revoked) {
    return notFound('Credential not found or already revoked');
  }

  await logAudit(ctx, req, 'webauthn_revoke', null, true, `credId: ${credentialId.slice(0, 16)}...`);

  return success({ revoked: true, message: 'Credential revoked' });
}

// ============================================================
// Audit
// ============================================================
async function logAudit(
  ctx: AuthContext,
  req: NextRequest,
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
        ipAddress: req.headers.get('x-forwarded-for') || null,
        userAgent: req.headers.get('user-agent')?.slice(0, 500) || null,
      } as any,
    });
  } catch (e) {
    logger.warn('[webauthn] audit log failed:', e);
  }
}
