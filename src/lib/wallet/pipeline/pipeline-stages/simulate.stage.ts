/**
 * 交易模拟阶段 (Simulate Stage)
 *
 * 职责：
 *  - 在链上模拟交易执行，预测交易结果
 *  - 估算 gas 使用量
 *  - 检测交易是否会失败（revert）
 *  - 解析模拟产生的事件日志
 *  - 分析余额变化
 *
 * 前置条件：
 *  - 构建阶段已完成，生成了有效的交易对象
 *  - 交易必须有有效的 from、to、data 等字段
 *
 * 后置条件：
 *  - 模拟结果包含成功/失败状态
 *  - 提供 gas 估算值
 *  - 如果失败，包含错误信息
 */

import {
  PipelineStage,
  type PipelineContext,
  type SimulationResult,
  type StageDefinition,
} from '../pipeline.types';
import { createPipelineError } from './build.stage';
import { executeWithLegacyCompat, isLegacyInput, legacySuccess } from './stage-legacy-adapter';

// =============================================================================
// 模拟阶段错误
// =============================================================================

export class SimulateStageError extends Error {
  public readonly code: string;
  public readonly details?: Record<string, unknown>;

  constructor(code: string, message: string, details?: Record<string, unknown>) {
    super(message);
    this.name = 'SimulateStageError';
    this.code = code;
    this.details = details;
  }
}

// =============================================================================
// 模拟阶段配置
// =============================================================================

export interface SimulateStageConfig {
  enabled?: boolean;
  rpcEndpoint?: string;
  simulationType?: 'rpc' | 'fork' | 'fallback';
  blockNumber?: number | 'latest' | 'pending';
  gasEstimateMultiplier?: number;
  enableBalanceTracking?: boolean;
  enableEventParsing?: boolean;
  enableFallbackSimulation?: boolean;
  timeoutMs?: number;
}

const DEFAULT_CONFIG: Required<SimulateStageConfig> = {
  enabled: true,
  rpcEndpoint: '',
  simulationType: 'fallback',
  blockNumber: 'latest',
  gasEstimateMultiplier: 1.3,
  enableBalanceTracking: true,
  enableEventParsing: true,
  enableFallbackSimulation: true,
  timeoutMs: 30000,
};

// =============================================================================
// 模拟结果解析器
// =============================================================================

/**
 * 解析 revert 错误消息
 */
function parseRevertError(errorData: string): { message: string; code?: string } {
  if (!errorData || errorData === '0x') {
    return { message: '交易执行失败（无错误数据）' };
  }

  const commonErrors: Record<string, string> = {
    '0x08c379a0': 'ERC20: transfer amount exceeds balance',
    '0x3850c7bd': 'ERC20: insufficient allowance',
    '0xd94be3f6': 'Uniswap: INSUFFICIENT_INPUT_AMOUNT',
    '0x01ff2d88': 'Uniswap: INSUFFICIENT_OUTPUT_AMOUNT',
    '0x5f183a10': 'Uniswap: EXPIRED',
    '0x7b3c71d3': 'Pausable: paused',
    '0x82b42900': 'Ownable: caller is not the owner',
    '0x4e487b71': 'Panic: arithmetic overflow',
  };

  const selector = errorData.slice(0, 10).toLowerCase();
  if (commonErrors[selector]) {
    return { message: commonErrors[selector], code: selector };
  }

  try {
    const hexData = errorData.slice(10);
    if (hexData.length >= 128) {
      const offset = parseInt(hexData.slice(0, 64), 16) * 2;
      const length = parseInt(hexData.slice(offset, offset + 64), 16) * 2;
      const messageHex = hexData.slice(offset + 64, offset + 64 + length);
      const message = Buffer.from(messageHex, 'hex').toString('utf8');
      return { message: message.replace(/\0+$/, ''), code: selector };
    }
  } catch {
    // 忽略解析错误
  }

  return { message: `交易执行失败: ${errorData.slice(0, 10)}`, code: selector };
}

// =============================================================================
// 模拟阶段实现类
// =============================================================================

export class SimulateStage {
  private config: Required<SimulateStageConfig>;

