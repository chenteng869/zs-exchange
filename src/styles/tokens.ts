/**
 * ZS Exchange Design Token System v7 (Aurora Premium)
 * 升级自 V6 Royal Premium - 引入 "Aurora Premium" 极光尊享主题
 * 调研：Stripe 2026 / Coinbase Advanced / OKX Web3 / Kraken Pro / Bybit V5
 *
 * v6 → v7 关键升级（解决"黑乎乎"问题）：
 *   1. 抛弃纯色背景 → 引入多层极光渐变网格（Aurora Mesh Gradient）
 *   2. 基础色从 #0B1124 提升至 #0F1B3D（皇家深蓝），再叠加 #1A2456 提亮光晕层
 *   3. 新增多色极光：#F0B90B 金 / #38BDF8 青 / #A78BFA 紫 / #34D399 翠 / #F472B6 粉
 *   4. 引入 Glassmorphism 2.0 工具类（backdrop-filter: blur(24px) saturate(180%)）
 *   5. 引入"光流体"动画（aurora-flow）—背景光斑缓慢呼吸
 *   6. 卡片顶层增加 "顶部高光线"（border-image 渐变）
 *   7. 升级玻璃卡片透明度（85% → 70% 更通透）
 *
 * 三大系统：
 *   1. 官网 / 用户前台   - 极光尊享 (Aurora Premium)  ← v7 当前
 *   2. 交易页 / K线终端  - 深色专业终端 (Dark Trading)
 *   3. 管理后台 / 风控   - 浅色金融风控 + 深色侧边栏 (Light Admin + Dark Sidebar)
 */

// ============================================================
// 一、官网 极光尊享深色系统 (Aurora Premium Theme)  v7
// ============================================================

/** 官网基础背景 - 多层渐变模拟极光（v7 核心） */
export const auroraBase = {
  /** 基础底色 - 皇家深蓝（不再是纯黑） */
  bgPrimary: '#0F1B3D',
  /** 二级底色 - 星空靛 */
  bgSecondary: '#15224A',
  /** 卡片底色 - 玻璃通透 */
  bgCard: 'rgba(26, 36, 86, 0.55)',
  /** 卡片实色（fallback） */
  bgCardSolid: '#1A2456',
  /** 悬浮层 - 更亮玻璃 */
  bgElevated: 'rgba(30, 42, 95, 0.65)',
  /** 表格表头 */
  bgTertiary: 'rgba(15, 27, 61, 0.7)',
  /** 行情区背景 */
  bgQuote: 'rgba(21, 34, 74, 0.6)',
  /** 边框/分隔（细腻金属感） */
  border: 'rgba(148, 163, 184, 0.18)',
  borderSolid: '#2E3A6B',
  /** 次级边框 */
  borderMuted: 'rgba(148, 163, 184, 0.10)',
  /** K线网格 */
  grid: 'rgba(148, 163, 184, 0.08)',
  /** 坐标轴文字 */
  axis: '#7B89B8',
};

/** 极光五色 - 营造多色光晕呼吸效果 */
export const auroraGlow = {
  /** 皇家金 - 主品牌光 */
  gold: 'rgba(240, 185, 11, 0.35)',
  /** 钻石青 - 科技光 */
  cyan: 'rgba(56, 189, 248, 0.32)',
  /** 紫罗兰 - Web3 光 */
  violet: 'rgba(167, 139, 250, 0.30)',
  /** 翠绿 - 上涨光 */
  emerald: 'rgba(52, 211, 153, 0.25)',
  /** 玫瑰金 - 装饰光 */
  rose: 'rgba(244, 114, 182, 0.22)',
  /** 暮蓝 - 底部衬托 */
  blue: 'rgba(99, 102, 241, 0.28)',
};

