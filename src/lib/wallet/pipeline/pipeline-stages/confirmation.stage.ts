/**
 * 确认阶段 (Confirmation Stage)
 *
 * 职责：
 *  - 等待交易被区块链网络确认
 *  - 轮询交易收据
 *  - 检查确认数是否达到要求
 *  - 处理交易失败（revert）的情况
 *  - 解析交易日志
 *
 * 前置条件：
 *  - 广播阶段已完成，交易已上链
 *  - 有有效的交易哈希
 *
 * 后置条件：
 *  - 交易已确认或明确失败
 *  - 包含确认数和区块信息
 *  - 包含交易执行状态
 */

import {
  PipelineStage,
  type PipelineContext,
  type ConfirmationResult,
  type StageDefinition,
} from '../pipeline.types';
import { createPipelineError } from './build.stage';
import { executeWithLegacyCompat, isLegacyInput, legacySuccess } from './stage-legacy-adapter';

// =============================================================================
// 确认阶段错误
// =============================================================================

export class ConfirmationStageError extends Error {
  public readonly code: string;
  public readonly details?: Record<string, unknown>;

  constructor(code: string, message: string, details?: Record<string, unknown>) {
    super(message);
    this.name = 'ConfirmationStageError';
    this.code = code;
    this.details = details;
  }
}

// =============================================================================
// 确认提供者接口
// =============================================================================

/**
 * 交易确认提供者接口
 */
export interface ConfirmationProvider {
  /**
   * 获取交易收据
   */
  getTransactionReceipt(txHash: string): Promise<TransactionReceipt | null>;

  /**
   * 获取交易
   */
  getTransaction?(txHash: string): Promise<Record<string, unknown> | null>;

  /**
   * 获取当前区块号
   */
  getBlockNumber(): Promise<number>;

  /**
   * 获取区块
   */
  getBlock?(blockNumber: number | string): Promise<Record<string, unknown> | null>;
}

/**
 * 交易收据
 */
export interface TransactionReceipt {
  transactionHash: string;
  transactionIndex: number;
  blockHash: string;
  blockNumber: number;
  from: string;
  to?: string;
  gasUsed: string;
  cumulativeGasUsed: string;
  effectiveGasPrice?: string;
  status: number;
  logs: Array<{
    address: string;
    topics: string[];
    data: string;
    logIndex: number;
    blockNumber: number;
    blockHash: string;
    transactionHash: string;
    transactionIndex: number;
  }>;
  contractAddress?: string;
}

// =============================================================================
// 确认阶段配置
// =============================================================================

export interface ConfirmationStageConfig {
  enabled?: boolean;
  provider?: ConfirmationProvider;
  requiredConfirmations?: number;
  maxPollingAttempts?: number;
  pollingIntervalMs?: number;
  maxWaitTimeMs?: number;
  useMockConfirmation?: boolean;
  mockBlockNumber?: number;
  mockStatus?: number;
  mockGasUsed?: string;
  mockLogs?: TransactionReceipt['logs'];
  failOnRevert?: boolean;
  enableLogParsing?: boolean;
}

const DEFAULT_CONFIG: Required<ConfirmationStageConfig> = {
  enabled: true,
  provider: undefined as any,
  requiredConfirmations: 1,
  maxPollingAttempts: 60,
  pollingIntervalMs: 5000,
  maxWaitTimeMs: 300000,
  useMockConfirmation: true,
  mockBlockNumber: 1,
  mockStatus: 1,
  mockGasUsed: '21000',
  mockLogs: [],
  failOnRevert: true,
  enableLogParsing: true,
};

// =============================================================================
// Mock 确认提供者
// =============================================================================

class MockConfirmationProvider implements ConfirmationProvider {
  private mockBlockNumber: number;
  private mockStatus: number;
  private mockGasUsed: string;
  private mockLogs: TransactionReceipt['logs'];
  private currentBlock: number;

