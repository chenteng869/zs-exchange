'use client';
/**
 * H5 应用中心（发现页）v5
 *  - 顶部小标签：功能矩阵标题
 *  - 4×4=16 项主功能矩阵（原首页内容），AI 第 4 行带 AI 角标 + 发光
 *  - 11 大模块分块：核心交易 / IDO / NFT / DEX / OTC / 内容 / 钱包 / 资产 / 个人 / 牌照
 *  - DeFi / 游戏 / 商城已迁移到首页，本页不再包含
 *  - 浮动 Star 收藏按钮
 */
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  CircleDollarSign, TrendingUp, BarChart3, Wallet, ArrowLeftRight,
  Handshake, Rocket, ImageIcon, Newspaper,
  Brain, LineChart, Activity, Sparkles, Search, X, Star, Bookmark, ChevronRight,
  Trophy,
} from 'lucide-react';

// 4×4=16 主功能矩阵
const MATRIX = [
  // 第一行 · 交易
  { icon: CircleDollarSign, label: '现货',   color: '#38BDF8', bg: 'rgba(56, 189, 248, 0.15)',  href: '/h5/trade' },
  { icon: TrendingUp,       label: '合约',   color: '#A78BFA', bg: 'rgba(167, 139, 250, 0.15)', href: '/h5/trade?type=futures' },
  { icon: BarChart3,        label: '行情',   color: '#FCD535', bg: 'rgba(252, 213, 53, 0.15)',  href: '/h5/markets' },
  { icon: Wallet,           label: '钱包',   color: '#F0B90B', bg: 'rgba(240, 185, 11, 0.15)',  href: '/h5/wallet' },
  // 第二行 · 链上
  { icon: BarChart3,      label: '理财',   color: '#22D3EE', bg: 'rgba(34, 211, 238, 0.15)',  href: '/h5/assets?tab=earn' },
  { icon: ArrowLeftRight,   label: 'DEX',    color: '#06B6D4', bg: 'rgba(6, 182, 212, 0.15)',  href: '/h5/dex' },
  { icon: Handshake,        label: 'OTC',    color: '#34D399', bg: 'rgba(52, 211, 153, 0.15)',  href: '/h5/otc' },
  { icon: Rocket,           label: 'IDO',    color: '#FB923C', bg: 'rgba(251, 146, 60, 0.15)',  href: '/h5/ido' },
  // 第三行 · Web3 + 生活
  { icon: ImageIcon,        label: 'NFT',    color: '#C084FC', bg: 'rgba(192, 132, 252, 0.15)', href: '/h5/nft' },
  { icon: Rocket,           label: '直播',   color: '#F0B90B', bg: 'rgba(240, 185, 11, 0.15)',  href: '/h5/content/live' },
  { icon: Trophy,           label: '榜单',   color: '#FCD535', bg: 'rgba(252, 213, 53, 0.15)',  href: '/h5/markets?tab=rank' },
  { icon: Newspaper,        label: '资讯',   color: '#38BDF8', bg: 'rgba(56, 189, 248, 0.15)',  href: '/h5/content' },
  // 第四行 · AI 矩阵
  { icon: Brain,            label: 'AI 中心', color: '#A78BFA', bg: 'linear-gradient(135deg, rgba(167,139,250,0.25), rgba(244,114,182,0.15))', href: '/h5/ai',        glow: true },
  { icon: LineChart,        label: 'AI 量化', color: '#F0B90B', bg: 'linear-gradient(135deg, rgba(240,185,11,0.25), rgba(251,146,60,0.10))',  href: '/h5/ai/quant',  glow: true },
  { icon: Activity,         label: 'AI 情绪', color: '#F472B6', bg: 'linear-gradient(135deg, rgba(244,114,182,0.25), rgba(236,72,153,0.10))', href: '/h5/ai/sentiment', glow: true },
  { icon: Sparkles,         label: 'AI 投顾', color: '#22D3EE', bg: 'linear-gradient(135deg, rgba(34,211,238,0.25), rgba(56,189,248,0.10))',  href: '/h5/ai/advisor', glow: true },
];