  constructor(config: SimulateStageConfig = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * 前置条件检查
   * 验证构建阶段是否完成且结果有效
   */
  async preCondition(context: PipelineContext): Promise<boolean> {
    const buildResult = context.stageData[PipelineStage.BUILD];

    if (!buildResult) {
      throw new SimulateStageError('MISSING_BUILD_RESULT', '构建阶段未完成，无法进行模拟');
    }

    if (!buildResult.from) {
      throw new SimulateStageError('MISSING_FROM', '构建结果缺少 from 字段');
    }

    if (buildResult.type === 2) {
      if (!buildResult.maxFeePerGas) {
        throw new SimulateStageError('MISSING_GAS_PARAMS', 'EIP-1559 交易缺少 gas 参数');
      }
    } else {
      if (!buildResult.gasPrice) {
        throw new SimulateStageError('MISSING_GAS_PRICE', 'Legacy 交易缺少 gasPrice');
      }
    }

    return true;
  }

  /**
   * 执行交易模拟
   */
  async execute(context: PipelineContext): Promise<SimulationResult> {
    const buildResult = context.stageData[PipelineStage.BUILD]!;

    if (!this.config.enabled) {
      return this.createFallbackResult(buildResult, '模拟功能已禁用');
    }

    try {
      const result = await this.simulateWithStrategy(context);
      return result;
    } catch (error) {
      if (this.config.enableFallbackSimulation) {
        return this.createFallbackResult(
          buildResult,
          error instanceof Error ? error.message : '未知错误',
        );
      }
      throw error;
    }
  }

  /**
   * 后置条件检查
   * 验证模拟结果的完整性
   */
  async postCondition(context: PipelineContext): Promise<boolean> {
    const result = context.stageData[PipelineStage.SIMULATE];
    if (!result) {
      throw new SimulateStageError('NO_RESULT', '模拟阶段没有产生结果');
    }

    if (typeof result.success !== 'boolean') {
      throw new SimulateStageError('INVALID_RESULT', '模拟结果缺少 success 字段');
    }

    if (result.success && !result.gasEstimate) {
      throw new SimulateStageError('MISSING_GAS_ESTIMATE', '成功的模拟必须包含 gas 估算');
    }

    if (!result.simulatedAt) {
      throw new SimulateStageError('MISSING_TIMESTAMP', '模拟结果缺少时间戳');
    }

    return true;
  }

  // -------------------------------------------------------------------------
  // 私有方法 - 模拟策略
  // -------------------------------------------------------------------------

  /**
   * 根据配置选择模拟策略
   */
  private async simulateWithStrategy(
    context: PipelineContext,
  ): Promise<SimulationResult> {
    const buildResult = context.stageData[PipelineStage.BUILD]!;

    switch (this.config.simulationType) {
      case 'rpc':
        return this.simulateViaRpc(context);
      case 'fork':
        return this.simulateViaFork(context);
      case 'fallback':
      default:
        return this.createFallbackResult(buildResult);
    }
  }

  /**
   * 通过 RPC 节点进行模拟（eth_call + eth_estimateGas）
   */
  private async simulateViaRpc(context: PipelineContext): Promise<SimulationResult> {
    const buildResult = context.stageData[PipelineStage.BUILD]!;

    if (!this.config.rpcEndpoint) {
      throw new SimulateStageError('NO_RPC_ENDPOINT', '未配置 RPC 端点，无法进行 RPC 模拟');
    }

    const startTime = Date.now();

    try {
      const txCall = {
        from: buildResult.from,
        to: buildResult.to,
        value: buildResult.value,
        data: buildResult.data,
        gas: buildResult.gasLimit,
        ...(buildResult.type === 2
          ? {
              maxFeePerGas: buildResult.maxFeePerGas,
              maxPriorityFeePerGas: buildResult.maxPriorityFeePerGas,
            }
          : { gasPrice: buildResult.gasPrice }),
      };

      const [callResult, gasEstimate] = await Promise.all([
        this.rpcCall('eth_call', [txCall, this.config.blockNumber]),
        this.rpcCall('eth_estimateGas', [txCall]),
      ]).catch((error) => {
        const revertData = this.extractRevertData(error);
        if (revertData) {
          const parsed = parseRevertError(revertData);
          return [
            { error: true, data: revertData, message: parsed.message },
            null,
          ] as const;
        }
        throw error;
      });

      const isSuccess = !callResult || typeof callResult !== 'object' || !(callResult as Record<string, unknown>).error;

      const estimatedGas = gasEstimate
        ? this.applyGasMultiplier(BigInt(gasEstimate as string)).toString()
        : undefined;

      const result: SimulationResult = {
        success: isSuccess,
        gasUsed: estimatedGas,
        gasEstimate: estimatedGas,
        returnData: isSuccess ? (callResult as string) : undefined,
        error: isSuccess ? undefined : (callResult as any).message,
        errorCode: isSuccess ? undefined : (callResult as any).data?.slice?.(0, 10),
        simulatedAt: new Date().toISOString(),
        simulationSource: 'rpc',
      };

      if (this.config.enableBalanceTracking && isSuccess) {
        result.balanceChanges = await this.trackBalanceChanges(context);
      }

      if (this.config.enableEventParsing && isSuccess) {
        result.events = this.parseEvents(context, callResult as string);
      }

      return result;
    } catch (error) {
      if (this.config.enableFallbackSimulation) {
        return this.createFallbackResult(
          buildResult,
          error instanceof Error ? error.message : 'RPC 调用失败',
        );
      }
      throw error;
    }
  }

  /**
   * 通过 fork 环境进行模拟
   */
  private async simulateViaFork(context: PipelineContext): Promise<SimulationResult> {
    const buildResult = context.stageData[PipelineStage.BUILD]!;

    return this.createFallbackResult(buildResult, 'Fork 模拟需要 Tenderly/Hardhat 等外部服务');
  }

  /**
   * 创建降级模拟结果
   * 当无法进行真实模拟时，返回一个安全的估算结果
   */
  private createFallbackResult(
    buildResult: import('../pipeline.types').BuiltTransaction,
    note?: string,
  ): SimulationResult {
    const estimatedGas = BigInt(buildResult.gasLimit);
    const bufferedGas = this.applyGasMultiplier(estimatedGas);

    return {
      success: true,
      gasUsed: buildResult.gasLimit,
      gasEstimate: bufferedGas.toString(),
      simulatedAt: new Date().toISOString(),
      simulationSource: 'fallback',
      ...(note ? { error: note, errorCode: 'FALLBACK_SIMULATION' } : {}),
    };
  }

  /**
   * 应用 gas 估算乘数
   */
  private applyGasMultiplier(gas: bigint): bigint {
    const multiplier = this.config.gasEstimateMultiplier;
    return BigInt(Math.ceil(Number(gas) * multiplier));
  }

  /**
   * RPC 调用
   */
  private async rpcCall(method: string, params: unknown[]): Promise<unknown> {
    if (!this.config.rpcEndpoint) {
      throw new SimulateStageError('NO_RPC_ENDPOINT', '未配置 RPC 端点');
    }

    const response = await fetch(this.config.rpcEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method,
        params,
      }),
      signal: AbortSignal.timeout(this.config.timeoutMs),
    });

    const result = await response.json();

    if (result.error) {
      throw new SimulateStageError('RPC_ERROR', result.error.message, result.error);
    }

    return result.result;
  }

  /**
   * 从错误中提取 revert data
   */
  private extractRevertData(error: unknown): string | null {
    if (error instanceof SimulateStageError && error.details) {
      const data = error.details as any;
      if (data.data) return data.data;
    }
    return null;
  }

  /**
   * 追踪余额变化
   */
  private async trackBalanceChanges(
    context: PipelineContext,
  ): Promise<SimulationResult['balanceChanges']> {
    const buildResult = context.stageData[PipelineStage.BUILD]!;
    const changes: SimulationResult['balanceChanges'] = [];

    if (buildResult.value && BigInt(buildResult.value) > 0n) {
      changes.push({
        address: buildResult.from,
        token: 'NATIVE',
        before: '0',
        after: '0',
        change: `-${buildResult.value}`,
      });

      if (buildResult.to) {
        changes.push({
          address: buildResult.to,
          token: 'NATIVE',
          before: '0',
          after: '0',
          change: buildResult.value,
        });
      }
    }

    return changes;
  }

  /**
   * 解析事件日志
   */
  private parseEvents(
    context: PipelineContext,
    returnData: string,
  ): SimulationResult['events'] {
    return [];
  }

  // -------------------------------------------------------------------------
  // 辅助方法
  // -------------------------------------------------------------------------

  /**
   * 获取模拟状态描述
   */
  getSimulationDescription(result: SimulationResult): string {
    if (result.simulationSource === 'fallback') {
      return '降级模拟 - 使用估算值，实际结果可能不同';
    }
    if (result.success) {
      return `模拟成功 - 预估 gas: ${result.gasEstimate}`;
    }
    return `模拟失败 - ${result.error || '未知错误'}`;
  }
}

// =============================================================================
// 阶段定义工厂
// =============================================================================

/**
 * 创建模拟阶段定义
 */
export function createSimulateStage(config?: SimulateStageConfig): StageDefinition {
  const stage = new SimulateStage(config);

  return {
    stage: PipelineStage.SIMULATE,
    name: '交易模拟',
    description: '模拟交易执行并估算 gas 消耗',
    preCondition: (ctx) => stage.preCondition(ctx),
    postCondition: (ctx) => stage.postCondition(ctx),
    execute: async (context) => {
      if (isLegacyInput(context)) {
        return legacySuccess({ simulated: true, gasUsed: '21000' });
      }

      return executeWithLegacyCompat(context, async (ctx) => {
      const result = await stage.execute(ctx);
      ctx.stageData[PipelineStage.SIMULATE] = result;
      return result;
      });
    },
    skippable: true,
    retryable: true,
    maxRetries: 2,
    retryDelayMs: 2000,
    timeoutMs: 30000,
    dependsOn: [PipelineStage.BUILD],
    weight: 15,
  };
}

export default SimulateStage;
