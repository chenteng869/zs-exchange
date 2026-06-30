# ZS Exchange × AI 平台 — 风险与回退方案

> **配套文档**: `ZS整合改造计划.md` / `分阶段实施时间表.md`
> **目标**: 识别 10 大风险，量化影响/概率，给出可执行应急/回退方案
> **文档版本**: v1.0
> **创建日期**: 2026-06-11

---

## 一、风险矩阵总览

| 风险 | 影响 | 概率 | 风险分 | 阶段 |
|------|------|------|--------|------|
| R1 容器启动时序 | 高 | 高 | 9 | 1-2 |
| R2 数据库表名冲突 | 高 | 中 | 8 | 1 |
| R3 n8n API 变更 | 中 | 中 | 6 | 2-5 |
| R4 AI 模型服务中断 | 中 | 中 | 6 | 3-5 |
| R5 Fabric 部署失败 | 高 | 中 | 8 | 3 |
| R6 性能压测不达标 | 高 | 中 | 8 | 4-5 |
| R7 安全漏洞 | 高 | 中 | 8 | 全部 |
| R8 关键人员离职 | 中 | 中 | 6 | 全部 |
| R9 浏览器兼容 | 中 | 低 | 4 | 5 |
| R10 业务理解偏差 | 中 | 高 | 8 | 3-4 |

**风险分 = 影响 × 概率（1-10）**

---

## 二、10 大风险详细分析

### R1：容器启动时序问题

| 维度 | 说明 |
|------|------|
| **影响** | 高（外部引擎无法启动 → 全部 130 页面无法工作） |
| **概率** | 高（Docker Compose 启动顺序未经验证） |
| **触发条件** | n8n 在 PostgreSQL 未就绪时启动 → 健康检查失败 → K8s 循环重启 |
| **早期信号** | docker-compose up 部分容器 Exited (1) |
| **缓解措施** | 1) depends_on + health check<br>2) 启动脚本 retry + backoff<br>3) 先启依赖（PG/Redis）再启应用<br>4) 容器内启动时主动 ping 依赖 |
| **应急方案** | 1) 启动失败 → 等待 30s 后手动重启<br>2) 数据库连接失败 → 检查 PG 状态 + 手动同步<br>3) 链路全断 → 启用 mock 模式（保留页面） |
| **回退方案** | 1) 切回纯 mock 模式（仅前端）<br>2) 单独运行 ZS Exchange 业务 + 不依赖引擎的页面<br>3) 启动 + 维护 + 重试循环 |
| **负责人** | 运维 + 后端 |
| **检查频率** | 每次 W2/W3/W4 启动前 |

**启动脚本示例**：

```bash
#!/bin/bash
# start.sh
set -e

echo "==> 1. 启动基础设施"
docker compose up -d postgres redis kafka
echo "==> 等待 PG 就绪"
until docker exec postgres pg_isready -U zs_admin; do
  sleep 2
done

echo "==> 2. 启动外部引擎"
docker compose up -d n8n-main n8n-worker openclaw flowable ai-gateway milvus
echo "==> 等待引擎健康"
sleep 30

echo "==> 3. 健康检查"
for svc in n8n-main openclaw flowable ai-gateway; do
  echo "Checking $svc..."
  for i in {1..10}; do
    if docker exec $svc curl -fsS http://localhost:8080/health; then
      echo "$svc ready"
      break
    fi
    sleep 5
  done
done

echo "==> 4. 启动应用"
docker compose up -d zs-exchange

echo "==> All services started"
```

---

### R2：数据库表名冲突

| 维度 | 说明 |
|------|------|
| **影响** | 高（启动失败 / 数据错乱） |
| **概率** | 中（n8n/Flowable 都有自己的表） |
| **触发条件** | n8n 表 workflow_entity 与 ZS 业务表重名 / Flyway 迁移冲突 |
| **早期信号** | Flyway 报错 "Table already exists" |
| **缓解措施** | 1) 引擎表用独立 schema（n8n. flowable. fabric.）<br>2) Flyway version 控制<br>3) 启动时检查 schema 存在性 |
| **应急方案** | 1) 手动 DROP 冲突表<br>2) 备份 → 重建 → 恢复 |
| **回退方案** | 1) 切回 mock 数据<br>2) 不初始化引擎表 |
| **负责人** | 后端 + 架构 |
| **检查频率** | W2 每日检查 |

