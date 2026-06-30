# H03\-《DApp 浏览器 Part 3：Request Router \+ RPC Proxy \+ Chain 管理》

# 《DApp 浏览器 Part 3：Request Router \+ RPC Proxy \+ Chain 管理》



本章实现 DApp 浏览器的 **请求路由、RPC 代理、多链管理基础设施**。



本章完成后，DApp 可以真实调用：



```TypeScript
await window.ethereum.request({ method: 'eth_chainId' });
await window.ethereum.request({ method: 'net_version' });
await window.ethereum.request({ method: 'eth_blockNumber' });
await window.ethereum.request({ method: 'eth_getBalance', params: [address, 'latest'] });
await window.ethereum.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: '0x38' }] });
await window.ethereum.request({ method: 'wallet_addEthereumChain', params: [...] });
```



同时，本章会把 Part 2 的 `onRequest` 临时函数升级为完整生产级请求路由：



```Plain Text
Provider Request
  -> DappRequestRouterService
  -> Account Router
  -> Chain Router
  -> RPC Proxy Router
  -> Signing Router
  -> Transaction Router
  -> Response
```



本章主要覆盖：



- `DappRequestRouterService`

- Provider 方法分发

- Chain Registry

- Active Chain Service

- Chain Switch Service

- Chain Add Service

- RPC Client

- RPC Router

- RPC Timeout

- RPC Retry

- RPC Rate Limit

- RPC Error 标准化

- RPC 健康状态

- `eth_chainId`

- `net_version`

- `eth_accounts`

- `eth_requestAccounts` 占位接入

- `wallet_switchEthereumChain`

- `wallet_addEthereumChain`

- RPC 透传方法

    

---



# 1\. 本章目录结构



```Bash
src/modules/dapp-browser/
  core/
    router/
      dapp-request-router.service.ts
      dapp-router.types.ts
      method-classifier.ts

    chains/
      chain-registry.service.ts
      active-chain.service.ts
      chain-switch.service.ts
      chain-add.service.ts
      chain-storage.service.ts
      default-chains.ts

    rpc/
      rpc.types.ts
      rpc-client.service.ts
      rpc-router.service.ts
      rpc-rate-limit.service.ts
      rpc-health.service.ts
      rpc-error-normalizer.ts

    accounts/
      active-account.service.ts
      dapp-account.service.ts

  shared/
    utils/
      chain.ts
      timeout.ts
```



---



# 2\. Router 类型



## `core/router/dapp-router.types.ts`



```TypeScript
import { DappBridgeRequest, DappBridgeResult } from '../bridge/dapp-bridge.types';

export interface DappRouteResult {
  result: unknown;
}

export interface DappMethodHandler {
  handle(input: DappBridgeRequest): Promise;
}

export interface DappRequestRouterOptions {
  strictUnsupportedMethods?: boolean;
}

export interface DappRequestRouterDeps {
  accountHandler: DappMethodHandler;
  chainHandler: DappMethodHandler;
  rpcHandler: DappMethodHandler;
  signingHandler?: DappMethodHandler;
  transactionHandler?: DappMethodHandler;
  watchAssetHandler?: DappMethodHandler;
}
```



---



# 3\. 方法分类器



## `core/router/method-classifier.ts`



```TypeScript
import {
  AccountMethods,
  ChainMethods,
  RpcProxyMethods,
  SigningMethods,
  TransactionMethods,
  ProviderMethods,
} from '../provider/provider-methods';

export type DappMethodCategory =
  | 'account'
  | 'chain'
  | 'rpc'
  | 'signing'
  | 'transaction'
  | 'watch_asset'
  | 'unsupported';

export function classifyProviderMethod(method: string): DappMethodCategory {
  if (AccountMethods.has(method)) return 'account';
  if (ChainMethods.has(method)) return 'chain';
  if (RpcProxyMethods.has(method)) return 'rpc';
  if (SigningMethods.has(method)) return 'signing';
  if (TransactionMethods.has(method)) return 'transaction';

  if (method === ProviderMethods.WALLET_WATCH_ASSET) {
    return 'watch_asset';
  }

  return 'unsupported';
}
```



---



# 4\. Chain 工具



## `shared/utils/chain.ts`



```TypeScript
import { WalletAddEthereumChainParameter } from '../types/chain.types';

export function normalizeChainId(chainId: string | number): `0x${string}` {
  if (typeof chainId === 'number') {
    if (!Number.isInteger(chainId) || chainId ;

  if (!item || typeof item !== 'object') {
    throw new Error('INVALID_ADD_CHAIN_PARAMS');
  }

  if (!item.chainId) {
    throw new Error('ADD_CHAIN_CHAIN_ID_REQUIRED');
  }

  if (!item.chainName || typeof item.chainName !== 'string') {
    throw new Error('ADD_CHAIN_NAME_REQUIRED');
  }

  if (!Array.isArray(item.rpcUrls) || item.rpcUrls.length === 0) {
    throw new Error('ADD_CHAIN_RPC_URLS_REQUIRED');
  }

  for (const rpcUrl of item.rpcUrls) {
    const parsed = new URL(rpcUrl);

    if (parsed.protocol !== 'https:') {
      throw new Error('ADD_CHAIN_RPC_MUST_BE_HTTPS');
    }
  }

  const chainId = normalizeChainId(item.chainId);

  return {
    chainId,
    chainName: item.chainName,
    nativeCurrency: item.nativeCurrency,
    rpcUrls: item.rpcUrls,
    blockExplorerUrls: item.blockExplorerUrls ?? [],
    iconUrls: item.iconUrls ?? [],
  };
}
```



---



# 5\. Timeout 工具



## `shared/utils/timeout.ts`



