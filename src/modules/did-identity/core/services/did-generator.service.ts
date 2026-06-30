import { Did, DidMethod, DidCreationOptions, DidDocument, VerificationMethod } from '@/modules/did-identity/shared/types';
import { DidParserService } from './did-parser.service';
import { DidDocumentBuilderService } from './did-document-builder.service';
import { KeyManagerService } from './key-manager.service';
import { DidSolService } from '../methods/did-sol.service';
import { UnsupportedMethodError, DidCreationFailedError } from '@/modules/did-identity/shared/errors';

export class DidGeneratorService {
  private parser: DidParserService;
  private documentBuilder: DidDocumentBuilderService;
  private keyManager: KeyManagerService;
  private solService: DidSolService;

  constructor(
    parser?: DidParserService, 
    documentBuilder?: DidDocumentBuilderService, 
    keyManager?: KeyManagerService
  ) {
    this.parser = parser || new DidParserService();
    this.documentBuilder = documentBuilder || new DidDocumentBuilderService(this.parser);
    this.keyManager = keyManager || new KeyManagerService();
    this.solService = new DidSolService();
  }

  async generate(did: string, options?: Partial<DidCreationOptions>): Promise<{ did: Did; document: DidDocument }> {
    const method = did.split(':')[1] as DidMethod;
    const creationOptions: DidCreationOptions = {
      method,
      ...options,
    } as DidCreationOptions;
    
    return this.createDid(creationOptions);
  }

  async createDid(options: DidCreationOptions): Promise<{ did: Did; document: DidDocument }> {
    switch (options.method) {
      case 'key':
        return this.createDidKey(options);
      case 'pkh':
        return this.createDidPkh(options);
      case 'web':
        return this.createDidWeb(options);
      case 'ethr':
        return this.createDidEthr(options);
      case 'sol':
        return this.createDidSol(options);
      default:
        throw new UnsupportedMethodError(options.method);
    }
  }

  async createDidKey(options: DidCreationOptions): Promise<{ did: Did; document: DidDocument }> {
    try {
      const keyType = options.keyType || 'Ed25519';
      const keyPair = await this.keyManager.generateKeyPair(keyType);

      const did = `did:key:z${keyPair.publicKeyBase58}` as Did;
      const verificationMethod: VerificationMethod = {
        id: `${did}#${keyPair.keyId}`,
        type: keyType === 'Ed25519' ? 'Ed25519VerificationKey2020' : 'EcdsaSecp256k1VerificationKey2019',
        controller: did,
        publicKeyBase58: keyPair.publicKeyBase58,
      };

      const document = this.documentBuilder.build(did, [verificationMethod]);
      this.documentBuilder.addVerificationRelationship(document, 'authentication', verificationMethod.id);
      this.documentBuilder.addVerificationRelationship(document, 'assertionMethod', verificationMethod.id);

      return { did, document };
    } catch (error) {
      throw new DidCreationFailedError('Failed to create did:key', error);
    }
  }

  async createDidPkh(options: DidCreationOptions): Promise<{ did: Did; document: DidDocument }> {
    try {
      const { chainId, accountId } = options;
      
      if (!chainId || !accountId) {
        throw new DidCreationFailedError('chainId and accountId are required for did:pkh');
      }

      const did = `did:pkh:${chainId}:${accountId}` as Did;
      const verificationMethod: VerificationMethod = {
        id: `${did}#blockchainAccountId`,
        type: 'EcdsaSecp256k1RecoveryMethod2020',
        controller: did,
        blockchainAccountId: `${chainId}:${accountId}`,
      };

      const document = this.documentBuilder.build(did, [verificationMethod]);
      this.documentBuilder.addVerificationRelationship(document, 'authentication', verificationMethod.id);

      return { did, document };
    } catch (error) {
      throw new DidCreationFailedError('Failed to create did:pkh', error);
    }
  }

  async createDidWeb(options: DidCreationOptions): Promise<{ did: Did; document: DidDocument }> {
    try {
      const { domain } = options;

      if (!domain) {
        throw new DidCreationFailedError('domain is required for did:web');
      }

      const normalizedDomain = domain.toLowerCase();
      const did = `did:web:${normalizedDomain}` as Did;

      const keyType = options.keyType || 'Ed25519';
      const keyPair = await this.keyManager.generateKeyPair(keyType);

      const verificationMethod: VerificationMethod = {
        id: `${did}#${keyPair.keyId}`,
        type: keyType === 'Ed25519' ? 'Ed25519VerificationKey2020' : 'EcdsaSecp256k1VerificationKey2019',
        controller: did,
        publicKeyBase58: keyPair.publicKeyBase58,
      };

      const document = this.documentBuilder.build(did, [verificationMethod]);
      this.documentBuilder.addVerificationRelationship(document, 'authentication', verificationMethod.id);
      this.documentBuilder.addVerificationRelationship(document, 'assertionMethod', verificationMethod.id);

      return { did, document };
    } catch (error) {
      throw new DidCreationFailedError('Failed to create did:web', error);
    }
  }

  async createDidEthr(options: DidCreationOptions): Promise<{ did: Did; document: DidDocument }> {
    try {
      const { chainId, accountId } = options;

      if (!chainId || !accountId) {
        throw new DidCreationFailedError('chainId and accountId are required for did:ethr');
      }

      const did = `did:ethr:${chainId}:${accountId}` as Did;
      const verificationMethod: VerificationMethod = {
        id: `${did}#controller`,
        type: 'EcdsaSecp256k1VerificationKey2019',
        controller: did,
        blockchainAccountId: `${chainId}:${accountId}`,
      };

      const document = this.documentBuilder.build(did, [verificationMethod]);
      this.documentBuilder.addVerificationRelationship(document, 'authentication', verificationMethod.id);
      this.documentBuilder.addVerificationRelationship(document, 'assertionMethod', verificationMethod.id);

      return { did, document };
    } catch (error) {
      throw new DidCreationFailedError('Failed to create did:ethr', error);
    }
  }

  async createDidSol(options: DidCreationOptions): Promise<{ did: Did; document: DidDocument }> {
    try {
      const result = await this.solService.create();
      
      return { did: result.did, document: result.document };
    } catch (error) {
      throw new DidCreationFailedError('Failed to create did:sol', error);
    }
  }

  async createDidFromKeyPair(keyPair: { type: string; publicKeyBase58: string }): Promise<{ did: Did; document: DidDocument }> {
    try {
      const did = `did:key:z${keyPair.publicKeyBase58}` as Did;
      const verificationMethod: VerificationMethod = {
        id: `${did}#primary`,
        type: keyPair.type === 'Ed25519' ? 'Ed25519VerificationKey2020' : 'EcdsaSecp256k1VerificationKey2019',
        controller: did,
        publicKeyBase58: keyPair.publicKeyBase58,
      };

      const document = this.documentBuilder.build(did, [verificationMethod]);
      this.documentBuilder.addVerificationRelationship(document, 'authentication', verificationMethod.id);

      return { did, document };
    } catch (error) {
      throw new DidCreationFailedError('Failed to create DID from key pair', error);
    }
  }
}
