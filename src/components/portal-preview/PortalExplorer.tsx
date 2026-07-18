'use client';

/**
 * PortalExplorer - 区块链浏览器（2026-07-19 Q05 P3.11）
 *
 * 页面定位：
 * - 中萨数字科技交易所 TreeGraph (Conflux) 区块链浏览器
 * - 实时区块高度 / 全网算力 / 交易 / 地址查询
 * - 最新区块 / 实时交易 / 地址排行 / 合约榜 / 统计图表
 *
 * L4 工业级设计标准：
 * - 暗色 v6 纯黑 #000000 + 卡片 #141414 + ZSDEX 绿 primary #14B881
 * - 至少 5 个区块（Hero / KPI / 区块 / 交易 / 地址 / 合约 / 统计图）
 * - 至少 5 项交互（搜索 / 排序 / Tab / Drawer / 快捷键 / 翻页）
 * - 1+ Drawer（区块详情 / 交易详情 / 地址详情）
 * - 1+ 实时数据波动（区块高度 +1 / 算力漂移 / 实时交易流）
 * - 3+ 动画（Stagger / CountUp / Hover / 滚动流）
 *
 * 合规要点（Q05 硬约束）：
 * - 不接真实 API，区块/交易/地址使用 mock 占位
 * - 状态徽章统一使用 STATUS 枚举
 * - 不修改旧官网 / 旧 H5 / disabled pages
 * - 不使用高风险合规词（详见项目硬约束清单）
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
  Database,
  Activity,
  Cpu,
  Server,
  Hash,
  Layers,
  Box,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowLeftRight,
  Eye,
  Clock,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Zap,
  CircleDot,
  CircleDashed,
  CheckCircle2,
  AlertTriangle,
  Copy,
  ExternalLink,
  Sparkles,
  BarChart3,
  PieChart as PieIcon,
  Network,
  Coins,
  Users,
  Trophy,
  Star,
  Plus,
  Minus,
  Keyboard,
  HelpCircle,
  BookOpen,
  Building2,
  Code2,
} from 'lucide-react';
import { BRAND, STATUS } from './brand';

// ============== 类型 ==============

type Tab = 'blocks' | 'txs' | 'addresses' | 'contracts' | 'stats';
type SortKey = 'time' | 'height' | 'txCount' | 'balance' | 'txs';
type SortDir = 'asc' | 'desc';

interface Block {
  height: number;
  hash: string;
  miner: string;
  txCount: number;
  reward: number;
  age: number; // 秒
  size: number; // KB
  gasUsed: number;
  parentHash: string;
  timestamp: string;
  status: 'finalized' | 'confirmed' | 'pending';
}

interface Transaction {
  hash: string;
  from: string;
  to: string;
  amount: number;
  fee: number;
  age: number;
  method: string;
  status: 'success' | 'pending' | 'failed';
  block: number;
}

interface Address {
  rank: number;
  address: string;
  balance: number;
  txCount: number;
  percentage: number;
  label?: string;
  tag?: 'exchange' | 'contract' | 'whale' | 'team' | 'mine';
}

interface Contract {
  rank: number;
  name: string;
  address: string;
  type: 'ERC20' | 'ERC721' | 'ERC1155' | 'DeFi' | 'NFT' | 'GameFi';
  txs24h: number;
  holders: number;
  tvl?: number;
  verified: boolean;
}

// ============== Mock 数据 ==============

const generateBlocks = (count: number, baseHeight: number): Block[] => {
  const miners = [
    'cfx:aae...8v9p',
    'cfx:ar0...6x2e',
    'cfx:amg...1y0z',
    'cfx:bcd...3a7k',
    'cfx:ef0...9k4m',
    'cfx:cb4...2n5w',
  ];
  return Array.from({ length: count }, (_, i) => ({
    height: baseHeight - i,
    hash: `0x${(Math.random().toString(16).slice(2, 10) + Math.random().toString(16).slice(2, 10)).slice(0, 16)}...${(Math.random().toString(16).slice(2, 6))}`,
    miner: miners[i % miners.length],
    txCount: Math.floor(Math.random() * 200) + 5,
    reward: 2 + Math.random() * 1.5,
    age: i === 0 ? 0 : (i + 1) * 0.5 + Math.random() * 2,
    size: Math.floor(Math.random() * 80) + 20,
    gasUsed: Math.floor(Math.random() * 8000000) + 1000000,
    parentHash: `0x${(Math.random().toString(16).slice(2, 10) + Math.random().toString(16).slice(2, 10)).slice(0, 16)}`,
    timestamp: new Date(Date.now() - (i + 1) * 500).toISOString(),
    status: i === 0 ? 'pending' : i < 3 ? 'confirmed' : 'finalized',
  }));
};

const generateTxs = (count: number): Transaction[] => {
  const methods = ['transfer', 'approve', 'swap', 'stake', 'unstake', 'mint', 'burn', 'claim'];
  const labels: Record<string, string> = {
    transfer: '转账',
    approve: '授权',
    swap: '兑换',
    stake: '质押',
    unstake: '赎回',
    mint: '铸造',
    burn: '销毁',
    claim: '领取',
  };
  return Array.from({ length: count }, (_, i) => {
    const method = methods[i % methods.length];
    return {
      hash: `0x${(Math.random().toString(16).slice(2, 10) + Math.random().toString(16).slice(2, 10)).slice(0, 16)}...${(Math.random().toString(16).slice(2, 6))}`,
      from: `cfx:${(Math.random().toString(16).slice(2, 6))}...${(Math.random().toString(16).slice(2, 6))}`,
      to: `cfx:${(Math.random().toString(16).slice(2, 6))}...${(Math.random().toString(16).slice(2, 6))}`,
      amount: Math.random() * 1000,
      fee: Math.random() * 0.05,
      age: (i + 1) * 1.2 + Math.random() * 2,
      method,
      status: i % 23 === 0 ? 'failed' : i % 11 === 0 ? 'pending' : 'success',
      block: 192482105 - Math.floor(i / 8),
    };
  });
};

const ADDRESSES: Address[] = [
  { rank: 1, address: 'cfx:aar...9k4m', balance: 58234012.5, txCount: 458923, percentage: 8.42, label: 'ZSDEX Hot Wallet', tag: 'exchange' },
  { rank: 2, address: 'cfx:amd...3x7p', balance: 32456789.2, txCount: 234567, percentage: 4.69, tag: 'contract' },
  { rank: 3, address: 'cfx:bcd...1y0z', balance: 18234567.8, txCount: 123456, percentage: 2.63, label: 'TREEG Treasury', tag: 'team' },
  { rank: 4, address: 'cfx:ef0...5n8w', balance: 12456789.3, txCount: 89234, percentage: 1.80, tag: 'whale' },
  { rank: 5, address: 'cfx:cb4...2a6k', balance: 9876543.2, txCount: 67890, percentage: 1.43, tag: 'mine' },
  { rank: 6, address: 'cfx:dj7...8m2e', balance: 7890123.4, txCount: 56789, percentage: 1.14, label: 'Conflux Foundation', tag: 'team' },
  { rank: 7, address: 'cfx:fq3...1c5v', balance: 6789012.3, txCount: 45678, percentage: 0.98, tag: 'exchange' },
  { rank: 8, address: 'cfx:gmt...4w7x', balance: 5678901.2, txCount: 34567, percentage: 0.82, tag: 'whale' },
  { rank: 9, address: 'cfx:hq2...9k3m', balance: 4567890.1, txCount: 23456, percentage: 0.66, tag: 'whale' },
  { rank: 10, address: 'cfx:ikl...5n8w', balance: 3456789.0, txCount: 12345, percentage: 0.50, tag: 'exchange' },
];

const CONTRACTS: Contract[] = [
  { rank: 1, name: 'TREEG Token', address: 'cfx:abc...1234', type: 'ERC20', txs24h: 23456, holders: 125340, tvl: 12500000, verified: true },
  { rank: 2, name: 'TREEG-USDT LP', address: 'cfx:def...5678', type: 'DeFi', txs24h: 12345, holders: 89234, tvl: 8500000, verified: true },
  { rank: 3, name: 'TREEG NFT Marketplace', address: 'cfx:ghi...9012', type: 'NFT', txs24h: 5678, holders: 34567, tvl: 4200000, verified: true },
  { rank: 4, name: 'TreeGraph Staking', address: 'cfx:jkl...3456', type: 'DeFi', txs24h: 3456, holders: 23456, tvl: 3800000, verified: true },
  { rank: 5, name: 'CFX-USDC LP', address: 'cfx:mno...7890', type: 'DeFi', txs24h: 2345, holders: 12345, tvl: 2500000, verified: true },
  { rank: 6, name: 'Conflux Genesis NFT', address: 'cfx:pqr...1234', type: 'ERC721', txs24h: 1234, holders: 8901, tvl: 1800000, verified: true },
  { rank: 7, name: 'RWA Treasury V1', address: 'cfx:stu...5678', type: 'DeFi', txs24h: 567, holders: 4567, tvl: 1200000, verified: true },
  { rank: 8, name: 'GameFi Hero Cards', address: 'cfx:vwx...9012', type: 'GameFi', txs24h: 345, holders: 3456, tvl: 890000, verified: true },
];

// ============== 子组件 ==============

function KpiCard({
  icon: Icon,
  label,
  value,
  suffix,
  color,
  precision,
  isLive,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  suffix?: string;
  color: string;
  precision?: number;
  isLive?: boolean;
}) {
  return (
    <div
      className="rounded-2xl p-4 transition-all hover:scale-[1.02]"
      style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}
    >
      <div className="flex items-center justify-between mb-2">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: `${color}22`, color }}
        >
          <Icon className="w-4 h-4" />
        </div>
        {isLive && (
          <div className="flex items-center gap-1">
            <span
              className="w-1.5 h-1.5 rounded-full animate-pulse"
              style={{ backgroundColor: BRAND.success }}
            />
            <span className="text-[9px] font-mono" style={{ color: BRAND.success }}>
              LIVE
            </span>
          </div>
        )}
      </div>
      <div className="text-xl md:text-2xl font-bold font-mono leading-none" style={{ color }}>
        {precision ? value.toFixed(precision) : Math.round(value).toLocaleString()}
        {suffix}
      </div>
      <div className="text-[10px] mt-1.5" style={{ color: BRAND.textMute }}>
        {label}
      </div>
    </div>
  );
}

function BlockRow({ block, onClick }: { block: Block; onClick: () => void }) {
  const statusMap = {
    finalized: { color: BRAND.success, label: '已确认' },
    confirmed: { color: BRAND.warning, label: '确认中' },
    pending: { color: BRAND.primary, label: '打包中' },
  };
  const s = statusMap[block.status];
  return (
    <tr
      onClick={onClick}
      className="cursor-pointer transition-all hover:bg-opacity-50"
      style={{ borderBottom: `1px solid ${BRAND.borderLt}` }}
    >
      <td className="px-3 py-3">
        <div className="flex items-center gap-2">
          <span
            className="w-1.5 h-1.5 rounded-full shrink-0"
            style={{ backgroundColor: s.color }}
          />
          <span className="font-mono text-sm font-bold" style={{ color: BRAND.primary }}>
            {block.height.toLocaleString()}
          </span>
        </div>
        <div className="text-[10px] font-mono mt-0.5" style={{ color: BRAND.textMute }}>
          {block.age < 60 ? `${Math.round(block.age)} 秒前` : `${Math.round(block.age / 60)} 分钟前`}
        </div>
      </td>
      <td className="px-3 py-3">
        <div className="font-mono text-xs" style={{ color: BRAND.textSub }}>
          {block.hash}
        </div>
      </td>
      <td className="px-3 py-3">
        <div className="font-mono text-xs" style={{ color: BRAND.textMute }}>
          {block.miner}
        </div>
      </td>
      <td className="px-3 py-3 text-right">
        <span className="font-mono text-xs font-bold" style={{ color: BRAND.text }}>
          {block.txCount}
        </span>
        <span className="text-[10px] ml-1" style={{ color: BRAND.textMute }}>
          txns
        </span>
      </td>
      <td className="px-3 py-3 text-right">
        <span
          className="text-[9px] font-bold px-1.5 py-0.5 rounded uppercase"
          style={{ backgroundColor: `${s.color}22`, color: s.color }}
        >
          {s.label}
        </span>
      </td>
    </tr>
  );
}

function TxRow({ tx, onClick }: { tx: Transaction; onClick: () => void }) {
  const statusMap = {
    success: { color: BRAND.success, label: '成功', Icon: CheckCircle2 },
    pending: { color: BRAND.warning, label: '处理中', Icon: CircleDashed },
    failed: { color: BRAND.danger, label: '失败', Icon: AlertTriangle },
  };
  const s = statusMap[tx.status];
  const StatusIcon = s.Icon;
  const methodMap: Record<string, { color: string; label: string }> = {
    transfer: { color: BRAND.primary, label: '转账' },
    approve: { color: BRAND.info, label: '授权' },
    swap: { color: BRAND.success, label: '兑换' },
    stake: { color: BRAND.warning, label: '质押' },
    unstake: { color: BRAND.warning, label: '赎回' },
    mint: { color: BRAND.success, label: '铸造' },
    burn: { color: BRAND.danger, label: '销毁' },
    claim: { color: BRAND.primary, label: '领取' },
  };
  const m = methodMap[tx.method];
  return (
    <tr
      onClick={onClick}
      className="cursor-pointer transition-all hover:bg-opacity-50"
      style={{ borderBottom: `1px solid ${BRAND.borderLt}` }}
    >
      <td className="px-3 py-3">
        <div className="font-mono text-xs font-bold" style={{ color: BRAND.primary }}>
          {tx.hash}
        </div>
        <div className="text-[10px] font-mono mt-0.5" style={{ color: BRAND.textMute }}>
          {tx.age < 60 ? `${Math.round(tx.age)} 秒前` : `${Math.round(tx.age / 60)} 分钟前`}
        </div>
      </td>
      <td className="px-3 py-3">
        <span
          className="text-[9px] font-bold px-1.5 py-0.5 rounded uppercase"
          style={{ backgroundColor: `${m.color}22`, color: m.color }}
        >
          {m.label}
        </span>
      </td>
      <td className="px-3 py-3">
        <div className="font-mono text-[10px] truncate" style={{ color: BRAND.textSub }}>
          {tx.from} → {tx.to}
        </div>
      </td>
      <td className="px-3 py-3 text-right">
        <div className="font-mono text-xs font-bold" style={{ color: BRAND.text }}>
          {tx.amount.toFixed(2)} <span style={{ color: BRAND.textMute }}>CFX</span>
        </div>
        <div className="text-[10px] font-mono" style={{ color: BRAND.textMute }}>
          区块 #{tx.block.toLocaleString()}
        </div>
      </td>
      <td className="px-3 py-3 text-right">
        <span
          className="text-[9px] font-bold px-1.5 py-0.5 rounded uppercase inline-flex items-center gap-0.5"
          style={{ backgroundColor: `${s.color}22`, color: s.color }}
        >
          <StatusIcon className="w-2.5 h-2.5" />
          {s.label}
        </span>
      </td>
    </tr>
  );
}

function AddressRow({ addr, onClick }: { addr: Address; onClick: () => void }) {
  const tagMap: Record<NonNullable<Address['tag']>, { color: string; label: string; Icon: React.ElementType }> = {
    exchange: { color: BRAND.primary, label: '交易所', Icon: Building2 },
    contract: { color: BRAND.success, label: '合约', Icon: Code2 },
    whale: { color: BRAND.warning, label: '巨鲸', Icon: TrendingUp },
    team: { color: BRAND.info, label: '团队', Icon: Users },
    mine: { color: BRAND.textSub, label: '矿工', Icon: Server },
  };
  const t = addr.tag ? tagMap[addr.tag] : null;
  const TIcon = t ? t.Icon : null;
  return (
    <div
      onClick={onClick}
      className="rounded-xl p-3 flex items-center gap-3 cursor-pointer transition-all hover:scale-[1.005]"
      style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}
    >
      <div
        className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm shrink-0"
        style={{ backgroundColor: BRAND.bgAlt, color: BRAND.textSub }}
      >
        #{addr.rank}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-sm font-bold truncate" style={{ color: BRAND.text }}>
            {addr.label || `Address #${addr.rank}`}
          </span>
          {t && TIcon && (
            <span
              className="text-[9px] font-bold px-1.5 py-0.5 rounded uppercase flex items-center gap-1 shrink-0"
              style={{ backgroundColor: `${t.color}22`, color: t.color }}
            >
              <TIcon className="w-2.5 h-2.5" />
              {t.label}
            </span>
          )}
        </div>
        <div className="text-[10px] font-mono truncate" style={{ color: BRAND.textMute }}>
          {addr.address}
        </div>
      </div>
      <div className="text-right shrink-0">
        <div className="text-sm font-bold font-mono" style={{ color: BRAND.text }}>
          {(addr.balance / 1e6).toFixed(2)}M
        </div>
        <div className="text-[10px] font-mono" style={{ color: BRAND.textMute }}>
          {addr.percentage.toFixed(2)}% · {addr.txCount.toLocaleString()} tx
        </div>
      </div>
    </div>
  );
}

function ContractRow({ c, onClick }: { c: Contract; onClick: () => void }) {
  const typeColors: Record<Contract['type'], string> = {
    ERC20: BRAND.primary,
    ERC721: BRAND.warning,
    ERC1155: BRAND.info,
    DeFi: BRAND.success,
    NFT: BRAND.warning,
    GameFi: BRAND.danger,
  };
  return (
    <div
      onClick={onClick}
      className="rounded-xl p-3 flex items-center gap-3 cursor-pointer transition-all hover:scale-[1.005]"
      style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}
    >
      <div
        className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
        style={{ backgroundColor: `${typeColors[c.type]}22`, color: typeColors[c.type] }}
      >
        <Code2 className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-sm font-bold truncate" style={{ color: BRAND.text }}>
            {c.name}
          </span>
          <span
            className="text-[9px] font-bold px-1.5 py-0.5 rounded uppercase shrink-0"
            style={{ backgroundColor: `${typeColors[c.type]}22`, color: typeColors[c.type] }}
          >
            {c.type}
          </span>
          {c.verified && (
            <CheckCircle2 className="w-3 h-3 shrink-0" style={{ color: BRAND.success }} />
          )}
        </div>
        <div className="text-[10px] font-mono truncate" style={{ color: BRAND.textMute }}>
          {c.address}
        </div>
      </div>
      <div className="text-right shrink-0">
        <div className="text-sm font-bold font-mono" style={{ color: BRAND.text }}>
          {c.txs24h.toLocaleString()}
        </div>
        <div className="text-[10px] font-mono" style={{ color: BRAND.textMute }}>
          {c.holders.toLocaleString()} holders
        </div>
      </div>
    </div>
  );
}

// ============== 主组件 ==============

export function PortalExplorer() {
  // ----- 状态 -----
  const [blocks, setBlocks] = useState<Block[]>(generateBlocks(10, 192482105));
  const [txs, setTxs] = useState<Transaction[]>(generateTxs(12));
  const [activeTab, setActiveTab] = useState<Tab>('blocks');
  const [search, setSearch] = useState('');
  const [searchType, setSearchType] = useState<'auto' | 'block' | 'tx' | 'address'>('auto');
  const [sortKey, setSortKey] = useState<SortKey>('height');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [activeBlock, setActiveBlock] = useState<Block | null>(null);
  const [activeTx, setActiveTx] = useState<Transaction | null>(null);
  const [activeAddress, setActiveAddress] = useState<Address | null>(null);
  const [activeContract, setActiveContract] = useState<Contract | null>(null);
  const [helpOpen, setHelpOpen] = useState(false);
  const [tick, setTick] = useState(0);
  const [blockHeight, setBlockHeight] = useState(192482105);
  const [hashRate, setHashRate] = useState(12.45);
  const [addressCount, setAddressCount] = useState(42102845);
  const [blockTime, setBlockTime] = useState(0.5);
  const searchRef = useRef<HTMLInputElement | null>(null);

  // ----- 实时数据：区块高度自增 + 算力漂移 + 新交易 -----
  useEffect(() => {
    const id = setInterval(() => {
      setTick((t) => t + 1);
      // 区块高度自增（每 0.5s 一个新区块，模拟 Conflux 高速出块）
      setBlockHeight((h) => h + 1);
      setHashRate((r) => Math.max(10, Math.min(15, r + (Math.random() - 0.5) * 0.2)));
      setAddressCount((c) => c + Math.floor(Math.random() * 5));
      setBlockTime((t) => Math.max(0.3, Math.min(0.7, t + (Math.random() - 0.5) * 0.05)));
      // 顶部插入新区块
      setBlocks((prev) => {
        const newBlock: Block = {
          height: blockHeight + 1,
          hash: `0x${(Math.random().toString(16).slice(2, 10) + Math.random().toString(16).slice(2, 10)).slice(0, 16)}`,
          miner: prev[0]?.miner || 'cfx:aae...8v9p',
          txCount: Math.floor(Math.random() * 200) + 5,
          reward: 2 + Math.random() * 1.5,
          age: 0,
          size: Math.floor(Math.random() * 80) + 20,
          gasUsed: Math.floor(Math.random() * 8000000) + 1000000,
          parentHash: prev[0]?.hash || '0x0',
          timestamp: new Date().toISOString(),
          status: 'pending',
        };
        return [newBlock, ...prev.slice(0, 9).map((b) => ({ ...b, age: b.age + 0.5, status: b.status === 'pending' ? 'confirmed' : b.status }))];
      });
      // 插入新交易
      setTxs((prev) => {
        const newTxs = generateTxs(1);
        return [...newTxs, ...prev.slice(0, 11)].map((t, i) => ({ ...t, age: t.age + 0.5 }));
      });
    }, 3000);
    return () => clearInterval(id);
  }, [blockHeight]);

  // ----- 快捷键 -----
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target && (e.target as HTMLElement).tagName === 'INPUT') return;
      if (e.key === '/') {
        e.preventDefault();
        searchRef.current?.focus();
      } else if (e.key === 'Escape') {
        setActiveBlock(null);
        setActiveTx(null);
        setActiveAddress(null);
        setActiveContract(null);
        setHelpOpen(false);
      } else if (e.key === '?') {
        setHelpOpen((h) => !h);
      } else if (e.key === '1') setActiveTab('blocks');
      else if (e.key === '2') setActiveTab('txs');
      else if (e.key === '3') setActiveTab('addresses');
      else if (e.key === '4') setActiveTab('contracts');
      else if (e.key === '5') setActiveTab('stats');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // ----- 过滤排序 -----
  const sortedBlocks = useMemo(() => {
    const dir = sortDir === 'asc' ? 1 : -1;
    return [...blocks].sort((a, b) => {
      if (sortKey === 'height') return dir * (a.height - b.height);
      if (sortKey === 'time') return dir * a.age - b.age * dir;
      if (sortKey === 'txCount') return dir * (a.txCount - b.txCount);
      return 0;
    });
  }, [blocks, sortKey, sortDir]);

  // ----- 统计数据 -----
  const stats = useMemo(() => {
    const totalTxs = blocks.reduce((s, b) => s + b.txCount, 0);
    const avgBlockTime = 0.5;
    const totalFees = txs.reduce((s, t) => s + t.fee, 0);
    return { totalTxs, avgBlockTime, totalFees };
  }, [blocks, txs]);

  const networkHashrateSeries = useMemo(() => {
    return Array.from({ length: 24 }, (_, i) => ({
      hour: `${String(i).padStart(2, '0')}:00`,
      value: 10 + Math.random() * 5,
    }));
  }, [tick % 6 === 0 ? tick : 0]); // 每 18s 重生成

  const tabs: { key: Tab; label: string; icon: React.ElementType }[] = [
    { key: 'blocks', label: '区块', icon: Box },
    { key: 'txs', label: '交易', icon: ArrowLeftRight },
    { key: 'addresses', label: '地址', icon: Users },
    { key: 'contracts', label: '合约', icon: Code2 },
    { key: 'stats', label: '统计', icon: BarChart3 },
  ];

  return (
    <div className="min-h-screen" style={{ backgroundColor: BRAND.bg, color: BRAND.text }}>
      {/* ===== 1. Hero + 搜索 ===== */}
      <section
        className="relative overflow-hidden border-b"
        style={{ borderColor: BRAND.border, backgroundColor: BRAND.bg, minHeight: 320 }}
      >
        <div className="absolute inset-0" style={{ background: `radial-gradient(circle at 50% 50%, ${BRAND.primary}11 0%, transparent 70%)` }} />
        <div className="relative max-w-7xl mx-auto px-6 py-12">
          <div className="text-center space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full" style={{ backgroundColor: `${BRAND.primary}1A`, border: `1px solid ${BRAND.primary}33` }}>
              <Network className="w-3.5 h-3.5" style={{ color: BRAND.primary }} />
              <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: BRAND.primary }}>
                TreeGraph Explorer
              </span>
              <div className="flex items-center gap-1 ml-1">
                <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: BRAND.success }} />
                <span className="text-[9px] font-mono" style={{ color: BRAND.success }}>
                  MAINNET LIVE
                </span>
              </div>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold leading-tight" style={{ color: BRAND.text }}>
              TreeGraph 区块链浏览器
            </h1>
            <p className="text-sm max-w-xl mx-auto" style={{ color: BRAND.textMute }}>
              Conflux 树图公链主网实时数据 · 区块 / 交易 / 地址 / 合约全维度查询
            </p>
            <div className="max-w-2xl mx-auto pt-2">
              <div
                className="flex items-center rounded-xl p-1"
                style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}
              >
                <select
                  value={searchType}
                  onChange={(e) => setSearchType(e.target.value as typeof searchType)}
                  className="bg-transparent text-sm px-3 py-3 outline-none"
                  style={{ color: BRAND.text, borderRight: `1px solid ${BRAND.border}` }}
                >
                  <option value="auto">自动</option>
                  <option value="block">区块</option>
                  <option value="tx">交易</option>
                  <option value="address">地址</option>
                </select>
                <input
                  ref={searchRef}
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="搜索 地址 / 交易哈希 / 区块号 / 合约..."
                  className="flex-1 bg-transparent text-sm px-3 py-3 outline-none"
                  style={{ color: BRAND.text }}
                />
                <button
                  className="px-5 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-all hover:scale-105"
                  style={{ backgroundColor: BRAND.primary, color: '#000' }}
                >
                  <Search className="w-4 h-4" />
                  查询
                </button>
              </div>
            </div>
            <div className="flex items-center gap-2 justify-center text-[10px] font-mono" style={{ color: BRAND.textMute }}>
              <kbd className="px-2 py-0.5 rounded border" style={{ backgroundColor: BRAND.card, borderColor: BRAND.border }}>
                /
              </kbd>
              <span>搜索</span>
              <kbd className="px-2 py-0.5 rounded border ml-2" style={{ backgroundColor: BRAND.card, borderColor: BRAND.border }}>
                1-5
              </kbd>
              <span>切换 Tab</span>
              <kbd className="px-2 py-0.5 rounded border ml-2" style={{ backgroundColor: BRAND.card, borderColor: BRAND.border }}>
                ?
              </kbd>
              <span>帮助</span>
            </div>
          </div>
        </div>
      </section>

      {/* ===== 2. KPI 实时数据 ===== */}
      <section className="max-w-7xl mx-auto px-6 -mt-8 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <KpiCard icon={Layers} label="最新区块高度" value={blockHeight} color={BRAND.primary} isLive />
          <KpiCard icon={Cpu} label="全网算力" value={hashRate} suffix=" TH/s" color={BRAND.success} precision={2} isLive />
          <KpiCard icon={Users} label="总地址数" value={addressCount} color={BRAND.info} isLive />
          <KpiCard icon={Clock} label="平均出块时间" value={blockTime} suffix=" s" color={BRAND.warning} precision={2} isLive />
        </div>
      </section>

      {/* ===== 3. Tab 切换 + 主体内容 ===== */}
      <main className="max-w-7xl mx-auto px-6 py-8 space-y-4">
        <div
          className="rounded-2xl p-2 flex items-center gap-1 flex-wrap"
          style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}
        >
          {tabs.map((t) => {
            const Icon = t.icon;
            const active = activeTab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className="px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all"
                style={{
                  backgroundColor: active ? BRAND.primary : 'transparent',
                  color: active ? '#000' : BRAND.textMute,
                }}
              >
                <Icon className="w-4 h-4" />
                {t.label}
              </button>
            );
          })}
          <div className="ml-auto flex items-center gap-1 text-[10px] font-mono px-2" style={{ color: BRAND.textMute }}>
            <RefreshCw className="w-3 h-3 animate-spin" style={{ animationDuration: '3s' }} />
            <span>tick #{tick}</span>
          </div>
        </div>

        {/* 区块 Tab */}
        {activeTab === 'blocks' && (
          <div
            className="rounded-2xl overflow-hidden"
            style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}
          >
            <div className="px-4 py-3 flex items-center justify-between flex-wrap gap-2" style={{ borderBottom: `1px solid ${BRAND.border}` }}>
              <h3 className="text-sm font-bold" style={{ color: BRAND.text }}>
                最新区块
              </h3>
              <div className="flex items-center gap-1">
                {[
                  { key: 'height' as const, label: '高度' },
                  { key: 'time' as const, label: '时间' },
                  { key: 'txCount' as const, label: '交易数' },
                ].map((s) => {
                  const active = sortKey === s.key;
                  return (
                    <button
                      key={s.key}
                      onClick={() => {
                        if (sortKey === s.key) {
                          setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
                        } else {
                          setSortKey(s.key);
                          setSortDir('desc');
                        }
                      }}
                      className="text-[10px] px-2 py-1 rounded font-bold flex items-center gap-1 transition-all"
                      style={{
                        backgroundColor: active ? BRAND.primary : BRAND.bgAlt,
                        color: active ? '#000' : BRAND.textMute,
                        border: `1px solid ${active ? BRAND.primary : BRAND.border}`,
                      }}
                    >
                      {s.label}
                      {active && (sortDir === 'desc' ? <ChevronDown className="w-2.5 h-2.5" /> : <ChevronUp className="w-2.5 h-2.5" />)}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr style={{ backgroundColor: BRAND.bgAlt }}>
                    <th className="px-3 py-2 text-[10px] font-bold uppercase" style={{ color: BRAND.textMute }}>
                      高度 / 时间
                    </th>
                    <th className="px-3 py-2 text-[10px] font-bold uppercase" style={{ color: BRAND.textMute }}>
                      哈希
                    </th>
                    <th className="px-3 py-2 text-[10px] font-bold uppercase" style={{ color: BRAND.textMute }}>
                      矿工
                    </th>
                    <th className="px-3 py-2 text-[10px] font-bold uppercase text-right" style={{ color: BRAND.textMute }}>
                      交易数
                    </th>
                    <th className="px-3 py-2 text-[10px] font-bold uppercase text-right" style={{ color: BRAND.textMute }}>
                      状态
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sortedBlocks.map((b) => (
                    <BlockRow key={b.height} block={b} onClick={() => setActiveBlock(b)} />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 交易 Tab */}
        {activeTab === 'txs' && (
          <div
            className="rounded-2xl overflow-hidden"
            style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}
          >
            <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: `1px solid ${BRAND.border}` }}>
              <h3 className="text-sm font-bold" style={{ color: BRAND.text }}>
                实时交易
              </h3>
              <span className="text-[10px] font-mono" style={{ color: BRAND.textMute }}>
                共 {txs.length} 条 · 3s 自动刷新
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr style={{ backgroundColor: BRAND.bgAlt }}>
                    <th className="px-3 py-2 text-[10px] font-bold uppercase" style={{ color: BRAND.textMute }}>
                      哈希 / 时间
                    </th>
                    <th className="px-3 py-2 text-[10px] font-bold uppercase" style={{ color: BRAND.textMute }}>
                      类型
                    </th>
                    <th className="px-3 py-2 text-[10px] font-bold uppercase" style={{ color: BRAND.textMute }}>
                      From → To
                    </th>
                    <th className="px-3 py-2 text-[10px] font-bold uppercase text-right" style={{ color: BRAND.textMute }}>
                      金额 / 区块
                    </th>
                    <th className="px-3 py-2 text-[10px] font-bold uppercase text-right" style={{ color: BRAND.textMute }}>
                      状态
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {txs.map((t, idx) => (
                    <TxRow key={`${t.hash}-${idx}`} tx={t} onClick={() => setActiveTx(t)} />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 地址 Tab */}
        {activeTab === 'addresses' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
            {ADDRESSES.map((a) => (
              <AddressRow key={a.address} addr={a} onClick={() => setActiveAddress(a)} />
            ))}
          </div>
        )}

        {/* 合约 Tab */}
        {activeTab === 'contracts' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
            {CONTRACTS.map((c) => (
              <ContractRow key={c.address} c={c} onClick={() => setActiveContract(c)} />
            ))}
          </div>
        )}

        {/* 统计 Tab */}
        {activeTab === 'stats' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <div
              className="rounded-2xl p-4"
              style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}
            >
              <h3 className="text-sm font-bold mb-3 flex items-center gap-2" style={{ color: BRAND.text }}>
                <Cpu className="w-4 h-4" style={{ color: BRAND.primary }} />
                全网算力 (24h)
              </h3>
              <div className="space-y-1">
                {networkHashrateSeries.map((s, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-[9px] font-mono w-12" style={{ color: BRAND.textMute }}>
                      {s.hour}
                    </span>
                    <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ backgroundColor: BRAND.bgAlt }}>
                      <div
                        className="h-full transition-all"
                        style={{
                          width: `${((s.value - 10) / 5) * 100}%`,
                          backgroundColor: BRAND.primary,
                        }}
                      />
                    </div>
                    <span className="text-[9px] font-mono w-16 text-right" style={{ color: BRAND.textSub }}>
                      {s.value.toFixed(2)} TH/s
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div
              className="rounded-2xl p-4"
              style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}
            >
              <h3 className="text-sm font-bold mb-3 flex items-center gap-2" style={{ color: BRAND.text }}>
                <Activity className="w-4 h-4" style={{ color: BRAND.success }} />
                网络状态
              </h3>
              <div className="space-y-3">
                {[
                  { label: 'TPS (实时)', value: '3,245', color: BRAND.success },
                  { label: '活跃节点', value: '1,238', color: BRAND.primary },
                  { label: '出块成功率', value: '99.98%', color: BRAND.info },
                  { label: '平均 Gas', value: '0.00021 CFX', color: BRAND.warning },
                  { label: '智能合约', value: '12,456', color: BRAND.textSub },
                  { label: '今日交易', value: '124,567', color: BRAND.success },
                ].map((kpi, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-2 rounded-lg"
                    style={{ backgroundColor: BRAND.bgAlt }}
                  >
                    <span className="text-xs" style={{ color: BRAND.textMute }}>
                      {kpi.label}
                    </span>
                    <span className="text-sm font-bold font-mono" style={{ color: kpi.color }}>
                      {kpi.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ===== 区块详情 Drawer ===== */}
      {activeBlock && (
        <div
          className="fixed inset-0 z-50 flex justify-end"
          style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
          onClick={() => setActiveBlock(null)}
        >
          <div
            className="w-full max-w-2xl h-full overflow-y-auto"
            style={{ backgroundColor: BRAND.bg, borderLeft: `1px solid ${BRAND.border}` }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 z-10 backdrop-blur-md" style={{ backgroundColor: `${BRAND.bg}E6` }}>
              <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: BRAND.border }}>
                <div className="flex items-center gap-2">
                  <Box className="w-4 h-4" style={{ color: BRAND.primary }} />
                  <span className="text-sm font-bold font-mono" style={{ color: BRAND.text }}>
                    区块 #{activeBlock.height.toLocaleString()}
                  </span>
                </div>
                <button
                  onClick={() => setActiveBlock(null)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: BRAND.bgAlt, color: BRAND.textMute }}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-3">
              {[
                { label: '区块高度', value: activeBlock.height.toLocaleString(), mono: true },
                { label: '区块哈希', value: activeBlock.hash, mono: true },
                { label: '父区块', value: activeBlock.parentHash, mono: true },
                { label: '出块时间', value: activeBlock.timestamp, mono: true },
                { label: '矿工地址', value: activeBlock.miner, mono: true },
                { label: '交易数量', value: `${activeBlock.txCount} txns` },
                { label: '区块大小', value: `${activeBlock.size} KB` },
                { label: 'Gas 使用', value: activeBlock.gasUsed.toLocaleString(), mono: true },
                { label: '区块奖励', value: `${activeBlock.reward.toFixed(2)} CFX` },
              ].map((row, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3 rounded-xl"
                  style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}
                >
                  <span className="text-[10px] uppercase" style={{ color: BRAND.textMute }}>
                    {row.label}
                  </span>
                  <span
                    className={`text-sm font-bold ${row.mono ? 'font-mono' : ''}`}
                    style={{ color: BRAND.text }}
                  >
                    {row.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ===== 交易详情 Drawer ===== */}
      {activeTx && (
        <div
          className="fixed inset-0 z-50 flex justify-end"
          style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
          onClick={() => setActiveTx(null)}
        >
          <div
            className="w-full max-w-2xl h-full overflow-y-auto"
            style={{ backgroundColor: BRAND.bg, borderLeft: `1px solid ${BRAND.border}` }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 z-10 backdrop-blur-md" style={{ backgroundColor: `${BRAND.bg}E6` }}>
              <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: BRAND.border }}>
                <div className="flex items-center gap-2">
                  <ArrowLeftRight className="w-4 h-4" style={{ color: BRAND.primary }} />
                  <span className="text-sm font-bold" style={{ color: BRAND.text }}>
                    交易详情
                  </span>
                </div>
                <button
                  onClick={() => setActiveTx(null)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: BRAND.bgAlt, color: BRAND.textMute }}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-3">
              {[
                { label: '交易哈希', value: activeTx.hash, mono: true },
                { label: '状态', value: activeTx.status },
                { label: '所在区块', value: `#${activeTx.block.toLocaleString()}`, mono: true },
                { label: 'From', value: activeTx.from, mono: true },
                { label: 'To', value: activeTx.to, mono: true },
                { label: '金额', value: `${activeTx.amount.toFixed(4)} CFX` },
                { label: '手续费', value: `${activeTx.fee.toFixed(6)} CFX`, mono: true },
                { label: '方法', value: activeTx.method },
              ].map((row, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3 rounded-xl gap-3"
                  style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}
                >
                  <span className="text-[10px] uppercase shrink-0" style={{ color: BRAND.textMute }}>
                    {row.label}
                  </span>
                  <span
                    className={`text-sm font-bold truncate ${row.mono ? 'font-mono' : ''}`}
                    style={{ color: BRAND.text }}
                  >
                    {row.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ===== 地址详情 Drawer ===== */}
      {activeAddress && (
        <div
          className="fixed inset-0 z-50 flex justify-end"
          style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
          onClick={() => setActiveAddress(null)}
        >
          <div
            className="w-full max-w-2xl h-full overflow-y-auto"
            style={{ backgroundColor: BRAND.bg, borderLeft: `1px solid ${BRAND.border}` }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 z-10 backdrop-blur-md" style={{ backgroundColor: `${BRAND.bg}E6` }}>
              <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: BRAND.border }}>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4" style={{ color: BRAND.primary }} />
                  <span className="text-sm font-bold" style={{ color: BRAND.text }}>
                    地址详情
                  </span>
                </div>
                <button
                  onClick={() => setActiveAddress(null)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: BRAND.bgAlt, color: BRAND.textMute }}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-3">
              {[
                { label: '排名', value: `#${activeAddress.rank}` },
                { label: '地址', value: activeAddress.address, mono: true },
                { label: '标签', value: activeAddress.label || '—' },
                { label: '余额', value: `${activeAddress.balance.toLocaleString()} CFX` },
                { label: '占比', value: `${activeAddress.percentage.toFixed(2)}%` },
                { label: '交易总数', value: activeAddress.txCount.toLocaleString() },
                { label: '类型', value: activeAddress.tag || '—' },
              ].map((row, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3 rounded-xl gap-3"
                  style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}
                >
                  <span className="text-[10px] uppercase shrink-0" style={{ color: BRAND.textMute }}>
                    {row.label}
                  </span>
                  <span
                    className={`text-sm font-bold truncate ${row.mono ? 'font-mono' : ''}`}
                    style={{ color: BRAND.text }}
                  >
                    {row.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ===== 合约详情 Drawer ===== */}
      {activeContract && (
        <div
          className="fixed inset-0 z-50 flex justify-end"
          style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
          onClick={() => setActiveContract(null)}
        >
          <div
            className="w-full max-w-2xl h-full overflow-y-auto"
            style={{ backgroundColor: BRAND.bg, borderLeft: `1px solid ${BRAND.border}` }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 z-10 backdrop-blur-md" style={{ backgroundColor: `${BRAND.bg}E6` }}>
              <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: BRAND.border }}>
                <div className="flex items-center gap-2">
                  <Code2 className="w-4 h-4" style={{ color: BRAND.primary }} />
                  <span className="text-sm font-bold" style={{ color: BRAND.text }}>
                    {activeContract.name}
                  </span>
                </div>
                <button
                  onClick={() => setActiveContract(null)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: BRAND.bgAlt, color: BRAND.textMute }}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-3">
              {[
                { label: '合约名称', value: activeContract.name },
                { label: '合约地址', value: activeContract.address, mono: true },
                { label: '类型', value: activeContract.type },
                { label: '已验证', value: activeContract.verified ? '是' : '否' },
                { label: '24h 交易', value: activeContract.txs24h.toLocaleString() },
                { label: '持有人', value: activeContract.holders.toLocaleString() },
                { label: 'TVL', value: activeContract.tvl ? `$${(activeContract.tvl / 1e6).toFixed(2)}M` : '—' },
              ].map((row, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3 rounded-xl gap-3"
                  style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}
                >
                  <span className="text-[10px] uppercase shrink-0" style={{ color: BRAND.textMute }}>
                    {row.label}
                  </span>
                  <span
                    className={`text-sm font-bold truncate ${row.mono ? 'font-mono' : ''}`}
                    style={{ color: BRAND.text }}
                  >
                    {row.value}
                  </span>
                </div>
              ))}
              <button
                className="w-full py-2.5 rounded-lg text-sm font-bold transition-all hover:scale-105"
                style={{ backgroundColor: BRAND.primary, color: '#000' }}
              >
                查看完整合约代码
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== 快捷键帮助 Drawer ===== */}
      {helpOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}
          onClick={() => setHelpOpen(false)}
        >
          <div
            className="rounded-2xl p-6 max-w-md w-full mx-4"
            style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold flex items-center gap-2" style={{ color: BRAND.text }}>
                <Keyboard className="w-4 h-4" style={{ color: BRAND.primary }} />
                键盘快捷键
              </h2>
              <button
                onClick={() => setHelpOpen(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: BRAND.bgAlt, color: BRAND.textMute }}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-2 text-xs">
              {[
                { key: '/', desc: '聚焦搜索框' },
                { key: '1 / 2 / 3 / 4 / 5', desc: '切换 Tab（区块/交易/地址/合约/统计）' },
                { key: 'Esc', desc: '关闭弹层 / 抽屉' },
                { key: '?', desc: '打开 / 关闭快捷键帮助' },
              ].map((s) => (
                <div
                  key={s.key}
                  className="flex items-center justify-between p-2 rounded-lg"
                  style={{ backgroundColor: BRAND.card }}
                >
                  <span style={{ color: BRAND.textMute }}>{s.desc}</span>
                  <kbd
                    className="text-[10px] font-mono px-2 py-1 rounded border"
                    style={{ backgroundColor: BRAND.bgAlt, borderColor: BRAND.border, color: BRAND.text }}
                  >
                    {s.key}
                  </kbd>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ===== 底部说明 ===== */}
      <footer className="border-t" style={{ borderColor: BRAND.border, backgroundColor: BRAND.bg }}>
        <div className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between flex-wrap gap-3 text-[10px]" style={{ color: BRAND.textMute }}>
          <span>本页所有区块 / 交易 / 地址 / 合约数据均为 mock 占位示例，仅用于界面演示</span>
          <span className="font-mono">tick #{tick} · 高度 #{blockHeight.toLocaleString()} · 心跳运行中</span>
        </div>
      </footer>
    </div>
  );
}

export default PortalExplorer;
