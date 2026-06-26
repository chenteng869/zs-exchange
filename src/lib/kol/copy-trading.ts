/**
 * CopyTradingService — 跟单交易服务
 *
 * 职责：
 *  - 跟单配置：createConfig / updateConfig / stopConfig
 *  - 跟单触发：onKolTrade → 给所有 followers 创建跟单
 *  - 跟单模式：
 *    - fixed:        固定金额（fixedAmount）
 *    - proportional: 按比例 (proportionalRatio * KOL 数量)
 *    - scaled:       缩放 (scaled * KOL 数量)
 *  - 风险控制：
 *    - 单笔最大损失 (maxLossPerTrade)
 *    - 每日最大损失 (maxDailyLoss)
 *    - 止损 (stopLossRatio)
 *    - 止盈 (takeProfitRatio)
 *  - 跟单统计
 *
 * 用法：
 *   const copy = new CopyTradingService();
 *   const cfg = copy.createConfig({ followerUserId, kolUserId, mode: 'proportional', proportionalRatio: 0.5 });
 *   const trades = await copy.onKolTrade(kolOrder, kolUserId);
 */

import {
  decAdd,
  decCmp,
  decDiv,
  decGte,
  decIsZero,
  decLte,
  decMax,
  decMul,
  decSub,
  decTruncate,
} from '@/lib/matching/decimal';
import type {
  CopyMode,
  CopyTrade,
  CopyTradingConfig,
  KolOrderLike,
} from './types';
import {
  KOL_COPY_DEFAULT_RATIO,
  KOL_COPY_MAX_RATIO,
  KOL_COPY_MAX_TRADES,
  KOL_DEFAULT_MAX_DAILY_LOSS,
  KOL_DEFAULT_MAX_LOSS_PER_TRADE,
} from './types';

export interface CreateConfigInput {
  followerUserId: string;
  kolUserId: string;
  mode: CopyMode;
  fixedAmount?: string;
  proportionalRatio?: number;
  scaled?: number;
  maxLossPerTrade?: string;
  maxDailyLoss?: string;
  stopLossRatio?: number;
  takeProfitRatio?: number;
}

export interface UpdateConfigInput {
  mode?: CopyMode;
  fixedAmount?: string;
  proportionalRatio?: number;
  scaled?: number;
  maxLossPerTrade?: string;
  maxDailyLoss?: string;
  stopLossRatio?: number;
  takeProfitRatio?: number;
  status?: CopyTradingConfig['status'];
}

export interface RiskCheckResult {
  allowed: boolean;
  reason?: string;
  details?: Record<string, unknown>;
}

export interface CopyStats {
  total: number;
  profit: string;
  loss: string;
  net: string;
  winRate: number;
  winCount: number;
  lossCount: number;
}

export class CopyTradingService {
  /** configId -> CopyTradingConfig */
  private readonly configs = new Map<string, CopyTradingConfig>();
  /** followerUserId -> configIds[] */
  private readonly followerConfigs = new Map<string, string[]>();
  /** kolUserId -> configIds[] */
  private readonly kolFollowers = new Map<string, string[]>();
  /** copyTradeId -> CopyTrade */
  private readonly copyTrades = new Map<string, CopyTrade>();
  /** configId -> copyTradeIds[] */
  private readonly configTrades = new Map<string, string[]>();
  /** followerUserId -> day (YYYY-MM-DD) -> loss string（每日累计） */
  private readonly dailyLoss = new Map<string, Map<string, string>>();

  private readonly maxLossPerTradeDefault: string;
  private readonly maxDailyLossDefault: string;

  constructor(opts: { maxLossPerTradeDefault?: string; maxDailyLossDefault?: string } = {}) {
    this.maxLossPerTradeDefault = opts.maxLossPerTradeDefault ?? KOL_DEFAULT_MAX_LOSS_PER_TRADE;
    this.maxDailyLossDefault = opts.maxDailyLossDefault ?? KOL_DEFAULT_MAX_DAILY_LOSS;
  }

