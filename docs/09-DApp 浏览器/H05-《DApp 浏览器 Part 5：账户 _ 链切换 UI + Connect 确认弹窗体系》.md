# H05\-《DApp 浏览器 Part 5：账户 / 链切换 UI \+ Connect 确认弹窗体系》

# 《DApp 浏览器 Part 5：账户 / 链切换 UI \+ Connect 确认弹窗体系》



本章实现 DApp 浏览器的用户确认与切换交互体系，覆盖：



- `ConnectConfirmModal`

- `ChainSwitchModal`

- `AddChainModal`

- `AccountSelectorModal`

- `ConnectedAccountBar`

- 当前 DApp 连接状态

- 切账户后权限重新判断

- 切链后权限重新判断

- 未授权账户返回 `[]`

- 已授权账户返回 address

- 多链多账户 UI

- Session 撤销后通知 WebView

- 确认弹窗 Controller

- 与 Part 4 Session 权限系统联动

    

核心目标：



```Plain Text
任何 DApp 想连接账户、切链、加链，都必须经过用户明确确认。
切账户 / 切链后，Provider 必须按当前 DApp 的授权状态正确同步 accountsChanged / chainChanged。
```



---



## 1\. 本章目录结构



```Bash
src/modules/dapp-browser/
  core/
    confirmations/
      confirmation.types.ts
      confirmation-controller.service.ts
      connect-confirmation.service.ts
      chain-confirmation.service.ts

    browser/
      dapp-connection-state.service.ts
      dapp-browser-controller.service.ts

  ui/
    modals/
      ConnectConfirmModal.tsx
      ChainSwitchModal.tsx
      AddChainModal.tsx
      AccountSelectorModal.tsx
      SessionRevokedModal.tsx

    components/
      ConnectedAccountBar.tsx
      ChainPill.tsx
      AccountAvatar.tsx

    screens/
      DappBrowserScreen.tsx
```



---



## 2\. Confirmation 类型



## `core/confirmations/confirmation.types.ts`



```TypeScript
import { DappPermission } from '../../shared/types/dapp.types';
import { WalletAccount } from '../accounts/account.types';
import {
  ChainConfig,
  WalletAddEthereumChainParameter,
} from '../../shared/types/chain.types';

export type ConfirmationKind =
  | 'connect'
  | 'switch_chain'
  | 'add_chain'
  | 'sign_message'
  | 'sign_typed_data'
  | 'send_transaction'
  | 'risk_warning';

export type ConfirmationStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'expired';

export interface BaseConfirmationRequest {
  confirmationId: string;
  kind: ConfirmationKind;
  origin: string;
  hostname: string;
  title?: string;
  iconUrl?: string;
  createdAt: number;
  expiresAt: number;
}

export interface ConnectConfirmationRequest extends BaseConfirmationRequest {
  kind: 'connect';
  address: string;
  accountId: string;
  chainId: string;
  permissions: DappPermission[];
}

export interface SwitchChainConfirmationRequest extends BaseConfirmationRequest {
  kind: 'switch_chain';
  fromChainId: string;
  toChainId: string;
  chainName: string;
}

export interface AddChainConfirmationRequest extends BaseConfirmationRequest {
  kind: 'add_chain';
  chain: WalletAddEthereumChainParameter;
}

export type ConfirmationRequest =
  | ConnectConfirmationRequest
  | SwitchChainConfirmationRequest
  | AddChainConfirmationRequest;

export interface ConfirmationResult {
  confirmationId: string;
  status: ConfirmationStatus;
  approved: boolean;
  rejected: boolean;
  reason?: string;
}

export interface AccountSelectorResult {
  selected: boolean;
  account?: WalletAccount;
}

export interface ChainSelectorResult {
  selected: boolean;
  chain?: ChainConfig;
}
```



---



## 3\. Confirmation Controller



该服务负责创建确认请求，并由 UI 层消费展示。



