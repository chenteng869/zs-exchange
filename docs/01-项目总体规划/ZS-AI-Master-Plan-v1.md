# ZS Exchange × AI 自动化平台 — 项目总体规划 v1.0

> **项目代号**: ZS-AI Master Plan
> **项目全称**: 中萨数字科技交易所 × AI 智能自动化平台
> **文档版本**: v1.0
> **创建日期**: 2026-06-09
> **维护人**: AI 协同开发系统
> **文档状态**: 📋 待审批

---

## 目录

- [第一部分 项目概述](#第一部分-项目概述)
- [第二部分 目录结构与命名规范](#第二部分-目录结构与命名规范)
- [第三部分 实施计划与里程碑](#第三部分-实施计划与里程碑)
- [第四部分 质量标准与验收标准](#第四部分-质量标准与验收标准)
- [第五部分 风险评估与应急计划](#第五部分-风险评估与应急计划)
- [第六部分 文档规范](#第六部分-文档规范)
- [第七部分 治理与审查机制](#第七部分-治理与审查机制)
- [附录](#附录)

---

# 第一部分 项目概述

## 1.1 项目背景

**ZS Exchange（中萨数字科技交易所）** 是中萨数字科技集团旗下的合规数字资产交易平台，已获得 🇼🇸 萨摩亚双边牌照（数字资产交易所 + 证券交易所）。

**AI 自动化平台** 是基于 OpenClaw + n8n + AI 大模型 + BPM + 区块链的企业级智能自动化系统。

**整合目标**: 将 AI 自动化能力无缝嵌入 ZS Exchange，复用其 130+ 管理页面、统一设计系统、鉴权、数据层，避免重复建设。

## 1.2 项目目标

| 目标 | 关键结果 (KPI) | 衡量标准 |
|------|---------------|----------|
| **业务目标 1: 提升运营效率** | 重复性工作自动化率 ≥ 70% | 节省人天 ≥ 100/月 |
| **业务目标 2: 增强合规能力** | 关键操作上链率 100% | 存证响应 < 3 秒 |
| **业务目标 3: 智能获客** | AI 推荐转化率提升 ≥ 30% | 获客成本降低 ≥ 25% |
| **技术目标 1: 高并发支撑** | 50 智能体并发，72 小时稳定 | P0 故障 < 1 次/月 |
| **技术目标 2: 多模型 AI 网关** | 支持 5+ 大模型 | API 失败自动降级 |
| **技术目标 3: 端到端 BPM** | 100% 流程可追溯 | 审批 SLA 达成率 ≥ 95% |

## 1.3 项目范围

### ✅ In Scope
- ZS Exchange 后台 130+ 页面的真实 API 接入
- n8n / OpenClaw / Flowable / AI Gateway 4 个外部引擎集成
- 区块链存证系统（Hyperledger Fabric PoC → 生产）
- 3 个核心业务流程端到端打通（KYC / 提现审批 / Listing）
- AI 智能获客看板 + 平台数据接入
- 统一鉴权 / 监控 / 告警 / 日志体系
- 完整技术文档 + 用户操作手册

### ❌ Out of Scope（本次不做）
- 移动端 App（仅 Web 管理后台）
- 完整生产级 Fabric 多组织部署（先做 PoC）
- 自研大模型（仅做接入，不训练）
- 跨链桥开发（仅使用现成方案）

## 1.4 项目干系人

| 角色 | 职责 | 人数 |
|------|------|------|
| **项目发起人** | 战略决策、资源审批 | 1 人 |
| **项目经理** | 计划、进度、风险 | 1 人 |
| **技术负责人** | 架构、关键技术决策 | 1 人 |
| **前端开发** | 130+ 页面改造 | 2-3 人 |
| **后端开发** | API 网关、外部引擎集成 | 2-3 人 |
| **AI/区块链专家** | 模型调优、Fabric 部署 | 1-2 人 |
| **测试工程师** | 自动化测试、性能测试 | 1 人 |
| **运维工程师** | K8s 部署、监控 | 1 人 |
| **UI/UX 设计师** | 设计系统维护 | 0.5 人 |
| **AI 协同开发系统** | 文档生成、代码审查 | 24/7 |

---

# 第二部分 目录结构与命名规范

## 2.1 项目根目录结构

```
Stock Exchange dapp20260608-01/             # 项目根
│
├── README.md                                # 项目总入口（待创建）
├── package.json                             # 依赖管理
├── next.config.js                           # Next.js 配置
├── tailwind.config.ts                       # Tailwind 配置
├── tsconfig.json                            # TypeScript 配置
├── postcss.config.js                        # PostCSS 配置
├── .env.local                               # 本地环境变量
├── .env.production                          # 生产环境变量
├── .eslintrc.json                           # ESLint 规则
├── .prettierrc                              # Prettier 规则
├── .gitignore                               # Git 忽略文件
├── .editorconfig                            # 编辑器配置
├── Dockerfile                               # 前端 Docker 镜像
├── docker-compose.yml                       # 完整服务编排（前端 + 外部引擎）
├── docker-compose.dev.yml                   # 开发环境服务编排
│
├── docs/                                    # 📚 项目文档（第一公民）
│   ├── 00-项目章程.md                       # Charter
│   ├── 01-项目总体规划/                     # ← 本文档所在
│   │   ├── ZS-AI-Master-Plan-v1.md         # 总体规划 v1
│   │   ├── WORK_LOG.md                      # 日常工作日志
│   │   └── DECISIONS.md                     # ADR 决策记录
│   ├── 02-架构设计/
│   │   ├── 01-技术栈选型.md
│   │   ├── 02-系统架构图.md
│   │   ├── 03-数据库设计.md
│   │   ├── 04-API设计规范.md
│   │   └── 05-安全设计.md
│   ├── 03-模块设计/
│   │   ├── n8n-集成设计.md
│   │   ├── openclaw-集成设计.md
│   │   ├── AI模型网关设计.md
│   │   ├── 区块链存证设计.md
│   │   ├── BPM流程设计.md
│   │   └── AI获客设计.md
│   ├── 04-API文档/                          # 自动生成
│   ├── 05-测试文档/
│   │   ├── 测试计划.md
│   │   ├── 测试用例/
│   │   └── 性能测试报告/
│   ├── 06-部署运维/
│   │   ├── 部署手册.md
│   │   ├── 监控告警.md
│   │   └── 应急响应手册.md
│   ├── 07-用户文档/
│   │   ├── 管理员手册.md
│   │   ├── 运营人员手册.md
│   │   └── API用户手册.md
│   ├── 08-合规与法律/
│   │   ├── 萨摩亚合规说明.md
│   │   ├── 隐私政策.md
│   │   └── 风险提示.md
│   ├── 09-设计规范/
│   │   ├── 视觉设计规范.md
│   │   ├── 组件库文档.md
│   │   └── 交互规范.md
│   ├── 10-AI协同/
│   │   ├── AI_Collaboration_Prompts_v1.md
│   │   ├── Agent_Roles.md
│   │   └── Quality_Gates.md
│   ├── AI_Automation_Enterprise_Solution_Tech_Plan_v1.md
│   ├── ZS_AI_Integration_Plan_v1.md
│   ├── ZS_Exchange_Official_Website_AI_Collaboration_Prompts_v1.md
│   ├── COLOR_SPECIFICATION.md
│   └── 国学堂/                               # 历史文档归档
│
├── scripts/                                  # 运维/构建脚本
│   ├── qa-check.mjs                          # 现有：QA 门禁
│   ├── setup.sh                              # 一键启动开发环境
│   ├── seed-data.ts                          # 种子数据
│   ├── generate-pages.js                     # 现有：批量生成页面
│   ├── migrate-db.sh                         # 数据库迁移
│   ├── backup.sh                             # 备份脚本
│   ├── restore.sh                            # 恢复脚本
│   └── health-check.sh                       # 健康检查
│
├── tests/                                    # 测试目录
│   ├── unit/                                 # 单元测试
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── lib/
│   │   └── services/
│   ├── integration/                          # 集成测试
│   │   ├── api/
│   │   └── workflows/
│   ├── e2e/                                  # 端到端测试
│   │   ├── playwright.config.ts
│   │   ├── specs/
│   │   │   ├── homepage.spec.ts
│   │   │   ├── trade.spec.ts
│   │   │   ├── admin-dashboard.spec.ts
│   │   │   ├── n8n-workflow.spec.ts
│   │   │   └── kyc-flow.spec.ts
│   │   └── fixtures/
│   ├── performance/                          # 性能测试
│   │   ├── k6-scripts/
│   │   └── reports/
│   └── __mocks__/                            # Mock 数据
│
├── src/                                      # 源代码
│   ├── app/                                  # Next.js App Router
│   │   ├── (public)/                         # 公开页面（路由组）
│   │   │   ├── page.tsx                      # 首页
│   │   │   ├── HomepageContent.tsx
│   │   │   ├── markets/
│   │   │   ├── trade/
│   │   │   ├── defi/
│   │   │   ├── ido/
│   │   │   ├── nft/
│   │   │   ├── login/
│   │   │   ├── register/
│   │   │   ├── about/
│   │   │   ├── licenses/
│   │   │   ├── download/
│   │   │   ├── buy-crypto/
│   │   │   ├── business/
│   │   │   ├── finance/
│   │   │   └── portal/                       # 国学堂门户
│   │   ├── user/                             # 用户中心
│   │   │   ├── layout.tsx
│   │   │   ├── dashboard/
│   │   │   ├── wallet/
│   │   │   ├── trading/
│   │   │   ├── nft/
│   │   │   ├── ido/
│   │   │   ├── defi/
│   │   │   └── account/
│   │   ├── admin/                            # 管理后台（130+ 页）
│   │   │   ├── layout.tsx                    # QueryClientProvider
│   │   │   ├── dashboard/
│   │   │   ├── n8n/                          # n8n 模块
│   │   │   ├── openclaw/                     # OpenClaw 模块
│   │   │   ├── ai-llm/                       # AI 大模型
│   │   │   ├── ai-center/                    # AI 中心
│   │   │   ├── blockchain/                   # 区块链存证
│   │   │   ├── bpm/                          # BPM 流程
│   │   │   ├── dsales/                       # AI 获客
│   │   │   ├── analytics/                    # 数据分析
│   │   │   ├── command/                      # 指挥中心
│   │   │   ├── cex/                          # 中心化交易
│   │   │   ├── dex/                          # 去中心化交易
│   │   │   ├── defi/                         # DeFi 管理
│   │   │   ├── ido/                          # IDO 管理
│   │   │   ├── nfts/                         # NFT 管理
│   │   │   ├── chain/                        # 公链管理
│   │   │   ├── web3/                         # Web3 管理
│   │   │   ├── compliance/                   # 合规管理
│   │   │   ├── license/                      # 牌照管理
│   │   │   ├── listing/                      # 挂牌管理
│   │   │   ├── token/                        # Token 管理
│   │   │   ├── staking/                      # 质押管理
│   │   │   ├── transactions/                # 交易管理
│   │   │   ├── users/                        # 用户管理
│   │   │   ├── wallet/                       # 钱包管理
│   │   │   ├── enterprise/                   # 企业管理
│   │   │   ├── ecommerce/                    # 电商管理
│   │   │   ├── entertainment/                # 娱乐管理
│   │   │   ├── content/                      # 内容管理
│   │   │   ├── iot/                          # IoT 管理
│   │   │   ├── aiopc/                        # AIOPC 管理
│   │   │   ├── quant/                        # 量化交易
│   │   │   ├── security/                     # 安全管理
│   │   │   ├── finance/                      # 财务管理
│   │   │   ├── i18n/                         # 国际化
│   │   │   ├── audit-logs/                   # 审计日志
│   │   │   └── settings/                     # 系统设置
│   │   ├── api/                              # 后端 API 路由
│   │   │   ├── auth/                         # 鉴权
│   │   │   │   ├── login/route.ts
│   │   │   │   ├── logout/route.ts
│   │   │   │   ├── refresh/route.ts
│   │   │   │   └── external-token/route.ts   # 外部引擎令牌
│   │   │   ├── admin/                        # 管理员 API
│   │   │   │   ├── dashboard/
│   │   │   │   ├── n8n/
│   │   │   │   ├── openclaw/
│   │   │   │   ├── ai-llm/
│   │   │   │   ├── blockchain/
│   │   │   │   ├── bpm/
│   │   │   │   └── ...
│   │   │   ├── user/                         # 用户 API
│   │   │   ├── trade/                        # 交易 API
│   │   │   ├── public/                       # 公开 API
│   │   │   ├── ws/                           # WebSocket 路由
│   │   │   │   ├── notifications/route.ts
│   │   │   │   ├── n8n/route.ts
│   │   │   │   └── openclaw/route.ts
│   │   │   ├── proxy/                        # 外部引擎代理
│   │   │   │   ├── n8n/route.ts
│   │   │   │   ├── openclaw/route.ts
│   │   │   │   ├── flowable/route.ts
│   │   │   │   └── fabric/route.ts
│   │   │   └── webhooks/                     # Webhook 接收
│   │   │       ├── n8n/route.ts
│   │   │       ├── openclaw/route.ts
│   │   │       └── platform/route.ts
│   │   ├── layout.tsx                        # 根 layout
│   │   ├── globals.css                       # 全局样式
│   │   ├── not-found.tsx                     # 404
│   │   ├── error.tsx                         # 全局错误
│   │   └── loading.tsx                       # 全局加载
│   │
│   ├── components/                           # 共享组件库
│   │   ├── ui/                               # 基础 UI 组件（C 端）
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── Tabs.tsx
│   │   │   ├── Accordion.tsx
│   │   │   ├── Table.tsx
│   │   │   ├── Badge.tsx
│   │   │   ├── AnimatedCounter.tsx
│   │   │   └── index.ts
│   │   ├── admin/                            # 管理后台组件
│   │   │   ├── AdminLayout.tsx
│   │   │   ├── DataTable.tsx
│   │   │   ├── DataCard.tsx
│   │   │   ├── ChartWrapper.tsx
│   │   │   ├── SafeECharts.tsx
│   │   │   ├── FormBuilder.tsx               # 动态表单
│   │   │   ├── PermissionGuard.tsx           # 权限守卫
│   │   │   └── index.ts
│   │   ├── layout/                           # 布局组件（C 端）
│   │   │   ├── Navbar.tsx
│   │   │   ├── Footer.tsx
│   │   │   ├── MobileNav.tsx
│   │   │   ├── Breadcrumb.tsx
│   │   │   └── Sidebar.tsx
│   │   ├── home/                             # 首页组件
│   │   ├── differentiation/                  # ZS 差异化组件
│   │   ├── animated/                         # 动画组件
│   │   ├── user/                             # 用户中心组件
│   │   ├── providers/                        # Context Providers
│   │   │   ├── ReactQueryProvider.tsx
│   │   │   ├── ThemeProvider.tsx
│   │   │   ├── I18nProvider.tsx
│   │   │   ├── AuthProvider.tsx
│   │   │   └── NotificationProvider.tsx
│   │   ├── engine/                           # 外部引擎客户端
│   │   │   ├── N8nClient.ts                  # n8n 客户端封装
│   │   │   ├── OpenClawClient.ts             # OpenClaw 客户端
│   │   │   ├── FlowableClient.ts             # Flowable 客户端
│   │   │   ├── FabricClient.ts               # Fabric 客户端
│   │   │   ├── AIGatewayClient.ts            # AI 网关客户端
│   │   │   └── index.ts
│   │   └── shared/                           # 通用业务组件
│   │       ├── AddressDisplay.tsx
│   │       ├── PriceCell.tsx
│   │       ├── TickerCell.tsx
│   │       └── TradingView.tsx
│   │
│   ├── hooks/                                # 自定义 Hooks
│   │   ├── useTicker.ts
│   │   ├── usePriceAnimation.ts
│   │   ├── useMockWebSocket.ts
│   │   ├── useMediaQuery.ts
│   │   ├── useIsMobile.ts
│   │   ├── useBreakpoint.ts
│   │   ├── useScrollAnimation.ts
│   │   ├── useParallax.ts
│   │   ├── useAuth.ts
│   │   ├── usePermission.ts
│   │   └── useExternalEngine.ts              # 外部引擎统一接口
│   │
│   ├── lib/                                  # 工具库
│   │   ├── animations.ts
│   │   ├── constants.ts
│   │   ├── mock-data.ts
│   │   ├── orderbook-mock.ts
│   │   ├── seo.ts
│   │   ├── formatters.ts                     # 数据格式化
│   │   ├── validators.ts                     # 通用校验
│   │   ├── api-client.ts                     # API 客户端
│   │   ├── error-handler.ts
│   │   └── logger.ts                         # 日志
│   │
│   ├── services/                             # 服务层（API 封装）
│   │   ├── api.ts                            # 基础 axios
│   │   ├── auth.service.ts
│   │   ├── n8n.service.ts
│   │   ├── openclaw.service.ts
│   │   ├── flowable.service.ts
│   │   ├── fabric.service.ts
│   │   ├── ai-gateway.service.ts
│   │   ├── trade.service.ts
│   │   ├── user.service.ts
│   │   ├── kyc.service.ts
│   │   ├── withdraw.service.ts
│   │   └── listing.service.ts
│   │
│   ├── stores/                               # Zustand 状态
│   │   ├── authStore.ts
│   │   ├── tradeStore.ts
│   │   ├── tickerStore.ts
│   │   ├── notificationStore.ts
│   │   └── uiStore.ts
│   │
│   ├── styles/                               # 样式
│   │   ├── globals.css
│   │   ├── tokens.ts                         # 设计 Token
│   │   ├── design-tokens.ts
│   │   ├── responsive.ts
│   │   └── animations.module.css
│   │
│   ├── types/                                # TypeScript 类型
│   │   ├── index.ts                          # 通用类型
│   │   ├── api.ts                            # API 类型
│   │   ├── n8n.ts
│   │   ├── openclaw.ts
│   │   ├── flowable.ts
│   │   ├── fabric.ts
│   │   ├── ai.ts
│   │   └── engine.ts
│   │
│   ├── constants/                            # 常量
│   │   ├── adminMenuMapping.ts
│   │   ├── api-endpoints.ts
│   │   ├── engine-ports.ts                   # 各引擎端口
│   │   └── error-codes.ts
│   │
│   ├── config/                               # 配置（待创建）
│   │   ├── engines.ts                        # 外部引擎配置
│   │   ├── env.ts                            # 环境变量校验
│   │   └── features.ts                       # 功能开关
│   │
│   └── middleware.ts                         # Next.js 中间件
│
├── infrastructure/                           # 基础设施（待创建）
│   ├── docker/                               # Docker 镜像构建
│   │   ├── n8n.Dockerfile
│   │   ├── openclaw.Dockerfile
│   │   ├── ai-gateway.Dockerfile
│   │   ├── flowable.Dockerfile
│   │   └── fabric/
│   │       ├── docker-compose.yaml
│   │       └── configtx.yaml
│   ├── k8s/                                  # Kubernetes 清单
│   │   ├── base/
│   │   ├── overlays/dev/
│   │   ├── overlays/staging/
│   │   └── overlays/prod/
│   ├── monitoring/                           # 监控配置
│   │   ├── prometheus/
│   │   ├── grafana/
│   │   └── alertmanager/
│   ├── nginx/                                # 反向代理
│   │   ├── nginx.conf
│   │   └── conf.d/
│   └── terraform/                            # IaC（如使用）
│
├── database/                                 # 数据库（待创建）
│   ├── migrations/                           # 迁移脚本
│   │   ├── 001-initial-schema.sql
│   │   ├── 002-add-n8n-tables.sql
│   │   ├── 003-add-openclaw-tables.sql
│   │   └── ...
│   ├── seeds/                                # 种子数据
│   │   ├── admin-users.sql
│   │   ├── n8n-workflows.sql
│   │   └── openclaw-agents.sql
│   └── schemas/                              # Schema 定义
│       ├── public.sql
│       ├── n8n.sql
│       ├── openclaw.sql
│       ├── flowable.sql
│       └── fabric.sql
│
├── .codegraph/                               # 代码图谱（已有）
├── .next/                                    # Next.js 构建产物（gitignore）
└── node_modules/                             # 依赖（gitignore）
```

## 2.2 命名规范

### 2.2.1 目录命名

| 类别 | 规范 | 示例 |
|------|------|------|
| **页面目录** | `kebab-case` | `admin/ai-llm/model-management/` |
| **业务模块** | `kebab-case` | `services/ai-gateway.service.ts` |
| **组件目录** | `kebab-case` 或 `PascalCase` | `admin/AdminLayout.tsx` |
| **数据库表** | `snake_case` | `blockchain_notarizations` |
| **环境变量** | `SCREAMING_SNAKE_CASE` | `OPENAI_API_KEY` |
| **Git 分支** | `kebab-case` | `feat/ai-gateway-integration` |
| **Git 标签** | `vX.Y.Z` | `v1.0.0` |

### 2.2.2 文件命名

| 类型 | 规范 | 示例 |
|------|------|------|
| **React 组件** | `PascalCase.tsx` | `HeroSection.tsx` |
| **Hook** | `camelCase.ts` (use 前缀) | `useTicker.ts` |
| **工具函数** | `kebab-case.ts` | `formatters.ts` |
| **服务** | `kebab-case.service.ts` | `ai-gateway.service.ts` |
| **类型定义** | `kebab-case.ts` 或 集中 `types/` | `n8n.ts` |
| **常量** | `kebab-case.ts` | `api-endpoints.ts` |
| **配置文件** | `kebab-case.ts` | `tailwind.config.ts` |
| **测试文件** | `*.spec.ts` 或 `*.test.ts` | `HeroSection.spec.tsx` |
| **样式文件** | `Component.module.css` 或 `kebab-case.css` | `globals.css` |
| **SQL 迁移** | `NNN-description.sql` | `001-initial-schema.sql` |
| **文档** | `UPPER-CASE.md` 或 `Title-Case.md` | `README.md`, `AI_Automation_Enterprise_Solution_Tech_Plan_v1.md` |

### 2.2.3 TypeScript 命名

| 类别 | 规范 | 示例 |
|------|------|------|
| **类** | `PascalCase` | `N8nClient` |
| **接口** | `PascalCase` | `TickerData` |
| **类型别名** | `PascalCase` | `OrderType` |
| **函数** | `camelCase` | `fetchTickers` |
| **变量** | `camelCase` | `tickerData` |
| **常量** | `SCREAMING_SNAKE_CASE` 或 `camelCase` | `MAX_RETRY_COUNT` 或 `maxRetryCount` |
| **React Props** | `XxxProps` 后缀 | `ButtonProps` |
| **枚举** | `PascalCase` + `SCREAMING_SNAKE_CASE` | `enum OrderSide { BUY, SELL }` |
| **布尔变量** | `is/has/can/should` 前缀 | `isMounted` |

### 2.2.4 路由命名

| 类型 | 规范 | 示例 |
|------|------|------|
| **C 端公开页** | `kebab-case` | `/markets`, `/trade/spot` |
| **用户中心** | `/user/...` | `/user/wallet` |
| **管理后台** | `/admin/...` | `/admin/n8n/editor` |
| **API 路由** | `/api/{module}/{action}` | `/api/auth/login` |
| **WebSocket** | `/api/ws/{topic}` | `/api/ws/notifications` |
| **动态参数** | `[param]` | `/trade/[pair]` |

### 2.2.5 Git 提交规范（Conventional Commits）

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Type 类型**:
- `feat`: 新功能
- `fix`: Bug 修复
- `docs`: 文档变更
- `style`: 代码格式（不影响功能）
- `refactor`: 重构
- `perf`: 性能优化
- `test`: 测试
- `chore`: 构建/工具/依赖
- `ci`: CI/CD
- `revert`: 回滚

**示例**:
```
feat(admin): integrate n8n workflow editor with real API

- Connect /admin/n8n/editor to real n8n backend
- Add error handling and retry logic
- Update mock data structure to match n8n API

Closes #123
```

---

# 第三部分 实施计划与里程碑

## 3.1 总体时间表

```
┌─────────┬─────────┬─────────┬─────────┬─────────┬─────────┐
│ Phase 0 │ Phase 1 │ Phase 2 │ Phase 3 │ Phase 4 │ Phase 5 │
│  准备   │ 基础设施│ 引擎集成│ 业务模块│ 性能优化│ 上线运营│
│  1 周   │  2 周   │  2 周   │  3 周   │  2 周   │  1 周   │
└─────────┴─────────┴─────────┴─────────┴─────────┴─────────┘
总计: 11 周（约 2.5 个月）
```

## 3.2 详细里程碑

### 📌 Phase 0: 准备与审批（Week 1）

| ID | 任务 | 负责人 | 工时 | 依赖 | 验收标准 |
|----|------|--------|------|------|----------|
| P0-1 | 评审本规划文档 | 全员 | 1 天 | - | 文档签字确认 |
| P0-2 | 评审 AI 自动化方案 v1 | 技术负责人 | 0.5 天 | - | 通过 |
| P0-3 | 评审 ZS-AI 整合方案 v1 | 全员 | 0.5 天 | P0-2 | 通过 |
| P0-4 | 采购云资源（PoC：1 台 16C32G） | 运维 | 2 天 | - | 服务器可用 |
| P0-5 | 开通 AI API 账号（OpenAI/Claude/通义） | 后端 | 1 天 | - | API Key 可用 |
| P0-6 | 制定 Git 分支策略 | 技术负责人 | 0.5 天 | - | 文档定稿 |
| P0-7 | 创建项目管理看板 | PM | 0.5 天 | - | Jira/Notion 看板就绪 |

**里程碑 M0**: 项目正式启动，所有文档通过评审

### 📌 Phase 1: 基础设施 + 鉴权统一（Week 2-3）

| ID | 任务 | 负责人 | 工时 | 依赖 | 验收标准 |
|----|------|--------|------|------|----------|
| P1-1 | 部署 docker-compose.dev.yml（含 n8n/Redis/PG） | 运维 | 1 天 | P0-4 | docker ps 全部 running |
| P1-2 | 部署 OpenClaw Gateway 容器 | 后端 | 0.5 天 | P1-1 | 18789 端口可访问 |
| P1-3 | 部署 Flowable 容器 | 后端 | 0.5 天 | P1-1 | 8080 端口可访问 |
| P1-4 | 部署 Hyperledger Fabric PoC（单 orderer+2 peer） | 区块链专家 | 3 天 | P1-1 | 链码部署成功 |
| P1-5 | 部署 Milvus 向量数据库 | 后端 | 1 天 | P1-1 | 19530 端口可访问 |
| P1-6 | 部署 Kafka + Zookeeper | 后端 | 1 天 | P1-1 | Kafka 消息可生产消费 |
| P1-7 | 数据库 Schema 扩展（执行 6 张新表 SQL） | 后端 | 1 天 | P1-1 | 迁移脚本回滚测试通过 |
| P1-8 | 实现 `/api/auth/external-token` | 后端 | 1 天 | P1-7 | 返回 4 个引擎 token |
| P1-9 | 创建 `src/config/engines.ts` 引擎配置 | 后端 | 0.5 天 | P1-8 | TypeScript 类型校验通过 |
| P1-10 | 编写集成测试：容器互通 | 测试 | 1 天 | P1-1~6 | 全部测试通过 |
| P1-11 | 配置 Prometheus + Grafana | 运维 | 1 天 | P1-1 | 仪表盘可见 8 个引擎指标 |
| P1-12 | 编写 Phase 1 部署文档 | 技术负责人 | 0.5 天 | P1-1~11 | 部署手册完成 |

**里程碑 M1**: 全部基础设施就绪，鉴权统一，可登录 4 个外部引擎

### 📌 Phase 2: n8n + OpenClaw 引擎集成（Week 4-5）

| ID | 任务 | 负责人 | 工时 | 依赖 | 验收标准 |
|----|------|--------|------|------|----------|
| P2-1 | 实现 `src/services/n8n.service.ts` | 后端 | 1 天 | P1-8 | n8n 客户端封装完成 |
| P2-2 | 实现 `src/services/openclaw.service.ts` | 后端 | 1 天 | P1-8 | OpenClaw 客户端封装完成 |
| P2-3 | 实现 `/api/proxy/n8n` API 代理路由 | 后端 | 1 天 | P2-1 | n8n API 可代理 |
| P2-4 | 实现 `/api/proxy/openclaw` 代理路由 | 后端 | 1 天 | P2-2 | OpenClaw API 可代理 |
| P2-5 | 实现 `/api/ws/n8n` WebSocket 代理 | 后端 | 1 天 | P2-3 | 实时执行状态可推送 |
| P2-6 | 实现 `/api/ws/openclaw` WebSocket 代理 | 后端 | 1 天 | P2-4 | 智能体状态可推送 |
| P2-7 | 改造 `/admin/n8n/editor/page.tsx` 接入真实数据 | 前端 | 1.5 天 | P2-3 | 真实工作流可显示可编辑 |
| P2-8 | 改造 `/admin/n8n/history/page.tsx` | 前端 | 1 天 | P2-5 | 真实执行历史可显示 |
| P2-9 | 改造 `/admin/n8n/templates/page.tsx` | 前端 | 1 天 | P2-3 | 官方模板可拉取 |
| P2-10 | 改造 `/admin/n8n/triggers/page.tsx` | 前端 | 1 天 | P2-3 | 真实触发器可管理 |
| P2-11 | 改造 `/admin/openclaw/marketplace/page.tsx` | 前端 | 1.5 天 | P2-4 | 真实智能体市场 |
| P2-12 | 改造 `/admin/openclaw/monitor-dashboard/page.tsx` | 前端 | 1.5 天 | P2-6 | 实时监控数据 |
| P2-13 | 改造 `/admin/openclaw/orchestration/page.tsx` | 前端 | 1.5 天 | P2-4 | 真实编排界面 |
| P2-14 | 改造 `/admin/openclaw/training/page.tsx` | 前端 | 1 天 | P2-4 | 真实训练数据 |
| P2-15 | 编写"业务触发智能体"示例（KYC→OpenClaw） | 后端 | 1 天 | P2-4 | 端到端 PoC 可跑通 |
| P2-16 | Phase 2 集成测试 | 测试 | 1 天 | P2-1~15 | 全部测试通过 |

**里程碑 M2**: n8n + OpenClaw 管理后台 8 个页面全部接入真实 API，演示 KYC 智能体闭环

### 📌 Phase 3: AI 大模型 + 区块链 + BPM（Week 6-8）

| ID | 任务 | 负责人 | 工时 | 依赖 | 验收标准 |
|----|------|--------|------|------|----------|
| P3-1 | 部署 AI Model Gateway (FastAPI) | 后端 | 1 天 | P1-1 | 8000 端口可访问 |
| P3-2 | 接入 OpenAI / Claude / 通义 / 智谱 API | AI 专家 | 1 天 | P3-1 | 4 个模型可调用 |
| P3-3 | 实现语义缓存（Milvus） | 后端 | 1 天 | P3-1 | 相似度 >0.95 命中 |
| P3-4 | 实现智能降级 + 限流 | 后端 | 1 天 | P3-2 | 主模型失败自动切换 |
| P3-5 | 改造 5 个 ai-llm 子页面 | 前端 | 3 天 | P3-2 | 真实模型管理 |
| P3-6 | 改造 7 个 ai-center 子页面 | 前端 | 4 天 | P3-2 | 真实 AI 能力 |
| P3-7 | 实现 `/api/blockchain/notarize` 异步存证 | 区块链专家 | 2 天 | P1-4 | 上链 < 3 秒 |
| P3-8 | 改造 4 个 blockchain 子页面 | 前端 | 2 天 | P3-7 | 真实存证数据 |
| P3-9 | 接入 Flowable REST API | 后端 | 2 天 | P1-3 | 流程定义/实例可管理 |
| P3-10 | 改造 4 个 bpm 子页面 | 前端 | 3 天 | P3-9 | 真实流程数据 |
| P3-11 | 实现 KYC 端到端流程（业务→OpenClaw→n8n→BPM→上链） | 全栈 | 3 天 | P3-7~10 | 端到端测试通过 |
| P3-12 | 实现大额提现审批流程 | 全栈 | 2 天 | P3-9 | 端到端测试通过 |
| P3-13 | 实现 Listing 审批流程 | 全栈 | 2 天 | P3-9 | 端到端测试通过 |
| P3-14 | Phase 3 集成测试 | 测试 | 2 天 | P3-1~13 | 全部测试通过 |

**里程碑 M3**: AI/区块链/BPM 三大模块全部接入，3 个核心业务流程（KYC/提现/Listing）端到端跑通

### 📌 Phase 4: AI 获客 + 性能测试（Week 9-10）

| ID | 任务 | 负责人 | 工时 | 依赖 | 验收标准 |
|----|------|--------|------|------|----------|
| P4-1 | 部署 Kafka + Flink 实时计算 | 后端 | 2 天 | P1-6 | 数据可实时计算 |
| P4-2 | 接入 TikTok / Douyin / 小红书 API | 后端 | 3 天 | P4-1 | 3 个平台数据可拉取 |
| P4-3 | 实现"AI 策略推荐"智能体 | AI 专家 | 2 天 | P3-2 | 智能体可生成建议 |
| P4-4 | 改造 5 个 dsales 子页面 | 前端 | 3 天 | P4-2 | 真实获客数据 |
| P4-5 | 50 智能体并发压测 | 测试 | 2 天 | P3-11 | 50 并发无故障 |
| P4-6 | 72 小时稳定性测试 | 测试 | 3 天 | P4-5 | 零 P0 故障 |
| P4-7 | 性能优化（响应时间 < 3 秒） | 后端 | 2 天 | P4-6 | P95 延迟 < 3 秒 |
| P4-8 | 安全扫描（OWASP Top 10） | 安全 | 1 天 | P4-6 | 无高危漏洞 |
| P4-9 | 性能测试报告 | 测试 | 1 天 | P4-5~7 | 报告完整 |

**里程碑 M4**: 50 智能体并发 72 小时稳定，性能达标，安全通过

### 📌 Phase 5: 上线与运营（Week 11）

| ID | 任务 | 负责人 | 工时 | 依赖 | 验收标准 |
|----|------|--------|------|------|----------|
| P5-1 | 灰度发布（10% → 50% → 100%） | 运维 | 2 天 | P4-9 | 三阶段无异常 |
| P5-2 | 配置生产监控告警 | 运维 | 1 天 | P4-9 | 9 项关键指标告警 |
| P5-3 | 编写用户操作手册 | 技术文档 | 2 天 | - | 手册审校通过 |
| P5-4 | 用户培训（管理员 / 运营） | PM | 1 天 | P5-3 | 培训反馈 ≥ 4/5 |
| P5-5 | 项目验收会议 | PM | 0.5 天 | P5-1~4 | 验收签字 |
| P5-6 | 项目结项报告 | PM | 1 天 | P5-5 | 报告归档 |

**里程碑 M5**: 项目正式上线运营

## 3.3 任务依赖图

```
P0-1 → P0-2 → P0-3 → P0-4 → P1-1 ─┬─→ P1-2 (OpenClaw)
                                   ├─→ P1-3 (Flowable)
                                   ├─→ P1-4 (Fabric)
                                   ├─→ P1-5 (Milvus)
                                   ├─→ P1-6 (Kafka)
                                   └─→ P1-7 (DB Schema) → P1-8 (Auth)
                                                          → P1-9 (Config)

P1-1 ~ P1-6 ──→ P1-10 (集成测试) ──→ P1-11 (监控) ──→ P1-12 (Phase 1 文档)
                                                                       │
                                                                       ↓
P1-8 ~ P1-9 ──→ P2-1, P2-2 (Service) ──→ P2-3 ~ P2-6 (API 代理) ──→ P2-7~P2-14 (页面改造)
                                                                       │
                                                                       ↓
                                                              P2-15 (PoC 业务) ──→ P2-16 (测试)
                                                                                       │
                                                                                       ↓
                                                              P3-1 (AI Gateway) ──→ P3-2~P3-4 (AI 能力)
                                                                                       │
                                                              P3-7 (Fabric 存证) ──→ P3-8 (区块链页面)
                                                                                       │
                                                              P3-9 (Flowable 接入) ──→ P3-10 (BPM 页面)
                                                                       │
                                                                       ↓
                                                              P3-11~P3-13 (3 大业务流程) ──→ P3-14 (测试)
                                                                                                          │
                                                                                                          ↓
                                                              P4-1~P4-4 (获客) ──→ P4-5~P4-7 (性能) ──→ P4-8~P4-9 (安全 + 报告)
                                                                                                          │
                                                                                                          ↓
                                                                                              P5-1~P5-6 (上线)
```

## 3.4 关键路径（Critical Path）

```
P0-4 → P1-1 → P1-4 → P3-7 → P3-11 → P4-5 → P4-6 → P5-1 → P5-5
 2天     1天     3天     2天      3天     2天     3天     2天    0.5天
                                                  总计: 18.5 天
```

**关键路径任务延迟将直接推迟上线**，需要重点关注。

---

# 第四部分 质量标准与验收标准

## 4.1 质量门禁体系（6 层）

### Layer 1: 静态代码分析
| 检查项 | 工具 | 通过标准 |
|--------|------|----------|
| TypeScript 编译 | `tsc --noEmit` | 0 error |
| ESLint | `eslint .` | 0 error, warning ≤ 10 |
| Prettier 格式 | `prettier --check .` | 全部已格式化 |
| 命名规范 | ESLint plugin | 100% 符合 |

**门禁命令**: `npm run type-check && npm run lint`

### Layer 2: 单元测试
| 指标 | 标准 |
|------|------|
| 测试覆盖率 | ≥ 70% |
| 关键模块覆盖率 | ≥ 85% (services/, hooks/, lib/) |
| 测试用例数 | ≥ 1 个 / 函数 |
| 通过率 | 100% |

**门禁命令**: `npm run test:unit`

### Layer 3: 集成测试
| 指标 | 标准 |
|------|------|
| API 端点覆盖 | ≥ 80% |
| 第三方集成覆盖 | 100% (n8n/OpenClaw/Flowable/Fabric) |
| Mock 数据完整性 | 100% 字段覆盖 |
| 通过率 | 100% |

**门禁命令**: `npm run test:integration`

### Layer 4: 代码审查（Code Review）
| 检查项 | 标准 |
|--------|------|
| 至少 1 名 reviewer | 强制 |
| 2 名 reviewer（核心模块） | 强制 |
| 审查清单完整 | 强制 |
| 解决所有评论 | 强制 |

**审查清单** (Code Review Checklist):
- [ ] 命名规范符合
- [ ] 无重复代码（DRY）
- [ ] 错误处理完善
- [ ] 单元测试已添加
- [ ] 类型定义完整
- [ ] 性能可接受
- [ ] 安全审计通过（无 SQL 注入/XSS/CSRF）
- [ ] 文档已更新

### Layer 5: 端到端测试
| 指标 | 标准 |
|------|------|
| 关键用户流程覆盖 | 100% |
| 浏览器兼容性 | Chrome/Edge/Safari 最新版 |
| 移动端适配 | iOS Safari / Android Chrome |
| 通过率 | 100% |

**门禁命令**: `npm run test:e2e`

### Layer 6: 性能与安全
| 指标 | 标准 |
|------|------|
| 页面加载时间 | 首页 < 2 秒 |
| API P95 延迟 | < 500 毫秒 |
| LCP | < 2.5 秒 |
| FID | < 100 毫秒 |
| CLS | < 0.1 |
| OWASP Top 10 | 无高危漏洞 |
| 渗透测试 | 无 P0/P1 漏洞 |
| 72 小时稳定性 | 零 P0 故障 |

**门禁命令**: `npm run test:performance && npm run test:security`

## 4.2 各里程碑验收标准

### M0 (Phase 0 完成)
- [ ] 规划文档通过评审（PM + 技术负责人签字）
- [ ] AI 自动化方案 v1 通过评审
- [ ] ZS-AI 整合方案 v1 通过评审
- [ ] 云资源采购完成（1 台 16C32G）
- [ ] AI API 账号开通
- [ ] Git 分支策略发布
- [ ] 项目管理看板就绪

### M1 (Phase 1 完成)
- [ ] 8 个外部引擎容器全部 running
- [ ] 数据库 6 张新表迁移成功，可回滚
- [ ] `/api/auth/external-token` 返回有效 token
- [ ] 集成测试 100% 通过
- [ ] Prometheus + Grafana 可见所有引擎指标
- [ ] Phase 1 部署文档完成

### M2 (Phase 2 完成)
- [ ] 8 个 n8n/OpenClaw 管理页面全部接入真实数据
- [ ] n8n 编辑器可创建/修改/执行工作流
- [ ] OpenClaw 智能体可创建/调用
- [ ] WebSocket 实时推送执行状态
- [ ] KYC 业务→OpenClaw 智能体闭环 PoC 跑通
- [ ] 集成测试 100% 通过

### M3 (Phase 3 完成)
- [ ] 12 个 AI 模块页面接入真实模型
- [ ] 4 个区块链页面接入真实存证
- [ ] 4 个 BPM 页面接入真实流程
- [ ] 上链响应 < 3 秒（P95）
- [ ] 3 个业务流程（KYC/提现/Listing）端到端跑通
- [ ] 集成测试 100% 通过

### M4 (Phase 4 完成)
- [ ] 5 个获客页面接入真实平台数据
- [ ] 50 智能体并发 72 小时零 P0 故障
- [ ] P95 延迟 < 3 秒
- [ ] 无高危安全漏洞
- [ ] 性能测试报告完整

### M5 (Phase 5 完成)
- [ ] 灰度发布 100% 无回滚
- [ ] 9 项关键指标告警已配置
- [ ] 用户操作手册审校通过
- [ ] 用户培训反馈 ≥ 4/5
- [ ] 项目验收会议通过
- [ ] 结项报告归档

## 4.3 代码质量量化标准

| 维度 | 指标 | 目标值 |
|------|------|--------|
| **可读性** | 平均函数行数 | ≤ 30 行 |
| **可读性** | 平均文件行数 | ≤ 300 行 |
| **可读性** | 圈复杂度 | ≤ 10 |
| **可维护性** | 重复代码率 | ≤ 5% |
| **可维护性** | 技术债务比率 | ≤ 10% (SonarQube) |
| **可靠性** | 单元测试覆盖率 | ≥ 70% |
| **可靠性** | 关键路径测试 | 100% |
| **性能** | 包大小 | ≤ 500KB (gzip) |
| **性能** | 首屏加载 | ≤ 2 秒 |
| **安全** | CVE 数量 | 0 高危 |
| **安全** | 密钥硬编码 | 0 处 |

## 4.4 文档质量标准

| 文档类型 | 必备内容 | 审查标准 |
|----------|----------|----------|
| **架构设计** | 背景/目标/架构图/接口/数据/部署 | 同行评审通过 |
| **API 文档** | 端点/请求/响应/错误码/示例 | 自动生成 + 人工校对 |
| **用户手册** | 场景/步骤/截图/FAQ | 用户试用通过 |
| **ADR 决策** | 背景/选项/决策/后果 | 团队评审通过 |
| **运维手册** | 部署/配置/监控/应急 | 演练通过 |
| **变更日志** | 日期/类型/描述/影响 | 强制更新 |

---

# 第五部分 风险评估与应急计划

## 5.1 风险登记册

| ID | 风险类别 | 风险描述 | 影响 | 概率 | 风险值 | 应对策略 | 应急计划 | 负责人 |
|----|----------|----------|------|------|--------|----------|----------|--------|
| **R-001** | 技术 | OpenClaw 仍快速迭代，API 不稳定 | 高 | 中 | **12** | 抽象适配层 + 版本锁定 | 锁版本 v3.8，半年不升级 | 后端 |
| **R-002** | 技术 | n8n 大规模并发性能不达预期 | 高 | 低 | **8** | Queue Mode + 充分压测 | 增加 worker 数量，水平扩展 | 运维 |
| **R-003** | 技术 | AI 模型 API 价格波动或供应商限制 | 中 | 高 | **12** | 多模型路由 + 智能降级 | 切换到备用模型，本地小模型兜底 | AI 专家 |
| **R-004** | 技术 | 区块链存证吞吐量瓶颈 | 中 | 中 | **9** | 异步上链 + 内部凭证 | 批量打包上链 | 区块链专家 |
| **R-005** | 技术 | 50 智能体协同复杂度过高 | 高 | 中 | **12** | 分层编排 + 限流隔离 | 降级到 30 智能体 | 后端 |
| **R-006** | 业务 | 获客平台反爬限制（TikTok/Douyin） | 中 | 高 | **12** | 合规接入 + 第三方数据 | 减少抓取频率，转 API | 后端 |
| **R-007** | 业务 | 关键人员离职 | 高 | 中 | **12** | 知识共享 + 文档完善 | 文档齐全，3 天内接手 | PM |
| **R-008** | 进度 | Hyperledger Fabric 学习曲线陡峭 | 中 | 高 | **12** | 提前 PoC + 外部顾问 | 先用简单方案，PoC 后再优化 | 区块链专家 |
| **R-009** | 进度 | 第三方依赖（OpenClaw/n8n）发布延迟 | 中 | 中 | **9** | 锁定版本，避开大版本升级 | 使用 LTS 版本 | 技术负责人 |
| **R-010** | 安全 | Web 攻击（XSS/SQL 注入/CSRF） | 高 | 中 | **12** | 严格输入校验 + WAF | 紧急回滚 + 修补 | 安全 |
| **R-011** | 合规 | 萨摩亚监管政策变化 | 高 | 低 | **6** | 实时跟踪 + 法律顾问 | 调整牌照策略 | PM |
| **R-012** | 运营 | 云资源成本超预算 | 中 | 中 | **9** | 资源监控 + 弹性伸缩 | 降级到小规模部署 | 运维 |
| **R-013** | 用户 | 130+ 页面集成工作量超出预期 | 中 | 中 | **9** | 分批实施 + 优先级排序 | 先核心 30 页面 | PM |
| **R-014** | 集成 | 数据库表名冲突（n8n/Flowable 都有自己的表） | 高 | 中 | **12** | 使用独立 schema | 迁移到独立 DB | 后端 |
| **R-015** | 测试 | 端到端测试覆盖不足 | 中 | 中 | **9** | Playwright 自动化 + 人工 | 推迟上线补测试 | 测试 |

**风险值计算**: 影响(1-5) × 概率(1-5)，≥ 9 为高风险

## 5.2 高风险专项应对

### R-001: OpenClaw API 不稳定
**预防措施**:
1. 封装 `OpenClawClient` 接口，所有调用通过接口
2. 锁定 OpenClaw v3.8 版本，6 个月内不升级
3. 实现接口版本协商（API Versioning）
4. 完整单元测试覆盖 client

**应急计划**:
- 触发条件: OpenClaw 重大变更导致无法工作
- 24 小时内: 切换到 Mock 实现，业务不中断
- 7 天内: 升级适配新 API

### R-003: AI 模型价格/限制
**预防措施**:
1. AI Model Gateway 抽象 5+ 模型
2. 实现 Token 预算管理（按月/按用户）
3. 简单任务用便宜模型（Haiku/MiniMax）
4. 复杂任务用高级模型（Opus/GPT-5）
5. 语义缓存命中率 ≥ 30%

**应急计划**:
- 触发条件: 单一模型不可用 > 1 小时
- 立即: 切换到备用模型
- 24 小时内: 调整 prompt 优化成本
- 长期: 引入本地小模型

### R-005: 50 智能体协同复杂
**预防措施**:
1. 智能体分群隔离（资源池）
2. 限流熔断（Sentinel/Hystrix）
3. 死信队列（DLQ）
4. 完善的监控和告警

**应急计划**:
- 触发条件: 协同失败率 > 5%
- 立即: 降低并发到 30
- 48 小时内: 排查瓶颈
- 1 周内: 架构优化

### R-007: 关键人员离职
**预防措施**:
1. 所有代码强制 Code Review
2. 所有设计决策记录到 ADR
3. 所有架构决策有书面文档
4. 关键岗位 A/B 角配置

**应急计划**:
- 触发条件: 关键人员提交离职
- 立即: 启动知识转移（KT）
- 2 周内: 文档化所有负责模块
- 1 月内: B 角能独立工作

### R-010: Web 攻击
**预防措施**:
1. 所有输入严格校验（Zod）
2. CSP / CORS / CSRF Token
3. SQL 参数化查询
4. 敏感数据加密（AES-256）
5. WAF + DDoS 防护

**应急计划**:
- 触发条件: 发现安全漏洞被利用
- 立即: 紧急回滚到安全版本
- 24 小时内: 修补漏洞
- 7 天内: 复盘 + 加固

### R-014: 数据库表冲突
**预防措施**:
1. n8n / Flowable 使用独立 schema（`n8n.`, `flowable.`, `fabric.`, `openclaw.`）
2. 统一前缀命名约定
3. 自动化迁移工具

**应急计划**:
- 触发条件: 表冲突导致查询失败
- 立即: 切换到独立 DB 实例
- 7 天内: 完整迁移

## 5.3 风险监控机制

| 检查频率 | 检查项 | 工具 | 责任人 |
|----------|--------|------|--------|
| **每日** | 风险登记册更新 | Jira/Confluence | PM |
| **每日** | 生产监控 | Grafana | 运维 |
| **每周** | 风险评审会议 | 会议 | PM + 技术负责人 |
| **每月** | 风险趋势分析 | 报告 | PM |
| **里程碑** | 全面风险评审 | 评审会 | 全员 |

---

# 第六部分 文档规范

## 6.1 文档分类

### 6.1.1 架构设计文档（必须）
- 01-技术栈选型.md
- 02-系统架构图.md
- 03-数据库设计.md
- 04-API设计规范.md
- 05-安全设计.md

### 6.1.2 模块设计文档（按需）
- n8n-集成设计.md
- openclaw-集成设计.md
- AI模型网关设计.md
- 区块链存证设计.md
- BPM流程设计.md
- AI获客设计.md

### 6.1.3 API 文档（自动生成 + 人工）
- 路径: `docs/04-API文档/`
- 工具: OpenAPI 3.0 / Swagger
- 更新时机: 每次 API 变更

### 6.1.4 测试文档
- 测试计划.md
- 测试用例（按功能模块）
- 性能测试报告
- 渗透测试报告

### 6.1.5 部署运维文档
- 部署手册.md
- 监控告警配置.md
- 应急响应手册.md
- 备份恢复手册.md

### 6.1.6 用户文档
- 管理员手册.md
- 运营人员手册.md
- 终端用户 FAQ.md

### 6.1.7 合规与法律文档
- 萨摩亚合规说明.md
- 隐私政策.md
- 风险提示.md
- 用户协议.md

### 6.1.8 设计规范文档
- 视觉设计规范.md
- 组件库文档.md
- 交互规范.md

### 6.1.9 决策记录（ADR）
- 路径: `docs/01-项目总体规划/DECISIONS.md`
- 格式: NNN-标题.md
- 必须记录: 背景 / 选项 / 决策 / 后果

## 6.2 文档模板

### 6.2.1 架构设计文档模板

```markdown
# {模块名} 架构设计

## 1. 背景与目标
[为什么需要 / 要解决什么问题 / 业务目标]

## 2. 设计原则
[遵循的设计原则]

## 3. 架构图
[ASCII / Mermaid / 链接到图片]

## 4. 技术选型
| 选项 | 优点 | 缺点 | 决策 |
|------|------|------|------|
| ... | ... | ... | ✅ |

## 5. 详细设计
### 5.1 接口设计
### 5.2 数据模型
### 5.3 流程图
### 5.4 异常处理

## 6. 部署架构
[Docker / K8s / 端口]

## 7. 性能指标
| 指标 | 目标值 | 测量方法 |
|------|--------|----------|

## 8. 安全考虑
[鉴权 / 加密 / 审计]

## 9. 测试策略
[单元 / 集成 / E2E]

## 10. 风险与限制
[已知风险 / 临时方案]
```

### 6.2.2 ADR 模板

```markdown
# ADR-NNN: {决策标题}

## 状态
[Proposed | Accepted | Deprecated | Superseded by ADR-XXX]

## 日期
YYYY-MM-DD

## 背景
[什么情况下需要决策？]

## 考虑的选项
### 选项 A: ...
- 优点: ...
- 缺点: ...

### 选项 B: ...
- 优点: ...
- 缺点: ...

## 决策
[选择哪个选项？理由？]

## 后果
### 积极影响
- ...

### 消极影响
- ...

### 需要采取的行动
- ...
```

## 6.3 文档编写规范

### 6.3.1 Markdown 规范
- 标题层级: H1 > H2 > H3，避免跳级
- 代码块必须指定语言
- 表格对齐使用 `|---|` `|:---:` `|---:|`
- 链接使用相对路径
- 图片带 alt 文本

### 6.3.2 中英文混排
- 技术术语保留英文（API, WebSocket, JWT）
- 中文使用全角标点，英文使用半角标点
- 数字与中文之间留空格: `50 个` 不是 `50个`

### 6.3.3 版本管理
- 文档纳入 Git 版本控制
- 重大变更使用 v1, v2, v3 后缀
- 文档底部维护变更日志

## 6.4 文档审查流程

| 阶段 | 责任人 | 动作 |
|------|--------|------|
| 起草 | 编写人 | 完成初稿 |
| 自审 | 编写人 | 检查完整性 |
| 同行评审 | 1 名同事 | 内容准确性 |
| 终审 | 技术负责人 | 最终批准 |
| 发布 | PM | 推送到文档库 |
| 通知 | PM | 邮件/Slack 通知干系人 |

---

# 第七部分 治理与审查机制

## 7.1 定期审查

### 7.1.1 每日站会（Daily Standup）
- **时间**: 每天上午 9:30（15 分钟）
- **参与**: 全员
- **内容**:
  - 昨天完成什么
  - 今天计划做什么
  - 遇到什么障碍

### 7.1.2 周会（Weekly Review）
- **时间**: 每周五下午 4:00（1 小时）
- **参与**: 全员
- **内容**:
  - 本周里程碑达成情况
  - 风险评估更新
  - 下周计划
  - 关键决策同步

### 7.1.3 里程碑评审（Milestone Review）
- **时间**: 每个里程碑结束时
- **参与**: 全员 + 发起人
- **内容**:
  - 验收标准逐项确认
  - 演示可交付成果
  - 偏差分析与调整
  - 下里程碑 kickoff

### 7.1.4 每月回顾（Monthly Retrospective）
- **时间**: 每月最后一周
- **参与**: 全员
- **内容**:
  - 进度偏差分析
  - 质量数据回顾
  - 风险趋势分析
  - 流程改进建议

## 7.2 变更控制

### 7.2.1 变更类型
- **L1 重大变更**（影响范围/时间/预算 > 10%）
  - 需发起人审批
  - 文档化（DECISIONS.md）
- **L2 中等变更**（影响 5-10%）
  - 需 PM + 技术负责人审批
  - 记录到周报
- **L3 小变更**（影响 < 5%）
  - 团队内部决策
  - 记录到站会

### 7.2.2 变更流程
```
1. 提出变更请求 (RFC)
2. 影响评估
3. 评审会讨论
4. 决策（按变更级别审批）
5. 更新规划文档
6. 通知干系人
7. 跟踪执行
```

## 7.3 沟通机制

| 沟通类型 | 工具 | 频率 | 责任人 |
|----------|------|------|--------|
| 即时沟通 | Slack/飞书 | 实时 | 所有人 |
| 代码审查 | GitHub PR | 提交时 | 作者 + Reviewer |
| 文档协作 | Notion/Confluence | 按需 | 编写人 |
| 任务跟踪 | Jira/飞书项目 | 每日 | PM |
| 监控告警 | PagerDuty/飞书 | 实时 | 运维 |
| 周报邮件 | Email | 每周五 | PM |

## 7.4 合规性验证

### 7.4.1 每周合规检查清单
- [ ] 所有任务已记录在看板
- [ ] 所有 PR 已通过 Code Review
- [ ] 所有变更已记录到 DECISIONS.md
- [ ] 所有里程碑验收已完成
- [ ] 所有风险已更新
- [ ] 所有文档已更新
- [ ] 所有测试已通过

### 7.4.2 每月合规审计
- 审计项: 文档完整性、命名规范、测试覆盖、安全合规
- 审计人: 内部审计员或外部
- 审计报告: 归档到 `docs/审计报告/`

## 7.5 文档更新责任

| 文档 | 更新触发 | 责任人 |
|------|----------|--------|
| 总体规划 | 重大变更 | PM |
| 架构设计 | 架构变更 | 技术负责人 |
| API 文档 | API 变更 | 后端 |
| 模块设计 | 模块变更 | 模块负责人 |
| 用户手册 | 功能变更 | 文档专员 |
| 部署手册 | 部署变更 | 运维 |
| 变更日志 | 任何发布 | PM |

---

# 附录

## 附录 A: 项目关键指标仪表盘

```
┌─────────────────────────────────────────────────────┐
│  ZS-AI 项目仪表盘 (实时更新)                          │
├─────────────────────────────────────────────────────┤
│  进度:  ████████░░░░░░░░░░░░ 40% (Phase 2 完成)     │
│  质量:  ████████████████░░░░ 80% (单元测试 75%)      │
│  预算:  ████████░░░░░░░░░░░░ 40% (已用 50/124 万)  │
│  风险:  2 高 / 5 中 / 8 低 (新增 R-016)             │
│  团队:  10 人 (前端 3 / 后端 3 / AI 1 / 测试 1 / 运维 1) │
└─────────────────────────────────────────────────────┘
```

## 附录 B: 相关文档清单

| 文档 | 路径 | 状态 |
|------|------|------|
| 项目总体规划 (本文档) | docs/01-项目总体规划/ZS-AI-Master-Plan-v1.md | 📋 待审批 |
| AI 自动化方案 v1 | docs/AI_Automation_Enterprise_Solution_Tech_Plan_v1.md | ✅ 已完成 |
| ZS-AI 整合方案 v1 | docs/ZS_AI_Integration_Plan_v1.md | ✅ 已完成 |
| ZS Exchange 官网提示词 | docs/ZS_Exchange_Official_Website_AI_Collaboration_Prompts_v1.md | ✅ 已完成 |
| 官网基准分析 v2 | docs/ZS_Exchange_Official_Website_Benchmark_Analysis_Replication_Plan_v2.md | ✅ 已完成 |
| 颜色规范 | docs/COLOR_SPECIFICATION.md | ✅ 已完成 |
| 工作日志 | docs/01-项目总体规划/WORK_LOG.md | ✅ 持续更新 |
| 国链数据联盟 | docs/国链数据联盟_构建信用数据互联生态计划书_2026年2.0版本_完整版.md | ✅ 归档 |

## 附录 C: 工具与依赖

### 开发工具
| 工具 | 用途 |
|------|------|
| VS Code | 主 IDE |
| Trae IDE | AI 协同开发 |
| Git | 版本控制 |
| GitHub | 代码托管 + PR |
| Slack/飞书 | 即时沟通 |
| Jira/Notion | 项目管理 |
| Postman | API 测试 |
| DataGrip | 数据库 GUI |
| Docker Desktop | 本地容器 |
| TablePlus | 数据库管理 |

### 技术栈
| 类别 | 选型 |
|------|------|
| 前端框架 | Next.js 14 + React 18 + TypeScript 5 |
| UI 库 | Ant Design 5 + Tailwind 3.4 |
| 状态管理 | Zustand 4.4 + TanStack Query 5 |
| 后端 | Next.js API Routes + NestJS（未来） |
| 数据库 | PostgreSQL 16 + Redis 7 + MongoDB 7 |
| 向量库 | Milvus 2.4 |
| 消息队列 | Kafka 3 |
| 区块链 | Hyperledger Fabric 2.5 |
| 工作流 | n8n v2.0 |
| 智能体 | OpenClaw v3.8 |
| BPM | Flowable 7 |
| 监控 | Prometheus + Grafana |
| 日志 | ELK |
| CI/CD | GitHub Actions |

## 附录 D: 团队联系表

| 角色 | 姓名 | 联系方式 | 备份 |
|------|------|----------|------|
| 项目发起人 | 待填 | | |
| 项目经理 | 待填 | | |
| 技术负责人 | 待填 | | |
| 前端组长 | 待填 | | |
| 后端组长 | 待填 | | |
| AI 专家 | 待填 | | |
| 区块链专家 | 待填 | | |
| 测试负责人 | 待填 | | |
| 运维负责人 | 待填 | | |
| AI 协同系统 | 7×24 | 自动 | 备份 |

## 附录 E: 文档变更历史

| 版本 | 日期 | 变更人 | 变更内容 |
|------|------|--------|----------|
| v1.0 | 2026-06-09 | AI 协同系统 | 初始版本 |

---

## 📋 文档审批

| 角色 | 姓名 | 审批状态 | 签字日期 |
|------|------|----------|----------|
| 项目发起人 | _____ | ☐ 待审 | _____ |
| 项目经理 | _____ | ☐ 待审 | _____ |
| 技术负责人 | _____ | ☐ 待审 | _____ |
| 安全负责人 | _____ | ☐ 待审 | _____ |
| 合规负责人 | _____ | ☐ 待审 | _____ |

> **批准声明**: 本规划文档经上述人员批准后生效。所有后续项目活动必须严格遵循本规划。任何必要的调整必须通过变更控制流程进行审批，并记录到 DECISIONS.md。

---

**END OF DOCUMENT**

*本规划文档由 AI 协同开发系统自动生成，最终解释权归项目团队所有。*