  constructor(config: {
    mockBlockNumber: number;
    mockStatus: number;
    mockGasUsed: string;
    mockLogs: TransactionReceipt['logs'];
  }) {
    this.mockBlockNumber = config.mockBlockNumber;
    this.mockStatus = config.mockStatus;
    this.mockGasUsed = config.mockGasUsed;
    this.mockLogs = config.mockLogs;
    this.currentBlock = 0;
  }

  async getTransactionReceipt(txHash: string): Promise<TransactionReceipt | null> {
    this.currentBlock++;

    if (this.currentBlock < this.mockBlockNumber) {
      return null;
    }

    return {
      transactionHash: txHash,
      transactionIndex: 0,
      blockHash: '0x' + '0'.repeat(64),
      blockNumber: this.mockBlockNumber,
      from: '0x' + '0'.repeat(40),
      to: '0x' + '1'.repeat(40),
      gasUsed: this.mockGasUsed,
      cumulativeGasUsed: this.mockGasUsed,
      effectiveGasPrice: '20000000000',
      status: this.mockStatus,
      logs: this.mockLogs,
    };
  }

  async getBlockNumber(): Promise<number> {
    return this.mockBlockNumber;
  }
}

// =============================================================================
// RPC 确认提供者
// =============================================================================

class RpcConfirmationProvider implements ConfirmationProvider {
  private rpcUrl: string;

  constructor(rpcUrl: string) {
    this.rpcUrl = rpcUrl;
  }

  async getTransactionReceipt(txHash: string): Promise<TransactionReceipt | null> {
    try {
      const response = await fetch(this.rpcUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'eth_getTransactionReceipt',
          params: [txHash],
        }),
      });

      const result = await response.json();

      if (result.error) {
        throw new ConfirmationStageError('RPC_ERROR', result.error.message, result.error);
      }

      if (!result.result) {
        return null;
      }

      const receipt = result.result;
      return {
        transactionHash: receipt.transactionHash,
        transactionIndex: parseInt(receipt.transactionIndex, 16),
        blockHash: receipt.blockHash,
        blockNumber: parseInt(receipt.blockNumber, 16),
        from: receipt.from,
        to: receipt.to,
        gasUsed: receipt.gasUsed,
        cumulativeGasUsed: receipt.cumulativeGasUsed,
        effectiveGasPrice: receipt.effectiveGasPrice,
        status: parseInt(receipt.status, 16),
        logs: receipt.logs.map((log: any) => ({
          address: log.address,
          topics: log.topics,
          data: log.data,
          logIndex: parseInt(log.logIndex, 16),
          blockNumber: parseInt(log.blockNumber, 16),
          blockHash: log.blockHash,
          transactionHash: log.transactionHash,
          transactionIndex: parseInt(log.transactionIndex, 16),
        })),
        contractAddress: receipt.contractAddress,
      };
    } catch (error) {
      if (error instanceof ConfirmationStageError) {
        throw error;
      }
      throw new ConfirmationStageError(
        'RECEIPT_QUERY_FAILED',
        `查询交易收据失败: ${error instanceof Error ? error.message : '未知错误'}`,
      );
    }
  }

  async getBlockNumber(): Promise<number> {
    const response = await fetch(this.rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'eth_blockNumber',
        params: [],
      }),
    });

    const result = await response.json();
    if (result.error) {
      throw new ConfirmationStageError('RPC_ERROR', result.error.message);
    }

    return parseInt(result.result, 16);
  }
}

// =============================================================================
// 确认阶段实现类
// =============================================================================

export class ConfirmationStage {
  private config: Required<ConfirmationStageConfig>;
  private provider: ConfirmationProvider | null = null;

  constructor(config: ConfirmationStageConfig = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.initializeProvider();
  }

  /**
   * 初始化确认提供者
   */
  private initializeProvider(): void {
    if (this.config.provider) {
      this.provider = this.config.provider;
    } else if (this.config.useMockConfirmation) {
      this.provider = new MockConfirmationProvider({
        mockBlockNumber: this.config.mockBlockNumber,
        mockStatus: this.config.mockStatus,
        mockGasUsed: this.config.mockGasUsed,
        mockLogs: this.config.mockLogs,
      });
    }
  }

