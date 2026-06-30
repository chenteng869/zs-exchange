import { NextRequest } from 'next/server';
import { success, badRequest, forbidden, notFound } from '@/lib/api/response';
import { requireAuth, AuthContext } from '@/lib/api/auth';
import { DidSolService } from '@/modules/did-identity/core/methods/did-sol.service';
import { userDidRepository } from '@/repositories/user-did.repository';

const solService = new DidSolService();

export async function GET(req: NextRequest) {
  return requireAuth(req, async (ctx: AuthContext) => {
    try {
      const searchParams = req.nextUrl.searchParams;
      const requestedDid = searchParams.get('did');
      const record = requestedDid
        ? await userDidRepository.findByDid(requestedDid)
        : await userDidRepository.findByUserId(ctx.userId);

      if (!record) {
        return notFound('DID not found');
      }

      if (record.userId !== ctx.userId && ctx.user?.userType !== 'admin') {
        return forbidden('Cannot resolve DID owned by another user');
      }

      const document = record.document || await solService.resolve(record.did as any);

      return success({
        did: record.did,
        method: record.method,
        chainType: record.chainType,
        chainId: record.chainId,
        document,
        publicKey: record.publicKey,
        keyRef: record.keyRef,
        anchorStatus: record.anchorStatus,
        anchorTxHash: record.anchorTxHash,
        explorerUrl: solService.getExplorerUrl(record.publicKey),
      });
    } catch (error) {
      return badRequest(error instanceof Error ? error.message : 'Failed to resolve DID');
    }
  });
}
