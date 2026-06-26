'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  FileCode2,
  Palette,
  Rocket,
  TrendingUp,
  Headphones,
  ShieldCheck,
  Zap,
  DollarSign,
  ArrowRight,
  CheckCircle2,
  Star,
  Clock,
} from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Card } from '@/components/ui';
import { Badge } from '@/components/ui';
import { Button } from '@/components/ui';
import { fadeInUp, staggerContainer, staggerItem, hoverLift, cardGlow } from '@/lib/animations';

/* ==================== 服务流程 (5步) ==================== */
const SERVICE_STEPS = [
  { id: 1, icon: <Headphones size={28} />, title: '咨询评估', desc: '专业团队一对一沟通，评估项目可行性、市场定位与技术架构' },
  { id: 2, icon: <Palette size={28} />, title: '方案设计', desc: '定制化经济模型设计、Token分配机制、治理框架与路线图规划' },
  { id: 3, icon: <FileCode2 size={28} />, title: '合约部署', desc: '安全审计级智能合约开发，多链部署（ERC20/BEP20/Solana）' },
  { id: 4, icon: <Rocket size={28} />, title: '上线交易', desc: 'ZS Exchange首发上线 + HK1683通道对接，全球流动性支持' },
  { id: 5, icon: <TrendingUp size={28} />, title: '持续运营', desc: '做市策略、社区运营、IR投资者关系管理全周期服务' },
];

/* ==================== 服务套餐 (3档) ==================== */
const PACKAGES = [
  {
    id: 'basic',
    name: '基础版',
    price: '$5,000起',
    badge: '入门首选',
    features: [
      'ERC20标准代币合约开发',
      '基础白皮书/项目文档',
      '主网部署与验证',
      '基础技术支持 (30天)',
      'ZS Exchange 上线通道',
    ],
    highlight: false,
    color: '#6B7280',
    gradientFrom: 'from-gray-500/20',
    gradientTo: 'to-gray-600/10',
  },
  {
    id: 'pro',
    name: '专业版',
    price: '$15,000起',
    badge: '热门推荐',
    features: [
      '含基础版全部内容',
      'Token经济模型深度设计',
      '多链同步部署 (ERC20+BEP20)',
      '第三方安全审计对接',
      'ZS + HK1683 双通道上市',
      '基础做市策略支持',
    ],
    highlight: true,
    color: '#7C3AED',
    gradientFrom: 'from-brand-primary/20',
    gradientTo: 'to-info/10',
  },
  {
    id: 'premium',
    name: '尊享版',
    price: '$50,000起',
    badge: '⭐ 全程VIP',
    features: [
      '含专业版全部内容',
      'STO证券型代币发行',
      '上市辅导与路演支持',
      '专业做市商对接',
      'IR投资者关系管理',
      '法律合规文件全套',
      '专属客户经理1对1',
      '全球媒体宣发资源',
    ],
    highlight: false,
    color: '#D4AF37',
    gradientFrom: 'from-license/20',
    gradientTo: 'to-amber-500/10',
  },
];

/* ==================== 核心优势对比 ==================== */
const ADVANTAGES = [
  {
    icon: <ShieldCheck size={24} />,
    title: '牌照优势',
    ours: '🇼🇸 萨摩亚政府合法授权，完全合规',
    theirs: '灰色地带 · 法律风险高',
    color: '#10B981',
  },
  {
    icon: <Clock size={24} />,
    title: '速度优势',
    ours: '最快2周完成发行并上链交易',
    theirs: '传统方式需3-6个月',
    color: '#3B82F6',
  },
  {
    icon: <DollarSign size={24} />,
    title: '成本优势',
    ours: '全流程服务节省60%综合费用',
    theirs: '多方协调 · 隐性成本高',
    color: '#F59E0B',
  },
  {
    icon: <Zap size={24} />,
    title: '通道优势',
    ours: '发行后直通 ZS Exchange + HK1683',
    theirs: '自行寻找交易所 · 审核难通过',
    color: '#7C3AED',
  },
];

