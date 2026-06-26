/**
 * DApp 浏览器交互模块
 *
 * 功能：
 *  - EIP-1193 Provider 实现
 *  - 钱包连接管理
 *  - 交易签名
 *  - 消息签名（EIP-191 / EIP-712）
 *  - 权限管理
 *  - DApp 白名单
 *  - 网络切换
 *  - 账户切换
 *  - 事件通知
 */

import type { SignOptions, Signature } from '../core/private-key';

// ============================================================================
// 类型定义
// ============================================================================

export interface DAppInfo {
  id: string;
  name: string;
  description: string;
  url: string;
  icon: string;
  verified: boolean;
  category: string;
  tags: string[];
  permissions: DAppPermission[];
  chainIds: number[];
  riskLevel: 'safe' | 'medium' | 'risky' | 'unknown';
  firstConnectedAt?: number;
  lastConnectedAt?: number;
  connectionCount: number;
}

export type DAppPermission =
  | 'eth_accounts'
  | 'eth_requestAccounts'
  | 'eth_sendTransaction'
  | 'eth_signTransaction'
  | 'eth_sign'
  | 'eth_signTypedData'
  | 'eth_signTypedData_v1'
  | 'eth_signTypedData_v3'
  | 'eth_signTypedData_v4'
  | 'personal_sign'
  | 'wallet_switchEthereumChain'
  | 'wallet_addEthereumChain'
  | 'wallet_watchAsset'
  | 'eth_chainId'
  | 'net_version'
  | 'web3_clientVersion';

export interface DAppConnection {
  dAppId: string;
  dAppUrl: string;
  accounts: string[];
  activeAccount: string;
  chainId: number;
  permissions: DAppPermission[];
  connectedAt: number;
  lastActiveAt: number;
  isActive: boolean;
}

export interface EIP1193Request {
  method: string;
  params?: any[];
  id?: string | number;
  jsonrpc?: string;
}

export interface EIP1193Response {
  id?: string | number;
  jsonrpc?: string;
  result?: any;
  error?: EIP1193Error;
}

export interface EIP1193Error {
  code: number;
  message: string;
  data?: any;
}

export interface DAppTransactionRequest {
  from?: string;
  to?: string;
  value?: string;
  gas?: string;
  gasPrice?: string;
  maxFeePerGas?: string;
  maxPriorityFeePerGas?: string;
  data?: string;
  nonce?: number;
  chainId?: number;
}

export interface DAppSignRequest {
  address: string;
  data: string;
  type: 'eth_sign' | 'personal_sign' | 'signTypedData' | 'signTypedData_v1' | 'signTypedData_v3' | 'signTypedData_v4';
  dAppUrl: string;
  dAppName: string;
}

export interface DAppSwitchChainRequest {
  chainId: number;
  dAppUrl: string;
}

export interface DAppAddChainRequest {
  chainId: string;
  chainName: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  rpcUrls: string[];
  blockExplorerUrls?: string[];
  iconUrls?: string[];
}

export interface WatchAssetParams {
  type: 'ERC20' | 'ERC721' | 'ERC1155';
  options: {
    address: string;
    symbol?: string;
    decimals?: number;
    image?: string;
    tokenId?: string;
  };
}

// ============================================================================
// EIP-1193 错误码
// ============================================================================

export const EIP1193_ERRORS = {
  USER_REJECTED: { code: 4001, message: '用户拒绝了请求' },
  UNAUTHORIZED: { code: 4100, message: '未授权，请先连接钱包' },
  UNSUPPORTED_METHOD: { code: 4200, message: '不支持的方法' },
  DISCONNECTED: { code: 4900, message: '钱包已断开连接' },
  CHAIN_NOT_ADDED: { code: 4902, message: '未添加此链' },
  INVALID_PARAMS: { code: -32602, message: '无效的参数' },
  INTERNAL_ERROR: { code: -32603, message: '内部错误' },
  INVALID_INPUT: { code: -32000, message: '无效的输入' },
  RESOURCE_NOT_FOUND: { code: -32001, message: '资源未找到' },
  RESOURCE_UNAVAILABLE: { code: -32002, message: '资源不可用' },
  TRANSACTION_REJECTED: { code: -32003, message: '交易被拒绝' },
  METHOD_NOT_FOUND: { code: -32601, message: '方法未找到' },
  PARSE_ERROR: { code: -32700, message: '解析错误' },
};

