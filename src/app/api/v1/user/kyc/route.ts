import { NextRequest } from 'next/server';
import { success, badRequest } from '@/lib/api/response';
import { requireAuth, AuthContext } from '@/lib/api/auth';
import { kycApplicationRepository } from '@/repositories/kyc.repository';
import { userRepository } from '@/repositories/user.repository';

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
    const body = await req.json();
    const { level, realName, idType, idNumber, idFront, idBack, selfie, address, country } = body;

    if (!level || !realName || !idType || !idNumber) {
      return badRequest('Missing required KYC fields');
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
  });
}
