/**
 * Alchemy Solana Token API（2026-07-11 新建 · P5-5）
 *
 * Solana 链上资产查询
 *  - getSolBalance(address)         · SOL 原生币余额
 *  - getSplTokenBalances(address)    · SPL 代币余额
 *  - getSolTransactions(address)     · 交易历史
 */

import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { getAssociatedTokenAddress, getAccount } from '@solana/spl-token';
import { alchemySolanaUrl } from '@/lib/wallet/rpc-client';

// =============================================================================
// 类型
// =============================================================================

export interface SolBalance {
  address: string;
  lamports: number;
  sol: number;
}

export interface SplTokenBalance {
  mint: string;
  address: string; // ATA
  amount: string; // 原始单位
  amountFormatted: string;
  decimals: number;
  symbol?: string;
  name?: string;
}

export interface SolTransaction {
  signature: string;
  slot: number;
  blockTime: number | null;
  fee: number;
  status: 'success' | 'failed';
}

// =============================================================================
// 单例 Connection
// =============================================================================

declare global {
  // eslint-disable-next-line no-var
  var __solanaConnection: Connection | undefined;
}

function getConnection(): Connection {
  if (!globalThis.__solanaConnection) {
    const url = process.env.ALCHEMY_SOLANA_RPC_URL
      || (process.env.ALCHEMY_API_KEY ? alchemySolanaUrl(process.env.ALCHEMY_API_KEY) : 'https://api.mainnet-beta.solana.com');
    globalThis.__solanaConnection = new Connection(url, 'confirmed');
  }
  return globalThis.__solanaConnection;
}

// =============================================================================
// SOL 余额
// =============================================================================

export async function getSolBalance(address: string): Promise<SolBalance> {
  const pubkey = new PublicKey(address);
  const lamports = await getConnection().getBalance(pubkey);
  return {
    address,
    lamports,
    sol: lamports / LAMPORTS_PER_SOL,
  };
}

// =============================================================================
// SPL Token 余额
// =============================================================================

/** 已知 SPL Token 元数据（简化版，生产中应查链上 metadata）*/
const KNOWN_SPL_TOKENS: Record<string, { symbol: string; name: string; decimals: number }> = {
  EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v: { symbol: 'USDC', name: 'USD Coin', decimals: 6 },
  Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB: { symbol: 'USDT', name: 'Tether USD', decimals: 6 },
  So11111111111111111111111111111111111111112: { symbol: 'wSOL', name: 'Wrapped SOL', decimals: 9 },
};

/**
 * 获取用户所有 SPL Token 余额
 * - 简化：扫描已知主流 SPL（USDC/USDT/wSOL）
 * - 生产中可监听 token program 查找全部 ATAs
 */
export async function getSplTokenBalances(address: string): Promise<SplTokenBalance[]> {
  const pubkey = new PublicKey(address);
  const connection = getConnection();
  const results: SplTokenBalance[] = [];

  for (const [mint, meta] of Object.entries(KNOWN_SPL_TOKENS)) {
    try {
      const mintPubkey = new PublicKey(mint);
      const ata = await getAssociatedTokenAddress(mintPubkey, pubkey);
      try {
        const account = await getAccount(connection, ata);
        if (account.amount > 0n) {
          const amount = account.amount.toString();
          const formatted = (Number(account.amount) / 10 ** meta.decimals).toFixed(meta.decimals);
          results.push({
            mint,
            address: ata.toBase58(),
            amount,
            amountFormatted: formatted,
            decimals: meta.decimals,
            symbol: meta.symbol,
            name: meta.name,
          });
        }
      } catch {
        // ATA 不存在 = 无余额
      }
    } catch {
      // 跳过
    }
  }

  return results;
}

// =============================================================================
// 交易历史
// =============================================================================

/**
 * 获取用户最近 N 笔交易签名
 */
export async function getSolTransactions(
  address: string,
  limit: number = 20,
): Promise<SolTransaction[]> {
  const pubkey = new PublicKey(address);
  const signatures = await getConnection().getSignaturesForAddress(pubkey, { limit });

  return signatures.map((s) => ({
    signature: s.signature,
    slot: s.slot,
    blockTime: s.blockTime,
    fee: 0, // 需要 getTransaction 才能拿到
    status: s.err ? 'failed' : 'success',
  }));
}
