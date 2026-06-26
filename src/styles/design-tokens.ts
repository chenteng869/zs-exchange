/**
 * ZS Exchange (智所交易所) 设计令牌系统
 *
 * 基于 Tailwind CSS 的完整设计系统，支持暗色/亮色双主题
 * 可直接在 tailwind.config.js 和全局CSS中引用
 *
 * 使用方式：
 * - TypeScript: import { tokens, cssVariables } from '@/styles/design-tokens'
 * - Tailwind: theme.extend.colors = tokens.dark.colors
 * - CSS: var(--accent-primary)
 */

// ==================== 类型定义 ====================

/** 颜色令牌类型 */
interface ColorTokens {
  /** 主背景 - 深空蓝黑 */
  bgPrimary: string;
  /** 次级背景 - 灰蓝卡片 */
  bgSecondary: string;
  /** 三级背景 - 更浅灰悬停 */
  bgTertiary: string;
  /** 边框颜色 */
  borderColor: string;
  /** 主强调色 - 翠绿(正常/成功/上涨) */
  accentPrimary: string;
  /** 警告色 - 琥珀(警告/待处理) */
  accentWarning: string;
  /** 危险色 - 红色(错误/危险/下跌) */
  accentDanger: string;
  /** 信息色 - 蓝色(信息/中性) */
  accentInfo: string;
  /** 紫色 - AI/智能体 */
  accentPurple: string;
}

/** 文字颜色令牌 */
interface TextColors {
  /** 主要文字 - 高对比度 */
  primary: string;
  /** 次要文字 - 中等对比度 */
  secondary: string;
  /** 弱化文字 - 辅助说明 */
  muted: string;
  /** 禁用文字 - 最低可见度 */
  disabled: string;
}

/** 完整主题颜色 */
interface ThemeColors extends ColorTokens {
  text: TextColors;
}

/** 间距令牌（基于4px基准） */
interface SpacingTokens {
  /** 4px */
  '1': string;
  /** 8px */
  '2': string;
  /** 12px */
  '3': string;
  /** 16px */
  '4': string;
  /** 20px */
  '5': string;
  /** 24px */
  '6': string;
  /** 28px */
  '7': string;
  /** 32px */
  '8': string;
  /** 36px */
  '9': string;
  /** 40px */
  '10': string;
  /** 48px */
  '11': string;
  /** 56px */
  '12': string;
}

/** 阴影令牌 */
interface ShadowTokens {
  /** 小阴影 - 微妙提升 */
  sm: string;
  /** 中等阴影 - 卡片悬浮 */
  md: string;
  /** 大阴影 - 弹窗/模态框 */
  lg: string;
  /** 超大阴影 - 全屏覆盖层 */
  xl: string;
  /** 发光效果 - 强调元素光晕 */
  glow: string;
}

/** 圆角令牌 */
interface RadiusTokens {
  /** 无圆角 */
  none: string;
  /** 小圆角 - 2px */
  sm: string;
  /** 中圆角 - 6px */
  md: string;
  /** 大圆角 - 12px */
  lg: string;
  /** 超大圆角 - 16px */
  xl: string;
  /** 完全圆形 */
  full: string;
}

/** 字体令牌 */
interface FontTokens {
  /** 字体家族 */
  family: string;
  /** 尺寸映射 */
  sizes: Record<string, string>;
  /** 字重映射 */
  weights: Record<string, string>;
}

/** 动画时长令牌 */
interface DurationTokens {
  /** 快速动画 - 150ms */
  fast: string;
  /** 正常动画 - 250ms */
  normal: string;
  /** 慢速动画 - 400ms */
  slow: string;
}

/** z-index 层级令牌 */
interface ZIndexTokens {
  /** 下拉菜单 */
  dropdown: number;
  /** 吸附定位 */
  sticky: number;
  /** 模态框 */
  modal: number;
  /** 工具提示 */
  tooltip: number;
  /** 通知消息 */
  toast: number;
}

/** 完整主题令牌 */
interface ThemeTokens {
  colors: ThemeColors;
  spacing: SpacingTokens;
  shadows: ShadowTokens;
  radius: RadiusTokens;
  font: FontTokens;
  duration: DurationTokens;
  zIndex: ZIndexTokens;
}

/** CSS 变量名到值的映射 */
type CssVariableMap = Record<string, string>;

// ==================== 暗色主题（默认） ====================

/** 暗色主题颜色定义 */
const darkColors: ThemeColors = {
  // 背景与边框
  bgPrimary: '#1A1D24',
  bgSecondary: '#111827',
  bgTertiary: '#1F2937',
  borderColor: '#2E333D',

  // 强调色系
  accentPrimary: '#00D4AA',   // 翠绿 - 正常/成功/上涨
  accentWarning: '#F59E0B',   // 琥珀 - 警告/待处理
  accentDanger: '#EF4444',    // 红色 - 错误/危险/下跌
  accentInfo: '#3B82F6',      // 蓝色 - 信息/中性
  accentPurple: '#8B5CF6',    // 紫色 - AI/智能体

  // 文字层级（暗色背景上的文字）
  text: {
    primary: '#F9FAFB',       // 主要文字 - 接近白色
    secondary: '#D1D5DB',     // 次要文字 - 浅灰色
    muted: '#9CA3AF',         // 弱化文字 - 中灰色
    disabled: '#6B7280',      // 禁用文字 - 深灰色
  },
};

