/**
 * PortalDeveloper - 开发者门户与 SDK 下载中心 (2026-07-21 Q05 P3.48)
 *
 * 页面定位：
 * - 中萨数字科技交易所 开发者门户与 SDK 下载中心
 * - API 目录 / SDK 下载 / 沙箱环境 / Webhook 事件 / 限额配额 / 错误码字典 / 接入审核 / 代码示例 / 变更日志 / 服务状态 / 开发者报告 / 帮助
 * - 与 P3.46 智能投顾 + P3.47 机构服务 形成 "投顾-机构-开发者生态" 完整接入通道
 * - 与 P3.25 做市商 + P3.26 衍生品 + P3.40 量化策略 + P3.45 资产组合 + P3.46 智能投顾 + P3.47 机构服务 + P3.48 开发者门户 形成
 *   "做市-衍生-策略-组合-投顾-机构-开发者" 全栈技术与机构服务能力栈
 *
 * L4 工业级设计标准：
 * - 暗色 v6 纯黑 #000000 + 卡片 #141414 + ZSDEX 绿 primary #14B881
 * - 12 Tabs：总览 / API / SDK / 沙箱 / Webhook / 配额 / 错误码 / 审核 / 示例 / 变更 / 状态 / 帮助
 *
 * 合规约束：
 * - 严格规避"承诺收益 / 保本 / 刚兑 / 稳赚 / 担保 / 萨摩亚持牌 / MSA / DSAEX"等高风险词
 * - 不涉及"持牌 / 监管 / 牌照"等违规表述
 * - SDK / 沙箱 / API 为技术能力演示，定性为"研究 / 工具 / 辅助"型能力
 * - 沙箱环境不涉及真实资产，定性为"模拟 / 测试"型环境
 */

'use client';

import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
  Search, X, Filter, ChevronRight, ChevronLeft, ChevronUp, ChevronDown,
  TrendingUp, TrendingDown, ArrowUp, ArrowDown, ArrowUpRight, ArrowDownRight, ArrowRight, ArrowLeft,
  Sparkles, Star, Heart, Bookmark, Flag, Tag, Tags, Eye, EyeOff, Plus, Minus,
  MoreHorizontal, MoreVertical, Menu, HelpCircle, Book, BookOpen, Lightbulb, GraduationCap,
  Code, Terminal, Webhook, Copy, Check, Download, Upload, ExternalLink, Link2, Link, Unlink,
  Package, Boxes, Box, Layers, Cpu, Cloud, Server, Database, Network, Globe, Globe2,
  Key, Lock, Unlock, Shield, ShieldCheck, ShieldAlert, ShieldOff,
  CheckCircle2, CheckCircle, XCircle, AlertCircle, AlertTriangle, Info, Percent, Hash,
  Users, User, UserCheck, Crown, Trophy, Medal, Award, Briefcase, Building, Building2,
  Mail, Bell, BellRing, Send, MessageCircle, MessageSquare, Phone,
  History, RotateCcw, RotateCw, Repeat, RefreshCw, Calendar, Clock, Timer, Hourglass,
  Settings, Wrench, Hammer, Plug, Power, PowerOff, Activity, Zap, Flame, Rocket,
  PlayCircle, PauseCircle, StopCircle, Edit, Trash2, Save, Folder, FolderOpen, Archive,
  FileText, FileCheck, FilePlus, FileMinus, FileCode, FileJson, FileTerminal, FileSearch,
  ListChecks, ListFilter, ListTree, ClipboardList, ClipboardCheck,
  ArrowDownUp, Sigma, FunctionSquare, Droplet, Workflow, GitBranch, GitCommit, GitMerge,
  ChartLine, ChartBar, ChartPie, ChartColumn, ChartNoAxesColumn, BarChart3, PieChart, LineChart,
  Gauge, Target, Crosshair, Compass, Map, MapPin, Scroll, Stamp, Gavel, Scale,
  Wallet, Banknote, CreditCard, Receipt, Calculator, Handshake,
  Mic, Video, Sun, Moon, CloudMoon, Sunrise, Sunset, CalendarDays, CalendarCheck,
  DollarSign, Coins, CircleDollarSign, Gem, PiggyBank, NotebookText, Newspaper, Notebook,
} from 'lucide-react';
import { BRAND, STATUS } from '@/components/portal-preview/brand';

// ============================================================
// 类型定义
// ============================================================

type Tab = 'overview' | 'api' | 'sdk' | 'sandbox' | 'webhook' | 'quota' | 'errors' | 'audit' | 'examples' | 'changelog' | 'status' | 'help';
type SortBy = 'name' | 'calls' | 'latency' | 'updated' | 'downloads';

type ApiMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'WS';
type ApiCategory = 'market' | 'account' | 'trade' | 'wallet' | 'institution' | 'strategy' | 'risk' | 'webhook' | 'admin' | 'misc';
type ApiStatus = 'stable' | 'beta' | 'deprecated' | 'new';

type SdkLang = 'typescript' | 'python' | 'go' | 'java' | 'rust' | 'csharp' | 'php' | 'swift' | 'kotlin';
type SdkStatus = 'stable' | 'beta' | 'alpha' | 'deprecated';

type SandboxEnv = 'sandbox' | 'mock' | 'replay' | 'chaos';
type SandboxStatus = 'active' | 'expired' | 'revoked' | 'pending';

type WebhookCategory = 'order' | 'position' | 'wallet' | 'kyc' | 'risk' | 'system' | 'account' | 'strategy';
type WebhookStatus = 'active' | 'paused' | 'failed' | 'disabled';

type QuotaTier = 'free' | 'starter' | 'pro' | 'enterprise' | 'custom';

type ErrorSeverity = 'info' | 'warning' | 'error' | 'critical';

type AuditStatus = 'draft' | 'submitted' | 'reviewing' | 'approved' | 'rejected' | 'needs_info';

type ExampleLang = 'curl' | 'typescript' | 'python' | 'go' | 'java' | 'rust';

type ChangelogType = 'feature' | 'fix' | 'security' | 'deprecation' | 'breaking';

type ServiceState = 'operational' | 'degraded' | 'partial_outage' | 'major_outage' | 'maintenance';

interface ApiEndpoint {
  id: string;
  name: string;
  path: string;
  method: ApiMethod;
  category: ApiCategory;
  status: ApiStatus;
  version: string;
  description: string;
  rateLimit: string;
  auth: string;
  calls24h: number;
  p95LatencyMs: number;
  errorRate: number;
  updatedAt: string;
  deprecatedAt?: string;
  tags: string[];
}

interface SdkPackage {
  id: string;
  name: string;
  lang: SdkLang;
  version: string;
  status: SdkStatus;
  size: number;
  downloads: number;
  stars: number;
  openIssues: number;
  lastRelease: string;
  repo: string;
  docs: string;
  description: string;
  installCmd: string;
  features: string[];
  maintainer: string;
  license: string;
}

interface SandboxKey {
  id: string;
  name: string;
  keyPrefix: string;
  env: SandboxEnv;
  status: SandboxStatus;
  tier: QuotaTier;
  callsToday: number;
  callsLimit: number;
  rateLimit: string;
  expiresAt: string;
  createdAt: string;
  lastUsedAt: string;
  ipWhitelist: string[];
  scopes: string[];
  note: string;
}

interface WebhookEvent {
  id: string;
  name: string;
  category: WebhookCategory;
  status: WebhookStatus;
  endpoint: string;
  secret: string;
  deliveries24h: number;
  successRate: number;
  avgLatencyMs: number;
  retries: number;
  events: string[];
  filters: string[];
  description: string;
  updatedAt: string;
}

interface QuotaUsage {
  id: string;
  tier: QuotaTier;
  callsPerMin: number;
  callsPerDay: number;
  websocketConns: number;
  webhookDeliveries: number;
  usedPct: number;
  burstPct: number;
  resetAt: string;
  history: number[];
  regions: { name: string; pct: number; latencyMs: number }[];
  alerts: number;
}

interface ErrorCode {
  id: string;
  code: string;
  message: string;
  severity: ErrorSeverity;
  category: string;
  httpStatus: number;
  retryable: boolean;
  cause: string;
  solution: string;
  occurrence: number;
  lastSeen: string;
  references: string[];
}

interface AuditApplication {
  id: string;
  applicant: string;
  orgName: string;
  orgType: string;
  useCase: string;
  status: AuditStatus;
  submittedAt: string;
  reviewNote: string;
  kybLevel: number;
  expectedRps: number;
  contact: string;
  email: string;
  scope: string[];
  reviewedBy: string;
  score: number;
}

interface CodeExample {
  id: string;
  title: string;
  api: string;
  lang: ExampleLang;
  scenario: string;
  code: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  tags: string[];
  updatedAt: string;
  runs: number;
}

interface ChangelogEntry {
  id: string;
  version: string;
  type: ChangelogType;
  title: string;
  description: string;
  releasedAt: string;
  affects: string[];
  migration: string;
  author: string;
  pr: string;
  reactions: number;
}

interface ServiceStatusItem {
  id: string;
  name: string;
  state: ServiceState;
  uptime: number;
  latencyP50: number;
  latencyP95: number;
  errorRate: number;
  region: string;
  lastIncident: string;
  incidents30d: number;
  description: string;
  dependencies: string[];
}

// ============================================================
// 工具函数
// ============================================================

function formatUsd(n: number): string {
  if (n >= 1e9) return '$' + (n / 1e9).toFixed(2) + 'B';
  if (n >= 1e6) return '$' + (n / 1e6).toFixed(2) + 'M';
  if (n >= 1e3) return '$' + (n / 1e3).toFixed(2) + 'K';
  return '$' + n.toFixed(0);
}

function formatPct(n: number, digits = 2): string {
  return (n >= 0 ? '+' : '') + n.toFixed(digits) + '%';
}

function formatInt(n: number): string {
  if (n >= 1e9) return (n / 1e9).toFixed(2) + 'B';
  if (n >= 1e6) return (n / 1e6).toFixed(2) + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(2) + 'K';
  return n.toString();
}

function formatBytes(n: number): string {
  if (n >= 1024 * 1024) return (n / (1024 * 1024)).toFixed(2) + ' MB';
  if (n >= 1024) return (n / 1024).toFixed(2) + ' KB';
  return n + ' B';
}

function statusBadge(status: string): { label: string; color: string; bg: string } {
  const map: Record<string, { label: string; color: string; bg: string }> = {
    stable: { label: '稳定', color: BRAND.success, bg: BRAND.successLt },
    beta: { label: '公测', color: BRAND.amber, bg: BRAND.amberLt },
    alpha: { label: '内测', color: BRAND.info, bg: BRAND.infoLt },
    deprecated: { label: '已弃用', color: BRAND.danger, bg: BRAND.dangerLt },
    new: { label: '新增', color: BRAND.primary, bg: BRAND.primaryLt },
    active: { label: '活跃', color: BRAND.success, bg: BRAND.successLt },
    paused: { label: '暂停', color: BRAND.amber, bg: BRAND.amberLt },
    failed: { label: '失败', color: BRAND.danger, bg: BRAND.dangerLt },
    disabled: { label: '禁用', color: BRAND.textMute, bg: 'rgba(112,112,112,0.10)' },
    expired: { label: '已过期', color: BRAND.textMute, bg: 'rgba(112,112,112,0.10)' },
    revoked: { label: '已撤销', color: BRAND.danger, bg: BRAND.dangerLt },
    pending: { label: '待激活', color: BRAND.info, bg: BRAND.infoLt },
    draft: { label: '草稿', color: BRAND.textMute, bg: 'rgba(112,112,112,0.10)' },
    submitted: { label: '已提交', color: BRAND.info, bg: BRAND.infoLt },
    reviewing: { label: '审核中', color: BRAND.amber, bg: BRAND.amberLt },
    approved: { label: '已通过', color: BRAND.success, bg: BRAND.successLt },
    rejected: { label: '已驳回', color: BRAND.danger, bg: BRAND.dangerLt },
    needs_info: { label: '需补充', color: BRAND.amber, bg: BRAND.amberLt },
    operational: { label: '正常', color: BRAND.success, bg: BRAND.successLt },
    degraded: { label: '降级', color: BRAND.amber, bg: BRAND.amberLt },
    partial_outage: { label: '部分不可用', color: BRAND.warning, bg: BRAND.warningLt },
    major_outage: { label: '严重故障', color: BRAND.danger, bg: BRAND.dangerLt },
    maintenance: { label: '维护中', color: BRAND.info, bg: BRAND.infoLt },
    info: { label: '提示', color: BRAND.info, bg: BRAND.infoLt },
    warning: { label: '警告', color: BRAND.amber, bg: BRAND.amberLt },
    error: { label: '错误', color: BRAND.danger, bg: BRAND.dangerLt },
    critical: { label: '严重', color: BRAND.danger, bg: BRAND.dangerLt },
    feature: { label: '新增', color: BRAND.success, bg: BRAND.successLt },
    fix: { label: '修复', color: BRAND.info, bg: BRAND.infoLt },
    security: { label: '安全', color: BRAND.amber, bg: BRAND.amberLt },
    breaking: { label: '重大变更', color: BRAND.danger, bg: BRAND.dangerLt },
  };
  return map[status] || { label: status, color: BRAND.textMute, bg: 'rgba(112,112,112,0.10)' };
}

function severityColor(s: string): { color: string; bg: string } {
  const map: Record<string, { color: string; bg: string }> = {
    info: { color: BRAND.info, bg: BRAND.infoLt },
    warning: { color: BRAND.amber, bg: BRAND.amberLt },
    error: { color: BRAND.danger, bg: BRAND.dangerLt },
    critical: { color: BRAND.danger, bg: BRAND.dangerLt },
  };
  return map[s] || { color: BRAND.textMute, bg: 'rgba(112,112,112,0.10)' };
}

function truncate(s: string, n: number): string {
  return s.length > n ? s.substring(0, n) + '…' : s;
}

const METHOD_COLOR: Record<ApiMethod, string> = {
  GET: BRAND.success,
  POST: BRAND.info,
  PUT: BRAND.amber,
  DELETE: BRAND.danger,
  PATCH: '#FFA940',
  WS: BRAND.primary,
};

const LANG_ICON: Record<SdkLang, string> = {
  typescript: 'TS',
  python: 'Py',
  go: 'Go',
  java: 'Jv',
  rust: 'Rs',
  csharp: 'C#',
  php: 'Ph',
  swift: 'Sw',
  kotlin: 'Kt',
};

const LANG_COLOR: Record<SdkLang, string> = {
  typescript: '#3178C6',
  python: '#3776AB',
  go: '#00ADD8',
  java: '#B07219',
  rust: '#DEA584',
  csharp: '#239120',
  php: '#777BB4',
  swift: '#F05138',
  kotlin: '#A97BFF',
};

const CAT_ICON: Record<ApiCategory, string> = {
  market: '行情',
  account: '账户',
  trade: '交易',
  wallet: '钱包',
  institution: '机构',
  strategy: '策略',
  risk: '风控',
  webhook: '回调',
  admin: '管理',
  misc: '其他',
};

// ============================================================
// Mock 数据
// ============================================================

// 详细 mock 数据由 step2 注入（详见 tpl-developer-data.txt 占位）
// Mock 数据 - 全部使用模拟数据，不连接真实 API

