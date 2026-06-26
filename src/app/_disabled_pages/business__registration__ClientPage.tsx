'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  Globe,
  ShieldCheck,
  Clock,
  Lock,
  Building2,
  Users,
  FileText,
  Award,
  CheckCircle2,
  HelpCircle,
  ChevronDown,
  ArrowRight,
  MapPin,
  CalendarDays,
  TrendingUp,
} from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Card } from '@/components/ui';
import { Badge } from '@/components/ui';
import { Button } from '@/components/ui';
import { Accordion, AccordionItem } from '@/components/ui';
import { fadeInUp, staggerContainer, staggerItem, hoverLift, cardGlow } from '@/lib/animations';

/* ==================== 萨摩亚四大优势 ==================== */
const SAMOA_ADVANTAGES = [
  {
    icon: <DollarSignIcon />,
    title: '0%税收政策',
    desc: '萨摩亚对国际商业公司(IBC)实行零税收政策，无需缴纳所得税、资本利得税、增值税等',
    color: '#10B981',
    bg: 'from-emerald-500/20 to-emerald-600/10',
  },
  {
    icon: <Lock size={26} />,
    title: '隐私保护严格',
    desc: '股东董事信息不公开披露，严格保护企业及个人隐私，符合国际保密标准',
    color: '#3B82F6',
    bg: 'from-blue-500/20 to-blue-600/10',
  },
  {
    icon: <Clock size={26} />,
    title: '注册便捷高效',
    desc: '全程线上办理，最快1-3个工作日完成注册，电子证书即时下发',
    color: '#F59E0B',
    bg: 'from-amber-500/20 to-amber-600/10',
  },
  {
    icon: <ShieldCheck size={26} />,
    title: '与中国无引渡条约',
    desc: '萨摩亚与中国大陆无双边引渡条约，为企业提供额外的法律保护层',
    color: '#7C3AED',
    bg: 'from-purple-500/20 to-purple-600/10',
  },
];

/* ==================== 注册流程步骤 ==================== */
const REGISTRATION_STEPS = [
  {
    step: 1,
    icon: <Building2 size={24} />,
    title: '选择公司类型',
    desc: 'IBC国际商业公司 / LLC有限责任公司 / Foundation基金会 / Trust信托',
  },
  {
    step: 2,
    icon: <Users size={24} />,
    title: '提供股东董事信息',
    desc: '身份证明文件、地址证明、持股比例等基本资料',
  },
  {
    step: 3,
    icon: <FileText size={24} />,
    title: '名称预审',
    desc: '提交拟用公司名称进行可用性查询和预审',
  },
  {
    step: 4,
    icon: <Award size={24} />,
    title: '提交申请材料',
    desc: '签署注册文件、缴纳注册费用，正式提交申请',
  },
  {
    step: 5,
    icon: <CheckCircle2 size={24} />,
    title: '领取证书',
    desc: '获得电子营业执照 + 实体证书套装（寄送至指定地址）',
  },
];

/* ==================== 套餐价格 (3档) ==================== */
const PRICING_PACKAGES = [
  {
    id: 'basic',
    name: '基础注册包',
    price: '$800',
    period: '/年',
    badge: '性价比之选',
    features: [
      '萨摩亚IBC公司注册',
      '电子营业执照',
      '公司章程模板',
      '首年注册地址',
      '基本秘书服务',
    ],
    highlight: false,
  },
  {
    id: 'standard',
    name: '标准服务包',
    price: '$2,000',
    period: '/年',
    badge: '最受欢迎',
    features: [
      '含基础注册包全部',
      '实体证书套装（寄送）',
      '银行开户协助',
      '印章制作（公章+私章）',
      '年度合规申报',
      '专属客服对接',
    ],
    highlight: true,
  },
  {
    id: 'vip',
    name: 'VIP全套服务',
    price: '$5,000',
    period: '/年',
    badge: '⭐ 尊享体验',
    features: [
      '含标准包全部',
      '多币种银行账户开通',
      '财务代理记账报税',
      '虚拟办公室服务',
      '域名+企业邮箱',
      '法务咨询支持',
      '年度审计报告',
      '加急办理通道',
    ],
    highlight: false,
  },
];

