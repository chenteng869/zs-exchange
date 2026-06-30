# ZS Exchange × AI 自动化平台 — 两系统协同整合方案 v1.0

> **项目代号**: ZS-AI Integration
> **整合目标**: 把"AI 自动化解决方案（v1）"无缝嵌入"ZS Exchange（中萨数字科技交易所）"
> **文档版本**: v1.0
> **创建日期**: 2026-06-09
> **核心原则**: 复用 > 重构，共用 UI 组件库 / API 网关 / 数据库 / 鉴权 / 设计系统

---

## 一、整合战略

### 1.1 核心结论

**🎉 重大发现：ZS Exchange 后台已经预留了所有需要的模块！**

通过扫描 `/src/app/admin/` 目录，发现 ZS Exchange 在设计阶段已经预置了完整的 AI 自动化所需模块，**不需要从零开发**：

| AI 自动化所需模块 | ZS Exchange 已存在 | 路径 |
|------------------|-------------------|------|
| **n8n 工作流平台** | ✅ 已存在 | `/admin/n8n/` (4 个子页) |
| **OpenClaw 智能体** | ✅ 已存在 | `/admin/openclaw/` (4 个子页) |
| **区块链存证** | ✅ 已存在 | `/admin/blockchain/evidence-chain/` |
| **BPM 流程引擎** | ✅ 已存在 | `/admin/bpm/` (4 个子页) |
| **AI 大模型管理** | ✅ 已存在 | `/admin/ai-llm/` (5 个子页) + `/admin/ai-center/` (7 个子页) |
| **全球分销/获客** | ✅ 已存在 | `/admin/dsales/` (5 个子页) |
| **审计日志** | ✅ 已存在 | `/admin/audit-logs/` |
| **统一鉴权** | ✅ 已存在 | Zustand authStore + AdminLayout RBAC |

**这意味着**: AI 自动化平台的"管理后台" 80% 可以直接复用 ZS Exchange Admin！

### 1.2 整合策略

```
┌─────────────────────────────────────────────────────────────┐
│              ZS Exchange 中萨数字科技交易所                   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  C端 (Public)         │     B端 (Admin)             │   │
│  │  ├ 官网首页 /markets  │  ├ 130+ 管理页             │   │
│  │  ├ 交易 /trade/*      │  ├ 数据中心 dashboard      │   │
│  │  ├ DeFi/NFT/IDO       │  ├ CEX/DEX/DeFi 业务管理   │   │
│  │  ├ 用户中心 /user/*   │  ├ AI 中心 /admin/ai-*    │   │
│  │  └ 钱包 /user/wallet  │  ├ n8n  /admin/n8n/*     │   │
│  │                       │  ├ OpenClaw /admin/openclaw│   │
│  │                       │  ├ 区块链 /admin/blockchain│   │
│  │                       │  ├ BPM  /admin/bpm/*      │   │
│  │                       │  └ 获客 /admin/dsales/*   │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            ↕ 共享基础设施
┌─────────────────────────────────────────────────────────────┐
│  共享基础设施 (Shared Infrastructure)                         │
│  ├ 鉴权: Zustand authStore + JWT                            │
│  ├ UI 库: Ant Design 5 + Tailwind + design-taste tokens     │
│  ├ 设计: tokens.ts / globals.css (已重做)                    │
│  ├ 数据: TanStack Query + mock API                          │
│  ├ 监控: Ant Design ProCharts + ECharts                     │
│  └ 部署: Next.js 14 (现有) + n8n Docker (新增)              │
└─────────────────────────────────────────────────────────────┘
                            ↕ 通过 API 网关
┌─────────────────────────────────────────────────────────────┐
│  外部引擎 (External Engines) — Docker 部署                   │
│  ├ n8n v2.0 (Queue Mode)        : 5678                      │
│  ├ OpenClaw Gateway v3.8        : 18789                     │
│  ├ Flowable BPM 7.x             : 8080                      │
│  ├ AI Model Gateway (FastAPI)   : 8000                      │
│  ├ Hyperledger Fabric (PoC)     : 7050/7051                 │
│  └ Milvus 2.x                   : 19530                     │
└─────────────────────────────────────────────────────────────┘
```

