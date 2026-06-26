# 永续合约系统（USDT-M Perpetual）

完整的 USDT 永续合约交易系统，覆盖仓位管理、保证金、资金费率、强平、保险基金、ADL、风险计算等核心能力。

> **注意**：项目原文档提到的 `src/lib/trading/order-engine.ts` 在仓库中**不存在**。本模块在 `src/lib/perp/` 下从零实现，复用：
> - `src/lib/matching/decimal.ts` — bigint 字符串算术
> - `src/lib/settlement/freeze.ts` — 现货钱包模型（可按需对接）
> - `src/lib/market/kaiko/` — 指数价推送（运行时接入）

---

## 1. 架构图

```
                          ┌──────────────────────┐
                          │   PerpEngine (核心)   │
                          │  - open / close pos   │
                          │  - place / cancel ord │
                          │  - account / risk     │
                          └──────────┬───────────┘
              ┌──────────────────────┼──────────────────────┐
              │                      │                      │
   ┌──────────▼──────────┐ ┌─────────▼─────────┐ ┌─────────▼─────────┐
   │  ContractRegistry   │ │ MarginCalculator  │ │  FundingEngine    │
   │  - 5 默认合约       │ │ - IM / MM / PnL   │ │  - 8h 结算        │
   │  - BTC/ETH/SOL/...  │ │ - liq price       │ │  - 多空支付       │
   └─────────────────────┘ │ - mark price      │ └───────────────────┘
                           │ - funding rate    │
                           └────────┬──────────┘
                                    │
                          ┌─────────▼──────────┐
                          │ LiquidationEngine  │
                          │ - 强平市价单        │
                          │ - 保险基金注入      │
                          │ - ADL 自动减仓      │
                          └────────────────────┘
```

## 2. 永续合约 vs 现货

| 维度 | 现货 | 永续合约 |
|------|------|---------|
| 资产转移 | 实时划转 | 仅保证金 + PnL |
| 杠杆 | 1x | 1x - 125x |
| 到期 | 无 | 无（每 8h 资金费） |
| 方向 | 仅做多（融资融币） | 多 / 空 |
| 风险 | 资产价格 | 强平价、保证金率、ADL |

## 3. 资金费率机制

每 8 小时（00:00 / 08:00 / 16:00 UTC）结算一次，迫使 mark price 向 index price 收敛。

```
premiumIndex  = (markPrice - indexPrice) / indexPrice
inner         = clamp(interestRate - premiumIndex, ±0.05%)
funding       = clamp(premiumIndex + inner, ±0.75%)
payment       = position.size * markPrice * funding
```

- `funding > 0`：**多方付给空方**（market is overheated）
- `funding < 0`：**空方付给多方**（market is oversold）
- 上下限：默认 ±0.75%，由 `Contract.fundingCap` 配置

## 4. 强平 / ADL / 保险基金

```
marginRatio = (margin + unrealizedPnl) / positionValue
强平触发    = marginRatio < maintenanceMarginRate

强平流程：
  1. 市价吃单（best bid/ask）
  2. 计算 remainingMargin = margin + pnl - penalty(0.5%)
  3. remainingMargin > 0  -> 注入保险基金
  4. remainingMargin < 0  -> 保险基金先垫付
  5. 保险基金不足          -> 触发 ADL
```

**ADL 排名**：`score = leverage * (pnlRate + 1)`，score 越高越优先被自动减仓。

**保险基金**：默认每个 symbol 初始 100 万 USDT。

## 5. 风险计算

| 指标 | 公式 |
|------|------|
| 未实现盈亏（long） | `(mark - entry) * size` |
| 未实现盈亏（short） | `(entry - mark) * size` |
| 强平价（long, 隔离） | `entry * (1 - 1/leverage + mmr)` |
| 强平价（short, 隔离） | `entry * (1 + 1/leverage - mmr)` |
| 强平价（跨仓） | 同上，但 mmr = 0（账户总权益保护） |
| 标记价 | `median(indexPrice, lastPrice, fundingBasis)` |
| 保证金率 | `(margin + unrealizedPnl) / positionValue` |

## 6. 完整调用示例

```ts
import { PerpEngine } from '@/lib/perp';

// 1. 初始化引擎
const engine = new PerpEngine();

// 2. 入金
engine.transferIn('user-1', 'USDT', '10000');

// 3. 推送指数价（Kaiko 推过来）
engine.updateIndexPrice('BTCUSDT', '30000');

// 4. 开多仓（隔离 20x）
const pos = engine.openPosition({
  userId: 'user-1',
  symbol: 'BTCUSDT',
  side: 'long',
  quantity: '0.5',
  price: '30000',
  leverage: 20,
  marginMode: 'isolated',
});
// pos.margin = 750 (30000 * 0.5 / 20)

// 5. 行情上涨 -> 推送 markPrice
engine.updateMarkPrices('BTCUSDT', '31500');

// 6. 仓位 PnL 自动更新
const refreshed = engine.getPosition(pos.id);
// refreshed.unrealizedPnl = 750  (0.5 * 1500)

// 7. 下委托单
const order = engine.placeOrder({
  userId: 'user-1',
  symbol: 'BTCUSDT',
  side: 'short',
  type: 'market',
  quantity: '0.2',
  leverage: 20,
  marginMode: 'isolated',
  reduceOnly: true,
});

// 8. 撮合（撮合引擎回调）
const filled = engine.matchOrder(order.id, '31800');
// filled.status = 'filled', pnl 部分已结算

// 9. 8h 后 -> 资金费结算
engine.updateMarkPrices('BTCUSDT', '31800');
const payments = engine.settleFunding('BTCUSDT');
// rate > 0: long 付给 short

// 10. 强平监控（每秒 tick 调用）
const liquidations = engine.monitorAndLiquidate((symbol) => {
  // 返回当前 best bid/ask（撮合引擎侧提供）
  return null;
});

// 11. 查询账户
const account = engine.getAccount('user-1');
// { totalWalletBalance, totalUnrealizedPnl, availableBalance, ... }

// 12. 风险等级
const risk = engine.getAccountRisk('user-1');
// { riskLevel: 'safe' | 'warning' | 'danger' | 'critical', marginCall }
```