**schema 隔离 SQL**：

```sql
-- 创建 schema
CREATE SCHEMA IF NOT EXISTS n8n;
CREATE SCHEMA IF NOT EXISTS flowable;
CREATE SCHEMA IF NOT EXISTS fabric;

-- 设置 search_path
ALTER DATABASE zs_exchange SET search_path TO public, n8n, flowable, fabric;

-- n8n 表迁移到 n8n schema
ALTER TABLE workflow_entity SET SCHEMA n8n;
ALTER TABLE execution_entity SET SCHEMA n8n;
-- ... 其余表

-- 跨 schema JOIN 视图
CREATE OR REPLACE VIEW v_workflow_business AS
SELECT
    m.zs_biz_type,
    e.workflow_id,
    e.status,
    e.created_at
FROM n8n_workflow_mappings m
JOIN n8n.executions e ON e.workflow_id::text = m.n8n_workflow_id;
```

---

### R3：n8n / OpenClaw API 变更

| 维度 | 说明 |
|------|------|
| **影响** | 中（部分页面失效） |
| **概率** | 中（外部项目快速迭代） |
| **触发条件** | n8n 升级到 2.1，workflows API 路径变化 |
| **早期信号** | API 调用 404 / 500 |
| **缓解措施** | 1) 版本锁定（n8n:2.0.0）<br>2) 抽象层 `n8n-client.ts`<br>3) 监控 API 健康度<br>4) 升级前在测试环境验证 |
| **应急方案** | 1) 锁定到上一个稳定版本<br>2) 紧急 patch 客户端 |
| **回退方案** | 1) 回滚 n8n Docker 镜像<br>2) 切回 mock 数据 |
| **负责人** | 后端 |
| **检查频率** | 每月 |

**版本锁定配置**：

```yaml
# docker-compose.yml
services:
  n8n-main:
    image: n8nio/n8n:2.0.0  # 精确版本，不使用 :latest
```

```typescript
// src/lib/n8n-client.ts - 抽象层
export class N8nClient {
  private version: string;
  private baseURL: string;

  constructor(config: { baseURL: string; apiKey: string; version?: string }) {
    this.baseURL = config.baseURL;
    this.version = config.version || '1.0';
  }

  async getWorkflows() {
    // 适配不同版本的 API
    if (this.version === '2.0') {
      return this.get('/api/v1/workflows');
    } else {
      return this.get('/rest/workflows');
    }
  }
}
```

---

### R4：AI 模型服务中断

| 维度 | 说明 |
|------|------|
| **影响** | 中（智能体对话 / 风险评估不可用） |
| **概率** | 中（OpenAI/Claude 偶发中断） |
| **触发条件** | GPT-5 接口 503 / Anthropic 限流 |
| **早期信号** | AI 调用 5xx 比例 > 5% |
| **缓解措施** | 1) 多模型路由（OpenAI + Claude + 通义 + 智谱）<br>2) 智能降级（GPT-5 → Claude → Tongyi → Zhipu）<br>3) 熔断器（10s 内 50% 失败 → 切备用）<br>4) 本地小模型兜底（Qwen 1.5B） |
| **应急方案** | 1) 切到备用模型<br>2) 排队 + 限流<br>3) 暂用规则引擎 |
| **回退方案** | 1) 关键业务保留（KYC 用规则）<br>2) 非关键业务降级为人工 |
| **负责人** | 后端 + 架构 |
| **检查频率** | 实时监控 + 每月演练 |

**多模型路由**：

