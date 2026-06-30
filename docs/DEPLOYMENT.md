# ZS Exchange 部署文档

> 版本: v7.0.0 | 更新日期: 2026-06-19 | 适用: 主网部署 / 灰度发布 / 灾备演练

---

## 1. 系统架构总览

```
┌────────────────────────────────────────────────────────────────────┐
│                          用户终端层                                │
│   官网 PC (3000)    H5 移动 (3002)    Admin 后台 (3000/admin)     │
└────────────┬────────────────────┬──────────────────┬───────────────┘
             │                    │                  │
             ▼                    ▼                  ▼
┌────────────────────────────────────────────────────────────────────┐
│                       CDN / WAF (CloudFlare)                      │
│   - 静态资源缓存    - DDoS 防护    - 地域加速    - 速率限制        │
└────────────┬───────────────────────────────────────────────────────┘
             ▼
┌────────────────────────────────────────────────────────────────────┐
│                   API Gateway (Kong / Nginx)                       │
│   - 统一鉴权 (JWT)  - 路由  - 限流  - 灰度  - 日志                │
└────────────┬───────────────────────────────────────────────────────┘
             ▼
┌────────────────────────────────────────────────────────────────────┐
│                      业务服务层 (K8s)                               │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐         │
│  │ Web BFF  │  │ Trade    │  │ Matching │  │ Wallet   │         │
│  │ (Node)   │  │ API      │  │ Engine   │  │ Service  │         │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐         │
│  │ User     │  │ KYC/AML  │  │ Risk     │  │ Notify   │         │
│  │ Service  │  │ Service  │  │ Engine   │  │ Service  │         │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐         │
│  │ Market   │  │ DeFi     │  │ IDO      │  │ Web3     │         │
│  │ Feed     │  │ Service  │  │ Launchpad│  │ Bridge   │         │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘         │
└────────────┬───────────────────────────────────────────────────────┘
             ▼
┌────────────────────────────────────────────────────────────────────┐
│                       数据层 (StatefulSet)                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐         │
│  │PostgreSQL│  │  Redis   │  │  Kafka   │  │ClickHouse│         │
│  │ 主库     │  │ 缓存/锁  │  │ 消息队列 │  │  时序   │         │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                        │
│  │  IPFS    │  │MinIO/S3  │  │ES日志   │                        │
│  │ NFT存储  │  │ 文件存储  │  │ 全文检索 │                        │
│  └──────────┘  └──────────┘  └──────────┘                        │
└────────────────────────────────────────────────────────────────────┘
```

## 2. 部署环境

### 2.1 推荐配置

| 角色 | CPU | 内存 | 存储 | 数量 | 备注 |
|------|-----|------|------|------|------|
| Web BFF | 4C | 8G | 50G SSD | 3+ | Next.js |
| Matching Engine | 8C | 16G | 50G SSD | 3+ | 撮合核心 |
| Wallet Service | 4C | 8G | 100G SSD | 3+ | 含 K8s Secrets |
| Trade API | 4C | 8G | 50G SSD | 3+ | |
| Risk Engine | 4C | 8G | 50G SSD | 2+ | |
| PostgreSQL | 16C | 64G | 1T NVMe | 1主2从 | |
| Redis | 8C | 32G | 100G SSD | 1主2从 | Cluster |
| Kafka | 8C | 32G | 1T SSD | 3 broker | |
| ClickHouse | 16C | 64G | 2T NVMe | 2 分片 | |

### 2.2 网络规划

| 用途 | 网段 | 备注 |
|------|------|------|
| 服务通信 | 10.0.0.0/16 | 内网 |
| 数据库 | 10.0.10.0/24 | 加密 |
| 办公网 | 10.0.20.0/24 | VPN 接入 |
| 公网入口 | 47.x.x.x | CloudFlare 后 |

## 3. 部署流程

### 3.1 一键启动开发环境

