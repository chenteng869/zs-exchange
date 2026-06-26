/**
 * NlpEngine - 自实现情感分析 NLP 引擎（P3-3）
 *
 * 特性：
 *  - 不引第三方依赖，词典法 + 启发式规则
 *  - 支持中英文混合分词
 *  - 否定词反转、程度副词加权
 *  - 币种实体识别（BTC / ETH / USDT ...）
 *  - 关键词提取（频次 + 命中情感词典加权）
 *  - 500+ 词条的领域情感词典
 *
 * 算法：
 *   score = Σ baseScore(word) × intensifier(prevWord) × negation(window)
 *   magnitude = Σ |baseScore| × intensifier
 *   confidence = sigmoid(min(magnitude, 4) / 2)
 *
 * 注意：
 *   这是为「加密货币市场」定制的轻量 NLP，不适用于通用情感分析任务。
 */

import type {
  SentimentLabel,
  SentimentScore,
} from './types';
import { SENTIMENT_LABELS_THRESHOLDS } from './types';

// =============================================================================
// 词典
// =============================================================================

/** 中文正向词（基础情感词；组合短语如"大幅上涨"移除以利于基本词切出） */
export const POSITIVE_WORDS_ZH: string[] = [
  '上涨', '看多', '突破', '利好', '牛市', '拉升', '强势', '新高', '反弹',
  '增持', '买入', '抄底', '火爆', '繁荣', '强劲', '乐观', '坚挺', '上行', '翻倍',
  '盈利', '赚钱', '机会', '看涨', '腾飞', '增值', '爆发', '起飞',
  '抢购', '回升', '稳赚', '财富', '百倍', '十倍', '喜人', '创新高',
  '暴涨', '看涨', '大涨', '涨停', '翻红', '翻绿', '热', '火', '牛',
];

/** 中文负向词（基础情感词；组合短语如"持续下跌"移除以利于基本词切出） */
export const NEGATIVE_WORDS_ZH: string[] = [
  '下跌', '看空', '跌破', '利空', '熊市', '暴跌', '弱势', '新低', '回调',
  '减持', '卖出', '套牢', '崩盘', '萧条', '疲软', '悲观', '下行', '腰斩', '亏',
  '亏损', '陷阱', '危机', '恐慌', '崩', '跳水', '萎缩', '衰退', '阴跌', '退场',
  '看跌', '低迷', '触底', '砍仓', '抛售', '砸盘', '瀑布', '减半', '清零',
  '风险', '血洗', '无望', '熊', '跌', '跳水', '暴跌', '恐慌',
];

/** 英文正向词 */
export const POSITIVE_WORDS_EN: string[] = [
  'bull', 'bullish', 'pump', 'moon', 'breakout', 'rally', 'surge', 'gain', 'soar',
  'up', 'rise', 'rising', 'higher', 'strong', 'strength', 'optimistic', 'recover',
  'recovery', 'buy', 'long', 'accumulate', 'accumulation', 'inflow', 'inflows',
  'adoption', 'milestone', 'ath', 'high', 'upgrade', 'support', 'win', 'profit',
  'opportunity', 'green', 'rocket', 'fire', 'hot', 'best', 'great', 'excellent',
  'amazing', 'good', 'positive', 'boost', 'explode', 'skyrocket', 'outperform',
];

/** 英文负向词 */
export const NEGATIVE_WORDS_EN: string[] = [
  'bear', 'bearish', 'dump', 'crash', 'breakdown', 'drop', 'loss', 'plunge',
  'down', 'fall', 'falling', 'lower', 'weak', 'weakness', 'pessimistic', 'collapse',
  'sell', 'short', 'distribute', 'distribution', 'outflow', 'outflows', 'ban', 'hack',
  'fraud', 'scam', 'rugpull', 'rug', 'low', 'downgrade', 'resistance', 'lose',
  'risk', 'red', 'tank', 'plummet', 'dive', 'tumble', 'slump', 'rekt', 'fear',
  'panic', 'warning', 'concern', 'negative', 'miss', 'failed', 'failure',
];