/** 极光背景渐变 - 主页背景层 */
export const auroraBg = {
  /** 顶部主渐变 - 金→紫→青 */
  meshTop: `
    radial-gradient(ellipse 80% 60% at 20% 0%, rgba(240, 185, 11, 0.20) 0%, transparent 60%),
    radial-gradient(ellipse 70% 50% at 80% 10%, rgba(167, 139, 250, 0.18) 0%, transparent 60%),
    radial-gradient(ellipse 90% 70% at 50% 30%, rgba(56, 189, 248, 0.12) 0%, transparent 70%)
  `,
  /** 中部渐变 - 紫→青 */
  meshMid: `
    radial-gradient(ellipse 60% 50% at 30% 50%, rgba(124, 58, 237, 0.18) 0%, transparent 60%),
    radial-gradient(ellipse 70% 50% at 80% 60%, rgba(56, 189, 248, 0.15) 0%, transparent 60%)
  `,
  /** 底部渐变 - 蓝→青 */
  meshBottom: `
    radial-gradient(ellipse 80% 60% at 50% 100%, rgba(99, 102, 241, 0.20) 0%, transparent 60%),
    radial-gradient(ellipse 50% 40% at 10% 90%, rgba(56, 189, 248, 0.15) 0%, transparent 60%)
  `,
  /** 整体 - 基础底色（兜底） */
  base: 'linear-gradient(180deg, #0F1B3D 0%, #131E45 50%, #0F1B3D 100%)',
};

/** 官网文字色阶（高对比白系列） */
export const auroraText = {
  /** 主文字 - 雪白 */
  primary: '#F8FAFC',
  /** 价格/数字 - 亮白 */
  emphasis: '#FFFFFF',
  /** 次文字 - 雾灰 */
  secondary: '#B4C0E0',
  /** 辅助文字 */
  muted: '#7B89B8',
  /** 占位/禁用 */
  disabled: '#4A5680',
};

/** 皇家金色系 - v6 保留 v7 加强 */
export const royalGold = {
  primary: '#F0B90B',
  bright: '#FCD535',
  deep: '#E8A317',
  rose: '#EAB308',
  bgLight: 'rgba(240, 185, 11, 0.12)',
  bgLighter: 'rgba(240, 185, 11, 0.06)',
  borderLight: 'rgba(240, 185, 11, 0.30)',
  borderStrong: 'rgba(240, 185, 11, 0.60)',
  textGradient: 'linear-gradient(135deg, #FCD535 0%, #F0B90B 50%, #E8A317 100%)',
  buttonGradient: 'linear-gradient(135deg, #FCD535 0%, #F0B90B 100%)',
  /** v7 新增 - 高光渐变（更亮） */
  shineGradient: 'linear-gradient(135deg, #FEF3C7 0%, #FCD535 30%, #F0B90B 70%, #E8A317 100%)',
};

// ============================================================
// 二、管理后台 浅色系统 (Light Admin Theme) - 不变
// ============================================================

export const lightAdmin = {
  bgPrimary: '#F5F7FA',
  bgCard: '#FFFFFF',
  bgTableHeader: '#F9FAFB',
  bgHover: '#F3F4F6',
  bgInput: '#FFFFFF',
  border: '#E5E7EB',
  borderMuted: '#D1D5DB',
  sidebar: '#111827',
  sidebarActive: '#1677FF',
  topbar: '#FFFFFF',
};

export const lightText = {
  primary: '#111827',
  secondary: '#6B7280',
  muted: '#9CA3AF',
  disabled: '#D1D5DB',
  sidebar: '#D1D5DB',
  sidebarActive: '#FFFFFF',
};

// ============================================================
// 三、统一语义色（跨系统）
// ============================================================

export const brand = {
  primary: '#1677FF',
  hover: '#4096FF',
  active: '#0958D9',
  light: '#E6F4FF',
  neon: '#38BDF8',
  web3Purple: '#7C3AED',
  compliance: '#4F46E5',
  /** v7 极光调色板 */
  gold: '#F0B90B',
  diamond: '#38BDF8',
  ruby: '#DC2626',
  emerald: '#10B981',
  /** v7 新增 - 极光紫 */
  auroraViolet: '#A78BFA',
  /** v7 新增 - 极光青 */
  auroraCyan: '#22D3EE',
  /** v7 新增 - 极光粉 */
  auroraRose: '#F472B6',
};

export const trading = {
  upPrimary: '#16C784',
  upSecondary: '#16A34A',
  downPrimary: '#EA3943',
  downSecondary: '#DC2626',
  upBgLight: 'rgba(22,199,132,0.12)',
  upBgLighter: 'rgba(22,199,132,0.08)',
  downBgLight: 'rgba(234,57,67,0.12)',
  downBgLighter: 'rgba(234,57,67,0.08)',
  upBgAdmin: 'rgba(22,163,74,0.10)',
  downBgAdmin: 'rgba(220,38,38,0.10)',
};

