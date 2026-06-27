import { NextRequest } from 'next/server';
import { success } from '@/lib/api/response';
import { withAdminAuth } from '@/lib/api/middleware';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
  return withAdminAuth(req, async () => {
    const params = req.nextUrl.searchParams;
    const page = Math.max(1, parseInt(params.get('page') || '1'));
    const pageSize = Math.min(100, parseInt(params.get('pageSize') || '20'));
    const status = params.get('status') || '';
    const level = params.get('level') ? parseInt(params.get('level')!) : undefined;

    const where: any = {};
    if (status) where.status = status;
    if (level !== undefined) where.level = level;

    const [list, total] = await Promise.all([
      prisma.kycApplication.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          userId: true,
          level: true,
          status: true,
          firstName: true,
          lastName: true,
          nationality: true,
          idType: true,
          idNumber: true,
          reviewedBy: true,
          reviewNotes: true,
          createdAt: true,
          updatedAt: true,
          reviewedAt: true,
        },
      }),
      prisma.kycApplication.count({ where }),
    ]);

    const items = list.map((k) => ({
      ...k,
      name: `${k.firstName} ${k.lastName}`,
      createdAt: k.createdAt.toISOString(),
      updatedAt: k.updatedAt.toISOString(),
      reviewedAt: k.reviewedAt?.toISOString() ?? null,
    }));

    return success({ items, total, page, pageSize });
  });
}

export async function PUT(req: NextRequest) {
  return withAdminAuth(req, async (admin) => {
    const body = await req.json();
    const { id, action, reviewNotes } = body;

    if (!id || !action) {
      const { badRequest } = await import('@/lib/api/response');
      return badRequest('id and action are required');
    }

    const statusMap: Record<string, string> = {
      approve: 'approved',
      reject: 'rejected',
      reset: 'pending',
    };

    const newStatus = statusMap[action];
    if (!newStatus) {
      const { badRequest } = await import('@/lib/api/response');
      return badRequest('Invalid action');
    }

    const updated = await prisma.kycApplication.update({
      where: { id },
      data: {
        status: newStatus,
        reviewedBy: (admin as any).id ?? null,
        reviewNotes: reviewNotes ?? null,
        reviewedAt: new Date(),
        updatedAt: new Date(),
      },
    });

    if (newStatus === 'approved') {
      await prisma.coreUser.update({
        where: { id: updated.userId },
        data: { kycLevel: updated.level },
      });
    }

    return success({ id: updated.id, status: updated.status });
  });
}
