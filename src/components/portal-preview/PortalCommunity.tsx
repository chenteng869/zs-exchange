'use client';

/**
 * PortalCommunity - 社区与论坛中心 (2026-07-19 Q05 P3.38)
 *
 * 页面定位：
 * - 中萨数字科技交易所 社区与论坛中心
 * - 热门话题 / 我的主页 / 板块分类 / 创作中心 / 官方公告 / 活动投票 / 积分奖励
 * - 与 P3.21 客户支持 + P3.30 跨链桥 + P3.35 自选行情 + P3.36 NFT 市场
 *   形成"支持-桥-社区-行情-生态"完整用户共建与内容生态闭环
 *
 * L4 工业级设计标准：
 * - 暗色 v6 纯黑 #000000 + 卡片 #141414 + ZSDEX 绿 primary #14B881
 * - 9 Tabs：总览 / 热门话题 / 我的主页 / 板块分类 / 创作中心 / 官方公告 / 活动投票 / 积分奖励 / 帮助
 * - 10+ 区块：Hero / 实时 KPI / 板块导航 / 热门话题流 / 我的主页 / 创作中心 / 公告 / 投票 / 积分 / 帮助 / 底部 CTA
 * - 9+ 交互：Tab 切换 / 板块过滤 / 搜索 / 排序 / 点赞 / 收藏 / 关注 / 评论 / 快捷键
 * - 7+ Drawer：话题详情 / 用户主页 / 创作向导 / 公告详情 / 投票详情 / 积分商城 / 帮助
 * - 4+ 实时数据：在线人数 / 今日发帖 / 活跃用户 / 新增粉丝
 * - 5+ 动画：Stagger / Pulse / Shimmer / Slide-in / Float
 *
 * 合规要点（Q05 硬约束）：
 * - 所有话题/帖子/用户/投票数据使用 mock 占位
 * - 状态徽章统一使用 STATUS 枚举
 * - 不修改旧官网 / 旧 H5 / disabled pages / brand.ts / SPEC.md
 * - 严格规避"承诺收益 / 保本 / 刚兑 / 萨摩亚持牌 / MSA / DSAEX"等高风险词
 * - 明确"用户共建与内容生态研究方向"定性
 */

import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import {
  Search,
  X,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Filter,
  MessageSquare,
  MessageCircle,
  Reply,
  Forward,
  Share2,
  Copy as CopyIcon,
  Bookmark,
  BookmarkCheck,
  Heart,
  ThumbsUp,
  ThumbsDown,
  Star,
  Eye,
  EyeOff,
  Flag,
  Bell,
  BellOff,
  Pin,
  PinOff,
  Lock,
  Unlock,
  Globe,
  Globe2,
  Users,
  User,
  UserCheck,
  UserPlus,
  UserMinus,
  Crown,
  Award,
  Trophy,
  Medal,
  Sparkles,
  Flame,
  Rocket,
  Zap,
  TrendingUp,
  TrendingDown,
  Calendar,
  Clock,
  Hash,
  Tag,
  Tags,
  Plus,
  Minus,
  Check,
  CheckCircle2,
  XCircle,
  AlertCircle,
  AlertTriangle,
  Send,
  Paperclip,
  Image as ImageIcon,
  ImagePlus,
  Smile,
  AtSign,
  Link2,
  Edit,
  Edit2,
  Edit3,
  Trash2,
  MoreHorizontal,
  MoreVertical,
  Settings,
  Sliders,
  SlidersHorizontal,
  HelpCircle,
  Keyboard,
  BookOpen,
  GraduationCap,
  Lightbulb,
  Compass,
  MapPin,
  Target,
  Gauge,
  BarChart3,
  PieChart as PieIcon,
  LineChart as LineIcon,
  Activity,
  Database,
  Server,
  Cloud,
  Network,
  Cpu,
  Code2,
  Terminal,
  FileText,
  FileCode,
  Layers,
  Boxes,
  Box,
  Briefcase,
  Building2,
  Handshake,
  HandCoins,
  Coins,
  CircleDollarSign,
  Wallet,
  Hexagon,
  Diamond,
  Gem,
  Shield,
  ShieldCheck,
  ShieldAlert,
  KeyRound,
  KeySquare,
  RefreshCw,
  Volume2,
  VolumeX,
  Mail,
  Phone,
  Megaphone,
  Vote,
  CheckSquare,
  Square,
  ListChecks,
  ArrowUp,
  ArrowDown,
  ArrowUpRight,
  ArrowDownRight,
  ArrowRight,
} from 'lucide-react';
import { BRAND, STATUS } from './brand';

// ============== 类型 ==============

type Tab = 'overview' | 'topics' | 'profile' | 'boards' | 'create' | 'announcement' | 'vote' | 'points' | 'help';
type BoardCategory = 'announcement' | 'discussion' | 'tech' | 'trading' | 'nft' | 'defi' | 'feedback' | 'offtopic' | 'tutorial' | 'governance';
type TopicStatus = 'hot' | 'pinned' | 'featured' | 'closed' | 'normal' | 'locked';
type UserLevel = 'newbie' | 'junior' | 'senior' | 'expert' | 'master' | 'legend';
type UserRole = 'member' | 'vip' | 'kol' | 'moderator' | 'admin' | 'founder';
type VoteType = 'single' | 'multiple' | 'weighted' | 'quadratic';
type VoteStatus = 'upcoming' | 'live' | 'ended' | 'cancelled';
type CreateType = 'post' | 'article' | 'question' | 'tutorial' | 'review' | 'video' | 'poll';
type DrawerType = 'topic' | 'user' | 'create' | 'announcement' | 'vote' | 'shop' | 'help' | 'reply' | null;

interface Board {
  id: string;
  name: string;
  category: BoardCategory;
  desc: string;
  icon: string;
  topics: number;
  posts: number;
  members: number;
  todayPosts: number;
  lastPostTime: string;
  moderators: string[];
  pinned: boolean;
  official: boolean;
  joined: boolean;
  tags: string[];
  rules: string[];
  activeNow: number;
}

interface Topic {
  id: string;
  title: string;
  boardId: string;
  boardName: string;
  authorId: string;
  authorName: string;
  authorLevel: UserLevel;
  authorRole: UserRole;
  authorAvatar: string;
  excerpt: string;
  content: string;
  tags: string[];
  status: TopicStatus;
  views: number;
  replies: number;
  likes: number;
  bookmarks: number;
  shares: number;
  createdAt: string;
  lastReplyAt: string;
  lastReplyUser: string;
  pinned: boolean;
  liked: boolean;
  bookmarked: boolean;
  followed: boolean;
  hot: boolean;
  awardPoints: number;
  images: number;
  isVideo: boolean;
  isQuestion: boolean;
  isAnswered: boolean;
  reward: number;
  pollOptions?: { id: string; text: string; votes: number }[];
}

interface UserProfile {
  id: string;
  name: string;
  avatar: string;
  level: UserLevel;
  role: UserRole;
  bio: string;
  followers: number;
  following: number;
  posts: number;
  topics: number;
  likes: number;
  points: number;
  badges: number;
  joinedAt: string;
  lastActiveAt: string;
  verified: boolean;
  signature: string;
  socialLinks: { twitter?: string; github?: string; website?: string };
  expertise: string[];
  recentActivity: { time: string; action: string; target: string }[];
  achievements: { name: string; icon: string; desc: string; date: string }[];
  contributionByMonth: { month: string; posts: number; likes: number; points: number }[];
}

interface AnnouncementItem {
  id: string;
  title: string;
  category: 'system' | 'event' | 'listing' | 'maintenance' | 'security' | 'policy';
  priority: 'low' | 'medium' | 'high' | 'critical';
  publishedAt: string;
  author: string;
  excerpt: string;
  content: string;
  pinned: boolean;
  views: number;
  comments: number;
  tags: string[];
  attachments: number;
  read: boolean;
}

interface VoteItem {
  id: string;
  title: string;
  desc: string;
  type: VoteType;
  status: VoteStatus;
  startTime: string;
  endTime: string;
  totalVotes: number;
  eligibleVoters: number;
  options: { id: string; text: string; votes: number; color: string }[];
  creator: string;
  tags: string[];
  rewards: number;
  participated: boolean;
  selectedOption?: string;
  quorum: number;
  isBinding: boolean;
}

interface PointsShopItem {
  id: string;
  name: string;
  desc: string;
  category: 'badge' | 'theme' | 'fee' | 'airdrop' | 'feature' | 'gift' | 'merch';
  cost: number;
  originalPrice?: number;
  available: number;
  total: number;
  image: string;
  status: 'available' | 'limited' | 'soldout' | 'coming';
  hot: boolean;
  badge?: string;
}

interface KpiSnapshot {
  totalUsers: number;
  onlineNow: number;
  todayPosts: number;
  totalPosts: number;
  totalTopics: number;
  totalBoards: number;
  newFollowers: number;
  activeDiscussions: number;
  pendingReviews: number;
  rewardsPool: number;
  topKOL: string;
  growthRate: number;
  zsdPrice: number;
}

interface DrawerState {
  open: boolean;
  type: DrawerType;
  payload: string | null;
}

// ============== 常量 ==============

const BOARD_CATEGORY_LABELS: Record<BoardCategory, string> = {
  announcement: '官方公告',
  discussion: '综合讨论',
  tech: '技术开发',
  trading: '交易心得',
  nft: 'NFT 收藏',
  defi: 'DeFi 矿池',
  feedback: '产品建议',
  offtopic: '灌水区',
  tutorial: '教程指南',
  governance: '社区治理',
};

const LEVEL_LABELS: Record<UserLevel, string> = {
  newbie: '萌新',
  junior: '入门',
  senior: '资深',
  expert: '专家',
  master: '大师',
  legend: '传奇',
};

const LEVEL_COLORS: Record<UserLevel, string> = {
  newbie: BRAND.textMute,
  junior: BRAND.info,
  senior: BRAND.success,
  expert: BRAND.primary,
  master: BRAND.amber,
  legend: BRAND.gold,
};

const ROLE_LABELS: Record<UserRole, string> = {
  member: '普通会员',
  vip: 'VIP 会员',
  kol: 'KOL 大V',
  moderator: '版主',
  admin: '管理员',
  founder: '官方',
};

const STATUS_LABELS: Record<TopicStatus, { label: string; color: string; bg: string }> = {
  hot: { label: '热门', color: BRAND.danger, bg: BRAND.dangerLt },
  pinned: { label: '置顶', color: BRAND.primary, bg: BRAND.primaryLt },
  featured: { label: '精选', color: BRAND.amber, bg: BRAND.amberLt },
  closed: { label: '已结', color: BRAND.textSub, bg: 'rgba(176, 176, 176, 0.10)' },
  normal: { label: '正常', color: BRAND.textMute, bg: 'rgba(112, 112, 112, 0.08)' },
  locked: { label: '锁定', color: BRAND.textDisabled, bg: 'rgba(74, 74, 74, 0.10)' },
};

const VOTE_TYPE_LABELS: Record<VoteType, string> = {
  single: '单选',
  multiple: '多选',
  weighted: '权重投票',
  quadratic: '二次方投票',
};

const VOTE_STATUS_LABELS: Record<VoteStatus, { label: string; color: string; bg: string }> = {
  upcoming: { label: '未开始', color: BRAND.info, bg: BRAND.infoLt },
  live: { label: '进行中', color: BRAND.success, bg: BRAND.successLt },
  ended: { label: '已结束', color: BRAND.textSub, bg: 'rgba(176, 176, 176, 0.10)' },
  cancelled: { label: '已取消', color: BRAND.danger, bg: BRAND.dangerLt },
};

const SHOP_CATEGORY_LABELS: Record<PointsShopItem['category'], string> = {
  badge: '专属徽章',
  theme: '界面主题',
  fee: '手续费券',
  airdrop: '空投礼包',
  feature: '功能特权',
  gift: '限量礼品',
  merch: '周边商品',
};

const CREATE_TYPE_LABELS: Record<CreateType, string> = {
  post: '普通帖',
  article: '长文',
  question: '提问',
  tutorial: '教程',
  review: '测评',
  video: '视频',
  poll: '投票',
};

// ============== 工具函数 ==============

function formatNumber(n: number): string {
  if (n >= 1e8) return `${(n / 1e8).toFixed(1)}亿`;
  if (n >= 1e4) return `${(n / 1e4).toFixed(1)}万`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return n.toString();
}

function formatTimeAgo(date: string): string {
  // 简化实现：根据字符串前缀返回时间标签
  if (date.includes('分钟')) return date;
  if (date.includes('小时')) return date;
  if (date.includes('天')) return date;
  if (date.includes('月')) return date;
  return date;
}

function pctBar(value: number, max: number): number {
  if (max <= 0) return 0;
  return Math.max(0, Math.min(100, (value / max) * 100));
}

// ============== Mock 数据 ==============

const BOARDS: Board[] = [
  {
    id: 'b-001', name: '官方公告', category: 'announcement', desc: '平台官方发布的最新公告、维护通知、产品更新与监管动态。',
    icon: '📢', topics: 248, posts: 1840, members: 28400, todayPosts: 4, lastPostTime: '2 小时前',
    moderators: ['官方小助手', '运营小妹'], pinned: true, official: true, joined: true,
    tags: ['官方', '公告', '必读'], rules: ['仅官方账号可发', '禁止讨论政治敏感话题', '请勿重复发布'], activeNow: 124,
  },
  {
    id: 'b-002', name: '行情讨论', category: 'trading', desc: '行情分析、交易策略、心得分享、热点解读。',
    icon: '📈', topics: 8420, posts: 128400, members: 84200, todayPosts: 248, lastPostTime: '3 分钟前',
    moderators: ['行情老张', '量化小哥'], pinned: true, official: false, joined: true,
    tags: ['行情', '分析', '策略'], rules: ['禁止喊单', '禁止承诺收益', '禁止诱导交易'], activeNow: 2840,
  },
  {
    id: 'b-003', name: '技术开发', category: 'tech', desc: '智能合约开发、API 集成、SDK 使用、技术架构交流。',
    icon: '💻', topics: 1240, posts: 18420, members: 12400, todayPosts: 28, lastPostTime: '18 分钟前',
    moderators: ['架构师老王', 'DevRel-Alex'], pinned: false, official: false, joined: true,
    tags: ['开发', 'API', '合约'], rules: ['附上代码片段', '标注环境信息', '禁止灌水'], activeNow: 184,
  },
  {
    id: 'b-004', name: 'NFT 收藏', category: 'nft', desc: 'NFT 藏品分享、艺术家推荐、市场热点、IP 合作讨论。',
    icon: '🎨', topics: 4280, posts: 64200, members: 42800, todayPosts: 124, lastPostTime: '5 分钟前',
    moderators: ['NFT 收藏家'], pinned: false, official: false, joined: true,
    tags: ['NFT', '收藏', '艺术'], rules: ['禁止虚假宣传', '标注藏品来源', '禁止炒作'], activeNow: 1240,
  },
  {
    id: 'b-005', name: 'DeFi 矿池', category: 'defi', desc: 'DeFi 协议、流动性挖矿、收益策略、风险讨论。',
    icon: '💧', topics: 2840, posts: 38400, members: 28400, todayPosts: 64, lastPostTime: '12 分钟前',
    moderators: ['DeFi 玩家', '挖矿达人'], pinned: false, official: false, joined: true,
    tags: ['DeFi', '挖矿', '收益'], rules: ['标注项目风险', '禁止虚假收益', '禁止诱导跟单'], activeNow: 840,
  },
  {
    id: 'b-006', name: '产品建议', category: 'feedback', desc: '产品功能建议、Bug 反馈、体验优化、用户共建。',
    icon: '💡', topics: 1240, posts: 18420, members: 18400, todayPosts: 18, lastPostTime: '1 小时前',
    moderators: ['产品经理-小李'], pinned: false, official: true, joined: true,
    tags: ['建议', '反馈', '共建'], rules: ['请描述复现步骤', '附上截图或录屏', '禁止人身攻击'], activeNow: 184,
  },
  {
    id: 'b-007', name: '教程指南', category: 'tutorial', desc: '新手教程、进阶指南、最佳实践、常见问题解答。',
    icon: '📚', topics: 480, posts: 8400, members: 12400, todayPosts: 8, lastPostTime: '3 小时前',
    moderators: ['学院助教'], pinned: false, official: true, joined: true,
    tags: ['教程', '指南', 'FAQ'], rules: ['原创优先', '标注资料来源', '禁止抄袭'], activeNow: 84,
  },
  {
    id: 'b-008', name: '社区治理', category: 'governance', desc: 'DAO 提案、投票讨论、参数调整、生态发展方向。',
    icon: '🗳️', topics: 124, posts: 1840, members: 8400, todayPosts: 4, lastPostTime: '6 小时前',
    moderators: ['治理委员会'], pinned: false, official: true, joined: true,
    tags: ['治理', 'DAO', '提案'], rules: ['提案需附背景', '禁止人身攻击', '遵守投票规则'], activeNow: 42,
  },
  {
    id: 'b-009', name: '灌水区', category: 'offtopic', desc: '生活分享、兴趣爱好、非交易话题。',
    icon: '💬', topics: 8420, posts: 184200, members: 64000, todayPosts: 184, lastPostTime: '1 分钟前',
    moderators: ['版主-老张'], pinned: false, official: false, joined: true,
    tags: ['灌水', '生活', '闲聊'], rules: ['禁止广告', '禁止人身攻击', '禁止色情'], activeNow: 1840,
  },
  {
    id: 'b-010', name: '综合讨论', category: 'discussion', desc: '行业资讯、宏观分析、新闻热点。',
    icon: '🌐', topics: 6480, posts: 84200, members: 48000, todayPosts: 84, lastPostTime: '8 分钟前',
    moderators: ['讨论版主'], pinned: false, official: false, joined: true,
    tags: ['综合', '讨论', '资讯'], rules: ['禁止谣言', '标注信息来源', '禁止诱导交易'], activeNow: 1240,
  },
];