export const alert = {
  warning: '#F59E0B',
  warningLight: 'rgba(245,158,11,0.10)',
  highRisk: '#F97316',
  highRiskLight: 'rgba(249,115,22,0.10)',
  info: '#1677FF',
  infoLight: 'rgba(22,119,255,0.10)',
  frozen: '#7C3AED',
  frozenLight: 'rgba(124,58,237,0.10)',
};

// ============================================================
// 四、业务状态色
// ============================================================

export const userStatus = {
  normal: '#16A34A',
  noKyc: '#6B7280',
  kycPending: '#1677FF',
  kycRejected: '#DC2626',
  amlReview: '#F59E0B',
  highRisk: '#F97316',
  frozen: '#7C3AED',
  blacklist: '#DC2626',
};

export const txStatus = {
  pending: '#1677FF',
  confirming: '#F59E0B',
  success: '#16A34A',
  failed: '#DC2626',
  riskBlocked: '#F97316',
  amlCheck: '#4F46E5',
  manualReview: '#F59E0B',
  cancelled: '#6B7280',
};

export const orderStatus = {
  open: '#1677FF',
  filled: '#16A34A',
  partial: '#F59E0B',
  cancelled: '#6B7280',
  rejected: '#DC2626',
  liquidated: '#F97316',
};

export const riskLevel = {
  low: '#16A34A',
  medium: '#F59E0B',
  high: '#F97316',
  critical: '#DC2626',
  resolved: '#6B7280',
};

// ============================================================
// 五、渐变（v7 极光系）
// ============================================================

export const gradients = {
  bluePurple: 'linear-gradient(135deg, #1677FF 0%, #7C3AED 100%)',
  blueCyan: 'linear-gradient(135deg, #1677FF 0%, #38BDF8 100%)',
  /** v7 极光主背景（更通透多色） */
  auroraBase: 'linear-gradient(180deg, #0F1B3D 0%, #131E45 50%, #0F1B3D 100%)',
  web3: 'linear-gradient(135deg, #7C3AED 0%, #38BDF8 100%)',
  upTrend: 'linear-gradient(180deg, rgba(22,199,132,0.20) 0%, rgba(22,199,132,0) 100%)',
  downTrend: 'linear-gradient(180deg, rgba(234,57,67,0.20) 0%, rgba(234,57,67,0) 100%)',
  /** v7 玻璃卡片渐变（更通透） */
  auroraGlass: 'linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%)',
  auroraCard: 'linear-gradient(180deg, rgba(26, 36, 86, 0.65) 0%, rgba(21, 34, 74, 0.80) 100%)',
  goldGlow: 'linear-gradient(135deg, #FFB020 0%, #F7931A 100%)',
  premiumGlow: 'radial-gradient(circle at 30% 0%, rgba(22,119,255,0.15) 0%, transparent 50%)',
  /** v7 极光标题渐变（金→青→紫） */
  auroraTitle: 'linear-gradient(135deg, #FCD535 0%, #38BDF8 50%, #A78BFA 100%)',
  /** v7 极光金边 */
  auroraBorder: 'linear-gradient(135deg, #F0B90B 0%, #38BDF8 50%, #A78BFA 100%)',
  /** v7 顶部装饰光带 */
  auroraBeam: 'linear-gradient(90deg, transparent 0%, #F0B90B 20%, #38BDF8 50%, #A78BFA 80%, transparent 100%)',
};

// ============================================================
// 六、图表色板
// ============================================================

export const chartColorsWeb = [
  '#1677FF', '#38BDF8', '#A78BFA', '#16C784', '#F0B90B', '#F472B6',
];

export const chartColorsAdmin = [
  '#1677FF', '#16A34A', '#DC2626', '#F97316', '#7C3AED', '#6B7280',
];

// ============================================================
// 七、字体系统
// ============================================================

export const fontFamily = {
  sans: "'Inter', 'PingFang SC', 'Microsoft YaHei', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  mono: "'JetBrains Mono', 'Fira Code', 'DIN', 'Roboto Mono', Consolas, monospace",
  number: "'DIN', 'Roboto Mono', 'JetBrains Mono', monospace",
};

export const fontSize = {
  heroTitle: '56px',
  heroTitleLg: '80px',
  subtitle: '18px',
  subtitleLg: '22px',
  sectionTitle: '36px',
  sectionTitleLg: '48px',
  body: '16px',
  button: '14px',
  buttonLg: '16px',
  adminPageTitle: '20px',
  adminPageTitleLg: '24px',
  adminCardTitle: '16px',
  adminTableText: '13px',
  adminTableTextLg: '14px',
  adminHelper: '12px',
  adminKpi: '24px',
  adminKpiLg: '32px',
};

