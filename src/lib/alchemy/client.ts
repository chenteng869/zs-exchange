/**
 * Alchemy SDK 统一实例（2026-07-11 新建 · P3-2）
 *
 * 集成 5 大能力：
 *  - RPC（5+ EVM 链 + Solana）
 *  - Enhanced APIs（Token/NFT/Transfer/Transaction）
 *  - Webhooks（已在 webhook-router.ts 中）
 *  - Account Abstraction（见 aa-config.ts）
 *  - WebSocket（见 websocket.ts）
 *
 * 使用：
 *   import { getAlchemySdk } from '@/lib/alchemy/client';
 *   const sdk = getAlchemySdk();
 *   const balances = await sdk.core.getTokenBalances(address);
 *
 * 多链支持：Alchemy SDK 一把 key 自动支持所有启用的链
 */

import { Alchemy, Network } from 'alchemy-sdk';

// =============================================================================
// 类型
// =============================================================================

export type SupportedNetwork =
  | 'ETH_MAINNET'
  | 'ETH_SEPOLIA'
  | 'BSC_MAINNET'
  | 'POLYGON_MAINNET'
  | 'ARBITRUM_MAINNET'
  | 'OPTIMISM_MAINNET'
  | 'BASE_MAINNET'
  | 'SOLANA_MAINNET';

const NETWORK_ALIASES: Record<string, Network> = {
  'eth': Network.ETH_MAINNET,
  'ethereum': Network.ETH_MAINNET,
  'sepolia': Network.ETH_SEPOLIA,
  'bsc': Network.BNB_MAINNET,        // 2026-07-11: Alchemy v3.6 SDK 中 BSC = BNB
  'bnb': Network.BNB_MAINNET,
  'polygon': Network.MATIC_MAINNET,  // 2026-07-11: Alchemy v3.6 SDK 中 Polygon = MATIC
  'matic': Network.MATIC_MAINNET,
  'arbitrum': Network.ARB_MAINNET,   // 2026-07-11: Alchemy v3.6 SDK 中 Arbitrum = ARB
  'arb': Network.ARB_MAINNET,
  'optimism': Network.OPT_MAINNET,   // 2026-07-11: Alchemy v3.6 SDK 中 Optimism = OPT
  'opt': Network.OPT_MAINNET,
  'base': Network.BASE_MAINNET,
  'solana': Network.SOLANA_MAINNET,
  'sol': Network.SOLANA_MAINNET,
};

export function resolveNetwork(chainKey: string): Network {
  const n = NETWORK_ALIASES[chainKey.toLowerCase()];
  if (!n) throw new Error(`Unknown chain key: ${chainKey}`);
  return n;
}

// =============================================================================
// 单例
// =============================================================================

declare global {
  // eslint-disable-next-line no-var
  var __alchemySdk: Alchemy | undefined;
  // eslint-disable-next-line no-var
  var __alchemySdkByNetwork: Map<Network, Alchemy> | undefined;
}

function getApiKey(): string {
  const key = process.env.ALCHEMY_API_KEY || process.env.NEXT_PUBLIC_ALCHEMY_API_KEY;
  if (!key) {
    throw new Error('ALCHEMY_API_KEY not configured. Set it in .env.local');
  }
  return key;
}

/**
 * 获取默认网络（ETH_MAINNET）的 SDK 实例
 */
export function getAlchemySdk(): Alchemy {
  if (!globalThis.__alchemySdk) {
    globalThis.__alchemySdk = new Alchemy({
      apiKey: getApiKey(),
      network: Network.ETH_MAINNET,
    });
  }
  return globalThis.__alchemySdk;
}

/**
 * 获取指定网络的 SDK 实例
 */
export function getAlchemySdkForNetwork(network: Network): Alchemy {
  if (!globalThis.__alchemySdkByNetwork) {
    globalThis.__alchemySdkByNetwork = new Map();
  }
  let sdk = globalThis.__alchemySdkByNetwork.get(network);
  if (!sdk) {
    sdk = new Alchemy({
      apiKey: getApiKey(),
      network,
    });
    globalThis.__alchemySdkByNetwork.set(network, sdk);
  }
  return sdk;
}

/**
 * 通过链 key 获取 SDK
 */
export function getAlchemySdkForChain(chainKey: string): Alchemy {
  return getAlchemySdkForNetwork(resolveNetwork(chainKey));
}

// =============================================================================
// 健康检查
// =============================================================================

/**
 * 验证 API Key 是否有效
 * - 返回 blockNumber 证明可达
 * - 失败抛错
 */
export async function checkAlchemyHealth(network: Network = Network.ETH_MAINNET): Promise<{
  network: Network;
  blockNumber: number;
  latencyMs: number;
}> {
  const sdk = getAlchemySdkForNetwork(network);
  const start = Date.now();
  try {
    const bn = await sdk.core.getBlockNumber();
    return { network, blockNumber: bn, latencyMs: Date.now() - start };
  } catch (err) {
    throw new Error(`Alchemy health check failed for ${network}: ${(err as Error).message}`);
  }
}
