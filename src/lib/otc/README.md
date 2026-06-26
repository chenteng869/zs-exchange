# OTC / 大宗交易系统 (Institutional OTC / Bulk Trading)

> 任务 **P3-5**：实现场外大宗撮合系统 — RFQ + 多家做市商报价 + 双边锁价 + 多通道结算 + 销售撮合器人 + 信息隔离。

---

## 1. 模块总览

| 子模块 | 文件 | 职责 |
|---|---|---|
| `types` | `types.ts` | 类型定义 & 常量 |
| `market-maker-registry` | `market-maker-registry.ts` | 机构做市商注册表（注册 / 审批 / 暂停 / 排名） |
| `rfq-engine` | `rfq-engine.ts` | 询价引擎（创建 / 邀请 / 报价 / 选择 / 接受） |
| `price-lock` | `price-lock.ts` | 锁价服务（避免滑点 + 偏离监控） |
| `settlement-engine` | `settlement-engine.ts` | 结算引擎（链上 / 法币 / 稳定币） |
| `commission-engine` | `commission-engine.ts` | 佣金引擎（sales / maker / platform 三方分账） |
| `otc-engine` | `otc-engine.ts` | 业务集成层（完整流程 / 撮合器人 / 事件订阅） |

---

## 2. 核心设计

- **不引外部依赖**：复用 `matching/decimal`，金额统一 `string`
- **状态机**：`rfq → quoting → quoted → accepted → locked → settling → completed`
- **演示降级**：链上/稳定币结算默认 mock 50ms 返确认；法币 mock 生成 reference
- **事件订阅**：基于回调 `Set`，不引入 EventEmitter

---

## 3. 关键常量

```typescript
OTC_RFQ_DEFAULT_TTL_SEC       = 300       // 5 分钟
OTC_QUOTE_DEFAULT_TTL_SEC      = 60        // 1 分钟
OTC_PRICE_LOCK_DURATION_SEC   = 600       // 10 分钟
OTC_PRICE_DEVIATION_WARNING   = 0.005     // 0.5%
OTC_PRICE_DEVIATION_CRITICAL  = 0.01      // 1%
OTC_MIN_TRADE_SIZE_USD        = '100000'  // 10 万 USD
OTC_SETTLEMENT_CONFIRMATIONS  = 6         // 6 块确认

OTC_COMMISSION_RATES = {
  sales:    0.0005,   // 0.05%  → 销售
  maker:    0.001,    // 0.10%  → 做市商
  platform: 0.0005,   // 0.05%  → 平台
}
```

---

## 4. 预置机构做市商

```
Galaxy Digital        (tier1, 100K ~ 500M)
Jump Crypto           (tier1, 100K ~ 300M)
Cumberland DRW        (tier1, 250K ~ 1B)
Wintermute            (tier1, 100K ~ 200M)
Genesis Global Trading(tier2, 100K ~ 150M)
B2C2                  (tier2, 100K ~ 100M)
```

可通过 `new OtcMakerRegistry({ autoSeedPresets: false })` 关闭自动 seed。

---

## 5. 完整调用示例