```TypeScript
export class TimeoutError extends Error {
  constructor(
    public readonly timeoutMs: number,
    message = `Operation timed out after ${timeoutMs}ms`,
  ) {
    super(message);
    this.name = 'TimeoutError';
  }
}

export async function withTimeout(
  promise: Promise,
  timeoutMs: number,
  message?: string,
): Promise {
  let timer: ReturnType | undefined;

  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => {
      reject(new TimeoutError(timeoutMs, message));
    }, timeoutMs);
  });

  try {
    return await Promise.race([promise, timeout]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export async function sleep(ms: number): Promise {
  await new Promise((resolve) => setTimeout(resolve, ms));
}
```



---



# 6\. 默认链配置



## `core/chains/default-chains.ts`



```TypeScript
import { Eip155ChainConfig } from '../../shared/types/chain.types';

export const DEFAULT_EVM_CHAINS: Eip155ChainConfig[] = [
  {
    namespace: 'eip155',
    chainId: '0x1',
    numericChainId: 1,
    name: 'Ethereum',
    shortName: 'ETH',
    rpcUrls: [
      'https://ethereum-rpc.publicnode.com',
      'https://rpc.ankr.com/eth',
    ],
    fallbackRpcUrls: [
      'https://eth.llamarpc.com',
    ],
    blockExplorerUrls: [
      'https://etherscan.io',
    ],
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18,
    },
    enabled: true,
    testnet: false,
  },
  {
    namespace: 'eip155',
    chainId: '0x38',
    numericChainId: 56,
    name: 'BNB Smart Chain',
    shortName: 'BSC',
    rpcUrls: [
      'https://bsc-dataseed.binance.org',
      'https://rpc.ankr.com/bsc',
    ],
    fallbackRpcUrls: [
      'https://bsc.publicnode.com',
    ],
    blockExplorerUrls: [
      'https://bscscan.com',
    ],
    nativeCurrency: {
      name: 'BNB',
      symbol: 'BNB',
      decimals: 18,
    },
    enabled: true,
    testnet: false,
  },
  {
    namespace: 'eip155',
    chainId: '0x89',
    numericChainId: 137,
    name: 'Polygon',
    shortName: 'MATIC',
    rpcUrls: [
      'https://polygon-rpc.com',
      'https://rpc.ankr.com/polygon',
    ],
    fallbackRpcUrls: [
      'https://polygon-bor-rpc.publicnode.com',
    ],
    blockExplorerUrls: [
      'https://polygonscan.com',
    ],
    nativeCurrency: {
      name: 'MATIC',
      symbol: 'MATIC',
      decimals: 18,
    },
    enabled: true,
    testnet: false,
  },
  {
    namespace: 'eip155',
    chainId: '0xa4b1',
    numericChainId: 42161,
    name: 'Arbitrum One',
    shortName: 'ARB',
    rpcUrls: [
      'https://arb1.arbitrum.io/rpc',
      'https://rpc.ankr.com/arbitrum',
    ],
    fallbackRpcUrls: [
      'https://arbitrum-one-rpc.publicnode.com',
    ],
    blockExplorerUrls: [
      'https://arbiscan.io',
    ],
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18,
    },
    enabled: true,
    testnet: false,
  },
  {
    namespace: 'eip155',
    chainId: '0xa',
    numericChainId: 10,
    name: 'Optimism',
    shortName: 'OP',
    rpcUrls: [
      'https://mainnet.optimism.io',
      'https://rpc.ankr.com/optimism',
    ],
    fallbackRpcUrls: [
      'https://optimism-rpc.publicnode.com',
    ],
    blockExplorerUrls: [
      'https://optimistic.etherscan.io',
    ],
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18,
    },
    enabled: true,
    testnet: false,
  },
  {
    namespace: 'eip155',
    chainId: '0x2105',
    numericChainId: 8453,
    name: 'Base',
    shortName: 'BASE',
    rpcUrls: [
      'https://mainnet.base.org',
      'https://base-rpc.publicnode.com',
    ],
    fallbackRpcUrls: [
      'https://rpc.ankr.com/base',
    ],
    blockExplorerUrls: [
      'https://basescan.org',
    ],
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18,
    },
    enabled: true,
    testnet: false,
  },
  {
    namespace: 'eip155',
    chainId: '0xa86a',
    numericChainId: 43114,
    name: 'Avalanche C-Chain',
    shortName: 'AVAX',
    rpcUrls: [
      'https://api.avax.network/ext/bc/C/rpc',
      'https://rpc.ankr.com/avalanche',
    ],
    fallbackRpcUrls: [
      'https://avalanche-c-chain-rpc.publicnode.com',
    ],
    blockExplorerUrls: [
      'https://snowtrace.io',
    ],
    nativeCurrency: {
      name: 'Avalanche',
      symbol: 'AVAX',
      decimals: 18,
    },
    enabled: true,
    testnet: false,
  },
];
```



---



# 7\. Chain Storage Service



移动端生产建议持久化到：



```Plain Text
MMKV / SecureStore / AsyncStorage / SQLite
```



本章先提供可替换接口 \+ 内存实现。



## `core/chains/chain-storage.service.ts`



```TypeScript
import { ChainConfig } from '../../shared/types/chain.types';

export interface ChainStorageService {
  list(): Promise;
  get(chainId: string): Promise;
  upsert(chain: ChainConfig): Promise;
  remove(chainId: string): Promise;
}

export class InMemoryChainStorageService implements ChainStorageService {
  private readonly chains = new Map();

  constructor(initialChains: ChainConfig[] = []) {
    for (const chain of initialChains) {
      this.chains.set(chain.chainId, chain);
    }
  }

  async list(): Promise {
    return Array.from(this.chains.values());
  }

  async get(chainId: string): Promise {
    return this.chains.get(chainId) ?? null;
  }

  async upsert(chain: ChainConfig): Promise {
    this.chains.set(chain.chainId, chain);
  }

  async remove(chainId: string): Promise {
    this.chains.delete(chainId);
  }
}
```



