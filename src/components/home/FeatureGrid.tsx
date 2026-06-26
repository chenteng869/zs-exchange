'use client';

import { FEATURES } from '@/lib/constants';
import { fadeInUp, staggerContainer, staggerItem, hoverLift } from '@/lib/animations';
import { motion } from 'framer-motion';

/**
 * ZS Exchange FeatureGrid v7 (Aurora Premium)
 * 升级自 v6 Royal Premium - 极光尊享
 *
 * 关键升级：
 *   1. 卡片从实色 #131A2E → v7 极光玻璃（backdrop-filter: blur(24px)）
 *   2. 边框从 #2A3556 → rgba(148, 163, 184, 0.20) 细腻
 *   3. 顶部高光线：合规核心金，其他彩虹色
 *   4. 标题色升级为更白 #F8FAFC
 *   5. 描述色升级 #B4C0E0
 *   6. hover 时整张卡变极光金边 + 玻璃变亮
 */

const featureColorMap: Record<string, { bg: string; iconColor: string; border: string; gradient: string; accentBorder: string; topLineColor: string; iconBg: string; iconBorder: string }> = {
  'feature-compliance': {
    bg: 'rgba(240, 185, 11, 0.10)',
    iconColor: '#FCD535',
    border: 'rgba(240, 185, 11, 0.30)',
    gradient: 'linear-gradient(135deg, #FCD535 0%, #F0B90B 100%)',
    accentBorder: 'rgba(240, 185, 11, 0.80)',
    topLineColor: '#FCD535',
    iconBg: 'linear-gradient(135deg, rgba(240, 185, 11, 0.20) 0%, rgba(252, 213, 53, 0.10) 100%)',
    iconBorder: '1px solid rgba(240, 185, 11, 0.35)',
  }, // 合规持牌 - 皇家金渐变
  'feature-security': {
    bg: 'rgba(22, 199, 132, 0.10)',
    iconColor: '#34D399',
    border: 'rgba(22, 199, 132, 0.30)',
    gradient: 'linear-gradient(135deg, #10B981 0%, #34D399 100%)',
    accentBorder: 'rgba(52, 211, 153, 0.70)',
    topLineColor: '#34D399',
    iconBg: 'linear-gradient(135deg, rgba(22, 199, 132, 0.20) 0%, rgba(52, 211, 153, 0.10) 100%)',
    iconBorder: '1px solid rgba(52, 211, 153, 0.30)',
  },
  'feature-speed': {
    bg: 'rgba(167, 139, 250, 0.10)',
    iconColor: '#A78BFA',
    border: 'rgba(167, 139, 250, 0.30)',
    gradient: 'linear-gradient(135deg, #7C3AED 0%, #A78BFA 100%)',
    accentBorder: 'rgba(167, 139, 250, 0.70)',
    topLineColor: '#A78BFA',
    iconBg: 'linear-gradient(135deg, rgba(124, 58, 237, 0.20) 0%, rgba(167, 139, 250, 0.10) 100%)',
    iconBorder: '1px solid rgba(167, 139, 250, 0.30)',
  },
  'feature-liquidity': {
    bg: 'rgba(56, 189, 248, 0.10)',
    iconColor: '#38BDF8',
    border: 'rgba(56, 189, 248, 0.30)',
    gradient: 'linear-gradient(135deg, #38BDF8 0%, #1677FF 100%)',
    accentBorder: 'rgba(56, 189, 248, 0.70)',
    topLineColor: '#38BDF8',
    iconBg: 'linear-gradient(135deg, rgba(56, 189, 248, 0.20) 0%, rgba(34, 211, 238, 0.10) 100%)',
    iconBorder: '1px solid rgba(56, 189, 248, 0.30)',
  },
  'feature-multi-assets': {
    bg: 'rgba(22, 119, 255, 0.10)',
    iconColor: '#60A5FA',
    border: 'rgba(22, 119, 255, 0.30)',
    gradient: 'linear-gradient(135deg, #1677FF 0%, #7C3AED 100%)',
    accentBorder: 'rgba(96, 165, 250, 0.70)',
    topLineColor: '#60A5FA',
    iconBg: 'linear-gradient(135deg, rgba(22, 119, 255, 0.20) 0%, rgba(124, 58, 237, 0.10) 100%)',
    iconBorder: '1px solid rgba(96, 165, 250, 0.30)',
  },
  'feature-global': {
    bg: 'rgba(245, 158, 11, 0.10)',
    iconColor: '#F59E0B',
    border: 'rgba(245, 158, 11, 0.30)',
    gradient: 'linear-gradient(135deg, #F59E0B 0%, #F97316 100%)',
    accentBorder: 'rgba(245, 158, 11, 0.70)',
    topLineColor: '#F59E0B',
    iconBg: 'linear-gradient(135deg, rgba(245, 158, 11, 0.20) 0%, rgba(249, 115, 22, 0.10) 100%)',
    iconBorder: '1px solid rgba(245, 158, 11, 0.30)',
  },
};

