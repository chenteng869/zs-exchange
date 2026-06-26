/**
 * 默克尔树实现 (MerkleTree)
 *
 * 功能：
 *  - 默克尔树构建
 *  - 默克尔根计算
 *  - 默克尔证明生成
 *  - 默克尔证明验证
 *  - 增量更新
 *  - 批量验证
 *  - 多算法支持
 */

import {
  MerkleNode,
  MerkleProof,
  HashAlgorithm,
  AuditErrorCode,
  AuditError,
} from '../audit.types';
import { HashingService } from './hashing.service';

// ============================================================================
// 默克尔树配置接口
// ============================================================================

export interface MerkleTreeConfig {
  algorithm?: HashAlgorithm;
  sortPairs?: boolean;
  doubleHash?: boolean;
  hashLeaves?: boolean;
}

// ============================================================================
// 默克尔树类
// ============================================================================

export class MerkleTree {
  private leaves: string[] = [];
  private levels: string[][] = [];
  private root: string = '';
  private hashingService: HashingService;
  private config: Required<MerkleTreeConfig>;
  private isBuilt: boolean = false;

  // ========================================================================
  // 构造函数
  // ========================================================================

  constructor(
    leaves: string[] = [],
    config?: MerkleTreeConfig,
    hashingService?: HashingService
  ) {
    this.hashingService = hashingService || new HashingService();
    this.config = {
      algorithm: HashAlgorithm.SHA256,
      sortPairs: true,
      doubleHash: false,
      hashLeaves: true,
      ...config,
    };

    if (leaves.length > 0) {
      this.leaves = [...leaves];
    }
  }

  // ========================================================================
  // 叶子节点操作
  // ========================================================================

  /**
   * 添加叶子节点
   */
  async addLeaf(leaf: string): Promise<number> {
    const index = this.leaves.length;
    this.leaves.push(leaf);
    this.isBuilt = false;
    return index;
  }

  /**
   * 批量添加叶子节点
   */
  async addLeaves(leaves: string[]): Promise<number> {
    const startIndex = this.leaves.length;
    this.leaves.push(...leaves);
    this.isBuilt = false;
    return startIndex;
  }

  /**
   * 更新叶子节点
   */
  async updateLeaf(index: number, leaf: string): Promise<boolean> {
    if (index < 0 || index >= this.leaves.length) {
      throw new AuditError(
        AuditErrorCode.QUERY_FAILED,
        `叶子节点索引越界: ${index}`
      );
    }

    this.leaves[index] = leaf;
    this.isBuilt = false;
    return true;
  }

  /**
   * 获取叶子节点
   */
  getLeaf(index: number): string | undefined {
    return this.leaves[index];
  }

  /**
   * 获取所有叶子节点
   */
  getLeaves(): string[] {
    return [...this.leaves];
  }

  /**
   * 获取叶子节点数量
   */
  getLeafCount(): number {
    return this.leaves.length;
  }

  /**
   * 查找叶子节点索引
   */
  indexOf(leaf: string): number {
    return this.leaves.indexOf(leaf);
  }

  // ========================================================================
  // 树构建
  // ========================================================================

  /**
   * 构建默克尔树
   */
  async build(): Promise<string> {
    if (this.leaves.length === 0) {
      throw new AuditError(
        AuditErrorCode.CONFIG_INVALID,
        '默克尔树不能为空'
      );
    }

    const processedLeaves = this.config.hashLeaves
      ? await Promise.all(this.leaves.map((leaf) => this.hashValue(leaf)))
      : [...this.leaves];

    this.levels = [processedLeaves];
    let currentLevel = processedLeaves;

    while (currentLevel.length > 1) {
      const nextLevel: string[] = [];

      for (let i = 0; i < currentLevel.length; i += 2) {
        const left = currentLevel[i];
        const right = i + 1 < currentLevel.length ? currentLevel[i + 1] : left;

        const combined = this.config.sortPairs
          ? this.sortAndCombine(left, right)
          : left + right;

        const parent = await this.hashValue(combined);
        nextLevel.push(parent);
      }

      this.levels.push(nextLevel);
      currentLevel = nextLevel;
    }

    this.root = currentLevel[0];
    this.isBuilt = true;

    return this.root;
  }

  /**
   * 重新构建树
   */
  async rebuild(): Promise<string> {
    this.isBuilt = false;
    return this.build();
  }

  /**
   * 获取默克尔根
   */
  async getRoot(): Promise<string> {
    if (!this.isBuilt) {
      await this.build();
    }
    return this.root;
  }