```python
# src/lib/ai/router.py
class AIRouter:
    def __init__(self):
        self.providers = [
            OpenAIProvider(priority=1, cost=0.06),
            ClaudeProvider(priority=2, cost=0.05),
            TongyiProvider(priority=3, cost=0.005),
            ZhipuProvider(priority=4, cost=0.003),
        ]
        self.circuit_breaker = {}

    async def chat(self, prompt: str, **kwargs):
        last_error = None
        for provider in self.providers:
            # 熔断器检查
            if self.circuit_breaker.get(provider.name, False):
                continue

            try:
                response = await provider.chat(prompt, **kwargs)
                self.reset_circuit(provider.name)
                return response
            except Exception as e:
                last_error = e
                self.record_failure(provider.name)
                # 失败次数 > 5 → 熔断
                if self.failure_count(provider.name) > 5:
                    self.circuit_breaker[provider.name] = True
                continue

        # 全部失败 → 降级
        return await self.fallback(prompt)

    async def fallback(self, prompt: str):
        # 1. 语义缓存
        cached = await semantic_cache.get(prompt)
        if cached:
            return cached
        # 2. 简单问答用规则
        # 3. 复杂任务排队
        raise AIRouterError('All providers failed')
```

---

### R5：Hyperledger Fabric 部署失败

| 维度 | 说明 |
|------|------|
| **影响** | 高（存证失效 → 业务可信度问题） |
| **概率** | 中（Fabric 配置复杂） |
| **触发条件** | 证书生成失败 / peer 启动失败 / chaincode 部署失败 |
| **早期信号** | docker logs fabric-peer 报 panic |
| **缓解措施** | 1) 使用官方 test-network 脚本<br>2) 复用现成 PoC docker-compose<br>3) 文档化部署步骤<br>4) 沙箱环境预演 |
| **应急方案** | 1) 切回 mock 存证<br>2) 简化部署（单 orderer + 1 peer）<br>3) 重新生成证书 |
| **回退方案** | 1) 不部署 Fabric，仅本地签名<br>2) 存证改为 PostgreSQL 表 + 数字签名 |
| **负责人** | 后端 + 运维 |
| **检查频率** | W6/W7 每日 |

**PoC docker-compose**：

```yaml
version: '2'
services:
  fabric-peer:
    image: hyperledger/fabric-peer:2.5
    environment:
      - CORE_PEER_ID=peer0.org1.example.com
      - CORE_PEER_ADDRESS=peer0.org1.example.com:7051
      - CORE_PEER_GOSSIP_BOOTSTRAP=peer0.org1.example.com:7051
      - CORE_PEER_LOCALMSPID=Org1MSP
      - CORE_VM_ENDPOINT=unix:///var/run/docker.sock
      - CORE_VM_DOCKER_HOSTCONFIG_NETWORKMODE=fabric_default
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
    ports:
      - "7051:7051"

  fabric-orderer:
    image: hyperledger/fabric-orderer:2.5
    environment:
      - ORDERER_GENERAL_LISTENADDRESS=0.0.0.0
      - ORDERER_GENERAL_GENESISMETHOD=file
      - ORDERER_GENERAL_GENESISFILE=/var/hyperledger/orderer/genesis.block
    ports:
      - "7050:7050"
```

---

### R6：性能压测不达标

| 维度 | 说明 |
|------|------|
| **影响** | 高（无法上线 / 用户体验差） |
| **概率** | 中（50 并发是个挑战） |
| **触发条件** | API P95 > 1s / 50 并发智能体掉线 |
| **早期信号** | 压测中错误率 > 1% / 响应时间 > 3s |
| **缓解措施** | 1) 早期压测（W5 末尾）<br>2) 持续 profiling<br>3) 性能预算（每个接口 < 500ms）<br>4) 容量评估（DB / Redis / 网络） |
| **应急方案** | 1) 紧急扩容（n8n worker + 5）<br>2) 优化瓶颈（DB 索引 / 缓存）<br>3) 异步化（同步 → 队列） |
| **回退方案** | 1) 降级非核心功能<br>2) 限流保护<br>3) 推迟上线，延期 1 周 |
| **负责人** | 后端 + 测试 + SRE |
| **检查频率** | W5 每日 |

**性能优化 Playbook**：

```
P95 > 1s 时的排查顺序：
1. 慢查询日志 → 加索引
2. Redis 命中率 → 调整 TTL
3. n8n worker 数 → 扩容
4. DB 连接池 → 调大
5. AI 模型 → 启用缓存
6. WS 推送 → 批量
7. 整体 → 加机器

50 并发掉线时：
1. 增加 n8n worker 副本 5 → 10
2. 调整 OpenClaw 并发配置
3. 增加 AI gateway 实例
4. 调整 Kafka 分区数
5. 启用熔断
```

