// ==================== 官网类型定义 ====================

/** 导航菜单项 */
export interface NavItem {
  label: string;
  href: string;
  children?: NavItem[];
  /** 菜单项旁的徽标文字 (如 'HOT', 'NEW', '🇼🇸 持牌') */
  badge?: string;
  /** 按钮变体样式 */
  variant?: 'primary' | 'ghost';
  /** 分隔线 (用于下拉菜单中分组) */
  separator?: boolean;
  /** 高亮显示 */
  highlight?: boolean;
}

/** Hero统计卡片 */
export interface HeroStat {
  id: string;
  value: string;
  label: string;
  icon: string;
}

/** 牌照信息 */
export interface LicenseInfo {
  id: string;
  type: 'exchange' | 'stock';
  country: string;
  countryCode: string;
  licenseNumber: string;
  issuer: string;
  description: string;
  icon: string;
  status: 'active' | 'pending';
  issuedDate: string;
}

/** 业务引擎 */
export interface BusinessEngine {
  id: string;
  name: string;
  nameEn: string;
  icon: string;
  description: string;
  features: string[];
}

/** FAQ问答 */
export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: 'general' | 'trading' | 'security' | 'license';
}

/** 特性卡片 */
export interface FeatureItem {
  id: string;
  title: string;
  description: string;
  icon: string;
}

/** 安全项目 */
export interface SecurityItem {
  id: string;
  title: string;
  description: string;
  icon: string;
}

/** 入门步骤 */
export interface StepItem {
  id: number;
  title: string;
  description: string;
  icon: string;
}

/** 地址信息 */
export interface AddressInfo {
  region: string;
  city: string;
  address: string;
  phone?: string;
  email?: string;
  flag: string;
}

/** 三地节点信息 */
export interface NodeInfo {
  id: string;
  city: string;
  country: string;
  flag: string;
  role: string;
  roleEn: string;
  color: string;
  colorFrom: string;
  colorTo: string;
  isCore: boolean;
  assets: string[];
  position: { x: number; y: number };
}

/** 节点连线信息 */
export interface ConnectionInfo {
  from: string;
  to: string;
  type: 'primary' | 'secondary';
  label?: string;
}

/** 交易对行情 */
export interface TickerData {
  symbol: string;
  baseAsset: string;
  quoteAsset: string;
  price: number;
  change24h: number;
  volume24h: number;
  high24h: number;
  low24h: number;
  marketCap?: number;
}

/** 统计栏数据 */
export interface StatsBarData {
  symbol: string;
  price: number;
  change24h: number;
  marketCap: string;
  volume24h: string;
}
