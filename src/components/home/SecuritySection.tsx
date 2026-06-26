'use client';

import { SECURITY_ITEMS } from '@/lib/constants';
import { ShieldCheck } from 'lucide-react';
import { fadeInUp, staggerContainer, staggerItem, hoverLift } from '@/lib/animations';
import { motion } from 'framer-motion';

const securityColorMap: Record<string, { bg: string; iconColor: string; border: string; gradient: string }> = {
  'security-cold-wallet': {
    bg: 'rgba(56, 189, 248, 0.12)',
    iconColor: '#38BDF8',
    border: 'rgba(56, 189, 248, 0.30)',
    gradient: 'linear-gradient(135deg, #38BDF8 0%, #1677FF 100%)',
  },
  'security-multi-sig': {
    bg: 'rgba(22, 119, 255, 0.12)',
    iconColor: '#1677FF',
    border: 'rgba(22, 119, 255, 0.30)',
    gradient: 'linear-gradient(135deg, #1677FF 0%, #7C3AED 100%)',
  },
  'security-realtime-monitor': {
    bg: 'rgba(124, 58, 237, 0.12)',
    iconColor: '#A78BFA',
    border: 'rgba(124, 58, 237, 0.30)',
    gradient: 'linear-gradient(135deg, #7C3AED 0%, #A78BFA 100%)',
  },
  'security-insurance-fund': {
    bg: 'rgba(22, 163, 74, 0.12)',
    iconColor: '#16C784',
    border: 'rgba(22, 163, 74, 0.30)',
    gradient: 'linear-gradient(135deg, #16A34A 0%, #16C784 100%)',
  },
  'security-kyc-aml': {
    bg: 'rgba(22, 119, 255, 0.15)',
    iconColor: '#38BDF8',
    border: 'rgba(22, 119, 255, 0.40)',
    gradient: 'linear-gradient(135deg, #1677FF 0%, #38BDF8 100%)',
  }, // 萨摩亚合规 - 突出显示
  'security-audit': {
    bg: 'rgba(245, 158, 11, 0.12)',
    iconColor: '#F59E0B',
    border: 'rgba(245, 158, 11, 0.30)',
    gradient: 'linear-gradient(135deg, #F59E0B 0%, #F97316 100%)',
  },
};

// 严格遵循《数字交易所官网与管理员后台色系搭配最佳方案 V1.0》第 5.3 章「安全合规模块」
// 背景 #101729 / 图标 #38BDF8 / 标题 #F8FAFC / 描述 #94A3B8
// 认证标签 #16C784 / 风险提示 #F59E0B
export default function SecuritySection() {
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
        {/* 标题 */}
        <motion.div variants={fadeInUp} className="text-center mb-14">
          <div
            className="inline-flex items-center justify-center w-14 h-14 rounded-full mb-5"
            style={{ background: 'rgba(22, 119, 255, 0.15)' }}
          >
            <ShieldCheck className="w-7 h-7" style={{ color: '#38BDF8' }} />
          </div>
          <h2
            className="text-3xl sm:text-4xl font-bold mb-4"
            style={{ color: '#F8FAFC' }}
          >
            安全保障 · 值得信赖
          </h2>
          <p
            className="text-lg max-w-2xl mx-auto"
            style={{ color: '#94A3B8' }}
          >
            多层安全防护体系，全方位保障您的数字资产安全
          </p>
        </motion.div>

        {/* 安全项网格 2×3 / 3×2 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {SECURITY_ITEMS.map((item) => {
            const colors = securityColorMap[item.id] || securityColorMap['security-multi-sig'];
            const isSamoaCompliance = item.id === 'security-kyc-aml';

            return (
              <motion.div
                key={item.id}
                variants={staggerItem}
                {...hoverLift}
                className="relative group rounded-xl p-7 cursor-default transition-all duration-300 hover:-translate-y-1"
                style={{
                  background: '#101729',
                  border: `1px solid ${isSamoaCompliance ? 'rgba(22, 119, 255, 0.40)' : '#2A3556'}`,
                  boxShadow: isSamoaCompliance
                    ? '0 0 24px rgba(22, 119, 255, 0.20)'
                    : 'none',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.border = '1px solid #1677FF';
                  e.currentTarget.style.boxShadow = '0 0 24px rgba(22, 119, 255, 0.30)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.border = isSamoaCompliance
                    ? '1px solid rgba(22, 119, 255, 0.40)'
                    : '1px solid #2A3556';
                  e.currentTarget.style.boxShadow = isSamoaCompliance
                    ? '0 0 24px rgba(22, 119, 255, 0.20)'
                    : 'none';
                }}
              >
                {/* 萨摩亚合规特殊标记 */}
                {isSamoaCompliance && (
                  <div
                    className="absolute -top-2.5 right-4 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold text-white uppercase tracking-wider"
                    style={{ background: colors.gradient }}
                  >
                    🇼🇸 萨摩亚合规
                  </div>
                )}

                {/* 图标 */}
                <div
                  className="rounded-full flex items-center justify-center mb-5"
                  style={{
                    background: colors.bg,
                    width: '52px',
                    height: '52px',
                  }}
                >
                  {isSamoaCompliance ? (
                    <ShieldCheck className="w-6 h-6" style={{ color: colors.iconColor }} />
                  ) : (
                    <span className="text-2xl">{item.icon}</span>
                  )}
                </div>

                {/* 标题 */}
                <h3
                  className="text-base font-bold mb-2.5"
                  style={{ color: isSamoaCompliance ? '#38BDF8' : '#F8FAFC' }}
                >
                  {item.title}
                </h3>

                {/* 描述 */}
                <p
                  className="text-sm leading-relaxed"
                  style={{ color: '#94A3B8' }}
                >
                  {item.description}
                </p>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </section>
  );
}
