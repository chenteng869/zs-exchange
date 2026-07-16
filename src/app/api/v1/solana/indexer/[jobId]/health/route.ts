/**
 * Solana Indexer API - 健康度
 *
 * GET /api/v1/solana/indexer/[jobId]/health
 *   query: cluster?
 *   返回 job 健康度 + 失败连续次数 + RPC 健康度
 *
 * GET /api/v1/solana/indexer/health?cluster=...
 *   不带 jobId：返回全局健康度（所有 Job 聚合）
 */

import { NextRequest } from 'next/server';
import { success, badRequest, serverError } from '@/lib/api/response';
import { requireAuth, AuthContext } from '@/lib/api/auth';
import { createSolanaIndexerService } from '@/lib/solana';
import { SOLANA_CLUSTER, isValidSolanaCluster } from '@/lib/solana';

interface RouteParams {
  params: { jobId: string };
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  return requireAuth(req, async (ctx: AuthContext) => {
    try {
      const sp = req.nextUrl.searchParams;
      const cluster = sp.get('cluster') ?? SOLANA_CLUSTER.DEVNET;
      if (!isValidSolanaCluster(cluster)) {
        return badRequest(`Invalid cluster: ${cluster}`);
      }
      const service = createSolanaIndexerService({ cluster: cluster as any });
      const health = await service.getHealth(params.jobId);
      return success({ health });
    } catch (e: any) {
      return serverError(e?.message ?? 'Failed to get indexer job health');
    }
  });
}
