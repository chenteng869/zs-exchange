import { NextRequest } from 'next/server';
import { success, badRequest } from '@/lib/api/response';
import { requireAuth, AuthContext } from '@/lib/api/auth';
import { SolanaAdapter } from '@/lib/wallet/chains/solana-adapter';

const adapter = new SolanaAdapter();

export async function GET(req: NextRequest, { params }: { params: { txHash: string } }) {
  return requireAuth(req, async (ctx: AuthContext) => {
    const searchParams = req.nextUrl.searchParams;
    const chain = searchParams.get('chain') || 'mainnet';
    const txHash = params.txHash;

    if (!txHash) {
      return badRequest('Transaction hash is required');
    }

    try {
      adapter.setChain(chain);
      const txDetail = await adapter.getTransactionStatus(txHash);
      
      return success({
        hash: txDetail.hash,
        from: txDetail.from,
        to: txDetail.to,
        value: txDetail.valueFormatted,
        fee: txDetail.feeFormatted,
        status: txDetail.status,
        confirmations: txDetail.confirmations,
        blockNumber: txDetail.blockNumber,
        timestamp: txDetail.timestamp,
        chain,
        extra: txDetail.extra,
      });
    } catch (error) {
      return badRequest(error instanceof Error ? error.message : 'Failed to fetch transaction');
    }
  });
}