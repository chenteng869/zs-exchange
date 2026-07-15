import { NextRequest } from 'next/server';
import { success, badRequest, forbidden } from '@/lib/api/response';
import { requireAuth, AuthContext } from '@/lib/api/auth';
import { withdrawalRepository } from '@/repositories/withdrawal.repository';
import { balanceRepository } from '@/repositories/balance.repository';
import { walletCurrencyRepository } from '@/repositories/wallet-currency.repository';
import { parsePagination, formatPaginatedResult } from '@/lib/api/pagination';
import { requireMfaForAmount, clearMfaVerified } from '@/lib/auth/mfa-middleware';
import { logger } from '@/lib/logger';

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
    const { amount, address, memo, mfaCode } = body;

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

    // ============================================================
    // P0-7.3 MFA 强制拦截 (高额交易分级)
    //  - < $1000: 不强制（小额日常提币）
    //  - $1000-$10000: 要求最近 5 分钟内 MFA verify
    //  - > $10000: 强制请求体 mfaCode
    // 注：此处用 amountNum 作为 USD 估算（生产环境应实时汇率转换）
    // ============================================================
    const mfaCheck = await requireMfaForAmount(ctx, amountNum, body);
    if (!mfaCheck.allowed) {
      logger.warn(`[withdrawal] MFA check failed for user ${ctx.userId}: ${mfaCheck.reason}`);
      return mfaCheck.response!;
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

    // 提币完成后清除 MFA 状态（防 TTL 内二次提币）
    if (mfaCode) {
      await clearMfaVerified(ctx.userId);
    }

    return success(withdrawal);
  });
}