  // ========================================================================
  // 默克尔证明
  // ========================================================================

  /**
   * 生成默克尔证明
   */
  async getProof(index: number): Promise<MerkleProof> {
    if (!this.isBuilt) {
      await this.build();
    }

    if (index < 0 || index >= this.leaves.length) {
      throw new AuditError(
        AuditErrorCode.QUERY_FAILED,
        `叶子节点索引越界: ${index}`
      );
    }

    const proof: string[] = [];
    let currentIndex = index;

    for (let level = 0; level < this.levels.length - 1; level++) {
      const currentLevel = this.levels[level];
      const isRight = currentIndex % 2 === 1;
      const siblingIndex = isRight ? currentIndex - 1 : currentIndex + 1;

      let sibling: string;
      if (siblingIndex < currentLevel.length) {
        sibling = currentLevel[siblingIndex];
      } else {
        sibling = currentLevel[currentIndex];
      }

      proof.push(sibling);
      currentIndex = Math.floor(currentIndex / 2);
    }

    const leaf = this.levels[0][index];

    return {
      root: this.root,
      leaf,
      proof,
      position: index,
      verified: false,
    };
  }

  /**
   * 根据叶子值生成证明
   */
  async getProofForLeaf(leaf: string): Promise<MerkleProof | null> {
    const index = this.indexOf(leaf);
    if (index === -1) return null;
    return this.getProof(index);
  }

  /**
   * 验证默克尔证明
   */
  async verifyProof(proof: MerkleProof): Promise<boolean> {
    let computedHash = proof.leaf;
    let currentIndex = proof.position;

    for (let i = 0; i < proof.proof.length; i++) {
      const sibling = proof.proof[i];
      const isRight = currentIndex % 2 === 1;

      const combined = this.config.sortPairs
        ? this.sortAndCombine(computedHash, sibling)
        : isRight
        ? sibling + computedHash
        : computedHash + sibling;

      computedHash = await this.hashValue(combined);
      currentIndex = Math.floor(currentIndex / 2);
    }

    const verified = computedHash.toLowerCase() === proof.root.toLowerCase();
    proof.verified = verified;

    return verified;
  }

  /**
   * 验证叶子节点是否在树中
   */
  async verifyLeaf(leaf: string, root?: string): Promise<boolean> {
    if (!this.isBuilt) {
      await this.build();
    }

    const targetRoot = root || this.root;
    const proof = await this.getProofForLeaf(leaf);

    if (!proof) return false;

    proof.root = targetRoot;
    return this.verifyProof(proof);
  }

  // ========================================================================
  // 批量操作
  // ========================================================================

  /**
   * 批量验证叶子节点
   */
  async verifyLeaves(leaves: string[], root?: string): Promise<{ valid: boolean; results: boolean[] }> {
    const results = await Promise.all(
      leaves.map((leaf) => this.verifyLeaf(leaf, root))
    );

    const valid = results.every((r) => r);
    return { valid, results };
  }

  /**
   * 批量生成证明
   */
  async getProofs(indices: number[]): Promise<MerkleProof[]> {
    return Promise.all(indices.map((i) => this.getProof(i)));
  }

  // ========================================================================
  // 树遍历
  // ========================================================================

  /**
   * 获取树的层数
   */
  async getDepth(): Promise<number> {
    if (!this.isBuilt) {
      await this.build();
    }
    return this.levels.length - 1;
  }

  /**
   * 获取某一层的所有节点
   */
  async getLevel(level: number): Promise<string[]> {
    if (!this.isBuilt) {
      await this.build();
    }

    if (level < 0 || level >= this.levels.length) {
      throw new AuditError(
        AuditErrorCode.QUERY_FAILED,
        `层级越界: ${level}`
      );
    }

    return [...this.levels[level]];
  }

  /**
   * 获取所有层级
   */
  async getLevels(): Promise<string[][]> {
    if (!this.isBuilt) {
      await this.build();
    }
    return this.levels.map((level) => [...level]);
  }

  /**
   * 获取节点
   */
  async getNode(level: number, index: number): Promise<string | undefined> {
    const levelNodes = await this.getLevel(level);
    return levelNodes[index];
  }

  // ========================================================================
  // 高级功能
  // ========================================================================

