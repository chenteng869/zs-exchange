# H02\-《DApp 浏览器 Part 1：类型系统、错误系统、EIP\-1193 Provider 注入》

# 《DApp 浏览器 Part 1：类型系统、错误系统、EIP\-1193 Provider 注入》



本章开始正式落地 **工业级 DApp 浏览器代码地基**，覆盖：



- 全局类型系统

- EIP\-1193 类型

- Provider RPC 错误体系

- DApp 错误体系

- Provider 支持方法定义

- Provider 事件系统

- WebView 注入脚本

- `window.ethereum`

- `window.web3.currentProvider`

- `request`

- `send`

- `sendAsync`

- `on`

- `removeListener`

- `emit`

- Native Bridge 消息协议

- Provider 状态同步

- 兼容常见 DApp 检测逻辑

    

本章代码是后续所有模块的基础：



```Plain Text
WebView
  -> Injected Provider
  -> DApp JSON-RPC Request
  -> Native Bridge
  -> App Request Router
  -> Wallet / RPC / Signing / Tx
```



---



# 1\. 本章目录结构



```Bash
src/modules/dapp-browser/
  shared/
    types/
      dapp.types.ts
      eip1193.types.ts
      chain.types.ts
      security.types.ts
      bridge.types.ts
      audit.types.ts
    errors/
      provider-errors.ts
      dapp-errors.ts
    utils/
      json.ts
      origin.ts
      hex.ts

  core/
    provider/
      provider-methods.ts
      provider-events.ts
      injected-provider.ts
      injected-provider-source.ts
      provider-state.ts
```



---



# 2\. DApp 基础类型



## `shared/types/dapp.types.ts`



```TypeScript
export type DappSource =
  | 'webview'
  | 'walletconnect'
  | 'deeplink'
  | 'internal';

export type DappStatus =
  | 'active'
  | 'hidden'
  | 'blocked'
  | 'pending_review';

export type DappRiskLevel =
  | 'low'
  | 'medium'
  | 'high'
  | 'critical'
  | 'blocked';

export type DappCategory =
  | 'dex'
  | 'lending'
  | 'nft'
  | 'gamefi'
  | 'bridge'
  | 'staking'
  | 'tools'
  | 'social'
  | 'wallet'
  | 'featured'
  | 'other';

export interface DappItem {
  dappId: string;
  name: string;
  description?: string;
  iconUrl?: string;
  url: string;
  origin: string;
  hostname: string;
  category: DappCategory;
  chains: string[];
  tags: string[];
  featured: boolean;
  sortOrder: number;
  riskLevel: DappRiskLevel;
  status: DappStatus;
  createdAt: number;
  updatedAt: number;
}

export interface DappFavorite {
  favoriteId: string;
  userId: string;
  dappId: string;
  origin: string;
  createdAt: number;
}

export interface DappRecentVisit {
  visitId: string;
  userId: string;
  dappId?: string;
  origin: string;
  url: string;
  title?: string;
  iconUrl?: string;
  visitedAt: number;
}

export type DappPermission =
  | 'accounts'
  | 'sign_message'
  | 'sign_typed_data'
  | 'send_transaction'
  | 'switch_chain'
  | 'add_chain'
  | 'watch_asset'
  | 'walletconnect';

export interface DappSession {
  sessionId: string;
  source: DappSource;
  origin: string;
  hostname: string;
  dappId?: string;

  accountId: string;
  address: string;
  chainId: string;

  permissions: DappPermission[];

  connectedAt: number;
  updatedAt: number;
  expiresAt?: number;
  revokedAt?: number;

  metadata?: {
    name?: string;
    icon?: string;
    description?: string;
    url?: string;
  };
}

export interface DappBrowserTab {
  tabId: string;
  url: string;
  origin: string;
  hostname: string;
  title?: string;
  iconUrl?: string;
  canGoBack: boolean;
  canGoForward: boolean;
  loading: boolean;
  securityState: 'secure' | 'warning' | 'blocked';
  createdAt: number;
  updatedAt: number;
}

export interface DappConnectRequest {
  requestId: string;
  origin: string;
  hostname: string;
  dappId?: string;
  accountId: string;
  address: string;
  chainId: string;
  requestedPermissions: DappPermission[];
  source: DappSource;
  createdAt: number;
}

export interface DappRequestContext {
  requestId: string;
  source: DappSource;
  origin: string;
  hostname: string;
  url?: string;
  dappId?: string;
  tabId?: string;
  accountId: string;
  address?: string;
  chainId: string;
  userId?: string;
}
```



---



# 3\. Chain 类型



## `shared/types/chain.types.ts`



```TypeScript
export type ChainNamespace =
  | 'eip155'
  | 'solana'
  | 'tron'
  | 'bitcoin'
  | 'sui'
  | 'aptos';

export interface NativeCurrency {
  name: string;
  symbol: string;
  decimals: number;
}

export interface ChainConfig {
  chainId: string;
  namespace: ChainNamespace;
  numericChainId?: number;
  name: string;
  shortName?: string;
  rpcUrls: string[];
  fallbackRpcUrls?: string[];
  blockExplorerUrls: string[];
  nativeCurrency: NativeCurrency;
  iconUrl?: string;
  enabled: boolean;
  testnet: boolean;
}

export interface Eip155ChainConfig extends ChainConfig {
  namespace: 'eip155';
  chainId: `0x${string}`;
  numericChainId: number;
}

export interface WalletAddEthereumChainParameter {
  chainId: `0x${string}`;
  chainName: string;
  nativeCurrency?: NativeCurrency;
  rpcUrls: string[];
  blockExplorerUrls?: string[];
  iconUrls?: string[];
}

export interface WalletSwitchEthereumChainParameter {
  chainId: `0x${string}`;
}

export interface ChainChangedEventPayload {
  chainId: string;
  namespace: ChainNamespace;
}

export interface AccountChangedEventPayload {
  accounts: string[];
}
```



---



# 4\. Security 类型



## `shared/types/security.types.ts`



```TypeScript
export type SecurityRiskLevel =
  | 'none'
  | 'low'
  | 'medium'
  | 'high'
  | 'critical'
  | 'blocked';

export type SecurityDecisionAction =
  | 'allow'
  | 'warn'
  | 'block'
  | 'require_extra_confirm';

export interface SecurityDecision {
  allowed: boolean;
  action: SecurityDecisionAction;
  riskLevel: SecurityRiskLevel;
  reasons: string[];
  metadata?: Record;
}

export interface UrlSecurityResult extends SecurityDecision {
  url: string;
  origin: string;
  hostname: string;
}

export interface ContractSecurityResult extends SecurityDecision {
  chainId: string;
  contractAddress: string;
}

export interface TransactionSecurityResult extends SecurityDecision {
  chainId: string;
  from?: string;
  to?: string;
  value?: string;
  data?: string;
}

export interface ParsedTransactionIntent {
  type:
    | 'native_transfer'
    | 'erc20_transfer'
    | 'erc20_approve'
    | 'erc721_transfer'
    | 'erc721_approve'
    | 'erc721_set_approval_for_all'
    | 'erc1155_set_approval_for_all'
    | 'swap'
    | 'bridge'
    | 'contract_interaction'
    | 'contract_creation'
    | 'unknown';

  contractAddress?: string;
  methodSelector?: string;
  methodName?: string;

  from?: string;
  to?: string;
  spender?: string;
  operator?: string;

  tokenAddress?: string;
  tokenSymbol?: string;
  tokenDecimals?: number;

  amount?: string;
  value?: string;

  unlimitedApproval?: boolean;

  raw: {
    to?: string;
    value?: string;
    data?: string;
  };
}
```



