import type { WalletBindingRecord } from './wallet-binding.types';
import type { WalletBindingRepository } from './wallet-binding.types';

export class WalletBindingRepositoryImpl implements WalletBindingRepository {
  private storage = new Map<string, WalletBindingRecord>();

  async save(record: WalletBindingRecord): Promise<void> {
    this.storage.set(record.bindingId, record);
  }

  async get(bindingId: string): Promise<WalletBindingRecord | undefined> {
    return this.storage.get(bindingId);
  }

  async findByDid(did: string): Promise<WalletBindingRecord[]> {
    return Array.from(this.storage.values()).filter((r) => r.did === did);
  }

  async findByAddress(address: string): Promise<WalletBindingRecord[]> {
    return Array.from(this.storage.values()).filter((r) => r.address.toLowerCase() === address.toLowerCase());
  }

  async findByDidAndAddress(did: string, address: string): Promise<WalletBindingRecord | undefined> {
    return Array.from(this.storage.values()).find(
      (r) => r.did === did && r.address.toLowerCase() === address.toLowerCase(),
    );
  }

  async update(record: WalletBindingRecord): Promise<void> {
    this.storage.set(record.bindingId, record);
  }

  async delete(bindingId: string): Promise<void> {
    this.storage.delete(bindingId);
  }

  async revokeByDid(did: string): Promise<void> {
    for (const [bindingId, record] of this.storage.entries()) {
      if (record.did === did && record.status !== 'revoked') {
        const revokedRecord: WalletBindingRecord = {
          ...record,
          status: 'revoked',
          revokedAt: Date.now(),
          updatedAt: Date.now(),
        };
        this.storage.set(bindingId, revokedRecord);
      }
    }
  }

  async getAll(): Promise<WalletBindingRecord[]> {
    return Array.from(this.storage.values());
  }
}