const TOPICS: Topic[] = [
  {
    id: 't-001', title: '【公告】平台 V3.18 重大更新：全栈交易引擎升级',
    boardId: 'b-001', boardName: '官方公告', authorId: 'u-001', authorName: '官方小助手', authorLevel: 'master', authorRole: 'founder', authorAvatar: '🏛️',
    excerpt: '本次更新对现货、永续、期权三大交易引擎进行深度重构，平均撮合时延降低 42%，支持 50 万级 TPS 压力测试...',
    content: '本次 V3.18 更新是平台成立以来最大规模的一次底层架构升级...',
    tags: ['公告', '更新', '重要'], status: 'pinned', views: 284000, replies: 1840, likes: 12400, bookmarks: 8400, shares: 4200,
    createdAt: '2026-07-15 09:00', lastReplyAt: '30 分钟前', lastReplyUser: '量化小哥', pinned: true, liked: false, bookmarked: false, followed: true, hot: true,
    awardPoints: 240, images: 0, isVideo: false, isQuestion: false, isAnswered: false, reward: 0,
  },
  {
    id: 't-002', title: '【精选】从 0 到 1 搭建量化策略：年化波动率分析框架',
    boardId: 'b-002', boardName: '行情讨论', authorId: 'u-002', authorName: '量化小哥', authorLevel: 'expert', authorRole: 'kol', authorAvatar: '📊',
    excerpt: '分享一套完整的年化波动率分析框架，含数据采集、特征工程、信号生成、回测验证、风险控制全流程...',
    content: '本文将系统介绍从 0 到 1 搭建量化策略的完整路径...',
    tags: ['量化', '策略', '回测'], status: 'featured', views: 84000, replies: 1240, likes: 8400, bookmarks: 12400, shares: 2840,
    createdAt: '2026-07-18 14:30', lastReplyAt: '12 分钟前', lastReplyUser: '行情老张', pinned: false, liked: true, bookmarked: true, followed: true, hot: true,
    awardPoints: 184, images: 4, isVideo: false, isQuestion: false, isAnswered: false, reward: 0,
  },
  {
    id: 't-003', title: '【热门】BTC 突破 7 万美元后，行情走向哪里？多空观点大碰撞',
    boardId: 'b-002', boardName: '行情讨论', authorId: 'u-003', authorName: '行情老张', authorLevel: 'master', authorRole: 'kol', authorAvatar: '📈',
    excerpt: '本文汇集 12 位 KOL 对 BTC 后市的判断，涵盖技术面、基本面、资金面、情绪面四个维度...',
    content: 'BTC 突破 7 万美元关键阻力位后，市场分歧加大...',
    tags: ['BTC', '行情', '分析'], status: 'hot', views: 124000, replies: 2840, likes: 6800, bookmarks: 4200, shares: 1840,
    createdAt: '2026-07-19 08:30', lastReplyAt: '3 分钟前', lastReplyUser: '短线高手', pinned: false, liked: false, bookmarked: false, followed: false, hot: true,
    awardPoints: 124, images: 2, isVideo: false, isQuestion: false, isAnswered: false, reward: 0,
  },
  {
    id: 't-004', title: '【教程】手把手教你使用 API 接入量化交易系统',
    boardId: 'b-007', boardName: '教程指南', authorId: 'u-004', authorName: '学院助教', authorLevel: 'senior', authorRole: 'moderator', authorAvatar: '🎓',
    excerpt: '从环境准备、SDK 安装、API Key 申请、签名生成到第一笔委托的全流程教程，附完整代码示例...',
    content: '本文提供从 0 到 1 接入 API 量化系统的完整教程...',
    tags: ['API', '教程', '量化'], status: 'featured', views: 42000, replies: 480, likes: 4200, bookmarks: 8400, shares: 1240,
    createdAt: '2026-07-17 10:20', lastReplyAt: '1 小时前', lastReplyUser: 'Python小王子', pinned: false, liked: false, bookmarked: true, followed: true, hot: false,
    awardPoints: 84, images: 12, isVideo: false, isQuestion: false, isAnswered: false, reward: 0,
  },
  {
    id: 't-005', title: '【提问】为什么我的 API 签名总是返回 INVALID_SIGNATURE？',
    boardId: 'b-003', boardName: '技术开发', authorId: 'u-005', authorName: 'Python小王子', authorLevel: 'junior', authorRole: 'member', authorAvatar: '🐍',
    excerpt: '使用 Python SDK 接入现货 API，调用 /v1/order 时一直返回 INVALID_SIGNATURE 错误，签名生成方式按文档操作...',
    content: '详细描述了我的代码和环境，附上完整错误信息...',
    tags: ['API', '签名', 'Python'], status: 'normal', views: 1240, replies: 18, likes: 24, bookmarks: 12, shares: 0,
    createdAt: '2026-07-19 11:30', lastReplyAt: '8 分钟前', lastReplyUser: '架构师老王', pinned: false, liked: false, bookmarked: false, followed: false, hot: false,
    awardPoints: 0, images: 0, isVideo: false, isQuestion: true, isAnswered: true, reward: 50,
  },
  {
    id: 't-006', title: '【NFT】盘点本周 Top 10 新发行藏品，你最看好哪个？',
    boardId: 'b-004', boardName: 'NFT 收藏', authorId: 'u-006', authorName: 'NFT 收藏家', authorLevel: 'expert', authorRole: 'kol', authorAvatar: '🖼️',
    excerpt: '本周共有 24 个新发行藏品，从 AI 生成艺术到音乐 IP，从运动品牌到潮玩联名，Top 10 详细分析...',
    content: '本周新发行 NFT 藏品共 24 个，我精选了 10 个最具潜力的...',
    tags: ['NFT', '新发行', '盘点'], status: 'hot', views: 24000, replies: 480, likes: 2840, bookmarks: 1240, shares: 840,
    createdAt: '2026-07-19 09:00', lastReplyAt: '18 分钟前', lastReplyUser: '潮玩玩家', pinned: false, liked: true, bookmarked: false, followed: true, hot: true,
    awardPoints: 64, images: 10, isVideo: false, isQuestion: false, isAnswered: false, reward: 0,
  },
  {
    id: 't-007', title: '【DeFi】流动性挖矿风险防范：识别 rug pull 的 8 个信号',
    boardId: 'b-005', boardName: 'DeFi 矿池', authorId: 'u-007', authorName: 'DeFi 玩家', authorLevel: 'expert', authorRole: 'kol', authorAvatar: '💧',
    excerpt: '本文系统总结识别 rug pull 项目的 8 个早期信号，包括匿名团队、虚高收益、合约未验证等...',
    content: '过去 12 个月 rug pull 事件共造成 24 亿美元损失...',
    tags: ['DeFi', '风险', '安全'], status: 'featured', views: 64000, replies: 840, likes: 4800, bookmarks: 6400, shares: 2400,
    createdAt: '2026-07-18 16:40', lastReplyAt: '2 小时前', lastReplyUser: '链上侦探', pinned: false, liked: false, bookmarked: true, followed: false, hot: false,
    awardPoints: 124, images: 6, isVideo: false, isQuestion: false, isAnswered: false, reward: 0,
  },
  {
    id: 't-008', title: '【建议】希望增加现货条件单支持 OCO 和冰山委托',
    boardId: 'b-006', boardName: '产品建议', authorId: 'u-008', authorName: '产品体验官', authorLevel: 'senior', authorRole: 'member', authorAvatar: '💡',
    excerpt: '目前现货条件单只支持单一触发价和单一动作，希望增加 OCO（一笔成交另一笔撤销）和冰山委托功能...',
    content: '在高频交易和波动率扩大场景下，OCO 和冰山委托是必备功能...',
    tags: ['建议', '现货', '条件单'], status: 'normal', views: 4800, replies: 124, likes: 240, bookmarks: 84, shares: 12,
    createdAt: '2026-07-19 10:00', lastReplyAt: '30 分钟前', lastReplyUser: '产品经理-小李', pinned: false, liked: false, bookmarked: false, followed: false, hot: false,
    awardPoints: 0, images: 0, isVideo: false, isQuestion: false, isAnswered: true, reward: 100,
  },
  {
    id: 't-009', title: '【治理】关于平台 V4.0 升级方向的社区提案',
    boardId: 'b-008', boardName: '社区治理', authorId: 'u-009', authorName: '治理委员会', authorLevel: 'master', authorRole: 'admin', authorAvatar: '🗳️',
    excerpt: 'V4.0 升级方向涵盖 Layer2 扩展、隐私交易、跨链互操作、机构服务 4 大方向，请社区成员投票决定优先级...',
    content: '经过 3 个月的调研，我们整理出 V4.0 的 4 大升级方向...',
    tags: ['治理', 'V4.0', '提案'], status: 'pinned', views: 18400, replies: 480, likes: 1840, bookmarks: 2400, shares: 840,
    createdAt: '2026-07-15 14:00', lastReplyAt: '4 小时前', lastReplyUser: '社区成员-A', pinned: true, liked: false, bookmarked: false, followed: true, hot: true,
    awardPoints: 200, images: 3, isVideo: false, isQuestion: false, isAnswered: false, reward: 0,
  },
  {
    id: 't-010', title: '【视频】DeFi 收益聚合器使用教程 2026 完整版',
    boardId: 'b-007', boardName: '教程指南', authorId: 'u-010', authorName: '学院助教', authorLevel: 'senior', authorRole: 'moderator', authorAvatar: '🎬',
    excerpt: '24 分钟完整视频教程，从钱包连接到收益提取全流程演示，附字幕与配套文档...',
    content: '本视频详细演示 DeFi 收益聚合器的完整使用流程...',
    tags: ['教程', 'DeFi', '视频'], status: 'featured', views: 28000, replies: 240, likes: 1840, bookmarks: 2400, shares: 640,
    createdAt: '2026-07-16 18:00', lastReplyAt: '5 小时前', lastReplyUser: 'DeFi 玩家', pinned: false, liked: false, bookmarked: false, followed: false, hot: false,
    awardPoints: 48, images: 0, isVideo: true, isQuestion: false, isAnswered: false, reward: 0,
  },
  {
    id: 't-011', title: '【讨论】Meme 币热潮：到底是机会还是陷阱？',
    boardId: 'b-010', boardName: '综合讨论', authorId: 'u-011', authorName: '理性分析师', authorLevel: 'senior', authorRole: 'vip', authorAvatar: '🎭',
    excerpt: 'Meme 币热潮再度来袭，本文从历史数据、用户结构、资金流向三个维度分析其本质与风险...',
    content: 'Meme 币热潮每隔一段时间就会卷土重来...',
    tags: ['Meme', '讨论', '风险'], status: 'normal', views: 12400, replies: 280, likes: 480, bookmarks: 184, shares: 84,
    createdAt: '2026-07-19 07:00', lastReplyAt: '1 小时前', lastReplyUser: '观望派', pinned: false, liked: false, bookmarked: false, followed: false, hot: false,
    awardPoints: 24, images: 1, isVideo: false, isQuestion: false, isAnswered: false, reward: 0,
  },
  {
    id: 't-012', title: '【闲聊】社区名人堂：你心中的 Top 5 KOL 是谁？',
    boardId: 'b-009', boardName: '灌水区', authorId: 'u-012', authorName: '社区老用户', authorLevel: 'senior', authorRole: 'member', authorAvatar: '🗣️',
    excerpt: '盘点社区最受关注、最具影响力、最有内容输出的 5 位 KOL，欢迎大家提名你心中的最佳...',
    content: '社区成立至今涌现出大量优质 KOL...',
    tags: ['闲聊', 'KOL', '榜单'], status: 'normal', views: 8400, replies: 184, likes: 240, bookmarks: 12, shares: 24,
    createdAt: '2026-07-19 12:00', lastReplyAt: '6 分钟前', lastReplyUser: '萌新-小白', pinned: false, liked: false, bookmarked: false, followed: false, hot: false,
    awardPoints: 0, images: 0, isVideo: false, isQuestion: false, isAnswered: false, reward: 0,
  },
];

