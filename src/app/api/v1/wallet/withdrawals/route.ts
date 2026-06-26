import { NextRequest } from 'next/server';
import { success, badRequest, forbidden } from '@/lib/api/response';
import { requireAuth, AuthContext } from '@/lib/api/auth';
import { withdrawalRepository } from '@/repositories/withdrawal.repository';
import { balanceRepository } from '@/repositories/balance.repository';
import { walletCurrencyRepository } from '@/repositories/wallet-currency.repository';
import { parsePagination, formatPaginatedResult } from '@/lib/api/pagination';

export async function GET(req: NextRequest) {
  return requireAuth(req, async (ctx: AuthContext) => {
    const searchParams = req.nextUrl.searchParams;
    const pagination = parsePagination(searchParams);
    const currency = searchParams.get('currency')?.toUpperCase();
    const status = searchParams.get('status');
    const walletCurrency = currency ? await walletCurrencyRepository.findBySymbol(currency) : null;

    const result = await withdrawalRepository.findByUserId(ctx.userId, pagination, {
      currency: walletCurrency?.id,
      status: status || undefined,
    });

    return success(formatPaginatedResult(result));
  });
}

export async function POST(req: NextRequest) {
  return requireAuth(req, async (ctx: AuthContext) => {
    if (!ctx.user.withdrawalEnabled) {
      return forbidden('Withdrawal is not enabled for your account');
    }

    const body = await req.json();
    const currency = String(body.currency || '').toUpperCase();
    const { amount, address, memo } = body;

    if (!currency || !amount || !address) {
      return badRequest('Currency, amount, and address are required');
    }

    const walletCurrency = await walletCurrencyRepository.findBySymbol(currency);
    if (!walletCurrency || !walletCurrency.withdrawalEnabled) {
      return badRequest('Withdrawal is not available for this currency');
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      return badRequest('Invalid amount');
    }

    if (amountNum < parseFloat(walletCurrency.minWithdrawalAmount as any)) {
      return badRequest(`Minimum withdrawal amount is ${walletCurrency.minWithdrawalAmount}`);
    }

    const balance = await balanceRepository.findByUserIdAndCurrency(ctx.userId, currency);
    if (!balance || parseFloat(balance.available as any) < amountNum) {
      return badRequest('Insufficient balance');
    }

    const fee = parseFloat(walletCurrency.withdrawalFee as any);
    const totalAmount = amountNum + fee;

    if (parseFloat(balance.available as any) < totalAmount) {
      return badRequest(`Insufficient balance (includes fee: ${fee})`);
    }

    const withdrawal = await withdrawalRepository.create({
      userId: ctx.userId,
      currencyId: walletCurrency.id,
      amount: amountNum,
      fee,
      totalAmount,
      destinationAddress: address,
      memo: memo || null as any,
      status: 'pending',
      txHash: null as any,
    } as any);

    await balanceRepository.lockBalance(ctx.userId, currency, totalAmount);

    return success(withdrawal);
  });
}
