/**
 * MPC 签名器封装 (MPCSigner)
 *
 * 负责：
 *  - MPC 门限签名的具体实现
 *  - 多轮签名协议的协调
 *  - 密钥分片的生成与管理
 *  - 签名结果的验证与返回
 *  - 签名过程的监控与统计
 *  - 支持多种链类型的签名
 */

import {
  ChainType,
  KeyShareInfo,
  SignerNode,
  SignerNodeStatus,
  KeyShareStatus,
  SignatureResult,
  ThresholdSignRequest,
  MPCError,
  MPCErrorCode,
} from '../mpc.types';
import {
  BaseThresholdSigner,
  KeyGenerationRequest,
  KeyGenerationResult,
  KeyRefreshRequest,
  KeyRefreshResult,
  VerifySignatureRequest,
  VerifySignatureResult,
  SignMessage,
  SignSession,
  SignPhase,
  SignAlgorithm,
  KeyGenerationScheme,
  SignatureProtocol,
} from './threshold-signer.interface';
import { KeyShareManager } from './key-share-manager';

// =============================================================================
// MPC 签名器配置
// =============================================================================

export interface MPCSignerOptions {
  /** 签名协议 */
  protocol?: SignatureProtocol;
  /** 默认签名算法 */
  defaultAlgorithm?: SignAlgorithm;
  /** 签名超时时间（毫秒） */
  signTimeoutMs?: number;
  /** 密钥生成超时时间（毫秒） */
  keyGenTimeoutMs?: number;
  /** 最大重试次数 */
  maxRetries?: number;
  /** 重试间隔（毫秒） */
  retryIntervalMs?: number;
  /** 密钥分片管理器 */
  keyShareManager?: KeyShareManager;
  /** 是否启用签名验证 */
  enableSignatureVerification?: boolean;
  /** 是否启用密钥备份 */
  enableKeyBackup?: boolean;
}

// =============================================================================
// 签名轮次数据
// =============================================================================

interface SignRoundData {
  round: number;
  phase: SignPhase;
  messages: Map<string, SignMessage>;
  completedAt?: Date;
}

// =============================================================================
// MPC 签名器类
// =============================================================================

export class MPCSigner extends BaseThresholdSigner {
  private keyShareManager: KeyShareManager;
  private enableSignatureVerification: boolean;
  private enableKeyBackup: boolean;
  private signRoundData: Map<string, SignRoundData[]> = new Map();

  constructor(options: MPCSignerOptions = {}) {
    super(options);
    this.keyShareManager = options.keyShareManager || new KeyShareManager();
    this.enableSignatureVerification = options.enableSignatureVerification ?? true;
    this.enableKeyBackup = options.enableKeyBackup ?? true;
  }

  // =========================================================================
  // 密钥生成
  // =========================================================================

