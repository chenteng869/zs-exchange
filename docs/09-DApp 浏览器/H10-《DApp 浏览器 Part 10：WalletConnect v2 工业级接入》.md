# H10\-《DApp 浏览器 Part 10：WalletConnect v2 工业级接入》

# 



本章实现 **WalletConnect v2 工业级接入**，覆盖：



- WalletConnect `SignClient`

- Pairing URI

- Session Proposal

- Session Approval Modal

- Namespace 构建

- Session Storage

- Session Request Handler

- `personal_sign`

- `eth_signTypedData_v4`

- `eth_sendTransaction`

- `wallet_switchEthereumChain`

- `wallet_addEthereumChain`

- Session Delete

- Event Sync

- WalletConnect Sessions 页面

    

核心目标：



```Plain Text
外部 DApp
  -> WalletConnect URI
  -> App 扫码 / 粘贴 URI
  -> 用户审批 Session
  -> 外部 DApp 发起签名 / 交易
  -> 复用 DApp Browser 权限、签名、交易、安全系统
  -> 返回结果给外部 DApp
```



---



## 1\. 依赖安装



```Bash
npm install @walletconnect/sign-client @walletconnect/types @walletconnect/utils
```



可选：



```Bash
npm install @react-native-async-storage/async-storage
```



---



## 2\. 本章目录结构



```Bash
src/modules/dapp-browser/
  core/
    walletconnect/
      walletconnect.types.ts
      walletconnect-storage.service.ts
      walletconnect-client.service.ts
      walletconnect-namespace.service.ts
      walletconnect-proposal.service.ts
      walletconnect-request-handler.service.ts
      walletconnect-session.service.ts
      walletconnect-event-sync.service.ts

  ui/
    modals/
      WalletConnectProposalModal.tsx
      WalletConnectRequestModal.tsx

    screens/
      WalletConnectScreen.tsx
      WalletConnectSessionsScreen.tsx
```



---



## 3\. WalletConnect 类型



### `core/walletconnect/walletconnect.types.ts`



```TypeScript
export type WalletConnectSessionStatus =
  | 'active'
  | 'deleted'
  | 'expired';

export interface WalletConnectPeerMeta {
  name?: string;
  description?: string;
  url?: string;
  icons?: string[];
}

export interface WalletConnectSessionRecord {
  topic: string;
  pairingTopic?: string;

  peer: WalletConnectPeerMeta;

  namespaces: Record;

  accounts: string[];
  chains: string[];
  methods: string[];
  events: string[];

  status: WalletConnectSessionStatus;

  createdAt: number;
  updatedAt: number;
  expiresAt?: number;
}

export interface WalletConnectProposalView {
  id: number;
  proposer: WalletConnectPeerMeta;
  requiredNamespaces: Record;
  optionalNamespaces?: Record;
  pairingTopic?: string;
}

export interface WalletConnectRequestContext {
  topic: string;
  origin: string;
  hostname: string;
  accountId: string;
  address: string;
  chainId: string;
  method: string;
  params: unknown[];
}
```



---



## 4\. WalletConnect Storage



### `core/walletconnect/walletconnect-storage.service.ts`



```TypeScript
import { WalletConnectSessionRecord } from './walletconnect.types';

export interface WalletConnectStorageService {
  listSessions(): Promise;
  getSession(topic: string): Promise;
  upsertSession(session: WalletConnectSessionRecord): Promise;
  deleteSession(topic: string): Promise;
}

export class InMemoryWalletConnectStorageService
  implements WalletConnectStorageService {
  private readonly sessions = new Map();

  async listSessions(): Promise {
    return Array.from(this.sessions.values())
      .filter((item) => item.status === 'active')
      .sort((a, b) => b.updatedAt - a.updatedAt);
  }

  async getSession(topic: string): Promise {
    return this.sessions.get(topic) ?? null;
  }

  async upsertSession(session: WalletConnectSessionRecord): Promise {
    this.sessions.set(session.topic, session);
  }

  async deleteSession(topic: string): Promise {
    const existing = this.sessions.get(topic);

    if (!existing) return;

    this.sessions.set(topic, {
      ...existing,
      status: 'deleted',
      updatedAt: Date.now(),
    });
  }
}
```



