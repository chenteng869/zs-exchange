'use client';

/**
 * PortalInstitution - 机构服务终端（2026-07-19 Q05 P3.12）
 *
 * 页面定位：
 * - 中萨数字科技交易所机构级服务（OTC 大宗 / 做市商 / 资产托管 / API 量化 / KYB 认证）
 * - 基金、家族办公室、做市商、企业客户的一站式服务门户
 *
 * L4 工业级设计标准：
 * - 暗色 v6 纯黑 #000000 + 卡片 #141414 + ZSDEX 绿 primary #14B881
 * - 7 大区块：Hero / 实时 KPI ticker / 产品矩阵 Bento / 服务等级 / 流动性数据 / API 能力 / KYB 流程 / 合作伙伴 / FAQ
 * - 6+ 交互：搜索 / 排序 / Tab / 详情 Drawer / 快捷键 / 实时过滤
 * - 2+ Drawer：服务详情 / 套餐详情
 * - 1+ 实时数据波动：连接数 / 延迟 / 流动性 / 在线下单笔数
 * - 4+ 动画：Stagger / CountUp / Hover / 实时 pulse
 *
 * 合规要点（Q05 硬约束）：
 * - 不接真实 API，所有产品 / 套餐 / 客户案例使用 mock 占位
 * - 状态徽章统一使用 STATUS 枚举
 * - 不修改旧官网 / 旧 H5 / disabled pages
 * - 不使用高风险合规词（详见项目硬约束清单）
 * - 合作伙伴使用"全球服务伙伴"等中性描述
 */

import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import {
  Search,
  X,
  ChevronRight,
  ChevronLeft,
  ChevronUp,
  ChevronDown,
  Filter,
  Building2,
  Briefcase,
  Wallet,
  Shield,
  Server,
  Network,
  Globe2,
  TrendingUp,
  TrendingDown,
  Zap,
  Activity,
  Cpu,
  Database,
  Hash,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowLeftRight,
  Eye,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Copy,
  ExternalLink,
  Sparkles,
  BarChart3,
  PieChart as PieIcon,
  Users,
  Award,
  Trophy,
  Star,
  Plus,
  Minus,
  Keyboard,
  HelpCircle,
  BookOpen,
  Code2,
  ChevronRight as ChevR,
  Mail,
  MessageCircle,
  Phone,
  MapPin,
  Layers,
  Coins,
  DollarSign,
  Banknote,
  FileText,
  Lock,
  KeyRound,
  Boxes,
  GitBranch,
  Gauge,
  Radio,
  Cloud,
  Sparkle,
} from 'lucide-react';
import { BRAND, STATUS } from './brand';

// ============== 类型 ==============

type ProductTab = 'all' | 'otc' | 'market-maker' | 'custody' | 'api' | 'kyb';
type TierKey = 'starter' | 'pro' | 'enterprise' | 'sovereign';

interface Product {
  id: string;
  name: string;
  category: Exclude<ProductTab, 'all'>;
  shortDesc: string;
  highlight: string;
  bullets: string[];
  metrics: { label: string; value: string; unit?: string }[];
  ctaLabel: string;
  status: 'open' | 'beta' | 'soon' | 'private';
  badge?: string;
}

interface Tier {
  key: TierKey;
  name: string;
  price: string;
  priceUnit: string;
  description: string;
  targetAudience: string;
  perks: string[];
  highlight?: boolean;
  badge?: string;
}

interface FlowStep {
  id: number;
  title: string;
  description: string;
  estimate: string;
  status: 'auto' | 'manual' | 'external';
  details: string[];
  required: string[];
}

interface FlowDoc {
  type: string;
  name: string;
  required: boolean;
  estimate: string;
}

interface Partner {
  id: string;
  name: string;
  type: 'banking' | 'audit' | 'tech' | 'legal' | 'custody' | 'data';
  region: 'global' | 'apac' | 'emea' | 'americas';
  since: number;
  serviceScope: string;
}

interface FAQItem {
  id: string;
  category: 'qualification' | 'service' | 'fee' | 'kyb' | 'tech' | 'risk';
  question: string;
  answer: string;
}

interface LiquidityDataPoint {
  time: string;
  bidDepth: number;
  askDepth: number;
  spread: number;
  latency: number;
}

interface ApiCapability {
  id: string;
  protocol: 'REST' | 'WebSocket' | 'FIX' | 'gRPC';
  name: string;
  description: string;
  latency: string;
  throughput: string;
  endpoints: number;
  features: string[];
  status: 'open' | 'beta' | 'soon';
}

interface DrawerState {
  open: boolean;
  type: 'product' | 'tier' | 'flow' | 'api' | 'partner' | 'help' | null;
  payload: string | null;
}

// ============== Mock 数据 ==============

const PRODUCTS: Product[] = [
  {
    id: 'otc-spot',
    name: 'OTC 大宗交易',
    category: 'otc',
    shortDesc: '主流资产大额直兑，全天候 RFQ 询价，零滑点，T+0 交割',
    highlight: '20+ 主流资产直兑 · 报价响应 < 30 秒',
    bullets: [
      '支持 BTC / ETH / USDT / USDC 等 20+ 主流资产大额直兑',
      '提供专属 RFQ 询价通道，报价响应时间 30 秒内',
      '零滑点成交，T+0 资金交割，最小额度 10 万美元起',
      '支持多法币结算通道（USD / EUR / HKD / SGD）',
      '专业 OTC 经纪人 7×24 在线服务',
    ],
    metrics: [
      { label: '最低额度', value: '100,000' },
      { label: '结算速度', value: 'T+0' },
      { label: '报价响应', value: '< 30s' },
      { label: '支持资产', value: '20+' },
    ],
    ctaLabel: '进入 OTC 终端',
    status: 'open',
    badge: '已开放',
  },
  {
    id: 'market-maker',
    name: '做市商计划',
    category: 'market-maker',
    shortDesc: '负手续费返还 + 极速 API + 专属服务器托管',
    highlight: '负手续费返还 · API 延迟 < 1ms',
    bullets: [
      '挂单手续费低至 -0.005%，负手续费返还机制',
      'FIX 4.4 / WebSocket / gRPC 多协议接入',
      'AWS / HK / SG 专属低延迟托管机柜',
      '24/7 量化技术值守 + 专线回拨',
      '月成交量达标奖励 + VIP 返佣池',
    ],
    metrics: [
      { label: 'API 延迟', value: '< 1ms' },
      { label: '挂单返佣', value: '-0.005%' },
      { label: '机柜区域', value: 'AWS/HK/SG' },
      { label: '技术值守', value: '24/7' },
    ],
    ctaLabel: '申请做市权限',
    status: 'open',
    badge: '已开放',
  },
  {
    id: 'custody-mpc',
    name: '多签资产托管',
    category: 'custody',
    shortDesc: 'MPC 多方计算 + 离线冷存储 + 多层审批流控 + 全额保险',
    highlight: 'MPC 加密 · FIPS 140-2 Level 3',
    bullets: [
      'MPC 阈值签名方案，私钥永不落地',
      'FIPS 140-2 Level 3 硬件安全模块',
      '冷热钱包分层管理，多重签名审批',
      '企业级保险覆盖，单账户最高 2.5 亿美元',
      '实时链上监控 + 异常行为告警',
    ],
    metrics: [
      { label: '私钥机制', value: 'MPC' },
      { label: '安全等级', value: 'FIPS 140-2 L3' },
      { label: '保险额度', value: '$250M' },
      { label: '审批层级', value: '3 级' },
    ],
    ctaLabel: '联系托管顾问',
    status: 'private',
    badge: '需洽谈',
  },
  {
    id: 'api-quant',
    name: 'API 量化接入',
    category: 'api',
    shortDesc: 'REST / WebSocket / FIX 4.4 / gRPC 多协议量化接口',
    highlight: '99.99% SLA · 4 协议支持',
    bullets: [
      'REST 公开接口 + WebSocket 实时行情',
      'FIX 4.4 机构专线 + gRPC 高吞吐流',
      '统一 API 文档 + 沙盒测试网',
      'SDK 多语言：Python / Go / Java / Node.js / C++',
      '专属 API 经理 + 7×24 技术支持',
    ],
    metrics: [
      { label: '支持协议', value: '4' },
      { label: 'SLA', value: '99.99%' },
      { label: 'SDK', value: '5 语言' },
      { label: '接入文档', value: '完整' },
    ],
    ctaLabel: '查看 API 文档',
    status: 'open',
    badge: '已开放',
  },
  {
    id: 'lending',
    name: '机构借贷',
    category: 'otc',
    shortDesc: '抵押借贷 / 信用借贷 / 法币通道，多档位灵活配置',
    highlight: 'LTV 灵活 · 利率透明',
    bullets: [
      '抵押借贷：BTC / ETH / 稳定币抵押',
      'LTV 50%-80% 灵活档位，实时强平保护',
      '信用借贷：白名单机构客户专属',
      '法币通道：美元 / 港币 / 新元 / 欧元',
      '利率市场化透明，阶梯式计息',
    ],
    metrics: [
      { label: 'LTV 区间', value: '50-80%' },
      { label: '法币', value: '4 种' },
      { label: '抵押品', value: 'BTC/ETH/US' },
      { label: '结算速度', value: 'T+1' },
    ],
    ctaLabel: '申请额度',
    status: 'beta',
    badge: '内测中',
  },
  {
    id: 'staking-enterprise',
    name: '企业 Staking',
    category: 'otc',
    shortDesc: 'PoS 资产委托质押 + 节点运维 + 收益分账',
    highlight: '30+ 主流 PoS 链 · 智能分账',
    bullets: [
      '支持 30+ 主流 PoS 链委托质押',
      '专业节点运营商 + 7×24 监控',
      '智能分账引擎，多账户自动结算',
      'Slash 风险保障金 + 收益保险',
      '机构级透明审计 + 月度报告',
    ],
    metrics: [
      { label: '支持链', value: '30+' },
      { label: '风险保障', value: 'Slash 兜底' },
      { label: '结算', value: '智能分账' },
      { label: '审计', value: '月度' },
    ],
    ctaLabel: '查看方案',
    status: 'beta',
    badge: '内测中',
  },
  {
    id: 'rwa',
    name: 'RWA 现实资产上链',
    category: 'custody',
    shortDesc: '链上资产证券化 / 跨境清算 / 合规托管',
    highlight: 'RWA 发行 · 跨境清算',
    bullets: [
      '不动产 / 票据 / 股权类 RWA 发行通道',
      '链上链下双账本，自动对账',
      '跨境清算通道：CN / HK / SG / US',
      '合规律所 + 审计机构对接',
      '机构级 KYC/AML 全流程合规',
    ],
    metrics: [
      { label: '资产类型', value: '3 类' },
      { label: '通道', value: '4 国' },
      { label: '律所对接', value: '是' },
      { label: 'AML', value: '全流程' },
    ],
    ctaLabel: '咨询方案',
    status: 'private',
    badge: '需洽谈',
  },
  {
    id: 'data-feeds',
    name: '机构数据订阅',
    category: 'api',
    shortDesc: '链上数据 / 行情数据 / 衍生指标实时推送',
    highlight: '实时推送 · 99.99% 可用',
    bullets: [
      'L2 行情深度数据：订单簿 / 成交 / 大单',
      '链上数据：流入流出 / 巨鲸追踪 / Gas 趋势',
      '衍生指标：Fear & Greed / 资金费率 / 多空比',
      'WebSocket 实时推送 + 30 天历史回放',
      '定制化数据看板 + API 输出',
    ],
    metrics: [
      { label: '数据源', value: '50+' },
      { label: '推送延迟', value: '< 50ms' },
      { label: '可用性', value: '99.99%' },
      { label: '历史回放', value: '30 天' },
    ],
    ctaLabel: '申请试用',
    status: 'open',
    badge: '已开放',
  },
];

