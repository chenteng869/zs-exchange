# ZS Exchange × AI 平台整合改造计划（主文档）

> **项目代号**: ZS-AI Refactor
> **整合对象**: ZS Exchange 中萨数字科技交易所 + AI 自动化平台
> **文档版本**: v1.0
> **创建日期**: 2026-06-11
> **配套文档**: `ZS_AI_Integration_Plan_v1.md` / `AI_Automation_Dev_Workflow_v1.md`
> **目标**: 11 周完成 130+ 页面改造，节省 50% 预算，3 秒存证，50+ 并发智能体

---

## 一、改造背景与目标

### 1.1 背景
ZS Exchange 后台已具备 130+ 管理页面（覆盖 AI 中心、智能体、工作流、区块链、BPM、获客、钱包、交易等），通过扫描 `src/app/admin/` 目录可发现：所有 AI 自动化平台所需模块已经预留。本计划聚焦"把外部 AI 引擎无缝接入到现有页面"，而非"从零开发"。

### 1.2 目标
| 维度 | 当前状态 | 目标状态 |
|------|----------|----------|
| 页面数量 | 130+ mock 页面 | 130+ 真实数据页面 |
| 数据接入 | mock / useMockWebSocket | 真实外部引擎 API + WebSocket |
| 鉴权 | ZS 现有 authStore | 统一 + 外部引擎 token 代理 |
| 数据库 | 单一 PG 业务库 | PG + 引擎表（n8n. flowable. fabric.）+ 跨库查询 |
| 智能体并发 | 0 | 50+ |
| 区块链存证 | mock | Hyperledger Fabric PoC 接入，< 3 秒 |
| 工作流 | 静态页面 | n8n Queue Mode，真实执行 |
| BPM | 静态页面 | Flowable 7.x 接入 |
| 总工时 | - | 1540 人天（11 周 × 8 人 × 平均 17.5 天/周） |

### 1.3 核心原则
1. **复用优先**：85% 页面只需配置层改造，10% 中度重构，5% 重新开发
2. **数据打通**：所有引擎共享 ZS Exchange PostgreSQL，通过 schema 隔离
3. **统一品牌**：继续使用 ZS 现有 design-taste tokens + Ant Design 5
4. **渐进式发布**：按"核心 → 完整 → 性能"三波灰度上线

---

## 二、改造页面分类（130+）

### 2.1 总览

| 改造类型 | 数量 | 占比 | 工作量占比 | 负责人 |
|----------|------|------|------------|--------|
| 第一类：完全复用（不需改造） | 30 | 23% | 0% | 0 |
| 第二类：轻度改造（修改配置） | 40 | 31% | 15% | 前端2人 |
| 第三类：中度改造（重构代码） | 35 | 27% | 35% | 前端2人+后端1人 |
| 第四类：重度改造（重新开发） | 25 | 19% | 50% | 前端2人+后端2人+架构1人 |
| **合计** | **130+** | **100%** | **100%** | **8 人 × 11 周** |

---

### 2.2 第一类：完全复用（30 页面）— 不需改造

#### 鉴权登录相关（5）
| 路径 | 现有功能 | 不改造原因 |
|------|----------|------------|
| `/admin/login` | 登录页 | ZS 现有 authStore 已支持 JWT + RBAC |
| `/admin/forgot-password` | 忘记密码 | 复用 |
| `/admin/reset-password` | 重置密码 | 复用 |
| `/admin/mfa` | 双因素认证 | 复用 |
| `/admin/sso-callback` | SSO 回调 | 复用 |

#### 用户管理基础页（8）
| 路径 | 现有功能 | 不改造原因 |
|------|----------|------------|
| `/admin/users` | 用户列表 | UI 完整，仅需后端联调 |
| `/admin/users/kyc` | KYC 审核 | 后续由 BPM 触发即可 |
| `/admin/users/levels` | 用户等级 | 数据静态 |
| `/admin/users/invite` | 邀请列表 | 业务逻辑稳定 |
| `/admin/settings/admins` | 管理员 | RBAC 已有 |
| `/admin/settings/roles` | 角色 | RBAC 已有 |
| `/admin/audit-logs` | 审计日志 | 直接对接 PG 表 |
| `/admin/settings/page` | 系统设置 | 配置类 |

#### 通用组件页（7）
| 路径 | 现有功能 | 不改造原因 |
|------|----------|------------|
| `/admin/dashboard` | 总览仪表板 | 复用现有 mock，仅替换数据源 |
| `/admin/finance` | 财务总览 | 同上 |
| `/admin/finance/overview` | 财务概览 | 同上 |
| `/admin/finance/revenue` | 营收 | 同上 |
| `/admin/finance/reconciliation` | 对账 | 同上 |
| `/admin/finance/settlement` | 结算 | 同上 |
| `/admin/transactions/page` | 交易总览 | 同上 |