  // -------------------------------------------------------------------------
  // 配置
  // -------------------------------------------------------------------------

  createConfig(input: CreateConfigInput): CopyTradingConfig {
    if (!input.followerUserId) throw new Error('followerUserId is required');
    if (!input.kolUserId) throw new Error('kolUserId is required');
    if (input.followerUserId === input.kolUserId) {
      throw new Error('follower and kol cannot be the same user');
    }
    if (!['fixed', 'proportional', 'scaled'].includes(input.mode)) {
      throw new Error(`invalid mode: ${input.mode}`);
    }
    if (input.mode === 'fixed' && !input.fixedAmount) {
      throw new Error('fixedAmount is required for fixed mode');
    }
    if (input.mode === 'proportional' && (input.proportionalRatio === undefined || input.proportionalRatio <= 0)) {
      throw new Error('proportionalRatio must be > 0');
    }
    if (input.mode === 'scaled' && (input.scaled === undefined || input.scaled <= 0)) {
      throw new Error('scaled must be > 0');
    }
    if (input.proportionalRatio !== undefined && input.proportionalRatio > KOL_COPY_MAX_RATIO) {
      throw new Error(`proportionalRatio cannot exceed ${KOL_COPY_MAX_RATIO}`);
    }

    const now = Date.now();
    const id = `cfg_${now.toString(36)}_${Math.floor(Math.random() * 1e6).toString(36)}`;
    const cfg: CopyTradingConfig = {
      id,
      followerUserId: input.followerUserId,
      kolUserId: input.kolUserId,
      mode: input.mode,
      fixedAmount: input.fixedAmount,
      proportionalRatio: input.proportionalRatio,
      scaled: input.scaled,
      maxLossPerTrade: input.maxLossPerTrade ?? this.maxLossPerTradeDefault,
      maxDailyLoss: input.maxDailyLoss ?? this.maxDailyLossDefault,
      stopLossRatio: input.stopLossRatio,
      takeProfitRatio: input.takeProfitRatio,
      status: 'active',
      startedAt: now,
      totalCopied: 0,
      totalProfit: '0',
    };

    this.configs.set(id, cfg);
    this.appendFollowerConfig(input.followerUserId, id);
    this.appendKolFollower(input.kolUserId, id);
    return cfg;
  }

  updateConfig(id: string, updates: UpdateConfigInput): CopyTradingConfig {
    const cfg = this.requireConfig(id);
    if (updates.mode !== undefined) cfg.mode = updates.mode;
    if (updates.fixedAmount !== undefined) cfg.fixedAmount = updates.fixedAmount;
    if (updates.proportionalRatio !== undefined) cfg.proportionalRatio = updates.proportionalRatio;
    if (updates.scaled !== undefined) cfg.scaled = updates.scaled;
    if (updates.maxLossPerTrade !== undefined) cfg.maxLossPerTrade = updates.maxLossPerTrade;
    if (updates.maxDailyLoss !== undefined) cfg.maxDailyLoss = updates.maxDailyLoss;
    if (updates.stopLossRatio !== undefined) cfg.stopLossRatio = updates.stopLossRatio;
    if (updates.takeProfitRatio !== undefined) cfg.takeProfitRatio = updates.takeProfitRatio;
    if (updates.status !== undefined) cfg.status = updates.status;
    return cfg;
  }

  stopConfig(id: string): CopyTradingConfig {
    const cfg = this.requireConfig(id);
    cfg.status = 'stopped';
    cfg.stoppedAt = Date.now();
    return cfg;
  }

  pauseConfig(id: string): CopyTradingConfig {
    const cfg = this.requireConfig(id);
    cfg.status = 'paused';
    return cfg;
  }

  resumeConfig(id: string): CopyTradingConfig {
    const cfg = this.requireConfig(id);
    if (cfg.status === 'stopped') {
      throw new Error(`config ${id} is stopped and cannot be resumed`);
    }
    cfg.status = 'active';
    return cfg;
  }

