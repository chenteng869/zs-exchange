# Q05 FrontPortal P5.0 — 核心产品矩阵规划（1000 页 / 10 批 / 工业级基线）

> 任务编号：Q05-FrontPortal-P5.0-Core-Product-Matrix-Plan
> 前置基线：a6e9a54（P4 core portal skeleton freeze，已推送远端）
> 阶段定位：**规划阶段**，不直接开发 1000 个页面代码

---

## 第 1 章 · 阶段定位与边界

### 1.1 P5.0 在 Q05 整体节奏中的位置

```
Q05 FrontPortal 推进总图（v6 纯黑无色相基线）：

P3.01 - P3.21   →  cfd22d9 前（已远端基线）
P3.22 - P3.49   →  cfd22d9 .. 30a1f5c（47 commits，fast-forward 已推送）
P4 freeze       →  30a1f5c .. a6e9a54（1 commit，fast-forward 已推送）
─────────────────────────────────────────
P5.0 plan       →  a6e9a54 .. <new>  ← 当前阶段（规划、不生成 1000 页）
P5.1 - P5.10    →  <new> ..（每批 100 页 × 10 批，独立 commit + push）
P5.total        →  P5-B10 完成后形成 1000 页远端基线
```

### 1.2 P5.0 与 P5.1+ 的关系

- **P5.0（当前）**：1000 页的目录、路由、模板复用、生成策略、分批顺序、合规边界、提交纪律**一次性定死**。
- **P5.1~P5.10（后续）**：每批 100 页，按 P5.0 既定规则生成与提交。
- **不可逆约束**：P5.0 一旦 commit + push，后续 P5.1~P5.10 不允许修改 P5.0 已确立的命名空间、编号规则、batch 范围、模板映射、禁词清单。

### 1.3 P5.0 不做什么

- ❌ 不直接生成 1000 个 `page.tsx`
- ❌ 不重写 P4 已冻结的 25 个文件（除 `index.ts` 必要 export 扩展）
- ❌ 不修改 APP/Admin/API/数据库/middleware
- ❌ 不移动旧官网
- ❌ 不清理历史 dirty（基线 523 项，冻结不动）
- ❌ 不修改 schema.prisma / migrations
- ❌ 不 push（与 P4 freeze 同样规则，等用户决定）

---

## 第 2 章 · 七大关键边界（强制）

P5.0 一次性定死以下 7 个边界，任何 P5.x 阶段不得越界。

### 2.1 边界一 · 目录结构

**规则**：按业务域优先组织，**不**按数字堆目录。

**一级域清单**（13 个）：

| 一级域 | 业务含义 | 是否允许动态段 | 备注 |
|:------|:--------|:--------------|:-----|
| `markets` | 行情/榜单/币种详情 | 是 `[symbol]` | 高重复资源 |
| `products` | 交易产品入口 | 否 | 静态 |
| `assets` | 资产/钱包/充值提现 | 是 `[symbol]` | 高重复资源 |
| `account` | 账户中心 | 否 | 静态 |
| `security` | 安全中心 | 否 | 静态 |
| `compliance` | 合规/风控 | 否 | 静态 |
| `help` | 帮助中心 | 是 `[slug]` | 高重复资源 |
| `announcements` | 公告中心 | 是 `[slug]` | 高重复资源 |
| `legal` | 法务/风险披露 | 否 | 静态 |
| `institutional` | 机构业务 | 否 | 静态 |
| `api` | API 文档 | 否 | 静态 |
| `research` | 研究院/研报 | 是 `[slug]` | 高重复资源 |
| `academy` | 学院/教程 | 是 `[slug]` | 高重复资源 |
| `industry` | 产业资产（含 `fujian-laojiu-369`） | 否 | 静态 |
| `regions` | 区域市场/多语言预留 | 否 | 静态 |
| `status` | 状态/错误/sitemap | 否 | 静态 |

**目录归属说明**：

- `markets` / `products` / `assets` → 资金/交易相关（B 域）
- `account` / `security` / `compliance` → 用户/合规相关（D 域）
- `help` / `announcements` → 用户支持相关（G/H 域）
- `legal` → 法务/风险披露（F 域）
- `institutional` / `api` → 机构与开发者（E 域）
- `research` / `academy` → 教育与研究（I 域）
- `industry` / `fujian-laojiu-369` → 产业资产（J 域）
- `regions` → 区域市场预留（K 域）
- `status` → 系统状态长尾（L 域）

### 2.2 边界二 · 路由策略

**静态路由**（用于核心入口、合规页、风险披露、产品说明、帮助中心高频页面）：
- 规则：所有 `entry` / `info` / `form` / `status` 类型页面必须使用静态路由
- 例子：`/portal-preview/legal/terms`、`/portal-preview/industry/fujian-laojiu-369/about`

