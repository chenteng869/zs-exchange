/**
 * Web3 钱包核心 SDK 类
 *
 * 功能：
 *  - SDK 初始化与销毁
 *  - 钱包创建与导入
 *  - 账户管理
 *  - 网络切换
 *  - 签名接口
 *  - 交易接口
 *  - 事件系统
 *  - 会话管理
 *
 * 架构：事件驱动，模块化设计
 */

import type {
  WalletSDKOptions,
  WalletState,
  AccountInfo,
  CreateAccountOptions,
  ImportAccountOptions,
  ChainConfig,
  SignRequest,
  SignResult,
  SignType,
  TransactionRequest,
  TransactionResult,
  TransactionType,
  DAppSession,
  ConnectOptions,
  SDKEventName,
  EventCallback,
  Address,
  ProviderError,
  EIP712TypedData,
  WalletNotification,
  NotificationType,
  NotificationLevel,
  JsonRpcRequest,
  JsonRpcResponse,
} from './sdk.types';
import { ProviderErrorCode, DEFAULT_SDK_OPTIONS } from './sdk.types';

import { NetworkManager } from './network-manager/network-manager';
import { AddressBookService } from './address-book/address-book.service';
import { NotificationService } from './notification/notification.service';
import { SignConfirmManager } from './sign-confirm/sign-confirm-manager';

// ============================================================================
// 工具函数
// ============================================================================

/** 生成唯一 ID */
function generateId(prefix: string = 'id'): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

/** 十六进制转数字 */
function hexToNumber(hex: string): number {
  return parseInt(hex, 16);
}

/** 数字转十六进制 */
function numberToHex(num: number): string {
  return '0x' + num.toString(16);
}

/** 校验地址格式（简化版） */
function isValidAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

/** 创建标准 Provider 错误 */
function createProviderError(code: ProviderErrorCode, message: string, data?: unknown): ProviderError {
  const error = new Error(message) as ProviderError;
  error.code = code;
  error.data = data;
  error.name = 'ProviderError';
  return error;
}

// ============================================================================
// WalletSDK 主类
// ============================================================================

export class WalletSDK {
  /** SDK 配置 */
  private options: Required<WalletSDKOptions> & typeof DEFAULT_SDK_OPTIONS;

  /** 钱包状态 */
  private state: WalletState;

  /** 事件监听器映射 */
  private eventListeners: Map<SDKEventName, Set<EventCallback>>;

  /** 网络管理器 */
  private networkManager: NetworkManager;

  /** 地址簿服务 */
  private addressBook: AddressBookService;

  /** 通知服务 */
  private notificationService: NotificationService;

  /** 签名确认管理器 */
  private signConfirmManager: SignConfirmManager;

  /** SDK 单例实例 */
  private static instance: WalletSDK | null = null;

  /** 是否已初始化 */
  private initialized: boolean = false;

  /** 自动锁定定时器 */
  private autoLockTimer: ReturnType<typeof setTimeout> | null = null;

  // ==========================================================================
  // 单例模式
  // ==========================================================================

  /** 获取 SDK 单例 */
  public static getInstance(options?: WalletSDKOptions): WalletSDK {
    if (!WalletSDK.instance) {
      if (!options) {
        throw new Error('首次调用必须提供 options 参数');
      }
      WalletSDK.instance = new WalletSDK(options);
    }
    return WalletSDK.instance;
  }

  /** 销毁单例 */
  public static destroyInstance(): void {
    if (WalletSDK.instance) {
      WalletSDK.instance.destroy();
      WalletSDK.instance = null;
    }
  }

  // ==========================================================================
  // 构造函数
  // ==========================================================================

