'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Download,
  Smartphone,
  ArrowRight,
  TrendingUp,
  Zap,
  Wallet,
  Bell,
  Globe,
  Headphones,
  Apple,
  Play,
  QrCode,
  Shield,
  CheckCircle2,
  Copy,
  X,
  Loader2,
  FileCheck2,
} from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui';
import { Card } from '@/components/ui';
import { Badge } from '@/components/ui';
import {
  fadeInUp,
  staggerContainer,
  staggerItem,
  hoverLift,
} from '@/lib/animations';
import { useApkDownload, ApkInfo } from '@/hooks/useApkDownload';

// ==================== 功能亮点数据 ====================
const appFeatures = [
  {
    icon: <TrendingUp size={28} className="text-brand-500" />,
    title: '实时行情推送',
    description: '全球市场行情秒级更新，K线图表专业分析',
  },
  {
    icon: <Zap size={28} className="text-samoa" />,
    title: '一键交易',
    description: '简洁直观的交易界面，毫秒级订单撮合',
  },
  {
    icon: <Wallet size={28} className="text-success" />,
    title: '安全钱包',
    description: '多重签名+生物识别，资产安全保障',
  },
  {
    icon: <Bell size={28} className="text-warning" />,
    title: '价格提醒',
    description: '自定义价格预警，不错过任何行情机会',
  },
  {
    icon: <Globe size={28} className="text-info" />,
    title: '多语言支持',
    description: '支持中文、英文、日文、韩文等12种语言',
  },
  {
    icon: <Headphones size={28} className="text-text-secondary" />,
    title: '7×24 客服',
    description: '全天候在线客服，随时解答您的问题',
  },
];