---



# 5\. Audit 类型



## `shared/types/audit.types.ts`



```TypeScript
export type DappAuditAction =
  | 'dapp.open'
  | 'dapp.connect.requested'
  | 'dapp.connect.approved'
  | 'dapp.connect.rejected'
  | 'dapp.permission.revoked'
  | 'dapp.rpc.requested'
  | 'dapp.rpc.succeeded'
  | 'dapp.rpc.failed'
  | 'dapp.sign.requested'
  | 'dapp.sign.approved'
  | 'dapp.sign.rejected'
  | 'dapp.tx.requested'
  | 'dapp.tx.approved'
  | 'dapp.tx.rejected'
  | 'dapp.tx.broadcasted'
  | 'dapp.chain.switch.requested'
  | 'dapp.chain.switch.approved'
  | 'dapp.chain.switch.rejected'
  | 'security.url.blocked'
  | 'security.contract.blocked'
  | 'security.tx.blocked'
  | 'walletconnect.session.proposed'
  | 'walletconnect.session.approved'
  | 'walletconnect.session.rejected'
  | 'walletconnect.session.deleted'
  | 'walletconnect.request.received'
  | 'walletconnect.request.responded';

export type DappAuditResult =
  | 'success'
  | 'rejected'
  | 'blocked'
  | 'failed';

export interface DappAuditLog {
  auditNo: string;

  action: DappAuditAction;
  result: DappAuditResult;

  source: 'webview' | 'walletconnect' | 'deeplink' | 'internal';

  origin?: string;
  hostname?: string;
  dappId?: string;

  userId?: string;
  accountId?: string;
  address?: string;
  chainId?: string;

  method?: string;
  requestId?: string;
  sessionId?: string;
  tabId?: string;

  requestPayload?: unknown;
  responsePayload?: unknown;

  riskLevel?: string;
  riskReasons?: string[];

  errorCode?: number | string;
  errorMessage?: string;

  ip?: string;
  userAgent?: string;

  createdAt: number;
}
```



---



# 6\. EIP\-1193 类型系统



## `shared/types/eip1193.types.ts`



```TypeScript
export type JsonRpcVersion = '2.0';

export type JsonRpcId = number | string | null;

export interface JsonRpcRequest {
  id?: JsonRpcId;
  jsonrpc?: JsonRpcVersion;
  method: string;
  params?: TParams;
}

export interface JsonRpcSuccess {
  id: JsonRpcId;
  jsonrpc: JsonRpcVersion;
  result: TResult;
}

export interface JsonRpcFailure {
  id: JsonRpcId;
  jsonrpc: JsonRpcVersion;
  error: ProviderRpcErrorLike;
}

export type JsonRpcResponse =
  | JsonRpcSuccess
  | JsonRpcFailure;

export interface ProviderRpcErrorLike {
  code: number;
  message: string;
  data?: TData;
}

export interface Eip1193RequestArguments {
  method: string;
  params?: unknown[] | Record;
}

export type Eip1193Listener = (...args: unknown[]) => void;

export interface Eip1193Provider {
  isConnected(): boolean;

  request(args: Eip1193RequestArguments): Promise;

  on(event: string, listener: Eip1193Listener): this;

  removeListener(event: string, listener: Eip1193Listener): this;

  emit?(event: string, ...args: unknown[]): boolean;
}

export interface Eip1193ConnectInfo {
  chainId: string;
}

export interface ProviderMessage {
  type: string;
  data: unknown;
}

export interface ProviderConnectEvent {
  chainId: string;
}

export interface ProviderDisconnectError {
  code: number;
  message: string;
  data?: unknown;
}

export type ProviderEventName =
  | 'connect'
  | 'disconnect'
  | 'accountsChanged'
  | 'chainChanged'
  | 'message';

export interface EthereumProviderState {
  isConnected: boolean;
  chainId: string | null;
  selectedAddress: string | null;
  accounts: string[];
  isUnlocked: boolean;
}

export interface EthSendTransactionParams {
  from?: string;
  to?: string;
  gas?: string;
  gasPrice?: string;
  value?: string;
  data?: string;
  nonce?: string;
  maxFeePerGas?: string;
  maxPriorityFeePerGas?: string;
  chainId?: string;
}

export interface EthCallParams {
  from?: string;
  to?: string;
  gas?: string;
  gasPrice?: string;
  value?: string;
  data?: string;
}

export interface WatchAssetParams {
  type: 'ERC20' | 'ERC721' | 'ERC1155';
  options: {
    address: string;
    symbol?: string;
    decimals?: number;
    image?: string;
    tokenId?: string;
  };
}
```



---



# 7\. Bridge 消息类型



## `shared/types/bridge.types.ts`



```TypeScript
import {
  JsonRpcRequest,
  JsonRpcResponse,
} from './eip1193.types';

export type DappBridgeMessageType =
  | 'DAPP_PROVIDER_READY'
  | 'DAPP_PROVIDER_REQUEST'
  | 'DAPP_PROVIDER_RESPONSE'
  | 'DAPP_PROVIDER_EVENT'
  | 'DAPP_PROVIDER_STATE_SYNC'
  | 'DAPP_PROVIDER_LOG'
  | 'DAPP_PROVIDER_ERROR';

export interface DappBridgeBaseMessage {
  type: DappBridgeMessageType;
  id?: string;
  payload?: TPayload;
  ts: number;
}

export interface DappProviderReadyPayload {
  provider: 'ethereum';
  version: string;
}

export interface DappProviderRequestPayload {
  requestId: string;
  origin: string;
  hostname: string;
  href: string;
  request: JsonRpcRequest;
}

export interface DappProviderResponsePayload {
  requestId: string;
  response: JsonRpcResponse;
}

export interface DappProviderEventPayload {
  event: string;
  data: unknown;
}

export interface DappProviderStateSyncPayload {
  chainId?: string | null;
  selectedAddress?: string | null;
  accounts?: string[];
  isConnected?: boolean;
  isUnlocked?: boolean;
}

export interface DappProviderLogPayload {
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  data?: unknown;
}

export type DappProviderReadyMessage =
  DappBridgeBaseMessage & {
    type: 'DAPP_PROVIDER_READY';
  };

export type DappProviderRequestMessage =
  DappBridgeBaseMessage & {
    type: 'DAPP_PROVIDER_REQUEST';
  };

export type DappProviderResponseMessage =
  DappBridgeBaseMessage & {
    type: 'DAPP_PROVIDER_RESPONSE';
  };

export type DappProviderEventMessage =
  DappBridgeBaseMessage & {
    type: 'DAPP_PROVIDER_EVENT';
  };

export type DappProviderStateSyncMessage =
  DappBridgeBaseMessage & {
    type: 'DAPP_PROVIDER_STATE_SYNC';
  };

export type DappBridgeMessage =
  | DappProviderReadyMessage
  | DappProviderRequestMessage
  | DappProviderResponseMessage
  | DappProviderEventMessage
  | DappProviderStateSyncMessage
  | DappBridgeBaseMessage;
```



