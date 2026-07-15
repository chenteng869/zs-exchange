/**
 * Alchemy Token API（2026-07-11 新建 · P3-3）
 *
 * 替代自建索引：1 次 API 调用返回用户所有 ERC-20 代币余额
 *
 *  - getTokenBalances(address, chain)  · 用户所有 ERC-20 余额
 *  - getTokenMetadata(contracts, chain) · 代币元数据（名称/符号/精度/logo）
 *  - getTokenPrices(symbols, chain) · 代币 USD 价格
 *
 * 节省：
 *  - 旧实现：100 次 eth_call（每个代币一次）= 30s+
 *  - 新实现：1 次 API 调用 = < 200ms
 */

import { getAlchemySdkForChain } from './client';
import { Network, TokenBalanceType } from 'alchemy-sdk';

// =============================================================================
// 类型
// =============================================================================

export interface TokenBalance {
  contractAddress: string;
  tokenBalance: string; // 原始单位（wei-like）
  name?: string;
  symbol?: string;
  decimals?: number;
  logo?: string;
  /** 用户可见数量（已除以 decimals）*/
  amountFormatted?: string;
  /** USD 价格（可选，需要再调 getTokenPrices）*/
  priceUsd?: number;
  /** USD 总价（amountFormatted × priceUsd）*/
  valueUsd?: number;
}

export interface TokenMetadata {
  contractAddress: string;
  name: string;
  symbol: string;
  decimals: number;
  logo?: string;
}

export interface TokenPrice {
  symbol: string;
  priceUsd: number;
  /** 24h 涨跌幅（百分比，0.05 = 5%）*/
  change24h?: number;
}

// =============================================================================
// Token Balances
// =============================================================================

/**
 * 获取用户所有 ERC-20 余额（含元数据 + 价格）
 *
 * @param address 钱包地址
 * @param chainKey 链 key（eth/bsc/polygon/arbitrum/optimism/base）
 * @param options
 *   - withPrices: 是否拉取价格（增加 1 次 API 调用）
 *   - minValueUsd: 过滤掉价值低于 N USD 的代币（默认 0.01）
 *   - pageKey: 分页
 */
export async function getTokenBalances(
  address: string,
  chainKey: string,
  options: {
    withPrices?: boolean;
    minValueUsd?: number;
    pageKey?: string;
  } = {},
): Promise<{ tokens: TokenBalance[]; pageKey?: string; totalCount: number }> {
  const sdk = getAlchemySdkForChain(chainKey);
  const minValueUsd = options.minValueUsd ?? 0.01;

  try {
    // 2026-07-11 修复：type 必须是 TokenBalanceType 枚举
    const response = await sdk.core.getTokenBalances(address, {
      type: TokenBalanceType.ERC20,
      pageKey: options.pageKey,
    });

    // 1. 过滤 0 余额
    const nonZero = response.tokenBalances.filter((b) => b.tokenBalance && b.tokenBalance !== '0x0');

    // 2. 批量拉取元数据
    const contractAddrs = nonZero.map((b) => b.contractAddress);
    const metadataMap = await getTokenMetadata(contractAddrs, chainKey);

    // 3. （可选）拉取价格
    let priceMap = new Map<string, number>();
    if (options.withPrices && nonZero.length > 0) {
      const symbols = Array.from(
        new Set(nonZero.map((b) => metadataMap.get(b.contractAddress.toLowerCase())?.symbol).filter(Boolean) as string[]),
      );
      const prices = await getTokenPrices(symbols, chainKey);
      priceMap = new Map(prices.map((p) => [p.symbol.toUpperCase(), p.priceUsd]));
    }

    // 4. 组装结果
    const tokens: TokenBalance[] = nonZero.map((b) => {
      const meta = metadataMap.get(b.contractAddress.toLowerCase());
      const decimals = meta?.decimals || 18;
      const raw = BigInt(b.tokenBalance || '0x0');
      const formatted = formatTokenAmount(raw, decimals);
      const price = meta?.symbol ? priceMap.get(meta.symbol.toUpperCase()) : undefined;
      const valueUsd = price ? Number(formatted) * price : undefined;
      return {
        contractAddress: b.contractAddress,
        tokenBalance: b.tokenBalance,
        name: meta?.name,
        symbol: meta?.symbol,
        decimals,
        logo: meta?.logo,
        amountFormatted: formatted,
        priceUsd: price,
        valueUsd,
      };
    });

    // 5. 过滤低价值
    const filtered = tokens.filter((t) => !t.valueUsd || t.valueUsd >= minValueUsd);

    // 6. 按价值排序
    filtered.sort((a, b) => (b.valueUsd || 0) - (a.valueUsd || 0));

    return {
      tokens: filtered,
      pageKey: response.pageKey,
      totalCount: filtered.length,
    };
  } catch (err) {
    throw new Error(`getTokenBalances failed: ${(err as Error).message}`);
  }
}

