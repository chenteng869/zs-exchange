import { createHash } from 'crypto';

export interface EvidenceBlock {
  height: number;
  timestamp: number;
  data: unknown;
  previousHash: string;
  hash: string;
}

export interface VerificationResult {
  valid: boolean;
  verifiedAt: number;
}

interface EvidenceChainConfig {
  hashAlgorithm: 'sha256';
  enableMerkleTree: boolean;
}

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) {
    return '[' + value.map((v) => stableStringify(v)).join(',') + ']';
  }
  if (value && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `"${k}":${stableStringify(v)}`);
    return '{' + entries.join(',') + '}';
  }
  return JSON.stringify(value);
}

export class EvidenceChain {
  private blocks: EvidenceBlock[] = [];
  private config: EvidenceChainConfig = {
    hashAlgorithm: 'sha256',
    enableMerkleTree: true,
  };

  constructor() {
    const genesis: EvidenceBlock = {
      height: 0,
      timestamp: Date.now(),
      data: { genesis: true },
      previousHash: '0x' + '0'.repeat(64),
      hash: this.computeBlockHash(0, Date.now(), { genesis: true }, '0x' + '0'.repeat(64)),
    };
    this.blocks.push(genesis);
  }

  async generateProof(data: unknown): Promise<EvidenceBlock> {
    const previous = this.getLatestBlock();
    const timestamp = Date.now();
    const block: EvidenceBlock = {
      height: previous.height + 1,
      timestamp,
      data,
      previousHash: previous.hash,
      hash: this.computeBlockHash(previous.height + 1, timestamp, data, previous.hash),
    };
    this.blocks.push(block);
    return block;
  }

  calculateHash(data: unknown): string {
    return this.hashHex(stableStringify(data));
  }

  async verifyProof(block: EvidenceBlock): Promise<VerificationResult> {
    const expected = this.computeBlockHash(block.height, block.timestamp, block.data, block.previousHash);
    return {
      valid: expected === block.hash,
      verifiedAt: Date.now(),
    };
  }

  async verifyChain(): Promise<{ valid: boolean; invalidHeight?: number; verifiedCount: number }> {
    for (let i = 0; i < this.blocks.length; i++) {
      const block = this.blocks[i];
      const verify = await this.verifyProof(block);
      if (!verify.valid) {
        return { valid: false, invalidHeight: block.height, verifiedCount: i };
      }
      if (i > 0 && block.previousHash !== this.blocks[i - 1].hash) {
        return { valid: false, invalidHeight: block.height, verifiedCount: i };
      }
    }
    return { valid: true, verifiedCount: this.blocks.length };
  }

  getLatestBlock(): EvidenceBlock {
    return this.blocks[this.blocks.length - 1];
  }

  getBlockByHeight(height: number): EvidenceBlock | null {
    return this.blocks.find((b) => b.height === height) || null;
  }

  getBlockByHash(hash: string): EvidenceBlock | null {
    return this.blocks.find((b) => b.hash === hash) || null;
  }

  getBlockCount(): number {
    return this.blocks.length;
  }

  buildMerkleTree(leaves: string[]): string | null {
    if (leaves.length === 0) return null;
    if (leaves.length === 1) return leaves[0];

    let level = [...leaves];
    while (level.length > 1) {
      const next: string[] = [];
      for (let i = 0; i < level.length; i += 2) {
        const left = level[i];
        const right = level[i + 1] || left;
        next.push(this.hashHex(left + right));
      }
      level = next;
    }
    return level[0];
  }

  exportChain(): { blocks: EvidenceBlock[] } {
    return { blocks: this.blocks.map((b) => ({ ...b })) };
  }

  importChain(data: { blocks: EvidenceBlock[] }): void {
    this.blocks = data.blocks.map((b) => ({ ...b }));
  }

  getConfig(): EvidenceChainConfig {
    return { ...this.config };
  }

  updateConfig(config: Partial<EvidenceChainConfig>): void {
    this.config = { ...this.config, ...config };
  }

  private computeBlockHash(height: number, timestamp: number, data: unknown, previousHash: string): string {
    return this.hashHex(stableStringify({ height, timestamp, data, previousHash }));
  }

  private hashHex(input: string): string {
    return '0x' + createHash('sha256').update(input).digest('hex');
  }
}

export const evidenceChain = new EvidenceChain();