/**
 * ChainAdapter 统一接口定义
 *
 * 定义多链适配层的标准接口，所有链适配器必须实现此接口。
 * 采用面向接口编程原则，确保各链实现的一致性和可替换性。
 *
 * 设计原则：
 *  - 接口隔离：每个方法职责单一
 *  - 类型安全：严格的 TypeScript 类型定义
 *  - 可扩展：支持未来新增链类型
 *  - 统一返回格式：跨链数据结构标准化
 */

// ============================================================================
// 枚举类型定义
// ============================================================================

/**
 * 链类型枚举
 * 定义所有支持的区块链类型
 */
export enum ChainType {
  EVM = 'evm',
  SOLANA = 'solana',
  BITCOIN = 'bitcoin',
  COSMOS = 'cosmos',
  TRON = 'tron',
  SUI = 'sui',
  APTOS = 'aptos',
  NEAR = 'near',
}

/**
 * 交易状态枚举
 */
export enum TransactionStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  FAILED = 'failed',
  REVERTED = 'reverted',
  FINALIZED = 'finalized',
}

/**
 * 代币标准枚举
 */
export enum TokenStandard {
  NATIVE = 'native',
  ERC20 = 'erc20',
  ERC721 = 'erc721',
  ERC1155 = 'erc1155',
  SPL = 'spl',
  TRC20 = 'trc20',
  CW20 = 'cw20',
  CW721 = 'cw721',
}

/**
 * 交易类型枚举
 */
export enum TransactionType {
  TRANSFER = 'transfer',
  TOKEN_TRANSFER = 'token_transfer',
  CONTRACT_CALL = 'contract_call',
  DEPLOY = 'deploy',
  STAKE = 'stake',
  UNSTAKE = 'unstake',
  VOTE = 'vote',
}

/**
 * 费用等级枚举
 */
export enum FeeLevel {
  SLOW = 'slow',
  NORMAL = 'normal',
  FAST = 'fast',
  CUSTOM = 'custom',
}

/**
 * 地址类型枚举
 */
export enum AddressType {
  EOA = 'eoa',
  CONTRACT = 'contract',
  MULTISIG = 'multisig',
  VALIDATOR = 'validator',
}

// ============================================================================
// 基础类型定义
// ============================================================================

/**
 * 链信息接口
 * 描述区块链网络的基本信息
 */
export interface ChainInfo {
  chainId: string | number;
  chainKey: string;
  chainName: string;
  chainType: ChainType;
  symbol: string;
  decimals: number;
  rpcUrls: string[];
  blockExplorerUrl: string;
  isTestnet: boolean;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
    logoURI?: string;
  };
  features: {
    smartContracts: boolean;
    nft: boolean;
    staking: boolean;
    governance: boolean;
    eip1559?: boolean;
    eip712?: boolean;
  };
  metadata?: Record<string, any>;
}

/**
 * 余额信息接口
 * 统一的余额数据结构
 */
export interface BalanceInfo {
  chainKey: string;
  chainType: ChainType;
  address: string;
  native: {
    balance: string;
    formatted: string;
    decimals: number;
    symbol: string;
    usdValue?: string;
    usdPrice?: string;
  };
  tokens?: TokenBalanceInfo[];
  updatedAt: string;
  source: 'rpc' | 'indexer' | 'fallback';
  extra?: Record<string, unknown>;
}

/**
 * 代币余额信息接口
 */
export interface TokenBalanceInfo {
  contractAddress: string;
  tokenId?: string;
  symbol: string;
  name: string;
  decimals: number;
  balance: string;
  formatted: string;
  standard: TokenStandard;
  usdValue?: string;
  usdPrice?: string;
  logoURI?: string;
  metadata?: Record<string, any>;
  extra?: Record<string, unknown>;
}

/**
 * 交易输入接口
 * 构建交易所需的输入参数
 */
export interface TransactionInput {
  from: string;
  to: string;
  value: string;
  nonce?: number;
  gasLimit?: string;
  gasPrice?: string;
  maxFeePerGas?: string;
  maxPriorityFeePerGas?: string;
  feeLevel?: FeeLevel;
  data?: string;
  memo?: string;
  tokenContract?: string;
  tokenId?: string;
  tokenAmount?: string;
  type?: TransactionType;
  extra?: Record<string, any>;
}

