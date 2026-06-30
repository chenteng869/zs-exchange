﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  BarChart3,
  Scale,
  PiggyBank,
  Rocket,
  Image,
  Calculator,
  ArrowRight,
  Shield,
  Zap,
  Users,
  DollarSign,
  Sparkles,
} from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui';
import { fadeInUp, staggerContainer, staggerItem, hoverLift } from '@/lib/animations';

// ==================== 金融产品卡片数据 ====================
const FINANCE_PRODUCTS = [
  {
    id: 'spot',
    name: '现货交易',
    description: '安全便捷的加密货币买卖，支持主流币种，低手续费高流动性',
    href: '/trade/spot',
    icon: TrendingUp,
    color: 'from-success to-emerald-600',
    bgColor: 'bg-success/10',
    textColor: 'text-success',
    metricLabel: '日交易量',
    metricValue: '$2.8亿',
    tag: '热门',
  },
  {
    id: 'futures',
    name: '合约交易',
    description: '专业级永续合约，最高125倍杠杆，强平保护机制完善',
    href: '/trade/futures',
    icon: BarChart3,
    color: 'from-brand-primary to-purple-700',
    bgColor: 'bg-brand-500/10',
    textColor: 'text-brand-500',
    metricLabel: '杠杆上限',
    metricValue: '125x',
    tag: '进阶',
  },
  {
    id: 'margin',
    name: '杠杆交易',
    description: '灵活借贷系统，逐仓/全仓双模式，最高10倍杠杆放大收益',
    href: '/trade/margin',
    icon: Scale,
    color: 'from-warning to-amber-600',
    bgColor: 'bg-warning/10',
    textColor: 'text-warning',
    metricLabel: '杠杆上限',
    metricValue: '10x',
    tag: '稳健',
  },
  {
    id: 'defi',
    name: 'DeFi 赚钱',
    description: '链上流动性挖矿与质押服务，年化APR高达15%，灵活存取',
    href: '/defi/staking',
    icon: PiggyBank,
    color: 'from-info to-blue-600',
    bgColor: 'bg-info/10',
    textColor: 'text-info',
    metricLabel: '年化APR',
    metricValue: '最高15%',
    tag: '稳健收益',
  },
  {
    id: 'ido',
    name: 'IDO认购',
    description: '优质项目早期参与通道，热门项目首发抢购，潜力币种优先配售',
    href: '/ido',
    icon: Rocket,
    color: 'from-samoa to-yellow-600',
    bgColor: 'bg-samoa/10',
    textColor: 'text-samoa',
    metricLabel: '热门项目',
    metricValue: '12个',
    tag: '新上线',
  },
  {
    id: 'nft',
    name: 'NFT市场',
    description: '数字艺术品交易平台，独家藏品发行，二级市场自由流转',
    href: '/nft',
    icon: Image,
    color: 'from-pink-500 to-rose-600',
    bgColor: 'bg-pink-500/10',
    textColor: 'text-pink-400',
    metricLabel: '藏品数量',
    metricValue: '2,000+',
    tag: '创意',
  },
];

// ==================== 收益计算器配置 ====================
const YIELD_RATES = {
  spot: { label: '现货持有', rate: 0 }, // 现货本身无固定收益
  defi: { label: 'DeFi质押', rate: 0.12 }, // 年化12%
  ido: { label: 'IDO投资(预估)', rate: 0.35 }, // 预估年化35%
  savings: { label: '活期理财', rate: 0.05 }, // 年化5%
};

