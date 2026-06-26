/**
 * Nansen 钱包画像（WalletProfiler）
 *
 * 职责：
 *  - 钱包画像（地址、标签、风险、活跃）
 *  - 交易历史 + 盈亏分析 + 胜率
 *  - 排行榜（按 PnL / 交易量 / 胜率）
 *  - 关注 / 取关 / 关注列表
 *
 * 演示降级：
 *  - 交易历史和 PnL 通过 NansenClient + 本地聚合计算（mock 模式生成合成数据）
 *  - 排行榜使用 demo 数据 + 用户自己关注的地址补充
 */

import { NansenClient } from './nansen-client';
import {
  Chain,
  NansenAddress,
  WalletLeaderboardEntry,
  WalletPnL,
  WalletTrade,
  genId,
  genTxHash,
} from './types';

// =============================================================================
// 类型
// =============================================================================

export type LeaderboardMetric = 'pnl' | 'volume' | 'win_rate';
export type LeaderboardPeriod = '24h' | '7d' | '30d' | '90d' | 'all';

export interface WalletProfilerOptions {
  client: NansenClient;
  /** 关注存储后端（默认内存） */
  followStore?: FollowStore;
  now?: () => number;
}

export interface FollowStore {
  follow(userId: string, address: string, chain: Chain, label?: string): void;
  unfollow(userId: string, address: string, chain: Chain): boolean;
  listFollowed(userId: string): FollowedWallet[];
}

export interface FollowedWallet {
  userId: string;
  address: string;
  chain: Chain;
  label?: string;
  followedAt: number;
}

// =============================================================================
// 默认内存关注存储
// =============================================================================

export class InMemoryFollowStore implements FollowStore {
  private readonly map: Map<string, Map<string, FollowedWallet>> = new Map();

  follow(userId: string, address: string, chain: Chain, label?: string): void {
    if (!this.map.has(userId)) this.map.set(userId, new Map());
    const key = `${chain}:${address.toLowerCase()}`;
    this.map.get(userId)!.set(key, {
      userId,
      address,
      chain,
      label,
      followedAt: Date.now(),
    });
  }

  unfollow(userId: string, address: string, chain: Chain): boolean {
    const sub = this.map.get(userId);
    if (!sub) return false;
    return sub.delete(`${chain}:${address.toLowerCase()}`);
  }

  listFollowed(userId: string): FollowedWallet[] {
    const sub = this.map.get(userId);
    return sub ? Array.from(sub.values()) : [];
  }

  clear(): void {
    this.map.clear();
  }
}

// =============================================================================
// WalletProfiler
// =============================================================================

export class WalletProfiler {
  private readonly client: NansenClient;
  private readonly followStore: FollowStore;
  private readonly now: () => number;

  constructor(opts: WalletProfilerOptions) {
    this.client = opts.client;
    this.followStore = opts.followStore || new InMemoryFollowStore();
    this.now = opts.now || (() => Date.now());
  }

  // -------------------------------------------------------------------------
  // 画像
  // -------------------------------------------------------------------------

  profile(address: string, chain: Chain): Promise<NansenAddress | null> {
    return this.client.getAddress(address, chain);
  }

  /** 交易历史（mock 时合成） */
  async getTradingHistory(address: string, chain: Chain, days: number): Promise<WalletTrade[]> {
    if (this.client.isMock()) {
      return this.demoTrades(address, chain, days);
    }
    // 真实 API 可在此扩展；目前 demo 模式为主
    return this.demoTrades(address, chain, days);
  }

  /** 盈亏 */
  async getPnL(address: string, chain: Chain, days: number): Promise<WalletPnL> {
    const trades = await this.getTradingHistory(address, chain, days);
    let realized = 0;
    let unrealized = 0;
    let wins = 0;
    let losses = 0;
    // 简化：把 trades 按 token 分组，模拟 realized（卖出已实现） + unrealized（当前持仓）
    const positions: Record<string, { costBasis: number; amount: number }> = {};
    for (const t of trades) {
      const usd = Number(t.amountUsd);
      const key = t.tokenAddress.toLowerCase();
      if (t.side === 'buy') {
        if (!positions[key]) positions[key] = { costBasis: 0, amount: 0 };
        positions[key].costBasis += usd;
        positions[key].amount += 1;
      } else {
        if (!positions[key]) positions[key] = { costBasis: 0, amount: 0 };
        const sellRatio = Math.min(1, 1 / Math.max(1, positions[key].amount));
        const cost = positions[key].costBasis * sellRatio;
        realized += usd - cost;
        positions[key].costBasis -= cost;
        positions[key].amount = Math.max(0, positions[key].amount - 1);
        if (usd > cost) wins++;
        else losses++;
      }
    }
    // 未实现：剩余持仓按 +20% 标记
    for (const p of Object.values(positions)) {
      if (p.amount > 0) unrealized += p.costBasis * 0.2;
    }
    const total = realized + unrealized;
    const winRate = wins + losses === 0 ? 0 : wins / (wins + losses);
    return {
      realized: realized.toString(),
      unrealized: unrealized.toString(),
      total: total.toString(),
      winRate,
    };
  }

  /** 胜率（0-1） */
  async getWinRate(address: string, chain: Chain, days: number): Promise<number> {
    const pnl = await this.getPnL(address, chain, days);
    return pnl.winRate;
  }

