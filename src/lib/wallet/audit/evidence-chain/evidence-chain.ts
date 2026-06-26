/**
 * 证据链主类 (EvidenceChain)
 *
 * 功能：
 *  - 链式哈希结构，不可篡改
 *  - 定期锚定到区块链
 *  - 证据链区块生成
 *  - 默克尔树集成
 *  - 完整性验证
 *  - 证据收集和管理
 *  - 链上锚定
 *  - 审计验证
 */

import {
  EvidenceChainBlock,
  EvidenceChainConfig,
  DEFAULT_EVIDENCE_CHAIN_CONFIG,
  HashAlgorithm,
  AuditLogEntry,
  AuditEvidence,
  AuditErrorCode,
  AuditError,
  MerkleProof,
} from '../audit.types';
import { HashingService } from './hashing.service';
import { MerkleTree } from './merkle-tree';

// ============================================================================
// 待处理条目
// ============================================================================

interface PendingEntry {
  id: string;
  type: 'audit_log' | 'evidence';
  data: AuditLogEntry | AuditEvidence;
  timestamp: number;
}

// ============================================================================
// 链验证结果
// ============================================================================

export interface ChainVerificationResult {
  valid: boolean;
  verifiedBlocks: number;
  totalBlocks: number;
  invalidBlocks: number[];
  firstInvalidBlock?: number;
  verificationTimeMs: number;
  details?: {
    blockIndex: number;
    blockId: string;
    expectedHash: string;
    actualHash: string;
  }[];
}

// ============================================================================
// 锚定结果
// ============================================================================

export interface AnchorResult {
  success: boolean;
  blockIndex: number;
  blockId: string;
  txHash?: string;
  chainId?: string;
  anchorTime: number;
  gasUsed?: string;
  error?: string;
}

// ============================================================================
// 证据链主类
// ============================================================================

export class EvidenceChain {
  private config: Required<EvidenceChainConfig>;
  private blocks: EvidenceChainBlock[] = [];
  private pendingEntries: PendingEntry[] = [];
  private hashingService: HashingService;
  private merkleTree: MerkleTree | null = null;
  private genesisHash: string = '';
  private blockCounter = 0;
  private lastBlockHash: string = '';
  private anchorTimer: ReturnType<typeof setInterval> | null = null;
  private blockTimer: ReturnType<typeof setInterval> | null = null;
  private isInitialized = false;
  private anchorCallback?: (block: EvidenceChainBlock) => Promise<AnchorResult>;
  private onBlockCreated?: (block: EvidenceChainBlock) => void;
  private onAnchorComplete?: (result: AnchorResult) => void;
  private onError?: (error: AuditError) => void;

  // ========================================================================
  // 构造函数
  // ========================================================================

  constructor(
    config?: Partial<EvidenceChainConfig>,
    hashingService?: HashingService
  ) {
    this.config = { ...DEFAULT_EVIDENCE_CHAIN_CONFIG, ...config } as Required<EvidenceChainConfig>;
    this.hashingService = hashingService || new HashingService({
      defaultAlgorithm: this.config.hashAlgorithm,
    });
  }

  // ========================================================================
  // 初始化
  // ========================================================================

  /**
   * 初始化证据链
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    this.genesisHash = await this.generateGenesisHash();
    this.lastBlockHash = this.genesisHash;

    if (this.config.merkleTreeEnabled) {
      this.merkleTree = new MerkleTree([], {
        algorithm: this.config.hashAlgorithm,
        sortPairs: true,
      });
    }

    this.startBlockTimer();

    if (this.config.chainAnchorEnabled) {
      this.startAnchorTimer();
    }

    this.isInitialized = true;
  }

  /**
   * 生成创世区块哈希
   */
  private async generateGenesisHash(): Promise<string> {
    const genesisData = {
      timestamp: Date.now(),
      version: 1,
      genesis: true,
      algorithm: this.config.hashAlgorithm,
    };

    const result = await this.hashingService.hash(JSON.stringify(genesisData));
    return result.hash;
  }

