'use client';

/**
 * PortalKyc - KYC/实名认证中心（2026-07-19 Q05 P3.20）
 *
 * 页面定位：
 * - 中萨数字科技交易所 KYC/实名认证中心
 * - 个人认证 / 企业 KYB / 高级认证 / 多因子认证 / 认证状态 / 资料管理
 * - 与 P3.14 合规 / P3.15 风险形成"身份-合规-风险"三角闭环
 *
 * L4 工业级设计标准：
 * - 暗色 v6 纯黑 #000000 + 卡片 #141414 + ZSDEX 绿 primary #14B881
 * - 10 大区块：Hero / 实时 KPI / 我的认证等级 / 认证流程 / 高级认证 / 企业 KYB / 安全设置 / 认证历史 / 风险评估 / 帮助 / 底部 CTA
 * - 9+ 交互：Tab 切换 / 等级选择 / 资料编辑 / 上传演示 / MFA 开关 / 生物识别模拟 / 搜索 / 排序 / 快捷键
 * - 5+ Drawer：认证详情 / 上传向导 / 安全日志 / 帮助 / 通知偏好
 * - 4+ 实时数据：待审核任务 / 认证完成率 / 安全评分 / 风控拦截
 * - 4+ 动画：Stagger / CountUp / Hover / Pulse
 *
 * 合规要点（Q05 硬约束）：
 * - 不接真实 API，所有身份证件、KYB 资料、认证状态使用 mock 占位
 * - 状态徽章统一使用 STATUS 枚举
 * - 不修改旧官网 / 旧 H5 / disabled pages
 * - 明确告知"合规研究方向"性质，不承诺监管认证
 * - 涉及个人信息的字段全部使用脱敏 mock
 */

import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import {
  Search,
  X,
  ChevronRight,
  ChevronLeft,
  ChevronUp,
  ChevronDown,
  Shield,
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  User,
  Users,
  Building2,
  Briefcase,
  Mail,
  Phone,
  MapPin,
  Globe2,
  Calendar,
  FileText,
  Upload,
  Download,
  Camera,
  Fingerprint,
  ScanFace,
  KeyRound,
  Lock,
  Eye,
  EyeOff,
  Sparkles,
  ArrowUpRight,
  ArrowDownLeft,
  Activity,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Layers,
  Network,
  Database,
  Cpu,
  Server,
  Cloud,
  Award,
  Trophy,
  Star,
  Heart,
  Zap,
  HelpCircle,
  Keyboard,
  ChevronRight as ChevR,
  Plus,
  Minus,
  Code2,
  Boxes,
  Wallet,
  Coins,
  CreditCard,
  Smartphone,
  Bell,
  BellOff,
  Settings,
  Sliders,
  Compass,
  Flag,
  Map,
  Bookmark,
  Copy,
  ExternalLink,
  Hash,
  Wallet as WalletIcon,
} from 'lucide-react';
import { BRAND, STATUS } from './brand';

// ============== 类型 ==============

type KycLevel = 'basic' | 'intermediate' | 'advanced' | 'institutional';
type KycStatus = 'unverified' | 'pending' | 'verified' | 'rejected' | 'expired' | 'reviewing';
type Tab = 'overview' | 'personal' | 'corporate' | 'security' | 'documents' | 'history' | 'risk' | 'help';
type DocType = 'id-front' | 'id-back' | 'selfie' | 'address' | 'income' | 'source-of-funds' | 'business-license' | 'articles' | 'tax' | 'beneficial-owner';
type DrawerType = 'upload' | 'log' | 'help' | 'mfa' | 'biometric' | 'document' | null;

interface KycTier {
  id: KycLevel;
  name: string;
  dailyLimit: number; // USD
  monthlyLimit: number; // USD
  features: string[];
  requirements: string[];
  duration: string;
  badge: string;
  color: string;
  icon: any;
}

interface DocumentItem {
  id: string;
  type: DocType;
  name: string;
  status: 'pending' | 'uploaded' | 'verified' | 'rejected' | 'expired';
  uploadedAt: string;
  expiresAt?: string;
  fileSize: string;
  format: string;
  rejectionReason?: string;
}

interface SecurityLog {
  id: string;
  type: 'login' | 'kyc' | 'transaction' | 'password' | 'mfa' | 'biometric' | 'api';
  action: string;
  ip: string;
  device: string;
  location: string;
  status: 'success' | 'failed' | 'suspicious';
  timestamp: string;
}

interface CorporateBeneficial {
  id: string;
  name: string;
  role: string;
  ownership: number; // %
  nationality: string;
  kycStatus: KycStatus;
}

interface RiskIndicator {
  id: string;
  name: string;
  score: number; // 0-100
  level: 'low' | 'medium' | 'high';
  description: string;
  lastCheck: string;
}

interface UserProfile {
  nickname: string;
  email: string; // mock
  phone: string; // mock
  country: string;
  region: string;
  currentLevel: KycLevel;
  verifiedAt: string;
  expiresAt: string;
  totalScore: number; // 0-1000
  riskLevel: 'low' | 'medium' | 'high';
  twoFAEnabled: boolean;
  biometricEnabled: boolean;
  whitelistEnabled: boolean;
  apiKeyEnabled: boolean;
}

interface KpiSnapshot {
  pendingReviews: number;
  verifiedToday: number;
  averageTime: number; // minutes
  completionRate: number; // %
  activeSessions: number;
  riskBlocks: number;
  biometricUsers: number;
  mfaUsers: number;
}

interface DrawerState {
  open: boolean;
  type: DrawerType;
  payload: string | null;
}

// ============== Mock 数据 ==============

const KYC_TIERS: KycTier[] = [
  {
    id: 'basic',
    name: '基础认证',
    dailyLimit: 2000,
    monthlyLimit: 20000,
    features: ['基础充值提现', '现货交易', '查看行情', 'Launch 申购（小额）'],
    requirements: ['手机号验证', '邮箱验证', '国籍声明'],
    duration: '约 3 分钟',
    badge: '🌱',
    color: BRAND.success,
    icon: User,
  },
  {
    id: 'intermediate',
    name: '中级认证',
    dailyLimit: 50000,
    monthlyLimit: 500000,
    features: ['基础认证全部功能', '法币交易', 'P2P/OTC', 'Launch 申购（中额）', 'Earn 理财'],
    requirements: ['基础认证', '身份证件（正反面）', '人脸活体识别', '地址证明'],
    duration: '约 10 分钟',
    badge: '🌿',
    color: BRAND.primary,
    icon: Shield,
  },
  {
    id: 'advanced',
    name: '高级认证',
    dailyLimit: 500000,
    monthlyLimit: 5000000,
    features: ['中级认证全部功能', '合约交易', '大额 OTC', 'Launch 大额申购', 'API 交易', '高阶 Earn'],
    requirements: ['中级认证', '收入证明', '资金来源说明', '视频面签（必要时）'],
    duration: '约 30 分钟',
    badge: '🌳',
    color: BRAND.warning,
    icon: ShieldCheck,
  },
  {
    id: 'institutional',
    name: '机构认证（KYB）',
    dailyLimit: 50000000,
    monthlyLimit: 500000000,
    features: ['高级认证全部功能', 'OTC 大宗', '做市商服务', '项目发行', 'API 机构权限', '专属客户经理'],
    requirements: ['企业基础信息', '营业执照', '公司章程', '股权结构', '实益所有人', '企业 KYC'],
    duration: '约 5-10 个工作日',
    badge: '🏛️',
    color: '#7c3aed',
    icon: Building2,
  },
];

const DOCUMENTS: DocumentItem[] = [
  { id: 'd-001', type: 'id-front', name: '身份证正面', status: 'verified', uploadedAt: '2025-08-15 10:32', fileSize: '2.3 MB', format: 'JPG' },
  { id: 'd-002', type: 'id-back', name: '身份证反面', status: 'verified', uploadedAt: '2025-08-15 10:33', fileSize: '2.1 MB', format: 'JPG' },
  { id: 'd-003', type: 'selfie', name: '人脸活体视频', status: 'verified', uploadedAt: '2025-08-15 10:38', fileSize: '8.5 MB', format: 'MP4' },
  { id: 'd-004', type: 'address', name: '地址证明（银行账单）', status: 'verified', uploadedAt: '2025-08-15 11:02', fileSize: '1.2 MB', format: 'PDF' },
  { id: 'd-005', type: 'income', name: '收入证明（工资单）', status: 'pending', uploadedAt: '2026-07-15 14:20', fileSize: '0.8 MB', format: 'PDF' },
  { id: 'd-006', type: 'source-of-funds', name: '资金来源说明', status: 'pending', uploadedAt: '2026-07-15 14:25', fileSize: '0.3 MB', format: 'PDF' },
];

