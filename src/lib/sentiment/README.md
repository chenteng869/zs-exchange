# AI 情绪分析系统（Sentiment Analysis）— P3-3

> 集成新闻 / 社交 / 行情 / 衍生品 / 链上 5+ 数据源，融合自实现 NLP 与恐慌贪婪指数，生成趋势预测与异常告警。

## 目录

- [架构总览](#架构总览)
- [7 大数据源](#7-大数据源)
- [NLP 算法](#nlp-算法)
- [恐慌贪婪指数](#恐慌贪婪指数)
- [预测模型](#预测模型)
- [异常检测](#异常检测)
- [完整调用示例](#完整调用示例)
- [信号生成](#信号生成)

---

## 架构总览

```
                ┌──────────────────────────────────────┐
                │         SentimentEngine              │  业务层
                │  (analyzeSymbol / 事件 / 历史)        │
                └──────────────────────────────────────┘
                                  │
       ┌──────────────┬───────────┼──────────────┬──────────────┐
       ▼              ▼           ▼              ▼              ▼
  NewsCollector  SocialCollector MarketCollector  Aggregator   Predictor
  (CryptoPanic)  (TW/RD/TG/DC)   (Binance)        (加权+FGI)   (线性模型)
       │              │           │              │
       └──────────────┴─────┬─────┴──────────────┘
                            ▼
                       NlpEngine        ← 词典法 NLP（500+ 词条）
```

**主流程 `analyzeSymbol(symbol)`**：
1. 并发抓取 5 源（news / twitter / reddit / telegram / market）
2. NLP 评分每条文本
3. 按源汇总为 `SourceSentiment`
4. 加权聚合 → `overallScore`（-1 ~ 1）
5. 计算恐慌贪婪指数（0 ~ 100）
6. 异常检测（量激增 / 情感突变 / 关键词爆发 / 操纵嫌疑）
7. 趋势信号 + 推理链
8. 落库 + 触发事件

---

## 7 大数据源

| 源 | 类型 | 接入方式 | 凭据 | 降级 |
|---|---|---|---|---|
| **news** | 文本 | 集成 `src/lib/news/cryptopanic-client.ts` | `CRYPTOPANIC_API_KEY` | 客户端内置 mock |
| **twitter** | 文本 | X API v2 recent search | `TWITTER_BEARER_TOKEN` | mock 多空混合样本 |
| **reddit** | 文本 | OAuth client_credentials + /search | `REDDIT_CLIENT_ID/SECRET` | mock |
| **telegram** | 文本 | Bot API `getChatHistory` | `TELEGRAM_BOT_TOKEN` | mock |
| **discord** | 文本 | Bot API `GET /channels/{id}/messages` | `DISCORD_BOT_TOKEN` | mock |
| **market** | 行情情绪 | `src/lib/market/binance-client.ts`（24h ticker + 168 根 1h K 线） | 无 | mock snapshot |
| **derivatives** | 衍生品情绪 | 计划中（多空比 / 资金费率） | - | 中性 0 |
| **onchain** | 链上情绪 | 计划中（Glassnode / CryptoQuant） | - | 中性 0 |

权重（默认，可注入覆盖）：

```ts
SENTIMENT_SOURCE_WEIGHTS = {
  news:       0.25,
  twitter:    0.30,   // 最高
  reddit:     0.15,
  telegram:   0.10,
  market:     0.20,
  derivatives:0.10,
  onchain:    0.10,
};
```

---

## NLP 算法

**词典法 + 启发式规则**（不引第三方依赖）。

词典规模：500+ 词条，含：
- 正面词（中文 ~50 + 英文 ~50 + 高强度 5）
- 负面词（中文 ~50 + 英文 ~50 + 高强度 5）
- 程度副词（中文 + 英文 共 ~20）
- 否定词（中文 + 英文 共 ~20）
- 加密货币实体（40+ 币种符号 / 名称）

### 计分流程

```text
for each token t in text:
    if t in POSITIVE:        base = +weight
    else if t in NEGATIVE:   base = -weight
    else: continue

    // 否定窗口（默认前 3 个 token 内）
    negated = any(prev ∈ NEGATIONS) within window

    // 程度副词加权
    multiplier = max(intensifier(prev))  // 1 ~ 1.5

    score += (negated ? -base : base) * multiplier
    magnitude += |base * multiplier|

normalized_score = score / max(magnitude, 1)   // 收敛到 [-1, 1]
confidence      = sigmoid(min(magnitude, 4) / 2)  // 0 ~ 1
label            = scoreToLabel(normalized_score)  // 5 档
```

### 5 档情绪

```ts
SENTIMENT_LABELS_THRESHOLDS = {
  very_bearish: [-1, -0.5],
  bearish:      [-0.5, -0.1],
  neutral:      [-0.1, 0.1],
  bullish:      [0.1, 0.5],
  very_bullish: [0.5, 1],
};
```

### 实体识别

支持：
- 已知币种符号（BTC / ETH / USDT ...）
- 中文币名（比特币 / 以太坊 / 莱特币 ...）
- 上下文中的大写字母组合（A-Z 2~6 字符）

---

## 恐慌贪婪指数

参考 Alternative.me 模型，6 维加权：

```ts
FEAR_GREED_COMPONENTS = {
  volatility:  0.25,   // 波动率（高=恐惧，反向）
  momentum:    0.25,   // 动量（24h 涨跌幅 → 0-100）
  socialMedia: 0.15,   // 社交媒体情绪
  surveys:     0.15,   // 调查 / 新闻
  dominance:   0.10,   // BTC 主导率（替代：market 源）
  trends:      0.10,   // 搜索趋势（替代：量能比）
};
```

- 0 ~ 24 → `Extreme Fear`
- 25 ~ 44 → `Fear`
- 45 ~ 55 → `Neutral`
- 56 ~ 75 → `Greed`
- 76 ~ 100 → `Extreme Greed`

---

## 预测模型

**模型**：`v1.0.0-heuristic`（线性 + 加权）

```text
features = {
  sentiment: [-1, 1],    // 综合情绪
  momentum:  [-1, 1],    // 动量（market 源归一化）
  volume:    [-1, 1],    // 量能（文本量 / 200 截断）
  chg24h:    [-1, 1],    // 24h 变化
  fgi:       [-1, 1],    // 恐慌贪婪指数（0-100 → -1~1）
}

weights = { sentiment: 0.40, momentum: 0.20, volume: 0.15, chg24h: 0.15, fgi: 0.10 }
composite = dot(weights, features)
expected_pct = composite × scale(horizon) × volDecay(horizon)
```

| horizon | scale | volDecay | 噪声阈值 |
|---|---|---|---|
| 1h  | 0.6  | 1.0 | 0.10 |
| 4h  | 1.2  | 0.8 | 0.15 |
| 24h | 2.5  | 0.6 | 0.20 |
| 7d  | 6.0  | 0.4 | 0.30 |

输出：

```ts
{
  direction: 'up' | 'down' | 'sideways',
  confidence: 0 ~ 0.99,
  expectedChange: '+2.30%',
  features: { ... },
  modelVersion: 'v1.0.0-heuristic',
}
```

回测通过 `recordResult()` 累积样本，`getAccuracyStats()` 给出命中率。

---

## 异常检测

| 类型 | 触发条件 | 严重度 |
|---|---|---|
| `volume_spike` | 当前文本量 ≥ 3× 历史均量 | low / medium / high / critical（按比例） |
| `sentiment_shift` | 综合分与上窗口差 ≥ 0.4 | low / medium / high / critical（按幅度） |
| `keyword_burst` | 关键词 24h 出现 ≥ 5× 7d 均值 | 同上 |
| `manipulation` | 同时出现 ≥3 条极多 + ≥3 条极空文本 | high |

默认阈值：

```ts
ANOMALY_VOLUME_SPIKE_THRESHOLD   = 3;     // 3x
ANOMALY_SENTIMENT_SHIFT          = 0.4;   // 40% 跳变
ANOMALY_KEYWORD_BURST_THRESHOLD  = 5;     // 5x
```

---

## 完整调用示例

```ts
import { SentimentEngine, SentimentPredictor } from '@/lib/sentiment';

// 1. 实例化（缺凭据时自动 mock 降级）
const engine = new SentimentEngine({
  perSourceLimit: 50,
  enableNotifications: false,
});

// 2. （可选）注入推送适配器
engine.setNotifier({
  async notifyAnomaly(alert, symbol) {
    console.log(`🚨 [${symbol}] ${alert.type}: ${alert.description}`);
    // 可对接 PushService / SmsService
  },
  async notifySentimentShift(cur, prev) {
    console.log(`📊 sentiment shift: ${prev?.overallScore} → ${cur.overallScore}`);
  },
});

// 3. 订阅事件
const offAnomaly = engine.onAnomaly((alert, symbol) => {
  console.log(`anomaly: ${alert.type} on ${symbol}`);
});
engine.onSentimentShift((cur, prev) => {
  console.log(`shift: ${cur.overallScore}`);
});
engine.onUpdate((ms) => {
  console.log(`update: ${ms.symbol} = ${ms.overallScore}`);
});

// 4. 分析
const ms = await engine.analyzeSymbol('BTC');
console.log(ms);
// {
//   symbol: 'BTC',
//   overallScore: 0.34,
//   overallLabel: 'bullish',
//   fearGreedIndex: 62,
//   fearGreedLabel: 'Greed',
//   volume24h: 240,
//   trend: 'buy',
//   signal: { action: 'buy', strength: 0.62, reasoning: [...] },
//   anomalies: [],
//   ...
// }

// 5. 预测
const pred24h = engine.predict('BTC', '24h');
console.log(pred24h);  // { direction: 'up', confidence: 0.71, expectedChange: '+1.85%' }

// 6. 历史（每天 1 个快照，保留 90 天）
const week = engine.getHistory('BTC', '7d');

// 7. 趋势信号
const sig = engine.getTrendSignal('ETH', '4h');
```

### 单独使用 NLP

```ts
import { NlpEngine } from '@/lib/sentiment';

const nlp = new NlpEngine();
const r = nlp.analyzeSentiment('BTC 大幅上涨，突破前高，看多');
// { score: 0.7, label: 'very_bullish', confidence: 0.9, magnitude: 4, keywords: [...] }
```

### 单独使用 Aggregator

```ts
import { SentimentAggregator, FEAR_GREED_COMPONENTS } from '@/lib/sentiment';

const agg = new SentimentAggregator();

const fgi = agg.calculateFearGreedIndex({
  volatility: 30, momentum: 70, socialMedia: 60, surveys: 50, dominance: 55, trends: 65,
});
// 65 → 'Greed'

const score = agg.aggregate([
  { source: 'news', score: 0.5, sampleSize: 100 },
  { source: 'twitter', score: 0.8, sampleSize: 200 },
  { source: 'market', score: 0.2, sampleSize: 1 },
]);
```

---

## 信号生成

`SentimentEngine.analyzeSymbol()` 返回的 `signal` 字段：

```ts
{
  action: 'strong_sell' | 'sell' | 'hold' | 'buy' | 'strong_buy',
  strength: 0 ~ 1,
  reasoning: string[]   // 自然语言推理链，可直接展示
}
```

`action` 映射：

| 区间 | action |
|---|---|
| `score ≥ 0.5`  | `strong_buy` |
| `score ≥ 0.1`  | `buy` |
| `-0.1 < score < 0.1` | `hold` |
| `score ≤ -0.1` | `sell` |
| `score ≤ -0.5` | `strong_sell` |

下游可结合自身风控（仓位 / 风险敞口）决定实际下单逻辑。

---

## 关键常量一览

```ts
import {
  SENTIMENT_SOURCE_WEIGHTS,
  FEAR_GREED_COMPONENTS,
  SENTIMENT_LABELS_THRESHOLDS,
  ANOMALY_VOLUME_SPIKE_THRESHOLD,
  ANOMALY_SENTIMENT_SHIFT,
  ANOMALY_KEYWORD_BURST_THRESHOLD,
  MODEL_VERSION,
} from '@/lib/sentiment';
```

## 模块清单

- `types.ts` — 共享类型与常量
- `nlp-engine.ts` — 自实现 NLP
- `aggregator.ts` — 加权 / 恐慌贪婪 / 异常
- `predictor.ts` — 线性预测器
- `collectors/news-collector.ts` — CryptoPanic 新闻
- `collectors/social-collector.ts` — Twitter / Reddit / Telegram / Discord
- `collectors/market-collector.ts` — Binance 行情情绪化
- `sentiment-engine.ts` — 业务层编排
- `index.ts` — 统一出口

## 测试

```bash
npx tsx --test tests/sentiment.test.ts
```

覆盖 18 个用例：分词 / 情感 / 否定 / 程度 / 实体 / 4 个 Collector / Aggregator / Predictor / Engine / 降级。
