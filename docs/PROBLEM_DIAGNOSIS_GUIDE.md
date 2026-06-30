# 🔍 ZS Exchange 问题诊断手册

> **生成时间**: 2026-06-12  
> **适用版本**: ZS Exchange v1.0 (Next.js 14)  
> **更新策略**: 发现新问题持续更新

---

## 📋 目录

1. [开发环境问题](#1-开发环境问题)
2. [构建问题](#2-构建问题)
3. [运行时问题](#3-运行时问题)
4. [网络/API 问题](#4-网络api-问题)
5. [样式问题](#5-样式问题)
6. [性能问题](#6-性能问题)
7. [部署问题](#7-部署问题)
8. [Docker 问题](#8-docker-问题)

---

## 1️⃣ 开发环境问题

### ❌ 问题 1.1: `npm install` 失败

**症状**:
```
npm ERR! code ERESOLVE
npm ERR! ERESOLVE unable to resolve dependency tree
```

**原因**: Node.js 版本不匹配，或依赖冲突

**解决**:
```bash
# 1. 检查 Node 版本
node -v
# 要求: v18.17+ 或 v20+

# 2. 清理 + 重新安装
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
Remove-Item package-lock.json -ErrorAction SilentlyContinue
npm install --legacy-peer-deps

# 3. 如果还失败，删除 node_modules + package-lock
# 然后逐个安装关键依赖
npm install next@14 react@18
npm install antd @tanstack/react-query zustand
```

### ❌ 问题 1.2: 端口被占用

**症状**:
```
Error: listen EADDRINUSE: address already in use :::3001
```

**解决**:
```powershell
# Windows: 查看占用 3001 的进程
netstat -ano | findstr :3001
taskkill /F /PID <PID>

# 或使用新端口
npx next dev -p 3002
```

```bash
# Linux/macOS
lsof -i :3001
kill -9 <PID>
```

### ❌ 问题 1.3: TypeScript 编译错误

**症状**:
```
Type error: Cannot find module '@/components/...'
```

**解决**:
```json
// tsconfig.json 确保配置正确
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

---

## 2️⃣ 构建问题

### ❌ 问题 2.1: `next build` 失败

**症状**:
```
Failed to compile.
Module not found: Can't resolve '@/...'
```

**诊断步骤**:
```bash
# 1. 检查文件是否存在
ls src/components/admin/AdminLayout.tsx

# 2. 检查 tsconfig 路径
cat tsconfig.json | grep paths

# 3. 清理 .next 缓存
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
npx next build
```

### ❌ 问题 2.2: 内存溢出 (OOM)

**症状**:
```
FATAL ERROR: Reached heap limit Allocation failed
```

**解决**:
```json
// package.json
{
  "scripts": {
    "dev": "NODE_OPTIONS=--max-old-space-size=4096 next dev",
    "build": "NODE_OPTIONS=--max-old-space-size=4096 next build"
  }
}
```

```bash
# 或临时设置
set NODE_OPTIONS=--max-old-space-size=4096
npx next build
```

### ❌ 问题 2.3: 静态导出问题

**症状**:
```
Error: Page cannot be statically exported
```

**原因**: 用了动态 API（cookies/headers/searchParams）

**解决**:
```typescript
// 1. 添加 force-dynamic
export const dynamic = 'force-dynamic';

// 2. 或使用 fetch 缓存
const res = await fetch(url, { cache: 'no-store' });

// 3. 或在 next.config 排除
const nextConfig = {
  // ...
  experimental: {
    missingSuspenseWithCSRBailout: false,
  },
};
```

---

## 3️⃣ 运行时问题

### ❌ 问题 3.1: QueryClient 未设置

**症状**:
```
Error: No QueryClient set, use QueryClientProvider to set one
```

**原因**: 使用了 useQuery 但没有 Provider

**解决**:
```typescript
// 1. 确保根 layout 有 QueryClientProvider
// src/app/layout.tsx
import { ReactQueryProvider } from '@/components/providers/ReactQueryProvider';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <ReactQueryProvider>
          {children}
        </ReactQueryProvider>
      </body>
    </html>
  );
}
```

```typescript
// 2. 或为 admin 单独创建 layout
// src/app/admin/layout.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

export default function AdminLayout({ children }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
```

### ❌ 问题 3.2: Hydration 错误

**症状**:
```
Hydration failed because the initial UI does not match what was rendered on the server.
```

**常见原因**:
- 用了 `Date.now()` 或 `Math.random()` 
- 浏览器扩展修改了 DOM
- 时区/语言不一致

**解决**:
```typescript
// 1. 使用 useEffect 延迟渲染
import { useEffect, useState } from 'react';

function MyComponent() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  
  if (!mounted) return null;
  return <div>{Date.now()}</div>;
}

// 2. 使用 suppressHydrationWarning
<div suppressHydrationWarning>{new Date().toLocaleString()}</div>
```

### ❌ 问题 3.3: 服务不可用 (服务端异常)

**症状**: 页面显示红色错误图标"服务不可用"

**诊断**:
```bash
# 1. 查看浏览器控制台
# F12 → Console → 红色错误

# 2. 查看网络请求
# F12 → Network → 红色请求

# 3. 查看服务器日志
# 终端运行 next dev 的输出
```

**常见 fix**:
```typescript
// 1. 加错误边界
// src/app/error.tsx
'use client';
export default function Error({ error, reset }) {
  return (
    <div>
      <h2>出错了</h2>
      <button onClick={reset}>重试</button>
    </div>
  );
}

// 2. 加 loading.tsx
// src/app/loading.tsx
export default function Loading() {
  return <Spin />;
}

// 3. 关闭 SSR
'use client';
// 在文件顶部加这行
```

---

## 4️⃣ 网络/API 问题

### ❌ 问题 4.1: API 请求 404

**症状**:
```
GET /api/admin/dashboard/stats 404 Not Found
```

**诊断**:
```bash
# 1. 检查 API 路由是否存在
ls src/app/api/admin/dashboard/

# 2. 测试 API
curl http://localhost:3001/api/admin/dashboard/stats
```

**解决**:
```typescript
// 确保 API 路由文件结构正确:
// src/app/api/admin/dashboard/stats/route.ts

import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ 
    success: true, 
    data: {} 
  });
}
```

### ❌ 问题 4.2: CORS 跨域错误

**症状**:
```
Access to fetch at '...' has been blocked by CORS policy
```

**解决**:
```typescript
// src/app/api/[...]/route.ts
export async function GET(request: Request) {
  return new Response(JSON.stringify(data), {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
```

### ❌ 问题 4.3: ERR_ABORTED 请求被取消

**症状**:
```
[error] net::ERR_ABORTED
at dispatchXhrRequest (axios/lib/adapters/xhr.js:174:16)
```

**原因**:
- 组件卸载时还在发请求
- 用户快速切换页面

**解决**:
```typescript
// 1. 使用 AbortController
useEffect(() => {
  const controller = new AbortController();
  
  fetchData(controller.signal);
  
  return () => controller.abort();
}, []);

// 2. 用 react-query 自动管理
const { data } = useQuery({
  queryKey: ['stats'],
  queryFn: ({ signal }) => fetch('/api/stats', { signal }),
});
```

### ❌ 问题 4.4: 502 Bad Gateway

**症状**: Next.js 上游服务 502

**原因**:
- 后端服务挂了
- 内存不足被 OOM Kill
- 代理配置错误

**解决**:
```bash
# 1. 检查 Node 进程
pm2 list

# 2. 重启服务
pm2 restart all

# 3. 检查 Nginx 配置
nginx -t
systemctl reload nginx
```

---

## 5️⃣ 样式问题

### ❌ 问题 5.1: Tailwind 类不生效

**诊断**:
```bash
# 1. 确认 tailwind.config.js 正确
# 2. 检查 className 拼写
# 3. 重启 dev server
```

**解决**:
```javascript
// tailwind.config.js
module.exports = {
  content: [
    './src/app/**/*.{js,ts,jsx,tsx}',
    './src/components/**/*.{js,ts,jsx,tsx}',
  ],
  // ...
};
```

### ❌ 问题 5.2: Ant Design 组件样式错乱

**症状**: Modal/Drawer 样式全乱

**解决**:
```typescript
// 在 layout.tsx 确保
import 'antd/dist/reset.css';

// 或使用 ConfigProvider
import { ConfigProvider } from 'antd';

<ConfigProvider theme={themeConfig}>
  {children}
</ConfigProvider>
```

### ❌ 问题 5.3: 移动端样式问题

**诊断**:
```typescript
// Chrome DevTools → Toggle Device Toolbar (Ctrl+Shift+M)
```

**修复**:
```css
/* 使用 rem 适配 */
html { font-size: 14px; }
@media (min-width: 768px) { html { font-size: 16px; } }
```

---

## 6️⃣ 性能问题

### ❌ 问题 6.1: 首屏加载慢

**诊断**:
```bash
# Chrome DevTools → Performance
# 查看 LCP / FCP / TTI
```

**优化**:
```typescript
// 1. 动态导入
const HeavyComponent = dynamic(() => import('./Heavy'), {
  loading: () => <Spin />,
  ssr: false,
});

// 2. 图片优化
import Image from 'next/image';
<Image src="..." width={300} height={200} alt="..." />

// 3. 字体优化
import { Inter } from 'next/font/google';
```

### ❌ 问题 6.2: Bundle 体积过大

**诊断**:
```bash
# 分析 bundle
npm install -D @next/bundle-analyzer
ANALYZE=true npx next build
```

**优化**:
```javascript
// next.config.mjs
import bundleAnalyzer from '@next/bundle-analyzer';
const withBundleAnalyzer = bundleAnalyzer({ enabled: process.env.ANALYZE === 'true' });
export default withBundleAnalyzer({ ... });
```

### ❌ 问题 6.3: 内存泄漏

**症状**: 页面越用越卡

**诊断**:
```bash
# Chrome DevTools → Memory
# Take Heap Snapshot
```

**解决**:
```typescript
// 1. 清理 useEffect 副作用
useEffect(() => {
  const handler = () => { /* ... */ };
  window.addEventListener('resize', handler);
  return () => window.removeEventListener('resize', handler);
}, []);

// 2. 清理定时器
useEffect(() => {
  const timer = setInterval(...);
  return () => clearInterval(timer);
}, []);
```

---

## 7️⃣ 部署问题

### ❌ 问题 7.1: 部署后 404

**症状**: 本地正常，部署后页面 404

**原因**: 
- 静态导出配置错误
- 路由不匹配
- 缓存问题

**解决**:
```javascript
// next.config.mjs
const nextConfig = {
  output: 'export',  // 或 'standalone'
  trailingSlash: true,
  images: { unoptimized: true },
};
```

### ❌ 问题 7.2: 环境变量不生效

**诊断**:
```bash
# 检查文件
ls .env.local
cat .env.local
```

**注意**:
- `.env.local` 不提交到 Git
- `NEXT_PUBLIC_*` 前缀的才会暴露给客户端
- 部署后需在云平台配置

### ❌ 问题 7.3: Docker 容器启动失败

**诊断**:
```bash
# 查看日志
docker logs container-name

# 进入容器
docker exec -it container-name sh

# 查看进程
ps aux
```

---

## 8️⃣ Docker 问题

### ❌ 问题 8.1: Docker daemon 拒绝连接

**症状**:
```
Error response from daemon: failed to resolve reference ...
```

**解决**:
```bash
# 1. 检查 daemon.json
cat $env:APPDATA/Docker/daemon.json

# 2. 重启 Docker Desktop
# 任务栏 → Docker → Restart

# 3. 检查网络
ping docker.io
```

### ❌ 问题 8.2: 容器端口冲突

**症状**:
```
Bind for 0.0.0.0:3001 failed: port is already allocated
```

**解决**:
```bash
# 1. 找出占用端口的进程
netstat -ano | findstr :3001
taskkill /F /PID <PID>

# 2. 或修改 docker-compose 端口映射
ports:
  - "3002:3001"
```

### ❌ 问题 8.3: 镜像拉取慢/超时

**解决**:
```json
// $env:APPDATA/Docker/daemon.json
{
  "registry-mirrors": [
    "https://docker.1ms.run",
    "https://docker.xuanyuan.me",
    "https://docker.m.daocloud.io"
  ]
}
```

### ❌ 问题 8.4: 容器内时区不对

**解决**:
```dockerfile
# Dockerfile
ENV TZ=Asia/Shanghai
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone
```

---

## 9️⃣ 常见问题速查表

| 错误信息 | 可能原因 | 快速解决 |
|----------|----------|----------|
| `EADDRINUSE` | 端口被占 | `taskkill` 或换端口 |
| `Cannot find module` | 依赖缺失 | `npm install` |
| `Hydration failed` | SSR/CSR 不一致 | 加 `useEffect` 或 `suppressHydrationWarning` |
| `No QueryClient set` | 缺 React Query Provider | 包裹 `QueryClientProvider` |
| `CORS` | 跨域未配置 | 加响应头 `Access-Control-Allow-Origin` |
| `ERR_ABORTED` | 组件卸载时请求 | 用 `AbortController` |
| `502 Bad Gateway` | 上游服务挂了 | 重启 PM2 + Nginx |
| `OOM` | 内存不足 | 增加 `NODE_OPTIONS=--max-old-space-size=4096` |
| `EACCES` | 权限不足 | `chmod 755` 或 `chown -R` |
| `EAI_AGAIN` | DNS 解析失败 | 检查网络/hosts |
| `ENOSPC` | 磁盘满了 | `df -h` 清理 |

---

## 🔧 调试工具推荐

### 前端调试
- **React DevTools** (Chrome 扩展)
- **Vue DevTools** (Vue 项目)
- **Redux DevTools** (Zustand 也支持)
- **CodeGraph**（本项目内置）

### 网络调试
- **Chrome DevTools Network**
- **Postman** / **Insomnia**
- **Wireshark** (高级)
- **Charles** (代理抓包)

### 性能分析
- **Chrome DevTools Performance**
- **Lighthouse**
- **WebPageTest**
- **Vercel Analytics**

### 错误监控
- **Sentry** (推荐)
- **Bugsnag**
- **Rollbar**
- **Datadog RUM**

---

## 📞 获取帮助

| 渠道 | 用途 |
|------|------|
| **项目内** | 直接问我（AI 助手） |
| **Next.js** | https://github.com/vercel/next.js/discussions |
| **Ant Design** | https://github.com/ant-design/ant-design/issues |
| **Stack Overflow** | 搜索错误信息 |
| **Google** | `[错误信息] site:github.com` |

---

## 📝 问题报告模板

发现新问题时，请用以下模板报告：

```markdown
## 问题描述
[简要描述问题]

## 复现步骤
1. ...
2. ...
3. ...

## 期望行为
[应该发生什么]

## 实际行为
[实际发生了什么]

## 错误信息
```
[错误堆栈]
```

## 环境
- Node: v20.x
- OS: Windows 11
- 浏览器: Chrome 120
- Next.js: 14.1.0
```

---

**持续更新中** 📝
