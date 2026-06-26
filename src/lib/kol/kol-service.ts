/**
 * KolService — KOL 管理
 *
 * 职责：
 *  - KOL 申请 / 审批 / 暂停 / 拉黑
 *  - 推广码生成 / 解析
 *  - 等级评定（按粉丝数 / 团队交易量）
 *  - 排行榜（按业绩）
 *
 * 用法：
 *   const svc = new KolService();
 *   const kol = svc.applyKol('user_1', { displayName: 'Alice', kycVerified: true });
 *   svc.approveKol(kol.id, 'macro');
 *   const board = svc.getLeaderboard({ start, end }, 10);
 */

import { decCmp, decGte } from '@/lib/matching/decimal';
import {
  type Kol,
  type KolStats,
  type KolStatus,
  type KolTier,
  KOL_TIER_MIN_FOLLOWERS,
  KOL_TIER_MIN_VOLUME,
  KOL_LEADERBOARD_LIMIT,
} from './types';

export interface ApplyKolOptions {
  displayName: string;
  bio?: string;
  avatarUrl?: string;
  socials?: Kol['socials'];
  followerCount?: number;
  kycVerified?: boolean;
  /** 指定 referralCode（默认自动生成）。 */
  referralCode?: string;
}

const KOL_TIERS_RANK: KolTier[] = [
  'institutional',
  'celebrity',
  'mega',
  'macro',
  'micro',
];

export class KolService {
  /** KOL 存储 (id -> Kol) */
  private readonly kols = new Map<string, Kol>();
  /** userId -> kolId 索引（一个 user 只能是一个 KOL） */
  private readonly userIndex = new Map<string, string>();
  /** referralCode -> kolId 索引 */
  private readonly codeIndex = new Map<string, string>();

  // -------------------------------------------------------------------------
  // KOL 管理
  // -------------------------------------------------------------------------

  /**
   * 申请成为 KOL（默认 status='pending'，待审批）。
   */
  applyKol(userId: string, opts: ApplyKolOptions): Kol {
    if (!userId) throw new Error('userId is required');
    if (!opts?.displayName) throw new Error('displayName is required');
    if (this.userIndex.has(userId)) {
      throw new Error(`user ${userId} has already applied for KOL`);
    }

    const now = Date.now();
    const id = `kol_${now.toString(36)}_${Math.floor(Math.random() * 1e6).toString(36)}`;
    const code = opts.referralCode ?? this.generateReferralCode(opts.displayName);

    if (this.codeIndex.has(code)) {
      throw new Error(`referralCode ${code} is already taken`);
    }

    const kol: Kol = {
      id,
      userId,
      displayName: opts.displayName,
      tier: 'micro',
      status: 'pending',
      avatarUrl: opts.avatarUrl,
      bio: opts.bio,
      socials: opts.socials ?? {},
      followerCount: opts.followerCount ?? 0,
      totalCommission: '0',
      pendingCommission: '0',
      withdrawnCommission: '0',
      kycVerified: !!opts.kycVerified,
      approvedAt: 0,
      joinedAt: now,
      referralCode: code,
    };

    this.kols.set(id, kol);
    this.userIndex.set(userId, id);
    this.codeIndex.set(code, id);
    return kol;
  }

  /**
   * 审批通过（pending → active）。
   *  - 必须在 KYC 已完成才可审批
   */
  approveKol(id: string, tier: KolTier = 'micro'): Kol {
    const kol = this.requireKol(id);
    if (kol.status === 'banned') {
      throw new Error(`kol ${id} is banned and cannot be approved`);
    }
    if (!kol.kycVerified) {
      throw new Error(`kol ${id} must complete KYC before approval`);
    }
    kol.status = 'active';
    kol.tier = tier;
    kol.approvedAt = Date.now();
    return kol;
  }

  /**
   * 暂停 KOL。
   */
  suspendKol(id: string, reason: string): Kol {
    const kol = this.requireKol(id);
    if (kol.status === 'banned') {
      throw new Error(`kol ${id} is already banned`);
    }
    kol.status = 'suspended';
    kol.suspendReason = reason;
    return kol;
  }

  /**
   * 拉黑 KOL。
   */
  banKol(id: string, reason: string): Kol {
    const kol = this.requireKol(id);
    kol.status = 'banned';
    kol.suspendReason = reason;
    return kol;
  }

  /**
   * 恢复（suspended → active，banned 不可恢复）。
   */
  reactivateKol(id: string): Kol {
    const kol = this.requireKol(id);
    if (kol.status === 'banned') {
      throw new Error(`kol ${id} is banned and cannot be reactivated`);
    }
    kol.status = 'active';
    kol.suspendReason = undefined;
    return kol;
  }

