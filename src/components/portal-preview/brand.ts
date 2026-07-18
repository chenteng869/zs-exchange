/**
 * Portal Preview 共享品牌与令牌（2026-07-18 纯黑无色相 v6）
 *
 * 主题切换背景：
 *   v1 暗色（Stitch）→ v2 冷蓝紫（Binance 骨架）→ v3 加强锚点
 *   → v4 暖金（用户否定）→ v5 ZSDEX 绿主色 + 暖黑底（用户否定底色）
 *   → v6 纯黑无色相底 + ZSDEX 绿主色（用户 2026-07-18 选择"纯黑无色相"）
 *
 * 用户需求澄清：
 *   v5 的 #0D0B07 暖黑带红/棕底被用户视为"灰黑"，不符合预期。
 *   v6 严格按"无色相"原则：底色纯黑、卡片中性灰、文字纯白、边框冷深灰，
 *   仅保留 ZSDEX 绿作为唯一有色相强调。
 *
 * 关键色值映射（v5 → v6）：
 *   - bg #0D0B07（暖黑）           → #000000（纯黑）
 *   - bgAlt #080603               → #000000（纯黑）
 *   - bgCard #1F1A12（暖灰带金）  → #141414（中性深灰）
 *   - bgCardHover #2A2317         → #1C1C1C
 *   - card #1F1A12                → #141414
 *   - cardHover #2A2317           → #1C1C1C
 *   - cardElevated #332B1C        → #252525
 *   - cardGlass rgba(31,26,18,.7)  → rgba(20,20,20,0.7)
 *   - text #F0E9D8（暖白）        → #FFFFFF（纯白，对比最强）
 *   - textSub #B8AD96（暖灰）     → #B0B0B0（中性灰）
 *   - textMute #807560            → #707070
 *   - textDisabled #5A5040        → #4A4A4A
 *   - border #332B1C（暖深棕）    → #2D2D2D（冷深灰）
 *   - borderStrong #4A3F26        → #3D3D3D
 *   - headerBg rgba(13,11,7,.85)  → rgba(0,0,0,0.85)
 *
 * 用法：import { BRAND, STATUS } from '@/components/portal-preview/brand';
 */

export const BRAND = {
  // === 主品牌色（ZSDEX 绿主轴，保留 v5） ===
  primary: '#14B881',                    // ZSDEX 品牌绿
  primaryLt: 'rgba(20, 184, 129, 0.12)',
  primaryDim: '#0E9B6A',
  primaryContainer: '#0E9B6A',           // 深 ZSDEX 绿 CTA
  onPrimary: '#ffffff',                  // 白字

  // === ZSDEX 绿系（兼容旧引用） ===
  gold: '#14B881',
  goldLt: 'rgba(20, 184, 129, 0.12)',
  goldDim: '#0E9B6A',
  onGold: '#ffffff',

  // === 状态色（行业通用） ===
  success: '#0ECB81',                    // 上涨绿（与 primary 略区分）
  successLt: 'rgba(14, 203, 129, 0.12)',
  danger: '#F6465D',                     // 下跌红
  dangerLt: 'rgba(246, 70, 93, 0.12)',
  warning: '#FFA940',                    // 警告琥珀
  warningLt: 'rgba(255, 169, 64, 0.12)',
  info: '#44dbf4',                       // 信息蓝
  infoLt: 'rgba(68, 219, 244, 0.12)',
  amber: '#FFA940',
  amberLt: 'rgba(255, 169, 64, 0.12)',
  purple: '#FFA940',
  purpleLt: 'rgba(255, 169, 64, 0.12)',

  // === 中性色（无色相：纯黑底 + 中性灰） ===
  text: '#FFFFFF',                       // 主文字（纯白）
  textSub: '#B0B0B0',                    // 次要文字（中性灰）
  textMute: '#707070',                   // 弱化文字
  textDisabled: '#4A4A4A',               // 禁用态
  border: '#2D2D2D',                     // 主边框（冷深灰）
  borderLt: 'rgba(45, 45, 45, 0.5)',
  borderStrong: '#3D3D3D',               // 强边框
  outline: '#4A4A4A',

  // === 背景（无色相三级层级） ===
  bg: '#000000',                         // L0 页面底色（纯黑）
  bgAlt: '#000000',                      // L0+ 渐变深色（纯黑）
  bgCard: '#141414',                     // L1 卡片底色（中性深灰）
  bgCardHover: '#1C1C1C',                // L1 hover 层
  card: '#141414',                       // 默认卡片底色
  cardHover: '#1C1C1C',                  // 卡片 hover
  cardElevated: '#252525',               // L2 浮层/抽屉底色
  cardGlass: 'rgba(20, 20, 20, 0.7)',    // 玻璃态

  // === 阴影（中性黑） ===
  shadow: '0 1px 2px rgba(0,0,0,0.50)',
  shadowMd: '0 8px 24px rgba(0,0,0,0.60)',
  shadowLg: '0 24px 48px -12px rgba(0,0,0,0.80)',
  shadowGold: '0 8px 24px rgba(20, 184, 129, 0.30)', // ZSDEX 绿 CTA 发光

  // === 遮罩与滚动背景 ===
  headerBg: 'rgba(0, 0, 0, 0.85)',       // 滚动后 header 半透明纯黑
  overlay: 'rgba(0, 0, 0, 0.75)',        // 通用遮罩
} as const;

export const STATUS = {
  OPEN: { label: '正常运行', color: BRAND.success, bg: BRAND.successLt, dot: BRAND.success },
  BETA: { label: '内测中', color: BRAND.amber, bg: BRAND.amberLt, dot: BRAND.amber },
  SOON: { label: '即将开放', color: BRAND.info, bg: BRAND.infoLt, dot: BRAND.info },
  MAINTENANCE: { label: '维护中', color: BRAND.warning, bg: BRAND.warningLt, dot: BRAND.warning },
  COMING: { label: '数据接入中', color: BRAND.textSub, bg: 'rgba(176, 176, 176, 0.10)', dot: BRAND.textMute },
  EMPTY: { label: '暂无数据', color: BRAND.textMute, bg: 'rgba(112, 112, 112, 0.08)', dot: BRAND.textMute },
  PRIVATE: { label: '登录后查看', color: BRAND.primary, bg: BRAND.primaryLt, dot: BRAND.primary },
  HOT: { label: '热门', color: BRAND.onGold, bg: BRAND.gold, dot: BRAND.gold },
} as const;

export type StatusKey = keyof typeof STATUS;
