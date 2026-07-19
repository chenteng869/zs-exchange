'use client';

/**
 * PortalAcademy - 数字资产学院（2026-07-19 Q05 P3.19）
 *
 * 页面定位：
 * - 中萨数字科技交易所数字资产学院
 * - 系统化教育课程 / 视频教程 / 知识图谱 / 学习路径 / 实战演练 / 认证中心
 * - 与 P3.15 风险披露 形成"教育-风险"协同，为 Launch (P3.18) 申购前提供认知准备
 *
 * L4 工业级设计标准：
 * - 暗色 v6 纯黑 #000000 + 卡片 #141414 + ZSDEX 绿 primary #14B881
 * - 10 大区块：Hero / 实时 KPI / 学习路径 / 课程库 / 视频教程 / 知识图谱 / 实战案例 / 认证中心 / 讲师团队 / 进度中心 / 底部 CTA
 * - 8+ 交互：搜索 / 排序 / Tab / 难度过滤 / 分类过滤 / 详情 Drawer / 快捷键 / 实时进度
 * - 4+ Drawer：课程详情 / 视频播放 / 讲师详情 / 帮助快捷键
 * - 4+ 实时数据：在学人数 / 完成进度 / 新课程 / 活跃讲师
 * - 4+ 动画：Stagger / CountUp / Hover / Pulse
 *
 * 合规要点（Q05 硬约束）：
 * - 不接真实 API，所有课程 / 视频 / 学员数据使用 mock 占位
 * - 状态徽章统一使用 STATUS 枚举
 * - 不修改旧官网 / 旧 H5 / disabled pages
 * - 教育内容严禁出现"承诺收益"、"稳赚不赔"等高风险合规词
 * - 强调"投资有风险、学习需谨慎"理念
 */

import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import {
  Search,
  X,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Filter,
  GraduationCap,
  BookOpen,
  Video,
  Award,
  Trophy,
  Star,
  Clock,
  Users,
  User,
  Play,
  Pause,
  CheckCircle2,
  Lock,
  Unlock,
  Sparkles,
  ArrowUpRight,
  ArrowDownLeft,
  TrendingUp,
  Activity,
  Layers,
  Network,
  Database,
  FileText,
  Download,
  ExternalLink,
  Copy,
  Eye,
  Calendar,
  Hash,
  Target,
  BarChart3,
  PieChart as PieIcon,
  Briefcase,
  Building2,
  Globe2,
  KeyRound,
  Wallet,
  Coins,
  Boxes,
  Cpu,
  Shield,
  ShieldCheck,
  AlertTriangle,
  HelpCircle,
  Keyboard,
  Mail,
  MessageCircle,
  Code2,
  Compass,
  Map,
  Flag,
  Bookmark,
  ThumbsUp,
  Heart,
  Flame,
  Zap,
  ChevronLeft,
  Plus,
  Minus,
} from 'lucide-react';
import { BRAND, STATUS } from './brand';

// ============== 类型 ==============

type Level = 'beginner' | 'intermediate' | 'advanced' | 'expert';
type Category = 'basics' | 'trading' | 'defi' | 'security' | 'blockchain' | 'regulation' | 'wallet' | 'treegraph';
type CourseType = 'video' | 'article' | 'interactive' | 'quiz' | 'live';
type Tab = 'overview' | 'courses' | 'videos' | 'paths' | 'graph' | 'cases' | 'cert' | 'progress';
type DrawerType = 'course' | 'video' | 'instructor' | 'cert' | 'case' | 'help' | null;

interface Course {
  id: string;
  title: string;
  category: Category;
  level: Level;
  type: CourseType;
  duration: number; // minutes
  lessons: number;
  enrolled: number;
  rating: number; // 0-5
  ratingCount: number;
  instructor: string;
  tags: string[];
  description: string;
  highlights: string[];
  syllabus: { id: number; title: string; duration: number }[];
  isFree: boolean;
  isNew: boolean;
  isHot: boolean;
  publishedAt: string;
  updatedAt: string;
  cover: string; // emoji or color
  language: 'zh-CN' | 'en-US';
}

interface VideoItem {
  id: string;
  title: string;
  series: string;
  episode: number;
  totalEpisodes: number;
  duration: number; // seconds
  views: number;
  likes: number;
  thumbnail: string; // color
  publishedAt: string;
  instructor: string;
  description: string;
  chapters: { id: number; title: string; start: number }[];
  tags: string[];
  level: Level;
}

interface LearningPath {
  id: string;
  title: string;
  description: string;
  goal: string;
  totalCourses: number;
  totalDuration: number;
  enrolled: number;
  completed: number;
  difficulty: Level;
  targetAudience: string[];
  courses: string[]; // course ids
  certification: string; // cert id
  badge: string; // emoji
  color: string;
}

interface Instructor {
  id: string;
  name: string;
  title: string;
  avatar: string; // emoji
  bio: string;
  expertise: string[];
  courses: number;
  students: number;
  rating: number;
  yearsOfExperience: number;
  background: string[];
  signature: string;
}

interface Cert {
  id: string;
  name: string;
  level: Level;
  description: string;
  requirements: string[];
  validity: number; // months
  holders: number;
  passRate: number; // %
  examDuration: number; // minutes
  questions: number;
  color: string;
  icon: string;
}

interface CaseStudy {
  id: string;
  title: string;
  scenario: string;
  category: 'success' | 'warning' | 'incident' | 'lesson';
  description: string;
  lessons: string[];
  year: number;
  region: string;
  impact: string;
  references: string[];
}

interface Progress {
  totalMinutes: number;
  coursesCompleted: number;
  coursesInProgress: number;
  certsEarned: number;
  currentStreak: number; // days
  longestStreak: number;
  weeklyMinutes: number[];
  monthlyCourses: number[];
  rank: number;
  percentile: number;
  points: number;
  level: number;
  nextLevelPoints: number;
}

interface KpiSnapshot {
  activeLearners: number;
  totalCourses: number;
  totalVideos: number;
  totalInstructors: number;
  certsIssued: number;
  totalMinutes: number;
  liveStudents: number;
  todayCompletions: number;
}

interface DrawerState {
  open: boolean;
  type: DrawerType;
  payload: string | null;
}

// ============== Mock 数据 ==============

