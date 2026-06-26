/**
 * 门限签名接口定义
 *
 * 本文件定义了 MPC 门限签名系统的核心接口，包括：
 *  - 门限签名器通用接口
 *  - 密钥生成接口
 *  - 签名验证接口
 *  - 密钥轮换接口
 *  - 签名节点通信接口
 *  - 支持多种链类型（EVM、Solana、Bitcoin 等）
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

// =============================================================================
// 基础类型定义
// =============================================================================

/**
 * 签名算法枚举
 */
export enum SignAlgorithm {
  ECDSA_SECP256K1 = 'ecdsa_secp256k1',
  ECDSA_SECP256R1 = 'ecdsa_secp256r1',
  ED25519 = 'ed25519',
  SCHNORR = 'schnorr',
  BLS = 'bls',
}

/**
 * 密钥生成方案
 */
export enum KeyGenerationScheme {
  DKG = 'dkg',
  CENTRALIZED = 'centralized',
  IMPORTED = 'imported',
}

/**
 * 签名协议
 */
export enum SignatureProtocol {
  GG20 = 'gg20',
  GG18 = 'gg18',
  CMP = 'cmp',
  FROST = 'frost',
  DMZ21 = 'dmz21',
}

// =============================================================================
// 密钥生成相关接口
// =============================================================================

/**
 * 密钥生成请求
 */
export interface KeyGenerationRequest {
  /** 请求 ID */
  requestId: string;
  /** 密钥引用 ID（用于后续引用） */
  keyRef: string;
  /** 链类型 */
  chainType: ChainType;
  /** 签名算法 */
  algorithm: SignAlgorithm;
  /** 门限值（t of n 中的 t） */
  threshold: number;
  /** 总分片数（t of n 中的 n） */
  totalShares: number;
  /** 参与的节点 ID 列表 */
  participantNodeIds: string[];
  /** 密钥生成方案 */
  scheme: KeyGenerationScheme;
  /** 签名协议 */
  protocol: SignatureProtocol;
  /** 额外元数据 */
  metadata?: Record<string, unknown>;
}

/**
 * 密钥生成结果
 */
export interface KeyGenerationResult {
  /** 请求 ID */
  requestId: string;
  /** 密钥引用 ID */
  keyRef: string;
  /** 公钥 */
  publicKey: string;
  /** 地址（根据链类型派生） */
  address: string;
  /** 链类型 */
  chainType: ChainType;
  /** 签名算法 */
  algorithm: SignAlgorithm;
  /** 门限值 */
  threshold: number;
  /** 总分片数 */
  totalShares: number;
  /** 参与的节点信息 */
  participants: {
    nodeId: string;
    shareIndex: number;
  }[];
  /** 密钥生成方案 */
  scheme: KeyGenerationScheme;
  /** 生成时间 */
  generatedAt: Date;
  /** 生成耗时（毫秒） */
  generationTimeMs: number;
}

// =============================================================================
// 签名相关接口
// =============================================================================

/**
 * 签名阶段枚举
 */
export enum SignPhase {
  INIT = 'init',
  ROUND_1 = 'round_1',
  ROUND_2 = 'round_2',
  ROUND_3 = 'round_3',
  OUTPUT = 'output',
  COMPLETE = 'complete',
}

/**
 * 签名消息类型
 */
export interface SignMessage {
  /** 消息 ID */
  messageId: string;
  /** 签名会话 ID */
  sessionId: string;
  /** 发送节点 ID */
  fromNodeId: string;
  /** 接收节点 ID 列表 */
  toNodeIds: string[];
  /** 签名阶段 */
  phase: SignPhase;
  /** 轮次 */
  round: number;
  /** 消息数据 */
  data: unknown;
  /** 时间戳 */
  timestamp: Date;
}

/**
 * 签名会话状态
 */