/* ==================== 成功案例 (Mock) ==================== */
const CASE_STUDIES = [
  {
    name: 'MetaChain Protocol',
    symbol: 'MCP',
    type: 'DeFi基础设施',
    result: '发行后7日涨幅340%，市值突破$50M',
    timeline: '从签约到上币仅12天',
    package: '专业版',
  },
  {
    name: 'PacificGreen Energy',
    symbol: 'PGE',
    type: '碳中和RWA项目',
    result: '成功完成$200万IDO认购',
    timeline: '萨摩亚SPV实体+STO发行',
    package: '尊享版',
  },
  {
    name: 'NexGen AI Labs',
    symbol: 'NGAI',
    type: 'AI算力共享平台',
    result: '上线ZS Exchange首周交易量$8M',
    timeline: 'ERC20+BEP20双链部署',
    package: '专业版',
  },
];

export default function TokenServicePage() {
  return (
    <main className="min-h-screen bg-deep-900">
      <Navbar />

      {/* ==================== Hero 区域 ==================== */}
      <section className="relative overflow-hidden py-20 sm:py-28 px-4">
        {/* 背景 */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-brand-500/10 rounded-full blur-[150px]" />
          <div className="absolute bottom-0 right-0 w-[400px] h-[300px] bg-samoa/8 rounded-full blur-[120px]" />
        </div>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="relative max-w-5xl mx-auto text-center"
        >
          {/* 标签 */}
          <motion.div variants={fadeInUp}>
            <Badge variant="license" size="md" className="mb-6">
              🇼🇸 持牌代币发行服务
            </Badge>
          </motion.div>

          {/* 主标题 */}
          <motion.h1
            variants={fadeInUp}
            className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight"
          >
            萨摩亚政府牌照授权
            <br />
            <span className="bg-gradient-to-r from-brand-primary via-info to-samoa bg-clip-text text-transparent">
              专业合规发币
            </span>
          </motion.h1>

          {/* 副标题 */}
          <motion.p
            variants={fadeInUp}
            className="text-lg sm:text-xl text-text-secondary max-w-3xl mx-auto mb-10 leading-relaxed"
          >
            中萨数字科技集团旗下 ZS Exchange 持有萨摩亚数字资产交易所牌照，
            为全球项目方提供<span className="text-brand-light font-medium">合法合规</span>的代币发行全流程服务
          </motion.p>

          {/* CTA按钮组 */}
          <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/contact" className="no-underline">
              <Button size="lg" className="!rounded-xl !px-8 bg-gradient-to-r bg-brand-500 text-[#1A1D24] hover:!shadow-sm">
                预约免费咨询
                <ArrowRight size={18} className="ml-2" />
              </Button>
            </Link>
            <Link href="#cases" className="no-underline">
              <Button variant="outline" size="lg" className="!rounded-xl !px-8 border-deep-500 text-text-secondary hover:!border-brand-500 hover:!text-brand-light">
                查看发行案例
              </Button>
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* ==================== 服务流程图 (HowItWorks风格) ==================== */}
      <section className="relative py-20 px-4">
        <div className="max-w-6xl mx-auto">
          {/* 区域标题 */}
          <motion.div variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-14">
            <motion.h2 variants={fadeInUp} className="text-3xl sm:text-4xl font-bold text-text-primary mb-4">
              发行服务流程
            </motion.h2>
            <motion.p variants={fadeInUp} className="text-text-secondary max-w-2xl mx-auto">
              从咨询到上线，5步完成代币发行
            </motion.p>
          </motion.div>

          {/* 流程步骤 - 横向时间轴 */}
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="relative"
          >
            {/* 连接线 (桌面端) */}
            <div className="hidden lg:block absolute top-16 left-[10%] right-[10%] h-0.5 bg-gradient-to-r from-brand-primary/30 via-info/30 to-samoa/30" />

            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6 lg:gap-4">
              {SERVICE_STEPS.map((step, index) => (
                <motion.div key={step.id} variants={staggerItem} className="relative flex flex-col items-center text-center group">
                  {/* 步骤编号圆圈 */}
                  <div className="relative z-10 w-16 h-16 rounded-full bg-gradient-to-br bg-brand-500 text-[#1A1D24] flex items-center justify-center text-white text-lg font-bold shadow-lg shadow-brand-500/25 group-hover:scale-110 transition-transform duration-300 mb-4">
                    {step.id}
                  </div>
                  {/* 图标 */}
                  <div className="text-brand-light mb-3">{step.icon}</div>
                  {/* 标题 */}
                  <h3 className="text-base font-semibold text-text-primary mb-2">{step.title}</h3>
                  {/* 描述 */}
                  <p className="text-xs text-text-muted leading-relaxed">{step.desc}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ==================== 服务套餐卡片 (3档) ==================== */}
      <section className="relative py-20 px-4">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-brand-500/5 rounded-full blur-[150px]" />
        </div>

        <div className="relative max-w-6xl mx-auto">
          <motion.div variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-14">
            <motion.h2 variants={fadeInUp} className="text-3xl sm:text-4xl font-bold text-text-primary mb-4">
              选择适合您的套餐
            </motion.h2>
            <motion.p variants={fadeInUp} className="text-text-secondary max-w-2xl mx-auto">
              三档灵活定价，满足不同规模项目的需求
            </motion.p>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8"
          >
            {PACKAGES.map((pkg) => (
              <motion.div key={pkg.id} variants={staggerItem} className="group cursor-pointer">
                <Card
                  variant={pkg.highlight ? 'gradient-border' : 'default'}
                  padding="lg"
                  className={`h-full relative ${pkg.highlight ? '!border-l-brand-primary !border-l-4' : ''}`}
                >
                  {/* 推荐标签 */}
                  {pkg.highlight && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge variant="samoa" size="sm">{pkg.badge}</Badge>
                    </div>
                  )}

                  {/* 套餐头部 */}
                  <div className={`rounded-xl p-4 mb-6 bg-gradient-to-br ${pkg.gradientFrom} ${pkg.gradientTo}`}>
                    <h3 className={`text-xl font-bold`} style={{ color: pkg.color }}>{pkg.name}</h3>
                    <p className="text-3xl font-bold text-white mt-2">{pkg.price}</p>
                    {!pkg.highlight && (
                      <Badge variant="default" size="sm" className="mt-2">{pkg.badge}</Badge>
                    )}
                  </div>

                  {/* 功能列表 */}
                  <ul className="space-y-3 mb-6">
                    {pkg.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2 text-sm text-text-secondary">
                        <CheckCircle2 size={16} className="text-success shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA按钮 */}
                  <Button
                    variant={pkg.highlight ? 'primary' : 'outline'}
                    className={`w-full !rounded-lg ${
                      pkg.highlight
                        ? 'bg-gradient-to-r bg-brand-500 text-[#1A1D24] hover:!shadow-sm'
                        : 'border-deep-600 text-text-secondary hover:!border-brand-500 hover:!text-brand-light'
                    }`}
                  >
                    立即咨询
                    <ArrowRight size={16} className="ml-1.5" />
                  </Button>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ==================== 核心优势对比 ==================== */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <motion.div variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-14">
            <motion.h2 variants={fadeInUp} className="text-3xl sm:text-4xl font-bold text-text-primary mb-4">
              为什么选择 ZS 代币发行？
            </motion.h2>
            <motion.p variants={fadeInUp} className="text-text-secondary max-w-2xl mx-auto">
              对比传统发币方式，我们的核心差异化优势一目了然
            </motion.p>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 sm:grid-cols-2 gap-6"
          >
            {ADVANTAGES.map((adv) => (
              <motion.div key={adv.title} variants={staggerItem} className="group cursor-pointer">
                <Card variant="default" padding="lg" className="h-full">
                  <div className="flex items-start gap-4 mb-4">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                      style={{ backgroundColor: `${adv.color}20`, color: adv.color }}
                    >
                      {adv.icon}
                    </div>
                    <h3 className="text-lg font-semibold text-text-primary pt-2">{adv.title}</h3>
                  </div>
                  {/* 对比表格 */}
                  <div className="space-y-3">
                    <div className="flex items-start gap-2 p-3 rounded-lg bg-success/5 border border-success/15">
                      <CheckCircle2 size={16} className="text-success shrink-0 mt-0.5" />
                      <span className="text-sm text-success font-medium">{adv.ours}</span>
                    </div>
                    <div className="flex items-start gap-2 p-3 rounded-lg bg-danger/5 border border-danger/15">
                      <Star size={16} className="text-danger/60 shrink-0 mt-0.5" />
                      <span className="text-sm text-text-muted line-through decoration-danger/40">{adv.theirs}</span>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ==================== 成功案例展示 ==================== */}
      <section id="cases" className="relative py-20 px-4">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute bottom-0 left-1/4 w-[500px] h-[300px] bg-license/5 rounded-full blur-[120px]" />
        </div>

        <div className="relative max-w-6xl mx-auto">
          <motion.div variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-14">
            <motion.h2 variants={fadeInUp} className="text-3xl sm:text-4xl font-bold text-text-primary mb-4">
              成功案例
            </motion.h2>
            <motion.p variants={fadeInUp} className="text-text-secondary max-w-2xl mx-auto">
              已为多个优质项目提供代币发行服务，助力项目成功起飞
            </motion.p>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            {CASE_STUDIES.map((cs) => (
              <motion.div key={cs.symbol} variants={staggerItem} className="group cursor-pointer">
                <Card variant="default" padding="lg" className="h-full">
                  {/* 项目标识 */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br bg-brand-500 text-[#1A1D24] flex items-center justify-center text-white font-bold text-lg">
                      {cs.symbol.slice(0, 2)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-text-primary">{cs.name}</h3>
                      <p className="text-xs text-text-muted">{cs.type}</p>
                    </div>
                  </div>
                  {/* 结果数据 */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm">
                      <TrendingUp size={14} className="text-success" />
                      <span className="text-text-secondary">成果：</span>
                      <span className="text-success font-medium">{cs.result}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Clock size={14} className="text-brand-light" />
                      <span className="text-text-secondary">周期：</span>
                      <span className="text-text-primary">{cs.timeline}</span>
                    </div>
                  </div>
                  {/* 套餐标签 */}
                  <Badge variant={cs.package === '尊享版' ? 'license' : cs.package === '专业版' ? 'info' : 'default'} size="sm">
                    {cs.package}
                  </Badge>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ==================== 底部CTA区域 ==================== */}
      <section className="py-20 px-4">
        <motion.div
          variants={cardGlow as any}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
          className="max-w-4xl mx-auto rounded-2xl p-8 sm:p-12 text-center relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.2) 0%, rgba(11, 15, 25, 0.95) 100%)',
            border: '1px solid rgba(124, 58, 237, 0.25)',
          }}
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/10 rounded-full blur-[100px]" />
          <div className="relative z-10">
            <Badge variant="samoa" size="md" className="mb-4">🇼🇸 合规发行</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              准备好发行您的代币了吗？
            </h2>
            <p className="text-text-secondary max-w-xl mx-auto mb-8">
              免费获取专业评估报告，了解最适合您项目的发行方案。我们的团队将在24小时内与您联系。
            </p>
            <Button size="lg" className="!rounded-xl !px-10 bg-gradient-to-r bg-brand-500 text-[#1A1D24] hover:!shadow-sm">
              预约免费咨询
              <ArrowRight size={18} className="ml-2" />
            </Button>
          </div>
        </motion.div>
      </section>

      <Footer />
    </main>
  );
}