// ==================== 亮色主题 ====================

/** 亮色主题颜色定义 */
const lightColors: ThemeColors = {
  // 背景与边框
  bgPrimary: '#FFFFFF',
  bgSecondary: '#F8FAFC',
  bgTertiary: '#F1F5F9',
  borderColor: '#E2E8F0',

  // 强调色系（保持品牌一致性，微调以适应亮色背景）
  accentPrimary: '#059669',   // 翠绿 - 加深以适应白底
  accentWarning: '#D97706',   // 琥珀 - 加深
  accentDanger: '#DC2626',    // 红色 - 加深
  accentInfo: '#2563EB',      // 蓝色 - 加深
  accentPurple: '#7C3AED',    // 紫色 - 加深

  // 文字层级（亮色背景上的文字）
  text: {
    primary: '#111827',       // 主要文字 - 接近黑色
    secondary: '#374151',     // 次要文字 - 深灰色
    muted: '#6B7280',         // 弱化文字 - 中灰色
    disabled: '#9CA3AF',      // 禁用文字 - 浅灰色
  },
};

// ==================== 间距系统（基于4px基准） ====================

/** 间距令牌：从 spacing-1 (4px) 到 spacing-12 (56px) */
const spacing: SpacingTokens = {
  '1': '4px',
  '2': '8px',
  '3': '12px',
  '4': '16px',
  '5': '20px',
  '6': '24px',
  '7': '28px',
  '8': '32px',
  '9': '36px',
  '10': '40px',
  '11': '48px',
  '12': '56px',
};

// ==================== 阴影系统 ====================

/** 阴影令牌：适用于不同层级的UI元素 */
const shadows: ShadowTokens = {
  // 小阴影 - 微妙提升（按钮、小卡片）
  sm: '0 1px 2px rgba(0, 0, 0, 0.05)',

  // 中等阴影 - 卡片悬浮状态
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',

  // 大阴影 - 弹窗、模态框
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',

  // 超大阴影 - 全屏覆盖层、侧边栏
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',

  // 发光效果 - 强调元素（CTA按钮、重要指标）
  glow: '0 0 20px rgba(0, 212, 170, 0.3)',
};

// ==================== 圆角系统 ====================

/** 圆角令牌：从无圆角到完全圆形 */
const radius: RadiusTokens = {
  none: '0px',          // 无圆角 - 表格、代码块
  sm: '2px',           // 小圆角 - 输入框、小按钮
  md: '6px',           // 中圆角 - 卡片、标签
  lg: '12px',          // 大圆角 - 对话框、大卡片
  xl: '16px',          // 超大圆角 - 模态框容器
  full: '9999px',      // 完全圆形 - 头像、药丸按钮
};

// ==================== 字体系统 ====================

/** 字体令牌：Geist Sans 为主字体，Inter 为回退 */
const font: FontTokens = {
  // 字体栈：Geist Sans > Inter > 系统默认无衬线
  family: "'Geist Sans', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",

  // 常用字号（可扩展）
  sizes: {
    xs: '0.75rem',     // 12px
    sm: '0.875rem',    // 14px
    base: '1rem',      // 16px
    lg: '1.125rem',    // 18px
    xl: '1.25rem',     // 20px
    '2xl': '1.5rem',   // 24px
    '3xl': '1.875rem', // 30px
    '4xl': '2.25rem',  // 36px
  },

  // 字重
  weights: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
};

// ==================== 动画时长 ====================

/** 动画时长令牌：统一过渡时间 */
const duration: DurationTokens = {
  fast: '150ms',     // 快速 - hover、focus 状态
  normal: '250ms',   // 正常 - 展开/收起、淡入淡出
  slow: '400ms',     // 慢速 - 页面切换、复杂动画
};

// ==================== z-index 层级 ====================

/** z-index 层级令牌：确保正确的堆叠顺序 */
const zIndex: ZIndexTokens = {
  dropdown: 1000,     // 下拉菜单
  sticky: 1020,       // 吸附头部
  modal: 1050,        // 模态框遮罩
  tooltip: 1070,      // 工具提示
  toast: 1100,        // 通知消息
};

// ==================== 主题对象导出 ====================

/** 暗色主题完整令牌 */
export const darkTheme: ThemeTokens = {
  colors: darkColors,
  spacing,
  shadows,
  radius,
  font,
  duration,
  zIndex,
};

/** 亮色主题完整令牌 */
export const lightTheme: ThemeTokens = {
  colors: lightColors,
  spacing,
  shadows,
  radius,
  font,
  duration,
  zIndex,
};

/** 默认导出暗色主题（项目主主题） */
export const tokens: ThemeTokens = darkTheme;

// ==================== CSS 变量生成 ====================