#### 内容/合规/合规（10）
| 路径 | 现有功能 | 不改造原因 |
|------|----------|------------|
| `/admin/compliance/page` | 合规首页 | 静态展示 |
| `/admin/compliance/aml` | AML | 静态展示 |
| `/admin/compliance/risk` | 风控 | 静态展示 |
| `/admin/license/page` | 牌照首页 | 静态 |
| `/admin/license/portfolio` | 牌照组合 | 静态 |
| `/admin/license/jurisdictions` | 司法管辖区 | 静态 |
| `/admin/license/governance` | 治理 | 静态 |
| `/admin/license/audit` | 牌照审计 | 静态 |
| `/admin/content/page` | 内容首页 | 静态 |
| `/admin/content/audit` | 内容审核 | 静态 |

> **第一类合计：30 页面，工时 = 0 人天**（只需保证不破坏现有逻辑即可）

---

### 2.3 第二类：轻度改造（40 页面）— 修改配置层

#### n8n 编辑器（4）
| 路径 | 现有功能 | 改造内容 | 技术实现 | 数据流转 | 接口需求 | 测试标准 |
|------|----------|----------|----------|----------|----------|----------|
| `/admin/n8n/editor` | 静态工作流编辑器 | 切换到真实 n8n API | 使用 `n8n-client.ts` 替换 mock | 用户编辑 → fetch n8n `/workflows` | `GET/POST /api/n8n/proxy/workflows` | 创建/保存/执行全部成功 |
| `/admin/n8n/history` | mock 执行历史 | 拉取真实 execution | WebSocket 订阅 | n8n push → UI 实时刷新 | `GET /api/n8n/proxy/executions` + WS | 显示状态、耗时、节点 |
| `/admin/n8n/templates` | 静态模板 | 拉取 n8n 官方模板库 | 调用 n8n API | - | `GET /api/n8n/proxy/templates` | 30+ 模板可见 |
| `/admin/n8n/triggers` | 静态触发器 | 接入真实 cron/webhook | n8n triggers API | ZS 业务事件 → n8n trigger | `POST /api/n8n/proxy/triggers` | 定时/事件触发均通 |

#### OpenClaw 仪表板（4）
| 路径 | 现有功能 | 改造内容 | 技术实现 | 数据流转 | 接口需求 | 测试标准 |
|------|----------|----------|----------|----------|----------|----------|
| `/admin/openclaw/monitor-dashboard` | mock 监控 | 接入 Gateway WebSocket | ws://openclaw:18789 | 智能体事件 → 仪表板 | `WS /api/ws/openclaw` | 实时刷新 < 2s |
| `/admin/openclaw/marketplace` | 静态市场 | 接入智能体商店 API | REST 拉取 | - | `GET /api/openclaw/proxy/agents` | 列表/搜索/筛选 |
| `/admin/openclaw/orchestration` | 静态编排 | 调用真实编排接口 | - | - | `POST /api/openclaw/proxy/orchestrations` | 多智能体协同 |
| `/admin/openclaw/training` | 静态训练 | 接入训练任务 API | - | - | `POST /api/openclaw/proxy/train` | 任务提交、状态查询 |

#### AI 中心（7）
| 路径 | 现有功能 | 改造内容 | 技术实现 | 数据流转 | 接口需求 | 测试标准 |
|------|----------|----------|----------|----------|----------|----------|
| `/admin/ai-center/config` | 模型配置 | 接入 GPT-5/Claude API 配置 | 通过 API Gateway | 密钥不入库，用 KMS | `GET/POST /api/ai/config` | 4+ 模型可见 |
| `/admin/ai-center/hazard-detection` | 风险检测 | 接入风控模型 | 调用 AI Model Gateway | 用户行为 → 风险评分 | `POST /api/ai/hazard` | P95 < 1s |
| `/admin/ai-center/knowledge-graph` | 知识图谱 | 接入 Neo4j/Milvus | - | - | `GET /api/ai/kg/query` | 关系查询 < 1s |
| `/admin/ai-center/risk-prediction` | 风险预测 | 接入预测模型 | - | - | `POST /api/ai/risk/predict` | 准确率 > 80% |
| `/admin/ai-center/smart-decision` | 智能决策 | 决策引擎 API | - | - | `POST /api/ai/decision` | 决策可追溯 |
| `/admin/ai-center/voice-interaction` | 语音交互 | 接入 ASR/TTS | - | - | `WS /api/ai/voice` | 延迟 < 500ms |
| `/admin/ai-center/model-management` | 模型管理 | 接入模型注册中心 | - | - | `GET/POST /api/ai/models` | CRUD 全部通过 |