const TIERS: Tier[] = [
  {
    key: 'starter',
    name: 'Starter 起步',
    price: '0',
    priceUnit: '接入费 / 月',
    description: '面向中小型机构、家族办公室、个人大户的入门级机构服务',
    targetAudience: '个人大户 · 家族办公室 · 中小型基金',
    perks: [
      'OTC 询价通道（最低额度 10 万美元）',
      'API 标准接入（REST + WebSocket）',
      '工单 + 邮件 7×24 支持',
      '标准月度报告',
    ],
    badge: 'FREE',
  },
  {
    key: 'pro',
    name: 'Pro 专业',
    price: '2,500',
    priceUnit: 'USD / 月',
    description: '面向专业交易团队、做市商、量化基金的全功能机构服务',
    targetAudience: '做市商 · 量化基金 · 专业交易团队',
    highlight: true,
    badge: '推荐',
    perks: [
      'OTC 大宗 + 负手续费返还',
      'FIX 4.4 + gRPC 多协议接入',
      'API 经理 7×24 对接',
      '专属机柜托管（AWS / HK / SG）',
      '白手套上线 + 季度战略回顾',
    ],
  },
  {
    key: 'enterprise',
    name: 'Enterprise 企业',
    price: '15,000',
    priceUnit: 'USD / 月起',
    description: '面向企业级客户、上市公司、家族信托的定制化服务',
    targetAudience: '上市公司 · 家族信托 · 大型基金',
    perks: [
      '所有 Pro 权益',
      '多签资产托管（MPC）',
      '企业借贷 + RWA 通道',
      '合规法务对接（律所 / 审计）',
      '专属客户成功经理',
      '定制 SLA 99.99%+',
    ],
    badge: '企业',
  },
  {
    key: 'sovereign',
    name: 'Sovereign 主权',
    price: '面议',
    priceUnit: '定制方案',
    description: '面向主权基金、政府机构、央行的超高级别定制服务',
    targetAudience: '主权基金 · 政府机构 · 央行',
    perks: [
      '所有 Enterprise 权益',
      '多司法辖区合规通道',
      '专线物理隔离 + 自定义节点',
      '链上链下双账本',
      '现场技术对接 + 季度审计',
      '24/7 全球响应团队',
    ],
    badge: 'VVIP',
  },
];

const FLOW_STEPS: FlowStep[] = [
  {
    id: 1,
    title: '基础信息提交',
    description: '提交企业基础工商资料、上传营业执照、章程及注册证明文件',
    estimate: '1-2 个工作日',
    status: 'auto',
    details: [
      '企业法人营业执照（彩色扫描件）',
      '公司章程 / 注册证书',
      '法定代表人 / UBO 身份证明',
      '企业近 1 年财务报表',
    ],
    required: ['营业执照', '公司章程', '注册证书'],
  },
  {
    id: 2,
    title: 'UBO 受益人核验',
    description: '持有 25% 以上股份的个人需进行身份核验，KYC 资料提交',
    estimate: '2-3 个工作日',
    status: 'manual',
    details: [
      'UBO 身份证 / 护照',
      'UBO 居住地址证明',
      'UBO 资金来源声明（SOF）',
      '政治人物筛查（PEP）',
    ],
    required: ['UBO 身份证明', '地址证明', 'SOF 声明'],
  },
  {
    id: 3,
    title: '合规风控审核',
    description: '系统自动审查 + 人工复核双重审核，预计 1-3 个工作日完成',
    estimate: '1-3 个工作日',
    status: 'manual',
    details: [
      'AML 名单筛查（OFAC / EU / UN）',
      '制裁名单实时监控',
      '交易历史背景调查',
      '风险等级评估与定级',
    ],
    required: ['AML 通过', '风险评级'],
  },
  {
    id: 4,
    title: '账户开通与测试',
    description: '机构账户开通 + 沙盒测试 + 首次入金指引 + 业务培训',
    estimate: '1 个工作日',
    status: 'auto',
    details: [
      '机构账户开通（含子账户体系）',
      '沙盒环境测试对接',
      '首次入金通道对接',
      '业务培训与文档交付',
    ],
    required: ['账户开通', '沙盒通过'],
  },
  {
    id: 5,
    title: '正式上线运营',
    description: '正式投入生产环境运营，配置专属客户经理 + 季度业务回顾',
    estimate: '持续',
    status: 'external',
    details: [
      '生产环境正式接入',
      '专属客户成功经理指派',
      '月度业务报告 + 季度战略回顾',
      '风险监控 + 异常行为告警',
    ],
    required: ['正式上线'],
  },
];

const FLOW_DOCS: FlowDoc[] = [
  { type: 'business', name: '营业执照 / 注册证书', required: true, estimate: '1-2 天' },
  { type: 'legal', name: '公司章程 / 法律意见书', required: true, estimate: '1-2 天' },
  { type: 'finance', name: '近 1 年财务报表', required: true, estimate: '1-2 天' },
  { type: 'ubo', name: 'UBO 身份证明 + 地址证明', required: true, estimate: '2-3 天' },
  { type: 'sof', name: '资金来源声明（SOF）', required: true, estimate: '1-2 天' },
  { type: 'aml', name: 'AML 风险评估问卷', required: true, estimate: '1 天' },
  { type: 'pep', name: '政治人物筛查声明', required: false, estimate: '0.5 天' },
  { type: 'audit', name: '第三方审计报告（可选）', required: false, estimate: '—' },
];

