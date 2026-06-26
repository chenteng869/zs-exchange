/**
 * WalletConnect 服务
 *
 * 功能：
 *  - WalletConnect v2 协议支持
 *  - Session 管理
 *  - 提案处理
 *  - 方法调用
 *  - 事件订阅
 *  - 多链支持
 *  - 会话持久化
 *  - 配对管理
 */

// ============================================================================
// 类型定义
// ============================================================================

export interface WCSession {
  id: string;
  topic: string;
  pairingTopic?: string;
  relay: {
    protocol: string;
    data?: any;
  };
  expiry: number;
  acknowledged: boolean;
  controller: string;
  self: WCParticipant;
  peer: WCParticipant;
  namespaces: Record<string, WCNamespace>;
  requiredNamespaces?: Record<string, WCNamespace>;
  optionalNamespaces?: Record<string, WCNamespace>;
  status: 'proposed' | 'approved' | 'rejected' | 'expired';
  createdAt: number;
  updatedAt: number;
}

export interface WCParticipant {
  publicKey: string;
  metadata: WCMetadata;
}

export interface WCMetadata {
  name: string;
  description: string;
  url: string;
  icons: string[];
  verifyUrl?: string;
  redirect?: {
    native?: string;
    universal?: string;
  };
}

export interface WCNamespace {
  chains?: string[];
  methods: string[];
  events: string[];
  accounts: string[];
}

export interface WCProposal {
  id: number;
  params: {
    id: number;
    pairingTopic?: string;
    expiry: number;
    requiredNamespaces: Record<string, WCNamespace>;
    optionalNamespaces?: Record<string, WCNamespace>;
    relays: Array<{ protocol: string }>;
    proposer: {
      publicKey: string;
      metadata: WCMetadata;
    };
    proposerPublicKey: string;
  };
  verified: {
    verifyUrl: string;
    validation: 'VALID' | 'INVALID' | 'UNKNOWN';
    isScam?: boolean;
    origin?: string;
  };
  createdAt: number;
}

export interface WCRequest {
  id: number;
  topic: string;
  method: string;
  params: any[];
  chainId?: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: number;
}

