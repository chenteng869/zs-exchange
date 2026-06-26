/**
 * 余额检查阶段 (Balance Check Stage)
 *
 * 职责：
 *  - 检查原生币余额是否足够支付 gas + 转账金额
 *  - 检查代币余额是否足够
 *  - 计算预估 gas 费用
 *  - 计算总花费
 *  - 支持多代币余额检查
 *
 * 前置条件：
 *  - 构建阶段已完成
 *  - 风控检查已完成（可选）
 *
 * 后置条件：
 *  - 余额是否充足的明确判断
 *  - 详细的余额和费用明细
 */

import {
  PipelineStage,
  TransactionType,
  type PipelineContext,
  type BalanceCheckResult,
  type StageDefinition,
} from '../pipeline.types';
import { createPipelineError } from './build.stage';

// =============================================================================
// 余额检查阶段错误
// =============================================================================

export class BalanceCheckStageError extends Error {
  public readonly code: string;
  public readonly details?: Record<string, unknown>;

  constructor(code: string, message: string, details?: Record<string, unknown>) {
    super(message);
    this.name = 'BalanceCheckStageError';
    this.code = code;
    this.details = details;
  }
}

// =============================================================================
// 余额提供者接口
// =============================================================================

/**
 * 余额提供者接口
 * 可接入实际的链上查询或 mock 数据
 */
export interface BalanceProvider {
  /**
   * 获取原生币余额
   */
  getNativeBalance(address: string, chainId: number): Promise<string>;

  /**
   * 获取代币余额
   */
  getTokenBalance(address: string, tokenAddress: string, chainId: number): Promise<string>;

  /**
   * 批量获取余额
   */
  getBalances?(
    address: string,
    tokens: Array<{ address: string; isNative: boolean }>,
    chainId: number,
  ): Promise<Array<{ address: string; balance: string; isNative: boolean }>>;
}

// =============================================================================
// 余额检查阶段配置
// =============================================================================

export interface BalanceCheckStageConfig {
  enabled?: boolean;
  balanceProvider?: BalanceProvider;
  useMockData?: boolean;
  mockNativeBalance?: string;
  mockTokenBalance?: string;
  safetyBuffer?: string;
  gasPriceMultiplier?: number;
  enableApprovalCheck?: boolean;
  allowanceAddress?: string;
  failOnInsufficient?: boolean;
}

const DEFAULT_CONFIG: Required<BalanceCheckStageConfig> = {
  enabled: true,
  balanceProvider: undefined as any,
  useMockData: true,
  mockNativeBalance: '10000000000000000000',
  mockTokenBalance: '1000000000000000000000',
  safetyBuffer: '1000000000000000',
  gasPriceMultiplier: 1.0,
  enableApprovalCheck: true,
  allowanceAddress: '',
  failOnInsufficient: true,
};

// =============================================================================
// Mock 余额提供者
// =============================================================================

class MockBalanceProvider implements BalanceProvider {
  private nativeBalance: string;
  private tokenBalance: string;

  constructor(nativeBalance: string, tokenBalance: string) {
    this.nativeBalance = nativeBalance;
    this.tokenBalance = tokenBalance;
  }

  async getNativeBalance(address: string, chainId: number): Promise<string> {
    return this.nativeBalance;
  }

  async getTokenBalance(address: string, tokenAddress: string, chainId: number): Promise<string> {
    return this.tokenBalance;
  }
}

// =============================================================================
// 余额检查阶段实现类
// =============================================================================

export class BalanceCheckStage {
  private config: Required<BalanceCheckStageConfig>;
  private balanceProvider: BalanceProvider;

  constructor(config: BalanceCheckStageConfig = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };

