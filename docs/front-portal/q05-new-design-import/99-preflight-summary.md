# 99 - Q05 预检综合摘要（Preflight Summary）

> **任务编号**：Q05-FrontPortal-NewDesign-Import-Preflight · 99
> **生成时间**：2026-07-18（Asia/Shanghai）
> **branch**：`main`
> **HEAD**：`afa6c9debca704e1fd7ae177ae50a81bd7a974f4`（`afa6c9d`）
> **输入文档**：本目录 00/01/02/03/04/05/06/07/08 共 8 份预检文档
> **输出性质**：只读综合摘要，**不修改任何业务代码**

---

## 0. 一句话现状

> **中萨新设计稿（Stitch）未在仓库内提供原始资产；当前阶段以用户文字描述为输入，进行"落地前预检"，目标是建立 1 套不影响旧官网的预览路由 + 5 类状态标签规范 + 分阶段实施计划，所有动手行为均限定在 `src/app/portal-preview/**` 新建目录。**

---

## 1. 任务执行清单

| 序 | 文件 | 状态 |
|---|---|---|
| 1 | `00-current-frontsite-baseline.md` | ✅ 已生成 |
| 2 | `01-stitch-new-design-inventory.md` | ✅ 已生成（含待澄清） |
| 3 | `02-old-vs-new-difference-analysis.md` | ✅ 已生成 |
| 4 | `03-app-admin-web-alignment.md` | ✅ 已生成 |
| 5 | `04-api-data-source-map.md` | ✅ 已生成 |
| 6 | `05-preview-route-plan.md` | ✅ 已生成 |
| 7 | `06-component-mapping-plan.md` | ✅ 已生成 |
| 8 | `07-risk-register.md` | ✅ 已生成 |
| 9 | `08-phase-implementation-plan.md` | ✅ 已生成 |
| 10 | `99-preflight-summary.md` | ✅ 本文件 |

---

## 2. 可立即做的内容

### 2.1 本任务可立即产出的成果

| 成果 | 路径 | 状态 |
|---|---|---|
| 10 份预检文档 | `docs/front-portal/q05-new-design-import/*.md` | ✅ 已生成 |
| 预览路由方案 | `/portal-preview` `/h5/portal-preview` | 📋 已规划 |
| 组件映射 | 20 个组件规格 | 📋 已规划 |
| 风险登记 | 100+ 风险点 | 📋 已规划 |
| 实施计划 | P1-P6 共 6 阶段 | 📋 已规划 |

### 2.2 落地后 P1 可立即做的页面（**用户确认后**）

| 路由 | 类型 | 工作量 | 数据源 |
|---|---|---|---|
| `/portal-preview` | 静态首页 | 1d | 静态 + 5 类标签 |
| `/portal-preview/about` | 关于 | 0.5d | 静态 |
| `/portal-preview/compliance` | 合规 | 0.5d | 静态 |
| `/portal-preview/risk` | 风险 | 0.5d | 静态 |
| `/portal-preview/announcement` | 公告（占位） | 0.5d | "暂无数据" |
| `/portal-preview/help` | 帮助（占位） | 0.5d | 静态 FAQ |
| `/portal-preview/fees` | 费率 | 0.5d | 静态 |
| `/portal-preview/privacy` | 隐私 | 0.5d | 静态 |
| `/portal-preview/terms` | 用户协议 | 0.5d | 静态 |
| `/h5/portal-preview` | H5 首页 | 1d | 静态 + 5 类标签 |

---

## 3. 不能立即做的内容

### 3.1 必须等用户决策（P0 阻塞）

| 决策点 | 选项 | 默认 |
|---|---|---|
| 储备金证明模块 | 上线 / **"即将开放"标签** | "即将开放" |
| 树图公链专区 | 上线 / **"即将开放"标签** | "即将开放" |
| APP 化（原生） | 不做 / 新增 iOS+Android 工程 | **不做**（无工程） |
| 小程序化 | 不做 / 新增 miniprogram 工程 | **不做**（无工程） |
| Stitch 原始资产提供 | 等待 / **用文字描述推断** | 用文字描述 |

### 3.2 必须等后端能力（**禁止伪造**）

| 模块 | 阻塞 |
|---|---|
| 真实行情 ticker | 需内部撮合或第三方 API |
| 真实平台数据（注册用户/24h 成交） | 需 SQL 统计 |
| 真实区块高度 | 需链接入 |
| 真实储备金 | 需 PoR 审计 |
| 真实树图公链 | 需 16 项能力落地 |
| 桌面端公告/帮助 API | 需新增 5 个 endpoint |