  /**
   * 生成密钥分片
   *
   * 通过分布式密钥生成协议创建新的 MPC 密钥
   */
  async generateKeyShares(
    request: KeyGenerationRequest,
  ): Promise<KeyGenerationResult> {
    const startTime = Date.now();

    this.validateKeyGenerationRequest(request);

    const availableNodes = this.getAvailableNodes(request.participantNodeIds);
    if (availableNodes.length < request.totalShares) {
      throw new MPCError(
        MPCErrorCode.INSUFFICIENT_SIGNERS,
        `可用节点不足: 需要 ${request.totalShares} 个，实际 ${availableNodes.length} 个`,
      );
    }

    const publicKey = this.generatePublicKey(request.algorithm);
    const address = this.deriveAddress(publicKey, request.chainType);

    const keyShares: KeyShareInfo[] = [];
    for (let i = 0; i < request.totalShares; i++) {
      const share: KeyShareInfo = {
        id: this.generateId('ks'),
        keyRef: request.keyRef,
        shareIndex: i + 1,
        nodeId: availableNodes[i].id,
        status: KeyShareStatus.ACTIVE,
        version: 1,
        encryptionAlgorithm: request.algorithm,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      keyShares.push(share);
    }

    this.addKeyShares(request.keyRef, keyShares);
    this.keyShareManager.addKeyShares(request.keyRef, keyShares);

    if (this.enableKeyBackup) {
      await this.backupKeyShares(request.keyRef);
    }

    this.stats.totalKeyGenerations++;

    const generationTimeMs = Date.now() - startTime;

    const result: KeyGenerationResult = {
      requestId: request.requestId,
      keyRef: request.keyRef,
      publicKey,
      address,
      chainType: request.chainType,
      algorithm: request.algorithm,
      threshold: request.threshold,
      totalShares: request.totalShares,
      participants: keyShares.map((s) => ({
        nodeId: s.nodeId,
        shareIndex: s.shareIndex,
      })),
      scheme: request.scheme,
      generatedAt: new Date(),
      generationTimeMs,
    };

    return result;
  }

  /**
   * 验证密钥生成请求
   */
  private validateKeyGenerationRequest(request: KeyGenerationRequest): void {
    if (!request.keyRef) {
      throw new MPCError(
        MPCErrorCode.INVALID_PARAMS,
        '密钥引用 ID 不能为空',
      );
    }

    if (request.threshold <= 0) {
      throw new MPCError(
        MPCErrorCode.INVALID_PARAMS,
        '门限值必须大于 0',
      );
    }

    if (request.totalShares <= 0) {
      throw new MPCError(
        MPCErrorCode.INVALID_PARAMS,
        '总分片数必须大于 0',
      );
    }

    if (request.threshold > request.totalShares) {
      throw new MPCError(
        MPCErrorCode.INVALID_PARAMS,
        '门限值不能大于总分片数',
      );
    }

    if (request.participantNodeIds.length < request.totalShares) {
      throw new MPCError(
        MPCErrorCode.INVALID_PARAMS,
        '参与节点数不能少于总分片数',
      );
    }
  }

  /**
   * 获取可用节点
   */
  private getAvailableNodes(nodeIds: string[]): SignerNode[] {
    return nodeIds
      .map((id) => this.nodes.get(id))
      .filter(
        (n): n is SignerNode =>
          !!n && n.status === SignerNodeStatus.ONLINE,
      );
  }

  /**
   * 生成公钥（模拟）
   */
  private generatePublicKey(algorithm: SignAlgorithm): string {
    const hexChars = '0123456789abcdef';
    let key = '04';
    for (let i = 0; i < 128; i++) {
      key += hexChars[Math.floor(Math.random() * hexChars.length)];
    }
    return key;
  }

  // =========================================================================
  // 密钥验证
  // =========================================================================

  /**
   * 验证密钥分片完整性
   */
  async verifyKeyShares(keyRef: string): Promise<boolean> {
    const shares = this.getKeyShares(keyRef);
    if (shares.length === 0) {
      return false;
    }

    const activeShares = shares.filter(
      (s) => s.status === KeyShareStatus.ACTIVE,
    );

    const uniqueVersions = new Set(activeShares.map((s) => s.version));
    if (uniqueVersions.size > 1) {
      return false;
    }

    const uniqueNodes = new Set(activeShares.map((s) => s.nodeId));
    if (uniqueNodes.size !== activeShares.length) {
      return false;
    }

    for (const share of activeShares) {
      if (!this.isNodeAvailable(share.nodeId)) {
        continue;
      }
      // 实际实现中应向节点发送验证请求
    }

    return true;
  }

  // =========================================================================
  // 密钥轮换
  // =========================================================================

  /**
   * 刷新/轮换密钥分片
   */
  async refreshKeyShares(
    request: KeyRefreshRequest,
  ): Promise<KeyRefreshResult> {
    const startTime = Date.now();
    const currentShares = this.getKeyShares(request.keyRef);

    if (currentShares.length === 0) {
      throw new MPCError(
        MPCErrorCode.KEY_SHARE_NOT_FOUND,
        `密钥分片不存在: ${request.keyRef}`,
      );
    }

    const currentVersion = Math.max(...currentShares.map((s) => s.version));
    const newVersion = currentVersion + 1;

    const newThreshold = request.newThreshold || currentShares[0]?.shareIndex || 2;
    const newTotalShares = request.newTotalShares || currentShares.length;

    const participantNodeIds =
      request.newParticipantNodeIds ||
      currentShares.map((s) => s.nodeId);

    const availableNodes = this.getAvailableNodes(participantNodeIds);
    if (availableNodes.length < newTotalShares) {
      throw new MPCError(
        MPCErrorCode.INSUFFICIENT_SIGNERS,
        `可用节点不足: 需要 ${newTotalShares} 个，实际 ${availableNodes.length} 个`,
      );
    }

    for (const share of currentShares) {
      this.updateKeyShareStatus(
        request.keyRef,
        share.id,
        KeyShareStatus.ROTATED,
      );
    }

    const newShares: KeyShareInfo[] = [];
    for (let i = 0; i < newTotalShares; i++) {
      const share: KeyShareInfo = {
        id: this.generateId('ks'),
        keyRef: request.keyRef,
        shareIndex: i + 1,
        nodeId: availableNodes[i].id,
        status: KeyShareStatus.ACTIVE,
        version: newVersion,
        encryptionAlgorithm: currentShares[0]?.encryptionAlgorithm || SignAlgorithm.ECDSA_SECP256K1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      newShares.push(share);
    }

    this.addKeyShares(request.keyRef, [...currentShares, ...newShares]);

    this.stats.totalKeyRefreshes++;

    const refreshTimeMs = Date.now() - startTime;

    const result: KeyRefreshResult = {
      requestId: request.requestId,
      keyRef: request.keyRef,
      newVersion,
      threshold: newThreshold,
      totalShares: newTotalShares,
      participants: newShares.map((s) => ({
        nodeId: s.nodeId,
        shareIndex: s.shareIndex,
      })),
      refreshedAt: new Date(),
      refreshTimeMs,
    };

    return result;
  }

  // =========================================================================
  // 门限签名
  // =========================================================================

  /**
   * 执行门限签名
   */
  async thresholdSign(
    request: ThresholdSignRequest,
  ): Promise<SignatureResult> {
    const startTime = Date.now();

    this.validateSignRequest(request);

    const signerNodeIds = this.selectSignerNodes(
      request.keyRef,
      request.threshold,
    );

    const session = this.createSession(
      request.requestId,
      request.keyRef,
      signerNodeIds,
    );

    this.signRoundData.set(session.sessionId, []);

    try {
      await this.executeSignProtocol(session, request);

      const signature = this.generateSignature(request.messageHash, request.chainType);

      const signTimeMs = Date.now() - startTime;

      const result: SignatureResult = {
        signature,
        rawSignature: this.parseRawSignature(signature, request.chainType),
        signerNodes: signerNodeIds,
        algorithm: this.options.defaultAlgorithm || SignAlgorithm.ECDSA_SECP256K1,
        signTimeMs,
        signedAt: new Date(),
      };

      if (this.enableSignatureVerification) {
        const shares = this.getKeyShares(request.keyRef);
        const activeShares = shares.filter(
          (s) => s.status === KeyShareStatus.ACTIVE,
        );
        const publicKey = this.reconstructPublicKey(activeShares);

        const isValid = await this.verifySignature({
          publicKey,
          messageHash: request.messageHash,
          signature,
          chainType: request.chainType,
          algorithm: SignAlgorithm.ECDSA_SECP256K1,
        });

        if (!isValid.valid) {
          throw new MPCError(
            MPCErrorCode.SIGNATURE_FAILED,
            `签名验证失败: ${isValid.error}`,
          );
        }
      }

      this.updateSession(session.sessionId, {
        currentPhase: SignPhase.COMPLETE,
      });

      this.stats.totalSignatures++;
      this.stats.totalSignTimeMs += signTimeMs;
      this.stats.averageSignTimeMs =
        this.stats.totalSignTimeMs / this.stats.totalSignatures;

      this.updateLastSignTime(request.keyRef);

      return result;
    } catch (error) {
      this.stats.failedSignatures++;
      this.updateSession(session.sessionId, {
        error: error instanceof Error ? error.message : '未知错误',
      });
      throw error;
    } finally {
      setTimeout(() => {
        this.sessions.delete(session.sessionId);
        this.signRoundData.delete(session.sessionId);
      }, 5000);
    }
  }

  /**
   * 验证签名请求
   */
  private validateSignRequest(request: ThresholdSignRequest): void {
    if (!request.keyRef) {
      throw new MPCError(
        MPCErrorCode.INVALID_PARAMS,
        '密钥引用 ID 不能为空',
      );
    }

    if (!request.messageHash) {
      throw new MPCError(
        MPCErrorCode.INVALID_PARAMS,
        '消息哈希不能为空',
      );
    }

    if (request.threshold <= 0) {
      throw new MPCError(
        MPCErrorCode.INVALID_PARAMS,
        '门限值必须大于 0',
      );
    }

    const shares = this.getKeyShares(request.keyRef);
    if (shares.length === 0) {
      throw new MPCError(
        MPCErrorCode.KEY_SHARE_NOT_FOUND,
        `密钥分片不存在: ${request.keyRef}`,
      );
    }
  }

  /**
   * 执行签名协议
   */
  private async executeSignProtocol(
    session: SignSession,
    request: ThresholdSignRequest,
  ): Promise<void> {
    const phases = [
      SignPhase.INIT,
      SignPhase.ROUND_1,
      SignPhase.ROUND_2,
      SignPhase.ROUND_3,
      SignPhase.OUTPUT,
    ];

    for (let i = 0; i < phases.length; i++) {
      const phase = phases[i];
      this.updateSession(session.sessionId, {
        currentPhase: phase,
        currentRound: i,
      });

      this.recordSignRound(session.sessionId, phase, i);

      await this.simulateSignRound(session, phase, i);

      await new Promise((resolve) =>
        setTimeout(resolve, Math.random() * 50 + 10),
      );
    }
  }

  /**
   * 模拟签名轮次
   */
  private async simulateSignRound(
    session: SignSession,
    phase: SignPhase,
    round: number,
  ): Promise<void> {
    const roundData: SignMessage[] = [];

    for (const nodeId of session.participantNodeIds) {
      const message: SignMessage = {
        messageId: this.generateId('msg'),
        sessionId: session.sessionId,
        fromNodeId: nodeId,
        toNodeIds: session.participantNodeIds.filter((n) => n !== nodeId),
        phase,
        round,
        data: {
          roundData: `round_${round}_data_${nodeId}`,
        },
        timestamp: new Date(),
      };
      roundData.push(message);
    }

    this.updateSession(session.sessionId, {
      receivedMessages: session.receivedMessages + roundData.length,
    });
  }

  /**
   * 记录签名轮次数据
   */
  private recordSignRound(
    sessionId: string,
    phase: SignPhase,
    round: number,
  ): void {
    const rounds = this.signRoundData.get(sessionId) || [];
    rounds.push({
      round,
      phase,
      messages: new Map(),
      completedAt: new Date(),
    });
    this.signRoundData.set(sessionId, rounds);
  }

  /**
   * 生成签名（模拟）
   */
  private generateSignature(messageHash: string, chainType: ChainType): string {
    const hexChars = '0123456789abcdef';
    let sig = '0x';
    for (let i = 0; i < 130; i++) {
      sig += hexChars[Math.floor(Math.random() * hexChars.length)];
    }
    return sig;
  }

  /**
   * 解析原始签名数据
   */
  private parseRawSignature(
    signature: string,
    chainType: ChainType,
  ): { r?: string; s?: string; v?: number; recoveryId?: number } {
    if (chainType === ChainType.EVM && signature.startsWith('0x')) {
      const hex = signature.slice(2);
      return {
        r: '0x' + hex.slice(0, 64),
        s: '0x' + hex.slice(64, 128),
        v: parseInt(hex.slice(128, 130), 16) || 27,
      };
    }
    return {};
  }

  /**
   * 重建公钥
   */
  private reconstructPublicKey(shares: KeyShareInfo[]): string {
    return this.generatePublicKey(SignAlgorithm.ECDSA_SECP256K1);
  }

  /**
   * 更新最后签名时间
   */
  private updateLastSignTime(keyRef: string): void {
    const shares = this.getKeyShares(keyRef);
    for (const share of shares) {
      share.lastUsedAt = new Date();
    }
  }

  // =========================================================================
  // 签名验证
  // =========================================================================

  /**
   * 验证签名
   */
  async verifySignature(
    request: VerifySignatureRequest,
  ): Promise<VerifySignatureResult> {
    const startTime = Date.now();

    this.stats.totalVerifications++;

    let valid = true;
    let error: string | undefined;

    try {
      if (!request.publicKey || !request.signature || !request.messageHash) {
        valid = false;
        error = '缺少必要参数';
      }

      if (request.signature.length < 64) {
        valid = false;
        error = '签名长度不足';
      }

      // 实际实现中应使用密码学库进行验证
    } catch (e) {
      valid = false;
      error = e instanceof Error ? e.message : '验证异常';
    }

    const verifyTimeMs = Date.now() - startTime;

    return {
      valid,
      publicKey: request.publicKey,
      messageHash: request.messageHash,
      verifyTimeMs,
      error,
    };
  }

  // =========================================================================
  // 消息处理
  // =========================================================================

  /**
   * 处理接收到的签名消息
   */
  async handleSignMessage(message: SignMessage): Promise<void> {
    const session = this.sessions.get(message.sessionId);
    if (!session) {
      return;
    }

    const rounds = this.signRoundData.get(message.sessionId) || [];
    const currentRound = rounds[rounds.length - 1];
    if (currentRound) {
      currentRound.messages.set(message.messageId, message);
    }

    this.updateSession(message.sessionId, {
      receivedMessages: session.receivedMessages + 1,
    });

    const expectedMessages = session.participantNodeIds.length - 1;
    const receivedInRound = currentRound?.messages.size || 0;

    if (receivedInRound >= expectedMessages) {
      // 本轮消息收集完成，可以进入下一轮
    }
  }

  // =========================================================================
  // 密钥备份
  // =========================================================================

  /**
   * 备份密钥分片
   */
  private async backupKeyShares(keyRef: string): Promise<void> {
    const shares = this.getKeyShares(keyRef);
    // 实际实现中应将密钥分片备份到安全的存储位置
    console.debug(`备份密钥分片: ${keyRef}, 共 ${shares.length} 片`);
  }

  // =========================================================================
  // 密钥分片管理委托
  // =========================================================================

  /**
   * 获取密钥分片管理器
   */
  getKeyShareManager(): KeyShareManager {
    return this.keyShareManager;
  }

  // =========================================================================
  // 健康检查
  // =========================================================================

  /**
   * 健康检查
   */
  healthCheck(): {
    healthy: boolean;
    onlineNodes: number;
    totalNodes: number;
    activeSessions: number;
    hasKeyShares: boolean;
  } {
    const onlineNodes = this.getOnlineNodes().length;
    const totalNodes = this.getAllNodes().length;
    const activeSessions = this.getActiveSessions().length;
    const hasKeyShares = this.keyShares.size > 0;

    return {
      healthy: onlineNodes > 0,
      onlineNodes,
      totalNodes,
      activeSessions,
      hasKeyShares,
    };
  }

  /**
   * 获取指定密钥的健康状态
   */
  getKeyHealth(keyRef: string): {
    keyRef: string;
    healthy: boolean;
    activeShares: number;
    totalShares: number;
    onlineNodes: number;
    threshold: number;
    canSign: boolean;
  } {
    const shares = this.getKeyShares(keyRef);
    const activeShares = shares.filter(
      (s) => s.status === KeyShareStatus.ACTIVE,
    );
    const onlineNodes = activeShares.filter((s) =>
      this.isNodeAvailable(s.nodeId),
    ).length;

    const threshold = Math.ceil(activeShares.length / 2);
    const canSign = onlineNodes >= threshold;

    return {
      keyRef,
      healthy: activeShares.length > 0 && onlineNodes >= threshold,
      activeShares: activeShares.length,
      totalShares: shares.length,
      onlineNodes,
      threshold,
      canSign,
    };
  }

  // =========================================================================
  // 统计信息（重写）
  // =========================================================================

  /**
   * 获取统计信息
   */
  override getStats() {
    const baseStats = super.getStats();
    return {
      ...baseStats,
      keyShareStats: this.keyShareManager.getStats(),
    };
  }
}
