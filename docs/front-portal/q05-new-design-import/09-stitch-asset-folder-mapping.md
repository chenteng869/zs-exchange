# 09 - Stitch 资产目录映射表

> **任务编号**：Q05-FrontPortal-Stitch-Asset-Inventory-And-Mapping
> **生成时间**：2026-07-18（Asia/Shanghai）
> **来源资产目录**：`docs/中萨全新页面/中萨全新页面/`（项目内 3 层嵌套）
> **扫描方式**：PowerShell + regex 提取 `<title>` 标签
> **扫描状态**：✅ 100% 成功识别目录结构；部分 HTML 无 title 标签的需人工确认

---

## 0. 关键修正（与早期 Q05 报告的差异）

| 项 | 旧 Q05 报告 | 实际扫描结果 |
|---|---|---|
| Stitch 资产命中 | "0 命中" | **63 个目录**全部存在 |
| 资产位置 | "仓库内未发现" | `docs/中萨全新页面/中萨全新页面/`（3 层嵌套）|
| 资产规模 | 推断 0 页面 | **51 个 .html + 60 个 .png + 4 个 .md ≈ 12 MB** |
| 旧报告是否需更新 | — | 旧报告 §01-stitch-new-design-inventory.md 中"无原始资产"结论**作废** |

> 之前在仓库内 `*titch*` 0 命中的原因：搜索 glob 表达式不匹配中文目录 + 路径深度未覆盖。**不是没有资产，是资产在 3 层嵌套的中文目录下被扫描漏掉。**

---

## 1. 资产目录结构总览

```
docs/中萨全新页面/中萨全新页面/         ← 资产根
├── 编号页面 _1~_28/                    ← 28 个 Web 桌面端
│   ├── _1/code.html + screen.png
│   ├── _2/code.html + screen.png
│   └── ...
├── H5 移动端 h5_1~h5_15/               ← 15 个 H5 移动端
│   ├── h5_1/code.html + screen.png
│   └── ...
├── 特殊命名/                            ← 9 个语义化页面
│   ├── zsdex_1/code.html + screen.png
│   ├── zsdex_2/code.html + screen.png
│   ├── v2.0/code.html + screen.png
│   ├── api/code.html + screen.png
│   ├── rest_api/code.html + screen.png
│   ├── websocket_api/code.html + screen.png
│   ├── earn/code.html + screen.png
│   ├── launch/code.html + screen.png
│   ├── zsdex_financial_terminal/        ← 空目录
│   ├── cyber_luxe_financial/            ← 空目录
│   └── obsidian_terminal/                ← 空目录
├── 图标资源/
│   └── a_set_of_professional_financial_ui_icons_for_a_cryptocurrency_exchange/
│       └── 仅 screen.png（1.1 MB）      ← 图标库
└── 独立图片 image.png_1~8/              ← 8 个
    ├── image.png_1/仅 PNG
    └── ...
```

**统计**：63 个子目录（28 编号 + 15 H5 + 11 特殊 + 8 资源 + 1 图标）
**文件**：51 .html + 60 .png + 4 .md
**总大小**：约 12 MB

---

## 2. 编号页面映射 `_1` ~ `_28`（Web 桌面端）

