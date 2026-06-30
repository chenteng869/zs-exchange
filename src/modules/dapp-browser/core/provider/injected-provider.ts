import type { Eip1193Provider, Eip1193RequestArguments, Eip1193Listener, ProviderEventName, Eip1193ConnectInfo } from '../../shared/types';
import { ProviderRpcError, UserRejectedRequestError, UnauthorizedError, DisconnectedError } from '../../shared/errors';
import { ProviderMethodRegistry, handleProviderMethod } from './provider-methods';
import { ProviderEventBus } from './provider-events';
import { DefaultProviderStateManager } from './provider-state';

export interface InjectedProviderConfig {
  origin: string;
  accountId: string;
  chainId: string;
  methodRegistry: ProviderMethodRegistry;
  eventBus: ProviderEventBus;
  stateManager: DefaultProviderStateManager;
  requestAuthorization: (origin: string) => Promise<boolean>;
  validatePermission: (origin: string, permission: string) => boolean;
}

export class InjectedProvider implements Eip1193Provider {
  readonly origin: string;
  readonly accountId: string;

  private _chainId: string;
  private methodRegistry: ProviderMethodRegistry;
  private eventBus: ProviderEventBus;
  private stateManager: DefaultProviderStateManager;
  private requestAuthorization: (origin: string) => Promise<boolean>;
  private validatePermission: (origin: string, permission: string) => boolean;
  private requestIdCounter = 0;

  constructor(config: InjectedProviderConfig) {
    this.origin = config.origin;
    this.accountId = config.accountId;
    this._chainId = config.chainId;
    this.methodRegistry = config.methodRegistry;
    this.eventBus = config.eventBus;
    this.stateManager = config.stateManager;
    this.requestAuthorization = config.requestAuthorization;
    this.validatePermission = config.validatePermission;
  }

  isConnected(): boolean {
    return this.stateManager.isConnected();
  }

  async request(args: Eip1193RequestArguments): Promise<unknown> {
    const { method, params } = args;

    if (!method) {
      throw new ProviderRpcError(-32602, 'Invalid parameters: method is required');
    }

    const definition = this.methodRegistry.get(method);

    if (!definition) {
      throw new ProviderRpcError(-32601, `The method ${method} does not exist`);
    }

    if (!this.stateManager.isConnected()) {
      throw new DisconnectedError();
    }

    if (definition.requiresAuthorization) {
      const authorized = await this.requestAuthorization(this.origin);
      if (!authorized) {
        throw new UserRejectedRequestError();
      }
    }

    if (definition.requiresChain && !this.stateManager.getChainId()) {
      throw new DisconnectedError();
    }

    const context = {
      origin: this.origin,
      accountId: this.accountId,
      chainId: this.stateManager.getChainId() ?? this._chainId,
    };

    try {
      const result = await handleProviderMethod(args, context, this.methodRegistry);
      return result;
    } catch (error) {
      if (error instanceof ProviderRpcError) {
        throw error;
      }
      throw new ProviderRpcError(-32603, 'Internal error');
    }
  }

  on(event: string, listener: Eip1193Listener): this {
    const eventName = event as ProviderEventName;
    this.eventBus.on(eventName, listener);
    return this;
  }

  removeListener(event: string, listener: Eip1193Listener): this {
    const eventName = event as ProviderEventName;
    this.eventBus.off(eventName, listener);
    return this;
  }

  send(method: string, params?: unknown[]): Promise<unknown> {
    return this.request({ method, params });
  }

  sendAsync(method: string, params?: unknown[], callback?: (error: ProviderRpcError | null, result?: unknown) => void): void {
    this.request({ method, params })
      .then((result) => {
        if (callback) {
          callback(null, result);
        }
      })
      .catch((error) => {
        if (callback) {
          callback(error as ProviderRpcError);
        }
      });
  }

  get chainId(): string {
    return this.stateManager.getChainId() ?? this._chainId;
  }

  get selectedAddress(): string | null {
    return this.stateManager.getSelectedAddress();
  }

  get accounts(): string[] {
    return this.stateManager.getAccounts();
  }

  get isUnlocked(): boolean {
    return this.stateManager.isUnlocked();
  }

  setChainId(chainId: string): void {
    const oldChainId = this.stateManager.getChainId();
    this.stateManager.setChainId(chainId);
    this._chainId = chainId;
    if (oldChainId !== chainId) {
      this.eventBus.emit('chainChanged', chainId);
    }
  }

  setAccounts(accounts: string[]): void {
    const oldAccounts = this.stateManager.getAccounts();
    this.stateManager.setAccounts(accounts);
    if (JSON.stringify(oldAccounts) !== JSON.stringify(accounts)) {
      this.eventBus.emit('accountsChanged', accounts);
    }
  }

  connect(info: Eip1193ConnectInfo): void {
    this.stateManager.setChainId(info.chainId);
    this.stateManager.setIsConnected(true);
    this.eventBus.emit('connect', info);
  }

  disconnect(error: { code: number; message: string }): void {
    this.stateManager.setIsConnected(false);
    this.eventBus.emit('disconnect', error);
  }

  generateRequestId(): string {
    this.requestIdCounter += 1;
    return `req_${Date.now()}_${this.requestIdCounter}`;
  }
}