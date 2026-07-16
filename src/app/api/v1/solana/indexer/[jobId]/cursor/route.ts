/**
 * Solana Indexer API - Cursor（cursor 查询 + 回退）
 *
 * GET  /api/v1/solana/indexer/[jobId]/cursor            获取 cursor 快照
 * POST /api/v1/solana/indexer/[jobId]/cursor            回退 cursor
 *   body: { toSlot: number, cluster?: string }
 */

import { NextRequest } from 'next/server';
import { success, badRequest, notFound, serverError } from '@/lib/api/response';
import { requireAuth, AuthContext } from '@/lib/api/auth';
import { createSolanaIndexerService } from '@/lib/solana';
import { SOLANA_CLUSTER, isValidSolanaCluster } from '@/lib/solana';
import {
  IndexerJobNotFoundError,
  IndexerCursorInvalidError,
  IndexerCursorLostError,
  IndexerCursorBehindError,
  IndexerCursorRewindForbiddenError,
} from '@/lib/solana';

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
      const cursor = await service.getCursor(params.jobId);
      return success({ cursor });
    } catch (e: any) {
      if (e instanceof IndexerJobNotFoundError) return notFound(e.message);
      if (e instanceof IndexerCursorLostError) return notFound(e.message);
      return serverError(e?.message ?? 'Failed to get indexer cursor');
    }
  });
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  return requireAuth(req, async (ctx: AuthContext) => {
    try {
      const body = await req.json().catch(() => ({}));
      const { toSlot, cluster } = body ?? {};
      if (toSlot == null || !Number.isInteger(toSlot) || toSlot < 0) {
        return badRequest('toSlot must be a non-negative integer');
      }
      const targetCluster = cluster && isValidSolanaCluster(cluster) ? cluster : SOLANA_CLUSTER.DEVNET;
      const service = createSolanaIndexerService({ cluster: targetCluster as any });
      const result = await service.rewindCursor(params.jobId, toSlot);
      return success({ cursor: result });
    } catch (e: any) {
      if (e instanceof IndexerJobNotFoundError) return notFound(e.message);
      if (
        e instanceof IndexerCursorInvalidError ||
        e instanceof IndexerCursorBehindError ||
        e instanceof IndexerCursorRewindForbiddenError
      ) {
        return badRequest(e.message);
      }
      return serverError(e?.message ?? 'Failed to rewind indexer cursor');
    }
  });
}
