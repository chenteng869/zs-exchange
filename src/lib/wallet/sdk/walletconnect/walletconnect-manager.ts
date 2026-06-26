/**
 * WalletConnect 管理器
 * WalletConnect v2 协议的核心管理器
 * 负责会话连接、请求处理、事件分发等核心功能
 */

import { WCSessionManager } from './wc-session';
import { WCProvider } from './wc-provider';
import type {
  WCSession,
  WCMetadata,
  WCPairingProposal,
  WCRequestEvent,
  WCNamespace,
} from './wc-utils';
import type {
  WCPairingInfo,
} from './wc-session';
import {
  parseWalletConnectUri,
  generateWalletConnectUri,
  generateRandomHex,
  buildSessionNamespaces,
  extractChainIdsFromNamespaces,
  isStandardEvmMethod,
  isStandardEvmEvent,
  toCaip2ChainId,
  fromCaip2ChainId,
  toCaip10Account,
  formatSessionRemainingTime,
  truncateAddress,
} from './wc-utils';
import type {
  WalletSDKOptions,
  ChainConfig,
  AccountInfo,
  DAppSession,
  Address,
  SignRequest,
  TransactionRequest,
} from '../sdk.types';
import { SignConfirmManager } from '../sign-confirm/sign-confirm-manager';

/**
 * 连接状态
 */
export type ConnectionStatus =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'pairing'
  | 'approving';

/**
 * WalletConnect 事件类型
 */
export type WCEventType =
  | 'session_proposal'
  | 'session_approved'
  | 'session_rejected'
  | 'session_update'
  | 'session_delete'
  | 'session_request'
  | 'session_ping'
  | 'pairing_proposal'
  | 'pairing_approved'
  | 'pairing_rejected'
  | 'pairing_delete'
  | 'connection_status_change';

/**
 * WalletConnect 事件回调
 */
export type WCEventCallback = (event: WCEventType, data: any) => void;

/**
 * 连接提案
 */
export interface ConnectionProposal {
  id: number;
  proposer: {
    name: string;
    description: string;
    url: string;
    icon: string;
  };
  requiredChains: number[];
  optionalChains: number[];
  requiredMethods: string[];
  optionalMethods: string[];
  requiredEvents: string[];
  optionalEvents: string[];
  pairingTopic: string;
}

/**
 * 请求处理器回调
 */
export type WCRequestHandler = (
  request: WCRequestEvent,
  session: WCSession,
) => Promise<any>;

/**
 * WalletConnect 管理器配置
 */
interface WCManagerConfig {
  projectId: string;
  metadata: WCMetadata;
  defaultChainId: number;
  supportedChainIds: number[];
  storagePrefix: string;
  maxSessions: number;
  debug?: boolean;
}

/**
 * WalletConnect 管理器类
 * 提供 WalletConnect v2 协议的完整实现
 * 包括配对管理、会话管理、请求处理等
 */
export class WalletConnectManager {
  /**
   * 配置
   */
  private config: WCManagerConfig;

  /**
   * 会话管理器
   */
  private sessionManager: WCSessionManager;

  /**
   * Provider 实例
   */
  private provider: WCProvider | null = null;

  /**
   * 事件监听器
   */
  private eventListeners: Set<WCEventCallback> = new Set();

  /**
   * 连接状态
   */
  private connectionStatus: ConnectionStatus = 'disconnected';

  /**
   * 当前连接提案
   */
  private pendingProposal: WCPairingProposal | null = null;

  /**
   * 当前配对 URI
   */
  private currentPairingUri: string | null = null;

  /**
   * 请求处理器
   */
  private requestHandler?: WCRequestHandler;

  /**
   * 链配置映射
   */
  private chainConfigs: Map<number, ChainConfig> = new Map();

  /**
   * 当前账户列表
   */
  private currentAccounts: AccountInfo[] = [];

  /**
   * 调试模式
   */
  private debug: boolean;

