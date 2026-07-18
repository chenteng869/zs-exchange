'use client';

/**
 * PortalApiPlatform - API 开放平台（2026-07-19 Q05 P3.17）
 *
 * 页面定位：
 * - 中萨数字科技交易所 API 开放平台门户
 * - REST API + WebSocket + SDK + 沙盒环境 + 文档中心 + 状态页
 * - 机构、做市商、量化团队、第三方应用开发者的一站式接入门户
 *
 * L4 工业级设计标准：
 * - 暗色 v6 纯黑 #000000 + 卡片 #141414 + ZSDEX 绿 primary #14B881
 * - 10 大区块：Hero / 实时 KPI / REST API 目录 / WebSocket 频道 / SDK 下载 / 沙盒环境 / 文档中心 / 状态页 / 用量分析 / 接入指南 / 底部 CTA
 * - 9+ 交互：搜索 / 排序 / Tab 切换 / 分类过滤 / 详情 Drawer / 复制 / 快捷键 / 实时过滤 / 代码复制
 * - 5+ Drawer：API 端点详情 / WebSocket 频道详情 / SDK 详情 / 文档详情 / 帮助快捷键
 * - 4+ 实时数据：API 调用 / 活跃 Key / 平均延迟 / 可用性
 * - 4+ 动画：Stagger / CountUp / Hover / Pulse / fadeInUp
 *
 * 合规要点（Q05 硬约束）：
 * - 不接真实 API，所有数据使用 mock 占位
 * - 状态徽章统一使用 STATUS 枚举
 * - 不修改旧官网 / 旧 H5 / disabled pages
 * - 严格规避任何高风险合规词
 * - API 端点使用中性技术描述
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
  Code2,
  Code,
  Terminal,
  Webhook,
  Wifi,
  WifiOff,
  Activity,
  Server,
  Cloud,
  Cpu,
  Database,
  Hash,
  KeyRound,
  KeySquare,
  Shield,
  ShieldCheck,
  Zap,
  Sparkles,
  Copy,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  XCircle,
  Clock,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownLeft,
  Plus,
  Minus,
  Download,
  ExternalLink,
  Mail,
  MessageCircle,
  Phone,
  Users,
  UserCheck,
  Building2,
  Briefcase,
  Layers,
  Network,
  Globe2,
  MapPin,
  Settings,
  HelpCircle,
  Keyboard,
  History,
  Calendar,
  Target,
  Crosshair,
  Radar,
  Award,
  BookOpen,
  FileText,
  Play,
  Pause,
  RefreshCw,
  Box,
  Container,
  GitBranch,
  GitCommit,
  GitPullRequest,
  Tag,
  ListChecks,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  Box as BoxIcon,
  Boxes,
  Workflow,
  CircuitBoard,
  Rocket,
  GraduationCap,
  Megaphone,
  Radio,
} from 'lucide-react';
import { BRAND, STATUS } from './brand';

// ============== 类型 ==============

type Tab = 'overview' | 'rest' | 'websocket' | 'sdk' | 'sandbox' | 'docs' | 'status';
type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
type ApiCategory = 'market' | 'account' | 'trade' | 'wallet' | 'order' | 'position' | 'staking' | 'margin' | 'futures' | 'options' | 'kyc' | 'webhook';
type SdkLang = 'python' | 'javascript' | 'typescript' | 'go' | 'java' | 'rust' | 'csharp' | 'php';
type ChannelType = 'ticker' | 'depth' | 'trade' | 'kline' | 'orderbook' | 'account' | 'order' | 'position';
type DocCategory = 'quickstart' | 'authentication' | 'rate-limit' | 'errors' | 'webhook' | 'migration' | 'best-practices' | 'faq';
type ServiceStatus = 'operational' | 'degraded' | 'partial-outage' | 'major-outage' | 'maintenance';

interface ApiEndpoint {
  id: string;
  method: HttpMethod;
  path: string;
  category: ApiCategory;
  name: string;
  version: string;
  auth: 'public' | 'signed' | 'api-key';
  rateLimit: { limit: number; window: string; scope: 'ip' | 'uid' | 'key' };
  description: string;
  parameters: { name: string; type: string; required: boolean; description: string; example?: string }[];
  response: { code: number; description: string; example: string };
  deprecated?: boolean;
  addedIn: string;
  calls24h: number;
  avgLatency: number;
  errorRate: number;
}

interface WsChannel {
  id: string;
  channel: string;
  type: ChannelType;
  name: string;
  updateFrequency: string;
  payload: string;
  description: string;
  rate: number;
  subscribers: number;
  retention: string;
  example: string;
}

interface Sdk {
  id: string;
  language: SdkLang;
  name: string;
  version: string;
  description: string;
  installCommand: string;
  repoUrl: string;
  docsUrl: string;
  downloads: number;
  stars: number;
  lastRelease: string;
  features: string[];
  status: 'stable' | 'beta' | 'alpha' | 'deprecated';
  maintainer: string;
  coverage: number;
}

interface DocPage {
  id: string;
  category: DocCategory;
  title: string;
  description: string;
  readTime: number;
  lastUpdated: string;
  views: number;
  helpful: number;
  author: string;
  tags: string[];
  content: string[];
  related: string[];
}

interface ServiceHealth {
  id: string;
  name: string;
  status: ServiceStatus;
  uptime30d: number;
  avgLatency: number;
  errorRate: number;
  region: string;
  lastIncident?: string;
  description: string;
}

interface SandboxEnv {
  id: string;
  name: string;
  type: 'spot' | 'futures' | 'margin' | 'options';
  baseUrl: string;
  wsUrl: string;
  apiKey: string;
  rateLimit: string;
  resetPolicy: string;
  features: string[];
  description: string;
}

interface ApiKey {
  id: string;
  name: string;
  type: 'read-only' | 'trade' | 'withdraw' | 'full';
  permissions: string[];
  ipWhitelist: string[];
  createdAt: string;
  lastUsed: string;
  calls24h: number;
  status: 'active' | 'suspended' | 'revoked';
}

interface DrawerState {
  open: boolean;
  type: 'endpoint' | 'channel' | 'sdk' | 'doc' | 'service' | 'key' | 'sandbox' | 'help' | null;
  payload: string | null;
}

interface KpiSnapshot {
  totalCalls: number;
  activeKeys: number;
  avgLatency: number;
  uptime: number;
  wsConnections: number;
  successRate: number;
  newKeys: number;
  bandwidth: number;
}

// ============== Mock 数据 ==============

const ENDPOINTS: ApiEndpoint[] = [
  {
    id: 'ep-001',
    method: 'GET',
    path: '/api/v3/ping',
    category: 'market',
    name: '测试连通性',
    version: 'v3',
    auth: 'public',
    rateLimit: { limit: 6000, window: '5min', scope: 'ip' },
    description: '测试 API 服务连通性。无认证要求。',
    parameters: [],
    response: { code: 200, description: '服务正常', example: '{}' },
    addedIn: '2020-05-01',
    calls24h: 12480,
    avgLatency: 12,
    errorRate: 0.01,
  },
  {
    id: 'ep-002',
    method: 'GET',
    path: '/api/v3/time',
    category: 'market',
    name: '服务器时间',
    version: 'v3',
    auth: 'public',
    rateLimit: { limit: 6000, window: '5min', scope: 'ip' },
    description: '获取 API 服务器当前时间。用于签名时的时间同步。',
    parameters: [],
    response: { code: 200, description: '服务器时间戳', example: '{ "serverTime": 1687250000000 }' },
    addedIn: '2020-05-01',
    calls24h: 8920,
    avgLatency: 8,
    errorRate: 0.00,
  },
  {
    id: 'ep-003',
    method: 'GET',
    path: '/api/v3/exchangeInfo',
    category: 'market',
    name: '交易对与规则',
    version: 'v3',
    auth: 'public',
    rateLimit: { limit: 200, window: '5min', scope: 'ip' },
    description: '获取当前交易规则与交易对信息。',
    parameters: [
      { name: 'symbol', type: 'string', required: false, description: '交易对，如 BTCUSDT' },
    ],
    response: { code: 200, description: '交易规则列表', example: '{ "symbols": [...] }' },
    addedIn: '2020-05-01',
    calls24h: 4250,
    avgLatency: 18,
    errorRate: 0.02,
  },
  {
    id: 'ep-004',
    method: 'GET',
    path: '/api/v3/ticker/24hr',
    category: 'market',
    name: '24h 行情',
    version: 'v3',
    auth: 'public',
    rateLimit: { limit: 6000, window: '5min', scope: 'ip' },
    description: '获取交易对 24h 行情数据。',
    parameters: [
      { name: 'symbol', type: 'string', required: false, description: '交易对' },
    ],
    response: { code: 200, description: '行情数据', example: '{ "symbol":"BTCUSDT", "priceChange":"...", ... }' },
    addedIn: '2020-05-01',
    calls24h: 18920,
    avgLatency: 22,
    errorRate: 0.05,
  },
  {
    id: 'ep-005',
    method: 'GET',
    path: '/api/v3/depth',
    category: 'market',
    name: '订单簿深度',
    version: 'v3',
    auth: 'public',
    rateLimit: { limit: 6000, window: '5min', scope: 'ip' },
    description: '获取订单簿买卖盘深度。',
    parameters: [
      { name: 'symbol', type: 'string', required: true, description: '交易对' },
      { name: 'limit', type: 'int', required: false, description: '深度档位（5/10/20/50/100/500/1000）', example: '100' },
    ],
    response: { code: 200, description: '订单簿', example: '{ "bids":[...], "asks":[...] }' },
    addedIn: '2020-05-01',
    calls24h: 24380,
    avgLatency: 16,
    errorRate: 0.02,
  },
  {
    id: 'ep-006',
    method: 'GET',
    path: '/api/v3/klines',
    category: 'market',
    name: 'K 线数据',
    version: 'v3',
    auth: 'public',
    rateLimit: { limit: 6000, window: '5min', scope: 'ip' },
    description: '获取 K 线（蜡烛图）数据。',
    parameters: [
      { name: 'symbol', type: 'string', required: true, description: '交易对' },
      { name: 'interval', type: 'string', required: true, description: '时间间隔（1m/5m/15m/1h/1d）' },
      { name: 'startTime', type: 'long', required: false, description: '起始时间' },
      { name: 'endTime', type: 'long', required: false, description: '结束时间' },
      { name: 'limit', type: 'int', required: false, description: '数量（默认 500，最大 1000）' },
    ],
    response: { code: 200, description: 'K 线数组', example: '[[...]]' },
    addedIn: '2020-05-01',
    calls24h: 15720,
    avgLatency: 28,
    errorRate: 0.04,
  },
  {
    id: 'ep-007',
    method: 'POST',
    path: '/api/v3/order',
    category: 'order',
    name: '下单',
    version: 'v3',
    auth: 'signed',
    rateLimit: { limit: 1200, window: '5min', scope: 'uid' },
    description: '提交新订单（限价/市价/止损等）。',
    parameters: [
      { name: 'symbol', type: 'string', required: true, description: '交易对' },
      { name: 'side', type: 'enum', required: true, description: 'BUY / SELL' },
      { name: 'type', type: 'enum', required: true, description: 'LIMIT / MARKET / STOP' },
      { name: 'quantity', type: 'decimal', required: false, description: '数量' },
      { name: 'price', type: 'decimal', required: false, description: '价格（LIMIT 必填）' },
      { name: 'timeInForce', type: 'enum', required: false, description: 'GTC / IOC / FOK' },
    ],
    response: { code: 200, description: '订单详情', example: '{ "orderId":..., "status":"..." }' },
    addedIn: '2020-05-01',
    calls24h: 8650,
    avgLatency: 42,
    errorRate: 0.12,
  },
  {
    id: 'ep-008',
    method: 'GET',
    path: '/api/v3/order',
    category: 'order',
    name: '查询订单',
    version: 'v3',
    auth: 'signed',
    rateLimit: { limit: 6000, window: '5min', scope: 'uid' },
    description: '查询当前订单状态。',
    parameters: [
      { name: 'symbol', type: 'string', required: true, description: '交易对' },
      { name: 'orderId', type: 'long', required: false, description: '订单 ID' },
    ],
    response: { code: 200, description: '订单详情', example: '{...}' },
    addedIn: '2020-05-01',
    calls24h: 12300,
    avgLatency: 18,
    errorRate: 0.03,
  },
  {
    id: 'ep-009',
    method: 'DELETE',
    path: '/api/v3/order',
    category: 'order',
    name: '撤销订单',
    version: 'v3',
    auth: 'signed',
    rateLimit: { limit: 3000, window: '5min', scope: 'uid' },
    description: '撤销指定未成交订单。',
    parameters: [
      { name: 'symbol', type: 'string', required: true, description: '交易对' },
      { name: 'orderId', type: 'long', required: true, description: '订单 ID' },
    ],
    response: { code: 200, description: '撤单结果', example: '{...}' },
    addedIn: '2020-05-01',
    calls24h: 4280,
    avgLatency: 24,
    errorRate: 0.06,
  },
  {
    id: 'ep-010',
    method: 'GET',
    path: '/api/v3/account',
    category: 'account',
    name: '账户信息',
    version: 'v3',
    auth: 'signed',
    rateLimit: { limit: 6000, window: '5min', scope: 'uid' },
    description: '获取当前账户余额与持仓。',
    parameters: [],
    response: { code: 200, description: '账户信息', example: '{ "balances":[...], ... }' },
    addedIn: '2020-05-01',
    calls24h: 9870,
    avgLatency: 32,
    errorRate: 0.05,
  },
  {
    id: 'ep-011',
    method: 'GET',
    path: '/api/v3/myTrades',
    category: 'account',
    name: '账户成交历史',
    version: 'v3',
    auth: 'signed',
    rateLimit: { limit: 3000, window: '5min', scope: 'uid' },
    description: '查询账户成交历史。',
    parameters: [
      { name: 'symbol', type: 'string', required: true, description: '交易对' },
      { name: 'startTime', type: 'long', required: false, description: '起始时间' },
      { name: 'endTime', type: 'long', required: false, description: '结束时间' },
    ],
    response: { code: 200, description: '成交列表', example: '[]' },
    addedIn: '2020-05-01',
    calls24h: 3650,
    avgLatency: 48,
    errorRate: 0.08,
  },
  {
    id: 'ep-012',
    method: 'POST',
    path: '/api/v3/userDataStream',
    category: 'account',
    name: '用户数据流',
    version: 'v3',
    auth: 'api-key',
    rateLimit: { limit: 300, window: '5min', scope: 'uid' },
    description: '开启用户数据流（WebSocket listenKey）。',
    parameters: [],
    response: { code: 200, description: 'listenKey', example: '{ "listenKey":"..." }' },
    addedIn: '2020-05-01',
    calls24h: 1820,
    avgLatency: 16,
    errorRate: 0.02,
  },
  {
    id: 'ep-013',
    method: 'POST',
    path: '/sapi/v1/capital/deposit/address',
    category: 'wallet',
    name: '充值地址',
    version: 'sapi v1',
    auth: 'signed',
    rateLimit: { limit: 300, window: '5min', scope: 'uid' },
    description: '获取币种充值地址。',
    parameters: [
      { name: 'coin', type: 'string', required: true, description: '币种' },
      { name: 'network', type: 'string', required: false, description: '网络' },
    ],
    response: { code: 200, description: '充值地址', example: '{ "address":"...", "tag":null }' },
    addedIn: '2020-09-15',
    calls24h: 2150,
    avgLatency: 56,
    errorRate: 0.15,
  },
  {
    id: 'ep-014',
    method: 'POST',
    path: '/sapi/v1/capital/withdraw/apply',
    category: 'wallet',
    name: '提现申请',
    version: 'sapi v1',
    auth: 'signed',
    rateLimit: { limit: 120, window: '5min', scope: 'uid' },
    description: '提交提现申请。',
    parameters: [
      { name: 'coin', type: 'string', required: true, description: '币种' },
      { name: 'address', type: 'string', required: true, description: '目标地址' },
      { name: 'amount', type: 'decimal', required: true, description: '金额' },
      { name: 'network', type: 'string', required: false, description: '网络' },
    ],
    response: { code: 200, description: '提现 ID', example: '{ "id":"..." }' },
    addedIn: '2020-09-15',
    calls24h: 980,
    avgLatency: 120,
    errorRate: 0.32,
  },
  {
    id: 'ep-015',
    method: 'GET',
    path: '/fapi/v1/account',
    category: 'position',
    name: '合约账户',
    version: 'fapi v1',
    auth: 'signed',
    rateLimit: { limit: 6000, window: '5min', scope: 'uid' },
    description: '获取合约账户信息（余额、持仓、保证金等）。',
    parameters: [],
    response: { code: 200, description: '合约账户', example: '{ "assets":[...], "positions":[...] }' },
    addedIn: '2021-06-20',
    calls24h: 5420,
    avgLatency: 38,
    errorRate: 0.04,
  },
  {
    id: 'ep-016',
    method: 'POST',
    path: '/fapi/v1/order',
    category: 'futures',
    name: '合约下单',
    version: 'fapi v1',
    auth: 'signed',
    rateLimit: { limit: 1200, window: '5min', scope: 'uid' },
    description: '提交合约订单。',
    parameters: [
      { name: 'symbol', type: 'string', required: true, description: '合约交易对' },
      { name: 'side', type: 'enum', required: true, description: 'BUY / SELL' },
      { name: 'type', type: 'enum', required: true, description: 'LIMIT / MARKET / STOP / TAKE_PROFIT' },
      { name: 'quantity', type: 'decimal', required: true, description: '数量' },
      { name: 'price', type: 'decimal', required: false, description: '价格' },
      { name: 'leverage', type: 'int', required: false, description: '杠杆倍数' },
      { name: 'positionSide', type: 'enum', required: false, description: 'LONG / SHORT / BOTH' },
    ],
    response: { code: 200, description: '订单详情', example: '{...}' },
    addedIn: '2021-06-20',
    calls24h: 7320,
    avgLatency: 36,
    errorRate: 0.10,
  },
  {
    id: 'ep-017',
    method: 'POST',
    path: '/api/v3/userDataStream/webhook',
    category: 'webhook',
    name: 'WebHook 注册',
    version: 'v3',
    auth: 'api-key',
    rateLimit: { limit: 120, window: '5min', scope: 'uid' },
    description: '注册 WebHook 端点接收账户事件通知。',
    parameters: [
      { name: 'url', type: 'string', required: true, description: '回调 URL' },
      { name: 'events', type: 'array', required: true, description: '订阅事件类型' },
    ],
    response: { code: 200, description: '注册结果', example: '{ "webhookId":"..." }' },
    addedIn: '2024-08-12',
    calls24h: 156,
    avgLatency: 78,
    errorRate: 0.21,
  },
  {
    id: 'ep-018',
    method: 'GET',
    path: '/sapi/v1/kyc/status',
    category: 'kyc',
    name: 'KYC 状态',
    version: 'sapi v1',
    auth: 'signed',
    rateLimit: { limit: 300, window: '5min', scope: 'uid' },
    description: '查询用户 KYC 等级与状态。',
    parameters: [],
    response: { code: 200, description: 'KYC 信息', example: '{ "level":"L2", "status":"verified" }' },
    addedIn: '2022-03-10',
    calls24h: 1280,
    avgLatency: 24,
    errorRate: 0.03,
  },
];

const CHANNELS: WsChannel[] = [
  {
    id: 'ch-001',
    channel: 'btcusdt@ticker',
    type: 'ticker',
    name: '24h Ticker 推送',
    updateFrequency: '1s',
    payload: 'symbol, priceChange, priceChangePercent, lastPrice, volume, ...',
    description: '推送交易对 24h 行情数据，每秒刷新。',
    rate: 1.0,
    subscribers: 8420,
    retention: '24h',
    example: '{ "stream":"btcusdt@ticker", "data":{...} }',
  },
  {
    id: 'ch-002',
    channel: 'btcusdt@depth20',
    type: 'depth',
    name: '订单簿深度 20 档',
    updateFrequency: '100ms',
    payload: 'bids, asks (20 档)',
    description: '推送 20 档买卖盘深度，每 100ms 刷新。',
    rate: 10.0,
    subscribers: 5680,
    retention: '24h',
    example: '{ "stream":"btcusdt@depth20", "data":{"bids":[[...]], "asks":[[...]]} }',
  },
  {
    id: 'ch-003',
    channel: 'btcusdt@trade',
    type: 'trade',
    name: '实时成交',
    updateFrequency: '实时',
    payload: 'price, quantity, buyerIsMaker, tradeId, time',
    description: '推送逐笔成交流水，实时触发。',
    rate: 25.0,
    subscribers: 7320,
    retention: '24h',
    example: '{ "stream":"btcusdt@trade", "data":{...} }',
  },
  {
    id: 'ch-004',
    channel: 'btcusdt@kline_1m',
    type: 'kline',
    name: 'K 线 1m',
    updateFrequency: '1s',
    payload: 'open, high, low, close, volume, ...',
    description: '推送 1 分钟 K 线，每秒刷新。',
    rate: 1.0,
    subscribers: 4960,
    retention: '24h',
    example: '{ "stream":"btcusdt@kline_1m", "data":{ "k":{...} } }',
  },
  {
    id: 'ch-005',
    channel: 'btcusdt@depth',
    type: 'orderbook',
    name: '增量订单簿',
    updateFrequency: '实时',
    payload: 'bidsDelta, asksDelta',
    description: '增量订单簿推送（需本地维护完整深度）。',
    rate: 50.0,
    subscribers: 2840,
    retention: '24h',
    example: '{ "stream":"btcusdt@depth", "data":{ "bids":[[...]], "asks":[[...]] } }',
  },
  {
    id: 'ch-006',
    channel: 'user@account',
    type: 'account',
    name: '账户变更',
    updateFrequency: '事件触发',
    payload: 'eventType, balances, ...',
    description: '推送账户余额、保证金等变更事件。',
    rate: 0.1,
    subscribers: 4220,
    retention: '24h',
    example: '{ "stream":"user@account", "data":{...} }',
  },
  {
    id: 'ch-007',
    channel: 'user@order',
    type: 'order',
    name: '订单状态变更',
    updateFrequency: '事件触发',
    payload: 'orderId, status, executedQty, ...',
    description: '推送订单创建、成交、撤销、过期等状态变更。',
    rate: 2.0,
    subscribers: 5160,
    retention: '24h',
    example: '{ "stream":"user@order", "data":{...} }',
  },
  {
    id: 'ch-008',
    channel: 'user@position',
    type: 'position',
    name: '持仓变更',
    updateFrequency: '事件触发',
    payload: 'symbol, positionAmt, unrealizedProfit, ...',
    description: '推送合约持仓变更（开仓/平仓/强平/资金费率等）。',
    rate: 0.5,
    subscribers: 3120,
    retention: '24h',
    example: '{ "stream":"user@position", "data":{...} }',
  },
];

const SDKS: Sdk[] = [
  {
    id: 'sdk-py',
    language: 'python',
    name: 'zsdex-python',
    version: 'v3.2.0',
    description: '官方 Python SDK，支持同步 / 异步、WebSocket、合约、钱包。',
    installCommand: 'pip install zsdex',
    repoUrl: 'https://github.com/zsdex/zsdex-python',
    docsUrl: 'https://docs.zsdex.com/sdk/python',
    downloads: 1245800,
    stars: 1820,
    lastRelease: '2026-06-18',
    features: ['同步 / 异步', 'WebSocket', '自动重连', '类型注解', '错误重试', '速率限制'],
    status: 'stable',
    maintainer: 'ZSDEX 官方',
    coverage: 96,
  },
  {
    id: 'sdk-js',
    language: 'javascript',
    name: 'zsdex-js',
    version: 'v3.2.1',
    description: '官方 JavaScript SDK，浏览器 + Node.js 通用。',
    installCommand: 'npm install zsdex',
    repoUrl: 'https://github.com/zsdex/zsdex-js',
    docsUrl: 'https://docs.zsdex.com/sdk/javascript',
    downloads: 2156000,
    stars: 2340,
    lastRelease: '2026-07-02',
    features: ['Promise / async-await', 'WebSocket', '浏览器兼容', 'Tree-shakeable', 'TypeScript 类型'],
    status: 'stable',
    maintainer: 'ZSDEX 官方',
    coverage: 94,
  },
  {
    id: 'sdk-ts',
    language: 'typescript',
    name: 'zsdex-ts',
    version: 'v3.2.1',
    description: 'TypeScript SDK，全量类型定义，类型安全。',
    installCommand: 'npm install zsdex-ts',
    repoUrl: 'https://github.com/zsdex/zsdex-ts',
    docsUrl: 'https://docs.zsdex.com/sdk/typescript',
    downloads: 1820000,
    stars: 1980,
    lastRelease: '2026-07-02',
    features: ['完整类型', '类型安全', '运行时检查', 'ESM / CommonJS'],
    status: 'stable',
    maintainer: 'ZSDEX 官方',
    coverage: 100,
  },
  {
    id: 'sdk-go',
    language: 'go',
    name: 'zsdex-go',
    version: 'v3.1.5',
    description: '官方 Go SDK，高性能、适合做市与量化。',
    installCommand: 'go get github.com/zsdex/zsdex-go',
    repoUrl: 'https://github.com/zsdex/zsdex-go',
    docsUrl: 'https://docs.zsdex.com/sdk/go',
    downloads: 482000,
    stars: 1120,
    lastRelease: '2026-05-12',
    features: ['高性能', '并发安全', 'Context 支持', '结构化日志'],
    status: 'stable',
    maintainer: 'ZSDEX 官方',
    coverage: 88,
  },
  {
    id: 'sdk-java',
    language: 'java',
    name: 'zsdex-java',
    version: 'v3.1.0',
    description: '官方 Java SDK，企业级集成。',
    installCommand: 'mvn: com.zsdex:zsdex-java:3.1.0',
    repoUrl: 'https://github.com/zsdex/zsdex-java',
    docsUrl: 'https://docs.zsdex.com/sdk/java',
    downloads: 218000,
    stars: 580,
    lastRelease: '2026-04-08',
    features: ['同步 / 异步', 'WebSocket', '企业级', 'Spring 集成示例'],
    status: 'stable',
    maintainer: 'ZSDEX 官方',
    coverage: 82,
  },
  {
    id: 'sdk-rust',
    language: 'rust',
    name: 'zsdex-rs',
    version: 'v0.9.2',
    description: '社区 Rust SDK，高性能、内存安全。',
    installCommand: 'cargo add zsdex',
    repoUrl: 'https://github.com/zsdex-community/zsdex-rs',
    docsUrl: 'https://docs.rs/zsdex',
    downloads: 86000,
    stars: 420,
    lastRelease: '2026-06-25',
    features: ['零成本抽象', '异步运行时', '类型安全', 'no_std 兼容'],
    status: 'beta',
    maintainer: '社区贡献',
    coverage: 76,
  },
  {
    id: 'sdk-cs',
    language: 'csharp',
    name: 'ZsDex.Net',
    version: 'v2.8.0',
    description: '社区 C# / .NET SDK，兼容 .NET 6+。',
    installCommand: 'dotnet add package ZsDex',
    repoUrl: 'https://github.com/zsdex-community/ZsDex.Net',
    docsUrl: 'https://docs.zsdex.com/sdk/csharp',
    downloads: 48000,
    stars: 180,
    lastRelease: '2026-03-15',
    features: ['async/await', 'WebSocket', '.NET 6+', '依赖注入'],
    status: 'stable',
    maintainer: '社区贡献',
    coverage: 68,
  },
  {
    id: 'sdk-php',
    language: 'php',
    name: 'zsdex-php',
    version: 'v2.5.0',
    description: '社区 PHP SDK，兼容 PHP 7.4+。',
    installCommand: 'composer require zsdex/zsdex-php',
    repoUrl: 'https://github.com/zsdex-community/zsdex-php',
    docsUrl: 'https://docs.zsdex.com/sdk/php',
    downloads: 62000,
    stars: 145,
    lastRelease: '2026-02-20',
    features: ['PHP 7.4+', 'PSR-4', 'WebSocket', 'Laravel 集成'],
    status: 'stable',
    maintainer: '社区贡献',
    coverage: 62,
  },
];

const DOCS: DocPage[] = [
  {
    id: 'doc-001',
    category: 'quickstart',
    title: '5 分钟快速接入',
    description: '从零开始，5 分钟内完成 API Key 申请、SDK 安装、首次调用。',
    readTime: 5,
    lastUpdated: '2026-07-15',
    views: 128000,
    helpful: 96,
    author: 'ZSDEX 技术团队',
    tags: ['入门', '快速开始', 'SDK'],
    content: ['注册账号', '完成 KYC L2', '申请 API Key', '安装 SDK', '运行第一个示例', '订阅行情'],
    related: ['doc-002', 'doc-003'],
  },
  {
    id: 'doc-002',
    category: 'authentication',
    title: 'API 认证与签名',
    description: '详解 HMAC-SHA256 签名算法、参数排序、时间戳防重放、IP 白名单。',
    readTime: 8,
    lastUpdated: '2026-07-10',
    views: 82000,
    helpful: 94,
    author: 'ZSDEX 技术团队',
    tags: ['签名', '安全', '认证'],
    content: ['API Key 类型', 'HMAC-SHA256 签名', '参数排序规则', '时间戳窗口', 'IP 白名单', '常见错误'],
    related: ['doc-001', 'doc-003', 'doc-004'],
  },
  {
    id: 'doc-003',
    category: 'rate-limit',
    title: '速率限制详解',
    description: '详解 REST 与 WebSocket 速率限制策略、最佳实践、错误处理。',
    readTime: 6,
    lastUpdated: '2026-07-08',
    views: 58000,
    helpful: 92,
    author: 'ZSDEX 技术团队',
    tags: ['限速', '429', '最佳实践'],
    content: ['REST 速率限制', 'WebSocket 速率', '权重机制', '升级路径', '降级策略', '监控告警'],
    related: ['doc-002', 'doc-008'],
  },
  {
    id: 'doc-004',
    category: 'errors',
    title: '错误码与处理',
    description: '完整错误码列表、错误处理最佳实践、重试策略。',
    readTime: 7,
    lastUpdated: '2026-07-12',
    views: 65000,
    helpful: 90,
    author: 'ZSDEX 技术团队',
    tags: ['错误', '异常', '重试'],
    content: ['错误码分类', '4xx 客户端错误', '5xx 服务端错误', '业务错误码', '重试策略', '熔断机制'],
    related: ['doc-002', 'doc-008'],
  },
  {
    id: 'doc-005',
    category: 'webhook',
    title: 'WebHook 事件订阅',
    description: 'WebHook 注册、签名验证、重试机制、安全实践。',
    readTime: 8,
    lastUpdated: '2026-07-05',
    views: 28000,
    helpful: 88,
    author: 'ZSDEX 技术团队',
    tags: ['WebHook', '事件', '回调'],
    content: ['WebHook 注册', '签名验证', '事件类型', '重试机制', '幂等性', '最佳实践'],
    related: ['doc-002', 'doc-008'],
  },
  {
    id: 'doc-006',
    category: 'migration',
    title: '从 v2 迁移到 v3',
    description: 'v2 → v3 迁移指南，包含 breaking changes、自动化工具、灰度策略。',
    readTime: 12,
    lastUpdated: '2026-06-28',
    views: 42000,
    helpful: 86,
    author: 'ZSDEX 技术团队',
    tags: ['迁移', 'v2', 'v3'],
    content: ['Breaking Changes', '路径变更', '签名差异', '灰度切换', '回滚方案', '迁移工具'],
    related: ['doc-002', 'doc-008'],
  },
  {
    id: 'doc-007',
    category: 'best-practices',
    title: '量化交易最佳实践',
    description: '做市、套利、统计套利等场景下的最佳实践与代码示例。',
    readTime: 15,
    lastUpdated: '2026-07-01',
    views: 38000,
    helpful: 95,
    author: 'ZSDEX 量化实验室',
    tags: ['量化', '做市', '套利'],
    content: ['时钟同步', '订单管理', '风控集成', '延迟优化', '资金管理', '回测框架'],
    related: ['doc-001', 'doc-008'],
  },
  {
    id: 'doc-008',
    category: 'faq',
    title: '常见问题 FAQ',
    description: '高频问题与解答（认证、限速、订单、合约、提现等）。',
    readTime: 10,
    lastUpdated: '2026-07-15',
    views: 96000,
    helpful: 89,
    author: 'ZSDEX 技术团队',
    tags: ['FAQ', '问题', '帮助'],
    content: ['认证类问题', '限速类问题', '订单类问题', '合约类问题', '提现类问题', '账户类问题'],
    related: ['doc-002', 'doc-003', 'doc-004'],
  },
];

const SERVICES: ServiceHealth[] = [
  {
    id: 'svc-rest',
    name: 'REST API',
    status: 'operational',
    uptime30d: 99.987,
    avgLatency: 24,
    errorRate: 0.05,
    region: 'global',
    description: 'REST API 网关，覆盖行情、交易、账户、钱包等接口。',
  },
  {
    id: 'svc-ws',
    name: 'WebSocket Stream',
    status: 'operational',
    uptime30d: 99.992,
    avgLatency: 12,
    errorRate: 0.02,
    region: 'global',
    description: 'WebSocket 实时行情与用户数据流。',
  },
  {
    id: 'svc-match',
    name: '撮合引擎',
    status: 'operational',
    uptime30d: 99.999,
    avgLatency: 2,
    errorRate: 0.001,
    region: 'global',
    description: '核心撮合引擎，纳秒级延迟。',
  },
  {
    id: 'svc-wallet',
    name: '钱包服务',
    status: 'operational',
    uptime30d: 99.985,
    avgLatency: 156,
    errorRate: 0.08,
    region: 'global',
    description: '充值、提现、资金流水服务。',
  },
  {
    id: 'svc-futures',
    name: '合约服务',
    status: 'degraded',
    uptime30d: 99.872,
    avgLatency: 38,
    errorRate: 0.18,
    region: 'global',
    lastIncident: '2026-07-19 13:50',
    description: '合约账户、持仓、订单、资金费率服务。当前部分接口响应延迟偏高。',
  },
  {
    id: 'svc-cdn',
    name: 'API 文档与 SDK 下载',
    status: 'operational',
    uptime30d: 99.998,
    avgLatency: 56,
    errorRate: 0.01,
    region: 'global',
    description: 'API 文档站点、SDK 下载分发。',
  },
];

const SANDBOXES: SandboxEnv[] = [
  {
    id: 'sb-spot',
    name: '现货沙盒',
    type: 'spot',
    baseUrl: 'https://sandbox-api.zsdex.com/api/v3',
    wsUrl: 'wss://sandbox-stream.zsdex.com/ws',
    apiKey: 'sb-spot-demo-key-***',
    rateLimit: '1200 req / 5min',
    resetPolicy: '每日 00:00 UTC 重置',
    features: ['完整现货接口', '模拟行情', 'WebSocket', '完整订单生命周期'],
    description: '现货交易沙盒环境，提供完整现货 API 模拟。',
  },
  {
    id: 'sb-futures',
    name: '合约沙盒',
    type: 'futures',
    baseUrl: 'https://sandbox-fapi.zsdex.com/fapi/v1',
    wsUrl: 'wss://sandbox-fstream.zsdex.com/ws',
    apiKey: 'sb-futures-demo-key-***',
    rateLimit: '1200 req / 5min',
    resetPolicy: '每日 00:00 UTC 重置',
    features: ['完整合约接口', '模拟行情', '杠杆 / 保证金', '强平流程'],
    description: '合约交易沙盒环境，提供完整合约 API 模拟。',
  },
  {
    id: 'sb-margin',
    name: '杠杆沙盒',
    type: 'margin',
    baseUrl: 'https://sandbox-margin.zsdex.com/mapi/v1',
    wsUrl: 'wss://sandbox-mstream.zsdex.com/ws',
    apiKey: 'sb-margin-demo-key-***',
    rateLimit: '1200 req / 5min',
    resetPolicy: '每日 00:00 UTC 重置',
    features: ['杠杆交易', '借贷接口', '强平机制', '利息计算'],
    description: '杠杆交易沙盒环境，模拟借贷与杠杆交易全流程。',
  },
  {
    id: 'sb-options',
    name: '期权沙盒',
    type: 'options',
    baseUrl: 'https://sandbox-eapi.zsdex.com/eapi/v1',
    wsUrl: 'wss://sandbox-estream.zsdex.com/ws',
    apiKey: 'sb-options-demo-key-***',
    rateLimit: '600 req / 5min',
    resetPolicy: '每日 00:00 UTC 重置',
    features: ['期权定价', 'Greeks 计算', '组合策略', '行权流程'],
    description: '期权交易沙盒环境，支持欧式 / 美式期权模拟。',
  },
];

const APIKEYS: ApiKey[] = [
  {
    id: 'key-001',
    name: '量化主策略',
    type: 'trade',
    permissions: ['读取行情', '下单', '撤单', '查询账户'],
    ipWhitelist: ['203.0.113.0/24', '198.51.100.5'],
    createdAt: '2024-08-12',
    lastUsed: '2026-07-19 14:25',
    calls24h: 128400,
    status: 'active',
  },
  {
    id: 'key-002',
    name: '行情服务',
    type: 'read-only',
    permissions: ['读取行情', '读取 K 线'],
    ipWhitelist: ['203.0.113.0/24'],
    createdAt: '2024-09-05',
    lastUsed: '2026-07-19 14:25',
    calls24h: 856000,
    status: 'active',
  },
  {
    id: 'key-003',
    name: '做市机器人',
    type: 'trade',
    permissions: ['读取行情', '下单', '撤单'],
    ipWhitelist: ['198.51.100.10', '198.51.100.11', '198.51.100.12'],
    createdAt: '2025-01-22',
    lastUsed: '2026-07-19 14:25',
    calls24h: 2450000,
    status: 'active',
  },
  {
    id: 'key-004',
    name: '结算系统',
    type: 'withdraw',
    permissions: ['提现', '查询账户'],
    ipWhitelist: ['10.0.1.0/24'],
    createdAt: '2025-03-18',
    lastUsed: '2026-07-19 03:00',
    calls24h: 1280,
    status: 'active',
  },
  {
    id: 'key-005',
    name: '历史 Key',
    type: 'read-only',
    permissions: ['读取行情'],
    ipWhitelist: [],
    createdAt: '2023-12-10',
    lastUsed: '2025-08-15',
    calls24h: 0,
    status: 'revoked',
  },
];

// ============== Helper ==============

function formatNumber(n: number): string {
  if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(2) + 'B';
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(2) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return n.toLocaleString('zh-CN');
}

const methodColor = (m: HttpMethod): { color: string; bg: string } => {
  if (m === 'GET') return { color: BRAND.success, bg: BRAND.successLt };
  if (m === 'POST') return { color: BRAND.info, bg: BRAND.infoLt };
  if (m === 'PUT') return { color: BRAND.warning, bg: BRAND.warningLt };
  if (m === 'DELETE') return { color: BRAND.danger, bg: BRAND.dangerLt };
  return { color: BRAND.amber, bg: BRAND.amberLt };
};

const langIcon = (l: SdkLang): string => {
  const m: Record<SdkLang, string> = {
    python: 'Py',
    javascript: 'JS',
    typescript: 'TS',
    go: 'Go',
    java: 'J',
    rust: 'Rs',
    csharp: 'C#',
    php: 'Php',
  };
  return m[l];
};

const statusColor = (s: ServiceStatus): { color: string; bg: string; label: string } => {
  const m: Record<ServiceStatus, { color: string; bg: string; label: string }> = {
    operational: { color: BRAND.success, bg: BRAND.successLt, label: '正常运行' },
    degraded: { color: BRAND.warning, bg: BRAND.warningLt, label: '性能下降' },
    'partial-outage': { color: BRAND.amber, bg: BRAND.amberLt, label: '部分中断' },
    'major-outage': { color: BRAND.danger, bg: BRAND.dangerLt, label: '重大中断' },
    maintenance: { color: BRAND.info, bg: BRAND.infoLt, label: '维护中' },
  };
  return m[s];
};

// ============== 组件 ==============

export function PortalApiPlatform() {
  const [tab, setTab] = useState<Tab>('overview');
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState<ApiCategory | 'all'>('all');
  const [authFilter, setAuthFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'calls' | 'latency'>('calls');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [drawer, setDrawer] = useState<DrawerState>({ open: false, type: null, payload: null });
  const [helpOpen, setHelpOpen] = useState(false);
  const [docCat, setDocCat] = useState<DocCategory | 'all'>('all');
  const [langFilter, setLangFilter] = useState<SdkLang | 'all'>('all');
  const [kpi, setKpi] = useState<KpiSnapshot>({
    totalCalls: 184250000,
    activeKeys: 12480,
    avgLatency: 24,
    uptime: 99.987,
    wsConnections: 28420,
    successRate: 99.94,
    newKeys: 32,
    bandwidth: 1.25,
  });
  const searchRef = useRef<HTMLInputElement>(null);
  const [copied, setCopied] = useState<string | null>(null);

  // 实时数据波动
  useEffect(() => {
    const t = setInterval(() => {
      setKpi((p) => ({
        ...p,
        totalCalls: p.totalCalls + Math.floor(Math.random() * 5000) + 1000,
        activeKeys: p.activeKeys + (Math.random() > 0.5 ? 1 : 0) - (Math.random() > 0.7 ? 1 : 0),
        avgLatency: Math.max(15, Math.min(35, p.avgLatency + (Math.random() - 0.5) * 2)),
        wsConnections: Math.max(20000, p.wsConnections + Math.floor(Math.random() * 101) - 50),
        successRate: Math.max(99.5, Math.min(99.99, p.successRate + (Math.random() - 0.5) * 0.02)),
        bandwidth: Math.max(0.8, Math.min(1.8, p.bandwidth + (Math.random() - 0.5) * 0.05)),
      }));
    }, 3500);
    return () => clearInterval(t);
  }, []);

  // 快捷键
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === '/') {
        e.preventDefault();
        searchRef.current?.focus();
      } else if (e.key === 'Escape') {
        if (helpOpen) setHelpOpen(false);
        else if (drawer.open) setDrawer({ open: false, type: null, payload: null });
      } else if (e.key === '?') {
        setHelpOpen((v) => !v);
      } else if (e.key === '1') setTab('overview');
      else if (e.key === '2') setTab('rest');
      else if (e.key === '3') setTab('websocket');
      else if (e.key === '4') setTab('sdk');
      else if (e.key === '5') setTab('sandbox');
      else if (e.key === '6') setTab('docs');
      else if (e.key === '7') setTab('status');
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [drawer.open, helpOpen]);

  // 复制
  const copy = (text: string, id: string) => {
    if (navigator?.clipboard) navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 1500);
  };

  // 过滤 / 排序
  const filteredEndpoints = useMemo(() => {
    return ENDPOINTS
      .filter((e) => (catFilter === 'all' ? true : e.category === catFilter))
      .filter((e) => (authFilter === 'all' ? true : e.auth === authFilter))
      .filter((e) => {
        if (!search) return true;
        const q = search.toLowerCase();
        return (
          e.id.toLowerCase().includes(q) ||
          e.path.toLowerCase().includes(q) ||
          e.name.toLowerCase().includes(q) ||
          e.description.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        const dir = sortDir === 'asc' ? 1 : -1;
        if (sortBy === 'name') return dir * a.name.localeCompare(b.name);
        if (sortBy === 'calls') return dir * (a.calls24h - b.calls24h);
        return dir * (a.avgLatency - b.avgLatency);
      });
  }, [catFilter, authFilter, search, sortBy, sortDir]);

  const filteredChannels = useMemo(() => {
    return CHANNELS.filter((c) => {
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        c.id.toLowerCase().includes(q) ||
        c.channel.toLowerCase().includes(q) ||
        c.name.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q)
      );
    });
  }, [search]);

  const filteredSdks = useMemo(() => {
    return SDKS.filter((s) => (langFilter === 'all' ? true : s.language === langFilter)).filter((s) => {
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        s.id.toLowerCase().includes(q) ||
        s.name.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q)
      );
    });
  }, [langFilter, search]);

  const filteredDocs = useMemo(() => {
    return DOCS.filter((d) => (docCat === 'all' ? true : d.category === docCat)).filter((d) => {
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        d.id.toLowerCase().includes(q) ||
        d.title.toLowerCase().includes(q) ||
        d.description.toLowerCase().includes(q) ||
        d.tags.some((t) => t.toLowerCase().includes(q))
      );
    });
  }, [docCat, search]);

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
        className="p-4 rounded-xl"
        style={{ backgroundColor: BRAND.bgCard, border: `1px solid ${BRAND.border}` }}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${color}20`, color }}>
            <Icon size={18} />
          </div>
          {trend !== undefined && (
            <span className="text-xs font-mono flex items-center gap-1" style={{ color: trend >= 0 ? BRAND.success : BRAND.danger }}>
              {trend >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownLeft size={12} />}
              {Math.abs(trend).toFixed(2)}%
            </span>
          )}
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-bold font-mono" style={{ color: BRAND.text }}>
            {typeof display === 'number' && !isNaN(display) ? (Number.isInteger(target) ? formatNumber(Math.round(display)) : display.toFixed(2)) : value}
          </span>
          {suffix && <span className="text-xs" style={{ color: BRAND.textMute }}>{suffix}</span>}
        </div>
        <div className="text-xs mt-1" style={{ color: BRAND.textSub }}>{label}</div>
        {hint && <div className="text-[10px] mt-2" style={{ color: BRAND.textMute }}>{hint}</div>}
      </div>
    );
  };

  // 当前 Drawer payload
  const drawerEndpoint = drawer.type === 'endpoint' ? ENDPOINTS.find((e) => e.id === drawer.payload) : null;
  const drawerChannel = drawer.type === 'channel' ? CHANNELS.find((c) => c.id === drawer.payload) : null;
  const drawerSdk = drawer.type === 'sdk' ? SDKS.find((s) => s.id === drawer.payload) : null;
  const drawerDoc = drawer.type === 'doc' ? DOCS.find((d) => d.id === drawer.payload) : null;
  const drawerService = drawer.type === 'service' ? SERVICES.find((s) => s.id === drawer.payload) : null;
  const drawerKey = drawer.type === 'key' ? APIKEYS.find((k) => k.id === drawer.payload) : null;
  const drawerSandbox = drawer.type === 'sandbox' ? SANDBOXES.find((s) => s.id === drawer.payload) : null;

  return (
    <div className="min-h-screen" style={{ backgroundColor: BRAND.bg, color: BRAND.text }}>
      {/* ============== Hero ============== */}
      <section className="px-6 lg:px-12 pt-10 pb-8" style={{ borderBottom: `1px solid ${BRAND.border}` }}>
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <span className="text-[10px] font-mono px-2 py-0.5 rounded uppercase tracking-wider flex items-center gap-1" style={{ backgroundColor: BRAND.primaryLt, color: BRAND.primary }}>
              <Code2 size={12} />
              API PLATFORM · Q05 P3.17
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded uppercase tracking-wider" style={{ backgroundColor: STATUS.LIVE.bg, color: STATUS.LIVE.color }}>
              <span className="inline-block w-1.5 h-1.5 rounded-full mr-1" style={{ backgroundColor: STATUS.LIVE.dot }} />
              全量服务在线
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded uppercase tracking-wider" style={{ backgroundColor: BRAND.infoLt, color: BRAND.info }}>
              99.99% SLA
            </span>
          </div>
          <h1 className="text-3xl lg:text-4xl font-bold mb-3" style={{ color: BRAND.text }}>
            API 开放平台
          </h1>
          <p className="text-sm lg:text-base max-w-3xl" style={{ color: BRAND.textSub }}>
            中萨数字科技交易所开放 API 门户。为机构客户、做市商、量化团队、第三方应用开发者提供 REST API、WebSocket 实时行情、官方 SDK、沙盒环境与完整文档中心。
            工业级稳定性（99.99% SLA）、毫秒级延迟、覆盖现货 / 合约 / 杠杆 / 期权全产品线。
          </p>
        </div>
      </section>

      {/* ============== 实时 KPI ============== */}
      <section className="px-6 lg:px-12 py-6" style={{ borderBottom: `1px solid ${BRAND.border}` }}>
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
            <KpiCard label="24h API 调用" value={kpi.totalCalls} icon={Activity} color={BRAND.primary} trend={2.4} />
            <KpiCard label="活跃 API Key" value={kpi.activeKeys} icon={KeyRound} color={BRAND.info} trend={0.5} />
            <KpiCard label="平均延迟" value={kpi.avgLatency} suffix="ms" icon={Zap} color={BRAND.success} trend={-1.2} />
            <KpiCard label="可用性 (30d)" value={kpi.uptime} suffix="%" icon={ShieldCheck} color={BRAND.success} trend={0.01} />
            <KpiCard label="WS 连接数" value={kpi.wsConnections} icon={Wifi} color={BRAND.warning} trend={1.8} />
            <KpiCard label="请求成功率" value={kpi.successRate} suffix="%" icon={CheckCircle2} color={BRAND.success} trend={0.02} />
            <KpiCard label="本月新增 Key" value={kpi.newKeys} icon={Plus} color={BRAND.primary} trend={12.5} />
            <KpiCard label="出口带宽" value={kpi.bandwidth} suffix="Gbps" icon={Network} color={BRAND.info} trend={3.1} />
          </div>
        </div>
      </section>

      {/* ============== 工具栏 + Tab ============== */}
      <section className="px-6 lg:px-12 py-4 sticky top-0 z-30" style={{ backgroundColor: BRAND.headerBg, borderBottom: `1px solid ${BRAND.border}`, backdropFilter: 'blur(12px)' }}>
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-wrap items-center gap-3 mb-3">
            <div className="flex-1 min-w-[220px] relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: BRAND.textMute }} />
              <input
                ref={searchRef}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="搜索端点 / 频道 / SDK / 文档 / 状态（按 / 聚焦）"
                className="w-full pl-9 pr-9 py-2 rounded-lg text-sm outline-none font-mono"
                style={{ backgroundColor: BRAND.bgCard, border: `1px solid ${BRAND.border}`, color: BRAND.text }}
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded" style={{ color: BRAND.textMute }}>
                  <X size={12} />
                </button>
              )}
            </div>
            <select
              value={catFilter}
              onChange={(e) => setCatFilter(e.target.value as any)}
              className="px-3 py-2 rounded-lg text-xs font-mono outline-none"
              style={{ backgroundColor: BRAND.bgCard, border: `1px solid ${BRAND.border}`, color: BRAND.text }}
            >
              <option value="all">全部分类</option>
              <option value="market">market 行情</option>
              <option value="account">account 账户</option>
              <option value="order">order 订单</option>
              <option value="wallet">wallet 钱包</option>
              <option value="position">position 持仓</option>
              <option value="futures">futures 合约</option>
              <option value="webhook">webhook 回调</option>
              <option value="kyc">kyc 合规</option>
            </select>
            <select
              value={authFilter}
              onChange={(e) => setAuthFilter(e.target.value)}
              className="px-3 py-2 rounded-lg text-xs font-mono outline-none"
              style={{ backgroundColor: BRAND.bgCard, border: `1px solid ${BRAND.border}`, color: BRAND.text }}
            >
              <option value="all">全部认证</option>
              <option value="public">public 公开</option>
              <option value="signed">signed 签名</option>
              <option value="api-key">api-key 密钥</option>
            </select>
            <div className="flex items-center gap-1">
              <button
                onClick={() => { if (sortBy === 'calls') setSortDir(sortDir === 'asc' ? 'desc' : 'asc'); else { setSortBy('calls'); setSortDir('desc'); } }}
                className="px-3 py-2 rounded-lg text-xs font-mono flex items-center gap-1"
                style={{ backgroundColor: sortBy === 'calls' ? BRAND.primaryLt : BRAND.bgCard, color: sortBy === 'calls' ? BRAND.primary : BRAND.text, border: `1px solid ${sortBy === 'calls' ? BRAND.primary : BRAND.border}` }}
              >
                调用 {sortBy === 'calls' && (sortDir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}
              </button>
              <button
                onClick={() => { if (sortBy === 'latency') setSortDir(sortDir === 'asc' ? 'desc' : 'asc'); else { setSortBy('latency'); setSortDir('asc'); } }}
                className="px-3 py-2 rounded-lg text-xs font-mono flex items-center gap-1"
                style={{ backgroundColor: sortBy === 'latency' ? BRAND.primaryLt : BRAND.bgCard, color: sortBy === 'latency' ? BRAND.primary : BRAND.text, border: `1px solid ${sortBy === 'latency' ? BRAND.primary : BRAND.border}` }}
              >
                延迟 {sortBy === 'latency' && (sortDir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}
              </button>
              <button
                onClick={() => { if (sortBy === 'name') setSortDir(sortDir === 'asc' ? 'desc' : 'asc'); else { setSortBy('name'); setSortDir('asc'); } }}
                className="px-3 py-2 rounded-lg text-xs font-mono flex items-center gap-1"
                style={{ backgroundColor: sortBy === 'name' ? BRAND.primaryLt : BRAND.bgCard, color: sortBy === 'name' ? BRAND.primary : BRAND.text, border: `1px solid ${sortBy === 'name' ? BRAND.primary : BRAND.border}` }}
              >
                名称 {sortBy === 'name' && (sortDir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}
              </button>
            </div>
            <button
              onClick={() => setHelpOpen(true)}
              className="px-3 py-2 rounded-lg text-xs font-mono flex items-center gap-1"
              style={{ backgroundColor: BRAND.bgCard, color: BRAND.text, border: `1px solid ${BRAND.border}` }}
            >
              <HelpCircle size={12} /> 快捷键
            </button>
          </div>
          <div className="flex flex-wrap gap-1">
            {([
              { key: 'overview', label: '总览', icon: Radar, n: '1' },
              { key: 'rest', label: 'REST API', icon: Code, n: '2' },
              { key: 'websocket', label: 'WebSocket', icon: Wifi, n: '3' },
              { key: 'sdk', label: 'SDK 下载', icon: Download, n: '4' },
              { key: 'sandbox', label: '沙盒环境', icon: Box, n: '5' },
              { key: 'docs', label: '文档中心', icon: BookOpen, n: '6' },
              { key: 'status', label: '服务状态', icon: Activity, n: '7' },
            ] as const).map((t) => {
              const Icon = t.icon;
              const active = tab === t.key;
              return (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className="px-3 py-2 rounded-lg text-xs font-mono flex items-center gap-2 transition-all"
                  style={{
                    backgroundColor: active ? BRAND.primaryLt : 'transparent',
                    color: active ? BRAND.primary : BRAND.textSub,
                    border: `1px solid ${active ? BRAND.primary : 'transparent'}`,
                  }}
                >
                  <Icon size={12} />
                  {t.label}
                  <span className="text-[10px] opacity-50">{t.n}</span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* ============== 内容区 ============== */}
      <main className="px-6 lg:px-12 py-8">
        <div className="max-w-7xl mx-auto space-y-8">
          {tab === 'overview' && (
            <>
              {/* API 接入路径 */}
              <section>
                <h2 className="text-sm font-mono mb-3 flex items-center gap-2" style={{ color: BRAND.text }}>
                  <Rocket size={14} style={{ color: BRAND.primary }} />
                  5 分钟接入路径
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                  {[
                    { n: '01', t: '注册账号', d: '完成 KYC L2', icon: Users, color: BRAND.primary },
                    { n: '02', t: '申请 API Key', d: '选择权限 + IP 白名单', icon: KeyRound, color: BRAND.info },
                    { n: '03', t: '安装 SDK', d: 'Python / JS / Go / Java', icon: Download, color: BRAND.warning },
                    { n: '04', t: '沙盒联调', d: '完整模拟环境', icon: Box, color: BRAND.success },
                    { n: '05', t: '生产部署', d: '切换到生产 endpoint', icon: Rocket, color: BRAND.danger },
                  ].map((s, i) => {
                    const Icon = s.icon;
                    return (
                      <div
                        key={s.n}
                        className="p-4 rounded-xl relative"
                        style={{
                          backgroundColor: BRAND.bgCard,
                          border: `1px solid ${BRAND.border}`,
                          animation: `fadeInUp 0.4s ease-out ${i * 0.05}s both`,
                        }}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-2xl font-bold font-mono" style={{ color: s.color }}>{s.n}</span>
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${s.color}20`, color: s.color }}>
                            <Icon size={16} />
                          </div>
                        </div>
                        <div className="text-sm font-semibold mb-1" style={{ color: BRAND.text }}>{s.t}</div>
                        <div className="text-[10px]" style={{ color: BRAND.textMute }}>{s.d}</div>
                        {i < 4 && (
                          <div className="hidden md:block absolute -right-2 top-1/2 -translate-y-1/2 z-10" style={{ color: BRAND.borderStrong }}>
                            <ChevronRight size={16} />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* 快速代码示例 */}
              <section>
                <h2 className="text-sm font-mono mb-3 flex items-center gap-2" style={{ color: BRAND.text }}>
                  <Code2 size={14} style={{ color: BRAND.success }} />
                  快速代码示例
                </h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  <div className="p-4 rounded-xl" style={{ backgroundColor: BRAND.bgCard, border: `1px solid ${BRAND.border}` }}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded" style={{ backgroundColor: BRAND.infoLt, color: BRAND.info }}>Python</span>
                        <span className="text-sm font-semibold" style={{ color: BRAND.text }}>获取账户余额</span>
                      </div>
                      <button onClick={() => copy('client.account()', 'code-1')} className="p-1.5 rounded" style={{ color: copied === 'code-1' ? BRAND.success : BRAND.textMute }}>
                        {copied === 'code-1' ? <CheckCircle2 size={12} /> : <Copy size={12} />}
                      </button>
                    </div>
                    <pre className="text-xs font-mono p-3 rounded-lg overflow-x-auto" style={{ backgroundColor: BRAND.bg, color: BRAND.textSub }}>
{`from zsdex import Client

client = Client(api_key, api_secret)
account = client.account()
print(account['balances'])`}
                    </pre>
                  </div>
                  <div className="p-4 rounded-xl" style={{ backgroundColor: BRAND.bgCard, border: `1px solid ${BRAND.border}` }}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded" style={{ backgroundColor: BRAND.warningLt, color: BRAND.warning }}>JavaScript</span>
                        <span className="text-sm font-semibold" style={{ color: BRAND.text }}>订阅实时行情</span>
                      </div>
                      <button onClick={() => copy('client.ws.ticker()', 'code-2')} className="p-1.5 rounded" style={{ color: copied === 'code-2' ? BRAND.success : BRAND.textMute }}>
                        {copied === 'code-2' ? <CheckCircle2 size={12} /> : <Copy size={12} />}
                      </button>
                    </div>
                    <pre className="text-xs font-mono p-3 rounded-lg overflow-x-auto" style={{ backgroundColor: BRAND.bg, color: BRAND.textSub }}>
{`import { ZSDEX } from 'zsdex';

const ws = new ZSDEX.WebSocket();
ws.ticker('btcusdt', (data) => {
  console.log(data.lastPrice);
});`}
                    </pre>
                  </div>
                </div>
              </section>

              {/* API Key 管理 */}
              <section>
                <h2 className="text-sm font-mono mb-3 flex items-center gap-2" style={{ color: BRAND.text }}>
                  <KeyRound size={14} style={{ color: BRAND.warning }} />
                  我的 API Key
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {APIKEYS.map((k, i) => (
                    <div
                      key={k.id}
                      onClick={() => setDrawer({ open: true, type: 'key', payload: k.id })}
                      className="p-4 rounded-xl cursor-pointer transition-all"
                      style={{
                        backgroundColor: BRAND.bgCard,
                        border: `1px solid ${BRAND.border}`,
                        animation: `fadeInUp 0.4s ease-out ${i * 0.05}s both`,
                      }}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: BRAND.primaryLt, color: BRAND.primary }}>
                            <KeySquare size={16} />
                          </div>
                          <div>
                            <div className="text-sm font-semibold" style={{ color: BRAND.text }}>{k.name}</div>
                            <div className="text-[10px] font-mono" style={{ color: BRAND.textMute }}>{k.type}</div>
                          </div>
                        </div>
                        <span
                          className="text-[10px] font-mono px-1.5 py-0.5 rounded uppercase"
                          style={{ backgroundColor: k.status === 'active' ? BRAND.successLt : k.status === 'suspended' ? BRAND.warningLt : BRAND.dangerLt, color: k.status === 'active' ? BRAND.success : k.status === 'suspended' ? BRAND.warning : BRAND.danger }}
                        >
                          {k.status}
                        </span>
                      </div>
                      <div className="space-y-1 text-xs">
                        <div className="flex items-center justify-between text-[10px]" style={{ color: BRAND.textMute }}>
                          <span>权限数: {k.permissions.length}</span>
                          <span>白名单: {k.ipWhitelist.length}</span>
                        </div>
                        <div className="flex items-center justify-between text-[10px] font-mono" style={{ color: BRAND.textSub }}>
                          <span>24h: {formatNumber(k.calls24h)}</span>
                          <span>最近: {k.lastUsed.slice(11)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </>
          )}

          {tab === 'rest' && (
            <section>
              <h2 className="text-sm font-mono mb-3 flex items-center gap-2" style={{ color: BRAND.text }}>
                <Code size={14} style={{ color: BRAND.primary }} />
                REST API 端点目录
              </h2>
              <div className="space-y-2">
                {filteredEndpoints.length === 0 ? (
                  <div className="p-8 rounded-xl text-center" style={{ backgroundColor: BRAND.bgCard, border: `1px solid ${BRAND.border}`, color: BRAND.textMute }}>
                    暂无匹配端点
                  </div>
                ) : (
                  filteredEndpoints.map((e, i) => {
                    const m = methodColor(e.method);
                    return (
                      <div
                        key={e.id}
                        onClick={() => setDrawer({ open: true, type: 'endpoint', payload: e.id })}
                        className="p-3 rounded-lg cursor-pointer transition-all flex items-center gap-3"
                        style={{
                          backgroundColor: BRAND.bgCard,
                          border: `1px solid ${BRAND.border}`,
                          animation: `fadeInUp 0.3s ease-out ${i * 0.02}s both`,
                        }}
                      >
                        <span
                          className="text-[10px] font-mono font-bold px-2 py-1 rounded uppercase"
                          style={{ backgroundColor: m.bg, color: m.color, minWidth: 60, textAlign: 'center' }}
                        >
                          {e.method}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="text-sm font-mono font-semibold" style={{ color: BRAND.text }}>{e.path}</span>
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded" style={{ backgroundColor: BRAND.bgCardHover, color: BRAND.textMute }}>{e.category}</span>
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded" style={{ backgroundColor: e.auth === 'public' ? BRAND.successLt : e.auth === 'signed' ? BRAND.warningLt : BRAND.infoLt, color: e.auth === 'public' ? BRAND.success : e.auth === 'signed' ? BRAND.warning : BRAND.info }}>{e.auth}</span>
                          </div>
                          <div className="text-xs truncate" style={{ color: BRAND.textSub }}>{e.name} · {e.description}</div>
                        </div>
                        <div className="text-right text-[10px] font-mono whitespace-nowrap" style={{ color: BRAND.textMute }}>
                          <div>24h: <span style={{ color: BRAND.primary }}>{formatNumber(e.calls24h)}</span></div>
                          <div>{e.avgLatency}ms · err {e.errorRate}%</div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </section>
          )}

          {tab === 'websocket' && (
            <section>
              <h2 className="text-sm font-mono mb-3 flex items-center gap-2" style={{ color: BRAND.text }}>
                <Wifi size={14} style={{ color: BRAND.warning }} />
                WebSocket 实时频道
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredChannels.length === 0 ? (
                  <div className="md:col-span-2 p-8 rounded-xl text-center" style={{ backgroundColor: BRAND.bgCard, border: `1px solid ${BRAND.border}`, color: BRAND.textMute }}>
                    暂无匹配频道
                  </div>
                ) : (
                  filteredChannels.map((c, i) => (
                    <div
                      key={c.id}
                      onClick={() => setDrawer({ open: true, type: 'channel', payload: c.id })}
                      className="p-4 rounded-xl cursor-pointer transition-all"
                      style={{
                        backgroundColor: BRAND.bgCard,
                        border: `1px solid ${BRAND.border}`,
                        animation: `fadeInUp 0.4s ease-out ${i * 0.04}s both`,
                      }}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: BRAND.warningLt, color: BRAND.warning }}>
                            <Wifi size={16} />
                          </div>
                          <div>
                            <div className="text-sm font-mono font-semibold" style={{ color: BRAND.text }}>{c.channel}</div>
                            <div className="text-[10px] font-mono" style={{ color: BRAND.textMute }}>{c.type}</div>
                          </div>
                        </div>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded" style={{ backgroundColor: BRAND.infoLt, color: BRAND.info }}>{c.updateFrequency}</span>
                      </div>
                      <div className="text-sm font-semibold mb-1" style={{ color: BRAND.text }}>{c.name}</div>
                      <div className="text-xs line-clamp-2 mb-2" style={{ color: BRAND.textSub }}>{c.description}</div>
                      <div className="grid grid-cols-3 gap-2 text-[10px] font-mono" style={{ color: BRAND.textMute }}>
                        <div>频率: {c.rate}/s</div>
                        <div>订阅: {formatNumber(c.subscribers)}</div>
                        <div>保留: {c.retention}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>
          )}

          {tab === 'sdk' && (
            <>
              <section>
                <h2 className="text-sm font-mono mb-3 flex items-center gap-2" style={{ color: BRAND.text }}>
                  <Download size={14} style={{ color: BRAND.success }} />
                  官方与社区 SDK
                </h2>
                <div className="flex flex-wrap gap-2 mb-3">
                  {(['all', 'python', 'javascript', 'typescript', 'go', 'java', 'rust', 'csharp', 'php'] as const).map((l) => (
                    <button
                      key={l}
                      onClick={() => setLangFilter(l as any)}
                      className="px-3 py-1.5 rounded text-xs font-mono"
                      style={{ backgroundColor: langFilter === l ? BRAND.primaryLt : BRAND.bgCard, color: langFilter === l ? BRAND.primary : BRAND.textSub, border: `1px solid ${langFilter === l ? BRAND.primary : BRAND.border}` }}
                    >
                      {l === 'all' ? '全部' : l}
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {filteredSdks.length === 0 ? (
                    <div className="md:col-span-3 p-8 rounded-xl text-center" style={{ backgroundColor: BRAND.bgCard, border: `1px solid ${BRAND.border}`, color: BRAND.textMute }}>
                      暂无匹配 SDK
                    </div>
                  ) : (
                    filteredSdks.map((s, i) => (
                      <div
                        key={s.id}
                        onClick={() => setDrawer({ open: true, type: 'sdk', payload: s.id })}
                        className="p-4 rounded-xl cursor-pointer transition-all"
                        style={{
                          backgroundColor: BRAND.bgCard,
                          border: `1px solid ${BRAND.border}`,
                          animation: `fadeInUp 0.4s ease-out ${i * 0.05}s both`,
                        }}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-10 h-10 rounded-lg flex items-center justify-center font-mono font-bold text-sm"
                              style={{ backgroundColor: BRAND.primaryLt, color: BRAND.primary }}
                            >
                              {langIcon(s.language)}
                            </div>
                            <div>
                              <div className="text-sm font-semibold font-mono" style={{ color: BRAND.text }}>{s.name}</div>
                              <div className="text-[10px] font-mono" style={{ color: BRAND.textMute }}>{s.version}</div>
                            </div>
                          </div>
                          <span
                            className="text-[10px] font-mono px-1.5 py-0.5 rounded uppercase"
                            style={{ backgroundColor: s.status === 'stable' ? BRAND.successLt : s.status === 'beta' ? BRAND.warningLt : s.status === 'alpha' ? BRAND.infoLt : BRAND.dangerLt, color: s.status === 'stable' ? BRAND.success : s.status === 'beta' ? BRAND.warning : s.status === 'alpha' ? BRAND.info : BRAND.danger }}
                          >
                            {s.status}
                          </span>
                        </div>
                        <div className="text-xs line-clamp-2 mb-2" style={{ color: BRAND.textSub }}>{s.description}</div>
                        <div className="text-[10px] font-mono px-2 py-1.5 rounded mb-2 flex items-center justify-between" style={{ backgroundColor: BRAND.bg }}>
                          <span style={{ color: BRAND.primary }}>{s.installCommand}</span>
                          <button onClick={(e) => { e.stopPropagation(); copy(s.installCommand, s.id); }} style={{ color: copied === s.id ? BRAND.success : BRAND.textMute }}>
                            {copied === s.id ? <CheckCircle2 size={10} /> : <Copy size={10} />}
                          </button>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-[10px] font-mono" style={{ color: BRAND.textMute }}>
                          <div>下载: {formatNumber(s.downloads)}</div>
                          <div>★ {formatNumber(s.stars)}</div>
                          <div>覆盖: {s.coverage}%</div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </section>
            </>
          )}

          {tab === 'sandbox' && (
            <section>
              <h2 className="text-sm font-mono mb-3 flex items-center gap-2" style={{ color: BRAND.text }}>
                <Box size={14} style={{ color: BRAND.info }} />
                沙盒测试环境
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {SANDBOXES.map((s, i) => (
                  <div
                    key={s.id}
                    onClick={() => setDrawer({ open: true, type: 'sandbox', payload: s.id })}
                    className="p-4 rounded-xl cursor-pointer transition-all"
                    style={{
                      backgroundColor: BRAND.bgCard,
                      border: `1px solid ${BRAND.border}`,
                      animation: `fadeInUp 0.4s ease-out ${i * 0.05}s both`,
                    }}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: BRAND.infoLt, color: BRAND.info }}>
                          <Box size={16} />
                        </div>
                        <div>
                          <div className="text-sm font-semibold" style={{ color: BRAND.text }}>{s.name}</div>
                          <div className="text-[10px] font-mono" style={{ color: BRAND.textMute }}>{s.type}</div>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded" style={{ backgroundColor: BRAND.successLt, color: BRAND.success }}>sandbox</span>
                    </div>
                    <div className="text-xs mb-2" style={{ color: BRAND.textSub }}>{s.description}</div>
                    <div className="space-y-1.5 text-[10px] font-mono" style={{ color: BRAND.textMute }}>
                      <div className="flex items-center gap-2 truncate"><Server size={10} /> <span style={{ color: BRAND.text }}>{s.baseUrl}</span></div>
                      <div className="flex items-center gap-2 truncate"><Wifi size={10} /> <span style={{ color: BRAND.text }}>{s.wsUrl}</span></div>
                      <div className="flex items-center justify-between">
                        <span>限速: {s.rateLimit}</span>
                        <span>重置: {s.resetPolicy}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {tab === 'docs' && (
            <section>
              <h2 className="text-sm font-mono mb-3 flex items-center gap-2" style={{ color: BRAND.text }}>
                <BookOpen size={14} style={{ color: BRAND.primary }} />
                文档中心
              </h2>
              <div className="flex flex-wrap gap-2 mb-3">
                {([
                  { k: 'all', l: '全部' },
                  { k: 'quickstart', l: '快速开始' },
                  { k: 'authentication', l: '认证' },
                  { k: 'rate-limit', l: '限速' },
                  { k: 'errors', l: '错误码' },
                  { k: 'webhook', l: 'WebHook' },
                  { k: 'migration', l: '迁移' },
                  { k: 'best-practices', l: '最佳实践' },
                  { k: 'faq', l: 'FAQ' },
                ] as { k: DocCategory | 'all'; l: string }[]).map((c) => (
                  <button
                    key={c.k}
                    onClick={() => setDocCat(c.k as any)}
                    className="px-3 py-1.5 rounded text-xs font-mono"
                    style={{ backgroundColor: docCat === c.k ? BRAND.primaryLt : BRAND.bgCard, color: docCat === c.k ? BRAND.primary : BRAND.textSub, border: `1px solid ${docCat === c.k ? BRAND.primary : BRAND.border}` }}
                  >
                    {c.l}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredDocs.length === 0 ? (
                  <div className="md:col-span-3 p-8 rounded-xl text-center" style={{ backgroundColor: BRAND.bgCard, border: `1px solid ${BRAND.border}`, color: BRAND.textMute }}>
                    暂无匹配文档
                  </div>
                ) : (
                  filteredDocs.map((d, i) => (
                    <div
                      key={d.id}
                      onClick={() => setDrawer({ open: true, type: 'doc', payload: d.id })}
                      className="p-4 rounded-xl cursor-pointer transition-all"
                      style={{
                        backgroundColor: BRAND.bgCard,
                        border: `1px solid ${BRAND.border}`,
                        animation: `fadeInUp 0.4s ease-out ${i * 0.05}s both`,
                      }}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded" style={{ backgroundColor: BRAND.primaryLt, color: BRAND.primary }}>{d.category}</span>
                        <span className="text-[10px] font-mono" style={{ color: BRAND.textMute }}>阅读 {d.readTime} min</span>
                      </div>
                      <div className="text-sm font-semibold mb-1" style={{ color: BRAND.text }}>{d.title}</div>
                      <div className="text-xs line-clamp-2 mb-2" style={{ color: BRAND.textSub }}>{d.description}</div>
                      <div className="flex flex-wrap gap-1 mb-2">
                        {d.tags.map((t) => (
                          <span key={t} className="text-[9px] font-mono px-1 py-0.5 rounded" style={{ backgroundColor: BRAND.bgCardHover, color: BRAND.textMute }}>#{t}</span>
                        ))}
                      </div>
                      <div className="flex items-center justify-between text-[10px] font-mono" style={{ color: BRAND.textMute }}>
                        <span>👁 {formatNumber(d.views)}</span>
                        <span>👍 {d.helpful}%</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>
          )}

          {tab === 'status' && (
            <section>
              <h2 className="text-sm font-mono mb-3 flex items-center gap-2" style={{ color: BRAND.text }}>
                <Activity size={14} style={{ color: BRAND.success }} />
                服务状态与历史事件
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {SERVICES.map((s, i) => {
                  const sc = statusColor(s.status);
                  return (
                    <div
                      key={s.id}
                      onClick={() => setDrawer({ open: true, type: 'service', payload: s.id })}
                      className="p-4 rounded-xl cursor-pointer transition-all"
                      style={{
                        backgroundColor: BRAND.bgCard,
                        border: `1px solid ${BRAND.border}`,
                        animation: `fadeInUp 0.4s ease-out ${i * 0.05}s both`,
                      }}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: sc.color }} />
                          <span className="text-sm font-semibold" style={{ color: BRAND.text }}>{s.name}</span>
                        </div>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded" style={{ backgroundColor: sc.bg, color: sc.color }}>{sc.label}</span>
                      </div>
                      <div className="text-xs line-clamp-2 mb-2" style={{ color: BRAND.textSub }}>{s.description}</div>
                      <div className="grid grid-cols-3 gap-2 text-[10px] font-mono">
                        <div style={{ color: BRAND.textMute }}>30d<br /><span style={{ color: BRAND.success, fontSize: 13 }}>{s.uptime30d}%</span></div>
                        <div style={{ color: BRAND.textMute }}>延迟<br /><span style={{ color: BRAND.primary, fontSize: 13 }}>{s.avgLatency}ms</span></div>
                        <div style={{ color: BRAND.textMute }}>错误<br /><span style={{ color: s.errorRate > 0.1 ? BRAND.danger : BRAND.warning, fontSize: 13 }}>{s.errorRate}%</span></div>
                      </div>
                      {s.lastIncident && (
                        <div className="mt-2 text-[10px] flex items-center gap-1" style={{ color: BRAND.warning }}>
                          <AlertTriangle size={10} /> 最近事件: {s.lastIncident}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          )}
        </div>
      </main>

      {/* ============== 底部 CTA ============== */}
      <section className="px-6 lg:px-12 py-10 mt-8" style={{ borderTop: `1px solid ${BRAND.border}` }}>
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-5 rounded-xl" style={{ backgroundColor: BRAND.bgCard, border: `1px solid ${BRAND.border}` }}>
              <div className="flex items-center gap-2 mb-2">
                <Mail size={16} style={{ color: BRAND.primary }} />
                <span className="text-sm font-semibold" style={{ color: BRAND.text }}>开发者支持</span>
              </div>
              <div className="text-xs font-mono mb-1" style={{ color: BRAND.text }}>api-support@zsdex.com</div>
              <div className="text-[10px]" style={{ color: BRAND.textMute }}>技术问题与对接咨询</div>
            </div>
            <div className="p-5 rounded-xl" style={{ backgroundColor: BRAND.bgCard, border: `1px solid ${BRAND.border}` }}>
              <div className="flex items-center gap-2 mb-2">
                <MessageCircle size={16} style={{ color: BRAND.primary }} />
                <span className="text-sm font-semibold" style={{ color: BRAND.text }}>开发者社区</span>
              </div>
              <div className="text-xs font-mono mb-1" style={{ color: BRAND.text }}>Telegram / Discord / 论坛</div>
              <div className="text-[10px]" style={{ color: BRAND.textMute }}>与官方团队和开发者交流</div>
            </div>
            <div className="p-5 rounded-xl" style={{ backgroundColor: BRAND.bgCard, border: `1px solid ${BRAND.border}` }}>
              <div className="flex items-center gap-2 mb-2">
                <Activity size={16} style={{ color: BRAND.primary }} />
                <span className="text-sm font-semibold" style={{ color: BRAND.text }}>实时状态页</span>
              </div>
              <div className="text-xs font-mono mb-1" style={{ color: BRAND.text }}>status.zsdex.com</div>
              <div className="text-[10px]" style={{ color: BRAND.textMute }}>API 服务可用性实时监控</div>
            </div>
          </div>
          <div className="text-center mt-6 text-[10px]" style={{ color: BRAND.textMute }}>
            本页面所有数据为示意性 mock 数据，来源于 API 开放平台演示版本。
            不构成任何 API 服务承诺或 SLA 保证。具体服务等级请以正式用户协议为准。
          </div>
        </div>
      </section>

      {/* ============== Drawer ============== */}
      {drawer.open && (
        <div
          className="fixed inset-0 z-50"
          style={{ backgroundColor: BRAND.overlay }}
          onClick={() => setDrawer({ open: false, type: null, payload: null })}
        >
          <div
            className="fixed right-0 top-0 h-full w-full md:w-[640px] overflow-y-auto"
            style={{ backgroundColor: BRAND.cardElevated, borderLeft: `1px solid ${BRAND.border}` }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5" style={{ borderBottom: `1px solid ${BRAND.border}` }}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-mono uppercase tracking-wider" style={{ color: BRAND.textMute }}>
                  {drawer.type} DETAIL
                </span>
                <button
                  onClick={() => setDrawer({ open: false, type: null, payload: null })}
                  className="p-1.5 rounded-lg"
                  style={{ color: BRAND.textMute }}
                >
                  <X size={16} />
                </button>
              </div>

              {/* 端点 Drawer */}
              {drawerEndpoint && (
                <>
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span
                      className="text-xs font-mono font-bold px-2 py-1 rounded uppercase"
                      style={{ backgroundColor: methodColor(drawerEndpoint.method).bg, color: methodColor(drawerEndpoint.method).color }}
                    >
                      {drawerEndpoint.method}
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded" style={{ backgroundColor: BRAND.bgCardHover, color: BRAND.textMute }}>{drawerEndpoint.category}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded" style={{ backgroundColor: drawerEndpoint.auth === 'public' ? BRAND.successLt : drawerEndpoint.auth === 'signed' ? BRAND.warningLt : BRAND.infoLt, color: drawerEndpoint.auth === 'public' ? BRAND.success : drawerEndpoint.auth === 'signed' ? BRAND.warning : BRAND.info }}>{drawerEndpoint.auth}</span>
                  </div>
                  <h2 className="text-xl font-bold font-mono mb-1" style={{ color: BRAND.text }}>{drawerEndpoint.path}</h2>
                  <p className="text-sm mb-3" style={{ color: BRAND.textSub }}>{drawerEndpoint.name} · {drawerEndpoint.description}</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
                    <div className="p-2 rounded-lg" style={{ backgroundColor: BRAND.bgCard }}>
                      <div className="text-[10px] font-mono" style={{ color: BRAND.textMute }}>版本</div>
                      <div className="text-sm font-mono" style={{ color: BRAND.text }}>{drawerEndpoint.version}</div>
                    </div>
                    <div className="p-2 rounded-lg" style={{ backgroundColor: BRAND.bgCard }}>
                      <div className="text-[10px] font-mono" style={{ color: BRAND.textMute }}>限速</div>
                      <div className="text-sm font-mono" style={{ color: BRAND.text }}>{drawerEndpoint.rateLimit.limit}/{drawerEndpoint.rateLimit.window}</div>
                    </div>
                    <div className="p-2 rounded-lg" style={{ backgroundColor: BRAND.bgCard }}>
                      <div className="text-[10px] font-mono" style={{ color: BRAND.textMute }}>平均延迟</div>
                      <div className="text-sm font-mono" style={{ color: BRAND.success }}>{drawerEndpoint.avgLatency}ms</div>
                    </div>
                    <div className="p-2 rounded-lg" style={{ backgroundColor: BRAND.bgCard }}>
                      <div className="text-[10px] font-mono" style={{ color: BRAND.textMute }}>错误率</div>
                      <div className="text-sm font-mono" style={{ color: drawerEndpoint.errorRate > 0.1 ? BRAND.danger : BRAND.warning }}>{drawerEndpoint.errorRate}%</div>
                    </div>
                  </div>
                  {drawerEndpoint.parameters.length > 0 && (
                    <div className="mb-4">
                      <div className="text-[10px] font-mono mb-2" style={{ color: BRAND.textMute }}>请求参数</div>
                      <div className="space-y-1">
                        {drawerEndpoint.parameters.map((p) => (
                          <div key={p.name} className="p-2 rounded-lg flex items-center gap-2" style={{ backgroundColor: BRAND.bgCard }}>
                            <span className="text-xs font-mono font-semibold" style={{ color: BRAND.primary }}>{p.name}</span>
                            <span className="text-[10px] font-mono px-1 py-0.5 rounded" style={{ backgroundColor: BRAND.bgCardHover, color: BRAND.textMute }}>{p.type}</span>
                            {p.required && <span className="text-[10px] font-mono px-1 py-0.5 rounded" style={{ backgroundColor: BRAND.dangerLt, color: BRAND.danger }}>required</span>}
                            <span className="text-[10px] flex-1" style={{ color: BRAND.textSub }}>{p.description}</span>
                            {p.example && <span className="text-[10px] font-mono" style={{ color: BRAND.textMute }}>eg: {p.example}</span>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="mb-4">
                    <div className="text-[10px] font-mono mb-2" style={{ color: BRAND.textMute }}>响应示例</div>
                    <pre className="text-xs font-mono p-3 rounded-lg overflow-x-auto" style={{ backgroundColor: BRAND.bg, color: BRAND.textSub }}>
{`HTTP ${drawerEndpoint.response.code} ${drawerEndpoint.response.description}
${drawerEndpoint.response.example}`}
                    </pre>
                  </div>
                  <div className="text-[10px]" style={{ color: BRAND.textMute }}>上线时间: {drawerEndpoint.addedIn}</div>
                </>
              )}

              {/* 频道 Drawer */}
              {drawerChannel && (
                <>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: BRAND.warningLt, color: BRAND.warning }}>
                      <Wifi size={16} />
                    </div>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded" style={{ backgroundColor: BRAND.infoLt, color: BRAND.info }}>{drawerChannel.type}</span>
                    <span className="text-[10px] font-mono" style={{ color: BRAND.textMute }}>{drawerChannel.updateFrequency}</span>
                  </div>
                  <h2 className="text-xl font-bold font-mono mb-1" style={{ color: BRAND.text }}>{drawerChannel.channel}</h2>
                  <p className="text-sm mb-3" style={{ color: BRAND.textSub }}>{drawerChannel.name} · {drawerChannel.description}</p>
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    <div className="p-2 rounded-lg" style={{ backgroundColor: BRAND.bgCard }}>
                      <div className="text-[10px] font-mono" style={{ color: BRAND.textMute }}>更新频率</div>
                      <div className="text-sm font-mono" style={{ color: BRAND.text }}>{drawerChannel.updateFrequency}</div>
                    </div>
                    <div className="p-2 rounded-lg" style={{ backgroundColor: BRAND.bgCard }}>
                      <div className="text-[10px] font-mono" style={{ color: BRAND.textMute }}>订阅者数</div>
                      <div className="text-sm font-mono" style={{ color: BRAND.primary }}>{formatNumber(drawerChannel.subscribers)}</div>
                    </div>
                    <div className="p-2 rounded-lg" style={{ backgroundColor: BRAND.bgCard }}>
                      <div className="text-[10px] font-mono" style={{ color: BRAND.textMute }}>数据保留</div>
                      <div className="text-sm font-mono" style={{ color: BRAND.text }}>{drawerChannel.retention}</div>
                    </div>
                  </div>
                  <div className="mb-4">
                    <div className="text-[10px] font-mono mb-2" style={{ color: BRAND.textMute }}>Payload 字段</div>
                    <div className="p-2 rounded-lg" style={{ backgroundColor: BRAND.bgCard, color: BRAND.textSub }}>
                      <code className="text-xs font-mono">{drawerChannel.payload}</code>
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] font-mono mb-2" style={{ color: BRAND.textMute }}>消息示例</div>
                    <pre className="text-xs font-mono p-3 rounded-lg overflow-x-auto" style={{ backgroundColor: BRAND.bg, color: BRAND.textSub }}>
{drawerChannel.example}
                    </pre>
                  </div>
                </>
              )}

              {/* SDK Drawer */}
              {drawerSdk && (
                <>
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className="w-12 h-12 rounded-lg flex items-center justify-center font-mono font-bold text-lg"
                      style={{ backgroundColor: BRAND.primaryLt, color: BRAND.primary }}
                    >
                      {langIcon(drawerSdk.language)}
                    </div>
                    <div>
                      <h2 className="text-xl font-bold font-mono" style={{ color: BRAND.text }}>{drawerSdk.name}</h2>
                      <div className="text-[10px] font-mono" style={{ color: BRAND.textMute }}>{drawerSdk.version} · {drawerSdk.maintainer}</div>
                    </div>
                  </div>
                  <p className="text-sm my-3" style={{ color: BRAND.textSub }}>{drawerSdk.description}</p>
                  <div className="mb-4">
                    <div className="text-[10px] font-mono mb-2" style={{ color: BRAND.textMute }}>安装命令</div>
                    <div className="p-2 rounded-lg flex items-center justify-between" style={{ backgroundColor: BRAND.bgCard }}>
                      <code className="text-xs font-mono" style={{ color: BRAND.primary }}>{drawerSdk.installCommand}</code>
                      <button onClick={() => copy(drawerSdk.installCommand, drawerSdk.id)} style={{ color: copied === drawerSdk.id ? BRAND.success : BRAND.textMute }}>
                        {copied === drawerSdk.id ? <CheckCircle2 size={12} /> : <Copy size={12} />}
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-2 mb-4">
                    <div className="p-2 rounded-lg" style={{ backgroundColor: BRAND.bgCard }}>
                      <div className="text-[10px] font-mono" style={{ color: BRAND.textMute }}>下载量</div>
                      <div className="text-sm font-mono" style={{ color: BRAND.text }}>{formatNumber(drawerSdk.downloads)}</div>
                    </div>
                    <div className="p-2 rounded-lg" style={{ backgroundColor: BRAND.bgCard }}>
                      <div className="text-[10px] font-mono" style={{ color: BRAND.textMute }}>Stars</div>
                      <div className="text-sm font-mono" style={{ color: BRAND.text }}>{formatNumber(drawerSdk.stars)}</div>
                    </div>
                    <div className="p-2 rounded-lg" style={{ backgroundColor: BRAND.bgCard }}>
                      <div className="text-[10px] font-mono" style={{ color: BRAND.textMute }}>覆盖率</div>
                      <div className="text-sm font-mono" style={{ color: BRAND.success }}>{drawerSdk.coverage}%</div>
                    </div>
                    <div className="p-2 rounded-lg" style={{ backgroundColor: BRAND.bgCard }}>
                      <div className="text-[10px] font-mono" style={{ color: BRAND.textMute }}>状态</div>
                      <div className="text-sm font-mono" style={{ color: drawerSdk.status === 'stable' ? BRAND.success : BRAND.warning }}>{drawerSdk.status}</div>
                    </div>
                  </div>
                  <div className="mb-4">
                    <div className="text-[10px] font-mono mb-2" style={{ color: BRAND.textMute }}>核心特性</div>
                    <div className="flex flex-wrap gap-1">
                      {drawerSdk.features.map((f) => (
                        <span key={f} className="text-xs px-2 py-1 rounded" style={{ backgroundColor: BRAND.bgCard, color: BRAND.textSub, border: `1px solid ${BRAND.border}` }}>{f}</span>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <a className="py-2 rounded-lg text-xs font-mono text-center flex items-center justify-center gap-1" style={{ backgroundColor: BRAND.primaryLt, color: BRAND.primary, border: `1px solid ${BRAND.primary}` }} href={drawerSdk.repoUrl} target="_blank" rel="noopener">
                      <Code2 size={12} /> 仓库
                    </a>
                    <a className="py-2 rounded-lg text-xs font-mono text-center flex items-center justify-center gap-1" style={{ backgroundColor: BRAND.bgCard, color: BRAND.text, border: `1px solid ${BRAND.border}` }} href={drawerSdk.docsUrl} target="_blank" rel="noopener">
                      <BookOpen size={12} /> 文档
                    </a>
                  </div>
                </>
              )}

              {/* 文档 Drawer */}
              {drawerDoc && (
                <>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded inline-block" style={{ backgroundColor: BRAND.primaryLt, color: BRAND.primary }}>{drawerDoc.category}</span>
                  <h2 className="text-xl font-bold mt-2 mb-1" style={{ color: BRAND.text }}>{drawerDoc.title}</h2>
                  <p className="text-sm mb-3" style={{ color: BRAND.textSub }}>{drawerDoc.description}</p>
                  <div className="flex flex-wrap gap-2 text-[10px] font-mono mb-3" style={{ color: BRAND.textMute }}>
                    <span>阅读 {drawerDoc.readTime} min</span>
                    <span>·</span>
                    <span>👁 {formatNumber(drawerDoc.views)}</span>
                    <span>·</span>
                    <span>👍 {drawerDoc.helpful}%</span>
                    <span>·</span>
                    <span>{drawerDoc.author}</span>
                  </div>
                  <div className="mb-4">
                    <div className="text-[10px] font-mono mb-2" style={{ color: BRAND.textMute }}>文档大纲</div>
                    <div className="space-y-1">
                      {drawerDoc.content.map((c, i) => (
                        <div key={c} className="text-xs p-2 rounded flex items-center gap-2" style={{ backgroundColor: BRAND.bgCard, color: BRAND.textSub }}>
                          <span className="font-mono" style={{ color: BRAND.primary }}>{String(i + 1).padStart(2, '0')}</span> {c}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="mb-4">
                    <div className="text-[10px] font-mono mb-2" style={{ color: BRAND.textMute }}>标签</div>
                    <div className="flex flex-wrap gap-1">
                      {drawerDoc.tags.map((t) => (
                        <span key={t} className="text-[10px] font-mono px-1.5 py-0.5 rounded" style={{ backgroundColor: BRAND.bgCardHover, color: BRAND.textMute }}>#{t}</span>
                      ))}
                    </div>
                  </div>
                  <button className="w-full py-2 rounded-lg text-xs font-mono flex items-center justify-center gap-1" style={{ backgroundColor: BRAND.primary, color: BRAND.onPrimary }}>
                    <BookOpen size={12} /> 阅读完整文档
                  </button>
                </>
              )}

              {/* 服务 Drawer */}
              {drawerService && (
                <>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: statusColor(drawerService.status).color }} />
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded" style={{ backgroundColor: statusColor(drawerService.status).bg, color: statusColor(drawerService.status).color }}>{statusColor(drawerService.status).label}</span>
                  </div>
                  <h2 className="text-xl font-bold mb-1" style={{ color: BRAND.text }}>{drawerService.name}</h2>
                  <p className="text-sm mb-3" style={{ color: BRAND.textSub }}>{drawerService.description}</p>
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    <div className="p-2 rounded-lg" style={{ backgroundColor: BRAND.bgCard }}>
                      <div className="text-[10px] font-mono" style={{ color: BRAND.textMute }}>30d 可用性</div>
                      <div className="text-lg font-mono font-bold" style={{ color: BRAND.success }}>{drawerService.uptime30d}%</div>
                    </div>
                    <div className="p-2 rounded-lg" style={{ backgroundColor: BRAND.bgCard }}>
                      <div className="text-[10px] font-mono" style={{ color: BRAND.textMute }}>平均延迟</div>
                      <div className="text-lg font-mono font-bold" style={{ color: BRAND.primary }}>{drawerService.avgLatency}ms</div>
                    </div>
                    <div className="p-2 rounded-lg" style={{ backgroundColor: BRAND.bgCard }}>
                      <div className="text-[10px] font-mono" style={{ color: BRAND.textMute }}>错误率</div>
                      <div className="text-lg font-mono font-bold" style={{ color: drawerService.errorRate > 0.1 ? BRAND.danger : BRAND.warning }}>{drawerService.errorRate}%</div>
                    </div>
                  </div>
                  {drawerService.lastIncident && (
                    <div className="p-3 rounded-lg flex items-center gap-2" style={{ backgroundColor: BRAND.warningLt, color: BRAND.warning }}>
                      <AlertTriangle size={14} />
                      <div className="text-xs">
                        <div className="font-semibold">最近事件</div>
                        <div className="font-mono">{drawerService.lastIncident}</div>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* API Key Drawer */}
              {drawerKey && (
                <>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: BRAND.primaryLt, color: BRAND.primary }}>
                      <KeySquare size={16} />
                    </div>
                    <span
                      className="text-[10px] font-mono px-1.5 py-0.5 rounded uppercase"
                      style={{ backgroundColor: drawerKey.status === 'active' ? BRAND.successLt : BRAND.dangerLt, color: drawerKey.status === 'active' ? BRAND.success : BRAND.danger }}
                    >
                      {drawerKey.status}
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded" style={{ backgroundColor: BRAND.bgCardHover, color: BRAND.textMute }}>{drawerKey.type}</span>
                  </div>
                  <h2 className="text-xl font-bold mb-1" style={{ color: BRAND.text }}>{drawerKey.name}</h2>
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center gap-2"><Calendar size={12} style={{ color: BRAND.primary }} /> 创建: <span className="font-mono">{drawerKey.createdAt}</span></div>
                    <div className="flex items-center gap-2"><Clock size={12} style={{ color: BRAND.primary }} /> 最近: <span className="font-mono">{drawerKey.lastUsed}</span></div>
                    <div className="flex items-center gap-2"><Activity size={12} style={{ color: BRAND.primary }} /> 24h: <span style={{ color: BRAND.success }}>{formatNumber(drawerKey.calls24h)}</span></div>
                  </div>
                  <div className="mt-4">
                    <div className="text-[10px] font-mono mb-2" style={{ color: BRAND.textMute }}>权限</div>
                    <div className="flex flex-wrap gap-1">
                      {drawerKey.permissions.map((p) => (
                        <span key={p} className="text-[10px] font-mono px-1.5 py-0.5 rounded" style={{ backgroundColor: BRAND.successLt, color: BRAND.success }}>{p}</span>
                      ))}
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="text-[10px] font-mono mb-2" style={{ color: BRAND.textMute }}>IP 白名单</div>
                    {drawerKey.ipWhitelist.length > 0 ? (
                      <div className="space-y-1">
                        {drawerKey.ipWhitelist.map((ip) => (
                          <div key={ip} className="text-xs p-2 rounded font-mono flex items-center gap-2" style={{ backgroundColor: BRAND.bgCard, color: BRAND.textSub }}>
                            <MapPin size={12} style={{ color: BRAND.primary }} /> {ip}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-xs p-2 rounded" style={{ backgroundColor: BRAND.warningLt, color: BRAND.warning }}>未配置白名单（不推荐）</div>
                    )}
                  </div>
                </>
              )}

              {/* 沙盒 Drawer */}
              {drawerSandbox && (
                <>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: BRAND.infoLt, color: BRAND.info }}>
                      <Box size={16} />
                    </div>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded" style={{ backgroundColor: BRAND.bgCardHover, color: BRAND.textMute }}>{drawerSandbox.type}</span>
                  </div>
                  <h2 className="text-xl font-bold mb-1" style={{ color: BRAND.text }}>{drawerSandbox.name}</h2>
                  <p className="text-sm mb-3" style={{ color: BRAND.textSub }}>{drawerSandbox.description}</p>
                  <div className="space-y-2 text-xs">
                    <div className="p-2 rounded-lg flex items-center justify-between" style={{ backgroundColor: BRAND.bgCard }}>
                      <div className="flex items-center gap-2"><Server size={12} style={{ color: BRAND.primary }} /> <span style={{ color: BRAND.textMute }}>REST</span></div>
                      <code className="text-[10px] font-mono" style={{ color: BRAND.primary }}>{drawerSandbox.baseUrl}</code>
                      <button onClick={() => copy(drawerSandbox.baseUrl, drawerSandbox.id + '-rest')} style={{ color: copied === drawerSandbox.id + '-rest' ? BRAND.success : BRAND.textMute }}>
                        {copied === drawerSandbox.id + '-rest' ? <CheckCircle2 size={10} /> : <Copy size={10} />}
                      </button>
                    </div>
                    <div className="p-2 rounded-lg flex items-center justify-between" style={{ backgroundColor: BRAND.bgCard }}>
                      <div className="flex items-center gap-2"><Wifi size={12} style={{ color: BRAND.primary }} /> <span style={{ color: BRAND.textMute }}>WebSocket</span></div>
                      <code className="text-[10px] font-mono" style={{ color: BRAND.primary }}>{drawerSandbox.wsUrl}</code>
                      <button onClick={() => copy(drawerSandbox.wsUrl, drawerSandbox.id + '-ws')} style={{ color: copied === drawerSandbox.id + '-ws' ? BRAND.success : BRAND.textMute }}>
                        {copied === drawerSandbox.id + '-ws' ? <CheckCircle2 size={10} /> : <Copy size={10} />}
                      </button>
                    </div>
                    <div className="p-2 rounded-lg flex items-center justify-between" style={{ backgroundColor: BRAND.bgCard }}>
                      <span style={{ color: BRAND.textMute }}>Demo Key</span>
                      <code className="text-[10px] font-mono" style={{ color: BRAND.warning }}>{drawerSandbox.apiKey}</code>
                    </div>
                    <div className="p-2 rounded-lg" style={{ backgroundColor: BRAND.bgCard }}>
                      <div className="flex items-center justify-between mb-1">
                        <span style={{ color: BRAND.textMute }}>限速</span>
                        <span style={{ color: BRAND.text }}>{drawerSandbox.rateLimit}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span style={{ color: BRAND.textMute }}>重置策略</span>
                        <span style={{ color: BRAND.text }}>{drawerSandbox.resetPolicy}</span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="text-[10px] font-mono mb-2" style={{ color: BRAND.textMute }}>能力清单</div>
                    <div className="space-y-1">
                      {drawerSandbox.features.map((f) => (
                        <div key={f} className="text-xs p-2 rounded flex items-center gap-2" style={{ backgroundColor: BRAND.bgCard, color: BRAND.textSub }}>
                          <CheckCircle2 size={12} style={{ color: BRAND.success }} /> {f}
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ============== 帮助 Drawer ============== */}
      {helpOpen && (
        <div
          className="fixed inset-0 z-50"
          style={{ backgroundColor: BRAND.overlay }}
          onClick={() => setHelpOpen(false)}
        >
          <div
            className="fixed right-0 top-0 h-full w-full md:w-[420px] overflow-y-auto p-5"
            style={{ backgroundColor: BRAND.cardElevated, borderLeft: `1px solid ${BRAND.border}` }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold flex items-center gap-2" style={{ color: BRAND.text }}>
                <Keyboard size={18} style={{ color: BRAND.primary }} />
                快捷键
              </h3>
              <button onClick={() => setHelpOpen(false)} style={{ color: BRAND.textMute }}><X size={18} /></button>
            </div>
            <div className="space-y-2">
              {[
                { key: '/', desc: '聚焦搜索框' },
                { key: 'Esc', desc: '关闭 Drawer / 帮助' },
                { key: '?', desc: '打开 / 关闭帮助' },
                { key: '1-7', desc: '切换 Tab (1 总览 / 2 REST / 3 WS / 4 SDK / 5 沙盒 / 6 文档 / 7 状态)' },
              ].map((h) => (
                <div key={h.key} className="flex items-center justify-between p-2 rounded-lg" style={{ backgroundColor: BRAND.bgCard }}>
                  <span className="text-xs" style={{ color: BRAND.textSub }}>{h.desc}</span>
                  <kbd className="px-2 py-0.5 rounded text-[10px] font-mono" style={{ backgroundColor: BRAND.bgCardHover, color: BRAND.primary, border: `1px solid ${BRAND.border}` }}>{h.key}</kbd>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

export default PortalApiPlatform;
