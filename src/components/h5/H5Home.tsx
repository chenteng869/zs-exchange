'use client';
/**
 * H5 首页 v4 - 动态·互动·AI 优先
 *  - 顶部 Hero：搜索 + 每日上新 + 浮动呼吸光斑
 *  - 每日签到条
 *  - 热门 banner 轮播
 *  - 快捷工具横滑
 *  - 最近使用（localStorage 记忆）
 *  - AI 智能中心大模块（9 项 4×3 + HOT 角标）
 *  - 底部"应用中心"链接（去发现页）
 */
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  Search, X, ChevronRight, Sparkles, Activity, MessageCircle,
  Zap, Clock, Gift, Check, Star, Bell, ShieldCheck, ArrowLeftRight,
  Trophy, Heart, FileText, Brain, LineChart, BarChart3, Target, Grid3x3,
  Gamepad2, Trophy as Trophy2, ShoppingBag, Wallet, Leaf, TrendingUp,
  Smartphone, Download, Users,
} from 'lucide-react';
import { TickerStrip } from './TickerStrip';
import { useApkDownload } from '@/hooks/useApkDownload';

// 热门 banner
const HOT_BANNERS = [
  { id: 'b1', title: '福建老酒 · 首发',  sub: '369元起 · 分润渠道双驱动',  bg: 'linear-gradient(135deg, #8B4513 0%, #D2691E 50%, #F0B90B 100%)', icon: '🍶', href: '/h5/shop' },
  { id: 'b2', title: '限时 0 手续费',  sub: 'BTC/USDT 永续合约',  bg: 'linear-gradient(135deg, #F0B90B 0%, #FCD535 50%, #FB923C 100%)', icon: '🔥', href: '/h5/trade?type=futures' },
  { id: 'b3', title: '新币 IDO 认购', sub: '最高 5x 奖励 · 5 月 28 日开启', bg: 'linear-gradient(135deg, #D97706 0%, #F0B90B 100%)', icon: '🚀', href: '/h5/ido' },
  { id: 'b4', title: 'NFT 创作者计划', sub: 'Mint 0 平台费 · 享版税分成', bg: 'linear-gradient(135deg, #A855F7 0%, #EC4899 100%)', icon: '🎨', href: '/h5/nft/mint' },
];

// 快捷工具
const QUICK_TOOLS = [
  { icon: ArrowLeftRight, label: '闪兑', color: '#22D3EE', href: '/h5/defi/swap' },
  { icon: Trophy,         label: '排行', color: '#F0B90B', href: '/h5/game/rank' },
  { icon: Gift,           label: '签到', color: '#F472B6', href: '#checkin' },
  { icon: Bell,           label: '公告', color: '#A78BFA', href: '/h5/profile/notifications' },
  { icon: ShieldCheck,    label: '安全', color: '#34D399', href: '/h5/wallet/security' },
  { icon: Brain,          label: 'AI 客服', color: '#A78BFA', href: '/h5/ai/chat' },
];

// AI 智能中心 9 个子入口
const AI_ENTRIES = [
  { icon: Brain,         label: 'AI 中心',     color: '#A78BFA', href: '/h5/ai',        hot: true },
  { icon: LineChart,     label: 'AI 量化',     color: '#F0B90B', href: '/h5/ai/quant',  hot: true },
  { icon: Activity,      label: 'AI 情绪',     color: '#F472B6', href: '/h5/ai/sentiment', hot: true },
  { icon: Brain,         label: 'AI 投顾',     color: '#38BDF8', href: '/h5/ai/advisor' },
  { icon: BarChart3,     label: 'AI 行情解读', color: '#A78BFA', href: '/h5/ai/analyze' },
  { icon: MessageCircle, label: 'AI 客服',     color: '#22D3EE', href: '/h5/ai/chat' },
  { icon: FileText,      label: 'AI 内容生成', color: '#34D399', href: '/h5/ai/content' },
  { icon: ShieldCheck,   label: 'AI 风控审计', color: '#FB923C', href: '/h5/ai/risk' },
  { icon: Target,        label: 'AI 选币信号', color: '#EC4899', href: '/h5/ai/signal' },
];