  /**
   * 构造函数
   * @param options SDK 配置
   */
  constructor(options: WalletSDKOptions) {
    this.config = {
      projectId: options.walletConnectProjectId || '',
      metadata: {
        name: options.metadataName || options.projectName,
        description: options.metadataDescription || options.projectDescription || '',
        url: options.metadataUrl || options.projectUrl || '',
        icons: options.metadataIcons || (options.projectIcon ? [options.projectIcon] : []),
      },
      defaultChainId: options.defaultChainId || 1,
      supportedChainIds: options.supportedChainIds || [1],
      storagePrefix: options.storageKeyPrefix || 'wallet_sdk',
      maxSessions: options.maxSessions || 50,
      debug: options.debug || false,
    };

    this.debug = this.config.debug || false;
    this.sessionManager = new WCSessionManager(
      this.config.storagePrefix,
      this.config.maxSessions,
    );

    this.initializeProvider();
    this.setupSessionManagerListeners();
  }

  /**
   * 初始化 Provider
   */
  private initializeProvider(): void {
    this.provider = new WCProvider({
      sessionManager: this.sessionManager,
      metadata: this.config.metadata,
      defaultChainId: this.config.defaultChainId,
      supportedChainIds: this.config.supportedChainIds,
      requestHandler: async (method, params, chainId, session) => {
        return this.handleProviderRequest(method, params, chainId, session);
      },
    });
  }

  /**
   * 设置会话管理器监听器
   */
  private setupSessionManagerListeners(): void {
    this.sessionManager.addEventListener((event, data) => {
      this.log('会话事件:', event, data);

      switch (event) {
        case 'session_created':
          this.emit('session_approved', data);
          this.setConnectionStatus('connected');
          break;
        case 'session_deleted':
        case 'session_expired':
          this.emit('session_delete', data);
          if (this.sessionManager.getSessionCount() === 0) {
            this.setConnectionStatus('disconnected');
          }
          break;
        case 'session_updated':
          this.emit('session_update', data);
          break;
      }
    });
  }

  /**
   * 输出调试日志
   * @param args 日志参数
   */
  private log(...args: any[]): void {
    if (this.debug) {
      console.log('[WalletConnect]', ...args);
    }
  }

  /**
   * 触发事件
   * @param event 事件类型
   * @param data 事件数据
   */
  private emit(event: WCEventType, data: any): void {
    for (const listener of this.eventListeners) {
      try {
        listener(event, data);
      } catch (error) {
        console.error('WalletConnect 事件监听器错误:', error);
      }
    }
  }

  /**
   * 设置连接状态
   * @param status 连接状态
   */
  private setConnectionStatus(status: ConnectionStatus): void {
    this.connectionStatus = status;
    this.emit('connection_status_change', status);
  }

  /**
   * 添加事件监听器
   * @param callback 回调函数
   */
  public on(callback: WCEventCallback): void {
    this.eventListeners.add(callback);
  }

  /**
   * 移除事件监听器
   * @param callback 回调函数
   */
  public off(callback: WCEventCallback): void {
    this.eventListeners.delete(callback);
  }

  /**
   * 初始化 WalletConnect
   */
  public async init(): Promise<void> {
    this.log('初始化 WalletConnect 管理器');
    this.setConnectionStatus('disconnected');
  }

  /**
   * 连接 WalletConnect URI
   * @param uri WalletConnect URI
   */
  public async connect(uri: string): Promise<void> {
    this.log('连接 URI:', uri);
    this.setConnectionStatus('connecting');

    try {
      const parsed = parseWalletConnectUri(uri);
      this.log('解析 URI:', parsed);

      const pairing: WCPairingInfo = {
        topic: parsed.topic,
        relay: parsed.relayUrl,
        expiry: parsed.expiry || Math.floor(Date.now() / 1000) + 86400,
        active: true,
      };

      this.sessionManager.addPairing(pairing);
      this.currentPairingUri = uri;

      this.emit('pairing_proposal', {
        topic: parsed.topic,
        relay: parsed.relayUrl,
      });

      this.setConnectionStatus('pairing');
    } catch (error) {
      this.log('连接失败:', error);
      this.setConnectionStatus('disconnected');
      throw error;
    }
  }

