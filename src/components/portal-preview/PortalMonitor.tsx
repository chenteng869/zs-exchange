'use client';

/**
 * PortalMonitor - 资产安全监控中心（2026-07-19 Q05 P3.23）
 *
 * 页面定位：
 * - 中萨数字科技交易所 资产安全监控中心
 * - 实时风控仪表盘 / 异常告警 / 大额监控 / 应急冻结 / 规则引擎 / 审计追溯
 * - 与 P3.16 安全 / P3.21 客服告警 形成"安全-监控"实操闭环
 *
 * L4 工业级设计标准：
 * - 暗色 v6 纯黑 #000000 + 卡片 #141414 + ZSDEX 绿 primary #14B881
 * - 10 大区块：Hero / 实时 KPI / 风险地图 / 实时告警 / 大额监控 / 异常行为 / 应急冻结 / 规则引擎 / 审计追溯 / 帮助 / 底部 CTA
 * - 9+ 交互：Tab 切换 / 告警筛选 / 搜索 / 排序 / 风险等级过滤 / 详情 Drawer / 应急操作模拟 / 快捷键
 * - 5+ Drawer：告警详情 / 规则详情 / 应急冻结向导 / 审计详情 / 快捷键
 * - 4+ 实时数据：实时告警 / 风险拦截 / 风险评分 / 待处理事件
 * - 4+ 动画：Stagger / CountUp / Hover / Pulse
 *
 * 合规要点（Q05 硬约束）：
 * - 所有风控数据 / 告警 / 应急操作使用 mock 占位
 * - 状态徽章统一使用 STATUS 枚举
 * - 不修改旧官网 / 旧 H5 / disabled pages / brand.ts / SPEC.md
 * - 应急冻结等高风险操作仅做 UI 演示，不接真实风控引擎
 * - 风控数据为内部估算口径，不构成反洗钱/反欺诈的绝对保证
 */

import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import {
  Search,
  X,
  ChevronRight,
  ChevronLeft,
  ChevronUp,
  ChevronDown,
  Filter,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  KeyRound,
  AlertTriangle,
  AlertOctagon,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Clock,
  Calendar,
  Hash,
  User,
  Users,
  UserCheck,
  Building2,
  Briefcase,
  Mail,
  Phone,
  MapPin,
  Globe2,
  Activity,
  Zap,
  Flame,
  Bell,
  BellOff,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowRight,
  Plus,
  Minus,
  Copy,
  ExternalLink,
  Download,
  Upload,
  FileText,
  Database,
  Server,
  Cloud,
  Cpu,
  Network,
  Layers,
  Code2,
  Terminal,
  GitBranch,
  GitCommit,
  Workflow,
  Settings,
  Sliders,
  RefreshCw,
  RotateCw,
  Sparkles,
  Star,
  Heart,
  Award,
  Trophy,
  Crown,
  Target,
  Crosshair,
  Compass,
  Map,
  Keyboard,
  HelpCircle,
  Info,
  Lightbulb,
  Send,
  Paperclip,
  MessageCircle,
  MessageSquare,
  Languages,
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  Camera,
  Fingerprint,
  ScanFace,
  Wifi,
  WifiOff,
  Smartphone,
  Monitor,
  Tablet,
  PlayCircle,
  PauseCircle,
  StopCircle,
  SkipForward,
  SkipBack,
  FastForward,
  Rewind,
  Repeat,
  Shuffle,
  Tag,
  Tags,
  Flag,
  Bookmark,
  LifeBuoy,
  Radio,
  Megaphone,
  Siren,
  Power,
  PowerOff,
  Snowflake,
  Flame as FlameIcon,
} from 'lucide-react';
import { BRAND, STATUS } from './brand';

// ============== 类型 ==============

type Tab = 'overview' | 'alerts' | 'large' | 'abnormal' | 'freeze' | 'rules' | 'audit' | 'help';
type AlertSeverity = 'critical' | 'high' | 'medium' | 'low' | 'info';
type AlertStatus = 'new' | 'investigating' | 'escalated' | 'resolved' | 'false-positive' | 'suppressed';
type AlertCategory = 'large-tx' | 'velocity' | 'geo-anomaly' | 'device-anomaly' | 'login-anomaly' | 'kyc-anomaly' | 'withdraw-anomaly' | 'api-anomaly' | 'wash-trade' | 'structuring' | 'sanctions';
type RuleAction = 'block' | 'review' | 'notify' | 'mfa-required' | 'freeze-account' | 'rate-limit';
type FreezeType = 'withdraw' | 'login' | 'trading' | 'full' | 'api';
type FreezeStatus = 'pending' | 'approved' | 'active' | 'expired' | 'revoked';
type AuditCategory = 'config-change' | 'rule-deploy' | 'manual-freeze' | 'manual-unfreeze' | 'whitelist-change' | 'role-change' | 'data-export' | 'login' | 'alert-ack';

interface Alert {
  id: string;
  title: string;
  category: AlertCategory;
  severity: AlertSeverity;
  status: AlertStatus;
  subject: string; // user id / tx hash
  amount?: number;
  currency?: string;
  triggeredAt: string;
  description: string;
  evidence: string[];
  ruleId: string;
  riskScore: number;
  assignee?: string;
  notes?: string;
  related: string[];
}

interface LargeTransaction {
  id: string;
  txHash: string;
  userId: string;
  userKyc: 'basic' | 'advanced' | 'pro';
  type: 'deposit' | 'withdraw' | 'transfer' | 'trade';
  amount: number;
  currency: string;
  usdValue: number;
  timestamp: string;
  status: 'pending' | 'completed' | 'flagged' | 'blocked';
  destination?: string;
  source?: string;
  riskLevel: AlertSeverity;
  flags: string[];
}

interface Rule {
  id: string;
  name: string;
  description: string;
  category: string;
  enabled: boolean;
  priority: number;
  trigger: string;
  action: RuleAction;
  hitCount: number;
  hitLast24h: number;
  falsePositiveRate: number;
  lastUpdated: string;
  owner: string;
  thresholds: { metric: string; op: string; value: string }[];
}

interface Freeze {
  id: string;
  type: FreezeType;
  target: string;
  reason: string;
  status: FreezeStatus;
  initiatedBy: string;
  initiatedAt: string;
  approvedBy?: string;
  expiresAt?: string;
  relatedAlertId?: string;
  impact: { withdraw: boolean; login: boolean; trading: boolean; api: boolean };
}

interface AuditLog {
  id: string;
  timestamp: string;
  actor: string;
  action: AuditCategory;
  target: string;
  details: string;
  ip: string;
  userAgent: string;
  result: 'success' | 'failure' | 'partial';
  riskLevel: AlertSeverity;
}

interface KpiSnapshot {
  activeAlerts: number;
  blockedTx: number;
  avgRiskScore: number;
  pendingReviews: number;
  monitorUsers: number;
  liveTx: number;
  riskRules: number;
  frozenAccounts: number;
}

interface DrawerState {
  open: boolean;
  type: 'alert' | 'rule' | 'freeze' | 'audit' | 'help' | 'large' | null;
  payload: string | null;
}

// ============== Mock 数据 ==============

const ALERTS: Alert[] = [
  {
    id: 'al-2026-07-19-001',
    title: '单笔大额提现触发风控',
    category: 'large-tx',
    severity: 'critical',
    status: 'investigating',
    subject: 'U-8821***',
    amount: 480000,
    currency: 'USDT',
    triggeredAt: '2026-07-19 10:18',
    description: '用户 U-8821*** 在 5 分钟内发起 48 万 USDT 提现，超过基础 KYC 单笔上限 10 万 USDT，需人工复核。',
    evidence: ['订单号: WD-2026-0719-***-8421', '提现地址: 0x****7421', '近 30 日累计提现 124 万 USDT'],
    ruleId: 'R-018',
    riskScore: 92,
    assignee: '风控-A',
    related: ['tx-001', 'user-profile-8821'],
  },
  {
    id: 'al-2026-07-19-002',
    title: '异国 IP 凌晨登录',
    category: 'geo-anomaly',
    severity: 'high',
    status: 'new',
    subject: 'U-4228***',
    triggeredAt: '2026-07-19 04:42',
    description: '用户 U-4228*** 在常用城市北京之外（IP 归属：俄罗斯莫斯科）于凌晨 4:42 登录，触发异地异时风险规则。',
    evidence: ['IP: 178.***.62.41 (俄罗斯)', '设备: iPhone 15 Pro (新设备)', '距离上次登录 2,148 km'],
    ruleId: 'R-007',
    riskScore: 78,
    related: [],
  },
  {
    id: 'al-2026-07-19-003',
    title: '高频 API 调用异常',
    category: 'api-anomaly',
    severity: 'high',
    status: 'escalated',
    subject: 'API-Key-***-3a2f',
    triggeredAt: '2026-07-19 09:55',
    description: 'API Key ***3a2f 在 60 秒内调用 1,840 次（普通用户均值 12 次/分钟），触发频率异常。',
    evidence: ['QPS 峰值 30.6', '超出阈值 50 倍', '无对应业务场景'],
    ruleId: 'R-024',
    riskScore: 85,
    assignee: '风控-B',
    related: [],
  },
  {
    id: 'al-2026-07-19-004',
    title: '可疑拆分交易',
    category: 'structuring',
    severity: 'high',
    status: 'investigating',
    subject: 'U-1245***',
    amount: 80000,
    currency: 'USDT',
    triggeredAt: '2026-07-19 10:02',
    description: '24 小时内 8 笔交易，每笔 9,999 USDT（接近 1 万报告阈值），疑似拆分规避 AML 监测。',
    evidence: ['8 笔连续 9,999 USDT 转账', '接收地址相同', '资金来源: 5 个不同来源地址'],
    ruleId: 'R-031',
    riskScore: 88,
    assignee: '风控-A',
    related: [],
  },
  {
    id: 'al-2026-07-19-005',
    title: '对手方命中制裁名单',
    category: 'sanctions',
    severity: 'critical',
    status: 'resolved',
    subject: 'U-9961***',
    amount: 5200,
    currency: 'ETH',
    triggeredAt: '2026-07-19 08:30',
    description: '提现目标地址命中 OFAC SDN 制裁名单，已自动拦截并通知合规团队。',
    evidence: ['OFAC SDN Match: 100%', '地址: 0x****dead', '已冻结资产'],
    ruleId: 'R-040',
    riskScore: 100,
    assignee: '合规-A',
    notes: '已上报合规部门，按监管要求处理。',
    related: [],
  },
  {
    id: 'al-2026-07-18-018',
    title: 'KYC 信息异常变更',
    category: 'kyc-anomaly',
    severity: 'medium',
    status: 'resolved',
    subject: 'U-3374***',
    triggeredAt: '2026-07-18 22:14',
    description: '用户 KYC 高级认证后 3 天内连续 2 次修改紧急联系人。',
    evidence: ['修改次数: 2/3 天', '新紧急联系人: 不同国籍'],
    ruleId: 'R-012',
    riskScore: 65,
    assignee: '风控-C',
    related: [],
  },
  {
    id: 'al-2026-07-18-015',
    title: '可疑对倒交易',
    category: 'wash-trade',
    severity: 'medium',
    status: 'false-positive',
    subject: 'U-7765***',
    triggeredAt: '2026-07-18 14:30',
    description: '检测到同一用户 5 分钟内自买自卖，疑似刷量。',
    evidence: ['自成交 18 笔', '对手方: 自有账户', '小额试探后大额'],
    ruleId: 'R-022',
    riskScore: 60,
    assignee: '风控-B',
    notes: '确认为量化策略对冲，非恶意刷量。',
    related: [],
  },
];