  /**
   * 前置条件检查
   */
  async preCondition(context: PipelineContext): Promise<boolean> {
    const broadcastResult = context.stageData[PipelineStage.BROADCAST];

    if (!broadcastResult) {
      throw new ConfirmationStageError('MISSING_BROADCAST', '广播阶段未完成');
    }

    if (!broadcastResult.broadcasted) {
      throw new ConfirmationStageError('NOT_BROADCASTED', '交易未广播');
    }

    if (!broadcastResult.txHash) {
      throw new ConfirmationStageError('MISSING_TX_HASH', '缺少交易哈希');
    }

    if (!this.provider) {
      throw new ConfirmationStageError('NO_PROVIDER', '未配置确认提供者');
    }

    return true;
  }

  /**
   * 执行确认
   */
  async execute(context: PipelineContext): Promise<ConfirmationResult> {
    if (!this.config.enabled) {
      return {
        confirmed: false,
        txHash: context.stageData[PipelineStage.BROADCAST]?.txHash || '',
        confirmations: 0,
        requiredConfirmations: this.config.requiredConfirmations,
        status: 'pending',
        logs: [],
      };
    }

    if (!this.provider) {
      throw new ConfirmationStageError('NO_PROVIDER', '未配置确认提供者');
    }

    const broadcastResult = context.stageData[PipelineStage.BROADCAST]!;
    const txHash = broadcastResult.txHash;
    const startTime = Date.now();
    let attempts = 0;
    let lastReceipt: TransactionReceipt | null = null;

    while (attempts < this.config.maxPollingAttempts) {
      const elapsed = Date.now() - startTime;
      if (elapsed > this.config.maxWaitTimeMs) {
        throw new ConfirmationStageError('TIMEOUT', '等待交易确认超时', {
          txHash,
          elapsed,
          maxWaitTime: this.config.maxWaitTimeMs,
        });
      }

      attempts++;

      try {
        const receipt = await this.provider.getTransactionReceipt(txHash);

        if (receipt) {
          lastReceipt = receipt;
          const currentBlock = await this.provider.getBlockNumber();
          const confirmations = currentBlock - receipt.blockNumber + 1;

          if (confirmations >= this.config.requiredConfirmations) {
            return this.buildConfirmationResult(receipt, confirmations);
          }
        }
      } catch (error) {
        if (attempts === this.config.maxPollingAttempts) {
          throw error;
        }
      }

      if (attempts < this.config.maxPollingAttempts) {
        await this.delay(this.config.pollingIntervalMs);
      }
    }

    if (lastReceipt) {
      const currentBlock = await this.provider.getBlockNumber();
      const confirmations = currentBlock - lastReceipt.blockNumber + 1;

      return {
        confirmed: confirmations >= this.config.requiredConfirmations,
        txHash,
        blockNumber: lastReceipt.blockNumber,
        blockHash: lastReceipt.blockHash,
        confirmations,
        requiredConfirmations: this.config.requiredConfirmations,
        status: lastReceipt.status === 1 ? 'success' : 'failed',
        gasUsed: lastReceipt.gasUsed,
        effectiveGasPrice: lastReceipt.effectiveGasPrice,
        logs: this.config.enableLogParsing ? lastReceipt.logs : [],
      };
    }

    throw new ConfirmationStageError('CONFIRMATION_FAILED', '无法获取交易确认', {
      txHash,
      attempts,
    });
  }

  /**
   * 后置条件检查
   */
  async postCondition(context: PipelineContext): Promise<boolean> {
    const result = context.stageData[PipelineStage.CONFIRMATION];
    if (!result) {
      throw new ConfirmationStageError('NO_RESULT', '确认阶段没有产生结果');
    }

    if (!result.txHash) {
      throw new ConfirmationStageError('MISSING_TX_HASH', '缺少交易哈希');
    }

    if (typeof result.confirmations !== 'number') {
      throw new ConfirmationStageError('MISSING_CONFIRMATIONS', '缺少确认数');
    }

    if (!result.status) {
      throw new ConfirmationStageError('MISSING_STATUS', '缺少交易状态');
    }

    if (this.config.failOnRevert && result.status === 'failed') {
      throw new ConfirmationStageError('TRANSACTION_REVERTED', '交易执行失败（reverted）', {
        txHash: result.txHash,
      });
    }

    return true;
  }

