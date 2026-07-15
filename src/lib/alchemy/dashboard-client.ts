/**
 * Alchemy Dashboard API 客户端（2026-07-11 新建 · P7-2）
 *
 * 封装 Alchemy Dashboard 提供的管理能力：
 *  - 状态查询（Alchemy Status）
 *  - 用量统计（API CU / Webhook 数）
 *  - 错误日志
 *  - Webhook 管理
 *  - 账单查询
 *
 * 文档：https://docs.alchemy.com/reference/admin-api-quickstart
 *
 * 注意：Dashboard API 需要 team-level auth token（不同于 RPC API key）
 * 当前实现使用 RPC API Key 兼容（部分功能）
 */

import { safeConsoleWarn } from '@/lib/security/safe-logger';

// =============================================================================
// 类型
// =============================================================================

export interface AlchemyStatus {
  status: 'operational' | 'degraded' | 'down' | 'unknown';
  latencyMs?: number;
  network: string;
  blockNumber?: number;
  timestamp: number;
}

export interface AlchemyUsageDaily {
  date: string; // YYYY-MM-DD
  cu: number;
  webhooks: number;
  errors: number;
}

export interface AlchemyUsageSummary {
  currentMonth: {
    totalCu: number;
    totalWebhooks: number;
    totalErrors: number;
    byChain: Array<{ chain: string; cu: number }>;
  };
  history: AlchemyUsageDaily[];
  quota: {
    monthlyCu: number;
    usedPercent: number;
  };
}

export interface AlchemyWebhookConfig {
  id: string;
  network: string;
  type: 'ADDRESS_ACTIVITY' | 'MINED_TRANSACTIONS' | 'DROPPED_TRANSACTIONS' | 'NFT_ACTIVITY';
  url: string;
  active: boolean;
  signingKey?: string;
  addresses?: string[];
  createdAt: string;
}

export interface AlchemyBilling {
  currentPlan: string;
  monthToDateCost: number;
  includedCu: number;
  usedCu: number;
  overageCu: number;
  estimatedOverageCost: number;
}

// =============================================================================
// 客户端
// =============================================================================

declare global {
  // eslint-disable-next-line no-var
  var __alchemyDashboardCache: Map<string, { data: any; expiresAt: number }> | undefined;
}

function getCache() {
  if (!globalThis.__alchemyDashboardCache) {
    globalThis.__alchemyDashboardCache = new Map();
  }
  return globalThis.__alchemyDashboardCache;
}

async function fetchWithCache<T>(key: string, fetcher: () => Promise<T>, ttlMs: number = 30_000): Promise<T> {
  const cache = getCache();
  const cached = cache.get(key);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.data as T;
  }
  const data = await fetcher();
  cache.set(key, { data, expiresAt: Date.now() + ttlMs });
  return data;
}

function getApiKey(): string {
  return process.env.ALCHEMY_API_KEY || process.env.NEXT_PUBLIC_ALCHEMY_API_KEY || '';
}

// =============================================================================
// Status
// =============================================================================

/**
 * 查询 Alchemy 状态
 */