const COURSES: Course[] = [
  {
    id: 'c-btc-101',
    title: '比特币投资入门：从零开始认识 BTC',
    category: 'basics',
    level: 'beginner',
    type: 'video',
    duration: 90,
    lessons: 12,
    enrolled: 18420,
    rating: 4.8,
    ratingCount: 1248,
    instructor: '林思远',
    tags: ['BTC', '基础', '入门', '投资'],
    description: '本课程系统讲解比特币的诞生背景、技术原理、获取方式、存储方式、交易流程与风险管理，帮助初学者建立完整的认知框架。',
    highlights: ['理解中本聪白皮书核心思想', '掌握钱包/地址/私钥概念', '学会选择合适的钱包类型', '了解常见交易误区与风险'],
    syllabus: [
      { id: 1, title: '比特币诞生背景与白皮书解读', duration: 12 },
      { id: 2, title: '区块链基础：去中心化账本原理', duration: 15 },
      { id: 3, title: '钱包与地址：私钥、公钥、地址关系', duration: 10 },
      { id: 4, title: '冷钱包与热钱包选型指南', duration: 8 },
      { id: 5, title: '交易流程：UTXO 模型与手续费机制', duration: 12 },
      { id: 6, title: '挖矿原理与共识机制：PoW 详解', duration: 10 },
      { id: 7, title: '价格因素分析：基本面与技术面', duration: 8 },
      { id: 8, title: '风险管理：仓位控制与止损策略', duration: 7 },
      { id: 9, title: '常见骗局识别与安全防护', duration: 5 },
      { id: 10, title: '税务与合规基础认知', duration: 3 },
    ],
    isFree: true,
    isNew: false,
    isHot: true,
    publishedAt: '2025-06-15',
    updatedAt: '2026-05-20',
    cover: '₿',
    language: 'zh-CN',
  },
  {
    id: 'c-eth-201',
    title: '以太坊与智能合约深度解析',
    category: 'blockchain',
    level: 'intermediate',
    type: 'video',
    duration: 180,
    lessons: 18,
    enrolled: 12480,
    rating: 4.9,
    ratingCount: 824,
    instructor: '陈博远',
    tags: ['ETH', '智能合约', 'Solidity', 'EVM'],
    description: '深入学习以太坊虚拟机（EVM）原理、Gas 机制、账户模型与智能合约开发基础。涵盖 ERC-20 / ERC-721 / ERC-1155 等代币标准。',
    highlights: ['EVM 字节码与执行模型', 'Gas 优化与存储布局', 'ERC 标准家族与适用场景', '合约安全常见漏洞'],
    syllabus: [
      { id: 1, title: '以太坊发展史与路线图', duration: 15 },
      { id: 2, title: '账户模型：EOA 与合约账户', duration: 12 },
      { id: 3, title: 'EVM 工作原理与字节码', duration: 18 },
      { id: 4, title: 'Gas 机制与手续费市场', duration: 14 },
      { id: 5, title: 'Solidity 基础语法', duration: 20 },
      { id: 6, title: '合约部署与升级模式', duration: 16 },
      { id: 7, title: 'ERC-20 代币标准', duration: 12 },
      { id: 8, title: 'NFT 与 ERC-721/1155', duration: 14 },
    ],
    isFree: false,
    isNew: true,
    isHot: true,
    publishedAt: '2026-04-10',
    updatedAt: '2026-07-01',
    cover: 'Ξ',
    language: 'zh-CN',
  },
  {
    id: 'c-trade-301',
    title: '现货交易实战：技术分析全攻略',
    category: 'trading',
    level: 'intermediate',
    type: 'interactive',
    duration: 240,
    lessons: 24,
    enrolled: 8920,
    rating: 4.7,
    ratingCount: 612,
    instructor: '王思齐',
    tags: ['交易', 'K线', '技术分析', '指标'],
    description: '从 K 线基础到多周期联动分析，涵盖主流技术指标、形态识别、趋势判断与交易系统构建。配合模拟盘实战演练。',
    highlights: ['K 线语言与多时间框架', 'MACD / RSI / BOLL 应用', '趋势线与通道画法', '构建自己的交易系统'],
    syllabus: [
      { id: 1, title: 'K 线基础：单根与组合形态', duration: 18 },
      { id: 2, title: '支撑阻力与趋势线', duration: 20 },
      { id: 3, title: '技术指标：MA / EMA / MACD', duration: 22 },
      { id: 4, title: '震荡指标：RSI / KDJ', duration: 18 },
      { id: 5, title: '布林带与通道指标', duration: 16 },
      { id: 6, title: '形态学：头肩顶、三角形、旗形', duration: 24 },
      { id: 7, title: '量价关系与成交量分析', duration: 20 },
      { id: 8, title: '交易系统构建与回测', duration: 30 },
    ],
    isFree: false,
    isNew: false,
    isHot: true,
    publishedAt: '2025-09-20',
    updatedAt: '2026-03-15',
    cover: '📊',
    language: 'zh-CN',
  },
  {
    id: 'c-defi-401',
    title: 'DeFi 完全指南：去中心化金融核心协议',
    category: 'defi',
    level: 'advanced',
    type: 'video',
    duration: 300,
    lessons: 20,
    enrolled: 5840,
    rating: 4.8,
    ratingCount: 384,
    instructor: '苏雨晴',
    tags: ['DeFi', 'AMM', '借贷', '收益'],
    description: '系统讲解 Uniswap / Curve / Aave / Compound 等头部协议原理、流动性挖矿、收益聚合与风险管理。',
    highlights: ['AMM 公式与无常损失', '借贷协议利率模型', '收益聚合器策略', '跨链桥风险分析'],
    syllabus: [
      { id: 1, title: 'DeFi 生态全景图', duration: 20 },
      { id: 2, title: 'AMM 原理：x*y=k 与改进', duration: 25 },
      { id: 3, title: 'Uniswap V2/V3/V4 演进', duration: 28 },
      { id: 4, title: 'Curve 与稳定币兑换', duration: 22 },
      { id: 5, title: 'Aave / Compound 借贷模型', duration: 26 },
      { id: 6, title: '无常损失计算与对冲', duration: 24 },
      { id: 7, title: '收益聚合器 Yearn / Beefy', duration: 20 },
    ],
    isFree: false,
    isNew: true,
    isHot: false,
    publishedAt: '2026-05-08',
    updatedAt: '2026-07-12',
    cover: '🏦',
    language: 'zh-CN',
  },
  {
    id: 'c-security-201',
    title: '数字资产安全防护实战',
    category: 'security',
    level: 'intermediate',
    type: 'video',
    duration: 150,
    lessons: 15,
    enrolled: 11240,
    rating: 4.9,
    ratingCount: 956,
    instructor: '林思远',
    tags: ['安全', '钱包', '防骗', '私钥'],
    description: '系统讲解私钥管理、硬件钱包使用、钓鱼识别、合约授权风险与多签方案。保护你的数字资产安全。',
    highlights: ['私钥生命周期管理', '硬件钱包配置实战', '钓鱼攻击识别清单', '授权管理与撤销'],
    syllabus: [
      { id: 1, title: '私钥、助记词、Keystore 区别', duration: 12 },
      { id: 2, title: '硬件钱包选型与初始化', duration: 18 },
      { id: 3, title: '常见钓鱼攻击手法', duration: 15 },
      { id: 4, title: '授权 (Approve) 风险与撤销', duration: 14 },
      { id: 5, title: '多签钱包方案设计', duration: 16 },
      { id: 6, title: '应急响应：被盗后如何处理', duration: 12 },
    ],
    isFree: true,
    isNew: false,
    isHot: true,
    publishedAt: '2025-11-10',
    updatedAt: '2026-06-05',
    cover: '🛡️',
    language: 'zh-CN',
  },
  {
    id: 'c-wallet-101',
    title: '钱包类型全解：从托管到自托管',
    category: 'wallet',
    level: 'beginner',
    type: 'article',
    duration: 45,
    lessons: 8,
    enrolled: 14820,
    rating: 4.6,
    ratingCount: 728,
    instructor: '陈博远',
    tags: ['钱包', '自托管', 'CEX', 'DEX'],
    description: '对比中心化钱包、去中心化钱包、硬件钱包、纸钱包的优缺点，帮助你选择合适的钱包方案。',
    highlights: ['CEX vs DEX 钱包对比', '助记词备份最佳实践', '多链钱包资产管理', '钱包安全审计要点'],
    syllabus: [
      { id: 1, title: '钱包的本质与分类', duration: 8 },
      { id: 2, title: '中心化钱包（CEX）', duration: 6 },
      { id: 3, title: '去中心化钱包（DEX）', duration: 8 },
      { id: 4, title: '硬件钱包深度对比', duration: 10 },
      { id: 5, title: '助记词与多签方案', duration: 7 },
    ],
    isFree: true,
    isNew: false,
    isHot: false,
    publishedAt: '2025-04-20',
    updatedAt: '2025-12-10',
    cover: '👛',
    language: 'zh-CN',
  },
  {
    id: 'c-tg-301',
    title: '树图公链生态深度研究',
    category: 'treegraph',
    level: 'advanced',
    type: 'video',
    duration: 200,
    lessons: 16,
    enrolled: 3840,
    rating: 4.7,
    ratingCount: 248,
    instructor: '苏雨晴',
    tags: ['树图', 'Conflux', 'CFX', '高性能公链'],
    description: '深入了解树图公链的 DAG 架构、共识机制、生态项目与开发工具。学习在树图链上部署 DApp。',
    highlights: ['Tree-Graph DAG 原理', 'Conflux 共识机制', '树图生态项目解析', '树图智能合约开发'],
    syllabus: [
      { id: 1, title: '树图公链诞生背景', duration: 15 },
      { id: 2, title: 'DAG 与 Tree-Graph 结构', duration: 22 },
      { id: 3, title: 'Conflux 共识机制详解', duration: 25 },
      { id: 4, title: '树图代币经济模型', duration: 18 },
      { id: 5, title: '树图生态项目案例', duration: 24 },
      { id: 6, title: '树图智能合约开发', duration: 28 },
    ],
    isFree: false,
    isNew: true,
    isHot: false,
    publishedAt: '2026-06-01',
    updatedAt: '2026-07-10',
    cover: '🌳',
    language: 'zh-CN',
  },
  {
    id: 'c-reg-201',
    title: '全球数字资产合规研究与监管动态',
    category: 'regulation',
    level: 'intermediate',
    type: 'article',
    duration: 120,
    lessons: 12,
    enrolled: 6240,
    rating: 4.5,
    ratingCount: 412,
    instructor: '王思齐',
    tags: ['合规', '监管', 'AML', 'KYC'],
    description: '梳理全球主要司法管辖区的数字资产监管框架、合规研究方向与监管动态。仅作为研究方向参考。',
    highlights: ['主要司法管辖区监管框架', 'KYC/AML 实践要点', '反洗钱合规研究方向', '税务合规基础认知'],
    syllabus: [
      { id: 1, title: '数字资产监管发展史', duration: 12 },
      { id: 2, title: '主要司法管辖区概览', duration: 18 },
      { id: 3, title: '欧盟 MiCA 框架研究', duration: 16 },
      { id: 4, title: 'KYC/AML 合规要点', duration: 14 },
      { id: 5, title: '反洗钱研究方向', duration: 12 },
      { id: 6, title: '税务合规基础', duration: 10 },
    ],
    isFree: true,
    isNew: false,
    isHot: false,
    publishedAt: '2026-01-15',
    updatedAt: '2026-06-20',
    cover: '⚖️',
    language: 'zh-CN',
  },
  {
    id: 'c-trade-401',
    title: '高级交易策略：套利与做市',
    category: 'trading',
    level: 'expert',
    type: 'interactive',
    duration: 360,
    lessons: 30,
    enrolled: 1840,
    rating: 4.9,
    ratingCount: 124,
    instructor: '王思齐',
    tags: ['套利', '做市', '量化', '高级'],
    description: '深入讲解跨交易所套利、资金费率套利、做市策略原理与风险控制。仅供专业用户研究。',
    highlights: ['现货-期货套利模型', '资金费率策略', '做市报价策略', '套利风险与滑点管理'],
    syllabus: [
      { id: 1, title: '套利基础：理论与边界', duration: 25 },
      { id: 2, title: '跨交易所价差套利', duration: 30 },
      { id: 3, title: '资金费率套利策略', duration: 28 },
      { id: 4, title: '做市策略原理与实现', duration: 35 },
      { id: 5, title: '滑点与流动性管理', duration: 26 },
    ],
    isFree: false,
    isNew: true,
    isHot: false,
    publishedAt: '2026-06-20',
    updatedAt: '2026-07-15',
    cover: '💹',
    language: 'zh-CN',
  },
  {
    id: 'c-basics-quiz',
    title: '新手必做：10分钟数字资产入门测评',
    category: 'basics',
    level: 'beginner',
    type: 'quiz',
    duration: 10,
    lessons: 1,
    enrolled: 28420,
    rating: 4.7,
    ratingCount: 1824,
    instructor: '陈博远',
    tags: ['测评', '入门', '10分钟'],
    description: '通过 20 道选择题快速测试你的数字资产知识水平，找到适合自己的学习起点。',
    highlights: ['10 分钟快速测评', '20 道精选题目', '立即获得学习建议', '可下载测评报告'],
    syllabus: [
      { id: 1, title: '数字资产入门 20 题', duration: 10 },
    ],
    isFree: true,
    isNew: false,
    isHot: true,
    publishedAt: '2025-08-01',
    updatedAt: '2026-05-15',
    cover: '✏️',
    language: 'zh-CN',
  },
  {
    id: 'c-blockchain-201',
    title: '区块链原理：从分布式账本到共识机制',
    category: 'blockchain',
    level: 'intermediate',
    type: 'video',
    duration: 160,
    lessons: 14,
    enrolled: 7840,
    rating: 4.8,
    ratingCount: 524,
    instructor: '陈博远',
    tags: ['区块链', '共识', '分布式', '技术'],
    description: '从密码学基础到共识机制演进，深度理解区块链技术原理。涵盖 PoW / PoS / PoH 等主流共识。',
    highlights: ['密码学基础：哈希与签名', '分布式账本与一致性', 'PoW / PoS / DPoS 对比', '分片与扩容方案'],
    syllabus: [
      { id: 1, title: '密码学基础：哈希与非对称加密', duration: 16 },
      { id: 2, title: '分布式账本原理', duration: 14 },
      { id: 3, title: 'P2P 网络与节点通信', duration: 12 },
      { id: 4, title: 'PoW 工作量证明', duration: 18 },
      { id: 5, title: 'PoS 权益证明演进', duration: 16 },
      { id: 6, title: '新型共识：PoH / PoH / HotStuff', duration: 20 },
    ],
    isFree: false,
    isNew: false,
    isHot: false,
    publishedAt: '2025-12-01',
    updatedAt: '2026-04-20',
    cover: '🔗',
    language: 'zh-CN',
  },
  {
    id: 'c-live-master',
    title: '大师直播课：每周市场复盘与策略',
    category: 'trading',
    level: 'advanced',
    type: 'live',
    duration: 90,
    lessons: 1,
    enrolled: 4280,
    rating: 4.8,
    ratingCount: 312,
    instructor: '王思齐',
    tags: ['直播', '复盘', '策略', '高级'],
    description: '每周四晚 20:00 直播，邀请资深交易员复盘上周市场，分享下周交易策略与风险提示。',
    highlights: ['每周市场复盘', '交易策略分享', '实时互动答疑', '历史回放永久可看'],
    syllabus: [
      { id: 1, title: '本周市场复盘与下周展望', duration: 90 },
    ],
    isFree: false,
    isNew: true,
    isHot: true,
    publishedAt: '2026-04-15',
    updatedAt: '2026-07-18',
    cover: '🎙️',
    language: 'zh-CN',
  },
];

