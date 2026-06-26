import { NextRequest } from 'next/server';
import { success, badRequest, serverError } from '@/lib/api/response';
import { withAuth, withAdminAuth } from '@/lib/api/middleware';
import { accountService, ledgerService, riskService } from '@/lib/perp/services';
import { logger } from '@/lib/logger';
import { Prisma } from '@prisma/client';

export async function GET(req: NextRequest) {
  const action = req.nextUrl.searchParams.get('action');

  switch (action) {
    case 'summary':
      return withAuth(req, (ctx) => getAccountSummary(req, ctx.userId));
    case 'balance':
      return withAuth(req, (ctx) => getBalance(req, ctx.userId));
    case 'ledger':
      return withAuth(req, (ctx) => getLedger(req, ctx.userId));
    case 'risk':
      return withAuth(req, (ctx) => getAccountRisk(req, ctx.userId));
    case 'admin-list':
      return withAdminAuth(req, () => adminListAccounts(req));
    default:
      return badRequest('Invalid action');
  }
}

export async function POST(req: NextRequest) {
  const action = req.nextUrl.searchParams.get('action');

  switch (action) {
    case 'deposit':
      return withAuth(req, (ctx) => deposit(req, ctx.userId));
    case 'withdraw':
      return withAuth(req, (ctx) => withdraw(req, ctx.userId));
    default:
      return badRequest('Invalid action');
  }
}

async function getAccountSummary(req: NextRequest, userId: string) {
  const asset = req.nextUrl.searchParams.get('asset') || 'USDT';
  try {
    const [summary, risk] = await Promise.all([
      accountService.getAccountSummary(userId, asset),
      riskService.getAccountRisk(userId, asset).catch(() => null),
    ]);

    if (!summary) {
      // Auto-create account on first access
      await accountService.getOrCreate(userId, asset, 'cross');
      return success({
        totalWalletBalance: '0',
        availableBalance: '0',
        frozenBalance: '0',
        marginBalance: '0',
        unrealizedPnl: '0',
        realizedPnl: '0',
        fundingFeePaid: '0',
        fundingFeeReceived: '0',
        riskRate: '0',
        riskLevel: 'safe',
      });
    }

    return success({ ...summary, risk });
  } catch (e: any) {
    logger.error('[api:perp/account] summary error', e);
    return serverError(e.message);
  }
}

async function getBalance(req: NextRequest, userId: string) {
  const asset = req.nextUrl.searchParams.get('asset') || 'USDT';
  try {
    const account = await accountService.getOrCreate(userId, asset, 'cross');
    return success({
      asset,
      totalBalance: account.balance,
      availableBalance: account.availableBalance,
      frozenBalance: account.frozenBalance,
      marginBalance: account.marginBalance,
      unrealizedPnl: account.unrealizedPnl,
    });
  } catch (e: any) {
    logger.error('[api:perp/account] balance error', e);
    return serverError(e.message);
  }
}

async function getLedger(req: NextRequest, userId: string) {
  const p = req.nextUrl.searchParams;
  const asset = p.get('asset') || 'USDT';
  const type = p.get('type') || undefined;
  const page = parseInt(p.get('page') || '1');
  const pageSize = parseInt(p.get('pageSize') || '20');

  try {
    const account = await accountService.getByUserAssetType(userId, asset, 'cross');
    if (!account) return success({ list: [], total: 0, page, pageSize });

    const result = await ledgerService.list({
      accountId: account.id,
      type,
      page,
      pageSize,
    });
    return success(result);
  } catch (e: any) {
    logger.error('[api:perp/account] ledger error', e);
    return serverError(e.message);
  }
}

async function getAccountRisk(req: NextRequest, userId: string) {
  const asset = req.nextUrl.searchParams.get('asset') || 'USDT';
  try {
    const risk = await riskService.getAccountRisk(userId, asset);
    return success({
      marginBalance: risk.marginBalance,
      totalPositionMargin: risk.totalPositionMargin,
      unrealizedPnl: risk.unrealizedPnl,
      riskRate: risk.riskRate,
      riskLevel: risk.riskLevel,
    });
  } catch (e: any) {
    logger.error('[api:perp/account] risk error', e);
    return serverError(e.message);
  }
}

async function deposit(req: NextRequest, userId: string) {
  try {
    const body = await req.json();
    const { asset, amount, referenceId } = body;
    if (!asset || !amount) return badRequest('Missing asset or amount');

    const dec = new Prisma.Decimal(amount);
    if (dec.lte(0)) return badRequest('Amount must be positive');

    const account = await accountService.deposit(
      userId,
      asset,
      dec,
      referenceId,
      'Deposit to perp account'
    );

    return success({
      success: true,
      asset,
      amount,
      newBalance: account.balance,
      availableBalance: account.availableBalance,
    });
  } catch (e: any) {
    logger.error('[api:perp/account] deposit error', e);
    return serverError(e.message);
  }
}

async function withdraw(req: NextRequest, userId: string) {
  try {
    const body = await req.json();
    const { asset, amount, referenceId } = body;
    if (!asset || !amount) return badRequest('Missing asset or amount');

    const dec = new Prisma.Decimal(amount);
    if (dec.lte(0)) return badRequest('Amount must be positive');

    const account = await accountService.withdraw(
      userId,
      asset,
      dec,
      referenceId,
      'Withdraw from perp account'
    );

    return success({
      success: true,
      asset,
      amount,
      newBalance: account.balance,
      availableBalance: account.availableBalance,
    });
  } catch (e: any) {
    logger.error('[api:perp/account] withdraw error', e);
    return serverError(e.message);
  }
}

async function adminListAccounts(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  const userId = p.get('userId') || undefined;
  const asset = p.get('asset') || undefined;
  const status = p.get('status') || undefined;
  const page = parseInt(p.get('page') || '1');
  const pageSize = parseInt(p.get('pageSize') || '50');

  try {
    const result = await accountService.list({ userId, asset, status, page, pageSize });
    return success(result);
  } catch (e: any) {
    logger.error('[api:perp/account] admin list error', e);
    return serverError(e.message);
  }
}
