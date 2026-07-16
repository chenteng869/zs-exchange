/**
 * Solana Indexer API - Batch 路由
 *
 * POST /api/v1/solana/indexer/[jobId]/batches  执行一次 batch
 *   body: { fromSlot: number, toSlot: number, force?: boolean, cluster?: string }
 * GET  /api/v1/solana/indexer/[jobId]/batches  列出该 Job 的 batch
 */

import { NextRequest } from 'next/server';
import { success, badRequest, notFound, serverError } from '@/lib/api/response';
import { requireAuth, AuthContext } from '@/lib/api/auth';
import { createSolanaIndexerService } from '@/lib/solana';
import { SOLANA_CLUSTER, isValidSolanaCluster } from '@/lib/solana';
import {
  IndexerJobNotFoundError,
  IndexerBatchInvalidRangeError,
  IndexerBatchTooLargeError,
  IndexerBatchFetchFailedError,
  IndexerCursorInvalidError,
  IndexerRpcUnhealthyError,
} from '@/lib/solana';

interface RouteParams {
  params: { jobId: string };
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  return requireAuth(req, async (ctx: AuthContext) => {
    try {
      const body = await req.json().catch(() => ({}));
      const { fromSlot, toSlot, force, cluster } = body ?? {};

      if (fromSlot == null || toSlot == null) {
        return badRequest('fromSlot and toSlot are required');
      }
      if (!Number.isInteger(fromSlot) || fromSlot < 0) {
        return badRequest('fromSlot must be a non-negative integer');
      }
      if (!Number.isInteger(toSlot) || toSlot < 0) {
        return badRequest('toSlot must be a non-negative integer');
      }
      if (toSlot < fromSlot) {
        return badRequest('toSlot must be >= fromSlot');
      }

      const targetCluster = cluster && isValidSolanaCluster(cluster) ? cluster : SOLANA_CLUSTER.DEVNET;
      const service = createSolanaIndexerService({ cluster: targetCluster as any });

      const result = await service.runBatch({
        jobId: params.jobId,
        fromSlot,
        toSlot,
        force: Boolean(force),
        operatorId: ctx.userId,
      });
      return success(result);
    } catch (e: any) {
      if (e instanceof IndexerJobNotFoundError) return notFound(e.message);
      if (
        e instanceof IndexerBatchInvalidRangeError ||
        e instanceof IndexerBatchTooLargeError ||
        e instanceof IndexerCursorInvalidError ||
        e instanceof IndexerRpcUnhealthyError
      ) {
        return badRequest(e.message);
      }
      if (e instanceof IndexerBatchFetchFailedError) {
        return serverError(e.message, 502);
      }
      return serverError(e?.message ?? 'Failed to run indexer batch');
    }
  });
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  return requireAuth(req, async (ctx: AuthContext) => {
    try {
      const sp = req.nextUrl.searchParams;
      const cluster = sp.get('cluster') ?? SOLANA_CLUSTER.DEVNET;
      if (!isValidSolanaCluster(cluster)) {
        return badRequest(`Invalid cluster: ${cluster}`);
      }
      const page = Math.max(1, Number(sp.get('page') ?? 1));
      const pageSize = Math.min(100, Math.max(1, Number(sp.get('pageSize') ?? 20)));
      const status = sp.get('status') ?? undefined;

      const service = createSolanaIndexerService({ cluster: cluster as any });
      const result = await service.listBatches({
        jobId: params.jobId,
        status: status as any,
        page,
        pageSize,
      });
      return success(result);
    } catch (e: any) {
      if (e instanceof IndexerJobNotFoundError) return notFound(e.message);
      return serverError(e?.message ?? 'Failed to list indexer batches');
    }
  });
}
