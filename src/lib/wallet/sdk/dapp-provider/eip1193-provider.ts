/**
 * EIP-1193 标准 Provider
 * 实现完整的 EIP-1193 以太坊 Provider 接口
 * 用于 DApp 浏览器环境中的 Web3 注入
 * 遵循 EIP-1193、EIP-1102、EIP-3085、EIP-3326 标准
 */

import { RequestHandler, RequestContext, RequestResult } from './request-handler';
import { ProviderMiddleware } from './provider-middleware';
import type {
  Address,
  AccountInfo,
  AccountType,
  AccountStatus,
  ChainConfig,
  DAppSession,
  SDKEventName,
} from '../sdk.types';

/**
 * Provider 事件类型
 */
export type ProviderEvent =
  | 'connect'
  | 'disconnect'
  | 'chainChanged'
  | 'accountsChanged'
  | 'message'
  | 'notification';

/**
 * Provider 事件回调
 */
export type ProviderEventCallback = (data: any) => void;

/**
 * Provider 状态
 */
export type ProviderStatus = 'disconnected' | 'connecting' | 'connected' | 'locked';

/**
 * Provider 配置
 */
export interface EIP1193ProviderConfig {
  requestHandler: RequestHandler;
  middleware: ProviderMiddleware;
  defaultChainId: number;
  supportedChainIds: number[];
  origin: string;
  debug?: boolean;
}

/**
 * 连接信息
 */
interface ConnectInfo {
  chainId: string;
}

/**
 * 断开信息
 */
interface ProviderRpcError extends Error {
  code: number;
  data?: any;
}

/**
 * 消息对象
 */
interface ProviderMessage {
  type: string;
  data: unknown;
}

/**
 * EIP-1193 Provider 类
 * 完整实现 EIP-1193 标准的以太坊 Provider
 * 用于注入到 DApp 浏览器中
 */
export class EIP1193Provider {
  /**
   * 请求处理器
   */
  private requestHandler: RequestHandler;

  /**
   * 中间件管理器
   */
  private middleware: ProviderMiddleware;

  /**
   * 默认链 ID
   */
  private defaultChainId: number;

  /**
   * 支持的链 ID 列表
   */
  private supportedChainIds: number[];

  /**
   * DApp 来源
   */
  private origin: string;

  /**
   * 调试模式
   */
  private debug: boolean;

  /**
   * 事件监听器
   */
  private eventListeners: Map<ProviderEvent, Set<ProviderEventCallback>> = new Map();

  /**
   * Provider 状态
   */
  private status: ProviderStatus = 'disconnected';

  /**
   * 当前链 ID
   */
  private chainId: number;

  /**
   * 当前账户列表
   */
  private accounts: Address[] = [];

  /**
   * 是否授权
   */
  private authorized: boolean = false;

  /**
   * 是否启用
   */
  private isEnabled: boolean = false;

  /**
   * 当前会话 ID
   */
  private sessionId: string | null = null;

  /**
   * 当前账户信息
   */
  private accountInfos: AccountInfo[] = [];

  /**
   * 请求计数器
   */
  private requestId: number = 0;

  /**
   * 构造函数
   * @param config Provider 配置
   */
  constructor(config: EIP1193ProviderConfig) {
    this.requestHandler = config.requestHandler;
    this.middleware = config.middleware;
    this.defaultChainId = config.defaultChainId;
    this.supportedChainIds = config.supportedChainIds;
    this.origin = config.origin;
    this.debug = config.debug || false;
    this.chainId = config.defaultChainId;

    this.initializeEventListeners();
  }

  /**
   * 初始化事件监听器映射
   */
  private initializeEventListeners(): void {
    const events: ProviderEvent[] = [
      'connect',
      'disconnect',
      'chainChanged',
      'accountsChanged',
      'message',
      'notification',
    ];

    for (const event of events) {
      this.eventListeners.set(event, new Set());
    }
  }

  /**
   * 输出调试日志
   * @param args 日志参数
   */
  private log(...args: any[]): void {
    if (this.debug) {
      console.log('[EIP1193Provider]', ...args);
    }
  }

