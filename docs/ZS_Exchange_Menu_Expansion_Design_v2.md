# ZS Exchange 管理后台菜单架构扩展设计方案 v2.0

## 设计说明

基于中萨数字科技集团的完整生态版图，在原有 16 个主菜单组基础上，新增 **6 个战略级菜单组**，将后台从"纯交易所管理平台"升级为"全球化金融科技集团运营中台"。

---

## 完整菜单架构（22 组 110+ 子功能）

### 一、原有 16 组（保持不变，标注位置）

| # | 菜单组 Key | 菜单名称 | 子功能数 | 状态 |
|---|-----------|---------|---------|------|
| 1 | `dashboard` | 数据中心 | 1 | 已有 |
| 2 | `web3-group` | Web3.0 管理 | 3 | 已有 |
| 3 | `chain-group` | 公链管理 | 5 | 已有 |
| 4 | `cex-group` | CEX 交易所 | 7 | 已有 |
| 5 | `dex-group` | DEX 交易所 | 4 | 已有 |
| 6 | `defi-group` | DeFi 管理 | 3 | 已有 |
| 7 | `wallet-group` | Web3 钱包 | 5 | 已有 |
| 8 | `staking-group` | 质押挖矿 | 5 | 已有 |
| 9 | `ido-group` | IDO/Launchpad | 5 | 已有 |
| 10 | `quant-group` | 量化交易 | 5 | 已有 |
| 11 | `entertainment-group` | 娱乐游戏 | 5 | 已有 |
| 12 | `ecommerce-group` | 电商商城 | 5 | 已有 |
| 13 | `content-group` | 国学内容 | 5 | 已有 |
| 14 | `user-group` | 用户运营 | 4 | 已有 |
| 15 | `finance-group` | 财务中心 | 4 | 已有 |
| 16 | `system-group` | 系统管理 | 5 | 已有 |

### 二、新增 6 组（生态扩展）

#### 新增 #17：企业服务（enterprise-group）

```
📋 enterprise-group  企业服务
│
├── /admin/enterprise/registration     📝 公司注册管理
│   ├── 注册申请列表（全球客户提交的注册申请）
│   ├── 注册进度跟踪（材料审核 → 批准 → 出证）
│   ├── 文件模板管理（公司章程/股东决议/董事任命等）
│   └── 注册数据统计（按国家/行业/类型统计）
│
├── /admin/enterprise/spv              🏦 SPV 公司管理
│   ├── SPV 列表（所有萨摩亚 SPV 公司档案）
│   ├── 结构设计器（股权结构/VIE 架构图示）
│   ├── 合规状态监控（年审/变更/注销提醒）
│   └── 海南-萨摩亚双轨视图（国内实体 ↔ 境外 SPV 关联）
│
├── /admin/enterprise/services         🔧 企业服务产品
│   ├── 服务套餐管理（基础注册/高级包/VIP 尊享）
│   ├── 秘书服务（地址/电话/信件转发配置）
│   ├── 银行开户协助（合作银行/开户进度）
│   └── 年审续费管理（到期提醒/批量续费）
│
├── /admin/enterprise/customers        👥 客户关系管理 (CRM)
│   ├── 客户 360° 视图（基本信息 + 服务历史 + 交易记录）
│   ├── 客户分级（普通/VIP/战略伙伴）
│   ├── 销售漏斗（线索→商机→成交）
│   └── 客户生命周期管理
│
└── /admin/enterprise/compliance       🛡️ 企业合规管理
    ├── KYB 业务尽职调查（Know Your Business）
    ├── 制裁名单筛查（OFAC/UN/EU 实时匹配）
    ├── UBO 受益人登记（最终受益人信息）
    └── 合规报告生成（监管申报文件自动生成）
```

#### 新增 #18：代币发行服务（token-issue-group）

```
💎 token-issue-group  代币发行服务
│
├── /admin/token/projects               📂 发行项目管理
│   ├── 项目申请池（企业提交的发币申请）
│   ├── 项目审核流程（技术评估 → 法律审查 → 风控审批）
│   ├── 项目档案（白皮书/经济模型/团队背景/审计报告）
│   └── 项目状态看板（立项 → 开发 → 发行 → 退市 全生命周期）
│
├── /admin/token/design                 ⚙️ 代币经济设计
│   ├── 代币参数配置（总量/分配/解锁计划）
│   ├── 经济模型编辑器（通胀/通缩/销毁机制可视化）
│   ├── 智能合约模板库（ERC20/BEP20/TRC20 标准模板）
│   └── Gas 费用估算器
│
├── /admin/token/deployment             🚀 代币部署管理
│   ├── 一键部署（合约编译 + 部署 + 验证）
│   ├── 多链部署管理（ETH/BSC/SOL/TRON 同步发行）
│   ├── 合约升级管理（代理模式升级/参数调整）
│   └── 安全审计对接（CertiK/SlowMist 审计进度追踪）
│
├── /admin/token/listing                📈 上币管理
│   ├── 上币申请审核（ZS Exchange 内部上币流程）
│   ├── 交易对配置（新币种添加到交易对）
│   ├── 流动性支持（初始流动性提供方案）
│   └── 市值管理工具（做市策略/价格稳定机制）
│
└── /admin/token/compliance             📋 代币合规
    ├── 证券属性评估（Howey Test 自检）
    ├── 披露文档管理（风险披露/法律声明）
    ├── 投资者适当性管理（合格投资者认证）
    └── 监管报备文件（各国 Token 发行备案）
```