/**
 * 交易输出接口
 * 构建完成的交易对象
 */
export interface TransactionOutput {
  chainKey: string;
  chainType: ChainType;
  rawTransaction: any;
  serializedTransaction: string;
  transactionHash: string;
  from: string;
  to: string;
  value: string;
  gasLimit?: string;
  gasPrice?: string;
  maxFeePerGas?: string;
  maxPriorityFeePerGas?: string;
  nonce?: number;
  data?: string;
  fee?: string;
  feeFormatted?: string;
  size?: number;
  extra?: Record<string, any>;
}

/**
 * 费用估算接口
 */
export interface FeeEstimate {
  chainKey: string;
  chainType: ChainType;
  feeLevel: FeeLevel;
  gasLimit?: string;
  gasPrice?: string;
  maxFeePerGas?: string;
  maxPriorityFeePerGas?: string;
  fee: string;
  feeFormatted: string;
  feeUsd?: string;
  estimatedTime: number;
  isEIP1559?: boolean;
  feePerByte?: number;
  extra?: Record<string, any>;
}

/**
 * 交易详情接口
 */
export interface TransactionDetail {
  chainKey: string;
  chainType: ChainType;
  hash: string;
  from: string;
  to: string;
  value: string;
  valueFormatted: string;
  nonce?: number;
  gasLimit?: string;
  gasPrice?: string;
  gasUsed?: string;
  fee?: string;
  feeFormatted?: string;
  blockNumber?: number;
  blockHash?: string;
  timestamp?: number;
  confirmations?: number;
  status: TransactionStatus;
  type: TransactionType;
  input?: string;
  tokenTransfers?: TokenTransferInfo[];
  errorMessage?: string;
  extra?: Record<string, any>;
}

/**
 * 代币转账信息接口
 */
export interface TokenTransferInfo {
  contractAddress: string;
  tokenId?: string;
  from: string;
  to: string;
  amount: string;
  symbol: string;
  decimals: number;
  standard: TokenStandard;
}

/**
 * Gas 价格信息接口
 */
export interface GasPriceInfo {
  chainKey: string;
  chainType: ChainType;
  baseFee?: string;
  slow: {
    gasPrice: string;
    maxFeePerGas?: string;
    maxPriorityFeePerGas?: string;
    estimatedTime: number;
  };
  normal: {
    gasPrice: string;
    maxFeePerGas?: string;
    maxPriorityFeePerGas?: string;
    estimatedTime: number;
  };
  fast: {
    gasPrice: string;
    maxFeePerGas?: string;
    maxPriorityFeePerGas?: string;
    estimatedTime: number;
  };
  isEIP1559: boolean;
  updatedAt: string;
}

/**
 * 地址验证结果接口
 */
export interface AddressValidationResult {
  isValid: boolean;
  address: string;
  normalizedAddress?: string;
  addressType?: AddressType;
  errorMessage?: string;
  extra?: Record<string, any>;
}

/**
 * 区块信息接口
 */
export interface BlockInfo {
  chainKey: string;
  chainType: ChainType;
  blockNumber: number;
  blockHash: string;
  timestamp: number;
  gasLimit?: string;
  gasUsed?: string;
  baseFee?: string;
  transactions?: number;
  extra?: Record<string, any>;
}

/**
 * 签名结果接口
 */
export interface SignResult {
  signature: string;
  signedTransaction: string;
  transactionHash: string;
  publicKey?: string;
  extra?: Record<string, any>;
}

/**
 * 广播结果接口
 */
export interface BroadcastResult {
  success: boolean;
  transactionHash: string;
  errorMessage?: string;
  extra?: Record<string, any>;
}

// ============================================================================
// 签名器接口
// ============================================================================

/**
 * 签名器接口
 * 定义签名操作的标准接口，支持多种签名方式
 */
export interface Signer {
  sign(message: string | Uint8Array): Promise<string>;
  signTransaction(transaction: TransactionOutput): Promise<SignResult>;
  signTypedData(data: any): Promise<string>;
  getAddress(): string;
  getPublicKey?(): string;
  getChainType?(): ChainType;
}