---



# 8\. Chain Registry Service



负责链注册、查询、启用状态。



## `core/chains/chain-registry.service.ts`



```TypeScript
import {
  ChainConfig,
  Eip155ChainConfig,
  WalletAddEthereumChainParameter,
} from '../../shared/types/chain.types';
import { normalizeChainId } from '../../shared/utils/chain';
import { ChainStorageService } from './chain-storage.service';
import { DEFAULT_EVM_CHAINS } from './default-chains';

export class ChainRegistryService {
  constructor(
    private readonly storage: ChainStorageService,
  ) {}

  static createDefault(storage?: ChainStorageService) {
    return new ChainRegistryService(
      storage ??
        new (require('./chain-storage.service').InMemoryChainStorageService)(
          DEFAULT_EVM_CHAINS,
        ),
    );
  }

  async initializeDefaults() {
    for (const chain of DEFAULT_EVM_CHAINS) {
      const existing = await this.storage.get(chain.chainId);
      if (!existing) {
        await this.storage.upsert(chain);
      }
    }
  }

  async listEnabledChains(): Promise {
    const chains = await this.storage.list();
    return chains.filter((item) => item.enabled);
  }

  async getChain(chainId: string): Promise {
    return this.storage.get(normalizeChainId(chainId));
  }

  async requireChain(chainId: string): Promise {
    const chain = await this.getChain(chainId);

    if (!chain || !chain.enabled) {
      throw {
        code: 4902,
        message: `Unrecognized chain: ${chainId}`,
      };
    }

    return chain;
  }

  async addEthereumChain(
    input: WalletAddEthereumChainParameter,
  ): Promise {
    const normalized = normalizeChainId(input.chainId);
    const numericChainId = Number.parseInt(normalized.slice(2), 16);

    const chain: Eip155ChainConfig = {
      namespace: 'eip155',
      chainId: normalized,
      numericChainId,
      name: input.chainName,
      shortName: input.nativeCurrency?.symbol,
      rpcUrls: input.rpcUrls,
      fallbackRpcUrls: [],
      blockExplorerUrls: input.blockExplorerUrls ?? [],
      nativeCurrency: input.nativeCurrency ?? {
        name: 'Native Token',
        symbol: 'NATIVE',
        decimals: 18,
      },
      iconUrl: input.iconUrls?.[0],
      enabled: true,
      testnet: false,
    };

    await this.storage.upsert(chain);

    return chain;
  }

  async upsertChain(chain: ChainConfig): Promise {
    await this.storage.upsert({
      ...chain,
      chainId:
        chain.namespace === 'eip155'
          ? normalizeChainId(chain.chainId)
          : chain.chainId,
    });
  }
}
```



> 如果你的打包器不允许 `require`，可以不用 `createDefault`，直接在模块初始化时注入 `InMemoryChainStorageService(DEFAULT_EVM_CHAINS)`。
> 
> 



---



# 9\. Active Chain Service



负责当前 DApp Browser 激活链。



## `core/chains/active-chain.service.ts`



```TypeScript
import { ChainConfig } from '../../shared/types/chain.types';
import { normalizeChainId } from '../../shared/utils/chain';
import { ChainRegistryService } from './chain-registry.service';

export type ActiveChainListener = (chain: ChainConfig) => void;

export class ActiveChainService {
  private activeChainId: string;
  private readonly listeners = new Set();

  constructor(
    private readonly chainRegistry: ChainRegistryService,
    initialChainId = '0x1',
  ) {
    this.activeChainId = normalizeChainId(initialChainId);
  }

  async getActiveChain(): Promise {
    return this.chainRegistry.requireChain(this.activeChainId);
  }

  getActiveChainId(): string {
    return this.activeChainId;
  }

  async setActiveChain(chainId: string): Promise {
    const normalized = normalizeChainId(chainId);
    const chain = await this.chainRegistry.requireChain(normalized);

    this.activeChainId = normalized;

    for (const listener of Array.from(this.listeners)) {
      listener(chain);
    }

    return chain;
  }

  onChanged(listener: ActiveChainListener): () => void {
    this.listeners.add(listener);

    return () => {
      this.listeners.delete(listener);
    };
  }
}
```



---



# 10\. Chain Switch Service



处理 `wallet_switchEthereumChain`。



## `core/chains/chain-switch.service.ts`



```TypeScript
import { WalletSwitchEthereumChainParameter } from '../../shared/types/chain.types';
import { normalizeChainId } from '../../shared/utils/chain';
import { ActiveChainService } from './active-chain.service';
import { ChainRegistryService } from './chain-registry.service';

export interface ChainSwitchConfirmService {
  confirmSwitch(input: {
    origin: string;
    fromChainId: string;
    toChainId: string;
    chainName: string;
  }): Promise;
}

export class ChainSwitchService {
  constructor(
    private readonly chainRegistry: ChainRegistryService,
    private readonly activeChain: ActiveChainService,
    private readonly confirmService?: ChainSwitchConfirmService,
  ) {}

  async switchEthereumChain(input: {
    origin: string;
    params: unknown[];
  }): Promise {
    const param = input.params?.[0] as Partial;

    if (!param?.chainId) {
      throw {
        code: -32602,
        message: 'wallet_switchEthereumChain requires chainId',
      };
    }

    const targetChainId = normalizeChainId(param.chainId);
    const chain = await this.chainRegistry.requireChain(targetChainId);
    const currentChainId = this.activeChain.getActiveChainId();

    if (targetChainId === currentChainId) {
      return null;
    }

    if (this.confirmService) {
      const approved = await this.confirmService.confirmSwitch({
        origin: input.origin,
        fromChainId: currentChainId,
        toChainId: targetChainId,
        chainName: chain.name,
      });

      if (!approved) {
        throw {
          code: 4001,
          message: 'User rejected chain switch',
        };
      }
    }

    await this.activeChain.setActiveChain(targetChainId);

    return null;
  }
}
```