### 1.3 整合三大原则

| 原则 | 说明 | 收益 |
|------|------|------|
| **复用优先** | 优先使用 ZS Exchange 已有组件/页面 | 节省 60% 工作量 |
| **数据打通** | 共享同一套 PostgreSQL + Redis + Mongo | 避免数据孤岛 |
| **统一品牌** | 统一使用 ZS Exchange 视觉规范 | 保持品牌一致 |

---

## 二、模块映射关系（核心）

### 2.1 完整映射表

| AI 自动化方案 v1 章节 | ZS Exchange 对应模块 | 复用度 | 整合动作 |
|----------------------|----------------------|--------|----------|
| **3.1 OpenClaw × n8n 集成** | `/admin/openclaw/` + `/admin/n8n/` | 80% | API 对接 + 真实数据接入 |
| **3.2 AI 大模型网关** | `/admin/ai-llm/model-management/` | 70% | 接入 GPT-5/Claude API |
| **3.3 区块链存证 + DID** | `/admin/blockchain/evidence-chain/` | 60% | 接入 Hyperledger Fabric |
| **3.4 AI 全球获客** | `/admin/dsales/` | 50% | 接入 TikTok/Douyin API |
| **4. BPM 工作流引擎** | `/admin/bpm/` | 70% | 接入 Flowable 7.x |
| **5. 数据库设计** | 共享 PostgreSQL | 100% | 扩展表结构 |
| **6. 部署与运维** | Next.js (已有) + Docker (新增) | 30% | K8s + Docker Compose |

### 2.2 复用 vs 新增工作量评估

```
                    复用 (已存在)        新增 (待开发)         整合 (对接)
工作流 n8n         ████████░░  80%      ██░░░░░░░░  20%     ██░░░░░░░░  20%
智能体 OpenClaw    ████████░░  80%      ██░░░░░░░░  20%     ████░░░░░░  40%
AI 大模型          ███████░░░  70%      ███░░░░░░░  30%     ███░░░░░░░  30%
区块链存证         ██████░░░░  60%      ████░░░░░░  40%     ████░░░░░░  40%
BPM 流程           ███████░░░  70%      ███░░░░░░░  30%     ███░░░░░░░  30%
AI 获客            █████░░░░░  50%      █████░░░░░  50%     ████░░░░░░  40%
─────────────────────────────────────────────────────────────────
平均                ██████░░░░  68%      ███░░░░░░░  32%     ███░░░░░░░  33%
```

**结论**: 整体工作量减少 60-70%，原方案中估算的 18-24 周可压缩到 **8-12 周**。

---

## 三、整合架构

### 3.1 总体架构图

```
┌─────────────────────────────────────────────────────────────────┐
│                       用户层                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ C端用户      │  │ 运营人员     │  │ 管理员        │          │
│  │ (官网/App)   │  │ (BPM 审批)  │  │ (管理后台)   │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────────┐
│                   ZS Exchange 现有应用层                          │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Next.js 14 App Router (Port 3003 C端 / 3001 B端)         │  │
│  │  - C端 27+ 页面 (官网/交易/DeFi/钱包)                     │  │
│  │  - B端 130+ 管理页 (含 n8n/OpenClaw/AI/BPM/区块链)        │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                          ↓ API Calls
┌─────────────────────────────────────────────────────────────────┐
│              API 网关层 (新增 NestJS API Gateway)                │
│  - 统一鉴权 (JWT + RBAC)                                        │
│  - 限流 / 路由 / 协议转换                                        │
│  - 代理到外部引擎                                                │
└─────────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────────┐
│              外部引擎层 (Docker Compose 部署)                     │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐         │
│  │  n8n     │ │ OpenClaw │ │ Flowable │ │ AI Model │         │
│  │  :5678   │ │  :18789  │ │  :8080   │ │  :8000   │         │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘         │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐                      │
│  │Hyperledger│ │ Milvus  │ │ MinIO    │                      │
│  │  :7050   │ │  :19530  │ │  :9000   │                      │
│  └──────────┘ └──────────┘ └──────────┘                      │
└─────────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────────┐
│              数据层 (共享)                                       │
│  PostgreSQL · Redis · MongoDB · Milvus · Kafka · Fabric          │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 关键整合点

**整合点 1: 鉴权统一**
```typescript
// 现有: ZS Exchange authStore
import { useAuthStore } from '@/stores/authStore';