const USERS: UserProfile[] = [
  {
    id: 'u-001', name: '官方小助手', avatar: '🏛️', level: 'master', role: 'founder',
    bio: '平台官方账号，发布最新公告、产品更新、活动通知。',
    followers: 184200, following: 12, posts: 1840, topics: 480, likes: 124800, points: 1840000, badges: 24,
    joinedAt: '2024-08-01', lastActiveAt: '30 分钟前', verified: true,
    signature: '「中萨数字科技交易所 · 官方账号」',
    socialLinks: { twitter: '@zsdex_official', website: 'zsdex.example.com' },
    expertise: ['官方', '公告', '产品'],
    recentActivity: [
      { time: '30 分钟前', action: '发布了公告', target: '平台 V3.18 重大更新' },
      { time: '2 小时前', action: '回复了', target: '社区成员提问' },
      { time: '4 小时前', action: '置顶了', target: '风险提示' },
    ],
    achievements: [
      { name: '社区元老', icon: '👑', desc: '社区创始团队成员', date: '2024-08' },
      { name: '官方认证', icon: '✅', desc: '平台官方账号', date: '2024-08' },
      { name: '百万粉丝', icon: '🌟', desc: '粉丝突破 100 万', date: '2026-03' },
    ],
    contributionByMonth: [
      { month: '2026-01', posts: 12, likes: 4200, points: 8400 },
      { month: '2026-02', posts: 18, likes: 6400, points: 12400 },
      { month: '2026-03', posts: 24, likes: 8400, points: 18400 },
      { month: '2026-04', posts: 18, likes: 6800, points: 14200 },
      { month: '2026-05', posts: 24, likes: 8400, points: 18400 },
      { month: '2026-06', posts: 30, likes: 12400, points: 24800 },
    ],
  },
  {
    id: 'u-002', name: '量化小哥', avatar: '📊', level: 'expert', role: 'kol',
    bio: '十年量化交易经验，专注高频策略、跨市场套利、风险管理。',
    followers: 84200, following: 240, posts: 1240, topics: 280, likes: 124000, points: 480000, badges: 18,
    joinedAt: '2024-12-15', lastActiveAt: '12 分钟前', verified: true,
    signature: '「量化是科学，不是玄学」',
    socialLinks: { twitter: '@quant_bro', github: 'quant-bro' },
    expertise: ['量化', '策略', '回测'],
    recentActivity: [
      { time: '12 分钟前', action: '回复了', target: '从 0 到 1 搭建量化策略' },
      { time: '1 小时前', action: '发布了', target: 'BTC 行情分析' },
      { time: '3 小时前', action: '收藏了', target: 'API 接入教程' },
    ],
    achievements: [
      { name: 'KOL 大V', icon: '🏆', desc: '认证 KOL 账号', date: '2025-01' },
      { name: '万赞作者', icon: '💎', desc: '累计获得 10 万赞', date: '2026-01' },
      { name: '策略专家', icon: '📈', desc: '发布 100+ 策略文章', date: '2026-04' },
    ],
    contributionByMonth: [
      { month: '2026-01', posts: 24, likes: 8400, points: 18400 },
      { month: '2026-02', posts: 18, likes: 6400, points: 12400 },
      { month: '2026-03', posts: 30, likes: 12400, points: 28400 },
      { month: '2026-04', posts: 24, likes: 8400, points: 18400 },
      { month: '2026-05', posts: 36, likes: 14400, points: 32400 },
      { month: '2026-06', posts: 42, likes: 18400, points: 38400 },
    ],
  },
  {
    id: 'u-003', name: '行情老张', avatar: '📈', level: 'master', role: 'kol',
    bio: '二十年金融市场老兵，专研技术分析、周期理论、资金管理。',
    followers: 124000, following: 84, posts: 2840, topics: 480, likes: 184000, points: 720000, badges: 24,
    joinedAt: '2024-10-08', lastActiveAt: '3 分钟前', verified: true,
    signature: '「顺势而为，严控风险」',
    socialLinks: { twitter: '@laozhang_quant', website: 'laozhang.example.com' },
    expertise: ['行情', '技术分析', '风控'],
    recentActivity: [
      { time: '3 分钟前', action: '回复了', target: 'BTC 突破 7 万美元讨论' },
      { time: '1 小时前', action: '发布了', target: '本周行情展望' },
      { time: '5 小时前', action: '点赞了', target: '风险防范文章' },
    ],
    achievements: [
      { name: '终身成就', icon: '🏆', desc: '入驻超过 1 年', date: '2025-10' },
      { name: '百万粉丝', icon: '🌟', desc: '粉丝突破 100 万', date: '2026-05' },
      { name: '原创大师', icon: '📜', desc: '发布 1000+ 原创', date: '2026-06' },
    ],
    contributionByMonth: [
      { month: '2026-01', posts: 48, likes: 18400, points: 38400 },
      { month: '2026-02', posts: 42, likes: 16400, points: 32400 },
      { month: '2026-03', posts: 60, likes: 24400, points: 48400 },
      { month: '2026-04', posts: 48, likes: 18400, points: 38400 },
      { month: '2026-05', posts: 72, likes: 28400, points: 58400 },
      { month: '2026-06', posts: 84, likes: 32400, points: 64400 },
    ],
  },
  {
    id: 'u-004', name: '学院助教', avatar: '🎓', level: 'senior', role: 'moderator',
    bio: '学院官方账号，发布教程、答疑、组织学习活动。',
    followers: 28400, following: 124, posts: 480, topics: 124, likes: 24000, points: 120000, badges: 12,
    joinedAt: '2025-01-20', lastActiveAt: '1 小时前', verified: true,
    signature: '「授人以鱼不如授人以渔」',
    socialLinks: { website: 'academy.zsdex.example.com' },
    expertise: ['教程', '教学', '答疑'],
    recentActivity: [
      { time: '1 小时前', action: '发布了', target: 'API 接入完整教程' },
      { time: '3 小时前', action: '回复了', target: '新手入门问题' },
      { time: '6 小时前', action: '整理了', target: 'FAQ 文档' },
    ],
    achievements: [
      { name: '学院认证', icon: '🎓', desc: '学院官方助教', date: '2025-01' },
      { name: '优秀版主', icon: '⭐', desc: '月度优秀版主', date: '2026-04' },
    ],
    contributionByMonth: [
      { month: '2026-01', posts: 12, likes: 2400, points: 4800 },
      { month: '2026-02', posts: 18, likes: 3200, points: 6400 },
      { month: '2026-03', posts: 24, likes: 4800, points: 8400 },
      { month: '2026-04', posts: 18, likes: 3200, points: 6400 },
      { month: '2026-05', posts: 24, likes: 4800, points: 8400 },
      { month: '2026-06', posts: 30, likes: 6400, points: 12400 },
    ],
  },
  {
    id: 'u-006', name: 'NFT 收藏家', avatar: '🖼️', level: 'expert', role: 'kol',
    bio: 'NFT 早期玩家，专注艺术、摄影、音乐类数字藏品收藏与研究。',
    followers: 42000, following: 184, posts: 640, topics: 124, likes: 48000, points: 240000, badges: 12,
    joinedAt: '2025-03-12', lastActiveAt: '18 分钟前', verified: true,
    signature: '「数字艺术，永恒之美」',
    socialLinks: { twitter: '@nft_collector', website: 'nft-collection.example.com' },
    expertise: ['NFT', '收藏', '艺术'],
    recentActivity: [
      { time: '18 分钟前', action: '回复了', target: 'Top 10 新发行藏品' },
      { time: '2 小时前', action: '发布了', target: '艺术家访谈' },
      { time: '5 小时前', action: '收藏了', target: '稀有藏品' },
    ],
    achievements: [
      { name: 'KOL 大V', icon: '🏆', desc: '认证 KOL 账号', date: '2025-04' },
      { name: 'NFT 达人', icon: '🖼️', desc: '收藏 1000+ NFT', date: '2026-02' },
    ],
    contributionByMonth: [
      { month: '2026-01', posts: 18, likes: 3200, points: 6400 },
      { month: '2026-02', posts: 24, likes: 4800, points: 8400 },
      { month: '2026-03', posts: 18, likes: 3200, points: 6400 },
      { month: '2026-04', posts: 30, likes: 6400, points: 12400 },
      { month: '2026-05', posts: 24, likes: 4800, points: 8400 },
      { month: '2026-06', posts: 36, likes: 8400, points: 18400 },
    ],
  },
];

const ANNOUNCEMENTS: AnnouncementItem[] = [
  {
    id: 'an-001', title: '【系统升级】平台 V3.18 全栈交易引擎升级通知',
    category: 'system', priority: 'high', publishedAt: '2026-07-15 09:00', author: '官方小助手',
    excerpt: '本次升级涵盖现货、永续、期权三大交易引擎，预计维护时间 4 小时，维护期间部分功能将暂停...',
    content: '为提升平台交易体验，平台将于 2026-07-20 02:00-06:00 (UTC+8) 进行 V3.18 全栈交易引擎升级...',
    pinned: true, views: 284000, comments: 1840, tags: ['系统', '升级', '重要'], attachments: 1, read: true,
  },
  {
    id: 'an-002', title: '【新币上线】ZSD 平台币首发申购公告',
    category: 'listing', priority: 'high', publishedAt: '2026-07-18 10:00', author: '官方小助手',
    excerpt: 'ZSD 平台币将于 2026-07-25 开启首发申购，总量 1 亿枚，认购价格 1.00 USDT...',
    content: 'ZSD 平台币是中萨数字科技交易所发行的平台权益通证...',
    pinned: true, views: 124000, comments: 840, tags: ['新币', '申购', '平台币'], attachments: 2, read: true,
  },
  {
    id: 'an-003', title: '【活动】社区创作者激励计划开启',
    category: 'event', priority: 'medium', publishedAt: '2026-07-17 14:00', author: '官方小助手',
    excerpt: '为鼓励优质内容输出，社区创作者激励计划正式开启，最高每月可获得 10,000 积分奖励...',
    content: '社区创作者激励计划是平台针对优质内容创作者推出的长期激励项目...',
    pinned: false, views: 64000, comments: 480, tags: ['活动', '激励', '创作者'], attachments: 1, read: true,
  },
  {
    id: 'an-004', title: '【安全提醒】近期钓鱼网站风险提示',
    category: 'security', priority: 'critical', publishedAt: '2026-07-19 08:00', author: '风控团队',
    excerpt: '近期出现多起仿冒平台的钓鱼网站攻击事件，请务必认准官方域名 zsdex.example.com...',
    content: '近期风控团队监测到多起仿冒平台的钓鱼网站攻击事件...',
    pinned: true, views: 184000, comments: 1240, tags: ['安全', '提醒', '必读'], attachments: 3, read: false,
  },
  {
    id: 'an-005', title: '【合规】关于 V4.0 升级方向的社区治理提案',
    category: 'policy', priority: 'medium', publishedAt: '2026-07-15 14:00', author: '治理委员会',
    excerpt: 'V4.0 升级方向涵盖 Layer2 扩展、隐私交易、跨链互操作、机构服务 4 大方向...',
    content: '经过 3 个月的调研，我们整理出 V4.0 的 4 大升级方向...',
    pinned: false, views: 18400, comments: 480, tags: ['治理', '提案', 'V4.0'], attachments: 2, read: false,
  },
  {
    id: 'an-006', title: '【维护】API 网关定期维护通知',
    category: 'maintenance', priority: 'low', publishedAt: '2026-07-19 10:00', author: '技术团队',
    excerpt: 'API 网关将于 2026-07-21 23:00-23:30 (UTC+8) 进行定期维护，期间可能短暂不可用...',
    content: '为保障 API 服务稳定性，API 网关将于指定时间进行定期维护...',
    pinned: false, views: 8400, comments: 12, tags: ['维护', 'API', '通知'], attachments: 0, read: false,
  },
];

const VOTES: VoteItem[] = [
  {
    id: 'v-001', title: 'V4.0 升级方向优先级排序',
    desc: '从 Layer2 扩展、隐私交易、跨链互操作、机构服务 4 个方向中选择你认为最重要的 2 项',
    type: 'multiple', status: 'live', startTime: '2026-07-15 14:00', endTime: '2026-07-25 18:00',
    totalVotes: 8420, eligibleVoters: 124000, creator: '治理委员会',
    options: [
      { id: 'vo-001', text: 'Layer2 扩展', votes: 3840, color: BRAND.primary },
      { id: 'vo-002', text: '隐私交易', votes: 1240, color: BRAND.info },
      { id: 'vo-003', text: '跨链互操作', votes: 2240, color: BRAND.amber },
      { id: 'vo-004', text: '机构服务', votes: 1100, color: BRAND.danger },
    ],
    tags: ['治理', 'V4.0', '重要'], rewards: 500, participated: false, quorum: 5000, isBinding: true,
  },
  {
    id: 'v-002', title: '社区积分体系改革方案',
    desc: '是否同意将社区积分从静态发放改为动态衰减模型？',
    type: 'single', status: 'live', startTime: '2026-07-18 10:00', endTime: '2026-07-22 10:00',
    totalVotes: 1240, eligibleVoters: 124000, creator: '积分团队',
    options: [
      { id: 'vo-005', text: '同意改革', votes: 840, color: BRAND.success },
      { id: 'vo-006', text: '保持现状', votes: 280, color: BRAND.danger },
      { id: 'vo-007', text: '需要更多讨论', votes: 120, color: BRAND.amber },
    ],
    tags: ['积分', '改革'], rewards: 100, participated: true, selectedOption: 'vo-005', quorum: 1000, isBinding: false,
  },
  {
    id: 'v-003', title: '新增社区版主选举',
    desc: '从 8 位候选人中选出 3 位新任社区版主，任期 6 个月',
    type: 'multiple', status: 'upcoming', startTime: '2026-07-25 10:00', endTime: '2026-07-30 18:00',
    totalVotes: 0, eligibleVoters: 124000, creator: '社区委员会',
    options: [
      { id: 'vo-008', text: '候选人 A - 量化小哥', votes: 0, color: BRAND.primary },
      { id: 'vo-009', text: '候选人 B - DeFi 玩家', votes: 0, color: BRAND.info },
      { id: 'vo-010', text: '候选人 C - NFT 收藏家', votes: 0, color: BRAND.amber },
      { id: 'vo-011', text: '候选人 D - 学院助教', votes: 0, color: BRAND.danger },
    ],
    tags: ['版主', '选举'], rewards: 200, participated: false, quorum: 3000, isBinding: true,
  },
  {
    id: 'v-004', title: '是否支持增加现货网格交易功能',
    desc: '支持 / 反对 / 弃权 三方投票',
    type: 'single', status: 'ended', startTime: '2026-07-01 10:00', endTime: '2026-07-08 18:00',
    totalVotes: 18420, eligibleVoters: 124000, creator: '产品团队',
    options: [
      { id: 'vo-012', text: '支持', votes: 14200, color: BRAND.success },
      { id: 'vo-013', text: '反对', votes: 1240, color: BRAND.danger },
      { id: 'vo-014', text: '弃权', votes: 2980, color: BRAND.amber },
    ],
    tags: ['功能', '现货', '网格'], rewards: 50, participated: true, selectedOption: 'vo-012', quorum: 5000, isBinding: true,
  },
  {
    id: 'v-005', title: '社区激励预算分配提案',
    desc: '将本季度 100 万积分预算分配到内容创作、活动、治理三大方向',
    type: 'weighted', status: 'ended', startTime: '2026-06-15 10:00', endTime: '2026-06-30 18:00',
    totalVotes: 6420, eligibleVoters: 124000, creator: '财务团队',
    options: [
      { id: 'vo-015', text: '内容创作 50%', votes: 3840, color: BRAND.primary },
      { id: 'vo-016', text: '活动激励 30%', votes: 1640, color: BRAND.info },
      { id: 'vo-017', text: '治理参与 20%', votes: 940, color: BRAND.amber },
    ],
    tags: ['预算', '激励'], rewards: 200, participated: true, selectedOption: 'vo-015', quorum: 3000, isBinding: false,
  },
];

