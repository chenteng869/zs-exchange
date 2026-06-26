'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  Landmark,
  Building2,
  LineChart,
  ArrowRight,
  CheckCircle2,
  Star,
  Trophy,
  Scale,
  Clock,
  DollarSign,
  Users,
  Sparkles,
} from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Card, Badge, Button } from '@/components/ui';
import Table from '@/components/ui/Table';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const T: any = Table;
import { fadeInUp, staggerContainer, staggerItem, hoverLift, cardGlow } from '@/lib/animations';

/* ==================== 上市要求对比表数据 ==================== */
const LISTING_COMPARISON = [
  { requirement: '最低市值', samoa: '$50万', hk1683: '$1亿', samoaNote: '适合中小企业', hkNote: '大型企业门槛' },
  { requirement: '盈利要求', samoa: '无硬性要求', hk1683: '3年累计3000万HKD', samoaNote: '成长期友好', hkNote: '成熟企业要求' },
  { requirement: '审批时间', samoa: '2-4个月', hk1683: '8-16个月', samoaNote: '极速通道', hkNote: '传统周期' },
  { requirement: '预估总费用', samoa: '$5-20万', hk1683: '$500-1500万', samoaNote: '高性价比', hkNote: '高端市场' },
  { requirement: '适用对象', samoa: 'Web3/数字资产公司', hk1683: 'Pre-IPO/成熟企业', samoaNote: '创新型企业', hkNote: '传统行业巨头' },
  { requirement: '交易货币', samoa: 'USD/USDT + Token', hk1683: 'HKD/USD', samoaNote: '加密友好', hkNote: '传统金融' },
];

/* ==================== 上市流程 Pipeline ==================== */
const LISTING_PIPELINE = [
  { phase: '尽调', desc: '尽职调查与合规审查', short: 'DD' },
  { phase: '重组', desc: '股权架构重组优化', short: 'RE' },
  { phase: '审计', desc: '财务审计与报表编制', short: 'AU' },
  { phase: '申报', desc: '招股书撰写与递交', short: 'FI' },
  { phase: '问询', desc: '监管机构问询回复', short: 'QR' },
  { phase: '路演', desc: '投资者路演推介', short: 'RW' },
  { phase: '定价', desc: 'IPO定价与配售', short: 'PR' },
  { phase: '挂牌', desc: '正式挂牌交易', short: 'LS' },
  { phase: '交易', desc: '二级市场持续交易', short: 'TR' },
];

/* ==================== 成功案例 (Mock) ==================== */
const LISTING_CASES = [
  {
    name: 'DigitalOcean Tech',
    exchange: '萨摩亚证交所',
    type: 'Tokenized Stock',
    marketCap: '$120M',
    timeToListing: '3个月',
    highlight: '首家数字资产证券化上市公司',
  },
  {
    name: 'GreenEnergy Holdings',
    exchange: '香港 HK1683',
    type: 'SPAC合并上市',
    marketCap: '$850M',
    timeToListing: '10个月',
    highlight: '新能源赛道标杆企业',
  },
];