---



# 11\. Chain Add Service



处理 `wallet_addEthereumChain`。



## `core/chains/chain-add.service.ts`



```TypeScript
import {
  WalletAddEthereumChainParameter,
} from '../../shared/types/chain.types';
import { validateAddEthereumChainParameter } from '../../shared/utils/chain';
import { ChainRegistryService } from './chain-registry.service';

export interface ChainAddConfirmService {
  confirmAddChain(input: {
    origin: string;
    chain: WalletAddEthereumChainParameter;
  }): Promise;
}

export class ChainAddService {
  constructor(
    private readonly chainRegistry: ChainRegistryService,
    private readonly confirmService?: ChainAddConfirmService,
  ) {}

  async addEthereumChain(input: {
    origin: string;
    params: unknown[];
  }): Promise {
    const param = validateAddEthereumChainParameter(input.params?.[0]);

    if (this.confirmService) {
      const approved = await this.confirmService.confirmAddChain({
        origin: input.origin,
        chain: param,
      });

      if (!approved) {
        throw {
          code: 4001,
          message: 'User rejected add chain',
        };
      }
    }

    await this.chainRegistry.addEthereumChain(param);

    return null;
  }
}
```



---



# 12\. Active Account Service



先做账户服务接口。真实多账户、安全签名在后续 Part 4/5/6 接入。



## `core/accounts/active-account.service.ts`



```TypeScript
export interface ActiveAccount {
  accountId: string;
  address: string;
  name?: string;
}

export type ActiveAccountListener = (account: ActiveAccount | null) => void;

export class ActiveAccountService {
  private account: ActiveAccount | null;
  private readonly listeners = new Set();

  constructor(initialAccount?: ActiveAccount | null) {
    this.account = initialAccount ?? null;
  }

  getActiveAccount(): ActiveAccount | null {
    return this.account;
  }

  requireActiveAccount(): ActiveAccount {
    if (!this.account) {
      throw {
        code: 4100,
        message: 'No active account',
      };
    }

    return this.account;
  }

  setActiveAccount(account: ActiveAccount | null) {
    this.account = account;

    for (const listener of Array.from(this.listeners)) {
      listener(account);
    }
  }

  onChanged(listener: ActiveAccountListener): () => void {
    this.listeners.add(listener);

    return () => {
      this.listeners.delete(listener);
    };
  }
}
```



---



# 13\. DApp Account Service



处理：



- `eth_accounts`

- `eth_requestAccounts`

- `wallet_getPermissions`

- `wallet_requestPermissions`

    

本章先实现基础可运行逻辑。后续 Part 4 会替换为完整 Permission / Session 系统。



## `core/accounts/dapp-account.service.ts`



```TypeScript
import { DappBridgeRequest } from '../bridge/dapp-bridge.types';
import { ProviderMethods } from '../provider/provider-methods';
import { DappMethodHandler, DappRouteResult } from '../router/dapp-router.types';
import { ActiveAccountService } from './active-account.service';

export interface AccountPermissionConfirmService {
  confirmConnect(input: {
    origin: string;
    hostname: string;
    address: string;
    chainId: string;
  }): Promise;
}

export class DappAccountService implements DappMethodHandler {
  private readonly connectedOrigins = new Map();

  constructor(
    private readonly activeAccount: ActiveAccountService,
    private readonly confirmService?: AccountPermissionConfirmService,
  ) {}

  async handle(input: DappBridgeRequest): Promise {
    const method = input.request.method;

    switch (method) {
      case ProviderMethods.ETH_ACCOUNTS:
        return {
          result: await this.ethAccounts(input),
        };

      case ProviderMethods.ETH_REQUEST_ACCOUNTS:
        return {
          result: await this.ethRequestAccounts(input),
        };

      case ProviderMethods.WALLET_GET_PERMISSIONS:
        return {
          result: await this.walletGetPermissions(input),
        };

      case ProviderMethods.WALLET_REQUEST_PERMISSIONS:
        return {
          result: await this.walletRequestPermissions(input),
        };

      default:
        throw {
          code: 4200,
          message: `Unsupported account method: ${method}`,
        };
    }
  }

  private async ethAccounts(input: DappBridgeRequest): Promise {
    const account = this.activeAccount.getActiveAccount();
    if (!account) return [];

    const allowed = this.connectedOrigins.get(input.context.origin) ?? [];

    if (!allowed.includes(account.address)) {
      return [];
    }

    return [account.address];
  }

  private async ethRequestAccounts(input: DappBridgeRequest): Promise {
    const account = this.activeAccount.requireActiveAccount();

    const allowed = this.connectedOrigins.get(input.context.origin) ?? [];

    if (allowed.includes(account.address)) {
      return [account.address];
    }

    if (this.confirmService) {
      const approved = await this.confirmService.confirmConnect({
        origin: input.context.origin,
        hostname: input.context.hostname,
        address: account.address,
        chainId: input.context.chainId,
      });

      if (!approved) {
        throw {
          code: 4001,
          message: 'User rejected account connection',
        };
      }
    }

    this.connectedOrigins.set(input.context.origin, [
      ...new Set([...allowed, account.address]),
    ]);

    return [account.address];
  }

  private async walletGetPermissions(input: DappBridgeRequest) {
    const accounts = await this.ethAccounts(input);

    if (accounts.length === 0) {
      return [];
    }

    return [
      {
        parentCapability: 'eth_accounts',
        caveats: [
          {
            type: 'restrictReturnedAccounts',
            value: accounts,
          },
        ],
      },
    ];
  }

  private async walletRequestPermissions(input: DappBridgeRequest) {
    const params = input.request.params ?? [];
    const permissions = params[0] as Record | undefined;

    if (!permissions || !permissions.eth_accounts) {
      throw {
        code: -32602,
        message: 'wallet_requestPermissions requires eth_accounts',
      };
    }

    const accounts = await this.ethRequestAccounts(input);

    return [
      {
        parentCapability: 'eth_accounts',
        caveats: [
          {
            type: 'restrictReturnedAccounts',
            value: accounts,
          },
        ],
      },
    ];
  }
}
```



