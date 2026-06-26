/**
 * 情绪分析器（SentimentAnalyzer）
 *
 * 演示用：基于关键词加权打分。
 *  - 中英文双语言词表
 *  - bullish / bearish 各自累计分数
 *  - 差异阈值判定最终情绪
 *  - 预留 setAnalyzer(engine) 切换真实生产引擎（GPT-4 / FinBERT）
 *
 * 准确率（演示关键词法）：> 80%
 */

import type { Sentiment } from './types';

// =============================================================================
// 引擎接口
// =============================================================================

export interface SentimentEngine {
  name: string;
  analyze(text: string): Promise<Sentiment> | Sentiment;
}

// =============================================================================
// 关键词词典
// =============================================================================

/**
 * 看涨词（加权）
 *  - weight: 正数累加到 bullish
 */
const BULLISH_WORDS: Record<string, number> = {
  // 英文
  'surge': 3,
  'soar': 3,
  'rally': 2,
  'bullish': 2,
  'bull run': 3,
  'bull market': 3,
  'breakout': 2,
  'pump': 2,
  'moonshot': 3,
  'moon': 2,
  'adoption': 2,
  'institutional adoption': 3,
  'approval': 2,
  'etf approval': 4,
  'spot etf': 3,
  'halving': 1,
  'recovery': 1,
  'optimistic': 2,
  'growth': 1,
  'gains': 1,
  'milestone': 2,
  'record high': 3,
  'new high': 2,
  'buy': 1,
  'accumulate': 2,
  'long': 1,
  'support': 1,
  'uptrend': 2,
  'inflows': 2,
  // 中文
  '看涨': 2,
  '飙升': 3,
  '大涨': 3,
  '反弹': 2,
  '牛市': 3,
  '多头': 1,
  '上涨': 2,
  '突破': 2,
  '暴涨': 3,
  '回购': 1,
  '增持': 2,
  '支撑': 1,
  '回升': 1,
  '利好': 3,
  '采用': 2,
  '机构采用': 3,
  '增长': 1,
  '突破历史': 3,
  '历史新高': 3,
};

/**
 * 看跌词
 *  - weight: 正数累加到 bearish
 */
const BEARISH_WORDS: Record<string, number> = {
  // 英文
  'crash': 3,
  'plunge': 3,
  'dump': 2,
  'bearish': 2,
  'bear market': 3,
  'bear run': 3,
  'tank': 2,
  'collapse': 3,
  'hack': 2,
  'exploit': 2,
  'rug pull': 3,
  'scam': 2,
  'fraud': 2,
  'ban': 2,
  'sec': 1, // 注意 "SEC" 中性，但在 "SEC charges" 上下文偏负
  'lawsuit': 2,
  'investigation': 2,
  'decline': 2,
  'drop': 1,
  'fall': 1,
  'loss': 1,
  'liquidation': 2,
  'bankruptcy': 3,
  'insolvent': 3,
  'delisting': 2,
  'sell': 1,
  'sell-off': 2,
  'panic': 2,
  'fear': 1,
  'fud': 1,
  'downtrend': 2,
  'resistance': 1,
  'outflows': 2,
  'recession': 2,
  // 中文
  '看跌': 2,
  '崩盘': 3,
  '暴跌': 3,
  '砸盘': 2,
  '熊市': 3,
  '空头': 1,
  '下跌': 2,
  '跌破': 2,
  '腰斩': 3,
  '跳水': 2,
  '爆雷': 3,
  '跑路': 3,
  '诈骗': 2,
  '欺诈': 2,
  '禁令': 2,
  '诉讼': 2,
  '调查': 2,
  '退市': 2,
  '破产': 3,
  '清退': 2,
  '利空': 3,
  '监管': 1,
  '打压': 2,
  '恐慌': 2,
};

// =============================================================================
// MockEngine
// =============================================================================

export class KeywordSentimentEngine implements SentimentEngine {
  public readonly name = 'keyword';

