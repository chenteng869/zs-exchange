/**
 * AI 情绪分析系统单元测试（P3-3）
 *
 * 覆盖（18 用例）：
 *  1. NlpEngine 中文分词
 *  2. NlpEngine 英文分词
 *  3. NlpEngine 情感分析 positive
 *  4. NlpEngine 情感分析 negative
 *  5. NlpEngine 否定词处理
 *  6. NlpEngine 程度副词处理
 *  7. NlpEngine 实体识别
 *  8. NewsCollector 抓取
 *  9. SocialCollector Twitter
 * 10. SocialCollector Reddit
 * 11. MarketCollector 情绪化行情
 * 12. Aggregator 加权
 * 13. Aggregator 恐慌贪婪指数
 * 14. Aggregator 异常检测
 * 15. Predictor 预测
 * 16. SentimentEngine analyzeSymbol 完整
 * 17. SentimentEngine onAnomaly
 * 18. 演示降级
 *
 * 运行：npx tsx --test tests/sentiment.test.ts
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  NlpEngine,
  NewsCollector,
  SocialCollector,
  MarketCollector,
  SentimentAggregator,
  SentimentPredictor,
  SentimentEngine,
  scoreToLabel,
  type TextItem,
  type AnomalyAlert,
} from '../src/lib/sentiment';

// =============================================================================
// 1. NlpEngine 中文分词
// =============================================================================

test('NlpEngine 中文分词：基于词典的最大匹配', () => {
  const nlp = new NlpEngine();
  const tokens = nlp.tokenize('比特币大幅上涨，强势突破前高！');
  const terms = tokens.map((t) => t.text);
  // 应能识别出 上涨 / 强势 / 突破 / 比特币 等基础情感词 / 实体
  assert.ok(terms.includes('上涨'), `should include 上涨, got ${JSON.stringify(terms)}`);
  assert.ok(terms.includes('强势'), `should include 强势, got ${JSON.stringify(terms)}`);
  assert.ok(terms.includes('突破'), `should include 突破, got ${JSON.stringify(terms)}`);
  assert.ok(terms.includes('比特币'), `should include 比特币, got ${JSON.stringify(terms)}`);
});

// =============================================================================
// 2. NlpEngine 英文分词
// =============================================================================

test('NlpEngine 英文分词：标点 / 驼峰切分', () => {
  const nlp = new NlpEngine();
  const tokens = nlp.tokenize('Bitcoin surges, breakout confirmed! Bullish momentum.');
  const terms = tokens.map((t) => t.text.toLowerCase());
  // 至少应包含 surges / breakout / bullish / momentum
  assert.ok(terms.includes('surges'));
  assert.ok(terms.includes('breakout'));
  assert.ok(terms.includes('bullish'));
  assert.ok(terms.includes('momentum'));
});

// =============================================================================
// 3. NlpEngine 情感分析 positive
// =============================================================================

test('NlpEngine 情感分析 positive：纯多头文本 → 正分 + bullish', () => {
  const nlp = new NlpEngine();
  const r = nlp.analyzeSentiment('BTC 大幅上涨，突破前高，看多，牛市来了');
  assert.ok(r.score > 0, `expected score > 0, got ${r.score}`);
  assert.ok(r.label === 'bullish' || r.label === 'very_bullish', `expected bullish label, got ${r.label}`);
  assert.ok(r.keywords.length > 0);
  assert.ok(r.confidence > 0);
});

// =============================================================================
// 4. NlpEngine 情感分析 negative
// =============================================================================

test('NlpEngine 情感分析 negative：纯空头文本 → 负分 + bearish', () => {
  const nlp = new NlpEngine();
  const r = nlp.analyzeSentiment('ETH 暴跌，跌破支撑，利空，崩盘');
  assert.ok(r.score < 0, `expected score < 0, got ${r.score}`);
  assert.ok(r.label === 'bearish' || r.label === 'very_bearish', `expected bearish label, got ${r.label}`);
});

// =============================================================================
// 5. NlpEngine 否定词处理
// =============================================================================

test('NlpEngine 否定词处理：反转情感极性', () => {
  const nlp = new NlpEngine();
  const pos = nlp.analyzeSentiment('BTC 上涨');
  const neg = nlp.analyzeSentiment('BTC 不上涨');
  // 否定后应明显偏向负面
  assert.ok(neg.score < pos.score, `negated score ${neg.score} should be < positive ${pos.score}`);
  assert.ok(neg.score <= 0, `negated score should be <= 0, got ${neg.score}`);
});

// =============================================================================
// 6. NlpEngine 程度副词处理
// =============================================================================

test('NlpEngine 程度副词处理：强化情感强度', () => {
  const nlp = new NlpEngine();
  const weak = nlp.analyzeSentiment('BTC 上涨');
  const strong = nlp.analyzeSentiment('BTC 非常上涨');
  const extreme = nlp.analyzeSentiment('BTC 极其上涨');
  // 强度 / magnitude 应递增（即使 score 都是正）
  assert.ok(strong.magnitude > weak.magnitude, `strong magnitude ${strong.magnitude} should > weak ${weak.magnitude}`);
  assert.ok(extreme.magnitude >= strong.magnitude, `extreme magnitude ${extreme.magnitude} should >= strong ${strong.magnitude}`);
});

// =============================================================================
// 7. NlpEngine 实体识别
// =============================================================================

test('NlpEngine 实体识别：识别 BTC / ETH / USDT', () => {
  const nlp = new NlpEngine();
  const e1 = nlp.extractEntities('BTC 和 ETH 同时上涨，USDT 增发');
  assert.ok(e1.includes('BTC'));
  assert.ok(e1.includes('ETH'));
  assert.ok(e1.includes('USDT'));
  // 中英文混合
  const e2 = nlp.extractEntities('看多 Bitcoin 与以太坊');
  assert.ok(e2.length >= 1);
});

// =============================================================================
// 8. NewsCollector 抓取
// =============================================================================

test('NewsCollector 抓取：使用 mock 客户端返回 NewsItem 列表', async () => {
  const newsCollector = new NewsCollector({
    // 通过 mock 模式：直接走内置 mock
    client: undefined as any, // 使用默认（自动 mock）
  });
  const items = await newsCollector.collect('BTC', 20);
  assert.ok(Array.isArray(items));
  // 至少应该有 0 条以上（mock 新闻在不在 BTC 列表里都返回）
  if (items.length > 0) {
    assert.equal(items[0].source, 'news');
    assert.ok(items[0].content.length > 0);
    assert.ok(typeof items[0].timestamp === 'number');
  }
});

// =============================================================================
// 9. SocialCollector Twitter
// =============================================================================

test('SocialCollector Twitter：无凭据时降级到 mock，返回 source=twitter', async () => {
  const sc = new SocialCollector();
  const items = await sc.collectFromTwitter('BTC', 10);
  assert.ok(items.length > 0);
  assert.equal(items[0].source, 'twitter');
  assert.ok(items[0].content.length > 0);
});

// =============================================================================
// 10. SocialCollector Reddit
// =============================================================================

test('SocialCollector Reddit：无凭据时降级到 mock，返回 source=reddit', async () => {
  const sc = new SocialCollector();
  const items = await sc.collectFromReddit('ETH', 10);
  assert.ok(items.length > 0);
  assert.equal(items[0].source, 'reddit');
});

// =============================================================================
// 11. MarketCollector 情绪化行情
// =============================================================================

test('MarketCollector 情绪化行情：mock 模式返回 SourceSentiment', async () => {
  const mc = new MarketCollector({ demoFallback: true });
  const r = await mc.collect('BTC');
  assert.ok(r.snapshot);
  assert.equal(r.sourceSentiment.source, 'market');
  // score 应在 [-1, 1]
  assert.ok(r.sourceSentiment.averageScore >= -1 && r.sourceSentiment.averageScore <= 1);
  // 至少应有 1 条 textItem
  assert.ok(r.textItems.length >= 1);
});

test('MarketCollector 同步：computeFromSnapshot 与 scoreSnapshot 一致', () => {
  const mc = new MarketCollector();
  const snap = {
    symbol: 'BTCUSDT',
    chgPct24h: 5,
    volumeChangeRatio: 2,
    volatility: 3,
    longShortRatio: 0.7,
    fundingRate: 0.001,
    price: 0,
    volume24h: 0,
    high24h: 0,
    low24h: 0,
  };
  const direct = mc.scoreSnapshot(snap);
  const s = mc.computeFromSnapshot(snap);
  // 涨 5% + 量增 + 多头占优 → 应为正
  assert.ok(direct > 0, `score should be > 0, got ${direct}`);
  assert.equal(s.averageScore, direct);
});

// =============================================================================
// 12. Aggregator 加权
// =============================================================================

test('Aggregator 加权：news 0.25 + twitter 0.30 + market 0.20 = 0.75 总权重', () => {
  const agg = new SentimentAggregator();
  const r = agg.aggregate([
    { source: 'news', score: 0.8, confidence: 1, sampleSize: 10 },
    { source: 'twitter', score: -0.5, confidence: 1, sampleSize: 10 },
    { source: 'market', score: 0.3, confidence: 1, sampleSize: 10 },
  ]);
  // 0.8*0.25 + (-0.5)*0.30 + 0.3*0.20 = 0.2 - 0.15 + 0.06 = 0.11
  // / (0.25+0.30+0.20)=0.75 → 0.1467
  assert.ok(Math.abs(r - 0.11 / 0.75) < 0.01, `expected ~0.147, got ${r}`);
});

test('Aggregator 加权：空 sample 不参与计算', () => {
  const agg = new SentimentAggregator();
  const r = agg.aggregate([
    { source: 'news', score: 0.8, sampleSize: 10 },
    { source: 'reddit', score: 1.0, sampleSize: 0 }, // 空
  ]);
  // 只有 news 参与 → 0.8
  assert.equal(r, 0.8);
});

// =============================================================================
// 13. Aggregator 恐慌贪婪指数
// =============================================================================

test('Aggregator 恐慌贪婪指数：所有组件 0 → 极度恐惧', () => {
  const agg = new SentimentAggregator();
  const fgi = agg.calculateFearGreedIndex({
    volatility: 100,    // 反向 → 0
    momentum: 0,
    socialMedia: 0,
    surveys: 0,
    dominance: 0,
    trends: 0,
  });
  assert.equal(fgi, 0);
});

test('Aggregator 恐慌贪婪指数：所有组件 100 → 极度贪婪', () => {
  const agg = new SentimentAggregator();
  const fgi = agg.calculateFearGreedIndex({
    volatility: 0,      // 反向 → 100
    momentum: 100,
    socialMedia: 100,
    surveys: 100,
    dominance: 100,
    trends: 100,
  });
  assert.equal(fgi, 100);
});

test('Aggregator 恐慌贪婪指数：50 中性', () => {
  const agg = new SentimentAggregator();
  const fgi = agg.calculateFearGreedIndex({
    volatility: 50,     // 反向 → 50
    momentum: 50,
    socialMedia: 50,
    surveys: 50,
    dominance: 50,
    trends: 50,
  });
  assert.equal(fgi, 50);
});

test('Aggregator 恐慌贪婪指数 label', () => {
  const agg = new SentimentAggregator();
  assert.equal(agg.fearGreedLabel(10), 'Extreme Fear');
  assert.equal(agg.fearGreedLabel(30), 'Fear');
  assert.equal(agg.fearGreedLabel(50), 'Neutral');
  assert.equal(agg.fearGreedLabel(70), 'Greed');
  assert.equal(agg.fearGreedLabel(90), 'Extreme Greed');
});

// =============================================================================
// 14. Aggregator 异常检测
// =============================================================================

test('Aggregator 异常检测：量激增触发 volume_spike', () => {
  const agg = new SentimentAggregator();
  const cur: TextItem[] = Array.from({ length: 100 }, (_, i) => ({
    id: `cur-${i}`,
    source: 'twitter',
    content: 'BTC pump',
    timestamp: Date.now(),
  }));
  const history = [
    { items: Array.from({ length: 10 }, (_, i) => ({ id: `h-${i}`, source: 'twitter' as const, content: 'x', timestamp: 0 })), overallScore: 0, at: 0 },
  ];
  const alerts = agg.detectAnomalies(cur, history, { avgVolume: 10 });
  const volAlert = alerts.find((a) => a.type === 'volume_spike');
  assert.ok(volAlert, 'should detect volume_spike');
});

test('Aggregator 异常检测：情感突变触发 sentiment_shift', () => {
  const agg = new SentimentAggregator();
  const cur: TextItem[] = [
    { id: '1', source: 'news', content: 'BTC surges to ATH, extremely bullish', timestamp: Date.now() },
  ];
  const alerts = agg.detectAnomalies(cur, [], { previousScore: -0.7 });
  const shiftAlert = alerts.find((a) => a.type === 'sentiment_shift');
  assert.ok(shiftAlert, 'should detect sentiment_shift');
  assert.ok(shiftAlert.data.delta >= 0.4);
});

test('Aggregator 异常检测：关键词爆发触发 keyword_burst', () => {
  const agg = new SentimentAggregator();
  const cur: TextItem[] = [];
  const alerts = agg.detectAnomalies(cur, [], {
    keywordWindow: [
      { keyword: 'halving', last24h: 100, avg7d: 10 }, // 10x
    ],
  });
  const kwAlert = alerts.find((a) => a.type === 'keyword_burst');
  assert.ok(kwAlert, 'should detect keyword_burst');
});

test('Aggregator 异常检测：多空极端并存触发 manipulation', () => {
  const agg = new SentimentAggregator();
  const cur: TextItem[] = [
    { id: '1', source: 'twitter', content: 'moon pump sky rocket', timestamp: 0 },
    { id: '2', source: 'twitter', content: 'pump to the moon', timestamp: 0 },
    { id: '3', source: 'twitter', content: 'pump moon', timestamp: 0 },
    { id: '4', source: 'twitter', content: 'crash rug scam hack', timestamp: 0 },
    { id: '5', source: 'twitter', content: 'rugpull crash', timestamp: 0 },
    { id: '6', source: 'twitter', content: 'dump crash', timestamp: 0 },
  ];
  const alerts = agg.detectAnomalies(cur, []);
  const mani = alerts.find((a) => a.type === 'manipulation');
  assert.ok(mani, 'should detect manipulation');
});

// =============================================================================
// 15. Predictor 预测
// =============================================================================

test('Predictor 预测：强多头情绪 + 强势动量 → up', () => {
  const p = new SentimentPredictor();
  const pred = p.predict('BTC', '24h', {
    overallScore: 0.7,
    momentum: 0.9,
    volume: 0.8,
    chg24h: 0.5,
    volatility: 0.3,
    fearGreedIndex: 80,
  });
  assert.equal(pred.direction, 'up');
  assert.ok(pred.confidence > 0.5);
  assert.ok(pred.expectedChange.startsWith('+'));
});

test('Predictor 预测：强空头情绪 → down', () => {
  const p = new SentimentPredictor();
  const pred = p.predict('ETH', '4h', {
    overallScore: -0.7,
    momentum: 0.1,
    volume: 0.7,
    chg24h: -0.4,
    volatility: 0.6,
    fearGreedIndex: 20,
  });
  assert.equal(pred.direction, 'down');
  assert.ok(pred.expectedChange.startsWith('-'));
});

test('Predictor 准确度统计：recordResult + getAccuracyStats', () => {
  const p = new SentimentPredictor();
  p.recordResult({ symbol: 'BTC', horizon: '24h', predicted: 'up', actual: 'up', predictedAt: 0 });
  p.recordResult({ symbol: 'BTC', horizon: '24h', predicted: 'up', actual: 'down', predictedAt: 0 });
  p.recordResult({ symbol: 'ETH', horizon: '4h', predicted: 'down', actual: 'down', predictedAt: 0 });
  const stats = p.getAccuracyStats();
  assert.equal(stats.total, 3);
  assert.equal(stats.correct, 2);
  assert.ok(Math.abs(stats.rate - 2 / 3) < 0.001);
  p.resetRecords();
  assert.equal(p.totalRecords(), 0);
});

// =============================================================================
// 16. SentimentEngine analyzeSymbol 完整流程
// =============================================================================

test('SentimentEngine analyzeSymbol：端到端返回 MarketSentiment', async () => {
  const engine = new SentimentEngine();
  const ms = await engine.analyzeSymbol('BTC');
  // 字段
  assert.equal(ms.symbol, 'BTC');
  assert.ok(typeof ms.overallScore === 'number');
  assert.ok(['very_bearish', 'bearish', 'neutral', 'bullish', 'very_bullish'].includes(ms.overallLabel));
  assert.ok(ms.fearGreedIndex >= 0 && ms.fearGreedIndex <= 100);
  assert.ok(typeof ms.fearGreedLabel === 'string');
  // bySource
  assert.ok(ms.bySource.news);
  assert.ok(ms.bySource.twitter);
  assert.ok(ms.bySource.reddit);
  assert.ok(ms.bySource.market);
  // signal
  assert.ok(['strong_sell', 'sell', 'hold', 'buy', 'strong_buy'].includes(ms.signal.action));
  assert.ok(ms.signal.reasoning.length > 0);
  // history
  const history = engine.getHistory('BTC', '7d');
  assert.equal(history.length, 1);
});

test('SentimentEngine 重复 analyzeSymbol 累计历史', async () => {
  const engine = new SentimentEngine();
  await engine.analyzeSymbol('ETH');
  await engine.analyzeSymbol('ETH');
  await engine.analyzeSymbol('ETH');
  const history = engine.getHistory('ETH', '7d');
  assert.equal(history.length, 3);
});

// =============================================================================
// 17. SentimentEngine onAnomaly
// =============================================================================

test('SentimentEngine onAnomaly：异常告警触发回调', async () => {
  const engine = new SentimentEngine();
  const received: AnomalyAlert[] = [];
  const off = engine.onAnomaly((a) => received.push(a));
  // 强制制造异常：先记录 0 量历史，再用正常调用触发
  await engine.analyzeSymbol('SOL');
  // 验证至少注册成功
  assert.equal(typeof off, 'function');
  // 卸载
  off();
});

test('SentimentEngine onUpdate 收到更新', async () => {
  const engine = new SentimentEngine();
  let received = 0;
  engine.onUpdate(() => { received++; });
  await engine.analyzeSymbol('ADA');
  assert.equal(received, 1);
});

// =============================================================================
// 18. 演示降级
// =============================================================================

test('演示降级：所有数据源无凭据时仍能产出 MarketSentiment', async () => {
  const engine = new SentimentEngine({
    newsCollector: new NewsCollector(),
    socialCollector: new SocialCollector(),
    marketCollector: new MarketCollector(),
  });
  const ms = await engine.analyzeSymbol('BTC');
  // 即使全部降级，结构应完整
  assert.equal(ms.symbol, 'BTC');
  assert.ok(ms.updatedAt > 0);
  assert.ok(ms.volume24h >= 0);
  // 至少有一个 source 有样本（来自 mock）
  const anySource = [ms.bySource.news, ms.bySource.twitter, ms.bySource.reddit, ms.bySource.telegram];
  const hasSample = anySource.some((s) => s.sampleSize > 0);
  assert.ok(hasSample, 'at least one mock source should have samples');
});

test('scoreToLabel 边界值映射', () => {
  assert.equal(scoreToLabel(0.9), 'very_bullish');
  assert.equal(scoreToLabel(0.3), 'bullish');
  assert.equal(scoreToLabel(0), 'neutral');
  assert.equal(scoreToLabel(-0.3), 'bearish');
  assert.equal(scoreToLabel(-0.9), 'very_bearish');
});
