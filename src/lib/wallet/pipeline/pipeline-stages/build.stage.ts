/**
 * 交易构建阶段 (Build Stage)
 *
 * 职责：
 *  - 验证交易请求参数
 *  - 根据交易类型构建不同格式的交易
 *  - 自动补充缺失字段（nonce、gasLimit、gasPrice 等）
 *  - 支持 EIP-1559 和 Legacy 两种交易格式
 *  - 计算预估 gas 费用
 *
 * 前置条件：
 *  - 交易请求必须包含 from、type、chain 等必要字段
 *  - 链 ID 必须有效
 *
 * 后置条件：
 *  - 构建的交易必须包含完整的必填字段
 *  - gas 参数必须合理
 *  - nonce 必须正确
 */

import {
  PipelineStage,
  StageStatus,
  TransactionType,
  ChainType,
  type PipelineContext,
  type BuiltTransaction,
  type StageDefinition,
  type PipelineError,
} from '../pipeline.types';

// =============================================================================
// 常量定义
// =============================================================================

/** 默认 gas limit - 原生币转账 */
const DEFAULT_NATIVE_TRANSFER_GAS = '21000';
/** 默认 gas limit - ERC20 转账 */
const DEFAULT_ERC20_TRANSFER_GAS = '65000';
/** 默认 gas limit - 合约调用 */
const DEFAULT_CONTRACT_CALL_GAS = '100000';
/** 默认 gas limit - 合约部署 */
const DEFAULT_DEPLOY_CONTRACT_GAS = '1500000';

/** 各链默认 chainId */
const DEFAULT_CHAIN_IDS: Record<string, number> = {
  'ethereum': 1,
  'bsc': 56,
  'polygon': 137,
  'arbitrum': 42161,
  'optimism': 10,
  'avalanche': 43114,
};

// =============================================================================
// 构建阶段错误
// =============================================================================

export class BuildStageError extends Error {
  public readonly code: string;
  public readonly details?: Record<string, unknown>;

  constructor(code: string, message: string, details?: Record<string, unknown>) {
    super(message);
    this.name = 'BuildStageError';
    this.code = code;
    this.details = details;
  }
}

// =============================================================================
// 构建阶段配置
// =============================================================================

export interface BuildStageConfig {
  defaultChainId?: number;
  defaultGasLimit?: string;
  defaultGasPrice?: string;
  defaultMaxPriorityFeePerGas?: string;
  gasBufferMultiplier?: number;
  nonceOffset?: number;
  enforceEip1559?: boolean;
}

const DEFAULT_CONFIG: Required<BuildStageConfig> = {
  defaultChainId: 1,
  defaultGasLimit: DEFAULT_CONTRACT_CALL_GAS,
  defaultGasPrice: '20000000000',
  defaultMaxPriorityFeePerGas: '1500000000',
  gasBufferMultiplier: 1.2,
  nonceOffset: 0,
  enforceEip1559: false,
};

// =============================================================================
// 构建阶段实现类
// =============================================================================

export class BuildStage {
  private config: Required<BuildStageConfig>;

