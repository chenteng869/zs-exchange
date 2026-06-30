export interface Caip10Account {
  chainId: string;
  accountId: string;
}

export class Caip10Utils {
  static parse(accountId: string): Caip10Account {
    const parts = accountId.split(':');
    
    if (parts.length !== 3) {
      throw new Error('Invalid CAIP-10 account ID format');
    }

    const namespace = parts[0];
    const reference = parts[1];
    const address = parts[2];

    return {
      chainId: `${namespace}:${reference}`,
      accountId: address,
    };
  }

  static format(chainId: string, accountId: string): string {
    return `${chainId}:${accountId}`;
  }

  static isValid(accountId: string): boolean {
    try {
      const { chainId, accountId: addr } = this.parse(accountId);
      
      if (!chainId || !addr) {
        return false;
      }

      const [namespace, reference] = chainId.split(':');
      if (!namespace || !reference) {
        return false;
      }

      return true;
    } catch {
      return false;
    }
  }

  static toDidPkh(accountId: string): string {
    const { chainId, accountId: addr } = this.parse(accountId);
    return `did:pkh:${chainId}:${addr}`;
  }

  static fromDidPkh(did: string): string {
    if (!did.startsWith('did:pkh:')) {
      throw new Error('Invalid did:pkh format');
    }

    const parts = did.split(':');
    if (parts.length !== 4) {
      throw new Error('Invalid did:pkh format');
    }

    return `${parts[2]}:${parts[3]}`;
  }

  static toDidEthr(accountId: string): string {
    const { chainId, accountId: addr } = this.parse(accountId);
    return `did:ethr:${chainId}:${addr}`;
  }

  static fromDidEthr(did: string): string {
    if (!did.startsWith('did:ethr:')) {
      throw new Error('Invalid did:ethr format');
    }

    const parts = did.split(':');
    if (parts.length !== 4) {
      throw new Error('Invalid did:ethr format');
    }

    return `${parts[2]}:${parts[3]}`;
  }

  static getChainNamespace(accountId: string): string {
    const { chainId } = this.parse(accountId);
    return chainId.split(':')[0];
  }

  static getChainReference(accountId: string): string {
    const { chainId } = this.parse(accountId);
    return chainId.split(':')[1];
  }

  static getAddress(accountId: string): string {
    const { accountId: addr } = this.parse(accountId);
    return addr;
  }
}