  private constructor(options: WalletSDKOptions) {
    this.options = {
      ...DEFAULT_SDK_OPTIONS,
      ...options,
      metadataName: options.metadataName || options.projectName,
      metadataDescription: options.metadataDescription || options.projectDescription || '',
      metadataIcons: options.metadataIcons || (options.projectIcon ? [options.projectIcon] : []),
      metadataUrl: options.metadataUrl || options.projectUrl || '',
      supportedChainIds: options.supportedChainIds || [1, 56, 137, 42161, 10],
      rpcUrls: options.rpcUrls || {},
      customChains: options.customChains || [],
    } as Required<WalletSDKOptions> & typeof DEFAULT_SDK_OPTIONS;

    this.eventListeners = new Map();
    this.networkManager = new NetworkManager(this);
    this.addressBook = new AddressBookService(this);
    this.notificationService = new NotificationService(this);
    this.signConfirmManager = new SignConfirmManager(this);

    this.state = {
      initialized: false,
      locked: true,
      currentChainId: this.options.defaultChainId,
      defaultAccount: null,
      accounts: [],
      sessions: [],
      pendingSignRequests: [],
      pendingTransactionRequests: [],
      supportedChains: [],
      customChains: [],
    };
  }

  // ==========================================================================
  // 初始化与销毁
  // ==========================================================================

  /**
   * 初始化 SDK
   */
  public async initialize(): Promise<void> {
    if (this.initialized) {
      this.log('SDK 已初始化，跳过');
      return;
    }

    this.log('开始初始化 WalletSDK...');

    try {
      await this.networkManager.initialize();
      await this.addressBook.initialize();
      await this.notificationService.initialize();
      await this.signConfirmManager.initialize();

      await this.loadStateFromStorage();

      this.state.initialized = true;
      this.state.initializedAt = Date.now();
      this.state.supportedChains = this.networkManager.getSupportedChains();
      this.state.customChains = this.networkManager.getCustomChains();
      this.initialized = true;

      this.log('WalletSDK 初始化完成');
      this.emit('connect', { chainId: numberToHex(this.state.currentChainId) });
    } catch (error) {
      this.logError('WalletSDK 初始化失败', error);
      throw error;
    }
  }

  /**
   * 销毁 SDK
   */
  public destroy(): void {
    this.log('销毁 WalletSDK...');

    this.clearAutoLockTimer();
    this.removeAllListeners();

    this.networkManager.destroy();
    this.addressBook.destroy();
    this.notificationService.destroy();
    this.signConfirmManager.destroy();

    this.saveStateToStorage();

    this.state.initialized = false;
    this.initialized = false;

    this.emit('disconnect', createProviderError(
      ProviderErrorCode.DISCONNECTED,
      'Wallet disconnected'
    ));

    this.log('WalletSDK 已销毁');
  }

  // ==========================================================================
  // 状态管理
  // ==========================================================================

  /** 获取当前钱包状态 */
  public getState(): Readonly<WalletState> {
    return { ...this.state };
  }

  /** 获取当前链 ID */
  public getCurrentChainId(): number {
    return this.state.currentChainId;
  }

  /** 获取当前链配置 */
  public getCurrentChain(): ChainConfig | undefined {
    return this.networkManager.getChainById(this.state.currentChainId);
  }

  /** 获取默认账户 */
  public getDefaultAccount(): AccountInfo | null {
    if (!this.state.defaultAccount) return null;
    return this.state.accounts.find(a => a.address === this.state.defaultAccount) || null;
  }

  /** 获取所有账户 */
  public getAccounts(): AccountInfo[] {
    return [...this.state.accounts];
  }

  /** 获取活跃账户列表 */
  public getActiveAccounts(): AccountInfo[] {
    return this.state.accounts.filter(a => a.status === 'active');
  }

  /** 获取账户信息 */
  public getAccount(address: Address): AccountInfo | undefined {
    return this.state.accounts.find(a => a.address.toLowerCase() === address.toLowerCase());
  }

  // ==========================================================================
  // 钱包创建与导入
  // ==========================================================================