export default function DownloadPage() {
  // QR code display state
  const [showQrCode, setShowQrCode] = useState(false);
  const [copied, setCopied] = useState(false);
  const [iosTipOpen, setIosTipOpen] = useState(false);

  const { info: apkInfo, loading, error, download, platform } = useApkDownload({
    source: 'web',
  });

  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    if (platform === 'ios') {
      setIosTipOpen(true);
      return;
    }
    setDownloading(true);
    try {
      await download('web');
    } finally {
      // 给浏览器一点时间启动下载
      setTimeout(() => setDownloading(false), 800);
    }
  };

  const handleCopyLink = async () => {
    if (!apkInfo) return;
    const fullUrl =
      typeof window !== 'undefined'
        ? `${window.location.origin}${apkInfo.downloadUrl}`
        : apkInfo.downloadUrl;
    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  return (
    <main className="min-h-screen bg-deep-900">
      <Navbar />

      {/* ==================== Hero 区域 ==================== */}
      <section className="relative pt-28 pb-8 px-4 overflow-hidden">
        {/* Background decorations */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-10 left-1/3 w-80 h-80 bg-brand-500/12 rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-1/4 w-72 h-72 bg-samoa/8 rounded-full blur-3xl" />
        </div>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="max-w-[1400px] mx-auto text-center relative z-10"
        >
          <motion.div variants={fadeInUp}>
            <Badge variant="samoa" size="md" className="mb-6">
              🇼🇸 萨摩亚持牌 · 官方移动端
            </Badge>
          </motion.div>

          <motion.h1
            variants={fadeInUp}
            className="text-4xl md:text-5xl lg:text-6xl font-bold text-text-primary mb-5 leading-tight"
          >
            随时随地，
            <br />
            <span className="bg-gradient-to-r from-brand-primary to-samoa bg-clip-text text-transparent">
              掌控全局
            </span>
          </motion.h1>

          <motion.p
            variants={fadeInUp}
            className="text-lg md:text-xl text-text-secondary max-w-2xl mx-auto mb-2 leading-relaxed"
          >
            下载 ZS Exchange 官方 App，在手机上享受完整的数字资产交易体验
          </motion.p>
          <motion.p
            variants={fadeInUp}
            className="text-sm text-text-muted mb-10"
          >
            支持 iOS 14.0+ / Android 8.0+
          </motion.p>
        </motion.div>
      </section>

      {/* ==================== 手机 Mockup 展示区 ==================== */}
      <section className="py-8 px-4 pb-16">
        <div className="max-w-[1400px] mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.25, 0.1, 0.25, 1] }}
            className="flex justify-center"
          >
            {/* CSS 手机框架 Mockup */}
            <div className="relative">
              {/* Phone outer frame - realistic smartphone mockup */}
              <div
                className="
                  relative w-[280px] md:w-[320px] h-[580px] md:h-[660px]
                  rounded-[44px] border-[3px] border-deep-600
                  bg-deep-800 shadow-2xl shadow-black/50
                  overflow-hidden
                "
                style={{
                  boxShadow:
                    '0 25px 60px rgba(0,0,0,0.5), inset 0 0 20px rgba(124,58,237,0.05)',
                }}
              >
                {/* Dynamic Island / Notch */}
                <div className="absolute top-3 left-1/2 -translate-x-1/2 w-28 h-7 bg-black rounded-full z-20" />

                {/* Screen content area */}
                <div className="h-full w-full pt-12 px-4 pb-4 flex flex-col bg-gradient-to-b from-deep-850 to-deep-900">
                  {/* Status bar simulation */}
                  <div className="flex justify-between items-center text-[10px] text-text-muted px-2 mb-3">
                    <span>9:41</span>
                    <div className="flex items-center gap-1">
                      <span className="text-[8px]">SIG</span>
                      <span className="text-[8px]">BAT</span>
                    </div>
                  </div>

                  {/* App Header inside mockup */}
                  <div className="flex items-center justify-between mb-5">
                    <div>
                      <p className="text-brand-500 font-bold text-lg tracking-wide">ZS</p>
                      <p className="text-text-muted text-[9px]">EXCHANGE</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-deep-700 flex items-center justify-center">
                        <Bell size={13} className="text-text-muted" />
                      </div>
                      <div className="w-7 h-7 rounded-full bg-deep-700 flex items-center justify-center">
                        <QrCode size={13} className="text-text-muted" />
                      </div>
                    </div>
                  </div>

                  {/* Portfolio Card in mockup */}
                  <div className="rounded-xl bg-gradient-to-br from-brand-primary/30 to-info/15 p-4 mb-4 border border-brand-500/20">
                    <p className="text-text-muted text-[10px] mb-1">总资产估值 (USD)</p>
                    <p className="text-white text-xl font-bold">$128,456.78</p>
                    <div className="flex items-center gap-1 mt-1">
                      <span className="text-success text-[10px]">▲ +2.34%</span>
                      <span className="text-text-muted text-[9px]">24h</span>
                    </div>
                  </div>

                  {/* Quick actions grid */}
                  <div className="grid grid-cols-4 gap-2 mb-4">
                    {[
                      { label: '充值' },
                      { label: '提现' },
                      { label: '交易' },
                      { label: '理财' },
                    ].map((action) => (
                      <div key={action.label} className="flex flex-col items-center gap-1 py-2">
                        <div className="w-9 h-9 rounded-xl bg-brand-500/15 flex items-center justify-center text-xs font-medium text-brand-light">
                          {action.label[0]}
                        </div>
                        <span className="text-text-muted text-[9px]">{action.label}</span>
                      </div>
                    ))}
                  </div>

                  {/* Ticker list in mockup */}
                  <div className="space-y-2 flex-grow overflow-hidden">
                    {[
                      { name: 'BTC', change: '+2.45%', price: '$67,234' },
                      { name: 'ETH', change: '-0.82%', price: '$3,456' },
                      { name: 'SOL', change: '+5.12%', price: '$178.90' },
                      { name: 'BNB', change: '+1.33%', price: '$612.40' },
                    ].map((coin) => (
                      <div
                        key={coin.name}
                        className="flex items-center justify-between p-2.5 rounded-lg bg-deep-700/70"
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-deep-600 flex items-center justify-center text-[10px] font-bold text-text-primary">
                            {coin.name[0]}
                          </div>
                          <div>
                            <p className="text-text-primary text-xs font-medium">{coin.name}</p>
                            <p className="text-text-muted text-[9px]">/USDT</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-text-primary text-xs font-medium">{coin.price}</p>
                          <p
                            className={`text-[9px] ${
                              coin.change.startsWith('+') ? 'text-success' : 'text-danger'
                            }`}
                          >
                            {coin.change}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Bottom nav bar simulation */}
                  <div className="flex items-center justify-around pt-2 border-t border-deep-700/50 mt-auto">
                    {['首页', '行情', '交易', '资产', '我的'].map((tab) => (
                      <span
                        key={tab}
                        className={`text-[9px] ${
                          tab === '首页'
                            ? 'text-brand-500 font-medium'
                            : 'text-text-muted'
                        }`}
                      >
                        {tab}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Glow effect behind phone */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[500px] bg-brand-500/8 rounded-full blur-3xl -z-10" />
            </div>
          </motion.div>
        </div>
      </section>

      {/* ==================== 下载按钮组 ==================== */}
      <section className="py-12 px-4">
        <div className="max-w-[1400px] mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="flex flex-wrap items-center justify-center gap-4"
          >
            {/* App Store Button - 暂未上架 */}
            <button
              type="button"
              onClick={() => setIosTipOpen(true)}
              className="no-underline appearance-none bg-transparent border-0 p-0"
            >
              <Button
                variant="outline"
                size="lg"
                leftIcon={<Apple size={22} />}
                className="!rounded-xl !px-8 !py-4 hover:!bg-deep-700"
              >
                <div className="flex flex-col items-start ml-2">
                  <span className="text-[10px] text-text-muted leading-none">Download on the</span>
                  <span className="text-base font-semibold leading-tight">App Store</span>
                </div>
              </Button>
            </button>

            {/* Google Play Button - 暂未上架 */}
            <button
              type="button"
              onClick={handleDownload}
              className="no-underline appearance-none bg-transparent border-0 p-0"
              title="暂未上架 Google Play，点击下载 APK"
            >
              <Button
                variant="outline"
                size="lg"
                leftIcon={<Play size={22} />}
                className="!rounded-xl !px-8 !py-4 hover:!bg-deep-700"
              >
                <div className="flex flex-col items-start ml-2">
                  <span className="text-[10px] text-text-muted leading-none">GET IT ON</span>
                  <span className="text-base font-semibold leading-tight">Google Play</span>
                </div>
              </Button>
            </button>

            {/* APK Direct Download Button - 真实下载 */}
            <Button
              variant="secondary"
              size="lg"
              leftIcon={
                downloading || loading ? (
                  <Loader2 size={22} className="animate-spin" />
                ) : (
                  <Download size={22} />
                )
              }
              className="!rounded-xl !px-8 !py-4"
              onClick={handleDownload}
              disabled={downloading || loading}
            >
              {downloading
                ? '正在准备下载…'
                : apkInfo
                ? `APK 直链下载 (${apkInfo.fileSizeFormatted})`
                : 'APK 直链下载'}
            </Button>

            {/* QR Code Toggle Button */}
            <button
              onClick={() => setShowQrCode(!showQrCode)}
              className="
                inline-flex items-center gap-2 px-6 py-4 rounded-xl
                border border-deep-600 bg-deep-800
                text-text-secondary text-sm font-medium
                hover:bg-deep-700 hover:border-brand-500/30 hover:text-text-primary
                transition-all duration-200 cursor-pointer
              "
            >
              <QrCode size={20} />
              扫码下载
            </button>
          </motion.div>
        </div>
      </section>

      {/* ==================== 二维码展示区 (可展开) ==================== */}
      {showQrCode && (
        <motion.section
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.35 }}
          className="py-8 px-4"
        >
          <div className="max-w-md mx-auto">
            <Card variant="default" padding="lg" className="text-center">
              <h3 className="text-lg font-bold text-text-primary mb-4">
                扫描二维码下载
              </h3>
              {/* QR Code placeholder - styled as a large QR code box */}
              <div
                className="
                  w-52 h-52 mx-auto rounded-xl bg-white p-3
                  flex items-center justify-center
                "
              >
                <div className="w-full h-full bg-deep-100 rounded-lg flex items-center justify-center">
                  <div className="text-center space-y-2">
                    <QrCode size={64} className="mx-auto text-deep-400" />
                    <p className="text-deep-400 text-xs font-mono">ZS EXCHANGE</p>
                  </div>
                </div>
              </div>
              <p className="text-text-muted text-xs mt-4">
                使用手机相机或微信扫描二维码，跳转至对应下载页面
              </p>
            </Card>
          </div>
        </motion.section>
      )}

      {/* ==================== 功能亮点 (2×3 网格) ==================== */}
      <section className="py-16 px-4">
        <div className="max-w-[1400px] mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12"
          >
            <h2 className="text-2xl md:text-3xl font-bold text-text-primary mb-3">
              核心功能亮点
            </h2>
            <p className="text-text-secondary text-sm max-w-lg mx-auto">
              ZS Exchange App 提供完整的数字资产管理功能
            </p>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {appFeatures.map((feature, index) => (
              <motion.div
                key={feature.title}
                variants={staggerItem}
                {...hoverLift}
              >
                <Card variant="default" padding="lg" className="h-full group">
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-xl bg-deep-700 group-hover:bg-deep-600 transition-colors shrink-0">
                      {feature.icon}
                    </div>
                    <div>
                      <h3 className="text-text-primary font-semibold text-base mb-2">
                        {feature.title}
                      </h3>
                      <p className="text-text-secondary text-sm leading-relaxed">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ==================== 版本信息 & 系统要求 ==================== */}
      <section className="py-12 px-4">
        <div className="max-w-[1400px] mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="rounded-2xl border border-deep-700 bg-deep-800/50 p-8 md:p-10"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-16">
              {/* Version Info */}
              <div>
                <h3 className="text-lg font-bold text-text-primary mb-5 flex items-center gap-2">
                  <Smartphone size={20} className="text-brand-500" />
                  版本信息
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between py-2.5 border-b border-deep-700/50">
                    <span className="text-text-secondary text-sm">当前版本</span>
                    <span className="text-text-primary text-sm font-medium">
                      v{apkInfo?.version ?? '—'} ({apkInfo?.versionCode ?? '-'})
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2.5 border-b border-deep-700/50">
                    <span className="text-text-secondary text-sm">发布日期</span>
                    <span className="text-text-primary text-sm font-medium">
                      {apkInfo?.releaseDate ?? '—'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2.5 border-b border-deep-700/50">
                    <span className="text-text-secondary text-sm">包大小</span>
                    <span className="text-text-primary text-sm font-medium">
                      {apkInfo?.fileSizeFormatted ?? '—'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2.5 border-b border-deep-700/50">
                    <span className="text-text-secondary text-sm">包名</span>
                    <span className="text-text-primary text-xs font-mono">
                      {apkInfo?.packageName ?? '—'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2.5">
                    <span className="text-text-secondary text-sm">开发者</span>
                    <span className="text-text-primary text-sm font-medium">中萨数字科技集团</span>
                  </div>
                </div>
              </div>

              {/* System Requirements */}
              <div>
                <h3 className="text-lg font-bold text-text-primary mb-5 flex items-center gap-2">
                  <Shield size={20} className="text-samoa" />
                  系统要求
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-deep-700/50">
                    <div className="w-10 h-10 rounded-lg bg-deep-600 flex items-center justify-center shrink-0">
                      <Apple size={18} className="text-text-secondary" />
                    </div>
                    <div>
                      <p className="text-text-primary text-sm font-medium">iOS</p>
                      <p className="text-text-muted text-xs">iOS 14.0 及以上版本</p>
                    </div>
                    <CheckCircle2 size={16} className="text-success ml-auto shrink-0" />
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-deep-700/50">
                    <div className="w-10 h-10 rounded-lg bg-deep-600 flex items-center justify-center shrink-0">
                      <Smartphone size={18} className="text-text-secondary" />
                    </div>
                    <div>
                      <p className="text-text-primary text-sm font-medium">Android</p>
                      <p className="text-text-muted text-xs">Android 8.0 及以上版本</p>
                    </div>
                    <CheckCircle2 size={16} className="text-success ml-auto shrink-0" />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ==================== 大尺寸二维码区域 ==================== */}
      <section className="py-16 px-4">
        <div className="max-w-[1400px] mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="rounded-2xl border border-deep-700 bg-gradient-to-br from-deep-800 to-deep-800/50 p-10 md:p-14 text-center relative overflow-hidden"
          >
            {/* Background decoration */}
            <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-brand-500/8 rounded-full blur-3xl" />

            <div className="relative z-10">
              <h2 className="text-2xl font-bold text-text-primary mb-3">
                扫码即刻下载
              </h2>
              <p className="text-text-secondary text-sm mb-8">
                使用手机扫描下方二维码，自动识别系统并跳转至对应下载页面
              </p>

              {/* Large QR Code Display - 真实二维码指向 /h5 移动端 */}
              <div className="inline-block p-6 rounded-2xl bg-white">
                {apkInfo ? (
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(
                      typeof window !== 'undefined'
                        ? `${window.location.origin}${apkInfo.downloadUrl}`
                        : apkInfo.downloadUrl
                    )}&bgcolor=ffffff&color=0f1b3d`}
                    alt="ZS Exchange APK 下载二维码"
                    width={224}
                    height={224}
                    className="w-56 h-56 rounded-xl"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-56 h-56 bg-deep-100 rounded-xl flex items-center justify-center">
                    <Loader2 size={32} className="animate-spin text-deep-400" />
                  </div>
                )}
              </div>

              <p className="text-text-muted text-xs mt-6">
                支持微信 / 支付宝 / 相机 / 浏览器扫码
              </p>

              {/* 真实下载链接 + 复制按钮 */}
              {apkInfo && (
                <div className="mt-6 max-w-xl mx-auto">
                  <div className="flex items-center gap-2 p-2.5 rounded-xl bg-deep-700/60 border border-deep-600/50">
                    <span className="text-text-muted text-xs truncate flex-1 px-2 font-mono">
                      {typeof window !== 'undefined'
                        ? `${window.location.origin}${apkInfo.downloadUrl}`
                        : apkInfo.downloadUrl}
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyLink}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-500/15 border border-brand-500/30 text-brand-light text-xs font-medium hover:bg-brand-500/25 transition-colors"
                    >
                      {copied ? (
                        <>
                          <FileCheck2 size={14} /> 已复制
                        </>
                      ) : (
                        <>
                          <Copy size={14} /> 复制链接
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {error && (
                <p className="text-danger text-xs mt-4">
                  APK 元信息加载失败：{error}
                </p>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ==================== iOS 提示弹窗 ==================== */}
      <AnimatePresence>
        {iosTipOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
            onClick={() => setIosTipOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-deep-800 border border-deep-600 rounded-2xl p-6 max-w-sm w-full"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-brand-500/15 flex items-center justify-center">
                    <Apple size={20} className="text-brand-light" />
                  </div>
                  <h3 className="text-text-primary font-semibold">iOS 暂未上架</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIosTipOpen(false)}
                  className="text-text-muted hover:text-text-primary"
                >
                  <X size={18} />
                </button>
              </div>
              <p className="text-text-secondary text-sm leading-relaxed mb-5">
                ZS Exchange 暂未发布到 App Store。iPhone 用户可使用 Safari 浏览器打开
                <span className="text-brand-light font-mono mx-1">/h5</span>
                移动版网页，获得接近原生 App 的体验；Android 用户可直接下载上方 APK。
              </p>
              <div className="flex gap-3">
                <Link
                  href="/h5"
                  className="flex-1 no-underline"
                  onClick={() => setIosTipOpen(false)}
                >
                  <Button size="md" className="w-full !rounded-lg">
                    打开 H5 移动版
                  </Button>
                </Link>
                <Button
                  size="md"
                  variant="ghost"
                  className="!rounded-lg text-text-secondary"
                  onClick={() => setIosTipOpen(false)}
                >
                  知道了
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ==================== 版本更新日志 ==================== */}
      <section className="py-16 px-4">
        <div className="max-w-[1000px] mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-10"
          >
            <h2 className="text-2xl md:text-3xl font-bold text-text-primary mb-3">版本更新日志</h2>
            <p className="text-text-secondary text-sm">持续迭代，不断优化用户体验</p>
          </motion.div>

          <div className="space-y-4 max-w-3xl mx-auto">
            {[
              {
                version: 'v3.3.0',
                date: '2026.06.08',
                tag: '最新',
                changes: ['新增 NFT 市场模块', '优化交易撮合引擎，延迟降低40%', '新增深色/浅色主题切换', '修复已知安全漏洞'],
              },
              {
                version: 'v3.2.1',
                date: '2026.06.01',
                tag: '稳定版',
                changes: ['新增质押挖矿产品', '优化钱包页面UI', '支持更多语言包', '性能优化'],
              },
              {
                version: 'v3.1.0',
                date: '2026.05.15',
                tag: '',
                changes: ['上线 DEX 兑换功能', '重构用户中心页面', '新增生物识别登录'],
              },
              {
                version: 'v3.0.0',
                date: '2026.04.01',
                tag: '重大更新',
                changes: ['全新 UI 设计语言', '合约交易模块上线', '多链资产支持'],
              },
              {
                version: 'v1.3.0',
                date: '2025.12.20',
                tag: '',
                changes: ['首次发布正式版', '现货交易核心功能', '基础安全防护体系'],
              },
            ].map((log) => (
              <motion.div
                key={log.version}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3 }}
                className="flex items-start gap-4 p-5 rounded-xl bg-deep-800/50 border border-deep-700/50 hover:border-deep-600 transition-all"
              >
                <div className="shrink-0 w-24 text-center">
                  <p className="font-mono font-bold text-brand-500">{log.version}</p>
                  <p className="text-xs text-text-muted mt-1">{log.date}</p>
                </div>
                {log.tag && (
                  <Badge variant={log.tag === '最新' ? 'success' : log.tag === '稳定版' ? 'info' : log.tag === '重大更新' ? 'license' : 'default'} size="sm" className="shrink-0 mt-1">
                    {log.tag}
                  </Badge>
                )}
                <ul className="flex-1 flex flex-wrap gap-x-4 gap-y-1">
                  {log.changes.map((change, i) => (
                    <li key={i} className="text-sm text-text-secondary flex items-center gap-1.5 before:content-['•'] before:text-brand-500 before:font-bold">
                      {change}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== 功能特性对比表 (Web vs App) ==================== */}
      <section className="py-12 px-4 bg-deep-800/30">
        <div className="max-w-[1000px] mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-10"
          >
            <h2 className="text-2xl md:text-3xl font-bold text-text-primary mb-3">Web vs App 功能对比</h2>
            <p className="text-text-secondary text-sm">根据您的使用场景选择最适合的方式</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            <Card variant="default" padding="lg" className="overflow-x-auto">
              <table className="w-full min-w-[600px]">
                <thead>
                  <tr className="border-b border-deep-700">
                    <th className="text-left py-4 px-4 text-sm font-semibold text-text-muted">功能特性</th>
                    <th className="text-center py-4 px-4 text-sm font-semibold text-brand-500">Web端</th>
                    <th className="text-center py-4 px-4 text-sm font-semibold text-samoa">App端</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { feature: '现货交易', web: true, app: true },
                    { feature: '合约交易', web: true, app: true },
                    { feature: '实时行情推送', web: false as boolean | string, app: true as boolean | string },
                    { feature: '价格预警通知', web: false, app: true },
                    { feature: 'Face ID / 指纹登录', web: false, app: true },
                    { feature: '快捷交易（一键买卖）', web: false, app: true },
                    { feature: '离线订单管理', web: false, app: true },
                    { feature: 'NFT 预览与交易', web: true, app: true },
                    { feature: '质押理财', web: true, app: true },
                    { feature: '高级图表分析工具', web: true, app: 'partial' },
                    { feature: 'API 交易接入', web: true, app: false },
                    { feature: '多屏幕同时监控', web: true, app: false },
                  ].map((row, i) => (
                    <tr key={row.feature} className={`border-b border-deep-700/50 ${i % 2 === 0 ? '' : 'bg-deep-900/30'}`}>
                      <td className="py-3 px-4 text-sm text-text-secondary">{row.feature}</td>
                      <td className="py-3 px-4 text-center">
                        {row.web === true ? (
                          <CheckCircle2 size={18} className="inline text-success" />
                        ) : row.web === 'partial' ? (
                          <span className="text-warning text-xs">部分</span>
                        ) : (
                          <span className="text-text-muted text-xs">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {row.app === true ? (
                          <CheckCircle2 size={18} className="inline text-success" />
                        ) : row.app === 'partial' ? (
                          <span className="text-warning text-xs">部分</span>
                        ) : (
                          <span className="text-text-muted text-xs">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          </motion.div>
        </div>
      </section>
      <section className="py-16 px-4">
        <div className="max-w-[1400px] mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="rounded-2xl bg-gradient-to-r from-brand-primary/20 to-samoa/10 border border-brand-500/30 p-10 md:p-14 text-center"
          >
            <h2 className="text-2xl md:text-3xl font-bold text-text-primary mb-3">
              还没有 ZS Exchange 账户？
            </h2>
            <p className="text-text-secondary text-base mb-8 max-w-md mx-auto">
              注册即享新人礼包，开始使用 ZS Exchange
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/register" className="no-underline">
                <Button size="lg" rightIcon={<ArrowRight size={18} />} className="!rounded-lg">
                  免费注册账户
                </Button>
              </Link>
              <Link href="/login" className="no-underline">
                <Button variant="ghost" size="lg" className="!rounded-lg text-text-secondary hover:!text-text-primary">
                  已有账号？登录
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
