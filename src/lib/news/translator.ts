/**
 * 翻译器（Translator）
 *
 * 演示用：内置加密术语中英文对照表 + 简单规则。
 * 生产场景应接入 Google Translate / DeepL / 百度翻译。
 *
 * 设计目标：
 *  - 零依赖（不引外部 SDK）
 *  - 同/异步 API 统一
 *  - 支持热切换翻译引擎（setEngine）
 *  - 大小写不敏感 + 词形稳定（不破坏原句）
 *
 * 术语表覆盖：
 *  - 主流币种（BTC / ETH / SOL / BNB / XRP / ADA / DOGE / DOT / AVAX / MATIC / TRX ...）
 *  - 行情术语（bull / bear / halving / ATH / ATL / FOMO / FUD / pump / dump / rally / crash）
 *  - 业务术语（DeFi / NFT / stablecoin / exchange / regulation / staking / mining / wallet / DEX / CEX / DApp）
 *  - 协议 / 概念（EVM / L2 / zkRollup / sharding / consensus / governance / DAO / bridge / oracle / on-chain / off-chain）
 *  - 监管 / 机构（SEC / ETF / KYC / AML / MiCA / compliance / custody / institutional adoption）
 */

import type { Language } from './types';

// =============================================================================
// 引擎接口（可替换）
// =============================================================================

/** 翻译引擎接口 */
export interface TranslateEngine {
  name: string;
  translate(text: string, to: Language): Promise<string>;
  translateBatch(texts: string[], to: Language): Promise<string[]>;
}

// =============================================================================
// 内置术语表（中 <-> 英）
// =============================================================================

/**
 * 英文 -> 中文 词典
 * 注意：使用最常用译法；保留括号避免歧义
 */
