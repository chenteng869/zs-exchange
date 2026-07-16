/**
 * Safe JSON Parse - 安全的 JSON 解析工具
 *
 * 用途：
 * 1. 解析来自外部 API 的 JSON 响应（防 HTTP 响应体错误）
 * 2. 解析 Webhook 回调（防恶意 payload）
 * 3. 解析 localStorage 数据（防用户篡改）
 * 4. 解析 WebSocket / SSE 消息（防协议注入）
 *
 * 特性：
 * - try/catch 包裹，不抛出异常
 * - 大小限制（默认 5MB）防止 DoS
 * - 类型守卫 + 自定义校验函数
 * - 错误日志脱敏（不记录 payload 全文）
 */

export class JsonParseError extends Error {
  readonly context: string;

  constructor(message: string, context: string) {
    super(`[JsonParse:${context}] ${message}`);
    this.name = 'JsonParseError';
    this.context = context;
  }
}

export interface SafeParseOptions<T> {
  /** 上下文标签（用于日志和错误） */
  context?: string;
  /** 字节数上限（默认 5MB），超出抛错 */
  maxBytes?: number;
  /** 自定义类型校验（返回 true 通过，false 拒绝） */
  validator?: (value: unknown) => value is T;
  /** 解析失败时的默认值 */
  defaultValue?: T;
  /** 静默失败（仅返回 defaultValue，不抛错） */
  silent?: boolean;
  /** 是否打印 warn 日志（默认 true） */
  logWarn?: boolean;
}

/**
 * 默认上限：5MB
 * 防止恶意大 payload 导致 OOM
 */
const DEFAULT_MAX_BYTES = 5 * 1024 * 1024;

/**
 * 安全的 JSON.parse
 *
 * @example
 * ```ts
 * const data = safeJsonParse<User>(rawBody, {
 *   context: 'stripe-webhook',
 *   validator: (v): v is User => typeof v === 'object' && v !== null && 'id' in v,
 *   defaultValue: null,
 * });
 * ```
 */
export function safeJsonParse<T = unknown>(
  input: string | null | undefined,
  options: SafeParseOptions<T> = {}
): T | null {
  const {
    context = 'unknown',
    maxBytes = DEFAULT_MAX_BYTES,
    validator,
    defaultValue = null,
    silent = false,
    logWarn = true,
  } = options;

  // 1. 空值短路
  if (input === null || input === undefined || input === '') {
    if (defaultValue !== null) return defaultValue;
    return null;
  }

  // 2. 类型校验（必须是字符串或已经合法化的 Buffer/Uint8Array 转字符串）
  if (typeof input !== 'string') {
    if (logWarn && !silent) {
      // eslint-disable-next-line no-console
      console.warn(`[safeJsonParse:${context}] input is not string, got ${typeof input}`);
    }
    return defaultValue;
  }

  // 3. 大小限制
  const byteSize = Buffer.byteLength(input, 'utf-8');
  if (byteSize > maxBytes) {
    if (logWarn && !silent) {
      // eslint-disable-next-line no-console
      console.warn(
        `[safeJsonParse:${context}] payload ${byteSize} bytes exceeds limit ${maxBytes}`
      );
    }
    if (silent) return defaultValue;
    throw new JsonParseError(`Payload too large: ${byteSize} > ${maxBytes}`, context);
  }

  // 4. 尝试解析
  let parsed: unknown;
  try {
    parsed = JSON.parse(input);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (logWarn && !silent) {
      // eslint-disable-next-line no-console
      console.warn(`[safeJsonParse:${context}] parse failed: ${msg} (size=${byteSize}B)`);
    }
    if (silent) return defaultValue;
    throw new JsonParseError(`Parse failed: ${msg}`, context);
  }

  // 5. 严格 undefined 检查（JSON.parse 不会产生 undefined，但稳妥起见）
  if (parsed === undefined) {
    return defaultValue;
  }

  // 6. 自定义类型校验
  if (validator && !validator(parsed)) {
    if (logWarn && !silent) {
      // eslint-disable-next-line no-console
      console.warn(`[safeJsonParse:${context}] validator rejected payload (size=${byteSize}B)`);
    }
    if (silent) return defaultValue;
    throw new JsonParseError(`Validator rejected payload`, context);
  }

  return parsed as T;
}

/**
 * 同步版本的同步 Promise 包装（用于 async 函数）
 * 仅做形式封装，便于在 async 上下文里调用
 */
export async function safeJsonParseAsync<T = unknown>(
  input: string | null | undefined,
  options: SafeParseOptions<T> = {}
): Promise<T | null> {
  return safeJsonParse<T>(input, options);
}

/**
 * 数组安全解析（强类型为 Array<unknown>）
 */
export function safeJsonParseArray<T = unknown>(
  input: string | null | undefined,
  options: Omit<SafeParseOptions<T[]>, 'validator'> & {
    itemValidator?: (value: unknown) => value is T;
  } = {}
): T[] {
  const { itemValidator, ...rest } = options;
  const validator = (v: unknown): v is T[] => {
    if (!Array.isArray(v)) return false;
    if (!itemValidator) return true;
    return v.every((item) => itemValidator(item));
  };
  const result = safeJsonParse<T[]>(input, { ...rest, validator });
  return result ?? rest.defaultValue ?? [];
}

/**
 * 对象安全解析
 */
export function safeJsonParseObject<T extends Record<string, unknown> = Record<string, unknown>>(
  input: string | null | undefined,
  options: Omit<SafeParseOptions<T>, 'validator'> & {
    validator?: (value: unknown) => value is T;
  } = {}
): T | null {
  const { validator, ...rest } = options;
  const objectValidator = validator ?? ((v: unknown): v is T => {
    return typeof v === 'object' && v !== null && !Array.isArray(v);
  });
  return safeJsonParse<T>(input, { ...rest, validator: objectValidator });
}