  constructor(config: BuildStageConfig = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * 前置条件检查
   * 验证交易请求的基本完整性
   */
  async preCondition(context: PipelineContext): Promise<boolean> {
    const { request } = context;

    if (!request.id) {
      throw new BuildStageError('MISSING_ID', '交易请求缺少 ID');
    }
    if (!request.type) {
      throw new BuildStageError('MISSING_TYPE', '交易请求缺少类型');
    }
    if (!request.chain) {
      throw new BuildStageError('MISSING_CHAIN', '交易请求缺少链类型');
    }
    if (!request.from) {
      throw new BuildStageError('MISSING_FROM', '交易请求缺少发送方地址');
    }

    const validTypes = Object.values(TransactionType);
    if (!validTypes.includes(request.type)) {
      throw new BuildStageError('INVALID_TYPE', `不支持的交易类型: ${request.type}`);
    }

    const validChains: ChainType[] = ['evm', 'solana', 'bitcoin', 'tron', 'cosmos'];
    if (!validChains.includes(request.chain)) {
      throw new BuildStageError('INVALID_CHAIN', `不支持的链类型: ${request.chain}`);
    }

    if (request.chain === 'evm' && !request.chainId) {
      throw new BuildStageError('MISSING_CHAIN_ID', 'EVM 链交易必须指定 chainId');
    }

    return true;
  }

  /**
   * 执行交易构建
   */
  async execute(context: PipelineContext): Promise<BuiltTransaction> {
    const { request } = context;

    const chainId = this.resolveChainId(request);
    const txType = this.determineTransactionType(request);
    const nonce = await this.resolveNonce(request);
    const gasLimit = this.resolveGasLimit(request);
    const gasParams = this.resolveGasParams(request, txType);
    const value = this.resolveValue(request);
    const to = this.resolveTo(request);
    const data = this.resolveData(request);

    const estimatedFee = this.estimateFee(gasLimit, gasParams);

    const rawTx: Record<string, unknown> = {
      from: request.from,
      to,
      value,
      data,
      nonce,
      gasLimit,
      chainId,
      type: txType,
      ...gasParams,
    };

    const builtTx: BuiltTransaction = {
      raw: rawTx,
      from: request.from,
      to,
      value,
      data,
      nonce,
      gasLimit,
      chainId,
      type: txType,
      estimatedGas: gasLimit,
      estimatedFee,
      builtAt: new Date().toISOString(),
      ...gasParams,
    };

    return builtTx;
  }

  /**
   * 后置条件检查
   * 验证构建结果的完整性
   */
  async postCondition(context: PipelineContext): Promise<boolean> {
    const result = context.stageData[PipelineStage.BUILD];
    if (!result) {
      throw new BuildStageError('NO_RESULT', '构建阶段没有产生结果');
    }

    if (!result.from) {
      throw new BuildStageError('MISSING_FROM', '构建结果缺少 from 字段');
    }
    if (!result.nonce && result.nonce !== 0) {
      throw new BuildStageError('MISSING_NONCE', '构建结果缺少 nonce 字段');
    }
    if (!result.gasLimit) {
      throw new BuildStageError('MISSING_GAS_LIMIT', '构建结果缺少 gasLimit 字段');
    }
    if (!result.chainId) {
      throw new BuildStageError('MISSING_CHAIN_ID', '构建结果缺少 chainId 字段');
    }

    if (result.type === 2) {
      if (!result.maxFeePerGas) {
        throw new BuildStageError('MISSING_MAX_FEE', 'EIP-1559 交易缺少 maxFeePerGas');
      }
      if (!result.maxPriorityFeePerGas) {
        throw new BuildStageError('MISSING_PRIORITY_FEE', 'EIP-1559 交易缺少 maxPriorityFeePerGas');
      }
    } else if (result.type === 0) {
      if (!result.gasPrice) {
        throw new BuildStageError('MISSING_GAS_PRICE', 'Legacy 交易缺少 gasPrice');
      }
    }

    return true;
  }

  // -------------------------------------------------------------------------
  // 私有方法 - 参数解析
  // -------------------------------------------------------------------------

  /**
   * 解析 chainId
   */
  private resolveChainId(request: PipelineContext['request']): number {
    if (request.chainId) return request.chainId;

    const chainName = request.chain.toLowerCase();
    if (DEFAULT_CHAIN_IDS[chainName]) {
      return DEFAULT_CHAIN_IDS[chainName];
    }

    return this.config.defaultChainId;
  }

  /**
   * 确定交易类型（EIP-1559 或 Legacy）
   */
  private determineTransactionType(request: PipelineContext['request']): number {
    if (this.config.enforceEip1559) return 2;

    if (request.maxFeePerGas || request.maxPriorityFeePerGas) {
      return 2;
    }

    if (request.gasPrice) {
      return 0;
    }

    return 2;
  }

  /**
   * 解析 nonce
   */
  private async resolveNonce(request: PipelineContext['request']): Promise<number> {
    if (request.nonce !== undefined && request.nonce !== null) {
      return request.nonce + this.config.nonceOffset;
    }

    return 0;
  }

  /**
   * 解析 gas limit
   */
  private resolveGasLimit(request: PipelineContext['request']): string {
    if (request.gasLimit) {
      return request.gasLimit;
    }

    let baseGas = this.config.defaultGasLimit;

    switch (request.type) {
      case TransactionType.NATIVE_TRANSFER:
        baseGas = DEFAULT_NATIVE_TRANSFER_GAS;
        break;
      case TransactionType.TOKEN_TRANSFER:
      case TransactionType.APPROVE:
        baseGas = DEFAULT_ERC20_TRANSFER_GAS;
        break;
      case TransactionType.CONTRACT_CALL:
      case TransactionType.SWAP:
      case TransactionType.STAKE:
      case TransactionType.UNSTAKE:
      case TransactionType.BRIDGE:
        baseGas = DEFAULT_CONTRACT_CALL_GAS;
        break;
      case TransactionType.DEPLOY_CONTRACT:
        baseGas = DEFAULT_DEPLOY_CONTRACT_GAS;
        break;
      default:
        baseGas = DEFAULT_CONTRACT_CALL_GAS;
    }

    const bufferedGas = BigInt(baseGas) * BigInt(Math.floor(this.config.gasBufferMultiplier * 100)) / 100n;
    return bufferedGas.toString();
  }

  /**
   * 解析 gas 参数
   */
  private resolveGasParams(
    request: PipelineContext['request'],
    txType: number,
  ): Record<string, string> {
    if (txType === 2) {
      const maxPriorityFeePerGas =
        request.maxPriorityFeePerGas || this.config.defaultMaxPriorityFeePerGas;
      const baseFee = request.maxFeePerGas
        ? BigInt(request.maxFeePerGas) - BigInt(maxPriorityFeePerGas)
        : BigInt(this.config.defaultGasPrice);
      const maxFeePerGas =
        request.maxFeePerGas || (baseFee + BigInt(maxPriorityFeePerGas)).toString();

      return {
        maxFeePerGas,
        maxPriorityFeePerGas,
      };
    }

    return {
      gasPrice: request.gasPrice || this.config.defaultGasPrice,
    };
  }

  /**
   * 解析交易 value
   */
  private resolveValue(request: PipelineContext['request']): string {
    if (request.value) return request.value;

    if (request.type === TransactionType.NATIVE_TRANSFER) {
      if (!request.tokenAmount) {
        throw new BuildStageError('MISSING_VALUE', '原生币转账必须指定 value 或 tokenAmount');
      }
      return request.tokenAmount;
    }

    return '0';
  }

  /**
   * 解析 to 地址
   */
  private resolveTo(request: PipelineContext['request']): string | undefined {
    if (request.to) return request.to;

    switch (request.type) {
      case TransactionType.TOKEN_TRANSFER:
      case TransactionType.APPROVE:
        return request.tokenAddress;
      case TransactionType.CONTRACT_CALL:
      case TransactionType.SWAP:
      case TransactionType.STAKE:
      case TransactionType.UNSTAKE:
        return request.contractAddress;
      case TransactionType.DEPLOY_CONTRACT:
        return undefined;
      default:
        return undefined;
    }
  }

  /**
   * 解析 data
   */
  private resolveData(request: PipelineContext['request']): string | undefined {
    if (request.data) return request.data;

    if (request.type === TransactionType.NATIVE_TRANSFER) {
      return undefined;
    }

    return '0x';
  }

  /**
   * 预估费用
   */
  private estimateFee(
    gasLimit: string,
    gasParams: Record<string, string>,
  ): string {
    const gas = BigInt(gasLimit);
    let gasPrice: bigint;

    if (gasParams.maxFeePerGas) {
      gasPrice = BigInt(gasParams.maxFeePerGas);
    } else if (gasParams.gasPrice) {
      gasPrice = BigInt(gasParams.gasPrice);
    } else {
      gasPrice = BigInt(this.config.defaultGasPrice);
    }

    return (gas * gasPrice).toString();
  }
}

// =============================================================================
// 阶段定义工厂
// =============================================================================

/**
 * 创建构建阶段定义
 */
export function createBuildStage(config?: BuildStageConfig): StageDefinition {
  const stage = new BuildStage(config);

  return {
    stage: PipelineStage.BUILD,
    name: '交易构建',
    description: '验证交易参数并构建完整的交易对象',
    preCondition: (ctx) => stage.preCondition(ctx),
    postCondition: (ctx) => stage.postCondition(ctx),
    execute: async (context) => {
      const result = await stage.execute(context);
      context.stageData[PipelineStage.BUILD] = result;
      return result;
    },
    skippable: false,
    retryable: true,
    maxRetries: 3,
    retryDelayMs: 1000,
    dependsOn: [],
    weight: 10,
  };
}

/**
 * 创建流水线错误对象
 */
export function createPipelineError(
  code: string,
  message: string,
  stage?: PipelineStage,
  details?: Record<string, unknown>,
  recoverable = true,
): PipelineError {
  return {
    code,
    message,
    stage,
    details,
    timestamp: new Date().toISOString(),
    recoverable,
    stack: new Error(message).stack,
  };
}

export default BuildStage;