#### 新增 #19：上市通道服务（listing-channel-group）

```
📊 listing-channel-group  上市通道服务
│
├── /admin/listing/samoa                🇼🇸 萨摩亚证券交易所
│   ├── 上市申请管理（企业提交的上市申请）
│   ├── IC 审核委员会工作台（多角色审批流）
│   ├── 招股说明书管理（Prospectus 编写/审核/发布）
│   ├── 路演管理（投资者路演安排/反馈收集）
│   ├── 定价与配售（IPO 定价/股份分配/超额认购处理）
│   ├── 上市后管理（持续披露/定期报告/重大事件公告）
│   └── 萨摩亚上市规则库（上市条件/维持标准/退市规则）
│
├── /admin/listing/hk                   🇭🇰 香港 HK1683 通道
│   ├── HK 上市申请管理（SPAC/IPO/RTO 三种路径）
│   ├── 保荐机构管理（合作保荐人/券商档案）
│   ├── 港交所沟通管理（问询函回复/材料补充）
│   ├── 投资者关系管理（IR 活动/股东会/业绩发布会）
│   └── HK 上市法规库（主板/GEM/18A 等不同板块要求）
│
├── /admin/listing/pipeline             🔄 上市项目管线
│   ├── Pipeline 看板（储备→执行→完成各阶段项目）
│   ├── 项目里程碑管理（关键节点/责任人/时间线）
│   ├── 中介机构协调（律师/审计师/评估师/券商分工）
│   └── 上市成功率分析（历史数据/行业对标）
│
└── /admin/listing/post-listing          📑 上市后服务
    ├── 信息披露管理（公告发布/定期报告模板）
    ├── 股东名册管理（股份过户/股东查询）
    ├── 并购重组顾问（M&A 机会识别/交易撮合）
    └── 退市/转板管理（自愿退市/强制退市/转板申请）
```

#### 新增 #20：AIOPC 产业园管理（aiopc-group）

```
🤖 aiopc-group  AIOPC 产业园管理
│
├── /admin/aiopc/park                  🏗️ 产业园运营
│   ├── 园区概览（入驻企业数/产值/就业数据大屏）
│   ├── 工位/空间管理（共享办公/独立办公室/VIP 区域）
│   ├── 设施设备管理（会议室/网络/硬件资产）
│   └── 园区活动管理（培训/沙龙/路演活动日历）
│
├── /admin/aiopc/members               👤 会员/入驻企业管理
│   ├── 入驻申请审核（AIOPC 会员准入流程）
│   ├── 企业档案（一人公司信息/AI 工具栈/业务领域）
│   ├── 会员等级管理（普通/银卡/金卡/钻石权益差异化）
│   └── 孵化毕业体系（毕业条件/校友网络/持续服务）
│
├── /admin/aiopc/tools                 🛠️ AI 工具赋能
│   ├── AI 工具市场（集成 AI 工具目录/推荐/订阅管理）
│   ├── AI 助手分配（为会员匹配专属 AI 助手团队）
│   ├── 能力图谱（会员技能标签/AI 能力评分）
│   └── 培训课程管理（AI 使用培训/创业课程/认证体系）
│
├── /admin/aiopc/spv-link              🔗 海南-萨摩亚联动
│   ├── 双地企业映射（海南实体 ↔ 萨摩亚 SPV 关系视图）
│   ├── 跨境资金流向（境内运营 ↔ 境外资本流转）
│   ├── 税务筹划建议（双轨结构的税务优化方案）
│   └── 合规检查清单（两地法规差异对照表）
│
└── /admin/aiopc/global-replication    🌍 全球复制计划
    ├── 目标城市评估（潜在复制城市打分模型）
    ├── 复制进度追踪（已规划/洽谈/签约/建设中）
    ├── 本地化适配（各地政策/文化/法律适配）
    └── 全球运营大屏（所有园区统一监控面板）
```

#### 新增 #21：全球直销体系（direct-sales-group）