export interface WCPairing {
  topic: string;
  expiry: number;
  relay: {
    protocol: string;
    data?: any;
  };
  peerMetadata?: WCMetadata;
  isController: boolean;
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface WCError {
  code: number;
  message: string;
  data?: any;
}

export interface WCEvents {
  'session_proposal': WCProposal;
  'session_request': WCRequest;
  'session_delete': { topic: string };
  'session_expire': { topic: string };
  'session_update': { topic: string; namespaces: Record<string, WCNamespace> };
  'pairing_propose': any;
  'pairing_delete': { topic: string };
}

// ============================================================================
// EVM 方法列表
// ============================================================================

export const EVM_METHODS = [
  'eth_sendTransaction',
  'eth_signTransaction',
  'eth_sign',
  'personal_sign',
  'eth_signTypedData',
  'eth_signTypedData_v1',
  'eth_signTypedData_v3',
  'eth_signTypedData_v4',
  'eth_sendRawTransaction',
  'wallet_switchEthereumChain',
  'wallet_addEthereumChain',
  'wallet_getPermissions',
  'wallet_requestPermissions',
  'wallet_registerOnboarding',
  'wallet_watchAsset',
  'wallet_scanQRCode',
  'eth_accounts',
  'eth_requestAccounts',
  'eth_chainId',
  'net_version',
  'web3_clientVersion',
  'eth_hashrate',
  'eth_mining',
  'eth_syncing',
  'eth_gasPrice',
  'eth_estimateGas',
  'eth_call',
  'eth_getBalance',
  'eth_getTransactionCount',
  'eth_getBlockByNumber',
  'eth_getBlockByHash',
  'eth_getTransactionByHash',
  'eth_getTransactionReceipt',
  'eth_getLogs',
  'eth_getCode',
  'eth_getStorageAt',
  'eth_blockNumber',
  'eth_feeHistory',
  'eth_maxPriorityFeePerGas',
];

export const EVM_EVENTS = [
  'chainChanged',
  'accountsChanged',
  'connect',
  'disconnect',
  'message',
];

export const SOLANA_METHODS = [
  'solana_signMessage',
  'solana_signTransaction',
  'solana_signAndSendTransaction',
  'solana_signAllTransactions',
];

export const COSMOS_METHODS = [
  'cosmos_getAccounts',
  'cosmos_signDirect',
  'cosmos_signAmino',
];

// ============================================================================
// 链配置
// ============================================================================

export const WC_CHAIN_CONFIGS: Record<string, {
  chainId: string;
  name: string;
  namespace: string;
  methods: string[];
  events: string[];
}> = {
  ethereum: {
    chainId: 'eip155:1',
    name: 'Ethereum',
    namespace: 'eip155',
    methods: EVM_METHODS,
    events: EVM_EVENTS,
  },
  bsc: {
    chainId: 'eip155:56',
    name: 'BNB Chain',
    namespace: 'eip155',
    methods: EVM_METHODS,
    events: EVM_EVENTS,
  },
  polygon: {
    chainId: 'eip155:137',
    name: 'Polygon',
    namespace: 'eip155',
    methods: EVM_METHODS,
    events: EVM_EVENTS,
  },
  arbitrum: {
    chainId: 'eip155:42161',
    name: 'Arbitrum One',
    namespace: 'eip155',
    methods: EVM_METHODS,
    events: EVM_EVENTS,
  },
  optimism: {
    chainId: 'eip155:10',
    name: 'Optimism',
    namespace: 'eip155',
    methods: EVM_METHODS,
    events: EVM_EVENTS,
  },
  avalanche: {
    chainId: 'eip155:43114',
    name: 'Avalanche',
    namespace: 'eip155',
    methods: EVM_METHODS,
    events: EVM_EVENTS,
  },
  fantom: {
    chainId: 'eip155:250',
    name: 'Fantom',
    namespace: 'eip155',
    methods: EVM_METHODS,
    events: EVM_EVENTS,
  },
  base: {
    chainId: 'eip155:8453',
    name: 'Base',
    namespace: 'eip155',
    methods: EVM_METHODS,
    events: EVM_EVENTS,
  },
  solana: {
    chainId: 'solana:5eykt4UsFv8P8NJdLdbVoy8t9XnW1aZJ9P8y4JnQqL',
    name: 'Solana',
    namespace: 'solana',
    methods: SOLANA_METHODS,
    events: [],
  },
  cosmoshub: {
    chainId: 'cosmos:cosmoshub-4',
    name: 'Cosmos Hub',
    namespace: 'cosmos',
    methods: COSMOS_METHODS,
    events: [],
  },
};

// ============================================================================
// WalletConnect 服务
// ============================================================================

export class WalletConnectService {
  private sessions: Map<string, WCSession> = new Map();
  private pairings: Map<string, WCPairing> = new Map();
  private proposals: Map<number, WCProposal> = new Map();
  private requests: Map<number, WCRequest> = new Map();
  private eventListeners: Map<string, Function[]> = new Map();
  private isInitialized: boolean = false;
  private isConnected: boolean = false;
  private projectId: string = '';
  private metadata: WCMetadata = {
    name: 'ZS Exchange Wallet',
    description: '去中心化交易所钱包',
    url: 'https://zsexchange.io',
    icons: ['https://zsexchange.io/logo.png'],
  };
  private supportedChains: string[] = [];
  private activeAccounts: string[] = [];
  private maxSessions: number = 20;
  private maxPairings: number = 100;

  constructor() {}

  // ========================================================================
  // 初始化
  // ========================================================================

  /**
   * 初始化 WalletConnect
   */
  async initialize(
    projectId: string,
    metadata?: Partial<WCMetadata>
  ): Promise<boolean> {
    if (this.isInitialized) return true;

    this.projectId = projectId;
    if (metadata) {
      this.metadata = { ...this.metadata, ...metadata };
    }

    this.supportedChains = Object.keys(WC_CHAIN_CONFIGS);
    this.isInitialized = true;
    this.emit('initialized', { projectId, metadata: this.metadata });

    return true;
  }