// 新增: 外部引擎鉴权代理
// /api/auth/external-token - 生成 n8n/OpenClaw/Flowable 的访问令牌
```

**整合点 2: 实时数据推送**
```typescript
// 现有: useMockWebSocket 模拟 WebSocket
// 升级: 接入真实 n8n WebSocket + Kafka 消费
// /api/ws/notifications - 统一推送所有引擎事件
```

**整合点 3: 设计系统复用**
```typescript
// 现有: tokens.ts + globals.css + Ant Design 5
// 复用: 所有外部引擎管理页都用同一套设计
```

**整合点 4: 数据库共享**
```
PostgreSQL 单一实例服务:
  - ZS Exchange 业务表 (users, orders, trades...)
  - n8n 表 (workflow_entity, execution_entity...)
  - OpenClaw 表 (agents, sessions, memories...)
  - Flowable 表 (ACT_RU_*, ACT_HI_*...)
  - AI Model 表 (model_configs, llm_logs...)
  - Fabric 存证表 (blockchain_notarizations...)
```

---

## 四、模块详细整合方案

### 4.1 n8n 模块整合

**现有** (`/admin/n8n/`):
```
├─ editor/        工作流编辑器
├─ history/       执行历史
├─ templates/     模板库
└─ triggers/      触发器管理
```

**整合动作**:

| 步骤 | 工作内容 | 工作量 |
|------|----------|--------|
| 1 | 在 ZS Exchange 项目根目录新增 `docker-compose.yml`，包含 n8n + Redis + PostgreSQL | 1 天 |
| 2 | 实现 `/api/n8n/proxy` 代理路由，转发 ZS Exchange → n8n API | 2 天 |
| 3 | 实现 WebSocket 代理 `/api/ws/n8n`，让前端订阅 n8n 执行状态 | 1 天 |
| 4 | 改造 `/admin/n8n/editor/page.tsx`，从 mock 切换到真实 n8n API | 3 天 |
| 5 | 改造 `/admin/n8n/history/page.tsx`，展示真实执行记录 | 2 天 |
| 6 | 改造 `/admin/n8n/templates/page.tsx`，从 n8n 官方模板库拉取 | 2 天 |
| 7 | 在 ZS Exchange 启动时自动启动 Docker Compose | 1 天 |

**新增文件**:
```
docker-compose.yml                         # n8n + Redis + PG 服务编排
src/app/api/n8n/proxy/route.ts             # n8n API 代理
src/app/api/ws/n8n/route.ts                # WebSocket 代理
src/lib/n8n-client.ts                      # n8n 客户端封装
src/types/n8n.ts                           # n8n 类型定义
```

### 4.2 OpenClaw 模块整合

**现有** (`/admin/openclaw/`):
```
├─ marketplace/        智能体市场
├─ monitor-dashboard/  监控仪表盘
├─ orchestration/      编排
└─ training/           训练
```

**整合动作**:
| 步骤 | 工作内容 | 工作量 |
|------|----------|--------|
| 1 | 部署 OpenClaw Gateway (Docker) | 1 天 |
| 2 | 实现 `/api/openclaw/proxy` 路由 | 2 天 |
| 3 | 实现 WebSocket 代理 `/api/ws/openclaw` (端口 18789) | 1 天 |
| 4 | 改造 4 个 OpenClaw 子页面，从 mock 切真实 | 4 天 |
| 5 | 实现"ZS Exchange 业务 → OpenClaw 智能体"触发器 | 3 天 |

**关键交互**:
```typescript
// 用户在 ZS Exchange 提交 KYC → 触发 OpenClaw "合规审核智能体"
const agent = openclaw.createAgent({
  name: 'KYC审核',
  skills: ['face-recognition', 'document-ocr', 'risk-scoring'],
  trigger: 'kyc.submitted',
});

