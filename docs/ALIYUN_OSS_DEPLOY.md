# 🌐 ZS Exchange 阿里云 OSS 部署完整指南

> **生成时间**: 2026-06-12  
> **目标**: 将 ZS Exchange (Next.js) 部署到阿里云 OSS + CDN  
> **预计时间**: 60-90 分钟  
> **预计成本**: ¥30-150/月（按访问量）

---

## 📋 方案概览

| 方案 | 难度 | 成本 | 性能 | 推荐度 |
|------|------|------|------|--------|
| **方案 A: OSS + CDN（静态）** | ⭐⭐ 中 | ¥30+/月 | ⭐⭐⭐⭐ 优 | ⭐⭐⭐⭐⭐ 静态站推荐 |
| **方案 B: ECS + Nginx（动态）** | ⭐⭐⭐ 难 | ¥100+/月 | ⭐⭐⭐⭐⭐ 最佳 | ⭐⭐⭐⭐ Next.js 完整 |
| **方案 C: 函数计算 FC** | ⭐⭐ 中 | 按量付费 | ⭐⭐⭐ 良 | ⭐⭐⭐ Serverless |
| **方案 D: Web 托管 + CDN** | ⭐ 简单 | ¥15+/月 | ⭐⭐⭐⭐ 优 | ⭐⭐⭐ 零运维 |

---

## 🎯 方案 A: OSS + CDN（推荐，纯静态）

### 适用场景
- 网站主要是静态展示/数据查询
- 少量 API 调用直接走 OSS
- 想要最低成本 + CDN 加速

### 步骤 1: 创建阿里云账号

1. 注册: https://www.aliyun.com/
2. 完成实名认证（个人/企业）
3. 充值 ¥100 即可开始

### 步骤 2: 开通 OSS 服务

```
控制台 → 对象存储 OSS → 立即开通
```

### 步骤 3: 创建 Bucket

```
1. 控制台 → OSS → Bucket 列表 → 创建 Bucket
2. 配置:
   - 名称: zs-exchange-prod
   - 区域: 中国香港 / 新加坡（海外）/ 华东1（国内）
   - 存储类型: 标准存储
   - 读写权限: 公共读
   - 版本控制: 暂不开启
   - 实时日志: 按需
3. 点击 确定
```

**Bucket 命名规范**:
- 全球唯一
- 小写字母、数字、连字符
- 3-63 字符
- 例如: `zs-exchange`, `zs-exchange-prod`

### 步骤 4: 配置 Next.js 静态导出

修改 [next.config.mjs](next.config.mjs):
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',         // ⭐ 关键：静态导出
  images: { unoptimized: true },
  trailingSlash: true,
  
  // 排除不能静态化的功能（如果使用）
  // 如需 API Routes，参见方案 B
};

export default nextConfig;
```

### 步骤 5: 准备部署脚本

创建 `scripts/deploy-oss.sh`:
```bash
#!/bin/bash
# deploy-oss.sh
set -e

# ============== 配置 ==============
BUCKET_NAME="zs-exchange-prod"
REGION="oss-cn-hangzhou"     # 根据你的实际 region
ALIYUN_CLI="/path/to/aliyun"  # 或使用 ossutil

# ============== 构建 ==============
echo "===== 1. 清理旧文件 ====="
rm -rf out/

echo "===== 2. 构建静态站点 ====="
npx next build

# ============== 上传 ==============
echo "===== 3. 上传到 OSS ====="

# 方式 A: 使用 ossutil（推荐）
ossutil cp -r ./out/ "oss://${BUCKET_NAME}/" --update

# 方式 B: 使用 aliyun cli
# aliyun oss cp -r ./out/ "oss://${BUCKET_NAME}/" --update

echo "===== 4. 配置静态网站托管 ====="
# 阿里云控制台 → OSS → Bucket → 基础设置 → 静态页面
# 默认首页: index.html
# 默认 404: 404.html

echo "✅ 部署完成！"
echo "访问地址: http://${BUCKET_NAME}.${REGION}.aliyuncs.com"
```

创建 `scripts/deploy-oss.ps1` (Windows):
```powershell
# deploy-oss.ps1
$BUCKET_NAME = "zs-exchange-prod"
$REGION = "oss-cn-hangzhou"

