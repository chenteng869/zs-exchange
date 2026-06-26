# KOL / Influencer 推广返佣 + 跟单交易 系统

为 SMY 交易所实现的完整 KOL（Key Opinion Leader）系统，包含
**多级分销 + 业绩返佣 + 跟单交易 + 业绩结算**，参考 Binance Affiliate / OKX
KOL / Bybit 跟单系统等头部交易所设计。

## 模块组成

```
src/lib/kol/
├── types.ts                 类型定义 & 常量
├── kol-service.ts           KOL 管理（注册 / 审批 / 暂停 / 评级 / 排行榜）
├── referral-service.ts      邀请关系（绑定 / 多级分销 / 业绩）
├── commission-engine.ts     返佣引擎（规则 / 计算 / 记录 / 结算）
├── copy-trading.ts          跟单服务（配置 / 触发 / 风险控制）
├── kol-engine.ts            业务层（集成 OrderEngine / 事件订阅 / 报表）
├── index.ts                 统一导出
└── README.md                本文档
```

## 一、KOL 基础

### 角色
KOL（Key Opinion Leader）是平台的核心流量来源。
- 在社交平台（Twitter / YouTube / Telegram）拥有一定粉丝基础
- 通过专属推广码邀请用户注册
- 用户交易产生手续费时，KOL 获得多级返佣
- 可开启跟单（粉丝自动跟随其交易）

### 等级
```ts
type KolTier = 'micro' | 'macro' | 'mega' | 'celebrity' | 'institutional';
```

| 等级           | 最低粉丝数 | 最低团队交易量   | 费率加成 |
|---------------|-----------|----------------|---------|
| micro         | 0         | 0              | 1.0x    |
| macro         | 1,000     | 100,000 USDT   | 1.1x    |
| mega          | 10,000    | 1,000,000      | 1.2x    |
| celebrity     | 100,000   | 10,000,000     | 1.5x    |
| institutional | -         | 100,000,000    | 单独标准 |

### 状态
```ts
type KolStatus = 'pending' | 'active' | 'suspended' | 'banned';
```
- `pending`：申请中（必须先 KYC，再审批）
- `active`：正常参与返佣 / 跟单
- `suspended`：暂停（合规问题 / 异常流量）
- `banned`：拉黑（违规），不可恢复

## 二、多级分销

### 邀请链模型
- 用户绑定 KOL 推广码 → L1 referral
- 若 KOL 自己也是另一个 KOL 的下线 → 自动建立 L2 referral
- 最多 3 级

举例：
```
KOL A 邀请 KOL B → KOL B 是 A 的 L1
KOL B 邀请 KOL C → C 是 B 的 L1；C 同时是 A 的 L2
KOL C 邀请 user D → D 是 C 的 L1；D 是 B 的 L2；D 是 A 的 L3
```

### 返佣比例（按 level）
| Level | 返佣系数 |
|-------|---------|
| L1    | 30%     |
| L2    | 10%     |
| L3    | 5%      |

最终返佣 = `baseAmount × typeRate × tierBonus × levelRate`

### 默认费率
| Type    | 默认费率  | 说明                |
|---------|----------|---------------------|
| spot    | 0.1%     | 现货交易手续费       |
| perp    | 0.05%    | 合约交易手续费       |
| deposit | 0        | 入金不返佣          |
| withdraw| 0        | 出金不返佣          |
| copy    | 0.2%     | 跟单交易量          |

## 三、跟单交易（Copy Trading）

### 跟单模式
```ts
type CopyMode = 'fixed' | 'proportional' | 'scaled';
```

| 模式         | 说明                                       |
|--------------|-------------------------------------------|
| fixed        | 固定金额（USDT），按价格折算数量           |
| proportional | 按比例跟单（0.5 = 50% of KOL 数量）        |
| scaled       | 缩放系数（直接乘 KOL 数量）                |

