import { DidMethod } from '@/modules/did-identity/shared/types';
import { DidKeyService } from '../methods/did-key.service';
import { DidPkhService } from '../methods/did-pkh.service';
import { DidWebService } from '../methods/did-web.service';
import { DidEthrService } from '../methods/did-ethr.service';

export interface DidMethodHandler {
  create: (...args: unknown[]) => Promise<{ did: string; document: unknown }>;
  resolve: (did: string) => Promise<unknown>;
  parse: (did: string) => Promise<unknown>;
  validate: (did: string) => Promise<boolean>;
}

export class DidMethodRegistryService {
  private handlers: Map<DidMethod, DidMethodHandler> = new Map();

  constructor() {
    this.registerDefaultMethods();
  }

  register(method: DidMethod, handler: DidMethodHandler): void {
    this.handlers.set(method, handler);
  }

  unregister(method: DidMethod): void {
    this.handlers.delete(method);
  }

  getHandler(method: DidMethod): DidMethodHandler | undefined {
    return this.handlers.get(method);
  }

  hasMethod(method: DidMethod): boolean {
    return this.handlers.has(method);
  }

  getAllMethods(): DidMethod[] {
    return Array.from(this.handlers.keys());
  }

  async createDid(method: DidMethod, ...args: unknown[]): Promise<{ did: string; document: unknown }> {
    const handler = this.getHandler(method);
    if (!handler) {
      throw new Error(`Unsupported DID method: ${method}`);
    }

    return handler.create(...args);
  }

  async resolveDid(method: DidMethod, did: string): Promise<unknown> {
    const handler = this.getHandler(method);
    if (!handler) {
      throw new Error(`Unsupported DID method: ${method}`);
    }

    return handler.resolve(did);
  }

  async parseDid(method: DidMethod, did: string): Promise<unknown> {
    const handler = this.getHandler(method);
    if (!handler) {
      throw new Error(`Unsupported DID method: ${method}`);
    }

    return handler.parse(did);
  }

  async validateDid(method: DidMethod, did: string): Promise<boolean> {
    const handler = this.getHandler(method);
    if (!handler) {
      return false;
    }

    return handler.validate(did);
  }

  private registerDefaultMethods(): void {
    const didKey = new DidKeyService();
    const didPkh = new DidPkhService();
    const didWeb = new DidWebService();
    const didEthr = new DidEthrService();

    this.register('key', {
      create: async (...args: unknown[]) => {
        const type = args[0] as string || 'Ed25519';
        if (type === 'secp256k1') {
          return didKey.generateSecp256k1();
        }
        return didKey.generateEd25519();
      },
      resolve: (did: string) => didKey.resolve(did),
      parse: async (did: string) => ({ method: 'key', id: did.split(':')[2] }),
      validate: async (did: string) => did.startsWith('did:key:'),
    });

    this.register('pkh', {
      create: (chainId: string, accountId: string) => didPkh.create(chainId, accountId),
      resolve: (did: string) => didPkh.resolve(did),
      parse: (did: string) => didPkh.parse(did),
      validate: (did: string) => didPkh.validate(did),
    });

    this.register('web', {
      create: (domain: string) => didWeb.create(domain),
      resolve: (did: string) => didWeb.resolve(did),
      parse: (did: string) => didWeb.parse(did),
      validate: (did: string) => didWeb.validate(did),
    });

    this.register('ethr', {
      create: (chainId: string, accountId: string) => didEthr.create(chainId, accountId),
      resolve: (did: string) => didEthr.resolve(did),
      parse: (did: string) => didEthr.parse(did),
      validate: (did: string) => didEthr.validate(did),
    });
  }
}