---



# 14\. RPC 类型



## `core/rpc/rpc.types.ts`



```TypeScript
import {
  JsonRpcId,
  JsonRpcRequest,
  JsonRpcResponse,
} from '../../shared/types/eip1193.types';
import { ChainConfig } from '../../shared/types/chain.types';

export interface RpcRequestOptions {
  timeoutMs?: number;
  retries?: number;
  retryDelayMs?: number;
  dedupe?: boolean;
}

export interface RpcClientRequest {
  chain: ChainConfig;
  method: string;
  params: unknown[];
  id?: JsonRpcId;
  options?: RpcRequestOptions;
}

export interface RpcEndpointState {
  url: string;
  healthy: boolean;
  lastLatencyMs?: number;
  lastError?: string;
  failedCount: number;
  lastCheckedAt?: number;
}

export interface RpcRouterResult {
  response: JsonRpcResponse;
  endpoint: string;
  latencyMs: number;
}
```



---



# 15\. RPC 错误标准化



## `core/rpc/rpc-error-normalizer.ts`



```TypeScript
import { ProviderErrors } from '../../shared/errors/provider-errors';
import { TimeoutError } from '../../shared/utils/timeout';

export function normalizeRpcError(error: unknown, method?: string) {
  if (error instanceof TimeoutError) {
    return {
      code: -32603,
      message: `RPC timeout${method ? `: ${method}` : ''}`,
      data: {
        timeoutMs: error.timeoutMs,
      },
    };
  }

  if (
    error &&
    typeof error === 'object' &&
    typeof (error as any).code === 'number' &&
    typeof (error as any).message === 'string'
  ) {
    return {
      code: (error as any).code,
      message: (error as any).message,
      data: (error as any).data,
    };
  }

  if (error instanceof Error) {
    return {
      code: -32603,
      message: error.message,
    };
  }

  return ProviderErrors.internal('Unknown RPC error', error).toJSON();
}
```



---



# 16\. RPC Rate Limit



生产应该用令牌桶 \+ Redis。移动端本地先做轻量限制，避免恶意 DApp 高频打 RPC。



## `core/rpc/rpc-rate-limit.service.ts`



```TypeScript
export class RpcRateLimitService {
  private readonly buckets = new Map();

  constructor(
    private readonly limitPerSecond = 30,
  ) {}

  assertAllowed(input: {
    origin: string;
    chainId: string;
    method: string;
  }) {
    const key = `${input.origin}:${input.chainId}:${input.method}`;
    const now = Date.now();
    const windowMs = 1000;

    const records = (this.buckets.get(key) ?? []).filter(
      (item) => now - item = this.limitPerSecond) {
      this.buckets.set(key, records);

      throw {
        code: -32005,
        message: 'RPC rate limit exceeded',
        data: {
          limitPerSecond: this.limitPerSecond,
          method: input.method,
        },
      };
    }

    records.push(now);
    this.buckets.set(key, records);
  }
}
```



---



# 17\. RPC Health Service



## `core/rpc/rpc-health.service.ts`



```TypeScript
import { RpcEndpointState } from './rpc.types';

export class RpcHealthService {
  private readonly states = new Map();

  get(url: string): RpcEndpointState {
    return this.states.get(url) ?? {
      url,
      healthy: true,
      failedCount: 0,
    };
  }

  markSuccess(input: {
    url: string;
    latencyMs: number;
  }) {
    this.states.set(input.url, {
      url: input.url,
      healthy: true,
      lastLatencyMs: input.latencyMs,
      failedCount: 0,
      lastCheckedAt: Date.now(),
    });
  }

  markFailed(input: {
    url: string;
    error: string;
  }) {
    const prev = this.get(input.url);
    const failedCount = prev.failedCount + 1;

    this.states.set(input.url, {
      ...prev,
      healthy: failedCount  {
      const stateA = this.get(a);
      const stateB = this.get(b);

      if (stateA.healthy !== stateB.healthy) {
        return stateA.healthy ? -1 : 1;
      }

      return (stateA.lastLatencyMs ?? 999999) - (stateB.lastLatencyMs ?? 999999);
    });
  }
}
```



---



# 18\. RPC Client Service



## `core/rpc/rpc-client.service.ts`



