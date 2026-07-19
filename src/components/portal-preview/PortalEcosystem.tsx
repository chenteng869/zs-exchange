'use client';

/**
 * PortalEcosystem - 生态合作中心（2026-07-19 Q05 P3.24）
 *
 * 页面定位：
 * - 中萨数字科技交易所 生态合作中心
 * - 节点生态 / 生态合作伙伴 / 流动性提供方 / 生态基金 / 生态活动 / 合作申请
 * - 与 P3.12 机构 / P3.17 API / P3.18 Launch / P3.20 KYB 形成"机构-API-发行-生态"四方协同闭环
 *
 * L4 工业级设计标准：
 * - 暗色 v6 纯黑 #000000 + 卡片 #141414 + ZSDEX 绿 primary #14B881
 * - 10 大区块：Hero / 实时 KPI / 节点生态 / 生态合作伙伴 / 流动性提供方 /
 *             生态基金 / 生态活动 / 合作申请 / 申请进度 / 生态地图 / 底部 CTA
 * - 9+ 交互：Tab 切换 / 节点类型过滤 / 搜索 / 排序 / 等级过滤 / 详情 Drawer /
 *           合作申请向导 / 申请进度 / 快捷键
 * - 5+ Drawer：节点详情 / 合作伙伴详情 / 流动性详情 / 基金详情 / 活动详情 / 申请向导 / 帮助
 * - 4+ 实时数据：在线节点 / 生态伙伴 / 流动性深度 / 申请处理
 * - 4+ 动画：Stagger / CountUp / Hover / Pulse
 *
 * 合规要点（Q05 硬约束）：
 * - 所有节点 / 伙伴 / 流动性 / 基金 / 活动 / 申请数据使用 mock 占位
 * - 状态徽章统一使用 STATUS 枚举
 * - 不修改旧官网 / 旧 H5 / disabled pages / brand.ts / SPEC.md
 * - 合作申请仅做 UI 演示，不接真实审核流程
 * - 严格规避高风险合规表述，明确"合规研究方向"定性
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
  Globe2,
  Network,
  Server,
  Cloud,
  Cpu,
  Database,
  Layers,
  Boxes,
  GitBranch,
  GitCommit,
  GitPullRequest,
  Code2,
  Terminal,
  Workflow,
  Activity,
  Users,
  UserCheck,
  UserPlus,
  Building2,
  Briefcase,
  Handshake,
  HandCoins,
  Coins,
  Wallet,
  CircleDollarSign,
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart as PieIcon,
  Award,
  Trophy,
  Crown,
  Medal,
  Star,
  Sparkles,
  Flame,
  Zap,
  Rocket,
  Calendar,
  Clock,
  MapPin,
  Map as MapIcon,
  Compass,
  Flag,
  Target,
  Crosshair,
  Megaphone,
  Radio,
  Mic,
  Video,
  PlayCircle,
  BookOpen,
  GraduationCap,
  Lightbulb,
  Heart,
  ThumbsUp,
  Bookmark,
  ExternalLink,
  Copy,
  Mail,
  MessageCircle,
  Phone,
  HelpCircle,
  Keyboard,
  Settings,
  Sliders,
  Shield,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  XCircle,
  Plus,
  Minus,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowRight,
  Hash,
  Link2,
  FileText,
  Download,
  Upload,
  Eye,
  EyeOff,
  Lock,
  Unlock,
} from 'lucide-react';
import { BRAND, STATUS } from './brand';

// ============== 类型 ==============

type Tab = 'overview' | 'nodes' | 'partners' | 'liquidity' | 'fund' | 'events' | 'apply' | 'map' | 'help';
type NodeType = 'validator' | 'rpc' | 'super' | 'backup' | 'edge' | 'archive';
type NodeStatus = 'online' | 'syncing' | 'offline' | 'jailed' | 'slashed' | 'maintenance';
type PartnerCategory = 'institution' | 'tech' | 'media' | 'community' | 'audit' | 'wallet' | 'oracle' | 'cross-chain';
type PartnerLevel = 'platinum' | 'gold' | 'silver' | 'bronze' | 'community';
type LiquidityType = 'spot' | 'perp' | 'amm' | 'orderbook' | 'clob' | 'rfq';
type FundType = 'vc' | 'accelerator' | 'angel' | 'grant' | 'foundation' | 'strat';
type EventType = 'hackathon' | 'meetup' | 'ama' | 'workshop' | 'conference' | 'online' | 'demo-day';
type EventStatus = 'upcoming' | 'registration' | 'live' | 'ended' | 'cancelled';
type ApplyType = 'node' | 'partner' | 'liquidity' | 'fund' | 'media' | 'tech' | 'community' | 'other';
type ApplyStage = 'submitted' | 'review' | 'due-diligence' | 'contract' | 'integration' | 'launched' | 'rejected';
type DrawerType = 'node' | 'partner' | 'liquidity' | 'fund' | 'event' | 'apply' | 'application' | 'help' | null;

interface Node {
  id: string;
  name: string;
  type: NodeType;
  status: NodeStatus;
  region: string;
  country: string;
  city: string;
  ip: string;
  version: string;
  uptime: number;
  blockHeight: number;
  peers: number;
  cpu: number;
  memory: number;
  network: number;
  stake: number;
  reward: number;
  joinedAt: string;
  operator: string;
  description: string;
  region2: string;
  jurisdiction: string;
  audit: string;
  features: string[];
}

interface Partner {
  id: string;
  name: string;
  category: PartnerCategory;
  level: PartnerLevel;
  logo: string;
  region: string;
  country: string;
  joinedAt: string;
  description: string;
  highlights: string[];
  integrations: string[];
  contact: string;
  website: string;
  employees: number;
  founded: number;
  cooperationAreas: string[];
  caseStudy: string;
}

interface LiquidityProvider {
  id: string;
  name: string;
  type: LiquidityType;
  region: string;
  pairs: number;
  dailyVolume: number;
  spread: number;
  uptime: number;
  joinedAt: string;
  description: string;
  contacts: string;
  makerRebate: number;
  takerFee: number;
  minTrade: number;
  riskControl: string[];
}

interface Fund {
  id: string;
  name: string;
  type: FundType;
  aum: number;
  focus: string[];
  region: string;
  portfolio: number;
  invested: number;
  averageCheck: number;
  stages: string[];
  contact: string;
  joinedAt: string;
  description: string;
  partners: string[];
  thesis: string;
}

interface EcoEvent {
  id: string;
  title: string;
  type: EventType;
  status: EventStatus;
  startDate: string;
  endDate: string;
  city: string;
  country: string;
  online: boolean;
  organizer: string;
  attendees: number;
  registered: number;
  capacity: number;
  prizePool: number;
  agenda: string[];
  sponsors: string[];
  registrationUrl: string;
  description: string;
  tags: string[];
  free: boolean;
}

interface Application {
  id: string;
  type: ApplyType;
  company: string;
  contact: string;
  email: string;
  phone: string;
  region: string;
  stage: ApplyStage;
  submittedAt: string;
  updatedAt: string;
  progress: number;
  description: string;
  materials: string[];
  reviewer: string;
  timeline: { stage: ApplyStage; timestamp: string; note: string }[];
  expectedValue: string;
  budget: number;
}

interface KpiSnapshot {
  onlineNodes: number;
  totalNodes: number;
  activePartners: number;
  liquidityProviders: number;
  totalLiquidity: number;
  fundCount: number;
  fundAum: number;
  pendingApplications: number;
  eventAttendees: number;
  blockHeight: number;
  networkTps: number;
  ecosystemGrowth: number;
}

interface DrawerState {
  open: boolean;
  type: DrawerType;
  payload: string | null;
}

// ============== Mock 数据 ==============

const NODES: Node[] = [
  {
    id: 'n-001', name: 'zs-validator-shanghai-01', type: 'validator', status: 'online', region: '亚太', country: '中国', city: '上海',
    ip: '203.0.113.***', version: 'v1.18.2', uptime: 99.98, blockHeight: 18426820, peers: 86, cpu: 32, memory: 48, network: 1240,
    stake: 1200000, reward: 184, joinedAt: '2024-08-15', operator: '中萨数字科技', description: '主验证节点，亚太核心',
    region2: 'CN-East', jurisdiction: '中国大陆（合规研究方向）', audit: 'SlowMist / CertiK', features: ['出块', '验证', '治理投票'],
  },
  {
    id: 'n-002', name: 'zs-validator-singapore-01', type: 'validator', status: 'online', region: '亚太', country: '新加坡', city: '新加坡',
    ip: '198.51.100.***', version: 'v1.18.2', uptime: 99.95, blockHeight: 18426818, peers: 78, cpu: 28, memory: 42, network: 980,
    stake: 980000, reward: 152, joinedAt: '2024-09-02', operator: 'PacificNode Pte Ltd', description: '新加坡合规研究方向节点',
    region2: 'SG-Central', jurisdiction: '新加坡（合规研究方向）', audit: 'SlowMist', features: ['出块', '验证', '合规研究方向'],
  },
  {
    id: 'n-003', name: 'zs-rpc-frankfurt-01', type: 'rpc', status: 'online', region: '欧洲', country: '德国', city: '法兰克福',
    ip: '192.0.2.***', version: 'v1.18.2', uptime: 99.99, blockHeight: 18426820, peers: 124, cpu: 45, memory: 62, network: 1840,
    stake: 0, reward: 0, joinedAt: '2024-10-10', operator: 'EuroCloud GmbH', description: 'RPC 公共接入节点（欧洲）',
    region2: 'EU-Central', jurisdiction: '德国（合规研究方向）', audit: 'CertiK', features: ['RPC', 'WebSocket', '归档'],
  },
  {
    id: 'n-004', name: 'zs-rpc-tokyo-01', type: 'rpc', status: 'online', region: '亚太', country: '日本', city: '东京',
    ip: '198.18.***', version: 'v1.18.2', uptime: 99.92, blockHeight: 18426819, peers: 102, cpu: 38, memory: 55, network: 1480,
    stake: 0, reward: 0, joinedAt: '2024-11-05', operator: 'SakuraNode K.K.', description: 'RPC 公共接入节点（亚太）',
    region2: 'JP-East', jurisdiction: '日本（合规研究方向）', audit: 'SlowMist', features: ['RPC', 'WebSocket'],
  },
  {
    id: 'n-005', name: 'zs-super-newyork-01', type: 'super', status: 'online', region: '北美', country: '美国', city: '纽约',
    ip: '192.168.***', version: 'v1.18.2', uptime: 99.97, blockHeight: 18426820, peers: 96, cpu: 52, memory: 68, network: 2120,
    stake: 2200000, reward: 342, joinedAt: '2024-07-20', operator: 'LibertyNode Inc.', description: '超级节点（北美）',
    region2: 'US-East', jurisdiction: '美国（合规研究方向）', audit: 'CertiK / Quantstamp', features: ['出块', '验证', '治理', '高性能'],
  },
  {
    id: 'n-006', name: 'zs-backup-stockholm-01', type: 'backup', status: 'syncing', region: '欧洲', country: '瑞典', city: '斯德哥尔摩',
    ip: '198.51.100.***', version: 'v1.18.2', uptime: 99.85, blockHeight: 18426810, peers: 68, cpu: 22, memory: 38, network: 760,
    stake: 320000, reward: 48, joinedAt: '2025-01-18', operator: 'NordicNode AB', description: '冷备份节点（北欧）',
    region2: 'EU-North', jurisdiction: '瑞典（合规研究方向）', audit: 'SlowMist', features: ['备份', '灾备'],
  },
  {
    id: 'n-007', name: 'zs-edge-singapore-02', type: 'edge', status: 'online', region: '亚太', country: '新加坡', city: '新加坡',
    ip: '203.0.113.***', version: 'v1.18.2', uptime: 99.88, blockHeight: 18426818, peers: 56, cpu: 18, memory: 32, network: 580,
    stake: 0, reward: 0, joinedAt: '2025-03-12', operator: 'PacificNode Pte Ltd', description: '边缘节点',
    region2: 'SG-Central', jurisdiction: '新加坡（合规研究方向）', audit: 'SlowMist', features: ['边缘计算', 'CDN'],
  },
  {
    id: 'n-008', name: 'zs-archive-zurich-01', type: 'archive', status: 'online', region: '欧洲', country: '瑞士', city: '苏黎世',
    ip: '192.0.2.***', version: 'v1.18.2', uptime: 99.99, blockHeight: 18426820, peers: 88, cpu: 35, memory: 78, network: 1120,
    stake: 0, reward: 0, joinedAt: '2024-12-08', operator: 'AlpineArchive AG', description: '归档节点（历史数据）',
    region2: 'EU-Central', jurisdiction: '瑞士（合规研究方向）', audit: 'CertiK', features: ['归档', '历史数据'],
  },
  {
    id: 'n-009', name: 'zs-validator-dubai-01', type: 'validator', status: 'maintenance', region: '中东', country: '阿联酋', city: '迪拜',
    ip: '198.18.***', version: 'v1.18.1', uptime: 99.65, blockHeight: 18426800, peers: 72, cpu: 15, memory: 28, network: 480,
    stake: 680000, reward: 102, joinedAt: '2025-02-20', operator: 'GulfNode FZ-LLC', description: '中东验证节点（升级维护中）',
    region2: 'ME-Central', jurisdiction: '阿联酋（合规研究方向）', audit: 'CertiK', features: ['出块', '验证'],
  },
  {
    id: 'n-010', name: 'zs-rpc-saopaulo-01', type: 'rpc', status: 'online', region: '南美', country: '巴西', city: '圣保罗',
    ip: '192.0.2.***', version: 'v1.18.2', uptime: 99.78, blockHeight: 18426818, peers: 64, cpu: 25, memory: 44, network: 720,
    stake: 0, reward: 0, joinedAt: '2025-04-15', operator: 'BrasilNode Ltda', description: 'RPC 公共接入节点（南美）',
    region2: 'SA-East', jurisdiction: '巴西（合规研究方向）', audit: 'Quantstamp', features: ['RPC', 'WebSocket'],
  },
];

const PARTNERS: Partner[] = [
  {
    id: 'p-001', name: '全球领先公链联盟', category: 'institution', level: 'platinum', logo: '🌐', region: '全球', country: '多地区',
    joinedAt: '2024-06-01', description: '战略合作机构，共同推进数字资产生态发展', highlights: ['战略合作', '联合研究', '生态基金'],
    integrations: ['API 接入', 'OTC 通道', 'Launch 联合'], contact: 'bd@partner-001.example.com', website: 'partner-001.example.com',
    employees: 5000, founded: 2014, cooperationAreas: ['生态基金', '机构服务', '项目孵化'], caseStudy: '联合发行 5 个项目，累计募集 2.4 亿 USDT',
  },
  {
    id: 'p-002', name: '区块链媒体集团', category: 'media', level: 'gold', logo: '📰', region: '亚太', country: '中国',
    joinedAt: '2024-08-12', description: '专业区块链媒体战略合作伙伴', highlights: ['品牌曝光', 'AMA 直播', '内容共创'],
    integrations: ['品牌合作', 'AMA', '快讯'], contact: 'bd@partner-002.example.com', website: 'partner-002.example.com',
    employees: 200, founded: 2018, cooperationAreas: ['媒体推广', 'AMA', '内容'], caseStudy: '全年联合 AMA 24 场，累计观看 120 万+',
  },
  {
    id: 'p-003', name: 'Web3 钱包服务', category: 'wallet', level: 'platinum', logo: '👛', region: '全球', country: '多地区',
    joinedAt: '2024-05-20', description: 'Web3 钱包生态合作，覆盖 8000 万用户', highlights: ['钱包集成', 'DApp 浏览器', '跨链'],
    integrations: ['钱包接入', 'DApp 浏览器', '跨链桥'], contact: 'bd@partner-003.example.com', website: 'partner-003.example.com',
    employees: 800, founded: 2017, cooperationAreas: ['钱包集成', 'DApp', '跨链'], caseStudy: '日活 120 万，钱包内资产 8.6 亿 USDT',
  },
  {
    id: 'p-004', name: '智能合约审计', category: 'audit', level: 'gold', logo: '🔒', region: '全球', country: '美国',
    joinedAt: '2024-09-08', description: '顶尖智能合约审计机构', highlights: ['合约审计', '安全评级', '漏洞披露'],
    integrations: ['审计服务', '评级系统'], contact: 'bd@partner-004.example.com', website: 'partner-004.example.com',
    employees: 150, founded: 2017, cooperationAreas: ['审计', '安全', '漏洞披露'], caseStudy: '累计审计 1800+ 合约，发现 86 个高危漏洞',
  },
  {
    id: 'p-005', name: '区块链浏览器', category: 'tech', level: 'gold', logo: '🔍', region: '全球', country: '多地区',
    joinedAt: '2024-07-15', description: '主流区块链浏览器', highlights: ['区块浏览', 'API 服务', '数据分析'],
    integrations: ['区块浏览', 'API', '数据服务'], contact: 'bd@partner-005.example.com', website: 'partner-005.example.com',
    employees: 120, founded: 2018, cooperationAreas: ['区块浏览', 'API', '数据'], caseStudy: '日均查询 240 万次，API 调用 8000 万/日',
  },
  {
    id: 'p-006', name: '链上数据分析', category: 'tech', level: 'silver', logo: '📊', region: '全球', country: '新加坡',
    joinedAt: '2024-10-22', description: '链上数据分析与可视化', highlights: ['链上数据', '可视化', 'API'],
    integrations: ['数据 API', '标签服务'], contact: 'bd@partner-006.example.com', website: 'partner-006.example.com',
    employees: 80, founded: 2019, cooperationAreas: ['数据', '标签', '可视化'], caseStudy: '标签覆盖 8.4 亿地址，API 调用 500 万/日',
  },
  {
    id: 'p-007', name: '预言机网络', category: 'oracle', level: 'platinum', logo: '🔮', region: '全球', country: '多地区',
    joinedAt: '2024-04-12', description: '去中心化预言机网络', highlights: ['价格喂价', '链下数据', 'VRF'],
    integrations: ['价格喂价', 'VRF', '链下数据'], contact: 'bd@partner-007.example.com', website: 'partner-007.example.com',
    employees: 600, founded: 2017, cooperationAreas: ['喂价', 'VRF', '链下数据'], caseStudy: '日均喂价 12 亿次，覆盖 80+ 公链',
  },
  {
    id: 'p-008', name: '跨链桥协议', category: 'cross-chain', level: 'gold', logo: '🌉', region: '全球', country: '多地区',
    joinedAt: '2024-11-05', description: '主流跨链桥协议', highlights: ['跨链转账', '资产映射', '多链支持'],
    integrations: ['跨链桥', '资产映射'], contact: 'bd@partner-008.example.com', website: 'partner-008.example.com',
    employees: 200, founded: 2020, cooperationAreas: ['跨链', '资产映射'], caseStudy: '累计跨链金额 280 亿 USDT，覆盖 18 条公链',
  },
  {
    id: 'p-009', name: 'Web3 开发者社区', category: 'community', level: 'bronze', logo: '👥', region: '亚太', country: '中国',
    joinedAt: '2025-01-18', description: 'Web3 开发者社区', highlights: ['开发者活动', '技术分享', '开源贡献'],
    integrations: ['社区合作', '技术活动'], contact: 'bd@partner-009.example.com', website: 'partner-009.example.com',
    employees: 30, founded: 2020, cooperationAreas: ['社区', '开发者', '开源'], caseStudy: '注册开发者 5.6 万人，活跃项目 240+',
  },
  {
    id: 'p-010', name: '区块链加速器', category: 'institution', level: 'gold', logo: '🚀', region: '全球', country: '多地区',
    joinedAt: '2024-12-01', description: '知名区块链加速器', highlights: ['项目孵化', '投资', '导师'],
    integrations: ['孵化合作', '项目筛选'], contact: 'bd@partner-010.example.com', website: 'partner-010.example.com',
    employees: 60, founded: 2018, cooperationAreas: ['孵化', '投资', '导师'], caseStudy: '累计孵化 120 个项目，存活率 78%',
  },
];

const LIQUIDITY: LiquidityProvider[] = [
  {
    id: 'l-001', name: 'Alphanonce Global Markets', type: 'orderbook', region: '全球', pairs: 184, dailyVolume: 1.8e9,
    spread: 0.0002, uptime: 99.99, joinedAt: '2024-03-15', description: '顶级做市商',
    contacts: 'mm@alphanonce.example.com', makerRebate: -0.0001, takerFee: 0.0004, minTrade: 10000,
    riskControl: ['风控 API', '熔断机制', '敞口管理'],
  },
  {
    id: 'l-002', name: 'GSR Markets', type: 'orderbook', region: '全球', pairs: 142, dailyVolume: 1.2e9,
    spread: 0.0003, uptime: 99.97, joinedAt: '2024-05-20', description: '专业加密做市商',
    contacts: 'mm@gsr.example.com', makerRebate: -0.0001, takerFee: 0.0004, minTrade: 5000,
    riskControl: ['敞口管理', '风险限额'],
  },
  {
    id: 'l-003', name: 'Flow Traders', type: 'orderbook', region: '欧洲', pairs: 98, dailyVolume: 8.5e8,
    spread: 0.0004, uptime: 99.95, joinedAt: '2024-07-08', description: '欧洲做市商',
    contacts: 'mm@flowtraders.example.com', makerRebate: -0.0002, takerFee: 0.0005, minTrade: 5000,
    riskControl: ['熔断', '敞口'],
  },
  {
    id: 'l-004', name: 'Wintermute', type: 'orderbook', region: '全球', pairs: 156, dailyVolume: 1.5e9,
    spread: 0.0003, uptime: 99.98, joinedAt: '2024-04-22', description: '算法做市商',
    contacts: 'mm@wintermute.example.com', makerRebate: -0.0001, takerFee: 0.0004, minTrade: 10000,
    riskControl: ['算法风控', '熔断'],
  },
  {
    id: 'l-005', name: 'Cumberland', type: 'rfq', region: '全球', pairs: 64, dailyVolume: 2.4e9,
    spread: 0.0001, uptime: 99.99, joinedAt: '2024-06-10', description: '场外大宗做市',
    contacts: 'mm@cumberland.example.com', makerRebate: 0, takerFee: 0.0002, minTrade: 100000,
    riskControl: ['RFQ 风控', '信用评估'],
  },
  {
    id: 'l-006', name: 'B2C2', type: 'rfq', region: '全球', pairs: 48, dailyVolume: 1.6e9,
    spread: 0.0001, uptime: 99.97, joinedAt: '2024-08-18', description: 'OTC 做市商',
    contacts: 'mm@b2c2.example.com', makerRebate: 0, takerFee: 0.0002, minTrade: 50000,
    riskControl: ['信用管理', '敞口控制'],
  },
];

const FUNDS: Fund[] = [
  {
    id: 'f-001', name: 'Paradigm', type: 'vc', aum: 8.5e9, focus: ['DeFi', '基础设施', 'L2'], region: '北美', country: '美国',
    portfolio: 124, invested: 4.2e9, averageCheck: 35e6, stages: ['种子', '战略', 'A 轮', 'B 轮'],
    contact: 'partner@paradigm.example.com', joinedAt: '2024-04-12', description: '顶级加密 VC',
    partners: ['红杉', 'a16z'], thesis: '支持下一代加密基础设施和 DeFi 协议',
  },
  {
    id: 'f-002', name: 'Andreessen Horowitz (a16z)', type: 'vc', aum: 35e9, focus: ['加密', 'Web3', 'AI'], region: '北美', country: '美国',
    portfolio: 86, invested: 7.8e9, averageCheck: 80e6, stages: ['A 轮', 'B 轮', 'C 轮'],
    contact: 'partner@a16z.example.com', joinedAt: '2024-03-22', description: '顶级综合 VC（含加密专项）',
    partners: ['Paradigm'], thesis: '构建下一代互联网与金融基础设施',
  },
  {
    id: 'f-003', name: '红杉资本中国', type: 'vc', aum: 60e9, focus: ['科技', '消费', '金融科技'], region: '亚太', country: '中国',
    portfolio: 1200, invested: 18e9, averageCheck: 25e6, stages: ['A 轮', 'B 轮', 'C 轮', 'D 轮'],
    contact: 'partner@sequoiacap.example.com', joinedAt: '2024-05-18', description: '顶级综合 VC',
    partners: ['IDG', '高瓴'], thesis: '发掘并陪伴伟大的科技创业者',
  },
  {
    id: 'f-004', name: 'Dragonfly Capital', type: 'vc', aum: 4.2e9, focus: ['加密', 'DeFi', 'Web3'], region: '全球', country: '多地区',
    portfolio: 156, invested: 1.8e9, averageCheck: 12e6, stages: ['种子', 'A 轮', '战略'],
    contact: 'partner@dragonfly.example.com', joinedAt: '2024-06-30', description: '加密专项 VC',
    partners: ['Paradigm'], thesis: '专注加密原生项目',
  },
  {
    id: 'f-005', name: 'Binance Labs', type: 'strat', aum: 7.5e9, focus: ['基础设施', 'DeFi', 'Web3'], region: '全球', country: '多地区',
    portfolio: 220, invested: 3.4e9, averageCheck: 15e6, stages: ['种子', '战略', 'A 轮'],
    contact: 'partner@binancelabs.example.com', joinedAt: '2024-07-08', description: '战略投资部门',
    partners: ['Coinbase Ventures'], thesis: '推动 Web3 大规模采用',
  },
  {
    id: 'f-006', name: 'Conflux Eco Fund', type: 'foundation', aum: 1.2e8, focus: ['树图生态', 'DApp', '基础设施'], region: '亚太', country: '新加坡',
    portfolio: 42, invested: 86e6, averageCheck: 2e6, stages: ['种子', 'A 轮', '战略'],
    contact: 'eco@conflux.example.com', joinedAt: '2024-09-15', description: '树图生态基金',
    partners: ['Conflux Foundation'], thesis: '培育树图生态优质项目',
  },
  {
    id: 'f-007', name: 'HashKey Capital', type: 'vc', aum: 3.8e9, focus: ['区块链', '金融', 'Web3'], region: '亚太', country: '香港',
    portfolio: 180, invested: 2.4e9, averageCheck: 18e6, stages: ['A 轮', 'B 轮', '战略'],
    contact: 'partner@hashkey.example.com', joinedAt: '2024-08-22', description: '亚洲知名加密 VC',
    partners: ['红杉中国'], thesis: '链接传统金融与加密世界',
  },
  {
    id: 'f-008', name: 'Web3 加速器 Genesis', type: 'accelerator', aum: 5e7, focus: ['早期项目', '黑客松', '孵化'], region: '全球', country: '多地区',
    portfolio: 320, invested: 48e6, averageCheck: 150e3, stages: ['种子前', '种子'],
    contact: 'apply@genesis.example.com', joinedAt: '2024-10-08', description: 'Web3 创业加速器',
    partners: ['Coinbase', 'GitHub'], thesis: '12 周加速，黑客松驱动',
  },
];

const EVENTS: EcoEvent[] = [
  {
    id: 'e-001', title: '2026 上海 Web3 黑客松', type: 'hackathon', status: 'registration', startDate: '2026-08-15',
    endDate: '2026-08-17', city: '上海', country: '中国', online: false, organizer: '中萨数字科技 + Conflux',
    attendees: 480, registered: 280, capacity: 500, prizePool: 50e4, agenda: ['Day 1 开幕', 'Day 2 黑客松', 'Day 3 决赛颁奖'],
    sponsors: ['中萨数字科技', 'Conflux', 'Dragonfly'], registrationUrl: 'https://event.example.com/hackathon-2026-shanghai',
    description: '聚焦 RWA / DePIN / AI Agent 的 Web3 黑客松，奖金 500 万 USDT', tags: ['黑客松', 'RWA', 'DePIN', 'AI'], free: true,
  },
  {
    id: 'e-002', title: '新加坡合规研究方向论坛', type: 'conference', status: 'upcoming', startDate: '2026-09-10',
    endDate: '2026-09-12', city: '新加坡', country: '新加坡', online: false, organizer: 'ZBSDEX 全球合规研究联盟',
    attendees: 1200, registered: 680, capacity: 1500, prizePool: 0, agenda: ['主旨演讲', '圆桌论坛', '分论坛'],
    sponsors: ['中萨数字科技', 'HashKey'], registrationUrl: 'https://event.example.com/sg-2026',
    description: '聚焦全球合规研究方向的行业论坛', tags: ['合规', '监管', '论坛'], free: false,
  },
  {
    id: 'e-003', title: '东京 Meetup：Layer 2 与跨链', type: 'meetup', status: 'upcoming', startDate: '2026-08-05',
    endDate: '2026-08-05', city: '东京', country: '日本', online: false, organizer: '中萨数字科技 + SakuraNode',
    attendees: 150, registered: 86, capacity: 200, prizePool: 0, agenda: ['主题分享', '自由交流'],
    sponsors: ['中萨数字科技'], registrationUrl: 'https://event.example.com/tokyo-2026',
    description: 'L2 与跨链主题开发者 Meetup', tags: ['L2', '跨链', '开发者'], free: true,
  },
  {
    id: 'e-004', title: '项目方 AMA 第 24 期：AI Agent', type: 'ama', status: 'live', startDate: '2026-07-19',
    endDate: '2026-07-19', city: '线上', country: '线上', online: true, organizer: '中萨数字科技学院',
    attendees: 8500, registered: 0, capacity: 10000, prizePool: 0, agenda: ['项目介绍', 'Q&A'],
    sponsors: ['中萨数字科技'], registrationUrl: 'https://event.example.com/ama-024',
    description: '项目方 AMA 直播：AI Agent 在数字资产场景的应用', tags: ['AMA', 'AI', 'Agent'], free: true,
  },
  {
    id: 'e-005', title: '迪拜 Web3 峰会', type: 'conference', status: 'upcoming', startDate: '2026-10-20',
    endDate: '2026-10-22', city: '迪拜', country: '阿联酋', online: false, organizer: 'GulfNode FZ-LLC',
    attendees: 800, registered: 320, capacity: 1000, prizePool: 0, agenda: ['峰会', '展览', 'B2B 配对'],
    sponsors: ['GulfNode', '中萨数字科技'], registrationUrl: 'https://event.example.com/dubai-2026',
    description: '中东 Web3 行业峰会（中萨作为观察方向参与）', tags: ['峰会', 'B2B'], free: false,
  },
  {
    id: 'e-006', title: 'RWA 实战工作坊', type: 'workshop', status: 'ended', startDate: '2026-06-20',
    endDate: '2026-06-22', city: '线上', country: '线上', online: true, organizer: '中萨数字科技学院',
    attendees: 2400, registered: 0, capacity: 3000, prizePool: 0, agenda: ['RWA 原理', '实操', '答疑'],
    sponsors: ['中萨数字科技'], registrationUrl: 'https://event.example.com/rwa-2026',
    description: 'RWA 实战工作坊回放', tags: ['RWA', '工作坊'], free: true,
  },
  {
    id: 'e-007', title: 'Demo Day 2026 春季', type: 'demo-day', status: 'ended', startDate: '2026-05-18',
    endDate: '2026-05-18', city: '旧金山', country: '美国', online: false, organizer: 'Web3 加速器 Genesis',
    attendees: 680, registered: 0, capacity: 800, prizePool: 5e5, agenda: ['项目路演', '投资人配对'],
    sponsors: ['Genesis', 'Coinbase'], registrationUrl: 'https://event.example.com/demo-day-2026-spring',
    description: '加速器项目路演 Demo Day', tags: ['Demo Day', '路演'], free: false,
  },
];

const APPLICATIONS: Application[] = [
  {
    id: 'a-001', type: 'partner', company: '某跨链协议', contact: '李**', email: 'bd@***.example.com', phone: '+86 138****8888',
    region: '亚太', stage: 'review', submittedAt: '2026-07-05', updatedAt: '2026-07-15', progress: 35,
    description: '申请成为跨链桥合作方', materials: ['公司介绍', '技术白皮书', '安全审计报告'],
    reviewer: '张老师', timeline: [
      { stage: 'submitted', timestamp: '2026-07-05 10:00', note: '申请提交' },
      { stage: 'review', timestamp: '2026-07-15 14:30', note: '初审进行中' },
    ],
    expectedValue: '扩展跨链业务', budget: 0,
  },
  {
    id: 'a-002', type: 'node', company: 'PacificNode Pte Ltd', contact: 'Tan ****', email: 'ops@***.example.com', phone: '+65 ****5678',
    region: '亚太', stage: 'contract', submittedAt: '2026-06-12', updatedAt: '2026-07-12', progress: 65,
    description: '申请成为新加坡区域节点', materials: ['公司注册证', '合规承诺', '节点方案'],
    reviewer: '王老师', timeline: [
      { stage: 'submitted', timestamp: '2026-06-12 09:00', note: '申请提交' },
      { stage: 'review', timestamp: '2026-06-20 11:00', note: '初审通过' },
      { stage: 'due-diligence', timestamp: '2026-06-28 15:00', note: '尽调完成' },
      { stage: 'contract', timestamp: '2026-07-12 16:00', note: '合同签约中' },
    ],
    expectedValue: '新加坡合规研究方向节点', budget: 8e5,
  },
  {
    id: 'a-003', type: 'liquidity', company: 'GSR Markets', contact: 'Chen ****', email: 'mm@***.example.com', phone: '+1 ***-***-1234',
    region: '全球', stage: 'launched', submittedAt: '2026-04-08', updatedAt: '2026-06-22', progress: 100,
    description: '申请成为做市商', materials: ['公司介绍', '做市方案', '风控说明'],
    reviewer: '陈老师', timeline: [
      { stage: 'submitted', timestamp: '2026-04-08 10:00', note: '申请提交' },
      { stage: 'review', timestamp: '2026-04-15 11:00', note: '初审通过' },
      { stage: 'due-diligence', timestamp: '2026-04-25 14:00', note: '尽调完成' },
      { stage: 'contract', timestamp: '2026-05-10 16:00', note: '合同签约' },
      { stage: 'integration', timestamp: '2026-05-28 12:00', note: '技术对接完成' },
      { stage: 'launched', timestamp: '2026-06-22 09:00', note: '正式上线做市' },
    ],
    expectedValue: '增加主流币对流动性', budget: 5e6,
  },
  {
    id: 'a-004', type: 'fund', company: '某加密 VC', contact: '孙**', email: 'partner@***.example.com', phone: '+86 138****9999',
    region: '亚太', stage: 'due-diligence', submittedAt: '2026-07-08', updatedAt: '2026-07-18', progress: 50,
    description: '申请生态基金合作', materials: ['基金介绍', '投资策略', '过往业绩'],
    reviewer: '刘老师', timeline: [
      { stage: 'submitted', timestamp: '2026-07-08 10:00', note: '申请提交' },
      { stage: 'review', timestamp: '2026-07-12 14:00', note: '初审通过' },
      { stage: 'due-diligence', timestamp: '2026-07-18 11:00', note: '尽调进行中' },
    ],
    expectedValue: '联合投资项目', budget: 2e8,
  },
  {
    id: 'a-005', type: 'media', company: '某区块链媒体', contact: '周**', email: 'media@***.example.com', phone: '+86 138****6666',
    region: '亚太', stage: 'submitted', submittedAt: '2026-07-17', updatedAt: '2026-07-17', progress: 10,
    description: '申请成为媒体合作方', materials: ['媒体介绍', '合作方案'],
    reviewer: '待分配', timeline: [
      { stage: 'submitted', timestamp: '2026-07-17 16:00', note: '申请提交，等待初审' },
    ],
    expectedValue: '扩大品牌曝光', budget: 0,
  },
  {
    id: 'a-006', type: 'community', company: '某 Web3 社区', contact: '钱**', email: 'community@***.example.com', phone: '+86 138****3333',
    region: '亚太', stage: 'integration', submittedAt: '2026-05-22', updatedAt: '2026-07-08', progress: 80,
    description: '申请成为社区合作方', materials: ['社区介绍', '活动方案'],
    reviewer: '赵老师', timeline: [
      { stage: 'submitted', timestamp: '2026-05-22 10:00', note: '申请提交' },
      { stage: 'review', timestamp: '2026-05-30 14:00', note: '初审通过' },
      { stage: 'due-diligence', timestamp: '2026-06-08 11:00', note: '尽调完成' },
      { stage: 'contract', timestamp: '2026-06-22 16:00', note: '合同签约' },
      { stage: 'integration', timestamp: '2026-07-08 10:00', note: '技术对接中' },
    ],
    expectedValue: '联合举办社区活动', budget: 1e6,
  },
];

// ============== 工具函数 ==============

const formatNumber = (n: number): string => {
  if (n >= 1e9) return (n / 1e9).toFixed(2) + ' B';
  if (n >= 1e6) return (n / 1e6).toFixed(2) + ' M';
  if (n >= 1e4) return (n / 1e4).toFixed(2) + ' 万';
  return n.toLocaleString('zh-CN');
};

const formatCurrency = (n: number): string => {
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)} B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)} M`;
  if (n >= 1e4) return `$${(n / 1e4).toFixed(2)} 万`;
  return `$${n.toLocaleString('zh-CN')}`;
};

const formatPercent = (n: number, digits = 2): string => `${n.toFixed(digits)}%`;

const NODE_TYPE_MAP: Record<NodeType, { label: string; color: string; icon: any }> = {
  validator: { label: '验证节点', color: BRAND.primary, icon: ShieldCheck },
  rpc: { label: 'RPC 节点', color: BRAND.info, icon: Server },
  super: { label: '超级节点', color: '#a855f7', icon: Crown },
  backup: { label: '备份节点', color: BRAND.textSub, icon: Database },
  edge: { label: '边缘节点', color: BRAND.warning, icon: Network },
  archive: { label: '归档节点', color: BRAND.success, icon: Database },
};

const NODE_STATUS_MAP: Record<NodeStatus, { label: string; color: string; bg: string }> = {
  online: { label: '在线', color: BRAND.success, bg: BRAND.successLt },
  syncing: { label: '同步中', color: BRAND.info, bg: BRAND.infoLt },
  offline: { label: '离线', color: BRAND.danger, bg: BRAND.dangerLt },
  jailed: { label: '监禁', color: BRAND.warning, bg: BRAND.warningLt },
  slashed: { label: '处罚', color: BRAND.danger, bg: BRAND.dangerLt },
  maintenance: { label: '维护', color: BRAND.textSub, bg: 'rgba(176, 176, 176, 0.10)' },
};

const PARTNER_CATEGORY_MAP: Record<PartnerCategory, { label: string; color: string }> = {
  institution: { label: '机构', color: '#a855f7' },
  tech: { label: '技术', color: BRAND.info },
  media: { label: '媒体', color: BRAND.warning },
  community: { label: '社区', color: BRAND.success },
  audit: { label: '审计', color: BRAND.danger },
  wallet: { label: '钱包', color: BRAND.primary },
  oracle: { label: '预言机', color: '#f59e0b' },
  'cross-chain': { label: '跨链', color: '#06b6d4' },
};

const PARTNER_LEVEL_MAP: Record<PartnerLevel, { label: string; color: string; bg: string }> = {
  platinum: { label: '🥇 白金', color: '#e5e7eb', bg: 'rgba(229, 231, 235, 0.12)' },
  gold: { label: '🥇 金牌', color: '#fbbf24', bg: 'rgba(251, 191, 36, 0.12)' },
  silver: { label: '🥈 银牌', color: '#cbd5e1', bg: 'rgba(203, 213, 225, 0.12)' },
  bronze: { label: '🥉 铜牌', color: '#d97706', bg: 'rgba(217, 119, 6, 0.12)' },
  community: { label: '👥 社区', color: BRAND.primary, bg: BRAND.primaryLt },
};

const LIQUIDITY_TYPE_MAP: Record<LiquidityType, { label: string; color: string }> = {
  spot: { label: '现货做市', color: BRAND.primary },
  perp: { label: '永续做市', color: BRAND.info },
  amm: { label: 'AMM 池', color: BRAND.warning },
  orderbook: { label: '订单簿', color: BRAND.success },
  clob: { label: '中央限价', color: '#a855f7' },
  rfq: { label: 'RFQ 大宗', color: BRAND.danger },
};

const FUND_TYPE_MAP: Record<FundType, { label: string; color: string }> = {
  vc: { label: 'VC 基金', color: '#a855f7' },
  accelerator: { label: '加速器', color: BRAND.primary },
  angel: { label: '天使投资', color: BRAND.info },
  grant: { label: 'Grant 资助', color: BRAND.success },
  foundation: { label: '基金会', color: BRAND.warning },
  strat: { label: '战略投资', color: BRAND.danger },
};

const EVENT_TYPE_MAP: Record<EventType, { label: string; color: string; icon: any }> = {
  hackathon: { label: '黑客松', color: BRAND.primary, icon: Code2 },
  meetup: { label: 'Meetup', color: BRAND.info, icon: Users },
  ama: { label: 'AMA', color: BRAND.success, icon: MessageCircle },
  workshop: { label: '工作坊', color: BRAND.warning, icon: BookOpen },
  conference: { label: '峰会', color: '#a855f7', icon: Building2 },
  online: { label: '线上活动', color: BRAND.danger, icon: Video },
  'demo-day': { label: 'Demo Day', color: BRAND.success, icon: Rocket },
};

const EVENT_STATUS_MAP: Record<EventStatus, { label: string; color: string; bg: string }> = {
  upcoming: { label: '即将开始', color: BRAND.info, bg: BRAND.infoLt },
  registration: { label: '报名中', color: BRAND.success, bg: BRAND.successLt },
  live: { label: '进行中', color: BRAND.danger, bg: BRAND.dangerLt },
  ended: { label: '已结束', color: BRAND.textSub, bg: 'rgba(176, 176, 176, 0.10)' },
  cancelled: { label: '已取消', color: BRAND.textMute, bg: 'rgba(112, 112, 112, 0.08)' },
};

const APPLY_TYPE_MAP: Record<ApplyType, { label: string; color: string; icon: any }> = {
  node: { label: '节点申请', color: BRAND.primary, icon: Server },
  partner: { label: '伙伴申请', color: '#a855f7', icon: Handshake },
  liquidity: { label: '流动性申请', color: BRAND.info, icon: Coins },
  fund: { label: '基金合作', color: BRAND.warning, icon: CircleDollarSign },
  media: { label: '媒体申请', color: BRAND.success, icon: Megaphone },
  tech: { label: '技术合作', color: '#06b6d4', icon: Code2 },
  community: { label: '社区合作', color: BRAND.danger, icon: Users },
  other: { label: '其他', color: BRAND.textSub, icon: HelpCircle },
};

const APPLY_STAGE_MAP: Record<ApplyStage, { label: string; color: string; progress: number }> = {
  submitted: { label: '已提交', color: BRAND.info, progress: 10 },
  review: { label: '初审中', color: BRAND.primary, progress: 25 },
  'due-diligence': { label: '尽职调查', color: BRAND.warning, progress: 45 },
  contract: { label: '合同签约', color: '#a855f7', progress: 65 },
  integration: { label: '对接中', color: '#06b6d4', progress: 80 },
  launched: { label: '已上线', color: BRAND.success, progress: 100 },
  rejected: { label: '已驳回', color: BRAND.danger, progress: 0 },
};

const useCountUp = (target: number, duration = 1000): number => {
  const [value, setValue] = useState(target);
  const prev = useRef(target);
  useEffect(() => {
    const start = prev.current;
    const change = target - start;
    const startTime = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(start + change * eased);
      if (progress < 1) raf = requestAnimationFrame(tick);
      else prev.current = target;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return value;
};

interface KpiCardProps {
  label: string;
  value: number;
  format?: 'number' | 'currency' | 'percent';
  icon: any;
  color?: string;
  hint?: string;
  live?: boolean;
}

function KpiCard({ label, value, format = 'number', icon: Icon, color = BRAND.primary, hint, live = false }: KpiCardProps) {
  const animated = useCountUp(value, 800);
  const formatted = useMemo(() => {
    if (format === 'currency') return formatCurrency(animated);
    if (format === 'percent') return formatPercent(animated);
    return formatNumber(Math.round(animated));
  }, [animated, format]);

  return (
    <div
      className="rounded-xl p-4 transition-all duration-300 hover:scale-[1.02]"
      style={{
        backgroundColor: BRAND.bgCard,
        border: `1px solid ${BRAND.border}`,
        boxShadow: BRAND.shadow,
      }}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: `${color}20`, color }}
          >
            <Icon className="w-5 h-5" />
          </div>
          <div className="text-sm" style={{ color: BRAND.textSub }}>
            {label}
          </div>
        </div>
        {live && (
          <span
            className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded"
            style={{ backgroundColor: BRAND.dangerLt, color: BRAND.danger }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full animate-pulse"
              style={{ backgroundColor: BRAND.danger }}
            />
            LIVE
          </span>
        )}
      </div>
      <div className="text-2xl font-semibold mb-1" style={{ color: BRAND.text }}>
        {formatted}
      </div>
      {hint && (
        <div className="text-[11px]" style={{ color: BRAND.textMute }}>
          {hint}
        </div>
      )}
    </div>
  );
}

export function PortalEcosystem() {
  const [tab, setTab] = useState<Tab>('overview');
  const [search, setSearch] = useState('');
  const [nodeTypeFilter, setNodeTypeFilter] = useState<NodeType | 'all'>('all');
  const [partnerCategoryFilter, setPartnerCategoryFilter] = useState<PartnerCategory | 'all'>('all');
  const [partnerLevelFilter, setPartnerLevelFilter] = useState<PartnerLevel | 'all'>('all');
  const [eventStatusFilter, setEventStatusFilter] = useState<EventStatus | 'all'>('all');
  const [applyStageFilter, setApplyStageFilter] = useState<ApplyStage | 'all'>('all');
  const [sortBy, setSortBy] = useState<'updated' | 'name' | 'value'>('updated');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [drawer, setDrawer] = useState<DrawerState>({ open: false, type: null, payload: null });
  const [helpOpen, setHelpOpen] = useState(false);
  const [applyStep, setApplyStep] = useState(0);
  const [applyType, setApplyType] = useState<ApplyType>('partner');
  const [applyCompany, setApplyCompany] = useState('');
  const [applyContact, setApplyContact] = useState('');
  const [applyEmail, setApplyEmail] = useState('');
  const [applyRegion, setApplyRegion] = useState('亚太');
  const [applyDesc, setApplyDesc] = useState('');
  const [kpi, setKpi] = useState<KpiSnapshot>({
    onlineNodes: 86,
    totalNodes: 96,
    activePartners: 124,
    liquidityProviders: 18,
    totalLiquidity: 8.6e9,
    fundCount: 32,
    fundAum: 4.8e10,
    pendingApplications: 8,
    eventAttendees: 12480,
    blockHeight: 18426820,
    networkTps: 1240,
    ecosystemGrowth: 38,
  });
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const t = setInterval(() => {
      setKpi((prev) => ({
        ...prev,
        onlineNodes: Math.max(80, Math.min(96, prev.onlineNodes + Math.floor(Math.random() * 3 - 1))),
        blockHeight: prev.blockHeight + Math.floor(Math.random() * 4 + 1),
        networkTps: Math.max(800, Math.min(1800, prev.networkTps + Math.floor(Math.random() * 60 - 30))),
        totalLiquidity: prev.totalLiquidity + (Math.random() - 0.45) * 5e7,
        pendingApplications: Math.max(0, prev.pendingApplications + (Math.random() > 0.85 ? 1 : Math.random() > 0.7 ? -1 : 0)),
        eventAttendees: prev.eventAttendees + Math.floor(Math.random() * 20),
      }));
    }, 4000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || (e.target as HTMLElement)?.isContentEditable) return;
      if (e.key === '/') { e.preventDefault(); searchRef.current?.focus(); }
      if (e.key === 'Escape') { setDrawer({ open: false, type: null, payload: null }); setHelpOpen(false); setApplyStep(0); }
      if (e.key === '?') { e.preventDefault(); setHelpOpen((v) => !v); }
      if (e.key === '1') setTab('overview');
      if (e.key === '2') setTab('nodes');
      if (e.key === '3') setTab('partners');
      if (e.key === '4') setTab('liquidity');
      if (e.key === '5') setTab('fund');
      if (e.key === '6') setTab('events');
      if (e.key === '7') setTab('apply');
      if (e.key === '8') setTab('map');
      if (e.key === '9') setTab('help');
      if (e.key === 'a' || e.key === 'A') setTab('apply');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const filteredNodes = useMemo(() => {
    let list = NODES;
    if (nodeTypeFilter !== 'all') list = list.filter((n) => n.type === nodeTypeFilter);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((n) => n.name.toLowerCase().includes(q) || n.city.toLowerCase().includes(q) || n.operator.toLowerCase().includes(q));
    }
    return list.sort((a, b) => b.uptime - a.uptime);
  }, [nodeTypeFilter, search]);

  const filteredPartners = useMemo(() => {
    let list = PARTNERS;
    if (partnerCategoryFilter !== 'all') list = list.filter((p) => p.category === partnerCategoryFilter);
    if (partnerLevelFilter !== 'all') list = list.filter((p) => p.level === partnerLevelFilter);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((p) => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q));
    }
    return list.sort((a, b) => (a.level < b.level ? -1 : a.level > b.level ? 1 : 0));
  }, [partnerCategoryFilter, partnerLevelFilter, search]);

  const filteredLiquidity = useMemo(() => {
    let list = LIQUIDITY;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((l) => l.name.toLowerCase().includes(q));
    }
    return list.sort((a, b) => b.dailyVolume - a.dailyVolume);
  }, [search]);

  const filteredFunds = useMemo(() => {
    let list = FUNDS;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((f) => f.name.toLowerCase().includes(q));
    }
    return list.sort((a, b) => b.aum - a.aum);
  }, [search]);

  const filteredEvents = useMemo(() => {
    let list = EVENTS;
    if (eventStatusFilter !== 'all') list = list.filter((e) => e.status === eventStatusFilter);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((e) => e.title.toLowerCase().includes(q) || e.city.toLowerCase().includes(q));
    }
    return list.sort((a, b) => (a.startDate < b.startDate ? -1 : 1));
  }, [eventStatusFilter, search]);

  const filteredApplications = useMemo(() => {
    let list = APPLICATIONS;
    if (applyStageFilter !== 'all') list = list.filter((a) => a.stage === applyStageFilter);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((a) => a.company.toLowerCase().includes(q) || a.description.toLowerCase().includes(q));
    }
    return list.sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
  }, [applyStageFilter, search]);

  const openNode = useCallback((id: string) => setDrawer({ open: true, type: 'node', payload: id }), []);
  const openPartner = useCallback((id: string) => setDrawer({ open: true, type: 'partner', payload: id }), []);
  const openLiquidity = useCallback((id: string) => setDrawer({ open: true, type: 'liquidity', payload: id }), []);
  const openFund = useCallback((id: string) => setDrawer({ open: true, type: 'fund', payload: id }), []);
  const openEvent = useCallback((id: string) => setDrawer({ open: true, type: 'event', payload: id }), []);
  const openApplication = useCallback((id: string) => setDrawer({ open: true, type: 'application', payload: id }), []);
  const closeDrawer = useCallback(() => setDrawer({ open: false, type: null, payload: null }), []);

  const submitApplication = useCallback(() => {
    if (!applyCompany || !applyContact || !applyEmail || !applyDesc) return;
    setApplyStep(3);
    setTimeout(() => {
      setApplyStep(0);
      setApplyCompany('');
      setApplyContact('');
      setApplyEmail('');
      setApplyDesc('');
      setApplyType('partner');
      setDrawer({ open: false, type: null, payload: null });
      setTab('apply');
    }, 2500);
  }, [applyCompany, applyContact, applyEmail, applyDesc]);

  const currentNode = useMemo(() => drawer.type === 'node' ? NODES.find((n) => n.id === drawer.payload) : null, [drawer]);
  const currentPartner = useMemo(() => drawer.type === 'partner' ? PARTNERS.find((p) => p.id === drawer.payload) : null, [drawer]);
  const currentLiquidity = useMemo(() => drawer.type === 'liquidity' ? LIQUIDITY.find((l) => l.id === drawer.payload) : null, [drawer]);
  const currentFund = useMemo(() => drawer.type === 'fund' ? FUNDS.find((f) => f.id === drawer.payload) : null, [drawer]);
  const currentEvent = useMemo(() => drawer.type === 'event' ? EVENTS.find((e) => e.id === drawer.payload) : null, [drawer]);
  const currentApplication = useMemo(() => drawer.type === 'application' ? APPLICATIONS.find((a) => a.id === drawer.payload) : null, [drawer]);

  const renderTabBar = () => {
    const tabs: { id: Tab; label: string; icon: any; count?: number }[] = [
      { id: 'overview', label: '总览', icon: Compass },
      { id: 'nodes', label: '节点生态', icon: Server, count: NODES.length },
      { id: 'partners', label: '生态伙伴', icon: Handshake, count: PARTNERS.length },
      { id: 'liquidity', label: '流动性', icon: Coins, count: LIQUIDITY.length },
      { id: 'fund', label: '生态基金', icon: CircleDollarSign, count: FUNDS.length },
      { id: 'events', label: '生态活动', icon: Calendar, count: EVENTS.length },
      { id: 'apply', label: '合作申请', icon: UserPlus, count: APPLICATIONS.length },
      { id: 'map', label: '生态地图', icon: MapIcon },
      { id: 'help', label: '帮助', icon: HelpCircle },
    ];
    return (
      <div className="flex items-center gap-1 overflow-x-auto py-3" style={{ borderBottom: `1px solid ${BRAND.border}` }}>
        {tabs.map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 text-sm font-medium whitespace-nowrap"
              style={{
                backgroundColor: active ? BRAND.primaryLt : 'transparent',
                color: active ? BRAND.primary : BRAND.textSub,
                border: `1px solid ${active ? BRAND.primary : 'transparent'}`,
              }}
            >
              <Icon className="w-4 h-4" />
              {t.label}
              {t.count !== undefined && (
                <span
                  className="text-[10px] px-1.5 py-0.5 rounded-full"
                  style={{ backgroundColor: active ? BRAND.primary : BRAND.cardElevated, color: active ? BRAND.onPrimary : BRAND.textMute }}
                >
                  {t.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: BRAND.bg, color: BRAND.text }}>
      {/* Hero */}
      <div className="px-6 pt-10 pb-6" style={{ background: `linear-gradient(180deg, ${BRAND.bg} 0%, ${BRAND.bgCard} 100%)` }}>
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: BRAND.primaryLt, color: BRAND.primary }}>
              Q05 · 24 / 48
            </span>
            <span className="text-xs" style={{ color: BRAND.textMute }}>生态合作中心</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-semibold mb-3" style={{ color: BRAND.text }}>
            生态合作中心
          </h1>
          <p className="text-sm md:text-base max-w-3xl" style={{ color: BRAND.textSub }}>
            连接全球节点、机构、流动性提供方、VC 与开发者社区。构建"机构-API-发行-生态"四方协同闭环。仅作为 UI 演示，所有数据为 mock 占位，不接真实合作审核。
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <button
              onClick={() => setTab('apply')}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
              style={{ backgroundColor: BRAND.primary, color: BRAND.onPrimary }}
            >
              <UserPlus className="w-4 h-4" />
              提交合作申请
            </button>
            <button
              onClick={() => setTab('nodes')}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
              style={{ backgroundColor: BRAND.bgCard, color: BRAND.text, border: `1px solid ${BRAND.border}` }}
            >
              <Server className="w-4 h-4" />
              查看节点
            </button>
            <button
              onClick={() => setTab('events')}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
              style={{ backgroundColor: BRAND.bgCard, color: BRAND.text, border: `1px solid ${BRAND.border}` }}
            >
              <Calendar className="w-4 h-4" />
              活动日历
            </button>
            <button
              onClick={() => setHelpOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
              style={{ backgroundColor: BRAND.bgCard, color: BRAND.text, border: `1px solid ${BRAND.border}` }}
            >
              <Keyboard className="w-4 h-4" />
              快捷键
            </button>
          </div>
        </div>
      </div>

      {/* KPI 区 */}
      <div className="px-6 py-6">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          <KpiCard label="在线节点" value={kpi.onlineNodes} icon={Server} color={BRAND.primary} live hint={`总数 ${kpi.totalNodes}`} />
          <KpiCard label="生态伙伴" value={kpi.activePartners} icon={Handshake} color="#a855f7" live />
          <KpiCard label="流动性提供方" value={kpi.liquidityProviders} icon={Coins} color={BRAND.info} live />
          <KpiCard label="总流动性" value={kpi.totalLiquidity} format="currency" icon={Wallet} color={BRAND.warning} live />
          <KpiCard label="生态基金数" value={kpi.fundCount} icon={CircleDollarSign} color={BRAND.success} hint={`AUM ${formatCurrency(kpi.fundAum)}`} />
          <KpiCard label="待审申请" value={kpi.pendingApplications} icon={FileText} color={BRAND.danger} live />
          <KpiCard label="活动参与" value={kpi.eventAttendees} icon={Users} color={BRAND.primary} live />
          <KpiCard label="区块高度" value={kpi.blockHeight} icon={Layers} color={BRAND.info} live hint={`TPS ${kpi.networkTps}`} />
          <KpiCard label="网络 TPS" value={kpi.networkTps} icon={Zap} color={BRAND.warning} live />
          <KpiCard label="生态增速" value={kpi.ecosystemGrowth} format="percent" icon={TrendingUp} color={BRAND.success} hint="同比" />
          <KpiCard label="合规研究方向" value={12} icon={Globe2} color={BRAND.info} hint="观察中" />
          <KpiCard label="活跃合作" value={56} icon={Activity} color={BRAND.primary} live />
        </div>
      </div>

      {/* Tab Bar */}
      <div className="px-6">
        <div className="max-w-7xl mx-auto">
          {renderTabBar()}
        </div>
      </div>

      {/* 内容区 */}
      <div className="px-6 py-6">
        <div className="max-w-7xl mx-auto">
          {tab === 'overview' && (
            <div className="space-y-6">
              <div className="rounded-xl p-6" style={{ backgroundColor: BRAND.bgCard, border: `1px solid ${BRAND.border}` }}>
                <h2 className="text-xl font-semibold mb-4" style={{ color: BRAND.text }}>生态闭环总览</h2>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {[
                    { t: '机构服务', d: '合规 / 法币 / OTC', c: '#a855f7', icon: Building2 },
                    { t: 'API 开放', d: 'REST / WebSocket', c: BRAND.info, icon: Code2 },
                    { t: '项目发行', d: 'Launch / 投票上币', c: BRAND.primary, icon: Rocket },
                    { t: '生态合作', d: '节点 / 伙伴 / 流动性 / 基金', c: BRAND.warning, icon: Globe2 },
                  ].map((s, i) => {
                    const Icon = s.icon;
                    return (
                      <div key={i} className="rounded-lg p-4 transition-all duration-300 hover:scale-[1.02]" style={{ backgroundColor: BRAND.bgCardHover, border: `1px solid ${BRAND.border}` }}>
                        <Icon className="w-6 h-6 mb-2" style={{ color: s.c }} />
                        <div className="text-sm font-medium" style={{ color: BRAND.text }}>{s.t}</div>
                        <div className="text-xs mt-1" style={{ color: BRAND.textMute }}>{s.d}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-xl p-6" style={{ backgroundColor: BRAND.bgCard, border: `1px solid ${BRAND.border}` }}>
                <h2 className="text-xl font-semibold mb-4" style={{ color: BRAND.text }}>核心生态能力</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {[
                    { icon: Server, t: '节点生态', d: '验证节点 / RPC / 超级节点 / 备份 / 边缘 / 归档，覆盖亚太、欧洲、北美、中东、南美等地区', c: BRAND.primary, n: kpi.totalNodes },
                    { icon: Handshake, t: '生态伙伴', d: '机构、技术、媒体、社区、审计、钱包、预言机、跨链，多级别（白金/金/银/铜）', c: '#a855f7', n: kpi.activePartners },
                    { icon: Coins, t: '流动性提供方', d: '订单簿、AMM、RFQ 大宗做市，与 GSR、Wintermute、Cumberland 等顶级做市商合作', c: BRAND.info, n: kpi.liquidityProviders },
                    { icon: CircleDollarSign, t: '生态基金', d: 'VC 基金、加速器、天使、Grant、基金会，与 Paradigm / a16z / 红杉 / Dragonfly 等建立合作', c: BRAND.warning, n: kpi.fundCount },
                    { icon: Calendar, t: '生态活动', d: '黑客松、Meetup、AMA、工作坊、峰会、Demo Day，覆盖全球主要城市与线上', c: BRAND.success, n: EVENTS.length },
                    { icon: UserPlus, t: '合作申请', d: '全流程跟踪：提交 → 初审 → 尽调 → 合同 → 对接 → 上线，UI 演示不接真实审核', c: BRAND.danger, n: kpi.pendingApplications },
                  ].map((s, i) => {
                    const Icon = s.icon;
                    return (
                      <div key={i} className="rounded-lg p-4" style={{ backgroundColor: BRAND.bgCardHover, border: `1px solid ${BRAND.border}` }}>
                        <div className="flex items-start justify-between mb-2">
                          <Icon className="w-5 h-5" style={{ color: s.c }} />
                          <span className="text-lg font-semibold" style={{ color: s.c }}>{s.n}</span>
                        </div>
                        <div className="text-sm font-medium mb-1" style={{ color: BRAND.text }}>{s.t}</div>
                        <div className="text-xs" style={{ color: BRAND.textMute }}>{s.d}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {tab === 'nodes' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-2 flex-1 min-w-[240px]">
                  <Search className="w-4 h-4" style={{ color: BRAND.textMute }} />
                  <input
                    ref={searchRef}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="搜索节点 / 城市 / 运营商"
                    className="flex-1 bg-transparent outline-none text-sm"
                    style={{ color: BRAND.text }}
                  />
                </div>
                <select value={nodeTypeFilter} onChange={(e) => setNodeTypeFilter(e.target.value as any)} className="text-sm px-3 py-1.5 rounded" style={{ backgroundColor: BRAND.bgCard, color: BRAND.text, border: `1px solid ${BRAND.border}` }}>
                  <option value="all">全部类型</option>
                  <option value="validator">验证节点</option>
                  <option value="rpc">RPC 节点</option>
                  <option value="super">超级节点</option>
                  <option value="backup">备份节点</option>
                  <option value="edge">边缘节点</option>
                  <option value="archive">归档节点</option>
                </select>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredNodes.map((n) => {
                  const Type = NODE_TYPE_MAP[n.type];
                  const Status = NODE_STATUS_MAP[n.status];
                  const Icon = Type.icon;
                  return (
                    <div key={n.id} onClick={() => openNode(n.id)} className="rounded-xl p-4 cursor-pointer transition-all duration-300 hover:scale-[1.01]" style={{ backgroundColor: BRAND.bgCard, border: `1px solid ${BRAND.border}` }}>
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${Type.color}20`, color: Type.color }}>
                            <Icon className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="text-sm font-medium" style={{ color: BRAND.text }}>{n.name}</div>
                            <div className="text-xs" style={{ color: BRAND.textMute }}>{Type.label} · {n.city}</div>
                          </div>
                        </div>
                        <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ color: Status.color, backgroundColor: Status.bg }}>
                          {Status.label}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div>
                          <div className="text-[10px]" style={{ color: BRAND.textMute }}>Uptime</div>
                          <div className="text-xs font-semibold" style={{ color: BRAND.success }}>{n.uptime}%</div>
                        </div>
                        <div>
                          <div className="text-[10px]" style={{ color: BRAND.textMute }}>Peers</div>
                          <div className="text-xs font-semibold" style={{ color: BRAND.text }}>{n.peers}</div>
                        </div>
                        <div>
                          <div className="text-[10px]" style={{ color: BRAND.textMute }}>Block</div>
                          <div className="text-xs font-semibold" style={{ color: BRAND.text }}>{(n.blockHeight / 1e6).toFixed(1)}M</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {tab === 'partners' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-2 flex-1 min-w-[240px]">
                  <Search className="w-4 h-4" style={{ color: BRAND.textMute }} />
                  <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="搜索伙伴" className="flex-1 bg-transparent outline-none text-sm" style={{ color: BRAND.text }} />
                </div>
                <select value={partnerCategoryFilter} onChange={(e) => setPartnerCategoryFilter(e.target.value as any)} className="text-sm px-3 py-1.5 rounded" style={{ backgroundColor: BRAND.bgCard, color: BRAND.text, border: `1px solid ${BRAND.border}` }}>
                  <option value="all">全部类别</option>
                  {Object.entries(PARTNER_CATEGORY_MAP).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
                <select value={partnerLevelFilter} onChange={(e) => setPartnerLevelFilter(e.target.value as any)} className="text-sm px-3 py-1.5 rounded" style={{ backgroundColor: BRAND.bgCard, color: BRAND.text, border: `1px solid ${BRAND.border}` }}>
                  <option value="all">全部等级</option>
                  {Object.entries(PARTNER_LEVEL_MAP).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredPartners.map((p) => {
                  const Cat = PARTNER_CATEGORY_MAP[p.category];
                  const Lvl = PARTNER_LEVEL_MAP[p.level];
                  return (
                    <div key={p.id} onClick={() => openPartner(p.id)} className="rounded-xl p-4 cursor-pointer transition-all duration-300 hover:scale-[1.01]" style={{ backgroundColor: BRAND.bgCard, border: `1px solid ${BRAND.border}` }}>
                      <div className="flex items-start justify-between mb-3">
                        <div className="text-3xl">{p.logo}</div>
                        <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ color: Lvl.color, backgroundColor: Lvl.bg }}>{Lvl.label}</span>
                      </div>
                      <div className="text-sm font-medium mb-1" style={{ color: BRAND.text }}>{p.name}</div>
                      <div className="text-xs mb-2" style={{ color: Cat.color }}>{Cat.label} · {p.region}</div>
                      <div className="text-xs line-clamp-2" style={{ color: BRAND.textMute }}>{p.description}</div>
                      <div className="mt-3 flex flex-wrap gap-1">
                        {p.highlights.slice(0, 2).map((h, i) => (
                          <span key={i} className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: BRAND.bgCardHover, color: BRAND.textSub }}>{h}</span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {tab === 'liquidity' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4" style={{ color: BRAND.textMute }} />
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="搜索做市商" className="flex-1 bg-transparent outline-none text-sm max-w-xs" style={{ color: BRAND.text }} />
              </div>
              <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${BRAND.border}` }}>
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ backgroundColor: BRAND.bgCardHover }}>
                      <th className="text-left p-3" style={{ color: BRAND.textSub }}>做市商</th>
                      <th className="text-left p-3" style={{ color: BRAND.textSub }}>类型</th>
                      <th className="text-right p-3" style={{ color: BRAND.textSub }}>币对</th>
                      <th className="text-right p-3" style={{ color: BRAND.textSub }}>日交易量</th>
                      <th className="text-right p-3" style={{ color: BRAND.textSub }}>点差</th>
                      <th className="text-right p-3" style={{ color: BRAND.textSub }}>Uptime</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLiquidity.map((l) => {
                      const Type = LIQUIDITY_TYPE_MAP[l.type];
                      return (
                        <tr key={l.id} onClick={() => openLiquidity(l.id)} className="cursor-pointer hover:bg-white/5" style={{ borderTop: `1px solid ${BRAND.border}` }}>
                          <td className="p-3 font-medium" style={{ color: BRAND.text }}>{l.name}</td>
                          <td className="p-3"><span style={{ color: Type.color }}>{Type.label}</span></td>
                          <td className="p-3 text-right" style={{ color: BRAND.text }}>{l.pairs}</td>
                          <td className="p-3 text-right" style={{ color: BRAND.success }}>{formatCurrency(l.dailyVolume)}</td>
                          <td className="p-3 text-right" style={{ color: BRAND.text }}>{(l.spread * 100).toFixed(3)}%</td>
                          <td className="p-3 text-right" style={{ color: BRAND.success }}>{l.uptime}%</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {tab === 'fund' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4" style={{ color: BRAND.textMute }} />
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="搜索基金" className="flex-1 bg-transparent outline-none text-sm max-w-xs" style={{ color: BRAND.text }} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredFunds.map((f) => {
                  const Type = FUND_TYPE_MAP[f.type];
                  return (
                    <div key={f.id} onClick={() => openFund(f.id)} className="rounded-xl p-5 cursor-pointer transition-all duration-300 hover:scale-[1.01]" style={{ backgroundColor: BRAND.bgCard, border: `1px solid ${BRAND.border}` }}>
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="text-base font-medium" style={{ color: BRAND.text }}>{f.name}</div>
                          <div className="text-xs" style={{ color: Type.color }}>{Type.label} · {f.region}</div>
                        </div>
                        <span className="text-xs px-2 py-0.5 rounded" style={{ color: Type.color, backgroundColor: `${Type.color}20` }}>AUM {formatCurrency(f.aum)}</span>
                      </div>
                      <div className="text-xs mb-3" style={{ color: BRAND.textMute }}>{f.description}</div>
                      <div className="flex flex-wrap gap-1">
                        {f.focus.map((g, i) => (
                          <span key={i} className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: BRAND.bgCardHover, color: BRAND.textSub }}>{g}</span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {tab === 'events' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-2 flex-1 min-w-[240px]">
                  <Search className="w-4 h-4" style={{ color: BRAND.textMute }} />
                  <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="搜索活动" className="flex-1 bg-transparent outline-none text-sm" style={{ color: BRAND.text }} />
                </div>
                <select value={eventStatusFilter} onChange={(e) => setEventStatusFilter(e.target.value as any)} className="text-sm px-3 py-1.5 rounded" style={{ backgroundColor: BRAND.bgCard, color: BRAND.text, border: `1px solid ${BRAND.border}` }}>
                  <option value="all">全部状态</option>
                  {Object.entries(EVENT_STATUS_MAP).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredEvents.map((e) => {
                  const Type = EVENT_TYPE_MAP[e.type];
                  const Status = EVENT_STATUS_MAP[e.status];
                  const Icon = Type.icon;
                  return (
                    <div key={e.id} onClick={() => openEvent(e.id)} className="rounded-xl p-4 cursor-pointer transition-all duration-300 hover:scale-[1.01]" style={{ backgroundColor: BRAND.bgCard, border: `1px solid ${BRAND.border}` }}>
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${Type.color}20`, color: Type.color }}>
                            <Icon className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="text-sm font-medium" style={{ color: Type.color }}>{Type.label}</div>
                            <div className="text-[10px]" style={{ color: BRAND.textMute }}>{e.city} · {e.country}</div>
                          </div>
                        </div>
                        <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ color: Status.color, backgroundColor: Status.bg }}>{Status.label}</span>
                      </div>
                      <div className="text-sm font-medium mb-2 line-clamp-2" style={{ color: BRAND.text }}>{e.title}</div>
                      <div className="text-xs mb-2" style={{ color: BRAND.textMute }}>{e.startDate}{e.endDate !== e.startDate ? ` ~ ${e.endDate}` : ''}</div>
                      {e.prizePool > 0 && <div className="text-xs" style={{ color: BRAND.warning }}>奖金池 {formatCurrency(e.prizePool)}</div>}
                      {e.status === 'registration' && <div className="mt-2 text-[10px]" style={{ color: BRAND.success }}>已报名 {e.registered} / {e.capacity}</div>}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {tab === 'apply' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2 flex-1">
                  <div className="flex items-center gap-2 min-w-[240px]">
                    <Search className="w-4 h-4" style={{ color: BRAND.textMute }} />
                    <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="搜索申请" className="flex-1 bg-transparent outline-none text-sm" style={{ color: BRAND.text }} />
                  </div>
                  <select value={applyStageFilter} onChange={(e) => setApplyStageFilter(e.target.value as any)} className="text-sm px-3 py-1.5 rounded" style={{ backgroundColor: BRAND.bgCard, color: BRAND.text, border: `1px solid ${BRAND.border}` }}>
                    <option value="all">全部阶段</option>
                    {Object.entries(APPLY_STAGE_MAP).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
                <button
                  onClick={() => { setApplyStep(0); setDrawer({ open: true, type: 'apply', payload: null }); }}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
                  style={{ backgroundColor: BRAND.primary, color: BRAND.onPrimary }}
                >
                  <Plus className="w-4 h-4" />
                  新建申请
                </button>
              </div>
              <div className="space-y-3">
                {filteredApplications.map((a) => {
                  const Type = APPLY_TYPE_MAP[a.type];
                  const Stage = APPLY_STAGE_MAP[a.stage];
                  const TypeIcon = Type.icon;
                  return (
                    <div key={a.id} onClick={() => openApplication(a.id)} className="rounded-xl p-4 cursor-pointer transition-all duration-300 hover:scale-[1.005]" style={{ backgroundColor: BRAND.bgCard, border: `1px solid ${BRAND.border}` }}>
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${Type.color}20`, color: Type.color }}>
                          <TypeIcon className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="text-sm font-medium" style={{ color: BRAND.text }}>{a.company}</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ color: Type.color, backgroundColor: `${Type.color}20` }}>{Type.label}</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ color: Stage.color, backgroundColor: `${Stage.color}20` }}>{Stage.label}</span>
                          </div>
                          <div className="text-xs mb-2" style={{ color: BRAND.textMute }}>{a.description}</div>
                          <div className="flex items-center gap-4 text-[11px]" style={{ color: BRAND.textMute }}>
                            <span>📍 {a.region}</span>
                            <span>👤 {a.contact}</span>
                            <span>📅 更新 {a.updatedAt}</span>
                            <span>👨‍💼 {a.reviewer}</span>
                          </div>
                          <div className="mt-2 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: BRAND.bgCardHover }}>
                            <div className="h-full transition-all" style={{ width: `${a.progress}%`, backgroundColor: BRAND.primary }} />
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xl font-semibold" style={{ color: BRAND.primary }}>{a.progress}%</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {tab === 'map' && (
            <div className="rounded-xl p-6" style={{ backgroundColor: BRAND.bgCard, border: `1px solid ${BRAND.border}` }}>
              <h2 className="text-xl font-semibold mb-2" style={{ color: BRAND.text }}>全球生态地图</h2>
              <p className="text-sm mb-6" style={{ color: BRAND.textMute }}>节点 / 伙伴 / 流动性 / 基金 / 活动 分布概览</p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {[
                  { r: '亚太', n: 18, c: BRAND.primary },
                  { r: '欧洲', n: 12, c: BRAND.info },
                  { r: '北美', n: 8, c: BRAND.warning },
                  { r: '中东', n: 4, c: '#a855f7' },
                  { r: '南美', n: 3, c: BRAND.success },
                  { r: '非洲', n: 1, c: BRAND.danger },
                ].map((g, i) => (
                  <div key={i} className="rounded-lg p-4 flex items-center gap-3" style={{ backgroundColor: BRAND.bgCardHover, border: `1px solid ${BRAND.border}` }}>
                    <div className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl" style={{ backgroundColor: `${g.c}20` }}>🌍</div>
                    <div className="flex-1">
                      <div className="text-sm font-medium" style={{ color: BRAND.text }}>{g.r}</div>
                      <div className="text-xs" style={{ color: BRAND.textMute }}>覆盖 {g.n} 个合作方</div>
                    </div>
                    <div className="text-2xl font-semibold" style={{ color: g.c }}>{g.n}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === 'help' && (
            <div className="rounded-xl p-6" style={{ backgroundColor: BRAND.bgCard, border: `1px solid ${BRAND.border}` }}>
              <h2 className="text-xl font-semibold mb-4" style={{ color: BRAND.text }}>帮助与快捷键</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  { k: '/', v: '聚焦搜索' },
                  { k: 'Esc', v: '关闭 Drawer / 弹窗' },
                  { k: '?', v: '切换快捷键面板' },
                  { k: '1-9', v: '切换 Tab' },
                  { k: 'A', v: '跳转到合作申请' },
                ].map((s, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: BRAND.bgCardHover, border: `1px solid ${BRAND.border}` }}>
                    <kbd className="text-xs px-2 py-0.5 rounded font-mono" style={{ backgroundColor: BRAND.bg, color: BRAND.primary, border: `1px solid ${BRAND.border}` }}>{s.k}</kbd>
                    <span className="text-sm" style={{ color: BRAND.textSub }}>{s.v}</span>
                  </div>
                ))}
              </div>
              <div className="mt-6 p-4 rounded-lg" style={{ backgroundColor: BRAND.primaryLt, border: `1px solid ${BRAND.primary}` }}>
                <h3 className="text-sm font-semibold mb-2" style={{ color: BRAND.primary }}>📌 生态合作说明</h3>
                <ul className="text-xs space-y-1" style={{ color: BRAND.textSub }}>
                  <li>• 本页面所有数据为 mock 占位，UI 演示不接真实合作审核流程</li>
                  <li>• 所有合作申请提交后仅进入"已提交"状态，不实际分配审核人员</li>
                  <li>• 节点 / 伙伴 / 流动性 / 基金 / 活动 信息仅作行业概览</li>
                  <li>• 合规研究方向：仅观察中国大陆、新加坡、日本、德国、美国、瑞士、瑞典、阿联酋、巴西 等地区动态</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 合规声明 */}
      <div className="px-6 py-6">
        <div className="max-w-7xl mx-auto rounded-xl p-5" style={{ backgroundColor: BRAND.bgCard, border: `1px solid ${BRAND.border}` }}>
          <h3 className="text-sm font-semibold mb-2 flex items-center gap-2" style={{ color: BRAND.text }}>
            <ShieldCheck className="w-4 h-4" style={{ color: BRAND.primary }} />
            合规与免责声明
          </h3>
          <p className="text-xs leading-relaxed" style={{ color: BRAND.textMute }}>
            中萨数字科技交易所（ZSDEX）生态合作中心为业务展示页面。所有节点 / 伙伴 / 流动性 / 基金 / 活动 / 申请 数据为 mock 占位，仅用于 UI 演示。
            本平台所有内容均处于"合规研究方向"，不代表已经获得任何司法管辖区的持牌 / 监管 / 许可。
            合作申请仅记录用户输入，不触发任何真实审核或合同流程。投资有风险，决策需谨慎。
          </p>
        </div>
      </div>

      {/* 底部 CTA */}
      <div className="px-6 py-10">
        <div className="max-w-7xl mx-auto rounded-2xl p-8" style={{ background: `linear-gradient(135deg, ${BRAND.primary}20 0%, transparent 100%)`, border: `1px solid ${BRAND.primary}` }}>
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-semibold mb-2" style={{ color: BRAND.text }}>成为中萨数字科技生态合作伙伴</h3>
              <p className="text-sm" style={{ color: BRAND.textSub }}>无论您是节点运营商、做市商、机构、媒体或社区，都可以申请加入我们的开放生态。</p>
            </div>
            <button
              onClick={() => { setApplyStep(0); setDrawer({ open: true, type: 'apply', payload: null }); }}
              className="flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-medium"
              style={{ backgroundColor: BRAND.primary, color: BRAND.onPrimary }}
            >
              <UserPlus className="w-4 h-4" />
              立即申请
            </button>
          </div>
        </div>
      </div>

      {/* ============ Drawer ============ */}
      {drawer.open && (
        <div
          className="fixed inset-0 z-50 flex justify-end"
          style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
          onClick={closeDrawer}
        >
          <div
            className="w-full max-w-2xl h-full overflow-y-auto"
            style={{ backgroundColor: BRAND.bg, borderLeft: `1px solid ${BRAND.border}` }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 z-10 flex items-center justify-between p-4" style={{ backgroundColor: BRAND.headerBg, borderBottom: `1px solid ${BRAND.border}` }}>
              <div className="flex items-center gap-2">
                {drawer.type === 'node' && <Server className="w-5 h-5" style={{ color: BRAND.primary }} />}
                {drawer.type === 'partner' && <Handshake className="w-5 h-5" style={{ color: '#a855f7' }} />}
                {drawer.type === 'liquidity' && <Coins className="w-5 h-5" style={{ color: BRAND.info }} />}
                {drawer.type === 'fund' && <CircleDollarSign className="w-5 h-5" style={{ color: BRAND.warning }} />}
                {drawer.type === 'event' && <Calendar className="w-5 h-5" style={{ color: BRAND.success }} />}
                {drawer.type === 'application' && <FileText className="w-5 h-5" style={{ color: BRAND.danger }} />}
                {drawer.type === 'apply' && <UserPlus className="w-5 h-5" style={{ color: BRAND.primary }} />}
                <h2 className="text-lg font-semibold" style={{ color: BRAND.text }}>
                  {drawer.type === 'node' && '节点详情'}
                  {drawer.type === 'partner' && '合作伙伴详情'}
                  {drawer.type === 'liquidity' && '流动性提供方详情'}
                  {drawer.type === 'fund' && '生态基金详情'}
                  {drawer.type === 'event' && '活动详情'}
                  {drawer.type === 'application' && '申请进度详情'}
                  {drawer.type === 'apply' && '提交合作申请'}
                </h2>
              </div>
              <button onClick={closeDrawer} className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: BRAND.bgCardHover, color: BRAND.textSub }}>
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {drawer.type === 'node' && currentNode && (
                <div className="space-y-4">
                  <div className="rounded-lg p-4" style={{ backgroundColor: BRAND.bgCard, border: `1px solid ${BRAND.border}` }}>
                    <div className="text-sm font-medium" style={{ color: BRAND.text }}>{currentNode.name}</div>
                    <div className="text-xs" style={{ color: BRAND.textMute }}>{currentNode.description}</div>
                    <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
                      <div><span style={{ color: BRAND.textMute }}>类型：</span><span style={{ color: BRAND.text }}>{NODE_TYPE_MAP[currentNode.type].label}</span></div>
                      <div><span style={{ color: BRAND.textMute }}>状态：</span><span style={{ color: NODE_STATUS_MAP[currentNode.status].color }}>{NODE_STATUS_MAP[currentNode.status].label}</span></div>
                      <div><span style={{ color: BRAND.textMute }}>地区：</span><span style={{ color: BRAND.text }}>{currentNode.city}, {currentNode.country}</span></div>
                      <div><span style={{ color: BRAND.textMute }}>运营商：</span><span style={{ color: BRAND.text }}>{currentNode.operator}</span></div>
                      <div><span style={{ color: BRAND.textMute }}>版本：</span><span style={{ color: BRAND.text }}>{currentNode.version}</span></div>
                      <div><span style={{ color: BRAND.textMute }}>加入：</span><span style={{ color: BRAND.text }}>{currentNode.joinedAt}</span></div>
                    </div>
                  </div>
                  <div className="rounded-lg p-4" style={{ backgroundColor: BRAND.bgCard, border: `1px solid ${BRAND.border}` }}>
                    <h3 className="text-sm font-semibold mb-3" style={{ color: BRAND.text }}>运行指标</h3>
                    <div className="grid grid-cols-3 gap-3">
                      <div><div className="text-[10px]" style={{ color: BRAND.textMute }}>Uptime</div><div className="text-base font-semibold" style={{ color: BRAND.success }}>{currentNode.uptime}%</div></div>
                      <div><div className="text-[10px]" style={{ color: BRAND.textMute }}>区块高度</div><div className="text-base font-semibold" style={{ color: BRAND.text }}>{(currentNode.blockHeight / 1e6).toFixed(2)}M</div></div>
                      <div><div className="text-[10px]" style={{ color: BRAND.textMute }}>Peers</div><div className="text-base font-semibold" style={{ color: BRAND.text }}>{currentNode.peers}</div></div>
                      <div><div className="text-[10px]" style={{ color: BRAND.textMute }}>CPU</div><div className="text-base font-semibold" style={{ color: BRAND.text }}>{currentNode.cpu}%</div></div>
                      <div><div className="text-[10px]" style={{ color: BRAND.textMute }}>Memory</div><div className="text-base font-semibold" style={{ color: BRAND.text }}>{currentNode.memory}%</div></div>
                      <div><div className="text-[10px]" style={{ color: BRAND.textMute }}>网络</div><div className="text-base font-semibold" style={{ color: BRAND.text }}>{currentNode.network} Mbps</div></div>
                    </div>
                  </div>
                  {currentNode.features && currentNode.features.length > 0 && (
                    <div className="rounded-lg p-4" style={{ backgroundColor: BRAND.bgCard, border: `1px solid ${BRAND.border}` }}>
                      <h3 className="text-sm font-semibold mb-3" style={{ color: BRAND.text }}>节点能力</h3>
                      <div className="flex flex-wrap gap-2">
                        {currentNode.features.map((f, i) => <span key={i} className="text-xs px-2 py-1 rounded" style={{ backgroundColor: BRAND.bgCardHover, color: BRAND.textSub }}>{f}</span>)}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {drawer.type === 'partner' && currentPartner && (
                <div className="space-y-4">
                  <div className="rounded-lg p-5 text-center" style={{ backgroundColor: BRAND.bgCard, border: `1px solid ${BRAND.border}` }}>
                    <div className="text-5xl mb-2">{currentPartner.logo}</div>
                    <div className="text-lg font-semibold" style={{ color: BRAND.text }}>{currentPartner.name}</div>
                    <div className="text-xs" style={{ color: PARTNER_CATEGORY_MAP[currentPartner.category].color }}>{PARTNER_CATEGORY_MAP[currentPartner.category].label} · {PARTNER_LEVEL_MAP[currentPartner.level].label}</div>
                    <div className="text-xs mt-2" style={{ color: BRAND.textMute }}>{currentPartner.description}</div>
                  </div>
                  <div className="rounded-lg p-4" style={{ backgroundColor: BRAND.bgCard, border: `1px solid ${BRAND.border}` }}>
                    <h3 className="text-sm font-semibold mb-3" style={{ color: BRAND.text }}>基本信息</h3>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div><span style={{ color: BRAND.textMute }}>地区：</span><span style={{ color: BRAND.text }}>{currentPartner.region}</span></div>
                      <div><span style={{ color: BRAND.textMute }}>员工：</span><span style={{ color: BRAND.text }}>{currentPartner.employees}</span></div>
                      <div><span style={{ color: BRAND.textMute }}>成立：</span><span style={{ color: BRAND.text }}>{currentPartner.founded}</span></div>
                      <div><span style={{ color: BRAND.textMute }}>加入：</span><span style={{ color: BRAND.text }}>{currentPartner.joinedAt}</span></div>
                    </div>
                  </div>
                  <div className="rounded-lg p-4" style={{ backgroundColor: BRAND.bgCard, border: `1px solid ${BRAND.border}` }}>
                    <h3 className="text-sm font-semibold mb-2" style={{ color: BRAND.text }}>合作亮点</h3>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {currentPartner.highlights.map((h, i) => <span key={i} className="text-xs px-2 py-1 rounded" style={{ backgroundColor: BRAND.primaryLt, color: BRAND.primary }}>{h}</span>)}
                    </div>
                    <h4 className="text-xs font-medium mb-1" style={{ color: BRAND.textSub }}>合作方向</h4>
                    <div className="flex flex-wrap gap-2">
                      {currentPartner.cooperationAreas.map((c, i) => <span key={i} className="text-xs px-2 py-1 rounded" style={{ backgroundColor: BRAND.bgCardHover, color: BRAND.textSub }}>{c}</span>)}
                    </div>
                  </div>
                  <div className="rounded-lg p-4" style={{ backgroundColor: BRAND.bgCard, border: `1px solid ${BRAND.border}` }}>
                    <h3 className="text-sm font-semibold mb-2" style={{ color: BRAND.text }}>案例</h3>
                    <p className="text-xs" style={{ color: BRAND.textMute }}>{currentPartner.caseStudy}</p>
                  </div>
                </div>
              )}

              {drawer.type === 'liquidity' && currentLiquidity && (
                <div className="space-y-4">
                  <div className="rounded-lg p-5" style={{ backgroundColor: BRAND.bgCard, border: `1px solid ${BRAND.border}` }}>
                    <div className="text-lg font-semibold" style={{ color: BRAND.text }}>{currentLiquidity.name}</div>
                    <div className="text-xs" style={{ color: LIQUIDITY_TYPE_MAP[currentLiquidity.type].color }}>{LIQUIDITY_TYPE_MAP[currentLiquidity.type].label}</div>
                    <div className="text-xs mt-2" style={{ color: BRAND.textMute }}>{currentLiquidity.description}</div>
                  </div>
                  <div className="rounded-lg p-4" style={{ backgroundColor: BRAND.bgCard, border: `1px solid ${BRAND.border}` }}>
                    <h3 className="text-sm font-semibold mb-3" style={{ color: BRAND.text }}>做市数据</h3>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div><span style={{ color: BRAND.textMute }}>币对数：</span><span style={{ color: BRAND.text }}>{currentLiquidity.pairs}</span></div>
                      <div><span style={{ color: BRAND.textMute }}>日交易量：</span><span style={{ color: BRAND.success }}>{formatCurrency(currentLiquidity.dailyVolume)}</span></div>
                      <div><span style={{ color: BRAND.textMute }}>点差：</span><span style={{ color: BRAND.text }}>{(currentLiquidity.spread * 100).toFixed(3)}%</span></div>
                      <div><span style={{ color: BRAND.textMute }}>Uptime：</span><span style={{ color: BRAND.success }}>{currentLiquidity.uptime}%</span></div>
                      <div><span style={{ color: BRAND.textMute }}>Maker Rebate：</span><span style={{ color: BRAND.text }}>{(currentLiquidity.makerRebate * 100).toFixed(3)}%</span></div>
                      <div><span style={{ color: BRAND.textMute }}>Taker Fee：</span><span style={{ color: BRAND.text }}>{(currentLiquidity.takerFee * 100).toFixed(3)}%</span></div>
                    </div>
                  </div>
                  <div className="rounded-lg p-4" style={{ backgroundColor: BRAND.bgCard, border: `1px solid ${BRAND.border}` }}>
                    <h3 className="text-sm font-semibold mb-2" style={{ color: BRAND.text }}>风控能力</h3>
                    <div className="flex flex-wrap gap-2">
                      {currentLiquidity.riskControl.map((r, i) => <span key={i} className="text-xs px-2 py-1 rounded" style={{ backgroundColor: BRAND.successLt, color: BRAND.success }}>{r}</span>)}
                    </div>
                  </div>
                </div>
              )}

              {drawer.type === 'fund' && currentFund && (
                <div className="space-y-4">
                  <div className="rounded-lg p-5" style={{ backgroundColor: BRAND.bgCard, border: `1px solid ${BRAND.border}` }}>
                    <div className="text-lg font-semibold" style={{ color: BRAND.text }}>{currentFund.name}</div>
                    <div className="text-xs" style={{ color: FUND_TYPE_MAP[currentFund.type].color }}>{FUND_TYPE_MAP[currentFund.type].label} · {currentFund.region}</div>
                    <div className="text-xs mt-2" style={{ color: BRAND.textMute }}>{currentFund.description}</div>
                  </div>
                  <div className="rounded-lg p-4" style={{ backgroundColor: BRAND.bgCard, border: `1px solid ${BRAND.border}` }}>
                    <h3 className="text-sm font-semibold mb-3" style={{ color: BRAND.text }}>基金数据</h3>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div><span style={{ color: BRAND.textMute }}>AUM：</span><span style={{ color: BRAND.text }}>{formatCurrency(currentFund.aum)}</span></div>
                      <div><span style={{ color: BRAND.textMute }}>已投：</span><span style={{ color: BRAND.text }}>{formatCurrency(currentFund.invested)}</span></div>
                      <div><span style={{ color: BRAND.textMute }}>组合：</span><span style={{ color: BRAND.text }}>{currentFund.portfolio}</span></div>
                      <div><span style={{ color: BRAND.textMute }}>均投：</span><span style={{ color: BRAND.text }}>{formatCurrency(currentFund.averageCheck)}</span></div>
                    </div>
                  </div>
                  <div className="rounded-lg p-4" style={{ backgroundColor: BRAND.bgCard, border: `1px solid ${BRAND.border}` }}>
                    <h3 className="text-sm font-semibold mb-2" style={{ color: BRAND.text }}>投资方向</h3>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {currentFund.focus.map((f, i) => <span key={i} className="text-xs px-2 py-1 rounded" style={{ backgroundColor: BRAND.primaryLt, color: BRAND.primary }}>{f}</span>)}
                    </div>
                    <h4 className="text-xs font-medium mb-1" style={{ color: BRAND.textSub }}>投资阶段</h4>
                    <div className="flex flex-wrap gap-2">
                      {currentFund.stages.map((s, i) => <span key={i} className="text-xs px-2 py-1 rounded" style={{ backgroundColor: BRAND.bgCardHover, color: BRAND.textSub }}>{s}</span>)}
                    </div>
                  </div>
                  <div className="rounded-lg p-4" style={{ backgroundColor: BRAND.bgCard, border: `1px solid ${BRAND.border}` }}>
                    <h3 className="text-sm font-semibold mb-2" style={{ color: BRAND.text }}>投资理念</h3>
                    <p className="text-xs" style={{ color: BRAND.textMute }}>{currentFund.thesis}</p>
                  </div>
                </div>
              )}

              {drawer.type === 'event' && currentEvent && (
                <div className="space-y-4">
                  <div className="rounded-lg p-5" style={{ backgroundColor: BRAND.bgCard, border: `1px solid ${BRAND.border}` }}>
                    <div className="text-lg font-semibold" style={{ color: BRAND.text }}>{currentEvent.title}</div>
                    <div className="text-xs mt-1" style={{ color: EVENT_TYPE_MAP[currentEvent.type].color }}>{EVENT_TYPE_MAP[currentEvent.type].label} · {EVENT_STATUS_MAP[currentEvent.status].label}</div>
                    <div className="text-xs mt-2" style={{ color: BRAND.textMute }}>{currentEvent.description}</div>
                  </div>
                  <div className="rounded-lg p-4" style={{ backgroundColor: BRAND.bgCard, border: `1px solid ${BRAND.border}` }}>
                    <h3 className="text-sm font-semibold mb-3" style={{ color: BRAND.text }}>活动信息</h3>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div><span style={{ color: BRAND.textMute }}>📅 日期：</span><span style={{ color: BRAND.text }}>{currentEvent.startDate}{currentEvent.endDate !== currentEvent.startDate ? ` ~ ${currentEvent.endDate}` : ''}</span></div>
                      <div><span style={{ color: BRAND.textMute }}>📍 地点：</span><span style={{ color: BRAND.text }}>{currentEvent.city}, {currentEvent.country}</span></div>
                      <div><span style={{ color: BRAND.textMute }}>🎯 形式：</span><span style={{ color: BRAND.text }}>{currentEvent.online ? '线上' : '线下'}</span></div>
                      <div><span style={{ color: BRAND.textMute }}>💰 报名：</span><span style={{ color: currentEvent.free ? BRAND.success : BRAND.warning }}>{currentEvent.free ? '免费' : '付费'}</span></div>
                      <div><span style={{ color: BRAND.textMute }}>👥 参与：</span><span style={{ color: BRAND.text }}>{currentEvent.attendees}</span></div>
                      <div><span style={{ color: BRAND.textMute }}>🎁 奖金：</span><span style={{ color: currentEvent.prizePool > 0 ? BRAND.warning : BRAND.textMute }}>{currentEvent.prizePool > 0 ? formatCurrency(currentEvent.prizePool) : '无'}</span></div>
                    </div>
                  </div>
                  <div className="rounded-lg p-4" style={{ backgroundColor: BRAND.bgCard, border: `1px solid ${BRAND.border}` }}>
                    <h3 className="text-sm font-semibold mb-2" style={{ color: BRAND.text }}>活动议程</h3>
                    <ul className="space-y-1">
                      {currentEvent.agenda.map((a, i) => <li key={i} className="text-xs" style={{ color: BRAND.textSub }}>• {a}</li>)}
                    </ul>
                  </div>
                </div>
              )}

              {drawer.type === 'application' && currentApplication && (
                <div className="space-y-4">
                  <div className="rounded-lg p-5" style={{ backgroundColor: BRAND.bgCard, border: `1px solid ${BRAND.border}` }}>
                    <div className="text-lg font-semibold" style={{ color: BRAND.text }}>{currentApplication.company}</div>
                    <div className="text-xs" style={{ color: APPLY_TYPE_MAP[currentApplication.type].color }}>{APPLY_TYPE_MAP[currentApplication.type].label} · {APPLY_STAGE_MAP[currentApplication.stage].label}</div>
                    <div className="text-xs mt-2" style={{ color: BRAND.textMute }}>{currentApplication.description}</div>
                    <div className="mt-3 h-2 rounded-full overflow-hidden" style={{ backgroundColor: BRAND.bgCardHover }}>
                      <div className="h-full transition-all" style={{ width: `${currentApplication.progress}%`, backgroundColor: APPLY_STAGE_MAP[currentApplication.stage].color }} />
                    </div>
                    <div className="mt-1 text-right text-xs" style={{ color: APPLY_STAGE_MAP[currentApplication.stage].color }}>{currentApplication.progress}%</div>
                  </div>
                  <div className="rounded-lg p-4" style={{ backgroundColor: BRAND.bgCard, border: `1px solid ${BRAND.border}` }}>
                    <h3 className="text-sm font-semibold mb-3" style={{ color: BRAND.text }}>申请信息</h3>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div><span style={{ color: BRAND.textMute }}>联系人：</span><span style={{ color: BRAND.text }}>{currentApplication.contact}</span></div>
                      <div><span style={{ color: BRAND.textMute }}>邮箱：</span><span style={{ color: BRAND.text }}>{currentApplication.email}</span></div>
                      <div><span style={{ color: BRAND.textMute }}>电话：</span><span style={{ color: BRAND.text }}>{currentApplication.phone}</span></div>
                      <div><span style={{ color: BRAND.textMute }}>地区：</span><span style={{ color: BRAND.text }}>{currentApplication.region}</span></div>
                      <div><span style={{ color: BRAND.textMute }}>提交：</span><span style={{ color: BRAND.text }}>{currentApplication.submittedAt}</span></div>
                      <div><span style={{ color: BRAND.textMute }}>更新：</span><span style={{ color: BRAND.text }}>{currentApplication.updatedAt}</span></div>
                    </div>
                  </div>
                  <div className="rounded-lg p-4" style={{ backgroundColor: BRAND.bgCard, border: `1px solid ${BRAND.border}` }}>
                    <h3 className="text-sm font-semibold mb-3" style={{ color: BRAND.text }}>时间线</h3>
                    <div className="space-y-2">
                      {currentApplication.timeline.map((t, i) => (
                        <div key={i} className="flex items-start gap-3">
                          <div className="w-2 h-2 rounded-full mt-1.5" style={{ backgroundColor: APPLY_STAGE_MAP[t.stage].color }} />
                          <div className="flex-1">
                            <div className="text-xs font-medium" style={{ color: APPLY_STAGE_MAP[t.stage].color }}>{APPLY_STAGE_MAP[t.stage].label}</div>
                            <div className="text-[11px]" style={{ color: BRAND.textMute }}>{t.timestamp} · {t.note}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {drawer.type === 'apply' && (
                <div className="space-y-4">
                  {applyStep < 3 ? (
                    <>
                      <div className="flex items-center gap-2 mb-2">
                        {[0, 1, 2].map((s) => (
                          <React.Fragment key={s}>
                            <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium" style={{ backgroundColor: s <= applyStep ? BRAND.primary : BRAND.bgCardHover, color: s <= applyStep ? BRAND.onPrimary : BRAND.textMute }}>
                              {s + 1}
                            </div>
                            {s < 2 && <div className="flex-1 h-0.5" style={{ backgroundColor: s < applyStep ? BRAND.primary : BRAND.bgCardHover }} />}
                          </React.Fragment>
                        ))}
                      </div>
                      <div className="text-xs" style={{ color: BRAND.textMute }}>{['选择合作类型', '填写基本信息', '确认提交'][applyStep]}</div>

                      {applyStep === 0 && (
                        <div className="grid grid-cols-2 gap-2">
                          {(Object.keys(APPLY_TYPE_MAP) as ApplyType[]).map((t) => {
                            const Type = APPLY_TYPE_MAP[t];
                            const Icon = Type.icon;
                            return (
                              <button key={t} onClick={() => { setApplyType(t); setApplyStep(1); }} className="rounded-lg p-3 text-left transition-all duration-200" style={{ backgroundColor: applyType === t ? `${Type.color}20` : BRAND.bgCard, border: `1px solid ${applyType === t ? Type.color : BRAND.border}` }}>
                                <Icon className="w-5 h-5 mb-1" style={{ color: Type.color }} />
                                <div className="text-sm font-medium" style={{ color: BRAND.text }}>{Type.label}</div>
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {applyStep === 1 && (
                        <div className="space-y-3">
                          <div>
                            <label className="text-xs block mb-1" style={{ color: BRAND.textSub }}>公司/机构名称 *</label>
                            <input value={applyCompany} onChange={(e) => setApplyCompany(e.target.value)} className="w-full px-3 py-2 rounded text-sm" style={{ backgroundColor: BRAND.bgCard, color: BRAND.text, border: `1px solid ${BRAND.border}` }} />
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="text-xs block mb-1" style={{ color: BRAND.textSub }}>联系人 *</label>
                              <input value={applyContact} onChange={(e) => setApplyContact(e.target.value)} className="w-full px-3 py-2 rounded text-sm" style={{ backgroundColor: BRAND.bgCard, color: BRAND.text, border: `1px solid ${BRAND.border}` }} />
                            </div>
                            <div>
                              <label className="text-xs block mb-1" style={{ color: BRAND.textSub }}>邮箱 *</label>
                              <input value={applyEmail} onChange={(e) => setApplyEmail(e.target.value)} className="w-full px-3 py-2 rounded text-sm" style={{ backgroundColor: BRAND.bgCard, color: BRAND.text, border: `1px solid ${BRAND.border}` }} />
                            </div>
                          </div>
                          <div>
                            <label className="text-xs block mb-1" style={{ color: BRAND.textSub }}>地区</label>
                            <select value={applyRegion} onChange={(e) => setApplyRegion(e.target.value)} className="w-full px-3 py-2 rounded text-sm" style={{ backgroundColor: BRAND.bgCard, color: BRAND.text, border: `1px solid ${BRAND.border}` }}>
                              <option>亚太</option><option>欧洲</option><option>北美</option><option>中东</option><option>南美</option><option>非洲</option>
                            </select>
                          </div>
                          <div>
                            <label className="text-xs block mb-1" style={{ color: BRAND.textSub }}>合作说明 *</label>
                            <textarea value={applyDesc} onChange={(e) => setApplyDesc(e.target.value)} rows={4} className="w-full px-3 py-2 rounded text-sm" style={{ backgroundColor: BRAND.bgCard, color: BRAND.text, border: `1px solid ${BRAND.border}` }} />
                          </div>
                        </div>
                      )}

                      {applyStep === 2 && (
                        <div className="rounded-lg p-4 space-y-2 text-xs" style={{ backgroundColor: BRAND.bgCard, border: `1px solid ${BRAND.border}` }}>
                          <div className="flex justify-between"><span style={{ color: BRAND.textMute }}>类型：</span><span style={{ color: APPLY_TYPE_MAP[applyType].color }}>{APPLY_TYPE_MAP[applyType].label}</span></div>
                          <div className="flex justify-between"><span style={{ color: BRAND.textMute }}>公司：</span><span style={{ color: BRAND.text }}>{applyCompany}</span></div>
                          <div className="flex justify-between"><span style={{ color: BRAND.textMute }}>联系人：</span><span style={{ color: BRAND.text }}>{applyContact}</span></div>
                          <div className="flex justify-between"><span style={{ color: BRAND.textMute }}>邮箱：</span><span style={{ color: BRAND.text }}>{applyEmail}</span></div>
                          <div className="flex justify-between"><span style={{ color: BRAND.textMute }}>地区：</span><span style={{ color: BRAND.text }}>{applyRegion}</span></div>
                          <div><span style={{ color: BRAND.textMute }}>说明：</span><span style={{ color: BRAND.text }}>{applyDesc}</span></div>
                        </div>
                      )}

                      <div className="flex gap-2">
                        {applyStep > 0 && <button onClick={() => setApplyStep((s) => s - 1)} className="flex-1 py-2 rounded text-sm" style={{ backgroundColor: BRAND.bgCard, color: BRAND.text, border: `1px solid ${BRAND.border}` }}>上一步</button>}
                        <button onClick={() => { if (applyStep < 2) setApplyStep((s) => s + 1); else submitApplication(); }} disabled={applyStep === 1 && (!applyCompany || !applyContact || !applyEmail || !applyDesc)} className="flex-1 py-2 rounded text-sm font-medium disabled:opacity-50" style={{ backgroundColor: BRAND.primary, color: BRAND.onPrimary }}>
                          {applyStep === 2 ? '确认提交' : '下一步'}
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-3" style={{ backgroundColor: BRAND.successLt, color: BRAND.success }}>
                        <CheckCircle2 className="w-8 h-8" />
                      </div>
                      <div className="text-base font-medium mb-1" style={{ color: BRAND.text }}>申请已提交</div>
                      <div className="text-xs" style={{ color: BRAND.textMute }}>仅 UI 演示，不触发实际审核流程</div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 帮助 Drawer */}
      {helpOpen && (
        <div className="fixed inset-0 z-50 flex justify-end" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }} onClick={() => setHelpOpen(false)}>
          <div className="w-full max-w-md h-full overflow-y-auto p-6" style={{ backgroundColor: BRAND.bg, borderLeft: `1px solid ${BRAND.border}` }} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2" style={{ color: BRAND.text }}><Keyboard className="w-5 h-5" style={{ color: BRAND.primary }} />快捷键</h2>
              <button onClick={() => setHelpOpen(false)} className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: BRAND.bgCardHover, color: BRAND.textSub }}><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-2">
              {[
                { k: '/', v: '聚焦搜索' },
                { k: 'Esc', v: '关闭 Drawer' },
                { k: '?', v: '切换此面板' },
                { k: '1-9', v: '切换 Tab' },
                { k: 'A', v: '跳转合作申请' },
              ].map((s, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: BRAND.bgCard, border: `1px solid ${BRAND.border}` }}>
                  <kbd className="text-xs px-2 py-0.5 rounded font-mono" style={{ backgroundColor: BRAND.bg, color: BRAND.primary, border: `1px solid ${BRAND.border}` }}>{s.k}</kbd>
                  <span className="text-sm" style={{ color: BRAND.textSub }}>{s.v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
