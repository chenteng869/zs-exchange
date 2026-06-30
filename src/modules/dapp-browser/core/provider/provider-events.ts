import type { ProviderEventName, Eip1193Listener, ProviderConnectEvent, ProviderDisconnectError, ProviderMessage } from '../../shared/types';

export type ProviderEventEmitter = {
  emit(event: 'connect', info: ProviderConnectEvent): void;
  emit(event: 'disconnect', error: ProviderDisconnectError): void;
  emit(event: 'accountsChanged', accounts: string[]): void;
  emit(event: 'chainChanged', chainId: string): void;
  emit(event: 'message', message: ProviderMessage): void;
};

export class ProviderEventBus implements ProviderEventEmitter {
  private listeners = new Map<ProviderEventName, Set<Eip1193Listener>>();

  on(event: ProviderEventName, listener: Eip1193Listener): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(listener);
  }

  off(event: ProviderEventName, listener: Eip1193Listener): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.delete(listener);
    }
  }

  emit(event: 'connect', info: ProviderConnectEvent): void;
  emit(event: 'disconnect', error: ProviderDisconnectError): void;
  emit(event: 'accountsChanged', accounts: string[]): void;
  emit(event: 'chainChanged', chainId: string): void;
  emit(event: 'message', message: ProviderMessage): void;
  emit(event: ProviderEventName, ...args: unknown[]): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      for (const listener of eventListeners) {
        try {
          listener(...args);
        } catch {
        }
      }
    }
  }

  clear(event?: ProviderEventName): void {
    if (event) {
      this.listeners.delete(event);
    } else {
      this.listeners.clear();
    }
  }

  hasListener(event: ProviderEventName): boolean {
    const eventListeners = this.listeners.get(event);
    return eventListeners !== undefined && eventListeners.size > 0;
  }

  getListenerCount(event: ProviderEventName): number {
    return this.listeners.get(event)?.size ?? 0;
  }
}

export const createDefaultEventBus = (): ProviderEventBus => {
  return new ProviderEventBus();
};