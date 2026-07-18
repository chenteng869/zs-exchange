'use client';

/**
 * PortalAbout - 关于我们（2026-07-19 Q05 P3.10）
 *
 * 页面定位：
 * - 中萨数字科技交易所品牌官方介绍页
 * - 6 大区块：Hero / KPI / 平台简介 / 品牌愿景 / 核心优势 / 发展历程 / 团队 / 合作伙伴 / FAQ
 * - 团队详情 Drawer + FAQ 折叠 + 实时数据 ticker
 *
 * L4 工业级设计标准：
 * - 暗色 v6 纯黑 #000000 + 卡片 #141414 + ZSDEX 绿 primary #14B881
 * - 至少 5 个区块（Hero / KPI / 简介 / 愿景 / 优势 / 历程 / 团队 / 合作 / FAQ）
 * - 至少 5 项交互（搜索 / 过滤 / 团队详情 / FAQ 折叠 / Drawer / 快捷键）
 * - 1+ Drawer（团队详情）
 * - 1+ 实时数据波动（用户数 / 在线 ticker）
 * - 3+ 动画（Stagger / CountUp / Hover / 时间线脉冲）
 *
 * 合规要点（Q05 硬约束）：
 * - 不接真实 API，团队 / 合作伙伴 / KPI 使用 mock 占位
 * - 状态徽章统一使用 STATUS 枚举
 * - 不修改旧官网 / 旧 H5 / disabled pages
 * - 禁词（高风险合规词）规避：萨摩亚持牌 / MSA / DSAEX-2024-001
 * - 地域描述使用"全球 / 国际 / 重点市场与合规研究方向"等中性表达
 * - 不表达"已持牌 / 已获许可 / 已受监管 / 战略合资 / 粤港澳大湾区"
 */

import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import {
  Search,
  X,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Filter,
  Users,
  Building2,
  Globe2,
  Shield,
  Server,
  TrendingUp,
  Zap,
  Award,
  Briefcase,
  Mail,
  MessageCircle,
  MapPin,
  Twitter,
  Send,
  Linkedin,
  Github,
  Activity,
  Sparkles,
  Target,
  Heart,
  Rocket,
  CheckCircle2,
  CircleDot,
  CircleDashed,
  Clock,
  Calendar,
  Star,
  Trophy,
  Layers,
  Code2,
  Eye,
  ArrowUpRight,
  Plus,
  Minus,
  Keyboard,
  Compass,
  BookOpen,
  HelpCircle,
} from 'lucide-react';
import { BRAND, STATUS } from './brand';

// ============== 类型 ==============

type Dept = 'leadership' | 'tech' | 'product' | 'compliance' | 'ops' | 'biz';
type Region = 'apac' | 'emea' | 'americas' | 'global';

interface TeamMember {
  id: string;
  name: string;
  title: string;
  dept: Dept;
  region: Region;
  bio: string;
  highlights: string[];
  experience: string;
  education: string;
  languages: string[];
  initials: string;
  color: string;
}

interface TimelineNode {
  quarter: string;
  title: string;
  desc: string;
  status: 'done' | 'current' | 'future';
  highlight?: boolean;
}

interface Partner {
  id: string;
  name: string;
  category: 'tech' | 'audit' | 'banking' | 'data' | 'legal' | 'media';
  region: Region;
  desc: string;
  since: string;
  status: keyof typeof STATUS;
}

interface FAQ {
  q: string;
  a: string;
  category: string;
}

// ============== Mock 数据 ==============

const TEAM: TeamMember[] = [
  {
    id: 'TM-001',
    name: '陈志远',
    title: '联合创始人 / CEO',
    dept: 'leadership',
    region: 'apac',
    bio: '15 年金融科技与数字资产行业经验，主导过多个国际级交易系统的架构设计与落地。',
    highlights: ['前顶级量化机构技术合伙人', '区块链底层协议研究者', '数字金融生态建设倡导者'],
    experience: '15 年',
    education: '清华大学计算机科学硕士',
    languages: ['中文', '英文', '粤语'],
    initials: '陈',
    color: BRAND.primary,
  },
  {
    id: 'TM-002',
    name: '林雨晴',
    title: '联合创始人 / CTO',
    dept: 'tech',
    region: 'apac',
    bio: '高并发撮合引擎与分布式系统专家，主导过日交易量百亿级系统的设计与实现。',
    highlights: ['前 BAT 资深架构师', '千万级 QPS 系统经验', '开源项目 Maintainer'],
    experience: '12 年',
    education: '上海交通大学博士',
    languages: ['中文', '英文'],
    initials: '林',
    color: BRAND.success,
  },
  {
    id: 'TM-003',
    name: '王浩然',
    title: '首席合规官 CCO',
    dept: 'compliance',
    region: 'global',
    bio: '国际反洗钱与 KYC 体系搭建专家，熟悉多个法域的合规框架与监管要求。',
    highlights: ['前四大会计师事务所金融犯罪专家', 'CAMS 国际反洗钱认证师', '多家上市公司合规顾问'],
    experience: '18 年',
    education: '北京大学法学硕士',
    languages: ['中文', '英文', '日文'],
    initials: '王',
    color: BRAND.warning,
  },
  {
    id: 'TM-004',
    name: 'Sarah Chen',
    title: 'Chief Product Officer',
    dept: 'product',
    region: 'americas',
    bio: 'Product leader with 14 years of experience in fintech and trading platforms.',
    highlights: ['Former Head of Product at major exchange', 'UX/UI strategy expert', 'Fintech innovation award winner'],
    experience: '14 年',
    education: 'Stanford MBA',
    languages: ['English', '中文', 'Spanish'],
    initials: 'SC',
    color: BRAND.info,
  },
  {
    id: 'TM-005',
    name: 'Marco Rossi',
    title: 'Head of European Operations',
    dept: 'ops',
    region: 'emea',
    bio: '欧洲市场拓展与机构服务专家，深耕米兰 / 伦敦 / 苏黎世金融圈十余年。',
    highlights: ['前欧洲某交易所商务总监', 'MiCA 框架研究专家', '机构客户网络覆盖 200+'],
    experience: '16 年',
    education: 'Bocconi University 硕士',
    languages: ['Italiano', 'English', 'Français', '中文'],
    initials: 'MR',
    color: BRAND.primary,
  },
  {
    id: 'TM-006',
    name: '张敏',
    title: '首席安全官 CSO',
    dept: 'tech',
    region: 'apac',
    bio: '区块链安全与密码学专家，主导过多个亿级用户产品的安全架构。',
    highlights: ['前蚂蚁金服安全专家', '多次发现并修复高危漏洞', 'ISO 27001 主任审核员'],
    experience: '13 年',
    education: '中国科学院信息工程博士',
    languages: ['中文', '英文'],
    initials: '张',
    color: BRAND.danger,
  },
  {
    id: 'TM-007',
    name: 'Aisha Khan',
    title: 'Head of Institutional Business',
    dept: 'biz',
    region: 'emea',
    bio: 'Building institutional-grade services for hedge funds, prop traders, and family offices.',
    highlights: ['Former prime brokerage VP', 'OTC desk builder', '$2B+ AUM experience'],
    experience: '11 年',
    education: 'LSE MSc Finance',
    languages: ['English', 'Urdu', '中文'],
    initials: 'AK',
    color: BRAND.success,
  },
  {
    id: 'TM-008',
    name: '李子涵',
    title: 'Head of TreeGraph Ecosystem',
    dept: 'biz',
    region: 'apac',
    bio: '树图公链生态拓展与 RWA（真实世界资产）上链业务负责人。',
    highlights: ['Conflux 早期生态贡献者', 'RWA 业务架构师', '跨境资产上链实践'],
    experience: '9 年',
    education: '复旦大学金融学硕士',
    languages: ['中文', '英文'],
    initials: '李',
    color: BRAND.info,
  },
];