``🌐 direct-sales-group  全球直销体系
│
├── /admin/dsales/network              🕸️ 分销网络
│   ├── 组织架构树（多层级分销网络可视化）
│   ├── 代理商/经销商管理（资格审核/等级评定/绩效考核）
│   ├── 区域市场管理（国家/省份/城市层级划分）
│   └── 团队业绩看板（各级团队销售数据实时展示）
│
├── /admin/dsales/products             📦 直销产品管理
│   ├── 产品目录（可分销的产品/服务/套餐组合）
│   ├── 佣金方案设计（直推奖/管理奖/级差/福利）
│   ├── 价格体系管理（零售价/会员价/代理商价）
│   └── 库存与物流（直销渠道库存/发货追踪）
│
├── /admin/dsales/commission           💰 佣金结算
│   ├── 佣金计算引擎（自动化佣金计算规则配置）
│   ├── 结算周期管理（日结/周结/月结配置）
│   ├── 提现审核（代理商佣金提现审批流程）
│   └── 税务代扣代缴（全球不同地区税务处理）
│
├── /admin/dsales/training             📚 培训与认证
│   ├── 课程内容管理（产品培训/销售技巧/合规教育）
│   ├── 认证体系（初级/中级/高级/讲师认证）
│   ├── 直播/线下活动管理（培训会议安排）
│   └── 学习进度追踪（学员学习路径/考试/证书）
│
└── /admin/dsales/compliance           ⚖️ 直销合规
    ├── 反金字塔合规检测（层级深度/收入来源比例自检）
    ├── 各国直销法规库（合法/灰色/禁止地区对照）
    ├── 投诉处理（消费者投诉/内部纠纷仲裁）
    └── 合规报告（监管要求的定期经营报告）
```

#### 新增 #22：牌照与合规中心（license-hub-group）

``🏛️ license-hub-group  牌照与合规中心
│
├── /admin/license/portfolio            📜 牌照资产管理
│   ├── 牌照总览（萨摩亚交易所/证券交易所/HK 通道/其他）
│   ├── 牌照有效期监控（续期提醒/条件维护）
│   ├── 牌照使用范围（各牌照允许的业务边界定义）
│   └── 新牌照拓展规划（目标牌照/申请路径/时间线）
│
├── /admin/license/jurisdictions        🌍 多法域合规
│   ├── 监管规则库（萨摩亚/香港/中国/新加坡/阿联酋等）
│   ├── 合规义务日历（各法域报告/审计/申报截止日）
│   ├── 监管沟通记录（与各监管机构的往来函件/会议纪要）
│   └── 政策变更追踪（全球加密/离岸金融政策动态）
│
├── /admin/license/audit                🔍 内部审计
│   ├── 审计计划管理（年度/专项/临时审计任务）
│   ├── 审计底稿管理（审计程序/证据/发现）
│   ├── 缺陷整改追踪（问题发现→整改→验证闭环）
│   └── 外部审计协调（配合监管审计/第三方审计）
│
└── /admin/license/governance           📊 治理与风控
    ├── 董事会/管委会决议管理（重大决策存证）
    ├── 利益冲突申报（关联交易/利益冲突披露）
    ├── 吹哨人制度（内部举报通道/保护措施）
    └── ESG 报告（环境/社会/治理信息披露）
```

---

## 菜单排序建议

考虑到后台的使用频率和用户角色，建议采用 **分区布局**：

```
┌─────────────────────────────────────────────────────┐
│  📊 核心运营区（高频使用）                             │
│  数据中心 | 用户运营 | CEX交易所 | DEX交易所 | 财务中心 │
├─────────────────────────────────────────────────────┤
│  💰 金融产品区                                       │
│  DeFi管理 | IDO/Launchpad | 量化交易 | 质押挖矿      │
│  代币发行服务 | 上市通道服务                           │
├─────────────────────────────────────────────────────┤
│  🌐 生态流量区                                        │
│  国学内容 | 电商商城 | 娱乐游戏 | Web3钱包             │
├─────────────────────────────────────────────────────┤
│  🏢 集团业务区（新增核心）                              │
│  企业服务 | AIOPC产业园 | 全球直销体系                 │
├─────────────────────────────────────────────────────┤
│  ⚙️ 基础设施区                                        │
│  Web3.0管理 | 公链管理 | 系统管理 | 牌照与合规中心      │
└─────────────────────────────────────────────────────┘
```

## AdminLayout.tsx 代码更新要点

需要在现有 `menuItems` 数组末尾追加以下 6 个菜单组：

