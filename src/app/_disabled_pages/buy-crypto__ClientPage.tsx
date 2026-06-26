'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Shield,
  Lock,
  Server,
  Smartphone,
  Users,
  Banknote,
  CreditCard,
  Handshake,
  ChevronDown,
  ChevronUp,
  QrCode,
  Fingerprint,
  KeyRound,
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

// ==================== 购买方式数据 ====================
const buyMethods = [
  {
    icon: <Handshake size={32} className="text-brand-500" />,
    title: 'P2P 交易',
    description: '与全球认证商家直接交易，支持多种支付方式，灵活便捷，费率低廉。',
    features: ['多币种支持', '0 手续费', '即时到账', '安全托管'],
    ctaText: '立即购买',
  },
  {
    icon: <Banknote size={32} className="text-samoa" />,
    title: '银行转账',
    description: '通过银行电汇直接购买，大额交易首选，安全可靠，到账迅速。',
    features: ['大额支持', '银行级安全', '实时汇率', '合规通道'],
    ctaText: '立即购买',
  },
  {
    icon: <CreditCard size={32} className="text-success" />,
    title: '第三方支付',
    description: '接入主流第三方支付平台，一键购买，操作简单，新人友好。',
    features: ['快捷支付', '小额起步', '自动撮合', '7×24服务'],
    ctaText: '立即购买',
  },
];

// ==================== 支持的法币列表 ====================
const supportedFiatCurrencies = [
  { code: 'CNY', name: '人民币', flag: '🇨🇳' },
  { code: 'USD', name: '美元', flag: '🇺🇸' },
  { code: 'EUR', name: '欧元', flag: '🇪🇺' },
  { code: 'GBP', name: '英镑', flag: '🇬🇧' },
  { code: 'JPY', name: '日元', flag: '🇯🇵' },
  { code: 'KRW', name: '韩元', flag: '🇰🇷' },
];

// ==================== FAQ 数据 ====================
const faqData = [
  {
    question: '购买数字资产需要什么条件？',
    answer:
      '您只需完成 ZS Exchange 的实名认证（KYC）即可开始购买。我们支持全球180+国家和地区的用户，认证流程简单快捷，通常在10分钟内完成。',
  },
  {
    question: 'P2P交易安全吗？资金如何保障？',
    answer:
      'ZS Exchange 采用平台担保交易模式，买家付款后资金由平台托管，卖家确认收款后才会释放资产。所有 P2P 商家均经过严格审核，平台提供完整的纠纷处理机制，保障您的交易安全。',
  },
  {
    question: '购买后的数字资产如何存储？',
    answer:
      '购买成功后，您的数字资产将存入 ZS Exchange 的热钱包中。我们建议用户将大额资产转入冷钱包存储。ZS Exchange 提供95%以上的冷存储比例，并投保了数字资产保险，最大程度保障您的资产安全。',
  },
  {
    question: '支持的最低购买金额是多少？',
    answer:
      '不同购买方式的最低金额有所不同：P2P交易最低 ¥10 起，银行转账最低 $100 起，第三方支付最低 ¥1 起。具体限额可能因地区和支付渠道而异，请以实际页面显示为准。',
  },
];

// ==================== 安全保障数据 ====================
const securityFeatures = [
  {
    icon: <Server size={24} className="text-brand-500" />,
    title: '多重签名冷存储',
    description: '95%+ 资产离线冷存储',
  },
  {
    icon: <Lock size={24} className="text-samoa" />,
    title: 'SSL/TLS 加密传输',
    description: '银行级数据加密保护',
  },
  {
    icon: <KeyRound size={24} className="text-success" />,
    title: '2FA 双重认证',
    description: 'Google Authenticator 保护',
  },
  {
    icon: <Fingerprint size={24} className="text-info" />,
    title: '生物识别登录',
    description: '指纹 / Face ID 支持',
  },
];

// ==================== 虚拟商家数据 ====================
interface Merchant {
  id: string;
  name: string;
  avatar: string;
  rating: number;
  tradeCount: number;
  minAmount: number;
  maxAmount: number;
  paymentMethods: string[];
  completionRate: string;
  responseTime: string;
}