const TIMELINE: TimelineNode[] = [
  {
    quarter: '2022 Q3',
    title: '项目正式启动',
    desc: '核心团队组建，确立"全球数字金融基础设施"战略目标，启动底层撮合引擎研发。',
    status: 'done',
  },
  {
    quarter: '2023 Q1',
    title: '撮合引擎 V1.0 内测完成',
    desc: '核心交易系统内测完成，通过高强度压力测试与第三方安全审计。',
    status: 'done',
  },
  {
    quarter: '2023 Q4',
    title: '完成重点市场合规体系搭建',
    desc: '在多个国际重点市场与合规研究方向完成相关业务体系搭建与试运行。',
    status: 'done',
  },
  {
    quarter: '2024 Q2',
    title: 'ZSDEX 平台全球上线',
    desc: '开启全球生态合作伙伴招募，正式开放现货 / 合约 / 钱包 / 收益等核心业务。',
    status: 'done',
    highlight: true,
  },
  {
    quarter: '2024 Q4',
    title: 'AI 智能交易助手 Beta',
    desc: '集成大语言模型的 AI 交易助手内测上线，支持自然语言下单与策略生成。',
    status: 'done',
  },
  {
    quarter: '2025 Q2',
    title: 'RWA（真实世界资产）业务上线',
    desc: '首批 RWA 资产上链业务试运行，涵盖国债、房地产等传统资产类别。',
    status: 'done',
  },
  {
    quarter: '2026 Q1',
    title: 'Launch / Earn 双引擎发力',
    desc: 'Launchpad 与 Earn 中心全面升级，对接更多优质项目与多元化收益产品。',
    status: 'done',
  },
  {
    quarter: '2026 NOW',
    title: '新一代终端 V2.0 公测',
    desc: '全新一代专业版交易终端 V2.0 启动全球公测，集成 AI / 量化 / 跟单等高级能力。',
    status: 'current',
    highlight: true,
  },
  {
    quarter: '2026 Q4',
    title: '跨境合规矩阵扩展',
    desc: '在持续研究国际合规趋势的基础上，稳步推进跨境业务合作与机构服务扩展。',
    status: 'future',
  },
];

const PARTNERS: Partner[] = [
  { id: 'P-001', name: 'Conflux Network', category: 'tech', region: 'apac', desc: '树图公链底层生态合作', since: '2023', status: 'OPEN' },
  { id: 'P-002', name: 'Chainalysis', category: 'data', region: 'global', desc: '链上数据分析与合规', since: '2024', status: 'OPEN' },
  { id: 'P-003', name: 'CertiK', category: 'audit', region: 'global', desc: '智能合约安全审计', since: '2023', status: 'OPEN' },
  { id: 'P-004', name: 'SlowMist', category: 'audit', region: 'apac', desc: '区块链安全审计', since: '2023', status: 'OPEN' },
  { id: 'P-005', name: 'Sumsub', category: 'tech', region: 'emea', desc: 'KYC / AML 身份认证', since: '2024', status: 'OPEN' },
  { id: 'P-006', name: 'Elliptic', category: 'data', region: 'emea', desc: '链上反洗钱分析', since: '2024', status: 'OPEN' },
  { id: 'P-007', name: 'Fireblocks', category: 'banking', region: 'americas', desc: '机构级数字资产托管', since: '2024', status: 'BETA' },
  { id: 'P-008', name: 'Ledger', category: 'tech', region: 'global', desc: '硬件钱包安全方案', since: '2023', status: 'OPEN' },
  { id: 'P-009', name: 'TRM Labs', category: 'data', region: 'americas', desc: '加密风控情报', since: '2024', status: 'OPEN' },
  { id: 'P-010', name: 'CipherTrace', category: 'data', region: 'americas', desc: '加密货币情报', since: '2024', status: 'BETA' },
  { id: 'P-011', name: 'PeckShield', category: 'audit', region: 'apac', desc: '区块链安全审计', since: '2023', status: 'OPEN' },
  { id: 'P-012', name: 'Beosin', category: 'audit', region: 'apac', desc: '形式化验证审计', since: '2023', status: 'OPEN' },
  { id: 'P-013', name: 'BlockSec', category: 'audit', region: 'apac', desc: '安全监控服务', since: '2024', status: 'OPEN' },
  { id: 'P-014', name: 'HashKey', category: 'banking', region: 'apac', desc: '数字资产金融服务', since: '2024', status: 'BETA' },
  { id: 'P-015', name: 'CoinGecko', category: 'data', region: 'global', desc: '行情数据分发', since: '2023', status: 'OPEN' },
  { id: 'P-016', name: 'CoinMarketCap', category: 'data', region: 'global', desc: '行情数据分发', since: '2023', status: 'OPEN' },
];