  /**
   * 创建新账户
   */
  public async createAccount(options: CreateAccountOptions = {}): Promise<AccountInfo> {
    this.ensureUnlocked();

    const chainId = options.chainId || this.state.currentChainId;
    const accountType = options.type || 'mnemonic';
    const accountIndex = options.accountIndex ?? this.getNextAccountIndex();
    const hdPath = options.hdPath || `m/44'/60'/0'/0/${accountIndex}`;

    const address = await this.deriveAddress(chainId, hdPath, accountType);

    const account: AccountInfo = {
      id: generateId('acc'),
      address,
      name: options.name || `账户 ${accountIndex + 1}`,
      type: accountType,
      status: 'active',
      chainId,
      hdPath: {
        path: hdPath,
        accountIndex,
        addressIndex: accountIndex,
      },
      isDefault: this.state.accounts.length === 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      tags: options.tags || [],
      note: options.note,
    };

    this.state.accounts.push(account);

    if (account.isDefault || !this.state.defaultAccount) {
      this.setDefaultAccount(account.address);
    }

    this.saveStateToStorage();
    this.emit('accountsChanged', this.getActiveAccountAddresses());

    this.log(`创建账户: ${address}`);

    return account;
  }

  /**
   * 导入账户
   */
  public async importAccount(options: ImportAccountOptions): Promise<AccountInfo> {
    this.ensureUnlocked();

    const chainId = options.chainId || this.state.currentChainId;
    let address: Address;
    let accountType: AccountInfo['type'] = 'privateKey';

    switch (options.importType) {
      case 'privateKey':
        if (!options.privateKey) {
          throw new Error('导入私钥账户必须提供 privateKey');
        }
        address = await this.importFromPrivateKey(options.privateKey, chainId);
        accountType = 'privateKey';
        break;

      case 'mnemonic':
        if (!options.mnemonic) {
          throw new Error('导入助记词账户必须提供 mnemonic');
        }
        const hdPath = options.hdPath || "m/44'/60'/0'/0/0";
        address = await this.importFromMnemonic(options.mnemonic, hdPath, chainId, options.mnemonicPassword);
        accountType = 'mnemonic';
        break;

      case 'jsonKeystore':
        if (!options.keystoreJson || !options.keystorePassword) {
          throw new Error('导入 Keystore 账户必须提供 keystoreJson 和 keystorePassword');
        }
        address = await this.importFromKeystore(options.keystoreJson, options.keystorePassword, chainId);
        accountType = 'privateKey';
        break;

      case 'watch':
        if (!options.watchAddress) {
          throw new Error('导入观察账户必须提供 watchAddress');
        }
        if (!isValidAddress(options.watchAddress)) {
          throw new Error('无效的地址格式');
        }
        address = options.watchAddress;
        accountType = 'watch';
        break;

      default:
        throw new Error(`不支持的导入类型: ${options.importType}`);
    }

    const existingAccount = this.state.accounts.find(
      a => a.address.toLowerCase() === address.toLowerCase() && a.chainId === chainId
    );

    if (existingAccount) {
      throw new Error('该地址的账户已存在');
    }

    const accountIndex = this.getNextAccountIndex();

    const account: AccountInfo = {
      id: generateId('acc'),
      address,
      name: options.name || `导入账户 ${accountIndex + 1}`,
      type: accountType,
      status: 'active',
      chainId,
      isDefault: this.state.accounts.length === 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      tags: [],
    };

    this.state.accounts.push(account);

    if (account.isDefault || !this.state.defaultAccount) {
      this.setDefaultAccount(account.address);
    }

    this.saveStateToStorage();
    this.emit('accountsChanged', this.getActiveAccountAddresses());

    this.notificationService.notify({
      type: 'info',
      level: 'success',
      title: '账户导入成功',
      message: `账户 ${account.name} 已成功导入`,
    });

    this.log(`导入账户: ${address} (${options.importType})`);

    return account;
  }