---



# 8\. Provider 错误体系



EIP\-1193 标准错误码：



```Plain Text
4001 用户拒绝
4100 未授权
4200 方法不支持
4900 Provider 断开
4901 当前链未连接
4902 未识别链
```



JSON\-RPC 标准错误：



```Plain Text
-32700 Parse error
-32600 Invalid Request
-32601 Method not found
-32602 Invalid params
-32603 Internal error
```



## `shared/errors/provider-errors.ts`



```TypeScript
import { ProviderRpcErrorLike } from '../types/eip1193.types';

export class ProviderRpcError
  extends Error
  implements ProviderRpcErrorLike {
  public readonly code: number;
  public readonly data?: TData;

  constructor(code: number, message: string, data?: TData) {
    super(message);
    this.name = 'ProviderRpcError';
    this.code = code;
    this.data = data;
  }

  toJSON(): ProviderRpcErrorLike {
    return {
      code: this.code,
      message: this.message,
      data: this.data,
    };
  }
}

export const ProviderErrorCodes = {
  USER_REJECTED: 4001,
  UNAUTHORIZED: 4100,
  UNSUPPORTED_METHOD: 4200,
  DISCONNECTED: 4900,
  CHAIN_DISCONNECTED: 4901,
  UNRECOGNIZED_CHAIN: 4902,

  PARSE_ERROR: -32700,
  INVALID_REQUEST: -32600,
  METHOD_NOT_FOUND: -32601,
  INVALID_PARAMS: -32602,
  INTERNAL_ERROR: -32603,
} as const;

export const ProviderErrors = {
  userRejected: (message = 'User rejected the request', data?: unknown) =>
    new ProviderRpcError(ProviderErrorCodes.USER_REJECTED, message, data),

  unauthorized: (message = 'The requested account and/or method has not been authorized', data?: unknown) =>
    new ProviderRpcError(ProviderErrorCodes.UNAUTHORIZED, message, data),

  unsupportedMethod: (method: string, data?: unknown) =>
    new ProviderRpcError(
      ProviderErrorCodes.UNSUPPORTED_METHOD,
      `Unsupported method: ${method}`,
      data,
    ),

  disconnected: (message = 'Provider disconnected', data?: unknown) =>
    new ProviderRpcError(ProviderErrorCodes.DISCONNECTED, message, data),

  chainDisconnected: (chainId?: string, data?: unknown) =>
    new ProviderRpcError(
      ProviderErrorCodes.CHAIN_DISCONNECTED,
      chainId ? `Chain disconnected: ${chainId}` : 'Chain disconnected',
      data,
    ),

  unrecognizedChain: (chainId?: string, data?: unknown) =>
    new ProviderRpcError(
      ProviderErrorCodes.UNRECOGNIZED_CHAIN,
      chainId ? `Unrecognized chain: ${chainId}` : 'Unrecognized chain',
      data,
    ),

  parseError: (message = 'Parse error', data?: unknown) =>
    new ProviderRpcError(ProviderErrorCodes.PARSE_ERROR, message, data),

  invalidRequest: (message = 'Invalid request', data?: unknown) =>
    new ProviderRpcError(ProviderErrorCodes.INVALID_REQUEST, message, data),

  methodNotFound: (method: string, data?: unknown) =>
    new ProviderRpcError(
      ProviderErrorCodes.METHOD_NOT_FOUND,
      `Method not found: ${method}`,
      data,
    ),

  invalidParams: (message = 'Invalid params', data?: unknown) =>
    new ProviderRpcError(ProviderErrorCodes.INVALID_PARAMS, message, data),

  internal: (message = 'Internal error', data?: unknown) =>
    new ProviderRpcError(ProviderErrorCodes.INTERNAL_ERROR, message, data),
};

export function serializeProviderError(error: unknown): ProviderRpcErrorLike {
  if (error instanceof ProviderRpcError) {
    return error.toJSON();
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
      code: ProviderErrorCodes.INTERNAL_ERROR,
      message: error.message,
    };
  }

  return {
    code: ProviderErrorCodes.INTERNAL_ERROR,
    message: 'Unknown provider error',
    data: error,
  };
}
```



---



# 9\. DApp 业务错误



## `shared/errors/dapp-errors.ts`



```TypeScript
export class DappBrowserError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'DappBrowserError';
  }
}

export const DappErrors = {
  INVALID_URL: (url?: string) =>
    new DappBrowserError('DAPP_INVALID_URL', 'Invalid DApp URL', { url }),

  UNSAFE_URL: (url?: string, reason?: string) =>
    new DappBrowserError('DAPP_UNSAFE_URL', 'Unsafe DApp URL', { url, reason }),

  PHISHING_DOMAIN: (hostname?: string) =>
    new DappBrowserError('DAPP_PHISHING_DOMAIN', 'DApp domain is blocked', { hostname }),

  SESSION_NOT_FOUND: () =>
    new DappBrowserError('DAPP_SESSION_NOT_FOUND', 'DApp session not found'),

  PERMISSION_DENIED: (permission?: string) =>
    new DappBrowserError('DAPP_PERMISSION_DENIED', 'DApp permission denied', { permission }),

  ACCOUNT_NOT_FOUND: () =>
    new DappBrowserError('DAPP_ACCOUNT_NOT_FOUND', 'Wallet account not found'),

  CHAIN_NOT_SUPPORTED: (chainId?: string) =>
    new DappBrowserError('DAPP_CHAIN_NOT_SUPPORTED', 'Chain is not supported', { chainId }),

  BRIDGE_UNAVAILABLE: () =>
    new DappBrowserError('DAPP_BRIDGE_UNAVAILABLE', 'WebView bridge unavailable'),

  REQUEST_TIMEOUT: (method?: string) =>
    new DappBrowserError('DAPP_REQUEST_TIMEOUT', 'DApp request timeout', { method }),

  TRANSACTION_BLOCKED: (reason?: string) =>
    new DappBrowserError('DAPP_TRANSACTION_BLOCKED', 'Transaction blocked by security policy', { reason }),

  SIGNATURE_BLOCKED: (reason?: string) =>
    new DappBrowserError('DAPP_SIGNATURE_BLOCKED', 'Signature blocked by security policy', { reason }),
};
```