## `core/confirmations/confirmation-controller.service.ts`



```TypeScript
import {
  ConfirmationRequest,
  ConfirmationResult,
} from './confirmation.types';

type ConfirmationListener = (request: ConfirmationRequest) => void;

interface PendingConfirmation {
  request: ConfirmationRequest;
  resolve: (result: ConfirmationResult) => void;
  timer: ReturnType;
}

export class ConfirmationControllerService {
  private readonly listeners = new Set();
  private readonly pending = new Map();

  request(request: T): Promise {
    return new Promise((resolve) => {
      const timer = setTimeout(() => {
        this.resolve(request.confirmationId, {
          confirmationId: request.confirmationId,
          status: 'expired',
          approved: false,
          rejected: true,
          reason: 'CONFIRMATION_EXPIRED',
        });
      }, Math.max(request.expiresAt - Date.now(), 1000));

      this.pending.set(request.confirmationId, {
        request,
        resolve,
        timer,
      });

      for (const listener of Array.from(this.listeners)) {
        listener(request);
      }
    });
  }

  approve(confirmationId: string) {
    this.resolve(confirmationId, {
      confirmationId,
      status: 'approved',
      approved: true,
      rejected: false,
    });
  }

  reject(confirmationId: string, reason = 'USER_REJECTED') {
    this.resolve(confirmationId, {
      confirmationId,
      status: 'rejected',
      approved: false,
      rejected: true,
      reason,
    });
  }

  onRequest(listener: ConfirmationListener): () => void {
    this.listeners.add(listener);

    return () => {
      this.listeners.delete(listener);
    };
  }

  getPending(): ConfirmationRequest[] {
    return Array.from(this.pending.values()).map((item) => item.request);
  }

  private resolve(confirmationId: string, result: ConfirmationResult) {
    const pending = this.pending.get(confirmationId);
    if (!pending) return;

    clearTimeout(pending.timer);
    this.pending.delete(confirmationId);
    pending.resolve(result);
  }
}

export function newConfirmationId(): string {
  return `CONF-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
}
```



---



## 4\. Connect Confirmation Service



接入 Part 4 的 `DappConnectConfirmService`。



## `core/confirmations/connect-confirmation.service.ts`



```TypeScript
import { DappPermission } from '../../shared/types/dapp.types';
import {
  ConfirmationControllerService,
  newConfirmationId,
} from './confirmation-controller.service';

export class ConnectConfirmationService {
  constructor(
    private readonly controller: ConfirmationControllerService,
  ) {}

  async confirmConnect(input: {
    origin: string;
    hostname: string;
    address: string;
    accountId?: string;
    chainId: string;
    permissions: DappPermission[];
    metadata?: {
      name?: string;
      icon?: string;
      url?: string;
    };
  }): Promise {
    const result = await this.controller.request({
      confirmationId: newConfirmationId(),
      kind: 'connect',
      origin: input.origin,
      hostname: input.hostname,
      title: input.metadata?.name,
      iconUrl: input.metadata?.icon,
      address: input.address,
      accountId: input.accountId ?? '',
      chainId: input.chainId,
      permissions: input.permissions,
      createdAt: Date.now(),
      expiresAt: Date.now() + 60_000,
    });

    return result.approved;
  }
}
```



---



## 5\. Chain Confirmation Service



接入 `ChainSwitchConfirmService` 与 `ChainAddConfirmService`。



## `core/confirmations/chain-confirmation.service.ts`



```TypeScript
import { WalletAddEthereumChainParameter } from '../../shared/types/chain.types';
import {
  ConfirmationControllerService,
  newConfirmationId,
} from './confirmation-controller.service';

export class ChainConfirmationService {
  constructor(
    private readonly controller: ConfirmationControllerService,
  ) {}

