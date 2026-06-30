import { Did, DidDocument } from '@/modules/did-identity/shared/types';

export class DidWebService {
  async create(domain: string): Promise<{ did: Did; document: DidDocument }> {
    const normalizedDomain = domain.toLowerCase();
    const did = `did:web:${normalizedDomain}` as Did;
    
    const document: DidDocument = {
      id: did,
      '@context': 'https://www.w3.org/ns/did/v1',
      verificationMethod: [],
      authentication: [],
      assertionMethod: [],
      keyAgreement: [],
      capabilityInvocation: [],
      capabilityDelegation: [],
      service: [],
    };

    return { did, document };
  }

  async resolve(did: Did): Promise<DidDocument> {
    const [, , ...domainParts] = did.split(':');
    const domain = domainParts.join(':');
    
    const url = `https://${domain}/.well-known/did.json`;
    
    try {
      const response = await fetch(url);
      if (!response.ok) {
        return this.createDefaultDocument(did);
      }

      const document = await response.json();
      return document;
    } catch {
      return this.createDefaultDocument(did);
    }
  }

  async parse(did: Did): Promise<{ domain: string; path?: string }> {
    const parts = did.split(':');
    if (parts.length < 3 || parts[0] !== 'did' || parts[1] !== 'web') {
      throw new Error('Invalid did:web format');
    }

    const domain = parts.slice(2).join(':');
    
    const pathMatch = domain.match(/^(.*)\/(.*)$/);
    if (pathMatch) {
      return {
        domain: pathMatch[1],
        path: pathMatch[2],
      };
    }

    return { domain };
  }

  async isWebDid(did: string): Promise<boolean> {
    return did.startsWith('did:web:');
  }

  async validate(did: Did): Promise<boolean> {
    try {
      const { domain } = await this.parse(did);
      
      if (!domain) {
        return false;
      }

      const urlPattern = /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;
      return urlPattern.test(domain);
    } catch {
      return false;
    }
  }

  async fromDomain(domain: string): Promise<Did> {
    const normalizedDomain = domain.toLowerCase().replace(/^https?:\/\//, '');
    return `did:web:${normalizedDomain}` as Did;
  }

  async getDidDocumentUrl(did: Did): Promise<string> {
    const { domain, path } = await this.parse(did);
    
    if (path) {
      return `https://${domain}/.well-known/did.json/${path}`;
    }

    return `https://${domain}/.well-known/did.json`;
  }

  private createDefaultDocument(did: Did): DidDocument {
    return {
      id: did,
      '@context': 'https://www.w3.org/ns/did/v1',
      verificationMethod: [],
      authentication: [],
      assertionMethod: [],
      keyAgreement: [],
      capabilityInvocation: [],
      capabilityDelegation: [],
      service: [],
    };
  }
}