```typescript
import { OtcEngine } from '@/lib/otc';

const engine = new OtcEngine();

// 0) 撮合器人（可选）
engine.registerSalesperson({ id: 'sp_1', userId: 'u_1', name: 'Alice' });
engine.assignSalesperson('inst_001', 'sp_1');

// 1) 创建 RFQ
const rfq = engine.createRfq({
  clientId: 'inst_001',
  clientUserId: 'trader_001',
  side: 'buy',
  baseAsset: 'BTC',
  quoteAsset: 'USDT',
  baseAmount: '10',
  settlementType: 'stablecoin',
  isPrivate: true,
});

// 2) 邀请做市商
const makers = engine.getMakerRegistry().listMakers(undefined, 'BTC', 'active').slice(0, 3);
engine.inviteMakers(rfq.id, makers.map((m) => m.id));

// 3) 多家做市商报价
engine.submitQuote({ rfqId: rfq.id, makerId: makers[0].id, price: '68100' });
const best = engine.submitQuote({ rfqId: rfq.id, makerId: makers[1].id, price: '68000' });
engine.submitQuote({ rfqId: rfq.id, makerId: makers[2].id, price: '67900' });

// 4) 选择最优报价（buy→最低价；sell→最高价；speed→最快；rating→最高评级）
const chosen = engine.selectBestQuote(rfq.id, 'price')!;

// 5) 客户接受报价 → 创建 trade + 锁价 + 计算佣金
const trade = engine.acceptQuote(chosen.id, {
  clientAddress: '0xClient...',
  makerAddress: '0xMaker...',
});
// trade.status === 'locked'，trade.lockedPrice === '68000'

// 6) 结算（按 settlementType 自动选方式）
const settled = await engine.settleTrade(trade.id);
// settled.status === 'completed'
// settled.clientTxHash / settled.makerTxHash（链上）
// settled.fiatReference（法币）

// 7) 事件订阅
const off1 = engine.onRfqCreated((e) => console.log('rfq created', e.rfq.id));
const off2 = engine.onQuoteReceived((e) => console.log('quote', e.quote.price));
const off3 = engine.onQuoteAccepted((e) => console.log('trade', e.trade.id));
const off4 = engine.onTradeCompleted((e) => console.log('done', e.trade.id));
const off5 = engine.onPriceDeviation((e) => console.log('deviation', e.level));

// 8) 主动喂价 → 触发价格偏离监控
engine.feedCurrentPrice('69000', [trade.id]);
```

---

## 6. 三种结算方式

| 方式 | 实现 | 适用 |
|---|---|---|
| `onchain` | 链上交易，监听 6 块确认 | BTC / ETH 主链 |
| `fiat` | 银行汇款（SWIFT/SEPA），生成 reference | 美元 / 离岸人民币 |
| `stablecoin` | USDT/USDC 链上转账 | 法币通道受限时 |

所有结算均支持外部注入回调：

```typescript
const engine = new OtcEngine({
  settlementEngine: new SettlementEngine({
    onchainConfirm: async ({ txHash, requiredConfirmations }) => {
      // 接入真实链客户端
      return { confirmed: true, confirmations: requiredConfirmations };
    },
    fiatSettle: async ({ amount, currency, network }) => {
      // 接入银行 API
      return { reference: 'BANK20250101', status: 'completed' };
    },
  }),
});
```

---

## 7. 价格锁定 & 偏离监控

```typescript
import { PriceLockService } from '@/lib/otc';

const lock = new PriceLockService();
lock.lockPrice('trade_1', '68000', 600);            // 锁 10 分钟

const r1 = lock.checkPriceDeviation('trade_1', '68100'); // 0.147% → normal
const r2 = lock.checkPriceDeviation('trade_1', '68500'); // 0.735% → warning
const r3 = lock.checkPriceDeviation('trade_1', '69000'); // 1.47%  → critical
// r.shouldRequote === true（critical 时强制重新报价）
// r.shouldSettle === false

lock.onDeviation((tradeId, r) => {
  // 触发销售/客户/风控告警
});
```

- `normal` (< 0.5%)：正常，可继续结算
- `warning` (0.5% ~ 1%)：告警，可继续结算但需确认
- `critical` (≥ 1%)：强制重新报价（不可结算）

---

## 8. 佣金模型

默认三方分账：

| 类型 | 费率 | 收款方 |
|---|---|---|
| `sales` | 0.05% | 撮合器人 |
| `maker` | 0.10% | 做市商 |
| `platform` | 0.05% | 平台 |

可针对 **撮合器人 / 做市商** 设置覆盖规则：

```typescript
import { CommissionEngine } from '@/lib/otc';
const ce = new CommissionEngine();
ce.setRule({
  id: 'r_sp_1_sales',
  salespersonId: 'sp_1',
  type: 'sales',
  rate: 0.001,   // VIP 销售 0.1%
  isActive: true,
  createdAt: Date.now(),
});
```

优先级：`salesperson-specific > maker-specific > global`。

佣金状态机：`pending → paid`（结算成交时自动 settle）。

---

## 9. 状态机

```
            ┌──── invitedMakers.length > 0
            ↓
  rfq ───→ quoting ──→ quoted ──→ accepted ──→ locked ──→ settling ──→ completed
   │         │            │          │           │           │
   │         │            │          │           │           └──→ failed
   │         │            │          │           │
   │         ↓            ↓          ↓           ↓
   └─────── cancelled / expired / failed
```

