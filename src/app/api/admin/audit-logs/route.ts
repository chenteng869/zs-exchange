import { NextRequest } from 'next/server';
import { success } from '@/lib/api/response';
import { withAdminAuth } from '@/lib/api/middleware';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
  return withAdminAuth(req, async () => {
    const params = req.nextUrl.searchParams;
    const page = Math.max(1, parseInt(params.get('page') || '1'));
    const pageSize = Math.min(100, parseInt(params.get('pageSize') || '20'));
    const moduleName = params.get('module') || '';
    const action = params.get('action') || '';
    const status = params.get('status') || '';

    const where: any = {};
    if (moduleName) where.module = moduleName;
    if (action) where.action = action;
    if (status) where.status = status;

    const [list, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          operatorId: true,
          operatorName: true,
          operatorRole: true,
          module: true,
          action: true,
          details: true,
          status: true,
          targetId: true,
          targetType: true,
          ipAddress: true,
          createdAt: true,
        },
      }),
      prisma.auditLog.count({ where }),
    ]);

    const items = list.map((l) => ({
      ...l,
      createdAt: l.createdAt.toISOString(),
    }));

    return success({ items, total, page, pageSize });
  });
}

export async function POST(req: NextRequest) {
  return withAdminAuth(req, async (admin) => {
    const body = await req.json();
    const { module: moduleName, action, details, status = 'success', targetId, targetType } = body;

    if (!moduleName || !action) {
      const { badRequest } = await import('@/lib/api/response');
      return badRequest('module and action required');
    }

    const log = await prisma.auditLog.create({
      data: {
        operatorId: (admin as any).id ?? 'system',
        operatorName: (admin as any).username ?? 'admin',
        operatorRole: (admin as any).role ?? 'admin',
        module: moduleName,
        action,
        details: details ?? null,
        status,
        targetId: targetId ?? null,
        targetType: targetType ?? null,
        ipAddress: req.headers.get('x-forwarded-for') ?? '127.0.0.1',
        userAgent: req.headers.get('user-agent') ?? '',
      },
    });

    return success({ id: log.id });
  });
}
