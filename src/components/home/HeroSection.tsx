'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { TrendingUp, BarChart3, Shield, Award, ArrowRight, Activity } from 'lucide-react';
import { fadeInUp, staggerContainer, staggerItem } from '@/lib/animations';
import Button from '@/components/ui/Button';
import AnimatedCounter from '@/components/ui/AnimatedCounter';
import { useTicker } from '@/hooks/useTicker';
import { usePriceAnimation } from '@/hooks/usePriceAnimation';

/**
 * ZS Exchange HeroSection v7 (Aurora Premium)
 * 升级自 v6 Royal Premium - 极光尊享
 *
 * 调研：Stripe 2026 / Coinbase Advanced / Bybit V5
 * 关键升级：
 *   1. 抛弃纯色 #0B1124 → 多层极光渐变网格（Aurora Mesh）
 *   2. 新增 5 个浮动光斑（aurora-orb）呼吸动画
 *   3. 主标题用 v7 极光三色渐变（金→青→紫）
 *   4. 玻璃卡片升级 backdrop-filter: blur(24px) saturate(180%)
 *   5. CTA 用 v7 btn-aurora-cta（蓝紫渐变光晕）
 *   6. 顶部 aurora-beam-top 极光三色光带
 *   7. 网格背景从 v6 死板灰 → v7 细腻极光灰
 */

const KEY_METRICS = [
  {
    id: 'depth',
    icon: BarChart3,
    value: 2.8,
    suffix: 'B',
    label: '市场深度',
    prefix: '$',
    decimals: 1,
  },
  {
    id: 'volume',
    icon: TrendingUp,
    value: 1.2,
    suffix: 'M',
    label: '24h成交笔数',
    decimals: 1,
  },
  {
    id: 'license',
    icon: Shield,
    value: '<5',
    suffix: '',
    label: '全球双牌照机构',
    isStatic: true,
  },
];

