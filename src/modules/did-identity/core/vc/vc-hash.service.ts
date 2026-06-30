import { keccak256 } from 'viem';

export class VcHashService {
  hashCredential(credential: unknown): string {
    const data = JSON.stringify(credential, this.sortKeys);
    return keccak256(new TextEncoder().encode(data));
  }

  hashString(data: string): string {
    return keccak256(new TextEncoder().encode(data));
  }

  hashBytes(data: Uint8Array): string {
    return keccak256(data);
  }

  generateCredentialId(prefix: string = 'credential'): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).slice(2, 10);
    return `${prefix}:${timestamp}:${random}`;
  }

  private sortKeys(key: string, value: unknown): unknown {
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      return Object.keys(value)
        .sort()
        .reduce((sorted, k) => {
          sorted[k] = value[k];
          return sorted;
        }, {} as Record<string, unknown>);
    }
    return value;
  }
}