/* ==================== FAQ 数据 ==================== */
const FAQ_ITEMS = [
  {
    question: '萨摩亚公司注册需要本人到场吗？',
    answer: '不需要。整个注册过程可在线完成，我们提供远程视频见证服务。所有文件可通过加密邮件传输，实体证书将通过国际快递寄送到您指定的地址。通常从提交材料到拿到电子证书仅需1-3个工作日。',
  },
  {
    question: '萨摩亚公司的税务义务是什么？',
    answer: '萨摩亚国际商业公司(IBC)享有零税收政策——免征所得税、资本利得税、增值税、印花税等。但请注意：如果公司在其他国家产生实际经营活动，可能需要在当地履行纳税义务。建议咨询专业税务顾问以了解具体情况。',
  },
  {
    question: '注册完成后可以开设银行账户吗？',
    answer: '可以。我们可以协助您在萨摩亚本地银行或国际银行开设多币种企业账户。标准套餐及以上包含银行开户协助服务。开户所需材料包括公司注册文件、董事身份证明、业务计划书等。审核周期一般为2-4周。',
  },
  {
    question: '萨摩亚公司是否被国际认可？',
    answer: '是的。萨摩亚是英联邦成员国，其公司法遵循英国普通法体系，在国际上具有完整的法律效力。萨摩亚注册的公司可在全球范围内开展合法的商业活动，包括开设银行账户、持有资产、签订合同等。许多知名跨国企业和投资基金都选择在萨摩亚设立实体。',
  },
];

/* ==================== 统计数据 ==================== */
const STATS = [
  { value: '500+', label: '已服务企业', icon: <Building2 size={20} /> },
  { value: '30+', label: '覆盖国家', icon: <Globe size={20} /> },
  { value: '2天', label: '平均审批时间', icon: <CalendarDays size={20} /> },
  { value: '99%', label: '客户满意度', icon: <TrendingUp size={20} /> },
];