// === API 端点（14 个） ===
const API_ENDPOINTS: ApiEndpoint[] = [
  {
    id: 'API-001', name: '行情 K 线', path: '/v1/market/klines', method: 'GET', category: 'market',
    status: 'stable', version: 'v1.2', description: '获取交易对 K 线数据，支持 1m/5m/15m/1h/4h/1d/1w',
    rateLimit: '1200/min', auth: 'API Key', calls24h: 8_240_000, p95LatencyMs: 42, errorRate: 0.08,
    updatedAt: '2026-07-15', tags: ['行情', 'K 线', '高频'],
  },
  {
    id: 'API-002', name: '账户余额', path: '/v1/account/balances', method: 'GET', category: 'account',
    status: 'stable', version: 'v1.0', description: '查询账户多币种余额',
    rateLimit: '600/min', auth: 'API Key + Signature', calls24h: 1_840_000, p95LatencyMs: 68, errorRate: 0.12,
    updatedAt: '2026-06-20', tags: ['账户', '余额'],
  },
  {
    id: 'API-003', name: '下单', path: '/v1/order/create', method: 'POST', category: 'trade',
    status: 'stable', version: 'v2.1', description: '创建限价/市价/止损单',
    rateLimit: '300/min', auth: 'API Key + Signature', calls24h: 980_000, p95LatencyMs: 124, errorRate: 0.32,
    updatedAt: '2026-07-10', tags: ['交易', '下单', '核心'],
  },
  {
    id: 'API-004', name: '撤单', path: '/v1/order/cancel', method: 'DELETE', category: 'trade',
    status: 'stable', version: 'v2.0', description: '撤销未成交订单',
    rateLimit: '600/min', auth: 'API Key + Signature', calls24h: 412_000, p95LatencyMs: 96, errorRate: 0.18,
    updatedAt: '2026-06-15', tags: ['交易', '撤单'],
  },
  {
    id: 'API-005', name: '充值地址', path: '/v1/wallet/deposit-address', method: 'GET', category: 'wallet',
    status: 'stable', version: 'v1.0', description: '获取币种充值地址',
    rateLimit: '120/min', auth: 'API Key + Signature', calls24h: 86_000, p95LatencyMs: 142, errorRate: 0.22,
    updatedAt: '2026-05-28', tags: ['钱包', '充值'],
  },
  {
    id: 'API-006', name: '提现申请', path: '/v1/wallet/withdraw', method: 'POST', category: 'wallet',
    status: 'beta', version: 'v0.9', description: '提交提现申请（含白名单校验）',
    rateLimit: '60/min', auth: 'API Key + Signature + 2FA', calls24h: 24_000, p95LatencyMs: 218, errorRate: 0.45,
    updatedAt: '2026-07-18', tags: ['钱包', '提现', '公测'],
  },
  {
    id: 'API-007', name: '机构信用额度', path: '/v1/institution/credit', method: 'GET', category: 'institution',
    status: 'beta', version: 'v0.8', description: '查询机构账户信用额度与已用占比',
    rateLimit: '120/min', auth: 'API Key + Signature + KYB', calls24h: 18_400, p95LatencyMs: 186, errorRate: 0.28,
    updatedAt: '2026-07-12', tags: ['机构', '信用'],
  },
  {
    id: 'API-008', name: '策略信号', path: '/v1/strategy/signal', method: 'WS', category: 'strategy',
    status: 'new', version: 'v0.1', description: '订阅量化策略实时交易信号（WebSocket）',
    rateLimit: '200 conn', auth: 'API Key + Subscribe Token', calls24h: 6_400_000, p95LatencyMs: 28, errorRate: 0.05,
    updatedAt: '2026-07-19', tags: ['策略', '信号', 'WebSocket', '新增'],
  },
  {
    id: 'API-009', name: '风控预检', path: '/v1/risk/precheck', method: 'POST', category: 'risk',
    status: 'stable', version: 'v1.1', description: '下单前风控合规预检',
    rateLimit: '600/min', auth: 'API Key + Signature', calls24h: 920_000, p95LatencyMs: 38, errorRate: 0.04,
    updatedAt: '2026-07-08', tags: ['风控', '预检'],
  },
  {
    id: 'API-010', name: 'Webhook 注册', path: '/v1/webhook/register', method: 'POST', category: 'webhook',
    status: 'stable', version: 'v1.0', description: '注册 Webhook 端点与订阅事件',
    rateLimit: '60/min', auth: 'API Key + Signature', calls24h: 4_200, p95LatencyMs: 96, errorRate: 0.18,
    updatedAt: '2026-06-10', tags: ['回调', '注册'],
  },
  {
    id: 'API-011', name: 'KYC 状态', path: '/v1/account/kyc-status', method: 'GET', category: 'account',
    status: 'stable', version: 'v1.0', description: '查询用户/机构 KYC 审核状态',
    rateLimit: '300/min', auth: 'API Key', calls24h: 142_000, p95LatencyMs: 84, errorRate: 0.16,
    updatedAt: '2026-05-30', tags: ['账户', 'KYC', '合规'],
  },
  {
    id: 'API-012', name: '深度行情', path: '/v1/market/depth', method: 'GET', category: 'market',
    status: 'stable', version: 'v1.0', description: '获取订单簿深度数据',
    rateLimit: '1200/min', auth: 'API Key', calls24h: 3_640_000, p95LatencyMs: 32, errorRate: 0.06,
    updatedAt: '2026-07-05', tags: ['行情', '深度'],
  },
  {
    id: 'API-013', name: '资产组合', path: '/v1/portfolio/holdings', method: 'GET', category: 'account',
    status: 'beta', version: 'v0.6', description: '查询智能投顾资产组合明细',
    rateLimit: '300/min', auth: 'API Key + Signature', calls24h: 48_000, p95LatencyMs: 156, errorRate: 0.22,
    updatedAt: '2026-07-16', tags: ['资产', '组合', '投顾'],
  },
  {
    id: 'API-014', name: '历史成交', path: '/v1/order/trades', method: 'GET', category: 'trade',
    status: 'deprecated', version: 'v0.9', description: '查询历史成交记录（即将下线）',
    rateLimit: '600/min', auth: 'API Key + Signature', calls24h: 12_000, p95LatencyMs: 248, errorRate: 0.42,
    updatedAt: '2025-12-01', deprecatedAt: '2026-09-30', tags: ['交易', '历史', '弃用'],
  },
];

// === SDK 包（9 语言） ===
const SDK_PACKAGES: SdkPackage[] = [
  {
    id: 'SDK-TS', name: '@zsdex/sdk-typescript', lang: 'typescript', version: '2.4.1', status: 'stable',
    size: 248_000, downloads: 286_000, stars: 1_240, openIssues: 18, lastRelease: '2026-07-15',
    repo: 'github.com/zsdex/sdk-typescript', docs: 'docs.zsdex.io/sdk/ts',
    description: '官方 TypeScript SDK，支持浏览器 / Node.js / Deno / Bun，含完整类型定义',
    installCmd: 'npm install @zsdex/sdk-typescript',
    features: ['完整 TS 类型', 'WebSocket 自动重连', 'HMAC 签名', '错误重试', '沙箱模式'],
    maintainer: 'zsdex-core', license: 'Apache-2.0',
  },
  {
    id: 'SDK-PY', name: 'zsdex-sdk-python', lang: 'python', version: '1.8.2', status: 'stable',
    size: 184_000, downloads: 196_000, stars: 842, openIssues: 12, lastRelease: '2026-07-12',
    repo: 'github.com/zsdex/sdk-python', docs: 'docs.zsdex.io/sdk/py',
    description: '官方 Python SDK，支持 3.9+，异步客户端 + 类型提示',
    installCmd: 'pip install zsdex-sdk',
    features: ['asyncio 异步', 'Pydantic 模型', '自动重连', '类型提示完整'],
    maintainer: 'zsdex-core', license: 'Apache-2.0',
  },
  {
    id: 'SDK-GO', name: 'github.com/zsdex/zsdex-go', lang: 'go', version: '1.6.0', status: 'stable',
    size: 96_000, downloads: 142_000, stars: 624, openIssues: 8, lastRelease: '2026-07-10',
    repo: 'github.com/zsdex/zsdex-go', docs: 'docs.zsdex.io/sdk/go',
    description: '官方 Go SDK，高性能 + context 上下文支持',
    installCmd: 'go get github.com/zsdex/zsdex-go',
    features: ['context 支持', '并发安全', '零依赖', 'go module'],
    maintainer: 'zsdex-core', license: 'Apache-2.0',
  },
  {
    id: 'SDK-JV', name: 'com.zsdex:sdk-java', lang: 'java', version: '1.4.0', status: 'stable',
    size: 312_000, downloads: 84_000, stars: 312, openIssues: 14, lastRelease: '2026-07-08',
    repo: 'github.com/zsdex/sdk-java', docs: 'docs.zsdex.io/sdk/java',
    description: '官方 Java SDK，支持 JDK 11+，Maven / Gradle',
    installCmd: 'implementation \'com.zsdex:sdk-java:1.4.0\'',
    features: ['JDK 11+', 'Reactive Streams', 'OkHttp 底层', 'Maven Central'],
    maintainer: 'zsdex-core', license: 'Apache-2.0',
  },
  {
    id: 'SDK-RS', name: 'zsdex-rust', lang: 'rust', version: '0.9.0', status: 'beta',
    size: 64_000, downloads: 28_000, stars: 186, openIssues: 22, lastRelease: '2026-07-14',
    repo: 'github.com/zsdex/zsdex-rust', docs: 'docs.zsdex.io/sdk/rust',
    description: '官方 Rust SDK（公测），async/await + tokio',
    installCmd: 'cargo add zsdex',
    features: ['async/await', 'tokio 异步运行时', '零拷贝', '强类型'],
    maintainer: 'zsdex-core', license: 'Apache-2.0',
  },
  {
    id: 'SDK-CS', name: 'Zsdex.Sdk', lang: 'csharp', version: '1.2.0', status: 'stable',
    size: 156_000, downloads: 38_000, stars: 124, openIssues: 6, lastRelease: '2026-07-06',
    repo: 'github.com/zsdex/sdk-csharp', docs: 'docs.zsdex.io/sdk/cs',
    description: '官方 C# SDK，支持 .NET 6+',
    installCmd: 'dotnet add package Zsdex.Sdk',
    features: ['.NET 6+', 'async/await', 'NuGet 发布', '强类型'],
    maintainer: 'zsdex-core', license: 'Apache-2.0',
  },
  {
    id: 'SDK-PHP', name: 'zsdex/sdk-php', lang: 'php', version: '1.5.0', status: 'stable',
    size: 88_000, downloads: 42_000, stars: 96, openIssues: 9, lastRelease: '2026-07-04',
    repo: 'github.com/zsdex/sdk-php', docs: 'docs.zsdex.io/sdk/php',
    description: '官方 PHP SDK，支持 8.0+',
    installCmd: 'composer require zsdex/sdk-php',
    features: ['PHP 8.0+', '类型声明', 'PSR-18', 'Composer 包'],
    maintainer: 'zsdex-core', license: 'Apache-2.0',
  },
  {
    id: 'SDK-SW', name: 'ZsdexSDK', lang: 'swift', version: '0.8.0', status: 'alpha',
    size: 72_000, downloads: 18_000, stars: 68, openIssues: 16, lastRelease: '2026-07-11',
    repo: 'github.com/zsdex/sdk-swift', docs: 'docs.zsdex.io/sdk/swift',
    description: '官方 Swift SDK（内测），SwiftPM',
    installCmd: 'swift package add zsdex/ZsdexSDK',
    features: ['SwiftPM', 'async/await', 'Codable', 'iOS 15+'],
    maintainer: 'zsdex-core', license: 'Apache-2.0',
  },
  {
    id: 'SDK-KT', name: 'com.zsdex:sdk-kotlin', lang: 'kotlin', version: '0.6.0', status: 'beta',
    size: 96_000, downloads: 22_000, stars: 84, openIssues: 11, lastRelease: '2026-07-09',
    repo: 'github.com/zsdex/sdk-kotlin', docs: 'docs.zsdex.io/sdk/kotlin',
    description: '官方 Kotlin SDK（公测），协程 + 序列化',
    installCmd: 'implementation(\'com.zsdex:sdk-kotlin:0.6.0\')',
    features: ['协程', 'kotlinx.serialization', 'KMP 兼容', 'JVM/Android'],
    maintainer: 'zsdex-core', license: 'Apache-2.0',
  },
];

// === 沙箱密钥（6 个） ===
const SANDBOX_KEYS: SandboxKey[] = [
  {
    id: 'SK-001', name: '机构主沙箱', keyPrefix: 'sk_sb_main_8f2a****', env: 'sandbox', status: 'active',
    tier: 'enterprise', callsToday: 184_000, callsLimit: 5_000_000, rateLimit: '5000/min',
    expiresAt: '2026-12-31', createdAt: '2024-08-12', lastUsedAt: '2026-07-21 11:18',
    ipWhitelist: ['203.0.113.0/24', '198.51.100.42'],
    scopes: ['market:read', 'account:read', 'trade:write', 'wallet:read'],
    note: '机构主测试沙箱，限内部使用',
  },
  {
    id: 'SK-002', name: '投顾研究沙箱', keyPrefix: 'sk_sb_advisor_3c91****', env: 'sandbox', status: 'active',
    tier: 'pro', callsToday: 92_000, callsLimit: 1_000_000, rateLimit: '1500/min',
    expiresAt: '2026-10-15', createdAt: '2025-03-20', lastUsedAt: '2026-07-21 11:24',
    ipWhitelist: ['203.0.113.18'],
    scopes: ['market:read', 'strategy:read', 'signal:subscribe'],
    note: '智能投顾研究专用',
  },
  {
    id: 'SK-003', name: '量化回测沙箱', keyPrefix: 'sk_sb_quant_a47e****', env: 'replay', status: 'active',
    tier: 'pro', callsToday: 246_000, callsLimit: 2_000_000, rateLimit: '3000/min',
    expiresAt: '2026-09-30', createdAt: '2024-11-08', lastUsedAt: '2026-07-21 11:30',
    ipWhitelist: [],
    scopes: ['market:read', 'trade:replay', 'backtest:run'],
    note: '历史行情回放模式',
  },
  {
    id: 'SK-004', name: '混沌测试沙箱', keyPrefix: 'sk_sb_chaos_e2d1****', env: 'chaos', status: 'active',
    tier: 'enterprise', callsToday: 18_000, callsLimit: 500_000, rateLimit: '600/min',
    expiresAt: '2026-08-20', createdAt: '2026-04-12', lastUsedAt: '2026-07-20 18:42',
    ipWhitelist: ['203.0.113.5'],
    scopes: ['market:read', 'trade:write', 'chaos:inject'],
    note: '故障注入测试专用',
  },
  {
    id: 'SK-005', name: 'Mobile Demo 沙箱', keyPrefix: 'sk_sb_demo_b8f4****', env: 'mock', status: 'active',
    tier: 'free', callsToday: 8_400, callsLimit: 50_000, rateLimit: '120/min',
    expiresAt: '2026-08-15', createdAt: '2026-06-01', lastUsedAt: '2026-07-21 10:58',
    ipWhitelist: [],
    scopes: ['market:read', 'account:read'],
    note: '移动端 demo 演示用',
  },
  {
    id: 'SK-006', name: '历史撤销密钥', keyPrefix: 'sk_sb_old_****', env: 'sandbox', status: 'revoked',
    tier: 'starter', callsToday: 0, callsLimit: 100_000, rateLimit: '300/min',
    expiresAt: '2025-12-31', createdAt: '2024-05-10', lastUsedAt: '2025-12-28 16:00',
    ipWhitelist: [],
    scopes: ['market:read'],
    note: '已撤销（合规审计）',
  },
];

// === Webhook 事件（6 个） ===
const WEBHOOK_EVENTS: WebhookEvent[] = [
  {
    id: 'WH-001', name: '订单状态变更', category: 'order', status: 'active',
    endpoint: 'https://api.partner.example/hooks/order', secret: 'whsec_****8f2a',
    deliveries24h: 184_000, successRate: 99.92, avgLatencyMs: 86, retries: 412,
    events: ['order.created', 'order.filled', 'order.partial', 'order.cancelled'],
    filters: ['symbol=BTC*,ETH*', 'amount>1000'],
    description: '订单全生命周期事件，含创建/成交/部分成交/撤销',
    updatedAt: '2026-07-15',
  },
  {
    id: 'WH-002', name: '持仓变动', category: 'position', status: 'active',
    endpoint: 'https://api.partner.example/hooks/position', secret: 'whsec_****3c91',
    deliveries24h: 96_000, successRate: 99.86, avgLatencyMs: 92, retries: 248,
    events: ['position.opened', 'position.closed', 'position.liquidated'],
    filters: ['leverage>1'],
    description: '持仓变化事件，含强平通知',
    updatedAt: '2026-07-10',
  },
  {
    id: 'WH-003', name: '钱包充值确认', category: 'wallet', status: 'active',
    endpoint: 'https://api.partner.example/hooks/wallet', secret: 'whsec_****a47e',
    deliveries24h: 18_400, successRate: 99.94, avgLatencyMs: 124, retries: 28,
    events: ['deposit.confirmed', 'withdraw.submitted', 'withdraw.completed'],
    filters: ['chain=ETH,BSC,POLYGON'],
    description: '链上充值/提现状态变更（≥6 区块确认）',
    updatedAt: '2026-07-12',
  },
  {
    id: 'WH-004', name: '风控告警', category: 'risk', status: 'active',
    endpoint: 'https://api.partner.example/hooks/risk', secret: 'whsec_****e2d1',
    deliveries24h: 4_200, successRate: 99.62, avgLatencyMs: 168, retries: 86,
    events: ['risk.alert', 'margin.call', 'force.liquidation'],
    filters: ['severity>=warning'],
    description: '风控事件告警，含追保/强平通知',
    updatedAt: '2026-07-08',
  },
  {
    id: 'WH-005', name: '系统公告', category: 'system', status: 'paused',
    endpoint: 'https://api.partner.example/hooks/system', secret: 'whsec_****b8f4',
    deliveries24h: 0, successRate: 0, avgLatencyMs: 0, retries: 0,
    events: ['maintenance.scheduled', 'incident.resolved', 'api.version.deprecated'],
    filters: [],
    description: '平台维护/事故/版本弃用通知（当前暂停）',
    updatedAt: '2026-07-19',
  },
  {
    id: 'WH-006', name: 'KYC 审核结果', category: 'kyc', status: 'active',
    endpoint: 'https://api.partner.example/hooks/kyc', secret: 'whsec_****d6e9',
    deliveries24h: 1_200, successRate: 99.18, avgLatencyMs: 218, retries: 42,
    events: ['kyc.approved', 'kyc.rejected', 'kyc.needs_info'],
    filters: ['type=individual, institution'],
    description: '用户/机构 KYC 审核结果回调',
    updatedAt: '2026-07-14',
  },
];

