'use client';

/**
 * PortalDerivatives - 衍生品交易中心 (2026-07-19 Q05 P3.26)
 *
 * 页面定位：
 * - 中萨数字科技交易所 衍生品交易中心
 * - 永续合约 / 交割合约 / 期权 / 资金费率 / 强平监控 / 量化策略
 * - 与 P3.4 交易大厅 / P3.17 API 量化 / P3.25 做市 形成"现货-合约-做市"三角闭环
 *
 * L4 工业级设计标准：
 * - 暗色 v6 纯黑 + 卡片 #141414 + ZSDEX 绿
 * - 10+ 区块、9+ 交互、7+ Drawer、4+ 实时数据、4+ 动画
 *
 * 合规要点 (Q05 硬约束)：
 * - 所有合约 / 资金费率 / 期权 / 强平 / 策略 / 申请 mock 占位
 * - 严格规避"承诺收益 / 保本 / 刚兑 / 萨摩亚持牌 / MSA / DSAEX"等高风险词
 * - 明确"合规研究方向"定性
 */

import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import {
  Search, X, ChevronRight, ChevronUp, ChevronDown, Filter,
  TrendingUp, TrendingDown, BarChart3, Activity, Layers, Network,
  Users, UserCheck, Building2, Briefcase, Award, Trophy, Crown, Star, Sparkles,
  Flame, Zap, Rocket, Calendar, Clock, MapPin, Compass, Flag, Target,
  Megaphone, Radio, BookOpen, GraduationCap, Lightbulb, Heart, ThumbsUp,
  Bookmark, ExternalLink, Copy, Mail, MessageCircle, Phone, HelpCircle, Keyboard,
  Settings, Sliders, Shield, ShieldCheck, ShieldAlert, CheckCircle2,
  AlertTriangle, AlertCircle, XCircle, Plus, Minus, ArrowUpRight, ArrowDownLeft,
  ArrowRight, Hash, Link2, FileText, Download, Upload, Eye, EyeOff,
  Lock, Unlock, Globe2, Database, Server, Cloud, Cpu, Code2, Terminal,
  Workflow, GitBranch, GitCommit, Boxes, Calculator, Inbox,
} from 'lucide-react';
import { BRAND, STATUS } from './brand';

// ============== 类型 ==============
type Tab = 'overview' | 'perp' | 'futures' | 'options' | 'funding' | 'liquidations' | 'strategies' | 'apply' | 'help';
type ContractType = 'perp' | 'futures' | 'option-call' | 'option-put';
type Direction = 'long' | 'short';
type Leverage = 20 | 50 | 75 | 100 | 125;
type MarginMode = 'cross' | 'isolated';
type OptionType = 'call' | 'put';
type LiquidationStatus = 'pending' | 'partial' | 'completed' | 'cancelled' | 'adl';
type StrategyType = 'grid' | 'dca' | 'martingale' | 'arbitrage' | 'hedge' | 'momentum';
type ApplyType = 'trader' | 'institution' | 'api' | 'strategy' | 'broker';
type ApplyStage = 'submitted' | 'review' | 'kyb' | 'tech-test' | 'contract' | 'live' | 'rejected';
type DrawerType = 'contract' | 'option' | 'liquidation' | 'funding' | 'strategy' | 'apply' | 'help' | null;

interface Contract {
  id: string;
  symbol: string;
  base: string;
  quote: string;
  type: ContractType;
  price: number;
  change24h: number;
  volume24h: number;
  openInterest: number;
  fundingRate: number;
  nextFunding: string;
  high24h: number;
  low24h: number;
  maxLeverage: Leverage;
  marginMode: MarginMode;
  contractSize: number;
  tickSize: number;
  makerFee: number;
  takerFee: number;
  status: 'live' | 'settling' | 'paused' | 'delisted';
  listedAt: string;
  settleDate?: string;
  description: string;
  riskTag: string;
  indexSource: string;
  region: string;
  longShort: number;
}

interface OptionContract {
  id: string;
  underlying: string;
  type: OptionType;
  strike: number;
  expiry: string;
  spot: number;
  mark: number;
  bid: number;
  ask: number;
  change24h: number;
  volume24h: number;
  openInterest: number;
  iv: number;
  delta: number;
  gamma: number;
  theta: number;
  vega: number;
  settlement: 'physical' | 'cash';
  status: 'live' | 'paused' | 'expired';
}

interface FundingEvent {
  id: string;
  symbol: string;
  type: ContractType;
  currentRate: number;
  predictedRate: number;
  nextTime: string;
  lastTime: string;
  lastRate: number;
  annualized: number;
  history: { time: string; rate: number }[];
}

interface Liquidation {
  id: string;
  symbol: string;
  type: ContractType;
  side: Direction;
  price: number;
  quantity: number;
  value: number;
  timestamp: string;
  status: LiquidationStatus;
  leverage: number;
  userKyc: 'basic' | 'advanced' | 'pro';
  markPrice: number;
  gapPct: number;
  fee: number;
  insuranceFund: number;
}

interface Strategy {
  id: string;
  name: string;
  type: StrategyType;
  trader: string;
  description: string;
  pairs: string[];
  roi30d: number;
  roi90d: number;
  sharpe: number;
  maxDrawdown: number;
  aum: number;
  subscribers: number;
  minSubscribe: number;
  performanceFee: number;
  managementFee: number;
  status: 'live' | 'paused' | 'closed';
  launchedAt: string;
  tags: string[];
  equity: { date: string; value: number }[];
}

interface Application {
  id: string;
  type: ApplyType;
  company: string;
  contact: string;
  email: string;
  region: string;
  stage: ApplyStage;
  submittedAt: string;
  updatedAt: string;
  progress: number;
  description: string;
  reviewer: string;
  expectedVolume: number;
  feeTier: string;
  timeline: { stage: ApplyStage; timestamp: string; note: string }[];
}

interface KpiSnapshot {
  totalContracts: number;
  perpCount: number;
  futuresCount: number;
  optionCount: number;
  totalOi: number;
  totalVolume24h: number;
  fundingInflow: number;
  liquidations24h: number;
  liquidatedValue: number;
  insuranceFund: number;
  activeTraders: number;
  proTraders: number;
  totalSubscribers: number;
  strategiesAum: number;
  pendingApplications: number;
}

interface DrawerState {
  open: boolean;
  type: DrawerType;
  payload: string | null;
}

// ============== Mock 数据 ==============
const CONTRACTS: Contract[] = [
  { id: 'c-btc-usdt-perp', symbol: 'BTC-USDT-PERP', base: 'BTC', quote: 'USDT', type: 'perp', price: 68420.5, change24h: 2.34, volume24h: 4820000000, openInterest: 1820000000, fundingRate: 0.0085, nextFunding: '2026-07-19 16:00', high24h: 69200, low24h: 66800, maxLeverage: 125, marginMode: 'cross', contractSize: 0.001, tickSize: 0.1, makerFee: 0.0002, takerFee: 0.0005, status: 'live', listedAt: '2024-03-12', description: '比特币永续合约，价格锚定 BTC/USD 指数', riskTag: '主流', indexSource: 'Brass / Coinbase / Binance 综合', region: '全球', longShort: 52 },
  { id: 'c-eth-usdt-perp', symbol: 'ETH-USDT-PERP', base: 'ETH', quote: 'USDT', type: 'perp', price: 3652.4, change24h: 1.86, volume24h: 2860000000, openInterest: 1180000000, fundingRate: 0.0072, nextFunding: '2026-07-19 16:00', high24h: 3720, low24h: 3580, maxLeverage: 100, marginMode: 'cross', contractSize: 0.01, tickSize: 0.01, makerFee: 0.0002, takerFee: 0.0005, status: 'live', listedAt: '2024-03-12', description: '以太坊永续合约', riskTag: '主流', indexSource: 'Brass / Kraken / OKX 综合', region: '全球', longShort: 48 },
  { id: 'c-sol-usdt-perp', symbol: 'SOL-USDT-PERP', base: 'SOL', quote: 'USDT', type: 'perp', price: 168.2, change24h: 4.62, volume24h: 1240000000, openInterest: 480000000, fundingRate: 0.0124, nextFunding: '2026-07-19 16:00', high24h: 174.8, low24h: 160.2, maxLeverage: 75, marginMode: 'cross', contractSize: 0.1, tickSize: 0.01, makerFee: 0.0002, takerFee: 0.0005, status: 'live', listedAt: '2024-05-08', description: 'Solana 永续合约', riskTag: '主流', indexSource: 'FTX / Coinbase 综合', region: '全球', longShort: 56 },
  { id: 'c-bnb-usdt-perp', symbol: 'BNB-USDT-PERP', base: 'BNB', quote: 'USDT', type: 'perp', price: 612.4, change24h: -0.85, volume24h: 680000000, openInterest: 240000000, fundingRate: 0.0094, nextFunding: '2026-07-19 16:00', high24h: 622, low24h: 608, maxLeverage: 75, marginMode: 'cross', contractSize: 0.01, tickSize: 0.01, makerFee: 0.0002, takerFee: 0.0005, status: 'live', listedAt: '2024-06-20', description: 'BNB 永续合约', riskTag: '主流', indexSource: 'Binance 指数', region: '全球', longShort: 51 },
  { id: 'c-doge-usdt-perp', symbol: 'DOGE-USDT-PERP', base: 'DOGE', quote: 'USDT', type: 'perp', price: 0.1284, change24h: -2.18, volume24h: 480000000, openInterest: 168000000, fundingRate: -0.0042, nextFunding: '2026-07-19 16:00', high24h: 0.133, low24h: 0.124, maxLeverage: 50, marginMode: 'cross', contractSize: 100, tickSize: 0.00001, makerFee: 0.0003, takerFee: 0.0006, status: 'live', listedAt: '2024-08-15', description: 'Dogecoin 永续合约', riskTag: '高波动', indexSource: 'Binance / OKX 综合', region: '全球', longShort: 44 },
  { id: 'c-xrp-usdt-perp', symbol: 'XRP-USDT-PERP', base: 'XRP', quote: 'USDT', type: 'perp', price: 0.562, change24h: 0.94, volume24h: 320000000, openInterest: 128000000, fundingRate: 0.0058, nextFunding: '2026-07-19 16:00', high24h: 0.572, low24h: 0.552, maxLeverage: 75, marginMode: 'cross', contractSize: 10, tickSize: 0.0001, makerFee: 0.0003, takerFee: 0.0006, status: 'live', listedAt: '2024-09-02', description: 'XRP 永续合约', riskTag: '主流', indexSource: 'Bitstamp / Coinbase 综合', region: '全球', longShort: 50 },
  { id: 'c-btc-usd-0627', symbol: 'BTC-USD-0627', base: 'BTC', quote: 'USD', type: 'futures', price: 68540.0, change24h: 2.28, volume24h: 1840000000, openInterest: 720000000, fundingRate: 0, nextFunding: '-', high24h: 69300, low24h: 66900, maxLeverage: 100, marginMode: 'cross', contractSize: 0.001, tickSize: 0.1, makerFee: 0.0002, takerFee: 0.0005, status: 'live', listedAt: '2024-12-28', settleDate: '2026-06-27', description: 'BTC 季度合约（实物交割）', riskTag: '主流', indexSource: 'Brass / Coinbase 综合', region: '全球', longShort: 53 },
  { id: 'c-eth-usd-0926', symbol: 'ETH-USD-0926', base: 'ETH', quote: 'USD', type: 'futures', price: 3668.0, change24h: 1.72, volume24h: 920000000, openInterest: 380000000, fundingRate: 0, nextFunding: '-', high24h: 3740, low24h: 3600, maxLeverage: 100, marginMode: 'cross', contractSize: 0.01, tickSize: 0.01, makerFee: 0.0002, takerFee: 0.0005, status: 'live', listedAt: '2025-01-12', settleDate: '2026-09-26', description: 'ETH 季度合约（实物交割）', riskTag: '主流', indexSource: 'Brass / Kraken 综合', region: '全球', longShort: 49 },
  { id: 'c-sol-usd-1226', symbol: 'SOL-USD-1226', base: 'SOL', quote: 'USD', type: 'futures', price: 169.4, change24h: 4.82, volume24h: 320000000, openInterest: 124000000, fundingRate: 0, nextFunding: '-', high24h: 176, low24h: 161, maxLeverage: 50, marginMode: 'cross', contractSize: 0.1, tickSize: 0.01, makerFee: 0.0003, takerFee: 0.0006, status: 'live', listedAt: '2025-02-08', settleDate: '2026-12-26', description: 'SOL 季度合约（实物交割）', riskTag: '主流', indexSource: 'FTX / Coinbase 综合', region: '全球', longShort: 55 },
  { id: 'c-link-usdt-perp', symbol: 'LINK-USDT-PERP', base: 'LINK', quote: 'USDT', type: 'perp', price: 14.62, change24h: 1.24, volume24h: 184000000, openInterest: 64000000, fundingRate: 0.0068, nextFunding: '2026-07-19 16:00', high24h: 14.9, low24h: 14.32, maxLeverage: 50, marginMode: 'cross', contractSize: 1, tickSize: 0.001, makerFee: 0.0003, takerFee: 0.0006, status: 'live', listedAt: '2024-10-12', description: 'Chainlink 永续合约', riskTag: '主流', indexSource: 'Coinbase / Kraken 综合', region: '全球', longShort: 47 },
  { id: 'c-avax-usdt-perp', symbol: 'AVAX-USDT-PERP', base: 'AVAX', quote: 'USDT', type: 'perp', price: 28.4, change24h: -1.18, volume24h: 142000000, openInterest: 48000000, fundingRate: 0.0082, nextFunding: '2026-07-19 16:00', high24h: 29.1, low24h: 27.9, maxLeverage: 50, marginMode: 'cross', contractSize: 0.1, tickSize: 0.001, makerFee: 0.0003, takerFee: 0.0006, status: 'live', listedAt: '2024-11-15', description: 'Avalanche 永续合约', riskTag: '主流', indexSource: 'Coinbase / Binance 综合', region: '全球', longShort: 51 },
  { id: 'c-matic-usdt-perp', symbol: 'MATIC-USDT-PERP', base: 'MATIC', quote: 'USDT', type: 'perp', price: 0.482, change24h: 0.42, volume24h: 86000000, openInterest: 32000000, fundingRate: 0.0054, nextFunding: '2026-07-19 16:00', high24h: 0.492, low24h: 0.472, maxLeverage: 50, marginMode: 'cross', contractSize: 10, tickSize: 0.0001, makerFee: 0.0003, takerFee: 0.0006, status: 'live', listedAt: '2024-12-02', description: 'Polygon 永续合约', riskTag: '主流', indexSource: 'Coinbase / OKX 综合', region: '全球', longShort: 50 },
  { id: 'c-arb-usdt-perp', symbol: 'ARB-USDT-PERP', base: 'ARB', quote: 'USDT', type: 'perp', price: 0.682, change24h: -0.62, volume24h: 64000000, openInterest: 24000000, fundingRate: 0.0062, nextFunding: '2026-07-19 16:00', high24h: 0.694, low24h: 0.668, maxLeverage: 50, marginMode: 'cross', contractSize: 10, tickSize: 0.0001, makerFee: 0.0003, takerFee: 0.0006, status: 'live', listedAt: '2025-01-18', description: 'Arbitrum 永续合约', riskTag: '主流', indexSource: 'Binance / OKX 综合', region: '全球', longShort: 49 },
  { id: 'c-op-usdt-perp', symbol: 'OP-USDT-PERP', base: 'OP', quote: 'USDT', type: 'perp', price: 1.642, change24h: 0.86, volume24h: 48000000, openInterest: 18000000, fundingRate: 0.0074, nextFunding: '2026-07-19 16:00', high24h: 1.682, low24h: 1.602, maxLeverage: 50, marginMode: 'cross', contractSize: 10, tickSize: 0.0001, makerFee: 0.0003, takerFee: 0.0006, status: 'live', listedAt: '2025-02-22', description: 'Optimism 永续合约', riskTag: '主流', indexSource: 'Coinbase / OKX 综合', region: '全球', longShort: 52 },
  { id: 'c-ton-usdt-perp', symbol: 'TON-USDT-PERP', base: 'TON', quote: 'USDT', type: 'perp', price: 6.84, change24h: 3.42, volume24h: 240000000, openInterest: 86000000, fundingRate: 0.0118, nextFunding: '2026-07-19 16:00', high24h: 7.02, low24h: 6.62, maxLeverage: 50, marginMode: 'cross', contractSize: 1, tickSize: 0.001, makerFee: 0.0003, takerFee: 0.0006, status: 'live', listedAt: '2025-03-12', description: 'TON 永续合约', riskTag: '主流', indexSource: 'OKX / Bybit 综合', region: '全球', longShort: 54 },
  { id: 'c-pepe-usdt-perp', symbol: 'PEPE-USDT-PERP', base: 'PEPE', quote: 'USDT', type: 'perp', price: 0.0000124, change24h: -4.82, volume24h: 180000000, openInterest: 64000000, fundingRate: -0.0124, nextFunding: '2026-07-19 16:00', high24h: 0.0000134, low24h: 0.0000118, maxLeverage: 20, marginMode: 'cross', contractSize: 1000000, tickSize: 0.00000001, makerFee: 0.0005, takerFee: 0.0008, status: 'live', listedAt: '2025-04-20', description: 'PEPE 永续合约', riskTag: '高波动', indexSource: 'Binance / OKX 综合', region: '全球', longShort: 38 },
];

