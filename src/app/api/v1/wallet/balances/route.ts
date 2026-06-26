import { NextRequest } from 'next/server';
import { success, badRequest } from '@/lib/api/response';
import { requireAuth, AuthContext } from '@/lib/api/auth';
import { balanceRepository } from '@/repositories/balance.repository';
import { walletCurrencyRepository } from '@/repositories/wallet-currency.repository';

export async function GET(req: NextRequest) {
  return requireAuth(req, async (ctx: AuthContext) => {
    const searchParams = req.nextUrl.searchParams;
    const currency = searchParams.get('currency')?.toUpperCase();

    const balances = currency
      ? await Promise.all([balanceRepository.findByUserIdAndCurrency(ctx.userId, currency)])
      : await balanceRepository.findByUserId(ctx.userId);

    return success(balances.filter(Boolean));
  });
}

export async function POST(req: NextRequest) {
  return requireAuth(req, async (ctx: AuthContext) => {
    const body = await req.json();
    const currency = String(body.currency || '').toUpperCase();

    if (!currency) {
      return badRequest('Currency is required');
    }

    const walletCurrency = await walletCurrencyRepository.findBySymbol(currency);
    if (!walletCurrency) {
      return badRequest('Invalid currency');
    }

    const balance = await balanceRepository.findByUserIdAndCurrency(ctx.userId, currency);
    if (balance) {
      return success(balance);
    }

    const newBalance = await balanceRepository.create({
      userId: ctx.userId,
      currency,
      balance: 0,
      available: 0,
      frozen: 0,
      locked: 0,
    } as any);

    return success(newBalance);
  });
}
