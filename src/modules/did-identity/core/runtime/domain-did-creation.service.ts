import { Did, DidMethod, DidCreationOptions, DidDocument } from '@/modules/did-identity/shared/types';
import { DidGeneratorService } from '../services/did-generator.service';
import { DidParserService } from '../services/did-parser.service';
import { DidDocumentBuilderService } from '../services/did-document-builder.service';
import { KeyManagerService } from '../services/key-manager.service';
import { DomainDidMethodPolicyService } from './domain-did-method-policy.service';
import { DidMethodRegistryService } from './did-method-registry.service';

export class DomainDidCreationService {
  private generator: DidGeneratorService;
  private policyService: DomainDidMethodPolicyService;
  private methodRegistry: DidMethodRegistryService;

  constructor(
    parser: DidParserService,
    documentBuilder: DidDocumentBuilderService,
    keyManager: KeyManagerService,
    policyService: DomainDidMethodPolicyService,
    methodRegistry: DidMethodRegistryService
  ) {
    this.generator = new DidGeneratorService(parser, documentBuilder, keyManager);
    this.policyService = policyService;
    this.methodRegistry = methodRegistry;
  }

  async createDidForDomain(
    domain: string,
    options?: Partial<DidCreationOptions>
  ): Promise<{ did: Did; document: DidDocument }> {
    const policy = this.policyService.getPolicy(domain);
    
    if (!policy) {
      throw new Error(`No policy found for domain: ${domain}`);
    }

    const method = options?.method || policy.preferredMethod;

    if (!policy.allowedMethods.includes(method)) {
      throw new Error(`Method ${method} is not allowed for domain ${domain}`);
    }

    if (policy.requireAnchor && !options?.chainId) {
      throw new Error(`Domain ${domain} requires anchor, but no chainId provided`);
    }

    const creationOptions: DidCreationOptions = {
      method,
      keyType: options?.keyType || 'Ed25519',
      chainId: options?.chainId,
      accountId: options?.accountId,
      domain: options?.domain || domain,
    };

    const result = await this.generator.createDid(creationOptions);

    return result;
  }

  async createDidWithPolicy(
    domain: string,
    method: DidMethod,
    options?: Omit<DidCreationOptions, 'method'>
  ): Promise<{ did: Did; document: DidDocument }> {
    const policy = this.policyService.getPolicy(domain);
    
    if (!policy) {
      throw new Error(`No policy found for domain: ${domain}`);
    }

    if (!policy.allowedMethods.includes(method)) {
      throw new Error(`Method ${method} is not allowed for domain ${domain}`);
    }

    const creationOptions: DidCreationOptions = {
      method,
      ...options,
      domain: options?.domain || domain,
    };

    return this.generator.createDid(creationOptions);
  }

  async createMultipleDids(
    domain: string,
    methods: DidMethod[]
  ): Promise<{ did: Did; document: DidDocument; method: DidMethod }[]> {
    const results: { did: Did; document: DidDocument; method: DidMethod }[] = [];

    for (const method of methods) {
      try {
        const result = await this.createDidWithPolicy(domain, method);
        results.push({ ...result, method });
      } catch {
        continue;
      }
    }

    return results;
  }

  async validateCreationOptions(
    domain: string,
    options: DidCreationOptions
  ): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];
    const policy = this.policyService.getPolicy(domain);

    if (!policy) {
      errors.push(`No policy found for domain: ${domain}`);
      return { valid: false, errors };
    }

    if (!policy.allowedMethods.includes(options.method)) {
      errors.push(`Method ${options.method} is not allowed for domain ${domain}`);
    }

    if (policy.requireAnchor && !options.chainId) {
      errors.push(`Domain ${domain} requires anchor, but no chainId provided`);
    }

    if (!this.methodRegistry.hasMethod(options.method)) {
      errors.push(`Method ${options.method} is not registered`);
    }

    return { valid: errors.length === 0, errors };
  }

  async getAvailableMethods(domain: string): Promise<DidMethod[]> {
    const policy = this.policyService.getPolicy(domain);
    if (!policy) {
      return [];
    }

    return policy.allowedMethods;
  }

  async getDefaultMethod(domain: string): Promise<DidMethod | undefined> {
    return this.policyService.getPreferredMethod(domain);
  }
}