  /**
   * 删除账户
   */
  public async removeAccount(address: Address): Promise<void> {
    this.ensureUnlocked();

    const index = this.state.accounts.findIndex(
      a => a.address.toLowerCase() === address.toLowerCase()
    );

    if (index === -1) {
      throw new Error('账户不存在');
    }

    const account = this.state.accounts[index];
    this.state.accounts.splice(index, 1);

    if (this.state.defaultAccount === address) {
      const remainingAccounts = this.state.accounts.filter(a => a.status === 'active');
      if (remainingAccounts.length > 0) {
        this.setDefaultAccount(remainingAccounts[0].address);
      } else {
        this.state.defaultAccount = null;
      }
    }

    this.saveStateToStorage();
    this.emit('accountsChanged', this.getActiveAccountAddresses());

    this.log(`删除账户: ${address}`);
  }

  /**
   * 设置默认账户
   */
  public setDefaultAccount(address: Address): void {
    this.ensureUnlocked();

    const account = this.state.accounts.find(
      a => a.address.toLowerCase() === address.toLowerCase()
    );

    if (!account) {
      throw new Error('账户不存在');
    }

    this.state.accounts.forEach(a => {
      a.isDefault = a.address.toLowerCase() === address.toLowerCase();
      a.updatedAt = Date.now();
    });

    this.state.defaultAccount = account.address;

    this.saveStateToStorage();
    this.emit('accountsChanged', this.getActiveAccountAddresses());

    this.log(`设置默认账户: ${address}`);
  }

  /**
   * 更新账户信息
   */
  public updateAccount(address: Address, updates: Partial<AccountInfo>): AccountInfo {
    this.ensureUnlocked();

    const account = this.state.accounts.find(
      a => a.address.toLowerCase() === address.toLowerCase()
    );

    if (!account) {
      throw new Error('账户不存在');
    }

    Object.assign(account, updates, { updatedAt: Date.now() });

    this.saveStateToStorage();
    this.emit('accountsChanged', this.getActiveAccountAddresses());

    return account;
  }

  // ==========================================================================
  // 网络管理
  // ==========================================================================

  /**
   * 切换网络
   */
  public async switchChain(chainId: number): Promise<void> {
    this.ensureUnlocked();

    if (chainId === this.state.currentChainId) {
      return;
    }

    const chain = this.networkManager.getChainById(chainId);
    if (!chain) {
      throw createProviderError(
        ProviderErrorCode.CHAIN_DISCONNECTED,
        `不支持的链 ID: ${chainId}`
      );
    }

    const previousChainId = this.state.currentChainId;
    this.state.currentChainId = chainId;

    this.saveStateToStorage();
    this.emit('chainChanged', numberToHex(chainId));
    this.emit('networkChanged', { from: previousChainId, to: chainId, chain });

    this.updateSessionsChainId(chainId);

    this.log(`切换网络: ${previousChainId} -> ${chainId}`);
  }

  /**
   * 添加自定义链
   */
  public async addChain(chainConfig: ChainConfig): Promise<void> {
    this.ensureUnlocked();

    await this.networkManager.addCustomChain(chainConfig);
    this.state.customChains = this.networkManager.getCustomChains();

    this.saveStateToStorage();

    this.log(`添加自定义链: ${chainConfig.chainName} (${chainConfig.chainId})`);
  }

  /** 获取支持的链列表 */
  public getSupportedChains(): ChainConfig[] {
    return this.networkManager.getSupportedChains();
  }

  /** 获取自定义链列表 */
  public getCustomChains(): ChainConfig[] {
    return this.networkManager.getCustomChains();
  }

  /** 获取指定链配置 */
  public getChainById(chainId: number): ChainConfig | undefined {
    return this.networkManager.getChainById(chainId);
  }

  // ==========================================================================
  // 签名接口
  // ==========================================================================

  /**
   * 签名消息（personal_sign）
   */
  public async personalSign(message: string, address: Address): Promise<string> {
    this.ensureUnlocked();
    this.ensureAccountExists(address);

    const signRequest = this.createSignRequest({
      type: 'personalSign',
      address,
      rawMessage: message,
      parsedMessage: message,
    });

    return this.processSignRequest(signRequest);
  }