/**
 * 将主题颜色转换为 CSS 自定义属性格式
 * 用于 :root 或 [data-theme="dark"] 选择器
 */
function generateCssVariables(colors: ThemeColors, prefix: string = ''): CssVariableMap {
  const vars: CssVariableMap = {};

  // 背景色
  vars[`${prefix}bg-primary`] = colors.bgPrimary;
  vars[`${prefix}bg-secondary`] = colors.bgSecondary;
  vars[`${prefix}bg-tertiary`] = colors.bgTertiary;
  vars[`${prefix}border-color`] = colors.borderColor;

  // 强调色
  vars[`${prefix}accent-primary`] = colors.accentPrimary;
  vars[`${prefix}accent-warning`] = colors.accentWarning;
  vars[`${prefix}accent-danger`] = colors.accentDanger;
  vars[`${prefix}accent-info`] = colors.accentInfo;
  vars[`${prefix}accent-purple`] = colors.accentPurple;

  // 文字色
  vars[`${prefix}text-primary`] = colors.text.primary;
  vars[`${prefix}text-secondary`] = colors.text.secondary;
  vars[`${prefix}text-muted`] = colors.text.muted;
  vars[`${prefix}text-disabled`] = colors.text.disabled;

  return vars;
}

/** 暗色主题 CSS 变量（用于 :root 或 data-theme="dark"） */
export const darkCssVariables: CssVariableMap = generateCssVariables(darkColors);

/** 亮色主题 CSS 变量（用于 data-theme="light"） */
export const lightCssVariables: CssVariableMap = generateCssVariables(lightColors);

/**
 * 默认 CSS 变量导出（暗色主题）
 * 直接在 globals.css 或组件样式中使用：
 * color: var(--accent-primary);
 * background-color: var(--bg-secondary);
 */
export const cssVariables: CssVariableMap = darkCssVariables;

// ==================== Tailwind 配置辅助 ====================

/**
 * 生成 Tailwind extend 配置
 * 在 tailwind.config.js 中使用：
 * import { tailwindExtend } from '@/styles/design-tokens';
 * module.exports = { theme: { extend: tailwindExtend } };
 */
export const tailwindExtend = {
  colors: {
    // 背景色
    'bg-primary': lightColors.bgPrimary,
    'bg-secondary': lightColors.bgSecondary,
    'bg-tertiary': lightColors.bgTertiary,

    // 边框
    'border-color': lightColors.borderColor,

    // 强调色
    'accent-primary': lightColors.accentPrimary,
    'accent-warning': lightColors.accentWarning,
    'accent-danger': lightColors.accentDanger,
    'accent-info': lightColors.accentInfo,
    'accent-purple': lightColors.accentPurple,

    // 文字色
    'text-primary': lightColors.text.primary,
    'text-secondary': lightColors.text.secondary,
    'text-muted': lightColors.text.muted,
    'text-disabled': lightColors.text.disabled,
  },
  boxShadow: {
    'token-sm': shadows.sm,
    'token-md': shadows.md,
    'token-lg': shadows.lg,
    'token-xl': shadows.xl,
    'token-glow': shadows.glow,
  },
  borderRadius: {
    'token-none': radius.none,
    'token-sm': radius.sm,
    'token-md': radius.md,
    'token-lg': radius.lg,
    'token-xl': radius.xl,
    'token-full': radius.full,
  },
  fontFamily: {
    sans: font.family,
  },
  transitionDuration: {
    'token-fast': duration.fast,
    'token-normal': duration.normal,
    'token-slow': duration.slow,
  },
  zIndex: {
    'dropdown': zIndex.dropdown,
    'sticky': zIndex.sticky,
    'modal': zIndex.modal,
    'tooltip': zIndex.tooltip,
    'toast': zIndex.toast,
  },
};

// ==================== 工具函数 ====================

/**
 * 获取指定主题的 CSS 变量字符串
 * 用于动态注入到 <style> 标签或 CSS-in-JS 方案中
 *
 * @param theme - 'dark' | 'light'
 * @returns CSS 变量声明字符串
 */
export function getThemeCssString(theme: 'dark' | 'light' = 'dark'): string {
  const vars = theme === 'dark' ? darkCssVariables : lightCssVariables;
  return Object.entries(vars)
    .map(([key, value]) => `  --${key}: ${value};`)
    .join('\n');
}

/**
 * 生成完整的 CSS 变量块（带选择器）
 * 可直接复制到 globals.css 中使用
 *
 * @example
 * // 暗色主题（默认，用于 :root）
 * getThemeCssBlock('dark')
 * // =>
 * // :root {
 * //   --bg-primary: #0B0F19;
 * //   ...
 * // }
 *
 * // 亮色主题（用于 [data-theme="light"]）
 * getThemeCssBlock('light', '[data-theme="light"]')
 */
export function getThemeCssBlock(
  theme: 'dark' | 'light' = 'dark',
  selector: string = ':root'
): string {
  const cssString = getThemeCssString(theme);
  return `${selector} {\n${cssString}\n}`;
}