interface Entry {
  icon: any;
  label: string;
  color: string;
  href: string;
  hot?: boolean;
  new?: boolean;
}

interface Module {
  id: string;
  name: string;
  emoji: string;
  color: string;
  desc: string;
  bgGrad: string;
  entries: Entry[];
}

const MODULES: Module[] = [
  {
    id: 'core',    name: '核心交易',  emoji: '💎', color: '#F0B90B', bgGrad: 'linear-gradient(135deg, rgba(240,185,11,0.18) 0%, rgba(252,213,53,0.05) 100%)',
    desc: '现货 / 永续 / 期权 / P2P',
    entries: [
      { icon: CircleDollarSign, label: '现货交易',    color: '#38BDF8', href: '/h5/trade', hot: true },
      { icon: TrendingUp,       label: '永续合约',    color: '#A78BFA', href: '/h5/trade?type=futures', hot: true },
      { icon: BarChart3,        label: '期权交易',    color: '#FCD535', href: '/h5/trade?type=options' },
      { icon: Handshake,        label: 'P2P 交易',    color: '#60A5FA', href: '/h5/trade?type=p2p' },
      { icon: BarChart3,        label: '行情图表',    color: '#34D399', href: '/h5/markets' },
      { icon: Newspaper,        label: '市场资讯',    color: '#38BDF8', href: '/h5/news' },
    ],
  },
  {
    id: 'ido',     name: 'IDO 发射台',  emoji: '🚀', color: '#D97706', bgGrad: 'linear-gradient(135deg, rgba(217,119,6,0.20) 0%, rgba(251,146,60,0.05) 100%)',
    desc: '新币认购 / 项目进度',
    entries: [
      { icon: Rocket, label: 'IDO 列表',   color: '#F0B90B', href: '/h5/ido', hot: true },
      { icon: Rocket, label: '项目详情',   color: '#F0B90B', href: '/h5/ido/detail/ID-001' },
      { icon: Rocket, label: '参与认购',   color: '#A78BFA', href: '/h5/ido/participate', new: true },
      { icon: Wallet, label: '我的认购',   color: '#34D399', href: '/h5/ido/my' },
      { icon: TrendingUp, label: '项目进度', color: '#F472B6', href: '/h5/ido/projects' },
    ],
  },
  {
    id: 'nft',     name: 'NFT 数字藏品', emoji: '🎨', color: '#A855F7', bgGrad: 'linear-gradient(135deg, rgba(168,85,247,0.18) 0%, rgba(192,132,252,0.05) 100%)',
    desc: '铸造 / 交易 / 活动',
    entries: [
      { icon: ImageIcon, label: 'NFT 首页',     color: '#A78BFA', href: '/h5/nft', hot: true },
      { icon: ImageIcon, label: 'NFT 市场',     color: '#A78BFA', href: '/h5/nft/market' },
      { icon: ImageIcon, label: 'NFT 详情',     color: '#A78BFA', href: '/h5/nft/detail/NC-001' },
      { icon: Sparkles,  label: 'Mint 铸造',    color: '#F472B6', href: '/h5/nft/mint', new: true },
      { icon: ImageIcon, label: '我的 NFT',     color: '#F0B90B', href: '/h5/nft/my' },
      { icon: TrendingUp,label: '活动记录',     color: '#38BDF8', href: '/h5/nft/activity' },
    ],
  },
  {
    id: 'dex',     name: 'DEX 去中心化', emoji: '🔄', color: '#06B6D4', bgGrad: 'linear-gradient(135deg, rgba(6,182,212,0.18) 0%, rgba(34,211,238,0.05) 100%)',
    desc: 'AMM 兑换 / 流动性',
    entries: [
      { icon: ArrowLeftRight, label: 'DEX 首页',  color: '#22D3EE', href: '/h5/dex' },
      { icon: ArrowLeftRight, label: 'Swap 兑换', color: '#22D3EE', href: '/h5/dex/trade', hot: true },
      { icon: BarChart3,      label: '流动性池',  color: '#38BDF8', href: '/h5/dex/pool/DP-001' },
      { icon: BarChart3,      label: '添加',     color: '#A78BFA', href: '/h5/dex/add' },
      { icon: BarChart3,      label: '移除',     color: '#F472B6', href: '/h5/dex/remove' },
      { icon: TrendingUp,     label: 'Yield 收益', color: '#F0B90B', href: '/h5/dex/yield' },
    ],
  },
  {
    id: 'otc',     name: 'OTC 法币交易', emoji: '🤝', color: '#10B981', bgGrad: 'linear-gradient(135deg, rgba(16,185,129,0.18) 0%, rgba(52,211,153,0.05) 100%)',
    desc: '担保 / 商家 / 订单',
    entries: [
      { icon: Handshake, label: 'OTC 首页',    color: '#34D399', href: '/h5/otc' },
      { icon: Handshake, label: 'OTC 市场',    color: '#34D399', href: '/h5/otc/market' },
      { icon: CircleDollarSign,label: '我要买币', color: '#34D399', href: '/h5/otc/buy' },
      { icon: CircleDollarSign,label: '我要卖币', color: '#F472B6', href: '/h5/otc/sell' },
      { icon: Newspaper, label: '我的订单',    color: '#A78BFA', href: '/h5/otc/orders' },
      { icon: Handshake, label: '商家详情',    color: '#FCD535', href: '/h5/otc/merchant/M-001' },
      { icon: Newspaper, label: '在线聊天',    color: '#38BDF8', href: '/h5/otc/chat', new: true },
    ],
  },
  {
    id: 'content', name: '内容中心',    emoji: '📰', color: '#3B82F6', bgGrad: 'linear-gradient(135deg, rgba(59,130,246,0.18) 0%, rgba(96,165,250,0.05) 100%)',
    desc: '资讯 / 视频 / 直播 / 播客',
    entries: [
      { icon: Newspaper, label: '内容首页',     color: '#38BDF8', href: '/h5/content', hot: true },
      { icon: Newspaper, label: '资讯 Feed',   color: '#38BDF8', href: '/h5/content/feed' },
      { icon: Newspaper, label: '文章详情',     color: '#38BDF8', href: '/h5/content/article/A-001' },
      { icon: Sparkles,  label: '短视频',       color: '#F472B6', href: '/h5/content/videos' },
      { icon: Sparkles,  label: '视频播放',     color: '#F472B6', href: '/h5/content/video/V-001' },
      { icon: Rocket,    label: '直播列表',     color: '#F0B90B', href: '/h5/content/live' },
      { icon: Rocket,    label: '直播观看',     color: '#F0B90B', href: '/h5/content/live/L-001' },
      { icon: Sparkles,  label: '播客列表',     color: '#A78BFA', href: '/h5/content/podcasts' },
      { icon: Sparkles,  label: '播客详情',     color: '#A78BFA', href: '/h5/content/podcast/P-001' },
      { icon: Handshake, label: '话题广场',     color: '#34D399', href: '/h5/content/topics' },
      { icon: Search,    label: '内容搜索',     color: '#22D3EE', href: '/h5/content/search' },
    ],
  },
  {
    id: 'wallet',   name: '钱包与资产',   emoji: '💰', color: '#F0B90B', bgGrad: 'linear-gradient(135deg, rgba(240,185,11,0.18) 0%, rgba(252,213,53,0.05) 100%)',
    desc: '充值 / 提现 / 划转',
    entries: [
      { icon: Wallet,       label: '钱包首页',   color: '#FCD535', href: '/h5/wallet' },
      { icon: ArrowLeftRight,label: '充值',     color: '#34D399', href: '/h5/wallet/deposit' },
      { icon: ArrowLeftRight,label: '提现',     color: '#F472B6', href: '/h5/wallet/withdraw' },
      { icon: ArrowLeftRight,label: '划转',     color: '#38BDF8', href: '/h5/wallet/transfer' },
      { icon: Newspaper,    label: '交易历史',   color: '#A78BFA', href: '/h5/wallet/history' },
      { icon: BarChart3,    label: '地址管理',   color: '#22D3EE', href: '/h5/wallet/address' },
      { icon: BarChart3,    label: '安全中心',   color: '#FCD535', href: '/h5/wallet/security' },
    ],
  },
  {
    id: 'assets',   name: '资产管理',     emoji: '💼', color: '#A78BFA', bgGrad: 'linear-gradient(135deg, rgba(167,139,250,0.18) 0%, rgba(139,92,246,0.05) 100%)',
    desc: '理财 / 跨链 / 持仓',
    entries: [
      { icon: Wallet,   label: '资产总览',   color: '#A78BFA', href: '/h5/assets' },
      { icon: BarChart3,label: '理财',      color: '#F472B6', href: '/h5/assets?tab=earn' },
      { icon: ArrowLeftRight,label:'跨链桥',  color: '#FB923C', href: '/h5/assets?tab=bridge' },
      { icon: Newspaper,label: '资产历史',   color: '#34D399', href: '/h5/assets/history' },
    ],
  },
  {
    id: 'profile',  name: '个人中心',     emoji: '👤', color: '#38BDF8', bgGrad: 'linear-gradient(135deg, rgba(56,189,248,0.18) 0%, rgba(125,211,252,0.05) 100%)',
    desc: 'KYC / 邀请 / 设置',
    entries: [
      { icon: Handshake,  label: '我的',       color: '#38BDF8', href: '/h5/profile' },
      { icon: Handshake,  label: '编辑资料',   color: '#38BDF8', href: '/h5/profile/edit' },
      { icon: Wallet,     label: '银行卡',     color: '#FCD535', href: '/h5/profile/bank' },
      { icon: BarChart3,  label: 'KYC 认证',   color: '#34D399', href: '/h5/profile/kyc' },
      { icon: Newspaper,  label: '通知',       color: '#A78BFA', href: '/h5/profile/notifications' },
      { icon: BarChart3,  label: '设置',       color: '#7B89B8', href: '/h5/profile/settings' },
      { icon: BarChart3,  label: '安全',       color: '#F0B90B', href: '/h5/profile/security' },
      { icon: Sparkles,   label: '邀请好友',   color: '#4ADE80', href: '/h5/profile?tab=invite' },
      { icon: CircleDollarSign,label:'我的佣金',color: '#FCD535', href: '/h5/profile/commission' },
      { icon: Newspaper,  label: '帮助中心',   color: '#22D3EE', href: '/h5/profile/help' },
      { icon: Trophy,     label: '关于',       color: '#A78BFA', href: '/h5/profile/about' },
      { icon: Newspaper,  label: '服务条款',   color: '#7B89B8', href: '/h5/profile/terms' },
    ],
  },
  {
    id: 'licenses', name: '牌照与信任',   emoji: '🛡️', color: '#10B981', bgGrad: 'linear-gradient(135deg, rgba(16,185,129,0.18) 0%, rgba(52,211,153,0.05) 100%)',
    desc: '监管牌照 / 审计报告',
    entries: [
      { icon: BarChart3, label: '牌照首页',   color: '#34D399', href: '/h5/licenses' },
      { icon: Trophy,    label: '资质证书',   color: '#F0B90B', href: '/h5/licenses/certificates' },
      { icon: Newspaper, label: '审计报告',   color: '#A78BFA', href: '/h5/licenses/audits' },
      { icon: BarChart3, label: '关于我们',   color: '#38BDF8', href: '/h5/licenses/about' },
    ],
  },
];

