'use client';

/**
 * PortalCompliance - 合规与透明度研究中心（2026-07-19 Q05 P3.14）
 *
 * 页面定位：
 * - 中萨数字科技交易所合规与透明度研究中心
 * - 全球合规研究方向 / AML/CFT 政策 / 风险管理框架 / 隐私与数据保护 / 服务条款 / 合规公告 / 合作伙伴
 * - 严格的合规化表达：仅使用"合规研究方向"、"国际化合规观察方向"、"重点市场与合规研究方向"等中性表述
 *
 * L4 工业级设计标准：
 * - 暗色 v6 纯黑 #000000 + 卡片 #141414 + ZSDEX 绿 primary #14B881
 * - 9 大区块：Hero / 实时 KPI / 全球合规研究方向 / AML 政策 / 风险管理 / 隐私保护与服务条款 / 合规公告 / 合作伙伴研究网络 / 用户教育工具 / 底部 CTA
 * - 8+ 交互：搜索 / 排序 / Tab / 区域过滤 / 详情 Drawer / 文档切换 / 快捷键 / 实时过滤
 * - 4+ Drawer：司法管辖区详情 / 政策详情 / 风险案例 / 公告详情
 * - 4+ 实时数据：合规评分 / 政策更新数 / 风险监测 / 监管动态
 * - 4+ 动画：Stagger / CountUp / Hover / Pulse
 *
 * 合规要点（Q05 硬约束）：
 * - 不接真实 API，所有司法管辖区 / 政策 / 案例使用 mock 占位
 * - 状态徽章统一使用 STATUS 枚举
 * - 不修改旧官网 / 旧 H5 / disabled pages
 * - 严格规避任何高风险合规词，相关地区仅表达为研究方向/观察方向
 * - 各地区仅表达为"重点市场与合规研究方向"或"国际化合规观察方向"
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
  Shield,
  ShieldCheck,
  FileText,
  Lock,
  Eye,
  AlertTriangle,
  CheckCircle2,
  Gavel,
  Policy,
  Scale,
  Building2,
  Globe2,
  BookOpen,
  Award,
  Sparkles,
  ArrowUpRight,
  ArrowDownLeft,
  Copy,
  ExternalLink,
  Clock,
  TrendingUp,
  TrendingDown,
  Activity,
  Users,
  Hash,
  Network,
  Database,
  Cpu,
  Server,
  Cloud,
  KeyRound,
  Fingerprint,
  ScanFace,
  Wallet,
  Coins,
  Layers,
  Plus,
  Minus,
  Keyboard,
  HelpCircle,
  Phone,
  Mail,
  MessageCircle,
  Code2,
  Briefcase,
  Compass,
  Map,
  Flag,
  MapPin,
} from 'lucide-react';
import { BRAND, STATUS } from './brand';

// ============== 类型 ==============

type RegionKey = 'apac' | 'emea' | 'americas' | 'global' | 'mena';
type PolicyKey = 'aml' | 'kyc' | 'kyb' | 'sanctions' | 'pep' | 'sof' | 'travel-rule' | 'tax';
type RiskKey = 'market' | 'operational' | 'cyber' | 'counterparty' | 'liquidity' | 'compliance' | 'concentration';
type DocType = 'terms' | 'privacy' | 'aml-policy' | 'risk-framework' | 'cookie' | 'tax' | 'data-protection';
type Tab = 'overview' | 'policy' | 'risk' | 'docs' | 'updates' | 'partners' | 'tools';

interface Jurisdiction {
  id: string;
  region: RegionKey;
  country: string;
  flag: string; // emoji
  status: 'observe' | 'research' | 'preparing' | 'engaging' | 'paused';
  focusAreas: string[];
  researchProgress: number; // 0-100
  riskLevel: 'low' | 'medium' | 'high';
  lastUpdate: string;
  description: string;
  highlights: string[];
  contacts: { name: string; role: string }[];
}

interface PolicyItem {
  id: string;
  key: PolicyKey;
  name: string;
  version: string;
  status: 'live' | 'draft' | 'review' | 'archived';
  lastReview: string;
  nextReview: string;
  owner: string;
  description: string;
  scope: string[];
  controls: { id: string; name: string; type: 'prevent' | 'detect' | 'respond'; frequency: string }[];
}

interface RiskItem {
  id: string;
  key: RiskKey;
  name: string;
  level: 'low' | 'medium' | 'high' | 'critical';
  trend: 'rising' | 'falling' | 'stable';
  change24h: number; // 0-100
  framework: string;
  description: string;
  mitigations: string[];
  metrics: { label: string; value: string }[];
}

interface Doc {
  id: string;
  type: DocType;
  name: string;
  version: string;
  status: 'current' | 'archive';
  effectiveDate: string;
  pages: number;
  language: 'zh-CN' | 'en-US';
  description: string;
  highlights: string[];
}

interface ComplianceUpdate {
  id: string;
  title: string;
  category: 'aml' | 'kyc' | 'privacy' | 'tax' | 'regulator' | 'partner' | 'framework' | 'tech';
  date: string;
  status: 'published' | 'draft' | 'review' | 'archived';
  importance: 'high' | 'medium' | 'low';
  summary: string;
  region: RegionKey | 'global';
}

interface Partner {
  id: string;
  name: string;
  type: 'kyc' | 'chain-analytics' | 'audit' | 'legal' | 'data' | 'compliance-tech' | 'sanctions';
  region: RegionKey | 'global';
  since: number;
  serviceScope: string;
  description: string;
  certifications: string[];
}

interface Tool {
  id: string;
  name: string;
  category: 'self-check' | 'risk-calc' | 'document' | 'training' | 'api';
  description: string;
  estimatedTime: string;
  status: 'open' | 'beta' | 'soon';
  highlight: string;
}

interface DrawerState {
  open: boolean;
  type: 'jurisdiction' | 'policy' | 'risk' | 'update' | 'partner' | 'doc' | 'tool' | 'help' | null;
  payload: string | null;
}

// ============== Mock 数据 ==============

const JURISDICTIONS: Jurisdiction[] = [
  {
    id: 'sg',
    region: 'apac',
    country: '新加坡',
    flag: '🇸🇬',
    status: 'research',
    focusAreas: ['PSA 数字支付代币', 'MAS 风险管理', '反洗钱法规', '跨境支付通道'],
    researchProgress: 72,
    riskLevel: 'low',
    lastUpdate: '2024-12-15',
    description: '新加坡作为亚太金融中心，其 PSA/MAS 监管框架对数字资产服务商有明确指引。ZSDEX 持续观察其监管演进，并在合规研究方向上投入资源。',
    highlights: [
      '持续关注 MAS《数字支付代币服务指引》修订',
      '与本地律所建立合规研究方向沟通',
      '储备金公示机制与本地监管要求对齐',
      '客户尽职调查（CDD）流程与 PSA 同步',
    ],
    contacts: [
      { name: '合规研究组 APAC-1', role: '研究方向负责人' },
      { name: '新加坡律所对接', role: '法律研究方向' },
    ],
  },
  {
    id: 'hk',
    region: 'apac',
    country: '香港',
    flag: '🇭🇰',
    status: 'observe',
    focusAreas: ['SFC 虚拟资产交易平台', 'VATP 发牌制度', '零售投资者保护', '稳定币条例'],
    researchProgress: 58,
    riskLevel: 'medium',
    lastUpdate: '2024-12-10',
    description: '香港 SFC 正在推进虚拟资产交易平台（VATP）发牌制度。ZSDEX 将其作为重点研究方向，尚未在该地区开展受监管业务。',
    highlights: [
      '持续研究 SFC VATP 发牌要求',
      '跟踪稳定币条例草案进展',
      '本地反洗钱法规对接研究',
      '零售投资者适当性评估机制研究',
    ],
    contacts: [
      { name: '合规研究组 APAC-2', role: '区域观察员' },
    ],
  },
  {
    id: 'jp',
    region: 'apac',
    country: '日本',
    flag: '🇯🇵',
    status: 'research',
    focusAreas: ['JFSA 加密资产监管', 'JVCEA 行业自律', '资金决済法修订', '税务合规'],
    researchProgress: 65,
    riskLevel: 'low',
    lastUpdate: '2024-11-28',
    description: '日本是较早建立加密资产监管框架的司法管辖区。ZSDEX 在合规研究方向上对 JFSA 框架进行持续研究。',
    highlights: [
      'JVCEA 行业自律标准对接研究',
      '资金决済法修订跟进',
      '本地税务申报框架研究',
      '冷钱包隔离标准研究',
    ],
    contacts: [
      { name: '合规研究组 APAC-3', role: '区域研究' },
    ],
  },
  {
    id: 'kr',
    region: 'apac',
    country: '韩国',
    flag: '🇰🇷',
    status: 'observe',
    focusAreas: ['特金法修订', '实名账户制度', '虚拟资产使用者保护', '金融情报机构（FIU）'],
    researchProgress: 48,
    riskLevel: 'medium',
    lastUpdate: '2024-12-05',
    description: '韩国持续完善虚拟资产监管框架。ZSDEX 跟踪其特金法修订及实名账户制度演进。',
    highlights: [
      '特金法修订草案跟踪',
      'FIU 报告机制研究',
      '本地银行通道研究',
      '用户资产隔离要求研究',
    ],
    contacts: [
      { name: '合规研究组 APAC-4', role: '区域观察' },
    ],
  },
  {
    id: 'eu',
    region: 'emea',
    country: '欧盟',
    flag: '🇪🇺',
    status: 'research',
    focusAreas: ['MiCA 法规', 'TFR 资金转移条例', 'AMLD6 反洗钱指令', 'GDPR 数据保护'],
    researchProgress: 80,
    riskLevel: 'low',
    lastUpdate: '2024-12-20',
    description: '欧盟 MiCA 与 TFR 是全球重要的数字资产监管框架。ZSDEX 对其进行持续研究，作为国际化合规研究的重要方向。',
    highlights: [
      'MiCA 全条款逐项研究方向',
      'TFR 资金转移条例合规研究',
      'AMLD6 反洗钱指令对齐',
      'GDPR 数据保护合规体系',
    ],
    contacts: [
      { name: '合规研究组 EMEA-1', role: '区域研究负责人' },
      { name: '欧盟律所对接', role: '法律研究方向' },
    ],
  },
  {
    id: 'uk',
    region: 'emea',
    country: '英国',
    flag: '🇬🇧',
    status: 'observe',
    focusAreas: ['FCA 金融行为监管', '加密资产推广规则', '金融犯罪合规', '高价值客户尽职调查'],
    researchProgress: 62,
    riskLevel: 'medium',
    lastUpdate: '2024-12-08',
    description: '英国 FCA 对加密资产推广与金融服务有明确监管要求。ZSDEX 跟踪其监管动态，作为国际化合规研究方向。',
    highlights: [
      'FCA 加密资产推广规则研究',
      'S172 财务犯罪合规框架研究',
      '高价值客户尽职调查（EDD）研究',
      '英国本地税务框架研究',
    ],
    contacts: [
      { name: '合规研究组 EMEA-2', role: '区域观察' },
    ],
  },
  {
    id: 'ch',
    region: 'emea',
    country: '瑞士',
    flag: '🇨🇭',
    status: 'research',
    focusAreas: ['FINMA 金融监管', 'DLT 法案', '银行保密法与跨境', '反洗钱合规'],
    researchProgress: 55,
    riskLevel: 'low',
    lastUpdate: '2024-11-30',
    description: '瑞士是较早为 DLT 与加密资产建立明确监管框架的国家之一。ZSDEX 对 FINMA 框架进行持续研究。',
    highlights: [
      'FINMA DLT 法案对接研究',
      '瑞士银行通道可行性研究',
      '反洗钱（AMLA）合规框架',
      '跨境数据流动机制研究',
    ],
    contacts: [
      { name: '合规研究组 EMEA-3', role: '区域研究' },
    ],
  },
  {
    id: 'us',
    region: 'americas',
    country: '美国',
    flag: '🇺🇸',
    status: 'observe',
    focusAreas: ['FinCEN 监管动态', '州级 MTL 牌照', 'SEC 监管路径', 'OFAC 制裁合规'],
    researchProgress: 42,
    riskLevel: 'high',
    lastUpdate: '2024-12-12',
    description: '美国对数字资产采取多机构、多层级的监管路径。ZSDEX 跟踪 FinCEN、SEC、CFTC 及 OFAC 的监管动态，作为国际化合规研究方向。',
    highlights: [
      'FinCEN 反洗钱规则跟踪',
      '州级牌照框架研究',
      'OFAC 制裁名单实时监控',
      'SEC 监管路径观察',
    ],
    contacts: [
      { name: '合规研究组 AMER-1', role: '区域观察' },
    ],
  },
  {
    id: 'ca',
    region: 'americas',
    country: '加拿大',
    flag: '🇨🇦',
    status: 'observe',
    focusAreas: ['FINTRAC 反洗钱中心', 'OSC 证券监管', '加拿大资金服务法研究', '虚拟货币服务商'],
    researchProgress: 38,
    riskLevel: 'medium',
    lastUpdate: '2024-11-25',
    description: '加拿大 FINTRAC 与各省证券监管机构对虚拟资产有明确要求。ZSDEX 作为合规研究方向持续观察。',
    highlights: [
      'FINTRAC 注册要求研究',
      '加拿大资金服务法研究',
      'OSC 证券认定研究',
      '反恐融资（CFT）合规研究',
    ],
    contacts: [
      { name: '合规研究组 AMER-2', role: '区域观察' },
    ],
  },
  {
    id: 'br',
    region: 'americas',
    country: '巴西',
    flag: '🇧🇷',
    status: 'observe',
    focusAreas: ['BCB 央行数字资产', 'CVM 证券监管', '反洗钱法 14.478', '加密资产征税'],
    researchProgress: 30,
    riskLevel: 'medium',
    lastUpdate: '2024-12-01',
    description: '巴西近期通过了加密资产相关法案。ZSDEX 将其作为新兴市场合规研究方向持续观察。',
    highlights: [
      'BCB 数字资产框架跟踪',
      '反洗钱法 14.478 研究',
      'CVM 证券分类研究',
      '本地税务框架研究',
    ],
    contacts: [
      { name: '合规研究组 AMER-3', role: '区域观察' },
    ],
  },
  {
    id: 'ae',
    region: 'mena',
    country: '阿联酋',
    flag: '🇦🇪',
    status: 'observe',
    focusAreas: ['VARA 虚拟资产监管', 'ADGM 金融服务', 'KYC/AML 合规', '跨境支付'],
    researchProgress: 50,
    riskLevel: 'medium',
    lastUpdate: '2024-12-18',
    description: '阿联酋迪拜 VARA 与 ADGM 正在建设全球数字资产监管框架。ZSDEX 跟踪其动态，作为国际化合规研究方向。',
    highlights: [
      'VARA 虚拟资产监管框架研究',
      'ADGM 金融服务牌照研究',
      '本地反洗钱法规研究',
      '中东税务结构研究',
    ],
    contacts: [
      { name: '合规研究组 MENA-1', role: '区域观察' },
    ],
  },
  {
    id: 'sa',
    region: 'mena',
    country: '沙特阿拉伯',
    flag: '🇸🇦',
    status: 'observe',
    focusAreas: ['SAMA 央行监管', 'CMA 资本市场', '反洗钱 / CFT', '数字资产试点'],
    researchProgress: 35,
    riskLevel: 'medium',
    lastUpdate: '2024-11-20',
    description: '沙特 SAMA 与 CMA 正在探索数字资产监管路径。ZSDEX 作为国际化合规研究方向持续观察。',
    highlights: [
      'SAMA 监管动态跟踪',
      'CMA 资本市场规则研究',
      '本地反洗钱研究',
      '区域支付通道研究',
    ],
    contacts: [
      { name: '合规研究组 MENA-2', role: '区域观察' },
    ],
  },
];

const POLICIES: PolicyItem[] = [
  {
    id: 'aml-cft',
    key: 'aml',
    name: '反洗钱与反恐怖融资 (AML/CFT) 政策',
    version: 'v3.2',
    status: 'live',
    lastReview: '2024-10-15',
    nextReview: '2025-04-15',
    owner: '合规研究组',
    description: '覆盖客户尽职调查、可疑交易报告、制裁名单筛查、政治人物筛查（PEP）、资金来源声明（SOF）等核心 AML/CFT 控制。',
    scope: ['全部产品线', '全量用户', '全部司法管辖区研究方向'],
    controls: [
      { id: 'c-kyc', name: '客户身份核验（KYC）', type: 'prevent', frequency: '实时 + 触发复核' },
      { id: 'c-kyb', name: '企业客户核验（KYB）', type: 'prevent', frequency: '开户时 + 年度复核' },
      { id: 'c-sanction', name: '制裁名单实时筛查', type: 'detect', frequency: '7×24 实时' },
      { id: 'c-pep', name: '政治人物（PEP）筛查', type: 'detect', frequency: '开户时 + 触发复核' },
      { id: 'c-sof', name: '资金来源声明（SOF）', type: 'prevent', frequency: '触发时 + 抽样审核' },
      { id: 'c-str', name: '可疑交易报告（STR）', type: 'respond', frequency: '触发即报' },
    ],
  },
  {
    id: 'travel-rule',
    key: 'travel-rule',
    name: '资金转移规则（Travel Rule）',
    version: 'v2.1',
    status: 'live',
    lastReview: '2024-09-20',
    nextReview: '2025-03-20',
    owner: '合规研究组',
    description: '按照国际资金转移规则（FATF Recommendation 16）要求，对超过阈值的转账进行发起人/受益人信息传递。',
    scope: ['链上转账', '法币通道', '机构客户'],
    controls: [
      { id: 'tr-threshold', name: '阈值监控', type: 'detect', frequency: '实时' },
      { id: 'tr-originator', name: '发起人信息收集', type: 'prevent', frequency: '交易时' },
      { id: 'tr-beneficiary', name: '受益人信息收集', type: 'prevent', frequency: '交易时' },
      { id: 'tr-counterparty', name: '对手方信息传递', type: 'detect', frequency: '交易时' },
    ],
  },
  {
    id: 'sanctions',
    key: 'sanctions',
    name: '制裁合规政策',
    version: 'v2.5',
    status: 'live',
    lastReview: '2024-11-05',
    nextReview: '2025-05-05',
    owner: '合规研究组',
    description: '覆盖 OFAC、欧盟、联合国、英国等主要制裁名单的实时筛查与冻结机制。',
    scope: ['全量用户', '全量交易', '全量链上地址'],
    controls: [
      { id: 'sn-list', name: '多来源名单聚合', type: 'detect', frequency: '实时' },
      { id: 'sn-screen', name: '名单实时筛查', type: 'detect', frequency: '7×24' },
      { id: 'sn-freeze', name: '命中冻结流程', type: 'respond', frequency: '触发即冻结' },
      { id: 'sn-report', name: '监管报告', type: 'respond', frequency: '触发即报' },
    ],
  },
  {
    id: 'data-protection',
    key: 'kyc',
    name: '数据保护与隐私政策',
    version: 'v4.0',
    status: 'live',
    lastReview: '2024-12-01',
    nextReview: '2025-06-01',
    owner: '法务与数据保护组',
    description: '按照 GDPR、各地区隐私法规要求，建立用户数据收集、存储、使用、共享、删除的全生命周期管理。',
    scope: ['全部用户数据', '全部业务流程'],
    controls: [
      { id: 'dp-min', name: '数据最小化原则', type: 'prevent', frequency: '设计时' },
      { id: 'dp-encrypt', name: '传输与存储加密', type: 'prevent', frequency: '持续' },
      { id: 'dp-dsr', name: '数据主体请求处理（DSR）', type: 'respond', frequency: '30 天内' },
      { id: 'dp-audit', name: '数据保护影响评估（DPIA）', type: 'detect', frequency: '季度 + 触发' },
    ],
  },
  {
    id: 'market-integrity',
    key: 'sof',
    name: '市场操纵与利益冲突管理',
    version: 'v1.8',
    status: 'live',
    lastReview: '2024-10-30',
    nextReview: '2025-04-30',
    owner: '合规与风控组',
    description: '防范内幕交易、市场操纵、利益冲突等行为，建立员工与客户交易行为监控机制。',
    scope: ['员工交易', '平台产品', '可疑订单'],
    controls: [
      { id: 'mi-surveillance', name: '可疑交易监测', type: 'detect', frequency: '7×24' },
      { id: 'mi-trade-restrict', name: '员工交易限制', type: 'prevent', frequency: '持续' },
      { id: 'mi-coc', name: '利益冲突申报', type: 'prevent', frequency: '季度 + 触发' },
    ],
  },
  {
    id: 'risk-management',
    key: 'kyb',
    name: '全面风险管理框架',
    version: 'v2.3',
    status: 'live',
    lastReview: '2024-11-15',
    nextReview: '2025-05-15',
    owner: '风险管理组',
    description: '按照三道防线模型建立全面风险管理体系，覆盖市场风险、信用风险、操作风险、合规风险、流动性风险等。',
    scope: ['全部业务条线', '全量资产', '全流程'],
    controls: [
      { id: 'rm-three-lines', name: '三道防线治理', type: 'prevent', frequency: '持续' },
      { id: 'rm-stress-test', name: '压力测试', type: 'detect', frequency: '季度' },
      { id: 'rm-rcsa', name: '风险与控制自评估（RCSA）', type: 'detect', frequency: '半年度' },
      { id: 'rm-committee', name: '风险委员会评审', type: 'respond', frequency: '月度' },
    ],
  },
];

const RISKS: RiskItem[] = [
  {
    id: 'r-market',
    key: 'market',
    name: '市场风险',
    level: 'medium',
    trend: 'rising',
    change24h: 12,
    framework: '三道防线 + VaR 模型',
    description: '数字资产价格剧烈波动可能导致用户资产价值变化。',
    mitigations: [
      '实时价格监控与风险预警',
      '动态保证金与强平机制',
      '风险敞口限额管理',
      '压力测试与情景分析',
    ],
    metrics: [
      { label: 'VaR (95%, 1d)', value: '$2.3M' },
      { label: '最大回撤 (30d)', value: '8.2%' },
      { label: '波动率 (年化)', value: '64%' },
      { label: '风险敞口', value: '$45.2M' },
    ],
  },
  {
    id: 'r-cyber',
    key: 'cyber',
    name: '网络与信息安全风险',
    level: 'medium',
    trend: 'stable',
    change24h: -3,
    framework: 'NIST CSF + ISO 27001',
    description: '针对交易系统的网络攻击、密钥泄露、社工攻击等安全风险。',
    mitigations: [
      '多重签名 + MPC 阈值签名',
      '冷热钱包分离 + 离线存储',
      '7×24 SOC 安全运营',
      '员工安全意识培训',
    ],
    metrics: [
      { label: '过去 90d 事件', value: '0 起' },
      { label: 'MTTD (平均检测时间)', value: '< 8 分钟' },
      { label: 'MTTR (平均响应时间)', value: '< 30 分钟' },
      { label: '渗透测试', value: '季度' },
    ],
  },
  {
    id: 'r-liquidity',
    key: 'liquidity',
    name: '流动性风险',
    level: 'low',
    trend: 'falling',
    change24h: -8,
    framework: '流动性覆盖率（LCR）+ NSFR',
    description: '在极端市场情况下无法及时满足用户提现需求的风险。',
    mitigations: [
      '多层级流动性储备',
      '做市商合作伙伴网络',
      '1:1 准备金承诺 + Merkle 证明',
      '流动性压力测试',
    ],
    metrics: [
      { label: 'LCR', value: '215%' },
      { label: 'NSFR', value: '182%' },
      { label: '流动性储备', value: '$125M' },
      { label: '回笼时间', value: '< 4 小时' },
    ],
  },
  {
    id: 'r-compliance',
    key: 'compliance',
    name: '合规与监管风险',
    level: 'medium',
    trend: 'rising',
    change24h: 5,
    framework: '全球合规研究方向',
    description: '各司法管辖区监管政策持续演进，合规要求不断变化带来的风险。',
    mitigations: [
      '全球合规研究方向 12+ 司法管辖区',
      '专业律所网络对接',
      '政策快速响应机制',
      '客户身份核验分级管理',
    ],
    metrics: [
      { label: '研究方向辖区', value: '12+' },
      { label: '内部政策版本', value: '38 份' },
      { label: '研究投入', value: '持续增加' },
      { label: '上次政策更新', value: '30 天内' },
    ],
  },
  {
    id: 'r-counterparty',
    key: 'counterparty',
    name: '交易对手风险',
    level: 'low',
    trend: 'stable',
    change24h: 0,
    framework: '交易对手限额 + 抵押品管理',
    description: '做市商、托管机构、银行等合作方违约或无法履约的风险。',
    mitigations: [
      '交易对手评级体系',
      '限额与抵押品管理',
      '分散化合作方布局',
      '实时敞口监控',
    ],
    metrics: [
      { label: '合作方数量', value: '18 家' },
      { label: '最大单一敞口', value: '< 15%' },
      { label: '抵押品覆盖率', value: '135%' },
      { label: '评级 A 以上', value: '85%' },
    ],
  },
  {
    id: 'r-operational',
    key: 'operational',
    name: '操作风险',
    level: 'low',
    trend: 'stable',
    change24h: 1,
    framework: 'RCSA + KRI 监控',
    description: '内部流程、人员、系统、突发事件导致损失的风险。',
    mitigations: [
      '关键风险指标（KRI）实时监控',
      '业务连续性计划（BCP）',
      '灾备演练季度执行',
      '操作风险事件库管理',
    ],
    metrics: [
      { label: '关键流程', value: '128 个' },
      { label: 'KRI 监控', value: '52 项' },
      { label: '事件数 (90d)', value: '3 起' },
      { label: '损失率', value: '< 0.01%' },
    ],
  },
  {
    id: 'r-concentration',
    key: 'concentration',
    name: '集中度风险',
    level: 'low',
    trend: 'stable',
    change24h: 2,
    framework: '集中度限额监控',
    description: '资产、地理、客户、渠道过度集中带来的风险。',
    mitigations: [
      '单一客户敞口限额',
      '资产类别分散化',
      '地理分布研究',
      '渠道多元化布局',
    ],
    metrics: [
      { label: 'Top 10 客户占比', value: '32%' },
      { label: '资产类别数', value: '24' },
      { label: '渠道数', value: '6 个' },
      { label: '地区分布', value: '12 研究方向' },
    ],
  },
];

const DOCS: Doc[] = [
  {
    id: 'd-tos',
    type: 'terms',
    name: '服务条款（ToS）',
    version: 'v6.2',
    status: 'current',
    effectiveDate: '2024-12-01',
    pages: 38,
    language: 'zh-CN',
    description: '明确用户与平台之间的权利义务、账户使用、交易规则、争议解决等核心条款。',
    highlights: [
      '账户注册与使用规范',
      '服务范围与变更',
      '用户行为准则',
      '争议解决与适用法律',
    ],
  },
  {
    id: 'd-privacy',
    type: 'privacy',
    name: '用户隐私协议',
    version: 'v4.5',
    status: 'current',
    effectiveDate: '2024-11-15',
    pages: 24,
    language: 'zh-CN',
    description: '按照 GDPR、各地区隐私法规要求，明确用户个人信息的收集、使用、存储、共享、保护。',
    highlights: [
      '数据收集范围与目的',
      '数据使用与共享',
      '数据存储与跨境传输',
      '用户权利与行使方式',
    ],
  },
  {
    id: 'd-aml',
    type: 'aml-policy',
    name: '反洗钱政策（AML Policy）',
    version: 'v3.2',
    status: 'current',
    effectiveDate: '2024-10-15',
    pages: 32,
    language: 'zh-CN',
    description: '完整反洗钱与反恐怖融资（AML/CFT）政策框架与执行细则。',
    highlights: [
      'KYC / KYB 验证规则',
      '可疑交易报告流程',
      '制裁名单筛查机制',
      'PEP 与 SOF 管理',
    ],
  },
  {
    id: 'd-risk',
    type: 'risk-framework',
    name: '风险管理框架',
    version: 'v2.3',
    status: 'current',
    effectiveDate: '2024-11-15',
    pages: 28,
    language: 'zh-CN',
    description: '全面风险管理框架，涵盖市场、信用、操作、合规、流动性等核心风险。',
    highlights: [
      '三道防线模型',
      '风险偏好与限额',
      '压力测试与情景分析',
      '风险报告与升级机制',
    ],
  },
  {
    id: 'd-cookie',
    type: 'cookie',
    name: 'Cookie 与追踪技术政策',
    version: 'v2.0',
    status: 'current',
    effectiveDate: '2024-09-01',
    pages: 12,
    language: 'zh-CN',
    description: '网站与产品使用的 Cookie 与追踪技术说明，用户选择与控制。',
    highlights: [
      '必要 Cookie 与功能 Cookie',
      '分析与性能 Cookie',
      '广告与个性化 Cookie',
      '用户选择与控制',
    ],
  },
  {
    id: 'd-tax',
    type: 'tax',
    name: '税务信息声明',
    version: 'v1.5',
    status: 'current',
    effectiveDate: '2024-08-20',
    pages: 14,
    language: 'zh-CN',
    description: '用户税务信息收集、申报与合规说明。',
    highlights: [
      '税务身份信息收集',
      '交易税务事件',
      '申报与扣缴',
      '国际税务合规',
    ],
  },
  {
    id: 'd-data',
    type: 'data-protection',
    name: '数据保护影响评估（DPIA）',
    version: 'v1.8',
    status: 'current',
    effectiveDate: '2024-11-30',
    pages: 22,
    language: 'zh-CN',
    description: '关键业务流程的数据保护影响评估报告。',
    highlights: [
      '评估范围与目标',
      '数据流与处理活动',
      '风险识别与缓解',
      '持续监控与复审',
    ],
  },
];

const UPDATES: ComplianceUpdate[] = [
  {
    id: 'u-1',
    title: '关于加强对高风险司法管辖区用户身份核验的通知',
    category: 'kyc',
    date: '2024-12-15',
    status: 'published',
    importance: 'high',
    summary: '按照 AML/CFT 政策要求，对来自高风险司法管辖区的用户加强 KYC 审核层级，并启用增强型尽职调查（EDD）。',
    region: 'global',
  },
  {
    id: 'u-2',
    title: '资金转移规则（Travel Rule）阈值更新公告',
    category: 'aml',
    date: '2024-12-10',
    status: 'published',
    importance: 'high',
    summary: '按照国际化合规研究方向，将 Travel Rule 触发阈值从 USD 1,000 调整为 USD 0，同时强化对手方信息传递机制。',
    region: 'global',
  },
  {
    id: 'u-3',
    title: '欧盟 MiCA 法规对齐阶段性总结',
    category: 'framework',
    date: '2024-12-08',
    status: 'published',
    importance: 'medium',
    summary: '对 MiCA 法规进行逐项研究，识别与现行流程的差距，制定分阶段对齐计划。',
    region: 'emea',
  },
  {
    id: 'u-4',
    title: 'OFAC 制裁名单 12 月更新公告',
    category: 'regulator',
    date: '2024-12-05',
    status: 'published',
    importance: 'high',
    summary: 'OFAC 制裁名单于 12 月初更新，已完成名单导入与历史交易回溯筛查。',
    region: 'americas',
  },
  {
    id: 'u-5',
    title: '隐私政策 v4.5 发布公告',
    category: 'privacy',
    date: '2024-11-15',
    status: 'published',
    importance: 'medium',
    summary: '隐私政策 v4.5 正式发布，新增数据主体请求（DSR）处理流程说明与跨境传输机制。',
    region: 'global',
  },
  {
    id: 'u-6',
    title: '可疑交易报告（STR）流程优化说明',
    category: 'aml',
    date: '2024-11-08',
    status: 'published',
    importance: 'medium',
    summary: '对 STR 内部流程进行优化，新增机器学习辅助筛查模型，提升可疑交易识别精度。',
    region: 'global',
  },
  {
    id: 'u-7',
    title: '香港 SFC VATP 发牌制度持续观察',
    category: 'framework',
    date: '2024-11-01',
    status: 'published',
    importance: 'low',
    summary: '持续跟踪香港 SFC 虚拟资产交易平台发牌制度演进，作为国际化合规研究方向。',
    region: 'apac',
  },
  {
    id: 'u-8',
    title: '合规研究组组织架构更新',
    category: 'partner',
    date: '2024-10-25',
    status: 'published',
    importance: 'low',
    summary: '合规研究组增设 APAC / EMEA / AMER / MENA 四个区域研究小组，强化国际化合规研究能力。',
    region: 'global',
  },
  {
    id: 'u-9',
    title: '税务信息收集流程更新说明',
    category: 'tax',
    date: '2024-10-18',
    status: 'published',
    importance: 'medium',
    summary: '更新税务信息收集流程，新增非美国税务身份表单（W-8 系列）。',
    region: 'global',
  },
  {
    id: 'u-10',
    title: '数据保护影响评估（DPIA）季度复审',
    category: 'privacy',
    date: '2024-10-10',
    status: 'published',
    importance: 'medium',
    summary: '完成关键业务流程 DPIA 季度复审，识别并缓解 2 项中等风险。',
    region: 'global',
  },
  {
    id: 'u-11',
    title: '新增 2 家合规研究合作机构',
    category: 'partner',
    date: '2024-10-05',
    status: 'published',
    importance: 'low',
    summary: '合规研究网络新增 2 家研究机构，覆盖 MENA 与 AMER 区域。',
    region: 'mena',
  },
  {
    id: 'u-12',
    title: '2024 年度外部研究合作框架更新',
    category: 'framework',
    date: '2024-09-28',
    status: 'published',
    importance: 'low',
    summary: '完成 2024 年度外部研究合作框架更新，覆盖法务、审计、研究等领域。',
    region: 'global',
  },
];

const PARTNERS: Partner[] = [
  {
    id: 'p-kyc-1',
    name: 'KYC 研究合作方 A',
    type: 'kyc',
    region: 'global',
    since: 2022,
    serviceScope: '身份核验研究方向 / 多地区合规研究',
    description: '在国际 KYC/AML 合规研究方向与多地区身份核验规则研究上与平台合作。',
    certifications: ['研究方向合作'],
  },
  {
    id: 'p-kyc-2',
    name: 'KYC 研究合作方 B',
    type: 'kyc',
    region: 'apac',
    since: 2023,
    serviceScope: '亚太地区 KYC 合规研究',
    description: '在亚太地区 KYC 合规研究方向上与平台合作。',
    certifications: ['区域研究方向'],
  },
  {
    id: 'p-chain-1',
    name: '链上分析研究合作方 A',
    type: 'chain-analytics',
    region: 'global',
    since: 2022,
    serviceScope: '链上资金流向分析研究方向',
    description: '在链上资金流向分析与可疑地址识别研究方向与平台合作。',
    certifications: ['研究方向合作'],
  },
  {
    id: 'p-chain-2',
    name: '链上分析研究合作方 B',
    type: 'chain-analytics',
    region: 'global',
    since: 2023,
    serviceScope: '跨链分析研究方向',
    description: '在跨链资产追溯与跨链风险研究方向与平台合作。',
    certifications: ['研究方向合作'],
  },
  {
    id: 'p-audit-1',
    name: '审计研究合作方 A',
    type: 'audit',
    region: 'global',
    since: 2021,
    serviceScope: '准备金证明审计研究方向',
    description: '在 PoR 准备金证明审计与年度合规报告研究方向与平台合作。',
    certifications: ['审计研究方向'],
  },
  {
    id: 'p-audit-2',
    name: '审计研究合作方 B',
    type: 'audit',
    region: 'apac',
    since: 2023,
    serviceScope: '亚太地区审计研究方向',
    description: '在亚太地区合规审计研究方向与平台合作。',
    certifications: ['区域研究方向'],
  },
  {
    id: 'p-legal-1',
    name: '法务研究合作方 A',
    type: 'legal',
    region: 'global',
    since: 2022,
    serviceScope: '国际数字资产法务研究方向',
    description: '在国际数字资产法务研究方向与多地区法律框架研究上与平台合作。',
    certifications: ['法务研究方向'],
  },
  {
    id: 'p-legal-2',
    name: '法务研究合作方 B',
    type: 'legal',
    region: 'emea',
    since: 2023,
    serviceScope: '欧盟 GDPR / MiCA 法务研究',
    description: '在欧盟 GDPR / MiCA 合规法务研究方向与平台合作。',
    certifications: ['法务研究方向'],
  },
  {
    id: 'p-tech-1',
    name: '合规科技研究合作方 A',
    type: 'compliance-tech',
    region: 'global',
    since: 2023,
    serviceScope: '合规科技解决方案研究方向',
    description: '在合规科技（RegTech）解决方案研究方向与平台合作。',
    certifications: ['科技研究方向'],
  },
  {
    id: 'p-sanctions-1',
    name: '制裁名单研究合作方 A',
    type: 'sanctions',
    region: 'global',
    since: 2022,
    serviceScope: '多来源制裁名单聚合研究方向',
    description: '在多来源制裁名单聚合与实时筛查研究方向与平台合作。',
    certifications: ['研究方向合作'],
  },
];

const TOOLS: Tool[] = [
  {
    id: 't-self-check',
    name: '合规自查工具',
    category: 'self-check',
    description: '通过简短问答，帮助您了解当前账户的合规状态、风险等级与待完善项。',
    estimatedTime: '3-5 分钟',
    status: 'open',
    highlight: '推荐使用',
  },
  {
    id: 't-risk-calc',
    name: '风险等级计算器',
    category: 'risk-calc',
    description: '基于交易行为、设备指纹、地理位置等维度，估算当前账户的综合风险评分。',
    estimatedTime: '即时',
    status: 'open',
    highlight: '实时计算',
  },
  {
    id: 't-doc-gen',
    name: '合规文档生成器',
    category: 'document',
    description: '按场景自动生成合规相关文档（KYC 信息确认、税务表单、隐私请求等）。',
    estimatedTime: '5-10 分钟',
    status: 'beta',
    highlight: '内测中',
  },
  {
    id: 't-training',
    name: '合规培训课程',
    category: 'training',
    description: '提供 AML/CFT、隐私保护、市场操纵识别等主题的在线培训课程。',
    estimatedTime: '15-30 分钟',
    status: 'open',
    highlight: '持续更新',
  },
  {
    id: 't-api',
    name: '合规数据 API（机构）',
    category: 'api',
    description: '为机构客户提供合规相关数据接口（KYC 状态、风险评分、制裁筛查等）。',
    estimatedTime: '接口对接',
    status: 'beta',
    highlight: '邀请制',
  },
  {
    id: 't-checklist',
    name: '合规清单',
    category: 'document',
    description: '按使用场景提供完整的合规自查清单（开户 / 大额交易 / 跨境 / 提现等）。',
    estimatedTime: '5 分钟',
    status: 'open',
    highlight: '常用',
  },
];

const REGION_LABELS: Record<RegionKey, string> = {
  apac: '亚太地区',
  emea: '欧洲 / 中东 / 非洲',
  americas: '美洲地区',
  global: '全球框架',
  mena: '中东 / 北非',
};

const STATUS_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  observe: { label: '观察中', color: BRAND.info, bg: BRAND.infoLt },
  research: { label: '研究方向', color: BRAND.primary, bg: BRAND.primaryLt },
  preparing: { label: '准备中', color: BRAND.amber, bg: BRAND.amberLt },
  engaging: { label: '沟通中', color: BRAND.warning, bg: BRAND.warningLt },
  paused: { label: '暂缓', color: BRAND.textMute, bg: 'rgba(112, 112, 112, 0.08)' },
};

const POLICY_LABELS: Record<PolicyKey, string> = {
  aml: '反洗钱',
  kyc: '数据保护',
  kyb: '风险管理',
  sanctions: '制裁合规',
  pep: '政治人物',
  sof: '市场操纵',
  'travel-rule': '资金转移规则',
  tax: '税务合规',
};

// ============== 子组件 ==============

function KpiCard({
  icon: Icon,
  label,
  value,
  suffix,
  precision,
  isLive,
  trend,
  trendValue,
  color = BRAND.primary,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  suffix?: string;
  precision?: number;
  isLive?: boolean;
  trend?: 'up' | 'down' | 'flat';
  trendValue?: string;
  color?: string;
}) {
  return (
    <div
      className="rounded-2xl p-4 transition-all hover:scale-[1.02]"
      style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}
    >
      <div className="flex items-center justify-between mb-2">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: `${color}22`, color }}
        >
          <Icon className="w-4 h-4" />
        </div>
        {isLive && (
          <div className="flex items-center gap-1">
            <span
              className="w-1.5 h-1.5 rounded-full animate-pulse"
              style={{ backgroundColor: BRAND.success }}
            />
            <span className="text-[9px] font-mono" style={{ color: BRAND.success }}>
              LIVE
            </span>
          </div>
        )}
      </div>
      <div className="text-xl md:text-2xl font-bold font-mono leading-none" style={{ color }}>
        {precision ? value.toFixed(precision) : Math.round(value).toLocaleString()}
        {suffix}
      </div>
      <div className="flex items-center justify-between mt-1">
        <div className="text-[10px]" style={{ color: BRAND.textSub }}>
          {label}
        </div>
        {trend && (
          <div
            className="text-[9px] font-mono flex items-center gap-0.5"
            style={{
              color: trend === 'up' ? BRAND.success : trend === 'down' ? BRAND.danger : BRAND.textSub,
            }}
          >
            {trend === 'up' ? (
              <TrendingUp className="w-2.5 h-2.5" />
            ) : trend === 'down' ? (
              <TrendingDown className="w-2.5 h-2.5" />
            ) : null}
            {trendValue}
          </div>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ statusKey }: { statusKey: string }) {
  const s = STATUS_LABELS[statusKey] || STATUS_LABELS.observe;
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium"
      style={{ backgroundColor: s.bg, color: s.color }}
    >
      <span className="w-1 h-1 rounded-full" style={{ backgroundColor: s.color }} />
      {s.label}
    </span>
  );
}

function ImportanceBadge({ level }: { level: 'high' | 'medium' | 'low' }) {
  const cfg =
    level === 'high'
      ? { color: BRAND.danger, bg: BRAND.dangerLt, label: '高' }
      : level === 'medium'
        ? { color: BRAND.amber, bg: BRAND.amberLt, label: '中' }
        : { color: BRAND.textSub, bg: 'rgba(176, 176, 176, 0.10)', label: '低' };
  return (
    <span
      className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-medium"
      style={{ backgroundColor: cfg.bg, color: cfg.color }}
    >
      {cfg.label}
    </span>
  );
}

// ============== 主组件 ==============

export function PortalCompliance() {
  const [tab, setTab] = useState<Tab>('overview');
  const [search, setSearch] = useState('');
  const [regionFilter, setRegionFilter] = useState<RegionKey | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'progress' | 'risk' | 'country'>('progress');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [drawer, setDrawer] = useState<DrawerState>({ open: false, type: null, payload: null });
  const [helpOpen, setHelpOpen] = useState(false);
  const [docType, setDocType] = useState<DocType | 'all'>('all');
  const [toolCategory, setToolCategory] = useState<string>('all');

  // 实时 KPI 数据
  const [kpi, setKpi] = useState({
    complianceScore: 96.4,
    jurisdictions: 12,
    policies: 38,
    lastUpdate: 18,
    riskAlerts: 2,
    monitoringEvents: 1248,
    training: 86,
  });

  // 实时数据波动
  useEffect(() => {
    const interval = setInterval(() => {
      setKpi((prev) => ({
        complianceScore: Math.max(90, Math.min(99, prev.complianceScore + (Math.random() - 0.5) * 0.4)),
        jurisdictions: prev.jurisdictions,
        policies: prev.policies + (Math.random() > 0.95 ? 1 : 0),
        lastUpdate: Math.max(0, prev.lastUpdate + (Math.random() > 0.7 ? 1 : 0)),
        riskAlerts: Math.max(0, prev.riskAlerts + (Math.random() > 0.85 ? (Math.random() > 0.5 ? 1 : -1) : 0)),
        monitoringEvents: prev.monitoringEvents + Math.floor(Math.random() * 5),
        training: Math.max(80, Math.min(99, prev.training + (Math.random() - 0.5) * 0.2)),
      }));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // 键盘快捷键
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;
      if (e.key === '/') {
        e.preventDefault();
        document.getElementById('compliance-search')?.focus();
      } else if (e.key === 'Escape') {
        setDrawer({ open: false, type: null, payload: null });
        setHelpOpen(false);
      } else if (e.key === '?') {
        e.preventDefault();
        setHelpOpen(true);
      } else if (e.key === '1') setTab('overview');
      else if (e.key === '2') setTab('policy');
      else if (e.key === '3') setTab('risk');
      else if (e.key === '4') setTab('docs');
      else if (e.key === '5') setTab('updates');
      else if (e.key === '6') setTab('partners');
      else if (e.key === '7') setTab('tools');
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // 过滤司法管辖区
  const filteredJurisdictions = useMemo(() => {
    let result = JURISDICTIONS.filter((j) => {
      if (regionFilter !== 'all' && j.region !== regionFilter) return false;
      if (statusFilter !== 'all' && j.status !== statusFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          j.country.toLowerCase().includes(q) ||
          j.focusAreas.some((f) => f.toLowerCase().includes(q)) ||
          j.description.toLowerCase().includes(q)
        );
      }
      return true;
    });
    result.sort((a, b) => {
      let cmp = 0;
      if (sortBy === 'progress') cmp = a.researchProgress - b.researchProgress;
      else if (sortBy === 'risk') {
        const lvl = { low: 1, medium: 2, high: 3 } as const;
        cmp = lvl[a.riskLevel] - lvl[b.riskLevel];
      } else cmp = a.country.localeCompare(b.country);
      return sortDir === 'desc' ? -cmp : cmp;
    });
    return result;
  }, [regionFilter, statusFilter, search, sortBy, sortDir]);

  // 过滤政策
  const filteredPolicies = useMemo(() => {
    if (!search) return POLICIES;
    const q = search.toLowerCase();
    return POLICIES.filter(
      (p) => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q)
    );
  }, [search]);

  // 过滤风险
  const sortedRisks = useMemo(() => {
    const order = { critical: 4, high: 3, medium: 2, low: 1 } as const;
    return [...RISKS].sort((a, b) => order[b.level] - order[a.level]);
  }, []);

  // 过滤文档
  const filteredDocs = useMemo(() => {
    let result = DOCS.filter((d) => docType === 'all' || d.type === docType);
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (d) => d.name.toLowerCase().includes(q) || d.description.toLowerCase().includes(q)
      );
    }
    return result;
  }, [docType, search]);

  // 过滤更新
  const filteredUpdates = useMemo(() => {
    let result = [...UPDATES];
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (u) => u.title.toLowerCase().includes(q) || u.summary.toLowerCase().includes(q)
      );
    }
    return result.sort((a, b) => b.date.localeCompare(a.date));
  }, [search]);

  // 过滤合作方
  const filteredPartners = useMemo(() => {
    if (!search) return PARTNERS;
    const q = search.toLowerCase();
    return PARTNERS.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.serviceScope.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q)
    );
  }, [search]);

  // 过滤工具
  const filteredTools = useMemo(() => {
    let result = TOOLS;
    if (toolCategory !== 'all') result = result.filter((t) => t.category === toolCategory);
    return result;
  }, [toolCategory]);

  const openDrawer = useCallback(
    (type: DrawerState['type'], payload: string | null = null) => {
      setDrawer({ open: true, type, payload });
    },
    []
  );

  const closeDrawer = useCallback(() => {
    setDrawer({ open: false, type: null, payload: null });
  }, []);

  // 获取当前 Drawer 数据
  const getDrawerContent = useCallback(() => {
    if (!drawer.open || !drawer.type) return null;
    if (drawer.type === 'jurisdiction') {
      const j = JURISDICTIONS.find((x) => x.id === drawer.payload);
      if (!j) return null;
      return { title: `${j.flag} ${j.country} 合规研究方向`, subtitle: REGION_LABELS[j.region], data: j, type: 'jurisdiction' as const };
    }
    if (drawer.type === 'policy') {
      const p = POLICIES.find((x) => x.id === drawer.payload);
      if (!p) return null;
      return { title: p.name, subtitle: `v${p.version} · ${p.owner}`, data: p, type: 'policy' as const };
    }
    if (drawer.type === 'risk') {
      const r = RISKS.find((x) => x.id === drawer.payload);
      if (!r) return null;
      return { title: r.name, subtitle: r.framework, data: r, type: 'risk' as const };
    }
    if (drawer.type === 'update') {
      const u = UPDATES.find((x) => x.id === drawer.payload);
      if (!u) return null;
      return { title: u.title, subtitle: u.date, data: u, type: 'update' as const };
    }
    if (drawer.type === 'partner') {
      const p = PARTNERS.find((x) => x.id === drawer.payload);
      if (!p) return null;
      return { title: p.name, subtitle: p.serviceScope, data: p, type: 'partner' as const };
    }
    if (drawer.type === 'doc') {
      const d = DOCS.find((x) => x.id === drawer.payload);
      if (!d) return null;
      return { title: d.name, subtitle: `v${d.version} · ${d.pages} 页`, data: d, type: 'doc' as const };
    }
    if (drawer.type === 'tool') {
      const t = TOOLS.find((x) => x.id === drawer.payload);
      if (!t) return null;
      return { title: t.name, subtitle: t.estimatedTime, data: t, type: 'tool' as const };
    }
    return null;
  }, [drawer]);

  const drawerContent = getDrawerContent();

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: BRAND.bg, color: BRAND.text }}
    >
      {/* ============== 顶部 ============== */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6">
        {/* Hero */}
        <section className="mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-4" style={{ backgroundColor: BRAND.primaryLt, border: `1px solid ${BRAND.primary}33` }}>
            <ShieldCheck className="w-3.5 h-3.5" style={{ color: BRAND.primary }} />
            <span className="text-[11px] font-mono tracking-wider" style={{ color: BRAND.primary }}>
              COMPLIANCE & TRANSPARENCY RESEARCH CENTER
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-3" style={{ color: BRAND.text }}>
            合规与透明度研究中心
          </h1>
          <p className="text-sm md:text-base max-w-3xl" style={{ color: BRAND.textSub }}>
            致力于构建全球化合规研究基础设施。ZSDEX 在 12+ 司法管辖区开展持续合规研究方向，
            严格遵守反洗钱（AML）、反恐怖融资（CFT）以及各地区数据保护与隐私准则，
            持续提升平台合规与透明度。
          </p>
          <div className="flex flex-wrap items-center gap-2 mt-4 text-[11px]" style={{ color: BRAND.textSub }}>
            <span className="inline-flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" style={{ color: BRAND.primary }} />
              全球合规研究方向
            </span>
            <span style={{ color: BRAND.border }}>·</span>
            <span className="inline-flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" style={{ color: BRAND.primary }} />
              AML / CFT 政策
            </span>
            <span style={{ color: BRAND.border }}>·</span>
            <span className="inline-flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" style={{ color: BRAND.primary }} />
              1:1 准备金证明
            </span>
            <span style={{ color: BRAND.border }}>·</span>
            <span className="inline-flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" style={{ color: BRAND.primary }} />
              用户隐私保护
            </span>
          </div>
        </section>

        {/* 实时 KPI */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div style={{ animation: 'fadeUp 0.5s ease-out 0s both' }}>
            <KpiCard icon={Shield} label="综合合规评分" value={kpi.complianceScore} suffix="%" precision={1} isLive color={BRAND.primary} />
          </div>
          <div style={{ animation: 'fadeUp 0.5s ease-out 0.05s both' }}>
            <KpiCard icon={Globe2} label="合规研究方向" value={kpi.jurisdictions} suffix=" 个" isLive color={BRAND.info} />
          </div>
          <div style={{ animation: 'fadeUp 0.5s ease-out 0.1s both' }}>
            <KpiCard icon={FileText} label="内部政策版本" value={kpi.policies} suffix=" 份" color={BRAND.warning} />
          </div>
          <div style={{ animation: 'fadeUp 0.5s ease-out 0.15s both' }}>
            <KpiCard icon={Activity} label="24h 风险事件" value={kpi.riskAlerts} isLive trend="up" trendValue="+1" color={BRAND.danger} />
          </div>
        </section>

        {/* 工具栏 */}
        <section className="flex flex-col md:flex-row gap-3 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: BRAND.textMute }} />
            <input
              id="compliance-search"
              type="text"
              placeholder="搜索司法管辖区 / 政策 / 风险 / 公告（按 / 聚焦）"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-9 py-2.5 rounded-xl text-sm outline-none transition-all"
              style={{
                backgroundColor: BRAND.card,
                border: `1px solid ${BRAND.border}`,
                color: BRAND.text,
              }}
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4"
                style={{ color: BRAND.textMute }}
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setHelpOpen(true)}
              className="px-3 py-2.5 rounded-xl text-sm flex items-center gap-1.5 transition-all hover:scale-105"
              style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}`, color: BRAND.textSub }}
            >
              <Keyboard className="w-3.5 h-3.5" />
              快捷键
            </button>
            <button
              onClick={() => openDrawer('tool', 't-self-check')}
              className="px-4 py-2.5 rounded-xl text-sm font-medium flex items-center gap-1.5"
              style={{ backgroundColor: BRAND.primary, color: BRAND.onPrimary }}
            >
              <Sparkles className="w-3.5 h-3.5" />
              合规自查
            </button>
          </div>
        </section>

        {/* Tab 切换 */}
        <section className="flex gap-1 mb-6 overflow-x-auto pb-2">
          {(
            [
              { key: 'overview' as Tab, label: '全球合规研究方向', icon: Globe2 },
              { key: 'policy' as Tab, label: '政策体系', icon: FileText },
              { key: 'risk' as Tab, label: '风险管理', icon: AlertTriangle },
              { key: 'docs' as Tab, label: '合规文档', icon: BookOpen },
              { key: 'updates' as Tab, label: '合规公告', icon: Clock },
              { key: 'partners' as Tab, label: '研究合作网络', icon: Building2 },
              { key: 'tools' as Tab, label: '用户工具', icon: Sparkles },
            ] as const
          ).map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className="px-4 py-2 rounded-lg text-sm flex items-center gap-1.5 whitespace-nowrap transition-all"
              style={{
                backgroundColor: tab === key ? BRAND.primaryLt : BRAND.card,
                border: `1px solid ${tab === key ? BRAND.primary : BRAND.border}`,
                color: tab === key ? BRAND.primary : BRAND.textSub,
              }}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </section>

        {/* ============== Tab: 全球合规研究方向 ============== */}
        {tab === 'overview' && (
          <>
            {/* 区域过滤 */}
            <section className="mb-4 flex flex-wrap items-center gap-2">
              <div className="text-[11px]" style={{ color: BRAND.textMute }}>
                区域：
              </div>
              {(['all', 'apac', 'emea', 'americas', 'mena'] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setRegionFilter(r)}
                  className="px-3 py-1 rounded-md text-[11px] transition-all"
                  style={{
                    backgroundColor: regionFilter === r ? BRAND.primaryLt : 'transparent',
                    border: `1px solid ${regionFilter === r ? BRAND.primary : BRAND.border}`,
                    color: regionFilter === r ? BRAND.primary : BRAND.textSub,
                  }}
                >
                  {r === 'all' ? '全部' : REGION_LABELS[r]}
                </button>
              ))}
              <div className="text-[11px] ml-4" style={{ color: BRAND.textMute }}>
                状态：
              </div>
              {(['all', 'observe', 'research', 'preparing', 'engaging', 'paused'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className="px-3 py-1 rounded-md text-[11px] transition-all"
                  style={{
                    backgroundColor: statusFilter === s ? BRAND.primaryLt : 'transparent',
                    border: `1px solid ${statusFilter === s ? BRAND.primary : BRAND.border}`,
                    color: statusFilter === s ? BRAND.primary : BRAND.textSub,
                  }}
                >
                  {s === 'all' ? '全部' : STATUS_LABELS[s].label}
                </button>
              ))}
              <div className="ml-auto flex items-center gap-2">
                <span className="text-[11px]" style={{ color: BRAND.textMute }}>
                  排序：
                </span>
                {(['progress', 'risk', 'country'] as const).map((k) => (
                  <button
                    key={k}
                    onClick={() => {
                      if (sortBy === k) setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
                      else setSortBy(k);
                    }}
                    className="px-2 py-1 rounded text-[10px] flex items-center gap-0.5"
                    style={{
                      backgroundColor: sortBy === k ? BRAND.cardHover : 'transparent',
                      color: sortBy === k ? BRAND.text : BRAND.textMute,
                    }}
                  >
                    {k === 'progress' ? '进度' : k === 'risk' ? '风险' : '国家'}
                    {sortBy === k && (sortDir === 'desc' ? <ChevronDown className="w-2.5 h-2.5" /> : <ChevronUp className="w-2.5 h-2.5" />)}
                  </button>
                ))}
              </div>
            </section>

            {/* 司法管辖区卡片 */}
            <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-8">
              {filteredJurisdictions.map((j, i) => (
                <div
                  key={j.id}
                  onClick={() => openDrawer('jurisdiction', j.id)}
                  className="rounded-2xl p-4 transition-all cursor-pointer hover:scale-[1.01]"
                  style={{
                    backgroundColor: BRAND.card,
                    border: `1px solid ${BRAND.border}`,
                    animation: `fadeUp 0.4s ease-out ${i * 0.03}s both`,
                  }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{j.flag}</span>
                      <div>
                        <div className="text-sm font-semibold" style={{ color: BRAND.text }}>
                          {j.country}
                        </div>
                        <div className="text-[10px]" style={{ color: BRAND.textMute }}>
                          {REGION_LABELS[j.region]}
                        </div>
                      </div>
                    </div>
                    <StatusBadge statusKey={j.status} />
                  </div>
                  <div className="text-[11px] mb-3" style={{ color: BRAND.textSub }}>
                    {j.description.slice(0, 70)}...
                  </div>
                  <div className="mb-2">
                    <div className="flex items-center justify-between text-[10px] mb-1" style={{ color: BRAND.textMute }}>
                      <span>研究方向进度</span>
                      <span style={{ color: BRAND.primary }} className="font-mono">
                        {j.researchProgress}%
                      </span>
                    </div>
                    <div
                      className="h-1.5 rounded-full overflow-hidden"
                      style={{ backgroundColor: BRAND.cardElevated }}
                    >
                      <div
                        className="h-full transition-all"
                        style={{
                          width: `${j.researchProgress}%`,
                          backgroundColor: j.researchProgress >= 70 ? BRAND.primary : j.researchProgress >= 40 ? BRAND.amber : BRAND.textMute,
                        }}
                      />
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {j.focusAreas.slice(0, 2).map((f) => (
                      <span
                        key={f}
                        className="text-[9px] px-1.5 py-0.5 rounded"
                        style={{ backgroundColor: BRAND.cardElevated, color: BRAND.textSub }}
                      >
                        {f}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </section>

            {/* 合规体系架构 */}
            <section className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-8">
              {[
                {
                  icon: ShieldCheck,
                  title: '三道防线',
                  en: 'THREE LINES OF DEFENSE',
                  color: BRAND.primary,
                  items: ['业务条线（一道）', '合规与风控（二道）', '内部审计（三道）'],
                },
                {
                  icon: Network,
                  title: '合规研究方向',
                  en: 'COMPLIANCE RESEARCH',
                  color: BRAND.info,
                  items: ['12+ 司法管辖区持续研究', '国际化合规观察方向', '政策快速响应机制'],
                },
                {
                  icon: Eye,
                  title: '透明度公示',
                  en: 'TRANSPARENCY',
                  color: BRAND.amber,
                  items: ['1:1 准备金 + Merkle 证明', '冷钱包公示', '月度/季度报告'],
                },
              ].map((m, i) => (
                <div
                  key={i}
                  className="rounded-2xl p-5 transition-all hover:scale-[1.01]"
                  style={{
                    backgroundColor: BRAND.card,
                    border: `1px solid ${BRAND.border}`,
                    animation: `fadeUp 0.4s ease-out ${i * 0.05}s both`,
                  }}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: `${m.color}22`, color: m.color }}
                    >
                      <m.icon className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold" style={{ color: BRAND.text }}>
                        {m.title}
                      </div>
                      <div className="text-[9px] font-mono" style={{ color: BRAND.textMute }}>
                        {m.en}
                      </div>
                    </div>
                  </div>
                  <ul className="space-y-1.5">
                    {m.items.map((it) => (
                      <li key={it} className="text-[12px] flex items-start gap-2" style={{ color: BRAND.textSub }}>
                        <CheckCircle2 className="w-3 h-3 mt-0.5 flex-shrink-0" style={{ color: m.color }} />
                        <span>{it}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </section>
          </>
        )}

        {/* ============== Tab: 政策体系 ============== */}
        {tab === 'policy' && (
          <section className="space-y-3 mb-8">
            {filteredPolicies.map((p, i) => (
              <div
                key={p.id}
                onClick={() => openDrawer('policy', p.id)}
                className="rounded-2xl p-4 transition-all cursor-pointer hover:scale-[1.005]"
                style={{
                  backgroundColor: BRAND.card,
                  border: `1px solid ${BRAND.border}`,
                  animation: `fadeUp 0.4s ease-out ${i * 0.04}s both`,
                }}
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <FileText className="w-4 h-4" style={{ color: BRAND.primary }} />
                      <span className="text-sm font-semibold" style={{ color: BRAND.text }}>
                        {p.name}
                      </span>
                      <span className="text-[10px] font-mono" style={{ color: BRAND.textMute }}>
                        v{p.version}
                      </span>
                    </div>
                    <div className="text-[12px] mb-2" style={{ color: BRAND.textSub }}>
                      {p.description}
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {p.scope.map((s) => (
                        <span
                          key={s}
                          className="text-[9px] px-1.5 py-0.5 rounded"
                          style={{ backgroundColor: BRAND.cardElevated, color: BRAND.textMute }}
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="text-right">
                    <span
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px]"
                      style={{ backgroundColor: BRAND.successLt, color: BRAND.success }}
                    >
                      <span className="w-1 h-1 rounded-full" style={{ backgroundColor: BRAND.success }} />
                      现行有效
                    </span>
                    <div className="text-[10px] mt-2" style={{ color: BRAND.textMute }}>
                      上次审阅：{p.lastReview}
                    </div>
                    <div className="text-[10px]" style={{ color: BRAND.textMute }}>
                      下次审阅：{p.nextReview}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-3 pt-3" style={{ borderTop: `1px solid ${BRAND.border}` }}>
                  <div>
                    <div className="text-[10px]" style={{ color: BRAND.textMute }}>控制项</div>
                    <div className="text-sm font-mono font-semibold" style={{ color: BRAND.primary }}>
                      {p.controls.length}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px]" style={{ color: BRAND.textMute }}>负责人</div>
                    <div className="text-[11px]" style={{ color: BRAND.text }}>
                      {p.owner}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px]" style={{ color: BRAND.textMute }}>实时监控</div>
                    <div className="text-sm font-mono font-semibold" style={{ color: BRAND.success }}>
                      7×24
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px]" style={{ color: BRAND.textMute }}>复审周期</div>
                    <div className="text-[11px]" style={{ color: BRAND.text }}>
                      半年
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </section>
        )}

        {/* ============== Tab: 风险管理 ============== */}
        {tab === 'risk' && (
          <>
            <section className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              <KpiCard icon={AlertTriangle} label="高风险事件" value={sortedRisks.filter((r) => r.level === 'high' || r.level === 'critical').length} color={BRAND.danger} isLive />
              <KpiCard icon={Activity} label="24h 监控事件" value={kpi.monitoringEvents} color={BRAND.warning} isLive trend="up" trendValue={`+${Math.floor(Math.random() * 5)}`} />
              <KpiCard icon={Shield} label="风险覆盖率" value={97.6} suffix="%" precision={1} color={BRAND.success} />
              <KpiCard icon={Layers} label="风险类别" value={RISKS.length} color={BRAND.info} />
            </section>
            <section className="space-y-3 mb-8">
              {sortedRisks.map((r, i) => {
                const lvlCfg = {
                  critical: { color: BRAND.danger, bg: BRAND.dangerLt, label: '严重' },
                  high: { color: BRAND.danger, bg: BRAND.dangerLt, label: '高' },
                  medium: { color: BRAND.amber, bg: BRAND.amberLt, label: '中' },
                  low: { color: BRAND.success, bg: BRAND.successLt, label: '低' },
                }[r.level];
                return (
                  <div
                    key={r.id}
                    onClick={() => openDrawer('risk', r.id)}
                    className="rounded-2xl p-4 transition-all cursor-pointer hover:scale-[1.005]"
                    style={{
                      backgroundColor: BRAND.card,
                      border: `1px solid ${BRAND.border}`,
                      animation: `fadeUp 0.4s ease-out ${i * 0.04}s both`,
                    }}
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium"
                            style={{ backgroundColor: lvlCfg.bg, color: lvlCfg.color }}
                          >
                            <span className="w-1 h-1 rounded-full" style={{ backgroundColor: lvlCfg.color }} />
                            {lvlCfg.label}
                          </span>
                          <span className="text-sm font-semibold" style={{ color: BRAND.text }}>
                            {r.name}
                          </span>
                          {r.trend === 'rising' && (
                            <span className="inline-flex items-center gap-0.5 text-[10px]" style={{ color: BRAND.danger }}>
                              <TrendingUp className="w-2.5 h-2.5" />
                              +{r.change24h}%
                            </span>
                          )}
                          {r.trend === 'falling' && (
                            <span className="inline-flex items-center gap-0.5 text-[10px]" style={{ color: BRAND.success }}>
                              <TrendingDown className="w-2.5 h-2.5" />
                              {r.change24h}%
                            </span>
                          )}
                        </div>
                        <div className="text-[12px] mb-2" style={{ color: BRAND.textSub }}>
                          {r.description}
                        </div>
                        <div className="text-[10px]" style={{ color: BRAND.textMute }}>
                          框架：{r.framework}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 min-w-[200px]">
                        {r.metrics.slice(0, 2).map((m) => (
                          <div
                            key={m.label}
                            className="p-2 rounded-lg"
                            style={{ backgroundColor: BRAND.cardElevated }}
                          >
                            <div className="text-[9px]" style={{ color: BRAND.textMute }}>
                              {m.label}
                            </div>
                            <div className="text-xs font-mono font-semibold" style={{ color: BRAND.text }}>
                              {m.value}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-3 pt-3" style={{ borderTop: `1px solid ${BRAND.border}` }}>
                      {r.mitigations.slice(0, 4).map((m) => (
                        <span
                          key={m}
                          className="text-[10px] px-1.5 py-0.5 rounded flex items-center gap-1"
                          style={{ backgroundColor: BRAND.successLt, color: BRAND.success }}
                        >
                          <CheckCircle2 className="w-2.5 h-2.5" />
                          {m}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </section>
          </>
        )}

        {/* ============== Tab: 合规文档 ============== */}
        {tab === 'docs' && (
          <>
            <section className="flex flex-wrap gap-2 mb-4">
              {(
                [
                  { key: 'all', label: '全部' },
                  { key: 'terms', label: '服务条款' },
                  { key: 'privacy', label: '隐私协议' },
                  { key: 'aml-policy', label: 'AML 政策' },
                  { key: 'risk-framework', label: '风险框架' },
                  { key: 'data-protection', label: '数据保护' },
                  { key: 'cookie', label: 'Cookie' },
                  { key: 'tax', label: '税务' },
                ] as const
              ).map((t) => (
                <button
                  key={t.key}
                  onClick={() => setDocType(t.key)}
                  className="px-3 py-1.5 rounded-lg text-[12px] transition-all"
                  style={{
                    backgroundColor: docType === t.key ? BRAND.primaryLt : BRAND.card,
                    border: `1px solid ${docType === t.key ? BRAND.primary : BRAND.border}`,
                    color: docType === t.key ? BRAND.primary : BRAND.textSub,
                  }}
                >
                  {t.label}
                </button>
              ))}
            </section>
            <section className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-8">
              {filteredDocs.map((d, i) => (
                <div
                  key={d.id}
                  onClick={() => openDrawer('doc', d.id)}
                  className="rounded-2xl p-4 transition-all cursor-pointer hover:scale-[1.01]"
                  style={{
                    backgroundColor: BRAND.card,
                    border: `1px solid ${BRAND.border}`,
                    animation: `fadeUp 0.4s ease-out ${i * 0.04}s both`,
                  }}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-start gap-3 flex-1">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: BRAND.primaryLt, color: BRAND.primary }}
                      >
                        <FileText className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-semibold mb-0.5" style={{ color: BRAND.text }}>
                          {d.name}
                        </div>
                        <div className="text-[10px] flex items-center gap-2" style={{ color: BRAND.textMute }}>
                          <span>v{d.version}</span>
                          <span>·</span>
                          <span>{d.pages} 页</span>
                          <span>·</span>
                          <span>生效 {d.effectiveDate}</span>
                        </div>
                      </div>
                    </div>
                    <span
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px]"
                      style={{ backgroundColor: BRAND.successLt, color: BRAND.success }}
                    >
                      <CheckCircle2 className="w-2.5 h-2.5" />
                      现行
                    </span>
                  </div>
                  <div className="text-[12px] mb-3" style={{ color: BRAND.textSub }}>
                    {d.description}
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {d.highlights.map((h) => (
                      <span
                        key={h}
                        className="text-[9px] px-1.5 py-0.5 rounded"
                        style={{ backgroundColor: BRAND.cardElevated, color: BRAND.textMute }}
                      >
                        {h}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </section>
          </>
        )}

        {/* ============== Tab: 合规公告 ============== */}
        {tab === 'updates' && (
          <section className="space-y-3 mb-8">
            {filteredUpdates.map((u, i) => (
              <div
                key={u.id}
                onClick={() => openDrawer('update', u.id)}
                className="rounded-2xl p-4 transition-all cursor-pointer hover:scale-[1.005]"
                style={{
                  backgroundColor: BRAND.card,
                  border: `1px solid ${BRAND.border}`,
                  animation: `fadeUp 0.4s ease-out ${i * 0.03}s both`,
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <ImportanceBadge level={u.importance} />
                      <span
                        className="text-[9px] px-1.5 py-0.5 rounded"
                        style={{ backgroundColor: BRAND.cardElevated, color: BRAND.textSub }}
                      >
                        {u.category.toUpperCase()}
                      </span>
                      <span
                        className="text-[9px] px-1.5 py-0.5 rounded"
                        style={{ backgroundColor: BRAND.infoLt, color: BRAND.info }}
                      >
                        {REGION_LABELS[u.region as RegionKey] || '全球'}
                      </span>
                    </div>
                    <div className="text-sm font-semibold mb-1" style={{ color: BRAND.text }}>
                      {u.title}
                    </div>
                    <div className="text-[12px]" style={{ color: BRAND.textSub }}>
                      {u.summary}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-[10px] font-mono" style={{ color: BRAND.textMute }}>
                      {u.date}
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 mt-1 ml-auto" style={{ color: BRAND.textMute }} />
                  </div>
                </div>
              </div>
            ))}
          </section>
        )}

        {/* ============== Tab: 研究合作网络 ============== */}
        {tab === 'partners' && (
          <section className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-8">
            {filteredPartners.map((p, i) => (
              <div
                key={p.id}
                onClick={() => openDrawer('partner', p.id)}
                className="rounded-2xl p-4 transition-all cursor-pointer hover:scale-[1.01]"
                style={{
                  backgroundColor: BRAND.card,
                  border: `1px solid ${BRAND.border}`,
                  animation: `fadeUp 0.4s ease-out ${i * 0.04}s both`,
                }}
              >
                <div className="flex items-start gap-3 mb-2">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: BRAND.primaryLt, color: BRAND.primary }}
                  >
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-semibold mb-0.5" style={{ color: BRAND.text }}>
                      {p.name}
                    </div>
                    <div className="text-[10px]" style={{ color: BRAND.textMute }}>
                      合作起始 {p.since} · {REGION_LABELS[p.region]}
                    </div>
                  </div>
                </div>
                <div className="text-[12px] mb-2" style={{ color: BRAND.textSub }}>
                  {p.serviceScope}
                </div>
                <div className="flex flex-wrap gap-1">
                  {p.certifications.map((c) => (
                    <span
                      key={c}
                      className="text-[9px] px-1.5 py-0.5 rounded flex items-center gap-1"
                      style={{ backgroundColor: BRAND.primaryLt, color: BRAND.primary }}
                    >
                      <Award className="w-2.5 h-2.5" />
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </section>
        )}

        {/* ============== Tab: 用户工具 ============== */}
        {tab === 'tools' && (
          <>
            <section className="flex flex-wrap gap-2 mb-4">
              {(
                [
                  { key: 'all', label: '全部工具' },
                  { key: 'self-check', label: '合规自查' },
                  { key: 'risk-calc', label: '风险计算' },
                  { key: 'document', label: '合规文档' },
                  { key: 'training', label: '培训课程' },
                  { key: 'api', label: 'API 接口' },
                ] as const
              ).map((t) => (
                <button
                  key={t.key}
                  onClick={() => setToolCategory(t.key)}
                  className="px-3 py-1.5 rounded-lg text-[12px] transition-all"
                  style={{
                    backgroundColor: toolCategory === t.key ? BRAND.primaryLt : BRAND.card,
                    border: `1px solid ${toolCategory === t.key ? BRAND.primary : BRAND.border}`,
                    color: toolCategory === t.key ? BRAND.primary : BRAND.textSub,
                  }}
                >
                  {t.label}
                </button>
              ))}
            </section>
            <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-8">
              {filteredTools.map((t, i) => (
                <div
                  key={t.id}
                  onClick={() => openDrawer('tool', t.id)}
                  className="rounded-2xl p-5 transition-all cursor-pointer hover:scale-[1.02]"
                  style={{
                    backgroundColor: BRAND.card,
                    border: `1px solid ${BRAND.border}`,
                    animation: `fadeUp 0.4s ease-out ${i * 0.05}s both`,
                  }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: BRAND.primaryLt, color: BRAND.primary }}
                    >
                      <Sparkles className="w-6 h-6" />
                    </div>
                    <span
                      className="text-[9px] px-1.5 py-0.5 rounded"
                      style={{
                        backgroundColor: t.status === 'open' ? BRAND.successLt : BRAND.amberLt,
                        color: t.status === 'open' ? BRAND.success : BRAND.amber,
                      }}
                    >
                      {t.status === 'open' ? '已开放' : t.status === 'beta' ? '内测中' : '即将开放'}
                    </span>
                  </div>
                  <div className="text-sm font-semibold mb-1" style={{ color: BRAND.text }}>
                    {t.name}
                  </div>
                  <div className="text-[11px] mb-3" style={{ color: BRAND.textSub }}>
                    {t.description}
                  </div>
                  <div className="flex items-center justify-between text-[10px] pt-2" style={{ borderTop: `1px solid ${BRAND.border}`, color: BRAND.textMute }}>
                    <span className="flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5" />
                      {t.estimatedTime}
                    </span>
                    <span style={{ color: BRAND.primary }}>{t.highlight}</span>
                  </div>
                </div>
              ))}
            </section>
          </>
        )}

        {/* ============== 用户教育 / 自查工具 ============== */}
        <section className="rounded-2xl p-6 mb-8" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
          <div className="flex items-center gap-3 mb-4">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: BRAND.primaryLt, color: BRAND.primary }}
            >
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-semibold" style={{ color: BRAND.text }}>
                用户合规教育与自查工具
              </h2>
              <p className="text-[12px]" style={{ color: BRAND.textSub }}>
                通过这些工具，您可以了解自己的账户合规状态、学习反洗钱基础知识、查询监管动态。
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            {[
              { icon: ScanFace, label: '身份核验自查', desc: '确认 KYC 状态' },
              { icon: Scale, label: '交易限额查询', desc: '查看分级额度' },
              { icon: BookOpen, label: 'AML 学习中心', desc: '反洗钱基础' },
              { icon: MessageCircle, label: '合规咨询', desc: '在线咨询入口' },
            ].map((it) => (
              <div
                key={it.label}
                onClick={() => openDrawer('tool', 't-self-check')}
                className="p-3 rounded-xl cursor-pointer transition-all hover:scale-[1.02]"
                style={{ backgroundColor: BRAND.cardElevated, border: `1px solid ${BRAND.border}` }}
              >
                <it.icon className="w-5 h-5 mb-2" style={{ color: BRAND.primary }} />
                <div className="text-[12px] font-semibold" style={{ color: BRAND.text }}>
                  {it.label}
                </div>
                <div className="text-[10px]" style={{ color: BRAND.textMute }}>
                  {it.desc}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ============== 底部 CTA ============== */}
        <section
          className="rounded-2xl p-6 mb-8 text-center"
          style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}
        >
          <Shield className="w-10 h-10 mx-auto mb-3" style={{ color: BRAND.primary }} />
          <h2 className="text-xl font-bold mb-2" style={{ color: BRAND.text }}>
            合规与透明是中萨的长期承诺
          </h2>
          <p className="text-sm max-w-2xl mx-auto mb-4" style={{ color: BRAND.textSub }}>
            ZSDEX 将持续投入合规研究资源，与全球监管机构、行业协会、研究机构保持沟通，
            构建工业级合规与透明度体系。如需了解详情，请联系合规研究组。
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <button
              className="px-5 py-2.5 rounded-xl text-sm font-medium flex items-center gap-1.5"
              style={{ backgroundColor: BRAND.primary, color: BRAND.onPrimary }}
            >
              <Mail className="w-4 h-4" />
              联系合规研究组
            </button>
            <button
              className="px-5 py-2.5 rounded-xl text-sm font-medium flex items-center gap-1.5"
              style={{ backgroundColor: BRAND.cardElevated, color: BRAND.text, border: `1px solid ${BRAND.border}` }}
            >
              <FileText className="w-4 h-4" />
              下载合规白皮书
            </button>
            <button
              onClick={() => openDrawer('tool', 't-self-check')}
              className="px-5 py-2.5 rounded-xl text-sm font-medium flex items-center gap-1.5"
              style={{ backgroundColor: BRAND.cardElevated, color: BRAND.text, border: `1px solid ${BRAND.border}` }}
            >
              <Sparkles className="w-4 h-4" />
              开始合规自查
            </button>
          </div>
        </section>
      </div>

      {/* ============== Drawer ============== */}
      {drawer.open && drawerContent && (
        <>
          <div
            className="fixed inset-0 z-40 transition-opacity"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.75)' }}
            onClick={closeDrawer}
          />
          <div
            className="fixed right-0 top-0 bottom-0 w-full max-w-2xl z-50 overflow-y-auto"
            style={{
              backgroundColor: BRAND.cardElevated,
              borderLeft: `1px solid ${BRAND.border}`,
              animation: 'slideIn 0.3s ease-out',
            }}
          >
            <div className="sticky top-0 z-10 p-4 flex items-center justify-between" style={{ backgroundColor: BRAND.cardElevated, borderBottom: `1px solid ${BRAND.border}` }}>
              <div>
                <div className="text-base font-semibold" style={{ color: BRAND.text }}>
                  {drawerContent.title}
                </div>
                <div className="text-[11px] mt-0.5" style={{ color: BRAND.textSub }}>
                  {drawerContent.subtitle}
                </div>
              </div>
              <button
                onClick={closeDrawer}
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: BRAND.card, color: BRAND.textSub }}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5">
              {drawerContent.type === 'jurisdiction' && (() => {
                const j = drawerContent.data as Jurisdiction;
                return (
                  <>
                    <div className="flex items-center gap-3 mb-4">
                      <span className="text-3xl">{j.flag}</span>
                      <div>
                        <div className="text-lg font-bold" style={{ color: BRAND.text }}>
                          {j.country}
                        </div>
                        <div className="text-[12px]" style={{ color: BRAND.textSub }}>
                          {REGION_LABELS[j.region]}
                        </div>
                      </div>
                      <div className="ml-auto">
                        <StatusBadge statusKey={j.status} />
                      </div>
                    </div>
                    <div className="text-[13px] mb-4" style={{ color: BRAND.textSub }}>
                      {j.description}
                    </div>

                    <div className="mb-4">
                      <div className="text-[11px] font-semibold mb-2" style={{ color: BRAND.textMute }}>
                        研究方向进度
                      </div>
                      <div
                        className="h-2 rounded-full overflow-hidden"
                        style={{ backgroundColor: BRAND.card }}
                      >
                        <div
                          className="h-full"
                          style={{
                            width: `${j.researchProgress}%`,
                            backgroundColor: BRAND.primary,
                          }}
                        />
                      </div>
                      <div className="text-right text-[10px] mt-1" style={{ color: BRAND.textMute }}>
                        {j.researchProgress}%
                      </div>
                    </div>

                    <div className="mb-4">
                      <div className="text-[11px] font-semibold mb-2" style={{ color: BRAND.textMute }}>
                        重点研究方向
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {j.focusAreas.map((f) => (
                          <div
                            key={f}
                            className="p-2 rounded-lg text-[12px]"
                            style={{ backgroundColor: BRAND.card, color: BRAND.text }}
                          >
                            <CheckCircle2 className="w-3 h-3 inline mr-1" style={{ color: BRAND.primary }} />
                            {f}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="mb-4">
                      <div className="text-[11px] font-semibold mb-2" style={{ color: BRAND.textMute }}>
                        研究方向亮点
                      </div>
                      <ul className="space-y-1.5">
                        {j.highlights.map((h) => (
                          <li key={h} className="text-[12px] flex items-start gap-2" style={{ color: BRAND.textSub }}>
                            <ChevronRight className="w-3 h-3 mt-0.5 flex-shrink-0" style={{ color: BRAND.primary }} />
                            <span>{h}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="mb-4">
                      <div className="text-[11px] font-semibold mb-2" style={{ color: BRAND.textMute }}>
                        风险等级
                      </div>
                      <span
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px]"
                        style={{
                          backgroundColor: j.riskLevel === 'high' ? BRAND.dangerLt : j.riskLevel === 'medium' ? BRAND.amberLt : BRAND.successLt,
                          color: j.riskLevel === 'high' ? BRAND.danger : j.riskLevel === 'medium' ? BRAND.amber : BRAND.success,
                        }}
                      >
                        {j.riskLevel === 'high' ? '高风险' : j.riskLevel === 'medium' ? '中风险' : '低风险'}
                      </span>
                    </div>

                    <div className="mb-4">
                      <div className="text-[11px] font-semibold mb-2" style={{ color: BRAND.textMute }}>
                        对接研究组
                      </div>
                      {j.contacts.map((c) => (
                        <div
                          key={c.name}
                          className="p-2 rounded-lg mb-1 flex items-center gap-2"
                          style={{ backgroundColor: BRAND.card }}
                        >
                          <Users className="w-3.5 h-3.5" style={{ color: BRAND.primary }} />
                          <div className="flex-1">
                            <div className="text-[12px] font-semibold" style={{ color: BRAND.text }}>
                              {c.name}
                            </div>
                            <div className="text-[10px]" style={{ color: BRAND.textMute }}>
                              {c.role}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="text-[10px] mb-3" style={{ color: BRAND.textMute }}>
                      上次更新：{j.lastUpdate}
                    </div>

                    <div className="text-[10px] p-3 rounded-lg" style={{ backgroundColor: BRAND.warningLt, color: BRAND.amber }}>
                      <AlertTriangle className="w-3 h-3 inline mr-1" />
                      重要声明：ZSDEX 在该地区仅开展合规研究方向，并未在当地取得或宣称持牌经营。
                    </div>
                  </>
                );
              })()}

              {drawerContent.type === 'policy' && (() => {
                const p = drawerContent.data as PolicyItem;
                return (
                  <>
                    <div className="flex items-center gap-2 mb-3">
                      <FileText className="w-5 h-5" style={{ color: BRAND.primary }} />
                      <span className="text-lg font-bold" style={{ color: BRAND.text }}>
                        {p.name}
                      </span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded" style={{ backgroundColor: BRAND.card, color: BRAND.textMute }}>
                        v{p.version}
                      </span>
                    </div>
                    <div className="text-[13px] mb-4" style={{ color: BRAND.textSub }}>
                      {p.description}
                    </div>
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="p-2 rounded-lg" style={{ backgroundColor: BRAND.card }}>
                        <div className="text-[10px]" style={{ color: BRAND.textMute }}>负责人</div>
                        <div className="text-[12px] font-semibold" style={{ color: BRAND.text }}>{p.owner}</div>
                      </div>
                      <div className="p-2 rounded-lg" style={{ backgroundColor: BRAND.card }}>
                        <div className="text-[10px]" style={{ color: BRAND.textMute }}>状态</div>
                        <div className="text-[12px] font-semibold" style={{ color: BRAND.success }}>现行有效</div>
                      </div>
                      <div className="p-2 rounded-lg" style={{ backgroundColor: BRAND.card }}>
                        <div className="text-[10px]" style={{ color: BRAND.textMute }}>上次审阅</div>
                        <div className="text-[12px] font-mono" style={{ color: BRAND.text }}>{p.lastReview}</div>
                      </div>
                      <div className="p-2 rounded-lg" style={{ backgroundColor: BRAND.card }}>
                        <div className="text-[10px]" style={{ color: BRAND.textMute }}>下次审阅</div>
                        <div className="text-[12px] font-mono" style={{ color: BRAND.text }}>{p.nextReview}</div>
                      </div>
                    </div>
                    <div className="mb-4">
                      <div className="text-[11px] font-semibold mb-2" style={{ color: BRAND.textMute }}>
                        适用范围
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {p.scope.map((s) => (
                          <span
                            key={s}
                            className="text-[10px] px-1.5 py-0.5 rounded"
                            style={{ backgroundColor: BRAND.card, color: BRAND.text }}
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="mb-4">
                      <div className="text-[11px] font-semibold mb-2" style={{ color: BRAND.textMute }}>
                        控制项 ({p.controls.length})
                      </div>
                      <div className="space-y-2">
                        {p.controls.map((c) => {
                          const tcfg = {
                            prevent: { color: BRAND.primary, bg: BRAND.primaryLt, label: 'PREVENT' },
                            detect: { color: BRAND.amber, bg: BRAND.amberLt, label: 'DETECT' },
                            respond: { color: BRAND.danger, bg: BRAND.dangerLt, label: 'RESPOND' },
                          }[c.type];
                          return (
                            <div
                              key={c.id}
                              className="p-2 rounded-lg flex items-center gap-2"
                              style={{ backgroundColor: BRAND.card }}
                            >
                              <span
                                className="text-[9px] px-1.5 py-0.5 rounded font-mono"
                                style={{ backgroundColor: tcfg.bg, color: tcfg.color }}
                              >
                                {tcfg.label}
                              </span>
                              <div className="flex-1">
                                <div className="text-[12px]" style={{ color: BRAND.text }}>{c.name}</div>
                                <div className="text-[10px]" style={{ color: BRAND.textMute }}>{c.frequency}</div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </>
                );
              })()}

              {drawerContent.type === 'risk' && (() => {
                const r = drawerContent.data as RiskItem;
                return (
                  <>
                    <div className="flex items-center gap-2 mb-3">
                      <AlertTriangle className="w-5 h-5" style={{ color: BRAND.danger }} />
                      <span className="text-lg font-bold" style={{ color: BRAND.text }}>{r.name}</span>
                    </div>
                    <div className="text-[13px] mb-4" style={{ color: BRAND.textSub }}>{r.description}</div>
                    <div className="mb-4">
                      <div className="text-[11px] font-semibold mb-2" style={{ color: BRAND.textMute }}>关键指标</div>
                      <div className="grid grid-cols-2 gap-2">
                        {r.metrics.map((m) => (
                          <div key={m.label} className="p-3 rounded-lg" style={{ backgroundColor: BRAND.card }}>
                            <div className="text-[10px]" style={{ color: BRAND.textMute }}>{m.label}</div>
                            <div className="text-base font-mono font-semibold" style={{ color: BRAND.text }}>{m.value}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="mb-4">
                      <div className="text-[11px] font-semibold mb-2" style={{ color: BRAND.textMute }}>缓解措施</div>
                      <ul className="space-y-1.5">
                        {r.mitigations.map((m) => (
                          <li key={m} className="text-[12px] flex items-start gap-2" style={{ color: BRAND.text }}>
                            <CheckCircle2 className="w-3 h-3 mt-0.5 flex-shrink-0" style={{ color: BRAND.success }} />
                            <span>{m}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="text-[10px]" style={{ color: BRAND.textMute }}>
                      框架：{r.framework}
                    </div>
                  </>
                );
              })()}

              {drawerContent.type === 'update' && (() => {
                const u = drawerContent.data as ComplianceUpdate;
                return (
                  <>
                    <div className="flex items-center gap-2 mb-3 flex-wrap">
                      <ImportanceBadge level={u.importance} />
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded" style={{ backgroundColor: BRAND.card, color: BRAND.textMute }}>
                        {u.category.toUpperCase()}
                      </span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded" style={{ backgroundColor: BRAND.card, color: BRAND.textMute }}>
                        {REGION_LABELS[u.region as RegionKey] || '全球'}
                      </span>
                    </div>
                    <div className="text-lg font-bold mb-2" style={{ color: BRAND.text }}>{u.title}</div>
                    <div className="text-[10px] mb-3 font-mono" style={{ color: BRAND.textMute }}>
                      发布日期：{u.date}
                    </div>
                    <div className="text-[13px] mb-4" style={{ color: BRAND.textSub }}>{u.summary}</div>
                    <div className="text-[11px] p-3 rounded-lg" style={{ backgroundColor: BRAND.primaryLt, color: BRAND.primary }}>
                      <CheckCircle2 className="w-3 h-3 inline mr-1" />
                      本公告已通过合规研究组审核并发布至所有相关用户。
                    </div>
                  </>
                );
              })()}

              {drawerContent.type === 'partner' && (() => {
                const p = drawerContent.data as Partner;
                return (
                  <>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: BRAND.primaryLt, color: BRAND.primary }}>
                        <Building2 className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="text-lg font-bold" style={{ color: BRAND.text }}>{p.name}</div>
                        <div className="text-[10px]" style={{ color: BRAND.textMute }}>合作起始 {p.since}</div>
                      </div>
                    </div>
                    <div className="text-[13px] mb-4" style={{ color: BRAND.textSub }}>{p.description}</div>
                    <div className="mb-4">
                      <div className="text-[11px] font-semibold mb-2" style={{ color: BRAND.textMute }}>服务范围</div>
                      <div className="p-3 rounded-lg text-[12px]" style={{ backgroundColor: BRAND.card, color: BRAND.text }}>
                        {p.serviceScope}
                      </div>
                    </div>
                    <div className="mb-4">
                      <div className="text-[11px] font-semibold mb-2" style={{ color: BRAND.textMute }}>覆盖区域</div>
                      <div className="text-[12px] px-3 py-1.5 rounded-lg inline-block" style={{ backgroundColor: BRAND.infoLt, color: BRAND.info }}>
                        {REGION_LABELS[p.region]}
                      </div>
                    </div>
                    <div className="mb-4">
                      <div className="text-[11px] font-semibold mb-2" style={{ color: BRAND.textMute }}>合作类型</div>
                      <div className="flex flex-wrap gap-1">
                        {p.certifications.map((c) => (
                          <span key={c} className="text-[10px] px-1.5 py-0.5 rounded flex items-center gap-1" style={{ backgroundColor: BRAND.primaryLt, color: BRAND.primary }}>
                            <Award className="w-2.5 h-2.5" />
                            {c}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="text-[10px] p-3 rounded-lg" style={{ backgroundColor: BRAND.warningLt, color: BRAND.amber }}>
                      <AlertTriangle className="w-3 h-3 inline mr-1" />
                      重要声明：上述合作方为合规研究合作方，与平台持牌经营无关。
                    </div>
                  </>
                );
              })()}

              {drawerContent.type === 'doc' && (() => {
                const d = drawerContent.data as Doc;
                return (
                  <>
                    <div className="flex items-center gap-2 mb-3">
                      <FileText className="w-5 h-5" style={{ color: BRAND.primary }} />
                      <span className="text-lg font-bold" style={{ color: BRAND.text }}>{d.name}</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded" style={{ backgroundColor: BRAND.card, color: BRAND.textMute }}>
                        v{d.version}
                      </span>
                    </div>
                    <div className="text-[13px] mb-4" style={{ color: BRAND.textSub }}>{d.description}</div>
                    <div className="grid grid-cols-3 gap-2 mb-4">
                      <div className="p-2 rounded-lg" style={{ backgroundColor: BRAND.card }}>
                        <div className="text-[10px]" style={{ color: BRAND.textMute }}>版本</div>
                        <div className="text-sm font-mono" style={{ color: BRAND.text }}>{d.version}</div>
                      </div>
                      <div className="p-2 rounded-lg" style={{ backgroundColor: BRAND.card }}>
                        <div className="text-[10px]" style={{ color: BRAND.textMute }}>页数</div>
                        <div className="text-sm font-mono" style={{ color: BRAND.text }}>{d.pages}</div>
                      </div>
                      <div className="p-2 rounded-lg" style={{ backgroundColor: BRAND.card }}>
                        <div className="text-[10px]" style={{ color: BRAND.textMute }}>生效日期</div>
                        <div className="text-sm font-mono" style={{ color: BRAND.text }}>{d.effectiveDate}</div>
                      </div>
                    </div>
                    <div className="mb-4">
                      <div className="text-[11px] font-semibold mb-2" style={{ color: BRAND.textMute }}>内容亮点</div>
                      <ul className="space-y-1.5">
                        {d.highlights.map((h) => (
                          <li key={h} className="text-[12px] flex items-start gap-2" style={{ color: BRAND.textSub }}>
                            <ChevronRight className="w-3 h-3 mt-0.5 flex-shrink-0" style={{ color: BRAND.primary }} />
                            <span>{h}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="flex gap-2">
                      <button className="flex-1 py-2.5 rounded-lg text-sm font-medium flex items-center justify-center gap-1.5" style={{ backgroundColor: BRAND.primary, color: BRAND.onPrimary }}>
                        <FileText className="w-3.5 h-3.5" />
                        阅读全文
                      </button>
                      <button className="px-4 py-2.5 rounded-lg text-sm" style={{ backgroundColor: BRAND.card, color: BRAND.textSub, border: `1px solid ${BRAND.border}` }}>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </>
                );
              })()}

              {drawerContent.type === 'tool' && (() => {
                const t = drawerContent.data as Tool;
                return (
                  <>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: BRAND.primaryLt, color: BRAND.primary }}>
                        <Sparkles className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="text-lg font-bold" style={{ color: BRAND.text }}>{t.name}</div>
                        <div className="text-[10px]" style={{ color: BRAND.textMute }}>预计 {t.estimatedTime}</div>
                      </div>
                    </div>
                    <div className="text-[13px] mb-4" style={{ color: BRAND.textSub }}>{t.description}</div>
                    <div className="p-3 rounded-lg mb-4" style={{ backgroundColor: BRAND.primaryLt }}>
                      <div className="text-[10px] mb-1" style={{ color: BRAND.textMute }}>状态</div>
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px]" style={{ backgroundColor: t.status === 'open' ? BRAND.successLt : BRAND.amberLt, color: t.status === 'open' ? BRAND.success : BRAND.amber }}>
                          {t.status === 'open' ? '已开放' : t.status === 'beta' ? '内测中' : '即将开放'}
                        </span>
                        <span className="text-[10px]" style={{ color: BRAND.primary }}>{t.highlight}</span>
                      </div>
                    </div>
                    <button className="w-full py-2.5 rounded-lg text-sm font-medium" style={{ backgroundColor: BRAND.primary, color: BRAND.onPrimary }}>
                      立即使用
                    </button>
                  </>
                );
              })()}
            </div>
          </div>
        </>
      )}

      {/* ============== Help Drawer ============== */}
      {helpOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.75)' }}
            onClick={() => setHelpOpen(false)}
          />
          <div
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md z-50 rounded-2xl p-5"
            style={{ backgroundColor: BRAND.cardElevated, border: `1px solid ${BRAND.border}` }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Keyboard className="w-4 h-4" style={{ color: BRAND.primary }} />
                <span className="text-sm font-semibold" style={{ color: BRAND.text }}>键盘快捷键</span>
              </div>
              <button onClick={() => setHelpOpen(false)} className="w-6 h-6 rounded flex items-center justify-center" style={{ backgroundColor: BRAND.card, color: BRAND.textSub }}>
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="space-y-2">
              {[
                { k: '/', v: '聚焦搜索框' },
                { k: '?', v: '打开此帮助' },
                { k: 'Esc', v: '关闭抽屉 / 弹窗' },
                { k: '1-7', v: '切换 Tab（合规方向 / 政策 / 风险 / 文档 / 公告 / 合作 / 工具）' },
              ].map((s) => (
                <div key={s.k} className="flex items-center justify-between text-[12px] p-2 rounded-lg" style={{ backgroundColor: BRAND.card }}>
                  <span className="font-mono px-2 py-0.5 rounded text-[11px]" style={{ backgroundColor: BRAND.cardElevated, color: BRAND.primary }}>
                    {s.k}
                  </span>
                  <span style={{ color: BRAND.textSub }}>{s.v}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* ============== 动画 CSS ============== */}
      <style jsx>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideIn {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}

export default PortalCompliance;