  getConfig(id: string): CopyTradingConfig | null {
    return this.configs.get(id) ?? null;
  }

  getFollowerConfigs(userId: string): CopyTradingConfig[] {
    const ids = this.followerConfigs.get(userId) ?? [];
    const arr: CopyTradingConfig[] = [];
    for (const id of ids) {
      const c = this.configs.get(id);
      if (c) arr.push(c);
    }
    return arr;
  }

  getKolFollowers(kolUserId: string): CopyTradingConfig[] {
    const ids = this.kolFollowers.get(kolUserId) ?? [];
    const arr: CopyTradingConfig[] = [];
    for (const id of ids) {
      const c = this.configs.get(id);
      if (c) arr.push(c);
    }
    return arr;
  }

  // -------------------------------------------------------------------------
  // 跟单触发
  // -------------------------------------------------------------------------

  /**
   * KOL 成交时触发。
   *  - 给所有 followers 创建跟单
   *  - 按 mode 计算数量
   *  - 限价单模式（用 KOL 的成交价）
   *  - 风险检查不通过 → 该 follower 不跟单
   */
  async onKolTrade(kolOrder: KolOrderLike, kolUserId: string): Promise<CopyTrade[]> {
    if (kolOrder.userId !== kolUserId) {
      // 简化：调用方应保证 kolOrder.userId === kolUserId
      // 不一致时也允许触发（多 KOL 共享 userId 等情形）
    }
    // 不再 filter status，由 checkRisk 统一处理（这样 paused/stopped 会写入 failed 记录）
    const followers = this.getKolFollowers(kolUserId);
    const trades: CopyTrade[] = [];
    for (const cfg of followers) {
      // 1) 风险检查
      const risk = this.checkRisk(cfg, kolOrder);
      if (!risk.allowed) {
        // 记录一个 failed copyTrade（不计入 totalCopied）
        const failed: CopyTrade = {
          id: this.genTradeId(),
          configId: cfg.id,
          kolOrderId: kolOrder.id,
          followerUserId: cfg.followerUserId,
          symbol: kolOrder.symbol,
          side: kolOrder.side,
          kolQuantity: kolOrder.quantity,
          copyQuantity: '0',
          kolPrice: kolOrder.price,
          followerPrice: kolOrder.price,
          status: 'failed',
          reason: risk.reason,
          createdAt: Date.now(),
        };
        this.copyTrades.set(failed.id, failed);
        this.appendConfigTrade(cfg.id, failed.id);
        trades.push(failed);
        continue;
      }

      // 2) 计算跟单数量
      const qty = this.calcCopyQuantity(cfg, kolOrder);
      if (decIsZero(qty)) continue;

      // 3) 创建跟单
      const trade: CopyTrade = {
        id: this.genTradeId(),
        configId: cfg.id,
        kolOrderId: kolOrder.id,
        followerUserId: cfg.followerUserId,
        symbol: kolOrder.symbol,
        side: kolOrder.side,
        kolQuantity: kolOrder.quantity,
        copyQuantity: qty,
        kolPrice: kolOrder.price,
        followerPrice: kolOrder.price,
        status: 'pending',
        createdAt: Date.now(),
      };
      this.copyTrades.set(trade.id, trade);
      this.appendConfigTrade(cfg.id, trade.id);

      // 4) 模拟成交（同步 fill），并累计 totalCopied
      trade.status = 'filled';
      trade.filledAt = Date.now();
      cfg.totalCopied += 1;
      trades.push(trade);
    }
    return trades;
  }

