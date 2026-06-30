import type { DomainBlacklistEntry } from './security.types';
import { KNOWN_PHISHING_DOMAINS } from './default-security-rules';

export class DomainBlacklistService {
  private entries = new Map<string, DomainBlacklistEntry>();

  constructor() {
    this.loadDefaultBlacklist();
  }

  private loadDefaultBlacklist(): void {
    KNOWN_PHISHING_DOMAINS.forEach((hostname, index) => {
      this.entries.set(hostname, {
        entryId: `phishing_${index}`,
        hostname,
        reason: 'Known phishing domain',
        severity: 'critical',
        blockedAt: Date.now(),
      });
    });
  }

  async add(entry: Omit<DomainBlacklistEntry, 'entryId' | 'blockedAt'>): Promise<DomainBlacklistEntry> {
    const newEntry: DomainBlacklistEntry = {
      ...entry,
      entryId: `entry_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      blockedAt: Date.now(),
    };
    this.entries.set(entry.hostname, newEntry);
    return newEntry;
  }

  async get(hostname: string): Promise<DomainBlacklistEntry | undefined> {
    return this.entries.get(hostname);
  }

  async getAll(): Promise<DomainBlacklistEntry[]> {
    return Array.from(this.entries.values());
  }

  async remove(hostname: string): Promise<void> {
    this.entries.delete(hostname);
  }

  async isBlocked(hostname: string): Promise<{ blocked: boolean; entry?: DomainBlacklistEntry }> {
    const entry = this.entries.get(hostname);
    if (entry) {
      if (entry.expiresAt && entry.expiresAt < Date.now()) {
        this.entries.delete(hostname);
        return { blocked: false };
      }
      return { blocked: true, entry };
    }
    return { blocked: false };
  }

  async matchesPattern(hostname: string): Promise<{ matched: boolean; entries: DomainBlacklistEntry[] }> {
    const matched: DomainBlacklistEntry[] = [];
    for (const entry of this.entries.values()) {
      if (entry.pattern) {
        const regex = new RegExp(entry.pattern, 'i');
        if (regex.test(hostname)) {
          matched.push(entry);
        }
      }
    }
    return { matched: matched.length > 0, entries: matched };
  }

  async clear(): Promise<void> {
    this.entries.clear();
    this.loadDefaultBlacklist();
  }
}