---



# 10\. JSON 工具



## `shared/utils/json.ts`



```TypeScript
export function safeJsonParse(value: unknown): T | null {
  if (typeof value !== 'string') {
    return value as T;
  }

  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

export function safeJsonStringify(value: unknown): string {
  return JSON.stringify(value, (_, item) => {
    if (typeof item === 'bigint') return item.toString();

    if (
      item &&
      typeof item === 'object' &&
      item.constructor?.name === 'Decimal'
    ) {
      return item.toString();
    }

    return item;
  });
}

export function cloneJson(value: T): T {
  return safeJsonParse(safeJsonStringify(value)) as T;
}
```



---



# 11\. Origin 工具



## `shared/utils/origin.ts`



```TypeScript
export interface ParsedDappUrl {
  href: string;
  origin: string;
  hostname: string;
  protocol: string;
  pathname: string;
  search: string;
  hash: string;
}

export function parseDappUrl(url: string): ParsedDappUrl {
  const parsed = new URL(url);

  return {
    href: parsed.href,
    origin: parsed.origin,
    hostname: parsed.hostname,
    protocol: parsed.protocol,
    pathname: parsed.pathname,
    search: parsed.search,
    hash: parsed.hash,
  };
}

export function getOrigin(url: string): string {
  return parseDappUrl(url).origin;
}

export function getHostname(url: string): string {
  return parseDappUrl(url).hostname;
}

export function isHttpsUrl(url: string): boolean {
  try {
    return new URL(url).protocol === 'https:';
  } catch {
    return false;
  }
}

export function normalizeOrigin(originOrUrl: string): string {
  const parsed = new URL(originOrUrl);
  return parsed.origin;
}
```



---



# 12\. Hex 工具



## `shared/utils/hex.ts`



```TypeScript
export function isHexString(value: unknown): value is `0x${string}` {
  return typeof value === 'string' && /^0x[0-9a-fA-F]*$/.test(value);
}

export function stripHexPrefix(value: string): string {
  return value.startsWith('0x') ? value.slice(2) : value;
}

export function addHexPrefix(value: string): `0x${string}` {
  return value.startsWith('0x') ? value as `0x${string}` : `0x${value}`;
}

export function hexToNumber(value: string): number {
  return Number.parseInt(stripHexPrefix(value), 16);
}

export function numberToHex(value: number): `0x${string}` {
  return `0x${value.toString(16)}`;
}

export function normalizeHex(value: string): `0x${string}` {
  return addHexPrefix(stripHexPrefix(value).toLowerCase());
}

export function isZeroAddress(address: string): boolean {
  return /^0x0{40}$/i.test(address);
}
```



---



# 13\. Provider 支持方法定义



## `core/provider/provider-methods.ts`



```TypeScript
export const ProviderMethods = {
  ETH_REQUEST_ACCOUNTS: 'eth_requestAccounts',
  ETH_ACCOUNTS: 'eth_accounts',
  WALLET_REQUEST_PERMISSIONS: 'wallet_requestPermissions',
  WALLET_GET_PERMISSIONS: 'wallet_getPermissions',

  ETH_CHAIN_ID: 'eth_chainId',
  NET_VERSION: 'net_version',
  WALLET_SWITCH_ETHEREUM_CHAIN: 'wallet_switchEthereumChain',
  WALLET_ADD_ETHEREUM_CHAIN: 'wallet_addEthereumChain',

  PERSONAL_SIGN: 'personal_sign',
  ETH_SIGN: 'eth_sign',
  ETH_SIGN_TYPED_DATA: 'eth_signTypedData',
  ETH_SIGN_TYPED_DATA_V3: 'eth_signTypedData_v3',
  ETH_SIGN_TYPED_DATA_V4: 'eth_signTypedData_v4',

  ETH_SEND_TRANSACTION: 'eth_sendTransaction',
  ETH_SEND_RAW_TRANSACTION: 'eth_sendRawTransaction',
  ETH_ESTIMATE_GAS: 'eth_estimateGas',
  ETH_GAS_PRICE: 'eth_gasPrice',
  ETH_FEE_HISTORY: 'eth_feeHistory',
  ETH_MAX_PRIORITY_FEE_PER_GAS: 'eth_maxPriorityFeePerGas',

  ETH_CALL: 'eth_call',
  ETH_GET_BALANCE: 'eth_getBalance',
  ETH_BLOCK_NUMBER: 'eth_blockNumber',
  ETH_GET_TRANSACTION_BY_HASH: 'eth_getTransactionByHash',
  ETH_GET_TRANSACTION_RECEIPT: 'eth_getTransactionReceipt',
  ETH_GET_CODE: 'eth_getCode',
  ETH_GET_LOGS: 'eth_getLogs',
  ETH_GET_BLOCK_BY_NUMBER: 'eth_getBlockByNumber',
  ETH_GET_BLOCK_BY_HASH: 'eth_getBlockByHash',

  WALLET_WATCH_ASSET: 'wallet_watchAsset',
} as const;

export type ProviderMethod =
  typeof ProviderMethods[keyof typeof ProviderMethods];

export const AccountMethods = new Set([
  ProviderMethods.ETH_REQUEST_ACCOUNTS,
  ProviderMethods.ETH_ACCOUNTS,
  ProviderMethods.WALLET_REQUEST_PERMISSIONS,
  ProviderMethods.WALLET_GET_PERMISSIONS,
]);

export const ChainMethods = new Set([
  ProviderMethods.ETH_CHAIN_ID,
  ProviderMethods.NET_VERSION,
  ProviderMethods.WALLET_SWITCH_ETHEREUM_CHAIN,
  ProviderMethods.WALLET_ADD_ETHEREUM_CHAIN,
]);

export const SigningMethods = new Set([
  ProviderMethods.PERSONAL_SIGN,
  ProviderMethods.ETH_SIGN,
  ProviderMethods.ETH_SIGN_TYPED_DATA,
  ProviderMethods.ETH_SIGN_TYPED_DATA_V3,
  ProviderMethods.ETH_SIGN_TYPED_DATA_V4,
]);

export const TransactionMethods = new Set([
  ProviderMethods.ETH_SEND_TRANSACTION,
  ProviderMethods.ETH_SEND_RAW_TRANSACTION,
]);

export const RpcProxyMethods = new Set([
  ProviderMethods.ETH_ESTIMATE_GAS,
  ProviderMethods.ETH_GAS_PRICE,
  ProviderMethods.ETH_FEE_HISTORY,
  ProviderMethods.ETH_MAX_PRIORITY_FEE_PER_GAS,
  ProviderMethods.ETH_CALL,
  ProviderMethods.ETH_GET_BALANCE,
  ProviderMethods.ETH_BLOCK_NUMBER,
  ProviderMethods.ETH_GET_TRANSACTION_BY_HASH,
  ProviderMethods.ETH_GET_TRANSACTION_RECEIPT,
  ProviderMethods.ETH_GET_CODE,
  ProviderMethods.ETH_GET_LOGS,
  ProviderMethods.ETH_GET_BLOCK_BY_NUMBER,
  ProviderMethods.ETH_GET_BLOCK_BY_HASH,
]);

export function isKnownProviderMethod(method: string): boolean {
  return Object.values(ProviderMethods).includes(method as ProviderMethod);
}
```