  // -------------------------------------------------------------------------
  // 排行榜
  // -------------------------------------------------------------------------

  async getTopWallets(
    period: LeaderboardPeriod,
    metric: LeaderboardMetric,
    limit: number = 20,
  ): Promise<WalletLeaderboardEntry[]> {
    // 演示：基于固定 demo 钱包聚合计算
    const seedAddresses = this.seedAddresses();
    const out: WalletLeaderboardEntry[] = [];
    for (let i = 0; i < seedAddresses.length; i++) {
      const { address, chain, entity } = seedAddresses[i];
      const days = this.periodToDays(period);
      const pnl = await this.getPnL(address, chain, days);
      const trades = await this.getTradingHistory(address, chain, days);
      const volume = trades.reduce((a, b) => a + Number(b.amountUsd), 0);
      let score: number;
      let metricValue: string;
      switch (metric) {
        case 'pnl':
          score = Number(pnl.total);
          metricValue = `$${Math.round(Number(pnl.total)).toLocaleString()}`;
          break;
        case 'volume':
          score = volume;
          metricValue = `$${Math.round(volume).toLocaleString()}`;
          break;
        case 'win_rate':
          score = pnl.winRate;
          metricValue = `${(pnl.winRate * 100).toFixed(1)}%`;
          break;
      }
      out.push({
        rank: 0, // 排序后填充
        address,
        chain,
        entity,
        metric: metricValue,
        winRate: pnl.winRate,
        txCount: trades.length,
        totalPnlUsd: pnl.total,
      });
      // 替换 score
      (out[out.length - 1] as any).__score = score;
    }
    out.sort((a, b) => (b as any).__score - (a as any).__score);
    return out.slice(0, limit).map((e, i) => {
      const { __score, ...rest } = e as any;
      return { ...rest, rank: i + 1 } as WalletLeaderboardEntry;
    });
  }

  // -------------------------------------------------------------------------
  // 关注
  // -------------------------------------------------------------------------

  follow(address: string, userId: string, chain: Chain, label?: string): void {
    this.followStore.follow(userId, address, chain, label);
  }

  unfollow(address: string, userId: string, chain: Chain): boolean {
    return this.followStore.unfollow(userId, address, chain);
  }

  async getFollowed(userId: string): Promise<NansenAddress[]> {
    const list = this.followStore.listFollowed(userId);
    const out: NansenAddress[] = [];
    for (const f of list) {
      const a = await this.client.getAddress(f.address, f.chain);
      if (a) out.push(a);
    }
    return out;
  }

  // -------------------------------------------------------------------------
  // Demo 数据
  // -------------------------------------------------------------------------

  private seedAddresses(): Array<{ address: string; chain: Chain; entity?: string }> {
    return [
      { address: '0x1111111111111111111111111111111111111111', chain: 'ethereum', entity: 'Smart Whale #1' },
      { address: '0x2222222222222222222222222222222222222222', chain: 'ethereum', entity: 'Binance Hot' },
      { address: '0x3333333333333333333333333333333333333333', chain: 'arbitrum', entity: 'a16z' },
      { address: '0x4444444444444444444444444444444444444444', chain: 'base', entity: 'Paradigm' },
      { address: '0x5555555555555555555555555555555555555555', chain: 'ethereum', entity: 'Jump Trading' },
      { address: '0x6666666666666666666666666666666666666666', chain: 'optimism', entity: 'Wintermute' },
      { address: '0x7777777777777777777777777777777777777777', chain: 'bsc', entity: 'CZ Reserve' },
      { address: '0x8888888888888888888888888888888888888888', chain: 'polygon', entity: 'Polygon Team' },
    ];
  }

  private demoTrades(address: string, chain: Chain, days: number): WalletTrade[] {
    const seed = parseInt(address.slice(2, 4), 16) || 1;
    const symbols = ['WETH', 'USDC', 'ARB', 'PEPE', 'OP'];
    const out: WalletTrade[] = [];
    const n = Math.min(50, Math.max(5, days * 2));
    for (let i = 0; i < n; i++) {
      const sym = symbols[(seed + i) % symbols.length];
      const side: 'buy' | 'sell' = i % 2 === 0 ? 'buy' : 'sell';
      const amountUsd = (10_000 + ((seed + i) % 25) * 5_000).toString();
      out.push({
        txHash: genTxHash(`${address}:${i}`),
        chain,
        side,
        tokenSymbol: sym,
        tokenAddress: '0x' + ((seed + i) * 1000).toString(16).padStart(40, '0').slice(0, 40),
        amount: String(Math.floor(Number(amountUsd) * 1e6)),
        amountUsd,
        priceUsd: (1 + ((seed + i) % 50) / 100).toFixed(2),
        timestamp: this.now() - i * 3_600_000,
        counterparty: '0x' + ((seed + i + 100) * 13).toString(16).padStart(40, '0').slice(0, 40),
      });
    }
    return out;
  }

  private periodToDays(period: LeaderboardPeriod): number {
    switch (period) {
      case '24h': return 1;
      case '7d': return 7;
      case '30d': return 30;
      case '90d': return 90;
      case 'all': return 365;
    }
  }
}
