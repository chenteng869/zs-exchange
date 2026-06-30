import { Did, DidResolutionResult, DidDocument, DidMethod, DidParserResult } from '@/modules/did-identity/shared/types';
import { DidParserService } from './did-parser.service';
import { DidSolService } from '../methods/did-sol.service';
import { DidNotFoundError, DidResolutionFailedError, UnsupportedMethodError } from '@/modules/did-identity/shared/errors';

export class DidResolverService {
  private parser: DidParserService;
  private documents: Map<string, DidDocument> = new Map();
  private solService: DidSolService;

  constructor(parser: DidParserService) {
    this.parser = parser;
    this.solService = new DidSolService();
  }

  async resolve(did: Did): Promise<DidResolutionResult> {
    try {
      const parsed = this.parser.parse(did);

      switch (parsed.method) {
        case 'key':
          return this.resolveDidKey(did, parsed);
        case 'pkh':
          return this.resolveDidPkh(did, parsed);
        case 'web':
          return this.resolveDidWeb(did, parsed);
        case 'ethr':
          return this.resolveDidEthr(did, parsed);
        case 'sol':
          return this.resolveDidSol(did, parsed);
        default:
          throw new UnsupportedMethodError(parsed.method);
      }
    } catch (error) {
      return {
        didDocument: null,
        didDocumentMetadata: {
          error: 'internalError',
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
        },
        didResolutionMetadata: {
          contentType: 'application/did+json',
        },
      };
    }
  }

  async resolveDidKey(did: Did, parsed: DidParserResult): Promise<DidResolutionResult> {
    const cached = this.documents.get(did);
    if (cached) {
      return this.createSuccessResult(cached);
    }

    const id = parsed.id;
    if (!id.startsWith('z')) {
      throw new DidNotFoundError(did);
    }

    const document: DidDocument = {
      id: did,
      '@context': 'https://www.w3.org/ns/did/v1',
      verificationMethod: [
        {
          id: `${did}#key-0`,
          type: 'Ed25519VerificationKey2020',
          controller: did,
          publicKeyBase58: id.slice(1),
        },
      ],
      authentication: [`${did}#key-0`],
      assertionMethod: [`${did}#key-0`],
      keyAgreement: [],
      capabilityInvocation: [],
      capabilityDelegation: [],
      service: [],
    };

    this.documents.set(did, document);
    return this.createSuccessResult(document);
  }

  async resolveDidPkh(did: Did, parsed: DidParserResult): Promise<DidResolutionResult> {
    const cached = this.documents.get(did);
    if (cached) {
      return this.createSuccessResult(cached);
    }

    const [chain, account] = parsed.id.split(':');
    const blockchainAccountId = `${chain}:${account}`;

    const document: DidDocument = {
      id: did,
      '@context': 'https://www.w3.org/ns/did/v1',
      verificationMethod: [
        {
          id: `${did}#blockchainAccountId`,
          type: 'EcdsaSecp256k1RecoveryMethod2020',
          controller: did,
          blockchainAccountId,
        },
      ],
      authentication: [`${did}#blockchainAccountId`],
      assertionMethod: [],
      keyAgreement: [],
      capabilityInvocation: [],
      capabilityDelegation: [],
      service: [],
    };

    this.documents.set(did, document);
    return this.createSuccessResult(document);
  }

  async resolveDidWeb(did: Did, parsed: DidParserResult): Promise<DidResolutionResult> {
    const cached = this.documents.get(did);
    if (cached) {
      return this.createSuccessResult(cached);
    }

    try {
      const domain = parsed.id;
      const url = `https://${domain}/.well-known/did.json`;
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new DidNotFoundError(did);
      }

      const document = await response.json();
      this.documents.set(did, document);
      return this.createSuccessResult(document);
    } catch {
      throw new DidResolutionFailedError(did);
    }
  }

  async resolveDidEthr(did: Did, parsed: DidParserResult): Promise<DidResolutionResult> {
    const cached = this.documents.get(did);
    if (cached) {
      return this.createSuccessResult(cached);
    }

    const [chain, account] = parsed.id.split(':');
    const blockchainAccountId = `${chain}:${account}`;

    const document: DidDocument = {
      id: did,
      '@context': 'https://www.w3.org/ns/did/v1',
      verificationMethod: [
        {
          id: `${did}#controller`,
          type: 'EcdsaSecp256k1VerificationKey2019',
          controller: did,
          blockchainAccountId,
        },
      ],
      authentication: [`${did}#controller`],
      assertionMethod: [`${did}#controller`],
      keyAgreement: [],
      capabilityInvocation: [],
      capabilityDelegation: [],
      service: [],
    };

    this.documents.set(did, document);
    return this.createSuccessResult(document);
  }

  async resolveDidSol(did: Did, parsed: DidParserResult): Promise<DidResolutionResult> {
    const cached = this.documents.get(did);
    if (cached) {
      return this.createSuccessResult(cached);
    }

    const document = await this.solService.resolve(did);
    this.documents.set(did, document);
    return this.createSuccessResult(document);
  }

  async resolveRepresentation(did: Did, accept: string): Promise<DidResolutionResult> {
    const result = await this.resolve(did);
    
    return {
      ...result,
      didResolutionMetadata: {
        ...result.didResolutionMetadata,
        contentType: accept || 'application/did+json',
      },
    };
  }

  async dereference(did: Did): Promise<unknown> {
    const parsed = this.parser.parse(did);
    
    if (parsed.hasFragment) {
      const result = await this.resolve(did);
      if (result.didDocument) {
        const fragment = parsed.fragment;
        
        if (result.didDocument.verificationMethod) {
          const method = result.didDocument.verificationMethod.find(m => 
            m.id === `${did}` || m.id === `${parsed.did}#${fragment}`
          );
          if (method) return method;
        }
        
        if (result.didDocument.service) {
          const service = result.didDocument.service.find(s => 
            s.id === `${did}` || s.id === `${parsed.did}#${fragment}`
          );
          if (service) return service;
        }
      }
    }

    return await this.resolve(did);
  }

  registerDocument(did: Did, document: DidDocument): void {
    this.documents.set(did, document);
  }

  unregisterDocument(did: Did): void {
    this.documents.delete(did);
  }

  private createSuccessResult(document: DidDocument): DidResolutionResult {
    return {
      didDocument: document,
      didDocumentMetadata: {},
      didResolutionMetadata: {
        contentType: 'application/did+json',
      },
    };
  }
}