// ============================================================
// 八、间距系统
// ============================================================

export const spacing = {
  '0': '0px',
  '1': '4px',
  '2': '8px',
  '3': '12px',
  '4': '16px',
  '5': '20px',
  '6': '24px',
  '8': '32px',
  '10': '40px',
  '12': '48px',
  '16': '64px',
  '20': '80px',
  '24': '96px',
};

// ============================================================
// 九、圆角
// ============================================================

export const radius = {
  none: '0px',
  sm: '4px',
  md: '8px',
  lg: '12px',
  xl: '16px',
  '2xl': '24px',
  '3xl': '32px',
  full: '9999px',
};

// ============================================================
// 十、阴影（v7 极光阴影更通透）
// ============================================================

export const shadows = {
  glowBlue: '0 0 24px rgba(22, 119, 255, 0.30)',
  glowPurple: '0 0 24px rgba(124, 58, 237, 0.30)',
  glowGold: '0 0 32px rgba(240, 185, 11, 0.35)',
  /** v7 极光多层阴影 */
  glowAurora: '0 8px 32px rgba(56, 189, 248, 0.20), 0 0 64px rgba(167, 139, 250, 0.15)',
  card: '0 1px 3px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04)',
  cardHover: '0 4px 12px rgba(0, 0, 0, 0.08)',
  /** v7 极光卡片阴影 - 蓝紫金三层 */
  auroraCard: '0 8px 32px rgba(15, 27, 61, 0.4), 0 0 0 1px rgba(148, 163, 184, 0.10), 0 0 48px rgba(56, 189, 248, 0.08)',
  sm: '0 1px 2px rgba(0, 0, 0, 0.05)',
  md: '0 4px 6px rgba(0, 0, 0, 0.07)',
  lg: '0 10px 15px rgba(0, 0, 0, 0.08)',
  /** v7 极光按钮阴影 */
  ctaGlow: '0 4px 24px rgba(56, 189, 248, 0.35), 0 0 48px rgba(56, 189, 248, 0.15)',
  goldGlow: '0 4px 24px rgba(240, 185, 11, 0.45), 0 0 48px rgba(240, 185, 11, 0.20)',
};

// ============================================================
// 十一、动画（v7 增加极光流光）
// ============================================================

export const animation = {
  duration: {
    fast: '150ms',
    normal: '250ms',
    slow: '400ms',
    slower: '600ms',
    aurora: '12s',   // v7 极光呼吸
  },
  easing: {
    default: 'cubic-bezier(0.4, 0, 0.2, 1)',
    easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
    easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
    bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    /** v7 极光缓动 */
    aurora: 'cubic-bezier(0.45, 0, 0.55, 1)',
  },
};

// ============================================================
// 十二、Z-Index
// ============================================================

export const zIndex = {
  dropdown: 1000,
  sticky: 1020,
  modal: 1050,
  tooltip: 1070,
  toast: 1100,
};

// ============================================================
// 十三、Tailwind Extend
// ============================================================

