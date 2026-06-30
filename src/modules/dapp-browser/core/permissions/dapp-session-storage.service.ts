import type { DappSessionRecord, DappSessionFilter, DappSessionStorage } from './permission.types';

export class DappSessionStorageService implements DappSessionStorage {
  private sessions = new Map<string, DappSessionRecord>();

  async save(session: DappSessionRecord): Promise<void> {
    this.sessions.set(session.sessionId, session);
  }

  async get(sessionId: string): Promise<DappSessionRecord | undefined> {
    return this.sessions.get(sessionId);
  }

  async find(filter: DappSessionFilter): Promise<DappSessionRecord[]> {
    return Array.from(this.sessions.values()).filter((session) => {
      if (filter.origin && session.origin !== filter.origin) return false;
      if (filter.accountId && session.accountId !== filter.accountId) return false;
      if (filter.chainId && session.chainId !== filter.chainId) return false;
      if (filter.source && session.source !== filter.source) return false;
      if (filter.activeOnly) {
        const now = Date.now();
        if (session.revokedAt) return false;
        if (session.expiresAt && session.expiresAt < now) return false;
      }
      return true;
    });
  }

  async update(session: DappSessionRecord): Promise<void> {
    this.sessions.set(session.sessionId, { ...session, updatedAt: Date.now() });
  }

  async delete(sessionId: string): Promise<void> {
    this.sessions.delete(sessionId);
  }

  async deleteByOrigin(origin: string): Promise<void> {
    for (const [id, session] of this.sessions) {
      if (session.origin === origin) {
        this.sessions.delete(id);
      }
    }
  }

  async deleteExpired(): Promise<number> {
    const now = Date.now();
    let deleted = 0;
    for (const [id, session] of this.sessions) {
      if (session.expiresAt && session.expiresAt < now) {
        this.sessions.delete(id);
        deleted++;
      }
    }
    return deleted;
  }

  async clear(): Promise<void> {
    this.sessions.clear();
  }
}