    if (this.config.balanceProvider) {
      this.balanceProvider = this.config.balanceProvider;
    } else if (this.config.useMockData) {
      this.balanceProvider = new MockBalanceProvider(
        this.config.mockNativeBalance,
        this.config.mockTokenBalance,
      );
    } else {
      throw new BalanceCheckStageError('NO_PROVIDER', '未配置余额提供者');
    }
  }

  /**
   * 前置条件检查
   */
  async preCondition(context: PipelineContext): Promise<boolean> {
    const buildResult = context.stageData[PipelineStage.BUILD];

    if (!buildResult) {
      throw new BalanceCheckStageError('MISSING_BUILD_RESULT', '构建阶段未完成，无法进行余额检查');
    }

    if (!buildResult.from) {
      throw new Buffer('缺少发送方地址');
    }

    if (!buildResult.gasLimit) {
      throw new BalanceCheckStageError('MISSING_GAS_LIMIT', '缺少 gas limit');
    }

    return true;
  }

  /**
   * 执行余额检查
   */
  async execute(context: PipelineContext): Promise<BalanceCheckResult> {
    if (!this.config.enabled) {
      return {
        sufficient: true,
        nativeBalance: '0',
        nativeRequired: '0',
        gasCostEstimate: '0',
        totalCostEstimate: '0',
        checkedAt: new Date().toISOString(),
      };
    }

    const buildResult = context.stageData[PipelineStage.BUILD]!;
    const request = context.request;

    const nativeBalance = await this.getNativeBalance(buildResult.from, buildResult.chainId);
    const gasCostEstimate = this.calculateGasCost(buildResult);
    const nativeTransferAmount = this.getNativeTransferAmount(context);
    const nativeRequired = BigInt(gasCostEstimate) + BigInt(nativeTransferAmount);
    const nativeShortfall = this.calculateShortfall(nativeBalance, nativeRequired.toString());

    let tokenBalance: string | undefined;
    let tokenRequired: string | undefined;
    let tokenShortfall: string | undefined;

    if (this.needsTokenCheck(context)) {
      tokenBalance = await this.getTokenBalance(
        buildResult.from,
        request.tokenAddress!,
        buildResult.chainId,
      );
      tokenRequired = request.tokenAmount || '0';
      tokenShortfall = this.calculateShortfall(tokenBalance, tokenRequired);
    }

    const totalCostEstimate = (
      BigInt(nativeRequired) +
      (tokenRequired ? BigInt(tokenRequired) : 0n)
    ).toString();

    const sufficient =
      BigInt(nativeBalance) >= BigInt(nativeRequired) &&
      (!tokenRequired || !tokenShortfall || BigInt(tokenShortfall) <= 0n);

    const result: BalanceCheckResult = {
      sufficient,
      nativeBalance,
      nativeRequired: nativeRequired.toString(),
      nativeShortfall: nativeShortfall && BigInt(nativeShortfall) > 0n ? nativeShortfall : undefined,
      tokenBalance,
      tokenRequired,
      tokenShortfall: tokenShortfall && BigInt(tokenShortfall) > 0n ? tokenShortfall : undefined,
      gasCostEstimate,
      totalCostEstimate,
      checkedAt: new Date().toISOString(),
    };

    if (!sufficient && this.config.failOnInsufficient) {
      throw new BalanceCheckStageError('INSUFFICIENT_BALANCE', '余额不足', {
        nativeBalance,
        nativeRequired: nativeRequired.toString(),
        tokenBalance,
        tokenRequired,
      });
    }

    return result;
  }

  /**
   * 后置条件检查
   */
  async postCondition(context: PipelineContext): Promise<boolean> {
    const result = context.stageData[PipelineStage.BALANCE_CHECK];
    if (!result) {
      throw new BalanceCheckStageError('NO_RESULT', '余额检查阶段没有产生结果');
    }

    if (typeof result.sufficient !== 'boolean') {
      throw new BalanceCheckStageError('INVALID_RESULT', '余额检查结果缺少 sufficient 字段');
    }

    if (!result.nativeBalance) {
      throw new BalanceCheckStageError('MISSING_NATIVE_BALANCE', '缺少原生币余额');
    }

    if (!result.nativeRequired) {
      throw new BalanceCheckStageError('MISSING_NATIVE_REQUIRED', '缺少原生币需求');
    }

    if (!result.gasCostEstimate) {
      throw new BalanceCheckStageError('MISSING_GAS_COST', '缺少 gas 费用估算');
    }

    if (!result.checkedAt) {
      throw new BalanceCheckStageError('MISSING_TIMESTAMP', '缺少检查时间戳');
    }

    return true;
  }

  // -------------------------------------------------------------------------
  // 私有方法 - 余额获取
  // -------------------------------------------------------------------------

  /**
   * 获取原生币余额
   */
  private async getNativeBalance(address: string, chainId: number): Promise<string> {
    try {
      const balance = await this.balanceProvider.getNativeBalance(address, chainId);
      return balance;
    } catch (error) {
      if (this.config.useMockData) {
        return this.config.mockNativeBalance;
      }
      throw new BalanceCheckStageError(
        'BALANCE_QUERY_FAILED',
        `原生币余额查询失败: ${error instanceof Error ? error.message : '未知错误'}`,
      );
    }
  }

  /**
   * 获取代币余额
   */
  private async getTokenBalance(
    address: string,
    tokenAddress: string,
    chainId: number,
  ): Promise<string> {
    try {
      const balance = await this.balanceProvider.getTokenBalance(address, tokenAddress, chainId);
      return balance;
    } catch (error) {
      if (this.config.useMockData) {
        return this.config.mockTokenBalance;
      }
      throw new BalanceCheckStageError(
        'TOKEN_BALANCE_QUERY_FAILED',
        `代币余额查询失败: ${error instanceof Error ? error.message : '未知错误'}`,
      );
    }
  }

  // -------------------------------------------------------------------------
  // 私有方法 - 费用计算
  // -------------------------------------------------------------------------

  /**
   * 计算 gas 费用
   */
  private calculateGasCost(buildResult: import('../pipeline.types').BuiltTransaction): string {
    const gasLimit = BigInt(buildResult.gasLimit);
    let gasPrice: bigint;

    if (buildResult.type === 2 && buildResult.maxFeePerGas) {
      gasPrice = BigInt(buildResult.maxFeePerGas);
    } else if (buildResult.gasPrice) {
      gasPrice = BigInt(buildResult.gasPrice);
    } else {
      gasPrice = 20000000000n;
    }

    const adjustedGasPrice = BigInt(
      Math.ceil(Number(gasPrice) * this.config.gasPriceMultiplier),
    );

    return (gasLimit * adjustedGasPrice).toString();
  }

  /**
   * 获取原生币转账金额
   */
  private getNativeTransferAmount(context: PipelineContext): string {
    const buildResult = context.stageData[PipelineStage.BUILD]!;
    const request = context.request;

    if (request.type === TransactionType.NATIVE_TRANSFER) {
      return request.value || request.tokenAmount || '0';
    }

    return buildResult.value || '0';
  }

  /**
   * 判断是否需要检查代币余额
   */
  private needsTokenCheck(context: PipelineContext): boolean {
    const request = context.request;

    const tokenTypes = [
      TransactionType.TOKEN_TRANSFER,
      TransactionType.SWAP,
      TransactionType.STAKE,
      TransactionType.UNSTAKE,
      TransactionType.APPROVE,
    ];

    return tokenTypes.includes(request.type) && !!request.tokenAddress;
  }

  /**
   * 计算差额
   */
  private calculateShortfall(balance: string, required: string): string | undefined {
    const bal = BigInt(balance);
    const req = BigInt(required);

    if (bal >= req) {
      return undefined;
    }

    return (req - bal).toString();
  }

  // -------------------------------------------------------------------------
  // 公共方法
  // -------------------------------------------------------------------------

  /**
   * 设置余额提供者
   */
  setBalanceProvider(provider: BalanceProvider): void {
    this.balanceProvider = provider;
    this.config.useMockData = false;
  }

  /**
   * 格式化余额显示
   */
  formatBalance(balance: string, decimals: number = 18): string {
    const bal = BigInt(balance);
    const divisor = 10n ** BigInt(decimals);
    const whole = bal / divisor;
    const fraction = bal % divisor;

    if (fraction === 0n) {
      return whole.toString();
    }

    const fractionStr = fraction.toString().padStart(decimals, '0').replace(/0+$/, '');
    return `${whole.toString()}.${fractionStr}`;
  }

  /**
   * 获取可读的余额不足消息
   */
  getInsufficientMessage(result: BalanceCheckResult): string {
    const messages: string[] = [];

    if (result.nativeShortfall) {
      messages.push(`原生币不足，缺少 ${result.nativeShortfall} wei`);
    }

    if (result.tokenShortfall) {
      messages.push(`代币余额不足，缺少 ${result.tokenShortfall}`);
    }

    return messages.length > 0 ? messages.join('；') : '余额不足';
  }
}

// =============================================================================
// 阶段定义工厂
// =============================================================================

/**
 * 创建余额检查阶段定义
 */
export function createBalanceCheckStage(config?: BalanceCheckStageConfig): StageDefinition {
  const stage = new BalanceCheckStage(config);

  return {
    stage: PipelineStage.BALANCE_CHECK,
    name: '余额检查',
    description: '检查账户余额是否足够支付交易费用和金额',
    preCondition: (ctx) => stage.preCondition(ctx),
    postCondition: (ctx) => stage.postCondition(ctx),
    execute: async (context) => {
      const result = await stage.execute(context);
      context.stageData[PipelineStage.BALANCE_CHECK] = result;
      return result;
    },
    skippable: true,
    retryable: true,
    maxRetries: 3,
    retryDelayMs: 2000,
    dependsOn: [PipelineStage.BUILD],
    weight: 10,
  };
}

export default BalanceCheckStage;