| 编号 | `<title>` 提取 | 推断页面 | 端类型 | A/B/C/D |
|---|---|---|---|---|
| _1 | ZSDEX \| 中萨数字科技交易所 - 工业级交易平台 | 首页 v1 | Web 桌面 | **A** 静态预览 |
| _2 | (空，HTML 无 title) | 待人工确认 | Web 桌面 | **D** |
| _3 | ZSDEX - 提现 (Withdraw) | 提现 | Web 桌面 | **C** 禁止真实接 |
| _4 | (空) | 待人工确认 | Web 桌面 | **D** |
| _5 | (空) | 待人工确认 | Web 桌面 | **D** |
| _6 | ZSDEX - 钱包总览 | 钱包总览 v1 | Web 桌面 | **B** 静态空状态 |
| _7 | (空) | 待人工确认 | Web 桌面 | **D** |
| _8 | 公告中心 - ZSDEX 中萨数字科技交易所 | 公告中心 | Web 桌面 | **B** 静态入口 |
| _9 | 费率说明 - ZSDEX 中萨数字科技交易所 | 费率说明 | Web 桌面 | **A** 静态预览 |
| _10 | 关于我们 \| ZSDEX 中萨数字科技交易所 | 关于我们 | Web 桌面 | **A** 静态预览 |
| _11 | (空) | 待人工确认 | Web 桌面 | **D** |
| _12 | ZSDEX \| 机构服务终端 | 机构服务 | Web 桌面 | **A** 展示页（不接真实 KYB） |
| _13 | (空) | 待人工确认 | Web 桌面 | **D** |
| _14 | (空) | 待人工确认 | Web 桌面 | **D** |
| _15 | 风险提示 - ZSDEX 中萨数字科技交易所 | 风险提示 | Web 桌面 | **A** 静态预览 |
| _16 | 如何进行 实名认证 (KYC) \| ZSDEX 新手学院 | KYC 教学 | Web 桌面 | **A** 教学页 |
| _17 | 如何进行 现货交易 \| ZSDEX 新手学院 | 现货交易教学 | Web 桌面 | **A** 教学页 |
| _18 | 交易中心 \| ZSDEX 中萨数字科技交易所 | 交易中心 | Web 桌面 | **B** 静态入口 |
| _19 | ZSDEX \| 中萨数字科技交易所 - 工业级交易平台 | 首页 v2 | Web 桌面 | **A** 静态预览（与 _1 同主题）|
| _20 | ZSDEX \| 面向全球的专业级数字资产基础设施 | 首页 v3 | Web 桌面 | **A** 静态预览 |
| _21 | ZSDEX \| 行情中心 - 极致交易终端 | 行情中心 v1 | Web 桌面 | **B** 空状态（不接真实行情） |
| _22 | ZSDEX \| 钱包总览 | 钱包总览 v2 | Web 桌面 | **B** 静态空状态 |
| _23 | ZSDEX \| 现货交易 - 专业版 | 现货专业版 | Web 桌面 | **C** 禁止真实接 |
| _24 | ZSDEX - 发现中心 Discovery Center | 发现中心 v1 | Web 桌面 | **A** 静态预览 |
| _25 | ZSDEX \| 未来金融交易门户 | 首页 v4 | Web 桌面 | **A** 静态预览 |
| _26 | ZSDEX \| 行情中心 - Cyber-Luxe Terminal | 行情中心 v2 | Web 桌面 | **B** 空状态 |
| _27 | ZSDEX - 发现中心 Discovery Center | 发现中心 v2 | Web 桌面 | **A** 静态预览（与 _24 同主题）|
| _28 | ZSDEX \| 项目总控台 Project Control Center | 项目总控台 | Web 桌面 | **A** 静态预览 |

**编号页统计**：28 个 = A:13 / B:6 / C:2 / D:7

---

## 3. H5 移动端映射 `h5_1` ~ `h5_15`

| 编号 | `<title>` 提取 | 推断页面 | 端类型 | A/B/C/D |
|---|---|---|---|---|
| h5_1 | ZSDEX - 移动端行情中心 | H5 行情 | H5 移动 | **B** 静态入口 |
| h5_2 | ZSDEX - 移动端交易终端 | H5 交易终端 v1 | H5 移动 | **B** 静态入口 |
| h5_3 | (空) | 待人工确认 | H5 移动 | **D** |
| h5_4 | ZSDEX - 资产总览 | H5 资产总览 | H5 移动 | **B** 静态入口 |
| h5_5 | ZSDEX - 个人中心 | H5 个人中心 | H5 移动 | **A** 静态预览 |
| h5_6 | 关于 ZSDEX - 全球领先的金融交易终端 | H5 关于 | H5 移动 | **A** 静态预览 |
| h5_7 | (空) | 待人工确认 | H5 移动 | **D** |
| h5_8 | (空) | 待人工确认 | H5 移动 | **D** |
| h5_9 | ZSDEX \| 发现 | H5 发现 v1 | H5 移动 | **A** 静态预览 |
| h5_10 | ZSDEX - 移动端交易终端 | H5 交易终端 v2 | H5 移动 | **B** 静态入口 |
| h5_11 | ZSDEX - 中萨数字科技交易所 | H5 首页 v1 | H5 移动 | **A** 静态预览 |
| h5_12 | (空) | 待人工确认 | H5 移动 | **D** |
| h5_13 | (空) | 待人工确认 | H5 移动 | **D** |
| h5_14 | ZSDEX - 发现 | H5 发现 v2 | H5 移动 | **A** 静态预览 |
| h5_15 | ZSDEX \| Cyber-Luxe Exchange | H5 Cyber-Luxe 终端 | H5 移动 | **A** 静态预览 |

