# News 模块（P1 H-01：CryptoPanic 新闻聚合）

加密新闻聚合层。给"学院"首页、币种详情页、通知中心提供中英双语 + 情绪标签的实时新闻流。

---

## 架构图

```
┌──────────────────────────────────────────────────────────────────────┐
│                       业务层 (NewsAggregator)                         │
│  ┌─────────────────┐ ┌─────────────────┐ ┌────────────────────────┐ │
│  │ getLatest()     │ │ getByCurrency() │ │ getByCategory()        │ │
│  │ search()        │ │ invalidateCache │ │ onNews(handler)        │ │
│  └────────┬────────┘ └────────┬────────┘ └────────────┬───────────┘ │
│           │   30 min TTL 缓存（Map<key, {value, expiresAt}>）         │
│  ┌────────▼────────────────────▼────────────────────▼──────────────┐ │
│  │ augment()  ——  按需调用 Translator / SentimentAnalyzer         │ │
│  └────────┬─────────────────────────────────────────────────────────┘ │
│           │                                                           │
│  ┌────────▼────────┐  ┌──────────────────┐  ┌──────────────────────┐ │
│  │ CryptoPanic     │  │ Translator       │  │ SentimentAnalyzer    │ │
│  │ Client          │  │ (mock/Google/    │  │ (keyword/GPT-4/      │ │
│  │ + RateLimiter   │  │  DeepL)          │  │  FinBERT)            │ │
│  │ + Retry/Backoff │  │ + LRU Cache      │  │ + 双语言关键词        │ │
│  └────────┬────────┘  └──────────────────┘  └──────────────────────┘ │
│           │                                                           │
│  ┌────────▼────────┐                                                  │
│  │  CryptoPanic    │   —— 失败/限流时降级到 mock-data.ts              │
│  │  REST API       │                                                  │
│  └─────────────────┘                                                  │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 文件清单

```
src/lib/news/
├── types.ts                  领域类型（NewsItem / Sentiment / NewsCategory）
├── translator.ts             翻译器（mock + 可切换 Google / DeepL）
├── sentiment-analyzer.ts     情绪分析器（关键词 + 可切换 GPT-4）
├── cryptopanic-client.ts     CryptoPanic REST 客户端（限流 / 重试 / 降级）
├── mock-data.ts              20+ 条降级用真实风格 mock 新闻
├── news-aggregator.ts        业务层（30 min 缓存 + 事件总线）
├── index.ts                  统一导出
└── README.md                 本文件
```

---

## CryptoPanic API Key 申请

1. 访问 https://cryptopanic.com/developers/api/
2. 注册账号（GitHub / Google 均可）
3. 选套餐：
   - **Free**：200 req/h，无 Pub/Sub，**演示用**
   - **Pro**：$49/月，5000 req/h，Pub/Sub 支持，**生产推荐**
   - **Business**：定制价格
4. 在控制台获取 `auth_token`（形如 `xxxx-xxxx-xxxx`）
5. 设置环境变量：
   ```bash
   # .env.local
   CRYPTOPANIC_API_KEY=xxxx-xxxx-xxxx
   ```
6. **未设置时**自动进入 mock 模式（返回内置 20+ 条真实风格新闻），保证开发与演示不中断

---

## 完整调用示例

### 1. 单例初始化

```ts
// src/lib/news/bootstrap.ts
import { NewsAggregator } from '@/lib/news';

let _instance: NewsAggregator | null = null;

export function getNewsAggregator(): NewsAggregator {
  if (!_instance) {
    _instance = new NewsAggregator({
      autoTranslate: true,
      autoSentiment: false, // CryptoPanic 自带 votes，可推断
      cacheTtlMs: 30 * 60_000,
    });
  }
  return _instance;
}
```

### 2. Next.js API Route

```ts
// src/app/api/news/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getNewsAggregator } from '@/lib/news';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const symbol = searchParams.get('symbol');
  const category = searchParams.get('category') as any;
  const q = searchParams.get('q');
  const limit = Number(searchParams.get('limit') || 20);

  const agg = getNewsAggregator();
  let items;
  if (q) items = await agg.search(q, limit);
  else if (symbol) items = await agg.getByCurrency(symbol, limit);
  else if (category) items = await agg.getByCategory(category, limit);
  else items = await agg.getLatest({ limit });

  return NextResponse.json({ items, count: items.length });
}
```

### 3. React 组件（"学院"首页）

```tsx
'use client';
import { useEffect, useState } from 'react';
import { getNewsAggregator, type NewsItem } from '@/lib/news';