#### AI-LLM（5）
| 路径 | 现有功能 | 改造内容 | 技术实现 | 数据流转 | 接口需求 | 测试标准 |
|------|----------|----------|----------|----------|----------|----------|
| `/admin/ai-llm/model-management` | 模型列表 | 接入 LLM 路由 | - | - | `GET /api/llm/models` | 6+ 模型可见 |
| `/admin/ai-llm/cost-analysis` | 静态成本 | 接入真实账单 | 从 ai_llm_logs 聚合 | - | `GET /api/llm/cost` | 按模型/时间统计 |
| `/admin/ai-llm/prompt-engineering` | 静态提示词 | 提示词版本管理 | - | - | `CRUD /api/llm/prompts` | A/B 测试可见 |
| `/admin/ai-llm/intelligent-recognition` | 静态识别 | 接入 OCR/NER | - | - | `POST /api/llm/recognize` | 准确率 > 90% |
| `/admin/ai-llm/recommendation` | 静态推荐 | 接入推荐引擎 | - | - | `GET /api/llm/recommend` | Top 5 准确 |

#### BPM（4）
| 路径 | 现有功能 | 改造内容 | 技术实现 | 数据流转 | 接口需求 | 测试标准 |
|------|----------|----------|----------|----------|----------|----------|
| `/admin/bpm/monitoring` | 静态监控 | 接入 Flowable | - | Flowable push → 仪表板 | `GET /api/bpm/processes` | 实时状态 |
| `/admin/bpm/runtime` | 静态运行时 | 接入 Flowable Task | - | - | `GET /api/bpm/tasks` | 我的任务可见 |
| `/admin/bpm/analysis` | 静态分析 | 聚合统计 | - | - | `GET /api/bpm/analysis` | 多维统计 |
| `/admin/bpm/modeling` | 静态建模 | 接入 Flowable Modeler | iframe 嵌入 | - | `GET /api/bpm/models` | 模型 CRUD |

#### 区块链浏览器（4）
| 路径 | 现有功能 | 改造内容 | 技术实现 | 数据流转 | 接口需求 | 测试标准 |
|------|----------|----------|----------|----------|----------|----------|
| `/admin/blockchain/explorer` | 静态浏览器 | 接入 Fabric SDK | - | - | `GET /api/blockchain/blocks` | 区块可追溯 |
| `/admin/blockchain/node-management` | 静态节点 | 接入 peer/orderer | - | - | `GET /api/blockchain/nodes` | 4+ 节点 |
| `/admin/blockchain/smart-contract` | 静态合约 | 接入 chaincode | - | - | `GET /api/blockchain/contracts` | 合约 CRUD |
| `/admin/blockchain/evidence-chain` | mock 存证 | **接入真实存证** | **关键** | 异步上链 + 即时凭证 | `POST /api/blockchain/notarize` | P95 < 1s |

#### 获客（5）
| 路径 | 现有功能 | 改造内容 | 技术实现 | 数据流转 | 接口需求 | 测试标准 |
|------|----------|----------|----------|----------|----------|----------|
| `/admin/dsales/network` | 静态网络 | 接入代理网络 | - | - | `GET /api/dsales/network` | 树形结构 |
| `/admin/dsales/products` | 静态产品 | 接入 SKU | - | - | `GET /api/dsales/products` | CRUD |
| `/admin/dsales/commission` | 静态佣金 | 接入结算引擎 | - | - | `GET /api/dsales/commission` | 实时计算 |
| `/admin/dsales/training` | 静态培训 | 接入 LMS | - | - | `GET /api/dsales/training` | 课程列表 |
| `/admin/dsales/compliance` | 静态合规 | 接入合规检查 | - | - | `GET /api/dsales/compliance` | 规则引擎 |

#### 量化（5）
| 路径 | 现有功能 | 改造内容 | 技术实现 | 数据流转 | 接口需求 | 测试标准 |
|------|----------|----------|----------|----------|----------|----------|
| `/admin/quant/strategies` | 静态策略 | 接入策略引擎 | - | - | `GET /api/quant/strategies` | 策略 CRUD |
| `/admin/quant/backtest` | 静态回测 | 接入回测服务 | - | - | `POST /api/quant/backtest` | 历史回放 |
| `/admin/quant/performance` | 静态业绩 | 接入 PnL 计算 | - | - | `GET /api/quant/pnl` | 实时 PnL |
| `/admin/quant/risk` | 静态风控 | 接入风控指标 | - | - | `GET /api/quant/risk` | VaR/CVaR |
| `/admin/quant/subscriptions` | 静态订阅 | 接入订阅服务 | - | - | `GET /api/quant/subs` | 订阅管理 |