// ============================================================================
// ChainAdapter 基础接口
// ============================================================================

/**
 * ChainAdapter 基础接口
 * 所有链适配器必须实现此接口
 *
 * 方法分类：
 *  - 地址相关：validateAddress
 *  - 余额相关：getNativeBalance, getTokenBalance
 *  - 交易构建：buildTransfer, buildTokenTransfer
 *  - 费用估算：estimateFee
 *  - 交易签名：signTransaction
 *  - 交易广播：broadcastTransaction
 *  - 交易查询：getTransactionStatus
 *  - 链状态：getGasPrice, getNonce, getBlockNumber
 */
export interface ChainAdapter {
  // -------------------------------------------------------------------------
  // 基础信息
  // -------------------------------------------------------------------------

  /**
   * 获取链类型
   */
  getChainType(): ChainType;

  /**
   * 获取链信息
   */
  getChainInfo(chainKey?: string): ChainInfo;

  /**
   * 获取所有支持的链
   */
  getSupportedChains(): string[];

  /**
   * 设置当前链
   */
  setChain(chainKey: string): void;

  /**
   * 获取当前链
   */
  getCurrentChain(): string;

  // -------------------------------------------------------------------------
  // 地址验证
  // -------------------------------------------------------------------------

  /**
   * 验证地址格式是否正确
   * @param address 待验证的地址
   * @param chainKey 可选的链标识，用于指定验证规则
   */
  validateAddress(address: string, chainKey?: string): Promise<AddressValidationResult>;

  // -------------------------------------------------------------------------
  // 余额查询
  // -------------------------------------------------------------------------

  /**
   * 获取原生代币余额
   * @param address 钱包地址
   * @param chainKey 可选的链标识
   */
  getNativeBalance(address: string, chainKey?: string): Promise<BalanceInfo>;

  /**
   * 获取代币余额
   * @param address 钱包地址
   * @param tokenContract 代币合约地址
   * @param chainKey 可选的链标识
   * @param tokenId 可选的代币ID（用于NFT等）
   */
  getTokenBalance(
    address: string,
    tokenContract: string,
    chainKey?: string,
    tokenId?: string,
  ): Promise<TokenBalanceInfo>;

  // -------------------------------------------------------------------------
  // 交易构建
  // -------------------------------------------------------------------------

  /**
   * 构建原生代币转账交易
   * @param input 交易输入参数
   * @param chainKey 可选的链标识
   */
  buildTransfer(input: TransactionInput, chainKey?: string): Promise<TransactionOutput>;

  /**
   * 构建代币转账交易
   * @param input 交易输入参数
   * @param tokenContract 代币合约地址
   * @param chainKey 可选的链标识
   * @param tokenId 可选的代币ID（用于NFT等）
   */
  buildTokenTransfer(
    input: TransactionInput,
    tokenContract: string,
    chainKey?: string,
    tokenId?: string,
  ): Promise<TransactionOutput>;

  // -------------------------------------------------------------------------
  // 费用估算
  // -------------------------------------------------------------------------

  /**
   * 估算交易费用
   * @param input 交易输入参数
   * @param feeLevel 费用等级
   * @param chainKey 可选的链标识
   */
  estimateFee(
    input: TransactionInput,
    feeLevel?: FeeLevel,
    chainKey?: string,
  ): Promise<FeeEstimate>;

  /**
   * 获取当前 Gas 价格
   * @param chainKey 可选的链标识
   */
  getGasPrice(chainKey?: string): Promise<GasPriceInfo>;

  // -------------------------------------------------------------------------
  // 交易签名
  // -------------------------------------------------------------------------

  /**
   * 签名交易
   * @param transaction 待签名的交易
   * @param signer 签名器实例
   * @param chainKey 可选的链标识
   */
  signTransaction(
    transaction: TransactionOutput,
    signer: Signer,
    chainKey?: string,
  ): Promise<SignResult>;

  // -------------------------------------------------------------------------
  // 交易广播
  // -------------------------------------------------------------------------

  /**
   * 广播已签名的交易
   * @param signedTransaction 已签名的交易数据
   * @param chainKey 可选的链标识
   */
  broadcastTransaction(
    signedTransaction: string,
    chainKey?: string,
  ): Promise<BroadcastResult>;

