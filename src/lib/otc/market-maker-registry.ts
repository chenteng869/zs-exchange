/**
 * OtcMakerRegistry — 机构 OTC 做市商注册表
 *
 * 职责：
 *  - 做市商注册 / 审批 / 暂停 / 拉黑
 *  - 按 tier / 资产筛选
 *  - 按成交量 / 成功率排名
 *  - 预置 5+ 机构做市商（Galaxy / Jump / Cumberland / Wintermute / Genesis）
 *
 * 用法：
 *   const reg = new OtcMakerRegistry();
 *   const m = reg.register({ name: 'Galaxy Digital', tier: 'tier1', supportedAssets: ['BTC','ETH','USDT'], minTradeSize: '100000', maxTradeSize: '100000000' });
 *   reg.approve(m.id);
 *   const top = reg.getTopMakers({ start, end }, 5);
 */

import { decCmp, decGte } from '@/lib/matching/decimal';
import type {
  OtcMaker,
  OtcMakerStatus,
  OtcMakerTier,
} from './types';

export interface RegisterOtcMakerOptions {
  name: string;
  tier: OtcMakerTier;
  supportedAssets: string[];
  minTradeSize: string;
  maxTradeSize: string;
  contactEmail: string;
  successRate?: number;
  totalVolume?: string;
  totalTrades?: number;
  rating?: number;
}

