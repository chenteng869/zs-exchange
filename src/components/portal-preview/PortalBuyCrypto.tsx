'use client';

/**
 * PortalBuyCrypto - 买币页面（2026-07-19 Q05 P3.2）
 *
 * 页面定位：
 * - 中萨数字科技交易所买币总入口
 * - 4 大买币通道：快捷买币 / P2P / OTC 大宗 / 法币通道
 * - 5 步买币教程 + FAQ + 实时行情 ticker
 *
 * L4 工业级设计标准：
 * - 暗色背景 v6 纯黑无色相（#000000 + 卡片 #141414）
 * - ZSDEX 品牌绿 primary #14B881
 * - 至少 5 个区块（Hero / Ticker / 4 入口 / 教程 / FAQ）
 * - 至少 5 项交互（搜索 / 排序 / Tab / Drawer / 快捷键）
 * - 1+ Drawer（买币流程详情）
 * - 1+ 实时数据波动（价格 ticker 模拟）
 * - 3+ 动画（Stagger / CountUp / Hover）
 *
 * 合规要点（Q05 硬约束）：
 * - 不接真实 API，价格/成交额使用 mock 占位
 * - 不出现萨摩亚 / MSA / 持牌 / 牌照 / DSAEX-2024-001
 * - 状态徽章统一枚举：OPEN / BETA / SOON
 * - 不修改旧官网 / 旧 H5 / disabled pages
 */

import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import {
  Zap,
  Users,
  Briefcase,
  Banknote,
  Search,
  ChevronRight,
  ChevronDown,
  X,
  Clock,
  Shield,
  CreditCard,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  CircleDashed,
  CircleDot,
  HelpCircle,
  Filter,
  ArrowUpDown,
  Keyboard,
  Lightbulb,
  RefreshCw,
} from 'lucide-react';
import { BRAND, STATUS } from './brand';

// ============== 数据（mock 占位，不接真实 API）==============

type ChannelStatus = 'OPEN' | 'BETA' | 'SOON' | 'MAINTENANCE';

interface BuyChannel {
  id: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  title: string;
  subtitle: string;
  description: string;
  status: ChannelStatus;
  features: string[];
  cta: string;
  highlights: { label: string; value: string }[];
}

const CHANNELS: BuyChannel[] = [
  {
    id: 'quick',
    icon: Zap,
    title: '快捷买币',
    subtitle: 'C2C 一键购买',
    description: '选择币种与金额，系统自动撮合商家，支持主流支付方式，最快 30 秒到账。',
    status: 'OPEN',
    features: ['30+ 主流币种', '支付宝 / 微信 / 银行卡', '最快 30 秒到账', '商家保证金担保'],
    cta: '立即快捷买币',
    highlights: [
      { label: '支持币种', value: '30+' },
      { label: '平均到账', value: '<60s' },
      { label: '支付方式', value: '12' },
    ],
  },
  {
    id: 'p2p',
    icon: Users,
    title: 'P2P 交易',
    subtitle: '用户对用户直接交易',
    description: '商家与用户直接成交，平台担保 escrow，多支付方式可选，适合大额或特定价格成交。',
    status: 'OPEN',
    features: ['平台 escrow 担保', '价格由商家设定', '支持大额成交', '0 平台手续费'],
    cta: '进入 P2P 交易区',
    highlights: [
      { label: '在线商家', value: '500+' },
      { label: '活跃交易对', value: '200+' },
      { label: '平台手续费', value: '0%' },
    ],
  },
  {
    id: 'otc',
    icon: Briefcase,
    title: 'OTC 大宗',
    subtitle: '机构级大宗交易',
    description: '面向机构客户与高净值用户的场外大宗交易专线，提供专属顾问与定制化报价。',
    status: 'BETA',
    features: ['100 万起交易额', '专属交易顾问', '定制化报价', 'T+0 结算'],
    cta: '申请 OTC 通道',
    highlights: [
      { label: '最低门槛', value: '¥100万' },
      { label: '响应时间', value: '<15min' },
      { label: '结算时效', value: 'T+0' },
    ],
  },
  {
    id: 'fiat',
    icon: Banknote,
    title: '法币通道',
    subtitle: '法币直接充值',
    description: '通过合作银行通道，将法币（CNY / HKD / USD）直接充值到平台账户。',
    status: 'SOON',
    features: ['CNY / HKD / USD', '合作银行通道', 'T+1 到账', 'KYC 后开放'],
    cta: '了解法币通道',
    highlights: [
      { label: '支持法币', value: '3' },
      { label: '到账时效', value: 'T+1' },
      { label: '开放状态', value: '即将开放' },
    ],
  },
];

// ============== 实时行情 ticker（mock 占位，不接真实 API）==============

interface Ticker {
  symbol: string;
  name: string;
  price: number;
  change: number;
  unit: string;
}

const TICKER_BASE: Omit<Ticker, 'price' | 'change'>[] = [
  { symbol: 'BTC', name: 'Bitcoin', unit: 'USDT' },
  { symbol: 'ETH', name: 'Ethereum', unit: 'USDT' },
  { symbol: 'USDT', name: 'Tether', unit: 'CNY' },
  { symbol: 'BNB', name: 'BNB', unit: 'USDT' },
  { symbol: 'SOL', name: 'Solana', unit: 'USDT' },
];