---

### R7：安全漏洞

| 维度 | 说明 |
|------|------|
| **影响** | 高（数据泄露 / 资金损失） |
| **概率** | 中（OWASP Top 10 风险普遍） |
| **触发条件** | SQL 注入 / XSS / CSRF / 越权 / 密钥泄露 |
| **早期信号** | OWASP ZAP 扫描告警 / 渗透测试发现 |
| **缓解措施** | 1) SAST + DAST 集成 CI<br>2) 输入验证（zod）<br>3) 输出转义<br>4) RBAC + Scope<br>5) 密钥用 KMS<br>6) 定期渗透测试 |
| **应急方案** | 1) 立即修复高危<br>2) 临时封禁可疑 IP<br>3) 强制改密<br>4) 通知用户 |
| **回退方案** | 1) 关停受影响功能<br>2) 切回只读模式 |
| **负责人** | 安全 + 后端 |
| **检查频率** | 每次 PR + 每周扫描 |

**安全检查清单**：

```
每日自动：
- [ ] SAST (SonarQube)
- [ ] SCA (Trivy)
- [ ] 依赖漏洞检查
- [ ] 密钥泄露扫描 (TruffleHog)

每周：
- [ ] DAST (OWASP ZAP)
- [ ] 渗透测试脚本
- [ ] 安全日志审计

每月：
- [ ] 渗透测试（外部团队）
- [ ] 安全培训
- [ ] 漏洞复盘
```

---

### R8：关键人员离职

| 维度 | 说明 |
|------|------|
| **影响** | 中（开发进度延迟） |
| **概率** | 中（项目 11 周，人员流动正常） |
| **触发条件** | 架构师 / 核心后端 / 核心前端离职 |
| **早期信号** | 提离职申请 / 工作产出下降 |
| **缓解措施** | 1) 知识共享（每周技术分享）<br>2) Pair Programming<br>3) 文档完整（ADR / 设计文档）<br>4) 双人备份（每个模块 2 人懂） |
| **应急方案** | 1) 紧急招聘<br>2) 内部调动<br>3) 外包补充 |
| **回退方案** | 1) 缩减范围（砍 P2 需求）<br>2) 延期 1-2 周 |
| **负责人** | PM + HR |
| **检查频率** | 每月 1:1 |

**关键人员备份矩阵**：

| 角色 | 主 | 备 1 | 备 2 |
|------|----|------|------|
| 架构师 | 张架构 | 李架构 | 王架构 |
| 后端核心 1 | 张后端 | 李后端 | 外包 A |
| 后端核心 2 | 李后端 | 王后端 | 外包 B |
| 前端核心 1 | 张前端 | 李前端 | 外包 C |
| 前端核心 2 | 李前端 | 王前端 | 外包 C |
| 运维 | 张运维 | 阿里云代维 | - |
| 测试 | 张测试 | 李测试 | - |

---

### R9：浏览器兼容问题

| 维度 | 说明 |
|------|------|
| **影响** | 中（部分用户无法使用） |
| **概率** | 低（主流浏览器已支持） |
| **触发条件** | 360 浏览器 / 旧版 Safari 出现 polyfill 缺失 |
| **早期信号** | 浏览器测试报告失败 |
| **缓解措施** | 1) Playwright 跨浏览器测试<br>2) Babel + core-js polyfill<br>3) 渐进增强<br>4) 兼容性矩阵 |
| **应急方案** | 1) 提示用户升级浏览器<br>2) 单独 polyfill |
| **回退方案** | 1) 切回旧版本<br>2) 仅支持 Chrome / Edge |
| **负责人** | 前端 |
| **检查频率** | 每次发版 |

**兼容性矩阵**：

```yaml
browser_matrix:
  chrome: ">=100"
  edge: ">=100"
  firefox: ">=100"
  safari: ">=15"
  opera: ">=90"

  # 不支持
  ie: "all"  # 全部不支持
  chrome: "<80"  # 旧版不支持
```

---

### R10：业务理解偏差

