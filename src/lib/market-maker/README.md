# 做市商系统 (Market Maker)

为 SMY 交易所实现完整的做市商（Market Maker）系统，参考 Binance / OKX 等头部交易所的
官方做市商计划（Binance VIP Maker / OKX Market Maker）。

## 模块组成

```
src/lib/market-maker/
├── types.ts                 类型定义 & 常量
├── quote-engine.ts          报价引擎（双边挂单 / 自动调价）
├── inventory-manager.ts     库存管理（风险敞口 / 调仓）
├── rebate-engine.ts         返佣引擎（手续费返还 / 日结 / 月结）
├── market-maker-engine.ts   核心业务引擎（注册 / 报价维护 / 统计 / 排行榜）
├── index.ts                 统一导出
└── README.md                本文档
```

## 一、做市商基础

### 角色
做市商（Market Maker）是提供双边挂单、为交易所注入流动性的专业机构 / 团队。
- 提供 `bid`（买）和 `ask`（卖）两侧挂单
- 在盘口保持较窄的价差
- 接受交易所的返佣 / 激励作为收入

### 等级
```ts
type MarketMakerTier = 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
```

| 等级     | 典型 maker fee | 典型 rebate rate |
|---------|----------------|-------------------|
| bronze   | 0.0000         | 0.00005           |
| silver   | -0.00005       | 0.00010           |
| gold     | -0.0001        | 0.00020           |
| platinum | -0.00015       | 0.00030           |
| diamond  | -0.0002        | 0.00040           |

### 状态
```ts
type MarketMakerStatus = 'active' | 'suspended' | 'banned';
```
- `active`：正常报价、参与返佣
- `suspended`：暂停（维护 / 风控），不报价
- `banned`：拉黑（违规），不可恢复

## 二、报价策略

### 报价公式
对参考价 `refPrice`，点差 `spread` (bps)，倾斜 `skew` (bps)：

```
halfSpread = spread / 2
bid = refPrice * (1 - halfSpread/10000 - skew/10000)
ask = refPrice * (1 + halfSpread/10000 + skew/10000)
```

### 多档报价
默认生成 5 档报价（1-5），每往外一档价格外扩 `MM_LEVEL_STEP_BPS` (1bp)。

### 调价 API
```ts
const qe = new QuoteEngine();
qe.setSpread('BTC/USDT', 10);     // 10 bps 点差
qe.setSkew('BTC/USDT', 0.5);      // 倾斜灵敏度
qe.setSize('BTC/USDT', '0.1');    // 单档数量
qe.setLevels('BTC/USDT', 5);      // 档位
```

### 报价生成
```ts
const { bid, ask } = qe.generateQuote('BTC/USDT', {
  baseAmount: '0.5',
  maxInventory: '10',
}, '30000');
```

## 三、库存管理

### 库存模型
```ts
interface Inventory {
  baseAmount: string;     // 正=多头，负=空头
  quoteAmount: string;
  midPrice: string;
  inventoryValue: string; // 名义价值 = baseAmount * midPrice
  targetInventory: string;
  skew: number;           // baseAmount / targetInventory
}
```

### 风险控制
- 库存偏离 ≤ 80% (`MM_INVENTORY_LIMIT_PCT`)：正常
- 库存偏离 80%-95%：warning 警告
- 库存偏离 > 95%：critical 紧急（建议暂停报价）

### 调仓计划
```ts
const plan = im.rebalancePlan(inventory, '5');
// { buyAmount: '3', sellAmount: '0', action: 'increase_long', ... }
```

### 库存报警事件
```ts
im.onInventoryAlert((alert) => {
  if (alert.level === 'critical') {
    // 暂停该做市商
  }
});
```

## 四、返佣机制

### 公式
```
volume = price * quantity
rebate = volume * rebateRate
```
当 `rebate < MM_REBATE_MIN` (1 USDT) 时视为粉尘，不记录。

### 日结 / 月结
```ts
const settlement = re.settleDaily(mm, dayStart, dayEnd);
// { totalVolume, totalRebate, recordCount, ... }
```

### 报表
```ts
const report = re.getReport(mm, start, end);
// { totalVolume, totalRebate, averageRebatePerTrade, ... }
```

### 黑名单
对异常做市商（虚假成交量 / 操纵市场）可加入黑名单：
```ts
re.addToBlacklist(mmId);
// 此后 recordRebate / calculateRebate 永远返回 '0'
```

## 五、风控规则

| 触发条件                          | 处理方式                            |
|----------------------------------|-------------------------------------|
| 库存偏离 > 80%                   | 报警 (warning)                      |
| 库存偏离 > 95%                   | 报警 (critical) + 暂停报价            |
| 返佣 < 1 USDT                    | 不记录（粉尘）                       |
| rebateRate <= 0                  | 不返佣                              |
| status != 'active'               | 不报价 / 不返佣                      |
| 黑名单做市商                      | 不返佣                              |
| 报价 createdAt 距今 > 30s         | 自动清理（cancelStale）             |
| spread < 1 bp                    | 拒绝（setSpread 抛错）               |

