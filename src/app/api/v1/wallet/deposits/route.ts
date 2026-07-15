import { NextRequest } from 'next/server';
import { success, badRequest, forbidden } from '@/lib/api/response';
import { requireAuth, AuthContext } from '@/lib/api/auth';
import { depositRepository } from '@/repositories/deposit.repository';
import { walletCurrencyRepository } from '@/repositories/wallet-currency.repository';
import { parsePagination, formatPaginatedResult } from '@/lib/api/pagination';
import { depositCreditService, DepositCreditError } from '@/lib/wallet/deposit-credit-service';

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
    const action = String(body.action || 'address').toLowerCase();

    if (!currency) {
      return badRequest('Currency is required');
    }

    try {
      if (action === 'address' || action === 'create-address') {
        const result = await depositCreditService.getOrCreateAddress({
          userId: ctx.userId,
          currency,
          chain,
        });

        return success({
          ...result.address,
          currency: result.currency.symbol,
          chain: result.chain,
          minDepositAmount: result.currency.minDepositAmount,
          requiredConfirmations: result.currency.confirmationCount,
          reused: result.reused,
          addressSource: result.source,
        });
      }

      if (action === 'ingest' || action === 'simulate') {
        return forbidden('Deposit ingestion is reserved for trusted webhook and scanner workers');
      }

      return badRequest('Unsupported deposit action');
    } catch (error) {
      if (error instanceof DepositCreditError) {
        return badRequest(error.message, { code: error.code });
      }
      throw error;
    }
  });
}