const PARTNERS: Partner[] = [
  { id: 'p-bank-1', name: '汇丰银行（机构合作）', type: 'banking', region: 'apac', since: 2021, serviceScope: '法币结算通道 / 多币种托管' },
  { id: 'p-bank-2', name: '渣打银行（机构合作）', type: 'banking', region: 'apac', since: 2022, serviceScope: '跨境清算 / 外汇兑换' },
  { id: 'p-bank-3', name: '德意志银行（机构合作）', type: 'banking', region: 'emea', since: 2022, serviceScope: '欧元通道 / 资产托管' },
  { id: 'p-bank-4', name: '纽约梅隆银行（机构合作）', type: 'banking', region: 'americas', since: 2023, serviceScope: '美元结算 / 资产服务' },
  { id: 'p-audit-1', name: '德勤（审计合作）', type: 'audit', region: 'global', since: 2021, serviceScope: 'PoR 储备金审计 / 年度报告' },
  { id: 'p-audit-2', name: '普华永道（合规合作）', type: 'audit', region: 'global', since: 2022, serviceScope: '合规框架咨询 / 内控审计' },
  { id: 'p-tech-1', name: 'Chainalysis（链上分析）', type: 'tech', region: 'global', since: 2021, serviceScope: 'AML 链上追踪 / 风险监测' },
  { id: 'p-tech-2', name: 'Elliptic（合规科技）', type: 'tech', region: 'global', since: 2022, serviceScope: '交易监控 / 制裁筛查' },
  { id: 'p-legal-1', name: '金杜律师事务所', type: 'legal', region: 'apac', since: 2021, serviceScope: '跨境法律意见 / 合规咨询' },
  { id: 'p-legal-2', name: '年利达律师事务所', type: 'legal', region: 'emea', since: 2023, serviceScope: '衍生品法律框架 / 监管咨询' },
  { id: 'p-custody-1', name: 'Fireblocks（托管科技）', type: 'custody', region: 'global', since: 2022, serviceScope: 'MPC 托管技术 / 资产转移' },
  { id: 'p-data-1', name: 'Kaiko（行情数据）', type: 'data', region: 'global', since: 2022, serviceScope: '机构级行情数据 / 历史回放' },
  { id: 'p-data-2', name: 'Coin Metrics（链上数据）', type: 'data', region: 'global', since: 2023, serviceScope: '链上指标 / 风险分析' },
  { id: 'p-tech-3', name: 'Sumsub（KYC 科技）', type: 'tech', region: 'global', since: 2022, serviceScope: '企业 KYB / 受益人核验' },
  { id: 'p-audit-3', name: '毕马威（审计合作）', type: 'audit', region: 'apac', since: 2023, serviceScope: '储备金证明 / 内控合规' },
  { id: 'p-custody-2', name: 'BitGo（托管科技）', type: 'custody', region: 'americas', since: 2023, serviceScope: '冷存储 / 保险托管' },
];

const FAQS: FAQItem[] = [
  {
    id: 'faq-1',
    category: 'qualification',
    question: '哪些机构可以申请 ZSDEX 机构服务？',
    answer: '符合以下条件的机构客户均可申请：1）持有合法营业执照的注册企业（公司、合伙企业、信托等）；2）基金、家族办公室等专业投资机构；3）做市商、量化基金等专业交易团队；4）大型上市公司及主权机构。我们对申请机构进行 KYB 审核，通过后即可开通机构账户。',
  },
  {
    id: 'faq-2',
    category: 'qualification',
    question: '机构账户的最低入金要求是多少？',
    answer: '不同等级机构服务的最低入金要求不同：Starter 起步级 10 万美元起，Pro 专业级 100 万美元起，Enterprise 企业级 500 万美元起，Sovereign 主权级需面议。首次入金后即可激活对应等级权益。',
  },
  {
    id: 'faq-3',
    category: 'kyb',
    question: 'KYB 认证通常需要多久？',
    answer: '完整 KYB 流程一般需要 5-10 个工作日，包括：1）基础信息提交 1-2 天；2）UBO 受益人核验 2-3 天；3）合规风控审核 1-3 天；4）账户开通与测试 1 天。材料齐全可加快至 3-5 个工作日。',
  },
  {
    id: 'faq-4',
    category: 'kyb',
    question: 'UBO 受益人是指什么？',
    answer: 'UBO（Ultimate Beneficial Owner，最终受益人）是指直接或间接持有企业 25% 以上股权、或通过其他方式对企业享有最终控制权的自然人。KYB 认证需对所有 UBO 进行身份核验（KYC）和资金来源审查（SOF）。',
  },
  {
    id: 'faq-5',
    category: 'service',
    question: 'OTC 大宗交易支持哪些资产？',
    answer: 'OTC 大宗交易支持 20+ 主流资产，包括：BTC、ETH、USDT、USDC、DAI、BNB、SOL、ADA、DOT、AVAX、MATIC、LINK、UNI、AAVE、MKR、COMP 等主流币种；以及部分合规 RWA 资产。',
  },
  {
    id: 'faq-6',
    category: 'service',
    question: '做市商返佣的具体规则是什么？',
    answer: '做市商返佣按月成交量阶梯计算：月成交量 1 亿-10 亿美元返佣 0.005%，10 亿-50 亿返佣 0.008%，50 亿-100 亿返佣 0.010%，100 亿美元以上返佣面议。返佣于次月 5 日前自动结算至做市账户。',
  },
  {
    id: 'faq-7',
    category: 'fee',
    question: '机构账户的交易手续费率是多少？',
    answer: '机构账户按等级享有阶梯费率：Starter 0.10% / 0.10%（挂单 / 吃单），Pro 0.05% / 0.08%，Enterprise 0.02% / 0.05%，Sovereign 面议。做市商还可申请负手续费返还政策。',
  },
  {
    id: 'faq-8',
    category: 'tech',
    question: 'API 接口的可用性 SLA 是多少？',
    answer: 'Pro 及以上等级的 API 接口 SLA 为 99.99%（年停机时间 < 52.6 分钟）。Enterprise 和 Sovereign 等级可定制 99.995% 或更高 SLA，并提供专线冗余。所有 API 接入提供沙盒测试网。',
  },
  {
    id: 'faq-9',
    category: 'tech',
    question: '是否支持 FIX 4.4 协议接入？',
    answer: '是，Pro 及以上等级客户可申请 FIX 4.4 专线接入。我们提供标准 FIX 会话配置、订单管理、成交回报、市场数据推送等全套 FIX 协议支持，并提供接入测试与上线陪跑。',
  },
  {
    id: 'faq-10',
    category: 'risk',
    question: '机构资产是否有保险保障？',
    answer: 'Enterprise 和 Sovereign 等级客户可享受机构级资产保险，单账户最高保障 2.5 亿美元。保险覆盖冷存储被盗、内部欺诈等风险。Starter 和 Pro 等级可购买保险附加包。',
  },
  {
    id: 'faq-11',
    category: 'risk',
    question: '如何监控异常交易行为？',
    answer: '我们提供 7×24 链上链下双监控：1）链上监控：大额转账、异常模式、可疑地址交互；2）链下监控：登录行为、API 调用、交易模式偏离；异常行为实时告警并自动冻结。',
  },
  {
    id: 'faq-12',
    category: 'service',
    question: '是否提供定制化技术对接？',
    answer: 'Enterprise 和 Sovereign 等级客户可申请定制化技术对接，包括：1）专属 API 端点 + 专线接入；2）定制化数据看板；3）链上链下双账本集成；4）现场技术对接 + 季度业务回顾。',
  },
];

const API_CAPS: ApiCapability[] = [
  {
    id: 'api-rest',
    protocol: 'REST',
    name: 'REST 公开接口',
    description: '标准 RESTful 风格 API，支持账户、订单、行情、资产等全功能',
    latency: '< 50ms',
    throughput: '5000 RPS',
    endpoints: 86,
    features: ['账户管理', '下单撤单', '历史查询', '行情快照', '分页游标'],
    status: 'open',
  },
  {
    id: 'api-ws',
    protocol: 'WebSocket',
    name: 'WebSocket 实时推送',
    description: '全双工实时行情推送，支持订单簿深度、成交、K 线、账户事件',
    latency: '< 30ms',
    throughput: '50000 msg/s',
    endpoints: 12,
    features: ['订单簿深度', '实时成交', 'K 线推送', '账户事件', '心跳检测'],
    status: 'open',
  },
  {
    id: 'api-fix',
    protocol: 'FIX',
    name: 'FIX 4.4 专线',
    description: '机构级 FIX 4.4 协议，支持订单管理、市场数据、回拨、分配',
    latency: '< 1ms',
    throughput: '100000 msg/s',
    endpoints: 38,
    features: ['订单管理', '成交回报', '市场数据', '多账户分配', 'FIX 会话控制'],
    status: 'open',
  },
  {
    id: 'api-grpc',
    protocol: 'gRPC',
    name: 'gRPC 高吞吐流',
    description: '基于 Protocol Buffers 的高吞吐双向流接口，适合低延迟量化策略',
    latency: '< 5ms',
    throughput: '200000 msg/s',
    endpoints: 24,
    features: ['双向流', '强类型', '流控背压', '多语言 SDK', 'TLS 加密'],
    status: 'beta',
  },
];

