'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  Percent,
  Clock,
  Shield,
  Zap,
  Coins,
  ArrowRight,
  Star,
  Lock,
  BarChart3,
  Wallet,
  CheckCircle2,
} from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { fadeInUp, staggerContainer, staggerItem } from '@/lib/animations';

// ==================== 产品分类Tab选项 ====================
const PRODUCT_CATEGORIES = [
  { id: 'all', label: '全部' },
  { id: 'staking', label: '质押', icon: <Lock size={14} /> },
  { id: 'liquidity', label: '流动性', icon: <Coins size={14} /> },
  { id: 'lending', label: '借贷', icon: <Wallet size={14} /> },
  { id: 'farming', label: 'Farming', icon: <Zap size={14} /> },
];

// ==================== DeFi产品Mock数据 ====================
interface DefiProduct {
  id: string;
  name: string;
  description: string;
  category: string;
  aprRange: string; // APR范围
  tvl: string; // 总锁仓价值
  riskLevel: number; // 风险等级 1-5
  icon: React.ReactNode;
  highlight?: boolean; // 是否高亮推荐
  ctaLabel: string;
  ctaHref: string;
}

const DEFI_PRODUCTS: DefiProduct[] = [
  {
    id: 'flexible-staking',
    name: '灵活质押',
    description: 'ETH/BTC/USDT等多币种灵活质押，随时存取',
    category: 'staking',
    aprRange: '5.2%~12.8%',
    tvl: '$128M',
    riskLevel: 1,
    icon: <Coins size={24} className="text-brand-500" />,
    ctaLabel: '立即质押',
    ctaHref: '/defi/staking',
  },
  {
    id: 'fixed-staking',
    name: '定期理财',
    description: '30/60/90/180天锁仓理财，锁定更高收益',
    category: 'staking',
    aprRange: '最高18.5%',
    tvl: '$86M',
    riskLevel: 2,
    icon: <Lock size={24} className="text-license" />,
    highlight: true,
    ctaLabel: '查看方案',
    ctaHref: '/defi/staking',
  },
  {
    id: 'liquidity-mining',
    name: '流动性挖矿',
    description: '提供LP代币赚交易手续费+项目代币激励',
    category: 'farming',
    aprRange: '8%~45%',
    tvl: '$45M',
    riskLevel: 3,
    icon: <Zap size={24} className="text-success" />,
    ctaLabel: '参与挖矿',
    ctaHref: '/defi/staking',
  },
  {
    id: 'lending-market',
    name: '借贷市场',
    description: '存币生息赚取利息 / 借款获取杠杆交易资金',
    category: 'lending',
    aprRange: '存款3%~8% | 借款5%~15%',
    tvl: '$62M',
    riskLevel: 3,
    icon: <Wallet size={24} className="text-info" />,
    ctaLabel: '进入市场',
    ctaHref: '/defi/staking',
  },
  {
    id: 'dual-investment',
    name: '双币投资',
    description: '保本+收益增强策略，年化收益可达25%',
    category: 'staking',
    aprRange: '8%~25%',
    tvl: '$23M',
    riskLevel: 4,
    icon: <BarChart3 size={24} className="text-warning" />,
    ctaLabel: '了解详情',
    ctaHref: '/defi/staking',
  },
  {
    id: 'node-staking',
    name: '节点质押',
    description: '成为验证节点参与网络共识，需要32 ETH起',
    category: 'staking',
    aprRange: '15%~30%',
    tvl: '$38M',
    riskLevel: 2,
    icon: <Shield size={24} className="text-samoa" />,
    ctaLabel: '申请节点',
    ctaHref: '/defi/staking',
  },
];

// ==================== 安全保障数据 ====================
const SECURITY_FEATURES = [
  {
    icon: <Shield size={20} className="text-brand-500" />,
    title: '智能合约审计',
    description: '所有DeFi合约均通过Certik、SlowMist等专业安全机构审计',
  },
  {
    icon: <Lock size={20} className="text-success" />,
    title: '多重签名钱包',
    description: '大额操作需多签确认，防止单点风险和内部作恶',
  },
  {
    icon: <CheckCircle2 size={20} className="text-samoa" />,
    title: '保险基金池',
    description: '从交易手续费中提取保险基金，覆盖极端行情损失',
  },
];

