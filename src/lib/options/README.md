# SMY 期权交易系统（P2 期权）

> 加密货币欧式/美式期权交易引擎：定价、链管理、订单、持仓、Greeks、结算一体化。
> 与永续合约（线性）互补，构成完整的非线性衍生品矩阵。

---

## 1. 架构图

```
┌────────────────────────────────────────────────────────────────────────┐
│                        OptionsEngine（核心）                            │
│                                                                        │
│   订单        持仓         PnL         Greeks        卖方保证金          │
│  ┌─────┐   ┌──────┐   ┌────────┐   ┌──────────┐   ┌──────────┐        │
│  │place│   │open  │   │long/   │   │position │   │max(K×α, │        │
│  │Order│──▶│pos   │──▶│short   │──▶│Greeks   │──▶│premium×2)│        │
│  └──┬──┘   └──┬───┘   └────┬───┘   └────┬─────┘   └────┬─────┘        │
│     │         │            │            │              │              │
└─────┼─────────┼────────────┼────────────┼──────────────┼──────────────┘
      │         │            │            │              │
      ▼         ▼            ▼            ▼              ▼
┌─────────┐ ┌────────────┐ ┌──────────┐ ┌───────────┐ ┌──────────┐
│Option-  │ │BlackScholes│ │Settle-   │ │auto-      │ │monitor-  │
│Chain    │ │   (BSM)    │ │mentEng.  │ │exercise   │ │expiry    │
│Service  │ │ price/IV/  │ │ cash/    │ │ ITM only  │ │          │
│         │ │ Greeks     │ │ physical │ │           │ │          │
└─────────┘ └────────────┘ └──────────┘ └───────────┘ └──────────┘
```

| 模块 | 文件 | 职责 |
|------|------|------|
| `types`         | `types.ts`             | 类型 + 常量（strike 范围、IV、margin factor 等）|
| `bsm`           | `bsm.ts`               | BSM 定价 / Greeks / Newton-Raphson IV / Parity 校验 |
| `option-chain`  | `option-chain.ts`      | 期权链生成（11 档 × 2 类型 = 22 合约）+ ticker |
| `settlement`    | `settlement-engine.ts` | 价内判定、现金/实物结算、自动行权、收益图 |
| `options-engine`| `options-engine.ts`    | 订单/持仓/PnL/组合 Greeks/保证金/到期监控 |
| `index`         | `index.ts`             | 统一导出 |

---

## 2. 期权基础

### 2.1 类型

- **Call（看涨）**：买权，到期时若 `S > K` 则赚钱
- **Put（看跌）**：卖权，到期时若 `S < K` 则赚钱

### 2.2 行权方式

- **European（欧式）**：仅到期日可行权（数字货币主流）
- **American（美式）**：到期前任意时间可行权（灵活但定价更复杂）

### 2.3 术语

| 术语 | 含义 |
|------|------|
| `S` (Spot)         | 标的现价 |
| `K` (Strike)       | 行权价 |
| `T` (Time to Expiry) | 距到期时间（年化）|
| `r` (Risk-free Rate) | 无风险利率 |
| `σ` (Volatility)   | 波动率 |
| `Premium`          | 权利金 = 期权价格 × 张数 × 合约单位 |
| `Intrinsic`        | 内含价值：Call `max(S-K,0)`，Put `max(K-S,0)` |
| `Time Value`       | 时间价值 = 期权价 − 内含价值 |
| `ITM`              | 价内（In The Money）|
| `OTM`              | 价外（Out of The Money）|
| `ATM`              | 平值（At The Money）|

---

## 3. Black-Scholes-Merton 公式

### 3.1 公式

```
d1 = [ ln(S/K) + (r + σ²/2)·T ] / (σ·√T)
d2 = d1 - σ·√T

Call = S·N(d1) - K·e^(-rT)·N(d2)
Put  = K·e^(-rT)·N(-d2) - S·N(-d1)
```

`N(x)` = 标准正态分布 CDF（自实现 `erf` 多项式近似，误差 < 1.5e-7）