```TypeScript
import { withTimeout, sleep } from '../../shared/utils/timeout';
import { JsonRpcResponse } from '../../shared/types/eip1193.types';
import { RpcClientRequest, RpcRouterResult } from './rpc.types';
import { normalizeRpcError } from './rpc-error-normalizer';
import { RpcHealthService } from './rpc-health.service';

export class RpcClientService {
  constructor(
    private readonly health: RpcHealthService,
  ) {}

  async request(input: RpcClientRequest): Promise {
    const options = {
      timeoutMs: input.options?.timeoutMs ?? 15_000,
      retries: input.options?.retries ?? 1,
      retryDelayMs: input.options?.retryDelayMs ?? 300,
    };

    const endpoints = this.health.sortEndpoints([
      ...input.chain.rpcUrls,
      ...(input.chain.fallbackRpcUrls ?? []),
    ]);

    let lastError: unknown;

    for (const endpoint of endpoints) {
      for (let attempt = 0; attempt  {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        /**
         * 生产如果使用自建 RPC，可以加：
         * X-Client-Id / X-Request-Id
         */
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      throw new Error(`RPC_HTTP_${res.status}`);
    }

    return res.json();
  }
}
```



---



# 19\. RPC Router Service



作为 DApp Method Handler。



## `core/rpc/rpc-router.service.ts`



```TypeScript
import { DappBridgeRequest } from '../bridge/dapp-bridge.types';
import { DappMethodHandler, DappRouteResult } from '../router/dapp-router.types';
import { ActiveChainService } from '../chains/active-chain.service';
import { RpcClientService } from './rpc-client.service';
import { RpcRateLimitService } from './rpc-rate-limit.service';

export class RpcRouterService implements DappMethodHandler {
  constructor(
    private readonly activeChain: ActiveChainService,
    private readonly rpcClient: RpcClientService,
    private readonly rateLimit: RpcRateLimitService,
  ) {}

  async handle(input: DappBridgeRequest): Promise {
    const chain = await this.activeChain.getActiveChain();

    this.rateLimit.assertAllowed({
      origin: input.context.origin,
      chainId: chain.chainId,
      method: input.request.method,
    });

    const rpcResult = await this.rpcClient.request({
      chain,
      method: input.request.method,
      params: input.request.params ?? [],
      id: input.request.id,
      options: {
        timeoutMs: 15_000,
        retries: 1,
        retryDelayMs: 300,
      },
    });

    if ('error' in rpcResult.response && rpcResult.response.error) {
      throw rpcResult.response.error;
    }

    return {
      result: (rpcResult.response as any).result,
    };
  }
}
```



---



# 20\. Chain Handler Service



处理：



- `eth_chainId`

- `net_version`

- `wallet_switchEthereumChain`

- `wallet_addEthereumChain`

    

## `core/chains/chain-handler.service.ts`



```TypeScript
import { DappBridgeRequest } from '../bridge/dapp-bridge.types';
import { DappMethodHandler, DappRouteResult } from '../router/dapp-router.types';
import { ProviderMethods } from '../provider/provider-methods';
import { chainIdToNetVersion } from '../../shared/utils/chain';
import { ActiveChainService } from './active-chain.service';
import { ChainSwitchService } from './chain-switch.service';
import { ChainAddService } from './chain-add.service';

export class ChainHandlerService implements DappMethodHandler {
  constructor(
    private readonly activeChain: ActiveChainService,
    private readonly switchService: ChainSwitchService,
    private readonly addService: ChainAddService,
  ) {}

  async handle(input: DappBridgeRequest): Promise {
    const method = input.request.method;

    switch (method) {
      case ProviderMethods.ETH_CHAIN_ID:
        return {
          result: this.activeChain.getActiveChainId(),
        };

      case ProviderMethods.NET_VERSION:
        return {
          result: chainIdToNetVersion(this.activeChain.getActiveChainId()),
        };

      case ProviderMethods.WALLET_SWITCH_ETHEREUM_CHAIN:
        return {
          result: await this.switchService.switchEthereumChain({
            origin: input.context.origin,
            params: input.request.params ?? [],
          }),
        };

      case ProviderMethods.WALLET_ADD_ETHEREUM_CHAIN:
        return {
          result: await this.addService.addEthereumChain({
            origin: input.context.origin,
            params: input.request.params ?? [],
          }),
        };

      default:
        throw {
          code: 4200,
          message: `Unsupported chain method: ${method}`,
        };
    }
  }
}
```



---



# 21\. DApp Request Router Service



这是本章主路由。



## `core/router/dapp-request-router.service.ts`



```TypeScript
import { DappBridgeRequest, DappBridgeResult } from '../bridge/dapp-bridge.types';
import { DappProviderResponseBuilder } from '../bridge/dapp-provider-response-builder';
import { ProviderErrors } from '../../shared/errors/provider-errors';
import {
  DappRequestRouterDeps,
  DappRequestRouterOptions,
} from './dapp-router.types';
import { classifyProviderMethod } from './method-classifier';

export class DappRequestRouterService {
  constructor(
    private readonly deps: DappRequestRouterDeps,
    private readonly options: DappRequestRouterOptions = {
      strictUnsupportedMethods: true,
    },
  ) {}

  async handle(input: DappBridgeRequest): Promise {
    const id = input.request.id ?? null;

    try {
      if (!input.request.method) {
        throw ProviderErrors.invalidRequest('JSON-RPC method is required');
      }

      const category = classifyProviderMethod(input.request.method);

      const handler = this.resolveHandler(category);

      if (!handler) {
        throw ProviderErrors.unsupportedMethod(input.request.method);
      }

      const result = await handler.handle(input);

      return {
        requestId: input.requestId,
        response: DappProviderResponseBuilder.success({
          id,
          result: result.result,
        }),
      };
    } catch (error) {
      return {
        requestId: input.requestId,
        response: DappProviderResponseBuilder.error({
          id,
          error,
        }),
      };
    }
  }

  private resolveHandler(category: ReturnType) {
    switch (category) {
      case 'account':
        return this.deps.accountHandler;

      case 'chain':
        return this.deps.chainHandler;

      case 'rpc':
        return this.deps.rpcHandler;

      case 'signing':
        return this.deps.signingHandler;

      case 'transaction':
        return this.deps.transactionHandler;

      case 'watch_asset':
        return this.deps.watchAssetHandler;

      default:
        return null;
    }
  }
}
```



