'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  Bot,
  User,
  Building2,
  Wallet,
  Calculator,
  Home,
  Wrench,
  Globe,
  ArrowRight,
  CheckCircle2,
  Rocket,
  Users,
  MapPin,
  TrendingUp,
  BrainCircuit,
  CircleUserRound,
  Factory,
} from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Card } from '@/components/ui';
import { Badge } from '@/components/ui';
import { Button } from '@/components/ui';
import { fadeInUp, staggerContainer, staggerItem, hoverLift, cardGlow } from '@/lib/animations';

/* ==================== AIOPC 四大核心理念 ==================== */
const AIOPC_CONCEPTS = [
  {
    letter: 'A.I.',
    full: 'Artificial Intelligence',
    cn: '人工智能驱动',
    icon: <BrainCircuit size={28} />,
    desc: 'AI自动化处理日常运营事务：财务记账、客户管理、文档生成、数据分析，让一人团队拥有十人效率',
    color: '#7C3AED',
    bg: 'from-purple-500/20 to-purple-600/10',
  },
  {
    letter: 'One-Person',
    full: 'Solo Entrepreneurship',
    cn: '一人即可运营',
    icon: <CircleUserRound size={28} />,
    desc: '专为独立创业者、自由职业者、数字游民设计，最小化运营成本，最大化个人产出',
    color: '#3B82F6',
    bg: 'from-blue-500/20 to-blue-600/10',
  },
  {
    letter: 'Company',
    full: 'Complete Legal Entity',
    cn: '完整公司主体',
    icon: <Building2 size={28} />,
    desc: '提供完整的萨摩亚法律实体身份，包括IBC注册、银行账户、税务合规等全套企业基础设施',
    color: '#10B981',
    bg: 'from-emerald-500/20 to-emerald-600/10',
  },
  {
    letter: 'Park',
    full: 'Industrial Ecosystem',
    cn: '产业园区服务',
    icon: <Factory size={28} />,
    desc: '入驻即享园区生态红利：资源共享、人脉网络、联合办公、融资通道、出海支持',
    color: '#D4AF37',
    bg: 'from-yellow-500/20 to-amber-600/10',
  },
];

/* ==================== 六大核心服务 ==================== */
const EMPOWERMENT_SERVICES = [
  {
    icon: <Building2 size={26} />,
    title: '公司注册',
    desc: '萨摩亚IBC/LLC实体注册，完整法律主体身份',
    tag: '🇼🇸 萨摩亚实体',
    color: '#7C3AED',
  },
  {
    icon: <Wallet size={26} />,
    title: '银行开户',
    desc: '多币种企业账户，支持USD/EUR/CNY等主流货币',
    tag: '多币种账户',
    color: '#10B981',
  },
  {
    icon: <Calculator size={26} />,
    title: '财务代理',
    desc: '智能记账、自动报税、财务报表一键生成',
    tag: '自动化财务',
    color: '#3B82F6',
  },
  {
    icon: <Home size={26} />,
    title: '注册地址',
    desc: '萨摩亚真实办公地址，可用于信函接收与商务注册',
    tag: '真实地址',
    color: '#F59E0B',
  },
  {
    icon: <Wrench size={26} />,
    title: 'AI工具套件',
    desc: 'AI文案生成、智能客服、数据分析、项目管理等自动化工具',
    tag: 'AI工具套件',
    color: '#EC4899',
  },
  {
    icon: <Globe size={26} />,
    title: '国际化支持',
    desc: '多语言网站、跨境支付、国际物流、多法域合规',
    tag: '国际化支持',
    color: '#06B6D4',
  },
];

/* ==================== 加入流程 (3步) ==================== */
const JOIN_PROCESS = [
  {
    step: 1,
    icon: <Rocket size={28} />,
    title: '提交申请',
    desc: '填写入驻申请表，说明业务方向与需求',
  },
  {
    step: 2,
    icon: <Users size={28} />,
    title: '审核评估',
    desc: 'AIOPC团队评估匹配度，制定个性化入驻方案',
  },
  {
    step: 3,
    icon: <CheckCircle2 size={28} />,
    title: '正式入驻',
    desc: '完成签约付款，正式开启运营',
  },
];