**动态段路由**（仅用于高度重复资源页）：
- 允许的动态段：
  - `[symbol]` → 行情/资产币种详情
  - `[slug]` → 帮助/公告/研报/学院详情
  - `[id]` → 不允许（避免无意义 id 化）
- 禁止滥用动态段掩盖页面规划
- 禁止为凑 1000 页而制造无意义路由

**P5.0 仅产出规划与配置，不新增动态页面实现**。P5.1 起按 batch 落真实页面。

### 2.3 边界三 · 模板复用

**P4 既有 10 类模板继续复用**：

```
PortalLandingTemplate      - 首页/品牌/生态入口
MarketEntryTemplate        - 行情/榜单
ProductEntryTemplate       - 交易产品
AssetEntryTemplate         - 资产/钱包
AccountEntryTemplate       - 账户中心
HelpCenterTemplate         - 帮助中心
AnnouncementTemplate       - 公告
LegalDisclosureTemplate    - 法律/风险披露
IndustryAssetTemplate      - 产业资产（含老酒369）
ErrorStateTemplate         - 404/维护中/即将开放
```

**P5 建议新增模板类型（P5.0 仅占位与配置，P5.1+ 起按需实现）**：

| 模板 | 用途 | P5.0 阶段 | P5.1 实现 |
|:----|:----|:---------|:----------|
| `ProductMatrixTemplate` | 产品矩阵卡片 | 占位 | 视 B01 决定 |
| `MarketSymbolTemplate` | 单币种详情 | 占位 | 视 B01 决定 |
| `AssetSymbolTemplate` | 单资产详情 | 占位 | 视 B01 决定 |
| `KycStepTemplate` | KYC 流程 | 占位 | 视 B02 决定 |
| `SecurityGuideTemplate` | 安全指南 | 占位 | 视 B02 决定 |
| `ComplianceGuideTemplate` | 合规指南 | 占位 | 视 B04 决定 |
| `ApiDocTemplate` | API 文档 | 占位 | 视 B06 决定 |
| `ResearchArticleTemplate` | 研报文章 | 占位 | 视 B07 决定 |
| `AcademyLessonTemplate` | 学院课程 | 占位 | 视 B07 决定 |
| `LeaderboardTemplate` | 排行榜 | 占位 | 视 B03 决定 |
| `LockupDisclosureTemplate` | 锁仓披露 | 占位 | 视 B05 决定 |
| `LaunchpadInfoTemplate` | 新资产上线说明 | 占位 | 视 B05 决定 |
| `RwaAssetTemplate` | RWA 资产 | 占位 | 视 B08 决定 |
| `FujianLaojiuProductTemplate` | 老酒369 产品页 | 占位 | 视 B05 决定 |
| `RiskDisclosureDetailTemplate` | 风险披露详情 | 占位 | 视 B04 决定 |

**禁止重复造 P4 已有模板**。如发现重复，必须复用 P4 类型并扩展 prop。

### 2.4 边界四 · 生成策略

**总策略**：**配置驱动 + 脚本校验 + 分批生成**。

- 不采用纯手写 1000 页
- 不直接一次生成 1000 页
- 延续 P4 配置驱动架构（`p4-core-pages.ts` 模式）
- 新增 `p5-core-pages.ts` 作为 P5 页矩阵唯一配置源
- 每批 commit 前必须用脚本校验：
  - TypeScript 0 错误
  - 合规扫描 0 命中
  - 编号唯一性
  - 路由唯一性
  - 模板映射完整性

**P5 页面配置必填字段**（最小集合）：

```typescript
interface P5CorePageDefinition {
  id: string;              // P5-XXXX 编号
  batch: P5BatchId;        // 所属 batch
  domain: P5Domain;        // 所属一级域
  title: string;           // 中文标题
  route: string;           // 完整路由
  template: P5TemplateKey; // 模板 key
  complianceLevel: 'low' | 'medium' | 'high' | 'strict';
  implementationMode: 'static' | 'dynamic-segment' | 'content-driven';
  status: 'planned' | 'skeleton' | 'in-progress' | 'done';
}
```

**P5 编号规则**：

- 总范围：`P5-0001` ~ `P5-1000`
- 10 批 × 100 页
- 严格顺序：

```
P5-B01: P5-0001 ~ P5-0100  核心交易与市场入口
P5-B02: P5-0101 ~ P5-0200  账户、安全、KYC、资产安全
P5-B03: P5-0201 ~ P5-0300  帮助中心与公告中心
P5-B04: P5-0301 ~ P5-0400  法务、合规、风险披露
P5-B05: P5-0401 ~ P5-0500  福建老酒369 产业资产专区
P5-B06: P5-0501 ~ P5-0600  机构与 API
P5-B07: P5-0601 ~ P5-0700  研究院与学院
P5-B08: P5-0701 ~ P5-0800  RWA 与产业资产扩展
P5-B09: P5-0801 ~ P5-0900  区域市场与多语言预留
P5-B10: P5-0901 ~ P5-1000  错误页、状态页、索引页、长尾支撑页
```

