import { NextRequest } from 'next/server';
import { success, badRequest } from '@/lib/api/response';
import { SolanaAdapter } from '@/lib/wallet/chains/solana-adapter';

const adapter = new SolanaAdapter();

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const chain = searchParams.get('chain') || 'devnet';
    
    adapter.setChain(chain);
    
    const slot = await adapter.getBlockNumber();
    const epochInfo = await adapter.getEpochInfo();
    const gasPrice = await adapter.getGasPrice();
    
    return success({
      chain,
      slot,
      epoch: epochInfo.epoch,
      slotIndex: epochInfo.slotIndex,
      slotsInEpoch: epochInfo.slotsInEpoch,
      gasPrice: {
        slow: gasPrice.slow.gasPrice,
        normal: gasPrice.normal.gasPrice,
        fast: gasPrice.fast.gasPrice,
      },
      message: 'Solana API is working correctly with official SDK!',
    });
  } catch (error) {
    return badRequest(error instanceof Error ? error.message : 'Failed to test Solana API');
  }
}