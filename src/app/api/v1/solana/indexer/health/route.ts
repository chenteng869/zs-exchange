/**
 * Solana Indexer API - 全局健康度
 *
 * GET /api/v1/solana/indexer/health?cluster=...
 *   聚合所有 Job 的健康度
 */

import { NextRequest } from 'next/server';
import { success, badRequest, serverError } from '@/lib/api/response';
import { requireAuth, AuthContext } from '@/lib/api/auth';
import { createSolanaIndexerService } from '@/lib/solana';
import { SOLANA_CLUSTER, isValidSolanaCluster } from '@/lib/solana';

export async function GET(req: NextRequest) {
  return requireAuth(req, async (ctx: AuthContext) => {
    try {
      const sp = req.nextUrl.searchParams;
      const cluster = sp.get('cluster') ?? SOLANA_CLUSTER.DEVNET;
      if (!isValidSolanaCluster(cluster)) {
        return badRequest(`Invalid cluster: ${cluster}`);
      }
      const service = createSolanaIndexerService({ cluster: cluster as any });
      const health = await service.globalHealth();
      return success({ health });
    } catch (e: any) {
      return serverError(e?.message ?? 'Failed to get indexer global health');
    }
  });
}
