import { NextRequest } from 'next/server';
import { success, badRequest, notFound } from '@/lib/api/response';
import { requireAuth, AuthContext } from '@/lib/api/auth';
import { SolanaAdapter, isValidSolanaAddress } from '@/lib/wallet/chains/solana-adapter';

const adapter = new SolanaAdapter();

export async function GET(req: NextRequest) {
  return requireAuth(req, async (ctx: AuthContext) => {
    const searchParams = req.nextUrl.searchParams;
    const address = searchParams.get('address');
    const chain = searchParams.get('chain') || 'mainnet';

    if (!address) {
      return badRequest('Address is required');
    }

    if (!isValidSolanaAddress(address)) {
      return badRequest('Invalid Solana address');
    }

    try {
      adapter.setChain(chain);
      const balance = await adapter.getNativeBalance(address);
      
      return success({
        address,
        chain,
        balance: balance.native.formatted,
        rawBalance: balance.native.balance,
        decimals: balance.native.decimals,
        symbol: balance.native.symbol,
        updatedAt: balance.updatedAt,
      });
    } catch (error) {
      return badRequest(error instanceof Error ? error.message : 'Failed to fetch balance');
    }
  });
}