  /**
   * 启动区块生成定时器
   */
  private startBlockTimer(): void {
    if (this.blockTimer) return;

    this.blockTimer = setInterval(() => {
      this.tryCreateBlock().catch((err) => {
        this.handleError(new AuditError(
          AuditErrorCode.EVIDENCE_CHAIN_BROKEN,
          '区块生成失败',
          { error: err instanceof Error ? err.message : String(err) }
        ));
      });
    }, this.config.blockIntervalMs);
  }

  /**
   * 停止区块生成定时器
   */
  private stopBlockTimer(): void {
    if (this.blockTimer) {
      clearInterval(this.blockTimer);
      this.blockTimer = null;
    }
  }

  /**
   * 启动锚定定时器
   */
  private startAnchorTimer(): void {
    if (this.anchorTimer) return;

    const anchorInterval = this.config.blockIntervalMs * this.config.anchorIntervalBlocks;

    this.anchorTimer = setInterval(() => {
      this.anchorLatestBlock().catch((err) => {
        this.handleError(new AuditError(
          AuditErrorCode.EVIDENCE_CHAIN_BROKEN,
          '链上锚定失败',
          { error: err instanceof Error ? err.message : String(err) }
        ));
      });
    }, anchorInterval);
  }

  /**
   * 停止锚定定时器
   */
  private stopAnchorTimer(): void {
    if (this.anchorTimer) {
      clearInterval(this.anchorTimer);
      this.anchorTimer = null;
    }
  }

  // ========================================================================
  // 条目添加方法
  // ========================================================================

  /**
   * 添加审计日志条目到待处理队列
   */
  async addAuditLog(entry: AuditLogEntry): Promise<boolean> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const pendingEntry: PendingEntry = {
      id: entry.id,
      type: 'audit_log',
      data: entry,
      timestamp: entry.timestamp,
    };

    this.pendingEntries.push(pendingEntry);

    if (this.pendingEntries.length >= this.config.blockSize) {
      await this.tryCreateBlock();
    }

