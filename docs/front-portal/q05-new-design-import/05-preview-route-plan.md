# 05 - 预览路由方案（Preview Route Plan）

> **任务编号**：Q05-FrontPortal-NewDesign-Import-Preflight · 05
> **生成时间**：2026-07-18（Asia/Shanghai）
> **性质**：只读规划，**不修改任何业务代码**

---

## 0. 核心原则

1. **不影响旧官网** `/`（保持在线）
2. **不影响 H5**（`/h5/*` 保持在线）
3. **不影响 Admin**（`/admin/*` 保持在线）
4. **不影响 APP**（无 APP 工程，不影响）
5. **不影响 DB schema**
6. **不影响钱包/交易/账务/链上服务**
7. **不伪造数据**
8. **不 push**
9. **不清理历史 dirty**

---

## 1. 预览路由命名

### 1.1 候选路由对比

| 候选 | 优点 | 缺点 | 推荐度 |
|---|---|---|---|
| `/portal-preview` | 语义清晰（门户预览） | 名称较长 | ⭐⭐⭐⭐ |
| `/front-preview` | 直接表达"前台预览" | 与"前端"易混淆 | ⭐⭐⭐ |
| `/new-home` | 短、易记 | 仅指首页，不覆盖子页 | ⭐⭐ |
| `/front-portal/v2` | 版本化 | 与 dev branch 概念混淆 | ⭐⭐ |
| `/exchange-v2` | 品牌化 | 不够"预览"语义 | ⭐⭐ |

> **推荐**：`/portal-preview` 作为主预览路由（含 H5 端用 `/h5/portal-preview`）。

### 1.2 最终路由方案

| 端 | 预览路由 | 用途 |
|---|---|---|
| 桌面 Web | `/portal-preview` | 桌面端新设计预览 |
| 桌面 Web 子页 | `/portal-preview/{markets,trade,wallet,security,api-docs,help,announcement,risk,about,institution,compliance,...}` | 桌面端各模块 |
| H5 移动 | `/h5/portal-preview` | H5 新设计预览 |
| H5 子页 | `/h5/portal-preview/{markets,trade,wallet,ai,defi,nft,ido,otc,shop,stake,savings,profile,...}` | H5 各模块 |
| Admin（不涉及） | — | 保持原状 |
| APP（不存在） | — | — |

---

## 2. 不影响旧官网的实现方式

### 2.1 目录隔离

```
src/app/
├── (root)                    ← 旧官网（不动）
│   ├── page.tsx              ← 旧首页
│   ├── HomepageContent.tsx
│   ├── about/
│   ├── markets/
│   ├── trade/
│   ├── user/
│   ├── ...
├── h5/                        ← 旧 H5（不动）
│   ├── page.tsx
│   ├── layout.tsx
│   ├── ...
├── admin/                     ← 旧 Admin（不动）
│   ├── page.tsx
│   ├── ...
├── auth/                      ← 鉴权（不动）
├── api/                       ← 既有 API（不动）
└── portal-preview/            ← 🆕 新建预览目录
    ├── layout.tsx             ← 独立 layout（不污染旧官网）
    ├── page.tsx               ← 预览首页
    ├── markets/
    │   └── page.tsx
    ├── trade/
    │   └── page.tsx
    ├── wallet/
    │   └── page.tsx
    ├── security/
    │   └── page.tsx
    ├── api-docs/
    │   └── page.tsx
    ├── help/
    │   ├── page.tsx
    │   └── [id]/page.tsx
    ├── announcement/
    │   ├── page.tsx
    │   └── [id]/page.tsx
    ├── risk/
    │   └── page.tsx
    ├── about/
    │   └── page.tsx
    ├── institution/
    │   └── page.tsx
    ├── compliance/
    │   └── page.tsx
    ├── fees/
    │   └── page.tsx
    ├── privacy/
    │   └── page.tsx
    ├── terms/
    │   └── page.tsx
    └── components/            ← 预览专用组件
        ├── Header.tsx
        ├── MegaMenu.tsx
        ├── Footer.tsx
        └── ...
```

### 2.2 Layout 隔离

- **`src/app/portal-preview/layout.tsx`**：独立 layout，不引入 `src/app/layout.tsx` 的全站 providers（如旧 i18n、theme、auth provider）
- **不使用**根 layout 的 metadata（独立 metadata）
- **不使用**根 layout 的 globals（独立 CSS module 或 scoped styles）
- **不修改**`src/app/layout.tsx`、`src/app/globals.css`、`src/app/h5/layout.tsx`、`src/app/admin/layout.tsx`

