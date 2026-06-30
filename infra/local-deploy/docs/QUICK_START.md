# ZS Exchange - 5 分钟快速启动

## ⚡ 一键启动

```bash
# 进入部署目录
cd "d:\3、系统项目开发\trae_projects\Stock Exchange dapp20260608-01\infra\local-deploy"

# 启动核心服务（2GB 内存，3 分钟）
bash scripts/start.sh core
```

## ✅ 验证启动成功

```bash
# 健康检查
bash scripts/health-check.sh
```

## 🌐 打开浏览器

| 立即体验 | URL |
|----------|-----|
| **ZS Exchange 官网** | http://localhost:3001 |
| **管理后台 Dashboard** | http://localhost:3001/admin/dashboard |
| **n8n 工作流** | http://localhost:5678 |
| **PostgreSQL 管理** | http://localhost:8081 |

## 🔐 登录凭据

```
PostgreSQL: zs_admin / dev_pg_pass_2026
Redis:      dev_redis_pass_2026
MongoDB:    zs_admin / dev_mongo_pass_2026 (Phase 2)
```

## 🛑 停止服务

```bash
bash scripts/stop.sh
```