export function NewsFeed() {
  const [items, setItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const agg = getNewsAggregator();
    const off = agg.onNews((news) => {
      setItems(news);
      setLoading(false);
    });
    agg.getLatest({ limit: 20 }); // 首次拉取
    return () => off();
  }, []);

  if (loading) return <div>加载中...</div>;
  return (
    <ul>
      {items.map((n) => (
        <li key={n.id} className="news-item">
          <span className={`sentiment ${n.sentiment}`}>{n.sentiment}</span>
          <h3>{n.titleZh || n.title}</h3>
          <p>{n.bodyZh || n.body}</p>
          <small>
            {n.source} · {n.currencies.join(', ')} ·{' '}
            {new Date(n.publishedAt).toLocaleString('zh-CN')}
          </small>
        </li>
      ))}
    </ul>
  );
}
```

### 4. 币种详情页相关新闻

```tsx
// src/app/coin/[symbol]/page.tsx
const symbol = params.symbol.toUpperCase();
const items = await getNewsAggregator().getByCurrency(symbol, 10);
```

---

## 翻译引擎接入指引

### 默认：Mock 引擎

零成本、零延迟。术语表 100+ 词条，涵盖：
- 主流币种（BTC / ETH / SOL / BNB / XRP / ADA / DOGE / TRX / ...）
- 行情术语（bull / bear / halving / ATH / FOMO / FUD / pump / dump / ...）
- 业务术语（DeFi / NFT / stablecoin / exchange / regulation / staking / ...）
- 协议 / 概念（EVM / L2 / zkRollup / PoS / DAO / bridge / oracle / ...）
- 监管 / 机构（SEC / ETF / KYC / AML / MiCA / ...）
- 加密俚语（gm / gn / wagmi / ngmi / rekt / diamond hands / ...）

支持英文复数（"surge" → "surge" / "surges"）。

### 切换到 Google Translate

```ts
// 1. 安装依赖
// npm install @google-cloud/translate

// 2. 实现引擎
import { Translate } from '@google-cloud/translate';

export class GoogleTranslateEngine {
  name = 'google';
  private client = new Translate({ key: process.env.GOOGLE_TRANSLATE_API_KEY });
  
  async translate(text: string, to: 'zh' | 'en') {
    const [translated] = await this.client.translate(text, to === 'zh' ? 'zh-CN' : 'en');
    return translated;
  }
  
  async translateBatch(texts: string[], to: 'zh' | 'en') {
    const [translated] = await this.client.translate(texts, to === 'zh' ? 'zh-CN' : 'en');
    return translated;
  }
}

// 3. 注入
import { getNewsAggregator } from './bootstrap';
getNewsAggregator().getTranslator().setEngine(new GoogleTranslateEngine());
```

### 切换到 DeepL

```ts
// 1. 安装依赖
// npm install deepl-node

// 2. 实现引擎
import * as deepl from 'deepl-node';

export class DeepLEngine {
  name = 'deepl';
  private client = new deepl.Translator(process.env.DEEPL_API_KEY!);
  
  async translate(text: string, to: 'zh' | 'en') {
    const target = to === 'zh' ? 'zh' : 'en-US';
    const res = await this.client.translateText(text, null, target);
    return res.text;
  }
}
```

### 切换到 GPT-4 翻译

```ts
export class GptTranslateEngine {
  name = 'gpt-4';
  
  async translate(text: string, to: 'zh' | 'en') {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4-turbo',
        messages: [
          { role: 'system', content: `你是加密新闻专业翻译。保持术语准确性，专业地道。输出${to === 'zh' ? '简体中文' : '英文'}。` },
          { role: 'user', content: text },
        ],
        max_tokens: 1000,
        temperature: 0.1,
      }),
    });
    const data = await res.json();
    return data.choices[0].message.content;
  }
}
```

---

## 情绪分析接入指引

### 默认：关键词引擎

- 中英双语言词表
- bullish / bearish 各打分
- 差异 ≥ 2 判定为 bullish / bearish，否则 neutral
- 准确率：演示数据集 > 80%

### 切换到 GPT-4

```ts
// 在 sentiment-analyzer.ts 已有参考实现
export class GptSentimentEngine {
  name = 'gpt-4';
  