## 六、完整调用示例

```ts
import { MarketMakerEngine } from '@/lib/market-maker';
import { getMatchingEngine } from '@/lib/matching/engine';

// 1) 创建做市商引擎
const matchingEngine = getMatchingEngine();
const mmEngine = new MarketMakerEngine({ matchingEngine });

// 监听做市商报价更新
mmEngine.onQuoteUpdate(({ marketMakerId, symbol, quotes }) => {
  console.log(`${marketMakerId} 刷新 ${symbol} 报价 ${quotes.length} 档`);
});

// 2) 注册 + 审批做市商
const mm = mmEngine.registerMarketMaker({
  name: 'SMY_Liquidity',
  tier: 'gold',
  apiKey: 'mk_live_xxx',
  apiSecret: 'sk_xxx',
  makerFeeRate: -0.0001,   // 1bp 返佣
  rebateRate: 0.0002,      // 2bp 返佣
  dailyVolumeTarget: '1000000',
  minSpreadBps: 5,
  maxInventory: '10',
  symbols: ['BTC/USDT', 'ETH/USDT'],
});
mmEngine.approveMarketMaker(mm.id);

// 3) 配置报价参数
const qe = mmEngine.getQuoteEngine();
qe.setSpread('BTC/USDT', 10);   // 10 bps
qe.setSize('BTC/USDT', '0.1');  // 单档 0.1 BTC
qe.setLevels('BTC/USDT', 5);    // 5 档

// 4) 启动定时刷新（每 5 秒）
setInterval(() => {
  mmEngine.updateQuote(mm.id, 'BTC/USDT');
  mmEngine.updateQuote(mm.id, 'ETH/USDT');
}, 5000);

// 5) 绑定 OrderEngine，自动累计成交量 + 触发返佣
mmEngine.bindMatchingEngine(matchingEngine);

// 6) 监听库存报警
mmEngine.getInventoryManager().onInventoryAlert((alert) => {
  if (alert.level === 'critical') {
    mmEngine.suspendMarketMaker(alert.marketMakerId, 'inventory critical');
  }
});

// 7) 查询统计 + 排行榜
const stats = mmEngine.getStats(mm.id, { start: dayStart, end: dayEnd });
console.log(`成交量: ${stats.totalVolume} USDT`);

const lb = mmEngine.getLeaderboard('BTC/USDT', 7, 100);
console.log(`第 1 名: ${lb[0]?.name} 成交量: ${lb[0]?.totalVolume}`);

// 8) 日结
const re = mmEngine.getRebateEngine();
const settlement = re.settleDaily(mm, dayStart);
console.log(`今日返佣: ${settlement.totalRebate} USDT`);
```

## 七、报价与 OrderEngine 集成

```ts
// 通过 MatchingEngine 事件驱动
const matchingEngine = getMatchingEngine();
matchingEngine.on('orderMatched', ({ trade, taker, maker }) => {
  // 检查 maker/taker 是否是本系统的做市商
  if (maker.userId.startsWith('mm_') || taker.userId.startsWith('mm_')) {
    mmEngine.handleTrade(trade);
  }
});
```

## 八、API 端点（参考）

```
POST /api/v1/market-maker/register         注册做市商
POST /api/v1/market-maker/approve/:id      审批
POST /api/v1/market-maker/suspend/:id      暂停
GET  /api/v1/market-maker/list             列表
GET  /api/v1/market-maker/stats/:id        统计
GET  /api/v1/market-maker/leaderboard      排行榜
GET  /api/v1/market-maker/quotes/:id       当前报价
```

## 九、关键常量

```ts
MM_MIN_SPREAD_BPS = 1;          // 最小 1bp
MM_DEFAULT_SPREAD_BPS = 10;     // 默认 10bp
MM_INVENTORY_LIMIT_PCT = 0.8;   // 80% 触发
MM_REBATE_MIN = '1';            // 1 USDT
MM_QUOTE_EXPIRY_MS = 30_000;    // 30s
MM_LEADERBOARD_LIMIT = 100;
MM_MAX_LEVELS = 10;
MM_LEVEL_STEP_BPS = 1;
```

## 十、测试

```bash
npx tsx --test tests/market-maker.test.ts
```

覆盖 25 个测试用例：
- 做市商管理：注册 / 审批 / 暂停 / 拉黑 / 列表
- 报价引擎：bid/ask 生成 / 点差 / skew 倾斜 / 撤单 / cancelStale
- 库存管理：checkInventoryLimit / calculateSkew / rebalancePlan / 报警事件
- 返佣引擎：calculateRebate / recordRebate / 黑名单 / 粉尘过滤
- 统计：getStats / getLeaderboard / updateQuote
