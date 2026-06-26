# Nansen 链上情报 (Nansen On-chain Intelligence)

> SMY 交易所链上分析模块 — 集成 Nansen Smart Money / Token God Mode / 大额转账 / 实体追踪 / 实时告警。

---

## 1. 什么是 Nansen

[Nansen](https://www.nansen.ai) 是行业领先的链上分析平台，通过对**数千万个钱包地址**打标签，识别出：
- **Smart Money（聪明钱）**：历史上回报率显著高于平均的对冲基金 / VC / 巨鲸
- **Entity（实体）**：Binance / a16z / Jump / Wintermute 等机构地址
- **Wallet Label**：CEX / DEX / VC / Fund / Whale / MEV Bot / High Value ...

Nansen 提供：
| 产品 | 说明 |
|---|---|
| Smart Money | 实时追踪聪明钱地址的买入 / 卖出 / 累积 / 派发 |
| Token God Mode | 单一 token 的聪明钱持仓聚合 + 净流入 |
| Wallet Profiler | 任意地址的画像 / 标签 / 风险分 |
| Transfers | 大额转账监控（默认 > $1M） |
| Alerts | Webhook / 邮件 / 推送 自定义告警 |
| Flow Intelligence | 资金流按实体来源聚合 |

---

## 2. 模块组成

| 文件 | 职责 |
|---|---|
| `types.ts` | 类型定义 + 关键常量 + 工具函数 |
| `nansen-client.ts` | Nansen REST 客户端（限流 / 重试 / mock 降级） |
| `signal-engine.ts` | 智能信号处理引擎（订阅 / 过滤 / 聚合 / 信心分） |
| `alert-manager.ts` | 告警管理（规则 CRUD / 评估 / 多通道发送） |
| `wallet-profiler.ts` | 钱包画像（profile / PnL / winRate / 排行榜 / 关注） |
| `index.ts` | 统一导出 |

```
┌──────────────────────────────────────────────────────────────┐
│                    应用层 (Admin / API / Bot)                │
└──────────────┬───────────────────────────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────────────────────────┐
│           SignalEngine        AlertManager   WalletProfiler  │
│  · subscribeSignals         · addRule       · profile        │
│  · filter / groupByToken    · evaluate      · getPnL         │
│  · calculateConviction      · sendAlert     · getTopWallets  │
│  · onSignal (WebSocket)     · getAlerts     · follow         │
└──────────────┬───────────────────────────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────────────────────────┐
│                     NansenClient                             │
│  · getAddress / getAddressLabels                             │
│  · getSmartMoneySignals / getTokenGodMode                    │
│  · getSmartMoneyHoldings / getLargeTransfers                 │
│  · getFlowIntelligence                                       │
│  · 60 req/min 限流 / 5xx 指数退避 / mock 降级                 │
└──────────────────────────────────────────────────────────────┘
               │
               ▼
        https://api.nansen.ai/v1
```

---

## 3. 申请 API Key

1. 注册 [Nansen](https://app.nansen.ai) 账户
2. 进入 `Settings → API → Generate Key`
3. 复制 key（注意：只显示一次）
4. 写入 `.env`：

```bash
NANSEN_API_KEY=nn_xxxxxxxxxxxxxxxxxxxx
```

> **演示降级**：key 包含 `mock` 或缺失时，所有 API 自动返回稳定的 mock 数据，**不消耗配额**，可放心用于本地开发与单元测试。

---

## 4. 8 链支持矩阵

| Chain | 钱包画像 | 聪明钱信号 | 大额转账 | Token God Mode |
|---|---|---|---|---|
| Ethereum (1) | ✅ | ✅ | ✅ | ✅ |
| BSC (56) | ✅ | ✅ | ✅ | ✅ |
| Polygon (137) | ✅ | ✅ | ✅ | ✅ |
| Arbitrum (42161) | ✅ | ✅ | ✅ | ✅ |
| Optimism (10) | ✅ | ✅ | ✅ | ✅ |
| Avalanche (43114) | ✅ | ✅ | ✅ | ✅ |
| Base (8453) | ✅ | ✅ | ✅ | ✅ |
| Solana | ✅ | ⚠️ 部分 | ✅ | ✅ |

> ✅ = 完全支持；⚠️ = 部分支持（部分 endpoint 限制）

---

## 5. 完整调用示例

### 5.1 基础：拉取 Smart Money 信号

```ts
import { NansenClient } from '@/lib/nansen';

const nansen = new NansenClient({ apiKey: process.env.NANSEN_API_KEY });

// 拉过去 24h 的聪明钱买入信号
const signals = await nansen.getSmartMoneySignals({
  chain: 'ethereum',
  since: Date.now() - 24 * 3600 * 1000,
  limit: 50,
});

for (const s of signals) {
  console.log(`[${s.signalType}] ${s.token.symbol} by ${s.walletAddress} | $${s.amountUsd}`);
}
```

### 5.2 Token God Mode

```ts
const WETH = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2';

const god = await nansen.getTokenGodMode(WETH, 'ethereum');
console.log({
  smartMoneyHolders: god.totalSmartMoneyHolders,
  totalValue: god.totalSmartMoneyValue,
  netFlow24h: god.smartMoneyNetFlow24h,
  concentration: god.concentration, // HHI
});
```

### 5.3 实时信号订阅（WebSocket + 轮询兜底）

```ts
import { NansenClient, SignalEngine } from '@/lib/nansen';

const engine = new SignalEngine({
  client: new NansenClient({ apiKey: process.env.NANSEN_API_KEY }),
  pollIntervalMs: 15_000,
});

// 订阅：所有 ETH 链上 buy/accumulate 信号，金额 >= $100k
const off = engine.subscribeSignals(
  { chains: ['ethereum'], types: ['buy', 'accumulate'], minUsd: 100_000 },
  async (signal) => {
    console.log(`🚨 ${signal.signalType} ${signal.token.symbol} by ${signal.walletAddress}`);
  },
);

// 主动注入一条信号（用于测试或人工触发）
engine.ingestSignal({
  id: 'manual-1',
  chain: 'ethereum',
  walletAddress: '0xabc...',
  signalType: 'buy',
  token: { symbol: 'ARB', address: '0x...', decimals: 18 },
  amount: '1000000000000000000',
  amountUsd: '1500000',
  txHash: '0x...',
  blockNumber: 12345678,
  timestamp: Date.now(),
  triggeredRules: ['SMART_MONEY_FLOW'],
  confidence: 0.92,
});

// 卸载
off();
```

### 5.4 信号聚合 + 信心分

```ts
const signals = await nansen.getSmartMoneySignals({ chain: 'ethereum', limit: 100 });

// 按 token 聚合
const stats = engine.groupByToken(signals);
for (const [token, s] of Object.entries(stats)) {
  console.log(`${token}: ${s.buyCount} buy / ${s.sellCount} sell / netFlow=$${s.netFlow}`);
}

// 计算某个 token 的 conviction（0-1）
const arbSignals = signals.filter((s) => s.token.symbol === 'ARB');
const conv = engine.calculateConviction(arbSignals);
console.log(`ARB conviction: ${(conv * 100).toFixed(1)}%`);
```

### 5.5 告警规则配置

```ts
import { AlertManager } from '@/lib/nansen';
import { EmailService } from '@/lib/notification/email/email-service';
import { PushService } from '@/lib/notification/push/push-service';

const alerts = new AlertManager({
  email: emailService,    // 注入现有 EmailService
  push: pushService,      // 注入现有 PushService
});

// 规则 1：聪明钱买入 WETH（>= $500k）→ 推送 + 邮件
alerts.addRule({
  type: 'smart_money_buy',
  tokens: ['0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'],
  thresholdUsd: 500_000,
  priority: 'high',
  channels: ['push', 'email'],
  recipients: ['user-1', 'user-2'],
  recipientEmails: ['trader@smy.exchange'],
  cooldownMs: 5 * 60_000,
});

// 规则 2：鲸鱼转账 >= $1M → webhook
alerts.addRule({
  type: 'whale_transfer',
  thresholdUsd: 1_000_000,
  priority: 'critical',
  channels: ['webhook'],
  webhookUrls: ['https://hooks.slack.com/services/...'],
  cooldownMs: 60_000,
});

// 评估信号
const fired = alerts.evaluateSignal(signal);
for (const a of fired) {
  await alerts.sendAlert(a);
}

// 历史
const unread = alerts.getAlerts({ unreadOnly: true, limit: 20 });
```

### 5.6 钱包画像 + 排行榜

```ts
import { WalletProfiler } from '@/lib/nansen';

const profiler = new WalletProfiler({
  client: new NansenClient({ apiKey: process.env.NANSEN_API_KEY }),
});

// 单个钱包画像
const profile = await profiler.profile('0xabc...', 'ethereum');
console.log(profile.labels, profile.entity, profile.riskScore);

// PnL + 胜率
const pnl = await profiler.getPnL('0xabc...', 'ethereum', 30);
console.log(`Realized: $${pnl.realized}, Win rate: ${(pnl.winRate * 100).toFixed(1)}%`);

// 排行榜：30 天 PnL 前 10
const top = await profiler.getTopWallets('30d', 'pnl', 10);
for (const e of top) {
  console.log(`#${e.rank} ${e.address} (${e.entity}) → ${e.metric}`);
}

// 关注
profiler.follow('0xabc...', 'user-1', 'ethereum', 'My Whale');
const followed = await profiler.getFollowed('user-1');
```

---

## 6. 告警规则配置

| 规则类型 | 触发条件 | 默认阈值 | 默认优先级 |
|---|---|---|---|
| `smart_money_buy` | signalType = buy/accumulate 且 amountUsd >= 阈值 | $100k | medium |
| `whale_transfer` | transfer amountUsd >= 阈值 | $1M (NANSEN_WHALE_THRESHOLD_USD) | high |
| `smart_money_net_flow` | 24h 聪明钱净流入 >= 阈值 | $5M (NANSEN_SMART_MONEY_FLOW_THRESHOLD_USD) | high |
| `contract_upgrade` | 信号携带 'CONTRACT_UPGRADE' 规则 | - | critical |

### 通道说明

| 通道 | 依赖 | 说明 |
|---|---|---|
| `email` | `EmailService.sendSecurityAlert` | 复用现有邮件通道 |
| `push` | `PushService.sendToUser` | FCM / APNs / HMS 三厂商 |
| `sms` | 自定义 `sms.sendCustom` | 需自行实现 |
| `webhook` | 内置 `fetch` | POST JSON 到指定 URL |

---

## 7. 与交易集成

`SignalEngine` 输出的信号可直接喂给：
- **量化策略**：`src/lib/quant/` — 策略订阅信号后自动调整仓位
- **做市引擎**：`src/lib/market-maker/` — 根据聪明钱流入调整报价
- **桥路由**：`src/lib/bridge/` — 跟随聪明钱迁移路径
- **风险引擎**：`src/lib/risk/` — 高风险地址自动加黑名单

```ts
// 量化策略订阅聪明钱信号
const off = engine.subscribeSignals(
  { types: ['accumulate'], minUsd: 1_000_000 },
  async (sig) => {
    await quantStrategy.onSmartMoneyAccumulate({
      token: sig.token.symbol,
      chain: sig.chain,
      conviction: engine.calculateConviction([sig]),
    });
  },
);
```

---

## 8. 演示降级

```ts
// 不配置 / 含 'mock' → mock 模式
const c = new NansenClient(); // mock
const c2 = new NansenClient({ apiKey: 'mock-test' }); // mock
const c3 = new NansenClient({ apiKey: process.env.NANSEN_API_KEY }); // 真实

console.log(c.isMock()); // true
console.log(c3.isMock()); // false
```

mock 模式下：
- 端点：本地内存生成稳定数据
- 限流：禁用
- 重试：禁用
- 数据：基于地址末位 hash 的伪随机但确定性结果（同一地址多次查询得到相同画像）

---

## 9. 关键常量

| 常量 | 值 | 含义 |
|---|---|---|
| `NANSEN_API_BASE` | `https://api.nansen.ai/v1` | REST 基础 URL |
| `NANSEN_WS_URL` | `wss://api.nansen.ai/v1/ws` | WebSocket URL |
| `NANSEN_RATE_LIMIT_PER_MIN` | `60` | 客户端每分钟限流 |
| `NANSEN_WHALE_THRESHOLD_USD` | `1_000_000` | 鲸鱼阈值（$1M） |
| `NANSEN_SMART_MONEY_FLOW_THRESHOLD_USD` | `5_000_000` | 聪明钱净流入阈值（$5M） |
| `NANSEN_DEFAULT_SIGNAL_LOOKBACK_HOURS` | `24` | 默认信号回溯（小时） |
| `NANSEN_DEFAULT_TIMEOUT_MS` | `10_000` | 默认请求超时 |
| `NANSEN_DEFAULT_MAX_RETRIES` | `3` | 默认重试次数 |

---

## 10. 测试

```bash
npx tsx tests/nansen.test.ts
```

覆盖 16+ 个测试用例：
- NansenClient：getAddress / getAddressLabels / getSmartMoneySignals / getTokenGodMode / getSmartMoneyHoldings / getLargeTransfers / getFlowIntelligence / 5xx 重试 / 4xx 抛出 / 8 链矩阵
- SignalEngine：订阅 / 过滤 / groupByToken / calculateConviction
- AlertManager：addRule / evaluateSignal / sendAlert / 历史
- WalletProfiler：profile / PnL / getTopWallets / follow / unfollow
- 演示降级