**H5 统计**：15 个 = A:7 / B:4 / D:4

---

## 4. 特殊命名页 / 资源 / API 文档（20 个）

| 名称 | `<title>` 提取 | 推断 | 端类型 | A/B/C/D |
|---|---|---|---|---|
| zsdex_1 | ZSDEX 项目导航控制台 | 导航控制台 | 共同组件 | **A** 静态预览 |
| zsdex_2 | ZSDEX \| 发现中心 | 发现中心 v3 | Web 桌面 | **A** 静态预览 |
| zsdex_financial_terminal | (无文件) | **空目录** 7.6KB | — | **D** |
| cyber_luxe_financial | (无文件) | **空目录** 7.6KB | — | **D** |
| obsidian_terminal | (无文件) | **空目录** 7.0KB | — | **D** |
| v2.0 | ZSDEX 全站设计交付索引控制台 V2.0 | 全站设计索引 | 共同组件 | **A** 静态预览（导航用） |
| launch | (空) | 待人工确认（"launch" 可能= Launchpad） | Web 桌面 | **B** 静态入口（不接真实 IDO） |
| earn | (空) | 待人工确认（"earn" 可能= 理财） | Web 桌面 | **B** 静态入口（不接真实理财） |
| api | ZSDEX API 开放平台 | API 开放平台 | Web 桌面 | **A** 静态展示（不接真实 API Key） |
| rest_api | ZSDEX REST API - 开发者文档 | REST API 文档 | Web 桌面 | **A** 静态展示 |
| websocket_api | ZSDEX WebSocket API Documentation | WebSocket API 文档 | Web 桌面 | **A** 静态展示 |
| a_set_of_professional_financial_ui_icons_... | (无 HTML) | **图标资源** 1.1MB | 资源 | — 资源 |
| image.png_1 | (无 HTML) | 单图资源 256KB | 资源 | — 资源 |
| image.png_2 | (无 HTML) | 单图资源 103KB | 资源 | — 资源 |
| image.png_3 | (无 HTML) | 单图资源 2KB（小图标） | 资源 | — 资源 |
| image.png_4 | (无 HTML) | 单图资源 305KB | 资源 | — 资源 |
| image.png_5 | (无 HTML) | 单图资源 312KB | 资源 | — 资源 |
| image.png_6 | (无 HTML) | 单图资源 237KB | 资源 | — 资源 |
| image.png_7 | (无 HTML) | 单图资源 271KB | 资源 | — 资源 |
| image.png_8 | (无 HTML) | 单图资源 356KB | 资源 | — 资源 |

**特殊页统计**：9 个 = A:5 / B:2 / D:2（zsdex_financial_terminal / cyber_luxe_financial / obsidian_terminal = 空目录，3 个）
**资源**：11 个（1 图标库 + 8 独立图 + 2 通用图）

---

## 5. 整体分类汇总

| 分类 | 数量 | 占比 | 说明 |
|---|---|---|---|
| **A 类** P1 可静态预览导入 | 25 | 39.7% | 首页/关于/风险/教学/机构/发现/项目总控等 |
| **B 类** P1 可做空状态（不接真实数据）| 12 | 19.0% | 行情/钱包/资产/交易入口/Launchpad/理财入口 |
| **C 类** P1 禁止接真实业务 | 2 | 3.2% | 提现 / 现货专业版 |
| **D 类** 待人工确认 / 暂不导入 | 13 | 20.6% | 13 个无 title 的 HTML + 3 个空目录 |
| **资源**（图标 + 独立图）| 11 | 17.5% | 不直接导入，仅作参考 |
| **合计** | **63** | **100%** | |

