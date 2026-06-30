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
      const slot = await adapter.getBlockNumber();
      const blockInfo = await adapter.getBlockInfo(slot);
      const epochInfo = await adapter.getEpochInfo();
      
      return success({
        slot,
        blockHash: blockInfo.blockHash,
        timestamp: blockInfo.timestamp,
        transactions: blockInfo.transactions,
        chain,
        epoch: epochInfo.epoch,
        slotIndex: epochInfo.slotIndex,
        slotsInEpoch: epochInfo.slotsInEpoch,
      });
    } catch (error) {
      return badRequest(error instanceof Error ? error.message : 'Failed to fetch latest block');
    }
  });
}