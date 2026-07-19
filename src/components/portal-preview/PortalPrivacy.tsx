'use client';

/**
 * PortalPrivacy - 隐私与数据合规中心（2026-07-19 Q05 P3.22）
 *
 * 页面定位：
 * - 中萨数字科技交易所 隐私与数据合规中心
 * - 个人数据条目 / 第三方授权管理 / Cookie 偏好 / 数据导出 / 数据生命周期 / 监管框架
 * - 与 P3.14 合规 / P3.20 KYC 形成"合规-隐私-身份"三角闭环
 *
 * L4 工业级设计标准：
 * - 暗色 v6 纯黑 #000000 + 卡片 #141414 + ZSDEX 绿 primary #14B881
 * - 10 大区块：Hero / 实时 KPI / 数据地图 / 我的数据 / 授权管理 / Cookie 偏好 / 隐私设置 / 数据生命周期 / 监管报告 / 帮助 / 底部 CTA
 * - 9+ 交互：Tab 切换 / 数据导出向导 / 授权撤销 / Cookie 开关 / 搜索 / 排序 / 抽屉详情 / 快捷键
 * - 5+ Drawer：数据导出向导 / 授权详情 / Cookie 详情 / 数据生命周期 / 帮助
 * - 4+ 实时数据：个人数据条目 / 活跃授权 / 监管请求 / 数据导出请求
 * - 4+ 动画：Stagger / CountUp / Hover / Pulse
 *
 * 合规要点（Q05 硬约束）：
 * - 不接真实监管机构，所有监管框架 / 数据请求使用 mock 占位
 * - 状态徽章统一使用 STATUS 枚举
 * - 不修改旧官网 / 旧 H5 / disabled pages / brand.ts / SPEC.md
 * - 严格遵守个人信息保护法、GDPR 等数据保护法规
 * - 页面本身不构成任何法律意见，仅作为合规研究方向参考
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
  Database,
  Server,
  Cloud,
  FileText,
  Download,
  Upload,
  Trash2,
  Edit3,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  AlertOctagon,
  Info,
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
  Bell,
  BellOff,
  Cookie,
  Settings,
  Sliders,
  ExternalLink,
  Copy,
  Plus,
  Minus,
  Sparkles,
  Star,
  Heart,
  Flag,
  Tag,
  Tags,
  Bookmark,
  ArrowRight,
  ArrowUpRight,
  ArrowDownLeft,
  Compass,
  Map,
  Layers,
  Network,
  Cpu,
  Code2,
  GitBranch,
  GitCommit,
  Terminal,
  Workflow,
  Layers as LayersIcon,
  Keyboard,
  HelpCircle,
  RefreshCw,
  RotateCw,
  Send,
  Paperclip,
  MessageCircle,
  Lightbulb,
  Zap,
  Flame,
  Award,
  Trophy,
  Crown,
  Target,
  Crosshair,
  Compass as CompassIcon,
  LifeBuoy,
  Languages,
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  Video,
  VideoOff,
  Camera,
  Fingerprint,
  ScanFace,
  PlayCircle,
  PauseCircle,
  Accessibility,
} from 'lucide-react';
import { BRAND, STATUS } from './brand';

// ============== 类型 ==============

type Tab = 'overview' | 'my-data' | 'consents' | 'cookies' | 'settings' | 'lifecycle' | 'regulation' | 'help';
type DataCategory = 'identity' | 'contact' | 'kyc' | 'financial' | 'behavioral' | 'biometric' | 'device' | 'communication' | 'preference';
type Sensitivity = 'low' | 'medium' | 'high' | 'critical';
type ConsentStatus = 'granted' | 'denied' | 'partial' | 'pending' | 'expired';
type DataRequestType = 'export' | 'delete' | 'correct' | 'restrict' | 'portability' | 'object';
type DataRequestStatus = 'received' | 'processing' | 'completed' | 'failed' | 'cancelled';
type CookieType = 'necessary' | 'functional' | 'analytics' | 'marketing' | 'personalization' | 'third-party';
type LifecycleStage = 'collection' | 'processing' | 'storage' | 'sharing' | 'archival' | 'deletion';
type DrawerType = 'data-export' | 'consent' | 'cookie' | 'lifecycle' | 'data-item' | 'help' | 'request' | null;

interface DataItem {
  id: string;
  category: DataCategory;
  name: string;
  description: string;
  sensitivity: Sensitivity;
  source: string;
  collectedAt: string;
  lastAccessedAt: string;
  accessCount: number;
  retention: number; // days
  legalBasis: string;
  encryption: 'none' | 'aes-128' | 'aes-256' | 'rsa-2048';
  shared: boolean;
  size: string;
}

interface Consent {
  id: string;
  title: string;
  purpose: string;
  description: string;
  category: 'essential' | 'functional' | 'analytics' | 'marketing' | 'third-party' | 'data-sharing';
  status: ConsentStatus;
  grantedAt: string;
  expiresAt: string;
  thirdParty?: { name: string; purpose: string; policyUrl: string };
  dataItems: string[];
  version: string;
  required: boolean;
  autoRenew: boolean;
}

interface CookieItem {
  id: string;
  name: string;
  type: CookieType;
  provider: string;
  purpose: string;
  duration: string;
  required: boolean;
  category: 'essential' | 'functional' | 'analytics' | 'marketing';
  expiry: string;
  domain: string;
}

interface DataRequest {
  id: string;
  type: DataRequestType;
  status: DataRequestStatus;
  submittedAt: string;
  expectedAt: string;
  completedAt?: string;
  scope: string[];
  description: string;
  format: 'json' | 'csv' | 'pdf' | 'archive';
  size?: string;
  downloadUrl?: string;
  regulatedBy: string;
}

interface Regulation {
  id: string;
  name: string;
  jurisdiction: string;
  scope: string;
  effective: string;
  updated: string;
  keyArticles: string[];
  obligations: string[];
  status: 'active' | 'upcoming' | 'research' | 'deprecated';
  summary: string;
  fullDocUrl: string;
}

interface LifecycleRule {
  id: string;
  dataCategory: DataCategory;
  stage: LifecycleStage;
  retentionDays: number;
  trigger: string;
  action: 'archive' | 'anonymize' | 'delete' | 'review' | 'notify';
  lastRun: string;
  nextRun: string;
  affectedCount: number;
  description: string;
}

interface PrivacySettings {
  marketingEmail: boolean;
  marketingSms: boolean;
  marketingPush: boolean;
  productUpdate: boolean;
  researchInvitation: boolean;
  thirdPartyShare: boolean;
  analyticsTracking: boolean;
  personalizedAds: boolean;
  languagePreference: string;
  dataMinimization: boolean;
  biometricProcessing: boolean;
  crossBorderTransfer: boolean;
}

interface KpiSnapshot {
  dataItems: number;
  activeConsents: number;
  pendingRequests: number;
  sharedThirdParties: number;
  cookieCount: number;
  encryptionCoverage: number;
  dataBreaches: number;
  complianceScore: number;
}

// ============== Mock 数据 ==============

const DATA_ITEMS: DataItem[] = [
  {
    id: 'di-001',
    category: 'identity',
    name: '姓名 / 身份证号',
    description: 'KYC 实名认证采集的姓名与身份证号',
    sensitivity: 'critical',
    source: 'KYC 认证',
    collectedAt: '2025-08-15',
    lastAccessedAt: '2026-07-18',
    accessCount: 24,
    retention: 1825,
    legalBasis: '法定义务（实名制）',
    encryption: 'aes-256',
    shared: false,
    size: '128 B',
  },
  {
    id: 'di-002',
    category: 'biometric',
    name: '人脸识别数据',
    description: '高级 KYC 活体检测采集的人脸特征向量',
    sensitivity: 'critical',
    source: '高级 KYC 活体',
    collectedAt: '2026-03-12',
    lastAccessedAt: '2026-07-15',
    accessCount: 8,
    retention: 365,
    legalBasis: '明示同意 + 业务必要',
    encryption: 'aes-256',
    shared: false,
    size: '2.4 KB',
  },
  {
    id: 'di-003',
    category: 'contact',
    name: '手机号 / 邮箱',
    description: '注册时提供的手机号与邮箱地址',
    sensitivity: 'high',
    source: '账户注册',
    collectedAt: '2025-08-15',
    lastAccessedAt: '2026-07-19',
    accessCount: 184,
    retention: 1825,
    legalBasis: '合同必要',
    encryption: 'aes-256',
    shared: false,
    size: '64 B',
  },
  {
    id: 'di-004',
    category: 'financial',
    name: '交易记录',
    description: '所有现货 / 合约 / 法币交易明细',
    sensitivity: 'high',
    source: '交易系统',
    collectedAt: '2025-08-15',
    lastAccessedAt: '2026-07-19',
    accessCount: 12480,
    retention: 2555,
    legalBasis: '法定义务（反洗钱）',
    encryption: 'aes-256',
    shared: false,
    size: '12.4 MB',
  },
  {
    id: 'di-005',
    category: 'financial',
    name: '银行账户信息',
    description: '法币出入金绑定的银行账户',
    sensitivity: 'critical',
    source: '法币入金',
    collectedAt: '2025-09-20',
    lastAccessedAt: '2026-07-10',
    accessCount: 42,
    retention: 1825,
    legalBasis: '法定义务（反洗钱）',
    encryption: 'rsa-2048',
    shared: false,
    size: '256 B',
  },
  {
    id: 'di-006',
    category: 'behavioral',
    name: '浏览行为',
    description: '在 Web/App 内的访问路径、停留时长、点击流',
    sensitivity: 'medium',
    source: '前端埋点',
    collectedAt: '2026-07-19',
    lastAccessedAt: '2026-07-19',
    accessCount: 1,
    retention: 90,
    legalBasis: '明示同意',
    encryption: 'aes-128',
    shared: true,
    size: '4.8 MB',
  },
  {
    id: 'di-007',
    category: 'device',
    name: '设备指纹',
    description: '设备型号、操作系统、屏幕分辨率、IP 等',
    sensitivity: 'medium',
    source: '登录检测',
    collectedAt: '2026-07-19',
    lastAccessedAt: '2026-07-19',
    accessCount: 1,
    retention: 365,
    legalBasis: '安全必要 + 合同必要',
    encryption: 'aes-128',
    shared: false,
    size: '512 B',
  },
  {
    id: 'di-008',
    category: 'communication',
    name: '客服对话记录',
    description: '在线客服、智能客服、工单对话内容',
    sensitivity: 'high',
    source: '客服系统',
    collectedAt: '2026-05-12',
    lastAccessedAt: '2026-07-19',
    accessCount: 18,
    retention: 1095,
    legalBasis: '合同必要 + 服务质量',
    encryption: 'aes-256',
    shared: false,
    size: '124 KB',
  },
  {
    id: 'di-009',
    category: 'preference',
    name: '界面偏好',
    description: '语言、主题、行情自选、通知设置',
    sensitivity: 'low',
    source: '用户设置',
    collectedAt: '2025-08-15',
    lastAccessedAt: '2026-07-19',
    accessCount: 480,
    retention: 1825,
    legalBasis: '合同必要',
    encryption: 'aes-128',
    shared: false,
    size: '2 KB',
  },
  {
    id: 'di-010',
    category: 'financial',
    name: '资产快照',
    description: '每日子账户资产快照（不含交易明细）',
    sensitivity: 'medium',
    source: '结算系统',
    collectedAt: '2026-07-19',
    lastAccessedAt: '2026-07-19',
    accessCount: 1,
    retention: 2555,
    legalBasis: '法定义务',
    encryption: 'aes-256',
    shared: false,
    size: '256 B',
  },
];

const CONSENTS: Consent[] = [
  {
    id: 'c-001',
    title: '基础账户服务协议',
    purpose: '提供账户注册、登录、密码找回等基础服务',
    description: '使用平台服务所必须的用户协议，明确双方权利义务、账户管理规则与责任边界。',
    category: 'essential',
    status: 'granted',
    grantedAt: '2025-08-15 10:20',
    expiresAt: '长期有效',
    dataItems: ['身份信息', '联系方式', '设备信息'],
    version: 'v3.2',
    required: true,
    autoRenew: false,
  },
  {
    id: 'c-002',
    title: 'KYC 实名信息采集',
    purpose: '满足法定义务，完成实名认证',
    description: '依据法律法规要求，采集身份证件、人脸特征等实名信息用于身份核验。',
    category: 'essential',
    status: 'granted',
    grantedAt: '2025-08-15 10:25',
    expiresAt: '2027-08-15',
    dataItems: ['姓名', '身份证号', '人脸特征', '地址证明'],
    version: 'v2.1',
    required: true,
    autoRenew: false,
  },
  {
    id: 'c-003',
    title: '反洗钱信息留存',
    purpose: '依据反洗钱法规留存交易记录与身份信息',
    description: '依据《反洗钱法》要求，留存交易记录、身份资料至少 5 年。',
    category: 'essential',
    status: 'granted',
    grantedAt: '2025-08-15 10:30',
    expiresAt: '2030-08-15',
    dataItems: ['交易记录', '银行账户', '身份信息'],
    version: 'v1.5',
    required: true,
    autoRenew: false,
  },
  {
    id: 'c-004',
    title: '营销邮件订阅',
    purpose: '发送产品更新、活动信息、市场分析',
    description: '您可选择是否接收营销类邮件，随时可在隐私设置中调整。',
    category: 'marketing',
    status: 'granted',
    grantedAt: '2025-08-15 10:35',
    expiresAt: '2026-08-15',
    dataItems: ['邮箱'],
    version: 'v2.0',
    required: false,
    autoRenew: true,
  },
  {
    id: 'c-005',
    title: '行为分析数据',
    purpose: '改进产品体验、生成聚合统计',
    description: '通过匿名化分析您在平台内的行为，帮助我们优化功能与界面。',
    category: 'analytics',
    status: 'partial',
    grantedAt: '2026-01-10 14:20',
    expiresAt: '2027-01-10',
    dataItems: ['浏览行为', '点击流', '停留时长'],
    version: 'v1.8',
    required: false,
    autoRenew: true,
  },
  {
    id: 'c-006',
    title: '个性化推荐',
    purpose: '基于您的偏好推荐内容、产品、活动',
    description: '通过分析您的交易行为、浏览偏好，提供更精准的个性化内容。',
    category: 'functional',
    status: 'denied',
    grantedAt: '2025-08-15 10:40',
    expiresAt: '2026-08-15',
    dataItems: ['交易记录', '浏览行为', '偏好设置'],
    version: 'v2.0',
    required: false,
    autoRenew: false,
  },
  {
    id: 'c-007',
    title: '第三方数据分析',
    purpose: '与 Google Analytics 等第三方共享匿名化数据',
    description: '为改进产品体验，向第三方分析平台共享匿名化数据。',
    category: 'third-party',
    status: 'partial',
    grantedAt: '2025-08-15 10:42',
    expiresAt: '2026-08-15',
    thirdParty: { name: 'Google Analytics', purpose: '匿名行为分析', policyUrl: 'https://policies.google.com/privacy' },
    dataItems: ['浏览行为', '设备信息'],
    version: 'v1.3',
    required: false,
    autoRenew: true,
  },
  {
    id: 'c-008',
    title: '生物识别处理',
    purpose: '用于高级 KYC 活体检测与登录二次验证',
    description: '采集人脸特征 / 指纹用于身份核验，处理过程本地化、加密存储。',
    category: 'essential',
    status: 'granted',
    grantedAt: '2026-03-12 09:15',
    expiresAt: '2027-03-12',
    dataItems: ['人脸特征向量', '指纹哈希'],
    version: 'v1.0',
    required: false,
    autoRenew: false,
  },
  {
    id: 'c-009',
    title: '跨境数据传输',
    purpose: '全球节点冗余与多区域服务',
    description: '为提供全球一致服务，部分数据可能在境外节点备份与处理。',
    category: 'data-sharing',
    status: 'pending',
    grantedAt: '',
    expiresAt: '',
    dataItems: ['身份信息（脱敏）', '设备信息'],
    version: 'v1.0',
    required: false,
    autoRenew: false,
  },
];

const COOKIES: CookieItem[] = [
  { id: 'ck-001', name: 'session_id', type: 'necessary', provider: '第一方', purpose: '维持登录会话', duration: '会话期', required: true, category: 'essential', expiry: '会话', domain: '.zsdex.example' },
  { id: 'ck-002', name: 'csrf_token', type: 'necessary', provider: '第一方', purpose: '防止跨站请求伪造', duration: '24 小时', required: true, category: 'essential', expiry: '24h', domain: '.zsdex.example' },
  { id: 'ck-003', name: 'lang_pref', type: 'functional', provider: '第一方', purpose: '记住语言偏好', duration: '365 天', required: false, category: 'functional', expiry: '365d', domain: '.zsdex.example' },
  { id: 'ck-004', name: 'theme_pref', type: 'functional', provider: '第一方', purpose: '记住主题偏好', duration: '365 天', required: false, category: 'functional', expiry: '365d', domain: '.zsdex.example' },
  { id: 'ck-005', name: '_ga', type: 'analytics', provider: 'Google Analytics', purpose: '用户识别', duration: '2 年', required: false, category: 'analytics', expiry: '730d', domain: '.google.com' },
  { id: 'ck-006', name: '_gid', type: 'analytics', provider: 'Google Analytics', purpose: '会话识别', duration: '24 小时', required: false, category: 'analytics', expiry: '24h', domain: '.google.com' },
  { id: 'ck-007', name: '_fbp', type: 'marketing', provider: 'Meta', purpose: '广告效果追踪', duration: '90 天', required: false, category: 'marketing', expiry: '90d', domain: '.facebook.com' },
  { id: 'ck-008', name: 'personalized_rec', type: 'personalization', provider: '第一方', purpose: '个性化推荐', duration: '180 天', required: false, category: 'functional', expiry: '180d', domain: '.zsdex.example' },
  { id: 'ck-009', name: 'ab_test', type: 'functional', provider: '第一方', purpose: 'A/B 测试分流', duration: '30 天', required: false, category: 'functional', expiry: '30d', domain: '.zsdex.example' },
  { id: 'ck-010', name: 'marketing_id', type: 'marketing', provider: '第一方', purpose: '营销活动归因', duration: '90 天', required: false, category: 'marketing', expiry: '90d', domain: '.zsdex.example' },
];

const DATA_REQUESTS: DataRequest[] = [
  {
    id: 'dr-2026-07-19-001',
    type: 'export',
    status: 'processing',
    submittedAt: '2026-07-19 09:30',
    expectedAt: '2026-07-22 18:00',
    scope: ['身份信息', '交易记录', '资产快照', '偏好设置'],
    description: '用户请求导出全部个人数据副本',
    format: 'archive',
    regulatedBy: '个人信息保护法 第45条 / GDPR Art.20',
  },
  {
    id: 'dr-2026-06-12-003',
    type: 'export',
    status: 'completed',
    submittedAt: '2026-06-12 14:20',
    expectedAt: '2026-06-15 18:00',
    completedAt: '2026-06-14 10:15',
    scope: ['身份信息', '交易记录', '偏好设置'],
    description: '上次数据导出请求',
    format: 'archive',
    size: '12.4 MB',
    downloadUrl: '#mock-download-link-2026-06-14',
    regulatedBy: '个人信息保护法 第45条',
  },
  {
    id: 'dr-2026-05-08-002',
    type: 'correct',
    status: 'completed',
    submittedAt: '2026-05-08 11:00',
    expectedAt: '2026-05-15 18:00',
    completedAt: '2026-05-09 16:30',
    scope: ['联系方式'],
    description: '修改注册手机号',
    format: 'pdf',
    regulatedBy: '个人信息保护法 第46条',
  },
  {
    id: 'dr-2026-03-22-001',
    type: 'restrict',
    status: 'completed',
    submittedAt: '2026-03-22 09:45',
    expectedAt: '2026-03-29 18:00',
    completedAt: '2026-03-25 14:20',
    scope: ['营销数据', '个性化推荐'],
    description: '限制营销数据处理',
    format: 'pdf',
    regulatedBy: 'GDPR Art.18',
  },
];

const REGULATIONS: Regulation[] = [
  {
    id: 'reg-001',
    name: '中华人民共和国个人信息保护法',
    jurisdiction: '中国大陆',
    scope: '所有处理中国大陆自然人个人信息的处理者',
    effective: '2021-11-01',
    updated: '2026-05-01',
    keyArticles: ['第13条 合法性基础', '第17条 告知', '第44条 知情决定权', '第45条 数据复制', '第47条 删除权'],
    obligations: ['明示处理目的', '取得同意', '提供数据副本', '响应删除请求', '数据安全保护'],
    status: 'active',
    summary: '我国个人信息保护的基础性法律，规定了个人信息处理的基本原则、敏感个人信息特别保护、跨境传输安全评估等内容。',
    fullDocUrl: 'http://www.npc.gov.cn/',
  },
  {
    id: 'reg-002',
    name: '欧盟通用数据保护条例 (GDPR)',
    jurisdiction: '欧盟 27 国',
    scope: '在欧盟境内提供商品/服务的所有处理者',
    effective: '2018-05-25',
    updated: '2023-07-10',
    keyArticles: ['Art.6 合法性', 'Art.7 同意', 'Art.15 访问权', 'Art.17 被遗忘权', 'Art.20 数据可携', 'Art.32 安全'],
    obligations: ['DPO 任命', 'PIA 评估', '72h 通报', '跨境传输 SCC', 'Cookie 同意'],
    status: 'active',
    summary: '全球最严格的个人数据保护法之一，强调数据主体权利与处理者责任。',
    fullDocUrl: 'https://gdpr-info.eu/',
  },
  {
    id: 'reg-003',
    name: '美国加州消费者隐私法 (CCPA/CPRA)',
    jurisdiction: '美国加州',
    scope: '在加州开展业务的处理者（年收入/数据量门槛）',
    effective: '2020-01-01 (CCPA) / 2023-01-01 (CPRA)',
    updated: '2025-09-15',
    keyArticles: ['§1798.100 知情权', '§1798.105 删除权', '§1798.120 选择退出', '§1798.140 敏感数据'],
    obligations: ['隐私政策披露', '响应消费者请求', '禁止歧视', '敏感数据 opt-in'],
    status: 'active',
    summary: '美国首个综合性州级隐私法，CPRA 进一步强化敏感个人信息和数据最小化要求。',
    fullDocUrl: 'https://oag.ca.gov/privacy/ccpa',
  },
  {
    id: 'reg-004',
    name: '网络安全法 / 数据安全法',
    jurisdiction: '中国大陆',
    scope: '网络运营者 / 数据处理者',
    effective: '2017-06-01 / 2021-09-01',
    updated: '2025-12-20',
    keyArticles: ['网络运行安全', '数据分类分级', '数据安全审查', '重要数据出境'],
    obligations: ['等级保护', '数据分类', '安全审查', '应急响应'],
    status: 'active',
    summary: '我国网络与数据安全的基础法律，对运营者提出系统性合规要求。',
    fullDocUrl: 'http://www.npc.gov.cn/',
  },
  {
    id: 'reg-005',
    name: '反洗钱法 (AML)',
    jurisdiction: '中国大陆',
    scope: '金融机构 / 特定非金融机构',
    effective: '2007-01-01',
    updated: '2024-11-08',
    keyArticles: ['客户身份识别', '大额交易报告', '可疑交易报告', '记录保存'],
    obligations: ['KYC', '交易监控', '可疑报告', '至少 5 年留存'],
    status: 'active',
    summary: '反洗钱基础法律，要求金融机构对客户身份与交易记录进行严格管理。',
    fullDocUrl: 'http://www.npc.gov.cn/',
  },
  {
    id: 'reg-006',
    name: '韩国个人信息保护法 (PIPA)',
    jurisdiction: '韩国',
    scope: '在韩国境内处理个人信息的所有处理者',
    effective: '2011-09-30',
    updated: '2024-09-26',
    keyArticles: ['第15条 同意', '第21条 访问', '第35条 销毁', '第39条 跨境传输'],
    obligations: ['明示同意', 'DPO 任命', '影响评估', '跨境审批'],
    status: 'active',
    summary: '亚洲地区最严格的隐私法之一，对跨境传输有特别审批要求。',
    fullDocUrl: 'https://www.pipc.go.kr/',
  },
];

const LIFECYCLE_RULES: LifecycleRule[] = [
  { id: 'lc-001', dataCategory: 'identity', stage: 'retention', retentionDays: 1825, trigger: '账户注销', action: 'anonymize', lastRun: '2026-07-19 02:00', nextRun: '2026-07-20 02:00', affectedCount: 184, description: '账户注销 5 年后，身份信息匿名化' },
  { id: 'lc-002', dataCategory: 'financial', stage: 'retention', retentionDays: 2555, trigger: '法定义务', action: 'archive', lastRun: '2026-07-19 01:00', nextRun: '2026-07-20 01:00', affectedCount: 12480, description: '交易记录依法留存至少 7 年' },
  { id: 'lc-003', dataCategory: 'behavioral', stage: 'deletion', retentionDays: 90, trigger: '达到保留期', action: 'delete', lastRun: '2026-07-19 03:00', nextRun: '2026-07-20 03:00', affectedCount: 4280, description: '行为分析数据 90 天后自动删除' },
  { id: 'lc-004', dataCategory: 'communication', stage: 'retention', retentionDays: 1095, trigger: '服务质量', action: 'archive', lastRun: '2026-07-19 04:00', nextRun: '2026-07-20 04:00', affectedCount: 824, description: '客服对话 3 年后归档' },
  { id: 'lc-005', dataCategory: 'biometric', stage: 'deletion', retentionDays: 365, trigger: '高级 KYC 失效', action: 'delete', lastRun: '2026-07-19 05:00', nextRun: '2026-07-20 05:00', affectedCount: 142, description: '生物特征 1 年后自动删除' },
  { id: 'lc-006', dataCategory: 'device', stage: 'deletion', retentionDays: 365, trigger: '未登录 1 年', action: 'delete', lastRun: '2026-07-19 06:00', nextRun: '2026-07-20 06:00', affectedCount: 2840, description: '长期未活跃设备指纹自动删除' },
];

// ============== 工具函数 ==============

const fmtNumber = (n: number): string => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
};

const sensitivityColor = (s: Sensitivity): string => {
  switch (s) {
    case 'critical': return BRAND.danger;
    case 'high': return BRAND.warning;
    case 'medium': return BRAND.info;
    case 'low': return BRAND.textSub;
  }
};

const sensitivityLabel = (s: Sensitivity): string => {
  return { critical: '极高', high: '高', medium: '中', low: '低' }[s];
};

const categoryLabel = (c: DataCategory): string => {
  return { identity: '身份', contact: '联系方式', kyc: 'KYC', financial: '财务', behavioral: '行为', biometric: '生物特征', device: '设备', communication: '通讯', preference: '偏好' }[c];
};

const consentStatusKey = (s: ConsentStatus): StatusKey => {
  switch (s) {
    case 'granted': return 'OPEN';
    case 'denied': return 'COMING';
    case 'partial': return 'BETA';
    case 'pending': return 'SOON';
    case 'expired': return 'MAINTENANCE';
  }
};

const requestStatusKey = (s: DataRequestStatus): StatusKey => {
  switch (s) {
    case 'received': return 'PRIVATE';
    case 'processing': return 'BETA';
    case 'completed': return 'OPEN';
    case 'failed': return 'MAINTENANCE';
    case 'cancelled': return 'COMING';
  }
};

const typeLabel = (t: DataRequestType): string => {
  return { export: '数据导出', delete: '数据删除', correct: '数据更正', restrict: '限制处理', portability: '数据可携', object: '反对处理' }[t];
};

const regulationStatusKey = (s: Regulation['status']): StatusKey => {
  switch (s) {
    case 'active': return 'OPEN';
    case 'upcoming': return 'SOON';
    case 'research': return 'BETA';
    case 'deprecated': return 'COMING';
  }
};

const cookieTypeLabel = (t: CookieType): string => {
  return { necessary: '必要', functional: '功能', analytics: '分析', marketing: '营销', personalization: '个性化', 'third-party': '第三方' }[t];
};

// ============== 主组件 ==============

export function PortalPrivacy() {
  const [tab, setTab] = useState<Tab>('overview');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<DataCategory | 'all'>('all');
  const [sensitivityFilter, setSensitivityFilter] = useState<Sensitivity | 'all'>('all');
  const [sortBy, setSortBy] = useState<'collectedAt' | 'sensitivity' | 'accessCount'>('collectedAt');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [consents, setConsents] = useState<Consent[]>(CONSENTS);
  const [settings, setSettings] = useState<PrivacySettings>({
    marketingEmail: true,
    marketingSms: false,
    marketingPush: true,
    productUpdate: true,
    researchInvitation: false,
    thirdPartyShare: false,
    analyticsTracking: true,
    personalizedAds: false,
    languagePreference: 'zh-CN',
    dataMinimization: true,
    biometricProcessing: true,
    crossBorderTransfer: false,
  });
  const [cookiePrefs, setCookiePrefs] = useState<Record<CookieType, boolean>>({
    necessary: true,
    functional: true,
    analytics: true,
    marketing: false,
    personalization: false,
    'third-party': false,
  });
  const [drawer, setDrawer] = useState<DrawerState>({ open: false, type: null, payload: null });
  const [helpOpen, setHelpOpen] = useState(false);
  const [exportStep, setExportStep] = useState(0);
  const [exportScope, setExportScope] = useState<Set<string>>(new Set());
  const [exportFormat, setExportFormat] = useState<'json' | 'csv' | 'pdf' | 'archive'>('archive');
  const [kpi, setKpi] = useState<KpiSnapshot>({
    dataItems: 24,
    activeConsents: 8,
    pendingRequests: 1,
    sharedThirdParties: 3,
    cookieCount: 10,
    encryptionCoverage: 95,
    dataBreaches: 0,
    complianceScore: 96,
  });
  const searchRef = useRef<HTMLInputElement>(null);

  // 实时数据波动
  useEffect(() => {
    const id = setInterval(() => {
      setKpi((prev) => ({
        ...prev,
        activeConsents: Math.max(6, prev.activeConsents + (Math.random() > 0.7 ? 1 : Math.random() > 0.7 ? -1 : 0)),
        pendingRequests: Math.max(0, prev.pendingRequests + (Math.random() > 0.85 ? 1 : Math.random() > 0.95 ? -1 : 0)),
        encryptionCoverage: Math.max(90, Math.min(100, prev.encryptionCoverage + (Math.random() - 0.4))),
        complianceScore: Math.max(90, Math.min(99, prev.complianceScore + (Math.random() - 0.5))),
        cookieCount: Math.max(8, prev.cookieCount + (Math.random() > 0.5 ? 1 : 0)),
      }));
    }, 4000);
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
          setExportStep(0);
        } else if (helpOpen) setHelpOpen(false);
        else if (search) setSearch('');
      } else if (e.key === '?') {
        setHelpOpen((v) => !v);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [drawer.open, helpOpen, search]);

  // 筛选数据项
  const filteredData = useMemo(() => {
    let arr = DATA_ITEMS.slice();
    if (search) {
      const q = search.toLowerCase();
      arr = arr.filter((d) => d.name.toLowerCase().includes(q) || d.description.toLowerCase().includes(q) || d.source.toLowerCase().includes(q));
    }
    if (categoryFilter !== 'all') arr = arr.filter((d) => d.category === categoryFilter);
    if (sensitivityFilter !== 'all') arr = arr.filter((d) => d.sensitivity === sensitivityFilter);
    arr.sort((a, b) => {
      let av: number; let bv: number;
      if (sortBy === 'collectedAt') { av = new Date(a.collectedAt).getTime(); bv = new Date(b.collectedAt).getTime(); }
      else if (sortBy === 'sensitivity') { const order = { critical: 4, high: 3, medium: 2, low: 1 }; av = order[a.sensitivity]; bv = order[b.sensitivity]; }
      else { av = a.accessCount; bv = b.accessCount; }
      return sortDir === 'asc' ? av - bv : bv - av;
    });
    return arr;
  }, [search, categoryFilter, sensitivityFilter, sortBy, sortDir]);

  // 切换同意
  const toggleConsent = (id: string) => {
    setConsents((arr) => arr.map((c) => c.id === id ? { ...c, status: c.status === 'granted' ? 'denied' : 'granted' as ConsentStatus, grantedAt: c.status === 'granted' ? c.grantedAt : new Date().toISOString().slice(0, 16).replace('T', ' ') } : c));
  };

  const kpiCards = useMemo(() => [
    { label: '个人数据条目', value: kpi.dataItems, suffix: '项', icon: Database, color: BRAND.primary },
    { label: '活跃授权', value: kpi.activeConsents, suffix: '项', icon: CheckCircle2, color: BRAND.success },
    { label: '待处理请求', value: kpi.pendingRequests, suffix: '个', icon: Clock, color: BRAND.warning },
    { label: '共享第三方', value: kpi.sharedThirdParties, suffix: '家', icon: Globe2, color: BRAND.info },
    { label: 'Cookie 数量', value: kpi.cookieCount, suffix: '个', icon: Cookie, color: BRAND.textSub },
    { label: '加密覆盖率', value: kpi.encryptionCoverage, suffix: '%', icon: Lock, color: BRAND.success },
    { label: '数据泄露', value: kpi.dataBreaches, suffix: '起', icon: ShieldAlert, color: BRAND.success },
    { label: '合规评分', value: kpi.complianceScore, suffix: '/100', icon: Award, color: BRAND.primary },
  ], [kpi]);

  const tabOptions: { key: Tab; label: string; icon: React.ComponentType<{ size?: number; className?: string }> }[] = [
    { key: 'overview', label: '总览', icon: Activity },
    { key: 'my-data', label: '我的数据', icon: Database },
    { key: 'consents', label: '授权管理', icon: CheckCircle2 },
    { key: 'cookies', label: 'Cookie 偏好', icon: Cookie },
    { key: 'settings', label: '隐私设置', icon: Settings },
    { key: 'lifecycle', label: '数据生命周期', icon: RotateCw },
    { key: 'regulation', label: '监管框架', icon: ShieldCheck },
    { key: 'help', label: '帮助', icon: HelpCircle },
  ];

  const openDataExport = () => {
    setExportStep(0);
    setExportScope(new Set(['身份信息', '交易记录', '偏好设置']));
    setExportFormat('archive');
    setDrawer({ open: true, type: 'data-export', payload: null });
  };
  const openConsent = (id: string) => setDrawer({ open: true, type: 'consent', payload: id });
  const openCookie = (id: string) => setDrawer({ open: true, type: 'cookie', payload: id });
  const openLifecycle = (id: string) => setDrawer({ open: true, type: 'lifecycle', payload: id });
  const openDataItem = (id: string) => setDrawer({ open: true, type: 'data-item', payload: id });
  const openRequest = (id: string) => setDrawer({ open: true, type: 'request', payload: id });

  const drawerConsent = drawer.type === 'consent' ? consents.find((c) => c.id === drawer.payload) : null;
  const drawerCookie = drawer.type === 'cookie' ? COOKIES.find((c) => c.id === drawer.payload) : null;
  const drawerLifecycle = drawer.type === 'lifecycle' ? LIFECYCLE_RULES.find((l) => l.id === drawer.payload) : null;
  const drawerDataItem = drawer.type === 'data-item' ? DATA_ITEMS.find((d) => d.id === drawer.payload) : null;
  const drawerRequest = drawer.type === 'request' ? DATA_REQUESTS.find((r) => r.id === drawer.payload) : null;

  return (
    <div className="min-h-screen" style={{ backgroundColor: BRAND.bg, color: BRAND.text }}>
      <style jsx global>{`
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
        @keyframes countUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
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
            <div className="p-2 rounded-lg" style={{ backgroundColor: BRAND.primaryLt }}>
              <ShieldCheck size={20} style={{ color: BRAND.primary }} />
            </div>
            <div>
              <div className="text-xs uppercase tracking-wider mb-1" style={{ color: BRAND.primary }}>PRIVACY & DATA COMPLIANCE · P3.22</div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2">隐私与数据合规中心</h1>
              <p className="text-sm md:text-base" style={{ color: BRAND.textSub }}>
                个人数据透明 · 授权可追溯 · 跨境可审计 · 监管可对接
              </p>
            </div>
          </div>

          <div className="mt-8 flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: BRAND.textMute }} />
              <input
                ref={searchRef}
                type="text"
                placeholder="搜索数据条目 / 授权 / 法规...  按 / 聚焦"
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
                onClick={openDataExport}
                className="px-5 py-3 rounded-lg text-sm font-medium flex items-center gap-2"
                style={{ backgroundColor: BRAND.primary, color: BRAND.onPrimary }}
              >
                <Download size={16} />导出我的数据
              </button>
              <button
                onClick={() => setTab('consents')}
                className="px-5 py-3 rounded-lg text-sm font-medium flex items-center gap-2"
                style={{ backgroundColor: BRAND.bgCard, color: BRAND.text, border: `1px solid ${BRAND.border}` }}
              >
                <CheckCircle2 size={16} />授权管理
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
                  style={{ backgroundColor: BRAND.bgCard, border: `1px solid ${BRAND.border}` }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-xs" style={{ color: BRAND.textMute }}>{card.label}</div>
                    <div className="p-1.5 rounded" style={{ backgroundColor: `${card.color}20` }}>
                      <Icon size={14} style={{ color: card.color }} />
                    </div>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold count-up" style={{ color: BRAND.text }}>
                      {fmtNumber(card.value)}
                    </span>
                    <span className="text-xs" style={{ color: BRAND.textSub }}>{card.suffix}</span>
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
              {/* 总览：合规评分 + 数据地图 + 快速操作 */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="p-5 rounded-xl" style={{ backgroundColor: BRAND.bgCard, border: `1px solid ${BRAND.border}` }}>
                  <div className="text-base font-semibold mb-4 flex items-center gap-2">
                    <Award size={16} style={{ color: BRAND.primary }} />
                    合规评分
                  </div>
                  <div className="text-center mb-4">
                    <div className="text-5xl font-bold" style={{ color: BRAND.primary }}>{kpi.complianceScore}</div>
                    <div className="text-xs mt-1" style={{ color: BRAND.textSub }}>满分 100 · 行业优秀</div>
                  </div>
                  <div className="space-y-2">
                    {[
                      { label: '个保法合规', score: 98 },
                      { label: '数据安全', score: 96 },
                      { label: '用户权利响应', score: 94 },
                      { label: '跨境传输合规', score: 92 },
                    ].map((c, i) => (
                      <div key={i} className="flex items-center justify-between text-xs">
                        <span style={{ color: BRAND.textSub }}>{c.label}</span>
                        <span className="font-mono" style={{ color: BRAND.text }}>{c.score}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="lg:col-span-2 p-5 rounded-xl" style={{ backgroundColor: BRAND.bgCard, border: `1px solid ${BRAND.border}` }}>
                  <div className="text-base font-semibold mb-4 flex items-center gap-2">
                    <Database size={16} style={{ color: BRAND.info }} />
                    数据地图
                  </div>
                  <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
                    {[
                      { label: '身份', count: 3, color: BRAND.danger, icon: User },
                      { label: '联系方式', count: 2, color: BRAND.warning, icon: Phone },
                      { label: 'KYC', count: 4, color: BRAND.danger, icon: Fingerprint },
                      { label: '财务', count: 3, color: BRAND.warning, icon: Database },
                      { label: '行为', count: 2, color: BRAND.info, icon: Activity },
                      { label: '生物特征', count: 2, color: BRAND.danger, icon: ScanFace },
                      { label: '设备', count: 2, color: BRAND.info, icon: Cpu },
                      { label: '通讯', count: 1, color: BRAND.warning, icon: MessageCircle },
                      { label: '偏好', count: 1, color: BRAND.textSub, icon: Settings },
                    ].map((c, i) => {
                      const Icon = c.icon;
                      return (
                        <div
                          key={i}
                          className="p-3 rounded-lg text-center cursor-pointer transition-transform hover:scale-105"
                          style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}
                        >
                          <Icon size={20} className="mx-auto mb-1" style={{ color: c.color }} />
                          <div className="text-lg font-bold" style={{ color: BRAND.text }}>{c.count}</div>
                          <div className="text-[10px]" style={{ color: BRAND.textMute }}>{c.label}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* 快速操作 */}
              <div className="p-5 rounded-xl" style={{ backgroundColor: BRAND.bgCard, border: `1px solid ${BRAND.border}` }}>
                <div className="text-base font-semibold mb-3 flex items-center gap-2">
                  <Zap size={16} style={{ color: BRAND.warning }} />
                  快速操作
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { label: '导出我的数据', desc: '获取完整副本', icon: Download, action: openDataExport, color: BRAND.primary },
                    { label: '管理授权', desc: '撤销/调整同意', icon: CheckCircle2, action: () => setTab('consents'), color: BRAND.info },
                    { label: 'Cookie 偏好', desc: '分类控制', icon: Cookie, action: () => setTab('cookies'), color: BRAND.warning },
                    { label: '查看法规', desc: '适用法律框架', icon: ShieldCheck, action: () => setTab('regulation'), color: BRAND.success },
                  ].map((a, i) => {
                    const Icon = a.icon;
                    return (
                      <button
                        key={i}
                        onClick={a.action}
                        className="p-4 rounded-xl text-left transition-all hover:scale-[1.02]"
                        style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}
                      >
                        <Icon size={20} style={{ color: a.color }} className="mb-2" />
                        <div className="text-sm font-medium" style={{ color: BRAND.text }}>{a.label}</div>
                        <div className="text-[10px]" style={{ color: BRAND.textMute }}>{a.desc}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 数据请求历史 */}
              <div className="p-5 rounded-xl" style={{ backgroundColor: BRAND.bgCard, border: `1px solid ${BRAND.border}` }}>
                <div className="flex items-center justify-between mb-3">
                  <div className="text-base font-semibold flex items-center gap-2">
                    <FileText size={16} style={{ color: BRAND.textSub }} />
                    数据请求历史
                  </div>
                  <button onClick={openDataExport} className="text-xs flex items-center gap-1" style={{ color: BRAND.primary }}>
                    新建请求 <ChevronRight size={12} />
                  </button>
                </div>
                <div className="space-y-2">
                  {DATA_REQUESTS.map((r) => {
                    const sk = requestStatusKey(r.status);
                    return (
                      <button
                        key={r.id}
                        onClick={() => openRequest(r.id)}
                        className="w-full flex items-center justify-between p-3 rounded-lg text-left"
                        style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="text-xs font-mono" style={{ color: BRAND.textMute }}>{r.id}</span>
                            <span className="text-[10px] px-2 py-0.5 rounded" style={{ backgroundColor: BRAND.primaryLt, color: BRAND.primary }}>{typeLabel(r.type)}</span>
                            <span className="text-[10px] px-2 py-0.5 rounded" style={{ backgroundColor: STATUS[sk].bg, color: STATUS[sk].color }}>{STATUS[sk].label}</span>
                          </div>
                          <div className="text-xs" style={{ color: BRAND.textSub }}>{r.description}</div>
                        </div>
                        <div className="text-right ml-3">
                          <div className="text-[10px]" style={{ color: BRAND.textMute }}>{r.submittedAt}</div>
                          {r.completedAt && <div className="text-[10px]" style={{ color: BRAND.success }}>完成 {r.completedAt}</div>}
                          <ChevronRight size={14} className="inline" style={{ color: BRAND.textMute }} />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {tab === 'my-data' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl" style={{ backgroundColor: BRAND.bgCard, border: `1px solid ${BRAND.border}` }}>
                <div className="flex flex-wrap gap-3 items-center">
                  <div className="flex items-center gap-2">
                    <Filter size={14} style={{ color: BRAND.textMute }} />
                    <span className="text-xs" style={{ color: BRAND.textMute }}>分类</span>
                    <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value as DataCategory | 'all')} className="px-2 py-1 rounded text-xs" style={{ backgroundColor: BRAND.bg, color: BRAND.text, border: `1px solid ${BRAND.border}` }}>
                      <option value="all">全部</option>
                      {Object.entries(categoryLabel).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs" style={{ color: BRAND.textMute }}>敏感度</span>
                    <select value={sensitivityFilter} onChange={(e) => setSensitivityFilter(e.target.value as Sensitivity | 'all')} className="px-2 py-1 rounded text-xs" style={{ backgroundColor: BRAND.bg, color: BRAND.text, border: `1px solid ${BRAND.border}` }}>
                      <option value="all">全部</option>
                      <option value="critical">极高</option>
                      <option value="high">高</option>
                      <option value="medium">中</option>
                      <option value="low">低</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-2 ml-auto">
                    <span className="text-xs" style={{ color: BRAND.textMute }}>排序</span>
                    <button onClick={() => { setSortBy('collectedAt'); setSortDir(sortDir === 'asc' ? 'desc' : 'asc'); }} className="px-2 py-1 rounded text-xs" style={{ backgroundColor: sortBy === 'collectedAt' ? BRAND.primaryLt : BRAND.bg, color: sortBy === 'collectedAt' ? BRAND.primary : BRAND.textSub, border: `1px solid ${BRAND.border}` }}>采集时间</button>
                    <button onClick={() => { setSortBy('sensitivity'); setSortDir(sortDir === 'asc' ? 'desc' : 'asc'); }} className="px-2 py-1 rounded text-xs" style={{ backgroundColor: sortBy === 'sensitivity' ? BRAND.primaryLt : BRAND.bg, color: sortBy === 'sensitivity' ? BRAND.primary : BRAND.textSub, border: `1px solid ${BRAND.border}` }}>敏感度</button>
                    <button onClick={() => { setSortBy('accessCount'); setSortDir(sortDir === 'asc' ? 'desc' : 'asc'); }} className="px-2 py-1 rounded text-xs" style={{ backgroundColor: sortBy === 'accessCount' ? BRAND.primaryLt : BRAND.bg, color: sortBy === 'accessCount' ? BRAND.primary : BRAND.textSub, border: `1px solid ${BRAND.border}` }}>访问次数</button>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                {filteredData.length === 0 ? (
                  <div className="p-12 rounded-xl text-center" style={{ backgroundColor: BRAND.bgCard, border: `1px solid ${BRAND.border}` }}>
                    <Database size={32} className="mx-auto mb-3" style={{ color: BRAND.textMute }} />
                    <div className="text-sm" style={{ color: BRAND.textMute }}>没有匹配的数据条目</div>
                  </div>
                ) : filteredData.map((d) => (
                  <button
                    key={d.id}
                    onClick={() => openDataItem(d.id)}
                    className="w-full p-4 rounded-xl text-left transition-all hover:scale-[1.005]"
                    style={{ backgroundColor: BRAND.bgCard, border: `1px solid ${BRAND.border}` }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className="p-2 rounded flex-shrink-0" style={{ backgroundColor: `${sensitivityColor(d.sensitivity)}20` }}>
                          <Database size={16} style={{ color: sensitivityColor(d.sensitivity) }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <div className="text-sm font-semibold" style={{ color: BRAND.text }}>{d.name}</div>
                            <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: `${sensitivityColor(d.sensitivity)}20`, color: sensitivityColor(d.sensitivity) }}>
                              {sensitivityLabel(d.sensitivity)}敏感
                            </span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: BRAND.bg, color: BRAND.textSub, border: `1px solid ${BRAND.border}` }}>{categoryLabel(d.category)}</span>
                            {d.shared && <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: BRAND.warningLt, color: BRAND.warning }}>已共享</span>}
                          </div>
                          <div className="text-xs mb-1" style={{ color: BRAND.textSub }}>{d.description}</div>
                          <div className="flex items-center gap-3 text-[10px] flex-wrap" style={{ color: BRAND.textMute }}>
                            <span>来源: {d.source}</span>
                            <span>采集: {d.collectedAt}</span>
                            <span>最近访问: {d.lastAccessedAt}</span>
                            <span>{d.accessCount} 次访问</span>
                            <span>大小: {d.size}</span>
                          </div>
                        </div>
                      </div>
                      <ChevronRight size={16} style={{ color: BRAND.textMute }} />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {tab === 'consents' && (
            <div className="space-y-2 stagger-in">
              {consents.map((c) => {
                const sk = consentStatusKey(c.status);
                return (
                  <div
                    key={c.id}
                    className="p-4 rounded-xl"
                    style={{ backgroundColor: BRAND.bgCard, border: `1px solid ${BRAND.border}` }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <div className="text-sm font-semibold" style={{ color: BRAND.text }}>{c.title}</div>
                          <span className="text-[10px] px-2 py-0.5 rounded" style={{ backgroundColor: STATUS[sk].bg, color: STATUS[sk].color }}>{STATUS[sk].label}</span>
                          {c.required && <span className="text-[10px] px-2 py-0.5 rounded" style={{ backgroundColor: BRAND.bg, color: BRAND.danger, border: `1px solid ${BRAND.danger}40` }}>必需</span>}
                          {c.autoRenew && <span className="text-[10px] px-2 py-0.5 rounded" style={{ backgroundColor: BRAND.infoLt, color: BRAND.info }}>自动续期</span>}
                        </div>
                        <div className="text-xs mb-2" style={{ color: BRAND.textSub }}>{c.description}</div>
                        <div className="flex items-center gap-3 text-[10px] flex-wrap" style={{ color: BRAND.textMute }}>
                          <span>版本: {c.version}</span>
                          {c.grantedAt && <span>授权: {c.grantedAt}</span>}
                          {c.expiresAt && <span>到期: {c.expiresAt}</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {!c.required && (
                          <button
                            onClick={() => toggleConsent(c.id)}
                            className="px-3 py-1.5 rounded-lg text-xs font-medium"
                            style={{ backgroundColor: c.status === 'granted' ? BRAND.dangerLt : BRAND.successLt, color: c.status === 'granted' ? BRAND.danger : BRAND.success, border: `1px solid ${c.status === 'granted' ? BRAND.danger : BRAND.success}40` }}
                          >
                            {c.status === 'granted' ? '撤销' : '授权'}
                          </button>
                        )}
                        <button onClick={() => openConsent(c.id)} className="p-1.5 rounded" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}>
                          <Eye size={12} style={{ color: BRAND.textSub }} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {tab === 'cookies' && (
            <div className="space-y-4">
              <div className="p-5 rounded-xl" style={{ backgroundColor: BRAND.bgCard, border: `1px solid ${BRAND.border}` }}>
                <div className="text-base font-semibold mb-3 flex items-center gap-2">
                  <Cookie size={16} style={{ color: BRAND.warning }} />
                  Cookie 偏好总览
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                  {(['necessary', 'functional', 'analytics', 'marketing'] as const).map((t) => {
                    const enabled = cookiePrefs[t];
                    return (
                      <button
                        key={t}
                        onClick={() => t !== 'necessary' && setCookiePrefs((p) => ({ ...p, [t]: !p[t] }))}
                        disabled={t === 'necessary'}
                        className="p-4 rounded-lg text-left"
                        style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}`, opacity: t === 'necessary' ? 0.7 : 1 }}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="text-sm font-semibold" style={{ color: BRAND.text }}>{cookieTypeLabel(t)}</div>
                          <div className="w-10 h-5 rounded-full p-0.5" style={{ backgroundColor: enabled ? BRAND.success : BRAND.bg, border: `1px solid ${BRAND.border}` }}>
                            <div className="w-4 h-4 rounded-full transition-transform" style={{ backgroundColor: enabled ? BRAND.onGold : BRAND.textMute, transform: enabled ? 'translateX(20px)' : 'translateX(0)' }} />
                          </div>
                        </div>
                        <div className="text-[10px]" style={{ color: BRAND.textMute }}>{COOKIES.filter((c) => c.category === t).length} 个</div>
                      </button>
                    );
                  })}
                </div>
                <button
                  onClick={() => setCookiePrefs({ necessary: true, functional: true, analytics: true, marketing: true, personalization: true, 'third-party': true })}
                  className="px-4 py-2 rounded-lg text-xs font-medium"
                  style={{ backgroundColor: BRAND.primary, color: BRAND.onPrimary }}
                >
                  全部接受
                </button>
              </div>

              <div className="space-y-2">
                {COOKIES.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => openCookie(c.id)}
                    className="w-full p-3 rounded-xl text-left flex items-center gap-3"
                    style={{ backgroundColor: BRAND.bgCard, border: `1px solid ${BRAND.border}` }}
                  >
                    <Cookie size={16} style={{ color: BRAND.warning }} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-sm font-mono font-semibold" style={{ color: BRAND.text }}>{c.name}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: BRAND.bg, color: BRAND.textSub, border: `1px solid ${BRAND.border}` }}>{cookieTypeLabel(c.type)}</span>
                        {c.required && <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: BRAND.dangerLt, color: BRAND.danger }}>必需</span>}
                      </div>
                      <div className="text-xs" style={{ color: BRAND.textSub }}>{c.purpose}</div>
                      <div className="text-[10px] mt-1" style={{ color: BRAND.textMute }}>{c.provider} · {c.duration} · {c.domain}</div>
                    </div>
                    <ChevronRight size={14} style={{ color: BRAND.textMute }} />
                  </button>
                ))}
              </div>
            </div>
          )}

          {tab === 'settings' && (
            <div className="space-y-4 stagger-in">
              {[
                { title: '营销与推广', desc: '控制您接收的营销信息类型', items: [
                  { key: 'marketingEmail' as const, label: '营销邮件', desc: '产品更新、活动推送' },
                  { key: 'marketingSms' as const, label: '营销短信', desc: '重要活动提醒' },
                  { key: 'marketingPush' as const, label: 'App 推送', desc: '实时消息推送' },
                  { key: 'productUpdate' as const, label: '产品更新', desc: '新功能、版本说明' },
                  { key: 'researchInvitation' as const, label: '调研邀请', desc: '用户体验调研' },
                ]},
                { title: '数据共享与分析', desc: '控制数据是否用于分析与共享', items: [
                  { key: 'analyticsTracking' as const, label: '行为分析', desc: '匿名化改进产品' },
                  { key: 'personalizedAds' as const, label: '个性化广告', desc: '第三方平台个性化推荐' },
                  { key: 'thirdPartyShare' as const, label: '第三方共享', desc: '向合作伙伴共享部分数据' },
                ]},
                { title: '生物识别与跨境', desc: '高级隐私保护设置', items: [
                  { key: 'biometricProcessing' as const, label: '生物识别', desc: '允许使用人脸/指纹进行身份核验' },
                  { key: 'crossBorderTransfer' as const, label: '跨境传输', desc: '允许数据在境外节点处理' },
                  { key: 'dataMinimization' as const, label: '最小化采集', desc: '仅采集业务所必需的最少数据' },
                ]},
              ].map((group, gi) => (
                <div key={gi} className="p-5 rounded-xl" style={{ backgroundColor: BRAND.bgCard, border: `1px solid ${BRAND.border}` }}>
                  <div className="text-base font-semibold mb-1">{group.title}</div>
                  <div className="text-xs mb-3" style={{ color: BRAND.textSub }}>{group.desc}</div>
                  <div className="space-y-2">
                    {group.items.map((item) => (
                      <div key={item.key} className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}>
                        <div>
                          <div className="text-sm font-medium" style={{ color: BRAND.text }}>{item.label}</div>
                          <div className="text-[10px]" style={{ color: BRAND.textMute }}>{item.desc}</div>
                        </div>
                        <button
                          onClick={() => setSettings((p) => ({ ...p, [item.key]: !p[item.key] }))}
                          className="w-12 h-6 rounded-full p-0.5 transition-colors"
                          style={{ backgroundColor: settings[item.key] ? BRAND.success : BRAND.bg, border: `1px solid ${BRAND.border}` }}
                        >
                          <div className="w-5 h-5 rounded-full transition-transform" style={{ backgroundColor: settings[item.key] ? BRAND.onGold : BRAND.textMute, transform: settings[item.key] ? 'translateX(24px)' : 'translateX(0)' }} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === 'lifecycle' && (
            <div className="space-y-2 stagger-in">
              {LIFECYCLE_RULES.map((l) => (
                <button
                  key={l.id}
                  onClick={() => openLifecycle(l.id)}
                  className="w-full p-4 rounded-xl text-left"
                  style={{ backgroundColor: BRAND.bgCard, border: `1px solid ${BRAND.border}` }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="p-2 rounded flex-shrink-0" style={{ backgroundColor: BRAND.infoLt }}>
                        <RotateCw size={16} style={{ color: BRAND.info }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <div className="text-sm font-semibold" style={{ color: BRAND.text }}>{categoryLabel(l.dataCategory)} · {l.stage}</div>
                          <span className="text-[10px] px-2 py-0.5 rounded" style={{ backgroundColor: BRAND.primaryLt, color: BRAND.primary }}>{l.action.toUpperCase()}</span>
                        </div>
                        <div className="text-xs mb-1" style={{ color: BRAND.textSub }}>{l.description}</div>
                        <div className="flex items-center gap-3 text-[10px] flex-wrap" style={{ color: BRAND.textMute }}>
                          <span>保留 {l.retentionDays} 天</span>
                          <span>触发: {l.trigger}</span>
                          <span>下次执行: {l.nextRun}</span>
                          <span>影响 {l.affectedCount} 条</span>
                        </div>
                      </div>
                    </div>
                    <ChevronRight size={16} style={{ color: BRAND.textMute }} />
                  </div>
                </button>
              ))}
            </div>
          )}

          {tab === 'regulation' && (
            <div className="space-y-3 stagger-in">
              {REGULATIONS.map((r) => {
                const sk = regulationStatusKey(r.status);
                return (
                  <div
                    key={r.id}
                    className="p-5 rounded-xl"
                    style={{ backgroundColor: BRAND.bgCard, border: `1px solid ${BRAND.border}` }}
                  >
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <div className="text-base font-semibold" style={{ color: BRAND.text }}>{r.name}</div>
                          <span className="text-[10px] px-2 py-0.5 rounded" style={{ backgroundColor: STATUS[sk].bg, color: STATUS[sk].color }}>{STATUS[sk].label}</span>
                        </div>
                        <div className="text-xs" style={{ color: BRAND.textSub }}>{r.summary}</div>
                      </div>
                      <a href={r.fullDocUrl} target="_blank" rel="noreferrer" className="p-2 rounded" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}>
                        <ExternalLink size={14} style={{ color: BRAND.primary }} />
                      </a>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <div className="text-[10px] mb-1" style={{ color: BRAND.textMute }}>司法管辖区</div>
                        <div className="text-sm" style={{ color: BRAND.text }}>{r.jurisdiction}</div>
                      </div>
                      <div>
                        <div className="text-[10px] mb-1" style={{ color: BRAND.textMute }}>生效日期</div>
                        <div className="text-sm font-mono" style={{ color: BRAND.text }}>{r.effective}</div>
                      </div>
                      <div>
                        <div className="text-[10px] mb-1" style={{ color: BRAND.textMute }}>最近更新</div>
                        <div className="text-sm font-mono" style={{ color: BRAND.text }}>{r.updated}</div>
                      </div>
                    </div>
                    <div className="mt-3">
                      <div className="text-[10px] mb-1" style={{ color: BRAND.textMute }}>关键条款</div>
                      <div className="flex flex-wrap gap-1">
                        {r.keyArticles.map((a, i) => (
                          <span key={i} className="text-[10px] px-2 py-0.5 rounded" style={{ backgroundColor: BRAND.bg, color: BRAND.textSub, border: `1px solid ${BRAND.border}` }}>{a}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
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
                  常见问题
                </div>
                <div className="space-y-2 text-sm" style={{ color: BRAND.textSub }}>
                  <div>· 如何导出我的个人数据？</div>
                  <div>· 如何撤销我授予的某项同意？</div>
                  <div>· Cookie 偏好设置后多久生效？</div>
                  <div>· 跨境数据传输受哪些法规约束？</div>
                  <div>· 删除账户后我的数据会怎样？</div>
                </div>
              </div>
              <div className="md:col-span-2 p-5 rounded-xl" style={{ backgroundColor: BRAND.bgCard, border: `1px solid ${BRAND.border}` }}>
                <div className="text-base font-semibold mb-3 flex items-center gap-2">
                  <Info size={16} style={{ color: BRAND.info }} />
                  合规说明
                </div>
                <ul className="space-y-2 text-xs" style={{ color: BRAND.textSub }}>
                  <li>· 本平台严格遵守《中华人民共和国个人信息保护法》《网络安全法》《数据安全法》《反洗钱法》以及业务所在司法管辖区的相关法律法规。</li>
                  <li>· 用户依法享有知情权、决定权、查询权、更正权、删除权、可携权等权利，可通过本中心或联系客服行使。</li>
                  <li>· 跨境数据传输需经用户明示同意并通过国家网信部门安全评估 / 标准合同 / 认证。</li>
                  <li>· 涉及敏感个人信息（生物识别、金融账户、行踪轨迹等）的处理已取得用户单独同意。</li>
                  <li>· 本页面所列监管框架与合规要求为研究方向参考，不构成法律意见。具体合规事务请联系合规部门或外部法律顾问。</li>
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
              本隐私与数据合规中心展示的监管框架、合规要求、数据处理规则等均为内部运营参考与合规研究方向，不构成具有法律约束力的意见或承诺。具体合规事务请以官方公告、监管文件及专业法律意见为准。如需行使数据主体权利，请通过本中心提交请求或联系客户支持。
            </div>
          </div>
        </div>
      </section>

      {/* 底部 CTA */}
      <section className="px-6 py-8">
        <div className="max-w-7xl mx-auto text-center">
          <div className="text-lg font-semibold mb-2">保护您的数据主权</div>
          <div className="text-sm mb-4" style={{ color: BRAND.textSub }}>透明 · 可控 · 可追溯</div>
          <div className="flex justify-center gap-3 flex-wrap">
            <button
              onClick={openDataExport}
              className="px-6 py-3 rounded-lg text-sm font-medium flex items-center gap-2"
              style={{ backgroundColor: BRAND.primary, color: BRAND.onPrimary }}
            >
              <Download size={16} />导出我的数据
            </button>
            <button
              onClick={() => setTab('consents')}
              className="px-6 py-3 rounded-lg text-sm font-medium flex items-center gap-2"
              style={{ backgroundColor: BRAND.bgCard, color: BRAND.text, border: `1px solid ${BRAND.border}` }}
            >
              <CheckCircle2 size={16} />管理授权
            </button>
          </div>
        </div>
      </section>

      {/* 数据导出向导 Drawer */}
      {drawer.open && drawer.type === 'data-export' && (
        <>
          <div className="fixed inset-0 z-40" style={{ backgroundColor: BRAND.overlay }} onClick={() => { setDrawer({ open: false, type: null, payload: null }); setExportStep(0); }} />
          <div className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-2xl overflow-y-auto scrollbar-thin drawer-anim" style={{ backgroundColor: BRAND.bg, borderLeft: `1px solid ${BRAND.border}` }}>
            <div className="sticky top-0 p-4 flex items-center justify-between" style={{ backgroundColor: BRAND.bg, borderBottom: `1px solid ${BRAND.border}` }}>
              <div className="text-base font-semibold flex items-center gap-2">
                <Download size={16} style={{ color: BRAND.primary }} />
                数据导出向导
              </div>
              <button onClick={() => { setDrawer({ open: false, type: null, payload: null }); setExportStep(0); }} className="p-1">
                <X size={18} style={{ color: BRAND.textMute }} />
              </button>
            </div>
            <div className="p-6">
              {/* 步骤指示 */}
              <div className="flex items-center gap-2 mb-6">
                {['选择范围', '选择格式', '身份验证', '确认提交'].map((s, i) => (
                  <React.Fragment key={i}>
                    <div className="flex items-center gap-1">
                      <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold" style={{ backgroundColor: i <= exportStep ? BRAND.primary : BRAND.bgCard, color: i <= exportStep ? BRAND.onPrimary : BRAND.textMute, border: `1px solid ${i <= exportStep ? BRAND.primary : BRAND.border}` }}>
                        {i + 1}
                      </div>
                      <span className="text-xs" style={{ color: i === exportStep ? BRAND.text : BRAND.textMute }}>{s}</span>
                    </div>
                    {i < 3 && <ChevronRight size={12} style={{ color: BRAND.textMute }} />}
                  </React.Fragment>
                ))}
              </div>

              {exportStep === 0 && (
                <div className="space-y-2">
                  <div className="text-sm font-semibold mb-2">选择要导出的数据范围</div>
                  {['身份信息', '联系方式', 'KYC 资料', '交易记录', '资产快照', '偏好设置', '客服记录', '设备信息'].map((s) => (
                    <label key={s} className="flex items-center gap-2 p-2 rounded cursor-pointer" style={{ backgroundColor: BRAND.bgCard, border: `1px solid ${BRAND.border}` }}>
                      <input
                        type="checkbox"
                        checked={exportScope.has(s)}
                        onChange={(e) => {
                          const ns = new Set(exportScope);
                          if (e.target.checked) ns.add(s); else ns.delete(s);
                          setExportScope(ns);
                        }}
                      />
                      <span className="text-sm" style={{ color: BRAND.text }}>{s}</span>
                    </label>
                  ))}
                </div>
              )}

              {exportStep === 1 && (
                <div className="space-y-2">
                  <div className="text-sm font-semibold mb-2">选择导出格式</div>
                  {([
                    { v: 'archive' as const, label: '完整压缩包', desc: 'JSON + CSV + 原始文件（推荐）' },
                    { v: 'json' as const, label: 'JSON', desc: '结构化数据，便于二次处理' },
                    { v: 'csv' as const, label: 'CSV', desc: '表格数据，便于 Excel 打开' },
                    { v: 'pdf' as const, label: 'PDF 报告', desc: '人类可读，含摘要' },
                  ]).map((f) => (
                    <button
                      key={f.v}
                      onClick={() => setExportFormat(f.v)}
                      className="w-full p-3 rounded-lg text-left flex items-center gap-3"
                      style={{ backgroundColor: exportFormat === f.v ? BRAND.primaryLt : BRAND.bgCard, border: `1px solid ${exportFormat === f.v ? BRAND.primary : BRAND.border}` }}
                    >
                      <div className="w-4 h-4 rounded-full flex items-center justify-center" style={{ border: `2px solid ${exportFormat === f.v ? BRAND.primary : BRAND.border}` }}>
                        {exportFormat === f.v && <div className="w-2 h-2 rounded-full" style={{ backgroundColor: BRAND.primary }} />}
                      </div>
                      <div>
                        <div className="text-sm font-medium" style={{ color: BRAND.text }}>{f.label}</div>
                        <div className="text-[10px]" style={{ color: BRAND.textMute }}>{f.desc}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {exportStep === 2 && (
                <div className="space-y-3">
                  <div className="text-sm font-semibold mb-2">身份验证</div>
                  <div className="p-4 rounded-lg" style={{ backgroundColor: BRAND.bgCard, border: `1px solid ${BRAND.border}` }}>
                    <div className="text-xs mb-2" style={{ color: BRAND.textSub }}>为保护您的数据安全，请完成以下验证：</div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-2 rounded" style={{ backgroundColor: BRAND.bg }}>
                        <span className="text-sm" style={{ color: BRAND.text }}>2FA 验证</span>
                        <span className="text-[10px] px-2 py-0.5 rounded" style={{ backgroundColor: BRAND.successLt, color: BRAND.success }}>已通过</span>
                      </div>
                      <div className="flex items-center justify-between p-2 rounded" style={{ backgroundColor: BRAND.bg }}>
                        <span className="text-sm" style={{ color: BRAND.text }}>邮箱验证码</span>
                        <button className="text-[10px] px-2 py-0.5 rounded" style={{ backgroundColor: BRAND.primaryLt, color: BRAND.primary }}>发送验证码</button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {exportStep === 3 && (
                <div className="space-y-3">
                  <div className="text-sm font-semibold mb-2">确认提交</div>
                  <div className="p-4 rounded-lg space-y-2 text-xs" style={{ backgroundColor: BRAND.bgCard, border: `1px solid ${BRAND.border}` }}>
                    <div className="flex justify-between"><span style={{ color: BRAND.textMute }}>导出范围</span><span style={{ color: BRAND.text }}>{exportScope.size} 类</span></div>
                    <div className="flex justify-between"><span style={{ color: BRAND.textMute }}>导出格式</span><span style={{ color: BRAND.text }}>{exportFormat.toUpperCase()}</span></div>
                    <div className="flex justify-between"><span style={{ color: BRAND.textMute }}>预计大小</span><span style={{ color: BRAND.text }}>~12 MB</span></div>
                    <div className="flex justify-between"><span style={{ color: BRAND.textMute }}>处理时长</span><span style={{ color: BRAND.text }}>3 个工作日内</span></div>
                  </div>
                  <div className="p-3 rounded-lg text-xs flex items-start gap-2" style={{ backgroundColor: BRAND.warningLt, color: BRAND.textSub, border: `1px solid ${BRAND.warning}40` }}>
                    <Info size={14} className="mt-0.5 flex-shrink-0" style={{ color: BRAND.warning }} />
                    <div>提交后系统将通过邮件通知处理进度，导出文件将通过加密链接提供，链接有效期 7 天。</div>
                  </div>
                </div>
              )}

              <div className="flex gap-2 mt-6">
                {exportStep > 0 && (
                  <button onClick={() => setExportStep(exportStep - 1)} className="px-4 py-2 rounded-lg text-sm" style={{ backgroundColor: BRAND.bgCard, color: BRAND.text, border: `1px solid ${BRAND.border}` }}>
                    上一步
                  </button>
                )}
                <button
                  onClick={() => exportStep < 3 ? setExportStep(exportStep + 1) : (() => { setDrawer({ open: false, type: null, payload: null }); setExportStep(0); })()}
                  className="flex-1 py-2 rounded-lg text-sm font-medium"
                  style={{ backgroundColor: BRAND.primary, color: BRAND.onPrimary }}
                >
                  {exportStep < 3 ? '下一步' : '提交申请'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* 授权详情 Drawer */}
      {drawer.open && drawer.type === 'consent' && drawerConsent && (
        <>
          <div className="fixed inset-0 z-40" style={{ backgroundColor: BRAND.overlay }} onClick={() => setDrawer({ open: false, type: null, payload: null })} />
          <div className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-2xl overflow-y-auto scrollbar-thin drawer-anim" style={{ backgroundColor: BRAND.bg, borderLeft: `1px solid ${BRAND.border}` }}>
            <div className="sticky top-0 p-4 flex items-center justify-between" style={{ backgroundColor: BRAND.bg, borderBottom: `1px solid ${BRAND.border}` }}>
              <div className="text-base font-semibold flex items-center gap-2">
                <CheckCircle2 size={16} style={{ color: BRAND.primary }} />
                授权详情
              </div>
              <button onClick={() => setDrawer({ open: false, type: null, payload: null })} className="p-1"><X size={18} style={{ color: BRAND.textMute }} /></button>
            </div>
            <div className="p-6">
              <h2 className="text-xl font-bold mb-2" style={{ color: BRAND.text }}>{drawerConsent.title}</h2>
              <p className="text-sm mb-4" style={{ color: BRAND.textSub }}>{drawerConsent.description}</p>
              <div className="space-y-3 text-sm">
                <div><span style={{ color: BRAND.textMute }}>目的：</span><span style={{ color: BRAND.text }}>{drawerConsent.purpose}</span></div>
                <div><span style={{ color: BRAND.textMute }}>涉及数据：</span><span style={{ color: BRAND.text }}>{drawerConsent.dataItems.join('、')}</span></div>
                <div><span style={{ color: BRAND.textMute }}>版本：</span><span style={{ color: BRAND.text }}>{drawerConsent.version}</span></div>
                {drawerConsent.thirdParty && (
                  <div>
                    <span style={{ color: BRAND.textMute }}>第三方：</span>
                    <a href={drawerConsent.thirdParty.policyUrl} target="_blank" rel="noreferrer" className="text-sm" style={{ color: BRAND.primary }}>{drawerConsent.thirdParty.name} <ExternalLink size={10} className="inline" /></a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Cookie 详情 Drawer */}
      {drawer.open && drawer.type === 'cookie' && drawerCookie && (
        <>
          <div className="fixed inset-0 z-40" style={{ backgroundColor: BRAND.overlay }} onClick={() => setDrawer({ open: false, type: null, payload: null })} />
          <div className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-2xl overflow-y-auto scrollbar-thin drawer-anim" style={{ backgroundColor: BRAND.bg, borderLeft: `1px solid ${BRAND.border}` }}>
            <div className="sticky top-0 p-4 flex items-center justify-between" style={{ backgroundColor: BRAND.bg, borderBottom: `1px solid ${BRAND.border}` }}>
              <div className="text-base font-semibold flex items-center gap-2"><Cookie size={16} style={{ color: BRAND.warning }} />Cookie 详情</div>
              <button onClick={() => setDrawer({ open: false, type: null, payload: null })} className="p-1"><X size={18} style={{ color: BRAND.textMute }} /></button>
            </div>
            <div className="p-6">
              <h2 className="text-xl font-bold font-mono mb-2" style={{ color: BRAND.text }}>{drawerCookie.name}</h2>
              <p className="text-sm mb-4" style={{ color: BRAND.textSub }}>{drawerCookie.purpose}</p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span style={{ color: BRAND.textMute }}>类型</span><span style={{ color: BRAND.text }}>{cookieTypeLabel(drawerCookie.type)}</span></div>
                <div className="flex justify-between"><span style={{ color: BRAND.textMute }}>提供方</span><span style={{ color: BRAND.text }}>{drawerCookie.provider}</span></div>
                <div className="flex justify-between"><span style={{ color: BRAND.textMute }}>持续时间</span><span className="font-mono" style={{ color: BRAND.text }}>{drawerCookie.duration}</span></div>
                <div className="flex justify-between"><span style={{ color: BRAND.textMute }}>域名</span><span className="font-mono" style={{ color: BRAND.text }}>{drawerCookie.domain}</span></div>
                <div className="flex justify-between"><span style={{ color: BRAND.textMute }}>必需</span><span style={{ color: drawerCookie.required ? BRAND.danger : BRAND.text }}>{drawerCookie.required ? '是' : '否'}</span></div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* 数据项详情 Drawer */}
      {drawer.open && drawer.type === 'data-item' && drawerDataItem && (
        <>
          <div className="fixed inset-0 z-40" style={{ backgroundColor: BRAND.overlay }} onClick={() => setDrawer({ open: false, type: null, payload: null })} />
          <div className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-2xl overflow-y-auto scrollbar-thin drawer-anim" style={{ backgroundColor: BRAND.bg, borderLeft: `1px solid ${BRAND.border}` }}>
            <div className="sticky top-0 p-4 flex items-center justify-between" style={{ backgroundColor: BRAND.bg, borderBottom: `1px solid ${BRAND.border}` }}>
              <div className="text-base font-semibold flex items-center gap-2"><Database size={16} style={{ color: sensitivityColor(drawerDataItem.sensitivity) }} />数据项详情</div>
              <button onClick={() => setDrawer({ open: false, type: null, payload: null })} className="p-1"><X size={18} style={{ color: BRAND.textMute }} /></button>
            </div>
            <div className="p-6">
              <h2 className="text-xl font-bold mb-2" style={{ color: BRAND.text }}>{drawerDataItem.name}</h2>
              <p className="text-sm mb-4" style={{ color: BRAND.textSub }}>{drawerDataItem.description}</p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.bgCard, border: `1px solid ${BRAND.border}` }}>
                  <div className="text-[10px]" style={{ color: BRAND.textMute }}>分类</div>
                  <div className="mt-1" style={{ color: BRAND.text }}>{categoryLabel(drawerDataItem.category)}</div>
                </div>
                <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.bgCard, border: `1px solid ${BRAND.border}` }}>
                  <div className="text-[10px]" style={{ color: BRAND.textMute }}>敏感度</div>
                  <div className="mt-1" style={{ color: sensitivityColor(drawerDataItem.sensitivity) }}>{sensitivityLabel(drawerDataItem.sensitivity)}</div>
                </div>
                <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.bgCard, border: `1px solid ${BRAND.border}` }}>
                  <div className="text-[10px]" style={{ color: BRAND.textMute }}>法律基础</div>
                  <div className="mt-1 text-xs" style={{ color: BRAND.text }}>{drawerDataItem.legalBasis}</div>
                </div>
                <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.bgCard, border: `1px solid ${BRAND.border}` }}>
                  <div className="text-[10px]" style={{ color: BRAND.textMute }}>加密方式</div>
                  <div className="mt-1 font-mono" style={{ color: BRAND.text }}>{drawerDataItem.encryption.toUpperCase()}</div>
                </div>
                <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.bgCard, border: `1px solid ${BRAND.border}` }}>
                  <div className="text-[10px]" style={{ color: BRAND.textMute }}>保留期</div>
                  <div className="mt-1" style={{ color: BRAND.text }}>{drawerDataItem.retention} 天</div>
                </div>
                <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.bgCard, border: `1px solid ${BRAND.border}` }}>
                  <div className="text-[10px]" style={{ color: BRAND.textMute }}>访问次数</div>
                  <div className="mt-1 font-mono" style={{ color: BRAND.text }}>{drawerDataItem.accessCount}</div>
                </div>
              </div>
              <div className="mt-3 p-3 rounded-lg" style={{ backgroundColor: BRAND.bgCard, border: `1px solid ${BRAND.border}` }}>
                <div className="text-[10px] mb-1" style={{ color: BRAND.textMute }}>采集时间</div>
                <div className="text-sm font-mono" style={{ color: BRAND.text }}>{drawerDataItem.collectedAt}</div>
                <div className="text-[10px] mb-1 mt-2" style={{ color: BRAND.textMute }}>最近访问</div>
                <div className="text-sm font-mono" style={{ color: BRAND.text }}>{drawerDataItem.lastAccessedAt}</div>
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