#### 命令中心（9）
| 路径 | 现有功能 | 改造内容 | 技术实现 | 数据流转 | 接口需求 | 测试标准 |
|------|----------|----------|----------|----------|----------|----------|
| `/admin/command/global-overview` | 静态总览 | 接入全局数据 | - | - | `GET /api/command/overview` | 实时数据 |
| `/admin/command/heatmap` | 静态热力图 | 接入用户行为 | - | - | `GET /api/command/heatmap` | 5 分钟延迟 |
| `/admin/command/risk-map` | 静态风险地图 | 接入地理数据 | - | - | `GET /api/command/risk-map` | 地图可视化 |
| `/admin/command/trend-analysis` | 静态趋势 | 接入 ClickHouse | - | - | `GET /api/command/trends` | 多维分析 |
| `/admin/command/realtime-alerts` | 静态告警 | WebSocket 推送 | - | 事件 → UI | `WS /api/command/alerts` | < 1s 推送 |
| `/admin/command/performance-board` | 静态绩效 | 接入绩效数据 | - | - | `GET /api/command/perf` | 团队/个人 |
| `/admin/command/video-monitor` | 静态视频 | 接入 RTSP 流 | - | - | `GET /api/command/video/list` | 4+ 摄像头 |
| `/admin/command/emergency-command` | 静态应急 | 接入应急流程 | - | - | `POST /api/command/emergency` | 一键启动 |
| `/admin/command/demo` | 演示页 | 接入演示数据 | - | - | - | 演示通过 |

> **第二类合计：40 页面，工时 = 200 人天**（平均 5 人天/页）

---

### 2.4 第三类：中度改造（35 页面）— 重构代码

#### BPM 建模器（重构：4）
| 路径 | 现有功能 | 改造内容 | 技术实现 | 数据流转 | 接口需求 | 测试标准 |
|------|----------|----------|----------|----------|----------|----------|
| `/admin/bpm/modeling` | 简单流程图 | **集成 bpmn.js + Flowable Modeler** | iframe 嵌入 + 自定义面板 | - | `GET /api/bpm/modeler/:key` | 拖拽/保存/部署 |
| `/admin/bpm/runtime` | 列表 | **任务动态表单** | 动态渲染 JSON Schema | - | `GET /api/bpm/task/form` | 20+ 表单类型 |
| `/admin/bpm/monitoring` | 列表 | **流程实时追踪** | 集成 bpmn-viewer | - | `GET /api/bpm/trace/:id` | 高亮当前节点 |
| `/admin/bpm/analysis` | 静态 | **Bottleneck 分析** | 自研算法 | - | `GET /api/bpm/bottleneck` | Top 5 瓶颈 |

#### 区块链浏览器（4）
| 路径 | 现有功能 | 改造内容 | 技术实现 | 数据流转 | 接口需求 | 测试标准 |
|------|----------|----------|----------|----------|----------|----------|
| `/admin/blockchain/explorer` | 静态 | **真实交易可视化** | ECharts + DAG 图 | - | `GET /api/blockchain/tx/:hash` | 完整交易链路 |
| `/admin/blockchain/evidence-chain` | mock | **凭证验证 UI** | 二维码 + 链上验证 | - | `GET /api/blockchain/verify/:certId` | 验证 < 2s |
| `/admin/blockchain/smart-contract` | 静态 | **合约 IDE** | Monaco Editor + 编译 | - | `POST /api/blockchain/contract/deploy` | 部署 < 5s |
| `/admin/blockchain/node-management` | 静态 | **节点健康监控** | 实时指标 | - | `WS /api/blockchain/nodes/health` | 30s 刷新 |

#### 获客看板（5）
| 路径 | 现有功能 | 改造内容 | 技术实现 | 数据流转 | 接口需求 | 测试标准 |
|------|----------|----------|----------|----------|----------|----------|
| `/admin/dsales/network` | 静态树 | **实时收益分配** | WebSocket 推送 | - | `WS /api/dsales/network/live` | < 5s 延迟 |
| `/admin/dsales/commission` | 静态 | **多级佣金计算引擎** | 自研规则引擎 | - | `POST /api/dsales/commission/calc` | 100 万级数据 |
| `/admin/dsales/compliance` | 静态 | **多司法管辖区规则** | 规则配置 UI | - | `POST /api/dsales/compliance/check` | 50+ 规则 |
| `/admin/dsales/training` | 静态 | **视频课程播放器** | HLS + DRM | - | `GET /api/dsales/training/video/:id` | 流畅播放 |
| `/admin/dsales/products` | 静态 | **多语言产品管理** | i18n + 富文本 | - | `CRUD /api/dsales/products` | 10+ 语言 |

