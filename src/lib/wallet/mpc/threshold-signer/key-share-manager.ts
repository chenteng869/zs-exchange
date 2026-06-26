/**
 * 密钥分片管理器 (KeyShareManager)
 *
 * 负责：
 *  - 密钥分片的存储与管理
 *  - 分片状态跟踪与更新
 *  - 分片版本控制与轮换
 *  - 分片健康检查
 *  - 分片分布优化
 *  - 分片安全审计
 */

import {
  KeyShareInfo,
  KeyShareStatus,
  SignerNodeStatus,
  MPCError,
  MPCErrorCode,
  ChainType,
} from '../mpc.types';

// =============================================================================
// 密钥分片管理器配置
// =============================================================================

export interface KeyShareManagerOptions {
  /** 最大密钥版本数 */
  maxKeyVersions?: number;
  /** 分片健康检查间隔（毫秒） */
  healthCheckIntervalMs?: number;
  /** 是否启用自动健康检查 */
  enableAutoHealthCheck?: boolean;
  /** 分片告警阈值（在线分片数/门限值的比例） */
  warningThresholdRatio?: number;
}

// =============================================================================
// 分片健康状态
// =============================================================================

export interface KeyShareHealth {
  /** 密钥引用 ID */
  keyRef: string;
  /** 是否健康 */
  healthy: boolean;
  /** 当前版本 */
  currentVersion: number;
  /** 激活分片数 */
  activeShares: number;
  /** 总分片数 */
  totalShares: number;
  /** 在线节点数 */
  onlineNodes: number;
  /** 离线节点数 */
  offlineNodes: number;
  /** 门限值 */
  threshold: number;
  /** 是否可以签名 */
  canSign: boolean;
  /** 风险等级 */
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  /** 健康检查时间 */
  checkedAt: Date;
  /** 详细状态 */
  details: {
    nodeId: string;
    shareIndex: number;
    status: KeyShareStatus;
    nodeOnline: boolean;
    lastUsedAt?: Date;
  }[];
}

// =============================================================================
// 分片分布统计
// =============================================================================

export interface KeyShareDistribution {
  /** 密钥引用 ID */
  keyRef: string;
  /** 分片总数 */
  totalShares: number;
  /** 激活分片数 */
  activeShares: number;
  /** 版本数 */
  versionCount: number;
  /** 地理位置分布 */
  regionDistribution: Record<string, number>;
  /** 节点分布 */
  nodeDistribution: Record<string, number>;
  /** 状态分布 */
  statusDistribution: Record<KeyShareStatus, number>;
}

// =============================================================================
// 密钥分片管理器类
// =============================================================================

export class KeyShareManager {
  private keyShares: Map<string, KeyShareInfo[]> = new Map();
  private maxKeyVersions: number;
  private healthCheckIntervalMs: number;
  private enableAutoHealthCheck: boolean;
  private warningThresholdRatio: number;
  private healthCheckTimer?: NodeJS.Timeout;
  private nodeStatusMap: Map<string, SignerNodeStatus> = new Map();

  private stats = {
    totalKeyRefs: 0,
    totalShares: 0,
    totalRotations: 0,
    totalRevocations: 0,
    totalHealthChecks: 0,
    failedHealthChecks: 0,
  };

  constructor(options: KeyShareManagerOptions = {}) {
    this.maxKeyVersions = options.maxKeyVersions || 5;
    this.healthCheckIntervalMs = options.healthCheckIntervalMs || 5 * 60 * 1000;
    this.enableAutoHealthCheck = options.enableAutoHealthCheck ?? false;
    this.warningThresholdRatio = options.warningThresholdRatio || 1.5;

    if (this.enableAutoHealthCheck) {
      this.startHealthCheck();
    }
  }

  // =========================================================================
  // 分片存储与检索
  // =========================================================================

  /**
   * 添加密钥分片
   */
  addKeyShares(keyRef: string, shares: KeyShareInfo[]): void {
    const existing = this.keyShares.get(keyRef) || [];
    const updated = [...existing, ...shares];

    this.cleanupOldVersions(keyRef, updated);

    this.keyShares.set(keyRef, updated);

    if (!existing.length) {
      this.stats.totalKeyRefs++;
    }
    this.stats.totalShares += shares.length;
  }

  /**
   * 获取密钥分片
   */
  getKeyShares(keyRef: string, version?: number): KeyShareInfo[] {
    const shares = this.keyShares.get(keyRef) || [];

    if (version !== undefined) {
      return shares.filter((s) => s.version === version);
    }

    return shares;
  }

  /**
   * 获取激活的密钥分片
   */
  getActiveShares(keyRef: string, version?: number): KeyShareInfo[] {
    const shares = this.getKeyShares(keyRef, version);
    return shares.filter((s) => s.status === KeyShareStatus.ACTIVE);
  }