const LARGE_TXS: LargeTransaction[] = [
  { id: 'tx-001', txHash: '0x****8421', userId: 'U-8821***', userKyc: 'advanced', type: 'withdraw', amount: 480000, currency: 'USDT', usdValue: 480000, timestamp: '2026-07-19 10:18', status: 'flagged', destination: '0x****7421', riskLevel: 'critical', flags: ['超 KYC 限额', '首次大额', '新设备'] },
  { id: 'tx-002', txHash: '0x****7742', userId: 'U-6654***', userKyc: 'pro', type: 'withdraw', amount: 1200, currency: 'BTC', usdValue: 84420000, timestamp: '2026-07-19 10:14', status: 'completed', destination: 'bc1q****', riskLevel: 'medium', flags: ['VIP 用户', '历史高频'] },
  { id: 'tx-003', txHash: '0x****3321', userId: 'U-1245***', userKyc: 'advanced', type: 'transfer', amount: 80000, currency: 'USDT', usdValue: 80000, timestamp: '2026-07-19 10:02', status: 'flagged', destination: '0x****9911', riskLevel: 'high', flags: ['拆分交易', '8 笔同金额'] },
  { id: 'tx-004', txHash: '0x****9988', userId: 'U-7745***', userKyc: 'basic', type: 'deposit', amount: 250000, currency: 'USDT', usdValue: 250000, timestamp: '2026-07-19 09:48', status: 'completed', source: '0x****3322', riskLevel: 'low', flags: [] },
  { id: 'tx-005', txHash: '0x****1155', userId: 'U-9961***', userKyc: 'basic', type: 'withdraw', amount: 5200, currency: 'ETH', usdValue: 18980000, timestamp: '2026-07-19 08:30', status: 'blocked', destination: '0x****dead', riskLevel: 'critical', flags: ['OFAC 制裁', '自动拦截'] },
  { id: 'tx-006', txHash: '0x****4421', userId: 'U-1122***', userKyc: 'pro', type: 'trade', amount: 580, currency: 'ETH', usdValue: 2117200, timestamp: '2026-07-19 09:20', status: 'completed', riskLevel: 'low', flags: [] },
  { id: 'tx-007', txHash: '0x****6622', userId: 'U-9988***', userKyc: 'advanced', type: 'withdraw', amount: 50000, currency: 'USDT', usdValue: 50000, timestamp: '2026-07-19 07:48', status: 'pending', destination: '0x****dd22', riskLevel: 'low', flags: [] },
];

const RULES: Rule[] = [
  { id: 'R-007', name: '异国 IP 凌晨登录', description: '用户在新国家/新城市、且在非活跃时段（0:00-6:00）登录', category: '登录异常', enabled: true, priority: 80, trigger: 'geo-anomaly + time-anomaly', action: 'mfa-required', hitCount: 1284, hitLast24h: 18, falsePositiveRate: 12, lastUpdated: '2026-06-20', owner: '风控-A', thresholds: [{ metric: '距离常用地', op: '>', value: '500 km' }, { metric: '时段', op: 'in', value: '0:00-6:00' }] },
  { id: 'R-012', name: 'KYC 后频繁修改资料', description: 'KYC 升级后 7 天内多次修改紧急联系人 / 银行账户', category: 'KYC 异常', enabled: true, priority: 60, trigger: 'kyc-anomaly', action: 'review', hitCount: 248, hitLast24h: 3, falsePositiveRate: 18, lastUpdated: '2026-05-15', owner: '风控-C', thresholds: [{ metric: '修改次数', op: '>=', value: '2/7d' }] },
  { id: 'R-018', name: '单笔大额提现', description: '单笔提现金额超过用户 KYC 等级的 1.2 倍限额', category: '大额监控', enabled: true, priority: 95, trigger: 'large-tx', action: 'review', hitCount: 824, hitLast24h: 12, falsePositiveRate: 8, lastUpdated: '2026-07-10', owner: '风控-A', thresholds: [{ metric: '金额 / KYC 限额', op: '>=', value: '1.2' }] },
  { id: 'R-022', name: '可疑对倒交易', description: '检测到同一用户自买自卖或关联交易组', category: '市场操纵', enabled: true, priority: 70, trigger: 'wash-trade', action: 'review', hitCount: 142, hitLast24h: 4, falsePositiveRate: 28, lastUpdated: '2026-04-22', owner: '风控-B', thresholds: [{ metric: '自成交比例', op: '>', value: '30%' }] },
  { id: 'R-024', name: 'API 高频调用', description: 'API Key 在 60 秒内调用次数超过阈值', category: 'API 异常', enabled: true, priority: 75, trigger: 'api-anomaly', action: 'rate-limit', hitCount: 386, hitLast24h: 8, falsePositiveRate: 22, lastUpdated: '2026-06-01', owner: '风控-B', thresholds: [{ metric: 'QPS', op: '>', value: '20' }] },
  { id: 'R-031', name: '拆分交易监测', description: '24 小时内多笔接近报告阈值的交易', category: 'AML', enabled: true, priority: 90, trigger: 'structuring', action: 'review', hitCount: 84, hitLast24h: 2, falsePositiveRate: 14, lastUpdated: '2026-07-05', owner: '风控-A', thresholds: [{ metric: '接近阈值次数', op: '>=', value: '5/24h' }] },
  { id: 'R-040', name: 'OFAC 制裁名单匹配', description: '交易对手地址命中 OFAC SDN 制裁名单', category: '制裁合规', enabled: true, priority: 100, trigger: 'sanctions', action: 'block', hitCount: 4, hitLast24h: 1, falsePositiveRate: 0, lastUpdated: '2026-05-20', owner: '合规-A', thresholds: [{ metric: '名单匹配度', op: '>=', value: '85%' }] },
];

const FREEZES: Freeze[] = [
  { id: 'fz-001', type: 'withdraw', target: 'U-9961***', reason: 'OFAC 制裁名单匹配 (R-040)', status: 'active', initiatedBy: 'system', initiatedAt: '2026-07-19 08:30', approvedBy: '合规-A', expiresAt: '2026-08-19 08:30', relatedAlertId: 'al-2026-07-19-005', impact: { withdraw: true, login: false, trading: false, api: false } },
  { id: 'fz-002', type: 'login', target: 'U-4228***', reason: '异国 IP 异常登录 (R-007)', status: 'active', initiatedBy: 'system', initiatedAt: '2026-07-19 04:42', expiresAt: '2026-07-20 04:42', impact: { withdraw: false, login: true, trading: false, api: false } },
  { id: 'fz-003', type: 'withdraw', target: 'U-8821***', reason: '大额提现待复核 (R-018)', status: 'pending', initiatedBy: '风控-A', initiatedAt: '2026-07-19 10:20', impact: { withdraw: true, login: false, trading: false, api: false } },
  { id: 'fz-004', type: 'api', target: 'API-***3a2f', reason: 'API 高频调用 (R-024)', status: 'approved', initiatedBy: '风控-B', initiatedAt: '2026-07-19 09:58', approvedBy: '风控-Lead', expiresAt: '2026-07-20 09:58', impact: { withdraw: false, login: false, trading: false, api: true } },
  { id: 'fz-005', type: 'full', target: 'U-1234***', reason: 'KYC 资料严重造假', status: 'active', initiatedBy: '合规-B', initiatedAt: '2026-07-15 14:20', approvedBy: '合规-Lead', expiresAt: '2026-08-15 14:20', impact: { withdraw: true, login: true, trading: true, api: true } },
];

const AUDIT_LOGS: AuditLog[] = [
  { id: 'au-2026-07-19-001', timestamp: '2026-07-19 10:18', actor: 'system', action: 'manual-freeze', target: 'U-8821***', details: '自动触发 R-018 规则，临时冻结提现 24h', ip: '10.0.0.1', userAgent: 'risk-engine/1.4', result: 'success', riskLevel: 'critical' },
  { id: 'au-2026-07-19-002', timestamp: '2026-07-19 10:15', actor: '风控-Lead', action: 'rule-deploy', target: 'R-018', details: '更新阈值: 1.0 → 1.2', ip: '192.168.1.***', userAgent: 'Chrome 120.0', result: 'success', riskLevel: 'info' },
  { id: 'au-2026-07-19-003', timestamp: '2026-07-19 09:55', actor: 'system', action: 'alert-ack', target: 'al-2026-07-19-003', details: '风控-B 确认 API 异常告警', ip: '10.0.0.1', userAgent: 'risk-engine/1.4', result: 'success', riskLevel: 'high' },
  { id: 'au-2026-07-19-004', timestamp: '2026-07-19 09:42', actor: '合规-A', action: 'manual-freeze', target: 'U-9961***', details: '执行 OFAC 制裁名单匹配冻结', ip: '192.168.1.***', userAgent: 'Chrome 120.0', result: 'success', riskLevel: 'critical' },
  { id: 'au-2026-07-19-005', timestamp: '2026-07-19 08:00', actor: '风控-Lead', action: 'config-change', target: 'global', details: '开启"R-031 拆分交易"试运行 7 天', ip: '192.168.1.***', userAgent: 'Chrome 120.0', result: 'success', riskLevel: 'medium' },
  { id: 'au-2026-07-18-022', timestamp: '2026-07-18 23:15', actor: 'system', action: 'manual-unfreeze', target: 'U-6654***', details: '24h 复核通过，自动解冻提现', ip: '10.0.0.1', userAgent: 'risk-engine/1.4', result: 'success', riskLevel: 'low' },
  { id: 'au-2026-07-18-018', timestamp: '2026-07-18 19:30', actor: '风控-A', action: 'data-export', target: 'alert-2026-07', details: '导出 7 月告警数据 2,840 条', ip: '192.168.1.***', userAgent: 'Chrome 120.0', result: 'success', riskLevel: 'medium' },
  { id: 'au-2026-07-18-015', timestamp: '2026-07-18 16:00', actor: 'system', action: 'alert-ack', target: 'al-2026-07-15-***', details: '批量自动确认低风险告警 (1,240 条)', ip: '10.0.0.1', userAgent: 'risk-engine/1.4', result: 'success', riskLevel: 'low' },
];

