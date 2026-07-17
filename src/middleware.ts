/**
 * Next.js Middleware (P0-6 CORS 白名单修复)
 *
 * 设计目标:
 *  1. 替代 Access-Control-Allow-Origin: * 通配符（🔴 高风险）
 *  2. 仅允许环境变量 CORS_ALLOWED_ORIGINS 中配置的来源
 *  3. 支持动态 Origin 反射（不是简单回显）
 *  4. dev 环境允许 localhost / 127.0.0.1
 *  5. OPTIONS 预检请求必须先于 CORS 头返回
 *
 * 配置方式:
 *  - 环境变量 CORS_ALLOWED_ORIGINS (逗号分隔)，例如：
 *    CORS_ALLOWED_ORIGINS="https://app.example.com,https://admin.example.com"
 *  - 默认白名单（dev）：
 *    http://localhost:3000
 *    http://localhost:3200
 *    http://127.0.0.1:3000
 *    http://127.0.0.1:3200
 *
 * 审计依据: J-1.8 网络与传输安全审计 - 2.1 CORS 配置 (HIGH)
 */

import { NextRequest, NextResponse } from 'next/server';

// ============================================================
// 白名单配置
// ============================================================

/**
 * 默认 CORS 白名单（dev 环境）
 * 生产环境必须通过 CORS_ALLOWED_ORIGINS 环境变量覆盖
 */
const DEFAULT_ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:3200',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:3200',
];

/**
 * 解析环境变量，生成白名单 Set（O(1) 查询）
 */
function buildAllowedOrigins(): Set<string> {
  const origins = new Set<string>(DEFAULT_ALLOWED_ORIGINS);
  const envOrigins = process.env.CORS_ALLOWED_ORIGINS;
  if (envOrigins) {
    envOrigins
      .split(',')
      .map((o) => o.trim())
      .filter((o) => o.length > 0)
      .forEach((o) => origins.add(o));
  }
  return origins;
}

const ALLOWED_ORIGINS = buildAllowedOrigins();

/**
 * 检查 Origin 是否在白名单
 * - 严格匹配（不区分大小写）
 * - 防止子域名绕过（不自动允许 *.example.com）
 */
function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) return false;
  return ALLOWED_ORIGINS.has(origin.toLowerCase());
}

// ============================================================
// Middleware
// ============================================================

export async function middleware(req: NextRequest) {
  const origin = req.headers.get('origin');
  const isOptions = req.method === 'OPTIONS';

  // ============================================================
  // 1. 处理 OPTIONS 预检请求（必须最先处理）
  // ============================================================
  if (isOptions) {
    const preflightHeaders: Record<string, string> = {
      'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key, X-Requested-With',
      'Access-Control-Max-Age': '86400', // 24h 缓存预检
    };
    // 仅在白名单时设置 Allow-Origin
    if (isAllowedOrigin(origin)) {
      preflightHeaders['Access-Control-Allow-Origin'] = origin!;
      preflightHeaders['Vary'] = 'Origin';
      preflightHeaders['Access-Control-Allow-Credentials'] = 'true';
    }
    return new NextResponse(null, { status: 204, headers: preflightHeaders });
  }

  // ============================================================
  // 2. 正常请求处理
  // ============================================================
  const res = NextResponse.next();

  // ============================================================
  // 2.1 安全响应头 (P3-1)
  // ============================================================
  res.headers.set('X-Content-Type-Options', 'nosniff');            // 防 MIME 嗅探
  res.headers.set('X-Frame-Options', 'DENY');                      // 防 Clickjacking
  res.headers.set('X-XSS-Protection', '1; mode=block');            // 旧浏览器 XSS Filter
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin'); // 限制 Referer 泄漏
  res.headers.set('X-DNS-Prefetch-Control', 'off');                // 防止 DNS 预取泄漏
  res.headers.set('X-Download-Options', 'noopen');                 // 旧 IE 下载执行保护
  res.headers.set('X-Permitted-Cross-Domain-Policies', 'none');    // Adobe Flash/PDF 跨域策略

  // HSTS (P2-4) — 仅在 HTTPS / 生产环境启用
  //   1 年有效期 + includeSubDomains + preload
  if (process.env.NODE_ENV === 'production' || req.nextUrl.protocol === 'https:') {
    res.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    );
  }

  // Permissions-Policy (P3-1) — 限制浏览器特性
  res.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()'
  );

  // Cross-Origin-Resource-Policy / Opener-Policy / Embedder-Policy
  res.headers.set('Cross-Origin-Resource-Policy', 'same-site');
  res.headers.set('Cross-Origin-Opener-Policy', 'same-origin');
  // 注意：COEP=require-corp 会破坏第三方资源，仅在已确认所有资源都已 CORS 化的页面启用
  // res.headers.set('Cross-Origin-Embedder-Policy', 'require-corp');

  // ============================================================
  // 3. CORS 头（仅在白名单时设置）
  // ============================================================
  if (isAllowedOrigin(origin)) {
    res.headers.set('Access-Control-Allow-Origin', origin!);
    res.headers.set('Vary', 'Origin');
    res.headers.set('Access-Control-Allow-Credentials', 'true');
    res.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    res.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key, X-Requested-With');
  }

  return res;
}

export const config = {
  matcher: '/api/:path*',
};