export interface SignSession {
  /** 会话 ID */
  sessionId: string;
  /** 签名请求 ID */
  requestId: string;
  /** 密钥引用 ID */
  keyRef: string;
  /** 当前阶段 */
  currentPhase: SignPhase;
  /** 当前轮次 */
  currentRound: number;
  /** 参与节点 ID 列表 */
  participantNodeIds: string[];
  /** 已接收的消息数 */
  receivedMessages: number;
  /** 开始时间 */
  startTime: Date;
  /** 最后活动时间 */
  lastActiveAt: Date;
  /** 错误信息（如果有） */
  error?: string;
}

// =============================================================================
// 密钥轮换相关接口
// =============================================================================

/**
 * 密钥轮换请求
 */
export interface KeyRefreshRequest {
  /** 请求 ID */
  requestId: string;
  /** 密钥引用 ID */
  keyRef: string;
  /** 链类型 */
  chainType: ChainType;
  /** 参与的节点 ID 列表 */
  participantNodeIds: string[];
  /** 新门限值（可选，不填则保持不变） */
  newThreshold?: number;
  /** 新总分片数（可选，不填则保持不变） */
  newTotalShares?: number;
  /** 新参与节点列表（可选，用于增减节点） */
  newParticipantNodeIds?: string[];
  /** 额外元数据 */
  metadata?: Record<string, unknown>;
}

/**
 * 密钥轮换结果
 */
export interface KeyRefreshResult {
  /** 请求 ID */
  requestId: string;
  /** 密钥引用 ID */
  keyRef: string;
  /** 新公钥（如果算法导致公钥变化） */
  newPublicKey?: string;
  /** 新地址（如果公钥变化） */
  newAddress?: string;
  /** 新版本号 */
  newVersion: number;
  /** 门限值 */
  threshold: number;
  /** 总分片数 */
  totalShares: number;
  /** 参与节点信息 */
  participants: {
    nodeId: string;
    shareIndex: number;
  }[];
  /** 轮换时间 */
  refreshedAt: Date;
  /** 轮换耗时（毫秒） */
  refreshTimeMs: number;
}

// =============================================================================
// 签名验证接口
// =============================================================================

/**
 * 签名验证请求
 */
export interface VerifySignatureRequest {
  /** 公钥 */
  publicKey: string;
  /** 消息哈希 */
  messageHash: string;
  /** 签名数据 */
  signature: string;
  /** 链类型 */
  chainType: ChainType;
  /** 签名算法 */
  algorithm: SignAlgorithm;
}

/**
 * 签名验证结果
 */
export interface VerifySignatureResult {
  /** 是否有效 */
  valid: boolean;
  /** 公钥 */
  publicKey: string;
  /** 消息哈希 */
  messageHash: string;
  /** 验证时间（毫秒） */
  verifyTimeMs: number;
  /** 错误信息（如果验证失败） */
  error?: string;
}

// =============================================================================
// 节点通信接口
// =============================================================================

/**
 * 节点通信接口
 */
export interface NodeCommunicationChannel {
  /**
   * 发送消息到指定节点
   */
  sendMessage(message: SignMessage): Promise<void>;

  /**
   * 广播消息到所有参与节点
   */
  broadcastMessage(message: Omit<SignMessage, 'toNodeIds'>): Promise<void>;

  /**
   * 接收消息
   */
  onMessage(callback: (message: SignMessage) => void): void;

  /**
   * 建立连接
   */
  connect(nodeId: string): Promise<void>;

  /**
   * 断开连接
   */
  disconnect(nodeId: string): Promise<void>;

  /**
   * 检查节点是否在线
   */
  isNodeOnline(nodeId: string): boolean;
}

// =============================================================================
// 门限签名器主接口
// =============================================================================

/**
 * 门限签名器配置
 */
export interface ThresholdSignerOptions {
  /** 签名协议 */
  protocol?: SignatureProtocol;
  /** 签名算法 */
  defaultAlgorithm?: SignAlgorithm;
  /** 签名超时时间（毫秒） */
  signTimeoutMs?: number;
  /** 密钥生成超时时间（毫秒） */
  keyGenTimeoutMs?: number;
  /** 最大重试次数 */
  maxRetries?: number;
  /** 重试间隔（毫秒） */
  retryIntervalMs?: number;
}