const SHOP_ITEMS: PointsShopItem[] = [
  { id: 's-001', name: 'VIP 会员 30 天', desc: '享受 VIP 专属特权：手续费折扣、专属客服、活动优先', category: 'fee', cost: 5000, originalPrice: 8000, available: 240, total: 500, image: '👑', status: 'available', hot: true, badge: '热销' },
  { id: 's-002', name: '专属创作者徽章', desc: '社区创作者专属徽章，展示在个人主页', category: 'badge', cost: 2400, available: 124, total: 1000, image: '🏅', status: 'available', hot: true },
  { id: 's-003', name: '暗色主题 Pro', desc: '解锁暗色主题 Pro 配色、动效、自定义背景', category: 'theme', cost: 1200, originalPrice: 1800, available: 840, total: 5000, image: '🎨', status: 'available', hot: false },
  { id: 's-004', name: '手续费 5 折券', desc: '现货交易手续费 5 折，有效期 30 天', category: 'fee', cost: 800, available: 1840, total: 10000, image: '💸', status: 'available', hot: false },
  { id: 's-005', name: '新功能优先体验', desc: '抢先体验 Beta 功能 90 天，提交反馈可获额外奖励', category: 'feature', cost: 3000, available: 240, total: 1000, image: '🚀', status: 'limited', hot: true, badge: '限量' },
  { id: 's-006', name: '限定周边 - 帆布袋', desc: '社区限定周边，环保帆布袋，社区 LOGO 烫金', category: 'merch', cost: 1800, available: 48, total: 200, image: '👜', status: 'limited', hot: false, badge: '限量' },
  { id: 's-007', name: '新币空投礼包', desc: '每月新币空投优先权，每月 1 次', category: 'airdrop', cost: 6000, originalPrice: 8000, available: 84, total: 500, image: '🪂', status: 'available', hot: true, badge: '热门' },
  { id: 's-008', name: '限量 NFT 徽章', desc: '社区 1 周年纪念 NFT 徽章，限量 1000 枚', category: 'badge', cost: 12000, available: 0, total: 1000, image: '🏆', status: 'soldout', hot: false },
  { id: 's-009', name: '生日礼包', desc: '生日当月可领取，专属祝福 + 500 积分 + 限定徽章', category: 'gift', cost: 0, available: 9999, total: 9999, image: '🎂', status: 'available', hot: false, badge: '免费' },
  { id: 's-010', name: '社区代币空投', desc: '持仓社区治理代币，享受空投权益', category: 'airdrop', cost: 0, available: 1240, total: 5000, image: '🪙', status: 'coming', hot: false, badge: '敬请期待' },
];

// ============== 主组件 ==============