await openclaw.execute(agent, {
  userId: 'U-12345',
  documents: [...]
});
```

### 4.3 区块链存证模块整合

**现有** (`/admin/blockchain/`):
```
├─ evidence-chain/    存证链 (已有 mock 数据)
├─ explorer/          区块浏览器
├─ node-management/   节点管理
└─ smart-contract/    智能合约
```

**整合动作**:
| 步骤 | 工作内容 | 工作量 |
|------|----------|--------|
| 1 | 部署 Hyperledger Fabric (PoC: 单 orderer + 2 peer) | 3 天 |
| 2 | 实现 `/api/blockchain/notarize` 接口，异步上链 | 3 天 |
| 3 | 改造 `/admin/blockchain/evidence-chain/page.tsx` | 3 天 |
| 4 | ZS Exchange 关键业务自动上链: 交易、合同、KYC | 5 天 |

**关键集成**:
```typescript
// ZS Exchange 关键操作自动存证
async function notarize(bizType: string, bizId: string, data: any) {
  // 1. 生成 SHA256 哈希
  const hash = sha256(JSON.stringify(data));
  
  // 2. 内部凭证（立即返回，< 100ms）
  const cert = generateLocalCert(hash, bizId);
  
  // 3. 异步上链（不阻塞业务流程）
  fabric.submitTransaction('Notarize', hash, bizId).catch(logError);
  
  return cert;
}
```

### 4.4 BPM 模块整合

**现有** (`/admin/bpm/`):
```
├─ analysis/      流程分析
├─ modeling/      流程建模
├─ monitoring/    监控
└─ runtime/       运行时
```

**整合动作**:
| 步骤 | 工作内容 | 工作量 |
|------|----------|--------|
| 1 | 部署 Flowable 7.x (Docker) | 1 天 |
| 2 | 改造 BPM 4 个子页面，调用真实 Flowable REST API | 5 天 |
| 3 | 实现 ZS Exchange 业务流程：提现审批、Listing 审批、合规审查 | 5 天 |
| 4 | 飞书/钉钉审批通知集成 | 3 天 |

### 4.5 AI 大模型模块整合

**现有** (`/admin/ai-llm/` + `/admin/ai-center/`):
```
ai-llm/             ai-center/
├─ cost-analysis    ├─ config
├─ model-management ├─ hazard-detection
├─ prompt-engineering ├─ knowledge-graph
├─ recommendation   ├─ model-management
└─ intelligent-recognition ├─ risk-prediction
                      ├─ smart-decision
                      └─ voice-interaction
```

**整合动作**:
| 步骤 | 工作内容 | 工作量 |
|------|----------|--------|
| 1 | 部署 AI Model Gateway (FastAPI) | 3 天 |
| 2 | 接入 GPT-5/Claude/MiniMax/通义/智谱 API | 2 天 |
| 3 | 实现语义缓存 (Milvus) + 智能降级 | 3 天 |
| 4 | 改造 12 个 AI 子页面 | 7 天 |
| 5 | 接入真实业务：智能客服、风控、推荐、内容生成 | 5 天 |

### 4.6 AI 全球获客模块整合

**现有** (`/admin/dsales/`):
```
├─ commission/   佣金管理
├─ compliance/   合规
├─ network/      代理网络
├─ products/     产品
└─ training/     培训
```

**整合动作**:
| 步骤 | 工作内容 | 工作量 |
|------|----------|--------|
| 1 | 部署 Kafka + Flink 实时计算 | 3 天 |
| 2 | 接入 TikTok/Douyin/Xiaohongshu API | 5 天 |
| 3 | 实现"AI 策略推荐"智能体 | 5 天 |
| 4 | 实时获客看板 | 3 天 |

---

## 五、共享基础设施

### 5.1 鉴权统一

```typescript
// 现有: /src/stores/authStore.ts (Zustand)
interface AuthState {
  user: User | null;
  token: string | null;
  permissions: string[];
  login: (credentials) => Promise<void>;
  logout: () => void;
}

