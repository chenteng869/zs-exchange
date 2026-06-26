/**
 * 签名确认接口定义
 *
 * 定义签名确认 UI 交互层的接口和类型
 *
 * 支持：
 *  - 消息签名（personal_sign / eth_sign）
 *  - TypedData 签名（EIP-712）
 *  - 交易签名（eth_signTransaction）
 *  - 授权确认（approve / permit）
 */

import type { SignRequest, TransactionRequest, DAppInfo, Address } from '../sdk.types';

// ============================================================================
// 确认结果类型
// ============================================================================

/** 确认结果 */
export type ConfirmResult = 'approved' | 'rejected' | 'expired';

/** 签名确认结果 */
export interface SignConfirmResult {
  /** 结果 */
  result: ConfirmResult;
  /** 签名数据（批准时） */
  signature?: string;
  /** 拒绝原因 */
  reason?: string;
  /** 确认时间 */
  confirmedAt?: number;
}

/** 交易确认结果 */
export interface TransactionConfirmResult {
  /** 结果 */
  result: ConfirmResult;
  /** 交易哈希（批准并广播后） */
  txHash?: string;
  /** 拒绝原因 */
  reason?: string;
  /** 确认时间 */
  confirmedAt?: number;
  /** Gas 参数调整 */
  gasAdjustments?: {
    gasLimit?: string;
    gasPrice?: string;
    maxFeePerGas?: string;
    maxPriorityFeePerGas?: string;
    nonce?: number;
  };
}

// ============================================================================
// 确认弹窗配置
// ============================================================================

/** 确认弹窗配置 */
export interface ConfirmDialogConfig {
  /** 是否显示取消按钮 */
  showCancel?: boolean;
  /** 确认按钮文本 */
  confirmText?: string;
  /** 取消按钮文本 */
  cancelText?: string;
  /** 标题 */
  title?: string;
  /** 描述 */
  description?: string;
  /** 过期时间（毫秒） */
  expiryTime?: number;
  /** 是否显示详细信息 */
  showDetails?: boolean;
  /** 是否显示风险提示 */
  showRiskWarning?: boolean;
  /** 是否允许调整 Gas */
  allowGasAdjustment?: boolean;
}

// ============================================================================
// 签名确认处理器接口
// ============================================================================

/**
 * 签名确认处理器接口
 *
 * 实现此接口以提供自定义的签名确认 UI
 */
export interface ISignConfirmHandler {
  /**
   * 处理签名确认请求
   * @param request 签名请求
   * @returns 确认结果
   */
  handleSignConfirm(request: SignRequest): Promise<SignConfirmResult>;

  /**
   * 处理交易确认请求
   * @param request 交易请求
   * @returns 确认结果
   */
  handleTransactionConfirm(request: TransactionRequest): Promise<TransactionConfirmResult>;

  /**
   * 取消进行中的确认
   * @param requestId 请求 ID
   */
  cancelConfirm(requestId: string): void;

  /**
   * 检查是否有待处理的确认
   */
  hasPendingConfirm(): boolean;
}

// ============================================================================
// 风险评估类型
// ============================================================================

/** 风险等级 */
export type RiskLevel = 'safe' | 'warning' | 'danger';

/** 风险项 */
export interface RiskItem {
  /** 风险代码 */
  code: string;
  /** 风险描述 */
  message: string;
  /** 风险等级 */
  level: RiskLevel;
  /** 风险详情 */
  details?: string;
}

/** 风险评估结果 */
export interface RiskAssessment {
  /** 整体风险等级 */
  level: RiskLevel;
  /** 风险项列表 */
  items: RiskItem[];
  /** 风险分数（0-100） */
  score: number;
}

// ============================================================================
// 交易解析类型
// ============================================================================

/** 交易动作类型 */
export type TransactionAction =
  | 'transfer'
  | 'approve'
  | 'swap'
  | 'stake'
  | 'unstake'
  | 'claim'
  | 'deploy'
  | 'call'
  | 'unknown';

/** 解析后的交易详情 */
export interface ParsedTransactionDetail {
  /** 交易动作 */
  action: TransactionAction;
  /** 方法名 */
  methodName?: string;
  /** 函数签名 */
  functionSignature?: string;
  /** 合约地址 */
  contractAddress?: Address;
  /** 合约名称 */
  contractName?: string;
  /** 代币信息 */
  tokenInfo?: {
    name: string;
    symbol: string;
    decimals: number;
    address: Address;
  };
  /** 接收方 */
  recipient?: Address;
  /** 金额（格式化后） */
  formattedAmount?: string;
  /** 美元价值 */
  usdValue?: string;
  /** 交易摘要 */
  summary: string;
  /** 解析后的参数 */
  parameters?: Record<string, any>;
}

// ============================================================================
// TypedData 显示类型
// ============================================================================

/** TypedData 显示字段 */
export interface TypedDataField {
  /** 字段名 */
  name: string;
  /** 字段类型 */
  type: string;
  /** 字段值 */
  value: any;
  /** 是否为敏感字段 */
  sensitive?: boolean;
}

/** TypedData 显示结构 */
export interface TypedDataDisplay {
  /** 域名 */
  domain: {
    name?: string;
    version?: string;
    chainId?: string;
    verifyingContract?: string;
  };
  /** 主类型 */
  primaryType: string;
  /** 消息字段 */
  fields: TypedDataField[];
  /** 是否可以安全显示 */
  safeToDisplay: boolean;
}

// ============================================================================
// 确认状态
// ============================================================================

/** 确认状态 */
export type ConfirmStatus =
  | 'pending'
  | 'displaying'
  | 'confirming'
  | 'approved'
  | 'rejected'
  | 'expired'
  | 'cancelled';

/** 确认请求状态 */
export interface ConfirmRequestState {
  /** 请求 ID */
  requestId: string;
  /** 请求类型 */
  type: 'sign' | 'transaction';
  /** 状态 */
  status: ConfirmStatus;
  /** 创建时间 */
  createdAt: number;
  /** 过期时间 */
  expiresAt?: number;
  /** DApp 信息 */
  dappInfo?: DAppInfo;
}

// ============================================================================
// 兼容别名
// ============================================================================

export type ConfirmationType = 'sign' | 'transaction' | 'switchChain' | 'addChain' | 'permission' | 'watchAsset';
export type ConfirmationResult = ConfirmResult;
export type ConfirmationStatus = ConfirmStatus;

export interface ConfirmationRequest {
  type: ConfirmationType;
  origin: string;
  chainId: number;
  address: Address;
  [key: string]: unknown;
}

export interface SignConfirmationRequest extends ConfirmationRequest {
  type: 'sign';
  signRequest: SignRequest;
}

export interface TransactionConfirmationRequest extends ConfirmationRequest {
  type: 'transaction';
  transaction: TransactionRequest;
}

export interface SwitchChainConfirmationRequest extends ConfirmationRequest {
  type: 'switchChain';
  chain: unknown;
}

export interface AddChainConfirmationRequest extends ConfirmationRequest {
  type: 'addChain';
  chain: unknown;
}

export interface PermissionConfirmationRequest extends ConfirmationRequest {
  type: 'permission';
  permissions: unknown;
}

export interface WatchAssetConfirmationRequest extends ConfirmationRequest {
  type: 'watchAsset';
  asset: unknown;
}

export interface SignConfirmOptions {
  maxPendingRequests?: number;
  defaultExpiryMs?: number;
  showRiskWarnings?: boolean;
  enableAutoApprove?: boolean;
}
