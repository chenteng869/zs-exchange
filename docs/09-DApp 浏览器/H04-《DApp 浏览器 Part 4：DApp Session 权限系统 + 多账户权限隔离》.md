# H04\-《DApp 浏览器 Part 4：DApp Session 权限系统 \+ 多账户权限隔离》

# 《DApp 浏览器 Part 4：DApp Session 权限系统 \+ 多账户权限隔离》



本章实现 DApp 浏览器的生产级授权体系：



- DApp Session Repository

- Session 持久化接口

- origin 权限隔离

- account 权限隔离

- chain 权限隔离

- 权限过期

- 权限撤销

- `eth_accounts` 根据 session 返回

- `eth_requestAccounts` 创建 session

- `wallet_getPermissions`

- `wallet_requestPermissions`

- 多账户切换

- 切账户后 `accountsChanged`

- 切链后 `chainChanged`

- `SecureDappWebView` forwardRef 事件同步

- DApp Sessions 页面

- DApp 权限管理页面

    

本章目标：



```Plain Text
DApp A 只能访问自己授权过的账户
DApp B 不能读取 DApp A 的授权
同一 DApp 对不同账户、不同链有独立 Session
用户可以随时撤销授权
切账户 / 切链后 WebView 内 Provider 能收到事件
```



---



# 1\. 本章目录结构



```Bash
src/modules/dapp-browser/
  core/
    permissions/
      permission.types.ts
      dapp-session-storage.service.ts
      dapp-session.repository.ts
      dapp-session.service.ts
      permission-policy.service.ts
      dapp-permission.service.ts

    accounts/
      account.types.ts
      active-account.service.ts
      account-registry.service.ts

    webview/
      SecureDappWebView.ref.ts
      SecureDappWebView.tsx

  ui/
    screens/
      DappSessionsScreen.tsx
      DappSessionDetailScreen.tsx

    components/
      DappSessionCard.tsx
      PermissionBadge.tsx
```



---



# 2\. 权限类型



## `core/permissions/permission.types.ts`



```TypeScript
import {
  DappPermission,
  DappSource,
} from '../../shared/types/dapp.types';

export interface DappSessionIdentity {
  origin: string;
  accountId: string;
  chainId: string;
  source: DappSource;
}

export interface DappSessionRecord {
  sessionId: string;

  source: DappSource;

  origin: string;
  hostname: string;
  dappId?: string;

  userId?: string;

  accountId: string;
  address: string;
  chainId: string;

  permissions: DappPermission[];

  metadata?: {
    name?: string;
    icon?: string;
    url?: string;
    description?: string;
  };

  connectedAt: number;
  updatedAt: number;
  expiresAt?: number;
  revokedAt?: number;
}

export interface CreateDappSessionInput {
  source: DappSource;

  origin: string;
  hostname: string;
  dappId?: string;
  userId?: string;

  accountId: string;
  address: string;
  chainId: string;

  permissions: DappPermission[];

  metadata?: {
    name?: string;
    icon?: string;
    url?: string;
    description?: string;
  };

  ttlMs?: number;
}

export interface UpdateDappSessionInput {
  sessionId: string;
  permissions?: DappPermission[];
  chainId?: string;
  address?: string;
  accountId?: string;
  metadata?: DappSessionRecord['metadata'];
  expiresAt?: number;
}

export interface DappPermissionCheckInput {
  origin: string;
  accountId: string;
  chainId?: string;
  source: DappSource;
  permission: DappPermission;
}

export interface DappPermissionCheckResult {
  allowed: boolean;
  reason?: string;
  session?: DappSessionRecord;
}

export interface DappSessionQuery {
  userId?: string;
  origin?: string;
  hostname?: string;
  accountId?: string;
  address?: string;
  chainId?: string;
  source?: DappSource;
  includeRevoked?: boolean;
}
```



---



# 3\. Session Storage 接口



生产环境建议：



- 移动端：SQLite / MMKV / EncryptedStorage

- Web：IndexedDB

- 服务端：MySQL / PostgreSQL

- Session 敏感字段可加密

    

本章先提供接口和内存实现，后续可以无缝替换。



## `core/permissions/dapp-session-storage.service.ts`



```TypeScript
import {
  DappSessionQuery,
  DappSessionRecord,
} from './permission.types';

export interface DappSessionStorageService {
  list(query?: DappSessionQuery): Promise;
  getById(sessionId: string): Promise;
  upsert(session: DappSessionRecord): Promise;
  delete(sessionId: string): Promise;
  clear(): Promise;
}

export class InMemoryDappSessionStorageService
  implements DappSessionStorageService {
  private readonly sessions = new Map();

  async list(query: DappSessionQuery = {}): Promise {
    const now = Date.now();

    return Array.from(this.sessions.values())
      .filter((item) => {
        if (!query.includeRevoked && item.revokedAt) return false;
        if (item.expiresAt && item.expiresAt  b.updatedAt - a.updatedAt);
  }

  async getById(sessionId: string): Promise {
    return this.sessions.get(sessionId) ?? null;
  }

  async upsert(session: DappSessionRecord): Promise {
    this.sessions.set(session.sessionId, session);
  }

  async delete(sessionId: string): Promise {
    this.sessions.delete(sessionId);
  }

  async clear(): Promise {
    this.sessions.clear();
  }
}
```



