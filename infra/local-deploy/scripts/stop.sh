#!/bin/bash
# =============================================================================
# ZS Exchange - 停止本地虚拟服务器
# 用法: ./scripts/stop.sh [clean|volumes]
# =============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEPLOY_DIR="$(dirname "$SCRIPT_DIR")"
cd "$DEPLOY_DIR"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

MODE="${1:-stop}"

echo -e "${YELLOW}🛑 停止 ZS Exchange 本地虚拟服务...${NC}"

# 停止所有 compose 文件定义的服务
docker compose --env-file .env -f docker-compose.core.yml down 2>/dev/null || true
docker compose --env-file .env -f docker-compose.engines.yml down 2>/dev/null || true
docker compose --env-file .env -f docker-compose.full.yml down 2>/dev/null || true

if [ "$MODE" = "clean" ] || [ "$MODE" = "volumes" ]; then
    echo -e "${RED}⚠ 清理数据卷（不可恢复）...${NC}"
    docker compose --env-file .env -f docker-compose.core.yml down -v 2>/dev/null || true
    docker compose --env-file .env -f docker-compose.engines.yml down -v 2>/dev/null || true
    docker compose --env-file .env -f docker-compose.full.yml down -v 2>/dev/null || true

    # 删除数据
    rm -rf data/
    echo -e "${GREEN}✅ 数据卷已清理${NC}"
fi

if [ "$MODE" = "clean" ]; then
    echo -e "${RED}⚠ 删除所有 ZS 镜像...${NC}"
    docker images | grep "zs_" | awk '{print $3}' | xargs -r docker rmi -f 2>/dev/null || true
    docker images | grep -E "(zs|postgres:16|redis:7|n8nio|adminer|redisinsight)" | awk '{print $3}' | xargs -r docker rmi -f 2>/dev/null || true
fi

echo -e "${GREEN}✅ ZS Exchange 本地服务已停止${NC}"
