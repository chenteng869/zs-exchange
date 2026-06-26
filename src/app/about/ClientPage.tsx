'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Globe,
  Shield,
  Users,
  Award,
  Building2,
  Target,
  Clock,
  Mail,
  Phone,
  MapPin,
  Send,
  CheckCircle2,
  ArrowRight,
  Handshake,
} from 'lucide-react';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Button, Card } from '@/components/ui';
import Badge from '@/components/ui/Badge';
import { fadeInUp, staggerContainer, staggerItem } from '@/lib/animations';

// ==================== 公司介绍数据 ====================
const COMPANY_INFO = {
  name: '中萨数字科技集团',
  nameEn: 'China-Samoa Digital Technology Group',
  founded: '2024年',
  location: '萨摩亚 · 香港 · 新加坡',
  description: 'ZS Exchange（中萨数字科技交易所）是获得萨摩亚政府正式牌照（DSA-2024-0018）的数字资产交易平台，总部位于萨摩亚阿皮亚，在香港和新加坡设有运营中心。平台提供现货交易、衍生品交易、DeFi产品、NFT市场及机构级API服务。',
  mission: '让数字资产交易更安全、更透明、更普惠',
  vision: '成为亚太地区领先的合规数字资产基础设施服务商',
};

// ==================== 发展历程时间线 ====================
const TIMELINE = [
  { year: '2024 Q1', title: '公司成立', desc: '中萨数字科技集团在萨摩亚正式注册成立', icon: <Building2 size={20} /> },
  { year: '2024 Q2', title: '获取牌照', desc: '成功获得萨摩亚政府颁发的数字资产交易牌照', icon: <Award size={20} /> },
  { year: '2024 Q3', title: 'HK1683合作', desc: '与HK1683达成战略合作，拓展亚洲市场', icon: <Handshake size={20} /> },
  { year: '2024 Q4', title: '平台上线', desc: 'ZS Exchange V1.0正式上线运营，支持100+交易对', icon: <Globe size={20} /> },
  { year: '2025 Q1', title: '用户突破50万', desc: '全球注册用户突破50万，日活交易量超$2亿', icon: <Users size={20} /> },
  { year: '2025 Q2', title: '三地协同架构', desc: '完成萨摩亚-香港-新加坡三地数据中心部署', icon: <Target size={20} /> },
  { year: '2026 Q1', title: 'DeFi生态布局', desc: '上线质押、DEX、流动性挖矿等DeFi产品矩阵', icon: <Award size={20} /> },
];

// ==================== 团队成员数据 ====================
const TEAM_MEMBERS = [
  // CEO团队
  {
    name: '张明远',
    position: '首席执行官 CEO',
    department: 'executive',
    avatar: 'ZM',
    bio: '前华尔街量化基金合伙人，15年金融科技行业经验，MIT金融工程硕士',
  },
  {
    name: 'Sarah Chen',
    position: '首席技术官 CTO',
    department: 'executive',
    avatar: 'SC',
    bio: '前Google高级工程师，区块链技术专家，斯坦福计算机科学博士',
  },
  {
    name: '王建华',
    position: '首席法务官 CLO',
    department: 'executive',
    avatar: 'WJ',
    bio: '国际金融监管专家，曾任职于香港SFC，精通多国数字资产法规',
  },
  // 核心团队成员
  {
    name: '李思琪',
    position: '首席运营官 COO',
    department: 'core',
    avatar: 'LS',
    bio: '10年交易所运营经验，曾任某头部交易所亚太区运营总监',
  },
  {
    name: 'Michael Wong',
    position: '首席安全官 CSO',
    department: 'core',
    avatar: 'MW',
    bio: '前NSA网络安全顾问，Certik认证安全审计师',
  },
  {
    name: '陈雨晴',
    position: '首席产品官 CPO',
    department: 'core',
    avatar: 'CY',
    bio: '前币安产品设计负责人，用户体验专家',
  },
  {
    name: 'Alex Kim',
    position: '首席财务官 CFO',
    department: 'core',
    avatar: 'AK',
    bio: 'CPA持证人，前四大会计事务所高级经理',
  },
  {
    name: '刘婷婷',
    position: '首席市场官 CMO',
    department: 'core',
    avatar: 'LT',
    bio: '数字营销专家，成功操盘多个千万级用户增长项目',
  },
  {
    name: 'David Liu',
    position: '首席风控官 CRO',
    department: 'core',
    avatar: 'DL',
    bio: '前高盛风险管理VP，量化风控模型专家',
  },
];

