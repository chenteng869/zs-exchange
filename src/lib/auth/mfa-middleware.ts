/**
 * MFA 强制中间件 (P0-7.3)
 *
 * 用途：在敏感操作（提币/改密/改 KYC/管理员敏感操作）前强制验证 MFA
 *
 * 模式 A: 完全拦截
 *  - 用户必须先调用 POST /api/v1/user/mfa?action=verify 通过验证
 *  - 验证通过后 5 分钟内（TTL）可执行敏感操作
 *  - 完成后调用 clearMfaVerified() 清除状态
 *
 * 模式 B: 强制代码
 *  - 请求体必须包含 mfaCode 字段
 *  - 中间件立即验证并消费
 *
 * 用法：
 * ```typescript
 * import { requireMfaVerified, requireMfaCode } from '@/lib/auth/mfa-middleware';
 *
 * // 模式 A: 检查最近 5 分钟内是否已 verify
 * export async function POST(req: NextRequest) {
 *   return requireAuth(req, async (ctx) => {
 *     const mfaCheck = await requireMfaVerified(ctx);
 *     if (!mfaCheck.allowed) return mfaCheck.response;
 *     // ... 业务逻辑
 *     clearMfaVerified(ctx.userId);
 *   });
 * }
 *
 * // 模式 B: 强制请求体含 mfaCode
 * export async function POST(req: NextRequest) {
 *   return requireAuth(req, async (ctx) => {
 *     const mfaCheck = await requireMfaCode(ctx, body);
 *     if (!mfaCheck.allowed) return mfaCheck.response;
 *     // ... 业务逻辑
 *   });
 * }
 * ```
 */

import { AuthContext } from '@/lib/api/auth';
import { error } from '@/lib/api/response';
import { NextResponse } from 'next/server';
import { mfaService } from '@/lib/auth/mfa-service';
import {
  markMfaVerified,
  isMfaRecentlyVerified,
  clearMfaVerified,
} from '@/lib/auth/mfa-ttl-store';

// Re-export 供外部使用
export { clearMfaVerified, isMfaRecentlyVerified, markMfaVerified };

export interface MfaCheckResult {
  allowed: boolean;
  reason?: string;
  response?: NextResponse;
}

/**
 * 模式 A: 检查用户最近 5 分钟内是否已 MFA verify
 *  - 如果用户未启用 MFA → 拒绝敏感操作
 *  - 如果用户已 verify（在 TTL 内）→ 允许
 *  - 否则 → 拒绝，要求先 verify
 */
export async function requireMfaVerified(
  ctx: AuthContext,
): Promise<MfaCheckResult> {
  // 检查用户是否启用了 MFA
  const isActive = await mfaService.isActive(ctx.userId);
  if (!isActive) {
    return {
      allowed: false,
      reason: 'MFA_NOT_ENABLED',
      response: error(
        'MFA_NOT_ENABLED',
        'MFA is required for this operation. Please enable MFA in your security settings first.',
        403,
      ),
    };
  }

  // 检查最近是否已 verify
  if (!(await isMfaRecentlyVerified(ctx.userId))) {
    return {
      allowed: false,
      reason: 'MFA_VERIFY_REQUIRED',
      response: error(
        'MFA_VERIFY_REQUIRED',
        'MFA verification required. Please call POST /api/v1/user/mfa?action=verify first.',
        403,
      ),
    };
  }

  return { allowed: true };
}

/**
 * 模式 B: 强制请求体中含 mfaCode 字段
 *  - 验证通过后标记为已验证（5 分钟 TTL）
 *  - 失败计数和锁定由 mfaService.verify 处理
 */
export async function requireMfaCode(
  ctx: AuthContext,
  body: any,
): Promise<MfaCheckResult> {
  const code = body?.mfaCode;
  if (!code) {
    return {
      allowed: false,
      reason: 'MFA_CODE_MISSING',
      response: error(
        'MFA_CODE_MISSING',
        'mfaCode is required in request body for this operation.',
        400,
      ),
    };
  }

  // 检查用户是否启用了 MFA
  const isActive = await mfaService.isActive(ctx.userId);
  if (!isActive) {
    return {
      allowed: false,
      reason: 'MFA_NOT_ENABLED',
      response: error(
        'MFA_NOT_ENABLED',
        'MFA is required for this operation. Please enable MFA first.',
        403,
      ),
    };
  }

  // 验证 MFA
  const result = await mfaService.verify({ userId: ctx.userId, code });
  if (!result.valid) {
    return {
      allowed: false,
      reason: 'MFA_INVALID_CODE',
      response: error('MFA_INVALID_CODE', 'Invalid MFA code', 401),
    };
  }

  // 标记为最近已验证
  await markMfaVerified(ctx.userId, result.method);

  return { allowed: true };
}

/**
 * 高额交易特殊检查：根据金额决定 MFA 要求
 *  - < $1000: 不要求 MFA
 *  - $1000 - $10000: 要求最近 5 分钟内 MFA verify
 *  - > $10000: 强制本请求 mfaCode
 */
export async function requireMfaForAmount(
  ctx: AuthContext,
  amountUsd: number,
  body: any,
): Promise<MfaCheckResult> {
  if (amountUsd < 1000) {
    return { allowed: true };
  }
  if (amountUsd < 10000) {
    return await requireMfaVerified(ctx);
  }
  return await requireMfaCode(ctx, body);
}