/**
 * 门限签名器接口
 *
 * 所有 MPC 门限签名实现都需要实现此接口
 */
export interface IThresholdSigner {
  // =========================================================================
  // 密钥管理
  // =========================================================================

  /**
   * 生成密钥分片
   *
   * 通过分布式密钥生成（DKG）协议生成新的密钥分片
   */
  generateKeyShares(request: KeyGenerationRequest): Promise<KeyGenerationResult>;

  /**
   * 验证密钥分片完整性
   *
   * 验证所有密钥分片是否正确且完整
   */
  verifyKeyShares(keyRef: string): Promise<boolean>;

  /**
   * 刷新/轮换密钥分片
   *
   * 在不改变公钥的情况下刷新密钥分片
   */
  refreshKeyShares(request: KeyRefreshRequest): Promise<KeyRefreshResult>;

  // =========================================================================
  // 签名操作
  // =========================================================================

  /**
   * 执行门限签名
   *
   * 使用 MPC 协议对消息进行门限签名
   */
  thresholdSign(request: ThresholdSignRequest): Promise<SignatureResult>;

  /**
   * 验证签名
   *
   * 验证签名的有效性
   */
  verifySignature(request: VerifySignatureRequest): Promise<VerifySignatureResult>;

  // =========================================================================
  // 会话管理
  // =========================================================================

  /**
   * 获取签名会话状态
   */
  getSignSession(sessionId: string): SignSession | undefined;

  /**
   * 取消签名会话
   */
  cancelSignSession(sessionId: string): boolean;

  /**
   * 获取活跃的签名会话列表
   */
  getActiveSessions(): SignSession[];

  // =========================================================================
  // 节点管理
  // =========================================================================

  /**
   * 注册签名节点
   */
  registerNode(node: SignerNode): void;

  /**
   * 移除签名节点
   */
  removeNode(nodeId: string): void;

  /**
   * 获取所有签名节点
   */
  getAllNodes(): SignerNode[];

  /**
   * 获取在线节点
   */
  getOnlineNodes(): SignerNode[];

  /**
   * 更新节点状态
   */
  updateNodeStatus(nodeId: string, status: SignerNodeStatus): void;

  // =========================================================================
  // 通信
  // =========================================================================

  /**
   * 设置通信通道
   */
  setCommunicationChannel(channel: NodeCommunicationChannel): void;

  /**
   * 处理接收到的签名消息
   */
  handleSignMessage(message: SignMessage): Promise<void>;
}

// =============================================================================
// 抽象基类
// =============================================================================

/**
 * 门限签名器抽象基类
 *
 * 提供通用的实现基础功能
 */
export abstract class BaseThresholdSigner implements IThresholdSigner {
  protected options: ThresholdSignerOptions;
  protected nodes: Map<string, SignerNode> = new Map();
  protected sessions: Map<string, SignSession> = new Map();
  protected keyShares: Map<string, KeyShareInfo[]> = new Map();
  protected communicationChannel?: NodeCommunicationChannel;

  protected stats = {
    totalKeyGenerations: 0,
    totalSignatures: 0,
    totalVerifications: 0,
    totalKeyRefreshes: 0,
    failedSignatures: 0,
    averageSignTimeMs: 0,
    totalSignTimeMs: 0,
  };

  constructor(options: ThresholdSignerOptions = {}) {
    this.options = {
      protocol: options.protocol || SignatureProtocol.GG20,
      defaultAlgorithm: options.defaultAlgorithm || SignAlgorithm.ECDSA_SECP256K1,
      signTimeoutMs: options.signTimeoutMs || 30000,
      keyGenTimeoutMs: options.keyGenTimeoutMs || 60000,
      maxRetries: options.maxRetries || 3,
      retryIntervalMs: options.retryIntervalMs || 1000,
    };
  }