取消 RFQ 时，关联 `active` 报价自动 `withdrawn`。

---

## 10. 撮合器人

```typescript
engine.registerSalesperson({ id: 'sp_1', userId: 'u_1', name: 'Alice' });
engine.assignSalesperson('inst_001', 'sp_1');
engine.assignSalesperson('inst_002', 'sp_1');

const sp = engine.getAssignedSalesperson('inst_001');
// { id: 'sp_1', totalClients: 2, totalVolume: '0', totalCommission: '0', rating: 4.0, isActive: true }
```

未注册的 `salespersonId` 调 `assignSalesperson` 会抛错。

---

## 11. 信息隔离

- **Private RFQ**：`isPrivate: true` → 只能由 `invitedMakers` 列表内的做市商报价
- **公开 RFQ**：所有 `active` 做市商可报价
- **状态隔离**：RFQ / Quote / Trade 各为独立存储，通过 `id` 关联

```typescript
const rfq = engine.createRfq({
  // ...
  isPrivate: true,
  invitedMakers: ['mm_a', 'mm_b'],   // 仅这两家可看到
});
```

---

## 12. 查询 API

| 方法 | 说明 |
|---|---|
| `getRfq(id)` | 查询 RFQ |
| `getTrade(id)` | 查询 Trade |
| `getClientRfqs(clientId)` | 客户的所有 RFQ |
| `getMakerTrades(makerId)` | 做市商的所有成交 |
| `getMakerRegistry().listMakers(tier?, asset?, status?)` | 做市商列表 |
| `getMakerRegistry().getTopMakers(period, limit, sortBy)` | 做市商排行榜 |
| `getCommissionEngine().getTradeCommissions(tradeId)` | 成交佣金列表 |
| `getCommissionEngine().getSalespersonStats(id, period)` | 撮合器人业绩 |

---

## 13. 事件清单

| 事件 | 触发时机 | 载荷 |
|---|---|---|
| `onRfqCreated` | RFQ 创建 | `{ rfq, timestamp }` |
| `onQuoteReceived` | 做市商报价 | `{ rfqId, quote, timestamp }` |
| `onQuoteAccepted` | 客户接受报价 | `{ rfq, quote, trade, timestamp }` |
| `onTradeCompleted` | 结算完成 | `{ trade, timestamp }` |
| `onPriceDeviation` | 价格偏离（warning/critical） | `{ tradeId, lockedPrice, currentPrice, deviation, level, timestamp }` |

每个 `on*` 返回 `Unsubscribe` 函数。

---

## 14. 测试

```
tests/otc-engine.test.ts   29 个测试用例
```

覆盖：
- `OtcMakerRegistry` 5 个（注册/审批/过滤/暂停/排名）
- `RfqEngine` 6 个（创建/邀请/报价/3 种选择策略/接受）
- `PriceLockService` 3 个（锁价/3 级偏离/告警回调）
- `SettlementEngine` 3 个（链上/法币/稳定币）
- `CommissionEngine` 3 个（三方分账/结算/自定义规则）
- `OtcEngine` 8 个（完整流程/撮合器人/状态机/查询/取消/偏离/订阅）
- 常量校验 1 个

运行：
```bash
npx tsx --test tests/otc-engine.test.ts
```

---

## 15. 与现有模块集成

| 集成点 | 实现方式 |
|---|---|
| `matching/decimal` | `decMul / decCmp / decAdd / decGte`（金额计算） |
| `fiat/*` | `FiatSettleHook` 回调（演示降级：mock reference） |
| `order-engine` | `OnchainConfirmHook` 回调（演示降级：50ms 确认） |
| Notification | `notifier(event)` 回调（默认 no-op） |

---

## 16. 演示降级说明

| 真实场景 | 演示降级 |
|---|---|
| 链上 6 块确认 | `setTimeout 50ms` 返 `confirmed=true` |
| 法币 SWIFT | `setTimeout 50ms` 返 reference（`FT...`） |
| 稳定币 USDT | 与链上共用 `defaultOnchainConfirm` |
| 通知发送 | 默认 no-op（可注入 `notifier`） |

生产环境只需替换对应 hook 即可对接真实基础设施。