---



# 4\. Session Repository



## `core/permissions/dapp-session.repository.ts`



```TypeScript
import {
  CreateDappSessionInput,
  DappSessionIdentity,
  DappSessionQuery,
  DappSessionRecord,
  UpdateDappSessionInput,
} from './permission.types';
import { DappSessionStorageService } from './dapp-session-storage.service';

export class DappSessionRepository {
  constructor(
    private readonly storage: DappSessionStorageService,
  ) {}

  async create(input: CreateDappSessionInput): Promise {
    const now = Date.now();

    const record: DappSessionRecord = {
      sessionId: this.newSessionId(),
      source: input.source,

      origin: input.origin,
      hostname: input.hostname,
      dappId: input.dappId,
      userId: input.userId,

      accountId: input.accountId,
      address: input.address,
      chainId: input.chainId,

      permissions: Array.from(new Set(input.permissions)),

      metadata: input.metadata,

      connectedAt: now,
      updatedAt: now,
      expiresAt: input.ttlMs ? now + input.ttlMs : undefined,
    };

    await this.storage.upsert(record);

    return record;
  }

  async findActiveByIdentity(
    identity: DappSessionIdentity,
  ): Promise {
    const items = await this.storage.list({
      origin: identity.origin,
      accountId: identity.accountId,
      chainId: identity.chainId,
      source: identity.source,
      includeRevoked: false,
    });

    return items[0] ?? null;
  }

  async findActiveByOriginAccount(input: {
    origin: string;
    accountId: string;
    source: DappSessionIdentity['source'];
  }): Promise {
    const items = await this.storage.list({
      origin: input.origin,
      accountId: input.accountId,
      source: input.source,
      includeRevoked: false,
    });

    return items[0] ?? null;
  }

  async list(query?: DappSessionQuery): Promise {
    return this.storage.list(query);
  }

  async getById(sessionId: string): Promise {
    return this.storage.getById(sessionId);
  }

  async update(input: UpdateDappSessionInput): Promise {
    const existing = await this.storage.getById(input.sessionId);

    if (!existing) {
      throw new Error('DAPP_SESSION_NOT_FOUND');
    }

    const updated: DappSessionRecord = {
      ...existing,
      permissions: input.permissions
        ? Array.from(new Set(input.permissions))
        : existing.permissions,
      chainId: input.chainId ?? existing.chainId,
      address: input.address ?? existing.address,
      accountId: input.accountId ?? existing.accountId,
      metadata: input.metadata ?? existing.metadata,
      expiresAt: input.expiresAt ?? existing.expiresAt,
      updatedAt: Date.now(),
    };

    await this.storage.upsert(updated);

    return updated;
  }

  async revoke(sessionId: string): Promise {
    const existing = await this.storage.getById(sessionId);

    if (!existing) {
      throw new Error('DAPP_SESSION_NOT_FOUND');
    }

    const revoked: DappSessionRecord = {
      ...existing,
      revokedAt: Date.now(),
      updatedAt: Date.now(),
    };

    await this.storage.upsert(revoked);

    return revoked;
  }

  async revokeByOrigin(input: {
    origin: string;
    accountId?: string;
    source?: DappSessionIdentity['source'];
  }): Promise {
    const items = await this.storage.list({
      origin: input.origin,
      accountId: input.accountId,
      source: input.source,
      includeRevoked: false,
    });

    const revoked: DappSessionRecord[] = [];

    for (const item of items) {
      revoked.push(await this.revoke(item.sessionId));
    }

    return revoked;
  }

  async delete(sessionId: string): Promise {
    await this.storage.delete(sessionId);
  }

  private newSessionId(): string {
    return `DSESS-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
  }
}
```



---



# 5\. Permission Policy Service



权限策略服务负责决定：



- 默认请求哪些权限

- 某些高危权限是否需要二次确认

- session 是否过期

- 当前 DApp 是否允许静默访问账户

    

## `core/permissions/permission-policy.service.ts`



```TypeScript
import { DappPermission } from '../../shared/types/dapp.types';
import { DappSessionRecord } from './permission.types';

export class PermissionPolicyService {
  getDefaultConnectPermissions(): DappPermission[] {
    return [
      'accounts',
      'sign_message',
      'sign_typed_data',
      'send_transaction',
      'switch_chain',
      'add_chain',
      'watch_asset',
    ];
  }

  normalizeRequestedPermissions(input?: unknown): DappPermission[] {
    if (!input || typeof input !== 'object') {
      return this.getDefaultConnectPermissions();
    }

    const permissions = input as Record;
    const result = new Set();

    if ('eth_accounts' in permissions) {
      result.add('accounts');
    }

    if ('personal_sign' in permissions) {
      result.add('sign_message');
    }

    if ('eth_signTypedData' in permissions || 'eth_signTypedData_v4' in permissions) {
      result.add('sign_typed_data');
    }

    if ('eth_sendTransaction' in permissions) {
      result.add('send_transaction');
    }

    if (result.size === 0) {
      result.add('accounts');
    }

    return Array.from(result);
  }