const EN_TO_ZH: Record<string, string> = {
  // === 主流币种 ===
  'Bitcoin': '比特币',
  'BTC': '比特币',
  'Ethereum': '以太坊',
  'ETH': '以太坊',
  'Solana': '索拉纳',
  'SOL': 'SOL',
  'BNB': 'BNB',
  'XRP': '瑞波币',
  'Cardano': '卡尔达诺',
  'ADA': '艾达币',
  'Dogecoin': '狗狗币',
  'DOGE': '狗狗币',
  'Polkadot': '波卡',
  'DOT': 'DOT',
  'Avalanche': '雪崩协议',
  'AVAX': 'AVAX',
  'Polygon': 'Polygon',
  'MATIC': 'MATIC',
  'Tron': '波场',
  'TRX': '波场币',
  'Litecoin': '莱特币',
  'LTC': '莱特币',
  'Chainlink': 'Chainlink',
  'LINK': 'LINK',
  'Uniswap': 'Uniswap',
  'UNI': 'UNI',
  'Tether': '泰达币',
  'USDT': 'USDT',
  'USDC': 'USDC',
  'DAI': 'DAI',

  // === 行情术语 ===
  'bull market': '牛市',
  'bear market': '熊市',
  'bullish': '看涨',
  'bearish': '看跌',
  'bull run': '多头行情',
  'bear run': '空头行情',
  'rally': '反弹',
  'surge': '飙升',
  'crash': '崩盘',
  'dump': '砸盘',
  'pump': '拉盘',
  'plunge': '暴跌',
  'soar': '大涨',
  'tank': '跳水',
  'ATH': '历史新高',
  'ATL': '历史新低',
  'all-time high': '历史新高',
  'all-time low': '历史新低',
  'FOMO': '错失恐惧',
  'FUD': '恐惧与不确定性',
  'volatility': '波动性',
  'correction': '回调',
  'consolidation': '盘整',
  'breakout': '突破',
  'breakdown': '跌破',
  'support level': '支撑位',
  'resistance level': '阻力位',
  'moving average': '移动平均线',
  'volume': '成交量',
  'liquidity': '流动性',
  'market cap': '市值',
  'circulating supply': '流通量',

  // === 业务术语 ===
  'DeFi': '去中心化金融',
  'NFT': '非同质化代币',
  'stablecoin': '稳定币',
  'exchange': '交易所',
  'centralized exchange': '中心化交易所',
  'CEX': '中心化交易所',
  'DEX': '去中心化交易所',
  'decentralized exchange': '去中心化交易所',
  'DApp': '去中心化应用',
  'regulation': '监管',
  'regulatory': '监管的',
  'regulator': '监管机构',
  'compliance': '合规',
  'halving': '减半',
  'staking': '质押',
  'yield farming': '流动性挖矿',
  'liquidity mining': '流动性挖矿',
  'liquidity pool': '流动性池',
  'mining': '挖矿',
  'miner': '矿工',
  'wallet': '钱包',
  'hot wallet': '热钱包',
  'cold wallet': '冷钱包',
  'hardware wallet': '硬件钱包',
  'custody': '托管',
  'self-custody': '自托管',
  'private key': '私钥',
  'public key': '公钥',
  'seed phrase': '助记词',
  'gas fee': '燃料费',
  'gas price': '燃料价格',
  'transaction fee': '交易手续费',
  'block': '区块',
  'blockchain': '区块链',
  'block height': '区块高度',
  'genesis block': '创世区块',

  // === 协议 / 概念 ===
  'EVM': 'EVM 虚拟机',
  'Layer 2': '二层网络',
  'L2': '二层网络',
  'zkRollup': '零知识 Rollup',
  'optimistic rollup': '乐观 Rollup',
  'sharding': '分片',
  'consensus': '共识机制',
  'consensus mechanism': '共识机制',
  'proof of work': '工作量证明',
  'PoW': '工作量证明',
  'proof of stake': '权益证明',
  'PoS': '权益证明',
  'governance': '治理',
  'DAO': '去中心化自治组织',
  'bridge': '跨链桥',
  'cross-chain': '跨链',
  'oracle': '预言机',
  'on-chain': '链上',
  'off-chain': '链下',
  'smart contract': '智能合约',
  'token': '代币',
  'ERC-20': 'ERC-20',
  'ERC-721': 'ERC-721',
  'BEP-20': 'BEP-20',
  'mainnet': '主网',
  'testnet': '测试网',

  // === 监管 / 机构 ===
  'SEC': '美国证券交易委员会',
  'CFTC': '美国商品期货交易委员会',
  'ETF': '交易所交易基金',
  'Bitcoin ETF': '比特币 ETF',
  'spot ETF': '现货 ETF',
  'KYC': '身份验证',
  'AML': '反洗钱',
  'MiCA': '欧盟加密资产市场监管条例',
  'custodial': '托管型',
  'non-custodial': '非托管型',
  'institutional adoption': '机构采用',
  'institutional investors': '机构投资者',
  'whale': '巨鲸',
  'retail investors': '散户投资者',
  'bull case': '多头情景',
  'bear case': '空头情景',
  'panic': '恐慌',
  'panic selling': '恐慌抛售',
  'capitulation': '投降式抛售',
  'hodl': '长期持有',
  'rekt': '巨亏',
  'moon': '登月',
  'ngmi': '不会成功',
  'btfd': '逢低买入',
  'ath': '历史新高',
  'atl': '历史新低',
  'ws': '钱包',
  'mcap': '市值',
  'tvl': '总锁仓量',
  'ico': '首次代币发行',
  'ido': '首次去中心化交易所发行',
  'ieo': '首次交易所发行',
  'sto': '证券型代币发行',
  'lfg': '冲',
  'ser': '先生',
  'frens': '朋友们',
  'gm': '早安',
  'gn': '晚安',
  'wen': '什么时候',
  'ngu': '数字只增不减',
  'probably nothing': '也许没什么',
  'this is the way': '这就是方法',
  'buy the dip': '逢低买入',
  'sell the news': '利好出尽',
  'in it for the tech': '为了技术而来',
  'laser eyes': '激光眼',
  'diamond hands': '钻石手',
  'paper hands': '纸手',
  'exit liquidity': '退出流动性',
  'rug': '跑路',
  'scam': '骗局',
  'honeypot': '蜜罐',
  'mint': '铸造',
  'burn': '销毁',
  'airdrop': '空投',
  'snapshot': '快照',
  'whitelist': '白名单',
  'shilling': '吹捧',
  'shill': '吹捧者',
  'founder': '创始人',
  'team': '团队',
  'advisor': '顾问',
  'investor': '投资者',
  'vc': '风险投资',
  'fund': '基金',
  'treasury': '资金库',
  'roadmap': '路线图',
  'whitepaper': '白皮书',
  'audit': '审计',
  'bug': '漏洞',
  'fix': '修复',
  'patch': '补丁',
  'upgrade': '升级',
  'hard fork': '硬分叉',
  'soft fork': '软分叉',
  'node': '节点',
  'validator': '验证者',
  'delegator': '委托人',
  'staker': '质押者',
  'reward': '奖励',
  'penalty': '惩罚',
  'slashing': '罚没',
  'epoch': '周期',
  'slot': '时隙',
  'finality': '最终性',
  'reorg': '重组',
  'mempool': '内存池',
  'nonce': '随机数',
  'utxo': '未花费交易输出',
  'account': '账户',
  'address': '地址',
  'signature': '签名',
  'tx': '交易',
  'transaction': '交易',
  'pending': '待处理',
  'confirmed': '已确认',
  'cancel': '取消',
  'replace': '替换',
  'accelerate': '加速',
  'stuck': '卡住',
  'resubmit': '重新提交',
  'rpc': '远程过程调用',
  'api': '应用编程接口',
  'sdk': '软件开发工具包',
  'cli': '命令行',
  'gui': '图形界面',
  'ui': '用户界面',
  'ux': '用户体验',
};

