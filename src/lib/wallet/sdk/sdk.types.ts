/**
 * Web3 钱包 SDK 类型定义
 *
 * 包含 SDK 所有模块的核心类型定义：
 *  - WalletSDKOptions: SDK 初始化配置
 *  - WalletState: 钱包全局状态
 *  - DAppSession: DApp 会话信息
 *  - ChainConfig: 链配置
 *  - AccountInfo: 账户信息
 *  - SignRequest: 签名请求
 *  - TransactionRequest: 交易请求
 *
 * 遵循标准：
 *  - EIP-1193: Ethereum Provider JavaScript API
 *  - EIP-1102: Opt-in account exposure
 *  - EIP-3085: wallet_addEthereumChain
 *  - EIP-3326: wallet_switchEthereumChain
 *  - EIP-712: Ethereum typed structured data hashing and signing
 *  - EIP-191: Signed Data Standard
 *  - CAIP-2: Blockchain ID Specification
 *  - CAIP-10: Account ID Specification
 */

// ============================================================================
// 基础类型
// ============================================================================

/** 链 ID 类型（数字或十六进制字符串） */
export type ChainId = number | string;

/** 地址类型（校验和格式） */
export type Address = string;

/** 交易哈希 */
export type TxHash = string;

/** 区块号 */
export type BlockNumber = number | string;

/** 十六进制数据 */
export type Hex = string;

/** 大数字符串 */
export type BigNumberish = string | number | bigint;

// ============================================================================
// 事件类型
// ============================================================================

/** SDK 事件名称 */
export type SDKEventName =
  | 'accountsChanged'
  | 'chainChanged'
  | 'connect'
  | 'disconnect'
  | 'message'
  | 'signRequest'
  | 'transactionRequest'
  | 'sessionCreated'
  | 'sessionDeleted'
  | 'sessionUpdated'
  | 'networkChanged'
  | 'error';

/** 事件回调函数 */
export type EventCallback = (...args: any[]) => void;

// ============================================================================
// 错误类型
// ============================================================================

/** 标准 EIP-1193 错误码 */
export enum ProviderErrorCode {
  /** 用户拒绝了请求 */
  USER_REJECTED = 4001,
  /** 请求未授权 */
  UNAUTHORIZED = 4100,
  /** 方法不支持 */
  UNSUPPORTED_METHOD = 4200,
  /** 链不支持 */
  DISCONNECTED = 4900,
  /** 链未切换 */
  CHAIN_DISCONNECTED = 4901,
  /** 内部错误 */
  INTERNAL_ERROR = -32603,
  /** 无效参数 */
  INVALID_PARAMS = -32602,
  /** 方法未找到 */
  METHOD_NOT_FOUND = -32601,
  /** 请求解析错误 */
  PARSE_ERROR = -32700,
}

/** Provider 错误信息 */
export interface ProviderError extends Error {
  code: number;
  data?: unknown;
}

// ============================================================================
// SDK 配置
// ============================================================================

/** SDK 初始化配置选项 */
export interface WalletSDKOptions {
  /** 项目名称 */
  projectName: string;
  /** 项目描述 */
  projectDescription?: string;
  /** 项目图标 URL */
  projectIcon?: string;
  /** 项目 URL */
  projectUrl?: string;
  /** WalletConnect 项目 ID */
  walletConnectProjectId?: string;
  /** 元数据名称 */
  metadataName?: string;
  /** 元数据描述 */
  metadataDescription?: string;
  /** 元数据图标 */
  metadataIcons?: string[];
  /** 元数据 URL */
  metadataUrl?: string;
  /** 默认链 ID */
  defaultChainId?: number;
  /** 支持的链 ID 列表 */
  supportedChainIds?: number[];
  /** RPC URL 映射 { chainId: rpcUrl } */
  rpcUrls?: Record<number, string>;
  /** 是否启用调试模式 */
  debug?: boolean;
  /** 存储键前缀 */
  storageKeyPrefix?: string;
  /** 是否启用多账户支持 */
  multiAccountEnabled?: boolean;
  /** 是否启用多链支持 */
  multiChainEnabled?: boolean;
  /** 自动锁定时间（秒） */
  autoLockTime?: number;
  /** 最大会话数量 */
  maxSessions?: number;
  /** 自定义链配置列表 */
  customChains?: ChainConfig[];
}

