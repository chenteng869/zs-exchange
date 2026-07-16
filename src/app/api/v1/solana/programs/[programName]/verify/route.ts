/**
 * Solana Program API - 验证 Program
 *
 * POST /api/v1/solana/programs/[programName]/verify
 *   body: { cluster?: string }
 *
 * 触发 on-chain 验证（slot / executable / owner），并更新 solana_program_states。
 */

import { NextRequest } from 'next/server';
import { success, badRequest, notFound, serverError } from '@/lib/api/response';
import { requireAuth, AuthContext } from '@/lib/api/auth';
import { createSolanaIndexerService } from '@/lib/solana';
import { SOLANA_CLUSTER, isValidSolanaCluster } from '@/lib/solana';
import { SolanaRpcUnhealthyError, SolanaInvalidAddressError } from '@/lib/solana';

interface RouteParams {
  params: { programName: string };
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  return requireAuth(req, async (ctx: AuthContext) => {
    try {
      const body = await req.json().catch(() => ({}));
      const cluster = body?.cluster;
      const targetCluster = cluster && isValidSolanaCluster(cluster) ? cluster : SOLANA_CLUSTER.DEVNET;
      const service = createSolanaIndexerService({ cluster: targetCluster as any });

      const result = await service.verifyProgram({
        programName: params.programName,
        operatorId: ctx.userId,
      });
      return success({ result });
    } catch (e: any) {
      if (e instanceof SolanaInvalidAddressError) return badRequest(e.message);
      if (e instanceof SolanaRpcUnhealthyError) return serverError(e.message, 502);
      if (e?.code === 'NOT_FOUND' || /not found/i.test(e?.message ?? '')) {
        return notFound(e.message);
      }
      return serverError(e?.message ?? 'Failed to verify Solana program');
    }
  });
}
