import { NextRequest } from 'next/server';
import { success, notFound } from '@/lib/api/response';
import { withAdminAuth } from '@/lib/api/middleware';
import prisma from '@/lib/prisma';

function kycStatus(level: number): string {
  if (level === 0) return 'not_started';
  if (level === 1) return 'pending';
  if (level >= 2) return 'approved';
  return 'not_started';
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  return withAdminAuth(req, async () => {
    const user = await prisma.coreUser.findUnique({
      where: { id: params.id },
      include: { profiles: { select: { avatar: true, firstName: true, lastName: true }, take: 1 } },
    });
    if (!user) return notFound('User not found');

    const profile = (user as any).profiles?.[0];
    return success({
      id: user.id,
      username: user.username,
      email: user.email,
      phone: user.phone ?? '',
      walletAddress: '',
      did: '',
      avatar: profile?.avatar ?? `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`,
      kycStatus: kycStatus(user.kycLevel),
      userLevel: user.vipLevel || 1,
      isActive: user.status === 'active',
      inviteCode: user.referralCode ?? '',
      inviterId: user.referredBy ?? null,
      totalAssets: 0,
      totalTransactions: 0,
      createdAt: user.createdAt.toISOString().replace('T', ' ').slice(0, 16),
      updatedAt: user.updatedAt.toISOString().replace('T', ' ').slice(0, 16),
      lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
      totpEnabled: user.totpEnabled,
      tradingEnabled: user.tradingEnabled,
      withdrawalEnabled: user.withdrawalEnabled,
    });
  });
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  return withAdminAuth(req, async () => {
    const url = req.nextUrl.pathname;
    const body = await req.json();

    const data: any = {};
    if (typeof body.isActive === 'boolean') data.status = body.isActive ? 'active' : 'disabled';
    if (typeof body.userLevel === 'number') data.vipLevel = body.userLevel;
    if (typeof body.tradingEnabled === 'boolean') data.tradingEnabled = body.tradingEnabled;
    if (typeof body.withdrawalEnabled === 'boolean') data.withdrawalEnabled = body.withdrawalEnabled;

    if (Object.keys(data).length === 0) {
      const { badRequest } = await import('@/lib/api/response');
      return badRequest('No fields to update');
    }

    const updated = await prisma.coreUser.update({ where: { id: params.id }, data });
    return success({ id: updated.id });
  });
}