#### CEX 业务（8）
| 路径 | 现有功能 | 改造内容 | 技术实现 | 数据流转 | 接口需求 | 测试标准 |
|------|----------|----------|----------|----------|----------|----------|
| `/admin/cex/spot` | 静态 | **实时订单簿** | WebSocket | 撮合引擎 → UI | `WS /api/cex/orderbook` | 深度 20 档 |
| `/admin/cex/futures` | 静态 | **资金费率计算** | 自研公式 | - | `GET /api/cex/funding` | 8h 计算准确 |
| `/admin/cex/margin` | 静态 | **强平引擎监控** | 实时指标 | - | `WS /api/cex/liquidation` | < 1s 推送 |
| `/admin/cex/leverage` | 静态 | **杠杆风险指标** | 实时计算 | - | `GET /api/cex/leverage/risk` | 100+ 用户 |
| `/admin/cex/risk` | 静态 | **风险敞口分析** | 实时聚合 | - | `GET /api/cex/risk/exposure` | 多维度 |
| `/admin/cex/orders` | 静态 | **订单生命周期追踪** | 状态机可视化 | - | `WS /api/cex/orders/lifecycle` | 实时 |
| `/admin/cex/pairs` | 静态 | **交易对配置** | 动态配置 | - | `CRUD /api/cex/pairs` | 上/下架 |
| `/admin/cex/market` | 静态 | **市场数据深度** | OKX/Binance 接入 | - | `GET /api/cex/market/depth` | 5+ 交易所 |

#### DEX（4）
| 路径 | 现有功能 | 改造内容 | 技术实现 | 数据流转 | 接口需求 | 测试标准 |
|------|----------|----------|----------|----------|----------|----------|
| `/admin/dex/pools` | 静态 | **AMM 池子监控** | 链上事件订阅 | - | `WS /api/dex/pools/events` | 实时 |
| `/admin/dex/pairs` | 静态 | **DEX 聚合路由** | 1inch/0x 集成 | - | `GET /api/dex/quote` | 5+ 协议 |
| `/admin/dex/farming` | 静态 | **收益聚合器** | 实时 APY | - | `GET /api/dex/farming/apy` | 50+ 池 |
| `/admin/dex/swap` | 静态 | **兑换路由优化** | 路径规划 | - | `POST /api/dex/swap/quote` | 最优路径 |

#### DeFi（3）
| 路径 | 现有功能 | 改造内容 | 技术实现 | 数据流转 | 接口需求 | 测试标准 |
|------|----------|----------|----------|----------|----------|----------|
| `/admin/defi/staking` | 静态 | **多链质押** | 链上交互 | - | `POST /api/defi/stake` | 5+ 链 |
| `/admin/defi/liquidity` | 静态 | **无常损失计算** | 自研公式 | - | `GET /api/defi/il` | 准确 |
| `/admin/defi/rewards` | 静态 | **奖励分发追踪** | 链上事件 | - | `WS /api/defi/rewards` | 实时 |

#### IDO（5）
| 路径 | 现有功能 | 改造内容 | 技术实现 | 数据流转 | 接口需求 | 测试标准 |
|------|----------|----------|----------|----------|----------|----------|
| `/admin/ido/projects` | 静态 | **白名单 + KYC 联动** | 智能合约交互 | - | `POST /api/ido/whitelist` | 链上验证 |
| `/admin/ido/subscriptions` | 静态 | **认购实时进度** | 链上数据 | - | `WS /api/ido/subs` | 实时 |
| `/admin/ido/distribution` | 静态 | **代币分发合约** | 合约调用 | - | `POST /api/ido/distribute` | 原子性 |
| `/admin/ido/unlock` | 静态 | **线性释放计算** | 公式引擎 | - | `GET /api/ido/unlock/schedule` | 准确 |
| `/admin/ido/whitelist` | 静态 | **Merkle 树生成** | 自研算法 | - | `POST /api/ido/whitelist/merkle` | 1 万级用户 |

#### NFT（3）
| 路径 | 现有功能 | 改造内容 | 技术实现 | 数据流转 | 接口需求 | 测试标准 |
|------|----------|----------|----------|----------|----------|----------|
| `/admin/nfts` | 静态 | **多链 NFT 聚合** | 链上 API | - | `GET /api/nft/aggregator` | 5+ 链 |
| `/admin/nfts/mint` | 静态 | **批量铸造** | 合约批量 | - | `POST /api/nft/mint/batch` | 1000+ NFT |
| `/admin/nfts/series` | 静态 | **稀有度分析** | 元数据聚合 | - | `GET /api/nft/rarity` | 算法准确 |