export default function RegistrationPage() {
  // FAQ展开状态
  const [openFaqId, setOpenFaqId] = useState<string | null>(null);

  return (
    <main className="min-h-screen bg-deep-900">
      <Navbar />

      {/* ==================== Hero 区域 ==================== */}
      <section className="relative overflow-hidden py-20 sm:py-28 px-4">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-[700px] h-[450px] bg-samoa/10 rounded-full blur-[150px]" />
          <div className="absolute bottom-0 left-0 w-[500px] h-[350px] bg-brand-500/8 rounded-full blur-[120px]" />
        </div>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="relative max-w-5xl mx-auto text-center"
        >
          <motion.div variants={fadeInUp}>
            <Badge variant="samoa" size="md" className="mb-6">🇼🇸 境外公司注册</Badge>
          </motion.div>

          <motion.h1
            variants={fadeInUp}
            className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight"
          >
            萨摩亚 ·{' '}
            <span className="bg-gradient-to-r from-samoa to-emerald-400 bg-clip-text text-transparent">
              全球商业枢纽
            </span>
          </motion.h1>

          <motion.p
            variants={fadeInUp}
            className="text-lg sm:text-xl text-text-secondary max-w-3xl mx-auto mb-10 leading-relaxed"
          >
            依托萨摩亚优惠的营商环境和政策优势，为全球企业提供
            <span className="text-samoa font-medium"> 快速、安全、合规</span>
            的境外公司注册服务
          </motion.p>

          <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/contact" className="no-underline">
              <Button size="lg" className="!rounded-xl !px-8 bg-gradient-to-r from-samoa to-emerald-500 hover:!shadow-lg hover:shadow-samoa/30">
                开始注册
                <ArrowRight size={18} className="ml-2" />
              </Button>
            </Link>
            <Link href="#pricing" className="no-underline">
              <Button variant="outline" size="lg" className="!rounded-xl !px-8 border-deep-500 text-text-secondary hover:!border-samoa hover:!text-samoa">
                查看套餐价格
              </Button>
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* ==================== 为什么选择萨摩亚 (4大优势) ==================== */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-14">
            <motion.h2 variants={fadeInUp} className="text-3xl sm:text-4xl font-bold text-text-primary mb-4">
              为什么选择萨摩亚？
            </motion.h2>
            <motion.p variants={fadeInUp} className="text-text-secondary max-w-2xl mx-auto">
              四大核心优势，让萨摩亚成为全球企业的理想注册地
            </motion.p>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {SAMOA_ADVANTAGES.map((adv) => (
              <motion.div key={adv.title} variants={staggerItem} className="group cursor-pointer">
                <Card variant="default" padding="lg" className="h-full text-center">
                  <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br ${adv.bg} mb-4`} style={{ color: adv.color }}>
                    {adv.icon}
                  </div>
                  <h3 className="text-lg font-semibold text-text-primary mb-3">{adv.title}</h3>
                  <p className="text-sm text-text-secondary leading-relaxed">{adv.desc}</p>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ==================== 注册流程 (步骤式) ==================== */}
      <section className="relative py-20 px-4">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-samoa/5 rounded-full blur-[130px]" />
        </div>

        <div className="relative max-w-4xl mx-auto">
          <motion.div variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-14">
            <motion.h2 variants={fadeInUp} className="text-3xl sm:text-4xl font-bold text-text-primary mb-4">
              注册流程
            </motion.h2>
            <motion.p variants={fadeInUp} className="text-text-secondary max-w-2xl mx-auto">
              5步完成公司注册，简单高效
            </motion.p>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="space-y-6"
          >
            {REGISTRATION_STEPS.map((item, index) => (
              <motion.div key={item.step} variants={staggerItem} className="relative">
                {/* 连接线 */}
                {index < REGISTRATION_STEPS.length - 1 && (
                  <div className="absolute left-6 top-14 w-0.5 h-[calc(100%-8px)] bg-deep-700" />
                )}
                <div className="flex gap-5">
                  {/* 步骤圆圈 */}
                  <div className="shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-samoa to-emerald-500 flex items-center justify-center text-white font-bold shadow-lg shadow-samoa/20">
                    {item.step}
                  </div>
                  {/* 内容 */}
                  <Card variant="default" padding="md" hoverable={false} className="flex-1">
                    <div className="flex items-start gap-3">
                      <div className="text-samoa mt-0.5">{item.icon}</div>
                      <div>
                        <h3 className="font-semibold text-text-primary">{item.title}</h3>
                        <p className="text-sm text-text-muted mt-1">{item.desc}</p>
                      </div>
                    </div>
                  </Card>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ==================== 套餐价格 (3档) ==================== */}
      <section id="pricing" className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-14">
            <motion.h2 variants={fadeInUp} className="text-3xl sm:text-4xl font-bold text-text-primary mb-4">
              服务套餐
            </motion.h2>
            <motion.p variants={fadeInUp} className="text-text-secondary max-w-2xl mx-auto">
              透明定价，无隐藏费用
            </motion.p>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8"
          >
            {PRICING_PACKAGES.map((pkg) => (
              <motion.div key={pkg.id} variants={staggerItem} className="group cursor-pointer">
                <Card
                  variant={pkg.highlight ? 'gradient-border' : 'default'}
                  padding="lg"
                  className={`h-full relative ${pkg.highlight ? '!border-l-samoa !border-l-4' : ''}`}
                >
                  {pkg.highlight && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge variant="samoa" size="sm">{pkg.badge}</Badge>
                    </div>
                  )}

                  <div className={`rounded-xl p-4 mb-6 bg-gradient-to-br ${
                    pkg.id === 'vip'
                      ? 'from-license/20 to-amber-500/10'
                      : pkg.id === 'standard'
                      ? 'from-samoa/20 to-emerald-500/10'
                      : 'from-deep-700/80 to-deep-600/50'
                  }`}>
                    <h3 className={`text-xl font-bold ${
                      pkg.id === 'vip' ? 'text-license' :
                      pkg.id === 'standard' ? 'text-samoa' : 'text-text-primary'
                    }`}>{pkg.name}</h3>
                    <div className="flex items-baseline gap-1 mt-2">
                      <span className={`text-3xl font-bold ${
                        pkg.id === 'vip' ? 'text-license' :
                        pkg.id === 'standard' ? 'text-samoa' : 'text-white'
                      }`}>{pkg.price}</span>
                      <span className="text-text-muted text-sm">{pkg.period}</span>
                    </div>
                    {pkg.id !== 'standard' && (
                      <Badge variant="default" size="sm" className="mt-2">{pkg.badge}</Badge>
                    )}
                  </div>

                  <ul className="space-y-3 mb-6">
                    {pkg.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm text-text-secondary">
                        <CheckCircle2 size={16} className="text-success shrink-0 mt-0.5" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    variant={pkg.highlight ? 'primary' : 'outline'}
                    className={`w-full !rounded-lg ${
                      pkg.highlight
                        ? 'bg-gradient-to-r from-samoa to-emerald-500 hover:!shadow-lg hover:shadow-samoa/30'
                        : 'border-deep-600 text-text-secondary hover:!border-samoa hover:!text-samoa'
                    }`}
                  >
                    选择此套餐
                    <ArrowRight size={16} className="ml-1.5" />
                  </Button>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ==================== 统计数据栏 ==================== */}
      <section className="py-16 px-4">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="max-w-5xl mx-auto"
        >
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {STATS.map((stat) => (
              <motion.div key={stat.label} variants={staggerItem} className="text-center">
                <Card variant="default" padding="lg" hoverable={false}>
                  <div className="text-samoa mb-2 flex justify-center">{stat.icon}</div>
                  <p className="text-3xl font-bold text-white mb-1">{stat.value}</p>
                  <p className="text-xs text-text-muted uppercase tracking-wider">{stat.label}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ==================== FAQ 常见问题 ==================== */}
      <section className="py-20 px-4">
        <div className="max-w-3xl mx-auto">
          <motion.div variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-14">
            <motion.div variants={fadeInUp} className="inline-flex items-center gap-2 mb-4">
              <HelpCircle size={22} className="text-brand-light" />
              <h2 className="text-3xl sm:text-4xl font-bold text-text-primary">常见问题</h2>
            </motion.div>
            <motion.p variants={fadeInUp} className="text-text-secondary">
              关于萨摩亚公司注册的常见疑问解答
            </motion.p>
          </motion.div>

          <motion.div variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true }} className="space-y-3">
            {FAQ_ITEMS.map((faq, index) => (
              <motion.div key={index} variants={staggerItem}>
                <Card variant="default" padding="sm" hoverable={false} className="overflow-hidden">
                  <button
                    onClick={() => setOpenFaqId(openFaqId === `faq-${index}` ? null : `faq-${index}`)}
                    className="w-full flex items-center justify-between p-5 text-left cursor-pointer hover:bg-deep-700/30 transition-colors"
                  >
                    <span className="text-sm font-medium text-text-primary pr-4">{faq.question}</span>
                    <ChevronDown
                      size={18}
                      className={`shrink-0 text-text-muted transition-transform duration-300 ${openFaqId === `faq-${index}` ? 'rotate-180' : ''}`}
                    />
                  </button>
                  {openFaqId === `faq-${index}` && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 pb-5 pt-0">
                        <p className="text-sm text-text-secondary leading-relaxed border-t border-deep-700/50 pt-4">{faq.answer}</p>
                      </div>
                    </motion.div>
                  )}
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
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
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(11, 15, 25, 0.95) 100%)',
            border: '1px solid rgba(16, 185, 129, 0.25)',
          }}
        >
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-samoa/10 rounded-full blur-[100px]" />
          <div className="relative z-10">
            <MapPin size={32} className="mx-auto text-samoa mb-4" />
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              开启您的全球化业务布局
            </h2>
            <p className="text-text-secondary max-w-xl mx-auto mb-8">
              立即联系我们，获取免费的公司注册咨询服务和专业报价方案
            </p>
            <Button size="lg" className="!rounded-xl !px-10 bg-gradient-to-r from-samoa to-emerald-500 hover:!shadow-lg hover:shadow-samoa/30">
              免费咨询
              <ArrowRight size={18} className="ml-2" />
            </Button>
          </div>
        </motion.div>
      </section>

      <Footer />
    </main>
  );
}

/* 补充图标组件 */
function DollarSignIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={26} height={26} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
  );
}
