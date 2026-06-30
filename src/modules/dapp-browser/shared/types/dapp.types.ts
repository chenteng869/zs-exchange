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