## 7. 仓位生命周期

```
                ┌─────────────────┐
                │  transferIn     │ 入金
                └────────┬────────┘
                         ▼
   ┌─────────────────────────────────┐
   │  openPosition                   │  开仓
   │  - 校验余额 / 限额 / 杠杆       │  - 同向加仓
   │  - 冻结 IM（隔离）              │  - 加权平均开仓价
   │  - 计算强平价 / marginRatio     │
   └────────────┬────────────────────┘
                ▼
       ┌────────────────┐
       │  Position.open │ 持仓中：
       │                │  - 标记价更新
       │                │  - PnL 重算
       │                │  - funding 每 8h
       │                │  - marginRatio 监控
       └─┬──────────┬───┘
         │          │
   adjustMargin / Leverage   closePosition
         │          │
         ▼          ▼
   ┌──────────┐  ┌────────────────┐
   │  继续    │  │ status=closed  │
   │  持仓    │  │ 释放保证金     │
   └──────────┘  │ PnL 结算       │
                 └────────────────┘
                       │
                       │ marginRatio < mmr
                       ▼
              ┌────────────────────┐
              │ LiquidationEngine  │
              │ - 市价强平          │
              │ - 注入保险基金      │
              │ - 穿仓 -> ADL      │
              └────────┬───────────┘
                       ▼
              ┌────────────────────┐
              │ status=liquidated  │
              └────────────────────┘
```

## 8. 费率表

| Symbol | 维持保证金率 | 初始保证金率 | 最大杠杆 | Maker / Taker |
|--------|------------|------------|----------|---------------|
| BTCUSDT | 0.5% | 1.0% | 125x | 0.02% / 0.05% |
| ETHUSDT | 0.5% | 1.0% | 100x | 0.02% / 0.05% |
| SOLUSDT | 1.0% | 2.0% | 75x | 0.02% / 0.05% |
| BNBUSDT | 1.0% | 2.0% | 75x | 0.02% / 0.05% |
| XRPUSDT | 2.0% | 5.0% | 75x | 0.04% / 0.05% |

## 9. 关键参数

```ts
FUNDING_INTERVAL_HOURS   = 8
MAX_LEVERAGE             = 125
DEFAULT_LEVERAGE         = 20
INSURANCE_FUND_INITIAL   = '1000000'   // 100 万 USDT
LIQUIDATION_FEE_RATE     = 0.005       // 0.5%
ADL_TRIGGER_RATIO        = 0.1         // 保险基金 / 总名义 < 10% 触发
```

## 10. 文件清单

| 文件 | 职责 |
|------|------|
| `types.ts` | 核心类型定义（Contract / Position / Order / Funding / Liquidation / Account） |
| `contract-registry.ts` | 5 个默认合约 + 运行时增删改查 |
| `margin-calculator.ts` | IM / MM / PnL / 强平价 / 标记价 / 资金费率 |
| `funding-engine.ts` | 8h 资金费结算 + 预测下一期 |
| `liquidation-engine.ts` | 强平 / 保险基金 / ADL 排名 / 自动减仓 |
| `perp-engine.ts` | 核心引擎：仓位 / 委托 / 账户 / 风险 / 强平 |
| `index.ts` | 模块导出（含 decimal 工具） |

## 11. 与现有模块协作

```ts
// 1. Kaiko 推送 indexPrice -> FundingEngine
import { globalFundingEngine } from '@/lib/perp';
const predictedRate = globalFundingEngine.getPredictedRate(
  'BTCUSDT', markPrice, indexPrice
);

// 2. 撮合引擎回调 -> PerpEngine
const filled = engine.matchOrder(orderId, lastPrice);

// 3. 强平 -> PerpEngine.monitorAndLiquidate
setInterval(() => engine.monitorAndLiquidate(), 1000);

// 4. 8h cron -> PerpEngine.settleFunding
setInterval(() => engine.settleFunding('BTCUSDT'), 8 * 3600 * 1000);
```

## 12. 测试

```bash
npx tsx --test tests/perp-engine.test.ts
```

**41 个用例全部通过**，覆盖：
- ContractRegistry（4）：默认合约 / getContract / isActive / updateContract
- MarginCalculator（11）：IM（隔离/跨仓） / MM / PnL（long/short） / 强平价（long/short） / marginRatio / markPrice / funding rate（双向）
- FundingEngine（4）：getCurrentRate / getPredictedRate / processFunding（多空对账） / scheduleNextFunding
- LiquidationEngine（5）：checkLiquidatable（触发/不触发） / liquidate（注入基金） / 极端穿仓 ADL / adlRank
- PerpEngine（17）：开多 / 开空 / 加仓加权 / 调杠杆 / 调保证金 / 全平 / 部分平 / 触发强平 / settleFunding / 账户（跨仓） / 隔离 vs 跨仓 / 风险监控 / 下单撮合 / reduceOnly / 保险基金 / 余额不足 / 未知 symbol