// ============================================================================
// 推荐 DApps
// ============================================================================

export const RECOMMENDED_DAPPS: DAppInfo[] = [
  {
    id: 'uniswap',
    name: 'Uniswap',
    description: 'Uniswap 是一个去中心化交易协议。',
    url: 'https://app.uniswap.org',
    icon: 'https://app.uniswap.org/favicon.png',
    verified: true,
    category: 'DEX',
    tags: ['DEX', 'Swap', 'DeFi'],
    permissions: ['eth_accounts', 'eth_sendTransaction', 'eth_signTypedData_v4'],
    chainIds: [1, 5, 10, 42161, 137, 56],
    riskLevel: 'safe',
    connectionCount: 1000000,
  },
  {
    id: 'opensea',
    name: 'OpenSea',
    description: '全球最大的 NFT 市场。',
    url: 'https://opensea.io',
    icon: 'https://opensea.io/static/images/logos/opensea-logo.svg',
    verified: true,
    category: 'NFT',
    tags: ['NFT', 'Marketplace'],
    permissions: ['eth_accounts', 'eth_sendTransaction', 'eth_signTypedData_v4'],
    chainIds: [1, 5, 137, 56],
    riskLevel: 'safe',
    connectionCount: 5000000,
  },
  {
    id: 'aave',
    name: 'Aave',
    description: '去中心化借贷协议。',
    url: 'https://app.aave.com',
    icon: 'https://app.aave.com/favicon.ico',
    verified: true,
    category: 'DeFi',
    tags: ['DeFi', 'Lending', 'Borrowing'],
    permissions: ['eth_accounts', 'eth_sendTransaction', 'eth_signTypedData_v4'],
    chainIds: [1, 10, 137, 42161, 43114],
    riskLevel: 'safe',
    connectionCount: 800000,
  },
  {
    id: 'compound',
    name: 'Compound',
    description: '算法货币市场协议。',
    url: 'https://app.compound.finance',
    icon: 'https://app.compound.finance/favicon.ico',
    verified: true,
    category: 'DeFi',
    tags: ['DeFi', 'Lending'],
    permissions: ['eth_accounts', 'eth_sendTransaction'],
    chainIds: [1, 5],
    riskLevel: 'safe',
    connectionCount: 500000,
  },
  {
    id: 'sushiswap',
    name: 'SushiSwap',
    description: '多链去中心化交易所。',
    url: 'https://www.sushi.com',
    icon: 'https://www.sushi.com/favicon.ico',
    verified: true,
    category: 'DEX',
    tags: ['DEX', 'DeFi', 'Yield'],
    permissions: ['eth_accounts', 'eth_sendTransaction'],
    chainIds: [1, 56, 137, 42161, 10, 43114],
    riskLevel: 'safe',
    connectionCount: 600000,
  },
  {
    id: 'curve',
    name: 'Curve Finance',
    description: '稳定币兑换协议。',
    url: 'https://curve.fi',
    icon: 'https://curve.fi/favicon.ico',
    verified: true,
    category: 'DEX',
    tags: ['DEX', 'DeFi', 'Stablecoin'],
    permissions: ['eth_accounts', 'eth_sendTransaction'],
    chainIds: [1, 137, 42161, 10, 56],
    riskLevel: 'safe',
    connectionCount: 400000,
  },
  {
    id: '1inch',
    name: '1inch',
    description: 'DEX 聚合器。',
    url: 'https://app.1inch.io',
    icon: 'https://app.1inch.io/favicon.ico',
    verified: true,
    category: 'DEX',
    tags: ['DEX', 'Aggregator', 'Swap'],
    permissions: ['eth_accounts', 'eth_sendTransaction'],
    chainIds: [1, 56, 137, 42161, 10, 43114, 250],
    riskLevel: 'safe',
    connectionCount: 700000,
  },
  {
    id: 'ens',
    name: 'ENS',
    description: '以太坊名称服务。',
    url: 'https://app.ens.domains',
    icon: 'https://app.ens.domains/favicon.ico',
    verified: true,
    category: 'Identity',
    tags: ['ENS', 'Identity', 'Domain'],
    permissions: ['eth_accounts', 'eth_sendTransaction'],
    chainIds: [1, 5],
    riskLevel: 'safe',
    connectionCount: 2000000,
  },
  {
    id: 'looksrare',
    name: 'LooksRare',
    description: '社区第一的 NFT 市场。',
    url: 'https://looksrare.org',
    icon: 'https://looksrare.org/favicon.ico',
    verified: true,
    category: 'NFT',
    tags: ['NFT', 'Marketplace', 'Rewards'],
    permissions: ['eth_accounts', 'eth_sendTransaction', 'eth_signTypedData_v4'],
    chainIds: [1, 5],
    riskLevel: 'safe',
    connectionCount: 300000,
  },
  {
    id: 'x2y2',
    name: 'X2Y2',
    description: '下一代 NFT 市场。',
    url: 'https://x2y2.io',
    icon: 'https://x2y2.io/favicon.ico',
    verified: true,
    category: 'NFT',
    tags: ['NFT', 'Marketplace'],
    permissions: ['eth_accounts', 'eth_sendTransaction'],
    chainIds: [1],
    riskLevel: 'safe',
    connectionCount: 250000,
  },
  {
    id: 'blur',
    name: 'Blur',
    description: '专业交易者的 NFT 市场。',
    url: 'https://blur.io',
    icon: 'https://blur.io/favicon.ico',
    verified: true,
    category: 'NFT',
    tags: ['NFT', 'Marketplace', 'Trading'],
    permissions: ['eth_accounts', 'eth_sendTransaction', 'eth_signTypedData_v4'],
    chainIds: [1],
    riskLevel: 'safe',
    connectionCount: 500000,
  },
  {
    id: 'stargate',
    name: 'Stargate',
    description: '跨链桥协议。',
    url: 'https://stargate.finance',
    icon: 'https://stargate.finance/favicon.ico',
    verified: true,
    category: 'Bridge',
    tags: ['Bridge', 'DeFi', 'Cross-chain'],
    permissions: ['eth_accounts', 'eth_sendTransaction'],
    chainIds: [1, 56, 137, 42161, 10, 43114, 250],
    riskLevel: 'safe',
    connectionCount: 350000,
  },
];

