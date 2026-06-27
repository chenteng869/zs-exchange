﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿'use client';

import { useState, type CSSProperties } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield,
  Award,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Globe,
  Lock,
  Scale,
  FileText,
  HelpCircle,
  Star,
  X,
} from 'lucide-react';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Button, Card } from '@/components/ui';
import Badge from '@/components/ui/Badge';
import { fadeInUp, staggerContainer, staggerItem } from '@/lib/animations';

// ==================== 牌照数据 ====================
const LICENSES = [
  {
    id: 'dsa',
    name: '数字资产交易牌照 (DASL)',
    icon: 'DASL',
    color: '#7C3AED',
    number: 'DSA-2024-0018',
    issuer: '萨摩亚金融服务管理局 (Samoa FSA)',
    issueDate: '2024年6月15日',
    expiryDate: '长期有效（年度审核）',
    scope: [
      '数字资产现货交易服务',
      '数字资产衍生品交易服务',
      '法币-加密货币兑换服务',
      '数字资产托管与保管服务',
      '跨境资金清算服务',
      '机构级API交易接入',
    ],
    queryUrl: 'https://www.samoa.fsa.gov.ws/license-registry',
    description: '萨摩亚政府颁发的最高级别数字资产交易许可，允许ZS Exchange在全球范围内提供合规的数字资产交易服务。',
  },
  {
    id: 'msb',
    name: '货币服务业务牌照 (MSB)',
    icon: 'MSB',
    color: '#10B981',
    number: 'MSB-2024-HK0892',
    issuer: '香港海关 (Hong Kong Customs)',
    issueDate: '2024年8月20日',
    expiryDate: '2025年8月19日',
    scope: [
      '货币兑换服务',
      '汇款业务',
      '支付处理服务',
      '电子钱包运营',
      '预付卡发行与管理',
    ],
    queryUrl: 'https://www.customs.gov.hk/msb/',
    description: '香港MSB牌照是亚洲地区最具权威性的金融服务许可证之一，确保平台在香港地区的合规运营。',
  },
  {
    id: 'dva',
    name: '数字资产托管牌照 (DAL)',
    icon: 'DAL',
    color: '#3B82F6',
    number: 'DAL-2024-SG0056',
    issuer: '新加坡金融管理局 (MAS)',
    issueDate: '2024年11月1日',
    expiryDate: '2026年10月31日',
    scope: [
      '数字资产冷热分离托管',
      '机构级多签钱包管理',
      '保险基金池运营',
      '客户资产隔离存储',
      '安全审计与风险控制',
    ],
    queryUrl: 'https://www.mas.gov.sg/regulations/digital-asset-license',
    description: '新加坡MAS颁发的数字资产托管牌照，代表全球最严格的资产安全标准，保障用户资产100%安全。',
  },
];

// ==================== 合规优势对比数据 ====================
const COMPARISON_DATA: { feature: string; zs: boolean | string; unlicensed: boolean | string }[] = [
  { feature: '政府监管牌照', zs: true, unlicensed: false },
  { feature: '用户资产隔离', zs: true, unlicensed: false },
  { feature: '定期审计报告', zs: true, unlicensed: false },
  { feature: 'KYC/AML合规', zs: true, unlicensed: false },
  { feature: '保险基金保障', zs: true, unlicensed: false },
  { feature: '冷存储比例>95%', zs: true, unlicensed: false },
  { feature: '24h客服支持', zs: true, unlicensed: 'partial' },
  { feature: '法律追索权', zs: true, unlicensed: false },
  { feature: '透明费率体系', zs: true, unlicensed: false },
];

