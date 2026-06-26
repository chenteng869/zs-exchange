# Portfolio Management System

专业级投资组合管理系统 — 跨资产类（现货 / 合约 / 期权 / DeFi / 法币 / Staking / Lending）的统一视图、风险分析、再平衡、业绩归因。

## 目录

- [模块组成](#模块组成)
- [基础用法](#基础用法)
- [风险指标](#风险指标)
- [资产配置策略](#资产配置策略)
- [Brinson 业绩归因](#brinson-业绩归因)
- [再平衡](#再平衡)
- [模拟回测](#模拟回测)
- [报表](#报表)
- [关键常量](#关键常量)
- [数学公式](#数学公式)

## 模块组成

| 模块 | 文件 | 职责 |
|------|------|------|
| `types` | `types.ts` | 类型定义 + 关键常量 |
| `AssetAggregator` | `asset-aggregator.ts` | 多资产类持仓汇总 |
| `RiskEngine` | `risk-engine.ts` | 风险指标（VaR/Sharpe/MaxDD/HHI） |
| `AllocationEngine` | `allocation.ts` | 资产配置（等权/Markowitz/风险平价/60-40） |
| `RebalanceEngine` | `rebalance.ts` | 自动再平衡引擎 |
| `AttributionEngine` | `attribution.ts` | Brinson 业绩归因 |
| `PortfolioEngine` | `portfolio-engine.ts` | 业务层门面 |

## 基础用法

```ts
import {
  createPortfolioEngine,
  makeAsset,
} from '@/lib/portfolio';

// 1. 创建引擎（可注入价格源、订单执行器）
const engine = createPortfolioEngine({
  autoRebalance: true,                  // 偏离阈值时自动再平衡
  priceSource: async (sym) => fetchPrice(sym),
  orderPlacer: async (t) => placeOrder(t),
});

// 2. 添加资产
engine.addAsset(makeAsset({
  userId: 'u1', symbol: 'BTC', assetClass: 'spot',
  quantity: '0.5', avgCost: '30000', markPrice: '65000',
}));
engine.addAsset(makeAsset({
  userId: 'u1', symbol: 'ETH', assetClass: 'spot',
  quantity: '5', avgCost: '2500', markPrice: '3500',
}));
engine.addAsset(makeAsset({
  userId: 'u1', symbol: 'USDC', assetClass: 'fiat',
  quantity: '10000', avgCost: '1', markPrice: '1',
}));

// 3. 设置目标配置
engine.setAllocationByProfile('u1', 'balanced');
// 或自定义：
engine.setAllocation('u1', [
  { symbol: 'BTC', assetClass: 'spot', targetWeight: '0.5' },
  { symbol: 'ETH', assetClass: 'spot', targetWeight: '0.3' },
  { symbol: 'USDC', assetClass: 'fiat', targetWeight: '0.2' },
]);

// 4. 查询
const portfolio = engine.getPortfolio('u1');
const risk = engine.getRiskMetrics('u1');
const attribution = engine.getPerformance('u1', { start: 0, end: Date.now() });

// 5. 再平衡
const plan = engine.rebalance('u1', 'threshold');
await engine.executeRebalance(plan.id);

// 6. 报表
const report = engine.generateReport('u1', { start: 0, end: Date.now() });
```

## 风险指标

`RiskEngine` 提供的全部指标：

| 指标 | 方法 | 说明 |
|------|------|------|
| 年化波动率 | `calculateVolatility(returns)` | σ × √365（加密币 7×24） |
| Sharpe | `calculateSharpe(returns, rf=0.03)` | (μ - rf) / σ × √365 |
| Sortino | `calculateSortino(returns, rf=0.03)` | 仅用下行波动率 |
| Calmar | `calculateCalmar(equity)` | 年化收益 / 最大回撤 |
| 95% VaR | `calculateVaR(returns, 0.95)` | 历史法（损失为正） |
| 99% VaR | `calculateVaR(returns, 0.99)` | 历史法 |
| 95% CVaR | `calculateCVaR(returns, 0.95)` | 期望损失（条件 VaR） |
| 参数 VaR | `calculateParametricVaR(returns)` | z-score 假设正态 |
| 最大回撤 | `calculateMaxDrawdown(equity)` | 峰谷最大跌幅 |
| 当前回撤 | `calculateCurrentDrawdown(equity)` | 距历史峰值 |
| HHI | `calculateHHI(weights)` | 集中度 0-1 |
| 有效资产数 | `calculateEffectiveAssets(weights)` | 1/HHI |
| Beta | `calculateBeta(asset, market)` | 相对 BTC |
| 相关系数 | `calculateCorrelation(a, b)` | Pearson |
| 流动性评分 | `calculateLiquidityScore(assets)` | 0-100 |

### 一键计算组合级指标

```ts
const risk = engine.getRiskMetrics('u1');
// {
//   volatility: 0.42,
//   sharpeRatio: 1.8,
//   sortinoRatio: 2.5,
//   calmarRatio: 0.95,
//   var95: 0.035,
//   var99: 0.052,
//   cvar95: 0.048,
//   maxDrawdown: 0.18,
//   currentDrawdown: 0.05,
//   concentration: 0.34,
//   effectiveAssets: 2.94,
//   beta: 1.12,
//   correlation: 0.78,
//   grossLeverage: 1.5,
//   netLeverage: 0.8,
//   liquidityScore: 87,
//   illiquidPct: '0.15',
// }
```

## 资产配置策略

`AllocationEngine` 提供 5 大策略：

```ts
import { createAllocationEngine } from '@/lib/portfolio';

const ae = createAllocationEngine();

// 1. 等权
const eq = ae.equalWeight(['BTC', 'ETH', 'SOL', 'USDC']);

// 2. Markowitz 均值方差
const mk = ae.markowitz(
  [btcReturns, ethReturns, solReturns, usdcReturns],
  2.5,    // 风险厌恶系数 λ
  0.03,   // 无风险利率
);

// 3. 最大夏普
const ms = ae.maxSharpe(returns, 0.03);

// 4. 风险平价（ERC 迭代）
const rp = ae.riskParity(returns);

// 5. 60-40 平衡
const sf = ae.sixtyForty(['SPY', 'BTC'], ['AGG', 'USDC']);

// 6. 自定义
const custom = ae.custom({ BTC: 0.5, ETH: 0.3, USDC: 0.2 });

// 7. 风险偏好模板
const conservative = ae.fromRiskProfile('conservative');
const balanced = ae.fromRiskProfile('balanced');
const aggressive = ae.fromRiskProfile('aggressive');
```

### 风险偏好模板

| 偏好 | BTC | ETH | USDC | USDT | SOL | BNB |
|------|-----|-----|------|------|-----|-----|
| conservative | 20% | 15% | 50% | 15% | - | - |
| balanced | 35% | 25% | 20% | 10% | 10% | - |
| aggressive | 40% | 30% | 5% | - | 15% | 10% |

## Brinson 业绩归因

经典 Brinson-Hood-Beebower 三因素模型：

```
配置效应  = (wP - wB) × rB
选股效应  = wB × (rP - rB)
交互效应  = (wP - wB) × (rP - rB)
总效应    = 配置 + 选股 + 交互 = rP - rB
```

```ts
import { createAttributionEngine } from '@/lib/portfolio';

const at = createAttributionEngine();

const result = at.brinsonAttribution(
  { start: 0, end: Date.now() },
  {
    portfolioWeights: { BTC: 0.5, ETH: 0.3, USDC: 0.2 },
    benchmarkWeights: { BTC: 0.4, ETH: 0.4, USDC: 0.2 },
    portfolioReturns: { BTC: 0.10, ETH: 0.15, USDC: 0.02 },
    benchmarkReturns: { BTC: 0.08, ETH: 0.10, USDC: 0.02 },
  },
);

// result.allocationEffect   = '-0.002' (配置贡献)
// result.selectionEffect    = '0.028'  (选股贡献)
// result.interactionEffect  = '-0.003' (交互贡献)
// result.totalReturn        = '0.099'  (组合收益)
// result.benchmarkReturn    = '0.078'  (基准收益)
// result.excessReturn       = '0.021'  (超额收益)
// result.contribution       = { BTC: '0.05', ETH: '0.045', USDC: '0.004' }
```

## 再平衡

三种触发方式：

```ts
import { createRebalanceEngine } from '@/lib/portfolio';

const rb = createRebalanceEngine({
  driftThreshold: 0.05,    // 5% 偏离
  minIntervalDays: 7,      // 7 天最小间隔
  feeRate: 0.001,          // 0.1% 单边费率
});

// 1. 周期触发
if (rb.periodic('u1')) {
  // 一周一次
}

// 2. 阈值触发
if (rb.threshold(assets, targets)) {
  const plan = rb.generatePlan('u1', assets, targets, 'threshold');
  await rb.executePlan(plan.id);
}

// 3. 风险预算触发
if (rb.riskParityTrigger(assets, targets)) {
  // ...
}
```

再平衡计划（`RebalancePlan`）：

```ts
{
  id: 'rb-u1-1700000000000-123456',
  userId: 'u1',
  strategy: 'threshold',
  triggers: ['drift > 5.0%'],
  currentAllocations: { BTC: '0.5', ETH: '0.3', USDC: '0.2' },
  targetAllocations:  { BTC: '0.3', ETH: '0.3', USDC: '0.4' },
  trades: [
    { symbol: 'BTC', side: 'sell', quantity: '0.1', priority: 10, reason: '...' },
    { symbol: 'USDC', side: 'buy', quantity: '20000', priority: 10, reason: '...' },
  ],
  expectedCost: '15',
  expectedImprovement: '5.00',
  status: 'executed',
  executedAt: 1700000001000,
}
```

## 模拟回测

```ts
const result = await engine.backtestAllocation(
  'u1',
  [
    { symbol: 'BTC', assetClass: 'spot', targetWeight: '0.6' },
    { symbol: 'ETH', assetClass: 'spot', targetWeight: '0.4' },
  ],
  { start: Date.now() - 90 * 86_400_000, end: Date.now() },
  '10000',  // 初始资金
);

// result.totalReturn        = '0.085'
// result.annualizedReturn   = 0.32
// result.sharpeRatio        = 1.5
// result.maxDrawdown        = 0.12
// result.equityCurve        = [{ time, value }, ...]
// result.trades             = [{ time, symbol, side, quantity, price }, ...]
```

## 报表

```ts
const report = engine.generateReport('u1', { start: 0, end: Date.now() });

// report.portfolio             - 完整组合视图
// report.riskMetrics           - 风险指标
// report.attribution           - 业绩归因
// report.rebalanceSuggestion   - 再平衡建议
// report.summary               - 摘要
//   {
//     totalReturn: '0.40',
//     riskLevel: 'medium',
//     concentrationRisk: true,
//     rebalanceNeeded: true,
//   }
```

## 关键常量

```ts
RISK_FREE_RATE              = 0.03   // 3%
TRADING_DAYS                = 365    // 加密币 7×24
DEFAULT_DRIFT_THRESHOLD     = 0.05   // 5%
REBALANCE_MIN_INTERVAL_DAYS = 7      // 周度
VAR_DEFAULT_CONFIDENCE      = 0.95
CONCENTRATION_WARNING       = 0.3    // HHI > 0.3 集中
MAX_DRAWDOWN_ALERT          = 0.2    // 20% 报警
```

## 数学公式

### 波动率（年化）
```
σ_annual = σ_daily × √365
```

### Sharpe Ratio
```
S = (μ - rf) / σ_daily × √365
```

### Sortino Ratio
```
S_down = (μ - rf) / σ_downside × √365
σ_downside = √(mean(r_i² | r_i < 0))
```

### Calmar Ratio
```
C = annualReturn / maxDrawdown
```

### 历史 VaR
```
VaR_α = -percentile(returns, 1-α)
```

### CVaR
```
CVaR_α = -mean(returns | returns ≤ VaR_α)
```

### HHI（赫芬达尔）
```
HHI = Σ w_i²
```

### 最小方差组合
```
w = Σ⁻¹ × 1 / (1ᵀ Σ⁻¹ 1)
```

### 最大夏普
```
w ∝ Σ⁻¹ × (μ - rf)
归一化
```

### 风险平价（ERC 迭代）
```
σ_p = √(wᵀ Σ w)
MRC_i = (Σw)_i
RC_i = w_i × MRC_i / σ_p
target = σ_p / N
w_new ∝ w × (target / RC)
迭代至收敛
```

### Brinson 三因素
```
配置效应  = (wP - wB) × rB
选股效应  = wB × (rP - rB)
交互效应  = (wP - wB) × (rP - rB)
```

## 测试

```bash
node --import tsx tests/portfolio-engine.test.ts
```

覆盖 32 个用例：
- AssetAggregator（4）
- RiskEngine（10）
- AllocationEngine（3）
- RebalanceEngine（2）
- AttributionEngine（1）
- PortfolioEngine（5）
- 常量 / 工具（7）