export const tailwindExtend = {
  colors: {
    brand: {
      primary: brand.primary,
      hover: brand.hover,
      active: brand.active,
      light: brand.light,
      neon: brand.neon,
      web3: brand.web3Purple,
      compliance: brand.compliance,
      gold: brand.gold,
    },
    aurora: {
      base: auroraBase.bgPrimary,
      card: auroraBase.bgCardSolid,
      border: auroraBase.borderSolid,
    },
    light: {
      bg: lightAdmin.bgPrimary,
      card: lightAdmin.bgCard,
      thead: lightAdmin.bgTableHeader,
      hover: lightAdmin.bgHover,
      border: lightAdmin.border,
      'border-muted': lightAdmin.borderMuted,
      sidebar: lightAdmin.sidebar,
      'sidebar-active': lightAdmin.sidebarActive,
      topbar: lightAdmin.topbar,
    },
    up: {
      DEFAULT: trading.upPrimary,
      admin: trading.upSecondary,
      light: trading.upBgLight,
      lighter: trading.upBgLighter,
      'admin-light': trading.upBgAdmin,
    },
    down: {
      DEFAULT: trading.downPrimary,
      admin: trading.downSecondary,
      light: trading.downBgLight,
      lighter: trading.downBgLighter,
      'admin-light': trading.downBgAdmin,
    },
    warning: alert.warning,
    'warning-light': alert.warningLight,
    'high-risk': alert.highRisk,
    'high-risk-light': alert.highRiskLight,
    info: alert.info,
    'info-light': alert.infoLight,
    frozen: alert.frozen,
    'frozen-light': alert.frozenLight,
    'text-primary': 'var(--text-primary)',
    'text-secondary': 'var(--text-secondary)',
    'text-muted': 'var(--text-muted)',
    'text-disabled': 'var(--text-disabled)',
  },
  fontFamily: {
    sans: fontFamily.sans,
    mono: fontFamily.mono,
    number: fontFamily.number,
  },
  backgroundImage: {
    'gradient-blue-purple': gradients.bluePurple,
    'gradient-blue-cyan': gradients.blueCyan,
    'gradient-aurora': gradients.auroraBase,
    'gradient-aurora-card': gradients.auroraCard,
    'gradient-aurora-glass': gradients.auroraGlass,
    'gradient-web3': gradients.web3,
    'gradient-up': gradients.upTrend,
    'gradient-down': gradients.downTrend,
    'gradient-aurora-title': gradients.auroraTitle,
    'gradient-aurora-border': gradients.auroraBorder,
  },
  boxShadow: {
    'glow-blue': shadows.glowBlue,
    'glow-purple': shadows.glowPurple,
    'glow-gold': shadows.glowGold,
    'glow-aurora': shadows.glowAurora,
    'shadow-aurora-card': shadows.auroraCard,
    'shadow-cta-glow': shadows.ctaGlow,
    'shadow-gold-glow': shadows.goldGlow,
    'card': shadows.card,
    'card-hover': shadows.cardHover,
  },
  animation: {
    'fade-in': 'fadeIn 0.25s ease-out',
    'fade-in-up': 'fadeInUp 0.4s ease-out',
    'scale-in': 'scaleIn 0.3s ease-out',
    'ticker-scroll': 'tickerScroll 30s linear infinite',
    /** v7 极光呼吸 */
    'aurora-flow': 'auroraFlow 12s ease-in-out infinite',
    'aurora-drift': 'auroraDrift 18s ease-in-out infinite',
    'gold-shine': 'goldShine 3s ease-in-out infinite',
  },
  keyframes: {
    fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
    fadeInUp: { '0%': { opacity: '0', transform: 'translateY(10px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
    scaleIn: { '0%': { opacity: '0', transform: 'scale(0.95)' }, '100%': { opacity: '1', transform: 'scale(1)' } },
    tickerScroll: { '0%': { transform: 'translateX(0)' }, '100%': { transform: 'translateX(-50%)' } },
    /** v7 极光动画 - 多层光斑呼吸 */
    auroraFlow: {
      '0%, 100%': { transform: 'translate3d(0, 0, 0) scale(1)', opacity: '0.7' },
      '33%': { transform: 'translate3d(30px, -20px, 0) scale(1.1)', opacity: '1' },
      '66%': { transform: 'translate3d(-20px, 20px, 0) scale(0.95)', opacity: '0.8' },
    },
    auroraDrift: {
      '0%, 100%': { transform: 'translate3d(0, 0, 0) scale(1)', opacity: '0.6' },
      '50%': { transform: 'translate3d(-40px, 30px, 0) scale(1.15)', opacity: '0.9' },
    },
    goldShine: {
      '0%, 100%': { boxShadow: '0 0 24px rgba(240, 185, 11, 0.3)' },
      '50%': { boxShadow: '0 0 48px rgba(240, 185, 11, 0.6)' },
    },
  },
};

// ============================================================
// 十四、辅助函数
// ============================================================

export const getUserStatusColor = (status: string): string => {
  const map: Record<string, string> = userStatus;
  return map[status] || '#6B7280';
};

export const getTxStatusColor = (status: string): string => {
  const map: Record<string, string> = txStatus;
  return map[status] || '#6B7280';
};

export const getOrderStatusColor = (status: string): string => {
  const map: Record<string, string> = orderStatus;
  return map[status] || '#6B7280';
};

export const getRiskColor = (level: string): string => {
  const map: Record<string, string> = riskLevel;
  return map[level] || '#6B7280';
};

/** 兼容旧引用 */
export const brandColors = brand;
export const bgColors = auroraBase;
export const textColors = auroraText;
export const semanticColors = { ...trading, ...alert };