> ⚠️ P5-B08 范围已修正为 `P5-0701 ~ P5-0800`（与 P5-B07 `P5-0601 ~ P5-0700` 衔接，无重叠）

### 2.5 边界五 · 分批顺序

每批独立开发、独立验收、独立 commit、独立 push。

| 批次 | 范围 | 主题 | 一级域 |
|:----|:----|:----|:------|
| P5-B01 | 0001-0100 | 核心交易与市场入口 | markets / products / assets / trading education / account entrance |
| P5-B02 | 0101-0200 | 账户、安全、KYC、资产安全 | account / security / kyc / wallet / risk notices |
| P5-B03 | 0201-0300 | 帮助中心与公告中心 | help / announcements / faq / guides / support flows |
| P5-B04 | 0301-0400 | 法务、合规、风险披露 | legal / compliance / disclosures / terms / jurisdiction |
| P5-B05 | 0401-0500 | 福建老酒369 产业资产专区 | fujian-laojiu-369 / issuance info / product / brand / risk |
| P5-B06 | 0501-0600 | 机构与 API | institutional / api / custody / market maker / broker |
| P5-B07 | 0601-0700 | 研究院与学院 | research / academy / glossary / reports / tutorials |
| P5-B08 | 0701-0800 | RWA 与产业资产扩展 | industry / rwa / supply chain / asset disclosure |
| P5-B09 | 0801-0900 | 区域市场与多语言预留 | global / regions / language / market observation |
| P5-B10 | 0901-1000 | 错误页、状态页、索引页、长尾支撑页 | status / sitemap / error / tag / index / fallback |

### 2.6 边界六 · 合规边界

**P5 复用 P4 全部禁词**，并扩展 6 类新禁词。

**P4 既有禁词**（25+ 高风险禁词 + 15 福建老酒369 强禁词）：详见 `scan-p4-compliance.js` 的 `FORBIDDEN` 数组。

**P5 新增禁词类别**：

| 类别 | 禁词示例 |
|:----|:---------|
| 产品页收益承诺 | 稳赚 / 保本 / 保收益 / 收益保障 / 固定收益 / 零风险 / 无风险 / 必涨 / 百倍 / 千倍 / 暴富 |
| 英文版 | guaranteed return / risk-free / principal guaranteed |
| 监管误导 | licensed exchange / regulated exchange / Samoa licensed / MSA regulated / guaranteed liquidity |
| 资产绝对化 | 资产绝对安全 / 官方背书 / 监管认可 / 监管许可 |
| 发币/认购/锁仓风险 | official token sale / 内幕额度 / 优先认购稳赚 / 锁仓稳赚 / 发行即涨 / 上线即涨 |

**福建老酒369 P5 扩展禁词**（新增）：

```
酒资产稳赚 / 老酒投资稳赚 / 369 发币收益 / 认购即收益 /
老酒保值增值承诺 / 酒链金融产品 / 酒类证券化收益 / 酒票收益权 /
酒资产固定回报 / 保底回购收益 / 代币化酒资产稳赚 /
福建老酒369 监管背书 / 福建老酒369 官方保收益 /
福建老酒369 上线即涨 / 福建老酒369 锁仓返利
```

**P5 允许表达**：

```
产业资产展示 / 品牌信息披露 / 风险提示 / 非收益承诺 /
非投资建议 / 合规研究 / 市场观察 / 技术能力说明 /
交易前风险教育 / 用户自担风险
```

### 2.7 边界七 · TypeScript / dirty / 提交纪律

**TypeScript 检查**：
- 新增 `tsconfig.p5-check.json`（仅 P5 范围）
- P5.0 范围 0 errors
- P5.x 每批完成后必须 0 errors

**合规扫描**：
- 新增 `scripts/scan-p5-compliance.js`（在 P4 扫描器基础上扩展）
- 必须跳过 markdown 表格中作为规则说明存在的禁词行
- P5.0 自扫 0 hits
- P5.x 每批 0 hits

**dirty 纪律**：
- 523 项历史 dirty 冻结不动
- 本次只新增/修改 P5.0 相关文件
- commit 前必须核验 staged 文件范围
- 禁止 `git add .` / `git add -A`
- 禁止把历史 dirty 夹带提交

**提交纪律**：
- 使用 `git commit -F <msg-file> --no-verify`（与 P4 一致）
- commit message 头部使用 `Q05-P5.x` 前缀
- 每批独立 commit（不堆叠）
- 不 push（与 P4 一致，等用户决定）

---

## 第 3 章 · 10 批 × 100 页详细规划

### 3.1 P5-B01 · 核心交易与市场入口（0001-0100）

| 一级域 | 范围 | 数量（估算） |
|:------|:----|:------------|
| markets | 0001-0050 | 50 |
| products | 0051-0070 | 20 |
| assets | 0071-0090 | 20 |
| account 入口 | 0091-0100 | 10 |