// 全部功能快捷入口（H5Home 内部用来跳转到子页），首页里"最近使用"也复用
const ALL_FEATURES: { href: string; label: string; color: string; icon: any }[] = [
  { href: '/h5/trade',     label: '现货交易',   color: '#38BDF8', icon: ArrowLeftRight },
  { href: '/h5/ido',       label: '参与认购',   color: '#A78BFA', icon: Heart },
  { href: '/h5/trade?type=futures', label: '期权交易', color: '#FCD535', icon: BarChart3 },
  { href: '/h5/content/feed', label: '资讯 Feed', color: '#34D399', icon: FileText },
  { href: '/h5/ido/detail/ID-001', label: '项目详情', color: '#F472B6', icon: Sparkles },
  { href: '/h5/defi/swap', label: 'Swap 兑换', color: '#22D3EE', icon: ArrowLeftRight },
  { href: '/h5/wallet/deposit', label: '充值', color: '#34D399', icon: ArrowLeftRight },
  { href: '/h5/game/rank', label: '排行榜',   color: '#F0B90B', icon: Trophy },
  { href: '/h5/content/live', label: '直播列表', color: '#F472B6', icon: Activity },
];

// 福建老酒大模块（第一优先）
const FUJIAN_MODULE = {
  id: 'fujian',
  name: '福建老酒',
  emoji: '🍶',
  color: '#D2691E',
  desc: '369 / 699 · 分润 · 渠道',
  bgGrad: 'linear-gradient(135deg, rgba(210,105,30,0.22) 0%, rgba(139,69,19,0.08) 100%)',
  entries: [
    { icon: ShoppingBag, label: '商城首页',     color: '#D2691E', href: '/h5/shop', hot: true },
    { icon: FileText,    label: '我的订单',     color: '#F0B90B', href: '/h5/shop/orders' },
    { icon: Users,       label: '渠道中心',     color: '#EC4899', href: '/h5/shop/channel' },
    { icon: Wallet,      label: '分润明细',     color: '#34D399', href: '/h5/shop/profits' },
    { icon: Star,        label: '会员中心',     color: '#A78BFA', href: '/h5/shop/member' },
    { icon: Gift,        label: '优惠券',       color: '#F472B6', href: '/h5/shop/coupons' },
    { icon: ShoppingBag, label: '商品详情',     color: '#D2691E', href: '/h5/shop/product/1' },
    { icon: ShoppingBag, label: '购物车',       color: '#F0B90B', href: '/h5/shop/cart' },
  ],
};

// GameFi 游戏大模块
const GAME_MODULE = {
  id: 'game',
  name: 'GameFi 游戏',
  emoji: '🎮',
  color: '#8B5CF6',
  desc: 'P2E / 锦标赛 / 成就',
  bgGrad: 'linear-gradient(135deg, rgba(139,92,246,0.18) 0%, rgba(167,139,250,0.05) 100%)',
  entries: [
    { icon: Gamepad2, label: '游戏中心',     color: '#A78BFA', href: '/h5/game', hot: true },
    { icon: Gamepad2, label: '游戏 Hub',     color: '#A78BFA', href: '/h5/game/hub' },
    { icon: Gamepad2, label: '游戏库',       color: '#A78BFA', href: '/h5/game/list' },
    { icon: Gamepad2, label: '游戏详情',     color: '#A78BFA', href: '/h5/game/game/G-001' },
    { icon: Gamepad2, label: '游戏玩法',     color: '#A78BFA', href: '/h5/game/play/G-001' },
    { icon: Trophy2,  label: '排行榜',       color: '#F0B90B', href: '/h5/game/rank' },
    { icon: Trophy2,  label: '锦标赛',       color: '#F472B6', href: '/h5/game/tournaments' },
    { icon: Trophy2,  label: '锦标赛详情',   color: '#F472B6', href: '/h5/game/tournament/T-001' },
    { icon: Trophy2,  label: '成就系统',     color: '#34D399', href: '/h5/game/achievements' },
    { icon: Wallet,   label: '道具背包',     color: '#22D3EE', href: '/h5/game/inventory' },
    { icon: Heart,    label: '好友',         color: '#38BDF8', href: '/h5/game/friends' },
  ],
};

