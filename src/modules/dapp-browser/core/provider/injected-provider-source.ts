import { InjectedProvider } from './injected-provider';
import { ProviderMethodRegistry, createDefaultProviderMethods } from './provider-methods';
import { ProviderEventBus, createDefaultEventBus } from './provider-events';
import { DefaultProviderStateManager, createDefaultStateManager } from './provider-state';
import type { EthSendTransactionParams, EthCallParams, WatchAssetParams } from '../../shared/types';
import { UserRejectedRequestError, DisconnectedError } from '../../shared/errors';

export interface InjectedProviderSourceConfig {
  accountId: string;
  chainId: string;
  accounts: string[];
  getChainId: () => string;
  getAccounts: () => string[];
  requestAccounts: (origin: string) => Promise<string[]>;
  switchChain: (chainId: string) => Promise<void>;
  addChain: (params: unknown) => Promise<void>;
  sendTransaction: (params: EthSendTransactionParams, origin: string) => Promise<string>;
  signMessage: (message: string, origin: string) => Promise<string>;
  signTypedData: (params: unknown[], origin: string) => Promise<string>;
  call: (params: EthCallParams) => Promise<string>;
  watchAsset: (params: WatchAssetParams) => Promise<boolean>;
  requestAuthorization: (origin: string) => Promise<boolean>;
  validatePermission: (origin: string, permission: string) => boolean;
}

export class InjectedProviderSource {
  private providers = new Map<string, InjectedProvider>();
  private methodRegistry: ProviderMethodRegistry;
  private eventBus: ProviderEventBus;
  private stateManager: DefaultProviderStateManager;
  private config: InjectedProviderSourceConfig;

  constructor(config: InjectedProviderSourceConfig) {
    this.config = config;
    this.methodRegistry = createDefaultProviderMethods(
      config.getChainId,
      config.getAccounts,
      config.requestAccounts,
      config.switchChain,
      config.addChain,
      config.sendTransaction,
      config.signMessage,
      config.signTypedData,
      config.call,
      config.watchAsset,
    );
    this.eventBus = createDefaultEventBus();
    this.stateManager = createDefaultStateManager();
    this.stateManager.setChainId(config.chainId);
    this.stateManager.setAccounts(config.accounts);
    this.stateManager.setIsConnected(true);
  }

  getProvider(origin: string): InjectedProvider {
    let provider = this.providers.get(origin);

    if (!provider) {
      provider = new InjectedProvider({
        origin,
        accountId: this.config.accountId,
        chainId: this.config.chainId,
        methodRegistry: this.methodRegistry,
        eventBus: this.eventBus,
        stateManager: this.stateManager,
        requestAuthorization: this.config.requestAuthorization,
        validatePermission: this.config.validatePermission,
      });
      this.providers.set(origin, provider);
    }

    return provider;
  }

  removeProvider(origin: string): void {
    this.providers.delete(origin);
  }

  getAllProviders(): InjectedProvider[] {
    return Array.from(this.providers.values());
  }

  getProviderCount(): number {
    return this.providers.size;
  }

  hasProvider(origin: string): boolean {
    return this.providers.has(origin);
  }

  updateChainId(chainId: string): void {
    this.stateManager.setChainId(chainId);
    for (const provider of this.providers.values()) {
      provider.setChainId(chainId);
    }
  }

  updateAccounts(accounts: string[]): void {
    this.stateManager.setAccounts(accounts);
    for (const provider of this.providers.values()) {
      provider.setAccounts(accounts);
    }
  }

  connect(chainId: string): void {
    this.stateManager.setChainId(chainId);
    this.stateManager.setIsConnected(true);
    this.eventBus.emit('connect', { chainId });
    for (const provider of this.providers.values()) {
      provider.connect({ chainId });
    }
  }

  disconnect(error: { code: number; message: string }): void {
    this.stateManager.setIsConnected(false);
    this.eventBus.emit('disconnect', error);
    for (const provider of this.providers.values()) {
      provider.disconnect(error);
    }
  }

  getState() {
    return this.stateManager.getState();
  }

  reset(): void {
    this.stateManager.reset();
    this.providers.clear();
  }

  inject(origin: string): InjectedProvider {
    const provider = this.getProvider(origin);
    return provider;
  }
}

export const createInjectedProviderSource = (config: InjectedProviderSourceConfig): InjectedProviderSource => {
  return new InjectedProviderSource(config);
};