**重点页面**：
- `/portal-preview/markets`（已有，P4）
- `/portal-preview/markets/[symbol]`（P5 新增动态段）
- `/portal-preview/products`（入口聚合）
- `/portal-preview/products/spot`（现货产品）
- `/portal-preview/products/futures`（合约产品）
- `/portal-preview/products/options`（期权产品）
- `/portal-preview/assets`（已有，P4）

### 3.2 P5-B02 · 账户、安全、KYC、资产安全（0101-0200）

| 一级域 | 范围 | 数量（估算） |
|:------|:----|:------------|
| account | 0101-0140 | 40 |
| security | 0141-0170 | 30 |
| kyc | 0171-0190 | 20 |
| wallet 引导 | 0191-0200 | 10 |

### 3.3 P5-B03 · 帮助中心与公告中心（0201-0300）

| 一级域 | 范围 | 数量（估算） |
|:------|:----|:------------|
| help | 0201-0240 | 40 |
| announcements | 0241-0270 | 30 |
| faq | 0271-0280 | 10 |
| guides | 0281-0295 | 15 |
| support flows | 0296-0300 | 5 |

### 3.4 P5-B04 · 法务、合规、风险披露（0301-0400）

| 一级域 | 范围 | 数量（估算） |
|:------|:----|:------------|
| legal | 0301-0350 | 50 |
| compliance | 0351-0380 | 30 |
| disclosures | 0381-0390 | 10 |
| terms | 0391-0395 | 5 |
| jurisdiction | 0396-0400 | 5 |

**重点**：
- 用户协议、隐私政策、Cookie 政策等
- 各 jurisdiction 风险披露（仅"重点市场与合规研究方向"措辞）
- KYC/AML 合规研究

### 3.5 P5-B05 · 福建老酒369 产业资产专区（0401-0500）

| 二级域 | 范围 | 数量（估算） |
|:------|:----|:------------|
| fujian-laojiu-369/about | 0401-0410 | 10 |
| fujian-laojiu-369/products | 0411-0430 | 20 |
| fujian-laojiu-369/issuance | 0431-0450 | 20 |
| fujian-laojiu-369/token | 0451-0470 | 20 |
| fujian-laojiu-369/brand | 0471-0480 | 10 |
| fujian-laojiu-369/risk | 0481-0495 | 15 |
| fujian-laojiu-369/h5 | 0496-0500 | 5 |

**硬约束**：
- 不接真实发行/认购/通证/资产登记系统
- 不出现"发币即上市"、"上线必涨"等表达
- 所有产品页必须包含完整风险披露
- 入口级骨架（与 P4 边界一致）

### 3.6 P5-B06 · 机构与 API（0501-0600）

| 一级域 | 范围 | 数量（估算） |
|:------|:----|:------------|
| institutional | 0501-0540 | 40 |
| api | 0541-0580 | 40 |
| custody overview | 0581-0590 | 10 |
| market maker info | 0591-0595 | 5 |
| broker info | 0596-0600 | 5 |

### 3.7 P5-B07 · 研究院与学院（0601-0700）

| 一级域 | 范围 | 数量（估算） |
|:------|:----|:------------|
| research | 0601-0640 | 40 |
| academy | 0641-0680 | 40 |
| glossary | 0681-0690 | 10 |
| tutorials | 0691-0700 | 10 |

### 3.8 P5-B08 · RWA 与产业资产扩展（0701-0800）

| 一级域 | 范围 | 数量（估算） |
|:------|:----|:------------|
| industry | 0701-0740 | 40 |
| rwa | 0741-0770 | 30 |
| supply chain | 0771-0785 | 15 |
| asset disclosure | 0786-0800 | 15 |

**硬约束**：
- 仅"产业资产信息化展示"
- 不出现"代币化资产稳赚"等表达
- 资产披露为信息性，非投资性

### 3.9 P5-B09 · 区域市场与多语言预留（0801-0900）

| 一级域 | 范围 | 数量（估算） |
|:------|:----|:------------|
| global | 0801-0820 | 20 |
| regions | 0821-0860 | 40 |
| language placeholders | 0861-0880 | 20 |
| market observation | 0881-0900 | 20 |

**硬约束**：
- 仅"重点市场与合规研究方向"措辞
- 禁止表达为已持牌/已监管/已获许可
- 区域市场不出现"已开展业务"等具体运营表达

### 3.10 P5-B10 · 错误页、状态页、索引页、长尾支撑页（0901-1000）

| 一级域 | 范围 | 数量（估算） |
|:------|:----|:------------|
| status | 0901-0920 | 20 |
| sitemap | 0921-0930 | 10 |
| error states | 0931-0960 | 30 |
| tag pages | 0961-0980 | 20 |
| index pages | 0981-0990 | 10 |
| fallback pages | 0991-1000 | 10 |

