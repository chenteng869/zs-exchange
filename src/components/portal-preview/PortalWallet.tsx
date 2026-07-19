'use client';

/**
 * PortalWallet - 钱包服务中心 (2026-07-19 Q05 P3.33)
 *
 * 页面定位：
 * - 中萨数字科技交易所 钱包服务中心
 * - 钱包总览 / 现货钱包 / 合约钱包 / DeFi 钱包 / NFT 钱包 / 跨链钱包 / 硬件钱包 / 历史记录
 * - 与 P3.4 现货 + P3.25 做市 + P3.26 衍生品 + P3.27 量化 + P3.28 NFT +
 *   P3.29 DeFi + P3.30 跨链 + P3.31 节点 + P3.32 数据形成"用户-钱包-资产-链上"全场景闭环
 *
 * L4 工业级设计标准：
 * - 暗色 v6 纯黑 #000000 + 卡片 #141414 + ZSDEX 绿 primary #14B881
 * - 9 Tabs：总览 / 现货钱包 / 合约钱包 / DeFi 钱包 / NFT 钱包 / 跨链钱包 / 硬件钱包 / 历史记录 / 帮助
 * - 10+ 区块、9+ 交互、7+ Drawer、4+ 实时数据、5+ 动画
 *
 * 合规要点（Q05 硬约束）：
 * - 所有钱包 / 余额 / 充值 / 提现 / 交易数据使用 mock 占位
 * - 严格规避"承诺收益 / 保本 / 刚兑 / 稳赚 / 担保 / 萨摩亚持牌 / MSA / DSAEX"等高风险词
 * - 明确"数字资产钱包与用户资产管理研究方向"定性
 * - 不修改旧官网 / 旧 H5 / disabled pages / brand.ts / SPEC.md
 */

import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import {
  Search,
  X,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Filter,
  Wallet,
  Coins,
  CircleDollarSign,
  CreditCard,
  Banknote,
  Banknote as CashIcon,
  ArrowDownToLine,
  ArrowUpToLine,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowRight,
  ArrowLeftRight,
  Plus,
  Minus,
  Check,
  CheckCircle2,
  XCircle,
  AlertCircle,
  AlertTriangle,
  AlertOctagon,
  Eye,
  EyeOff,
  Copy as CopyIcon,
  ExternalLink,
  QrCode,
  Download,
  Upload,
  FileText,
  FileCode,
  Code2,
  Terminal,
  Database,
  Server,
  Cloud,
  Network,
  Zap,
  Rocket,
  Flame,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Lock,
  Unlock,
  KeyRound,
  KeySquare,
  Hash,
  Settings,
  Sliders,
  Bell,
  BellOff,
  Mail,
  HelpCircle,
  Keyboard,
  BookOpen,
  GraduationCap,
  Lightbulb,
  Sparkles,
  Star,
  Crown,
  Trophy,
  Award,
  Calendar,
  Clock,
  User,
  Users,
  UserCheck,
  UserPlus,
  Building2,
  Briefcase,
  Handshake,
  Tag,
  Tags,
  Layers,
  Box,
  Boxes,
  Cpu,
  Hexagon,
  Diamond,
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart as PieIcon,
  LineChart as LineIcon,
  Activity,
  Gauge,
  Target,
  Compass,
  MapPin,
  Globe2,
  Globe,
  Heart,
  ThumbsUp,
  ThumbsDown,
  Flag,
  Bookmark,
  Phone,
  MessageCircle,
  MessageSquare,
  Gift,
  Send,
} from 'lucide-react';
import { BRAND, STATUS } from './brand';

// ============== 类型 ==============

type Tab = 'overview' | 'spot' | 'perp' | 'defi' | 'nft' | 'bridge' | 'hardware' | 'history' | 'help';
type WalletType = 'spot' | 'perp' | 'defi' | 'nft' | 'bridge' | 'hardware' | 'savings' | 'funding';
type ChainNetwork = 'eth' | 'bsc' | 'polygon' | 'arbitrum' | 'optimism' | 'avalanche' | 'solana' | 'bitcoin' | 'tron' | 'zs-chain';
type AssetType = 'crypto' | 'stable' | 'wrapped' | 'lp' | 'nft' | 'rwa';
type TxType = 'deposit' | 'withdraw' | 'trade' | 'transfer' | 'stake' | 'unstake' | 'claim' | 'borrow' | 'repay' | 'lend' | 'mint' | 'burn' | 'bridge' | 'swap';
type TxStatus = 'completed' | 'pending' | 'failed' | 'confirmed' | 'processing';
type RiskLevel = 'low' | 'medium' | 'high';
type DrawerType = 'asset' | 'position' | 'deposit' | 'withdraw' | 'transfer' | 'backup' | 'history' | 'hardware' | 'help' | null;

interface Asset {
  id: string;
  symbol: string;
  name: string;
  chain: ChainNetwork;
  type: AssetType;
  balance: number;
  price: number;
  value: number;
  change24h: number;
  allocation: number;
  icon: string;
  contract?: string;
  decimals: number;
  apy?: number;
}

interface Position {
  id: string;
  symbol: string;
  type: 'long' | 'short';
  size: number;
  entryPrice: number;
  markPrice: number;
  leverage: number;
  margin: number;
  pnl: number;
  pnlPct: number;
  liquidationPrice: number;
  funding: number;
  openedAt: string;
  chain: ChainNetwork;
}

interface LpPosition {
  id: string;
  pool: string;
  protocol: string;
  chain: ChainNetwork;
  token0: string;
  token1: string;
  value: number;
  apr: number;
  fees24h: number;
  rewards: { symbol: string; amount: number; value: number }[];
  impermanentLoss: number;
  age: number;
  status: 'active' | 'concentrated' | 'stable';
}

interface NftHolding {
  id: string;
  name: string;
  collection: string;
  tokenId: string;
  chain: ChainNetwork;
  estimatedValue: number;
  acquiredAt: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary' | 'mythic';
  lastSale: number;
  image: string;
  usedAsCollateral: boolean;
  loanId?: string;
}

interface BridgeHolding {
  id: string;
  asset: string;
  chain: ChainNetwork;
  balance: number;
  value: number;
  bridge: string;
  bridgedAt: string;
  originalChain: ChainNetwork;
  isCanonical: boolean;
}

interface HardwareDevice {
  id: string;
  brand: 'Ledger' | 'Trezor' | 'Keystone' | 'BitBox' | 'GridPlus' | 'imToken';
  model: string;
  firmware: string;
  connected: boolean;
  pairedAt: string;
  addressCount: number;
  chains: ChainNetwork[];
  backupVerified: boolean;
  pinSet: boolean;
  passphrase: boolean;
  lastSync: string;
  status: 'active' | 'idle' | 'disconnected' | 'locked';
}

interface Transaction {
  id: string;
  type: TxType;
  asset: string;
  chain: ChainNetwork;
  amount: number;
  value: number;
  fee: number;
  time: string;
  status: TxStatus;
  txHash: string;
  from: string;
  to: string;
  block: number;
  note?: string;
  tags: string[];
}

interface KpiSnapshot {
  totalValue: number;
  totalValue24hChange: number;
  spotValue: number;
  perpValue: number;
  defiValue: number;
  nftValue: number;
  bridgeValue: number;
  unrealizedPnl: number;
  realizedPnl24h: number;
  totalFeesPaid: number;
  totalRewards: number;
  netDeposit: number;
  zsdPrice: number;
}

interface DrawerState {
  open: boolean;
  type: DrawerType;
  payload: string | null;
}

// ============== 工具 ==============

const CHAIN_LABELS: Record<ChainNetwork, string> = {
  'eth': 'Ethereum',
  'bsc': 'BNB Chain',
  'polygon': 'Polygon',
  'arbitrum': 'Arbitrum',
  'optimism': 'Optimism',
  'avalanche': 'Avalanche',
  'solana': 'Solana',
  'bitcoin': 'Bitcoin',
  'tron': 'Tron',
  'zs-chain': 'ZS-Chain',
};

const CHAIN_COLORS: Record<ChainNetwork, string> = {
  'eth': '#627EEA',
  'bsc': '#F3BA2F',
  'polygon': '#8247E5',
  'arbitrum': '#28A0F0',
  'optimism': '#FF0420',
  'avalanche': '#E84142',
  'solana': '#14F195',
  'bitcoin': '#F7931A',
  'tron': '#FF060A',
  'zs-chain': BRAND.primary,
};

const TX_TYPE_LABELS: Record<TxType, string> = {
  deposit: '充值', withdraw: '提现', trade: '交易', transfer: '转账',
  stake: '质押', unstake: '解质押', claim: '领奖',
  borrow: '借入', repay: '偿还', lend: '出借',
  mint: '铸造', burn: '销毁',
  bridge: '跨链', swap: '兑换',
};

const TX_STATUS_LABELS: Record<TxStatus, string> = {
  completed: '已完成', pending: '待确认', failed: '失败', confirmed: '已确认', processing: '处理中',
};