const FAQS: FAQ[] = [
  {
    q: 'ZSDEX 的核心定位是什么？',
    a: 'ZSDEX 是面向全球用户的专业级数字资产交易平台，提供现货 / 合约 / 钱包 / 收益 / Launchpad 等一站式服务，定位为全球数字金融基础设施。',
    category: '基础',
  },
  {
    q: 'ZSDEX 在哪些地区有合规布局？',
    a: 'ZSDEX 持续关注全球主要市场的合规趋势，目前在亚太、欧洲、美洲等地区开展合规研究方向的合作与体系建设。具体服务范围以平台公告为准。',
    category: '合规',
  },
  {
    q: '平台是否提供法币出入金？',
    a: '支持主流法币出入金服务（受当地法规约束）。具体支持的法币、通道与限额请在「买币」页面查看。',
    category: '服务',
  },
  {
    q: '如何保障资产安全？',
    a: '采用 HSM 硬件安全模块、冷热钱包分离存储、多签权限校验、第三方安全审计等多重保障。核心系统经过 CertiK / SlowMist / PeckShield 等多家机构安全审计。',
    category: '安全',
  },
  {
    q: '是否支持机构客户？',
    a: '支持机构客户（需完成 KYB 认证）。提供 OTC 大宗交易、Prime 经纪、API 量化接入、定制化风控等专业服务。',
    category: '服务',
  },
  {
    q: 'API 接入方式？',
    a: '提供 REST API 与 WebSocket API 两种接入方式。详细文档请访问 /portal-preview/api 或开发者中心。',
    category: '技术',
  },
  {
    q: '是否支持测试环境？',
    a: '支持 Testnet 沙盒环境，提供模拟资金与完整功能，方便开发者测试与策略回测。',
    category: '技术',
  },
  {
    q: '如何成为 Launchpad 项目方？',
    a: '在「Launch」页面底部提交项目申请，运营团队会在 5-10 个工作日内完成初步评估。',
    category: '合作',
  },
];

const DEPT_LABELS: Record<Dept, string> = {
  leadership: '领导层',
  tech: '技术',
  product: '产品',
  compliance: '合规',
  ops: '运营',
  biz: '商务',
};

const REGION_LABELS: Record<Region, string> = {
  apac: '亚太',
  emea: '欧非中东',
  americas: '美洲',
  global: '全球',
};

const PARTNER_CAT: Record<Partner['category'], { label: string; color: string; icon: React.ElementType }> = {
  tech: { label: '技术', color: BRAND.primary, icon: Code2 },
  audit: { label: '审计', color: BRAND.success, icon: Shield },
  banking: { label: '机构', color: BRAND.warning, icon: Building2 },
  data: { label: '数据', color: BRAND.info, icon: Layers },
  legal: { label: '法务', color: BRAND.textSub, icon: BookOpen },
  media: { label: '媒体', color: BRAND.danger, icon: MessageCircle },
};

// ============== 子组件 ==============

function KpiCard({
  icon: Icon,
  label,
  value,
  suffix,
  color,
  isFloat,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  suffix?: string;
  color: string;
  isFloat?: boolean;
}) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    const duration = 1500;
    const start = Date.now();
    const step = () => {
      const elapsed = Date.now() - start;
      const p = Math.min(1, elapsed / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(value * eased);
      if (p < 1) requestAnimationFrame(step);
    };
    step();
  }, [value]);
  return (
    <div
      className="rounded-2xl p-4 transition-all hover:scale-105"
      style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}
    >
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
        style={{ backgroundColor: `${color}22`, color }}
      >
        <Icon className="w-5 h-5" />
      </div>
      <div className="text-2xl font-bold font-mono leading-none" style={{ color }}>
        {isFloat ? display.toFixed(1) : Math.round(display).toLocaleString()}
        {suffix}
      </div>
      <div className="text-xs mt-1.5" style={{ color: BRAND.textMute }}>
        {label}
      </div>
    </div>
  );
}

function TimelineItem({ node, idx }: { node: TimelineNode; idx: number }) {
  const side = idx % 2 === 0 ? 'left' : 'right';
  const statusMap = {
    done: { bg: BRAND.success, dot: BRAND.success, label: '已完成', color: BRAND.textMute },
    current: { bg: BRAND.primary, dot: BRAND.primary, label: '进行中', color: BRAND.primary },
    future: { bg: BRAND.bgAlt, dot: BRAND.textMute, label: '规划中', color: BRAND.textMute },
  };
  const s = statusMap[node.status];
  const StatusIcon = node.status === 'done' ? CheckCircle2 : node.status === 'current' ? CircleDot : CircleDashed;
  return (
    <div className="relative grid grid-cols-12 gap-4 items-center" style={{ minHeight: 96 }}>
      <div
        className={`col-span-12 md:col-span-5 ${side === 'right' ? 'md:col-start-8' : 'md:col-start-1 md:text-right'} ${
          side === 'right' ? 'md:order-2' : ''
        }`}
      >
        <div
          className="rounded-2xl p-4 transition-all hover:scale-[1.02]"
          style={{
            backgroundColor: node.highlight ? BRAND.card : BRAND.card,
            border: `1px solid ${node.highlight ? BRAND.primary : BRAND.border}`,
          }}
        >
          <div className={`flex items-center gap-2 mb-1.5 ${side === 'right' ? 'md:justify-start' : 'md:justify-end'}`}>
            <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded" style={{ backgroundColor: `${s.dot}22`, color: s.dot }}>
              {node.quarter}
            </span>
            <span
              className="text-[9px] font-bold px-1.5 py-0.5 rounded uppercase flex items-center gap-1"
              style={{ backgroundColor: `${s.dot}11`, color: s.dot }}
            >
              <StatusIcon className="w-2.5 h-2.5" />
              {s.label}
            </span>
          </div>
          <h3 className="text-sm font-bold mb-1" style={{ color: BRAND.text }}>
            {node.title}
          </h3>
          <p className="text-xs leading-relaxed" style={{ color: BRAND.textMute }}>
            {node.desc}
          </p>
        </div>
      </div>
      <div className="hidden md:flex col-span-2 justify-center relative">
        <div
          className="w-4 h-4 rounded-full z-10 flex items-center justify-center"
          style={{
            backgroundColor: s.dot,
            border: `4px solid ${BRAND.bg}`,
            boxShadow: node.status === 'current' ? `0 0 0 4px ${BRAND.primary}33` : 'none',
            animation: node.status === 'current' ? 'pulse 2s infinite' : 'none',
          }}
        />
      </div>
      <div className={`hidden md:block col-span-5 ${side === 'right' ? 'md:col-start-1' : 'md:col-start-8'}`}></div>
    </div>
  );
}