  // -------------------------------------------------------------------------
  // 交易查询
  // -------------------------------------------------------------------------

  /**
   * 获取交易状态
   * @param transactionHash 交易哈希
   * @param chainKey 可选的链标识
   */
  getTransactionStatus(
    transactionHash: string,
    chainKey?: string,
  ): Promise<TransactionDetail>;

  // -------------------------------------------------------------------------
  // 链状态查询
  // -------------------------------------------------------------------------

  /**
   * 获取账户 Nonce
   * @param address 钱包地址
   * @param chainKey 可选的链标识
   */
  getNonce(address: string, chainKey?: string): Promise<number>;

  /**
   * 获取当前区块号
   * @param chainKey 可选的链标识
   */
  getBlockNumber(chainKey?: string): Promise<number>;

  /**
   * 获取区块信息
   * @param blockNumber 区块号
   * @param chainKey 可选的链标识
   */
  getBlockInfo(blockNumber: number, chainKey?: string): Promise<BlockInfo>;

  // -------------------------------------------------------------------------
  // RPC 相关
  // -------------------------------------------------------------------------

  /**
   * 发起 RPC 请求
   * @param method RPC 方法名
   * @param params 请求参数
   * @param chainKey 可选的链标识
   */
  request(method: string, params?: any[], chainKey?: string): Promise<any>;

  /**
   * 切换 RPC 节点
   * @param chainKey 可选的链标识
   */
  switchRpc(chainKey?: string): string;

  /**
   * 清除缓存
   */
  clearCache(): void;

  /**
   * 获取缓存大小
   */
  getCacheSize(): number;
}

// ============================================================================
// 适配器配置接口
// ============================================================================

/**
 * 适配器配置接口
 */
export interface AdapterConfig {
  rpcUrls?: string[];
  apiKey?: string;
  timeoutMs?: number;
  cacheTTL?: number;
  fallbackToDemo?: boolean;
  fetchImpl?: typeof fetch;
  extra?: Record<string, any>;
}

/**
 * 适配器构造函数接口
 */
export interface ChainAdapterConstructor {
  new (config?: AdapterConfig): ChainAdapter;
}

// ============================================================================
// 工具类型定义
// ============================================================================

/**
 * 可取消的操作结果
 */
export interface CancellableResult<T> {
  promise: Promise<T>;
  cancel: () => void;
}

/**
 * 分页参数
 */
export interface PaginationParams {
  page?: number;
  pageSize?: number;
  offset?: number;
  limit?: number;
}

/**
 * 分页结果
 */
export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

/**
 * 健康检查结果
 */
export interface HealthCheckResult {
  chainKey: string;
  reachable: boolean;
  healthy: boolean;
  latency?: number;
  blockNumber?: number;
  errorMessage?: string;
}

// ============================================================================
// 事件类型定义
// ============================================================================

/**
 * 适配器事件类型
 */
export type AdapterEventType =
  | 'chainChanged'
  | 'rpcSwitched'
  | 'cacheCleared'
  | 'transactionSent'
  | 'transactionConfirmed'
  | 'error';

/**
 * 适配器事件回调
 */
export type AdapterEventListener = (event: AdapterEventType, data?: any) => void;

// ============================================================================
// 类型守卫
// ============================================================================

/**
 * 判断是否为有效的 ChainType
 */
export function isValidChainType(value: any): value is ChainType {
  return Object.values(ChainType).includes(value);
}

/**
 * 判断是否为有效的 TransactionStatus
 */
export function isValidTransactionStatus(value: any): value is TransactionStatus {
  return Object.values(TransactionStatus).includes(value);
}

/**
 * 判断是否为有效的 TokenStandard
 */
export function isValidTokenStandard(value: any): value is TokenStandard {
  return Object.values(TokenStandard).includes(value);
}

/**
 * 判断是否为有效的 FeeLevel
 */
export function isValidFeeLevel(value: any): value is FeeLevel {
  return Object.values(FeeLevel).includes(value);
}

// ============================================================================
// 默认导出
// ============================================================================

export default {
  ChainType,
  TransactionStatus,
  TokenStandard,
  TransactionType,
  FeeLevel,
  AddressType,
};