// === 配额使用（5 档） ===
const QUOTA_USAGES: QuotaUsage[] = [
  {
    id: 'QU-FREE', tier: 'free', callsPerMin: 60, callsPerDay: 10_000, websocketConns: 5, webhookDeliveries: 1_000,
    usedPct: 42, burstPct: 18, resetAt: '每日 00:00 UTC', history: [38, 41, 45, 42, 48, 52, 46, 42, 44, 42],
    regions: [{ name: '亚太', pct: 48, latencyMs: 32 }, { name: '欧美', pct: 36, latencyMs: 128 }, { name: '中东', pct: 16, latencyMs: 86 }],
    alerts: 2,
  },
  {
    id: 'QU-START', tier: 'starter', callsPerMin: 300, callsPerDay: 100_000, websocketConns: 20, webhookDeliveries: 10_000,
    usedPct: 58, burstPct: 32, resetAt: '每日 00:00 UTC', history: [42, 48, 52, 56, 58, 62, 64, 60, 58, 58],
    regions: [{ name: '亚太', pct: 52, latencyMs: 28 }, { name: '欧美', pct: 32, latencyMs: 124 }, { name: '中东', pct: 16, latencyMs: 82 }],
    alerts: 4,
  },
  {
    id: 'QU-PRO', tier: 'pro', callsPerMin: 1200, callsPerDay: 1_000_000, websocketConns: 100, webhookDeliveries: 100_000,
    usedPct: 67, burstPct: 48, resetAt: '每日 00:00 UTC', history: [52, 56, 60, 64, 66, 68, 70, 68, 66, 67],
    regions: [{ name: '亚太', pct: 58, latencyMs: 26 }, { name: '欧美', pct: 28, latencyMs: 118 }, { name: '中东', pct: 14, latencyMs: 78 }],
    alerts: 6,
  },
  {
    id: 'QU-ENT', tier: 'enterprise', callsPerMin: 5000, callsPerDay: 10_000_000, websocketConns: 500, webhookDeliveries: 1_000_000,
    usedPct: 72, burstPct: 56, resetAt: '每日 00:00 UTC', history: [62, 65, 68, 70, 72, 74, 76, 74, 72, 72],
    regions: [{ name: '亚太', pct: 62, latencyMs: 24 }, { name: '欧美', pct: 24, latencyMs: 112 }, { name: '中东', pct: 14, latencyMs: 72 }],
    alerts: 8,
  },
  {
    id: 'QU-CUST', tier: 'custom', callsPerMin: 20000, callsPerDay: 100_000_000, websocketConns: 2000, webhookDeliveries: 10_000_000,
    usedPct: 81, burstPct: 62, resetAt: '协商', history: [72, 75, 78, 80, 82, 84, 85, 83, 81, 81],
    regions: [{ name: '亚太', pct: 64, latencyMs: 22 }, { name: '欧美', pct: 22, latencyMs: 108 }, { name: '中东', pct: 14, latencyMs: 68 }],
    alerts: 12,
  },
];

// === 错误码（12 个） ===
const ERROR_CODES: ErrorCode[] = [
  {
    id: 'EC-001', code: 'ZS-AUTH-001', message: 'API Key 无效', severity: 'error', category: '鉴权',
    httpStatus: 401, retryable: false, cause: 'API Key 不存在或已撤销', solution: '检查 API Key 是否正确，确认未撤销',
    occurrence: 1_240, lastSeen: '2026-07-21 11:18', references: ['/docs/api/auth', '/docs/faq/auth-001'],
  },
  {
    id: 'EC-002', code: 'ZS-AUTH-002', message: '签名验证失败', severity: 'error', category: '鉴权',
    httpStatus: 401, retryable: false, cause: 'HMAC 签名与服务器不一致', solution: '使用 SDK 自动签名或参考签名示例',
    occurrence: 824, lastSeen: '2026-07-21 11:24', references: ['/docs/api/signing', '/sdk/examples/sign'],
  },
  {
    id: 'EC-003', code: 'ZS-RATE-001', message: '请求频率超限', severity: 'warning', category: '限流',
    httpStatus: 429, retryable: true, cause: '超过 callsPerMin 配额', solution: '退避重试或升级套餐',
    occurrence: 4_820, lastSeen: '2026-07-21 11:30', references: ['/docs/api/rate-limit'],
  },
  {
    id: 'EC-004', code: 'ZS-RATE-002', message: 'WebSocket 连接数超限', severity: 'warning', category: '限流',
    httpStatus: 429, retryable: true, cause: '超过 websocketConns 配额', solution: '关闭空闲连接或升级套餐',
    occurrence: 186, lastSeen: '2026-07-21 10:48', references: ['/docs/api/ws-limits'],
  },
  {
    id: 'EC-005', code: 'ZS-ORDER-001', message: '余额不足', severity: 'error', category: '交易',
    httpStatus: 400, retryable: false, cause: '账户可用余额小于订单金额', solution: '充值或调整订单金额',
    occurrence: 2_140, lastSeen: '2026-07-21 11:28', references: ['/docs/api/order'],
  },
  {
    id: 'EC-006', code: 'ZS-ORDER-002', message: '最小下单数量不足', severity: 'error', category: '交易',
    httpStatus: 400, retryable: false, cause: '订单数量小于交易对最小下单量', solution: '查询交易对最小下单量',
    occurrence: 642, lastSeen: '2026-07-21 11:12', references: ['/docs/api/min-quantity'],
  },
  {
    id: 'EC-007', code: 'ZS-MARKET-001', message: '交易对暂停交易', severity: 'warning', category: '行情',
    httpStatus: 503, retryable: true, cause: '交易对处于暂停状态', solution: '查询交易对状态或选择其他交易对',
    occurrence: 128, lastSeen: '2026-07-21 09:42', references: ['/docs/api/symbol-status'],
  },
  {
    id: 'EC-008', code: 'ZS-WALLET-001', message: '提现地址未在白名单', severity: 'error', category: '钱包',
    httpStatus: 400, retryable: false, cause: '提现地址未通过白名单校验', solution: '先添加白名单，等待 24h 生效',
    occurrence: 318, lastSeen: '2026-07-21 10:18', references: ['/docs/api/withdraw-whitelist'],
  },
  {
    id: 'EC-009', code: 'ZS-WALLET-002', message: '单日提现额度超限', severity: 'error', category: '钱包',
    httpStatus: 400, retryable: false, cause: '超过单日提现上限', solution: '分日提现或申请提额',
    occurrence: 84, lastSeen: '2026-07-21 08:24', references: ['/docs/api/withdraw-limit'],
  },
  {
    id: 'EC-010', code: 'ZS-RISK-001', message: '风控拦截', severity: 'critical', category: '风控',
    httpStatus: 403, retryable: false, cause: '订单触发风控规则', solution: '联系合规团队查询具体规则',
    occurrence: 42, lastSeen: '2026-07-20 22:14', references: ['/docs/risk/rules'],
  },
  {
    id: 'EC-011', code: 'ZS-SYS-001', message: '服务暂时不可用', severity: 'critical', category: '系统',
    httpStatus: 503, retryable: true, cause: '后端服务异常', solution: '退避重试，查看 /status 页',
    occurrence: 18, lastSeen: '2026-07-21 06:42', references: ['/status'],
  },
  {
    id: 'EC-012', code: 'ZS-PARAM-001', message: '参数校验失败', severity: 'error', category: '参数',
    httpStatus: 400, retryable: false, cause: '请求参数缺失或类型错误', solution: '参考 OpenAPI Schema',
    occurrence: 1_840, lastSeen: '2026-07-21 11:32', references: ['/docs/openapi'],
  },
];

// === 接入审核（5 个） ===
const AUDIT_APPLICATIONS: AuditApplication[] = [
  {
    id: 'AUD-001', applicant: '陈志远', orgName: 'Apex Sigma Capital Pte. Ltd.', orgType: '做市商',
    useCase: '加密资产做市 + 跨市场套利', status: 'approved', submittedAt: '2026-06-12', reviewNote: '材料齐全，KYB 通过',
    kybLevel: 5, expectedRps: 5000, contact: '+86-138-****-1234', email: 'contact@apex-sigma.example',
    scope: ['market:read', 'trade:write', 'institution:write'],
    reviewedBy: '合规组-王悦', score: 92,
  },
  {
    id: 'AUD-002', applicant: '林雅琴', orgName: 'Northwind Quant Labs', orgType: '量化团队',
    useCase: '量化策略研究 + 信号订阅', status: 'reviewing', submittedAt: '2026-07-10', reviewNote: '补充材料审核中',
    kybLevel: 3, expectedRps: 1200, contact: '+852-****-5678', email: 'research@northwind.example',
    scope: ['market:read', 'strategy:subscribe', 'backtest:run'],
    reviewedBy: '合规组-李航', score: 78,
  },
  {
    id: 'AUD-003', applicant: 'Satoshi M.', orgName: '个人开发者 (北美)', orgType: '个人',
    useCase: '行情分析工具 + 教学示例', status: 'submitted', submittedAt: '2026-07-18', reviewNote: '待初审',
    kybLevel: 0, expectedRps: 60, contact: '+1-415-****-9012', email: 'satoshi.dev@example',
    scope: ['market:read'],
    reviewedBy: '-', score: 0,
  },
  {
    id: 'AUD-004', applicant: '何俊', orgName: '海德拉巴资管', orgType: '资管',
    useCase: '量化资管 + 自动化交易', status: 'needs_info', submittedAt: '2026-07-05', reviewNote: '需补充股权穿透图与最终受益人声明',
    kybLevel: 4, expectedRps: 2500, contact: '+91-****-3456', email: 'compliance@hyd-amc.example',
    scope: ['market:read', 'account:read', 'trade:write', 'portfolio:read'],
    reviewedBy: '合规组-王悦', score: 64,
  },
  {
    id: 'AUD-005', applicant: '吴敏', orgName: '深圳某科技公司', orgType: '科技',
    useCase: '终端产品嵌入行情', status: 'rejected', submittedAt: '2026-06-28', reviewNote: '未达机构准入门槛，建议以个人开发者接入',
    kybLevel: 1, expectedRps: 200, contact: '+86-755-****-7890', email: 'min.wu@example',
    scope: ['market:read'],
    reviewedBy: '合规组-李航', score: 42,
  },
];

// === 代码示例（8 个） ===
const CODE_EXAMPLES: CodeExample[] = [
  {
    id: 'EX-001', title: '获取 BTC/USDT 实时 K 线', api: 'GET /v1/market/klines', lang: 'curl',
    scenario: '公共行情', difficulty: 'beginner',
    code: 'curl -X GET "https://api.zsdex.io/v1/market/klines?symbol=BTCUSDT&interval=1m&limit=100" \\
  -H "X-API-Key: $ZSDX_API_KEY"',
    description: '使用 cURL 获取 BTC/USDT 1 分钟 K 线，limit 最大 1000',
    tags: ['行情', 'K 线', '基础'], updatedAt: '2026-07-15', runs: 12_840,
  },
  {
    id: 'EX-002', title: 'TypeScript 下单', api: 'POST /v1/order/create', lang: 'typescript',
    scenario: '签名交易', difficulty: 'intermediate',
    code: 'import { Zsdex } from "@zsdex/sdk-typescript";

const client = new Zsdex({
  apiKey: process.env.ZSDX_KEY!,
  apiSecret: process.env.ZSDX_SECRET!,
});

const order = await client.order.create({
  symbol: "BTCUSDT",
  side: "BUY",
  type: "LIMIT",
  price: "68000.50",
  quantity: "0.01",
  timeInForce: "GTC",
});

console.log("订单 ID:", order.orderId);',
    description: '使用 TypeScript SDK 提交限价单，含完整类型提示',
    tags: ['交易', 'SDK', 'TS'], updatedAt: '2026-07-12', runs: 8_240,
  },
  {
    id: 'EX-003', title: 'Python 异步订阅行情', api: 'WS /v1/market/stream', lang: 'python',
    scenario: '实时行情', difficulty: 'intermediate',
    code: 'import asyncio
from zsdex import AsyncClient

async def main():
    client = AsyncClient(api_key="...")
    ws = client.market.stream(symbols=["BTCUSDT", "ETHUSDT"])
    async for tick in ws:
        print(f"{tick.symbol}: {tick.price}")

asyncio.run(main())',
    description: 'Python SDK 异步 WebSocket 订阅多交易对行情',
    tags: ['行情', 'WS', 'Python'], updatedAt: '2026-07-10', runs: 4_180,
  },
  {
    id: 'EX-004', title: 'Go 并发下单', api: 'POST /v1/order/create', lang: 'go',
    scenario: '高频交易', difficulty: 'advanced',
    code: 'package main

import (
    "context"
    "github.com/zsdex/zsdex-go/client"
)

func main() {
    c := client.New("API_KEY", "API_SECRET")
    for i := 0; i < 100; i++ {
        go func() {
            _, err := c.Order.Create(context.Background(), &client.OrderReq{
                Symbol: "BTCUSDT", Side: "BUY", Type: "MARKET",
                Quantity: "0.001",
            })
        }()
    }
}',
    description: 'Go SDK 并发 100 个市价单，演示高并发场景',
    tags: ['交易', 'Go', '高并发'], updatedAt: '2026-07-08', runs: 1_240,
  },
  {
    id: 'EX-005', title: 'Java 充值地址查询', api: 'GET /v1/wallet/deposit-address', lang: 'java',
    scenario: '钱包操作', difficulty: 'beginner',
    code: 'ZsdexClient client = new ZsdexClient("API_KEY", "API_SECRET");
DepositAddress addr = client.wallet().getDepositAddress("USDT", "ETH");
System.out.println("充值地址: " + addr.getAddress());
System.out.println("Memo: " + addr.getMemo());',
    description: 'Java SDK 查询 USDT-ETH 充值地址',
    tags: ['钱包', 'Java', '基础'], updatedAt: '2026-07-06', runs: 2_640,
  },
  {
    id: 'EX-006', title: 'Webhook 签名验证', api: 'POST /v1/webhook/verify', lang: 'python',
    scenario: '回调处理', difficulty: 'advanced',
    code: 'from zsdex.webhook import Webhook

wh = Webhook(secret="whsec_****")

@app.post("/hooks/order")
async def order_hook(req: Request):
    payload = await req.body()
    sig = req.headers["X-Zsdex-Signature"]
    if not wh.verify(payload, sig):
        raise HTTPException(403, "Invalid signature")
    event = wh.parse(payload)
    handle_event(event)',
    description: '验证 Webhook 签名并解析事件（HMAC-SHA256）',
    tags: ['回调', '安全', 'Python'], updatedAt: '2026-07-14', runs: 1_840,
  },
  {
    id: 'EX-007', title: 'Rust 错误重试', api: 'POST /v1/order/create', lang: 'rust',
    scenario: '容错处理', difficulty: 'advanced',
    code: 'use zsdex::{Client, Error};

#[tokio::main]
async fn main() -> Result<(), Error> {
    let c = Client::new("KEY", "SECRET");
    let order = c.order().create()
        .symbol("BTCUSDT")
        .side("BUY")
        .send_retry(3)  // 失败重试 3 次
        .await?;
    println!("{:?}", order);
    Ok(())
}',
    description: 'Rust SDK 自动重试 + 指数退避',
    tags: ['错误处理', 'Rust', '重试'], updatedAt: '2026-07-11', runs: 642,
  },
  {
    id: 'EX-008', title: 'cURL 风控预检', api: 'POST /v1/risk/precheck', lang: 'curl',
    scenario: '风控', difficulty: 'beginner',
    code: 'curl -X POST "https://api.zsdex.io/v1/risk/precheck" \\
  -H "X-API-Key: $ZSDX_KEY" \\
  -H "X-Signature: $SIG" \\
  -d '{"symbol":"BTCUSDT","side":"BUY","quantity":"0.5"}'',
    description: '下单前风控预检，拦截可疑订单',
    tags: ['风控', '基础'], updatedAt: '2026-07-09', runs: 3_280,
  },
];

// === 变更日志（10 条） ===
const CHANGELOG_ENTRIES: ChangelogEntry[] = [
  {
    id: 'CL-001', version: 'v2.4.1', type: 'feature', title: '新增策略信号 WebSocket API',
    description: '新增 /v1/strategy/signal WebSocket 端点，支持实时订阅量化策略信号',
    releasedAt: '2026-07-19', affects: ['API', 'SDK-TS', 'SDK-PY'], migration: '无需迁移',
    author: 'zsdex-core', pr: '#1248', reactions: 86,
  },
  {
    id: 'CL-002', version: 'v2.4.0', type: 'feature', title: '机构信用额度 API 公测',
    description: '新增 /v1/institution/credit 端点，机构用户可查询信用额度与已用占比',
    releasedAt: '2026-07-12', affects: ['API', 'SDK-TS', 'SDK-GO'], migration: '无需迁移',
    author: 'zsdex-core', pr: '#1192', reactions: 124,
  },
  {
    id: 'CL-003', version: 'v2.3.5', type: 'fix', title: '修复行情深度数据偶发延迟',
    description: '修复 /v1/market/depth 在行情高峰时段 p95 延迟突增问题',
    releasedAt: '2026-07-08', affects: ['API'], migration: '无需迁移',
    author: 'zsdex-market', pr: '#1178', reactions: 42,
  },
  {
    id: 'CL-004', version: 'v2.3.4', type: 'security', title: '强化 Webhook 签名验证',
    description: 'Webhook 签名算法升级为 HMAC-SHA256（含时间戳防重放）',
    releasedAt: '2026-07-05', affects: ['API', 'SDK-TS', 'SDK-PY', 'SDK-GO'], migration: '8 月 1 日前完成升级',
    author: 'zsdex-security', pr: '#1156', reactions: 96,
  },
  {
    id: 'CL-005', version: 'v2.3.0', type: 'deprecation', title: '弃用 /v1/order/trades',
    description: '历史成交查询接口弃用，请迁移至 /v1/order/history',
    releasedAt: '2026-06-15', affects: ['API'], migration: '使用 /v1/order/history 替代',
    author: 'zsdex-core', pr: '#1102', reactions: 28,
  },
  {
    id: 'CL-006', version: 'v2.2.0', type: 'feature', title: '资产组合 API',
    description: '新增 /v1/portfolio/holdings 端点，查询智能投顾资产组合',
    releasedAt: '2026-06-01', affects: ['API', 'SDK-TS'], migration: '无需迁移',
    author: 'zsdex-core', pr: '#1068', reactions: 68,
  },
  {
    id: 'CL-007', version: 'v2.1.0', type: 'breaking', title: '下单接口 v1 → v2',
    description: '下单接口从 /v1/order/create 迁移至 /v2/order/create，参数结构调整',
    releasedAt: '2026-05-20', affects: ['API', '所有 SDK'], migration: '参考迁移指南 /docs/migration/v2-order',
    author: 'zsdex-core', pr: '#1024', reactions: 184,
  },
  {
    id: 'CL-008', version: 'v2.0.5', type: 'fix', title: '修复沙箱模式偶发签名错误',
    description: '修复沙箱环境 HMAC 签名在大请求量下偶发失败问题',
    releasedAt: '2026-05-12', affects: ['API', '所有 SDK'], migration: '无需迁移',
    author: 'zsdex-core', pr: '#1006', reactions: 36,
  },
  {
    id: 'CL-009', version: 'v2.0.0', type: 'feature', title: 'v2 大版本发布',
    description: 'API v2 大版本发布，性能提升 40%，支持 9 语言 SDK',
    releasedAt: '2026-04-01', affects: ['API', '所有 SDK'], migration: '参考 /docs/migration/v2',
    author: 'zsdex-core', pr: '#948', reactions: 286,
  },
  {
    id: 'CL-010', version: 'v1.8.0', type: 'fix', title: 'KYC 状态查询性能优化',
    description: 'KYC 状态查询接口增加缓存，p95 延迟从 240ms 降至 84ms',
    releasedAt: '2026-03-15', affects: ['API'], migration: '无需迁移',
    author: 'zsdex-core', pr: '#896', reactions: 52,
  },
];