---



## 5\. Namespace Service



WalletConnect v2 必须返回合法 namespaces。



支持 EVM：



```Plain Text
eip155:1
eip155:56
eip155:137
```



方法：



```Plain Text
eth_sendTransaction
personal_sign
eth_signTypedData
eth_signTypedData_v4
wallet_switchEthereumChain
wallet_addEthereumChain
```



事件：



```Plain Text
accountsChanged
chainChanged
```



### `core/walletconnect/walletconnect-namespace.service.ts`



```TypeScript
import { buildApprovedNamespaces } from '@walletconnect/utils';
import { ChainConfig } from '../../shared/types/chain.types';

export class WalletConnectNamespaceService {
  buildApprovedNamespaces(input: {
    proposal: any;
    chains: ChainConfig[];
    address: string;
  }) {
    const eip155Chains = input.chains
      .filter((chain) => chain.namespace === 'eip155' && chain.enabled)
      .map((chain) => `eip155:${Number.parseInt(chain.chainId.slice(2), 16)}`);

    const accounts = eip155Chains.map(
      (chain) => `${chain}:${input.address}`,
    );

    return buildApprovedNamespaces({
      proposal: input.proposal.params,
      supportedNamespaces: {
        eip155: {
          chains: eip155Chains,
          accounts,
          methods: [
            'eth_sendTransaction',
            'personal_sign',
            'eth_sign',
            'eth_signTypedData',
            'eth_signTypedData_v3',
            'eth_signTypedData_v4',
            'wallet_switchEthereumChain',
            'wallet_addEthereumChain',
            'eth_chainId',
            'eth_accounts',
            'eth_getBalance',
            'eth_call',
            'eth_estimateGas',
            'eth_gasPrice',
            'eth_blockNumber',
            'eth_getTransactionReceipt',
            'eth_getTransactionByHash',
            'eth_getCode',
            'eth_getLogs',
          ],
          events: [
            'accountsChanged',
            'chainChanged',
          ],
        },
      },
    });
  }

  extractSessionInfo(session: any): {
    accounts: string[];
    chains: string[];
    methods: string[];
    events: string[];
  } {
    const namespaces = session.namespaces ?? {};
    const eip155 = namespaces.eip155 ?? {};

    return {
      accounts: eip155.accounts ?? [],
      chains: eip155.chains ?? [],
      methods: eip155.methods ?? [],
      events: eip155.events ?? [],
    };
  }
}
```



---



## 6\. WalletConnect Client Service



初始化 `SignClient` 并绑定事件。



### `core/walletconnect/walletconnect-client.service.ts`