---



# 14\. Provider 事件定义



## `core/provider/provider-events.ts`



```TypeScript
import { ProviderEventName } from '../../shared/types/eip1193.types';

export const ProviderEvents = {
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  ACCOUNTS_CHANGED: 'accountsChanged',
  CHAIN_CHANGED: 'chainChanged',
  MESSAGE: 'message',
} as const satisfies Record;

export function isProviderEvent(event: string): event is ProviderEventName {
  return [
    ProviderEvents.CONNECT,
    ProviderEvents.DISCONNECT,
    ProviderEvents.ACCOUNTS_CHANGED,
    ProviderEvents.CHAIN_CHANGED,
    ProviderEvents.MESSAGE,
  ].includes(event as ProviderEventName);
}
```



---



# 15\. Provider State



## `core/provider/provider-state.ts`



```TypeScript
import { EthereumProviderState } from '../../shared/types/eip1193.types';

export const DEFAULT_PROVIDER_STATE: EthereumProviderState = {
  isConnected: true,
  chainId: null,
  selectedAddress: null,
  accounts: [],
  isUnlocked: true,
};

export function normalizeProviderState(
  partial?: Partial,
): EthereumProviderState {
  const accounts = partial?.accounts ?? DEFAULT_PROVIDER_STATE.accounts;
  const selectedAddress =
    partial?.selectedAddress ??
    accounts[0] ??
    DEFAULT_PROVIDER_STATE.selectedAddress;

  return {
    isConnected:
      partial?.isConnected ?? DEFAULT_PROVIDER_STATE.isConnected,
    chainId:
      partial?.chainId ?? DEFAULT_PROVIDER_STATE.chainId,
    selectedAddress,
    accounts,
    isUnlocked:
      partial?.isUnlocked ?? DEFAULT_PROVIDER_STATE.isUnlocked,
  };
}
```



---



# 16\. 注入 Provider 主体



下面是注入到 WebView 页面的核心 Provider。



注意：



- 这份代码会被转成字符串注入 WebView。

- 所以它不应依赖 React Native API。

- 它只依赖浏览器环境。

- 必须兼容大量 DApp 对 MetaMask 的检测方式。

    

## `core/provider/injected-provider.ts`