---



# 22\. 组装工厂



为了在 React Native 页面里方便实例化，我们提供一个运行时工厂。



## `core/router/create-dapp-router-runtime.ts`



```TypeScript
import { DEFAULT_EVM_CHAINS } from '../chains/default-chains';
import { InMemoryChainStorageService } from '../chains/chain-storage.service';
import { ChainRegistryService } from '../chains/chain-registry.service';
import { ActiveChainService } from '../chains/active-chain.service';
import { ChainSwitchService, ChainSwitchConfirmService } from '../chains/chain-switch.service';
import { ChainAddService, ChainAddConfirmService } from '../chains/chain-add.service';
import { ChainHandlerService } from '../chains/chain-handler.service';

import { ActiveAccountService, ActiveAccount } from '../accounts/active-account.service';
import { DappAccountService, AccountPermissionConfirmService } from '../accounts/dapp-account.service';

import { RpcHealthService } from '../rpc/rpc-health.service';
import { RpcClientService } from '../rpc/rpc-client.service';
import { RpcRateLimitService } from '../rpc/rpc-rate-limit.service';
import { RpcRouterService } from '../rpc/rpc-router.service';

import { DappRequestRouterService } from './dapp-request-router.service';

export interface CreateDappRouterRuntimeInput {
  initialChainId?: string;
  initialAccount?: ActiveAccount | null;

  accountConfirmService?: AccountPermissionConfirmService;
  chainSwitchConfirmService?: ChainSwitchConfirmService;
  chainAddConfirmService?: ChainAddConfirmService;
}

export function createDappRouterRuntime(input: CreateDappRouterRuntimeInput = {}) {
  const chainStorage = new InMemoryChainStorageService(DEFAULT_EVM_CHAINS);
  const chainRegistry = new ChainRegistryService(chainStorage);
  const activeChain = new ActiveChainService(
    chainRegistry,
    input.initialChainId ?? '0x1',
  );

  const activeAccount = new ActiveAccountService(input.initialAccount ?? null);

  const chainSwitch = new ChainSwitchService(
    chainRegistry,
    activeChain,
    input.chainSwitchConfirmService,
  );

  const chainAdd = new ChainAddService(
    chainRegistry,
    input.chainAddConfirmService,
  );

  const chainHandler = new ChainHandlerService(
    activeChain,
    chainSwitch,
    chainAdd,
  );

  const accountHandler = new DappAccountService(
    activeAccount,
    input.accountConfirmService,
  );

  const rpcHealth = new RpcHealthService();
  const rpcClient = new RpcClientService(rpcHealth);
  const rpcRateLimit = new RpcRateLimitService(30);

  const rpcHandler = new RpcRouterService(
    activeChain,
    rpcClient,
    rpcRateLimit,
  );

  const router = new DappRequestRouterService({
    accountHandler,
    chainHandler,
    rpcHandler,
  });

  return {
    router,

    chainStorage,
    chainRegistry,
    activeChain,
    chainSwitch,
    chainAdd,

    activeAccount,
    accountHandler,

    rpcHealth,
    rpcClient,
    rpcRateLimit,
    rpcHandler,
  };
}
```



---



# 23\. 接入 `SecureDappWebView`



Part 2 的 `SecureDappWebView` 已经有：



```TypeScript
onRequest={async (message) => {
  ...
}}
```



现在升级为完整 Router。



## `ui/screens/DappBrowserScreen.tsx`



```TypeScript
import React, { useMemo } from 'react';
import { Alert, View } from 'react-native';
import { SecureDappWebView } from '../../core/webview/SecureDappWebView';
import { createDappRouterRuntime } from '../../core/router/create-dapp-router-runtime';
import { DappBridgeRequest } from '../../core/bridge/dapp-bridge.types';

export function DappBrowserScreen() {
  const runtime = useMemo(() => {
    return createDappRouterRuntime({
      initialChainId: '0x1',
      initialAccount: {
        accountId: 'account-1',
        address: '0x1234567890abcdef1234567890abcdef12345678',
        name: 'Main Wallet',
      },

      accountConfirmService: {
        confirmConnect: async (input) => {
          return new Promise((resolve) => {
            Alert.alert(
              '连接 DApp',
              `${input.hostname} 请求连接钱包\\n\\n地址：${input.address}`,
              [
                {
                  text: '拒绝',
                  style: 'cancel',
                  onPress: () => resolve(false),
                },
                {
                  text: '连接',
                  onPress: () => resolve(true),
                },
              ],
            );
          });
        },
      },

      chainSwitchConfirmService: {
        confirmSwitch: async (input) => {
          return new Promise((resolve) => {
            Alert.alert(
              '切换网络',
              `${input.origin} 请求切换网络：\\n${input.fromChainId} -> ${input.chainName}`,
              [
                {
                  text: '拒绝',
                  style: 'cancel',
                  onPress: () => resolve(false),
                },
                {
                  text: '切换',
                  onPress: () => resolve(true),
                },
              ],
            );
          });
        },
      },

      chainAddConfirmService: {
        confirmAddChain: async (input) => {
          return new Promise((resolve) => {
            Alert.alert(
              '添加网络',
              `${input.origin} 请求添加网络：\\n${input.chain.chainName}`,
              [
                {
                  text: '拒绝',
                  style: 'cancel',
                  onPress: () => resolve(false),
                },
                {
                  text: '添加',
                  onPress: () => resolve(true),
                },
              ],
            );
          });
        },
      },
    });
  }, []);

  return (
    
       {
          const payload = message.payload;

          const result = await runtime.router.handle({
            requestId: payload.requestId,
            context: {
              requestId: payload.requestId,
              source: 'webview',
              origin: payload.origin,
              hostname: payload.hostname,
              url: payload.href,
              accountId: 'account-1',
              address: runtime.activeAccount.getActiveAccount()?.address,
              chainId: runtime.activeChain.getActiveChainId(),
              userId: '10001',
            },
            request: payload.request,
          } satisfies DappBridgeRequest);

          if ('error' in result.response && result.response.error) {
            throw result.response.error;
          }

          return (result.response as any).result;
        }}
      />
    
  );
}
```