```TypeScript
import SignClient from '@walletconnect/sign-client';
import { getSdkError } from '@walletconnect/utils';

export interface WalletConnectClientConfig {
  projectId: string;
  metadata: {
    name: string;
    description: string;
    url: string;
    icons: string[];
  };
}

export interface WalletConnectClientHandlers {
  onSessionProposal?: (proposal: any) => void;
  onSessionRequest?: (event: any) => void;
  onSessionDelete?: (event: any) => void;
  onSessionExpire?: (event: any) => void;
}

export class WalletConnectClientService {
  private client?: SignClient;

  constructor(
    private readonly config: WalletConnectClientConfig,
    private readonly handlers: WalletConnectClientHandlers = {},
  ) {}

  async init(): Promise {
    if (this.client) return this.client;

    this.client = await SignClient.init({
      projectId: this.config.projectId,
      metadata: this.config.metadata,
    });

    this.client.on('session_proposal', (proposal) => {
      this.handlers.onSessionProposal?.(proposal);
    });

    this.client.on('session_request', (event) => {
      this.handlers.onSessionRequest?.(event);
    });

    this.client.on('session_delete', (event) => {
      this.handlers.onSessionDelete?.(event);
    });

    this.client.on('session_expire', (event) => {
      this.handlers.onSessionExpire?.(event);
    });

    return this.client;
  }

  async pair(uri: string) {
    const client = await this.init();

    return client.pair({
      uri,
    });
  }

  async approveSession(input: {
    id: number;
    namespaces: Record;
  }) {
    const client = await this.init();

    return client.approve({
      id: input.id,
      namespaces: input.namespaces,
    });
  }

  async rejectSession(id: number, message = 'User rejected session') {
    const client = await this.init();

    return client.reject({
      id,
      reason: {
        code: getSdkError('USER_REJECTED').code,
        message,
      },
    });
  }

  async respond(input: {
    topic: string;
    response: {
      id: number;
      jsonrpc: '2.0';
      result?: unknown;
      error?: {
        code: number;
        message: string;
        data?: unknown;
      };
    };
  }) {
    const client = await this.init();

    return client.respond({
      topic: input.topic,
      response: input.response,
    });
  }

  async disconnect(input: {
    topic: string;
    reason?: string;
  }) {
    const client = await this.init();

    return client.disconnect({
      topic: input.topic,
      reason: {
        code: getSdkError('USER_DISCONNECTED').code,
        message: input.reason ?? 'User disconnected',
      },
    });
  }

  async emit(input: {
    topic: string;
    event: {
      name: string;
      data: unknown;
    };
    chainId: string;
  }) {
    const client = await this.init();

    return client.emit({
      topic: input.topic,
      event: input.event,
      chainId: input.chainId,
    });
  }

  getClient(): SignClient | undefined {
    return this.client;
  }
}
```



---



## 7\. Session Service



### `core/walletconnect/walletconnect-session.service.ts`



```TypeScript
import { WalletConnectStorageService } from './walletconnect-storage.service';
import {
  WalletConnectPeerMeta,
  WalletConnectSessionRecord,
} from './walletconnect.types';
import { WalletConnectNamespaceService } from './walletconnect-namespace.service';

export class WalletConnectSessionService {
  constructor(
    private readonly storage: WalletConnectStorageService,
    private readonly namespaceService: WalletConnectNamespaceService,
  ) {}

  async saveApprovedSession(session: any): Promise {
    const info = this.namespaceService.extractSessionInfo(session);
    const now = Date.now();

    const peer: WalletConnectPeerMeta = {
      name: session.peer?.metadata?.name,
      description: session.peer?.metadata?.description,
      url: session.peer?.metadata?.url,
      icons: session.peer?.metadata?.icons,
    };

    const record: WalletConnectSessionRecord = {
      topic: session.topic,
      pairingTopic: session.pairingTopic,
      peer,
      namespaces: session.namespaces,
      accounts: info.accounts,
      chains: info.chains,
      methods: info.methods,
      events: info.events,
      status: 'active',
      createdAt: now,
      updatedAt: now,
      expiresAt: session.expiry ? session.expiry * 1000 : undefined,
    };

    await this.storage.upsertSession(record);

    return record;
  }

  async listSessions(): Promise {
    return this.storage.listSessions();
  }

  async getSession(topic: string): Promise {
    return this.storage.getSession(topic);
  }

  async markDeleted(topic: string): Promise {
    await this.storage.deleteSession(topic);
  }
}
```



---



## 8\. Proposal Service



处理 `session_proposal`。



### `core/walletconnect/walletconnect-proposal.service.ts`