---

## 第 4 章 · 福建老酒369 强化边界（P5-B05）

### 4.1 P5-B05 与 P4 入口级骨架的关系

P4 已在 `/portal-preview/industry/fujian-laojiu-369/` 下完成入口级骨架（about / h5 / products / compliance / risk-disclosure / issuance / token），P5-B05 在此基础上扩展 100 页。

### 4.2 P5-B05 不做什么（强约束）

- ❌ 不接真实发行系统
- ❌ 不接真实通证/认购/资产登记
- ❌ 不接真实 KYC/资金流
- ❌ 不出现"发币收益"、"上线即涨"等表达
- ❌ 不出现"保底回购"、"代币化酒资产稳赚"
- ❌ 不引用"萨摩亚持牌"、"MSA 监管"等高风险合规词

### 4.3 P5-B05 必含的合规元素

每个 P5-B05 页面必须：
- 顶部包含完整风险提示横幅
- 包含完整的"非投资建议"声明
- 包含"用户自担风险"提示
- 包含"产业资产信息化展示"定位说明

### 4.4 P5-B05 禁词清单（额外 15 条）

```
酒资产稳赚 / 老酒投资稳赚 / 369 发币收益 / 认购即收益 /
老酒保值增值承诺 / 酒链金融产品 / 酒类证券化收益 / 酒票收益权 /
酒资产固定回报 / 保底回购收益 / 代币化酒资产稳赚 /
福建老酒369 监管背书 / 福建老酒369 官方保收益 /
福建老酒369 上线即涨 / 福建老酒369 锁仓返利
```

---

## 第 5 章 · P5.0 必须交付物

### 5.1 必须新增

| 文件 | 作用 |
|:-----|:-----|
| `docs/front-portal/q05/p5-core-product-matrix-plan.md` | P5.0 规划文档（本文件） |
| `src/components/portal-preview/core/config/p5-core-pages.ts` | 1000 页配置 + 10 batch 元数据 |
| `src/components/portal-preview/core/config/p5-navigation.ts` | P5 导航矩阵 |
| `scripts/scan-p5-compliance.js` | P5 合规扫描器（扩展 P4） |
| `tsconfig.p5-check.json` | P5 范围 TypeScript 检查配置 |

### 5.2 可选新增（仅当必要）

| 文件 | 作用 | 是否新增 |
|:-----|:-----|:--------|
| `src/components/portal-preview/core/config/index.ts` | 增加 P5 export | 仅当必须时新增 |
| `src/components/portal-preview/core/index.ts` | 增加 P5 export | 仅当必须时新增 |

### 5.3 P5.0 严禁新增

- ❌ 不新增任何 `page.tsx`（P5.1 起才落真实页面）
- ❌ 不修改 P4 既有 25 个文件
- ❌ 不修改 `brand.ts`（视觉系统已固化 v6）

---

## 第 6 章 · 编号规则与唯一性保证

### 6.1 编号格式

- 总范围：`P5-0001` ~ `P5-1000`
- 4 位补零
- 严格递增

### 6.2 唯一性保证

- 同一 `id` 不允许跨 batch 出现
- 同一 `route` 不允许跨 batch 出现
- `P5_CORE_PAGES` 配置数组由 `P5.0 校验脚本`确保：
  - 编号唯一
  - 路由唯一
  - 模板映射完整
  - 合规等级有效

### 6.3 编号调整规则

- P5.0 freeze 后，不允许调整编号顺序
- 如发现错误，必须通过 P5.0 amendment 流程（独立 commit + 显式说明）
- 严禁在 P5.1+ 修改 P5.0 已确立的 batch 边界

---

## 第 7 章 · 模板映射规则

### 7.1 P5 模板优先级

1. **P4 既有 10 类模板**：优先复用
2. **P5 建议新增 15 类模板**：P5.x 按需实现
3. **P5 自定义模板**：仅在前两类不满足时新增

### 7.2 模板 key 命名空间

```typescript
type P5TemplateKey =
  // P4 既有（继续复用）
  | 'PortalLandingTemplate'
  | 'MarketEntryTemplate'
  | 'ProductEntryTemplate'
  | 'AccountEntryTemplate'
  | 'AssetEntryTemplate'
  | 'HelpCenterTemplate'
  | 'AnnouncementTemplate'
  | 'LegalDisclosureTemplate'
  | 'IndustryAssetTemplate'
  | 'ErrorStateTemplate'
  // P5 规划新增（P5.x 按需实现）
  | 'ProductMatrixTemplate'
  | 'MarketSymbolTemplate'
  | 'AssetSymbolTemplate'
  | 'KycStepTemplate'
  | 'SecurityGuideTemplate'
  | 'ComplianceGuideTemplate'
  | 'ApiDocTemplate'
  | 'ResearchArticleTemplate'
  | 'AcademyLessonTemplate'
  | 'LeaderboardTemplate'
  | 'LockupDisclosureTemplate'
  | 'LaunchpadInfoTemplate'
  | 'RwaAssetTemplate'
  | 'FujianLaojiuProductTemplate'
  | 'RiskDisclosureDetailTemplate';
```

