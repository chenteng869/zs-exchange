export type JsonRpcVersion = '2.0';

export type JsonRpcId = number | string | null;

export interface JsonRpcRequest<TParams = unknown> {
  id?: JsonRpcId;
  jsonrpc?: JsonRpcVersion;
  method: string;
  params?: TParams;
}

export interface JsonRpcSuccess<TResult = unknown> {
  id: JsonRpcId;
  jsonrpc: JsonRpcVersion;
  result: TResult;
}

export interface JsonRpcFailure<TData = unknown> {
  id: JsonRpcId;
  jsonrpc: JsonRpcVersion;
  error: ProviderRpcErrorLike<TData>;
}

export type JsonRpcResponse<TResult = unknown, TData = unknown> =
  | JsonRpcSuccess<TResult>
  | JsonRpcFailure<TData>;

export interface ProviderRpcErrorLike<TData = unknown> {
  code: number;
  message: string;
  data?: TData;
}

export interface Eip1193RequestArguments {
  method: string;
  params?: unknown[] | Record<string, unknown>;
}

export type Eip1193Listener = (...args: unknown[]) => void;

export interface Eip1193Provider {
  isConnected(): boolean;

  request(args: Eip1193RequestArguments): Promise<unknown>;

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