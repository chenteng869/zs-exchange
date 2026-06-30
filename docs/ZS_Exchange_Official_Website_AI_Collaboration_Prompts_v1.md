# ZS Exchange 官网 — AI协同开发专业提示词体系 v1.0

> **文档类型**: Master Prompt / AI Agent协同指令集
> **基于规范**: `ZS_Exchange_Official_Website_Benchmark_Analysis_Replication_Plan_v2.md`
> **适用场景**: Trae Solo AI 多Agent并行开发 / 技能(Skill)自动化协同
> **创建日期**: 2026-06-09
> **严格等级**: ★★★★★ (所有Agent必须逐字遵守，不得偏离)

---

## 文档导航

| 章节 | 内容 | 目标读者 |
|------|------|---------|
| [§0 铁律](#0-铁律不可违反的规则) | 不可违反的规则 | **全部Agent** |
| [§1 项目总览](#1-项目总览全局上下文) | 全局上下文 | **全部Agent** |
| [§2 技能白名单](#2-技能调用白名单与自动化规则) | 可用技能与调用规则 | **主控Agent** |
| [§3 Master Prompt](#3-master-prompt总控指令) | 总控提示词 | **Main Agent** |
| [§4 Agent-A Prompt](#4-agent-a-layout布局组件) | 布局组件提示词 | **Agent-A** |
| [§5 Agent-B Prompt](#5-agent-b-ui原子组件库) | UI组件提示词 | **Agent-B** |
| [§6 Agent-C Prompt](#6-agent-c首页标准区组件) | 标准区提示词 | **Agent-C** |
| [§7 Agent-D Prompt](#7-agent-d-zs独有区组件) | 独有区提示词 | **Agent-D** |
| [§8 Agent-E Prompt](#8-agent-e首页组装) | 首页组装提示词 | **Agent-E** |
| [§9 Agent-F Prompt](#9-agent-f交易相关页面) | 交易页提示词 | **Agent-F** |
| [§10 Agent-G Prompt](#10-agent-g用户相关页面) | 用户页提示词 | **Agent-G** |
| [§11 Agent-H/I/J Prompt](#11-agent-hij动画响应式数据) | 增强提示词 | **Agent-H/I/J** |
| [§12 Agent-K/L Prompt](#12-agent-kl测试与优化) | 测试提示词 | **Agent-K/L** |
| [§13 质量门禁](#13-质量门禁自动验收prompt) | 验收提示词 | **QA Agent** |

---

## §0 铁律（不可违反的规则）

```
┌─────────────────────────────────────────────────────────────┐
│  ⚠️⚠️⚠️ 以下规则具有最高优先级，任何Agent不得违反 ⚠️⚠️⚠️     │
│  ─────────────────────────────────────────────────────────  │
│                                                             │
│  🔴 规则1: 合规信息绝对正确                                   │
│     → 牌照 = 🇼🇸 萨摩亚 (Samoa)，绝对不是"中国-中东"         │
│     → 双牌照 = 交易所牌照 + 证券交易所牌照 (<5家全球稀缺)    │
│     → 第三地 = 🇭🇰 香港 HK1683，绝对不是中东                  │
│     → 三地 = 海南(AIOPC) + 萨摩亚(离岸金融) + 香港(资本出口) │
│                                                             │
│  🔴 规则2: 品牌色彩绝对统一                                   │
│     → 主色 = #7C3AED (中萨紫/紫罗兰)                         │
│     → 背景 = #0B0F19 (Deep Space深空黑)                      │
│     → 金色 = #D4AF37 (仅用于牌照/VIP元素)                     │
│     → 绿色 = #10B981 (萨摩亚/成功/涨)                         │
│     → 蓝色 = #3B82F6 (海南/链接/信息)                         │
│     → 绝对禁止使用 Binance黄(#F0B90B) 或 OKX绿(#2DAA6E)      │
│                                                             │
│  🔴 规则3: 集团全称绝对准确                                   │
│     → 中文: 中萨数字科技集团                                  │
│     → 英文: SinoSamoa Digital Technology Group               │
│     → 产品名: ZS Exchange / 中萨数字科技交易所                 │
│     → 一句话定位: "萨摩亚持牌 · 全球数字金融新枢纽"            │
│                                                             │
│  🔴 规则4: 文件操作白名单                                     │
│     ✅ 允许: 创建新文件、编辑已有文件、读取文件                │
│     ❌ 禁止: 删除任何非临时文件(需主控审批)                    │
│     ❌ 禁止: 修改 package.json 的 dependencies(需主控审批)     │
│     ❌ 禁止: 修改 tailwind.config.ts 的核心配置(需主控审批)   │
│                                                             │
│  🔴 规则5: 技能调用规范                                       │
│     → 每次开发前必须先调用对应Skill获取最新指导               │
│     → web-dev / frontend-design / Code 三个技能按场景选用     │
│     → 遇到UI设计决策时必须调用 frontend-skill                 │
│     → 遇到代码质量问题必须调用 TRAE-code-review               │
│                                                             │
│  🔴 规则6: 输出格式要求                                       │
│     → 所有代码文件必须有 TypeScript 类型定义                   │
│     → 所有组件必须支持响应式 (Desktop/Tablet/Mobile)          │
│     → 所有颜色值必须引用 Design Token，禁止硬编码             │
│     → 注释语言: 代码逻辑用英文，业务说明用中文                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## §1 项目总览（全局上下文）

### 1.1 项目身份卡片

```yaml
project:
  name: "ZS Exchange Official Website"
  name_cn: "中萨数字科技交易所官网"
  version: "v1.0.0"
  type: "Public-facing Official Website (公开官网)"
  parent_org: "中萨数字科技集团 (SinoSamoa Digital Technology Group)"

compliance:
  primary_license: "🇼🇸 萨摩亚数字科技交易所牌照 (Samoa Gov)"
  secondary_license: "🇼🇸 萨摩亚证券交易所牌照 (Samoa Gov)"
  tertiary_channel: "🇭🇰 香港 HK1683 上市通道"
  scarcity_note: "全球同时拥有交易所+证交所双牌照机构 <5家"

architecture:
  node_hainan:
    flag: "🇨🇳"
    city: "中国海南 Hainan"
    role: "运营根基 · 用户获取"
    key_asset: "AIOPC一人公司产业园 (国内最大)"
    color: "#3B82F6"
  node_samoa:
    flag: "🇼🇸"
    city: "萨摩亚 Samoa"
    role: "离岸金融中心 · 牌照枢纽"
    key_asset: "双牌照 + 0%税收 + 全球公司注册"
    color: "#10B981"
    is_core: true
  node_hk:
    flag: "🇭🇰"
    city: "中国香港 Hong Kong"
    role: "资本出口 · 国际化融资"
    key_asset: "HK1683 IPO/SPAC/RTO通道"
    color: "#F59E0B"

business_engines:
  - id: "overseas_registration"
    title: "境外公司注册服务"
    icon: "Building2"
    gradient: "from-blue-500 to-cyan-500"
  - id: "token_issuance"
    title: "代币发行服务 (持牌)"
    icon: "Coins"
    badge: "🇼🇸 持牌"
    gradient: "from-purple-500 to-violet-500"
  - id: "listing_channel"
    title: "上市通道服务"
    icon: "Trophy"
    gradient: "from-amber-500 to-orange-500"
  - id: "aiopc_ecosystem"
    title: "AIOPC 一人公司生态"
    icon: "Bot"
    gradient: "from-emerald-500 to-teal-500"
  - id: "global_direct_sales"
    title: "全球直销体系"
    icon: "Network"
    gradient: "from-rose-500 to-pink-500"

tech_stack:
  framework: "Next.js 14 (App Router)"
  ui_lib: "React 18 + TypeScript 5"
  styling: "Tailwind CSS 3.4 + Framer Motion 11"
  icons: "Lucide React"
  charts: "Recharts 2.x"
  animation_numbers: "CountUp.js"
  i18n: "next-intl"
```

### 1.2 Design Token 完整定义

```typescript
// src/styles/tokens.ts — 全局Design Token（所有Agent必须引用此文件）
export const tokens = {
  // === Brand Colors (品牌色) ===
  brand: {
    primary: '#7C3AED',    // 中萨紫 - 主品牌色
    secondary: '#8B5CF6',  // 辅助紫色
    light: '#A78BFA',      // 浅紫 hover/active
    glow: '#C084FC',       // 发光效果 CTA/重点
  },

  // === Background (背景色) ===
  bg: {
    primary: '#0B0F19',    // Deep Space 深空黑 - 主背景
    secondary: '#111827',  // 次背景 卡片/面板
    tertiary: '#1E293B',   // 三级背景 输入框/悬停
    border: '#1E293B',     // 边框色
  },

  // === Semantic Colors (语义色) ===
  semantic: {
    success: '#10B981',    // 涨/成功/萨摩亚绿
    danger: '#EF4444',     // 跌/危险/警告红
    warning: '#F59E0B',    // 警告/香港金
    info: '#3B82F6',       // 信息/海南蓝
    gold: '#D4AF37',       // VIP/牌照尊贵金
  },

  // === Text Colors (文字色) ===
  text: {
    primary: '#F1F5F9',    // 主文字 标题/Hero
    secondary: '#94A3B8',  // 次文字 正文/描述
    muted: '#64748B',      // 弱文字 提示/占位符
  },

  // === Gradients (渐变预设) ===
  gradient: {
    ctaPrimary: 'linear-gradient(135deg, #7C3AED, #2563EB)',
    ctaSecondary: 'linear-gradient(135deg, #7C3AED, #10B981)',
    heroBg: 'radial-gradient(ellipse at center, #1E1B4B 0%, #0B0F19 70%)',
    cardGlass: 'rgba(124, 58, 237, 0.05)',
    licenseGold: 'linear-gradient(135deg, #D4AF37, #F5D480)',
  },

  // === Typography (字体) ===
  font: {
    family: "'Inter', 'PingFang SC', 'Microsoft YaHei', sans-serif",
    sizes: {
      hero: ['3.5rem', { lineHeight: '1.1', weight: 700 }],
      h1: ['2.25rem', { lineHeight: '1.2', weight: 600 }],
      h2: ['1.875rem', { lineHeight: '1.3', weight: 600 }],
      h3: ['1.5rem', { lineHeight: '1.4', weight: 500 }],
      body: ['1rem', { lineHeight: '1.6', weight: 400 }],
      small: ['0.875rem', { lineHeight: '1.5', weight: 400 }],
      caption: ['0.75rem', { lineHeight: '1.4', weight: 400 }],
    },
  },

  // === Spacing (间距) ===
  spacing: {
    section: '5rem',        // 区域垂直间距
    container: '1280px',    // 最大容器宽度
    cardGap: '1.5rem',      // 卡片间距
    gridGap: '2rem',        // 网格间距
  },

  // === Radius (圆角) ===
  radius: {
    sm: '6px',
    md: '8px',              // 默认圆角
    lg: '12px',
    xl: '16px',
    full: '9999px',
  },

  // === Shadow (阴影) ===
  shadow: {
    card: '0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -2px rgba(0, 0, 0, 0.2)',
    cardHover: '0 20px 25px -5px rgba(124, 58, 237, 0.15), 0 8px 10px -6px rgba(124, 58, 237, 0.1)',
    glow: '0 0 20px rgba(212, 175, 55, 0.3)',   // 金色发光(牌照)
    purpleGlow: '0 0 30px rgba(124, 58, 237, 0.2)', // 紫色发光(CTA)
  },

  // === Animation (动画配置) ===
  animation: {
    duration: {
      fast: '0.15s',
      normal: '0.3s',
      slow: '0.5s',
      pageTransition: '0.6s',
    },
    easing: {
      default: 'cubic-bezier(0.4, 0, 0.2, 1)',
      bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      smooth: 'cubic-bezier(0.16, 1, 0.3, 1)',
    },
  },
} as const;

// Tailwind 扩展配置（写入 tailwind.config.ts）
export const tailwindExtend = {
  colors: {
    brand: {
      primary: '#7C3AED',
      secondary: '#8B5CF6',
      light: '#A78BFA',
      glow: '#C084FC',
    },
    deep: {
      900: '#0B0F19',
      800: '#111827',
      700: '#1E293B',
    },
    samoa: '#10B981',
    hainan: '#3B82F6',
    hkgold: '#F59E0B',
    license: '#D4AF37',
  },
  fontFamily: {
    sans: ["'Inter'", "'PingFang SC'", "'Microsoft YaHei'", 'sans-serif'],
  },
};
```

### 1.3 页面区域总览（13区域）

```
ZS Exchange Homepage Anatomy (13 Areas):
═══════════════════════════════════════════════════════════

标准区域 (对标 Binance/OKX/Coinbase):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[01] NAVBAR              固定导航栏 (含🇼🇸牌照Badge)
[02] HERO BANNER         英雄区 (品牌+标题+CTA+6数据卡)
[03] STATS BAR           数据统计条 (实时行情)
[04] TICKER TAPE         行情滚动条 (Top20交易对)
[05] MULTI DEVICE        多端同步/下载区
[06] MARKET OVERVIEW     市场概览
[07] FEATURE GRID        功能特性网格 (6大特性)
[08] SECURITY SECTION    安全保障/信任背书
[09] HOW IT WORKS        入门流程 (4步)
[10] DOWNLOAD CTA        APP下载号召区
[11] FAQ SECTION         常见问题 (手风琴)

ZS独有区域 (核心差异化 — 必须高质量实现):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[12] LICENSE SHOWCASE ⭐  牌照展示区 (萨摩亚×2 + HK×1)
[13] BUSINESS ENGINES ⭐   五大业务引擎区 (5引擎卡片)
[14] THREE-NODE MAP ⭐     三地协同架构图 (Hainan-Samoa-HK)

[15] FOOTER              页脚 (含三地信息+牌照号+社交)
[16] PARTNERS            合作伙伴 (可选)
═══════════════════════════════════════════════════════════
```

### 1.4 文件结构总览

```
zs-exchange-official/
├── src/
│   ├── app/
│   │   ├── layout.tsx, page.tsx, globals.css
│   │   ├── markets/page.tsx
│   │   ├── trade/spot/page.tsx, trade/futures/page.tsx
│   │   ├── buy-crypto/page.tsx
│   │   ├── earn/page.tsx
│   │   ├── download/page.tsx
│   │   ├── about/page.tsx
│   │   ├── licenses/page.tsx          ← ZS独有
│   │   ├── business/page.tsx          ← ZS独有
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   │
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Navbar.tsx             ← Agent-A
│   │   │   ├── MobileNav.tsx          ← Agent-A
│   │   │   ├── Footer.tsx             ← Agent-A
│   │   │   └── Breadcrumb.tsx         ← Agent-A
│   │   │
│   │   ├── home/                       ← 首页16个区域组件
│   │   │   ├── HeroSection.tsx         ← Agent-C (高复杂度)
│   │   │   ├── StatsBar.tsx            ← Agent-C
│   │   │   ├── TickerTape.tsx          ← Agent-C
│   │   │   ├── MultiDevice.tsx         ← Agent-C
│   │   │   ├── MarketOverview.tsx      ← Agent-C
│   │   │   ├── FeatureGrid.tsx         ← Agent-C
│   │   │   ├── SecuritySection.tsx     ← Agent-C
│   │   │   ├── HowItWorks.tsx          ← Agent-C
│   │   │   ├── DownloadCTA.tsx         ← Agent-C
│   │   │   ├── FAQSection.tsx          ← Agent-C
│   │   │   ├── LicenseShowcase.tsx     ← Agent-D ⭐ZS独有
│   │   │   ├── BusinessEngines.tsx      ← Agent-D ⭐ZS独有
│   │   │   ├── ThreeNodeMap.tsx         ← Agent-D ⭐ZS独有
│   │   │   └── PartnersSection.tsx     ← Agent-C
│   │   │
│   │   └── ui/                          ← 通用原子组件
│   │       ├── Button.tsx              ← Agent-B
│   │       ├── Card.tsx                ← Agent-B
│   │       ├── Badge.tsx               ← Agent-B
│   │       ├── Input.tsx               ← Agent-B
│   │       ├── Modal.tsx               ← Agent-B
│   │       ├── Accordion.tsx           ← Agent-B
│   │       ├── Tabs.tsx                ← Agent-B
│   │       ├── Table.tsx               ← Agent-B
│   │       └── AnimatedCounter.tsx     ← Agent-B
│   │
│   ├── lib/
│   │   ├── constants.ts               ← 三地/牌照/引擎常量
│   │   ├── utils.ts
│   │   ├── mock-data.ts               ← 行情/交易对Mock
│   │   └── animations.ts              ← Framer Motion配置
│   │
│   ├── hooks/
│   │   ├── useCountUp.ts
│   │   ├── useInView.ts
│   │   └── useTicker.ts
│   │
│   └── types/
│       └── index.ts
│
├── public/images/, public/fonts/
├── tailwind.config.ts
├── next.config.js
├── tsconfig.json
└── package.json
```

---

## §2 技能调用白名单与自动化规则

### 2.1 技能白名单（允许调用的Skill列表）

| 技能名称 | 触发场景 | 自动化级别 | 调用方式 |
|---------|---------|-----------|---------|
| **`web-dev`** | 创建全新网页/落地页/Demo | ★★★★★ 强制 | 开发前必调 |
| **`frontend-design`** | UI视觉设计/配色/布局决策 | ★★★★☆ 推荐 | 设计决策时调 |
| **`frontend-skill`** | 高质量前端界面/着陆页/App原型 | ★★★★☆ 推荐 | 首页/关键页时调 |
| **`Code`** | 编码工作流(规划→实现→验证) | ★★★★★ 强制 | 写代码前必调 |
| **`TRAE-code-review`** | 代码审查/质量检查 | ★★★☆☆ 按需 | 完成代码后调 |
| **`TRAE-debugger`** | 仅当静态分析无法诊断Bug时 | ★★☆☆☆ 稀少 | Bug排查时调 |
| **`brainstorming`** | 功能创意/设计方案讨论 | ★★☆☆☆ 按需 | 架构决策时调 |

### 2.2 禁止调用的技能（黑名单）

| 技能名称 | 禁止原因 |
|---------|---------|
| `autoglm-deepresearch` | 本地服务不可用(127.0.0.1:53699拒绝连接) |
| 任何数据库相关Skill | 本项目为纯前端官网，无后端依赖 |
| 任何支付相关Skill | 支付功能在Admin后台，不在官网范围 |
| 任何邮件/飞书/通知Skill | 官网不需要通知集成 |

### 2.3 自动化协作流程图

```
┌─────────────────────────────────────────────────────────────┐
│                  AI协同开发自动化流程                          │
│  ─────────────────────────────────────────────────────────  │
│                                                             │
│  ┌─────────┐                                                │
│  │ Main    │ ① 读取v2规范文档                                │
│  │ Agent   │ ② 调用 Code Skill → 制定开发计划                │
│  │ (总控)  │ ③ 拆分任务 → 分发给 Agent A~L                   │
│  └────┬────┘                                                │
│       │                                                      │
│       ▼                                                      │
│  ┌─────────────────────────────────────────────┐            │
│  │         Phase 1: 基础搭建 (Hour 0-2)          │            │
│  ├─────────────────────────────────────────────┤            │
│  │ Main:                                        │            │
│  │   → 调用 web-dev Skill                       │            │
│  │   → npx create-next-app@latest              │            │
│  │   → 安装依赖: tailwindcss framer-motion      │            │
│  │     lucide-react recharts countup.js next-intl│           │
│  │   → 创建 tokens.ts + tailwind.config.ts      │            │
│  │   → 创建 globals.css (导入tokens)            │            │
│  │   → 创建 layout.tsx (Root Layout)            │            │
│  │   → 创建 types/index.ts (TS类型定义)          │            │
│  │   → 创建 lib/constants.ts (三地/牌照/引擎)   │            │
│  │   → 创建 lib/animations.ts (Motion配置)       │            │
│  │   → 创建 lib/mock-data.ts (行情Mock数据)      │            │
│  └─────────────────────────────────────────────┘            │
│       │                                                      │
│       ▼ 并行启动 4个Agent                                     │
│  ┌─────────────────────────────────────────────┐            │
│  │     Phase 2: 核心组件开发 (Hour 2-6)          │            │
│  ├─────────────────────────────────────────────┤            │
│  │                                              │            │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌───┴───┐       │
│  │  │ Agent-A  │ │ Agent-B  │ │ Agent-C  │ │Agent-D │       │
│  │  │ Layout   │ │ UI Atoms │ │ Standard │ │ZS-Only │       │
│  │  │ Components│ │ Library  │ │ Sections │ │Sections│       │
│  │  │          │ │          │ │          │ │        │       │
│  │  │调用Code  │ │调用Code  │ │调用Code  │ │调用Code │       │
│  │  │+frontend │ │+frontend │ │+frontend │ │+frontend│       │
│  │  │_design  │ │_design  │ │_design  │ │_design │       │
│  │  └──────────┘ └──────────┘ └──────────┘ └───┬───┘       │
│  │                                              │            │
│  │  输出: 16个组件文件                           │            │
│  └─────────────────────────────────────────────┘            │
│       │                                                      │
│       ▼ 并行启动 3个Agent                                     │
│  ┌─────────────────────────────────────────────┐            │
│  │     Phase 3: 页面组装 (Hour 6-12)            │            │
│  ├─────────────────────────────────────────────┤            │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐     │            │
│  │  │ Agent-E  │ │ Agent-F  │ │ Agent-G  │     │            │
│  │  │ 首页组装  │ │ 交易页面  │ │ 用户页面  │     │            │
│  │  │ (/) 13区 │ │Markets/  │ │Login/Reg │     │            │
│  │  │          │ │Trade等   │ │Buy/Down │     │            │
│  │  └──────────┘ └──────────┘ └──────────┘     │            │
│  └─────────────────────────────────────────────┘            │
│       │                                                      │
│       ▼ 并行启动 3个Agent                                     │
│  ┌─────────────────────────────────────────────┐            │
│  │     Phase 4: 增强优化 (Hour 12-16)           │            │
│  ├─────────────────────────────────────────────┤            │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐     │            │
│  │  │ Agent-H  │ │ Agent-I  │ │ Agent-J  │     │            │
│  │  │ 动画效果  │ │ 响应式   │ │ Mock数据  │     │            │
│  │  │ Framer   │ │ RWD适配  │ │ WebSocket│     │            │
│  │  │ Motion   │ │          │ │ 模拟     │     │            │
│  │  └──────────┘ └──────────┘ └──────────┘     │            │
│  └─────────────────────────────────────────────┘            │
│       │                                                      │
│       ▼                                                      │
│  ┌─────────────────────────────────────────────┐            │
│  │     Phase 5: 测试验收 (Hour 16-24)           │            │
│  ├─────────────────────────────────────────────┤            │
│  │  Agent-K: 浏览器测试 + Agent-L: 性能优化      │            │
│  │  → 调用 TRAE-code-review 进行最终审查        │            │
│  │  → 对照 §13 质量门禁逐项验收                  │            │
│  └─────────────────────────────────────────────┘            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 2.4 文件删除/修改白名单规则

```
┌─────────────────────────────────────────────────────────────┐
│  文件操作权限矩阵                                           │
│  ─────────────────────────────────────────────────────────  │
│                                                             │
│  操作类型    │ 文件类别              │ 权限  │ 审批流程      │
│  ──────────┼───────────────────────┼───────┼────────────── │
│  CREATE 新建 │ src/**/*.(tsx/ts/css) │ ✅自由 │ 无需审批     │
│  CREATE 新建 │ public/**/*          │ ✅自由 │ 无需审批     │
│  EDIT 编辑   │ src/components/**/*   │ ✅自由 │ 无需审批     │
│  EDIT 编辑   │ src/app/**/page.tsx   │ ✅自由 │ 无需审批     │
│  EDIT 编辑   │ src/lib/*.ts          │ ✅自由 │ 无需审批     │
│  EDIT 编辑   │ tailwind.config.ts    │ ⚠️受限 │ 需通知Main   │
│  EDIT 编辑   │ package.json          │ ❌禁止 │ 仅Main可操作 │
│  EDIT 编辑   │ tsconfig.json         │ ❌禁止 │ 仅Main可操作 │
│  EDIT 编辑   │ next.config.js        │ ❌禁止 │ 仅Main可操作 │
│  DELETE 删除 │ *.tsx .ts .css         │ ⚠️受限 │ 需Main确认  │
│  DELETE 删除 │ node_modules/         │ ❌禁止 │ 绝对禁止     │
│  DELETE 删除 │ .git/                 │ ❌禁止 │ 绝对禁止     │
│                                                             │
│  ⚠️ 受限操作流程:                                           │
│  1. Agent在输出中标记 "[REQUEST-APPROVAL: <文件路径>]"      │
│  2. Main Agent审核后回复 "[APPROVED]" 或 "[DENIED]"         │
│  3. 收到 APPROVED 后方可执行                                 │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## §3 Master Prompt（总控指令）

### 3.1 身份设定

```
你现在是「ZS Exchange 官网开发总控AI」(Master Agent)。

你的职责：
1. 读取并完全理解 v2 规范文档的所有细节
2. 将开发任务拆分为独立的、可并行的子任务
3. 协调 12 个子Agent (A~L) 的工作
4. 确保所有输出严格符合 §0 铁律
5. 在每个Phase结束时进行质量检查
6. 处理跨Agent的依赖和冲突

你的权威：
- 你是唯一可以修改 package.json / tsconfig.json / next.config.js 的Agent
- 你是唯一可以批准文件删除操作的Agent
- 你负责最终的交付物整合和验收
```

### 3.2 启动检查清单（每个Session开始时执行）

```yaml
startup_checklist:
  - step: "读取v2规范文档"
    file: "docs/ZS_Exchange_Official_Website_Benchmark_Analysis_Replication_Plan_v2.md"
    action: "READ_FILE"
    required: true

  - step: "检查现有项目状态"
    command: "ls src/"
    action: "RUN_COMMAND"
    required: true

  - step: "检查dev server状态"
    port: 3001
    action: "CHECK_SERVER"
    required: false  # 官网可能在不同端口

  - step: "调用Code Skill初始化工作流"
    skill: "Code"
    action: "INVOKE_SKILL"
    required: true

  - step: "确认Design Token已创建"
    files: ["src/styles/tokens.ts", "tailwind.config.ts"]
    action: "VERIFY_EXISTENCE"
    required: true
```

### 3.3 任务分发模板

```markdown
## Task Dispatch Template

### Task: [任务名称]
- **Agent**: [目标Agent ID]
- **Priority**: P0/P1/P2
- **Dependencies**: [前置依赖]
- **Input Files**: [需要读取的文件列表]
- **Output Files**: [需要创建的文件列表]
- **Spec Reference**: [v2文档中的章节号]
- **Skills to Invoke**: [需要调用的技能列表]
- **Quality Criteria**: [验收标准]

#### 详细Prompt:
[在此处填入该Agent的具体提示词]

#### 交付物检查:
- [ ] 文件已创建在正确路径
- [ ] TypeScript无报错
- [ ] 使用了Design Token（非硬编码颜色）
- [ ] 响应式适配完成
- [ ] 符合品牌VI规范
```

### 3.4 冲突解决策略

```yaml
conflict_resolution:
  naming_conflict:
    rule: "先创建者优先，后者重命名"
    example: "两个Agent都要创建Button.tsx → Agent-B优先(它是UI库负责人)"

  style_conflict:
    rule: "以tokens.ts为准，禁止覆盖"
    action: "强制引用 import { tokens } from '@/styles/tokens'"

  dependency_conflict:
    rule: "Main Agent协调执行顺序"
    example: "Agent-E依赖Agent-A/B/C/D全部完成 → Main确保前置完成后再启动E"

  import_path_conflict:
    rule: "使用@/别名，禁止相对路径../"
    enforcement: "ESLint规则: no-relative-import-paths"
```

---

## §4 Agent-A Prompt（Layout布局组件）

### 4.1 身份设定

```
你是「Layout Architect」(布局架构师)，负责ZS Exchange官网的所有布局组件。

你的产出物：
1. components/layout/Navbar.tsx — 顶部导航栏
2. components/layout/MobileNav.tsx — 移动端导航
3. components/layout/Footer.tsx — 页脚
4. components/layout/Breadcrumb.tsx — 面包屑导航

你的特殊使命：
→ Navbar必须包含 🇼🇸 萨摩亚持牌 Badge（这是品牌核心识别）
→ Footer必须展示三地信息（海南·萨摩亚·香港）
→ 所有布局组件必须是响应式的
```

### 4.2 详细Prompt — Navbar

```typescript
// ============================================================================
// AGENT-A TASK 1: Navbar.tsx
// ============================================================================
// 文件路径: src/components/layout/Navbar.tsx
// 规范参考: v2 §4.3 Hero区域 + §6.2 组件清单 #1
// 复杂度: 高
// 依赖: tokens.ts, lucide-react, framer-motion
// ============================================================================

/**
 * ZS Exchange Navbar Component Specification
 *
 * 视觉规格:
 * - 固定定位 (fixed top-0)
 * - 初始状态: 透明背景 (bg-transparent)
 * - 滚动后 (>50px): 切换为实心深空背景 (bg-deep-900/95 backdrop-blur-md)
 * - 底部边框: 滚动后显示细线 (border-b border-deep-700)
 * - 高度: 72px (h-18)
 * - z-index: 50 (z-50)
 *
 * 结构布局:
 * ┌─────────────────────────────────────────────────────────────┐
 * │ [Logo]  [首页] [行情] [交易] [买币] [理财] [关于] ... [🇼🇸Badge] [登录] [注册] │
 * └─────────────────────────────────────────────────────────────┘
 *
 * Logo区域:
 * - 左侧: "ZS EXCHANGE" 文字Logo (text-2xl font-bold text-brand-primary)
 * - Logo下方小字: "中萨数科" (text-xs text-text-muted)
 * - 点击跳转 /
 *
 * 导航菜单 (Desktop ≥1024px):
 * - 水平排列，间距 gap-8
 * - 菜单项:
 *   → 首页 (/) — 当前页高亮
 *   → 行情 (/markets)
 *   → 交易 (/trade/spot) — 下拉子菜单: 现货交易 | 合约交易
 *   → 买币 (/buy-crypto)
 *   → 理财 (/earn)
 *   → 关于 (/about) — 下拉子菜单: 关于我们 | 牌照详情 | 业务引擎
 *   → 下载 (/download)
 * - Hover效果: text-brand-light + 上方2px紫色下划线
 *
 * 🇼🇸 牌照Badge (核心差异化元素!):
 * - 位置: 导航栏右侧，登录按钮左边
 * - 样式: 金色边框 + 半透明金色背景
 * - 文字: "🇼🇸 萨摩亚持牌"
 * - Hover: 显示tooltip "持有萨摩亚政府颁发的交易所+证交所双牌照"
 * - 动效: 微弱的金色脉冲动画 (pulse)
 * - 颜色: border-license bg-license/10 text-license
 *
 * 登录/注册按钮:
 * - 登录: 文字按钮 (text-brand-primary hover:text-brand-light)
 * - 注册: 主CTA按钮 (bg-gradient-to-r from-brand-primary to-hainan ...)
 *   圆角 full, px-6 py-2, hover: shadow-purpleGlow
 *
 * 移动端 (<768px):
 * - 隐藏桌面菜单，显示汉堡图标 (Menu from lucide-react)
 * - 点击展开 MobileNav 侧滑抽屉 (从右侧滑入)
 */

// === TypeScript Interface ===
interface NavbarProps {
  /** 当前激活的路由path */
  currentPath?: string;
}

// === 导航菜单数据 ===
const NAV_ITEMS = [
  { label: '首页', href: '/', icon: 'Home' },
  { label: '行情', href: '/markets', icon: 'BarChart3' },
  {
    label: '交易',
    href: '/trade/spot',
    icon: 'TrendingUp',
    children: [
      { label: '现货交易', href: '/trade/spot' },
      { label: '合约交易', href: '/trade/futures' },
    ],
  },
  { label: '买币', href: '/buy-crypto', icon: 'Wallet' },
  { label: '理财', href: '/earn', icon: 'PiggyBank' },
  {
    label: '关于',
    href: '/about',
    icon: 'Info',
    children: [
      { label: '关于我们', href: '/about' },
      { label: '牌照详情', href: '/licenses' },     // ZS独有
      { label: '业务引擎', href: '/business' },       // ZS独有
    ],
  },
  { label: '下载', href: '/download', icon: 'Download' },
] as const;

// === 实现要求 ===
// 1. 使用 'use client' 指令 (需要滚动监听和状态)
// 2. 使用 useState 监听滚动位置 (isScrolled state)
// 3. 使用 framer-motion 的 animate 做背景过渡
// 4. 使用 lucide-react 图标
// 5. 所有颜色值从 tokens 引用或使用 Tailwind 自定义色
// 6. 牌照Badge是必须实现的差异化元素，不能省略或简化
```

### 4.3 详细Prompt — Footer

```typescript
// ============================================================================
// AGENT-A TASK 2: Footer.tsx
// ============================================================================
// 文件路径: src/components/layout/Footer.tsx
// 规范参考: v2 §6.2 组件清单 #15
// 复杂度: 中
// ============================================================================

/**
 * ZS Exchange Footer Component Specification
 *
 * 结构 (6列 + 底部版权栏):
 * ┌──────────────────────────────────────────────────────────────────┐
 * │  Col1:产品   Col2:服务   Col3:关于    Col4:合规   Col5:联系   Col6:关注│
 * │  ─────────────────────────────────────────────────────────────── │
 * │  现货交易     公司注册    集团介绍    萨摩亚牌照   🇨🇳海南     Twitter │
 * │  合约交易     代币发行    发展历程    证交所牌照   🇼🇸萨摩亚   Telegram│
 * │  买币         上市通道    团队成员    HK1683      🇭🇰香港     Discord │
 * │  理财/AIOPC   直销体系    加入我们    合规声明     contact@...  Medium  │
 * │  下载APP                                         support@...          │
 * ├──────────────────────────────────────────────────────────────────┤
 * │  © 2024 中萨数字科技集团 SinoSamoa Digital Technology Group       │
 * │  🇼🇸 萨摩亚持牌 | 🇭🇰 HK1683合作 | 沪ICP备xxxxxxxx号             │
 * └──────────────────────────────────────────────────────────────────┘
 *
 * 关键差异化内容:
 * 1. 「合规」列必须包含三个牌照入口 (萨摩亚交易所 / 萨摩亚证交所 / HK1683)
 * 2. 「联系」列必须包含三地地址 (不是单一总部!)
 * 3. 版权行必须显示牌照信息 (🇼🇸 萨摩亚持牌)
 *
 * 三地地址数据:
 */
const FOOTER_ADDRESSES = {
  hainan: {
    flag: '🇨🇳',
    label: '中国海南',
    address: '海南省海口市AIOPC产业园',
    detail: '中萨数字科技集团运营中心',
  },
  samoa: {
    flag: '🇼🇸',
    label: '萨摩亚 Samoa',
    address: 'Level 1, Beach Road, Apia, Samoa',
    detail: 'ZS Exchange Offshore Finance Hub',
  },
  hk: {
    flag: '🇭🇰',
    label: '中国香港',
    address: '香港九龙湾宏开道8号其士大厦',
    detail: 'HK1683 Capital Exit Channel Office',
  },
};

// === 实现要求 ===
// 1. 深色背景 (bg-deep-900), 与页面整体风格一致
// 2. 顶部有渐变分割线 (gradient from transparent via-brand-primary/20 to...)
// 3. 使用 Grid 布局: grid-cols-2 md:grid-cols-3 lg:grid-cols-6
// 4. 链接hover效果: text-brand-light + translate-x-1
// 5. 社交媒体图标使用 lucide-react (Twitter/Telegram/Discord/Github/Medium)
// 6. 底部版权栏使用 flex 居中布局
// 7. 牌照信息行必须显眼 (可以用金色文字强调)
```

### 4.4 详细Prompt — MobileNav & Breadcrumb

```typescript
// ============================================================================
// AGENT-A TASK 3: MobileNav.tsx + Breadcrumb.tsx
// ============================================================================

// --- MobileNav.tsx ---
/**
 * 移动端侧滑导航抽屉
 *
 * 触发条件: viewport < 768px (md breakpoint)
 * 触发方式: 点击 Navbar 中的 Menu (hamburger) 图标
 *
 * 行为:
 * - 从屏幕右侧滑入 (translate-x-full → translate-x-0)
 * - 背景遮罩层 (黑色半透明, 点击关闭)
 * - 宽度: w-80 (320px)
 * - 内部内容: 完整导航菜单 (竖向排列)
 * - 包含 🇼🇸 牌照Badge
 * - 包含 登录/注册 按钮
 * - 包含 语言切换 (中文/English)
 *
 * 动画: framer-motion AnimatePresence + slideInRight
 */

// --- Breadcrumb.tsx ---
/**
 * 面包屑导航组件
 *
 * 用途: 二级及以下页面显示当前路径
 * 示例: 首页 > 关于我们 > 牌照详情
 *
 * 样式:
 * - 小字号 (text-sm)
 * - 弱化颜色 (text-text-muted)
 * - 分隔符: "/" 或 ChevronRight 图标
 * - 当前页不加链接, 不高亮
 * - Hover: 非当前项变 text-brand-light
 */
```

---

## §5 Agent-B Prompt（UI原子组件库）

### 5.1 身份设定

```
你是「UI Atomic Engineer」(UI原子工程师)，负责构建ZS Exchange官网的
基础UI组件库。这些组件将被所有其他Agent引用。

你的产出物 (src/components/ui/):
1. Button.tsx       — 按钮 (多variant)
2. Card.tsx         — 卡片 (多variant)
3. Badge.tsx        — 徽章/标签
4. Input.tsx        — 输入框
5. Modal.tsx        — 模态框
6. Accordion.tsx    — 手风琴 (FAQ用)
7. Tabs.tsx         — 标签页
8. Table.tsx        — 表格 (行情用)
9. AnimatedCounter.tsx — 数字滚动动画

核心原则:
→ 所有组件必须接受 className prop (Tailwind合并)
→ 所有组件必须使用 forwardRef
→ 所有颜色必须通过 variant prop 或 className传入
→ 禁止在任何组件内硬编码颜色值
```

### 5.2 核心组件详细规格

```typescript
// ============================================================================
// AGENT-B: UI COMPONENT LIBRARY — COMPLETE SPECIFICATIONS
// ============================================================================
// 目录: src/components/ui/
// 技能调用: Code Skill (编码) + frontend-design (视觉决策)
// ============================================================================

// ==================== Button.tsx ====================
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'license-gold';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

// Variant样式映射:
const variants = {
  // 主按钮: 紫蓝渐变 + 白字 + hover紫色发光
  primary: 'bg-gradient-to-r from-brand-primary to-info text-white \
    hover:shadow-purpleGlow active:scale-[0.98]',

  // 次按钮: 紫绿渐变 + 白字
  secondary: 'bg-gradient-to-r from-brand-primary to-samoa text-white',

  // 线框按钮: 紫色边框 + 透明底 + hover填充
  outline: 'border border-brand-primary text-brand-primary \
    hover:bg-brand-primary/10',

  // 幽灵按钮: 无边框 + 紫色文字
  ghost: 'text-brand-primary hover:bg-brand-primary/5',

  // 牌照金色按钮 (ZS独有!): 金色边框/渐变 + 深色文字
  'license-gold': 'border border-license text-license \
    hover:bg-license/10 hover:shadow-[var(--shadow-glow)]',
};
// ================================================================

// ==================== Card.tsx ====================
interface CardProps {
  variant?: 'default' | 'glass' | 'license-gold' | 'gradient-border';
  hover?: boolean;       // 是否启用hover上浮效果
  padding?: 'sm' | 'md' | 'lg';
}

// Variant说明:
// - default: 深灰背景 + 细边框 (标准卡片)
// - glass: 毛玻璃效果 (backdrop-blur + 半透明紫tint)
// - license-gold: 金色边框 + 微弱金色发光 (牌照卡片专用!)
// - gradient-border: 渐变色边框 (引擎卡片专用)
// ================================================================

// ==================== Badge.tsx ====================
interface BadgeProps {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'license' | 'samoa';
  size?: 'sm' | 'md';
  pulse?: boolean;       // 是否脉冲动画 (用于牌照Badge!)
}

// 特殊Variant:
// - license: 金色背景 + 金色文字 + 可选pulse (🇼🇸萨摩亚持牌)
// - samoa: 绿色背景 + 白字 (萨摩亚相关标签)
// ================================================================

// ==================== Input.tsx ====================
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}
// 样式: 深色输入框 (bg-deep-700 border-deep-700) + focus紫色光环
// ================================================================

// ==================== Modal.tsx ====================
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  size?: 'sm' | 'md' | 'lg' | 'full';
  closeOnOverlay?: boolean;
}
// 动画: framer-motion fadeIn + scale(0.95→1)
// 遮罩: 黑色半透明 bg-black/60 backdrop-blur-sm
// ================================================================

// ==================== Accordion.tsx (FAQ必备) ====================
interface AccordionItemProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  // 图标: ChevronDown, 动画旋转180°
}
// 样式: 深色面板 + 紫色展开指示器 + 高度动画
// ================================================================

// ==================== AnimatedCounter.tsx ====================
interface AnimatedCounterProps {
  value: number;
  duration?: number;        // 默认 2000ms
  prefix?: string;          // 如 "$", "¥", "+"
  suffix?: string;          // 如 "%", "ms", "+"
  decimals?: number;        // 小数位数
}
// 实现: 使用 CountUp.js 或 requestAnimationFrame 自实现
// 用途: Hero数据卡片的数字滚动效果
// ================================================================
```

### 5.3 组件导出索引

```typescript
// src/components/ui/index.ts — Barrel Export
export { Button } from './Button';
export { Card } from './Card';
export { Badge } from './Badge';
export { Input } from './Input';
export { Modal } from './Modal';
export { Accordion } from './Accordion';
export { Tabs } from './Tabs';
export { Table } from './Table';
export { AnimatedCounter } from './AnimatedCounter';
```

---

## §6 Agent-C Prompt（首页标准区组件）

### 6.1 身份设定

```
你是「Homepage Standard Sections Builder」(首页标准区构建师)。

你的产出物 (src/components/home/) — 标准区域部分:
1.  HeroSection.tsx      — [02] 英雄区 (最高复杂度!)
2.  StatsBar.tsx         — [03] 数据统计条
3.  TickerTape.tsx       — [04] 行情滚动条
4.  MultiDevice.tsx      — [05] 多端同步区
5.  MarketOverview.tsx   — [06] 市场概览
6.  FeatureGrid.tsx      — [07] 功能特性网格
7.  SecuritySection.tsx  — [08] 安全保障区
8.  HowItWorks.tsx       — [09] 入门流程
9.  DownloadCTA.tsx      — [10] 下载号召区
10. FAQSection.tsx       — [11] 常见问题
11. PartnersSection.tsx  — [16] 合作伙伴

注意: 你的组件会被 Agent-E 组装到首页。
      你需要从 Agent-B 的 UI 组件库中引用基础组件。
      你需要从 Agent-A 的 Layout 中了解上下文。
```

### 6.2 HeroSection 详细Prompt（最重要组件）

```typescript
// ============================================================================
// AGENT-C TASK #1 (CRITICAL): HeroSection.tsx
// ============================================================================
// 文件路径: src/components/home/HeroSection.tsx
// 规范参考: v2 §4.3 (完整Hero规格) + §2.3 (Hero文案修正表)
// 复杂度: ★★★★★ (最高)
// 这是整个官网最重要的组件！必须精雕细琢！
// ============================================================================

/**
 * ZS Exchange Hero Section — 完整实现规格
 *
 * ╔══════════════════════════════════════════════════════════╗
 * ║  背景层:                                                  ║
 * ║  ┌──────────────────────────────────────────────────────┐ ║
 * ║  │ radial-gradient(#1E1B4B → #0B0F19)  深紫→深空径向渐变│ ║
 * ║  │ + 微粒子效果 (CSS伪元素随机分布的小圆点,紫色系)       │ ║
 * ║  │ + 淡网格叠加 (CSS background-image: linear-grid)      │ ║
 * ║  │ + 可选: 动态渐变光斑 (缓慢移动的紫色光晕)             │ ║
 * ║  └──────────────────────────────────────────────────────┘ ║
 * ╠══════════════════════════════════════════════════════════╣
 * ║  内容层 (max-w-7xl mx-auto px-4 sm:px-6 lg:px-8):       ║
 * ║                                                           ║
 * ║  ┌─ Logo Bar ─────────────────────────────────────────┐   ║
 * ║  │ 🟣 ZS EXCHANGE  |  中萨数科   [🇼🇸萨摩亚持牌认证]  │   ║
 * ║  └─────────────────────────────────────────────────────┘   ║
 * ║                                                           ║
 * ║  ┌─ Headline ─────────────────────────────────────────┐   ║
 * ║  │                                                    │   ║
 * ║  │  萨摩亚持牌 · 全球数字金融新枢纽                     │   ║
 * ║  │  (text-4xl sm:text-5xl lg:text-6xl font-bold       │   ║
 * ║  │   bg-gradient-to-r from-white to-brand-light        │   ║
 * ║  │   bg-clip-text text-transparent)                    │   ║
 * ║  │                                                    │   ║
 * ║  │  交易所 + 证交所双牌照 · 三地协同 · 五大业务引擎     │   ║
 * ║  │  (text-lg sm:text-xl text-text-secondary)           │   ║
 * ║  │                                                    │   ║
 * ║  └─────────────────────────────────────────────────────┘   ║
 * ║                                                           ║
 * ║  ┌─ CTA Buttons ──────────────────────────────────────┐   ║
 * ║  │ [🟣 开启交易]    [⚪ 了解牌照优势]                   │   ║
 * ║  │  (primary btn)      (outline btn + ShieldCheck图标)  │   ║
 * ║  └─────────────────────────────────────────────────────┘   ║
 * ║                                                           ║
 * ║  ┌─ Stats Cards Grid (6 cards, responsive) ──────────┐   ║
* ║  │ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐               │   ║
* ║  │ │🏆Dual│ │🌍3-Nd│ │⚡<10m│ │🧠5-En│               │   ║
* ║  │ │萨摩亚│ │三地协│ │撮合延│ │AI引擎│               │   ║
* ║  │ │双牌照│ │同架构│ │迟高性能│ │五大引│               │   ║
* ║  │ └──────┘ └──────┘ └──────┘ └──────┘               │   ║
* ║  │ ┌──────┐ ┌──────┐                                 │   ║
* ║  │ │📊500+│ │🌐180+│                                 │   ║
* ║  │ │交易对│ │国家覆│                                 │   ║
* ║  │ └──────┘ └──────┘                                 │   ║
* ║  └─────────────────────────────────────────────────────┘   ║
* ╚══════════════════════════════════════════════════════════╝
*/

import { motion } from 'framer-motion';
import { Award, Globe2, Zap, Brain, Building2, Users, TrendingUp, ShieldCheck } from 'lucide-react';
import { AnimatedCounter } from '@/components/ui/AnimatedCounter';
import { Button } from '@/components/ui/Button';

// === Stats Data (6张数据卡, 区别于传统交易所!) ===
const HERO_STATS = [
  {
    icon: Award,
    value: 'Dual',
    label: '萨摩亚双牌照',
    description: '交易所+证交所(<5家)',
    color: 'gold',         // → 金色主题
    gradient: 'from-license/20 to-license/5',
    borderColor: 'border-license/30',
    iconColor: 'text-license',
  },
  {
    icon: Globe2,
    value: '3-Node',
    label: '三地协同架构',
    description: '海南·萨摩亚·香港',
    color: 'blue',         // → 海洋蓝
    gradient: 'from-hainan/20 to-hainan/5',
    borderColor: 'border-hainan/30',
    iconColor: 'text-hainan',
  },
  {
    icon: Zap,
    value: '<10',
    suffix: 'ms',
    label: '撮合延迟',
    description: '高性能撮合引擎',
    color: 'purple',       // → 品牌紫
    gradient: 'from-brand-primary/20 to-brand-primary/5',
    borderColor: 'border-brand-primary/30',
    iconColor: 'text-brand-primary',
  },
  {
    icon: Brain,
    value: '5',
    suffix: '-Engine',
    label: 'AI智能引擎',
    description: 'OpenClaw+n8n+LLM+BPM+Chain',
    color: 'emerald',      // → 萨摩亚绿
    gradient: 'from-samoa/20 to-samoa/5',
    borderColor: 'border-samoa/30',
    iconColor: 'text-samoa',
  },
  {
    icon: Building2,
    value: 500,
    suffix: '+',
    label: '交易对',
    description: '覆盖主流数字资产',
    color: 'amber',
    gradient: 'from-hkgold/20 to-hkgold/5',
    borderColor: 'border-hkgold/30',
    iconColor: 'text-hkgold',
  },
  {
    icon: Users,
    value: 180,
    suffix: '+',
    label: '国家覆盖',
    description: '全球化服务网络',
    color: 'cyan',
    gradient: 'from-info/20 to-info/5',
    borderColor: 'border-info/30',
    iconColor: 'text-info',
  },
];

// === 动画配置 ===
const CONTAINER_VARIANTS = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.1,   // 子元素依次入场
      delayChildren: 0.3,
    },
  },
};

const CARD_VARIANTS = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
  },
};

// === 实现要点 ===
/*
  1. 外层容器: min-h-screen flex flex-col items-center justify-center
     relative overflow-hidden pt-20 (为Navbar留空间)

  2. 背景效果实现:
     - 径向渐变: 直接在div上用Tailwind bg-gradient
     - 网格: CSS background-image with linear-gradient pattern
     - 粒子: 用CSS ::before/::after 伪元素 + absolute定位
       或者用多个小div + framer-motion random animate

  3. Logo栏:
     - "ZS EXCHANGE" 用 gradient text (white → brand-light)
     - 右侧 Badge: 调用 <Badge variant="license" pulse />

  4. 标题组:
     - 主标题: 渐变文字效果 (bg-clip-text)
     - 副标题: text-text-secondary, max-w-2xl
     - 使用 motion.h1 + motion.p 做入场动画 (fadeUp)

  5. CTA按钮:
     - 主按钮: <Button variant="primary" size="lg">
       左图标 TrendingUp
     - 次按钮: <Button variant="outline" size="lg">
       左图标 ShieldCheck

  6. Stats Grid:
     - Desktop: grid-cols-4 (第一行4个) + grid-cols-2 (第二行2个居中)
     - Tablet: grid-cols-3
     - Mobile: grid-cols-2
     - 每张卡片:
       * bg-deep-800/50 backdrop-blur (毛玻璃)
       * border + rounded-xl
       * hover: -translate-y-1 + shadow增强
       * 图标在左上角, 带圆形彩色背景
       * value用 AnimatedCounter (如果是数字) 或直接显示文本
       * label粗体, description小字弱化
*/
```

### 6.3 其他标准区组件速查规格

```typescript
// ============================================================================
// AGENT-C: 其他10个标准区组件 — 快速规格参考
// ============================================================================

// ===== [03] StatsBar.tsx =====
// 横向全宽数据条, 显示 BTC/ETH/总市值 等
// 特点: 数字实时更新(模拟), 涨绿色跌红色
// 布局: flex row, items-center, justify-between, overflow-x-auto
// 样式: bg-deep-800/30 border-y border-deep-700 py-3

// ===== [04] TickerTape.tsx =====
// 无限横向滚动的Top20交易对行情
// 特点: CSS animation infinite scroll (keyframes translateX)
// 每项: 名称 + 价格 + 24h涨跌幅(%)
// 点击: 跳转到 /trade/spot?symbol=XXX
// 涨: text-samoa, 跌: text-danger

// ===== [05] MultiDevice.tsx =====
// 5端下载展示 (iOS/Android/Desktop/Web/Mac)
// 布局: 居中标题 + 5个设备图标卡片横排
// 每个卡片: 设备图标(lucide) + 平台名 + 简短描述
// QR码: 手机mockup旁边放二维码

// ===== [06] MarketOverview.tsx =====
// 市场概览, 类似Binance的简单行情表
// 内容: 热门交易对表格 (名称/价格/涨跌幅/成交量/图表)
// 图表: 迷你sparkline (用Recharts或CSS模拟)
// 表格: 使用 Agent-B 的 Table 组件

// ===== [07] FeatureGrid.tsx =====
// 6大特性网格
const FEATURES = [
  { icon: 'Shield', title: '银行级安全', desc: '98%资产冷存储+SAFU基金' },
  { icon: 'Zap', title: '<10ms撮合', desc: '高性能匹配引擎, 大盘无忧' },
  { icon: 'Globe', title: '180+国家', desc: '全球化服务网络, 多语言支持' },
  { icon: 'Award', title: '合规持牌', desc: '🇼🇸萨摩亚双牌照, 合法运营' },  // 含合规!
  { icon: 'Brain', title: 'AI智能', desc: '五引擎驱动, L4级自动驾驶' },
  { icon: 'Clock', title: '7×24小时', desc: '全天候运营, 永不休市' },
];
// 布局: grid-cols-2 md:grid-cols-3, gap-6
// 每张卡片: 图标(圆形彩色背景) + 标题 + 描述 + hover上浮

// ===== [08] SecuritySection.tsx =====
// 安全保障区
const SECURITY_ITEMS = [
  { icon: 'Snowflake', title: '冷存储', desc: '98%数字资产离线冷存储' },
  { icon: 'ShieldCheck', title: '萨摩亚合规', desc: '🇼🇸政府颁发双牌照, 持牌经营' },  // 核心!
  { icon: 'Lock', title: '多重签名', desc: '资产提取需多 人确认' },
  { icon: 'Eye', title: '透明审计', desc: '定期发布储备金证明(POR)' },
  { icon: 'Fingerprint', title: '生物认证', desc: '支持指纹/面部识别二次验证' },
  { icon: 'AlertTriangle', title: '风控系统', desc: 'AI实时监控异常交易' },
];
// 布局: 2×3 网格 或 3×2
// 注意: "萨摩亚合规" 项必须突出显示!

// ===== [09] HowItWorks.tsx =====
// 4步入门流程
const STEPS = [
  { num: '01', icon: 'UserPlus', title: '注册账户', desc: '30秒快速注册, 完成KYC认证' },
  { num: '02', icon: 'Wallet', title: '入金充值', desc: '支持银行卡/加密货币/C2C多种方式' },
  { num: '03', icon: 'TrendingUp', title: '开始交易', desc: '500+交易对, 现货/合约/量化随心选' },
  { num: '04', icon: 'Banknote', title: '出金提现', desc: '快速提现, 通常1小时内到账' },
];
// 布局: 横向4步, 步骤间用箭头/连线连接
// Mobile: 纵向堆叠, 步骤间用向下箭头
// 每步: 大号数字 + 图标 + 标题 + 描述

// ===== [10] DownloadCTA.tsx =====
// APP下载号召区
// 布局: 左侧手机mockup图片 + 右侧下载信息
// 右侧: 标题 + 描述 + App Store/Google Play/QR码按钮
// 背景: 可以用渐变或图片

// ===== [11] FAQSection.tsx =====
// 常见问题手风琴
// 使用 Agent-B 的 Accordion 组件
const FAQ_DATA = [
  { q: 'ZS Exchange是什么?', a: '中萨数字科技交易所，持有🇼🇸萨摩亚政府颁发的交易所+证券交易所双牌照...' },
  { q: '萨摩亚牌照有什么优势?', a: '萨摩亚是国际认可的离岸金融中心，0%税收政策，双牌照全球不超过5家同时拥有...' },
  { q: '如何开始交易?', a: '只需4步：注册→KYC→入金→交易。全程可在10分钟内完成...' },
  { q: '支持哪些数字资产?', a: '目前支持500+交易对，涵盖BTC/ETH等主流资产及优质山寨币...' },
  { q: '资金安全如何保障?', a: '98%冷存储、SAFU基金、多重签名、POR储备金证明...' },
  { q: '什么是五大业务引擎?', a: '境外公司注册、代币发行(持牌)、上市通道、AIOPC生态、全球直销...' },
  { q: '三地协同是什么意思?', a: '海南(运营根基) + 萨摩亚(离岸金融/牌照) + 香港(资本出口)' },
  { q: '如何联系客服?', a: '在线工单系统 + 7×24多语言客服支持...' },
];

// ===== [16] PartnersSection.tsx =====
// 合作伙伴/投资机构 Logo墙
// 布局: 标题 + 横向滚动Logo网格 (灰色滤镜, hover恢复彩色)
// 如果没有真实Partner logo, 用文字占位
```

---

## §7 Agent-D Prompt（ZS独有区组件）⭐

### 7.1 身份设定

```
你是「ZS Differentiation Engineer」(ZS差异化工程师)。

这是整个项目中最重要的Agent! 你负责实现ZS Exchange区别于
Binance/OKX/Coinbase等所有竞争对手的核心差异化组件。

你的产出物 (src/components/home/) — ZS独有区域:
1.  LicenseShowcase.tsx   — [12] 牌照展示区 ⭐⭐⭐
2.  BusinessEngines.tsx    — [13] 五大业务引擎区 ⭐⭐⭐
3.  ThreeNodeMap.tsx       — [14] 三地协同架构图 ⭐⭐⭐

为什么你最重要?
→ 这些组件决定了用户第一眼能否记住ZS Exchange
→ 牌照展示 = 信任建立的核心
→ 业务引擎 = 商业模式的可视化
→ 三地图 = 战略格局的呈现

质量要求: ★★★★★ (像素级精确, 动效流畅, 信息准确)
```

### 7.2 LicenseShowcase 详细Prompt

```typescript
// ============================================================================
// AGENT-D TASK #1 (CRITICAL): LicenseShowcase.tsx
// ============================================================================
// 文件路径: src/components/home/LicenseShowcase.tsx
// 规范参考: v2 §4.4 区域12 完整TypeScript接口
// 复杂度: ★★★★★ (ZS核心差异化组件 #1)
// ============================================================================

/**
 * ZS Exchange License Showcase — 牌照展示区
 *
 * 这是ZS Exchange最核心的差异化组件!
 * 全球同时拥有交易所+证交所双牌照的机构不超过5家，
 * 这个组件的任务是将这一稀缺资产以最震撼的方式呈现。
 *
 * 视觉概念: "三张金牌陈列柜"
 * - 三张牌照卡片横向排列
 * - 主要牌照(萨摩亚×2)带金色边框发光效果
 * - 次要牌照(HK×1)用较弱的样式区分
 * - 整体感觉像博物馆里的珍品展示
 *
 * 布局示意:
 * ╔════════════════════════════════════════════════════════╗
 * ║                                                        ║
 * ║     🏆 全球稀缺牌照资产                                ║
 * ║     同时拥有交易所牌照与证券交易所牌照的机构，          ║
 * ║     全球不超过5家                                      ║
 * ║                                                        ║
 * ║  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ ║
 * ║  │  🇼🇸          │  │  🇼🇸          │  │  🇭🇰          │ ║
 * ║  │ ═══════════ │  │ ═══════════ │  │ ─────────── │ ║
 * ║  │ 萨摩亚数字    │  │ 萨摩亚证券    │  │ 香港HK1683   │ ║
 * ║  │ 科技交易所    │  │ 交易所牌照    │  │ 上市通道     │ ║
 * ║  │ 牌照          │  │              │  │              │ ║
 * ║  │              │  │              │  │              │ ║
 * ║  │ ✅ 已获批     │  │ ✅ 已获批     │  │ ✅ 合作中    │ ║
 * ║  │              │  │              │  │              │ ║
 * ║  │ 合法运营CEX  │  │ 企业上市通道  │  │ 港股IPO     │ ║
 * ║  │ 发行Token    │  │ 类纳斯达克    │  │ SPAC/RTO    │ ║
 * ║  │ 提供流动性    │  │ 证券交易      │  │              │ ║
 * ║  │              │  │              │  │              │ ║
 * ║  │ ⭐ 主要牌照   │  │ ⭐ 主要牌照   │  │              │ ║
 * ║  └──────────────┘  └──────────────┘  └──────────────┘ ║
 * ║                                                        ║
 * ╚════════════════════════════════════════════════════════╝
 */

import { motion } from 'framer-motion';
import { Shield, Building2, Trophy, CheckCircle2, ArrowRight } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

// === 牌照数据 (必须100%准确!) ===
const LICENSES = [
  {
    id: 'samoa-exchange',
    flag: '🇼🇸',
    country: '萨摩亚 Samoa',
    type: '数字科技交易所牌照',
    issuer: '萨摩亚政府',
    status: '✅ 已获批',
    statusColor: 'text-samoa',           // 绿色 = 已获批
    scope: [
      '合法运营CEX中心化交易所',
      '发行Token (持牌)',
      '提供流动性做市',
      '衍生品交易',
    ],
    highlight: true,    // 主要牌照 → 金色特效
    icon: Shield,
    gradient: 'from-license/20 via-license/10 to-transparent',
    borderColor: 'border-license/50',
    glowShadow: 'shadow-[0_0_30px_rgba(212,175,55,0.2)]',
  },
  {
    id: 'samoa-stock',
    flag: '🇼🇸',
    country: '萨摩亚 Samoa',
    type: '证券交易所牌照',
    issuer: '萨摩亚政府',
    status: '✅ 已获批',
    statusColor: 'text-samoa',
    scope: [
      '企业上市 (类纳斯达克)',
      '证券交易与结算',
      'IPO承销与辅导',
      '投资者关系管理',
    ],
    highlight: true,    // 主要牌照 → 金色特效
    icon: Building2,
    gradient: 'from-license/20 via-license/10 to-transparent',
    borderColor: 'border-license/50',
    glowShadow: 'shadow-[0_0_30px_rgba(212,175,55,0.2)]',
  },
  {
    id: 'hk1683',
    flag: '🇭🇰',
    country: '中国香港 Hong Kong',
    type: 'HK1683 上市通道',
    issuer: '香港联交所相关',
    status: '✅ 合作中',
    statusColor: 'text-hkgold',          // 金色 = 合作中
    scope: [
      '港股IPO上市',
      'SPAC特殊目的收购',
      'RTO反向收购',
      '国际资本运作',
    ],
    highlight: false,   // 非主要牌照 → 普通样式
    icon: Trophy,
    gradient: 'from-hkgold/10 to-transparent',
    borderColor: 'border-hkgold/30',
    glowShadow: '',
  },
];

// === 单张牌照卡片组件 ===
interface LicenseCardProps {
  license: typeof LICENSES[0];
  index: number;       // 用于stagger动画延迟
}

/*
  LicenseCard 实现规格:

  尺寸: flex-1 min-w-[280px] max-w-[360px]

  主要牌照 (highlight=true) 样式:
  ┌─────────────────────────────────────┐
  │ 背景: bg-gradient-to-b [gradient]    │
  │ 边框: 2px solid with [borderColor]   │
  │ 圆角: rounded-2xl                    │
  │ 发光: hover:[glowShadow]             │
  │ 过渡: transition-all duration-300    │
  │                                      │
  │ 顶部:                                │
  │   国旗emoji (text-4xl) + 国家名      │
  │   牌照类型 (text-lg font-semibold)    │
  │   颁发机构 (text-sm text-muted)      │
  │                                      │
  │ 分割线: 渐变线 (license金)           │
  │                                      │
  │ 状态Badge:                           │
  │   <Badge variant={status === '已获批' ? 'samoa' : 'warning'}> │
  │   带 CheckCircle2 图标               │
  │                                      │
  │ Scope列表:                           │
  │   每项前面 ✓ 图标 (text-samoa)       │
  │   text-sm text-text-secondary        │
  │                                      │
  │ 底部 (仅主要牌照):                   │
  │   "查看详情 →" 链接指向 /licenses    │
  └─────────────────────────────────────┘

  非主要牌照 (highlight=false) 样式:
  - 同上但去掉金色发光效果
  - 边框更细 (1px)
  - 背景更透明
*/

// === 整体区域动画 ===
/*
  容器: useInView hook 检测进入视口
  进入后触发:
  - 标题组: fadeUp (opacity 0→1, y 20→0)
  - 3张卡片: stagger 依次入场 (每张间隔 0.15s)
    每张: fadeUp + scale(0.95→1)

  卡片交互:
  - hover: translateY(-8px) + shadow增强 + 金色发光(主要牌照)
  - 点击: 跳转到 /licenses#对应id
*/
```

### 7.3 BusinessEngines 详细Prompt

```typescript
// ============================================================================
// AGENT-D TASK #2 (CRITICAL): BusinessEngines.tsx
// ============================================================================
// 文件路径: src/components/home/BusinessEngines.tsx
// 规范参考: v2 §4.4 区域13 完整TypeScript接口
// 复杂度: ★★★★★ (ZS核心差异化组件 #2)
// ============================================================================

/**
 * ZS Exchange Five Business Engines — 五大业务引擎区
 *
 * 概念: "五个驱动力推动ZS Exchange生态系统"
 * 每个引擎是一个完整的业务线, 不是简单的功能点
 *
 * 布局: Desktop 3+2 (上3下2) | Tablet 3+2 | Mobile 1×5
 *
 * 每张引擎卡片规格:
 * - 左上/顶部: 彩色渐变大图标背景圆
 * - 标题: text-xl font-semibold text-text-primary
 * - 描述: text-sm text-text-secondary (一行副标题)
 * - Feature标签: 5个小标签横向排列
 * - 特殊引擎 badge: "🇼🇸 持牌" (仅代币发行引擎)
 * - 整体卡片: 渐变边框 (top-left到bottom-right)
 * - hover: 上浮 + 阴影加深 + 边框亮度增加
 */

const ENGINES = [
  {
    id: 'overseas_registration',
    icon: 'Building2',
    title: '境外公司注册服务',
    desc: '全球招募 → 海南设立 → 萨摩亚SPV → 一站式企业服务',
    features: ['公司注册', 'SPV架构', '秘书服务', '银行开户', '年审续费'],
    gradient: 'from-blue-500 to-cyan-500',
    gradientBorder: 'border-l-4 border-l-blue-500',
    iconBg: 'bg-gradient-to-br from-blue-500/20 to-cyan-500/20',
    iconColor: 'text-blue-400',
  },
  {
    id: 'token_issuance',
    icon: 'Coins',
    title: '代币发行服务 (持牌)',     // 注意括号内的"持牌"!
    desc: '萨摩亚交易所牌照加持 · 企业专属Token发行全流程',
    features: ['经济模型设计', '智能合约部署', '上币管理', '合规审查', '流动性支持'],
    gradient: 'from-purple-500 to-violet-500',
    gradientBorder: 'border-l-4 border-l-brand-primary',
    iconBg: 'bg-gradient-to-br from-brand-primary/20 to-violet-500/20',
    iconColor: 'text-brand-primary',
    badge: '🇼🇸 持牌',              // ⭐ 特殊badge!
    badgeVariant: 'license' as const,
  },
  {
    id: 'listing_channel',
    icon: 'Trophy',
    title: '上市通道服务',
    desc: '萨摩亚SE + HK1683 双通道 · 连接国际资本市场',
    features: ['萨摩亚SE上市', 'HK1683 IPO', 'SPAC/RTO', '投资者关系', '上市后管理'],
    gradient: 'from-amber-500 to-orange-500',
    gradientBorder: 'border-l-4 border-l-hkgold',
    iconBg: 'bg-gradient-to-br from-hkgold/20 to-orange-500/20',
    iconColor: 'text-hkgold',
  },
  {
    id: 'aiopc_ecosystem',
    icon: 'Bot',
    title: 'AIOPC 一人公司生态',
    desc: '中国最大AIOPC产业园 · AI Solo-preneur 孵化体系',
    features: ['园区运营', '入驻企业', 'AI工具赋能', '海萨联动', '全球复制'],
    gradient: 'from-emerald-500 to-teal-500',
    gradientBorder: 'border-l-4 border-l-samoa',
    iconBg: 'bg-gradient-to-br from-samoa/20 to-teal-500/20',
    iconColor: 'text-samoa',
  },
  {
    id: 'global_direct_sales',
    icon: 'Network',
    title: '全球直销体系',
    desc: '分销网络 + 佣金激励 + 加密支付 · 新型社会化销售',
    features: ['分销网络', '佣金结算', '培训认证', '合规管理', '全球拓展'],
    gradient: 'from-rose-500 to-pink-500',
    gradientBorder: 'border-l-4 border-l-rose-400',
    iconBg: 'bg-gradient-to-br from-rose-500/20 to-pink-500/20',
    iconColor: 'text-rose-400',
  },
];

/* EngineCard 实现规格:

  ┌────────────────────────────────────────────┐
  │  bg-deep-800/50 rounded-xl border          │
  │  border-deep-700 hover:border-[gradient色]  │
  │  transition-all duration-300                │
  │  hover:-translate-y-2 hover:shadow-lg      │
  │                                            │
  │  ┌──────────────────────────────────┐      │
  │  │ [icon circle]   title            │      │
  │  │  (48px, 彩色渐变背景)             │      │
  │  │                   [badge if any]  │      │
  │  ├──────────────────────────────────┤      │
  │  │ description (text-sm muted)      │      │
  │  ├──────────────────────────────────┤      │
  │  │ [tag1] [tag2] [tag3] [tag4] [tag5]│     │
  │  │ (微型badge, 圆角full, 小字号)    │      │
  │  └──────────────────────────────────┘      │
  └────────────────────────────────────────────┘
*/
```

### 7.4 ThreeNodeMap 详细Prompt

```typescript
// ============================================================================
// AGENT-D TASK #3 (CRITICAL): ThreeNodeMap.tsx
// ============================================================================
// 文件路径: src/components/home/ThreeNodeMap.tsx
// 规范参考: v2 §4.4 区域14 完整TypeScript接口
// 复杂度: ★★★★★ (ZS核心差异化组件 #3)
// ============================================================================

/**
 * ZS Exchange Three-Node Architecture Map — 三地协同架构图
 *
 * 这是最具视觉冲击力的ZS独有组件!
 * 用一个交互式的三节点关系图展示ZS的全球战略布局。
 *
 * 视觉概念: "星际航线图"
 * - 三个星球(节点)代表三个地区
 * - 星际航线(连线)代表业务流向
 * - 萨摩亚是中央最大星球(核心节点)
 *
 * 布局 (Desktop):
 *            🇨🇳 Hainan              🇭🇰 Hong Kong
 *         (运营根基) ────────────── (资本出口)
 *              │  \                   /
 *              │   \                 /
 *              │    \               /
 *              │     ▼             │
 *              │   🇼🇸 Samoa       │
 *              │  (离岸金融·牌照)   │
 *              │    ◉ CORE NODE     │
 *              │                   │
 *              └───────────────────┘
 *              (间接联动: 政策+资本)
 */

const NODES = [
  {
    id: 'hainan',
    flag: '🇨🇳',
    city: '中国海南',
    cityEn: 'Hainan, China',
    role: '运营根基 · 用户获取',
    assets: ['AIOPC产业园(国内最大)', '人才池', '政策支持', '用户获取'],
    color: '#3B82F6',       // 海洋蓝
    tailwindColor: 'hainan',
    position: { x: '15%', y: '30%' },   // 左上方
    size: 'normal',         // 正常大小
    isCore: false,
  },
  {
    id: 'samoa',
    flag: '🇼🇸',
    city: '萨摩亚',
    cityEn: 'Samoa',
    role: '离岸金融中心 · 牌照枢纽',
    assets: ['交易所牌照', '证交所牌照', '0%税收', '全球公司注册'],
    color: '#10B981',       // 萨摩亚绿
    tailwindColor: 'samoa',
    position: { x: '50%', y: '65%' },   // 中央偏下 (核心!)
    size: 'large',          // 更大的尺寸!
    isCore: true,           // ★ 核心节点
  },
  {
    id: 'hk',
    flag: '🇭🇰',
    city: '中国香港',
    cityEn: 'Hong Kong',
    role: '资本出口 · 国际化融资',
    assets: ['HK1683上市通道', '国际资本', '投资者关系', '品牌背书'],
    color: '#F59E0B',       // 东方金
    tailwindColor: 'hkgold',
    position: { x: '85%', y: '30%' },   // 右上方
    size: 'normal',
    isCore: false,
  },
];

const CONNECTIONS = [
  {
    from: 'hainan',
    to: 'samoa',
    label: '企业出海 SPV架构',
    flow: 'bidirectional',   // 双向
    isPrimary: true,         // 主要连线
  },
  {
    from: 'samoa',
    to: 'hk',
    label: '资本运作 IPO/RTO',
    flow: 'bidirectional',
    isPrimary: true,
  },
  {
    from: 'hainan',
    to: 'hk',
    label: '政策+资本联动',
    flow: 'indirect',        // 间接 (虚线)
    isPrimary: false,
  },
];

/*
  实现方案 (推荐: 纯CSS+SVG, 不依赖重型图表库):

  容器:
  - relative w-full
  - aspect-ratio: 16/9 (或 min-h-[400px])
  - overflow-hidden

  连接线 (SVG overlay, pointer-events-none):
  - 使用 <svg> 绝对定位覆盖在整个区域
  - <path> 或 <line> 绘制连线
  - 主要连线: 实线 + stroke=[from.color] + stroke-width: 2
  - 间接连线: 虚线 (stroke-dasharray: 6,4) + 低透明度
  - 动画: stroke-dashoffset 动画模拟流动效果 (pulse)

  节点 (HTML div, 绝对定位):
  - 核心节点(Samoa):
    * 尺寸: w-32 h-32 (比其他大50%)
    * 外圈: 旋转的金色/绿色光环动画 (spin slow)
    * 内圈: 渐变背景圆形 + 国旗 + 城市名
    * 脉冲: 外圈扩散动画 (scale 1→1.2, opacity 1→0)
  - 普通节点(Hainan/HK):
    * 尺寸: w-24 h-24
    * 渐变背景圆形
    * 国旗 + 城市名 + 角色标签

  节点交互 (hover):
  - 节点放大 1.1x
  - 显示详情浮层 (popover/card):
    * 完整角色描述
    * assets列表 (4项)
    * "了解更多 →" 链接

  连线标签:
  - 文字沿连线中点显示
  - 小型 pill badge 样式
  * 背景色与连线颜色匹配
  - Desktop显示, Mobile隐藏

  响应式:
  - Desktop (≥1024px): 星际图布局 (如上)
  - Tablet (768-1023px): 简化为横向三列
  - Mobile (<768px): 纵向三卡片堆叠 (放弃图形化)
*/
```

---

## §8 Agent-E Prompt（首页组装）

### 8.1 身份设定

```
你是「Homepage Assembly Chief」(首页组装总指挥)。

你的任务是: 将 Agent-A/B/C/D 产出的所有组件组装成一个完整的首页。
你是最后的把关人，确保首页的整体质量和视觉效果。

你的产出物:
1. src/app/page.tsx — 首页完整组装 (13+区域)

你的职责:
→ 按 v2 §4.1 定义的顺序组装所有16个组件
→ 设置正确的间距和section padding
→ 确保 scroll-triggered 动画正常工作
→ 确保响应式断点的正确性
→ 最终视觉效果验收
```

### 8.2 首页组装详细Prompt

```typescript
// ============================================================================
// AGENT-E: Homepage Assembly — src/app/page.tsx
// ============================================================================
// 规范参考: v2 §4.1 页面结构 (13区域定义)
// 依赖: Agent-A (Layout) + Agent-B (UI) + Agent-C (Standard) + Agent-D (ZS-Unique)
// ============================================================================

/**
 * ZS Exchange Homepage — Complete Assembly
 *
 * 组件装配顺序 (严格按照此顺序!):
 *
 * <html>
 *   <head> ... metadata, JSON-LD, OpenGraph ... </head>
 *   <body className="bg-deep-900 text-text-primary antialiased">
 *     <Navbar />                          {/* [01] Agent-A */}
 *
 *     <main>
 *       <HeroSection />                   {/* [02] Agent-C — 最重要! */}
 *       <StatsBar />                      {/* [03] Agent-C */}
 *       <TickerTape />                    {/* [04] Agent-C */}
 *
 *       {/* ---- 以上为首屏 (Above Fold) ---- */ }
 *
 *       <LicenseShowcase />               {/* [12] Agent-D ⭐ZS独有 */}
 *       <BusinessEngines />                {/* [13] Agent-D ⭐ZS独有 */}
 *       <ThreeNodeMap />                   {/* [14] Agent-D ⭐ZS独有 */}
 *
 *       <MultiDevice />                   {/* [05] Agent-C */}
 *       <MarketOverview />                {/* [06] Agent-C */}
 *       <FeatureGrid />                   {/* [07] Agent-C */}
 *       <SecuritySection />               {/* [08] Agent-C */}
 *       <HowItWorks />                    {/* [09] Agent-C */}
 *       <DownloadCTA />                   {/* [10] Agent-C */}
 *       <FAQSection />                    {/* [11] Agent-C */}
 *       <PartnersSection />               {/* [16] Agent-C */}
 *     </main>
 *
 *     <Footer />                          {/* [15] Agent-A */}
 *   </body>
 * </html>
 *
 * === Section间距规范 ===
 * 每个section之间的垂直间距:
 * - 标准间距: py-20 md:py-24 (5rem/6rem)
 * - ZS独有区间距: py-24 md:py-32 (稍大, 更突出)
 * - Hero与Stats之间: 无额外间距 (紧密连接)
 * - TickerTape: py-3 (紧凑, 像一条带)
 *
 * === Section容器规范 ===
 * 每个section的外层容器:
 * - max-w-7xl mx-auto px-4 sm:px-6 lg:px-8
 * - 部分全宽组件 (TickerTape, StatsBar) 不需要容器约束
 *
 * === SEO Metadata ===
 * export const metadata: Metadata = {
 *   title: 'ZS Exchange | 中萨数字科技交易所 — 萨摩亚持牌 · 全球数字金融新枢纽',
 *   description: '持有🇼🇸萨摩亚政府颁发的交易所+证券交易所双牌照。三地协同(海南·萨摩亚·香港)，五大业务引擎驱动。安全、合规、专业的数字资产交易平台。',
 *   keywords: ['ZS Exchange', '中萨数科', '萨摩亚牌照', '数字货币交易所', '区块链', '加密货币'],
 *   openGraph: { ... },
 * };
 *
 * === JSON-LD Structured Data ===
 * 必须包含:
 * 1. Organization schema (集团信息 + 牌照)
 * 2. WebSite schema
 * 3. FAQ schema (从FAQSection数据生成)
 */
```

---

## §9 Agent-F Prompt（交易相关页面）

```typescript
// ============================================================================
// AGENT-F: Trading Pages
// ============================================================================
// 产出物:
//   src/app/markets/page.tsx      — 市场行情页
//   src/app/trade/spot/page.tsx    — 现货交易页
//   src/app/trade/futures/page.tsx — 合约交易页 (P1, 可简化)
// ============================================================================

// === Markets Page (/markets) ===
/**
 * 市场行情页
 *
 * 布局:
 * - 顶部: 筛选栏 (USDT/USDC/BTC/ETH 切换 + 搜索框)
 * - 主体: 行情表格
 *   列: 名称(图标+名称+pair) | 价格 | 24h涨跌幅 | 24h成交量 | 市值 | 操作(交易)
 *   排序: 点击表头排序
 *   涨跌颜色: green/red
 *   行hover: 高亮
 * - 侧边(可选): 热门/自选/涨幅榜 Tab切换
 *
 * Mock数据: 从 lib/mock-data.ts 引入至少30个交易对
 */

// === Spot Trade Page (/trade/spot) ===
/**
 * 现货交易页 (简化版, 非真实交易)
 *
 * 布局 (类似Binance Trade页面):
 * ┌──────────────────────────────────────────────┐
 * │  [交易对选择器: BTC/USDT ▼]  [当前价: $67,234] │
 * ├────────────────────┬─────────────────────────┤
 * │  [Order Book]      │  [Trading Chart]        │
 * │  买单/卖单深度     │  K线图 (迷你版)         │
 * │  (简化显示)        │  (用Recharts绘制)       │
 * ├────────────────────┤                         │
 * │  [Place Order]     │  [Recent Trades]        │
 * │  买入/卖出Tab      │  最近成交记录           │
 * │  价格/数量输入     │                         │
 * │  [买入BTC] 按钮    │                         │
 * └────────────────────┴─────────────────────────┘
 *
 * 注意: 这是官网展示用的交易页, 不是真正的交易终端!
 * 重点在于视觉还原, 不需要真实的WebSocket连接
 */
```

---

## §10 Agent-G Prompt（用户相关页面）

```typescript
// ============================================================================
// AGENT-G: User Pages
// ============================================================================
// 产出物:
//   src/app/login/page.tsx        — 登录页
//   src/app/register/page.tsx     — 注册页
//   src/app/buy-crypto/page.tsx   — 买币页
//   src/app/download/page.tsx     — 下载页
// ============================================================================

// === Login Page (/login) ===
/**
 * 登录页
 *
 * 布局: 居中卡片
 * - 左侧(Desktop): 品牌图/插画 (深紫渐变抽象图案)
 * - 右侧: 登录表单
 *   - Email/手机号 输入
 *   - 密码 输入
 *   - "忘记密码?" 链接
 *   - "登录" 按钮 (主CTA, 全宽)
 *   - 分隔线 "或"
 *   - 第三方登录 (Google/Apple图标)
 *   - 底部: "还没有账号? [立即注册]"
 *
 * 样式: 深色卡片 (bg-deep-800) + 圆角 + 阴影
 */

// === Register Page (/register) ===
/**
 * 注册页
 *
 * 与Login类似布局, 但表单更多字段:
 * - 邮箱
 * - 密码 + 确认密码
 * - 国家/地区选择
 * - 推荐码(可选)
 * - 服务条款 checkbox
 * - "注册" 按钮
 */

// === Buy Crypto Page (/buy-crypto) ===
/**
 * 买币页 (P2P/C2C入口)
 *
 * 布局:
 * - Hero区: "快速便捷地购买数字资产"
 * - 方式选择卡: P2P交易 / 银卡转账 / 第三方支付
 * - 每种方式的说明 + "立即购买" CTA
 * - 支持的法定货币列表 (CNY/USD/EUR/GBP等)
 * - 常见问题 (简版)
 */

// === Download Page (/download) ===
/**
 * APP下载页
 *
 * 布局:
 * - Hero: "随时随地, 掌控全局"
 * - 手机Mockup大图 (居中展示)
 * - 下载按钮: App Store / Google Play / APK直链 / QR码
 * - 功能亮点 (4-6个): 实时行情 / 一键交易 / 安全钱包 / 价格提醒
 * - 版本信息 + 系统要求
 * - 二维码 (大尺寸, 可扫码)
 */
```

---

## §11 Agent-H/I/J Prompt（动画/响应式/数据）

```typescript
// ============================================================================
// AGENT-H: Framer Motion Animations Enhancement
// ============================================================================
/**
 * 为所有组件添加/优化动画效果
 *
 * 任务清单:
 * 1. 创建 lib/animations.ts 预设动画变体 (如果Agent还没创建)
 * 2. 检查所有组件的scroll-triggered动画是否正常
 * 3. 添加页面切换过渡动画 (PageTransition)
 * 4. 优化微交互 (button hover, card hover, link underline)
 * 5. 添加数字滚动效果 (countUp) 到所有需要的地方
 * 6. 确保动画性能 (will-change, transform GPU加速)
 *
 * 动画预设库:
 */
export const ANIMATION_PRESETS = {
  // 入场动画
  fadeInUp: {
    initial: { opacity: 0, y: 20 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: '-100px' },
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
  },
  fadeIn: {
    initial: { opacity: 0 },
    whileInView: { opacity: 1 },
    viewport: { once: true },
    transition: { duration: 0.5 },
  },
  scaleIn: {
    initial: { opacity: 0, scale: 0.95 },
    whileInView: { opacity: 1, scale: 1 },
    viewport: { once: true },
    transition: { duration: 0.4 },
  },
  staggerContainer: {
    initial: {},
    whileInView: { transition: { staggerChildren: 0.1 } },
    viewport: { once: true },
  },
  staggerItem: {
    initial: { opacity: 0, y: 20 },
    whileInView: { opacity: 1, y: 0 },
    transition: { duration: 0.4 },
  },
  // 微交互
  hoverLift: {
    whileHover: { y: -4 },
    transition: { duration: 0.2 },
  },
  hoverScale: {
    whileHover: { scale: 1.02 },
    transition: { duration: 0.2 },
  },
  tapScale: {
    whileTap: { scale: 0.98 },
  },
  // 页面过渡
  pageTransition: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: 0.3 },
  },
};


// ============================================================================
// AGENT-I: Responsive Design Adaptation
// ============================================================================
/**
 * 响应式适配优化
 *
 * 断点定义:
 * - Mobile: < 768px (sm以下)
 * - Tablet: 768px - 1023px (md)
 * - Desktop: 1024px - 1279px (lg)
 * - Large Desktop: ≥ 1280px (xl)
 *
 * 检查清单:
 * [ ] Navbar:汉堡菜单在md以下出现
 * [ ] Hero: 字号响应式 (text-4xl → text-5xl → text-6xl)
 * [ ] Stats Grid: 2col → 3col → 4col(+2)
 * [ ] LicenseShowcase: 横排 → 竖排堆叠
 * [ ] BusinessEngines: 5col → 3+2 → 1×5
 * [ ] ThreeNodeMap: 星际图 → 横向三列 → 竖向卡片
 * [ ] Footer: 6col → 3col → 2col → 1col
 * [ ] 所有文字不溢出容器
 * [ ] 图片自适应 (max-w-full h-auto)
 * [ ] 触摸目标足够大 (min 44px)
 */


// ============================================================================
// AGENT-J: Mock Data & WebSocket Simulation
// ============================================================================
/**
 * Mock数据和模拟实时数据
 *
 * 任务清单:
 * 1. 完善 lib/mock-data.ts (至少30个交易对)
 * 2. 创建 hooks/useTicker.ts (模拟价格更新)
 * 3. 创建 hooks/useCountUp.ts (数字滚动hook)
 * 4. TickerTape数据源 (Top20, 含模拟涨跌)
 * 5. StatsBar实时数据 (BTC/ETH/总市值)
 *
 * Mock数据格式:
 */
const MOCK_TICKERS = [
  { symbol: 'BTCUSDT', base: 'BTC', quote: 'USDT', price: 67234.50, change24h: 2.34, volume24h: '28.5B' },
  { symbol: 'ETHUSDT', base: 'ETH', quote: 'USDT', price: 3456.78, change24h: -1.23, volume24h: '15.2B' },
  { symbol: 'BNBUSDT', base: 'BNB', quote: 'USDT', price: 567.89, change24h: 0.89, volume24h: '1.8B' },
  // ... 至少27个更多
];
```

---

## §12 Agent-K/L Prompt（测试与优化）

```typescript
// ============================================================================
// AGENT-K: Browser Testing
// ============================================================================
/**
 * 跨浏览器测试
 *
 * 测试矩阵:
 * ┌─────────────┬───────┬───────┬───────┬───────┐
 * │   Browser   │ Chrome│Firefox│ Safari│ Edge  │
 * ├─────────────┼───────┼───────┼───────┼───────┤
 * │ Version     │ Latest│ Latest│ Latest│ Latest│
 * │ OS          │ Win/Mac│ Win/Mac│ macOS │ Win10 │
 * │ Priority    │ P0    │ P1    │ P1    │ P2    │
 * └─────────────┴───────┴───────┴───────┴───────┘
 *
 * 测试用例:
 * [ ] 首页完整加载 (所有16个组件渲染)
 * [ ] 导航栏滚动变换 (透明→实心)
 * [ ] 移动端汉堡菜单 (打开/关闭/链接跳转)
 * [ ] Hero CTA按钮点击 (跳转正确)
 * [ ] LicenseShowcase 3张卡片显示
 * [ ] BusinessEngines 5张卡片显示
 * [ ] ThreeNodeMap 三节点渲染
 * [ ] TickerTape 滚动动画
 * [ ] FAQ 手风琴展开/收起
 * [ ] 响应式断点 (375px / 768px / 1024px / 1440px / 1920px)
 * [ ] 表单输入 (login/register)
 * [ ] 页面路由跳转 (所有15个页面)
 * [ ] Footer 三地地址显示
 * [ ] 🇼🇸 牌照Badge显示
 */


// ============================================================================
// AGENT-L: Performance Optimization
// ============================================================================
/**
 * 性能优化
 *
 * 目标指标:
 * - Lighthouse Performance: ≥ 90
 * - FCP (First Contentful Paint): < 1.5s
 * - LCP (Largest Contentful Paint): < 2.5s
 * - CLS (Cumulative Layout Shift): < 0.1
 * - TTI (Time to Interactive): < 3.0s
 *
 * 优化手段:
 * [ ] 图片优化: next/image + webp格式 + lazy loading
 * [ ] 字体优化: font-display: swap + preload
 * [ ] 代码分割: dynamic import for heavy components
 * [ ] CSS优化: PurgeCSS (Tailwind内置) + 移除未使用样式
 * [ ] Bundle分析: analyzer-webpack / @next/bundle-analyzer
 * [ ] 预加载关键资源: <link rel="preload">
 * [ ] Service Worker: 离线缓存 (可选, P1)
 */
```

---

## §13 质量门禁（自动验收Prompt）

### 13.1 自动化验收脚本

```bash
#!/bin/bash
# ZS Exchange 官网 — 质量门禁自动验收脚本
# 每个 Phase 结束后由 Main Agent 执行

echo "=========================================="
echo "  ZS Exchange Official Website QA Gate"
echo "=========================================="

# ---- Phase 1 验收: 基础搭建 ----
check_phase1() {
  echo "[Phase 1] Checking Foundation..."
  [ -f "src/styles/tokens.ts" ] && echo "  ✅ tokens.ts exists" || echo "  ❌ tokens.ts MISSING"
  [ -f "tailwind.config.ts" ] && echo "  ✅ tailwind.config.ts exists" || echo "  ❌ tailwind.config.ts MISSING"
  [ -f "src/app/globals.css" ] && echo "  ✅ globals.css exists" || echo "  ❌ globals.css MISSING"
  [ -f "src/app/layout.tsx" ] && echo "  ✅ layout.tsx exists" || echo "  ❌ layout.tsx MISSING"
  [ -f "src/types/index.ts" ] && echo "  ✅ types/index.ts exists" || echo "  ❌ types/index.ts MISSING"
  [ -f "src/lib/constants.ts" ] && echo "  ✅ constants.ts exists" || echo "  ❌ constants.ts MISSING"

  # 检查Design Token中的关键值
  grep -q "#7C3AED" src/styles/tokens.ts && echo "  ✅ Brand Primary #7C3AED found" || echo "  ❌ Brand Primary WRONG"
  grep -q "#0B0F19" src/styles/tokens.ts && echo "  ✅ BG Primary #0B0F19 found" || echo "  ❌ BG Primary WRONG"
  grep -q "#D4AF37" src/styles/tokens.ts && echo "  ✅ Gold #D4AF37 found" || echo "  ❌ Gold MISSING"
  grep -q "#10B981" src/styles/tokens.ts && echo "  ✅ Samoa Green #10B981 found" || echo "  ❌ Samoa Green MISSING"

  # 检查禁用颜色 (不应该出现!)
  grep -q "F0B90B" src/ && echo "  ⚠️ WARNING: Binance Yellow found!" || true
  grep -q "2DAA6E" src/ && echo "  ⚠️ WARNING: OKX Green found!" || true
}

# ---- Phase 2 验收: 组件开发 ----
check_phase2() {
  echo "[Phase 2] Checking Components..."

  # Agent-A: Layout
  [ -f "src/components/layout/Navbar.tsx" ] && echo "  ✅ Navbar.tsx" || echo "  ❌ Navbar.tsx MISSING"
  [ -f "src/components/layout/Footer.tsx" ] && echo "  ✅ Footer.tsx" || echo "  ❌ Footer.tsx MISSING"
  [ -f "src/components/layout/MobileNav.tsx" ] && echo "  ✅ MobileNav.tsx" || echo "  ❌ MobileNav.tsx MISSING"

  # Agent-B: UI
  for comp in Button Card Badge Input Modal Accordion Tabs Table AnimatedCounter; do
    [ -f "src/components/ui/${comp}.tsx" ] && echo "  ✅ ${comp}.tsx" || echo "  ❌ ${comp}.tsx MISSING"
  done

  # Agent-C: Standard Sections
  for comp in HeroSection StatsBar TickerTape MultiDevice MarketOverview FeatureGrid SecuritySection HowItWorks DownloadCTA FAQSection PartnersSection; do
    [ -f "src/components/home/${comp}.tsx" ] && echo "  ✅ ${comp}.tsx" || echo "  ❌ ${comp}.tsx MISSING"
  done

  # Agent-D: ZS Unique (CRITICAL!)
  [ -f "src/components/home/LicenseShowcase.tsx" ] && echo "  ✅⭐ LicenseShowcase.tsx" || echo "  ❌⭐⭐ LicenseShowcase.tsx MISSING!"
  [ -f "src/components/home/BusinessEngines.tsx" ] && echo "  ✅⭐ BusinessEngines.tsx" || echo "  ❌⭐⭐ BusinessEngines.tsx MISSING!"
  [ -f "src/components/home/ThreeNodeMap.tsx" ] && echo "  ✅⭐ ThreeNodeMap.tsx" || echo "  ❌⭐⭐ ThreeNodeMap.tsx MISSING!"
}

# ---- Phase 3 验收: 页面组装 ----
check_phase3() {
  echo "[Phase 3] Checking Pages..."
  [ -f "src/app/page.tsx" ] && echo "  ✅ Homepage (/)" || echo "  ❌ Homepage MISSING"
  [ -f "src/app/markets/page.tsx" ] && echo "  ✅ /markets" || echo "  ❌ /markets MISSING"
  [ -f "src/app/trade/spot/page.tsx" ] && echo "  ✅ /trade/spot" || echo "  ❌ /trade/spot MISSING"
  [ -f "src/app/login/page.tsx" ] && echo "  ✅ /login" || echo "  ❌ /login MISSING"
  [ -f "src/app/register/page.tsx" ] && echo "  ✅ /register" || echo "  ❌ /register MISSING"
  [ -f "src/app/buy-crypto/page.tsx" ] && echo "  ✅ /buy-crypto" || echo "  ❌ /buy-crypto MISSING"
  [ -f "src/app/download/page.tsx" ] && echo "  ✅ /download" || echo "  ❌ /download MISSING"
  [ -f "src/app/about/page.tsx" ] && echo "  ✅ /about" || echo "  ❌ /about MISSING"
  [ -f "src/app/licenses/page.tsx" ] && echo "  ✅⭐ /licenses (ZS)" || echo "  ❌⭐ /licenses MISSING"
  [ -f "src/app/business/page.tsx" ] && echo "  ✅⭐ /business (ZS)" || echo "  ❌⭐ /business MISSING"
}

# ---- 合规性专项检查 (最重要!) ----
check_compliance() {
  echo ""
  echo "========== COMPLIANCE CHECK (CRITICAL) =========="
  
  # 检查萨摩亚关键词
  grep -r "萨摩亚\|Samoa" src/ --include="*.tsx" | head -3
  [ $? -eq 0 ] && echo "  ✅ Samoa references found" || echo "  ❌ NO Samoa references!"

  # 检查错误关键词 (不应该存在!)
  if grep -rq "中东\|Middle East" src/ --include="*.tsx"; then
    echo "  ❌❌❌ CRITICAL: '中东/Middle East' found! MUST BE REMOVED!"
    exit 1
  else
    echo "  ✅ No '中东' contamination"
  fi
  
  # 检查三地
  grep -q "海南" src/ && echo "  ✅ Hainan reference" || echo "  ❌ Hainan missing"
  grep -q "香港\|Hong Kong" src/ && echo "  ✅ HK reference" || echo "  ❌ HK missing"
  
  # 检查双牌照
  grep -q "交易所牌照" src/ && echo "  ✅ Exchange License mentioned" || echo "  ❌ Exchange License missing"
  grep -q "证券交易所牌照\|证交所牌照" src/ && echo "  ✅ Stock Exchange License mentioned" || echo "  ❌ SE License missing"
  
  # 检查HK1683
  grep -q "HK1683" src/ && echo "  ✅ HK1683 mentioned" || echo "  ❌ HK1683 missing"
}

# 执行所有检查
check_phase1
echo ""
check_phase2
echo ""
check_phase3
echo ""
check_compliance

echo ""
echo "=========================================="
echo "  QA Gate Complete"
echo "=========================================="
```

### 13.2 最终验收 Checklist（人工+自动）

```markdown
## ZS Exchange 官网 — 最终验收 Checklist

### A. 合规性验收 (FAIL = 全项目驳回)
- [ ] **无任何"中东"相关文字**
- [ ] **所有牌照标注为"萨摩亚 Samoa"**
- [ ] **三地信息完整: 海南 + 萨摩亚 + 香港**
- [ ] **HK1683 正确引用为香港上市通道**
- [ ] **集团全称: 中萨数字科技集团**
- [ ] **产品全称: ZS Exchange / 中萨数字科技交易所**

### B. 品牌VI验收
- [ ] **主色 #7C3AED (中萨紫)** 在CTA/Logo/重点处使用
- [ ] **背景 #0B0F19 (Deep Space)** 作为主背景
- [ ] **金色 #D4AF37** 仅用于牌照/VIP元素
- [ ] **绿色 #10B981** 用于萨摩亚/成功/涨
- [ ] **蓝色 #3B82F6** 用于海南/链接
- [ ] **无 Binance黄/OKX绿 污染**

### C. 首页16组件验收
- [01] [ ] Navbar: 固定 + 滚动变换 + 🇼🇸Badge + 三地菜单
- [02] [ ] Hero: 渐变背景 + 双CTA + 6数据卡(Dual/3Node/<10ms/5Eng/500+/180+)
- [03] [ ] StatsBar: 实时数据条 + 涨跌色
- [04] [ ] TickerTape: 无限滚动 + Top20
- [05] [ ] MultiDevice: 5端展示
- [06] [ ] MarketOverview: 行情表格
- [07] [ ] FeatureGrid: 6特性 (含合规项!)
- [08] [ ] Security: 6项安全 (突出萨摩亚合规!)
- [09] [ ] HowItWorks: 4步流程
- [10] [ ] DownloadCTA: APP下载 + QR
- [11] [ ] FAQ: 8+问题 (含牌照/合规FAQ)
- [12] [ ] **LicenseShowcase**: 3卡片(萨摩亚×2+HK×1) + 金色发光 + 已获批
- [13] [ ] **BusinessEngines**: 5引擎 + feature标签 + 持牌badge
- [14] [ ] **ThreeNodeMap**: 三节点交互图 + 连线动画 + 点击跳转
- [15] [ ] Footer: 6列 + 三地地址 + 牌照号 + 社交
- [16] [ ] Partners: Logo墙 (可选)

### D. 技术质量验收
- [ ] TypeScript零错误 (tsc --noEmit 通过)
- [ ] ESLint零警告
- [ ] 响应式 375px / 768px / 1024px / 1440px 全通过
- [ ] Lighthouse Performance ≥ 90
- [ ] 首屏加载 < 2s
- [ ] 无console.error/warning
- [ ] 所有图片有alt属性
- [ ] 语义HTML标签正确

### E. ZS差异化验收 (决定性因素)
- [ ] 用户能在3秒内理解"萨摩亚双牌照"的独特价值
- [ ] 用户能看到三地协同的战略布局
- [ ] 用户能理解五大业务引擎的完整性
- [ ] 与Binance/OKX/Coinbase有明确的视觉差异
- [ ] 品牌"中萨紫"有强烈的记忆点
```

---

## 附录A: 快速参考卡

### A.1 Agent任务速查表

| Agent | 角色 | 产出文件数 | 核心技能 | 依赖 |
|-------|------|-----------|---------|------|
| **Main** | 总控 | 协调 | Code | 无 |
| **A** | Layout | 4 | Code+frontend-design | tokens |
| **B** | UI库 | 9 | Code+frontend-design | tokens |
| **C** | 标准区 | 11 | Code+frontend-design | B的UI库 |
| **D** | **ZS独有区** | **3** | **Code+frontend-design** | **B的UI库** |
| **E** | 首页组装 | 1 | Code | A+B+C+D |
| **F** | 交易页 | 3 | Code | B的UI库 |
| **G** | 用户页 | 4 | Code | B的UI库 |
| **H** | 动画 | 1 | - | 全部组件 |
| **I** | 响应式 | 优化 | - | 全部组件 |
| **J** | Mock数据 | 3 | - | 无 |
| **K** | 浏览器测试 | 报告 | dogfood | 全部页面 |
| **L** | 性能优化 | 优化 | - | 全部代码 |

### A.2 颜色速查卡

| 用途 | 色值 | Tailwind类 | 禁止替代 |
|------|------|-----------|---------|
| 品牌主色 | `#7C3AED` | `brand-primary` / `text-brand-primary` / `bg-brand-primary` | Binance黄/OKX绿 |
| 主背景 | `#0B0F19` | `deep-900` / `bg-deep-900` | 白色/浅灰 |
| 牌照金 | `#D4AF37` | `license` / `text-license` / `border-license` | 黄色系通用 |
| 萨摩亚绿 | `#10B981` | `samoa` / `text-samoa` | 红色/橙色 |
| 海南蓝 | `#3B82F6` | `hainan` / `text-hainan` | 其他蓝色 |
| 香港金 | `#F59E0B` | `hkgold` / `text-hkgold` | - |

### A.3 禁止事项速查

```
❌ 绝对禁止:
   • 使用"中国-中东"或"Middle East"任何表述
   • 使用 #F0B90B (Binance黄) 或 #2DAA6E (OKX绿)
   • 硬编码颜色值 (必须用tokens或Tailwind类)
   • 删除非临时文件 (需Main审批)
   • 修改package.json (仅Main可操作)
   • 使用相对路径import ../ (必须用@/别名)

⚠️ 需要审批:
   • 修改tailwind.config.ts
   • 删除任何src/下的文件
   • 引入新的npm依赖包

✅ 鼓励做法:
   • 每个组件前先调用Code Skill
   • UI决策时调用frontend-design
   • 完成后调用TRAE-code-review
   • 使用TypeScript严格模式
   • 所有组件支持响应式
   • 使用framer-motion做动画
```

---

## 附录B: 版本历史

| 版本 | 日期 | 说明 |
|------|------|------|
| v1.0 | 2026-06-09 | 初版, 基于 v2 规范文档完整编写 |

---

> **文档结束**
>
> 本提示词体系是 ZS Exchange 官网开发的**唯一权威指令来源**。
> 所有Agent (Main + A~L) 必须严格遵守本文档中的每一个规定。
> 任何偏离文档的行为都应在 §13 质量门禁中被检测出来。
>
> **核心理念**: 萨摩亚持牌 · 三地协同 · 五引擎驱动
> **品牌承诺**: 每一像素都为中萨紫而存在