### 3.3 必须等上游文档

- 04 文档已要求新增 8 个 API（announcements/help/fees 等）
- 需后端确认 Prisma 模型是否已存在
- 需 admin 配合提供管理入口

---

## 4. 需要用户确认的事项

### 4.1 阻塞 P1 启动的决策

1. **Stitch 原始设计稿是否能在 P1 启动前提供**？
   - 是 → 完整还原
   - 否 → 用文字描述 + 现有截图做参考，标注"待 Stitch 原稿确认"

2. **储备金证明 / 树图公链专区是否在新设计中**？
   - 是 → 强制"即将开放"标签（**禁止伪造**）
   - 否 → 不出现在新设计中

3. **是否需要新增原生 APP 工程**？
   - 是 → 启动独立 APP 工程（数月工作量）
   - 否 → 仅 Web + H5 升级

4. **是否需要新增小程序工程**？
   - 是 → 启动独立小程序工程
   - 否 → 仅 Web + H5 升级

### 4.2 阻塞 P2 启动的决策

5. **公告/帮助是否新增 API**？
   - 是 → 后端新增 5 endpoint
   - 否 → 仅静态内容

6. **机构服务是否新增**？
   - 是 → 静态 + 咨询表单
   - 否 → 不出现在新设计中

### 4.3 阻塞 P3 启动的决策

7. **行情数据源选型**？
   - A 内部撮合（工程量大）
   - B 第三方公开 API（成本低）
   - C 保留 mock + "数据接入中"标签（最安全）

8. **H5 视觉升级是否保留全部 110+ 路由**？
   - 是 → 推荐
   - 否 → 重写（30-50 人天）

### 4.4 阻塞 P4 启动的决策

9. **鉴权方案**？
   - 不改 middleware（推荐）
   - 改 middleware（**禁止**）

### 4.5 阻塞 P5-P6 启动的决策

10. **切流方式**？
    - nginx 权重（推荐）
    - Next.js rewrite
    - 客户端 cookie

11. **旧首页保留时长**？
    - 30 天（推荐）
    - 7 天
    - 立即归档

---

## 5. 是否触碰业务代码

### 5.1 本任务（Q05-FrontPortal-NewDesign-Import-Preflight）

- ❌ **未触碰任何业务代码**
- ❌ **未触碰任何 `src/app/(root)/**`（旧官网）**
- ❌ **未触碰任何 `src/app/h5/(原)/**`（旧 H5）**
- ❌ **未触碰任何 `src/app/admin/**`**
- ❌ **未触碰 `src/middleware.ts` `prisma/**` `package.json` `next.config.*` `tsconfig.json`**
- ✅ **仅新增** `docs/front-portal/q05-new-design-import/*.md` 10 个文档
- ✅ **未 commit**（用户未要求）
- ✅ **未 push**（用户未授权，github:443 也不可达）

### 5.2 后续 P1-P6 阶段（**待用户授权**）

- ✅ **允许** 新建 `src/app/portal-preview/**`
- ✅ **允许** 新建 `src/app/h5/portal-preview/**`
- ✅ **允许** 新建 `src/app/api/portal-preview/**`（仅当必需）
- ✅ **允许** 新建 `src/lib/portal-preview/**`（仅当必需）
- ❌ **禁止** 修改任何既有 `src/**` `prisma/**` `package.json` `next.config.*` `tsconfig.json`
- ❌ **禁止** 删除任何既有文件
- ❌ **禁止** push（除非用户明确授权）
- ❌ **禁止** 处理 historical dirty

---

## 6. 是否触碰 APP

- ❌ **未触碰**
- ❌ **仓库无原生 APP 工程**（`ios/` `android/` `react-native/` 目录不存在）
- ❌ **仓库无小程序工程**（`miniprogram/` 目录不存在）
- ❌ **未建议新增** APP 工程（除非用户决策 P0-3）

---

## 7. 是否触碰 admin

- ❌ **未触碰**
- ❌ **未修改** `src/app/admin/**` 任何文件
- ❌ **未修改** admin 任何 API route
- ❌ **未修改** admin 任何 layout
- 仅在 `03-app-admin-web-alignment.md` 中**盘点** admin 菜单，**不修改** admin 代码

---

## 8. 是否触碰数据库