  isSessionActive(session: DappSessionRecord): boolean {
    if (session.revokedAt) return false;
    if (session.expiresAt && session.expiresAt  = {
      accounts: 'eth_accounts',
      sign_message: 'personal_sign',
      sign_typed_data: 'eth_signTypedData_v4',
      send_transaction: 'eth_sendTransaction',
      switch_chain: 'wallet_switchEthereumChain',
      add_chain: 'wallet_addEthereumChain',
      watch_asset: 'wallet_watchAsset',
      walletconnect: 'walletconnect',
    };

    return map[permission];
  }

  capabilityToPermission(capability: string): DappPermission | null {
    const map: Record = {
      eth_accounts: 'accounts',
      personal_sign: 'sign_message',
      eth_sign: 'sign_message',
      eth_signTypedData: 'sign_typed_data',
      eth_signTypedData_v3: 'sign_typed_data',
      eth_signTypedData_v4: 'sign_typed_data',
      eth_sendTransaction: 'send_transaction',
      wallet_switchEthereumChain: 'switch_chain',
      wallet_addEthereumChain: 'add_chain',
      wallet_watchAsset: 'watch_asset',
    };

    return map[capability] ?? null;
  }
}
```



---



# 6\. DApp Session Service



## `core/permissions/dapp-session.service.ts`



```TypeScript
import { DappPermission } from '../../shared/types/dapp.types';
import {
  CreateDappSessionInput,
  DappPermissionCheckInput,
  DappPermissionCheckResult,
  DappSessionRecord,
} from './permission.types';
import { DappSessionRepository } from './dapp-session.repository';
import { PermissionPolicyService } from './permission-policy.service';

export class DappSessionService {
  constructor(
    private readonly repo: DappSessionRepository,
    private readonly policy: PermissionPolicyService,
  ) {}

  async createOrUpdateSession(
    input: CreateDappSessionInput,
  ): Promise {
    const existing = await this.repo.findActiveByIdentity({
      origin: input.origin,
      accountId: input.accountId,
      chainId: input.chainId,
      source: input.source,
    });

    if (!existing) {
      return this.repo.create(input);
    }

    return this.repo.update({
      sessionId: existing.sessionId,
      permissions: this.policy.mergePermissions(
        existing.permissions,
        input.permissions,
      ),
      metadata: input.metadata ?? existing.metadata,
      expiresAt: input.ttlMs ? Date.now() + input.ttlMs : existing.expiresAt,
    });
  }

  async getSessionByOriginAccount(input: {
    origin: string;
    accountId: string;
    source: 'webview' | 'walletconnect' | 'deeplink' | 'internal';
  }): Promise {
    return this.repo.findActiveByOriginAccount(input);
  }

  async checkPermission(
    input: DappPermissionCheckInput,
  ): Promise {
    const session = input.chainId
      ? await this.repo.findActiveByIdentity({
          origin: input.origin,
          accountId: input.accountId,
          chainId: input.chainId,
          source: input.source,
        })
      : await this.repo.findActiveByOriginAccount({
          origin: input.origin,
          accountId: input.accountId,
          source: input.source,
        });

    if (!session) {
      return {
        allowed: false,
        reason: 'SESSION_NOT_FOUND',
      };
    }

    if (!this.policy.isSessionActive(session)) {
      return {
        allowed: false,
        reason: 'SESSION_EXPIRED_OR_REVOKED',
        session,
      };
    }

    if (!this.policy.hasPermission(session, input.permission)) {
      return {
        allowed: false,
        reason: `PERMISSION_NOT_GRANTED:${input.permission}`,
        session,
      };
    }

    return {
      allowed: true,
      session,
    };
  }

  async assertPermission(input: DappPermissionCheckInput): Promise {
    const result = await this.checkPermission(input);

    if (!result.allowed || !result.session) {
      throw {
        code: 4100,
        message: result.reason ?? 'Unauthorized',
      };
    }

    return result.session;
  }

  async listSessions(input?: {
    userId?: string;
    accountId?: string;
    origin?: string;
    includeRevoked?: boolean;
  }) {
    return this.repo.list(input);
  }

  async revokeSession(sessionId: string) {
    return this.repo.revoke(sessionId);
  }

  async revokeOrigin(input: {
    origin: string;
    accountId?: string;
    source?: 'webview' | 'walletconnect' | 'deeplink' | 'internal';
  }) {
    return this.repo.revokeByOrigin(input);
  }

  async getPermissionsForSession(session: DappSessionRecord) {
    return session.permissions.map((permission) => ({
      parentCapability: this.policy.permissionToCapability(permission),
      caveats:
        permission === 'accounts'
          ? [
              {
                type: 'restrictReturnedAccounts',
                value: [session.address],
              },
            ]
          : [],
    }));
  }
}
```



---



# 7\. 多账户类型



## `core/accounts/account.types.ts`



```TypeScript
export interface WalletAccount {
  accountId: string;
  userId?: string;
  address: string;
  name: string;
  avatar?: string;
  walletType: 'hd' | 'imported' | 'watch_only' | 'mpc' | 'hardware';
  chains: string[];
  createdAt: number;
  updatedAt: number;
}

export interface AccountSwitchEvent {
  previousAccount?: WalletAccount | null;
  nextAccount?: WalletAccount | null;
}
```



---



# 8\. Account Registry Service



## `core/accounts/account-registry.service.ts`



```TypeScript
import { WalletAccount } from './account.types';

export interface AccountStorageService {
  list(): Promise;
  get(accountId: string): Promise;
  upsert(account: WalletAccount): Promise;
}

export class InMemoryAccountStorageService implements AccountStorageService {
  private readonly accounts = new Map();

