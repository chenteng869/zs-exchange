/**
 * SSRF 防护工具 (P0-3 安全修复)
 *
 * 设计目标:
 *  1. 阻断指向私有 IP/回环地址/云元数据/Link-local 的请求
 *  2. 仅允许 http/https 协议
 *  3. 支持 DNS 解析后再次校验（防 DNS rebinding）
 *  4. 可配置白名单域名/IP 段（用于内部服务）
 *  5. 抛出 SafeError 供 handleApiError 统一处理
 *
 * 防护场景:
 *  - Webhook 用户配置 URL 攻击内部服务
 *  - DID 解析被恶意利用探测内网
 *  - 自定义 RPC 攻击数据库/Redis
 *  - 任何 fetch 用户输入 URL
 *
 * 审计依据: J-1.9 业务逻辑与数据安全审计 - 2.2 SSRF (CRITICAL)
 */

import { lookup } from 'dns/promises';
import { SafeError } from '@/lib/api/error-handler';

// ============================================================
// 协议白名单
// ============================================================

const ALLOWED_PROTOCOLS = new Set(['http:', 'https:']);

// ============================================================
// 私有 IP 段（IPv4 + IPv6）
// ============================================================

/**
 * 检查 IPv4 是否在私有/保留网段
 * - 10.0.0.0/8 (RFC 1918 私有)
 * - 172.16.0.0/12 (RFC 1918 私有)
 * - 192.168.0.0/16 (RFC 1918 私有)
 * - 127.0.0.0/8 (回环)
 * - 169.254.0.0/16 (Link-local + 云元数据)
 * - 224.0.0.0/4 (多播)
 * - 240.0.0.0/4 (保留)
 * - 0.0.0.0/8 (通配)
 * - 100.64.0.0/10 (CGNAT)
 * - 198.18.0.0/15 (基准测试)
 * - 255.255.255.255 (广播)
 */
const PRIVATE_IPV4_RANGES: Array<[RegExp, number]> = [
  [/^10\./, 8],
  [/^172\.(1[6-9]|2[0-9]|3[0-1])\./, 12],
  [/^192\.168\./, 16],
  [/^127\./, 8],
  [/^169\.254\./, 16],
  [/^0\./, 8],
  [/^100\.(6[4-9]|[7-9][0-9]|1[0-1][0-9]|12[0-7])\./, 10], // CGNAT 100.64.0.0/10
  [/^198\.(1[8-9])\./, 15],
];

/**
 * 检查 IPv6 是否在私有/保留网段
 * - ::1/128 (回环)
 * - fc00::/7 (ULA 私有)
 * - fe80::/10 (Link-local)
 * - ::ffff:0:0/96 (IPv4-mapped 需递归检查)
 * - ff00::/8 (多播)
 * - 64:ff9b::/96 (NAT64)
 * - ::/128 (未指定)
 */
const PRIVATE_IPV6_PREFIXES = [
  '::1',
  'fc',
  'fd',
  'fe8',
  'fe9',
  'fea',
  'feb',
  'ff',
  '64:ff9b',
];

function isPrivateIPv4(ip: string): boolean {
  for (const [pattern] of PRIVATE_IPV4_RANGES) {
    if (pattern.test(ip)) return true;
  }
  return false;
}

function isPrivateIPv6(ip: string): boolean {
  const normalized = ip.toLowerCase().split('%')[0]; // 移除 zone-id
  // IPv4-mapped IPv6: ::ffff:127.0.0.1 → 提取 IPv4 部分
  const ipv4Mapped = normalized.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (ipv4Mapped) {
    return isPrivateIPv4(ipv4Mapped[1]);
  }
  for (const prefix of PRIVATE_IPV6_PREFIXES) {
    if (normalized.startsWith(prefix)) return true;
  }
  return false;
}

// ============================================================
// 域名/IP 校验
// ============================================================

/**
 * 检查字符串是否为合法 IP 地址
 */
function isIPAddress(host: string): boolean {
  // IPv4
  if (/^(\d{1,3}\.){3}\d{1,3}$/.test(host)) {
    const parts = host.split('.').map(Number);
    return parts.every((p) => p >= 0 && p <= 255);
  }
  // IPv6 (简化检测)
  if (host.includes(':') && /^[\da-f:]+$/i.test(host)) {
    return true;
  }
  return false;
}

/**
 * 检查域名格式是否合法
 */
function isValidHostname(host: string): boolean {
  if (host.length === 0 || host.length > 253) return false;
  return /^([\da-z]([\da-z-]{0,61}[\da-z])?\.)+[\da-z]{2,}$/i.test(host);
}

// ============================================================
// 端口/host 提取
// ============================================================

/**
 * 提取 URL 的 hostname（兼容 IPv6 方括号）
 */