// ==================== 企业资质证书 ====================
const CERTIFICATES = [
  { name: '萨摩亚数字资产交易牌照', issuer: 'Samoa FSA', number: 'DSA-2024-0018', icon: 'DASL' },
  { name: 'ISO 27001信息安全认证', issuer: 'BSI', number: 'ISO-2025-ISMS', icon: 'ISO' },
  { name: 'SOC 2 Type II认证', issuer: 'AICPA', number: 'SOC2-2025-ZS', icon: 'SOC2' },
  { name: 'PCI-DSS支付卡认证', issuer: 'PCI SSC', number: 'PCI-2025-QSA', icon: 'PCI' },
];

export default function AboutPage() {
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    alert('消息已发送，我们会尽快回复您');
    setFormData({ name: '', email: '', subject: '', message: '' });
    setIsSubmitting(false);
  };

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
          <div className="absolute inset-0 bg-gradient-to-b from-brand-primary/8 via-transparent to-transparent" />
          <div className="absolute top-20 right-1/4 w-80 h-80 bg-brand-500/12 rounded-full blur-[120px]" />
          
          <div className="max-w-[1400px] mx-auto px-4 lg:px-6 py-16 md:py-24 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center max-w-3xl mx-auto"
            >
              <Badge variant="samoa" size="md" className="mb-6">
                🇼🇸 萨摩亚持牌企业
              </Badge>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-text-primary tracking-tight mb-6">
                关于{' '}
                <span className="bg-gradient-to-r from-brand-primary to-gold bg-clip-text text-transparent">
                  ZS Exchange
                </span>
              </h1>
              <p className="text-lg md:text-xl text-text-secondary leading-relaxed">
                {COMPANY_INFO.description}
              </p>
              
              {/* 核心数据指标 */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-12">
                {[
                  { value: '180+', label: '服务国家' },
                  { value: '50万+', label: '全球用户' },
                  { value: '$50亿+', label: '累计交易额' },
                  { value: '99.9%', label: '系统稳定性' },
                ].map((stat, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 + 0.3 }}
                    className="text-center p-4 rounded-xl bg-deep-800/50 border border-deep-700/50"
                  >
                    <p className="text-2xl md:text-3xl font-bold text-brand-500">{stat.value}</p>
                    <p className="text-sm text-text-muted mt-1">{stat.label}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </motion.section>

        {/* ==================== 公司介绍 ==================== */}
        <section className="py-16 px-4">
          <div className="max-w-[1400px] mx-auto">
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center"
            >
              {/* 左侧：公司信息 */}
              <motion.div variants={staggerItem}>
                <Badge variant="info" size="md" className="mb-4">公司简介</Badge>
                <h2 className="text-3xl md:text-4xl font-bold text-text-primary mb-6">
                  {COMPANY_INFO.name}
                </h2>
                <p className="text-text-secondary leading-relaxed mb-6">
                  {COMPANY_INFO.nameEn}
                </p>
                <p className="text-text-secondary leading-relaxed mb-8">
                  {COMPANY_INFO.description}
                </p>
                
                <div className="space-y-4">
                  <div className="flex items-start gap-3 p-4 rounded-xl bg-deep-800/50 border border-deep-700/50">
                    <Target size={22} className="text-brand-500 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-text-primary mb-1">使命</h4>
                      <p className="text-sm text-text-secondary">{COMPANY_INFO.mission}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-4 rounded-xl bg-deep-800/50 border border-deep-700/50">
                    <Award size={22} className="text-gold shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-text-primary mb-1">愿景</h4>
                      <p className="text-sm text-text-secondary">{COMPANY_INFO.vision}</p>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* 右侧：三地协同架构图 */}
              <motion.div variants={staggerItem}>
                <Card variant="default" padding="lg" className="relative overflow-hidden">
                  <h3 className="text-xl font-bold text-text-primary mb-6 flex items-center gap-2">
                    <Globe size={22} className="text-brand-500" />
                    三地协同架构
                  </h3>
                  
                  <div className="relative h-[320px] flex items-center justify-center">
                    {/* 中心节点 */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 rounded-full bg-gradient-to-br bg-brand-500 text-[#1A1D24] flex items-center justify-center shadow-glow-purple z-10">
                      <span className="text-white font-bold text-xs text-center">ZS<br/>Global</span>
                    </div>
                    
                    {/* 萨摩亚节点 */}
                    <motion.div
                      initial={{ scale: 0 }}
                      whileInView={{ scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.2 }}
                      className="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-3 rounded-xl bg-samoa/10 border border-samoa/30 text-center"
                    >
                      <span className="text-samoa font-bold text-sm mt-1">萨摩亚总部</span>
                      <p className="text-[10px] text-text-muted">牌照主体</p>
                    </motion.div>
                    
                    {/* 香港节点 */}
                    <motion.div
                      initial={{ scale: 0 }}
                      whileInView={{ scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.35 }}
                      className="absolute bottom-8 left-8 px-4 py-3 rounded-xl bg-brand-500/10 border border-brand-500/30 text-center"
                    >
                      <span className="text-brand-light font-bold text-sm mt-1">香港运营中心</span>
                      <p className="text-[10px] text-text-muted">技术研发</p>
                    </motion.div>
                    
                    {/* 新加坡节点 */}
                    <motion.div
                      initial={{ scale: 0 }}
                      whileInView={{ scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.5 }}
                      className="absolute bottom-8 right-8 px-4 py-3 rounded-xl bg-success/10 border border-success/30 text-center"
                    >
                      <span className="text-success font-bold text-sm mt-1">新加坡节点</span>
                      <p className="text-[10px] text-text-muted">亚太客服</p>
                    </motion.div>

                    {/* 连接线装饰 */}
                    <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 1 }}>
                      <line x1="50%" y1="28%" x2="45%" y2="42%" stroke="#7C3AED" strokeWidth="1" strokeDasharray="4 4" opacity="0.4" />
                      <line x1="50%" y1="28%" x2="55%" y2="42%" stroke="#7C3AED" strokeWidth="1" strokeDasharray="4 4" opacity="0.4" />
                      <line x1="25%" y1="75%" x2="45%" y2="55%" stroke="#7C3AED" strokeWidth="1" strokeDasharray="4 4" opacity="0.4" />
                      <line x1="75%" y1="75%" x2="55%" y2="55%" stroke="#7C3AED" strokeWidth="1" strokeDasharray="4 4" opacity="0.4" />
                    </svg>
                  </div>
                  
                  <p className="text-xs text-text-muted text-center mt-4">
                    三地数据中心互为备份，确保99.9%+系统可用性
                  </p>
                </Card>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* ==================== 发展历程时间线 ==================== */}
        <section className="py-16 px-4 bg-deep-800/30">
          <div className="max-w-[1400px] mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl md:text-4xl font-bold text-text-primary mb-3">发展历程</h2>
              <p className="text-text-secondary">从创立到引领，我们一直在前进</p>
            </motion.div>

            <div className="relative">
              {/* 时间线中心线 */}
              <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-deep-700 -translate-x-1/2 hidden md:block" />

              <div className="space-y-8 md:space-y-0">
                {TIMELINE.map((item, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: index % 2 === 0 ? -30 : 30 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    className={`flex flex-col md:flex-row gap-6 ${
                      index % 2 === 0 ? 'md:flex-row-reverse' : ''
                    }`}
                  >
                    {/* 内容卡片 */}
                    <div className={`flex-1 ${index % 2 === 0 ? 'md:text-right' : ''}`}>
                      <Card variant="default" padding="md" className="inline-block max-w-md">
                        <div className={`flex items-center gap-3 ${index % 2 === 0 ? 'md:flex-row-reverse' : ''}`}>
                          <div className="w-11 h-11 rounded-xl bg-brand-500/15 flex items-center justify-center shrink-0 text-brand-500">
                            {item.icon}
                          </div>
                          <div className={index % 2 === 0 ? 'md:text-left' : ''}>
                            <Badge variant="license" size="sm">{item.year}</Badge>
                            <h4 className="font-semibold text-text-primary mt-1">{item.title}</h4>
                            <p className="text-sm text-text-secondary mt-1">{item.desc}</p>
                          </div>
                        </div>
                      </Card>
                    </div>

                    {/* 时间线圆点 (桌面端) */}
                    <div className="hidden md:flex w-10 shrink-0 items-center justify-center relative z-10">
                      <div className="w-4 h-4 rounded-full bg-brand-500 shadow-glow-purple" />
                    </div>

                    {/* 空白占位 */}
                    <div className="hidden md:block flex-1" />
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ==================== 团队介绍 ==================== */}
        <section className="py-16 px-4">
          <div className="max-w-[1400px] mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl md:text-4xl font-bold text-text-primary mb-3">核心团队</h2>
              <p className="text-text-secondary">管理层与核心部门负责人</p>
            </motion.div>

            {/* 高管团队 */}
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12"
            >
              {TEAM_MEMBERS.filter(m => m.department === 'executive').map((member, index) => (
                <motion.div key={member.name} variants={staggerItem}>
                  <Card variant="default" padding="lg" className="text-center group hover:border-brand-500/30 transition-all duration-300">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-brand-primary/30 to-info/15 flex items-center justify-center text-4xl mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                      {member.avatar}
                    </div>
                    <h3 className="font-bold text-text-primary text-lg">{member.name}</h3>
                    <p className="text-brand-light text-sm font-medium mt-1">{member.position}</p>
                    <p className="text-text-muted text-xs mt-3 leading-relaxed">{member.bio}</p>
                  </Card>
                </motion.div>
              ))}
            </motion.div>

            {/* 核心团队 */}
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {TEAM_MEMBERS.filter(m => m.department === 'core').map((member, index) => (
                <motion.div key={member.name} variants={staggerItem}>
                  <Card variant="default" padding="md" className="group hover:border-deep-600 transition-all duration-300">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-full bg-deep-700 flex items-center justify-center text-2xl shrink-0 group-hover:bg-brand-500/10 transition-colors">
                        {member.avatar}
                      </div>
                      <div>
                        <h3 className="font-semibold text-text-primary">{member.name}</h3>
                        <p className="text-brand-light text-xs font-medium">{member.position}</p>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ==================== 企业资质证书展示区 ==================== */}
        <section className="py-16 px-4 bg-deep-800/30">
          <div className="max-w-[1400px] mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl md:text-4xl font-bold text-text-primary mb-3 flex items-center justify-center gap-3">
                <Award size={32} className="text-gold" />
                企业资质
              </h2>
              <p className="text-text-secondary">权威认证 · 合规经营</p>
            </motion.div>

            <motion.div
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
            >
              {CERTIFICATES.map((cert, index) => (
                <motion.div key={cert.name} variants={staggerItem}>
                  <Card variant="default" padding="lg" className="text-center hover:-translate-y-1 transition-transform duration-300">
                    <div className="text-5xl mb-4">{cert.icon}</div>
                    <h3 className="font-semibold text-text-primary text-sm mb-2">{cert.name}</h3>
                    <p className="text-xs text-text-muted">颁发机构: {cert.issuer}</p>
                    <p className="text-xs text-text-muted font-mono mt-1">编号: {cert.number}</p>
                    <CheckCircle2 size={16} className="text-success mx-auto mt-3" />
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ==================== 联系我们表单 ==================== */}
        <section className="py-16 px-4">
          <div className="max-w-[1000px] mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="rounded-2xl border border-deep-700 bg-gradient-to-br from-deep-800 to-deep-800/50 p-8 md:p-12 relative overflow-hidden"
            >
              {/* 装饰 */}
              <div className="absolute -top-20 -right-20 w-60 h-60 bg-brand-500/8 rounded-full blur-[80px]" />
              <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-info/8 rounded-full blur-[60px]" />

              <div className="relative z-10">
                <div className="text-center mb-10">
                  <h2 className="text-3xl font-bold text-text-primary mb-3">联系我们</h2>
                  <p className="text-text-secondary">如有疑问或合作需求，请通过以下表单联系我们</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-2">
                        姓名 *
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="请输入您的姓名"
                        required
                        className="w-full px-4 py-3 rounded-xl bg-deep-900 border border-deep-700 text-text-primary placeholder:text-text-muted focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500/50 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-2">
                        邮箱 *
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="请输入您的邮箱"
                        required
                        className="w-full px-4 py-3 rounded-xl bg-deep-900 border border-deep-700 text-text-primary placeholder:text-text-muted focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500/50 transition-all"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      主题
                    </label>
                    <input
                      type="text"
                      value={formData.subject}
                      onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                      placeholder="请简述您的咨询主题"
                      className="w-full px-4 py-3 rounded-xl bg-deep-900 border border-deep-700 text-text-primary placeholder:text-text-muted focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500/50 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      留言内容 *
                    </label>
                    <textarea
                      value={formData.message}
                      onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                      placeholder="请详细描述您的问题或需求..."
                      required
                      rows={5}
                      className="w-full px-4 py-3 rounded-xl bg-deep-900 border border-deep-700 text-text-primary placeholder:text-text-muted focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500/50 transition-all resize-none"
                    />
                  </div>
                  <div className="text-center">
                    <Button
                      type="submit"
                      isLoading={isSubmitting}
                      size="lg"
                      rightIcon={<Send size={18} />}
                      className="!rounded-xl !px-10"
                    >
                      发送消息
                    </Button>
                  </div>
                </form>

                {/* 联系方式 */}
                <div className="mt-10 pt-8 border-t border-deep-700/50 flex flex-wrap justify-center gap-8">
                  <div className="flex items-center gap-2 text-text-secondary text-sm">
                    <Mail size={16} className="text-brand-500" />
                    support@zsexchange.com
                  </div>
                  <div className="flex items-center gap-2 text-text-secondary text-sm">
                    <Phone size={16} className="text-brand-500" />
                    +852 XXXX XXXX
                  </div>
                  <div className="flex items-center gap-2 text-text-secondary text-sm">
                    <MapPin size={16} className="text-brand-500" />
                    萨摩亚 / 香港 / 新加坡
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