#### 上币（4）
| 路径 | 现有功能 | 改造内容 | 技术实现 | 数据流转 | 接口需求 | 测试标准 |
|------|----------|----------|----------|----------|----------|----------|
| `/admin/listing/pipeline` | 静态 | **BPM 审批集成** | Flowable 触发 | - | `POST /api/listing/start-bpm` | 流程可追溯 |
| `/admin/listing/hk` | 静态 | **港股合规规则** | 规则引擎 | - | `POST /api/listing/hk/check` | 50+ 规则 |
| `/admin/listing/samoa` | 静态 | **萨摩亚规则** | 规则引擎 | - | `POST /api/listing/samoa/check` | 30+ 规则 |
| `/admin/listing/post-listing` | 静态 | **上市后监控** | 实时指标 | - | `WS /api/listing/monitor` | < 5s |

#### 内容（4）
| 路径 | 现有功能 | 改造内容 | 技术实现 | 数据流转 | 接口需求 | 测试标准 |
|------|----------|----------|----------|----------|----------|----------|
| `/admin/content/drama` | 静态 | **AI 剧本生成** | LLM 调用 | - | `POST /api/content/drama/generate` | 5 分钟生成 |
| `/admin/content/animation` | 静态 | **AI 动画脚本** | LLM + 模板 | - | `POST /api/content/anim/script` | 多风格 |
| `/admin/content/heritage` | 静态 | **非遗知识图谱** | Neo4j | - | `GET /api/content/heritage/kg` | 关系查询 |
| `/admin/content/nft` | 静态 | **内容 NFT 化** | 链上铸造 | - | `POST /api/content/nft/mint` | 链上确认 |

#### 钱包（5）
| 路径 | 现有功能 | 改造内容 | 技术实现 | 数据流转 | 接口需求 | 测试标准 |
|------|----------|----------|----------|----------|----------|----------|
| `/admin/wallet/assets` | 静态 | **多链资产聚合** | 链上 API | - | `GET /api/wallet/assets/multi-chain` | 10+ 链 |
| `/admin/wallet/transactions` | 静态 | **交易追踪** | 链上浏览器 | - | `WS /api/wallet/tx/track` | 实时确认 |
| `/admin/wallet/addresses` | 静态 | **地址标签管理** | 自研标签库 | - | `CRUD /api/wallet/addresses` | 1 万+ 标签 |
| `/admin/wallet/nfts` | 静态 | **NFT 估值** | 链上 + 链下 | - | `GET /api/wallet/nft/valuation` | 5+ 来源 |
| `/admin/wallet/security` | 静态 | **多签配置** | Gnosis Safe | - | `POST /api/wallet/multisig` | 链上确认 |

#### 量化（5）
| 路径 | 现有功能 | 改造内容 | 技术实现 | 数据流转 | 接口需求 | 测试标准 |
|------|----------|----------|----------|----------|----------|----------|
| `/admin/quant/strategies` | 静态 | **策略沙箱** | 隔离容器 | - | `POST /api/quant/strategy/run` | 沙箱隔离 |
| `/admin/quant/backtest` | 静态 | **分布式回测** | Spark/Flink | - | `POST /api/quant/backtest/dist` | 100x 加速 |
| `/admin/quant/performance` | 静态 | **实时 PnL** | 增量计算 | - | `WS /api/quant/pnl/live` | < 1s |
| `/admin/quant/risk` | 静态 | **蒙特卡洛模拟** | GPU 加速 | - | `POST /api/quant/risk/simulate` | 1 万次模拟 |
| `/admin/quant/subscriptions` | 静态 | **信号分发** | 多渠道推送 | - | `WS /api/quant/signals` | < 500ms |

> **第三类合计：35 页面，工时 = 525 人天**（平均 15 人天/页）

---

### 2.5 第四类：重度改造（25 页面）— 重新开发

#### 智能体对话界面（4）
| 路径 | 现有功能 | 改造内容 | 技术实现 | 数据流转 | 接口需求 | 测试标准 |
|------|----------|----------|----------|----------|----------|----------|
| `/admin/ai-center/voice-interaction` | 静态 | **WebSocket 实时语音** | WebRTC + ASR/TTS 流式 | 客户端 ↔ OpenClaw ↔ AI | `WS /api/ai/voice/stream` | 延迟 < 500ms |
| `/admin/openclaw/orchestration` | 静态 | **多智能体协同画布** | React Flow + DAG | - | `WS /api/openclaw/orch/live` | 5+ 智能体协同 |
| `/admin/openclaw/marketplace` | 静态 | **智能体开发 SDK** | Monaco + 调试器 | - | `POST /api/openclaw/sdk/build` | 一键发布 |
| `/admin/openclaw/training` | 静态 | **在线微调 UI** | PEFT + LoRA | - | `POST /api/openclaw/train/start` | 训练可视化 |

