import { NextRequest } from 'next/server';
import { success, badRequest } from '@/lib/api/response';
import { requireAuth, AuthContext } from '@/lib/api/auth';
import { depositRepository } from '@/repositories/deposit.repository';
import { walletAddressRepository } from '@/repositories/wallet-address.repository';
import { walletCurrencyRepository } from '@/repositories/wallet-currency.repository';
import { parsePagination, formatPaginatedResult } from '@/lib/api/pagination';

export async function GET(req: NextRequest) {
  return requireAuth(req, async (ctx: AuthContext) => {
    const searchParams = req.nextUrl.searchParams;
    const pagination = parsePagination(searchParams);
    const currency = searchParams.get('currency')?.toUpperCase();
    const status = searchParams.get('status');
    const walletCurrency = currency ? await walletCurrencyRepository.findBySymbol(currency) : null;

    const result = await depositRepository.findByUserId(ctx.userId, pagination, {
      currency: walletCurrency?.id,
      status: status || undefined,
    });

    return success(formatPaginatedResult(result));
  });
}

export async function POST(req: NextRequest) {
  return requireAuth(req, async (ctx: AuthContext) => {
    const body = await req.json();
    const currency = String(body.currency || '').toUpperCase();
    const chain = body.chain || 'ethereum';

    if (!currency) {
      return badRequest('Currency is required');
    }

    const walletCurrency = await walletCurrencyRepository.findBySymbol(currency);
    if (!walletCurrency || !walletCurrency.depositEnabled) {
      return badRequest('Deposit is not available for this currency');
    }

    let address = await walletAddressRepository.findByUserIdAndCurrency(ctx.userId, walletCurrency.id);

    if (!address) {
      address = await walletAddressRepository.create({
        userId: ctx.userId,
        currencyId: walletCurrency.id,
        address: `${chain}_${currency.toLowerCase()}_${ctx.userId.slice(0, 8)}_${Date.now().toString(36)}`,
        tag: chain,
        status: 'active',
      } as any);
    }

    return success(address);
  });
}