const OPTIONS: OptionContract[] = [
  { id: 'o-btc-70000-c-0726', underlying: 'BTC', type: 'call', strike: 70000, expiry: '2026-07-26', spot: 68420, mark: 1240, bid: 1230, ask: 1250, change24h: 8.4, volume24h: 8400000, openInterest: 3200000, iv: 58.2, delta: 0.42, gamma: 0.0008, theta: -28.4, vega: 84.2, settlement: 'physical', status: 'live' },
  { id: 'o-btc-70000-p-0726', underlying: 'BTC', type: 'put', strike: 70000, expiry: '2026-07-26', spot: 68420, mark: 2680, bid: 2670, ask: 2690, change24h: -3.2, volume24h: 6400000, openInterest: 2800000, iv: 60.4, delta: -0.58, gamma: 0.0008, theta: -32.6, vega: 88.4, settlement: 'physical', status: 'live' },
  { id: 'o-btc-65000-c-0726', underlying: 'BTC', type: 'call', strike: 65000, expiry: '2026-07-26', spot: 68420, mark: 4080, bid: 4060, ask: 4100, change24h: 4.2, volume24h: 4800000, openInterest: 1800000, iv: 52.8, delta: 0.68, gamma: 0.0006, theta: -22.4, vega: 64.8, settlement: 'physical', status: 'live' },
  { id: 'o-btc-65000-p-0726', underlying: 'BTC', type: 'put', strike: 65000, expiry: '2026-07-26', spot: 68420, mark: 720, bid: 710, ask: 730, change24h: -6.8, volume24h: 3200000, openInterest: 1400000, iv: 54.2, delta: -0.32, gamma: 0.0006, theta: -18.2, vega: 58.4, settlement: 'physical', status: 'live' },
  { id: 'o-eth-3800-c-0726', underlying: 'ETH', type: 'call', strike: 3800, expiry: '2026-07-26', spot: 3652, mark: 84, bid: 82, ask: 86, change24h: 6.4, volume24h: 2800000, openInterest: 1200000, iv: 62.4, delta: 0.36, gamma: 0.0012, theta: -8.4, vega: 28.6, settlement: 'physical', status: 'live' },
  { id: 'o-eth-3800-p-0726', underlying: 'ETH', type: 'put', strike: 3800, expiry: '2026-07-26', spot: 3652, mark: 248, bid: 246, ask: 250, change24h: -2.4, volume24h: 2400000, openInterest: 980000, iv: 64.8, delta: -0.62, gamma: 0.0012, theta: -12.6, vega: 32.4, settlement: 'physical', status: 'live' },
  { id: 'o-eth-3500-c-0726', underlying: 'ETH', type: 'call', strike: 3500, expiry: '2026-07-26', spot: 3652, mark: 196, bid: 194, ask: 198, change24h: 4.8, volume24h: 1800000, openInterest: 820000, iv: 58.6, delta: 0.62, gamma: 0.001, theta: -8.8, vega: 24.4, settlement: 'physical', status: 'live' },
  { id: 'o-eth-3500-p-0726', underlying: 'ETH', type: 'put', strike: 3500, expiry: '2026-07-26', spot: 3652, mark: 48, bid: 46, ask: 50, change24h: -8.2, volume24h: 1200000, openInterest: 480000, iv: 60.2, delta: -0.38, gamma: 0.001, theta: -6.2, vega: 22.8, settlement: 'physical', status: 'live' },
  { id: 'o-btc-72000-c-0830', underlying: 'BTC', type: 'call', strike: 72000, expiry: '2026-08-30', spot: 68420, mark: 1820, bid: 1810, ask: 1830, change24h: 5.2, volume24h: 1200000, openInterest: 480000, iv: 64.2, delta: 0.32, gamma: 0.0006, theta: -12.4, vega: 68.4, settlement: 'physical', status: 'live' },
  { id: 'o-btc-65000-p-0830', underlying: 'BTC', type: 'put', strike: 65000, expiry: '2026-08-30', spot: 68420, mark: 1840, bid: 1830, ask: 1850, change24h: -4.2, volume24h: 980000, openInterest: 380000, iv: 66.4, delta: -0.42, gamma: 0.0006, theta: -14.8, vega: 72.4, settlement: 'physical', status: 'live' },
  { id: 'o-eth-4000-c-0830', underlying: 'ETH', type: 'call', strike: 4000, expiry: '2026-08-30', spot: 3652, mark: 56, bid: 54, ask: 58, change24h: 4.4, volume24h: 820000, openInterest: 280000, iv: 68.4, delta: 0.28, gamma: 0.0008, theta: -4.2, vega: 22.4, settlement: 'physical', status: 'live' },
  { id: 'o-eth-3500-p-0830', underlying: 'ETH', type: 'put', strike: 3500, expiry: '2026-08-30', spot: 3652, mark: 142, bid: 140, ask: 144, change24h: -3.8, volume24h: 640000, openInterest: 220000, iv: 70.2, delta: -0.48, gamma: 0.0008, theta: -5.4, vega: 24.8, settlement: 'physical', status: 'live' },
];

const FUNDINGS: FundingEvent[] = [
  { id: 'f-btc-perp', symbol: 'BTC-USDT-PERP', type: 'perp', currentRate: 0.0085, predictedRate: 0.0092, nextTime: '2026-07-19 16:00', lastTime: '2026-07-19 08:00', lastRate: 0.0078, annualized: 9.32, history: [{ time: '07-19 08:00', rate: 0.0078 }, { time: '07-19 00:00', rate: 0.0068 }, { time: '07-18 16:00', rate: 0.0062 }, { time: '07-18 08:00', rate: 0.0054 }, { time: '07-18 00:00', rate: 0.0048 }, { time: '07-17 16:00', rate: 0.0042 }] },
  { id: 'f-eth-perp', symbol: 'ETH-USDT-PERP', type: 'perp', currentRate: 0.0072, predictedRate: 0.0068, nextTime: '2026-07-19 16:00', lastTime: '2026-07-19 08:00', lastRate: 0.0062, annualized: 7.88, history: [{ time: '07-19 08:00', rate: 0.0062 }, { time: '07-19 00:00', rate: 0.0058 }, { time: '07-18 16:00', rate: 0.0052 }, { time: '07-18 08:00', rate: 0.0046 }, { time: '07-18 00:00', rate: 0.0042 }, { time: '07-17 16:00', rate: 0.0038 }] },
  { id: 'f-sol-perp', symbol: 'SOL-USDT-PERP', type: 'perp', currentRate: 0.0124, predictedRate: 0.0142, nextTime: '2026-07-19 16:00', lastTime: '2026-07-19 08:00', lastRate: 0.0118, annualized: 13.62, history: [{ time: '07-19 08:00', rate: 0.0118 }, { time: '07-19 00:00', rate: 0.0098 }, { time: '07-18 16:00', rate: 0.0084 }, { time: '07-18 08:00', rate: 0.0072 }, { time: '07-18 00:00', rate: 0.0068 }, { time: '07-17 16:00', rate: 0.0054 }] },
  { id: 'f-bnb-perp', symbol: 'BNB-USDT-PERP', type: 'perp', currentRate: 0.0094, predictedRate: 0.0088, nextTime: '2026-07-19 16:00', lastTime: '2026-07-19 08:00', lastRate: 0.0082, annualized: 10.31, history: [{ time: '07-19 08:00', rate: 0.0082 }, { time: '07-19 00:00', rate: 0.0074 }, { time: '07-18 16:00', rate: 0.0068 }, { time: '07-18 08:00', rate: 0.0062 }, { time: '07-18 00:00', rate: 0.0058 }, { time: '07-17 16:00', rate: 0.0048 }] },
  { id: 'f-doge-perp', symbol: 'DOGE-USDT-PERP', type: 'perp', currentRate: -0.0042, predictedRate: -0.0038, nextTime: '2026-07-19 16:00', lastTime: '2026-07-19 08:00', lastRate: -0.0052, annualized: -4.61, history: [{ time: '07-19 08:00', rate: -0.0052 }, { time: '07-19 00:00', rate: -0.0048 }, { time: '07-18 16:00', rate: -0.0036 }, { time: '07-18 08:00', rate: -0.0028 }, { time: '07-18 00:00', rate: -0.0024 }, { time: '07-17 16:00', rate: -0.0018 }] },
  { id: 'f-ton-perp', symbol: 'TON-USDT-PERP', type: 'perp', currentRate: 0.0118, predictedRate: 0.0132, nextTime: '2026-07-19 16:00', lastTime: '2026-07-19 08:00', lastRate: 0.0108, annualized: 12.96, history: [{ time: '07-19 08:00', rate: 0.0108 }, { time: '07-19 00:00', rate: 0.0094 }, { time: '07-18 16:00', rate: 0.0082 }, { time: '07-18 08:00', rate: 0.0072 }, { time: '07-18 00:00', rate: 0.0068 }, { time: '07-17 16:00', rate: 0.0062 }] },
  { id: 'f-pepe-perp', symbol: 'PEPE-USDT-PERP', type: 'perp', currentRate: -0.0124, predictedRate: -0.0108, nextTime: '2026-07-19 16:00', lastTime: '2026-07-19 08:00', lastRate: -0.0142, annualized: -13.62, history: [{ time: '07-19 08:00', rate: -0.0142 }, { time: '07-19 00:00', rate: -0.0128 }, { time: '07-18 16:00', rate: -0.0118 }, { time: '07-18 08:00', rate: -0.0098 }, { time: '07-18 00:00', rate: -0.0084 }, { time: '07-17 16:00', rate: -0.0068 }] },
];

