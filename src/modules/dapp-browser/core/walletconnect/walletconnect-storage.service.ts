import type { WalletConnectSession, WalletConnectSessionStorage } from './walletconnect.types';

export class WalletConnectStorageService implements WalletConnectSessionStorage {
  private sessions = new Map<string, WalletConnectSession>();

  async save(session: WalletConnectSession): Promise<void> {
    this.sessions.set(session.sessionId, session);
  }

  async get(sessionId: string): Promise<WalletConnectSession | undefined> {
    return this.sessions.get(sessionId);
  }

  async getByTopic(topic: string): Promise<WalletConnectSession | undefined> {
    return Array.from(this.sessions.values()).find((session) => session.topic === topic);
  }

  async getAll(): Promise<WalletConnectSession[]> {
    return Array.from(this.sessions.values());
  }

  async update(session: WalletConnectSession): Promise<void> {
    this.sessions.set(session.sessionId, { ...session, updatedAt: Date.now() });
  }

  async delete(sessionId: string): Promise<void> {
    this.sessions.delete(sessionId);
  }

  async deleteExpired(): Promise<number> {
    const now = Date.now();
    let deleted = 0;
    for (const [id, session] of this.sessions) {
      if (session.expiresAt < now) {
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