// ZS Mall 商城大模块
const SHOP_MODULE = {
  id: 'shop',
  name: 'ZS Mall 商城',
  emoji: '🛍️',
  color: '#EC4899',
  desc: '实物 / 数字 / 服务',
  bgGrad: 'linear-gradient(135deg, rgba(236,72,153,0.18) 0%, rgba(244,114,182,0.05) 100%)',
  entries: [
    { icon: ShoppingBag, label: '商城首页',     color: '#F472B6', href: '/h5/shop', hot: true },
    { icon: BarChart3,   label: '商品分类',     color: '#38BDF8', href: '/h5/shop/category' },
    { icon: ShoppingBag, label: '商品详情',     color: '#F472B6', href: '/h5/shop/product/P-001' },
    { icon: ShoppingBag, label: '购物车',       color: '#F0B90B', href: '/h5/shop/cart' },
    { icon: BarChart3,   label: '结算',         color: '#34D399', href: '/h5/shop/checkout' },
    { icon: FileText,    label: '我的订单',     color: '#A78BFA', href: '/h5/shop/orders' },
    { icon: FileText,    label: '订单详情',     color: '#A78BFA', href: '/h5/shop/order/O-001' },
    { icon: Trophy2,     label: '优惠券',       color: '#F0B90B', href: '/h5/shop/coupons' },
  ],
};

// DeFi 链上金融大模块
const DEFI_MODULE = {
  id: 'defi',
  name: 'DeFi 链上金融',
  emoji: '🌿',
  color: '#22C55E',
  desc: 'Swap / 流动性 / 挖矿 / 质押',
  bgGrad: 'linear-gradient(135deg, rgba(34,197,94,0.18) 0%, rgba(34,211,238,0.05) 100%)',
  entries: [
    { icon: Leaf,           label: 'DeFi 首页',    color: '#22D3EE', href: '/h5/defi',         hot: true },
    { icon: ArrowLeftRight, label: 'Swap 兑换',    color: '#22D3EE', href: '/h5/defi/swap',    hot: true },
    { icon: BarChart3,      label: '流动性池',    color: '#38BDF8', href: '/h5/defi/pools' },
    { icon: BarChart3,      label: '添加流动性',  color: '#A78BFA', href: '/h5/defi/add' },
    { icon: BarChart3,      label: '移除流动性',  color: '#F472B6', href: '/h5/defi/remove' },
    { icon: Sparkles,       label: 'Farm 挖矿',   color: '#34D399', href: '/h5/defi/farm',    new: true },
    { icon: BarChart3,      label: 'PoS 质押',    color: '#F0B90B', href: '/h5/defi/stake' },
    { icon: TrendingUp,     label: '收益 Earn',   color: '#22D3EE', href: '/h5/defi/earn' },
    { icon: Wallet,         label: '我的头寸',    color: '#A78BFA', href: '/h5/defi/positions' },
    { icon: FileText,       label: '挖矿历史',    color: '#34D399', href: '/h5/defi/history' },
  ],
};