// ============================================================================
// DApp 连接管理器
// ============================================================================

export class DAppConnectionManager {
  private connections: Map<string, DAppConnection> = new Map();
  private dAppInfos: Map<string, DAppInfo> = new Map();
  private currentChainId: number = 1;
  private currentAccount: string = '';
  private eventListeners: Map<string, Function[]> = new Map();
  private dAppWhitelist: Set<string> = new Set();
  private dAppBlacklist: Set<string> = new Set();
  private sessionTimeout: number = 30 * 60 * 1000;

  constructor() {
    this.initializeRecommendedDApps();
  }

  private initializeRecommendedDApps(): void {
    for (const dapp of RECOMMENDED_DAPPS) {
      this.dAppInfos.set(dapp.url, dapp);
    }
  }

  // ========================================================================
  // 连接管理
  // ========================================================================

  /**
   * 连接 DApp
   */
  async connect(dAppUrl: string, accounts: string[], chainId: number): Promise<DAppConnection> {
    const existing = this.connections.get(dAppUrl);
    if (existing) {
      existing.isActive = true;
      existing.lastActiveAt = Date.now();
      if (accounts.length > 0) {
        existing.accounts = accounts;
        existing.activeAccount = accounts[0];
      }
      existing.chainId = chainId;
      this.emit('accountsChanged', accounts);
      this.emit('chainChanged', `0x${chainId.toString(16)}`);
      return existing;
    }

    const connection: DAppConnection = {
      dAppId: this.getDAppId(dAppUrl),
      dAppUrl,
      accounts,
      activeAccount: accounts[0] || '',
      chainId,
      permissions: ['eth_accounts'],
      connectedAt: Date.now(),
      lastActiveAt: Date.now(),
      isActive: true,
    };

    this.connections.set(dAppUrl, connection);
    this.emit('connection', { dAppUrl, accounts, chainId });

    return connection;
  }