  async confirmSwitch(input: {
    origin: string;
    fromChainId: string;
    toChainId: string;
    chainName: string;
  }): Promise {
    const result = await this.controller.request({
      confirmationId: newConfirmationId(),
      kind: 'switch_chain',
      origin: input.origin,
      hostname: safeHostname(input.origin),
      fromChainId: input.fromChainId,
      toChainId: input.toChainId,
      chainName: input.chainName,
      createdAt: Date.now(),
      expiresAt: Date.now() + 60_000,
    });

    return result.approved;
  }

  async confirmAddChain(input: {
    origin: string;
    chain: WalletAddEthereumChainParameter;
  }): Promise {
    const result = await this.controller.request({
      confirmationId: newConfirmationId(),
      kind: 'add_chain',
      origin: input.origin,
      hostname: safeHostname(input.origin),
      chain: input.chain,
      createdAt: Date.now(),
      expiresAt: Date.now() + 60_000,
    });

    return result.approved;
  }
}

function safeHostname(origin: string): string {
  try {
    return new URL(origin).hostname;
  } catch {
    return origin;
  }
}
```



---



## 6\. DApp Connection State Service



负责判断当前 DApp 对当前账户 / 当前链是否已授权。



## `core/browser/dapp-connection-state.service.ts`



```TypeScript
import { ActiveAccountService } from '../accounts/active-account.service';
import { ActiveChainService } from '../chains/active-chain.service';
import { DappSessionService } from '../permissions/dapp-session.service';

export interface DappConnectionState {
  connected: boolean;
  origin: string;
  hostname: string;
  accountId?: string;
  address?: string;
  chainId: string;
  sessionId?: string;
}

export class DappConnectionStateService {
  constructor(
    private readonly activeAccount: ActiveAccountService,
    private readonly activeChain: ActiveChainService,
    private readonly sessionService: DappSessionService,
  ) {}

  async getState(input: {
    origin: string;
    hostname: string;
    source: 'webview' | 'walletconnect' | 'deeplink' | 'internal';
  }): Promise {
    const account = this.activeAccount.getActiveAccount();
    const chainId = this.activeChain.getActiveChainId();

    if (!account) {
      return {
        connected: false,
        origin: input.origin,
        hostname: input.hostname,
        chainId,
      };
    }

    const check = await this.sessionService.checkPermission({
      origin: input.origin,
      accountId: account.accountId,
      chainId,
      source: input.source,
      permission: 'accounts',
    });

    if (!check.allowed || !check.session) {
      return {
        connected: false,
        origin: input.origin,
        hostname: input.hostname,
        accountId: account.accountId,
        chainId,
      };
    }

    return {
      connected: true,
      origin: input.origin,
      hostname: input.hostname,
      accountId: account.accountId,
      address: check.session.address,
      chainId,
      sessionId: check.session.sessionId,
    };
  }
}
```



---



## 7\. DApp Browser Controller Service



负责切账户 / 切链后同步 Provider 事件。



## `core/browser/dapp-browser-controller.service.ts`



```TypeScript
import { SecureDappWebViewHandle } from '../webview/SecureDappWebView.ref';
import { DappConnectionStateService } from './dapp-connection-state.service';

export class DappBrowserControllerService {
  constructor(
    private readonly connectionState: DappConnectionStateService,
  ) {}

  async syncProviderForCurrentDapp(input: {
    webView: SecureDappWebViewHandle | null;
    origin: string;
    hostname: string;
    chainId: string;
  }) {
    if (!input.webView) return;

    const state = await this.connectionState.getState({
      origin: input.origin,
      hostname: input.hostname,
      source: 'webview',
    });

    input.webView.syncProviderState({
      chainId: input.chainId,
      selectedAddress: state.connected ? state.address ?? null : null,
      accounts: state.connected && state.address ? [state.address] : [],
      isConnected: true,
      isUnlocked: true,
    });
  }