  /**
   * 签名消息（eth_sign）
   */
  public async ethSign(address: Address, message: string): Promise<string> {
    this.ensureUnlocked();
    this.ensureAccountExists(address);

    const signRequest = this.createSignRequest({
      type: 'ethSign',
      address,
      rawMessage: message,
      parsedMessage: message,
    });

    return this.processSignRequest(signRequest);
  }

  /**
   * 签名类型化数据（eth_signTypedData_v4）
   */
  public async signTypedDataV4(address: Address, typedData: EIP712TypedData): Promise<string> {
    this.ensureUnlocked();
    this.ensureAccountExists(address);

    const signRequest = this.createSignRequest({
      type: 'ethSignTypedDataV4',
      address,
      rawMessage: JSON.stringify(typedData),
      typedData,
      parsedMessage: typedData,
    });

    return this.processSignRequest(signRequest);
  }

  /**
   * 签名交易
   */
  public async signTransaction(tx: TransactionRequest): Promise<string> {
    this.ensureUnlocked();
    this.ensureAccountExists(tx.from);

    const signRequest = this.createSignRequest({
      type: 'ethSignTransaction',
      address: tx.from,
      rawMessage: JSON.stringify(tx),
      chainId: tx.chainId,
    });

    const signature = await this.processSignRequest(signRequest);
    return signature;
  }

  /**
   * 发送交易
   */
  public async sendTransaction(tx: Partial<TransactionRequest>): Promise<TransactionResult> {
    this.ensureUnlocked();

    const from = tx.from || this.state.defaultAccount;
    if (!from) {
      throw createProviderError(ProviderErrorCode.UNAUTHORIZED, '没有可用的账户');
    }

    this.ensureAccountExists(from);

    const chainId = tx.chainId || this.state.currentChainId;

    const txRequest: TransactionRequest = {
      id: generateId('tx'),
      type: tx.type || 'contractCall',
      from,
      to: tx.to,
      value: tx.value || '0x0',
      data: tx.data || '0x',
      chainId,
      status: 'pending',
      requestedAt: Date.now(),
      source: 'internal',
    };

    this.state.pendingTransactionRequests.push(txRequest);
    this.emit('transactionRequest', txRequest);

    const confirmed = await this.signConfirmManager.requestTransactionConfirmation(txRequest);

    if (!confirmed) {
      txRequest.status = 'failed';
      txRequest.error = 'User rejected';
      this.removePendingTransaction(txRequest.id);
      throw createProviderError(
        ProviderErrorCode.USER_REJECTED,
        '用户拒绝了交易请求'
      );
    }

    try {
      const txHash = await this.broadcastTransaction(txRequest);
      txRequest.txHash = txHash;
      txRequest.status = 'broadcasting';

      this.removePendingTransaction(txRequest.id);

      const result: TransactionResult = {
        txHash,
        chainId,
        from,
        to: txRequest.to,
        status: 'broadcasting',
        broadcastedAt: Date.now(),
      };

      this.notificationService.notify({
        type: 'transaction',
        level: 'info',
        title: '交易已广播',
        message: `交易 ${txHash.slice(0, 10)}... 已发送到网络`,
        txHash,
      });

      this.log(`交易已广播: ${txHash}`);

      return result;
    } catch (error) {
      txRequest.status = 'failed';
      txRequest.error = (error as Error).message;
      this.removePendingTransaction(txRequest.id);
      throw error;
    }
  }

  // ==========================================================================
  // 会话管理
  // ==========================================================================

  /**
   * 连接 DApp
   */
  public async connect(options: ConnectOptions): Promise<DAppSession> {
    this.ensureUnlocked();

    const defaultAccount = this.getDefaultAccount();
    if (!defaultAccount) {
      throw createProviderError(ProviderErrorCode.UNAUTHORIZED, '没有可用的账户');
    }

    const chainId = options.chainId || this.state.currentChainId;

    const session: DAppSession = {
      id: generateId('session'),
      dapp: options.dappInfo,
      accounts: options.requestAccounts ? [defaultAccount.address] : [],
      activeAccount: defaultAccount.address,
      chainId,
      permissions: options.permissions || ['eth_accounts', 'eth_chainId', 'net_version'],
      connectedAt: Date.now(),
      lastActiveAt: Date.now(),
      status: 'active',
      connectionType: options.connectionType,
    };

    this.state.sessions.push(session);
    this.saveStateToStorage();
    this.emit('sessionCreated', session);

    this.notificationService.notify({
      type: 'connection',
      level: 'info',
      title: 'DApp 已连接',
      message: `${options.dappInfo.name} 已连接到钱包`,
      sessionId: session.id,
    });

    this.log(`DApp 已连接: ${options.dappInfo.name}`);

    return session;
  }