```typescript
// ====== 新增：第17组 企业服务 ======
{
  key: 'enterprise-group',
  icon: <BankOutlined />,        // 或 <HomeOutlined />
  label: '企业服务',
  children: [
    { key: '/admin/enterprise/registration', icon: <FileTextOutlined />, label: '公司注册管理' },
    { key: '/admin/enterprise/spv', icon: <AccountBookOutlined />, label: 'SPV 公司管理' },
    { key: '/admin/enterprise/services', icon: <ToolOutlined />, label: '企业服务产品' },
    { key: '/admin/enterprise/customers', icon: <TeamOutlined />, label: '客户关系管理' },
    { key: '/admin/enterprise/compliance', icon: <SafetyCertificateOutlined />, label: '企业合规管理' },
  ],
},

// ====== 新增：第18组 代币发行服务 ======
{
  key: 'token-issue-group',
  icon: <FundOutlined />,
  label: '代币发行服务',
  children: [
    { key: '/admin/token/projects', icon: <FolderOpenOutlined />, label: '发行项目管理' },
    { key: '/admin/token/design', icon: <ExperimentOutlined />, label: '代币经济设计' },
    { key: '/admin/token/deployment', icon: <CloudServerOutlined />, label: '代币部署管理' },
    { key: '/admin/token/listing', icon: <RiseOutlined />, label: '上币管理' },
    { key: '/admin/token/compliance', icon: <AuditOutlined />, label: '代币合规' },
  ],
},

// ====== 新增：第19组 上市通道服务 ======
{
  key: 'listing-channel-group',
  icon: <TrophyOutlined />,
  label: '上市通道服务',
  children: [
    { key: '/admin/listing/samoa', icon: <GlobalOutlined />, label: '萨摩亚证券交易所' },
    { key: '/admin/listing/hk', icon: <BankOutlined />, label: '香港 HK1683' },
    { key: '/admin/listing/pipeline', icon: <SwapOutlined />, label: '上市项目管线' },
    { key: '/admin/listing/post-listing', icon: <HistoryOutlined />, label: '上市后服务' },
  ],
},

// ====== 新增：第20组 AIOPC 产业园 ======
{
  key: 'aiopc-group',
  icon: <RobotOutlined />,        // 新增图标
  label: 'AIOPC 产业园',
  children: [
    { key: '/admin/aiopc/park', icon: <HomeOutlined />, label: '产业园运营' },
    { key: '/admin/aiopc/members', icon: <UsergroupAddOutlined />, label: '入驻企业管理' },
    { key: '/admin/aiopc/tools', icon: <ToolOutlined />, label: 'AI 工具赋能' },
    { key: '/admin/aiopc/spv-link', icon: <LinkOutlined />, label: '海萨联动' },
    { key: '/admin/aiopc/global-replication', icon: <ApartmentOutlined />, label: '全球复制' },
  ],
},

// ====== 新增：第21组 全球直销体系 ======
{
  key: 'direct-sales-group',
  icon: <NodeIndexOutlined />,     // 新增图标
  label: '全球直销体系',
  children: [
    { key: '/admin/dsales/network', icon: <ApartmentOutlined />, label: '分销网络' },
    { key: /admin/dsales/products', icon: <ShopOutlined />, label: '直销产品' },
    { key: '/admin/dsales/commission', icon: <DollarOutlined />, label: '佣金结算' },
    { key: '/admin/dsales/training', icon: <ReadOutlined />, label: '培训认证' },
    { key: '/admin/dsales/compliance', icon: <SafetyOutlined />, label: '直销合规' },
  ],
},

// ====== 新增：第22组 牌照与合规中心 ======
{
  key: 'license-hub-group',
  icon: <SafetyCertificateOutlined />,
  label: '牌照与合规中心',
  children: [
    { key: '/admin/license/portfolio', icon: <IdcardOutlined />, label: '牌照资产管理' },
    { key: '/admin/license/jurisdictions', icon: <GlobalOutlined />, label: '多法域合规' },
    { key: '/admin/license/audit', icon: <AuditOutlined />, label: '内部审计' },
    { key: '/admin/license/governance', icon: <TeamOutlined />, label: '治理与风控' },
  ],
},
```

## 统计对比

| 指标 | v1.0（原有） | v2.0（扩展后） | 变化 |
|------|:-----------:|:-------------:|:----:|
| 主菜单组数 | **16** | **22** | +6 (+37.5%) |
| 子功能项数 | **~70** | **~112** | +42 (+60%) |
| 覆盖业务域 | 交易所 + 内容电商 | 交易所 + 内容电商 + **企业服务 + 上市 + AIOPC + 直销 + 牌照** | 7 大域 |
| 新增页面文件需创建 | - | **35 个 page.tsx** | - |

## 新增图标依赖

需要额外引入的 Ant Design Icons：
```typescript
import {
  // 新增图标
  FolderOpenOutlined,
  RiseOutlined,
  RobotOutlined,
  LinkOutlined,
  NodeIndexOutlined,
  ReadOutlined,
} from '@ant-design/icons';
```

---

*文档版本：v2.0*
*创建日期：2026 年 6 月 8 日*
*适用系统：ZS Exchange 管理后台 v5.0+*
