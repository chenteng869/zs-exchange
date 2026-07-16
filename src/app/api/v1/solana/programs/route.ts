/**
 * Solana Program State API - 主路由
 *
 * 工业级 Solana-first 架构
 * 文档：docs/工业级最终方案：Solana-first 统一生态架构.md §5.8
 *
 * POST /api/v1/solana/programs  注册 Solana Program
 *   body: {
 *     programName, programId, version, upgradeable?, upgradeAuthority?,
 *     cluster?, metadata?, operatorId?
 *   }
 * GET  /api/v1/solana/programs  列出已注册 Program
 *   query: cluster?, page?, pageSize?
 *
 * 已注册 Program 写入 chain_assets (assetType='program') + solana_program_states。
 */

import { NextRequest } from 'next/server';
import { success, badRequest, serverError } from '@/lib/api/response';
import { requireAuth, AuthContext } from '@/lib/api/auth';
import { createSolanaIndexerService } from '@/lib/solana';
import { SOLANA_CLUSTER, isValidSolanaCluster, isValidBase58 } from '@/lib/solana';

export async function POST(req: NextRequest) {
  return requireAuth(req, async (ctx: AuthContext) => {
    try {
      const body = await req.json().catch(() => ({}));
      const {
        programName,
        programId,
        version,
        upgradeable,
        upgradeAuthority,
        cluster,
        metadata,
      } = body ?? {};

      if (!programName || typeof programName !== 'string') {
        return badRequest('programName is required');
      }
      if (!programId || !isValidBase58(programId)) {
        return badRequest('programId must be a valid Solana base58 address');
      }
      if (!version || typeof version !== 'string') {
        return badRequest('version is required (e.g. "1.0.0")');
      }
      if (upgradeAuthority && !isValidBase58(upgradeAuthority)) {
        return badRequest('upgradeAuthority must be a valid Solana base58 address');
      }

      const targetCluster = cluster && isValidSolanaCluster(cluster) ? cluster : SOLANA_CLUSTER.DEVNET;
      const service = createSolanaIndexerService({ cluster: targetCluster as any });

      const program = await service.registerProgram({
        programName,
        programId,
        version,
        upgradeable: Boolean(upgradeable),
        upgradeAuthority,
        cluster: targetCluster as any,
        metadata,
        operatorId: ctx.userId,
      });
      return success({ program }, 201);
    } catch (e: any) {
      return badRequest(e?.message ?? 'Failed to register Solana program');
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
      const page = Math.max(1, Number(sp.get('page') ?? 1));
      const pageSize = Math.min(100, Math.max(1, Number(sp.get('pageSize') ?? 20)));

      const service = createSolanaIndexerService({ cluster: cluster as any });
      const result = await service.listPrograms({ page, pageSize });
      return success(result);
    } catch (e: any) {
      return serverError(e?.message ?? 'Failed to list Solana programs');
    }
  });
}