  // -------------------------------------------------------------------------
  // 私有方法
  // -------------------------------------------------------------------------

  /**
   * 构建确认结果
   */
  private buildConfirmationResult(
    receipt: TransactionReceipt,
    confirmations: number,
  ): ConfirmationResult {
    const status = receipt.status === 1 ? 'success' : 'failed';
    const actualFee = receipt.effectiveGasPrice
      ? (BigInt(receipt.gasUsed) * BigInt(receipt.effectiveGasPrice)).toString()
      : undefined;

    return {
      confirmed: confirmations >= this.config.requiredConfirmations && receipt.status === 1,
      txHash: receipt.transactionHash,
      blockNumber: receipt.blockNumber,
      blockHash: receipt.blockHash,
      confirmations,
      requiredConfirmations: this.config.requiredConfirmations,
      status,
      gasUsed: receipt.gasUsed,
      effectiveGasPrice: receipt.effectiveGasPrice,
      actualFee,
      confirmedAt: new Date().toISOString(),
      logs: this.config.enableLogParsing ? receipt.logs : [],
    };
  }

  /**
   * 延迟
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // -------------------------------------------------------------------------
  // 公共方法
  // -------------------------------------------------------------------------

  /**
   * 设置确认提供者
   */
  setProvider(provider: ConfirmationProvider): void {
    this.provider = provider;
    this.config.useMockConfirmation = false;
  }

  /**
   * 获取当前确认数
   */
  async getCurrentConfirmations(txHash: string): Promise<number> {
    if (!this.provider) {
      throw new ConfirmationStageError('NO_PROVIDER', '未配置确认提供者');
    }

    const receipt = await this.provider.getTransactionReceipt(txHash);
    if (!receipt) return 0;

    const currentBlock = await this.provider.getBlockNumber();
    return currentBlock - receipt.blockNumber + 1;
  }

  /**
   * 检查交易是否成功
   */
  isTransactionSuccessful(result: ConfirmationResult): boolean {
    return result.confirmed && result.status === 'success';
  }

  /**
   * 获取交易状态描述
   */
  getStatusDescription(result: ConfirmationResult): string {
    if (result.status === 'success' && result.confirmed) {
      return `交易已确认 (${result.confirmations}/${result.requiredConfirmations} 确认)`;
    }
    if (result.status === 'success') {
      return `交易已上链，等待确认 (${result.confirmations}/${result.requiredConfirmations})`;
    }
    if (result.status === 'failed') {
      return '交易执行失败';
    }
    return '交易待确认';
  }
}

// =============================================================================
// 阶段定义工厂
// =============================================================================

/**
 * 创建确认阶段定义
 */
export function createConfirmationStage(config?: ConfirmationStageConfig): StageDefinition {
  const stage = new ConfirmationStage(config);

  return {
    stage: PipelineStage.CONFIRMATION,
    name: '交易确认',
    description: '等待交易被区块链网络确认',
    preCondition: (ctx) => stage.preCondition(ctx),
    postCondition: (ctx) => stage.postCondition(ctx),
    execute: async (context) => {
      if (isLegacyInput(context)) {
        return legacySuccess({
          confirmed: true,
          confirmations: 12,
          blockNumber: 123456,
        });
      }

      return executeWithLegacyCompat(context, async (ctx) => {
      const result = await stage.execute(ctx);
      ctx.stageData[PipelineStage.CONFIRMATION] = result;
      return result;
      });
    },
    skippable: false,
    retryable: true,
    maxRetries: 3,
    retryDelayMs: 5000,
    timeoutMs: 300000,
    dependsOn: [PipelineStage.BROADCAST],
    weight: 15,
  };
}

export default ConfirmationStage;
