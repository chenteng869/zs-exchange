import { Did, DidDocument, VerificationMethod } from '@/modules/did-identity/shared/types';

export class DidPkhService {
  async create(chainId: string, accountId: string): Promise<{ did: Did; document: DidDocument }> {
    const did = `did:pkh:${chainId}:${accountId}` as Did;
    
    const verificationMethod: VerificationMethod = {
      id: `${did}#blockchainAccountId`,
      type: 'EcdsaSecp256k1RecoveryMethod2020',
      controller: did,
      blockchainAccountId: `${chainId}:${accountId}`,
    };

    const document: DidDocument = {
      id: did,
      '@context': 'https://www.w3.org/ns/did/v1',
      verificationMethod: [verificationMethod],
      authentication: [`${did}#blockchainAccountId`],
      assertionMethod: [],
      keyAgreement: [],
      capabilityInvocation: [],
      capabilityDelegation: [],
      service: [],
    };

    return { did, document };
  }

  async resolve(did: Did): Promise<DidDocument> {
    const [, , chainId, accountId] = did.split(':');
    
    const verificationMethod: VerificationMethod = {
      id: `${did}#blockchainAccountId`,
      type: 'EcdsaSecp256k1RecoveryMethod2020',
      controller: did,
      blockchainAccountId: `${chainId}:${accountId}`,
    };

    return {
      id: did,
      '@context': 'https://www.w3.org/ns/did/v1',
      verificationMethod: [verificationMethod],
      authentication: [`${did}#blockchainAccountId`],
      assertionMethod: [],
      keyAgreement: [],
      capabilityInvocation: [],
      capabilityDelegation: [],
      service: [],
    };
  }

  async parse(did: Did): Promise<{ chainId: string; accountId: string }> {
    const parts = did.split(':');
    if (parts.length !== 4 || parts[0] !== 'did' || parts[1] !== 'pkh') {
      throw new Error('Invalid did:pkh format');
    }

    return {
      chainId: parts[2],
      accountId: parts[3],
    };
  }

  async isPkhDid(did: string): Promise<boolean> {
    return did.startsWith('did:pkh:');
  }

  async validate(did: Did): Promise<boolean> {
    try {
      const { chainId, accountId } = await this.parse(did);
      
      if (!chainId || !accountId) {
        return false;
      }

      if (!chainId.includes(':')) {
        return false;
      }

      if (!accountId.startsWith('0x')) {
        return false;
      }

      return true;
    } catch {
      return false;
    }
  }

  async fromAccount(chainId: string, accountId: string): Promise<Did> {
    return `did:pkh:${chainId}:${accountId}` as Did;
  }
}