### 7.3 模板-页面映射示例

- markets entry → `MarketEntryTemplate`
- markets/[symbol] → `MarketSymbolTemplate`（P5 新增）
- legal/terms → `LegalDisclosureTemplate`（P4 复用）
- fujian-laojiu-369/products → `FujianLaojiuProductTemplate`（P5 新增）
- status/404 → `ErrorStateTemplate`（P4 复用）

---

## 第 8 章 · 合规扫描器扩展

### 8.1 scan-p5-compliance.js 设计

- 复用 P4 扫描器全部 FORBIDDEN 列表
- 扩展 6 类新禁词（详见 2.6 节）
- 复用 P4 markdown 表格行跳过规则
- 输出格式：scanned files / total lines / hits / skipped rule-table lines

### 8.2 扫描目标

- `docs/front-portal/q05/p5-core-product-matrix-plan.md`
- `src/components/portal-preview/core/config/p5-core-pages.ts`
- `src/components/portal-preview/core/config/p5-navigation.ts`
- `scripts/scan-p5-compliance.js`
- 未来 P5.x 每批新增加入此列表

### 8.3 误报控制

- 扫描器必须识别并跳过 markdown 表格行（与 P4 一致）
- 扫描器必须识别并跳过"非"开头的合规否定表达
- 文档中的禁词规则表**只作为规则说明**存在，不算实际违规

---

## 第 9 章 · 提交与验收纪律

### 9.1 P5.0 commit 流程

```
1. git status --short 核验 baseline
2. 编写 P5.0 规划文档
3. 编写 p5-core-pages.ts（不展开 1000 条，仅 batch 元数据）
4. 编写 p5-navigation.ts
5. 编写 scan-p5-compliance.js
6. 新增 tsconfig.p5-check.json
7. TypeScript 检查 → 0 errors
8. 合规扫描 → 0 hits
9. git add 精确 P5.0 文件（不 add . / -A）
10. git diff --cached --name-only 核验范围
11. git commit -F <msg> --no-verify
12. commit 后核验
13. 不 push
```

### 9.2 P5.0 提交范围

**允许 staged**：
- `docs/front-portal/q05/p5-core-product-matrix-plan.md`
- `src/components/portal-preview/core/config/p5-core-pages.ts`
- `src/components/portal-preview/core/config/p5-navigation.ts`
- `scripts/scan-p5-compliance.js`
- `tsconfig.p5-check.json`
- `src/components/portal-preview/core/config/index.ts`（仅当新增 export）
- `src/components/portal-preview/core/index.ts`（仅当必须新增 export）

**禁止 staged**：
- `src/app/api/**`
- `src/app/admin/**`
- `prisma/**`
- `middleware.*`
- `src/app/page.tsx`
- 旧官网目录
- APP/H5 业务文件
- 任何历史 dirty
- 任何 P4 已冻结文件（除非仅 export 扩展）

### 9.3 P5.x（每批）提交流程

- 重复 P5.0 流程 1-12
- 新增 `scan-p5-compliance.js` 中加入新页面路径
- commit message 头部使用 `Q05-P5.Bxx` 前缀
- 独立 commit（不堆叠）
- 不 push

---

## 第 10 章 · P5 与 P3 / P4 / 5000 页架构关系

### 10.1 关系总图

```
P3.01 - P3.49   旧官网 + H5 + admin 240 菜单         (cfd22d9 .. 30a1f5c)
P4 freeze       核心门户骨架（10 模块 / 300 页）       (30a1f5c .. a6e9a54)
P5.0 plan       核心产品矩阵规划（10 批 / 1000 页）    (a6e9a54 .. <new>)
P5.1 - P5.10    分批落地（每批 100 页）                 (<new> ..)
P6+             国际化 / 多语言 / 多端                  (待规划)
P-total         5000 页架构最终目标                    (待规划)
```

### 10.2 P5 与 P4 关系

- P4 = 入口级骨架（300 页核心 + 8 模板 + 导航）
- P5 = 产品矩阵展开（1000 页 + 新增 15 模板 + 详尽合规）
- P5 不破坏 P4，P4 不重新实现 P5

### 10.3 P5 与 5000 页规划

- P5 = 5000 页规划的 20%（1000/5000）
- P5 完成后，5000 页规划的 20% 已落地
- 剩余 4000 页（P6+）按业务域继续分批

---

## 第 11 章 · P5.0 验证协议

### 11.1 基线核验（执行前）

