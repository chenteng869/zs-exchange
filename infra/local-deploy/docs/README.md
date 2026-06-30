# ZS Exchange - 本地虚拟部署指南

> 本指南说明如何在 **本地开发机** 上用 Docker 模拟一个**生产级多服务器集群**，用于演示、测试和开发。

---

## 🎯 部署目标

在没有真实云服务器的情况下，用 **本机 + Docker** 模拟出 ZS Exchange AI 自动化平台的全部基础设施：

```
┌─────────────────────────────────────────────────────────────┐
│              你的开发机 (Windows 11)                            │
├─────────────────────────────────────────────────────────────┤
│  Docker Desktop                                              │
│  ├─ Phase 1: 核心服务     (PG/Redis/n8n/ZS Web)        2GB  │
│  ├─ Phase 2: 业务引擎    (OpenClaw/Flowable/Mongo/AI)  3GB  │
│  └─ Phase 3: 监控/存证    (Kafka/MinIO/Prom/Fabric)    3GB  │
│                                                              │
│  总资源: 8GB 内存 / 10+ 容器                                    │
└─────────────────────────────────────────────────────────────┘
```

---

## 📋 前置条件

| 软件 | 版本 | 检查命令 |
|------|------|----------|
| Docker Desktop | ≥ 4.0 | `docker --version` |
| Docker Compose | ≥ v2 | `docker compose version` |
| 内存 | ≥ 8 GB 可用 | (任务管理器查看) |
| 磁盘 | ≥ 50 GB 可用 | (此电脑查看) |
| CPU | ≥ 4 核 | - |

> ✅ 你的环境: Docker 29.5.2 + 31.5GB 内存 + 22核 — **完全满足**

---

## 🚀 快速启动（3 步）

### 1️⃣ 进入部署目录

```bash
cd d:\3、系统项目开发\trae_projects\Stock Exchange dapp20260608-01\infra\local-deploy
```

### 2️⃣ 启动核心服务（Phase 1）

```bash
# PowerShell (推荐)
bash scripts/start.sh core

# 或直接 docker compose
docker compose --env-file .env -f docker-compose.core.yml up -d
```

### 3️⃣ 等待并验证

```bash
# 等待 30 秒
bash scripts/health-check.sh
```

---

## 🌐 访问地址

启动完成后，可以访问以下地址：

| 服务 | 地址 | 默认账号 |
|------|------|----------|
| **🌐 ZS Exchange Web** | http://localhost:3001 | - |
| **📊 管理后台 Dashboard** | http://localhost:3001/admin/dashboard | - |
| **🔄 n8n 工作流** | http://localhost:5678 | 首次启动设置 |
| **💾 Adminer (PG管理)** | http://localhost:8081 | `zs_admin` / `dev_pg_pass_2026` |
| **🔍 Redis Insight** | http://localhost:8001 | - |

### Phase 2 引擎（可选）

| 服务 | 地址 |
|------|------|
| **🤖 OpenClaw** | http://localhost:18789 |
| **📋 Flowable BPM** | http://localhost:8080 |
| **🧠 AI Gateway** | http://localhost:8000 |
| **🗄 MongoDB** | `mongodb://zs_admin:dev_mongo_pass_2026@localhost:27017` |

### Phase 3 监控/存证（可选）

| 服务 | 地址 |
|------|------|
| **📈 Prometheus** | http://localhost:9090 |
| **📊 Grafana** | http://localhost:3000 (`admin` / `dev_grafana_2026`) |
| **📦 MinIO Console** | http://localhost:9001 (`zs_admin` / `dev_minio_pass_2026`) |
| **📨 Kafka** | localhost:9092 |
| **⛓ Fabric Peer** | localhost:7051 |

---

## 📦 启动模式