const TICKER_BASE_PRICE: Record<string, number> = {
  BTC: 96800,
  ETH: 3450,
  USDT: 7.21,
  BNB: 720,
  SOL: 178,
};

function formatPrice(price: number, unit: string): string {
  if (unit === 'CNY') return `¥${price.toFixed(4)}`;
  if (price >= 1000) return `$${price.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
  return `$${price.toFixed(2)}`;
}

// ============== 教程步骤 ==============

interface TutorialStep {
  step: number;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  detail: string;
  tips: string[];
}

const TUTORIAL_STEPS: TutorialStep[] = [
  {
    step: 1,
    title: '注册并完成 KYC',
    description: '邮箱 / 手机号注册账户，完成实名认证与安全设置。',
    icon: Shield,
    detail: 'KYC 是平台合规的基础要求。请准备身份证 / 护照、人脸识别，并设置资金密码与 Google 二次验证。',
    tips: [
      '使用真实身份信息，KYC 不可二次修改',
      '建议同时开启 Google Authenticator',
      '保存好资金密码，与登录密码区分使用',
    ],
  },
  {
    step: 2,
    title: '选择买币通道',
    description: '根据金额、时效、支付习惯选择合适的买币通道。',
    icon: Filter,
    detail: '小金额（<5万）建议快捷买币；中等金额（5-50万）建议 P2P；大额（>50万）建议 OTC；法币通道适合充值需求。',
    tips: [
      '快捷买币最快 30 秒到账',
      'P2P 适合对比价格、追求最优汇率',
      'OTC 适合机构客户与大额交易',
    ],
  },
  {
    step: 3,
    title: '选择币种与金额',
    description: '选择目标币种（BTC / ETH / USDT 等）并输入购买金额。',
    icon: CreditCard,
    detail: '系统会按当前最优报价预估能获得的币种数量，请关注价格波动窗口（大额成交前请确认最新报价）。',
    tips: [
      '数字资产价格波动较大，请注意成交时机',
      '大额买币建议分批成交降低滑点',
      '注意区分币种主网（ERC20 / TRC20 等）',
    ],
  },
  {
    step: 4,
    title: '支付与确认',
    description: '按平台生成的支付方式完成转账，并标记已付款。',
    icon: ArrowRight,
    detail: '请在订单有效期内（通常 15-30 分钟）完成转账，标记已付款后等待商家放币。超时未支付订单将自动取消。',
    tips: [
      '转账时请备注订单号（部分通道需要）',
      '切勿向陌生人转账非订单要求的金额',
      '遇到问题可通过订单页联系客服',
    ],
  },
  {
    step: 5,
    title: '到账与资产查询',
    description: '币种到账后，可在「钱包-我的资产」查询余额与流水。',
    icon: CheckCircle2,
    detail: '到账会有站内通知与邮件提醒，可在「资金流水」查看每笔交易的状态、对手方、订单号、时间戳。',
    tips: [
      '到账后可在钱包中做转账 / 提现 / 交易',
      '建议立即在「资金流水」核对金额',
      '如有异常请第一时间联系客服',
    ],
  },
];

// ============== FAQ ==============

interface FaqItem {
  q: string;
  a: string;
  category: '流程' | '费用' | '安全' | '合规';
}

const FAQS: FaqItem[] = [
  {
    category: '流程',
    q: '买币需要先完成 KYC 吗？',
    a: '是的，根据合规要求，所有买币操作需要先完成实名认证（KYC）。未完成 KYC 的账户无法发起买币订单。',
  },
  {
    category: '流程',
    q: '买币订单的有效期是多久？',
    a: '快捷买币与 P2P 订单通常有效期为 15-30 分钟。订单超时未支付将自动取消，已生成的支付信息失效。',
  },
  {
    category: '费用',
    q: '买币需要支付手续费吗？',
    a: '快捷买币与 OTC 通道由商家报价，已包含手续费；P2P 交易平台不收取额外手续费，商家报价即为最终成交价。',
  },
  {
    category: '费用',
    q: '价格会随行情变化吗？',
    a: '会。数字资产价格随市场实时波动，订单生成时的价格仅供参考，最终成交价以商家放币时的价格为准。',
  },
  {
    category: '安全',
    q: '买币资金安全吗？',
    a: 'P2P 交易使用平台 escrow 担保机制，资金由平台代管；快捷买币由商家保证金担保。所有交易可在「资金流水」中追溯。',
  },
  {
    category: '安全',
    q: '遇到问题如何申诉？',
    a: '订单页底部有「申诉」按钮，提交后由平台客服介入处理。一般问题 30 分钟内响应，复杂问题 24 小时内给出处理方案。',
  },
  {
    category: '合规',
    q: '买币有金额限制吗？',
    a: '根据 KYC 等级与合规要求：基础认证单日 5 万 CNY，完整认证单日 50 万 CNY。机构客户可申请提高限额。',
  },
  {
    category: '合规',
    q: '是否支持匿名买币？',
    a: '不支持。平台严格遵循反洗钱（AML）与了解你的客户（KYC）要求，所有买币操作需要实名账户。',
  },
];

// ============== 主组件 ==============

export function PortalBuyCrypto() {
  // ----- Ticker (实时模拟波动) -----
  const [tickerData, setTickerData] = useState<Ticker[]>(() =>
    TICKER_BASE.map((t) => {
      const base = TICKER_BASE_PRICE[t.symbol] || 100;
      const jitter = (Math.random() - 0.5) * 0.02; // ±1%
      return {
        ...t,
        price: base * (1 + jitter),
        change: (Math.random() - 0.5) * 4, // ±2%
      };
    })
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setTickerData((prev) =>
        prev.map((t) => {
          const drift = (Math.random() - 0.5) * 0.004; // ±0.2% per tick
          const newPrice = Math.max(0.0001, t.price * (1 + drift));
          return { ...t, price: newPrice, change: t.change + (Math.random() - 0.5) * 0.1 };
        })
      );
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // ----- 搜索 / 过滤 -----
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // ----- 教程 Tab -----
  const [activeStep, setActiveStep] = useState<number>(0);

  // ----- FAQ 排序与过滤 -----
  const [faqSort, setFaqSort] = useState<'default' | 'category'>('default');
  const [faqCategory, setFaqCategory] = useState<'全部' | FaqItem['category']>('全部');
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  // ----- Drawer 详情 -----
  const [drawerChannel, setDrawerChannel] = useState<BuyChannel | null>(null);

  // ----- 快捷键 -----
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === '/' && !searchOpen) {
        e.preventDefault();
        setSearchOpen(true);
      }
      if (e.key === 'Escape') {
        setSearchOpen(false);
        setDrawerChannel(null);
      }
      if (e.key === 'ArrowRight' && !drawerChannel && !searchOpen) {
        setActiveStep((s) => (s + 1) % TUTORIAL_STEPS.length);
      }
      if (e.key === 'ArrowLeft' && !drawerChannel && !searchOpen) {
        setActiveStep((s) => (s - 1 + TUTORIAL_STEPS.length) % TUTORIAL_STEPS.length);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [searchOpen, drawerChannel]);

  // ----- CountUp 数字滚动（关键 KPI） -----
  const [kpiKey, setKpiKey] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setKpiKey((k) => k + 1), 8000);
    return () => clearInterval(t);
  }, []);

  // ----- 处理过滤后的 FAQ -----
  const filteredFaqs = useMemo(() => {
    let list = FAQS;
    if (faqCategory !== '全部') list = list.filter((f) => f.category === faqCategory);
    if (faqSort === 'category') {
      list = [...list].sort((a, b) => a.category.localeCompare(b.category));
    }
    return list;
  }, [faqCategory, faqSort]);

  // ----- 处理过滤后的通道 -----
  const filteredChannels = useMemo(() => {
    if (!searchQuery.trim()) return CHANNELS;
    const q = searchQuery.toLowerCase();
    return CHANNELS.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.subtitle.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  // ============== 子组件 ==============

  const StatusBadge = ({ status }: { status: ChannelStatus }) => {
    const map = {
      OPEN: { label: '已开放', color: BRAND.success, bg: 'rgba(14, 203, 129, 0.12)' },
      BETA: { label: '内测中', color: BRAND.purple, bg: 'rgba(124, 58, 237, 0.12)' },
      SOON: { label: '即将开放', color: BRAND.info, bg: 'rgba(68, 219, 244, 0.12)' },
      MAINTENANCE: { label: '维护中', color: BRAND.warning, bg: 'rgba(255, 169, 64, 0.12)' },
    };
    const s = map[status];
    return (
      <span
        className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded"
        style={{ backgroundColor: s.bg, color: s.color }}
      >
        <CircleDot className="w-2.5 h-2.5" />
        {s.label}
      </span>
    );
  };

  // ============== 渲染 ==============

  return (
    <div className="min-h-screen" style={{ backgroundColor: BRAND.bg, color: BRAND.text }}>
      {/* ===== 1. Hero ===== */}
      <section className="relative overflow-hidden" style={{ backgroundColor: BRAND.bg }}>
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(circle at 20% 0%, ${BRAND.primaryLt}, transparent 50%), radial-gradient(circle at 80% 100%, rgba(20, 184, 129, 0.06), transparent 50%)`,
          }}
        />
        <div className="relative max-w-7xl mx-auto px-6 pt-16 pb-12">
          <div className="flex items-center gap-2 text-xs mb-4" style={{ color: BRAND.textMute }}>
            <a href="/portal-preview" className="hover:text-primary transition-colors">
              首页
            </a>
            <ChevronRight className="w-3 h-3" />
            <span style={{ color: BRAND.textSub }}>买币</span>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end">
            <div className="lg:col-span-8">
              <div
                className="inline-flex items-center gap-2 text-[10px] font-bold tracking-widest uppercase px-2.5 py-1 rounded mb-4"
                style={{ backgroundColor: BRAND.primaryLt, color: BRAND.primary }}
              >
                <Sparkles className="w-3 h-3" />
                买币 · BUY CRYPTO
              </div>
              <h1
                className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4"
                style={{ color: BRAND.text }}
              >
                选择买币通道
                <span style={{ color: BRAND.primary }}>·</span>
                一键购买数字资产
              </h1>
              <p
                className="text-base max-w-2xl leading-relaxed mb-6"
                style={{ color: BRAND.textSub }}
              >
                提供快捷买币、P2P、OTC 大宗、法币通道四种方式，覆盖从 100 元到千万级交易额的不同场景。
                平台 escrow 担保，资金可追溯。
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <a
                  href="/auth/register"
                  className="inline-flex items-center gap-2 px-5 h-11 rounded-lg text-sm font-bold transition-all active:scale-95"
                  style={{ backgroundColor: BRAND.primaryContainer, color: BRAND.onPrimary }}
                >
                  立即注册
                  <ArrowRight className="w-4 h-4" />
                </a>
                <a
                  href="/auth/login"
                  className="inline-flex items-center gap-2 px-5 h-11 rounded-lg text-sm font-semibold transition-all"
                  style={{
                    backgroundColor: BRAND.card,
                    color: BRAND.text,
                    border: `1px solid ${BRAND.border}`,
                  }}
                >
                  已有账号 · 登录
                </a>
                <button
                  onClick={() => setSearchOpen(true)}
                  className="inline-flex items-center gap-2 px-4 h-11 rounded-lg text-sm transition-colors"
                  style={{
                    backgroundColor: BRAND.card,
                    color: BRAND.textMute,
                    border: `1px solid ${BRAND.border}`,
                  }}
                  aria-label="搜索"
                >
                  <Search className="w-4 h-4" />
                  搜索通道
                  <kbd
                    className="text-[10px] px-1 rounded font-mono"
                    style={{
                      backgroundColor: BRAND.bgAlt,
                      border: `1px solid ${BRAND.border}`,
                    }}
                  >
                    /
                  </kbd>
                </button>
              </div>
            </div>

            {/* Hero 右侧 KPI 卡（CountUp） */}
            <div className="lg:col-span-4">
              <div
                className="rounded-2xl p-5"
                style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}
              >
                <div className="text-[10px] font-bold tracking-widest uppercase mb-3" style={{ color: BRAND.textMute }}>
                  平台买币数据 · 实时估算
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: '支持币种', value: 32, suffix: '+' },
                    { label: '在线商家', value: 580, suffix: '+' },
                    { label: '已成交', value: 1247893, prefix: '¥', short: true },
                  ].map((kpi, i) => (
                    <div key={i} className="text-center">
                      <CountUp
                        key={kpiKey + '-' + i}
                        value={kpi.value}
                        prefix={kpi.prefix}
                        suffix={kpi.suffix}
                        short={kpi.short}
                        className="text-2xl font-extrabold"
                        style={{ color: BRAND.primary }}
                      />
                      <div className="text-[10px] mt-1" style={{ color: BRAND.textMute }}>
                        {kpi.label}
                      </div>
                    </div>
                  ))}
                </div>
                <div
                  className="text-[10px] mt-3 pt-3 flex items-center gap-1"
                  style={{ color: BRAND.textMute, borderTop: `1px solid ${BRAND.border}` }}
                >
                  <CircleDashed className="w-3 h-3" />
                  数据为占位估算，真实业务对接后实时更新
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== 2. 实时行情 Ticker ===== */}
      <section
        className="sticky top-16 z-30"
        style={{
          backgroundColor: BRAND.card,
          borderTop: `1px solid ${BRAND.border}`,
          borderBottom: `1px solid ${BRAND.border}`,
        }}
      >
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center gap-6 overflow-x-auto custom-scrollbar">
          <div className="flex items-center gap-1.5 text-[10px] font-bold tracking-widest uppercase shrink-0" style={{ color: BRAND.textMute }}>
            <RefreshCw className="w-3 h-3 animate-spin-slow" />
            实时行情
          </div>
          {tickerData.map((t) => {
            const isUp = t.change >= 0;
            return (
              <div key={t.symbol} className="flex items-center gap-2 shrink-0">
                <span className="text-xs font-bold" style={{ color: BRAND.text }}>
                  {t.symbol}
                </span>
                <span className="text-xs font-mono" style={{ color: BRAND.textSub }}>
                  {formatPrice(t.price, t.unit)}
                </span>
                <span
                  className="text-[10px] font-bold inline-flex items-center gap-0.5"
                  style={{ color: isUp ? BRAND.success : BRAND.danger }}
                >
                  {isUp ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
                  {isUp ? '+' : ''}
                  {t.change.toFixed(2)}%
                </span>
              </div>
            );
          })}
        </div>
      </section>

      {/* ===== 3. 4 大买币通道卡 ===== */}
      <section className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex items-end justify-between mb-6">
          <div>
            <div
              className="text-[10px] font-bold tracking-widest uppercase mb-1"
              style={{ color: BRAND.textMute }}
            >
              买币通道
            </div>
            <h2 className="text-2xl font-bold" style={{ color: BRAND.text }}>
              4 种方式 · 覆盖所有买币场景
            </h2>
          </div>
          <div className="text-xs hidden md:block" style={{ color: BRAND.textMute }}>
            点击卡片查看完整流程 →
          </div>
        </div>

        {filteredChannels.length === 0 ? (
          <div
            className="rounded-2xl py-16 text-center"
            style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}
          >
            <Search className="w-10 h-10 mx-auto mb-3" style={{ color: BRAND.textMute }} />
            <p className="text-sm" style={{ color: BRAND.textMute }}>
              未找到匹配的买币通道
            </p>
            <button
              onClick={() => setSearchQuery('')}
              className="mt-3 text-xs px-3 py-1.5 rounded-lg"
              style={{ backgroundColor: BRAND.bgAlt, color: BRAND.textSub }}
            >
              清除搜索
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredChannels.map((c, idx) => {
              const Icon = c.icon;
              return (
                <div
                  key={c.id}
                  className="rounded-2xl p-6 transition-all hover:-translate-y-0.5 cursor-pointer group animate-fadeInUp"
                  style={{
                    backgroundColor: BRAND.card,
                    border: `1px solid ${BRAND.border}`,
                    animationDelay: `${idx * 80}ms`,
                    animationFillMode: 'both',
                  }}
                  onClick={() => setDrawerChannel(c)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center transition-all group-hover:scale-110"
                      style={{ backgroundColor: BRAND.primaryLt, color: BRAND.primary }}
                    >
                      <Icon className="w-6 h-6" />
                    </div>
                    <StatusBadge status={c.status} />
                  </div>
                  <h3 className="text-lg font-bold mb-1" style={{ color: BRAND.text }}>
                    {c.title}
                  </h3>
                  <div className="text-xs mb-3" style={{ color: BRAND.textMute }}>
                    {c.subtitle}
                  </div>
                  <p className="text-sm leading-relaxed mb-4" style={{ color: BRAND.textSub }}>
                    {c.description}
                  </p>
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    {c.highlights.map((h) => (
                      <div
                        key={h.label}
                        className="rounded-lg p-2 text-center"
                        style={{ backgroundColor: BRAND.bg }}
                      >
                        <div className="text-sm font-extrabold" style={{ color: BRAND.primary }}>
                          {h.value}
                        </div>
                        <div className="text-[10px] mt-0.5" style={{ color: BRAND.textMute }}>
                          {h.label}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div
                    className="flex items-center justify-between pt-3"
                    style={{ borderTop: `1px solid ${BRAND.border}` }}
                  >
                    <span className="text-xs" style={{ color: BRAND.textMute }}>
                      {c.features.length} 项核心能力
                    </span>
                    <span
                      className="inline-flex items-center gap-1 text-xs font-bold transition-all group-hover:gap-2"
                      style={{ color: BRAND.primary }}
                    >
                      查看详情
                      <ChevronRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ===== 4. 买币教程 ===== */}
      <section
        className="py-12"
        style={{ backgroundColor: BRAND.card, borderTop: `1px solid ${BRAND.border}`, borderBottom: `1px solid ${BRAND.border}` }}
      >
        <div className="max-w-7xl mx-auto px-6">
          <div className="mb-6">
            <div
              className="text-[10px] font-bold tracking-widest uppercase mb-1"
              style={{ color: BRAND.textMute }}
            >
              买币教程
            </div>
            <h2 className="text-2xl font-bold mb-2" style={{ color: BRAND.text }}>
              5 步完成首次买币
            </h2>
            <p className="text-sm" style={{ color: BRAND.textSub }}>
              使用键盘 ← / → 切换步骤，按 <kbd
                className="px-1.5 py-0.5 rounded text-[10px] font-mono"
                style={{ backgroundColor: BRAND.bgAlt, border: `1px solid ${BRAND.border}` }}
              >Esc</kbd> 关闭弹层
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* 左侧步骤导航 */}
            <div className="lg:col-span-4 space-y-2">
              {TUTORIAL_STEPS.map((s, i) => {
                const Icon = s.icon;
                const isActive = i === activeStep;
                return (
                  <button
                    key={s.step}
                    onClick={() => setActiveStep(i)}
                    className="w-full text-left rounded-xl p-4 transition-all flex items-start gap-3"
                    style={{
                      backgroundColor: isActive ? BRAND.primaryLt : BRAND.bg,
                      border: `1px solid ${isActive ? BRAND.primary : BRAND.border}`,
                    }}
                  >
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                      style={{
                        backgroundColor: isActive ? BRAND.primary : BRAND.card,
                        color: isActive ? BRAND.onPrimary : BRAND.textSub,
                      }}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className="text-[10px] font-bold tracking-widest uppercase"
                          style={{ color: isActive ? BRAND.primary : BRAND.textMute }}
                        >
                          Step {s.step}
                        </span>
                      </div>
                      <div
                        className="text-sm font-bold truncate"
                        style={{ color: BRAND.text }}
                      >
                        {s.title}
                      </div>
                      <div
                        className="text-xs mt-0.5 truncate"
                        style={{ color: BRAND.textMute }}
                      >
                        {s.description}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* 右侧详情 */}
            <div
              className="lg:col-span-8 rounded-2xl p-6"
              style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}
            >
              {(() => {
                const s = TUTORIAL_STEPS[activeStep];
                const Icon = s.icon;
                return (
                  <div key={activeStep} className="animate-fadeIn">
                    <div className="flex items-center gap-3 mb-4">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center"
                        style={{ backgroundColor: BRAND.primaryLt, color: BRAND.primary }}
                      >
                        <Icon className="w-6 h-6" />
                      </div>
                      <div>
                        <div
                          className="text-[10px] font-bold tracking-widest uppercase"
                          style={{ color: BRAND.textMute }}
                        >
                          Step {s.step} of {TUTORIAL_STEPS.length}
                        </div>
                        <h3 className="text-xl font-bold" style={{ color: BRAND.text }}>
                          {s.title}
                        </h3>
                      </div>
                    </div>
                    <p className="text-sm leading-relaxed mb-4" style={{ color: BRAND.textSub }}>
                      {s.detail}
                    </p>
                    <div
                      className="rounded-xl p-4"
                      style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}
                    >
                      <div
                        className="text-[10px] font-bold tracking-widest uppercase mb-2 flex items-center gap-1.5"
                        style={{ color: BRAND.primary }}
                      >
                        <Lightbulb className="w-3 h-3" />
                        操作提示
                      </div>
                      <ul className="space-y-1.5">
                        {s.tips.map((tip, i) => (
                          <li
                            key={i}
                            className="text-xs flex items-start gap-2"
                            style={{ color: BRAND.textSub }}
                          >
                            <CheckCircle2
                              className="w-3.5 h-3.5 shrink-0 mt-0.5"
                              style={{ color: BRAND.success }}
                            />
                            <span>{tip}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="flex items-center justify-between mt-4">
                      <button
                        onClick={() =>
                          setActiveStep((s) => (s - 1 + TUTORIAL_STEPS.length) % TUTORIAL_STEPS.length)
                        }
                        className="px-3 h-9 text-xs rounded-lg"
                        style={{ backgroundColor: BRAND.card, color: BRAND.textSub, border: `1px solid ${BRAND.border}` }}
                      >
                        ← 上一步
                      </button>
                      <span className="text-xs" style={{ color: BRAND.textMute }}>
                        {activeStep + 1} / {TUTORIAL_STEPS.length}
                      </span>
                      <button
                        onClick={() => setActiveStep((s) => (s + 1) % TUTORIAL_STEPS.length)}
                        className="px-3 h-9 text-xs rounded-lg font-bold"
                        style={{ backgroundColor: BRAND.primary, color: BRAND.onPrimary }}
                      >
                        下一步 →
                      </button>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      </section>

      {/* ===== 5. FAQ ===== */}
      <section className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
          <div>
            <div
              className="text-[10px] font-bold tracking-widest uppercase mb-1"
              style={{ color: BRAND.textMute }}
            >
              常见问题
            </div>
            <h2 className="text-2xl font-bold" style={{ color: BRAND.text }}>
              买币 FAQ
            </h2>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {/* 分类过滤 */}
            {(['全部', '流程', '费用', '安全', '合规'] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => setFaqCategory(cat)}
                className="text-xs px-3 h-8 rounded-lg transition-all"
                style={{
                  backgroundColor: faqCategory === cat ? BRAND.primaryLt : BRAND.card,
                  color: faqCategory === cat ? BRAND.primary : BRAND.textSub,
                  border: `1px solid ${faqCategory === cat ? BRAND.primary : BRAND.border}`,
                }}
              >
                {cat}
              </button>
            ))}
            {/* 排序 */}
            <button
              onClick={() => setFaqSort(faqSort === 'default' ? 'category' : 'default')}
              className="text-xs px-3 h-8 rounded-lg inline-flex items-center gap-1.5"
              style={{ backgroundColor: BRAND.card, color: BRAND.textSub, border: `1px solid ${BRAND.border}` }}
            >
              <ArrowUpDown className="w-3 h-3" />
              {faqSort === 'default' ? '默认顺序' : '按分类排序'}
            </button>
          </div>
        </div>

        <div className="space-y-2">
          {filteredFaqs.length === 0 ? (
            <div
              className="rounded-xl p-8 text-center"
              style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}
            >
              <HelpCircle className="w-8 h-8 mx-auto mb-2" style={{ color: BRAND.textMute }} />
              <p className="text-sm" style={{ color: BRAND.textMute }}>
                当前分类下暂无 FAQ
              </p>
            </div>
          ) : (
            filteredFaqs.map((f, i) => (
              <div
                key={i}
                className="rounded-xl overflow-hidden"
                style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full text-left px-5 py-4 flex items-start gap-3"
                >
                  <span
                    className="text-[10px] font-bold px-2 py-0.5 rounded shrink-0 mt-0.5"
                    style={{ backgroundColor: BRAND.primaryLt, color: BRAND.primary }}
                  >
                    {f.category}
                  </span>
                  <span className="flex-1 text-sm font-semibold" style={{ color: BRAND.text }}>
                    {f.q}
                  </span>
                  <ChevronDown
                    className="w-4 h-4 shrink-0 transition-transform"
                    style={{
                      color: BRAND.textMute,
                      transform: openFaq === i ? 'rotate(180deg)' : 'rotate(0deg)',
                    }}
                  />
                </button>
                {openFaq === i && (
                  <div
                    className="px-5 py-4 text-sm leading-relaxed"
                    style={{ color: BRAND.textSub, borderTop: `1px solid ${BRAND.border}` }}
                  >
                    {f.a}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </section>

      {/* ===== 6. 安全提示条 ===== */}
      <section
        className="py-8"
        style={{ backgroundColor: BRAND.card, borderTop: `1px solid ${BRAND.border}` }}
      >
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              icon: Shield,
              title: '平台 escrow 担保',
              desc: 'P2P 交易由平台代管资金，商家放币后自动划转',
            },
            {
              icon: AlertTriangle,
              title: '数字资产价格波动',
              desc: '请关注成交时机，理性投资',
            },
            {
              icon: Clock,
              title: '订单有效期',
              desc: '15-30 分钟内完成支付，超时自动取消',
            },
          ].map((s, i) => {
            const Icon = s.icon;
            return (
              <div key={i} className="flex items-start gap-3">
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                  style={{ backgroundColor: BRAND.primaryLt, color: BRAND.primary }}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-sm font-bold mb-0.5" style={{ color: BRAND.text }}>
                    {s.title}
                  </div>
                  <div className="text-xs" style={{ color: BRAND.textMute }}>
                    {s.desc}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ===== 7. CTA 注册引导 ===== */}
      <section className="max-w-7xl mx-auto px-6 py-12">
        <div
          className="rounded-2xl p-8 flex flex-col md:flex-row items-center justify-between gap-6"
          style={{
            background: `linear-gradient(135deg, ${BRAND.primaryLt} 0%, ${BRAND.card} 100%)`,
            border: `1px solid ${BRAND.border}`,
          }}
        >
          <div>
            <h3 className="text-xl font-bold mb-1" style={{ color: BRAND.text }}>
              准备好开始买币了吗？
            </h3>
            <p className="text-sm" style={{ color: BRAND.textSub }}>
              注册后完成 KYC，5 分钟内即可首次买币
            </p>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="/auth/register"
              className="px-5 h-11 inline-flex items-center text-sm font-bold rounded-lg"
              style={{ backgroundColor: BRAND.primaryContainer, color: BRAND.onPrimary }}
            >
              立即注册
              <ArrowRight className="w-4 h-4 ml-2" />
            </a>
            <a
              href="/portal-preview/fees"
              className="px-5 h-11 inline-flex items-center text-sm font-semibold rounded-lg"
              style={{ backgroundColor: BRAND.bg, color: BRAND.text, border: `1px solid ${BRAND.border}` }}
            >
              查看费率
            </a>
          </div>
        </div>
      </section>

      {/* ===== Search Drawer ===== */}
      {searchOpen && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4"
          style={{ backgroundColor: BRAND.overlay }}
          onClick={() => setSearchOpen(false)}
        >
          <div
            className="w-full max-w-2xl rounded-2xl shadow-2xl"
            style={{ backgroundColor: BRAND.cardElevated, border: `1px solid ${BRAND.border}` }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="flex items-center gap-3 px-5 py-4"
              style={{ borderBottom: `1px solid ${BRAND.border}` }}
            >
              <Search className="w-5 h-5" style={{ color: BRAND.textMute }} />
              <input
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索买币通道、教程、FAQ…"
                className="flex-1 outline-none bg-transparent text-sm"
                style={{ color: BRAND.text }}
              />
              <kbd
                className="text-[10px] px-1.5 py-0.5 rounded font-mono"
                style={{
                  backgroundColor: BRAND.bgAlt,
                  border: `1px solid ${BRAND.border}`,
                  color: BRAND.textMute,
                }}
              >
                Esc
              </kbd>
            </div>
            <div className="p-5 max-h-96 overflow-y-auto custom-scrollbar">
              <p
                className="text-[10px] font-bold tracking-widest uppercase mb-3"
                style={{ color: BRAND.textMute }}
              >
                4 大买币通道（{filteredChannels.length}）
              </p>
              <div className="space-y-2">
                {filteredChannels.map((c) => {
                  const Icon = c.icon;
                  return (
                    <button
                      key={c.id}
                      onClick={() => {
                        setSearchOpen(false);
                        setDrawerChannel(c);
                      }}
                      className="w-full text-left rounded-lg p-3 flex items-center gap-3 transition-colors"
                      style={{ backgroundColor: BRAND.bg }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = BRAND.primaryLt)}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = BRAND.bg)}
                    >
                      <Icon className="w-4 h-4" style={{ color: BRAND.primary }} />
                      <div className="flex-1">
                        <div className="text-sm font-semibold" style={{ color: BRAND.text }}>
                          {c.title}
                        </div>
                        <div className="text-[10px]" style={{ color: BRAND.textMute }}>
                          {c.subtitle}
                        </div>
                      </div>
                      <StatusBadge status={c.status} />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== 通道详情 Drawer ===== */}
      {drawerChannel && (
        <Drawer channel={drawerChannel} onClose={() => setDrawerChannel(null)} />
      )}
    </div>
  );
}

// ============== Drawer 子组件 ==============

function Drawer({ channel, onClose }: { channel: BuyChannel; onClose: () => void }) {
  const Icon = channel.icon;

  // Drawer 打开时锁住 body 滚动
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-50"
      style={{ backgroundColor: BRAND.overlay }}
      onClick={onClose}
    >
      <div
        className="absolute top-0 right-0 h-full w-full max-w-xl overflow-y-auto custom-scrollbar animate-slideInRight"
        style={{ backgroundColor: BRAND.card, borderLeft: `1px solid ${BRAND.border}` }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div
          className="sticky top-0 z-10 px-6 py-4 flex items-center justify-between"
          style={{
            backgroundColor: BRAND.card,
            borderBottom: `1px solid ${BRAND.border}`,
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: BRAND.primaryLt, color: BRAND.primary }}
            >
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold" style={{ color: BRAND.text }}>
                {channel.title}
              </h2>
              <div className="text-xs" style={{ color: BRAND.textMute }}>
                {channel.subtitle}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-lg flex items-center justify-center transition-colors"
            style={{ backgroundColor: BRAND.bg, color: BRAND.textSub }}
            aria-label="关闭"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Drawer Content */}
        <div className="p-6 space-y-6">
          {/* 状态 + 描述 */}
          <div>
            <div className="mb-3">
              <StatusBadgeInline status={channel.status} />
            </div>
            <p className="text-sm leading-relaxed" style={{ color: BRAND.textSub }}>
              {channel.description}
            </p>
          </div>

          {/* 关键指标 */}
          <div>
            <div
              className="text-[10px] font-bold tracking-widest uppercase mb-3"
              style={{ color: BRAND.textMute }}
            >
              关键指标
            </div>
            <div className="grid grid-cols-3 gap-3">
              {channel.highlights.map((h) => (
                <div
                  key={h.label}
                  className="rounded-xl p-3 text-center"
                  style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}
                >
                  <div className="text-lg font-extrabold" style={{ color: BRAND.primary }}>
                    {h.value}
                  </div>
                  <div className="text-[10px] mt-1" style={{ color: BRAND.textMute }}>
                    {h.label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 核心能力 */}
          <div>
            <div
              className="text-[10px] font-bold tracking-widest uppercase mb-3"
              style={{ color: BRAND.textMute }}
            >
              核心能力
            </div>
            <ul className="space-y-2">
              {channel.features.map((f, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2 text-sm"
                  style={{ color: BRAND.textSub }}
                >
                  <CheckCircle2
                    className="w-4 h-4 shrink-0 mt-0.5"
                    style={{ color: BRAND.success }}
                  />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* 适合人群 */}
          <div>
            <div
              className="text-[10px] font-bold tracking-widest uppercase mb-3"
              style={{ color: BRAND.textMute }}
            >
              适合人群
            </div>
            <div className="flex flex-wrap gap-2">
              {getChannelAudience(channel.id).map((a) => (
                <span
                  key={a}
                  className="text-xs px-3 py-1.5 rounded-lg"
                  style={{
                    backgroundColor: BRAND.bg,
                    color: BRAND.textSub,
                    border: `1px solid ${BRAND.border}`,
                  }}
                >
                  {a}
                </span>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div
            className="rounded-xl p-4 flex items-center justify-between gap-3"
            style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}
          >
            <div className="text-xs" style={{ color: BRAND.textMute }}>
              {channel.status === 'OPEN'
                ? '该通道已开放，注册并完成 KYC 即可使用'
                : channel.status === 'BETA'
                ? '该通道处于内测阶段，可申请体验资格'
                : '该通道即将开放，可订阅通知'}
            </div>
            <button
              disabled={channel.status === 'SOON'}
              className="px-4 h-9 text-xs font-bold rounded-lg inline-flex items-center gap-1.5 disabled:opacity-50"
              style={{
                backgroundColor: BRAND.primaryContainer,
                color: BRAND.onPrimary,
              }}
            >
              {channel.cta}
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusBadgeInline({ status }: { status: ChannelStatus }) {
  const map = {
    OPEN: { label: '已开放', color: BRAND.success, bg: 'rgba(14, 203, 129, 0.12)' },
    BETA: { label: '内测中', color: BRAND.purple, bg: 'rgba(124, 58, 237, 0.12)' },
    SOON: { label: '即将开放', color: BRAND.info, bg: 'rgba(68, 219, 244, 0.12)' },
    MAINTENANCE: { label: '维护中', color: BRAND.warning, bg: 'rgba(255, 169, 64, 0.12)' },
  };
  const s = map[status];
  return (
    <span
      className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded"
      style={{ backgroundColor: s.bg, color: s.color }}
    >
      <CircleDot className="w-3 h-3" />
      {s.label}
    </span>
  );
}

function getChannelAudience(channelId: string): string[] {
  const map: Record<string, string[]> = {
    quick: ['新手用户', '小额买币 (<5万)', '追求速度'],
    p2p: ['中级用户', '中等金额 (5-50万)', '追求最优价格'],
    otc: ['机构客户', '高净值用户', '大额交易 (>50万)'],
    fiat: ['法币充值需求', '企业用户', 'T+1 结算可接受'],
  };
  return map[channelId] || [];
}

// ============== CountUp 子组件（数字滚动）==============

interface CountUpProps {
  value: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  short?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

function CountUp({ value, duration = 1200, prefix = '', suffix = '', short = false, className, style }: CountUpProps) {
  const [display, setDisplay] = useState(0);
  const rafRef = useRef<number | null>(null);
  const startRef = useRef<number | null>(null);

  useEffect(() => {
    startRef.current = null;
    const tick = (ts: number) => {
      if (startRef.current === null) startRef.current = ts;
      const elapsed = ts - startRef.current;
      const progress = Math.min(1, elapsed / duration);
      // easeOutCubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(value * eased));
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      }
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [value, duration]);

  return (
    <span className={className} style={style}>
      {prefix}
      {short && display >= 10000 ? formatShort(display) : display.toLocaleString()}
      {suffix}
    </span>
  );
}

function formatShort(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

export default PortalBuyCrypto;