/* ==================== 入驻企业统计数据 ==================== */
const PARK_STATS = [
  { value: '1,200+', label: '入驻企业', icon: <Building2 size={20} /> },
  { value: '15', label: '覆盖国家', icon: <Globe size={20} /> },
  { value: '95%', label: '孵化成功率', icon: <TrendingUp size={20} /> },
  { value: '50+', label: '行业领域', icon: <Wrench size={20} /> },
];

export default function AIOPCPage() {
  return (
    <main className="min-h-screen bg-deep-900">
      <Navbar />

      {/* ==================== Hero 区域 ==================== */}
      <section className="relative overflow-hidden py-20 sm:py-28 px-4">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/3 w-[700px] h-[450px] bg-brand-500/8 rounded-full blur-[150px]" />
          <div className="absolute bottom-0 right-1/3 w-[550px] h-[350px] bg-info/6 rounded-full blur-[130px]" />
          {/* 网格背景效果 */}
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: 'linear-gradient(rgba(124,58,237,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(124,58,237,0.3) 1px, transparent 1px)',
              backgroundSize: '60px 60px',
            }}
          />
        </div>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="relative max-w-5xl mx-auto text-center"
        >
          {/* 标签 */}
          <motion.div variants={fadeInUp}>
            <Badge variant="info" size="md" className="mb-6">AI × One-Person × Company</Badge>
          </motion.div>

          {/* 主标题 */}
          <motion.h1
            variants={fadeInUp}
            className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight"
          >
            AIOPC{' '}
            <span className="bg-gradient-to-r from-brand-primary via-info to-cyan-400 bg-clip-text text-transparent">
              一人公司产业园
            </span>
          </motion.h1>

          <motion.p
            variants={fadeInUp}
            className="text-xl text-text-secondary mb-3 font-medium"
          >
            全球最大的一人公司孵化基地
          </motion.p>

          <motion.p
            variants={fadeInUp}
            className="text-base text-text-muted max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            由中萨数字科技集团运营，依托萨摩亚政策优势和AI技术能力，
            为全球独立创业者打造<span className="text-brand-light font-medium">「一个人就是一家公司」</span>的全新商业模式
          </motion.p>

          {/* CTA按钮组 */}
          <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/contact" className="no-underline">
              <Button size="lg" className="!rounded-xl !px-8 bg-gradient-to-r from-brand-primary to-cyan-500 hover:!shadow-sm">
                申请加入 AIOPC
                <ArrowRight size={18} className="ml-2" />
              </Button>
            </Link>
            <Link href="#services" className="no-underline">
              <Button variant="outline" size="lg" className="!rounded-xl !px-8 border-deep-500 text-text-secondary hover:!border-brand-500 hover:!text-brand-light">
                了解核心服务
              </Button>
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* ==================== 什么是 AIOPC (四字母理念) ==================== */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-14">
            <motion.h2 variants={fadeInUp} className="text-3xl sm:text-4xl font-bold text-text-primary mb-4">
              什么是 AIOPC？
            </motion.h2>
            <motion.p variants={fadeInUp} className="text-text-secondary max-w-2xl mx-auto">
              四个字母代表四种核心能力，重新定义「一人公司」的可能性
            </motion.p>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {AIOPC_CONCEPTS.map((concept) => (
              <motion.div key={concept.letter} variants={staggerItem} className="group cursor-pointer">
                <Card variant="default" padding="lg" className="h-full text-center">
                  {/* 字母标识 */}
                  <div
                    className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br ${concept.bg} mb-4`}
                    style={{ color: concept.color }}
                  >
                    {concept.icon}
                  </div>
                  {/* 字母 + 英文全称 */}
                  <h3 className="text-2xl font-bold mb-1" style={{ color: concept.color }}>{concept.letter}</h3>
                  <p className="text-xs text-text-muted uppercase tracking-wider mb-3">{concept.full}</p>
                  {/* 中文含义 */}
                  <p className="text-base font-semibold text-text-primary mb-3">{concept.cn}</p>
                  {/* 详细描述 */}
                  <p className="text-sm text-text-secondary leading-relaxed">{concept.desc}</p>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ==================== 六项核心服务 ==================== */}
      <section id="services" className="relative py-20 px-4">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-brand-500/5 rounded-full blur-[150px]" />
        </div>

        <div className="relative max-w-6xl mx-auto">
          <motion.div variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-14">
            <motion.h2 variants={fadeInUp} className="text-3xl sm:text-4xl font-bold text-text-primary mb-4">
              六项核心服务
            </motion.h2>
            <motion.p variants={fadeInUp} className="text-text-secondary max-w-2xl mx-auto">
              从注册到运营，完整支撑您的单人企业
            </motion.p>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {EMPOWERMENT_SERVICES.map((service) => (
              <motion.div key={service.title} variants={staggerItem} className="group cursor-pointer">
                <Card variant="default" padding="lg" className="h-full">
                  <div className="flex items-start gap-4">
                    {/* 图标 */}
                    <div
                      className="shrink-0 w-14 h-14 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: `${service.color}15`, color: service.color }}
                    >
                      {service.icon}
                    </div>
                    {/* 内容 */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold text-text-primary">{service.title}</h3>
                      </div>
                      <p className="text-sm text-text-secondary leading-relaxed mb-3">{service.desc}</p>
                      <Badge variant="default" size="sm">{service.tag}</Badge>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ==================== 加入流程 (3步) ==================== */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <motion.div variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-14">
            <motion.h2 variants={fadeInUp} className="text-3xl sm:text-4xl font-bold text-text-primary mb-4">
              如何加入 AIOPC？
            </motion.h2>
            <motion.p variants={fadeInUp} className="text-text-secondary max-w-2xl mx-auto">
              简单三步，完成入驻流程
            </motion.p>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
          >
            {JOIN_PROCESS.map((item) => (
              <motion.div key={item.step} variants={staggerItem} className="relative text-center">
                {/* 连接线 (中间两步之间) */}
                {item.step < 3 && (
                  <div className="hidden md:block absolute top-8 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-brand-primary/30 to-transparent" />
                )}

                {/* 步骤圆圈 */}
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br bg-brand-500 text-[#1A1D24] text-white text-2xl font-bold shadow-lg shadow-brand-500/25 mb-5 relative z-10">
                  {item.step}
                </div>

                {/* 图标 */}
                <div className="text-brand-light mb-3">{item.icon}</div>

                {/* 内容 */}
                <h3 className="text-lg font-semibold text-text-primary mb-2">{item.title}</h3>
                <p className="text-sm text-text-muted">{item.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ==================== 入驻企业数据统计 ==================== */}
      <section className="py-16 px-4">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="max-w-5xl mx-auto"
        >
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {PARK_STATS.map((stat) => (
              <motion.div key={stat.label} variants={staggerItem} className="text-center">
                <Card variant="default" padding="lg" hoverable={false}>
                  <div className="text-brand-500 mb-2 flex justify-center">{stat.icon}</div>
                  <p className="text-3xl sm:text-4xl font-bold text-white mb-1">{stat.value}</p>
                  <p className="text-xs text-text-muted uppercase tracking-wider">{stat.label}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ==================== 底部CTA ==================== */}
      <section className="py-20 px-4">
        <motion.div
          variants={cardGlow as any}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
          className="max-w-4xl mx-auto rounded-2xl p-8 sm:p-12 text-center relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.2) 0%, rgba(6, 182, 212, 0.1) 50%, rgba(11, 15, 25, 0.95) 100%)',
            border: '1px solid rgba(124, 58, 237, 0.25)',
          }}
        >
          {/* 装饰元素 */}
          <div className="absolute top-0 left-0 w-72 h-72 bg-brand-500/10 rounded-full blur-[100px]" />
          <div className="absolute bottom-0 right-0 w-56 h-56 bg-info/8 rounded-full blur-[80px]" />

          <div className="relative z-10">
            <Bot size={40} className="mx-auto text-brand-500 mb-4" />
            <Badge variant="info" size="md" className="mb-4">立即申请</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              申请加入 AIOPC
            </h2>
            <p className="text-text-secondary max-w-xl mx-auto mb-8">
              成为全球1200+家入驻企业的一员，享受完整的创业支持服务。
              我们的首席运营官将在48小时内与您联系。
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="lg" className="!rounded-xl !px-10 bg-gradient-to-r from-brand-primary to-cyan-500 hover:!shadow-sm">
                申请加入 AIOPC
                <ArrowRight size={18} className="ml-2" />
              </Button>
              <Button variant="ghost" size="lg" className="!rounded-xl !px-8 text-text-muted hover:!text-text-primary">
                下载入驻指南 PDF
              </Button>
            </div>
          </div>
        </motion.div>
      </section>

      <Footer />
    </main>
  );
}