const SECURITY_LOGS: SecurityLog[] = [
  { id: 'log-001', type: 'login', action: '登录', ip: '203.0.113.42', device: 'iPhone 15 Pro', location: '上海', status: 'success', timestamp: '2026-07-19 09:42:18' },
  { id: 'log-002', type: 'mfa', action: 'MFA 验证', ip: '203.0.113.42', device: 'iPhone 15 Pro', location: '上海', status: 'success', timestamp: '2026-07-19 09:42:25' },
  { id: 'log-003', type: 'transaction', action: '提现 USDT 5000', ip: '203.0.113.42', device: 'iPhone 15 Pro', location: '上海', status: 'success', timestamp: '2026-07-18 22:15:08' },
  { id: 'log-004', type: 'login', action: '登录失败', ip: '198.51.100.99', device: '未知设备', location: '海外', status: 'suspicious', timestamp: '2026-07-18 15:32:14' },
  { id: 'log-005', type: 'password', action: '修改登录密码', ip: '203.0.113.42', device: 'MacBook Pro', location: '上海', status: 'success', timestamp: '2026-07-17 11:08:32' },
  { id: 'log-006', type: 'biometric', action: 'Face ID 解锁', ip: '203.0.113.42', device: 'iPhone 15 Pro', location: '上海', status: 'success', timestamp: '2026-07-17 10:15:00' },
  { id: 'log-007', type: 'kyc', action: '提交高级认证资料', ip: '203.0.113.42', device: 'iPhone 15 Pro', location: '上海', status: 'success', timestamp: '2026-07-15 14:25:18' },
  { id: 'log-008', type: 'api', action: '创建 API Key', ip: '203.0.113.42', device: 'Web 端', location: '上海', status: 'success', timestamp: '2026-07-12 09:45:00' },
];

const BENEFICIAL_OWNERS: CorporateBeneficial[] = [
  { id: 'bo-001', name: '张**', role: '法定代表人 / 大股东', ownership: 65, nationality: '中国', kycStatus: 'verified' },
  { id: 'bo-002', name: '李**', role: '联合创始人 / 股东', ownership: 25, nationality: '中国', kycStatus: 'verified' },
  { id: 'bo-003', name: '王**', role: '财务负责人', ownership: 0, nationality: '中国', kycStatus: 'pending' },
  { id: 'bo-004', name: '陈**', role: '技术负责人', ownership: 10, nationality: '中国', kycStatus: 'pending' },
];

const RISK_INDICATORS: RiskIndicator[] = [
  { id: 'r-001', name: '账户安全评分', score: 92, level: 'low', description: '已启用 MFA + 生物识别 + 设备绑定', lastCheck: '2026-07-19 08:00' },
  { id: 'r-002', name: '交易行为评分', score: 86, level: 'low', description: '交易模式正常，无异常波动', lastCheck: '2026-07-19 06:00' },
  { id: 'r-003', name: '资金来源清晰度', score: 78, level: 'low', description: '工资收入 + 投资回报，已提交证明', lastCheck: '2026-07-18 22:00' },
  { id: 'r-004', name: '设备与地理位置', score: 95, level: 'low', description: '固定设备 + 固定地理位置', lastCheck: '2026-07-19 09:42' },
  { id: 'r-005', name: '可疑活动监测', score: 100, level: 'low', description: '近 30 天无任何可疑活动', lastCheck: '2026-07-19 09:00' },
  { id: 'r-006', name: '合规历史记录', score: 88, level: 'low', description: '无违规记录，KYC/KYB 资料齐全', lastCheck: '2026-07-19 00:00' },
];

const PROFILE: UserProfile = {
  nickname: 'User_***8421',
  email: 'u***8****@example.com',
  phone: '+86 138****8821',
  country: '中国',
  region: '上海',
  currentLevel: 'intermediate',
  verifiedAt: '2025-08-16',
  expiresAt: '2027-08-16',
  totalScore: 856,
  riskLevel: 'low',
  twoFAEnabled: true,
  biometricEnabled: true,
  whitelistEnabled: true,
  apiKeyEnabled: false,
};

// ============== 工具函数 ==============

const formatNumber = (n: number): string => {
  if (n >= 100000000) return (n / 100000000).toFixed(2) + ' 亿';
  if (n >= 10000) return (n / 10000).toFixed(2) + ' 万';
  return n.toLocaleString('zh-CN');
};

const formatCurrency = (n: number): string => {
  if (n >= 100000000) return `¥${(n / 100000000).toFixed(2)} 亿`;
  if (n >= 10000) return `¥${(n / 10000).toFixed(2)} 万`;
  return `¥${n.toLocaleString('zh-CN')}`;
};