export default function FeatureGrid() {
  return (
    <section
      className="py-20 px-4 sm:px-6 lg:px-8 relative"
      style={{ background: 'transparent' }}
    >
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-80px' }}
        className="max-w-7xl mx-auto"
      >
        {/* 标题 - v7 极光三色渐变 */}
        <motion.div variants={fadeInUp} className="text-center mb-14">
          <h2
            className="text-3xl sm:text-4xl font-bold mb-4"
            style={{ color: '#F8FAFC' }}
          >
            为什么选择{' '}
            <span
              style={{
                background: 'linear-gradient(135deg, #FCD535 0%, #38BDF8 50%, #A78BFA 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              ZS Exchange
            </span>
          </h2>
          <p
            className="text-lg max-w-2xl mx-auto"
            style={{ color: '#B4C0E0' }}
          >
            六大核心优势，打造全球领先的数字资产交易平台
          </p>
        </motion.div>

        {/* 6大特性网格 - v7 极光玻璃卡 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((feature) => {
            const colors = featureColorMap[feature.id] || featureColorMap['feature-multi-assets'];
            const isLicenseFeature = feature.id === 'feature-compliance';

            return (
              <motion.div
                key={feature.id}
                variants={staggerItem}
                {...hoverLift}
                className="relative group rounded-2xl p-7 cursor-default transition-all duration-500"
                style={{
                  background: 'linear-gradient(180deg, rgba(26, 36, 86, 0.55) 0%, rgba(21, 34, 74, 0.70) 100%)',
                  backdropFilter: 'blur(24px) saturate(180%)',
                  WebkitBackdropFilter: 'blur(24px) saturate(180%)',
                  border: isLicenseFeature
                    ? '1px solid rgba(240, 185, 11, 0.40)'
                    : '1px solid rgba(148, 163, 184, 0.20)',
                  boxShadow: isLicenseFeature
                    ? '0 0 32px rgba(240, 185, 11, 0.10), 0 8px 32px rgba(15, 27, 61, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
                    : '0 8px 32px rgba(15, 27, 61, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.border = `1px solid ${colors.accentBorder}`;
                  e.currentTarget.style.boxShadow = isLicenseFeature
                    ? '0 0 40px rgba(240, 185, 11, 0.30), 0 12px 40px rgba(15, 27, 61, 0.5)'
                    : `0 0 32px ${colors.bg}, 0 12px 40px rgba(15, 27, 61, 0.5)`;
                  e.currentTarget.style.background = 'linear-gradient(180deg, rgba(30, 42, 95, 0.65) 0%, rgba(26, 36, 86, 0.80) 100%)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.border = isLicenseFeature
                    ? '1px solid rgba(240, 185, 11, 0.40)'
                    : '1px solid rgba(148, 163, 184, 0.20)';
                  e.currentTarget.style.boxShadow = isLicenseFeature
                    ? '0 0 32px rgba(240, 185, 11, 0.10), 0 8px 32px rgba(15, 27, 61, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
                    : '0 8px 32px rgba(15, 27, 61, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05)';
                  e.currentTarget.style.background = 'linear-gradient(180deg, rgba(26, 36, 86, 0.55) 0%, rgba(21, 34, 74, 0.70) 100%)';
                }}
              >
                {/* 顶部高光线 v7 - 每张卡都有，颜色不同 */}
                <div
                  aria-hidden
                  className="absolute top-0 left-1/4 right-1/4 h-px rounded-full"
                  style={{
                    background: `linear-gradient(90deg, transparent 0%, ${colors.topLineColor} 50%, transparent 100%)`,
                    boxShadow: `0 0 12px ${colors.topLineColor === '#FCD535' ? 'rgba(240, 185, 11, 0.60)' : colors.topLineColor + '99'}`,
                  }}
                />

                {/* 合规持牌特殊标记 - v7 极光徽章 */}
                {isLicenseFeature && (
                  <div
                    className="absolute -top-2.5 right-4 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
                    style={{
                      background: 'linear-gradient(135deg, #FCD535 0%, #F0B90B 100%)',
                      color: '#0F1B3D',
                      boxShadow: '0 4px 16px rgba(240, 185, 11, 0.40), inset 0 1px 0 rgba(255, 255, 255, 0.30)',
                    }}
                  >
                    核心
                  </div>
                )}

                {/* 图标圆形背景 v7 */}
                <div
                  className="rounded-xl flex items-center justify-center mb-5"
                  style={{
                    background: colors.iconBg,
                    width: '56px',
                    height: '56px',
                    border: colors.iconBorder,
                    boxShadow: isLicenseFeature ? '0 0 16px rgba(240, 185, 11, 0.20)' : 'none',
                  }}
                >
                  <span className="text-2xl">{feature.icon}</span>
                </div>

                {/* 标题 v7 */}
                <h3
                  className="text-lg font-bold mb-3"
                  style={{ color: isLicenseFeature ? '#FCD535' : '#F8FAFC' }}
                >
                  {feature.title}
                </h3>

                {/* 描述 v7 */}
                <p
                  className="text-sm leading-relaxed"
                  style={{ color: '#B4C0E0' }}
                >
                  {feature.description}
                </p>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </section>
  );
}