| 维度 | 说明 |
|------|------|
| **影响** | 中（功能不符合预期） |
| **概率** | 高（130 页面 × 11 周，需求变更频繁） |
| **触发条件** | 业务方需求变更 / 原型理解错误 |
| **早期信号** | UAT 阶段大量返工 |
| **缓解措施** | 1) 需求评审（每模块开始前）<br>2) 原型确认（PM + 业务方）<br>3) 敏捷迭代（2 周一版本）<br>4) 早期 Demo（每周五） |
| **应急方案** | 1) 紧急变更（架构层面）<br>2) 砍需求<br>3) 延期 |
| **回退方案** | 1) 保留旧版本<br>2) 双版本切换 |
| **负责人** | PM + 业务方 |
| **检查频率** | 每日站会 + 每周评审 |

**需求变更控制**：

```yaml
# 变更控制
changes:
  p0:  # 影响核心流程
    approval: [CTO, PM, 业务负责人]
    impact: "可能延期"

  p1:  # 影响次要功能
    approval: [PM, 业务负责人]
    impact: "纳入下个迭代"

  p2:  # 体验优化
    approval: [PM]
    impact: "backlog 排序"

  p3:  # 建议
    approval: [PM]
    impact: "评估"
```

---

## 三、阶段风险专项

### 3.1 阶段 1（W2-W3）：基础设施

| 风险 | 概率 | 应急 |
|------|------|------|
| Docker Compose 启动失败 | 高 | 启动脚本 + retry |
| PG 迁移冲突 | 中 | 备份回滚 |
| 鉴权 token 失效 | 中 | 缓存 + 刷新 |

### 3.2 阶段 2（W4-W5）：n8n + OpenClaw

| 风险 | 概率 | 应急 |
|------|------|------|
| n8n API 变更 | 中 | 抽象层 |
| WS 频繁断连 | 中 | 心跳 + 重连 |
| 业务事件未触发 | 中 | 死信队列 + 重试 |

### 3.3 阶段 3（W6-W7）：AI + 区块链 + BPM

| 风险 | 概率 | 应急 |
|------|------|------|
| Fabric 部署失败 | 中 | 简化部署 + mock |
| AI 模型中断 | 中 | 多模型 + 降级 |
| BPM 流程错误 | 中 | 沙箱测试 |

### 3.4 阶段 4（W8-W9）：业务深度

| 风险 | 概率 | 应急 |
|------|------|------|
| 撮合引擎压力 | 中 | 限流 + 队列 |
| 链上 API 限流 | 中 | 多 RPC 节点 |
| 数据量太大 | 中 | 聚合 + 缓存 |

### 3.5 阶段 5（W10）：性能 + 验收

| 风险 | 概率 | 应急 |
|------|------|------|
| 50 并发不达标 | 中 | 紧急扩容 |
| 72h 故障 | 中 | 立即修复 + 重跑 |
| 安全漏洞 | 中 | 紧急修复 + 灰度暂停 |

### 3.6 阶段 6（W11）：上线

| 风险 | 概率 | 应急 |
|------|------|------|
| 生产事故 | 低 | 立即回滚 |
| 性能瓶颈 | 中 | 紧急扩容 |
| 用户投诉 | 中 | 客服 + 运营 |

---

## 四、回退方案

### 4.1 总体回退策略

```
┌────────────────────────────────────────┐
│  灰度发布 + 监控告警 + 自动回滚          │
└────────────────────────────────────────┘
       ↓
┌────────────────────────────────────────┐
│  触发条件（任一）                       │
│  - 错误率 > 5%                         │
│  - P95 > 3s                            │
│  - P0 故障                             │
│  - 关键功能失效                         │
└────────────────────────────────────────┘
       ↓
┌────────────────────────────────────────┐
│  回退步骤                              │
│  1. 切流量到旧版本 (30s)               │
│  2. 告警 (PM / SRE)                   │
│  3. 排查 (15min 内)                   │
│  4. 修复或回滚                         │
│  5. 重新灰度                           │
└────────────────────────────────────────┘
```

### 4.2 分级回退

| 级别 | 范围 | 时间 | 触发 |
|------|------|------|------|
| L1 | 单页面回滚 | 5min | 页面报错 |
| L2 | 单模块回滚 | 15min | 模块错误率 > 5% |
| L3 | 单引擎回滚 | 30min | 引擎故障 |
| L4 | 全量回滚 | 60min | 整体错误率 > 10% |