```TypeScript
import { ChainRegistryService } from '../chains/chain-registry.service';
import { ActiveAccountService } from '../accounts/active-account.service';
import { WalletConnectClientService } from './walletconnect-client.service';
import { WalletConnectNamespaceService } from './walletconnect-namespace.service';
import { WalletConnectSessionService } from './walletconnect-session.service';
import { ConfirmationControllerService, newConfirmationId } from '../confirmations/confirmation-controller.service';

export class WalletConnectProposalService {
  constructor(
    private readonly client: WalletConnectClientService,
    private readonly chainRegistry: ChainRegistryService,
    private readonly activeAccount: ActiveAccountService,
    private readonly namespaceService: WalletConnectNamespaceService,
    private readonly sessionService: WalletConnectSessionService,
    private readonly confirmationController: ConfirmationControllerService,
  ) {}

  async handleProposal(proposal: any): Promise {
    const account = this.activeAccount.requireActiveAccount();
    const chains = await this.chainRegistry.listEnabledChains();

    const peer = proposal.params?.proposer?.metadata ?? {};

    const result = await this.confirmationController.request({
      confirmationId: newConfirmationId(),
      kind: 'walletconnect_session_proposal' as any,
      origin: peer.url ?? 'walletconnect',
      hostname: safeHostname(peer.url),
      proposalId: proposal.id,
      proposer: {
        name: peer.name,
        description: peer.description,
        url: peer.url,
        icons: peer.icons,
      },
      requiredNamespaces: proposal.params?.requiredNamespaces ?? {},
      optionalNamespaces: proposal.params?.optionalNamespaces ?? {},
      address: account.address,
      chainId: 'multi-chain',
      createdAt: Date.now(),
      expiresAt: Date.now() + 120_000,
    } as any);

    if (!result.approved) {
      await this.client.rejectSession(proposal.id);
      return;
    }

    const namespaces = this.namespaceService.buildApprovedNamespaces({
      proposal,
      chains,
      address: account.address,
    });

    const session = await this.client.approveSession({
      id: proposal.id,
      namespaces,
    });

    await this.sessionService.saveApprovedSession(session);
  }
}

function safeHostname(url?: string): string {
  try {
    return url ? new URL(url).hostname : 'walletconnect';
  } catch {
    return 'walletconnect';
  }
}
```



---



## 9\. Request Handler



WalletConnect 请求复用前面：



- `DappPermissionService`

- `SigningRequestService`

- `TransactionRequestService`

- `ChainSwitchService`

- `ChainAddService`

- `RpcRouterService`

    

### `core/walletconnect/walletconnect-request-handler.service.ts`