### 跟单流程
```
1. 粉丝创建 CopyTradingConfig → mode / 比例 / 限额
2. KOL 下单成交 → KolEngine.onTrade 触发
3. 判定 KOL = active KOL → 复制给所有 active followers
4. 按 mode 计算 copyQuantity
5. 风险检查（maxLossPerTrade / maxDailyLoss / stopLossRatio）
6. 模拟下单 → 累计 totalCopied / totalProfit
```

### 风险控制
| 指标              | 默认值      | 说明                                |
|------------------|------------|-------------------------------------|
| maxLossPerTrade  | 1000 USDT  | 单笔最大损失 = value × stopLossRatio |
| maxDailyLoss     | 5000 USDT  | 每日累计损失上限                    |
| stopLossRatio    | 由 config  | 止损比例（开仓价 ± ratio）          |
| takeProfitRatio  | 由 config  | 止盈比例                            |
| KOL_COPY_MAX_TRADES | 10,000  | 单 config 跟单笔数上限              |

### 防作弊
- 单笔最大损失检查：若预估单笔损失 > `maxLossPerTrade` → 拒绝跟单
- 每日最大损失检查：累计 `dailyLoss + estLoss` > `maxDailyLoss` → 拒绝
- 单 KOL 跟单笔数上限 → 防止粉尘刷单

## 四、业绩结算

### 结算窗口
- 100 USDT 起结（`KOL_SETTLEMENT_MIN_AMOUNT`）
- 小于起结额 → settlement 状态 = pending，等待累计
- 满足起结额 → 立即发放，commission 状态 = paid

### 状态机
```
Commission:
  pending → confirmed → paid
                       → revoked
```

### 业绩公式
```
L1 返佣 = baseAmount × 0.001 (spot) × 1.0 (tier) × 0.30 = baseAmount × 0.0003
L2 返佣 = baseAmount × 0.001 × 1.0 × 0.10 = baseAmount × 0.0001
L3 返佣 = baseAmount × 0.001 × 1.0 × 0.05 = baseAmount × 0.00005
```

举例：user 交易 10,000 USDT，spot 费率 0.1%，3 级分销全部命中：
- L1 KOL: 3 USDT
- L2 KOL: 1 USDT
- L3 KOL: 0.5 USDT

## 五、完整调用示例

```ts
import { KolEngine, KOL_DEFAULT_COMMISSION_RATES } from '@/lib/kol';
import { MatchingEngine } from '@/lib/matching';

// 1. 启动
const matchingEngine = new MatchingEngine();
const kolEngine = new KolEngine({ matchingEngine });
kolEngine.bindMatchingEngine(matchingEngine);  // 监听订单事件

// 2. 监听
kolEngine.onCommission(({ commission }) => {
  console.log(`[commission] ${commission.amount} USDT to KOL ${commission.kolId}`);
});
kolEngine.onCopyTrade(({ copyTrade }) => {
  console.log(`[copy] follower ${copyTrade.followerUserId} copied ${copyTrade.copyQuantity}`);
});

// 3. KOL 申请 / 审批
const alice = kolEngine.applyKol('user_alice', {
  displayName: 'Alice',
  kycVerified: true,
  followerCount: 50_000,
  socials: { twitter: '@alice' },
});
kolEngine.approveKol(alice.id, 'macro');

// 4. 用户绑定推广码
const ref = kolEngine.bindUserToKol('user_bob', alice.referralCode);
// bob 的 chain 包含 1 条 referral (L1, kol=alice)

// 5. 触发返佣（OrderEngine 集成后自动触发；此处手动演示）
kolEngine.triggerCommissions({
  userId: 'user_bob',
  type: 'spot',
  baseAmount: '10000',  // 10000 USDT 交易量
  sourceTxId: 'tx_001',
});
//  → alice 获得 3 USDT 返佣（10000 * 0.001 * 0.3）

// 6. 跟单配置
const cfg = kolEngine.createCopyConfig({
  followerUserId: 'user_charlie',
  kolUserId: alice.userId,
  mode: 'proportional',
  proportionalRatio: 0.5,        // 跟 50%
  maxLossPerTrade: '500',
  maxDailyLoss: '2000',
  stopLossRatio: 0.05,
  takeProfitRatio: 0.15,
});

// 7. 模拟 KOL 成交（实际由 OrderEngine 触发）
await kolEngine.getCopyTradingService().onKolTrade(
  {
    id: 'ko_001',
    userId: alice.userId,
    symbol: 'BTC/USDT',
    side: 'buy',
    price: '30000',
    quantity: '10',
    quoteQty: '300000',
  },
  alice.userId,
);
// → charlie 自动成交 5 BTC @ 30000

// 8. 结算
const period = { start: startOfMonth, end: endOfMonth };
const settlement = kolEngine.getCommissionEngine().settleKol(alice.id, period);
console.log(settlement.status, settlement.totalAmount);

// 9. 报表
const report = kolEngine.getKolReport(alice.id, period);
console.log(`团队交易量: ${report.totalTradingVolume}`);
console.log(`团队返佣:   ${report.totalCommission}`);

// 10. 排行榜
const top = kolEngine.getTopKol(period, 10);
top.forEach((s, idx) => console.log(`${idx + 1}. ${s.kolId}: ${s.totalCommission} USDT`));
```

