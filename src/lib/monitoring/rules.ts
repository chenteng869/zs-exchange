/**
 * 内置告警规则（M-06 + M-07）
 *
 * 规则分类：
 *  - 链上数据延迟告警 (M-06)
 *      RPC_LATENCY_ETH / RPC_LATENCY_BSC
 *      RPC_DOWN_ETH / RPC_DOWN_BSC
 *      BLOCK_STALE_ETH / BLOCK_STALE_BSC
 *  - 异常价格偏离告警 (M-07)
 *      PRICE_DEVIATION_BTC / PRICE_DEVIATION_ETH
 *      PRICE_SPIKE_BTC / PRICE_SPIKE_ETH
 *      STALE_TICKER
 *      WS_DISCONNECTED
 */

import type { AlertRule } from './alert-engine';
import type { MetricsCollector } from './metrics-collector';

// =============================================================================
// 阈值常量（可被调用方覆盖）
// =============================================================================

export interface BuiltinThresholds {
  /** ETH RPC 平均延迟阈值 (ms) */
  ethRpcLatencyMs: number;
  /** BSC RPC 平均延迟阈值 (ms) */
  bscRpcLatencyMs: number;
  /** ETH RPC 主源连续失败次数阈值 */
  ethRpcFailureCount: number;
  /** BSC RPC 主源连续失败次数阈值 */
  bscRpcFailureCount: number;
  /** ETH 区块未更新时长阈值 (ms) */
  ethBlockStaleMs: number;
  /** BSC 区块未更新时长阈值 (ms) */
  bscBlockStaleMs: number;
  /** BTC 多源价格偏离阈值 (0..1) */
  btcPriceDeviation: number;
  /** ETH 多源价格偏离阈值 (0..1) */
  ethPriceDeviation: number;
  /** BTC 1 分钟价格变化阈值 (0..1) */
  btcPriceSpike: number;
  /** ETH 1 分钟价格变化阈值 (0..1) */
  ethPriceSpike: number;
  /** Ticker 未更新时长阈值 (ms) */
  tickerStaleMs: number;
  /** WebSocket 断开持续时长阈值 (ms) */
  wsDisconnectMs: number;
  /** 默认 cooldown (ms) */
  defaultCooldownMs: number;
}

export const DEFAULT_THRESHOLDS: BuiltinThresholds = {
  ethRpcLatencyMs: 3_000,
  bscRpcLatencyMs: 2_000,
  ethRpcFailureCount: 3,
  bscRpcFailureCount: 3,
  ethBlockStaleMs: 5 * 60 * 1_000,  // 5 分钟
  bscBlockStaleMs: 2 * 60 * 1_000,  // 2 分钟
  btcPriceDeviation: 0.03,           // 3%
  ethPriceDeviation: 0.03,           // 3%
  btcPriceSpike: 0.05,               // 5%
  ethPriceSpike: 0.05,               // 5%
  tickerStaleMs: 30_000,             // 30s
  wsDisconnectMs: 10_000,            // 10s
  defaultCooldownMs: 60_000,         // 1 分钟
};

// =============================================================================
// 规则工厂
// =============================================================================

/**
 * 构造所有内置规则
 * @param metrics MetricsCollector 实例
 * @param thresholds 阈值（默认 DEFAULT_THRESHOLDS）
 * @param watchedSymbols 关注价格偏离/峰值的交易对（默认 ['BTC/USDT', 'ETH/USDT']）
 * @param watchedWsNames 关注的 WebSocket 名称（默认 ['binance']）
 */