```TypeScript
import {
  Eip1193Listener,
  Eip1193Provider,
  Eip1193RequestArguments,
  EthereumProviderState,
  JsonRpcRequest,
  JsonRpcResponse,
  ProviderRpcErrorLike,
} from '../../shared/types/eip1193.types';

import {
  DappBridgeMessage,
  DappProviderEventMessage,
  DappProviderResponseMessage,
  DappProviderStateSyncMessage,
} from '../../shared/types/bridge.types';

type PendingRequest = {
  method: string;
  createdAt: number;
  timeoutAt: number;
  resolve: (value: unknown) => void;
  reject: (error: ProviderRpcErrorLike) => void;
  timer: ReturnType;
};

type ListenerMap = Map>;

declare global {
  interface Window {
    ethereum?: IndustrialEthereumProvider;
    web3?: {
      currentProvider?: IndustrialEthereumProvider;
    };
    ReactNativeWebView?: {
      postMessage: (message: string) => void;
    };
    __INDUSTRIAL_DAPP_PROVIDER__?: IndustrialEthereumProvider;
    __INDUSTRIAL_DAPP_PROVIDER_VERSION__?: string;
  }
}

const PROVIDER_VERSION = '1.0.0-industrial';
const REQUEST_TIMEOUT_MS = 60_000;

export class IndustrialEthereumProvider implements Eip1193Provider {
  public readonly isMetaMask = true;
  public readonly isIndustrialWallet = true;
  public readonly isWalletConnect = false;

  public selectedAddress: string | null = null;
  public chainId: string | null = null;
  public networkVersion: string | null = null;

  private isConnectedValue = true;
  private isUnlockedValue = true;
  private accountsValue: string[] = [];

  private readonly listeners: ListenerMap = new Map();
  private readonly pending = new Map();

  private requestSequence = 1;

  constructor(initialState?: Partial) {
    this.applyState(initialState ?? {});
    this.bindIncomingMessages();
    this.postReady();
  }

  isConnected(): boolean {
    return this.isConnectedValue;
  }

  async request(args: Eip1193RequestArguments): Promise {
    this.assertValidRequestArgs(args);

    const id = this.nextRequestId();

    const params = this.normalizeParams(args.params);

    const request: JsonRpcRequest = {
      id,
      jsonrpc: '2.0',
      method: args.method,
      params,
    };

    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        if (!this.pending.has(id)) return;

        this.pending.delete(id);

        reject({
          code: 4900,
          message: `Request timeout: ${args.method}`,
          data: {
            method: args.method,
            timeoutMs: REQUEST_TIMEOUT_MS,
          },
        });
      }, REQUEST_TIMEOUT_MS);

      this.pending.set(id, {
        method: args.method,
        createdAt: Date.now(),
        timeoutAt: Date.now() + REQUEST_TIMEOUT_MS,
        resolve: resolve as (value: unknown) => void,
        reject,
        timer,
      });

      this.postRequest(request);
    });
  }

  send(
    methodOrPayload: string | JsonRpcRequest | JsonRpcRequest[],
    paramsOrCallback?: unknown,
  ): unknown {
    if (typeof methodOrPayload === 'string') {
      return this.request({
        method: methodOrPayload,
        params: Array.isArray(paramsOrCallback)
          ? paramsOrCallback
          : paramsOrCallback !== undefined
            ? [paramsOrCallback]
            : [],
      });
    }

    if (Array.isArray(methodOrPayload)) {
      if (typeof paramsOrCallback === 'function') {
        Promise.all(
          methodOrPayload.map((payload) =>
            this.request({
              method: payload.method,
              params: payload.params as any,
            }).then((result) => ({
              id: payload.id ?? null,
              jsonrpc: '2.0',
              result,
            })),
          ),
        )
          .then((responses) => paramsOrCallback(null, responses))
          .catch((error) => paramsOrCallback(error, null));
      }

      return;
    }

    if (typeof paramsOrCallback === 'function') {
      this.request({
        method: methodOrPayload.method,
        params: methodOrPayload.params as any,
      })
        .then((result) => {
          paramsOrCallback(null, {
            id: methodOrPayload.id ?? null,
            jsonrpc: '2.0',
            result,
          });
        })
        .catch((error) => {
          paramsOrCallback(error, null);
        });

      return;
    }

    return this.request({
      method: methodOrPayload.method,
      params: methodOrPayload.params as any,
    });
  }

  sendAsync(
    payload: JsonRpcRequest | JsonRpcRequest[],
    callback: (error: unknown, response?: unknown) => void,
  ): void {
    this.send(payload as any, callback);
  }

  enable(): Promise {
    return this.request({
      method: 'eth_requestAccounts',
    });
  }

  on(event: string, listener: Eip1193Listener): this {
    if (typeof listener !== 'function') {
      throw new Error('Listener must be a function');
    }

    const listeners = this.listeners.get(event) ?? new Set();
    listeners.add(listener);
    this.listeners.set(event, listeners);

    return this;
  }

  once(event: string, listener: Eip1193Listener): this {
    const wrapper: Eip1193Listener = (...args) => {
      this.removeListener(event, wrapper);
      listener(...args);
    };

    return this.on(event, wrapper);
  }

  removeListener(event: string, listener: Eip1193Listener): this {
    const listeners = this.listeners.get(event);
    if (!listeners) return this;

    listeners.delete(listener);

    if (listeners.size === 0) {
      this.listeners.delete(event);
    }

    return this;
  }

  off(event: string, listener: Eip1193Listener): this {
    return this.removeListener(event, listener);
  }

  removeAllListeners(event?: string): this {
    if (event) {
      this.listeners.delete(event);
    } else {
      this.listeners.clear();
    }

    return this;
  }

  emit(event: string, ...args: unknown[]): boolean {
    const listeners = this.listeners.get(event);
    if (!listeners || listeners.size === 0) return false;

    for (const listener of Array.from(listeners)) {
      try {
        listener(...args);
      } catch (error) {
        this.log('error', 'Provider listener error', {
          event,
          error: stringifyError(error),
        });
      }
    }

    return true;
  }

  /**
   * 非标准但大量 DApp 会探测。
   */
  _metamask = {
    isUnlocked: async () => this.isUnlockedValue,
  };

  /**
   * Native 主动推状态时调用。
   */
  _applyNativeState(state: Partial) {
    const beforeAccounts = this.accountsValue;
    const beforeChainId = this.chainId;

    this.applyState(state);

    if (
      state.accounts &&
      JSON.stringify(beforeAccounts) !== JSON.stringify(this.accountsValue)
    ) {
      this.emit('accountsChanged', this.accountsValue);
    }

    if (state.chainId && state.chainId !== beforeChainId) {
      this.emit('chainChanged', state.chainId);
    }
  }

  /**
   * Native 主动推事件时调用。
   */
  _emitNativeEvent(event: string, data: unknown) {
    if (event === 'accountsChanged' && Array.isArray(data)) {
      this.accountsValue = data as string[];
      this.selectedAddress = this.accountsValue[0] ?? null;
    }

    if (event === 'chainChanged' && typeof data === 'string') {
      this.chainId = data;
      this.networkVersion = hexChainIdToDecimalString(data);
    }

    if (event === 'connect' && data && typeof data === 'object') {
      const chainId = (data as any).chainId;
      if (typeof chainId === 'string') {
        this.chainId = chainId;
        this.networkVersion = hexChainIdToDecimalString(chainId);
      }

      this.isConnectedValue = true;
    }

    if (event === 'disconnect') {
      this.isConnectedValue = false;
    }

    this.emit(event, data);
  }

  private assertValidRequestArgs(args: Eip1193RequestArguments) {
    if (!args || typeof args !== 'object') {
      throw {
        code: -32600,
        message: 'Invalid request arguments',
      };
    }

    if (typeof args.method !== 'string' || args.method.length === 0) {
      throw {
        code: -32600,
        message: 'Invalid request method',
      };
    }
  }

  private normalizeParams(params: unknown): unknown[] {
    if (params === undefined || params === null) return [];
    if (Array.isArray(params)) return params;
    return [params];
  }

  private nextRequestId(): number {
    return this.requestSequence++;
  }

  private postReady() {
    this.postBridgeMessage({
      type: 'DAPP_PROVIDER_READY',
      payload: {
        provider: 'ethereum',
        version: PROVIDER_VERSION,
      },
      ts: Date.now(),
    });
  }

  private postRequest(request: JsonRpcRequest) {
    const href = safeGetHref();
    const origin = safeGetOrigin();
    const hostname = safeGetHostname();

    this.postBridgeMessage({
      type: 'DAPP_PROVIDER_REQUEST',
      id: String(request.id),
      payload: {
        requestId: String(request.id),
        origin,
        hostname,
        href,
        request,
      },
      ts: Date.now(),
    });
  }

  private postBridgeMessage(message: any) {
    const serialized = JSON.stringify(message);

    if (window.ReactNativeWebView?.postMessage) {
      window.ReactNativeWebView.postMessage(serialized);
      return;
    }

    /**
     * iOS WKWebView 可选桥。
     */
    const webkitBridge = (window as any).webkit?.messageHandlers?.dappBrowser;
    if (webkitBridge?.postMessage) {
      webkitBridge.postMessage(serialized);
      return;
    }

    this.log('error', 'Native bridge unavailable', message);
  }

  private bindIncomingMessages() {
    const handler = (raw: unknown) => {
      const message = parseIncomingMessage(raw);
      if (!message) return;

      this.handleBridgeMessage(message);
    };

    window.addEventListener('message', (event) => {
      handler(event.data);
    });

    /**
     * Android React Native WebView 兼容。
     */
    document.addEventListener('message' as any, (event: any) => {
      handler(event.data);
    });
  }

  private handleBridgeMessage(message: DappBridgeMessage) {
    if (message.type === 'DAPP_PROVIDER_RESPONSE') {
      this.handleResponse(message as DappProviderResponseMessage);
      return;
    }

    if (message.type === 'DAPP_PROVIDER_EVENT') {
      this.handleEvent(message as DappProviderEventMessage);
      return;
    }

    if (message.type === 'DAPP_PROVIDER_STATE_SYNC') {
      this.handleStateSync(message as DappProviderStateSyncMessage);
    }
  }

  private handleResponse(message: DappProviderResponseMessage) {
    const response = message.payload?.response as JsonRpcResponse | undefined;
    const requestId = Number(message.payload?.requestId ?? response?.id);

    if (!Number.isFinite(requestId)) return;

    const pending = this.pending.get(requestId);
    if (!pending) return;

    clearTimeout(pending.timer);
    this.pending.delete(requestId);

    if (!response) {
      pending.reject({
        code: -32603,
        message: 'Empty provider response',
      });
      return;
    }

    if ('error' in response && response.error) {
      pending.reject(response.error);
      return;
    }

    pending.resolve((response as any).result);
  }

  private handleEvent(message: DappProviderEventMessage) {
    const event = message.payload?.event;
    const data = message.payload?.data;

    if (!event) return;

    this._emitNativeEvent(event, data);
  }

  private handleStateSync(message: DappProviderStateSyncMessage) {
    this._applyNativeState(message.payload ?? {});
  }

  private applyState(state: Partial) {
    if (typeof state.isConnected === 'boolean') {
      this.isConnectedValue = state.isConnected;
    }

    if (typeof state.isUnlocked === 'boolean') {
      this.isUnlockedValue = state.isUnlocked;
    }

    if (typeof state.chainId === 'string' || state.chainId === null) {
      this.chainId = state.chainId;
      this.networkVersion = state.chainId
        ? hexChainIdToDecimalString(state.chainId)
        : null;
    }

    if (Array.isArray(state.accounts)) {
      this.accountsValue = state.accounts;
      this.selectedAddress = state.accounts[0] ?? null;
    }

    if (typeof state.selectedAddress === 'string' || state.selectedAddress === null) {
      this.selectedAddress = state.selectedAddress;
      if (
        state.selectedAddress &&
        !this.accountsValue.includes(state.selectedAddress)
      ) {
        this.accountsValue = [state.selectedAddress];
      }
    }
  }

  private log(level: 'debug' | 'info' | 'warn' | 'error', message: string, data?: unknown) {
    try {
      this.postBridgeMessage({
        type: 'DAPP_PROVIDER_LOG',
        payload: {
          level,
          message,
          data,
        },
        ts: Date.now(),
      });
    } catch {
      // ignore
    }
  }
}

function parseIncomingMessage(raw: unknown): DappBridgeMessage | null {
  if (!raw) return null;

  if (typeof raw === 'object') {
    return raw as DappBridgeMessage;
  }

  if (typeof raw !== 'string') return null;

  try {
    return JSON.parse(raw) as DappBridgeMessage;
  } catch {
    return null;
  }
}

function safeGetHref(): string {
  try {
    return window.location.href;
  } catch {
    return '';
  }
}

function safeGetOrigin(): string {
  try {
    return window.location.origin;
  } catch {
    return '';
  }
}

function safeGetHostname(): string {
  try {
    return window.location.hostname;
  } catch {
    return '';
  }
}

function stringifyError(error: unknown): string {
  if (error instanceof Error) return error.message;

  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
}

function hexChainIdToDecimalString(chainId: string): string {
  if (!chainId.startsWith('0x')) return chainId;

  const value = Number.parseInt(chainId.slice(2), 16);
  return Number.isFinite(value) ? String(value) : chainId;
}

export function injectIndustrialEthereumProvider(
  initialState?: Partial,
): IndustrialEthereumProvider {
  if (window.__INDUSTRIAL_DAPP_PROVIDER__) {
    return window.__INDUSTRIAL_DAPP_PROVIDER__;
  }

  const provider = new IndustrialEthereumProvider(initialState);

  Object.defineProperty(window, 'ethereum', {
    value: provider,
    writable: false,
    enumerable: true,
    configurable: false,
  });

  Object.defineProperty(window, 'web3', {
    value: {
      currentProvider: provider,
    },
    writable: false,
    enumerable: true,
    configurable: false,
  });

  window.__INDUSTRIAL_DAPP_PROVIDER__ = provider;
  window.__INDUSTRIAL_DAPP_PROVIDER_VERSION__ = PROVIDER_VERSION;

  /**
   * MetaMask 兼容事件。
   */
  window.dispatchEvent(new Event('ethereum#initialized'));

  /**
   * 部分 DApp 等 DOMContentLoaded 后再读。
   */
  setTimeout(() => {
    window.dispatchEvent(new Event('ethereum#initialized'));
  }, 0);

  return provider;
}
```