> 注意：这里为了适配 Part 2 中 `onRequest` 的签名，`onRequest` 返回的是 `result`，然后 `SecureDappWebView` 再包装 response。  
> 
> 如果你想让 `onRequest` 直接返回完整 JSON\-RPC response，也可以在 Part 2 中调整 `SecureDappWebView`。
> 
> 



---



# 24\. 更推荐的 SecureDappWebView 接入方式



生产建议把 `SecureDappWebView` 的 `onRequest` 改成：



```TypeScript
onProviderRequest?: (input: DappProviderRequestMessage, ctx: WebViewMessageContext) => Promise;
```



这样避免重复包装。



但为了保持前文代码兼容，本章先不改组件接口。



---



# 25\. 测试：DApp 侧调用



打开任意 DApp 后，在页面 console 或 DApp 代码中：



## 25\.1 `eth_chainId`



```TypeScript
await window.ethereum.request({
  method: 'eth_chainId',
});
```



期望：



```TypeScript
'0x1'
```



---



## 25\.2 `net_version`



```TypeScript
await window.ethereum.request({
  method: 'net_version',
});
```



期望：



```TypeScript
'1'
```



---



## 25\.3 `eth_accounts`



未连接前：



```TypeScript
await window.ethereum.request({
  method: 'eth_accounts',
});
```



期望：



```TypeScript
[]
```



---



## 25\.4 `eth_requestAccounts`



```TypeScript
await window.ethereum.request({
  method: 'eth_requestAccounts',
});
```



弹窗确认后：



```TypeScript
['0x1234567890abcdef1234567890abcdef12345678']
```



---



## 25\.5 RPC 透传



```TypeScript
await window.ethereum.request({
  method: 'eth_blockNumber',
});
```



期望：



```TypeScript
'0x...'
```



---



## 25\.6 查询余额



```TypeScript
await window.ethereum.request({
  method: 'eth_getBalance',
  params: [
    '0x1234567890abcdef1234567890abcdef12345678',
    'latest'
  ],
});
```



期望：



```TypeScript
'0x...'
```



---



## 25\.7 切换 BSC



```TypeScript
await window.ethereum.request({
  method: 'wallet_switchEthereumChain',
  params: [
    {
      chainId: '0x38',
    },
  ],
});
```



期望：



```TypeScript
null
```



并且 Provider 应收到：



```TypeScript
chainChanged: '0x38'
```



> Part 3 中 Runtime 已切链，但 `SecureDappWebView` 还需要监听 `activeChain.onChanged` 后调用 `WebViewEventDispatcher.chainChanged`。下一小节补齐。
> 
> 



---



# 26\. 切链后事件同步



在 `DappBrowserScreen.tsx` 中增加：



```TypeScript
import React, { useEffect, useMemo, useRef } from 'react';
```



但当前 `SecureDappWebView` 内部持有 dispatcher，外部拿不到。生产建议给 `SecureDappWebView` 暴露 ref API。



本章先给设计。



## `core/webview/SecureDappWebView.ref.ts`



```TypeScript
export interface SecureDappWebViewHandle {
  reload(): void;
  goBack(): void;
  goForward(): void;
  syncProviderState(state: {
    chainId?: string;
    selectedAddress?: string | null;
    accounts?: string[];
    isConnected?: boolean;
    isUnlocked?: boolean;
  }): void;
  emitProviderEvent(event: string, data: unknown): void;
}
```



后续 Part 4 会把 `SecureDappWebView` 改成 `forwardRef`，支持：



```TypeScript
webViewHandle.current?.emitProviderEvent('chainChanged', '0x38');
webViewHandle.current?.emitProviderEvent('accountsChanged', [address]);
```



---



# 27\. 本章完成内容



本章完成了：



```Plain Text
DApp Request Router
Provider 方法分类
Chain Registry
默认 EVM 主网配置
Active Chain
wallet_switchEthereumChain
wallet_addEthereumChain
eth_chainId
net_version
Active Account
eth_accounts
eth_requestAccounts 基础授权
wallet_getPermissions
wallet_requestPermissions
RPC Client
RPC Retry
RPC Timeout
RPC Health
RPC Rate Limit
RPC Router
Runtime 组装工厂
DappBrowserScreen 接入示例
```



现在 DApp 浏览器已经具备真实 EIP\-1193 基础能力：



```Plain Text
账户连接
链查询
切链
加链
RPC 读取链上数据
```



---



# 28\. 下一章继续



下一段建议继续写：



**《DApp 浏览器 Part 4：DApp Session 权限系统 \+ 多账户权限隔离》**



将覆盖：



```Plain Text
DApp Session Repository
Session 持久化
origin 权限隔离
account 权限隔离
chain 权限隔离
权限过期
权限撤销
eth_accounts 根据 session 返回
eth_requestAccounts 创建 session
wallet_getPermissions
wallet_requestPermissions
DApp Sessions 页面
切账户后 accountsChanged
切链后 chainChanged
SecureDappWebView forwardRef 事件同步
```



这章完成后，DApp 授权将从临时内存升级为生产级 Session 权限体系。

