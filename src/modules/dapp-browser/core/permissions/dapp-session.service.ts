import type { DappSessionRecord, DappPermissionType } from './permission.types';
import { DappSessionRepository } from './dapp-session.repository';
import { SessionNotFoundError, SessionExpiredError, PermissionDeniedError } from '../../shared/errors';

export interface DappSessionCreateOptions {
  sessionId: string;
  origin: string;
  hostname: string;
  dappId?: string;
  userId?: string;
  accountId: string;
  address: string;
  chainId: string;
  permissions: DappPermissionType[];
  source: 'webview' | 'walletconnect' | 'internal';
  metadata?: { name?: string; icon?: string; url?: string; description?: string };
  expiresAt?: number;
}

export class DappSessionService {
  constructor(private readonly repository: DappSessionRepository = new DappSessionRepository()) {}

  async create(options: DappSessionCreateOptions): Promise<DappSessionRecord> {
    return this.repository.create({
      sessionId: options.sessionId,
      origin: options.origin,
      hostname: options.hostname,
      dappId: options.dappId,
      userId: options.userId,
      accountId: options.accountId,
      address: options.address,
      chainId: options.chainId,
      permissions: options.permissions,
      source: options.source,
      metadata: options.metadata,
      expiresAt: options.expiresAt,
    });
  }

  async get(sessionId: string): Promise<DappSessionRecord> {
    return this.repository.get(sessionId);
  }

  async getActive(sessionId: string): Promise<DappSessionRecord> {
    return this.repository.getActive(sessionId);
  }

  async findByOrigin(origin: string, activeOnly: boolean = true): Promise<DappSessionRecord[]> {
    return this.repository.findByOrigin(origin, activeOnly);
  }

  async findByAccount(accountId: string, activeOnly: boolean = true): Promise<DappSessionRecord[]> {
    return this.repository.findByAccount(accountId, activeOnly);
  }

  async find(filter: { origin?: string; accountId?: string; chainId?: string; activeOnly?: boolean }): Promise<DappSessionRecord[]> {
    return this.repository.find(filter);
  }

  async hasActiveSession(origin: string, accountId: string): Promise<boolean> {
    const sessions = await this.findByOrigin(origin, true);
    return sessions.some((session) => session.accountId === accountId);
  }

  async addPermissions(sessionId: string, permissions: DappPermissionType[]): Promise<DappSessionRecord> {
    const session = await this.getActive(sessionId);
    const newPermissions = [...new Set([...session.permissions, ...permissions])];
    session.permissions = newPermissions;
    session.updatedAt = Date.now();
    return this.repository.update(session);
  }

  async removePermissions(sessionId: string, permissions: DappPermissionType[]): Promise<DappSessionRecord> {
    const session = await this.getActive(sessionId);
    session.permissions = session.permissions.filter((p) => !permissions.includes(p));
    session.updatedAt = Date.now();
    return this.repository.update(session);
  }

  async hasPermission(sessionId: string, permission: DappPermissionType): Promise<boolean> {
    const session = await this.getActive(sessionId);
    return session.permissions.includes(permission);
  }

  async requirePermission(sessionId: string, permission: DappPermissionType): Promise<void> {
    const has = await this.hasPermission(sessionId, permission);
    if (!has) {
      throw new PermissionDeniedError(permission, sessionId);
    }
  }

  async updateChainId(sessionId: string, chainId: string): Promise<DappSessionRecord> {
    const session = await this.getActive(sessionId);
    session.chainId = chainId;
    session.updatedAt = Date.now();
    return this.repository.update(session);
  }

  async updateAddress(sessionId: string, address: string): Promise<DappSessionRecord> {
    const session = await this.getActive(sessionId);
    session.address = address;
    session.updatedAt = Date.now();
    return this.repository.update(session);
  }

  async extend(sessionId: string, extendSeconds: number): Promise<DappSessionRecord> {
    return this.repository.extend(sessionId, extendSeconds);
  }

  async revoke(sessionId: string): Promise<void> {
    await this.repository.revoke(sessionId);
  }

  async revokeByOrigin(origin: string): Promise<void> {
    await this.repository.deleteByOrigin(origin);
  }

  async cleanupExpired(): Promise<number> {
    return this.repository.cleanupExpired();
  }

  async clear(): Promise<void> {
    await this.repository.clear();
  }
}