export default function H5DiscoverPage() {
  const [search, setSearch] = useState('');
  const [fav, setFav] = useState<string[]>([]);

  useEffect(() => {
    try {
      const f = localStorage.getItem('h5_fav');
      if (f) setFav(JSON.parse(f));
    } catch {}
  }, []);

  const toggleFav = (href: string) => {
    setFav((arr) => {
      const next = arr.includes(href) ? arr.filter((x) => x !== href) : [...arr, href];
      try { localStorage.setItem('h5_fav', JSON.stringify(next)); } catch {}
      return next;
    });
  };

  // 搜索过滤 14 大模块
  const filtered = useMemo(() => {
    if (!search) return MODULES;
    return MODULES
      .map((m) => ({
        ...m,
        entries: m.entries.filter(
          (e) => e.label.includes(search) || e.href.toLowerCase().includes(search.toLowerCase())
        ),
      }))
      .filter((m) => m.entries.length > 0);
  }, [search]);

  // 主功能矩阵搜索
  const filteredMatrix = useMemo(() => {
    if (!search) return MATRIX;
    return MATRIX.filter(
      (e) => e.label.includes(search) || e.href.toLowerCase().includes(search.toLowerCase())
    );
  }, [search]);

  return (
    <div style={{ padding: '12px', paddingBottom: 80 }}>
      {/* ===== 顶部搜索 ===== */}
      <div
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: 'linear-gradient(135deg, rgba(26, 36, 86, 0.55) 0%, rgba(21, 34, 74, 0.70) 100%)',
          border: '1px solid rgba(148, 163, 184, 0.20)',
          borderRadius: 14, padding: '10px 12px', marginBottom: 14,
        }}
      >
        <Search size={14} color="#FCD535" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="搜索 14 大模块 / 110+ 功能..."
          style={{ flex: 1, background: 'transparent', border: 'none', color: '#fff', fontSize: 13, outline: 'none' }}
        />
        {search && (
          <button onClick={() => setSearch('')} style={{ background: 'transparent', border: 'none', color: '#FDE68A', fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 2 }}>
            <X size={12} /> 清空
          </button>
        )}
      </div>

      {/* ===== 4×4=16 主功能矩阵 ===== */}
      {filteredMatrix.length > 0 && (
        <div style={{ marginBottom: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10, padding: '0 2px' }}>
            <Bookmark size={14} color="#F0B90B" />
            <span style={{ fontSize: 13, color: '#F8FAFC', fontWeight: 700 }}>功能矩阵</span>
            <span style={{ marginLeft: 'auto', fontSize: 10, color: '#7B89B8' }}>16 项主入口 · AI 优先</span>
          </div>
          <div
            style={{
              display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10,
              background: 'linear-gradient(180deg, rgba(26, 36, 86, 0.40) 0%, rgba(21, 34, 74, 0.50) 100%)',
              border: '1px solid rgba(148, 163, 184, 0.10)', borderRadius: 16, padding: 14,
            }}
          >
            {filteredMatrix.map((entry: any) => {
              const Icon = entry.icon;
              return (
                <Link
                  key={entry.label}
                  href={entry.href}
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                    padding: '6px 0', textDecoration: 'none',
                  }}
                >
                  <div
                    style={{
                      position: 'relative',
                      width: 40, height: 40, borderRadius: 11,
                      background: entry.bg,
                      border: `1px solid ${entry.color}40`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: entry.glow ? `0 0 14px ${entry.color}50` : `0 0 12px ${entry.color}18`,
                    }}
                  >
                    <Icon size={20} color={entry.color} strokeWidth={2} />
                    {entry.glow && (
                      <span style={{
                        position: 'absolute', top: -3, right: -3,
                        fontSize: 8, padding: '1px 4px', borderRadius: 4,
                        background: 'linear-gradient(135deg, #F472B6, #A78BFA)',
                        color: '#fff', fontWeight: 800, letterSpacing: 0.3,
                        boxShadow: '0 2px 6px rgba(167,139,250,0.5)',
                      }}>
                        AI
                      </span>
                    )}
                  </div>
                  <span style={{ fontSize: 11, color: entry.glow ? '#F8FAFC' : '#B4C0E0', fontWeight: entry.glow ? 700 : 500 }}>
                    {entry.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* ===== 14 大模块分块 ===== */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10, padding: '0 2px' }}>
        <Bookmark size={14} color="#A78BFA" />
        <span style={{ fontSize: 13, color: '#F8FAFC', fontWeight: 700 }}>全部功能</span>
        <span style={{ marginLeft: 'auto', fontSize: 10, color: '#7B89B8' }}>13 大模块 · 点击进入 · 双击可收藏</span>
      </div>

      {filtered.length === 0 && filteredMatrix.length === 0 ? (
        <div style={{
          background: 'linear-gradient(180deg, rgba(26, 36, 86, 0.55) 0%, rgba(21, 34, 74, 0.70) 100%)',
          borderRadius: 14, padding: '40px 20px', textAlign: 'center',
        }}>
          <Search size={36} color="#7B89B8" style={{ margin: '0 auto 10px' }} />
          <div style={{ fontSize: 13, color: '#C9D1E2' }}>未找到 &quot;{search}&quot; 相关功能</div>
          <button onClick={() => setSearch('')} style={{
            marginTop: 12, background: 'rgba(240, 185, 11, 0.15)',
            border: '1px solid rgba(240, 185, 11, 0.30)', color: '#FCD535',
            fontSize: 11, padding: '6px 14px', borderRadius: 10, cursor: 'pointer',
          }}>
            清除搜索
          </button>
        </div>
      ) : (
        filtered.map((m) => (
          <div
            key={m.id}
            style={{
              marginBottom: 12,
              background: m.bgGrad,
              border: '1px solid rgba(148, 163, 184, 0.12)',
              borderRadius: 16, padding: 14,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 11,
                background: `${m.color}25`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 18, boxShadow: `0 0 12px ${m.color}30`,
              }}>
                {m.emoji}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, color: '#F8FAFC', fontWeight: 700 }}>{m.name}</div>
                <div style={{ fontSize: 10, color: '#7B89B8' }}>{m.desc}</div>
              </div>
              <span style={{
                fontSize: 10, padding: '3px 7px', borderRadius: 8,
                background: `${m.color}25`, color: m.color, fontWeight: 700,
              }}>
                {m.entries.length} 项
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
              {m.entries.map((e, i) => {
                const Icon = e.icon;
                const isFav = fav.includes(e.href);
                return (
                  <div
                    key={`${m.id}-${i}`}
                    onClick={() => { window.location.href = e.href; }}
                    onDoubleClick={() => toggleFav(e.href)}
                    style={{
                      position: 'relative',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                      padding: '8px 2px', borderRadius: 10, cursor: 'pointer',
                      background: isFav ? `${e.color}18` : 'rgba(255,255,255,0.02)',
                      border: isFav ? `1px solid ${e.color}50` : '1px solid transparent',
                    }}
                  >
                    {(e.hot || e.new) && (
                      <span style={{
                        position: 'absolute', top: 2, right: 2,
                        fontSize: 8, padding: '1px 4px', borderRadius: 4,
                        background: e.new ? '#34D399' : '#F472B6',
                        color: '#0F1B3D', fontWeight: 800, lineHeight: 1.2,
                      }}>
                        {e.new ? 'NEW' : 'HOT'}
                      </span>
                    )}
                    {isFav && (
                      <Star size={9} color="#FCD535" fill="#FCD535" style={{ position: 'absolute', top: 2, left: 2 }} />
                    )}
                    <div style={{
                      width: 36, height: 36, borderRadius: 10,
                      background: `${e.color}20`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Icon size={18} color={e.color} />
                    </div>
                    <span style={{ fontSize: 10, color: '#F8FAFC', textAlign: 'center', lineHeight: 1.3, fontWeight: 500 }}>
                      {e.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ))
      )}

      {/* ===== 浮动收藏按钮 ===== */}
      <Link
        href="/h5/profile?tab=fav"
        style={{
          position: 'fixed', right: 16, bottom: 80,
          width: 48, height: 48, borderRadius: 24,
          background: 'linear-gradient(135deg, #F0B90B 0%, #FCD535 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 8px 20px rgba(240, 185, 11, 0.5)',
          textDecoration: 'none', zIndex: 10,
        }}
      >
        <Star size={20} color="#0F1B3D" fill="#0F1B3D" />
      </Link>
    </div>
  );
}