// ==================== FAQ 数据 ====================
const FAQ_ITEMS = [
  {
    question: 'ZS Exchange 的牌照在哪些国家/地区有效？',
    answer: '我们的萨摩亚DASL牌照是全球性牌照，可在180+国家和地区合法开展数字资产交易业务。香港MSB牌照覆盖香港及大中华区用户。新加坡DAL牌照为用户提供国际级的资产安全保障。三张牌照形成完整的合规矩阵，确保全球用户的权益得到充分保护。',
  },
  {
    question: '如何验证牌照的真实性？',
    answer: '您可以通过各颁发机构的官方网站查询牌照信息：\n1. 萨摩亚FSA官网 → 牌照注册表搜索 DSA-2024-0018\n2. 香港海关官网 → MSB注册号 MSB-2024-HK0892\n3. 新加坡MAS官网 → 数字资产牌照 DAL-2024-SG0056\n所有牌照信息均可公开查验，我们也提供线下验真服务。',
  },
  {
    question: '持牌交易所和无牌交易所有什么区别？',
    answer: '核心区别在于：① 法律保护 - 持牌交易所受监管框架约束，用户享有法律追索权；② 资产安全 - 持牌交易所必须实行资产隔离和保险机制；③ 合规审查 - 持牌交易所需接受定期审计；④ 风险披露 - 持牌交易所需向用户充分揭示投资风险。无牌交易所则无上述任何保障。',
  },
  {
    question: '如果发生安全问题，牌照能带来什么保障？',
    answer: '作为持牌交易所，我们必须：① 设立专项保险基金（当前规模$5000万USDT）覆盖极端情况下的用户损失；② 接受第三方审计公司（Certik、SlowMist）的季度安全审计；③ 在监管机构备案应急预案；④ 与全球顶级律师事务所合作，为用户提供法律援助渠道。您的每一分资产都受到多重保障。',
  },
  {
    question: '牌照到期后怎么办？会停运吗？',
    answer: '不会。我们的牌照均为长期有效或可自动续期类型：萨摩亚DASL为永久牌照（仅需年度合规审核）；香港MSB和新加坡DAL为2-3年期牌照，我们会在到期前6个月启动续期流程。历史数据显示，我们的合规评级始终保持在A级以上，续期成功率100%。',
  },
];

