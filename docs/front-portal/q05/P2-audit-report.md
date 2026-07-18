# Q05 FrontPortal P2.0 视觉系统与合规文案只读审计报告

> **审计阶段**: Q05-FrontPortal-P2.0-Preview-Visual-And-Compliance-Audit-ReadOnly
> **审计对象**: `/portal-preview` 静态预览门户
> **审计日期**: 2026-07-18
> **状态**: PASS WITH 1 WARN / 0 FAIL
> **落盘阶段**: Q05-FrontPortal-P2.1-Preview-Audit-Report-Archive

---

## 1. 审计结论

- **审计阶段**: Q05-FrontPortal-P2.0-Preview-Visual-And-Compliance-Audit-ReadOnly
- **审计对象**: `/portal-preview` 静态预览门户
- **审计范围**:
  - `src/app/portal-preview/**`
  - `src/components/portal-preview/**`
- **扫描文件数**:
  - `src/app/portal-preview/**`: **11**
  - `src/components/portal-preview/**`: **21**（含 `brand.ts` + `SPEC.md`）
  - 合计: **32**
- **总体结论**: **PASS WITH 1 WARN**
- **PASS 项数量**: **6**
- **WARN 项数量**: **1**
- **FAIL 项数量**: **0**
- **是否修改代码**: **否**
- **是否新增或修改页面**: **否**
- **是否触碰 APP/Admin/API/数据库**: **否**

---

## 2. 执行边界

本次 P2.0 审计为只读审计，仅执行 Grep / Glob / Read，不修改任何业务文件。

确认结果:

| 项目 | 结果 |
|---|---|
| 是否只读审计 | 是 |
| 是否修改 portal-preview 页面代码 | 否 |
| 是否修改组件代码 | 否 |
| 是否修改 brand.ts | 否 |
| 是否修改 SPEC.md | 否 |
| 是否修改 project_memory.md | 否 |
| 是否触碰 APP | 否 |
| 是否触碰 Admin | 否 |
| 是否触碰 API / middleware / 数据库 / Prisma / seed | 否 |
| 是否 git add | 否 |
| 是否 commit | 否 |
| 是否 push | 否 |

---

## 3. 审计范围

本次审计范围仅限:

- `src/app/portal-preview/**`
- `src/components/portal-preview/**`

扫描文件数:

| 范围 | 文件数 |
|---|---:|
| `src/app/portal-preview/**` | 11 |
| `src/components/portal-preview/**` | 21 |
| **合计** | **32** |

文件范围包括:

- `src/app/portal-preview/page.tsx`
- `src/app/portal-preview/layout.tsx`
- `src/app/portal-preview/about/**`
- `src/app/portal-preview/announcements/**`
- `src/app/portal-preview/discover/**`
- `src/app/portal-preview/fees/**`
- `src/app/portal-preview/institution/**`
- `src/app/portal-preview/kyc-guide/**`
- `src/app/portal-preview/mobile/**`
- `src/app/portal-preview/risk/**`
- `src/app/portal-preview/spot-guide/**`
- `src/components/portal-preview/**`

---

## 4. 审计结果摘要

| 审计项 | 结论 | 说明 |
|---|---|---|
| 旧色系残留审计 | **PASS** | 仅在 `brand.ts` 注释中存在历史迁移记录，页面/组件实际代码未使用弃用色 |
| 硬编码颜色审计 | **PASS WITH WARN** | `PortalMarketPreview.tsx` 存在 5 个币种官方品牌色 hex 硬编码 |
| Tailwind 默认调色板审计 | **PASS** | 未发现 `text-white` / `bg-slate-*` / `bg-gray-*` / `border-zinc-*` 等核心视觉绕过 |
| brand.ts 使用审计 | **PASS** | 未发现核心视觉绕过 `brand.ts` |
| 状态徽章与空状态审计 | **PASS** | 页面层未发现裸写状态文案，命中均为组件内置默认文案或枚举定义 |
| 高风险合规文案审计 | **PASS** | 未发现持牌、监管、牌照、收益保障、绝对安全、全球合法等高风险表达 |
| 六个重点市场表达边界审计 | **PASS** | 当前未触及六个重点市场表达 |

---

## 5. 旧色系残留审计

检查弃用色值:

- `#0D0B07`
- `#1F1A12`
- `#FCD535`
- `#C99400`
- `#F0E9D8`
- `#B8AD96`
- `#b6c4ff`
- `#B6C4FF`

审计结果:

| 检查项 | 结果 | 说明 |
|---|---|---|
| v5 暖黑 `#0D0B07` | PASS | 仅在 `brand.ts` 注释中出现，作为 v5→v6 迁移记录 |
| 暖灰带金 `#1F1A12` | PASS | 仅在 `brand.ts` 注释中出现 |
| 暖金 `#FCD535` | PASS | 0 命中 |
| 深金 `#C99400` | PASS | 0 命中 |
| 暖白 `#F0E9D8` | PASS | 仅在 `brand.ts` 注释中出现 |
| 暖灰 `#B8AD96` | PASS | 仅在 `brand.ts` 注释中出现 |
| 冷蓝紫 `#b6c4ff` / `#B6C4FF` | PASS | 0 命中 |
| 页面/组件代码实际使用弃用色 | PASS | 0 命中 |

**结论**:

> 旧色系残留审计 **PASS**。当前命中均为历史迁移注释，不构成业务违规。

---

## 6. 硬编码颜色审计

审计结果:

| 文件 | 行号 | 内容 | 结论 |
|---|---:|---|---|
| `src/components/portal-preview/PortalMarketPreview.tsx` | L15 | BTC / USDT 使用 `#F7931A` | WARN |
| `src/components/portal-preview/PortalMarketPreview.tsx` | L16 | ETH / USDT 使用 `#627EEA` | WARN |
| `src/components/portal-preview/PortalMarketPreview.tsx` | L17 | CFX / USDT 使用 `#1652F0` | WARN |
| `src/components/portal-preview/PortalMarketPreview.tsx` | L18 | SOL / USDT 使用 `#14F195` | WARN |
| `src/components/portal-preview/PortalMarketPreview.tsx` | L19 | BNB / USDT 使用 `#F3BA2F` | WARN |

**说明**:

以上 5 个 hex 为币种官方品牌色，不属于页面核心视觉色系（例如页面底色、卡片底色、主文字、边框、CTA、品牌绿等）。

**风险等级**:

> WARN，非 FAIL。

**原因**:

- 不影响 v6 纯黑无色相主视觉；
- 不构成暖黑、暖金、币安黄主视觉回退；
- 但仍违反"颜色管理禁止硬编码"的长期规范。

**最小修复建议**:

后续 P2.2 可将币种官方品牌色抽入 `brand.ts`，例如:

```ts
BRAND.cryptos = {
  BTC: '#F7931A',
  ETH: '#627EEA',
  CFX: '#1652F0',
  SOL: '#14F195',
  BNB: '#F3BA2F',
} as const;
```

然后将 `PortalMarketPreview.tsx` 中的硬编码 hex 替换为:

```ts
BRAND.cryptos.BTC
BRAND.cryptos.ETH
BRAND.cryptos.CFX
BRAND.cryptos.SOL
BRAND.cryptos.BNB
```

**本阶段不执行修复**。

---

## 7. Tailwind 默认调色板审计

检查项包括:

- `text-white`
- `text-gray-*`
- `text-zinc-*`
- `text-slate-*`
- `bg-white`
- `bg-black`
- `bg-gray-*`
- `bg-zinc-*`
- `bg-slate-*`
- `border-gray-*`
- `border-zinc-*`
- `border-slate-*`

**审计结果**:

> **PASS**

未发现页面或组件中使用 Tailwind 默认调色板直接表达核心视觉。

---

## 8. brand.ts 使用审计

审计结果:

| 检查项 | 结果 |
|---|---|
| 是否发现组件绕过 `brand.ts` 直接写核心颜色 | 否 |
| 是否发现页面绕过 `brand.ts` 直接写核心颜色 | 否 |
| 是否发现状态样式绕过统一枚举 | 否 |
| 是否发现裸写状态文案 | 否 |

**结论**:

> **PASS**

当前组件均通过 `BRAND` / `STATUS` 等统一 token 与枚举引用视觉与状态规范。

---

## 9. 状态徽章与空状态审计

审计结果:

| 检查项 | 结果 | 说明 |
|---|---|---|
| 页面层裸写"暂无数据" | PASS | 0 命中 |
| 页面层裸写"敬请期待" | PASS | 0 命中 |
| 页面层裸写"即将上线" | PASS | 0 命中 |
| "内测中" | PASS | 命中仅在组件内置默认文案中 |
| "维护中" | PASS | 命中仅在组件内置默认文案中 |
| "即将开放" | PASS | 命中仅在组件内置默认文案中 |
| 是否统一使用状态组件 | PASS | 未发现业务页面绕过 |

合法命中文件:

- `src/components/portal-preview/brand.ts`
- `src/components/portal-preview/PortalStatusBadge.tsx`
- `src/components/portal-preview/PortalEmptyState.tsx`