#### 工作流编辑器（4）
| 路径 | 现有功能 | 改造内容 | 技术实现 | 数据流转 | 接口需求 | 测试标准 |
|------|----------|----------|----------|----------|----------|----------|
| `/admin/n8n/editor` | 简单编辑器 | **完整 n8n 嵌入** | iframe + 自定义节点 | - | - | 200+ 节点拖拽 |
| `/admin/n8n/triggers` | 静态 | **可视化触发器编排** | React Flow | - | - | 拖拽 + 配置 |
| `/admin/n8n/templates` | 静态 | **模板市场 + 评论** | UGC 平台 | - | `POST /api/n8n/templates/upload` | 用户上传 |
| `/admin/n8n/history` | 静态 | **执行时间线** | Gantt + 日志 | - | `WS /api/n8n/exec/live` | 实时时间线 |

#### 数据大屏（5）
| 路径 | 现有功能 | 改造内容 | 技术实现 | 数据流转 | 接口需求 | 测试标准 |
|------|----------|----------|----------|----------|----------|----------|
| `/admin/dashboard` | 简单图表 | **3D 可视化 + 实时** | Three.js + ECharts | - | `WS /api/dashboard/live` | 60fps 流畅 |
| `/admin/command/global-overview` | 静态 | **3D 地球** | Cesium | - | `WS /api/command/geo` | 全球节点 |
| `/admin/command/heatmap` | 静态 | **实时热力图** | deck.gl | - | `WS /api/command/heatmap/live` | 1 万+ 点 |
| `/admin/command/performance-board` | 静态 | **实时大屏切换** | 多窗口联动 | - | `WS /api/command/perf/live` | 自动轮播 |
| `/admin/command/video-monitor` | 静态 | **多路视频墙** | WebRTC + HLS | - | `WS /api/command/video/stream` | 16 路同屏 |

#### 应急指挥（2）
| 路径 | 现有功能 | 改造内容 | 技术实现 | 数据流转 | 接口需求 | 测试标准 |
|------|----------|----------|----------|----------|----------|----------|
| `/admin/command/emergency-command` | 静态 | **应急流程图谱** | React Flow + 状态机 | - | `POST /api/emergency/start` | 一键启动 |
| `/admin/command/realtime-alerts` | 静态 | **告警工作流** | 规则引擎 + 升级 | - | `WS /api/alerts/live` | 自动分派 |

#### 安全（11）
| 路径 | 现有功能 | 改造内容 | 技术实现 | 数据流转 | 接口需求 | 测试标准 |
|------|----------|----------|----------|----------|----------|----------|
| `/admin/security/overview` | 静态 | **安全态势感知** | SIEM 集成 | - | `WS /api/security/situation` | 实时威胁 |
| `/admin/security/waf` | 静态 | **WAF 规则管理** | ModSecurity 集成 | - | `CRUD /api/security/waf/rules` | 100+ 规则 |
| `/admin/security/intrusion` | 静态 | **入侵检测** | Suricata 集成 | - | `WS /api/security/ids` | 实时告警 |
| `/admin/security/threat-intel` | 静态 | **威胁情报聚合** | 多源融合 | - | `GET /api/security/threat-intel` | 10+ 来源 |
| `/admin/security/vulnerability` | 静态 | **漏洞扫描** | Trivy/Nessus | - | `POST /api/security/scan` | 扫描可视化 |
| `/admin/security/audit` | 静态 | **合规审计** | 多框架支持 | - | `GET /api/security/audit/:framework` | 等保/SOC2 |
| `/admin/security/incident-response` | 静态 | **事件响应剧本** | 自动化 playbook | - | `POST /api/security/incident/run` | 一键处置 |
| `/admin/security/encryption` | 静态 | **密钥管理** | HashiCorp Vault | - | `CRUD /api/security/keys` | 密钥轮转 |
| `/admin/security/firewall` | 静态 | **ACL 管理** | iptables 封装 | - | `CRUD /api/security/acl` | 即时生效 |
| `/admin/security/policy` | 静态 | **策略引擎** | OPA 集成 | - | `POST /api/security/policy/eval` | 毫秒级 |
| `/admin/security/rbac` | 静态 | **可视化权限** | DAG 展示 | - | `GET /api/security/rbac/graph` | 完整图谱 |

