# 10 - 4 个首页版本结构对比

> **任务编号**：Q05-FrontPortal-Stitch-Asset-Inventory-And-Mapping · 子任务
> **生成时间**：2026-07-18（Asia/Shanghai）
> **决策依据**：P0 决策 #2 - 首页版本选型

---

## 0. 结论先行

| 版本 | Title | 风格 | 推荐度 | P1 决策 |
|---|---|---|---|---|
| **_1** | ZSDEX \| 中萨数字科技交易所 - 工业级交易平台 | 经典工业级 | ⭐⭐⭐⭐ | **采用为 P1 主基线** |
| _19 | ZSDEX \| 中萨数字科技交易所 - 工业级交易平台 | 与 _1 几乎相同 | ⭐⭐ | 候选备份 |
| _20 | ZSDEX \| 面向全球的专业级数字资产基础设施 | 绿色品牌 (#57dea3) | ⭐⭐⭐ | 模块参考 |
| _25 | ZSDEX \| 未来金融交易门户 | Cyber 紫蓝渐变 | ⭐⭐⭐ | 模块参考 |

> **P1 主门户采用 `_1`**，但 Hero 大字标题文案可参考 _20（"面向全球的专业级数字资产基础设施"）。
> _20 的绿色品牌色与项目主品牌 `#1652F0` 不符，**主色仍用 1652F0**。
> _25 的 Cyber 紫渐变与亮色门户定位冲突，**仅参考其 CFX/USDT 卡片视觉**。

---

## 1. 4 个首页结构对比表

| 维度 | **_1** | **_19** | **_20** | **_25** |
|---|---|---|---|---|
| **HTML 标题** | ZSDEX 中萨数字科技交易所 - 工业级交易平台 | 同 _1 | ZSDEX 面向全球的专业级数字资产基础设施 | ZSDEX 未来金融交易门户 |
| **HTML 大小** | ~33 KB（含 Tailwind config） | ~33 KB | ~33 KB | ~33 KB |
| **主品牌色** | `#1a5cff`（primary-container） | `#1a5cff` | `#57dea3`（绿色） | `#a078ff`（紫色） |
| **强调色** | `#44dbf4` 青 + `#ffb59c` 橙 | `#44dbf4` 青 | `#57dea3` 绿 | `#00f1fe` 青 + `#d0bcff` 紫 |
| **导航栏目** | 买币/行情/交易/钱包/树图公链/Launch/Earn | 首页/行情/交易/发现/资产/我的 | 交易/钱包/树图专区/AI智算/质押/公告 | 交易/钱包/树图专区/AI智算/质押/公告 |
| **Hero 标题** | "全球领先的**数字资产交易平台**" | "面向数字资产与**树图公链生态**的专业交易平台" | "面向全球的**专业级**数字资产基础设施" | "超越常规 / **金融进化**" |
| **Hero 数据 KPI** | 500,000+ 用户 / $12.5B+ 季度成交额 / < 1ms 撮合 | 500,000+ 用户 / $1.2B+ 24H 交易额 | 无明确 KPI | CFX/USDT 0.2482 实时卡片 |
| **核心市场卡** | 玻璃质感 + 实时行情（card） | APP 风格资产总览 + 4 快捷入口 | BTC/USDT 玻璃面板 + 直方图 | CFX/USDT 玻璃卡片 + 24H High |
| **二级板块** | Market Strip 滚动 + 业务矩阵 | 数字资产矩阵 + 树图生态 + 学院 | BTC 行情面板 + 树图公链 + 资产矩阵 | 树图公链生态 + AI 智算 + 产品矩阵 |
| **底部 CTA** | "立即开启交易" 输入框 | "立即注册" 输入框 | 立即注册 / 登录账户 | 立即注册 / 查看行情 |
| **特殊效果** | 滚动 Market Strip | 渐变 Hero + 资产卡 blur | Glass Panel + glow-hover | Cyber Glass + violet/teal 渐变 glow |
| **强调品牌叙事** | "工业级" | "Conflux 树图生态" | "全球专业级基础设施" | "未来金融 / Next-Gen" |

---

## 2. 各自可复用 / 不可采用部分

### 2.1 `_1`（P1 主基线）— **整体采用为骨架**

**采用 ✅**
- Header 结构（ZSDEX logo + 7 个一级导航 + 登录/注册）
- Hero Section 双栏布局（左文案 + 右市场卡）
- 500,000+ / $12.5B+ / <1ms 三个 KPI 数字
- Market Strip 滚动条
- 玻璃质感市场卡（glass-card）
- 6 个状态标签 className（status-open/beta/soon/maintenance）
- Inter + JetBrains Mono 字体组合
- Tailwind spacing 命名（container-margin/gutter/card-padding/row-height-standard）

**不采用 ❌**
- 暗色背景（#11131c）→ 改为 `#F8FAFC`
- 暗色字体色（#e1e1ef）→ 改为 `#0F172A` 文本色
- 假数据 `$12.5B+` → 改为 "数据接入中" 状态标签
- 实时行情 mock 数字 → 改为空状态

### 2.2 `_19`（与 _1 几乎相同）— **候选备份**

| 与 _1 的差异 | 说明 |
|---|---|
| APP 风格资产总览卡 | 4 快捷入口（充值/提现/划转/设置），更接近 APP 端 |
| 树图公链叙事强化 | 标题点出 "Conflux 生态" |
| 资产总额 62,604.50 USDT | 演示用，不采用 |

**P1 处理**：不直接采用，资产总览相关模块可作为 `/portal-preview/wallet` 后续阶段的参考。

### 2.3 `_20`（绿色品牌）— **模块级参考**

**可借鉴 ✅**
- Hero 标题文案更国际化（"面向全球的专业级数字资产基础设施"）
- BTC 行情面板布局（直方图可视化）
- 树图专区叙事

**不采用 ❌**
- 品牌主色 `#57dea3` 绿（与 `#1652F0` 蓝不符）
- Hanken Grotesk 字体（保留 Inter）
- 假 BTC 价格 `$62,604.50`（用空状态）

### 2.4 `_25`（Cyber 紫渐变）— **模块级参考**

**可借鉴 ✅**
- CFX/USDT 玻璃卡片视觉（透明 + blur）
- 24H High/Low/Volume 三栏布局
- Next-Gen 叙事风格

**不采用 ❌**
- 紫蓝渐变（#d0bcff + #00f1fe）与亮色门户定位冲突
- Hanken Grotesk 字体（保留 Inter）
- `cyber-button-primary` violet 阴影效果（改为 `BRAND.primary`）

---

## 3. 哪些模块可合并进 `_1`

| 模块 | 来源 | 是否合并到 P1 `_1` | 理由 |
|---|---|---|---|
| Header + 7 导航 | _1 | ✅ | 主基线已有 |
| Hero 双栏 + KPI | _1 | ✅ | 主基线已有 |
| 玻璃市场卡 | _1 | ✅ | 主基线已有 |
| **Hero 标题文案** | _20 | ✅ | "面向全球的专业级数字资产基础设施" 更国际化 |
| **24H High/Low 三栏** | _20 | ✅ | 替换 _1 的简化数据 |
| **CFX/USDT 玻璃卡片** | _25 | ✅ | 替换 _1 的核心市场卡，视觉更现代 |
| Market Strip 滚动 | _1 | ✅ | 主基线已有，改为静态"暂无数据"标签 |
| 状态标签系统 | _1 | ✅ | open/beta/soon/maintenance 保留 |
| 字体 | _1 | ✅ | Inter + JetBrains Mono |
| 暗色背景 | _1 | ❌ | 改为 `#F8FAFC` 亮色 |

---

## 4. 哪些模块暂不采用

| 模块 | 来自 | 理由 |
|---|---|---|
| 实时价格 `$62,604.50` | _20 / _25 | P1 不接真实行情，必须空状态 |
| `$1.2B+` 24H 交易额 | _19 | P1 不接真实数据 |
| `500,000+` 用户数 | _1 | 改为 "数据接入中" 标签 |
| `Mainnet` 标识 | _19 | 改为 "内测中" 标签 |
| APP 风格资产总览卡 | _19 | 留到 P2 钱包模块 |
| 树图公链 hex 渐变 hero | _25 | 与亮色门户冲突 |
| Hanken Grotesk 字体 | _20 / _25 | 项目使用 Inter 字体统一 |
| BTC 直方图 | _20 | 改为静态占位框 + "数据接入中" 标签 |
| 玻璃面板 violet 阴影 | _25 | 改为白底 + 浅蓝边框 |
| `cyber-button-primary` | _25 | 改为 `bg-[#1652F0]` 主色按钮 |

---

## 5. P1 `_1` 转化后的最终结构（亮色版）

```
[Header — PortalHeader]
  ZSDEX logo + 7 导航 (买币/行情/交易/钱包/树图公链/Launch/Earn) + 登录/注册

[Hero — PortalHero]
  左侧：标题 "面向全球的专业级数字资产基础设施" + 副标题 + 注册按钮 + 3 KPI (数据接入中)
  右侧：CFX/USDT 玻璃卡（24H High/Low/Volume 三栏 + "数据接入中" 标签）

[Market Preview — PortalMarketPreview]
  6 个热门币种卡片网格（每张标 "数据接入中" 状态标签 + 静态骨架）

[Product Matrix — PortalProductMatrix]
  8 个产品入口（现货/合约/策略/模拟/Launchpad/Earn/钱包/树图生态）

[Announcement Entry — PortalAnnouncementEntry]
  3 条最新公告（标题 + 日期 + "查看全部"链接到 /portal-preview/announcements）

[CTA Section]
  "立即注册" + "联系商务" 两个按钮

[Footer — PortalFooter]
  关于我们 / 公告 / 风险提示 / 帮助中心 / API 文档 / 隐私 / 条款 / 联系我们
```

**8 大区块 / 5 项以上交互（搜索/排序/过滤/Tab/快捷键）/ 1 处 Drawer / 1 处实时数据波动 / 3 处动画** — 满足 L4 工业级。

---

## 6. 风格转换规则（暗 → 亮）

| 暗色原值 | 亮色 P1 替换 | 用途 |
|---|---|---|
| `bg-[#11131c]` / `bg-bg-deep` | `bg-[#F8FAFC]` / `bg-white` | 背景 |
| `bg-[#1E2329]` / `bg-surface-card` | `bg-white` | 卡片背景 |
| `text-[#e1e1ef]` | `text-[#0F172A]` | 主文本 |
| `text-[#8d90a2]` / `text-outline` | `text-[#64748B]` | 副文本 |
| `border-[#2B3139]` / `border-border-low` | `border-[#E2E8F0]` | 边框 |
| `bg-primary-container` (`#1a5cff`) | `bg-[#1652F0]` | 主色按钮 |
| `text-primary` (`#b6c4ff`) | `text-[#1652F0]` | 主色文字 |
| `text-status-up` (`#00C07F`) | `text-[#059669]` | 上涨色 |
| `text-status-down` (`#FF4D4F`) | `text-[#E11D48]` | 下跌色 |
| `bg-status-beta` (`#722ED1`) | `bg-[#7C3AED]` | 内测色 |
| `text-status-warning` (`#FFA940`) | `text-[#D97706]` | 维护色 |
| `text-secondary` (`#44dbf4`) | `text-[#0891B2]` | 辅助色 |

> 完全继承 BRAND 配色系统（永久记忆 #2 UI/UX 硬约束）。

---

## 7. 4 个首页 PNG 截图位置（供人工视觉验收）

| 目录 | 文件 |
|---|---|
| `_1/screen.png` | ~258 KB 暗色工业级首页截图 |
| `_19/screen.png` | ~329 KB 暗色 APP 风格首页 |
| `_20/screen.png` | ~287 KB 暗色绿色品牌首页 |
| `_25/screen.png` | ~257 KB 暗色 Cyber 紫渐变首页 |

> 注：截图均为暗色，P1 转化为亮色后视觉差异巨大。建议同时提供 P1 亮色预览截图做对比。

---

## 8. P1 实施启动确认

按用户 04.md 决策：
- ✅ P1 主门户采用 `_1` 结构
- ✅ Hero 标题文案参考 `_20`（"面向全球的专业级数字资产基础设施"）
- ✅ CFX/USDT 卡片视觉参考 `_25`
- ✅ 24H High/Low 三栏参考 `_20`
- ✅ 主品牌色 `#1652F0`（不采用 `_20` 的绿色）
- ✅ 亮色主基调（不采用暗色）

**等待启动 P1 编码工作。**