  /**
   * 获取最新版本的激活分片
   */
  getLatestActiveShares(keyRef: string): KeyShareInfo[] {
    const shares = this.getKeyShares(keyRef);
    if (shares.length === 0) return [];

    const latestVersion = Math.max(...shares.map((s) => s.version));
    return shares.filter(
      (s) => s.version === latestVersion && s.status === KeyShareStatus.ACTIVE,
    );
  }

  /**
   * 获取单个分片
   */
  getKeyShare(shareId: string): KeyShareInfo | undefined {
    for (const shares of this.keyShares.values()) {
      const share = shares.find((s) => s.id === shareId);
      if (share) return share;
    }
    return undefined;
  }

  /**
   * 检查密钥是否存在
   */
  hasKey(keyRef: string): boolean {
    return this.keyShares.has(keyRef);
  }

  /**
   * 获取所有密钥引用
   */
  getAllKeyRefs(): string[] {
    return Array.from(this.keyShares.keys());
  }

  // =========================================================================
  // 分片状态管理
  // =========================================================================

  /**
   * 更新分片状态
   */
  updateShareStatus(
    keyRef: string,
    shareId: string,
    status: KeyShareStatus,
  ): KeyShareInfo {
    const shares = this.keyShares.get(keyRef);
    if (!shares) {
      throw new MPCError(
        MPCErrorCode.KEY_SHARE_NOT_FOUND,
        `密钥分片不存在: ${keyRef}`,
      );
    }

    const share = shares.find((s) => s.id === shareId);
    if (!share) {
      throw new MPCError(
        MPCErrorCode.KEY_SHARE_NOT_FOUND,
        `分片不存在: ${shareId}`,
      );
    }

    if (status === KeyShareStatus.REVOKED) {
      this.stats.totalRevocations++;
    }

    share.status = status;
    share.updatedAt = new Date();

    return share;
  }

  /**
   * 标记分片为已使用
   */
  markShareUsed(keyRef: string, shareId: string): void {
    const shares = this.keyShares.get(keyRef);
    if (shares) {
      const share = shares.find((s) => s.id === shareId);
      if (share) {
        share.lastUsedAt = new Date();
      }
    }
  }

  /**
   * 更新节点状态
   */
  updateNodeStatus(nodeId: string, status: SignerNodeStatus): void {
    this.nodeStatusMap.set(nodeId, status);
  }

  /**
   * 检查节点是否在线
   */
  isNodeOnline(nodeId: string): boolean {
    const status = this.nodeStatusMap.get(nodeId);
    return status === SignerNodeStatus.ONLINE;
  }

  // =========================================================================
  // 版本管理
  // =========================================================================

  /**
   * 获取当前版本号
   */
  getCurrentVersion(keyRef: string): number {
    const shares = this.getKeyShares(keyRef);
    if (shares.length === 0) return 0;
    return Math.max(...shares.map((s) => s.version));
  }

  /**
   * 获取所有版本号
   */
  getAllVersions(keyRef: string): number[] {
    const shares = this.getKeyShares(keyRef);
    const versions = new Set(shares.map((s) => s.version));
    return Array.from(versions).sort((a, b) => b - a);
  }

  /**
   * 清理旧版本
   */
  private cleanupOldVersions(keyRef: string, shares: KeyShareInfo[]): void {
    const versions = new Set(shares.map((s) => s.version));
    if (versions.size <= this.maxKeyVersions) return;

    const sortedVersions = Array.from(versions).sort((a, b) => b - a);
    const versionsToKeep = new Set(sortedVersions.slice(0, this.maxKeyVersions));

    for (const share of shares) {
      if (!versionsToKeep.has(share.version) && share.status === KeyShareStatus.ACTIVE) {
        share.status = KeyShareStatus.ROTATED;
        share.updatedAt = new Date();
      }
    }
  }

  /**
   * 轮换密钥（增加版本号）
   */
  rotateKey(
    keyRef: string,
    newShares: KeyShareInfo[],
  ): KeyShareInfo[] {
    const currentVersion = this.getCurrentVersion(keyRef);
    const newVersion = currentVersion + 1;

    const currentShares = this.getActiveShares(keyRef, currentVersion);
    for (const share of currentShares) {
      share.status = KeyShareStatus.ROTATED;
      share.updatedAt = new Date();
    }

    const versionedNewShares = newShares.map((s) => ({
      ...s,
      version: newVersion,
    }));

    this.addKeyShares(keyRef, versionedNewShares);
    this.stats.totalRotations++;

    return versionedNewShares;
  }

  // =========================================================================
  // 健康检查
  // =========================================================================

  /**
   * 启动健康检查
   */
  private startHealthCheck(): void {
    this.healthCheckTimer = setInterval(() => {
      this.performHealthCheckAll();
    }, this.healthCheckIntervalMs) as unknown as NodeJS.Timeout;
  }