/** SDK 默认配置 */
export const DEFAULT_SDK_OPTIONS: Required<Pick<WalletSDKOptions,
  | 'debug'
  | 'storageKeyPrefix'
  | 'multiAccountEnabled'
  | 'multiChainEnabled'
  | 'autoLockTime'
  | 'maxSessions'
  | 'defaultChainId'
>> = {
  debug: false,
  storageKeyPrefix: 'wallet_sdk_',
  multiAccountEnabled: true,
  multiChainEnabled: true,
  autoLockTime: 300,
  maxSessions: 50,
  defaultChainId: 1,
};

// ============================================================================
// 链配置
// ============================================================================

/** 链类型 */
export type ChainType = 'evm' | 'solana' | 'tron' | 'bitcoin' | 'cosmos';

/** 原生代币配置 */
export interface NativeCurrency {
  name: string;
  symbol: string;
  decimals: number;
}

/** 区块浏览器配置 */
export interface BlockExplorerConfig {
  name: string;
  url: string;
  standard?: 'EIP3091' | 'none';
  iconUrl?: string;
}

/** 链配置信息 */
export interface ChainConfig {
  /** 链 ID（十进制数字） */
  chainId: number;
  /** 链名称 */
  chainName: string;
  /** 链类型 */
  chainType: ChainType;
  /** 原生代币 */
  nativeCurrency: NativeCurrency;
  /** RPC URL 列表 */
  rpcUrls: string[];
  /** 区块浏览器列表 */
  blockExplorers?: BlockExplorerConfig[];
  /** 测试网标志 */
  testnet?: boolean;
  /** 链图标 */
  iconUrl?: string;
  /** 链简称 */
  shortName?: string;
  /** 网络 ID（通常与 chainId 相同） */
  networkId?: number;
  /** 排序优先级 */
  priority?: number;
  /** 是否启用 */
  enabled?: boolean;
  /** Gas 设置 */
  gasConfig?: {
    /** 基础 Gas 限制 */
    baseGasLimit?: number;
    /** Gas 价格（wei） */
    gasPrice?: string;
    /** EIP-1559 支持 */
    eip1559?: boolean;
    /** 最大 Gas 限制 */
    maxGasLimit?: number;
    /** Gas 倍数 */
    gasMultiplier?: number;
  };
}

/** 链切换请求参数（EIP-3326） */
export interface SwitchEthereumChainParams {
  chainId: string;
}

/** 添加链请求参数（EIP-3085） */
export interface AddEthereumChainParams {
  chainId: string;
  chainName: string;
  nativeCurrency: NativeCurrency;
  rpcUrls: string[];
  blockExplorerUrls?: string[];
  iconUrls?: string[];
}

// ============================================================================
// 账户信息
// ============================================================================

/** 账户类型 */
export type AccountType = 'mnemonic' | 'privateKey' | 'hardware' | 'watch' | 'mpc';

/** 账户状态 */
export type AccountStatus = 'active' | 'inactive' | 'locked' | 'importing';

/** HD 账户派生路径信息 */
export interface HDPathInfo {
  /** 派生路径 */
  path: string;
  /** 账户索引 */
  accountIndex: number;
  /** 地址索引 */
  addressIndex: number;
  /** 变更索引（0=外部，1=内部） */
  changeIndex?: number;
}

/** 账户信息 */
export interface AccountInfo {
  /** 账户唯一 ID */
  id: string;
  /** 账户地址（校验和格式） */
  address: Address;
  /** 账户公钥 */
  publicKey?: string;
  /** 账户名称 */
  name: string;
  /** 账户类型 */
  type: AccountType;
  /** 账户状态 */
  status: AccountStatus;
  /** 链 ID */
  chainId: number;
  /** HD 路径信息（助记词账户） */
  hdPath?: HDPathInfo;
  /** 是否为默认账户 */
  isDefault: boolean;
  /** 创建时间戳 */
  createdAt: number;
  /** 更新时间戳 */
  updatedAt: number;
  /** 最后使用时间戳 */
  lastUsedAt?: number;
  /** 账户标签 */
  tags?: string[];
  /** 备注 */
  note?: string;
  /** 关联的钱包 ID */
  walletId?: string;
  /** 硬件钱包信息 */
  hardwareInfo?: {
    deviceType: string;
    deviceId: string;
    appName?: string;
    appVersion?: string;
  };
}