const LIQUIDATIONS: Liquidation[] = [
  { id: 'lq-2026-07-19-001', symbol: 'BTC-USDT-PERP', type: 'perp', side: 'long', price: 66920, quantity: 1.84, value: 123100, timestamp: '2026-07-19 10:18:24', status: 'completed', leverage: 50, userKyc: 'advanced', markPrice: 66880, gapPct: 0.06, fee: 86, insuranceFund: 0 },
  { id: 'lq-2026-07-19-002', symbol: 'ETH-USDT-PERP', type: 'perp', side: 'short', price: 3718, quantity: 28.4, value: 105591, timestamp: '2026-07-19 10:12:18', status: 'completed', leverage: 75, userKyc: 'advanced', markPrice: 3720, gapPct: 0.05, fee: 124, insuranceFund: 0 },
  { id: 'lq-2026-07-19-003', symbol: 'SOL-USDT-PERP', type: 'perp', side: 'long', price: 161.2, quantity: 480, value: 77376, timestamp: '2026-07-19 10:04:32', status: 'partial', leverage: 50, userKyc: 'basic', markPrice: 161.8, gapPct: 0.37, fee: 64, insuranceFund: 0 },
  { id: 'lq-2026-07-19-004', symbol: 'DOGE-USDT-PERP', type: 'perp', side: 'long', price: 0.1248, quantity: 480000, value: 59904, timestamp: '2026-07-19 09:58:48', status: 'completed', leverage: 20, userKyc: 'basic', markPrice: 0.1244, gapPct: 0.32, fee: 32, insuranceFund: 0 },
  { id: 'lq-2026-07-19-005', symbol: 'BTC-USDT-PERP', type: 'perp', side: 'long', price: 67280, quantity: 0.84, value: 56515, timestamp: '2026-07-19 09:42:08', status: 'completed', leverage: 100, userKyc: 'pro', markPrice: 67240, gapPct: 0.06, fee: 38, insuranceFund: 0 },
  { id: 'lq-2026-07-19-006', symbol: 'ETH-USDT-PERP', type: 'perp', side: 'short', price: 3702, quantity: 14.2, value: 52568, timestamp: '2026-07-19 09:18:42', status: 'adl', leverage: 75, userKyc: 'advanced', markPrice: 3708, gapPct: 0.16, fee: 42, insuranceFund: 0 },
  { id: 'lq-2026-07-19-007', symbol: 'ARB-USDT-PERP', type: 'perp', side: 'long', price: 0.668, quantity: 64000, value: 42752, timestamp: '2026-07-19 08:54:12', status: 'completed', leverage: 50, userKyc: 'basic', markPrice: 0.671, gapPct: 0.45, fee: 28, insuranceFund: 0 },
  { id: 'lq-2026-07-19-008', symbol: 'PEPE-USDT-PERP', type: 'perp', side: 'long', price: 0.0000119, quantity: 2.4e9, value: 28560, timestamp: '2026-07-19 08:32:48', status: 'completed', leverage: 20, userKyc: 'basic', markPrice: 0.000012, gapPct: 0.84, fee: 18, insuranceFund: 0 },
  { id: 'lq-2026-07-19-009', symbol: 'TON-USDT-PERP', type: 'perp', side: 'short', price: 6.62, quantity: 4200, value: 27804, timestamp: '2026-07-19 08:18:24', status: 'partial', leverage: 50, userKyc: 'basic', markPrice: 6.66, gapPct: 0.6, fee: 22, insuranceFund: 0 },
  { id: 'lq-2026-07-19-010', symbol: 'BTC-USDT-PERP', type: 'perp', side: 'long', price: 67520, quantity: 0.38, value: 25658, timestamp: '2026-07-19 08:08:36', status: 'completed', leverage: 75, userKyc: 'advanced', markPrice: 67480, gapPct: 0.06, fee: 18, insuranceFund: 0 },
  { id: 'lq-2026-07-19-011', symbol: 'OP-USDT-PERP', type: 'perp', side: 'long', price: 1.602, quantity: 14000, value: 22428, timestamp: '2026-07-19 07:48:12', status: 'completed', leverage: 50, userKyc: 'basic', markPrice: 1.612, gapPct: 0.62, fee: 16, insuranceFund: 0 },
  { id: 'lq-2026-07-19-012', symbol: 'MATIC-USDT-PERP', type: 'perp', side: 'long', price: 0.472, quantity: 42000, value: 19824, timestamp: '2026-07-19 07:32:18', status: 'cancelled', leverage: 50, userKyc: 'basic', markPrice: 0.475, gapPct: 0.63, fee: 14, insuranceFund: 0 },
];

const STRATEGIES: Strategy[] = [
  { id: 's-001', name: 'BTC 网格震荡 V3', type: 'grid', trader: 'QuantLab Pro', description: '基于波动率自适应的 BTC 网格策略，区间震荡盈利', pairs: ['BTC-USDT-PERP'], roi30d: 18.4, roi90d: 42.8, sharpe: 2.4, maxDrawdown: 6.8, aum: 28600000, subscribers: 4280, minSubscribe: 1000, performanceFee: 25, managementFee: 0, status: 'live', launchedAt: '2024-08-12', tags: ['中等风险', '网格', 'BTC'], equity: [{ date: '06-19', value: 10000 }, { date: '06-26', value: 10420 }, { date: '07-03', value: 10780 }, { date: '07-10', value: 11240 }, { date: '07-17', value: 11840 }] },
  { id: 's-002', name: 'ETH 趋势跟踪', type: 'momentum', trader: 'AlgoCapital', description: 'EMA + RSI 双因子趋势跟踪，中长线持仓', pairs: ['ETH-USDT-PERP'], roi30d: 24.2, roi90d: 68.4, sharpe: 2.1, maxDrawdown: 12.4, aum: 18400000, subscribers: 2860, minSubscribe: 500, performanceFee: 20, managementFee: 0, status: 'live', launchedAt: '2024-09-18', tags: ['中高风险', '趋势', 'ETH'], equity: [{ date: '06-19', value: 10000 }, { date: '06-26', value: 10680 }, { date: '07-03', value: 11120 }, { date: '07-10', value: 11820 }, { date: '07-17', value: 12420 }] },
  { id: 's-003', name: '多币种马丁格尔 V2', type: 'martingale', trader: 'DcaMaster', description: '经典马丁格尔策略，加仓降本 + 强平保护', pairs: ['BTC-USDT-PERP', 'ETH-USDT-PERP', 'SOL-USDT-PERP'], roi30d: 8.6, roi90d: 24.2, sharpe: 1.4, maxDrawdown: 18.4, aum: 12400000, subscribers: 1840, minSubscribe: 500, performanceFee: 30, managementFee: 0, status: 'live', launchedAt: '2024-10-22', tags: ['高风险', '马丁', '多币种'], equity: [{ date: '06-19', value: 10000 }, { date: '06-26', value: 10240 }, { date: '07-03', value: 10420 }, { date: '07-10', value: 10680 }, { date: '07-17', value: 10860 }] },
  { id: 's-004', name: '跨所套利 USDT', type: 'arbitrage', trader: 'ArbBot Pro', description: '跨交易所现货-合约价差套利', pairs: ['BTC-USDT-PERP', 'ETH-USDT-PERP'], roi30d: 4.2, roi90d: 14.8, sharpe: 3.4, maxDrawdown: 1.2, aum: 8200000, subscribers: 1240, minSubscribe: 5000, performanceFee: 15, managementFee: 1, status: 'live', launchedAt: '2024-11-08', tags: ['低风险', '套利', '稳定'], equity: [{ date: '06-19', value: 10000 }, { date: '06-26', value: 10080 }, { date: '07-03', value: 10168 }, { date: '07-10', value: 10286 }, { date: '07-17', value: 10420 }] },
  { id: 's-005', name: '中性对冲组合', type: 'hedge', trader: 'NeutralCap', description: '现货多头 + 合约空头 永续对冲', pairs: ['BTC-USDT-PERP', 'ETH-USDT-PERP'], roi30d: 6.4, roi90d: 18.2, sharpe: 2.8, maxDrawdown: 3.4, aum: 6800000, subscribers: 480, minSubscribe: 10000, performanceFee: 20, managementFee: 2, status: 'live', launchedAt: '2024-12-12', tags: ['中等风险', '对冲', '机构'], equity: [{ date: '06-19', value: 10000 }, { date: '06-26', value: 10180 }, { date: '07-03', value: 10320 }, { date: '07-10', value: 10480 }, { date: '07-17', value: 10640 }] },
  { id: 's-006', name: 'DCA 智能定投', type: 'dca', trader: 'DcaMaster', description: '智能 DCA 定投，自动低吸高抛', pairs: ['BTC-USDT-PERP', 'ETH-USDT-PERP'], roi30d: 12.4, roi90d: 32.6, sharpe: 1.8, maxDrawdown: 8.4, aum: 4800000, subscribers: 3680, minSubscribe: 100, performanceFee: 15, managementFee: 0, status: 'live', launchedAt: '2025-01-18', tags: ['低风险', '定投', '稳健'], equity: [{ date: '06-19', value: 10000 }, { date: '06-26', value: 10320 }, { date: '07-03', value: 10680 }, { date: '07-10', value: 10980 }, { date: '07-17', value: 11240 }] },
  { id: 's-007', name: '山寨币轮动', type: 'momentum', trader: 'AltRadar', description: '基于动量与成交量的山寨币轮动', pairs: ['SOL-USDT-PERP', 'AVAX-USDT-PERP', 'TON-USDT-PERP', 'LINK-USDT-PERP'], roi30d: 32.4, roi90d: 84.6, sharpe: 1.6, maxDrawdown: 22.4, aum: 3200000, subscribers: 1840, minSubscribe: 500, performanceFee: 30, managementFee: 0, status: 'live', launchedAt: '2025-02-12', tags: ['高风险', '轮动', '山寨币'], equity: [{ date: '06-19', value: 10000 }, { date: '06-26', value: 11240 }, { date: '07-03', value: 12180 }, { date: '07-10', value: 12640 }, { date: '07-17', value: 13240 }] },
  { id: 's-008', name: '期权 Delta 对冲', type: 'hedge', trader: 'OptionLab', description: '期权组合 Delta 中性对冲', pairs: ['BTC-USD-0726', 'ETH-USD-0726'], roi30d: 8.4, roi90d: 26.2, sharpe: 2.6, maxDrawdown: 4.8, aum: 2400000, subscribers: 280, minSubscribe: 50000, performanceFee: 25, managementFee: 2, status: 'paused', launchedAt: '2025-03-08', tags: ['中等风险', '期权', '对冲'], equity: [{ date: '06-19', value: 10000 }, { date: '06-26', value: 10240 }, { date: '07-03', value: 10480 }, { date: '07-10', value: 10620 }, { date: '07-17', value: 10840 }] },
];

const APPLICATIONS: Application[] = [
  { id: 'a-001', type: 'trader', company: '量化交易团队 A', contact: '李经理', email: 'trader-a@example.com', region: '亚太', stage: 'review', submittedAt: '2026-07-15 10:20', updatedAt: '2026-07-19 09:42', progress: 45, description: '专业衍生品量化交易团队，申请 VIP 费率', reviewer: '机构-A', expectedVolume: 50000000, feeTier: 'VIP-2', timeline: [{ stage: 'submitted', timestamp: '2026-07-15 10:20', note: '申请提交' }, { stage: 'review', timestamp: '2026-07-17 14:30', note: '材料初审通过，进入复审' }] },
  { id: 'a-002', type: 'institution', company: '对冲基金 B', contact: '王总监', email: 'fund-b@example.com', region: '亚太', stage: 'kyb', submittedAt: '2026-07-10 16:48', updatedAt: '2026-07-18 11:24', progress: 60, description: '专业对冲基金，机构账户申请', reviewer: '机构-B', expectedVolume: 200000000, feeTier: 'VIP-3', timeline: [{ stage: 'submitted', timestamp: '2026-07-10 16:48', note: '申请提交' }, { stage: 'review', timestamp: '2026-07-12 09:18', note: '材料初审通过' }, { stage: 'kyb', timestamp: '2026-07-18 11:24', note: 'KYB 资料收集中' }] },
  { id: 'a-003', type: 'api', company: '量化平台 C', contact: '陈架构师', email: 'platform-c@example.com', region: '全球', stage: 'tech-test', submittedAt: '2026-07-05 14:12', updatedAt: '2026-07-19 08:32', progress: 78, description: '量化交易平台，API 高级权限申请', reviewer: 'API-A', expectedVolume: 100000000, feeTier: 'VIP-2', timeline: [{ stage: 'submitted', timestamp: '2026-07-05 14:12', note: '申请提交' }, { stage: 'review', timestamp: '2026-07-07 11:20', note: '材料初审通过' }, { stage: 'kyb', timestamp: '2026-07-10 15:48', note: 'KYB 完成' }, { stage: 'tech-test', timestamp: '2026-07-15 09:30', note: '技术对接测试中' }] },
  { id: 'a-004', type: 'strategy', company: '策略团队 D', contact: '赵博士', email: 'strategy-d@example.com', region: '亚太', stage: 'contract', submittedAt: '2026-06-28 11:08', updatedAt: '2026-07-18 16:42', progress: 88, description: '策略团队，策略发布申请', reviewer: '策略-A', expectedVolume: 30000000, feeTier: 'VIP-2', timeline: [{ stage: 'submitted', timestamp: '2026-06-28 11:08', note: '申请提交' }, { stage: 'review', timestamp: '2026-07-02 14:24', note: '材料初审通过' }, { stage: 'kyb', timestamp: '2026-07-08 10:12', note: 'KYB 完成' }, { stage: 'tech-test', timestamp: '2026-07-12 09:48', note: '技术测试通过' }, { stage: 'contract', timestamp: '2026-07-18 16:42', note: '合约签署中' }] },
  { id: 'a-005', type: 'broker', company: '经纪商 E', contact: '孙总', email: 'broker-e@example.com', region: '中东', stage: 'submitted', submittedAt: '2026-07-18 14:36', updatedAt: '2026-07-18 14:36', progress: 12, description: '经纪商 IB 申请', reviewer: 'BD-A', expectedVolume: 20000000, feeTier: 'VIP-1', timeline: [{ stage: 'submitted', timestamp: '2026-07-18 14:36', note: '申请提交' }] },
];

// 后续 render 函数和主组件在第二段文件中实现
// ============== 工具函数 ==============

function formatNumber(n: number, digits = 2): string {
  if (Math.abs(n) >= 1e9) return `${(n / 1e9).toFixed(digits)}B`;
  if (Math.abs(n) >= 1e6) return `${(n / 1e6).toFixed(digits)}M`;
  if (Math.abs(n) >= 1e3) return `${(n / 1e3).toFixed(digits)}K`;
  return n.toFixed(digits);
}

function formatPrice(n: number, base: string): string {
  if (base === 'PEPE') return n.toFixed(8);
  if (n >= 100) return n.toFixed(1);
  if (n >= 1) return n.toFixed(2);
  if (n >= 0.01) return n.toFixed(3);
  return n.toFixed(5);
}

function formatPercent(n: number): string {
  const sign = n >= 0 ? '+' : '';
  return `${sign}${n.toFixed(2)}%`;
}

function formatRate(n: number): string {
  const sign = n >= 0 ? '+' : '';
  return `${sign}${(n * 100).toFixed(4)}%`;
}

