import { NextRequest, NextResponse } from 'next/server';
import { handleMoonPayWebhook } from '@/lib/onramp/webhook-handler';
import {
  MoonPayClient,
  MoonPayTransactionManager,
  type BuyOrder,
} from '@/lib/onramp';
import prisma from '@/lib/prisma';
import { depositCreditService, DepositCreditError } from '@/lib/wallet/deposit-credit-service';

declare global {
  // eslint-disable-next-line no-var
  var __smyMoonPayManager: MoonPayTransactionManager | undefined;
}

async function creditCompletedMoonPayOrder(order: BuyOrder) {
  if (order.status !== 'completed') return null;

  const address = await prisma.walletAddress.findUnique({
    where: { address: order.walletAddress },
    include: { currency: true },
  });

  if (!address || address.status !== 'active') {
    console.warn(`[moonpay] completed order uses unassigned wallet address: ${order.walletAddress}`);
    return null;
  }

  if (address.userId !== order.userId) {
    console.warn(`[moonpay] completed order user mismatch: order=${order.userId} addressOwner=${address.userId}`);
    return null;
  }

  const txHash = `moonpay:${order.moonpayTxId || order.id}`;
  const requiredConfirmations = Math.max(1, address.currency.confirmationCount || 1);

  try {
    return await depositCreditService.ingestDeposit({
      userId: order.userId,
      currency: address.currency.symbol,
      chain: address.tag || address.currency.blockchain,
      address: address.address,
      txHash,
      amount: order.cryptoAmount,
      fee: order.fee || 0,
      confirmations: requiredConfirmations,
    });
  } catch (error) {
    if (error instanceof DepositCreditError) {
      console.warn(`[moonpay] deposit credit rejected [${error.code}]: ${error.message}`);
      return null;
    }
    throw error;
  }
}

function getManager(): MoonPayTransactionManager {
  if (!globalThis.__smyMoonPayManager) {
    const client = new MoonPayClient();
    const mgr = new MoonPayTransactionManager({ client });

    mgr.onOrderUpdate((order: BuyOrder) => {
      if (order.status === 'completed') {
        console.info(
          `[moonpay] COMPLETED order=${order.id} user=${order.userId} `
          + `credit ${order.cryptoAmount} ${order.crypto} to ${order.walletAddress}`,
        );
        void creditCompletedMoonPayOrder(order).catch((error) => {
          console.error('[moonpay] failed to credit completed order:', error);
        });
      } else if (order.status === 'failed') {
        console.warn(
          `[moonpay] FAILED order=${order.id} user=${order.userId} reason=${order.errorMessage ?? 'unknown'}`,
        );
      }
    });

    globalThis.__smyMoonPayManager = mgr;
  }
  return globalThis.__smyMoonPayManager;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const secret = process.env.MOONPAY_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json(
      { ok: false, error: 'MOONPAY_WEBHOOK_SECRET not configured' },
      { status: 503 },
    );
  }

  const rawBody = await req.text();
  const signature =
    req.headers.get('moonpay-signature-v2')
    || req.headers.get('Moonpay-Signature-V2')
    || req.headers.get('moonpay-signature')
    || req.headers.get('Moonpay-Signature')
    || '';

  const manager = getManager();
  const result = await handleMoonPayWebhook(rawBody, signature, secret, manager);

  if (!result.ok) {
    const isSig = result.errors.some((e) => e.includes('SIGNATURE'));
    const status = isSig ? 401 : 400;
    return NextResponse.json(
      { ok: false, processed: result.processed, errors: result.errors },
      { status },
    );
  }

  const credited = await Promise.all(
    result.events
      .filter((event) => event.status === 'completed')
      .map((event) => {
        const order = manager.getOrder(event.orderId);
        return order ? creditCompletedMoonPayOrder(order) : Promise.resolve(null);
      }),
  );

  return NextResponse.json({
    ok: true,
    processed: result.processed,
    credited: credited.filter(Boolean).length,
    events: result.events,
  });
}

export async function GET(): Promise<NextResponse> {
  const manager = getManager();
  return NextResponse.json({
    ok: true,
    orders: manager.size(),
    pending: manager.listPendingOrders().length,
  });
}