  /**
   * 计算跟单数量。
   */
  calcCopyQuantity(cfg: CopyTradingConfig, kolOrder: KolOrderLike): string {
    const kolQty = kolOrder.quantity;
    switch (cfg.mode) {
      case 'fixed': {
        // fixedAmount 是 quote（USDT），qty = amount / price
        if (!cfg.fixedAmount) return '0';
        const ratio = decTruncate(decDiv(cfg.fixedAmount, kolOrder.price), 8);
        return ratio;
      }
      case 'proportional': {
        const ratio = cfg.proportionalRatio ?? KOL_COPY_DEFAULT_RATIO;
        return decTruncate(decMul(kolQty, String(ratio)), 8);
      }
      case 'scaled': {
        const s = cfg.scaled ?? 1;
        return decTruncate(decMul(kolQty, String(s)), 8);
      }
      default:
        return '0';
    }
  }

  // -------------------------------------------------------------------------
  // 风险控制
  // -------------------------------------------------------------------------

  /**
   * 风险检查（在创建跟单前调用）。
   *  - 单笔最大损失：估算 value * stopLossRatio 不能超 maxLossPerTrade
   *  - 每日最大损失：本日累计 loss + 此次估算损失 不能超 maxDailyLoss
   *  - stopLossRatio / takeProfitRatio 仅记录（不在下单时阻断）
   */
  checkRisk(cfg: CopyTradingConfig, kolOrder: KolOrderLike): RiskCheckResult {
    // 1) 暂停/停止
    if (cfg.status !== 'active') {
      return { allowed: false, reason: `config_status_${cfg.status}` };
    }

    // 2) 单笔最大损失
    const qty = this.calcCopyQuantity(cfg, kolOrder);
    if (decIsZero(qty)) {
      return { allowed: false, reason: 'zero_quantity' };
    }
    const value = decMul(qty, kolOrder.price);
    const stopLoss = cfg.stopLossRatio;
    if (cfg.maxLossPerTrade && stopLoss && stopLoss > 0) {
      const estLoss = decMul(value, String(stopLoss));
      if (decCmp(estLoss, cfg.maxLossPerTrade) > 0) {
        return {
          allowed: false,
          reason: 'exceed_max_loss_per_trade',
          details: { estLoss, maxLoss: cfg.maxLossPerTrade, value },
        };
      }
    }

    // 3) 每日最大损失
    if (cfg.maxDailyLoss) {
      const today = this.todayKey();
      const dayMap = this.dailyLoss.get(cfg.followerUserId);
      const todayLoss = dayMap?.get(today) ?? '0';
      const newLoss = cfg.maxLossPerTrade && stopLoss && stopLoss > 0
        ? decAdd(todayLoss, decMul(value, String(stopLoss)))
        : todayLoss;
      if (decCmp(newLoss, cfg.maxDailyLoss) > 0) {
        return {
          allowed: false,
          reason: 'exceed_max_daily_loss',
          details: { todayLoss, maxDaily: cfg.maxDailyLoss },
        };
      }
    }

    // 4) KOL_COPY_MAX_TRADES
    if (cfg.totalCopied >= KOL_COPY_MAX_TRADES) {
      return { allowed: false, reason: 'max_trades_reached' };
    }

    return { allowed: true };
  }

  /**
   * 止损检查：跟单成交后，若价格反向移动到止损位，返回 true 触发平仓。
   */
  shouldStopLoss(cfg: CopyTradingConfig, openPrice: string, currentPrice: string, side: 'buy' | 'sell'): boolean {
    if (!cfg.stopLossRatio) return false;
    const drop = decMul(openPrice, String(cfg.stopLossRatio));
    if (side === 'buy') {
      // buy: 跌价止损
      const stop = decSub(openPrice, drop);
      return decLte(currentPrice, stop);
    } else {
      // sell: 涨价止损
      const stop = decAdd(openPrice, drop);
      return decGte(currentPrice, stop);
    }
  }

  /**
   * 止盈检查。
   */
  shouldTakeProfit(cfg: CopyTradingConfig, openPrice: string, currentPrice: string, side: 'buy' | 'sell'): boolean {
    if (!cfg.takeProfitRatio) return false;
    const up = decMul(openPrice, String(cfg.takeProfitRatio));
    if (side === 'buy') {
      const target = decAdd(openPrice, up);
      return decGte(currentPrice, target);
    } else {
      const target = decSub(openPrice, up);
      return decLte(currentPrice, target);
    }
  }