```TypeScript
import { ActiveAccountService } from '../accounts/active-account.service';
import { ActiveChainService } from '../chains/active-chain.service';
import { ChainSwitchService } from '../chains/chain-switch.service';
import { ChainAddService } from '../chains/chain-add.service';
import { RpcClientService } from '../rpc/rpc-client.service';
import { ChainRegistryService } from '../chains/chain-registry.service';
import { SigningRequestService, isSigningMethod } from '../signing/signing-request.service';
import { TransactionRequestService } from '../transaction/transaction-request.service';
import { ProviderMethods, RpcProxyMethods } from '../provider/provider-methods';
import { WalletConnectClientService } from './walletconnect-client.service';

export class WalletConnectRequestHandlerService {
  constructor(
    private readonly client: WalletConnectClientService,
    private readonly activeAccount: ActiveAccountService,
    private readonly activeChain: ActiveChainService,
    private readonly chainRegistry: ChainRegistryService,
    private readonly chainSwitch: ChainSwitchService,
    private readonly chainAdd: ChainAddService,
    private readonly rpcClient: RpcClientService,
    private readonly signing: SigningRequestService,
    private readonly transaction: TransactionRequestService,
  ) {}

  async handleSessionRequest(event: any): Promise {
    const { topic, params, id } = event;
    const request = params.request;
    const wcChainId = params.chainId;

    try {
      const result = await this.route({
        topic,
        wcChainId,
        method: request.method,
        params: request.params ?? [],
      });

      await this.client.respond({
        topic,
        response: {
          id,
          jsonrpc: '2.0',
          result,
        },
      });
    } catch (error: any) {
      await this.client.respond({
        topic,
        response: {
          id,
          jsonrpc: '2.0',
          error: {
            code: typeof error?.code === 'number' ? error.code : -32603,
            message: error?.message ?? 'WalletConnect request failed',
            data: error?.data,
          },
        },
      });
    }
  }

  private async route(input: {
    topic: string;
    wcChainId: string;
    method: string;
    params: unknown[];
  }): Promise {
    const account = this.activeAccount.requireActiveAccount();
    const chainId = normalizeWcChainId(input.wcChainId);

    if (input.method === ProviderMethods.ETH_CHAIN_ID) {
      return chainId;
    }

    if (input.method === ProviderMethods.ETH_ACCOUNTS) {
      return [account.address];
    }

    if (input.method === ProviderMethods.WALLET_SWITCH_ETHEREUM_CHAIN) {
      return this.chainSwitch.switchEthereumChain({
        origin: `walletconnect:${input.topic}`,
        params: input.params,
      });
    }

    if (input.method === ProviderMethods.WALLET_ADD_ETHEREUM_CHAIN) {
      return this.chainAdd.addEthereumChain({
        origin: `walletconnect:${input.topic}`,
        params: input.params,
      });
    }

    if (isSigningMethod(input.method)) {
      return this.signing.sign({
        method: input.method,
        params: input.params,
        origin: `walletconnect:${input.topic}`,
        hostname: 'walletconnect',
        accountId: account.accountId,
        address: account.address,
        chainId,
        source: 'walletconnect',
      });
    }

    if (input.method === ProviderMethods.ETH_SEND_TRANSACTION) {
      return this.transaction.sendTransaction({
        origin: `walletconnect:${input.topic}`,
        hostname: 'walletconnect',
        accountId: account.accountId,
        address: account.address,
        chainId,
        source: 'walletconnect',
        params: input.params,
      });
    }

    if (RpcProxyMethods.has(input.method)) {
      const chain = await this.chainRegistry.requireChain(chainId);

      const rpcResult = await this.rpcClient.request({
        chain,
        method: input.method,
        params: input.params,
      });

      if ('error' in rpcResult.response && rpcResult.response.error) {
        throw rpcResult.response.error;
      }

      return (rpcResult.response as any).result;
    }

    throw {
      code: 4200,
      message: `Unsupported WalletConnect method: ${input.method}`,
    };
  }
}

export function normalizeWcChainId(chainId: string): `0x${string}` {
  if (chainId.startsWith('eip155:')) {
    const id = Number(chainId.split(':')[1]);
    return `0x${id.toString(16)}`;
  }

  if (chainId.startsWith('0x')) {
    return chainId as `0x${string}`;
  }

  return `0x${Number(chainId).toString(16)}`;
}
```



---



## 10\. Event Sync Service



账户 / 链变化后，同步给 WalletConnect Session。



### `core/walletconnect/walletconnect-event-sync.service.ts`



```TypeScript
import { WalletConnectClientService } from './walletconnect-client.service';
import { WalletConnectSessionService } from './walletconnect-session.service';

export class WalletConnectEventSyncService {
  constructor(
    private readonly client: WalletConnectClientService,
    private readonly sessions: WalletConnectSessionService,
  ) {}

  async emitAccountsChanged(address: string) {
    const activeSessions = await this.sessions.listSessions();

    for (const session of activeSessions) {
      for (const chain of session.chains) {
        await this.client.emit({
          topic: session.topic,
          chainId: chain,
          event: {
            name: 'accountsChanged',
            data: [`${chain}:${address}`],
          },
        }).catch(() => undefined);
      }
    }
  }

  async emitChainChanged(chainId: string) {
    const activeSessions = await this.sessions.listSessions();
    const wcChainId = `eip155:${Number.parseInt(chainId.slice(2), 16)}`;

    for (const session of activeSessions) {
      if (!session.chains.includes(wcChainId)) continue;

      await this.client.emit({
        topic: session.topic,
        chainId: wcChainId,
        event: {
          name: 'chainChanged',
          data: chainId,
        },
      }).catch(() => undefined);
    }
  }
}
```



---



## 11\. WalletConnect Proposal Modal



### `ui/modals/WalletConnectProposalModal.tsx`