  constructor(initialAccounts: WalletAccount[] = []) {
    for (const account of initialAccounts) {
      this.accounts.set(account.accountId, account);
    }
  }

  async list(): Promise {
    return Array.from(this.accounts.values());
  }

  async get(accountId: string): Promise {
    return this.accounts.get(accountId) ?? null;
  }

  async upsert(account: WalletAccount): Promise {
    this.accounts.set(account.accountId, account);
  }
}

export class AccountRegistryService {
  constructor(
    private readonly storage: AccountStorageService,
  ) {}

  async listAccounts(): Promise {
    return this.storage.list();
  }

  async getAccount(accountId: string): Promise {
    return this.storage.get(accountId);
  }

  async requireAccount(accountId: string): Promise {
    const account = await this.storage.get(accountId);

    if (!account) {
      throw {
        code: 4100,
        message: `Account not found: ${accountId}`,
      };
    }

    return account;
  }

  async upsertAccount(account: WalletAccount): Promise {
    await this.storage.upsert(account);
  }
}
```



---



# 9\. 升级 ActiveAccountService



替换 Part 3 简化版，支持多账户事件。



## `core/accounts/active-account.service.ts`



```TypeScript
import { AccountRegistryService } from './account-registry.service';
import {
  AccountSwitchEvent,
  WalletAccount,
} from './account.types';

export type ActiveAccountListener = (event: AccountSwitchEvent) => void;

export class ActiveAccountService {
  private activeAccountId: string | null = null;
  private activeAccount: WalletAccount | null = null;

  private readonly listeners = new Set();

  constructor(
    private readonly registry: AccountRegistryService,
    initialAccount?: WalletAccount | null,
  ) {
    if (initialAccount) {
      this.activeAccountId = initialAccount.accountId;
      this.activeAccount = initialAccount;
      void this.registry.upsertAccount(initialAccount);
    }
  }

  getActiveAccount(): WalletAccount | null {
    return this.activeAccount;
  }

  getActiveAccountId(): string | null {
    return this.activeAccountId;
  }

  requireActiveAccount(): WalletAccount {
    if (!this.activeAccount) {
      throw {
        code: 4100,
        message: 'No active account',
      };
    }

    return this.activeAccount;
  }

  async setActiveAccount(accountId: string): Promise {
    const previous = this.activeAccount;
    const next = await this.registry.requireAccount(accountId);

    this.activeAccountId = accountId;
    this.activeAccount = next;

    const event: AccountSwitchEvent = {
      previousAccount: previous,
      nextAccount: next,
    };

    for (const listener of Array.from(this.listeners)) {
      listener(event);
    }

    return next;
  }

