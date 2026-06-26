/**
 * 共享绩效指标公式
 *
 *  - 后台回测引擎（lib/quant/backtest-engine.ts）
 *  - H5 AI 量化 / 跟单 / 信号页
 *  - 任何需要计算 Sharpe / Sortino / MDD / WinRate 的地方
 *
 *  单一事实源（single source of truth）：同一份公式同时被 admin 与 H5 调用，
 *  保证前后端显示完全一致。
 */

// =============================================================================
// 入参类型（结构化、不耦合 backtest-engine）
// =============================================================================

export interface EquityPointLike {
  /** 时间戳（ms） */
  time: number;
  /** 当时权益 */
  equity: number;
  /** 回撤比例（0~1） */
  drawdown: number;
}

export interface TradeLike {
  /** 平仓时间（已平仓 trade 才有） */
  exitTime?: number;
  /** 盈亏（已扣手续费） */
  pnl: number;
}

export interface PerformanceMetrics {
  /** 总收益率（小数，0.1 = 10%） */
  totalReturn: number;
  /** 年化收益率 */
  annualizedReturn: number;
  /** Sharpe（年化） */
  sharpeRatio: number;
  /** Sortino（年化） */
  sortinoRatio: number;
  /** 最大回撤（小数） */
  maxDrawdown: number;
  /** 胜率（0~1） */
  winRate: number;
  /** 盈亏比（grossProfit / |grossLoss|） */
  profitFactor: number;
  /** 已平仓交易数 */
  totalTrades: number;
  /** 平均每笔盈亏 */
  avgTrade: number;
  /** 平均盈利 */
  avgWin: number;
  /** 平均亏损（负数） */
  avgLoss: number;
  /** 单笔最大盈利 */
  largestWin: number;
  /** 单笔最大亏损（负数） */
  largestLoss: number;
}

// =============================================================================
// 核心：computeMetrics
// =============================================================================

/**
 * 计算绩效指标
 * @param trades         交易记录
 * @param equity         权益曲线（按时间升序）
 * @param initialCapital 初始资金
 * @param annualizationFactor 年化因子（默认 365；小时级 24*365；分钟级更高）
 */
export function computeMetrics(
  trades: TradeLike[],
  equity: EquityPointLike[],
  initialCapital: number,
  annualizationFactor = 365,
): PerformanceMetrics {
  // 总收益
  const totalReturn =
    equity.length > 0 ? (equity[equity.length - 1].equity - initialCapital) / initialCapital : 0;

  // 年化（简化）
  const ms = equity.length > 1 ? equity[equity.length - 1].time - equity[0].time : 0;
  const years = ms > 0 ? ms / (1000 * 60 * 60 * 24 * 365) : 0;
  const annualizedReturn = years > 0 ? (1 + totalReturn) ** (1 / years) - 1 : 0;

  // 收益序列
  const returns: number[] = [];
  for (let i = 1; i < equity.length; i++) {
    const prev = equity[i - 1].equity;
    if (prev > 0) returns.push((equity[i].equity - prev) / prev);
  }

  // Sharpe
  const mean = returns.length ? returns.reduce((s, v) => s + v, 0) / returns.length : 0;
  const variance =
    returns.length > 1
      ? returns.reduce((s, v) => s + (v - mean) ** 2, 0) / (returns.length - 1)
      : 0;
  const std = Math.sqrt(variance);
  const sharpeRatio = std > 0 ? (mean / std) * Math.sqrt(annualizationFactor) : 0;

  // Sortino
  const downside = returns.filter((r) => r < 0);
  const dVar =
    downside.length > 1
      ? downside.reduce((s, v) => s + v * v, 0) / (downside.length - 1)
      : 0;
  const dStd = Math.sqrt(dVar);
  const sortinoRatio = dStd > 0 ? (mean / dStd) * Math.sqrt(annualizationFactor) : 0;

  // 最大回撤
  const maxDrawdown = equity.reduce((m, p) => Math.max(m, p.drawdown), 0);

  // 胜率 / 盈亏比
  const closed = trades.filter((t) => t.exitTime !== undefined);
  const wins = closed.filter((t) => t.pnl > 0);
  const losses = closed.filter((t) => t.pnl <= 0);
  const winRate = closed.length > 0 ? wins.length / closed.length : 0;
  const grossProfit = wins.reduce((s, t) => s + t.pnl, 0);
  const grossLoss = Math.abs(losses.reduce((s, t) => s + t.pnl, 0));
  const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? Infinity : 0;
  const avgTrade = closed.length > 0 ? closed.reduce((s, t) => s + t.pnl, 0) / closed.length : 0;
  const avgWin = wins.length > 0 ? grossProfit / wins.length : 0;
  const avgLoss = losses.length > 0 ? -grossLoss / losses.length : 0;
  const largestWin = wins.length > 0 ? Math.max(...wins.map((t) => t.pnl)) : 0;
  const largestLoss = losses.length > 0 ? Math.min(...losses.map((t) => t.pnl)) : 0;

  return {
    totalReturn,
    annualizedReturn,
    sharpeRatio,
    sortinoRatio,
    maxDrawdown,
    winRate,
    profitFactor,
    totalTrades: closed.length,
    avgTrade,
    avgWin,
    avgLoss,
    largestWin,
    largestLoss,
  };
}

// =============================================================================
// 单一公式：方便 H5 单字段展示
// =============================================================================

/** 格式化 Sharpe（保留 2 位） */
export function fmtSharpe(s: number): string {
  return isFinite(s) ? s.toFixed(2) : '—';
}

/** 格式化百分比（保留 1 位；支持正负号；-0.085 → "-8.5%"） */
export function fmtPct(p: number, digits = 1): string {
  if (!isFinite(p)) return '—';
  const v = p * 100;
  return `${v >= 0 ? '+' : ''}${v.toFixed(digits)}%`;
}

/** 格式化百分比（不带正负号） */
export function fmtPctAbs(p: number, digits = 1): string {
  if (!isFinite(p)) return '—';
  return `${(p * 100).toFixed(digits)}%`;
}

/** 格式化回撤为正百分比（始终显示 "回撤数值"） */
export function fmtDD(p: number, digits = 1): string {
  if (!isFinite(p)) return '—';
  return `-${(p * 100).toFixed(digits)}%`;
}

/** 格式化胜率为整数百分比（0.71 → "71"） */
export function fmtWin(p: number): string {
  if (!isFinite(p)) return '—';
  return `${Math.round(p * 100)}`;
}

/** 格式化盈亏比（保留 2 位） */
export function fmtPF(p: number): string {
  if (!isFinite(p)) return '∞';
  return p.toFixed(2);
}
