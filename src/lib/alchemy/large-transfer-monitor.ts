/**
 * Alchemy 大额转账实时监控（2026-07-11 新建 · P4-6）
 *
 * 实时监控链上 > $100k USD 的转账（合规要求）
 *  - 通过 WebSocket 订阅 Transfer 事件
 *  - 过滤大额
 *  - 触发告警（DB + Console + SIEM）
 *
 * 业务价值：
 *  - 实时发现可疑大额转账
 *  - 满足合规审计
 *  - 风险预警
 */

import { getAlchemyWsClient, type WsChainKey } from './websocket';
import { safeConsoleWarn, safeConsoleInfo } from '@/lib/security/safe-logger';
import { alertService } from '@/lib/monitoring/alert-service';

export interface LargeTransferMonitorOptions {
  chainKey: WsChainKey;
  /** 监控的代币合约地址（默认监控 USDT/USDC/DAI 等主流）*/
  watchTokens?: string[];
  /** 阈值（USD），默认 $100,000 */
  thresholdUsd?: number;
  /** 是否推送到告警（默认 true）*/
  alertEnabled?: boolean;
}

const DEFAULT_TOKENS: Record<WsChainKey, string[]> = {
  eth: [
    '0xdac17f958d2ee5234a3370b0eab4b5e0d0d6e6e6', // USDT (lower case for compare)
    '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', // USDC
    '0x6b175474e89094c44da98b954eedeac495271d0f', // DAI
  ],
  bsc: [
    '0x55d398326f99059ff775485246999027b3197955', // USDT BSC
    '0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d', // USDC BSC
  ],
  polygon: [
    '0xc2132d05d31c914a87c6611c10748aeb04b58e8f', // USDT Polygon
    '0x2791bca1f2de4661ed88a30c99a7a9449aa84174', // USDC Polygon
  ],
  arbitrum: [
    '0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9', // USDT Arb
    '0xaf88d065e77c8cc2239327c5edb3a432268e5831', // USDC Arb
  ],
  optimism: [
    '0x94b008aa00579c1307b0ef2c499a98d8ad64453d', // USDT Op
    '0x0b2c639c533813f4aa9d7837caf62653d097ff85', // USDC Op
  ],
  base: [
    // Base USDC
    '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913',
  ],
};

// 已知 USD 价格（硬编码简化版，实际应查价格服务）
const KNOWN_STABLE_USD = 1.0;

const ERC20_TRANSFER_TOPIC = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';

export class LargeTransferMonitor {
  private readonly chainKey: WsChainKey;
  private readonly watchTokens: Set<string>;
  private readonly thresholdUsd: number;
  private readonly alertEnabled: boolean;
  private unsubscribe: (() => void) | null = null;

  constructor(opts: LargeTransferMonitorOptions) {
    this.chainKey = opts.chainKey;
    this.watchTokens = new Set(
      (opts.watchTokens || DEFAULT_TOKENS[opts.chainKey] || []).map((a) => a.toLowerCase()),
    );
    this.thresholdUsd = opts.thresholdUsd ?? 100_000;
    this.alertEnabled = opts.alertEnabled !== false;
  }

  start(): void {
    if (this.unsubscribe) return;
    const ws = getAlchemyWsClient(this.chainKey);
    this.unsubscribe = ws.subscribeLogs(
      {
        address: Array.from(this.watchTokens),
        topics: [ERC20_TRANSFER_TOPIC],
      },
      (log: any) => this.handleLog(log),
    );
    safeConsoleInfo(`[large-transfer-monitor] started on ${this.chainKey}, tokens=${this.watchTokens.size}, threshold=$${this.thresholdUsd}`);
  }

  stop(): void {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
      safeConsoleInfo(`[large-transfer-monitor] stopped on ${this.chainKey}`);
    }
  }

  private async handleLog(log: any): Promise<void> {
    try {
      // log.address = 代币合约
      // log.topics[0] = 事件签名
      // log.topics[1] = from（padded）
      // log.topics[2] = to（padded）
      // log.data = amount
      const tokenAddr = (log.address || '').toLowerCase();
      if (!this.watchTokens.has(tokenAddr)) return;

      const from = '0x' + (log.topics[1] || '').slice(26);
      const to = '0x' + (log.topics[2] || '').slice(26);
      const rawAmount = BigInt(log.data || '0x0');
      // 简化：假定稳定币 6 位精度
      const decimals = 6;
      const amount = Number(rawAmount) / 10 ** decimals;
      const valueUsd = amount * KNOWN_STABLE_USD;

      if (valueUsd < this.thresholdUsd) return;

      safeConsoleWarn(`[large-transfer-monitor] ${this.chainKey} $${valueUsd.toFixed(0)} ${from} → ${to}`);

      if (this.alertEnabled) {
        try {
          await alertService.sendAlert({
            type: 'large_transfer',
            level: 'medium',
            message: `[chain=${this.chainKey}] large transfer $${valueUsd.toFixed(2)} from ${from.slice(0, 10)}… to ${to.slice(0, 10)}…`,
            metadata: {
              chain: this.chainKey,
              token: tokenAddr,
              from,
              to,
              amount: amount.toString(),
              valueUsd,
              txHash: log.transactionHash,
              blockNumber: parseInt(log.blockNum, 16),
            },
          });
        } catch {
          // 告警失败不阻塞
        }
      }
    } catch (err) {
      safeConsoleWarn(`[large-transfer-monitor] handle log failed: ${(err as Error).message}`);
    }
  }
}

// =============================================================================
// 启动器
// =============================================================================

declare global {
  // eslint-disable-next-line no-var
  var __largeTransferMonitors: Map<WsChainKey, LargeTransferMonitor> | undefined;
}

/**
 * 启动所有链的大额转账监控（幂等）
 */
export function startAllLargeTransferMonitors(options?: Partial<LargeTransferMonitorOptions>): void {
  if (!globalThis.__largeTransferMonitors) {
    globalThis.__largeTransferMonitors = new Map();
  }
  const chains: WsChainKey[] = ['eth', 'bsc', 'polygon', 'arbitrum', 'optimism'];
  for (const chain of chains) {
    if (globalThis.__largeTransferMonitors.has(chain)) continue;
    const monitor = new LargeTransferMonitor({ chainKey: chain, ...options });
    monitor.start();
    globalThis.__largeTransferMonitors.set(chain, monitor);
  }
}