  /**
   * 更新 KOL profile。
   */
  updateProfile(id: string, updates: Partial<Pick<Kol, 'displayName' | 'avatarUrl' | 'bio' | 'socials' | 'followerCount' | 'kycVerified' | 'customCommissionRate'>>): Kol {
    const kol = this.requireKol(id);
    if (updates.displayName !== undefined) kol.displayName = updates.displayName;
    if (updates.avatarUrl !== undefined) kol.avatarUrl = updates.avatarUrl;
    if (updates.bio !== undefined) kol.bio = updates.bio;
    if (updates.socials !== undefined) kol.socials = { ...kol.socials, ...updates.socials };
    if (typeof updates.followerCount === 'number' && updates.followerCount >= 0) {
      kol.followerCount = updates.followerCount;
    }
    if (updates.kycVerified !== undefined) kol.kycVerified = updates.kycVerified;
    if (typeof updates.customCommissionRate === 'number') {
      kol.customCommissionRate = updates.customCommissionRate;
    }
    return kol;
  }

  // -------------------------------------------------------------------------
  // 查询
  // -------------------------------------------------------------------------

  getKol(id: string): Kol | null {
    return this.kols.get(id) ?? null;
  }

  getKolByUserId(userId: string): Kol | null {
    const id = this.userIndex.get(userId);
    if (!id) return null;
    return this.kols.get(id) ?? null;
  }

  getKolByReferralCode(code: string): Kol | null {
    const id = this.codeIndex.get(code);
    if (!id) return null;
    return this.kols.get(id) ?? null;
  }

  listKols(status?: KolStatus, tier?: KolTier): Kol[] {
    const out: Kol[] = [];
    for (const k of this.kols.values()) {
      if (status && k.status !== status) continue;
      if (tier && k.tier !== tier) continue;
      out.push(k);
    }
    return out;
  }

  // -------------------------------------------------------------------------
  // 等级评定
  // -------------------------------------------------------------------------

  /**
   * 自动评定等级。
   *  - 按粉丝数 + 团队交易量综合判断
   *  - 满足最低要求即可晋升
   *  - 注：teamVolume 由调用方从 ReferralService 传入
   */
  evaluateTier(kolId: string, teamVolume: string = '0'): KolTier {
    const kol = this.requireKol(kolId);
    const followers = kol.followerCount;
    let newTier: KolTier = 'micro';

    // 按 KOL_TIERS_RANK 由高到低检查
    for (const tier of KOL_TIERS_RANK) {
      if (tier === 'institutional') {
        // 机构有独立标准，此处简化为单独标识
        if (followers >= KOL_TIER_MIN_FOLLOWERS[tier] && decGte(teamVolume, KOL_TIER_MIN_VOLUME[tier])) {
          newTier = tier;
          break;
        }
      }
      if (followers >= KOL_TIER_MIN_FOLLOWERS[tier] && decGte(teamVolume, KOL_TIER_MIN_VOLUME[tier])) {
        newTier = tier;
        break;
      }
    }

    kol.tier = newTier;
    return newTier;
  }

  // -------------------------------------------------------------------------
  // 排行榜
  // -------------------------------------------------------------------------

  /**
   * 排行榜：按 totalCommission 降序排（period 区间内）。
   *  - statsFetcher: (kolId) => KolStats — 由 KolEngine 提供
   */
  getLeaderboard(
    period: { start: number; end: number },
    limit: number = KOL_LEADERBOARD_LIMIT,
    statsFetcher?: (kolId: string) => KolStats,
  ): KolStats[] {
    const out: KolStats[] = [];
    for (const kol of this.kols.values()) {
      if (kol.status !== 'active') continue;
      let stats: KolStats;
      if (statsFetcher) {
        stats = statsFetcher(kol.id);
      } else {
        // 默认简易统计
        stats = {
          kolId: kol.id,
          period,
          totalFollowers: kol.followerCount,
          activeFollowers: 0,
          totalTradingVolume: '0',
          totalCommission: kol.totalCommission,
          averageCommissionPerUser: '0',
          rank: 0,
          topReferrals: [],
          byLevel: { 1: { count: 0, volume: '0', commission: '0' }, 2: { count: 0, volume: '0', commission: '0' }, 3: { count: 0, volume: '0', commission: '0' } },
        };
      }
      out.push(stats);
    }
    out.sort((a, b) => decCmp(b.totalCommission, a.totalCommission));
    out.forEach((s, idx) => (s.rank = idx + 1));
    return out.slice(0, limit);
  }

  // -------------------------------------------------------------------------
  // 内部
  // -------------------------------------------------------------------------

  private requireKol(id: string): Kol {
    const kol = this.kols.get(id);
    if (!kol) throw new Error(`kol ${id} not found`);
    return kol;
  }

  /**
   * 生成推广码（base32 简化版）。
   */
  private generateReferralCode(displayName: string): string {
    // 6 位 base36 随机 + 简单 hash
    const seed = (displayName || 'KOL').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 3) || 'KOL';
    const rand = Math.floor(Math.random() * 36 ** 4)
      .toString(36)
      .toUpperCase()
      .padStart(4, '0');
    return `${seed}${rand}`;
  }

  size(): number {
    return this.kols.size;
  }
}

export default KolService;
