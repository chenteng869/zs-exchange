import { NextRequest } from 'next/server';
import { success, badRequest } from '@/lib/api/response';
import { requireAuth, AuthContext } from '@/lib/api/auth';
import { SolanaAdapter, isValidSolanaAddress } from '@/lib/wallet/chains/solana-adapter';

const adapter = new SolanaAdapter();

export async function POST(req: NextRequest) {
  return requireAuth(req, async (ctx: AuthContext) => {
    const body = await req.json();
    const { from, to, value, chain = 'mainnet' } = body;

    if (!from || !to || !value) {
      return badRequest('From, to, and value are required');
    }

    if (!isValidSolanaAddress(from)) {
      return badRequest('Invalid from address');
    }

    if (!isValidSolanaAddress(to)) {
      return badRequest('Invalid to address');
    }

    try {
      adapter.setChain(chain);
      
      const tx = await adapter.buildTransfer({
        from,
        to,
        value: String(value),
      });

      return success({
        from,
        to,
        value,
        chain,
        fee: tx.feeFormatted,
        rawFee: tx.fee,
        serializedTransaction: tx.serializedTransaction,
        recentBlockhash: tx.extra?.recentBlockhash,
        lastValidBlockHeight: tx.extra?.lastValidBlockHeight,
      });
    } catch (error) {
      return badRequest(error instanceof Error ? error.message : 'Failed to build transfer');
    }
  });
}