export async function getAlchemyStatus(): Promise<AlchemyStatus> {
  return fetchWithCache('status', async () => {
    const apiKey = getApiKey();
    if (!apiKey) {
      return { status: 'unknown', network: 'unknown', timestamp: Date.now() };
    }
    try {
      const start = Date.now();
      const res = await fetch(`https://eth-mainnet.g.alchemy.com/v2/${apiKey}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'eth_blockNumber' }),
        signal: AbortSignal.timeout(5000),
      });
      const data = await res.json();
      return {
        status: res.ok && data.result ? 'operational' : 'degraded',
        latencyMs: Date.now() - start,
        network: 'eth-mainnet',
        blockNumber: data.result ? parseInt(data.result, 16) : undefined,
        timestamp: Date.now(),
      };
    } catch (err) {
      safeConsoleWarn(`[alchemy-dashboard] status check failed: ${(err as Error).message}`);
      return { status: 'down', network: 'eth-mainnet', timestamp: Date.now() };
    }
  }, 60_000); // 缓存 60s
}

// =============================================================================
// Usage
// =============================================================================

/**
 * 获取 Alchemy 用量统计
 *
 * 注：当前为占位实现（Alchemy 不公开完整的 Usage API 给 free tier）
 * 生产中应订阅 Alchemy 的 Data Usage Export 或使用 CloudWatch 集成
 */
export async function getAlchemyUsage(_days: number = 30): Promise<AlchemyUsageSummary> {
  return fetchWithCache('usage', async () => {
    // 占位：返回结构化空数据
    return {
      currentMonth: {
        totalCu: 0,
        totalWebhooks: 0,
        totalErrors: 0,
        byChain: [],
      },
      history: [],
      quota: {
        monthlyCu: 300_000_000, // 3 亿 CU / 月
        usedPercent: 0,
      },
    };
  }, 300_000); // 缓存 5min
}

// =============================================================================
// Webhooks
// =============================================================================

/**
 * 列出 Alchemy Dashboard 上配置的所有 Webhook
 *
 * 注：需要 Dashboard Admin API（团队级别）
 * 当前为占位：返回从本地环境变量解析的 webhook 配置
 */
export async function listAlchemyWebhooks(): Promise<AlchemyWebhookConfig[]> {
  return fetchWithCache('webhooks', async () => {
    // 占位：返回本地配置
    return [
      {
        id: 'address-activity-1',
        network: 'ETH_MAINNET',
        type: 'ADDRESS_ACTIVITY',
        url: 'https://zsexchange.app/api/webhooks/alchemy/address-activity',
        active: !!process.env.ALCHEMY_WEBHOOK_ADDRESS_ACTIVITY_KEY || !!process.env.ALCHEMY_WEBHOOK_SIGNING_KEY,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'mined-1',
        network: 'ETH_MAINNET',
        type: 'MINED_TRANSACTIONS',
        url: 'https://zsexchange.app/api/webhooks/alchemy/mined',
        active: !!process.env.ALCHEMY_WEBHOOK_MINED_KEY || !!process.env.ALCHEMY_WEBHOOK_SIGNING_KEY,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'dropped-1',
        network: 'ETH_MAINNET',
        type: 'DROPPED_TRANSACTIONS',
        url: 'https://zsexchange.app/api/webhooks/alchemy/dropped',
        active: !!process.env.ALCHEMY_WEBHOOK_DROPPED_KEY || !!process.env.ALCHEMY_WEBHOOK_SIGNING_KEY,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'nft-1',
        network: 'ETH_MAINNET',
        type: 'NFT_ACTIVITY',
        url: 'https://zsexchange.app/api/webhooks/alchemy/nft',
        active: !!process.env.ALCHEMY_WEBHOOK_NFT_KEY || !!process.env.ALCHEMY_WEBHOOK_SIGNING_KEY,
        createdAt: new Date().toISOString(),
      },
    ];
  }, 60_000);
}

// =============================================================================
// Billing
// =============================================================================

/**
 * 获取账单信息
 * 当前为占位：返回模拟数据
 */
export async function getAlchemyBilling(): Promise<AlchemyBilling> {
  return fetchWithCache('billing', async () => {
    return {
      currentPlan: 'Growth (待订阅)',
      monthToDateCost: 0,
      includedCu: 300_000_000,
      usedCu: 0,
      overageCu: 0,
      estimatedOverageCost: 0,
    };
  }, 600_000);
}

// =============================================================================
// Debug Links
// =============================================================================

/**
 * 生成 Alchemy Composer 链接（交易调试）
 */
export function getComposerLink(network: string, txHash: string): string {
  const baseUrl = 'https://composer.alchemy.com/';
  return `${baseUrl}?network=${encodeURIComponent(network)}&txHash=${encodeURIComponent(txHash)}`;
}

/**
 * 生成 Alchemy Dashboard 链接
 */
export function getDashboardLink(): string {
  return 'https://dashboard.alchemy.com/';
}
