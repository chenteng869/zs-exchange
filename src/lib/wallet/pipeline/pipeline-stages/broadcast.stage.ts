/**
 * 广播阶段 (Broadcast Stage)
 *
 * 职责：
 *  - 将签名后的交易广播到区块链网络
 *  - 支持多节点广播提高成功率
 *  - 广播失败重试机制
 *  - 处理 nonce 过低/过高的情况
 *  - 记录广播状态和交易哈希
 *
 * 前置条件：
 *  - 签名阶段已完成，生成了有效的签名交易
 *
 * 后置条件：
 *  - 交易已成功广播到至少一个节点
 *  - 返回有效的交易哈希
 */

import {
  PipelineStage,
  type PipelineContext,
  type BroadcastResult,
  type StageDefinition,
} from '../pipeline.types';
import { createPipelineError } from './build.stage';

// =============================================================================
// 广播阶段错误
// =============================================================================

export class BroadcastStageError extends Error {
  public readonly code: string;
  public readonly details?: Record<string, unknown>;

  constructor(code: string, message: string, details?: Record<string, unknown>) {
    super(message);
    this.name = 'BroadcastStageError';
    this.code = code;
    this.details = details;
  }
}

// =============================================================================
// 广播提供者接口
// =============================================================================

/**
 * 广播提供者接口
 */
export interface BroadcastProvider {
  /**
   * 广播原始交易
   */
  broadcastRawTransaction(rawTx: string): Promise<{ txHash: string; nodeUrl?: string }>;

  /**
   * 获取节点 URL
   */
  getNodeUrl(): string;

  /**
   * 检查节点是否健康
   */
  isHealthy?(): Promise<boolean>;
}

// =============================================================================
// 广播阶段配置
// =============================================================================

export interface BroadcastStageConfig {
  enabled?: boolean;
  providers?: BroadcastProvider[];
  rpcEndpoints?: string[];
  useMockBroadcast?: boolean;
  mockTxHash?: string;
  maxRetries?: number;
  retryDelayMs?: number;
  broadcastToMultipleNodes?: boolean;
  minSuccessfulBroadcasts?: number;
  enableNonceManagement?: boolean;
  replaceByFee?: boolean;
  timeoutMs?: number;
}

const DEFAULT_CONFIG: Required<BroadcastStageConfig> = {
  enabled: true,
  providers: [],
  rpcEndpoints: [],
  useMockBroadcast: true,
  mockTxHash: '',
  maxRetries: 3,
  retryDelayMs: 2000,
  broadcastToMultipleNodes: false,
  minSuccessfulBroadcasts: 1,
  enableNonceManagement: true,
  replaceByFee: false,
  timeoutMs: 30000,
};

// =============================================================================
// Mock 广播提供者
// =============================================================================

class MockBroadcastProvider implements BroadcastProvider {
  private mockTxHash: string;
  private nodeUrl: string;

  constructor(mockTxHash: string, nodeUrl: string = 'mock://localhost') {
    this.mockTxHash = mockTxHash;
    this.nodeUrl = nodeUrl;
  }

  async broadcastRawTransaction(rawTx: string): Promise<{ txHash: string; nodeUrl?: string }> {
    const txHash = this.mockTxHash || this.generateMockHash(rawTx);
    return {
      txHash,
      nodeUrl: this.nodeUrl,
    };
  }

  getNodeUrl(): string {
    return this.nodeUrl;
  }

  async isHealthy(): Promise<boolean> {
    return true;
  }

  private generateMockHash(data: string): string {
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return '0x' + Math.abs(hash).toString(16).padStart(64, '0');
  }
}

// =============================================================================
// RPC 广播提供者
// =============================================================================

class RpcBroadcastProvider implements BroadcastProvider {
  private rpcUrl: string;

  constructor(rpcUrl: string) {
    this.rpcUrl = rpcUrl;
  }

