import { Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';

type OrderSide = 'buy' | 'sell';

export interface PlaceSpotLimitOrderInput {
  userId: string;
  pair: {
    id: string;
    symbol: string;
    baseCurrency: string;
    quoteCurrency: string;
  };
  side: OrderSide;
  price: number;
  amount: number;
  source?: string;
}

export interface PlaceSpotLimitOrderResult {
  order: any;
  trades: any[];
}

const ACTIVE_ORDER_STATUSES = ['pending', 'open', 'partial'];
const ZERO = new Prisma.Decimal(0);

function decimal(value: number | string): Prisma.Decimal {
  return new Prisma.Decimal(value.toString());
}

function toNumber(value: unknown): number {
  if (value === null || value === undefined) return 0;
  return Number(value.toString());
}

function round(value: number): number {
  return Number(value.toFixed(12));
}

async function getBalance(tx: Prisma.TransactionClient, userId: string, currency: string) {
  return tx.tradeBalance.findFirst({ where: { userId, currency } });
}

async function lockBalance(
  tx: Prisma.TransactionClient,
  userId: string,
  currency: string,
  amount: number,
) {
  const balance = await getBalance(tx, userId, currency);
  if (!balance) throw new Error(`Balance not found for ${currency}`);
  if (toNumber(balance.available) < amount) throw new Error('Insufficient balance');

  return tx.tradeBalance.update({
    where: { id: balance.id },
    data: {
      available: { decrement: decimal(amount) },
      frozen: { increment: decimal(amount) },
    },
  });
}

async function ensureBalance(tx: Prisma.TransactionClient, userId: string, currency: string) {
  const balance = await getBalance(tx, userId, currency);
  if (balance) return balance;

  return tx.tradeBalance.create({
    data: {
      userId,
      currency,
      balance: ZERO,
      available: ZERO,
      frozen: ZERO,
      locked: ZERO,
    },
  });
}

async function creditAvailable(
  tx: Prisma.TransactionClient,
  userId: string,
  currency: string,
  amount: number,
) {
  const balance = await ensureBalance(tx, userId, currency);
  return tx.tradeBalance.update({
    where: { id: balance.id },
    data: {
      balance: { increment: decimal(amount) },
      available: { increment: decimal(amount) },
    },
  });
}

async function spendFrozenQuote(
  tx: Prisma.TransactionClient,
  userId: string,
  currency: string,
  reservedValue: number,
  executedValue: number,
) {
  const balance = await getBalance(tx, userId, currency);
  if (!balance || toNumber(balance.frozen) + 1e-12 < reservedValue) {
    throw new Error(`Insufficient frozen ${currency}`);
  }

  const refund = Math.max(0, round(reservedValue - executedValue));
  return tx.tradeBalance.update({
    where: { id: balance.id },
    data: {
      balance: { decrement: decimal(executedValue) },
      frozen: { decrement: decimal(reservedValue) },
      ...(refund > 0 ? { available: { increment: decimal(refund) } } : {}),
    },
  });
}

async function spendFrozenBase(
  tx: Prisma.TransactionClient,
  userId: string,
  currency: string,
  amount: number,
) {
  const balance = await getBalance(tx, userId, currency);
  if (!balance || toNumber(balance.frozen) + 1e-12 < amount) {
    throw new Error(`Insufficient frozen ${currency}`);
  }

  return tx.tradeBalance.update({
    where: { id: balance.id },
    data: {
      balance: { decrement: decimal(amount) },
      frozen: { decrement: decimal(amount) },
    },
  });
}

function nextStatus(remainingAmount: number, filledAmount: number): string {
  if (remainingAmount <= 1e-12) return 'filled';
  if (filledAmount > 1e-12) return 'partial';
  return 'open';
}

async function updateOrderAfterFill(
  tx: Prisma.TransactionClient,
  order: any,
  fillAmount: number,
  executedValue: number,
) {
  const filledAmount = round(toNumber(order.filledAmount) + fillAmount);
  const remainingAmount = round(toNumber(order.remainingAmount) - fillAmount);
  const totalExecutedValue = round(toNumber(order.executedValue) + executedValue);
  const status = nextStatus(remainingAmount, filledAmount);

  const updated = await tx.tradeOrder.update({
    where: { id: order.id },
    data: {
      filledAmount: decimal(filledAmount),
      remainingAmount: decimal(Math.max(0, remainingAmount)),
      executedValue: decimal(totalExecutedValue),
      status,
      ...(status === 'filled' ? { closedAt: new Date() } : {}),
    },
  });

  Object.assign(order, updated);
  return updated;
}

async function createTradeRows(
  tx: Prisma.TransactionClient,
  params: {
    taker: any;
    maker: any;
    pairId: string;
    symbol: string;
    price: number;
    amount: number;
    value: number;
    feeCurrency: string;
  },
) {
  const takerTrade = await tx.tradeTrade.create({
    data: {
      orderId: params.taker.id,
      counterOrderId: params.maker.id,
      pairId: params.pairId,
      userId: params.taker.userId,
      counterUserId: params.maker.userId,
      symbol: params.symbol,
      side: params.taker.side,
      price: decimal(params.price),
      amount: decimal(params.amount),
      value: decimal(params.value),
      fee: ZERO,
      feeCurrency: params.feeCurrency,
      liquidityType: 'taker',
    },
  });

  const makerTrade = await tx.tradeTrade.create({
    data: {
      orderId: params.maker.id,
      counterOrderId: params.taker.id,
      pairId: params.pairId,
      userId: params.maker.userId,
      counterUserId: params.taker.userId,
      symbol: params.symbol,
      side: params.maker.side,
      price: decimal(params.price),
      amount: decimal(params.amount),
      value: decimal(params.value),
      fee: ZERO,
      feeCurrency: params.feeCurrency,
      liquidityType: 'maker',
    },
  });

  return [takerTrade, makerTrade];
}

export async function placeSpotLimitOrder(input: PlaceSpotLimitOrderInput): Promise<PlaceSpotLimitOrderResult> {
  return prisma.$transaction(async (tx) => {
    const lockCurrency = input.side === 'buy' ? input.pair.quoteCurrency : input.pair.baseCurrency;
    const lockAmount = input.side === 'buy' ? round(input.price * input.amount) : input.amount;

    await lockBalance(tx, input.userId, lockCurrency, lockAmount);

    const order = await tx.tradeOrder.create({
      data: {
        userId: input.userId,
        pairId: input.pair.id,
        symbol: input.pair.symbol,
        side: input.side,
        type: 'limit',
        price: decimal(input.price),
        amount: decimal(input.amount),
        filledAmount: ZERO,
        remainingAmount: decimal(input.amount),
        executedValue: ZERO,
        fee: ZERO,
        feeCurrency: input.pair.quoteCurrency,
        status: 'open',
        timeInForce: 'GTC',
        source: input.source || 'api',
      },
    });

    const oppositeSide: OrderSide = input.side === 'buy' ? 'sell' : 'buy';
    const makers = await tx.tradeOrder.findMany({
      where: {
        symbol: input.pair.symbol,
        side: oppositeSide,
        type: 'limit',
        status: { in: ACTIVE_ORDER_STATUSES },
        userId: { not: input.userId },
        price: input.side === 'buy' ? { lte: decimal(input.price) } : { gte: decimal(input.price) },
      },
      orderBy: input.side === 'buy'
        ? [{ price: 'asc' }, { createdAt: 'asc' }]
        : [{ price: 'desc' }, { createdAt: 'asc' }],
      take: 50,
    });

    const trades: any[] = [];
    let taker = order;
    let takerRemaining = input.amount;

    for (const maker of makers) {
      if (takerRemaining <= 1e-12) break;

      const makerRemaining = toNumber(maker.remainingAmount);
      if (makerRemaining <= 1e-12) continue;

      const fillAmount = round(Math.min(takerRemaining, makerRemaining));
      const executionPrice = toNumber(maker.price);
      const executedValue = round(fillAmount * executionPrice);

      const buyer = taker.side === 'buy' ? taker : maker;
      const seller = taker.side === 'sell' ? taker : maker;
      const buyerReservedValue = round(toNumber(buyer.price) * fillAmount);

      await spendFrozenQuote(tx, buyer.userId, input.pair.quoteCurrency, buyerReservedValue, executedValue);
      await creditAvailable(tx, buyer.userId, input.pair.baseCurrency, fillAmount);
      await spendFrozenBase(tx, seller.userId, input.pair.baseCurrency, fillAmount);
      await creditAvailable(tx, seller.userId, input.pair.quoteCurrency, executedValue);

      taker = await updateOrderAfterFill(tx, taker, fillAmount, executedValue);
      await updateOrderAfterFill(tx, maker, fillAmount, executedValue);

      const rows = await createTradeRows(tx, {
        taker,
        maker,
        pairId: input.pair.id,
        symbol: input.pair.symbol,
        price: executionPrice,
        amount: fillAmount,
        value: executedValue,
        feeCurrency: input.pair.quoteCurrency,
      });
      trades.push(...rows);

      takerRemaining = round(takerRemaining - fillAmount);
    }

    const finalOrder = await tx.tradeOrder.findUnique({ where: { id: order.id } });
    return {
      order: finalOrder || taker,
      trades,
    };
  });
}