## 六、防作弊机制

1. **同一用户只能绑定一个 KOL**（`unbindReferral` 后才能重绑，避免反复刷）
2. **KOL 必须 KYC**（`approveKol` 强制要求 `kycVerified=true`）
3. **banned KOL 不可被绑定**（`bindReferral` 校验 KOL 状态）
4. **返佣计算用 string**（`@/lib/matching/decimal`，无浮点误差）
5. **风险检查**（单笔 / 每日最大损失）
6. **跟单笔数上限**（`KOL_COPY_MAX_TRADES = 10,000`）
7. **结算起结额**（100 USDT 起结，防止粉尘结算）
8. **banned 不可恢复**（`reactivateKol` 对 banned 抛错）
9. **规则优先级**：kol-specific > tier-specific > global
10. **level 比例固定**：L1=30%、L2=10%、L3=5%（写在常量，运营可改后端 + 重启）

## 七、与现有模块集成

- `MatchingEngine` 事件 → `KolEngine.bindMatchingEngine` → 自动触发 commission + copy
- `KOL` 拓展可与 `KYC Service` 联动：申请时校验 KOL 的 KYC 状态
- 与 `PaymentService` 联动：入金 / 出金可触发 deposit / withdraw 类型返佣
- 与 `MatchingEngine.orderCancelled` 事件可扩展：撤单时冲销 commission
- 跟单模拟成交可对接实际 OrderEngine：`kolOrder` 替换为真实 `Trade`

## 八、常量速查

```ts
KOL_COMMISSION_LEVELS   = { 1: 0.30, 2: 0.10, 3: 0.05 }
KOL_TIER_MIN_FOLLOWERS  = { micro: 0, macro: 1k, mega: 10k, celebrity: 100k, institutional: 0 }
KOL_TIER_MIN_VOLUME     = { micro: 0, macro: 100k, mega: 1M, celebrity: 10M, institutional: 100M }
KOL_DEFAULT_COMMISSION_RATES = { spot: 0.001, perp: 0.0005, deposit: 0, withdraw: 0, copy: 0.002 }
KOL_SETTLEMENT_MIN_AMOUNT    = '100'         // USDT
KOL_COPY_DEFAULT_RATIO       = 0.5           // 50%
KOL_COPY_MAX_RATIO           = 1.0
KOL_DEFAULT_MAX_LOSS_PER_TRADE = '1000'
KOL_DEFAULT_MAX_DAILY_LOSS     = '5000'
KOL_LEADERBOARD_LIMIT          = 100
KOL_COPY_MAX_TRADES            = 10_000
KOL_MAX_LEVEL                  = 3
```
