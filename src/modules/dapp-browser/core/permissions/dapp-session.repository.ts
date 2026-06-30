import type { DappSessionRecord, DappSessionFilter } from './permission.types';
import { DappSessionStorageService } from './dapp-session-storage.service';
import { SessionNotFoundError, SessionExpiredError } from '../../shared/errors';

export class DappSessionRepository {
  constructor(private readonly storage: DappSessionStorageService = new DappSessionStorageService()) {}

  async create(session: Omit<DappSessionRecord, 'connectedAt' | 'updatedAt'>): Promise<DappSessionRecord> {
    const now = Date.now();
    const record: DappSessionRecord = {
      ...session,
      connectedAt: now,
      updatedAt: now,
    };
    await this.storage.save(record);
    return record;
  }

  async get(sessionId: string): Promise<DappSessionRecord> {
    const session = await this.storage.get(sessionId);
    if (!session) {
      throw new SessionNotFoundError(sessionId);
    }
    return session;
  }

  async getActive(sessionId: string): Promise<DappSessionRecord> {
    const session = await this.get(sessionId);
    const now = Date.now();
    if (session.revokedAt) {
      throw new SessionExpiredError(sessionId);
    }
    if (session.expiresAt && session.expiresAt < now) {
      throw new SessionExpiredError(sessionId);
    }
    return session;
  }

  async find(filter: DappSessionFilter): Promise<DappSessionRecord[]> {
    return this.storage.find(filter);
  }

  async findByOrigin(origin: string, activeOnly: boolean = true): Promise<DappSessionRecord[]> {
    return this.storage.find({ origin, activeOnly });
  }

  async findByAccount(accountId: string, activeOnly: boolean = true): Promise<DappSessionRecord[]> {
    return this.storage.find({ accountId, activeOnly });
  }

  async update(session: DappSessionRecord): Promise<DappSessionRecord> {
    await this.storage.update(session);
    return session;
  }

  async revoke(sessionId: string): Promise<void> {
    const session = await this.get(sessionId);
    session.revokedAt = Date.now();
    await this.storage.update(session);
  }

  async extend(sessionId: string, extendSeconds: number): Promise<DappSessionRecord> {
    const session = await this.getActive(sessionId);
    const now = Date.now();
    session.expiresAt = now + extendSeconds * 1000;
    session.updatedAt = now;
    await this.storage.update(session);
    return session;
  }

  async delete(sessionId: string): Promise<void> {
    await this.storage.delete(sessionId);
  }

  async deleteByOrigin(origin: string): Promise<void> {
    await this.storage.deleteByOrigin(origin);
  }

  async cleanupExpired(): Promise<number> {
    return this.storage.deleteExpired();
  }

  async clear(): Promise<void> {
    await this.storage.clear();
  }
}