function TeamCard({ member, onClick }: { member: TeamMember; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      className="rounded-2xl p-4 cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98] group"
      style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}
    >
      <div className="flex items-center gap-3">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold shrink-0"
          style={{ backgroundColor: `${member.color}22`, color: member.color }}
        >
          {member.initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-bold truncate" style={{ color: BRAND.text }}>
            {member.name}
          </div>
          <div className="text-[10px] truncate" style={{ color: member.color }}>
            {member.title}
          </div>
        </div>
        <ChevronRight className="w-4 h-4 opacity-50 group-hover:translate-x-1 transition-transform" style={{ color: BRAND.textMute }} />
      </div>
      <div className="mt-3 flex items-center gap-2 flex-wrap">
        <span
          className="text-[9px] font-bold px-1.5 py-0.5 rounded uppercase"
          style={{ backgroundColor: BRAND.bgAlt, color: BRAND.textMute }}
        >
          {DEPT_LABELS[member.dept]}
        </span>
        <span
          className="text-[9px] font-bold px-1.5 py-0.5 rounded uppercase"
          style={{ backgroundColor: `${member.color}22`, color: member.color }}
        >
          {REGION_LABELS[member.region]}
        </span>
        <span className="text-[9px] font-mono ml-auto" style={{ color: BRAND.textMute }}>
          {member.experience}
        </span>
      </div>
    </div>
  );
}

function PartnerRow({ partner, onClick }: { partner: Partner; onClick: () => void }) {
  const cat = PARTNER_CAT[partner.category];
  const Icon = cat.icon;
  const s = STATUS[partner.status];
  return (
    <div
      onClick={onClick}
      className="rounded-xl p-3 flex items-center gap-3 cursor-pointer transition-all hover:scale-[1.01]"
      style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}
    >
      <div
        className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
        style={{ backgroundColor: `${cat.color}22`, color: cat.color }}
      >
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-sm font-bold truncate" style={{ color: BRAND.text }}>
            {partner.name}
          </span>
          <span
            className="text-[9px] font-bold px-1.5 py-0.5 rounded uppercase"
            style={{ backgroundColor: `${s.bg}`, color: s.color }}
          >
            {s.label}
          </span>
        </div>
        <div className="text-[10px] truncate" style={{ color: BRAND.textMute }}>
          {partner.desc} · {REGION_LABELS[partner.region]} · 自 {partner.since}
        </div>
      </div>
      <ChevronRight className="w-4 h-4 shrink-0" style={{ color: BRAND.textMute }} />
    </div>
  );
}

function FAQItem({ faq, open, onClick }: { faq: FAQ; open: boolean; onClick: () => void }) {
  return (
    <div
      className="rounded-xl overflow-hidden transition-all"
      style={{ backgroundColor: BRAND.card, border: `1px solid ${open ? BRAND.primary : BRAND.border}` }}
    >
      <button
        onClick={onClick}
        className="w-full p-4 flex items-center gap-3 text-left"
      >
        <span
          className="text-[9px] font-bold px-1.5 py-0.5 rounded uppercase shrink-0"
          style={{ backgroundColor: BRAND.bgAlt, color: BRAND.textMute }}
        >
          {faq.category}
        </span>
        <span className="text-sm font-bold flex-1" style={{ color: BRAND.text }}>
          {faq.q}
        </span>
        {open ? <Minus className="w-4 h-4 shrink-0" style={{ color: BRAND.primary }} /> : <Plus className="w-4 h-4 shrink-0" style={{ color: BRAND.textMute }} />}
      </button>
      {open && (
        <div className="px-4 pb-4 text-xs leading-relaxed" style={{ color: BRAND.textMute }}>
          {faq.a}
        </div>
      )}
    </div>
  );
}

// ============== 主组件 ==============

