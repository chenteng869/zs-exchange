/**
 * WalletConnect Provider
 * 实现 WalletConnect v2 Provider，用于与 DApp 通信
 * 支持 EIP-1193 标准接口，提供请求处理和事件通知
 */

import type { WCSession, WCRequestEvent, WCNamespace, WCMetadata } from './wc-utils';
import { generateRandomId, toCaip2ChainId, fromCaip2ChainId } from './wc-utils';
import { WCSessionManager } from './wc-session';

/**
 * Provider 事件类型
 */
export type ProviderEventType =
  | 'connect'
  | 'disconnect'
  | 'chainChanged'
  | 'accountsChanged'
  | 'message';

/**
 * Provider 事件回调
 */
export type ProviderEventCallback = (data: any) => void;

/**
 * Provider 请求处理函数
 */
export type RequestHandler = (
  method: string,
  params: any[],
  chainId: number,
  session: WCSession,
) => Promise<any>;

/**
 * Provider 配置
 */
export interface WCProviderConfig {
  sessionManager: WCSessionManager;
  metadata: WCMetadata;
  defaultChainId: number;
  supportedChainIds: number[];
  requestHandler?: RequestHandler;
}

/**
 * WalletConnect Provider 类
 * 实现 EIP-1193 标准的 Provider 接口
 * 用于 WalletConnect 会话中的请求处理
 */
export class WCProvider {
  /**
   * 会话管理器
   */
  private sessionManager: WCSessionManager;

  /**
   * 钱包元数据
   */
  private metadata: WCMetadata;

  /**
   * 默认链 ID
   */
  private defaultChainId: number;

  /**
   * 支持的链 ID 列表
   */
  private supportedChainIds: number[];

  /**
   * 请求处理器
   */
  private requestHandler?: RequestHandler;

  /**
   * 事件监听器
   */
  private eventListeners: Map<ProviderEventType, Set<ProviderEventCallback>> = new Map();

  /**
   * 是否已连接
   */
  private connected: boolean = false;

  /**
   * 当前链 ID
   */
  private currentChainId: number;

  /**
   * 当前账户列表
   */
  private currentAccounts: string[] = [];

  /**
   * 当前会话主题
   */
  private currentSessionTopic: string | null = null;

  /**
   * 构造函数
   * @param config Provider 配置
   */
  constructor(config: WCProviderConfig) {
    this.sessionManager = config.sessionManager;
    this.metadata = config.metadata;
    this.defaultChainId = config.defaultChainId;
    this.supportedChainIds = config.supportedChainIds;
    this.requestHandler = config.requestHandler;
    this.currentChainId = config.defaultChainId;

    this.setupEventListeners();
  }

  /**
   * 设置事件监听器
   */
  private setupEventListeners(): void {
    for (const event of ['connect', 'disconnect', 'chainChanged', 'accountsChanged', 'message'] as ProviderEventType[]) {
      this.eventListeners.set(event, new Set());
    }
  }

