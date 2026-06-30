import { randomUUID } from 'node:crypto';
import { DidSolService } from '../src/modules/did-identity/core/methods/did-sol.service';
import { createSolanaSignerProvider } from '../src/lib/signer';

async function main() {
  const base = process.env.KMS_MOCK_BASE_URL || 'http://127.0.0.1:8787';
  const token = process.env.KMS_MOCK_TOKEN || 'dev-kms-token';

  const health = await fetch(`${base}/health`);
  if (!health.ok) {
    throw new Error(`KMS mock health check failed: ${health.status}`);
  }

  const seedService = new DidSolService({ cluster: 'devnet', simulate: true });
  const created = await seedService.create();
  const keyRef = `did-sol:${created.keyPair.publicKey}`;

  const registerRes = await fetch(`${base}/register`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${token}`,
      'x-request-id': randomUUID(),
    },
    body: JSON.stringify({
      keyRef,
      keyId: keyRef,
      privateKeyBase58: created.keyPair.privateKey,
    }),
  });

  if (!registerRes.ok) {
    const detail = await registerRes.text();
    throw new Error(`KMS mock register failed: ${registerRes.status} ${detail}`);
  }

  process.env.DID_SOLANA_SIGNER_PROVIDER = 'kms';
  process.env.DID_SOLANA_KMS_ENDPOINT = `${base}/resolve`;
  process.env.DID_SOLANA_KMS_AUTH_TOKEN = token;
  process.env.DID_SOLANA_KMS_TIMEOUT_MS = '8000';

  const service = new DidSolService({ cluster: 'devnet', simulate: true });
  const result = await service.anchorDid(created.did, created.document, {
    requestId: randomUUID(),
    keyRef,
    signerProvider: createSolanaSignerProvider('kms'),
    validateSignerInSimulate: true,
  });

  console.log(
    JSON.stringify(
      {
        success: result.success,
        did: created.did,
        keyRef,
        transactionHash: result.transactionHash,
        blockNumber: result.blockNumber,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