export default function FinancePage() {
  // ==================== 收益计算器状态 ====================
  const [inputAmount, setInputAmount] = useState<string>('10000');
  const [calcPeriod, setCalcPeriod] = useState<number>(365); // 天数

  // ==================== 计算各产品预估收益 ====================
  const yieldCalculations = useMemo(() => {
    const amount = parseFloat(inputAmount) || 0;
    const yearFraction = calcPeriod / 365;

    return Object.entries(YIELD_RATES).map(([key, config]) => ({
      key,
      label: config.label,
      rate: config.rate,
      estimatedReturn: amount * config.rate * yearFraction,
      totalAmount: amount + amount * config.rate * yearFraction,
    }));
  }, [inputAmount, calcPeriod]);

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-deep-900 pt-[72px]">
        {/* ==================== Hero区域 ==================== */}
        <motion.section
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
          className="relative overflow-hidden"
        >
          {/* 背景装饰 */}
          <div className="absolute inset-0 bg-gradient-to-b from-brand-primary/8 via-transparent to-transparent" />
          <div className="absolute top-20 left-1/4 w-64 h-64 bg-brand-500/5 rounded-full blur-3xl" />
          <div className="absolute top-40 right-1/4 w-48 h-48 bg-samoa/5 rounded-full blur-3xl" />

          <div className="max-w-[1400px] mx-auto px-4 lg:px-6 py-16 relative">
            <motion.div variants={fadeInUp} initial="hidden" animate="visible" className="text-center max-w-3xl mx-auto">
              {/* 徽章 */}
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-samoa/30 bg-samoa/10 mb-6">
                <span className="text-base">🇼🇸</span>
                <span className="text-xs font-medium text-samoa">萨摩亚持牌 · 合规保障</span>
                <Shield size={14} className="text-samoa" />
              </div>

              <h1 className="text-3xl md:text-4xl font-bold text-text-primary mb-4 leading-tight">
                多元化金融产品
                <span className="block mt-2 bg-gradient-to-r from-brand-primary to-samoa bg-clip-text text-transparent">
                  满足不同投资需求
                </span>
              </h1>
              <p className="text-text-secondary text-lg max-w-2xl mx-auto mb-8">
                ZS Exchange 提供完整的数字资产金融服务，从现货到衍生品，从DeFi到NFT，
                满足您的加密资产投资需求。
              </p>

              {/* 统计数据条 */}
              <div className="flex flex-wrap items-center justify-center gap-8 text-sm">
                {[
                  { icon: Users, value: '120万+', label: '全球用户' },
                  { icon: DollarSign, value: '$28亿+', label: '日交易额' },
                  { icon: Zap, value: '30+', label: '金融产品' },
                  { icon: Shield, value: '99.9%', label: '系统可用性' },
                ].map((stat) => (
                  <div key={stat.label} className="flex items-center gap-2">
                    <stat.icon size={16} className="text-brand-500" />
                    <span className="font-bold text-text-primary">{stat.value}</span>
                    <span className="text-text-muted">{stat.label}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </motion.section>

        {/* ==================== 产品卡片网格 (2x3) ==================== */}
        <section className="max-w-[1400px] mx-auto px-4 lg:px-6 py-12">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {FINANCE_PRODUCTS.map((product) => (
              <motion.div
                key={product.id}
                variants={staggerItem}
                whileHover={{ y: -8, transition: { duration: 0.3, ease: [0.25, 0.1, 0.25, 1] } }}
                whileTap={{ y: -2, transition: { duration: 0.1 } }}
                className={`group bg-deep-800 border border-deep-700 rounded-2xl overflow-hidden transition-all duration-300`}
              >
                {/* 卡片顶部渐变条 */}
                <div className={`h-1.5 bg-gradient-to-r ${product.color}`} />

                <div className="p-6">
                  {/* 头部：图标 + 名称 + 标签 */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-xl ${product.bgColor} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                        <product.icon size={24} className={product.textColor} />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-text-primary">{product.name}</h3>
                        <span className="inline-block mt-1 px-2 py-0.5 text-[10px] font-medium rounded-full bg-deep-900 text-text-muted">
                          {product.tag}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 描述文字 */}
                  <p className="text-sm text-text-secondary leading-relaxed mb-5 min-h-[44px]">
                    {product.description}
                  </p>

                  {/* 关键指标 */}
                  <div className="flex items-center justify-between p-3 bg-deep-900 rounded-xl mb-5">
                    <div>
                      <div className="text-[10px] text-text-muted uppercase tracking-wider">{product.metricLabel}</div>
                      <div className={`text-lg font-bold font-mono ${product.textColor}`}>{product.metricValue}</div>
                    </div>
                    <Sparkles size={18} className={`${product.textColor} opacity-50`} />
                  </div>

                  {/* CTA按钮 */}
                  <Button
                    variant="outline"
                    size="md"
                    className={`w-full !border-current hover:!${product.bgColor.replace('bg-', '')} transition-colors group-hover:!${product.textColor.includes('success') ? '!text-success' : product.textColor.includes('primary') ? '!text-brand-500' : ''}`}
                    rightIcon={<ArrowRight size={16} />}
                  >
                    立即体验
                  </Button>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </section>

        {/* ==================== 收益计算器 ==================== */}
        <section className="max-w-[1400px] mx-auto px-4 lg:px-6 pb-16">
          <motion.div
            variants={fadeInUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="bg-deep-800 border border-deep-700 rounded-2xl p-6 md:p-8"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-brand-500/15 flex items-center justify-center">
                <Calculator size={20} className="text-brand-500" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-text-primary">收益计算器</h2>
                <p className="text-xs text-text-muted">输入金额估算各产品预期收益（仅供参考）</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* 左侧：输入区 */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs text-text-muted mb-1.5">投资金额 (USDT)</label>
                  <input
                    type="number"
                    value={inputAmount}
                    onChange={(e) => setInputAmount(e.target.value)}
                    placeholder="请输入金额..."
                    className="w-full px-4 py-3 bg-deep-900 border border-deep-700 rounded-xl text-text-primary font-mono text-lg placeholder:text-text-muted focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500/50 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs text-text-muted mb-1.5">投资周期</label>
                  <div className="grid grid-cols-4 gap-2">
                    {[30, 90, 180, 365].map((days) => (
                      <button
                        key={days}
                        onClick={() => setCalcPeriod(days)}
                        className={`py-2 text-xs font-medium rounded-lg border transition-all duration-200 ${
                          calcPeriod === days
                            ? 'border-brand-500 bg-brand-500/10 text-brand-500'
                            : 'border-deep-600 text-text-secondary hover:border-deep-500 bg-deep-900'
                        }`}
                      >
                        {days >= 365 ? '1年' : `${days}天`}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 总览信息 */}
                <div className="p-4 bg-deep-900 rounded-xl space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-text-muted">本金</span>
                    <span className="font-mono text-text-primary">${parseFloat(inputAmount || '0').toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-text-muted">周期</span>
                    <span className="text-text-primary">{calcPeriod}天</span>
                  </div>
                  <div className="border-t border-deep-700 pt-2 mt-2">
                    <div className="flex justify-between text-sm font-medium">
                      <span className="text-text-muted">最佳预期总回报</span>
                      <span className="font-mono text-samoa">
                        ${(yieldCalculations.reduce((max, item) => Math.max(max, item.totalAmount), 0)).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 右侧：各产品收益对比 */}
              <div className="lg:col-span-2">
                <div className="space-y-3">
                  {yieldCalculations.map((item) => {
                    if (item.rate === 0) return null; // 跳过现货

                    const maxReturn = yieldCalculations.reduce(
                      (m, i) => Math.max(m, i.estimatedReturn),
                      0
                    );
                    const barWidth = maxReturn > 0 ? (item.estimatedReturn / maxReturn) * 100 : 0;

                    return (
                      <div key={item.key} className="p-4 bg-deep-900 rounded-xl">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-text-primary">{item.label}</span>
                            <span className="text-xs px-1.5 py-0.5 rounded bg-brand-500/10 text-brand-500 font-mono">
                              {(item.rate * 100).toFixed(0)}% APY
                            </span>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-mono font-semibold text-success">
                              +${item.estimatedReturn.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                            </div>
                            <div className="text-[10px] text-text-muted font-mono">
                              总计 ${item.totalAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                            </div>
                          </div>
                        </div>
                        {/* 收益条形图可视化 */}
                        <div className="w-full h-2 bg-deep-800 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${barWidth}%` }}
                            transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
                            className={`h-full rounded-full ${
                              item.rate >= 0.3
                                ? 'bg-gradient-to-r from-samoa to-yellow-400'
                                : item.rate >= 0.1
                                  ? 'bg-gradient-to-r bg-brand-500 text-[#1A1D24]'
                                  : 'bg-gradient-to-r from-success to-emerald-400'
                            }`}
                          />
                        </div>
                      </div>
                    );
                  })}

                  {/* 免责声明 */}
                  <p className="mt-4 text-[11px] text-text-muted text-center">
                    以上收益为预估值，实际收益受市场波动影响。过往表现不代表未来收益。
                    投资有风险，入市需谨慎。
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </section>
      </main>
      <Footer />
    </>
  );
}