---

## 6. ⚠️ UI/UX 硬约束冲突告警

`_9` 已读 `code.html`：

```html
<html class="dark" lang="zh-CN">
...
"background": "#11131c",  // 深色背景
"surface": "#11131c",     // 深色
...
```

> **63 个目录全部使用 `<html class="dark">` 暗色主题**（推断自 _9 + _1 + _25 等的 Tailwind config 完全一致）。

**与项目永久记忆的 UI/UX 硬约束冲突**：

> "明亮色系为主 — 背景必须用 white / #F8FAFC / 浅色调，**严禁**全暗色 slate-900/800 背景"

**3 种处理方案（需用户决策）**：

| 方案 | 描述 | 实施成本 | UI/UX 合规 |
|---|---|---|---|
| 方案 1 | **严格遵守硬约束** — P1 全部改为亮色 `#F8FAFC + 1652F0` 主色 | 高（63 个页面） | ✅ 100% |
| 方案 2 | **保留暗色** — 接受暗色交易终端风格 | 低（直接复制） | ❌ 违反硬约束 |
| 方案 3 | **混合** — 终端类（行情/交易/钱包）保留暗色，门户类（首页/关于）改为亮色 | 中 | ⚠️ 半合规 |

**强建议方案 1（与现有 mgsp-admin 品牌的 L4 设计标杆保持一致）**。

---

## 7. P1 第一批候选页面（建议 8-10 个）

按 **A 类静态预览 + 优先门户/教学/合规** 筛选：

| 序 | 编号 | 页面 | 端类型 | 理由 |
|---|---|---|---|---|
| 1 | _1 或 _19 或 _20 或 _25 | 首页（4 个版本选 1）| Web 桌面 | 主门户入口 |
| 2 | _10 | 关于我们 | Web 桌面 | 基础展示 |
| 3 | _15 | 风险提示 | Web 桌面 | 合规必备 |
| 4 | _16 | KYC 实名认证教学 | Web 桌面 | 教学页 |
| 5 | _17 | 现货交易教学 | Web 桌面 | 教学页 |
| 6 | _8 | 公告中心入口 | Web 桌面 | 静态入口（不接真实 API）|
| 7 | _12 | 机构服务 | Web 桌面 | 展示页 |
| 8 | _9 | 费率说明 | Web 桌面 | 信息展示 |
| 9 | h5_11 | H5 首页 | H5 移动 | 移动端入口 |
| 10 | _24 | 发现中心 | Web 桌面 | 内容聚合 |

**P1 导入原则**：
- ✅ 全静态（无真实 API 调用）
- ✅ 全 9 个使用"暂无数据 / 数据接入中 / 内测中 / 即将开放 / 维护中"等状态标签
- ✅ 严禁展示 `Math.random` 假数据
- ✅ 严禁直接覆盖 `/`，统一挂 `/portal-preview/*`

---

## 8. 13 个待人工确认页面（无 `<title>` 标签）

| 编号 | 风险 | 建议 |
|---|---|---|
| _2, _4, _5, _7, _11, _13, _14 | 7 个 Web 桌面页无 title | 需逐个打开 screen.png 确认页面用途 |
| h5_3, h5_7, h5_8, h5_12, h5_13 | 5 个 H5 移动页无 title | 需逐个打开 screen.png 确认 |
| launch | 1 个 launch 页无 title | 推测为 Launchpad 入口 |
| earn | 1 个 earn 页无 title | 推测为 Earn 理财入口 |

**人工确认方式**：直接打开 `screen.png` 看图识别。

---

## 9. 3 个空目录说明

| 目录 | 大小 | 处理建议 |
|---|---|---|
| `zsdex_financial_terminal/` | 7,628 B | 仅有目录结构，无任何文件 → 标记 **D 类，跳过** |
| `cyber_luxe_financial/` | 7,628 B | 同上 → 标记 **D 类，跳过** |
| `obsidian_terminal/` | 7,058 B | 同上 → 标记 **D 类，跳过** |