  /**
   * 断开 DApp
   */
  disconnect(dAppUrl: string): boolean {
    const connection = this.connections.get(dAppUrl);
    if (!connection) return false;

    connection.isActive = false;
    this.connections.delete(dAppUrl);
    this.emit('disconnect', { dAppUrl });
    return true;
  }

  /**
   * 获取连接
   */
  getConnection(dAppUrl: string): DAppConnection | undefined {
    const connection = this.connections.get(dAppUrl);
    if (connection && Date.now() - connection.lastActiveAt > this.sessionTimeout) {
      connection.isActive = false;
    }
    return connection;
  }

  /**
   * 获取所有连接
   */
  getAllConnections(): DAppConnection[] {
    return Array.from(this.connections.values());
  }

  /**
   * 获取活动连接数
   */
  getActiveConnectionCount(): number {
    let count = 0;
    for (const conn of this.connections.values()) {
      if (conn.isActive) count++;
    }
    return count;
  }

  // ========================================================================
  // 权限管理
  // ========================================================================

  /**
   * 检查权限
   */
  hasPermission(dAppUrl: string, permission: DAppPermission): boolean {
    const connection = this.getConnection(dAppUrl);
    if (!connection || !connection.isActive) return false;
    return connection.permissions.includes(permission);
  }

  /**
   * 添加权限
   */
  addPermission(dAppUrl: string, permission: DAppPermission): boolean {
    const connection = this.getConnection(dAppUrl);
    if (!connection) return false;
    if (!connection.permissions.includes(permission)) {
      connection.permissions.push(permission);
    }
    return true;
  }

