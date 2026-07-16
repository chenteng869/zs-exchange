/**
 * Solana Indexer API - 启动 Job
 *
 * POST /api/v1/solana/indexer/[jobId]/start
 *   body: { fromSlot?: number, cluster?: string }
 *
 * 作用：把 Job 从 PENDING/STOPPED/FAILED 切到 RUNNING，拉取最新 slot 作为 cursor。
 */

import { NextRequest } from 'next/server';
import { success, badRequest, notFound, serverError } from '@/lib/api/response';
import { requireAuth, AuthContext } from '@/lib/api/auth';
import { createSolanaIndexerService } from '@/lib/solana';
import { SOLANA_CLUSTER, isValidSolanaCluster } from '@/lib/solana';
import {
  IndexerJobNotFoundError,
  IndexerJobAlreadyRunningError,
  IndexerJobStatusTransitionForbiddenError,
  IndexerRpcSlotFetchFailedError,
} from '@/lib/solana';

interface RouteParams {
  params: { jobId: string };
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  return requireAuth(req, async (ctx: AuthContext) => {
    try {
      const body = await req.json().catch(() => ({}));
      const { fromSlot, cluster } = body ?? {};
      if (fromSlot != null && (!Number.isInteger(fromSlot) || fromSlot < 0)) {
        return badRequest('fromSlot must be a non-negative integer');
      }
      const targetCluster = cluster && isValidSolanaCluster(cluster) ? cluster : SOLANA_CLUSTER.DEVNET;

      const service = createSolanaIndexerService({ cluster: targetCluster as any });
      const job = await service.startJob({
        jobId: params.jobId,
        fromSlot,
        operatorId: ctx.userId,
      });
      return success({ job });
    } catch (e: any) {
      if (e instanceof IndexerJobNotFoundError) {
        return notFound(e.message);
      }
      if (
        e instanceof IndexerJobAlreadyRunningError ||
        e instanceof IndexerJobStatusTransitionForbiddenError ||
        e instanceof IndexerRpcSlotFetchFailedError
      ) {
        return badRequest(e.message);
      }
      return serverError(e?.message ?? 'Failed to start indexer job');
    }
  });
}