  // =========================================================================
  // 抽象方法（子类必须实现）
  // =========================================================================

  abstract generateKeyShares(request: KeyGenerationRequest): Promise<KeyGenerationResult>;
  abstract verifyKeyShares(keyRef: string): Promise<boolean>;
  abstract refreshKeyShares(request: KeyRefreshRequest): Promise<KeyRefreshResult>;
  abstract thresholdSign(request: ThresholdSignRequest): Promise<SignatureResult>;
  abstract verifySignature(request: VerifySignatureRequest): Promise<VerifySignatureResult>;
  abstract handleSignMessage(message: SignMessage): Promise<void>;

  // =========================================================================
  // 会话管理
  // =========================================================================

  /**
   * 获取签名会话状态
   */
  getSignSession(sessionId: string): SignSession | undefined {
    return this.sessions.get(sessionId);
  }

  /**
   * 取消签名会话
   */
  cancelSignSession(sessionId: string): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) return false;
    this.sessions.delete(sessionId);
    return true;
  }

  /**
   * 获取活跃的签名会话列表
   */
  getActiveSessions(): SignSession[] {
    return Array.from(this.sessions.values());
  }

  /**
   * 创建签名会话
   */
  protected createSession(
    requestId: string,
    keyRef: string,
    participantNodeIds: string[],
  ): SignSession {
    const session: SignSession = {
      sessionId: this.generateId('sess'),
      requestId,
      keyRef,
      currentPhase: SignPhase.INIT,
      currentRound: 0,
      participantNodeIds,
      receivedMessages: 0,
      startTime: new Date(),
      lastActiveAt: new Date(),
    };
    this.sessions.set(session.sessionId, session);
    return session;
  }

  /**
   * 更新会话状态
   */
  protected updateSession(
    sessionId: string,
    updates: Partial<SignSession>,
  ): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      Object.assign(session, updates, { lastActiveAt: new Date() });
    }
  }

  // =========================================================================
  // 节点管理
  // =========================================================================

  /**
   * 注册签名节点
   */
  registerNode(node: SignerNode): void {
    this.nodes.set(node.id, node);
  }

  /**
   * 移除签名节点
   */
  removeNode(nodeId: string): void {
    this.nodes.delete(nodeId);
  }

  /**
   * 获取所有签名节点
   */
  getAllNodes(): SignerNode[] {
    return Array.from(this.nodes.values());
  }

  /**
   * 获取在线节点
   */
  getOnlineNodes(): SignerNode[] {
    return this.getAllNodes().filter(
      (n) => n.status === SignerNodeStatus.ONLINE,
    );
  }

  /**
   * 更新节点状态
   */
  updateNodeStatus(nodeId: string, status: SignerNodeStatus): void {
    const node = this.nodes.get(nodeId);
    if (node) {
      node.status = status;
      node.updatedAt = new Date();
      if (status === SignerNodeStatus.ONLINE) {
        node.lastHeartbeatAt = new Date();
      }
    }
  }

  /**
   * 检查节点是否存在且在线
   */
  protected isNodeAvailable(nodeId: string): boolean {
    const node = this.nodes.get(nodeId);
    return !!node && node.status === SignerNodeStatus.ONLINE;
  }

  /**
   * 选择签名节点
   *
   * 从可用节点中选择足够数量的节点参与签名
   */
  protected selectSignerNodes(
    keyRef: string,
    threshold: number,
  ): string[] {
    const shares = this.keyShares.get(keyRef) || [];
    const activeShares = shares.filter(
      (s) =>
        s.status === KeyShareStatus.ACTIVE &&
        this.isNodeAvailable(s.nodeId),
    );

    if (activeShares.length < threshold) {
      throw new MPCError(
        MPCErrorCode.INSUFFICIENT_SIGNERS,
        `可用签名节点不足: 需要 ${threshold} 个，实际 ${activeShares.length} 个`,
      );
    }

    return activeShares
      .slice(0, threshold)
      .map((s) => s.nodeId);
  }

  // =========================================================================
  // 通信
  // =========================================================================

  /**
   * 设置通信通道
   */
  setCommunicationChannel(channel: NodeCommunicationChannel): void {
    this.communicationChannel = channel;
  }

  /**
   * 发送签名消息
   */
  protected async sendSignMessage(message: SignMessage): Promise<void> {
    if (!this.communicationChannel) {
      throw new MPCError(
        MPCErrorCode.INTERNAL_ERROR,
        '通信通道未设置',
      );
    }
    await this.communicationChannel.sendMessage(message);
  }

  /**
   * 广播签名消息
   */
  protected async broadcastSignMessage(
    message: Omit<SignMessage, 'toNodeIds'>,
  ): Promise<void> {
    if (!this.communicationChannel) {
      throw new MPCError(
        MPCErrorCode.INTERNAL_ERROR,
        '通信通道未设置',
      );
    }
    await this.communicationChannel.broadcastMessage(message);
  }

  // =========================================================================
  // 密钥分片管理
  // =========================================================================

  /**
   * 获取密钥分片信息
   */
  getKeyShares(keyRef: string): KeyShareInfo[] {
    return this.keyShares.get(keyRef) || [];
  }

  /**
   * 添加密钥分片信息
   */
  protected addKeyShares(keyRef: string, shares: KeyShareInfo[]): void {
    this.keyShares.set(keyRef, shares);
  }

  /**
   * 更新密钥分片状态
   */
  protected updateKeyShareStatus(
    keyRef: string,
    shareId: string,
    status: KeyShareStatus,
  ): void {
    const shares = this.keyShares.get(keyRef);
    if (shares) {
      const share = shares.find((s) => s.id === shareId);
      if (share) {
        share.status = status;
        share.updatedAt = new Date();
      }
    }
  }

  // =========================================================================
  // 统计信息
  // =========================================================================

  /**
   * 获取统计信息
   */
  getStats() {
    return {
      ...this.stats,
      activeSessions: this.sessions.size,
      totalNodes: this.nodes.size,
      onlineNodes: this.getOnlineNodes().length,
      successRate:
        this.stats.totalSignatures > 0
          ? (this.stats.totalSignatures - this.stats.failedSignatures) /
            this.stats.totalSignatures
          : 0,
    };
  }

  // =========================================================================
  // 工具方法
  // =========================================================================

  /**
   * 生成唯一 ID
   */
  protected generateId(prefix: string): string {
    return `${prefix}_${Date.now().toString(36)}_${Math.random()
      .toString(36)
      .slice(2, 10)}`;
  }

  /**
   * 计算消息哈希
   */
  protected hashMessage(message: string, algorithm: SignAlgorithm): string {
    // 简单的哈希实现，实际应使用加密库
    let hash = 0;
    for (let i = 0; i < message.length; i++) {
      const char = message.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16).padStart(64, '0');
  }

  /**
   * 从公钥派生地址
   */
  protected deriveAddress(
    publicKey: string,
    chainType: ChainType,
  ): string {
    switch (chainType) {
      case ChainType.EVM:
        return '0x' + this.hashMessage(publicKey, SignAlgorithm.ECDSA_SECP256K1).slice(-40);
      case ChainType.SOLANA:
        return publicKey.slice(0, 44);
      case ChainType.BITCOIN:
        return 'bc1' + publicKey.slice(0, 42).toLowerCase();
      case ChainType.TRON:
        return 'T' + publicKey.slice(0, 33);
      default:
        return publicKey;
    }
  }

  /**
   * 清理超时会话
   */
  protected cleanupExpiredSessions(): void {
    const now = new Date();
    const timeoutMs = this.options.signTimeoutMs || 30000;

    for (const [sessionId, session] of this.sessions) {
      const elapsed = now.getTime() - session.lastActiveAt.getTime();
      if (elapsed > timeoutMs) {
        this.sessions.delete(sessionId);
        this.stats.failedSignatures++;
      }
    }
  }
}