// 新增: 统一外部引擎 token 管理
interface ExternalTokens {
  n8n: string;
  openclaw: string;
  flowable: string;
  fabric: string;
}

// 新增 API: /api/auth/external-token
// 用途: 一次性返回所有外部引擎的访问令牌
```

### 5.2 数据库 Schema 扩展

```sql
-- 1. n8n 集成表
CREATE TABLE n8n_workflow_mappings (
    id BIGSERIAL PRIMARY KEY,
    zs_biz_type VARCHAR(64),  -- ZS 业务类型 (如 'kyc'/'withdraw'/'listing')
    n8n_workflow_id VARCHAR(64),
    trigger_config JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. OpenClaw 智能体表
CREATE TABLE openclaw_agents (
    id BIGSERIAL PRIMARY KEY,
    agent_id VARCHAR(64) UNIQUE NOT NULL,
    name VARCHAR(128),
    type VARCHAR(32),  -- chat/task/workflow
    model VARCHAR(32),
    skills JSONB,
    config JSONB,
    status VARCHAR(16) DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. AI 模型调用日志表
CREATE TABLE ai_llm_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id VARCHAR(64),
    agent_id VARCHAR(64),
    model VARCHAR(32),
    prompt_tokens INT,
    completion_tokens INT,
    total_tokens INT,
    cost_usd DECIMAL(10,6),
    latency_ms INT,
    cache_hit BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. 区块链存证表（已有，需扩展）
ALTER TABLE blockchain_notarizations 
ADD COLUMN fabric_tx_id VARCHAR(128),
ADD COLUMN fabric_block_num BIGINT,
ADD COLUMN notarization_status VARCHAR(16) DEFAULT 'pending';

-- 5. BPM 流程实例映射表
CREATE TABLE bpm_process_mappings (
    id BIGSERIAL PRIMARY KEY,
    zs_biz_type VARCHAR(64),
    flowable_process_key VARCHAR(128),
    flowable_instance_id VARCHAR(128),
    status VARCHAR(32),
    started_at TIMESTAMPTZ,
    ended_at TIMESTAMPTZ
);

-- 6. 获客数据表
CREATE TABLE customer_acquisition_logs (
    id BIGSERIAL PRIMARY KEY,
    platform VARCHAR(32),
    account_id VARCHAR(64),
    content_id VARCHAR(64),
    views BIGINT,
    engagements BIGINT,
    conversions INT,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 5.3 共享 Docker Compose

**新增**: `docker-compose.dev.yml` (开发环境)
```yaml
version: '3.8'
services:
  # n8n 工作流
  n8n-main:
    image: n8nio/n8n:2.0
    ports: ["5678:5678"]
    environment:
      - DB_TYPE=postgresdb
      - DB_POSTGRESDB_HOST=postgres
      - EXECUTIONS_MODE=queue
      - QUEUE_BULL_REDIS_HOST=redis
    depends_on: [postgres, redis]

  n8n-worker:
    image: n8nio/n8n:2.0
    command: n8n worker --concurrency=10
    environment:
      - EXECUTIONS_MODE=queue
      - DB_TYPE=postgresdb
      - DB_POSTGRESDB_HOST=postgres
    deploy:
      replicas: 3
    depends_on: [postgres, redis]

  # OpenClaw 智能体
  openclaw-gateway:
    image: openclaw/gateway:3.8
    ports: ["18789:18789"]
    environment:
      - N8N_BASE_URL=http://n8n-main:5678
    depends_on: [n8n-main]

  # Flowable BPM
  flowable:
    image: flowable/flowable-rest:7.0.0
    ports: ["8080:8080"]
    environment:
      - SPRING_DATASOURCE_URL=jdbc:postgresql://postgres:5432/flowable

  # AI Model Gateway
  ai-gateway:
    build: ./ai-gateway
    ports: ["8000:8000"]
    environment:
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}

  # Hyperledger Fabric (PoC)
  fabric-peer:
    image: hyperledger/fabric-peer:2.5
    ports: ["7051:7051"]

  # Milvus 向量数据库
  milvus:
    image: milvusdb/milvus:v2.4
    ports: ["19530:19530"]

  # 共享基础设施
  postgres:
    image: postgres:16
    ports: ["5432:5432"]
    volumes:
      - pgdata:/var/lib/postgresql/data
    environment:
      - POSTGRES_DB=zs_exchange
      - POSTGRES_USER=zs_admin
      - POSTGRES_PASSWORD=${DB_PASSWORD}

  redis:
    image: redis:7-alpine
    ports: ["6379:6379"]

  kafka:
    image: confluentinc/cp-kafka:7.5.0
    ports: ["9092:9092"]

  mongodb:
    image: mongo:7
    ports: ["27017:27017"]

volumes:
  pgdata:
```

---

## 六、数据流整合

### 6.1 关键业务流

**流 1: 用户 KYC 审核**
```
用户提交 KYC 资料
    ↓
ZS Exchange /api/user/kyc/submit
    ↓
1. 触发 OpenClaw 智能体 "KYC审核"
2. 同时上链存证
    ↓
OpenClaw 智能体调用 n8n 工作流
    ↓
n8n 工作流:
  - 调 AI Model Gateway (OCR + 人脸识别)
  - 调第三方征信 API
  - 通过 BPM 启动合规审批
    ↓
BPM 通知运营人员
    ↓
运营人员在 ZS Exchange /admin/users/kyc 审批
    ↓
BPM 回调 n8n
    ↓
n8n 回调 OpenClaw
    ↓
OpenClaw 更新记忆 + 返回 ZS Exchange
    ↓
用户 KYC 状态更新
```

**流 2: 大额提现审批**
```
用户发起提现
    ↓
ZS Exchange /api/user/withdraw
    ↓
1. 风控检查 (AI Model Gateway)
2. 触发 BPM 审批流程
3. 上链存证
    ↓
BPM 工作流:
  - 初级审核员审批 (< 1万USDT)
  - 高级审核员审批 (1-10万)
  - 风控委员会 (10万+)
    ↓
BPM 通过/拒绝
    ↓
回调 ZS Exchange
    ↓
更新交易状态
```

**流 3: AI 智能获客**
```
TikTok/Douyin API
    ↓
Kafka 实时数据流
    ↓
Flink 实时计算 (互动率、转化率)
    ↓
ClickHouse 存储
    ↓
OpenClaw 智能体分析
    ↓
AI Model Gateway 生成策略
    ↓
ZS Exchange /admin/dsales/network 展示
    ↓
运营人员调整策略
    ↓
策略回写到 Kafka
    ↓
触发新一波内容投放
```

---

## 七、实施路线（整合后）

### 阶段 0: 准备（1 周）
- [x] 完成 ZS Exchange 后台 + 官网基础
- [x] 准备 AI 自动化技术规划 v1
- [x] 准备本整合方案 v1
- [ ] 评审本整合方案
- [ ] 采购云资源（PoC 阶段：1 台 16C32G）

### 阶段 1: 基础设施 + 鉴权统一（2 周）
- [ ] 部署 docker-compose.dev.yml
- [ ] 实现 /api/auth/external-token
- [ ] 扩展数据库 schema
- [ ] ZS Exchange 启动脚本集成 Docker
- [ ] 完成 n8n/OpenClaw 容器互通测试

### 阶段 2: n8n + OpenClaw 集成（2 周）
- [ ] 实现 /api/n8n/proxy + /api/ws/n8n
- [ ] 实现 /api/openclaw/proxy + /api/ws/openclaw
- [ ] 改造 8 个现有页面（n8n 4 + openclaw 4）
- [ ] 实现"业务触发智能体"机制

### 阶段 3: AI 大模型 + 区块链 + BPM（3 周）
- [ ] 部署 AI Model Gateway
- [ ] 接入 2-3 个大模型
- [ ] 部署 Hyperledger Fabric PoC
- [ ] 部署 Flowable
- [ ] 改造 12 + 4 + 4 个页面
- [ ] 实现 3 个核心业务流程（KYC/提现/Listing）

### 阶段 4: AI 获客 + 性能测试（2 周）
- [ ] 部署 Kafka + Flink
- [ ] 接入 TikTok/Douyin API
- [ ] 改造 5 个 dsales 页面
- [ ] 50 智能体并发压测
- [ ] 72 小时稳定性测试

### 阶段 5: 上线（1 周）
- [ ] 灰度发布
- [ ] 监控告警配置
- [ ] 用户培训
- [ ] 文档交付

**总周期**: 10 周（约 2.5 个月）

---

## 八、预算重新估算（整合后）

| 类别 | 原方案 | 整合后 | 节省 |
|------|--------|--------|------|
| **UI/前端** | 25-40 万 | **5-8 万** | 节省 80% |
| **后端 API** | 30-45 万 | **8-12 万** | 节省 70% |
| **数据库** | 8-12 万 | **3-5 万** | 节省 60% |
| **鉴权/权限** | 5-8 万 | **1-2 万** | 节省 75% |
| **设计/品牌** | 5-8 万 | **1-2 万** | 节省 75% |
| **外部引擎** | 30-45 万 | 30-45 万 | 持平 |
| **测试/运维** | 24-36 万 | **10-15 万** | 节省 55% |
| **安全/合规** | 5-10 万 | 5-10 万 | 持平 |
| **AI API** | 10-15 万 | 10-15 万 | 持平 |
| **其他** | 5-10 万 | 5-10 万 | 持平 |
| **合计** | **157-238 万** | **78-124 万** | **节省 50%** |

**结论**: 整合后预算可压缩到 **78-124 万**（节省 50%），更符合 50 万+ 的预算。

---

## 九、风险与应对

| 风险 | 影响 | 概率 | 应对 |
|------|------|------|------|
| 现有 ZS Exchange 模块与新需求不匹配 | 中 | 中 | 通过抽象层适配，保留 ZS 优先 |
| n8n 容器与 Next.js 启动时序问题 | 中 | 高 | 启动脚本 + 健康检查 |
| 数据库表名冲突（n8n/Flowable 都有自己的表） | 高 | 中 | 使用独立 schema (`n8n.`, `flowable.`) |
| OpenClaw 仍快速迭代，集成不稳定 | 中 | 中 | 抽象 OpenClawClient 接口 |
| ZS Exchange 130 个页面集成工作量大 | 中 | 中 | 优先级排序，先核心 30 个 |

---

## 十、立即可执行的 5 个动作

1. **评审本方案** — 确认整合策略
2. **启动 Docker Compose** — 跑通 n8n + OpenClaw + Flowable
3. **数据库 Schema 扩展** — 执行本方案第 5.2 节 SQL
4. **实现 /api/auth/external-token** — 鉴权统一
5. **改造 /admin/n8n/editor/page.tsx** — 第一个真实数据接入

---

## 附录

### A. 关键路径
- ZS Exchange 项目: `d:\3、系统项目开发\trae_projects\Stock Exchange dapp20260608-01`
- AI 规划 v1: `docs/AI_Automation_Enterprise_Solution_Tech_Plan_v1.md`
- 本整合方案: `docs/ZS_AI_Integration_Plan_v1.md`

### B. 复用页面清单（130+ → 30 关键）
**n8n (4)** + **openclaw (4)** + **ai-llm (5)** + **ai-center (7)** + **bpm (4)** + **blockchain (4)** + **dsales (5)** + **command (9)** = 42 个核心页面

### C. 版本历史
- v1.0 (2026-06-09): 初始版本