  /**
   * 对所有密钥执行健康检查
   */
  performHealthCheckAll(): KeyShareHealth[] {
    const results: KeyShareHealth[] = [];
    const keyRefs = this.getAllKeyRefs();

    for (const keyRef of keyRefs) {
      try {
        const health = this.checkKeyHealth(keyRef);
        results.push(health);
      } catch {
        this.stats.failedHealthChecks++;
      }
    }

    this.stats.totalHealthChecks++;

    return results;
  }

  /**
   * 检查单个密钥的健康状态
   */
  checkKeyHealth(keyRef: string): KeyShareHealth {
    const shares = this.getLatestActiveShares(keyRef);
    const allShares = this.getKeyShares(keyRef);
    const currentVersion = this.getCurrentVersion(keyRef);

    const threshold = Math.ceil(shares.length / 2);

    const details = shares.map((share) => ({
      nodeId: share.nodeId,
      shareIndex: share.shareIndex,
      status: share.status,
      nodeOnline: this.isNodeOnline(share.nodeId),
      lastUsedAt: share.lastUsedAt,
    }));

    const onlineNodes = details.filter((d) => d.nodeOnline).length;
    const offlineNodes = details.filter((d) => !d.nodeOnline).length;
    const canSign = onlineNodes >= threshold;

    let riskLevel: KeyShareHealth['riskLevel'] = 'low';
    const ratio = onlineNodes / threshold;

    if (ratio < 1) {
      riskLevel = 'critical';
    } else if (ratio < this.warningThresholdRatio) {
      riskLevel = 'high';
    } else if (ratio < 2) {
      riskLevel = 'medium';
    }

    return {
      keyRef,
      healthy: canSign && riskLevel !== 'critical',
      currentVersion,
      activeShares: shares.length,
      totalShares: allShares.length,
      onlineNodes,
      offlineNodes,
      threshold,
      canSign,
      riskLevel,
      checkedAt: new Date(),
      details,
    };
  }

  /**
   * 获取不健康的密钥
   */
  getUnhealthyKeys(): KeyShareHealth[] {
    const keyRefs = this.getAllKeyRefs();
    const unhealthy: KeyShareHealth[] = [];

    for (const keyRef of keyRefs) {
      const health = this.checkKeyHealth(keyRef);
      if (!health.healthy) {
        unhealthy.push(health);
      }
    }

    return unhealthy;
  }

  // =========================================================================
  // 分片分布分析
  // =========================================================================

  /**
   * 获取分片分布统计
   */
  getKeyDistribution(keyRef: string): KeyShareDistribution {
    const shares = this.getKeyShares(keyRef);
    const activeShares = shares.filter(
      (s) => s.status === KeyShareStatus.ACTIVE,
    );
    const versions = new Set(shares.map((s) => s.version));

    const regionDistribution: Record<string, number> = {};
    const nodeDistribution: Record<string, number> = {};
    const statusDistribution: Record<KeyShareStatus, number> = {
      [KeyShareStatus.ACTIVE]: 0,
      [KeyShareStatus.ROTATED]: 0,
      [KeyShareStatus.REVOKED]: 0,
      [KeyShareStatus.COMPROMISED]: 0,
    };

    for (const share of shares) {
      nodeDistribution[share.nodeId] = (nodeDistribution[share.nodeId] || 0) + 1;
      statusDistribution[share.status]++;
    }

    return {
      keyRef,
      totalShares: shares.length,
      activeShares: activeShares.length,
      versionCount: versions.size,
      regionDistribution,
      nodeDistribution,
      statusDistribution,
    };
  }

  /**
   * 检查分片分布是否均匀
   */
  isDistributionBalanced(keyRef: string): boolean {
    const activeShares = this.getLatestActiveShares(keyRef);
    if (activeShares.length <= 1) return true;

    const nodeCounts = new Map<string, number>();
    for (const share of activeShares) {
      nodeCounts.set(share.nodeId, (nodeCounts.get(share.nodeId) || 0) + 1);
    }

    const counts = Array.from(nodeCounts.values());
    const maxCount = Math.max(...counts);
    const minCount = Math.min(...counts);

    return maxCount - minCount <= 1;
  }

  // =========================================================================
  // 分片查询与过滤
  // =========================================================================

  /**
   * 根据节点 ID 查询分片
   */
  getSharesByNode(nodeId: string): KeyShareInfo[] {
    const result: KeyShareInfo[] = [];
    for (const shares of this.keyShares.values()) {
      for (const share of shares) {
        if (share.nodeId === nodeId && share.status === KeyShareStatus.ACTIVE) {
          result.push(share);
        }
      }
    }
    return result;
  }

