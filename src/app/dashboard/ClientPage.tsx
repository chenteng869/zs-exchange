'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import {
  Wallet,
  ArrowDownToLine,
  ArrowUpFromLine,
  BarChart3,
  ArrowLeftRight,
  TrendingUp,
  Clock,
  Bell,
  ChevronRight,
  Zap,
  Landmark,
  Coins,
  FileText,
  ShieldCheck,
  Users,
  Gift,
} from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Card } from '@/components/ui';
import { Badge } from '@/components/ui';
import { fadeInUp, staggerContainer, staggerItem, hoverLift, cardGlow } from '@/lib/animations';

/* ==================== Mock 数据定义 ==================== */

// 资产分布饼图数据
const ASSET_DISTRIBUTION = [
  { name: 'BTC', value: 40, color: '#F7931A' },
  { name: 'ETH', value: 25, color: '#627EEA' },
  { name: 'USDT', value: 20, color: '#26A17B' },
  { name: '其他', value: 15, color: '#7C3AED' },
];

// 最近活动记录
const RECENT_ACTIVITIES = [
  { id: 1, type: 'buy', token: 'BTC/USDT', amount: '+0.025 BTC', time: '10分钟前', status: 'success' },
  { id: 2, type: 'deposit', token: 'USDT', amount: '+5,000 USDT', time: '2小时前', status: 'success' },
  { id: 3, type: 'staking', token: 'ETH', amount: '-2.5 ETH (质押)', time: '5小时前', status: 'success' },
  { id: 4, type: 'withdraw', token: 'USDT', amount: '-1,000 USDT', time: '昨天 18:30', status: 'pending' },
  { id: 5, type: 'reward', token: 'ZST', amount: '+125.5 ZST (质押收益)', time: '昨天 08:00', status: 'success' },
];

// 快捷入口配置
const QUICK_ENTRIES = [
  { icon: <Zap size={24} />, label: '现货交易', href: '/trade/spot', color: '#3B82F6', bg: 'from-blue-500/20 to-blue-600/10' },
  { icon: <TrendingUp size={24} />, label: '合约交易', href: '/trade/futures', color: '#8B5CF6', bg: 'from-purple-500/20 to-purple-600/10' },
  { icon: <Coins size={24} />, label: '质押理财', href: '/defi/staking', color: '#10B981', bg: 'from-emerald-500/20 to-emerald-600/10' },
  { icon: <Landmark size={24} />, label: 'IDO认购', href: '/ido', color: '#D4AF37', bg: 'from-yellow-500/20 to-yellow-600/10' },
  { icon: <Wallet size={24} />, label: '钱包管理', href: '/user/wallet', color: '#06B6D4', bg: 'from-cyan-500/20 to-cyan-600/10' },
  { icon: <FileText size={24} />, label: '订单查询', href: '/trade/orders', color: '#F59E0B', bg: 'from-amber-500/20 to-amber-600/10' },
  { icon: <ShieldCheck size={24} />, label: 'KYC认证', href: '/user/kyc', color: '#EC4899', bg: 'from-pink-500/20 to-pink-600/10' },
  { icon: <Users size={24} />, label: '邀请好友', href: '/user/invite', color: '#14B8A6', bg: 'from-teal-500/20 to-teal-600/10' },
];

// 最新公告
const ANNOUNCEMENTS = [
  {
    id: 1,
    title: 'ZS Exchange 即将上线 SOL/USDT 永续合约交易对',
    date: '2026-06-09',
    tag: '新品',
  },
  {
    id: 2,
    title: '端午节期间充值手续费全免活动开启',
    date: '2026-06-08',
    tag: '活动',
  },
];

/* ==================== 活动类型图标映射 ====================
// eslint-disable-next-line @typescript-eslint/no-explicit-any */
function getActivityIcon(type: string) {
  const iconMap: Record<string, { icon: React.ReactNode; color: string }> = {
    buy: { icon: <BarChart3 size={16} />, color: 'text-blue-400' },
    sell: { icon: <BarChart3 size={16} />, color: 'text-orange-400' },
    deposit: { icon: <ArrowDownToLine size={16} />, color: 'text-green-400' },
    withdraw: { icon: <ArrowUpFromLine size={16} />, color: 'text-danger' },
    staking: { icon: <Coins size={16} />, color: 'text-purple-400' },
    reward: { icon: <Gift size={16} />, color: 'text-yellow-400' },
  };
  return iconMap[type] || { icon: <Clock size={16} />, color: 'text-text-muted' };
}

