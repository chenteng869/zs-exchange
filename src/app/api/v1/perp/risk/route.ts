import { NextRequest } from 'next/server';
import { success, badRequest, serverError } from '@/lib/api/response';
import { withAuth, withAdminAuth } from '@/lib/api/middleware';
import { riskService, contractService } from '@/lib/perp/services';
import { AdvancedMarginCalculator } from '@/lib/perp/advanced-margin-calculator';
import type { Side, MarginMode } from '@/lib/perp/types';
import { logger } from '@/lib/logger';
import { Prisma } from '@prisma/client';

const marginCalc = new AdvancedMarginCalculator();

export async function GET(req: NextRequest) {
  const action = req.nextUrl.searchParams.get('action');

  switch (action) {
    case 'account':
      return withAuth(req, (ctx) => getAccountRisk(req, ctx.userId));
    case 'tiers':
      return getMarginTiers(req);
    case 'liquidation-price':
      return calculateLiquidationPrice(req);
    case 'contract-risk':
      return withAdminAuth(req, () => getContractRisk(req));
    default:
      return badRequest('Invalid action');
  }
}

export async function POST(req: NextRequest) {
  const action = req.nextUrl.searchParams.get('action');

  switch (action) {
    case 'estimate':
      return withAuth(req, (ctx) => estimateMargin(req, ctx.userId));
    case 'check-open':
      return withAuth(req, (ctx) => checkCanOpen(req, ctx.userId));
    default:
      return badRequest('Invalid action');
  }
}

async function getAccountRisk(req: NextRequest, userId: string) {
  const asset = req.nextUrl.searchParams.get('asset') || 'USDT';
  try {
    const risk = await riskService.getAccountRisk(userId, asset);
    return success({
      marginBalance: risk.marginBalance.toString(),
      totalPositionMargin: risk.totalPositionMargin.toString(),
      unrealizedPnl: risk.unrealizedPnl.toString(),
      riskRate: risk.riskRate.toString(),
      riskLevel: risk.riskLevel,
    });
  } catch (e: any) {
    logger.error('[api:perp/risk] account risk error', e);
    return serverError(e.message);
  }
}

async function estimateMargin(req: NextRequest, _userId: string) {
  try {
    const body = await req.json();
    const { side, size, price, leverage, marginMode = 'isolated' } = body;
    if (!side || !size || !price || !leverage) {
      return badRequest('Missing required: side, size, price, leverage');
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
    logger.error('[api:perp/risk] estimate error', e);
    return serverError(e.message);
  }
}

async function getMarginTiers(req: NextRequest) {
  const symbol = req.nextUrl.searchParams.get('symbol') || undefined;
  const tiers = marginCalc.getMarginTiers();
  return success({
    symbol,
    tiers: tiers.map((t) => ({
      name: t.name,
      minNotional: t.minNotional,
      maxNotional: t.maxNotional,
      initialMarginRate: t.initialMarginRate,
      maintenanceMarginRate: t.maintenanceMarginRate,
      maxLeverage: t.maxLeverage,
    })),
  });
}

async function checkCanOpen(req: NextRequest, userId: string) {
  try {
    const body = await req.json();
    const { symbol, asset, qty, price, leverage } = body;
    if (!symbol || !qty || !price || !leverage) {
      return badRequest('Missing required: symbol, qty, price, leverage');
    }

    const result = await riskService.checkCanOpenPosition(
      userId,
      asset || 'USDT',
      symbol,
      new Prisma.Decimal(qty),
      new Prisma.Decimal(price),
      Number(leverage)
    );

    return success(result);
  } catch (e: any) {
    logger.error('[api:perp/risk] check-open error', e);
    return serverError(e.message);
  }
}

async function calculateLiquidationPrice(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  const symbol = p.get('symbol') || 'BTCUSDT';
  const side = p.get('side') || 'long';
  const entryPrice = p.get('entryPrice');
  const leverage = p.get('leverage');
  const marginMode = p.get('marginMode') || 'isolated';

  if (!entryPrice || !leverage) return badRequest('Missing entryPrice or leverage');

  try {
    const liqPrice = await riskService.calculateLiquidationPrice(
      symbol,
      side,
      new Prisma.Decimal(entryPrice),
      Number(leverage),
      marginMode
    );
    return success({
      symbol,
      side,
      entryPrice,
      leverage,
      marginMode,
      liquidationPrice: liqPrice.toString(),
    });
  } catch (e: any) {
    logger.error('[api:perp/risk] liquidation price error', e);
    return serverError(e.message);
  }
}

async function getContractRisk(req: NextRequest) {
  const symbol = req.nextUrl.searchParams.get('symbol') || undefined;
  try {
    if (symbol) {
      const contract = await contractService.getBySymbol(symbol);
      if (!contract) return success({ symbol, error: 'not_found' });
      return success({
        symbol,
        maxLeverage: contract.maxLeverage,
        initialMarginRate: contract.initialMarginRate,
        maintenanceMarginRate: contract.maintenanceMarginRate,
        openInterest: contract.openInterest,
        maxOpenInterest: contract.maxOpenInterest,
        status: contract.status,
      });
    }
    const contracts = await contractService.getActiveContracts();
    return success({
      contracts: contracts.map((c) => ({
        symbol: c.symbol,
        maxLeverage: c.maxLeverage,
        openInterest: c.openInterest,
        status: c.status,
      })),
    });
  } catch (e: any) {
    logger.error('[api:perp/risk] contract risk error', e);
    return serverError(e.message);
  }
}