  /**
   * 根据状态查询分片
   */
  getSharesByStatus(status: KeyShareStatus): KeyShareInfo[] {
    const result: KeyShareInfo[] = [];
    for (const shares of this.keyShares.values()) {
      for (const share of shares) {
        if (share.status === status) {
          result.push(share);
        }
      }
    }
    return result;
  }

  /**
   * 根据 KMS 提供商查询分片
   */
  getSharesByKmsProvider(provider: string): KeyShareInfo[] {
    const result: KeyShareInfo[] = [];
    for (const shares of this.keyShares.values()) {
      for (const share of shares) {
        if (share.kmsProvider === provider) {
          result.push(share);
        }
      }
    }
    return result;
  }

  // =========================================================================
  // 分片删除与清理
  // =========================================================================

  /**
   * 删除密钥
   */
  removeKey(keyRef: string): void {
    const shares = this.keyShares.get(keyRef);
    if (shares) {
      this.stats.totalShares -= shares.length;
      this.stats.totalKeyRefs--;
    }
    this.keyShares.delete(keyRef);
  }

  /**
   * 清理已撤销的分片
   */
  cleanupRevokedShares(keyRef: string): number {
    const shares = this.keyShares.get(keyRef);
    if (!shares) return 0;

    const initialLength = shares.length;
    const filtered = shares.filter(
      (s) => s.status !== KeyShareStatus.REVOKED,
    );
    const removed = initialLength - filtered.length;

    this.keyShares.set(keyRef, filtered);
    this.stats.totalShares -= removed;

    return removed;
  }

  /**
   * 清理所有已撤销的分片
   */
  cleanupAllRevokedShares(): number {
    let totalRemoved = 0;
    for (const keyRef of this.getAllKeyRefs()) {
      totalRemoved += this.cleanupRevokedShares(keyRef);
    }
    return totalRemoved;
  }

  // =========================================================================
  // 统计信息
  // =========================================================================

  /**
   * 获取统计信息
   */
  getStats() {
    const keyRefs = this.getAllKeyRefs();
    const activeKeyCount = keyRefs.filter((keyRef) => {
      const health = this.checkKeyHealth(keyRef);
      return health.healthy;
    }).length;

    return {
      ...this.stats,
      activeKeys: activeKeyCount,
      unhealthyKeys: keyRefs.length - activeKeyCount,
      averageSharesPerKey:
        this.stats.totalKeyRefs > 0
          ? this.stats.totalShares / this.stats.totalKeyRefs
          : 0,
    };
  }

  /**
   * 获取详细统计
   */
  getDetailedStats() {
    const keyRefs = this.getAllKeyRefs();
    let totalActiveShares = 0;
    let totalRotatedShares = 0;
    let totalRevokedShares = 0;

    for (const keyRef of keyRefs) {
      const shares = this.getKeyShares(keyRef);
      totalActiveShares += shares.filter(
        (s) => s.status === KeyShareStatus.ACTIVE,
      ).length;
      totalRotatedShares += shares.filter(
        (s) => s.status === KeyShareStatus.ROTATED,
      ).length;
      totalRevokedShares += shares.filter(
        (s) => s.status === KeyShareStatus.REVOKED,
      ).length;
    }

    return {
      ...this.getStats(),
      totalActiveShares,
      totalRotatedShares,
      totalRevokedShares,
      totalKeys: keyRefs.length,
    };
  }

  // =========================================================================
  // 工具方法
  // =========================================================================

  /**
   * 生成唯一 ID
   */
  private generateId(prefix: string): string {
    return `${prefix}_${Date.now().toString(36)}_${Math.random()
      .toString(36)
      .slice(2, 10)}`;
  }

  /**
   * 验证分片完整性
   */
  validateShares(shares: KeyShareInfo[], threshold: number): boolean {
    if (shares.length < threshold) {
      return false;
    }

    const uniqueIndices = new Set(shares.map((s) => s.shareIndex));
    if (uniqueIndices.size !== shares.length) {
      return false;
    }

    const versions = new Set(shares.map((s) => s.version));
    if (versions.size !== 1) {
      return false;
    }

    const uniqueKeyRefs = new Set(shares.map((s) => s.keyRef));
    if (uniqueKeyRefs.size !== 1) {
      return false;
    }

    return true;
  }

  /**
   * 查找可用于签名的分片
   */
  findSigningShares(
    keyRef: string,
    threshold: number,
  ): KeyShareInfo[] | null {
    const activeShares = this.getLatestActiveShares(keyRef);
    const onlineShares = activeShares.filter((s) =>
      this.isNodeOnline(s.nodeId),
    );

    if (onlineShares.length < threshold) {
      return null;
    }

    return onlineShares.slice(0, threshold);
  }

  /**
   * 清理资源
   */
  dispose(): void {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
      this.healthCheckTimer = undefined;
    }
  }
}