// 大模块卡片渲染组件
function BigModuleCard({ m, pushRecent, fav, toggleFav }: {
  m: typeof GAME_MODULE;
  pushRecent: (h: string) => void;
  fav: string[];
  toggleFav: (h: string) => void;
}) {
  return (
    <div style={{
      background: m.bgGrad,
      border: '1px solid rgba(148, 163, 184, 0.12)',
      borderRadius: 16, padding: 14, marginBottom: 16,
    }}>
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
              onClick={() => { pushRecent(e.href); window.location.href = e.href; }}
              onDoubleClick={() => toggleFav(e.href)}
              style={{
                position: 'relative',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                padding: '8px 2px', borderRadius: 10, cursor: 'pointer',
                background: isFav ? `${e.color}18` : 'rgba(255,255,255,0.02)',
                border: isFav ? `1px solid ${e.color}50` : '1px solid transparent',
              }}
            >
              {(e as any).hot && (
                <span style={{
                  position: 'absolute', top: 2, right: 2,
                  fontSize: 8, padding: '1px 4px', borderRadius: 4,
                  background: '#F472B6', color: '#0F1B3D', fontWeight: 800, lineHeight: 1.2,
                }}>
                  HOT
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
  );
}

export default function H5Home() {
  const [search, setSearch] = useState('');
  const [signed, setSigned] = useState(false);
  const [recent, setRecent] = useState<string[]>([]);
  const [fav, setFav] = useState<string[]>([]);
  const [activeBanner, setActiveBanner] = useState(0);
  const bannerTimer = useRef<any>(null);

  useEffect(() => {
    try {
      const r = localStorage.getItem('h5_recent');
      const f = localStorage.getItem('h5_fav');
      if (r) setRecent(JSON.parse(r));
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

  useEffect(() => {
    bannerTimer.current = setInterval(() => {
      setActiveBanner((i) => (i + 1) % HOT_BANNERS.length);
    }, 4000);
    return () => clearInterval(bannerTimer.current);
  }, []);

  // APK 下载 hook
  const { info: apkInfo, download: downloadApk, platform } = useApkDownload({ source: 'h5' });
  const handleApkDownload = async () => {
    if (platform === 'ios') {
      window.location.href = '/download';
      return;
    }
    await downloadApk('h5');
  };

  const pushRecent = (href: string) => {
    setRecent((arr) => {
      const next = [href, ...arr.filter((x) => x !== href)].slice(0, 8);
      try { localStorage.setItem('h5_recent', JSON.stringify(next)); } catch {}
      return next;
    });
  };

  return (
    <div style={{ padding: '12px 12px 80px' }}>
      {/* ===== Hero ===== */}
      <div
        style={{
          position: 'relative',
          background: 'linear-gradient(135deg, #0E7490 0%, #1E40AF 50%, #0F1B3D 100%)',
          borderRadius: 18, padding: 18, marginBottom: 14, overflow: 'hidden',
          boxShadow: '0 8px 24px rgba(14, 116, 144, 0.40)',
        }}
      >
        <div style={{
          position: 'absolute', top: -30, right: -30, width: 160, height: 160, borderRadius: 80,
          background: 'radial-gradient(circle, rgba(240, 185, 11, 0.35) 0%, transparent 70%)',
          animation: 'pulse 3s ease-in-out infinite',
        }} />
        <div style={{
          position: 'absolute', bottom: -40, left: -20, width: 120, height: 120, borderRadius: 60,
          background: 'radial-gradient(circle, rgba(167, 139, 250, 0.25) 0%, transparent 70%)',
          animation: 'pulse 4s ease-in-out infinite 1s',
        }} />
        <div style={{ position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <Sparkles size={18} color="#FCD535" />
            <span style={{ fontSize: 18, color: '#F8FAFC', fontWeight: 700, letterSpacing: 0.5 }}>发现</span>
            <span style={{
              marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 4,
              fontSize: 10, padding: '3px 8px', borderRadius: 10,
              background: 'rgba(240, 185, 11, 0.25)', color: '#FCD535', fontWeight: 700,
            }}>
              <Zap size={10} /> 每日上新
            </span>
          </div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.70)', marginBottom: 12 }}>
            一站探索 Web3 · 交易 / 金融 / 收藏 / 游戏
          </div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: 'rgba(255,255,255,0.10)', border: '1px solid rgba(255,255,255,0.20)',
            borderRadius: 14, padding: '10px 12px', backdropFilter: 'blur(10px)',
          }}>
            <Search size={14} color="#FDE68A" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索功能 / 模块 / 页面..."
              style={{ flex: 1, background: 'transparent', border: 'none', color: '#fff', fontSize: 13, outline: 'none' }}
            />
            {search && (
              <button onClick={() => setSearch('')} style={{ background: 'transparent', border: 'none', color: '#FDE68A', fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 2 }}>
                <X size={12} /> 清空
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ===== 热门行情（真实 Binance 数据） ===== */}
      <TickerStrip />

      {/* ===== APP 下载横幅 ===== */}
      {platform !== 'ios' && (
        <div
          onClick={handleApkDownload}
          style={{
            position: 'relative',
            background:
              'linear-gradient(135deg, rgba(56, 189, 248, 0.18) 0%, rgba(30, 64, 175, 0.25) 100%)',
            border: '1px solid rgba(56, 189, 248, 0.35)',
            borderRadius: 16,
            padding: '12px 14px',
            marginBottom: 14,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            cursor: 'pointer',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: -20,
              right: -20,
              width: 100,
              height: 100,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(56, 189, 248, 0.30) 0%, transparent 70%)',
            }}
          />
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: 'linear-gradient(135deg, #38BDF8 0%, #1E40AF 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              boxShadow: '0 4px 12px rgba(56, 189, 248, 0.40)',
            }}
          >
            <Smartphone size={22} color="#fff" />
          </div>
          <div style={{ flex: 1, minWidth: 0, position: 'relative' }}>
            <div
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: '#F8FAFC',
                marginBottom: 2,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              ZS Exchange 官方 APP
              <span
                style={{
                  fontSize: 9,
                  padding: '1px 6px',
                  borderRadius: 4,
                  background: 'rgba(240, 185, 11, 0.25)',
                  color: '#FCD535',
                  fontWeight: 700,
                }}
              >
                HOT
              </span>
              <span
                style={{
                  fontSize: 9,
                  padding: '1px 6px',
                  borderRadius: 4,
                  background: 'linear-gradient(135deg, #10B981 0%, #34D399 100%)',
                  color: '#022c22',
                  fontWeight: 700,
                  boxShadow: '0 0 8px rgba(52, 211, 153, 0.50)',
                }}
              >
                NEW v{apkInfo?.version ?? '1.0.0'}
              </span>
            </div>
            <div style={{ fontSize: 11, color: '#94A3B8' }}>
              {apkInfo
                ? `${apkInfo.fileSizeFormatted} · 原生极速体验 · ${apkInfo.releaseDate} 发布`
                : '原生极速体验 · 实时行情推送'}
            </div>
          </div>
          <div
            style={{
              padding: '6px 12px',
              background: 'linear-gradient(135deg, #38BDF8 0%, #1E40AF 100%)',
              borderRadius: 8,
              color: '#fff',
              fontSize: 11,
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              flexShrink: 0,
              boxShadow: '0 2px 6px rgba(56, 189, 248, 0.35)',
            }}
          >
            <Download size={12} />
            下载
          </div>
        </div>
      )}

      {/* ===== 每日签到条 ===== */}
      <div
        id="checkin"
        onClick={() => setSigned(true)}
        style={{
          display: 'flex', alignItems: 'center', gap: 12,
          background: signed
            ? 'linear-gradient(135deg, rgba(52, 211, 153, 0.18) 0%, rgba(34, 197, 94, 0.08) 100%)'
            : 'linear-gradient(135deg, rgba(240, 185, 11, 0.18) 0%, rgba(252, 213, 53, 0.05) 100%)',
          border: signed ? '1px solid rgba(52, 211, 153, 0.40)' : '1px solid rgba(240, 185, 11, 0.30)',
          borderRadius: 14, padding: '12px 14px', marginBottom: 14, cursor: 'pointer',
          transition: 'all 0.2s',
        }}
      >
        <div style={{
          width: 38, height: 38, borderRadius: 12,
          background: signed ? 'linear-gradient(135deg, #34D399, #22C55E)' : 'linear-gradient(135deg, #F0B90B, #FCD535)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: signed ? '0 0 12px rgba(52, 211, 153, 0.5)' : '0 0 12px rgba(240, 185, 11, 0.4)',
        }}>
          {signed ? <Check size={18} color="#0F1B3D" /> : <Gift size={18} color="#0F1B3D" />}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: signed ? '#34D399' : '#FCD535' }}>
            {signed ? '今日已签到 · 明天再来' : '每日签到 · 领 10 ZS'}
          </div>
          <div style={{ fontSize: 10, color: '#7B89B8', marginTop: 2 }}>
            {signed ? '已连签 1 天，再接再厉' : '连续 7 天可额外领 100 ZS 空投'}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 3 }}>
          {[1, 2, 3, 4, 5, 6, 7].map((d) => (
            <div key={d} style={{
              width: 6, height: signed && d === 1 ? 14 : 8, borderRadius: 2,
              background: signed && d === 1 ? '#34D399' : 'rgba(123, 137, 184, 0.30)',
              transition: 'all 0.3s',
            }} />
          ))}
        </div>
        <ChevronRight size={16} color="#7B89B8" />
      </div>

      {/* ===== 热门 banner 轮播 ===== */}
      <div style={{ position: 'relative', marginBottom: 14, borderRadius: 16, overflow: 'hidden' }}>
        <div style={{
          display: 'flex', transform: `translateX(-${activeBanner * 100}%)`,
          transition: 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
        }}>
          {HOT_BANNERS.map((b) => (
            <Link key={b.id} href={b.href} onClick={() => pushRecent(b.href)} style={{
              flex: '0 0 100%', background: b.bg, borderRadius: 16, padding: '16px 18px',
              textDecoration: 'none', display: 'block', minHeight: 96, position: 'relative', overflow: 'hidden',
            }}>
              <div style={{ position: 'absolute', right: -10, top: -10, fontSize: 80, opacity: 0.25 }}>{b.icon}</div>
              <div style={{ position: 'relative' }}>
                <div style={{ fontSize: 17, color: '#fff', fontWeight: 800, marginBottom: 4, textShadow: '0 1px 2px rgba(0,0,0,0.2)' }}>{b.title}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.90)' }}>{b.sub}</div>
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 3, marginTop: 8, padding: '4px 10px',
                  borderRadius: 10, background: 'rgba(255,255,255,0.25)', color: '#fff', fontSize: 10, fontWeight: 700,
                }}>
                  立即查看 <ChevronRight size={10} />
                </div>
              </div>
            </Link>
          ))}
        </div>
        <div style={{ position: 'absolute', bottom: 8, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 4 }}>
          {HOT_BANNERS.map((_, i) => (
            <button key={i} onClick={() => setActiveBanner(i)} style={{
              width: i === activeBanner ? 16 : 6, height: 4, borderRadius: 2, border: 'none',
              background: i === activeBanner ? '#FCD535' : 'rgba(255,255,255,0.50)',
              cursor: 'pointer', transition: 'all 0.3s', padding: 0,
            }} />
          ))}
        </div>
      </div>

      {/* ===== 快捷工具横滑 ===== */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, padding: '0 2px' }}>
          <Zap size={14} color="#FCD535" />
          <span style={{ fontSize: 13, color: '#F8FAFC', fontWeight: 700 }}>快捷工具</span>
          <span style={{ marginLeft: 'auto', fontSize: 10, color: '#7B89B8' }}>左右滑动 →</span>
        </div>
        <div style={{
          display: 'flex', gap: 10, overflowX: 'auto', padding: '4px 2px 8px',
          scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch',
        }}>
          {QUICK_TOOLS.map((t) => {
            const Icon = t.icon;
            return (
              <Link key={t.label} href={t.href} onClick={() => pushRecent(t.href)} style={{
                flex: '0 0 64px', scrollSnapAlign: 'start',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                textDecoration: 'none',
                background: 'linear-gradient(180deg, rgba(26, 36, 86, 0.55) 0%, rgba(21, 34, 74, 0.70) 100%)',
                border: '1px solid rgba(148, 163, 184, 0.10)', borderRadius: 12, padding: '12px 6px',
              }}>
                <div style={{ width: 34, height: 34, borderRadius: 10, background: `${t.color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={16} color={t.color} />
                </div>
                <span style={{ fontSize: 10, color: '#F8FAFC' }}>{t.label}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* ===== 最近使用 ===== */}
      {recent.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, padding: '0 2px' }}>
            <Clock size={14} color="#38BDF8" />
            <span style={{ fontSize: 13, color: '#F8FAFC', fontWeight: 700 }}>最近使用</span>
            <button onClick={() => { setRecent([]); try { localStorage.removeItem('h5_recent'); } catch {} }} style={{ marginLeft: 'auto', background: 'transparent', border: 'none', color: '#7B89B8', fontSize: 10, cursor: 'pointer' }}>
              清空
            </button>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {recent.map((r) => {
              const matched = ALL_FEATURES.find((f) => f.href === r) || AI_ENTRIES.find((f) => f.href === r);
              if (!matched) return null;
              const Icon = matched.icon;
              return (
                <Link key={r} href={r} onClick={() => pushRecent(r)} style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  padding: '5px 10px', borderRadius: 14,
                  background: `${matched.color}20`, border: `1px solid ${matched.color}40`,
                  textDecoration: 'none', fontSize: 11, color: matched.color,
                }}>
                  <Icon size={11} color={matched.color} />
                  {matched.label}
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* ===== AI 智能中心大模块（亮点） ===== */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(167,139,250,0.18) 0%, rgba(244,114,182,0.05) 100%)',
        border: '1px solid rgba(167,139,250,0.30)',
        borderRadius: 16, padding: 14, marginBottom: 16,
        boxShadow: '0 0 24px rgba(167,139,250,0.15)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 11,
            background: 'linear-gradient(135deg, #A78BFA 0%, #F472B6 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 14px rgba(167,139,250,0.5)',
            fontSize: 18,
          }}>
            🤖
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, color: '#F8FAFC', fontWeight: 700 }}>AI 智能中心</div>
            <div style={{ fontSize: 10, color: '#7B89B8' }}>量化 / 情绪 / 投顾 / 解读</div>
          </div>
          <span style={{
            fontSize: 10, padding: '3px 7px', borderRadius: 8,
            background: 'rgba(167,139,250,0.20)', color: '#A78BFA', fontWeight: 700,
          }}>
            9 项
          </span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
          {AI_ENTRIES.map((e, i) => {
            const Icon = e.icon;
            return (
              <Link
                key={i}
                href={e.href}
                onClick={() => pushRecent(e.href)}
                style={{
                  position: 'relative',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                  padding: '8px 2px', borderRadius: 10, textDecoration: 'none',
                  background: 'rgba(255,255,255,0.02)',
                }}
              >
                {e.hot && (
                  <span style={{
                    position: 'absolute', top: 2, right: 2,
                    fontSize: 8, padding: '1px 4px', borderRadius: 4,
                    background: '#F472B6', color: '#0F1B3D', fontWeight: 800, lineHeight: 1.2,
                  }}>
                    HOT
                  </span>
                )}
                <div style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: `${e.color}20`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: `0 0 10px ${e.color}30`,
                }}>
                  <Icon size={18} color={e.color} />
                </div>
                <span style={{ fontSize: 10, color: '#F8FAFC', textAlign: 'center', lineHeight: 1.3, fontWeight: 500 }}>
                  {e.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* ===== 福建老酒大模块（第一优先） ===== */}
      <BigModuleCard m={FUJIAN_MODULE} pushRecent={pushRecent} fav={fav} toggleFav={toggleFav} />

      {/* ===== GameFi 游戏大模块 ===== */}
      <BigModuleCard m={GAME_MODULE} pushRecent={pushRecent} fav={fav} toggleFav={toggleFav} />

      {/* ===== ZS Mall 商城大模块 ===== */}
      <BigModuleCard m={SHOP_MODULE} pushRecent={pushRecent} fav={fav} toggleFav={toggleFav} />

      {/* ===== DeFi 链上金融大模块 ===== */}
      <BigModuleCard m={DEFI_MODULE} pushRecent={pushRecent} fav={fav} toggleFav={toggleFav} />

      {/* ===== 底部"应用中心"链接 ===== */}
      <Link
        href="/h5/discover"
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          padding: '12px', borderRadius: 12, textDecoration: 'none',
          background: 'linear-gradient(180deg, rgba(26, 36, 86, 0.55) 0%, rgba(21, 34, 74, 0.70) 100%)',
          border: '1px solid rgba(148, 163, 184, 0.15)',
        }}
      >
        <Grid3x3 size={14} color="#F0B90B" />
        <span style={{ fontSize: 12, color: '#F8FAFC', fontWeight: 700 }}>查看全部应用中心</span>
        <span style={{ fontSize: 10, color: '#F0B90B', marginLeft: 4 }}>(121) →</span>
      </Link>

      <style jsx>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 0.85; }
          50% { transform: scale(1.15); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
