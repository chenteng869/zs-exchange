/**
 * 安全日志工具（2026-07-11 新建）
 *
 *  - 自动脱敏敏感字段（私钥、API Key、JWT、密码、txHash 部分）
 *  - 防止日志注入（换行/控制字符过滤）
 *  - 统一格式：时间戳 + 级别 + 来源
 *  - 不影响 console 性能
 */

const SENSITIVE_KEYS = [
  'signingKey', 'signing_key', 'apiKey', 'api_key', 'secret', 'privateKey', 'private_key',
  'password', 'passwd', 'pwd', 'token', 'accessToken', 'refreshToken', 'jwt',
  'authorization', 'cookie', 'session',
];

const PARTIAL_MASK_FIELDS = ['txHash', 'hash', 'from', 'to', 'address', 'walletAddress'];

/** 脱敏单个 value */
function maskValue(key: string, value: unknown): unknown {
  if (typeof value === 'string') {
    if (SENSITIVE_KEYS.includes(key)) {
      if (value.length === 0) return '';
      if (value.length <= 8) return '***';
      return `${value.slice(0, 4)}***${value.slice(-2)}`;
    }
    if (PARTIAL_MASK_FIELDS.some((k) => key.toLowerCase().includes(k.toLowerCase()))) {
      if (value.length <= 12) return value;
      return `${value.slice(0, 6)}…${value.slice(-4)}`;
    }
  }
  return value;
}

/** 深度脱敏对象 */
export function maskSensitive<T = unknown>(obj: T): T {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === 'string') return obj as any;
  if (Array.isArray(obj)) return obj.map((v) => maskSensitive(v)) as any;
  if (typeof obj === 'object') {
    const out: any = {};
    for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
      out[k] = typeof v === 'object' && v !== null ? maskSensitive(v) : maskValue(k, v);
    }
    return out;
  }
  return obj;
}

/** 清除换行/控制字符（防日志注入）*/
function sanitize(s: string): string {
  return s.replace(/[\r\n\t\x00-\x1F\x7F]/g, ' ').slice(0, 4096);
}

const ts = (): string => new Date().toISOString();

/** 安全 console.log */
export function safeConsoleLog(message: string, meta?: Record<string, unknown>): void {
  const metaStr = meta ? ` ${JSON.stringify(maskSensitive(meta))}` : '';
  // eslint-disable-next-line no-console
  console.log(`[${ts()}] [INFO] ${sanitize(message)}${sanitize(metaStr)}`);
}

/** 安全 console.info */
export function safeConsoleInfo(message: string, meta?: Record<string, unknown>): void {
  const metaStr = meta ? ` ${JSON.stringify(maskSensitive(meta))}` : '';
  // eslint-disable-next-line no-console
  console.info(`[${ts()}] [INFO] ${sanitize(message)}${sanitize(metaStr)}`);
}

/** 安全 console.warn */
export function safeConsoleWarn(message: string, meta?: Record<string, unknown>): void {
  const metaStr = meta ? ` ${JSON.stringify(maskSensitive(meta))}` : '';
  // eslint-disable-next-line no-console
  console.warn(`[${ts()}] [WARN] ${sanitize(message)}${sanitize(metaStr)}`);
}

/** 安全 console.error */
export function safeConsoleError(message: string, meta?: Record<string, unknown>): void {
  const metaStr = meta ? ` ${JSON.stringify(maskSensitive(meta))}` : '';
  // eslint-disable-next-line no-console
  console.error(`[${ts()}] [ERROR] ${sanitize(message)}${sanitize(metaStr)}`);
}
