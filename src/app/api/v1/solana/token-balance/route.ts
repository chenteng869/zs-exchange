import { NextRequest } from 'next/server';
import { success, badRequest } from '@/lib/api/response';
import { requireAuth, AuthContext } from '@/lib/api/auth';
import { SolanaAdapter, isValidSolanaAddress } from '@/lib/wallet/chains/solana-adapter';

const adapter = new SolanaAdapter();

export async function GET(req: NextRequest) {
  return requireAuth(req, async (ctx: AuthContext) => {
    const searchParams = req.nextUrl.searchParams;
    const address = searchParams.get('address');
    const mint = searchParams.get('mint');
    const chain = searchParams.get('chain') || 'mainnet';

    if (!address) {
      return badRequest('Address is required');
    }

    if (!isValidSolanaAddress(address)) {
      return badRequest('Invalid Solana address');
    }

    if (!mint) {
      return badRequest('Token mint address is required');
    }

    try {
      adapter.setChain(chain);
      const balance = await adapter.getTokenBalance(address, mint);
      
      return success({
        address,
        mint,
        chain,
        balance: balance.formatted,
        rawBalance: balance.balance,
        decimals: balance.decimals,
        symbol: balance.symbol,
        name: balance.name,
        standard: balance.standard,
        tokenAccount: balance.extra?.account,
      });
    } catch (error) {
      return badRequest(error instanceof Error ? error.message : 'Failed to fetch token balance');
    }
  });
}