### 2.3 数据隔离

- 预览路由**不修改**任何 `src/app/api/**` 路由
- 预览路由**只读**已有 API
- **新增 API 仅放** `src/app/api/portal-preview/**`（如果必需）
- 新增 API 命名必须以 `portal-preview` 为前缀，避免污染

---

## 3. Feature Flag 设计

### 3.1 是否需要 Feature Flag

| 维度 | 需要？ | 理由 |
|---|---|---|
| 路由级开关 | **是** | 出问题立即关闭 |
| 用户级开关 | 否 | 内部预览，不区分用户 |
| 环境级开关 | 是 | dev/staging/prod 区分 |

### 3.2 建议实现

```typescript
// src/lib/portal-preview/flag.ts
export const PORTAL_PREVIEW_ENABLED = process.env.PORTAL_PREVIEW_ENABLED === 'true';
export const PORTAL_PREVIEW_ROUTES = ['/portal-preview', '/h5/portal-preview'];
```

- **dev**：默认开启
- **staging**：默认开启
- **prod**：默认关闭（手动开）

### 3.3 不强制使用 feature flag

> 简化方案：直接放 `/portal-preview` 路由，**不引入开关**。优点：
> - 代码更少
> - 出问题直接删 `src/app/portal-preview/` 目录即可回滚
> - 不污染 `src/lib/**` 任何文件

> **推荐**：**不引入 feature flag**，直接用独立目录 + 独立 layout。回滚成本：删除一个目录。

---

## 4. 环境变量开关

### 4.1 是否需要

- 上述"不引入 feature flag"已经覆盖了大部分场景
- 唯一需要的是 dev/prod 默认行为区分

### 4.2 可选配置

```bash
# .env.local
NEXT_PUBLIC_PORTAL_PREVIEW_ENABLED=true
```

- 设为 `false` 时 `/portal-preview` 路由**渲染 404**，但**目录不删**
- **不强制**，可在 layout 中判断

### 4.3 推荐方案

> **不引入环境变量**。目录天然隔离，删目录 = 回滚。零配置。

---

## 5. 是否需要独立 layout

### 5.1 答案：**是，必须独立**

理由：
1. 新设计有自己的 Header / Footer / MegaMenu
2. 新设计有自己的 typography / color token
3. 新设计有自己的 i18n（暂仅中文，但需要独立 namespace）
4. **不能污染**根 `src/app/layout.tsx`（影响所有旧页面）

### 5.2 独立 layout 关键点

```typescript
// src/app/portal-preview/layout.tsx
import './portal-preview.css';  // 独立样式
import { PortalHeader } from './components/Header';
import { PortalFooter } from './components/Footer';

export default function PortalPreviewLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="portal-preview-root">
      <PortalHeader />
      <main className="portal-preview-main">{children}</main>
      <PortalFooter />
    </div>
  );
}
```

### 5.3 独立导航

- 桌面端：`<MegaMenu>`（产品矩阵 + 行情 + 交易 + 钱包 + 资讯 + 关于 + 登录/注册）
- H5 端：`<MobileBottomTabs>`（首页 / 行情 / 交易 / 钱包 / 我的）

### 5.4 独立样式

- `src/app/portal-preview/portal-preview.css`
- **不修改** `src/app/globals.css`
- **不修改** 任何 `tailwind.config.*` 全局配置

---

## 6. 是否需要独立导航

### 6.1 答案：**是**

- 新设计有自己的菜单分类（14 大类）
- 旧官网的 nav 数组在 `src/app/layout.tsx` 或 `src/lib/constants.ts`
- **不修改旧 nav**，新建 `src/app/portal-preview/nav.config.ts`

---

## 7. 回滚方案

### 7.1 应急回滚

```bash
# 整目录删除（最暴力但最安全）
rm -rf src/app/portal-preview/
rm -rf src/app/h5/portal-preview/

# dev server 自动 HMR 移除
# 不需要 commit
# 不需要 push
# 不需要配置
```

### 7.2 渐进回滚