// ==================== 风险星级渲染组件 ====================
function RiskStars({ level }: { level: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          size={12}
          className={
            i < level
              ? level <= 2
                ? 'text-success fill-success'
                : level <= 3
                ? 'text-warning fill-warning'
                : 'text-danger fill-danger'
              : 'text-deep-600'
          }
        />
      ))}
      <span className={`ml-1 text-xs ${
        level <= 2 ? 'text-success' : level <= 3 ? 'text-warning' : 'text-danger'
      }`}>
        {level <= 2 ? '低风险' : level <= 3 ? '中风险' : '高风险'}
      </span>
    </div>
  );
}

// ==================== 主页面组件 ====================
export default function DeFiPage() {
  const [activeCategory, setActiveCategory] = useState('all');

  // 根据分类筛选产品
  const filteredProducts = useMemo(() => {
    if (activeCategory === 'all') return DEFI_PRODUCTS;
    return DEFI_PRODUCTS.filter((p) => p.category === activeCategory);
  }, [activeCategory]);

  // 计算总TVL
  const totalTvl = useMemo(() => {
    let sum = 0;
    DEFI_PRODUCTS.forEach((p) => {
      const num = parseFloat(p.tvl.replace('$', '').replace('M', ''));
      sum += num;
    });
    return `$${sum.toFixed(0)}M`;
  }, []);

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-deep-900 pt-[72px]">
        {/* ==================== Hero 区域 ==================== */}
        <motion.section
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
          className="relative overflow-hidden"
        >
          {/* 背景装饰 */}
          <div className="absolute inset-0 bg-gradient-to-b from-brand-primary/10 via-transparent to-transparent" />
          <div className="absolute top-20 left-1/4 w-96 h-96 bg-brand-500/10 rounded-full blur-[120px]" />
          <div className="absolute top-40 right-1/4 w-64 h-64 bg-samoa/10 rounded-full blur-[100px]" />

          <div className="max-w-[1400px] mx-auto px-4 lg:px-6 py-16 md:py-24 relative z-10">
            {/* 萨摩亚合规徽章 */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-samoa/40 bg-samoa/10 mb-6"
            >
              <span className="text-base">🇼🇸</span>
              <span className="text-sm font-medium text-samoa">萨摩亚持牌交易所 · DeFi产品受监管框架保护</span>
              <Shield size={14} className="text-samoa" />
            </motion.div>

            {/* 主标题 */}
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-text-primary mb-4 tracking-tight">
              DeFi{' '}
              <span className="bg-gradient-to-r bg-brand-500 text-[#1A1D24] bg-clip-text text-transparent">
                理财中心
              </span>
            </h1>
            <p className="text-lg md:text-xl text-text-secondary max-w-2xl mb-8">
              多元化DeFi产品矩阵 · 萨摩亚合规运营保障
            </p>

            {/* 核心数据指标 */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 max-w-3xl">
              {[
                { label: '总锁仓价值(TVL)', value: totalTvl, color: 'text-brand-500' },
                { label: '活跃用户数', value: '48K+', color: 'text-success' },
                { label: '累计发放收益', value: '$12.8M', color: 'text-license' },
                { label: '支持币种', value: '60+', color: 'text-info' },
              ].map((stat) => (
                <div key={stat.label} className="bg-deep-800/60 backdrop-blur-sm border border-deep-700 rounded-xl p-4">
                  <div className={`text-xl md:text-2xl font-bold font-mono ${stat.color}`}>
                    {stat.value}
                  </div>
                  <div className="text-xs text-text-muted mt-1">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </motion.section>

        {/* ==================== 产品分类Tab + 产品卡片网格 ==================== */}
        <motion.section
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="max-w-[1400px] mx-auto px-4 lg:px-6 py-12"
        >
          {/* 分类Tab栏 */}
          <div className="flex flex-wrap gap-2 mb-8">
            {PRODUCT_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  activeCategory === cat.id
                    ? 'bg-brand-500 text-white shadow-glow-purple'
                    : 'bg-deep-800 text-text-secondary hover:text-text-primary border border-deep-700 hover:border-deep-600'
                }`}
              >
                {cat.icon}
                {cat.label}
              </button>
            ))}
          </div>

          {/* 产品卡片网格 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((product) => (
              <motion.div
                key={product.id}
                variants={staggerItem}
                className="relative"
              >
                {/* 推荐标签 */}
                {product.highlight && (
                  <div className="absolute -top-3 left-4 z-10">
                    <Badge variant="license" pulse>热门推荐</Badge>
                  </div>
                )}

                <Card
                  variant={product.highlight ? 'license-gold' : 'default'}
                  padding="lg"
                  className="h-full flex flex-col"
                >
                  {/* 卡片头部：图标 + 名称 */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-deep-700 flex items-center justify-center">
                        {product.icon}
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-text-primary">{product.name}</h3>
                        <p className="text-xs text-text-muted mt-0.5">{product.description}</p>
                      </div>
                    </div>
                  </div>

                  {/* APR 大字高亮展示 */}
                  <div className="my-4 py-4 px-4 bg-deep-700/50 rounded-lg text-center">
                    <div className="text-xs text-text-muted mb-1">预期年化收益率 (APR)</div>
                    <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-success to-emerald-400 bg-clip-text text-transparent font-mono">
                      {product.aprRange}
                    </div>
                  </div>

                  {/* TVL + 风险等级 */}
                  <div className="flex items-center justify-between mb-4 mt-auto">
                    <div>
                      <span className="text-xs text-text-muted">总锁仓价值</span>
                      <div className="text-base font-semibold text-text-primary font-mono">
                        {product.tvl}
                      </div>
                    </div>
                    <RiskStars level={product.riskLevel} />
                  </div>

                  {/* CTA按钮 */}
                  <Link href={product.ctaHref}>
                    <Button
                      variant={product.highlight ? 'license-gold' : 'primary'}
                      size="md"
                      className="w-full"
                      rightIcon={<ArrowRight size={16} />}
                    >
                      {product.ctaLabel}
                    </Button>
                  </Link>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* 无结果提示 */}
          {filteredProducts.length === 0 && (
            <div className="text-center py-16">
              <p className="text-text-muted">该分类暂无产品，请选择其他分类</p>
            </div>
          )}
        </motion.section>

        {/* ==================== DeFi 安全保障说明 ==================== */}
        <motion.section
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
          className="max-w-[1400px] mx-auto px-4 lg:px-6 pb-16"
        >
          <Card variant="default" padding="lg">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-text-primary mb-2 flex items-center justify-center gap-2">
                <Shield size={24} className="text-brand-500" />
                DeFi 安全保障体系
              </h2>
              <p className="text-text-secondary text-sm">
                ZS Exchange 采用多层安全架构，保护用户资产安全
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {SECURITY_FEATURES.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  variants={staggerItem}
                  className="text-center p-6 bg-deep-700/30 rounded-xl border border-deep-700/50"
                >
                  <div className="w-14 h-14 rounded-full bg-deep-800 flex items-center justify-center mx-auto mb-4">
                    {feature.icon}
                  </div>
                  <h3 className="text-base font-semibold text-text-primary mb-2">{feature.title}</h3>
                  <p className="text-sm text-text-secondary leading-relaxed">{feature.description}</p>
                </motion.div>
              ))}
            </div>

            {/* 合规声明 */}
            <div className="mt-8 pt-6 border-t border-deep-700/50 text-center">
              <p className="text-xs text-text-muted">
                投资有风险，入市需谨慎 · DeFi产品收益不保证 · 过往业绩不代表未来表现
              </p>
              <p className="text-xs text-samoa mt-2">
                中萨数字科技集团 · 萨摩亚持牌交易所牌照号: EX-2024-001
              </p>
            </div>
          </Card>
        </motion.section>
      </main>
      <Footer />
    </>
  );
}
