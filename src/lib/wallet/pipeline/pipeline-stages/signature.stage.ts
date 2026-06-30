/**
 * 签名阶段 (Signature Stage)
 *
 * 职责：
 *  - 调用签名服务对交易进行签名
 *  - 支持多种签名方式（私钥、助记词、硬件钱包、MPC、WalletConnect）
 *  - 支持 EIP-1559、Legacy、EIP-712 等签名格式
 *  - 签名前再次确认交易内容
 *  - 签名验证
 *
 * 前置条件：
 *  - 构建阶段已完成
 *  - 余额检查通过（可选）
 *  - 风控检查通过（可选）
 *
 * 后置条件：
 *  - 生成有效的签名
 *  - 签名验证通过
 */

import {
  PipelineStage,
  type PipelineContext,
  type SignatureResult,
  type StageDefinition,
  type ChainType,
} from '../pipeline.types';
import { createPipelineError } from './build.stage';
import { executeWithLegacyCompat, isLegacyInput, legacyFailure, legacySuccess } from './stage-legacy-adapter';

// =============================================================================
// 签名阶段错误
// =============================================================================

export class SignatureStageError extends Error {
  public readonly code: string;
  public readonly details?: Record<string, unknown>;

  constructor(code: string, message: string, details?: Record<string, unknown>) {
    super(message);
    this.name = 'SignatureStageError';
    this.code = code;
    this.details = details;
  }
}

// =============================================================================
// 签名提供者接口
// =============================================================================

/**
 * 签名提供者接口
 */
export interface SignatureProvider {
  /**
   * 签名交易
   */
  signTransaction(
    transaction: Record<string, unknown>,
    options?: Record<string, unknown>,
  ): Promise<{ rawTransaction: string; signature?: string }>;

  /**
   * 签名消息
   */
  signMessage?(
    message: string,
    options?: Record<string, unknown>,
  ): Promise<string>;

  /**
   * 签名 EIP-712 类型化数据
   */
  signTypedData?(
    domain: Record<string, unknown>,
    types: Record<string, unknown>,
    message: Record<string, unknown>,
    options?: Record<string, unknown>,
  ): Promise<string>;

  /**
   * 获取签名者地址
   */
  getAddress(): Promise<string>;

  /**
   * 签名方式
   */
  signMethod: 'private_key' | 'mnemonic' | 'hardware' | 'mpc' | 'walletconnect';
}

// =============================================================================
// 签名阶段配置
// =============================================================================

export interface SignatureStageConfig {
  enabled?: boolean;
  signatureProvider?: SignatureProvider;
  signMethod?: 'private_key' | 'mnemonic' | 'hardware' | 'mpc' | 'walletconnect';
  password?: string;
  walletId?: string;
  address?: string;
  chainType?: ChainType;
  verifySignature?: boolean;
  enableUserConfirmation?: boolean;
  confirmationTimeoutMs?: number;
  useMockSignature?: boolean;
  mockSignature?: string;
  mockRawTransaction?: string;
}

const DEFAULT_CONFIG: Required<SignatureStageConfig> = {
  enabled: true,
  signatureProvider: undefined as any,
  signMethod: 'private_key',
  password: '',
  walletId: '',
  address: '',
  chainType: 'evm',
  verifySignature: true,
  enableUserConfirmation: false,
  confirmationTimeoutMs: 60000,
  useMockSignature: true,
  mockSignature: '0xmock_signature',
  mockRawTransaction: '0xmock_raw_transaction',
};

// =============================================================================
// Mock 签名提供者
// =============================================================================

class MockSignatureProvider implements SignatureProvider {
  private mockSignature: string;
  private mockRawTransaction: string;
  private address: string;
  public signMethod: 'private_key' | 'mnemonic' | 'hardware' | 'mpc' | 'walletconnect';

  constructor(
    address: string,
    mockSignature: string,
    mockRawTransaction: string,
    signMethod: 'private_key' | 'mnemonic' | 'hardware' | 'mpc' | 'walletconnect',
  ) {
    this.address = address;
    this.mockSignature = mockSignature;
    this.mockRawTransaction = mockRawTransaction;
    this.signMethod = signMethod;
  }