Write-Host "===== 1. 清理旧文件 =====" -ForegroundColor Cyan
Remove-Item -Recurse -Force out -ErrorAction SilentlyContinue

Write-Host "===== 2. 构建静态站点 =====" -ForegroundColor Cyan
npx next build
if ($LASTEXITCODE -ne 0) { 
    Write-Host "❌ 构建失败" -ForegroundColor Red
    exit 1 
}

Write-Host "===== 3. 上传到 OSS =====" -ForegroundColor Cyan
ossutil cp -r ./out/ "oss://${BUCKET_NAME}/" --update

Write-Host "✅ 部署完成" -ForegroundColor Green
Write-Host "访问: http://${BUCKET_NAME}.${REGION}.aliyuncs.com" -ForegroundColor Green
```

### 步骤 6: 安装 ossutil

#### Windows

```powershell
# 下载 ossutil
# https://help.aliyun.com/document_detail/120075.html

# 解压到任意目录，例如 D:\tools\ossutil
# 添加到 PATH: $env:PATH += ";D:\tools\ossutil"

# 配置 AccessKey
ossutil config
# 输入:
#   endpoint: oss-cn-hangzhou.aliyuncs.com
#   accessKeyID: 你的 AccessKey ID
#   accessKeySecret: 你的 AccessKey Secret
#   stsToken: 留空
```

#### Linux/macOS

```bash
curl -O https://gosspublic.alicdn.com/ossutil/1.7.18/ossutil64
chmod 755 ossutil64
sudo mv ossutil64 /usr/local/bin/ossutil

ossutil config
```

### 步骤 7: 获取 AccessKey

```
1. 阿里云控制台 → 鼠标悬停头像 → AccessKey 管理
2. 创建 AccessKey
3. 保存 AccessKey ID 和 AccessKey Secret
4. ⚠️ 注意安全，不要提交到 Git
```

### 步骤 8: 配置静态网站托管

```
OSS 控制台 → Bucket 列表 → zs-exchange-prod → 基础设置

静态页面:
  - 默认首页: index.html
  - 默认 404: 404.html
  - 子目录首页: 启用
  - 文件名: index.html

点击 保存
```

### 步骤 9: 绑定自定义域名（可选）

```
1. 域名管理 → 绑定域名
2. 输入: www.zs.exchange
3. 阿里云自动添加 CNAME 记录

如域名在阿里云：
  - 自动验证
  - 立即生效

如域名在 Cloudflare：
  - 手动添加 CNAME
  - 指向 zs-exchange-prod.oss-cn-hangzhou.aliyuncs.com
```

### 步骤 10: 配置 CDN 加速

```
控制台 → CDN → 域名管理 → 添加域名

配置:
  - 加速域名: www.zs.exchange
  - 源站信息: OSS 域名 (zs-exchange-prod.oss-cn-hangzhou.aliyuncs.com)
  - 加速类型: 全站加速
  - 端口: 80/443

