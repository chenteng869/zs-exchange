'use client';

import { STEPS } from '@/lib/constants';
import { fadeInUp, staggerContainer, staggerItem } from '@/lib/animations';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

// 严格遵循《数字交易所官网与管理员后台色系搭配最佳方案 V1.0》第 10.1 章
// 4步流程模块：深色背景 + 电光蓝步骤编号
export default function HowItWorks() {
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
        className="max-w-6xl mx-auto"
      >
        {/* 标题 */}
        <motion.div variants={fadeInUp} className="text-center mb-16">
          <h2
            className="text-3xl sm:text-4xl font-bold mb-4"
            style={{ color: '#F8FAFC' }}
          >
            四步开启交易之旅
          </h2>
          <p
            className="text-lg max-w-2xl mx-auto"
            style={{ color: '#94A3B8' }}
          >
            简单四步，快速上手专业级数字资产交易
          </p>
        </motion.div>

        {/* 4步流程 - 横向Desktop / 纵向Mobile */}
        <div className="relative">
          {/* 连接线 (仅Desktop显示) - 蓝紫渐变 */}
          <div
            className="hidden lg:block absolute top-14 left-[12.5%] right-[12.5%] h-0.5"
            style={{
              background:
                'linear-gradient(90deg, rgba(22, 119, 255, 0.30) 0%, rgba(22, 119, 255, 0.50) 50%, rgba(124, 58, 237, 0.30) 100%)',
            }}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-6">
            {STEPS.map((step, index) => (
              <motion.div
                key={step.id}
                variants={staggerItem}
                className="relative flex flex-col items-center text-center group"
              >
                {/* 步骤编号圆圈 - 深色版 */}
                <div className="relative z-10 mb-6">
                  <div
                    className="w-[72px] h-[72px] rounded-full flex items-center justify-center transition-all duration-300"
                    style={{
                      background: '#131A2E',
                      border: '2px solid rgba(22, 119, 255, 0.40)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.border = '2px solid #1677FF';
                      e.currentTarget.style.boxShadow = '0 0 24px rgba(22, 119, 255, 0.30)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.border = '2px solid rgba(22, 119, 255, 0.40)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <span
                      className="text-3xl font-bold"
                      style={{
                        background:
                          'linear-gradient(135deg, #1677FF 0%, #38BDF8 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                      }}
                    >
                      {String(step.id).padStart(2, '0')}
                    </span>
                  </div>
                  {/* 箭头 (非最后一步显示) */}
                  {index < STEPS.length - 1 && (
                    <div className="hidden lg:flex absolute top-1/2 -right-8 -translate-y-1/2 z-10">
                      <ArrowRight
                        className="w-5 h-5"
                        style={{ color: 'rgba(22, 119, 255, 0.50)' }}
                      />
                    </div>
                  )}
                </div>

                {/* 图标 */}
                <span className="text-3xl mb-3">{step.icon}</span>

                {/* 标题 */}
                <h3
                  className="text-base font-bold mb-2"
                  style={{ color: '#F8FAFC' }}
                >
                  {step.title}
                </h3>

                {/* 描述 */}
                <p
                  className="text-sm leading-relaxed"
                  style={{ color: '#94A3B8' }}
                >
                  {step.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>
    </section>
  );
}