- ❌ **未触碰**
- ❌ **未修改** `prisma/schema.prisma`
- ❌ **未执行** 任何 DB DDL / DML
- ❌ **未新增** 任何 Prisma model
- ⚠️ **P2 阶段可能新增** `Announcement` `HelpArticle` 模型（**仅当 Prisma 不存在时**，**不污染主 schema**）

---

## 9. git 状态

```
HEAD:       afa6c9debca704e1fd7ae177ae50a81bd7a974f4 (afa6c9d)
branch:     main
origin/main: cfd22d91b76e923f5855b764f707d32a3e10b17b
ahead:      1
behind:     0
working tree: 443 行 dirty（historical baseline + 10 个新 docs 为 ?? 未跟踪）
```

### 9.1 本任务新增文件状态

| 文件 | 状态 |
|---|---|
| `docs/front-portal/q05-new-design-import/00-current-frontsite-baseline.md` | ??（未跟踪） |
| `docs/front-portal/q05-new-design-import/01-stitch-new-design-inventory.md` | ?? |
| `docs/front-portal/q05-new-design-import/02-old-vs-new-difference-analysis.md` | ?? |
| `docs/front-portal/q05-new-design-import/03-app-admin-web-alignment.md` | ?? |
| `docs/front-portal/q05-new-design-import/04-api-data-source-map.md` | ?? |
| `docs/front-portal/q05-new-design-import/05-preview-route-plan.md` | ?? |
| `docs/front-portal/q05-new-design-import/06-component-mapping-plan.md` | ?? |
| `docs/front-portal/q05-new-design-import/07-risk-register.md` | ?? |
| `docs/front-portal/q05-new-design-import/08-phase-implementation-plan.md` | ?? |
| `docs/front-portal/q05-new-design-import/99-preflight-summary.md` | ??（本文件） |

> **未 commit，未 push**。本任务不要求 commit/push。

---

## 10. 关键约束（**永久硬约束**）

| # | 约束 | 来源 |
|---|---|---|
| 1 | 不直接覆盖当前 `/` 首页 | 用户决策 |
| 2 | 不删除旧官网文件 | 用户决策 |
| 3 | 不改 APP | 用户决策（无工程） |
| 4 | 不改 admin 管理后台 | 用户决策 |
| 5 | 不动钱包/交易/账务/链上服务 | 用户决策 |
| 6 | 不动数据库 schema | 用户决策 |
| 7 | 不改 remote | 用户决策 |
| 8 | 不 push | 用户决策 |
| 9 | 不清理历史 dirty | 用户决策 |
| 10 | 不使用 mock 假数据冒充真实数据 | 用户决策 |
| 11 | 不伪造行情/资产/交易量/区块高度/用户数/储备金 | 用户决策 |
| 12 | 所有未接入数据统一显示 5 类标签 | 用户决策 |
| 13 | 新设计走 `/portal-preview` 路由 | 05 方案 |
| 14 | 不修改任何既有 `src/**` `prisma/**` `package.json` `next.config.*` | 05 方案 |
| 15 | 不修改 `src/middleware.ts` | 04 / 05 方案 |

---

## 11. 关键决策点（**待用户回复**）

### 11.1 P0 阻塞决策（**启动 P1 前必答**）

| # | 决策 | 建议默认 |
|---|---|---|
| 1 | Stitch 原始资产是否提供 | 用文字描述推断 |
| 2 | 储备金证明模块是否在新设计 | "即将开放"标签 |
| 3 | 树图公链专区是否在新设计 | "即将开放"标签 |
| 4 | 是否新增原生 APP 工程 | 不做 |
| 5 | 是否新增小程序工程 | 不做 |

### 11.2 P1-P2 决策

| # | 决策 | 建议默认 |
|---|---|---|
| 6 | 公告/帮助是否新增 API | 新增 5 endpoint |
| 7 | 机构服务是否新增 | 静态 + 咨询表单 |
| 8 | 行情数据源选型 | C 起步（mock + 标签） |
| 9 | H5 视觉是否保留全部 110+ 路由 | 保留 |

### 11.3 P3-P6 决策

| # | 决策 | 建议默认 |
|---|---|---|
| 10 | 鉴权方案（不改 middleware） | layout 判定 + localStorage |
| 11 | 切流方式 | nginx 权重 |
| 12 | 旧首页保留时长 | 30 天 |

---

## 12. 关键依赖输入（**当前缺失**）