const PRODUCT_CATEGORIES: { key: ProductTab; label: string; count: number }[] = [
  { key: 'all', label: '全部产品', count: PRODUCTS.length },
  { key: 'otc', label: 'OTC 与借贷', count: PRODUCTS.filter((p) => p.category === 'otc').length },
  { key: 'market-maker', label: '做市商', count: PRODUCTS.filter((p) => p.category === 'market-maker').length },
  { key: 'custody', label: '资产托管', count: PRODUCTS.filter((p) => p.category === 'custody').length },
  { key: 'api', label: 'API 与数据', count: PRODUCTS.filter((p) => p.category === 'api').length },
  { key: 'kyb', label: 'KYB 认证', count: 0 },
];

// ============== 工具函数 ==============

const formatCount = (n: number): string => {
  if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(2) + 'B';
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(2) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return n.toString();
};

const formatTime = (seconds: number): string => {
  if (seconds < 60) return `${seconds} 秒前`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)} 分钟前`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} 小时前`;
  return `${Math.floor(seconds / 86400)} 天前`;
};

// ============== 动画工具 ==============

const useCountUp = (target: number, duration: number = 1500, deps: any[] = []): number => {
  const [value, setValue] = useState(0);
  const startTimeRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    startTimeRef.current = null;
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    const animate = (timestamp: number) => {
      if (startTimeRef.current === null) startTimeRef.current = timestamp;
      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(target * eased);
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        setValue(target);
      }
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return value;
};

// ============== 状态徽章 ==============

const StatusBadge: React.FC<{ status: 'open' | 'beta' | 'soon' | 'private' }> = ({ status }) => {
  const config = {
    open: { label: '已开放', color: BRAND.success, bg: BRAND.successLt },
    beta: { label: '内测中', color: BRAND.amber, bg: BRAND.amberLt },
    soon: { label: '即将开放', color: BRAND.info, bg: BRAND.infoLt },
    private: { label: '需洽谈', color: BRAND.primary, bg: BRAND.primaryLt },
  }[status];

  return (
    <span
      className="text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider"
      style={{ backgroundColor: config.bg, color: config.color }}
    >
      {config.label}
    </span>
  );
};

// ============== 主组件 ==============