  /**
   * 断开 DApp 连接
   */
  public async disconnect(sessionId: string): Promise<void> {
    const sessionIndex = this.state.sessions.findIndex(s => s.id === sessionId);

    if (sessionIndex === -1) {
      throw new Error('会话不存在');
    }

    const session = this.state.sessions[sessionIndex];
    session.status = 'disconnected';
    this.state.sessions.splice(sessionIndex, 1);

    this.saveStateToStorage();
    this.emit('sessionDeleted', session);

    this.notificationService.notify({
      type: 'connection',
      level: 'info',
      title: 'DApp 已断开',
      message: `${session.dapp.name} 已断开连接`,
    });

    this.log(`DApp 已断开: ${session.dapp.name}`);
  }

  /** 获取所有会话 */
  public getSessions(): DAppSession[] {
    return [...this.state.sessions];
  }

  /** 获取活跃会话 */
  public getActiveSessions(): DAppSession[] {
    return this.state.sessions.filter(s => s.status === 'active');
  }

  /** 获取指定会话 */
  public getSession(sessionId: string): DAppSession | undefined {
    return this.state.sessions.find(s => s.id === sessionId);
  }

  /** 更新会话账户 */
  public updateSessionAccounts(sessionId: string, accounts: Address[]): void {
    const session = this.state.sessions.find(s => s.id === sessionId);
    if (!session) return;

    session.accounts = accounts;
    session.lastActiveAt = Date.now();

    if (accounts.length > 0 && !accounts.includes(session.activeAccount)) {
      session.activeAccount = accounts[0];
    }

    this.saveStateToStorage();
    this.emit('sessionUpdated', session);
  }

  // ==========================================================================
  // 锁定/解锁
  // ==========================================================================

  /** 锁定钱包 */
  public lock(): void {
    this.state.locked = true;
    this.clearAutoLockTimer();
    this.saveStateToStorage();
    this.emit('disconnect', createProviderError(
      ProviderErrorCode.DISCONNECTED,
      'Wallet locked'
    ));
    this.log('钱包已锁定');
  }

  /** 解锁钱包 */
  public unlock(password?: string): boolean {
    this.state.locked = false;
    this.state.lastUnlockedAt = Date.now();
    this.resetAutoLockTimer();
    this.saveStateToStorage();
    this.emit('connect', { chainId: numberToHex(this.state.currentChainId) });
    this.log('钱包已解锁');
    return true;
  }

  /** 钱包是否锁定 */
  public isLocked(): boolean {
    return this.state.locked;
  }

  // ==========================================================================
  // 事件系统
  // ==========================================================================

  /**
   * 监听事件
   */
  public on(event: SDKEventName, callback: EventCallback): this {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(callback);
    return this;
  }

  /**
   * 单次监听事件
   */
  public once(event: SDKEventName, callback: EventCallback): this {
    const wrapper = (...args: any[]) => {
      this.off(event, wrapper);
      callback(...args);
    };
    return this.on(event, wrapper);
  }

