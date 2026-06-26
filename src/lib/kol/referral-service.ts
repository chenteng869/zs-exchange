/**
 * ReferralService — 邀请关系 & 多级分销
 *
 * 职责：
 *  - 用户绑定 KOL 推广码
 *  - 多级分销链：A → B → C，A 为 L1，B 为 L2，C 为 L3
 *  - 业绩累计（交易量 / 贡献返佣）
 *  - 反向查询用户的邀请链
 *
 * 用法：
 *   const svc = new ReferralService();
 *   const r = svc.bindReferral('user_X', 'KOLAB12', kolService);  // X 被 KOL 邀请
 *   const chain = svc.getReferralChain('user_X');                  // 邀请链（[kolA, kolB, kolC]）
 *   const downline = svc.getDownline(kolId, 3);                    // 三级下线
 *
 * 多级分销模型：
 *   - 用户 X 绑定到 KOL A（X 的 referral.level=1，kolId=A）
 *   - X 邀请 Y，Y 绑定到 KOL X（Y 的 referral.level=1，kolId=X）
 *   - 同时 Y 也通过 X 链回 A：Y 的另一条 referral.level=2，kolId=A
 *   - Y 邀请 Z：Z 的 referral.level=1，kolId=Y；level=2，kolId=X；level=3，kolId=A
 */

import { decAdd } from '@/lib/matching/decimal';
import type { Kol, Referral } from './types';
import { KOL_MAX_LEVEL } from './types';

export interface KolLookup {
  /** 通过 kol.id 查 KOL。 */
  getKol(id: string): Kol | null;
  /** 通过 userId 查 KOL。 */
  getKolByUserId(userId: string): Kol | null;
  /** 通过推广码查 KOL。 */
  getKolByReferralCode(code: string): Kol | null;
}

export interface BindOptions {
  /** 外部强制指定 referral id。 */
  referralId?: string;
}

export class ReferralService {
  /** referralId -> Referral */
  private readonly referrals = new Map<string, Referral>();
  /** userId -> referralId（一个用户只能绑定到一个 KOL，存的是 L1 的那条 referral.id） */
  private readonly userBinding = new Map<string, string>();
  /** kolId -> referralIds[] */
  private readonly kolReferrals = new Map<string, string[]>();

  private readonly maxLevel: number;

  constructor(opts: { maxLevel?: number } = {}) {
    this.maxLevel = opts.maxLevel ?? KOL_MAX_LEVEL;
  }

  // -------------------------------------------------------------------------
  // 邀请绑定
  // -------------------------------------------------------------------------

  /**
   * 用户绑定到 KOL（通过推广码）。
   *  - 若用户已绑定 → 抛错
   *  - 若推广码无效 → 抛错
   *  - 自动建立多级链：
   *    1) 先建 L1 = 当前 KOL
   *    2) 然后沿 KOL 的邀请链继续找其上线 KOL，建立 L2/L3
   */
  bindReferral(userId: string, referralCode: string, kolLookup: KolLookup, opts: BindOptions = {}): Referral {
    if (!userId) throw new Error('userId is required');
    if (!referralCode) throw new Error('referralCode is required');
    if (this.userBinding.has(userId)) {
      throw new Error(`user ${userId} has already bound a KOL`);
    }

    const kol = kolLookup.getKolByReferralCode(referralCode);
    if (!kol) {
      throw new Error(`referralCode ${referralCode} not found`);
    }
    if (kol.status === 'banned') {
      throw new Error(`KOL ${kol.id} is banned`);
    }

    const now = Date.now();
    const directReferral: Referral = {
      id: opts.referralId ?? this.genId('ref_l1', now, userId),
      kolId: kol.id,
      userId,
      level: 1,
      invitedAt: now,
      totalTradingVolume: '0',
      totalCommission: '0',
      status: 'active',
    };
    this.referrals.set(directReferral.id, directReferral);
    this.userBinding.set(userId, directReferral.id);
    this.appendKolReferral(kol.id, directReferral.id);

    // 沿 KOL 的邀请链向上找（kol.userId 可能是另一个 KOL 的下线）
    let currentKol: Kol | null = kol;
    for (let lv = 2; lv <= this.maxLevel; lv++) {
      if (!currentKol) break;
      // 找到 currentKol 的邀请人
      const parentRefId = this.userBinding.get(currentKol.userId);
      if (!parentRefId) break;
      const parentRef = this.referrals.get(parentRefId);
      if (!parentRef) break;
      const parentKol = kolLookup.getKol(parentRef.kolId);
      if (!parentKol) break;

      const subReferral: Referral = {
        id: this.genId(`ref_l${lv}`, now, userId),
        kolId: parentKol.id,
        userId,
        level: lv,
        invitedAt: now,
        totalTradingVolume: '0',
        totalCommission: '0',
        status: 'active',
      };
      this.referrals.set(subReferral.id, subReferral);
      this.appendKolReferral(parentKol.id, subReferral.id);
      currentKol = parentKol;
    }

    return directReferral;
  }