export function PortalInstitution() {
  // ============== State ==============
  const [productTab, setProductTab] = useState<ProductTab>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortKey, setSortKey] = useState<'name' | 'status'>('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [partnerFilter, setPartnerFilter] = useState<'all' | Partner['type']>('all');
  const [faqCategory, setFaqCategory] = useState<'all' | FAQItem['category']>('all');
  const [openFaqs, setOpenFaqs] = useState<Set<string>>(new Set(['faq-1']));
  const [drawer, setDrawer] = useState<DrawerState>({ open: false, type: null, payload: null });
  const [helpOpen, setHelpOpen] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  // 实时数据
  const [liveConnections, setLiveConnections] = useState(1842);
  const [liveLatency, setLiveLatency] = useState(0.8);
  const [liveOrders, setLiveOrders] = useState(234567);
  const [liveAum, setLiveAum] = useState(12400000000);
  const [liquidityData, setLiquidityData] = useState<LiquidityDataPoint[]>([]);

  // 初始化流动性数据
  useEffect(() => {
    const initial: LiquidityDataPoint[] = [];
    const now = Date.now();
    for (let i = 23; i >= 0; i--) {
      const time = new Date(now - i * 60 * 60 * 1000);
      const bid = 80 + Math.random() * 40;
      const ask = 80 + Math.random() * 40;
      const spread = Math.abs(bid - ask) * 0.05;
      const latency = 0.6 + Math.random() * 0.4;
      initial.push({
        time: `${time.getHours().toString().padStart(2, '0')}:00`,
        bidDepth: parseFloat(bid.toFixed(1)),
        askDepth: parseFloat(ask.toFixed(1)),
        spread: parseFloat(spread.toFixed(3)),
        latency: parseFloat(latency.toFixed(2)),
      });
    }
    setLiquidityData(initial);
  }, []);

  // 实时数据波动
  useEffect(() => {
    const interval = setInterval(() => {
      setLiveConnections((v) => Math.max(1500, v + Math.floor(Math.random() * 11) - 5));
      setLiveLatency((v) => Math.max(0.5, Math.min(1.5, v + (Math.random() - 0.5) * 0.1)));
      setLiveOrders((v) => v + Math.floor(Math.random() * 100));
      setLiveAum((v) => v + Math.floor(Math.random() * 1000000));
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  // 滚动监听
  useEffect(() => {
    const onScroll = () => setShowScrollTop(window.scrollY > 600);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // 快捷键
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput = ['INPUT', 'TEXTAREA'].includes(target.tagName);
      if (e.key === '/' && !isInput) {
        e.preventDefault();
        const searchInput = document.getElementById('institution-search');
        if (searchInput) (searchInput as HTMLInputElement).focus();
      }
      if (e.key === 'Escape') {
        if (drawer.open) setDrawer({ open: false, type: null, payload: null });
        if (helpOpen) setHelpOpen(false);
      }
      if ((e.key === '?' || (e.shiftKey && e.key === '/')) && !isInput) {
        e.preventDefault();
        setHelpOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [drawer.open, helpOpen]);

  // ============== Memo 数据 ==============

  const filteredProducts = useMemo(() => {
    let list = PRODUCTS;
    if (productTab !== 'all') list = list.filter((p) => p.category === productTab);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.shortDesc.toLowerCase().includes(q) ||
          p.bullets.some((b) => b.toLowerCase().includes(q))
      );
    }
    const sorted = [...list].sort((a, b) => {
      if (sortKey === 'name') return sortDir === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
      const order = { open: 0, beta: 1, soon: 2, private: 3 };
      return sortDir === 'asc' ? order[a.status] - order[b.status] : order[b.status] - order[a.status];
    });
    return sorted;
  }, [productTab, searchQuery, sortKey, sortDir]);

  const filteredPartners = useMemo(() => {
    if (partnerFilter === 'all') return PARTNERS;
    return PARTNERS.filter((p) => p.type === partnerFilter);
  }, [partnerFilter]);

  const filteredFaqs = useMemo(() => {
    if (faqCategory === 'all') return FAQS;
    return FAQS.filter((f) => f.category === faqCategory);
  }, [faqCategory]);

  // CountUp 数字
  const animAum = useCountUp(liveAum, 1200, [Math.floor(liveAum / 1000000)]);
  const animOrders = useCountUp(liveOrders, 1200, [Math.floor(liveOrders / 1000)]);

  // ============== Handlers ==============

  const openProductDrawer = useCallback((id: string) => {
    setDrawer({ open: true, type: 'product', payload: id });
  }, []);

  const openTierDrawer = useCallback((key: string) => {
    setDrawer({ open: true, type: 'tier', payload: key });
  }, []);

  const openApiDrawer = useCallback((id: string) => {
    setDrawer({ open: true, type: 'api', payload: id });
  }, []);

  const openPartnerDrawer = useCallback((id: string) => {
    setDrawer({ open: true, type: 'partner', payload: id });
  }, []);

  const openFlowStepDrawer = useCallback((id: string) => {
    setDrawer({ open: true, type: 'flow', payload: id });
  }, []);

  const closeDrawer = useCallback(() => {
    setDrawer({ open: false, type: null, payload: null });
  }, []);

  const toggleFaq = useCallback((id: string) => {
    setOpenFaqs((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const copyText = useCallback((text: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text).catch(() => {});
    }
  }, []);

  // 当前 drawer 内容
  const drawerProduct = drawer.type === 'product' ? PRODUCTS.find((p) => p.id === drawer.payload) : null;
  const drawerTier = drawer.type === 'tier' ? TIERS.find((t) => t.key === drawer.payload) : null;
  const drawerApi = drawer.type === 'api' ? API_CAPS.find((a) => a.id === drawer.payload) : null;
  const drawerPartner = drawer.type === 'partner' ? PARTNERS.find((p) => p.id === drawer.payload) : null;
  const drawerFlow = drawer.type === 'flow' ? FLOW_STEPS.find((s) => s.id === Number(drawer.payload)) : null;

  return (
    <div className="min-h-screen" style={{ backgroundColor: BRAND.bg, color: BRAND.text }}>
      {/* ============== Hero ============== */}
      <section className="relative pt-24 pb-16 px-6 overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(circle at 50% 30%, ${BRAND.primaryLt} 0%, transparent 50%)`,
          }}
        />
        <div className="max-w-7xl mx-auto relative z-10">
          <div
            className="inline-flex items-center gap-2 px-3 py-1 rounded mb-6"
            style={{ backgroundColor: BRAND.primaryLt, color: BRAND.primary, border: `1px solid ${BRAND.primary}33` }}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span className="text-[10px] font-bold tracking-wider uppercase">FOR INSTITUTIONAL CLIENTS ONLY</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4 leading-tight">
            全球机构级数字资产<br />
            <span style={{ color: BRAND.primary }}>交易基础设施</span>
          </h1>
          <p className="text-base max-w-2xl mb-8" style={{ color: BRAND.textSub }}>
            为基金、家族办公室、做市商及企业提供深度流动性、合规托管、OTC 大宗、做市返佣、API 量化等全方位机构级服务。
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => openProductDrawer('otc-spot')}
              className="px-6 py-3 rounded-lg font-bold text-sm transition-all hover:brightness-110"
              style={{ backgroundColor: BRAND.primaryContainer, color: BRAND.onPrimary, boxShadow: BRAND.shadowGold }}
            >
              申请机构账户
            </button>
            <button
              className="px-6 py-3 rounded-lg font-bold text-sm transition-all border"
              style={{ borderColor: BRAND.border, color: BRAND.text }}
            >
              下载服务白皮书
            </button>
          </div>
        </div>
      </section>

      {/* ============== 实时 KPI ============== */}
      <section className="px-6 -mt-6 relative z-20">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-3">
          <KpiCard
            icon={<Network className="w-4 h-4" />}
            label="活跃连接数"
            value={liveConnections.toLocaleString()}
            sub="机构专线"
            pulse
          />
          <KpiCard
            icon={<Gauge className="w-4 h-4" />}
            label="API 平均延迟"
            value={`${liveLatency.toFixed(2)} ms`}
            sub="WebSocket / FIX"
            pulse
          />
          <KpiCard
            icon={<Activity className="w-4 h-4" />}
            label="24h 机构订单"
            value={formatCount(Math.floor(animOrders))}
            sub="做市 + OTC + 现货"
            pulse
          />
          <KpiCard
            icon={<Wallet className="w-4 h-4" />}
            label="托管 AUM"
            value={`$${formatCount(Math.floor(animAum))}`}
            sub="机构资产规模"
            pulse
          />
        </div>
      </section>

      {/* ============== 产品矩阵 ============== */}
      <section className="px-6 py-16">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-end justify-between mb-6">
            <div>
              <h2 className="text-2xl md:text-3xl font-extrabold mb-2">机构产品矩阵</h2>
              <p style={{ color: BRAND.textSub }} className="text-sm">
                从 OTC 大宗到 API 量化，全方位机构级服务
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs" style={{ color: BRAND.textMute }}>
              <Keyboard className="w-3.5 h-3.5" />
              <span>按 / 搜索 · ? 查看快捷键</span>
            </div>
          </div>

          {/* 搜索 + 排序 */}
          <div className="flex flex-col md:flex-row gap-3 mb-4">
            <div className="flex-1 relative">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
                style={{ color: BRAND.textMute }}
              />
              <input
                id="institution-search"
                type="text"
                placeholder="搜索产品（如：OTC / 托管 / 借贷）"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg text-sm focus:outline-none transition-all"
                style={{
                  backgroundColor: BRAND.bgCard,
                  border: `1px solid ${BRAND.border}`,
                  color: BRAND.text,
                }}
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setSortKey('name');
                  setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
                }}
                className="px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-1 transition-all"
                style={{ backgroundColor: BRAND.bgCard, color: BRAND.textSub, border: `1px solid ${BRAND.border}` }}
              >
                名称 {sortKey === 'name' && (sortDir === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
              </button>
              <button
                onClick={() => {
                  setSortKey('status');
                  setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
                }}
                className="px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-1 transition-all"
                style={{ backgroundColor: BRAND.bgCard, color: BRAND.textSub, border: `1px solid ${BRAND.border}` }}
              >
                状态 {sortKey === 'status' && (sortDir === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex flex-wrap gap-2 mb-6">
            {PRODUCT_CATEGORIES.map((cat) => (
              <button
                key={cat.key}
                onClick={() => setProductTab(cat.key)}
                className="px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5"
                style={{
                  backgroundColor: productTab === cat.key ? BRAND.primaryLt : BRAND.bgCard,
                  color: productTab === cat.key ? BRAND.primary : BRAND.textSub,
                  border: `1px solid ${productTab === cat.key ? BRAND.primary : BRAND.border}`,
                }}
              >
                {cat.label}
                <span
                  className="text-[10px] px-1.5 py-0.5 rounded"
                  style={{
                    backgroundColor: productTab === cat.key ? BRAND.primary : BRAND.bgCardHover,
                    color: productTab === cat.key ? BRAND.onPrimary : BRAND.textMute,
                  }}
                >
                  {cat.count}
                </span>
              </button>
            ))}
          </div>

          {/* 产品网格 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProducts.map((product, idx) => (
              <div
                key={product.id}
                onClick={() => openProductDrawer(product.id)}
                className="group p-5 rounded-2xl cursor-pointer transition-all hover:scale-[1.01]"
                style={{
                  backgroundColor: BRAND.bgCard,
                  border: `1px solid ${BRAND.border}`,
                  boxShadow: BRAND.shadow,
                  animation: `fadeInUp 0.4s ease-out ${idx * 0.05}s both`,
                }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: BRAND.primaryLt }}
                  >
                    {product.category === 'otc' && <Banknote className="w-5 h-5" style={{ color: BRAND.primary }} />}
                    {product.category === 'market-maker' && <Activity className="w-5 h-5" style={{ color: BRAND.primary }} />}
                    {product.category === 'custody' && <Shield className="w-5 h-5" style={{ color: BRAND.primary }} />}
                    {product.category === 'api' && <Code2 className="w-5 h-5" style={{ color: BRAND.primary }} />}
                  </div>
                  <StatusBadge status={product.status} />
                </div>
                <h3 className="text-base font-bold mb-2">{product.name}</h3>
                <p className="text-xs mb-3 leading-relaxed" style={{ color: BRAND.textSub }}>
                  {product.shortDesc}
                </p>
                <div
                  className="text-[10px] font-bold mb-3 px-2 py-1 rounded inline-block"
                  style={{ backgroundColor: BRAND.primaryLt, color: BRAND.primary }}
                >
                  {product.highlight}
                </div>
                <div className="grid grid-cols-2 gap-2 pt-3" style={{ borderTop: `1px solid ${BRAND.border}` }}>
                  {product.metrics.slice(0, 4).map((m, i) => (
                    <div key={i}>
                      <div className="text-[10px]" style={{ color: BRAND.textMute }}>
                        {m.label}
                      </div>
                      <div className="text-sm font-bold font-mono" style={{ color: BRAND.text }}>
                        {m.value}
                        {m.unit && <span className="text-[10px] ml-0.5" style={{ color: BRAND.textMute }}>{m.unit}</span>}
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  className="mt-4 w-full py-2 rounded-md text-xs font-bold transition-all flex items-center justify-center gap-1.5 group-hover:gap-2.5"
                  style={{ backgroundColor: BRAND.bgCardHover, color: BRAND.textSub, border: `1px solid ${BRAND.border}` }}
                >
                  {product.ctaLabel} <ChevR className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>

          {filteredProducts.length === 0 && (
            <div
              className="text-center py-12 rounded-2xl"
              style={{ backgroundColor: BRAND.bgCard, border: `1px solid ${BRAND.border}` }}
            >
              <p className="text-sm" style={{ color: BRAND.textMute }}>
                未找到匹配的产品，请尝试其他搜索词
              </p>
            </div>
          )}
        </div>
      </section>

      {/* ============== 服务等级 ============== */}
      <section className="px-6 py-16" style={{ backgroundColor: BRAND.bg }}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-extrabold mb-2">服务等级</h2>
            <p className="text-sm" style={{ color: BRAND.textSub }}>
              4 大客户分层 · 按规模与需求匹配最合适的服务方案
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {TIERS.map((tier) => (
              <div
                key={tier.key}
                onClick={() => openTierDrawer(tier.key)}
                className="p-6 rounded-2xl cursor-pointer transition-all hover:scale-[1.02] relative"
                style={{
                  backgroundColor: tier.highlight ? BRAND.primaryLt : BRAND.bgCard,
                  border: `1px solid ${tier.highlight ? BRAND.primary : BRAND.border}`,
                  boxShadow: tier.highlight ? BRAND.shadowGold : BRAND.shadow,
                }}
              >
                {tier.badge && (
                  <div
                    className="absolute -top-2 right-4 px-2 py-0.5 rounded text-[10px] font-bold"
                    style={{
                      backgroundColor: tier.highlight ? BRAND.primary : BRAND.bgCardElevated,
                      color: tier.highlight ? BRAND.onPrimary : BRAND.text,
                      border: tier.highlight ? 'none' : `1px solid ${BRAND.border}`,
                    }}
                  >
                    {tier.badge}
                  </div>
                )}
                <h3 className="text-lg font-bold mb-1">{tier.name}</h3>
                <p className="text-xs mb-4" style={{ color: BRAND.textSub }}>
                  {tier.description}
                </p>
                <div className="mb-4">
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-extrabold" style={{ color: tier.highlight ? BRAND.primary : BRAND.text }}>
                      {tier.price === '面议' ? tier.price : `$${tier.price}`}
                    </span>
                  </div>
                  <div className="text-[10px] mt-1" style={{ color: BRAND.textMute }}>
                    {tier.priceUnit}
                  </div>
                </div>
                <div className="text-[10px] font-bold mb-2 uppercase tracking-wider" style={{ color: BRAND.textMute }}>
                  {tier.targetAudience}
                </div>
                <ul className="space-y-1.5 mb-4">
                  {tier.perks.slice(0, 4).map((perk, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs" style={{ color: BRAND.textSub }}>
                      <CheckCircle2 className="w-3 h-3 mt-0.5 flex-shrink-0" style={{ color: BRAND.success }} />
                      <span>{perk}</span>
                    </li>
                  ))}
                  {tier.perks.length > 4 && (
                    <li className="text-[10px]" style={{ color: BRAND.textMute }}>
                      + {tier.perks.length - 4} 项更多权益
                    </li>
                  )}
                </ul>
                <button
                  className="w-full py-2 rounded-md text-xs font-bold transition-all"
                  style={{
                    backgroundColor: tier.highlight ? BRAND.primary : BRAND.bgCardHover,
                    color: tier.highlight ? BRAND.onPrimary : BRAND.text,
                    border: tier.highlight ? 'none' : `1px solid ${BRAND.border}`,
                  }}
                >
                  查看详情
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============== 实时流动性数据 ============== */}
      <section className="px-6 py-16">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-end justify-between mb-6">
            <div>
              <h2 className="text-2xl md:text-3xl font-extrabold mb-2">全球流动性实时数据</h2>
              <p className="text-sm" style={{ color: BRAND.textSub }}>
                24 小时滚动深度 + 延迟 + 点差 · 数据每 3 秒刷新
              </p>
            </div>
            <div
              className="px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-2"
              style={{ backgroundColor: BRAND.successLt, color: BRAND.success }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full animate-pulse"
                style={{ backgroundColor: BRAND.success }}
              />
              实时
            </div>
          </div>

          <div
            className="p-6 rounded-2xl"
            style={{ backgroundColor: BRAND.bgCard, border: `1px solid ${BRAND.border}` }}
          >
            {/* 简化的柱状图 */}
            <div className="space-y-2 mb-4">
              <div className="text-[10px] font-bold uppercase tracking-wider" style={{ color: BRAND.textMute }}>
                订单簿深度（最近 24 小时）
              </div>
              <div className="grid grid-cols-24 gap-1 h-32">
                {liquidityData.map((d, i) => (
                  <div key={i} className="flex flex-col justify-end gap-0.5 group relative">
                    <div
                      className="rounded-t"
                      style={{
                        height: `${(d.bidDepth / 120) * 100}%`,
                        backgroundColor: BRAND.success,
                        opacity: 0.7,
                      }}
                    />
                    <div
                      className="rounded-b"
                      style={{
                        height: `${(d.askDepth / 120) * 100}%`,
                        backgroundColor: BRAND.danger,
                        opacity: 0.7,
                      }}
                    />
                    {/* tooltip */}
                    <div
                      className="absolute -top-12 left-1/2 -translate-x-1/2 px-2 py-1 rounded text-[10px] whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none z-10"
                      style={{ backgroundColor: BRAND.cardElevated, color: BRAND.text, border: `1px solid ${BRAND.border}` }}
                    >
                      {d.time} · Bid {d.bidDepth}M · Ask {d.askDepth}M
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between text-[10px]" style={{ color: BRAND.textMute }}>
                <span>24h 前</span>
                <span>12h 前</span>
                <span>现在</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 pt-4" style={{ borderTop: `1px solid ${BRAND.border}` }}>
              <div>
                <div className="text-[10px] font-bold uppercase mb-1" style={{ color: BRAND.textMute }}>
                  Bid 深度
                </div>
                <div className="text-lg font-bold font-mono" style={{ color: BRAND.success }}>
                  {liquidityData[liquidityData.length - 1]?.bidDepth.toFixed(1) || '--'}M
                </div>
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase mb-1" style={{ color: BRAND.textMute }}>
                  Ask 深度
                </div>
                <div className="text-lg font-bold font-mono" style={{ color: BRAND.danger }}>
                  {liquidityData[liquidityData.length - 1]?.askDepth.toFixed(1) || '--'}M
                </div>
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase mb-1" style={{ color: BRAND.textMute }}>
                  实时点差
                </div>
                <div className="text-lg font-bold font-mono" style={{ color: BRAND.text }}>
                  {liquidityData[liquidityData.length - 1]?.spread.toFixed(3) || '--'}%
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============== API 能力 ============== */}
      <section className="px-6 py-16">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <h2 className="text-2xl md:text-3xl font-extrabold mb-2">API 量化能力</h2>
            <p className="text-sm" style={{ color: BRAND.textSub }}>
              4 协议 · 5 语言 SDK · 99.99% SLA · 沙盒测试网
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {API_CAPS.map((api) => (
              <div
                key={api.id}
                onClick={() => openApiDrawer(api.id)}
                className="p-5 rounded-2xl cursor-pointer transition-all hover:scale-[1.02]"
                style={{ backgroundColor: BRAND.bgCard, border: `1px solid ${BRAND.border}` }}
              >
                <div className="flex items-center justify-between mb-3">
                  <div
                    className="text-[10px] font-bold tracking-wider px-2 py-0.5 rounded"
                    style={{ backgroundColor: BRAND.primaryLt, color: BRAND.primary }}
                  >
                    {api.protocol}
                  </div>
                  <StatusBadge status={api.status} />
                </div>
                <h3 className="text-sm font-bold mb-1">{api.name}</h3>
                <p className="text-[10px] mb-3 leading-relaxed" style={{ color: BRAND.textSub }}>
                  {api.description}
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <div className="text-[9px]" style={{ color: BRAND.textMute }}>延迟</div>
                    <div className="text-xs font-bold font-mono" style={{ color: BRAND.text }}>{api.latency}</div>
                  </div>
                  <div>
                    <div className="text-[9px]" style={{ color: BRAND.textMute }}>吞吐</div>
                    <div className="text-xs font-bold font-mono" style={{ color: BRAND.text }}>{api.throughput}</div>
                  </div>
                  <div>
                    <div className="text-[9px]" style={{ color: BRAND.textMute }}>端点</div>
                    <div className="text-xs font-bold font-mono" style={{ color: BRAND.text }}>{api.endpoints}</div>
                  </div>
                  <div>
                    <div className="text-[9px]" style={{ color: BRAND.textMute }}>特性</div>
                    <div className="text-xs font-bold font-mono" style={{ color: BRAND.text }}>{api.features.length}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============== KYB 流程 ============== */}
      <section className="px-6 py-16" style={{ backgroundColor: BRAND.bg }}>
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <h2 className="text-2xl md:text-3xl font-extrabold mb-2">KYB 企业认证流程</h2>
            <p className="text-sm" style={{ color: BRAND.textSub }}>
              5 步流程 · 5-10 个工作日 · 全程线上提交
            </p>
          </div>

          {/* 流程时间线 */}
          <div className="relative mb-6">
            <div
              className="absolute left-6 top-0 bottom-0 w-px"
              style={{ background: `linear-gradient(to bottom, ${BRAND.primary}, ${BRAND.border})` }}
            />
            <div className="space-y-3">
              {FLOW_STEPS.map((step) => (
                <div
                  key={step.id}
                  onClick={() => openFlowStepDrawer(String(step.id))}
                  className="relative pl-16 pr-4 py-4 rounded-xl cursor-pointer transition-all hover:scale-[1.005]"
                  style={{ backgroundColor: BRAND.bgCard, border: `1px solid ${BRAND.border}` }}
                >
                  <div
                    className="absolute left-3 top-4 w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs"
                    style={{
                      backgroundColor: step.status === 'auto' ? BRAND.primary : step.status === 'manual' ? BRAND.amber : BRAND.info,
                      color: BRAND.onPrimary,
                    }}
                  >
                    {step.id}
                  </div>
                  <div className="flex items-start justify-between mb-1">
                    <h3 className="text-sm font-bold">{step.title}</h3>
                    <div
                      className="text-[10px] font-bold px-2 py-0.5 rounded"
                      style={{ backgroundColor: BRAND.bgCardHover, color: BRAND.textMute }}
                    >
                      {step.estimate}
                    </div>
                  </div>
                  <p className="text-xs leading-relaxed" style={{ color: BRAND.textSub }}>
                    {step.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* 所需材料 */}
          <div
            className="p-6 rounded-2xl"
            style={{ backgroundColor: BRAND.bgCard, border: `1px solid ${BRAND.border}` }}
          >
            <div className="flex items-center gap-2 mb-4">
              <FileText className="w-4 h-4" style={{ color: BRAND.primary }} />
              <h3 className="text-sm font-bold">所需材料清单</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {FLOW_DOCS.map((doc) => (
                <div
                  key={doc.type}
                  className="p-3 rounded-lg flex items-center justify-between"
                  style={{ backgroundColor: BRAND.bgCardHover, border: `1px solid ${BRAND.border}` }}
                >
                  <div className="flex items-center gap-2">
                    {doc.required ? (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ backgroundColor: BRAND.dangerLt, color: BRAND.danger }}>
                        必
                      </span>
                    ) : (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ backgroundColor: BRAND.bgCardHover, color: BRAND.textMute }}>
                        选
                      </span>
                    )}
                    <span className="text-xs">{doc.name}</span>
                  </div>
                  <span className="text-[10px]" style={{ color: BRAND.textMute }}>
                    {doc.estimate}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ============== 合作伙伴 ============== */}
      <section className="px-6 py-16">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-end justify-between mb-6">
            <div>
              <h2 className="text-2xl md:text-3xl font-extrabold mb-2">全球服务伙伴</h2>
              <p className="text-sm" style={{ color: BRAND.textSub }}>
                银行 · 审计 · 合规科技 · 律所 · 托管 · 数据
              </p>
            </div>
            <div className="text-xs" style={{ color: BRAND.textMute }}>
              共 {PARTNERS.length} 家机构
            </div>
          </div>

          {/* 过滤 */}
          <div className="flex flex-wrap gap-2 mb-4">
            {[
              { key: 'all', label: '全部', count: PARTNERS.length },
              { key: 'banking', label: '银行', count: PARTNERS.filter((p) => p.type === 'banking').length },
              { key: 'audit', label: '审计', count: PARTNERS.filter((p) => p.type === 'audit').length },
              { key: 'legal', label: '律所', count: PARTNERS.filter((p) => p.type === 'legal').length },
              { key: 'tech', label: '合规科技', count: PARTNERS.filter((p) => p.type === 'tech').length },
              { key: 'custody', label: '托管', count: PARTNERS.filter((p) => p.type === 'custody').length },
              { key: 'data', label: '数据', count: PARTNERS.filter((p) => p.type === 'data').length },
            ].map((f) => (
              <button
                key={f.key}
                onClick={() => setPartnerFilter(f.key as any)}
                className="px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5"
                style={{
                  backgroundColor: partnerFilter === f.key ? BRAND.primaryLt : BRAND.bgCard,
                  color: partnerFilter === f.key ? BRAND.primary : BRAND.textSub,
                  border: `1px solid ${partnerFilter === f.key ? BRAND.primary : BRAND.border}`,
                }}
              >
                {f.label}
                <span
                  className="text-[10px] px-1.5 py-0.5 rounded"
                  style={{
                    backgroundColor: partnerFilter === f.key ? BRAND.primary : BRAND.bgCardHover,
                    color: partnerFilter === f.key ? BRAND.onPrimary : BRAND.textMute,
                  }}
                >
                  {f.count}
                </span>
              </button>
            ))}
          </div>

          {/* 伙伴网格 */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {filteredPartners.map((p, idx) => (
              <div
                key={p.id}
                onClick={() => openPartnerDrawer(p.id)}
                className="p-4 rounded-xl cursor-pointer transition-all hover:scale-[1.02]"
                style={{
                  backgroundColor: BRAND.bgCard,
                  border: `1px solid ${BRAND.border}`,
                  animation: `fadeInUp 0.3s ease-out ${idx * 0.02}s both`,
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <div
                    className="w-7 h-7 rounded flex items-center justify-center"
                    style={{ backgroundColor: BRAND.primaryLt }}
                  >
                    {p.type === 'banking' && <Building2 className="w-3.5 h-3.5" style={{ color: BRAND.primary }} />}
                    {p.type === 'audit' && <FileText className="w-3.5 h-3.5" style={{ color: BRAND.primary }} />}
                    {p.type === 'legal' && <BookOpen className="w-3.5 h-3.5" style={{ color: BRAND.primary }} />}
                    {p.type === 'tech' && <Cpu className="w-3.5 h-3.5" style={{ color: BRAND.primary }} />}
                    {p.type === 'custody' && <Shield className="w-3.5 h-3.5" style={{ color: BRAND.primary }} />}
                    {p.type === 'data' && <Database className="w-3.5 h-3.5" style={{ color: BRAND.primary }} />}
                  </div>
                  <span
                    className="text-[9px] font-bold px-1.5 py-0.5 rounded uppercase"
                    style={{ backgroundColor: BRAND.bgCardHover, color: BRAND.textMute }}
                  >
                    {p.region}
                  </span>
                </div>
                <h4 className="text-sm font-bold mb-1 truncate">{p.name}</h4>
                <p className="text-[10px] line-clamp-2 leading-relaxed" style={{ color: BRAND.textSub }}>
                  {p.serviceScope}
                </p>
                <div className="text-[10px] mt-2" style={{ color: BRAND.textMute }}>
                  自 {p.since} 年合作
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============== FAQ ============== */}
      <section className="px-6 py-16" style={{ backgroundColor: BRAND.bg }}>
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-extrabold mb-2">常见问题</h2>
            <p className="text-sm" style={{ color: BRAND.textSub }}>
              6 大主题 · 12 个高频问题
            </p>
          </div>

          {/* 分类过滤 */}
          <div className="flex flex-wrap gap-2 mb-4 justify-center">
            {[
              { key: 'all', label: '全部' },
              { key: 'qualification', label: '机构资质' },
              { key: 'kyb', label: 'KYB' },
              { key: 'service', label: '服务' },
              { key: 'fee', label: '费率' },
              { key: 'tech', label: '技术' },
              { key: 'risk', label: '风控' },
            ].map((c) => (
              <button
                key={c.key}
                onClick={() => setFaqCategory(c.key as any)}
                className="px-3 py-1.5 rounded-md text-xs font-bold transition-all"
                style={{
                  backgroundColor: faqCategory === c.key ? BRAND.primaryLt : BRAND.bgCard,
                  color: faqCategory === c.key ? BRAND.primary : BRAND.textSub,
                  border: `1px solid ${faqCategory === c.key ? BRAND.primary : BRAND.border}`,
                }}
              >
                {c.label}
              </button>
            ))}
          </div>

          {/* FAQ 列表 */}
          <div className="space-y-2">
            {filteredFaqs.map((faq) => {
              const isOpen = openFaqs.has(faq.id);
              return (
                <div
                  key={faq.id}
                  className="rounded-xl overflow-hidden transition-all"
                  style={{ backgroundColor: BRAND.bgCard, border: `1px solid ${BRAND.border}` }}
                >
                  <button
                    onClick={() => toggleFaq(faq.id)}
                    className="w-full px-4 py-3 flex items-center justify-between gap-3 text-left"
                  >
                    <div className="flex items-center gap-2 flex-1">
                      <HelpCircle className="w-4 h-4 flex-shrink-0" style={{ color: BRAND.primary }} />
                      <span className="text-sm font-bold">{faq.question}</span>
                    </div>
                    {isOpen ? (
                      <ChevronUp className="w-4 h-4 flex-shrink-0" style={{ color: BRAND.textMute }} />
                    ) : (
                      <ChevronDown className="w-4 h-4 flex-shrink-0" style={{ color: BRAND.textMute }} />
                    )}
                  </button>
                  {isOpen && (
                    <div className="px-4 pb-4 text-xs leading-relaxed" style={{ color: BRAND.textSub }}>
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ============== 底部 CTA ============== */}
      <section className="px-6 py-16">
        <div
          className="max-w-5xl mx-auto p-8 md:p-12 rounded-3xl text-center"
          style={{
            background: `linear-gradient(135deg, ${BRAND.bgCard} 0%, ${BRAND.bgCardHover} 100%)`,
            border: `1px solid ${BRAND.border}`,
            boxShadow: BRAND.shadowLg,
          }}
        >
          <div
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-4"
            style={{ backgroundColor: BRAND.primaryLt, color: BRAND.primary }}
          >
            <Sparkle className="w-3.5 h-3.5" />
            <span className="text-xs font-bold">需要专属定制方案？</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold mb-3">
            联系专属机构服务经理
          </h2>
          <p className="text-sm mb-6 max-w-2xl mx-auto" style={{ color: BRAND.textSub }}>
            我们的机构服务团队将在 1 个工作日内回复，为您定制专属方案
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <button
              className="px-6 py-3 rounded-lg font-bold text-sm transition-all hover:brightness-110 flex items-center gap-2"
              style={{ backgroundColor: BRAND.primaryContainer, color: BRAND.onPrimary, boxShadow: BRAND.shadowGold }}
            >
              <MessageCircle className="w-4 h-4" /> 在线咨询
            </button>
            <button
              className="px-6 py-3 rounded-lg font-bold text-sm transition-all border flex items-center gap-2"
              style={{ borderColor: BRAND.border, color: BRAND.text }}
            >
              <Mail className="w-4 h-4" /> 发送邮件
            </button>
            <button
              className="px-6 py-3 rounded-lg font-bold text-sm transition-all border flex items-center gap-2"
              style={{ borderColor: BRAND.border, color: BRAND.text }}
            >
              <Phone className="w-4 h-4" /> 电话沟通
            </button>
          </div>
        </div>
      </section>

      {/* ============== Drawer ============== */}
      {drawer.open && (
        <div
          className="fixed inset-0 z-[100] flex justify-end"
          onClick={closeDrawer}
          style={{ backgroundColor: 'rgba(0,0,0,0.75)' }}
        >
          <div
            className="w-full max-w-2xl h-full overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: BRAND.bgCard,
              borderLeft: `1px solid ${BRAND.border}`,
              boxShadow: BRAND.shadowLg,
              animation: 'slideInRight 0.3s ease-out',
            }}
          >
            <div className="sticky top-0 z-10 px-6 py-4 flex items-center justify-between" style={{ backgroundColor: BRAND.bgCard, borderBottom: `1px solid ${BRAND.border}` }}>
              <h3 className="text-base font-bold">
                {drawerProduct?.name || drawerTier?.name || drawerApi?.name || drawerPartner?.name || drawerFlow?.title || '详情'}
              </h3>
              <button onClick={closeDrawer} className="p-1 rounded" style={{ color: BRAND.textSub }}>
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {drawerProduct && (
                <>
                  <p className="text-sm" style={{ color: BRAND.textSub }}>{drawerProduct.shortDesc}</p>
                  <div className="grid grid-cols-2 gap-3">
                    {drawerProduct.metrics.map((m, i) => (
                      <div key={i} className="p-3 rounded-lg" style={{ backgroundColor: BRAND.bgCardHover, border: `1px solid ${BRAND.border}` }}>
                        <div className="text-[10px]" style={{ color: BRAND.textMute }}>{m.label}</div>
                        <div className="text-lg font-bold font-mono" style={{ color: BRAND.text }}>{m.value}</div>
                      </div>
                    ))}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: BRAND.textMute }}>核心特性</h4>
                    <ul className="space-y-2">
                      {drawerProduct.bullets.map((b, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs" style={{ color: BRAND.textSub }}>
                          <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" style={{ color: BRAND.success }} />
                          <span>{b}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </>
              )}

              {drawerTier && (
                <>
                  <p className="text-sm" style={{ color: BRAND.textSub }}>{drawerTier.description}</p>
                  <div>
                    <div className="text-3xl font-extrabold" style={{ color: BRAND.primary }}>
                      {drawerTier.price === '面议' ? drawerTier.price : `$${drawerTier.price}`}
                    </div>
                    <div className="text-xs" style={{ color: BRAND.textMute }}>{drawerTier.priceUnit}</div>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: BRAND.textMute }}>适用客户</h4>
                    <p className="text-sm">{drawerTier.targetAudience}</p>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: BRAND.textMute }}>完整权益</h4>
                    <ul className="space-y-2">
                      {drawerTier.perks.map((p, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs" style={{ color: BRAND.textSub }}>
                          <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" style={{ color: BRAND.success }} />
                          <span>{p}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </>
              )}

              {drawerApi && (
                <>
                  <p className="text-sm" style={{ color: BRAND.textSub }}>{drawerApi.description}</p>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.bgCardHover, border: `1px solid ${BRAND.border}` }}>
                      <div className="text-[10px]" style={{ color: BRAND.textMute }}>延迟</div>
                      <div className="text-base font-bold font-mono" style={{ color: BRAND.text }}>{drawerApi.latency}</div>
                    </div>
                    <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.bgCardHover, border: `1px solid ${BRAND.border}` }}>
                      <div className="text-[10px]" style={{ color: BRAND.textMute }}>吞吐</div>
                      <div className="text-base font-bold font-mono" style={{ color: BRAND.text }}>{drawerApi.throughput}</div>
                    </div>
                    <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.bgCardHover, border: `1px solid ${BRAND.border}` }}>
                      <div className="text-[10px]" style={{ color: BRAND.textMute }}>端点</div>
                      <div className="text-base font-bold font-mono" style={{ color: BRAND.text }}>{drawerApi.endpoints}</div>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: BRAND.textMute }}>特性</h4>
                    <div className="flex flex-wrap gap-2">
                      {drawerApi.features.map((f, i) => (
                        <span
                          key={i}
                          className="text-[10px] font-bold px-2 py-1 rounded"
                          style={{ backgroundColor: BRAND.primaryLt, color: BRAND.primary }}
                        >
                          {f}
                        </span>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {drawerPartner && (
                <>
                  <p className="text-sm" style={{ color: BRAND.textSub }}>{drawerPartner.serviceScope}</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.bgCardHover, border: `1px solid ${BRAND.border}` }}>
                      <div className="text-[10px]" style={{ color: BRAND.textMute }}>合作类型</div>
                      <div className="text-sm font-bold capitalize">{drawerPartner.type}</div>
                    </div>
                    <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.bgCardHover, border: `1px solid ${BRAND.border}` }}>
                      <div className="text-[10px]" style={{ color: BRAND.textMute }}>区域</div>
                      <div className="text-sm font-bold uppercase">{drawerPartner.region}</div>
                    </div>
                    <div className="p-3 rounded-lg col-span-2" style={{ backgroundColor: BRAND.bgCardHover, border: `1px solid ${BRAND.border}` }}>
                      <div className="text-[10px]" style={{ color: BRAND.textMute }}>合作开始</div>
                      <div className="text-sm font-bold">{drawerPartner.since} 年</div>
                    </div>
                  </div>
                </>
              )}

              {drawerFlow && (
                <>
                  <p className="text-sm" style={{ color: BRAND.textSub }}>{drawerFlow.description}</p>
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: BRAND.textMute }}>详细说明</h4>
                    <ul className="space-y-2">
                      {drawerFlow.details.map((d, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs" style={{ color: BRAND.textSub }}>
                          <ChevR className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" style={{ color: BRAND.primary }} />
                          <span>{d}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: BRAND.textMute }}>必备材料</h4>
                    <div className="flex flex-wrap gap-2">
                      {drawerFlow.required.map((r, i) => (
                        <span
                          key={i}
                          className="text-[10px] font-bold px-2 py-1 rounded"
                          style={{ backgroundColor: BRAND.dangerLt, color: BRAND.danger }}
                        >
                          {r}
                        </span>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ============== 快捷键帮助 ============== */}
      {helpOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-6"
          onClick={() => setHelpOpen(false)}
          style={{ backgroundColor: 'rgba(0,0,0,0.75)' }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-w-md w-full p-6 rounded-2xl"
            style={{ backgroundColor: BRAND.bgCard, border: `1px solid ${BRAND.border}` }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold flex items-center gap-2">
                <Keyboard className="w-4 h-4" style={{ color: BRAND.primary }} />
                快捷键
              </h3>
              <button onClick={() => setHelpOpen(false)}>
                <X className="w-5 h-5" style={{ color: BRAND.textSub }} />
              </button>
            </div>
            <div className="space-y-2">
              {[
                { key: '/', desc: '聚焦搜索框' },
                { key: '?', desc: '打开/关闭快捷键帮助' },
                { key: 'Esc', desc: '关闭抽屉 / 帮助' },
              ].map((kb, i) => (
                <div key={i} className="flex items-center justify-between p-2 rounded" style={{ backgroundColor: BRAND.bgCardHover }}>
                  <span className="text-xs" style={{ color: BRAND.textSub }}>{kb.desc}</span>
                  <kbd
                    className="text-[10px] font-mono font-bold px-2 py-0.5 rounded"
                    style={{ backgroundColor: BRAND.bgCard, color: BRAND.text, border: `1px solid ${BRAND.border}` }}
                  >
                    {kb.key}
                  </kbd>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ============== 回到顶部 ============== */}
      {showScrollTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-6 right-6 z-50 w-10 h-10 rounded-full flex items-center justify-center transition-all hover:scale-110"
          style={{ backgroundColor: BRAND.primary, color: BRAND.onPrimary, boxShadow: BRAND.shadowLg }}
        >
          <ChevronUp className="w-5 h-5" />
        </button>
      )}

      {/* ============== 全局样式 ============== */}
      <style jsx global>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        .grid-cols-24 { grid-template-columns: repeat(24, minmax(0, 1fr)); }
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
}

// ============== KPI Card 子组件 ==============

interface KpiCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  pulse?: boolean;
}

const KpiCard: React.FC<KpiCardProps> = ({ icon, label, value, sub, pulse }) => {
  return (
    <div
      className="p-4 rounded-xl relative overflow-hidden"
      style={{ backgroundColor: BRAND.bgCard, border: `1px solid ${BRAND.border}` }}
    >
      {pulse && (
        <div
          className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full"
          style={{
            backgroundColor: BRAND.success,
            animation: 'pulse 1.5s ease-in-out infinite',
          }}
        />
      )}
      <div className="flex items-center gap-2 mb-2">
        <div style={{ color: BRAND.primary }}>{icon}</div>
        <div className="text-[10px] font-bold uppercase tracking-wider" style={{ color: BRAND.textMute }}>
          {label}
        </div>
      </div>
      <div className="text-xl font-extrabold font-mono" style={{ color: BRAND.text }}>
        {value}
      </div>
      {sub && (
        <div className="text-[10px] mt-1" style={{ color: BRAND.textSub }}>
          {sub}
        </div>
      )}
    </div>
  );
};