```bash
git rev-parse HEAD              # 应为 a6e9a54
git rev-parse origin/main       # 应为 a6e9a54
git rev-parse origin/HEAD       # 应为 a6e9a54
git rev-list --left-right --count origin/main...HEAD  # 应为 0 0
git status --short | wc -l      # 应约 523
```

### 11.2 TypeScript 验证

```bash
node node_modules/typescript/bin/tsc -p tsconfig.p5-check.json --noEmit
# ExitCode = 0
```

### 11.3 合规验证

```bash
node scripts/scan-p5-compliance.js
# TOTAL HITS: 0
```

### 11.4 staged 范围核验

```bash
git diff --cached --name-only
# 必须在第 9.2 节"允许 staged"清单内
# 不得包含任何 out-of-scope
```

### 11.5 commit 后核验

```bash
git rev-parse HEAD
git log --oneline -1
git rev-list --left-right --count origin/main...HEAD  # 应为 0 1
git status --short | wc -l
```

### 11.6 边界确认

- ❌ 不修改 APP
- ❌ 不修改 Admin
- ❌ 不修改 API
- ❌ 不修改数据库
- ❌ 不修改 middleware
- ❌ 不移动旧官网
- ❌ 不清理历史 dirty
- ❌ 不直接生成 1000 页面代码
- ❌ 不 push

---

## 第 12 章 · P5.0 风险与回退

### 12.1 已知风险

| 风险 | 缓解措施 |
|:----|:--------|
| 1000 页配置过大导致文件膨胀 | P5.0 仅展开 batch 元数据，不展开 1000 条 |
| B08 范围编号错误 | 已修正为 P5-0701 ~ P5-0800 |
| 模板命名冲突 | P5 模板使用 P5 命名空间 |
| 合规扫描误报 | 复用 P4 markdown 表格跳过规则 |
| P4 文件被无意修改 | 显式禁止，仅允许 export 扩展 |

### 12.2 回退方案

- P5.0 未 push 之前：直接 `git reset --hard HEAD` 回退
- P5.0 已 push 之后：不允许回退，必须通过 P5.0 amendment 流程

---

## 第 13 章 · P5.x 分批节奏建议

### 13.1 建议节奏

- 每批 100 页
- 每批独立 commit + push
- 每批之间可暂停验收
- 预计 10 批完成 P5

### 13.2 P5.x 提交信息建议

```
Q05-P5.B01 core markets & products batch
Q05-P5.B02 account & security batch
Q05-P5.B03 help & announcements batch
Q05-P5.B04 legal & compliance batch
Q05-P5.B05 fujian laojiu 369 batch
Q05-P5.B06 institutional & api batch
Q05-P5.B07 research & academy batch
Q05-P5.B08 rwa & industry batch
Q05-P5.B09 regions & language batch
Q05-P5.B10 status & fallback batch
```

### 13.3 P5.x 不允许跨 batch 改动

- 不允许 P5.2 修改 P5.1 已提交的文件
- 不允许调整 P5.0 已确立的 batch 边界
- 模板新增须有显式说明

---

## 第 14 章 · P5.0 完成判定标准

P5.0 视为完成，需同时满足：

1. ✅ 基线核验通过（HEAD = origin/main = origin/HEAD = a6e9a54）
2. ✅ 本规划文档存在（`p5-core-product-matrix-plan.md`，14-18 章）
3. ✅ `p5-core-pages.ts` 配置存在（包含 10 batch 元数据，修正 B08 范围）
4. ✅ `p5-navigation.ts` 配置存在
5. ✅ `scan-p5-compliance.js` 存在（扩展 P4 禁词）
6. ✅ `tsconfig.p5-check.json` 存在
7. ✅ TypeScript 检查 0 errors
8. ✅ 合规扫描 0 hits
9. ✅ `git diff --cached --name-only` 仅 P5.0 文件
10. ✅ commit 成功，ahead origin = 1
11. ✅ 未 push
12. ✅ 未修改 APP/Admin/API/数据库/middleware
13. ✅ 未移动旧官网
14. ✅ 未清理历史 dirty
15. ✅ 未直接生成 1000 页面代码

---

## 第 15 章 · P5.0 → P5.1 衔接

### 15.1 P5.1 启动前提

- P5.0 commit + 验收通过
- 用户明确启动 P5.1 指令
- P5.0 push 决策已确定（push or hold）

### 15.2 P5.1 任务名

```
Q05-FrontPortal-P5.1-Core-Product-Matrix-Batch-01
```

### 15.3 P5.1 范围

- 100 页（0001-0100）
- 一级域：markets / products / assets / trading education / account entrance
- 模板：MarketEntryTemplate / ProductEntryTemplate / AssetEntryTemplate
- 配置驱动生成（基于 `p5-core-pages.ts` 的 batch 1 数据）

### 15.4 P5.1 不做

- 不修改 P5.0 既有 5 个文件
- 不修改 P4 既有 25 个文件
- 不直接生成超过 100 页
- 不 push

---