  /**
   * 断开连接
   */
  async disconnect(): Promise<void> {
    for (const session of this.sessions.values()) {
      this.emit('session_delete', { topic: session.topic });
    }
    this.sessions.clear();
    this.isConnected = false;
    this.emit('disconnected', {});
  }

  // ========================================================================
  // 配对
  // ========================================================================

  /**
   * 创建配对
   */
  async pair(uri: string): Promise<WCPairing> {
    if (!this.isInitialized) {
      throw new Error('WalletConnect not initialized');
    }

    const pairing: WCPairing = {
      topic: `pairing_${Date.now()}`,
      expiry: Date.now() / 1000 + 30 * 24 * 60 * 60,
      relay: { protocol: 'irn' },
      isController: true,
      isActive: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    this.pairings.set(pairing.topic, pairing);
    this.cleanupOldPairings();

    this.emit('pairing_propose', { uri, pairing });

    return pairing;
  }

  /**
   * 获取配对列表
   */
  getPairings(): WCPairing[] {
    return Array.from(this.pairings.values()).sort((a, b) => b.createdAt - a.createdAt);
  }

  /**
   * 删除配对
   */
  async deletePairing(topic: string): Promise<boolean> {
    const result = this.pairings.delete(topic);
    if (result) {
      this.emit('pairing_delete', { topic });
    }
    return result;
  }

  /**
   * 断开所有配对
   */
  async disconnectAllPairings(): Promise<number> {
    const count = this.pairings.size;
    for (const topic of this.pairings.keys()) {
      this.emit('pairing_delete', { topic });
    }
    this.pairings.clear();
    return count;
  }

  // ========================================================================
  // 会话提案
  // ========================================================================

  /**
   * 处理会话提案
   */
  async handleSessionProposal(proposal: WCProposal): Promise<void> {
    this.proposals.set(proposal.id, proposal);
    this.emit('session_proposal', proposal);
  }

  /**
   * 批准会话
   */
  async approveSession(
    proposalId: number,
    accounts: string[],
    chains: string[]
  ): Promise<WCSession | null> {
    const proposal = this.proposals.get(proposalId);
    if (!proposal) return null;

    const namespaces: Record<string, WCNamespace> = {};

    for (const chain of chains) {
      const config = WC_CHAIN_CONFIGS[chain];
      if (!config) continue;

      if (!namespaces[config.namespace]) {
        namespaces[config.namespace] = {
          chains: [],
          methods: [],
          events: [],
          accounts: [],
        };
      }

      const ns = namespaces[config.namespace];
      if (!ns.chains!.includes(config.chainId)) {
        ns.chains!.push(config.chainId);
      }

      for (const method of config.methods) {
        if (!ns.methods.includes(method)) {
          ns.methods.push(method);
        }
      }

      for (const event of config.events) {
        if (!ns.events.includes(event)) {
          ns.events.push(event);
        }
      }

      for (const account of accounts) {
        const accountFull = `${config.chainId}:${account}`;
        if (!ns.accounts.includes(accountFull)) {
          ns.accounts.push(accountFull);
        }
      }
    }

    const session: WCSession = {
      id: `session_${Date.now()}`,
      topic: `session_${Date.now()}`,
      pairingTopic: proposal.params.pairingTopic,
      relay: { protocol: 'irn' },
      expiry: Date.now() / 1000 + 7 * 24 * 60 * 60,
      acknowledged: true,
      controller: 'self',
      self: {
        publicKey: 'self_public_key',
        metadata: this.metadata,
      },
      peer: {
        publicKey: proposal.params.proposerPublicKey,
        metadata: proposal.params.proposer.metadata,
      },
      namespaces,
      requiredNamespaces: proposal.params.requiredNamespaces,
      optionalNamespaces: proposal.params.optionalNamespaces,
      status: 'approved',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    this.sessions.set(session.topic, session);
    this.proposals.delete(proposalId);
    this.activeAccounts = accounts;
    this.isConnected = true;
    this.cleanupOldSessions();

    this.emit('session_approved', session);

    return session;
  }

  /**
   * 拒绝会话
   */
  async rejectSession(proposalId: number, reason?: string): Promise<boolean> {
    const proposal = this.proposals.get(proposalId);
    if (!proposal) return false;

    this.proposals.delete(proposalId);
    this.emit('session_rejected', { proposalId, reason });

    return true;
  }

  /**
   * 获取待处理提案
   */
  getPendingProposals(): WCProposal[] {
    return Array.from(this.proposals.values()).sort((a, b) => b.createdAt - a.createdAt);
  }

  // ========================================================================
  // 会话管理
  // ========================================================================

  /**
   * 获取所有会话
   */
  getSessions(): WCSession[] {
    return Array.from(this.sessions.values()).sort((a, b) => b.createdAt - a.createdAt);
  }

  /**
   * 获取会话
   */
  getSession(topic: string): WCSession | undefined {
    return this.sessions.get(topic);
  }

  /**
   * 获取活动会话数
   */
  getActiveSessionCount(): number {
    return this.sessions.size;
  }

  /**
   * 更新会话
   */
  async updateSession(
    topic: string,
    updates: {
      accounts?: string[];
      chains?: string[];
      namespaces?: Record<string, WCNamespace>;
    }
  ): Promise<boolean> {
    const session = this.sessions.get(topic);
    if (!session) return false;

    if (updates.namespaces) {
      session.namespaces = updates.namespaces;
    }

    session.updatedAt = Date.now();
    this.emit('session_update', { topic, namespaces: session.namespaces });

    return true;
  }

  /**
   * 断开会话
   */
  async disconnectSession(topic: string, reason?: string): Promise<boolean> {
    const session = this.sessions.get(topic);
    if (!session) return false;

    this.sessions.delete(topic);
    this.emit('session_delete', { topic, reason });

    if (this.sessions.size === 0) {
      this.isConnected = false;
    }

    return true;
  }

  /**
   * 扩展会话
   */
  async extendSession(topic: string): Promise<boolean> {
    const session = this.sessions.get(topic);
    if (!session) return false;

    session.expiry = Date.now() / 1000 + 7 * 24 * 60 * 60;
    session.updatedAt = Date.now();
    return true;
  }

  // ========================================================================
  // 请求处理
  // ========================================================================

  /**
   * 处理会话请求
   */
  async handleSessionRequest(request: WCRequest): Promise<void> {
    this.requests.set(request.id, request);
    this.emit('session_request', request);
  }

  /**
   * 批准请求
   */
  async approveRequest(requestId: number, result: any): Promise<boolean> {
    const request = this.requests.get(requestId);
    if (!request) return false;

    request.status = 'approved';
    this.emit('request_approved', { requestId, result });
    this.requests.delete(requestId);

    return true;
  }

  /**
   * 拒绝请求
   */
  async rejectRequest(requestId: number, error?: WCError): Promise<boolean> {
    const request = this.requests.get(requestId);
    if (!request) return false;

    request.status = 'rejected';
    this.emit('request_rejected', { requestId, error });
    this.requests.delete(requestId);

    return true;
  }

  /**
   * 获取待处理请求
   */
  getPendingRequests(): WCRequest[] {
    return Array.from(this.requests.values())
      .filter((r) => r.status === 'pending')
      .sort((a, b) => b.createdAt - a.createdAt);
  }

  // ========================================================================
  // 方法验证
  // ========================================================================

  /**
   * 验证方法是否受支持
   */
  isMethodSupported(method: string, chain: string): boolean {
    const config = WC_CHAIN_CONFIGS[chain];
    if (!config) return false;
    return config.methods.includes(method);
  }

  /**
   * 验证命名空间
   */
  validateNamespaces(
    requiredNamespaces: Record<string, WCNamespace>,
    supportedChains: string[]
  ): { valid: boolean; unsupported: string[] } {
    const unsupported: string[] = [];

    for (const [namespace, ns] of Object.entries(requiredNamespaces)) {
      for (const method of ns.methods) {
        let supported = false;
        for (const chain of supportedChains) {
          const config = WC_CHAIN_CONFIGS[chain];
          if (config && config.namespace === namespace && config.methods.includes(method)) {
            supported = true;
            break;
          }
        }
        if (!supported) {
          unsupported.push(`${namespace}:${method}`);
        }
      }
    }

    return { valid: unsupported.length === 0, unsupported };
  }

  // ========================================================================
  // 事件系统
  // ========================================================================

  /**
   * 监听事件
   */
  on(event: string, callback: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }

  /**
   * 移除监听
   */
  off(event: string, callback: Function): boolean {
    const listeners = this.eventListeners.get(event);
    if (!listeners) return false;
    const index = listeners.indexOf(callback);
    if (index > -1) {
      listeners.splice(index, 1);
      return true;
    }
    return false;
  }

  private emit(event: string, data: any): void {
    const listeners = this.eventListeners.get(event);
    if (!listeners) return;
    for (const listener of listeners) {
      try {
        listener(data);
      } catch (e) {
        console.error(`WC event listener error (${event}):`, e);
      }
    }
  }

  // ========================================================================
  // 工具方法
  // ========================================================================

  private cleanupOldSessions(): void {
    if (this.sessions.size <= this.maxSessions) return;

    const sorted = Array.from(this.sessions.values()).sort((a, b) => a.createdAt - b.createdAt);
    const toRemove = sorted.slice(0, this.sessions.size - this.maxSessions);

    for (const session of toRemove) {
      this.sessions.delete(session.topic);
    }
  }

  private cleanupOldPairings(): void {
    if (this.pairings.size <= this.maxPairings) return;

    const sorted = Array.from(this.pairings.values()).sort((a, b) => a.createdAt - b.createdAt);
    const toRemove = sorted.slice(0, this.pairings.size - this.maxPairings);

    for (const pairing of toRemove) {
      this.pairings.delete(pairing.topic);
    }
  }

  /**
   * 获取支持的链
   */
  getSupportedChains(): string[] {
    return this.supportedChains;
  }

  /**
   * 获取元数据
   */
  getMetadata(): WCMetadata {
    return { ...this.metadata };
  }

  /**
   * 检查是否已初始化
   */
  getIsInitialized(): boolean {
    return this.isInitialized;
  }

  /**
   * 检查是否已连接
   */
  getIsConnected(): boolean {
    return this.isConnected;
  }

  /**
   * 获取活动账户
   */
  getActiveAccounts(): string[] {
    return [...this.activeAccounts];
  }

  /**
   * 解析 URI
   */
  parseURI(uri: string): { protocol: string; version: string; topic: string; symKey: string; relay: string } | null {
    try {
      const match = uri.match(/^wc:([a-f0-9]+)@(\d)\?(.*)$/);
      if (!match) return null;

      const topic = match[1];
      const version = match[2];
      const params = new URLSearchParams(match[3]);

      return {
        protocol: 'wc',
        version,
        topic,
        symKey: params.get('symKey') || '',
        relay: params.get('relay-protocol') || 'irn',
      };
    } catch {
      return null;
    }
  }

  /**
   * 销毁服务
   */
  destroy(): void {
    this.sessions.clear();
    this.pairings.clear();
    this.proposals.clear();
    this.requests.clear();
    this.eventListeners.clear();
    this.isInitialized = false;
    this.isConnected = false;
  }
}

// ============================================================================
// 默认导出
// ============================================================================

export default {
  WalletConnectService,
  WC_CHAIN_CONFIGS,
  EVM_METHODS,
  EVM_EVENTS,
  SOLANA_METHODS,
  COSMOS_METHODS,
};
