import { NextRequest } from 'next/server';
import { randomUUID } from 'node:crypto';
import { success, badRequest, forbidden, notFound } from '@/lib/api/response';
import { requireAuth, AuthContext } from '@/lib/api/auth';
import { DidSolService } from '@/modules/did-identity/core/methods/did-sol.service';
import { userDidRepository } from '@/repositories/user-did.repository';
import { createSolanaSignerProvider } from '@/lib/signer';

export async function POST(req: NextRequest) {
  return requireAuth(req, async (ctx: AuthContext) => {
    try {
      const body = await req.json();
      const { did, simulate, requestId, idempotencyKey, keyRef, signerProvider } = body;
      const legacyPrivateKey = body?.privateKey;
      const effectiveRequestId = String(requestId || randomUUID());

      if (!did) {
        return badRequest('DID is required');
      }

      if (process.env.NODE_ENV === 'production' && simulate) {
        return badRequest('DID anchor simulation is disabled in production');
      }

      if (process.env.NODE_ENV === 'production' && legacyPrivateKey) {
        return badRequest('Private key input is not allowed in production. Use keyRef + KMS signer provider.');
      }

      const record = await userDidRepository.findByDid(String(did));
      if (!record) {
        return notFound('DID not found');
      }

      if (record.userId !== ctx.userId && ctx.user?.userType !== 'admin') {
        return forbidden('Cannot anchor DID owned by another user');
      }

      if (process.env.NODE_ENV === 'production') {
        return badRequest('Production DID anchoring requires server-side custody/KMS keyRef support');
      }

      const solService = new DidSolService({
        cluster: record.chainId as any,
        simulate: Boolean(simulate),
      });
      const document = record.document || await solService.resolve(record.did as any);

      const anchorResult = await solService.anchorDid(record.did as any, document, {
        requestId: effectiveRequestId,
        idempotencyKey: idempotencyKey ? String(idempotencyKey) : undefined,
        keyRef: keyRef ? String(keyRef) : String(record.keyRef || ''),
        privateKey: legacyPrivateKey ? String(legacyPrivateKey) : undefined,
        signerProvider: createSolanaSignerProvider(signerProvider ? String(signerProvider) : undefined),
      });

      if (anchorResult.success) {
        const timestamp = anchorResult.blockTimestamp
          ? new Date(anchorResult.blockTimestamp * 1000)
          : new Date();
        const updated = await userDidRepository.updateAnchor(record.did, {
          anchorStatus: simulate ? 'simulated' : 'anchored',
          anchorTxHash: anchorResult.transactionHash,
          anchorBlockNo: anchorResult.blockNumber,
          anchorTimestamp: timestamp,
          lastAnchoredAt: new Date(),
        });

        return success({
          success: true,
          did: updated.did,
          transactionHash: anchorResult.transactionHash,
          blockNumber: anchorResult.blockNumber,
          blockTimestamp: anchorResult.blockTimestamp,
          explorerUrl: solService.getTransactionExplorerUrl(anchorResult.transactionHash),
          requestId: effectiveRequestId,
          idempotencyKey: idempotencyKey ? String(idempotencyKey) : null,
          simulate: Boolean(simulate),
          anchorStatus: updated.anchorStatus,
          message: simulate
            ? 'DID simulated anchored successfully.'
            : 'DID anchored to Solana blockchain successfully.',
        });
      }

      await userDidRepository.updateAnchor(record.did, {
        anchorStatus: 'failed',
      });
      return badRequest('Failed to anchor DID to Solana blockchain');
    } catch (error) {
      return badRequest(error instanceof Error ? error.message : 'Failed to anchor DID');
    }
  });
}