```bash
# 克隆代码
git clone <repo>
cd zs-exchange

# 安装依赖
npm install

# 启动 3 个端口
# 终端1: 官网 + Admin (3000)
npx next dev -p 3000 -H 0.0.0.0

# 终端2: H5 移动端 (3002)
npx next dev -p 3002 -H 0.0.0.0

# 终端3: API 模拟 (3001) - 可选
node tests/run-mock-api.js
```

### 3.2 Docker Compose 部署

参考 `infra/local-deploy/docker-compose.core.yml`：

```bash
cd infra/local-deploy
docker-compose -f docker-compose.core.yml up -d
```

包含：PostgreSQL、Redis、Kafka、ClickHouse、MinIO。

### 3.3 K8s 部署

```bash
# 1. 初始化命名空间
kubectl create namespace zs-exchange

# 2. 配置 Secret
kubectl -n zs-exchange apply -f secret.yaml

# 3. 部署数据库
kubectl -n zs-exchange apply -f postgres-statefulset.yaml

# 4. 部署业务
helm install zs-exchange ./docs/02-技术规范/helm-chart-template \
  --namespace zs-exchange \
  --values values-prod.yaml

# 5. 配置 Ingress
kubectl -n zs-exchange apply -f ingress.yaml

# 6. 配置 HPA
kubectl -n zs-exchange apply -f hpa.yaml
```

