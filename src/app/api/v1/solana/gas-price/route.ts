import { NextRequest } from 'next/server';
import { success, badRequest } from '@/lib/api/response';
import { requireAuth, AuthContext } from '@/lib/api/auth';
import { SolanaAdapter } from '@/lib/wallet/chains/solana-adapter';

const adapter = new SolanaAdapter();

export async function GET(req: NextRequest) {
  return requireAuth(req, async (ctx: AuthContext) => {
    const searchParams = req.nextUrl.searchParams;
    const chain = searchParams.get('chain') || 'mainnet';

    try {
      adapter.setChain(chain);
      const gasPrice = await adapter.getGasPrice();
      
      return success({
        chain,
        slow: {
          gasPrice: gasPrice.slow.gasPrice,
          formatted: `${gasPrice.slow.gasPrice} lamports`,
          estimatedTime: gasPrice.slow.estimatedTime,
        },
        normal: {
          gasPrice: gasPrice.normal.gasPrice,
          formatted: `${gasPrice.normal.gasPrice} lamports`,
          estimatedTime: gasPrice.normal.estimatedTime,
        },
        fast: {
          gasPrice: gasPrice.fast.gasPrice,
          formatted: `${gasPrice.fast.gasPrice} lamports`,
          estimatedTime: gasPrice.fast.estimatedTime,
        },
        updatedAt: gasPrice.updatedAt,
      });
    } catch (error) {
      return badRequest(error instanceof Error ? error.message : 'Failed to fetch gas price');
    }
  });
}