  async setAccountDirect(account: WalletAccount | null): Promise {
    const previous = this.activeAccount;

    if (account) {
      await this.registry.upsertAccount(account);
      this.activeAccountId = account.accountId;
      this.activeAccount = account;
    } else {
      this.activeAccountId = null;
      this.activeAccount = null;
    }

    const event: AccountSwitchEvent = {
      previousAccount: previous,
      nextAccount: account,
    };

    for (const listener of Array.from(this.listeners)) {
      listener(event);
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



# 10\. DApp Permission Service



这个服务替换 Part 3 里的临时 `DappAccountService` 授权逻辑。



## `core/permissions/dapp-permission.service.ts`



```TypeScript
import { DappBridgeRequest } from '../bridge/dapp-bridge.types';
import { DappMethodHandler, DappRouteResult } from '../router/dapp-router.types';
import { ProviderMethods } from '../provider/provider-methods';
import { ActiveAccountService } from '../accounts/active-account.service';
import { DappSessionService } from './dapp-session.service';
import { PermissionPolicyService } from './permission-policy.service';
import { DappPermission } from '../../shared/types/dapp.types';

export interface DappConnectConfirmService {
  confirmConnect(input: {
    origin: string;
    hostname: string;
    address: string;
    chainId: string;
    permissions: DappPermission[];
    metadata?: {
      name?: string;
      icon?: string;
      url?: string;
    };
  }): Promise;
}

export class DappPermissionService implements DappMethodHandler {
  constructor(
    private readonly activeAccount: ActiveAccountService,
    private readonly sessionService: DappSessionService,
    private readonly policy: PermissionPolicyService,
    private readonly confirmService?: DappConnectConfirmService,
  ) {}

  async handle(input: DappBridgeRequest): Promise {
    switch (input.request.method) {
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
          message: `Unsupported account method: ${input.request.method}`,
        };
    }
  }

  async ethAccounts(input: DappBridgeRequest): Promise {
    const account = this.activeAccount.getActiveAccount();

    if (!account) return [];

    const check = await this.sessionService.checkPermission({
      origin: input.context.origin,
      accountId: account.accountId,
      chainId: input.context.chainId,
      source: input.context.source,
      permission: 'accounts',
    });

    if (!check.allowed || !check.session) {
      return [];
    }

    return [check.session.address];
  }

  async ethRequestAccounts(input: DappBridgeRequest): Promise {
    const account = this.activeAccount.requireActiveAccount();

    const existing = await this.sessionService.checkPermission({
      origin: input.context.origin,
      accountId: account.accountId,
      chainId: input.context.chainId,
      source: input.context.source,
      permission: 'accounts',
    });

    if (existing.allowed && existing.session) {
      return [existing.session.address];
    }

    const requestedPermissions = this.policy.getDefaultConnectPermissions();

    if (this.confirmService) {
      const approved = await this.confirmService.confirmConnect({
        origin: input.context.origin,
        hostname: input.context.hostname,
        address: account.address,
        chainId: input.context.chainId,
        permissions: requestedPermissions,
        metadata: {
          url: input.context.url,
        },
      });

      if (!approved) {
        throw {
          code: 4001,
          message: 'User rejected account connection',
        };
      }
    }

    const session = await this.sessionService.createOrUpdateSession({
      source: input.context.source,
      origin: input.context.origin,
      hostname: input.context.hostname,
      dappId: input.context.dappId,
      userId: input.context.userId,

      accountId: account.accountId,
      address: account.address,
      chainId: input.context.chainId,

      permissions: requestedPermissions,

      metadata: {
        url: input.context.url,
      },
    });

    return [session.address];
  }

  async walletGetPermissions(input: DappBridgeRequest) {
    const account = this.activeAccount.getActiveAccount();
    if (!account) return [];

    const session = await this.sessionService.getSessionByOriginAccount({
      origin: input.context.origin,
      accountId: account.accountId,
      source: input.context.source,
    });

    if (!session) return [];

    return this.sessionService.getPermissionsForSession(session);
  }

  async walletRequestPermissions(input: DappBridgeRequest) {
    const params = input.request.params ?? [];
    const requested = params[0];

    const permissions = this.policy.normalizeRequestedPermissions(requested);

    if (!permissions.includes('accounts')) {
      permissions.push('accounts');
    }

    const account = this.activeAccount.requireActiveAccount();

    const existing = await this.sessionService.getSessionByOriginAccount({
      origin: input.context.origin,
      accountId: account.accountId,
      source: input.context.source,
    });

    const finalPermissions = existing
      ? this.policy.mergePermissions(existing.permissions, permissions)
      : permissions;

    if (this.confirmService) {
      const approved = await this.confirmService.confirmConnect({
        origin: input.context.origin,
        hostname: input.context.hostname,
        address: account.address,
        chainId: input.context.chainId,
        permissions: finalPermissions,
        metadata: {
          url: input.context.url,
        },
      });

      if (!approved) {
        throw {
          code: 4001,
          message: 'User rejected permissions request',
        };
      }
    }

    const session = await this.sessionService.createOrUpdateSession({
      source: input.context.source,
      origin: input.context.origin,
      hostname: input.context.hostname,
      dappId: input.context.dappId,
      userId: input.context.userId,

      accountId: account.accountId,
      address: account.address,
      chainId: input.context.chainId,

      permissions: finalPermissions,

      metadata: {
        url: input.context.url,
      },
    });

    return this.sessionService.getPermissionsForSession(session);
  }

  async assertPermission(input: {
    origin: string;
    accountId: string;
    chainId: string;
    source: 'webview' | 'walletconnect' | 'deeplink' | 'internal';
    permission: DappPermission;
  }) {
    return this.sessionService.assertPermission(input);
  }
}
```



---



# 11\. SecureDappWebView Ref 类型



## `core/webview/SecureDappWebView.ref.ts`



```TypeScript
export interface SecureDappWebViewHandle {
  reload(): void;
  goBack(): void;
  goForward(): void;

  syncProviderState(state: {
    chainId?: string | null;
    selectedAddress?: string | null;
    accounts?: string[];
    isConnected?: boolean;
    isUnlocked?: boolean;
  }): void;

  emitProviderEvent(event: string, data: unknown): void;
}
```



---



# 12\. 改造 SecureDappWebView 为 forwardRef



在 Part 2 的 `SecureDappWebView.tsx` 中改造：



核心变化：



```TypeScript
export const SecureDappWebView = forwardRef(...)
```



下面给关键替换版。



## `core/webview/SecureDappWebView.tsx` 关键升级



```TypeScript
import React, {
  forwardRef,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import { WebView } from 'react-native-webview';
import { SecureDappWebViewHandle } from './SecureDappWebView.ref';

/**
 * 省略 Part 2 已有 imports
 */

export const SecureDappWebView = forwardRef(function SecureDappWebView(props, ref) {
  const webViewRef = useRef(null);

  /**
   * 保留 Part 2 已有 state、dispatcher、router 等逻辑。
   */

  const eventDispatcher = useMemo(
    () => new WebViewEventDispatcher(webViewRef),
    [],
  );

  function reload() {
    updateRuntime({
      loadState: 'loading',
      lastError: undefined,
    });

    webViewRef.current?.reload();
  }

  function goBack() {
    if (state.canGoBack) {
      webViewRef.current?.goBack();
    }
  }

  function goForward() {
    if (state.canGoForward) {
      webViewRef.current?.goForward();
    }
  }

  useImperativeHandle(
    ref,
    () => ({
      reload,
      goBack,
      goForward,

      syncProviderState(nextState) {
        eventDispatcher.syncState(nextState);
      },

      emitProviderEvent(event, data) {
        eventDispatcher.emit(event, data);
      },
    }),
    [
      reload,
      goBack,
      goForward,
      eventDispatcher,
    ],
  );

  /**
   * return 保持 Part 2 原 UI。
   */
});
```



如果你不想重贴完整 `SecureDappWebView.tsx`，只需要把 Part 2 文件按以上方式升级即可。



---



# 13\. Runtime 工厂升级：接入 Session 权限系统



替换 Part 3 的 `create-dapp-router-runtime.ts`。



## `core/router/create-dapp-router-runtime.ts`



```TypeScript
import { DEFAULT_EVM_CHAINS } from '../chains/default-chains';
import { InMemoryChainStorageService } from '../chains/chain-storage.service';
import { ChainRegistryService } from '../chains/chain-registry.service';
import { ActiveChainService } from '../chains/active-chain.service';
import {
  ChainSwitchConfirmService,
  ChainSwitchService,
} from '../chains/chain-switch.service';
import {
  ChainAddConfirmService,
  ChainAddService,
} from '../chains/chain-add.service';
import { ChainHandlerService } from '../chains/chain-handler.service';

import {
  AccountRegistryService,
  InMemoryAccountStorageService,
} from '../accounts/account-registry.service';
import { ActiveAccountService } from '../accounts/active-account.service';
import { WalletAccount } from '../accounts/account.types';

import {
  DappConnectConfirmService,
  DappPermissionService,
} from '../permissions/dapp-permission.service';
import { PermissionPolicyService } from '../permissions/permission-policy.service';
import { DappSessionRepository } from '../permissions/dapp-session.repository';
import {
  InMemoryDappSessionStorageService,
} from '../permissions/dapp-session-storage.service';
import { DappSessionService } from '../permissions/dapp-session.service';

import { RpcHealthService } from '../rpc/rpc-health.service';
import { RpcClientService } from '../rpc/rpc-client.service';
import { RpcRateLimitService } from '../rpc/rpc-rate-limit.service';
import { RpcRouterService } from '../rpc/rpc-router.service';

import { DappRequestRouterService } from './dapp-request-router.service';

export interface CreateDappRouterRuntimeInput {
  initialChainId?: string;
  initialAccount?: WalletAccount | null;
  accounts?: WalletAccount[];

  connectConfirmService?: DappConnectConfirmService;
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

  const accountStorage = new InMemoryAccountStorageService([
    ...(input.accounts ?? []),
    ...(input.initialAccount ? [input.initialAccount] : []),
  ]);

  const accountRegistry = new AccountRegistryService(accountStorage);
  const activeAccount = new ActiveAccountService(
    accountRegistry,
    input.initialAccount ?? null,
  );

  const sessionStorage = new InMemoryDappSessionStorageService();
  const sessionRepo = new DappSessionRepository(sessionStorage);
  const permissionPolicy = new PermissionPolicyService();
  const sessionService = new DappSessionService(
    sessionRepo,
    permissionPolicy,
  );

  const permissionService = new DappPermissionService(
    activeAccount,
    sessionService,
    permissionPolicy,
    input.connectConfirmService,
  );

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

  const rpcHealth = new RpcHealthService();
  const rpcClient = new RpcClientService(rpcHealth);
  const rpcRateLimit = new RpcRateLimitService(30);

  const rpcHandler = new RpcRouterService(
    activeChain,
    rpcClient,
    rpcRateLimit,
  );

  const router = new DappRequestRouterService({
    accountHandler: permissionService,
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

    accountStorage,
    accountRegistry,
    activeAccount,

    sessionStorage,
    sessionRepo,
    permissionPolicy,
    sessionService,
    permissionService,

    rpcHealth,
    rpcClient,
    rpcRateLimit,
    rpcHandler,
  };
}

export type DappRouterRuntime = ReturnType;
```



---



# 14\. DappBrowserScreen：切账户 / 切链事件同步



## `ui/screens/DappBrowserScreen.tsx`



```TypeScript
import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Alert, View } from 'react-native';
import { SecureDappWebView } from '../../core/webview/SecureDappWebView';
import { SecureDappWebViewHandle } from '../../core/webview/SecureDappWebView.ref';
import { createDappRouterRuntime } from '../../core/router/create-dapp-router-runtime';
import { DappBridgeRequest } from '../../core/bridge/dapp-bridge.types';

export function DappBrowserScreen() {
  const webViewHandle = useRef(null);

  const runtime = useMemo(() => {
    return createDappRouterRuntime({
      initialChainId: '0x1',
      initialAccount: {
        accountId: 'account-1',
        userId: '10001',
        address: '0x1234567890abcdef1234567890abcdef12345678',
        name: 'Main Wallet',
        walletType: 'hd',
        chains: ['0x1', '0x38', '0x89'],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
      accounts: [
        {
          accountId: 'account-2',
          userId: '10001',
          address: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
          name: 'Second Wallet',
          walletType: 'hd',
          chains: ['0x1', '0x38'],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ],

      connectConfirmService: {
        confirmConnect: async (input) => {
          return new Promise((resolve) => {
            Alert.alert(
              '连接 DApp',
              [
                `${input.hostname} 请求连接你的钱包`,
                '',
                `地址：${input.address}`,
                `网络：${input.chainId}`,
                '',
                `权限：${input.permissions.join(', ')}`,
              ].join('\n'),
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
              `${input.origin} 请求切换到 ${input.chainName}`,
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
              `${input.origin} 请求添加网络：${input.chain.chainName}`,
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

  const [activeChainId, setActiveChainId] = useState(
    runtime.activeChain.getActiveChainId(),
  );

  const [activeAddress, setActiveAddress] = useState(
    runtime.activeAccount.getActiveAccount()?.address,
  );

  const [activeAccountId, setActiveAccountId] = useState(
    runtime.activeAccount.getActiveAccount()?.accountId ?? '',
  );

  useEffect(() => {
    const offChain = runtime.activeChain.onChanged((chain) => {
      setActiveChainId(chain.chainId);

      webViewHandle.current?.syncProviderState({
        chainId: chain.chainId,
      });

      webViewHandle.current?.emitProviderEvent('chainChanged', chain.chainId);
    });

    const offAccount = runtime.activeAccount.onChanged((event) => {
      const next = event.nextAccount;

      setActiveAddress(next?.address);
      setActiveAccountId(next?.accountId ?? '');

      webViewHandle.current?.syncProviderState({
        selectedAddress: next?.address ?? null,
        accounts: next ? [next.address] : [],
      });

      webViewHandle.current?.emitProviderEvent(
        'accountsChanged',
        next ? [next.address] : [],
      );
    });

    return () => {
      offChain();
      offAccount();
    };
  }, [runtime]);

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
              accountId: runtime.activeAccount.requireActiveAccount().accountId,
              address: runtime.activeAccount.requireActiveAccount().address,
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



---



# 15\. Permission Badge UI



## `ui/components/PermissionBadge.tsx`



```TypeScript
import React from 'react';
import { Text, View } from 'react-native';
import { DappPermission } from '../../shared/types/dapp.types';

const LABELS: Record = {
  accounts: '账户',
  sign_message: '消息签名',
  sign_typed_data: 'TypedData',
  send_transaction: '发交易',
  switch_chain: '切链',
  add_chain: '加链',
  watch_asset: '添加资产',
  walletconnect: 'WalletConnect',
};

export function PermissionBadge(props: {
  permission: DappPermission;
}) {
  return (
    
      
        {LABELS[props.permission] ?? props.permission}
      
    
  );
}
```



---



# 16\. DApp Session Card



## `ui/components/DappSessionCard.tsx`



```TypeScript
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { DappSessionRecord } from '../../core/permissions/permission.types';
import { PermissionBadge } from './PermissionBadge';

export function DappSessionCard(props: {
  session: DappSessionRecord;
  onPress?: () => void;
  onRevoke?: () => void;
}) {
  const session = props.session;

  return (
    
      
        {session.metadata?.name ?? session.hostname}
      

      
        {session.origin}
      

      
        地址：{shorten(session.address)}
      

      
        网络：{session.chainId}
      

      
        {session.permissions.map((permission) => (
          
        ))}
      

      {props.onRevoke && (
        
          
            撤销授权
          
        
      )}
    
  );
}

function shorten(address: string) {
  if (!address) return '-';
  return `${address.slice(0, 8)}...${address.slice(-6)}`;
}
```



---



# 17\. DApp Sessions 页面



## `ui/screens/DappSessionsScreen.tsx`



```TypeScript
import React, { useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  Text,
  View,
} from 'react-native';
import { DappSessionService } from '../../core/permissions/dapp-session.service';
import { DappSessionRecord } from '../../core/permissions/permission.types';
import { DappSessionCard } from '../components/DappSessionCard';

export function DappSessionsScreen(props: {
  userId: string;
  sessionService: DappSessionService;
}) {
  const [items, setItems] = useState([]);

  async function load() {
    const data = await props.sessionService.listSessions({
      userId: props.userId,
    });

    setItems(data);
  }

  useEffect(() => {
    void load();
  }, [props.userId]);

  async function revoke(session: DappSessionRecord) {
    Alert.alert(
      '撤销授权',
      `确认撤销 ${session.hostname} 的钱包访问权限吗？`,
      [
        {
          text: '取消',
          style: 'cancel',
        },
        {
          text: '撤销',
          style: 'destructive',
          onPress: async () => {
            await props.sessionService.revokeSession(session.sessionId);
            await load();
          },
        },
      ],
    );
  }

  return (
    
      
        DApp 授权管理
      

       item.sessionId}
        renderItem={({ item }) => (
           revoke(item)}
          />
        )}
        ListEmptyComponent={
          
            暂无已授权 DApp
          
        }
      />
    
  );
}
```



---



# 18\. DApp Session 详情页面



## `ui/screens/DappSessionDetailScreen.tsx`



```TypeScript
import React from 'react';
import {
  Alert,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { DappSessionRecord } from '../../core/permissions/permission.types';
import { DappSessionService } from '../../core/permissions/dapp-session.service';
import { PermissionBadge } from '../components/PermissionBadge';

export function DappSessionDetailScreen(props: {
  session: DappSessionRecord;
  sessionService: DappSessionService;
  onRevoked?: () => void;
}) {
  const session = props.session;

  async function revoke() {
    Alert.alert(
      '撤销授权',
      `确认撤销 ${session.hostname} 的授权？`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '撤销',
          style: 'destructive',
          onPress: async () => {
            await props.sessionService.revokeSession(session.sessionId);
            props.onRevoked?.();
          },
        },
      ],
    );
  }