/** 创建账户参数 */
export interface CreateAccountOptions {
  /** 账户名称 */
  name?: string;
  /** 链 ID */
  chainId?: number;
  /** 账户类型 */
  type?: AccountType;
  /** 私钥（导入私钥账户） */
  privateKey?: string;
  /** 助记词（导入助记词账户） */
  mnemonic?: string;
  /** 派生路径 */
  hdPath?: string;
  /** 账户索引 */
  accountIndex?: number;
  /** 是否设置为默认账户 */
  setAsDefault?: boolean;
  /** 标签列表 */
  tags?: string[];
  /** 备注 */
  note?: string;
}

/** 导入账户参数 */
export interface ImportAccountOptions {
  /** 导入类型 */
  importType: 'privateKey' | 'mnemonic' | 'jsonKeystore' | 'watch';
  /** 私钥 */
  privateKey?: string;
  /** 助记词 */
  mnemonic?: string;
  /** 助记词密码 */
  mnemonicPassword?: string;
  /** JSON Keystore 文件内容 */
  keystoreJson?: string;
  /** Keystore 密码 */
  keystorePassword?: string;
  /** 观察地址 */
  watchAddress?: string;
  /** 账户名称 */
  name?: string;
  /** 链 ID */
  chainId?: number;
  /** 派生路径 */
  hdPath?: string;
  /** 是否设置为默认账户 */
  setAsDefault?: boolean;
}

// ============================================================================
// 签名请求
// ============================================================================

/** 签名类型 */
export type SignType =
  | 'personalSign'
  | 'ethSign'
  | 'ethSignTypedData'
  | 'ethSignTypedDataV1'
  | 'ethSignTypedDataV3'
  | 'ethSignTypedDataV4'
  | 'ethSignTransaction'
  | 'ethSendTransaction';

/** 签名请求状态 */
export type SignRequestStatus = 'pending' | 'approved' | 'rejected' | 'expired';

/** EIP-712 类型化数据 */
export interface EIP712TypedData {
  types: Record<string, EIP712TypeField[]>;
  primaryType: string;
  domain: EIP712Domain;
  message: Record<string, any>;
}

/** EIP-712 类型字段 */
export interface EIP712TypeField {
  name: string;
  type: string;
}

/** EIP-712 域分隔符 */
export interface EIP712Domain {
  name?: string;
  version?: string;
  chainId?: number | string;
  verifyingContract?: string;
  salt?: string;
}

/** 签名请求 */
export interface SignRequest {
  /** 请求唯一 ID */
  id: string;
  /** 签名类型 */
  type: SignType;
  /** 请求状态 */
  status: SignRequestStatus;
  /** 发起 DApp 的会话 ID */
  sessionId?: string;
  /** 发起 DApp 信息 */
  dappInfo?: DAppInfo;
  /** 签名地址 */
  address: Address;
  /** 链 ID */
  chainId: number;
  /** 原始消息 */
  rawMessage: string;
  /** 解析后的消息（用于显示） */
  parsedMessage?: string | EIP712TypedData;
  /** EIP-712 类型化数据 */
  typedData?: EIP712TypedData;
  /** 请求时间戳 */
  requestedAt: number;
  /** 过期时间戳 */
  expiresAt?: number;
  /** 签名结果 */
  signature?: string;
  /** 拒绝原因 */
  rejectReason?: string;
  /** 风险等级 */
  riskLevel?: 'safe' | 'warning' | 'danger';
  /** 风险提示 */
  riskWarnings?: string[];
  /** 请求来源 */
  source: 'dapp' | 'internal' | 'walletconnect';
}

/** 签名结果 */
export interface SignResult {
  /** 签名数据 */
  signature: string;
  /** 签名地址 */
  address: Address;
  /** 签名类型 */
  type: SignType;
  /** 链 ID */
  chainId: number;
  /** 签名时间戳 */
  signedAt: number;
}

// ============================================================================
// 交易请求
// ============================================================================