| 模式 | 命令 | 内存 | 时间 | 适用 |
|------|------|------|------|------|
| **core** ⭐ | `bash scripts/start.sh core` | 2 GB | 3 分钟 | 日常开发/演示 |
| **engines** | `bash scripts/start.sh engines` | +3 GB | 5 分钟 | 集成测试 |
| **full** | `bash scripts/start.sh full` | +3 GB | 10 分钟 | 完整功能验证 |
| **all** | `bash scripts/start.sh all` | 8 GB | 15 分钟 | 性能压测 |

---

## 🛠 常用命令

```bash
# 查看服务状态
docker compose --env-file .env -f docker-compose.core.yml ps

# 查看日志
docker compose --env-file .env -f docker-compose.core.yml logs -f

# 查看特定服务日志
docker logs -f zs_app

# 停止服务（保留数据）
bash scripts/stop.sh

# 停止 + 删除数据
bash scripts/stop.sh clean

# 健康检查
bash scripts/health-check.sh
```

---

## 🔧 故障排查

### 问题 1: 端口被占用

**错误**: `bind: address already in use`

**解决**:
```bash
# 查找占用端口的进程
netstat -ano | findstr :3001

# 或修改 .env 文件
POSTGRES_PORT=5433
N8N_PORT=5679
```

### 问题 2: 容器启动失败

```bash
# 查看详细日志
docker logs zs_postgres

# 重新拉取镜像
docker compose --env-file .env -f docker-compose.core.yml pull
```

### 问题 3: 应用连不上数据库

检查环境变量：
```bash
docker exec zs_app env | grep -E "DATABASE_URL|REDIS_URL"
```

应用代码中需将 `localhost` 改为容器名：
```env
DATABASE_URL=postgresql://zs_admin:dev_pg_pass_2026@postgres:5432/zs_exchange
```

---

## 📁 目录结构

```
infra/local-deploy/
├── .env                       # 环境变量
├── docker-compose.core.yml    # 核心服务（PG/Redis/n8n/ZS Web）
├── docker-compose.engines.yml # 业务引擎
├── docker-compose.full.yml    # 完整部署
├── Dockerfile.zs              # ZS 应用镜像
├── data/                      # 数据持久化（自动创建）
├── logs/                      # 日志目录
├── conf/                      # 配置文件
│   ├── postgres/init.sql      # PG 初始化
│   └── prometheus/...         # Prometheus 配置
├── scripts/
│   ├── start.sh               # 启动
│   ├── stop.sh                # 停止
│   └── health-check.sh        # 健康检查
└── docs/                      # 部署文档
    ├── README.md              # 本文档
    └── QUICK_START.md         # 5 分钟快速上手
```

---

## 🎓 学习路径

1. **先跑通 Phase 1**（5 分钟）→ 看到 ZS Web + 数据库
2. **Phase 2 引擎**（10 分钟）→ 接入 AI 智能体
3. **Phase 3 完整版**（20 分钟）→ 监控+存证
4. **集成到 ZS 项目**（后续）→ 把 n8n/OpenClaw 接入 ZS 后台页面

---

## 📊 模拟生产架构

本部署的架构与生产环境（K8s 集群）保持一致：

```
开发机                              生产环境
─────────────────────────────────────────────
docker-compose                      K8s
├─ PostgreSQL (1)            →    StatefulSet × 3
├─ Redis (1)                 →    Cluster × 6
├─ n8n (1)                   →    Deployment × 5
├─ OpenClaw (1)              →    Deployment × 3
├─ Flowable (1)              →    Deployment × 2
├─ Kafka (1)                 →    StatefulSet × 3
├─ MongoDB (1)               →    ReplicaSet × 3
├─ MinIO (1)                 →    StatefulSet × 4
├─ Prometheus (1)            →    Deployment × 2
├─ Grafana (1)               →    Deployment × 1
├─ Fabric Peer (1)           →    StatefulSet × 4
└─ ZS Web (1)                →    Deployment × 6
```

---

**✅ 你现在可以一键部署完整的本地虚拟服务器了！**
