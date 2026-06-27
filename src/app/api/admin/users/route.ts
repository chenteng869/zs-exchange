import { NextRequest } from 'next/server';
import { success } from '@/lib/api/response';
import { withAdminAuth } from '@/lib/api/middleware';
import prisma from '@/lib/prisma';

function kycStatus(level: number): string {
  if (level === 0) return 'not_started';
  if (level === 1) return 'pending';
  if (level >= 2) return 'approved';
  return 'not_started';
}

function formatUser(u: any) {
  const profile = u.profiles?.[0];
  return {
    id: u.id,
    username: u.username,
    email: u.email,
    phone: u.phone ?? '',
    walletAddress: '',
    did: '',
    avatar: profile?.avatar ?? `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.id}`,
    kycStatus: kycStatus(u.kycLevel),
    userLevel: u.vipLevel || 1,
    isActive: u.status === 'active',
    inviteCode: u.referralCode ?? '',
    inviterId: u.referredBy ?? null,
    totalAssets: 0,
    totalTransactions: u._count?.orders ?? 0,
    createdAt: u.createdAt.toISOString().replace('T', ' ').slice(0, 16),
    updatedAt: u.updatedAt.toISOString().replace('T', ' ').slice(0, 16),
  };
}

export async function GET(req: NextRequest) {
  return withAdminAuth(req, async () => {
    const params = req.nextUrl.searchParams;
    const page = Math.max(1, parseInt(params.get('page') || '1'));
    const pageSize = Math.min(100, parseInt(params.get('pageSize') || '20'));
    const keyword = params.get('keyword') || '';
    const kycStatusFilter = params.get('kycStatus') || '';
    const statusFilter = params.get('status') || '';

    const where: any = { deletedAt: null };

    if (keyword) {
      where.OR = [
        { username: { contains: keyword, mode: 'insensitive' } },
        { email: { contains: keyword, mode: 'insensitive' } },
        { phone: { contains: keyword } },
      ];
    }

    if (statusFilter === 'active') where.status = 'active';
    else if (statusFilter === 'inactive') where.status = { not: 'active' };

    if (kycStatusFilter === 'not_started') where.kycLevel = 0;
    else if (kycStatusFilter === 'pending') where.kycLevel = 1;
    else if (kycStatusFilter === 'approved') where.kycLevel = { gte: 2 };
    else if (kycStatusFilter === 'rejected') where.kycLevel = -1;

    const [list, total] = await Promise.all([
      prisma.coreUser.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          profiles: { select: { avatar: true }, take: 1 },
          _count: { select: { apiKeys: true } },
        },
      }),
      prisma.coreUser.count({ where }),
    ]);

    return success({ items: list.map(formatUser), total, page, pageSize });
  });
}

export async function PUT(req: NextRequest) {
  return withAdminAuth(req, async () => {
    const body = await req.json();
    const { id, isActive, userLevel } = body;

    if (!id) {
      const { badRequest } = await import('@/lib/api/response');
      return badRequest('User ID required');
    }

    const data: any = {};
    if (typeof isActive === 'boolean') data.status = isActive ? 'active' : 'disabled';
    if (typeof userLevel === 'number') data.vipLevel = userLevel;

    const updated = await prisma.coreUser.update({ where: { id }, data });
    return success({ id: updated.id, status: updated.status, vipLevel: updated.vipLevel });
  });
}
