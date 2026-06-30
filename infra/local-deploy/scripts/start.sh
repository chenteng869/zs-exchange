#!/bin/bash
# =============================================================================
# ZS Exchange - 启动本地虚拟服务器
# 用法: ./scripts/start.sh [core|engines|full|all]
# =============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEPLOY_DIR="$(dirname "$SCRIPT_DIR")"
cd "$DEPLOY_DIR"

# 颜色
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

MODE="${1:-core}"

print_banner() {
    echo -e "${BLUE}"
    echo "╔════════════════════════════════════════════════════════╗"
    echo "║   ZS Exchange - 本地虚拟服务器部署                      ║"
    echo "║   中萨数字科技交易所 / 全部服务一键启动                  ║"
    echo "╚════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

print_phase() {
    echo -e "\n${GREEN}▶ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

# 加载 .env
if [ -f .env ]; then
    set -a
    source .env
    set +a
fi

print_banner

# 阶段选择
case "$MODE" in
    core)
        print_phase "启动 Phase 1 - 核心服务 (PG + Redis + n8n + ZS Web)"
        COMPOSE_FILES="-f docker-compose.core.yml"
        ;;
    engines)
        print_phase "启动 Phase 2 - 业务引擎 (OpenClaw + Flowable + Mongo + AI Gateway)"
        # 先确保核心服务在跑
        if ! docker ps --format "{{.Names}}" | grep -q "zs_postgres"; then
            print_warning "核心服务未启动，先启动核心..."
            docker compose --env-file .env -f docker-compose.core.yml up -d
            sleep 10
        fi
        COMPOSE_FILES="-f docker-compose.engines.yml"
        ;;
    full)
        print_phase "启动 Phase 3 - 完整部署 (Kafka + MinIO + Prometheus + Fabric)"
        if ! docker ps --format "{{.Names}}" | grep -q "zs_postgres"; then
            print_warning "核心服务未启动，先启动核心..."
            docker compose --env-file .env -f docker-compose.core.yml up -d
            sleep 10
        fi
        COMPOSE_FILES="-f docker-compose.full.yml"
        ;;
    all)
        print_phase "启动所有 3 个阶段"
        COMPOSE_FILES="-f docker-compose.core.yml -f docker-compose.engines.yml -f docker-compose.full.yml"
        ;;
    *)
        echo "用法: $0 [core|engines|full|all]"
        exit 1
        ;;
esac

# 创建数据目录
mkdir -p data/{postgres,redis,n8n,mongo,minio,prometheus,grafana,kafka,openclaw,flowable,redis-insight}
mkdir -p logs

# 启动
print_phase "拉取镜像..."
docker compose --env-file .env $COMPOSE_FILES pull 2>/dev/null || true

print_phase "启动服务..."
docker compose --env-file .env $COMPOSE_FILES up -d

# 等待健康检查
print_phase "等待服务健康检查..."
sleep 15

# 显示状态
echo ""
print_phase "✅ 部署完成！服务状态："
docker compose --env-file .env $COMPOSE_FILES ps

echo ""
print_phase "📋 访问地址："
echo ""
echo -e "  ${GREEN}🌐 ZS Exchange Web:${NC}     http://localhost:3001"
echo -e "  ${GREEN}📊 管理后台 Dashboard:${NC} http://localhost:3001/admin/dashboard"
echo -e "  ${GREEN}🔄 n8n 工作流:${NC}          http://localhost:5678"
echo -e "  ${GREEN}💾 Adminer (PG管理):${NC}    http://localhost:8081"
echo -e "  ${GREEN}🔍 Redis Insight:${NC}      http://localhost:8001"

if [ "$MODE" = "engines" ] || [ "$MODE" = "all" ]; then
    echo -e "  ${GREEN}🤖 OpenClaw:${NC}            http://localhost:18789"
    echo -e "  ${GREEN}📋 Flowable BPM:${NC}        http://localhost:8080"
    echo -e "  ${GREEN}🧠 AI Gateway:${NC}          http://localhost:8000"
    echo -e "  ${GREEN}🗄 Mongo Express:${NC}      mongodb://zs_admin:dev_mongo_pass_2026@localhost:27017"
fi

if [ "$MODE" = "full" ] || [ "$MODE" = "all" ]; then
    echo -e "  ${GREEN}📨 Kafka:${NC}               localhost:9092"
    echo -e "  ${GREEN}📦 MinIO Console:${NC}      http://localhost:9001"
    echo -e "  ${GREEN}📈 Prometheus:${NC}          http://localhost:9090"
    echo -e "  ${GREEN}📊 Grafana:${NC}             http://localhost:3000 (admin / dev_grafana_2026)"
fi

echo ""
print_phase "🔐 默认账号："
echo "  PostgreSQL: zs_admin / dev_pg_pass_2026  (数据库: zs_exchange)"
echo "  Redis:      dev_redis_pass_2026"
echo "  MongoDB:    zs_admin / dev_mongo_pass_2026"
echo "  MinIO:      zs_admin / dev_minio_pass_2026"

echo ""
print_phase "💡 后续操作："
echo "  查看日志: docker compose -f docker-compose.core.yml logs -f"
echo "  停止服务: ./scripts/stop.sh"
echo "  健康检查: ./scripts/health-check.sh"
echo "  完全清理: ./scripts/clean.sh"

echo ""
print_phase "⏱  启动时间: $(date)"
