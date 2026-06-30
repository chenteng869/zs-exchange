const securityHeaders = [
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' },
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data:",
      "connect-src 'self' http://localhost:* ws://localhost:* https: wss:",
      "frame-src 'self' https:",
      "frame-ancestors 'self'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; '),
  },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // 移除 X-Powered-By 响应头
  poweredByHeader: false,
  // 启用 gzip/brotli 压缩 (生产环境由托管平台处理)
  compress: true,
  // 静态导出：让 `next build` 生成 out/ 目录，可直接打包进 APK（内嵌 H5 模式）
  output: 'export',
  // 静态导出时使用 trailingSlash，确保 out/h5/ 目录结构（Capacitor WebView 默认会找 index.html）
  trailingSlash: true,
  // 跳过 ESLint 错误
  eslint: { ignoreDuringBuilds: true },
  // 跳过 TypeScript 类型检查错误
  typescript: { ignoreBuildErrors: true },
  // 跳过 webpack 模块缺失警告（MetaMask SDK RN 依赖在 Web 端不需要）
  webpack: (config) => {
    config.resolve = config.resolve || {};
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      'pino-pretty': false,
    };
    config.resolve.fallback = {
      ...(config.resolve.fallback || {}),
      '@react-native-async-storage/async-storage': false,
      'pino-pretty': false,
      'react-native': false,
    };
    return config;
  },
  images: {
    unoptimized: true, // 静态导出必须关闭图像优化
    domains: ['localhost'],
    formats: ['image/avif', 'image/webp'],
  },
  // 静态导出模式下不能使用 rewrites（已删除）
};

nextConfig.headers = async () => [
  {
    source: '/(.*)',
    headers: securityHeaders,
  },
];

module.exports = nextConfig;