**结论**:

> **PASS**。命中均为组件内置 default 文案、枚举定义或注释说明，不构成页面裸写违规。

---

## 10. 高风险合规文案审计

检查项包括:

- `Samoa licensed exchange`
- `licensed in Samoa`
- `regulated by Samoa`
- `持牌数字资产交易所`
- `持牌交易所`
- `全球持牌`
- `已获得多国牌照`
- `受多国监管`
- `已在迪拜持牌`
- `已在马耳他持牌`
- `已在塞浦路斯持牌`
- `已在美国持牌`
- `已在新加坡持牌`
- `已在香港持牌`
- `保证合规`
- `全球合法运营`
- `全球持牌交易所`
- `多国监管交易所`
- `监管牌照矩阵`
- `全球持牌布局`
- `收益有保障`
- `收益确定性`
- `资产绝对安全`
- `监管确定性`
- `已获得多国监管许可`
- `绝对安全`
- `零风险`
- `保本`
- `保收益`
- `必然合规`
- `全球通行`

**审计结果**:

> **PASS**

未发现以上高风险合规文案。

同时未发现以中文或英文形式表达以下含义:

- 萨摩亚主体已经取得交易所牌照；
- 萨摩亚主体已经取得当地监管许可；
- 萨摩亚主体已经受到当地监管；
- 萨摩亚主体已经获得当地监管批准；
- 萨摩亚主体已经具备当地持牌交易所身份。

---

## 11. 六个重点市场表达边界审计

检查地区:

- 迪拜
- 马耳他
- 塞浦路斯
- 美国
- 新加坡
- 香港

**审计结果**:

> **PASS**

当前 `/portal-preview/**` 静态预览门户未出现上述六个重点市场表达。

**说明**:

当前 P1 静态预览门户尚未进入国际化合规研究方向内容填充阶段。后续如需展示"持续关注六个重点市场监管框架"，必须严格使用以下安全表达:

- 重点市场与合规研究方向；
- 国际化合规观察方向；
- 持续关注监管框架、合规要求与产业机会；
- 为后续全球化服务能力建设提供参考。

**禁止写成**:

- 已持牌地区；
- 已监管地区；
- 已获许可地区；
- 已获得牌照地区。

---

## 12. WARN 项清单

### WARN-001：PortalMarketPreview 5 个币种品牌色硬编码

- **文件**: `src/components/portal-preview/PortalMarketPreview.tsx`
- **行号**: L15-L19
- **问题**: 5 个币种官方品牌色以 hex 形式硬编码，未抽到 `brand.ts`
- **涉及币种**:
  - BTC: `#F7931A`
  - ETH: `#627EEA`
  - CFX: `#1652F0`
  - SOL: `#14F195`
  - BNB: `#F3BA2F`
- **风险等级**: WARN
- **是否核心视觉违规**: 否
- **是否影响 v6 纯黑无色相主视觉**: 否
- **是否需要修复**: 建议后续 P2.2 最小修复
- **最小修复方向**:
  - 在 `brand.ts` 中新增币种品牌色 token；
  - 在 `PortalMarketPreview.tsx` 中改为引用 `BRAND.cryptos.*`；
  - 如 `SPEC.md` 需要同步 token 说明，则在 P2.2 中一并最小更新。

---

## 13. FAIL 项清单

本次审计未发现 FAIL 项。

**FAIL 项数量: 0**。

---

## 14. 后续建议

建议后续进入:

```text
Q05-FrontPortal-P2.2-Brand-Crypto-Color-Token-Fix
```

**目标**:

- 将 `PortalMarketPreview.tsx` 中 5 个币种官方品牌色抽入 `brand.ts`；
- 替换页面组件中的 hex 硬编码；
- 必要时同步 `SPEC.md` 中的 token 说明；
- 执行 TypeScript 校验；
- 不触碰 APP/Admin/API/数据库；
- 不 push。

**优先级**:

> 中低优先级，但建议在 Q05 FrontPortal 正式切换 `/` 前完成，避免颜色硬编码规则留下例外。

---

## 15. 报告元信息

| 字段 | 值 |
|---|---|
| 报告生成阶段 | Q05-FrontPortal-P2.1 |
| 审计执行阶段 | Q05-FrontPortal-P2.0 |
| 报告生成日期 | 2026-07-18 |
| 报告状态 | 已落盘 |
| 后续阶段 | Q05-FrontPortal-P2.2（待人工确认） |
| 是否影响 historical dirty | 否 |
| 是否 commit | 否 |
| 是否 push | 否 |