```TypeScript
import React from 'react';
import {
  Image,
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export function WalletConnectProposalModal(props: {
  visible: boolean;
  request: any | null;
  onApprove: () => void;
  onReject: () => void;
}) {
  const proposer = props.request?.proposer;
  const icon = proposer?.icons?.[0];

  return (
    
      
        
          WalletConnect 连接请求

          
            {icon ? (
              
            ) : (
              
                
                  WC
                
              
            )}

            
              
                {proposer?.name ?? 'Unknown DApp'}
              
              
                {proposer?.url ?? '-'}
              
            
          

          请求命名空间

          
            
              {JSON.stringify(props.request?.requiredNamespaces ?? {}, null, 2)}
            
          

          
            连接后，该 DApp 可以向你的钱包发起签名和交易请求，但每次敏感操作仍需要你确认。
          

          
            
              拒绝
            

            
              连接
            
          
        
      
    
  );
}

const backdrop = {
  flex: 1,
  backgroundColor: 'rgba(0,0,0,0.45)',
  justifyContent: 'flex-end' as const,
};

const sheet = {
  maxHeight: '86%' as const,
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

const appBox = {
  marginTop: 18,
  padding: 14,
  borderRadius: 16,
  backgroundColor: '#F9FAFB',
  flexDirection: 'row' as const,
  alignItems: 'center' as const,
  gap: 12,
};

const appName = {
  fontSize: 16,
  fontWeight: '800' as const,
  color: '#111827',
};

const appUrl = {
  marginTop: 4,
  fontSize: 12,
  color: '#6B7280',
};

const sectionTitle = {
  marginTop: 18,
  marginBottom: 8,
  fontSize: 14,
  fontWeight: '800' as const,
  color: '#374151',
};

const jsonBox = {
  maxHeight: 160,
  padding: 12,
  borderRadius: 12,
  backgroundColor: '#F9FAFB',
};

const jsonText = {
  fontSize: 12,
  color: '#111827',
  fontFamily: 'Menlo',
};

const warning = {
  marginTop: 16,
  padding: 12,
  borderRadius: 12,
  backgroundColor: '#FFFBEB',
  color: '#92400E',
  fontSize: 13,
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



## 12\. 升级 ConfirmationHost



在 `DappConfirmationHost.tsx` 加入 WalletConnect proposal。



```TypeScript
import { WalletConnectProposalModal } from './WalletConnectProposalModal';
```



增加：



```TypeScript