  /**
   * 移除权限
   */
  removePermission(dAppUrl: string, permission: DAppPermission): boolean {
    const connection = this.getConnection(dAppUrl);
    if (!connection) return false;
    const index = connection.permissions.indexOf(permission);
    if (index > -1) {
      connection.permissions.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * 获取权限列表
   */
  getPermissions(dAppUrl: string): DAppPermission[] {
    return this.getConnection(dAppUrl)?.permissions || [];
  }

  // ========================================================================
  // DApp 信息
  // ========================================================================

  /**
   * 获取 DApp 信息
   */
  getDAppInfo(dAppUrl: string): DAppInfo | undefined {
    return this.dAppInfos.get(dAppUrl);
  }

  /**
   * 添加 DApp 信息
   */
  addDAppInfo(info: DAppInfo): void {
    this.dAppInfos.set(info.url, info);
  }

  /**
   * 获取推荐 DApps
   */
  getRecommendedDApps(category?: string): DAppInfo[] {
    let result = RECOMMENDED_DAPPS;
    if (category) {
      result = result.filter((d) => d.category === category);
    }
    return result.sort((a, b) => b.connectionCount - a.connectionCount);
  }

  /**
   * 搜索 DApps
   */
  searchDApps(query: string): DAppInfo[] {
    const queryLower = query.toLowerCase();
    const results: Array<{ dapp: DAppInfo; score: number }> = [];

    for (const dapp of this.dAppInfos.values()) {
      let score = 0;
      if (dapp.name.toLowerCase() === queryLower) score += 100;
      else if (dapp.name.toLowerCase().includes(queryLower)) score += 50;
      if (dapp.url.toLowerCase().includes(queryLower)) score += 30;
      if (dapp.description.toLowerCase().includes(queryLower)) score += 20;
      if (dapp.tags.some((t) => t.toLowerCase().includes(queryLower))) score += 25;
      if (dapp.category.toLowerCase().includes(queryLower)) score += 15;

      if (score > 0) {
        results.push({ dapp, score });
      }
    }

    return results.sort((a, b) => b.score - a.score).map((r) => r.dapp);
  }

  // ========================================================================
  // 黑白名单
  // ========================================================================

  /**
   * 添加到白名单
   */
  addToWhitelist(dAppUrl: string): void {
    this.dAppWhitelist.add(dAppUrl);
    this.dAppBlacklist.delete(dAppUrl);
  }

  /**
   * 从白名单移除
   */
  removeFromWhitelist(dAppUrl: string): boolean {
    return this.dAppWhitelist.delete(dAppUrl);
  }

  /**
   * 是否在白名单
   */
  isWhitelisted(dAppUrl: string): boolean {
    return this.dAppWhitelist.has(dAppUrl);
  }

  /**
   * 添加到黑名单
   */
  addToBlacklist(dAppUrl: string): void {
    this.dAppBlacklist.add(dAppUrl);
    this.dAppWhitelist.delete(dAppUrl);
    this.disconnect(dAppUrl);
  }

  /**
   * 从黑名单移除
   */
  removeFromBlacklist(dAppUrl: string): boolean {
    return this.dAppBlacklist.delete(dAppUrl);
  }

  /**
   * 是否在黑名单
   */
  isBlacklisted(dAppUrl: string): boolean {
    return this.dAppBlacklist.has(dAppUrl);
  }

  /**
   * 检查风险等级
   */
  getRiskLevel(dAppUrl: string): DAppInfo['riskLevel'] {
    if (this.dAppBlacklist.has(dAppUrl)) return 'risky';
    const info = this.dAppInfos.get(dAppUrl);
    if (info) return info.riskLevel;
    return 'unknown';
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

  /**
   * 触发事件
   */
  private emit(event: string, data?: any): void {
    const listeners = this.eventListeners.get(event);
    if (!listeners) return;
    for (const listener of listeners) {
      try {
        listener(data);
      } catch (e) {
        console.error(`Event listener error for ${event}:`, e);
      }
    }
  }

  // ========================================================================
  // 网络管理
  // ========================================================================

  /**
   * 切换链
   */
  switchChain(dAppUrl: string, chainId: number): boolean {
    const connection = this.getConnection(dAppUrl);
    if (!connection) return false;

    connection.chainId = chainId;
    this.currentChainId = chainId;
    this.emit('chainChanged', `0x${chainId.toString(16)}`);
    return true;
  }

  /**
   * 获取当前链 ID
   */
  getCurrentChainId(): number {
    return this.currentChainId;
  }

  /**
   * 设置当前账户
   */
  setCurrentAccount(account: string): void {
    this.currentAccount = account;
    for (const conn of this.connections.values()) {
      if (conn.isActive && conn.accounts.includes(account)) {
        conn.activeAccount = account;
      }
    }
    this.emit('accountsChanged', [account]);
  }

  /**
   * 获取当前账户
   */
  getCurrentAccount(): string {
    return this.currentAccount;
  }

  // ========================================================================
  // 会话管理
  // ========================================================================

  /**
   * 刷新会话
   */
  refreshSession(dAppUrl: string): boolean {
    const connection = this.getConnection(dAppUrl);
    if (!connection) return false;
    connection.lastActiveAt = Date.now();
    connection.isActive = true;
    return true;
  }

  /**
   * 设置会话超时
   */
  setSessionTimeout(timeoutMs: number): void {
    this.sessionTimeout = timeoutMs;
  }

  /**
   * 清理过期会话
   */
  cleanupExpiredSessions(): number {
    const now = Date.now();
    let cleaned = 0;
    for (const [url, conn] of this.connections) {
      if (now - conn.lastActiveAt > this.sessionTimeout && conn.isActive) {
        conn.isActive = false;
        cleaned++;
      }
    }
    return cleaned;
  }

  // ========================================================================
  // 工具方法
  // ========================================================================

  private getDAppId(url: string): string {
    try {
      const hostname = new URL(url).hostname;
      return hostname.replace(/\./g, '_');
    } catch {
      return url;
    }
  }

  /**
   * 验证交易请求
   */
  validateTransactionRequest(tx: DAppTransactionRequest): { valid: boolean; error?: string } {
    if (!tx.to && !tx.data) {
      return { valid: false, error: '交易必须包含 to 或 data' };
    }
    if (tx.value && isNaN(parseFloat(tx.value))) {
      return { valid: false, error: '无效的 value' };
    }
    if (tx.to && !/^0x[a-fA-F0-9]{40}$/.test(tx.to)) {
      return { valid: false, error: '无效的 to 地址' };
    }
    return { valid: true };
  }

  /**
   * 验证签名请求
   */
  validateSignRequest(request: DAppSignRequest): { valid: boolean; error?: string } {
    if (!request.address || !/^0x[a-fA-F0-9]{40}$/.test(request.address)) {
      return { valid: false, error: '无效的地址' };
    }
    if (!request.data) {
      return { valid: false, error: '签名数据不能为空' };
    }
    return { valid: true };
  }

  /**
   * 获取连接统计
   */
  getStats(): {
    totalConnections: number;
    activeConnections: number;
    whitelistCount: number;
    blacklistCount: number;
    totalDApps: number;
  } {
    return {
      totalConnections: this.connections.size,
      activeConnections: this.getActiveConnectionCount(),
      whitelistCount: this.dAppWhitelist.size,
      blacklistCount: this.dAppBlacklist.size,
      totalDApps: this.dAppInfos.size,
    };
  }
}

// ============================================================================
// EIP-1193 Provider 实现
// ============================================================================

export class EIP1193Provider {
  private connectionManager: DAppConnectionManager;
  private dAppUrl: string;
  private connected: boolean = false;
  private eventListeners: Map<string, Function[]> = new Map();

  constructor(connectionManager: DAppConnectionManager, dAppUrl: string) {
    this.connectionManager = connectionManager;
    this.dAppUrl = dAppUrl;
  }

  /**
   * 发起请求
   */
  async request(req: EIP1193Request): Promise<any> {
    const { method, params = [] } = req;

    switch (method) {
      case 'eth_accounts':
        return this.handleEthAccounts();
      case 'eth_requestAccounts':
        return this.handleEthRequestAccounts();
      case 'eth_chainId':
        return this.handleEthChainId();
      case 'net_version':
        return this.handleNetVersion();
      case 'eth_sendTransaction':
        return this.handleEthSendTransaction(params[0]);
      case 'eth_signTransaction':
        return this.handleEthSignTransaction(params[0]);
      case 'eth_sign':
        return this.handleEthSign(params[0], params[1]);
      case 'personal_sign':
        return this.handlePersonalSign(params[0], params[1]);
      case 'eth_signTypedData':
      case 'eth_signTypedData_v1':
      case 'eth_signTypedData_v3':
      case 'eth_signTypedData_v4':
        return this.handleSignTypedData(params[0], params[1], method);
      case 'wallet_switchEthereumChain':
        return this.handleSwitchChain(params[0]);
      case 'wallet_addEthereumChain':
        return this.handleAddChain(params[0]);
      case 'wallet_watchAsset':
        return this.handleWatchAsset(params[0]);
      case 'web3_clientVersion':
        return 'ZS-Wallet/1.0.0';
      default:
        throw this.createError(EIP1193_ERRORS.UNSUPPORTED_METHOD);
    }
  }

  private async handleEthAccounts(): Promise<string[]> {
    const connection = this.connectionManager.getConnection(this.dAppUrl);
    if (!connection || !connection.isActive) return [];
    return connection.accounts;
  }

  private async handleEthRequestAccounts(): Promise<string[]> {
    return ['0x0000000000000000000000000000000000000000'];
  }

  private handleEthChainId(): string {
    const connection = this.connectionManager.getConnection(this.dAppUrl);
    const chainId = connection?.chainId ?? 1;
    return `0x${chainId.toString(16)}`;
  }

  private handleNetVersion(): string {
    const connection = this.connectionManager.getConnection(this.dAppUrl);
    return (connection?.chainId ?? 1).toString();
  }

  private async handleEthSendTransaction(tx: DAppTransactionRequest): Promise<string> {
    if (!this.connectionManager.hasPermission(this.dAppUrl, 'eth_sendTransaction')) {
      throw this.createError(EIP1193_ERRORS.UNAUTHORIZED);
    }
    return '0x' + '0'.repeat(64);
  }

  private async handleEthSignTransaction(tx: DAppTransactionRequest): Promise<string> {
    if (!this.connectionManager.hasPermission(this.dAppUrl, 'eth_signTransaction')) {
      throw this.createError(EIP1193_ERRORS.UNAUTHORIZED);
    }
    return '0x';
  }

  private async handleEthSign(address: string, data: string): Promise<string> {
    if (!this.connectionManager.hasPermission(this.dAppUrl, 'eth_sign')) {
      throw this.createError(EIP1193_ERRORS.UNAUTHORIZED);
    }
    return '0x' + '0'.repeat(130);
  }

  private async handlePersonalSign(message: string, address: string): Promise<string> {
    if (!this.connectionManager.hasPermission(this.dAppUrl, 'personal_sign')) {
      throw this.createError(EIP1193_ERRORS.UNAUTHORIZED);
    }
    return '0x' + '0'.repeat(130);
  }

  private async handleSignTypedData(
    address: string,
    typedData: string,
    method: string
  ): Promise<string> {
    const perm = method as DAppPermission;
    if (!this.connectionManager.hasPermission(this.dAppUrl, perm)) {
      throw this.createError(EIP1193_ERRORS.UNAUTHORIZED);
    }
    return '0x' + '0'.repeat(130);
  }

  private async handleSwitchChain(params: { chainId: string }): Promise<null> {
    const chainId = parseInt(params.chainId, 16);
    const success = this.connectionManager.switchChain(this.dAppUrl, chainId);
    if (!success) {
      throw this.createError(EIP1193_ERRORS.CHAIN_NOT_ADDED);
    }
    return null;
  }

  private async handleAddChain(chainParams: DAppAddChainRequest): Promise<null> {
    return null;
  }

  private async handleWatchAsset(params: WatchAssetParams): Promise<boolean> {
    return true;
  }

  private createError(error: { code: number; message: string }): EIP1193Error {
    return { ...error };
  }

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
  removeListener(event: string, callback: Function): boolean {
    const listeners = this.eventListeners.get(event);
    if (!listeners) return false;
    const index = listeners.indexOf(callback);
    if (index > -1) {
      listeners.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * 启用提供者
   */
  enable(): Promise<string[]> {
    return this.request({ method: 'eth_requestAccounts' });
  }

  /**
   * 是否已连接
   */
  isConnected(): boolean {
    return this.connected;
  }
}

// ============================================================================
// 默认导出
// ============================================================================

export default {
  DAppConnectionManager,
  EIP1193Provider,
  RECOMMENDED_DAPPS,
  EIP1193_ERRORS,
};