// ============== 工具函数 ==============

const fmtNumber = (n: number): string => {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(2)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
};

const severityColor = (s: AlertSeverity): string => {
  switch (s) {
    case 'critical': return BRAND.danger;
    case 'high': return BRAND.warning;
    case 'medium': return BRAND.info;
    case 'low': return BRAND.textSub;
    case 'info': return BRAND.textMute;
  }
};

const severityLabel = (s: AlertSeverity): string => {
  return { critical: '严重', high: '高', medium: '中', low: '低', info: '提示' }[s];
};

const statusKey = (s: AlertStatus): StatusKey => {
  switch (s) {
    case 'new': return 'PRIVATE';
    case 'investigating': return 'BETA';
    case 'escalated': return 'MAINTENANCE';
    case 'resolved': return 'OPEN';
    case 'false-positive': return 'COMING';
    case 'suppressed': return 'EMPTY';
  }
};

const freezeStatusKey = (s: FreezeStatus): StatusKey => {
  switch (s) {
    case 'pending': return 'BETA';
    case 'approved': return 'SOON';
    case 'active': return 'MAINTENANCE';
    case 'expired': return 'COMING';
    case 'revoked': return 'EMPTY';
  }
};

const categoryLabel = (c: AlertCategory): string => {
  return { 'large-tx': '大额交易', velocity: '高频交易', 'geo-anomaly': '异国登录', 'device-anomaly': '设备异常', 'login-anomaly': '登录异常', 'kyc-anomaly': 'KYC 异常', 'withdraw-anomaly': '提现异常', 'api-anomaly': 'API 异常', 'wash-trade': '对倒交易', structuring: '拆分交易', sanctions: '制裁名单' }[c];
};

const freezeTypeLabel = (t: FreezeType): string => {
  return { withdraw: '提现冻结', login: '登录冻结', trading: '交易冻结', full: '全功能冻结', api: 'API 冻结' }[t];
};

const actionLabel = (a: AuditCategory): string => {
  return { 'config-change': '配置变更', 'rule-deploy': '规则部署', 'manual-freeze': '手动冻结', 'manual-unfreeze': '手动解冻', 'whitelist-change': '白名单变更', 'role-change': '角色变更', 'data-export': '数据导出', login: '登录', 'alert-ack': '告警确认' }[a];
};

const ruleActionLabel = (a: RuleAction): string => {
  return { block: '阻断', review: '人工复核', notify: '通知', 'mfa-required': '强制 MFA', 'freeze-account': '冻结账户', 'rate-limit': '限流' }[a];
};

// ============== 主组件 ==============