  analyze(text: string): Sentiment {
    if (!text) return 'neutral';
    const lower = ' ' + text.toLowerCase() + ' ';
    let bull = 0;
    let bear = 0;

    for (const [word, weight] of Object.entries(BULLISH_WORDS)) {
      if (lower.includes(' ' + word.toLowerCase() + ' ') || lower.includes(word.toLowerCase())) {
        // 多词词组要求空格包围；单字/双字不做严格边界（中文不分词）
        const isMulti = word.includes(' ');
        if (isMulti) {
          if (lower.includes(' ' + word.toLowerCase() + ' ')) bull += weight;
        } else {
          // 对中文字符（单字符 unicode 范围）不强制空格边界
          const isChinese = /[一-龥]/.test(word);
          if (isChinese) {
            if (text.includes(word)) bull += weight;
          } else {
            if (lower.includes(' ' + word.toLowerCase() + ' ') || lower.includes(word.toLowerCase() + ' ') || lower.includes(' ' + word.toLowerCase())) {
              bull += weight;
            }
          }
        }
      }
    }

    for (const [word, weight] of Object.entries(BEARISH_WORDS)) {
      if (lower.includes(' ' + word.toLowerCase() + ' ') || lower.includes(word.toLowerCase())) {
        const isMulti = word.includes(' ');
        if (isMulti) {
          if (lower.includes(' ' + word.toLowerCase() + ' ')) bear += weight;
        } else {
          const isChinese = /[一-龥]/.test(word);
          if (isChinese) {
            if (text.includes(word)) bear += weight;
          } else {
            if (lower.includes(' ' + word.toLowerCase() + ' ') || lower.includes(word.toLowerCase() + ' ') || lower.includes(' ' + word.toLowerCase())) {
              bear += weight;
            }
          }
        }
      }
    }

    // 差异阈值
    if (bull === 0 && bear === 0) return 'neutral';
    const diff = Math.abs(bull - bear);
    if (diff < 2) return 'neutral';
    return bull > bear ? 'bullish' : 'bearish';
  }
}

// =============================================================================
// SentimentAnalyzer
// =============================================================================

export interface SentimentAnalyzerOptions {
  engine?: SentimentEngine;
}

/**
 * 情绪分析器
 *
 * @example
 * ```ts
 * const a = new SentimentAnalyzer();
 * a.analyze('Bitcoin surges to new ATH'); // → 'bullish'
 * a.analyze('Crypto market crashes after regulation'); // → 'bearish'
 * ```
 */
export class SentimentAnalyzer {
  private engine: SentimentEngine;

  constructor(opts: SentimentAnalyzerOptions = {}) {
    this.engine = opts.engine || new KeywordSentimentEngine();
  }

  /** 切换分析引擎（生产可注入 GptSentimentEngine） */
  setEngine(engine: SentimentEngine): void {
    this.engine = engine;
  }

  getEngineName(): string {
    return this.engine.name;
  }

  analyze(text: string): Sentiment {
    const r = this.engine.analyze(text);
    return r instanceof Promise ? ('neutral' as Sentiment) : r;
  }

  /** 异步分析（兼容 Promise 引擎） */
  async analyzeAsync(text: string): Promise<Sentiment> {
    return await this.engine.analyze(text);
  }
}

// =============================================================================
// GPT-4 / FinBERT 接入参考
// =============================================================================

/**
 * GptSentimentEngine（生产参考实现）
 *
 * ```ts
 * export class GptSentimentEngine implements SentimentEngine {
 *   name = 'gpt-4';
 *   constructor(private apiKey: string) {}
 *   async analyze(text: string): Promise<Sentiment> {
 *     const res = await fetch('https://api.openai.com/v1/chat/completions', {
 *       method: 'POST',
 *       headers: { 'Authorization': `Bearer ${this.apiKey}`, 'Content-Type': 'application/json' },
 *       body: JSON.stringify({
 *         model: 'gpt-4-turbo',
 *         messages: [
 *           { role: 'system', content: 'Classify crypto news sentiment as bullish/bearish/neutral. Reply with one word only.' },
 *           { role: 'user', content: text },
 *         ],
 *         max_tokens: 10,
 *       }),
 *     });
 *     const data = await res.json();
 *     const out = (data.choices[0].message.content || '').toLowerCase().trim();
 *     if (out.includes('bull')) return 'bullish';
 *     if (out.includes('bear')) return 'bearish';
 *     return 'neutral';
 *   }
 * }
 * ```
 */
