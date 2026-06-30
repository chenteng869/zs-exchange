export type DappPermissionType =
  | 'accounts'
  | 'sign_message'
  | 'sign_typed_data'
  | 'send_transaction'
  | 'switch_chain'
  | 'add_chain'
  | 'watch_asset'
  | 'walletconnect';

export type DappPermissionLevel = 'session' | 'persistent' | 'one_time';

export interface DappPermissionCheckInput {
  origin: string;
  permission: DappPermissionType;
  accountId: string;
  chainId: string;
}

export interface DappPermissionCheckResult {
  allowed: boolean;
  permission?: DappPermissionType;
  level?: DappPermissionLevel;
  grantedAt?: number;
  expiresAt?: number;
  message?: string;
}

export interface DappPermissionGrant {
  grantId: string;
  origin: string;
  accountId: string;
  chainId: string;
  permission: DappPermissionType;
  level: DappPermissionLevel;
  grantedAt: number;
  expiresAt?: number;
  revokedAt?: number;
}

export interface DappPermissionRequest {
  requestId: string;
  origin: string;
  hostname: string;
  dappId?: string;
  accountId: string;
  address: string;
  chainId: string;
  requestedPermissions: DappPermissionType[];
  source: 'webview' | 'walletconnect' | 'internal';
  createdAt: number;
}

export interface DappPermissionPolicy {
  permission: DappPermissionType;
  defaultLevel: DappPermissionLevel;
  requiresUserConsent: boolean;
  autoGrant: boolean;
  maxDuration?: number;
  allowedOrigins?: string[];
  blockedOrigins?: string[];
}

export interface DappSessionRecord {
  sessionId: string;
  source: 'webview' | 'walletconnect' | 'internal';
  origin: string;
  hostname: string;
  dappId?: string;
  userId?: string;
  accountId: string;
  address: string;
  chainId: string;
  permissions: DappPermissionType[];
  metadata?: { name?: string; icon?: string; url?: string; description?: string };
  connectedAt: number;
  updatedAt: number;
  expiresAt?: number;
  revokedAt?: number;
}

export interface DappSessionFilter {
  origin?: string;
  accountId?: string;
  chainId?: string;
  source?: 'webview' | 'walletconnect';
  activeOnly?: boolean;
}

export interface DappSessionStorage {
  save(session: DappSessionRecord): Promise<void>;
  get(sessionId: string): Promise<DappSessionRecord | undefined>;
  find(filter: DappSessionFilter): Promise<DappSessionRecord[]>;
  update(session: DappSessionRecord): Promise<void>;
  delete(sessionId: string): Promise<void>;
  deleteByOrigin(origin: string): Promise<void>;
  deleteExpired(): Promise<number>;
  clear(): Promise<void>;
}

export interface DappPermissionStorage {
  save(grant: DappPermissionGrant): Promise<void>;
  get(grantId: string): Promise<DappPermissionGrant | undefined>;
  findByOrigin(origin: string, accountId?: string): Promise<DappPermissionGrant[]>;
  findByPermission(permission: DappPermissionType, origin: string, accountId?: string): Promise<DappPermissionGrant[]>;
  update(grant: DappPermissionGrant): Promise<void>;
  revoke(grantId: string): Promise<void>;
  revokeByOrigin(origin: string): Promise<void>;
  deleteExpired(): Promise<number>;
  clear(): Promise<void>;
}