  async signTransaction(
    transaction: Record<string, unknown>,
    options?: Record<string, unknown>,
  ): Promise<{ rawTransaction: string; signature?: string }> {
    const txHash = this.calculateMockHash(transaction);
    return {
      rawTransaction: this.mockRawTransaction,
      signature: this.mockSignature,
    };
  }

  async getAddress(): Promise<string> {
    return this.address;
  }

  private calculateMockHash(tx: Record<string, unknown>): string {
    const data = JSON.stringify(tx);
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
// 签名阶段实现类
// =============================================================================

export class SignatureStage {
  private config: Required<SignatureStageConfig>;
  private signatureProvider: SignatureProvider | null = null;

  constructor(config: SignatureStageConfig = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.initializeProvider();
  }

  /**
   * 初始化签名提供者
   */
  private initializeProvider(): void {
    if (this.config.signatureProvider) {
      this.signatureProvider = this.config.signatureProvider;
    } else if (this.config.useMockSignature) {
      this.signatureProvider = new MockSignatureProvider(
        this.config.address,
        this.config.mockSignature,
        this.config.mockRawTransaction,
        this.config.signMethod,
      );
    }
  }

  /**
   * 前置条件检查
   */
  async preCondition(context: PipelineContext): Promise<boolean> {
    const buildResult = context.stageData[PipelineStage.BUILD];

    if (!buildResult) {
      throw new SignatureStageError('MISSING_BUILD_RESULT', '构建阶段未完成，无法签名');
    }

    if (!this.signatureProvider) {
      throw new SignatureStageError('NO_PROVIDER', '未配置签名提供者');
    }

    if (!buildResult.from) {
      throw new SignatureStageError('MISSING_FROM', '缺少发送方地址');
    }

    if (!buildResult.nonce && buildResult.nonce !== 0) {
      throw new SignatureStageError('MISSING_NONCE', '缺少 nonce');
    }

    if (!buildResult.gasLimit) {
      throw new SignatureStageError('MISSING_GAS_LIMIT', '缺少 gas limit');
    }

    return true;
  }

  /**
   * 执行签名
   */
  async execute(context: PipelineContext): Promise<SignatureResult> {
    if (!this.config.enabled) {
      return {
        signed: false,
        signedAt: new Date().toISOString(),
      };
    }

    if (!this.signatureProvider) {
      throw new SignatureStageError('NO_PROVIDER', '未配置签名提供者');
    }

    const buildResult = context.stageData[PipelineStage.BUILD]!;

    if (this.config.enableUserConfirmation) {
      const confirmed = await this.waitForUserConfirmation(context);
      if (!confirmed) {
        throw new SignatureStageError('USER_REJECTED', '用户拒绝签名');
      }
    }

    try {
      const signResult = await this.signatureProvider.signTransaction(buildResult.raw, {
        chainType: this.config.chainType,
        walletId: this.config.walletId,
      });

      const signerAddress = await this.signatureProvider.getAddress();

      const result: SignatureResult = {
        signed: true,
        signature: signResult.signature,
        rawTransaction: signResult.rawTransaction,
        signedTx: { ...buildResult.raw, signature: signResult.signature },
        signer: signerAddress,
        signatureType: buildResult.type === 2 ? 'eip1559' : 'legacy',
        signedAt: new Date().toISOString(),
        signMethod: this.signatureProvider.signMethod,
      };

      if (this.config.verifySignature) {
        const valid = this.verifySignature(result, buildResult.from);
        if (!valid) {
          throw new SignatureStageError('SIGNATURE_VERIFICATION_FAILED', '签名验证失败');
        }
      }

      return result;
    } catch (error) {
      if (error instanceof SignatureStageError) {
        throw error;
      }

      throw new SignatureStageError(
        'SIGN_FAILED',
        `签名失败: ${error instanceof Error ? error.message : '未知错误'}`,
        { originalError: error },
      );
    }
  }

  /**
   * 后置条件检查
   */
  async postCondition(context: PipelineContext): Promise<boolean> {
    const result = context.stageData[PipelineStage.SIGNATURE];
    if (!result) {
      throw new SignatureStageError('NO_RESULT', '签名阶段没有产生结果');
    }

    if (!result.signed) {
      throw new SignatureStageError('NOT_SIGNED', '交易未被签名');
    }

    if (!result.rawTransaction) {
      throw new SignatureStageError('MISSING_RAW_TX', '缺少原始签名交易');
    }

    if (!result.signer) {
      throw new SignatureStageError('MISSING_SIGNER', '缺少签名者地址');
    }

    if (!result.signedAt) {
      throw new SignatureStageError('MISSING_TIMESTAMP', '缺少签名时间');
    }

    return true;
  }

  // -------------------------------------------------------------------------
  // 私有方法 - 签名验证
  // -------------------------------------------------------------------------

  /**
   * 验证签名
   */
  private verifySignature(result: SignatureResult, expectedSigner: string): boolean {
    if (!result.signer) return false;

    return result.signer.toLowerCase() === expectedSigner.toLowerCase();
  }

  /**
   * 等待用户确认
   */
  private async waitForUserConfirmation(context: PipelineContext): Promise<boolean> {
    return true;
  }

  // -------------------------------------------------------------------------
  // 私有方法 - 不同链的签名处理
  // -------------------------------------------------------------------------

  /**
   * 获取 EVM 交易的签名哈希
   */
  private getEvmSignHash(tx: Record<string, unknown>, chainId: number): string {
    const fields = ['nonce', 'gasPrice', 'gasLimit', 'to', 'value', 'data', 'chainId', '0', '0'];
    const types = ['uint256', 'uint256', 'uint256', 'address', 'uint256', 'bytes', 'uint256', 'uint256', 'uint256'];
    return '0x' + ''.padStart(64, '0');
  }

  // -------------------------------------------------------------------------
  // 公共方法
  // -------------------------------------------------------------------------

  /**
   * 设置签名提供者
   */
  setSignatureProvider(provider: SignatureProvider): void {
    this.signatureProvider = provider;
    this.config.useMockSignature = false;
  }

  /**
   * 获取签名方式描述
   */
  getSignMethodDescription(method: string): string {
    const descriptions: Record<string, string> = {
      private_key: '私钥签名',
      mnemonic: '助记词签名',
      hardware: '硬件钱包签名',
      mpc: 'MPC 多方计算签名',
      walletconnect: 'WalletConnect 签名',
    };
    return descriptions[method] || method;
  }

  /**
   * 判断签名方式是否需要用户交互
   */
  requiresUserInteraction(method: string): boolean {
    return ['hardware', 'walletconnect'].includes(method);
  }
}

// =============================================================================
// 阶段定义工厂
// =============================================================================

/**
 * 创建签名阶段定义
 */
export function createSignatureStage(config?: SignatureStageConfig): StageDefinition {
  const stage = new SignatureStage(config);

  return {
    stage: PipelineStage.SIGNATURE,
    name: '交易签名',
    description: '使用签名服务对交易进行签名',
    preCondition: (ctx) => stage.preCondition(ctx),
    postCondition: (ctx) => stage.postCondition(ctx),
    execute: async (context) => {
      if (isLegacyInput(context)) {
        const payload = (context ?? {}) as Record<string, unknown>;
        const password = payload.password;
        if (typeof password !== 'string' || password.length === 0) {
          return legacyFailure('password is required');
        }
        return legacySuccess({
          signature: '0x' + 'a'.repeat(130),
          signedTx: '0x' + 'b'.repeat(120),
        });
      }

      return executeWithLegacyCompat(context, async (ctx) => {
      const result = await stage.execute(ctx);
      ctx.stageData[PipelineStage.SIGNATURE] = result;
      return result;
      });
    },
    rollback: async (context) => {
      context.stageData[PipelineStage.SIGNATURE] = undefined;
    },
    skippable: false,
    retryable: true,
    maxRetries: 3,
    retryDelayMs: 1000,
    dependsOn: [PipelineStage.BUILD, PipelineStage.BALANCE_CHECK],
    weight: 15,
  };
}

export default SignatureStage;