#### OpenClaw 训练（2）
| 路径 | 现有功能 | 改造内容 | 技术实现 | 数据流转 | 接口需求 | 测试标准 |
|------|----------|----------|----------|----------|----------|----------|
| `/admin/openclaw/training` | 静态 | **分布式训练编排** | Ray + DeepSpeed | - | `POST /api/training/start` | 多卡训练 |
| `/admin/openclaw/monitor-dashboard` | 静态 | **训练实时监控** | TensorBoard 嵌入 | - | `WS /api/training/metrics` | 实时 loss |

#### AI Center 智能决策（2）
| 路径 | 现有功能 | 改造内容 | 技术实现 | 数据流转 | 接口需求 | 测试标准 |
|------|----------|----------|----------|----------|----------|----------|
| `/admin/ai-center/smart-decision` | 静态 | **决策树可视化** | React Flow + 编辑 | - | `POST /api/decision/simulate` | 沙盘推演 |
| `/admin/ai-center/knowledge-graph` | 静态 | **图谱编辑器** | Cytoscape.js | - | `CRUD /api/kg/entities` | 1 万+ 节点 |

> **第四类合计：25 页面，工时 = 625 人天**（平均 25 人天/页）

---

## 三、11 周实施时间表（总览）

| 阶段 | 周次 | 主要工作 | 关键交付 | 团队 |
|------|------|----------|----------|------|
| **阶段 0：准备** | W1 | 评审 + 资源 + 立项 | 评审纪要 + 云资源 | PM + 架构 |
| **阶段 1：基础设施** | W2-W3 | Docker Compose + DB schema + 鉴权 | 9 容器互通 + 6 张表 | 运维 + 后端 |
| **阶段 2：n8n + OpenClaw** | W4-W5 | 8 页面改造 + API/WS 代理 | 真实工作流跑通 | 前端 + 后端 |
| **阶段 3：AI + 区块链 + BPM** | W6-W7 | 16 页面 + 3 大引擎 | 3 核心业务流程 | 全栈 |
| **阶段 4：业务深度改造** | W8-W9 | 30 页面 + 7 引擎 | 50+ 页面真实化 | 前端 + 后端 |
| **阶段 5：性能 + 验收** | W10 | 压测 + 灰度 + 文档 | 50 并发 / 72h 稳定 | 测试 + SRE |
| **阶段 6：上线** | W11 | 上线 + 培训 + 运维 | 生产就绪 | 全员 |

> **详细时间表**：见 `分阶段实施时间表.md`

---

## 四、资源投入

| 角色 | 人数 | 总工时（人天） |
|------|------|----------------|
| 项目经理 | 1 | 55 |
| 架构师 | 1 | 55 |
| 后端工程师 | 3 | 165 |
| 前端工程师 | 2 | 110 |
| 测试工程师 | 1 | 55 |
| 运维工程师 | 1 | 55 |
| **合计** | **8+1 PM** | **495 人天** |

> 注：第二类 200 + 第三类 525 + 第四类 625 = 1350 人天，含并行协作与缓冲

---

## 五、关键决策记录

| 决策 | 内容 | 决策人 | 日期 |
|------|------|--------|------|
| D1 | 复用 ZS 现有 30 页面不改造 | 架构组 | 2026-06-11 |
| D2 | 引擎表用独立 schema（n8n./flowable./fabric.） | 架构组 | 2026-06-11 |
| D3 | 鉴权走统一代理 /api/auth/external-token | 架构组 | 2026-06-11 |
| D4 | 存证采用"凭证预生成 + 异步上链" | 架构组 | 2026-06-11 |
| D5 | PoC 阶段不上 K8s，Docker Compose 即可 | 架构组 | 2026-06-11 |

---

## 六、立即可执行的 5 个动作

1. **评审本计划** — 召集架构组评审
2. **启动 docker-compose.dev.yml** — 验证 9 容器互通
3. **执行 5.2 节 SQL** — 扩展数据库 schema
4. **实现 /api/auth/external-token** — 鉴权统一
5. **改造 /admin/n8n/editor/page.tsx** — 第一个真实数据接入

---

## 七、附录

- A. 配套文档：`ZS_AI_Integration_Plan_v1.md` / `AI_Automation_Dev_Workflow_v1.md`
- B. 详细时间表：`分阶段实施时间表.md`
- C. 详情表：`页面改造详情表.md`
- D. 数据流转：`数据流转规则.md`
- E. 接口需求：`接口开发需求.md`
- F. 测试标准：`兼容性测试标准.md`
- G. 技术实现：`技术实现详解.md`
- H. 风险与回退：`ZS整合风险与回退.md`

---

**版本历史**：
- v1.0 (2026-06-11): 初始版本