  /**
   * 取消事件监听
   */
  public off(event: SDKEventName, callback: EventCallback): this {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.delete(callback);
    }
    return this;
  }

  /**
   * 触发事件
   */
  private emit(event: SDKEventName, ...args: any[]): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(...args);
        } catch (error) {
          this.logError(`事件监听器错误 [${event}]`, error);
        }
      });
    }
  }

  /** 移除所有事件监听器 */
  private removeAllListeners(): void {
    this.eventListeners.clear();
  }

  // ==========================================================================
  // 服务访问器
  // ==========================================================================

  /** 获取网络管理器 */
  public getNetworkManager(): NetworkManager {
    return this.networkManager;
  }

  /** 获取地址簿服务 */
  public getAddressBook(): AddressBookService {
    return this.addressBook;
  }

  /** 获取通知服务 */
  public getNotificationService(): NotificationService {
    return this.notificationService;
  }

  /** 获取签名确认管理器 */
  public getSignConfirmManager(): SignConfirmManager {
    return this.signConfirmManager;
  }

  // ==========================================================================
  // 内部方法
  // ==========================================================================

  /** 确保钱包已解锁 */
  private ensureUnlocked(): void {
    if (this.state.locked) {
      throw createProviderError(
        ProviderErrorCode.UNAUTHORIZED,
        '钱包已锁定，请先解锁'
      );
    }
  }

  /** 确保账户存在 */
  private ensureAccountExists(address: Address): void {
    const account = this.getAccount(address);
    if (!account) {
      throw createProviderError(
        ProviderErrorCode.UNAUTHORIZED,
        `账户不存在: ${address}`
      );
    }
    if (account.status !== 'active') {
      throw createProviderError(
        ProviderErrorCode.UNAUTHORIZED,
        `账户未激活: ${address}`
      );
    }
  }

  /** 获取下一个账户索引 */
  private getNextAccountIndex(): number {
    const activeAccounts = this.state.accounts.filter(a => a.hdPath);
    if (activeAccounts.length === 0) return 0;
    return Math.max(...activeAccounts.map(a => a.hdPath!.accountIndex)) + 1;
  }

  /** 获取活跃账户地址列表 */
  private getActiveAccountAddresses(): Address[] {
    return this.getActiveAccounts().map(a => a.address);
  }

  /** 创建签名请求 */
  private createSignRequest(params: Partial<SignRequest> & Pick<SignRequest, 'type' | 'address' | 'rawMessage'>): SignRequest {
    const request: SignRequest = {
      id: generateId('sign'),
      type: params.type,
      status: 'pending',
      address: params.address,
      chainId: params.chainId || this.state.currentChainId,
      rawMessage: params.rawMessage,
      parsedMessage: params.parsedMessage,
      typedData: params.typedData,
      requestedAt: Date.now(),
      expiresAt: Date.now() + 5 * 60 * 1000,
      source: 'internal',
    };

    this.state.pendingSignRequests.push(request);
    this.emit('signRequest', request);

    return request;
  }

  /** 处理签名请求 */
  private async processSignRequest(request: SignRequest): Promise<string> {
    const confirmed = await this.signConfirmManager.requestSignConfirmation(request);

    if (!confirmed) {
      request.status = 'rejected';
      request.rejectReason = 'User rejected';
      this.removePendingSignRequest(request.id);
      throw createProviderError(
        ProviderErrorCode.USER_REJECTED,
        '用户拒绝了签名请求'
      );
    }

    const signature = await this.performSigning(request);

    request.signature = signature;
    request.status = 'approved';
    this.removePendingSignRequest(request.id);

    this.notificationService.notify({
      type: 'signature',
      level: 'success',
      title: '签名成功',
      message: '消息签名已完成',
    });

    return signature;
  }

  /** 执行签名（占位方法，实际项目中应使用密钥管理模块） */
  private async performSigning(request: SignRequest): Promise<string> {
    this.log(`执行签名: ${request.type} for ${request.address}`);
    return `0x${generateId('sig').slice(0, 130)}`;
  }

  /** 广播交易（占位方法） */
  private async broadcastTransaction(tx: TransactionRequest): Promise<string> {
    this.log(`广播交易: ${tx.id}`);
    return `0x${generateId('tx').slice(0, 64)}`;
  }

  /** 移除待处理签名请求 */
  private removePendingSignRequest(requestId: string): void {
    const index = this.state.pendingSignRequests.findIndex(r => r.id === requestId);
    if (index !== -1) {
      this.state.pendingSignRequests.splice(index, 1);
    }
  }

  /** 移除待处理交易请求 */
  private removePendingTransaction(requestId: string): void {
    const index = this.state.pendingTransactionRequests.findIndex(r => r.id === requestId);
    if (index !== -1) {
      this.state.pendingTransactionRequests.splice(index, 1);
    }
  }

  /** 更新所有会话的链 ID */
  private updateSessionsChainId(chainId: number): void {
    this.state.sessions.forEach(session => {
      if (session.status === 'active') {
        session.chainId = chainId;
        session.lastActiveAt = Date.now();
      }
    });
  }

  /** 重置自动锁定定时器 */
  private resetAutoLockTimer(): void {
    this.clearAutoLockTimer();
    if (this.options.autoLockTime > 0) {
      this.autoLockTimer = setTimeout(() => {
        this.lock();
      }, this.options.autoLockTime * 1000);
    }
  }

  /** 清除自动锁定定时器 */
  private clearAutoLockTimer(): void {
    if (this.autoLockTimer) {
      clearTimeout(this.autoLockTimer);
      this.autoLockTimer = null;
    }
  }

  // ==========================================================================
  // 存储相关
  // ==========================================================================

  /** 从存储加载状态 */
  private async loadStateFromStorage(): Promise<void> {
    try {
      const stored = localStorage.getItem(this.options.storageKeyPrefix + 'state');
      if (stored) {
        const parsed = JSON.parse(stored);
        this.state = { ...this.state, ...parsed, initialized: false };
      }
    } catch (error) {
      this.logError('加载状态失败', error);
    }
  }

  /** 保存状态到存储 */
  private saveStateToStorage(): void {
    try {
      const stateToSave = { ...this.state };
      localStorage.setItem(
        this.options.storageKeyPrefix + 'state',
        JSON.stringify(stateToSave)
      );
    } catch (error) {
      this.logError('保存状态失败', error);
    }
  }

  // ==========================================================================
  // 地址派生（占位方法）
  // ==========================================================================

  /** 派生地址 */
  private async deriveAddress(
    chainId: number,
    hdPath: string,
    accountType: AccountInfo['type']
  ): Promise<Address> {
    this.log(`派生地址: chain=${chainId}, path=${hdPath}, type=${accountType}`);
    return '0x' + Array.from({ length: 40 }, () =>
      Math.floor(Math.random() * 16).toString(16)
    ).join('');
  }

  /** 从私钥导入 */
  private async importFromPrivateKey(privateKey: string, chainId: number): Promise<Address> {
    this.log(`从私钥导入: chain=${chainId}`);
    return '0x' + Array.from({ length: 40 }, () =>
      Math.floor(Math.random() * 16).toString(16)
    ).join('');
  }

  /** 从助记词导入 */
  private async importFromMnemonic(
    mnemonic: string,
    hdPath: string,
    chainId: number,
    password?: string
  ): Promise<Address> {
    this.log(`从助记词导入: chain=${chainId}, path=${hdPath}`);
    return '0x' + Array.from({ length: 40 }, () =>
      Math.floor(Math.random() * 16).toString(16)
    ).join('');
  }

  /** 从 Keystore 导入 */
  private async importFromKeystore(
    keystoreJson: string,
    password: string,
    chainId: number
  ): Promise<Address> {
    this.log(`从 Keystore 导入: chain=${chainId}`);
    return '0x' + Array.from({ length: 40 }, () =>
      Math.floor(Math.random() * 16).toString(16)
    ).join('');
  }

  // ==========================================================================
  // 日志
  // ==========================================================================

  private log(message: string, ...args: any[]): void {
    if (this.options.debug) {
      console.log(`[WalletSDK] ${message}`, ...args);
    }
  }

  private logError(message: string, error?: unknown): void {
    if (this.options.debug) {
      console.error(`[WalletSDK] ${message}`, error);
    }
    this.emit('error', error || message);
  }
}