const VIDEOS: VideoItem[] = [
  {
    id: 'v-001',
    title: '什么是区块链？5 分钟搞懂核心技术',
    series: '入门必看',
    episode: 1,
    totalEpisodes: 12,
    duration: 312,
    views: 184200,
    likes: 8240,
    thumbnail: '#0E9B6A',
    publishedAt: '2026-05-10',
    instructor: '林思远',
    description: '用最通俗的语言解释区块链的核心原理：去中心化、不可篡改、可追溯。',
    chapters: [
      { id: 1, title: '引言：互联网 vs 区块链', start: 0 },
      { id: 2, title: '区块与链的结构', start: 45 },
      { id: 3, title: '去中心化网络', start: 120 },
      { id: 4, title: '共识机制简介', start: 200 },
    ],
    tags: ['入门', '区块链', '科普'],
    level: 'beginner',
  },
  {
    id: 'v-002',
    title: '如何安全地保存你的私钥',
    series: '安全系列',
    episode: 1,
    totalEpisodes: 8,
    duration: 480,
    views: 96400,
    likes: 4280,
    thumbnail: '#F6465D',
    publishedAt: '2026-06-01',
    instructor: '林思远',
    description: '私钥是数字资产的唯一凭证。本视频教你如何安全地生成、存储、备份私钥。',
    chapters: [
      { id: 1, title: '私钥与助记词的关系', start: 0 },
      { id: 2, title: '冷热钱包分离原则', start: 90 },
      { id: 3, title: '硬件钱包配置实战', start: 200 },
      { id: 4, title: '多签方案设计', start: 320 },
    ],
    tags: ['安全', '私钥', '钱包'],
    level: 'beginner',
  },
  {
    id: 'v-003',
    title: 'K 线基础：单根 K 线的 12 个秘密',
    series: '交易学院',
    episode: 1,
    totalEpisodes: 24,
    duration: 624,
    views: 142800,
    likes: 6840,
    thumbnail: '#FFA940',
    publishedAt: '2026-04-15',
    instructor: '王思齐',
    description: '从开盘价、收盘价、最高价、最低价出发，深入解读单根 K 线背后的市场语言。',
    chapters: [
      { id: 1, title: 'K 线四要素', start: 0 },
      { id: 2, title: '实体与影线的含义', start: 100 },
      { id: 3, title: '常见 K 线形态', start: 240 },
      { id: 4, title: 'K 线组合应用', start: 420 },
    ],
    tags: ['交易', 'K线', '技术分析'],
    level: 'intermediate',
  },
  {
    id: 'v-004',
    title: 'DeFi 协议原理：Uniswap V3 集中流动性',
    series: 'DeFi 深入',
    episode: 5,
    totalEpisodes: 12,
    duration: 720,
    views: 48200,
    likes: 2120,
    thumbnail: '#44dbf4',
    publishedAt: '2026-05-25',
    instructor: '苏雨晴',
    description: '详解 Uniswap V3 集中流动性机制、Tick 设计与无常损失计算。',
    chapters: [
      { id: 1, title: 'AMM 发展史', start: 0 },
      { id: 2, title: 'V3 集中流动性原理', start: 150 },
      { id: 3, title: 'Tick 系统详解', start: 320 },
      { id: 4, title: '无常损失计算', start: 480 },
    ],
    tags: ['DeFi', 'Uniswap', 'AMM'],
    level: 'advanced',
  },
  {
    id: 'v-005',
    title: 'Launch 申购全流程演示',
    series: '操作指南',
    episode: 1,
    totalEpisodes: 6,
    duration: 540,
    views: 32800,
    likes: 1480,
    thumbnail: '#14B881',
    publishedAt: '2026-07-01',
    instructor: '陈博远',
    description: '从项目发现、KYC 校验、申购下单到中签查询的完整流程演示。',
    chapters: [
      { id: 1, title: '项目筛选与评估', start: 0 },
      { id: 2, title: 'KYC 校验流程', start: 120 },
      { id: 3, title: '申购下单', start: 240 },
      { id: 4, title: '中签与代币分发', start: 380 },
    ],
    tags: ['Launch', '申购', '操作'],
    level: 'beginner',
  },
  {
    id: 'v-006',
    title: '树图公链生态：DApp 开发入门',
    series: '公链研究',
    episode: 1,
    totalEpisodes: 10,
    duration: 880,
    views: 12400,
    likes: 580,
    thumbnail: '#7c3aed',
    publishedAt: '2026-06-20',
    instructor: '苏雨晴',
    description: '在树图公链上从零开发一个 DApp：环境搭建、合约编写、部署、交互。',
    chapters: [
      { id: 1, title: '树图公链特性介绍', start: 0 },
      { id: 2, title: '开发环境搭建', start: 180 },
      { id: 3, title: '智能合约开发', start: 360 },
      { id: 4, title: '前端集成与部署', start: 600 },
    ],
    tags: ['树图', 'DApp', '开发'],
    level: 'advanced',
  },
  {
    id: 'v-007',
    title: '钱包授权风险：Approve 攻击与防护',
    series: '安全系列',
    episode: 3,
    totalEpisodes: 8,
    duration: 420,
    views: 68400,
    likes: 3120,
    thumbnail: '#F6465D',
    publishedAt: '2026-06-12',
    instructor: '林思远',
    description: '授权 (Approve) 是 DeFi 用户最常被攻击的入口。本视频详解原理与防护。',
    chapters: [
      { id: 1, title: 'Approve 机制原理', start: 0 },
      { id: 2, title: '常见攻击手法', start: 120 },
      { id: 3, title: '授权撤销工具', start: 240 },
      { id: 4, title: '安全实践清单', start: 340 },
    ],
    tags: ['安全', '授权', 'DeFi'],
    level: 'intermediate',
  },
  {
    id: 'v-008',
    title: 'KYC 与 AML：交易所合规研究方向',
    series: '合规研究',
    episode: 1,
    totalEpisodes: 6,
    duration: 580,
    views: 18200,
    likes: 820,
    thumbnail: '#0E9B6A',
    publishedAt: '2026-05-30',
    instructor: '王思齐',
    description: '了解全球主要司法管辖区的 KYC/AML 合规框架与研究方向。仅作为研究方向参考。',
    chapters: [
      { id: 1, title: 'KYC 基础概念', start: 0 },
      { id: 2, title: '主要框架对比', start: 140 },
      { id: 3, title: 'AML 风险监测', start: 300 },
      { id: 4, title: '未来趋势研究', start: 440 },
    ],
    tags: ['合规', 'KYC', 'AML'],
    level: 'intermediate',
  },
];

const PATHS: LearningPath[] = [
  {
    id: 'p-newbie',
    title: '新手入门路径：从 0 到 1 认知数字资产',
    description: '为完全零基础用户设计的系统化入门路径，涵盖数字资产基础、钱包安全、风险认知。',
    goal: '建立完整的数字资产认知框架，能够独立管理自己的钱包资产',
    totalCourses: 6,
    totalDuration: 480,
    enrolled: 38420,
    completed: 12480,
    difficulty: 'beginner',
    targetAudience: ['零基础用户', '准备买入第一笔数字资产', '希望系统学习'],
    courses: ['c-btc-101', 'c-wallet-101', 'c-basics-quiz', 'c-security-201', 'c-trade-301', 'c-reg-201'],
    certification: 'cert-basics',
    badge: '🌱',
    color: '#14B881',
  },
  {
    id: 'p-trader',
    title: '交易员进阶路径：从技术分析到交易系统',
    description: '为有志于成为专业交易员的用户设计，覆盖 K 线、指标、策略、风险管理与心理建设。',
    goal: '构建自己的交易系统，具备独立分析与执行能力',
    totalCourses: 5,
    totalDuration: 720,
    enrolled: 12840,
    completed: 3840,
    difficulty: 'intermediate',
    targetAudience: ['已有基础', '希望提升交易能力', '准备进入专业交易'],
    courses: ['c-trade-301', 'c-trade-401', 'c-blockchain-201', 'c-security-201', 'c-reg-201'],
    certification: 'cert-trader',
    badge: '📈',
    color: '#FFA940',
  },
  {
    id: 'p-defi',
    title: 'DeFi 专家路径：协议原理与高级策略',
    description: '深入 DeFi 协议原理、收益策略、风险管理与跨链操作。',
    goal: '成为 DeFi 协议专家，能够独立设计并评估 DeFi 策略',
    totalCourses: 6,
    totalDuration: 900,
    enrolled: 5840,
    completed: 1240,
    difficulty: 'advanced',
    targetAudience: ['有交易经验', '希望深入 DeFi', '想做协议研究者'],
    courses: ['c-defi-401', 'c-eth-201', 'c-blockchain-201', 'c-trade-401', 'c-security-201', 'c-tg-301'],
    certification: 'cert-defi',
    badge: '🏦',
    color: '#44dbf4',
  },
  {
    id: 'p-security',
    title: '安全专家路径：攻防与应急响应',
    description: '系统学习数字资产安全：钱包管理、攻击识别、应急响应与多签方案。',
    goal: '具备专业的安全防护能力，能够识别并应对主流攻击',
    totalCourses: 4,
    totalDuration: 540,
    enrolled: 8240,
    completed: 2120,
    difficulty: 'intermediate',
    targetAudience: ['高净值用户', '做市商', '专业交易团队'],
    courses: ['c-security-201', 'c-wallet-101', 'c-eth-201', 'c-defi-401'],
    certification: 'cert-security',
    badge: '🛡️',
    color: '#F6465D',
  },
  {
    id: 'p-developer',
    title: '开发者路径：从智能合约到 DApp',
    description: '为开发者设计的完整路径：Solidity 基础、合约安全、DApp 开发与树图生态。',
    goal: '能够独立完成智能合约开发与 DApp 部署',
    totalCourses: 5,
    totalDuration: 800,
    enrolled: 4280,
    completed: 980,
    difficulty: 'advanced',
    targetAudience: ['开发者', '想做 DApp', '智能合约工程师'],
    courses: ['c-blockchain-201', 'c-eth-201', 'c-defi-401', 'c-tg-301', 'c-security-201'],
    certification: 'cert-developer',
    badge: '💻',
    color: '#7c3aed',
  },
];

const INSTRUCTORS: Instructor[] = [
  {
    id: 'i-001',
    name: '林思远',
    title: '安全研究负责人',
    avatar: '🛡️',
    bio: '10 年信息安全经验，前头部交易所安全团队负责人，专注数字资产安全研究。',
    expertise: ['钱包安全', '私钥管理', '合约审计', '应急响应'],
    courses: 5,
    students: 38420,
    rating: 4.9,
    yearsOfExperience: 10,
    background: ['CISSP', '前头部交易所安全负责人', '多次主导安全事件响应'],
    signature: '安全是一切的基础。',
  },
  {
    id: 'i-002',
    name: '陈博远',
    title: '区块链技术专家',
    avatar: '⛓️',
    bio: '区块链技术布道者，前公链核心开发者，深入研究智能合约与公链架构。',
    expertise: ['区块链原理', '智能合约', 'Solidity', '公链架构'],
    courses: 6,
    students: 28640,
    rating: 4.8,
    yearsOfExperience: 8,
    background: ['清华大学计算机硕士', '前 Conflux 核心开发者', 'Solidity 认证开发者'],
    signature: '让复杂的技术变得简单。',
  },
  {
    id: 'i-003',
    name: '王思齐',
    title: '高级交易策略师',
    avatar: '📊',
    bio: '12 年金融市场经验，专注量化交易与做市策略，曾管理过亿规模资金。',
    expertise: ['技术分析', '量化策略', '做市', '套利'],
    courses: 4,
    students: 14820,
    rating: 4.8,
    yearsOfExperience: 12,
    background: ['CFA', 'FRM', '前头部量化基金交易员'],
    signature: '纪律与系统比预测更重要。',
  },
  {
    id: 'i-004',
    name: '苏雨晴',
    title: 'DeFi 研究员',
    avatar: '🏦',
    bio: '专注 DeFi 协议研究与风险评估，发表多篇行业研究报告。',
    expertise: ['DeFi 协议', 'AMM', '收益策略', '链上数据'],
    courses: 3,
    students: 9820,
    rating: 4.7,
    yearsOfExperience: 6,
    background: ['北京大学金融学硕士', 'DeFi 研究员', '链上分析师'],
    signature: '读懂协议，比追价格更重要。',
  },
  {
    id: 'i-005',
    name: '李建国',
    title: '合规研究方向专家',
    avatar: '⚖️',
    bio: '前国际律所金融合规顾问，专注数字资产合规研究方向。',
    expertise: ['KYC/AML', '反洗钱', '监管框架', '合规研究'],
    courses: 2,
    students: 6240,
    rating: 4.6,
    yearsOfExperience: 15,
    background: ['纽约州律师执照', '前国际律所合伙人', '合规研究方向顾问'],
    signature: '合规是行业长期发展的基石。',
  },
];

const CERTS: Cert[] = [
  {
    id: 'cert-basics',
    name: '数字资产基础认证',
    level: 'beginner',
    description: '面向新手用户的入门级认证，证明持有人具备数字资产基础认知。',
    requirements: ['完成新手入门路径全部 6 门课程', '通过 50 题综合测评（80 分及格）', '签署合规承诺书'],
    validity: 24,
    holders: 12480,
    passRate: 78,
    examDuration: 60,
    questions: 50,
    color: '#14B881',
    icon: '🌱',
  },
  {
    id: 'cert-trader',
    name: '专业交易员认证',
    level: 'intermediate',
    description: '面向专业交易员的认证，证明持有人具备独立分析与执行能力。',
    requirements: ['完成交易员进阶路径', '通过 100 题综合测评', '提交实盘交易记录（脱敏）', '通过面试评审'],
    validity: 12,
    holders: 3840,
    passRate: 42,
    examDuration: 120,
    questions: 100,
    color: '#FFA940',
    icon: '📈',
  },
  {
    id: 'cert-defi',
    name: 'DeFi 协议专家认证',
    level: 'advanced',
    description: '高级认证，证明持有人对 DeFi 协议有深入理解。',
    requirements: ['完成 DeFi 专家路径', '提交 DeFi 策略研究文章', '通过 120 题高级测评', '通过答辩评审'],
    validity: 12,
    holders: 1240,
    passRate: 28,
    examDuration: 180,
    questions: 120,
    color: '#44dbf4',
    icon: '🏦',
  },
  {
    id: 'cert-security',
    name: '安全专家认证',
    level: 'advanced',
    description: '专业安全认证，证明持有人具备安全防护与应急响应能力。',
    requirements: ['完成安全专家路径', '通过实操攻防测试', '提交应急响应方案', '通过安全专家评审'],
    validity: 12,
    holders: 2120,
    passRate: 35,
    examDuration: 180,
    questions: 80,
    color: '#F6465D',
    icon: '🛡️',
  },
  {
    id: 'cert-developer',
    name: '智能合约开发者认证',
    level: 'expert',
    description: '面向开发者的专家级认证，证明持有人具备智能合约开发能力。',
    requirements: ['完成开发者路径', '提交原创智能合约项目', '通过代码审查', '通过现场答辩'],
    validity: 12,
    holders: 980,
    passRate: 22,
    examDuration: 240,
    questions: 60,
    color: '#7c3aed',
    icon: '💻',
  },
];