  /**
   * 生成新的配对 URI
   * @returns 配对 URI 和主题
   */
  public async createPairing(): Promise<{
    uri: string;
    topic: string;
    symKey: string;
  }> {
    this.log('创建新配对');

    const topic = generateRandomHex(16);
    const symKey = generateRandomHex(32);
    const uri = generateWalletConnectUri(topic, symKey);

    const pairing: WCPairingInfo = {
      topic,
      relay: 'wss://relay.walletconnect.com',
      expiry: Math.floor(Date.now() / 1000) + 300,
      active: false,
    };

    this.sessionManager.addPairing(pairing);
    this.currentPairingUri = uri;

    this.log('配对 URI:', uri);
    return { uri, topic, symKey };
  }

  /**
   * 批准会话提案
   * @param proposalId 提案 ID
   * @param accounts 账户列表
   * @param chains 链列表
   */
  public async approveSession(
    proposalId: number,
    accounts: AccountInfo[],
    chains: ChainConfig[],
  ): Promise<WCSession> {
    this.log('批准会话:', proposalId);
    this.setConnectionStatus('approving');

    const methods = this.getSupportedMethods();
    const events = this.getSupportedEvents();
    const namespaces = buildSessionNamespaces(accounts, chains, methods, events);

    const session: WCSession = {
      topic: generateRandomHex(16),
      pairingTopic: this.pendingProposal?.params.pairingTopic || '',
      relay: {
        protocol: 'irn',
      },
      expiry: Math.floor(Date.now() / 1000) + 604800,
      acknowledged: true,
      controller: 'self',
      namespaces,
      peer: {
        publicKey: this.pendingProposal?.params.proposer.publicKey || '',
        metadata: this.pendingProposal?.params.proposer.metadata || {
          name: 'Unknown',
          description: '',
          url: '',
          icons: [],
        },
      },
      self: {
        publicKey: generateRandomHex(32),
        metadata: this.config.metadata,
      },
    };

    const createdSession = this.sessionManager.createSession(session);
    this.pendingProposal = null;
    this.currentAccounts = accounts;

    if (this.provider) {
      const addresses = accounts.map(a => a.address);
      this.provider.connect(session.topic, addresses, chains[0]?.chainId || this.config.defaultChainId);
    }

    this.log('会话已创建:', session.topic);
    return createdSession;
  }

  /**
   * 拒绝会话提案
   * @param proposalId 提案 ID
   * @param reason 拒绝原因
   */
  public async rejectSession(proposalId: number, reason?: string): Promise<void> {
    this.log('拒绝会话:', proposalId, reason);
    this.pendingProposal = null;
    this.setConnectionStatus('disconnected');
    this.emit('session_rejected', { id: proposalId, reason });
  }

  /**
   * 断开会话
   * @param topic 会话主题
   * @param reason 断开原因
   */
  public async disconnectSession(topic: string, reason?: string): Promise<void> {
    this.log('断开会话:', topic, reason);
    this.sessionManager.deleteSession(topic);

    if (this.provider?.getSessionTopic() === topic) {
      this.provider.disconnect(reason);
    }
  }

  /**
   * 处理 Provider 请求
   * @param method 方法名
   * @param params 参数
   * @param chainId 链 ID
   * @param session 会话
   * @returns 响应
   */
  private async handleProviderRequest(
    method: string,
    params: any[],
    chainId: number,
    session: WCSession,
  ): Promise<any> {
    this.log('处理请求:', method, params, chainId);

    if (this.requestHandler) {
      const requestEvent: WCRequestEvent = {
        id: Date.now(),
        topic: session.topic,
        params: {
          request: {
            method,
            params,
          },
          chainId: toCaip2ChainId(chainId),
        },
      };

      return this.requestHandler(requestEvent, session);
    }

    throw new Error(`未配置请求处理器: ${method}`);
  }

  /**
   * 获取支持的方法
   * @returns 方法列表
   */
  private getSupportedMethods(): string[] {
    return [
      'eth_accounts',
      'eth_chainId',
      'eth_requestAccounts',
      'eth_sendTransaction',
      'eth_signTransaction',
      'eth_sign',
      'eth_signTypedData',
      'eth_signTypedData_v3',
      'eth_signTypedData_v4',
      'personal_sign',
      'wallet_switchEthereumChain',
      'wallet_addEthereumChain',
      'wallet_getPermissions',
      'wallet_requestPermissions',
    ];
  }