export default function LicensesPage() {
  const [expandedLicense, setExpandedLicense] = useState<string | null>('dsa');
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

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
          <div className="absolute inset-0 bg-gradient-to-b from-gold/8 via-transparent to-transparent" />
          <div className="absolute top-16 left-1/4 w-80 h-80 bg-gold/10 rounded-full blur-[120px]" />

          <div className="max-w-[1400px] mx-auto px-4 lg:px-6 py-16 md:py-24 relative z-10 text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <Badge variant="samoa" size="md" className="mb-6">
                🇼🇸 萨摩亚 · 香港 · 新加坡
              </Badge>
              
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-text-primary tracking-tight mb-5">
                三张金牌
                <br />
                <span className="bg-gradient-to-r from-gold via-brand-primary to-samoa bg-clip-text text-transparent">
                  全球稀缺
                </span>
              </h1>
              
              <p className="text-lg md:text-xl text-text-secondary max-w-2xl mx-auto leading-relaxed mb-8">
                ZS Exchange 拥有三张由不同司法管辖区颁发的权威金融牌照，
                构建起行业领先的合规护城河
              </p>

              {/* 牌照数量展示 */}
              <div className="flex justify-center gap-8">
                {LICENSES.map((license) => (
                  <div key={license.id} className="text-center">
                    <div
                      className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-2 shadow-lg"
                      style={{ backgroundColor: `${license.color}20`, border: `1px solid ${license.color}40` }}
                    >
                      {license.icon}
                    </div>
                    <p className="text-xs font-medium text-text-secondary">{license.name.split(' ')[0]}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </motion.section>

        {/* ==================== LicenseShowcase 展示区 ==================== */}
        <section className="py-16 px-4">
          <div className="max-w-[1200px] mx-auto">
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="space-y-6"
            >
              {LICENSES.map((license, index) => (
                <motion.div key={license.id} variants={staggerItem}>
                  <Card
                    variant="default"
                    padding="none"
                    className={`overflow-hidden transition-all duration-300 ${
                      expandedLicense === license.id ? 'ring-2 ring-offset-2 ring-offset-deep-900' : ''
                    }`}
                    style={
                      expandedLicense === license.id
                        ? ({ '--tw-ring-color': license.color } as CSSProperties)
                        : undefined
                    }
                  >
                    {/* 卡片头部 - 可点击展开 */}
                    <button
                      onClick={() => setExpandedLicense(expandedLicense === license.id ? null : license.id)}
                      className="w-full flex items-center justify-between p-6 md:p-8 hover:bg-deep-700/30 transition-colors cursor-pointer text-left"
                    >
                      <div className="flex items-center gap-4 md:gap-6">
                        <div
                          className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl shrink-0"
                          style={{ backgroundColor: `${license.color}20` }}
                        >
                          {license.icon}
                        </div>
                        <div>
                          <h3 className="text-lg md:text-xl font-bold text-text-primary">
                            {license.name}
                          </h3>
                          <div className="flex flex-wrap items-center gap-3 mt-1">
                            <Badge variant="samoa" size="sm">官方认证</Badge>
                            <span className="text-xs text-text-muted font-mono">{license.number}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <Badge variant={index === 0 ? 'success' : index === 1 ? 'info' : 'default'} size="sm">
                          {license.issuer.split(' ')[0]}
                        </Badge>
                        {expandedLicense === license.id ? (
                          <ChevronUp size={20} className="text-text-muted" />
                        ) : (
                          <ChevronDown size={20} className="text-text-muted" />
                        )}
                      </div>
                    </button>

                    {/* 展开详情区 */}
                    <AnimatePresence>
                      {expandedLicense === license.id && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          className="overflow-hidden"
                        >
                          <div className="px-6 md:px-8 pb-6 md:pb-8 pt-2 border-t border-deep-700/50">
                            {/* 描述 */}
                            <p className="text-sm text-text-secondary mb-6">{license.description}</p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              {/* 基本信息 */}
                              <div className="space-y-3">
                                <h4 className="text-sm font-semibold text-text-primary flex items-center gap-2">
                                  <FileText size={16} className="text-brand-500" /> 基本信息
                                </h4>
                                <div className="space-y-2">
                                  {[
                                    { label: '牌照编号', value: license.number },
                                    { label: '颁发机构', value: license.issuer },
                                    { label: '颁发日期', value: license.issueDate },
                                    { label: '有效期至', value: license.expiryDate },
                                  ].map((item) => (
                                    <div key={item.label} className="flex justify-between py-2 px-3 rounded-lg bg-deep-900/50">
                                      <span className="text-xs text-text-muted">{item.label}</span>
                                      <span className="text-xs text-text-primary font-medium">{item.value}</span>
                                    </div>
                                  ))}
                                </div>
                                
                                {/* 官方查询链接 */}
                                <a
                                  href={license.queryUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-2 text-sm text-brand-light hover:text-brand-500 transition-colors no-underline mt-2"
                                >
                                  <ExternalLink size={14} />
                                  前往官方查询
                                </a>
                              </div>

                              {/* 业务范围 */}
                              <div>
                                <h4 className="text-sm font-semibold text-text-primary flex items-center gap-2 mb-3">
                                  <Scale size={16} className="text-samoa" /> 业务范围
                                </h4>
                                <div className="space-y-2">
                                  {license.scope.map((item, i) => (
                                    <div key={i} className="flex items-start gap-2 py-2 px-3 rounded-lg bg-deep-900/50">
                                      <CheckCircle2 size={14} className="text-success shrink-0 mt-0.5" />
                                      <span className="text-xs text-text-secondary">{item}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ==================== 合规优势对比表 ==================== */}
        <section className="py-16 px-4 bg-deep-800/30">
          <div className="max-w-[1000px] mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl md:text-4xl font-bold text-text-primary mb-3">
                为什么选择持牌交易所？
              </h2>
              <p className="text-text-secondary">ZS Exchange vs 无牌交易所</p>
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
                      <th className="text-left py-4 px-4 text-sm font-semibold text-text-muted">对比项目</th>
                      <th className="text-center py-4 px-4 text-sm font-semibold text-brand-500">ZS Exchange</th>
                      <th className="text-center py-4 px-4 text-sm font-semibold text-danger">无牌交易所</th>
                    </tr>
                  </thead>
                  <tbody>
                    {COMPARISON_DATA.map((row, i) => (
                      <tr key={row.feature} className={`border-b border-deep-700/50 ${i % 2 === 0 ? '' : 'bg-deep-800/30'}`}>
                        <td className="py-3 px-4 text-sm text-text-secondary">{row.feature}</td>
                        <td className="py-3 px-4 text-center">
                          {row.zs === true ? (
                            <CheckCircle2 size={18} className="inline text-success" />
                          ) : row.zs === 'partial' ? (
                            <span className="text-warning text-xs">部分</span>
                          ) : (
                            <X size={18} className="inline text-danger" />
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {row.unlicensed === true ? (
                            <CheckCircle2 size={18} className="inline text-success" />
                          ) : row.unlicensed === 'partial' ? (
                            <span className="text-warning text-xs">部分</span>
                          ) : (
                            <X size={18} className="inline text-danger" />
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

        {/* ==================== FAQ 区域 ==================== */}
        <section className="py-16 px-4">
          <div className="max-w-3xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl font-bold text-text-primary mb-3 flex items-center justify-center gap-3">
                <HelpCircle size={28} className="text-brand-500" />
                常见问题
              </h2>
              <p className="text-text-secondary">关于牌照资质的疑问解答</p>
            </motion.div>

            <div className="space-y-3">
              {FAQ_ITEMS.map((faq, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.05 }}
                  className="rounded-xl border border-deep-700 bg-deep-800 overflow-hidden"
                >
                  <button
                    onClick={() => setOpenFaqIndex(openFaqIndex === index ? null : index)}
                    className="w-full flex items-center justify-between p-5 text-left text-text-primary font-medium hover:bg-deep-700/50 transition-colors cursor-pointer"
                  >
                    <span className="pr-4">{faq.question}</span>
                    {openFaqIndex === index ? (
                      <ChevronUp size={18} className="shrink-0 text-brand-500" />
                    ) : (
                      <ChevronDown size={18} className="shrink-0 text-text-muted" />
                    )}
                  </button>
                  
                  {openFaqIndex === index && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="px-5 pb-5"
                    >
                      <p className="text-sm text-text-secondary leading-relaxed pt-3 border-t border-deep-700/50 whitespace-pre-line">
                        {faq.answer}
                      </p>
                    </motion.div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ==================== 底部 CTA ==================== */}
        <section className="py-16 px-4">
          <div className="max-w-[1000px] mx-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="rounded-2xl bg-gradient-to-r from-gold/15 to-brand-primary/10 border border-gold/30 p-10 md:p-14 text-center relative overflow-hidden"
            >
              <div className="absolute -top-20 -right-20 w-60 h-60 bg-gold/8 rounded-full blur-[80px]" />
              
              <div className="relative z-10">
                <Shield size={48} className="mx-auto text-gold mb-4" />
                <h2 className="text-2xl md:text-3xl font-bold text-text-primary mb-3">
                  安全合规，从选择开始
                </h2>
                <p className="text-text-secondary max-w-md mx-auto mb-8">
                  选择持牌交易所就是选择安心。立即加入ZS Exchange，
                  体验真正合规、安全的数字资产交易服务
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <Link href="/register" className="no-underline">
                    <Button size="lg" rightIcon={<ArrowRight size={18} />} className="!rounded-lg">
                      立即注册
                    </Button>
                  </Link>
                  <Link href="/about" className="no-underline">
                    <Button variant="ghost" size="lg" className="!rounded-lg text-text-secondary hover:!text-text-primary">
                      了解更多
                    </Button>
                  </Link>
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

function ArrowRight(props: any) {
  return <svg xmlns="http://www.w3.org/2000/svg" width={props.size || 18} height={props.size || 18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>;
}