function formatVolume(n: number): string {
  return `$${formatNumber(n, 1)}`;
}

function applyStageLabel(s: ApplyStage): string {
  return { submitted: '已提交', review: '初审中', kyb: 'KYB 资料', 'tech-test': '技术对接', contract: '合约签署', live: '已上线', rejected: '已驳回' }[s];
}

function applyStageColor(s: ApplyStage): string {
  return { submitted: BRAND.textMuted, review: BRAND.primary, kyb: '#3b82f6', 'tech-test': '#8b5cf6', contract: '#f59e0b', live: BRAND.success, rejected: BRAND.danger }[s];
}

function liqStatusColor(s: LiquidationStatus): string {
  return { pending: BRAND.textMuted, partial: BRAND.warning, completed: BRAND.danger, cancelled: BRAND.textMuted, adl: '#f59e0b' }[s];
}

function liqStatusLabel(s: LiquidationStatus): string {
  return { pending: '待处理', partial: '部分强平', completed: '已强平', cancelled: '已撤销', adl: 'ADL 减仓' }[s];
}

function contractTypeLabel(t: ContractType): string {
  return { perp: '永续', futures: '交割', 'option-call': '看涨期权', 'option-put': '看跌期权' }[t];
}

function contractTypeColor(t: ContractType): string {
  return { perp: BRAND.primary, futures: '#3b82f6', 'option-call': BRAND.success, 'option-put': BRAND.danger }[t];
}

function strategyTypeLabel(t: StrategyType): string {
  return { grid: '网格', dca: 'DCA 定投', martingale: '马丁格尔', arbitrage: '套利', hedge: '对冲', momentum: '趋势' }[t];
}

function strategyTypeColor(t: StrategyType): string {
  return { grid: BRAND.primary, dca: BRAND.success, martingale: BRAND.warning, arbitrage: '#3b82f6', hedge: '#8b5cf6', momentum: '#f59e0b' }[t];
}

function applyTypeLabel(t: ApplyType): string {
  return { trader: '专业交易员', institution: '机构账户', api: 'API 高级权限', strategy: '策略发布', broker: '经纪商 IB' }[t];
}

function StatusBadge({ status }: { status: 'live' | 'settling' | 'paused' | 'delisted' | 'expired' }) {
  const colors = {
    live: { bg: `${BRAND.success}20`, fg: BRAND.success, label: '交易中' },
    settling: { bg: `${BRAND.warning}20`, fg: BRAND.warning, label: '交割中' },
    paused: { bg: `${BRAND.danger}20`, fg: BRAND.danger, label: '已暂停' },
    delisted: { bg: `${BRAND.textMuted}20`, fg: BRAND.textMuted, label: '已下架' },
    expired: { bg: `${BRAND.textMuted}20`, fg: BRAND.textMuted, label: '已到期' },
  };
  const c = colors[status];
  return <span className="px-1.5 py-0.5 rounded text-[10px] font-medium" style={{ backgroundColor: c.bg, color: c.fg }}>{c.label}</span>;
}

// ============== 主组件 ==============

export function PortalDerivatives() {
  const [tab, setTab] = useState<Tab>('overview');
  const [search, setSearch] = useState('');
  const [contractTypeFilter, setContractTypeFilter] = useState<ContractType | 'all'>('all');
  const [leverageFilter, setLeverageFilter] = useState<Leverage | 'all'>('all');
  const [optionUnderlying, setOptionUnderlying] = useState<string>('BTC');
  const [optionType, setOptionType] = useState<OptionType>('call');
  const [sortBy, setSortBy] = useState<'volume' | 'oi' | 'change' | 'funding'>('volume');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [drawer, setDrawer] = useState<DrawerState>({ open: false, type: null, payload: null });
  const [helpOpen, setHelpOpen] = useState(false);
  const [applyStep, setApplyStep] = useState(0);
  const [applyType, setApplyType] = useState<ApplyType>('trader');
  const [applyCompany, setApplyCompany] = useState('');
  const [applyContact, setApplyContact] = useState('');
  const [applyEmail, setApplyEmail] = useState('');
  const [applyRegion, setApplyRegion] = useState('亚太');
  const [applyVolume, setApplyVolume] = useState('10000000');
  const [applyDesc, setApplyDesc] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);

  const [kpi, setKpi] = useState<KpiSnapshot>({
    totalContracts: 16,
    perpCount: 13,
    futuresCount: 3,
    optionCount: 12,
    totalOi: 5420000000,
    totalVolume24h: 12800000000,
    fundingInflow: 38400000,
    liquidations24h: 18,
    liquidatedValue: 642000,
    insuranceFund: 184000000,
    activeTraders: 86420,
    proTraders: 4280,
    totalSubscribers: 18420,
    strategiesAum: 84800000,
    pendingApplications: 5,
  });

  // 实时数据更新
  useEffect(() => {
    const timer = setInterval(() => {
      setKpi((prev) => ({
        ...prev,
        totalOi: prev.totalOi + (Math.random() - 0.5) * 8000000,
        totalVolume24h: prev.totalVolume24h + Math.random() * 12000000,
        liquidations24h: prev.liquidations24h + (Math.random() > 0.7 ? 1 : 0),
        liquidatedValue: prev.liquidatedValue + Math.random() * 28000,
        fundingInflow: prev.fundingInflow + (Math.random() - 0.4) * 32000,
        activeTraders: prev.activeTraders + Math.floor((Math.random() - 0.5) * 80),
        totalSubscribers: prev.totalSubscribers + Math.floor(Math.random() * 4),
      }));
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  // 快捷键
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === '/') { e.preventDefault(); searchRef.current?.focus(); }
      else if (e.key === 'Escape') {
        if (drawer.open) setDrawer({ open: false, type: null, payload: null });
        else if (helpOpen) setHelpOpen(false);
        else if (applyStep > 0) setApplyStep(0);
      } else if (e.key === '?') { setHelpOpen((v) => !v); }
      else if (e.key >= '1' && e.key <= '9') {
        const tabs: Tab[] = ['overview', 'perp', 'futures', 'options', 'funding', 'liquidations', 'strategies', 'apply', 'help'];
        const idx = parseInt(e.key, 10) - 1;
        if (idx < tabs.length) setTab(tabs[idx]);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [drawer.open, helpOpen, applyStep]);

  // 过滤与排序
  const filteredContracts = useMemo(() => {
    return CONTRACTS.filter((c) => {
      if (contractTypeFilter !== 'all' && c.type !== contractTypeFilter) return false;
      if (leverageFilter !== 'all' && c.maxLeverage !== leverageFilter) return false;
      if (search) {
        const s = search.toLowerCase();
        if (!c.symbol.toLowerCase().includes(s) && !c.base.toLowerCase().includes(s)) return false;
      }
      return true;
    }).sort((a, b) => {
      let av: number, bv: number;
      if (sortBy === 'volume') { av = a.volume24h; bv = b.volume24h; }
      else if (sortBy === 'oi') { av = a.openInterest; bv = b.openInterest; }
      else if (sortBy === 'change') { av = a.change24h; bv = b.change24h; }
      else { av = a.fundingRate; bv = b.fundingRate; }
      return sortDir === 'desc' ? bv - av : av - bv;
    });
  }, [contractTypeFilter, leverageFilter, search, sortBy, sortDir]);

  const filteredOptions = useMemo(() => {
    return OPTIONS.filter((o) => o.underlying === optionUnderlying && o.type === optionType);
  }, [optionUnderlying, optionType]);

  const filteredLiquidations = useMemo(() => {
    return LIQUIDATIONS.filter((l) => {
      if (search) {
        const s = search.toLowerCase();
        if (!l.symbol.toLowerCase().includes(s)) return false;
      }
      return true;
    }).sort((a, b) => b.value - a.value);
  }, [search]);

  const openDrawer = useCallback((type: DrawerType, payload: string | null = null) => {
    setDrawer({ open: true, type, payload });
  }, []);

  const closeDrawer = useCallback(() => {
    setDrawer({ open: false, type: null, payload: null });
  }, []);

  const submitApplication = useCallback(() => {
    setApplyStep(3);
    setTimeout(() => {
      setApplyStep(0);
      setApplyCompany('');
      setApplyContact('');
      setApplyEmail('');
      setApplyVolume('10000000');
      setApplyDesc('');
    }, 3000);
  }, []);

  return (
    <div className="min-h-screen" style={{ backgroundColor: BRAND.bg, color: BRAND.text }}>
      <style>{`
        @keyframes pd-fade-up { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pd-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.55; } }
        @keyframes pd-shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
        @keyframes pd-slide-in { from { transform: translateX(100%); } to { transform: translateX(0); } }
        @keyframes pd-bar { from { transform: scaleY(0); } to { transform: scaleY(1); } }
        .pd-stagger > * { animation: pd-fade-up 0.4s ease-out both; }
        .pd-stagger > *:nth-child(1) { animation-delay: 0.04s; }
        .pd-stagger > *:nth-child(2) { animation-delay: 0.08s; }
        .pd-stagger > *:nth-child(3) { animation-delay: 0.12s; }
        .pd-stagger > *:nth-child(4) { animation-delay: 0.16s; }
        .pd-stagger > *:nth-child(5) { animation-delay: 0.20s; }
        .pd-stagger > *:nth-child(6) { animation-delay: 0.24s; }
        .pd-stagger > *:nth-child(7) { animation-delay: 0.28s; }
        .pd-stagger > *:nth-child(8) { animation-delay: 0.32s; }
        .pd-pulse { animation: pd-pulse 2.4s ease-in-out infinite; }
        .pd-shimmer { background: linear-gradient(90deg, transparent, rgba(20,184,129,0.15), transparent); background-size: 200% 100%; animation: pd-shimmer 2.4s linear infinite; }
        .pd-drawer { animation: pd-slide-in 0.28s ease-out; }
        .pd-bar { transform-origin: bottom; animation: pd-bar 0.6s ease-out; }
        .pd-row:hover { background-color: ${BRAND.cardHover}; }
      `}</style>

      {/* Hero */}
      <section className="relative px-6 py-12 md:py-16" style={{ borderBottom: `1px solid ${BRAND.border}` }}>
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 size={20} style={{ color: BRAND.primary }} />
            <span className="text-xs uppercase tracking-widest" style={{ color: BRAND.textMuted }}>中萨数字科技交易所 · 衍生品交易中心</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-bold mb-3" style={{ color: BRAND.text }}>
            永续 · 交割 · 期权 · 量化
          </h1>
          <p className="text-sm md:text-base max-w-2xl mb-6" style={{ color: BRAND.textMuted }}>
            16 个衍生品合约 / 12 个期权链 / 8 套量化策略。构建「现货-合约-做市」三角协同闭环。
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setTab('perp')}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
              style={{ backgroundColor: BRAND.primary, color: '#000' }}
            >
              立即交易
            </button>
            <button
              onClick={() => openDrawer('help')}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
              style={{ backgroundColor: BRAND.card, color: BRAND.text, border: `1px solid ${BRAND.border}` }}
            >
              产品手册
            </button>
          </div>
        </div>
      </section>

      {/* 实时 KPI */}
      <section className="px-6 py-6" style={{ borderBottom: `1px solid ${BRAND.border}` }}>
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 pd-stagger">
          <KpiCard label="合约总数" value={`${kpi.totalContracts}`} sub="永续 13 / 交割 3" />
          <KpiCard label="持仓总量" value={formatVolume(kpi.totalOi)} sub="OI 实时" pulse />
          <KpiCard label="24h 交易量" value={formatVolume(kpi.totalVolume24h)} sub="全合约汇总" pulse />
          <KpiCard label="资金费率净流入" value={formatVolume(kpi.fundingInflow)} sub="24h" />
          <KpiCard label="24h 强平" value={`${kpi.liquidations24h} 笔`} sub={formatVolume(kpi.liquidatedValue)} pulse />
          <KpiCard label="保险基金" value={formatVolume(kpi.insuranceFund)} sub="系统余额" />
          <KpiCard label="活跃交易员" value={formatNumber(kpi.activeTraders, 0)} sub={`专业 ${kpi.proTraders}`} />
        </div>
      </section>

      {/* Tab 导航 */}
      <nav className="sticky top-0 z-30 px-6 py-3 flex flex-wrap gap-2" style={{ backgroundColor: BRAND.bg, borderBottom: `1px solid ${BRAND.border}` }}>
        {[
          { id: 'overview', label: '总览', icon: BarChart3 },
          { id: 'perp', label: `永续 (${kpi.perpCount})`, icon: Activity },
          { id: 'futures', label: `交割 (${kpi.futuresCount})`, icon: Calendar },
          { id: 'options', label: `期权 (${kpi.optionCount})`, icon: Target },
          { id: 'funding', label: '资金费率', icon: Coins },
          { id: 'liquidations', label: '强平监控', icon: AlertTriangle },
          { id: 'strategies', label: '量化策略', icon: Rocket },
          { id: 'apply', label: '申请接入', icon: Briefcase },
          { id: 'help', label: '帮助', icon: HelpCircle },
        ].map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id as Tab)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all"
              style={{
                backgroundColor: active ? `${BRAND.primary}15` : 'transparent',
                color: active ? BRAND.primary : BRAND.textMuted,
                border: `1px solid ${active ? BRAND.primary : 'transparent'}`,
              }}
            >
              <Icon size={14} />
              {t.label}
            </button>
          );
        })}
      </nav>

      {/* 主内容区 */}
      <main className="px-6 py-8 max-w-7xl mx-auto">
        {tab === 'overview' && <OverviewTab kpi={kpi} contracts={CONTRACTS.slice(0, 6)} fundings={FUNDINGS.slice(0, 4)} liquidations={LIQUIDATIONS.slice(0, 5)} onOpen={openDrawer} onTab={setTab} />}
        {tab === 'perp' && <ContractsTab list={filteredContracts.filter((c) => c.type === 'perp')} title="永续合约市场" onOpen={openDrawer} />}
        {tab === 'futures' && <ContractsTab list={filteredContracts.filter((c) => c.type === 'futures')} title="交割合约市场" onOpen={openDrawer} />}
        {tab === 'options' && <OptionsTab list={filteredOptions} underlying={optionUnderlying} optType={optionType} onUnderlying={setOptionUnderlying} onType={setOptionType} onOpen={openDrawer} />}
        {tab === 'funding' && <FundingTab list={FUNDINGS} onOpen={openDrawer} />}
        {tab === 'liquidations' && <LiquidationsTab list={filteredLiquidations} onOpen={openDrawer} />}
        {tab === 'strategies' && <StrategiesTab list={STRATEGIES} onOpen={openDrawer} />}
        {tab === 'apply' && <ApplyTab applications={APPLICATIONS} step={applyStep} setStep={setApplyStep} applyType={applyType} setApplyType={setApplyType} applyCompany={applyCompany} setApplyCompany={setApplyCompany} applyContact={applyContact} setApplyContact={setApplyContact} applyEmail={applyEmail} setApplyEmail={setApplyEmail} applyRegion={applyRegion} setApplyRegion={setApplyRegion} applyVolume={applyVolume} setApplyVolume={setApplyVolume} applyDesc={applyDesc} setApplyDesc={setApplyDesc} onSubmit={submitApplication} onOpen={openDrawer} />}
        {tab === 'help' && <HelpTab onOpen={openDrawer} onTab={setTab} />}
      </main>

      {/* 合规说明 + 底部 CTA */}
      <footer className="px-6 py-8" style={{ borderTop: `1px solid ${BRAND.border}` }}>
        <div className="max-w-7xl mx-auto">
          <div className="p-5 rounded-xl" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
            <div className="flex items-start gap-3">
              <ShieldAlert size={20} style={{ color: BRAND.warning }} className="flex-shrink-0 mt-0.5" />
              <div className="text-xs space-y-1" style={{ color: BRAND.textMuted }}>
                <p><strong style={{ color: BRAND.text }}>衍生品交易风险提示：</strong>永续 / 交割 / 期权 / 杠杆交易均属于高风险金融行为，可能导致本金部分或全部损失。资金费率、历史回测、量化策略收益均为市场参数与示例性数据，不构成对未来收益的承诺或保证。极端行情下可能触发强平 / ADL 减仓 / 流动性枯竭等风险事件。</p>
                <p><strong style={{ color: BRAND.text }}>合规说明：</strong>中萨数字科技交易所（ZSDEX）衍生品业务正处于<strong style={{ color: BRAND.text }}>合规研究方向</strong>，暂以亚太 / 欧洲 / 中东 / 拉美等地区的合规沙盒与国际化牌照研究为主，未在任何地区作出"持牌经营"或"已获监管许可"的承诺。杠杆上限、合约上下架、资金费率、量化策略等内容均可能根据合规要求、市场情况与系统能力进行调整。</p>
                <p><strong style={{ color: BRAND.text }}>严禁行为：</strong>严禁利用本平台从事市场操纵、内幕交易、洗钱、恐怖融资、规避制裁等违法活动。一经发现将立即采取账户冻结、资产追索、合规上报等措施。</p>
              </div>
            </div>
          </div>
          <div className="mt-6 text-center text-xs" style={{ color: BRAND.textMuted }}>
            © 2026 中萨数字科技交易所（ZSDEX）· 衍生品交易中心 · 演示版本，所有数据均为 mock 占位
          </div>
        </div>
      </footer>

      {/* Drawer */}
      {drawer.open && drawer.type === 'contract' && <ContractDetailDrawer id={drawer.payload!} onClose={closeDrawer} />}
      {drawer.open && drawer.type === 'option' && <OptionDetailDrawer id={drawer.payload!} onClose={closeDrawer} />}
      {drawer.open && drawer.type === 'liquidation' && <LiquidationDetailDrawer id={drawer.payload!} onClose={closeDrawer} />}
      {drawer.open && drawer.type === 'funding' && <FundingDetailDrawer id={drawer.payload!} onClose={closeDrawer} />}
      {drawer.open && drawer.type === 'strategy' && <StrategyDetailDrawer id={drawer.payload!} onClose={closeDrawer} />}
      {drawer.open && drawer.type === 'apply' && <ApplicationDetailDrawer id={drawer.payload!} onClose={closeDrawer} />}
      {drawer.open && drawer.type === 'help' && <HelpDrawer onClose={closeDrawer} />}

      {helpOpen && <HelpDrawer onClose={() => setHelpOpen(false)} />}
    </div>
  );
}

