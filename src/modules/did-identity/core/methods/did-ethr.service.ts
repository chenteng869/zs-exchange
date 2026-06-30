import { Did, DidDocument, VerificationMethod } from '@/modules/did-identity/shared/types';

export class DidEthrService {
  async create(chainId: string, accountId: string): Promise<{ did: Did; document: DidDocument }> {
    const did = `did:ethr:${chainId}:${accountId}` as Did;
    
    const verificationMethod: VerificationMethod = {
      id: `${did}#controller`,
      type: 'EcdsaSecp256k1VerificationKey2019',
      controller: did,
      blockchainAccountId: `${chainId}:${accountId}`,
    };

    const document: DidDocument = {
      id: did,
      '@context': 'https://www.w3.org/ns/did/v1',
      verificationMethod: [verificationMethod],
      authentication: [`${did}#controller`],
      assertionMethod: [`${did}#controller`],
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
      id: `${did}#controller`,
      type: 'EcdsaSecp256k1VerificationKey2019',
      controller: did,
      blockchainAccountId: `${chainId}:${accountId}`,
    };

    return {
      id: did,
      '@context': 'https://www.w3.org/ns/did/v1',
      verificationMethod: [verificationMethod],
      authentication: [`${did}#controller`],
      assertionMethod: [`${did}#controller`],
      keyAgreement: [],
      capabilityInvocation: [],
      capabilityDelegation: [],
      service: [],
    };
  }

  async parse(did: Did): Promise<{ chainId: string; accountId: string }> {
    const parts = did.split(':');
    if (parts.length !== 4 || parts[0] !== 'did' || parts[1] !== 'ethr') {
      throw new Error('Invalid did:ethr format');
    }

    return {
      chainId: parts[2],
      accountId: parts[3],
    };
  }

  async isEthrDid(did: string): Promise<boolean> {
    return did.startsWith('did:ethr:');
  }

  async validate(did: Did): Promise<boolean> {
    try {
      const { chainId, accountId } = await this.parse(did);
      
      if (!chainId || !accountId) {
        return false;
      }

      if (!accountId.startsWith('0x')) {
        return false;
      }

      const hexPattern = /^0x[0-9a-fA-F]{40}$/;
      return hexPattern.test(accountId);
    } catch {
      return false;
    }
  }

  async fromAccount(chainId: string, accountId: string): Promise<Did> {
    return `did:ethr:${chainId}:${accountId}` as Did;
  }

  async getRegistryAddress(chainId: string): Promise<string> {
    const addresses: Record<string, string> = {
      '1': '0xdca7ef03e98e0dc2b855be647c39abe984fcf21b',
      '5': '0xdca7ef03e98e0dc2b855be647c39abe984fcf21b',
      '137': '0x2230ad29920D61A535759678191094b74271f373',
    };

    return addresses[chainId] || addresses['1'];
  }
}