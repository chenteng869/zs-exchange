#!/bin/bash
# =============================================================================
# ZS Exchange - 健康检查
# 用法: ./scripts/health-check.sh
# =============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEPLOY_DIR="$(dirname "$SCRIPT_DIR")"
cd "$DEPLOY_DIR"

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

PASS=0
FAIL=0
WARN=0

check_endpoint() {
    local name=$1
    local url=$2
    local expected=$3

    echo -n "  [$name] $url ... "
    HTTP=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 "$url" 2>/dev/null || echo "000")

    if [ "$HTTP" = "$expected" ]; then
        echo -e "${GREEN}✓ OK ($HTTP)${NC}"
        ((PASS++))
    elif [ "$HTTP" = "000" ]; then
        echo -e "${YELLOW}⚠ UNREACHABLE${NC}"
        ((WARN++))
    else
        echo -e "${RED}✗ FAIL ($HTTP, expected $expected)${NC}"
        ((FAIL++))
    fi
}

check_container() {
    local name=$1
    echo -n "  [Container] $name ... "
    STATUS=$(docker inspect --format='{{.State.Status}}' "$name" 2>/dev/null || echo "not found")

    case "$STATUS" in
        running)
            echo -e "${GREEN}✓ running${NC}"
            ((PASS++))
            ;;
        healthy)
            echo -e "${GREEN}✓ healthy${NC}"
            ((PASS++))
            ;;
        exited|dead)
            echo -e "${RED}✗ $STATUS${NC}"
            ((FAIL++))
            ;;
        *)
            echo -e "${YELLOW}⚠ $STATUS${NC}"
            ((WARN++))
            ;;
    esac
}

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  ZS Exchange 健康检查${NC}"
echo -e "${BLUE}  $(date '+%Y-%m-%d %H:%M:%S')${NC}"
echo -e "${BLUE}========================================${NC}"

# Phase 1
echo -e "\n${BLUE}▶ Phase 1 - 核心服务${NC}"
check_container "zs_postgres"
check_container "zs_redis"
check_container "zs_n8n"
check_container "zs_app"
check_container "zs_adminer"
check_container "zs_redis_insight"

check_endpoint "ZS Web" "http://localhost:3001" "200"
check_endpoint "Adminer" "http://localhost:8081" "200"
check_endpoint "Redis Insight" "http://localhost:8001" "200"
check_endpoint "n8n" "http://localhost:5678" "200"

# Phase 2
if docker ps --format "{{.Names}}" | grep -q "zs_openclaw\|zs_flowable\|zs_mongo\|zs_ai_gateway"; then
    echo -e "\n${BLUE}▶ Phase 2 - 业务引擎${NC}"
    check_container "zs_openclaw"
    check_container "zs_flowable"
    check_container "zs_mongo"
    check_container "zs_ai_gateway"
    check_endpoint "Flowable" "http://localhost:8080" "200"
    check_endpoint "AI Gateway" "http://localhost:8000/health" "200"
fi

# Phase 3
if docker ps --format "{{.Names}}" | grep -q "zs_kafka\|zs_minio\|zs_prometheus\|zs_grafana"; then
    echo -e "\n${BLUE}▶ Phase 3 - 监控/存证/存储${NC}"
    check_container "zs_kafka"
    check_container "zs_minio"
    check_container "zs_prometheus"
    check_container "zs_grafana"
    check_endpoint "MinIO Console" "http://localhost:9001" "200"
    check_endpoint "Prometheus" "http://localhost:9090" "200"
    check_endpoint "Grafana" "http://localhost:3000" "200"
fi

# 资源使用
echo -e "\n${BLUE}▶ 资源使用情况${NC}"
docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}" 2>/dev/null | grep zs_ | head -20

# 总结
echo -e "\n${BLUE}========================================${NC}"
TOTAL=$((PASS + FAIL + WARN))
echo -e "  通过: ${GREEN}$PASS${NC} / 失败: ${RED}$FAIL${NC} / 警告: ${YELLOW}$WARN${NC} / 总: $TOTAL"
echo -e "${BLUE}========================================${NC}"