  async broadcastRawTransaction(rawTx: string): Promise<{ txHash: string; nodeUrl?: string }> {
    try {
      const response = await fetch(this.rpcUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'eth_sendRawTransaction',
          params: [rawTx],
        }),
      });

      const result = await response.json();

      if (result.error) {
        throw new BroadcastStageError('RPC_ERROR', result.error.message, result.error);
      }

      return {
        txHash: result.result,
        nodeUrl: this.rpcUrl,
      };
    } catch (error) {
      if (error instanceof BroadcastStageError) {
        throw error;
      }
      throw new BroadcastStageError(
        'BROADCAST_FAILED',
        `广播失败: ${error instanceof Error ? error.message : '未知错误'}`,
      );
    }
  }

  getNodeUrl(): string {
    return this.rpcUrl;
  }

  async isHealthy(): Promise<boolean> {
    try {
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
      return !result.error;
    } catch {
      return false;
    }
  }
}

// =============================================================================
// 广播阶段实现类
// =============================================================================

export class BroadcastStage {
  private config: Required<BroadcastStageConfig>;
  private providers: BroadcastProvider[] = [];

  constructor(config: BroadcastStageConfig = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.initializeProviders();
  }

  /**
   * 初始化广播提供者
   */
  private initializeProviders(): void {
    if (this.config.providers.length > 0) {
      this.providers = this.config.providers;
    } else if (this.config.rpcEndpoints.length > 0) {
      this.providers = this.config.rpcEndpoints.map((url) => new RpcBroadcastProvider(url));
    } else if (this.config.useMockBroadcast) {
      this.providers = [new MockBroadcastProvider(this.config.mockTxHash)];
    }
  }

  /**
   * 前置条件检查
   */
  async preCondition(context: PipelineContext): Promise<boolean> {
    const signatureResult = context.stageData[PipelineStage.SIGNATURE];

    if (!signatureResult) {
      throw new BroadcastStageError('MISSING_SIGNATURE', '签名阶段未完成，无法广播');
    }

    if (!signatureResult.signed) {
      throw new BroadcastStageError('NOT_SIGNED', '交易未签名');
    }

    if (!signatureResult.rawTransaction) {
      throw new BroadcastStageError('MISSING_RAW_TX', '缺少原始签名交易');
    }

    if (this.providers.length === 0) {
      throw new BroadcastStageError('NO_PROVIDERS', '没有可用的广播节点');
    }

    return true;
  }

  /**
   * 执行广播
   */
  async execute(context: PipelineContext): Promise<BroadcastResult> {
    if (!this.config.enabled) {
      return {
        broadcasted: false,
        txHash: '',
        nonce: 0,
        broadcastedAt: new Date().toISOString(),
        retries: 0,
      };
    }

    const signatureResult = context.stageData[PipelineStage.SIGNATURE]!;
    const buildResult = context.stageData[PipelineStage.BUILD]!;
    const rawTx = signatureResult.rawTransaction!;

    let lastError: Error | null = null;
    let successfulBroadcasts = 0;
    let txHash = '';
    let nodeUrl = '';
    let retries = 0;

    const healthyProviders = await this.getHealthyProviders();

    if (healthyProviders.length === 0) {
      throw new BroadcastStageError('NO_HEALTHY_NODES', '没有健康的广播节点');
    }

    for (let attempt = 0; attempt <= this.config.maxRetries; attempt++) {
      if (attempt > 0) {
        retries = attempt;
        await this.delay(this.config.retryDelayMs * attempt);
      }

      if (this.config.broadcastToMultipleNodes) {
        const results = await this.broadcastToMultipleNodes(rawTx, healthyProviders);
        successfulBroadcasts = results.successful;
        if (results.txHash) {
          txHash = results.txHash;
          nodeUrl = results.nodeUrl || '';
        }

        if (successfulBroadcasts >= this.config.minSuccessfulBroadcasts) {
          break;
        }
      } else {
        for (const provider of healthyProviders) {
          try {
            const result = await provider.broadcastRawTransaction(rawTx);
            txHash = result.txHash;
            nodeUrl = result.nodeUrl || provider.getNodeUrl();
            successfulBroadcasts = 1;
            break;
          } catch (error) {
            lastError = error instanceof Error ? error : new Error(String(error));
          }
        }

        if (successfulBroadcasts > 0) {
          break;
        }
      }
    }

    if (successfulBroadcasts === 0) {
      throw new BroadcastStageError(
        'ALL_BROADCASTS_FAILED',
        `所有节点广播失败: ${lastError?.message || '未知错误'}`,
        { retries, providers: this.providers.length },
      );
    }

    return {
      broadcasted: true,
      txHash,
      nodeUrl,
      nonce: buildResult.nonce,
      broadcastedAt: new Date().toISOString(),
      networkConfirmations: 0,
      retries,
    };
  }