export function PortalAbout() {
  // ----- 状态 -----
  const [team, setTeam] = useState<TeamMember[]>(TEAM);
  const [deptFilter, setDeptFilter] = useState<Dept | 'all'>('all');
  const [regionFilter, setRegionFilter] = useState<Region | 'all'>('all');
  const [search, setSearch] = useState('');
  const [activeMember, setActiveMember] = useState<TeamMember | null>(null);
  const [activePartner, setActivePartner] = useState<Partner | null>(null);
  const [openFaq, setOpenFaq] = useState<string | null>(FAQS[0].q);
  const [helpOpen, setHelpOpen] = useState(false);
  const [tick, setTick] = useState(0);
  const [onlineUsers, setOnlineUsers] = useState(124580);
  const [totalTrades, setTotalTrades] = useState(5823417);
  const searchRef = useRef<HTMLInputElement | null>(null);

  // ----- 实时数据 ticker -----
  useEffect(() => {
    const id = setInterval(() => {
      setTick((t) => t + 1);
      setOnlineUsers((n) => n + Math.floor(Math.random() * 30) - 10);
      setTotalTrades((n) => n + Math.floor(Math.random() * 50) + 5);
    }, 2500);
    return () => clearInterval(id);
  }, []);

  // ----- 快捷键 -----
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target && (e.target as HTMLElement).tagName === 'INPUT') return;
      if (e.key === '/') {
        e.preventDefault();
        searchRef.current?.focus();
      } else if (e.key === 'Escape') {
        setActiveMember(null);
        setActivePartner(null);
        setHelpOpen(false);
      } else if (e.key === '?') {
        setHelpOpen((h) => !h);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // ----- 过滤 -----
  const filteredTeam = useMemo(() => {
    let list = team;
    if (deptFilter !== 'all') list = list.filter((m) => m.dept === deptFilter);
    if (regionFilter !== 'all') list = list.filter((m) => m.region === regionFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          m.title.toLowerCase().includes(q) ||
          m.bio.toLowerCase().includes(q)
      );
    }
    return list;
  }, [team, deptFilter, regionFilter, search]);

  const partnerCats = useMemo(() => {
    const m: Record<string, number> = { all: PARTNERS.length };
    PARTNERS.forEach((p) => {
      m[p.category] = (m[p.category] || 0) + 1;
    });
    return m;
  }, []);

  return (
    <div className="min-h-screen" style={{ backgroundColor: BRAND.bg, color: BRAND.text }}>
      {/* ===== 1. Hero ===== */}
      <section
        className="relative overflow-hidden border-b"
        style={{ borderColor: BRAND.border, backgroundColor: BRAND.bg, minHeight: 480 }}
      >
        <div className="absolute inset-0" style={{ background: `radial-gradient(circle at 50% 50%, ${BRAND.primary}11 0%, transparent 70%)` }} />
        <div className="relative max-w-7xl mx-auto px-6 py-20 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-6" style={{ backgroundColor: `${BRAND.primary}1A`, border: `1px solid ${BRAND.primary}33` }}>
            <Sparkles className="w-3.5 h-3.5" style={{ color: BRAND.primary }} />
            <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: BRAND.primary }}>
              About ZSDEX
            </span>
          </div>
          <h1
            className="text-4xl md:text-5xl font-bold leading-tight mb-4 max-w-3xl mx-auto"
            style={{ color: BRAND.text }}
          >
            定义全球数字金融新标准
          </h1>
          <p
            className="max-w-2xl mx-auto text-sm leading-relaxed mb-8"
            style={{ color: BRAND.textMute }}
          >
            中萨数字科技交易所（ZSDEX）致力于构建连接传统金融与数字资产的安全桥梁，为全球机构与专业投资者提供透明、合规的交易服务。
          </p>
          <div className="flex items-center justify-center gap-2 flex-wrap">
            {[
              { label: '合规运营', color: BRAND.primary, Icon: Shield },
              { label: '安全稳健', color: BRAND.success, Icon: Shield },
              { label: '科技驱动', color: BRAND.info, Icon: Zap },
              { label: '全球服务', color: BRAND.warning, Icon: Globe2 },
            ].map((tag, idx) => (
              <span
                key={idx}
                className="text-[10px] font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5"
                style={{ backgroundColor: `${tag.color}1A`, color: tag.color, border: `1px solid ${tag.color}33` }}
              >
                <tag.Icon className="w-3 h-3" />
                {tag.label}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ===== 2. KPI 实时数据 ===== */}
      <section className="max-w-7xl mx-auto px-6 -mt-12 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <KpiCard icon={Users} label="全球用户" value={onlineUsers} color={BRAND.primary} isFloat />
          <KpiCard icon={Activity} label="累计成交笔数" value={totalTrades} color={BRAND.success} />
          <KpiCard icon={Globe2} label="覆盖国家与地区" value={120} color={BRAND.info} suffix="+" />
          <KpiCard icon={Clock} label="全天候技术保障" value={24} color={BRAND.warning} suffix="/7" />
        </div>
      </section>

      {/* ===== 3. 平台简介 ===== */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <span className="w-8 h-1" style={{ backgroundColor: BRAND.primary }} />
              <h2 className="text-2xl font-bold" style={{ color: BRAND.primary }}>
                平台简介
              </h2>
            </div>
            <p className="text-sm leading-relaxed" style={{ color: BRAND.textMute }}>
              ZSDEX 是由专业金融科技团队构建的国际化数字资产交易平台。我们立足于亚太、面向全球市场，深度整合区块链底层技术与传统金融风控体系。
            </p>
            <p className="text-sm leading-relaxed" style={{ color: BRAND.textMute }}>
              作为数字经济基础设施的建设者，ZSDEX 不仅提供高效的现货与衍生品交易撮合，更致力于资产证券化（RWA）、跨境清算与合规托管业务的持续探索与创新。
            </p>
            <div className="grid grid-cols-2 gap-6 pt-6 border-t" style={{ borderColor: BRAND.border }}>
              <div>
                <div className="text-2xl font-bold font-mono" style={{ color: BRAND.primary }}>
                  120+
                </div>
                <div className="text-xs mt-1" style={{ color: BRAND.textMute }}>
                  覆盖国家与地区
                </div>
              </div>
              <div>
                <div className="text-2xl font-bold font-mono" style={{ color: BRAND.primary }}>
                  24/7
                </div>
                <div className="text-xs mt-1" style={{ color: BRAND.textMute }}>
                  全天候技术保障
                </div>
              </div>
            </div>
          </div>
          <div className="relative">
            <div
              className="rounded-2xl p-8 space-y-4"
              style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}
            >
              {[
                { icon: Target, label: '我们的使命', desc: '为全球用户提供安全、透明、高效的数字资产交易服务', color: BRAND.primary },
                { icon: Heart, label: '我们的价值观', desc: '用户至上 · 诚信为本 · 持续创新 · 责任担当', color: BRAND.success },
                { icon: Compass, label: '我们的愿景', desc: '成为全球数字金融基础设施的标杆建设者', color: BRAND.info },
              ].map((item, idx) => {
                const Icon = item.icon;
                return (
                  <div
                    key={idx}
                    className="flex items-start gap-3 p-3 rounded-xl transition-all hover:scale-[1.02]"
                    style={{ backgroundColor: BRAND.bgAlt }}
                  >
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                      style={{ backgroundColor: `${item.color}22`, color: item.color }}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-sm font-bold mb-1" style={{ color: BRAND.text }}>
                        {item.label}
                      </div>
                      <div className="text-xs leading-relaxed" style={{ color: BRAND.textMute }}>
                        {item.desc}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ===== 4. 品牌愿景与使命 ===== */}
      <section className="py-20 border-y" style={{ backgroundColor: BRAND.card, borderColor: BRAND.border }}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold" style={{ color: BRAND.text }}>
              品牌愿景与使命
            </h2>
            <p className="text-xs mt-2" style={{ color: BRAND.textMute }}>
              三大核心方向，构建全球数字金融未来
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                icon: Globe2,
                title: '重塑全球流动性',
                desc: '通过区块链技术打破地域金融壁垒，构建无国界的数字资产循环体系。',
                color: BRAND.primary,
              },
              {
                icon: Shield,
                title: '坚守合规底线',
                desc: '在合规框架下持续运营，确保每笔交易、每一分资产都受到透明审计与内部监督。',
                color: BRAND.success,
                highlight: true,
              },
              {
                icon: Rocket,
                title: '驱动数字创新',
                desc: '支持前沿技术的落地应用，赋能实体经济数字化转型与资产价值发现。',
                color: BRAND.info,
              },
            ].map((item, idx) => {
              const Icon = item.icon;
              return (
                <div
                  key={idx}
                  className="rounded-2xl p-6 flex flex-col items-center text-center transition-all hover:scale-105"
                  style={{
                    backgroundColor: BRAND.bg,
                    border: `1px solid ${item.highlight ? item.color : BRAND.border}`,
                    transform: item.highlight ? 'scale(1.05)' : 'none',
                  }}
                >
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
                    style={{ backgroundColor: `${item.color}22`, color: item.color }}
                  >
                    <Icon className="w-7 h-7" />
                  </div>
                  <h3 className="text-base font-bold mb-2" style={{ color: BRAND.text }}>
                    {item.title}
                  </h3>
                  <p className="text-xs leading-relaxed" style={{ color: BRAND.textMute }}>
                    {item.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ===== 5. 核心优势（Bento Grid） ===== */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <h2 className="text-2xl font-bold" style={{ color: BRAND.text }}>
            核心优势
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 md:grid-rows-2 gap-3 min-h-[480px]">
          <div
            className="md:col-span-2 md:row-span-2 rounded-2xl p-6 flex flex-col justify-end relative overflow-hidden group"
            style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.primary}33` }}
          >
            <div
              className="absolute inset-0 opacity-20 group-hover:opacity-40 transition-opacity"
              style={{ background: `linear-gradient(135deg, ${BRAND.primary}33 0%, transparent 70%)` }}
            />
            <div className="relative z-10">
              <span
                className="text-[10px] font-mono font-bold px-2 py-0.5 rounded mb-3 inline-block"
                style={{ backgroundColor: BRAND.primary, color: '#000' }}
              >
                SECURITY
              </span>
              <h3 className="text-xl font-bold mb-2" style={{ color: BRAND.text }}>
                顶级安全架构
              </h3>
              <p className="text-xs leading-relaxed" style={{ color: BRAND.textMute }}>
                采用 HSM 硬件安全模块、冷热钱包分离存储、多签权限校验。核心系统经过 CertiK / SlowMist / PeckShield 等多家权威安全审计机构渗透测试。
              </p>
            </div>
          </div>
          {[
            {
              icon: CheckCircle2,
              title: '合规体系',
              desc: '严格遵守反洗钱（AML）与了解客户（KYC）国际准则，操作全程可追溯。',
              color: BRAND.success,
            },
            {
              icon: Zap,
              title: '毫秒级撮合',
              desc: '高并发清算引擎，支持每秒百万次级成交处理，无延迟体验。',
              color: BRAND.warning,
            },
            {
              icon: Layers,
              title: '开放生态',
              desc: '通过 API 接口无缝对接各类金融机构、量化团队及第三方理财终端。',
              color: BRAND.info,
            },
            {
              icon: Server,
              title: '高可用架构',
              desc: '多机房异地容灾，99.99% SLA 保障，7×24 专家值守。',
              color: BRAND.primary,
            },
          ].map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="rounded-2xl p-5 flex flex-col justify-center transition-all hover:scale-105"
                style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}
              >
                <div
                  className="w-12 h-12 rounded-lg flex items-center justify-center mb-3"
                  style={{ backgroundColor: `${item.color}22`, color: item.color }}
                >
                  <Icon className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold mb-1" style={{ color: BRAND.text }}>
                  {item.title}
                </h4>
                <p className="text-xs leading-relaxed" style={{ color: BRAND.textMute }}>
                  {item.desc}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ===== 6. 发展历程 ===== */}
      <section className="py-20 border-y" style={{ backgroundColor: BRAND.card, borderColor: BRAND.border }}>
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold" style={{ color: BRAND.text }}>
              发展历程
            </h2>
            <p className="text-xs mt-2" style={{ color: BRAND.textMute }}>
              从 2022 至今，ZSDEX 持续稳步推进全球化布局
            </p>
          </div>
          <div className="relative">
            <div
              className="absolute left-1/2 top-0 bottom-0 w-px hidden md:block"
              style={{
                background: `linear-gradient(to bottom, ${BRAND.primary} 0%, ${BRAND.border} 100%)`,
                transform: 'translateX(-50%)',
              }}
            />
            <div className="space-y-8">
              {TIMELINE.map((node, idx) => (
                <TimelineItem key={idx} node={node} idx={idx} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ===== 7. 核心团队 ===== */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12 lg:col-span-3 space-y-3">
            <div className="space-y-2">
              <h2 className="text-2xl font-bold" style={{ color: BRAND.text }}>
                核心团队
              </h2>
              <p className="text-xs leading-relaxed" style={{ color: BRAND.textMute }}>
                来自全球金融科技、互联网、安全与合规领域的资深专家
              </p>
            </div>
            <div
              className="rounded-2xl p-3 space-y-2"
              style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}
            >
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: BRAND.textMute }} />
                <input
                  ref={searchRef}
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="搜索团队成员..."
                  className="w-full pl-10 pr-3 py-2 rounded-lg text-xs outline-none"
                  style={{ backgroundColor: BRAND.bgAlt, border: `1px solid ${BRAND.border}`, color: BRAND.text }}
                />
              </div>
              <div className="space-y-1.5">
                <div className="text-[10px] font-bold uppercase tracking-wider" style={{ color: BRAND.textMute }}>
                  部门
                </div>
                <div className="flex flex-wrap gap-1">
                  <button
                    onClick={() => setDeptFilter('all')}
                    className="text-[10px] px-2 py-1 rounded font-bold transition-all"
                    style={{
                      backgroundColor: deptFilter === 'all' ? BRAND.primary : BRAND.bgAlt,
                      color: deptFilter === 'all' ? '#000' : BRAND.textMute,
                    }}
                  >
                    全部
                  </button>
                  {(Object.keys(DEPT_LABELS) as Dept[]).map((d) => (
                    <button
                      key={d}
                      onClick={() => setDeptFilter(d)}
                      className="text-[10px] px-2 py-1 rounded font-bold transition-all"
                      style={{
                        backgroundColor: deptFilter === d ? BRAND.primary : BRAND.bgAlt,
                        color: deptFilter === d ? '#000' : BRAND.textMute,
                      }}
                    >
                      {DEPT_LABELS[d]}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-1.5">
                <div className="text-[10px] font-bold uppercase tracking-wider" style={{ color: BRAND.textMute }}>
                  区域
                </div>
                <div className="flex flex-wrap gap-1">
                  <button
                    onClick={() => setRegionFilter('all')}
                    className="text-[10px] px-2 py-1 rounded font-bold transition-all"
                    style={{
                      backgroundColor: regionFilter === 'all' ? BRAND.success : BRAND.bgAlt,
                      color: regionFilter === 'all' ? '#000' : BRAND.textMute,
                    }}
                  >
                    全部
                  </button>
                  {(Object.keys(REGION_LABELS) as Region[]).map((r) => (
                    <button
                      key={r}
                      onClick={() => setRegionFilter(r)}
                      className="text-[10px] px-2 py-1 rounded font-bold transition-all"
                      style={{
                        backgroundColor: regionFilter === r ? BRAND.success : BRAND.bgAlt,
                        color: regionFilter === r ? '#000' : BRAND.textMute,
                      }}
                    >
                      {REGION_LABELS[r]}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div
              className="rounded-2xl p-3 text-[10px] font-mono flex items-center justify-between"
              style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}`, color: BRAND.textMute }}
            >
              <span>找到 {filteredTeam.length} 位成员</span>
              <span style={{ color: BRAND.primary }}>tick #{tick}</span>
            </div>
          </div>
          <div className="col-span-12 lg:col-span-9 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {filteredTeam.length === 0 ? (
              <div className="col-span-full text-center py-12 text-sm" style={{ color: BRAND.textMute }}>
                <Search className="w-10 h-10 mx-auto mb-2" />
                暂无匹配成员
              </div>
            ) : (
              filteredTeam.map((m) => <TeamCard key={m.id} member={m} onClick={() => setActiveMember(m)} />)
            )}
          </div>
        </div>
      </section>

      {/* ===== 8. 合作伙伴 ===== */}
      <section className="py-20 border-y" style={{ backgroundColor: BRAND.card, borderColor: BRAND.border }}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold" style={{ color: BRAND.text }}>
              合作伙伴
            </h2>
            <p className="text-xs mt-2" style={{ color: BRAND.textMute }}>
              与全球顶尖的技术、安全、合规、机构服务伙伴共建生态
            </p>
          </div>
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <span className="text-[10px] font-bold uppercase" style={{ color: BRAND.textMute }}>
              分类
            </span>
            <span
              className="text-[10px] px-2 py-1 rounded font-bold"
              style={{ backgroundColor: BRAND.primary, color: '#000' }}
            >
              全部 ({partnerCats.all})
            </span>
            {Object.entries(partnerCats).filter(([k]) => k !== 'all').map(([k, v]) => {
              const c = PARTNER_CAT[k as Partner['category']];
              return (
                <span
                  key={k}
                  className="text-[10px] px-2 py-1 rounded font-bold flex items-center gap-1"
                  style={{ backgroundColor: `${c.color}22`, color: c.color }}
                >
                  <c.icon className="w-2.5 h-2.5" />
                  {c.label} ({v})
                </span>
              );
            })}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {PARTNERS.map((p) => (
              <PartnerRow key={p.id} partner={p} onClick={() => setActivePartner(p)} />
            ))}
          </div>
        </div>
      </section>

      {/* ===== 9. 联系我们 ===== */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div
          className="rounded-2xl overflow-hidden grid grid-cols-1 md:grid-cols-2"
          style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}
        >
          <div className="p-8 space-y-6">
            <div>
              <h2 className="text-xl font-bold mb-2" style={{ color: BRAND.text }}>
                联系我们
              </h2>
              <p className="text-xs" style={{ color: BRAND.textMute }}>
                我们的专业团队随时准备为您提供支持，欢迎通过以下渠道与我们取得联系。
              </p>
            </div>
            <div className="space-y-3">
              {[
                { icon: Mail, label: '商务合作', value: 'business@zsdex.com' },
                { icon: MessageCircle, label: '客户支持', value: 'support@zsdex.com' },
                { icon: MapPin, label: '运营总部', value: '线上 7×24 全球客服支持' },
              ].map((item, idx) => {
                const Icon = item.icon;
                return (
                  <div key={idx} className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: BRAND.bgAlt, color: BRAND.primary }}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-[10px] uppercase tracking-wider" style={{ color: BRAND.textMute }}>
                        {item.label}
                      </div>
                      <div className="text-sm font-mono" style={{ color: BRAND.text }}>
                        {item.value}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex gap-2">
              {[
                { icon: Twitter, label: 'X' },
                { icon: Send, label: 'Telegram' },
                { icon: Linkedin, label: 'LinkedIn' },
                { icon: Github, label: 'GitHub' },
              ].map((s, idx) => {
                const Icon = s.icon;
                return (
                  <button
                    key={idx}
                    className="w-10 h-10 rounded-lg flex items-center justify-center transition-all hover:scale-110"
                    style={{ backgroundColor: BRAND.bgAlt, color: BRAND.textMute, border: `1px solid ${BRAND.border}` }}
                    title={s.label}
                  >
                    <Icon className="w-4 h-4" />
                  </button>
                );
              })}
            </div>
          </div>
          <div
            className="p-8 flex flex-col justify-center items-center text-center"
            style={{ backgroundColor: BRAND.bgAlt, minHeight: 360 }}
          >
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center mb-4"
              style={{ backgroundColor: `${BRAND.primary}22` }}
            >
              <MessageCircle className="w-10 h-10" style={{ color: BRAND.primary }} />
            </div>
            <h3 className="text-lg font-bold mb-2" style={{ color: BRAND.text }}>
              在线客服
            </h3>
            <p className="text-xs leading-relaxed mb-4 max-w-xs" style={{ color: BRAND.textMute }}>
              7×24 全天候专业客服团队，为您提供账户、交易、技术等全方位支持
            </p>
            <button
              className="px-6 py-2.5 rounded-lg text-sm font-bold transition-all hover:scale-105"
              style={{ backgroundColor: BRAND.primary, color: '#000' }}
            >
              立即联系
            </button>
          </div>
        </div>
      </section>

      {/* ===== 10. FAQ ===== */}
      <section className="max-w-3xl mx-auto px-6 pb-20">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold" style={{ color: BRAND.text }}>
            常见问题
          </h2>
        </div>
        <div className="space-y-2">
          {FAQS.map((faq) => (
            <FAQItem key={faq.q} faq={faq} open={openFaq === faq.q} onClick={() => setOpenFaq(openFaq === faq.q ? null : faq.q)} />
          ))}
        </div>
      </section>

      {/* ===== 团队详情 Drawer ===== */}
      {activeMember && (
        <div
          className="fixed inset-0 z-50 flex justify-end"
          style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
          onClick={() => setActiveMember(null)}
        >
          <div
            className="w-full max-w-2xl h-full overflow-y-auto"
            style={{ backgroundColor: BRAND.bg, borderLeft: `1px solid ${BRAND.border}` }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 z-10 backdrop-blur-md" style={{ backgroundColor: `${BRAND.bg}E6` }}>
              <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: BRAND.border }}>
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-base font-bold"
                    style={{ backgroundColor: `${activeMember.color}22`, color: activeMember.color }}
                  >
                    {activeMember.initials}
                  </div>
                  <div>
                    <div className="text-sm font-bold" style={{ color: BRAND.text }}>
                      {activeMember.name}
                    </div>
                    <div className="text-[10px]" style={{ color: activeMember.color }}>
                      {activeMember.title}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setActiveMember(null)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: BRAND.bgAlt, color: BRAND.textMute }}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div
                className="rounded-xl p-4 text-sm leading-relaxed"
                style={{ backgroundColor: BRAND.card, color: BRAND.text, border: `1px solid ${BRAND.border}` }}
              >
                {activeMember.bio}
              </div>
              <div className="space-y-2">
                <div className="text-[10px] font-bold uppercase tracking-wider" style={{ color: BRAND.textMute }}>
                  核心亮点
                </div>
                {activeMember.highlights.map((h, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-xs" style={{ color: BRAND.text }}>
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: activeMember.color }} />
                    <span>{h}</span>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl p-3" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
                  <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: BRAND.textMute }}>
                    从业经验
                  </div>
                  <div className="text-sm font-bold font-mono" style={{ color: BRAND.text }}>
                    {activeMember.experience}
                  </div>
                </div>
                <div className="rounded-xl p-3" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
                  <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: BRAND.textMute }}>
                    教育背景
                  </div>
                  <div className="text-xs font-mono leading-relaxed" style={{ color: BRAND.text }}>
                    {activeMember.education}
                  </div>
                </div>
              </div>
              <div className="rounded-xl p-3" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
                <div className="text-[10px] uppercase tracking-wider mb-1.5" style={{ color: BRAND.textMute }}>
                  掌握语言
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {activeMember.languages.map((l) => (
                    <span
                      key={l}
                      className="text-[10px] font-bold px-2 py-0.5 rounded"
                      style={{ backgroundColor: `${activeMember.color}22`, color: activeMember.color }}
                    >
                      {l}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== 合作伙伴详情 Drawer ===== */}
      {activePartner && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
          onClick={() => setActivePartner(null)}
        >
          <div
            className="rounded-2xl p-6 max-w-md w-full mx-4"
            style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold" style={{ color: BRAND.text }}>
                {activePartner.name}
              </h2>
              <button
                onClick={() => setActivePartner(null)}
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: BRAND.bgAlt, color: BRAND.textMute }}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="text-xs space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase" style={{ color: BRAND.textMute }}>
                  分类
                </span>
                <span className="font-bold" style={{ color: PARTNER_CAT[activePartner.category].color }}>
                  {PARTNER_CAT[activePartner.category].label}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase" style={{ color: BRAND.textMute }}>
                  区域
                </span>
                <span className="font-bold" style={{ color: BRAND.text }}>
                  {REGION_LABELS[activePartner.region]}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase" style={{ color: BRAND.textMute }}>
                  合作时间
                </span>
                <span className="font-mono" style={{ color: BRAND.text }}>
                  自 {activePartner.since}
                </span>
              </div>
              <p className="leading-relaxed pt-2 mt-2 border-t" style={{ color: BRAND.textMute, borderColor: BRAND.border }}>
                {activePartner.desc}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ===== 快捷键帮助 Drawer ===== */}
      {helpOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}
          onClick={() => setHelpOpen(false)}
        >
          <div
            className="rounded-2xl p-6 max-w-md w-full mx-4"
            style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold flex items-center gap-2" style={{ color: BRAND.text }}>
                <Keyboard className="w-4 h-4" style={{ color: BRAND.primary }} />
                键盘快捷键
              </h2>
              <button
                onClick={() => setHelpOpen(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: BRAND.bgAlt, color: BRAND.textMute }}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-2 text-xs">
              {[
                { key: '/', desc: '聚焦团队搜索' },
                { key: 'Esc', desc: '关闭弹层 / 抽屉' },
                { key: '?', desc: '打开 / 关闭快捷键帮助' },
              ].map((s) => (
                <div
                  key={s.key}
                  className="flex items-center justify-between p-2 rounded-lg"
                  style={{ backgroundColor: BRAND.card }}
                >
                  <span style={{ color: BRAND.textMute }}>{s.desc}</span>
                  <kbd
                    className="text-[10px] font-mono px-2 py-1 rounded border"
                    style={{ backgroundColor: BRAND.bgAlt, borderColor: BRAND.border, color: BRAND.text }}
                  >
                    {s.key}
                  </kbd>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ===== 底部说明 ===== */}
      <footer className="border-t" style={{ borderColor: BRAND.border, backgroundColor: BRAND.bg }}>
        <div className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between flex-wrap gap-3 text-[10px]" style={{ color: BRAND.textMute }}>
          <span>本页团队 / 合作伙伴 / KPI 数据为 mock 占位示例，仅用于界面演示</span>
          <span className="font-mono">tick #{tick} · 心跳运行中</span>
        </div>
      </footer>
    </div>
  );
}

export default PortalAbout;