| 阶段 | 回滚方式 |
|---|---|
| P1 内部验收 | 删 `src/app/portal-preview/` |
| P2 灰度 10% | 关闭 nginx 路由或 Next.js rewrite |
| P3 灰度 100% | 同上 |
| P4 正式替换 | 旧 `/` 保留 7 天，监控后归档 |

### 7.3 数据回滚

- **无 schema 变更** → 无 DB 回滚
- **无 API 修改** → 无 API 回滚
- **无远端推送** → 无 git 回滚

---

## 8. 路由实现优先级

| 序 | 路由 | 优先级 | 工作量（估） |
|---|---|---|---|
| 1 | `/portal-preview` 预览首页 | P0 | 2-3d |
| 2 | `/portal-preview/markets` | P0 | 1-2d |
| 3 | `/portal-preview/wallet` | P0 | 1-2d |
| 4 | `/portal-preview/security` | P0 | 1d |
| 5 | `/portal-preview/help` | P1 | 1d |
| 6 | `/portal-preview/announcement` | P1 | 1-2d |
| 7 | `/portal-preview/risk` | P1 | 0.5d |
| 8 | `/portal-preview/about` | P1 | 0.5d |
| 9 | `/portal-preview/compliance` | P1 | 0.5d |
| 10 | `/portal-preview/institution` | P2 | 1-2d |
| 11 | `/portal-preview/api-docs` | P2 | 1-2d |
| 12 | `/portal-preview/fees` | P2 | 0.5d |
| 13 | `/portal-preview/privacy` | P2 | 0.5d |
| 14 | `/portal-preview/terms` | P2 | 0.5d |
| 15 | `/h5/portal-preview` H5 预览 | P0 | 5-8d |

> **总工作量预估**：桌面 12-18d + H5 5-8d = **17-26d（2-3 人）**

---

## 9. 与旧官网的隔离清单

### 9.1 必须不动的文件

| 路径 | 原因 |
|---|---|
| `src/app/page.tsx` | 旧官网首页 |
| `src/app/HomepageContent.tsx` | 旧首页 client |
| `src/app/layout.tsx` | 根 layout |
| `src/app/globals.css` | 全局样式 |
| `src/app/h5/layout.tsx` | H5 旧 layout |
| `src/app/h5/page.tsx` | H5 旧首页 |
| `src/app/admin/layout.tsx` | Admin layout |
| `src/app/admin/page.tsx` | Admin 首页 |
| `src/app/auth/*` | 鉴权 |
| `src/app/api/**` | 既有 API（**只读**） |
| `src/lib/constants.ts` | 旧 FAQ_DATA（可**只读引用**） |
| `src/middleware.ts` | 鉴权中间件 |
| `prisma/schema.prisma` | DB schema |
| `package.json` / `package-lock.json` | 依赖 |
| `next.config.js` / `tsconfig.json` | 配置 |

### 9.2 允许新增的文件

| 路径 | 说明 |
|---|---|
| `src/app/portal-preview/**` | 预览全部 |
| `src/app/h5/portal-preview/**` | H5 预览全部 |
| `src/app/api/portal-preview/**` | 预览专用 API（**仅当必需**） |
| `src/lib/portal-preview/**` | 预览专用工具（仅内部使用） |
| `docs/front-portal/q05-new-design-import/**` | 本任务文档（已生成） |

### 9.3 允许修改的文件

- **不允许**任何业务代码修改
- **允许** 仅 `src/app/portal-preview/**` 和 `src/app/h5/portal-preview/**` 内部

---

## 10. 验证清单（落地后）

- [ ] 旧 `/` 首页仍可访问，内容未变
- [ ] 旧 `/h5/*` 路由仍可访问
- [ ] 旧 `/admin/*` 路由仍可访问
- [ ] DB schema 未变（`prisma/schema.prisma` 未修改）
- [ ] 旧 API 路由（`/api/**`）行为未变
- [ ] 旧 `package.json` 依赖未变
- [ ] 旧 `git log` 未引入新 commit（如本任务不 commit）
- [ ] `/portal-preview` 可访问
- [ ] `/h5/portal-preview` 可访问
- [ ] 所有数据展示符合 5 类状态标签规范
- [ ] 浏览器 console 无 fatal error
- [ ] 浏览器 network 5xx/401 正常
- [ ] 移动端响应式正常
- [ ] 桌面端响应式正常

---

> **本文件为只读规划。未对任何业务代码、schema、seed、配置进行修改。**