// === 服务状态（8 个） ===
const SERVICE_STATUS: ServiceStatusItem[] = [
  {
    id: 'SV-001', name: '市场行情 API', state: 'operational', uptime: 99.98, latencyP50: 18, latencyP95: 42, errorRate: 0.06,
    region: 'global', lastIncident: '2026-05-08 14:32', incidents30d: 0,
    description: '行情 / K 线 / 深度 / Ticker 端点', dependencies: ['行情引擎 v3', 'Redis Cluster'],
  },
  {
    id: 'SV-002', name: '账户 API', state: 'operational', uptime: 99.96, latencyP50: 42, latencyP95: 84, errorRate: 0.12,
    region: 'global', lastIncident: '2026-06-12 09:18', incidents30d: 1,
    description: '账户 / 余额 / KYC 状态', dependencies: ['账户服务', 'KYC 服务'],
  },
  {
    id: 'SV-003', name: '交易 API', state: 'degraded', uptime: 99.82, latencyP50: 86, latencyP95: 248, errorRate: 0.42,
    region: '亚太', lastIncident: '2026-07-21 09:42', incidents30d: 2,
    description: '下单 / 撤单 / 批量操作（当前 p95 升高）', dependencies: ['撮合引擎', '风控服务'],
  },
  {
    id: 'SV-004', name: '钱包 API', state: 'operational', uptime: 99.94, latencyP50: 96, latencyP95: 186, errorRate: 0.22,
    region: 'global', lastIncident: '2026-07-08 22:14', incidents30d: 1,
    description: '充值 / 提现 / 链上交互', dependencies: ['链适配器', '签名服务'],
  },
  {
    id: 'SV-005', name: '机构 API', state: 'operational', uptime: 99.92, latencyP50: 124, latencyP95: 218, errorRate: 0.18,
    region: 'global', lastIncident: '2026-07-02 16:48', incidents30d: 1,
    description: '机构账户 / 信用额度 / 大宗撮合', dependencies: ['机构服务', '信用引擎'],
  },
  {
    id: 'SV-006', name: '策略信号 WS', state: 'operational', uptime: 99.88, latencyP50: 14, latencyP95: 28, errorRate: 0.05,
    region: '亚太', lastIncident: '2026-07-15 11:20', incidents30d: 1,
    description: 'WebSocket 实时信号分发', dependencies: ['消息总线', '策略引擎'],
  },
  {
    id: 'SV-007', name: 'Webhook 投递', state: 'maintenance', uptime: 99.78, latencyP50: 88, latencyP95: 168, errorRate: 0.32,
    region: 'global', lastIncident: '2026-07-21 11:00', incidents30d: 2,
    description: '回调事件投递（当前维护中，暂停新增订阅）', dependencies: ['消息队列', '签名服务'],
  },
  {
    id: 'SV-008', name: '管理 API', state: 'operational', uptime: 99.96, latencyP50: 64, latencyP95: 124, errorRate: 0.08,
    region: 'global', lastIncident: '2026-06-22 18:14', incidents30d: 1,
    description: '管理员后台 API', dependencies: ['管理服务'],
  },
];


// ============================================================
// 样式
// ============================================================

const STYLES = `
.dev-stagger > * { animation: dev-fade-in .4s ease-out both; }
.dev-stagger > *:nth-child(1) { animation-delay: 0ms; }
.dev-stagger > *:nth-child(2) { animation-delay: 50ms; }
.dev-stagger > *:nth-child(3) { animation-delay: 100ms; }
.dev-stagger > *:nth-child(4) { animation-delay: 150ms; }
.dev-stagger > *:nth-child(5) { animation-delay: 200ms; }
.dev-stagger > *:nth-child(6) { animation-delay: 250ms; }
.dev-stagger > *:nth-child(7) { animation-delay: 300ms; }
.dev-stagger > *:nth-child(8) { animation-delay: 350ms; }

@keyframes dev-fade-in { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
@keyframes dev-pulse { 0%, 100% { opacity: 1; } 50% { opacity: .55; } }
@keyframes dev-shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
@keyframes dev-slide-in { from { transform: translateX(100%); } to { transform: translateX(0); } }
@keyframes dev-bar { from { transform: scaleX(0); } to { transform: scaleX(1); } }
@keyframes dev-float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-4px); } }
@keyframes dev-blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }

.dev-pulse { animation: dev-pulse 2s ease-in-out infinite; }
.dev-shimmer { background: linear-gradient(90deg, transparent 0%, rgba(20,184,129,0.15) 50%, transparent 100%); background-size: 200% 100%; animation: dev-shimmer 2.5s linear infinite; }
.dev-slide-in { animation: dev-slide-in .35s ease-out; }
.dev-bar { transform-origin: left; animation: dev-bar .8s ease-out; }
.dev-float { animation: dev-float 3s ease-in-out infinite; }
.dev-blink { animation: dev-blink 1s steps(2) infinite; }

.code-scroll::-webkit-scrollbar { height: 8px; width: 8px; }
.code-scroll::-webkit-scrollbar-track { background: rgba(20,20,20,0.5); }
.code-scroll::-webkit-scrollbar-thumb { background: rgba(20,184,129,0.3); border-radius: 4px; }
.code-scroll::-webkit-scrollbar-thumb:hover { background: rgba(20,184,129,0.5); }
`;

// ============================================================
// 通用 KpiCard
// ============================================================

function KpiCard({ label, value, sub, icon, color, pulse }: { label: string; value: string; sub?: string; icon: React.ReactNode; color?: string; pulse?: boolean }) {
  return (
    <div className="rounded-xl p-4 border" style={{ background: BRAND.bgCard, borderColor: BRAND.border }}>
      <div className="flex items-start justify-between mb-2">
        <span className="text-xs" style={{ color: BRAND.textSub }}>{label}</span>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: (color || BRAND.primary) + '20', color: color || BRAND.primary }}>
          {icon}
        </div>
      </div>
      <div className="text-2xl font-bold mb-1" style={{ color: BRAND.text }}>{value}</div>
      {sub && <div className="text-[11px]" style={{ color: pulse ? BRAND.success : BRAND.textMute }}>{sub}</div>}
    </div>
  );
}

// ============================================================
// 主组件
// ============================================================