export function PortalMonitor() {
  const [tab, setTab] = useState<Tab>('overview');
  const [search, setSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState<AlertSeverity | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<AlertStatus | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState<AlertCategory | 'all'>('all');
  const [sortBy, setSortBy] = useState<'triggered' | 'severity' | 'risk'>('triggered');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [freezeStep, setFreezeStep] = useState(0);
  const [freezeType, setFreezeType] = useState<FreezeType>('withdraw');
  const [freezeTarget, setFreezeTarget] = useState('');
  const [freezeReason, setFreezeReason] = useState('');
  const [kpi, setKpi] = useState<KpiSnapshot>({
    activeAlerts: 24,
    blockedTx: 18,
    avgRiskScore: 42,
    pendingReviews: 12,
    monitorUsers: 184820,
    liveTx: 1240,
    riskRules: 36,
    frozenAccounts: 8,
  });
  const [drawer, setDrawer] = useState<DrawerState>({ open: false, type: null, payload: null });
  const [helpOpen, setHelpOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  // 实时数据波动
  useEffect(() => {
    const id = setInterval(() => {
      setKpi((prev) => ({
        ...prev,
        activeAlerts: Math.max(15, prev.activeAlerts + (Math.random() > 0.6 ? 1 : Math.random() > 0.5 ? -1 : 0)),
        blockedTx: prev.blockedTx + (Math.random() > 0.7 ? 1 : 0),
        pendingReviews: Math.max(5, prev.pendingReviews + (Math.random() > 0.6 ? 1 : Math.random() > 0.6 ? -1 : 0)),
        liveTx: Math.max(800, prev.liveTx + Math.floor(Math.random() * 50) - 25),
        avgRiskScore: Math.max(20, Math.min(60, prev.avgRiskScore + (Math.random() - 0.5))),
        frozenAccounts: prev.frozenAccounts + (Math.random() > 0.9 ? 1 : 0),
      }));
    }, 3000);
    return () => clearInterval(id);
  }, []);

  // 快捷键
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === '/') {
        e.preventDefault();
        searchRef.current?.focus();
      } else if (e.key === 'Escape') {
        if (drawer.open) {
          setDrawer({ open: false, type: null, payload: null });
          setFreezeStep(0);
        } else if (helpOpen) setHelpOpen(false);
        else if (search) setSearch('');
      } else if (e.key === '?') {
        setHelpOpen((v) => !v);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [drawer.open, helpOpen, search]);

  // 告警筛选
  const filteredAlerts = useMemo(() => {
    let arr = ALERTS.slice();
    if (search) {
      const q = search.toLowerCase();
      arr = arr.filter((a) => a.title.toLowerCase().includes(q) || a.subject.toLowerCase().includes(q) || a.id.toLowerCase().includes(q));
    }
    if (severityFilter !== 'all') arr = arr.filter((a) => a.severity === severityFilter);
    if (statusFilter !== 'all') arr = arr.filter((a) => a.status === statusFilter);
    if (categoryFilter !== 'all') arr = arr.filter((a) => a.category === categoryFilter);
    arr.sort((a, b) => {
      let av: number; let bv: number;
      if (sortBy === 'triggered') { av = new Date(a.triggeredAt).getTime(); bv = new Date(b.triggeredAt).getTime(); }
      else if (sortBy === 'severity') { const order = { critical: 5, high: 4, medium: 3, low: 2, info: 1 }; av = order[a.severity]; bv = order[b.severity]; }
      else { av = a.riskScore; bv = b.riskScore; }
      return sortDir === 'asc' ? av - bv : bv - av;
    });
    return arr;
  }, [search, severityFilter, statusFilter, categoryFilter, sortBy, sortDir]);

  const kpiCards = useMemo(() => [
    { label: '活跃告警', value: kpi.activeAlerts, suffix: '个', icon: AlertTriangle, color: BRAND.warning, pulse: true },
    { label: '已阻断交易', value: kpi.blockedTx, suffix: '笔', icon: ShieldOff, color: BRAND.danger },
    { label: '平均风险评分', value: kpi.avgRiskScore, suffix: '/100', icon: Activity, color: BRAND.info },
    { label: '待复核', value: kpi.pendingReviews, suffix: '个', icon: Clock, color: BRAND.warning },
    { label: '监控用户', value: kpi.monitorUsers, suffix: '人', icon: Users, color: BRAND.textSub },
    { label: '实时交易', value: kpi.liveTx, suffix: '笔/分', icon: Zap, color: BRAND.primary },
    { label: '风控规则', value: kpi.riskRules, suffix: '条', icon: GitBranch, color: BRAND.success },
    { label: '冻结账户', value: kpi.frozenAccounts, suffix: '个', icon: Lock, color: BRAND.danger },
  ], [kpi]);

  const tabOptions: { key: Tab; label: string; icon: React.ComponentType<{ size?: number; className?: string }> }[] = [
    { key: 'overview', label: '总览', icon: Activity },
    { key: 'alerts', label: '实时告警', icon: AlertTriangle },
    { key: 'large', label: '大额监控', icon: TrendingUp },
    { key: 'abnormal', label: '异常行为', icon: Zap },
    { key: 'freeze', label: '应急冻结', icon: Lock },
    { key: 'rules', label: '规则引擎', icon: GitBranch },
    { key: 'audit', label: '审计追溯', icon: FileText },
    { key: 'help', label: '帮助', icon: HelpCircle },
  ];

  const openAlert = (id: string) => setDrawer({ open: true, type: 'alert', payload: id });
  const openRule = (id: string) => setDrawer({ open: true, type: 'rule', payload: id });
  const openFreeze = (id: string) => setDrawer({ open: true, type: 'freeze', payload: id });
  const openAudit = (id: string) => setDrawer({ open: true, type: 'audit', payload: id });
  const openLarge = (id: string) => setDrawer({ open: true, type: 'large', payload: id });
  const startFreeze = () => {
    setFreezeStep(0);
    setFreezeType('withdraw');
    setFreezeTarget('');
    setFreezeReason('');
    setDrawer({ open: true, type: 'freeze', payload: 'new' });
  };

  const drawerAlert = drawer.type === 'alert' ? ALERTS.find((a) => a.id === drawer.payload) : null;
  const drawerRule = drawer.type === 'rule' ? RULES.find((r) => r.id === drawer.payload) : null;
  const drawerFreeze = drawer.type === 'freeze' && drawer.payload !== 'new' ? FREEZES.find((f) => f.id === drawer.payload) : null;
  const drawerAudit = drawer.type === 'audit' ? AUDIT_LOGS.find((a) => a.id === drawer.payload) : null;
  const drawerLarge = drawer.type === 'large' ? LARGE_TXS.find((t) => t.id === drawer.payload) : null;

  return (
    <div className="min-h-screen" style={{ backgroundColor: BRAND.bg, color: BRAND.text }}>
      <style jsx global>{`
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
        @keyframes countUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes sirenPulse { 0%, 100% { box-shadow: 0 0 0 0 ${BRAND.danger}80; } 50% { box-shadow: 0 0 0 8px transparent; } }
        .stagger-in > * { animation: fadeInUp 0.5s ease-out backwards; }
        .stagger-in > *:nth-child(1) { animation-delay: 0.05s; }
        .stagger-in > *:nth-child(2) { animation-delay: 0.10s; }
        .stagger-in > *:nth-child(3) { animation-delay: 0.15s; }
        .stagger-in > *:nth-child(4) { animation-delay: 0.20s; }
        .stagger-in > *:nth-child(5) { animation-delay: 0.25s; }
        .stagger-in > *:nth-child(6) { animation-delay: 0.30s; }
        .stagger-in > *:nth-child(7) { animation-delay: 0.35s; }
        .stagger-in > *:nth-child(8) { animation-delay: 0.40s; }
        .pulse-dot { animation: pulse 1.6s ease-in-out infinite; }
        .siren-pulse { animation: sirenPulse 1.6s ease-in-out infinite; }
        .count-up { animation: countUp 0.6s ease-out; }
        .kbd { display: inline-block; padding: 2px 6px; border-radius: 4px; font-family: monospace; font-size: 11px; background: ${BRAND.bgCard}; border: 1px solid ${BRAND.border}; color: ${BRAND.textSub}; }
        .drawer-anim { animation: fadeInUp 0.25s ease-out; }
        .scrollbar-thin::-webkit-scrollbar { width: 6px; height: 6px; }
        .scrollbar-thin::-webkit-scrollbar-track { background: ${BRAND.bg}; }
        .scrollbar-thin::-webkit-scrollbar-thumb { background: ${BRAND.border}; border-radius: 3px; }
      `}</style>

      {/* Hero */}
      <section className="px-6 py-12 md:py-16" style={{ borderBottom: `1px solid ${BRAND.border}` }}>
        <div className="max-w-7xl mx-auto">
          <div className="flex items-start gap-3 mb-4">
            <div className="p-2 rounded-lg" style={{ backgroundColor: BRAND.dangerLt }}>
              <ShieldAlert size={20} style={{ color: BRAND.danger }} />
            </div>
            <div>
              <div className="text-xs uppercase tracking-wider mb-1" style={{ color: BRAND.danger }}>SECURITY MONITORING · P3.23</div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2">资产安全监控中心</h1>
              <p className="text-sm md:text-base" style={{ color: BRAND.textSub }}>
                实时风控 · 异常告警 · 应急冻结 · 全链路审计
              </p>
            </div>
          </div>

          <div className="mt-8 flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: BRAND.textMute }} />
              <input
                ref={searchRef}
                type="text"
                placeholder="搜索告警 / 规则 / 冻结 / 审计...  按 / 聚焦"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-10 py-3 rounded-lg outline-none text-sm"
                style={{ backgroundColor: BRAND.bgCard, color: BRAND.text, border: `1px solid ${BRAND.border}` }}
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2">
                  <X size={16} style={{ color: BRAND.textMute }} />
                </button>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={startFreeze}
                className="px-5 py-3 rounded-lg text-sm font-medium flex items-center gap-2"
                style={{ backgroundColor: BRAND.danger, color: BRAND.onPrimary }}
              >
                <Lock size={16} />应急冻结
              </button>
              <button
                onClick={() => setTab('alerts')}
                className="px-5 py-3 rounded-lg text-sm font-medium flex items-center gap-2"
                style={{ backgroundColor: BRAND.bgCard, color: BRAND.text, border: `1px solid ${BRAND.border}` }}
              >
                <AlertTriangle size={16} />告警队列
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 实时 KPI */}
      <section className="px-6 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 stagger-in">
            {kpiCards.map((card, i) => {
              const Icon = card.icon;
              return (
                <div
                  key={i}
                  className="p-4 rounded-xl"
                  style={{
                    backgroundColor: BRAND.bgCard,
                    border: `1px solid ${BRAND.border}`,
                  }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-xs" style={{ color: BRAND.textMute }}>{card.label}</div>
                    <div className="p-1.5 rounded" style={{ backgroundColor: `${card.color}20` }}>
                      <Icon size={14} style={{ color: card.color }} />
                    </div>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold count-up" style={{ color: card.color === BRAND.textSub ? BRAND.text : card.color }}>
                      {fmtNumber(card.value)}
                    </span>
                    <span className="text-xs" style={{ color: BRAND.textSub }}>{card.suffix}</span>
                    {card.pulse && <span className="ml-1 w-2 h-2 rounded-full pulse-dot" style={{ backgroundColor: card.color }} />}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Tab 切换 */}
      <section className="px-6 py-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-wrap gap-2 p-1 rounded-xl" style={{ backgroundColor: BRAND.bgCard, border: `1px solid ${BRAND.border}` }}>
            {tabOptions.map((t) => {
              const Icon = t.icon;
              return (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  style={{
                    backgroundColor: tab === t.key ? BRAND.primary : 'transparent',
                    color: tab === t.key ? BRAND.onPrimary : BRAND.textSub,
                  }}
                >
                  <Icon size={14} />
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Tab 内容 */}
      <section className="px-6 py-6 pb-16">
        <div className="max-w-7xl mx-auto">
          {tab === 'overview' && (
            <div className="space-y-6 stagger-in">
              {/* 总览：风险地图 + 最新告警 + 风险分布 */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2 p-5 rounded-xl" style={{ backgroundColor: BRAND.bgCard, border: `1px solid ${BRAND.border}` }}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-base font-semibold flex items-center gap-2">
                      <AlertTriangle size={16} style={{ color: BRAND.warning }} />
                      最新告警
                    </div>
                    <button onClick={() => setTab('alerts')} className="text-xs flex items-center gap-1" style={{ color: BRAND.primary }}>
                      全部告警 <ChevronRight size={12} />
                    </button>
                  </div>
                  <div className="space-y-2">
                    {ALERTS.slice(0, 5).map((a) => {
                      const sk = statusKey(a.status);
                      return (
                        <button
                          key={a.id}
                          onClick={() => openAlert(a.id)}
                          className="w-full flex items-center gap-3 p-3 rounded-lg text-left"
                          style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}
                        >
                          <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: severityColor(a.severity), boxShadow: a.severity === 'critical' ? `0 0 0 4px ${BRAND.danger}30` : 'none' }} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <span className="text-sm font-medium truncate" style={{ color: BRAND.text }}>{a.title}</span>
                              <span className="text-[10px] px-1.5 py-0.5 rounded flex-shrink-0" style={{ backgroundColor: STATUS[sk].bg, color: STATUS[sk].color }}>{STATUS[sk].label}</span>
                            </div>
                            <div className="text-[10px]" style={{ color: BRAND.textMute }}>{categoryLabel(a.category)} · {a.subject} · {a.triggeredAt} · 风险分 {a.riskScore}</div>
                          </div>
                          <ChevronRight size={14} style={{ color: BRAND.textMute }} />
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="p-5 rounded-xl" style={{ backgroundColor: BRAND.bgCard, border: `1px solid ${BRAND.border}` }}>
                  <div className="text-base font-semibold mb-4 flex items-center gap-2">
                    <Activity size={16} style={{ color: BRAND.info }} />
                    风险分布
                  </div>
                  <div className="space-y-3">
                    {[
                      { label: '严重', count: 3, color: BRAND.danger, pct: 8 },
                      { label: '高', count: 8, color: BRAND.warning, pct: 22 },
                      { label: '中', count: 14, color: BRAND.info, pct: 38 },
                      { label: '低', count: 11, color: BRAND.textSub, pct: 30 },
                      { label: '提示', count: 1, color: BRAND.textMute, pct: 2 },
                    ].map((r, i) => (
                      <div key={i}>
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span style={{ color: BRAND.textSub }}>{r.label}</span>
                          <span className="font-mono" style={{ color: r.color }}>{r.count} · {r.pct}%</span>
                        </div>
                        <div className="w-full h-1.5 rounded-full" style={{ backgroundColor: BRAND.bg }}>
                          <div className="h-full rounded-full" style={{ width: `${r.pct}%`, backgroundColor: r.color }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* 实时大额监控 + 当前冻结 */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="p-5 rounded-xl" style={{ backgroundColor: BRAND.bgCard, border: `1px solid ${BRAND.border}` }}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-base font-semibold flex items-center gap-2">
                      <TrendingUp size={16} style={{ color: BRAND.primary }} />
                      实时大额交易
                    </div>
                    <button onClick={() => setTab('large')} className="text-xs flex items-center gap-1" style={{ color: BRAND.primary }}>
                      全部 <ChevronRight size={12} />
                    </button>
                  </div>
                  <div className="space-y-2">
                    {LARGE_TXS.slice(0, 4).map((tx) => (
                      <button
                        key={tx.id}
                        onClick={() => openLarge(tx.id)}
                        className="w-full flex items-center gap-3 p-2 rounded-lg text-left"
                        style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}
                      >
                        <div className="p-1.5 rounded" style={{ backgroundColor: `${severityColor(tx.riskLevel)}20` }}>
                          {tx.type === 'withdraw' ? <ArrowUpRight size={12} style={{ color: severityColor(tx.riskLevel) }} /> : tx.type === 'deposit' ? <ArrowDownLeft size={12} style={{ color: BRAND.success }} /> : <ArrowRight size={12} style={{ color: BRAND.info }} />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-mono" style={{ color: BRAND.text }}>{tx.amount.toLocaleString()} {tx.currency}</div>
                          <div className="text-[10px]" style={{ color: BRAND.textMute }}>{tx.userId} · {tx.timestamp}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-[10px] font-mono" style={{ color: BRAND.textSub }}>${fmtNumber(tx.usdValue)}</div>
                          {tx.status === 'flagged' && <div className="text-[10px]" style={{ color: BRAND.warning }}>待复核</div>}
                          {tx.status === 'blocked' && <div className="text-[10px]" style={{ color: BRAND.danger }}>已阻断</div>}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-5 rounded-xl" style={{ backgroundColor: BRAND.bgCard, border: `1px solid ${BRAND.border}` }}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-base font-semibold flex items-center gap-2">
                      <Lock size={16} style={{ color: BRAND.danger }} />
                      当前冻结列表
                    </div>
                    <button onClick={() => setTab('freeze')} className="text-xs flex items-center gap-1" style={{ color: BRAND.primary }}>
                      全部 <ChevronRight size={12} />
                    </button>
                  </div>
                  <div className="space-y-2">
                    {FREEZES.slice(0, 4).map((f) => {
                      const sk = freezeStatusKey(f.status);
                      return (
                        <button
                          key={f.id}
                          onClick={() => openFreeze(f.id)}
                          className="w-full flex items-center gap-3 p-2 rounded-lg text-left"
                          style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}
                        >
                          <div className="p-1.5 rounded" style={{ backgroundColor: BRAND.dangerLt }}>
                            <Lock size={12} style={{ color: BRAND.danger }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium" style={{ color: BRAND.text }}>{freezeTypeLabel(f.type)} · {f.target}</div>
                            <div className="text-[10px]" style={{ color: BRAND.textMute }}>{f.reason}</div>
                          </div>
                          <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: STATUS[sk].bg, color: STATUS[sk].color }}>{STATUS[sk].label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {tab === 'alerts' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl" style={{ backgroundColor: BRAND.bgCard, border: `1px solid ${BRAND.border}` }}>
                <div className="flex flex-wrap gap-3 items-center">
                  <div className="flex items-center gap-2">
                    <Filter size={14} style={{ color: BRAND.textMute }} />
                    <span className="text-xs" style={{ color: BRAND.textMute }}>严重度</span>
                    <select value={severityFilter} onChange={(e) => setSeverityFilter(e.target.value as AlertSeverity | 'all')} className="px-2 py-1 rounded text-xs" style={{ backgroundColor: BRAND.bg, color: BRAND.text, border: `1px solid ${BRAND.border}` }}>
                      <option value="all">全部</option>
                      <option value="critical">严重</option>
                      <option value="high">高</option>
                      <option value="medium">中</option>
                      <option value="low">低</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs" style={{ color: BRAND.textMute }}>状态</span>
                    <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as AlertStatus | 'all')} className="px-2 py-1 rounded text-xs" style={{ backgroundColor: BRAND.bg, color: BRAND.text, border: `1px solid ${BRAND.border}` }}>
                      <option value="all">全部</option>
                      <option value="new">新告警</option>
                      <option value="investigating">调查中</option>
                      <option value="escalated">已升级</option>
                      <option value="resolved">已解决</option>
                      <option value="false-positive">误报</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs" style={{ color: BRAND.textMute }}>分类</span>
                    <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value as AlertCategory | 'all')} className="px-2 py-1 rounded text-xs" style={{ backgroundColor: BRAND.bg, color: BRAND.text, border: `1px solid ${BRAND.border}` }}>
                      <option value="all">全部</option>
                      {Object.entries(categoryLabel).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                  </div>
                  <div className="flex items-center gap-2 ml-auto">
                    <span className="text-xs" style={{ color: BRAND.textMute }}>排序</span>
                    <button onClick={() => { setSortBy('triggered'); setSortDir(sortDir === 'asc' ? 'desc' : 'asc'); }} className="px-2 py-1 rounded text-xs" style={{ backgroundColor: sortBy === 'triggered' ? BRAND.primaryLt : BRAND.bg, color: sortBy === 'triggered' ? BRAND.primary : BRAND.textSub, border: `1px solid ${BRAND.border}` }}>触发时间</button>
                    <button onClick={() => { setSortBy('severity'); setSortDir(sortDir === 'asc' ? 'desc' : 'asc'); }} className="px-2 py-1 rounded text-xs" style={{ backgroundColor: sortBy === 'severity' ? BRAND.primaryLt : BRAND.bg, color: sortBy === 'severity' ? BRAND.primary : BRAND.textSub, border: `1px solid ${BRAND.border}` }}>严重度</button>
                    <button onClick={() => { setSortBy('risk'); setSortDir(sortDir === 'asc' ? 'desc' : 'asc'); }} className="px-2 py-1 rounded text-xs" style={{ backgroundColor: sortBy === 'risk' ? BRAND.primaryLt : BRAND.bg, color: sortBy === 'risk' ? BRAND.primary : BRAND.textSub, border: `1px solid ${BRAND.border}` }}>风险分</button>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                {filteredAlerts.length === 0 ? (
                  <div className="p-12 rounded-xl text-center" style={{ backgroundColor: BRAND.bgCard, border: `1px solid ${BRAND.border}` }}>
                    <CheckCircle2 size={32} className="mx-auto mb-3" style={{ color: BRAND.success }} />
                    <div className="text-sm" style={{ color: BRAND.textMute }}>没有匹配的告警</div>
                  </div>
                ) : filteredAlerts.map((a) => {
                  const sk = statusKey(a.status);
                  return (
                    <button
                      key={a.id}
                      onClick={() => openAlert(a.id)}
                      className="w-full p-4 rounded-xl text-left transition-all hover:scale-[1.005]"
                      style={{ backgroundColor: BRAND.bgCard, border: `1px solid ${BRAND.border}` }}
                    >
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded flex-shrink-0" style={{ backgroundColor: `${severityColor(a.severity)}20` }}>
                          <AlertTriangle size={16} style={{ color: severityColor(a.severity) }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="text-sm font-semibold" style={{ color: BRAND.text }}>{a.title}</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: `${severityColor(a.severity)}20`, color: severityColor(a.severity) }}>{severityLabel(a.severity)}</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: STATUS[sk].bg, color: STATUS[sk].color }}>{STATUS[sk].label}</span>
                            {a.amount && <span className="text-[10px] px-1.5 py-0.5 rounded font-mono" style={{ backgroundColor: BRAND.bg, color: BRAND.warning, border: `1px solid ${BRAND.warning}40` }}>{a.amount.toLocaleString()} {a.currency}</span>}
                          </div>
                          <div className="text-xs mb-1" style={{ color: BRAND.textSub }}>{a.description}</div>
                          <div className="flex items-center gap-3 text-[10px] flex-wrap" style={{ color: BRAND.textMute }}>
                            <span>对象: {a.subject}</span>
                            <span>规则: {a.ruleId}</span>
                            <span>风险分: {a.riskScore}</span>
                            <span>{a.triggeredAt}</span>
                            {a.assignee && <span>处理人: {a.assignee}</span>}
                          </div>
                        </div>
                        <ChevronRight size={16} style={{ color: BRAND.textMute }} />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {tab === 'large' && (
            <div className="space-y-2 stagger-in">
              {LARGE_TXS.map((tx) => (
                <button
                  key={tx.id}
                  onClick={() => openLarge(tx.id)}
                  className="w-full p-4 rounded-xl text-left"
                  style={{ backgroundColor: BRAND.bgCard, border: `1px solid ${BRAND.border}` }}
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded flex-shrink-0" style={{ backgroundColor: `${severityColor(tx.riskLevel)}20` }}>
                      {tx.type === 'withdraw' ? <ArrowUpRight size={16} style={{ color: severityColor(tx.riskLevel) }} /> : tx.type === 'deposit' ? <ArrowDownLeft size={16} style={{ color: BRAND.success }} /> : <ArrowRight size={16} style={{ color: BRAND.info }} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-sm font-mono font-semibold" style={{ color: BRAND.text }}>{tx.amount.toLocaleString()} {tx.currency}</span>
                        <span className="text-xs text-sub" style={{ color: BRAND.textSub }}>≈ ${fmtNumber(tx.usdValue)}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: `${severityColor(tx.riskLevel)}20`, color: severityColor(tx.riskLevel) }}>{severityLabel(tx.riskLevel)}风险</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: tx.status === 'flagged' ? BRAND.warningLt : tx.status === 'blocked' ? BRAND.dangerLt : BRAND.successLt, color: tx.status === 'flagged' ? BRAND.warning : tx.status === 'blocked' ? BRAND.danger : BRAND.success }}>
                          {tx.status === 'flagged' ? '待复核' : tx.status === 'blocked' ? '已阻断' : tx.status === 'pending' ? '处理中' : '已完成'}
                        </span>
                      </div>
                      <div className="text-xs font-mono mb-1" style={{ color: BRAND.textMute }}>tx: {tx.txHash}</div>
                      <div className="flex items-center gap-3 text-[10px] flex-wrap" style={{ color: BRAND.textMute }}>
                        <span>用户: {tx.userId} ({tx.userKyc})</span>
                        <span>类型: {tx.type === 'withdraw' ? '提现' : tx.type === 'deposit' ? '入金' : tx.type === 'transfer' ? '转账' : '交易'}</span>
                        <span>{tx.timestamp}</span>
                      </div>
                      {tx.flags.length > 0 && (
                        <div className="flex items-center gap-1 mt-2 flex-wrap">
                          {tx.flags.map((f, i) => (
                            <span key={i} className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: BRAND.dangerLt, color: BRAND.danger }}>{f}</span>
                          ))}
                        </div>
                      )}
                    </div>
                    <ChevronRight size={16} style={{ color: BRAND.textMute }} />
                  </div>
                </button>
              ))}
            </div>
          )}

          {tab === 'abnormal' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 stagger-in">
              {[
                { label: '异国登录', count: 18, desc: 'R-007 触发', icon: MapPin, color: BRAND.warning, status: 'investigating' },
                { label: 'API 高频', count: 8, desc: 'R-024 触发', icon: Zap, color: BRAND.warning, status: 'investigating' },
                { label: 'KYC 修改', count: 3, desc: 'R-012 触发', icon: User, color: BRAND.info, status: 'resolved' },
                { label: '拆分交易', count: 2, desc: 'R-031 触发', icon: GitBranch, color: BRAND.danger, status: 'investigating' },
                { label: '对倒交易', count: 4, desc: 'R-022 触发', icon: Repeat, color: BRAND.warning, status: 'false-positive' },
                { label: '制裁名单', count: 1, desc: 'R-040 触发', icon: Siren, color: BRAND.danger, status: 'resolved' },
                { label: '设备异常', count: 6, desc: 'R-009 触发', icon: Smartphone, color: BRAND.info, status: 'new' },
                { label: '高频交易', count: 12, desc: 'R-015 触发', icon: Activity, color: BRAND.warning, status: 'investigating' },
              ].map((c, i) => {
                const Icon = c.icon;
                return (
                  <div key={i} className="p-4 rounded-xl" style={{ backgroundColor: BRAND.bgCard, border: `1px solid ${BRAND.border}` }}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded" style={{ backgroundColor: `${c.color}20` }}>
                          <Icon size={16} style={{ color: c.color }} />
                        </div>
                        <div>
                          <div className="text-sm font-semibold" style={{ color: BRAND.text }}>{c.label}</div>
                          <div className="text-[10px]" style={{ color: BRAND.textMute }}>{c.desc}</div>
                        </div>
                      </div>
                      <div className="text-2xl font-bold" style={{ color: c.color }}>{c.count}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {tab === 'freeze' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl" style={{ backgroundColor: BRAND.bgCard, border: `1px solid ${BRAND.border}` }}>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold mb-1" style={{ color: BRAND.text }}>应急冻结</div>
                    <div className="text-xs" style={{ color: BRAND.textSub }}>对账户进行提现 / 登录 / 交易 / API 快速冻结，需合规或风控负责人审批</div>
                  </div>
                  <button
                    onClick={startFreeze}
                    className="px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2"
                    style={{ backgroundColor: BRAND.danger, color: BRAND.onPrimary }}
                  >
                    <Lock size={14} />新建冻结
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                {FREEZES.map((f) => {
                  const sk = freezeStatusKey(f.status);
                  return (
                    <button
                      key={f.id}
                      onClick={() => openFreeze(f.id)}
                      className="w-full p-4 rounded-xl text-left"
                      style={{ backgroundColor: BRAND.bgCard, border: `1px solid ${BRAND.border}` }}
                    >
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded" style={{ backgroundColor: BRAND.dangerLt }}>
                          <Lock size={16} style={{ color: BRAND.danger }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="text-sm font-semibold" style={{ color: BRAND.text }}>{freezeTypeLabel(f.type)} · {f.target}</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: STATUS[sk].bg, color: STATUS[sk].color }}>{STATUS[sk].label}</span>
                          </div>
                          <div className="text-xs mb-1" style={{ color: BRAND.textSub }}>{f.reason}</div>
                          <div className="flex items-center gap-3 text-[10px] flex-wrap" style={{ color: BRAND.textMute }}>
                            <span>发起: {f.initiatedBy}</span>
                            {f.approvedBy && <span>审批: {f.approvedBy}</span>}
                            <span>{f.initiatedAt}</span>
                            {f.expiresAt && <span>到期: {f.expiresAt}</span>}
                          </div>
                          <div className="flex items-center gap-1 mt-2">
                            {f.impact.withdraw && <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: BRAND.bg, color: BRAND.danger, border: `1px solid ${BRAND.danger}40` }}>提现</span>}
                            {f.impact.login && <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: BRAND.bg, color: BRAND.danger, border: `1px solid ${BRAND.danger}40` }}>登录</span>}
                            {f.impact.trading && <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: BRAND.bg, color: BRAND.danger, border: `1px solid ${BRAND.danger}40` }}>交易</span>}
                            {f.impact.api && <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: BRAND.bg, color: BRAND.danger, border: `1px solid ${BRAND.danger}40` }}>API</span>}
                          </div>
                        </div>
                        <ChevronRight size={16} style={{ color: BRAND.textMute }} />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {tab === 'rules' && (
            <div className="space-y-2 stagger-in">
              {RULES.map((r) => (
                <button
                  key={r.id}
                  onClick={() => openRule(r.id)}
                  className="w-full p-4 rounded-xl text-left"
                  style={{ backgroundColor: BRAND.bgCard, border: `1px solid ${BRAND.border}` }}
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded flex-shrink-0" style={{ backgroundColor: r.enabled ? BRAND.successLt : BRAND.bg }}>
                      <GitBranch size={16} style={{ color: r.enabled ? BRAND.success : BRAND.textMute }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-sm font-semibold" style={{ color: BRAND.text }}>{r.name}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded font-mono" style={{ backgroundColor: BRAND.bg, color: BRAND.primary, border: `1px solid ${BRAND.border}` }}>{r.id}</span>
                        {r.enabled ? (
                          <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: BRAND.successLt, color: BRAND.success }}>启用</span>
                        ) : (
                          <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: BRAND.bg, color: BRAND.textMute, border: `1px solid ${BRAND.border}` }}>停用</span>
                        )}
                        <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: BRAND.primaryLt, color: BRAND.primary }}>{r.priority}</span>
                      </div>
                      <div className="text-xs mb-1" style={{ color: BRAND.textSub }}>{r.description}</div>
                      <div className="flex items-center gap-3 text-[10px] flex-wrap" style={{ color: BRAND.textMute }}>
                        <span>分类: {r.category}</span>
                        <span>动作: {ruleActionLabel(r.action)}</span>
                        <span>累计触发: {r.hitCount.toLocaleString()}</span>
                        <span>24h 触发: {r.hitLast24h}</span>
                        <span>误报率: {r.falsePositiveRate}%</span>
                        <span>责任人: {r.owner}</span>
                      </div>
                    </div>
                    <ChevronRight size={16} style={{ color: BRAND.textMute }} />
                  </div>
                </button>
              ))}
            </div>
          )}

          {tab === 'audit' && (
            <div className="space-y-2 stagger-in">
              {AUDIT_LOGS.map((a) => (
                <button
                  key={a.id}
                  onClick={() => openAudit(a.id)}
                  className="w-full p-3 rounded-xl text-left"
                  style={{ backgroundColor: BRAND.bgCard, border: `1px solid ${BRAND.border}` }}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 rounded" style={{ backgroundColor: `${severityColor(a.riskLevel)}20` }}>
                      <FileText size={14} style={{ color: severityColor(a.riskLevel) }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-sm font-medium" style={{ color: BRAND.text }}>{actionLabel(a.action)}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: BRAND.bg, color: BRAND.textSub, border: `1px solid ${BRAND.border}` }}>对象: {a.target}</span>
                        <span className="text-[10px]" style={{ color: a.result === 'success' ? BRAND.success : BRAND.danger }}>{a.result === 'success' ? '成功' : a.result === 'failure' ? '失败' : '部分'}</span>
                      </div>
                      <div className="text-xs" style={{ color: BRAND.textSub }}>{a.details}</div>
                      <div className="text-[10px] mt-1" style={{ color: BRAND.textMute }}>{a.actor} · {a.timestamp} · IP: {a.ip}</div>
                    </div>
                    <ChevronRight size={14} style={{ color: BRAND.textMute }} />
                  </div>
                </button>
              ))}
            </div>
          )}

          {tab === 'help' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 stagger-in">
              <div className="p-5 rounded-xl" style={{ backgroundColor: BRAND.bgCard, border: `1px solid ${BRAND.border}` }}>
                <div className="text-base font-semibold mb-3 flex items-center gap-2">
                  <Keyboard size={16} style={{ color: BRAND.primary }} />
                  键盘快捷键
                </div>
                <div className="space-y-2 text-sm">
                  {[
                    { key: '/', desc: '聚焦搜索框' },
                    { key: '?', desc: '打开/关闭帮助' },
                    { key: 'Esc', desc: '关闭抽屉 / 清除搜索' },
                  ].map((s, i) => (
                    <div key={i} className="flex items-center justify-between p-2 rounded" style={{ backgroundColor: BRAND.bg }}>
                      <span style={{ color: BRAND.textSub }}>{s.desc}</span>
                      <span className="kbd">{s.key}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="p-5 rounded-xl" style={{ backgroundColor: BRAND.bgCard, border: `1px solid ${BRAND.border}` }}>
                <div className="text-base font-semibold mb-3 flex items-center gap-2">
                  <LifeBuoy size={16} style={{ color: BRAND.success }} />
                  紧急联系
                </div>
                <div className="space-y-2 text-sm" style={{ color: BRAND.textSub }}>
                  <div>· 重大风险事件：合规负责人 / 风控负责人</div>
                  <div>· 制裁名单命中：合规部门 + 法务</div>
                  <div>· 系统性故障：SRE 值班</div>
                  <div>· 客户投诉与申诉：客户支持中心</div>
                </div>
              </div>
              <div className="md:col-span-2 p-5 rounded-xl" style={{ backgroundColor: BRAND.bgCard, border: `1px solid ${BRAND.border}` }}>
                <div className="text-base font-semibold mb-3 flex items-center gap-2">
                  <Info size={16} style={{ color: BRAND.info }} />
                  合规说明
                </div>
                <ul className="space-y-2 text-xs" style={{ color: BRAND.textSub }}>
                  <li>· 风控规则、告警阈值、风险评分为内部运营参考，规则调整需经风控负责人审批并留痕。</li>
                  <li>· 应急冻结等高风险操作仅由授权人员执行，所有操作全量记录并保存至少 5 年。</li>
                  <li>· 涉及反洗钱 / 反恐融资的可疑交易，按监管要求上报合规部门与外部监管机构。</li>
                  <li>· 客户因风控措施导致账户功能受限的，应通过客户支持中心提供申诉渠道。</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* 合规提示 */}
      <section className="px-6 py-6">
        <div className="max-w-7xl mx-auto">
          <div className="p-4 rounded-xl text-xs flex items-start gap-2" style={{ backgroundColor: BRAND.bgCard, border: `1px solid ${BRAND.border}`, color: BRAND.textSub }}>
            <Info size={14} className="mt-0.5 flex-shrink-0" style={{ color: BRAND.info }} />
            <div>
              <strong style={{ color: BRAND.text }}>合规提示：</strong>
              本监控中心展示的风控规则、告警数据、风险评分、应急冻结等均为内部运营参考与 UI 演示，不构成反洗钱/反欺诈的绝对保证。所有风控操作需由授权人员执行并留痕审计。如遇可疑情况请通过内部应急流程处理，请勿向客户直接展示具体规则逻辑。
            </div>
          </div>
        </div>
      </section>

      {/* 底部 CTA */}
      <section className="px-6 py-8">
        <div className="max-w-7xl mx-auto text-center">
          <div className="text-lg font-semibold mb-2">实时守护 · 智能风控</div>
          <div className="text-sm mb-4" style={{ color: BRAND.textSub }}>毫秒级响应 · 全链路审计 · 自动化处置</div>
          <div className="flex justify-center gap-3 flex-wrap">
            <button
              onClick={() => setTab('alerts')}
              className="px-6 py-3 rounded-lg text-sm font-medium flex items-center gap-2"
              style={{ backgroundColor: BRAND.primary, color: BRAND.onPrimary }}
            >
              <AlertTriangle size={16} />查看告警
            </button>
            <button
              onClick={startFreeze}
              className="px-6 py-3 rounded-lg text-sm font-medium flex items-center gap-2"
              style={{ backgroundColor: BRAND.danger, color: BRAND.onPrimary }}
            >
              <Lock size={16} />应急冻结
            </button>
          </div>
        </div>
      </section>

      {/* 告警详情 Drawer */}
      {drawer.open && drawer.type === 'alert' && drawerAlert && (
        <>
          <div className="fixed inset-0 z-40" style={{ backgroundColor: BRAND.overlay }} onClick={() => setDrawer({ open: false, type: null, payload: null })} />
          <div className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-2xl overflow-y-auto scrollbar-thin drawer-anim" style={{ backgroundColor: BRAND.bg, borderLeft: `1px solid ${BRAND.border}` }}>
            <div className="sticky top-0 p-4 flex items-center justify-between" style={{ backgroundColor: BRAND.bg, borderBottom: `1px solid ${BRAND.border}` }}>
              <div className="text-base font-semibold flex items-center gap-2">
                <AlertTriangle size={16} style={{ color: severityColor(drawerAlert.severity) }} />
                告警详情
              </div>
              <button onClick={() => setDrawer({ open: false, type: null, payload: null })} className="p-1"><X size={18} style={{ color: BRAND.textMute }} /></button>
            </div>
            <div className="p-6">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className="text-[10px] px-2 py-0.5 rounded" style={{ backgroundColor: `${severityColor(drawerAlert.severity)}20`, color: severityColor(drawerAlert.severity) }}>{severityLabel(drawerAlert.severity)}</span>
                <span className="text-[10px] px-2 py-0.5 rounded" style={{ backgroundColor: STATUS[statusKey(drawerAlert.status)].bg, color: STATUS[statusKey(drawerAlert.status)].color }}>{STATUS[statusKey(drawerAlert.status)].label}</span>
                <span className="text-xs font-mono" style={{ color: BRAND.textMute }}>{drawerAlert.id}</span>
              </div>
              <h2 className="text-xl font-bold mb-2" style={{ color: BRAND.text }}>{drawerAlert.title}</h2>
              <p className="text-sm mb-4" style={{ color: BRAND.textSub }}>{drawerAlert.description}</p>

              <div className="grid grid-cols-2 gap-2 mb-4 text-sm">
                <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.bgCard, border: `1px solid ${BRAND.border}` }}>
                  <div className="text-[10px]" style={{ color: BRAND.textMute }}>触发时间</div>
                  <div className="font-mono mt-1" style={{ color: BRAND.text }}>{drawerAlert.triggeredAt}</div>
                </div>
                <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.bgCard, border: `1px solid ${BRAND.border}` }}>
                  <div className="text-[10px]" style={{ color: BRAND.textMute }}>风险评分</div>
                  <div className="font-mono mt-1" style={{ color: severityColor(drawerAlert.severity) }}>{drawerAlert.riskScore} / 100</div>
                </div>
                <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.bgCard, border: `1px solid ${BRAND.border}` }}>
                  <div className="text-[10px]" style={{ color: BRAND.textMute }}>对象</div>
                  <div className="font-mono mt-1" style={{ color: BRAND.text }}>{drawerAlert.subject}</div>
                </div>
                <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.bgCard, border: `1px solid ${BRAND.border}` }}>
                  <div className="text-[10px]" style={{ color: BRAND.textMute }}>关联规则</div>
                  <div className="font-mono mt-1" style={{ color: BRAND.primary }}>{drawerAlert.ruleId}</div>
                </div>
              </div>

              <div className="mb-4">
                <div className="text-sm font-semibold mb-2">证据</div>
                <div className="space-y-1">
                  {drawerAlert.evidence.map((e, i) => (
                    <div key={i} className="p-2 rounded text-xs font-mono" style={{ backgroundColor: BRAND.bgCard, border: `1px solid ${BRAND.border}`, color: BRAND.textSub }}>
                      {e}
                    </div>
                  ))}
                </div>
              </div>

              {drawerAlert.amount && (
                <div className="p-3 rounded-lg mb-4" style={{ backgroundColor: BRAND.warningLt, border: `1px solid ${BRAND.warning}40` }}>
                  <div className="text-[10px]" style={{ color: BRAND.warning }}>涉及金额</div>
                  <div className="text-lg font-mono font-bold" style={{ color: BRAND.warning }}>{drawerAlert.amount.toLocaleString()} {drawerAlert.currency}</div>
                </div>
              )}

              <div className="flex gap-2">
                <button className="flex-1 py-2 rounded-lg text-sm font-medium" style={{ backgroundColor: BRAND.primary, color: BRAND.onPrimary }}>
                  <CheckCircle2 size={14} className="inline mr-1" />确认告警
                </button>
                <button className="flex-1 py-2 rounded-lg text-sm font-medium" style={{ backgroundColor: BRAND.danger, color: BRAND.onPrimary }}>
                  <Lock size={14} className="inline mr-1" />触发冻结
                </button>
                <button className="px-4 py-2 rounded-lg text-sm" style={{ backgroundColor: BRAND.bgCard, color: BRAND.text, border: `1px solid ${BRAND.border}` }}>
                  <XCircle size={14} />
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* 规则详情 Drawer */}
      {drawer.open && drawer.type === 'rule' && drawerRule && (
        <>
          <div className="fixed inset-0 z-40" style={{ backgroundColor: BRAND.overlay }} onClick={() => setDrawer({ open: false, type: null, payload: null })} />
          <div className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-2xl overflow-y-auto scrollbar-thin drawer-anim" style={{ backgroundColor: BRAND.bg, borderLeft: `1px solid ${BRAND.border}` }}>
            <div className="sticky top-0 p-4 flex items-center justify-between" style={{ backgroundColor: BRAND.bg, borderBottom: `1px solid ${BRAND.border}` }}>
              <div className="text-base font-semibold flex items-center gap-2">
                <GitBranch size={16} style={{ color: BRAND.primary }} />
                规则详情
              </div>
              <button onClick={() => setDrawer({ open: false, type: null, payload: null })} className="p-1"><X size={18} style={{ color: BRAND.textMute }} /></button>
            </div>
            <div className="p-6">
              <h2 className="text-xl font-bold mb-2" style={{ color: BRAND.text }}>{drawerRule.name}</h2>
              <p className="text-sm mb-4" style={{ color: BRAND.textSub }}>{drawerRule.description}</p>

              <div className="grid grid-cols-2 gap-2 mb-4 text-sm">
                <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.bgCard, border: `1px solid ${BRAND.border}` }}>
                  <div className="text-[10px]" style={{ color: BRAND.textMute }}>规则 ID</div>
                  <div className="font-mono mt-1" style={{ color: BRAND.primary }}>{drawerRule.id}</div>
                </div>
                <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.bgCard, border: `1px solid ${BRAND.border}` }}>
                  <div className="text-[10px]" style={{ color: BRAND.textMute }}>优先级</div>
                  <div className="font-mono mt-1" style={{ color: BRAND.text }}>{drawerRule.priority}</div>
                </div>
                <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.bgCard, border: `1px solid ${BRAND.border}` }}>
                  <div className="text-[10px]" style={{ color: BRAND.textMute }}>触发条件</div>
                  <div className="font-mono mt-1 text-xs" style={{ color: BRAND.text }}>{drawerRule.trigger}</div>
                </div>
                <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.bgCard, border: `1px solid ${BRAND.border}` }}>
                  <div className="text-[10px]" style={{ color: BRAND.textMute }}>触发动作</div>
                  <div className="mt-1 text-xs" style={{ color: BRAND.warning }}>{ruleActionLabel(drawerRule.action)}</div>
                </div>
                <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.bgCard, border: `1px solid ${BRAND.border}` }}>
                  <div className="text-[10px]" style={{ color: BRAND.textMute }}>累计触发</div>
                  <div className="font-mono mt-1" style={{ color: BRAND.text }}>{drawerRule.hitCount.toLocaleString()}</div>
                </div>
                <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.bgCard, border: `1px solid ${BRAND.border}` }}>
                  <div className="text-[10px]" style={{ color: BRAND.textMute }}>误报率</div>
                  <div className="font-mono mt-1" style={{ color: BRAND.text }}>{drawerRule.falsePositiveRate}%</div>
                </div>
              </div>

              <div className="mb-4">
                <div className="text-sm font-semibold mb-2">阈值配置</div>
                <div className="space-y-1">
                  {drawerRule.thresholds.map((t, i) => (
                    <div key={i} className="p-2 rounded flex items-center justify-between" style={{ backgroundColor: BRAND.bgCard, border: `1px solid ${BRAND.border}` }}>
                      <span className="text-xs" style={{ color: BRAND.textSub }}>{t.metric}</span>
                      <span className="font-mono text-xs" style={{ color: BRAND.text }}>{t.op} {t.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* 应急冻结 Drawer */}
      {drawer.open && drawer.type === 'freeze' && (
        <>
          <div className="fixed inset-0 z-40" style={{ backgroundColor: BRAND.overlay }} onClick={() => { setDrawer({ open: false, type: null, payload: null }); setFreezeStep(0); }} />
          <div className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-2xl overflow-y-auto scrollbar-thin drawer-anim" style={{ backgroundColor: BRAND.bg, borderLeft: `1px solid ${BRAND.border}` }}>
            <div className="sticky top-0 p-4 flex items-center justify-between" style={{ backgroundColor: BRAND.bg, borderBottom: `1px solid ${BRAND.border}` }}>
              <div className="text-base font-semibold flex items-center gap-2">
                <Lock size={16} style={{ color: BRAND.danger }} />
                {drawer.payload === 'new' ? '应急冻结向导' : '冻结详情'}
              </div>
              <button onClick={() => { setDrawer({ open: false, type: null, payload: null }); setFreezeStep(0); }} className="p-1"><X size={18} style={{ color: BRAND.textMute }} /></button>
            </div>

            {drawer.payload === 'new' ? (
              <div className="p-6">
                <div className="flex items-center gap-2 mb-6">
                  {['选择类型', '确认对象', '填写原因', '提交审批'].map((s, i) => (
                    <React.Fragment key={i}>
                      <div className="flex items-center gap-1">
                        <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold" style={{ backgroundColor: i <= freezeStep ? BRAND.danger : BRAND.bgCard, color: i <= freezeStep ? BRAND.onPrimary : BRAND.textMute, border: `1px solid ${i <= freezeStep ? BRAND.danger : BRAND.border}` }}>{i + 1}</div>
                        <span className="text-xs" style={{ color: i === freezeStep ? BRAND.text : BRAND.textMute }}>{s}</span>
                      </div>
                      {i < 3 && <ChevronRight size={12} style={{ color: BRAND.textMute }} />}
                    </React.Fragment>
                  ))}
                </div>

                {freezeStep === 0 && (
                  <div className="space-y-2">
                    <div className="text-sm font-semibold mb-2">选择冻结类型</div>
                    {(['withdraw', 'login', 'trading', 'api', 'full'] as const).map((t) => (
                      <button
                        key={t}
                        onClick={() => setFreezeType(t)}
                        className="w-full p-3 rounded-lg text-left flex items-center gap-3"
                        style={{ backgroundColor: freezeType === t ? BRAND.dangerLt : BRAND.bgCard, border: `1px solid ${freezeType === t ? BRAND.danger : BRAND.border}` }}
                      >
                        <Lock size={16} style={{ color: freezeType === t ? BRAND.danger : BRAND.textMute }} />
                        <span className="text-sm" style={{ color: freezeType === t ? BRAND.danger : BRAND.text }}>{freezeTypeLabel(t)}</span>
                      </button>
                    ))}
                  </div>
                )}

                {freezeStep === 1 && (
                  <div className="space-y-3">
                    <div className="text-sm font-semibold mb-2">确认冻结对象</div>
                    <input
                      type="text"
                      placeholder="用户 ID (例如 U-1234***)"
                      value={freezeTarget}
                      onChange={(e) => setFreezeTarget(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg outline-none text-sm"
                      style={{ backgroundColor: BRAND.bgCard, color: BRAND.text, border: `1px solid ${BRAND.border}` }}
                    />
                    <div className="text-xs" style={{ color: BRAND.textMute }}>支持用户 ID / UID / 邮箱 / 手机号模糊查询</div>
                  </div>
                )}

                {freezeStep === 2 && (
                  <div className="space-y-3">
                    <div className="text-sm font-semibold mb-2">填写冻结原因</div>
                    <textarea
                      value={freezeReason}
                      onChange={(e) => setFreezeReason(e.target.value)}
                      placeholder="详细说明冻结原因、关联告警 ID、参考规则..."
                      rows={5}
                      className="w-full px-3 py-2 rounded-lg outline-none text-sm resize-none"
                      style={{ backgroundColor: BRAND.bgCard, color: BRAND.text, border: `1px solid ${BRAND.border}` }}
                    />
                  </div>
                )}

                {freezeStep === 3 && (
                  <div className="space-y-3">
                    <div className="text-sm font-semibold mb-2">确认提交</div>
                    <div className="p-4 rounded-lg space-y-2 text-xs" style={{ backgroundColor: BRAND.bgCard, border: `1px solid ${BRAND.border}` }}>
                      <div className="flex justify-between"><span style={{ color: BRAND.textMute }}>冻结类型</span><span style={{ color: BRAND.text }}>{freezeTypeLabel(freezeType)}</span></div>
                      <div className="flex justify-between"><span style={{ color: BRAND.textMute }}>冻结对象</span><span className="font-mono" style={{ color: BRAND.text }}>{freezeTarget || '-'}</span></div>
                      <div className="flex justify-between"><span style={{ color: BRAND.textMute }}>原因</span><span className="text-right max-w-[60%]" style={{ color: BRAND.text }}>{freezeReason || '-'}</span></div>
                    </div>
                    <div className="p-3 rounded-lg text-xs flex items-start gap-2" style={{ backgroundColor: BRAND.dangerLt, color: BRAND.textSub, border: `1px solid ${BRAND.danger}40` }}>
                      <AlertTriangle size={14} className="mt-0.5 flex-shrink-0" style={{ color: BRAND.danger }} />
                      <div>提交后需由合规/风控负责人审批。审批通过前为"待审批"状态，不会立即生效。</div>
                    </div>
                  </div>
                )}

                <div className="flex gap-2 mt-6">
                  {freezeStep > 0 && (
                    <button onClick={() => setFreezeStep(freezeStep - 1)} className="px-4 py-2 rounded-lg text-sm" style={{ backgroundColor: BRAND.bgCard, color: BRAND.text, border: `1px solid ${BRAND.border}` }}>
                      上一步
                    </button>
                  )}
                  <button
                    onClick={() => freezeStep < 3 ? setFreezeStep(freezeStep + 1) : (() => { setDrawer({ open: false, type: null, payload: null }); setFreezeStep(0); })()}
                    className="flex-1 py-2 rounded-lg text-sm font-medium"
                    style={{ backgroundColor: BRAND.danger, color: BRAND.onPrimary }}
                  >
                    {freezeStep < 3 ? '下一步' : '提交审批'}
                  </button>
                </div>
              </div>
            ) : drawerFreeze ? (
              <div className="p-6">
                <h2 className="text-xl font-bold mb-2" style={{ color: BRAND.text }}>{freezeTypeLabel(drawerFreeze.type)}</h2>
                <p className="text-sm mb-4" style={{ color: BRAND.textSub }}>{drawerFreeze.reason}</p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span style={{ color: BRAND.textMute }}>对象</span><span className="font-mono" style={{ color: BRAND.text }}>{drawerFreeze.target}</span></div>
                  <div className="flex justify-between"><span style={{ color: BRAND.textMute }}>发起人</span><span style={{ color: BRAND.text }}>{drawerFreeze.initiatedBy}</span></div>
                  {drawerFreeze.approvedBy && <div className="flex justify-between"><span style={{ color: BRAND.textMute }}>审批人</span><span style={{ color: BRAND.text }}>{drawerFreeze.approvedBy}</span></div>}
                  <div className="flex justify-between"><span style={{ color: BRAND.textMute }}>发起时间</span><span className="font-mono" style={{ color: BRAND.text }}>{drawerFreeze.initiatedAt}</span></div>
                  {drawerFreeze.expiresAt && <div className="flex justify-between"><span style={{ color: BRAND.textMute }}>到期时间</span><span className="font-mono" style={{ color: BRAND.text }}>{drawerFreeze.expiresAt}</span></div>}
                </div>
                <div className="mt-4 flex gap-2">
                  <button className="flex-1 py-2 rounded-lg text-sm font-medium" style={{ backgroundColor: BRAND.success, color: BRAND.onPrimary }}>
                    <Unlock size={14} className="inline mr-1" />解冻
                  </button>
                  <button className="flex-1 py-2 rounded-lg text-sm" style={{ backgroundColor: BRAND.bgCard, color: BRAND.text, border: `1px solid ${BRAND.border}` }}>
                    <FileText size={14} className="inline mr-1" />查看审计
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </>
      )}

      {/* 审计详情 Drawer */}
      {drawer.open && drawer.type === 'audit' && drawerAudit && (
        <>
          <div className="fixed inset-0 z-40" style={{ backgroundColor: BRAND.overlay }} onClick={() => setDrawer({ open: false, type: null, payload: null })} />
          <div className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-2xl overflow-y-auto scrollbar-thin drawer-anim" style={{ backgroundColor: BRAND.bg, borderLeft: `1px solid ${BRAND.border}` }}>
            <div className="sticky top-0 p-4 flex items-center justify-between" style={{ backgroundColor: BRAND.bg, borderBottom: `1px solid ${BRAND.border}` }}>
              <div className="text-base font-semibold flex items-center gap-2">
                <FileText size={16} style={{ color: BRAND.primary }} />
                审计详情
              </div>
              <button onClick={() => setDrawer({ open: false, type: null, payload: null })} className="p-1"><X size={18} style={{ color: BRAND.textMute }} /></button>
            </div>
            <div className="p-6">
              <h2 className="text-xl font-bold mb-2" style={{ color: BRAND.text }}>{actionLabel(drawerAudit.action)}</h2>
              <p className="text-sm mb-4" style={{ color: BRAND.textSub }}>{drawerAudit.details}</p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span style={{ color: BRAND.textMute }}>操作人</span><span style={{ color: BRAND.text }}>{drawerAudit.actor}</span></div>
                <div className="flex justify-between"><span style={{ color: BRAND.textMute }}>对象</span><span className="font-mono" style={{ color: BRAND.text }}>{drawerAudit.target}</span></div>
                <div className="flex justify-between"><span style={{ color: BRAND.textMute }}>时间</span><span className="font-mono" style={{ color: BRAND.text }}>{drawerAudit.timestamp}</span></div>
                <div className="flex justify-between"><span style={{ color: BRAND.textMute }}>IP</span><span className="font-mono" style={{ color: BRAND.text }}>{drawerAudit.ip}</span></div>
                <div className="flex justify-between"><span style={{ color: BRAND.textMute }}>UA</span><span className="font-mono text-xs" style={{ color: BRAND.text }}>{drawerAudit.userAgent}</span></div>
                <div className="flex justify-between"><span style={{ color: BRAND.textMute }}>结果</span><span style={{ color: drawerAudit.result === 'success' ? BRAND.success : BRAND.danger }}>{drawerAudit.result === 'success' ? '成功' : drawerAudit.result === 'failure' ? '失败' : '部分'}</span></div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* 帮助 Drawer */}
      {helpOpen && (
        <>
          <div className="fixed inset-0 z-40" style={{ backgroundColor: BRAND.overlay }} onClick={() => setHelpOpen(false)} />
          <div className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md overflow-y-auto scrollbar-thin drawer-anim" style={{ backgroundColor: BRAND.bg, borderLeft: `1px solid ${BRAND.border}` }}>
            <div className="sticky top-0 p-4 flex items-center justify-between" style={{ backgroundColor: BRAND.bg, borderBottom: `1px solid ${BRAND.border}` }}>
              <div className="text-base font-semibold flex items-center gap-2"><Keyboard size={16} style={{ color: BRAND.primary }} />快捷键</div>
              <button onClick={() => setHelpOpen(false)} className="p-1"><X size={18} style={{ color: BRAND.textMute }} /></button>
            </div>
            <div className="p-6 space-y-2">
              {[
                { key: '/', desc: '聚焦搜索框' },
                { key: '?', desc: '切换帮助面板' },
                { key: 'Esc', desc: '关闭抽屉 / 清除搜索' },
              ].map((s, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: BRAND.bgCard, border: `1px solid ${BRAND.border}` }}>
                  <span className="text-sm" style={{ color: BRAND.textSub }}>{s.desc}</span>
                  <span className="kbd">{s.key}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
