// gen-developer-step1.js
// 生成 PortalDeveloper.tsx 骨架：注释 + imports + types + tools + styles + main component shell
const fs = require('fs');
const path = require('path');

const ROOT = 'd:/3、系统项目开发/trae_projects/Stock Exchange dapp20260608-01';
const out = path.join(ROOT, 'src/components/portal-preview/PortalDeveloper.tsx');

const tpl = `/**
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
const MOCK_PLACEHOLDER = '__MOCK_DATA_PLACEHOLDER__';

// ============================================================
// 样式
// ============================================================

const STYLES = \`
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
\`;

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
`;

fs.writeFileSync(out, tpl, 'utf8');
console.log('OK step1 - ' + tpl.length + ' bytes');