export default function HeroSection() {
  const { getBySymbol, isConnected } = useTicker({
    symbols: ['BTCUSDT'],
    interval: 1000,
  });

  const btcTicker = getBySymbol('BTCUSDT');
  const btcPriceAnim = usePriceAnimation(btcTicker?.price ?? 67234.56, {
    duration: 500,
    decimals: 2,
  });

  const priceChange = btcTicker?.changePercent24h ?? 2.34;
  const isPositive = priceChange >= 0;
  const volumeAnim = usePriceAnimation(12.8, { duration: 3000, decimals: 1 });

  return (
    <section
      className="relative min-h-[92vh] flex items-center overflow-hidden pt-20 aurora-bg"
      style={{ background: 'transparent' }}
    >
      {/* ============ v7 极光光斑层（5个浮动呼吸）============ */}
      <div
        aria-hidden
        className="aurora-orb aurora-orb-gold anim-aurora-flow"
        style={{ top: '-100px', left: '15%', width: '700px', height: '700px' }}
      />
      <div
        aria-hidden
        className="aurora-orb aurora-orb-violet anim-aurora-drift"
        style={{ top: '20%', right: '-100px', width: '600px', height: '600px' }}
      />
      <div
        aria-hidden
        className="aurora-orb aurora-orb-cyan anim-aurora-rise"
        style={{ bottom: '20%', left: '30%', width: '500px', height: '500px' }}
      />
      <div
        aria-hidden
        className="aurora-orb aurora-orb-blue anim-aurora-flow"
        style={{ top: '40%', left: '5%', width: '450px', height: '450px', animationDelay: '4s' }}
      />
      <div
        aria-hidden
        className="aurora-orb aurora-orb-emerald anim-aurora-drift"
        style={{ bottom: '-50px', right: '20%', width: '500px', height: '500px', animationDelay: '7s' }}
      />

      {/* 极光网格背景 v7 */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none grid-aurora"
      />

      {/* 顶部极光三色光带 v7 */}
      <div
        aria-hidden
        className="absolute top-0 left-0 right-0 h-[2px] z-20"
        style={{
          background: 'linear-gradient(90deg, transparent 0%, rgba(240, 185, 11, 0.50) 20%, rgba(56, 189, 248, 0.90) 50%, rgba(167, 139, 250, 0.50) 80%, transparent 100%)',
          boxShadow: '0 0 24px rgba(56, 189, 248, 0.50), 0 0 48px rgba(240, 185, 11, 0.30)',
        }}
      />

      {/* 主内容容器 */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-12 lg:py-20"
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* 左侧：实时价格卡片 — v7 极光玻璃卡 */}
          <motion.div variants={fadeInUp} className="space-y-6">
            <div className="relative group">
              {/* v7 极光玻璃卡片 */}
              <div
                className="absolute inset-0 rounded-2xl transition-shadow duration-500"
                style={{
                  background: 'linear-gradient(180deg, rgba(26, 36, 86, 0.55) 0%, rgba(21, 34, 74, 0.70) 100%)',
                  backdropFilter: 'blur(24px) saturate(180%)',
                  WebkitBackdropFilter: 'blur(24px) saturate(180%)',
                  border: '1px solid rgba(148, 163, 184, 0.20)',
                  boxShadow: '0 8px 32px rgba(15, 27, 61, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
                }}
              />
              {/* 顶部金色装饰线 v7 */}
              <div
                aria-hidden
                className="absolute top-0 left-6 right-6 h-px z-10 rounded-full"
                style={{
                  background: 'linear-gradient(90deg, transparent 0%, rgba(240, 185, 11, 0.40) 20%, rgba(252, 213, 53, 0.90) 50%, rgba(240, 185, 11, 0.40) 80%, transparent 100%)',
                  boxShadow: '0 0 12px rgba(240, 185, 11, 0.50)',
                }}
              />
              {/* 悬浮时极光高光 */}
              <div
                className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{
                  background: 'linear-gradient(135deg, rgba(240, 185, 11, 0.08) 0%, rgba(56, 189, 248, 0.08) 100%)',
                  boxShadow: '0 0 40px rgba(56, 189, 248, 0.20), inset 0 0 0 1px rgba(240, 185, 11, 0.20)',
                }}
              />

              <div className="relative p-8 lg:p-10 rounded-2xl">
                {/* 交易对标签 + 实时状态 */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center"
                      style={{
                        background: 'linear-gradient(135deg, rgba(247, 147, 26, 0.18) 0%, rgba(240, 185, 11, 0.10) 100%)',
                        border: '1px solid rgba(247, 147, 26, 0.30)',
                      }}
                    >
                      <span className="font-bold text-sm" style={{ color: '#F7931A' }}>BTC</span>
                    </div>
                    <span className="text-sm font-medium tracking-wide uppercase" style={{ color: '#B4C0E0' }}>
                      BTC / USDT
                    </span>
                  </div>
                  <div
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold ${
                      isPositive ? 'text-up' : 'text-down'
                    }`}
                    style={{
                      background: isPositive
                        ? 'rgba(22, 199, 132, 0.12)'
                        : 'rgba(234, 57, 67, 0.12)',
                      border: isPositive
                        ? '1px solid rgba(22, 199, 132, 0.30)'
                        : '1px solid rgba(234, 57, 67, 0.30)',
                    }}
                  >
                    <span>{isPositive ? '+' : ''}{priceChange.toFixed(2)}%</span>
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        isConnected ? 'animate-pulse' : ''
                      }`}
                      style={{ background: isConnected ? '#16C784' : '#4A5680' }}
                    />
                  </div>
                </div>

                {/* 主价格显示 */}
                <div className="space-y-3">
                  <div className="flex items-baseline gap-2">
                    <span className="text-xl font-medium" style={{ color: '#B4C0E0' }}>$</span>
                    <span
                      className="text-5xl lg:text-6xl font-bold tracking-tight tabular-nums"
                      style={{ color: '#F8FAFC' }}
                    >
                      <AnimatedCounter
                        value={btcPriceAnim.displayValue}
                        decimals={2}
                      />
                    </span>
                    {btcPriceAnim.isAnimating && (
                      <span
                        className="text-lg font-semibold"
                        style={{ color: btcPriceAnim.direction === 'up' ? '#16C784' : '#EA3943' }}
                      >
                        {btcPriceAnim.direction === 'up' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>

                  {/* 24h 数据行 */}
                  <div className="flex items-center gap-4 text-sm pt-1">
                    <span className="flex items-center gap-1.5" style={{ color: '#B4C0E0' }}>
                      <span>24h Vol</span>
                      <span className="font-medium tabular-nums" style={{ color: '#F8FAFC' }}>
                        ${volumeAnim.displayValue.toFixed(1)}B
                      </span>
                    </span>
                    <span style={{ color: 'rgba(148, 163, 184, 0.30)' }}>|</span>
                    <span className="flex items-center gap-1.5" style={{ color: '#B4C0E0' }}>
                      <span>High</span>
                      <span className="font-medium tabular-nums text-xs" style={{ color: '#16C784' }}>
                        68,450.00
                      </span>
                    </span>
                    <span style={{ color: 'rgba(148, 163, 184, 0.30)' }}>|</span>
                    <span className="flex items-center gap-1.5" style={{ color: '#B4C0E0' }}>
                      <span>Low</span>
                      <span className="font-medium tabular-nums text-xs" style={{ color: '#EA3943' }}>
                        65,120.30
                      </span>
                    </span>
                  </div>
                </div>

                {/* 快捷操作按钮 v7 */}
                <div className="flex items-center gap-3 mt-8 pt-6 divider-aurora">
                  <Link href="/trade/spot" className="group/btn">
                    <Button
                      size="sm"
                      leftIcon={<TrendingUp className="w-4 h-4" />}
                      className="btn-aurora-gold"
                    >
                      现货交易
                    </Button>
                  </Link>
                  <Link href="/trade/futures">
                    <Button
                      variant="outline"
                      size="sm"
                      style={{
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(148, 163, 184, 0.25)',
                        color: '#F8FAFC',
                        backdropFilter: 'blur(12px)',
                        WebkitBackdropFilter: 'blur(12px)',
                      }}
                    >
                      合约交易
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>

          {/* 右侧：品牌声明区 — v7 极光三色渐变标题 */}
          <motion.div variants={fadeInUp} className="space-y-8 lg:pl-8">
            {/* 牌照标识 - v7 极光徽章 */}
            <div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full badge-aurora"
            >
              <Award className="w-4 h-4" style={{ color: '#FCD535' }} />
              <span
                className="text-sm font-semibold tracking-wide"
                style={{
                  background: 'linear-gradient(135deg, #FCD535 0%, #38BDF8 50%, #A78BFA 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                萨摩亚政府双牌照
              </span>
            </div>

            {/* 主标题 — v7 极光三色渐变 */}
            <div className="space-y-4">
              <h1
                className="text-4xl lg:text-5xl xl:text-6xl font-bold leading-[1.1] tracking-tight"
                style={{ color: '#F8FAFC' }}
              >
                数字资产
                <br />
                <span
                  style={{
                    background: 'linear-gradient(135deg, #FCD535 0%, #38BDF8 50%, #A78BFA 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    textShadow: '0 0 60px rgba(56, 189, 248, 0.30)',
                  }}
                >
                  交易平台
                </span>
              </h1>

              <p
                className="text-base lg:text-lg leading-relaxed max-w-lg"
                style={{ color: '#B4C0E0' }}
              >
                持有萨摩亚数字资产交易所与证券交易所双牌照，
                为全球用户提供合规、安全、高效的数字资产交易服务。
              </p>
            </div>

            {/* CTA 按钮组 v7 - 极光蓝紫 + 金色 */}
            <div className="flex flex-wrap items-center gap-4">
              <Link href="/trade/spot" className="group/cta">
                <Button
                  size="lg"
                  leftIcon={<TrendingUp className="w-5 h-5" />}
                  rightIcon={
                    <ArrowRight className="w-5 h-5 group-hover/cta:translate-x-0.5 transition-transform" />
                  }
                  className="btn-aurora-cta"
                >
                  进入交易
                </Button>
              </Link>
              <Link href="/licenses">
                <Button
                  variant="outline"
                  size="lg"
                  leftIcon={<Shield className="w-5 h-5" />}
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(148, 163, 184, 0.25)',
                    color: '#F8FAFC',
                    backdropFilter: 'blur(12px)',
                    WebkitBackdropFilter: 'blur(12px)',
                  }}
                >
                  了解牌照详情
                </Button>
              </Link>
            </div>

            {/* 监管信息 */}
            <div className="pt-4 divider-aurora">
              <p className="text-xs leading-relaxed" style={{ color: '#B4C0E0' }}>
                牌照编号：DSAEX-2024-001 / DSAST-2024-002
                <br />
                <span style={{ color: '#F8FAFC' }}>受萨摩亚金融监管局监管</span>
              </p>
            </div>
          </motion.div>
        </div>

        {/* 底部：关键指标 — v7 极光玻璃卡 */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="mt-16 lg:mt-24 grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6 max-w-4xl mx-auto"
        >
          {KEY_METRICS.map((metric, idx) => {
            const IconComponent = metric.icon;
            const isLicense = metric.id === 'license';
            const metricValue = typeof metric.value === 'number' ? metric.value : 0;
            return (
              <motion.div
                key={metric.id}
                variants={staggerItem}
                whileHover={{ y: -3, transition: { duration: 0.3 } }}
                className="group relative"
              >
                {/* v7 极光玻璃卡 */}
                <div
                  className="absolute inset-0 rounded-xl transition-all duration-500"
                  style={{
                    background: 'linear-gradient(180deg, rgba(26, 36, 86, 0.55) 0%, rgba(21, 34, 74, 0.70) 100%)',
                    backdropFilter: 'blur(24px) saturate(180%)',
                    WebkitBackdropFilter: 'blur(24px) saturate(180%)',
                    border: isLicense
                      ? '1px solid rgba(240, 185, 11, 0.40)'
                      : '1px solid rgba(148, 163, 184, 0.20)',
                    boxShadow: '0 8px 32px rgba(15, 27, 61, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
                  }}
                />
                {/* 顶部高光线 */}
                <div
                  aria-hidden
                  className="absolute top-0 left-1/4 right-1/4 h-px z-10 rounded-full"
                  style={{
                    background: isLicense
                      ? 'linear-gradient(90deg, transparent 0%, #FCD535 50%, transparent 100%)'
                      : 'linear-gradient(90deg, transparent 0%, rgba(56, 189, 248, 0.60) 50%, transparent 100%)',
                    boxShadow: isLicense
                      ? '0 0 12px rgba(240, 185, 11, 0.60)'
                      : '0 0 8px rgba(56, 189, 248, 0.40)',
                  }}
                />
                {/* 悬浮时极光 */}
                <div
                  className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{
                    border: isLicense
                      ? '1px solid rgba(240, 185, 11, 0.80)'
                      : '1px solid rgba(56, 189, 248, 0.60)',
                    boxShadow: isLicense
                      ? '0 0 40px rgba(240, 185, 11, 0.30), 0 12px 32px rgba(15, 27, 61, 0.5)'
                      : '0 0 32px rgba(56, 189, 248, 0.25), 0 12px 32px rgba(15, 27, 61, 0.5)',
                  }}
                />

                <div className="relative p-6 rounded-xl">
                  <div className="flex items-center justify-between mb-4">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center"
                      style={{
                        background: isLicense
                          ? 'linear-gradient(135deg, rgba(240, 185, 11, 0.20) 0%, rgba(252, 213, 53, 0.10) 100%)'
                          : 'linear-gradient(135deg, rgba(56, 189, 248, 0.18) 0%, rgba(167, 139, 250, 0.12) 100%)',
                        border: isLicense
                          ? '1px solid rgba(240, 185, 11, 0.30)'
                          : '1px solid rgba(56, 189, 248, 0.20)',
                      }}
                    >
                      <IconComponent
                        className="w-5 h-5"
                        style={{ color: isLicense ? '#FCD535' : '#67E8F9' }}
                      />
                    </div>
                    <Activity
                      className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ color: isLicense ? '#FCD535' : '#67E8F9' }}
                    />
                  </div>

                  <div className="space-y-1">
                    <div
                      className="text-2xl lg:text-3xl font-bold tabular-nums"
                      style={{
                        background: isLicense
                          ? 'linear-gradient(135deg, #FCD535 0%, #F0B90B 100%)'
                          : 'linear-gradient(135deg, #F8FAFC 0%, #B4C0E0 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                      }}
                    >
                      {metric.isStatic ? (
                        <span>{metric.value}</span>
                      ) : (
                        <>
                          {metric.prefix && (
                            <span className="text-lg mr-1" style={{ color: '#7B89B8' }}>
                              {metric.prefix}
                            </span>
                          )}
                          <AnimatedCounter
                            value={metricValue}
                            decimals={metric.decimals}
                          />
                          {metric.suffix && (
                            <span className="text-lg ml-1" style={{ color: '#7B89B8' }}>
                              {metric.suffix}
                            </span>
                          )}
                        </>
                      )}
                    </div>
                    <p className="text-sm font-medium" style={{ color: '#B4C0E0' }}>
                      {metric.label}
                    </p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </motion.div>

      {/* 底部渐隐过渡 v7 */}
      <div
        aria-hidden
        className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none"
        style={{
          background: 'linear-gradient(180deg, rgba(15, 27, 61, 0) 0%, rgba(15, 27, 61, 0.6) 70%, #0F1B3D 100%)',
        }}
      />
    </section>
  );
}