## 第 16 章 · 附录 · 1000 页编号总表

| 批次 | 范围 | 主题 |
|:----|:----|:----|
| P5-B01 | 0001-0100 | 核心交易与市场入口 |
| P5-B02 | 0101-0200 | 账户、安全、KYC、资产安全 |
| P5-B03 | 0201-0300 | 帮助中心与公告中心 |
| P5-B04 | 0301-0400 | 法务、合规、风险披露 |
| P5-B05 | 0401-0500 | 福建老酒369 产业资产专区 |
| P5-B06 | 0501-0600 | 机构与 API |
| P5-B07 | 0601-0700 | 研究院与学院 |
| P5-B08 | 0701-0800 | RWA 与产业资产扩展 |
| P5-B09 | 0801-0900 | 区域市场与多语言预留 |
| P5-B10 | 0901-1000 | 错误页、状态页、索引页、长尾支撑页 |
| **总计** | **0001-1000** | **1000 页 / 10 批** |

---

## 第 17 章 · 附录 · P5.0 必填配置字段

```typescript
export type P5BatchId = 'P5-B01' | 'P5-B02' | 'P5-B03' | 'P5-B04' | 'P5-B05' |
                        'P5-B06' | 'P5-B07' | 'P5-B08' | 'P5-B09' | 'P5-B10';

export type P5Domain = 'markets' | 'products' | 'assets' | 'account' | 'security' |
                       'compliance' | 'help' | 'announcements' | 'legal' |
                       'institutional' | 'api' | 'research' | 'academy' |
                       'industry' | 'fujian-laojiu-369' | 'regions' | 'status';

export type P5TemplateKey = 'PortalLandingTemplate' | 'MarketEntryTemplate' |
                            'ProductEntryTemplate' | 'AccountEntryTemplate' |
                            'AssetEntryTemplate' | 'HelpCenterTemplate' |
                            'AnnouncementTemplate' | 'LegalDisclosureTemplate' |
                            'IndustryAssetTemplate' | 'ErrorStateTemplate' |
                            'ProductMatrixTemplate' | 'MarketSymbolTemplate' |
                            'AssetSymbolTemplate' | 'KycStepTemplate' |
                            'SecurityGuideTemplate' | 'ComplianceGuideTemplate' |
                            'ApiDocTemplate' | 'ResearchArticleTemplate' |
                            'AcademyLessonTemplate' | 'LeaderboardTemplate' |
                            'LockupDisclosureTemplate' | 'LaunchpadInfoTemplate' |
                            'RwaAssetTemplate' | 'FujianLaojiuProductTemplate' |
                            'RiskDisclosureDetailTemplate';

export type P5ComplianceLevel = 'low' | 'medium' | 'high' | 'strict';

export type P5ImplementationMode = 'static' | 'dynamic-segment' | 'content-driven';

export type P5Status = 'planned' | 'skeleton' | 'in-progress' | 'done';

export interface P5CorePageDefinition {
  id: string;
  batch: P5BatchId;
  domain: P5Domain;
  title: string;
  route: string;
  template: P5TemplateKey;
  complianceLevel: P5ComplianceLevel;
  implementationMode: P5ImplementationMode;
  status: P5Status;
}

export interface P5BatchDefinition {
  id: P5BatchId;
  range: { start: number; end: number };
  title: string;
  description: string;
  domains: P5Domain[];
  routePrefix: string;
  primaryTemplates: P5TemplateKey[];
  complianceLevel: P5ComplianceLevel;
  notes: string;
}
```

---

## 第 18 章 · 附录 · P5.0 提交信息模板

```
Q05-P5.0 core product matrix plan

- add P5.0 1000-page core product matrix plan (18 chapters, 7 boundaries, 10 batches)
- add P5.0 page config (p5-core-pages.ts, 10 batch metadata, B08 range fixed to P5-0701 ~ P5-0800)
- add P5.0 navigation matrix (p5-navigation.ts, domain-grouped)
- add P5.0 compliance scanner (scan-p5-compliance.js, P4 extended with 6 new categories)
- add P5.0 TypeScript check config (tsconfig.p5-check.json)

Boundaries (kept untouched):
- APP / Admin / API / database / middleware
- Legacy portal and disabled pages
- P4 frozen 25 files (only index.ts re-export extension allowed)
- P3 historical dirty (524 items, frozen)
- No 1000 page.tsx generated in P5.0

Verification:
- HEAD: a6e9a54537bdb4eb8e91bb2f593bf05e5fae6257
- Files: 5
- TypeScript P5.0 scope: 0 errors
- Compliance scanner: 0 hits
- No commit / push
```

---

> P5.0 文档版本：v1.0
> 最后更新：2026-07-21
> 维护者：Trae CN Solo Agent
> 配套文件：p5-core-pages.ts / p5-navigation.ts / scan-p5-compliance.js / tsconfig.p5-check.json
