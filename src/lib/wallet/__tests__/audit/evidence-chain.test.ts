import { describe, it, expect, beforeEach, vi, mock } from 'vitest';
import { EvidenceChain, EvidenceBlock, VerificationResult } from '../../audit/evidence-chain';

describe('EvidenceChain - 证据链', () => {
  let evidenceChain: EvidenceChain;
  const testData = {
    eventId: 'event-test-001',
    eventType: 'wallet_created',
    userId: 'user-test-001',
    timestamp: Date.now(),
  };

  beforeEach(() => {
    evidenceChain = new EvidenceChain();
  });

  describe('构造函数', () => {
    it('应该创建证据链实例', () => {
      expect(evidenceChain).toBeDefined();
    });

    it('应该有创世区块', () => {
      const latest = evidenceChain.getLatestBlock();
      expect(latest).toBeDefined();
      expect(latest.height).toBe(0);
    });
  });

  describe('生成证明', () => {
    it('应该能生成区块证明', async () => {
      const proof = await evidenceChain.generateProof(testData);
      expect(proof).toBeDefined();
    });

    it('证明应该包含哈希值', async () => {
      const proof = await evidenceChain.generateProof(testData);
      expect(proof.hash).toBeDefined();
      expect(proof.hash.length).toBe(66);
    });

    it('证明应该包含前一个区块哈希', async () => {
      const proof = await evidenceChain.generateProof(testData);
      expect(proof.previousHash).toBeDefined();
      expect(proof.previousHash.length).toBe(66);
    });

    it('证明应该包含区块高度', async () => {
      const proof = await evidenceChain.generateProof(testData);
      expect(proof.height).toBeDefined();
      expect(typeof proof.height).toBe('number');
    });

    it('证明应该包含时间戳', async () => {
      const proof = await evidenceChain.generateProof(testData);
      expect(proof.timestamp).toBeDefined();
      expect(typeof proof.timestamp).toBe('number');
    });

    it('每次生成的区块高度应该递增', async () => {
      const proof1 = await evidenceChain.generateProof({ data: 'data1' });
      const proof2 = await evidenceChain.generateProof({ data: 'data2' });
      expect(proof2.height).toBe(proof1.height + 1);
    });

    it('新区块的前哈希应该等于前区块的哈希', async () => {
      const proof1 = await evidenceChain.generateProof({ data: 'data1' });
      const proof2 = await evidenceChain.generateProof({ data: 'data2' });
      expect(proof2.previousHash).toBe(proof1.hash);
    });

    it('相同数据在不同时间应该生成不同哈希', async () => {
      const proof1 = await evidenceChain.generateProof(testData);
      await new Promise(resolve => setTimeout(resolve, 10));
      const proof2 = await evidenceChain.generateProof(testData);
      expect(proof1.hash).not.toBe(proof2.hash);
    });

    it('不同数据应该生成不同哈希', async () => {
      const proof1 = await evidenceChain.generateProof({ data: 'data1' });
      const proof2 = await evidenceChain.generateProof({ data: 'data2' });
      expect(proof1.hash).not.toBe(proof2.hash);
    });
  });

  describe('哈希计算', () => {
    it('应该能计算数据的 SHA-256 哈希', () => {
      const hash = evidenceChain.calculateHash(testData);
      expect(hash).toBeDefined();
      expect(hash.length).toBe(66);
      expect(hash.startsWith('0x')).toBe(true);
    });

    it('相同数据应该生成相同哈希', () => {
      const hash1 = evidenceChain.calculateHash(testData);
      const hash2 = evidenceChain.calculateHash(testData);
      expect(hash1).toBe(hash2);
    });

    it('不同数据应该生成不同哈希', () => {
      const hash1 = evidenceChain.calculateHash({ data: 'test1' });
      const hash2 = evidenceChain.calculateHash({ data: 'test2' });
      expect(hash1).not.toBe(hash2);
    });

    it('空对象也应该生成哈希', () => {
      const hash = evidenceChain.calculateHash({});
      expect(hash).toBeDefined();
      expect(hash.length).toBe(66);
    });

    it('嵌套对象应该生成一致的哈希', () => {
      const data1 = { a: 1, b: { c: 2 } };
      const data2 = { b: { c: 2 }, a: 1 };
      const hash1 = evidenceChain.calculateHash(data1);
      const hash2 = evidenceChain.calculateHash(data2);
      expect(hash1).toBe(hash2);
    });
  });

  describe('验证证明', () => {
    beforeEach(async () => {
      await evidenceChain.generateProof({ data: 'block1' });
      await evidenceChain.generateProof({ data: 'block2' });
      await evidenceChain.generateProof({ data: 'block3' });
    });

    it('应该能验证区块的完整性', async () => {
      const block = evidenceChain.getBlockByHeight(1);
      const result = await evidenceChain.verifyProof(block);
      expect(result.valid).toBe(true);
    });

    it('被篡改的区块应该验证失败', async () => {
      const block = evidenceChain.getBlockByHeight(1);
      const tamperedBlock = {
        ...block,
        data: { tampered: true },
      };

      const result = await evidenceChain.verifyProof(tamperedBlock);
      expect(result.valid).toBe(false);
    });

    it('验证结果应该包含验证详情', async () => {
      const block = evidenceChain.getBlockByHeight(1);
      const result = await evidenceChain.verifyProof(block);
      expect(result.verifiedAt).toBeDefined();
      expect(typeof result.verifiedAt).toBe('number');
    });

    it('创世区块应该验证通过', async () => {
      const genesis = evidenceChain.getBlockByHeight(0);
      const result = await evidenceChain.verifyProof(genesis);
      expect(result.valid).toBe(true);
    });
  });

  describe('链验证', () => {
    beforeEach(async () => {
      for (let i = 0; i < 10; i++) {
        await evidenceChain.generateProof({ index: i });
      }
    });

    it('应该能验证整条链的完整性', async () => {
      const result = await evidenceChain.verifyChain();
      expect(result.valid).toBe(true);
    });

    it('篡改中间区块应该导致链验证失败', async () => {
      const block5 = evidenceChain.getBlockByHeight(5);
      const tamperedData = { ...block5.data, tampered: true };
      Object.defineProperty(block5, 'data', { value: tamperedData, writable: true });

      const result = await evidenceChain.verifyChain();
      expect(result.valid).toBe(false);
    });

    it('链验证应该返回第一个无效区块的位置', async () => {
      const result = await evidenceChain.verifyChain();
      if (!result.valid) {
        expect(result.invalidHeight).toBeDefined();
      }
    });

    it('验证结果应该包含验证的区块数', async () => {
      const result = await evidenceChain.verifyChain();
      expect(result.verifiedCount).toBeDefined();
      expect(typeof result.verifiedCount).toBe('number');
    });
  });

  describe('区块管理', () => {
    beforeEach(async () => {
      for (let i = 0; i < 5; i++) {
        await evidenceChain.generateProof({ index: i });
      }
    });

    it('应该能获取最新区块', () => {
      const latest = evidenceChain.getLatestBlock();
      expect(latest.height).toBe(5);
    });

    it('应该能按高度获取区块', () => {
      const block = evidenceChain.getBlockByHeight(3);
      expect(block).toBeDefined();
      expect(block.height).toBe(3);
    });

    it('获取不存在高度的区块应该返回 null', () => {
      const block = evidenceChain.getBlockByHeight(999);
      expect(block).toBeNull();
    });

    it('应该能按哈希获取区块', async () => {
      const proof = await evidenceChain.generateProof({ test: 'hash' });
      const block = evidenceChain.getBlockByHash(proof.hash);
      expect(block).toBeDefined();
      expect(block.hash).toBe(proof.hash);
    });

    it('获取不存在哈希的区块应该返回 null', () => {
      const block = evidenceChain.getBlockByHash('0x' + '0'.repeat(64));
      expect(block).toBeNull();
    });

    it('应该能获取区块总数', () => {
      const count = evidenceChain.getBlockCount();
      expect(count).toBe(6);
    });
  });

  describe('区块数据', () => {
    it('区块应该包含高度', async () => {
      const proof = await evidenceChain.generateProof(testData);
      expect(proof.height).toBeGreaterThan(0);
    });

    it('区块应该包含时间戳', async () => {
      const before = Date.now();
      const proof = await evidenceChain.generateProof(testData);
      expect(proof.timestamp).toBeGreaterThanOrEqual(before);
    });

    it('区块应该包含数据', async () => {
      const proof = await evidenceChain.generateProof(testData);
      expect(proof.data).toBeDefined();
    });

    it('区块应该包含前哈希', async () => {
      const proof = await evidenceChain.generateProof(testData);
      expect(proof.previousHash).toBeDefined();
    });

    it('区块应该包含自身哈希', async () => {
      const proof = await evidenceChain.generateProof(testData);
      expect(proof.hash).toBeDefined();
    });
  });

  describe('Merkle 树', () => {
    it('应该能构建 Merkle 树', () => {
      const leaves = ['0x' + 'a'.repeat(64), '0x' + 'b'.repeat(64), '0x' + 'c'.repeat(64)];
      const root = evidenceChain.buildMerkleTree(leaves);
      expect(root).toBeDefined();
      expect(root.length).toBe(66);
    });

    it('空列表应该返回 null', () => {
      const root = evidenceChain.buildMerkleTree([]);
      expect(root).toBeNull();
    });

    it('单个叶子节点应该返回自身', () => {
      const leaf = '0x' + 'a'.repeat(64);
      const root = evidenceChain.buildMerkleTree([leaf]);
      expect(root).toBe(leaf);
    });

    it('相同的叶子应该生成相同的根', () => {
      const leaves = ['0x' + 'a'.repeat(64), '0x' + 'b'.repeat(64)];
      const root1 = evidenceChain.buildMerkleTree(leaves);
      const root2 = evidenceChain.buildMerkleTree([...leaves]);
      expect(root1).toBe(root2);
    });
  });

  describe('持久化', () => {
    it('应该能导出链数据', () => {
      const data = evidenceChain.exportChain();
      expect(data).toBeDefined();
      expect(Array.isArray(data.blocks)).toBe(true);
    });

    it('应该能导入链数据', async () => {
      for (let i = 0; i < 3; i++) {
        await evidenceChain.generateProof({ i });
      }
      const exported = evidenceChain.exportChain();

      const newChain = new EvidenceChain();
      newChain.importChain(exported);

      expect(newChain.getBlockCount()).toBe(exported.blocks.length);
    });
  });

  describe('配置管理', () => {
    it('应该能获取配置', () => {
      const config = evidenceChain.getConfig();
      expect(config).toBeDefined();
    });

    it('应该能更新配置', () => {
      evidenceChain.updateConfig({
        hashAlgorithm: 'sha256',
        enableMerkleTree: true,
      });

      const config = evidenceChain.getConfig();
      expect(config.hashAlgorithm).toBe('sha256');
    });
  });
});
