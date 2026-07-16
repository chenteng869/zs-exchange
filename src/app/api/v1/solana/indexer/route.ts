/**
 * Solana Indexer API - 主路由
 *
 * 工业级 Solana-first 架构
 * 文档：docs/工业级最终方案：Solana-first 统一生态架构.md §5.8
 *
 * POST /api/v1/solana/indexer  创建 Indexer Job
 * GET  /api/v1/solana/indexer  列出 Indexer Jobs（分页 + 过滤）
 */

import { NextRequest } from 'next/server';
import { success, badRequest, serverError } from '@/lib/api/response';
import { requireAuth, AuthContext } from '@/lib/api/auth';
import { createSolanaIndexerService } from '@/lib/solana';
import { SOLANA_CLUSTER, isValidSolanaCluster } from '@/lib/solana';
import {
  INDEXER_CURSOR_MODE,
  INDEXER_RETRY_POLICY,
  INDEXER_PROGRAM_CATEGORY,
  INDEXER_JOB_STATUS,
  isValidIndexerCursorMode,
  isValidIndexerRetryPolicy,
  isValidIndexerProgramCategory,
  isValidIndexerJobStatus,
} from '@/lib/solana';
import { IndexerJobNameInvalidError, IndexerJobConfigInvalidError, IndexerJobDuplicateError } from '@/lib/solana';

export async function POST(req: NextRequest) {
  return requireAuth(req, async (ctx: AuthContext) => {
    try {
      const body = await req.json().catch(() => ({}));
      const {
        jobName,
        cursorMode,
        fromSlot,
        batchSize,
        pollIntervalMs,
        confirmationDepth,
        retryPolicy,
        maxRetries,
        retryDelayMs,
        watchPrograms,
        watchAccounts,
        businessType,
        reconTriggerThreshold,
        autoVerifyProgram,
        enabledCategories,
        metadata,
        cluster,
      } = body ?? {};

      if (!jobName || typeof jobName !== 'string') {
        return badRequest('jobName is required');
      }
      if (cursorMode && !isValidIndexerCursorMode(cursorMode)) {
        return badRequest(`Invalid cursorMode: ${cursorMode}`);
      }
      if (retryPolicy && !isValidIndexerRetryPolicy(retryPolicy)) {
        return badRequest(`Invalid retryPolicy: ${retryPolicy}`);
      }
      if (enabledCategories && Array.isArray(enabledCategories)) {
        for (const c of enabledCategories) {
          if (!isValidIndexerProgramCategory(c)) {
            return badRequest(`Invalid enabledCategories entry: ${c}`);
          }
        }
      }
      const targetCluster = cluster && isValidSolanaCluster(cluster) ? cluster : SOLANA_CLUSTER.DEVNET;

      const service = createSolanaIndexerService({ cluster: targetCluster });
      const job = await service.createJob({
        jobName,
        cursorMode,
        fromSlot,
        batchSize,
        pollIntervalMs,
        confirmationDepth,
        retryPolicy,
        maxRetries,
        retryDelayMs,
        watchPrograms,
        watchAccounts,
        businessType,
        reconTriggerThreshold,
        autoVerifyProgram,
        enabledCategories,
        metadata,
        operatorId: ctx.userId,
      });

      return success({ job }, 201);
    } catch (e: any) {
      if (
        e instanceof IndexerJobNameInvalidError ||
        e instanceof IndexerJobConfigInvalidError ||
        e instanceof IndexerJobDuplicateError
      ) {
        return badRequest(e.message);
      }
      return serverError(e?.message ?? 'Failed to create indexer job');
    }
  });
}

export async function GET(req: NextRequest) {
  return requireAuth(req, async (ctx: AuthContext) => {
    try {
      const sp = req.nextUrl.searchParams;
      const cluster = sp.get('cluster') ?? SOLANA_CLUSTER.DEVNET;
      if (!isValidSolanaCluster(cluster)) {
        return badRequest(`Invalid cluster: ${cluster}`);
      }
      const status = sp.get('status');
      if (status && !isValidIndexerJobStatus(status)) {
        return badRequest(`Invalid status: ${status}`);
      }
      const businessType = sp.get('businessType') ?? undefined;
      const page = Math.max(1, Number(sp.get('page') ?? 1));
      const pageSize = Math.min(100, Math.max(1, Number(sp.get('pageSize') ?? 20)));

      const service = createSolanaIndexerService({ cluster: cluster as any });
      const result = await service.listJobs({
        status: status as any,
        businessType,
        page,
        pageSize,
      });

      return success(result);
    } catch (e: any) {
      return serverError(e?.message ?? 'Failed to list indexer jobs');
    }
  });
}
