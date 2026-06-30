import type { DappPermissionType, DappPermissionPolicy } from './permission.types';

const DEFAULT_POLICIES: Record<DappPermissionType, DappPermissionPolicy> = {
  accounts: {
    permission: 'accounts',
    defaultLevel: 'session',
    requiresUserConsent: true,
    autoGrant: false,
    maxDuration: 86400,
  },
  sign_message: {
    permission: 'sign_message',
    defaultLevel: 'one_time',
    requiresUserConsent: true,
    autoGrant: false,
    maxDuration: 300,
  },
  sign_typed_data: {
    permission: 'sign_typed_data',
    defaultLevel: 'one_time',
    requiresUserConsent: true,
    autoGrant: false,
    maxDuration: 300,
  },
  send_transaction: {
    permission: 'send_transaction',
    defaultLevel: 'one_time',
    requiresUserConsent: true,
    autoGrant: false,
    maxDuration: 60,
  },
  switch_chain: {
    permission: 'switch_chain',
    defaultLevel: 'session',
    requiresUserConsent: true,
    autoGrant: false,
    maxDuration: 86400,
  },
  add_chain: {
    permission: 'add_chain',
    defaultLevel: 'persistent',
    requiresUserConsent: true,
    autoGrant: false,
  },
  watch_asset: {
    permission: 'watch_asset',
    defaultLevel: 'persistent',
    requiresUserConsent: true,
    autoGrant: false,
  },
  walletconnect: {
    permission: 'walletconnect',
    defaultLevel: 'session',
    requiresUserConsent: true,
    autoGrant: false,
    maxDuration: 86400,
  },
};

export class PermissionPolicyService {
  private policies = new Map<DappPermissionType, DappPermissionPolicy>();

  constructor(policies: DappPermissionPolicy[] = []) {
    Object.values(DEFAULT_POLICIES).forEach((policy) => {
      this.policies.set(policy.permission, policy);
    });
    policies.forEach((policy) => {
      this.policies.set(policy.permission, {
        ...this.policies.get(policy.permission),
        ...policy,
      });
    });
  }

  get(permission: DappPermissionType): DappPermissionPolicy | undefined {
    return this.policies.get(permission);
  }

  getAll(): DappPermissionPolicy[] {
    return Array.from(this.policies.values());
  }

  requiresConsent(permission: DappPermissionType): boolean {
    const policy = this.get(permission);
    return policy?.requiresUserConsent ?? true;
  }

  isAutoGrant(permission: DappPermissionType): boolean {
    const policy = this.get(permission);
    return policy?.autoGrant ?? false;
  }

  getDefaultLevel(permission: DappPermissionType): 'session' | 'persistent' | 'one_time' {
    const policy = this.get(permission);
    return policy?.defaultLevel ?? 'session';
  }

  getMaxDuration(permission: DappPermissionType): number | undefined {
    const policy = this.get(permission);
    return policy?.maxDuration;
  }

  isOriginAllowed(permission: DappPermissionType, origin: string): boolean {
    const policy = this.get(permission);
    if (!policy) return false;
    if (policy.blockedOrigins?.includes(origin)) return false;
    if (policy.allowedOrigins && !policy.allowedOrigins.includes(origin)) return false;
    return true;
  }

  update(policy: DappPermissionPolicy): void {
    this.policies.set(policy.permission, {
      ...this.policies.get(policy.permission),
      ...policy,
    });
  }

  reset(): void {
    this.policies.clear();
    Object.values(DEFAULT_POLICIES).forEach((policy) => {
      this.policies.set(policy.permission, policy);
    });
  }
}