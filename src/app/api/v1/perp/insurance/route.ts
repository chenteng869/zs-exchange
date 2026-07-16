import { NextRequest } from 'next/server';
import { success, badRequest, notFound, serverError } from '@/lib/api/response';
import { handleApiError } from '@/lib/api/error-handler';
import { withAuth, withAdminAuth } from '@/lib/api/middleware';
import { insuranceService } from '@/lib/perp/services';
import { logger } from '@/lib/logger';
import { Prisma } from '@prisma/client';

export async function GET(req: NextRequest) {
  const action = req.nextUrl.searchParams.get('action');

  switch (action) {
    case 'balance':
      return getBalance(req);
    case 'summary':
      return getSummary(req);
    case 'all':
      return getAllFunds();
    case 'state':
      return withAdminAuth(req, () => getFundState(req));
    default:
      return badRequest('Invalid action');
  }
}

export async function POST(req: NextRequest) {
  const action = req.nextUrl.searchParams.get('action');

  switch (action) {
    case 'contribute':
      return withAdminAuth(req, () => contribute(req));
    case 'use':
      return withAdminAuth(req, () => consumeFund(req));
    default:
      return badRequest('Invalid action');
  }
}

async function getBalance(req: NextRequest) {
  const symbol = req.nextUrl.searchParams.get('symbol') || 'BTCUSDT';
  try {
    const balance = await insuranceService.getBalance(symbol);
    return success({
      symbol,
      balance: balance?.toString() ?? '0',
      currency: 'USDT',
      updatedAt: Date.now(),
    });
  } catch (e: any) {
    return handleApiError(e, 'api:perp/insurance balance');
  }
}

async function getSummary(req: NextRequest) {
  const symbol = req.nextUrl.searchParams.get('symbol') || 'BTCUSDT';
  try {
    const summary = await insuranceService.getSummary(symbol);
    if (!summary) {
      // Auto-init fund for this symbol
      const fund = await insuranceService.getOrCreate(symbol, 'USDT', '0');
      return success({
        symbol: fund.symbol,
        asset: fund.asset,
        balance: fund.balance,
        totalContributed: fund.totalContributed,
        totalUsed: fund.totalUsed,
        utilizationRate: '0',
      });
    }
    return success({
      ...summary,
      utilizationRate: summary.utilizationRate.toString(),
    });
  } catch (e: any) {
    return handleApiError(e, 'api:perp/insurance summary');
  }
}

async function getAllFunds() {
  try {
    const funds = await insuranceService.getAll();
    return success({
      funds: funds.map((f) => ({
        symbol: f.symbol,
        asset: f.asset,
        balance: f.balance,
        totalContributed: f.totalContributed,
        totalUsed: f.totalUsed,
      })),
      total: funds.length,
    });
  } catch (e: any) {
    return handleApiError(e, 'api:perp/insurance all funds');
  }
}

async function getFundState(req: NextRequest) {
  const symbol = req.nextUrl.searchParams.get('symbol') || 'BTCUSDT';
  try {
    const summary = await insuranceService.getSummary(symbol);
    if (!summary) return notFound('Insurance fund not found');

    const balance = new Prisma.Decimal(summary.balance.toString());
    const totalContributed = new Prisma.Decimal(summary.totalContributed.toString());
    const totalUsed = new Prisma.Decimal(summary.totalUsed.toString());

    return success({
      symbol,
      balance: balance.toString(),
      totalContributed: totalContributed.toString(),
      totalUsed: totalUsed.toString(),
      utilizationRate: summary.utilizationRate.toString(),
      coverageRatio: totalContributed.gt(0)
        ? balance.div(totalContributed).mul(100).toFixed(2)
        : '100',
      riskLevel: balance.gt(1000000) ? 'safe' : balance.gt(100000) ? 'warning' : 'danger',
      lastUpdateTime: Date.now(),
    });
  } catch (e: any) {
    return handleApiError(e, 'api:perp/insurance state');
  }
}

async function contribute(req: NextRequest) {
  try {
    const body = await req.json();
    const { symbol, amount } = body;
    if (!symbol || !amount) return badRequest('Missing symbol or amount');

    const dec = new Prisma.Decimal(amount);
    if (dec.lte(0)) return badRequest('Amount must be positive');

    const fund = await insuranceService.contribute(symbol, dec);
    return success({
      success: true,
      symbol,
      contributed: amount,
      newBalance: fund.balance,
      totalContributed: fund.totalContributed,
    });
  } catch (e: any) {
    return handleApiError(e, 'api:perp/insurance contribute');
  }
}

async function consumeFund(req: NextRequest) {
  try {
    const body = await req.json();
    const { symbol, amount, reason } = body;
    if (!symbol || !amount) return badRequest('Missing symbol or amount');

    const dec = new Prisma.Decimal(amount);
    const fund = await insuranceService.useFund(symbol, dec);
    return success({
      success: true,
      symbol,
      used: amount,
      reason,
      newBalance: fund.balance,
      totalUsed: fund.totalUsed,
    });
  } catch (e: any) {
    return handleApiError(e, 'api:perp/insurance use fund');
  }
}