---



# 17\. WebView 可注入源码



React Native WebView 需要字符串。这里给出生成方式。



## `core/provider/injected-provider-source.ts`



```TypeScript
/**
 * 生产构建建议：
 *
 * 1. 用 esbuild / rollup 将 injected-provider.ts 打成 IIFE
 * 2. 压缩
 * 3. 输出为字符串
 *
 * 这里先给出可直接使用的源码字符串版本。
 */

export const injectedProviderSource = `
(function () {
  if (window.__INDUSTRIAL_DAPP_PROVIDER__) {
    return true;
  }

  var PROVIDER_VERSION = '1.0.0-industrial';
  var REQUEST_TIMEOUT_MS = 60000;

  function hexChainIdToDecimalString(chainId) {
    if (typeof chainId !== 'string') return chainId;
    if (!chainId.startsWith('0x')) return chainId;
    var value = parseInt(chainId.slice(2), 16);
    return Number.isFinite(value) ? String(value) : chainId;
  }

  function parseIncomingMessage(raw) {
    if (!raw) return null;

    if (typeof raw === 'object') {
      return raw;
    }

    if (typeof raw !== 'string') return null;

    try {
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  }

  function safeGetHref() {
    try {
      return window.location.href;
    } catch (e) {
      return '';
    }
  }

  function safeGetOrigin() {
    try {
      return window.location.origin;
    } catch (e) {
      return '';
    }
  }

  function safeGetHostname() {
    try {
      return window.location.hostname;
    } catch (e) {
      return '';
    }
  }

  function stringifyError(error) {
    if (error && error.message) return error.message;

    try {
      return JSON.stringify(error);
    } catch (e) {
      return String(error);
    }
  }

  function IndustrialEthereumProvider(initialState) {
    this.isMetaMask = true;
    this.isIndustrialWallet = true;
    this.isWalletConnect = false;

    this.selectedAddress = null;
    this.chainId = null;
    this.networkVersion = null;

    this._isConnectedValue = true;
    this._isUnlockedValue = true;
    this._accountsValue = [];

    this._listeners = {};
    this._pending = {};
    this._requestSequence = 1;

    this._metamask = {
      isUnlocked: function () {
        return Promise.resolve(true);
      },
    };

    this._applyState(initialState || {});
    this._bindIncomingMessages();
    this._postReady();
  }

  IndustrialEthereumProvider.prototype.isConnected = function () {
    return this._isConnectedValue;
  };

  IndustrialEthereumProvider.prototype.request = function (args) {
    var self = this;

    if (!args || typeof args !== 'object') {
      return Promise.reject({
        code: -32600,
        message: 'Invalid request arguments',
      });
    }

    if (typeof args.method !== 'string' || args.method.length === 0) {
      return Promise.reject({
        code: -32600,
        message: 'Invalid request method',
      });
    }

    var id = this._requestSequence++;

    var params;
    if (args.params === undefined || args.params === null) {
      params = [];
    } else if (Array.isArray(args.params)) {
      params = args.params;
    } else {
      params = [args.params];
    }

    var request = {
      id: id,
      jsonrpc: '2.0',
      method: args.method,
      params: params,
    };

    return new Promise(function (resolve, reject) {
      var timer = setTimeout(function () {
        if (!self._pending[id]) return;

        delete self._pending[id];

        reject({
          code: 4900,
          message: 'Request timeout: ' + args.method,
          data: {
            method: args.method,
            timeoutMs: REQUEST_TIMEOUT_MS,
          },
        });
      }, REQUEST_TIMEOUT_MS);

      self._pending[id] = {
        method: args.method,
        createdAt: Date.now(),
        timeoutAt: Date.now() + REQUEST_TIMEOUT_MS,
        resolve: resolve,
        reject: reject,
        timer: timer,
      };

      self._postRequest(request);
    });
  };

  IndustrialEthereumProvider.prototype.send = function (methodOrPayload, paramsOrCallback) {
    var self = this;

    if (typeof methodOrPayload === 'string') {
      return this.request({
        method: methodOrPayload,
        params: Array.isArray(paramsOrCallback)
          ? paramsOrCallback
          : paramsOrCallback !== undefined
            ? [paramsOrCallback]
            : [],
      });
    }

    if (Array.isArray(methodOrPayload)) {
      if (typeof paramsOrCallback === 'function') {
        Promise.all(
          methodOrPayload.map(function (payload) {
            return self.request({
              method: payload.method,
              params: payload.params,
            }).then(function (result) {
              return {
                id: payload.id || null,
                jsonrpc: '2.0',
                result: result,
              };
            });
          }),
        )
          .then(function (responses) {
            paramsOrCallback(null, responses);
          })
          .catch(function (error) {
            paramsOrCallback(error, null);
          });
      }

      return;
    }

    if (typeof paramsOrCallback === 'function') {
      this.request({
        method: methodOrPayload.method,
        params: methodOrPayload.params,
      })
        .then(function (result) {
          paramsOrCallback(null, {
            id: methodOrPayload.id || null,
            jsonrpc: '2.0',
            result: result,
          });
        })
        .catch(function (error) {
          paramsOrCallback(error, null);
        });

      return;
    }

    return this.request({
      method: methodOrPayload.method,
      params: methodOrPayload.params,
    });
  };

  IndustrialEthereumProvider.prototype.sendAsync = function (payload, callback) {
    this.send(payload, callback);
  };

  IndustrialEthereumProvider.prototype.enable = function () {
    return this.request({
      method: 'eth_requestAccounts',
    });
  };

  IndustrialEthereumProvider.prototype.on = function (event, listener) {
    if (typeof listener !== 'function') {
      throw new Error('Listener must be a function');
    }

    if (!this._listeners[event]) {
      this._listeners[event] = [];
    }

    this._listeners[event].push(listener);

    return this;
  };

  IndustrialEthereumProvider.prototype.once = function (event, listener) {
    var self = this;

    function wrapper() {
      self.removeListener(event, wrapper);
      listener.apply(null, arguments);
    }

    return this.on(event, wrapper);
  };

  IndustrialEthereumProvider.prototype.removeListener = function (event, listener) {
    var listeners = this._listeners[event];
    if (!listeners) return this;

    this._listeners[event] = listeners.filter(function (item) {
      return item !== listener;
    });

    return this;
  };

  IndustrialEthereumProvider.prototype.off = function (event, listener) {
    return this.removeListener(event, listener);
  };

  IndustrialEthereumProvider.prototype.removeAllListeners = function (event) {
    if (event) {
      delete this._listeners[event];
    } else {
      this._listeners = {};
    }

    return this;
  };

  IndustrialEthereumProvider.prototype.emit = function (event) {
    var listeners = this._listeners[event];
    if (!listeners || listeners.length === 0) return false;

    var args = Array.prototype.slice.call(arguments, 1);

    for (var i = 0; i  {
  console.log('accountsChanged', accounts);
});
```



监听切链：



```TypeScript
window.ethereum.on('chainChanged', (chainId) => {
  console.log('chainChanged', chainId);
});
```



签名：



```TypeScript
const sig = await window.ethereum.request({
  method: 'personal_sign',
  params: ['hello', accounts[0]],
});
```



发交易：



```TypeScript
const txHash = await window.ethereum.request({
  method: 'eth_sendTransaction',
  params: [
    {
      from: accounts[0],
      to: '0x000000000000000000000000000000000000dead',
      value: '0x0',
      data: '0x',
    },
  ],
});
```



---



# 19\. Native 回包格式



WebView Native 侧必须向页面发送：



```TypeScript
webViewRef.current?.postMessage(JSON.stringify({
  type: 'DAPP_PROVIDER_RESPONSE',
  payload: {
    requestId: '1',
    response: {
      id: 1,
      jsonrpc: '2.0',
      result: ['0x1234567890abcdef1234567890abcdef12345678']
    }
  },
  ts: Date.now()
}));
```



失败：



```TypeScript
webViewRef.current?.postMessage(JSON.stringify({
  type: 'DAPP_PROVIDER_RESPONSE',
  payload: {
    requestId: '1',
    response: {
      id: 1,
      jsonrpc: '2.0',
      error: {
        code: 4001,
        message: 'User rejected request'
      }
    }
  },
  ts: Date.now()
}));
```



推账户变化：



```TypeScript
webViewRef.current?.postMessage(JSON.stringify({
  type: 'DAPP_PROVIDER_EVENT',
  payload: {
    event: 'accountsChanged',
    data: ['0x1234567890abcdef1234567890abcdef12345678']
  },
  ts: Date.now()
}));
```



推切链：



```TypeScript
webViewRef.current?.postMessage(JSON.stringify({
  type: 'DAPP_PROVIDER_EVENT',
  payload: {
    event: 'chainChanged',
    data: '0x1'
  },
  ts: Date.now()
}));
```



同步状态：



```TypeScript
webViewRef.current?.postMessage(JSON.stringify({
  type: 'DAPP_PROVIDER_STATE_SYNC',
  payload: {
    chainId: '0x1',
    selectedAddress: '0x1234567890abcdef1234567890abcdef12345678',
    accounts: ['0x1234567890abcdef1234567890abcdef12345678'],
    isConnected: true,
    isUnlocked: true
  },
  ts: Date.now()
}));
```



---



# 20\. 本章完成内容



本章已经完成：



```Plain Text
DApp 类型系统
EIP-1193 类型系统
Bridge 消息协议
安全类型
审计类型
错误体系
Provider 方法定义
Provider 事件定义
Provider 状态
Injected Provider TypeScript 版本
Injected Provider WebView 字符串版本
Native 回包协议
```



这部分就是 DApp 浏览器的“浏览器钱包注入内核”。



---



# 21\. 下一章继续



下一段建议继续写：



**《DApp 浏览器 Part 2：工业级 WebView 安全容器 \+ Bridge 消息路由》**



将覆盖：



```Plain Text
SecureWebView.tsx
Navigation Guard
URL Scheme Guard
External Link Guard
Download Guard
WebView Message Router
Provider Request Handler
Provider Response Dispatcher
Provider Event Dispatcher
多 Tab 状态
页面标题 / favicon 采集
加载状态
错误页
安全警告页
React Native WebView 工业级封装
```