  /**
   * 解绑邀请。
   *  - 把用户所有层级的 referral 标记为 inactive
   */
  unbindReferral(userId: string): void {
    if (!this.userBinding.has(userId)) {
      throw new Error(`user ${userId} has no binding`);
    }
    for (const ref of this.referrals.values()) {
      if (ref.userId === userId) {
        ref.status = 'inactive';
      }
    }
    this.userBinding.delete(userId);
  }

  // -------------------------------------------------------------------------
  // 查询
  // -------------------------------------------------------------------------

  /** 取得某 KOL 的所有 referral，可按 level 过滤。 */
  getReferrals(kolId: string, level?: number): Referral[] {
    const ids = this.kolReferrals.get(kolId) ?? [];
    const arr: Referral[] = [];
    for (const id of ids) {
      const r = this.referrals.get(id);
      if (!r) continue;
      if (level !== undefined && r.level !== level) continue;
      arr.push(r);
    }
    return arr;
  }

  /**
   * 用户的邀请链（从 L1 → Lmax）。
   *  - 返回 referral 数组（按 level 升序）
   */
  getReferralChain(userId: string): Referral[] {
    const out: Referral[] = [];
    for (const ref of this.referrals.values()) {
      if (ref.userId === userId && ref.status === 'active') {
        out.push(ref);
      }
    }
    out.sort((a, b) => a.level - b.level);
    return out;
  }

  /**
   * KOL 的下线（多级），默认最大 3 级。
   */
  getDownline(kolId: string, maxLevel: number = KOL_MAX_LEVEL): Referral[] {
    const arr: Referral[] = [];
    for (let lv = 1; lv <= Math.min(maxLevel, this.maxLevel); lv++) {
      arr.push(...this.getReferrals(kolId, lv));
    }
    return arr;
  }

  /**
   * 用户是否在某 KOL 的下线中（任意层级）。
   */
  isInDownline(kolId: string, userId: string): boolean {
    const down = this.getDownline(kolId);
    return down.some((r) => r.userId === userId);
  }

  /**
   * 团队总交易量（所有下线 referral 的累计交易量）。
   */
  getTeamVolume(kolId: string): string {
    let sum = '0';
    for (const r of this.getDownline(kolId)) {
      sum = decAdd(sum, r.totalTradingVolume);
    }
    return sum;
  }

  // -------------------------------------------------------------------------
  // 业绩
  // -------------------------------------------------------------------------

  /**
   * 更新某 referral 的累计交易量 + 返佣。
   *  - 累加
   */
  updateTradingVolume(referralId: string, addedVolume: string, addedCommission: string = '0'): void {
    const r = this.referrals.get(referralId);
    if (!r) throw new Error(`referral ${referralId} not found`);
    r.totalTradingVolume = decAdd(r.totalTradingVolume, addedVolume);
    r.totalCommission = decAdd(r.totalCommission, addedCommission);
  }

  /**
   * 用户的累计交易量（取 L1 referral 的 totalTradingVolume）。
   */
  getUserVolume(userId: string, _period?: { start: number; end: number }): string {
    const refId = this.userBinding.get(userId);
    if (!refId) return '0';
    const ref = this.referrals.get(refId);
    return ref ? ref.totalTradingVolume : '0';
  }

  /**
   * 用户的 KOL（直接邀请人）。
   */
  getUserKkol(userId: string): string | null {
    const refId = this.userBinding.get(userId);
    if (!refId) return null;
    const ref = this.referrals.get(refId);
    return ref ? ref.kolId : null;
  }

  // -------------------------------------------------------------------------
  // 内部
  // -------------------------------------------------------------------------

  private appendKolReferral(kolId: string, refId: string): void {
    const arr = this.kolReferrals.get(kolId);
    if (arr) {
      arr.push(refId);
    } else {
      this.kolReferrals.set(kolId, [refId]);
    }
  }

  private genId(prefix: string, now: number, userId: string): string {
    return `${prefix}_${now.toString(36)}_${userId}_${Math.floor(Math.random() * 1e6).toString(36)}`;
  }

  /** 全量 referral（测试 / 报表用）。 */
  getAllReferrals(): Referral[] {
    return Array.from(this.referrals.values());
  }

  size(): number {
    return this.referrals.size;
  }
}

export default ReferralService;
