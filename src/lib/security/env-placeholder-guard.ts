/**
 * 环境变量占位符/伪装值检测
 *
 * 防止「看起来配了密钥、实际跑不通」的情况。包括：
 * 1. 英文常见占位词（your-/changeme/example/...）
 * 2. 中文/Unicode 占位词（复制的/请填/示例/...）
 * 3. 长度异常（< 20 字符）
 * 4. URL 格式（误把网页链接当密钥）
 * 5. 非 ASCII 字符（真实 webhook secret 都是 base64/hex）
 * 6. 与同源 API Key 重复
 *
 * 单一事实源，deposit-readiness 和 wallet-webhook-secrets 共用。
 */

export interface PlaceholderCheckResult {
  isPlaceholder: boolean;
  length: number;
  hasNonAscii: boolean;
  matchedTokens: string[];
  matches: {
    englishToken: boolean;
    chineseToken: boolean;
    tooShort: boolean;
    isUrl: boolean;
    hasNonAscii: boolean;
  };
}

const ENGLISH_TOKENS = [
  'your-',
  'your_',
  'paste',
  'paste_',
  '<paste',
  'your_key',
  'changeme',
  'change-me',
  'placeholder',
  'example',
  'dummy',
  'todo',
  'null',
  'undefined',
  'sample',
  'demo',
  'fake',
  'test-',
  'xxxxx',
  'aaaaa',
];

const CHINESE_TOKENS = [
  '复制的',
  '从 ',
  '详情页',
  '请填',
  '请替换',
  '请改成',
  '改成',
  '你的',
  '示例',
  '占位',
  '这里是',
  '此处填',
  '密钥',
  '签名',
  'signing',
  'control',
  'webhook',
  'secret',
  'developers',
];

export function isNonAscii(value: string): boolean {
  // 任何非 ASCII 字符（中文、日文、emoji 等）都算
  // 真实 webhook secret 几乎都是 base64/hex，全 ASCII
  return /[^\x00-\x7F]/.test(value);
}

export function detectPlaceholder(value: string): PlaceholderCheckResult {
  const trimmed = (value || '').trim();
  const normalized = trimmed.toLowerCase();

  const matchedEnglish = ENGLISH_TOKENS.filter((token) => normalized.includes(token));
  const matchedChinese = CHINESE_TOKENS.filter((token) => normalized.includes(token.toLowerCase()));
  const matchedAll = [...matchedEnglish, ...matchedChinese];

  const tooShort = trimmed.length < 20;
  const isUrl = /^https?:\/\//i.test(trimmed);
  const nonAscii = isNonAscii(trimmed);

  return {
    isPlaceholder: matchedAll.length > 0 || tooShort || isUrl || nonAscii,
    length: trimmed.length,
    hasNonAscii: nonAscii,
    matchedTokens: matchedAll,
    matches: {
      englishToken: matchedEnglish.length > 0,
      chineseToken: matchedChinese.length > 0,
      tooShort,
      isUrl,
      hasNonAscii: nonAscii,
    },
  };
}

export function isSameAsApiKey(value: string, apiKey: string | undefined): boolean {
  if (!apiKey) return false;
  return value.trim() === apiKey.trim();
}