const MERCHANTS: Merchant[] = [
  { id: 'm1', name: '数字资产大师', avatar: 'SZ', rating: 4.9, tradeCount: 15280, minAmount: 100, maxAmount: 50000, paymentMethods: ['银行卡', '支付宝'], completionRate: '99.8%', responseTime: '<1分钟' },
  { id: 'm2', name: 'CryptoKing', avatar: 'CK', rating: 4.8, tradeCount: 23450, minAmount: 50, maxAmount: 100000, paymentMethods: ['支付宝', '微信', 'USDT'], completionRate: '99.5%', responseTime: '<2分钟' },
  { id: 'm3', name: '区块链先锋', avatar: 'QK', rating: 4.7, tradeCount: 8920, minAmount: 200, maxAmount: 30000, paymentMethods: ['银行卡', 'USDT'], completionRate: '99.2%', responseTime: '<3分钟' },
  { id: 'm4', name: '稳定币专家', avatar: 'WD', rating: 4.9, tradeCount: 31200, minAmount: 10, maxAmount: 200000, paymentMethods: ['支付宝', '微信', '银行卡', 'USDT'], completionRate: '99.9%', responseTime: '<30秒' },
  { id: 'm5', name: '极速交易者', avatar: 'JS', rating: 4.6, tradeCount: 5670, minAmount: 100, maxAmount: 20000, paymentMethods: ['支付宝', '微信'], completionRate: '98.5%', responseTime: '<5分钟' },
];

// ==================== 支付方式选项 ====================
const PAYMENT_OPTIONS = [
  { id: 'bank', label: '银行转账', icon: <Banknote size={18} />, desc: '大额交易首选' },
  { id: 'alipay', label: '支付宝', icon: <Smartphone size={18} />, desc: '快捷方便' },
  { id: 'wechat', label: '微信支付', icon: <Smartphone size={18} />, desc: '即时到账' },
  { id: 'usdt', label: 'USDT支付', icon: <Coins size={18} />, desc: '加密货币支付' },
];