function extractHost(urlObj: URL): string {
  let host = urlObj.hostname;
  // IPv6 在 URL 中以 [::1] 形式，hostname 已自动剥离方括号
  return host.toLowerCase();
}

// ============================================================
// 核心: URL 安全检查
// ============================================================

export interface SsrfCheckOptions {
  /** 允许的域名/IP 列表（白名单优先于黑名单） */
  allowedHosts?: string[];
  /** 是否允许私有 IP（仅 dev/测试用） */
  allowPrivateIPs?: boolean;
  /** 是否执行 DNS 解析后再次校验（防 DNS rebinding） */
  resolveDns?: boolean;
}

/**
 * 检查 URL 是否安全（非 SSRF）
 * @throws SafeError 如果 URL 不安全
 */
export async function assertSafeUrl(
  urlString: string,
  context: string,
  options: SsrfCheckOptions = {},
): Promise<void> {
  const { allowedHosts = [], allowPrivateIPs = false, resolveDns = true } = options;

  // 1. 协议校验
  let urlObj: URL;
  try {
    urlObj = new URL(urlString);
  } catch (e) {
    throw new SafeError(
      'Invalid URL',
      `Invalid URL: ${urlString}`,
      'INVALID_URL',
      400,
    );
  }

  if (!ALLOWED_PROTOCOLS.has(urlObj.protocol)) {
    throw new SafeError(
      'Disallowed protocol',
      `Protocol not allowed: ${urlObj.protocol} (${context})`,
      'DISALLOWED_PROTOCOL',
      400,
    );
  }

  const host = extractHost(urlObj);
  if (!host) {
    throw new SafeError(
      'Invalid URL host',
      `URL has no host: ${urlString}`,
      'INVALID_HOST',
      400,
    );
  }

  // 2. 白名单校验（最高优先级）
  if (allowedHosts.length > 0) {
    const isAllowed = allowedHosts.some(
      (allowed) => allowed.toLowerCase() === host,
    );
    if (!isAllowed) {
      throw new SafeError(
        'Host not in whitelist',
        `Host ${host} not in whitelist (${context})`,
        'HOST_NOT_ALLOWED',
        403,
      );
    }
    return; // 白名单通过，无需进一步校验
  }

  // 3. 直接 IP 地址校验
  if (isIPAddress(host)) {
    if (!allowPrivateIPs && (isPrivateIPv4(host) || isPrivateIPv6(host))) {
      throw new SafeError(
        'Private IP not allowed',
        `Private IP ${host} blocked (${context})`,
        'PRIVATE_IP_BLOCKED',
        403,
      );
    }
    return; // 公网 IP 允许
  }

  // 4. 域名格式校验
  if (!isValidHostname(host)) {
    throw new SafeError(
      'Invalid hostname',
      `Invalid hostname: ${host} (${context})`,
      'INVALID_HOSTNAME',
      400,
    );
  }

  // 5. DNS 解析后再次校验（防 DNS rebinding）
  if (resolveDns) {
    try {
      const result = await lookup(host, { all: true });
      for (const record of result) {
        if (!allowPrivateIPs) {
          if (record.family === 4 && isPrivateIPv4(record.address)) {
            throw new SafeError(
              'DNS resolved to private IP',
              `Host ${host} → ${record.address} (private, blocked) (${context})`,
              'DNS_PRIVATE_IP',
              403,
            );
          }
          if (record.family === 6 && isPrivateIPv6(record.address)) {
            throw new SafeError(
              'DNS resolved to private IPv6',
              `Host ${host} → ${record.address} (private, blocked) (${context})`,
              'DNS_PRIVATE_IP',
              403,
            );
          }
        }
      }
    } catch (e) {
      if (e instanceof SafeError) throw e;
      throw new SafeError(
        'DNS resolution failed',
        `DNS lookup failed for ${host} (${context})`,
        'DNS_FAILED',
        400,
      );
    }
  }
}

// ============================================================
// 安全 fetch 包装器
// ============================================================

/**
 * 安全 fetch 包装器 - 自动执行 SSRF 防护
 * @param urlString 目标 URL
 * @param context 上下文标识（用于日志/错误）
 * @param options SSRF 检查选项 + 标准 fetch options
 * @throws SafeError 如果 URL 不安全
 */
export async function safeFetch(
  urlString: string,
  context: string,
  options: SsrfCheckOptions & RequestInit = {},
): Promise<Response> {
  const { allowedHosts, allowPrivateIPs, resolveDns, ...fetchOptions } = options;
  await assertSafeUrl(urlString, context, { allowedHosts, allowPrivateIPs, resolveDns });
  return fetch(urlString, fetchOptions);
}

// ============================================================
// 兼容层
// ============================================================

export const ssrfGuard = {
  assertSafeUrl,
  safeFetch,
  isPrivateIPv4,
  isPrivateIPv6,
  isIPAddress,
  isValidHostname,
};

export default ssrfGuard;