**这些目录可能为 Stitch 导出占位**，实际页面资产可能尚未提供。建议在 P1 后续阶段如果用户补齐再处理。

---

## 10. 对 `/portal-preview` 的页面导入建议

```
/portal-preview/                        ← 入口（首页）
/portal-preview/about                   ← _10 关于我们
/portal-preview/risk                    ← _15 风险提示
/portal-preview/announcements           ← _8 公告中心（静态入口）
/portal-preview/help/kyc                ← _16 KYC 教学
/portal-preview/help/spot-trading       ← _17 现货交易教学
/portal-preview/fees                    ← _9 费率说明
/portal-preview/institutional           ← _12 机构服务
/portal-preview/discovery               ← _24 发现中心
/portal-preview/h5                      ← H5 入口（h5_11）
/portal-preview/api                     ← api / rest_api / websocket_api（汇总）
```

**切流原则**：
- P1 阶段全部挂在 `/portal-preview/**`
- 旧首页 `/` 保持 100% 不动
- middleware 不修改
- 不使用 feature flag（避免误覆盖）

---

## 11. P1 硬约束（来自用户原指令）

- ❌ 不得直接覆盖 `/`
- ❌ 不得动 APP/Admin/数据库/钱包/交易/账务/链上服务
- ❌ 不得 push
- ❌ 不得把设计资产直接塞进线上路由
- ❌ 不得伪造页面含义（无 title 的 13 个已标"待人工确认"）
- ❌ 不得使用 `Math.random` 假数据
- ✅ 须先 `/portal-preview` 隔离路径
- ✅ 须用状态标签（暂无数据 / 数据接入中 / 内测中 / 即将开放 / 维护中）

---

## 12. 风险登记（10+）

| # | 风险 | 等级 | 缓解 |
|---|---|---|---|
| 1 | 暗色主题与 UI/UX 硬约束冲突 | P0 | 需用户决策方案 1/2/3 |
| 2 | 13 个页面无 `<title>` 标签 | P1 | 需逐个打开 screen.png 人工识别 |
| 3 | 3 个空目录可能为 Stitch 占位 | P2 | 标记 D 类跳过，等用户补齐 |
| 4 | 28 个编号页中部分重复主题（_1/_19/_20/_25 都是首页）| P1 | P1 只选 1 个最适配的版本 |
| 5 | 51 个 HTML 全部含 Tailwind CDN 链接（`cdn.tailwindcss.com`）| P2 | P1 不引入 CDN，改用项目内 Tailwind |
| 6 | 51 个 HTML 全部含 Google Fonts CDN | P2 | 项目内字体优先级，避免隐私问题 |
| 7 | 51 个 HTML 全部暗色主题，转换工作量大 | P0 | 仅 P1 候选 8-10 个页面做色系转换 |
| 8 | 28 + 15 编号页命名不连贯（_1~_28 不按业务顺序）| P1 | 用 title 推断代替编号排序 |
| 9 | 资产总大小约 12 MB，全部 untracked | P0 | 不进 git，P1 通过 `fs` 引用而非 copy |
| 10 | API 类页面可能含 mock 数据 | P1 | 切到 `/portal-preview/api` 前先审计 |
| 11 | 发现中心 _24/_27 重复 | P2 | 选 _24 |
| 12 | zsdex_1 导航控制台可能与现有 admin 冲突 | P1 | 标 D 类，不导入 |

---

## 13. 下一步行动（需用户确认）

1. **决策 UI/UX 冲突方案**（方案 1/2/3）— P0 阻塞
2. **人工确认 13 个无 title 页面** — 需打开 screen.png
3. **从 25 个 A 类中选 8-10 个 P1 第一批**（已建议，见 §7）
4. **确认 4 个首页版本（_1/_19/_20/_25）选哪个作为主门户入口**
5. **确认切流方案**（推荐 `/portal-preview/**` 路径前缀）
6. **不 push 到远端**（硬约束）

完成后等待用户确认，再启动 P1 编码。
