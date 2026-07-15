import { NextRequest } from 'next/server';
import { success, badRequest } from '@/lib/api/response';
import { handleApiError } from '@/lib/api/error-handler';
import { requireAuth, AuthContext } from '@/lib/api/auth';
import { kycApplicationRepository } from '@/repositories/kyc.repository';
import { userRepository } from '@/repositories/user.repository';
import { validateBase64File, ALLOWED_MIME_TYPES, FILE_UPLOAD_LIMITS } from '@/lib/security/file-upload-guard';

export async function GET(req: NextRequest) {
  return requireAuth(req, async (ctx: AuthContext) => {
    const latest = await kycApplicationRepository.findLatestByUserId(ctx.userId);
    const all = await kycApplicationRepository.findByUserId(ctx.userId);

    return success({
      current: latest ?? null,
      history: all,
      kycLevel: ctx.user.kycLevel ?? 0,
    });
  });
}

export async function POST(req: NextRequest) {
  return requireAuth(req, async (ctx: AuthContext) => {
    try {
      const body = await req.json();
      const { level, realName, idType, idNumber, idFront, idBack, selfie, address, country } = body;

      if (!level || !realName || !idType || !idNumber) {
        return badRequest('Missing required KYC fields');
      }

      // P0-5: 服务端文件校验 - 阻断伪造/超限/危险文件
      const fileOptions = {
        allowedMimes: [...ALLOWED_MIME_TYPES.KYC],
        maxSize: FILE_UPLOAD_LIMITS.IMAGE_MAX_SIZE,
      };
      // 校验身份证正面
      if (idFront) {
        const result = validateBase64File(
          idFront,
          'id_front.jpg',
          'image/jpeg',  // 默认声明 MIME，实际以嗅探为准
          fileOptions,
        );
        if (!result) throw new Error('idFront validation failed');
      }
      // 校验身份证背面
      if (idBack) {
        validateBase64File(
          idBack,
          'id_back.jpg',
          'image/jpeg',
          fileOptions,
        );
      }
      // 校验手持证件照
      if (selfie) {
        validateBase64File(
          selfie,
          'selfie.jpg',
          'image/jpeg',
          fileOptions,
        );
      }

      // Check for existing pending/approved application at this level
      const existing = await kycApplicationRepository.findLatestByUserId(ctx.userId);
      if (existing && (existing.status === 'pending' || existing.status === 'approved')) {
        return badRequest(`Already have a ${existing.status} KYC application`);
      }

      const application = await kycApplicationRepository.create({
        userId: ctx.userId,
        level: Number(level),
        realName,
        idType: idType || 'passport',
        idNumber,
        idFrontUrl: idFront || null,
        idBackUrl: idBack || null,
        selfieUrl: selfie || null,
        address: address || null,
        country: country || ctx.user.countryCode || null,
        status: 'pending',
      } as any);

      return success({ application, message: 'KYC application submitted successfully' });
    } catch (e) {
      return handleApiError(e, 'api:user/kyc submit');
    }
  });
}