  return (
    
      
        {session.metadata?.name ?? session.hostname}
      

      
        {session.origin}
      

      
        {session.address}
      

      
        {session.chainId}
      

      
        
          {session.permissions.map((permission) => (
            
          ))}
        
      

      
        
          {new Date(session.connectedAt).toLocaleString()}
        
      

      
        
          撤销授权
        
      
    
  );
}

function Section(props: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    
      
        {props.title}
      
      {props.children}
    
  );
}

const value = {
  fontSize: 15,
  color: '#111827',
  fontWeight: '600' as const,
};
```



---



# 19\. 权限隔离行为说明



## 19\.1 未授权前



DApp 调用：



```TypeScript
await ethereum.request({ method: 'eth_accounts' });
```



返回：



```TypeScript
[]
```



---



## 19\.2 授权后



DApp 调用：



```TypeScript
await ethereum.request({ method: 'eth_requestAccounts' });
```



用户确认后返回：



```TypeScript
['0x1234...']
```



Session 创建：



```JSON
{
  "origin": "https://app.uniswap.org",
  "accountId": "account-1",
  "address": "0x1234...",
  "chainId": "0x1",
  "permissions": [
    "accounts",
    "sign_message",
    "sign_typed_data",
    "send_transaction",
    "switch_chain",
    "add_chain",
    "watch_asset"
  ]
}
```



---



## 19\.3 DApp A 与 DApp B 隔离



```Plain Text
https://app.uniswap.org 授权 account-1
https://app.aave.com 未授权
```



则：



```TypeScript
// Uniswap
eth_accounts -> ['0x1234...']

