/**
 * Solana Indexer API - 恢复 Job
 *
 * POST /api/v1/solana/indexer/[jobId]/resume
 *   body: { cluster?: string }
 *
 * 状态转移：paused → running
 */

import { NextRequest } from 'next/server';
import { success, badRequest, notFound, serverError } from '@/lib/api/response';
import { requireAuth, AuthContext } from '@/lib/api/auth';
import { createSolanaIndexerService } from '@/lib/solana';
import { SOLANA_CLUSTER, isValidSolanaCluster } from '@/lib/solana';
import {
  IndexerJobNotFoundError,
  IndexerJobStatusTransitionForbiddenError,
} from '@/lib/solana';

interface RouteParams {
  params: { jobId: string };
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  return requireAuth(req, async (ctx: AuthContext) => {
    try {
      const body = await req.json().catch(() => ({}));
      const cluster = body?.cluster;
      const targetCluster = cluster && isValidSolanaCluster(cluster) ? cluster : SOLANA_CLUSTER.DEVNET;
      const service = createSolanaIndexerService({ cluster: targetCluster as any });
      const job = await service.resumeJob(params.jobId, ctx.userId);
      return success({ job });
    } catch (e: any) {
      if (e instanceof IndexerJobNotFoundError) return notFound(e.message);
      if (e instanceof IndexerJobStatusTransitionForbiddenError) return badRequest(e.message);
      return serverError(e?.message ?? 'Failed to resume indexer job');
    }
  });
}
