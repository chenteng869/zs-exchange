'use client';

/**
 * PortalSupport - 客户支持中心（2026-07-19 Q05 P3.21）
 *
 * 页面定位：
 * - 中萨数字科技交易所 7×24 客户支持中心
 * - 工单中心 / FAQ 知识库 / 智能客服 / 联系渠道 / 服务状态 / 反馈建议
 * - 与 P3.20 KYC 形成"认证-服务"双向闭环，承接 KYC 流程中的用户疑问
 * - 强化"服务时效透明、问题可追溯"理念
 *
 * L4 工业级设计标准：
 * - 暗色 v6 纯黑 #000000 + 卡片 #141414 + ZSDEX 绿 primary #14B881
 * - 10 大区块：Hero / 实时 KPI / 快速入口 / 工单中心 / FAQ 知识库 / 智能客服 / 联系渠道 / 服务状态 / 反馈建议 / 帮助 / 底部 CTA
 * - 9+ 交互：Tab 切换 / 工单搜索 / 状态过滤 / 优先级排序 / FAQ 搜索 / 智能对话模拟 / 评分 / 抽屉详情 / 快捷键
 * - 5+ Drawer：工单详情 / FAQ 详情 / 智能客服 / 服务状态 / 帮助快捷键
 * - 4+ 实时数据：在线客服 / 待响应工单 / 平均响应时长 / 满意度
 * - 4+ 动画：Stagger / CountUp / Hover / Pulse / 打字机
 *
 * 合规要点（Q05 硬约束）：
 * - 不接真实客服系统，所有工单 / FAQ / 智能对话使用 mock 占位
 * - 状态徽章统一使用 STATUS 枚举
 * - 不修改旧官网 / 旧 H5 / disabled pages / brand.ts / SPEC.md
 * - 服务时效数据为内部估算口径，不构成服务质量承诺
 * - 严禁"100% 解决"、"秒回"等绝对化承诺
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
  Headphones,
  HelpCircle,
  MessageCircle,
  MessageSquare,
  Mail,
  Phone,
  PhoneCall,
  Send,
  Inbox,
  Archive,
  Star,
  Clock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  RefreshCw,
  RotateCw,
  Calendar,
  Hash,
  User,
  Users,
  Shield,
  ShieldCheck,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  KeyRound,
  Wallet,
  Coins,
  CreditCard,
  TrendingUp,
  TrendingDown,
  Activity,
  Bell,
  BellOff,
  ThumbsUp,
  ThumbsDown,
  Heart,
  Sparkles,
  Zap,
  Flame,
  Award,
  Crown,
  Trophy,
  Target,
  Crosshair,
  Briefcase,
  Building2,
  Globe2,
  MapPin,
  Languages,
  Mic,
  MicOff,
  Video,
  VideoOff,
  Paperclip,
  Smile,
  Frown,
  Meh,
  Bot,
  UserCheck,
  UserPlus,
  UserMinus,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowRight,
  ArrowLeft,
  Plus,
  Minus,
  Copy,
  Download,
  Upload,
  ExternalLink,
  FileText,
  BookOpen,
  Bookmark,
  Tag,
  Tags,
  Flag,
  Compass,
  Map,
  Layers,
  Network,
  Database,
  Server,
  Cloud,
  Cpu,
  Settings,
  Sliders,
  Keyboard,
  Lightbulb,
  Info,
  AlertOctagon,
  PlayCircle,
  PauseCircle,
  Volume2,
  VolumeX,
  Accessibility,
  LifeBuoy,
} from 'lucide-react';
import { BRAND, STATUS } from './brand';

// ============== 类型 ==============

type Tab = 'overview' | 'tickets' | 'faq' | 'chat' | 'contact' | 'status' | 'feedback' | 'help';
type TicketStatus = 'open' | 'pending' | 'in_progress' | 'resolved' | 'closed' | 'reopened';
type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';
type TicketCategory =
  | 'account'
  | 'kyc'
  | 'trading'
  | 'deposit'
  | 'withdraw'
  | 'wallet'
  | 'security'
  | 'api'
  | 'staking'
  | 'other';
type ServiceStatus = 'operational' | 'degraded' | 'partial' | 'maintenance' | 'incident';
type FaqCategory = 'getting-started' | 'account' | 'trading' | 'wallet' | 'security' | 'fees' | 'api' | 'staking' | 'mobile' | 'regulation';
type DrawerType = 'ticket' | 'faq' | 'chat' | 'status' | 'feedback' | 'help' | 'contact' | null;

interface Ticket {
  id: string;
  subject: string;
  category: TicketCategory;
  status: TicketStatus;
  priority: TicketPriority;
  createdAt: string;
  updatedAt: string;
  messages: number;
  attachments: number;
  channel: 'web' | 'app' | 'email' | 'phone' | 'api';
  assignee: string;
  sla: { target: number; elapsed: number; unit: 'min' | 'hour' | 'day' };
  satisfaction?: { rating: 1 | 2 | 3 | 4 | 5; comment?: string };
  description: string;
  tags: string[];
}

interface FaqItem {
  id: string;
  question: string;
  answer: string;
  category: FaqCategory;
  helpful: number;
  unhelpful: number;
  views: number;
  updatedAt: string;
  relatedIds: string[];
  tags: string[];
  steps?: string[];
  isHot?: boolean;
  isNew?: boolean;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'bot' | 'agent';
  content: string;
  timestamp: string;
  status?: 'sending' | 'sent' | 'received' | 'read';
  suggestions?: string[];
  attachment?: { name: string; size: number };
}

interface ContactChannel {
  id: string;
  name: string;
  type: 'email' | 'phone' | 'chat' | 'social' | 'community';
  value: string;
  availability: string;
  responseTime: string;
  languages: string[];
  isHot?: boolean;
  description: string;
}

interface ServiceComponent {
  id: string;
  name: string;
  description: string;
  status: ServiceStatus;
  uptime: number;
  latency: number;
  region: string[];
  lastIncident?: { date: string; duration: string; summary: string };
  history: { date: string; status: ServiceStatus; duration?: number }[];
}

interface FeedbackItem {
  id: string;
  type: 'praise' | 'suggestion' | 'complaint' | 'bug';
  content: string;
  rating: number;
  submittedAt: string;
  status: 'received' | 'reviewing' | 'addressed' | 'closed';
  module: string;
  response?: string;
}

interface KpiSnapshot {
  onlineAgents: number;
  pendingTickets: number;
  avgResponseTime: number;
  satisfaction: number;
  todayResolved: number;
  activeChats: number;
  faqHits: number;
  selfServiceRate: number;
}

interface DrawerState {
  open: boolean;
  type: DrawerType;
  payload: string | null;
}

// ============== Mock 数据 ==============

const TICKETS: Ticket[] = [
  {
    id: 'TKT-2026-07-19-001',
    subject: 'KYC 高级认证审核进度咨询',
    category: 'kyc',
    status: 'in_progress',
    priority: 'high',
    createdAt: '2026-07-19 09:42',
    updatedAt: '2026-07-19 10:15',
    messages: 5,
    attachments: 2,
    channel: 'web',
    assignee: '李工',
    sla: { target: 240, elapsed: 33, unit: 'min' },
    description: '7月18日提交的高级认证（含地址证明）已超过24小时未审核，请帮忙查询审核进度。',
    tags: ['KYC', '高级认证', '审核进度'],
  },
  {
    id: 'TKT-2026-07-19-002',
    subject: '提现地址白名单添加失败',
    category: 'withdraw',
    status: 'pending',
    priority: 'urgent',
    createdAt: '2026-07-19 08:20',
    updatedAt: '2026-07-19 09:05',
    messages: 3,
    attachments: 1,
    channel: 'app',
    assignee: '王工',
    sla: { target: 60, elapsed: 115, unit: 'min' },
    description: '添加 USDT-TRC20 提现地址时，提示"地址格式校验失败"，但地址在区块浏览器可正常显示。',
    tags: ['提现', '白名单', 'USDT'],
  },
  {
    id: 'TKT-2026-07-19-003',
    subject: '现货交易手续费返还规则咨询',
    category: 'trading',
    status: 'open',
    priority: 'medium',
    createdAt: '2026-07-19 07:50',
    updatedAt: '2026-07-19 07:50',
    messages: 1,
    attachments: 0,
    channel: 'web',
    assignee: '未分配',
    sla: { target: 480, elapsed: 130, unit: 'min' },
    description: '我是 VIP3 用户，想了解持币量折扣 + 30 日交易量返还是否可以叠加使用？',
    tags: ['手续费', 'VIP', '返还'],
  },
  {
    id: 'TKT-2026-07-18-018',
    subject: 'API Key 权限范围咨询',
    category: 'api',
    status: 'resolved',
    priority: 'medium',
    createdAt: '2026-07-18 22:14',
    updatedAt: '2026-07-19 06:30',
    messages: 8,
    attachments: 0,
    channel: 'email',
    assignee: '陈工',
    sla: { target: 720, elapsed: 496, unit: 'min' },
    satisfaction: { rating: 5, comment: '陈工解释非常清晰，问题解决很快。' },
    description: '想了解 API Key 启用提现权限的最低认证等级要求，以及 IP 白名单配置。',
    tags: ['API', '权限', '提现'],
  },
  {
    id: 'TKT-2026-07-18-014',
    subject: '质押资产收益发放延迟',
    category: 'staking',
    status: 'resolved',
    priority: 'high',
    createdAt: '2026-07-18 14:20',
    updatedAt: '2026-07-18 18:45',
    messages: 6,
    attachments: 0,
    channel: 'web',
    assignee: '赵工',
    sla: { target: 240, elapsed: 188, unit: 'min' },
    satisfaction: { rating: 4, comment: '已补偿手续费，影响不大。' },
    description: '7月18日 8:00 应发放的 ETH 质押收益未到账，账户地址 0x...7421。',
    tags: ['质押', 'ETH', '收益发放'],
  },
  {
    id: 'TKT-2026-07-17-022',
    subject: '手机端登录二次验证失败',
    category: 'account',
    status: 'closed',
    priority: 'high',
    createdAt: '2026-07-17 19:10',
    updatedAt: '2026-07-17 20:25',
    messages: 4,
    attachments: 0,
    channel: 'app',
    assignee: '林工',
    sla: { target: 60, elapsed: 42, unit: 'min' },
    satisfaction: { rating: 5 },
    description: '更换手机后 Google Authenticator 验证码一直显示错误。',
    tags: ['登录', '2FA', 'Authenticator'],
  },
  {
    id: 'TKT-2026-07-17-019',
    subject: '法币入金未到账',
    category: 'deposit',
    status: 'reopened',
    priority: 'urgent',
    createdAt: '2026-07-17 11:00',
    updatedAt: '2026-07-19 08:30',
    messages: 12,
    attachments: 3,
    channel: 'phone',
    assignee: '王工',
    sla: { target: 120, elapsed: 2880, unit: 'min' },
    description: '7月16日通过银行转账 50000 CNY 至指定账户，至 7月19日仍未到账，请协助排查。',
    tags: ['法币', '入金', '未到账'],
  },
  {
    id: 'TKT-2026-07-16-008',
    subject: '杠杆交易强平价格异常',
    category: 'trading',
    status: 'closed',
    priority: 'medium',
    createdAt: '2026-07-16 10:30',
    updatedAt: '2026-07-16 15:20',
    messages: 7,
    attachments: 1,
    channel: 'web',
    assignee: '陈工',
    sla: { target: 480, elapsed: 290, unit: 'min' },
    satisfaction: { rating: 3, comment: '解释清楚了强平机制，但希望强平前能多提醒。' },
    description: '3 倍杠杆做多 BTC，强平价格显示低于系统最低强平价，是否计算有误？',
    tags: ['杠杆', '强平', 'BTC'],
  },
];

const FAQS: FaqItem[] = [
  {
    id: 'faq-001',
    question: '如何完成 KYC 实名认证？需要准备哪些资料？',
    answer:
      '请在【个人中心 → KYC 实名认证】按以下步骤操作：① 选择认证等级（基础 / 高级 / 专业）；② 准备身份证正反面照片、本人手持身份证照片；③ 高级认证需额外提供地址证明（水电费账单或银行账单）。审核时长一般为 1-4 小时，高峰期可能延长至 24 小时。',
    category: 'account',
    helpful: 1842,
    unhelpful: 38,
    views: 12480,
    updatedAt: '2026-07-15',
    relatedIds: ['faq-002', 'faq-003'],
    tags: ['KYC', '认证', '身份证'],
    steps: [
      '进入【个人中心 → KYC 实名认证】',
      '选择认证等级（基础 / 高级 / 专业）',
      '上传身份证正反面 + 手持照片',
      '高级认证补传地址证明',
      '提交后等待 1-4 小时审核',
    ],
    isHot: true,
  },
  {
    id: 'faq-002',
    question: '忘记登录密码怎么办？',
    answer:
      '如忘记登录密码，可通过以下方式找回：① 已绑定手机的，可使用【短信验证】重置；② 已开启 2FA 的，需通过【Google Authenticator】验证后重置；③ 以上均不可用时，需提交【人工申诉工单】并提供身份证明材料。',
    category: 'account',
    helpful: 982,
    unhelpful: 24,
    views: 6840,
    updatedAt: '2026-06-20',
    relatedIds: ['faq-001', 'faq-006'],
    tags: ['密码', '找回', '申诉'],
  },
  {
    id: 'faq-003',
    question: '如何开启 Google Authenticator 二次验证（2FA）？',
    answer:
      '建议所有用户开启 2FA。路径：【安全中心 → 二次验证 → Google Authenticator】。开启后登录、提现、API Key 创建等关键操作均需输入 6 位动态验证码。请务必将 16 位密钥备份至安全位置。',
    category: 'security',
    helpful: 1240,
    unhelpful: 18,
    views: 8240,
    updatedAt: '2026-07-10',
    relatedIds: ['faq-006'],
    tags: ['2FA', '安全', 'Authenticator'],
    steps: [
      '下载并安装 Google Authenticator',
      '进入【安全中心 → 二次验证】',
      '扫描二维码或手动输入 16 位密钥',
      '输入 6 位动态验证码完成绑定',
      '将 16 位密钥备份至安全位置',
    ],
    isHot: true,
  },
  {
    id: 'faq-004',
    question: '现货交易的手续费是多少？VIP 等级如何划分？',
    answer:
      '现货基础手续费为挂单 0.10% / 吃单 0.20%。VIP 等级按近 30 日交易量 + 持币量综合评估，VIP1-VIP5 享受 5%-25% 阶梯折扣。具体等级权益请参考【费率中心】。',
    category: 'fees',
    helpful: 1684,
    unhelpful: 52,
    views: 14820,
    updatedAt: '2026-07-01',
    relatedIds: ['faq-005'],
    tags: ['手续费', 'VIP', '费率'],
  },
  {
    id: 'faq-005',
    question: '提现到账时间一般是多久？',
    answer:
      '提现到账时间因币种和链上拥堵情况而异：BTC 一般 10-60 分钟；ETH 一般 5-30 分钟；USDT-TRC20 一般 1-5 分钟；法币提现一般 1-3 个工作日。所有提现均需通过风控审核，大额提现可能延长。',
    category: 'wallet',
    helpful: 2104,
    unhelpful: 86,
    views: 18920,
    updatedAt: '2026-07-08',
    relatedIds: ['faq-007', 'faq-008'],
    tags: ['提现', '到账', '时间'],
    isHot: true,
  },
  {
    id: 'faq-006',
    question: '账户被锁定如何解锁？',
    answer:
      '账户被锁定通常因多次密码错误、异常登录或风控拦截。请提交【人工申诉工单】并提供：① 注册邮箱；② 最近一次成功登录时间；③ 身份证正反面。核实后 1-4 小时解锁。',
    category: 'account',
    helpful: 624,
    unhelpful: 12,
    views: 4820,
    updatedAt: '2026-06-15',
    relatedIds: ['faq-002', 'faq-003'],
    tags: ['锁定', '解锁', '申诉'],
  },
  {
    id: 'faq-007',
    question: '如何添加 / 修改提现地址白名单？',
    answer:
      '路径：【钱包 → 提现 → 地址管理】。需开启 2FA 并完成高级 KYC 认证。每日最多新增 5 个白名单地址，添加后 24 小时生效（安全冷却期）。',
    category: 'wallet',
    helpful: 824,
    unhelpful: 22,
    views: 5240,
    updatedAt: '2026-07-05',
    relatedIds: ['faq-005'],
    tags: ['白名单', '提现地址', '安全'],
  },
  {
    id: 'faq-008',
    question: 'USDT-TRC20 与 USDT-ERC20 有什么区别？',
    answer:
      'USDT-TRC20 基于波场（TRON）网络，手续费低（约 1 USDT）但确认时间较短；USDT-ERC20 基于以太坊（ETH）网络，安全性高但 Gas 费较高（约 5-20 USDT）。请根据接收方要求选择对应网络，转错网络可能导致资产永久丢失。',
    category: 'wallet',
    helpful: 1428,
    unhelpful: 64,
    views: 11240,
    updatedAt: '2026-07-12',
    relatedIds: ['faq-005', 'faq-007'],
    tags: ['USDT', 'TRC20', 'ERC20'],
  },
  {
    id: 'faq-009',
    question: '如何创建 API Key？权限如何划分？',
    answer:
      '路径：【API 开放平台 → 创建 API Key】。需开启 2FA。可选权限：只读、现货交易、合约交易、提现（需高级 KYC）。建议为不同应用创建独立 Key，并配置 IP 白名单。',
    category: 'api',
    helpful: 482,
    unhelpful: 8,
    views: 3420,
    updatedAt: '2026-07-10',
    relatedIds: ['faq-003'],
    tags: ['API', 'Key', '权限'],
    isNew: true,
  },
  {
    id: 'faq-010',
    question: '币币交易与法币交易有什么区别？',
    answer:
      '币币交易（B2B）：使用 USDT / BTC / ETH 等数字资产作为计价单位交易其他数字资产。法币交易（B2F）：使用 CNY / USD 等法币直接买卖数字资产，通常需要完成高级 KYC 认证。',
    category: 'trading',
    helpful: 386,
    unhelpful: 14,
    views: 2840,
    updatedAt: '2026-06-28',
    relatedIds: ['faq-004'],
    tags: ['币币', '法币', '交易'],
  },
  {
    id: 'faq-011',
    question: '如何参与新币申购（Launch）？',
    answer:
      '路径：【Launch 申购中心】。流程：① KYC 高级认证；② 通过申购额度计算确定可申购额度；③ 申购期内下单；④ 结束后根据申购比例分配；⑤ 到达账日统一发放至现货账户。请注意：申购不构成投资建议。',
    category: 'trading',
    helpful: 928,
    unhelpful: 32,
    views: 6420,
    updatedAt: '2026-07-14',
    relatedIds: [],
    tags: ['Launch', '申购', '新币'],
    isNew: true,
  },
  {
    id: 'faq-012',
    question: '数字资产相关法律法规与平台合规性如何？',
    answer:
      '平台严格遵守业务所在司法管辖区的法律法规，定期接受第三方合规审计。具体合规框架与监管动态请参考【合规中心】与【风险披露】页面。平台仅在合法合规框架内提供数字资产交易服务。',
    category: 'regulation',
    helpful: 524,
    unhelpful: 18,
    views: 4820,
    updatedAt: '2026-07-01',
    relatedIds: [],
    tags: ['合规', '法律', '监管'],
  },
];

const CHAT_HISTORY: ChatMessage[] = [
  {
    id: 'm-001',
    role: 'bot',
    content: '您好，我是 ZSDEX 智能客服小萨。请问需要什么帮助？',
    timestamp: '10:15:02',
  },
  {
    id: 'm-002',
    role: 'user',
    content: '我的 KYC 高级认证已经 24 小时了还没通过，怎么办？',
    timestamp: '10:15:18',
  },
  {
    id: 'm-003',
    role: 'bot',
    content:
      '已为您查询：高级认证审核一般需要 1-4 小时，资料齐全的情况下 24 小时内会有结果。请问您提交的资料是否包含：① 身份证正反面 ② 手持身份证照片 ③ 地址证明（3 个月内）？',
    timestamp: '10:15:25',
    suggestions: ['资料齐全', '缺地址证明', '缺手持照片', '查看 KYC 状态'],
  },
  {
    id: 'm-004',
    role: 'user',
    content: '资料齐全',
    timestamp: '10:15:42',
  },
  {
    id: 'm-005',
    role: 'bot',
    content:
      '好的，已为您升级到 KYC 审核专员。预计 30 分钟内回复。请问您方便留下工单号或注册邮箱吗？',
    timestamp: '10:15:50',
    suggestions: ['查看我的工单', '转人工客服', '稍后再说'],
  },
  {
    id: 'm-006',
    role: 'user',
    content: '查看我的工单',
    timestamp: '10:16:05',
  },
  {
    id: 'm-007',
    role: 'bot',
    content: '正在为您打开工单 TKT-2026-07-19-001 ...',
    timestamp: '10:16:08',
  },
];

const CONTACTS: ContactChannel[] = [
  {
    id: 'c-email',
    name: '邮件支持',
    type: 'email',
    value: 'support@zsdex.example',
    availability: '7×24 受理',
    responseTime: '平均 2-4 小时',
    languages: ['中文', 'English'],
    description: '适合非紧急问题、复杂技术咨询、需要书面留档的场景。',
    isHot: true,
  },
  {
    id: 'c-chat',
    name: '在线客服',
    type: 'chat',
    value: '工作日 9:00-22:00',
    availability: '工作日 9:00-22:00',
    responseTime: '平均 < 1 分钟',
    languages: ['中文', 'English'],
    description: '适合一般账户问题、操作指引、交易咨询。即时响应。',
    isHot: true,
  },
  {
    id: 'c-phone',
    name: 'VIP 专属电话',
    type: 'phone',
    value: '400-888-****',
    availability: '工作日 9:00-21:00',
    responseTime: '直连 VIP 客户经理',
    languages: ['中文', 'English'],
    description: '仅限 VIP3 及以上用户。适合紧急大额问题、机构客户。',
  },
  {
    id: 'c-telegram',
    name: 'Telegram 社群',
    type: 'social',
    value: '@zsdex_official',
    availability: '7×24 公告',
    responseTime: '公告实时 / 提问 4-8 小时',
    languages: ['中文', 'English', '한국어'],
    description: '产品公告、活动通知、用户交流。客服为辅助角色。',
  },
  {
    id: 'c-discord',
    name: 'Discord 社区',
    type: 'community',
    value: 'discord.gg/zsdex',
    availability: '7×24 社区活跃',
    responseTime: '社区互助 / 官方每日值班',
    languages: ['English', '中文'],
    description: '海外用户主要交流平台。技术讨论、产品建议。',
  },
  {
    id: 'c-wechat',
    name: '微信公众号',
    type: 'social',
    value: 'ZSDEX 数字资产',
    availability: '工作日更新',
    responseTime: '推送通知',
    languages: ['中文'],
    description: '平台动态、政策解读、市场分析。客服不直接受理。',
  },
  {
    id: 'c-twitter',
    name: 'X (Twitter)',
    type: 'social',
    value: '@zsdex',
    availability: '7×24 公告',
    responseTime: '公告实时',
    languages: ['English'],
    description: '紧急公告、安全事件第一时间推送。',
  },
  {
    id: 'c-formal',
    name: '正式函件',
    type: 'email',
    value: 'legal@zsdex.example',
    availability: '工作日 9:00-18:00',
    responseTime: '5 个工作日内',
    languages: ['中文', 'English'],
    description: '法律函件、合规投诉、合作建议。需提供完整主体信息。',
  },
];

const SERVICE_COMPONENTS: ServiceComponent[] = [
  {
    id: 'svc-trade',
    name: '现货交易系统',
    description: '币币撮合引擎、订单簿、K线数据',
    status: 'operational',
    uptime: 99.98,
    latency: 12,
    region: ['全球'],
    lastIncident: { date: '2026-05-12', duration: '23 分钟', summary: 'ETH/USDT 撮合延迟告警，已自动恢复' },
    history: [
      { date: '2026-07-19', status: 'operational' },
      { date: '2026-07-18', status: 'operational' },
      { date: '2026-07-17', status: 'operational' },
      { date: '2026-05-12', status: 'degraded', duration: 23 },
    ],
  },
  {
    id: 'svc-wallet',
    name: '钱包系统',
    description: '充提币、热冷钱包、地址管理',
    status: 'operational',
    uptime: 99.99,
    latency: 8,
    region: ['全球'],
    history: [
      { date: '2026-07-19', status: 'operational' },
      { date: '2026-07-18', status: 'operational' },
      { date: '2026-07-17', status: 'operational' },
    ],
  },
  {
    id: 'svc-kyc',
    name: 'KYC 审核系统',
    description: '实名认证、企业 KYB、人工审核',
    status: 'degraded',
    uptime: 98.42,
    latency: 420,
    region: ['全球'],
    lastIncident: { date: '2026-07-19', duration: '60+ 分钟', summary: '高级认证审核延迟，已增派审核员' },
    history: [
      { date: '2026-07-19', status: 'degraded' },
      { date: '2026-07-18', status: 'operational' },
      { date: '2026-07-17', status: 'operational' },
    ],
  },
  {
    id: 'svc-api',
    name: 'API 开放平台',
    description: 'REST API / WebSocket / 行情推送',
    status: 'operational',
    uptime: 99.95,
    latency: 18,
    region: ['全球'],
    history: [
      { date: '2026-07-19', status: 'operational' },
      { date: '2026-07-18', status: 'operational' },
      { date: '2026-07-17', status: 'operational' },
    ],
  },
  {
    id: 'svc-fiat',
    name: '法币出入金',
    description: 'CNY 银行转账、第三方支付',
    status: 'operational',
    uptime: 99.85,
    latency: 1240,
    region: ['中国大陆', '香港'],
    history: [
      { date: '2026-07-19', status: 'operational' },
      { date: '2026-07-18', status: 'operational' },
      { date: '2026-07-17', status: 'operational' },
    ],
  },
  {
    id: 'svc-staking',
    name: '质押服务',
    description: 'ETH / SOL / CFX 等质押收益',
    status: 'maintenance',
    uptime: 99.72,
    latency: 320,
    region: ['全球'],
    lastIncident: { date: '2026-07-19', duration: '90 分钟计划内', summary: 'CFX 质押 V2 升级维护' },
    history: [
      { date: '2026-07-19', status: 'maintenance' },
      { date: '2026-07-18', status: 'operational' },
      { date: '2026-07-17', status: 'operational' },
    ],
  },
  {
    id: 'svc-mobile',
    name: '移动端 App',
    description: 'iOS / Android 客户端推送与登录',
    status: 'operational',
    uptime: 99.92,
    latency: 65,
    region: ['全球'],
    history: [
      { date: '2026-07-19', status: 'operational' },
      { date: '2026-07-18', status: 'operational' },
      { date: '2026-07-17', status: 'operational' },
    ],
  },
  {
    id: 'svc-web',
    name: 'Web 官网与 Portal',
    description: '官网、文档站、FrontPortal',
    status: 'operational',
    uptime: 99.97,
    latency: 28,
    region: ['全球'],
    history: [
      { date: '2026-07-19', status: 'operational' },
      { date: '2026-07-18', status: 'operational' },
      { date: '2026-07-17', status: 'operational' },
    ],
  },
];

const FEEDBACKS: FeedbackItem[] = [
  {
    id: 'fb-001',
    type: 'praise',
    content: 'VIP 客户经理王经理服务非常专业，凌晨 3 点还在处理我的大额提现问题，非常感谢！',
    rating: 5,
    submittedAt: '2026-07-18 23:42',
    status: 'addressed',
    module: 'VIP 服务',
    response: '感谢您的认可，已为您申请 VIP 服务年度奖励。',
  },
  {
    id: 'fb-002',
    type: 'suggestion',
    content: '希望增加 TradingView 图表的更多技术指标支持，如 Ichimoku 一目均衡表。',
    rating: 4,
    submittedAt: '2026-07-18 14:20',
    status: 'reviewing',
    module: '现货交易',
  },
  {
    id: 'fb-003',
    type: 'complaint',
    content: '法币出金审核太慢，已经等待 36 小时，客服电话一直占线。',
    rating: 2,
    submittedAt: '2026-07-17 09:10',
    status: 'addressed',
    module: '法币出入金',
    response: '已紧急加派人手，对您的具体订单已做优先处理并补偿手续费。',
  },
  {
    id: 'fb-004',
    type: 'bug',
    content: '移动端 iOS 17.5 暗黑模式下，部分文字颜色与背景几乎无法区分。',
    rating: 3,
    submittedAt: '2026-07-16 18:30',
    status: 'addressed',
    module: '移动端 App',
    response: '已在 v4.2.1 修复，感谢您的反馈。',
  },
  {
    id: 'fb-005',
    type: 'suggestion',
    content: '建议增加"语音通话"工单类型，方便不擅长文字输入的老年用户。',
    rating: 4,
    submittedAt: '2026-07-15 11:00',
    status: 'reviewing',
    module: '工单系统',
  },
];

// ============== 工具函数 ==============

const fmtNumber = (n: number): string => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
};

const statusKey = (s: TicketStatus): StatusKey => {
  switch (s) {
    case 'open': return 'PRIVATE';
    case 'pending': return 'SOON';
    case 'in_progress': return 'BETA';
    case 'resolved': return 'OPEN';
    case 'closed': return 'COMING';
    case 'reopened': return 'MAINTENANCE';
  }
};

const serviceStatusKey = (s: ServiceStatus): StatusKey => {
  switch (s) {
    case 'operational': return 'OPEN';
    case 'degraded': return 'MAINTENANCE';
    case 'partial': return 'BETA';
    case 'maintenance': return 'BETA';
    case 'incident': return 'MAINTENANCE';
  }
};

const priorityColor = (p: TicketPriority): string => {
  switch (p) {
    case 'urgent': return BRAND.danger;
    case 'high': return BRAND.warning;
    case 'medium': return BRAND.info;
    case 'low': return BRAND.textSub;
  }
};

const categoryLabel = (c: TicketCategory): string => {
  const map: Record<TicketCategory, string> = {
    account: '账户',
    kyc: 'KYC',
    trading: '交易',
    deposit: '入金',
    withdraw: '提现',
    wallet: '钱包',
    security: '安全',
    api: 'API',
    staking: '质押',
    other: '其他',
  };
  return map[c];
};

const faqCategoryLabel = (c: FaqCategory): string => {
  const map: Record<FaqCategory, string> = {
    'getting-started': '新手指南',
    account: '账户',
    trading: '交易',
    wallet: '钱包',
    security: '安全',
    fees: '费率',
    api: 'API',
    staking: '质押',
    mobile: '移动端',
    regulation: '合规',
  };
  return map[c];
};

// ============== 主组件 ==============

export function PortalSupport() {
  const [tab, setTab] = useState<Tab>('overview');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<TicketStatus | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<TicketPriority | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState<TicketCategory | 'all'>('all');
  const [sortBy, setSortBy] = useState<'updated' | 'priority' | 'sla'>('updated');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [faqCategory, setFaqCategory] = useState<FaqCategory | 'all'>('all');
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(CHAT_HISTORY);
  const [chatTyping, setChatTyping] = useState(false);
  const [feedbackType, setFeedbackType] = useState<FeedbackItem['type']>('suggestion');
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [drawer, setDrawer] = useState<DrawerState>({ open: false, type: null, payload: null });
  const [helpOpen, setHelpOpen] = useState(false);
  const [kpi, setKpi] = useState<KpiSnapshot>({
    onlineAgents: 18,
    pendingTickets: 142,
    avgResponseTime: 4,
    satisfaction: 96,
    todayResolved: 286,
    activeChats: 24,
    faqHits: 18420,
    selfServiceRate: 72,
  });
  const searchRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // 实时数据波动
  useEffect(() => {
    const id = setInterval(() => {
      setKpi((prev) => ({
        ...prev,
        onlineAgents: Math.max(8, prev.onlineAgents + Math.floor(Math.random() * 5) - 2),
        pendingTickets: Math.max(50, prev.pendingTickets + Math.floor(Math.random() * 9) - 4),
        activeChats: Math.max(5, prev.activeChats + Math.floor(Math.random() * 5) - 2),
        avgResponseTime: Math.max(1, Math.min(15, prev.avgResponseTime + (Math.random() - 0.5))),
        satisfaction: Math.max(90, Math.min(99, prev.satisfaction + (Math.random() - 0.5))),
        todayResolved: prev.todayResolved + (Math.random() > 0.6 ? 1 : 0),
        faqHits: prev.faqHits + Math.floor(Math.random() * 8),
      }));
    }, 3500);
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
        if (drawer.open) setDrawer({ open: false, type: null, payload: null });
        else if (helpOpen) setHelpOpen(false);
        else if (search) setSearch('');
      } else if (e.key === '?') {
        setHelpOpen((v) => !v);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [drawer.open, helpOpen, search]);

  // 聊天滚动
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, chatTyping]);

  // 工单筛选
  const filteredTickets = useMemo(() => {
    let arr = TICKETS.slice();
    if (search) {
      const q = search.toLowerCase();
      arr = arr.filter((t) => t.subject.toLowerCase().includes(q) || t.id.toLowerCase().includes(q) || t.tags.some((x) => x.toLowerCase().includes(q)));
    }
    if (statusFilter !== 'all') arr = arr.filter((t) => t.status === statusFilter);
    if (priorityFilter !== 'all') arr = arr.filter((t) => t.priority === priorityFilter);
    if (categoryFilter !== 'all') arr = arr.filter((t) => t.category === categoryFilter);
    arr.sort((a, b) => {
      let av: number; let bv: number;
      if (sortBy === 'updated') { av = new Date(a.updatedAt).getTime(); bv = new Date(b.updatedAt).getTime(); }
      else if (sortBy === 'priority') { const order = { urgent: 4, high: 3, medium: 2, low: 1 }; av = order[a.priority]; bv = order[b.priority]; }
      else { av = a.sla.elapsed / a.sla.target; bv = b.sla.elapsed / b.sla.target; }
      return sortDir === 'asc' ? av - bv : bv - av;
    });
    return arr;
  }, [search, statusFilter, priorityFilter, categoryFilter, sortBy, sortDir]);

  // FAQ 筛选
  const filteredFaqs = useMemo(() => {
    let arr = FAQS.slice();
    if (search) {
      const q = search.toLowerCase();
      arr = arr.filter((f) => f.question.toLowerCase().includes(q) || f.answer.toLowerCase().includes(q) || f.tags.some((t) => t.toLowerCase().includes(q)));
    }
    if (faqCategory !== 'all') arr = arr.filter((f) => f.category === faqCategory);
    arr.sort((a, b) => b.helpful - a.helpful);
    return arr;
  }, [search, faqCategory]);

  // 反馈提交
  const submitFeedback = useCallback(() => {
    if (!feedbackText.trim()) return;
    setFeedbackText('');
    setHelpOpen(false);
    // mock 提交后置反馈
    setTimeout(() => {
      setHelpOpen(false);
    }, 100);
  }, [feedbackText]);

  // 发送聊天
  const sendChat = useCallback(() => {
    if (!chatInput.trim()) return;
    const userMsg: ChatMessage = {
      id: `m-${Date.now()}`,
      role: 'user',
      content: chatInput.trim(),
      timestamp: new Date().toLocaleTimeString('zh-CN', { hour12: false }),
      status: 'sent',
    };
    setChatMessages((m) => [...m, userMsg]);
    setChatInput('');
    setChatTyping(true);
    setTimeout(() => {
      const botMsg: ChatMessage = {
        id: `m-${Date.now() + 1}`,
        role: 'bot',
        content: '收到您的问题，正在为您查询相关资料...',
        timestamp: new Date().toLocaleTimeString('zh-CN', { hour12: false }),
        suggestions: ['继续', '转人工客服', '提交工单', '稍后再说'],
      };
      setChatMessages((m) => [...m, botMsg]);
      setChatTyping(false);
    }, 1400);
  }, [chatInput]);

  const openTicket = (id: string) => setDrawer({ open: true, type: 'ticket', payload: id });
  const openFaq = (id: string) => setDrawer({ open: true, type: 'faq', payload: id });
  const openService = (id: string) => setDrawer({ open: true, type: 'status', payload: id });
  const openChat = () => setDrawer({ open: true, type: 'chat', payload: null });
  const openContact = () => setDrawer({ open: true, type: 'contact', payload: null });
  const openFeedback = () => setDrawer({ open: true, type: 'feedback', payload: null });

  const drawerTicket = drawer.type === 'ticket' ? TICKETS.find((t) => t.id === drawer.payload) : null;
  const drawerFaq = drawer.type === 'faq' ? FAQS.find((f) => f.id === drawer.payload) : null;
  const drawerService = drawer.type === 'status' ? SERVICE_COMPONENTS.find((s) => s.id === drawer.payload) : null;

  // 计数
  const kpiCards = useMemo(() => [
    { label: '在线客服', value: kpi.onlineAgents, suffix: '人', icon: Headphones, color: BRAND.success },
    { label: '待响应工单', value: kpi.pendingTickets, suffix: '单', icon: Inbox, color: BRAND.warning },
    { label: '平均响应', value: kpi.avgResponseTime, suffix: '分钟', icon: Clock, color: BRAND.info, decimals: 1 },
    { label: '客户满意度', value: kpi.satisfaction, suffix: '%', icon: ThumbsUp, color: BRAND.primary },
    { label: '今日已解决', value: kpi.todayResolved, suffix: '单', icon: CheckCircle2, color: BRAND.success },
    { label: '进行中对话', value: kpi.activeChats, suffix: '人', icon: MessageCircle, color: BRAND.info },
    { label: 'FAQ 命中', value: kpi.faqHits, suffix: '次', icon: HelpCircle, color: BRAND.primary },
    { label: '自助率', value: kpi.selfServiceRate, suffix: '%', icon: Sparkles, color: BRAND.success },
  ], [kpi]);

  const tabOptions: { key: Tab; label: string; icon: React.ComponentType<{ size?: number; className?: string }> }[] = [
    { key: 'overview', label: '总览', icon: Activity },
    { key: 'tickets', label: '工单中心', icon: Inbox },
    { key: 'faq', label: 'FAQ 知识库', icon: BookOpen },
    { key: 'chat', label: '智能客服', icon: Bot },
    { key: 'contact', label: '联系渠道', icon: PhoneCall },
    { key: 'status', label: '服务状态', icon: Activity },
    { key: 'feedback', label: '反馈建议', icon: MessageSquare },
    { key: 'help', label: '帮助', icon: HelpCircle },
  ];

  const tabsByKey: Record<Tab, React.ReactNode> = {
    overview: null, tickets: null, faq: null, chat: null, contact: null, status: null, feedback: null, help: null,
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: BRAND.bg, color: BRAND.text }}>
      <style jsx global>{`
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
        @keyframes countUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes typing { 0%, 60%, 100% { opacity: 0.3; transform: translateY(0); } 30% { opacity: 1; transform: translateY(-3px); } }
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
        .typing-dot { animation: typing 1.2s ease-in-out infinite; }
        .typing-dot:nth-child(2) { animation-delay: 0.2s; }
        .typing-dot:nth-child(3) { animation-delay: 0.4s; }
        .count-up { animation: countUp 0.6s ease-out; }
        .kbd { display: inline-block; padding: 2px 6px; border-radius: 4px; font-family: monospace; font-size: 11px; background: ${BRAND.bgCard}; border: 1px solid ${BRAND.border}; color: ${BRAND.textSub}; }
        .drawer-anim { animation: fadeInUp 0.25s ease-out; }
        .scrollbar-thin::-webkit-scrollbar { width: 6px; height: 6px; }
        .scrollbar-thin::-webkit-scrollbar-track { background: ${BRAND.bg}; }
        .scrollbar-thin::-webkit-scrollbar-thumb { background: ${BRAND.border}; border-radius: 3px; }
        .scrollbar-thin::-webkit-scrollbar-thumb:hover { background: ${BRAND.borderStrong}; }
      `}</style>

      {/* Hero */}
      <section className="px-6 py-12 md:py-16" style={{ borderBottom: `1px solid ${BRAND.border}` }}>
        <div className="max-w-7xl mx-auto">
          <div className="flex items-start gap-3 mb-4">
            <div className="p-2 rounded-lg" style={{ backgroundColor: BRAND.primaryLt }}>
              <Headphones size={20} style={{ color: BRAND.primary }} />
            </div>
            <div>
              <div className="text-xs uppercase tracking-wider mb-1" style={{ color: BRAND.primary }}>SUPPORT CENTER · P3.21</div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2">客户支持中心</h1>
              <p className="text-sm md:text-base" style={{ color: BRAND.textSub }}>
                7×24 在线服务 · 工单透明可追溯 · 多语言多渠道支持
              </p>
            </div>
          </div>

          <div className="mt-8 flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: BRAND.textMute }} />
              <input
                ref={searchRef}
                type="text"
                placeholder="搜索工单 / FAQ / 问题关键词...  按 / 聚焦"
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
                onClick={openChat}
                className="px-5 py-3 rounded-lg text-sm font-medium flex items-center gap-2"
                style={{ backgroundColor: BRAND.primary, color: BRAND.onPrimary }}
              >
                <Bot size={16} />智能客服
              </button>
              <button
                onClick={() => setTab('tickets')}
                className="px-5 py-3 rounded-lg text-sm font-medium flex items-center gap-2"
                style={{ backgroundColor: BRAND.bgCard, color: BRAND.text, border: `1px solid ${BRAND.border}` }}
              >
                <Inbox size={16} />我的工单
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
                      {card.decimals ? card.value.toFixed(1) : fmtNumber(card.value)}
                    </span>
                    <span className="text-xs" style={{ color: BRAND.textSub }}>{card.suffix}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 快速入口 */}
      <section className="px-6 py-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
            {[
              { label: '提交工单', icon: Inbox, action: () => setTab('tickets'), color: BRAND.primary },
              { label: 'FAQ 知识库', icon: BookOpen, action: () => setTab('faq'), color: BRAND.info },
              { label: '智能客服', icon: Bot, action: openChat, color: BRAND.success },
              { label: '服务状态', icon: Activity, action: () => setTab('status'), color: BRAND.warning },
              { label: '联系渠道', icon: PhoneCall, action: () => setTab('contact'), color: BRAND.primary },
              { label: '反馈建议', icon: MessageSquare, action: openFeedback, color: BRAND.info },
              { label: '快捷键', icon: Keyboard, action: () => setHelpOpen(true), color: BRAND.textSub },
            ].map((entry, i) => {
              const Icon = entry.icon;
              return (
                <button
                  key={i}
                  onClick={entry.action}
                  className="p-4 rounded-xl text-left transition-all hover:scale-[1.02]"
                  style={{ backgroundColor: BRAND.bgCard, border: `1px solid ${BRAND.border}` }}
                >
                  <Icon size={20} style={{ color: entry.color }} className="mb-2" />
                  <div className="text-sm font-medium" style={{ color: BRAND.text }}>{entry.label}</div>
                </button>
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
              {/* 概览：服务状态摘要 + 最近工单 + 热门 FAQ */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2 p-5 rounded-xl" style={{ backgroundColor: BRAND.bgCard, border: `1px solid ${BRAND.border}` }}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-base font-semibold flex items-center gap-2">
                      <Activity size={16} style={{ color: BRAND.success }} />
                      系统服务总览
                    </div>
                    <button onClick={() => setTab('status')} className="text-xs flex items-center gap-1" style={{ color: BRAND.primary }}>
                      查看详情 <ChevronRight size={12} />
                    </button>
                  </div>
                  <div className="space-y-2">
                    {SERVICE_COMPONENTS.slice(0, 5).map((svc) => {
                      const sk = serviceStatusKey(svc.status);
                      return (
                        <button
                          key={svc.id}
                          onClick={() => openService(svc.id)}
                          className="w-full flex items-center justify-between p-3 rounded-lg text-left transition-colors hover:scale-[1.005]"
                          style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}
                        >
                          <div className="flex items-center gap-3">
                            <div className="p-1.5 rounded" style={{ backgroundColor: STATUS[sk].bg }}>
                              <div className="w-2 h-2 rounded-full pulse-dot" style={{ backgroundColor: STATUS[sk].dot }} />
                            </div>
                            <div>
                              <div className="text-sm font-medium" style={{ color: BRAND.text }}>{svc.name}</div>
                              <div className="text-[10px]" style={{ color: BRAND.textMute }}>{svc.description}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] px-2 py-0.5 rounded" style={{ backgroundColor: STATUS[sk].bg, color: STATUS[sk].color }}>
                              {STATUS[sk].label}
                            </span>
                            <ChevronRight size={14} style={{ color: BRAND.textMute }} />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="p-5 rounded-xl" style={{ backgroundColor: BRAND.bgCard, border: `1px solid ${BRAND.border}` }}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-base font-semibold flex items-center gap-2">
                      <MessageSquare size={16} style={{ color: BRAND.primary }} />
                      用户反馈精选
                    </div>
                    <button onClick={() => setTab('feedback')} className="text-xs flex items-center gap-1" style={{ color: BRAND.primary }}>
                      更多 <ChevronRight size={12} />
                    </button>
                  </div>
                  <div className="space-y-3">
                    {FEEDBACKS.slice(0, 3).map((fb) => (
                      <div key={fb.id} className="p-3 rounded-lg" style={{ backgroundColor: BRAND.bg }}>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-1">
                            {Array.from({ length: fb.rating }).map((_, i) => (
                              <Star key={i} size={10} style={{ color: BRAND.warning, fill: BRAND.warning }} />
                            ))}
                          </div>
                          <div className="text-[10px]" style={{ color: BRAND.textMute }}>{fb.submittedAt}</div>
                        </div>
                        <div className="text-xs" style={{ color: BRAND.textSub }}>{fb.content.slice(0, 50)}...</div>
                        <div className="text-[10px] mt-1" style={{ color: BRAND.primary }}>{fb.module}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* 我的最近工单 */}
              <div className="p-5 rounded-xl" style={{ backgroundColor: BRAND.bgCard, border: `1px solid ${BRAND.border}` }}>
                <div className="flex items-center justify-between mb-4">
                  <div className="text-base font-semibold flex items-center gap-2">
                    <Inbox size={16} style={{ color: BRAND.info }} />
                    我的最近工单
                  </div>
                  <button onClick={() => setTab('tickets')} className="text-xs flex items-center gap-1" style={{ color: BRAND.primary }}>
                    全部工单 <ChevronRight size={12} />
                  </button>
                </div>
                <div className="space-y-2">
                  {TICKETS.slice(0, 4).map((t) => {
                    const sk = statusKey(t.status);
                    return (
                      <button
                        key={t.id}
                        onClick={() => openTicket(t.id)}
                        className="w-full flex items-center justify-between p-3 rounded-lg text-left transition-colors"
                        style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] font-mono" style={{ color: BRAND.textMute }}>{t.id}</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: STATUS[sk].bg, color: STATUS[sk].color }}>
                              {STATUS[sk].label}
                            </span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: `${priorityColor(t.priority)}20`, color: priorityColor(t.priority) }}>
                              {t.priority.toUpperCase()}
                            </span>
                          </div>
                          <div className="text-sm truncate" style={{ color: BRAND.text }}>{t.subject}</div>
                        </div>
                        <div className="text-right ml-3">
                          <div className="text-[10px]" style={{ color: BRAND.textMute }}>{t.updatedAt}</div>
                          <div className="text-[10px]" style={{ color: BRAND.info }}>{t.assignee}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 热门 FAQ */}
              <div className="p-5 rounded-xl" style={{ backgroundColor: BRAND.bgCard, border: `1px solid ${BRAND.border}` }}>
                <div className="flex items-center justify-between mb-4">
                  <div className="text-base font-semibold flex items-center gap-2">
                    <BookOpen size={16} style={{ color: BRAND.warning }} />
                    热门 FAQ
                  </div>
                  <button onClick={() => setTab('faq')} className="text-xs flex items-center gap-1" style={{ color: BRAND.primary }}>
                    全部 FAQ <ChevronRight size={12} />
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {FAQS.filter((f) => f.isHot).slice(0, 4).map((f) => (
                    <button
                      key={f.id}
                      onClick={() => openFaq(f.id)}
                      className="p-3 rounded-lg text-left"
                      style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}
                    >
                      <div className="flex items-start justify-between mb-1">
                        <div className="text-sm font-medium flex-1" style={{ color: BRAND.text }}>{f.question}</div>
                        <Flame size={12} style={{ color: BRAND.danger }} />
                      </div>
                      <div className="text-[10px]" style={{ color: BRAND.textMute }}>{f.helpful} 人觉得有帮助 · {f.views} 浏览</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {tab === 'tickets' && (
            <div className="space-y-4">
              {/* 工单筛选 */}
              <div className="p-4 rounded-xl" style={{ backgroundColor: BRAND.bgCard, border: `1px solid ${BRAND.border}` }}>
                <div className="flex flex-wrap gap-3 items-center">
                  <div className="flex items-center gap-2">
                    <Filter size={14} style={{ color: BRAND.textMute }} />
                    <span className="text-xs" style={{ color: BRAND.textMute }}>状态</span>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value as TicketStatus | 'all')}
                      className="px-2 py-1 rounded text-xs"
                      style={{ backgroundColor: BRAND.bg, color: BRAND.text, border: `1px solid ${BRAND.border}` }}
                    >
                      <option value="all">全部</option>
                      <option value="open">待处理</option>
                      <option value="pending">等待中</option>
                      <option value="in_progress">处理中</option>
                      <option value="resolved">已解决</option>
                      <option value="closed">已关闭</option>
                      <option value="reopened">已重开</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs" style={{ color: BRAND.textMute }}>优先级</span>
                    <select
                      value={priorityFilter}
                      onChange={(e) => setPriorityFilter(e.target.value as TicketPriority | 'all')}
                      className="px-2 py-1 rounded text-xs"
                      style={{ backgroundColor: BRAND.bg, color: BRAND.text, border: `1px solid ${BRAND.border}` }}
                    >
                      <option value="all">全部</option>
                      <option value="urgent">紧急</option>
                      <option value="high">高</option>
                      <option value="medium">中</option>
                      <option value="low">低</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs" style={{ color: BRAND.textMute }}>分类</span>
                    <select
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value as TicketCategory | 'all')}
                      className="px-2 py-1 rounded text-xs"
                      style={{ backgroundColor: BRAND.bg, color: BRAND.text, border: `1px solid ${BRAND.border}` }}
                    >
                      <option value="all">全部</option>
                      {Object.entries(categoryLabel).map(([k, v]) => (
                        <option key={k} value={k}>{v}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center gap-2 ml-auto">
                    <span className="text-xs" style={{ color: BRAND.textMute }}>排序</span>
                    <button
                      onClick={() => { setSortBy('updated'); setSortDir(sortDir === 'asc' ? 'desc' : 'asc'); }}
                      className="px-2 py-1 rounded text-xs flex items-center gap-1"
                      style={{ backgroundColor: sortBy === 'updated' ? BRAND.primaryLt : BRAND.bg, color: sortBy === 'updated' ? BRAND.primary : BRAND.textSub, border: `1px solid ${BRAND.border}` }}
                    >
                      更新时间 {sortBy === 'updated' && (sortDir === 'asc' ? <ChevronUp size={10} /> : <ChevronDown size={10} />)}
                    </button>
                    <button
                      onClick={() => { setSortBy('priority'); setSortDir(sortDir === 'asc' ? 'desc' : 'asc'); }}
                      className="px-2 py-1 rounded text-xs flex items-center gap-1"
                      style={{ backgroundColor: sortBy === 'priority' ? BRAND.primaryLt : BRAND.bg, color: sortBy === 'priority' ? BRAND.primary : BRAND.textSub, border: `1px solid ${BRAND.border}` }}
                    >
                      优先级 {sortBy === 'priority' && (sortDir === 'asc' ? <ChevronUp size={10} /> : <ChevronDown size={10} />)}
                    </button>
                    <button
                      onClick={() => { setSortBy('sla'); setSortDir(sortDir === 'asc' ? 'desc' : 'asc'); }}
                      className="px-2 py-1 rounded text-xs flex items-center gap-1"
                      style={{ backgroundColor: sortBy === 'sla' ? BRAND.primaryLt : BRAND.bg, color: sortBy === 'sla' ? BRAND.primary : BRAND.textSub, border: `1px solid ${BRAND.border}` }}
                    >
                      SLA {sortBy === 'sla' && (sortDir === 'asc' ? <ChevronUp size={10} /> : <ChevronDown size={10} />)}
                    </button>
                  </div>
                </div>
              </div>

              {/* 工单列表 */}
              <div className="space-y-2">
                {filteredTickets.length === 0 ? (
                  <div className="p-12 rounded-xl text-center" style={{ backgroundColor: BRAND.bgCard, border: `1px solid ${BRAND.border}` }}>
                    <Inbox size={32} className="mx-auto mb-3" style={{ color: BRAND.textMute }} />
                    <div className="text-sm" style={{ color: BRAND.textMute }}>没有匹配的工单</div>
                  </div>
                ) : (
                  filteredTickets.map((t) => {
                    const sk = statusKey(t.status);
                    const slaPct = Math.min(100, (t.sla.elapsed / t.sla.target) * 100);
                    return (
                      <button
                        key={t.id}
                        onClick={() => openTicket(t.id)}
                        className="w-full p-4 rounded-xl text-left transition-all hover:scale-[1.005]"
                        style={{ backgroundColor: BRAND.bgCard, border: `1px solid ${BRAND.border}` }}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <span className="text-xs font-mono" style={{ color: BRAND.textMute }}>{t.id}</span>
                              <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: STATUS[sk].bg, color: STATUS[sk].color }}>
                                {STATUS[sk].label}
                              </span>
                              <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: `${priorityColor(t.priority)}20`, color: priorityColor(t.priority) }}>
                                {t.priority.toUpperCase()}
                              </span>
                              <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: BRAND.bg, color: BRAND.textSub, border: `1px solid ${BRAND.border}` }}>
                                {categoryLabel(t.category)}
                              </span>
                            </div>
                            <div className="text-sm font-medium mb-1" style={{ color: BRAND.text }}>{t.subject}</div>
                            <div className="text-xs" style={{ color: BRAND.textSub }}>{t.description}</div>
                            <div className="flex items-center gap-3 mt-2 flex-wrap">
                              <div className="flex items-center gap-1 text-[10px]" style={{ color: BRAND.textMute }}>
                                <User size={10} />{t.assignee}
                              </div>
                              <div className="flex items-center gap-1 text-[10px]" style={{ color: BRAND.textMute }}>
                                <MessageCircle size={10} />{t.messages} 条
                              </div>
                              {t.attachments > 0 && (
                                <div className="flex items-center gap-1 text-[10px]" style={{ color: BRAND.textMute }}>
                                  <Paperclip size={10} />{t.attachments} 附件
                                </div>
                              )}
                              <div className="flex items-center gap-1 text-[10px]" style={{ color: BRAND.textMute }}>
                                <Clock size={10} />{t.createdAt}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-[10px] mb-1" style={{ color: BRAND.textMute }}>SLA</div>
                            <div className="text-xs font-mono" style={{ color: slaPct > 80 ? BRAND.danger : BRAND.text }}>
                              {t.sla.elapsed}/{t.sla.target}{t.sla.unit === 'min' ? 'm' : t.sla.unit === 'hour' ? 'h' : 'd'}
                            </div>
                            <div className="w-16 h-1 rounded-full mt-1" style={{ backgroundColor: BRAND.bg }}>
                              <div className="h-full rounded-full" style={{ width: `${slaPct}%`, backgroundColor: slaPct > 80 ? BRAND.danger : BRAND.success }} />
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {tab === 'faq' && (
            <div className="space-y-4">
              {/* FAQ 分类筛选 */}
              <div className="p-4 rounded-xl" style={{ backgroundColor: BRAND.bgCard, border: `1px solid ${BRAND.border}` }}>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setFaqCategory('all')}
                    className="px-3 py-1.5 rounded text-xs font-medium"
                    style={{ backgroundColor: faqCategory === 'all' ? BRAND.primary : BRAND.bg, color: faqCategory === 'all' ? BRAND.onPrimary : BRAND.textSub, border: `1px solid ${BRAND.border}` }}
                  >
                    全部
                  </button>
                  {Object.entries(faqCategoryLabel).map(([k, v]) => (
                    <button
                      key={k}
                      onClick={() => setFaqCategory(k as FaqCategory)}
                      className="px-3 py-1.5 rounded text-xs font-medium"
                      style={{ backgroundColor: faqCategory === k ? BRAND.primary : BRAND.bg, color: faqCategory === k ? BRAND.onPrimary : BRAND.textSub, border: `1px solid ${BRAND.border}` }}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>

              {/* FAQ 列表 */}
              <div className="space-y-2">
                {filteredFaqs.length === 0 ? (
                  <div className="p-12 rounded-xl text-center" style={{ backgroundColor: BRAND.bgCard, border: `1px solid ${BRAND.border}` }}>
                    <HelpCircle size={32} className="mx-auto mb-3" style={{ color: BRAND.textMute }} />
                    <div className="text-sm" style={{ color: BRAND.textMute }}>没有匹配的 FAQ</div>
                  </div>
                ) : (
                  filteredFaqs.map((f) => (
                    <button
                      key={f.id}
                      onClick={() => openFaq(f.id)}
                      className="w-full p-4 rounded-xl text-left transition-all hover:scale-[1.005]"
                      style={{ backgroundColor: BRAND.bgCard, border: `1px solid ${BRAND.border}` }}
                    >
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded" style={{ backgroundColor: BRAND.primaryLt }}>
                          <HelpCircle size={16} style={{ color: BRAND.primary }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <div className="text-sm font-medium" style={{ color: BRAND.text }}>{f.question}</div>
                            {f.isHot && <Flame size={12} style={{ color: BRAND.danger }} />}
                            {f.isNew && <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: BRAND.successLt, color: BRAND.success }}>NEW</span>}
                          </div>
                          <div className="text-xs line-clamp-2" style={{ color: BRAND.textSub }}>{f.answer}</div>
                          <div className="flex items-center gap-3 mt-2 flex-wrap">
                            <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: BRAND.bg, color: BRAND.textMute, border: `1px solid ${BRAND.border}` }}>
                              {faqCategoryLabel(f.category)}
                            </span>
                            <div className="flex items-center gap-1 text-[10px]" style={{ color: BRAND.success }}>
                              <ThumbsUp size={10} />{f.helpful}
                            </div>
                            <div className="text-[10px]" style={{ color: BRAND.textMute }}>{f.views} 浏览</div>
                            <div className="text-[10px]" style={{ color: BRAND.textMute }}>更新于 {f.updatedAt}</div>
                          </div>
                        </div>
                        <ChevronRight size={16} style={{ color: BRAND.textMute }} />
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}

          {tab === 'chat' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2 p-5 rounded-xl" style={{ backgroundColor: BRAND.bgCard, border: `1px solid ${BRAND.border}` }}>
                <div className="flex items-center justify-between mb-4 pb-3" style={{ borderBottom: `1px solid ${BRAND.border}` }}>
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded" style={{ backgroundColor: BRAND.primaryLt }}>
                      <Bot size={16} style={{ color: BRAND.primary }} />
                    </div>
                    <div>
                      <div className="text-sm font-semibold">智能客服 · 小萨</div>
                      <div className="text-[10px] flex items-center gap-1" style={{ color: BRAND.success }}>
                        <div className="w-1.5 h-1.5 rounded-full pulse-dot" style={{ backgroundColor: BRAND.success }} />
                        在线 · 平均响应 8 秒
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button className="p-1.5 rounded" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}>
                      <Volume2 size={14} style={{ color: BRAND.textSub }} />
                    </button>
                    <button className="p-1.5 rounded" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}>
                      <Settings size={14} style={{ color: BRAND.textSub }} />
                    </button>
                  </div>
                </div>

                <div className="space-y-3 mb-4 max-h-[480px] overflow-y-auto scrollbar-thin pr-2">
                  {chatMessages.map((m) => (
                    <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] ${m.role === 'user' ? 'order-2' : 'order-1'}`}>
                        {m.role !== 'user' && (
                          <div className="flex items-center gap-1 mb-1">
                            <Bot size={10} style={{ color: BRAND.primary }} />
                            <span className="text-[10px]" style={{ color: BRAND.primary }}>小萨</span>
                            <span className="text-[10px]" style={{ color: BRAND.textMute }}>{m.timestamp}</span>
                          </div>
                        )}
                        <div
                          className="p-3 rounded-lg text-sm"
                          style={{
                            backgroundColor: m.role === 'user' ? BRAND.primary : BRAND.bg,
                            color: m.role === 'user' ? BRAND.onPrimary : BRAND.text,
                            border: m.role === 'user' ? 'none' : `1px solid ${BRAND.border}`,
                          }}
                        >
                          {m.content}
                        </div>
                        {m.suggestions && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {m.suggestions.map((s, i) => (
                              <button
                                key={i}
                                onClick={() => setChatInput(s)}
                                className="px-2 py-1 rounded text-[10px]"
                                style={{ backgroundColor: BRAND.bg, color: BRAND.textSub, border: `1px solid ${BRAND.border}` }}
                              >
                                {s}
                              </button>
                            ))}
                          </div>
                        )}
                        {m.role === 'user' && (
                          <div className="text-[10px] text-right mt-1" style={{ color: BRAND.textMute }}>{m.timestamp}</div>
                        )}
                      </div>
                    </div>
                  ))}
                  {chatTyping && (
                    <div className="flex justify-start">
                      <div className="p-3 rounded-lg flex gap-1" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}>
                        <span className="w-1.5 h-1.5 rounded-full typing-dot" style={{ backgroundColor: BRAND.textSub }} />
                        <span className="w-1.5 h-1.5 rounded-full typing-dot" style={{ backgroundColor: BRAND.textSub }} />
                        <span className="w-1.5 h-1.5 rounded-full typing-dot" style={{ backgroundColor: BRAND.textSub }} />
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') sendChat(); }}
                    placeholder="输入您的问题... Enter 发送"
                    className="flex-1 px-3 py-2 rounded-lg outline-none text-sm"
                    style={{ backgroundColor: BRAND.bg, color: BRAND.text, border: `1px solid ${BRAND.border}` }}
                  />
                  <button
                    onClick={sendChat}
                    className="px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2"
                    style={{ backgroundColor: BRAND.primary, color: BRAND.onPrimary }}
                  >
                    <Send size={14} />发送
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <div className="p-4 rounded-xl" style={{ backgroundColor: BRAND.bgCard, border: `1px solid ${BRAND.border}` }}>
                  <div className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <Sparkles size={14} style={{ color: BRAND.warning }} />
                    智能能力
                  </div>
                  <div className="space-y-2 text-xs">
                    {[
                      { label: '账户与认证', desc: 'KYC / 登录 / 2FA' },
                      { label: '交易与订单', desc: '现货 / 杠杆 / 强平' },
                      { label: '钱包与出入金', desc: '充提币 / 白名单' },
                      { label: 'API 与开发', desc: 'Key / 权限 / 限频' },
                      { label: '质押与 Earn', desc: '收益 / 赎回' },
                    ].map((c, i) => (
                      <div key={i} className="p-2 rounded" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}>
                        <div className="font-medium" style={{ color: BRAND.text }}>{c.label}</div>
                        <div style={{ color: BRAND.textMute }}>{c.desc}</div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="p-4 rounded-xl" style={{ backgroundColor: BRAND.bgCard, border: `1px solid ${BRAND.border}` }}>
                  <div className="text-sm font-semibold mb-2 flex items-center gap-2">
                    <Info size={14} style={{ color: BRAND.info }} />
                    服务说明
                  </div>
                  <div className="text-xs" style={{ color: BRAND.textSub }}>
                    智能客服 7×24 在线。复杂问题将自动转接人工客服或引导您提交工单。所有对话内容仅用于服务质量提升，不会用于其他用途。
                  </div>
                </div>
              </div>
            </div>
          )}

          {tab === 'contact' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 stagger-in">
              {CONTACTS.map((c) => {
                const Icon = c.type === 'email' ? Mail : c.type === 'phone' ? Phone : c.type === 'chat' ? MessageCircle : c.type === 'social' ? Globe2 : c.type === 'community' ? Users : PhoneCall;
                return (
                  <div key={c.id} className="p-5 rounded-xl" style={{ backgroundColor: BRAND.bgCard, border: `1px solid ${BRAND.border}` }}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="p-2 rounded" style={{ backgroundColor: BRAND.primaryLt }}>
                        <Icon size={18} style={{ color: BRAND.primary }} />
                      </div>
                      {c.isHot && <span className="text-[10px] px-2 py-0.5 rounded flex items-center gap-1" style={{ backgroundColor: BRAND.dangerLt, color: BRAND.danger }}><Flame size={10} />推荐</span>}
                    </div>
                    <div className="text-base font-semibold mb-1" style={{ color: BRAND.text }}>{c.name}</div>
                    <div className="text-xs mb-3" style={{ color: BRAND.textSub }}>{c.description}</div>
                    <div className="space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span style={{ color: BRAND.textMute }}>联系方式</span>
                        <span className="font-mono" style={{ color: BRAND.text }}>{c.value}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span style={{ color: BRAND.textMute }}>服务时间</span>
                        <span style={{ color: BRAND.text }}>{c.availability}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span style={{ color: BRAND.textMute }}>响应时效</span>
                        <span style={{ color: BRAND.success }}>{c.responseTime}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span style={{ color: BRAND.textMute }}>支持语言</span>
                        <span style={{ color: BRAND.text }}>{c.languages.join(' / ')}</span>
                      </div>
                    </div>
                    <div className="mt-3 pt-3 flex gap-2" style={{ borderTop: `1px solid ${BRAND.border}` }}>
                      <button className="flex-1 py-1.5 rounded text-xs flex items-center justify-center gap-1" style={{ backgroundColor: BRAND.primary, color: BRAND.onPrimary }}>
                        <Send size={12} />联系
                      </button>
                      <button className="px-3 py-1.5 rounded text-xs" style={{ backgroundColor: BRAND.bg, color: BRAND.text, border: `1px solid ${BRAND.border}` }}>
                        <Copy size={12} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {tab === 'status' && (
            <div className="space-y-3 stagger-in">
              {SERVICE_COMPONENTS.map((svc) => {
                const sk = serviceStatusKey(svc.status);
                return (
                  <button
                    key={svc.id}
                    onClick={() => openService(svc.id)}
                    className="w-full p-4 rounded-xl text-left transition-all hover:scale-[1.005]"
                    style={{ backgroundColor: BRAND.bgCard, border: `1px solid ${BRAND.border}` }}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="p-2 rounded" style={{ backgroundColor: STATUS[sk].bg }}>
                          <div className="w-2 h-2 rounded-full pulse-dot" style={{ backgroundColor: STATUS[sk].dot }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <div className="text-sm font-semibold" style={{ color: BRAND.text }}>{svc.name}</div>
                            <span className="text-[10px] px-2 py-0.5 rounded" style={{ backgroundColor: STATUS[sk].bg, color: STATUS[sk].color }}>
                              {STATUS[sk].label}
                            </span>
                            {svc.status === 'maintenance' && (
                              <span className="text-[10px] px-2 py-0.5 rounded" style={{ backgroundColor: BRAND.bg, color: BRAND.warning, border: `1px solid ${BRAND.warning}40` }}>
                                计划维护
                              </span>
                            )}
                          </div>
                          <div className="text-xs" style={{ color: BRAND.textSub }}>{svc.description}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="text-[10px]" style={{ color: BRAND.textMute }}>30 日可用率</div>
                          <div className="text-sm font-mono" style={{ color: BRAND.text }}>{svc.uptime}%</div>
                        </div>
                        <div className="text-right">
                          <div className="text-[10px]" style={{ color: BRAND.textMute }}>平均延迟</div>
                          <div className="text-sm font-mono" style={{ color: BRAND.text }}>{svc.latency}ms</div>
                        </div>
                        <ChevronRight size={16} style={{ color: BRAND.textMute }} />
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {tab === 'feedback' && (
            <div className="space-y-4">
              <div className="p-5 rounded-xl" style={{ backgroundColor: BRAND.bgCard, border: `1px solid ${BRAND.border}` }}>
                <div className="text-base font-semibold mb-4 flex items-center gap-2">
                  <MessageSquare size={16} style={{ color: BRAND.primary }} />
                  提交反馈
                </div>
                <div className="space-y-3">
                  <div className="flex gap-2 flex-wrap">
                    {[
                      { v: 'praise', label: '表扬', icon: ThumbsUp, color: BRAND.success },
                      { v: 'suggestion', label: '建议', icon: Lightbulb, color: BRAND.warning },
                      { v: 'complaint', label: '投诉', icon: AlertTriangle, color: BRAND.danger },
                      { v: 'bug', label: 'Bug', icon: AlertOctagon, color: BRAND.danger },
                    ].map((t) => {
                      const Icon = t.icon;
                      return (
                        <button
                          key={t.v}
                          onClick={() => setFeedbackType(t.v as FeedbackItem['type'])}
                          className="px-4 py-2 rounded-lg text-sm flex items-center gap-2"
                          style={{ backgroundColor: feedbackType === t.v ? `${t.color}20` : BRAND.bg, color: feedbackType === t.v ? t.color : BRAND.textSub, border: `1px solid ${feedbackType === t.v ? t.color : BRAND.border}` }}
                        >
                          <Icon size={14} />{t.label}
                        </button>
                      );
                    })}
                  </div>
                  <textarea
                    value={feedbackText}
                    onChange={(e) => setFeedbackText(e.target.value)}
                    placeholder="请详细描述您的反馈（不少于 10 字）..."
                    rows={4}
                    className="w-full px-3 py-2 rounded-lg outline-none text-sm resize-none"
                    style={{ backgroundColor: BRAND.bg, color: BRAND.text, border: `1px solid ${BRAND.border}` }}
                  />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs" style={{ color: BRAND.textMute }}>评分</span>
                      {Array.from({ length: 5 }).map((_, i) => (
                        <button key={i} onClick={() => setFeedbackRating(i + 1)}>
                          <Star size={16} style={{ color: i < feedbackRating ? BRAND.warning : BRAND.textMute, fill: i < feedbackRating ? BRAND.warning : 'none' }} />
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={submitFeedback}
                      className="px-5 py-2 rounded-lg text-sm font-medium flex items-center gap-2"
                      style={{ backgroundColor: BRAND.primary, color: BRAND.onPrimary }}
                    >
                      <Send size={14} />提交反馈
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-sm font-semibold flex items-center gap-2 mb-2">
                  <Heart size={14} style={{ color: BRAND.danger }} />
                  用户反馈精选
                </div>
                {FEEDBACKS.map((fb) => (
                  <div key={fb.id} className="p-4 rounded-xl" style={{ backgroundColor: BRAND.bgCard, border: `1px solid ${BRAND.border}` }}>
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {Array.from({ length: fb.rating }).map((_, i) => (
                          <Star key={i} size={12} style={{ color: BRAND.warning, fill: BRAND.warning }} />
                        ))}
                        <span className="text-[10px] px-2 py-0.5 rounded" style={{ backgroundColor: BRAND.bg, color: BRAND.textSub, border: `1px solid ${BRAND.border}` }}>
                          {fb.module}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded" style={{ backgroundColor: fb.type === 'praise' ? BRAND.successLt : fb.type === 'complaint' || fb.type === 'bug' ? BRAND.dangerLt : BRAND.warningLt, color: fb.type === 'praise' ? BRAND.success : fb.type === 'complaint' || fb.type === 'bug' ? BRAND.danger : BRAND.warning }}>
                          {fb.type === 'praise' ? '表扬' : fb.type === 'suggestion' ? '建议' : fb.type === 'complaint' ? '投诉' : 'Bug'}
                        </span>
                      </div>
                      <div className="text-[10px]" style={{ color: BRAND.textMute }}>{fb.submittedAt}</div>
                    </div>
                    <div className="text-sm mb-2" style={{ color: BRAND.text }}>{fb.content}</div>
                    {fb.response && (
                      <div className="p-2 rounded text-xs" style={{ backgroundColor: BRAND.primaryLt, color: BRAND.textSub }}>
                        <span className="font-semibold" style={{ color: BRAND.primary }}>官方回复：</span>{fb.response}
                      </div>
                    )}
                  </div>
                ))}
              </div>
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
                    { key: 'Enter', desc: '发送聊天消息' },
                    { key: 'Tab', desc: '工单 / FAQ 切换' },
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
                  寻求帮助
                </div>
                <div className="space-y-2">
                  {[
                    { label: '查看 FAQ 知识库', desc: '优先自助查询', icon: BookOpen, action: () => setTab('faq') },
                    { label: '联系智能客服', desc: '7×24 即时响应', icon: Bot, action: openChat },
                    { label: '提交工单', desc: '复杂问题人工跟进', icon: Inbox, action: () => setTab('tickets') },
                    { label: '紧急联系电话', desc: 'VIP3+ 用户', icon: Phone, action: () => setTab('contact') },
                  ].map((e, i) => {
                    const Icon = e.icon;
                    return (
                      <button
                        key={i}
                        onClick={e.action}
                        className="w-full p-3 rounded-lg flex items-center gap-3 text-left"
                        style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}
                      >
                        <div className="p-2 rounded" style={{ backgroundColor: BRAND.primaryLt }}>
                          <Icon size={14} style={{ color: BRAND.primary }} />
                        </div>
                        <div className="flex-1">
                          <div className="text-sm font-medium" style={{ color: BRAND.text }}>{e.label}</div>
                          <div className="text-[10px]" style={{ color: BRAND.textMute }}>{e.desc}</div>
                        </div>
                        <ChevronRight size={14} style={{ color: BRAND.textMute }} />
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="md:col-span-2 p-5 rounded-xl" style={{ backgroundColor: BRAND.bgCard, border: `1px solid ${BRAND.border}` }}>
                <div className="text-base font-semibold mb-3 flex items-center gap-2">
                  <Info size={16} style={{ color: BRAND.info }} />
                  服务承诺与免责
                </div>
                <ul className="space-y-2 text-xs" style={{ color: BRAND.textSub }}>
                  <li>· 平台致力于提供 7×24 不间断客户服务，但受不可抗力、第三方依赖等因素影响，部分时段可能延迟响应。</li>
                  <li>· 智能客服为辅助工具，复杂问题请优先通过工单或人工渠道跟进。</li>
                  <li>· 服务时效为内部估算口径，不构成具有法律约束力的服务质量承诺。</li>
                  <li>· 涉及资金安全的操作（提现、API Key 创建、2FA 重置）必须本人操作，请勿向任何"客服"透露密码、验证码、私钥。</li>
                  <li>· 所有对话与工单记录仅用于服务质量提升与合规留档，不会用于其他用途。</li>
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
              本支持中心仅作为客户服务渠道，所列服务时效、SLA 指标为内部运营参考，不构成具有法律约束力的服务质量承诺。请勿向任何"客服"透露密码、验证码、2FA 密钥或私钥。涉及资金安全的操作请通过官方 App / Web 端完成。
            </div>
          </div>
        </div>
      </section>

      {/* 底部 CTA */}
      <section className="px-6 py-8">
        <div className="max-w-7xl mx-auto text-center">
          <div className="text-lg font-semibold mb-2">还有问题？</div>
          <div className="text-sm mb-4" style={{ color: BRAND.textSub }}>我们的客服团队 7×24 在线为您服务</div>
          <div className="flex justify-center gap-3 flex-wrap">
            <button
              onClick={openChat}
              className="px-6 py-3 rounded-lg text-sm font-medium flex items-center gap-2"
              style={{ backgroundColor: BRAND.primary, color: BRAND.onPrimary }}
            >
              <Bot size={16} />立即咨询
            </button>
            <button
              onClick={() => setTab('tickets')}
              className="px-6 py-3 rounded-lg text-sm font-medium flex items-center gap-2"
              style={{ backgroundColor: BRAND.bgCard, color: BRAND.text, border: `1px solid ${BRAND.border}` }}
            >
              <Inbox size={16} />提交工单
            </button>
          </div>
        </div>
      </section>

      {/* 工单详情 Drawer */}
      {drawer.open && drawer.type === 'ticket' && drawerTicket && (
        <>
          <div
            className="fixed inset-0 z-40"
            style={{ backgroundColor: BRAND.overlay }}
            onClick={() => setDrawer({ open: false, type: null, payload: null })}
          />
          <div
            className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-2xl overflow-y-auto scrollbar-thin drawer-anim"
            style={{ backgroundColor: BRAND.bg, borderLeft: `1px solid ${BRAND.border}` }}
          >
            <div className="sticky top-0 p-4 flex items-center justify-between" style={{ backgroundColor: BRAND.bg, borderBottom: `1px solid ${BRAND.border}` }}>
              <div className="text-base font-semibold flex items-center gap-2">
                <Inbox size={16} style={{ color: BRAND.primary }} />
                工单详情
              </div>
              <button onClick={() => setDrawer({ open: false, type: null, payload: null })} className="p-1">
                <X size={18} style={{ color: BRAND.textMute }} />
              </button>
            </div>
            <div className="p-6">
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                <span className="text-xs font-mono" style={{ color: BRAND.textMute }}>{drawerTicket.id}</span>
                <span className="text-[10px] px-2 py-0.5 rounded" style={{ backgroundColor: STATUS[statusKey(drawerTicket.status)].bg, color: STATUS[statusKey(drawerTicket.status)].color }}>
                  {STATUS[statusKey(drawerTicket.status)].label}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded" style={{ backgroundColor: `${priorityColor(drawerTicket.priority)}20`, color: priorityColor(drawerTicket.priority) }}>
                  {drawerTicket.priority.toUpperCase()}
                </span>
              </div>
              <h2 className="text-xl font-bold mb-3" style={{ color: BRAND.text }}>{drawerTicket.subject}</h2>
              <p className="text-sm mb-4" style={{ color: BRAND.textSub }}>{drawerTicket.description}</p>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.bgCard, border: `1px solid ${BRAND.border}` }}>
                  <div className="text-[10px]" style={{ color: BRAND.textMute }}>当前处理人</div>
                  <div className="text-sm font-medium mt-1" style={{ color: BRAND.text }}>{drawerTicket.assignee}</div>
                </div>
                <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.bgCard, border: `1px solid ${BRAND.border}` }}>
                  <div className="text-[10px]" style={{ color: BRAND.textMute }}>分类</div>
                  <div className="text-sm font-medium mt-1" style={{ color: BRAND.text }}>{categoryLabel(drawerTicket.category)}</div>
                </div>
                <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.bgCard, border: `1px solid ${BRAND.border}` }}>
                  <div className="text-[10px]" style={{ color: BRAND.textMute }}>创建时间</div>
                  <div className="text-sm font-mono mt-1" style={{ color: BRAND.text }}>{drawerTicket.createdAt}</div>
                </div>
                <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.bgCard, border: `1px solid ${BRAND.border}` }}>
                  <div className="text-[10px]" style={{ color: BRAND.textMute }}>最近更新</div>
                  <div className="text-sm font-mono mt-1" style={{ color: BRAND.text }}>{drawerTicket.updatedAt}</div>
                </div>
              </div>

              <div className="p-3 rounded-lg mb-4" style={{ backgroundColor: BRAND.bgCard, border: `1px solid ${BRAND.border}` }}>
                <div className="text-[10px] mb-1" style={{ color: BRAND.textMute }}>SLA 进度</div>
                <div className="flex items-center justify-between text-xs mb-2">
                  <span style={{ color: BRAND.textSub }}>已耗时 {drawerTicket.sla.elapsed} / 目标 {drawerTicket.sla.target} {drawerTicket.sla.unit === 'min' ? '分钟' : drawerTicket.sla.unit === 'hour' ? '小时' : '天'}</span>
                  <span style={{ color: (drawerTicket.sla.elapsed / drawerTicket.sla.target) > 0.8 ? BRAND.danger : BRAND.success }}>
                    {Math.round((drawerTicket.sla.elapsed / drawerTicket.sla.target) * 100)}%
                  </span>
                </div>
                <div className="w-full h-2 rounded-full" style={{ backgroundColor: BRAND.bg }}>
                  <div className="h-full rounded-full" style={{ width: `${Math.min(100, (drawerTicket.sla.elapsed / drawerTicket.sla.target) * 100)}%`, backgroundColor: (drawerTicket.sla.elapsed / drawerTicket.sla.target) > 0.8 ? BRAND.danger : BRAND.success }} />
                </div>
              </div>

              <div className="mb-4">
                <div className="text-sm font-semibold mb-2">对话记录</div>
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="p-3 rounded-lg" style={{ backgroundColor: BRAND.bgCard, border: `1px solid ${BRAND.border}` }}>
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: i % 2 === 0 ? BRAND.primaryLt : BRAND.bg, border: `1px solid ${BRAND.border}` }}>
                          {i % 2 === 0 ? <User size={12} style={{ color: BRAND.primary }} /> : <Headphones size={12} style={{ color: BRAND.textSub }} />}
                        </div>
                        <span className="text-xs font-medium" style={{ color: BRAND.text }}>{i % 2 === 0 ? '我' : drawerTicket.assignee}</span>
                        <span className="text-[10px]" style={{ color: BRAND.textMute }}>{drawerTicket.updatedAt}</span>
                      </div>
                      <div className="text-xs" style={{ color: BRAND.textSub }}>
                        {i === 1 ? drawerTicket.description : i === 2 ? '您好，已收到您的工单，我正在为您查询，请稍候。' : '已确认问题，需要您提供 7 月 18 日提交的资料编号，方便我加快核对。'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <textarea
                placeholder="回复工单..."
                rows={3}
                className="w-full px-3 py-2 rounded-lg outline-none text-sm resize-none mb-2"
                style={{ backgroundColor: BRAND.bgCard, color: BRAND.text, border: `1px solid ${BRAND.border}` }}
              />
              <div className="flex gap-2">
                <button className="flex-1 py-2 rounded-lg text-sm font-medium" style={{ backgroundColor: BRAND.primary, color: BRAND.onPrimary }}>
                  <Send size={14} className="inline mr-1" />发送回复
                </button>
                <button className="px-4 py-2 rounded-lg text-sm" style={{ backgroundColor: BRAND.bgCard, color: BRAND.text, border: `1px solid ${BRAND.border}` }}>
                  <Paperclip size={14} />
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* FAQ 详情 Drawer */}
      {drawer.open && drawer.type === 'faq' && drawerFaq && (
        <>
          <div className="fixed inset-0 z-40" style={{ backgroundColor: BRAND.overlay }} onClick={() => setDrawer({ open: false, type: null, payload: null })} />
          <div className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-2xl overflow-y-auto scrollbar-thin drawer-anim" style={{ backgroundColor: BRAND.bg, borderLeft: `1px solid ${BRAND.border}` }}>
            <div className="sticky top-0 p-4 flex items-center justify-between" style={{ backgroundColor: BRAND.bg, borderBottom: `1px solid ${BRAND.border}` }}>
              <div className="text-base font-semibold flex items-center gap-2">
                <HelpCircle size={16} style={{ color: BRAND.primary }} />
                FAQ 详情
              </div>
              <button onClick={() => setDrawer({ open: false, type: null, payload: null })} className="p-1">
                <X size={18} style={{ color: BRAND.textMute }} />
              </button>
            </div>
            <div className="p-6">
              <div className="flex items-center gap-2 mb-3">
                {drawerFaq.isHot && <Flame size={14} style={{ color: BRAND.danger }} />}
                {drawerFaq.isNew && <span className="text-[10px] px-2 py-0.5 rounded" style={{ backgroundColor: BRAND.successLt, color: BRAND.success }}>NEW</span>}
                <span className="text-[10px] px-2 py-0.5 rounded" style={{ backgroundColor: BRAND.bgCard, color: BRAND.textSub, border: `1px solid ${BRAND.border}` }}>
                  {faqCategoryLabel(drawerFaq.category)}
                </span>
              </div>
              <h2 className="text-xl font-bold mb-4" style={{ color: BRAND.text }}>{drawerFaq.question}</h2>
              <div className="text-sm mb-4 leading-relaxed" style={{ color: BRAND.textSub }}>{drawerFaq.answer}</div>

              {drawerFaq.steps && (
                <div className="p-4 rounded-lg mb-4" style={{ backgroundColor: BRAND.bgCard, border: `1px solid ${BRAND.border}` }}>
                  <div className="text-sm font-semibold mb-2">操作步骤</div>
                  <ol className="space-y-1.5">
                    {drawerFaq.steps.map((s, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm" style={{ color: BRAND.textSub }}>
                        <span className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold" style={{ backgroundColor: BRAND.primaryLt, color: BRAND.primary }}>{i + 1}</span>
                        {s}
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              <div className="flex items-center justify-between p-3 rounded-lg mb-4" style={{ backgroundColor: BRAND.bgCard, border: `1px solid ${BRAND.border}` }}>
                <div className="text-sm" style={{ color: BRAND.textSub }}>这个回答对您有帮助吗？</div>
                <div className="flex gap-2">
                  <button className="px-3 py-1.5 rounded text-xs flex items-center gap-1" style={{ backgroundColor: BRAND.successLt, color: BRAND.success }}>
                    <ThumbsUp size={12} />有帮助 ({drawerFaq.helpful})
                  </button>
                  <button className="px-3 py-1.5 rounded text-xs flex items-center gap-1" style={{ backgroundColor: BRAND.dangerLt, color: BRAND.danger }}>
                    <ThumbsDown size={12} />没帮助 ({drawerFaq.unhelpful})
                  </button>
                </div>
              </div>

              {drawerFaq.relatedIds.length > 0 && (
                <div>
                  <div className="text-sm font-semibold mb-2">相关问题</div>
                  <div className="space-y-2">
                    {drawerFaq.relatedIds.map((id) => {
                      const rel = FAQS.find((f) => f.id === id);
                      if (!rel) return null;
                      return (
                        <button
                          key={id}
                          onClick={() => setDrawer({ open: true, type: 'faq', payload: id })}
                          className="w-full p-3 rounded-lg text-left flex items-center gap-2"
                          style={{ backgroundColor: BRAND.bgCard, border: `1px solid ${BRAND.border}` }}
                        >
                          <HelpCircle size={12} style={{ color: BRAND.primary }} />
                          <span className="text-sm flex-1" style={{ color: BRAND.text }}>{rel.question}</span>
                          <ChevronRight size={12} style={{ color: BRAND.textMute }} />
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* 服务状态详情 Drawer */}
      {drawer.open && drawer.type === 'status' && drawerService && (
        <>
          <div className="fixed inset-0 z-40" style={{ backgroundColor: BRAND.overlay }} onClick={() => setDrawer({ open: false, type: null, payload: null })} />
          <div className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-2xl overflow-y-auto scrollbar-thin drawer-anim" style={{ backgroundColor: BRAND.bg, borderLeft: `1px solid ${BRAND.border}` }}>
            <div className="sticky top-0 p-4 flex items-center justify-between" style={{ backgroundColor: BRAND.bg, borderBottom: `1px solid ${BRAND.border}` }}>
              <div className="text-base font-semibold flex items-center gap-2">
                <Activity size={16} style={{ color: STATUS[serviceStatusKey(drawerService.status)].color }} />
                服务详情
              </div>
              <button onClick={() => setDrawer({ open: false, type: null, payload: null })} className="p-1">
                <X size={18} style={{ color: BRAND.textMute }} />
              </button>
            </div>
            <div className="p-6">
              <h2 className="text-xl font-bold mb-2" style={{ color: BRAND.text }}>{drawerService.name}</h2>
              <p className="text-sm mb-4" style={{ color: BRAND.textSub }}>{drawerService.description}</p>

              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.bgCard, border: `1px solid ${BRAND.border}` }}>
                  <div className="text-[10px]" style={{ color: BRAND.textMute }}>当前状态</div>
                  <div className="text-sm font-semibold mt-1" style={{ color: STATUS[serviceStatusKey(drawerService.status)].color }}>{STATUS[serviceStatusKey(drawerService.status)].label}</div>
                </div>
                <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.bgCard, border: `1px solid ${BRAND.border}` }}>
                  <div className="text-[10px]" style={{ color: BRAND.textMute }}>30 日可用率</div>
                  <div className="text-sm font-mono font-semibold mt-1" style={{ color: BRAND.text }}>{drawerService.uptime}%</div>
                </div>
                <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.bgCard, border: `1px solid ${BRAND.border}` }}>
                  <div className="text-[10px]" style={{ color: BRAND.textMute }}>平均延迟</div>
                  <div className="text-sm font-mono font-semibold mt-1" style={{ color: BRAND.text }}>{drawerService.latency}ms</div>
                </div>
              </div>

              {drawerService.lastIncident && (
                <div className="p-3 rounded-lg mb-4" style={{ backgroundColor: BRAND.warningLt, border: `1px solid ${BRAND.warning}40` }}>
                  <div className="text-xs font-bold mb-1 flex items-center gap-1" style={{ color: BRAND.warning }}>
                    <AlertTriangle size={12} />最近事件
                  </div>
                  <div className="text-xs" style={{ color: BRAND.textSub }}>
                    {drawerService.lastIncident.date} · 持续 {drawerService.lastIncident.duration} · {drawerService.lastIncident.summary}
                  </div>
                </div>
              )}

              <div>
                <div className="text-sm font-semibold mb-2">运行历史</div>
                <div className="space-y-1">
                  {drawerService.history.map((h, i) => {
                    const sk = serviceStatusKey(h.status);
                    return (
                      <div key={i} className="flex items-center justify-between p-2 rounded" style={{ backgroundColor: BRAND.bgCard, border: `1px solid ${BRAND.border}` }}>
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: STATUS[sk].dot }} />
                          <span className="text-xs font-mono" style={{ color: BRAND.text }}>{h.date}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] px-2 py-0.5 rounded" style={{ backgroundColor: STATUS[sk].bg, color: STATUS[sk].color }}>{STATUS[sk].label}</span>
                          {h.duration && <span className="text-[10px]" style={{ color: BRAND.textMute }}>{h.duration}m</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* 帮助快捷键 Drawer */}
      {helpOpen && (
        <>
          <div className="fixed inset-0 z-40" style={{ backgroundColor: BRAND.overlay }} onClick={() => setHelpOpen(false)} />
          <div className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md overflow-y-auto scrollbar-thin drawer-anim" style={{ backgroundColor: BRAND.bg, borderLeft: `1px solid ${BRAND.border}` }}>
            <div className="sticky top-0 p-4 flex items-center justify-between" style={{ backgroundColor: BRAND.bg, borderBottom: `1px solid ${BRAND.border}` }}>
              <div className="text-base font-semibold flex items-center gap-2">
                <Keyboard size={16} style={{ color: BRAND.primary }} />
                快捷键
              </div>
              <button onClick={() => setHelpOpen(false)} className="p-1">
                <X size={18} style={{ color: BRAND.textMute }} />
              </button>
            </div>
            <div className="p-6 space-y-2">
              {[
                { key: '/', desc: '聚焦搜索框' },
                { key: '?', desc: '切换帮助面板' },
                { key: 'Esc', desc: '关闭抽屉 / 清除搜索' },
                { key: 'Enter', desc: '发送聊天消息' },
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