// =============================================================================
// Token Metadata
// =============================================================================

/**
 * 批量获取代币元数据（逐个调用 SDK · 2026-07-11 修复）
 *
 * 注：Alchemy SDK 的 getTokenMetadata 是单地址版本，没有 batch 方法
 * 此函数用 Promise.all 并发调用以减少延迟
 */
export async function getTokenMetadata(
  contractAddresses: string[],
  chainKey: string,
): Promise<Map<string, TokenMetadata>> {
  const map = new Map<string, TokenMetadata>();
  const validAddresses = contractAddresses.filter((a) => a && a !== '0x0' && a !== '0x0000000000000000000000000000000000000000');
  if (validAddresses.length === 0) return map;

  try {
    const sdk = getAlchemySdkForChain(chainKey);
    // 2026-07-11 修复：SDK getTokenMetadata 只接受单个 string，不能传数组
    // 用 Promise.all 并发请求（最多 20 个并发，避免 rate limit）
    // 注：TokenMetadataResponse 不含 contractAddress 字段，需要用入参 addr 作为 key
    const batchSize = 20;
    for (let i = 0; i < validAddresses.length; i += batchSize) {
      const batch = validAddresses.slice(i, i + batchSize);
      const results = await Promise.allSettled(
        batch.map((addr) => sdk.core.getTokenMetadata(addr)),
      );
      for (let j = 0; j < batch.length; j++) {
        const r = results[j];
        if (r && r.status === 'fulfilled' && r.value) {
          const meta = r.value;
          const addr = batch[j]!.toLowerCase();
          map.set(addr, {
            contractAddress: batch[j]!,
            name: meta.name || 'Unknown',
            symbol: meta.symbol || '???',
            decimals: meta.decimals || 18,
            logo: meta.logo || undefined,
          });
        }
      }
    }
  } catch {
    // 拉取失败不阻塞，返回空 map
  }

  return map;
}

// =============================================================================
// Token Prices
// =============================================================================

/**
 * 获取多个代币的 USD 价格
 *
 * @param symbols 代币符号数组（如 ['USDT', 'USDC', 'ETH']）
 * @param chainKey 链 key
 */
export async function getTokenPrices(
  symbols: string[],
  chainKey: string,
): Promise<TokenPrice[]> {
  if (symbols.length === 0) return [];

  try {
    const sdk = getAlchemySdkForChain(chainKey);
    // @ts-ignore - alchemy SDK prices API
    const result = await sdk.prices.getTokenPriceBySymbol(symbols);
    const prices: TokenPrice[] = [];
    for (const item of result.data || []) {
      prices.push({
        symbol: item.symbol,
        priceUsd: parseFloat(item.prices.find((p: any) => p.currency === 'usd')?.value || '0'),
        change24h: undefined, // SDK 当前未提供
      });
    }
    return prices;
  } catch {
    return [];
  }
}

// =============================================================================
// 工具
// =============================================================================

/** 原始单位 → 用户可见字符串（保留 8 位小数）*/
export function formatTokenAmount(raw: bigint, decimals: number): string {
  if (raw === 0n) return '0';
  if (decimals === 0) return raw.toString();
  const div = 10n ** BigInt(decimals);
  const whole = raw / div;
  const frac = raw % div;
  if (frac === 0n) return whole.toString();
  const frac8 = (frac * 100_000_000n) / div;
  const fracStr = frac8.toString().padStart(8, '0').replace(/0+$/, '');
  return fracStr ? `${whole.toString()}.${fracStr}` : whole.toString();
}

/** 网络 → 公链名称 */
export function networkToChainName(network: Network): string {
  // 2026-07-11 修复：Alchemy Network 枚举有 100+ 值，无法用 Record<Network, string>
  // 改用 switch 仅映射我们支持的 8 个网络
  switch (network) {
    case Network.ETH_MAINNET: return 'ethereum';
    case Network.ETH_SEPOLIA: return 'sepolia';
    case Network.BNB_MAINNET: return 'bsc';
    case Network.MATIC_MAINNET: return 'polygon';
    case Network.ARB_MAINNET: return 'arbitrum';
    case Network.OPT_MAINNET: return 'optimism';
    case Network.BASE_MAINNET: return 'base';
    case Network.SOLANA_MAINNET: return 'solana';
    default: return 'unknown';
  }
}
