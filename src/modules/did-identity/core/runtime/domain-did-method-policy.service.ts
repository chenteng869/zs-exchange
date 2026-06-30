import { DidMethod } from '@/modules/did-identity/shared/types';

export interface DomainDidPolicy {
  domain: string;
  allowedMethods: DidMethod[];
  preferredMethod: DidMethod;
  maxKeyAge?: number;
  requireAnchor?: boolean;
}

export class DomainDidMethodPolicyService {
  private policies: Map<string, DomainDidPolicy> = new Map();

  constructor() {
    this.registerDefaultPolicies();
  }

  registerPolicy(domain: string, policy: DomainDidPolicy): void {
    this.policies.set(domain.toLowerCase(), policy);
  }

  unregisterPolicy(domain: string): void {
    this.policies.delete(domain.toLowerCase());
  }

  getPolicy(domain: string): DomainDidPolicy | undefined {
    const normalized = domain.toLowerCase();
    
    const exactPolicy = this.policies.get(normalized);
    if (exactPolicy) {
      return exactPolicy;
    }

    for (const [policyDomain, policy] of this.policies.entries()) {
      if (normalized.endsWith(`.${policyDomain}`)) {
        return policy;
      }
    }

    return this.policies.get('*');
  }

  isMethodAllowed(domain: string, method: DidMethod): boolean {
    const policy = this.getPolicy(domain);
    if (!policy) {
      return false;
    }

    return policy.allowedMethods.includes(method);
  }

  getPreferredMethod(domain: string): DidMethod | undefined {
    const policy = this.getPolicy(domain);
    return policy?.preferredMethod;
  }

  getMaxKeyAge(domain: string): number | undefined {
    const policy = this.getPolicy(domain);
    return policy?.maxKeyAge;
  }

  requiresAnchor(domain: string): boolean {
    const policy = this.getPolicy(domain);
    return policy?.requireAnchor ?? false;
  }

  getAllPolicies(): DomainDidPolicy[] {
    return Array.from(this.policies.values());
  }

  private registerDefaultPolicies(): void {
    this.policies.set('*', {
      domain: '*',
      allowedMethods: ['key', 'pkh', 'web', 'ethr'],
      preferredMethod: 'key',
      maxKeyAge: 365 * 24 * 60 * 60 * 1000,
      requireAnchor: false,
    });

    this.policies.set('example.com', {
      domain: 'example.com',
      allowedMethods: ['web', 'key'],
      preferredMethod: 'web',
      maxKeyAge: 90 * 24 * 60 * 60 * 1000,
      requireAnchor: true,
    });

    this.policies.set('ethereum.org', {
      domain: 'ethereum.org',
      allowedMethods: ['ethr', 'pkh'],
      preferredMethod: 'ethr',
      maxKeyAge: 30 * 24 * 60 * 60 * 1000,
      requireAnchor: true,
    });
  }
}