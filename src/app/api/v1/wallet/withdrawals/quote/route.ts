import { NextRequest } from 'next/server';
import { success, badRequest } from '@/lib/api/response';
import { requireAuth, AuthContext } from '@/lib/api/auth';
import { walletCurrencyRepository } from '@/repositories/wallet-currency.repository';

export async function POST(req: NextRequest) {
  return requireAuth(req, async (ctx: AuthContext) => {
    const body = await req.json();
    const { chainType, chainId, assetSymbol, contractAddress, amount, toAddress } = body;

    if (!chainType || !chainId || !assetSymbol || !amount || !toAddress) {
      return badRequest('Missing required parameters');
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      return badRequest('Invalid amount');
    }

    const walletCurrency = await walletCurrencyRepository.findBySymbol(assetSymbol);
    if (!walletCurrency || !walletCurrency.withdrawalEnabled) {
      return badRequest('Withdrawal is not available for this asset');
    }

    if (amountNum < parseFloat(walletCurrency.minWithdrawalAmount as any)) {
      return badRequest(`Minimum withdrawal amount is ${walletCurrency.minWithdrawalAmount}`);
    }

    const fee = parseFloat(walletCurrency.withdrawalFee as any);
    const netAmount = amountNum - fee;

    if (netAmount <= 0) {
      return badRequest('Fee exceeds the withdrawal amount');
    }

    let riskLevel: 'low' | 'medium' | 'high' | 'critical' = amountNum > 10000 ? 'medium' : 'low';
    const reasons: string[] = [];
    if (amountNum > 100000) {
      riskLevel = 'high';
      reasons.push('大额提币需人工审核');
    }

    return success({
      assetSymbol,
      amount: amount.toString(),
      feeAmount: fee.toString(),
      netAmount: netAmount.toString(),
      estimatedNetworkFee: fee.toString(),
      minWithdrawAmount: walletCurrency.minWithdrawalAmount,
      risk: {
        riskLevel,
        reasons,
        requiresSecondConfirm: riskLevel === 'high',
      },
    });
  });
}