export default function BuyCryptoPage() {
  // FAQ 展开状态
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);
  
  // 买币表单状态
  const [selectedPayment, setSelectedPayment] = useState('alipay');
  const [buyAmount, setBuyAmount] = useState('');
  const [selectedMerchant, setSelectedMerchant] = useState<Merchant | null>(null);
  const [showOrderConfirm, setShowOrderConfirm] = useState(false);

  // Toggle FAQ item
  const toggleFaq = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  return (
    <main className="min-h-screen bg-deep-900">
      <Navbar />

      {/* ==================== Hero 区域 ==================== */}
      <section className="relative pt-28 pb-16 px-4 overflow-hidden">
        {/* Background decorations */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 left-1/4 w-72 h-72 bg-brand-500/15 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-success/8 rounded-full blur-3xl" />
        </div>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="max-w-[1400px] mx-auto text-center relative z-10"
        >
          <motion.div variants={fadeInUp}>
            <Badge variant="samoa" size="md" className="mb-6">
              🇼🇸 萨摩亚持牌 · 合规买币通道
            </Badge>
          </motion.div>

          <motion.h1
            variants={fadeInUp}
            className="text-4xl md:text-5xl lg:text-6xl font-bold text-text-primary mb-5 leading-tight"
          >
            快速便捷地
            <br />
            <span className="bg-gradient-to-r bg-brand-500 text-[#1A1D24] bg-clip-text text-transparent">
              购买数字资产
            </span>
          </motion.h1>

          <motion.p
            variants={fadeInUp}
            className="text-lg md:text-xl text-text-secondary max-w-2xl mx-auto mb-8 leading-relaxed"
          >
            多种购买方式，支持全球主流法币，安全合规的交易通道，
            让您便捷地买入数字资产
          </motion.p>

          <motion.div variants={fadeInUp} className="flex flex-wrap items-center justify-center gap-3">
            {supportedFiatCurrencies.map((currency) => (
              <Badge key={currency.code} variant="default" size="md">
                {currency.flag} {currency.code}
                <span className="ml-1 text-text-muted">{currency.name}</span>
              </Badge>
            ))}
          </motion.div>
        </motion.div>
      </section>

      {/* ==================== 购买方式卡片区 ==================== */}
      <section className="py-16 px-4">
        <div className="max-w-[1400px] mx-auto">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8"
          >
            {buyMethods.map((method, index) => (
              <motion.div
                key={method.title}
                variants={staggerItem}
                {...hoverLift}
              >
                <Card variant="default" padding="lg" className="h-full flex flex-col group">
                  {/* Icon & Title */}
                  <div className="flex items-center gap-4 mb-5">
                    <div className="p-3 rounded-xl bg-deep-700 group-hover:bg-deep-600 transition-colors">
                      {method.icon}
                    </div>
                    <h3 className="text-xl font-bold text-text-primary">
                      {method.title}
                    </h3>
                  </div>

                  {/* Description */}
                  <p className="text-text-secondary text-sm leading-relaxed mb-6 flex-grow">
                    {method.description}
                  </p>

                  {/* Feature tags */}
                  <div className="flex flex-wrap gap-2 mb-6">
                    {method.features.map((feature) => (
                      <Badge key={feature} variant="info" size="sm">
                        {feature}
                      </Badge>
                    ))}
                  </div>

                  {/* CTA Button */}
                  <Link href="/login" className="no-underline">
                    <Button
                      variant="outline"
                      size="md"
                      rightIcon={<ArrowRight size={16} />}
                      className="w-full !rounded-lg"
                    >
                      {method.ctaText}
                    </Button>
                  </Link>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ==================== P2P商家列表 + 买币表单 ==================== */}
      <section className="py-16 px-4">
        <div className="max-w-[1200px] mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-2xl md:text-3xl font-bold text-text-primary mb-2 text-center">P2P 商家列表</h2>
            <p className="text-text-secondary text-sm text-center mb-8">选择认证商家，安全便捷购买数字资产</p>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* 左侧：支付方式选择 + 金额输入 */}
              <div className="space-y-6">
                <Card variant="default" padding="lg">
                  <h3 className="text-base font-semibold text-text-primary mb-4 flex items-center gap-2">
                    <CreditCard size={18} className="text-brand-500" />
                    选择支付方式
                  </h3>
                  <div className="space-y-2">
                    {PAYMENT_OPTIONS.map((option) => (
                      <button
                        key={option.id}
                        onClick={() => setSelectedPayment(option.id)}
                        className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all duration-200 cursor-pointer ${
                          selectedPayment === option.id
                            ? 'border-brand-500 bg-brand-500/10'
                            : 'border-deep-700 bg-deep-800 hover:border-deep-600'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className={selectedPayment === option.id ? 'text-brand-500' : 'text-text-muted'}>
                            {option.icon}
                          </span>
                          <span className={`font-medium ${selectedPayment === option.id ? 'text-text-primary' : 'text-text-secondary'}`}>
                            {option.label}
                          </span>
                        </div>
                        <span className="text-xs text-text-muted">{option.desc}</span>
                      </button>
                    ))}
                  </div>

                  {/* 金额输入 */}
                  <div className="mt-6 pt-6 border-t border-deep-700/50">
                    <label className="block text-sm font-medium text-text-secondary mb-2">购买金额 (CNY)</label>
                    <input
                      type="number"
                      value={buyAmount}
                      onChange={(e) => setBuyAmount(e.target.value)}
                      placeholder="请输入购买金额"
                      className="w-full px-4 py-3 rounded-xl bg-deep-900 border border-deep-700 text-text-primary font-mono placeholder:text-text-muted focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500/50 transition-all"
                    />
                    <div className="flex items-center justify-between mt-2 text-xs text-text-muted">
                      <span>预计获得 ≈ {buyAmount ? (parseFloat(buyAmount) / 68000).toFixed(6) : '0.000000'} BTC</span>
                      <span>汇率: ¥68,000/BTC</span>
                    </div>
                  </div>
                </Card>

                {/* 安全提示 */}
                <Card variant="default" padding="md" className="border-warning/30 bg-warning/5">
                  <div className="flex items-start gap-3">
                    <Shield size={20} className="text-warning shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-semibold text-text-primary mb-2">安全交易提示</h4>
                      <ul className="space-y-1 text-xs text-text-secondary">
                        <li>• 请确认收款方信息与平台显示一致</li>
                        <li>• 切勿在聊天中点击不明链接</li>
                        <li>• 完成付款后请及时点击"我已付款"</li>
                        <li>• 如遇纠纷可申请平台仲裁</li>
                      </ul>
                    </div>
                  </div>
                </Card>
              </div>

              {/* 右侧：商家列表 */}
              <div className="lg:col-span-2">
                <Card variant="default" padding="lg">
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="text-base font-semibold text-text-primary flex items-center gap-2">
                      <Users size={18} className="text-samoa" />
                      认证商家
                    </h3>
                    <Badge variant="info" size="sm">{MERCHANTS.length} 位在线</Badge>
                  </div>

                  <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
                    {MERCHANTS.map((merchant) => (
                      <button
                        key={merchant.id}
                        onClick={() => setSelectedMerchant(merchant)}
                        className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all duration-200 cursor-pointer text-left ${
                          selectedMerchant?.id === merchant.id
                            ? 'border-brand-500 bg-brand-500/5'
                            : 'border-deep-700 bg-deep-800/50 hover:border-deep-600'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{merchant.avatar}</span>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-text-primary">{merchant.name}</span>
                              <span className="flex items-center gap-0.5 text-xs text-gold">
                                <Star size={12} fill="currentColor" />
                                {merchant.rating}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 mt-1 text-xs text-text-muted">
                              <span>成交{merchant.tradeCount.toLocaleString()}笔</span>
                              <span>|</span>
                              <span>{merchant.completionRate}完成率</span>
                              <span>|</span>
                              <span>{merchant.responseTime}</span>
                            </div>
                            <div className="flex gap-1 mt-1.5">
                              {merchant.paymentMethods.map((method) => (
                                <span key={method} className="px-1.5 py-0.5 rounded bg-deep-700 text-[10px] text-text-muted">
                                  {method}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                        <div className="text-right shrink-0 ml-4">
                          <p className="text-xs text-text-muted">限额</p>
                          <p className="text-sm font-mono text-text-primary">
                            ¥{merchant.minAmount.toLocaleString()} - ¥{merchant.maxAmount.toLocaleString()}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>

                  {/* 下单按钮 */}
                  <Button
                    variant="primary"
                    size="lg"
                    className="w-full !rounded-xl mt-5"
                    disabled={!selectedMerchant || !buyAmount}
                    rightIcon={<ArrowRight size={18} />}
                    onClick={() => setShowOrderConfirm(true)}
                  >
                    {!selectedMerchant ? '请选择商家' : !buyAmount ? '请输入金额' : `向 ${selectedMerchant.name} 下单`}
                  </Button>
                </Card>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ==================== 订单确认弹窗 ==================== */}
      {showOrderConfirm && selectedMerchant && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[1050] flex items-center justify-center p-4"
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowOrderConfirm(false)} />
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="relative z-10 w-full max-w-md rounded-2xl bg-deep-800 border border-deep-700 shadow-2xl p-6"
          >
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-text-primary">订单确认</h3>
              <button onClick={() => setShowOrderConfirm(false)} className="text-text-muted hover:text-text-primary text-lg">X</button>
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex justify-between py-2 px-3 rounded-lg bg-deep-900/50">
                <span className="text-sm text-text-muted">商家</span>
                <span className="text-sm font-medium text-text-primary">{selectedMerchant.avatar} {selectedMerchant.name}</span>
              </div>
              <div className="flex justify-between py-2 px-3 rounded-lg bg-deep-900/50">
                <span className="text-sm text-text-muted">支付方式</span>
                <span className="text-sm font-medium text-text-primary">{PAYMENT_OPTIONS.find(p => p.id === selectedPayment)?.label}</span>
              </div>
              <div className="flex justify-between py-2 px-3 rounded-lg bg-deep-900/50">
                <span className="text-sm text-text-muted">购买金额</span>
                <span className="text-sm font-bold text-gold font-mono">¥{parseFloat(buyAmount || '0').toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-2 px-3 rounded-lg bg-deep-900/50">
                <span className="text-sm text-text-muted">预计获得</span>
                <span className="text-sm font-bold text-success font-mono">≈ {(parseFloat(buyAmount || '0') / 68000).toFixed(6)} BTC</span>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-warning/10 border border-warning/20 mb-6">
              <p className="text-xs text-warning leading-relaxed">
                请在30分钟内完成付款，超时订单将自动取消。付款时请务必核对商户提供的收款账户信息。
              </p>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" size="md" className="flex-1 !rounded-lg" onClick={() => setShowOrderConfirm(false)}>
                取消
              </Button>
              <Button
                variant="primary"
                size="md"
                className="flex-1 !rounded-lg"
                onClick={() => {
                  alert('订单已创建！请在聊天窗口内完成付款');
                  setShowOrderConfirm(false);
                }}
              >
                确认下单
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* ==================== 支持的法币展示区 ==================== */}
      <section className="py-12 px-4">
        <div className="max-w-[1400px] mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="rounded-2xl border border-deep-700 bg-deep-800/50 p-8 md:p-10"
          >
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-text-primary mb-2">
                全球法币支持
              </h2>
              <p className="text-text-secondary text-sm">
                支持以下主要法币进行数字资产购买
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
              {supportedFiatCurrencies.map((currency) => (
                <div
                  key={currency.code}
                  className="
                    flex flex-col items-center gap-2 p-4 rounded-xl
                    bg-deep-700/50 border border-deep-600/50
                    hover:border-brand-500/30 hover:bg-deep-700
                    transition-all duration-200 cursor-default
                  "
                >
                  <span className="text-3xl">{currency.flag}</span>
                  <span className="text-text-primary font-bold text-sm">
                    {currency.code}
                  </span>
                  <span className="text-text-muted text-xs">{currency.name}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ==================== FAQ 常见问题区 ==================== */}
      <section className="py-16 px-4">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-10"
          >
            <h2 className="text-2xl md:text-3xl font-bold text-text-primary mb-3">
              常见问题
            </h2>
            <p className="text-text-secondary text-sm">
              关于购买数字资产的常见疑问解答
            </p>
          </motion.div>

          <div className="space-y-3">
            {faqData.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.3 }}
                className="rounded-xl border border-deep-700 bg-deep-800 overflow-hidden"
              >
                <button
                  onClick={() => toggleFaq(index)}
                  className="
                    w-full flex items-center justify-between p-5
                    text-left text-text-primary font-medium
                    hover:bg-deep-700/50 transition-colors cursor-pointer
                  "
                  aria-expanded={openFaqIndex === index}
                >
                  <span className="pr-4">{faq.question}</span>
                  {openFaqIndex === index ? (
                    <ChevronUp size={18} className="shrink-0 text-brand-500" />
                  ) : (
                    <ChevronDown size={18} className="shrink-0 text-text-muted" />
                  )}
                </button>

                {/* Expandable Answer */}
                {openFaqIndex === index && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
                    className="px-5 pb-5"
                  >
                    <p className="text-text-secondary text-sm leading-relaxed pt-2 border-t border-deep-700/50">
                      {faq.answer}
                    </p>
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== 安全保障说明区 ==================== */}
      <section className="py-16 px-4">
        <div className="max-w-[1400px] mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="rounded-2xl border border-deep-700 bg-gradient-to-br from-deep-800 to-deep-800/50 p-8 md:p-12 relative overflow-hidden"
          >
            {/* Background glow effect */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/10 rounded-full blur-3xl" />

            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-8">
                <div className="p-2 rounded-lg bg-success/20">
                  <Shield size={24} className="text-success" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-text-primary">
                    安全保障体系
                  </h2>
                  <p className="text-text-secondary text-sm mt-1">
                    银行级别的安全防护体系，守护您的每一笔资产
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {securityFeatures.map((feature, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 15 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1, duration: 0.3 }}
                    className="flex items-start gap-3 p-4 rounded-xl bg-deep-900/50 border border-deep-700/50"
                  >
                    <div className="p-2 rounded-lg bg-deep-800 shrink-0">
                      {feature.icon}
                    </div>
                    <div>
                      <h4 className="text-text-primary font-medium text-sm mb-1">
                        {feature.title}
                      </h4>
                      <p className="text-text-muted text-xs leading-relaxed">
                        {feature.description}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ==================== 底部 CTA 区 ==================== */}
      <section className="py-16 px-4">
        <div className="max-w-[1400px] mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="rounded-2xl bg-gradient-to-r from-brand-primary/20 to-info/10 border border-brand-500/30 p-10 md:p-14 text-center relative overflow-hidden"
          >
            {/* Decorative elements */}
            <div className="absolute -top-20 -right-20 w-60 h-60 bg-brand-500/10 rounded-full blur-3xl" />

            <div className="relative z-10 space-y-5 max-w-lg mx-auto">
              <h2 className="text-2xl md:text-3xl font-bold text-text-primary">
                准备好开始了吗？
              </h2>
              <p className="text-text-secondary text-base leading-relaxed">
                立即注册 ZS Exchange 账户，享受安全、便捷的数字资产购买体验
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
                <Link href="/register" className="no-underline">
                  <Button size="lg" rightIcon={<ArrowRight size={18} />} className="!rounded-lg">
                    免费注册账户
                  </Button>
                </Link>
                <Link href="/help" className="no-underline">
                  <Button variant="ghost" size="lg" className="!rounded-lg text-text-secondary hover:!text-text-primary">
                    了解更多
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