```



---



## 13\. WalletConnect Screen



用于输入 / 扫码 URI。



### `ui/screens/WalletConnectScreen.tsx`



```TypeScript
import React, { useState } from 'react';
import {
  Alert,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { WalletConnectClientService } from '../../core/walletconnect/walletconnect-client.service';

export function WalletConnectScreen(props: {
  client: WalletConnectClientService;
}) {
  const [uri, setUri] = useState('');
  const [loading, setLoading] = useState(false);

  async function connect() {
    if (!uri.trim()) return;

    setLoading(true);

    try {
      await props.client.pair(uri.trim());
      setUri('');
      Alert.alert('连接请求已发送', '请在弹窗中确认 WalletConnect 连接。');
    } catch (error: any) {
      Alert.alert('连接失败', error?.message ?? String(error));
    } finally {
      setLoading(false);
    }
  }

  return (
    
      
        WalletConnect
      

      
        粘贴 WalletConnect v2 URI，或接入扫码模块后自动填充。
      

      

      
        
          {loading ? '连接中...' : '连接'}
        
      
    
  );
}
```



---



## 14\. WalletConnect Sessions 页面



### `ui/screens/WalletConnectSessionsScreen.tsx`



```TypeScript
import React, { useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  Image,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { WalletConnectSessionRecord } from '../../core/walletconnect/walletconnect.types';
import { WalletConnectSessionService } from '../../core/walletconnect/walletconnect-session.service';
import { WalletConnectClientService } from '../../core/walletconnect/walletconnect-client.service';

export function WalletConnectSessionsScreen(props: {
  sessions: WalletConnectSessionService;
  client: WalletConnectClientService;
}) {
  const [items, setItems] = useState([]);

  async function load() {
    setItems(await props.sessions.listSessions());
  }

  useEffect(() => {
    void load();
  }, []);

  async function disconnect(session: WalletConnectSessionRecord) {
    Alert.alert(
      '断开连接',
      `确认断开 ${session.peer.name ?? session.peer.url ?? session.topic}？`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '断开',
          style: 'destructive',
          onPress: async () => {
            await props.client.disconnect({
              topic: session.topic,
            });
            await props.sessions.markDeleted(session.topic);
            await load();
          },
        },
      ],
    );
  }

  return (
    
      
        WalletConnect 会话
      

       item.topic}
        renderItem={({ item }) => (
          
            
              {item.peer.icons?.[0] ? (
                
              ) : (
                
                  
                    WC
                  
                
              )}

              
                
                  {item.peer.name ?? 'Unknown DApp'}
                
                
                  {item.peer.url ?? item.topic}
                
              
            

            
              Chains: {item.chains.join(', ')}
            

            
              Methods: {item.methods.slice(0, 4).join(', ')}
              {item.methods.length > 4 ? '...' : ''}
            

             disconnect(item)}
              style={{
                marginTop: 14,
                height: 42,
                borderRadius: 12,
                backgroundColor: '#FEF2F2',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              
                断开连接
              
            
          
        )}
        ListEmptyComponent={
          
            暂无 WalletConnect 会话
          
        }
      />
    
  );
}
```



---



## 15\. Runtime 工厂接入 WalletConnect



### `create-dapp-router-runtime.ts` 新增 imports



```TypeScript
import { InMemoryWalletConnectStorageService } from '../walletconnect/walletconnect-storage.service';
import { WalletConnectNamespaceService } from '../walletconnect/walletconnect-namespace.service';
import { WalletConnectClientService } from '../walletconnect/walletconnect-client.service';
import { WalletConnectSessionService } from '../walletconnect/walletconnect-session.service';
import { WalletConnectProposalService } from '../walletconnect/walletconnect-proposal.service';
import { WalletConnectRequestHandlerService } from '../walletconnect/walletconnect-request-handler.service';
import { WalletConnectEventSyncService } from '../walletconnect/walletconnect-event-sync.service';
```



### Runtime input 增加



```TypeScript
walletConnect?: {
  projectId: string;
  metadata: {
    name: string;
    description: string;
    url: string;
    icons: string[];
  };
};
```



### 工厂内部新增



```TypeScript
const walletConnectStorage = new InMemoryWalletConnectStorageService();
const walletConnectNamespace = new WalletConnectNamespaceService();

let walletConnectProposalService: WalletConnectProposalService;
let walletConnectRequestHandler: WalletConnectRequestHandlerService;

const walletConnectClient = new WalletConnectClientService(
  input.walletConnect ?? {
    projectId: 'YOUR_PROJECT_ID',
    metadata: {
      name: 'Industrial Wallet',
      description: 'Industrial DApp Browser Wallet',
      url: 'https://wallet.example.com',
      icons: ['https://wallet.example.com/icon.png'],
    },
  },
  {
    onSessionProposal: (proposal) => {
      void walletConnectProposalService.handleProposal(proposal);
    },
    onSessionRequest: (event) => {
      void walletConnectRequestHandler.handleSessionRequest(event);
    },
    onSessionDelete: (event) => {
      const topic = event.topic;
      if (topic) void walletConnectSession.markDeleted(topic);
    },
    onSessionExpire: (event) => {
      const topic = event.topic;
      if (topic) void walletConnectSession.markDeleted(topic);
    },
  },
);

const walletConnectSession = new WalletConnectSessionService(
  walletConnectStorage,
  walletConnectNamespace,
);

walletConnectProposalService = new WalletConnectProposalService(
  walletConnectClient,
  chainRegistry,
  activeAccount,
  walletConnectNamespace,
  walletConnectSession,
  confirmationController,
);

walletConnectRequestHandler = new WalletConnectRequestHandlerService(
  walletConnectClient,
  activeAccount,
  activeChain,
  chainRegistry,
  chainSwitch,
  chainAdd,
  rpcClient,
  signingRequestService,
  transactionRequestService,
);