/** 交易类型 */
export type TransactionType =
  | 'transfer'
  | 'contractCall'
  | 'contractDeployment'
  | 'approve'
  | 'swap'
  | 'stake'
  | 'unwrap'
  | 'wrap';

/** 交易状态 */
export type TransactionStatus =
  | 'pending'
  | 'signed'
  | 'broadcasting'
  | 'confirmed'
  | 'failed'
  | 'replaced'
  | 'cancelled';

/** 交易请求（EIP-1559 和传统交易） */
export interface TransactionRequest {
  /** 请求唯一 ID */
  id: string;
  /** 交易类型 */
  type: TransactionType;
  /** 发起地址 */
  from: Address;
  /** 接收地址 */
  to?: Address;
  /** 转账金额（wei） */
  value?: string;
  /** Gas 限制 */
  gasLimit?: string;
  /** Gas 价格（传统交易，wei） */
  gasPrice?: string;
  /** 最大 Gas 费用（EIP-1559，wei） */
  maxFeePerGas?: string;
  /** 最大优先 Gas 费用（EIP-1559，wei） */
  maxPriorityFeePerGas?: string;
  /** 交易数据 */
  data?: string;
  /** Nonce */
  nonce?: number;
  /** 链 ID */
  chainId: number;
  /** 交易类型（0=传统，2=EIP-1559） */
  txType?: 0 | 2;
  /** 访问列表（EIP-2930） */
  accessList?: AccessListEntry[];
  /** 请求状态 */
  status: TransactionStatus;
  /** 发起 DApp 信息 */
  dappInfo?: DAppInfo;
  /** 会话 ID */
  sessionId?: string;
  /** 请求时间戳 */
  requestedAt: number;
  /** 交易哈希（广播后） */
  txHash?: string;
  /** 区块号（确认后） */
  blockNumber?: number;
  /** 确认数 */
  confirmations?: number;
  /** 错误信息 */
  error?: string;
  /** Gas 使用费（wei） */
  gasUsed?: string;
  /** 实际 Gas 价格（wei） */
  effectiveGasPrice?: string;
  /** 交易费用（wei） */
  txFee?: string;
  /** 解析后的交易信息 */
  parsedTx?: ParsedTransaction;
  /** 风险等级 */
  riskLevel?: 'safe' | 'warning' | 'danger';
  /** 风险提示 */
  riskWarnings?: string[];
  /** 请求来源 */
  source: 'dapp' | 'internal' | 'walletconnect';
}

/** 访问列表条目 */
export interface AccessListEntry {
  address: Address;
  storageKeys: string[];
}

/** 解析后的交易信息 */
export interface ParsedTransaction {
  /** 方法名 */
  methodName?: string;
  /** 函数签名 */
  functionSignature?: string;
  /** 解析后的参数 */
  parameters?: Record<string, any>;
  /** 合约名称 */
  contractName?: string;
  /** 代币信息 */
  tokenInfo?: {
    symbol: string;
    name: string;
    decimals: number;
    address: Address;
  };
  /** 转账金额（格式化后） */
  formattedValue?: string;
  /** 交易摘要 */
  summary?: string;
}

/** 交易结果 */
export interface TransactionResult {
  /** 交易哈希 */
  txHash: string;
  /** 链 ID */
  chainId: number;
  /** 发送地址 */
  from: Address;
  /** 接收地址 */
  to?: Address;
  /** 交易状态 */
  status: TransactionStatus;
  /** 区块号 */
  blockNumber?: number;
  /** 确认数 */
  confirmations?: number;
  /** 广播时间 */
  broadcastedAt: number;
  /** 确认时间 */
  confirmedAt?: number;
}

// ============================================================================
// DApp 会话
// ============================================================================

/** DApp 信息 */
export interface DAppInfo {
  /** DApp 名称 */
  name: string;
  /** DApp 描述 */
  description?: string;
  /** DApp URL */
  url: string;
  /** DApp 图标 */
  icon?: string;
  /** DApp 图标列表 */
  icons?: string[];
  /** 验证状态 */
  verified?: boolean;
  /** 来源 */
  source: 'dapp-browser' | 'walletconnect' | 'external';
}

/** DApp 权限 */
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