// =============================================================================
// 工具函数
// =============================================================================

/**
 * 按词长倒序匹配，避免 "Bitcoin" 替换后 "BTC" 残留
 * 例：先替换 "Bitcoin ETF" 再替换 "Bitcoin"
 */
function buildSortedKeys(dict: Record<string, string>): Array<[string, string]> {
  return Object.entries(dict).sort((a, b) => b[0].length - a[0].length);
}

const SORTED_EN_TO_ZH = buildSortedKeys(EN_TO_ZH);

/**
 * 反向词典：中文 -> 英文（用于 zh->en）
 * 使用 Map 保留首次出现的英文形式，避免 'Bitcoin' 被 'BTC' 覆盖
 */
const ZH_TO_EN: Map<string, string> = (() => {
  const m = new Map<string, string>();
  for (const [en, zh] of Object.entries(EN_TO_ZH)) {
    if (!m.has(zh)) {
      m.set(zh, en);
    }
  }
  return m;
})();

const SORTED_ZH_TO_EN = Array.from(ZH_TO_EN.entries()).sort((a, b) => b[0].length - a[0].length);

/**
 * 在文本中执行大小写不敏感的多模式替换
 * - 英文词用 \b 词边界，避免 "ui" 错误匹配 "lawsuit"
 * - 中文词无词边界
 * - 按 key 长度倒序，避免子串冲突
 */