### 4.3 回退命令

```bash
# 1. L1 - 单页面回滚
./rollback.sh page=/admin/n8n/editor

# 2. L2 - 单模块回滚
./rollback.sh module=n8n

# 3. L3 - 单引擎回滚
./rollback.sh engine=n8n

# 4. L4 - 全量回滚
./rollback.sh all
```

### 4.4 数据回滚

```sql
-- 数据库回滚（Flyway）
flyway undo -repeatableMigrations=10

-- 单表回滚
CREATE TABLE orders_backup_20260615 AS SELECT * FROM orders;
-- 恢复
DROP TABLE orders;
ALTER TABLE orders_backup_20260615 RENAME TO orders;
```

### 4.5 配置回滚

```bash
# 1. 备份当前配置
cp .env.production .env.production.backup

# 2. 恢复上一版本
git checkout HEAD~1 -- .env.production

# 3. 重启
docker compose restart
```

---

## 五、决策树

### 5.1 上线决策树

```
是否通过 W10 验收？
├── 是 → 100% 灰度
│        ↓
│   监控 7×24
│        ↓
│   稳定运行 7 天 → 正式上线
│
└── 否 → 评估问题严重程度
         ├── 性能不达标 → 延期 1 周 + 调优
         ├── 安全漏洞 → 立即修复 + 重新验收
         ├── 功能缺失 → 砍需求或延期
         └── 测试不通过 → 紧急修复
```

### 5.2 引擎决策树

```
n8n 故障？
├── 是 → 切到 mock 模式
│        ↓
│   n8n 业务影响？
│   ├── 仅工作流执行 → 排队 + 人工
│   ├── KYC 触发 → 切到 BPM 直连
│   └── 提现触发 → 切到 BPM 直连
│
└── 否 → 继续

OpenClaw 故障？
├── 是 → 切到 LangChain 备用
│        ↓
│   智能体功能影响？
│   ├── 对话 → 切到 GPT-5 直连
│   ├── 多智能体 → 排队 + 串行
│   └── 训练 → 推迟
│
└── 否 → 继续

AI 模型故障？
├── 是 → 切到备用模型
│        ↓
│   备用也故障？
│   ├── 是 → 排队 + 限流 + 切本地小模型
│   └── 否 → 继续
│
└── 否 → 继续

Fabric 故障？
├── 是 → 启用本地签名模式
│        ↓
│   影响？
│   ├── 仅存证 → 不影响业务（凭证本地有效）
│   ├── 验证 → 切到本地验证
│   └── 上链 → 排队重试
│
└── 否 → 继续
```

---

## 六、应急联系人

| 角色 | 姓名 | 电话 | 邮箱 | 备份 |
|------|------|------|------|------|
| PM | 张三 | 138-0000-0001 | pm@zs.exchange | 李四 |
| 架构师 | 王五 | 138-0000-0002 | arch@zs.exchange | 赵六 |
| 后端 Lead | 钱七 | 138-0000-0003 | be@zs.exchange | 孙八 |
| 前端 Lead | 周九 | 138-0000-0004 | fe@zs.exchange | 吴十 |
| 测试 Lead | 郑十一 | 138-0000-0005 | qa@zs.exchange | 王十二 |
| SRE | 冯十三 | 138-0000-0006 | sre@zs.exchange | - |
| 业务负责人 | 陈十四 | 138-0000-0007 | biz@zs.exchange | - |
| CTO | 褚十五 | 138-0000-0008 | cto@zs.exchange | - |

---

## 七、On-Call 排班

```
7×24 覆盖：
- 主值班 1 人（9:00-21:00）
- 副值班 1 人（21:00-9:00）
- 周末 2 人轮值
- 每周轮换

P0 告警：电话通知主 + 副 + PM
P1 告警：飞书通知主
P2 告警：飞书群
P3 告警：邮件
```

---

## 八、风险监控看板

### 8.1 Prometheus 指标