// Aave
eth_accounts -> []
```



---



## 19\.4 同一 DApp 不同账户隔离



```Plain Text
origin = https://app.uniswap.org
account-1 已授权
account-2 未授权
```



切到账户 2 后：



```TypeScript
eth_accounts -> []
```



除非重新授权 account\-2。



---



## 19\.5 同一账户不同链隔离



当前实现 session identity 包含：



```Plain Text
origin + accountId + chainId + source
```



也就是说：



```Plain Text
Uniswap + account-1 + Ethereum
Uniswap + account-1 + BSC
```



是两个 session。



如果你希望“同一 DApp 授权账户后所有链通用”，可以把 `findActiveByIdentity` 改成只按：



```Plain Text
origin + accountId + source
```



但生产更推荐链隔离。



---



# 20\. 给签名 / 交易模块使用的权限检查



后续 Part 6 / Part 7 中，签名前调用：



```TypeScript
await permissionService.assertPermission({
  origin,
  accountId,
  chainId,
  source: 'webview',
  permission: 'sign_message',
});
```



TypedData：



```TypeScript
await permissionService.assertPermission({
  origin,
  accountId,
  chainId,
  source: 'webview',
  permission: 'sign_typed_data',
});
```



交易：



```TypeScript
await permissionService.assertPermission({
  origin,
  accountId,
  chainId,
  source: 'webview',
  permission: 'send_transaction',
});
```



---



# 21\. 切账户后 Provider 行为



当用户从 account\-1 切到 account\-2：



```TypeScript
webViewHandle.current?.emitProviderEvent(
  'accountsChanged',
  ['0xNewAddress']
);
```



但如果新账户未授权当前 DApp，更严格的行为应该是：



```TypeScript
accountsChanged []
```



生产建议：



```TypeScript
const accounts = await permissionService.ethAccounts(currentDappContext);
emit accountsChanged(accounts)
```



这样不会把未授权账户泄露给 DApp。



---



# 22\. 更严格的切账户同步方法



建议实现：



```TypeScript
async function syncAccountChangedForCurrentDapp() {
  const account = runtime.activeAccount.getActiveAccount();

  if (!account) {
    webViewHandle.current?.emitProviderEvent('accountsChanged', []);
    return;
  }

  const check = await runtime.sessionService.checkPermission({
    origin: currentOrigin,
    accountId: account.accountId,
    chainId: runtime.activeChain.getActiveChainId(),
    source: 'webview',
    permission: 'accounts',
  });

  webViewHandle.current?.emitProviderEvent(
    'accountsChanged',
    check.allowed && check.session ? [account.address] : [],
  );
}
```



---



# 23\. 本章完成内容



本章完成：



```Plain Text
DApp Session 类型
Session Storage 接口
内存 Session Storage
Session Repository
Permission Policy
Session Service
DApp Permission Service
eth_accounts 基于 Session
eth_requestAccounts 创建 Session
wallet_getPermissions
wallet_requestPermissions
多账户 Registry
ActiveAccount 多账户切换
SecureDappWebView forwardRef
Provider 状态同步
accountsChanged / chainChanged 事件同步
DApp Sessions 页面
Session Detail 页面
撤销授权
```



现在授权系统已经从临时内存标记升级为生产级结构：



```Plain Text
origin + accountId + chainId + source
```



严格隔离 DApp 权限。



---



# 24\. 下一章继续



下一段建议继续写：



**《DApp 浏览器 Part 5：账户 / 链切换 UI \+ Connect 确认弹窗体系》**



将覆盖：



```Plain Text
ConnectConfirmModal
ChainSwitchModal
AddChainModal
AccountSelectorModal
ConnectedAccountBar
DApp 当前连接状态
切账户权限重新判断
切链权限重新判断
未授权账户返回 []
已授权账户返回 address
多链多账户 UI
Session 撤销后通知 WebView
```