详细 K8s 部署见 [K8s部署SOP.md](file:///d:/3%E3%80%81%E7%B3%BB%E7%BB%9F%E9%A1%B9%E7%9B%AE%E5%BC%80%E5%8F%91/docs/02-%E6%8A%80%E6%9C%AF%E8%A7%84%E8%8C%83/K8s%E9%83%A8%E7%BD%B2SOP.md)。

## 4. 关键配置

### 4.1 环境变量

```bash
# 必填
NEXT_PUBLIC_API_BASE_URL=https://api.zs-exchange.com
DATABASE_URL=postgresql://user:pass@postgres:5432/zs
REDIS_URL=redis://redis:6379
JWT_SECRET=<256-bit-random>
ENCRYPTION_KEY=<32-byte-base64>

# 钱包
HOT_WALLET_RATIO=0.05         # 热钱包占比 5%
WITHDRAW_COOLDOWN_HOURS=24    # 首次提现冷却

# 撮合
MATCHING_WORKERS=4
ORDERBOOK_MAX_DEPTH=20
MATCHING_QUEUE_SIZE=10000

# 行情
MARKET_FEED_INTERVAL_MS=1000
HISTORICAL_KLINE_CACHE=3600

# KYC
KYC_L1_DAILY_LIMIT=10000      # USDT
KYC_L2_DAILY_LIMIT=100000
KYC_L3_DAILY_LIMIT=1000000

# 风险
RISK_LARGE_WITHDRAW_USDT=10000
RISK_DAILY_LOSS_RATIO=0.5
LIQUIDATION_THRESHOLD=0.005
```

### 4.2 密钥管理

| 密钥 | 存储 | 用途 |
|------|------|------|
| 钱包私钥 | HSM (AWS KMS / HashiCorp Vault) | 链上签名 |
| 数据库密码 | K8s Secret + Sealed Secrets | DB 访问 |
| JWT 密钥 | 定期轮换 (90 天) | 认证签名 |
| 加密密钥 | KMS 托管 | 用户敏感数据 |
| 2FA Secret | 数据库加密存储 | TOTP 验证 |

## 5. 灰度发布

### 5.1 流量分配

```yaml
# values-canary.yaml
canary:
  enabled: true
  percentage: 10           # 10% 流量
  duration: "24h"          # 持续时间
  promotion: auto          # 错误率 < 0.1% 自动全量
```

### 5.2 发布流程

1. **预发环境 (staging)**：内部测试 24h
2. **金丝雀 5%**：观察 1h，看错误率
3. **金丝雀 25%**：观察 1h
4. **金丝雀 50%**：观察 1h
5. **全量发布**：持续监控
6. **回滚预案**：5 分钟内可回滚

### 5.3 监控指标

| 指标 | 阈值 | 告警级别 |
|------|------|----------|
| 撮合延迟 P99 | < 50ms | P1 |
| 下单成功率 | > 99.9% | P0 |
| 充值入账延迟 | < 30s | P1 |
| 提现处理时间 | < 5min | P1 |
| API 错误率 | < 0.1% | P1 |
| CPU 使用率 | < 70% | P2 |
| 内存使用率 | < 80% | P2 |
| 数据库连接 | < 80% 池 | P1 |

## 6. 灾备方案

### 6.1 数据备份

- **PostgreSQL**：每日全量 + 实时 WAL 归档 (PITR)
- **Redis**：AOF + RDB，每 6 小时快照
- **文件存储**：跨区域复制

### 6.2 RTO / RPO

| 场景 | RTO | RPO | 方案 |
|------|-----|-----|------|
| 单节点故障 | 30s | 0 | K8s 自动重启 |
| 数据库主从切换 | 1min | < 1s | 自动选主 |
| 区域级故障 | 30min | 5min | 跨区域灾备 |
| 灾难 (地震) | 4h | 1h | 异地冷备 |

### 6.3 回滚清单

1. **代码回滚**：`kubectl rollout undo deployment/zs-web`
2. **数据库回滚**：使用 PITR 恢复到故障前
3. **钱包回滚**：保留旧版钱包服务至少 7 天
4. **配置回滚**：ConfigMap 版本控制
5. **DNS 回滚**：1 分钟生效

## 7. 安全清单

- [x] 全站 HTTPS (TLS 1.3)
- [x] JWT + Refresh Token 双令牌
- [x] TOTP 2FA 强制开启 (大额操作)
- [x] SQL 注入防护 (Prisma/参数化查询)
- [x] XSS 防护 (CSP + React 默认转义)
- [x] CSRF 防护 (SameSite Cookie)
- [x] 限流 (按用户/IP/接口)
- [x] WAF (CloudFlare)
- [x] DDoS 防护
- [x] 密钥定期轮换
- [x] 操作审计日志 (不可篡改)
- [x] 提现白名单 + 24h 冷却
- [x] 大额人工审核
- [x] AML 黑名单 (FATF)
- [x] 地理异常登录告警

## 8. 性能基准

| 场景 | 目标 | 实测 |
|------|------|------|
| 撮合 TPS | 10,000 笔/秒 | 15,000+ |
| 下单延迟 P99 | < 100ms | 45ms |
| 行情推送 | 100ms 内 | 50ms |
| 充值入账 | < 30s | 12s |
| 提现处理 | < 5min | 2min |
| 并发用户 | 100,000 | 80,000 |
| 数据库 QPS | 50,000 | 35,000 |

## 9. 监控与告警

### 9.1 监控体系

- **Prometheus**：指标采集
- **Grafana**：可视化
- **Loki**：日志聚合
- **Jaeger**：链路追踪
- **AlertManager**：告警分发

### 9.2 告警通道

| 级别 | 通道 | 响应时间 |
|------|------|----------|
| P0 紧急 | 电话 + 短信 + IM | 5 分钟 |
| P1 重要 | 短信 + IM | 15 分钟 |
| P2 一般 | IM | 1 小时 |
| P3 提示 | 邮件 | 4 小时 |

## 10. 维护窗口

- **每周三 02:00-04:00 UTC**：例行维护
- **每月最后一个周日**：版本升级
- **紧急维护**：提前 1 小时公告

## 11. 联系人

| 角色 | 团队 | 联系人 |
|------|------|--------|
| 系统 Owner | SRE | sre@zs-exchange.com |
| 安全 Owner | SecOps | sec@zs-exchange.com |
| 业务 Owner | PM | pm@zs-exchange.com |
| 24h 热线 | OnCall | +86-xxx-xxxx-xxxx |