  /**
   * 后置条件检查
   */
  async postCondition(context: PipelineContext): Promise<boolean> {
    const result = context.stageData[PipelineStage.BROADCAST];
    if (!result) {
      throw new BroadcastStageError('NO_RESULT', '广播阶段没有产生结果');
    }

    if (!result.broadcasted) {
      throw new BroadcastStageError('NOT_BROADCASTED', '交易未广播');
    }

    if (!result.txHash) {
      throw new BroadcastStageError('MISSING_TX_HASH', '缺少交易哈希');
    }

    if (!result.broadcastedAt) {
      throw new BroadcastStageError('MISSING_TIMESTAMP', '缺少广播时间');
    }

    return true;
  }

  // -------------------------------------------------------------------------
  // 私有方法 - 多节点广播
  // -------------------------------------------------------------------------

  /**
   * 获取健康的提供者
   */
  private async getHealthyProviders(): Promise<BroadcastProvider[]> {
    const healthy: BroadcastProvider[] = [];

    for (const provider of this.providers) {
      try {
        if (provider.isHealthy) {
          const isHealthy = await provider.isHealthy();
          if (isHealthy) {
            healthy.push(provider);
          }
        } else {
          healthy.push(provider);
        }
      } catch {
        // 跳过不健康的节点
      }
    }

    return healthy.length > 0 ? healthy : this.providers;
  }

  /**
   * 广播到多个节点
   */
  private async broadcastToMultipleNodes(
    rawTx: string,
    providers: BroadcastProvider[],
  ): Promise<{ successful: number; txHash?: string; nodeUrl?: string }> {
    const promises = providers.map((provider) =>
      provider
        .broadcastRawTransaction(rawTx)
        .then((result) => ({ success: true, result, provider }))
        .catch((error) => ({ success: false, error, provider })),
    );

    const results = await Promise.allSettled(promises);

    let successful = 0;
    let txHash: string | undefined;
    let nodeUrl: string | undefined;

    for (const result of results) {
      if (result.status === 'fulfilled' && result.value.success) {
        successful++;
        if (!txHash) {
          const v = result.value as { success: boolean; result: { txHash: string; nodeUrl?: string }; provider: unknown };
          txHash = v.result.txHash;
          nodeUrl = v.result.nodeUrl;
        }
      }
    }

    return { successful, txHash, nodeUrl };
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
   * 添加广播提供者
   */
  addProvider(provider: BroadcastProvider): void {
    this.providers.push(provider);
  }

  /**
   * 移除广播提供者
   */
  removeProvider(nodeUrl: string): boolean {
    const index = this.providers.findIndex((p) => p.getNodeUrl() === nodeUrl);
    if (index !== -1) {
      this.providers.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * 获取所有提供者
   */
  getProviders(): BroadcastProvider[] {
    return [...this.providers];
  }

  /**
   * 检查所有提供者的健康状态
   */
  async checkAllHealth(): Promise<Array<{ url: string; healthy: boolean }>> {
    const results: Array<{ url: string; healthy: boolean }> = [];

    for (const provider of this.providers) {
      const url = provider.getNodeUrl();
      let healthy = true;
      if (provider.isHealthy) {
        try {
          healthy = await provider.isHealthy();
        } catch {
          healthy = false;
        }
      }
      results.push({ url, healthy });
    }

    return results;
  }
}

// =============================================================================
// 阶段定义工厂
// =============================================================================

/**
 * 创建广播阶段定义
 */
export function createBroadcastStage(config?: BroadcastStageConfig): StageDefinition {
  const stage = new BroadcastStage(config);

  return {
    stage: PipelineStage.BROADCAST,
    name: '交易广播',
    description: '将签名后的交易广播到区块链网络',
    preCondition: (ctx) => stage.preCondition(ctx),
    postCondition: (ctx) => stage.postCondition(ctx),
    execute: async (context) => {
      const result = await stage.execute(context);
      context.stageData[PipelineStage.BROADCAST] = result;
      return result;
    },
    skippable: false,
    retryable: true,
    maxRetries: 3,
    retryDelayMs: 2000,
    timeoutMs: 30000,
    dependsOn: [PipelineStage.SIGNATURE],
    weight: 10,
  };
}

export default BroadcastStage;
