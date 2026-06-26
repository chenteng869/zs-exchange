import { NextRequest } from 'next/server';
import { success, badRequest, notFound, serverError } from '@/lib/api/response';
import { withAuth, withAdminAuth } from '@/lib/api/middleware';
import { liquidationService } from '@/lib/perp/services';
import { logger } from '@/lib/logger';

export async function GET(req: NextRequest) {
  const action = req.nextUrl.searchParams.get('action');

  switch (action) {
    case 'list':
      return withAuth(req, (ctx) => getUserLiquidations(req, ctx.userId));
    case 'detail':
      return withAuth(req, (ctx) => getLiquidationDetail(req, ctx.userId));
    case 'stats':
      return withAdminAuth(req, () => getLiquidationStats(req));
    case 'admin-list':
      return withAdminAuth(req, () => adminListLiquidations(req));
    default:
      return badRequest('Invalid action');
  }
}

async function getUserLiquidations(req: NextRequest, userId: string) {
  const p = req.nextUrl.searchParams;
  const symbol = p.get('symbol') || undefined;
  const limit = Math.min(parseInt(p.get('limit') || '50'), 200);

  try {
    const liquidations = await liquidationService.getUserLiquidations(userId, symbol, limit);
    return success({ list: liquidations, total: liquidations.length });
  } catch (e: any) {
    logger.error('[api:perp/liquidations] user list error', e);
    return serverError(e.message);
  }
}

async function getLiquidationDetail(req: NextRequest, userId: string) {
  const id = req.nextUrl.searchParams.get('id');
  if (!id) return badRequest('Missing id');

  try {
    const liq = await liquidationService.getById(id);
    if (!liq) return notFound('Liquidation not found');
    if (liq.userId !== userId) return badRequest('Unauthorized');
    return success(liq);
  } catch (e: any) {
    logger.error('[api:perp/liquidations] detail error', e);
    return serverError(e.message);
  }
}

async function getLiquidationStats(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  const symbol = p.get('symbol') || undefined;
  const page = parseInt(p.get('page') || '1');
  const pageSize = parseInt(p.get('pageSize') || '20');

  try {
    const result = await liquidationService.list({ symbol, page, pageSize });
    const totalAmount = result.list.reduce((sum: number, liq: any) => {
      return sum + parseFloat(liq.positionQty?.toString() || '0');
    }, 0);

    return success({
      ...result,
      stats: {
        totalCount: result.total,
        totalPositionSize: totalAmount.toFixed(4),
        adlTriggeredCount: result.list.filter((l: any) => l.adlTriggered).length,
      },
    });
  } catch (e: any) {
    logger.error('[api:perp/liquidations] stats error', e);
    return serverError(e.message);
  }
}

async function adminListLiquidations(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  const symbol = p.get('symbol') || undefined;
  const userId = p.get('userId') || undefined;
  const status = p.get('status') || undefined;
  const adlTriggered = p.get('adlTriggered') === 'true' ? true : undefined;
  const page = parseInt(p.get('page') || '1');
  const pageSize = parseInt(p.get('pageSize') || '50');

  try {
    const result = await liquidationService.list({ symbol, userId, status, adlTriggered, page, pageSize });
    return success(result);
  } catch (e: any) {
    logger.error('[api:perp/liquidations] admin list error', e);
    return serverError(e.message);
  }
}