```yaml
# alerts.yml
groups:
- name: zs-ai-integration
  rules:
  - alert: HighErrorRate
    expr: |
      sum(rate(http_requests_total{status=~"5.."}[5m]))
      / sum(rate(http_requests_total[5m])) > 0.05
    for: 5m
    labels:
      severity: P0
    annotations:
      summary: "API 错误率 > 5%"

  - alert: SlowResponse
    expr: |
      histogram_quantile(0.95, sum(rate(http_duration_seconds_bucket[5m])) by (le, path))
      > 3
    for: 5m
    labels:
      severity: P1
    annotations:
      summary: "API P95 > 3s"

  - alert: AgentDown
    expr: up{job=~"openclaw|n8n|flowable"} == 0
    for: 1m
    labels:
      severity: P0
    annotations:
      summary: "智能体引擎宕机"

  - alert: NotarizeFailure
    expr: |
      sum(rate(notarize_total{status="failed"}[5m]))
      / sum(rate(notarize_total[5m])) > 0.01
    for: 5m
    labels:
      severity: P1
    annotations:
      summary: "存证失败率 > 1%"
```

### 8.2 飞书告警机器人

```typescript
// src/lib/alert.ts
import axios from 'axios';

export async function sendFeishuAlert(level: string, title: string, content: any) {
  await axios.post(process.env.FEISHU_WEBHOOK!, {
    msg_type: 'interactive',
    card: {
      header: {
        title: { tag: 'plain', content: `[${level}] ${title}` },
        template: level === 'P0' ? 'red' : level === 'P1' ? 'orange' : 'blue',
      },
      elements: [
        {
          tag: 'div',
          text: { tag: 'lark_md', content: formatContent(content) },
        },
        {
          tag: 'action',
          actions: [
            {
              tag: 'button',
              text: { tag: 'plain', content: '查看详情' },
              url: `${process.env.GRAFANA_URL}/d/xxx`,
              type: 'primary',
            },
          ],
        },
      ],
    },
  });
}
```

---

## 九、复盘机制

### 9.1 P0/P1 故障必复盘

```
故障时间线：
- T+0: 故障发生
- T+5min: 告警
- T+10min: 确认
- T+15min: 升级
- T+30min: 缓解
- T+1h: 恢复
- T+24h: 复盘会议
```

### 9.2 复盘文档模板

```markdown
# 故障复盘 — [标题]

## 故障概要
- 时间：
- 等级：P0 / P1
- 影响范围：
- 持续时间：
- MTTR：

## 时间线
- T+0: ...
- T+5: ...

## 根本原因
5 Why 分析：
1. 为什么？
2. 为什么？
...

## 改进措施
| # | 措施 | 负责人 | 截止 |
|---|------|--------|------|
| 1 | | | |

## 经验教训
1. ...
2. ...
```

---

## 十、附录

### A. 风险登记表

| ID | 风险 | 影响 | 概率 | 风险分 | 状态 | 负责人 |
|----|------|------|------|--------|------|--------|
| R1 | 容器启动 | 高 | 高 | 9 | 监控中 | 运维 |
| R2 | DB 冲突 | 高 | 中 | 8 | 缓解中 | 后端 |
| R3 | API 变更 | 中 | 中 | 6 | 缓解中 | 后端 |
| R4 | AI 中断 | 中 | 中 | 6 | 缓解中 | 后端 |
| R5 | Fabric 失败 | 高 | 中 | 8 | 缓解中 | 后端 |
| R6 | 性能不达标 | 高 | 中 | 8 | 监控中 | 测试 |
| R7 | 安全漏洞 | 高 | 中 | 8 | 监控中 | 安全 |
| R8 | 人员离职 | 中 | 中 | 6 | 缓解中 | PM |
| R9 | 浏览器兼容 | 中 | 低 | 4 | 缓解中 | 前端 |
| R10 | 业务偏差 | 中 | 高 | 8 | 监控中 | PM |

### B. 应急检查清单

```
- [ ] 备份：每日 3 次
- [ ] 监控：7×24
- [ ] 告警：飞书 + 短信 + 电话
- [ ] On-Call：7×24
- [ ] 文档：完整 + 最新
- [ ] 演练：每月 1 次
- [ ] 复盘：P0/P1 必做
```

### C. 版本历史
- v1.0 (2026-06-11): 初始版本
