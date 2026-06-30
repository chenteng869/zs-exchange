import type { EthereumProviderState } from '../../shared/types';

export interface ProviderStateManager {
  getState(): EthereumProviderState;
  setChainId(chainId: string): void;
  setAccounts(accounts: string[]): void;
  setSelectedAddress(address: string | null): void;
  setIsConnected(isConnected: boolean): void;
  setIsUnlocked(isUnlocked: boolean): void;
  reset(): void;
}

export class DefaultProviderStateManager implements ProviderStateManager {
  private state: EthereumProviderState = {
    isConnected: false,
    chainId: null,
    selectedAddress: null,
    accounts: [],
    isUnlocked: false,
  };

  getState(): EthereumProviderState {
    return { ...this.state };
  }

  setChainId(chainId: string): void {
    this.state.chainId = chainId;
  }

  setAccounts(accounts: string[]): void {
    this.state.accounts = [...accounts];
    this.state.selectedAddress = accounts[0] ?? null;
  }

  setSelectedAddress(address: string | null): void {
    this.state.selectedAddress = address;
  }

  setIsConnected(isConnected: boolean): void {
    this.state.isConnected = isConnected;
  }

  setIsUnlocked(isUnlocked: boolean): void {
    this.state.isUnlocked = isUnlocked;
  }

  reset(): void {
    this.state = {
      isConnected: false,
      chainId: null,
      selectedAddress: null,
      accounts: [],
      isUnlocked: false,
    };
  }

  isConnected(): boolean {
    return this.state.isConnected;
  }

  getChainId(): string | null {
    return this.state.chainId;
  }

  getAccounts(): string[] {
    return [...this.state.accounts];
  }

  getSelectedAddress(): string | null {
    return this.state.selectedAddress;
  }

  isUnlocked(): boolean {
    return this.state.isUnlocked;
  }
}

export const createDefaultStateManager = (): DefaultProviderStateManager => {
  return new DefaultProviderStateManager();
};