const walletConnectEventSync = new WalletConnectEventSyncService(
  walletConnectClient,
  walletConnectSession,
);
```



### 返回对象追加



```TypeScript
return {
  ...

  walletConnectStorage,
  walletConnectNamespace,
  walletConnectClient,
  walletConnectSession,
  walletConnectProposalService,
  walletConnectRequestHandler,
  walletConnectEventSync,
};
```



---



## 16\. 切账户 / 切链同步 WalletConnect



在 `DappBrowserScreen` 或全局 Wallet Runtime 中：



```TypeScript
runtime.activeAccount.onChanged((event) => {
  const next = event.nextAccount;

  if (next) {
    void runtime.walletConnectEventSync.emitAccountsChanged(next.address);
  }
});

runtime.activeChain.onChanged((chain) => {
  void runtime.walletConnectEventSync.emitChainChanged(chain.chainId);
});
```



---



## 17\. 安全策略



WalletConnect 必须遵守：



```Plain Text
1. Session proposal 必须用户确认
2. methods 不能超过钱包支持范围
3. chains 不能超过钱包支持范围
4. 每次 sign / tx 仍必须弹窗
5. 断开 session 必须通知对端
6. 过期 session 必须清理
7. session_request 必须校验 topic
8. request chainId 必须在 session chains 内
9. 黑名单 DApp URL 必须阻断 proposal
10. WalletConnect 审计必须记录
```



本章代码中还未加完整黑名单校验，Part 11 安全风控会补齐。



---



## 18\. DApp 侧测试



### 18\.1 连接



在外部 DApp 点击 WalletConnect，获得 URI：



```Plain Text
wc:xxxx@2?relay-protocol=irn&symKey=...
```



App 粘贴 URI：



```TypeScript
await walletConnectClient.pair(uri);
```



预期：



```Plain Text
弹出 WalletConnectProposalModal
用户批准后建立 session
外部 DApp 显示已连接
```



---



### 18\.2 签名



外部 DApp 发：



```TypeScript
personal_sign
```



预期：



```Plain Text
App 弹出 SignMessageModal
确认后返回 signature
```



---



### 18\.3 交易



外部 DApp 发：



```TypeScript
eth_sendTransaction
```



预期：



```Plain Text
App 弹出 TransactionConfirmModal
解析 approve / transfer / swap
确认后广播
返回 txHash
```



---



### 18\.4 断开



App 点击断开：



```TypeScript
await walletConnectClient.disconnect({ topic });
```



预期：



```Plain Text
外部 DApp 收到 session_delete
App 本地 session 标记 deleted
```



---



## 19\. 本章完成内容



本章完成：



```Plain Text
WalletConnect v2 SignClient 初始化
Pairing URI
Session Proposal
Session Approval
Namespace 构建
Session Storage
Session Service
Session Request Handler
RPC 请求处理
签名请求处理
交易请求处理
切链 / 加链处理
Session Delete
Event Sync
WalletConnect Proposal Modal
WalletConnect Screen
WalletConnect Sessions Screen
Runtime 工厂接入 WalletConnect
```



现在 DApp 浏览器已经支持：



```Plain Text
内置 WebView DApp
外部 WalletConnect DApp
```



两条入口统一复用：



```Plain Text
Permission
Signing
Transaction
Risk
Confirmation
WalletCore
RPC
```



---



## 20\. 下一章继续



下一段继续：



**《DApp 浏览器 Part 11：安全风控黑名单 / 钓鱼域名 / 合约黑名单 / URL 安全检测》**



将覆盖：



```Plain Text
URL Security Engine
Phishing Detector
Domain Blacklist
Homograph Attack 检测
HTTP / file / data / javascript 拦截
Redirect Chain 检测
Contract Blacklist
Risk Rule Storage
DApp 风险事件
WalletConnect Proposal 安全检测
WebView Navigation 安全升级
交易合约安全升级
Admin 风控数据结构
```