  /**
   * 获取子树
   */
  async getSubtree(leafIndex: number, depth: number): Promise<MerkleTree> {
    if (!this.isBuilt) {
      await this.build();
    }

    const subtreeLeaves: string[] = [];
    const leafCount = Math.pow(2, depth);
    const startIndex = Math.floor(leafIndex / leafCount) * leafCount;

    for (let i = 0; i < leafCount; i++) {
      const idx = startIndex + i;
      if (idx < this.leaves.length) {
        subtreeLeaves.push(this.leaves[idx]);
      }
    }

    const subtree = new MerkleTree(subtreeLeaves, this.config, this.hashingService);
    await subtree.build();
    return subtree;
  }

  /**
   * 计算树的总节点数
   */
  async getTotalNodeCount(): Promise<number> {
    if (!this.isBuilt) {
      await this.build();
    }
    return this.levels.reduce((sum, level) => sum + level.length, 0);
  }

  /**
   * 导出树结构
   */
  async exportTree(): Promise<{
    leaves: string[];
    levels: string[][];
    root: string;
    depth: number;
    config: MerkleTreeConfig;
  }> {
    if (!this.isBuilt) {
      await this.build();
    }

    return {
      leaves: [...this.leaves],
      levels: this.levels.map((level) => [...level]),
      root: this.root,
      depth: this.levels.length - 1,
      config: { ...this.config },
    };
  }

  /**
   * 导入树结构
   */
  async importTree(data: {
    leaves: string[];
    config?: MerkleTreeConfig;
  }): Promise<void> {
    this.leaves = [...data.leaves];
    if (data.config) {
      this.config = { ...this.config, ...data.config };
    }
    this.isBuilt = false;
    await this.build();
  }

  // ========================================================================
  // 静态工具方法
  // ========================================================================

  /**
   * 计算默克尔根（静态方法）
   */
  static async calculateRoot(
    leaves: string[],
    algorithm: HashAlgorithm = HashAlgorithm.SHA256
  ): Promise<string> {
    const tree = new MerkleTree(leaves, { algorithm });
    return tree.build();
  }

  /**
   * 验证默克尔证明（静态方法）
   */
  static async verifyProof(
    leaf: string,
    proof: string[],
    root: string,
    index: number,
    algorithm: HashAlgorithm = HashAlgorithm.SHA256,
    sortPairs: boolean = true
  ): Promise<boolean> {
    const hashingService = new HashingService({ defaultAlgorithm: algorithm });

    let computedHash = leaf;
    let currentIndex = index;

    for (let i = 0; i < proof.length; i++) {
      const sibling = proof[i];
      const isRight = currentIndex % 2 === 1;

      let combined: string;
      if (sortPairs) {
        const left = isRight ? sibling : computedHash;
        const right = isRight ? computedHash : sibling;
        combined = [left, right].sort().join('');
      } else {
        combined = isRight ? sibling + computedHash : computedHash + sibling;
      }

      const result = await hashingService.hash(combined, algorithm);
      computedHash = result.hash;
      currentIndex = Math.floor(currentIndex / 2);
    }

    return computedHash.toLowerCase() === root.toLowerCase();
  }

  /**
   * 创建空树
   */
  static createEmpty(algorithm: HashAlgorithm = HashAlgorithm.SHA256): MerkleTree {
    return new MerkleTree([], { algorithm });
  }

  // ========================================================================
  // 内部工具方法
  // ========================================================================

  private async hashValue(value: string): Promise<string> {
    if (this.config.doubleHash) {
      const first = await this.hashingService.hash(value, this.config.algorithm);
      const second = await this.hashingService.hash(first.hash, this.config.algorithm);
      return second.hash;
    }

    const result = await this.hashingService.hash(value, this.config.algorithm);
    return result.hash;
  }

  private sortAndCombine(left: string, right: string): string {
    const sorted = [left, right].sort();
    return sorted[0] + sorted[1];
  }

  /**
   * 清空树
   */
  clear(): void {
    this.leaves = [];
    this.levels = [];
    this.root = '';
    this.isBuilt = false;
  }

  /**
   * 检查树是否已构建
   */
  isTreeBuilt(): boolean {
    return this.isBuilt;
  }
}

// ============================================================================
// 默克尔树工厂
// ============================================================================

export class MerkleTreeFactory {
  static create(
    leaves: string[] = [],
    config?: MerkleTreeConfig
  ): MerkleTree {
    return new MerkleTree(leaves, config);
  }

  static async fromHashes(
    hashes: string[],
    config?: MerkleTreeConfig
  ): Promise<MerkleTree> {
    const tree = new MerkleTree(hashes, {
      ...config,
      hashLeaves: false,
    });
    await tree.build();
    return tree;
  }
}

// ============================================================================
// 默认导出
// ============================================================================

export default MerkleTree;