const CASES: CaseStudy[] = [
  {
    id: 'case-001',
    title: 'Mt. Gox 事件：中心化交易所的教训',
    scenario: '史上最大数字资产被盗事件',
    category: 'incident',
    description: '2014 年 Mt. Gox 因热钱包管理不善导致约 85 万枚 BTC 丢失，引发行业对中心化托管的全面反思。',
    lessons: ['私钥管理是平台生命线', '热冷钱包分离必要性', '定期第三方审计的重要性', '用户资产隔离与公示'],
    year: 2014,
    region: '日本',
    impact: '推动行业建立多签与冷钱包标准',
    references: ['Mt. Gox 破产报告', 'CoinDesk 事件复盘'],
  },
  {
    id: 'case-002',
    title: 'The DAO 事件：智能合约漏洞代价',
    scenario: '智能合约重入漏洞被攻击',
    category: 'warning',
    description: '2016 年 The DAO 因重入漏洞被攻击，360 万 ETH 被盗，最终导致以太坊硬分叉。',
    lessons: ['智能合约代码审计至关重要', '重入漏洞是经典安全问题', '应急响应与社区治理', '代码即法律的代价'],
    year: 2016,
    region: '全球',
    impact: '催生 OpenZeppelin 等安全库',
    references: ['The DAO 事件技术分析', '以太坊黄皮书后续更新'],
  },
  {
    id: 'case-003',
    title: 'DeFi Summer：Uniswap 引领的创新浪潮',
    scenario: 'AMM 机制的成功应用',
    category: 'success',
    description: '2020 年 Uniswap V2 上线引爆 DeFi Summer，AMM 机制被证明是去中心化交易的有效方案。',
    lessons: ['机制设计决定协议成功', '流动性激励的重要性', '无需许可的可组合性', '社区驱动增长'],
    year: 2020,
    region: '全球',
    impact: '开启 DeFi 万亿规模时代',
    references: ['Uniswap V2 白皮书', 'DeFi Pulse 增长数据'],
  },
  {
    id: 'case-004',
    title: 'Ronin Bridge 攻击：跨链桥的脆弱性',
    scenario: '跨链桥验证节点被攻破',
    category: 'incident',
    description: '2022 年 Ronin Bridge 因验证节点被攻破，损失超 6 亿美元，成为史上最严重的跨链桥攻击之一。',
    lessons: ['跨链桥是高价值攻击目标', '验证节点需要严格防护', '去中心化验证者网络', '实时监控与快速响应'],
    year: 2022,
    region: '全球',
    impact: '推动跨链桥安全标准升级',
    references: ['Ronin Network 事后分析报告', '慢雾科技复盘'],
  },
  {
    id: 'case-005',
    title: '链上数据透明：Tether 储备金公示',
    scenario: '稳定币透明化的行业实践',
    category: 'lesson',
    description: 'Tether 定期公示 USDT 储备金构成，引领稳定币行业向更透明的运营模式发展。',
    lessons: ['透明化是建立信任的关键', '定期储备金公示机制', '第三方审计增强可信度', '稳定币的合规研究方向'],
    year: 2021,
    region: '全球',
    impact: '推动稳定币储备公示成为行业标准',
    references: ['Tether 储备公示报告', 'BDO 审计意见'],
  },
  {
    id: 'case-006',
    title: '中国数字藏品探索：合规化数字资产',
    scenario: '中国市场的合规化探索',
    category: 'lesson',
    description: '中国数字藏品市场在合规框架下探索数字资产应用，强调实名、限价、严控二次交易。',
    lessons: ['合规框架下的产品创新', '二级市场管控与价值发现', '实名制与反洗钱', '本土化合规研究方向'],
    year: 2022,
    region: '中国',
    impact: '为合规化数字资产提供本土样本',
    references: ['中国互联网金融协会公告', '行业研究报告'],
  },
];

const PROGRESS: Progress = {
  totalMinutes: 4280,
  coursesCompleted: 18,
  coursesInProgress: 4,
  certsEarned: 2,
  currentStreak: 28,
  longestStreak: 56,
  weeklyMinutes: [45, 80, 65, 90, 70, 120, 95],
  monthlyCourses: [2, 1, 3, 2, 4, 3, 2, 5, 3, 4, 2, 3],
  rank: 1248,
  percentile: 8,
  points: 4280,
  level: 12,
  nextLevelPoints: 5000,
};

// ============== 工具函数 ==============

const formatNumber = (n: number): string => {
  if (n >= 100000000) return (n / 100000000).toFixed(2) + ' 亿';
  if (n >= 10000) return (n / 10000).toFixed(2) + ' 万';
  return n.toLocaleString('zh-CN');
};

const formatDuration = (minutes: number): string => {
  if (minutes >= 60) {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m > 0 ? `${h} 小时 ${m} 分钟` : `${h} 小时`;
  }
  return `${minutes} 分钟`;
};

