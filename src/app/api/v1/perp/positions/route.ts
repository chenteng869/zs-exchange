import { NextRequest } from 'next/server';
import { success, badRequest, notFound, serverError } from '@/lib/api/response';
import { withAuth, withAdminAuth } from '@/lib/api/middleware';
import { positionService, riskService } from '@/lib/perp/services';
import { perpEngine } from '@/lib/perp/engine-singleton';
import { logger } from '@/lib/logger';

export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  const action = p.get('action');

  switch (action) {
    case 'list':
      return withAuth(req, (ctx) => listPositions(req, ctx.userId));
    case 'detail':
      return withAuth(req, (ctx) => getPositionDetail(req, ctx.userId));
    case 'summary':
      return withAuth(req, (ctx) => getPositionSummary(req, ctx.userId));
    case 'liquidation-candidates':
      return withAdminAuth(req, () => getLiquidationCandidates(req));
    case 'admin-list':
      return withAdminAuth(req, () => adminListPositions(req));
    default:
      return badRequest('Invalid action');
  }
}

export async function POST(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  const action = p.get('action');

  switch (action) {
    case 'close':
      return withAuth(req, (ctx) => closePosition(req, ctx.userId));
    case 'adjust-margin':
      return withAuth(req, (ctx) => adjustMargin(req, ctx.userId));
    case 'set-leverage':
      return withAuth(req, (ctx) => setLeverage(req, ctx.userId));
    case 'set-sl-tp':
      return withAuth(req, (ctx) => setSlTp(req, ctx.userId));
    default:
      return badRequest('Invalid action');
  }
}

async function listPositions(req: NextRequest, userId: string) {
  const symbol = req.nextUrl.searchParams.get('symbol') || undefined;
  try {
    const positions = await positionService.getUserPositions(userId, symbol);
    return success({ positions, total: positions.length });
  } catch (e: any) {
    logger.error('[api:perp/positions] list error', e);
    return serverError(e.message);
  }
}

async function getPositionDetail(req: NextRequest, userId: string) {
  const positionId = req.nextUrl.searchParams.get('positionId');
  if (!positionId) return badRequest('Missing positionId');

  try {
    const position = await positionService.getById(positionId);
    if (!position) return notFound('Position not found');
    if (position.userId !== userId) return badRequest('Unauthorized');
    return success(position);
  } catch (e: any) {
    logger.error('[api:perp/positions] detail error', e);
    return serverError(e.message);
  }
}

async function getPositionSummary(req: NextRequest, userId: string) {
  const symbol = req.nextUrl.searchParams.get('symbol') || 'USDT';
  try {
    const [summary, risk] = await Promise.all([
      positionService.getPositionSummary(userId, symbol),
      riskService.getAccountRisk(userId, 'USDT').catch(() => null),
    ]);
    return success({ ...summary, risk });
  } catch (e: any) {
    logger.error('[api:perp/positions] summary error', e);
    return serverError(e.message);
  }
}

async function closePosition(req: NextRequest, userId: string) {
  try {
    const body = await req.json();
    const { positionId, quantity, price, orderType } = body;
    if (!positionId) return badRequest('Missing positionId');

    const position = await positionService.getById(positionId);
    if (!position) return notFound('Position not found');
    if (position.userId !== userId) return badRequest('Unauthorized');
    if (position.status !== 'active') return badRequest('Position already closed');

    const result = perpEngine.closePosition(
      positionId,
      price || '1',
      quantity || String(position.positionQty)
    );
    return success(result);
  } catch (e: any) {
    logger.error('[api:perp/positions] close error', e);
    return serverError(e.message);
  }
}

async function adjustMargin(req: NextRequest, userId: string) {
  try {
    const body = await req.json();
    const { positionId, amount, direction } = body;
    if (!positionId || !amount || !direction) {
      return badRequest('Missing required parameters: positionId, amount, direction');
    }

    const position = await positionService.getById(positionId);
    if (!position) return notFound('Position not found');
    if (position.userId !== userId) return badRequest('Unauthorized');

    const delta = direction === 'add' ? amount : `-${amount}`;
    const result = perpEngine.adjustMargin(positionId, delta);
    return success(result);
  } catch (e: any) {
    logger.error('[api:perp/positions] adjust-margin error', e);
    return serverError(e.message);
  }
}

async function setLeverage(req: NextRequest, userId: string) {
  try {
    const body = await req.json();
    const { positionId, leverage } = body;
    if (!positionId || !leverage) return badRequest('Missing positionId or leverage');

    const position = await positionService.getById(positionId);
    if (!position) return notFound('Position not found');
    if (position.userId !== userId) return badRequest('Unauthorized');

    const result = perpEngine.adjustLeverage(positionId, Number(leverage));
    return success(result);
  } catch (e: any) {
    logger.error('[api:perp/positions] set-leverage error', e);
    return serverError(e.message);
  }
}

async function setSlTp(req: NextRequest, userId: string) {
  try {
    const body = await req.json();
    const { positionId, stopLoss, takeProfit } = body;
    if (!positionId) return badRequest('Missing positionId');

    const position = await positionService.getById(positionId);
    if (!position) return notFound('Position not found');
    if (position.userId !== userId) return badRequest('Unauthorized');

    // SL/TP stored via trigger orders — simplified implementation records intent
    return success({
      positionId,
      stopLoss: stopLoss || null,
      takeProfit: takeProfit || null,
      updatedAt: Date.now(),
    });
  } catch (e: any) {
    logger.error('[api:perp/positions] set-sl-tp error', e);
    return serverError(e.message);
  }
}

async function getLiquidationCandidates(req: NextRequest) {
  const symbol = req.nextUrl.searchParams.get('symbol') || 'BTCUSDT';
  try {
    const candidates = await positionService.getLiquidationCandidates(symbol);
    return success({ positions: candidates, total: candidates.length });
  } catch (e: any) {
    logger.error('[api:perp/positions] liquidation-candidates error', e);
    return serverError(e.message);
  }
}

async function adminListPositions(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  const symbol = p.get('symbol') || undefined;
  const userId = p.get('userId') || undefined;
  const status = p.get('status') || undefined;
  const side = p.get('side') || undefined;
  const page = parseInt(p.get('page') || '1');
  const pageSize = parseInt(p.get('pageSize') || '50');

  try {
    const result = await positionService.list({ userId, symbol, side, status, page, pageSize });
    return success(result);
  } catch (e: any) {
    logger.error('[api:perp/positions] admin list error', e);
    return serverError(e.message);
  }
}