export function PortalCommunity() {
  const [tab, setTab] = useState<Tab>('overview');
  const [search, setSearch] = useState('');
  const [boardFilter, setBoardFilter] = useState<BoardCategory | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<TopicStatus | 'all'>('all');
  const [sortBy, setSortBy] = useState<'hot' | 'new' | 'replies' | 'views'>('hot');
  const [voteStatusFilter, setVoteStatusFilter] = useState<VoteStatus | 'all'>('all');
  const [announceCategoryFilter, setAnnounceCategoryFilter] = useState<AnnouncementItem['category'] | 'all'>('all');
  const [shopCategoryFilter, setShopCategoryFilter] = useState<PointsShopItem['category'] | 'all'>('all');
  const [drawer, setDrawer] = useState<DrawerState>({ open: false, type: null, payload: null });
  const [helpOpen, setHelpOpen] = useState(false);
  const [createType, setCreateType] = useState<CreateType>('post');
  const [createTitle, setCreateTitle] = useState('');
  const [createContent, setCreateContent] = useState('');
  const [createBoard, setCreateBoard] = useState('b-010');
  const [voteSelectedOption, setVoteSelectedOption] = useState<string>('');
  const [replyText, setReplyText] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);

  const [kpi, setKpi] = useState<KpiSnapshot>({
    totalUsers: 124800,
    onlineNow: 8420,
    todayPosts: 1240,
    totalPosts: 1842000,
    totalTopics: 84200,
    totalBoards: 24,
    newFollowers: 184,
    activeDiscussions: 2840,
    pendingReviews: 18,
    rewardsPool: 1840000,
    topKOL: '行情老张',
    growthRate: 8.42,
    zsdPrice: 1.0,
  });

  useEffect(() => {
    const id = setInterval(() => {
      setKpi((prev) => ({
        ...prev,
        onlineNow: prev.onlineNow + Math.floor(Math.random() * 80 - 30),
        todayPosts: prev.todayPosts + Math.floor(Math.random() * 6 - 1),
        newFollowers: prev.newFollowers + Math.floor(Math.random() * 4 - 1),
        activeDiscussions: prev.activeDiscussions + Math.floor(Math.random() * 12 - 4),
        pendingReviews: Math.max(0, prev.pendingReviews + (Math.random() < 0.2 ? 1 : Math.random() < 0.15 ? -1 : 0)),
        growthRate: Math.max(0, prev.growthRate + (Math.random() - 0.5) * 0.08),
      }));
    }, 4200);
    return () => clearInterval(id);
  }, []);

  // 快捷键
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === '/') { e.preventDefault(); searchRef.current?.focus(); }
      else if (e.key === '?') { e.preventDefault(); setHelpOpen((v) => !v); }
      else if (e.key === 'Escape') { setDrawer({ open: false, type: null, payload: null }); setHelpOpen(false); }
      else if (e.key >= '1' && e.key <= '9') {
        const tabs: Tab[] = ['overview', 'topics', 'profile', 'boards', 'create', 'announcement', 'vote', 'points', 'help'];
        setTab(tabs[parseInt(e.key) - 1] || 'overview');
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // 过滤逻辑
  const filteredTopics = useMemo(() => {
    let list = TOPICS;
    if (boardFilter !== 'all') list = list.filter((t) => t.boardId === BOARDS.find((b) => b.category === boardFilter)?.id);
    if (statusFilter !== 'all') list = list.filter((t) => t.status === statusFilter);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((t) => t.title.toLowerCase().includes(q) || t.excerpt.toLowerCase().includes(q) || t.authorName.toLowerCase().includes(q));
    }
    list = [...list];
    if (sortBy === 'hot') list.sort((a, b) => (b.likes + b.views / 100) - (a.likes + a.views / 100));
    else if (sortBy === 'new') list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    else if (sortBy === 'replies') list.sort((a, b) => b.replies - a.replies);
    else if (sortBy === 'views') list.sort((a, b) => b.views - a.views);
    return list;
  }, [boardFilter, statusFilter, search, sortBy]);

  const filteredBoards = useMemo(() => {
    if (boardFilter === 'all') return BOARDS;
    return BOARDS.filter((b) => b.category === boardFilter);
  }, [boardFilter]);

  const filteredAnnouncements = useMemo(() => {
    if (announceCategoryFilter === 'all') return ANNOUNCEMENTS;
    return ANNOUNCEMENTS.filter((a) => a.category === announceCategoryFilter);
  }, [announceCategoryFilter]);

  const filteredVotes = useMemo(() => {
    if (voteStatusFilter === 'all') return VOTES;
    return VOTES.filter((v) => v.status === voteStatusFilter);
  }, [voteStatusFilter]);

  const filteredShop = useMemo(() => {
    if (shopCategoryFilter === 'all') return SHOP_ITEMS;
    return SHOP_ITEMS.filter((s) => s.category === shopCategoryFilter);
  }, [shopCategoryFilter]);

  // 当前用户
  const currentUser: UserProfile = USERS[0];

  // 交互处理
  const openTopic = (id: string) => setDrawer({ open: true, type: 'topic', payload: id });
  const openUser = (id: string) => setDrawer({ open: true, type: 'user', payload: id });
  const openCreate = () => setDrawer({ open: true, type: 'create', payload: 'new' });
  const openAnnouncement = (id: string) => setDrawer({ open: true, type: 'announcement', payload: id });
  const openVote = (id: string) => setDrawer({ open: true, type: 'vote', payload: id });
  const openShop = () => setDrawer({ open: true, type: 'shop', payload: 'list' });
  const closeDrawer = () => setDrawer({ open: false, type: null, payload: null });

  const handleLike = (id: string) => {
    // 模拟交互
  };
  const handleBookmark = (id: string) => {
    // 模拟交互
  };
  const handleFollow = (id: string) => {
    // 模拟交互
  };
  const handleJoinBoard = (id: string) => {
    // 模拟交互
  };
  const handleSubmitCreate = () => {
    if (!createTitle.trim()) return;
    closeDrawer();
    setCreateTitle('');
    setCreateContent('');
  };
  const handleSubmitReply = () => {
    if (!replyText.trim()) return;
    setReplyText('');
  };
  const handleSubmitVote = () => {
    if (!voteSelectedOption) return;
    closeDrawer();
    setVoteSelectedOption('');
  };
  const handleRedeem = (id: string) => {
    // 模拟兑换
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: BRAND.bg, color: BRAND.text }}>
      <style>{`
        @keyframes pc-fade-up { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pc-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.55; } }
        @keyframes pc-shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
        @keyframes pc-slide-in { from { transform: translateX(100%); } to { transform: translateX(0); } }
        @keyframes pc-bar { from { transform: scaleX(0); } to { transform: scaleX(1); } }
        @keyframes pc-float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
        @keyframes pc-glow { 0%, 100% { box-shadow: 0 0 0 0 rgba(20,184,129,0.4); } 50% { box-shadow: 0 0 24px 4px rgba(20,184,129,0.6); } }
        @keyframes pc-blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
        .pc-stagger > * { animation: pc-fade-up 0.4s ease-out both; }
        .pc-stagger > *:nth-child(1) { animation-delay: 0.04s; }
        .pc-stagger > *:nth-child(2) { animation-delay: 0.08s; }
        .pc-stagger > *:nth-child(3) { animation-delay: 0.12s; }
        .pc-stagger > *:nth-child(4) { animation-delay: 0.16s; }
        .pc-stagger > *:nth-child(5) { animation-delay: 0.20s; }
        .pc-stagger > *:nth-child(6) { animation-delay: 0.24s; }
        .pc-stagger > *:nth-child(7) { animation-delay: 0.28s; }
        .pc-stagger > *:nth-child(8) { animation-delay: 0.32s; }
        .pc-pulse { animation: pc-pulse 2.4s ease-in-out infinite; }
        .pc-float { animation: pc-float 3s ease-in-out infinite; }
        .pc-shimmer { background: linear-gradient(90deg, transparent, rgba(20,184,129,0.15), transparent); background-size: 200% 100%; animation: pc-shimmer 2.4s linear infinite; }
        .pc-drawer { animation: pc-slide-in 0.28s ease-out; }
        .pc-bar { transform-origin: left; animation: pc-bar 0.6s ease-out; }
        .pc-row:hover { background-color: ${BRAND.cardHover}; }
        .pc-glow { animation: pc-glow 2.4s ease-in-out infinite; }
        .pc-blink { animation: pc-blink 1.6s ease-in-out infinite; }
      `}</style>

      {/* Hero */}
      <div className="relative overflow-hidden" style={{ borderBottom: `1px solid ${BRAND.border}` }}>
        <div className="absolute inset-0 opacity-10" style={{ background: `radial-gradient(circle at 20% 50%, ${BRAND.primary}40, transparent 60%), radial-gradient(circle at 80% 50%, ${BRAND.info}30, transparent 60%)` }} />
        <div className="relative max-w-7xl mx-auto px-6 py-10">
          <div className="flex items-center gap-2 text-xs mb-3" style={{ color: BRAND.textSub }}>
            <span>社区中心</span>
            <ChevronRight size={12} />
            <span>论坛首页</span>
          </div>
          <div className="flex items-start justify-between gap-6 flex-wrap">
            <div className="flex-1 min-w-[320px]">
              <h1 className="text-3xl font-bold mb-2 flex items-center gap-3" style={{ color: BRAND.text }}>
                <Users className="pc-float" size={32} style={{ color: BRAND.primary }} />
                社区与论坛中心
              </h1>
              <p className="text-sm mb-4" style={{ color: BRAND.textSub }}>
                与 <strong style={{ color: BRAND.primary }}>{formatNumber(kpi.totalUsers)}</strong> 位社区成员共建 ZSDEX 内容生态
                · 当前在线 <strong style={{ color: BRAND.success }}>{formatNumber(kpi.onlineNow)}</strong> 人
                · 今日新增 <strong style={{ color: BRAND.primary }}>{formatNumber(kpi.todayPosts)}</strong> 帖
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 rounded-full text-xs flex items-center gap-1.5" style={{ backgroundColor: BRAND.primaryLt, color: BRAND.primary, border: `1px solid ${BRAND.primary}40` }}>
                  <Sparkles size={12} /> 用户共建
                </span>
                <span className="px-3 py-1 rounded-full text-xs flex items-center gap-1.5" style={{ backgroundColor: BRAND.successLt, color: BRAND.success, border: `1px solid ${BRAND.success}40` }}>
                  <Heart size={12} /> 内容生态
                </span>
                <span className="px-3 py-1 rounded-full text-xs flex items-center gap-1.5" style={{ backgroundColor: BRAND.infoLt, color: BRAND.info, border: `1px solid ${BRAND.info}40` }}>
                  <Vote size={12} /> 社区治理
                </span>
                <span className="px-3 py-1 rounded-full text-xs flex items-center gap-1.5" style={{ backgroundColor: BRAND.warningLt, color: BRAND.warning, border: `1px solid ${BRAND.warning}40` }}>
                  <Award size={12} /> 积分激励
                </span>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={openCreate} className="px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2" style={{ backgroundColor: BRAND.primary, color: '#000' }}>
                <Plus size={16} /> 发布内容
              </button>
              <button onClick={openShop} className="px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2" style={{ backgroundColor: BRAND.card, color: BRAND.text, border: `1px solid ${BRAND.border}` }}>
                <Award size={16} /> 积分商城
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        {/* KPI */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pc-stagger">
          {[
            { label: '社区用户', value: kpi.totalUsers, icon: <Users size={16} />, color: BRAND.primary },
            { label: '在线人数', value: kpi.onlineNow, icon: <Activity size={16} />, color: BRAND.success, suffix: '' },
            { label: '今日发帖', value: kpi.todayPosts, icon: <MessageSquare size={16} />, color: BRAND.info },
            { label: '活跃讨论', value: kpi.activeDiscussions, icon: <MessageCircle size={16} />, color: BRAND.amber },
            { label: '话题总数', value: kpi.totalTopics, icon: <Hash size={16} />, color: BRAND.primary },
            { label: '新增粉丝', value: kpi.newFollowers, icon: <UserPlus size={16} />, color: BRAND.success },
            { label: '积分池', value: kpi.rewardsPool, icon: <Coins size={16} />, color: BRAND.amber, prefix: '' },
            { label: '待审内容', value: kpi.pendingReviews, icon: <Flag size={16} />, color: BRAND.danger },
          ].map((c) => (
            <div key={c.label} className="p-4 rounded-xl" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs" style={{ color: BRAND.textSub }}>{c.label}</span>
                <span style={{ color: c.color }}>{c.icon}</span>
              </div>
              <div className="text-xl font-semibold" style={{ color: BRAND.text }}>
                {c.prefix || ''}{formatNumber(c.value)}{c.suffix || ''}
              </div>
            </div>
          ))}
        </div>

        {/* Search + Tabs */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[240px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: BRAND.textMute }} />
            <input
              ref={searchRef}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索话题 / 帖子 / 用户 / 标签..."
              className="w-full pl-9 pr-3 py-2 rounded-lg text-sm outline-none"
              style={{ backgroundColor: BRAND.card, color: BRAND.text, border: `1px solid ${BRAND.border}` }}
            />
          </div>
          <button onClick={() => setHelpOpen(true)} className="px-3 py-2 rounded-lg text-xs flex items-center gap-1.5" style={{ backgroundColor: BRAND.card, color: BRAND.textSub, border: `1px solid ${BRAND.border}` }}>
            <Keyboard size={14} /> 快捷键
          </button>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-2" style={{ borderBottom: `1px solid ${BRAND.border}` }}>
          {[
            { id: 'overview', label: '总览', icon: <Activity size={14} /> },
            { id: 'topics', label: '热门话题', icon: <Flame size={14} /> },
            { id: 'profile', label: '我的主页', icon: <User size={14} /> },
            { id: 'boards', label: '板块分类', icon: <Compass size={14} /> },
            { id: 'create', label: '创作中心', icon: <Edit3 size={14} /> },
            { id: 'announcement', label: '官方公告', icon: <Megaphone size={14} /> },
            { id: 'vote', label: '活动投票', icon: <Vote size={14} /> },
            { id: 'points', label: '积分奖励', icon: <Award size={14} /> },
            { id: 'help', label: '帮助', icon: <HelpCircle size={14} /> },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id as Tab)}
              className="px-3 py-2 rounded-t-lg text-xs font-medium flex items-center gap-1.5 whitespace-nowrap"
              style={{
                backgroundColor: tab === t.id ? BRAND.card : 'transparent',
                color: tab === t.id ? BRAND.primary : BRAND.textSub,
                borderBottom: tab === t.id ? `2px solid ${BRAND.primary}` : '2px solid transparent',
                marginBottom: '-1px',
              }}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* ============== Tab 内容 ============== */}

        {/* 总览 Tab */}
        {tab === 'overview' && (
          <div className="space-y-6 pc-stagger">
            {/* 热门话题 Top 5 */}
            <div className="p-5 rounded-xl" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold flex items-center gap-2" style={{ color: BRAND.text }}>
                  <Flame size={16} style={{ color: BRAND.danger }} /> 今日热门 Top 5
                </h2>
                <button onClick={() => setTab('topics')} className="text-xs flex items-center gap-1" style={{ color: BRAND.primary }}>
                  查看全部 <ArrowRight size={12} />
                </button>
              </div>
              <div className="space-y-2">
                {TOPICS.filter((t) => t.hot).slice(0, 5).map((t, i) => (
                  <div key={t.id} onClick={() => openTopic(t.id)} className="p-3 rounded-lg pc-row cursor-pointer flex items-center gap-3" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}>
                    <div className="text-2xl font-bold w-8 text-center" style={{ color: i < 3 ? BRAND.danger : BRAND.textMute }}>{i + 1}</div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate" style={{ color: BRAND.text }}>{t.title}</div>
                      <div className="text-[10px] mt-0.5 flex items-center gap-2 flex-wrap" style={{ color: BRAND.textSub }}>
                        <span>{t.boardName}</span>
                        <span>·</span>
                        <span>{t.authorName}</span>
                        <span>·</span>
                        <span><Eye size={10} className="inline" /> {formatNumber(t.views)}</span>
                        <span><MessageCircle size={10} className="inline" /> {formatNumber(t.replies)}</span>
                        <span><Heart size={10} className="inline" /> {formatNumber(t.likes)}</span>
                      </div>
                    </div>
                    <ChevronRight size={14} style={{ color: BRAND.textMute }} />
                  </div>
                ))}
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              {/* 板块速览 */}
              <div className="md:col-span-2 p-5 rounded-xl" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-base font-semibold flex items-center gap-2" style={{ color: BRAND.text }}>
                    <Compass size={16} style={{ color: BRAND.primary }} /> 板块速览
                  </h2>
                  <button onClick={() => setTab('boards')} className="text-xs flex items-center gap-1" style={{ color: BRAND.primary }}>
                    全部板块 <ArrowRight size={12} />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {BOARDS.slice(0, 6).map((b) => (
                    <div key={b.id} className="p-3 rounded-lg pc-row cursor-pointer" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xl">{b.icon}</span>
                        <span className="text-sm font-medium truncate" style={{ color: BRAND.text }}>{b.name}</span>
                      </div>
                      <div className="text-[10px] flex items-center gap-2" style={{ color: BRAND.textSub }}>
                        <span>📝 {formatNumber(b.topics)}</span>
                        <span>👥 {formatNumber(b.members)}</span>
                        <span className="pc-pulse" style={{ color: BRAND.success }}>● {b.activeNow}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 活跃用户榜 */}
              <div className="p-5 rounded-xl" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
                <h2 className="text-base font-semibold mb-4 flex items-center gap-2" style={{ color: BRAND.text }}>
                  <Crown size={16} style={{ color: BRAND.amber }} /> 活跃用户榜
                </h2>
                <div className="space-y-2">
                  {USERS.slice(0, 5).map((u, i) => (
                    <div key={u.id} onClick={() => openUser(u.id)} className="flex items-center gap-2 p-2 rounded-lg pc-row cursor-pointer">
                      <div className="text-xs font-bold w-5 text-center" style={{ color: i < 3 ? BRAND.amber : BRAND.textMute }}>{i + 1}</div>
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-base" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}>{u.avatar}</div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium truncate" style={{ color: BRAND.text }}>{u.name}</div>
                        <div className="text-[10px]" style={{ color: LEVEL_COLORS[u.level] }}>{LEVEL_LABELS[u.level]}</div>
                      </div>
                      <div className="text-[10px] text-right" style={{ color: BRAND.textSub }}>
                        <div>{formatNumber(u.points)}</div>
                        <div>积分</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 公告 + 投票速览 */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-5 rounded-xl" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
                <h2 className="text-base font-semibold mb-3 flex items-center gap-2" style={{ color: BRAND.text }}>
                  <Megaphone size={16} style={{ color: BRAND.warning }} /> 最新公告
                </h2>
                <div className="space-y-2">
                  {ANNOUNCEMENTS.slice(0, 3).map((a) => (
                    <div key={a.id} onClick={() => openAnnouncement(a.id)} className="p-2.5 rounded-lg pc-row cursor-pointer">
                      <div className="flex items-center gap-2 mb-1">
                        {a.pinned && <Pin size={11} style={{ color: BRAND.danger }} />}
                        <span className="text-xs font-medium truncate" style={{ color: BRAND.text }}>{a.title}</span>
                      </div>
                      <div className="text-[10px] flex items-center gap-2" style={{ color: BRAND.textSub }}>
                        <span>{a.author}</span>
                        <span>·</span>
                        <span>{a.publishedAt}</span>
                        <span>·</span>
                        <span><Eye size={10} className="inline" /> {formatNumber(a.views)}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <button onClick={() => setTab('announcement')} className="w-full mt-3 py-2 rounded-lg text-xs" style={{ backgroundColor: BRAND.bg, color: BRAND.primary, border: `1px solid ${BRAND.border}` }}>
                  查看全部公告
                </button>
              </div>

              <div className="p-5 rounded-xl" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
                <h2 className="text-base font-semibold mb-3 flex items-center gap-2" style={{ color: BRAND.text }}>
                  <Vote size={16} style={{ color: BRAND.primary }} /> 进行中投票
                </h2>
                <div className="space-y-2">
                  {VOTES.filter((v) => v.status === 'live').slice(0, 3).map((v) => (
                    <div key={v.id} onClick={() => openVote(v.id)} className="p-2.5 rounded-lg pc-row cursor-pointer">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium truncate" style={{ color: BRAND.text }}>{v.title}</span>
                      </div>
                      <div className="text-[10px] flex items-center gap-2" style={{ color: BRAND.textSub }}>
                        <span style={{ color: VOTE_STATUS_LABELS[v.status].color }}>● {VOTE_STATUS_LABELS[v.status].label}</span>
                        <span>·</span>
                        <span>{formatNumber(v.totalVotes)} 票</span>
                        <span>·</span>
                        <span>截止 {v.endTime}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <button onClick={() => setTab('vote')} className="w-full mt-3 py-2 rounded-lg text-xs" style={{ backgroundColor: BRAND.bg, color: BRAND.primary, border: `1px solid ${BRAND.border}` }}>
                  查看全部投票
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 热门话题 Tab */}
        {tab === 'topics' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 flex-wrap">
              <select value={boardFilter} onChange={(e) => setBoardFilter(e.target.value as BoardCategory | 'all')} className="px-3 py-1.5 rounded-lg text-xs outline-none" style={{ backgroundColor: BRAND.card, color: BRAND.text, border: `1px solid ${BRAND.border}` }}>
                <option value="all">全部分类</option>
                {Object.entries(BOARD_CATEGORY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as TopicStatus | 'all')} className="px-3 py-1.5 rounded-lg text-xs outline-none" style={{ backgroundColor: BRAND.card, color: BRAND.text, border: `1px solid ${BRAND.border}` }}>
                <option value="all">全部状态</option>
                {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
              <div className="flex items-center gap-1 ml-auto">
                {[
                  { id: 'hot', label: '热度' },
                  { id: 'new', label: '最新' },
                  { id: 'replies', label: '回复多' },
                  { id: 'views', label: '浏览多' },
                ].map((s) => (
                  <button key={s.id} onClick={() => setSortBy(s.id as 'hot' | 'new' | 'replies' | 'views')} className="px-2.5 py-1 rounded text-xs" style={{ backgroundColor: sortBy === s.id ? BRAND.primaryLt : BRAND.card, color: sortBy === s.id ? BRAND.primary : BRAND.textSub, border: `1px solid ${sortBy === s.id ? BRAND.primary : BRAND.border}` }}>
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              {filteredTopics.length === 0 && (
                <div className="p-10 text-center rounded-xl" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
                  <p style={{ color: BRAND.textSub }}>暂无符合条件的话题</p>
                </div>
              )}
              {filteredTopics.map((t) => {
                const status = STATUS_LABELS[t.status];
                return (
                  <div key={t.id} onClick={() => openTopic(t.id)} className="p-4 rounded-xl pc-row cursor-pointer" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-full flex items-center justify-center text-base shrink-0" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}>{t.authorAvatar}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          {t.pinned && <Pin size={12} style={{ color: BRAND.danger }} />}
                          <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: status.bg, color: status.color }}>{status.label}</span>
                          {t.hot && <Flame size={12} style={{ color: BRAND.danger }} />}
                          {t.isQuestion && <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: BRAND.infoLt, color: BRAND.info }}>提问</span>}
                          {t.isVideo && <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: BRAND.warningLt, color: BRAND.warning }}>视频</span>}
                        </div>
                        <h3 className="text-sm font-semibold mb-1" style={{ color: BRAND.text }}>{t.title}</h3>
                        <p className="text-xs mb-2 line-clamp-2" style={{ color: BRAND.textSub }}>{t.excerpt}</p>
                        <div className="flex items-center gap-2 flex-wrap text-[10px]" style={{ color: BRAND.textMute }}>
                          <span>{t.boardName}</span>
                          <span>·</span>
                          <span style={{ color: LEVEL_COLORS[t.authorLevel] }}>{t.authorName}</span>
                          <span>·</span>
                          <span><Eye size={10} className="inline" /> {formatNumber(t.views)}</span>
                          <span><MessageCircle size={10} className="inline" /> {formatNumber(t.replies)}</span>
                          <span><Heart size={10} className="inline" /> {formatNumber(t.likes)}</span>
                          <span><Bookmark size={10} className="inline" /> {formatNumber(t.bookmarks)}</span>
                          <span>·</span>
                          <span>最后回复 {t.lastReplyUser} · {t.lastReplyAt}</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-center gap-1 shrink-0">
                        <button onClick={(e) => { e.stopPropagation(); handleLike(t.id); }} className="p-1.5 rounded" style={{ color: t.liked ? BRAND.danger : BRAND.textSub, backgroundColor: t.liked ? BRAND.dangerLt : 'transparent' }}>
                          <Heart size={14} fill={t.liked ? 'currentColor' : 'none'} />
                        </button>
                        <span className="text-[10px]" style={{ color: BRAND.textMute }}>{formatNumber(t.likes)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 我的主页 Tab */}
        {tab === 'profile' && (
          <div className="space-y-4 pc-stagger">
            <div className="p-6 rounded-xl" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
              <div className="flex items-start gap-4 flex-wrap">
                <div className="w-20 h-20 rounded-full flex items-center justify-center text-4xl shrink-0" style={{ backgroundColor: BRAND.bg, border: `2px solid ${BRAND.primary}` }}>{currentUser.avatar}</div>
                <div className="flex-1 min-w-[240px]">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h2 className="text-xl font-semibold" style={{ color: BRAND.text }}>{currentUser.name}</h2>
                    {currentUser.verified && <CheckCircle2 size={16} style={{ color: BRAND.primary }} />}
                    <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ backgroundColor: BRAND.primaryLt, color: BRAND.primary, border: `1px solid ${BRAND.primary}40` }}>{ROLE_LABELS[currentUser.role]}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ backgroundColor: LEVEL_COLORS[currentUser.level] + '20', color: LEVEL_COLORS[currentUser.level] }}>{LEVEL_LABELS[currentUser.level]}</span>
                  </div>
                  <p className="text-xs mb-2" style={{ color: BRAND.textSub }}>{currentUser.bio}</p>
                  <p className="text-xs italic" style={{ color: BRAND.textMute }}>{currentUser.signature}</p>
                </div>
                <div className="flex gap-2">
                  <button className="px-3 py-2 rounded-lg text-xs flex items-center gap-1.5" style={{ backgroundColor: BRAND.primary, color: '#000' }}>
                    <Edit size={12} /> 编辑资料
                  </button>
                  <button className="px-3 py-2 rounded-lg text-xs flex items-center gap-1.5" style={{ backgroundColor: BRAND.card, color: BRAND.text, border: `1px solid ${BRAND.border}` }}>
                    <Share2 size={12} /> 分享
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mt-5 pt-5" style={{ borderTop: `1px solid ${BRAND.border}` }}>
                {[
                  { label: '粉丝', value: currentUser.followers, icon: <Users size={14} />, color: BRAND.primary },
                  { label: '关注', value: currentUser.following, icon: <UserCheck size={14} />, color: BRAND.success },
                  { label: '话题', value: currentUser.topics, icon: <Hash size={14} />, color: BRAND.info },
                  { label: '帖子', value: currentUser.posts, icon: <MessageSquare size={14} />, color: BRAND.amber },
                  { label: '获赞', value: currentUser.likes, icon: <Heart size={14} />, color: BRAND.danger },
                  { label: '积分', value: currentUser.points, icon: <Coins size={14} />, color: BRAND.primary },
                ].map((s) => (
                  <div key={s.label} className="text-center p-3 rounded-lg" style={{ backgroundColor: BRAND.bg }}>
                    <div className="flex items-center justify-center mb-1" style={{ color: s.color }}>{s.icon}</div>
                    <div className="text-lg font-semibold" style={{ color: BRAND.text }}>{formatNumber(s.value)}</div>
                    <div className="text-[10px]" style={{ color: BRAND.textSub }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div className="p-5 rounded-xl md:col-span-2" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
                <h3 className="text-sm font-semibold mb-3" style={{ color: BRAND.text }}>近 6 月贡献</h3>
                <div className="space-y-2">
                  {currentUser.contributionByMonth.map((m) => (
                    <div key={m.month} className="flex items-center gap-3">
                      <div className="w-16 text-xs" style={{ color: BRAND.textSub }}>{m.month}</div>
                      <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ backgroundColor: BRAND.bg }}>
                        <div className="h-full pc-bar" style={{ width: `${pctBar(m.posts, 100)}%`, backgroundColor: BRAND.primary }} />
                      </div>
                      <div className="w-12 text-right text-xs" style={{ color: BRAND.text }}>{m.posts} 帖</div>
                      <div className="w-12 text-right text-xs" style={{ color: BRAND.danger }}>{formatNumber(m.likes)} 赞</div>
                      <div className="w-16 text-right text-xs" style={{ color: BRAND.amber }}>{formatNumber(m.points)} 分</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-5 rounded-xl" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
                <h3 className="text-sm font-semibold mb-3" style={{ color: BRAND.text }}>成就徽章</h3>
                <div className="space-y-2">
                  {currentUser.achievements.map((a, i) => (
                    <div key={i} className="flex items-center gap-2 p-2 rounded-lg" style={{ backgroundColor: BRAND.bg }}>
                      <div className="text-2xl">{a.icon}</div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium" style={{ color: BRAND.text }}>{a.name}</div>
                        <div className="text-[10px]" style={{ color: BRAND.textSub }}>{a.desc}</div>
                      </div>
                      <div className="text-[10px]" style={{ color: BRAND.textMute }}>{a.date}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-5 rounded-xl" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
              <h3 className="text-sm font-semibold mb-3" style={{ color: BRAND.text }}>最近活动</h3>
              <div className="space-y-2">
                {currentUser.recentActivity.map((a, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs" style={{ color: BRAND.textSub }}>
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: BRAND.primary }} />
                    <span style={{ color: BRAND.text }}>{a.action}</span>
                    <span>{a.target}</span>
                    <span className="ml-auto" style={{ color: BRAND.textMute }}>{a.time}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 板块分类 Tab */}
        {tab === 'boards' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 flex-wrap">
              <button onClick={() => setBoardFilter('all')} className="px-3 py-1.5 rounded-lg text-xs" style={{ backgroundColor: boardFilter === 'all' ? BRAND.primaryLt : BRAND.card, color: boardFilter === 'all' ? BRAND.primary : BRAND.textSub, border: `1px solid ${boardFilter === 'all' ? BRAND.primary : BRAND.border}` }}>全部</button>
              {Object.entries(BOARD_CATEGORY_LABELS).map(([k, v]) => (
                <button key={k} onClick={() => setBoardFilter(k as BoardCategory)} className="px-3 py-1.5 rounded-lg text-xs" style={{ backgroundColor: boardFilter === k ? BRAND.primaryLt : BRAND.card, color: boardFilter === k ? BRAND.primary : BRAND.textSub, border: `1px solid ${boardFilter === k ? BRAND.primary : BRAND.border}` }}>
                  {v}
                </button>
              ))}
            </div>

            <div className="grid md:grid-cols-2 gap-3 pc-stagger">
              {filteredBoards.map((b) => (
                <div key={b.id} className="p-4 rounded-xl" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
                  <div className="flex items-start gap-3">
                    <div className="text-3xl">{b.icon}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="text-sm font-semibold" style={{ color: BRAND.text }}>{b.name}</h3>
                        {b.official && <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: BRAND.primaryLt, color: BRAND.primary }}>官方</span>}
                        {b.pinned && <Pin size={12} style={{ color: BRAND.danger }} />}
                      </div>
                      <p className="text-xs mb-2 line-clamp-2" style={{ color: BRAND.textSub }}>{b.desc}</p>
                      <div className="flex items-center gap-3 text-[10px] flex-wrap" style={{ color: BRAND.textMute }}>
                        <span>📝 {formatNumber(b.topics)} 话题</span>
                        <span>💬 {formatNumber(b.posts)} 帖</span>
                        <span>👥 {formatNumber(b.members)} 成员</span>
                        <span className="pc-pulse" style={{ color: BRAND.success }}>● {b.activeNow} 在线</span>
                      </div>
                      <div className="mt-2 flex items-center gap-1.5 text-[10px]" style={{ color: BRAND.textMute }}>
                        <Clock size={10} />
                        <span>最近发帖 {b.lastPostTime}</span>
                      </div>
                    </div>
                    <button onClick={() => handleJoinBoard(b.id)} className="px-3 py-1.5 rounded-lg text-xs shrink-0" style={{ backgroundColor: b.joined ? BRAND.card : BRAND.primary, color: b.joined ? BRAND.textSub : '#000', border: `1px solid ${b.joined ? BRAND.border : BRAND.primary}` }}>
                      {b.joined ? '已加入' : '+ 加入'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 创作中心 Tab */}
        {tab === 'create' && (
          <div className="space-y-4 pc-stagger">
            <div className="p-5 rounded-xl" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
              <h2 className="text-base font-semibold mb-3" style={{ color: BRAND.text }}>快速发布</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {(Object.keys(CREATE_TYPE_LABELS) as CreateType[]).map((t) => (
                  <button key={t} onClick={() => { setCreateType(t); openCreate(); }} className="p-4 rounded-lg text-left pc-row" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}>
                    <div className="text-2xl mb-1">
                      {t === 'post' && '📝'}
                      {t === 'article' && '📄'}
                      {t === 'question' && '❓'}
                      {t === 'tutorial' && '📚'}
                      {t === 'review' && '⭐'}
                      {t === 'video' && '🎬'}
                      {t === 'poll' && '📊'}
                    </div>
                    <div className="text-xs font-medium" style={{ color: BRAND.text }}>{CREATE_TYPE_LABELS[t]}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="p-5 rounded-xl" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
              <h2 className="text-base font-semibold mb-3" style={{ color: BRAND.text }}>我的创作</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: '已发布', value: 48, color: BRAND.primary },
                  { label: '草稿箱', value: 4, color: BRAND.textSub },
                  { label: '审核中', value: 2, color: BRAND.warning },
                  { label: '已退回', value: 1, color: BRAND.danger },
                ].map((s) => (
                  <div key={s.label} className="p-4 rounded-lg text-center" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}>
                    <div className="text-2xl font-semibold" style={{ color: s.color }}>{s.value}</div>
                    <div className="text-xs mt-1" style={{ color: BRAND.textSub }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-5 rounded-xl" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
              <h2 className="text-base font-semibold mb-3" style={{ color: BRAND.text }}>创作激励</h2>
              <div className="grid md:grid-cols-3 gap-3">
                {[
                  { name: '原创内容', desc: '发布原创文章可获双倍积分', reward: '2x 积分', icon: '✍️' },
                  { name: '优质回答', desc: '回答被采纳可获额外奖励', reward: '+200 积分', icon: '🎯' },
                  { name: '精选作品', desc: '内容被选入精选额外奖励', reward: '+500 积分', icon: '⭐' },
                ].map((c, i) => (
                  <div key={i} className="p-4 rounded-lg" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}>
                    <div className="text-2xl mb-2">{c.icon}</div>
                    <div className="text-sm font-medium mb-1" style={{ color: BRAND.text }}>{c.name}</div>
                    <div className="text-xs mb-2" style={{ color: BRAND.textSub }}>{c.desc}</div>
                    <div className="text-xs font-semibold" style={{ color: BRAND.primary }}>{c.reward}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 官方公告 Tab */}
        {tab === 'announcement' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 flex-wrap">
              <button onClick={() => setAnnounceCategoryFilter('all')} className="px-3 py-1.5 rounded-lg text-xs" style={{ backgroundColor: announceCategoryFilter === 'all' ? BRAND.primaryLt : BRAND.card, color: announceCategoryFilter === 'all' ? BRAND.primary : BRAND.textSub, border: `1px solid ${announceCategoryFilter === 'all' ? BRAND.primary : BRAND.border}` }}>全部</button>
              {[
                { v: 'system', l: '系统' },
                { v: 'event', l: '活动' },
                { v: 'listing', l: '上新' },
                { v: 'maintenance', l: '维护' },
                { v: 'security', l: '安全' },
                { v: 'policy', l: '政策' },
              ].map((c) => (
                <button key={c.v} onClick={() => setAnnounceCategoryFilter(c.v as AnnouncementItem['category'])} className="px-3 py-1.5 rounded-lg text-xs" style={{ backgroundColor: announceCategoryFilter === c.v ? BRAND.primaryLt : BRAND.card, color: announceCategoryFilter === c.v ? BRAND.primary : BRAND.textSub, border: `1px solid ${announceCategoryFilter === c.v ? BRAND.primary : BRAND.border}` }}>
                  {c.l}
                </button>
              ))}
            </div>

            <div className="space-y-2">
              {filteredAnnouncements.map((a) => {
                const priColor = a.priority === 'critical' ? BRAND.danger : a.priority === 'high' ? BRAND.warning : a.priority === 'medium' ? BRAND.info : BRAND.textSub;
                return (
                  <div key={a.id} onClick={() => openAnnouncement(a.id)} className="p-4 rounded-xl pc-row cursor-pointer" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
                    <div className="flex items-start gap-3">
                      <Megaphone size={16} style={{ color: priColor }} className="mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          {a.pinned && <Pin size={12} style={{ color: BRAND.danger }} />}
                          <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: priColor + '20', color: priColor }}>{a.priority.toUpperCase()}</span>
                          {!a.read && <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: BRAND.danger }} />}
                          <h3 className="text-sm font-semibold" style={{ color: BRAND.text }}>{a.title}</h3>
                        </div>
                        <p className="text-xs mb-2 line-clamp-2" style={{ color: BRAND.textSub }}>{a.excerpt}</p>
                        <div className="flex items-center gap-2 text-[10px]" style={{ color: BRAND.textMute }}>
                          <span>{a.author}</span>
                          <span>·</span>
                          <span>{a.publishedAt}</span>
                          <span>·</span>
                          <span><Eye size={10} className="inline" /> {formatNumber(a.views)}</span>
                          <span><MessageCircle size={10} className="inline" /> {formatNumber(a.comments)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 活动投票 Tab */}
        {tab === 'vote' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 flex-wrap">
              <button onClick={() => setVoteStatusFilter('all')} className="px-3 py-1.5 rounded-lg text-xs" style={{ backgroundColor: voteStatusFilter === 'all' ? BRAND.primaryLt : BRAND.card, color: voteStatusFilter === 'all' ? BRAND.primary : BRAND.textSub, border: `1px solid ${voteStatusFilter === 'all' ? BRAND.primary : BRAND.border}` }}>全部</button>
              {Object.entries(VOTE_STATUS_LABELS).map(([k, v]) => (
                <button key={k} onClick={() => setVoteStatusFilter(k as VoteStatus)} className="px-3 py-1.5 rounded-lg text-xs" style={{ backgroundColor: voteStatusFilter === k ? BRAND.primaryLt : BRAND.card, color: voteStatusFilter === k ? BRAND.primary : BRAND.textSub, border: `1px solid ${voteStatusFilter === k ? BRAND.primary : BRAND.border}` }}>
                  {v.label}
                </button>
              ))}
            </div>

            <div className="grid md:grid-cols-2 gap-4 pc-stagger">
              {filteredVotes.map((v) => {
                const status = VOTE_STATUS_LABELS[v.status];
                const total = v.options.reduce((s, o) => s + o.votes, 0) || 1;
                return (
                  <div key={v.id} onClick={() => openVote(v.id)} className="p-5 rounded-xl pc-row cursor-pointer" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: status.bg, color: status.color }}>{status.label}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: BRAND.cardHover, color: BRAND.textSub }}>{VOTE_TYPE_LABELS[v.type]}</span>
                      {v.isBinding && <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: BRAND.dangerLt, color: BRAND.danger }}>约束性</span>}
                      {v.participated && <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: BRAND.successLt, color: BRAND.success }}>已参与</span>}
                    </div>
                    <h3 className="text-sm font-semibold mb-1" style={{ color: BRAND.text }}>{v.title}</h3>
                    <p className="text-xs mb-3 line-clamp-2" style={{ color: BRAND.textSub }}>{v.desc}</p>
                    <div className="space-y-1.5 mb-3">
                      {v.options.slice(0, 3).map((o) => (
                        <div key={o.id}>
                          <div className="flex items-center justify-between text-[10px] mb-0.5">
                            <span style={{ color: BRAND.text }}>{o.text}</span>
                            <span style={{ color: BRAND.textSub }}>{((o.votes / total) * 100).toFixed(1)}%</span>
                          </div>
                          <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: BRAND.bg }}>
                            <div className="h-full pc-bar" style={{ width: `${(o.votes / total) * 100}%`, backgroundColor: o.color }} />
                          </div>
                        </div>
                      ))}
                      {v.options.length > 3 && <div className="text-[10px] text-center" style={{ color: BRAND.textMute }}>+{v.options.length - 3} 个选项</div>}
                    </div>
                    <div className="flex items-center gap-3 text-[10px] pt-3" style={{ borderTop: `1px solid ${BRAND.border}`, color: BRAND.textMute }}>
                      <span><Users size={10} className="inline" /> {formatNumber(v.totalVotes)} / {formatNumber(v.eligibleVoters)} 票</span>
                      <span>截止 {v.endTime}</span>
                      <span>奖励 {v.rewards} 积分</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 积分奖励 Tab */}
        {tab === 'points' && (
          <div className="space-y-4">
            <div className="p-5 rounded-xl" style={{ background: `linear-gradient(135deg, ${BRAND.primaryLt} 0%, ${BRAND.infoLt} 100%)`, border: `1px solid ${BRAND.primary}40` }}>
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <h2 className="text-sm mb-1" style={{ color: BRAND.textSub }}>我的积分</h2>
                  <div className="text-3xl font-bold" style={{ color: BRAND.primary }}>{formatNumber(currentUser.points)}</div>
                  <div className="text-xs mt-1" style={{ color: BRAND.textSub }}>≈ ≈ {Math.floor(currentUser.points / 100)} USDT 等值权益</div>
                </div>
                <div className="flex gap-2">
                  <button className="px-4 py-2 rounded-lg text-xs flex items-center gap-1.5" style={{ backgroundColor: BRAND.primary, color: '#000' }}>
                    <ArrowUpRight size={12} /> 赚积分
                  </button>
                  <button onClick={openShop} className="px-4 py-2 rounded-lg text-xs flex items-center gap-1.5" style={{ backgroundColor: BRAND.card, color: BRAND.text, border: `1px solid ${BRAND.border}` }}>
                    <ShoppingCart size={12} /> 积分商城
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button onClick={() => setShopCategoryFilter('all')} className="px-3 py-1.5 rounded-lg text-xs" style={{ backgroundColor: shopCategoryFilter === 'all' ? BRAND.primaryLt : BRAND.card, color: shopCategoryFilter === 'all' ? BRAND.primary : BRAND.textSub, border: `1px solid ${shopCategoryFilter === 'all' ? BRAND.primary : BRAND.border}` }}>全部</button>
              {Object.entries(SHOP_CATEGORY_LABELS).map(([k, v]) => (
                <button key={k} onClick={() => setShopCategoryFilter(k as PointsShopItem['category'])} className="px-3 py-1.5 rounded-lg text-xs" style={{ backgroundColor: shopCategoryFilter === k ? BRAND.primaryLt : BRAND.card, color: shopCategoryFilter === k ? BRAND.primary : BRAND.textSub, border: `1px solid ${shopCategoryFilter === k ? BRAND.primary : BRAND.border}` }}>
                  {v}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 pc-stagger">
              {filteredShop.map((s) => (
                <div key={s.id} className="p-4 rounded-xl flex flex-col" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}`, opacity: s.status === 'soldout' ? 0.5 : 1 }}>
                  <div className="relative aspect-square mb-3 flex items-center justify-center text-5xl rounded-lg" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}>
                    {s.image}
                    {s.hot && <span className="absolute top-1.5 right-1.5 text-[9px] px-1.5 py-0.5 rounded-full" style={{ backgroundColor: BRAND.danger, color: '#fff' }}>HOT</span>}
                    {s.badge && <span className="absolute top-1.5 left-1.5 text-[9px] px-1.5 py-0.5 rounded-full" style={{ backgroundColor: BRAND.primary, color: '#000' }}>{s.badge}</span>}
                  </div>
                  <h3 className="text-sm font-medium mb-1 line-clamp-1" style={{ color: BRAND.text }}>{s.name}</h3>
                  <p className="text-[10px] mb-2 line-clamp-2" style={{ color: BRAND.textSub }}>{s.desc}</p>
                  <div className="mt-auto flex items-center justify-between">
                    <div>
                      <div className="text-sm font-semibold" style={{ color: BRAND.primary }}>{s.cost} 积分</div>
                      {s.originalPrice && <div className="text-[10px] line-through" style={{ color: BRAND.textMute }}>{s.originalPrice}</div>}
                    </div>
                    <button onClick={() => handleRedeem(s.id)} disabled={s.status === 'soldout' || s.status === 'coming'} className="px-2.5 py-1 rounded text-[10px]" style={{ backgroundColor: s.status === 'available' || s.status === 'limited' ? BRAND.primary : BRAND.card, color: s.status === 'available' || s.status === 'limited' ? '#000' : BRAND.textMute, border: `1px solid ${s.status === 'available' || s.status === 'limited' ? BRAND.primary : BRAND.border}`, cursor: s.status === 'soldout' || s.status === 'coming' ? 'not-allowed' : 'pointer' }}>
                      {s.status === 'soldout' ? '已售罄' : s.status === 'coming' ? '敬请期待' : '兑换'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 帮助 Tab */}
        {tab === 'help' && (
          <div className="space-y-4 pc-stagger">
            <div className="p-5 rounded-xl" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
              <h2 className="text-base font-semibold mb-3 flex items-center gap-2" style={{ color: BRAND.text }}>
                <HelpCircle size={16} style={{ color: BRAND.primary }} /> 常见问题
              </h2>
              <div className="space-y-3">
                {[
                  { q: '如何提高我的社区等级？', a: '持续发布优质内容、积极互动、获得点赞收藏、参与投票与活动，都能快速提升等级。' },
                  { q: '积分有什么用途？', a: '积分可在积分商城兑换 VIP 会员、专属徽章、手续费券、新功能体验、限量周边等。' },
                  { q: '如何成为 KOL 认证用户？', a: '持续发布高质量原创内容、获得大量粉丝与互动、申请 KOL 认证并通过平台审核。' },
                  { q: '社区治理投票有什么权重？', a: '根据账户等级、积分、贡献度综合计算投票权重，详细规则见社区治理白皮书。' },
                  { q: '违规内容如何处理？', a: '违反社区规范的内容将被警告、隐藏、删除，情节严重者将被禁言或封禁。' },
                ].map((qa, i) => (
                  <details key={i} className="p-3 rounded-lg" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}>
                    <summary className="cursor-pointer text-sm font-medium" style={{ color: BRAND.text }}>{qa.q}</summary>
                    <p className="text-xs mt-2" style={{ color: BRAND.textSub }}>{qa.a}</p>
                  </details>
                ))}
              </div>
            </div>

            <div className="p-4 rounded-xl" style={{ backgroundColor: BRAND.primaryLt, border: `1px solid ${BRAND.primary}40` }}>
              <p className="text-[11px]" style={{ color: BRAND.primary }}>
                <strong>合规说明：</strong>本平台社区中心为"用户共建与内容生态研究方向"演示页面。社区内任何"承诺收益 / 保本 / 刚兑 / 稳赚"等表述均为违规内容，发现请立即举报。所有积分、徽章、虚拟权益仅用于社区激励，不构成任何投资或服务承诺。
              </p>
            </div>
          </div>
        )}

        {/* 底部 CTA */}
        <div className="p-6 rounded-xl text-center" style={{ background: `linear-gradient(135deg, ${BRAND.primaryLt} 0%, ${BRAND.infoLt} 100%)`, border: `1px solid ${BRAND.primary}40` }}>
          <h2 className="text-lg font-semibold mb-2" style={{ color: BRAND.text }}>加入 ZSDEX 社区，共建内容生态</h2>
          <p className="text-sm mb-4" style={{ color: BRAND.textSub }}>与 {formatNumber(kpi.totalUsers)} 位成员一起探索、分享、创造</p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <button onClick={openCreate} className="px-5 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2" style={{ backgroundColor: BRAND.primary, color: '#000' }}>
              <Edit3 size={14} /> 立即创作
            </button>
            <button className="px-5 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2" style={{ backgroundColor: BRAND.card, color: BRAND.text, border: `1px solid ${BRAND.border}` }}>
              <UserPlus size={14} /> 邀请好友
            </button>
          </div>
        </div>
      </div>

      {/* ============== Drawer ============== */}

      {/* 话题详情 Drawer */}
      {drawer.open && drawer.type === 'topic' && (() => {
        const t = TOPICS.find((x) => x.id === drawer.payload);
        if (!t) return null;
        return (
          <div className="fixed inset-0 z-50 flex justify-end" style={{ backgroundColor: BRAND.overlay }} onClick={closeDrawer}>
            <div className="w-full max-w-2xl h-full overflow-y-auto pc-drawer" style={{ backgroundColor: BRAND.bg, borderLeft: `1px solid ${BRAND.border}` }} onClick={(e) => e.stopPropagation()}>
              <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4" style={{ backgroundColor: BRAND.bg, borderBottom: `1px solid ${BRAND.border}` }}>
                <h3 className="text-base font-semibold flex items-center gap-2" style={{ color: BRAND.text }}>
                  <MessageSquare size={16} style={{ color: BRAND.primary }} /> 话题详情
                </h3>
                <button onClick={closeDrawer} className="p-1.5 rounded" style={{ color: BRAND.textSub }}><X size={18} /></button>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex items-center gap-2 flex-wrap text-[10px]">
                  <span className="px-2 py-0.5 rounded" style={{ backgroundColor: STATUS_LABELS[t.status].bg, color: STATUS_LABELS[t.status].color }}>{STATUS_LABELS[t.status].label}</span>
                  <span style={{ color: BRAND.textSub }}>·</span>
                  <span style={{ color: BRAND.textSub }}>{t.boardName}</span>
                </div>
                <h2 className="text-xl font-bold" style={{ color: BRAND.text }}>{t.title}</h2>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-xl" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>{t.authorAvatar}</div>
                  <div>
                    <div className="text-sm font-medium" style={{ color: LEVEL_COLORS[t.authorLevel] }}>{t.authorName}</div>
                    <div className="text-[10px]" style={{ color: BRAND.textSub }}>{LEVEL_LABELS[t.authorLevel]} · {ROLE_LABELS[t.authorRole]} · {t.createdAt}</div>
                  </div>
                  <button className="ml-auto px-3 py-1.5 rounded-lg text-xs flex items-center gap-1" style={{ backgroundColor: BRAND.primary, color: '#000' }}>
                    <UserPlus size={12} /> 关注
                  </button>
                </div>
                <p className="text-sm leading-relaxed" style={{ color: BRAND.textSub }}>{t.excerpt}</p>
                <p className="text-sm leading-relaxed" style={{ color: BRAND.textSub }}>{t.content}</p>
                <div className="flex items-center gap-3 flex-wrap">
                  {t.tags.map((tg) => (
                    <span key={tg} className="text-[10px] px-2 py-0.5 rounded-full" style={{ backgroundColor: BRAND.card, color: BRAND.primary, border: `1px solid ${BRAND.primary}40` }}>#{tg}</span>
                  ))}
                </div>
                <div className="grid grid-cols-4 gap-2 p-3 rounded-lg" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
                  <button onClick={() => handleLike(t.id)} className="flex flex-col items-center gap-1 py-2 rounded pc-row" style={{ color: t.liked ? BRAND.danger : BRAND.textSub }}>
                    <Heart size={16} fill={t.liked ? 'currentColor' : 'none'} />
                    <span className="text-[10px]">{formatNumber(t.likes)}</span>
                  </button>
                  <button onClick={() => handleBookmark(t.id)} className="flex flex-col items-center gap-1 py-2 rounded pc-row" style={{ color: t.bookmarked ? BRAND.amber : BRAND.textSub }}>
                    <Bookmark size={16} fill={t.bookmarked ? 'currentColor' : 'none'} />
                    <span className="text-[10px]">{formatNumber(t.bookmarks)}</span>
                  </button>
                  <button className="flex flex-col items-center gap-1 py-2 rounded pc-row" style={{ color: BRAND.textSub }}>
                    <Share2 size={16} />
                    <span className="text-[10px]">{formatNumber(t.shares)}</span>
                  </button>
                  <button className="flex flex-col items-center gap-1 py-2 rounded pc-row" style={{ color: BRAND.textSub }}>
                    <Flag size={16} />
                    <span className="text-[10px]">举报</span>
                  </button>
                </div>
                <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
                  <div className="text-xs mb-2 font-medium" style={{ color: BRAND.text }}>回复 · {formatNumber(t.replies)}</div>
                  <textarea value={replyText} onChange={(e) => setReplyText(e.target.value)} placeholder="写下你的回复..." rows={3} className="w-full px-3 py-2 rounded text-sm outline-none" style={{ backgroundColor: BRAND.bg, color: BRAND.text, border: `1px solid ${BRAND.border}` }} />
                  <div className="flex items-center justify-end gap-2 mt-2">
                    <button onClick={() => setReplyText('')} className="px-3 py-1.5 rounded text-xs" style={{ backgroundColor: BRAND.card, color: BRAND.textSub, border: `1px solid ${BRAND.border}` }}>清空</button>
                    <button onClick={handleSubmitReply} disabled={!replyText.trim()} className="px-3 py-1.5 rounded text-xs" style={{ backgroundColor: replyText.trim() ? BRAND.primary : BRAND.cardHover, color: replyText.trim() ? '#000' : BRAND.textMute, border: `1px solid ${replyText.trim() ? BRAND.primary : BRAND.border}` }}>发送</button>
                  </div>
                </div>
                <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.primaryLt, border: `1px solid ${BRAND.primary}40` }}>
                  <p className="text-[11px]" style={{ color: BRAND.primary }}>
                    <strong>社区规范：</strong>请文明发言，禁止人身攻击、谣言传播、虚假宣传、承诺收益等违规内容。违规将被警告、隐藏、删除，情节严重者将被禁言或封禁。
                  </p>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* 用户主页 Drawer */}
      {drawer.open && drawer.type === 'user' && (() => {
        const u = USERS.find((x) => x.id === drawer.payload);
        if (!u) return null;
        return (
          <div className="fixed inset-0 z-50 flex justify-end" style={{ backgroundColor: BRAND.overlay }} onClick={closeDrawer}>
            <div className="w-full max-w-xl h-full overflow-y-auto pc-drawer" style={{ backgroundColor: BRAND.bg, borderLeft: `1px solid ${BRAND.border}` }} onClick={(e) => e.stopPropagation()}>
              <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4" style={{ backgroundColor: BRAND.bg, borderBottom: `1px solid ${BRAND.border}` }}>
                <h3 className="text-base font-semibold flex items-center gap-2" style={{ color: BRAND.text }}>
                  <User size={16} style={{ color: BRAND.primary }} /> 用户主页
                </h3>
                <button onClick={closeDrawer} className="p-1.5 rounded" style={{ color: BRAND.textSub }}><X size={18} /></button>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-20 h-20 rounded-full flex items-center justify-center text-4xl shrink-0" style={{ backgroundColor: BRAND.card, border: `2px solid ${LEVEL_COLORS[u.level]}` }}>{u.avatar}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h2 className="text-lg font-semibold" style={{ color: BRAND.text }}>{u.name}</h2>
                      {u.verified && <CheckCircle2 size={14} style={{ color: BRAND.primary }} />}
                      <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ backgroundColor: BRAND.primaryLt, color: BRAND.primary }}>{ROLE_LABELS[u.role]}</span>
                    </div>
                    <p className="text-xs mb-1" style={{ color: BRAND.textSub }}>{u.bio}</p>
                    <p className="text-xs italic" style={{ color: BRAND.textMute }}>{u.signature}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleFollow(u.id)} className="flex-1 py-2 rounded-lg text-sm font-medium" style={{ backgroundColor: BRAND.primary, color: '#000' }}>
                    {u.id === 'u-001' ? '已关注' : '+ 关注'}
                  </button>
                  <button className="flex-1 py-2 rounded-lg text-sm" style={{ backgroundColor: BRAND.card, color: BRAND.text, border: `1px solid ${BRAND.border}` }}>
                    <MessageCircle size={12} className="inline mr-1" /> 私信
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: '粉丝', value: u.followers, icon: <Users size={14} /> },
                    { label: '获赞', value: u.likes, icon: <Heart size={14} /> },
                    { label: '积分', value: u.points, icon: <Coins size={14} /> },
                  ].map((s) => (
                    <div key={s.label} className="p-3 rounded-lg text-center" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
                      <div className="flex items-center justify-center mb-1" style={{ color: BRAND.primary }}>{s.icon}</div>
                      <div className="text-base font-semibold" style={{ color: BRAND.text }}>{formatNumber(s.value)}</div>
                      <div className="text-[10px]" style={{ color: BRAND.textSub }}>{s.label}</div>
                    </div>
                  ))}
                </div>
                <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
                  <h3 className="text-xs font-semibold mb-2" style={{ color: BRAND.text }}>专长领域</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {u.expertise.map((e) => (
                      <span key={e} className="text-[10px] px-2 py-0.5 rounded-full" style={{ backgroundColor: BRAND.primaryLt, color: BRAND.primary, border: `1px solid ${BRAND.primary}40` }}>{e}</span>
                    ))}
                  </div>
                </div>
                <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
                  <h3 className="text-xs font-semibold mb-2" style={{ color: BRAND.text }}>成就</h3>
                  <div className="space-y-1.5">
                    {u.achievements.map((a, i) => (
                      <div key={i} className="flex items-center gap-2 p-1.5 rounded" style={{ backgroundColor: BRAND.bg }}>
                        <div className="text-xl">{a.icon}</div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-medium" style={{ color: BRAND.text }}>{a.name}</div>
                          <div className="text-[10px]" style={{ color: BRAND.textSub }}>{a.desc}</div>
                        </div>
                        <div className="text-[10px]" style={{ color: BRAND.textMute }}>{a.date}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* 创作向导 Drawer */}
      {drawer.open && drawer.type === 'create' && (
        <div className="fixed inset-0 z-50 flex justify-end" style={{ backgroundColor: BRAND.overlay }} onClick={closeDrawer}>
          <div className="w-full max-w-2xl h-full overflow-y-auto pc-drawer" style={{ backgroundColor: BRAND.bg, borderLeft: `1px solid ${BRAND.border}` }} onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4" style={{ backgroundColor: BRAND.bg, borderBottom: `1px solid ${BRAND.border}` }}>
              <h3 className="text-base font-semibold flex items-center gap-2" style={{ color: BRAND.text }}>
                <Edit3 size={16} style={{ color: BRAND.primary }} /> 发布 {CREATE_TYPE_LABELS[createType]}
              </h3>
              <button onClick={closeDrawer} className="p-1.5 rounded" style={{ color: BRAND.textSub }}><X size={18} /></button>
            </div>
            <div className="p-6 space-y-3">
              <div>
                <label className="text-xs" style={{ color: BRAND.textSub }}>内容类型</label>
                <div className="grid grid-cols-4 gap-1.5 mt-1">
                  {(Object.keys(CREATE_TYPE_LABELS) as CreateType[]).map((t) => (
                    <button key={t} onClick={() => setCreateType(t)} className="px-2 py-2 rounded text-[10px]" style={{ backgroundColor: createType === t ? BRAND.primaryLt : BRAND.card, color: createType === t ? BRAND.primary : BRAND.textSub, border: `1px solid ${createType === t ? BRAND.primary : BRAND.border}` }}>
                      {CREATE_TYPE_LABELS[t]}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs" style={{ color: BRAND.textSub }}>目标板块</label>
                <select value={createBoard} onChange={(e) => setCreateBoard(e.target.value)} className="w-full px-3 py-2 rounded text-sm outline-none mt-1" style={{ backgroundColor: BRAND.card, color: BRAND.text, border: `1px solid ${BRAND.border}` }}>
                  {BOARDS.map((b) => <option key={b.id} value={b.id}>{b.icon} {b.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs" style={{ color: BRAND.textSub }}>标题</label>
                <input value={createTitle} onChange={(e) => setCreateTitle(e.target.value)} placeholder="一句话概括你的内容..." className="w-full px-3 py-2 rounded text-sm outline-none mt-1" style={{ backgroundColor: BRAND.card, color: BRAND.text, border: `1px solid ${BRAND.border}` }} />
              </div>
              <div>
                <label className="text-xs" style={{ color: BRAND.textSub }}>正文</label>
                <textarea value={createContent} onChange={(e) => setCreateContent(e.target.value)} placeholder="详细描述你的内容..." rows={8} className="w-full px-3 py-2 rounded text-sm outline-none mt-1" style={{ backgroundColor: BRAND.card, color: BRAND.text, border: `1px solid ${BRAND.border}` }} />
              </div>
              <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
                <div className="text-xs mb-2" style={{ color: BRAND.textSub }}>附加操作</div>
                <div className="flex flex-wrap gap-2">
                  <button className="px-3 py-1.5 rounded text-[10px] flex items-center gap-1" style={{ backgroundColor: BRAND.bg, color: BRAND.textSub, border: `1px solid ${BRAND.border}` }}>
                    <ImagePlus size={12} /> 添加图片
                  </button>
                  <button className="px-3 py-1.5 rounded text-[10px] flex items-center gap-1" style={{ backgroundColor: BRAND.bg, color: BRAND.textSub, border: `1px solid ${BRAND.border}` }}>
                    <Paperclip size={12} /> 附件
                  </button>
                  <button className="px-3 py-1.5 rounded text-[10px] flex items-center gap-1" style={{ backgroundColor: BRAND.bg, color: BRAND.textSub, border: `1px solid ${BRAND.border}` }}>
                    <Tag size={12} /> 标签
                  </button>
                  <button className="px-3 py-1.5 rounded text-[10px] flex items-center gap-1" style={{ backgroundColor: BRAND.bg, color: BRAND.textSub, border: `1px solid ${BRAND.border}` }}>
                    <AtSign size={12} /> @
                  </button>
                </div>
              </div>
              <div className="p-3 rounded-lg text-[10px]" style={{ backgroundColor: BRAND.primaryLt, color: BRAND.primary, border: `1px solid ${BRAND.primary}40` }}>
                · 发布后可在"我的主页"查看状态 · 优质内容可获双倍积分
              </div>
              <div className="flex gap-2">
                <button onClick={closeDrawer} className="flex-1 py-2.5 rounded-lg text-sm" style={{ backgroundColor: BRAND.card, color: BRAND.textSub, border: `1px solid ${BRAND.border}` }}>取消</button>
                <button onClick={handleSubmitCreate} disabled={!createTitle.trim()} className="flex-1 py-2.5 rounded-lg text-sm font-medium" style={{ backgroundColor: createTitle.trim() ? BRAND.primary : BRAND.cardHover, color: createTitle.trim() ? '#000' : BRAND.textMute, border: `1px solid ${createTitle.trim() ? BRAND.primary : BRAND.border}` }}>发布</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 公告详情 Drawer */}
      {drawer.open && drawer.type === 'announcement' && (() => {
        const a = ANNOUNCEMENTS.find((x) => x.id === drawer.payload);
        if (!a) return null;
        return (
          <div className="fixed inset-0 z-50 flex justify-end" style={{ backgroundColor: BRAND.overlay }} onClick={closeDrawer}>
            <div className="w-full max-w-2xl h-full overflow-y-auto pc-drawer" style={{ backgroundColor: BRAND.bg, borderLeft: `1px solid ${BRAND.border}` }} onClick={(e) => e.stopPropagation()}>
              <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4" style={{ backgroundColor: BRAND.bg, borderBottom: `1px solid ${BRAND.border}` }}>
                <h3 className="text-base font-semibold flex items-center gap-2" style={{ color: BRAND.text }}>
                  <Megaphone size={16} style={{ color: BRAND.warning }} /> 公告详情
                </h3>
                <button onClick={closeDrawer} className="p-1.5 rounded" style={{ color: BRAND.textSub }}><X size={18} /></button>
              </div>
              <div className="p-6 space-y-3">
                <div className="flex items-center gap-2 flex-wrap text-[10px]">
                  {a.pinned && <Pin size={12} style={{ color: BRAND.danger }} />}
                  <span className="px-2 py-0.5 rounded" style={{ backgroundColor: BRAND.warningLt, color: BRAND.warning }}>{a.priority.toUpperCase()}</span>
                  <span style={{ color: BRAND.textSub }}>· {a.author}</span>
                  <span style={{ color: BRAND.textSub }}>· {a.publishedAt}</span>
                </div>
                <h2 className="text-xl font-bold" style={{ color: BRAND.text }}>{a.title}</h2>
                <p className="text-sm leading-relaxed" style={{ color: BRAND.textSub }}>{a.excerpt}</p>
                <p className="text-sm leading-relaxed" style={{ color: BRAND.textSub }}>{a.content}</p>
                <div className="flex flex-wrap gap-1.5">
                  {a.tags.map((tg) => (
                    <span key={tg} className="text-[10px] px-2 py-0.5 rounded-full" style={{ backgroundColor: BRAND.card, color: BRAND.primary, border: `1px solid ${BRAND.primary}40` }}>#{tg}</span>
                  ))}
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: '阅读', value: a.views },
                    { label: '评论', value: a.comments },
                    { label: '附件', value: a.attachments },
                  ].map((s) => (
                    <div key={s.label} className="p-2 rounded text-center" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
                      <div className="text-sm font-semibold" style={{ color: BRAND.text }}>{formatNumber(s.value)}</div>
                      <div className="text-[10px]" style={{ color: BRAND.textSub }}>{s.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* 投票详情 Drawer */}
      {drawer.open && drawer.type === 'vote' && (() => {
        const v = VOTES.find((x) => x.id === drawer.payload);
        if (!v) return null;
        const total = v.options.reduce((s, o) => s + o.votes, 0) || 1;
        const status = VOTE_STATUS_LABELS[v.status];
        return (
          <div className="fixed inset-0 z-50 flex justify-end" style={{ backgroundColor: BRAND.overlay }} onClick={closeDrawer}>
            <div className="w-full max-w-xl h-full overflow-y-auto pc-drawer" style={{ backgroundColor: BRAND.bg, borderLeft: `1px solid ${BRAND.border}` }} onClick={(e) => e.stopPropagation()}>
              <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4" style={{ backgroundColor: BRAND.bg, borderBottom: `1px solid ${BRAND.border}` }}>
                <h3 className="text-base font-semibold flex items-center gap-2" style={{ color: BRAND.text }}>
                  <Vote size={16} style={{ color: BRAND.primary }} /> 投票详情
                </h3>
                <button onClick={closeDrawer} className="p-1.5 rounded" style={{ color: BRAND.textSub }}><X size={18} /></button>
              </div>
              <div className="p-6 space-y-3">
                <div className="flex items-center gap-2 flex-wrap text-[10px]">
                  <span className="px-2 py-0.5 rounded" style={{ backgroundColor: status.bg, color: status.color }}>{status.label}</span>
                  <span className="px-2 py-0.5 rounded" style={{ backgroundColor: BRAND.cardHover, color: BRAND.textSub }}>{VOTE_TYPE_LABELS[v.type]}</span>
                  {v.isBinding && <span className="px-2 py-0.5 rounded" style={{ backgroundColor: BRAND.dangerLt, color: BRAND.danger }}>约束性</span>}
                </div>
                <h2 className="text-lg font-bold" style={{ color: BRAND.text }}>{v.title}</h2>
                <p className="text-sm" style={{ color: BRAND.textSub }}>{v.desc}</p>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2 rounded" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
                    <div className="text-base font-semibold" style={{ color: BRAND.primary }}>{formatNumber(v.totalVotes)}</div>
                    <div className="text-[10px]" style={{ color: BRAND.textSub }}>已投票</div>
                  </div>
                  <div className="p-2 rounded" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
                    <div className="text-base font-semibold" style={{ color: BRAND.success }}>{((v.totalVotes / v.eligibleVoters) * 100).toFixed(1)}%</div>
                    <div className="text-[10px]" style={{ color: BRAND.textSub }}>参与率</div>
                  </div>
                  <div className="p-2 rounded" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
                    <div className="text-base font-semibold" style={{ color: BRAND.amber }}>{v.rewards}</div>
                    <div className="text-[10px]" style={{ color: BRAND.textSub }}>奖励积分</div>
                  </div>
                </div>
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold" style={{ color: BRAND.text }}>选项</h3>
                  {v.options.map((o) => (
                    <div key={o.id} className="p-3 rounded-lg" style={{ backgroundColor: BRAND.card, border: `1px solid ${voteSelectedOption === o.id ? BRAND.primary : BRAND.border}` }}>
                      <div className="flex items-center gap-2 mb-1.5">
                        {v.status === 'live' && !v.participated ? (
                          <button onClick={() => setVoteSelectedOption(o.id)} className="w-4 h-4 rounded-full flex items-center justify-center shrink-0" style={{ border: `2px solid ${voteSelectedOption === o.id ? BRAND.primary : BRAND.border}` }}>
                            {voteSelectedOption === o.id && <div className="w-2 h-2 rounded-full" style={{ backgroundColor: BRAND.primary }} />}
                          </button>
                        ) : (
                          <CheckCircle2 size={14} style={{ color: v.selectedOption === o.id ? BRAND.success : BRAND.textMute }} />
                        )}
                        <span className="text-sm flex-1" style={{ color: BRAND.text }}>{o.text}</span>
                        <span className="text-xs font-medium" style={{ color: BRAND.text }}>{((o.votes / total) * 100).toFixed(1)}%</span>
                      </div>
                      <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: BRAND.bg }}>
                        <div className="h-full pc-bar" style={{ width: `${(o.votes / total) * 100}%`, backgroundColor: o.color }} />
                      </div>
                      <div className="text-[10px] mt-1" style={{ color: BRAND.textSub }}>{formatNumber(o.votes)} 票</div>
                    </div>
                  ))}
                </div>
                {v.status === 'live' && !v.participated && (
                  <button onClick={handleSubmitVote} disabled={!voteSelectedOption} className="w-full py-2.5 rounded-lg text-sm font-medium" style={{ backgroundColor: voteSelectedOption ? BRAND.primary : BRAND.cardHover, color: voteSelectedOption ? '#000' : BRAND.textMute, border: `1px solid ${voteSelectedOption ? BRAND.primary : BRAND.border}` }}>
                    提交投票 · 奖励 {v.rewards} 积分
                  </button>
                )}
                {v.participated && (
                  <div className="p-3 rounded-lg text-center" style={{ backgroundColor: BRAND.successLt, color: BRAND.success, border: `1px solid ${BRAND.success}40` }}>
                    ✓ 您已参与本次投票
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* 积分商城 Drawer */}
      {drawer.open && drawer.type === 'shop' && (
        <div className="fixed inset-0 z-50 flex justify-end" style={{ backgroundColor: BRAND.overlay }} onClick={closeDrawer}>
          <div className="w-full max-w-2xl h-full overflow-y-auto pc-drawer" style={{ backgroundColor: BRAND.bg, borderLeft: `1px solid ${BRAND.border}` }} onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4" style={{ backgroundColor: BRAND.bg, borderBottom: `1px solid ${BRAND.border}` }}>
              <h3 className="text-base font-semibold flex items-center gap-2" style={{ color: BRAND.text }}>
                <Award size={16} style={{ color: BRAND.amber }} /> 积分商城
              </h3>
              <button onClick={closeDrawer} className="p-1.5 rounded" style={{ color: BRAND.textSub }}><X size={18} /></button>
            </div>
            <div className="p-6 space-y-3">
              <div className="p-3 rounded-lg" style={{ background: `linear-gradient(135deg, ${BRAND.primaryLt} 0%, ${BRAND.infoLt} 100%)`, border: `1px solid ${BRAND.primary}40` }}>
                <div className="text-xs" style={{ color: BRAND.textSub }}>我的积分</div>
                <div className="text-2xl font-bold" style={{ color: BRAND.primary }}>{formatNumber(currentUser.points)}</div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {SHOP_ITEMS.slice(0, 6).map((s) => (
                  <div key={s.id} className="p-3 rounded-lg" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
                    <div className="aspect-square mb-2 flex items-center justify-center text-4xl rounded" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}>{s.image}</div>
                    <div className="text-xs font-medium mb-1 line-clamp-1" style={{ color: BRAND.text }}>{s.name}</div>
                    <div className="flex items-center justify-between mt-1.5">
                      <span className="text-xs font-semibold" style={{ color: BRAND.primary }}>{s.cost} 积分</span>
                      <button onClick={() => handleRedeem(s.id)} disabled={s.status === 'soldout' || s.status === 'coming' || s.cost > currentUser.points} className="px-2 py-1 rounded text-[10px]" style={{ backgroundColor: s.cost <= currentUser.points && (s.status === 'available' || s.status === 'limited') ? BRAND.primary : BRAND.cardHover, color: s.cost <= currentUser.points && (s.status === 'available' || s.status === 'limited') ? '#000' : BRAND.textMute }}>
                        {s.status === 'soldout' ? '已售罄' : s.cost > currentUser.points ? '积分不足' : '兑换'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <button onClick={() => { closeDrawer(); setTab('points'); }} className="w-full py-2.5 rounded-lg text-sm" style={{ backgroundColor: BRAND.card, color: BRAND.primary, border: `1px solid ${BRAND.border}` }}>
                查看更多 →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 帮助 Drawer */}
      {helpOpen && (
        <div className="fixed inset-0 z-50 flex justify-end" style={{ backgroundColor: BRAND.overlay }} onClick={() => setHelpOpen(false)}>
          <div className="w-full max-w-md h-full overflow-y-auto pc-drawer" style={{ backgroundColor: BRAND.bg, borderLeft: `1px solid ${BRAND.border}` }} onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4" style={{ backgroundColor: BRAND.bg, borderBottom: `1px solid ${BRAND.border}` }}>
              <h3 className="text-base font-semibold" style={{ color: BRAND.text }}>快捷键与帮助</h3>
              <button onClick={() => setHelpOpen(false)} className="p-1.5 rounded" style={{ color: BRAND.textSub }}><X size={18} /></button>
            </div>
            <div className="p-5 space-y-2">
              {[
                { k: '/', d: '聚焦搜索框' },
                { k: '?', d: '打开/关闭本页帮助' },
                { k: 'Esc', d: '关闭 Drawer / 弹窗' },
                { k: '1-9', d: '快速切换 Tab' },
              ].map((it) => (
                <div key={it.k} className="flex items-center gap-3 p-2.5 rounded-lg" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
                  <span className="px-2 py-0.5 rounded text-xs font-mono" style={{ backgroundColor: BRAND.bg, color: BRAND.primary, border: `1px solid ${BRAND.primary}40`, minWidth: 60, textAlign: 'center' }}>{it.k}</span>
                  <span className="text-sm" style={{ color: BRAND.text }}>{it.d}</span>
                </div>
              ))}
              <div className="mt-4 p-3 rounded-lg text-[11px]" style={{ backgroundColor: BRAND.primaryLt, color: BRAND.primary, border: `1px solid ${BRAND.primary}40` }}>
                · 快捷键在输入框内不生效，避免干扰表单输入
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