  /**
   * 获取支持的事件
   * @returns 事件列表
   */
  private getSupportedEvents(): string[] {
    return [
      'chainChanged',
      'accountsChanged',
      'message',
    ];
  }

  /**
   * 获取连接状态
   * @returns 连接状态
   */
  public getConnectionStatus(): ConnectionStatus {
    return this.connectionStatus;
  }

  /**
   * 获取所有会话
   * @returns 会话列表
   */
  public getSessions(): WCSession[] {
    return this.sessionManager.getAllSessions();
  }

  /**
   * 获取会话
   * @param topic 会话主题
   * @returns 会话
   */
  public getSession(topic: string): WCSession | undefined {
    return this.sessionManager.getSession(topic);
  }

  /**
   * 获取 DApp 会话列表
   * @returns DApp 会话列表
   */
  public getDAppSessions(): DAppSession[] {
    const sessions = this.sessionManager.getAllSessions();
    return sessions.map(s => this.sessionManager.toDAppSession(s));
  }

  /**
   * 获取 DApp 会话
   * @param topic 会话主题
   * @returns DApp 会话
   */
  public getDAppSession(topic: string): DAppSession | undefined {
    const session = this.sessionManager.getSession(topic);
    if (!session) return undefined;
    return this.sessionManager.toDAppSession(session);
  }

  /**
   * 设置链配置
   * @param chains 链配置列表
   */
  public setChainConfigs(chains: ChainConfig[]): void {
    this.chainConfigs.clear();
    for (const chain of chains) {
      this.chainConfigs.set(chain.chainId, chain);
    }
  }

  /**
   * 设置当前账户
   * @param accounts 账户列表
   */
  public setCurrentAccounts(accounts: AccountInfo[]): void {
    this.currentAccounts = accounts;
  }

  /**
   * 设置请求处理器
   * @param handler 请求处理器
   */
  public setRequestHandler(handler: WCRequestHandler): void {
    this.requestHandler = handler;
  }

  /**
   * 获取 Provider
   * @returns Provider 实例
   */
  public getProvider(): WCProvider | null {
    return this.provider;
  }

  /**
   * 获取会话管理器
   * @returns 会话管理器
   */
  public getSessionManager(): WCSessionManager {
    return this.sessionManager;
  }

  /**
   * 切换链
   * @param topic 会话主题
   * @param chainId 链 ID
   */
  public async switchChain(topic: string, chainId: number): Promise<void> {
    const session = this.sessionManager.getSession(topic);
    if (!session) {
      throw new Error('会话不存在');
    }

    if (!this.chainConfigs.has(chainId)) {
      throw new Error(`不支持的链 ID: ${chainId}`);
    }

    const chainIds = extractChainIdsFromNamespaces(session.namespaces);
    if (!chainIds.includes(chainId)) {
      const newNamespaces: Record<string, WCNamespace> = { ...session.namespaces };
      if (newNamespaces.eip155) {
        newNamespaces.eip155 = {
          ...newNamespaces.eip155,
          chains: [...new Set([...newNamespaces.eip155.chains, toCaip2ChainId(chainId)])],
        };
      }
      this.sessionManager.updateNamespaces(topic, newNamespaces);
    }

    this.log('切换链:', topic, chainId);
  }

  /**
   * 更新会话账户
   * @param topic 会话主题
   * @param accounts 新的账户列表
   */
  public async updateAccounts(topic: string, accounts: AccountInfo[]): Promise<void> {
    const session = this.sessionManager.getSession(topic);
    if (!session) {
      throw new Error('会话不存在');
    }

    const chainIds = extractChainIdsFromNamespaces(session.namespaces);
    const newAccounts: string[] = [];

    for (const chainId of chainIds) {
      for (const account of accounts) {
        newAccounts.push(toCaip10Account(account.address, chainId));
      }
    }

    const newNamespaces: Record<string, WCNamespace> = { ...session.namespaces };
    if (newNamespaces.eip155) {
      newNamespaces.eip155 = {
        ...newNamespaces.eip155,
        accounts: newAccounts,
      };
    }

    this.sessionManager.updateNamespaces(topic, newNamespaces);
    this.currentAccounts = accounts;
    this.log('更新账户:', topic, accounts.length);
  }

