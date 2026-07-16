/**
 * XSS 防护工具
 *
 * 提供安全的 HTML 字符串转义函数 + JSON-LD 字符串化防护
 * 防止 `</script>` 注入和 HTML 实体绕过
 *
 * 典型场景：
 * - dangerouslySetInnerHTML 注入 JSON-LD
 * - innerHTML 写入富文本
 * - 用户输入拼到 HTML 字符串
 */

/**
 * 转义危险的 HTML 实体和 `</script>` 闭合标签
 * 用于 dangerouslySetInnerHTML 前的预处理
 */
export function escapeHtmlForScript(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    // 防止 `</script>` 提前闭合
    .replace(/<\/script/gi, '<\\/script')
    // 防止 `<!--` HTML 注释中断
    .replace(/<!--/g, '<\\!--');
}

/**
 * 深度遍历对象，递归转义所有字符串值
 * 用于 JSON-LD 等结构化数据注入前的安全清洗
 */
export function deepEscapeStrings<T>(obj: T): T {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === 'string') return escapeHtmlForScript(obj) as unknown as T;
  if (Array.isArray(obj)) return obj.map((v) => deepEscapeStrings(v)) as unknown as T;
  if (typeof obj === 'object') {
    const result: Record<string, unknown> = {};
    for (const key of Object.keys(obj as Record<string, unknown>)) {
      result[key] = deepEscapeStrings((obj as Record<string, unknown>)[key]);
    }
    return result as T;
  }
  return obj;
}

/**
 * 安全生成 JSON-LD 字符串
 * - 先 JSON.stringify
 * - 防止 stringified 内容含 `</script>` 标签
 *
 * 用法：
 * ```tsx
 * <script
 *   type="application/ld+json"
 *   dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }}
 * />
 * ```
 */
export function safeJsonLd(data: unknown): string {
  const escaped = deepEscapeStrings(data);
  const json = JSON.stringify(escaped);
  // 二次防护：JSON.stringify 后的字符串再转义一次 `</script`
  return json.replace(/<\/script/gi, '<\\/script');
}

/**
 * 净化 URL，移除 javascript: / data: / vbscript: 等危险协议
 * 用于 href / src 属性
 */
export function sanitizeUrl(url: string): string {
  if (!url) return '';
  const trimmed = url.trim();
  const lower = trimmed.toLowerCase();

  // 黑名单危险协议
  if (
    lower.startsWith('javascript:') ||
    lower.startsWith('vbscript:') ||
    lower.startsWith('data:') ||
    lower.startsWith('file:')
  ) {
    return '';
  }

  return trimmed;
}

/**
 * 净化 HTML 字符串中所有 href / src 属性值
 * 用于服务端渲染前的内容审查
 */
export function sanitizeHtmlAttributes(html: string): string {
  return html
    .replace(/(href|src|action|formaction)\s*=\s*"([^"]*)"/gi, (match, attr, value) => {
      return `${attr}="${sanitizeUrl(value)}"`;
    })
    .replace(/(href|src|action|formaction)\s*=\s*'([^']*)'/gi, (match, attr, value) => {
      return `${attr}='${sanitizeUrl(value)}'`;
    });
}

/**
 * 截断并净化用户输入，用于显示
 * 防止 CSS injection 和极端长度 DoS
 */
export function sanitizeUserInput(input: string, maxLength = 5000): string {
  if (!input) return '';
  return input
    .substring(0, maxLength)
    // 移除控制字符
    .replace(/[\u0000-\u001F\u007F]/g, '')
    // 转义 HTML 标签
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * 安全跳转 URL（防 javascript: / data: 协议注入）
 *  - 阻断所有非 http(s) / mailto / tel / 内部相对路径 / 锚点 / 协议无关 URL
 *  - 用于 window.location.href = url / window.open(url) 前的安全检查
 *
 * @returns 安全 URL 字符串（不安全时返回空字符串）
 */
export function safeRedirectUrl(url: unknown): string {
  if (typeof url !== 'string') return '';
  const trimmed = url.trim();
  if (!trimmed) return '';
  const lower = trimmed.toLowerCase();

  // 内部相对路径或锚点直接放行
  if (trimmed.startsWith('/') || trimmed.startsWith('#') || trimmed.startsWith('?')) {
    return trimmed;
  }

  // 阻断危险协议
  if (
    lower.startsWith('javascript:') ||
    lower.startsWith('vbscript:') ||
    lower.startsWith('data:') ||
    lower.startsWith('file:') ||
    lower.startsWith('about:')
  ) {
    return '';
  }

  // 阻断嵌入 CRLF 注入
  if (/[\r\n\t]/.test(trimmed)) {
    return '';
  }

  // 仅放行已知安全协议
  if (
    lower.startsWith('http://') ||
    lower.startsWith('https://') ||
    lower.startsWith('mailto:') ||
    lower.startsWith('tel:') ||
    lower.startsWith('//') ||
    /^[\w-]+(\.[\w-]+)+/.test(trimmed)
  ) {
    return trimmed;
  }

  return '';
}

/**
 * 安全打开 URL（window.open 的安全包装）
 *  - 不安全 URL 返回 false，不执行跳转
 *  - 用于防止 javascript: 注入型 window.open 攻击
 */
export function safeWindowOpen(url: unknown, target = '_blank', features?: string): boolean {
  const safe = safeRedirectUrl(url);
  if (!safe) return false;
  if (typeof window === 'undefined') return false;
  window.open(safe, target, features);
  return true;
}

/**
 * 安全赋值 window.location.href
 *  - 不安全 URL 返回 false，不执行跳转
 *  - 用于防止 javascript: 注入型 location 跳转攻击
 */
export function safeLocationAssign(url: unknown): boolean {
  const safe = safeRedirectUrl(url);
  if (!safe) return false;
  if (typeof window === 'undefined') return false;
  window.location.href = safe;
  return true;
}

/**
 * 净化交易哈希（防 XSS + 长度控制）
 *  - 限制为 0x[a-fA-F0-9]{40,128} 或 base58/base64 字符
 *  - 不匹配返回空字符串
 */
export function sanitizeTxHash(hash: unknown): string {
  if (typeof hash !== 'string') return '';
  // 优先 EVM 0x hex
  if (/^0x[0-9a-fA-F]{40,128}$/.test(hash)) return hash;
  // Solana / 其他 base58 字符
  if (/^[1-9A-HJ-NP-Za-km-z]{32,128}$/.test(hash)) return hash;
  return '';
}