缓存配置:
  - *.html: 5 分钟
  - *.js,*.css: 30 天
  - *.png,*.jpg,*.webp: 30 天
  - /*: 1 天 (默认)

HTTPS:
  - 申请免费证书 (Let's Encrypt)
  - 启用 HTTP/2
  - 启用 TLS 1.3
```

### 步骤 11: 自动化部署

使用 GitHub Actions 自动化:

`.github/workflows/deploy-aliyun.yml`:
```yaml
name: Deploy to Aliyun OSS

on:
  push:
    branches: [main]
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
      - name: 检出代码
        uses: actions/checkout@v4
      
      - name: 设置 Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: 安装依赖
        run: npm ci
      
      - name: 构建
        run: npx next build
      
      - name: 配置 ossutil
        run: |
          mkdir -p ~/.ossutil
          cat > ~/.ossutil/config <<EOF
          [Credentials]
          language=EN
          endpoint=oss-cn-hangzhou.aliyuncs.com
          accessKeyID=${{ secrets.ALIYUN_ACCESS_KEY_ID }}
          accessKeySecret=${{ secrets.ALIYUN_ACCESS_KEY_SECRET }}
          EOF
      
      - name: 部署到 OSS
        run: |
          ossutil cp -r ./out/ "oss://zs-exchange-prod/" --update --force
      
      - name: CDN 刷新
        run: |
          aliyun cdn RefreshObjectCaches --ObjectPath "https://www.zs.exchange/" --ObjectType Directory
        env:
          ALIYUN_ACCESS_KEY_ID: ${{ secrets.ALIYUN_ACCESS_KEY_ID }}
          ALIYUN_ACCESS_KEY_SECRET: ${{ secrets.ALIYUN_ACCESS_KEY_SECRET }}
```

---

## 🎯 方案 B: ECS + Nginx（动态 + API）

### 适用场景
- Next.js 有 API Routes
- 需要 SSR/ISR
- 完整 Node.js 环境

### 步骤 1: 创建 ECS 实例

```
控制台 → 云服务器 ECS → 创建实例

推荐配置:
  - 实例规格: ecs.t6-c1m2.large (2C4G) / ecs.c6e.large (2C4G)
  - 镜像: Ubuntu 22.04 64位
  - 系统盘: 40 GB ESSD
  - 公网带宽: 5 Mbps（按流量）
  - 安全组: 开放 80, 443, 22

价格: 约 ¥100-300/月
```

### 步骤 2: 连接 ECS

```bash
ssh root@your-server-ip
```

### 步骤 3: 安装 Node.js + Nginx

```bash
# 更新系统
apt update && apt upgrade -y

# 安装 Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# 安装 pnpm（可选）
npm install -g pnpm

# 安装 Nginx
apt install -y nginx

# 安装 PM2（进程管理）
npm install -g pm2

# 验证
node -v
nginx -v
pm2 -v
```

### 步骤 4: 部署项目

```bash
# 创建项目目录
mkdir -p /var/www/zs-exchange
cd /var/www/zs-exchange

# 方式 A: Git 拉取
git clone https://github.com/yourname/zs-exchange.git .

# 方式 B: 上传 zip
# 使用 scp 上传
# scp dist.zip root@server:/var/www/zs-exchange/

# 安装依赖
npm ci

# 构建
npx next build
```

### 步骤 5: 配置 PM2

创建 `ecosystem.config.js`:
```javascript
module.exports = {
  apps: [{
    name: 'zs-exchange',
    script: 'npx',
    args: 'next start -p 3001',
    cwd: '/var/www/zs-exchange',
    instances: 2,
    exec_mode: 'cluster',
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    }
  }]
};
```

```bash
# 启动
pm2 start ecosystem.config.js
pm2 save
pm2 startup  # 设置开机启动
```

### 步骤 6: 配置 Nginx

`/etc/nginx/sites-available/zs-exchange`:
```nginx
server {
    listen 80;
    server_name www.zs.exchange zs.exchange;
    
    # HTTP → HTTPS 重定向
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name www.zs.exchange zs.exchange;
    
    # SSL 证书
    ssl_certificate /etc/nginx/ssl/zs.exchange.crt;
    ssl_certificate_key /etc/nginx/ssl/zs.exchange.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    
    # Gzip
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;
    gzip_min_length 1000;
    
    # 静态资源缓存
    location /_next/static/ {
        alias /var/www/zs-exchange/.next/static/;
        expires 1y;
        access_log off;
        add_header Cache-Control "public, immutable";
    }
    
    location /static/ {
        alias /var/www/zs-exchange/public/;
        expires 30d;
        access_log off;
    }
    
    # 反向代理
    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 60s;
    }
}
```

```bash
# 启用配置
ln -s /etc/nginx/sites-available/zs-exchange /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

### 步骤 7: 申请 SSL 证书

#### 方式 A: Let's Encrypt（免费）

```bash
# 安装 certbot
apt install -y certbot python3-certbot-nginx

# 申请证书
certbot --nginx -d zs.exchange -d www.zs.exchange

# 自动续期
certbot renew --dry-run
```

#### 方式 B: 阿里云免费证书

```
1. SSL 证书控制台 → 申请免费证书
2. 域名: zs.exchange
3. 验证 DNS（添加 CNAME）
4. 下载 Nginx 证书
5. 上传到服务器 /etc/nginx/ssl/
```

---

## 🌐 域名解析

### 阿里云 DNS

```
控制台 → 域名 DNS 解析

A 记录 (ECS 部署):
  主机: www
  记录值: your-server-ip
  TTL: 600

CNAME (OSS/CDN 部署):
  主机: www
  记录值: zs-exchange-prod.oss-cn-hangzhou.aliyuncs.com
  TTL: 600
```

---

## 💰 成本估算

| 方案 | 资源 | 月成本 | 适用 |
|------|------|--------|------|
| **A: OSS+CDN** | OSS 10GB + CDN 50GB | ¥30-50 | 静态站 |
| **B: ECS+Nginx** | 2C4G + 5M 带宽 | ¥150-300 | 完整功能 |
| **C: 函数计算 FC** | 100万次调用 | ¥30-80 | 弹性需求 |
| **D: Web 托管** | 静态 + CDN | ¥15-30 | 最便宜 |

---

## 🔧 性能优化

### 1. CDN 配置

```
- 启用 Brotli 压缩
- HTTP/2 启用
- 智能预热
- 边缘计算函数
```

### 2. 图片优化

```javascript
// next.config.mjs
const nextConfig = {
  images: {
    loader: 'imgix',
    domains: ['your-oss-bucket.oss-cn-hangzhou.aliyuncs.com'],
  },
};
```

### 3. 缓存策略

```
HTML: 5 分钟（stale-while-revalidate=60）
JS/CSS: 1 年（contenthash 强缓存）
图片: 30 天
字体: 1 年
API: 0（业务自定义）
```

---

## 📊 监控告警

### 配置云监控

```
控制台 → 云监控 → 报警规则

1. OSS 流量告警
   - 阈值: 100GB/天
   - 通知: 短信 + 邮件

2. CDN 命中率
   - 阈值: < 90%
   - 通知: 钉钉机器人

3. ECS CPU/内存
   - 阈值: CPU > 80%
   - 自动重启
```

---

## 🔄 持续部署（CI/CD）

### GitHub Actions + 阿里云

参见前面的 `.github/workflows/deploy-aliyun.yml`。

### 阿里云 DevOps（云效）

```
1. 云效 Codeup 创建项目
2. 关联 Git 仓库
3. 配置流水线:
   - 构建: npm run build
   - 部署: ossutil cp
   - 触发: 推送到 main 分支
```

---

## 🛡️ 安全配置

### WAF（Web 应用防火墙）

```
控制台 → Web 应用防火墙

- 防护模式: 拦截
- 规则集: 启用 OWASP Top 10
- CC 防护: 启用（阈值 100 QPS）
- Bot 管理: 启用
```

### 访问控制

```javascript
// next.config.mjs
async headers() {
  return [
    {
      source: '/(.*)',
      headers: [
        { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        { key: 'Permissions-Policy', value: 'camera=(), microphone=()' }
      ]
    }
  ];
}
```

---

## 📋 上线前检查清单

- [ ] 域名解析正确
- [ ] SSL 证书有效
- [ ] CDN 加速配置
- [ ] 静态资源 404 检查
- [ ] API 接口测试
- [ ] 移动端适配
- [ ] 浏览器兼容性
- [ ] 性能（首屏 < 3s）
- [ ] SEO 标签完整
- [ ] 错误监控接入（Sentry）

---

## 🎯 推荐方案

| 你的情况 | 推荐 |
|----------|------|
| **纯展示网站** | 方案 A: OSS+CDN（最便宜） |
| **完整 Next.js** | 方案 B: ECS+Nginx（功能完整） |
| **访问量波动大** | 方案 C: 函数计算（弹性） |
| **预算最省** | 方案 D: Web 托管 |

---

## 🎉 总结

**最快上线**（30 分钟）:
1. 阿里云控制台创建 OSS Bucket
2. `npm run build` 生成 out/
3. ossutil 上传
4. 绑定域名 + CDN
5. 完成！

**最低成本**: ¥30/月 起

**最高性能**: ECS + CDN + Redis + RDS

需要我进一步帮你：
- 🔧 **某个具体步骤的详细操作**
- 🛡️ **安全加固方案**（WAF/DDoS）
- 📊 **成本优化建议**
- 🔄 **CI/CD 流水线**（自动化）
- 🌐 **多区域部署**（高可用）
