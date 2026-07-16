/**
 * Solana Indexer API - Job 详情 / 更新
 *
 * GET    /api/v1/solana/indexer/[jobId]  获取 Job
 * PATCH  /api/v1/solana/indexer/[jobId]  更新 Job 配置
 * DELETE /api/v1/solana/indexer/[jobId]  停止 Job（语义 = 软删除）
 *   备注：Indexer Job 状态机无 ARCHIVED。停止后 Job 仍可查询。
 *   如需彻底删除，请在数据库层操作（带 cascade 清理 batches）。
 */

import { NextRequest } from 'next/server';
import { success, badRequest, notFound, serverError } from '@/lib/api/response';
import { requireAuth, AuthContext } from '@/lib/api/auth';
import { createSolanaIndexerService } from '@/lib/solana';
import { SOLANA_CLUSTER, isValidSolanaCluster } from '@/lib/solana';
import { IndexerJobNotFoundError, IndexerJobConfigInvalidError } from '@/lib/solana';

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
      const job = await service.getJob(params.jobId);
      return success({ job });
    } catch (e: any) {
      if (e instanceof IndexerJobNotFoundError) {
        return notFound(e.message);
      }
      return serverError(e?.message ?? 'Failed to get indexer job');
    }
  });
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  return requireAuth(req, async (ctx: AuthContext) => {
    try {
      const body = await req.json().catch(() => ({}));
      const {
        batchSize,
        pollIntervalMs,
        confirmationDepth,
        maxRetries,
        retryDelayMs,
        reconTriggerThreshold,
        autoVerifyProgram,
        metadata,
        cluster,
      } = body ?? {};

      const targetCluster = cluster && isValidSolanaCluster(cluster) ? cluster : SOLANA_CLUSTER.DEVNET;
      const service = createSolanaIndexerService({ cluster: targetCluster as any });
      const updated = await service.updateJobConfig({
        jobId: params.jobId,
        batchSize,
        pollIntervalMs,
        confirmationDepth,
        maxRetries,
        retryDelayMs,
        reconTriggerThreshold,
        autoVerifyProgram,
        metadata,
        operatorId: ctx.userId,
      });
      return success({ job: updated });
    } catch (e: any) {
      if (e instanceof IndexerJobNotFoundError) {
        return notFound(e.message);
      }
      if (e instanceof IndexerJobConfigInvalidError) {
        return badRequest(e.message);
      }
      return serverError(e?.message ?? 'Failed to update indexer job');
    }
  });
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  return requireAuth(req, async (ctx: AuthContext) => {
    try {
      const sp = req.nextUrl.searchParams;
      const cluster = sp.get('cluster') ?? SOLANA_CLUSTER.DEVNET;
      if (!isValidSolanaCluster(cluster)) {
        return badRequest(`Invalid cluster: ${cluster}`);
      }
      const service = createSolanaIndexerService({ cluster: cluster as any });
      const result = await service.stopJob(params.jobId, ctx.userId);
      return success({ stopped: result });
    } catch (e: any) {
      if (e instanceof IndexerJobNotFoundError) {
        return notFound(e.message);
      }
      return serverError(e?.message ?? 'Failed to stop indexer job');
    }
  });
}