export function createBuiltinRules(
  metrics: MetricsCollector,
  thresholds: Partial<BuiltinThresholds> = {},
  watchedSymbols: string[] = ['BTC/USDT', 'ETH/USDT'],
  watchedWsNames: string[] = ['binance'],
): AlertRule[] {
  const t: BuiltinThresholds = { ...DEFAULT_THRESHOLDS, ...thresholds };
  const rules: AlertRule[] = [];

  // ---------------------------------------------------------------------------
  // 链上数据延迟告警 (M-06)
  // ---------------------------------------------------------------------------

  rules.push({
    id: 'RPC_LATENCY_ETH',
    description: `ETH RPC 平均延迟超过 ${t.ethRpcLatencyMs}ms`,
    severity: 'P1',
    cooldownMs: t.defaultCooldownMs,
    evaluator: () => {
      const avg = metrics.getChainAverageLatency('ETH');
      return avg > t.ethRpcLatencyMs && avg > 0;
    },
    contextProvider: () => {
      const stats = metrics.getChainLatencyStats('ETH');
      return {
        chain: 'ETH',
        avgLatencyMs: Math.round(stats.mean),
        p50: stats.p50,
        p99: stats.p99,
        sampleCount: stats.count,
        thresholdMs: t.ethRpcLatencyMs,
      };
    },
  });

  rules.push({
    id: 'RPC_LATENCY_BSC',
    description: `BSC RPC 平均延迟超过 ${t.bscRpcLatencyMs}ms`,
    severity: 'P1',
    cooldownMs: t.defaultCooldownMs,
    evaluator: () => {
      const avg = metrics.getChainAverageLatency('BSC');
      return avg > t.bscRpcLatencyMs && avg > 0;
    },
    contextProvider: () => {
      const stats = metrics.getChainLatencyStats('BSC');
      return {
        chain: 'BSC',
        avgLatencyMs: Math.round(stats.mean),
        p50: stats.p50,
        p99: stats.p99,
        sampleCount: stats.count,
        thresholdMs: t.bscRpcLatencyMs,
      };
    },
  });

  rules.push({
    id: 'RPC_DOWN_ETH',
    description: `ETH RPC 主源连续 ${t.ethRpcFailureCount} 次失败`,
    severity: 'P0',
    cooldownMs: t.defaultCooldownMs,
    evaluator: () => {
      const primary = metrics.getPrimaryNode('ETH');
      if (!primary) return false;
      return metrics.getConsecutiveFailures('ETH', primary) >= t.ethRpcFailureCount;
    },
    contextProvider: () => {
      const primary = metrics.getPrimaryNode('ETH');
      return {
        chain: 'ETH',
        primaryNode: primary,
        consecutiveFailures: primary ? metrics.getConsecutiveFailures('ETH', primary) : 0,
        threshold: t.ethRpcFailureCount,
      };
    },
  });

  rules.push({
    id: 'RPC_DOWN_BSC',
    description: `BSC RPC 主源连续 ${t.bscRpcFailureCount} 次失败`,
    severity: 'P0',
    cooldownMs: t.defaultCooldownMs,
    evaluator: () => {
      const primary = metrics.getPrimaryNode('BSC');
      if (!primary) return false;
      return metrics.getConsecutiveFailures('BSC', primary) >= t.bscRpcFailureCount;
    },
    contextProvider: () => {
      const primary = metrics.getPrimaryNode('BSC');
      return {
        chain: 'BSC',
        primaryNode: primary,
        consecutiveFailures: primary ? metrics.getConsecutiveFailures('BSC', primary) : 0,
        threshold: t.bscRpcFailureCount,
      };
    },
  });

  rules.push({
    id: 'BLOCK_STALE_ETH',
    description: `ETH 区块 ${t.ethBlockStaleMs / 1000}s 未更新`,
    severity: 'P1',
    cooldownMs: t.defaultCooldownMs,
    evaluator: () => {
      const age = metrics.getBlockUpdateAgeMs('ETH');
      return age >= t.ethBlockStaleMs;
    },
    contextProvider: () => {
      const last = metrics.getLatestBlock('ETH');
      return {
        chain: 'ETH',
        lastBlock: last,
        ageMs: metrics.getBlockUpdateAgeMs('ETH'),
        thresholdMs: t.ethBlockStaleMs,
      };
    },
  });

  rules.push({
    id: 'BLOCK_STALE_BSC',
    description: `BSC 区块 ${t.bscBlockStaleMs / 1000}s 未更新`,
    severity: 'P1',
    cooldownMs: t.defaultCooldownMs,
    evaluator: () => {
      const age = metrics.getBlockUpdateAgeMs('BSC');
      return age >= t.bscBlockStaleMs;
    },
    contextProvider: () => {
      const last = metrics.getLatestBlock('BSC');
      return {
        chain: 'BSC',
        lastBlock: last,
        ageMs: metrics.getBlockUpdateAgeMs('BSC'),
        thresholdMs: t.bscBlockStaleMs,
      };
    },
  });

  // ---------------------------------------------------------------------------
  // 异常价格偏离告警 (M-07)
  // ---------------------------------------------------------------------------

  for (const sym of watchedSymbols) {
    const isBTC = sym.startsWith('BTC');
    const isETH = sym.startsWith('ETH');
    if (isBTC) {
      rules.push({
        id: 'PRICE_DEVIATION_BTC',
        description: `BTC 多源价格偏离超过 ${(t.btcPriceDeviation * 100).toFixed(1)}%`,
        severity: 'P1',
        cooldownMs: t.defaultCooldownMs,
        evaluator: () => {
          const d = metrics.getPriceDeviation(sym);
          return d.sources >= 2 && d.deviation > t.btcPriceDeviation;
        },
        contextProvider: () => {
          const d = metrics.getPriceDeviation(sym);
          return {
            symbol: sym,
            deviation: d.deviation,
            min: d.min,
            max: d.max,
            sources: d.sources,
            threshold: t.btcPriceDeviation,
          };
        },
      });
      rules.push({
        id: 'PRICE_SPIKE_BTC',
        description: `BTC 1 分钟内价格变化超过 ${(t.btcPriceSpike * 100).toFixed(1)}%`,
        severity: 'P0',
        cooldownMs: t.defaultCooldownMs,
        evaluator: () => {
          return metrics.getPriceChangeRatio(sym, 60_000) > t.btcPriceSpike;
        },
        contextProvider: () => {
          return {
            symbol: sym,
            changeRatio: metrics.getPriceChangeRatio(sym, 60_000),
            threshold: t.btcPriceSpike,
            windowMs: 60_000,
          };
        },
      });
    }
    if (isETH) {
      rules.push({
        id: 'PRICE_DEVIATION_ETH',
        description: `ETH 多源价格偏离超过 ${(t.ethPriceDeviation * 100).toFixed(1)}%`,
        severity: 'P1',
        cooldownMs: t.defaultCooldownMs,
        evaluator: () => {
          const d = metrics.getPriceDeviation(sym);
          return d.sources >= 2 && d.deviation > t.ethPriceDeviation;
        },
        contextProvider: () => {
          const d = metrics.getPriceDeviation(sym);
          return {
            symbol: sym,
            deviation: d.deviation,
            min: d.min,
            max: d.max,
            sources: d.sources,
            threshold: t.ethPriceDeviation,
          };
        },
      });
      rules.push({
        id: 'PRICE_SPIKE_ETH',
        description: `ETH 1 分钟内价格变化超过 ${(t.ethPriceSpike * 100).toFixed(1)}%`,
        severity: 'P0',
        cooldownMs: t.defaultCooldownMs,
        evaluator: () => {
          return metrics.getPriceChangeRatio(sym, 60_000) > t.ethPriceSpike;
        },
        contextProvider: () => {
          return {
            symbol: sym,
            changeRatio: metrics.getPriceChangeRatio(sym, 60_000),
            threshold: t.ethPriceSpike,
            windowMs: 60_000,
          };
        },
      });
    }
  }

  // 任一交易对 ticker 30s 未更新
  rules.push({
    id: 'STALE_TICKER',
    description: `任一交易对 ${t.tickerStaleMs / 1000}s 未更新`,
    severity: 'P2',
    cooldownMs: t.defaultCooldownMs,
    evaluator: () => {
      for (const sym of watchedSymbols) {
        const history = metrics.getPriceHistory(sym, t.tickerStaleMs);
        if (history.length === 0) return true; // 完全没数据
      }
      return false;
    },
    contextProvider: () => {
      const stale: string[] = [];
      for (const sym of watchedSymbols) {
        if (metrics.getPriceHistory(sym, t.tickerStaleMs).length === 0) {
          stale.push(sym);
        }
      }
      return { staleSymbols: stale, thresholdMs: t.tickerStaleMs };
    },
  });

  // WebSocket 断开
  for (const name of watchedWsNames) {
    rules.push({
      id: `WS_DISCONNECTED_${name.toUpperCase()}`,
      description: `WebSocket ${name} 断开超过 ${t.wsDisconnectMs / 1000}s`,
      severity: 'P1',
      cooldownMs: t.defaultCooldownMs,
      evaluator: () => {
        return metrics.getWsDisconnectDurationMs(name) > t.wsDisconnectMs;
      },
      contextProvider: () => {
        return {
          ws: name,
          disconnectedMs: metrics.getWsDisconnectDurationMs(name),
          thresholdMs: t.wsDisconnectMs,
        };
      },
    });
  }

  return rules;
}

// =============================================================================
// 别名
// =============================================================================

/** 通用 WS 规则（向后兼容，使用 binance ws） */
export const WS_DISCONNECTED = 'WS_DISCONNECTED';
