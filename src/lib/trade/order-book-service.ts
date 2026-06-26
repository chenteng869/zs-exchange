import prisma from '@/lib/prisma';

export interface OrderBookLevel {
  price: string;
  amount: string;
}

export interface SpotOrderBookSnapshot {
  symbol: string;
  lastUpdateId: string;
  timestamp: number;
  bids: [string, string][];
  asks: [string, string][];
}

const ACTIVE_ORDER_STATUSES = ['pending', 'open', 'partial'];

function addLevel(levels: Map<string, number>, price: unknown, amount: unknown) {
  if (price === null || price === undefined) return;

  const priceKey = price.toString();
  const amountValue = Number(amount?.toString() || 0);
  if (amountValue <= 0) return;

  levels.set(priceKey, Number(((levels.get(priceKey) || 0) + amountValue).toFixed(12)));
}

function toSortedLevels(levels: Map<string, number>, side: 'buy' | 'sell', limit: number): [string, string][] {
  return Array.from(levels.entries())
    .sort(([a], [b]) => side === 'buy' ? Number(b) - Number(a) : Number(a) - Number(b))
    .slice(0, limit)
    .map(([price, amount]) => [price, amount.toString()]);
}

export async function getSpotOrderBookSnapshot(
  symbol: string,
  limit: number = 20,
): Promise<SpotOrderBookSnapshot> {
  const cappedLimit = Math.min(Math.max(limit, 1), 100);
  const orders = await prisma.tradeOrder.findMany({
    where: {
      symbol,
      type: 'limit',
      status: { in: ACTIVE_ORDER_STATUSES },
      price: { not: null },
      remainingAmount: { gt: 0 },
    },
    select: {
      side: true,
      price: true,
      remainingAmount: true,
      updatedAt: true,
    },
    orderBy: { updatedAt: 'desc' },
    take: 1000,
  });

  const bids = new Map<string, number>();
  const asks = new Map<string, number>();
  let latestUpdatedAt = 0;

  for (const order of orders) {
    latestUpdatedAt = Math.max(latestUpdatedAt, order.updatedAt.getTime());
    if (order.side === 'buy') {
      addLevel(bids, order.price, order.remainingAmount);
    } else if (order.side === 'sell') {
      addLevel(asks, order.price, order.remainingAmount);
    }
  }

  return {
    symbol,
    lastUpdateId: latestUpdatedAt ? String(latestUpdatedAt) : '0',
    timestamp: latestUpdatedAt || Date.now(),
    bids: toSortedLevels(bids, 'buy', cappedLimit),
    asks: toSortedLevels(asks, 'sell', cappedLimit),
  };
}