export default function DashboardPage() {
  // 充值弹窗状态
  const [showDepositModal, setShowDepositModal] = useState(false);

  return (
    <main className="min-h-screen bg-white">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* ==================== 欢迎区域 ==================== */}
        <motion.div
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8"
        >
          <div className="flex items-center gap-4">
            {/* 用户头像 */}
            <div className="w-14 h-14 rounded-full bg-gradient-to-br bg-brand-500 text-[#1A1D24] flex items-center justify-center text-white text-xl font-bold shadow-lg shadow-brand-500/30">
              ZS
            </div>
            <div>
              <h1 className="text-2xl font-bold text-text-primary">
                你好,{' '}
                <span className="bg-gradient-to-r bg-brand-500 text-[#1A1D24] bg-clip-text text-transparent">
                  投资者
                </span>
              </h1>
              <p className="text-sm text-text-secondary mt-0.5">欢迎回到 ZS Exchange</p>
            </div>
            {/* KYC 认证徽章 */}
            <Badge variant="samoa" size="md" className="shrink-0">
              🇼🇸 KYC已认证
            </Badge>
          </div>
          {/* 通知按钮 */}
          <button className="relative p-2.5 rounded-xl bg-deep-800 border border-deep-700 text-text-muted hover:text-text-primary hover:border-deep-600 transition-all duration-200 cursor-pointer">
            <Bell size={20} />
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-danger rounded-full text-[10px] text-white flex items-center justify-center font-medium">
              2
            </span>
          </button>
        </motion.div>

        {/* ==================== 资产总览卡片 (深紫渐变背景) ==================== */}
        <motion.div
          variants={cardGlow as any}
          initial="initial"
          animate="animate"
          className="relative overflow-hidden rounded-2xl mb-8"
          style={{
            background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.35) 0%, rgba(11, 15, 25, 0.95) 60%, rgba(124, 58, 237, 0.15) 100%)',
            border: '1px solid rgba(124, 58, 237, 0.3)',
          }}
        >
          {/* 装饰性光晕 */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/10 rounded-full blur-[100px]" />
          <div className="absolute bottom-0 left-32 w-48 h-48 bg-info/10 rounded-full blur-[80px]" />

          <div className="relative z-10 p-6 sm:p-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              {/* 左侧：总资产信息 */}
              <div>
                <p className="text-sm text-text-muted uppercase tracking-wider mb-1">总资产估值 (USD)</p>
                <div className="flex items-baseline gap-3">
                  <span className="text-4xl sm:text-5xl font-bold text-[#1E2329]">$105,432.78</span>
                </div>
                {/* 24小时盈亏 */}
                <div className="flex items-center gap-2 mt-2">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-success/20 text-success text-sm font-semibold">
                    +$1,234.56
                  </span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-success/10 text-success text-sm">
                    +0.23%
                    <TrendingUp size={14} className="ml-1" />
                  </span>
                  <span className="text-text-muted text-sm">(24h)</span>
                </div>
              </div>

              {/* 右侧：快捷操作按钮组 */}
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => setShowDepositModal(true)}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r bg-brand-500 text-[#1A1D24] text-white text-sm font-medium hover:shadow-lg hover:shadow-brand-500/30 transition-all duration-300 cursor-pointer"
                >
                  <ArrowDownToLine size={16} />
                  充值
                </button>
                <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#F7F8FA] border border-[#EAECEF] text-text-secondary text-sm font-medium hover:bg-[#EAECEF] hover:text-text-primary transition-all duration-200 cursor-pointer">
                  <ArrowUpFromLine size={16} />
                  提现
                </button>
                <Link
                  href="/trade/spot"
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#F7F8FA] border border-[#EAECEF] text-text-secondary text-sm font-medium hover:bg-[#EAECEF] hover:text-text-primary transition-all duration-200 no-underline"
                >
                  <BarChart3 size={16} />
                  交易
                </Link>
                <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#F7F8FA] border border-[#EAECEF] text-text-secondary text-sm font-medium hover:bg-[#EAECEF] hover:text-text-primary transition-all duration-200 cursor-pointer">
                  <ArrowLeftRight size={16} />
                  转账
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ==================== 主内容区：左侧资产分布 + 右侧活动列表 ==================== */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8"
        >
          {/* 资产分布饼图区域 */}
          <motion.div variants={staggerItem} className="lg:col-span-1">
            <Card variant="default" padding="lg" className="h-full">
              <h3 className="text-lg font-semibold text-text-primary mb-6">资产分布</h3>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={ASSET_DISTRIBUTION}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={4}
                    dataKey="value"
                    stroke="none"
                  >
                    {ASSET_DISTRIBUTION.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#FFFFFF',
                      border: '1px solid #EAECEF',
                      borderRadius: '12px',
                      fontSize: '13px',
                    }}
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    formatter={(value: any) => [`${value}%`, '占比']}
                  />
                </PieChart>
              </ResponsiveContainer>
              {/* 图例 */}
              <div className="space-y-2 mt-4">
                {ASSET_DISTRIBUTION.map((item) => (
                  <div key={item.name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-text-secondary">{item.name}</span>
                    </div>
                    <span className="text-text-primary font-medium">{item.value}%</span>
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>

          {/* 最近活动列表 */}
          <motion.div variants={staggerItem} className="lg:col-span-2">
            <Card variant="default" padding="lg" className="h-full">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-semibold text-text-primary">最近活动</h3>
                <Link
                  href="/user/wallet/transactions"
                  className="text-sm text-brand-light hover:text-brand-500 transition-colors flex items-center gap-1 no-underline"
                >
                  查看全部
                  <ChevronRight size={14} />
                </Link>
              </div>
              <div className="space-y-3">
                {RECENT_ACTIVITIES.map((activity) => {
                  const { icon, color } = getActivityIcon(activity.type);
                  return (
                    <div
                      key={activity.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-deep-700/30 hover:bg-deep-700/60 transition-colors duration-200"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-lg bg-deep-800 flex items-center justify-center ${color}`}>
                          {icon}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-text-primary">{activity.token}</p>
                          <p className="text-xs text-text-muted">{activity.time}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-semibold ${activity.amount.startsWith('+') ? 'text-success' : activity.type === 'withdraw' ? 'text-danger' : 'text-text-primary'}`}>
                          {activity.amount}
                        </p>
                        <Badge
                          variant={activity.status === 'success' ? 'success' : 'warning'}
                          size="sm"
                        >
                          {activity.status === 'success' ? '已完成' : '处理中'}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </motion.div>
        </motion.div>

        {/* ==================== 快捷入口网格 (2×4) ==================== */}
        <motion.section variants={staggerContainer} initial="hidden" animate="visible" className="mb-8">
          <h2 className="text-lg font-semibold text-text-primary mb-4">快捷入口</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {QUICK_ENTRIES.map((entry, index) => (
              <motion.div key={entry.label} variants={staggerItem} className="group cursor-pointer">
                <Link
                  href={entry.href}
                  className="block p-4 sm:p-5 rounded-xl bg-deep-800 border border-deep-700 hover:border-deep-600 transition-all duration-300 group no-underline"
                >
                  <div
                    className={`w-12 h-12 rounded-xl bg-gradient-to-br ${entry.bg} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300`}
                    style={{ color: entry.color }}
                  >
                    {entry.icon}
                  </div>
                  <p className="text-sm font-medium text-text-primary group-hover:text-[#1E2329] transition-colors">
                    {entry.label}
                  </p>
                </Link>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* ==================== 公告 / 通知区域 ==================== */}
        <motion.section variants={fadeInUp} initial="hidden" animate="visible">
          <Card variant="default" padding="lg">
            <div className="flex items-center gap-2 mb-4">
              <Bell size={18} className="text-brand-500" />
              <h3 className="text-lg font-semibold text-text-primary">最新公告</h3>
            </div>
            <div className="space-y-3">
              {ANNOUNCEMENTS.map((announcement) => (
                <div
                  key={announcement.id}
                  className="flex items-start gap-3 p-4 rounded-xl bg-deep-700/30 hover:bg-deep-700/50 transition-colors duration-200 cursor-pointer"
                >
                  <Badge variant="info" size="sm" className="mt-0.5 shrink-0">
                    {announcement.tag}
                  </Badge>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-primary leading-relaxed">{announcement.title}</p>
                    <p className="text-xs text-text-muted mt-1">{announcement.date}</p>
                  </div>
                  <ChevronRight size={16} className="text-text-muted shrink-0 mt-1" />
                </div>
              ))}
            </div>
          </Card>
        </motion.section>
      </div>

      <Footer />

      {/* ==================== 充值弹窗 (简化版) ==================== */}
      {showDepositModal && (
        <div className="fixed inset-0 z-[1050] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowDepositModal(false)}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="relative z-10 w-full max-w-md rounded-2xl bg-deep-800 border border-deep-700 shadow-2xl p-6"
          >
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold text-text-primary">选择充值币种</h3>
              <button
                onClick={() => setShowDepositModal(false)}
                className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-deep-700 transition-colors cursor-pointer"
              >
                X
              </button>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {['BTC', 'ETH', 'USDT', 'BNB', 'SOL', 'USDC'].map((coin) => (
                <button
                  key={coin}
                  className="p-3 rounded-xl bg-[#F7F8FA] border border-[#EAECEF] hover:border-brand-500 hover:bg-[#EAECEF] text-text-primary font-medium text-sm transition-all duration-200 cursor-pointer"
                >
                  {coin}
                </button>
              ))}
            </div>
            <p className="text-xs text-text-muted mt-4 text-center">
              选择币种后将显示对应网络的充值地址和二维码
            </p>
          </motion.div>
        </div>
      )}
    </main>
  );
}
