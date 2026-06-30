import { NextRequest } from 'next/server';
import { success, badRequest } from '@/lib/api/response';
import { requireAuth, AuthContext } from '@/lib/api/auth';
import { SolanaAdapter } from '@/lib/wallet/chains/solana-adapter';

const adapter = new SolanaAdapter();

export async function GET(req: NextRequest, { params }: { params: { blockNumber: string } }) {
  return requireAuth(req, async (ctx: AuthContext) => {
    const searchParams = req.nextUrl.searchParams;
    const chain = searchParams.get('chain') || 'mainnet';
    const blockNumber = parseInt(params.blockNumber, 10);

    if (isNaN(blockNumber)) {
      return badRequest('Invalid block number');
    }

    try {
      adapter.setChain(chain);
      const blockInfo = await adapter.getBlockInfo(blockNumber);
      
      return success({
        blockNumber: blockInfo.blockNumber,
        blockHash: blockInfo.blockHash,
        timestamp: blockInfo.timestamp,
        transactions: blockInfo.transactions,
        chain,
        extra: blockInfo.extra,
      });
    } catch (error) {
      return badRequest(error instanceof Error ? error.message : 'Failed to fetch block');
    }
  });
}