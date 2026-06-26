import { NextRequest } from 'next/server';
import { success, badRequest, notFound, serverError } from '@/lib/api/response';
import { withAuth, withAdminAuth } from '@/lib/api/middleware';
import { AdvancedMarginCalculator } from '@/lib/perp/advanced-margin-calculator';
import { accountService, riskService, positionService } from '@/lib/perp/services';
import { perpEngine } from '@/lib/perp/engine-singleton';
import type { Side, MarginMode } from '@/lib/perp/types';
import { logger } from '@/lib/logger';
import { Prisma } from '@prisma/client';

const marginCalc = new AdvancedMarginCalculator();

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const action = searchParams.get('action');

  switch (action) {
    case 'estimate':
      return withAuth(req, () => estimateMargin(req));
    case 'tiers':
      return getMarginTiers();
    case 'cross-account':
      return withAuth(req, () => getCrossMarginAccount(req));
    default:
      return badRequest('Invalid action');
  }
}

export async function POST(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const action = searchParams.get('action');

  switch (action) {
    case 'adjust-leverage':
      return withAuth(req, () => adjustLeverage(req));
    case 'add-margin':
      return withAuth(req, () => addMargin(req));
    case 'reduce-margin':
      return withAuth(req, () => reduceMargin(req));
    default:
      return badRequest('Invalid action');
  }
}

async function getMarginTiers() {
  const tiers = marginCalc.getMarginTiers();
  return success({
    tiers: tiers.map(t => ({
      name: t.name,
      minNotional: t.minNotional,
      maxNotional: t.maxNotional,
      initialMarginRate: t.initialMarginRate,
      maintenanceMarginRate: t.maintenanceMarginRate,
      maxLeverage: t.maxLeverage,
    })),
  });
}

async function estimateMargin(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      symbol,
      side,
      size,
      price,
      leverage,
      marginMode = 'isolated',
    } = body;

    if (!side || !size || !price || !leverage) {
      return badRequest('Missing required parameters');
    }

    const result = marginCalc.estimateOpenPosition(
      side as Side,
      size,
      price,
      Number(leverage),
      marginMode as MarginMode
    );

    return success({
      notional: result.notional,
      initialMargin: result.initialMargin,
      maintenanceMargin: result.maintenanceMargin,
      liquidationPrice: result.liquidationPrice,
      bankruptcyPrice: result.bankruptcyPrice,
      marginTier: {
        name: result.marginTier.name,
        maxLeverage: result.marginTier.maxLeverage,
        initialMarginRate: result.marginTier.initialMarginRate,
        maintenanceMarginRate: result.marginTier.maintenanceMarginRate,
      },
      fees: result.fees,
    });
  } catch (e: any) {
    logger.error('[api:margin] estimate error', e);
    return serverError(e.message);
  }
}

async function getCrossMarginAccount(req: NextRequest) {
  return withAuth(req, async (ctx) => {
    try {
      const asset = req.nextUrl.searchParams.get('asset') || 'USDT';
      const [summary, risk, positions] = await Promise.all([
        accountService.getAccountSummary(ctx.userId, asset),
        riskService.getAccountRisk(ctx.userId, asset).catch(() => null),
        positionService.getUserPositions(ctx.userId),
      ]);

      const walletBalance = summary?.totalWalletBalance ?? '0';
      const unrealizedPnl = summary?.unrealizedPnl ?? '0';
      const equity = new Prisma.Decimal(walletBalance).add(new Prisma.Decimal(unrealizedPnl));

      return success({
        equity: equity.toString(),
        walletBalance,
        availableBalance: summary?.availableBalance ?? '0',
        frozenBalance: summary?.frozenBalance ?? '0',
        totalUnrealizedPnl: unrealizedPnl,
        totalInitialMargin: risk?.totalPositionMargin?.toString() ?? '0',
        availableMargin: summary?.availableBalance ?? '0',
        marginRatio: risk?.riskRate?.toString() ?? '0',
        riskLevel: risk?.riskLevel ?? 'safe',
        positionCount: positions.length,
      });
    } catch (e: any) {
      logger.error('[api:perp/margin] cross account error', e);
      return serverError(e.message);
    }
  });
}

async function adjustLeverage(req: NextRequest) {
  return withAuth(req, async (ctx) => {
    try {
      const body = await req.json();
      const { positionId, newLeverage } = body;
      if (!positionId || !newLeverage) return badRequest('Missing positionId or newLeverage');

      const result = perpEngine.adjustLeverage(positionId, Number(newLeverage));
      return success({ success: true, ...result });
    } catch (e: any) {
      logger.error('[api:margin] adjust leverage error', e);
      return serverError(e.message);
    }
  });
}

async function addMargin(req: NextRequest) {
  return withAuth(req, async (ctx) => {
    try {
      const body = await req.json();
      const { positionId, amount } = body;
      if (!positionId || !amount) return badRequest('Missing positionId or amount');

      const result = perpEngine.adjustMargin(positionId, amount);
      return success({ success: true, addedAmount: amount, ...result });
    } catch (e: any) {
      logger.error('[api:margin] add margin error', e);
      return serverError(e.message);
    }
  });
}

async function reduceMargin(req: NextRequest) {
  return withAuth(req, async (ctx) => {
    try {
      const body = await req.json();
      const { positionId, amount } = body;
      if (!positionId || !amount) return badRequest('Missing positionId or amount');

      const result = perpEngine.adjustMargin(positionId, `-${amount}`);
      return success({ success: true, reducedAmount: amount, ...result });
    } catch (e: any) {
      logger.error('[api:margin] reduce margin error', e);
      return serverError(e.message);
    }
  });
}
