import type { WalletBindingChallenge } from './wallet-binding.types';
import type { WalletBindingChallengeRepository } from './wallet-binding.types';

export class WalletBindingChallengeRepositoryImpl implements WalletBindingChallengeRepository {
  private storage = new Map<string, WalletBindingChallenge>();

  async save(challenge: WalletBindingChallenge): Promise<void> {
    this.storage.set(challenge.challengeId, challenge);
  }

  async get(challengeId: string): Promise<WalletBindingChallenge | undefined> {
    return this.storage.get(challengeId);
  }

  async findByDid(did: string): Promise<WalletBindingChallenge[]> {
    return Array.from(this.storage.values()).filter((c) => c.did === did);
  }

  async findByAddress(address: string): Promise<WalletBindingChallenge[]> {
    return Array.from(this.storage.values()).filter((c) => c.address.toLowerCase() === address.toLowerCase());
  }

  async delete(challengeId: string): Promise<void> {
    this.storage.delete(challengeId);
  }

  async deleteExpired(): Promise<void> {
    const now = Date.now();
    for (const [challengeId, challenge] of this.storage.entries()) {
      if (challenge.expiresAt < now) {
        this.storage.delete(challengeId);
      }
    }
  }

  async clear(): Promise<void> {
    this.storage.clear();
  }
}