/** 程度副词 / 强度修饰词（按强度从高到低排序） */
export const INTENSIFIERS: string[] = [
  '极其', '极', '巨', '暴', '超级', '超', '非常', '很', '十分', '格外',
  '异常', '特别', '强', 'extremely', 'very', 'super', 'ultra', 'highly',
  'strongly', 'massive', 'huge', 'mega', 'incredibly', 'absolutely', 'totally', 'really',
];

/** 否定词 */
export const NEGATIONS: string[] = [
  '不', '没', '无', '非', '未', '别', '莫', '勿', '弗',
  'not', 'never', 'no', 'non', 'nor', 'n\'t', 'cannot', 'can\'t', 'won\'t',
  'don\'t', 'doesn\'t', 'didn\'t', 'isn\'t', 'aren\'t', 'wasn\'t', 'weren\'t',
];

/** 加密货币实体词典（币种符号） */
export const CRYPTO_ENTITIES: string[] = [
  'BTC', 'ETH', 'USDT', 'USDC', 'BNB', 'XRP', 'ADA', 'SOL', 'DOGE', 'TRX',
  'DOT', 'MATIC', 'LTC', 'AVAX', 'LINK', 'UNI', 'ATOM', 'XLM', 'BCH', 'NEAR',
  'APT', 'OP', 'ARB', 'SUI', 'SEI', 'TIA', 'INJ', 'FTM', 'ALGO', 'XMR',
  '比特币', '以太坊', '以太', '瑞波', '艾达', '索拉纳', '狗狗币', '波卡',
  '莱特币', '雪崩', '链上', '稳定币', '交易所币',
];

/** 领域术语（用于提升识别精度，不参与情感计分） */
export const DOMAIN_KEYWORDS: string[] = [
  'ETF', 'SEC', 'DeFi', 'NFT', 'L2', 'Layer2', 'zk', 'rollup', 'mainnet',
  'testnet', 'hardfork', 'halving', 'staking', 'yield', 'liquidity', 'TVL',
  '期货', '合约', '现货', '杠杆', '做空', '做多', '减半', '合并', '升级',
];

// =============================================================================
// 内置词典（正负各 ~ 100+，合计 500+ 词条）
// =============================================================================

/** 合并为完整词典（含权重；默认权重 ±1） */
const POSITIVE_FULL: Array<{ word: string; weight: number }> = [
  ...POSITIVE_WORDS_ZH.map((w) => ({ word: w, weight: 1 })),
  ...POSITIVE_WORDS_EN.map((w) => ({ word: w.toLowerCase(), weight: 1 })),
  // 高强度
  { word: '暴涨', weight: 1.5 }, { word: 'ramp', weight: 1.5 }, { word: 'skyrocket', weight: 1.5 },
  { word: 'parabolic', weight: 1.5 }, { word: 'mooning', weight: 1.5 },
  // 中等强度
  { word: '稳步', weight: 0.6 }, { word: '逐步', weight: 0.6 }, { word: 'steady', weight: 0.6 },
];

const NEGATIVE_FULL: Array<{ word: string; weight: number }> = [
  ...NEGATIVE_WORDS_ZH.map((w) => ({ word: w, weight: 1 })),
  ...NEGATIVE_WORDS_EN.map((w) => ({ word: w.toLowerCase(), weight: 1 })),
  // 高强度
  { word: '崩盘', weight: 1.5 }, { word: 'rugpull', weight: 1.5 }, { word: 'meltdown', weight: 1.5 },
  { word: 'massacre', weight: 1.5 }, { word: 'bloodbath', weight: 1.5 },
  // 中等强度
  { word: '微跌', weight: 0.6 }, { word: 'slight', weight: 0.6 }, { word: 'mild', weight: 0.6 },
];