  /**
   * 触发事件
   * @param event 事件类型
   * @param data 事件数据
   */
  private emit(event: ProviderEvent, data: any): void {
    this.log('触发事件:', event, data);
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
  public on(event: ProviderEvent, listener: ProviderEventCallback): void {
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
  public removeListener(event: ProviderEvent, listener: ProviderEventCallback): void {
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
  public once(event: ProviderEvent, listener: ProviderEventCallback): void {
    const onceListener = (data: any) => {
      this.removeListener(event, onceListener);
      listener(data);
    };
    this.on(event, onceListener);
  }

  /**
   * 发送请求 - EIP-1193 标准方法
   * @param args 请求参数
   * @returns 请求结果
   */
  public async request(args: {
    method: string;
    params?: any[] | undefined;
  }): Promise<any> {
    const { method, params = [] } = args;
    this.log('请求:', method, params);

    this.requestId++;

    const requestContext: RequestContext = {
      origin: this.origin,
      sessionId: this.sessionId || undefined,
      chainId: this.chainId,
      accounts: this.accountInfos,
      currentAddress: this.accounts[0] || ('0x0000000000000000000000000000000000000000' as Address),
    };

    const result = await this.middleware.execute(
      method,
      params,
      requestContext,
      async () => {
        return this.requestHandler.handleRequest(method, params, requestContext);
      },
    );

    if (!result.success) {
      const error: ProviderRpcError = new Error(result.error?.message || '未知错误') as ProviderRpcError;
      error.code = result.error?.code || -32603;
      error.data = result.error?.data;
      throw error;
    }

    this.handleSideEffects(method, result.data);

    return result.data;
  }

  /**
   * 处理请求副作用
   * @param method 方法名
   * @param result 结果
   */
  private handleSideEffects(method: string, result: any): void {
    switch (method) {
      case 'eth_requestAccounts':
        if (Array.isArray(result) && result.length > 0) {
          this.authorized = true;
          this.status = 'connected';
          this.emit('connect', { chainId: `0x${this.chainId.toString(16)}` });
          this.emit('accountsChanged', result);
        }
        break;

      case 'wallet_switchEthereumChain':
        this.emit('chainChanged', `0x${this.chainId.toString(16)}`);
        break;
    }
  }

  /**
   * 启用 Provider - EIP-1102
   * @returns 账户列表
   */
  public async enable(): Promise<string[]> {
    this.log('启用 Provider');

    if (this.authorized && this.accounts.length > 0) {
      return this.accounts;
    }

    const accounts = await this.request({
      method: 'eth_requestAccounts',
      params: [],
    });

    this.isEnabled = true;
    return accounts;
  }

  /**
   * 连接 Provider
   * @param options 连接选项
   */
  public connect(options?: {
    chainId?: number;
    accounts?: Address[];
    sessionId?: string;
  }): void {
    this.log('连接 Provider', options);

    if (options?.chainId) {
      this.chainId = options.chainId;
    }

    if (options?.accounts) {
      this.accounts = options.accounts;
      this.accountInfos = options.accounts.map(addr => ({
        id: `${addr}-0`,
        address: addr,
        name: 'Account',
        type: 'watch' as AccountType,
        status: 'active' as AccountStatus,
        chainId: this.chainId,
        isDefault: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }));
    }

    if (options?.sessionId) {
      this.sessionId = options.sessionId;
    }

    this.authorized = true;
    this.status = 'connected';
    this.isEnabled = true;

    this.emit('connect', {
      chainId: `0x${this.chainId.toString(16)}`,
    });
  }

  /**
   * 断开连接
   * @param reason 断开原因
   */
  public disconnect(reason?: string): void {
    this.log('断开连接:', reason);

    this.authorized = false;
    this.status = 'disconnected';
    this.isEnabled = false;
    this.accounts = [];
    this.accountInfos = [];
    this.sessionId = null;

    const error: ProviderRpcError = new Error(reason || '用户断开连接') as ProviderRpcError;
    error.code = 1000;

    this.emit('disconnect', error);
  }

  /**
   * 切换链
   * @param chainId 链 ID
   */
  public setChainId(chainId: number): void {
    this.log('切换链:', chainId);

    if (this.chainId === chainId) return;

    this.chainId = chainId;
    this.emit('chainChanged', `0x${chainId.toString(16)}`);
  }

  /**
   * 设置账户
   * @param accounts 账户列表
   */
  public setAccounts(accounts: Address[]): void {
    this.log('设置账户:', accounts);
    this.accounts = accounts;
    this.accountInfos = accounts.map((addr, index) => ({
      id: `${addr}-${index}`,
      address: addr,
      name: `Account ${index + 1}`,
      type: 'watch' as AccountType,
      status: 'active' as AccountStatus,
      chainId: this.chainId,
      isDefault: index === 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }));
    this.emit('accountsChanged', accounts);
  }

  /**
   * 发送消息事件
   * @param message 消息
   */
  public sendMessage(message: ProviderMessage): void {
    this.emit('message', message);
  }

  /**
   * 发送通知
   * @param notification 通知
   */
  public sendNotification(notification: any): void {
    this.emit('notification', notification);
  }

  /**
   * 获取当前链 ID
   * @returns 链 ID（十六进制）
   */
  public get chainIdHex(): string {
    return `0x${this.chainId.toString(16)}`;
  }

  /**
   * 获取当前链 ID（数字）
   * @returns 链 ID
   */
  public get currentChainId(): number {
    return this.chainId;
  }

  /**
   * 获取当前账户列表
   * @returns 账户列表
   */
  public get currentAccounts(): Address[] {
    return this.accounts;
  }

  /**
   * 检查是否已连接
   * @returns 是否已连接
   */
  public get isConnected(): boolean {
    return this.status === 'connected' && this.authorized;
  }

  /**
   * 检查是否已授权
   * @returns 是否已授权
   */
  public get isAuthorized(): boolean {
    return this.authorized;
  }

  /**
   * 获取 Provider 状态
   * @returns 状态
   */
  public get providerStatus(): ProviderStatus {
    return this.status;
  }

  /**
   * 获取当前会话 ID
   * @returns 会话 ID
   */
  public get currentSessionId(): string | null {
    return this.sessionId;
  }

  /**
   * 旧版 send 方法 - 兼容旧版 Web3 库
   * @param payload JSON-RPC 请求
   * @param callback 回调函数
   */
  public send(
    payload:
      | {
          jsonrpc: string;
          method: string;
          params?: any[];
          id: number | string;
        }
      | string,
    callbackOrParams?: any,
  ): void | Promise<any> {
    if (typeof payload === 'string') {
      return this.request({
        method: payload,
        params: callbackOrParams,
      });
    }

    const callback = callbackOrParams as (error: any, result: any) => void;

    this.request({
      method: payload.method,
      params: payload.params,
    })
      .then(result => {
        callback(null, {
          jsonrpc: '2.0',
          id: payload.id,
          result,
        });
      })
      .catch(error => {
        callback(error, null);
      });
  }

  /**
   * 旧版 sendAsync 方法 - 兼容旧版 Web3 库
   * @param payload JSON-RPC 请求
   * @param callback 回调函数
   */
  public sendAsync(
    payload: {
      jsonrpc: string;
      method: string;
      params?: any[];
      id: number | string;
    },
    callback: (error: any, result: any) => void,
  ): void {
    this.send(payload, callback);
  }

  /**
   * 批量请求
   * @param requests 请求数组
   * @returns 结果数组
   */
  public async batchRequest(
    requests: Array<{
      method: string;
      params?: any[];
    }>,
  ): Promise<any[]> {
    const results: any[] = [];

    for (const req of requests) {
      try {
        const result = await this.request(req);
        results.push({ result });
      } catch (error) {
        results.push({ error });
      }
    }

    return results;
  }

  /**
   * 设置来源
   * @param origin 来源
   */
  public setOrigin(origin: string): void {
    this.origin = origin;
  }

  /**
   * 获取来源
   * @returns 来源
   */
  public getOrigin(): string {
    return this.origin;
  }

  /**
   * 设置会话 ID
   * @param sessionId 会话 ID
   */
  public setSessionId(sessionId: string | null): void {
    this.sessionId = sessionId;
  }

  /**
   * 更新会话信息
   * @param session 会话信息
   */
  public updateSession(session: DAppSession): void {
    this.sessionId = session.id;
    this.chainId = session.chainId;
    this.accounts = session.accounts;
    this.origin = session.dapp.url;

    if (session.status === 'active') {
      this.authorized = true;
      this.status = 'connected';
    } else {
      this.authorized = false;
      this.status = 'disconnected';
    }
  }

  /**
   * 锁定 Provider
   */
  public lock(): void {
    this.status = 'locked';
    this.emit('disconnect', {
      code: 4100,
      message: '钱包已锁定',
    });
  }

  /**
   * 解锁 Provider
   */
  public unlock(): void {
    if (this.authorized) {
      this.status = 'connected';
      this.emit('connect', {
        chainId: `0x${this.chainId.toString(16)}`,
      });
    } else {
      this.status = 'disconnected';
    }
  }

  /**
   * 检查是否锁定
   * @returns 是否锁定
   */
  public get isLocked(): boolean {
    return this.status === 'locked';
  }

  /**
   * 获取支持的链 ID 列表
   * @returns 链 ID 列表
   */
  public getSupportedChainIds(): number[] {
    return [...this.supportedChainIds];
  }

  /**
   * 添加支持的链
   * @param chainId 链 ID
   */
  public addSupportedChain(chainId: number): void {
    if (!this.supportedChainIds.includes(chainId)) {
      this.supportedChainIds.push(chainId);
    }
  }

  /**
   * 移除支持的链
   * @param chainId 链 ID
   */
  public removeSupportedChain(chainId: number): void {
    const index = this.supportedChainIds.indexOf(chainId);
    if (index > -1) {
      this.supportedChainIds.splice(index, 1);
    }
  }

  /**
   * 检查链是否受支持
   * @param chainId 链 ID
   * @returns 是否支持
   */
  public isChainSupported(chainId: number): boolean {
    return this.supportedChainIds.includes(chainId);
  }

  /**
   * 获取请求统计
   * @returns 请求统计
   */
  public getRequestStats(): {
    totalRequests: number;
    currentChainId: number;
    accountCount: number;
    status: ProviderStatus;
  } {
    return {
      totalRequests: this.requestId,
      currentChainId: this.chainId,
      accountCount: this.accounts.length,
      status: this.status,
    };
  }

  /**
   * 重置 Provider
   */
  public reset(): void {
    this.status = 'disconnected';
    this.authorized = false;
    this.isEnabled = false;
    this.accounts = [];
    this.accountInfos = [];
    this.sessionId = null;
    this.requestId = 0;
    this.chainId = this.defaultChainId;
  }

  /**
   * 销毁 Provider
   */
  public destroy(): void {
    this.eventListeners.forEach(listeners => listeners.clear());
    this.eventListeners.clear();
    this.reset();
  }

  /**
   * 注入到 window.ethereum
   * @param win window 对象
   */
  public inject(win: any = window): void {
    win.ethereum = this;
    win.web3 = {
      currentProvider: this,
    };

    this.log('已注入到 window.ethereum');
  }

  /**
   * 检查是否已注入
   * @param win window 对象
   * @returns 是否已注入
   */
  public static isInjected(win: any = window): boolean {
    return !!win.ethereum;
  }

  /**
   * 获取 Provider 信息
   * @returns Provider 信息
   */
  public getProviderInfo(): {
    name: string;
    version: string;
    type: string;
    supports: string[];
  } {
    return {
      name: 'WalletSDK',
      version: '1.0.0',
      type: 'injected',
      supports: [
        'eip-1193',
        'eip-1102',
        'eip-3085',
        'eip-3326',
        'eip-712',
        'eip-191',
        'walletconnect',
      ],
    };
  }
}