// ============================================================
// 总览 Tab
// ============================================================
function OverviewTab({ onApi, onSdk, onService, onChange }: { onApi: (a: ApiEndpoint) => void; onSdk: (s: SdkPackage) => void; onService: (s: ServiceStatusItem) => void; onChange: (c: ChangelogEntry) => void }) {
  return (
    <div className="space-y-6 dev-stagger">
      <div className="rounded-xl p-6 border" style={{ background: BRAND.bgCard, borderColor: BRAND.border }}>
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center dev-float" style={{ background: 'rgba(20,184,129,0.12)', color: BRAND.primary }}>
            <Code className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold mb-2" style={{ color: BRAND.text }}>开发者门户 · 一站式接入平台</h3>
            <p className="text-sm mb-3" style={{ color: BRAND.textSub }}>
              平台开放 <strong style={{ color: BRAND.primary }}>248 个 API 端点</strong>、<strong style={{ color: BRAND.primary }}>9 语言 SDK</strong>、<strong style={{ color: BRAND.primary }}>5 档配额</strong>、<strong style={{ color: BRAND.primary }}>5,800+ 沙箱密钥</strong>、<strong style={{ color: BRAND.primary }}>6 类 Webhook</strong>、<strong style={{ color: BRAND.primary }}>12 错误码</strong>、<strong style={{ color: BRAND.primary }}>5 接入审核流程</strong>、<strong style={{ color: BRAND.primary }}>8 服务状态</strong>。
              月 API 调用 1.28 亿次，p95 延迟 78ms，Webhook 投递成功率 99.82%。SDK 累计下载 86.4 万次，9 语言覆盖 Web/移动/后端。
            </p>
            <div className="flex flex-wrap gap-2 text-[11px]">
              {['REST', 'WebSocket', 'gRPC', '9 语言 SDK', '沙箱模式', 'Mock 数据', 'Webhook 回调', 'OpenAPI 3.1', '错误码字典'].map(t => (
                <span key={t} className="px-2 py-0.5 rounded" style={{ background: 'rgba(20,184,129,0.10)', color: BRAND.primary }}>{t}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 三列：API 端点 / SDK / 服务状态 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="rounded-xl p-4 border" style={{ background: BRAND.bgCard, borderColor: BRAND.border }}>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold" style={{ color: BRAND.text }}>热门 API 端点</h4>
            <span className="text-[10px]" style={{ color: BRAND.textMute }}>Top 5 by 24h 调用</span>
          </div>
          <div className="space-y-2">
            {API_ENDPOINTS.slice().sort((a, b) => b.calls24h - a.calls24h).slice(0, 5).map((api, i) => (
              <button key={api.id} onClick={() => onApi(api)} className="w-full flex items-center gap-2 p-2 rounded text-left hover:scale-[1.01] transition-transform" style={{ background: BRAND.bgCardHover }}>
                <span className="text-[10px] font-mono" style={{ color: BRAND.textMute }}>#{i + 1}</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded" style={{ background: METHOD_COLOR[api.method] + '20', color: METHOD_COLOR[api.method] }}>{api.method}</span>
                <span className="text-xs flex-1 truncate" style={{ color: BRAND.text }}>{api.name}</span>
                <span className="text-[10px]" style={{ color: BRAND.textSub }}>{formatInt(api.calls24h)}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-xl p-4 border" style={{ background: BRAND.bgCard, borderColor: BRAND.border }}>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold" style={{ color: BRAND.text }}>SDK 下载 Top 5</h4>
            <span className="text-[10px]" style={{ color: BRAND.textMute }}>Top 5 by 累计下载</span>
          </div>
          <div className="space-y-2">
            {SDK_PACKAGES.slice().sort((a, b) => b.downloads - a.downloads).slice(0, 5).map((sdk, i) => (
              <button key={sdk.id} onClick={() => onSdk(sdk)} className="w-full flex items-center gap-2 p-2 rounded text-left hover:scale-[1.01] transition-transform" style={{ background: BRAND.bgCardHover }}>
                <span className="text-[10px] font-mono" style={{ color: BRAND.textMute }}>#{i + 1}</span>
                <div className="w-7 h-7 rounded flex items-center justify-center text-[10px] font-bold" style={{ background: LANG_COLOR[sdk.lang] + '20', color: LANG_COLOR[sdk.lang] }}>{LANG_ICON[sdk.lang]}</div>
                <span className="text-xs flex-1 truncate" style={{ color: BRAND.text }}>{sdk.lang}</span>
                <span className="text-[10px]" style={{ color: BRAND.textSub }}>{formatInt(sdk.downloads)}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-xl p-4 border" style={{ background: BRAND.bgCard, borderColor: BRAND.border }}>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold" style={{ color: BRAND.text }}>服务实时状态</h4>
            <span className="text-[10px] flex items-center gap-1" style={{ color: BRAND.textMute }}>
              <span className="w-1.5 h-1.5 rounded-full dev-blink" style={{ background: BRAND.success }}></span>
              实时
            </span>
          </div>
          <div className="space-y-2">
            {SERVICE_STATUS.slice(0, 5).map(svc => {
              const b = statusBadge(svc.state);
              return (
                <button key={svc.id} onClick={() => onService(svc)} className="w-full flex items-center gap-2 p-2 rounded text-left hover:scale-[1.01] transition-transform" style={{ background: BRAND.bgCardHover }}>
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: b.color }}></span>
                  <span className="text-xs flex-1 truncate" style={{ color: BRAND.text }}>{svc.name}</span>
                  <span className="text-[10px] font-mono" style={{ color: b.color }}>{b.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 最近变更 */}
      <div className="rounded-xl p-4 border" style={{ background: BRAND.bgCard, borderColor: BRAND.border }}>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-semibold" style={{ color: BRAND.text }}>最近变更</h4>
          <span className="text-[10px]" style={{ color: BRAND.textMute }}>近 30 天</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {CHANGELOG_ENTRIES.slice(0, 4).map(cl => {
            const b = statusBadge(cl.type);
            return (
              <button key={cl.id} onClick={() => onChange(cl)} className="flex items-start gap-3 p-3 rounded-lg text-left hover:scale-[1.01] transition-transform" style={{ background: BRAND.bgCardHover }}>
                <span className="px-2 py-0.5 rounded text-[10px] font-medium" style={{ background: b.bg, color: b.color }}>{b.label}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium mb-0.5" style={{ color: BRAND.text }}>{cl.version} · {cl.title}</div>
                  <div className="text-[11px] line-clamp-1" style={{ color: BRAND.textSub }}>{cl.description}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 接入流程 */}
      <div className="rounded-xl p-4 border" style={{ background: 'rgba(20,184,129,0.05)', borderColor: BRAND.border }}>
        <h4 className="text-sm font-semibold mb-3" style={{ color: BRAND.text }}>5 步接入流程</h4>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
          {[
            { n: '1', t: '注册开发者', d: '提交机构 / 个人资料' },
            { n: '2', t: '创建沙箱密钥', d: '获取 sk_sb_**** 密钥' },
            { n: '3', t: '下载 SDK', d: '选择语言一键安装' },
            { n: '4', t: '阅读 API 文档', d: 'OpenAPI + 代码示例' },
            { n: '5', t: '提交接入审核', d: 'KYB + 资质审核' },
          ].map((s, i) => (
            <div key={i} className="rounded-lg p-3" style={{ background: BRAND.bgCard }}>
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold mb-2" style={{ background: BRAND.primaryLt, color: BRAND.primary }}>{s.n}</div>
              <div className="text-xs font-semibold mb-1" style={{ color: BRAND.text }}>{s.t}</div>
              <div className="text-[10px]" style={{ color: BRAND.textSub }}>{s.d}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// API 目录 Tab
// ============================================================
function ApiTab({ onSelect }: { onSelect: (a: ApiEndpoint) => void }) {
  const [cat, setCat] = useState<ApiCategory | 'all'>('all');
  const [stat, setStat] = useState<string>('all');
  const list = useMemo(() => API_ENDPOINTS.filter(a => (cat === 'all' || a.category === cat) && (stat === 'all' || a.status === stat)), [cat, stat]);
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <button onClick={() => setCat('all')} className="px-2.5 py-1 rounded text-[11px]" style={{ background: cat === 'all' ? BRAND.primaryLt : BRAND.bgCardHover, color: cat === 'all' ? BRAND.primary : BRAND.textSub }}>全部</button>
        {(Object.keys(CAT_ICON) as ApiCategory[]).map(c => (
          <button key={c} onClick={() => setCat(c)} className="px-2.5 py-1 rounded text-[11px]" style={{ background: cat === c ? BRAND.primaryLt : BRAND.bgCardHover, color: cat === c ? BRAND.primary : BRAND.textSub }}>{CAT_ICON[c]}</button>
        ))}
        <div className="w-px h-4" style={{ background: BRAND.border }}></div>
        <button onClick={() => setStat('all')} className="px-2.5 py-1 rounded text-[11px]" style={{ background: stat === 'all' ? BRAND.primaryLt : BRAND.bgCardHover, color: stat === 'all' ? BRAND.primary : BRAND.textSub }}>全部状态</button>
        {['stable', 'beta', 'new', 'deprecated'].map(s => (
          <button key={s} onClick={() => setStat(s)} className="px-2.5 py-1 rounded text-[11px]" style={{ background: stat === s ? BRAND.primaryLt : BRAND.bgCardHover, color: stat === s ? BRAND.primary : BRAND.textSub }}>{statusBadge(s).label}</button>
        ))}
      </div>
      <div className="rounded-xl border overflow-hidden" style={{ borderColor: BRAND.border }}>
        <div className="grid grid-cols-12 gap-2 px-3 py-2 text-[10px] font-medium" style={{ background: BRAND.bgCardHover, color: BRAND.textSub }}>
          <div className="col-span-1">方法</div>
          <div className="col-span-4">端点</div>
          <div className="col-span-2">分类</div>
          <div className="col-span-1 text-right">24h 调用</div>
          <div className="col-span-1 text-right">p95</div>
          <div className="col-span-1 text-right">错误</div>
          <div className="col-span-2">状态</div>
        </div>
        {list.map(api => {
          const sb = statusBadge(api.status);
          return (
            <button key={api.id} onClick={() => onSelect(api)} className="w-full grid grid-cols-12 gap-2 px-3 py-2.5 text-left text-xs border-t hover:scale-[1.005] transition-transform" style={{ borderColor: BRAND.border, color: BRAND.text }}>
              <div className="col-span-1"><span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold" style={{ background: METHOD_COLOR[api.method] + '20', color: METHOD_COLOR[api.method] }}>{api.method}</span></div>
              <div className="col-span-4 min-w-0"><div className="font-medium truncate">{api.name}</div><div className="text-[10px] font-mono truncate" style={{ color: BRAND.textMute }}>{api.path}</div></div>
              <div className="col-span-2 text-[11px]" style={{ color: BRAND.textSub }}>{CAT_ICON[api.category]}</div>
              <div className="col-span-1 text-right font-mono" style={{ color: BRAND.text }}>{formatInt(api.calls24h)}</div>
              <div className="col-span-1 text-right font-mono" style={{ color: BRAND.textSub }}>{api.p95LatencyMs}ms</div>
              <div className="col-span-1 text-right font-mono" style={{ color: api.errorRate > 0.3 ? BRAND.danger : BRAND.textSub }}>{api.errorRate.toFixed(2)}%</div>
              <div className="col-span-2"><span className="px-1.5 py-0.5 rounded text-[10px]" style={{ background: sb.bg, color: sb.color }}>{sb.label}</span></div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================
// SDK 下载 Tab
// ============================================================
function SdkTab({ onSelect }: { onSelect: (s: SdkPackage) => void }) {
  const [lang, setLang] = useState<SdkLang | 'all'>('all');
  const list = useMemo(() => SDK_PACKAGES.filter(s => lang === 'all' || s.lang === lang), [lang]);
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <button onClick={() => setLang('all')} className="px-2.5 py-1 rounded text-[11px]" style={{ background: lang === 'all' ? BRAND.primaryLt : BRAND.bgCardHover, color: lang === 'all' ? BRAND.primary : BRAND.textSub }}>全部 ({SDK_PACKAGES.length})</button>
        {SDK_PACKAGES.map(s => (
          <button key={s.id} onClick={() => setLang(s.lang)} className="px-2.5 py-1 rounded text-[11px] flex items-center gap-1.5" style={{ background: lang === s.lang ? BRAND.primaryLt : BRAND.bgCardHover, color: lang === s.lang ? BRAND.primary : BRAND.textSub }}>
            <div className="w-4 h-4 rounded flex items-center justify-center text-[8px] font-bold" style={{ background: LANG_COLOR[s.lang] + '30', color: LANG_COLOR[s.lang] }}>{LANG_ICON[s.lang]}</div>
            {s.lang}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 dev-stagger">
        {list.map(sdk => {
          const sb = statusBadge(sdk.status);
          return (
            <button key={sdk.id} onClick={() => onSelect(sdk)} className="rounded-xl p-4 border text-left hover:scale-[1.01] transition-transform" style={{ background: BRAND.bgCard, borderColor: BRAND.border }}>
              <div className="flex items-start gap-3 mb-3">
                <div className="w-12 h-12 rounded-lg flex items-center justify-center text-base font-bold" style={{ background: LANG_COLOR[sdk.lang] + '20', color: LANG_COLOR[sdk.lang] }}>{LANG_ICON[sdk.lang]}</div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold mb-0.5 truncate" style={{ color: BRAND.text }}>{sdk.name}</div>
                  <div className="text-[10px] font-mono" style={{ color: BRAND.textMute }}>{sdk.version} · {formatBytes(sdk.size)}</div>
                </div>
                <span className="px-1.5 py-0.5 rounded text-[10px]" style={{ background: sb.bg, color: sb.color }}>{sb.label}</span>
              </div>
              <div className="text-[11px] mb-2 line-clamp-2" style={{ color: BRAND.textSub }}>{sdk.description}</div>
              <div className="grid grid-cols-3 gap-2 text-[10px] mb-2">
                <div><div style={{ color: BRAND.textMute }}>下载</div><div className="font-mono" style={{ color: BRAND.text }}>{formatInt(sdk.downloads)}</div></div>
                <div><div style={{ color: BRAND.textMute }}>Star</div><div className="font-mono" style={{ color: BRAND.text }}>{formatInt(sdk.stars)}</div></div>
                <div><div style={{ color: BRAND.textMute }}>Issue</div><div className="font-mono" style={{ color: BRAND.text }}>{sdk.openIssues}</div></div>
              </div>
              <div className="text-[10px] font-mono truncate px-2 py-1 rounded" style={{ background: BRAND.bgCardHover, color: BRAND.primary }}>{sdk.installCmd}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================
// 沙箱环境 Tab
// ============================================================
function SandboxTab({ onSelect }: { onSelect: (s: SandboxKey) => void }) {
  return (
    <div className="space-y-4">
      <div className="rounded-xl p-4 border" style={{ background: 'rgba(20,184,129,0.05)', borderColor: BRAND.border }}>
        <h4 className="text-sm font-semibold mb-2" style={{ color: BRAND.text }}>沙箱环境说明</h4>
        <p className="text-xs" style={{ color: BRAND.textSub }}>
          沙箱为隔离测试环境，<strong style={{ color: BRAND.primary }}>不涉及真实资产</strong>，所有数据为模拟。提供 4 种环境：sandbox（默认）/ mock（纯模拟）/ replay（历史回放）/ chaos（故障注入）。
          沙箱密钥具有完整的 IP 白名单 / scopes / 限速控制，到期自动失效，敏感操作自动审计。
        </p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 dev-stagger">
        {SANDBOX_KEYS.map(sk => {
          const sb = statusBadge(sk.status);
          const usagePct = (sk.callsToday / sk.callsLimit) * 100;
          return (
            <button key={sk.id} onClick={() => onSelect(sk)} className="rounded-xl p-4 border text-left hover:scale-[1.005] transition-transform" style={{ background: BRAND.bgCard, borderColor: BRAND.border }}>
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold mb-0.5" style={{ color: BRAND.text }}>{sk.name}</div>
                  <div className="text-[10px] font-mono" style={{ color: BRAND.textMute }}>{sk.keyPrefix}</div>
                </div>
                <span className="px-1.5 py-0.5 rounded text-[10px]" style={{ background: sb.bg, color: sb.color }}>{sb.label}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-[10px] mb-2">
                <div><div style={{ color: BRAND.textMute }}>环境</div><div style={{ color: BRAND.text }}>{sk.env}</div></div>
                <div><div style={{ color: BRAND.textMute }}>套餐</div><div style={{ color: BRAND.text }}>{sk.tier}</div></div>
                <div><div style={{ color: BRAND.textMute }}>速率</div><div style={{ color: BRAND.text }}>{sk.rateLimit}</div></div>
              </div>
              <div className="mb-1 flex items-center justify-between text-[10px]">
                <span style={{ color: BRAND.textMute }}>今日用量</span>
                <span className="font-mono" style={{ color: usagePct > 80 ? BRAND.danger : usagePct > 50 ? BRAND.amber : BRAND.success }}>{formatInt(sk.callsToday)} / {formatInt(sk.callsLimit)} ({usagePct.toFixed(1)}%)</span>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: BRAND.bgCardHover }}>
                <div className="h-full dev-bar" style={{ width: Math.min(100, usagePct) + '%', background: usagePct > 80 ? BRAND.danger : usagePct > 50 ? BRAND.amber : BRAND.primary }}></div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================
// Webhook Tab
// ============================================================
function WebhookTab({ onSelect }: { onSelect: (w: WebhookEvent) => void }) {
  return (
    <div className="space-y-4">
      <div className="rounded-xl p-4 border" style={{ background: 'rgba(20,184,129,0.05)', borderColor: BRAND.border }}>
        <h4 className="text-sm font-semibold mb-2" style={{ color: BRAND.text }}>Webhook 投递说明</h4>
        <p className="text-xs" style={{ color: BRAND.textSub }}>
          Webhook 通过 HMAC-SHA256 签名验证（含时间戳防重放），采用<strong style={{ color: BRAND.primary }}>指数退避重试策略</strong>（最多 5 次），支持事件过滤与多端点冗余投递。投递失败 24h 后自动暂停，管理员可手动恢复。
        </p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 dev-stagger">
        {WEBHOOK_EVENTS.map(wh => {
          const sb = statusBadge(wh.status);
          return (
            <button key={wh.id} onClick={() => onSelect(wh)} className="rounded-xl p-4 border text-left hover:scale-[1.005] transition-transform" style={{ background: BRAND.bgCard, borderColor: BRAND.border }}>
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold mb-0.5" style={{ color: BRAND.text }}>{wh.name}</div>
                  <div className="text-[10px] font-mono truncate" style={{ color: BRAND.textMute }}>{wh.endpoint}</div>
                </div>
                <span className="px-1.5 py-0.5 rounded text-[10px]" style={{ background: sb.bg, color: sb.color }}>{sb.label}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-[10px] mb-2">
                <div><div style={{ color: BRAND.textMute }}>24h 投递</div><div className="font-mono" style={{ color: BRAND.text }}>{formatInt(wh.deliveries24h)}</div></div>
                <div><div style={{ color: BRAND.textMute }}>成功率</div><div className="font-mono" style={{ color: wh.successRate > 99.5 ? BRAND.success : wh.successRate > 99 ? BRAND.amber : BRAND.danger }}>{wh.successRate.toFixed(2)}%</div></div>
                <div><div style={{ color: BRAND.textMute }}>重试</div><div className="font-mono" style={{ color: BRAND.text }}>{wh.retries}</div></div>
              </div>
              <div className="flex flex-wrap gap-1">
                {wh.events.slice(0, 3).map((e, i) => (
                  <span key={i} className="px-1.5 py-0.5 rounded text-[9px] font-mono" style={{ background: BRAND.bgCardHover, color: BRAND.textSub }}>{e}</span>
                ))}
                {wh.events.length > 3 && <span className="text-[9px]" style={{ color: BRAND.textMute }}>+{wh.events.length - 3}</span>}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================
// 限额配额 Tab
// ============================================================
function QuotaTab({ onSelect }: { onSelect: (q: QuotaUsage) => void }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 dev-stagger">
        {QUOTA_USAGES.map(q => (
          <button key={q.id} onClick={() => onSelect(q)} className="rounded-xl p-4 border text-left hover:scale-[1.02] transition-transform" style={{ background: BRAND.bgCard, borderColor: BRAND.border }}>
            <div className="text-sm font-semibold mb-2 capitalize" style={{ color: BRAND.text }}>{q.tier}</div>
            <div className="text-2xl font-bold mb-1 font-mono" style={{ color: BRAND.text }}>{q.callsPerMin.toLocaleString()}/min</div>
            <div className="text-[10px] mb-3" style={{ color: BRAND.textMute }}>{formatInt(q.callsPerDay)}/天 · {q.websocketConns} WS</div>
            <div className="mb-1 flex items-center justify-between text-[10px]">
              <span style={{ color: BRAND.textMute }}>使用率</span>
              <span className="font-mono" style={{ color: q.usedPct > 80 ? BRAND.danger : q.usedPct > 50 ? BRAND.amber : BRAND.success }}>{q.usedPct}%</span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: BRAND.bgCardHover }}>
              <div className="h-full dev-bar" style={{ width: q.usedPct + '%', background: q.usedPct > 80 ? BRAND.danger : q.usedPct > 50 ? BRAND.amber : BRAND.primary }}></div>
            </div>
            <div className="mt-2 h-8 flex items-end gap-0.5">
              {q.history.map((h, i) => (
                <div key={i} className="flex-1 rounded-t" style={{ height: h + '%', background: BRAND.primary, opacity: 0.6 }}></div>
              ))}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// 错误码 Tab
// ============================================================
function ErrorsTab({ onSelect }: { onSelect: (e: ErrorCode) => void }) {
  const [sev, setSev] = useState<string>('all');
  const [search, setSearch] = useState('');
  const list = useMemo(() => ERROR_CODES.filter(e => (sev === 'all' || e.severity === sev) && (search === '' || e.code.toLowerCase().includes(search.toLowerCase()) || e.message.includes(search))), [sev, search]);
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <input data-dev-search value={search} onChange={e => setSearch(e.target.value)} placeholder="搜索错误码 / 消息..." className="px-3 py-1.5 rounded-lg text-xs flex-1 min-w-[200px]" style={{ background: BRAND.bgCardHover, border: '1px solid ' + BRAND.border, color: BRAND.text, outline: 'none' }} />
        {['all', 'critical', 'error', 'warning', 'info'].map(s => (
          <button key={s} onClick={() => setSev(s)} className="px-2.5 py-1 rounded text-[11px]" style={{ background: sev === s ? BRAND.primaryLt : BRAND.bgCardHover, color: sev === s ? BRAND.primary : BRAND.textSub }}>{s === 'all' ? '全部' : statusBadge(s).label}</button>
        ))}
      </div>
      <div className="rounded-xl border overflow-hidden" style={{ borderColor: BRAND.border }}>
        {list.map(ec => {
          const sc = severityColor(ec.severity);
          return (
            <button key={ec.id} onClick={() => onSelect(ec)} className="w-full flex items-center gap-3 px-3 py-2.5 text-left text-xs border-t hover:scale-[1.005] transition-transform" style={{ borderColor: BRAND.border, color: BRAND.text }}>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono" style={{ background: sc.bg, color: sc.color }}>{ec.severity}</span>
              <span className="font-mono font-medium" style={{ color: BRAND.text }}>{ec.code}</span>
              <span className="flex-1 truncate" style={{ color: BRAND.textSub }}>{ec.message}</span>
              <span className="text-[10px] font-mono" style={{ color: BRAND.textMute }}>HTTP {ec.httpStatus}</span>
              <span className="text-[10px]" style={{ color: ec.retryable ? BRAND.success : BRAND.textMute }}>{ec.retryable ? '可重试' : '不可重试'}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================
// 接入审核 Tab
// ============================================================
function AuditTab({ onSelect }: { onSelect: (a: AuditApplication) => void }) {
  return (
    <div className="space-y-4">
      <div className="rounded-xl p-4 border" style={{ background: 'rgba(20,184,129,0.05)', borderColor: BRAND.border }}>
        <h4 className="text-sm font-semibold mb-2" style={{ color: BRAND.text }}>接入审核流程</h4>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-[11px]">
          {['提交申请', '材料初审', 'KYB 审核', '技术评估', '签约开通'].map((s, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold" style={{ background: BRAND.primaryLt, color: BRAND.primary }}>{i + 1}</span>
              <span style={{ color: BRAND.text }}>{s}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="space-y-2 dev-stagger">
        {AUDIT_APPLICATIONS.map(a => {
          const sb = statusBadge(a.status);
          return (
            <button key={a.id} onClick={() => onSelect(a)} className="w-full rounded-xl p-4 border text-left hover:scale-[1.005] transition-transform" style={{ background: BRAND.bgCard, borderColor: BRAND.border }}>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center text-xs font-bold" style={{ background: 'rgba(20,184,129,0.15)', color: BRAND.primary }}>{a.orgName.substring(0, 2).toUpperCase()}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-semibold" style={{ color: BRAND.text }}>{a.orgName}</span>
                    <span className="px-1.5 py-0.5 rounded text-[10px]" style={{ background: sb.bg, color: sb.color }}>{sb.label}</span>
                    <span className="text-[10px]" style={{ color: BRAND.textMute }}>· {a.orgType} · KYB L{a.kybLevel}</span>
                  </div>
                  <div className="text-[11px] mb-1" style={{ color: BRAND.textSub }}>申请人：{a.applicant} · 用途：{a.useCase}</div>
                  <div className="flex items-center gap-3 text-[10px]" style={{ color: BRAND.textMute }}>
                    <span>提交 {a.submittedAt}</span>
                    <span>期望 {a.expectedRps} RPS</span>
                    {a.score > 0 && <span className="font-mono" style={{ color: a.score >= 80 ? BRAND.success : a.score >= 60 ? BRAND.amber : BRAND.danger }}>评分 {a.score}</span>}
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================
// 代码示例 Tab
// ============================================================
function ExamplesTab({ onSelect }: { onSelect: (e: CodeExample) => void }) {
  const [lang, setLang] = useState<ExampleLang | 'all'>('all');
  const list = useMemo(() => CODE_EXAMPLES.filter(e => lang === 'all' || e.lang === lang), [lang]);
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {(['all', 'curl', 'typescript', 'python', 'go', 'java', 'rust'] as const).map(l => (
          <button key={l} onClick={() => setLang(l)} className="px-2.5 py-1 rounded text-[11px]" style={{ background: lang === l ? BRAND.primaryLt : BRAND.bgCardHover, color: lang === l ? BRAND.primary : BRAND.textSub }}>{l}</button>
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 dev-stagger">
        {list.map(ex => (
          <button key={ex.id} onClick={() => onSelect(ex)} className="rounded-xl p-4 border text-left hover:scale-[1.01] transition-transform" style={{ background: BRAND.bgCard, borderColor: BRAND.border }}>
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold mb-0.5" style={{ color: BRAND.text }}>{ex.title}</div>
                <div className="text-[10px] font-mono" style={{ color: BRAND.textMute }}>{ex.api}</div>
              </div>
              <span className="px-1.5 py-0.5 rounded text-[10px] capitalize" style={{ background: BRAND.primaryLt, color: BRAND.primary }}>{ex.lang}</span>
            </div>
            <pre className="text-[10px] font-mono p-2 rounded mb-2 overflow-hidden line-clamp-3" style={{ background: BRAND.bgCardHover, color: BRAND.textSub }}>{ex.code}</pre>
            <div className="flex items-center justify-between text-[10px]" style={{ color: BRAND.textMute }}>
              <span className="capitalize">{ex.difficulty}</span>
              <span>运行 {formatInt(ex.runs)}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// 变更日志 Tab
// ============================================================
function ChangelogTab({ onSelect }: { onSelect: (c: ChangelogEntry) => void }) {
  const [type, setType] = useState<string>('all');
  const list = useMemo(() => CHANGELOG_ENTRIES.filter(c => type === 'all' || c.type === type), [type]);
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {['all', 'feature', 'fix', 'security', 'deprecation', 'breaking'].map(t => (
          <button key={t} onClick={() => setType(t)} className="px-2.5 py-1 rounded text-[11px]" style={{ background: type === t ? BRAND.primaryLt : BRAND.bgCardHover, color: type === t ? BRAND.primary : BRAND.textSub }}>{t === 'all' ? '全部' : statusBadge(t).label}</button>
        ))}
      </div>
      <div className="space-y-2 dev-stagger">
        {list.map(cl => {
          const b = statusBadge(cl.type);
          return (
            <button key={cl.id} onClick={() => onSelect(cl)} className="w-full rounded-xl p-4 border text-left hover:scale-[1.005] transition-transform" style={{ background: BRAND.bgCard, borderColor: BRAND.border }}>
              <div className="flex items-start gap-3">
                <div className="flex flex-col items-center gap-1 min-w-[60px]">
                  <span className="font-mono text-sm font-bold" style={{ color: BRAND.text }}>{cl.version}</span>
                  <span className="px-1.5 py-0.5 rounded text-[10px]" style={{ background: b.bg, color: b.color }}>{b.label}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold mb-1" style={{ color: BRAND.text }}>{cl.title}</div>
                  <div className="text-[11px] mb-2" style={{ color: BRAND.textSub }}>{cl.description}</div>
                  <div className="flex flex-wrap items-center gap-2 text-[10px]" style={{ color: BRAND.textMute }}>
                    <span>{cl.releasedAt}</span>
                    <span>· {cl.author}</span>
                    <span>· {cl.pr}</span>
                    <span>· 👍 {cl.reactions}</span>
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================
// 服务状态 Tab
// ============================================================
function StatusTab({ onSelect }: { onSelect: (s: ServiceStatusItem) => void }) {
  return (
    <div className="space-y-4">
      <div className="rounded-xl p-4 border" style={{ background: 'rgba(20,184,129,0.05)', borderColor: BRAND.border }}>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full dev-blink" style={{ background: BRAND.success }}></span>
          <span className="text-sm font-semibold" style={{ color: BRAND.text }}>总体：所有核心 API 正常（1 个降级 / 1 个维护中）</span>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 dev-stagger">
        {SERVICE_STATUS.map(svc => {
          const b = statusBadge(svc.state);
          return (
            <button key={svc.id} onClick={() => onSelect(svc)} className="rounded-xl p-4 border text-left hover:scale-[1.005] transition-transform" style={{ background: BRAND.bgCard, borderColor: BRAND.border }}>
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ background: b.color }}></span>
                  <span className="text-sm font-semibold" style={{ color: BRAND.text }}>{svc.name}</span>
                </div>
                <span className="px-1.5 py-0.5 rounded text-[10px]" style={{ background: b.bg, color: b.color }}>{b.label}</span>
              </div>
              <div className="grid grid-cols-4 gap-2 text-[10px] mb-2">
                <div><div style={{ color: BRAND.textMute }}>可用率</div><div className="font-mono" style={{ color: BRAND.text }}>{svc.uptime.toFixed(2)}%</div></div>
                <div><div style={{ color: BRAND.textMute }}>p50</div><div className="font-mono" style={{ color: BRAND.text }}>{svc.latencyP50}ms</div></div>
                <div><div style={{ color: BRAND.textMute }}>p95</div><div className="font-mono" style={{ color: svc.latencyP95 > 200 ? BRAND.amber : BRAND.text }}>{svc.latencyP95}ms</div></div>
                <div><div style={{ color: BRAND.textMute }}>错误率</div><div className="font-mono" style={{ color: svc.errorRate > 0.3 ? BRAND.danger : BRAND.text }}>{svc.errorRate.toFixed(2)}%</div></div>
              </div>
              <div className="text-[10px]" style={{ color: BRAND.textMute }}>区域：{svc.region} · 30d 事故 {svc.incidents30d} 次</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================
// 帮助 Tab
// ============================================================
function HelpTab({ onOpen }: { onOpen: () => void }) {
  return (
    <div className="space-y-4 dev-stagger">
      <div className="rounded-xl p-5 border" style={{ background: BRAND.bgCard, borderColor: BRAND.border }}>
        <h4 className="text-sm font-semibold mb-3" style={{ color: BRAND.text }}>常见问题（FAQ）</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[
            { q: '如何获取沙箱密钥？', a: '登录开发者后台 → 沙箱管理 → 创建密钥，自动生成 sk_sb_**** 密钥' },
            { q: 'SDK 与 API 版本如何对应？', a: 'SDK 主版本号与 API 主版本号对齐，次版本独立演进' },
            { q: 'Webhook 投递失败怎么办？', a: '系统自动重试 5 次（指数退避），全部失败后 24h 暂停该端点' },
            { q: '如何申请提额？', a: '提交接入审核，附上业务说明与预期 RPS，合规组 3 个工作日内回复' },
            { q: '沙箱与生产环境区别？', a: '沙箱使用模拟数据，无真实资金；生产使用真实订单簿与撮合' },
            { q: '错误码如何排查？', a: '进入错误码字典，按 code / 消息 / 类别搜索，含解决方案与参考文档' },
            { q: 'API 弃用迁移期多久？', a: '默认 6 个月，重大变更提供 12 个月过渡期' },
            { q: '如何加入开发者社区？', a: 'Discord / GitHub Discussions / 微信群（详见 footer 链接）' },
          ].map((x, i) => (
            <div key={i} className="rounded-lg p-3" style={{ background: BRAND.bgCardHover }}>
              <div className="text-xs font-semibold mb-1" style={{ color: BRAND.text }}>{x.q}</div>
              <p className="text-[11px]" style={{ color: BRAND.textSub }}>{x.a}</p>
            </div>
          ))}
        </div>
      </div>
      <div className="rounded-xl p-4 border" style={{ background: BRAND.bgCard, borderColor: BRAND.border }}>
        <div className="text-sm font-semibold mb-2" style={{ color: BRAND.text }}>快捷键</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
          {[{ k: '/', d: '聚焦搜索' }, { k: 'Esc', d: '关闭 Drawer' }, { k: 'Tab', d: '切换主分区' }, { k: 'Enter', d: '打开选中项详情' }].map((x, i) => (
            <div key={i} className="flex items-center gap-2">
              <kbd className="px-2 py-0.5 rounded font-mono" style={{ background: BRAND.bgCardHover, color: BRAND.text, border: '1px solid ' + BRAND.border }}>{x.k}</kbd>
              <span style={{ color: BRAND.textSub }}>{x.d}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="rounded-xl p-4 border" style={{ background: 'rgba(20,184,129,0.05)', borderColor: BRAND.border }}>
        <div className="text-sm font-semibold mb-2" style={{ color: BRAND.text }}>合规说明</div>
        <ul className="text-[11px] space-y-1" style={{ color: BRAND.textSub }}>
          <li>· 开发者门户与 SDK 仅作技术能力演示，不构成投资建议</li>
          <li>· 沙箱环境为模拟 / 测试型环境，不涉及真实资产</li>
          <li>· API / SDK 区域为重点市场与合规研究方向示例</li>
          <li>· 平台持续开展合规自检、KYB 审计、KYC 更新、利用冲突审查</li>
          <li>· 严禁利用 SDK / 沙箱从事违法违规活动</li>
        </ul>
      </div>
      <button onClick={onOpen} className="w-full rounded-xl p-3 border text-sm font-medium" style={{ background: BRAND.primaryLt, color: BRAND.primary, borderColor: BRAND.primary }}>
        <HelpCircle className="w-4 h-4 inline mr-2" />
        打开详细帮助面板
      </button>
    </div>
  );
}


// ============================================================
// 通用 Drawer
// ============================================================
function DrawerHeader({ title, subtitle, onClose }: { title: string; subtitle?: string; onClose: () => void }) {
  return (
    <div className="sticky top-0 z-10 flex items-center justify-between p-4" style={{ background: BRAND.bg, borderBottom: '1px solid ' + BRAND.border }}>
      <div className="min-w-0 flex-1">
        <h2 className="text-lg font-bold truncate" style={{ color: BRAND.text }}>{title}</h2>
        {subtitle && <p className="text-[11px] mt-1" style={{ color: BRAND.textSub }}>{subtitle}</p>}
      </div>
      <button onClick={onClose} className="ml-3 p-2 rounded-lg hover:scale-110 transition-transform" style={{ background: BRAND.bgCard, border: '1px solid ' + BRAND.border }}>
        <X size={16} style={{ color: BRAND.textSub }} />
      </button>
    </div>
  );
}

function DrawerShell({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.65)' }} onClick={onClose}></div>
      <div className="ml-auto w-full max-w-2xl h-full overflow-y-auto dev-slide-in" style={{ background: BRAND.bg, borderLeft: '1px solid ' + BRAND.border }}>
        {children}
      </div>
    </div>
  );
}

function DrawerKv({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="flex items-center justify-between py-1.5 text-xs">
      <span style={{ color: BRAND.textMute }}>{label}</span>
      <span className="font-mono" style={{ color: color || BRAND.text }}>{value}</span>
    </div>
  );
}

function DrawerSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl p-4 border" style={{ background: BRAND.bgCard, borderColor: BRAND.border }}>
      <h3 className="text-sm font-semibold mb-3" style={{ color: BRAND.text }}>{title}</h3>
      {children}
    </div>
  );
}

// ============================================================
// API 端点 Drawer
// ============================================================
function ApiDrawer({ api, onClose }: { api: ApiEndpoint; onClose: () => void }) {
  return (
    <DrawerShell onClose={onClose}>
      <DrawerHeader title={api.name} subtitle={api.path + ' · ' + api.version} onClose={onClose} />
      <div className="p-4 space-y-4">
        <div className="flex items-center gap-3">
          <span className="px-2 py-1 rounded text-xs font-mono font-bold" style={{ background: METHOD_COLOR[api.method] + '20', color: METHOD_COLOR[api.method] }}>{api.method}</span>
          <span className="text-sm font-mono flex-1 truncate" style={{ color: BRAND.text }}>{api.path}</span>
          <span className="px-2 py-0.5 rounded text-[10px]" style={{ background: statusBadge(api.status).bg, color: statusBadge(api.status).color }}>{statusBadge(api.status).label}</span>
        </div>
        <p className="text-xs" style={{ color: BRAND.textSub }}>{api.description}</p>
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-lg p-3" style={{ background: BRAND.bgCard }}>
            <div className="text-[10px]" style={{ color: BRAND.textMute }}>24h 调用</div>
            <div className="text-lg font-bold font-mono" style={{ color: BRAND.text }}>{formatInt(api.calls24h)}</div>
          </div>
          <div className="rounded-lg p-3" style={{ background: BRAND.bgCard }}>
            <div className="text-[10px]" style={{ color: BRAND.textMute }}>p95 延迟</div>
            <div className="text-lg font-bold font-mono" style={{ color: BRAND.text }}>{api.p95LatencyMs}ms</div>
          </div>
          <div className="rounded-lg p-3" style={{ background: BRAND.bgCard }}>
            <div className="text-[10px]" style={{ color: BRAND.textMute }}>错误率</div>
            <div className="text-lg font-bold font-mono" style={{ color: api.errorRate > 0.3 ? BRAND.danger : BRAND.text }}>{api.errorRate.toFixed(2)}%</div>
          </div>
        </div>
        <DrawerSection title="端点信息">
          <DrawerKv label="方法" value={api.method} color={METHOD_COLOR[api.method]} />
          <DrawerKv label="路径" value={api.path} />
          <DrawerKv label="版本" value={api.version} />
          <DrawerKv label="分类" value={CAT_ICON[api.category]} />
          <DrawerKv label="鉴权" value={api.auth} />
          <DrawerKv label="速率限制" value={api.rateLimit} />
          <DrawerKv label="更新时间" value={api.updatedAt} />
          {api.deprecatedAt && <DrawerKv label="弃用时间" value={api.deprecatedAt} color={BRAND.danger} />}
        </DrawerSection>
        <DrawerSection title="调用示例（cURL）">
          <pre className="text-[10px] font-mono p-3 rounded overflow-x-auto code-scroll" style={{ background: BRAND.bgCardHover, color: BRAND.text }}>{'curl -X ' + api.method + ' "https://api.zsdex.io' + api.path + '?symbol=BTCUSDT" \\\n  -H "X-API-Key: $ZSDX_KEY" \\\n  -H "X-Signature: $SIG"'}</pre>
        </DrawerSection>
        <DrawerSection title="调用示例（TypeScript SDK）">
          <pre className="text-[10px] font-mono p-3 rounded overflow-x-auto code-scroll" style={{ background: BRAND.bgCardHover, color: BRAND.text }}>{"import { Zsdex } from '@zsdex/sdk-typescript';\nconst c = new Zsdex({ apiKey: process.env.ZSDX_KEY!, apiSecret: process.env.ZSDX_SECRET! });\nconst r = await c." + api.category + '.' + api.path.split('/').pop() + "({ symbol: 'BTCUSDT' });"}</pre>
        </DrawerSection>
        <DrawerSection title="标签">
          <div className="flex flex-wrap gap-1.5">
            {api.tags.map((t, i) => <span key={i} className="px-2 py-0.5 rounded text-[10px]" style={{ background: BRAND.primaryLt, color: BRAND.primary }}>{t}</span>)}
          </div>
        </DrawerSection>
      </div>
    </DrawerShell>
  );
}

// ============================================================
// SDK Drawer
// ============================================================
function SdkDrawer({ sdk, onClose }: { sdk: SdkPackage; onClose: () => void }) {
  return (
    <DrawerShell onClose={onClose}>
      <DrawerHeader title={sdk.name} subtitle={sdk.lang + ' · v' + sdk.version} onClose={onClose} />
      <div className="p-4 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-16 h-16 rounded-xl flex items-center justify-center text-xl font-bold" style={{ background: LANG_COLOR[sdk.lang] + '20', color: LANG_COLOR[sdk.lang] }}>{LANG_ICON[sdk.lang]}</div>
          <div className="flex-1 min-w-0">
            <div className="text-base font-semibold mb-1" style={{ color: BRAND.text }}>{sdk.lang}</div>
            <div className="text-[10px] mb-1" style={{ color: BRAND.textMute }}>{sdk.description}</div>
            <div className="flex items-center gap-2">
              <span className="px-1.5 py-0.5 rounded text-[10px]" style={{ background: statusBadge(sdk.status).bg, color: statusBadge(sdk.status).color }}>{statusBadge(sdk.status).label}</span>
              <span className="text-[10px]" style={{ color: BRAND.textMute }}>· {sdk.license}</span>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-4 gap-2">
          <div className="rounded-lg p-3" style={{ background: BRAND.bgCard }}>
            <div className="text-[10px]" style={{ color: BRAND.textMute }}>下载量</div>
            <div className="text-base font-bold font-mono" style={{ color: BRAND.text }}>{formatInt(sdk.downloads)}</div>
          </div>
          <div className="rounded-lg p-3" style={{ background: BRAND.bgCard }}>
            <div className="text-[10px]" style={{ color: BRAND.textMute }}>Star</div>
            <div className="text-base font-bold font-mono" style={{ color: BRAND.text }}>{formatInt(sdk.stars)}</div>
          </div>
          <div className="rounded-lg p-3" style={{ background: BRAND.bgCard }}>
            <div className="text-[10px]" style={{ color: BRAND.textMute }}>Open Issue</div>
            <div className="text-base font-bold font-mono" style={{ color: BRAND.text }}>{sdk.openIssues}</div>
          </div>
          <div className="rounded-lg p-3" style={{ background: BRAND.bgCard }}>
            <div className="text-[10px]" style={{ color: BRAND.textMute }}>包大小</div>
            <div className="text-base font-bold font-mono" style={{ color: BRAND.text }}>{formatBytes(sdk.size)}</div>
          </div>
        </div>
        <DrawerSection title="安装命令">
          <pre className="text-[11px] font-mono p-3 rounded" style={{ background: BRAND.bgCardHover, color: BRAND.primary }}>{sdk.installCmd}</pre>
        </DrawerSection>
        <DrawerSection title="仓库信息">
          <DrawerKv label="仓库" value={sdk.repo} />
          <DrawerKv label="文档" value={sdk.docs} />
          <DrawerKv label="维护者" value={sdk.maintainer} />
          <DrawerKv label="许可证" value={sdk.license} />
          <DrawerKv label="最近发布" value={sdk.lastRelease} />
        </DrawerSection>
        <DrawerSection title="核心特性">
          <div className="space-y-1.5">
            {sdk.features.map((f, i) => (
              <div key={i} className="flex items-center gap-2 text-xs">
                <CheckCircle size={12} style={{ color: BRAND.primary }} />
                <span style={{ color: BRAND.text }}>{f}</span>
              </div>
            ))}
          </div>
        </DrawerSection>
        <DrawerSection title="快速开始">
          <pre className="text-[10px] font-mono p-3 rounded overflow-x-auto code-scroll" style={{ background: BRAND.bgCardHover, color: BRAND.text }}>{sdk.installCmd + '\n\n# 初始化客户端\nconst c = new Zsdex({\n  apiKey: process.env.ZSDX_KEY!,\n  apiSecret: process.env.ZSDX_SECRET!,\n  sandbox: true,\n});'}</pre>
        </DrawerSection>
      </div>
    </DrawerShell>
  );
}

// ============================================================
// 沙箱密钥 Drawer
// ============================================================
function SandboxDrawer({ sand, onClose }: { sand: SandboxKey; onClose: () => void }) {
  const usagePct = (sand.callsToday / sand.callsLimit) * 100;
  return (
    <DrawerShell onClose={onClose}>
      <DrawerHeader title={sand.name} subtitle={sand.keyPrefix} onClose={onClose} />
      <div className="p-4 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'rgba(20,184,129,0.15)', color: BRAND.primary }}><Key className="w-6 h-6" /></div>
          <div className="flex-1 min-w-0">
            <div className="text-base font-semibold mb-0.5" style={{ color: BRAND.text }}>{sand.env} · {sand.tier}</div>
            <div className="text-[11px] font-mono mb-1" style={{ color: BRAND.textMute }}>{sand.keyPrefix}</div>
            <span className="px-1.5 py-0.5 rounded text-[10px]" style={{ background: statusBadge(sand.status).bg, color: statusBadge(sand.status).color }}>{statusBadge(sand.status).label}</span>
          </div>
        </div>
        <DrawerSection title="用量">
          <div className="mb-2 flex items-center justify-between text-xs">
            <span style={{ color: BRAND.textMute }}>今日调用</span>
            <span className="font-mono" style={{ color: BRAND.text }}>{formatInt(sand.callsToday)} / {formatInt(sand.callsLimit)}</span>
          </div>
          <div className="h-2 rounded-full overflow-hidden mb-2" style={{ background: BRAND.bgCardHover }}>
            <div className="h-full dev-bar" style={{ width: Math.min(100, usagePct) + '%', background: usagePct > 80 ? BRAND.danger : BRAND.primary }}></div>
          </div>
          <div className="text-[10px]" style={{ color: BRAND.textMute }}>使用率 {usagePct.toFixed(1)}%</div>
        </DrawerSection>
        <DrawerSection title="密钥信息">
          <DrawerKv label="环境" value={sand.env} />
          <DrawerKv label="套餐" value={sand.tier} />
          <DrawerKv label="速率限制" value={sand.rateLimit} />
          <DrawerKv label="创建时间" value={sand.createdAt} />
          <DrawerKv label="到期时间" value={sand.expiresAt} color={sand.status === 'expired' || sand.status === 'revoked' ? BRAND.danger : BRAND.text} />
          <DrawerKv label="最后使用" value={sand.lastUsedAt} />
        </DrawerSection>
        <DrawerSection title="权限范围（scopes）">
          <div className="flex flex-wrap gap-1.5">
            {sand.scopes.map((s, i) => <span key={i} className="px-2 py-0.5 rounded text-[10px] font-mono" style={{ background: BRAND.primaryLt, color: BRAND.primary }}>{s}</span>)}
          </div>
        </DrawerSection>
        <DrawerSection title="IP 白名单">
          {sand.ipWhitelist.length === 0 ? (
            <div className="text-[11px]" style={{ color: BRAND.textMute }}>无限制（任何 IP 可调用）</div>
          ) : (
            <div className="space-y-1">
              {sand.ipWhitelist.map((ip, i) => <div key={i} className="text-[11px] font-mono" style={{ color: BRAND.text }}>{ip}</div>)}
            </div>
          )}
        </DrawerSection>
        <DrawerSection title="备注">{sand.note}</DrawerSection>
        <div className="rounded-xl p-3 border" style={{ background: 'rgba(20,184,129,0.05)', borderColor: BRAND.border }}>
          <div className="text-[10px]" style={{ color: BRAND.textSub }}>
            <strong style={{ color: BRAND.primary }}>提示</strong>：沙箱密钥仅用于测试环境，不涉及真实资产；如需生产访问，请创建生产环境密钥并完成接入审核。
          </div>
        </div>
      </div>
    </DrawerShell>
  );
}

// ============================================================
// Webhook Drawer
// ============================================================
function WebhookDrawer({ wh, onClose }: { wh: WebhookEvent; onClose: () => void }) {
  return (
    <DrawerShell onClose={onClose}>
      <DrawerHeader title={wh.name} subtitle={wh.category + ' · ' + wh.id} onClose={onClose} />
      <div className="p-4 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'rgba(20,184,129,0.15)', color: BRAND.primary }}><Webhook className="w-6 h-6" /></div>
          <div className="flex-1 min-w-0">
            <div className="text-base font-semibold mb-0.5" style={{ color: BRAND.text }}>{wh.name}</div>
            <div className="text-[10px] font-mono mb-1 truncate" style={{ color: BRAND.textMute }}>{wh.endpoint}</div>
            <span className="px-1.5 py-0.5 rounded text-[10px]" style={{ background: statusBadge(wh.status).bg, color: statusBadge(wh.status).color }}>{statusBadge(wh.status).label}</span>
          </div>
        </div>
        <p className="text-xs" style={{ color: BRAND.textSub }}>{wh.description}</p>
        <div className="grid grid-cols-4 gap-2">
          <div className="rounded-lg p-3" style={{ background: BRAND.bgCard }}>
            <div className="text-[10px]" style={{ color: BRAND.textMute }}>24h 投递</div>
            <div className="text-base font-bold font-mono" style={{ color: BRAND.text }}>{formatInt(wh.deliveries24h)}</div>
          </div>
          <div className="rounded-lg p-3" style={{ background: BRAND.bgCard }}>
            <div className="text-[10px]" style={{ color: BRAND.textMute }}>成功率</div>
            <div className="text-base font-bold font-mono" style={{ color: wh.successRate > 99.5 ? BRAND.success : wh.successRate > 99 ? BRAND.amber : BRAND.danger }}>{wh.successRate.toFixed(2)}%</div>
          </div>
          <div className="rounded-lg p-3" style={{ background: BRAND.bgCard }}>
            <div className="text-[10px]" style={{ color: BRAND.textMute }}>平均延迟</div>
            <div className="text-base font-bold font-mono" style={{ color: BRAND.text }}>{wh.avgLatencyMs}ms</div>
          </div>
          <div className="rounded-lg p-3" style={{ background: BRAND.bgCard }}>
            <div className="text-[10px]" style={{ color: BRAND.textMute }}>重试</div>
            <div className="text-base font-bold font-mono" style={{ color: BRAND.text }}>{wh.retries}</div>
          </div>
        </div>
        <DrawerSection title="端点配置">
          <DrawerKv label="端点 URL" value={wh.endpoint} />
          <DrawerKv label="签名密钥" value={wh.secret} />
          <DrawerKv label="更新时间" value={wh.updatedAt} />
        </DrawerSection>
        <DrawerSection title="订阅事件">
          <div className="flex flex-wrap gap-1.5">
            {wh.events.map((e, i) => <span key={i} className="px-2 py-0.5 rounded text-[10px] font-mono" style={{ background: BRAND.bgCardHover, color: BRAND.text }}>{e}</span>)}
          </div>
        </DrawerSection>
        <DrawerSection title="事件过滤">
          {wh.filters.length === 0 ? <div className="text-[11px]" style={{ color: BRAND.textMute }}>无过滤（接收所有事件）</div> : (
            <div className="space-y-1">
              {wh.filters.map((f, i) => <div key={i} className="text-[11px] font-mono" style={{ color: BRAND.text }}>{f}</div>)}
            </div>
          )}
        </DrawerSection>
        <DrawerSection title="签名验证示例">
          <pre className="text-[10px] font-mono p-3 rounded overflow-x-auto code-scroll" style={{ background: BRAND.bgCardHover, color: BRAND.text }}>{"import hmac, hashlib\n\ndef verify(payload, signature, secret):\n    expected = hmac.new(\n        secret.encode(),\n        payload.encode(),\n        hashlib.sha256\n    ).hexdigest()\n    return hmac.compare_digest(expected, signature)"}</pre>
        </DrawerSection>
      </div>
    </DrawerShell>
  );
}

// ============================================================
// 配额 Drawer
// ============================================================
function QuotaDrawer({ q, onClose }: { q: QuotaUsage; onClose: () => void }) {
  return (
    <DrawerShell onClose={onClose}>
      <DrawerHeader title={q.tier + ' 套餐配额'} subtitle="实时用量监控" onClose={onClose} />
      <div className="p-4 space-y-4">
        <DrawerSection title="基础配额">
          <DrawerKv label="每分钟调用" value={q.callsPerMin.toLocaleString()} />
          <DrawerKv label="每日调用" value={formatInt(q.callsPerDay)} />
          <DrawerKv label="WebSocket 连接" value={q.websocketConns.toString()} />
          <DrawerKv label="Webhook 投递" value={formatInt(q.webhookDeliveries)} />
          <DrawerKv label="重置时间" value={q.resetAt} />
        </DrawerSection>
        <DrawerSection title="实时使用率">
          <div className="mb-2 flex items-center justify-between text-xs">
            <span style={{ color: BRAND.textMute }}>平均使用率</span>
            <span className="font-mono" style={{ color: q.usedPct > 80 ? BRAND.danger : BRAND.text }}>{q.usedPct}%</span>
          </div>
          <div className="h-3 rounded-full overflow-hidden mb-3" style={{ background: BRAND.bgCardHover }}>
            <div className="h-full dev-bar" style={{ width: q.usedPct + '%', background: q.usedPct > 80 ? BRAND.danger : q.usedPct > 50 ? BRAND.amber : BRAND.primary }}></div>
          </div>
          <div className="mb-2 flex items-center justify-between text-xs">
            <span style={{ color: BRAND.textMute }}>峰值（burst）</span>
            <span className="font-mono" style={{ color: BRAND.text }}>{q.burstPct}%</span>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: BRAND.bgCardHover }}>
            <div className="h-full dev-bar" style={{ width: q.burstPct + '%', background: BRAND.amber }}></div>
          </div>
        </DrawerSection>
        <DrawerSection title="近 10 次使用率">
          <div className="h-20 flex items-end gap-1">
            {q.history.map((h, i) => (
              <div key={i} className="flex-1 rounded-t" style={{ height: h + '%', background: h > 80 ? BRAND.danger : h > 50 ? BRAND.amber : BRAND.primary, opacity: 0.6 + (i * 0.04) }}></div>
            ))}
          </div>
          <div className="flex justify-between text-[10px] mt-1" style={{ color: BRAND.textMute }}>
            <span>10 次前</span><span>现在</span>
          </div>
        </DrawerSection>
        <DrawerSection title="区域分布">
          <div className="space-y-2">
            {q.regions.map((r, i) => (
              <div key={i}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span style={{ color: BRAND.text }}>{r.name}</span>
                  <span className="font-mono" style={{ color: BRAND.textSub }}>{r.pct}% · {r.latencyMs}ms</span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: BRAND.bgCardHover }}>
                  <div className="h-full dev-bar" style={{ width: r.pct + '%', background: BRAND.primary }}></div>
                </div>
              </div>
            ))}
          </div>
        </DrawerSection>
        <DrawerSection title="告警">
          <div className="flex items-center gap-2 text-xs">
            <Bell className="w-4 h-4" style={{ color: BRAND.amber }} />
            <span style={{ color: BRAND.text }}>近 7d 触发 {q.alerts} 次配额告警</span>
          </div>
        </DrawerSection>
      </div>
    </DrawerShell>
  );
}

// ============================================================
// 错误码 Drawer
// ============================================================
function ErrorDrawer({ e, onClose }: { e: ErrorCode; onClose: () => void }) {
  return (
    <DrawerShell onClose={onClose}>
      <DrawerHeader title={e.code} subtitle={e.message} onClose={onClose} />
      <div className="p-4 space-y-4">
        <div className="flex items-center gap-2">
          <span className="px-2 py-1 rounded text-xs" style={{ background: severityColor(e.severity).bg, color: severityColor(e.severity).color }}>{e.severity}</span>
          <span className="px-2 py-1 rounded text-xs" style={{ background: BRAND.bgCardHover, color: BRAND.text }}>{e.category}</span>
          <span className="px-2 py-1 rounded text-xs" style={{ background: BRAND.bgCardHover, color: BRAND.text }}>HTTP {e.httpStatus}</span>
          <span className="px-2 py-1 rounded text-xs" style={{ background: e.retryable ? BRAND.successLt : 'rgba(112,112,112,0.10)', color: e.retryable ? BRAND.success : BRAND.textMute }}>{e.retryable ? '可重试' : '不可重试'}</span>
        </div>
        <DrawerSection title="错误描述">
          <p className="text-xs" style={{ color: BRAND.textSub }}>{e.message}</p>
        </DrawerSection>
        <DrawerSection title="可能原因">
          <p className="text-xs" style={{ color: BRAND.textSub }}>{e.cause}</p>
        </DrawerSection>
        <DrawerSection title="解决方案">
          <p className="text-xs" style={{ color: BRAND.textSub }}>{e.solution}</p>
        </DrawerSection>
        <DrawerSection title="统计">
          <DrawerKv label="近 7d 触发" value={formatInt(e.occurrence) + ' 次'} />
          <DrawerKv label="最后出现" value={e.lastSeen} />
        </DrawerSection>
        <DrawerSection title="相关参考">
          <div className="space-y-1">
            {e.references.map((r, i) => (
              <a key={i} href={r} className="block text-xs font-mono hover:underline" style={{ color: BRAND.primary }}>{r}</a>
            ))}
          </div>
        </DrawerSection>
        <DrawerSection title="处理示例（Python）">
          <pre className="text-[10px] font-mono p-3 rounded overflow-x-auto code-scroll" style={{ background: BRAND.bgCardHover, color: BRAND.text }}>{"from zsdex.exceptions import ZsdexError\n\ntry:\n    order = await client.order.create(...)\nexcept ZsdexError as e:\n    if e.code == '" + e.code + "':\n        if e.retryable:\n            await asyncio.sleep(1)\n            return await client.order.create(...)\n        else:\n            logger.error(f'不可恢复错误: {e.message}')\n            raise"}</pre>
        </DrawerSection>
      </div>
    </DrawerShell>
  );
}

// ============================================================
// 接入审核 Drawer
// ============================================================
function AuditDrawer({ a, onClose }: { a: AuditApplication; onClose: () => void }) {
  return (
    <DrawerShell onClose={onClose}>
      <DrawerHeader title={a.orgName} subtitle={a.orgType + ' · ' + a.id} onClose={onClose} />
      <div className="p-4 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-xl flex items-center justify-center text-base font-bold" style={{ background: 'rgba(20,184,129,0.15)', color: BRAND.primary }}>{a.orgName.substring(0, 2).toUpperCase()}</div>
          <div className="flex-1 min-w-0">
            <div className="text-base font-semibold mb-0.5" style={{ color: BRAND.text }}>{a.orgName}</div>
            <div className="text-[11px] mb-1" style={{ color: BRAND.textSub }}>申请人：{a.applicant}</div>
            <span className="px-2 py-0.5 rounded text-[10px]" style={{ background: statusBadge(a.status).bg, color: statusBadge(a.status).color }}>{statusBadge(a.status).label}</span>
          </div>
        </div>
        <DrawerSection title="申请信息">
          <DrawerKv label="机构类型" value={a.orgType} />
          <DrawerKv label="联系人" value={a.contact} />
          <DrawerKv label="联系邮箱" value={a.email} />
          <DrawerKv label="提交时间" value={a.submittedAt} />
          <DrawerKv label="审核人" value={a.reviewedBy} />
          <DrawerKv label="评分" value={a.score > 0 ? a.score.toString() : '-'} color={a.score >= 80 ? BRAND.success : a.score >= 60 ? BRAND.amber : a.score > 0 ? BRAND.danger : BRAND.textMute} />
        </DrawerSection>
        <DrawerSection title="用途说明">{a.useCase}</DrawerSection>
        <DrawerSection title="准入信息">
          <DrawerKv label="KYB 等级" value={'L' + a.kybLevel} color={a.kybLevel >= 4 ? BRAND.success : a.kybLevel >= 2 ? BRAND.amber : BRAND.danger} />
          <DrawerKv label="期望 RPS" value={a.expectedRps.toString()} />
        </DrawerSection>
        <DrawerSection title="申请 scopes">
          <div className="flex flex-wrap gap-1.5">
            {a.scope.map((s, i) => <span key={i} className="px-2 py-0.5 rounded text-[10px] font-mono" style={{ background: BRAND.primaryLt, color: BRAND.primary }}>{s}</span>)}
          </div>
        </DrawerSection>
        <DrawerSection title="审核备注">{a.reviewNote}</DrawerSection>
      </div>
    </DrawerShell>
  );
}

// ============================================================
// 代码示例 Drawer
// ============================================================
function ExampleDrawer({ ex, onClose }: { ex: CodeExample; onClose: () => void }) {
  return (
    <DrawerShell onClose={onClose}>
      <DrawerHeader title={ex.title} subtitle={ex.api + ' · ' + ex.lang} onClose={onClose} />
      <div className="p-4 space-y-4">
        <div className="flex items-center gap-2">
          <span className="px-2 py-1 rounded text-xs font-mono" style={{ background: BRAND.primaryLt, color: BRAND.primary }}>{ex.lang}</span>
          <span className="px-2 py-1 rounded text-xs" style={{ background: BRAND.bgCardHover, color: BRAND.text }}>{ex.difficulty}</span>
          <span className="text-[10px]" style={{ color: BRAND.textMute }}>· {ex.scenario} · 运行 {formatInt(ex.runs)} 次</span>
        </div>
        <p className="text-xs" style={{ color: BRAND.textSub }}>{ex.description}</p>
        <DrawerSection title="代码">
          <pre className="text-[11px] font-mono p-4 rounded overflow-x-auto code-scroll" style={{ background: BRAND.bgCardHover, color: BRAND.text, maxHeight: '500px' }}>{ex.code}</pre>
        </DrawerSection>
        <DrawerSection title="标签">
          <div className="flex flex-wrap gap-1.5">
            {ex.tags.map((t, i) => <span key={i} className="px-2 py-0.5 rounded text-[10px]" style={{ background: BRAND.primaryLt, color: BRAND.primary }}>{t}</span>)}
          </div>
        </DrawerSection>
        <DrawerSection title="元信息">
          <DrawerKv label="API" value={ex.api} />
          <DrawerKv label="场景" value={ex.scenario} />
          <DrawerKv label="难度" value={ex.difficulty} />
          <DrawerKv label="更新" value={ex.updatedAt} />
          <DrawerKv label="运行次数" value={formatInt(ex.runs)} />
        </DrawerSection>
      </div>
    </DrawerShell>
  );
}

// ============================================================
// 变更日志 Drawer
// ============================================================
function ChangeDrawer({ c, onClose }: { c: ChangelogEntry; onClose: () => void }) {
  return (
    <DrawerShell onClose={onClose}>
      <DrawerHeader title={c.version + ' · ' + c.title} subtitle={c.releasedAt + ' · ' + c.type} onClose={onClose} />
      <div className="p-4 space-y-4">
        <div className="flex items-center gap-2">
          <span className="px-2 py-1 rounded text-xs" style={{ background: statusBadge(c.type).bg, color: statusBadge(c.type).color }}>{statusBadge(c.type).label}</span>
          <span className="text-[10px]" style={{ color: BRAND.textMute }}>· {c.pr} · {c.author} · 👍 {c.reactions}</span>
        </div>
        <p className="text-xs" style={{ color: BRAND.textSub }}>{c.description}</p>
        <DrawerSection title="影响范围">
          <div className="flex flex-wrap gap-1.5">
            {c.affects.map((a, i) => <span key={i} className="px-2 py-0.5 rounded text-[10px]" style={{ background: BRAND.bgCardHover, color: BRAND.text }}>{a}</span>)}
          </div>
        </DrawerSection>
        <DrawerSection title="迁移说明">{c.migration}</DrawerSection>
        <DrawerSection title="元信息">
          <DrawerKv label="版本" value={c.version} />
          <DrawerKv label="类型" value={c.type} />
          <DrawerKv label="发布日期" value={c.releasedAt} />
          <DrawerKv label="作者" value={c.author} />
          <DrawerKv label="PR" value={c.pr} />
          <DrawerKv label="社区反应" value={'👍 ' + c.reactions} />
        </DrawerSection>
      </div>
    </DrawerShell>
  );
}

// ============================================================
// 服务状态 Drawer
// ============================================================
function ServiceDrawer({ s, onClose }: { s: ServiceStatusItem; onClose: () => void }) {
  return (
    <DrawerShell onClose={onClose}>
      <DrawerHeader title={s.name} subtitle={s.region + ' · ' + s.state} onClose={onClose} />
      <div className="p-4 space-y-4">
        <div className="flex items-center gap-3">
          <span className="w-3 h-3 rounded-full" style={{ background: statusBadge(s.state).color }}></span>
          <div className="flex-1">
            <div className="text-base font-semibold" style={{ color: BRAND.text }}>{s.name}</div>
            <div className="text-[11px]" style={{ color: BRAND.textSub }}>{s.description}</div>
          </div>
          <span className="px-2 py-1 rounded text-xs" style={{ background: statusBadge(s.state).bg, color: statusBadge(s.state).color }}>{statusBadge(s.state).label}</span>
        </div>
        <div className="grid grid-cols-4 gap-2">
          <div className="rounded-lg p-3" style={{ background: BRAND.bgCard }}>
            <div className="text-[10px]" style={{ color: BRAND.textMute }}>可用率</div>
            <div className="text-base font-bold font-mono" style={{ color: s.uptime > 99.9 ? BRAND.success : BRAND.text }}>{s.uptime.toFixed(2)}%</div>
          </div>
          <div className="rounded-lg p-3" style={{ background: BRAND.bgCard }}>
            <div className="text-[10px]" style={{ color: BRAND.textMute }}>p50 延迟</div>
            <div className="text-base font-bold font-mono" style={{ color: BRAND.text }}>{s.latencyP50}ms</div>
          </div>
          <div className="rounded-lg p-3" style={{ background: BRAND.bgCard }}>
            <div className="text-[10px]" style={{ color: BRAND.textMute }}>p95 延迟</div>
            <div className="text-base font-bold font-mono" style={{ color: s.latencyP95 > 200 ? BRAND.amber : BRAND.text }}>{s.latencyP95}ms</div>
          </div>
          <div className="rounded-lg p-3" style={{ background: BRAND.bgCard }}>
            <div className="text-[10px]" style={{ color: BRAND.textMute }}>错误率</div>
            <div className="text-base font-bold font-mono" style={{ color: s.errorRate > 0.3 ? BRAND.danger : BRAND.text }}>{s.errorRate.toFixed(2)}%</div>
          </div>
        </div>
        <DrawerSection title="服务信息">
          <DrawerKv label="服务名" value={s.name} />
          <DrawerKv label="区域" value={s.region} />
          <DrawerKv label="状态" value={statusBadge(s.state).label} color={statusBadge(s.state).color} />
          <DrawerKv label="30d 事故" value={s.incidents30d.toString() + ' 次'} />
          <DrawerKv label="最近事故" value={s.lastIncident} />
        </DrawerSection>
        <DrawerSection title="依赖服务">
          <div className="flex flex-wrap gap-1.5">
            {s.dependencies.map((d, i) => <span key={i} className="px-2 py-0.5 rounded text-[10px]" style={{ background: BRAND.bgCardHover, color: BRAND.text }}>{d}</span>)}
          </div>
        </DrawerSection>
      </div>
    </DrawerShell>
  );
}

// ============================================================
// 帮助 Drawer
// ============================================================
function HelpDrawer({ onClose }: { onClose: () => void }) {
  return (
    <DrawerShell onClose={onClose}>
      <DrawerHeader title="帮助中心" subtitle="开发者门户使用指南" onClose={onClose} />
      <div className="p-4 space-y-4">
        <DrawerSection title="快速链接">
          <div className="grid grid-cols-2 gap-2">
            {[
              { t: 'API 文档', d: 'OpenAPI 3.1 + 完整示例' },
              { t: 'SDK 仓库', d: '9 语言 GitHub 仓库' },
              { t: '状态页', d: '实时服务状态' },
              { t: '社区', d: 'Discord / GitHub Discussions' },
              { t: '工单', d: '提交技术问题' },
              { t: '更新日志', d: '订阅 API 变更通知' },
            ].map((x, i) => (
              <a key={i} href="#" className="block rounded-lg p-3" style={{ background: BRAND.bgCardHover }}>
                <div className="text-xs font-semibold mb-0.5" style={{ color: BRAND.text }}>{x.t}</div>
                <div className="text-[10px]" style={{ color: BRAND.textSub }}>{x.d}</div>
              </a>
            ))}
          </div>
        </DrawerSection>
        <DrawerSection title="快捷键">
          <div className="grid grid-cols-2 gap-2 text-xs">
            {[{ k: '/', d: '聚焦搜索' }, { k: 'Esc', d: '关闭 Drawer' }, { k: 'Tab', d: '切换主分区' }, { k: 'Enter', d: '打开选中项' }].map((x, i) => (
              <div key={i} className="flex items-center gap-2">
                <kbd className="px-2 py-0.5 rounded font-mono" style={{ background: BRAND.bgCardHover, color: BRAND.text, border: '1px solid ' + BRAND.border }}>{x.k}</kbd>
                <span style={{ color: BRAND.textSub }}>{x.d}</span>
              </div>
            ))}
          </div>
        </DrawerSection>
        <DrawerSection title="合规说明">
          <ul className="text-[11px] space-y-1" style={{ color: BRAND.textSub }}>
            <li>· 开发者门户与 SDK 仅作技术能力演示</li>
            <li>· 沙箱为模拟 / 测试型环境，不涉及真实资产</li>
            <li>· 严禁利用 SDK / 沙箱从事违法违规活动</li>
            <li>· 区域为重点市场与合规研究方向示例</li>
          </ul>
        </DrawerSection>
      </div>
    </DrawerShell>
  );
}


export function PortalDeveloper() {
  const [tab, setTab] = useState<Tab>('overview');
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState<ApiCategory | 'all'>('all');
  const [filterLang, setFilterLang] = useState<SdkLang | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortBy>('calls');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const [drawerApi, setDrawerApi] = useState<ApiEndpoint | null>(null);
  const [drawerSdk, setDrawerSdk] = useState<SdkPackage | null>(null);
  const [drawerSandbox, setDrawerSandbox] = useState<SandboxKey | null>(null);
  const [drawerWebhook, setDrawerWebhook] = useState<WebhookEvent | null>(null);
  const [drawerQuota, setDrawerQuota] = useState<QuotaUsage | null>(null);
  const [drawerError, setDrawerError] = useState<ErrorCode | null>(null);
  const [drawerAudit, setDrawerAudit] = useState<AuditApplication | null>(null);
  const [drawerExample, setDrawerExample] = useState<CodeExample | null>(null);
  const [drawerChange, setDrawerChange] = useState<ChangelogEntry | null>(null);
  const [drawerService, setDrawerService] = useState<ServiceStatusItem | null>(null);
  const [helpOpen, setHelpOpen] = useState(false);

  const [liveCalls, setLiveCalls] = useState(0);
  const [liveOnline, setLiveOnline] = useState(0);

  useEffect(() => {
    const t1 = setInterval(() => setLiveCalls(c => c + Math.floor(Math.random() * 2000) + 800), 2000);
    const t2 = setInterval(() => setLiveOnline(o => Math.max(2800, Math.min(3600, o + Math.floor(Math.random() * 21) - 10))), 3000);
    setLiveOnline(3214);
    return () => { clearInterval(t1); clearInterval(t2); };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        const el = document.querySelector<HTMLInputElement>('input[data-dev-search]');
        el?.focus();
      } else if (e.key === 'Escape') {
        setDrawerApi(null); setDrawerSdk(null); setDrawerSandbox(null); setDrawerWebhook(null);
        setDrawerQuota(null); setDrawerError(null); setDrawerAudit(null); setDrawerExample(null);
        setDrawerChange(null); setDrawerService(null); setHelpOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'overview', label: '总览', icon: <Gauge className="w-3.5 h-3.5" /> },
    { key: 'api', label: 'API 目录', icon: <Code className="w-3.5 h-3.5" /> },
    { key: 'sdk', label: 'SDK 下载', icon: <Package className="w-3.5 h-3.5" /> },
    { key: 'sandbox', label: '沙箱环境', icon: <Terminal className="w-3.5 h-3.5" /> },
    { key: 'webhook', label: 'Webhook', icon: <Webhook className="w-3.5 h-3.5" /> },
    { key: 'quota', label: '限额配额', icon: <Gauge className="w-3.5 h-3.5" /> },
    { key: 'errors', label: '错误码', icon: <AlertTriangle className="w-3.5 h-3.5" /> },
    { key: 'audit', label: '接入审核', icon: <ShieldCheck className="w-3.5 h-3.5" /> },
    { key: 'examples', label: '代码示例', icon: <FileCode className="w-3.5 h-3.5" /> },
    { key: 'changelog', label: '变更日志', icon: <History className="w-3.5 h-3.5" /> },
    { key: 'status', label: '服务状态', icon: <Activity className="w-3.5 h-3.5" /> },
    { key: 'help', label: '帮助', icon: <HelpCircle className="w-3.5 h-3.5" /> },
  ];

  return (
    <>
      <style>{STYLES}</style>
      <div className="min-h-screen p-4 md:p-6" style={{ background: BRAND.bg, color: BRAND.text }}>
        <div className="max-w-7xl mx-auto space-y-4">
          {/* 顶部 Header */}
          <div className="rounded-2xl p-5 border" style={{ background: BRAND.bgCard, borderColor: BRAND.border }}>
            <div className="flex items-start gap-4 mb-4">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center dev-float" style={{ background: 'rgba(20,184,129,0.15)', color: BRAND.primary }}>
                <Code className="w-7 h-7" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-2xl font-bold" style={{ color: BRAND.text }}>开发者门户与 SDK 下载中心</h1>
                  <span className="text-[10px] px-1.5 py-0.5 rounded font-mono" style={{ background: BRAND.primaryLt, color: BRAND.primary }}>P3.48</span>
                </div>
                <p className="text-sm" style={{ color: BRAND.textSub }}>
                  平台开放 API 目录 / 多语言 SDK / 沙箱环境 / Webhook 回调 / 限额配额 / 错误码字典 / 接入审核 / 代码示例 / 变更日志 / 服务状态全链路。
                  月 API 调用 1.28 亿次，9 语言 SDK 累计下载 86 万次，沙箱密钥 5,800+，Webhook 投递成功率 99.82%。
                </p>
              </div>
              <div className="hidden md:flex items-center gap-2 text-[11px]" style={{ color: BRAND.textSub }}>
                <div className="flex items-center gap-1.5 px-2 py-1 rounded" style={{ background: BRAND.bgCardHover }}>
                  <span className="w-1.5 h-1.5 rounded-full dev-blink" style={{ background: BRAND.success }}></span>
                  <span>在线 {formatInt(liveOnline)}</span>
                </div>
                <div className="flex items-center gap-1.5 px-2 py-1 rounded" style={{ background: BRAND.bgCardHover }}>
                  <Activity className="w-3 h-3" style={{ color: BRAND.primary }} />
                  <span>实时调用 {formatInt(liveCalls)}</span>
                </div>
              </div>
            </div>

            {/* KPI 网格 */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 dev-stagger">
              <KpiCard label="API 端点" value="248" sub="稳定 226 / 公测 16 / 新增 6" icon={<Code className="w-4 h-4" />} color={BRAND.primary} />
              <KpiCard label="SDK 语言" value="9" sub="TS/Py/Go/Java/Rust/C#/PHP/Swift/Kotlin" icon={<Package className="w-4 h-4" />} color={BRAND.info} />
              <KpiCard label="月 API 调用" value="1.28亿" sub="p95 延迟 78ms" icon={<Activity className="w-4 h-4" />} color={BRAND.success} pulse />
              <KpiCard label="SDK 下载" value="86.4万" sub="累计 / 7d +12.3%" icon={<Download className="w-4 h-4" />} color={BRAND.amber} />
              <KpiCard label="沙箱密钥" value="5,834" sub="活跃 4,128 / 7d +186" icon={<Key className="w-4 h-4" />} color={BRAND.primary} />
              <KpiCard label="Webhook 成功" value="99.82%" sub="24h 投递 2.14M / 重试 0.18%" icon={<Webhook className="w-4 h-4" />} color={BRAND.success} />
            </div>
          </div>

          {/* Tab 切换 */}
          <div className="rounded-2xl p-2 border flex flex-wrap gap-1" style={{ background: BRAND.bgCard, borderColor: BRAND.border }}>
            {TABS.map(t => (
              <button key={t.key} onClick={() => setTab(t.key)} className="px-3 py-2 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all" style={{ background: tab === t.key ? BRAND.primaryLt : 'transparent', color: tab === t.key ? BRAND.primary : BRAND.textSub, border: tab === t.key ? '1px solid ' + BRAND.primary : '1px solid transparent' }}>
                {t.icon}
                <span>{t.label}</span>
              </button>
            ))}
          </div>

          {/* Tab 内容 */}
          <div className="rounded-2xl p-5 border min-h-[600px]" style={{ background: BRAND.bgCard, borderColor: BRAND.border }}>
            {tab === 'overview' && <OverviewTab onApi={setDrawerApi} onSdk={setDrawerSdk} onService={setDrawerService} onChange={setDrawerChange} />}
            {tab === 'api' && <ApiTab onSelect={setDrawerApi} />}
            {tab === 'sdk' && <SdkTab onSelect={setDrawerSdk} />}
            {tab === 'sandbox' && <SandboxTab onSelect={setDrawerSandbox} />}
            {tab === 'webhook' && <WebhookTab onSelect={setDrawerWebhook} />}
            {tab === 'quota' && <QuotaTab onSelect={setDrawerQuota} />}
            {tab === 'errors' && <ErrorsTab onSelect={setDrawerError} />}
            {tab === 'audit' && <AuditTab onSelect={setDrawerAudit} />}
            {tab === 'examples' && <ExamplesTab onSelect={setDrawerExample} />}
            {tab === 'changelog' && <ChangelogTab onSelect={setDrawerChange} />}
            {tab === 'status' && <StatusTab onSelect={setDrawerService} />}
            {tab === 'help' && <HelpTab onOpen={() => setHelpOpen(true)} />}
          </div>
        </div>

        {/* Drawers */}
        {drawerApi && <ApiDrawer api={drawerApi} onClose={() => setDrawerApi(null)} />}
        {drawerSdk && <SdkDrawer sdk={drawerSdk} onClose={() => setDrawerSdk(null)} />}
        {drawerSandbox && <SandboxDrawer key={drawerSandbox.keyPrefix} sand={drawerSandbox} onClose={() => setDrawerSandbox(null)} />}
        {drawerWebhook && <WebhookDrawer wh={drawerWebhook} onClose={() => setDrawerWebhook(null)} />}
        {drawerQuota && <QuotaDrawer q={drawerQuota} onClose={() => setDrawerQuota(null)} />}
        {drawerError && <ErrorDrawer e={drawerError} onClose={() => setDrawerError(null)} />}
        {drawerAudit && <AuditDrawer a={drawerAudit} onClose={() => setDrawerAudit(null)} />}
        {drawerExample && <ExampleDrawer ex={drawerExample} onClose={() => setDrawerExample(null)} />}
        {drawerChange && <ChangeDrawer c={drawerChange} onClose={() => setDrawerChange(null)} />}
        {drawerService && <ServiceDrawer s={drawerService} onClose={() => setDrawerService(null)} />}
        {helpOpen && <HelpDrawer onClose={() => setHelpOpen(false)} />}
      </div>
    </>
  );
}