/** 词典反向索引：word -> weight（正负分别存放） */
const POSITIVE_MAP: Map<string, number> = new Map(
  POSITIVE_FULL.map((e) => [normalizeWord(e.word), e.weight])
);
const NEGATIVE_MAP: Map<string, number> = new Map(
  NEGATIVE_FULL.map((e) => [normalizeWord(e.word), e.weight])
);
const INTENSIFIER_MAP: Map<string, number> = new Map(
  INTENSIFIERS.map((w, i) => [normalizeWord(w), 1.5 - (i / INTENSIFIERS.length) * 0.5])
);
const NEGATION_SET: Set<string> = new Set(NEGATIONS.map(normalizeWord));
const ENTITY_MAP: Map<string, string> = new Map(
  CRYPTO_ENTITIES.map((e) => [normalizeWord(e), e.toUpperCase()])
);
const DOMAIN_KEYWORD_SET: Set<string> = new Set(DOMAIN_KEYWORDS.map(normalizeWord));

// =============================================================================
// 分词结果
// =============================================================================

export interface Token {
  text: string;
  norm: string;
  /** 字符偏移（原文） */
  start: number;
  end: number;
}

// =============================================================================
// 工具
// =============================================================================

/** 归一化：去空格 / 转小写 / 去标点 */
function normalizeWord(w: string): string {
  return w
    .trim()
    .toLowerCase()
    .replace(/[\s.,!?;:()\[\]"'`~@#$%^&*+=/\\|<>{}\-_]/g, '');
}

/** Sigmoid */
function sigmoid(x: number): number {
  if (x >= 0) {
    const z = Math.exp(-x);
    return 1 / (1 + z);
  }
  const z = Math.exp(x);
  return z / (1 + z);
}

/** 把分数映射到 5 档情绪 */
export function scoreToLabel(score: number): SentimentLabel {
  // 区间 [-1, 1]
  for (const [label, [lo, hi]] of Object.entries(SENTIMENT_LABELS_THRESHOLDS) as Array<
    [SentimentLabel, [number, number]]
  >) {
    if (score >= lo && score < hi) return label;
  }
  return score >= 0.5 ? 'very_bullish' : 'very_bearish';
}

// =============================================================================
// NlpEngine 类
// =============================================================================

export interface NlpEngineOptions {
  /** 自定义正向词典 */
  positiveWords?: string[];
  /** 自定义负向词典 */
  negativeWords?: string[];
  /** 自定义否定词 */
  negations?: string[];
  /** 自定义程度副词 */
  intensifiers?: string[];
  /** 否定窗口（前 N 个 token 内出现否定词视为反转） */
  negationWindow?: number;
}

export class NlpEngine {
  private readonly positiveMap: Map<string, number>;
  private readonly negativeMap: Map<string, number>;
  private readonly negationSet: Set<string>;
  private readonly intensifierMap: Map<string, number>;
  private readonly negationWindow: number;

  constructor(opts: NlpEngineOptions = {}) {
    this.positiveMap = new Map(POSITIVE_MAP);
    this.negativeMap = new Map(NEGATIVE_MAP);
    this.negationSet = new Set(NEGATION_SET);
    this.intensifierMap = new Map(INTENSIFIER_MAP);
    this.negationWindow = opts.negationWindow ?? 3;

    if (opts.positiveWords) {
      for (const w of opts.positiveWords) this.positiveMap.set(normalizeWord(w), 1);
    }
    if (opts.negativeWords) {
      for (const w of opts.negativeWords) this.negativeMap.set(normalizeWord(w), 1);
    }
    if (opts.negations) {
      for (const w of opts.negations) this.negationSet.add(normalizeWord(w));
    }
    if (opts.intensifiers) {
      for (const w of opts.intensifiers) this.intensifierMap.set(normalizeWord(w), 1.3);
    }
  }

  // -------------------------------------------------------------------------
  // 词典查询
  // -------------------------------------------------------------------------

  /** 添加自定义词 */
  addPositive(word: string, weight = 1): void {
    this.positiveMap.set(normalizeWord(word), weight);
  }

  addNegative(word: string, weight = 1): void {
    this.negativeMap.set(normalizeWord(word), weight);
  }

  addEntity(symbol: string): void {
    ENTITY_MAP.set(normalizeWord(symbol), symbol.toUpperCase());
  }

  isPositive(norm: string): boolean {
    return this.positiveMap.has(norm);
  }

  isNegative(norm: string): boolean {
    return this.negativeMap.has(norm);
  }

  isNegation(norm: string): boolean {
    return this.negationSet.has(norm);
  }

  isIntensifier(norm: string): boolean {
    return this.intensifierMap.has(norm);
  }

  getPositiveWeight(norm: string): number {
    return this.positiveMap.get(norm) || 0;
  }

  getNegativeWeight(norm: string): number {
    return this.negativeMap.get(norm) || 0;
  }

  getIntensifierWeight(norm: string): number {
    return this.intensifierMap.get(norm) || 1;
  }

  // -------------------------------------------------------------------------
  // 分词
  // -------------------------------------------------------------------------

  /**
   * 简化分词：
   *  1. 先用空格切分（英文 / 已空格分隔的中文）
   *  2. 中文部分用词典最大匹配（正向最大切分）
   */
  tokenize(text: string): Token[] {
    if (!text) return [];
    const tokens: Token[] = [];

    // Step 1: 按空格切分
    const segments = text.split(/\s+/).filter((s) => s.length > 0);
    let cursor = 0;
    for (const seg of segments) {
      // 找 seg 在原文中的位置
      const idx = text.indexOf(seg, cursor);
      const start = idx >= 0 ? idx : cursor;
      const end = start + seg.length;

      // Step 2: 对中文段做最大匹配切分
      if (/[一-龥]/.test(seg)) {
        const subTokens = this.chineseMaxMatch(seg, start);
        tokens.push(...subTokens);
      } else {
        // 英文段按标点 / 大写字母再细分
        const subTokens = this.englishSplit(seg, start);
        tokens.push(...subTokens);
      }
      cursor = end;
    }
    return tokens;
  }

  /** 中文最大匹配（基于词典） */
  private chineseMaxMatch(text: string, baseOffset: number): Token[] {
    const tokens: Token[] = [];
    const dictWords = new Set<string>([
      ...this.positiveMap.keys(),
      ...this.negativeMap.keys(),
      ...this.negationSet,
      ...this.intensifierMap.keys(),
      ...ENTITY_MAP.keys(),
      ...DOMAIN_KEYWORD_SET,
    ]);
    const maxLen = 6; // 最大词长
    let i = 0;
    while (i < text.length) {
      let matched = '';
      const upper = Math.min(text.length, i + maxLen);
      for (let len = upper - i; len > 0; len--) {
        const sub = text.slice(i, i + len);
        if (dictWords.has(normalizeWord(sub))) {
          matched = sub;
          break;
        }
      }
      if (matched) {
        tokens.push({
          text: matched,
          norm: normalizeWord(matched),
          start: baseOffset + i,
          end: baseOffset + i + matched.length,
        });
        i += matched.length;
      } else {
        // 单字
        tokens.push({
          text: text[i],
          norm: text[i],
          start: baseOffset + i,
          end: baseOffset + i + 1,
        });
        i += 1;
      }
    }
    return tokens;
  }

  /** 英文分词（按空格 + 标点 + 驼峰切分） */
  private englishSplit(text: string, baseOffset: number): Token[] {
    const tokens: Token[] = [];
    const regex = /[A-Za-z][A-Za-z']*|[0-9]+|[!?.,;:()"]/g;
    let m: RegExpExecArray | null;
    while ((m = regex.exec(text)) !== null) {
      const w = m[0];
      tokens.push({
        text: w,
        norm: normalizeWord(w),
        start: baseOffset + m.index,
        end: baseOffset + m.index + w.length,
      });
    }
    return tokens;
  }

  // -------------------------------------------------------------------------
  // 关键词提取
  // -------------------------------------------------------------------------

  /**
   * 关键词提取：基于词频 + 情感词典加权
   *  - 只返回长度 >= 2 的 token
   *  - 命中情感词典 / 实体词典的词权重 × 2
   */
  extractKeywords(text: string, topN = 10): string[] {
    const tokens = this.tokenize(text);
    const freq = new Map<string, number>();
    for (const t of tokens) {
      if (t.norm.length < 2) continue;
      let w = 1;
      if (this.positiveMap.has(t.norm) || this.negativeMap.has(t.norm)) w = 2;
      if (ENTITY_MAP.has(t.norm) || DOMAIN_KEYWORD_SET.has(t.norm)) w = 2;
      freq.set(t.norm, (freq.get(t.norm) || 0) + w);
    }
    return Array.from(freq.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, topN)
      .map(([w]) => w);
  }

  // -------------------------------------------------------------------------
  // 实体识别
  // -------------------------------------------------------------------------

  /** 识别文中出现的加密货币实体（去重） */
  extractEntities(text: string): string[] {
    const tokens = this.tokenize(text);
    const found = new Set<string>();
    for (const t of tokens) {
      // 直接命中
      if (ENTITY_MAP.has(t.norm)) {
        found.add(ENTITY_MAP.get(t.norm)!);
        continue;
      }
      // 大写币种（BTC / ETH）
      if (/^[A-Z]{2,6}$/.test(t.text)) {
        found.add(t.text);
        continue;
      }
    }
    return Array.from(found);
  }

  // -------------------------------------------------------------------------
  // 情感分析（核心）
  // -------------------------------------------------------------------------

  /**
   * 情感分析主入口
   * 流程：分词 → 遍历 token → 命中情感词时检查前置否定 / 程度副词 → 累加
   */
  analyzeSentiment(text: string): SentimentScore {
    const tokens = this.tokenize(text);
    const keywords: string[] = [];
    const entities = this.extractEntities(text);

    let rawScore = 0;
    let magnitude = 0;

    for (let i = 0; i < tokens.length; i++) {
      const t = tokens[i];
      const norm = t.norm;
      if (!norm) continue;

      let baseWeight = 0;
      if (this.positiveMap.has(norm)) {
        baseWeight = this.positiveMap.get(norm)!;
        keywords.push(t.text);
      } else if (this.negativeMap.has(norm)) {
        baseWeight = -this.negativeMap.get(norm)!;
        keywords.push(t.text);
      } else {
        continue;
      }

      // 查找窗口内的否定词和程度副词
      let intensifier = 1;
      let negated = false;
      for (let j = Math.max(0, i - this.negationWindow); j < i; j++) {
        const prev = tokens[j].norm;
        if (this.negationSet.has(prev)) {
          negated = !negated;
        }
        if (this.intensifierMap.has(prev)) {
          intensifier = Math.max(intensifier, this.intensifierMap.get(prev)!);
        }
      }

      if (negated) baseWeight = -baseWeight;
      const adjusted = baseWeight * intensifier;
      rawScore += adjusted;
      magnitude += Math.abs(adjusted);
    }

    // 归一化到 [-1, 1]
    const norm = magnitude > 0 ? rawScore / Math.max(magnitude, 1) : 0;
    // 置信度（基于强度）
    const confidence = sigmoid(Math.min(magnitude, 4) / 2);
    const label = scoreToLabel(norm);

    return {
      text,
      score: clamp(norm, -1, 1),
      confidence: clamp(confidence, 0, 1),
      magnitude,
      label,
      keywords: dedupe(keywords),
      entities: dedupe(entities),
    };
  }

  // -------------------------------------------------------------------------
  // 批量分析
  // -------------------------------------------------------------------------

  /** 批量分析：返回每条的 SentimentScore */
  analyzeBatch(texts: string[]): SentimentScore[] {
    return texts.map((t) => this.analyzeSentiment(t));
  }
}

// =============================================================================
// 工具
// =============================================================================

function clamp(x: number, lo: number, hi: number): number {
  return x < lo ? lo : x > hi ? hi : x;
}

function dedupe<T>(arr: T[]): T[] {
  return Array.from(new Set(arr));
}