  /**
   * 触发事件
   * @param event 事件类型
   * @param data 事件数据
   */
  private emit(event: ProviderEventType, data: any): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      for (const listener of listeners) {
        try {
          listener(data);
        } catch (error) {
          console.error(`Provider 事件 ${event} 监听器错误:`, error);
        }
      }
    }
  }

  /**
   * 添加事件监听器
   * @param event 事件类型
   * @param listener 监听器
   */
  public on(event: ProviderEventType, listener: ProviderEventCallback): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.add(listener);
    }
  }

  /**
   * 移除事件监听器
   * @param event 事件类型
   * @param listener 监听器
   */
  public off(event: ProviderEventType, listener: ProviderEventCallback): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.delete(listener);
    }
  }

  /**
   * 添加一次性事件监听器
   * @param event 事件类型
   * @param listener 监听器
   */
  public once(event: ProviderEventType, listener: ProviderEventCallback): void {
    const onceListener = (data: any) => {
      this.off(event, onceListener);
      listener(data);
    };
    this.on(event, onceListener);
  }

  /**
   * 发送请求
   * @param args 请求参数
   * @returns 响应结果
   */
  public async request(args: {
    method: string;
    params?: any[];
  }): Promise<any> {
    const { method, params = [] } = args;

    if (!this.connected && method !== 'eth_requestAccounts') {
      throw new Error('Provider 未连接');
    }

    switch (method) {
      case 'eth_chainId':
        return `0x${this.currentChainId.toString(16)}`;

      case 'eth_accounts':
        return this.currentAccounts;

      case 'eth_requestAccounts':
        return this.handleRequestAccounts();

      case 'wallet_switchEthereumChain':
        return this.handleSwitchChain(params);

      default:
        if (this.requestHandler) {
          const session = this.currentSessionTopic
            ? this.sessionManager.getSession(this.currentSessionTopic)
            : null;
          if (session) {
            return this.requestHandler(method, params, this.currentChainId, session);
          }
        }
        throw new Error(`不支持的方法: ${method}`);
    }
  }

  /**
   * 处理请求账户
   */
  private async handleRequestAccounts(): Promise<string[]> {
    if (this.currentAccounts.length > 0) {
      return this.currentAccounts;
    }
    throw new Error('未授权访问账户');
  }

  /**
   * 处理切换链
   */
  private async handleSwitchChain(params: any[]): Promise<void> {
    if (!params || params.length === 0) {
      throw new Error('缺少参数');
    }

    const chainIdHex = params[0]?.chainId;
    if (!chainIdHex) {
      throw new Error('缺少 chainId 参数');
    }

    const chainId = parseInt(chainIdHex, 16);
    if (!this.supportedChainIds.includes(chainId)) {
      throw {
        code: 4902,
        message: `不支持的链 ID: ${chainId}`,
      };
    }

    await this.switchChain(chainId);
  }

  /**
   * 连接 Provider
   * @param sessionTopic 会话主题
   * @param accounts 账户列表
   * @param chainId 链 ID
   */
  public connect(
    sessionTopic: string,
    accounts: string[],
    chainId?: number,
  ): void {
    this.currentSessionTopic = sessionTopic;
    this.currentAccounts = accounts;
    this.currentChainId = chainId || this.defaultChainId;
    this.connected = true;

    this.emit('connect', {
      chainId: `0x${this.currentChainId.toString(16)}`,
    });

    this.emit('accountsChanged', accounts);
    this.emit('chainChanged', `0x${this.currentChainId.toString(16)}`);
  }

  /**
   * 断开连接
   * @param reason 断开原因
   */
  public disconnect(reason?: string): void {
    this.connected = false;
    this.currentAccounts = [];
    this.currentSessionTopic = null;

    this.emit('disconnect', {
      code: 1000,
      message: reason || '用户断开连接',
    });
  }

  /**
   * 切换链
   * @param chainId 链 ID
   */
  public async switchChain(chainId: number): Promise<void> {
    if (!this.supportedChainIds.includes(chainId)) {
      throw new Error(`不支持的链 ID: ${chainId}`);
    }

    this.currentChainId = chainId;
    this.emit('chainChanged', `0x${chainId.toString(16)}`);
  }

  /**
   * 更新账户
   * @param accounts 新的账户列表
   */
  public updateAccounts(accounts: string[]): void {
    this.currentAccounts = accounts;
    this.emit('accountsChanged', accounts);
  }

  /**
   * 处理 WalletConnect 请求
   * @param event 请求事件
   * @returns 响应结果
   */
  public async handleWCRequest(event: WCRequestEvent): Promise<any> {
    const { request, chainId: chainIdCaip2 } = event.params;
    const { method, params = [] } = request;

    let chainId = this.defaultChainId;
    try {
      const parsed = fromCaip2ChainId(chainIdCaip2);
      chainId = parsed.chainId;
    } catch {
      // 使用默认链 ID
    }

    if (this.requestHandler) {
      const session = this.sessionManager.getSession(event.topic);
      if (session) {
        return this.requestHandler(method, params, chainId, session);
      }
    }

    throw new Error(`无法处理请求: ${method}`);
  }

  /**
   * 获取当前链 ID
   * @returns 链 ID
   */
  public getChainId(): number {
    return this.currentChainId;
  }

  /**
   * 获取当前账户列表
   * @returns 账户列表
   */
  public getAccounts(): string[] {
    return this.currentAccounts;
  }

  /**
   * 检查是否已连接
   * @returns 是否已连接
   */
  public isConnected(): boolean {
    return this.connected;
  }

  /**
   * 获取当前会话主题
   * @returns 会话主题
   */
  public getSessionTopic(): string | null {
    return this.currentSessionTopic;
  }

  /**
   * 启用 Provider
   * @param chainId 链 ID
   * @param accounts 账户列表
   */
  public enable(chainId: number, accounts: string[]): void {
    this.currentChainId = chainId;
    this.currentAccounts = accounts;
    this.connected = true;

    this.emit('connect', {
      chainId: `0x${chainId.toString(16)}`,
    });
  }

  /**
   * 发送消息事件
   * @param data 消息数据
   */
  public sendMessage(data: any): void {
    this.emit('message', {
      type: 'eth_subscription',
      data,
    });
  }

  /**
   * 设置请求处理器
   * @param handler 请求处理器
   */
  public setRequestHandler(handler: RequestHandler): void {
    this.requestHandler = handler;
  }

  /**
   * 销毁 Provider
   */
  public destroy(): void {
    this.eventListeners.clear();
    this.connected = false;
    this.currentAccounts = [];
    this.currentSessionTopic = null;
  }
}
