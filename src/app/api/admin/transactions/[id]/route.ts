import { NextRequest } from 'next/server';
import { success, notFound } from '@/lib/api/response';
import { withAdminAuth } from '@/lib/api/middleware';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  return withAdminAuth(req, async () => {
    const order = await prisma.tradeOrder.findUnique({
      where: { id: params.id },
      include: { trades: { select: { id: true, price: true, amount: true, side: true, fee: true, createdAt: true } } },
    });
    if (!order) return notFound('Transaction not found');

    return success({
      id: order.id,
      userId: order.userId,
      symbol: order.symbol,
      side: order.side,
      type: order.type,
      status: order.status,
      price: order.price?.toString() ?? null,
      amount: order.amount.toString(),
      filledAmount: order.filledAmount.toString(),
      remainingAmount: order.remainingAmount.toString(),
      executedValue: order.executedValue.toString(),
      fee: order.fee.toString(),
      feeCurrency: order.feeCurrency ?? '',
      timeInForce: order.timeInForce,
      source: order.source,
      clientOrderId: order.clientOrderId ?? null,
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
      closedAt: order.closedAt?.toISOString() ?? null,
      trades: order.trades.map((t) => ({
        id: t.id,
        price: t.price.toString(),
        amount: t.amount.toString(),
        side: t.side,
        fee: t.fee.toString(),
        createdAt: t.createdAt.toISOString(),
      })),
    });
  });
}