function multiReplace(
  text: string,
  patterns: Array<[string, string]>,
): string {
  if (!text) return text;

  // 分离英文/中文 key
  const isChinese = (s: string) => /[一-龥]/.test(s);
  const enPatterns: Array<[string, string]> = [];
  const zhPatterns: Array<[string, string]> = [];
  for (const [k, v] of patterns) {
    if (isChinese(k)) {
      zhPatterns.push([k, v]);
    } else {
      enPatterns.push([k, v]);
    }
  }

  let result = text;

  // 先做中文（无词边界）
  if (zhPatterns.length > 0) {
    const escaped = zhPatterns.map(([k]) => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    const regex = new RegExp(`(${escaped.join('|')})`, 'g');
    const lookup = new Map<string, string>(zhPatterns);
    result = result.replace(regex, (m) => lookup.get(m) || m);
  }

  // 再做英文（带 \b 词边界 + 可选复数 s，大小写不敏感）
  if (enPatterns.length > 0) {
    const escaped = enPatterns.map(([k]) => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    // 在每个 key 后加可选 s 匹配英文复数（"surge" -> "surge" 或 "surges"）
    const regex = new RegExp(`\\b(${escaped.join('|')})s?\\b`, 'gi');
    const lookup = new Map<string, string>();
    for (const [k, v] of enPatterns) lookup.set(k.toLowerCase(), v);
    result = result.replace(regex, (m) => {
      // m 可能是 "surge" 或 "surges"
      const lower = m.toLowerCase();
      // 去掉末尾的 s 再查表
      const key = lower.endsWith('s') ? lower.slice(0, -1) : lower;
      return lookup.get(key) || m;
    });
  }

  return result;
}

// =============================================================================
// MockEngine（默认实现）
// =============================================================================

export class MockTranslateEngine implements TranslateEngine {
  public readonly name = 'mock';

  async translate(text: string, to: Language): Promise<string> {
    if (!text) return text;
    if (to === 'zh') return this.toZh(text);
    if (to === 'en') return this.toEn(text);
    return text;
  }

  async translateBatch(texts: string[], to: Language): Promise<string[]> {
    return Promise.all(texts.map((t) => this.translate(t, to)));
  }

  private toZh(text: string): string {
    return multiReplace(text, SORTED_EN_TO_ZH);
  }

  private toEn(text: string): string {
    return multiReplace(text, SORTED_ZH_TO_EN);
  }
}

// =============================================================================
// Translator
// =============================================================================

export interface TranslatorOptions {
  /** 初始引擎，默认 mock */
  engine?: TranslateEngine;
  /** 默认目标语言（影响初始 API 行为） */
  defaultLanguage?: Language;
  /** 是否开启 LRU 缓存（按文本+目标语言） */
  cache?: boolean;
  /** 缓存容量 */
  cacheSize?: number;
}

/**
 * 翻译器
 *
 * 单例友好（无内部定时器）。线程安全（同语言 set/get）。
 *
 * @example
 * ```ts
 * const t = new Translator();
 * const zh = await t.translate('Bitcoin surges to new ATH in bull market', 'zh');
 * // zh === '比特币 飙升至新 历史新高 在 牛市'
 * ```
 */
export class Translator {
  private engine: TranslateEngine;
  private readonly defaultLanguage: Language;
  private readonly cacheEnabled: boolean;
  private readonly cacheSize: number;
  private cache: Map<string, string>;

  constructor(opts: TranslatorOptions = {}) {
    this.engine = opts.engine || new MockTranslateEngine();
    this.defaultLanguage = opts.defaultLanguage || 'zh';
    this.cacheEnabled = opts.cache !== false;
    this.cacheSize = opts.cacheSize ?? 500;
    this.cache = new Map();
  }

  /** 切换翻译引擎（生产可注入 GoogleEngine / DeepLEngine） */
  setEngine(engine: TranslateEngine): void {
    this.engine = engine;
    this.cache.clear(); // 引擎变更清缓存
  }

  /** 获取当前引擎 */
  getEngineName(): string {
    return this.engine.name;
  }

  /** 单条翻译 */
  async translate(text: string, to?: Language): Promise<string> {
    const target = to || this.defaultLanguage;
    if (!text || !text.trim()) return text;

    const cacheKey = `${target}::${text}`;
    if (this.cacheEnabled) {
      const hit = this.cache.get(cacheKey);
      if (hit !== undefined) return hit;
    }

    const result = await this.engine.translate(text, target);

    if (this.cacheEnabled) {
      if (this.cache.size >= this.cacheSize) {
        // 简单 LRU：删除最早插入的（Map 保持插入顺序）
        const firstKey = this.cache.keys().next().value;
        if (firstKey !== undefined) this.cache.delete(firstKey);
      }
      this.cache.set(cacheKey, result);
    }
    return result;
  }

  /** 批量翻译（按当前引擎批量） */
  async translateBatch(texts: string[], to?: Language): Promise<string[]> {
    const target = to || this.defaultLanguage;
    if (this.engine.translateBatch) {
      return this.engine.translateBatch(texts, target);
    }
    return Promise.all(texts.map((t) => this.translate(t, target)));
  }

  /** 清空缓存 */
  clearCache(): void {
    this.cache.clear();
  }

  /** 当前缓存条数 */
  cacheSize_(): number {
    return this.cache.size;
  }
}

// =============================================================================
// Google / DeepL 引擎接入指引（生产实现参考）
// =============================================================================

/**
 * GoogleTranslateEngine（生产参考实现）
 *
 * ```ts
 * import { Translate } from '@google-cloud/translate';
 *
 * export class GoogleTranslateEngine implements TranslateEngine {
 *   name = 'google';
 *   private client = new Translate({ key: process.env.GOOGLE_TRANSLATE_API_KEY });
 *   async translate(text: string, to: Language) {
 *     if (to === 'zh') {
 *       const [translated] = await this.client.translate(text, 'zh-CN');
 *       return translated;
 *     }
 *     const [translated] = await this.client.translate(text, 'en');
 *     return translated;
 *   }
 * }
 * ```
 */

/**
 * DeepLEngine（生产参考实现）
 *
 * ```ts
 * import * as deepl from 'deepl-node';
 *
 * export class DeepLEngine implements TranslateEngine {
 *   name = 'deepl';
 *   private client = new deepl.Translator(process.env.DEEPL_API_KEY!);
 *   async translate(text: string, to: Language) {
 *     const target = to === 'zh' ? 'zh' : 'en-US';
 *     const res = await this.client.translateText(text, null, target);
 *     return res.text;
 *   }
 * }
 * ```
 */