// ============== KpiCard ==============

function KpiCard({ label, value, sub, pulse }: { label: string; value: string; sub?: string; pulse?: boolean }) {
  return (
    <div className="p-3 rounded-xl" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
      <div className="text-[10px] uppercase tracking-wide mb-1" style={{ color: BRAND.textMuted }}>{label}</div>
      <div className={`text-lg font-semibold tabular-nums ${pulse ? 'pd-pulse' : ''}`} style={{ color: BRAND.text }}>{value}</div>
      {sub && <div className="text-[10px] mt-0.5" style={{ color: BRAND.textMuted }}>{sub}</div>}
    </div>
  );
}

// ============== OverviewTab ==============

function OverviewTab({ kpi, contracts, fundings, liquidations, onOpen, onTab }: { kpi: KpiSnapshot; contracts: Contract[]; fundings: FundingEvent[]; liquidations: Liquidation[]; onOpen: (t: DrawerType, p?: string) => void; onTab: (t: Tab) => void }) {
  return (
    <div className="space-y-6 pd-stagger">
      <Panel title="主流永续合约（实时）">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs" style={{ color: BRAND.textMuted }}>
                <th className="text-left p-2">合约</th>
                <th className="text-right p-2">价格</th>
                <th className="text-right p-2">24h 涨跌</th>
                <th className="text-right p-2">24h 交易量</th>
                <th className="text-right p-2">持仓量</th>
                <th className="text-right p-2">资金费率</th>
                <th className="text-right p-2">操作</th>
              </tr>
            </thead>
            <tbody>
              {contracts.map((c) => (
                <tr key={c.id} className="pd-row border-t" style={{ borderColor: BRAND.border }}>
                  <td className="p-2">
                    <div className="flex items-center gap-2">
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-medium" style={{ backgroundColor: `${contractTypeColor(c.type)}20`, color: contractTypeColor(c.type) }}>
                        {contractTypeLabel(c.type)}
                      </span>
                      <span className="font-medium" style={{ color: BRAND.text }}>{c.base}</span>
                      <span style={{ color: BRAND.textMuted }}>/ {c.quote}</span>
                    </div>
                  </td>
                  <td className="p-2 text-right tabular-nums font-medium" style={{ color: BRAND.text }}>{formatPrice(c.price, c.base)}</td>
                  <td className="p-2 text-right tabular-nums" style={{ color: c.change24h >= 0 ? BRAND.success : BRAND.danger }}>{formatPercent(c.change24h)}</td>
                  <td className="p-2 text-right tabular-nums" style={{ color: BRAND.text }}>{formatVolume(c.volume24h)}</td>
                  <td className="p-2 text-right tabular-nums" style={{ color: BRAND.text }}>{formatVolume(c.openInterest)}</td>
                  <td className="p-2 text-right tabular-nums" style={{ color: c.fundingRate >= 0 ? BRAND.success : BRAND.danger }}>{formatRate(c.fundingRate)}</td>
                  <td className="p-2 text-right">
                    <button onClick={() => onOpen('contract', c.id)} className="text-xs px-2 py-1 rounded" style={{ color: BRAND.primary, border: `1px solid ${BRAND.primary}40` }}>
                      详情
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <div className="grid md:grid-cols-2 gap-6">
        <Panel title="资金费率排行（Top 4）">
          <div className="space-y-2">
            {fundings.map((f) => (
              <div key={f.id} className="flex items-center justify-between p-2.5 rounded-lg pd-row" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium" style={{ color: BRAND.text }}>{f.symbol.replace('-USDT-PERP', '')}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: f.currentRate >= 0 ? `${BRAND.success}20` : `${BRAND.danger}20`, color: f.currentRate >= 0 ? BRAND.success : BRAND.danger }}>
                    年化 {f.annualized.toFixed(2)}%
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm tabular-nums" style={{ color: f.currentRate >= 0 ? BRAND.success : BRAND.danger }}>{formatRate(f.currentRate)}</span>
                  <button onClick={() => onOpen('funding', f.id)} className="text-xs" style={{ color: BRAND.primary }}>详情</button>
                </div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="24h 强平监控（Top 5）">
          <div className="space-y-2">
            {liquidations.map((l) => (
              <div key={l.id} className="flex items-center justify-between p-2.5 rounded-lg pd-row" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: l.side === 'long' ? `${BRAND.success}20` : `${BRAND.danger}20`, color: l.side === 'long' ? BRAND.success : BRAND.danger }}>
                    {l.side === 'long' ? '多' : '空'}
                  </span>
                  <span className="text-sm font-medium" style={{ color: BRAND.text }}>{l.symbol.replace('-USDT-PERP', '')}</span>
                  <span className="text-[10px]" style={{ color: BRAND.textMuted }}>{l.leverage}x</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm tabular-nums" style={{ color: BRAND.danger }}>{formatVolume(l.value)}</span>
                  <button onClick={() => onOpen('liquidation', l.id)} className="text-xs" style={{ color: BRAND.primary }}>详情</button>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <button onClick={() => onTab('options')} className="p-4 rounded-xl text-left transition-all" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
          <Target size={24} style={{ color: BRAND.primary }} className="mb-2" />
          <div className="text-base font-medium" style={{ color: BRAND.text }}>期权交易</div>
          <div className="text-xs mt-1" style={{ color: BRAND.textMuted }}>BTC / ETH 看涨看跌期权链</div>
        </button>
        <button onClick={() => onTab('strategies')} className="p-4 rounded-xl text-left transition-all" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
          <Rocket size={24} style={{ color: BRAND.primary }} className="mb-2" />
          <div className="text-base font-medium" style={{ color: BRAND.text }}>量化策略</div>
          <div className="text-xs mt-1" style={{ color: BRAND.textMuted }}>8 套专业策略 / 跟单订阅</div>
        </button>
        <button onClick={() => onTab('apply')} className="p-4 rounded-xl text-left transition-all" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
          <Briefcase size={24} style={{ color: BRAND.primary }} className="mb-2" />
          <div className="text-base font-medium" style={{ color: BRAND.text }}>机构接入</div>
          <div className="text-xs mt-1" style={{ color: BRAND.textMuted }}>VIP 费率 / API 高级权限</div>
        </button>
      </div>
    </div>
  );
}

function Panel({ title, children, right }: { title: string; children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <div className="p-5 rounded-xl" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold" style={{ color: BRAND.text }}>{title}</h3>
        {right}
      </div>
      {children}
    </div>
  );
}

// ============== ContractsTab ==============

function ContractsTab({ list, title, onOpen }: { list: Contract[]; title: string; onOpen: (t: DrawerType, p?: string) => void }) {
  if (list.length === 0) {
    return (
      <Panel title={title}>
        <div className="py-12 text-center">
          <Inbox size={32} className="mx-auto mb-2 opacity-40" style={{ color: BRAND.textMuted }} />
          <div className="text-sm" style={{ color: BRAND.textMuted }}>暂无合约数据</div>
        </div>
      </Panel>
    );
  }
  return (
    <div className="space-y-4 pd-stagger">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold" style={{ color: BRAND.text }}>{title}</h2>
        <div className="flex items-center gap-2 text-xs" style={{ color: BRAND.textMuted }}>
          <span>排序：</span>
          <button onClick={() => { /* toggle handled by parent */ }} className="px-2 py-1 rounded" style={{ backgroundColor: BRAND.card, color: BRAND.text }}>交易量</button>
        </div>
      </div>
      <Panel title={`${list.length} 个合约`}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs" style={{ color: BRAND.textMuted }}>
                <th className="text-left p-2">合约</th>
                <th className="text-right p-2">价格</th>
                <th className="text-right p-2">24h 涨跌</th>
                <th className="text-right p-2">24h 交易量</th>
                <th className="text-right p-2">持仓量</th>
                <th className="text-right p-2">多空比</th>
                <th className="text-right p-2">资金费率</th>
                <th className="text-right p-2">最高杠杆</th>
                <th className="text-right p-2">状态</th>
                <th className="text-right p-2">操作</th>
              </tr>
            </thead>
            <tbody>
              {list.map((c) => (
                <tr key={c.id} className="pd-row border-t" style={{ borderColor: BRAND.border }}>
                  <td className="p-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium" style={{ color: BRAND.text }}>{c.base}/{c.quote}</span>
                      {c.type === 'futures' && c.settleDate && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: `${BRAND.textMuted}20`, color: BRAND.textMuted }}>{c.settleDate.slice(2)}</span>
                      )}
                    </div>
                  </td>
                  <td className="p-2 text-right tabular-nums font-medium" style={{ color: BRAND.text }}>{formatPrice(c.price, c.base)}</td>
                  <td className="p-2 text-right tabular-nums" style={{ color: c.change24h >= 0 ? BRAND.success : BRAND.danger }}>{formatPercent(c.change24h)}</td>
                  <td className="p-2 text-right tabular-nums" style={{ color: BRAND.text }}>{formatVolume(c.volume24h)}</td>
                  <td className="p-2 text-right tabular-nums" style={{ color: BRAND.text }}>{formatVolume(c.openInterest)}</td>
                  <td className="p-2 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <div className="w-16 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: `${BRAND.danger}30` }}>
                        <div className="h-full" style={{ width: `${c.longShort}%`, backgroundColor: BRAND.success }} />
                      </div>
                      <span className="text-[10px] tabular-nums" style={{ color: BRAND.textMuted }}>{c.longShort}%</span>
                    </div>
                  </td>
                  <td className="p-2 text-right tabular-nums" style={{ color: c.fundingRate >= 0 ? BRAND.success : BRAND.danger }}>{formatRate(c.fundingRate)}</td>
                  <td className="p-2 text-right tabular-nums font-medium" style={{ color: BRAND.primary }}>{c.maxLeverage}x</td>
                  <td className="p-2 text-right"><StatusBadge status={c.status} /></td>
                  <td className="p-2 text-right">
                    <button onClick={() => onOpen('contract', c.id)} className="text-xs px-2 py-1 rounded" style={{ color: BRAND.primary, border: `1px solid ${BRAND.primary}40` }}>
                      详情
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}

// ============== OptionsTab ==============

function OptionsTab({ list, underlying, optType, onUnderlying, onType, onOpen }: { list: OptionContract[]; underlying: string; optType: OptionType; onUnderlying: (s: string) => void; onType: (t: OptionType) => void; onOpen: (t: DrawerType, p?: string) => void }) {
  const spot = list[0]?.spot || 0;
  return (
    <div className="space-y-4 pd-stagger">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-xl font-semibold" style={{ color: BRAND.text }}>期权链</h2>
        <div className="flex items-center gap-1.5">
          {['BTC', 'ETH'].map((u) => (
            <button key={u} onClick={() => onUnderlying(u)} className="px-3 py-1 rounded text-xs font-medium" style={{ backgroundColor: underlying === u ? BRAND.primary : BRAND.card, color: underlying === u ? '#000' : BRAND.text, border: `1px solid ${underlying === u ? BRAND.primary : BRAND.border}` }}>
              {u}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1.5">
          <button onClick={() => onType('call')} className="px-3 py-1 rounded text-xs font-medium" style={{ backgroundColor: optType === 'call' ? BRAND.success : BRAND.card, color: optType === 'call' ? '#000' : BRAND.text, border: `1px solid ${optType === 'call' ? BRAND.success : BRAND.border}` }}>
            看涨
          </button>
          <button onClick={() => onType('put')} className="px-3 py-1 rounded text-xs font-medium" style={{ backgroundColor: optType === 'put' ? BRAND.danger : BRAND.card, color: optType === 'put' ? '#000' : BRAND.text, border: `1px solid ${optType === 'put' ? BRAND.danger : BRAND.border}` }}>
            看跌
          </button>
        </div>
        <div className="text-xs ml-auto" style={{ color: BRAND.textMuted }}>
          现价: <span className="font-medium tabular-nums" style={{ color: BRAND.text }}>${spot.toLocaleString()}</span>
        </div>
      </div>

      <Panel title={`${underlying} ${optType === 'call' ? '看涨' : '看跌'}期权链`}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs" style={{ color: BRAND.textMuted }}>
                <th className="text-left p-2">行权价</th>
                <th className="text-right p-2">到期日</th>
                <th className="text-right p-2">标记价</th>
                <th className="text-right p-2">买价 / 卖价</th>
                <th className="text-right p-2">24h 涨跌</th>
                <th className="text-right p-2">24h 交易量</th>
                <th className="text-right p-2">持仓量</th>
                <th className="text-right p-2">IV</th>
                <th className="text-right p-2">Delta</th>
                <th className="text-right p-2">Gamma</th>
                <th className="text-right p-2">Theta</th>
                <th className="text-right p-2">操作</th>
              </tr>
            </thead>
            <tbody>
              {list.map((o) => (
                <tr key={o.id} className="pd-row border-t" style={{ borderColor: BRAND.border }}>
                  <td className="p-2 tabular-nums font-medium" style={{ color: BRAND.text }}>${o.strike.toLocaleString()}</td>
                  <td className="p-2 text-right text-xs" style={{ color: BRAND.textMuted }}>{o.expiry}</td>
                  <td className="p-2 text-right tabular-nums font-medium" style={{ color: BRAND.text }}>${o.mark.toFixed(2)}</td>
                  <td className="p-2 text-right tabular-nums text-xs" style={{ color: BRAND.textMuted }}>${o.bid.toFixed(2)} / ${o.ask.toFixed(2)}</td>
                  <td className="p-2 text-right tabular-nums" style={{ color: o.change24h >= 0 ? BRAND.success : BRAND.danger }}>{formatPercent(o.change24h)}</td>
                  <td className="p-2 text-right tabular-nums" style={{ color: BRAND.text }}>${formatNumber(o.volume24h, 0)}</td>
                  <td className="p-2 text-right tabular-nums" style={{ color: BRAND.text }}>${formatNumber(o.openInterest, 0)}</td>
                  <td className="p-2 text-right tabular-nums" style={{ color: BRAND.text }}>{o.iv.toFixed(1)}%</td>
                  <td className="p-2 text-right tabular-nums" style={{ color: o.delta >= 0 ? BRAND.success : BRAND.danger }}>{o.delta.toFixed(2)}</td>
                  <td className="p-2 text-right tabular-nums" style={{ color: BRAND.textMuted }}>{o.gamma.toFixed(4)}</td>
                  <td className="p-2 text-right tabular-nums" style={{ color: BRAND.danger }}>{o.theta.toFixed(1)}</td>
                  <td className="p-2 text-right">
                    <button onClick={() => onOpen('option', o.id)} className="text-xs px-2 py-1 rounded" style={{ color: BRAND.primary, border: `1px solid ${BRAND.primary}40` }}>
                      详情
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <Panel title="期权希腊字母说明">
        <div className="grid md:grid-cols-5 gap-3 text-xs">
          <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}>
            <div className="font-medium mb-1" style={{ color: BRAND.text }}>Delta (Δ)</div>
            <div style={{ color: BRAND.textMuted }}>标的价格变动 1，期权价格变动幅度</div>
          </div>
          <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}>
            <div className="font-medium mb-1" style={{ color: BRAND.text }}>Gamma (Γ)</div>
            <div style={{ color: BRAND.textMuted }}>Delta 对标的价格的二阶导数</div>
          </div>
          <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}>
            <div className="font-medium mb-1" style={{ color: BRAND.text }}>Theta (Θ)</div>
            <div style={{ color: BRAND.textMuted }}>时间衰减，每日价值损耗</div>
          </div>
          <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}>
            <div className="font-medium mb-1" style={{ color: BRAND.text }}>Vega (ν)</div>
            <div style={{ color: BRAND.textMuted }}>隐含波动率变动 1%，价格变动</div>
          </div>
          <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}>
            <div className="font-medium mb-1" style={{ color: BRAND.text }}>IV</div>
            <div style={{ color: BRAND.textMuted }}>隐含波动率，市场预期</div>
          </div>
        </div>
      </Panel>
    </div>
  );
}

// ============== FundingTab ==============

function FundingTab({ list, onOpen }: { list: FundingEvent[]; onOpen: (t: DrawerType, p?: string) => void }) {
  return (
    <div className="space-y-4 pd-stagger">
      <h2 className="text-xl font-semibold" style={{ color: BRAND.text }}>资金费率排行</h2>
      <Panel title={`${list.length} 个合约 · 资金费率每 8 小时结算`}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs" style={{ color: BRAND.textMuted }}>
                <th className="text-left p-2">合约</th>
                <th className="text-right p-2">当前费率</th>
                <th className="text-right p-2">预测费率</th>
                <th className="text-right p-2">上次费率</th>
                <th className="text-right p-2">年化</th>
                <th className="text-right p-2">下次结算</th>
                <th className="text-right p-2">历史趋势</th>
                <th className="text-right p-2">操作</th>
              </tr>
            </thead>
            <tbody>
              {list.map((f) => (
                <tr key={f.id} className="pd-row border-t" style={{ borderColor: BRAND.border }}>
                  <td className="p-2 font-medium" style={{ color: BRAND.text }}>{f.symbol.replace('-USDT-PERP', '')}</td>
                  <td className="p-2 text-right tabular-nums" style={{ color: f.currentRate >= 0 ? BRAND.success : BRAND.danger }}>{formatRate(f.currentRate)}</td>
                  <td className="p-2 text-right tabular-nums" style={{ color: f.predictedRate >= 0 ? BRAND.success : BRAND.danger }}>{formatRate(f.predictedRate)}</td>
                  <td className="p-2 text-right tabular-nums" style={{ color: BRAND.textMuted }}>{formatRate(f.lastRate)}</td>
                  <td className="p-2 text-right tabular-nums font-medium" style={{ color: f.annualized >= 0 ? BRAND.success : BRAND.danger }}>{f.annualized.toFixed(2)}%</td>
                  <td className="p-2 text-right text-xs" style={{ color: BRAND.textMuted }}>{f.nextTime}</td>
                  <td className="p-2">
                    <div className="flex items-center justify-end gap-0.5 h-6">
                      {f.history.map((h, i) => {
                        const maxRate = Math.max(...f.history.map((x) => Math.abs(x.rate)));
                        const h_pct = (Math.abs(h.rate) / maxRate) * 100;
                        return (
                          <div key={i} className="w-1.5 rounded-sm" style={{ height: `${h_pct}%`, backgroundColor: h.rate >= 0 ? BRAND.success : BRAND.danger, minHeight: 4 }} title={`${h.time}: ${formatRate(h.rate)}`} />
                        );
                      })}
                    </div>
                  </td>
                  <td className="p-2 text-right">
                    <button onClick={() => onOpen('funding', f.id)} className="text-xs px-2 py-1 rounded" style={{ color: BRAND.primary, border: `1px solid ${BRAND.primary}40` }}>详情</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}

// ============== LiquidationsTab ==============

function LiquidationsTab({ list, onOpen }: { list: Liquidation[]; onOpen: (t: DrawerType, p?: string) => void }) {
  return (
    <div className="space-y-4 pd-stagger">
      <h2 className="text-xl font-semibold" style={{ color: BRAND.text }}>强平监控</h2>
      <Panel title={`24h 强平 ${list.length} 笔 · 实时滚动`}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs" style={{ color: BRAND.textMuted }}>
                <th className="text-left p-2">时间</th>
                <th className="text-left p-2">合约</th>
                <th className="text-center p-2">方向</th>
                <th className="text-right p-2">强平价</th>
                <th className="text-right p-2">标记价</th>
                <th className="text-right p-2">数量</th>
                <th className="text-right p-2">价值</th>
                <th className="text-right p-2">杠杆</th>
                <th className="text-right p-2">KYC</th>
                <th className="text-center p-2">状态</th>
                <th className="text-right p-2">操作</th>
              </tr>
            </thead>
            <tbody>
              {list.map((l) => (
                <tr key={l.id} className="pd-row border-t" style={{ borderColor: BRAND.border }}>
                  <td className="p-2 text-xs tabular-nums" style={{ color: BRAND.textMuted }}>{l.timestamp}</td>
                  <td className="p-2 font-medium" style={{ color: BRAND.text }}>{l.symbol.replace('-USDT-PERP', '')}</td>
                  <td className="p-2 text-center">
                    <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: l.side === 'long' ? `${BRAND.success}20` : `${BRAND.danger}20`, color: l.side === 'long' ? BRAND.success : BRAND.danger }}>
                      {l.side === 'long' ? '多' : '空'}
                    </span>
                  </td>
                  <td className="p-2 text-right tabular-nums" style={{ color: BRAND.text }}>{formatPrice(l.price, l.symbol.split('-')[0])}</td>
                  <td className="p-2 text-right tabular-nums" style={{ color: BRAND.textMuted }}>{formatPrice(l.markPrice, l.symbol.split('-')[0])}</td>
                  <td className="p-2 text-right tabular-nums" style={{ color: BRAND.text }}>{formatNumber(l.quantity, 2)}</td>
                  <td className="p-2 text-right tabular-nums font-medium" style={{ color: BRAND.danger }}>{formatVolume(l.value)}</td>
                  <td className="p-2 text-right tabular-nums" style={{ color: BRAND.text }}>{l.leverage}x</td>
                  <td className="p-2 text-right text-xs" style={{ color: BRAND.textMuted }}>{l.userKyc === 'basic' ? '基础' : l.userKyc === 'advanced' ? '高级' : '专业'}</td>
                  <td className="p-2 text-center">
                    <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: `${liqStatusColor(l.status)}20`, color: liqStatusColor(l.status) }}>
                      {liqStatusLabel(l.status)}
                    </span>
                  </td>
                  <td className="p-2 text-right">
                    <button onClick={() => onOpen('liquidation', l.id)} className="text-xs px-2 py-1 rounded" style={{ color: BRAND.primary, border: `1px solid ${BRAND.primary}40` }}>详情</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}

// ============== StrategiesTab ==============

function StrategiesTab({ list, onOpen }: { list: Strategy[]; onOpen: (t: DrawerType, p?: string) => void }) {
  return (
    <div className="space-y-4 pd-stagger">
      <h2 className="text-xl font-semibold" style={{ color: BRAND.text }}>量化策略市场</h2>
      <div className="grid md:grid-cols-2 gap-4">
        {list.map((s) => {
          const maxEquity = Math.max(...s.equity.map((e) => e.value));
          return (
            <div key={s.id} className="p-4 rounded-xl" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: `${strategyTypeColor(s.type)}20`, color: strategyTypeColor(s.type) }}>
                      {strategyTypeLabel(s.type)}
                    </span>
                    {s.status === 'paused' && <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: `${BRAND.warning}20`, color: BRAND.warning }}>已暂停</span>}
                  </div>
                  <div className="text-base font-medium" style={{ color: BRAND.text }}>{s.name}</div>
                  <div className="text-xs" style={{ color: BRAND.textMuted }}>by {s.trader}</div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-semibold tabular-nums" style={{ color: s.roi30d >= 0 ? BRAND.success : BRAND.danger }}>{formatPercent(s.roi30d)}</div>
                  <div className="text-[10px]" style={{ color: BRAND.textMuted }}>30 天</div>
                </div>
              </div>
              <div className="text-xs mb-3" style={{ color: BRAND.textMuted }}>{s.description}</div>
              <div className="grid grid-cols-4 gap-2 text-xs mb-3">
                <div>
                  <div style={{ color: BRAND.textMuted }}>90 天</div>
                  <div className="font-medium tabular-nums" style={{ color: s.roi90d >= 0 ? BRAND.success : BRAND.danger }}>{formatPercent(s.roi90d)}</div>
                </div>
                <div>
                  <div style={{ color: BRAND.textMuted }}>夏普</div>
                  <div className="font-medium tabular-nums" style={{ color: BRAND.text }}>{s.sharpe.toFixed(1)}</div>
                </div>
                <div>
                  <div style={{ color: BRAND.textMuted }}>回撤</div>
                  <div className="font-medium tabular-nums" style={{ color: BRAND.danger }}>{s.maxDrawdown.toFixed(1)}%</div>
                </div>
                <div>
                  <div style={{ color: BRAND.textMuted }}>订阅者</div>
                  <div className="font-medium tabular-nums" style={{ color: BRAND.text }}>{formatNumber(s.subscribers, 0)}</div>
                </div>
              </div>
              <div className="flex items-end gap-0.5 h-10 mb-3">
                {s.equity.map((e, i) => {
                  const h_pct = (e.value / maxEquity) * 100;
                  return (
                    <div key={i} className="flex-1 rounded-sm" style={{ height: `${h_pct}%`, backgroundColor: BRAND.primary, minHeight: 4 }} title={`${e.date}: $${e.value}`} />
                  );
                })}
              </div>
              <div className="flex items-center justify-between">
                <div className="text-xs" style={{ color: BRAND.textMuted }}>AUM ${formatNumber(s.aum, 0)}</div>
                <button onClick={() => onOpen('strategy', s.id)} className="text-xs px-3 py-1.5 rounded" style={{ backgroundColor: BRAND.primary, color: '#000' }}>详情</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============== ApplyTab ==============

function ApplyTab({ applications, step, setStep, applyType, setApplyType, applyCompany, setApplyCompany, applyContact, setApplyContact, applyEmail, setApplyEmail, applyRegion, setApplyRegion, applyVolume, setApplyVolume, applyDesc, setApplyDesc, onSubmit, onOpen }: any) {
  return (
    <div className="space-y-4 pd-stagger">
      <h2 className="text-xl font-semibold" style={{ color: BRAND.text }}>机构 / 交易员 接入申请</h2>

      <div className="grid lg:grid-cols-5 gap-4">
        <div className="lg:col-span-3">
          <Panel title="申请向导">
            {step === 0 && (
              <div className="space-y-4">
                <div className="text-sm" style={{ color: BRAND.textMuted }}>选择申请类型：</div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {(['trader', 'institution', 'api', 'strategy', 'broker'] as ApplyType[]).map((t) => (
                    <button key={t} onClick={() => setApplyType(t)} className="p-3 rounded-lg text-left transition-all" style={{ backgroundColor: applyType === t ? `${BRAND.primary}15` : BRAND.bg, border: `1px solid ${applyType === t ? BRAND.primary : BRAND.border}` }}>
                      <div className="text-sm font-medium" style={{ color: BRAND.text }}>{applyTypeLabel(t)}</div>
                    </button>
                  ))}
                </div>
                <button onClick={() => setStep(1)} className="w-full py-2.5 rounded-lg text-sm font-medium" style={{ backgroundColor: BRAND.primary, color: '#000' }}>
                  下一步：填写资料
                </button>
              </div>
            )}
            {step === 1 && (
              <div className="space-y-3">
                <div>
                  <label className="text-xs" style={{ color: BRAND.textMuted }}>公司 / 团队名称</label>
                  <input value={applyCompany} onChange={(e) => setApplyCompany(e.target.value)} placeholder="请输入公司或团队名称" className="w-full mt-1 px-3 py-2 rounded-lg text-sm" style={{ backgroundColor: BRAND.bg, color: BRAND.text, border: `1px solid ${BRAND.border}` }} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs" style={{ color: BRAND.textMuted }}>联系人</label>
                    <input value={applyContact} onChange={(e) => setApplyContact(e.target.value)} placeholder="姓名" className="w-full mt-1 px-3 py-2 rounded-lg text-sm" style={{ backgroundColor: BRAND.bg, color: BRAND.text, border: `1px solid ${BRAND.border}` }} />
                  </div>
                  <div>
                    <label className="text-xs" style={{ color: BRAND.textMuted }}>邮箱</label>
                    <input value={applyEmail} onChange={(e) => setApplyEmail(e.target.value)} placeholder="name@company.com" className="w-full mt-1 px-3 py-2 rounded-lg text-sm" style={{ backgroundColor: BRAND.bg, color: BRAND.text, border: `1px solid ${BRAND.border}` }} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs" style={{ color: BRAND.textMuted }}>区域</label>
                    <select value={applyRegion} onChange={(e) => setApplyRegion(e.target.value)} className="w-full mt-1 px-3 py-2 rounded-lg text-sm" style={{ backgroundColor: BRAND.bg, color: BRAND.text, border: `1px solid ${BRAND.border}` }}>
                      {['亚太', '欧洲', '北美', '中东', '南美', '非洲', '大洋洲'].map((r) => <option key={r}>{r}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs" style={{ color: BRAND.textMuted }}>预期月交易量 (USD)</label>
                    <input value={applyVolume} onChange={(e) => setApplyVolume(e.target.value)} type="number" className="w-full mt-1 px-3 py-2 rounded-lg text-sm tabular-nums" style={{ backgroundColor: BRAND.bg, color: BRAND.text, border: `1px solid ${BRAND.border}` }} />
                  </div>
                </div>
                <div>
                  <label className="text-xs" style={{ color: BRAND.textMuted }}>申请说明</label>
                  <textarea value={applyDesc} onChange={(e) => setApplyDesc(e.target.value)} rows={3} placeholder="请说明申请背景、业务范围、合规研究方向等" className="w-full mt-1 px-3 py-2 rounded-lg text-sm" style={{ backgroundColor: BRAND.bg, color: BRAND.text, border: `1px solid ${BRAND.border}` }} />
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setStep(0)} className="px-4 py-2 rounded-lg text-sm" style={{ backgroundColor: BRAND.bg, color: BRAND.text, border: `1px solid ${BRAND.border}` }}>上一步</button>
                  <button onClick={() => setStep(2)} disabled={!applyCompany || !applyContact || !applyEmail} className="flex-1 py-2 rounded-lg text-sm font-medium" style={{ backgroundColor: applyCompany && applyContact && applyEmail ? BRAND.primary : BRAND.card, color: applyCompany && applyContact && applyEmail ? '#000' : BRAND.textMuted }}>
                    下一步：确认提交
                  </button>
                </div>
              </div>
            )}
            {step === 2 && (
              <div className="space-y-3">
                <div className="text-sm font-medium" style={{ color: BRAND.text }}>确认申请信息</div>
                <div className="space-y-1.5 text-sm">
                  <Row label="申请类型" value={applyTypeLabel(applyType)} />
                  <Row label="公司" value={applyCompany} />
                  <Row label="联系人" value={applyContact} />
                  <Row label="邮箱" value={applyEmail} />
                  <Row label="区域" value={applyRegion} />
                  <Row label="预期月量" value={`$${formatNumber(parseInt(applyVolume || '0', 10), 0)}`} />
                  <Row label="说明" value={applyDesc || '-'} />
                </div>
                <div className="p-3 rounded-lg text-xs" style={{ backgroundColor: `${BRAND.warning}15`, color: BRAND.warning, border: `1px solid ${BRAND.warning}40` }}>
                  申请提交后将进入初审流程，审核周期约 3-5 个工作日。请确保提交资料真实有效，本平台仅作合规研究方向评估，不构成任何监管承诺。
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setStep(1)} className="px-4 py-2 rounded-lg text-sm" style={{ backgroundColor: BRAND.bg, color: BRAND.text, border: `1px solid ${BRAND.border}` }}>上一步</button>
                  <button onClick={onSubmit} className="flex-1 py-2 rounded-lg text-sm font-medium" style={{ backgroundColor: BRAND.primary, color: '#000' }}>确认提交</button>
                </div>
              </div>
            )}
            {step === 3 && (
              <div className="py-8 text-center">
                <CheckCircle2 size={48} style={{ color: BRAND.success }} className="mx-auto mb-3" />
                <div className="text-base font-medium" style={{ color: BRAND.text }}>申请已提交</div>
                <div className="text-sm mt-1" style={{ color: BRAND.textMuted }}>审核团队将在 3-5 个工作日内联系您</div>
              </div>
            )}
          </Panel>
        </div>

        <div className="lg:col-span-2">
          <Panel title="申请进度" right={<span className="text-[10px]" style={{ color: BRAND.textMuted }}>{applications.length}</span>}>
            <div className="space-y-2">
              {applications.map((a: Application) => (
                <div key={a.id} className="p-2.5 rounded-lg pd-row" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-medium" style={{ color: BRAND.text }}>{a.company}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: `${applyStageColor(a.stage)}20`, color: applyStageColor(a.stage) }}>
                      {applyStageLabel(a.stage)}
                    </span>
                  </div>
                  <div className="text-[10px]" style={{ color: BRAND.textMuted }}>{applyTypeLabel(a.type)} · {a.region}</div>
                  <div className="mt-1.5 h-1 rounded-full overflow-hidden" style={{ backgroundColor: BRAND.border }}>
                    <div className="h-full" style={{ width: `${a.progress}%`, backgroundColor: applyStageColor(a.stage) }} />
                  </div>
                  <button onClick={() => onOpen('apply', a.id)} className="text-[10px] mt-1.5" style={{ color: BRAND.primary }}>查看详情 →</button>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 p-2 rounded" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}>
      <span className="w-20 text-xs" style={{ color: BRAND.textMuted }}>{label}</span>
      <span className="flex-1 text-sm" style={{ color: BRAND.text }}>{value}</span>
    </div>
  );
}

// ============== HelpTab ==============

function HelpTab({ onOpen, onTab }: { onOpen: (t: DrawerType, p?: string) => void; onTab: (t: Tab) => void }) {
  return (
    <div className="space-y-4 pd-stagger">
      <h2 className="text-xl font-semibold" style={{ color: BRAND.text }}>帮助与文档</h2>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { title: '产品手册', desc: '永续 / 交割 / 期权完整产品说明', icon: BookOpen, tab: 'overview' as Tab },
          { title: '资金费率说明', desc: '8 小时结算机制 + 历史回测', icon: Coins, tab: 'funding' as Tab },
          { title: '强平规则', desc: '保证金率、维持、强平、ADL 完整规则', icon: AlertTriangle, tab: 'liquidations' as Tab },
          { title: '量化策略指南', desc: '订阅、跟单、绩效评估', icon: Rocket, tab: 'strategies' as Tab },
          { title: 'API 接入文档', desc: 'REST / WebSocket 量化接口', icon: Code2, tab: 'help' as Tab },
          { title: '合规与风险', desc: '衍生品交易风险揭示', icon: Shield, tab: 'help' as Tab },
        ].map((h) => {
          const Icon = h.icon;
          return (
            <button key={h.title} onClick={() => onTab(h.tab)} className="p-4 rounded-xl text-left transition-all" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
              <Icon size={20} style={{ color: BRAND.primary }} className="mb-2" />
              <div className="text-sm font-medium mb-1" style={{ color: BRAND.text }}>{h.title}</div>
              <div className="text-xs" style={{ color: BRAND.textMuted }}>{h.desc}</div>
            </button>
          );
        })}
      </div>

      <Panel title="快捷键">
        <div className="grid md:grid-cols-2 gap-2 text-sm">
          {[
            { k: '/', d: '聚焦搜索框' },
            { k: 'Esc', d: '关闭抽屉 / 弹窗' },
            { k: '?', d: '打开/关闭本页帮助' },
            { k: '1-9', d: '切换 Tab（总览/永续/.../帮助）' },
          ].map((it) => (
            <div key={it.k} className="flex items-center gap-3 p-2.5 rounded-lg" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}>
              <span className="px-2 py-0.5 rounded text-xs font-mono" style={{ backgroundColor: BRAND.card, color: BRAND.primary, border: `1px solid ${BRAND.primary}40`, minWidth: 60, textAlign: 'center' }}>{it.k}</span>
              <span style={{ color: BRAND.text }}>{it.d}</span>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

// ============== Drawers ==============

function ContractDetailDrawer({ id, onClose }: { id: string; onClose: () => void }) {
  const c = CONTRACTS.find((x) => x.id === id);
  if (!c) return null;
  return (
    <div className="fixed inset-0 z-50 flex justify-end" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }} onClick={onClose}>
      <div className="w-full max-w-lg h-full overflow-y-auto pd-drawer" style={{ backgroundColor: BRAND.bg, borderLeft: `1px solid ${BRAND.border}` }} onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4" style={{ backgroundColor: BRAND.bg, borderBottom: `1px solid ${BRAND.border}` }}>
          <h3 className="text-base font-semibold" style={{ color: BRAND.text }}>{c.base}/{c.quote} 合约详情</h3>
          <button onClick={onClose} className="p-1.5 rounded" style={{ color: BRAND.textMuted }}><X size={18} /></button>
        </div>
        <div className="p-5 space-y-4">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-xs font-medium" style={{ backgroundColor: `${contractTypeColor(c.type)}20`, color: contractTypeColor(c.type) }}>{contractTypeLabel(c.type)}</span>
            <StatusBadge status={c.status} />
            {c.settleDate && <span className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: `${BRAND.textMuted}20`, color: BRAND.textMuted }}>交割 {c.settleDate}</span>}
          </div>
          <div>
            <div className="text-3xl font-bold tabular-nums" style={{ color: BRAND.text }}>{formatPrice(c.price, c.base)}</div>
            <div className="text-sm mt-1 tabular-nums" style={{ color: c.change24h >= 0 ? BRAND.success : BRAND.danger }}>{formatPercent(c.change24h)} (24h)</div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Stat label="24h 交易量" value={formatVolume(c.volume24h)} />
            <Stat label="持仓量" value={formatVolume(c.openInterest)} />
            <Stat label="24h 最高" value={formatPrice(c.high24h, c.base)} />
            <Stat label="24h 最低" value={formatPrice(c.low24h, c.base)} />
            <Stat label="资金费率" value={formatRate(c.fundingRate)} accent={c.fundingRate >= 0 ? BRAND.success : BRAND.danger} />
            <Stat label="年化" value={`${(c.fundingRate * 3 * 365 * 100).toFixed(2)}%`} />
            <Stat label="最大杠杆" value={`${c.maxLeverage}x`} accent={BRAND.primary} />
            <Stat label="多空比" value={`${c.longShort}%`} />
            <Stat label="Maker 费率" value={`${(c.makerFee * 100).toFixed(4)}%`} />
            <Stat label="Taker 费率" value={`${(c.takerFee * 100).toFixed(4)}%`} />
            <Stat label="合约单位" value={String(c.contractSize)} />
            <Stat label="最小变动" value={String(c.tickSize)} />
          </div>
          <Panel title="合约说明">
            <div className="text-sm" style={{ color: BRAND.text }}>{c.description}</div>
            <div className="text-xs mt-2" style={{ color: BRAND.textMuted }}>指数源：{c.indexSource}</div>
            <div className="text-xs" style={{ color: BRAND.textMuted }}>上市时间：{c.listedAt}</div>
            <div className="text-xs" style={{ color: BRAND.textMuted }}>风险标签：{c.riskTag}</div>
          </Panel>
        </div>
      </div>
    </div>
  );
}

function OptionDetailDrawer({ id, onClose }: { id: string; onClose: () => void }) {
  const o = OPTIONS.find((x) => x.id === id);
  if (!o) return null;
  return (
    <div className="fixed inset-0 z-50 flex justify-end" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }} onClick={onClose}>
      <div className="w-full max-w-lg h-full overflow-y-auto pd-drawer" style={{ backgroundColor: BRAND.bg, borderLeft: `1px solid ${BRAND.border}` }} onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4" style={{ backgroundColor: BRAND.bg, borderBottom: `1px solid ${BRAND.border}` }}>
          <h3 className="text-base font-semibold" style={{ color: BRAND.text }}>{o.underlying} 期权详情</h3>
          <button onClick={onClose} className="p-1.5 rounded" style={{ color: BRAND.textMuted }}><X size={18} /></button>
        </div>
        <div className="p-5 space-y-4">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-xs font-medium" style={{ backgroundColor: `${o.type === 'call' ? BRAND.success : BRAND.danger}20`, color: o.type === 'call' ? BRAND.success : BRAND.danger }}>{o.type === 'call' ? '看涨' : '看跌'}</span>
            <span className="text-sm" style={{ color: BRAND.text }}>行权价 ${o.strike.toLocaleString()}</span>
            <span className="text-xs" style={{ color: BRAND.textMuted }}>{o.expiry}</span>
          </div>
          <div>
            <div className="text-3xl font-bold tabular-nums" style={{ color: BRAND.text }}>${o.mark.toFixed(2)}</div>
            <div className="text-sm mt-1 tabular-nums" style={{ color: o.change24h >= 0 ? BRAND.success : BRAND.danger }}>{formatPercent(o.change24h)} (24h)</div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Stat label="现价" value={`$${o.spot.toLocaleString()}`} />
            <Stat label="买价" value={`$${o.bid.toFixed(2)}`} />
            <Stat label="卖价" value={`$${o.ask.toFixed(2)}`} />
            <Stat label="24h 交易量" value={`$${formatNumber(o.volume24h, 0)}`} />
            <Stat label="持仓量" value={`$${formatNumber(o.openInterest, 0)}`} />
            <Stat label="隐含波动率" value={`${o.iv.toFixed(1)}%`} />
            <Stat label="Delta" value={o.delta.toFixed(2)} accent={o.delta >= 0 ? BRAND.success : BRAND.danger} />
            <Stat label="Gamma" value={o.gamma.toFixed(4)} />
            <Stat label="Theta" value={o.theta.toFixed(1)} accent={BRAND.danger} />
            <Stat label="Vega" value={o.vega.toFixed(1)} />
            <Stat label="结算方式" value={o.settlement === 'physical' ? '实物交割' : '现金结算'} />
            <Stat label="状态" value={o.status === 'live' ? '交易中' : o.status === 'paused' ? '已暂停' : '已到期'} />
          </div>
        </div>
      </div>
    </div>
  );
}

function LiquidationDetailDrawer({ id, onClose }: { id: string; onClose: () => void }) {
  const l = LIQUIDATIONS.find((x) => x.id === id);
  if (!l) return null;
  return (
    <div className="fixed inset-0 z-50 flex justify-end" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }} onClick={onClose}>
      <div className="w-full max-w-md h-full overflow-y-auto pd-drawer" style={{ backgroundColor: BRAND.bg, borderLeft: `1px solid ${BRAND.border}` }} onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4" style={{ backgroundColor: BRAND.bg, borderBottom: `1px solid ${BRAND.border}` }}>
          <h3 className="text-base font-semibold" style={{ color: BRAND.text }}>强平详情</h3>
          <button onClick={onClose} className="p-1.5 rounded" style={{ color: BRAND.textMuted }}><X size={18} /></button>
        </div>
        <div className="p-5 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Stat label="合约" value={l.symbol.replace('-USDT-PERP', '')} />
            <Stat label="方向" value={l.side === 'long' ? '多头' : '空头'} accent={l.side === 'long' ? BRAND.success : BRAND.danger} />
            <Stat label="强平价" value={formatPrice(l.price, l.symbol.split('-')[0])} />
            <Stat label="标记价" value={formatPrice(l.markPrice, l.symbol.split('-')[0])} />
            <Stat label="数量" value={formatNumber(l.quantity, 2)} />
            <Stat label="价值" value={formatVolume(l.value)} accent={BRAND.danger} />
            <Stat label="杠杆" value={`${l.leverage}x`} />
            <Stat label="用户 KYC" value={l.userKyc === 'basic' ? '基础' : l.userKyc === 'advanced' ? '高级' : '专业'} />
            <Stat label="标记价差" value={`${l.gapPct.toFixed(2)}%`} />
            <Stat label="手续费" value={`$${l.fee.toFixed(2)}`} />
            <Stat label="状态" value={liqStatusLabel(l.status)} />
            <Stat label="时间" value={l.timestamp} />
          </div>
        </div>
      </div>
    </div>
  );
}

function FundingDetailDrawer({ id, onClose }: { id: string; onClose: () => void }) {
  const f = FUNDINGS.find((x) => x.id === id);
  if (!f) return null;
  return (
    <div className="fixed inset-0 z-50 flex justify-end" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }} onClick={onClose}>
      <div className="w-full max-w-md h-full overflow-y-auto pd-drawer" style={{ backgroundColor: BRAND.bg, borderLeft: `1px solid ${BRAND.border}` }} onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4" style={{ backgroundColor: BRAND.bg, borderBottom: `1px solid ${BRAND.border}` }}>
          <h3 className="text-base font-semibold" style={{ color: BRAND.text }}>{f.symbol} 资金费率详情</h3>
          <button onClick={onClose} className="p-1.5 rounded" style={{ color: BRAND.textMuted }}><X size={18} /></button>
        </div>
        <div className="p-5 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Stat label="当前费率" value={formatRate(f.currentRate)} accent={f.currentRate >= 0 ? BRAND.success : BRAND.danger} />
            <Stat label="预测费率" value={formatRate(f.predictedRate)} accent={f.predictedRate >= 0 ? BRAND.success : BRAND.danger} />
            <Stat label="上次费率" value={formatRate(f.lastRate)} />
            <Stat label="年化" value={`${f.annualized.toFixed(2)}%`} accent={f.annualized >= 0 ? BRAND.success : BRAND.danger} />
            <Stat label="下次结算" value={f.nextTime} />
            <Stat label="上次结算" value={f.lastTime} />
          </div>
          <Panel title="历史费率（最近 6 期）">
            <div className="space-y-1.5">
              {f.history.map((h, i) => (
                <div key={i} className="flex items-center justify-between p-2 rounded text-sm" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}>
                  <span style={{ color: BRAND.textMuted }}>{h.time}</span>
                  <span className="tabular-nums font-medium" style={{ color: h.rate >= 0 ? BRAND.success : BRAND.danger }}>{formatRate(h.rate)}</span>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}

function StrategyDetailDrawer({ id, onClose }: { id: string; onClose: () => void }) {
  const s = STRATEGIES.find((x) => x.id === id);
  if (!s) return null;
  const maxEquity = Math.max(...s.equity.map((e) => e.value));
  return (
    <div className="fixed inset-0 z-50 flex justify-end" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }} onClick={onClose}>
      <div className="w-full max-w-md h-full overflow-y-auto pd-drawer" style={{ backgroundColor: BRAND.bg, borderLeft: `1px solid ${BRAND.border}` }} onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4" style={{ backgroundColor: BRAND.bg, borderBottom: `1px solid ${BRAND.border}` }}>
          <h3 className="text-base font-semibold" style={{ color: BRAND.text }}>{s.name}</h3>
          <button onClick={onClose} className="p-1.5 rounded" style={{ color: BRAND.textMuted }}><X size={18} /></button>
        </div>
        <div className="p-5 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Stat label="策略类型" value={strategyTypeLabel(s.type)} />
            <Stat label="交易员" value={s.trader} />
            <Stat label="30 天收益" value={formatPercent(s.roi30d)} accent={s.roi30d >= 0 ? BRAND.success : BRAND.danger} />
            <Stat label="90 天收益" value={formatPercent(s.roi90d)} accent={s.roi90d >= 0 ? BRAND.success : BRAND.danger} />
            <Stat label="夏普比率" value={s.sharpe.toFixed(2)} />
            <Stat label="最大回撤" value={`${s.maxDrawdown.toFixed(1)}%`} accent={BRAND.danger} />
            <Stat label="AUM" value={`$${formatNumber(s.aum, 0)}`} />
            <Stat label="订阅者" value={formatNumber(s.subscribers, 0)} />
            <Stat label="起投金额" value={`$${formatNumber(s.minSubscribe, 0)}`} />
            <Stat label="业绩提成" value={`${s.performanceFee}%`} />
            <Stat label="管理费" value={`${s.managementFee}%/年`} />
            <Stat label="状态" value={s.status === 'live' ? '运行中' : s.status === 'paused' ? '已暂停' : '已关闭'} />
          </div>
          <Panel title="策略说明">
            <div className="text-sm" style={{ color: BRAND.text }}>{s.description}</div>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {s.tags.map((t) => <span key={t} className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: `${BRAND.primary}15`, color: BRAND.primary }}>{t}</span>)}
            </div>
          </Panel>
          <Panel title="资金曲线">
            <div className="flex items-end gap-1 h-24">
              {s.equity.map((e, i) => {
                const h_pct = (e.value / maxEquity) * 100;
                return <div key={i} className="flex-1 rounded-sm" style={{ height: `${h_pct}%`, backgroundColor: BRAND.primary, minHeight: 4 }} title={`${e.date}: $${e.value}`} />;
              })}
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}

function ApplicationDetailDrawer({ id, onClose }: { id: string; onClose: () => void }) {
  const a = APPLICATIONS.find((x) => x.id === id);
  if (!a) return null;
  return (
    <div className="fixed inset-0 z-50 flex justify-end" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }} onClick={onClose}>
      <div className="w-full max-w-md h-full overflow-y-auto pd-drawer" style={{ backgroundColor: BRAND.bg, borderLeft: `1px solid ${BRAND.border}` }} onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4" style={{ backgroundColor: BRAND.bg, borderBottom: `1px solid ${BRAND.border}` }}>
          <h3 className="text-base font-semibold" style={{ color: BRAND.text }}>{a.company}</h3>
          <button onClick={onClose} className="p-1.5 rounded" style={{ color: BRAND.textMuted }}><X size={18} /></button>
        </div>
        <div className="p-5 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Stat label="联系人" value={a.contact} />
            <Stat label="邮箱" value={a.email} />
            <Stat label="区域" value={a.region} />
            <Stat label="审核人" value={a.reviewer} />
            <Stat label="提交时间" value={a.submittedAt} />
            <Stat label="更新时间" value={a.updatedAt} />
            <Stat label="预期月量" value={`$${formatNumber(a.expectedVolume, 0)}`} />
            <Stat label="费率等级" value={a.feeTier} />
            <Stat label="进度" value={`${a.progress}%`} accent={BRAND.primary} />
            <Stat label="类型" value={applyTypeLabel(a.type)} />
          </div>
          <Panel title="说明"><div className="text-sm" style={{ color: BRAND.text }}>{a.description}</div></Panel>
          <Panel title="时间线">
            <div className="space-y-2">
              {a.timeline.map((t, i) => {
                const tsc = applyStageColor(t.stage);
                return (
                  <div key={i} className="flex items-start gap-2 text-xs">
                    <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: tsc }} />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span style={{ color: BRAND.text }}>{applyStageLabel(t.stage)}</span>
                        <span style={{ color: BRAND.textMuted }}>· {t.timestamp}</span>
                      </div>
                      <div style={{ color: BRAND.textMuted }}>{t.note}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
      <div className="text-[10px] mb-0.5" style={{ color: BRAND.textMuted }}>{label}</div>
      <div className="text-base font-semibold tabular-nums" style={{ color: accent || BRAND.text }}>{value}</div>
    </div>
  );
}

function HelpDrawer({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex justify-end" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }} onClick={onClose}>
      <div className="w-full max-w-md h-full overflow-y-auto pd-drawer" style={{ backgroundColor: BRAND.bg, borderLeft: `1px solid ${BRAND.border}` }} onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4" style={{ backgroundColor: BRAND.bg, borderBottom: `1px solid ${BRAND.border}` }}>
          <h3 className="text-base font-semibold" style={{ color: BRAND.text }}>快捷键与帮助</h3>
          <button onClick={onClose} className="p-1.5 rounded" style={{ color: BRAND.textMuted }}><X size={18} /></button>
        </div>
        <div className="p-5 space-y-3">
          {[
            { k: '/', d: '聚焦搜索' },
            { k: 'Esc', d: '关闭抽屉 / 弹窗' },
            { k: '?', d: '打开/关闭本页帮助' },
            { k: '1-9', d: '切换 Tab（总览/永续/.../帮助）' },
          ].map((it) => (
            <div key={it.k} className="flex items-center gap-3 p-2.5 rounded-lg" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
              <span className="px-2 py-0.5 rounded text-xs font-mono" style={{ backgroundColor: BRAND.bg, color: BRAND.primary, border: `1px solid ${BRAND.primary}40`, minWidth: 60, textAlign: 'center' }}>{it.k}</span>
              <span className="text-sm" style={{ color: BRAND.text }}>{it.d}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