  // -------------------------------------------------------------------------
  // 跟单查询
  // -------------------------------------------------------------------------

  getCopyTrades(configId: string, limit?: number): CopyTrade[] {
    const ids = this.configTrades.get(configId) ?? [];
    const arr: CopyTrade[] = [];
    for (const id of ids) {
      const t = this.copyTrades.get(id);
      if (t) arr.push(t);
    }
    arr.sort((a, b) => b.createdAt - a.createdAt);
    return typeof limit === 'number' ? arr.slice(0, limit) : arr;
  }

  getCopyStats(configId: string): CopyStats {
    const trades = this.getCopyTrades(configId);
    let profit = '0';
    let loss = '0';
    let winCount = 0;
    let lossCount = 0;
    for (const t of trades) {
      if (t.status !== 'filled') continue;
      if (t.pnl === undefined) continue;
      if (decCmp(t.pnl, '0') > 0) {
        profit = decAdd(profit, t.pnl);
        winCount += 1;
      } else if (decCmp(t.pnl, '0') < 0) {
        loss = decAdd(loss, decMul(t.pnl, '-1')); // 正值表示亏损绝对值
        lossCount += 1;
      }
    }
    const total = winCount + lossCount;
    const net = decAdd(profit, decMul(loss, '-1'));
    return {
      total,
      profit,
      loss,
      net,
      winRate: total === 0 ? 0 : winCount / total,
      winCount,
      lossCount,
    };
  }

  /**
   * 注入模拟盈亏（用于测试 / Demo）。
   */
  setCopyTradePnl(tradeId: string, pnl: string): CopyTrade {
    const t = this.copyTrades.get(tradeId);
    if (!t) throw new Error(`copy trade ${tradeId} not found`);
    t.pnl = pnl;
    // 累计到 config
    const cfg = this.configs.get(t.configId);
    if (cfg) {
      cfg.totalProfit = decAdd(cfg.totalProfit, pnl);
      // 累计每日损失（亏损为正时累加绝对值）
      if (decCmp(pnl, '0') < 0) {
        const today = this.todayKey();
        const dayMap = this.dailyLoss.get(t.followerUserId) ?? new Map<string, string>();
        const cur = dayMap.get(today) ?? '0';
        dayMap.set(today, decAdd(cur, decMul(pnl, '-1')));
        this.dailyLoss.set(t.followerUserId, dayMap);
      }
    }
    return t;
  }

  // -------------------------------------------------------------------------
  // 内部
  // -------------------------------------------------------------------------

  private requireConfig(id: string): CopyTradingConfig {
    const c = this.configs.get(id);
    if (!c) throw new Error(`config ${id} not found`);
    return c;
  }

  private appendFollowerConfig(userId: string, cfgId: string): void {
    const arr = this.followerConfigs.get(userId);
    if (arr) arr.push(cfgId);
    else this.followerConfigs.set(userId, [cfgId]);
  }

  private appendKolFollower(kolUserId: string, cfgId: string): void {
    const arr = this.kolFollowers.get(kolUserId);
    if (arr) arr.push(cfgId);
    else this.kolFollowers.set(kolUserId, [cfgId]);
  }

  private appendConfigTrade(cfgId: string, tradeId: string): void {
    const arr = this.configTrades.get(cfgId);
    if (arr) arr.push(tradeId);
    else this.configTrades.set(cfgId, [tradeId]);
  }

  private genTradeId(): string {
    return `cpy_${Date.now().toString(36)}_${Math.floor(Math.random() * 1e6).toString(36)}`;
  }

  private todayKey(): string {
    const d = new Date();
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
  }

  size(): number {
    return this.configs.size;
  }
}

export default CopyTradingService;