/** 内部生成 id 的工具。 */
function genId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.floor(Math.random() * 1e6).toString(36)}`;
}

const PRESET_OTC_MAKERS: RegisterOtcMakerOptions[] = [
  {
    name: 'Galaxy Digital',
    tier: 'tier1',
    supportedAssets: ['BTC', 'ETH', 'USDT', 'SOL', 'USDC'],
    minTradeSize: '100000',
    maxTradeSize: '500000000',
    contactEmail: 'otc@galaxydigital.com',
    successRate: 0.98,
    rating: 4.9,
  },
  {
    name: 'Jump Crypto',
    tier: 'tier1',
    supportedAssets: ['BTC', 'ETH', 'SOL', 'USDT', 'USDC', 'MATIC'],
    minTradeSize: '100000',
    maxTradeSize: '300000000',
    contactEmail: 'otc@jumptrading.com',
    successRate: 0.97,
    rating: 4.8,
  },
  {
    name: 'Cumberland DRW',
    tier: 'tier1',
    supportedAssets: ['BTC', 'ETH', 'USDT', 'USDC', 'LTC', 'BCH'],
    minTradeSize: '250000',
    maxTradeSize: '1000000000',
    contactEmail: 'otc@cumberland.com',
    successRate: 0.96,
    rating: 4.7,
  },
  {
    name: 'Wintermute',
    tier: 'tier1',
    supportedAssets: ['BTC', 'ETH', 'USDT', 'USDC', 'AVAX', 'DOT'],
    minTradeSize: '100000',
    maxTradeSize: '200000000',
    contactEmail: 'otc@wintermute.com',
    successRate: 0.95,
    rating: 4.6,
  },
  {
    name: 'Genesis Global Trading',
    tier: 'tier2',
    supportedAssets: ['BTC', 'ETH', 'USDT', 'USDC', 'LTC'],
    minTradeSize: '100000',
    maxTradeSize: '150000000',
    contactEmail: 'otc@genesistrading.com',
    successRate: 0.92,
    rating: 4.3,
  },
  {
    name: 'B2C2',
    tier: 'tier2',
    supportedAssets: ['BTC', 'ETH', 'USDT', 'USDC'],
    minTradeSize: '100000',
    maxTradeSize: '100000000',
    contactEmail: 'otc@b2c2.com',
    successRate: 0.93,
    rating: 4.4,
  },
];

export class OtcMakerRegistry {
  /** id -> maker */
  private readonly makers = new Map<string, OtcMaker>();
  /** name -> id 索引（防止重名） */
  private readonly nameIndex = new Map<string, string>();
  /** 是否已自动初始化预置做市商。 */
  private readonly autoSeeded: boolean;

  constructor(opts: { autoSeedPresets?: boolean } = {}) {
    this.autoSeeded = opts.autoSeedPresets !== false;
    if (this.autoSeeded) {
      this.seedPresets();
    }
  }

  // -------------------------------------------------------------------------
  // 注册 / 状态管理
  // -------------------------------------------------------------------------

  /**
   * 注册做市商（默认 status='active'，自动通过；如需审核流可先注册再 approve）。
   */
  register(opts: RegisterOtcMakerOptions): OtcMaker {
    if (!opts?.name) throw new Error('name is required');
    if (!opts.tier) throw new Error('tier is required');
    if (decCmp(opts.minTradeSize, '0') <= 0) {
      throw new Error('minTradeSize must be > 0');
    }
    if (decCmp(opts.maxTradeSize, opts.minTradeSize) < 0) {
      throw new Error('maxTradeSize must be >= minTradeSize');
    }
    if (this.nameIndex.has(opts.name)) {
      throw new Error(`maker with name ${opts.name} already registered`);
    }
    const now = Date.now();
    const id = genId('mm');
    const maker: OtcMaker = {
      id,
      name: opts.name,
      tier: opts.tier,
      status: 'active',
      supportedAssets: [...opts.supportedAssets],
      minTradeSize: opts.minTradeSize,
      maxTradeSize: opts.maxTradeSize,
      successRate: opts.successRate ?? 0.9,
      totalVolume: opts.totalVolume ?? '0',
      totalTrades: opts.totalTrades ?? 0,
      rating: opts.rating ?? 4.0,
      contactEmail: opts.contactEmail,
      joinedAt: now,
    };
    this.makers.set(id, maker);
    this.nameIndex.set(opts.name, id);
    return maker;
  }

  /**
   * 审批（已注册但 status='active' 时是 no-op；保留以兼容"pending→active"模式）。
   */
  approve(id: string): OtcMaker {
    const m = this.require(id);
    m.status = 'active';
    m.suspendReason = undefined;
    return m;
  }

  /**
   * 暂停。
   */
  suspend(id: string, reason: string): OtcMaker {
    const m = this.require(id);
    if (m.status === 'banned') {
      throw new Error(`maker ${id} is banned and cannot be suspended`);
    }
    m.status = 'suspended';
    m.suspendReason = reason;
    return m;
  }

  /**
   * 拉黑。
   */
  ban(id: string, reason: string): OtcMaker {
    const m = this.require(id);
    m.status = 'banned';
    m.suspendReason = reason;
    return m;
  }

  /**
   * 恢复（suspended → active，banned 不可恢复）。
   */
  reactivate(id: string): OtcMaker {
    const m = this.require(id);
    if (m.status === 'banned') {
      throw new Error(`maker ${id} is banned and cannot be reactivated`);
    }
    m.status = 'active';
    m.suspendReason = undefined;
    return m;
  }

  /**
   * 更新做市商 profile。
   */
  updateProfile(
    id: string,
    updates: Partial<Pick<OtcMaker, 'supportedAssets' | 'minTradeSize' | 'maxTradeSize' | 'contactEmail' | 'rating' | 'successRate'>>,
  ): OtcMaker {
    const m = this.require(id);
    if (updates.supportedAssets) m.supportedAssets = [...updates.supportedAssets];
    if (updates.minTradeSize) m.minTradeSize = updates.minTradeSize;
    if (updates.maxTradeSize) m.maxTradeSize = updates.maxTradeSize;
    if (updates.contactEmail) m.contactEmail = updates.contactEmail;
    if (typeof updates.rating === 'number') m.rating = updates.rating;
    if (typeof updates.successRate === 'number') m.successRate = updates.successRate;
    return m;
  }

  // -------------------------------------------------------------------------
  // 查询
  // -------------------------------------------------------------------------

  getMaker(id: string): OtcMaker | null {
    return this.makers.get(id) ?? null;
  }

  getMakerByName(name: string): OtcMaker | null {
    const id = this.nameIndex.get(name);
    if (!id) return null;
    return this.makers.get(id) ?? null;
  }

  /**
   * 列表：按 tier / asset 过滤。
   *  - tier  : tier1 / tier2 / tier3
   *  - asset : 支持的资产符号（按 supportedAssets 包含）
   *  - status: 状态过滤
   */
  listMakers(
    tier?: OtcMakerTier,
    asset?: string,
    status?: OtcMakerStatus,
  ): OtcMaker[] {
    const out: OtcMaker[] = [];
    for (const m of this.makers.values()) {
      if (tier && m.tier !== tier) continue;
      if (asset && !m.supportedAssets.includes(asset)) continue;
      if (status && m.status !== status) continue;
      out.push(m);
    }
    return out;
  }

  /**
   * 顶级做市商（排行榜）。
   *  - sortBy: 'volume' (默认) | 'successRate' | 'rating' | 'trades'
   */
  getTopMakers(
    _period: { start: number; end: number },
    limit: number = 10,
    sortBy: 'volume' | 'successRate' | 'rating' | 'trades' = 'volume',
  ): OtcMaker[] {
    const arr = this.listMakers(undefined, undefined, 'active');
    arr.sort((a, b) => {
      if (sortBy === 'volume') return decCmp(b.totalVolume, a.totalVolume);
      if (sortBy === 'successRate') return b.successRate - a.successRate;
      if (sortBy === 'rating') return b.rating - a.rating;
      return b.totalTrades - a.totalTrades;
    });
    return arr.slice(0, limit);
  }

  /**
   * 累计成交量（用于结算后更新）。
   */
  addVolume(id: string, amount: string, tradesCount: number = 1): OtcMaker {
    const m = this.require(id);
    m.totalVolume = decGte(m.totalVolume, '0') ? addString(m.totalVolume, amount) : amount;
    m.totalTrades += tradesCount;
    return m;
  }

  /**
   * 内部：直接加入预置做市商（不触发 register 的去重检查）。
   */
  private seedPresets(): void {
    for (const p of PRESET_OTC_MAKERS) {
      if (this.nameIndex.has(p.name)) continue;
      const id = genId('mm');
      const maker: OtcMaker = {
        id,
        name: p.name,
        tier: p.tier,
        status: 'active',
        supportedAssets: [...p.supportedAssets],
        minTradeSize: p.minTradeSize,
        maxTradeSize: p.maxTradeSize,
        successRate: p.successRate ?? 0.9,
        totalVolume: p.totalVolume ?? '0',
        totalTrades: p.totalTrades ?? 0,
        rating: p.rating ?? 4.0,
        contactEmail: p.contactEmail,
        joinedAt: Date.now(),
      };
      this.makers.set(id, maker);
      this.nameIndex.set(p.name, id);
    }
  }

  private require(id: string): OtcMaker {
    const m = this.makers.get(id);
    if (!m) throw new Error(`otc maker ${id} not found`);
    return m;
  }

  size(): number {
    return this.makers.size;
  }
}

/** 简单字符串加法（用于累计）。 */
function addString(a: string, b: string): string {
  // 使用 decAdd 等价实现（避免循环依赖）
  const [ai, af = ''] = a.split('.');
  const [bi, bf = ''] = b.split('.');
  const scale = Math.max(af.length, bf.length);
  const ap = (af + '0'.repeat(scale - af.length)).padStart(scale, '0') || '0';
  const bp = (bf + '0'.repeat(scale - bf.length)).padStart(scale, '0') || '0';
  // 简化：把两数转为大整数相加
  const aSign = a.startsWith('-') ? -1n : 1n;
  const bSign = b.startsWith('-') ? -1n : 1n;
  const aBig = BigInt((ai.startsWith('-') ? ai.slice(1) : ai) + ap) * aSign;
  const bBig = BigInt((bi.startsWith('-') ? bi.slice(1) : bi) + bp) * bSign;
  const sum = aBig + bBig;
  const negative = sum < 0n;
  const abs = negative ? -sum : sum;
  const s = abs.toString().padStart(scale + 1, '0');
  if (scale === 0) return (negative ? '-' : '') + s;
  const intPart = s.slice(0, s.length - scale);
  const fracPart = s.slice(s.length - scale).replace(/0+$/, '');
  if (!fracPart) return (negative ? '-' : '') + intPart;
  return (negative ? '-' : '') + intPart + '.' + fracPart;
}

export default OtcMakerRegistry;
