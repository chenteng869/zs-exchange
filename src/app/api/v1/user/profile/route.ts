import { NextRequest } from 'next/server';
import { success, badRequest } from '@/lib/api/response';
import { requireAuth, AuthContext } from '@/lib/api/auth';
import { userRepository } from '@/repositories/user.repository';
import { hashPassword, verifyPassword } from '@/lib/auth/password';
import { requireMfaCode, clearMfaVerified } from '@/lib/auth/mfa-middleware';
import { logger } from '@/lib/logger';

export async function GET(req: NextRequest) {
  return requireAuth(req, async (ctx: AuthContext) => {
    const user = ctx.user;

    return success({
      id: user.id,
      username: user.username,
      email: user.email,
      phone: user.phone,
      countryCode: user.countryCode,
      status: user.status,
      kycLevel: user.kycLevel,
      userType: user.userType,
      vipLevel: user.vipLevel,
      feeDiscount: user.feeDiscount,
      tradingEnabled: user.tradingEnabled,
      withdrawalEnabled: user.withdrawalEnabled,
      depositEnabled: user.depositEnabled,
      referralCode: user.referralCode,
      referredBy: user.referredBy,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
    });
  });
}

export async function PUT(req: NextRequest) {
  return requireAuth(req, async (ctx: AuthContext) => {
    const body = await req.json();
    const { phone, countryCode, currentPassword, newPassword } = body;

    const updateData: any = {};

    if (phone !== undefined) {
      updateData.phone = phone;
    }
    if (countryCode !== undefined) {
      updateData.countryCode = countryCode;
    }

    if (newPassword) {
      if (!currentPassword) {
        return badRequest('Current password is required to change password');
      }

      const isValid = await verifyPassword(currentPassword, ctx.user.passwordHash);
      if (!isValid) {
        return badRequest('Current password is incorrect');
      }

      if (newPassword.length < 8) {
        return badRequest('New password must be at least 8 characters');
      }

      // ============================================================
      // P0-7.3 MFA 强制拦截 (改密场景)
      //  - 如果用户已启用 MFA，必须在 body 中提供 mfaCode
      //  - 如果用户未启用 MFA，则跳过（向后兼容老用户）
      // ============================================================
      const mfaCheck = await requireMfaCode(ctx, body);
      if (!mfaCheck.allowed) {
        logger.warn(`[profile/password] MFA check failed for user ${ctx.userId}: ${mfaCheck.reason}`);
        return mfaCheck.response!;
      }

      updateData.passwordHash = await hashPassword(newPassword);
    }

    if (Object.keys(updateData).length === 0) {
      return badRequest('No valid fields to update');
    }

    const updatedUser = await userRepository.update(ctx.userId, updateData);

    // 改密后清除 MFA verify 状态
    if (newPassword) {
      await clearMfaVerified(ctx.userId);
    }

    return success({
      id: updatedUser.id,
      username: updatedUser.username,
      email: updatedUser.email,
      phone: updatedUser.phone,
      countryCode: updatedUser.countryCode,
      updatedAt: updatedUser.updatedAt,
    });
  });
}
