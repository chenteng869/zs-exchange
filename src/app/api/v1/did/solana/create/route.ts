import { NextRequest } from 'next/server';
import { success, badRequest } from '@/lib/api/response';
import { requireAuth, AuthContext } from '@/lib/api/auth';
import { DidSolService } from '@/modules/did-identity/core/methods/did-sol.service';
import { userDidRepository } from '@/repositories/user-did.repository';

const solService = new DidSolService();

export async function POST(req: NextRequest) {
  return requireAuth(req, async (ctx: AuthContext) => {
    try {
      const body = await req.json().catch(() => ({}));
      const cluster = String(body.cluster || process.env.DID_SOLANA_CLUSTER || 'devnet');

      const existing = await userDidRepository.findByUserId(ctx.userId);
      if (existing) {
        return success(toDidResponse(existing, solService));
      }

      const scopedSolService = new DidSolService({ cluster: cluster as any });
      const result = await scopedSolService.create();
      const record = await userDidRepository.create({
        userId: ctx.userId,
        did: result.did,
        method: 'did:sol',
        chainType: 'solana',
        chainId: cluster,
        publicKey: result.keyPair.publicKey,
        keyRef: `did-sol:${result.keyPair.publicKey}`,
        document: result.document,
        anchorStatus: 'pending',
      });

      return success({
        ...toDidResponse(record, scopedSolService),
        message: 'Solana DID created and bound to authenticated user.',
      });
    } catch (error) {
      return badRequest(error instanceof Error ? error.message : 'Failed to create Solana DID');
    }
  });
}

function toDidResponse(record: any, service: DidSolService) {
  return {
    did: record.did,
    method: record.method,
    chainType: record.chainType,
    chainId: record.chainId,
    document: record.document,
    publicKey: record.publicKey,
    keyRef: record.keyRef,
    anchorStatus: record.anchorStatus,
    anchorTxHash: record.anchorTxHash,
    explorerUrl: service.getExplorerUrl(record.publicKey),
  };
}
