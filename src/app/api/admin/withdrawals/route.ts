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

    const where: any = {};
    if (status) where.status = status;

    const [list, total] = await Promise.all([
      prisma.walletWithdrawal.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          userId: true,
          amount: true,
          fee: true,
          totalAmount: true,
          destinationAddress: true,
          txHash: true,
          status: true,
          memo: true,
          createdAt: true,
          confirmedAt: true,
          currency: { select: { symbol: true, name: true } },
        },
      }),
      prisma.walletWithdrawal.count({ where }),
    ]);

    const items = list.map((w) => ({
      id: w.id,
      userId: w.userId,
      currency: w.currency.symbol,
      currencyName: w.currency.name,
      amount: w.amount.toString(),
      fee: w.fee.toString(),
      totalAmount: w.totalAmount.toString(),
      destinationAddress: w.destinationAddress,
      txHash: w.txHash ?? null,
      status: w.status,
      memo: w.memo ?? null,
      createdAt: w.createdAt.toISOString(),
      confirmedAt: w.confirmedAt?.toISOString() ?? null,
    }));

    return success({ items, total, page, pageSize });
  });
}

export async function PUT(req: NextRequest) {
  return withAdminAuth(req, async () => {
    const body = await req.json();
    const { id, action } = body;

    if (!id || !action) {
      const { badRequest } = await import('@/lib/api/response');
      return badRequest('id and action are required');
    }

    const statusMap: Record<string, string> = {
      approve: 'confirmed',
      reject: 'rejected',
      cancel: 'cancelled',
    };

    const newStatus = statusMap[action];
    if (!newStatus) {
      const { badRequest } = await import('@/lib/api/response');
      return badRequest('Invalid action');
    }

    const updated = await prisma.walletWithdrawal.update({
      where: { id },
      data: { status: newStatus, confirmedAt: newStatus === 'confirmed' ? new Date() : undefined },
    });

    return success({ id: updated.id, status: updated.status });
  });
}