const formatDate = (date: string): string => {
  const d = new Date(date);
  if (isNaN(d.getTime())) return date;
  return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`;
};

const STATUS_MAP: Record<KycStatus, { label: string; color: string; bg: string }> = {
  unverified: { label: '未认证', color: BRAND.textMute, bg: 'rgba(112, 112, 112, 0.12)' },
  pending: { label: '审核中', color: BRAND.warning, bg: BRAND.warningLt },
  verified: { label: '已通过', color: BRAND.success, bg: BRAND.successLt },
  rejected: { label: '已拒绝', color: BRAND.danger, bg: BRAND.dangerLt },
  expired: { label: '已过期', color: BRAND.textSub, bg: 'rgba(176, 176, 176, 0.12)' },
  reviewing: { label: '复审中', color: BRAND.info, bg: BRAND.infoLt },
};

const DOC_TYPE_MAP: Record<DocType, { label: string; icon: any; color: string }> = {
  'id-front': { label: '身份证正面', icon: CreditCard, color: BRAND.info },
  'id-back': { label: '身份证反面', icon: CreditCard, color: BRAND.info },
  'selfie': { label: '人脸活体', icon: ScanFace, color: BRAND.primary },
  'address': { label: '地址证明', icon: MapPin, color: BRAND.warning },
  'income': { label: '收入证明', icon: FileText, color: BRAND.success },
  'source-of-funds': { label: '资金来源', icon: Wallet, color: BRAND.danger },
  'business-license': { label: '营业执照', icon: Building2, color: BRAND.gold },
  'articles': { label: '公司章程', icon: FileText, color: BRAND.info },
  'tax': { label: '税务登记', icon: FileText, color: BRAND.success },
  'beneficial-owner': { label: '实益所有人', icon: User, color: BRAND.warning },
};

// ============== 主组件 ==============

export function PortalKyc() {
  const [tab, setTab] = useState<Tab>('overview');
  const [search, setSearch] = useState('');
  const [tierFilter, setTierFilter] = useState<KycLevel | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<KycStatus | 'all'>('all');
  const [sortBy, setSortBy] = useState<'time' | 'type' | 'status'>('time');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [drawer, setDrawer] = useState<DrawerState>({ open: false, type: null, payload: null });
  const [helpOpen, setHelpOpen] = useState(false);
  const [profile, setProfile] = useState<UserProfile>(PROFILE);
  const [kpi, setKpi] = useState<KpiSnapshot>({
    pendingReviews: 1248,
    verifiedToday: 384,
    averageTime: 18,
    completionRate: 86,
    activeSessions: 12,
    riskBlocks: 24,
    biometricUsers: 28420,
    mfaUsers: 48620,
  });
  const searchRef = useRef<HTMLInputElement>(null);

  // ========== 实时数据更新 ==========
  useEffect(() => {
    const t = setInterval(() => {
      setKpi((prev) => ({
        ...prev,
        pendingReviews: Math.max(800, prev.pendingReviews + Math.floor(Math.random() * 20 - 8)),
        verifiedToday: prev.verifiedToday + (Math.random() > 0.6 ? 1 : 0),
        activeSessions: Math.max(8, Math.min(20, prev.activeSessions + Math.floor(Math.random() * 3 - 1))),
        riskBlocks: prev.riskBlocks + (Math.random() > 0.85 ? 1 : 0),
      }));
    }, 4000);
    return () => clearInterval(t);
  }, []);

  // ========== 快捷键 ==========
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (e.key === '/') {
        e.preventDefault();
        searchRef.current?.focus();
      } else if (e.key === 'Escape') {
        if (drawer.open) setDrawer({ open: false, type: null, payload: null });
        else if (helpOpen) setHelpOpen(false);
      } else if (e.key === '?') {
        setHelpOpen((v) => !v);
      } else if (e.key === '1') setTab('overview');
      else if (e.key === '2') setTab('personal');
      else if (e.key === '3') setTab('corporate');
      else if (e.key === '4') setTab('security');
      else if (e.key === '5') setTab('documents');
      else if (e.key === '6') setTab('history');
      else if (e.key === '7') setTab('risk');
      else if (e.key === '8') setTab('help');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [drawer.open, helpOpen]);

  // ========== 过滤与排序 ==========
  const filteredDocuments = useMemo(() => {
    let list = [...DOCUMENTS];
    if (statusFilter !== 'all') list = list.filter((d) => d.status === statusFilter);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (d) => d.name.toLowerCase().includes(q) || d.type.toLowerCase().includes(q)
      );
    }
    list.sort((a, b) => {
      let diff = 0;
      if (sortBy === 'time') diff = new Date(a.uploadedAt).getTime() - new Date(b.uploadedAt).getTime();
      else if (sortBy === 'type') diff = a.type.localeCompare(b.type);
      else if (sortBy === 'status') diff = a.status.localeCompare(b.status);
      return sortDir === 'asc' ? diff : -diff;
    });
    return list;
  }, [statusFilter, search, sortBy, sortDir]);

  const filteredLogs = useMemo(() => {
    let list = [...SECURITY_LOGS];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (l) =>
          l.action.toLowerCase().includes(q) ||
          l.device.toLowerCase().includes(q) ||
          l.ip.includes(q) ||
          l.location.toLowerCase().includes(q)
      );
    }
    list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return list;
  }, [search]);

  // ========== Handlers ==========
  const openDrawer = useCallback((type: DrawerType, payload: string | null = null) => {
    setDrawer({ open: true, type, payload });
  }, []);

  const closeDrawer = useCallback(() => {
    setDrawer({ open: false, type: null, payload: null });
  }, []);

  const toggle2FA = useCallback(() => {
    setProfile((prev) => ({ ...prev, twoFAEnabled: !prev.twoFAEnabled }));
  }, []);

  const toggleBiometric = useCallback(() => {
    setProfile((prev) => ({ ...prev, biometricEnabled: !prev.biometricEnabled }));
  }, []);

  const toggleWhitelist = useCallback(() => {
    setProfile((prev) => ({ ...prev, whitelistEnabled: !prev.whitelistEnabled }));
  }, []);

  // 当前 Drawer payload
  const drawerDoc = drawer.type === 'document' ? DOCUMENTS.find((d) => d.id === drawer.payload) : null;
  const drawerLog = drawer.type === 'log' ? SECURITY_LOGS.find((l) => l.id === drawer.payload) : null;

  // KpiCard
  const KpiCard = ({ label, value, suffix, icon: Icon, color, trend, hint }: { label: string; value: string | number; suffix?: string; icon: any; color: string; trend?: number; hint?: string }) => {
    const [display, setDisplay] = useState(0);
    useEffect(() => {
      const target = typeof value === 'number' ? value : parseFloat(String(value).replace(/,/g, ''));
      if (isNaN(target)) return;
      const start = display;
      const duration = 800;
      const t0 = performance.now();
      const step = (now: number) => {
        const p = Math.min(1, (now - t0) / duration);
        const ease = 1 - Math.pow(1 - p, 3);
        setDisplay(start + (target - start) * ease);
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }, [value]);
    return (
      <div
        className="p-4 rounded-xl transition-all duration-200 hover:scale-[1.02]"
        style={{ backgroundColor: BRAND.bgCard, border: `1px solid ${BRAND.border}` }}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${color}20`, color }}>
            <Icon size={18} />
          </div>
          {trend !== undefined && (
            <span className="text-xs font-mono flex items-center gap-1" style={{ color: trend >= 0 ? BRAND.success : BRAND.danger }}>
              {trend >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownLeft size={12} />}
              {Math.abs(trend).toFixed(1)}%
            </span>
          )}
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-bold font-mono" style={{ color: BRAND.text }}>
            {typeof display === 'number' && !isNaN(display) ? (Number.isInteger(value) ? formatNumber(Math.round(display)) : display.toFixed(2)) : value}
          </span>
          {suffix && <span className="text-xs" style={{ color: BRAND.textMute }}>{suffix}</span>}
        </div>
        <div className="text-xs mt-1" style={{ color: BRAND.textSub }}>{label}</div>
        {hint && <div className="text-[10px] mt-2" style={{ color: BRAND.textMute }}>{hint}</div>}
      </div>
    );
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: BRAND.bg, color: BRAND.text }}>
      {/* ========== Hero ========== */}
      <section className="px-4 lg:px-8 py-10 lg:py-14" style={{ background: `linear-gradient(180deg, ${BRAND.bg} 0%, ${BRAND.bgCard} 100%)` }}>
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-2 mb-3">
            <Shield size={18} style={{ color: BRAND.primary }} />
            <span className="text-xs font-mono tracking-wider" style={{ color: BRAND.primary }}>ZSDEX KYC CENTER · 实名认证中心</span>
          </div>
          <h1 className="text-3xl lg:text-4xl font-bold mb-3" style={{ color: BRAND.text }}>
            安全 · 合规 · 可信
          </h1>
          <p className="text-sm lg:text-base max-w-3xl" style={{ color: BRAND.textSub }}>
            中萨数字科技交易所 KYC/实名认证中心。提供个人认证、企业 KYB、高级认证、多因子认证与风险评估体系。
            所有认证流程严格遵循合规研究方向，不承诺任何特定监管认证，仅用于平台用户身份核验与风险控制。
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <button
              onClick={() => setTab('personal')}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-all hover:scale-105"
              style={{ backgroundColor: BRAND.primary, color: BRAND.onPrimary }}
            >
              <User size={14} className="inline mr-1" /> 个人认证
            </button>
            <button
              onClick={() => setTab('corporate')}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-all hover:scale-105"
              style={{ backgroundColor: BRAND.bgCard, color: BRAND.text, border: `1px solid ${BRAND.border}` }}
            >
              <Building2 size={14} className="inline mr-1" /> 企业 KYB
            </button>
            <button
              onClick={() => setTab('security')}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-all hover:scale-105"
              style={{ backgroundColor: BRAND.bgCard, color: BRAND.text, border: `1px solid ${BRAND.border}` }}
            >
              <ShieldCheck size={14} className="inline mr-1" /> 安全中心
            </button>
            <button
              onClick={() => setHelpOpen(true)}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-all hover:scale-105"
              style={{ backgroundColor: BRAND.bgCard, color: BRAND.text, border: `1px solid ${BRAND.border}` }}
            >
              <Keyboard size={14} className="inline mr-1" /> 快捷键
            </button>
          </div>
        </div>
      </section>

      {/* ========== 实时 KPI ========== */}
      <section className="px-4 lg:px-8 py-6">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-3">
          <KpiCard label="待审核任务" value={kpi.pendingReviews} icon={Clock} color={BRAND.warning} trend={2.4} hint="实时队列" />
          <KpiCard label="今日通过" value={kpi.verifiedToday} icon={CheckCircle2} color={BRAND.success} trend={5.8} hint="较昨日 +22" />
          <KpiCard label="平均时长" value={kpi.averageTime} suffix="分钟" icon={Activity} color={BRAND.primary} trend={-3.2} hint="流程优化中" />
          <KpiCard label="完成率" value={kpi.completionRate} suffix="%" icon={BarChart3} color={BRAND.info} trend={1.5} hint="通过率" />
          <KpiCard label="活跃会话" value={kpi.activeSessions} icon={User} color="#7c3aed" trend={0.8} hint="当前设备" />
          <KpiCard label="风险拦截" value={kpi.riskBlocks} icon={ShieldAlert} color={BRAND.danger} trend={-1.5} hint="近 24h" />
          <KpiCard label="MFA 用户" value={kpi.mfaUsers} icon={KeyRound} color={BRAND.gold} trend={3.8} hint="已启用双因子" />
          <KpiCard label="生物识别" value={kpi.biometricUsers} icon={Fingerprint} color={BRAND.success} trend={4.6} hint="Face/Touch ID" />
        </div>
      </section>

      {/* ========== 当前用户认证概览 ========== */}
      <section className="px-4 lg:px-8 py-4">
        <div className="max-w-7xl mx-auto p-5 rounded-xl" style={{ background: `linear-gradient(135deg, ${BRAND.primary}15 0%, ${BRAND.bgCard} 100%)`, border: `1px solid ${BRAND.border}` }}>
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl" style={{ backgroundColor: KYC_TIERS.find((t) => t.id === profile.currentLevel)?.color + '30' }}>
              {KYC_TIERS.find((t) => t.id === profile.currentLevel)?.badge}
            </div>
            <div className="flex-1">
              <div className="text-xs mb-1" style={{ color: BRAND.textMute }}>当前认证等级</div>
              <h2 className="text-xl font-bold" style={{ color: BRAND.text }}>
                {KYC_TIERS.find((t) => t.id === profile.currentLevel)?.name}
              </h2>
              <div className="text-xs mt-1" style={{ color: BRAND.textSub }}>
                {profile.nickname} · {profile.country} {profile.region} · 认证于 {profile.verifiedAt}
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs" style={{ color: BRAND.textMute }}>综合安全评分</div>
              <div className="text-3xl font-bold font-mono" style={{ color: BRAND.primary }}>{profile.totalScore}</div>
              <div className="text-xs" style={{ color: BRAND.success }}>风险等级：低</div>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.bgCard, border: `1px solid ${BRAND.border}` }}>
              <div className="text-[10px] mb-1" style={{ color: BRAND.textMute }}>日限额</div>
              <div className="text-base font-bold font-mono" style={{ color: BRAND.text }}>{formatCurrency(KYC_TIERS.find((t) => t.id === profile.currentLevel)!.dailyLimit)}</div>
            </div>
            <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.bgCard, border: `1px solid ${BRAND.border}` }}>
              <div className="text-[10px] mb-1" style={{ color: BRAND.textMute }}>月限额</div>
              <div className="text-base font-bold font-mono" style={{ color: BRAND.text }}>{formatCurrency(KYC_TIERS.find((t) => t.id === profile.currentLevel)!.monthlyLimit)}</div>
            </div>
            <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.bgCard, border: `1px solid ${BRAND.border}` }}>
              <div className="text-[10px] mb-1" style={{ color: BRAND.textMute }}>认证到期</div>
              <div className="text-base font-bold font-mono" style={{ color: BRAND.text }}>{profile.expiresAt}</div>
            </div>
            <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.bgCard, border: `1px solid ${BRAND.border}` }}>
              <div className="text-[10px] mb-1" style={{ color: BRAND.textMute }}>已开通功能</div>
              <div className="text-base font-bold font-mono" style={{ color: BRAND.text }}>{KYC_TIERS.find((t) => t.id === profile.currentLevel)!.features.length} 项</div>
            </div>
          </div>
        </div>
      </section>

      {/* ========== 工具栏 ========== */}
      <section className="px-4 lg:px-8 py-3 sticky top-0 z-20" style={{ backgroundColor: BRAND.headerBg, borderBottom: `1px solid ${BRAND.border}`, backdropFilter: 'blur(12px)' }}>
        <div className="max-w-7xl mx-auto flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: BRAND.textMute }} />
            <input
              ref={searchRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索文档、日志、IP、地址..."
              className="w-full pl-9 pr-3 py-2 rounded-lg text-sm focus:outline-none transition-all"
              style={{ backgroundColor: BRAND.bgCard, color: BRAND.text, border: `1px solid ${BRAND.border}` }}
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-white/5">
                <X size={12} style={{ color: BRAND.textMute }} />
              </button>
            )}
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 rounded-lg text-xs focus:outline-none"
            style={{ backgroundColor: BRAND.bgCard, color: BRAND.text, border: `1px solid ${BRAND.border}` }}
          >
            <option value="all">全部状态</option>
            {Object.entries(STATUS_MAP).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-2 rounded-lg text-xs focus:outline-none"
            style={{ backgroundColor: BRAND.bgCard, color: BRAND.text, border: `1px solid ${BRAND.border}` }}
          >
            <option value="time">时间优先</option>
            <option value="type">类型优先</option>
            <option value="status">状态优先</option>
          </select>
          <button
            onClick={() => setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))}
            className="px-3 py-2 rounded-lg text-xs flex items-center gap-1"
            style={{ backgroundColor: BRAND.bgCard, color: BRAND.text, border: `1px solid ${BRAND.border}` }}
          >
            {sortDir === 'desc' ? <ChevronDown size={12} /> : <ChevronUp size={12} />}
            {sortDir === 'desc' ? '降序' : '升序'}
          </button>
        </div>
      </section>

      {/* ========== Tab 导航 ========== */}
      <section className="px-4 lg:px-8 py-4">
        <div className="max-w-7xl mx-auto flex gap-1 overflow-x-auto" style={{ borderBottom: `1px solid ${BRAND.border}` }}>
          {([
            { k: 'overview', l: '总览', icon: Sparkles },
            { k: 'personal', l: '个人认证', icon: User },
            { k: 'corporate', l: '企业 KYB', icon: Building2 },
            { k: 'security', l: '安全中心', icon: ShieldCheck },
            { k: 'documents', l: '我的资料', icon: FileText },
            { k: 'history', l: '安全日志', icon: Activity },
            { k: 'risk', l: '风险评估', icon: BarChart3 },
            { k: 'help', l: '帮助', icon: HelpCircle },
          ] as { k: Tab; l: string; icon: any }[]).map(({ k, l, icon: Icon }) => (
            <button
              key={k}
              onClick={() => setTab(k)}
              className="px-4 py-2.5 text-sm font-medium transition-all flex items-center gap-1.5 whitespace-nowrap"
              style={{
                color: tab === k ? BRAND.primary : BRAND.textSub,
                borderBottom: tab === k ? `2px solid ${BRAND.primary}` : '2px solid transparent',
                marginBottom: '-1px',
              }}
            >
              <Icon size={14} />
              {l}
            </button>
          ))}
        </div>
      </section>

      {/* ========== 内容区 ========== */}
      <section className="px-4 lg:px-8 py-6 pb-20">
        <div className="max-w-7xl mx-auto">
          {/* ====== 总览 ====== */}
          {tab === 'overview' && (
            <div className="space-y-6">
              {/* 认证等级阶梯 */}
              <div>
                <h2 className="text-lg font-bold mb-3 flex items-center gap-2" style={{ color: BRAND.text }}>
                  <Award size={18} style={{ color: BRAND.primary }} />
                  认证等级阶梯
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                  {KYC_TIERS.map((tier, i) => {
                    const isCurrent = tier.id === profile.currentLevel;
                    const TierIcon = tier.icon;
                    return (
                      <div
                        key={tier.id}
                        onClick={() => openDrawer('upload', tier.id)}
                        className="p-4 rounded-xl cursor-pointer transition-all duration-200 hover:scale-[1.02]"
                        style={{
                          backgroundColor: BRAND.bgCard,
                          border: `1px solid ${isCurrent ? tier.color : BRAND.border}`,
                          animation: `fadeInUp 0.4s ease-out ${i * 0.1}s both`,
                          position: 'relative',
                        }}
                      >
                        {isCurrent && (
                          <div className="absolute top-2 right-2 px-2 py-0.5 text-[10px] rounded" style={{ backgroundColor: tier.color, color: BRAND.onPrimary }}>
                            当前
                          </div>
                        )}
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-3" style={{ backgroundColor: `${tier.color}20`, color: tier.color }}>
                          {tier.badge}
                        </div>
                        <h3 className="font-bold text-base mb-1" style={{ color: BRAND.text }}>{tier.name}</h3>
                        <p className="text-xs mb-2" style={{ color: BRAND.textMute }}>{tier.duration}</p>
                        <div className="text-xs mb-2" style={{ color: BRAND.textSub }}>
                          日限 <span className="font-mono" style={{ color: tier.color }}>{formatCurrency(tier.dailyLimit)}</span>
                        </div>
                        <div className="text-xs mb-3" style={{ color: BRAND.textSub }}>
                          月限 <span className="font-mono" style={{ color: tier.color }}>{formatCurrency(tier.monthlyLimit)}</span>
                        </div>
                        <div className="text-[10px] mb-1" style={{ color: BRAND.textMute }}>开通功能：</div>
                        <div className="flex flex-wrap gap-1">
                          {tier.features.slice(0, 3).map((f) => (
                            <span key={f} className="px-1.5 py-0.5 text-[10px] rounded" style={{ backgroundColor: BRAND.bg, color: BRAND.textMute }}>{f}</span>
                          ))}
                          {tier.features.length > 3 && (
                            <span className="px-1.5 py-0.5 text-[10px] rounded" style={{ backgroundColor: BRAND.bg, color: BRAND.textMute }}>+{tier.features.length - 3}</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 安全中心 */}
              <div>
                <h2 className="text-lg font-bold mb-3 flex items-center gap-2" style={{ color: BRAND.text }}>
                  <ShieldCheck size={18} style={{ color: BRAND.success }} />
                  安全中心
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                  {[
                    { name: '双因子认证 (2FA)', enabled: profile.twoFAEnabled, icon: KeyRound, color: BRAND.primary, desc: 'TOTP / 短信 / 邮箱' },
                    { name: '生物识别', enabled: profile.biometricEnabled, icon: Fingerprint, color: BRAND.success, desc: 'Face ID / Touch ID' },
                    { name: '提现地址白名单', enabled: profile.whitelistEnabled, icon: Shield, color: BRAND.warning, desc: '仅允许白名单地址' },
                    { name: 'API Key', enabled: profile.apiKeyEnabled, icon: Code2, color: '#7c3aed', desc: '高级交易 API' },
                  ].map((s, i) => {
                    const Icon = s.icon;
                    return (
                      <div
                        key={s.name}
                        className="p-4 rounded-xl transition-all duration-200 hover:scale-[1.02]"
                        style={{ backgroundColor: BRAND.bgCard, border: `1px solid ${BRAND.border}`, animation: `fadeInUp 0.4s ease-out ${i * 0.08}s both` }}
                      >
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${s.color}20`, color: s.color }}>
                            <Icon size={20} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-bold text-sm" style={{ color: BRAND.text }}>{s.name}</div>
                            <div className="text-xs" style={{ color: BRAND.textMute }}>{s.desc}</div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span
                            className="px-2 py-0.5 text-[10px] rounded"
                            style={{ backgroundColor: s.enabled ? BRAND.successLt : 'rgba(112, 112, 112, 0.12)', color: s.enabled ? BRAND.success : BRAND.textMute }}
                          >
                            {s.enabled ? '已启用' : '未启用'}
                          </span>
                          <button className="text-xs" style={{ color: BRAND.primary }}>
                            {s.enabled ? '管理' : '启用'} <ChevronRight size={11} className="inline" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 风险评分 */}
              <div>
                <h2 className="text-lg font-bold mb-3 flex items-center gap-2" style={{ color: BRAND.text }}>
                  <BarChart3 size={18} style={{ color: BRAND.warning }} />
                  风险评分
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {RISK_INDICATORS.slice(0, 4).map((r, i) => (
                    <div
                      key={r.id}
                      className="p-4 rounded-xl"
                      style={{ backgroundColor: BRAND.bgCard, border: `1px solid ${BRAND.border}`, animation: `fadeInUp 0.4s ease-out ${i * 0.06}s both` }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-bold text-sm" style={{ color: BRAND.text }}>{r.name}</div>
                        <div className="text-lg font-bold font-mono" style={{ color: r.score >= 80 ? BRAND.success : r.score >= 60 ? BRAND.warning : BRAND.danger }}>{r.score}</div>
                      </div>
                      <div className="w-full h-1.5 rounded-full overflow-hidden mb-2" style={{ backgroundColor: BRAND.bg }}>
                        <div className="h-full transition-all" style={{ backgroundColor: r.score >= 80 ? BRAND.success : r.score >= 60 ? BRAND.warning : BRAND.danger, width: `${r.score}%` }} />
                      </div>
                      <div className="text-xs" style={{ color: BRAND.textSub }}>{r.description}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ====== 个人认证 ====== */}
          {tab === 'personal' && (
            <div className="space-y-4">
              <div className="p-5 rounded-xl" style={{ backgroundColor: BRAND.bgCard, border: `1px solid ${BRAND.border}` }}>
                <h3 className="text-base font-bold mb-3 flex items-center gap-2" style={{ color: BRAND.text }}>
                  <User size={16} style={{ color: BRAND.primary }} />
                  个人基本信息（脱敏）
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {[
                    { label: '用户昵称', value: profile.nickname, icon: User },
                    { label: '邮箱', value: profile.email, icon: Mail },
                    { label: '手机', value: profile.phone, icon: Phone },
                    { label: '国家/地区', value: `${profile.country} ${profile.region}`, icon: MapPin },
                  ].map((f) => {
                    const Icon = f.icon;
                    return (
                      <div key={f.label} className="p-3 rounded-lg" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}>
                        <div className="flex items-center gap-2 text-xs mb-1" style={{ color: BRAND.textMute }}>
                          <Icon size={12} /> {f.label}
                        </div>
                        <div className="font-mono text-sm" style={{ color: BRAND.text }}>{f.value}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 认证升级路径 */}
              <div>
                <h3 className="text-base font-bold mb-3 flex items-center gap-2" style={{ color: BRAND.text }}>
                  <ChevronRight size={16} style={{ color: BRAND.warning }} />
                  升级认证等级
                </h3>
                {KYC_TIERS.filter((t) => t.id !== 'unverified').map((tier, i) => {
                  const isCurrent = tier.id === profile.currentLevel;
                  const isNext = KYC_TIERS.findIndex((t) => t.id === profile.currentLevel) + 1 === i;
                  return (
                    <div
                      key={tier.id}
                      className="p-4 rounded-xl mb-2"
                      style={{ backgroundColor: BRAND.bgCard, border: `1px solid ${isCurrent ? tier.color : BRAND.border}`, animation: `fadeInUp 0.4s ease-out ${i * 0.08}s both` }}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="text-3xl">{tier.badge}</div>
                          <div>
                            <h4 className="font-bold text-sm flex items-center gap-2" style={{ color: BRAND.text }}>
                              {tier.name}
                              {isCurrent && <span className="px-2 py-0.5 text-[10px] rounded" style={{ backgroundColor: tier.color + '20', color: tier.color }}>当前</span>}
                            </h4>
                            <p className="text-xs" style={{ color: BRAND.textMute }}>{tier.duration}</p>
                          </div>
                        </div>
                        {isNext && (
                          <button
                            onClick={() => openDrawer('upload', tier.id)}
                            className="px-3 py-1.5 text-xs rounded"
                            style={{ backgroundColor: tier.color, color: BRAND.onPrimary }}
                          >
                            立即升级
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <div className="text-[10px] mb-1.5" style={{ color: BRAND.textMute }}>需要资料：</div>
                          <ul className="space-y-1">
                            {tier.requirements.map((r) => (
                              <li key={r} className="text-xs flex items-center gap-1.5" style={{ color: BRAND.textSub }}>
                                <CheckCircle2 size={11} style={{ color: tier.color }} /> {r}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <div className="text-[10px] mb-1.5" style={{ color: BRAND.textMute }}>开通功能：</div>
                          <div className="flex flex-wrap gap-1">
                            {tier.features.map((f) => (
                              <span key={f} className="px-1.5 py-0.5 text-[10px] rounded" style={{ backgroundColor: BRAND.bg, color: BRAND.textMute }}>{f}</span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ====== 企业 KYB ====== */}
          {tab === 'corporate' && (
            <div className="space-y-4">
              <div className="p-5 rounded-xl" style={{ backgroundColor: BRAND.bgCard, border: `1px solid ${BRAND.border}` }}>
                <h3 className="text-base font-bold mb-3 flex items-center gap-2" style={{ color: BRAND.text }}>
                  <Building2 size={16} style={{ color: '#7c3aed' }} />
                  企业 KYB 认证（机构）
                </h3>
                <p className="text-sm mb-4" style={{ color: BRAND.textSub }}>
                  面向机构客户、项目方、做市商、合作伙伴的完整 KYC/KYB 流程。
                  包含企业基础信息、营业执照、章程、股权结构、实益所有人等。
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {[
                    { title: '基础信息', icon: FileText, items: ['公司名称', '注册地址', '成立日期', '经营范围'] },
                    { title: '资质文件', icon: Award, items: ['营业执照', '税务登记', '银行开户许可', '组织机构代码'] },
                    { title: '股权结构', icon: Users, items: ['股东信息', '实益所有人', '股权穿透图', '最终受益人'] },
                  ].map((c, i) => {
                    const Icon = c.icon;
                    return (
                      <div
                        key={c.title}
                        className="p-4 rounded-xl"
                        style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}`, animation: `fadeInUp 0.4s ease-out ${i * 0.08}s both` }}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#7c3aed20', color: '#7c3aed' }}>
                            <Icon size={16} />
                          </div>
                          <h4 className="font-bold text-sm" style={{ color: BRAND.text }}>{c.title}</h4>
                        </div>
                        <ul className="space-y-1">
                          {c.items.map((item) => (
                            <li key={item} className="text-xs flex items-center gap-1.5" style={{ color: BRAND.textSub }}>
                              <ChevronRight size={10} /> {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 实益所有人 */}
              <div className="p-5 rounded-xl" style={{ backgroundColor: BRAND.bgCard, border: `1px solid ${BRAND.border}` }}>
                <h3 className="text-base font-bold mb-3 flex items-center gap-2" style={{ color: BRAND.text }}>
                  <Users size={16} style={{ color: BRAND.warning }} />
                  实益所有人（脱敏）
                </h3>
                <div className="space-y-2">
                  {BENEFICIAL_OWNERS.map((bo, i) => (
                    <div
                      key={bo.id}
                      className="p-3 rounded-lg flex items-center gap-3"
                      style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}`, animation: `fadeInUp 0.4s ease-out ${i * 0.05}s both` }}
                    >
                      <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: BRAND.primary + '20', color: BRAND.primary }}>
                        <User size={18} />
                      </div>
                      <div className="flex-1">
                        <div className="font-bold text-sm" style={{ color: BRAND.text }}>{bo.name}</div>
                        <div className="text-xs" style={{ color: BRAND.textMute }}>{bo.role} · {bo.nationality}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold font-mono" style={{ color: BRAND.text }}>{bo.ownership}%</div>
                        <div className="text-[10px]" style={{ color: BRAND.textMute }}>持股比例</div>
                      </div>
                      <span
                        className="px-2 py-0.5 text-[10px] rounded"
                        style={{ backgroundColor: STATUS_MAP[bo.kycStatus].bg, color: STATUS_MAP[bo.kycStatus].color }}
                      >
                        {STATUS_MAP[bo.kycStatus].label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ====== 安全中心 ====== */}
          {tab === 'security' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* MFA 开关 */}
                <div className="p-5 rounded-xl" style={{ backgroundColor: BRAND.bgCard, border: `1px solid ${BRAND.border}` }}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: BRAND.primary + '20', color: BRAND.primary }}>
                        <KeyRound size={20} />
                      </div>
                      <div>
                        <h3 className="font-bold text-sm" style={{ color: BRAND.text }}>双因子认证 (2FA)</h3>
                        <p className="text-xs" style={{ color: BRAND.textMute }}>登录、提现、关键操作二次验证</p>
                      </div>
                    </div>
                    <button
                      onClick={toggle2FA}
                      className="w-12 h-6 rounded-full relative transition-all"
                      style={{ backgroundColor: profile.twoFAEnabled ? BRAND.primary : BRAND.bg, border: `1px solid ${BRAND.border}` }}
                    >
                      <div
                        className="absolute top-0.5 w-5 h-5 rounded-full transition-all"
                        style={{ backgroundColor: profile.twoFAEnabled ? BRAND.onPrimary : BRAND.textMute, left: profile.twoFAEnabled ? '26px' : '2px' }}
                      />
                    </button>
                  </div>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex items-center gap-1.5" style={{ color: BRAND.textSub }}>
                      <CheckCircle2 size={11} style={{ color: BRAND.success }} /> Google Authenticator
                    </div>
                    <div className="flex items-center gap-1.5" style={{ color: BRAND.textSub }}>
                      <CheckCircle2 size={11} style={{ color: BRAND.success }} /> 短信验证
                    </div>
                    <div className="flex items-center gap-1.5" style={{ color: BRAND.textSub }}>
                      <CheckCircle2 size={11} style={{ color: BRAND.success }} /> 邮箱验证
                    </div>
                  </div>
                </div>

                {/* 生物识别 */}
                <div className="p-5 rounded-xl" style={{ backgroundColor: BRAND.bgCard, border: `1px solid ${BRAND.border}` }}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: BRAND.success + '20', color: BRAND.success }}>
                        <Fingerprint size={20} />
                      </div>
                      <div>
                        <h3 className="font-bold text-sm" style={{ color: BRAND.text }}>生物识别</h3>
                        <p className="text-xs" style={{ color: BRAND.textMute }}>Face ID / Touch ID 快速登录</p>
                      </div>
                    </div>
                    <button
                      onClick={toggleBiometric}
                      className="w-12 h-6 rounded-full relative transition-all"
                      style={{ backgroundColor: profile.biometricEnabled ? BRAND.primary : BRAND.bg, border: `1px solid ${BRAND.border}` }}
                    >
                      <div
                        className="absolute top-0.5 w-5 h-5 rounded-full transition-all"
                        style={{ backgroundColor: profile.biometricEnabled ? BRAND.onPrimary : BRAND.textMute, left: profile.biometricEnabled ? '26px' : '2px' }}
                      />
                    </button>
                  </div>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex items-center gap-1.5" style={{ color: BRAND.textSub }}>
                      <CheckCircle2 size={11} style={{ color: BRAND.success }} /> Face ID (iOS)
                    </div>
                    <div className="flex items-center gap-1.5" style={{ color: BRAND.textSub }}>
                      <CheckCircle2 size={11} style={{ color: BRAND.success }} /> Touch ID (iOS / macOS)
                    </div>
                    <div className="flex items-center gap-1.5" style={{ color: BRAND.textSub }}>
                      <CheckCircle2 size={11} style={{ color: BRAND.success }} /> 指纹识别 (Android)
                    </div>
                  </div>
                </div>

                {/* 白名单 */}
                <div className="p-5 rounded-xl" style={{ backgroundColor: BRAND.bgCard, border: `1px solid ${BRAND.border}` }}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: BRAND.warning + '20', color: BRAND.warning }}>
                        <Shield size={20} />
                      </div>
                      <div>
                        <h3 className="font-bold text-sm" style={{ color: BRAND.text }}>提现地址白名单</h3>
                        <p className="text-xs" style={{ color: BRAND.textMute }}>仅允许向白名单地址提现</p>
                      </div>
                    </div>
                    <button
                      onClick={toggleWhitelist}
                      className="w-12 h-6 rounded-full relative transition-all"
                      style={{ backgroundColor: profile.whitelistEnabled ? BRAND.primary : BRAND.bg, border: `1px solid ${BRAND.border}` }}
                    >
                      <div
                        className="absolute top-0.5 w-5 h-5 rounded-full transition-all"
                        style={{ backgroundColor: profile.whitelistEnabled ? BRAND.onPrimary : BRAND.textMute, left: profile.whitelistEnabled ? '26px' : '2px' }}
                      />
                    </button>
                  </div>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex items-center gap-1.5" style={{ color: BRAND.textSub }}>
                      <CheckCircle2 size={11} style={{ color: BRAND.success }} /> 5 个白名单地址
                    </div>
                    <div className="flex items-center gap-1.5" style={{ color: BRAND.textSub }}>
                      <Clock size={11} style={{ color: BRAND.warning }} /> 24h 冷静期
                    </div>
                    <div className="flex items-center gap-1.5" style={{ color: BRAND.textSub }}>
                      <Hash size={11} style={{ color: BRAND.info }} /> 每日限额 ¥100,000
                    </div>
                  </div>
                </div>

                {/* 通知 */}
                <div className="p-5 rounded-xl" style={{ backgroundColor: BRAND.bgCard, border: `1px solid ${BRAND.border}` }}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: BRAND.info + '20', color: BRAND.info }}>
                        <Bell size={20} />
                      </div>
                      <div>
                        <h3 className="font-bold text-sm" style={{ color: BRAND.text }}>安全通知</h3>
                        <p className="text-xs" style={{ color: BRAND.textMute }}>登录、提现、敏感操作实时通知</p>
                      </div>
                    </div>
                    <div className="w-12 h-6 rounded-full relative" style={{ backgroundColor: BRAND.primary, border: `1px solid ${BRAND.border}` }}>
                      <div className="absolute top-0.5 w-5 h-5 rounded-full" style={{ backgroundColor: BRAND.onPrimary, left: '26px' }} />
                    </div>
                  </div>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span style={{ color: BRAND.textSub }}>登录通知</span>
                      <span className="text-[10px] px-1.5 rounded" style={{ backgroundColor: BRAND.successLt, color: BRAND.success }}>开</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span style={{ color: BRAND.textSub }}>提现通知</span>
                      <span className="text-[10px] px-1.5 rounded" style={{ backgroundColor: BRAND.successLt, color: BRAND.success }}>开</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span style={{ color: BRAND.textSub }}>市场异常</span>
                      <span className="text-[10px] px-1.5 rounded" style={{ backgroundColor: BRAND.successLt, color: BRAND.success }}>开</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ====== 我的资料 ====== */}
          {tab === 'documents' && (
            <div className="space-y-3">
              {filteredDocuments.map((doc, i) => {
                const type = DOC_TYPE_MAP[doc.type];
                const TypeIcon = type.icon;
                const status = STATUS_MAP[doc.status as KycStatus] || STATUS_MAP.pending;
                return (
                  <div
                    key={doc.id}
                    onClick={() => openDrawer('document', doc.id)}
                    className="p-4 rounded-xl cursor-pointer transition-all duration-200 hover:scale-[1.01]"
                    style={{ backgroundColor: BRAND.bgCard, border: `1px solid ${BRAND.border}`, animation: `fadeInUp 0.4s ease-out ${i * 0.05}s both` }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: type.color + '20', color: type.color }}>
                        <TypeIcon size={20} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-sm" style={{ color: BRAND.text }}>{doc.name}</div>
                        <div className="text-xs" style={{ color: BRAND.textMute }}>
                          {type.label} · {doc.format} · {doc.fileSize}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="px-2 py-0.5 text-xs rounded" style={{ backgroundColor: status.bg, color: status.color }}>
                          {status.label}
                        </span>
                        <div className="text-[10px] mt-1" style={{ color: BRAND.textMute }}>{doc.uploadedAt}</div>
                      </div>
                      <ChevronRight size={16} style={{ color: BRAND.textMute }} />
                    </div>
                  </div>
                );
              })}
              <button
                onClick={() => openDrawer('upload', 'new')}
                className="w-full p-4 rounded-xl border-dashed flex items-center justify-center gap-2 text-sm transition-all hover:scale-[1.01]"
                style={{ backgroundColor: BRAND.bgCard, border: `1px dashed ${BRAND.border}`, color: BRAND.textSub }}
              >
                <Plus size={14} /> 上传新资料
              </button>
            </div>
          )}

          {/* ====== 安全日志 ====== */}
          {tab === 'history' && (
            <div className="space-y-2">
              {filteredLogs.map((log, i) => {
                const statusColor = log.status === 'success' ? BRAND.success : log.status === 'failed' ? BRAND.danger : BRAND.warning;
                const typeIcon: any = {
                  login: User,
                  kyc: ShieldCheck,
                  transaction: Coins,
                  password: KeyRound,
                  mfa: KeyRound,
                  biometric: Fingerprint,
                  api: Code2,
                }[log.type] || Activity;
                const TypeIcon = typeIcon;
                return (
                  <div
                    key={log.id}
                    onClick={() => openDrawer('log', log.id)}
                    className="p-3 rounded-xl cursor-pointer transition-all duration-200 hover:scale-[1.01]"
                    style={{ backgroundColor: BRAND.bgCard, border: `1px solid ${BRAND.border}`, animation: `fadeInUp 0.4s ease-out ${i * 0.04}s both` }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: statusColor + '20', color: statusColor }}>
                        <TypeIcon size={16} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-sm" style={{ color: BRAND.text }}>{log.action}</div>
                        <div className="text-xs" style={{ color: BRAND.textMute }}>
                          {log.device} · {log.location} · {log.ip}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs" style={{ color: statusColor }}>
                          {log.status === 'success' ? '成功' : log.status === 'failed' ? '失败' : '可疑'}
                        </div>
                        <div className="text-[10px] mt-0.5 font-mono" style={{ color: BRAND.textMute }}>{log.timestamp.split(' ')[1]}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ====== 风险评估 ====== */}
          {tab === 'risk' && (
            <div className="space-y-4">
              <div className="p-5 rounded-xl" style={{ background: `linear-gradient(135deg, ${BRAND.success}15 0%, ${BRAND.bgCard} 100%)`, border: `1px solid ${BRAND.border}` }}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: BRAND.success, color: BRAND.onPrimary }}>
                    <Shield size={24} />
                  </div>
                  <div>
                    <h2 className="text-base font-bold" style={{ color: BRAND.text }}>综合风险等级：低</h2>
                    <p className="text-xs" style={{ color: BRAND.textSub }}>账户状态健康，建议保持当前安全配置</p>
                  </div>
                  <div className="ml-auto text-right">
                    <div className="text-3xl font-bold font-mono" style={{ color: BRAND.success }}>{profile.totalScore}</div>
                    <div className="text-[10px]" style={{ color: BRAND.textMute }}>/ 1000</div>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {RISK_INDICATORS.map((r, i) => (
                  <div
                    key={r.id}
                    className="p-4 rounded-xl"
                    style={{ backgroundColor: BRAND.bgCard, border: `1px solid ${BRAND.border}`, animation: `fadeInUp 0.4s ease-out ${i * 0.05}s both` }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-bold text-sm" style={{ color: BRAND.text }}>{r.name}</div>
                      <div className="text-2xl font-bold font-mono" style={{ color: r.score >= 80 ? BRAND.success : r.score >= 60 ? BRAND.warning : BRAND.danger }}>{r.score}</div>
                    </div>
                    <div className="w-full h-2 rounded-full overflow-hidden mb-2" style={{ backgroundColor: BRAND.bg }}>
                      <div className="h-full transition-all" style={{ backgroundColor: r.score >= 80 ? BRAND.success : r.score >= 60 ? BRAND.warning : BRAND.danger, width: `${r.score}%` }} />
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span style={{ color: BRAND.textSub }}>{r.description}</span>
                      <span style={{ color: BRAND.textMute }}>{r.lastCheck}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ====== 帮助 ====== */}
          {tab === 'help' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { title: '什么是 KYC？', desc: 'KYC（Know Your Customer）是平台对用户身份进行核验的流程，用于反洗钱和合规风险控制。', icon: User, color: BRAND.primary },
                { title: '为什么需要实名认证？', desc: '为符合全球反洗钱（AML）合规研究方向要求，保护用户资产安全，防范金融犯罪。', icon: Shield, color: BRAND.success },
                { title: '认证资料如何保护？', desc: '所有资料采用 AES-256 加密存储，访问需多因子认证，存储与传输全程加密。', icon: Lock, color: BRAND.warning },
                { title: '认证时效多久？', desc: '基础认证 2 年、中级 2 年、高级 1 年、机构 1 年。到期前 30 天系统会提醒续期。', icon: Clock, color: BRAND.info },
                { title: '认证被拒绝怎么办？', desc: '请根据拒绝原因重新提交资料，或联系客服咨询（合规研究方向客服）。', icon: AlertTriangle, color: BRAND.danger },
                { title: '可以更换认证等级吗？', desc: '可以随时升级到更高级别认证，等级越高享受的功能越多、限额越高。', icon: TrendingUp, color: BRAND.gold },
              ].map((q, i) => {
                const Icon = q.icon;
                return (
                  <div
                    key={q.title}
                    className="p-4 rounded-xl"
                    style={{ backgroundColor: BRAND.bgCard, border: `1px solid ${BRAND.border}`, animation: `fadeInUp 0.4s ease-out ${i * 0.06}s both` }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: q.color + '20', color: q.color }}>
                        <Icon size={16} />
                      </div>
                      <h3 className="font-bold text-sm" style={{ color: BRAND.text }}>{q.title}</h3>
                    </div>
                    <p className="text-xs leading-relaxed" style={{ color: BRAND.textSub }}>{q.desc}</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* ========== 合规提示 ========== */}
      <section className="px-4 lg:px-8 py-6">
        <div className="max-w-7xl mx-auto p-4 rounded-xl" style={{ backgroundColor: 'rgba(255, 169, 64, 0.08)', border: `1px solid ${BRAND.warning}40` }}>
          <div className="flex items-start gap-3">
            <AlertTriangle size={20} style={{ color: BRAND.warning }} className="flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-sm mb-1" style={{ color: BRAND.warning }}>合规研究方向说明</div>
              <p className="text-xs leading-relaxed" style={{ color: BRAND.textSub }}>
                本平台 KYC/实名认证流程基于"合规研究方向"设计，仅用于平台用户身份核验与风险控制。
                不承诺任何特定司法管辖区的监管认证，不构成已获得特定监管批准或牌照的承诺。
                所有认证等级、限额与功能可能根据合规研究动态调整。
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ========== 底部 CTA ========== */}
      <section className="px-4 lg:px-8 py-10">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-2xl font-bold mb-2" style={{ color: BRAND.text }}>保护账户安全，从认证开始</h2>
          <p className="text-sm mb-5" style={{ color: BRAND.textSub }}>完成认证解锁更多功能，享受更高额度与更优费率</p>
          <div className="flex flex-wrap justify-center gap-3">
            <button
              onClick={() => setTab('personal')}
              className="px-6 py-2.5 rounded-lg text-sm font-medium"
              style={{ backgroundColor: BRAND.primary, color: BRAND.onPrimary }}
            >
              <User size={14} className="inline mr-1" /> 开始个人认证
            </button>
            <button
              onClick={() => setTab('corporate')}
              className="px-6 py-2.5 rounded-lg text-sm font-medium"
              style={{ backgroundColor: BRAND.bgCard, color: BRAND.text, border: `1px solid ${BRAND.border}` }}
            >
              <Building2 size={14} className="inline mr-1" /> 企业 KYB 申请
            </button>
          </div>
        </div>
      </section>

      {/* ========== Drawer ========== */}
      {drawer.open && (
        <div className="fixed inset-0 z-50 flex" onClick={closeDrawer}>
          <div className="absolute inset-0" style={{ backgroundColor: BRAND.overlay }} />
          <div
            className="relative ml-auto w-full max-w-2xl h-full overflow-y-auto"
            style={{ backgroundColor: BRAND.bgCard, borderLeft: `1px solid ${BRAND.border}`, animation: 'slideInRight 0.3s ease-out' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 px-6 py-4 flex items-center justify-between z-10" style={{ backgroundColor: BRAND.bgCard, borderBottom: `1px solid ${BRAND.border}` }}>
              <div className="text-sm font-bold" style={{ color: BRAND.text }}>
                {drawer.type === 'upload' && (drawer.payload === 'new' ? '上传新资料' : '升级认证')}
                {drawer.type === 'document' && '资料详情'}
                {drawer.type === 'log' && '日志详情'}
                {drawer.type === 'mfa' && 'MFA 设置'}
                {drawer.type === 'biometric' && '生物识别设置'}
              </div>
              <button onClick={closeDrawer} className="p-1.5 rounded-lg hover:bg-white/5">
                <X size={16} style={{ color: BRAND.textSub }} />
              </button>
            </div>

            <div className="p-6">
              {/* 上传向导 */}
              {drawer.type === 'upload' && (() => {
                if (drawer.payload === 'new') {
                  return (
                    <div>
                      <h2 className="text-xl font-bold mb-3" style={{ color: BRAND.text }}>上传新资料</h2>
                      <p className="text-sm mb-4" style={{ color: BRAND.textSub }}>选择资料类型并上传相关文件</p>
                      <div className="space-y-2">
                        {Object.entries(DOC_TYPE_MAP).map(([k, v]) => {
                          const Icon = v.icon;
                          return (
                            <div
                              key={k}
                              className="p-3 rounded-lg flex items-center gap-3 cursor-pointer hover:scale-[1.01] transition-all"
                              style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}
                            >
                              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: v.color + '20', color: v.color }}>
                                <Icon size={18} />
                              </div>
                              <div className="flex-1">
                                <div className="font-bold text-sm" style={{ color: BRAND.text }}>{v.label}</div>
                                <div className="text-xs" style={{ color: BRAND.textMute }}>支持 JPG / PNG / PDF / MP4</div>
                              </div>
                              <Upload size={14} style={{ color: BRAND.primary }} />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                }
                const tier = KYC_TIERS.find((t) => t.id === drawer.payload);
                if (!tier) return null;
                return (
                  <div>
                    <div className="text-center mb-4">
                      <div className="text-6xl mb-2">{tier.badge}</div>
                      <h2 className="text-xl font-bold" style={{ color: BRAND.text }}>升级到 {tier.name}</h2>
                      <p className="text-sm mt-1" style={{ color: BRAND.textSub }}>{tier.duration}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mb-4">
                      <div className="p-3 rounded-lg text-center" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}>
                        <div className="text-[10px]" style={{ color: BRAND.textMute }}>日限额</div>
                        <div className="text-lg font-bold font-mono mt-1" style={{ color: tier.color }}>{formatCurrency(tier.dailyLimit)}</div>
                      </div>
                      <div className="p-3 rounded-lg text-center" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}>
                        <div className="text-[10px]" style={{ color: BRAND.textMute }}>月限额</div>
                        <div className="text-lg font-bold font-mono mt-1" style={{ color: tier.color }}>{formatCurrency(tier.monthlyLimit)}</div>
                      </div>
                    </div>
                    <h4 className="text-sm font-bold mb-2" style={{ color: BRAND.text }}>需要准备：</h4>
                    <ul className="space-y-1.5 mb-4">
                      {tier.requirements.map((r) => (
                        <li key={r} className="text-xs flex items-start gap-2 p-2 rounded-lg" style={{ backgroundColor: BRAND.bg }}>
                          <CheckCircle2 size={12} style={{ color: tier.color }} className="flex-shrink-0 mt-0.5" />
                          <span style={{ color: BRAND.textSub }}>{r}</span>
                        </li>
                      ))}
                    </ul>
                    <h4 className="text-sm font-bold mb-2" style={{ color: BRAND.text }}>升级后将开通：</h4>
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {tier.features.map((f) => (
                        <span key={f} className="px-2 py-0.5 text-xs rounded" style={{ backgroundColor: tier.color + '20', color: tier.color }}>{f}</span>
                      ))}
                    </div>
                    <button className="w-full py-3 rounded-lg text-sm font-medium" style={{ backgroundColor: tier.color, color: BRAND.onPrimary }}>
                      <Upload size={14} className="inline mr-1" />开始上传资料
                    </button>
                  </div>
                );
              })()}

              {/* 资料详情 */}
              {drawerDoc && (() => {
                const type = DOC_TYPE_MAP[drawerDoc.type];
                const status = STATUS_MAP[drawerDoc.status as KycStatus] || STATUS_MAP.pending;
                return (
                  <div>
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ backgroundColor: type.color + '20', color: type.color }}>
                        {React.createElement(type.icon, { size: 28 })}
                      </div>
                      <div className="flex-1">
                        <h2 className="text-xl font-bold" style={{ color: BRAND.text }}>{drawerDoc.name}</h2>
                        <p className="text-sm" style={{ color: BRAND.textMute }}>{type.label} · {drawerDoc.format} · {drawerDoc.fileSize}</p>
                      </div>
                      <span className="px-3 py-1 text-xs rounded" style={{ backgroundColor: status.bg, color: status.color }}>
                        {status.label}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mb-4">
                      <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.bg }}>
                        <div className="text-[10px]" style={{ color: BRAND.textMute }}>上传时间</div>
                        <div className="text-sm font-mono mt-1" style={{ color: BRAND.text }}>{drawerDoc.uploadedAt}</div>
                      </div>
                      {drawerDoc.expiresAt && (
                        <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.bg }}>
                          <div className="text-[10px]" style={{ color: BRAND.textMute }}>到期时间</div>
                          <div className="text-sm font-mono mt-1" style={{ color: BRAND.text }}>{drawerDoc.expiresAt}</div>
                        </div>
                      )}
                    </div>
                    {drawerDoc.rejectionReason && (
                      <div className="p-3 rounded-lg mb-4" style={{ backgroundColor: BRAND.dangerLt, border: `1px solid ${BRAND.danger}40` }}>
                        <div className="text-xs font-bold mb-1" style={{ color: BRAND.danger }}>拒绝原因：</div>
                        <div className="text-xs" style={{ color: BRAND.textSub }}>{drawerDoc.rejectionReason}</div>
                      </div>
                    )}
                    <div className="flex gap-2">
                      <button className="flex-1 py-2.5 rounded-lg text-sm" style={{ backgroundColor: BRAND.primary, color: BRAND.onPrimary }}>
                        <Eye size={14} className="inline mr-1" />查看原图
                      </button>
                      <button className="flex-1 py-2.5 rounded-lg text-sm" style={{ backgroundColor: BRAND.bgCard, color: BRAND.text, border: `1px solid ${BRAND.border}` }}>
                        <Upload size={14} className="inline mr-1" />重新上传
                      </button>
                    </div>
                  </div>
                );
              })()}

              {/* 日志详情 */}
              {drawerLog && (
                <div>
                  <h2 className="text-xl font-bold mb-3" style={{ color: BRAND.text }}>{drawerLog.action}</h2>
                  <div className="space-y-2 mb-4">
                    {[
                      { label: '操作时间', value: drawerLog.timestamp },
                      { label: '设备', value: drawerLog.device },
                      { label: 'IP 地址', value: drawerLog.ip },
                      { label: '地理位置', value: drawerLog.location },
                      { label: '状态', value: drawerLog.status === 'success' ? '成功' : drawerLog.status === 'failed' ? '失败' : '可疑' },
                      { label: '日志 ID', value: drawerLog.id },
                    ].map((f) => (
                      <div key={f.label} className="p-3 rounded-lg flex items-center justify-between" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}>
                        <span className="text-xs" style={{ color: BRAND.textMute }}>{f.label}</span>
                        <span className="text-xs font-mono" style={{ color: BRAND.text }}>{f.value}</span>
                      </div>
                    ))}
                  </div>
                  <div className="p-3 rounded-lg" style={{ backgroundColor: drawerLog.status === 'suspicious' ? BRAND.dangerLt : BRAND.successLt }}>
                    <div className="text-xs flex items-start gap-2" style={{ color: BRAND.textSub }}>
                      <Shield size={12} className="flex-shrink-0 mt-0.5" />
                      {drawerLog.status === 'suspicious' ? '本次操作存在风险，建议立即修改密码并启用 MFA 二次验证' : '本次操作行为正常，未发现异常'}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========== 帮助快捷键 Drawer ========== */}
      {helpOpen && (
        <div className="fixed inset-0 z-50 flex" onClick={() => setHelpOpen(false)}>
          <div className="absolute inset-0" style={{ backgroundColor: BRAND.overlay }} />
          <div
            className="relative m-auto w-full max-w-md p-6 rounded-2xl"
            style={{ backgroundColor: BRAND.bgCard, border: `1px solid ${BRAND.border}` }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold flex items-center gap-2" style={{ color: BRAND.text }}>
                <Keyboard size={16} style={{ color: BRAND.primary }} /> 快捷键
              </h3>
              <button onClick={() => setHelpOpen(false)} className="p-1 rounded-lg hover:bg-white/5">
                <X size={14} style={{ color: BRAND.textSub }} />
              </button>
            </div>
            <div className="space-y-1.5">
              {[
                { key: '/', desc: '聚焦搜索框' },
                { key: '?', desc: '显示/隐藏快捷键' },
                { key: 'Esc', desc: '关闭 Drawer / 帮助' },
                { key: '1-8', desc: '切换 Tab' },
                { key: '点击认证等级', desc: '查看升级详情' },
                { key: '点击资料', desc: '查看资料详情' },
                { key: '点击日志', desc: '查看日志详情' },
                { key: '点击开关', desc: '切换安全功能' },
              ].map((s) => (
                <div key={s.key} className="flex items-center justify-between p-2 rounded-lg" style={{ backgroundColor: BRAND.bg }}>
                  <span className="text-xs" style={{ color: BRAND.textSub }}>{s.desc}</span>
                  <kbd className="px-2 py-0.5 text-xs font-mono rounded" style={{ backgroundColor: BRAND.bgCard, color: BRAND.text, border: `1px solid ${BRAND.border}` }}>
                    {s.key}
                  </kbd>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}