| 输入物 | 路径建议 | 阻塞 |
|---|---|---|
| Stitch 桌面端截图 | `docs/stitch/desktop/*.png` | P1 |
| Stitch H5 截图 | `docs/stitch/mobile/*.png` | P1 |
| Stitch 页面结构树 | `docs/stitch/pages-tree.json` | P1 |
| Stitch 设计 token | `docs/stitch/tokens.json` | P1 |
| Stitch 组件清单 | `docs/stitch/components.json` | P1 |
| 用户对 11 项决策的回复 | （本文件 §11） | P1-P6 |

---

## 13. 预检结论

### 13.1 范围合规性

- ✅ 仅产出 10 份文档
- ✅ 未触碰业务代码
- ✅ 未触碰 APP / Admin / DB
- ✅ 未 commit / 未 push
- ✅ 未清理 historical dirty

### 13.2 方案完整性

- ✅ 预览路由方案明确（`/portal-preview`）
- ✅ 5 类状态标签规范明确
- ✅ 组件映射方案完整（20 个组件）
- ✅ 风险登记完整（100+ 风险点）
- ✅ 实施计划完整（P1-P6 共 6 阶段）

### 13.3 落地可行性

- 🟢 **P1 阶段** 可立即启动（仅静态）
- 🟡 **P2 阶段** 需后端确认是否新增 5 API
- 🟡 **P3 阶段** 需用户决策行情数据源
- 🟡 **P4 阶段** 需鉴权方案确定
- 🟡 **P5 阶段** 需切流方式确定
- 🟡 **P6 阶段** 需客户验收流程

### 13.4 最大风险

- **P0**：Stitch 原始资产未提供，可能导致设计还原度低
- **P0**：储备金/树图公链若误上线真实模块 = 工业级失败
- **P0**：H5 110+ 路由若全推倒重做 = 30-50 人天 + 真实业务绑定风险

### 13.5 推荐下一步

1. **用户回复** §11 全部 12 项决策
2. **用户提供** Stitch 原始资产（截图 + 页面树 + token + 组件清单）
3. **启动 P1 静态预览门户**（基于现有品牌色 + 文字描述推断）
4. **P1 完成后启动 P2-P6 顺序推进**

---

## 14. 文档关联

- `00-current-frontsite-baseline.md` — 当前基线（git/H5/官网/admin/APP）
- `01-stitch-new-design-inventory.md` — 新设计资产盘点
- `02-old-vs-new-difference-analysis.md` — 新旧差异
- `03-app-admin-web-alignment.md` — 四端对齐
- `04-api-data-source-map.md` — 数据源对齐
- `05-preview-route-plan.md` — 预览路由方案
- `06-component-mapping-plan.md` — 组件映射
- `07-risk-register.md` — 风险登记
- `08-phase-implementation-plan.md` — 实施计划
- `99-preflight-summary.md` — 本文件（综合摘要）

---

## 15. 关联 inventory 文档

- `docs/industrial-masterplan/_inventory/00-current-git-state.md` — git 状态
- `docs/industrial-masterplan/_inventory/04-api-route-inventory.md` — 330 API route
- `docs/industrial-masterplan/_inventory/05-admin-api-inventory.md` — admin API
- `docs/industrial-masterplan/_inventory/06-admin-page-inventory.md` — 278 admin page
- `docs/industrial-masterplan/_inventory/08-database-schema-inventory.md` — 255 Prisma model
- `docs/industrial-masterplan/_inventory/09-asset-wallet-ledger-inventory.md` — 4 套账户 + 11 套 ledger
- `docs/industrial-masterplan/_inventory/11-chain-integration-inventory.md` — Alchemy / 链接入
- `docs/industrial-masterplan/_inventory/13-mock-data-inventory.md` — mock 命中统计
- `docs/industrial-masterplan/_inventory/16-known-dirty-baseline.md` — 244 dirty baseline
- `docs/industrial-masterplan/_inventory/17-binance-capability-gap-draft.md` — 币安 40 项对标
- `docs/industrial-masterplan/_inventory/18-treegraph-capability-gap-draft.md` — 树图 16 项缺失
- `docs/industrial-masterplan/_inventory/99-summary-for-architect.md` — 架构师摘要

---

> **本文件为只读综合摘要，未对任何业务代码、schema、seed、配置进行修改。**
> **本任务不 commit、不 push、不触碰 historical dirty、不触碰 APP/Admin/DB。**
> **下一步等用户回复 12 项决策 + 提供 Stitch 原始资产后启动 P1。**