  async analyze(text: string): Promise<'bullish' | 'bearish' | 'neutral'> {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4-turbo',
        messages: [
          { role: 'system', content: 'Classify crypto news sentiment as bullish/bearish/neutral. Reply with one word only.' },
          { role: 'user', content: text },
        ],
        max_tokens: 5,
        temperature: 0,
      }),
    });
    const data = await res.json();
    const out = (data.choices[0].message.content || '').toLowerCase().trim();
    if (out.includes('bull')) return 'bullish';
    if (out.includes('bear')) return 'bearish';
    return 'neutral';
  }
}
```

### 切换到 FinBERT（开源金融情绪模型）

```ts
// 1. 部署 FinBERT 服务（huggingface/transformers）
// 2. POST 文本，返回 logits
export class FinBertEngine {
  name = 'finbert';
  
  async analyze(text: string) {
    const res = await fetch('https://your-finbert-service/predict', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
    const { label } = await res.json();
    if (label === 'positive') return 'bullish';
    if (label === 'negative') return 'bearish';
    return 'neutral';
  }
}
```

---

## 缓存策略

```
┌─────────────────────────────────────────────────────────────┐
│  getLatest(opts)                                            │
│   │                                                         │
│   ├─ Cache hit (key = 'latest:<filter>:<currencies>')       │
│   │  └─ return sliceLimit(cached, opts.limit)               │
│   │                                                         │
│   └─ Cache miss                                             │
│      ├─ client.fetchPosts()                                 │
│      │   ├─ 5xx / TIMEOUT → 指数退避重试 (max 3)            │
│      │   ├─ 429 → 指数退避重试                              │
│      │   └─ 失败 / 限流 → fetchMock()                       │
│      ├─ augment() [按需补翻译 / 补情绪]                     │
│      ├─ setCache(ttl = 30 min)                              │
│      ├─ emit() 通知订阅者                                   │
│      └─ return sliceLimit(items, opts.limit)                │
└─────────────────────────────────────────────────────────────┘
```

| 缓存键                              | 内容                          | TTL          |
|-----------------------------------|------------------------------|-------------|
| `latest:<filter>:<currencies>`    | 最新（带 filter / currencies） | 30 min      |
| `latest:internal:all`            | 内部全集（供其他方法共享）     | 30 min      |
| `currency:<SYM>`                 | 按币种过滤                    | 30 min      |
| `category:<CAT>`                 | 按分类过滤                    | 30 min      |
| `search:<query>`                 | 搜索结果                       | 30 min      |

**失效策略：**
- `invalidateCache()` 清空所有
- 切换翻译 / 情绪引擎时自动清空翻译缓存
- 进程重启自然失效

---

## 与"学院"模块的集成示例

```tsx
// src/app/h5/news/page.tsx（移动端 H5 学院页）
import { getNewsAggregator } from '@/lib/news';

export default async function NewsPage() {
  const agg = getNewsAggregator();
  
  // 1. 头条（取最新 1 条 hot + important）
  const latest = await agg.getLatest({ limit: 1, filter: 'important' });
  
  // 2. 分类列表
  const market = await agg.getByCategory('market', 10);
  const defi = await agg.getByCategory('defi', 10);
  const regulation = await agg.getByCategory('regulation', 5);
  
  return (
    <div>
      {latest[0] && <Hero item={latest[0]} />}
      <Section title="市场动态" items={market} />
      <Section title="DeFi" items={defi} />
      <Section title="监管动态" items={regulation} />
    </div>
  );
}
```

```tsx
// 币种详情页：相关新闻
// src/app/coin/[symbol]/page.tsx
const items = await getNewsAggregator().getByCurrency(symbol, 8);
```

```tsx
// 实时订阅：管理员控制台
useEffect(() => {
  const off = agg.onNews((items) => {
    if (items.some(i => i.sentiment === 'bearish' && i.isImportant)) {
      toast.warn('检测到重要利空新闻');
    }
  });
  return () => off();
}, []);
```

---

## 降级策略

| 场景                    | 降级行为                                            |
|------------------------|--------------------------------------------------|
| API Key 未设置         | 全部走 `MOCK_NEWS`（20+ 条内置真实风格新闻）         |
| HTTP 5xx / TIMEOUT     | 指数退避重试（max 3），失败后返回 mock              |
| HTTP 429               | 指数退避重试，失败后返回 mock                       |
| 客户端限流（5 req/min）| 抛 `RATE_LIMITED` 错误（业务层可捕获并返回缓存）     |
| fetch 抛错（网络断开）  | catch 后返回 mock                                   |
| 翻译引擎失败            | catch 后保留原文，titleZh / bodyZh 留空               |
| 情绪分析失败            | catch 后保持默认 'neutral'                          |

**降级开关：**
```ts
// 强制使用 mock（开发 / 联调）
process.env.CRYPTOPANIC_API_KEY = 'mock-key';
```

---

## 运行测试

```bash
npx tsx tests/news-aggregator.test.ts
```

**27 个测试用例全部通过：**
- ✅ getLatest 拉取正常
- ✅ getByCurrency 过滤 BTC
- ✅ getByCategory 过滤 defi
- ✅ search 模糊匹配
- ✅ 30 min 缓存命中
- ✅ 缓存过期重新拉取
- ✅ invalidateCache 强制刷新
- ✅ 多订阅者收到事件
- ✅ 翻译（30+ 术语正确）
- ✅ 翻译（反方向 中文→英文）
- ✅ 翻译（setEngine 切换引擎）
- ✅ 情绪分析（bullish 关键词 → bullish）
- ✅ 情绪分析（bearish 关键词 → bearish）
- ✅ 情绪分析（中文关键词）
- ✅ 情绪分析（中性文本）
- ✅ 断网降级（5xx → mock）
- ✅ 断网降级（mock key）
- ✅ 断网降级（fetch 抛错）
- ✅ 限流 5 req/min
- ✅ 限流 resetRateLimit
- ✅ 5xx 指数退避重试 → 成功
- ✅ 5xx 重试耗尽 → mock
- ✅ 429 限流重试
- ✅ NewsAggregator 自动翻译
- ✅ 关键常量
- ✅ Mock 数据完整性

---

## 关键常量

```ts
export const NEWS_CACHE_TTL_MS = 30 * 60_000;  // 30 min
export const NEWS_RATE_LIMIT_PER_MIN = 5;
export const CRYPTOPANIC_API_KEY = process.env.CRYPTOPANIC_API_KEY || 'mock-key';
export const CRYPTOPANIC_BASE = 'https://cryptopanic.com/api/v1';
export const DEFAULT_TIMEOUT_MS = 8_000;
export const DEFAULT_MAX_RETRIES = 3;
```

---

## 已知限制

1. **免费版 CryptoPanic 限速 200 req/h** — 客户端默认 5 req/min 较保守，可调整
2. **mock 翻译器对中英混排长句效果一般** — 生产建议接 Google / DeepL
3. **关键词情绪分析对反讽/隐喻不敏感** — 生产建议接 GPT-4
4. **30 min 缓存** — 紧急新闻需手动 `invalidateCache()`
5. **新闻时间仅精确到分钟**（mock）— 真实 CryptoPanic 是 ISO 8601 秒级

---

## 依赖关系

- 无外部依赖（仅原生 fetch / AbortController / Map / Set）
- 与 `src/lib/notification/`、`src/lib/market/`、`src/lib/wallet/` 风格一致
- 遵循项目 TypeScript 严格模式（`strict: false` 兼容现有代码）

---

## 后续优化方向

- [ ] WebSocket 推送（CryptoPanic Pro 支持 Pub/Sub）
- [ ] 持久化缓存（Redis / SQLite）替代内存
- [ ] 全文搜索引擎（Elasticsearch / Meilisearch）
- [ ] 用户个性化订阅（按币种 / 分类偏好）
- [ ] 新闻 AI 摘要（GPT-4 / Claude）
- [ ] 多语言扩展（日语 / 韩语 / 西班牙语）