const formatTime = (seconds: number): string => {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

const formatDate = (date: string): string => {
  const d = new Date(date);
  return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`;
};

const CATEGORY_MAP: Record<Category, { label: string; color: string; icon: any }> = {
  basics: { label: '基础知识', color: BRAND.primary, icon: BookOpen },
  trading: { label: '交易学院', color: BRAND.warning, icon: BarChart3 },
  defi: { label: 'DeFi 协议', color: BRAND.info, icon: Boxes },
  security: { label: '安全防护', color: BRAND.danger, icon: Shield },
  blockchain: { label: '区块链技术', color: '#7c3aed', icon: Network },
  regulation: { label: '合规研究', color: BRAND.gold, icon: Briefcase },
  wallet: { label: '钱包管理', color: BRAND.success, icon: Wallet },
  treegraph: { label: '树图公链', color: '#ec4899', icon: Compass },
};

const LEVEL_MAP: Record<Level, { label: string; color: string }> = {
  beginner: { label: '入门', color: BRAND.success },
  intermediate: { label: '进阶', color: BRAND.warning },
  advanced: { label: '高级', color: BRAND.danger },
  expert: { label: '专家', color: '#7c3aed' },
};

const TYPE_MAP: Record<CourseType, { label: string; color: string }> = {
  video: { label: '视频课', color: BRAND.info },
  article: { label: '图文', color: BRAND.textSub },
  interactive: { label: '互动', color: BRAND.warning },
  quiz: { label: '测评', color: BRAND.primary },
  live: { label: '直播', color: BRAND.danger },
};

// ============== 主组件 ==============

export function PortalAcademy() {
  const [tab, setTab] = useState<Tab>('overview');
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState<Category | 'all'>('all');
  const [levelFilter, setLevelFilter] = useState<Level | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<CourseType | 'all'>('all');
  const [sortBy, setSortBy] = useState<'enrolled' | 'rating' | 'newest' | 'duration'>('enrolled');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [drawer, setDrawer] = useState<DrawerState>({ open: false, type: null, payload: null });
  const [helpOpen, setHelpOpen] = useState(false);
  const [enrolled, setEnrolled] = useState<Record<string, boolean>>({
    'c-btc-101': true,
    'c-wallet-101': true,
    'c-basics-quiz': true,
    'c-security-201': false,
  });
  const [kpi, setKpi] = useState<KpiSnapshot>({
    activeLearners: 38620,
    totalCourses: 168,
    totalVideos: 1240,
    totalInstructors: 42,
    certsIssued: 20660,
    totalMinutes: 1862400,
    liveStudents: 1284,
    todayCompletions: 428,
  });
  const searchRef = useRef<HTMLInputElement>(null);

  // ========== 实时数据更新 ==========
  useEffect(() => {
    const t = setInterval(() => {
      setKpi((prev) => ({
        ...prev,
        activeLearners: prev.activeLearners + Math.floor(Math.random() * 20 - 8),
        liveStudents: Math.max(800, Math.min(2000, prev.liveStudents + Math.floor(Math.random() * 30 - 12))),
        todayCompletions: prev.todayCompletions + Math.floor(Math.random() * 3),
        certsIssued: prev.certsIssued + (Math.random() > 0.7 ? 1 : 0),
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
      else if (e.key === '2') setTab('courses');
      else if (e.key === '3') setTab('videos');
      else if (e.key === '4') setTab('paths');
      else if (e.key === '5') setTab('graph');
      else if (e.key === '6') setTab('cases');
      else if (e.key === '7') setTab('cert');
      else if (e.key === '8') setTab('progress');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [drawer.open, helpOpen]);

  // ========== 过滤与排序 ==========
  const filteredCourses = useMemo(() => {
    let list = [...COURSES];
    if (catFilter !== 'all') list = list.filter((c) => c.category === catFilter);
    if (levelFilter !== 'all') list = list.filter((c) => c.level === levelFilter);
    if (typeFilter !== 'all') list = list.filter((c) => c.type === typeFilter);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q) ||
          c.tags.some((t) => t.toLowerCase().includes(q)) ||
          c.instructor.toLowerCase().includes(q)
      );
    }
    list.sort((a, b) => {
      let diff = 0;
      if (sortBy === 'enrolled') diff = a.enrolled - b.enrolled;
      else if (sortBy === 'rating') diff = a.rating - b.rating;
      else if (sortBy === 'newest') diff = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
      else if (sortBy === 'duration') diff = a.duration - b.duration;
      return sortDir === 'asc' ? diff : -diff;
    });
    return list;
  }, [catFilter, levelFilter, typeFilter, search, sortBy, sortDir]);

  const filteredVideos = useMemo(() => {
    let list = [...VIDEOS];
    if (levelFilter !== 'all') list = list.filter((v) => v.level === levelFilter);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (v) =>
          v.title.toLowerCase().includes(q) ||
          v.series.toLowerCase().includes(q) ||
          v.tags.some((t) => t.toLowerCase().includes(q)) ||
          v.instructor.toLowerCase().includes(q)
      );
    }
    list.sort((a, b) => b.views - a.views);
    return list;
  }, [levelFilter, search]);

  // ========== Handlers ==========
  const openDrawer = useCallback((type: DrawerType, payload: string | null = null) => {
    setDrawer({ open: true, type, payload });
  }, []);

  const closeDrawer = useCallback(() => {
    setDrawer({ open: false, type: null, payload: null });
  }, []);

  const toggleEnroll = useCallback((id: string) => {
    setEnrolled((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  // 当前 Drawer payload
  const drawerCourse = drawer.type === 'course' ? COURSES.find((c) => c.id === drawer.payload) : null;
  const drawerVideo = drawer.type === 'video' ? VIDEOS.find((v) => v.id === drawer.payload) : null;
  const drawerInstructor = drawer.type === 'instructor' ? INSTRUCTORS.find((i) => i.id === drawer.payload) : null;
  const drawerCert = drawer.type === 'cert' ? CERTS.find((c) => c.id === drawer.payload) : null;
  const drawerCase = drawer.type === 'case' ? CASES.find((c) => c.id === drawer.payload) : null;

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
            <GraduationCap size={18} style={{ color: BRAND.primary }} />
            <span className="text-xs font-mono tracking-wider" style={{ color: BRAND.primary }}>ZSDEX ACADEMY · 数字资产学院</span>
          </div>
          <h1 className="text-3xl lg:text-4xl font-bold mb-3" style={{ color: BRAND.text }}>
            系统化学习数字资产
          </h1>
          <p className="text-sm lg:text-base max-w-3xl" style={{ color: BRAND.textSub }}>
            中萨数字科技交易所数字资产学院。提供从入门到专家的系统化课程、专业视频教程、学习路径规划与认证体系。
            严格遵循"投资有风险、学习需谨慎"理念，所有内容仅供学习研究，不构成任何投资建议。
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <button
              onClick={() => setTab('paths')}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-all hover:scale-105"
              style={{ backgroundColor: BRAND.primary, color: BRAND.onPrimary }}
            >
              <Compass size={14} className="inline mr-1" /> 浏览学习路径
            </button>
            <button
              onClick={() => setTab('courses')}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-all hover:scale-105"
              style={{ backgroundColor: BRAND.bgCard, color: BRAND.text, border: `1px solid ${BRAND.border}` }}
            >
              <BookOpen size={14} className="inline mr-1" /> 课程库
            </button>
            <button
              onClick={() => setTab('cert')}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-all hover:scale-105"
              style={{ backgroundColor: BRAND.bgCard, color: BRAND.text, border: `1px solid ${BRAND.border}` }}
            >
              <Award size={14} className="inline mr-1" /> 认证中心
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
          <KpiCard label="活跃学员" value={kpi.activeLearners} icon={Users} color={BRAND.primary} trend={4.2} hint="实时统计" />
          <KpiCard label="课程总数" value={kpi.totalCourses} icon={BookOpen} color={BRAND.info} trend={2.1} hint="覆盖 8 大分类" />
          <KpiCard label="视频教程" value={kpi.totalVideos} icon={Video} color={BRAND.warning} trend={1.8} hint="总时长 1.8M 分钟" />
          <KpiCard label="认证发放" value={kpi.certsIssued} icon={Award} color={BRAND.success} trend={3.5} hint="5 大认证体系" />
          <KpiCard label="直播学员" value={kpi.liveStudents} icon={Activity} color={BRAND.danger} trend={-1.2} hint="当前在线" />
          <KpiCard label="今日完课" value={kpi.todayCompletions} icon={CheckCircle2} color={BRAND.gold} trend={6.8} hint="实时增长中" />
          <KpiCard label="授课专家" value={kpi.totalInstructors} icon={User} color="#7c3aed" trend={0.5} hint="行业资深专家" />
          <KpiCard label="累计学时" value={kpi.totalMinutes / 10000} suffix="万分钟" icon={Clock} color={BRAND.primary} trend={5.4} hint="学习总投入" />
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
              placeholder="搜索课程、视频、讲师、标签..."
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
            value={catFilter}
            onChange={(e) => setCatFilter(e.target.value as any)}
            className="px-3 py-2 rounded-lg text-xs focus:outline-none"
            style={{ backgroundColor: BRAND.bgCard, color: BRAND.text, border: `1px solid ${BRAND.border}` }}
          >
            <option value="all">全部分类</option>
            {Object.entries(CATEGORY_MAP).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>
          <select
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value as any)}
            className="px-3 py-2 rounded-lg text-xs focus:outline-none"
            style={{ backgroundColor: BRAND.bgCard, color: BRAND.text, border: `1px solid ${BRAND.border}` }}
          >
            <option value="all">全部难度</option>
            {Object.entries(LEVEL_MAP).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-2 rounded-lg text-xs focus:outline-none"
            style={{ backgroundColor: BRAND.bgCard, color: BRAND.text, border: `1px solid ${BRAND.border}` }}
          >
            <option value="enrolled">热度优先</option>
            <option value="rating">评分优先</option>
            <option value="newest">最新优先</option>
            <option value="duration">时长优先</option>
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
            { k: 'courses', l: '课程库', icon: BookOpen },
            { k: 'videos', l: '视频教程', icon: Video },
            { k: 'paths', l: '学习路径', icon: Compass },
            { k: 'graph', l: '知识图谱', icon: Network },
            { k: 'cases', l: '实战案例', icon: Briefcase },
            { k: 'cert', l: '认证中心', icon: Award },
            { k: 'progress', l: '我的进度', icon: Target },
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
              {/* 学习路径推荐 */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-lg font-bold flex items-center gap-2" style={{ color: BRAND.text }}>
                    <Compass size={18} style={{ color: BRAND.primary }} />
                    推荐学习路径
                  </h2>
                  <button onClick={() => setTab('paths')} className="text-xs flex items-center gap-1" style={{ color: BRAND.primary }}>
                    查看全部 <ChevronRight size={12} />
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {PATHS.slice(0, 3).map((p, i) => (
                    <div
                      key={p.id}
                      onClick={() => openDrawer('cert', p.certification)}
                      className="p-5 rounded-xl cursor-pointer transition-all duration-200 hover:scale-[1.02]"
                      style={{ backgroundColor: BRAND.bgCard, border: `1px solid ${BRAND.border}`, animation: `fadeInUp 0.4s ease-out ${i * 0.1}s both` }}
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl" style={{ backgroundColor: `${p.color}20` }}>
                          {p.badge}
                        </div>
                        <div className="flex-1">
                          <div className="font-bold text-sm" style={{ color: BRAND.text }}>{p.title}</div>
                          <div className="text-xs" style={{ color: BRAND.textMute }}>{p.totalCourses} 门课 · {formatDuration(p.totalDuration)}</div>
                        </div>
                      </div>
                      <p className="text-xs mb-3" style={{ color: BRAND.textSub }}>{p.description}</p>
                      <div className="flex items-center justify-between text-xs">
                        <span style={{ color: BRAND.textMute }}>{formatNumber(p.enrolled)} 人学习</span>
                        <span className="px-2 py-0.5 rounded" style={{ backgroundColor: LEVEL_MAP[p.difficulty].color + '20', color: LEVEL_MAP[p.difficulty].color }}>
                          {LEVEL_MAP[p.difficulty].label}
                        </span>
                      </div>
                      <div className="mt-3 w-full h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: BRAND.bg }}>
                        <div className="h-full transition-all duration-500" style={{ backgroundColor: p.color, width: `${(p.completed / p.enrolled) * 100}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 热门课程 */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-lg font-bold flex items-center gap-2" style={{ color: BRAND.text }}>
                    <Flame size={18} style={{ color: BRAND.warning }} />
                    热门课程 TOP 6
                  </h2>
                  <button onClick={() => setTab('courses')} className="text-xs flex items-center gap-1" style={{ color: BRAND.primary }}>
                    查看全部 <ChevronRight size={12} />
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {COURSES.sort((a, b) => b.enrolled - a.enrolled).slice(0, 6).map((c, i) => {
                    const cat = CATEGORY_MAP[c.category];
                    return (
                      <div
                        key={c.id}
                        onClick={() => openDrawer('course', c.id)}
                        className="p-4 rounded-xl cursor-pointer transition-all duration-200 hover:scale-[1.02]"
                        style={{ backgroundColor: BRAND.bgCard, border: `1px solid ${BRAND.border}`, animation: `fadeInUp 0.4s ease-out ${i * 0.08}s both` }}
                      >
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl" style={{ backgroundColor: `${cat.color}20` }}>
                            {c.cover}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-bold text-sm truncate" style={{ color: BRAND.text }}>{c.title}</div>
                            <div className="text-xs flex items-center gap-2 mt-1" style={{ color: BRAND.textMute }}>
                              <span className="px-1.5 py-0.5 rounded" style={{ backgroundColor: cat.color + '20', color: cat.color }}>{cat.label}</span>
                              <span>{LEVEL_MAP[c.level].label}</span>
                            </div>
                          </div>
                        </div>
                        <p className="text-xs mb-3 line-clamp-2" style={{ color: BRAND.textSub }}>{c.description}</p>
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-3" style={{ color: BRAND.textMute }}>
                            <span className="flex items-center gap-0.5"><Users size={11} /> {formatNumber(c.enrolled)}</span>
                            <span className="flex items-center gap-0.5"><Star size={11} style={{ color: BRAND.warning, fill: BRAND.warning }} /> {c.rating}</span>
                            <span className="flex items-center gap-0.5"><Clock size={11} /> {formatDuration(c.duration)}</span>
                          </div>
                          {c.isFree && (
                            <span className="px-1.5 py-0.5 rounded text-[10px]" style={{ backgroundColor: BRAND.success + '20', color: BRAND.success }}>免费</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 讲师团队 */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-lg font-bold flex items-center gap-2" style={{ color: BRAND.text }}>
                    <User size={18} style={{ color: BRAND.info }} />
                    顶级讲师
                  </h2>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                  {INSTRUCTORS.map((ins, i) => (
                    <div
                      key={ins.id}
                      onClick={() => openDrawer('instructor', ins.id)}
                      className="p-4 rounded-xl text-center cursor-pointer transition-all duration-200 hover:scale-105"
                      style={{ backgroundColor: BRAND.bgCard, border: `1px solid ${BRAND.border}`, animation: `fadeInUp 0.4s ease-out ${i * 0.06}s both` }}
                    >
                      <div className="text-4xl mb-2">{ins.avatar}</div>
                      <div className="font-bold text-sm" style={{ color: BRAND.text }}>{ins.name}</div>
                      <div className="text-xs mt-0.5" style={{ color: BRAND.textMute }}>{ins.title}</div>
                      <div className="flex items-center justify-center gap-1 mt-2 text-xs" style={{ color: BRAND.textSub }}>
                        <Star size={10} style={{ color: BRAND.warning, fill: BRAND.warning }} />
                        {ins.rating} · {ins.courses} 门课
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 学习统计 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-5 rounded-xl" style={{ backgroundColor: BRAND.bgCard, border: `1px solid ${BRAND.border}` }}>
                  <h3 className="text-sm font-bold mb-3 flex items-center gap-2" style={{ color: BRAND.text }}>
                    <BarChart3 size={14} style={{ color: BRAND.primary }} /> 分类覆盖
                  </h3>
                  <div className="space-y-2">
                    {Object.entries(CATEGORY_MAP).map(([k, v]) => {
                      const count = COURSES.filter((c) => c.category === k).length;
                      return (
                        <div key={k} className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: v.color }} />
                          <span className="text-xs flex-1" style={{ color: BRAND.textSub }}>{v.label}</span>
                          <span className="text-xs font-mono" style={{ color: BRAND.text }}>{count} 门</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="p-5 rounded-xl" style={{ backgroundColor: BRAND.bgCard, border: `1px solid ${BRAND.border}` }}>
                  <h3 className="text-sm font-bold mb-3 flex items-center gap-2" style={{ color: BRAND.text }}>
                    <PieIcon size={14} style={{ color: BRAND.warning }} /> 难度分布
                  </h3>
                  <div className="space-y-2">
                    {Object.entries(LEVEL_MAP).map(([k, v]) => {
                      const count = COURSES.filter((c) => c.level === k).length;
                      const pct = (count / COURSES.length) * 100;
                      return (
                        <div key={k}>
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span style={{ color: BRAND.textSub }}>{v.label}</span>
                            <span className="font-mono" style={{ color: BRAND.text }}>{count} 门 · {pct.toFixed(0)}%</span>
                          </div>
                          <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: BRAND.bg }}>
                            <div className="h-full transition-all" style={{ backgroundColor: v.color, width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ====== 课程库 ====== */}
          {tab === 'courses' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs" style={{ color: BRAND.textMute }}>
                  共 <span style={{ color: BRAND.primary }}>{filteredCourses.length}</span> 门课程
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => setTypeFilter('all')}
                    className="px-2 py-1 text-xs rounded"
                    style={{ backgroundColor: typeFilter === 'all' ? BRAND.primary : BRAND.bgCard, color: typeFilter === 'all' ? BRAND.onPrimary : BRAND.textSub }}
                  >
                    全部
                  </button>
                  {Object.entries(TYPE_MAP).map(([k, v]) => (
                    <button
                      key={k}
                      onClick={() => setTypeFilter(k as any)}
                      className="px-2 py-1 text-xs rounded"
                      style={{ backgroundColor: typeFilter === k ? BRAND.primary : BRAND.bgCard, color: typeFilter === k ? BRAND.onPrimary : BRAND.textSub }}
                    >
                      {v.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredCourses.map((c, i) => {
                  const cat = CATEGORY_MAP[c.category];
                  const CatIcon = cat.icon;
                  const isEnrolled = enrolled[c.id];
                  return (
                    <div
                      key={c.id}
                      className="p-4 rounded-xl transition-all duration-200 hover:scale-[1.01]"
                      style={{ backgroundColor: BRAND.bgCard, border: `1px solid ${BRAND.border}`, animation: `fadeInUp 0.4s ease-out ${i * 0.05}s both` }}
                    >
                      <div className="flex items-start gap-3 mb-3">
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0" style={{ backgroundColor: `${cat.color}20` }}>
                          {c.cover}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1 mb-1">
                            {c.isNew && <span className="px-1.5 py-0.5 text-[10px] rounded" style={{ backgroundColor: BRAND.success + '20', color: BRAND.success }}>新上</span>}
                            {c.isHot && <span className="px-1.5 py-0.5 text-[10px] rounded flex items-center gap-0.5" style={{ backgroundColor: BRAND.danger + '20', color: BRAND.danger }}><Flame size={9} />HOT</span>}
                            {c.isFree && <span className="px-1.5 py-0.5 text-[10px] rounded" style={{ backgroundColor: BRAND.primary + '20', color: BRAND.primary }}>免费</span>}
                          </div>
                          <div className="font-bold text-sm line-clamp-2" style={{ color: BRAND.text }}>{c.title}</div>
                        </div>
                      </div>
                      <p className="text-xs mb-3 line-clamp-2" style={{ color: BRAND.textSub }}>{c.description}</p>
                      <div className="flex flex-wrap gap-1 mb-3">
                        {c.tags.slice(0, 3).map((t) => (
                          <span key={t} className="px-1.5 py-0.5 text-[10px] rounded" style={{ backgroundColor: BRAND.bg, color: BRAND.textMute }}>#{t}</span>
                        ))}
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-xs mb-3 pb-3" style={{ borderBottom: `1px solid ${BRAND.border}` }}>
                        <div className="flex flex-col items-center">
                          <Users size={12} style={{ color: BRAND.textMute }} />
                          <span className="mt-0.5 font-mono" style={{ color: BRAND.text }}>{formatNumber(c.enrolled)}</span>
                        </div>
                        <div className="flex flex-col items-center">
                          <Star size={12} style={{ color: BRAND.warning, fill: BRAND.warning }} />
                          <span className="mt-0.5 font-mono" style={{ color: BRAND.text }}>{c.rating}</span>
                        </div>
                        <div className="flex flex-col items-center">
                          <Clock size={12} style={{ color: BRAND.textMute }} />
                          <span className="mt-0.5" style={{ color: BRAND.text }}>{formatDuration(c.duration)}</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="text-xs" style={{ color: BRAND.textMute }}>
                          <CatIcon size={11} className="inline mr-1" style={{ color: cat.color }} />
                          {cat.label} · {c.instructor}
                        </div>
                        <div className="flex gap-1">
                          <button
                            onClick={() => openDrawer('course', c.id)}
                            className="px-2.5 py-1 text-xs rounded"
                            style={{ backgroundColor: BRAND.bg, color: BRAND.text, border: `1px solid ${BRAND.border}` }}
                          >
                            详情
                          </button>
                          <button
                            onClick={() => toggleEnroll(c.id)}
                            className="px-2.5 py-1 text-xs rounded"
                            style={{
                              backgroundColor: isEnrolled ? BRAND.success : BRAND.primary,
                              color: BRAND.onPrimary,
                            }}
                          >
                            {isEnrolled ? <><CheckCircle2 size={10} className="inline mr-0.5" />已加入</> : '加入学习'}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ====== 视频教程 ====== */}
          {tab === 'videos' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredVideos.map((v, i) => (
                  <div
                    key={v.id}
                    onClick={() => openDrawer('video', v.id)}
                    className="rounded-xl overflow-hidden cursor-pointer transition-all duration-200 hover:scale-[1.02]"
                    style={{ backgroundColor: BRAND.bgCard, border: `1px solid ${BRAND.border}`, animation: `fadeInUp 0.4s ease-out ${i * 0.05}s both` }}
                  >
                    <div
                      className="relative h-32 flex items-center justify-center"
                      style={{ background: `linear-gradient(135deg, ${v.thumbnail}30 0%, ${v.thumbnail}80 100%)` }}
                    >
                      <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                        <Play size={24} style={{ color: BRAND.text, fill: BRAND.text }} />
                      </div>
                      <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded text-[10px] font-mono" style={{ backgroundColor: 'rgba(0,0,0,0.7)', color: BRAND.text }}>
                        {formatTime(v.duration)}
                      </div>
                      <div className="absolute top-2 left-2 px-2 py-0.5 rounded text-[10px]" style={{ backgroundColor: 'rgba(0,0,0,0.7)', color: BRAND.text }}>
                        {v.series} · EP{v.episode}
                      </div>
                    </div>
                    <div className="p-3">
                      <div className="font-bold text-sm line-clamp-2 mb-2" style={{ color: BRAND.text }}>{v.title}</div>
                      <div className="flex items-center justify-between text-xs" style={{ color: BRAND.textMute }}>
                        <span>{v.instructor}</span>
                        <div className="flex items-center gap-2">
                          <span className="flex items-center gap-0.5"><Eye size={10} />{formatNumber(v.views)}</span>
                          <span className="flex items-center gap-0.5"><ThumbsUp size={10} />{formatNumber(v.likes)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ====== 学习路径 ====== */}
          {tab === 'paths' && (
            <div className="space-y-4">
              {PATHS.map((p, i) => (
                <div
                  key={p.id}
                  className="p-5 rounded-xl"
                  style={{ backgroundColor: BRAND.bgCard, border: `1px solid ${BRAND.border}`, animation: `fadeInUp 0.4s ease-out ${i * 0.08}s both` }}
                >
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0" style={{ backgroundColor: `${p.color}20` }}>
                      {p.badge}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-bold text-base" style={{ color: BRAND.text }}>{p.title}</h3>
                          <p className="text-xs mt-1" style={{ color: BRAND.textSub }}>{p.description}</p>
                        </div>
                        <span className="px-2 py-0.5 text-xs rounded" style={{ backgroundColor: LEVEL_MAP[p.difficulty].color + '20', color: LEVEL_MAP[p.difficulty].color }}>
                          {LEVEL_MAP[p.difficulty].label}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-xs mb-3" style={{ color: BRAND.textMute }}>
                        <span className="flex items-center gap-1"><BookOpen size={11} />{p.totalCourses} 门课</span>
                        <span className="flex items-center gap-1"><Clock size={11} />{formatDuration(p.totalDuration)}</span>
                        <span className="flex items-center gap-1"><Users size={11} />{formatNumber(p.enrolled)} 人</span>
                        <span className="flex items-center gap-1"><Trophy size={11} />完成 {formatNumber(p.completed)} 人</span>
                      </div>
                      <div className="text-xs mb-2" style={{ color: BRAND.textSub }}>
                        <Target size={11} className="inline mr-1" style={{ color: p.color }} />学习目标：{p.goal}
                      </div>
                      <div className="text-xs mb-3" style={{ color: BRAND.textSub }}>
                        <Users size={11} className="inline mr-1" style={{ color: p.color }} />目标人群：{p.targetAudience.join('、')}
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex -space-x-1">
                          {p.courses.slice(0, 5).map((cid) => {
                            const c = COURSES.find((x) => x.id === cid);
                            if (!c) return null;
                            const cat = CATEGORY_MAP[c.category];
                            return (
                              <div key={cid} className="w-7 h-7 rounded-full flex items-center justify-center text-sm border-2" style={{ backgroundColor: `${cat.color}30`, borderColor: BRAND.bgCard }}>
                                {c.cover}
                              </div>
                            );
                          })}
                          {p.courses.length > 5 && (
                            <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] border-2" style={{ backgroundColor: BRAND.bg, borderColor: BRAND.bgCard, color: BRAND.textMute }}>
                              +{p.courses.length - 5}
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => openDrawer('cert', p.certification)}
                          className="px-3 py-1.5 text-xs rounded flex items-center gap-1"
                          style={{ backgroundColor: p.color, color: BRAND.onPrimary }}
                        >
                          <Award size={12} />查看认证
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ====== 知识图谱 ====== */}
          {tab === 'graph' && (
            <div className="space-y-4">
              <div className="p-5 rounded-xl" style={{ backgroundColor: BRAND.bgCard, border: `1px solid ${BRAND.border}` }}>
                <h2 className="text-base font-bold mb-2 flex items-center gap-2" style={{ color: BRAND.text }}>
                  <Network size={16} style={{ color: BRAND.primary }} />
                  数字资产知识图谱
                </h2>
                <p className="text-xs mb-4" style={{ color: BRAND.textSub }}>
                  可视化展示数字资产领域的核心知识节点与关联关系。点击节点可查看相关课程。
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {Object.entries(CATEGORY_MAP).map(([k, v], i) => {
                    const Icon = v.icon;
                    const count = COURSES.filter((c) => c.category === k).length;
                    return (
                      <div
                        key={k}
                        onClick={() => {
                          setCatFilter(k as Category);
                          setTab('courses');
                        }}
                        className="p-4 rounded-xl cursor-pointer transition-all duration-200 hover:scale-105"
                        style={{ backgroundColor: `${v.color}10`, border: `1px solid ${v.color}40`, animation: `fadeInUp 0.4s ease-out ${i * 0.08}s both` }}
                      >
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-2" style={{ backgroundColor: `${v.color}30`, color: v.color }}>
                          <Icon size={20} />
                        </div>
                        <div className="font-bold text-sm" style={{ color: BRAND.text }}>{v.label}</div>
                        <div className="text-xs mt-1" style={{ color: BRAND.textMute }}>{count} 门相关课程</div>
                        <div className="mt-2 flex flex-wrap gap-1">
                          {COURSES.filter((c) => c.category === k).slice(0, 2).map((c) => (
                            <span key={c.id} className="px-1.5 py-0.5 text-[10px] rounded" style={{ backgroundColor: BRAND.bg, color: BRAND.textMute }}>
                              {c.title.slice(0, 6)}...
                            </span>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 核心概念卡 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {[
                  { name: '区块链', desc: '分布式账本、共识机制、不可篡改', color: BRAND.primary, icon: Boxes },
                  { name: '钱包与私钥', desc: '私钥管理、助记词备份、多签方案', color: BRAND.warning, icon: KeyRound },
                  { name: '智能合约', desc: 'Solidity、EVM、合约安全', color: BRAND.info, icon: Code2 },
                  { name: 'DeFi 协议', desc: 'AMM、借贷、收益聚合', color: '#7c3aed', icon: Layers },
                  { name: '交易分析', desc: 'K 线、指标、形态、趋势', color: BRAND.danger, icon: BarChart3 },
                  { name: '合规框架', desc: 'KYC/AML、合规研究方向', color: BRAND.gold, icon: Briefcase },
                ].map((c, i) => {
                  const Icon = c.icon;
                  return (
                    <div
                      key={c.name}
                      className="p-4 rounded-xl transition-all duration-200 hover:scale-105"
                      style={{ backgroundColor: BRAND.bgCard, border: `1px solid ${BRAND.border}`, animation: `fadeInUp 0.4s ease-out ${i * 0.05}s both` }}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${c.color}20`, color: c.color }}>
                          <Icon size={16} />
                        </div>
                        <div className="font-bold text-sm" style={{ color: BRAND.text }}>{c.name}</div>
                      </div>
                      <p className="text-xs" style={{ color: BRAND.textSub }}>{c.desc}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ====== 实战案例 ====== */}
          {tab === 'cases' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {CASES.map((cs, i) => {
                const catColor = cs.category === 'success' ? BRAND.success : cs.category === 'warning' ? BRAND.warning : cs.category === 'incident' ? BRAND.danger : BRAND.info;
                return (
                  <div
                    key={cs.id}
                    onClick={() => openDrawer('case', cs.id)}
                    className="p-5 rounded-xl cursor-pointer transition-all duration-200 hover:scale-[1.02]"
                    style={{ backgroundColor: BRAND.bgCard, border: `1px solid ${BRAND.border}`, animation: `fadeInUp 0.4s ease-out ${i * 0.06}s both` }}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="font-bold text-sm flex-1" style={{ color: BRAND.text }}>{cs.title}</div>
                      <span className="px-2 py-0.5 text-[10px] rounded ml-2" style={{ backgroundColor: catColor + '20', color: catColor }}>
                        {cs.category === 'success' ? '成功案例' : cs.category === 'warning' ? '风险警示' : cs.category === 'incident' ? '事件复盘' : '经验借鉴'}
                      </span>
                    </div>
                    <div className="text-xs mb-2" style={{ color: BRAND.primary }}>{cs.scenario}</div>
                    <p className="text-xs mb-3 line-clamp-3" style={{ color: BRAND.textSub }}>{cs.description}</p>
                    <div className="flex items-center justify-between text-xs" style={{ color: BRAND.textMute }}>
                      <span>{cs.year} · {cs.region}</span>
                      <span>查看详情 <ChevronRight size={11} className="inline" /></span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ====== 认证中心 ====== */}
          {tab === 'cert' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {CERTS.map((cert, i) => {
                const lvl = LEVEL_MAP[cert.level];
                return (
                  <div
                    key={cert.id}
                    onClick={() => openDrawer('cert', cert.id)}
                    className="p-5 rounded-xl cursor-pointer transition-all duration-200 hover:scale-[1.02]"
                    style={{ backgroundColor: BRAND.bgCard, border: `1px solid ${BRAND.border}`, animation: `fadeInUp 0.4s ease-out ${i * 0.08}s both` }}
                  >
                    <div className="flex items-start gap-4 mb-3">
                      <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0" style={{ backgroundColor: `${cert.color}20` }}>
                        {cert.icon}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-base" style={{ color: BRAND.text }}>{cert.name}</h3>
                          <span className="px-2 py-0.5 text-[10px] rounded" style={{ backgroundColor: lvl.color + '20', color: lvl.color }}>{lvl.label}</span>
                        </div>
                        <p className="text-xs" style={{ color: BRAND.textSub }}>{cert.description}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-4 gap-2 text-center">
                      <div>
                        <div className="text-lg font-bold font-mono" style={{ color: cert.color }}>{formatNumber(cert.holders)}</div>
                        <div className="text-[10px]" style={{ color: BRAND.textMute }}>持证人</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold font-mono" style={{ color: BRAND.text }}>{cert.passRate}%</div>
                        <div className="text-[10px]" style={{ color: BRAND.textMute }}>通过率</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold font-mono" style={{ color: BRAND.text }}>{cert.questions}</div>
                        <div className="text-[10px]" style={{ color: BRAND.textMute }}>题数</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold font-mono" style={{ color: BRAND.text }}>{cert.validity}月</div>
                        <div className="text-[10px]" style={{ color: BRAND.textMute }}>有效期</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ====== 我的进度 ====== */}
          {tab === 'progress' && (
            <div className="space-y-4">
              {/* 总览 */}
              <div className="p-5 rounded-xl" style={{ background: `linear-gradient(135deg, ${BRAND.primary}20 0%, ${BRAND.bgCard} 100%)`, border: `1px solid ${BRAND.border}` }}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-14 h-14 rounded-full flex items-center justify-center text-2xl font-bold" style={{ backgroundColor: BRAND.primary, color: BRAND.onPrimary }}>
                    {PROGRESS.level}
                  </div>
                  <div>
                    <div className="font-bold text-lg" style={{ color: BRAND.text }}>学习等级 {PROGRESS.level}</div>
                    <div className="text-xs" style={{ color: BRAND.textSub }}>距下一等级还需 {formatNumber(PROGRESS.nextLevelPoints - PROGRESS.points)} 经验</div>
                  </div>
                </div>
                <div className="w-full h-2 rounded-full overflow-hidden" style={{ backgroundColor: BRAND.bg }}>
                  <div className="h-full transition-all duration-500" style={{ backgroundColor: BRAND.primary, width: `${(PROGRESS.points / PROGRESS.nextLevelPoints) * 100}%` }} />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
                  <div className="text-center p-3 rounded-lg" style={{ backgroundColor: BRAND.bgCard, border: `1px solid ${BRAND.border}` }}>
                    <Clock size={16} className="mx-auto mb-1" style={{ color: BRAND.primary }} />
                    <div className="text-lg font-bold font-mono" style={{ color: BRAND.text }}>{formatNumber(PROGRESS.totalMinutes)}</div>
                    <div className="text-[10px]" style={{ color: BRAND.textMute }}>总学时（分钟）</div>
                  </div>
                  <div className="text-center p-3 rounded-lg" style={{ backgroundColor: BRAND.bgCard, border: `1px solid ${BRAND.border}` }}>
                    <CheckCircle2 size={16} className="mx-auto mb-1" style={{ color: BRAND.success }} />
                    <div className="text-lg font-bold font-mono" style={{ color: BRAND.text }}>{PROGRESS.coursesCompleted}</div>
                    <div className="text-[10px]" style={{ color: BRAND.textMute }}>已完成课程</div>
                  </div>
                  <div className="text-center p-3 rounded-lg" style={{ backgroundColor: BRAND.bgCard, border: `1px solid ${BRAND.border}` }}>
                    <Flame size={16} className="mx-auto mb-1" style={{ color: BRAND.danger }} />
                    <div className="text-lg font-bold font-mono" style={{ color: BRAND.text }}>{PROGRESS.currentStreak} 天</div>
                    <div className="text-[10px]" style={{ color: BRAND.textMute }}>连续学习</div>
                  </div>
                  <div className="text-center p-3 rounded-lg" style={{ backgroundColor: BRAND.bgCard, border: `1px solid ${BRAND.border}` }}>
                    <Trophy size={16} className="mx-auto mb-1" style={{ color: BRAND.warning }} />
                    <div className="text-lg font-bold font-mono" style={{ color: BRAND.text }}>前 {PROGRESS.percentile}%</div>
                    <div className="text-[10px]" style={{ color: BRAND.textMute }}>超过 {100 - PROGRESS.percentile}% 学员</div>
                  </div>
                </div>
              </div>

              {/* 本周学时 */}
              <div className="p-5 rounded-xl" style={{ backgroundColor: BRAND.bgCard, border: `1px solid ${BRAND.border}` }}>
                <h3 className="text-sm font-bold mb-3 flex items-center gap-2" style={{ color: BRAND.text }}>
                  <BarChart3 size={14} style={{ color: BRAND.primary }} /> 本周学习时长（分钟）
                </h3>
                <div className="flex items-end gap-2 h-32">
                  {PROGRESS.weeklyMinutes.map((m, i) => {
                    const days = ['一', '二', '三', '四', '五', '六', '日'];
                    const max = Math.max(...PROGRESS.weeklyMinutes);
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1">
                        <div className="text-[10px] font-mono" style={{ color: BRAND.textMute }}>{m}</div>
                        <div
                          className="w-full rounded-t transition-all duration-500"
                          style={{ backgroundColor: BRAND.primary, height: `${(m / max) * 100}%`, minHeight: '4px' }}
                        />
                        <div className="text-[10px]" style={{ color: BRAND.textMute }}>{days[i]}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 正在学习的课程 */}
              <div className="p-5 rounded-xl" style={{ backgroundColor: BRAND.bgCard, border: `1px solid ${BRAND.border}` }}>
                <h3 className="text-sm font-bold mb-3 flex items-center gap-2" style={{ color: BRAND.text }}>
                  <Bookmark size={14} style={{ color: BRAND.warning }} /> 正在学习
                </h3>
                <div className="space-y-2">
                  {Object.entries(enrolled).filter(([_, v]) => v).map(([cid]) => {
                    const c = COURSES.find((x) => x.id === cid);
                    if (!c) return null;
                    const cat = CATEGORY_MAP[c.category];
                    const progress = Math.floor(Math.random() * 60) + 20;
                    return (
                      <div key={cid} className="p-3 rounded-lg" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}>
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-10 h-10 rounded-lg flex items-center justify-center text-xl" style={{ backgroundColor: `${cat.color}20` }}>
                            {c.cover}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-bold text-sm truncate" style={{ color: BRAND.text }}>{c.title}</div>
                            <div className="text-xs" style={{ color: BRAND.textMute }}>{cat.label} · {c.instructor}</div>
                          </div>
                          <button
                            onClick={() => openDrawer('course', c.id)}
                            className="px-3 py-1 text-xs rounded"
                            style={{ backgroundColor: BRAND.primary, color: BRAND.onPrimary }}
                          >
                            继续学习
                          </button>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: BRAND.bgCard }}>
                            <div className="h-full" style={{ backgroundColor: cat.color, width: `${progress}%` }} />
                          </div>
                          <span className="text-xs font-mono" style={{ color: BRAND.textSub }}>{progress}%</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ========== 风险提示 ========== */}
      <section className="px-4 lg:px-8 py-6">
        <div className="max-w-7xl mx-auto p-4 rounded-xl" style={{ backgroundColor: 'rgba(246, 70, 93, 0.08)', border: `1px solid ${BRAND.danger}40` }}>
          <div className="flex items-start gap-3">
            <AlertTriangle size={20} style={{ color: BRAND.danger }} className="flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-sm mb-1" style={{ color: BRAND.danger }}>学习者风险提示</div>
              <p className="text-xs leading-relaxed" style={{ color: BRAND.textSub }}>
                数字资产学习仅供研究参考，所有内容不构成任何投资建议。数字资产价格波动剧烈，过往表现不预示未来收益。
                投资有风险，入市需谨慎。请根据自身风险承受能力独立决策，必要时咨询专业顾问。
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ========== 底部 CTA ========== */}
      <section className="px-4 lg:px-8 py-10">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-2xl font-bold mb-2" style={{ color: BRAND.text }}>开启你的数字资产学习之旅</h2>
          <p className="text-sm mb-5" style={{ color: BRAND.textSub }}>选择适合你的学习路径，从入门到专家系统化成长</p>
          <div className="flex flex-wrap justify-center gap-3">
            <button
              onClick={() => setTab('paths')}
              className="px-6 py-2.5 rounded-lg text-sm font-medium"
              style={{ backgroundColor: BRAND.primary, color: BRAND.onPrimary }}
            >
              <Compass size={14} className="inline mr-1" /> 浏览学习路径
            </button>
            <button
              onClick={() => setTab('cert')}
              className="px-6 py-2.5 rounded-lg text-sm font-medium"
              style={{ backgroundColor: BRAND.bgCard, color: BRAND.text, border: `1px solid ${BRAND.border}` }}
            >
              <Award size={14} className="inline mr-1" /> 查看认证
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
                {drawer.type === 'course' && '课程详情'}
                {drawer.type === 'video' && '视频详情'}
                {drawer.type === 'instructor' && '讲师详情'}
                {drawer.type === 'cert' && '认证详情'}
                {drawer.type === 'case' && '案例详情'}
              </div>
              <button onClick={closeDrawer} className="p-1.5 rounded-lg hover:bg-white/5">
                <X size={16} style={{ color: BRAND.textSub }} />
              </button>
            </div>

            <div className="p-6">
              {/* 课程详情 */}
              {drawerCourse && (() => {
                const cat = CATEGORY_MAP[drawerCourse.category];
                const isEnrolled = enrolled[drawerCourse.id];
                return (
                  <div>
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-4xl" style={{ backgroundColor: `${cat.color}20` }}>
                        {drawerCourse.cover}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="px-2 py-0.5 text-[10px] rounded" style={{ backgroundColor: cat.color + '20', color: cat.color }}>{cat.label}</span>
                          <span className="px-2 py-0.5 text-[10px] rounded" style={{ backgroundColor: LEVEL_MAP[drawerCourse.level].color + '20', color: LEVEL_MAP[drawerCourse.level].color }}>{LEVEL_MAP[drawerCourse.level].label}</span>
                          {drawerCourse.isFree && <span className="px-2 py-0.5 text-[10px] rounded" style={{ backgroundColor: BRAND.success + '20', color: BRAND.success }}>免费</span>}
                        </div>
                        <h2 className="text-xl font-bold mb-2" style={{ color: BRAND.text }}>{drawerCourse.title}</h2>
                        <div className="flex items-center gap-3 text-xs" style={{ color: BRAND.textMute }}>
                          <span>讲师：{drawerCourse.instructor}</span>
                          <span>·</span>
                          <span>{drawerCourse.lessons} 节</span>
                          <span>·</span>
                          <span>{formatDuration(drawerCourse.duration)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-4 gap-2 mb-4 text-center">
                      <div className="p-2 rounded-lg" style={{ backgroundColor: BRAND.bg }}>
                        <div className="text-lg font-bold font-mono" style={{ color: BRAND.text }}>{formatNumber(drawerCourse.enrolled)}</div>
                        <div className="text-[10px]" style={{ color: BRAND.textMute }}>学员</div>
                      </div>
                      <div className="p-2 rounded-lg" style={{ backgroundColor: BRAND.bg }}>
                        <div className="text-lg font-bold font-mono" style={{ color: BRAND.text }}>{drawerCourse.rating}</div>
                        <div className="text-[10px]" style={{ color: BRAND.textMute }}>评分</div>
                      </div>
                      <div className="p-2 rounded-lg" style={{ backgroundColor: BRAND.bg }}>
                        <div className="text-lg font-bold font-mono" style={{ color: BRAND.text }}>{drawerCourse.ratingCount}</div>
                        <div className="text-[10px]" style={{ color: BRAND.textMute }}>评价</div>
                      </div>
                      <div className="p-2 rounded-lg" style={{ backgroundColor: BRAND.bg }}>
                        <div className="text-lg font-bold font-mono" style={{ color: BRAND.text }}>{drawerCourse.lessons}</div>
                        <div className="text-[10px]" style={{ color: BRAND.textMute }}>章节</div>
                      </div>
                    </div>
                    <p className="text-sm mb-4" style={{ color: BRAND.textSub }}>{drawerCourse.description}</p>
                    <div className="mb-4">
                      <h4 className="text-sm font-bold mb-2" style={{ color: BRAND.text }}>课程亮点</h4>
                      <ul className="space-y-1">
                        {drawerCourse.highlights.map((h, i) => (
                          <li key={i} className="text-xs flex items-start gap-2" style={{ color: BRAND.textSub }}>
                            <CheckCircle2 size={12} style={{ color: BRAND.success }} className="flex-shrink-0 mt-0.5" />
                            {h}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="mb-4">
                      <h4 className="text-sm font-bold mb-2" style={{ color: BRAND.text }}>课程大纲</h4>
                      <div className="space-y-1.5">
                        {drawerCourse.syllabus.map((s) => (
                          <div key={s.id} className="flex items-center gap-2 p-2 rounded-lg" style={{ backgroundColor: BRAND.bg }}>
                            <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-mono" style={{ backgroundColor: cat.color + '20', color: cat.color }}>
                              {s.id}
                            </div>
                            <div className="flex-1 text-xs" style={{ color: BRAND.text }}>{s.title}</div>
                            <div className="text-xs font-mono" style={{ color: BRAND.textMute }}>{s.duration} 分钟</div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <button
                      onClick={() => toggleEnroll(drawerCourse.id)}
                      className="w-full py-3 rounded-lg text-sm font-medium"
                      style={{ backgroundColor: isEnrolled ? BRAND.success : BRAND.primary, color: BRAND.onPrimary }}
                    >
                      {isEnrolled ? <><CheckCircle2 size={14} className="inline mr-1" />已加入学习</> : '加入学习'}
                    </button>
                  </div>
                );
              })()}

              {/* 视频详情 */}
              {drawerVideo && (
                <div>
                  <div
                    className="w-full h-48 rounded-xl mb-4 flex items-center justify-center"
                    style={{ background: `linear-gradient(135deg, ${drawerVideo.thumbnail}30 0%, ${drawerVideo.thumbnail}80 100%)` }}
                  >
                    <div className="w-20 h-20 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                      <Play size={32} style={{ color: BRAND.text, fill: BRAND.text }} />
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-0.5 text-xs rounded" style={{ backgroundColor: BRAND.info + '20', color: BRAND.info }}>{drawerVideo.series} EP{drawerVideo.episode}/{drawerVideo.totalEpisodes}</span>
                    <span className="px-2 py-0.5 text-xs rounded" style={{ backgroundColor: LEVEL_MAP[drawerVideo.level].color + '20', color: LEVEL_MAP[drawerVideo.level].color }}>{LEVEL_MAP[drawerVideo.level].label}</span>
                  </div>
                  <h2 className="text-xl font-bold mb-2" style={{ color: BRAND.text }}>{drawerVideo.title}</h2>
                  <div className="flex items-center gap-3 text-xs mb-4" style={{ color: BRAND.textMute }}>
                    <span>{drawerVideo.instructor}</span>
                    <span>·</span>
                    <span>{formatTime(drawerVideo.duration)}</span>
                    <span>·</span>
                    <span>{formatNumber(drawerVideo.views)} 次观看</span>
                  </div>
                  <p className="text-sm mb-4" style={{ color: BRAND.textSub }}>{drawerVideo.description}</p>
                  <div className="mb-4">
                    <h4 className="text-sm font-bold mb-2" style={{ color: BRAND.text }}>章节</h4>
                    <div className="space-y-1.5">
                      {drawerVideo.chapters.map((c) => (
                        <div key={c.id} className="flex items-center gap-2 p-2 rounded-lg cursor-pointer hover:bg-white/5" style={{ backgroundColor: BRAND.bg }}>
                          <Play size={12} style={{ color: BRAND.primary }} />
                          <div className="flex-1 text-xs" style={{ color: BRAND.text }}>{c.title}</div>
                          <div className="text-xs font-mono" style={{ color: BRAND.textMute }}>{formatTime(c.start)}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <button className="w-full py-3 rounded-lg text-sm font-medium" style={{ backgroundColor: BRAND.primary, color: BRAND.onPrimary }}>
                    <Play size={14} className="inline mr-1" />开始观看
                  </button>
                </div>
              )}

              {/* 讲师详情 */}
              {drawerInstructor && (
                <div>
                  <div className="text-center mb-6">
                    <div className="text-7xl mb-3">{drawerInstructor.avatar}</div>
                    <h2 className="text-2xl font-bold mb-1" style={{ color: BRAND.text }}>{drawerInstructor.name}</h2>
                    <div className="text-sm mb-3" style={{ color: BRAND.primary }}>{drawerInstructor.title}</div>
                    <p className="text-sm" style={{ color: BRAND.textSub }}>{drawerInstructor.bio}</p>
                  </div>
                  <div className="grid grid-cols-4 gap-2 mb-4 text-center">
                    <div className="p-2 rounded-lg" style={{ backgroundColor: BRAND.bg }}>
                      <div className="text-lg font-bold font-mono" style={{ color: BRAND.text }}>{drawerInstructor.courses}</div>
                      <div className="text-[10px]" style={{ color: BRAND.textMute }}>课程</div>
                    </div>
                    <div className="p-2 rounded-lg" style={{ backgroundColor: BRAND.bg }}>
                      <div className="text-lg font-bold font-mono" style={{ color: BRAND.text }}>{formatNumber(drawerInstructor.students)}</div>
                      <div className="text-[10px]" style={{ color: BRAND.textMute }}>学员</div>
                    </div>
                    <div className="p-2 rounded-lg" style={{ backgroundColor: BRAND.bg }}>
                      <div className="text-lg font-bold font-mono" style={{ color: BRAND.text }}>{drawerInstructor.rating}</div>
                      <div className="text-[10px]" style={{ color: BRAND.textMute }}>评分</div>
                    </div>
                    <div className="p-2 rounded-lg" style={{ backgroundColor: BRAND.bg }}>
                      <div className="text-lg font-bold font-mono" style={{ color: BRAND.text }}>{drawerInstructor.yearsOfExperience}年</div>
                      <div className="text-[10px]" style={{ color: BRAND.textMute }}>经验</div>
                    </div>
                  </div>
                  <div className="mb-4">
                    <h4 className="text-sm font-bold mb-2" style={{ color: BRAND.text }}>专长领域</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {drawerInstructor.expertise.map((e) => (
                        <span key={e} className="px-2 py-0.5 text-xs rounded" style={{ backgroundColor: BRAND.primary + '20', color: BRAND.primary }}>{e}</span>
                      ))}
                    </div>
                  </div>
                  <div className="mb-4">
                    <h4 className="text-sm font-bold mb-2" style={{ color: BRAND.text }}>背景</h4>
                    <ul className="space-y-1">
                      {drawerInstructor.background.map((b, i) => (
                        <li key={i} className="text-xs flex items-start gap-2" style={{ color: BRAND.textSub }}>
                          <Star size={12} style={{ color: BRAND.warning }} className="flex-shrink-0 mt-0.5" />
                          {b}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="p-3 rounded-lg text-center" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}>
                    <div className="text-xs italic" style={{ color: BRAND.textSub }}>"{drawerInstructor.signature}"</div>
                  </div>
                </div>
              )}

              {/* 认证详情 */}
              {drawerCert && (
                <div>
                  <div className="text-center mb-4">
                    <div className="text-6xl mb-3">{drawerCert.icon}</div>
                    <h2 className="text-xl font-bold mb-1" style={{ color: BRAND.text }}>{drawerCert.name}</h2>
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <span className="px-2 py-0.5 text-xs rounded" style={{ backgroundColor: LEVEL_MAP[drawerCert.level].color + '20', color: LEVEL_MAP[drawerCert.level].color }}>{LEVEL_MAP[drawerCert.level].label}</span>
                    </div>
                    <p className="text-sm" style={{ color: BRAND.textSub }}>{drawerCert.description}</p>
                  </div>
                  <div className="grid grid-cols-4 gap-2 mb-4 text-center">
                    <div className="p-2 rounded-lg" style={{ backgroundColor: BRAND.bg }}>
                      <div className="text-lg font-bold font-mono" style={{ color: drawerCert.color }}>{formatNumber(drawerCert.holders)}</div>
                      <div className="text-[10px]" style={{ color: BRAND.textMute }}>持证人</div>
                    </div>
                    <div className="p-2 rounded-lg" style={{ backgroundColor: BRAND.bg }}>
                      <div className="text-lg font-bold font-mono" style={{ color: BRAND.text }}>{drawerCert.passRate}%</div>
                      <div className="text-[10px]" style={{ color: BRAND.textMute }}>通过率</div>
                    </div>
                    <div className="p-2 rounded-lg" style={{ backgroundColor: BRAND.bg }}>
                      <div className="text-lg font-bold font-mono" style={{ color: BRAND.text }}>{drawerCert.questions}</div>
                      <div className="text-[10px]" style={{ color: BRAND.textMute }}>题数</div>
                    </div>
                    <div className="p-2 rounded-lg" style={{ backgroundColor: BRAND.bg }}>
                      <div className="text-lg font-bold font-mono" style={{ color: BRAND.text }}>{drawerCert.examDuration}</div>
                      <div className="text-[10px]" style={{ color: BRAND.textMute }}>考试(分)</div>
                    </div>
                  </div>
                  <div className="mb-4">
                    <h4 className="text-sm font-bold mb-2" style={{ color: BRAND.text }}>认证要求</h4>
                    <ul className="space-y-1.5">
                      {drawerCert.requirements.map((r, i) => (
                        <li key={i} className="text-xs flex items-start gap-2 p-2 rounded-lg" style={{ backgroundColor: BRAND.bg }}>
                          <CheckCircle2 size={12} style={{ color: drawerCert.color }} className="flex-shrink-0 mt-0.5" />
                          <span style={{ color: BRAND.textSub }}>{r}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <button className="w-full py-3 rounded-lg text-sm font-medium" style={{ backgroundColor: drawerCert.color, color: BRAND.onPrimary }}>
                    <Award size={14} className="inline mr-1" />开始备考
                  </button>
                </div>
              )}

              {/* 案例详情 */}
              {drawerCase && (() => {
                const catColor = drawerCase.category === 'success' ? BRAND.success : drawerCase.category === 'warning' ? BRAND.warning : drawerCase.category === 'incident' ? BRAND.danger : BRAND.info;
                return (
                  <div>
                    <span className="inline-block px-2 py-0.5 text-xs rounded mb-3" style={{ backgroundColor: catColor + '20', color: catColor }}>
                      {drawerCase.category === 'success' ? '成功案例' : drawerCase.category === 'warning' ? '风险警示' : drawerCase.category === 'incident' ? '事件复盘' : '经验借鉴'}
                    </span>
                    <h2 className="text-xl font-bold mb-2" style={{ color: BRAND.text }}>{drawerCase.title}</h2>
                    <div className="text-sm mb-3" style={{ color: BRAND.primary }}>{drawerCase.scenario}</div>
                    <p className="text-sm mb-4" style={{ color: BRAND.textSub }}>{drawerCase.description}</p>
                    <div className="mb-4">
                      <h4 className="text-sm font-bold mb-2" style={{ color: BRAND.text }}>关键教训</h4>
                      <ul className="space-y-1.5">
                        {drawerCase.lessons.map((l, i) => (
                          <li key={i} className="text-xs flex items-start gap-2 p-2 rounded-lg" style={{ backgroundColor: BRAND.bg }}>
                            <LightbulbIcon />
                            <span style={{ color: BRAND.textSub }}>{l}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mb-4">
                      <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.bg }}>
                        <div className="text-[10px]" style={{ color: BRAND.textMute }}>发生年份</div>
                        <div className="text-sm font-bold" style={{ color: BRAND.text }}>{drawerCase.year}</div>
                      </div>
                      <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.bg }}>
                        <div className="text-[10px]" style={{ color: BRAND.textMute }}>影响地区</div>
                        <div className="text-sm font-bold" style={{ color: BRAND.text }}>{drawerCase.region}</div>
                      </div>
                    </div>
                    <div className="p-3 rounded-lg mb-4" style={{ backgroundColor: BRAND.bg }}>
                      <div className="text-[10px] mb-1" style={{ color: BRAND.textMute }}>行业影响</div>
                      <div className="text-xs" style={{ color: BRAND.textSub }}>{drawerCase.impact}</div>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold mb-2" style={{ color: BRAND.text }}>参考资料</h4>
                      <ul className="space-y-1">
                        {drawerCase.references.map((r, i) => (
                          <li key={i} className="text-xs flex items-center gap-2" style={{ color: BRAND.textMute }}>
                            <FileText size={11} />{r}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                );
              })()}
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
                { key: '1-8', desc: '切换 Tab（1总览 2课程 3视频 4路径 5图谱 6案例 7认证 8进度）' },
                { key: '点击课程卡', desc: '打开课程详情' },
                { key: '点击讲师', desc: '查看讲师详情' },
                { key: '点击认证', desc: '查看认证要求' },
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
        .line-clamp-2 { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
        .line-clamp-3 { display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
      `}</style>
    </div>
  );
}

// helper
function LightbulbIcon() {
  return <Zap size={12} style={{ color: BRAND.warning, flexShrink: 0, marginTop: 2 }} />;
}