### 3.2 已知参考值（S=100, K=100, T=1, r=0.05, σ=0.2）

| 指标 | 值 |
|------|----|
| Call Price | 10.4506 |
| Put  Price | 5.5735  |
| Δ Call    | 0.6368  |
| Γ         | 0.0188  |
| Θ Call    | -0.0176 |
| Vega      | 0.3754  |
| Rho Call  | 0.5323  |

---

## 4. Greeks 含义

| Greek | 含义 | 应用 |
|-------|------|------|
| **Delta** Δ | 标的变动 1 单位时期权价变化 | 对冲 ratio：`对冲张数 = 持仓 Δ × 名义` |
| **Gamma** Γ | 标的变动 1 单位时 Δ 的变化 | Δ 的加速度，反映凸性 |
| **Theta** Θ | 每**日**时间价值衰减 | 卖方偏好高 θ，买方担心 θ |
| **Vega**  V | 波动率变动 1% 时期权价变化 | IV 交易者关注 |
| **Rho**   ρ | 利率变动 1% 时期权价变化 | 长期期权更敏感 |

**组合 Greeks**：账户内所有持仓的 Greeks 加权汇总（short 取负）

---

## 5. 隐含波动率（IV）

### 5.1 定义
市场实际报价所隐含的波动率，反映"市场对未来波动的预期"。

### 5.2 反推方法
Newton-Raphson 迭代：

```
σ_{n+1} = σ_n - (BSM(σ_n) - marketPrice) / vega(σ_n)
```

- 初值 `σ0 = 0.3`
- 收敛阈值：`|BSM(σ_n) − marketPrice| < 0.0001`
- 最大 100 次迭代，越界回退二分

### 5.3 应用
- **Volatility Smile/Skurf**：同一到期日不同 strike 的 IV 不一致（OTM Put 通常 IV 较高 → "左偏"）
- **IV-HV 差**：IV > 实际波动 → 卖期权贵；IV < 实际 → 买期权便宜
- **VIX 类似指标**：ATM IV × √(T/365) 可作为标的恐慌指数

---

## 6. 行权与结算

### 6.1 价内判定
- Call: `spot > strike`
- Put : `spot < strike`
- ATM（平值）通常不自动行权（payoff = 0）

### 6.2 结算方式
- **Cash Settlement（现金）**：
  - Call long: `payoff = max(S-K, 0) × qty × size`
  - Put  long: `payoff = max(K-S, 0) × qty × size`
- **Physical Settlement（实物）**：
  - Call long: 付出 `qty × size × K` 现金，得到 `qty × size` 标的
  - Put  long: 付出 `qty × size` 标的，得到 `qty × size × K` 现金

### 6.3 行权窗口
- American: 到期前任意价内时间
- European: 到期日 + 24h 宽限期

### 6.4 自动行权（ITM 触发）
到期日 0 价内期权自动行权，避免用户因遗忘而损失时间价值。

---

## 7. 完整调用示例