/** DApp 会话 */
export interface DAppSession {
  /** 会话唯一 ID */
  id: string;
  /** DApp 信息 */
  dapp: DAppInfo;
  /** 授权的账户地址列表 */
  accounts: Address[];
  /** 当前活跃账户 */
  activeAccount: Address;
  /** 当前链 ID */
  chainId: number;
  /** 授权的权限列表 */
  permissions: DAppPermission[];
  /** 连接时间戳 */
  connectedAt: number;
  /** 最后活动时间戳 */
  lastActiveAt: number;
  /** 会话状态 */
  status: 'active' | 'inactive' | 'disconnected';
  /** 连接类型 */
  connectionType: 'dapp-browser' | 'walletconnect' | 'injected';
  /** WalletConnect 会话主题（WC 连接时） */
  wcTopic?: string;
  /** 会话元数据 */
  metadata?: Record<string, any>;
}

/** 会话连接参数 */
export interface ConnectOptions {
  /** 请求的权限列表 */
  permissions?: DAppPermission[];
  /** 请求的链 ID */
  chainId?: number;
  /** DApp 信息 */
  dappInfo: DAppInfo;
  /** 连接类型 */
  connectionType: 'dapp-browser' | 'walletconnect' | 'injected';
  /** 是否请求账户访问 */
  requestAccounts?: boolean;
}

// ============================================================================
// 钱包状态
// ============================================================================

/** 钱包全局状态 */
export interface WalletState {
  /** SDK 是否已初始化 */
  initialized: boolean;
  /** 钱包是否已锁定 */
  locked: boolean;
  /** 当前链 ID */
  currentChainId: number;
  /** 默认账户地址 */
  defaultAccount: Address | null;
  /** 所有账户列表 */
  accounts: AccountInfo[];
  /** 活跃会话列表 */
  sessions: DAppSession[];
  /** 待处理签名请求 */
  pendingSignRequests: SignRequest[];
  /** 待处理交易请求 */
  pendingTransactionRequests: TransactionRequest[];
  /** 支持的链列表 */
  supportedChains: ChainConfig[];
  /** 自定义链列表 */
  customChains: ChainConfig[];
  /** 初始化时间 */
  initializedAt?: number;
  /** 最后解锁时间 */
  lastUnlockedAt?: number;
}

// ============================================================================
// 通知类型
// ============================================================================

/** 通知类型 */
export type NotificationType =
  | 'transaction'
  | 'signature'
  | 'security'
  | 'connection'
  | 'network'
  | 'info'
  | 'warning'
  | 'error';

/** 通知级别 */
export type NotificationLevel = 'info' | 'success' | 'warning' | 'error';

/** 通知 */
export interface WalletNotification {
  /** 通知唯一 ID */
  id: string;
  /** 通知类型 */
  type: NotificationType;
  /** 通知级别 */
  level: NotificationLevel;
  /** 通知标题 */
  title: string;
  /** 通知内容 */
  message: string;
  /** 通知数据 */
  data?: Record<string, any>;
  /** 通知时间戳 */
  timestamp: number;
  /** 是否已读 */
  read: boolean;
  /** 关联的交易哈希 */
  txHash?: string;
  /** 关联的会话 ID */
  sessionId?: string;
  /** 自动消失时间（毫秒） */
  duration?: number;
  /** 操作按钮 */
  actions?: NotificationAction[];
}

/** 通知操作 */
export interface NotificationAction {
  label: string;
  action: string;
  primary?: boolean;
}

// ============================================================================
// 地址簿类型
// ============================================================================

/** 联系人 */
export interface Contact {
  /** 联系人唯一 ID */
  id: string;
  /** 联系人名称 */
  name: string;
  /** 联系人地址 */
  address: Address;
  /** 链 ID */
  chainId: number;
  /** 联系人头像 */
  avatar?: string;
  /** 邮箱 */
  email?: string;
  /** 电话 */
  phone?: string;
  /** 备注 */
  note?: string;
  /** 标签 */
  tags?: string[];
  /** 是否收藏 */
  isFavorite: boolean;
  /** 创建时间 */
  createdAt: number;
  /** 更新时间 */
  updatedAt: number;
  /** 最近使用时间 */
  lastUsedAt?: number;
  /** 使用次数 */
  useCount: number;
}