  async emitAccountsChanged(input: {
    webView: SecureDappWebViewHandle | null;
    origin: string;
    hostname: string;
  }) {
    if (!input.webView) return;

    const state = await this.connectionState.getState({
      origin: input.origin,
      hostname: input.hostname,
      source: 'webview',
    });

    input.webView.emitProviderEvent(
      'accountsChanged',
      state.connected && state.address ? [state.address] : [],
    );
  }

  emitChainChanged(input: {
    webView: SecureDappWebViewHandle | null;
    chainId: string;
  }) {
    input.webView?.syncProviderState({
      chainId: input.chainId,
    });

    input.webView?.emitProviderEvent('chainChanged', input.chainId);
  }

  emitSessionRevoked(input: {
    webView: SecureDappWebViewHandle | null;
  }) {
    input.webView?.syncProviderState({
      selectedAddress: null,
      accounts: [],
    });

    input.webView?.emitProviderEvent('accountsChanged', []);
  }
}
```



---



## 8\. UI：AccountAvatar



## `ui/components/AccountAvatar.tsx`



```TypeScript
import React from 'react';
import { Text, View } from 'react-native';

export function AccountAvatar(props: {
  address?: string;
  size?: number;
}) {
  const size = props.size ?? 32;
  const label = props.address
    ? props.address.slice(2, 4).toUpperCase()
    : '--';

  return (
    
      
        {label}
      
    
  );
}

function colorFromAddress(address?: string): string {
  if (!address) return '#6B7280';

  const value = parseInt(address.slice(2, 8), 16);

  const colors = [
    '#2563EB',
    '#7C3AED',
    '#059669',
    '#DC2626',
    '#EA580C',
    '#0891B2',
  ];

  return colors[value % colors.length];
}
```



---



## 9\. UI：ChainPill



## `ui/components/ChainPill.tsx`



```TypeScript
import React from 'react';
import { Text, View } from 'react-native';

export function ChainPill(props: {
  chainId: string;
  name?: string;
}) {
  return (
    
      
        {props.name ?? props.chainId}
      
    
  );
}
```



---



## 10\. UI：ConnectedAccountBar



显示当前 DApp 是否已连接当前账户。



## `ui/components/ConnectedAccountBar.tsx`



```TypeScript
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { AccountAvatar } from './AccountAvatar';
import { ChainPill } from './ChainPill';

export function ConnectedAccountBar(props: {
  hostname: string;
  connected: boolean;
  address?: string;
  chainId: string;
  chainName?: string;
  onPressAccount: () => void;
  onPressChain: () => void;
  onPressSessions?: () => void;
}) {
  return (
    
      
        

        
          
            {props.connected ? shorten(props.address) : '未连接当前 DApp'}
          

          
            {props.hostname}
          
        
      

      
        
      

      {props.onPressSessions && (
        
          ⚙️
        
      )}
    
  );
}

function shorten(address?: string) {
  if (!address) return '-';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}