  /**
   * 延长会话
   * @param topic 会话主题
   * @param seconds 延长秒数
   */
  public async extendSession(topic: string, seconds: number = 604800): Promise<void> {
    this.sessionManager.extendSession(topic, seconds);
    this.log('延长会话:', topic, seconds);
  }

  /**
   * 发送响应
   * @param topic 会话主题
   * @param requestId 请求 ID
   * @param result 结果
   */
  public async sendResponse(topic: string, requestId: number, result: any): Promise<void> {
    this.log('发送响应:', topic, requestId, result);
  }

  /**
   * 发送错误响应
   * @param topic 会话主题
   * @param requestId 请求 ID
   * @param error 错误
   */
  public async sendError(
    topic: string,
    requestId: number,
    error: { code: number; message: string; data?: any },
  ): Promise<void> {
    this.log('发送错误响应:', topic, requestId, error);
  }

  /**
   * 发送事件
   * @param topic 会话主题
   * @param event 事件名
   * @param data 事件数据
   * @param chainId 链 ID
   */
  public async sendEvent(
    topic: string,
    event: string,
    data: any,
    chainId?: number,
  ): Promise<void> {
    this.log('发送事件:', topic, event, data, chainId);

    if (this.provider?.getSessionTopic() === topic) {
      if (event === 'chainChanged' && data) {
        this.provider.switchChain(parseInt(data, 16));
      } else if (event === 'accountsChanged') {
        this.provider.updateAccounts(data);
      }
    }
  }

  /**
   * 销毁管理器
   */
  public destroy(): void {
    this.log('销毁 WalletConnect 管理器');
    this.eventListeners.clear();
    this.sessionManager.destroy();
    this.provider?.destroy();
    this.provider = null;
    this.setConnectionStatus('disconnected');
  }

  /**
   * 获取当前配对 URI
   * @returns 配对 URI
   */
  public getCurrentPairingUri(): string | null {
    return this.currentPairingUri;
  }

  /**
   * 清除所有会话
   */
  public clearAllSessions(): void {
    this.sessionManager.clearAllSessions();
    this.provider?.disconnect('清除所有会话');
    this.setConnectionStatus('disconnected');
  }

  /**
   * 获取会话数量
   * @returns 会话数量
   */
  public getSessionCount(): number {
    return this.sessionManager.getSessionCount();
  }

  /**
   * 导出数据
   * @returns 会话和配对数据
   */
  public exportData() {
    return this.sessionManager.exportData();
  }

  /**
   * 导入数据
   * @param data 会话和配对数据
   */
  public importData(data: any): void {
    this.sessionManager.importData(data);
  }

  /**
   * 格式化会话信息用于显示
   * @param session 会话
   * @returns 格式化的会话信息
   */
  public formatSessionInfo(session: WCSession): {
    name: string;
    description: string;
    url: string;
    icon: string;
    chains: number[];
    accounts: { address: string; truncated: string }[];
    remainingTime: string;
  } {
    const chainIds = extractChainIdsFromNamespaces(session.namespaces);
    const accounts: { address: string; truncated: string }[] = [];

    const seenAddresses = new Set<string>();
    for (const namespace of Object.values(session.namespaces)) {
      if (namespace.accounts) {
        for (const account of namespace.accounts) {
          const parts = account.split(':');
          if (parts.length === 3 && !seenAddresses.has(parts[2])) {
            seenAddresses.add(parts[2]);
            accounts.push({
              address: parts[2],
              truncated: truncateAddress(parts[2]),
            });
          }
        }
      }
    }

    return {
      name: session.peer.metadata.name,
      description: session.peer.metadata.description,
      url: session.peer.metadata.url,
      icon: session.peer.metadata.icons[0] || '',
      chains: chainIds,
      accounts,
      remainingTime: formatSessionRemainingTime(session.expiry),
    };
  }
}
