import { NextRequest } from 'next/server';
import { success } from '@/lib/api/response';
import { withAdminAuth } from '@/lib/api/middleware';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
  return withAdminAuth(req, async () => {
    const params = req.nextUrl.searchParams;
    const page = Math.max(1, parseInt(params.get('page') || '1'));
    const pageSize = Math.min(100, parseInt(params.get('pageSize') || '50'));
    const status = params.get('status') || '';

    const where: any = {};
    if (status) where.status = status;

    const [records, total] = await Promise.all([
      prisma.kycApplication.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          userId: true,
          status: true,
          level: true,
          reviewNotes: true,
          createdAt: true,
          reviewedAt: true,
        },
      }),
      prisma.kycApplication.count({ where }),
    ]);

    const levelLabelMap: Record<number, string> = {
      1: 'KYC身份审核',
      2: 'AML可疑交易',
      3: '高风险KYC',
    };

    const statusLevelMap: Record<string, string> = {
      pending: 'high',
      reviewing: 'medium',
      approved: 'low',
      rejected: 'high',
    };

    const items = records.map((r) => ({
      id: r.id.slice(0, 12).toUpperCase(),
      type: r.reviewNotes ? '合规风险' : (levelLabelMap[r.level] || 'KYC审核'),
      level: statusLevelMap[r.status] || 'medium',
      entity: r.userId.slice(0, 8) + '...' + r.userId.slice(-4),
      time: r.createdAt.toISOString().slice(0, 19).replace('T', ' '),
      status: r.status === 'approved' ? 'resolved' : r.status === 'reviewing' ? 'reviewing' : 'pending',
    }));

    return success({ items, total, page, pageSize });
  });
}