```



---



## 11\. ConnectConfirmModal



## `ui/modals/ConnectConfirmModal.tsx`



```TypeScript
import React from 'react';
import {
  Modal,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { ConnectConfirmationRequest } from '../../core/confirmations/confirmation.types';
import { PermissionBadge } from '../components/PermissionBadge';
import { AccountAvatar } from '../components/AccountAvatar';

export function ConnectConfirmModal(props: {
  request: ConnectConfirmationRequest | null;
  visible: boolean;
  onApprove: () => void;
  onReject: () => void;
}) {
  const request = props.request;

  return (
    
      
        
          连接钱包

          
            {request?.hostname}
          

          
            

            
              请求连接账户
              
                {shorten(request?.address)}
              
            
          

          请求权限

          
            {request?.permissions.map((permission) => (
              
            ))}
          

          
            仅连接你信任的 DApp。连接后，该 DApp 可以读取你的地址，并请求签名或发起交易，但每次签名和交易仍需你确认。
          

          
            
              拒绝
            

            
              连接
            
          
        
      
    
  );
}

function shorten(address?: string) {
  if (!address) return '-';
  return `${address.slice(0, 8)}...${address.slice(-6)}`;
}

const backdrop = {
  flex: 1,
  backgroundColor: 'rgba(0,0,0,0.45)',
  justifyContent: 'flex-end' as const,
};

const sheet = {
  backgroundColor: '#FFFFFF',
  padding: 20,
  borderTopLeftRadius: 24,
  borderTopRightRadius: 24,
};

const title = {
  fontSize: 22,
  fontWeight: '800' as const,
  color: '#111827',
};

const hostname = {
  marginTop: 6,
  fontSize: 14,
  color: '#6B7280',
};

const accountBox = {
  marginTop: 18,
  padding: 14,
  borderRadius: 16,
  backgroundColor: '#F9FAFB',
  flexDirection: 'row' as const,
  alignItems: 'center' as const,
  gap: 12,
};

const accountLabel = {
  fontSize: 13,
  color: '#6B7280',
};

const addressText = {
  marginTop: 4,
  fontSize: 15,
  color: '#111827',
  fontWeight: '700' as const,
};

const sectionTitle = {
  marginTop: 18,
  marginBottom: 10,
  fontSize: 14,
  color: '#374151',
  fontWeight: '700' as const,
};

const warning = {
  marginTop: 16,
  fontSize: 13,
  color: '#92400E',
  backgroundColor: '#FFFBEB',
  padding: 12,
  borderRadius: 12,
  lineHeight: 18,
};

const actions = {
  flexDirection: 'row' as const,
  gap: 12,
  marginTop: 20,
};

const rejectButton = {
  flex: 1,
  height: 48,
  borderRadius: 14,
  backgroundColor: '#F3F4F6',
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
};

const approveButton = {
  flex: 1,
  height: 48,
  borderRadius: 14,
  backgroundColor: '#111827',
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
};

const rejectText = {
  color: '#111827',
  fontWeight: '800' as const,
};

const approveText = {
  color: '#FFFFFF',
  fontWeight: '800' as const,
};
```



---



## 12\. ChainSwitchModal



## `ui/modals/ChainSwitchModal.tsx`



```TypeScript
import React from 'react';
import {
  Modal,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SwitchChainConfirmationRequest } from '../../core/confirmations/confirmation.types';

export function ChainSwitchModal(props: {
  request: SwitchChainConfirmationRequest | null;
  visible: boolean;
  onApprove: () => void;
  onReject: () => void;
}) {
  const request = props.request;

  return (
    
      
        
          切换网络

          
            {request?.hostname} 请求切换当前钱包网络
          

          
            当前网络
            {request?.fromChainId}

            ↓

            目标网络
            {request?.chainName}
            {request?.toChainId}
          

          
            切换网络后，当前 DApp 将在目标网络下继续访问你的钱包。
          

          
            
              拒绝
            

            
              切换
            
          
        
      
    
  );
}

const backdrop = {
  flex: 1,
  backgroundColor: 'rgba(0,0,0,0.45)',
  justifyContent: 'flex-end' as const,
};

const sheet = {
  backgroundColor: '#FFFFFF',
  padding: 20,
  borderTopLeftRadius: 24,
  borderTopRightRadius: 24,
};

const title = {
  fontSize: 22,
  fontWeight: '800' as const,
  color: '#111827',
};

const desc = {
  marginTop: 8,
  color: '#6B7280',
  fontSize: 14,
};

const networkBox = {
  marginTop: 18,
  padding: 16,
  borderRadius: 16,
  backgroundColor: '#F9FAFB',
};

const networkLabel = {
  color: '#6B7280',
  fontSize: 12,
};

const networkValue = {
  marginTop: 4,
  color: '#111827',
  fontSize: 16,
  fontWeight: '800' as const,
};

const chainId = {
  marginTop: 2,
  color: '#6B7280',
  fontSize: 12,
};

const arrow = {
  marginVertical: 12,
  color: '#2563EB',
  fontSize: 20,
  fontWeight: '800' as const,
};

const warning = {
  marginTop: 16,
  fontSize: 13,
  color: '#92400E',
  backgroundColor: '#FFFBEB',
  padding: 12,
  borderRadius: 12,
};

const actions = {
  flexDirection: 'row' as const,
  gap: 12,
  marginTop: 20,
};

const rejectButton = {
  flex: 1,
  height: 48,
  borderRadius: 14,
  backgroundColor: '#F3F4F6',
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
};

const approveButton = {
  flex: 1,
  height: 48,
  borderRadius: 14,
  backgroundColor: '#111827',
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
};

const rejectText = {
  color: '#111827',
  fontWeight: '800' as const,
};

const approveText = {
  color: '#FFFFFF',
  fontWeight: '800' as const,
};
```



---



## 13\. AddChainModal



## `ui/modals/AddChainModal.tsx`



```TypeScript
import React from 'react';
import {
  Modal,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { AddChainConfirmationRequest } from '../../core/confirmations/confirmation.types';

export function AddChainModal(props: {
  request: AddChainConfirmationRequest | null;
  visible: boolean;
  onApprove: () => void;
  onReject: () => void;
}) {
  const chain = props.request?.chain;

  return (
    
      
        
          添加网络

          
            {props.request?.hostname} 请求添加一个新的 EVM 网络
          

          
            
            
            
            
            
          

          
            只添加你信任的 RPC 网络。恶意 RPC 可能返回错误余额、错误交易状态或诱导签名。
          

          
            
              拒绝
            

            
              添加
            
          
        
      
    
  );
}

function Row(props: {
  label: string;
  value?: string;
}) {
  return (
    
      
        {props.label}
      
      
        {props.value ?? '-'}
      
    
  );
}

const backdrop = {
  flex: 1,
  backgroundColor: 'rgba(0,0,0,0.45)',
  justifyContent: 'flex-end' as const,
};

const sheet = {
  backgroundColor: '#FFFFFF',
  padding: 20,
  borderTopLeftRadius: 24,
  borderTopRightRadius: 24,
};

const title = {
  fontSize: 22,
  fontWeight: '800' as const,
  color: '#111827',
};

const desc = {
  marginTop: 8,
  color: '#6B7280',
  fontSize: 14,
};

const infoBox = {
  marginTop: 18,
  padding: 16,
  borderRadius: 16,
  backgroundColor: '#F9FAFB',
};

const warning = {
  marginTop: 16,
  fontSize: 13,
  color: '#991B1B',
  backgroundColor: '#FEF2F2',
  padding: 12,
  borderRadius: 12,
};

const actions = {
  flexDirection: 'row' as const,
  gap: 12,
  marginTop: 20,
};

const rejectButton = {
  flex: 1,
  height: 48,
  borderRadius: 14,
  backgroundColor: '#F3F4F6',
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
};

const approveButton = {
  flex: 1,
  height: 48,
  borderRadius: 14,
  backgroundColor: '#111827',
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
};

const rejectText = {
  color: '#111827',
  fontWeight: '800' as const,
};

const approveText = {
  color: '#FFFFFF',
  fontWeight: '800' as const,
};
```



---



## 14\. AccountSelectorModal



## `ui/modals/AccountSelectorModal.tsx`



```TypeScript
import React from 'react';
import {
  FlatList,
  Modal,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { WalletAccount } from '../../core/accounts/account.types';
import { AccountAvatar } from '../components/AccountAvatar';

export function AccountSelectorModal(props: {
  visible: boolean;
  accounts: WalletAccount[];
  activeAccountId?: string;
  onSelect: (account: WalletAccount) => void;
  onClose: () => void;
}) {
  return (
    
      
        
          选择账户

           item.accountId}
            renderItem={({ item }) => {
              const active = item.accountId === props.activeAccountId;

              return (
                 props.onSelect(item)}
                  style={{
                    padding: 14,
                    borderRadius: 14,
                    backgroundColor: active ? '#EEF2FF' : '#F9FAFB',
                    borderWidth: 1,
                    borderColor: active ? '#6366F1' : '#E5E7EB',
                    marginTop: 10,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 12,
                  }}
                >
                  

                  
                    
                      {item.name}
                    
                    
                      {shorten(item.address)}
                    
                  

                  {active && (
                    
                      当前
                    
                  )}
                
              );
            }}
          />

          
            关闭
          
        
      
    
  );
}

function shorten(address: string) {
  return `${address.slice(0, 8)}...${address.slice(-6)}`;
}

const backdrop = {
  flex: 1,
  backgroundColor: 'rgba(0,0,0,0.45)',
  justifyContent: 'flex-end' as const,
};

const sheet = {
  maxHeight: '75%' as const,
  backgroundColor: '#FFFFFF',
  padding: 20,
  borderTopLeftRadius: 24,
  borderTopRightRadius: 24,
};

const title = {
  fontSize: 22,
  fontWeight: '800' as const,
  color: '#111827',
};

const closeButton = {
  marginTop: 16,
  height: 48,
  borderRadius: 14,
  backgroundColor: '#F3F4F6',
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
};

const closeText = {
  color: '#111827',
  fontWeight: '800' as const,
};
```



---



## 15\. SessionRevokedModal



## `ui/modals/SessionRevokedModal.tsx`



```TypeScript
import React from 'react';
import {
  Modal,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export function SessionRevokedModal(props: {
  visible: boolean;
  hostname?: string;
  onClose: () => void;
}) {
  return (
    
      
        
          授权已撤销

          
            {props.hostname ?? '当前 DApp'} 已无法继续访问你的钱包账户。
          

          
            知道了
          
        
      
    
  );
}

const backdrop = {
  flex: 1,
  backgroundColor: 'rgba(0,0,0,0.45)',
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
  padding: 24,
};

const card = {
  width: '100%' as const,
  padding: 20,
  borderRadius: 20,
  backgroundColor: '#FFFFFF',
};

const title = {
  fontSize: 20,
  fontWeight: '800' as const,
  color: '#111827',
};

const desc = {
  marginTop: 10,
  fontSize: 14,
  color: '#6B7280',
  lineHeight: 20,
};

const button = {
  marginTop: 20,
  height: 46,
  borderRadius: 14,
  backgroundColor: '#111827',
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
};

const buttonText = {
  color: '#FFFFFF',
  fontWeight: '800' as const,
};
```



---



## 16\. Confirmation Host



所有确认弹窗统一挂载在一个 Host 中。



## `ui/modals/DappConfirmationHost.tsx`



```TypeScript
import React, { useEffect, useState } from 'react';
import {
  AddChainConfirmationRequest,
  ConfirmationRequest,
  ConnectConfirmationRequest,
  SwitchChainConfirmationRequest,
} from '../../core/confirmations/confirmation.types';
import { ConfirmationControllerService } from '../../core/confirmations/confirmation-controller.service';
import { ConnectConfirmModal } from './ConnectConfirmModal';
import { ChainSwitchModal } from './ChainSwitchModal';
import { AddChainModal } from './AddChainModal';

export function DappConfirmationHost(props: {
  controller: ConfirmationControllerService;
}) {
  const [current, setCurrent] = useState(null);

  useEffect(() => {
    return props.controller.onRequest((request) => {
      setCurrent(request);
    });
  }, [props.controller]);

  function approve() {
    if (!current) return;

    props.controller.approve(current.confirmationId);
    setCurrent(null);
  }

  function reject() {
    if (!current) return;

    props.controller.reject(current.confirmationId);
    setCurrent(null);
  }

  return (
    <>
      

      

      <AddChainModal
        visible={current?.kind === 'add_chain'}
        request={
          current?.kind === 'add_chain'
            ? current as AddChainConfirmationRequest
            : null
        }
        onApprove={approve}
        onReject
```



