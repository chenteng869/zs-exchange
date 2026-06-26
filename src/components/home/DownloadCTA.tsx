'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Download, QrCode, Apple, Play } from 'lucide-react';
import { fadeInUp, staggerContainer, staggerItem } from '@/lib/animations';

// 严格遵循《数字交易所官网与管理员后台色系搭配最佳方案 V1.0》第 10.1 章「官网首页」
// 下载App模块：深色卡片 + 电光蓝主按钮
export default function DownloadCTA() {
  return (
    <section
      className="py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden"
      style={{ background: 'transparent' }}
    >
      {/* 蓝紫背景光晕 */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full"
        style={{
          background:
            'radial-gradient(circle, rgba(22, 119, 255, 0.15) 0%, transparent 70%)',
          filter: 'blur(120px)',
        }}
      />
      <div
        className="absolute top-1/4 right-1/4 w-[400px] h-[400px] rounded-full"
        style={{
          background:
            'radial-gradient(circle, rgba(124, 58, 237, 0.10) 0%, transparent 70%)',
          filter: 'blur(120px)',
        }}
      />

      <motion.div
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-80px' }}
        className="relative z-10 max-w-6xl mx-auto"
      >
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
          {/* 左侧: 手机Mockup占位 - 深色版 */}
          <motion.div variants={staggerItem} className="flex-shrink-0">
            <div
              className="relative w-[260px] sm:w-[300px] h-[520px] sm:h-[600px] rounded-[40px] p-[3px]"
              style={{
                background: 'linear-gradient(135deg, #1677FF 0%, #7C3AED 100%)',
                boxShadow: '0 20px 60px rgba(22, 119, 255, 0.30)',
              }}
            >
              <div
                className="w-full h-full rounded-[37px] flex items-center justify-center overflow-hidden"
                style={{
                  background: 'linear-gradient(180deg, #0B1124 0%, #131A2E 100%)',
                }}
              >
                {/* Mockup内部内容模拟 - 深色 */}
                <div className="w-full h-full p-6 flex flex-col">
                  {/* 状态栏模拟 */}
                  <div className="flex justify-between items-center mb-8 mt-2">
                    <div
                      className="w-16 h-2 rounded-full"
                      style={{ background: '#2A3556' }}
                    />
                    <div
                      className="w-8 h-2 rounded-full"
                      style={{ background: '#2A3556' }}
                    />
                  </div>
                  {/* Logo模拟 */}
                  <div className="text-center mb-8">
                    <div
                      className="w-16 h-16 rounded-2xl mx-auto mb-3 flex items-center justify-center"
                      style={{
                        background:
                          'linear-gradient(135deg, #1677FF 0%, #7C3AED 100%)',
                        boxShadow: '0 4px 16px rgba(22, 119, 255, 0.40)',
                      }}
                    >
                      <span className="text-white font-bold text-xl">ZS</span>
                    </div>
                    <div
                      className="w-24 h-3 rounded mx-auto mb-1"
                      style={{ background: '#2A3556' }}
                    />
                    <div
                      className="w-16 h-2 rounded mx-auto"
                      style={{ background: '#2A3556' }}
                    />
                  </div>
                  {/* 卡片模拟 */}
                  <div className="space-y-3 flex-1">
                    {[...Array(4)].map((_, i) => (
                      <div
                        key={i}
                        className="rounded-xl p-3.5"
                        style={{ background: 'rgba(30, 41, 59, 0.50)' }}
                      >
                        <div className="flex justify-between items-center mb-2">
                          <div
                            className="h-2.5 rounded"
                            style={{
                              width: `${48 + i * 16}px`,
                              background: '#2A3556',
                            }}
                          />
                          <div
                            className="w-12 h-2.5 rounded"
                            style={{ background: 'rgba(22, 199, 132, 0.20)' }}
                          />
                        </div>
                        <div
                          className="w-full h-2 rounded"
                          style={{ background: '#2A3556' }}
                        />
                      </div>
                    ))}
                  </div>
                  {/* 底部按钮模拟 */}
                  <div className="mt-4">
                    <div
                      className="w-full h-11 rounded-xl"
                      style={{
                        background:
                          'linear-gradient(135deg, #1677FF 0%, #7C3AED 100%)',
                        opacity: 0.8,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
            {/* 光晕效果 */}
            <div
              className="absolute -inset-4 rounded-[52px] blur-xl -z-10"
              style={{
                background:
                  'linear-gradient(135deg, rgba(22, 119, 255, 0.20) 0%, rgba(124, 58, 237, 0.20) 100%)',
              }}
            />
          </motion.div>

          {/* 右侧: 文案 + 按钮 */}
          <motion.div variants={fadeInUp} className="flex-1 text-center lg:text-left">
            <h2
              className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-5 leading-tight"
              style={{ color: '#F8FAFC' }}
            >
              下载 ZS Exchange
              <br />
              <span
                style={{
                  background: 'linear-gradient(135deg, #1677FF 0%, #38BDF8 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                随时随地交易
              </span>
            </h2>
            <p
              className="text-lg mb-9 max-w-md mx-auto lg:mx-0 leading-relaxed"
              style={{ color: '#94A3B8' }}
            >
              支持 iOS、Android、桌面端等多平台，安全便捷的数字资产交易体验。一次注册，多端同步。
            </p>

            {/* 按钮组 - 深色版 */}
            <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
              {/* App Store */}
              <Link href="/download?platform=ios">
                <button
                  className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-medium transition-all duration-200 min-w-[180px]"
                  style={{
                    background: '#1677FF',
                    color: '#FFFFFF',
                    boxShadow: '0 4px 12px rgba(22, 119, 255, 0.30)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#4096FF';
                    e.currentTarget.style.boxShadow = '0 6px 16px rgba(22, 119, 255, 0.40)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#1677FF';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(22, 119, 255, 0.30)';
                  }}
                >
                  <Apple className="w-5 h-5" />
                  App Store
                </button>
              </Link>

              {/* Google Play */}
              <Link href="/download?platform=android">
                <button
                  className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-medium transition-all duration-200 min-w-[180px]"
                  style={{
                    background: 'transparent',
                    color: '#F8FAFC',
                    border: '1px solid #374161',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#1677FF';
                    e.currentTarget.style.color = '#1677FF';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#374161';
                    e.currentTarget.style.color = '#F8FAFC';
                  }}
                >
                  <Play className="w-5 h-5" />
                  Google Play
                </button>
              </Link>

              {/* QR码按钮 */}
              <button
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl transition-all duration-300 group"
                style={{
                  background: 'rgba(30, 41, 59, 0.50)',
                  border: '1px solid #374161',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#1677FF';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#374161';
                }}
              >
                <QrCode
                  className="w-5 h-5 transition-colors"
                  style={{ color: '#94A3B8' }}
                />
                <span
                  className="text-sm font-medium transition-colors"
                  style={{ color: '#94A3B8' }}
                >
                  扫码下载
                </span>
              </button>
            </div>

            {/* 附加信息 */}
            <p
              className="mt-6 text-xs flex items-center justify-center lg:justify-start gap-1"
              style={{ color: '#94A3B8' }}
            >
              <Download className="w-3.5 h-3.5 inline" />
              v2.4.0 · 128MB · 支持 iOS 15+ / Android 10+
            </p>
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
}