/** 创建联系人参数 */
export interface CreateContactOptions {
  name: string;
  address: Address;
  chainId?: number;
  avatar?: string;
  email?: string;
  phone?: string;
  note?: string;
  tags?: string[];
  isFavorite?: boolean;
  category?: string;
  relatedAddresses?: Array<{
    chainId: number;
    address: Address;
  }>;
}

// ============================================================================
// WalletConnect 类型
// ============================================================================

/** WalletConnect 会话提案 */
export interface WCSessionProposal {
  /** 提案 ID */
  id: number;
  /** 配对主题 */
  pairingTopic: string;
  /** 提议者信息 */
  proposer: {
    publicKey: string;
    metadata: WCPeerMeta;
  };
  /** 请求的权限 */
  requiredNamespaces: Record<string, WCNamespace>;
  /** 可选权限 */
  optionalNamespaces?: Record<string, WCNamespace>;
  /** 会话属性 */
  sessionProperties?: Record<string, string>;
  /** 验证上下文 */
  verifyContext?: {
    verified: {
      verifyUrl: string;
      validation: 'VALID' | 'INVALID' | 'UNKNOWN';
      origin: string;
    };
  };
}

/** WalletConnect 对等元数据 */
export interface WCPeerMeta {
  name: string;
  description: string;
  url: string;
  icons: string[];
  redirect?: {
    native?: string;
    universal?: string;
  };
}

/** WalletConnect 命名空间 */
export interface WCNamespace {
  /** 链列表（CAIP-2 格式，如 eip155:1） */
  chains?: string[];
  /** 方法列表 */
  methods: string[];
  /** 事件列表 */
  events: string[];
  /** 账户列表（CAIP-10 格式） */
  accounts?: string[];
}

/** WalletConnect 会话状态 */
export interface WCSessionState {
  /** 会话主题 */
  topic: string;
  /** 配对主题 */
  pairingTopic: string;
  /** 对等方信息 */
  peer: WCPeerMeta;
  /** 命名空间 */
  namespaces: Record<string, WCNamespace>;
  /** 过期时间 */
  expiry: number;
  /**  acknowledged */
  acknowledged: boolean;
  /** 控制器 */
  controller: string;
}

// ============================================================================
// Provider 类型
// ============================================================================

/** JSON-RPC 请求 */
export interface JsonRpcRequest {
  jsonrpc: string;
  id: string | number | null;
  method: string;
  params?: unknown[] | Record<string, unknown>;
}

/** JSON-RPC 响应 */
export interface JsonRpcResponse<T = unknown> {
  jsonrpc: string;
  id: string | number | null;
  result?: T;
  error?: JsonRpcError;
}

/** JSON-RPC 错误 */
export interface JsonRpcError {
  code: number;
  message: string;
  data?: unknown;
}

/** Provider 接口（EIP-1193） */
export interface EIP1193Provider {
  request<T = unknown>(args: { method: string; params?: unknown[] | Record<string, unknown> }): Promise<T>;
  on(event: 'accountsChanged', listener: (accounts: string[]) => void): this;
  on(event: 'chainChanged', listener: (chainId: string) => void): this;
  on(event: 'connect', listener: (info: { chainId: string }) => void): this;
  on(event: 'disconnect', listener: (error: ProviderError) => void): this;
  on(event: 'message', listener: (message: { type: string; data: unknown }) => void): this;
  on(event: string, listener: (...args: any[]) => void): this;
  removeListener(event: string, listener: (...args: any[]) => void): this;
  isConnected(): boolean;
}

// ============================================================================
// 存储接口
// ============================================================================

/** 存储适配器接口 */
export interface StorageAdapter {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
  remove(key: string): Promise<void>;
  clear(): Promise<void>;
}

// ============================================================================
// 中间件类型
// ============================================================================

/** Provider 中间件上下文 */
export interface ProviderMiddlewareContext {
  request: JsonRpcRequest;
  response?: JsonRpcResponse;
  session?: DAppSession;
  chainId: number;
  account?: Address;
}

/** Provider 中间件函数 */
export type ProviderMiddleware = (
  context: ProviderMiddlewareContext,
  next: () => Promise<void>
) => Promise<void>;