export default function ListingPage() {
  return (
    <main className="min-h-screen bg-deep-900">
      <Navbar />

      {/* ==================== Hero 区域 ==================== */}
      <section className="relative overflow-hidden py-20 sm:py-28 px-4">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/4 w-[600px] h-[400px] bg-brand-500/8 rounded-full blur-[140px]" />
          <div className="absolute bottom-0 right-1/4 w-[500px] h-[300px] bg-license/8 rounded-full blur-[120px]" />
        </div>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="relative max-w-5xl mx-auto text-center"
        >
          <motion.div variants={fadeInUp}>
            <Badge variant="license" size="md" className="mb-6">全球上市通道</Badge>
          </motion.div>

          <motion.h1
            variants={fadeInUp}
            className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight"
          >
            萨摩亚证交所{' '}
            <span className="text-text-muted">×</span>{' '}
            <span className="bg-gradient-to-r from-license to-amber-400 bg-clip-text text-transparent">
              香港 HK1683
            </span>
          </motion.h1>

          <motion.p
            variants={fadeInUp}
            className="text-lg sm:text-xl text-text-secondary max-w-3xl mx-auto mb-10 leading-relaxed"
          >
            双通道并行，为不同发展阶段的企业提供定制化的
            <span className="text-license font-medium"> 上市解决方案</span>
          </motion.p>

          <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/contact" className="no-underline">
              <Button size="lg" className="!rounded-xl !px-8 bg-gradient-to-r from-license to-amber-500 hover:!shadow-lg hover:shadow-license/30">
                免费评估上市可行性
                <ArrowRight size={18} className="ml-2" />
              </Button>
            </Link>
            <Link href="#comparison" className="no-underline">
              <Button variant="outline" size="lg" className="!rounded-xl !px-8 border-deep-500 text-text-secondary hover:!border-license hover:!text-license">
                查看对比详情
              </Button>
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* ==================== 双通道介绍 (左右分栏) ==================== */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-14">
            <motion.h2 variants={fadeInUp} className="text-3xl sm:text-4xl font-bold text-text-primary mb-4">
              双通道 · 双机遇
            </motion.h2>
            <motion.p variants={fadeInUp} className="text-text-secondary max-w-2xl mx-auto">
              根据企业发展阶段和战略目标，选择最适合的上市路径
            </motion.p>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-8"
          >
            {/* 左侧：萨摩亚证交所 */}
            <motion.div variants={staggerItem} className="group cursor-pointer">
              <Card
                variant="gradient-border"
                padding="lg"
                className="h-full !border-l-samoa !border-l-4 relative overflow-hidden"
              >
                {/* 背景装饰 */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-samoa/5 rounded-full blur-[60px]" />

                <div className="relative z-10">
                  {/* 通道标题 */}
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-samoa to-emerald-500 flex items-center justify-center text-2xl shadow-lg shadow-samoa/20">
                      🇼🇸
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-text-primary">萨摩亚证券交易所</h3>
                      <p className="text-xs text-samoa font-medium">Samoa Securities Exchange</p>
                    </div>
                  </div>

                  {/* 特点列表 */}
                  <div className="space-y-4 mb-6">
                    {[
                      { icon: <Landmark size={18} />, text: '数字资产证券化上市 (STO)', color: 'text-samoa' },
                      { icon: <LineChart size={18} />, text: 'Tokenized Stock 交易模式', color: 'text-blue-400' },
                      { icon: <Scale size={18} />, text: '门槛低 · 速度快 · 成本优', color: 'text-success' },
                      { icon: <Sparkles size={18} />, text: '创新金融工具全面支持', color: 'text-purple-400' },
                    ].map((item) => (
                      <div key={item.text} className="flex items-start gap-3">
                        <div className={`${item.color} shrink-0 mt-0.5`}>{item.icon}</div>
                        <span className="text-sm text-text-secondary">{item.text}</span>
                      </div>
                    ))}
                  </div>

                  {/* 适用对象 */}
                  <div className="p-4 rounded-xl bg-samoa/5 border border-samoa/15">
                    <p className="text-xs text-samoa font-semibold uppercase tracking-wider mb-2">适合对象</p>
                    <div className="flex flex-wrap gap-2">
                      {['Web3项目', '数字资产公司', '初创科技企业', 'DAO组织'].map((tag) => (
                        <Badge key={tag} variant="default" size="sm">{tag}</Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>

            {/* 右侧：香港 HK1683 */}
            <motion.div variants={staggerItem} className="group cursor-pointer">
              <Card
                variant="gradient-border"
                padding="lg"
                className="h-full !border-l-license !border-l-4 relative overflow-hidden"
              >
                {/* 背景装饰 */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-license/5 rounded-full blur-[60px]" />

                <div className="relative z-10">
                  {/* 通道标题 */}
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-license to-amber-500 flex items-center justify-center text-2xl shadow-lg shadow-license/20">
                      🇭🇰
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-text-primary">香港 HK1683 通道</h3>
                      <p className="text-xs text-license font-medium">Hong Kong Capital Gateway</p>
                    </div>
                  </div>

                  {/* 特点列表 */}
                  <div className="space-y-4 mb-6">
                    {[
                      { icon: <Building2 size={18} />, text: 'SPAC / IPO / RTO 三种路径', color: 'text-license' },
                      { icon: <Trophy size={18} />, text: '进入国际资本市场中心', color: 'text-amber-400' },
                      { icon: <Users size={18} />, text: '接触全球机构投资者', color: 'text-blue-400' },
                      { icon: <DollarSign size={18} />, text: '品牌价值大幅提升', color: 'text-green-400' },
                    ].map((item) => (
                      <div key={item.text} className="flex items-start gap-3">
                        <div className={`${item.color} shrink-0 mt-0.5`}>{item.icon}</div>
                        <span className="text-sm text-text-secondary">{item.text}</span>
                      </div>
                    ))}
                  </div>

                  {/* 适用对象 */}
                  <div className="p-4 rounded-xl bg-license/5 border border-license/15">
                    <p className="text-xs text-license font-semibold uppercase tracking-wider mb-2">适合对象</p>
                    <div className="flex flex-wrap gap-2">
                      {['成熟企业', 'Pre-IPO公司', '传统行业龙头', '跨境贸易企业'].map((tag) => (
                        <Badge key={tag} variant="default" size="sm">{tag}</Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ==================== 上市流程 Pipeline (横向时间轴) ==================== */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-14">
            <motion.h2 variants={fadeInUp} className="text-3xl sm:text-4xl font-bold text-text-primary mb-4">
              上市流程 Pipeline
            </motion.h2>
            <motion.p variants={fadeInUp} className="text-text-secondary max-w-2xl mx-auto">
              从尽调到挂牌，全流程专业辅导
            </motion.p>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="relative overflow-x-auto pb-4"
          >
            {/* 时间轴主线 */}
            <div className="flex items-start min-w-max gap-3 sm:gap-4 lg:gap-6">
              {LISTING_PIPELINE.map((phase, index) => (
                <motion.div
                  key={phase.phase}
                  variants={staggerItem}
                  className="flex flex-col items-center relative group"
                >
                  {/* 连接线 */}
                  {index < LISTING_PIPELINE.length - 1 && (
                    <div className="absolute top-5 left-full w-[calc(100%+8px)] h-0.5 bg-gradient-to-r from-brand-primary/40 to-transparent hidden sm:block" />
                  )}

                  {/* 圆形节点 */}
                  <div className="relative z-10 w-10 h-10 rounded-full bg-gradient-to-br bg-brand-500 text-[#1A1D24] flex items-center justify-center text-white text-xs font-bold shadow-md shadow-brand-500/20 group-hover:scale-110 transition-transform duration-300">
                    {phase.short}
                  </div>

                  {/* 阶段名称 */}
                  <p className="mt-3 text-sm font-semibold text-text-primary whitespace-nowrap">{phase.phase}</p>
                  <p className="text-xs text-text-muted whitespace-nowrap mt-1 max-w-[90px] text-center">{phase.desc}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ==================== 上市要求对比表 ==================== */}
      <section id="comparison" className="py-20 px-4">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-brand-500/5 rounded-full blur-[150px]" />
        </div>

        <div className="relative max-w-5xl mx-auto">
          <motion.div variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-14">
            <motion.h2 variants={fadeInUp} className="text-3xl sm:text-4xl font-bold text-text-primary mb-4">
              上市要求对比
            </motion.h2>
            <motion.p variants={fadeInUp} className="text-text-secondary max-w-2xl mx-auto">
              清晰对比两大通道的核心要求，助您做出最优决策
            </motion.p>
          </motion.div>

          <motion.div variants={fadeInUp} initial="hidden" whileInView="visible" viewport={{ once: true }}>
            <Table striped hoverable>
              <T.Thead>
                <T.Tr isZebra={false}>
                  <T.Th>要求项</T.Th>
                  <T.Th className="text-center">
                    <span className="inline-flex items-center gap-1.5">
                      🇼🇸 萨摩亚证交所
                    </span>
                  </T.Th>
                  <T.Th className="text-center">
                    <span className="inline-flex items-center gap-1.5">
                      🇭🇰 香港 HK1683
                    </span>
                  </T.Th>
                </T.Tr>
              </T.Thead>
              <T.Tbody>
                {LISTING_COMPARISON.map((row, index) => (
                  <T.Tr key={row.requirement} index={index}>
                    <T.Td>
                      <span className="font-medium text-text-primary">{row.requirement}</span>
                    </T.Td>
                    <T.Td>
                      <div className="text-center">
                        <p className="font-semibold text-samoa">{row.samoa}</p>
                        <p className="text-xs text-text-muted mt-0.5">{row.samoaNote}</p>
                      </div>
                    </T.Td>
                    <T.Td>
                      <div className="text-center">
                        <p className="font-semibold text-license">{row.hk1683}</p>
                        <p className="text-xs text-text-muted mt-0.5">{row.hkNote}</p>
                      </div>
                    </T.Td>
                  </T.Tr>
                ))}
              </T.Tbody>
            </Table>
          </motion.div>
        </div>
      </section>

      {/* ==================== 成功案例 ==================== */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <motion.div variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-14">
            <motion.h2 variants={fadeInUp} className="text-3xl sm:text-4xl font-bold text-text-primary mb-4">
              上市成功案例
            </motion.h2>
            <motion.p variants={fadeInUp} className="text-text-secondary max-w-2xl mx-auto">
              已助力多家企业成功登陆国际资本市场
            </motion.p>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            {LISTING_CASES.map((cs) => (
              <motion.div key={cs.name} variants={staggerItem} className="group cursor-pointer">
                <Card variant="default" padding="lg" className="h-full">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-text-primary">{cs.name}</h3>
                      <Badge
                        variant={cs.exchange.includes('萨摩亚') ? 'samoa' : 'license'}
                        size="sm"
                        className="mt-1"
                      >
                        {cs.exchange}
                      </Badge>
                    </div>
                    <Trophy size={22} className={cs.exchange.includes('萨摩亚') ? 'text-samoa' : 'text-license'} />
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-text-muted">上市类型</span>
                      <span className="text-text-primary font-medium">{cs.type}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-text-muted">市值</span>
                      <span className="text-success font-semibold">{cs.marketCap}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-text-muted">上市周期</span>
                      <span className="text-brand-light font-medium">{cs.timeToListing}</span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-deep-700/50">
                    <p className="text-xs text-text-muted italic">- {cs.highlight}</p>
                  </div>
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
            background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.12) 0%, rgba(11, 15, 25, 0.95) 100%)',
            border: '1px solid rgba(212, 175, 55, 0.25)',
          }}
        >
          <div className="absolute top-0 right-0 w-72 h-72 bg-license/8 rounded-full blur-[100px]" />
          <div className="relative z-10">
            <Badge variant="license" size="md" className="mb-4">上市辅导</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              您的企业准备好上市了吗？
            </h2>
            <p className="text-text-secondary max-w-xl mx-auto mb-8">
              提交基本信息，我们的上市顾问团队将在24小时内为您出具免费的上市可行性评估报告
            </p>
            <Button size="lg" className="!rounded-xl !px-10 bg-gradient-to-r from-license to-amber-500 hover:!shadow-lg hover:shadow-license/30">
              免费评估上市可行性
              <ArrowRight size={18} className="ml-2" />
            </Button>
          </div>
        </motion.div>
      </section>

      <Footer />
    </main>
  );
}
