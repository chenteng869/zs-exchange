/**
 * CodeGraph CLI 客户端
 * 通过 child_process 调用 codegraph CLI 命令
 */

import { execFile } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';

const execFileP = promisify(execFile);

export interface CodeGraphStatus {
  indexed: boolean;
  files: number;
  nodes: number;
  edges: number;
  dbSize?: string;
  backend?: string;
  languages?: string[];
}

export interface CodeGraphNode {
  name: string;
  kind: string;
  location: { file: string; line: number };
  signature?: string;
  source?: string;
  calls?: string[];
  calledBy?: string[];
}

export interface CodeGraphResult {
  symbol: string;
  total: number;
  items: Array<{
    name: string;
    kind: string;
    location: { file: string; line: number };
    signature?: string;
  }>;
}

export interface CodeGraphImpact {
  symbol: string;
  affectedCount: number;
  affected: Array<{
    file: string;
    symbols: Array<{ name: string; line: number }>;
  }>;
}

export class CodeGraphCLI {
  constructor(private workspacePath: string) {}

  private async exec(args: string[]): Promise<string> {
    try {
      const { stdout } = await execFileP('codegraph', [...args, this.workspacePath], {
        cwd: this.workspacePath,
        maxBuffer: 50 * 1024 * 1024, // 50MB
      });
      return stdout;
    } catch (e: any) {
      throw new Error(`codegraph ${args.join(' ')} failed: ${e.message}`);
    }
  }

  async init(): Promise<void> {
    await this.exec(['init']);
  }

  async sync(): Promise<{ filesIndexed: number }> {
    const output = await this.exec(['sync']);
    const match = output.match(/Indexed (\d+) files/);
    return { filesIndexed: match ? parseInt(match[1], 10) : 0 };
  }

  async index(): Promise<{ filesIndexed: number }> {
    const output = await this.exec(['index']);
    const match = output.match(/Indexed (\d+) files/);
    return { filesIndexed: match ? parseInt(match[1], 10) : 0 };
  }

  async status(): Promise<CodeGraphStatus> {
    const output = await this.exec(['status']);
    const files = parseInt(output.match(/Files:\s+(\d+)/)?.[1] || '0', 10);
    const nodes = parseInt(output.match(/Nodes:\s+(\d+)/)?.[1] || '0', 10);
    const edges = parseInt(output.match(/Edges:\s+(\d+)/)?.[1] || '0', 10);

    return {
      indexed: files > 0,
      files,
      nodes,
      edges,
      dbSize: output.match(/DB Size:\s+(.+)/)?.[1]?.trim(),
      backend: output.match(/Backend:\s+(.+)/)?.[1]?.trim(),
    };
  }

  async query(symbol: string): Promise<CodeGraphResult> {
    const output = await this.exec(['query', symbol]);
    // 简单解析 - 实际可使用 JSON 模式
    const lines = output.split('\n').filter((l) => l.trim());
    return {
      symbol,
      total: lines.length,
      items: lines.map((line) => {
        const match = line.match(/(\S+)\s+(\S+)\s+\((.+?)\)\s+(\S+):(\d+)/);
        if (!match) {
          return { name: line, kind: 'unknown', location: { file: '', line: 0 } };
        }
        return {
          name: match[1],
          kind: match[2],
          location: { file: path.relative(this.workspacePath, match[4]), line: parseInt(match[5], 10) },
        };
      }),
    };
  }

  async node(symbol: string): Promise<CodeGraphNode | null> {
    const output = await this.exec(['node', symbol]);
    // 解析节点输出
    return {
      name: symbol,
      kind: 'unknown',
      location: { file: '', line: 0 },
      source: output,
    };
  }

  async callers(symbol: string): Promise<CodeGraphResult> {
    const output = await this.exec(['callers', symbol]);
    return {
      symbol,
      total: 0,
      items: [],
    };
  }

  async callees(symbol: string): Promise<CodeGraphResult> {
    const output = await this.exec(['callees', symbol]);
    return {
      symbol,
      total: 0,
      items: [],
    };
  }

  async impact(symbol: string): Promise<CodeGraphImpact> {
    const output = await this.exec(['impact', symbol]);
    const count = parseInt(output.match(/(\d+) affected symbols/)?.[1] || '0', 10);
    return {
      symbol,
      affectedCount: count,
      affected: [],
    };
  }
}