```ts
import {
  OptionsEngine,
  OptionChainService,
  SettlementEngine,
  BlackScholes,
  BSM_REFERENCE,
  RISK_FREE_RATE,
  DEFAULT_IV,
} from '@/lib/options';

// 1) 初始化
const chain = new OptionChainService();
const settler = new SettlementEngine();
const engine = new OptionsEngine(chain, settler);
const bsm = new BlackScholes();

// 2) 生成 7 天后到期的 BTC 期权链（spot = 70000）
const T = 7 * 24 * 60 * 60 * 1000;
const expiration = Date.now() + T;
const options = chain.generateChain('BTC', expiration, 70000, DEFAULT_IV);
console.log(`已生成 ${options.length} 个期权合约`);   // 22

// 3) BSM 定价参考
const callPrice = bsm.price(
  { spot: 100, strike: 100, timeToExpiry: 1, riskFreeRate: 0.05, volatility: 0.2 },
  'call',
);
console.log(`BSM Call(100,100,1y,5%,20%) = ${callPrice.toFixed(4)}`);  // ≈ 10.4506

// 4) Greeks
const g = bsm.greeks(
  { spot: 100, strike: 100, timeToExpiry: 1, riskFreeRate: 0.05, volatility: 0.2 },
  'call',
);
console.log(g);  // { delta: 0.6368, gamma: 0.0188, theta: -0.0176, vega: 0.3754, rho: 0.5323 }

// 5) IV 反推
const iv = bsm.impliedVolatility(10.4506, { spot: 100, strike: 100, timeToExpiry: 1, riskFreeRate: 0.05 }, 'call');
console.log(`反推 IV = ${iv.toFixed(4)}`);  // ≈ 0.2

// 6) Put-Call Parity
const parity = bsm.putCallParityCheck(10.4506, 5.5735, {
  spot: 100, strike: 100, timeToExpiry: 1, riskFreeRate: 0.05, volatility: 0.2,
});
console.log(parity);   // { valid: true, deviation: ≈ 0, expected: ≈ 4.8771 }

// 7) 期权链
const tickerChain = chain.getChain('BTC', expiration, 70000, DEFAULT_IV);
console.log(tickerChain.calls.length, tickerChain.puts.length);  // 11, 11

// 8) 喂价
engine.setSpot('BTC', 70000);

// 9) 下市价买单
const opt = options.find(o => o.optionType === 'call' && o.strikePrice === '70000.00')!;
const order = engine.placeOrder({
  userId: 'u1', optionId: opt.id, side: 'buy', type: 'market', quantity: 10,
});
engine.matchOrder(order.id);

// 10) 持仓 PnL
const positions = engine.getUserPositions('u1');
for (const p of positions) {
  const pnl = engine.calculatePositionPnl(p, parseFloat(p.markPrice));
  console.log(`${p.id}: entry=${p.entryPrice}, mark=${p.markPrice}, pnl=${pnl}`);
}

// 11) 组合 Greeks
const portfolioGreeks = engine.getPortfolioGreeks('u1');
console.log('Portfolio Greeks:', portfolioGreeks);

// 12) 卖方保证金
const sellOpt = options.find(o => o.optionType === 'put' && o.strikePrice === '70000.00')!;
const margin = engine.calculateShortMargin(sellOpt, 70000);
console.log(`卖方保证金: ${margin}`);

// 13) 到期监控（设置到期后调用）
engine.monitorExpiry();
```

---

## 8. 风险与对冲

### 8.1 卖方风险（无限）
- 卖出 Call：标的价格无限上涨 → 理论损失无限
- 卖出 Put ：标的价格跌至 0 → 损失 = K × qty
- **必须**缴保证金，并实时监控

### 8.2 Delta 中性对冲
- 卖 `N` 张 Call（每张 Δ=+0.6） → 需在现货市场**卖出** `0.6 × N × size` 标的
- 每次标的价格变动后**再平衡**（Gamma 越大，再平衡越频繁）

### 8.3 Vega 风险
- 跨式组合（Straddle）Vega 巨大，IV 暴跌会大幅亏损
- 建议：保持组合 `|Vega| × 现货变动` 在可承受范围内

### 8.4 Theta 衰减策略
- 卖出近月期权（高 θ）适合震荡市
- 买进远月期权（高 Vega，Theta 较慢）适合预期大波动

---

## 9. 与永续合约对比

| 维度 | 期权 | 永续合约（perp） |
|------|------|------------------|
| 损益曲线 | 非线性（凸/凹）| 线性 |
| 最大亏损 | Long = 权利金 | 保证金 |
| 最大盈利 | 卖方：权利金；买方：理论上无限 | 双向无限 |
| 时间衰减 | 关键（Theta）| 无 |
| 资金费率 | 无 | 有（每 8h）|
| 复杂度 | 高（Greeks、IV）| 中（杠杆、爆仓）|
| 适用 | 投机/对冲/套利 | 杠杆/对冲 |

---

## 10. 测试

```bash
npx tsx --test tests/options-engine.test.ts
```

至少 16 个用例覆盖：BSM 价格、Greeks、IV 反推、链生成、行权、结算、订单、持仓、PnL、Greeks 汇总、保证金、收益图。
