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