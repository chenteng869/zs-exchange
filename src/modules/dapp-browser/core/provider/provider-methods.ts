import type { Eip1193RequestArguments, EthSendTransactionParams, EthCallParams, WatchAssetParams } from '../../shared/types';
import { ProviderErrorCode, UnsupportedMethodError, MethodNotFoundError, InvalidParamsError, InternalError } from '../../shared/errors';

export type ProviderMethodHandler = (args: Eip1193RequestArguments, context: { origin: string; accountId: string; chainId: string }) => Promise<unknown>;

export interface ProviderMethodDefinition {
  method: string;
  handler: ProviderMethodHandler;
  requiresAuthorization: boolean;
  requiresChain: boolean;
}

export class ProviderMethodRegistry {
  private methods = new Map<string, ProviderMethodDefinition>();

  register(method: string, definition: Omit<ProviderMethodDefinition, 'method'>): void {
    this.methods.set(method, { ...definition, method });
  }

  get(method: string): ProviderMethodDefinition | undefined {
    return this.methods.get(method);
  }

  has(method: string): boolean {
    return this.methods.has(method);
  }

  getAll(): ProviderMethodDefinition[] {
    return Array.from(this.methods.values());
  }
}

export const createDefaultProviderMethods = (
  getChainId: () => string,
  getAccounts: () => string[],
  requestAccounts: (origin: string) => Promise<string[]>,
  switchChain: (chainId: string) => Promise<void>,
  addChain: (params: unknown) => Promise<void>,
  sendTransaction: (params: EthSendTransactionParams, origin: string) => Promise<string>,
  signMessage: (message: string, origin: string) => Promise<string>,
  signTypedData: (params: unknown[], origin: string) => Promise<string>,
  call: (params: EthCallParams) => Promise<string>,
  watchAsset: (params: WatchAssetParams) => Promise<boolean>,
): ProviderMethodRegistry => {
  const registry = new ProviderMethodRegistry();

  registry.register('eth_chainId', {
    handler: async () => getChainId(),
    requiresAuthorization: false,
    requiresChain: false,
  });

  registry.register('eth_accounts', {
    handler: async () => getAccounts(),
    requiresAuthorization: false,
    requiresChain: false,
  });

  registry.register('eth_requestAccounts', {
    handler: async (args, { origin }) => {
      const accounts = await requestAccounts(origin);
      return accounts;
    },
    requiresAuthorization: true,
    requiresChain: true,
  });

  registry.register('eth_sendTransaction', {
    handler: async (args, { origin }) => {
      const params = args.params as EthSendTransactionParams[];
      if (!params || params.length === 0) {
        throw new InvalidParamsError();
      }
      const tx = await sendTransaction(params[0], origin);
      return tx;
    },
    requiresAuthorization: true,
    requiresChain: true,
  });

  registry.register('eth_sign', {
    handler: async (args, { origin }) => {
      const params = args.params as [string, string];
      if (!params || params.length < 2) {
        throw new InvalidParamsError();
      }
      const [address, message] = params;
      if (!address || !message) {
        throw new InvalidParamsError();
      }
      const signature = await signMessage(message, origin);
      return signature;
    },
    requiresAuthorization: true,
    requiresChain: true,
  });

  registry.register('personal_sign', {
    handler: async (args, { origin }) => {
      const params = args.params as [string, string];
      if (!params || params.length < 2) {
        throw new InvalidParamsError();
      }
      const [message, address] = params;
      if (!message || !address) {
        throw new InvalidParamsError();
      }
      const signature = await signMessage(message, origin);
      return signature;
    },
    requiresAuthorization: true,
    requiresChain: true,
  });

  registry.register('eth_signTypedData', {
    handler: async (args, { origin }) => {
      const params = args.params as unknown[];
      if (!params || params.length < 2) {
        throw new InvalidParamsError();
      }
      const signature = await signTypedData(params, origin);
      return signature;
    },
    requiresAuthorization: true,
    requiresChain: true,
  });

  registry.register('eth_signTypedData_v1', {
    handler: async (args, { origin }) => {
      const params = args.params as unknown[];
      if (!params || params.length < 2) {
        throw new InvalidParamsError();
      }
      const signature = await signTypedData(params, origin);
      return signature;
    },
    requiresAuthorization: true,
    requiresChain: true,
  });

  registry.register('eth_signTypedData_v3', {
    handler: async (args, { origin }) => {
      const params = args.params as unknown[];
      if (!params || params.length < 2) {
        throw new InvalidParamsError();
      }
      const signature = await signTypedData(params, origin);
      return signature;
    },
    requiresAuthorization: true,
    requiresChain: true,
  });

  registry.register('eth_signTypedData_v4', {
    handler: async (args, { origin }) => {
      const params = args.params as unknown[];
      if (!params || params.length < 2) {
        throw new InvalidParamsError();
      }
      const signature = await signTypedData(params, origin);
      return signature;
    },
    requiresAuthorization: true,
    requiresChain: true,
  });

  registry.register('eth_call', {
    handler: async (args) => {
      const params = args.params as EthCallParams[];
      if (!params || params.length === 0) {
        throw new InvalidParamsError();
      }
      const result = await call(params[0]);
      return result;
    },
    requiresAuthorization: false,
    requiresChain: true,
  });

  registry.register('net_version', {
    handler: async () => {
      const chainId = getChainId();
      return parseInt(chainId.slice(2), 16).toString();
    },
    requiresAuthorization: false,
    requiresChain: false,
  });

  registry.register('net_chainId', {
    handler: async () => getChainId(),
    requiresAuthorization: false,
    requiresChain: false,
  });

  registry.register('wallet_switchEthereumChain', {
    handler: async (args) => {
      const params = args.params as ({ chainId: string })[];
      if (!params || params.length === 0 || !params[0]?.chainId) {
        throw new InvalidParamsError();
      }
      await switchChain(params[0].chainId);
      return null;
    },
    requiresAuthorization: true,
    requiresChain: true,
  });

  registry.register('wallet_addEthereumChain', {
    handler: async (args) => {
      const params = args.params as unknown[];
      if (!params || params.length === 0) {
        throw new InvalidParamsError();
      }
      await addChain(params[0]);
      return null;
    },
    requiresAuthorization: true,
    requiresChain: false,
  });

  registry.register('wallet_watchAsset', {
    handler: async (args) => {
      const params = args.params as WatchAssetParams[];
      if (!params || params.length === 0) {
        throw new InvalidParamsError();
      }
      const result = await watchAsset(params[0]);
      return result;
    },
    requiresAuthorization: true,
    requiresChain: false,
  });

  registry.register('eth_blockNumber', {
    handler: async () => {
      throw new UnsupportedMethodError('eth_blockNumber');
    },
    requiresAuthorization: false,
    requiresChain: true,
  });

  registry.register('eth_getBalance', {
    handler: async () => {
      throw new UnsupportedMethodError('eth_getBalance');
    },
    requiresAuthorization: false,
    requiresChain: true,
  });

  registry.register('eth_getTransactionCount', {
    handler: async () => {
      throw new UnsupportedMethodError('eth_getTransactionCount');
    },
    requiresAuthorization: false,
    requiresChain: true,
  });

  registry.register('eth_getCode', {
    handler: async () => {
      throw new UnsupportedMethodError('eth_getCode');
    },
    requiresAuthorization: false,
    requiresChain: true,
  });

  registry.register('eth_gasPrice', {
    handler: async () => {
      throw new UnsupportedMethodError('eth_gasPrice');
    },
    requiresAuthorization: false,
    requiresChain: true,
  });

  registry.register('eth_estimateGas', {
    handler: async () => {
      throw new UnsupportedMethodError('eth_estimateGas');
    },
    requiresAuthorization: false,
    requiresChain: true,
  });

  registry.register('eth_getLogs', {
    handler: async () => {
      throw new UnsupportedMethodError('eth_getLogs');
    },
    requiresAuthorization: false,
    requiresChain: true,
  });

  registry.register('eth_getBlockByNumber', {
    handler: async () => {
      throw new UnsupportedMethodError('eth_getBlockByNumber');
    },
    requiresAuthorization: false,
    requiresChain: true,
  });

  registry.register('eth_getTransactionByHash', {
    handler: async () => {
      throw new UnsupportedMethodError('eth_getTransactionByHash');
    },
    requiresAuthorization: false,
    requiresChain: true,
  });

  registry.register('eth_getTransactionReceipt', {
    handler: async () => {
      throw new UnsupportedMethodError('eth_getTransactionReceipt');
    },
    requiresAuthorization: false,
    requiresChain: true,
  });

  return registry;
};

export const handleProviderMethod = async (
  args: Eip1193RequestArguments,
  context: { origin: string; accountId: string; chainId: string },
  registry: ProviderMethodRegistry,
): Promise<unknown> => {
  const { method } = args;

  if (!method) {
    throw new InvalidParamsError();
  }

  const definition = registry.get(method);

  if (!definition) {
    throw new MethodNotFoundError(method);
  }

  try {
    return await definition.handler(args, context);
  } catch (error) {
    if (error instanceof Error && 'code' in error) {
      throw error;
    }
    throw new InternalError(error);
  }
};