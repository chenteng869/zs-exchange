import type { DappPermissionType, DappPermissionGrant, DappPermissionCheckInput, DappPermissionCheckResult, DappPermissionLevel, DappPermissionStorage } from './permission.types';
import { PermissionPolicyService } from './permission-policy.service';
import { PermissionDeniedError, PermissionNotGrantedError } from '../../shared/errors';

export class DappPermissionStorageService implements DappPermissionStorage {
  private grants = new Map<string, DappPermissionGrant>();

  async save(grant: DappPermissionGrant): Promise<void> {
    this.grants.set(grant.grantId, grant);
  }

  async get(grantId: string): Promise<DappPermissionGrant | undefined> {
    return this.grants.get(grantId);
  }

  async findByOrigin(origin: string, accountId?: string): Promise<DappPermissionGrant[]> {
    return Array.from(this.grants.values()).filter((grant) => {
      if (grant.origin !== origin) return false;
      if (accountId && grant.accountId !== accountId) return false;
      return true;
    });
  }

  async findByPermission(permission: DappPermissionType, origin: string, accountId?: string): Promise<DappPermissionGrant[]> {
    return Array.from(this.grants.values()).filter((grant) => {
      if (grant.permission !== permission) return false;
      if (grant.origin !== origin) return false;
      if (accountId && grant.accountId !== accountId) return false;
      return true;
    });
  }

  async update(grant: DappPermissionGrant): Promise<void> {
    this.grants.set(grant.grantId, grant);
  }

  async revoke(grantId: string): Promise<void> {
    const grant = await this.get(grantId);
    if (grant) {
      grant.revokedAt = Date.now();
      this.grants.set(grantId, grant);
    }
  }

  async revokeByOrigin(origin: string): Promise<void> {
    for (const [id, grant] of this.grants) {
      if (grant.origin === origin) {
        grant.revokedAt = Date.now();
        this.grants.set(id, grant);
      }
    }
  }

  async deleteExpired(): Promise<number> {
    const now = Date.now();
    let deleted = 0;
    for (const [id, grant] of this.grants) {
      if (grant.expiresAt && grant.expiresAt < now) {
        this.grants.delete(id);
        deleted++;
      }
    }
    return deleted;
  }

  async clear(): Promise<void> {
    this.grants.clear();
  }
}

export interface DappPermissionGrantOptions {
  origin: string;
  accountId: string;
  chainId: string;
  permissions: DappPermissionType[];
  level?: DappPermissionLevel;
  expiresAt?: number;
}

export class DappPermissionService {
  constructor(
    private readonly storage: DappPermissionStorage = new DappPermissionStorageService(),
    private readonly policyService: PermissionPolicyService = new PermissionPolicyService(),
  ) {}

  async grant(options: DappPermissionGrantOptions): Promise<DappPermissionGrant[]> {
    const grants: DappPermissionGrant[] = [];
    const now = Date.now();

    for (const permission of options.permissions) {
      const policy = this.policyService.get(permission);
      if (!policy) {
        throw new PermissionDeniedError(permission, options.origin);
      }

      if (!this.policyService.isOriginAllowed(permission, options.origin)) {
        throw new PermissionDeniedError(permission, options.origin);
      }

      const level = options.level ?? policy.defaultLevel;
      const duration = options.expiresAt ? undefined : policy.maxDuration;
      const expiresAt = options.expiresAt ?? (duration ? now + duration * 1000 : undefined);

      const existingGrants = await this.storage.findByPermission(permission, options.origin, options.accountId);
      for (const existing of existingGrants) {
        await this.storage.revoke(existing.grantId);
      }

      const grant: DappPermissionGrant = {
        grantId: `grant_${now}_${Math.random().toString(36).slice(2, 9)}`,
        origin: options.origin,
        accountId: options.accountId,
        chainId: options.chainId,
        permission,
        level,
        grantedAt: now,
        expiresAt,
      };

      await this.storage.save(grant);
      grants.push(grant);
    }

    return grants;
  }

  async check(input: DappPermissionCheckInput): Promise<DappPermissionCheckResult> {
    const { origin, permission, accountId, chainId } = input;

    const policy = this.policyService.get(permission);
    if (!policy) {
      return { allowed: false, permission, message: 'Permission not supported' };
    }

    if (!this.policyService.isOriginAllowed(permission, origin)) {
      return { allowed: false, permission, message: 'Origin not allowed' };
    }

    const grants = await this.storage.findByPermission(permission, origin, accountId);
    const now = Date.now();

    const activeGrant = grants.find((grant) => {
      if (grant.revokedAt) return false;
      if (grant.expiresAt && grant.expiresAt < now) return false;
      if (grant.chainId !== chainId) return false;
      return true;
    });

    if (activeGrant) {
      return {
        allowed: true,
        permission: activeGrant.permission,
        level: activeGrant.level,
        grantedAt: activeGrant.grantedAt,
        expiresAt: activeGrant.expiresAt,
      };
    }

    if (this.policyService.isAutoGrant(permission)) {
      await this.grant({ origin, accountId, chainId, permissions: [permission] });
      return {
        allowed: true,
        permission,
        level: policy.defaultLevel,
        grantedAt: now,
        expiresAt: policy.maxDuration ? now + policy.maxDuration * 1000 : undefined,
      };
    }

    return {
      allowed: false,
      permission,
      message: 'Permission not granted',
    };
  }

  async require(input: DappPermissionCheckInput): Promise<DappPermissionCheckResult> {
    const result = await this.check(input);
    if (!result.allowed) {
      throw new PermissionNotGrantedError(input.permission, input.origin);
    }
    return result;
  }

  async requiresConsent(permission: DappPermissionType, origin: string): Promise<boolean> {
    if (!this.policyService.isOriginAllowed(permission, origin)) {
      return true;
    }
    return this.policyService.requiresConsent(permission);
  }

  async getGrants(origin: string, accountId?: string): Promise<DappPermissionGrant[]> {
    return this.storage.findByOrigin(origin, accountId);
  }

  async revoke(grantId: string): Promise<void> {
    await this.storage.revoke(grantId);
  }

  async revokeByOrigin(origin: string): Promise<void> {
    await this.storage.revokeByOrigin(origin);
  }

  async revokePermissions(origin: string, accountId: string, permissions: DappPermissionType[]): Promise<void> {
    for (const permission of permissions) {
      const grants = await this.storage.findByPermission(permission, origin, accountId);
      for (const grant of grants) {
        await this.storage.revoke(grant.grantId);
      }
    }
  }

  async cleanupExpired(): Promise<number> {
    return this.storage.deleteExpired();
  }

  async clear(): Promise<void> {
    await this.storage.clear();
  }
}