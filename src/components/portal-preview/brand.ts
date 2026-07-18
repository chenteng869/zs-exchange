/**
 * Portal Preview 共享品牌与令牌（2026-07-18）
 *
 * 与永久记忆 UI/UX 硬约束对齐：
 *   - 明亮色系为主（white / #F8FAFC / 浅色调）
 *   - 中萨主品牌色 #1652F0
 *   - 严禁全暗色 slate-900/800 背景
 *
 * 用法：import { BRAND, STATUS } from '@/components/portal-preview/brand';
 */

export const BRAND = {
  // 主色
  primary: '#1652F0',
  primaryLt: '#EEF2FF',
  primaryDim: '#0F3FB8',
  // 状态色
  success: '#059669',
  successLt: '#ECFDF5',
  warning: '#D97706',
  warningLt: '#FEF3C7',
  danger: '#E11D48',
  dangerLt: '#FFE4E6',
  info: '#0891B2',
  infoLt: '#CFFAFE',
  purple: '#7C3AED',
  purpleLt: '#F3E8FF',
  gold: '#D97706',
  goldLt: '#FEF3C7',
  // 中性色
  text: '#0F172A',
  textSub: '#475569',
  textMute: '#94A3B8',
  border: '#E2E8F0',
  borderLt: '#F1F5F9',
  bg: '#F8FAFC',
  bgAlt: '#F1F5F9',
  card: '#FFFFFF',
  cardHover: '#FAFBFC',
} as const;

export const STATUS = {
  OPEN: { label: '正常运行', color: BRAND.success, bg: BRAND.successLt, dot: BRAND.success },
  BETA: { label: '内测中', color: BRAND.purple, bg: BRAND.purpleLt, dot: BRAND.purple },
  SOON: { label: '即将开放', color: BRAND.info, bg: BRAND.infoLt, dot: BRAND.info },
  MAINTENANCE: { label: '维护中', color: BRAND.warning, bg: BRAND.warningLt, dot: BRAND.warning },
  COMING: { label: '数据接入中', color: BRAND.textSub, bg: BRAND.borderLt, dot: BRAND.textMute },
  EMPTY: { label: '暂无数据', color: BRAND.textMute, bg: BRAND.borderLt, dot: BRAND.textMute },
  PRIVATE: { label: '登录后查看', color: BRAND.primary, bg: BRAND.primaryLt, dot: BRAND.primary },
} as const;

export type StatusKey = keyof typeof STATUS;