    return true;
  }

  /**
   * 批量添加审计日志
   */
  async addAuditLogs(entries: AuditLogEntry[]): Promise<number> {
    let count = 0;
    for (const entry of entries) {
      if (await this.addAuditLog(entry)) {
        count++;
      }
    }
    return count;
  }

  /**
   * 添加证据到待处理队列
   */
  async addEvidence(evidence: AuditEvidence): Promise<boolean> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const pendingEntry: PendingEntry = {
      id: evidence.id,
      type: 'evidence',
      data: evidence,
      timestamp: evidence.collectedAt,
    };

    this.pendingEntries.push(pendingEntry);

    if (this.pendingEntries.length >= this.config.blockSize) {
      await this.tryCreateBlock();
    }

    return true;
  }

  /**
   * 批量添加证据
   */
  async addEvidences(evidences: AuditEvidence[]): Promise<number> {
    let count = 0;
    for (const evidence of evidences) {
      if (await this.addEvidence(evidence)) {
        count++;
      }
    }
    return count;
  }

  // ========================================================================
  // 区块生成
  // ========================================================================

  /**
   * 尝试创建新区块
   */
  private async tryCreateBlock(): Promise<EvidenceChainBlock | null> {
    if (this.pendingEntries.length === 0) {
      return null;
    }

    const entriesToProcess = this.pendingEntries.slice(0, this.config.blockSize);
    this.pendingEntries = this.pendingEntries.slice(this.config.blockSize);

    return this.createBlock(entriesToProcess);
  }

  /**
   * 创建新区块
   */
  private async createBlock(entries: PendingEntry[]): Promise<EvidenceChainBlock> {
    const index = this.blocks.length;
    const blockId = this.generateBlockId(index);
    const timestamp = Date.now();

    const auditLogIds = entries
      .filter((e) => e.type === 'audit_log')
      .map((e) => e.id);

    const evidenceIds = entries
      .filter((e) => e.type === 'evidence')
      .map((e) => e.id);

    const transactionCount = entries.length;

    let merkleRoot = '';
    if (this.config.merkleTreeEnabled) {
      const leafHashes = await Promise.all(
        entries.map((entry) => this.hashEntry(entry))
      );

      this.merkleTree = new MerkleTree(leafHashes, {
        algorithm: this.config.hashAlgorithm,
        sortPairs: true,
      });
      merkleRoot = await this.merkleTree.getRoot();
    } else {
      const combined = entries.map((e) => e.id).sort().join('');
      const hashResult = await this.hashingService.hash(combined);
      merkleRoot = hashResult.hash;
    }

    const previousHash = this.lastBlockHash;

    const blockData = {
      index,
      blockId,
      previousHash,
      timestamp,
      merkleRoot,
      transactionCount,
      auditLogIds,
      evidenceIds,
      version: 1,
    };

    const hashResult = await this.hashingService.hash(JSON.stringify(blockData));
    const hash = hashResult.hash;

    const validator = this.config.validatorAddress || 'system';
    const signature = await this.signBlock(hash);

    const block: EvidenceChainBlock = {
      index,
      blockId,
      previousHash,
      hash,
      timestamp,
      merkleRoot,
      transactionCount,
      auditLogIds,
      evidenceIds,
      validator,
      signature,
      version: 1,
      metadata: {
        batchId: `batch_${Date.now()}_${index}`,
        periodStart: entries[0]?.timestamp || timestamp,
        periodEnd: entries[entries.length - 1]?.timestamp || timestamp,
        totalLogs: auditLogIds.length,
      },
    };

    this.blocks.push(block);
    this.lastBlockHash = hash;
    this.blockCounter++;

    if (this.onBlockCreated) {
      try {
        this.onBlockCreated(block);
      } catch (err) {
        this.handleError(new AuditError(
          AuditErrorCode.EVIDENCE_CHAIN_BROKEN,
          '区块创建回调失败',
          { error: err instanceof Error ? err.message : String(err) }
        ));
      }
    }

    return block;
  }

  /**
   * 强制创建区块（即使未满）
   */
  async forceCreateBlock(): Promise<EvidenceChainBlock | null> {
    if (this.pendingEntries.length === 0) {
      return null;
    }

    return this.tryCreateBlock();
  }

  // ========================================================================
  // 哈希和签名
  // ========================================================================

  /**
   * 哈希待处理条目
   */
  private async hashEntry(entry: PendingEntry): Promise<string> {
    const data = {
      id: entry.id,
      type: entry.type,
      timestamp: entry.timestamp,
      data: entry.data,
    };

    const result = await this.hashingService.hash(JSON.stringify(data));
    return result.hash;
  }

  /**
   * 签名区块
   */
  private async signBlock(blockHash: string): Promise<string> {
    if (!this.config.validatorPrivateKey) {
      return `sig_${blockHash.slice(0, 32)}`;
    }

    const signatureData = blockHash + this.config.validatorPrivateKey;
    const result = await this.hashingService.hash(signatureData);
    return result.hash;
  }

  /**
   * 验证区块签名
   */
  async verifyBlockSignature(block: EvidenceChainBlock): Promise<boolean> {
    if (!this.config.validatorPrivateKey) {
      return block.signature.startsWith('sig_');
    }

    const expectedSignature = await this.signBlock(block.hash);
    return block.signature === expectedSignature;
  }

  // ========================================================================
  // 链上锚定
  // ========================================================================

  /**
   * 设置锚定回调
   */
  setAnchorCallback(callback: (block: EvidenceChainBlock) => Promise<AnchorResult>): void {
    this.anchorCallback = callback;
  }

  /**
   * 锚定最新区块到区块链
   */
  async anchorLatestBlock(): Promise<AnchorResult | null> {
    if (!this.config.chainAnchorEnabled || !this.anchorCallback) {
      return null;
    }

    const latestBlock = this.getLatestBlock();
    if (!latestBlock || latestBlock.chainAnchor) {
      return null;
    }

    try {
      const result = await this.anchorCallback(latestBlock);

      if (result.success && result.txHash) {
        latestBlock.chainAnchor = {
          chainId: result.chainId || this.config.anchorChainId || 'unknown',
          txHash: result.txHash,
          blockNumber: 0,
          anchoredAt: result.anchorTime,
          confirmations: 1,
        };
      }

      if (this.onAnchorComplete) {
        this.onAnchorComplete(result);
      }

      return result;
    } catch (err) {
      this.handleError(new AuditError(
        AuditErrorCode.EVIDENCE_CHAIN_BROKEN,
        '链上锚定异常',
        { error: err instanceof Error ? err.message : String(err) }
      ));

      return {
        success: false,
        blockIndex: latestBlock.index,
        blockId: latestBlock.blockId,
        anchorTime: Date.now(),
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }

  /**
   * 锚定指定区块
   */
  async anchorBlock(blockIndex: number): Promise<AnchorResult | null> {
    const block = this.blocks[blockIndex];
    if (!block) return null;

    if (!this.anchorCallback) return null;

    return this.anchorCallback(block);
  }

  // ========================================================================
  // 验证方法
  // ========================================================================

  /**
   * 验证整个链的完整性
   */
  async verifyChain(): Promise<ChainVerificationResult> {
    const startTime = Date.now();
    const details: ChainVerificationResult['details'] = [];
    let invalidBlocks: number[] = [];
    let firstInvalidBlock: number | undefined;

    for (let i = 0; i < this.blocks.length; i++) {
      const block = this.blocks[i];

      const isValid = await this.verifyBlock(block, i);

      if (!isValid) {
        invalidBlocks.push(i);
        if (firstInvalidBlock === undefined) {
          firstInvalidBlock = i;
        }

        const expectedHash = i === 0
          ? this.genesisHash
          : this.blocks[i - 1].hash;

        details.push({
          blockIndex: i,
          blockId: block.blockId,
          expectedHash,
          actualHash: block.previousHash,
        });
      }
    }

    const valid = invalidBlocks.length === 0;

    return {
      valid,
      verifiedBlocks: this.blocks.length - invalidBlocks.length,
      totalBlocks: this.blocks.length,
      invalidBlocks,
      firstInvalidBlock,
      verificationTimeMs: Date.now() - startTime,
      details,
    };
  }

  /**
   * 验证单个区块
   */
  private async verifyBlock(block: EvidenceChainBlock, index: number): Promise<boolean> {
    if (block.index !== index) {
      return false;
    }

    const expectedPreviousHash = index === 0
      ? this.genesisHash
      : this.blocks[index - 1].hash;

    if (block.previousHash !== expectedPreviousHash) {
      return false;
    }

    const blockData = {
      index: block.index,
      blockId: block.blockId,
      previousHash: block.previousHash,
      timestamp: block.timestamp,
      merkleRoot: block.merkleRoot,
      transactionCount: block.transactionCount,
      auditLogIds: block.auditLogIds,
      evidenceIds: block.evidenceIds,
      version: block.version,
    };

    const hashResult = await this.hashingService.hash(JSON.stringify(blockData));
    if (block.hash !== hashResult.hash) {
      return false;
    }

    const signatureValid = await this.verifyBlockSignature(block);
    if (!signatureValid) {
      return false;
    }

    return true;
  }

  /**
   * 验证审计日志是否在链上
   */
  async verifyAuditLogInclusion(logId: string): Promise<{
    included: boolean;
    blockIndex?: number;
    merkleProof?: MerkleProof;
  }> {
    for (let i = 0; i < this.blocks.length; i++) {
      const block = this.blocks[i];
      const logIndex = block.auditLogIds.indexOf(logId);

      if (logIndex !== -1) {
        if (this.config.merkleTreeEnabled) {
          const proof: MerkleProof = {
            root: block.merkleRoot,
            leaf: '',
            proof: [],
            position: logIndex,
            verified: false,
          };
          return { included: true, blockIndex: i, merkleProof: proof };
        }
        return { included: true, blockIndex: i };
      }
    }

    return { included: false };
  }

  /**
   * 获取审计日志所在的区块
   */
  getBlockForLog(logId: string): EvidenceChainBlock | null {
    for (const block of this.blocks) {
      if (block.auditLogIds.includes(logId)) {
        return block;
      }
    }
    return null;
  }

  /**
   * 获取证据所在的区块
   */
  getBlockForEvidence(evidenceId: string): EvidenceChainBlock | null {
    for (const block of this.blocks) {
      if (block.evidenceIds.includes(evidenceId)) {
        return block;
      }
    }
    return null;
  }

  // ========================================================================
  // 查询方法
  // ========================================================================

  /**
   * 获取最新区块
   */
  getLatestBlock(): EvidenceChainBlock | null {
    if (this.blocks.length === 0) return null;
    return this.blocks[this.blocks.length - 1];
  }

  /**
   * 根据索引获取区块
   */
  getBlockByIndex(index: number): EvidenceChainBlock | null {
    if (index < 0 || index >= this.blocks.length) return null;
    return this.blocks[index];
  }

  /**
   * 根据区块 ID 获取区块
   */
  getBlockById(blockId: string): EvidenceChainBlock | null {
    return this.blocks.find((b) => b.blockId === blockId) || null;
  }

  /**
   * 获取区块数量
   */
  getBlockCount(): number {
    return this.blocks.length;
  }

  /**
   * 获取所有区块
   */
  getAllBlocks(): EvidenceChainBlock[] {
    return [...this.blocks];
  }

  /**
   * 获取待处理条目数量
   */
  getPendingCount(): number {
    return this.pendingEntries.length;
  }

  /**
   * 获取创世哈希
   */
  getGenesisHash(): string {
    return this.genesisHash;
  }

  /**
   * 获取最新区块哈希
   */
  getLatestBlockHash(): string {
    return this.lastBlockHash;
  }

  // ========================================================================
  // 导出和导入
  // ========================================================================

  /**
   * 导出链数据
   */
  exportChain(): {
    genesisHash: string;
    blocks: EvidenceChainBlock[];
    config: EvidenceChainConfig;
    blockCount: number;
    lastBlockHash: string;
  } {
    return {
      genesisHash: this.genesisHash,
      blocks: [...this.blocks],
      config: { ...this.config },
      blockCount: this.blocks.length,
      lastBlockHash: this.lastBlockHash,
    };
  }

  /**
   * 导入链数据
   */
  async importChain(data: {
    genesisHash: string;
    blocks: EvidenceChainBlock[];
  }): Promise<void> {
    this.genesisHash = data.genesisHash;
    this.blocks = [...data.blocks];
    this.lastBlockHash = data.blocks.length > 0
      ? data.blocks[data.blocks.length - 1].hash
      : data.genesisHash;
    this.blockCounter = data.blocks.length;
    this.isInitialized = true;
  }

  // ========================================================================
  // 事件回调设置
  // ========================================================================

  /**
   * 设置区块创建回调
   */
  setOnBlockCreated(callback: (block: EvidenceChainBlock) => void): void {
    this.onBlockCreated = callback;
  }

  /**
   * 设置锚定完成回调
   */
  setOnAnchorComplete(callback: (result: AnchorResult) => void): void {
    this.onAnchorComplete = callback;
  }

  /**
   * 设置错误回调
   */
  setOnError(callback: (error: AuditError) => void): void {
    this.onError = callback;
  }

  // ========================================================================
  // 内部工具方法
  // ========================================================================

  /**
   * 生成区块 ID
   */
  private generateBlockId(index: number): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).slice(2, 10);
    return `block_${index.toString().padStart(8, '0')}_${timestamp}_${random}`;
  }

  /**
   * 处理错误
   */
  private handleError(error: AuditError): void {
    if (this.onError) {
      this.onError(error);
    } else {
      console.error('[EvidenceChain]', error.message, error.details);
    }
  }

  // ========================================================================
  // 生命周期方法
  // ========================================================================

  /**
   * 关闭证据链
   */
  async shutdown(): Promise<void> {
    this.stopBlockTimer();
    this.stopAnchorTimer();

    if (this.pendingEntries.length > 0) {
      await this.forceCreateBlock();
    }

    this.isInitialized = false;
  }

  /**
   * 重置证据链
   */
  async reset(): Promise<void> {
    this.stopBlockTimer();
    this.stopAnchorTimer();
    this.blocks = [];
    this.pendingEntries = [];
    this.merkleTree = null;
    this.genesisHash = '';
    this.lastBlockHash = '';
    this.blockCounter = 0;
    this.isInitialized = false;
  }
}

// ============================================================================
// 证据链工厂
// ============================================================================

export class EvidenceChainFactory {
  static create(config?: Partial<EvidenceChainConfig>): EvidenceChain {
    return new EvidenceChain(config);
  }

  static async createAndInitialize(config?: Partial<EvidenceChainConfig>): Promise<EvidenceChain> {
    const chain = new EvidenceChain(config);
    await chain.initialize();
    return chain;
  }
}

// ============================================================================
// 默认导出
// ============================================================================

export default EvidenceChain;