function formatCurrency(n: number): string {
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${((n) / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `$${((n) / 1e3).toFixed(2)}K`;
  return `$${n.toFixed(2)}`;
}

function formatBalance(n: number, decimals: number = 4): string {
  return n.toFixed(decimals);
}

function changeColor(c: number): string {
  if (c > 0) return BRAND.primary;
  if (c < 0) return '#FF5050';
  return BRAND.textMuted;
}

function shortenAddress(addr: string, head: number = 6, tail: number = 4): string {
  if (addr.length <= head + tail) return addr;
  return `${addr.slice(0, head)}...${addr.slice(-tail)}`;
}

function statusBadge(s: TxStatus): { bg: string; fg: string; label: string } {
  if (s === 'completed' || s === 'confirmed') return { bg: 'rgba(20,184,129,0.10)', fg: BRAND.primary, label: TX_STATUS_LABELS[s] };
  if (s === 'pending' || s === 'processing') return { bg: 'rgba(255,180,0,0.10)', fg: '#FFB400', label: TX_STATUS_LABELS[s] };
  if (s === 'failed') return { bg: 'rgba(255,80,80,0.10)', fg: '#FF5050', label: TX_STATUS_LABELS[s] };
  return { bg: 'rgba(176,176,176,0.10)', fg: BRAND.textMuted, label: TX_STATUS_LABELS[s] };
}

// ============== Mock 数据 ==============

const ASSETS: Asset[] = [
  { id: 'a-001', symbol: 'BTC', name: 'Bitcoin', chain: 'bitcoin', type: 'crypto', balance: 2.842, price: 67842.32, value: 192812.43, change24h: 2.84, allocation: 32.4, icon: '₿', decimals: 8 },
  { id: 'a-002', symbol: 'ETH', name: 'Ethereum', chain: 'eth', type: 'crypto', balance: 28.42, price: 3842.18, value: 109202.36, change24h: 1.42, allocation: 18.4, icon: 'Ξ', decimals: 18 },
  { id: 'a-003', symbol: 'SOL', name: 'Solana', chain: 'solana', type: 'crypto', balance: 824.0, price: 184.62, value: 152127.88, change24h: 4.24, allocation: 25.6, icon: '◎', decimals: 9 },
  { id: 'a-004', symbol: 'ZSD', name: 'ZSD Token', chain: 'zs-chain', type: 'crypto', balance: 84200.0, price: 1.0, value: 84200.0, change24h: 0.18, allocation: 14.2, icon: 'Z', decimals: 18 },
  { id: 'a-005', symbol: 'USDT', name: 'Tether', chain: 'eth', type: 'stable', balance: 28420.0, price: 1.0, value: 28420.0, change24h: -0.01, allocation: 4.8, icon: '₮', decimals: 6 },
  { id: 'a-006', symbol: 'USDC', name: 'USD Coin', chain: 'eth', type: 'stable', balance: 18420.0, price: 1.0, value: 18420.0, change24h: 0.0, allocation: 3.1, icon: '$', decimals: 6 },
  { id: 'a-007', symbol: 'WETH', name: 'Wrapped ETH', chain: 'eth', type: 'wrapped', balance: 4.82, price: 3842.18, value: 18519.31, change24h: 1.42, allocation: 3.1, icon: 'Ξ', decimals: 18, contract: '0xC02a...' },
  { id: 'a-008', symbol: 'stETH', name: 'Lido Staked ETH', chain: 'eth', type: 'wrapped', balance: 2.84, price: 3842.18, value: 10911.79, change24h: 1.42, allocation: 1.8, icon: 'Ξ', decimals: 18, apy: 3.4 },
  { id: 'a-009', symbol: 'BNB', name: 'BNB', chain: 'bsc', type: 'crypto', balance: 18.42, price: 612.42, value: 11280.78, change24h: 1.84, allocation: 1.9, icon: 'B', decimals: 18 },
  { id: 'a-010', symbol: 'AVAX', name: 'Avalanche', chain: 'avalanche', type: 'crypto', balance: 248.0, price: 38.42, value: 9528.16, change24h: -1.84, allocation: 1.6, icon: 'A', decimals: 18 },
  { id: 'a-011', symbol: 'MATIC', name: 'Polygon', chain: 'polygon', type: 'crypto', balance: 8420.0, price: 0.74, value: 6230.8, change24h: 2.18, allocation: 1.0, icon: 'M', decimals: 18 },
  { id: 'a-012', symbol: 'ARB', name: 'Arbitrum', chain: 'arbitrum', type: 'crypto', balance: 8420.0, price: 0.84, value: 7072.8, change24h: 4.84, allocation: 1.2, icon: 'A', decimals: 18 },
];

const POSITIONS: Position[] = [
  { id: 'p-001', symbol: 'BTC-PERP', type: 'long', size: 0.5, entryPrice: 65800, markPrice: 67842, leverage: 10, margin: 3290, pnl: 1021, pnlPct: 31.04, liquidationPrice: 59220, funding: -2.4, openedAt: '2026-07-12 10:18:42', chain: 'eth' },
  { id: 'p-002', symbol: 'ETH-PERP', type: 'long', size: 8, entryPrice: 3640, markPrice: 3842, leverage: 5, margin: 5824, pnl: 1616, pnlPct: 27.75, liquidationPrice: 2912, funding: 1.2, openedAt: '2026-07-15 14:42:08', chain: 'eth' },
  { id: 'p-003', symbol: 'SOL-PERP', type: 'short', size: 200, entryPrice: 192, markPrice: 184.62, leverage: 3, margin: 12800, pnl: 1476, pnlPct: 11.53, liquidationPrice: 256, funding: 0.8, openedAt: '2026-07-16 12:24:18', chain: 'solana' },
  { id: 'p-004', symbol: 'ZSD-PERP', type: 'long', size: 50000, entryPrice: 0.98, markPrice: 1.0, leverage: 5, margin: 9800, pnl: 1020, pnlPct: 10.41, liquidationPrice: 0.78, funding: 0.1, openedAt: '2026-07-18 08:18:42', chain: 'zs-chain' },
];

const LP_POSITIONS: LpPosition[] = [
  { id: 'lp-001', pool: 'ETH/USDC 0.05%', protocol: 'Uniswap V3', chain: 'eth', token0: 'ETH', token1: 'USDC', value: 84200, apr: 18.4, fees24h: 124, rewards: [{ symbol: 'UNI', amount: 12.4, value: 159.2 }], impermanentLoss: -2.4, age: 28, status: 'concentrated' },
  { id: 'lp-002', pool: 'ETH/stETH', protocol: 'Curve', chain: 'eth', token0: 'ETH', token1: 'stETH', value: 48000, apr: 4.2, fees24h: 18, rewards: [{ symbol: 'CRV', amount: 8.2, value: 3.4 }], impermanentLoss: 0.1, age: 84, status: 'stable' },
  { id: 'lp-003', pool: 'WBTC/ETH', protocol: 'Uniswap V3', chain: 'eth', token0: 'WBTC', token1: 'ETH', value: 38000, apr: 24.8, fees24h: 84, rewards: [{ symbol: 'UNI', amount: 4.8, value: 61.6 }], impermanentLoss: -1.8, age: 14, status: 'concentrated' },
  { id: 'lp-004', pool: 'ZSD/USDT', protocol: 'ZSDEX', chain: 'zs-chain', token0: 'ZSD', token1: 'USDT', value: 24000, apr: 8.4, fees24h: 12, rewards: [{ symbol: 'ZSD', amount: 24, value: 24 }], impermanentLoss: 0, age: 42, status: 'stable' },
];

const NFT_HOLDINGS: NftHolding[] = [
  { id: 'n-001', name: 'CryptoPunk #8420', collection: 'CryptoPunks', tokenId: '8420', chain: 'eth', estimatedValue: 32000, acquiredAt: '2025-12-18', rarity: 'legendary', lastSale: 32000, image: '👾', usedAsCollateral: true, loanId: 'loan-001' },
  { id: 'n-002', name: 'BAYC #1248', collection: 'BAYC', tokenId: '1248', chain: 'eth', estimatedValue: 14800, acquiredAt: '2025-08-22', rarity: 'rare', lastSale: 14800, image: '🐵', usedAsCollateral: false },
  { id: 'n-003', name: 'Doodle #2842', collection: 'Doodles', tokenId: '2842', chain: 'eth', estimatedValue: 1420, acquiredAt: '2026-01-15', rarity: 'rare', lastSale: 1420, image: '🎨', usedAsCollateral: false },
  { id: 'n-004', name: 'Azuki #842', collection: 'Azuki', tokenId: '842', chain: 'eth', estimatedValue: 4840, acquiredAt: '2026-03-08', rarity: 'epic', lastSale: 4840, image: '🌸', usedAsCollateral: false },
  { id: 'n-005', name: 'Pudgy Penguin #1824', collection: 'Pudgy Penguins', tokenId: '1824', chain: 'eth', estimatedValue: 6840, acquiredAt: '2026-04-12', rarity: 'epic', lastSale: 6840, image: '🐧', usedAsCollateral: false },
];

const BRIDGE_HOLDINGS: BridgeHolding[] = [
  { id: 'b-001', asset: 'ETH', chain: 'arbitrum', balance: 4.2, value: 16137.16, bridge: 'ZSDEX Bridge', bridgedAt: '2026-07-10 14:18:42', originalChain: 'eth', isCanonical: true },
  { id: 'b-002', asset: 'USDC', chain: 'polygon', balance: 8420, value: 8420, bridge: 'LayerZero', bridgedAt: '2026-07-08 10:24:08', originalChain: 'eth', isCanonical: false },
  { id: 'b-003', asset: 'ZSD', chain: 'bsc', balance: 24000, value: 24000, bridge: 'ZSDEX Bridge', bridgedAt: '2026-07-05 16:42:18', originalChain: 'zs-chain', isCanonical: true },
  { id: 'b-004', asset: 'USDT', chain: 'optimism', balance: 4200, value: 4200, bridge: 'Stargate', bridgedAt: '2026-07-12 12:18:42', originalChain: 'eth', isCanonical: false },
];

const HARDWARE_DEVICES: HardwareDevice[] = [
  { id: 'hw-001', brand: 'Ledger', model: 'Nano X Plus', firmware: 'v2.2.1', connected: true, pairedAt: '2025-06-12', addressCount: 28, chains: ['eth', 'bsc', 'polygon', 'arbitrum', 'optimism', 'avalanche', 'solana', 'bitcoin'], backupVerified: true, pinSet: true, passphrase: true, lastSync: '2026-07-19 14:18:42', status: 'active' },
  { id: 'hw-002', brand: 'Trezor', model: 'Safe 3', firmware: 'v1.4.0', connected: false, pairedAt: '2025-08-22', addressCount: 12, chains: ['eth', 'bsc', 'bitcoin', 'solana'], backupVerified: true, pinSet: true, passphrase: false, lastSync: '2026-07-18 22:42:18', status: 'idle' },
  { id: 'hw-003', brand: 'Keystone', model: 'Pro', firmware: 'v1.8.0', connected: false, pairedAt: '2026-02-08', addressCount: 8, chains: ['eth', 'bsc', 'polygon', 'arbitrum', 'bitcoin'], backupVerified: true, pinSet: true, passphrase: true, lastSync: '2026-07-15 18:42:18', status: 'disconnected' },
];

const TRANSACTIONS: Transaction[] = [
  { id: 't-001', type: 'deposit', asset: 'USDT', chain: 'eth', amount: 10000, value: 10000, fee: 2.4, time: '2026-07-19 14:18:42', status: 'completed', txHash: '0xabcd1234...ef5678', from: shortenAddress('0xExternalWallet0001'), to: '0xYourWallet...abcd', block: 18420000, tags: ['充值', 'ERC20'] },
  { id: 't-002', type: 'swap', asset: 'ETH → USDC', chain: 'eth', amount: 2.4, value: 9221, fee: 8.4, time: '2026-07-19 13:42:18', status: 'completed', txHash: '0x1234abcd...5678ef', from: '0xYourWallet...abcd', to: '0xUniswapV3...router', block: 18419842, tags: ['兑换', 'Uniswap'] },
  { id: 't-003', type: 'trade', asset: 'BTC-PERP', chain: 'eth', amount: 0.5, value: 33921, fee: 16.96, time: '2026-07-19 12:18:42', status: 'completed', txHash: '0xef5678ab...cd1234', from: '0xYourWallet...abcd', to: '0xPerpEngine...', block: 18419500, tags: ['永续', '开仓'] },
  { id: 't-004', type: 'bridge', asset: 'ETH', chain: 'arbitrum', amount: 4.2, value: 16137, fee: 1.4, time: '2026-07-19 10:42:08', status: 'pending', txHash: '0x5678efab...cd1234', from: '0xYourWallet...abcd', to: '0xArbBridge...', block: 18418800, tags: ['跨链', 'LayerZero'] },
  { id: 't-005', type: 'stake', asset: 'ZSD', chain: 'zs-chain', amount: 5000, value: 5000, fee: 0.04, time: '2026-07-19 08:18:42', status: 'completed', txHash: '0x9012abcd...3456ef', from: '0xYourWallet...abcd', to: '0xStakingHub...', block: 18418200, tags: ['质押'] },
  { id: 't-006', type: 'withdraw', asset: 'USDC', chain: 'eth', amount: 5000, value: 5000, fee: 4.2, time: '2026-07-18 22:18:32', status: 'completed', txHash: '0x3456efab...7890cd', from: '0xYourWallet...abcd', to: shortenAddress('0xExternalWallet0002'), block: 18417400, tags: ['提现', 'ERC20'] },
  { id: 't-007', type: 'claim', asset: 'UNI', chain: 'eth', amount: 12.4, value: 159.2, fee: 1.8, time: '2026-07-18 18:42:18', status: 'completed', txHash: '0x7890cdef...1234ab', from: '0xUniswapFarm...', to: '0xYourWallet...abcd', block: 18416800, tags: ['领奖'] },
  { id: 't-008', type: 'transfer', asset: 'ETH', chain: 'eth', amount: 0.5, value: 1921, fee: 1.2, time: '2026-07-18 14:24:18', status: 'completed', txHash: '0xcdef1234...5678ab', from: '0xYourWallet...abcd', to: shortenAddress('0xFriendWallet0001'), block: 18416000, tags: ['转账'] },
  { id: 't-009', type: 'swap', asset: 'USDC → SOL', chain: 'solana', amount: 18420, value: 18420, fee: 0.8, time: '2026-07-18 10:18:42', status: 'failed', txHash: '0x1234cdef...5678ab', from: '0xYourWallet...abcd', to: '0xJupiterRouter...', block: 0, tags: ['兑换', '滑点超限'] },
  { id: 't-010', type: 'lend', asset: 'USDT', chain: 'eth', amount: 10000, value: 10000, fee: 0, time: '2026-07-17 16:42:08', status: 'completed', txHash: '0x5678cdef...9012ab', from: '0xYourWallet...abcd', to: '0xAaveLendingPool...', block: 18415000, tags: ['出借', 'Aave'] },
];

// ============== 组件 ==============

export function PortalWallet() {
  const [tab, setTab] = useState<Tab>('overview');
  const [search, setSearch] = useState('');
  const [assetChainFilter, setAssetChainFilter] = useState<ChainNetwork | 'all'>('all');
  const [assetTypeFilter, setAssetTypeFilter] = useState<AssetType | 'all'>('all');
  const [positionSideFilter, setPositionSideFilter] = useState<'long' | 'short' | 'all'>('all');
  const [txTypeFilter, setTxTypeFilter] = useState<TxType | 'all'>('all');
  const [txChainFilter, setTxChainFilter] = useState<ChainNetwork | 'all'>('all');
  const [txStatusFilter, setTxStatusFilter] = useState<TxStatus | 'all'>('all');
  const [sortBy, setSortBy] = useState<'value' | 'balance' | 'change' | 'allocation'>('value');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [hideBalance, setHideBalance] = useState(false);
  const [drawer, setDrawer] = useState<DrawerState>({ open: false, type: null, payload: null });
  const [helpOpen, setHelpOpen] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');
  const [depositAsset, setDepositAsset] = useState('USDT');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawAddress, setWithdrawAddress] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [transferTo, setTransferTo] = useState('');
  const [transferAsset, setTransferAsset] = useState('ETH');
  searchRef = useRef<HTMLInputElement>(null);

  const [kpi, setKpi] = useState<KpiSnapshot>({
    totalValue: 594842,
    totalValue24hChange: 2.84,
    spotValue: 412842,
    perpValue: 48200,
    defiValue: 194200,
    nftValue: 59900,
    bridgeValue: 52757,
    unrealizedPnl: 4133,
    realizedPnl24h: 842,
    totalFeesPaid: 1842,
    totalRewards: 2480,
    netDeposit: 248000,
    zsdPrice: 1.0,
  });

  useEffect(() => {
    const id = setInterval(() => {
      setKpi((prev) => ({
        ...prev,
        totalValue: prev.totalValue + Math.floor(Math.random() * 800 - 200),
        spotValue: prev.spotValue + Math.floor(Math.random() * 600 - 200),
        unrealizedPnl: prev.unrealizedPnl + Math.floor(Math.random() * 200 - 80),
        totalRewards: prev.totalRewards + Math.floor(Math.random() * 8 - 2),
      }));
    }, 4200);
    return () => clearInterval(id);
  }, []);

  const filteredAssets = useMemo(() => {
    let result = ASSETS.filter((a) => {
      if (search) {
        const q = search.toLowerCase();
        if (!a.symbol.toLowerCase().includes(q) && !a.name.toLowerCase().includes(q)) return false;
      }
      if (assetChainFilter !== 'all' && a.chain !== assetChainFilter) return false;
      if (assetTypeFilter !== 'all' && a.type !== assetTypeFilter) return false;
      return true;
    });
    result = result.sort((a, b) => {
      let av = 0, bv = 0;
      if (sortBy === 'value') { av = a.value; bv = b.value; }
      else if (sortBy === 'balance') { av = a.balance; bv = b.balance; }
      else if (sortBy === 'change') { av = a.change24h; bv = b.change24h; }
      else if (sortBy === 'allocation') { av = a.allocation; bv = b.allocation; }
      return sortDir === 'asc' ? av - bv : bv - av;
    });
    return result;
  }, [search, assetChainFilter, assetTypeFilter, sortBy, sortDir]);

  const filteredPositions = useMemo(() => {
    return POSITIONS.filter((p) => {
      if (search) {
        const q = search.toLowerCase();
        if (!p.symbol.toLowerCase().includes(q)) return false;
      }
      if (positionSideFilter !== 'all' && p.type !== positionSideFilter) return false;
      return true;
    });
  }, [search, positionSideFilter]);

  const filteredTx = useMemo(() => {
    return TRANSACTIONS.filter((t) => {
      if (search) {
        const q = search.toLowerCase();
        if (!t.asset.toLowerCase().includes(q) && !t.txHash.toLowerCase().includes(q)) return false;
      }
      if (txTypeFilter !== 'all' && t.type !== txTypeFilter) return false;
      if (txChainFilter !== 'all' && t.chain !== txChainFilter) return false;
      if (txStatusFilter !== 'all' && t.status !== txStatusFilter) return false;
      return true;
    });
  }, [search, txTypeFilter, txChainFilter, txStatusFilter]);

  const openDrawer = useCallback((type: DrawerType, payload?: string) => {
    setDrawer({ open: true, type, payload: payload ?? null });
  }, []);

  const closeDrawer = useCallback(() => {
    setDrawer({ open: false, type: null, payload: null });
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') return;
      if (e.key === '/') { e.preventDefault(); searchRef.current?.focus(); }
      else if (e.key === 'Escape') {
        if (drawer.open) closeDrawer();
        else if (helpOpen) setHelpOpen(false);
      }
      else if (e.key === '?' || (e.shiftKey && e.key === '/')) { e.preventDefault(); setHelpOpen((v) => !v); }
      else if (e.key === '1') setTab('overview');
      else if (e.key === '2') setTab('spot');
      else if (e.key === '3') setTab('perp');
      else if (e.key === '4') setTab('defi');
      else if (e.key === '5') setTab('nft');
      else if (e.key === '6') setTab('bridge');
      else if (e.key === '7') setTab('hardware');
      else if (e.key === '8') setTab('history');
      else if (e.key === '9') setTab('help');
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [drawer.open, helpOpen, closeDrawer]);

  const renderKpi = useCallback((label: string, value: React.ReactNode, sub?: React.ReactNode, icon?: React.ReactNode) => {
    return (
      <div className="rounded-xl p-4 pw-stagger" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs" style={{ color: BRAND.textMuted }}>{label}</span>
          {icon && <span style={{ color: BRAND.primary }}>{icon}</span>}
        </div>
        <div className="text-xl font-semibold" style={{ color: BRAND.text }}>{hideBalance ? '****' : value}</div>
        {sub && <div className="text-[10px] mt-1" style={{ color: BRAND.textMuted }}>{sub}</div>}
      </div>
    );
  }, [hideBalance]);

  const submitDeposit = () => {
    if (!depositAmount || parseFloat(depositAmount) <= 0) {
      alert('请输入有效的充值数量');
      return;
    }
    alert(`已生成 ${depositAsset} 充值地址，请从您的外部钱包向此地址转账 ${depositAmount} ${depositAsset}`);
    setDepositAmount('');
  };

  const submitWithdraw = () => {
    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) {
      alert('请输入有效的提现数量');
      return;
    }
    if (!withdrawAddress) {
      alert('请输入提现地址');
      return;
    }
    alert(`提现申请已提交：${withdrawAmount} ${depositAsset} 至 ${withdrawAddress}`);
    setWithdrawAmount('');
    setWithdrawAddress('');
  };

  const submitTransfer = () => {
    if (!transferAmount || parseFloat(transferAmount) <= 0) {
      alert('请输入有效的转账数量');
      return;
    }
    if (!transferTo) {
      alert('请输入接收地址');
      return;
    }
    alert(`转账已提交：${transferAmount} ${transferAsset} 至 ${transferTo}`);
    setTransferAmount('');
    setTransferTo('');
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: BRAND.bg, color: BRAND.text }}>
      <style>{`
        @keyframes pw-fade-up { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pw-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.55; } }
        @keyframes pw-shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
        @keyframes pw-slide-in { from { transform: translateX(100%); } to { transform: translateX(0); } }
        @keyframes pw-bar { from { transform: scaleY(0); } to { transform: scaleY(1); } }
        @keyframes pw-float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
        .pw-stagger > * { animation: pw-fade-up 0.4s ease-out both; }
        .pw-stagger > *:nth-child(1) { animation-delay: 0.04s; }
        .pw-stagger > *:nth-child(2) { animation-delay: 0.08s; }
        .pw-stagger > *:nth-child(3) { animation-delay: 0.12s; }
        .pw-stagger > *:nth-child(4) { animation-delay: 0.16s; }
        .pw-stagger > *:nth-child(5) { animation-delay: 0.20s; }
        .pw-stagger > *:nth-child(6) { animation-delay: 0.24s; }
        .pw-stagger > *:nth-child(7) { animation-delay: 0.28s; }
        .pw-stagger > *:nth-child(8) { animation-delay: 0.32s; }
        .pw-pulse { animation: pw-pulse 2.4s ease-in-out infinite; }
        .pw-float { animation: pw-float 3s ease-in-out infinite; }
        .pw-shimmer { background: linear-gradient(90deg, transparent, rgba(20,184,129,0.15), transparent); background-size: 200% 100%; animation: pw-shimmer 2.4s linear infinite; }
        .pw-drawer { animation: pw-slide-in 0.28s ease-out; }
        .pw-bar { transform-origin: bottom; animation: pw-bar 0.6s ease-out; }
        .pw-row:hover { background-color: ${BRAND.cardHover}; }
      `}</style>

      {/* Hero */}
      <div className="px-6 py-10" style={{ background: `linear-gradient(180deg, ${BRAND.card} 0%, ${BRAND.bg} 100%)`, borderBottom: `1px solid ${BRAND.border}` }}>
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-2 mb-3">
            <Wallet size={28} style={{ color: BRAND.primary }} className="pw-float" />
            <h1 className="text-3xl font-bold" style={{ color: BRAND.text }}>钱包服务中心</h1>
            <span className="px-2 py-0.5 text-[10px] rounded-full" style={{ backgroundColor: 'rgba(20,184,129,0.12)', color: BRAND.primary, border: `1px solid ${BRAND.primary}40` }}>P3.33</span>
          </div>
          <p className="text-sm mb-4" style={{ color: BRAND.textMuted, maxWidth: 720 }}>
            中萨数字科技交易所钱包服务中心：钱包总览 / 现货钱包 / 合约钱包 / DeFi 钱包 / NFT 钱包 / 跨链钱包 / 硬件钱包 / 历史记录。
            与 P3.4 现货 + P3.25 做市 + P3.26 衍生品 + P3.27 量化 + P3.28 NFT + P3.29 DeFi + P3.30 跨链 + P3.31 节点 + P3.32 数据形成
            "用户-钱包-资产-链上"全场景闭环。明确"数字资产钱包与用户资产管理研究方向"定性，不构成对任何资产收益的合规承诺。
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] px-2 py-0.5 rounded" style={{ backgroundColor: 'rgba(20,184,129,0.08)', color: BRAND.primary, border: `1px solid ${BRAND.primary}30` }}>· 严格规避"承诺收益 / 保本 / 刚兑 / 稳赚 / 担保"等高风险词；不构成对任何资产收益的合规承诺</span>
          </div>
        </div>
      </div>

      {/* KPI */}
      <div className="px-6 py-6">
        <div className="max-w-7xl mx-auto">
          <div className="rounded-2xl p-5 mb-4" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm" style={{ color: BRAND.textMuted }}>总资产估值</span>
              <div className="flex items-center gap-2">
                <span className="text-[10px]" style={{ color: changeColor(kpi.totalValue24hChange) }}>{kpi.totalValue24hChange >= 0 ? '+' : ''}{kpi.totalValue24hChange.toFixed(2)}% (24h)</span>
                <button onClick={() => setHideBalance(!hideBalance)} className="p-1 rounded" style={{ color: BRAND.textMuted }}>
                  {hideBalance ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
            <div className="text-3xl font-bold" style={{ color: BRAND.text }}>{hideBalance ? '****' : formatCurrency(kpi.totalValue)}</div>
            <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mt-4">
              {renderKpi('现货', <>{formatCurrency(kpi.spotValue)}</>, <>{((kpi.spotValue / kpi.totalValue) * 100).toFixed(1)}%</>, <Coins size={14} />)}
              {renderKpi('合约', <>{formatCurrency(kpi.perpValue)}</>, <>{((kpi.perpValue / kpi.totalValue) * 100).toFixed(1)}%</>, <BarChart3 size={14} />)}
              {renderKpi('DeFi', <>{formatCurrency(kpi.defiValue)}</>, <>{((kpi.defiValue / kpi.totalValue) * 100).toFixed(1)}%</>, <Layers size={14} />)}
              {renderKpi('NFT', <>{formatCurrency(kpi.nftValue)}</>, <>{((kpi.nftValue / kpi.totalValue) * 100).toFixed(1)}%</>, <Hexagon size={14} />)}
              {renderKpi('跨链', <>{formatCurrency(kpi.bridgeValue)}</>, <>{((kpi.bridgeValue / kpi.totalValue) * 100).toFixed(1)}%</>, <ArrowLeftRight size={14} />)}
              {renderKpi('未实现盈亏', <>{formatCurrency(kpi.unrealizedPnl)}</>, <>24h 已实现 {formatCurrency(kpi.realizedPnl24h)}</>, <TrendingUp size={14} />)}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 mb-3">
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg flex-1 min-w-[240px]" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
              <Search size={14} style={{ color: BRAND.textMuted }} />
              <input ref={searchRef} value={search} onChange={(e) => setSearch(e.target.value)} placeholder="搜索资产 / 仓位 / 交易…" className="bg-transparent outline-none flex-1 text-sm" style={{ color: BRAND.text }} />
              {search && <button onClick={() => setSearch('')} className="p-0.5 rounded" style={{ color: BRAND.textMuted }}><X size={14} /></button>}
            </div>
            <button onClick={() => openDrawer('deposit')} className="px-3 py-2 rounded-lg text-sm flex items-center gap-1.5" style={{ backgroundColor: BRAND.primary, color: '#000' }}>
              <ArrowDownToLine size={14} /> 充值
            </button>
            <button onClick={() => openDrawer('withdraw')} className="px-3 py-2 rounded-lg text-sm flex items-center gap-1.5" style={{ backgroundColor: BRAND.card, color: BRAND.text, border: `1px solid ${BRAND.border}` }}>
              <ArrowUpToLine size={14} /> 提现
            </button>
            <button onClick={() => openDrawer('transfer')} className="px-3 py-2 rounded-lg text-sm flex items-center gap-1.5" style={{ backgroundColor: BRAND.card, color: BRAND.text, border: `1px solid ${BRAND.border}` }}>
              <Send size={14} /> 转账
            </button>
            <button onClick={() => setHelpOpen(true)} className="px-3 py-2 rounded-lg text-sm flex items-center gap-1.5" style={{ backgroundColor: BRAND.card, color: BRAND.text, border: `1px solid ${BRAND.border}` }}>
              <HelpCircle size={14} /> 帮助
            </button>
          </div>

          <div className="flex flex-wrap gap-1 mb-4">
            {[
              { k: 'overview' as Tab, l: '总览' },
              { k: 'spot' as Tab, l: `现货 (${ASSETS.length})` },
              { k: 'perp' as Tab, l: `合约 (${POSITIONS.length})` },
              { k: 'defi' as Tab, l: `DeFi (${LP_POSITIONS.length})` },
              { k: 'nft' as Tab, l: `NFT (${NFT_HOLDINGS.length})` },
              { k: 'bridge' as Tab, l: `跨链 (${BRIDGE_HOLDINGS.length})` },
              { k: 'hardware' as Tab, l: `硬件 (${HARDWARE_DEVICES.length})` },
              { k: 'history' as Tab, l: `历史 (${TRANSACTIONS.length})` },
              { k: 'help' as Tab, l: '帮助' },
            ].map((t) => (
              <button key={t.k} onClick={() => setTab(t.k)} className="px-3 py-1.5 rounded-lg text-xs font-medium" style={{ backgroundColor: tab === t.k ? BRAND.primary : BRAND.card, color: tab === t.k ? '#000' : BRAND.text, border: `1px solid ${tab === t.k ? BRAND.primary : BRAND.border}` }}>
                {t.l}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 pb-12">
        <div className="max-w-7xl mx-auto">
          {tab === 'overview' && (
            <div className="space-y-6 pw-stagger">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="rounded-xl p-5" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
                  <h3 className="text-base font-semibold mb-3" style={{ color: BRAND.text }}>资产配置</h3>
                  <div className="space-y-2">
                    {[
                      { l: 'BTC', v: 32.4, c: '#F7931A' },
                      { l: 'SOL', v: 25.6, c: '#14F195' },
                      { l: 'ETH', v: 18.4, c: '#627EEA' },
                      { l: 'ZSD', v: 14.2, c: BRAND.primary },
                      { l: '稳定币', v: 7.9, c: '#26A17B' },
                      { l: '其他', v: 1.5, c: BRAND.textMuted },
                    ].map((it) => (
                      <div key={it.l} className="flex items-center gap-2">
                        <span className="text-sm w-16" style={{ color: BRAND.text }}>{it.l}</span>
                        <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: BRAND.bg }}>
                          <div className="h-full pw-bar" style={{ width: `${(it.v / 40) * 100}%`, backgroundColor: it.c }} />
                        </div>
                        <span className="text-xs w-12 text-right" style={{ color: it.c }}>{it.v.toFixed(1)}%</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="rounded-xl p-5" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
                  <h3 className="text-base font-semibold mb-3" style={{ color: BRAND.text }}>链上分布</h3>
                  <div className="space-y-2">
                    {[
                      { l: 'Ethereum', v: 28.4, c: '#627EEA' },
                      { l: 'Solana', v: 25.6, c: '#14F195' },
                      { l: 'Bitcoin', v: 22.4, c: '#F7931A' },
                      { l: 'BSC', v: 11.2, c: '#F3BA2F' },
                      { l: 'Polygon', v: 4.8, c: '#8247E5' },
                      { l: '其他', v: 7.6, c: BRAND.textMuted },
                    ].map((it) => (
                      <div key={it.l} className="flex items-center gap-2">
                        <span className="text-sm w-20" style={{ color: BRAND.text }}>{it.l}</span>
                        <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: BRAND.bg }}>
                          <div className="h-full pw-bar" style={{ width: `${(it.v / 30) * 100}%`, backgroundColor: it.c }} />
                        </div>
                        <span className="text-xs w-10 text-right" style={{ color: it.c }}>{it.v.toFixed(1)}%</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="rounded-xl p-5" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
                  <h3 className="text-base font-semibold mb-3" style={{ color: BRAND.text }}>钱包分布</h3>
                  <div className="space-y-2">
                    {[
                      { l: '现货', v: kpi.spotValue, c: BRAND.primary },
                      { l: '合约', v: kpi.perpValue, c: '#FFB400' },
                      { l: 'DeFi', v: kpi.defiValue, c: '#627EEA' },
                      { l: 'NFT', v: kpi.nftValue, c: '#FF5050' },
                      { l: '跨链', v: kpi.bridgeValue, c: '#14F195' },
                    ].map((it) => (
                      <div key={it.l} className="flex items-center gap-2">
                        <span className="text-sm w-12" style={{ color: BRAND.text }}>{it.l}</span>
                        <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: BRAND.bg }}>
                          <div className="h-full pw-bar" style={{ width: `${(it.v / kpi.totalValue) * 100 * 2}%`, backgroundColor: it.c }} />
                        </div>
                        <span className="text-xs w-14 text-right" style={{ color: it.c }}>{formatCurrency(it.v)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="rounded-xl p-5" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-base font-semibold" style={{ color: BRAND.text }}>大额资产</h3>
                  <button onClick={() => setTab('spot')} className="text-xs flex items-center gap-1" style={{ color: BRAND.primary }}>查看全部 <ChevronRight size={14} /></button>
                </div>
                <div className="space-y-2">
                  {ASSETS.slice(0, 5).map((a) => (
                    <div key={a.id} className="flex items-center justify-between p-3 rounded-lg pw-row" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }} onClick={() => openDrawer('asset', a.id)}>
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{a.icon}</span>
                        <div>
                          <div className="text-sm font-medium" style={{ color: BRAND.text }}>{a.symbol}</div>
                          <div className="text-[10px]" style={{ color: BRAND.textMuted }}>{a.name} · {CHAIN_LABELS[a.chain]}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium" style={{ color: BRAND.text }}>{hideBalance ? '****' : formatCurrency(a.value)}</div>
                        <div className="text-[10px]" style={{ color: changeColor(a.change24h) }}>{a.change24h >= 0 ? '+' : ''}{a.change24h.toFixed(2)}%</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-xl p-5" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
                  <h3 className="text-base font-semibold mb-3" style={{ color: BRAND.text }}>活跃仓位</h3>
                  <div className="space-y-2">
                    {POSITIONS.slice(0, 3).map((p) => (
                      <div key={p.id} className="p-3 rounded-lg pw-row" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }} onClick={() => openDrawer('position', p.id)}>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium" style={{ color: BRAND.text }}>{p.symbol}</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: p.type === 'long' ? 'rgba(20,184,129,0.10)' : 'rgba(255,80,80,0.10)', color: p.type === 'long' ? BRAND.primary : '#FF5050', border: `1px solid ${p.type === 'long' ? BRAND.primary : '#FF5050'}40` }}>{p.type === 'long' ? '多' : '空'}</span>
                            <span className="text-[10px]" style={{ color: BRAND.textMuted }}>{p.leverage}x</span>
                          </div>
                          <span className="text-sm font-medium" style={{ color: changeColor(p.pnl) }}>{p.pnl >= 0 ? '+' : ''}{formatCurrency(p.pnl)} ({p.pnlPct.toFixed(2)}%)</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-[10px]">
                          <div><span style={{ color: BRAND.textMuted }}>开仓</span> <span style={{ color: BRAND.text }}>${p.entryPrice.toLocaleString()}</span></div>
                          <div><span style={{ color: BRAND.textMuted }}>现价</span> <span style={{ color: BRAND.text }}>${p.markPrice.toLocaleString()}</span></div>
                          <div><span style={{ color: BRAND.textMuted }}>强平</span> <span style={{ color: '#FF5050' }}>${p.liquidationPrice.toLocaleString()}</span></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="rounded-xl p-5" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
                  <h3 className="text-base font-semibold mb-3" style={{ color: BRAND.text }}>最近活动</h3>
                  <div className="space-y-2">
                    {TRANSACTIONS.slice(0, 5).map((t) => {
                      const sb = statusBadge(t.status);
                      return (
                        <div key={t.id} className="flex items-center justify-between p-2 rounded" style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}>
                          <div>
                            <div className="text-sm" style={{ color: BRAND.text }}>{TX_TYPE_LABELS[t.type]} {t.asset}</div>
                            <div className="text-[10px]" style={{ color: BRAND.textMuted }}>{t.time}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium" style={{ color: BRAND.text }}>{t.amount > 0 ? '+' : ''}{t.amount} {t.asset}</div>
                            <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: sb.bg, color: sb.fg, border: `1px solid ${sb.fg}40` }}>{sb.label}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {tab === 'spot' && (
            <div className="space-y-4">
              <div className="rounded-xl p-4" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  <select value={assetChainFilter} onChange={(e) => setAssetChainFilter(e.target.value as any)} className="px-2 py-1.5 rounded text-xs" style={{ backgroundColor: BRAND.bg, color: BRAND.text, border: `1px solid ${BRAND.border}` }}>
                    <option value="all">全部链</option>
                    {(Object.keys(CHAIN_LABELS) as ChainNetwork[]).map((c) => <option key={c} value={c}>{CHAIN_LABELS[c]}</option>)}
                  </select>
                  <select value={assetTypeFilter} onChange={(e) => setAssetTypeFilter(e.target.value as any)} className="px-2 py-1.5 rounded text-xs" style={{ backgroundColor: BRAND.bg, color: BRAND.text, border: `1px solid ${BRAND.border}` }}>
                    <option value="all">全部类型</option>
                    <option value="crypto">加密货币</option><option value="stable">稳定币</option>
                    <option value="wrapped">包装资产</option><option value="lp">LP 凭证</option>
                  </select>
                  <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)} className="px-2 py-1.5 rounded text-xs" style={{ backgroundColor: BRAND.bg, color: BRAND.text, border: `1px solid ${BRAND.border}` }}>
                    <option value="value">排序：价值</option>
                    <option value="balance">排序：余额</option>
                    <option value="change">排序：变化</option>
                    <option value="allocation">排序：占比</option>
                  </select>
                  <button onClick={() => setSortDir(sortDir === 'asc' ? 'desc' : 'asc')} className="px-2 py-1.5 rounded text-xs flex items-center justify-center gap-1" style={{ backgroundColor: BRAND.bg, color: BRAND.text, border: `1px solid ${BRAND.border}` }}>
                    {sortDir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />} {sortDir === 'asc' ? '升序' : '降序'}
                  </button>
                </div>
              </div>

              <div className="rounded-xl overflow-hidden" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr style={{ backgroundColor: BRAND.bg, borderBottom: `1px solid ${BRAND.border}` }}>
                        <th className="text-left px-3 py-2 text-xs" style={{ color: BRAND.textMuted }}>资产</th>
                        <th className="text-right px-3 py-2 text-xs" style={{ color: BRAND.textMuted }}>余额</th>
                        <th className="text-right px-3 py-2 text-xs" style={{ color: BRAND.textMuted }}>价格</th>
                        <th className="text-right px-3 py-2 text-xs" style={{ color: BRAND.textMuted }}>价值</th>
                        <th className="text-right px-3 py-2 text-xs" style={{ color: BRAND.textMuted }}>24h</th>
                        <th className="text-right px-3 py-2 text-xs" style={{ color: BRAND.textMuted }}>占比</th>
                        <th className="text-center px-3 py-2 text-xs" style={{ color: BRAND.textMuted }}>操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAssets.map((a) => (
                        <tr key={a.id} className="pw-row" style={{ borderBottom: `1px solid ${BRAND.border}` }} onClick={() => openDrawer('asset', a.id)}>
                          <td className="px-3 py-2">
                            <div className="flex items-center gap-2">
                              <span className="text-xl">{a.icon}</span>
                              <div>
                                <div className="text-sm font-medium" style={{ color: BRAND.text }}>{a.symbol}</div>
                                <div className="text-[10px]" style={{ color: BRAND.textMuted }}>{CHAIN_LABELS[a.chain]}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-2 text-right text-xs font-mono" style={{ color: BRAND.text }}>{hideBalance ? '****' : formatBalance(a.balance, a.decimals)}</td>
                          <td className="px-3 py-2 text-right text-xs" style={{ color: BRAND.text }}>${a.price.toLocaleString()}</td>
                          <td className="px-3 py-2 text-right text-xs font-medium" style={{ color: BRAND.text }}>{hideBalance ? '****' : formatCurrency(a.value)}</td>
                          <td className="px-3 py-2 text-right text-xs" style={{ color: changeColor(a.change24h) }}>{a.change24h >= 0 ? '+' : ''}{a.change24h.toFixed(2)}%</td>
                          <td className="px-3 py-2 text-right text-xs" style={{ color: BRAND.textMuted }}>{a.allocation.toFixed(1)}%</td>
                          <td className="px-3 py-2 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button onClick={(e) => { e.stopPropagation(); setDepositAsset(a.symbol); openDrawer('deposit', a.id); }} className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: BRAND.primary, color: '#000' }}>充</button>
                              <button onClick={(e) => { e.stopPropagation(); openDrawer('withdraw', a.id); }} className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: BRAND.bg, color: BRAND.text, border: `1px solid ${BRAND.border}` }}>提</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {tab === 'perp' && (
            <div className="space-y-4">
              <div className="rounded-xl p-4" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
                <select value={positionSideFilter} onChange={(e) => setPositionSideFilter(e.target.value as any)} className="px-2 py-1.5 rounded text-xs" style={{ backgroundColor: BRAND.bg, color: BRAND.text, border: `1px solid ${BRAND.border}` }}>
                  <option value="all">全部方向</option><option value="long">做多</option><option value="short">做空</option>
                </select>
              </div>

              <div className="space-y-2">
                {filteredPositions.map((p) => (
                  <div key={p.id} className="rounded-xl p-4 pw-row" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }} onClick={() => openDrawer('position', p.id)}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold" style={{ color: BRAND.text }}>{p.symbol}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: p.type === 'long' ? 'rgba(20,184,129,0.10)' : 'rgba(255,80,80,0.10)', color: p.type === 'long' ? BRAND.primary : '#FF5050', border: `1px solid ${p.type === 'long' ? BRAND.primary : '#FF5050'}40` }}>{p.type === 'long' ? '多' : '空'} {p.leverage}x</span>
                        <span className="text-[10px]" style={{ color: BRAND.textMuted }}>{CHAIN_LABELS[p.chain]}</span>
                      </div>
                      <span className="text-base font-semibold" style={{ color: changeColor(p.pnl) }}>{p.pnl >= 0 ? '+' : ''}{formatCurrency(p.pnl)} ({p.pnlPct >= 0 ? '+' : ''}{p.pnlPct.toFixed(2)}%)</span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-[11px]">
                      <div><span style={{ color: BRAND.textMuted }}>数量</span> <span style={{ color: BRAND.text }}>{p.size}</span></div>
                      <div><span style={{ color: BRAND.textMuted }}>开仓价</span> <span style={{ color: BRAND.text }}>${p.entryPrice.toLocaleString()}</span></div>
                      <div><span style={{ color: BRAND.textMuted }}>现价</span> <span style={{ color: BRAND.text }}>${p.markPrice.toLocaleString()}</span></div>
                      <div><span style={{ color: BRAND.textMuted }}>保证金</span> <span style={{ color: BRAND.text }}>${p.margin.toLocaleString()}</span></div>
                      <div><span style={{ color: BRAND.textMuted }}>强平价</span> <span style={{ color: '#FF5050' }}>${p.liquidationPrice.toLocaleString()}</span></div>
                    </div>
                    <div className="text-[10px] mt-1" style={{ color: BRAND.textMuted }}>开仓 {p.openedAt} · 资金费率 {p.funding >= 0 ? '+' : ''}{p.funding.toFixed(3)}%</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === 'defi' && (
            <div className="space-y-2">
              {LP_POSITIONS.map((lp) => (
                <div key={lp.id} className="rounded-xl p-4" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <div className="text-sm font-semibold" style={{ color: BRAND.text }}>{lp.pool}</div>
                      <div className="text-[10px]" style={{ color: BRAND.textMuted }}>{lp.protocol} · {CHAIN_LABELS[lp.chain]} · {lp.age} 天</div>
                    </div>
                    <div className="text-right">
                      <div className="text-base font-semibold" style={{ color: BRAND.text }}>{formatCurrency(lp.value)}</div>
                      <div className="text-[10px]" style={{ color: BRAND.primary }}>APR {lp.apr.toFixed(1)}%</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[11px]">
                    <div><span style={{ color: BRAND.textMuted }}>24h 手续费</span> <span style={{ color: BRAND.text }}>${lp.fees24h}</span></div>
                    <div><span style={{ color: BRAND.textMuted }}>奖励</span> <span style={{ color: BRAND.primary }}>{lp.rewards.map(r => `${r.amount} ${r.symbol}`).join(', ')}</span></div>
                    <div><span style={{ color: BRAND.textMuted }}>无常损失</span> <span style={{ color: lp.impermanentLoss < 0 ? '#FF5050' : BRAND.primary }}>{lp.impermanentLoss.toFixed(2)}%</span></div>
                    <div><span style={{ color: BRAND.textMuted }}>类型</span> <span style={{ color: BRAND.text }}>{lp.status === 'concentrated' ? '集中' : lp.status === 'stable' ? '稳定' : '活跃'}</span></div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === 'nft' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {NFT_HOLDINGS.map((n) => (
                <div key={n.id} className="rounded-xl p-4" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-3xl">{n.image}</span>
                    <div className="flex-1">
                      <div className="text-sm font-medium" style={{ color: BRAND.text }}>{n.name}</div>
                      <div className="text-[10px]" style={{ color: BRAND.textMuted }}>{n.collection} · {CHAIN_LABELS[n.chain]}</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div><span style={{ color: BRAND.textMuted }}>估值</span> <span style={{ color: BRAND.text }}>{formatCurrency(n.estimatedValue)}</span></div>
                    <div><span style={{ color: BRAND.textMuted }}>最近成交</span> <span style={{ color: BRAND.text }}>{formatCurrency(n.lastSale)}</span></div>
                    <div><span style={{ color: BRAND.textMuted }}>稀有度</span> <span style={{ color: BRAND.primary }}>{n.rarity}</span></div>
                    <div><span style={{ color: BRAND.textMuted }}>抵押</span> <span style={{ color: n.usedAsCollateral ? BRAND.primary : BRAND.textMuted }}>{n.usedAsCollateral ? '是' : '否'}</span></div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === 'bridge' && (
            <div className="space-y-2">
              {BRIDGE_HOLDINGS.map((b) => (
                <div key={b.id} className="rounded-xl p-4" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-base font-semibold" style={{ color: BRAND.text }}>{b.asset}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: CHAIN_COLORS[b.originalChain] + '20', color: CHAIN_COLORS[b.originalChain], border: `1px solid ${CHAIN_COLORS[b.originalChain]}40` }}>{CHAIN_LABELS[b.originalChain]}</span>
                      <ArrowRight size={12} style={{ color: BRAND.textMuted }} />
                      <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: CHAIN_COLORS[b.chain] + '20', color: CHAIN_COLORS[b.chain], border: `1px solid ${CHAIN_COLORS[b.chain]}40` }}>{CHAIN_LABELS[b.chain]}</span>
                      {b.isCanonical && <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: 'rgba(20,184,129,0.10)', color: BRAND.primary, border: `1px solid ${BRAND.primary}40` }}>原生</span>}
                    </div>
                    <div className="text-right">
                      <div className="text-base font-semibold" style={{ color: BRAND.text }}>{formatCurrency(b.value)}</div>
                      <div className="text-[10px]" style={{ color: BRAND.textMuted }}>{b.balance} {b.asset}</div>
                    </div>
                  </div>
                  <div className="text-[10px]" style={{ color: BRAND.textMuted }}>via {b.bridge} · 桥接于 {b.bridgedAt}</div>
                </div>
              ))}
            </div>
          )}

          {tab === 'hardware' && (
            <div className="space-y-2">
              {HARDWARE_DEVICES.map((hw) => {
                const statusLabels = { active: '活跃', idle: '空闲', disconnected: '已断开', locked: '已锁定' };
                const statusColors = { active: BRAND.primary, idle: '#FFB400', disconnected: BRAND.textMuted, locked: '#FF5050' };
                return (
                  <div key={hw.id} className="rounded-xl p-4" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <ShieldCheck size={18} style={{ color: BRAND.primary }} />
                        <div>
                          <div className="text-sm font-semibold" style={{ color: BRAND.text }}>{hw.brand} {hw.model}</div>
                          <div className="text-[10px]" style={{ color: BRAND.textMuted }}>固件 {hw.firmware} · 配对于 {hw.pairedAt}</div>
                        </div>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded" style={{ backgroundColor: statusColors[hw.status] + '20', color: statusColors[hw.status], border: `1px solid ${statusColors[hw.status]}40` }}>{statusLabels[hw.status]}</span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[11px]">
                      <div><span style={{ color: BRAND.textMuted }}>地址数</span> <span style={{ color: BRAND.text }}>{hw.addressCount}</span></div>
                      <div><span style={{ color: BRAND.textMuted }}>支持链</span> <span style={{ color: BRAND.text }}>{hw.chains.length}</span></div>
                      <div><span style={{ color: BRAND.textMuted }}>助记词</span> <span style={{ color: hw.backupVerified ? BRAND.primary : '#FFB400' }}>{hw.backupVerified ? '已验证' : '未验证'}</span></div>
                      <div><span style={{ color: BRAND.textMuted }}>Passphrase</span> <span style={{ color: hw.passphrase ? BRAND.primary : BRAND.textMuted }}>{hw.passphrase ? '已开启' : '未开启'}</span></div>
                    </div>
                    <div className="text-[10px] mt-1" style={{ color: BRAND.textMuted }}>最后同步：{hw.lastSync}</div>
                  </div>
                );
              })}
            </div>
          )}

          {tab === 'history' && (
            <div className="space-y-4">
              <div className="rounded-xl p-4" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  <select value={txTypeFilter} onChange={(e) => setTxTypeFilter(e.target.value as any)} className="px-2 py-1.5 rounded text-xs" style={{ backgroundColor: BRAND.bg, color: BRAND.text, border: `1px solid ${BRAND.border}` }}>
                    <option value="all">全部类型</option>
                    {(Object.keys(TX_TYPE_LABELS) as TxType[]).map((t) => <option key={t} value={t}>{TX_TYPE_LABELS[t]}</option>)}
                  </select>
                  <select value={txChainFilter} onChange={(e) => setTxChainFilter(e.target.value as any)} className="px-2 py-1.5 rounded text-xs" style={{ backgroundColor: BRAND.bg, color: BRAND.text, border: `1px solid ${BRAND.border}` }}>
                    <option value="all">全部链</option>
                    {(Object.keys(CHAIN_LABELS) as ChainNetwork[]).map((c) => <option key={c} value={c}>{CHAIN_LABELS[c]}</option>)}
                  </select>
                  <select value={txStatusFilter} onChange={(e) => setTxStatusFilter(e.target.value as any)} className="px-2 py-1.5 rounded text-xs" style={{ backgroundColor: BRAND.bg, color: BRAND.text, border: `1px solid ${BRAND.border}` }}>
                    <option value="all">全部状态</option>
                    {(Object.keys(TX_STATUS_LABELS) as TxStatus[]).map((s) => <option key={s} value={s}>{TX_STATUS_LABELS[s]}</option>)}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                {filteredTx.map((t) => {
                  const sb = statusBadge(t.status);
                  return (
                    <div key={t.id} className="rounded-xl p-4" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium" style={{ color: BRAND.text }}>{TX_TYPE_LABELS[t.type]} {t.asset}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: sb.bg, color: sb.fg, border: `1px solid ${sb.fg}40` }}>{sb.label}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: BRAND.bg, color: CHAIN_COLORS[t.chain], border: `1px solid ${CHAIN_COLORS[t.chain]}40` }}>{CHAIN_LABELS[t.chain]}</span>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-semibold" style={{ color: BRAND.text }}>{t.amount > 0 ? '+' : ''}{t.amount} {t.asset}</div>
                          <div className="text-[10px]" style={{ color: BRAND.textMuted }}>{formatCurrency(t.value)}</div>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[10px]">
                        <div><span style={{ color: BRAND.textMuted }}>时间</span> <span style={{ color: BRAND.text }}>{t.time}</span></div>
                        <div><span style={{ color: BRAND.textMuted }}>手续费</span> <span style={{ color: BRAND.text }}>${t.fee.toFixed(2)}</span></div>
                        <div><span style={{ color: BRAND.textMuted }}>区块</span> <span style={{ color: BRAND.text }}>#{t.block.toLocaleString()}</span></div>
                        <div className="truncate"><span style={{ color: BRAND.textMuted }}>Hash</span> <span style={{ color: BRAND.text }} className="font-mono">{shortenAddress(t.txHash, 8, 6)}</span></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {tab === 'help' && (
            <div className="rounded-xl p-5" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
              <h3 className="text-base font-semibold mb-3" style={{ color: BRAND.text }}>钱包服务说明</h3>
              <div className="space-y-3 text-sm" style={{ color: BRAND.textMuted }}>
                <div>
                  <div className="text-sm font-medium mb-1" style={{ color: BRAND.text }}>钱包类型</div>
                  <p>· 现货钱包：存放 BTC/ETH 等主流币 · 合约钱包：永续/期货仓位 · DeFi 钱包：流动性/质押/借贷 · NFT 钱包：数字藏品 · 跨链钱包：多链资产</p>
                </div>
                <div>
                  <div className="text-sm font-medium mb-1" style={{ color: BRAND.text }}>安全建议</div>
                  <p>· 启用 2FA 二次验证 · 大额资产使用硬件钱包 · 助记词离线备份 · 定期更换密码 · 警惕钓鱼网站</p>
                </div>
                <div>
                  <div className="text-sm font-medium mb-1" style={{ color: BRAND.text }}>充值 / 提现</div>
                  <p>· 充值：从外部钱包向本平台钱包地址转账 · 提现：从本平台提现到外部地址 · 跨链：使用跨链桥在不同链之间转移资产</p>
                </div>
                <div className="p-3 rounded-lg" style={{ backgroundColor: 'rgba(20,184,129,0.08)', border: `1px solid ${BRAND.primary}40` }}>
                  <div className="text-sm font-medium mb-1" style={{ color: BRAND.primary }}>合规说明</div>
                  <p className="text-[11px]">本平台钱包服务中心为"数字资产钱包与用户资产管理研究方向"演示页面，所有钱包 / 余额 / 交易 / 充值 / 提现数据均为 mock 占位。本平台不构成对任何资产收益的合规承诺。严格规避"承诺收益 / 保本 / 刚兑 / 稳赚 / 担保"等高风险表述。具体钱包使用请遵守所在司法管辖区的合规要求。</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Drawers */}
      {drawer.open && drawer.type === 'deposit' && (
        <div className="fixed inset-0 z-50 flex justify-end" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }} onClick={closeDrawer}>
          <div className="w-full max-w-md h-full overflow-y-auto pw-drawer" style={{ backgroundColor: BRAND.bg, borderLeft: `1px solid ${BRAND.border}` }} onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4" style={{ backgroundColor: BRAND.bg, borderBottom: `1px solid ${BRAND.border}` }}>
              <h3 className="text-base font-semibold" style={{ color: BRAND.text }}>充值 {depositAsset}</h3>
              <button onClick={closeDrawer} className="p-1.5 rounded" style={{ color: BRAND.textMuted }}><X size={18} /></button>
            </div>
            <div className="p-5 space-y-3">
              <div>
                <label className="text-xs" style={{ color: BRAND.textMuted }}>选择资产</label>
                <select value={depositAsset} onChange={(e) => setDepositAsset(e.target.value)} className="w-full px-3 py-2 rounded text-sm outline-none mt-1" style={{ backgroundColor: BRAND.card, color: BRAND.text, border: `1px solid ${BRAND.border}` }}>
                  {ASSETS.map((a) => <option key={a.id} value={a.symbol}>{a.symbol} - {a.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs" style={{ color: BRAND.textMuted }}>数量 (可选，仅作提示)</label>
                <input value={depositAmount} onChange={(e) => setDepositAmount(e.target.value)} placeholder="例：1000" className="w-full px-3 py-2 rounded text-sm outline-none mt-1" style={{ backgroundColor: BRAND.card, color: BRAND.text, border: `1px solid ${BRAND.border}` }} />
              </div>
              <div className="p-4 rounded-lg text-center" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
                <QrCode size={120} style={{ color: BRAND.text, margin: '0 auto' }} />
                <div className="text-[10px] mt-2 font-mono" style={{ color: BRAND.textMuted }}>0xYourWallet{drawer.payload ? drawer.payload.slice(-6) : '...'}abcd</div>
                <div className="text-[10px] mt-1" style={{ color: BRAND.textMuted }}>{CHAIN_LABELS[ASSETS.find(a => a.id === drawer.payload)?.chain || 'eth']}</div>
              </div>
              <button onClick={submitDeposit} className="w-full py-2.5 rounded-lg text-sm font-medium" style={{ backgroundColor: BRAND.primary, color: '#000' }}>确认充值</button>
              <div className="text-[10px] text-center" style={{ color: BRAND.textMuted }}>· 请从您的外部钱包向此地址转账；最小充值 0.001 ETH 等值；到账需 12-32 个区块确认</div>
            </div>
          </div>
        </div>
      )}

      {drawer.open && drawer.type === 'withdraw' && (
        <div className="fixed inset-0 z-50 flex justify-end" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }} onClick={closeDrawer}>
          <div className="w-full max-w-md h-full overflow-y-auto pw-drawer" style={{ backgroundColor: BRAND.bg, borderLeft: `1px solid ${BRAND.border}` }} onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4" style={{ backgroundColor: BRAND.bg, borderBottom: `1px solid ${BRAND.border}` }}>
              <h3 className="text-base font-semibold" style={{ color: BRAND.text }}>提现</h3>
              <button onClick={closeDrawer} className="p-1.5 rounded" style={{ color: BRAND.textMuted }}><X size={18} /></button>
            </div>
            <div className="p-5 space-y-3">
              <div>
                <label className="text-xs" style={{ color: BRAND.textMuted }}>选择资产</label>
                <select value={depositAsset} onChange={(e) => setDepositAsset(e.target.value)} className="w-full px-3 py-2 rounded text-sm outline-none mt-1" style={{ backgroundColor: BRAND.card, color: BRAND.text, border: `1px solid ${BRAND.border}` }}>
                  {ASSETS.map((a) => <option key={a.id} value={a.symbol}>{a.symbol} - {a.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs" style={{ color: BRAND.textMuted }}>提现数量</label>
                <input value={withdrawAmount} onChange={(e) => setWithdrawAmount(e.target.value)} placeholder="例：0.5" className="w-full px-3 py-2 rounded text-sm outline-none mt-1" style={{ backgroundColor: BRAND.card, color: BRAND.text, border: `1px solid ${BRAND.border}` }} />
              </div>
              <div>
                <label className="text-xs" style={{ color: BRAND.textMuted }}>提现地址</label>
                <input value={withdrawAddress} onChange={(e) => setWithdrawAddress(e.target.value)} placeholder="0x..." className="w-full px-3 py-2 rounded text-sm outline-none mt-1 font-mono" style={{ backgroundColor: BRAND.card, color: BRAND.text, border: `1px solid ${BRAND.border}` }} />
              </div>
              <div className="p-3 rounded-lg text-[10px]" style={{ backgroundColor: 'rgba(255,180,0,0.10)', border: `1px solid #FFB40040` }}>
                <div className="font-medium mb-1" style={{ color: '#FFB400' }}>安全提示</div>
                <div style={{ color: BRAND.textMuted }}>· 请确认地址正确性，提现到错误地址将无法找回 · 大额提现需 2FA 验证 · 手续费 0.0005 ETH 等值</div>
              </div>
              <button onClick={submitWithdraw} className="w-full py-2.5 rounded-lg text-sm font-medium" style={{ backgroundColor: BRAND.primary, color: '#000' }}>提交提现</button>
            </div>
          </div>
        </div>
      )}

      {drawer.open && drawer.type === 'transfer' && (
        <div className="fixed inset-0 z-50 flex justify-end" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }} onClick={closeDrawer}>
          <div className="w-full max-w-md h-full overflow-y-auto pw-drawer" style={{ backgroundColor: BRAND.bg, borderLeft: `1px solid ${BRAND.border}` }} onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4" style={{ backgroundColor: BRAND.bg, borderBottom: `1px solid ${BRAND.border}` }}>
              <h3 className="text-base font-semibold" style={{ color: BRAND.text }}>站内转账</h3>
              <button onClick={closeDrawer} className="p-1.5 rounded" style={{ color: BRAND.textMuted }}><X size={18} /></button>
            </div>
            <div className="p-5 space-y-3">
              <div>
                <label className="text-xs" style={{ color: BRAND.textMuted }}>选择资产</label>
                <select value={transferAsset} onChange={(e) => setTransferAsset(e.target.value)} className="w-full px-3 py-2 rounded text-sm outline-none mt-1" style={{ backgroundColor: BRAND.card, color: BRAND.text, border: `1px solid ${BRAND.border}` }}>
                  {ASSETS.map((a) => <option key={a.id} value={a.symbol}>{a.symbol}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs" style={{ color: BRAND.textMuted }}>转账数量</label>
                <input value={transferAmount} onChange={(e) => setTransferAmount(e.target.value)} placeholder="例：100" className="w-full px-3 py-2 rounded text-sm outline-none mt-1" style={{ backgroundColor: BRAND.card, color: BRAND.text, border: `1px solid ${BRAND.border}` }} />
              </div>
              <div>
                <label className="text-xs" style={{ color: BRAND.textMuted }}>接收地址（站内 UID 或邮箱）</label>
                <input value={transferTo} onChange={(e) => setTransferTo(e.target.value)} placeholder="user@example.com" className="w-full px-3 py-2 rounded text-sm outline-none mt-1" style={{ backgroundColor: BRAND.card, color: BRAND.text, border: `1px solid ${BRAND.border}` }} />
              </div>
              <div className="p-3 rounded-lg text-[10px]" style={{ backgroundColor: 'rgba(20,184,129,0.08)', border: `1px solid ${BRAND.primary}40` }}>
                <div className="font-medium" style={{ color: BRAND.primary }}>· 站内转账免手续费 · 实时到账</div>
              </div>
              <button onClick={submitTransfer} className="w-full py-2.5 rounded-lg text-sm font-medium" style={{ backgroundColor: BRAND.primary, color: '#000' }}>提交转账</button>
            </div>
          </div>
        </div>
      )}

      {helpOpen && <HelpDrawer onClose={() => setHelpOpen(false)} />}
    </div>
  );
}

function HelpDrawer({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex justify-end" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }} onClick={onClose}>
      <div className="w-full max-w-md h-full overflow-y-auto pw-drawer" style={{ backgroundColor: BRAND.bg, borderLeft: `1px solid ${BRAND.border}` }} onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4" style={{ backgroundColor: BRAND.bg, borderBottom: `1px solid ${BRAND.border}` }}>
          <h3 className="text-base font-semibold" style={{ color: BRAND.text }}>快捷键与帮助</h3>
          <button onClick={onClose} className="p-1.5 rounded" style={{ color: BRAND.textMuted }}><X size={18} /></button>
        </div>
        <div className="p-5 space-y-2">
          {[
            { k: '/', d: '聚焦搜索框' },
            { k: 'Esc', d: '关闭 Drawer / 弹窗' },
            { k: '?', d: '打开/关闭本页帮助' },
            { k: '1-9', d: '切换 Tab' },
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
