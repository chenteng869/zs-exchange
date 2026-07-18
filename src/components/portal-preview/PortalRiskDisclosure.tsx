'use client';

/**
 * PortalRiskDisclosure - 数字资产投资风险披露声明（2026-07-19 Q05 P3.15）
 *
 * 页面定位：
 * - 中萨数字科技交易所数字资产投资风险披露声明中心
 * - 风险等级 / 资产风险 / 交易风险 / 用户测评 / 历史案例 / 投资者教育 / 紧急应对
 * - 标准风险披露页面，自然符合合规要求
 *
 * L4 工业级设计标准：
 * - 暗色 v6 纯黑 #000000 + 卡片 #141414 + ZSDEX 绿 primary #14B881
 * - 10+ 区块：Hero / 实时 KPI / 风险等级 / 资产风险 / 交易风险 / 风险测评 / 历史案例 / 投资者教育 / 紧急应对 / 底部 CTA
 * - 8+ 交互：搜索 / 排序 / Tab / 风险等级过滤 / 测评 / 详情 Drawer / 快捷键 / 实时过滤
 * - 4+ Drawer：风险详情 / 资产风险 / 案例详情 / 教育课程
 * - 4+ 实时数据：风险事件 / 在线提醒 / 教育完成 / 测评参与
 * - 4+ 动画：Stagger / CountUp / Hover / Pulse
 *
 * 合规要点（Q05 硬约束）：
 * - 不接真实 API，所有数据使用 mock 占位
 * - 状态徽章统一使用 STATUS 枚举
 * - 不修改旧官网 / 旧 H5 / disabled pages
 * - 本页是风险披露，强调风险提示，符合监管方向
 */

import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
  Search,
  X,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  AlertTriangle,
  Shield,
  ShieldAlert,
  ShieldCheck,
  TrendingUp,
  TrendingDown,
  Activity,
  Zap,
  Eye,
  BookOpen,
  GraduationCap,
  Users,
  Clock,
  CheckCircle2,
  XCircle,
  Info,
  HelpCircle,
  Keyboard,
  FileText,
  Sparkles,
  Award,
  Target,
  Briefcase,
  Wallet,
  Coins,
  Database,
  Network,
  Server,
  Cloud,
  Lock,
  KeyRound,
  Fingerprint,
  ScanFace,
  Building2,
  BarChart3,
  PieChart as PieIcon,
  Layers,
  Plus,
  Minus,
  Copy,
  ExternalLink,
  Phone,
  Mail,
  MessageCircle,
  Hash,
  Cpu,
  Globe2,
  Compass,
  Map,
  Flag,
  ArrowUpRight,
  ArrowDownLeft,
  Calculator,
  LineChart,
  History,
  PlayCircle,
  Download,
} from 'lucide-react';
import { BRAND, STATUS } from './brand';

// ============== 类型 ==============

type RiskLevel = 'extreme' | 'high' | 'medium' | 'low';
type AssetCategory = 'major' | 'defi' | 'meme' | 'stable' | 'l2' | 'rwa' | 'nft';
type TradeType = 'spot' | 'futures' | 'margin' | 'options' | 'liquidity' | 'staking';
type QuizKey = 'experience' | 'tolerance' | 'goal' | 'horizon' | 'knowledge';
type Tab = 'overview' | 'assets' | 'trading' | 'cases' | 'education' | 'assessment' | 'emergency';

interface RiskCategory {
  id: string;
  level: RiskLevel;
  name: string;
  enName: string;
  description: string;
  impact: string;
  likelihood: number; // 0-100
  mitigations: string[];
  examples: string[];
  icon: React.ElementType;
}

interface AssetRisk {
  id: string;
  symbol: string;
  name: string;
  category: AssetCategory;
  volatility: number; // % 30d
  liquidity: 'high' | 'medium' | 'low';
  centralization: 'high' | 'medium' | 'low';
  regulatoryRisk: RiskLevel;
  technicalRisk: RiskLevel;
  marketRisk: RiskLevel;
  riskScore: number; // 0-100
  description: string;
  warnings: string[];
}

interface TradeRisk {
  id: string;
  type: TradeType;
  name: string;
  leverage?: string;
  description: string;
  keyRisks: string[];
  riskScore: number;
  safeguards: string[];
  requiredExperience: string;
  status: 'open' | 'beta' | 'soon';
}

interface RiskCase {
  id: string;
  date: string;
  title: string;
  category: 'market' | 'tech' | 'compliance' | 'liquidity' | 'operational';
  impact: 'global' | 'regional' | 'platform' | 'asset';
  lossScale: string;
  description: string;
  lesson: string;
  prevention: string[];
}

interface EduResource {
  id: string;
  title: string;
  type: 'article' | 'video' | 'course' | 'webinar' | 'doc' | 'tool';
  duration: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  topic: string;
  description: string;
  enrolled: number;
  rating: number;
  status: 'open' | 'beta' | 'soon';
}

interface QuizQuestion {
  id: string;
  key: QuizKey;
  question: string;
  options: { value: number; label: string; description: string }[];
  weight: number;
}

interface AssessmentResult {
  totalScore: number;
  level: RiskLevel;
  suggestion: string;
  productAccess: string[];
  riskCapacity: string;
}

interface EmergencyStep {
  id: number;
  title: string;
  description: string;
  action: string;
  estimatedTime: string;
  icon: React.ElementType;
  hot?: boolean;
}

interface DrawerState {
  open: boolean;
  type: 'category' | 'asset' | 'case' | 'edu' | 'trade' | 'help' | null;
  payload: string | null;
}

// ============== Mock 数据 ==============

const RISK_CATEGORIES: RiskCategory[] = [
  {
    id: 'market',
    level: 'high',
    name: '市场风险',
    enName: 'Market Risk',
    description: '数字资产价格受市场情绪、宏观经济、政策变动、技术演进等多重因素影响，可能在短时间内出现剧烈波动。',
    impact: '可能导致投资本金部分或全部损失。',
    likelihood: 85,
    mitigations: [
      '分散投资组合，避免单一资产过度集中',
      '设置止损单，限定单笔最大损失',
      '定期审视持仓结构',
      '避免使用高杠杆',
    ],
    examples: ['2022 年 LUNA 崩盘', '2020 年 3·12 加密市场暴跌', 'BTC 单日跌幅超 30%'],
    icon: TrendingDown,
  },
  {
    id: 'liquidity',
    level: 'medium',
    name: '流动性风险',
    enName: 'Liquidity Risk',
    description: '在极端市场情况下，订单簿深度不足可能导致无法以合理价格快速平仓或变现。',
    impact: '可能产生显著滑点损失。',
    likelihood: 45,
    mitigations: [
      '优先选择主流、高流动性资产',
      '避开交易深度低的时段',
      '大额订单使用限价单',
    ],
    examples: ['小币种闪崩', '极端行情下盘口挤空', '长尾资产退出困难'],
    icon: Activity,
  },
  {
    id: 'tech',
    level: 'medium',
    name: '技术风险',
    enName: 'Technology Risk',
    description: '智能合约漏洞、链上协议被攻击、私钥泄露、平台系统故障等可能造成资产损失。',
    impact: '可能导致资产被盗、无法访问或永久损失。',
    likelihood: 35,
    mitigations: [
      '使用硬件钱包存储大额资产',
      '启用多因素身份认证',
      '定期检查智能合约审计报告',
      '分散资产存放（冷热钱包分离）',
    ],
    examples: ['跨链桥被攻击', 'DeFi 协议漏洞', '私钥泄露'],
    icon: Cpu,
  },
  {
    id: 'compliance',
    level: 'high',
    name: '合规与监管风险',
    enName: 'Compliance Risk',
    description: '各司法管辖区监管政策持续演进，监管要求变化可能影响特定产品、服务或资产的可获得性。',
    impact: '可能导致特定服务暂停、资产下架或合规要求提高。',
    likelihood: 70,
    mitigations: [
      '持续关注监管动态',
      '选择合规研究方向良好的平台',
      '保留完整交易记录',
      '完成 KYC / KYB 认证',
    ],
    examples: ['某地区交易禁令', '资产被下架', '特定服务暂停'],
    icon: ShieldAlert,
  },
  {
    id: 'counterparty',
    level: 'medium',
    name: '交易对手风险',
    enName: 'Counterparty Risk',
    description: '做市商、托管机构、DeFi 协议等合作方违约、破产或欺诈可能造成用户资产损失。',
    impact: '可能导致资金无法赎回或永久损失。',
    likelihood: 30,
    mitigations: [
      '选择有保险覆盖的平台',
      '分散合作方',
      '关注合作方评级',
      '了解托管机制',
    ],
    examples: ['交易所破产', '做市商退出', 'DeFi 协议跑路'],
    icon: Building2,
  },
  {
    id: 'operational',
    level: 'low',
    name: '操作风险',
    enName: 'Operational Risk',
    description: '用户操作失误（如错填地址、丢失私钥、误操作）、内部流程缺陷或外部事件可能造成损失。',
    impact: '可能导致资产误转、丢失或无法访问。',
    likelihood: 50,
    mitigations: [
      '启用地址簿与白名单',
      '小额测试后再大额转账',
      '备份助记词（多份离线）',
      '使用 2FA 与防钓鱼码',
    ],
    examples: ['地址填错', '私钥丢失', '助记词泄露'],
    icon: AlertTriangle,
  },
  {
    id: 'cyber',
    level: 'medium',
    name: '网络与信息安全风险',
    enName: 'Cyber Risk',
    description: '针对平台的 DDoS、APT 攻击、针对用户的钓鱼、社工攻击、SIM 卡劫持等可能造成损失。',
    impact: '可能导致账户被盗、资产被转出。',
    likelihood: 55,
    mitigations: [
      '启用硬件安全密钥（YubiKey 等）',
      '警惕钓鱼邮件与虚假客服',
      '使用独立邮箱注册',
      '定期更换密码',
    ],
    examples: ['SIM 卡劫持', '钓鱼网站', '客服冒充诈骗'],
    icon: Lock,
  },
  {
    id: 'concentration',
    level: 'medium',
    name: '集中度风险',
    enName: 'Concentration Risk',
    description: '资产、地理、平台、合作方过度集中带来的风险。',
    impact: '可能放大单一事件的影响。',
    likelihood: 40,
    mitigations: [
      '资产类别分散化',
      '多平台分散持仓',
      '跨地区分散研究',
      '定期审视集中度',
    ],
    examples: ['单一资产占比过高', '单平台全部资产', '单一合作方依赖'],
    icon: Layers,
  },
];

const ASSET_RISKS: AssetRisk[] = [
  {
    id: 'btc',
    symbol: 'BTC',
    name: '比特币',
    category: 'major',
    volatility: 35,
    liquidity: 'high',
    centralization: 'low',
    regulatoryRisk: 'medium',
    technicalRisk: 'low',
    marketRisk: 'high',
    riskScore: 48,
    description: '市值最大、流动性最强的数字资产，但仍存在显著价格波动与监管不确定性。',
    warnings: ['价格波动较大', '关注各国监管政策', '长期被视为价值存储但短期波动显著'],
  },
  {
    id: 'eth',
    symbol: 'ETH',
    name: '以太坊',
    category: 'major',
    volatility: 42,
    liquidity: 'high',
    centralization: 'low',
    regulatoryRisk: 'medium',
    technicalRisk: 'medium',
    marketRisk: 'high',
    riskScore: 55,
    description: '智能合约平台龙头，技术复杂度高，生态发展迅速，但 Layer 2 与竞争链带来不确定性。',
    warnings: ['智能合约风险', 'Layer 2 生态分化', 'Gas 费波动'],
  },
  {
    id: 'usdt',
    symbol: 'USDT',
    name: '泰达币',
    category: 'stable',
    volatility: 1.5,
    liquidity: 'high',
    centralization: 'high',
    regulatoryRisk: 'high',
    technicalRisk: 'low',
    marketRisk: 'low',
    riskScore: 35,
    description: '市值最大的稳定币，但发行方透明度、储备金构成、监管地位仍是市场关注点。',
    warnings: ['中心化发行方', '储备金披露争议', '脱锚历史事件'],
  },
  {
    id: 'usdc',
    symbol: 'USDC',
    name: 'USD Coin',
    category: 'stable',
    volatility: 1.0,
    liquidity: 'high',
    centralization: 'high',
    regulatoryRisk: 'medium',
    technicalRisk: 'low',
    marketRisk: 'low',
    riskScore: 28,
    description: '合规度较高的美元稳定币，发行方受美国监管，但仍存在极端情况下的脱锚风险。',
    warnings: ['中心化发行', '银行通道风险', '监管政策变化'],
  },
  {
    id: 'sol',
    symbol: 'SOL',
    name: 'Solana',
    category: 'l2',
    volatility: 65,
    liquidity: 'high',
    centralization: 'medium',
    regulatoryRisk: 'medium',
    technicalRisk: 'medium',
    marketRisk: 'high',
    riskScore: 62,
    description: '高性能公链，生态发展迅速但历史多次网络中断，技术稳定性是关注重点。',
    warnings: ['历史网络中断', '宕机风险', '生态集中度'],
  },
  {
    id: 'doge',
    symbol: 'DOGE',
    name: '狗狗币',
    category: 'meme',
    volatility: 78,
    liquidity: 'high',
    centralization: 'medium',
    regulatoryRisk: 'low',
    technicalRisk: 'low',
    marketRisk: 'extreme',
    riskScore: 78,
    description: 'Meme 资产代表，价格高度受社区情绪与社交媒体影响，缺乏基本面支撑。',
    warnings: ['价格剧烈波动', '无明确价值锚', '高度投机性'],
  },
  {
    id: 'uni',
    symbol: 'UNI',
    name: 'Uniswap',
    category: 'defi',
    volatility: 58,
    liquidity: 'high',
    centralization: 'low',
    regulatoryRisk: 'high',
    technicalRisk: 'medium',
    marketRisk: 'high',
    riskScore: 65,
    description: '头部 DEX 代币，DeFi 监管不确定性是核心风险因素。',
    warnings: ['DeFi 监管风险', '智能合约风险', '无常损失'],
  },
  {
    id: 'aave',
    symbol: 'AAVE',
    name: 'Aave',
    category: 'defi',
    volatility: 55,
    liquidity: 'high',
    centralization: 'low',
    regulatoryRisk: 'high',
    technicalRisk: 'medium',
    marketRisk: 'high',
    riskScore: 60,
    description: '头部借贷协议代币，监管与智能合约风险并存。',
    warnings: ['监管不确定性', '智能合约漏洞历史', '清算风险'],
  },
  {
    id: 'treeg',
    symbol: 'TREEG',
    name: '树图币',
    category: 'l2',
    volatility: 52,
    liquidity: 'medium',
    centralization: 'medium',
    regulatoryRisk: 'medium',
    technicalRisk: 'medium',
    marketRisk: 'high',
    riskScore: 58,
    description: 'TreeGraph 公链原生资产，生态发展迅速但市值与流动性相对有限。',
    warnings: ['流动性相对有限', '生态发展阶段', '公链竞争'],
  },
  {
    id: 'nft-blue',
    symbol: 'NFT',
    name: '蓝筹 NFT',
    category: 'nft',
    volatility: 72,
    liquidity: 'low',
    centralization: 'low',
    regulatoryRisk: 'medium',
    technicalRisk: 'low',
    marketRisk: 'extreme',
    riskScore: 75,
    description: 'NFT 资产流动性差，价格波动剧烈，二级市场退出可能困难。',
    warnings: ['流动性极差', '价格高度波动', '估值主观性强'],
  },
];

const TRADE_RISKS: TradeRisk[] = [
  {
    id: 'spot',
    type: 'spot',
    name: '现货交易',
    description: '直接持有数字资产，无杠杆。风险主要来自市场波动与操作失误。',
    keyRisks: ['价格波动损失', '私钥丢失', '误转地址'],
    riskScore: 35,
    safeguards: ['地址簿白名单', '多签钱包', '硬件钱包'],
    requiredExperience: '入门级',
    status: 'open',
  },
  {
    id: 'futures',
    type: 'futures',
    name: '合约交易',
    leverage: '1-100x',
    description: '杠杆交易放大收益的同时也放大风险，存在强平风险。',
    keyRisks: ['强平损失', '资金费率成本', '流动性挤空'],
    riskScore: 78,
    safeguards: ['阶梯保证金', '强平保护', '风险限额'],
    requiredExperience: '高级',
    status: 'open',
  },
  {
    id: 'margin',
    type: 'margin',
    name: '杠杆交易',
    leverage: '2-10x',
    description: '借贷加杠杆交易，波动放大明显。',
    keyRisks: ['爆仓风险', '利息成本', '流动性风险'],
    riskScore: 68,
    safeguards: ['逐仓/全仓模式', '强平价格预警', '自动减仓'],
    requiredExperience: '中高级',
    status: 'open',
  },
  {
    id: 'options',
    type: 'options',
    name: '期权交易',
    description: '复杂衍生品，定价模型与希腊字母风险管理专业门槛高。',
    keyRisks: ['期权到期归零', '波动率突变', '复杂策略风险'],
    riskScore: 82,
    safeguards: ['买方风险有限', '策略风险揭示', '专业用户门槛'],
    requiredExperience: '专业级',
    status: 'beta',
  },
  {
    id: 'liquidity',
    type: 'liquidity',
    name: '流动性挖矿',
    description: '提供流动性获取收益，但面临无常损失与智能合约风险。',
    keyRisks: ['无常损失（IL）', '智能合约漏洞', '奖励代币贬值'],
    riskScore: 70,
    safeguards: ['审计协议', '分散流动性', 'IL 监控'],
    requiredExperience: '中高级',
    status: 'open',
  },
  {
    id: 'staking',
    type: 'staking',
    name: '质押挖矿',
    description: '委托或运行节点获取收益，面临 Slash 风险与解锁期风险。',
    keyRisks: ['Slash 惩罚', '解锁期流动性', '节点运营风险'],
    riskScore: 55,
    safeguards: ['节点运营商筛选', 'Slash 保险', '分散质押'],
    requiredExperience: '中级',
    status: 'open',
  },
];

const RISK_CASES: RiskCase[] = [
  {
    id: 'c-luna',
    date: '2022-05',
    title: 'Terra/LUNA 崩盘事件',
    category: 'market',
    impact: 'global',
    lossScale: '市值蒸发 4000 亿美元',
    description: '算法稳定币 UST 脱锚引发死亡螺旋，LUNA 价格在数日内归零，整个生态崩溃。',
    lesson: '算法稳定币机制设计风险极高，依赖套利与信心的稳定币在极端市场下完全失效。',
    prevention: ['研究机制原理', '分散稳定币持仓', '警惕高收益稳定币产品', '关注审计与透明度'],
  },
  {
    id: 'c-ftx',
    date: '2022-11',
    title: 'FTX 交易所破产事件',
    category: 'operational',
    impact: 'platform',
    lossScale: '用户损失数十亿美元',
    description: '头部交易所 FTX 暴雷，用户资产与公司资金混同使用，资不抵债。',
    lesson: '中心化交易所存在资金混用与治理失效风险，资产应尽可能自我托管。',
    prevention: ['核查平台储备金证明', '分散多平台持仓', '大额资产硬件钱包自托管', '关注平台合规研究方向'],
  },
  {
    id: 'c-312',
    date: '2020-03-12',
    title: '3·12 加密市场暴跌',
    category: 'market',
    impact: 'global',
    lossScale: 'BTC 单日跌幅 39%',
    description: '受 COVID-19 全球蔓延影响，加密市场单日大幅下跌，合约市场出现大规模爆仓。',
    lesson: '极端市场下流动性挤空与连锁爆仓是常见现象，应控制杠杆与做好压力测试。',
    prevention: ['控制杠杆水平', '分散持仓', '关注宏观风险', '设置止损'],
  },
  {
    id: 'c-ronin',
    date: '2022-03',
    title: 'Ronin 跨链桥被盗事件',
    category: 'tech',
    impact: 'asset',
    lossScale: '6.25 亿美元被盗',
    description: 'Axie Infinity 的 Ronin 跨链桥被攻击，验证节点被攻陷导致巨额资产被盗。',
    lesson: '跨链桥是攻击高发区，验证节点数量与去中心化程度是核心安全指标。',
    prevention: ['关注审计报告', '分散跨链资产', '警惕验证节点过少的项目', '使用头部跨链协议'],
  },
  {
    id: 'c-celsius',
    date: '2022-06',
    title: 'Celsius 流动性危机',
    category: 'liquidity',
    impact: 'platform',
    lossScale: '用户资产提取冻结',
    description: '加密借贷平台 Celsius 暂停用户提款，最终申请破产。',
    lesson: '高收益借贷产品背后可能存在严重期限错配与流动性风险。',
    prevention: ['警惕过高收益产品', '关注平台储备金', '了解资金运作机制', '分散存放'],
  },
  {
    id: 'c-cspr',
    date: '2020-03',
    title: 'MakerDAO 0 DAI 拍卖事件',
    category: 'tech',
    impact: 'asset',
    lossScale: '数百万美元损失',
    description: '受 3·12 暴跌影响，MakerDAO 拍卖抵押品时出现 0 DAI 成交价，系统损失数百万。',
    lesson: 'DeFi 协议在极端市场下可能面临治理参数与清算机制失效风险。',
    prevention: ['关注治理参数', '分散抵押品', '使用经过实战检验的协议', '关注紧急关停机制'],
  },
];

const EDU_RESOURCES: EduResource[] = [
  {
    id: 'e-101',
    title: '数字资产投资入门',
    type: 'course',
    duration: '60 分钟',
    level: 'beginner',
    topic: '基础知识',
    description: '从零开始了解数字资产、区块链基础、主流资产类型、投资基础概念。',
    enrolled: 12453,
    rating: 4.8,
    status: 'open',
  },
  {
    id: 'e-risk-101',
    title: '数字资产投资风险全解析',
    type: 'course',
    duration: '45 分钟',
    level: 'beginner',
    topic: '风险教育',
    description: '系统讲解市场风险、流动性风险、技术风险、合规风险等八大类风险。',
    enrolled: 8932,
    rating: 4.9,
    status: 'open',
  },
  {
    id: 'e-wallet',
    title: '钱包与私钥安全管理',
    type: 'article',
    duration: '15 分钟',
    level: 'beginner',
    topic: '资产安全',
    description: '冷热钱包分离、助记词备份、硬件钱包使用、私钥管理最佳实践。',
    enrolled: 6234,
    rating: 4.7,
    status: 'open',
  },
  {
    id: 'e-leverage',
    title: '杠杆与合约风险控制',
    type: 'video',
    duration: '30 分钟',
    level: 'intermediate',
    topic: '交易风险',
    description: '深度讲解杠杆交易、强平机制、资金费率、风险控制技巧。',
    enrolled: 4521,
    rating: 4.6,
    status: 'open',
  },
  {
    id: 'e-defi',
    title: 'DeFi 风险与审计解读',
    type: 'course',
    duration: '90 分钟',
    level: 'advanced',
    topic: 'DeFi 风险',
    description: 'DeFi 协议风险模型、智能合约审计方法、无常损失与清算机制。',
    enrolled: 2103,
    rating: 4.8,
    status: 'open',
  },
  {
    id: 'e-phishing',
    title: '识别钓鱼攻击与社工欺诈',
    type: 'article',
    duration: '10 分钟',
    level: 'beginner',
    topic: '安全意识',
    description: '常见钓鱼手法、虚假客服、社工攻击案例与防范方法。',
    enrolled: 7821,
    rating: 4.9,
    status: 'open',
  },
  {
    id: 'e-fork',
    title: '公链分叉与重组风险',
    type: 'video',
    duration: '20 分钟',
    level: 'intermediate',
    topic: '技术风险',
    description: '公链分叉原理、51% 攻击风险、重组保护与安全确认数。',
    enrolled: 3120,
    rating: 4.5,
    status: 'open',
  },
  {
    id: 'e-reg',
    title: '全球数字资产监管动态',
    type: 'webinar',
    duration: '60 分钟',
    level: 'intermediate',
    topic: '合规方向',
    description: 'MiCA、TRAVEL RULE、OFAC 等全球监管动态与研究方向。',
    enrolled: 1845,
    rating: 4.7,
    status: 'beta',
  },
  {
    id: 'e-calc',
    title: '投资风险计算器',
    type: 'tool',
    duration: '即时',
    level: 'beginner',
    topic: '工具',
    description: '基于您的资产、风险偏好，估算最大可承受损失与建议仓位。',
    enrolled: 5234,
    rating: 4.6,
    status: 'open',
  },
];

const QUIZ: QuizQuestion[] = [
  {
    id: 'q-exp',
    key: 'experience',
    question: '您的数字资产投资经验？',
    weight: 1.0,
    options: [
      { value: 10, label: '完全新手', description: '首次接触' },
      { value: 30, label: '1 年以内', description: '了解基础' },
      { value: 60, label: '1-3 年', description: '有一定经验' },
      { value: 85, label: '3 年以上', description: '专业水平' },
    ],
  },
  {
    id: 'q-tol',
    key: 'tolerance',
    question: '您能接受的最大短期亏损幅度？',
    weight: 1.2,
    options: [
      { value: 10, label: '无法接受亏损', description: '极度保守' },
      { value: 35, label: '10% 以内', description: '保守型' },
      { value: 60, label: '20-30%', description: '平衡型' },
      { value: 85, label: '30-50%', description: '积极型' },
      { value: 100, label: '50% 以上', description: '激进型' },
    ],
  },
  {
    id: 'q-goal',
    key: 'goal',
    question: '您的投资目标？',
    weight: 0.8,
    options: [
      { value: 20, label: '资产保值', description: '跑赢通胀' },
      { value: 50, label: '稳健增值', description: '年化 5-15%' },
      { value: 80, label: '积极增长', description: '年化 15-50%' },
      { value: 100, label: '高收益', description: '追求高回报' },
    ],
  },
  {
    id: 'q-hor',
    key: 'horizon',
    question: '您的投资期限？',
    weight: 0.8,
    options: [
      { value: 20, label: '短期 (1 年内)', description: '频繁交易' },
      { value: 50, label: '中期 (1-3 年)', description: '波段持有' },
      { value: 80, label: '长期 (3-5 年)', description: '趋势投资' },
      { value: 100, label: '超长期 (5 年+)', description: '价值投资' },
    ],
  },
  {
    id: 'q-know',
    key: 'knowledge',
    question: '您对以下概念的熟悉程度？（智能合约 / 私钥 / Merkle Tree / 流动性挖矿）',
    weight: 1.0,
    options: [
      { value: 15, label: '基本不熟悉', description: '需要学习' },
      { value: 40, label: '听说过', description: '知道基本概念' },
      { value: 70, label: '比较熟悉', description: '能独立操作' },
      { value: 95, label: '非常熟悉', description: '深入理解' },
    ],
  },
];

const EMERGENCY_STEPS: EmergencyStep[] = [
  {
    id: 1,
    title: '立即冻结账户',
    description: '怀疑账户被盗时，第一时间通过安全设置冻结账户，阻止进一步操作。',
    action: '登录 → 安全中心 → 紧急冻结',
    estimatedTime: '1 分钟',
    icon: Lock,
    hot: true,
  },
  {
    id: 2,
    title: '修改登录密码与 2FA',
    description: '在安全设备上修改密码与 2FA 绑定，撤销所有可疑会话。',
    action: '安全中心 → 修改密码 / 2FA / 撤销会话',
    estimatedTime: '5 分钟',
    icon: KeyRound,
  },
  {
    id: 3,
    title: '转移资产至安全钱包',
    description: '将剩余资产转移至自托管硬件钱包，避免继续在原账户留存。',
    action: '提现 → 硬件钱包地址（白名单优先）',
    estimatedTime: '15-30 分钟',
    icon: Wallet,
  },
  {
    id: 4,
    title: '联系平台客服',
    description: '通过官方渠道（站内信 / 官方验证邮箱）联系客服，提供事件时间与可疑活动。',
    action: '站内信 / 官方验证邮箱 / 紧急联系电话',
    estimatedTime: '5-15 分钟',
    icon: Phone,
  },
  {
    id: 5,
    title: '提交事件报告',
    description: '在安全中心提交完整事件报告，平台风控与合规团队将启动调查。',
    action: '安全中心 → 事件报告',
    estimatedTime: '10 分钟',
    icon: FileText,
  },
  {
    id: 6,
    title: '保留证据与报警',
    description: '保留所有相关证据（截图、交易哈希、对话记录），必要时向公安机关报案。',
    action: '安全中心 → 导出证据包',
    estimatedTime: '30 分钟',
    icon: Shield,
  },
];

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
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${color}22`, color }}>
          <Icon className="w-4 h-4" />
        </div>
        {isLive && (
          <div className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: BRAND.success }} />
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
        <div className="text-[10px]" style={{ color: BRAND.textSub }}>{label}</div>
        {trend && (
          <div className="text-[9px] font-mono flex items-center gap-0.5" style={{ color: trend === 'up' ? BRAND.danger : trend === 'down' ? BRAND.success : BRAND.textSub }}>
            {trend === 'up' ? <TrendingUp className="w-2.5 h-2.5" /> : trend === 'down' ? <TrendingDown className="w-2.5 h-2.5" /> : null}
            {trendValue}
          </div>
        )}
      </div>
    </div>
  );
}

function RiskLevelBadge({ level }: { level: RiskLevel }) {
  const cfg = {
    extreme: { color: BRAND.danger, bg: BRAND.dangerLt, label: '极高' },
    high: { color: BRAND.danger, bg: BRAND.dangerLt, label: '高' },
    medium: { color: BRAND.amber, bg: BRAND.amberLt, label: '中' },
    low: { color: BRAND.success, bg: BRAND.successLt, label: '低' },
  }[level];
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium" style={{ backgroundColor: cfg.bg, color: cfg.color }}>
      <span className="w-1 h-1 rounded-full" style={{ backgroundColor: cfg.color }} />
      {cfg.label}
    </span>
  );
}

// ============== 主组件 ==============

export function PortalRiskDisclosure() {
  const [tab, setTab] = useState<Tab>('overview');
  const [search, setSearch] = useState('');
  const [levelFilter, setLevelFilter] = useState<RiskLevel | 'all'>('all');
  const [catFilter, setCatFilter] = useState<AssetCategory | 'all'>('all');
  const [sortBy, setSortBy] = useState<'risk' | 'volatility' | 'symbol'>('risk');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [drawer, setDrawer] = useState<DrawerState>({ open: false, type: null, payload: null });
  const [helpOpen, setHelpOpen] = useState(false);
  const [eduLevel, setEduLevel] = useState<string>('all');

  // 风险测评
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({});
  const [quizResult, setQuizResult] = useState<AssessmentResult | null>(null);

  // 实时 KPI
  const [kpi, setKpi] = useState({
    riskEvents: 12,
    onlineReminders: 4521,
    educationCompleted: 8642,
    assessmentTaken: 12453,
    marketVolatility: 32.5,
    liquidityIndex: 87.2,
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setKpi((prev) => ({
        riskEvents: Math.max(0, prev.riskEvents + (Math.random() > 0.85 ? 1 : 0)),
        onlineReminders: prev.onlineReminders + Math.floor(Math.random() * 8),
        educationCompleted: prev.educationCompleted + Math.floor(Math.random() * 3),
        assessmentTaken: prev.assessmentTaken + Math.floor(Math.random() * 5),
        marketVolatility: Math.max(15, Math.min(80, prev.marketVolatility + (Math.random() - 0.5) * 2)),
        liquidityIndex: Math.max(60, Math.min(99, prev.liquidityIndex + (Math.random() - 0.5) * 1.5)),
      }));
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;
      if (e.key === '/') {
        e.preventDefault();
        document.getElementById('risk-search')?.focus();
      } else if (e.key === 'Escape') {
        setDrawer({ open: false, type: null, payload: null });
        setHelpOpen(false);
        setQuizResult(null);
      } else if (e.key === '?') {
        e.preventDefault();
        setHelpOpen(true);
      } else if (e.key === '1') setTab('overview');
      else if (e.key === '2') setTab('assets');
      else if (e.key === '3') setTab('trading');
      else if (e.key === '4') setTab('cases');
      else if (e.key === '5') setTab('education');
      else if (e.key === '6') setTab('assessment');
      else if (e.key === '7') setTab('emergency');
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // 过滤
  const filteredCategories = useMemo(() => {
    let result = RISK_CATEGORIES.filter((r) => {
      if (levelFilter !== 'all' && r.level !== levelFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return r.name.toLowerCase().includes(q) || r.description.toLowerCase().includes(q);
      }
      return true;
    });
    return result.sort((a, b) => b.likelihood - a.likelihood);
  }, [levelFilter, search]);

  const filteredAssets = useMemo(() => {
    let result = ASSET_RISKS.filter((a) => {
      if (catFilter !== 'all' && a.category !== catFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return a.symbol.toLowerCase().includes(q) || a.name.toLowerCase().includes(q);
      }
      return true;
    });
    result.sort((a, b) => {
      let cmp = 0;
      if (sortBy === 'risk') cmp = a.riskScore - b.riskScore;
      else if (sortBy === 'volatility') cmp = a.volatility - b.volatility;
      else cmp = a.symbol.localeCompare(b.symbol);
      return sortDir === 'desc' ? -cmp : cmp;
    });
    return result;
  }, [catFilter, search, sortBy, sortDir]);

  const filteredCases = useMemo(() => {
    let result = [...RISK_CASES];
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((c) => c.title.toLowerCase().includes(q) || c.description.toLowerCase().includes(q));
    }
    return result.sort((a, b) => b.date.localeCompare(a.date));
  }, [search]);

  const filteredEdu = useMemo(() => {
    let result = EDU_RESOURCES;
    if (eduLevel !== 'all') result = result.filter((e) => e.level === eduLevel);
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((e) => e.title.toLowerCase().includes(q) || e.description.toLowerCase().includes(q));
    }
    return result;
  }, [eduLevel, search]);

  const openDrawer = useCallback((type: DrawerState['type'], payload: string | null = null) => {
    setDrawer({ open: true, type, payload });
  }, []);

  const closeDrawer = useCallback(() => {
    setDrawer({ open: false, type: null, payload: null });
  }, []);

  // 测评计算
  const calculateQuiz = useCallback(() => {
    let total = 0;
    let weightSum = 0;
    QUIZ.forEach((q) => {
      if (quizAnswers[q.id] !== undefined) {
        total += quizAnswers[q.id] * q.weight;
        weightSum += q.weight;
      }
    });
    if (weightSum === 0) return;
    const score = Math.round((total / weightSum / 100) * 100);
    let level: RiskLevel;
    if (score < 30) level = 'low';
    else if (score < 55) level = 'medium';
    else if (score < 80) level = 'high';
    else level = 'extreme';
    const products = {
      low: ['现货交易（保守仓位）', '稳定币理财（低风险）', 'PoS 质押（主流链）'],
      medium: ['现货交易', '主流币种质押', '中等风险流动性挖矿'],
      high: ['现货 + 主流合约', 'DeFi 协议参与', '杠杆交易（中低杠杆）'],
      extreme: ['全产品访问', '高阶衍生品', '高杠杆 / 复杂策略'],
    }[level];
    const suggestion = {
      low: '您属于保守型投资者，建议以稳定币与主流币种为主，避免高波动与高杠杆产品。',
      medium: '您属于平衡型投资者，可以尝试中等风险产品，但请控制单笔仓位与杠杆。',
      high: '您属于积极型投资者，可以参与高阶产品，但请严格执行风控纪律。',
      extreme: '您属于激进型投资者，可以参与高阶产品，请务必做好压力测试与止损。',
    }[level];
    const capacity = {
      low: '可承受 10% 以内短期亏损',
      medium: '可承受 10-30% 短期亏损',
      high: '可承受 30-50% 短期亏损',
      extreme: '可承受 50% 以上短期亏损',
    }[level];
    setQuizResult({ totalScore: score, level, suggestion, productAccess: products, riskCapacity: capacity });
  }, [quizAnswers]);

  const drawerContent = useMemo(() => {
    if (!drawer.open || !drawer.type) return null;
    if (drawer.type === 'category') {
      const c = RISK_CATEGORIES.find((x) => x.id === drawer.payload);
      if (!c) return null;
      return { title: c.name, subtitle: c.enName, data: c, type: 'category' as const };
    }
    if (drawer.type === 'asset') {
      const a = ASSET_RISKS.find((x) => x.id === drawer.payload);
      if (!a) return null;
      return { title: `${a.symbol} · ${a.name}`, subtitle: `风险评分 ${a.riskScore}`, data: a, type: 'asset' as const };
    }
    if (drawer.type === 'case') {
      const c = RISK_CASES.find((x) => x.id === drawer.payload);
      if (!c) return null;
      return { title: c.title, subtitle: c.date, data: c, type: 'case' as const };
    }
    if (drawer.type === 'edu') {
      const e = EDU_RESOURCES.find((x) => x.id === drawer.payload);
      if (!e) return null;
      return { title: e.title, subtitle: `${e.duration} · ${e.topic}`, data: e, type: 'edu' as const };
    }
    if (drawer.type === 'trade') {
      const t = TRADE_RISKS.find((x) => x.id === drawer.payload);
      if (!t) return null;
      return { title: t.name, subtitle: t.requiredExperience, data: t, type: 'trade' as const };
    }
    return null;
  }, [drawer]);

  return (
    <div className="min-h-screen" style={{ backgroundColor: BRAND.bg, color: BRAND.text }}>
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6">
        {/* Hero */}
        <section className="mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-4" style={{ backgroundColor: BRAND.dangerLt, border: `1px solid ${BRAND.danger}33` }}>
            <AlertTriangle className="w-3.5 h-3.5" style={{ color: BRAND.danger }} />
            <span className="text-[11px] font-mono tracking-wider" style={{ color: BRAND.danger }}>
              RISK DISCLOSURE STATEMENT
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-3" style={{ color: BRAND.text }}>
            数字资产投资风险披露声明
          </h1>
          <p className="text-sm md:text-base max-w-3xl" style={{ color: BRAND.textSub }}>
            数字资产属于高风险投资品种，价格波动剧烈，可能导致投资本金部分或全部损失。
            请在做出投资决策前，充分了解相关风险，并根据自己的财务状况与风险承受能力谨慎评估。
            本页面提供完整的风险分类、资产风险、交易风险、历史案例、投资者教育与紧急应对指引。
          </p>
          <div className="flex flex-wrap items-center gap-2 mt-4 text-[11px]" style={{ color: BRAND.textSub }}>
            <span className="inline-flex items-center gap-1">
              <ShieldAlert className="w-3 h-3" style={{ color: BRAND.danger }} />
              8 大风险类别
            </span>
            <span style={{ color: BRAND.border }}>·</span>
            <span className="inline-flex items-center gap-1">
              <Wallet className="w-3 h-3" style={{ color: BRAND.amber }} />
              10 资产风险
            </span>
            <span style={{ color: BRAND.border }}>·</span>
            <span className="inline-flex items-center gap-1">
              <History className="w-3 h-3" style={{ color: BRAND.info }} />
              6 历史案例
            </span>
            <span style={{ color: BRAND.border }}>·</span>
            <span className="inline-flex items-center gap-1">
              <GraduationCap className="w-3 h-3" style={{ color: BRAND.primary }} />
              9 教育资源
            </span>
          </div>
        </section>

        {/* 实时 KPI */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div style={{ animation: 'fadeUp 0.5s ease-out 0s both' }}>
            <KpiCard icon={AlertTriangle} label="24h 风险事件" value={kpi.riskEvents} isLive trend="up" trendValue="+2" color={BRAND.danger} />
          </div>
          <div style={{ animation: 'fadeUp 0.5s ease-out 0.05s both' }}>
            <KpiCard icon={Activity} label="市场波动率" value={kpi.marketVolatility} suffix="%" precision={1} isLive color={BRAND.amber} />
          </div>
          <div style={{ animation: 'fadeUp 0.5s ease-out 0.1s both' }}>
            <KpiCard icon={Database} label="流动性指数" value={kpi.liquidityIndex} suffix="" precision={1} isLive color={BRAND.info} />
          </div>
          <div style={{ animation: 'fadeUp 0.5s ease-out 0.15s both' }}>
            <KpiCard icon={Users} label="已完成测评" value={kpi.assessmentTaken} color={BRAND.primary} />
          </div>
        </section>

        {/* 工具栏 */}
        <section className="flex flex-col md:flex-row gap-3 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: BRAND.textMute }} />
            <input
              id="risk-search"
              type="text"
              placeholder="搜索风险类别 / 资产 / 案例 / 课程（按 / 聚焦）"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-9 py-2.5 rounded-xl text-sm outline-none transition-all"
              style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}`, color: BRAND.text }}
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: BRAND.textMute }}>
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setHelpOpen(true)}
              className="px-3 py-2.5 rounded-xl text-sm flex items-center gap-1.5"
              style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}`, color: BRAND.textSub }}
            >
              <Keyboard className="w-3.5 h-3.5" />
              快捷键
            </button>
            <button
              onClick={() => setTab('assessment')}
              className="px-4 py-2.5 rounded-xl text-sm font-medium flex items-center gap-1.5"
              style={{ backgroundColor: BRAND.danger, color: '#fff' }}
            >
              <Calculator className="w-3.5 h-3.5" />
              风险测评
            </button>
          </div>
        </section>

        {/* Tab 切换 */}
        <section className="flex gap-1 mb-6 overflow-x-auto pb-2">
          {(
            [
              { key: 'overview' as Tab, label: '风险总览', icon: ShieldAlert },
              { key: 'assets' as Tab, label: '资产风险', icon: Coins },
              { key: 'trading' as Tab, label: '交易风险', icon: LineChart },
              { key: 'cases' as Tab, label: '历史案例', icon: History },
              { key: 'education' as Tab, label: '投资者教育', icon: GraduationCap },
              { key: 'assessment' as Tab, label: '风险测评', icon: Calculator },
              { key: 'emergency' as Tab, label: '紧急应对', icon: Phone },
            ] as const
          ).map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className="px-4 py-2 rounded-lg text-sm flex items-center gap-1.5 whitespace-nowrap transition-all"
              style={{
                backgroundColor: tab === key ? BRAND.dangerLt : BRAND.card,
                border: `1px solid ${tab === key ? BRAND.danger : BRAND.border}`,
                color: tab === key ? BRAND.danger : BRAND.textSub,
              }}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </section>

        {/* Tab: 风险总览 */}
        {tab === 'overview' && (
          <>
            {/* 过滤 */}
            <section className="mb-4 flex flex-wrap items-center gap-2">
              <div className="text-[11px]" style={{ color: BRAND.textMute }}>风险等级：</div>
              {(['all', 'extreme', 'high', 'medium', 'low'] as const).map((l) => (
                <button
                  key={l}
                  onClick={() => setLevelFilter(l)}
                  className="px-3 py-1 rounded-md text-[11px] transition-all"
                  style={{
                    backgroundColor: levelFilter === l ? BRAND.dangerLt : 'transparent',
                    border: `1px solid ${levelFilter === l ? BRAND.danger : BRAND.border}`,
                    color: levelFilter === l ? BRAND.danger : BRAND.textSub,
                  }}
                >
                  {l === 'all' ? '全部' : l === 'extreme' ? '极高' : l === 'high' ? '高' : l === 'medium' ? '中' : '低'}
                </button>
              ))}
            </section>

            {/* 风险类别卡片 */}
            <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
              {filteredCategories.map((c, i) => {
                const Icon = c.icon;
                return (
                  <div
                    key={c.id}
                    onClick={() => openDrawer('category', c.id)}
                    className="rounded-2xl p-4 transition-all cursor-pointer hover:scale-[1.02]"
                    style={{
                      backgroundColor: BRAND.card,
                      border: `1px solid ${BRAND.border}`,
                      animation: `fadeUp 0.4s ease-out ${i * 0.04}s both`,
                    }}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: BRAND.dangerLt, color: BRAND.danger }}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <RiskLevelBadge level={c.level} />
                    </div>
                    <div className="text-sm font-semibold mb-1" style={{ color: BRAND.text }}>{c.name}</div>
                    <div className="text-[10px] font-mono mb-2" style={{ color: BRAND.textMute }}>{c.enName}</div>
                    <div className="text-[11px] mb-3" style={{ color: BRAND.textSub }}>{c.description.slice(0, 60)}...</div>
                    <div className="mb-1.5">
                      <div className="flex items-center justify-between text-[10px] mb-1" style={{ color: BRAND.textMute }}>
                        <span>发生概率</span>
                        <span style={{ color: BRAND.danger }} className="font-mono">{c.likelihood}%</span>
                      </div>
                      <div className="h-1 rounded-full overflow-hidden" style={{ backgroundColor: BRAND.cardElevated }}>
                        <div
                          className="h-full"
                          style={{
                            width: `${c.likelihood}%`,
                            backgroundColor: c.likelihood >= 70 ? BRAND.danger : c.likelihood >= 40 ? BRAND.amber : BRAND.success,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </section>

            {/* 关键提示 */}
            <section
              className="rounded-2xl p-5 mb-8"
              style={{ backgroundColor: BRAND.dangerLt, border: `1px solid ${BRAND.danger}33` }}
            >
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-6 h-6 flex-shrink-0" style={{ color: BRAND.danger }} />
                <div className="flex-1">
                  <div className="text-sm font-semibold mb-1" style={{ color: BRAND.danger }}>重要风险提示</div>
                  <div className="text-[12px]" style={{ color: BRAND.text }}>
                    数字资产不是法定货币，不具备法偿性与强制性。投资数字资产可能面临本金全部损失。
                    请仅使用可承受损失的资金进行投资，切勿借贷投资、抵押生活必需资金。
                  </div>
                </div>
              </div>
            </section>
          </>
        )}

        {/* Tab: 资产风险 */}
        {tab === 'assets' && (
          <>
            <section className="flex flex-wrap items-center gap-2 mb-4">
              <div className="text-[11px]" style={{ color: BRAND.textMute }}>资产类别：</div>
              {(['all', 'major', 'stable', 'defi', 'l2', 'meme', 'nft'] as const).map((c) => (
                <button
                  key={c}
                  onClick={() => setCatFilter(c)}
                  className="px-3 py-1 rounded-md text-[11px] transition-all"
                  style={{
                    backgroundColor: catFilter === c ? BRAND.dangerLt : 'transparent',
                    border: `1px solid ${catFilter === c ? BRAND.danger : BRAND.border}`,
                    color: catFilter === c ? BRAND.danger : BRAND.textSub,
                  }}
                >
                  {c === 'all' ? '全部' : c === 'major' ? '主流币' : c === 'stable' ? '稳定币' : c === 'defi' ? 'DeFi' : c === 'l2' ? '公链' : c === 'meme' ? 'Meme' : 'NFT'}
                </button>
              ))}
              <div className="ml-auto flex items-center gap-2">
                <span className="text-[11px]" style={{ color: BRAND.textMute }}>排序：</span>
                {(['risk', 'volatility', 'symbol'] as const).map((k) => (
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
                    {k === 'risk' ? '风险' : k === 'volatility' ? '波动率' : '名称'}
                    {sortBy === k && (sortDir === 'desc' ? <ChevronDown className="w-2.5 h-2.5" /> : <ChevronUp className="w-2.5 h-2.5" />)}
                  </button>
                ))}
              </div>
            </section>
            <section className="space-y-2 mb-8">
              {filteredAssets.map((a, i) => (
                <div
                  key={a.id}
                  onClick={() => openDrawer('asset', a.id)}
                  className="rounded-2xl p-4 transition-all cursor-pointer hover:scale-[1.005]"
                  style={{
                    backgroundColor: BRAND.card,
                    border: `1px solid ${BRAND.border}`,
                    animation: `fadeUp 0.4s ease-out ${i * 0.04}s both`,
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center font-mono font-bold text-sm"
                      style={{ backgroundColor: BRAND.dangerLt, color: BRAND.danger }}
                    >
                      {a.symbol.slice(0, 3)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-sm font-semibold" style={{ color: BRAND.text }}>{a.symbol}</span>
                        <span className="text-[10px]" style={{ color: BRAND.textMute }}>{a.name}</span>
                      </div>
                      <div className="text-[10px]" style={{ color: BRAND.textSub }}>{a.description.slice(0, 80)}...</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[9px] mb-0.5" style={{ color: BRAND.textMute }}>风险评分</div>
                      <div className="text-lg font-mono font-bold" style={{ color: a.riskScore >= 70 ? BRAND.danger : a.riskScore >= 50 ? BRAND.amber : BRAND.success }}>
                        {a.riskScore}
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 min-w-[280px]">
                      <div>
                        <div className="text-[9px]" style={{ color: BRAND.textMute }}>波动率</div>
                        <div className="text-xs font-mono" style={{ color: BRAND.text }}>{a.volatility}%</div>
                      </div>
                      <div>
                        <div className="text-[9px]" style={{ color: BRAND.textMute }}>流动性</div>
                        <div className="text-xs" style={{ color: BRAND.text }}>{a.liquidity === 'high' ? '高' : a.liquidity === 'medium' ? '中' : '低'}</div>
                      </div>
                      <div>
                        <div className="text-[9px]" style={{ color: BRAND.textMute }}>中心化</div>
                        <div className="text-xs" style={{ color: BRAND.text }}>{a.centralization === 'high' ? '高' : a.centralization === 'medium' ? '中' : '低'}</div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </section>
          </>
        )}

        {/* Tab: 交易风险 */}
        {tab === 'trading' && (
          <section className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-8">
            {TRADE_RISKS.map((t, i) => (
              <div
                key={t.id}
                onClick={() => openDrawer('trade', t.id)}
                className="rounded-2xl p-4 transition-all cursor-pointer hover:scale-[1.01]"
                style={{
                  backgroundColor: BRAND.card,
                  border: `1px solid ${BRAND.border}`,
                  animation: `fadeUp 0.4s ease-out ${i * 0.05}s both`,
                }}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="text-sm font-semibold mb-0.5" style={{ color: BRAND.text }}>{t.name}</div>
                    {t.leverage && (
                      <div className="text-[10px] font-mono px-1.5 py-0.5 rounded inline-block" style={{ backgroundColor: BRAND.dangerLt, color: BRAND.danger }}>
                        杠杆 {t.leverage}
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-[9px]" style={{ color: BRAND.textMute }}>风险评分</div>
                    <div className="text-lg font-mono font-bold" style={{ color: t.riskScore >= 70 ? BRAND.danger : t.riskScore >= 50 ? BRAND.amber : BRAND.success }}>
                      {t.riskScore}
                    </div>
                  </div>
                </div>
                <div className="text-[11px] mb-3" style={{ color: BRAND.textSub }}>{t.description}</div>
                <div className="text-[10px] mb-1" style={{ color: BRAND.textMute }}>关键风险：</div>
                <div className="flex flex-wrap gap-1 mb-2">
                  {t.keyRisks.map((r) => (
                    <span key={r} className="text-[9px] px-1.5 py-0.5 rounded" style={{ backgroundColor: BRAND.dangerLt, color: BRAND.danger }}>
                      {r}
                    </span>
                  ))}
                </div>
                <div className="text-[10px] mb-1" style={{ color: BRAND.textMute }}>风控措施：</div>
                <div className="flex flex-wrap gap-1">
                  {t.safeguards.map((s) => (
                    <span key={s} className="text-[9px] px-1.5 py-0.5 rounded" style={{ backgroundColor: BRAND.successLt, color: BRAND.success }}>
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </section>
        )}

        {/* Tab: 历史案例 */}
        {tab === 'cases' && (
          <section className="space-y-3 mb-8">
            {filteredCases.map((c, i) => (
              <div
                key={c.id}
                onClick={() => openDrawer('case', c.id)}
                className="rounded-2xl p-4 transition-all cursor-pointer hover:scale-[1.005]"
                style={{
                  backgroundColor: BRAND.card,
                  border: `1px solid ${BRAND.border}`,
                  animation: `fadeUp 0.4s ease-out ${i * 0.04}s both`,
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded" style={{ backgroundColor: BRAND.dangerLt, color: BRAND.danger }}>
                        {c.date}
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded" style={{ backgroundColor: BRAND.cardElevated, color: BRAND.textSub }}>
                        {c.category}
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded" style={{ backgroundColor: BRAND.amberLt, color: BRAND.amber }}>
                        {c.impact}
                      </span>
                    </div>
                    <div className="text-sm font-semibold mb-1" style={{ color: BRAND.text }}>{c.title}</div>
                    <div className="text-[10px] font-mono mb-2" style={{ color: BRAND.danger }}>{c.lossScale}</div>
                    <div className="text-[12px]" style={{ color: BRAND.textSub }}>{c.description}</div>
                  </div>
                  <ChevronRight className="w-4 h-4 mt-1 flex-shrink-0" style={{ color: BRAND.textMute }} />
                </div>
              </div>
            ))}
          </section>
        )}

        {/* Tab: 投资者教育 */}
        {tab === 'education' && (
          <>
            <section className="flex flex-wrap gap-2 mb-4">
              {(['all', 'beginner', 'intermediate', 'advanced'] as const).map((l) => (
                <button
                  key={l}
                  onClick={() => setEduLevel(l)}
                  className="px-3 py-1.5 rounded-lg text-[12px] transition-all"
                  style={{
                    backgroundColor: eduLevel === l ? BRAND.dangerLt : BRAND.card,
                    border: `1px solid ${eduLevel === l ? BRAND.danger : BRAND.border}`,
                    color: eduLevel === l ? BRAND.danger : BRAND.textSub,
                  }}
                >
                  {l === 'all' ? '全部' : l === 'beginner' ? '入门' : l === 'intermediate' ? '进阶' : '高级'}
                </button>
              ))}
            </section>
            <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-8">
              {filteredEdu.map((e, i) => {
                const typeIcon = {
                  article: FileText,
                  video: PlayCircle,
                  course: GraduationCap,
                  webinar: Users,
                  doc: BookOpen,
                  tool: Calculator,
                }[e.type];
                const TypeIcon = typeIcon;
                return (
                  <div
                    key={e.id}
                    onClick={() => openDrawer('edu', e.id)}
                    className="rounded-2xl p-4 transition-all cursor-pointer hover:scale-[1.02]"
                    style={{
                      backgroundColor: BRAND.card,
                      border: `1px solid ${BRAND.border}`,
                      animation: `fadeUp 0.4s ease-out ${i * 0.05}s both`,
                    }}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: BRAND.primaryLt, color: BRAND.primary }}>
                        <TypeIcon className="w-5 h-5" />
                      </div>
                      <span className="text-[9px] px-1.5 py-0.5 rounded" style={{ backgroundColor: BRAND.cardElevated, color: BRAND.textMute }}>
                        {e.type}
                      </span>
                    </div>
                    <div className="text-sm font-semibold mb-1" style={{ color: BRAND.text }}>{e.title}</div>
                    <div className="text-[10px] mb-2" style={{ color: BRAND.textMute }}>{e.topic} · {e.duration}</div>
                    <div className="text-[11px] mb-3" style={{ color: BRAND.textSub }}>{e.description}</div>
                    <div className="flex items-center justify-between text-[10px] pt-2" style={{ borderTop: `1px solid ${BRAND.border}` }}>
                      <span className="flex items-center gap-1" style={{ color: BRAND.textSub }}>
                        <Users className="w-3 h-3" />
                        {e.enrolled.toLocaleString()}
                      </span>
                      <span className="flex items-center gap-1" style={{ color: BRAND.amber }}>
                        <Award className="w-3 h-3" />
                        {e.rating}
                      </span>
                      <span className="px-1.5 py-0.5 rounded text-[9px]" style={{ backgroundColor: e.level === 'beginner' ? BRAND.successLt : e.level === 'intermediate' ? BRAND.amberLt : BRAND.dangerLt, color: e.level === 'beginner' ? BRAND.success : e.level === 'intermediate' ? BRAND.amber : BRAND.danger }}>
                        {e.level === 'beginner' ? '入门' : e.level === 'intermediate' ? '进阶' : '高级'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </section>
          </>
        )}

        {/* Tab: 风险测评 */}
        {tab === 'assessment' && (
          <section className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="rounded-2xl p-5" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
              <div className="flex items-center gap-2 mb-4">
                <Calculator className="w-5 h-5" style={{ color: BRAND.danger }} />
                <span className="text-base font-semibold" style={{ color: BRAND.text }}>风险测评问卷</span>
              </div>
              <div className="text-[12px] mb-4" style={{ color: BRAND.textSub }}>
                请根据您的实际情况作答，测评结果将帮助您了解自己的风险承受能力。
              </div>
              <div className="space-y-4">
                {QUIZ.map((q, qi) => (
                  <div key={q.id}>
                    <div className="text-[13px] font-semibold mb-2" style={{ color: BRAND.text }}>
                      {qi + 1}. {q.question}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {q.options.map((o) => (
                        <button
                          key={o.value}
                          onClick={() => setQuizAnswers({ ...quizAnswers, [q.id]: o.value })}
                          className="p-2 rounded-lg text-left transition-all"
                          style={{
                            backgroundColor: quizAnswers[q.id] === o.value ? BRAND.dangerLt : BRAND.cardElevated,
                            border: `1px solid ${quizAnswers[q.id] === o.value ? BRAND.danger : BRAND.border}`,
                          }}
                        >
                          <div className="text-[11px] font-semibold" style={{ color: BRAND.text }}>{o.label}</div>
                          <div className="text-[9px]" style={{ color: BRAND.textMute }}>{o.description}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <button
                onClick={calculateQuiz}
                disabled={Object.keys(quizAnswers).length < QUIZ.length}
                className="w-full mt-4 py-2.5 rounded-lg text-sm font-medium flex items-center justify-center gap-1.5"
                style={{
                  backgroundColor: Object.keys(quizAnswers).length === QUIZ.length ? BRAND.danger : BRAND.cardElevated,
                  color: Object.keys(quizAnswers).length === QUIZ.length ? '#fff' : BRAND.textMute,
                  border: `1px solid ${Object.keys(quizAnswers).length === QUIZ.length ? BRAND.danger : BRAND.border}`,
                }}
              >
                <Calculator className="w-4 h-4" />
                {Object.keys(quizAnswers).length === QUIZ.length ? '查看测评结果' : `请完成全部 ${QUIZ.length} 道题 (${Object.keys(quizAnswers).length}/${QUIZ.length})`}
              </button>
            </div>

            {quizResult ? (
              <div
                className="rounded-2xl p-5"
                style={{
                  backgroundColor: BRAND.card,
                  border: `1px solid ${quizResult.level === 'extreme' || quizResult.level === 'high' ? BRAND.danger : quizResult.level === 'medium' ? BRAND.amber : BRAND.success}`,
                }}
              >
                <div className="flex items-center gap-2 mb-4">
                  <Target className="w-5 h-5" style={{ color: BRAND.primary }} />
                  <span className="text-base font-semibold" style={{ color: BRAND.text }}>测评结果</span>
                </div>
                <div className="text-center mb-4">
                  <div className="text-[11px] mb-1" style={{ color: BRAND.textMute }}>综合风险评分</div>
                  <div className="text-4xl font-bold font-mono" style={{ color: quizResult.level === 'extreme' || quizResult.level === 'high' ? BRAND.danger : quizResult.level === 'medium' ? BRAND.amber : BRAND.success }}>
                    {quizResult.totalScore}
                  </div>
                  <div className="mt-2">
                    <RiskLevelBadge level={quizResult.level} />
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.cardElevated }}>
                    <div className="text-[10px] mb-1" style={{ color: BRAND.textMute }}>投资建议</div>
                    <div className="text-[12px]" style={{ color: BRAND.text }}>{quizResult.suggestion}</div>
                  </div>
                  <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.cardElevated }}>
                    <div className="text-[10px] mb-1" style={{ color: BRAND.textMute }}>风险承受力</div>
                    <div className="text-[12px]" style={{ color: BRAND.text }}>{quizResult.riskCapacity}</div>
                  </div>
                  <div>
                    <div className="text-[10px] mb-2" style={{ color: BRAND.textMute }}>建议产品</div>
                    <div className="space-y-1">
                      {quizResult.productAccess.map((p) => (
                        <div key={p} className="text-[12px] flex items-center gap-2" style={{ color: BRAND.text }}>
                          <CheckCircle2 className="w-3 h-3" style={{ color: BRAND.primary }} />
                          {p}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div
                className="rounded-2xl p-5 flex items-center justify-center"
                style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}
              >
                <div className="text-center">
                  <Calculator className="w-12 h-12 mx-auto mb-3" style={{ color: BRAND.textMute }} />
                  <div className="text-sm font-semibold mb-1" style={{ color: BRAND.text }}>完成测评后查看结果</div>
                  <div className="text-[11px]" style={{ color: BRAND.textMute }}>请先完成左侧问卷</div>
                </div>
              </div>
            )}
          </section>
        )}

        {/* Tab: 紧急应对 */}
        {tab === 'emergency' && (
          <section className="space-y-3 mb-8">
            <div
              className="rounded-2xl p-4 mb-4"
              style={{ backgroundColor: BRAND.dangerLt, border: `1px solid ${BRAND.danger}33` }}
            >
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 flex-shrink-0" style={{ color: BRAND.danger }} />
                <div>
                  <div className="text-sm font-semibold mb-1" style={{ color: BRAND.danger }}>紧急情况响应流程</div>
                  <div className="text-[12px]" style={{ color: BRAND.text }}>
                    若您怀疑账户被盗、资产异常或遭遇诈骗，请按以下步骤立即响应。
                  </div>
                </div>
              </div>
            </div>
            {EMERGENCY_STEPS.map((s, i) => {
              const Icon = s.icon;
              return (
                <div
                  key={s.id}
                  className="rounded-2xl p-4"
                  style={{
                    backgroundColor: BRAND.card,
                    border: `1px solid ${s.hot ? BRAND.danger : BRAND.border}`,
                    animation: `fadeUp 0.4s ease-out ${i * 0.04}s both`,
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center font-mono font-bold flex-shrink-0" style={{ backgroundColor: s.hot ? BRAND.dangerLt : BRAND.primaryLt, color: s.hot ? BRAND.danger : BRAND.primary }}>
                      {s.id}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Icon className="w-4 h-4" style={{ color: s.hot ? BRAND.danger : BRAND.primary }} />
                        <span className="text-sm font-semibold" style={{ color: BRAND.text }}>{s.title}</span>
                        {s.hot && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded font-mono" style={{ backgroundColor: BRAND.dangerLt, color: BRAND.danger }}>
                            HOT
                          </span>
                        )}
                        <span className="text-[10px] px-1.5 py-0.5 rounded ml-auto" style={{ backgroundColor: BRAND.cardElevated, color: BRAND.textMute }}>
                          {s.estimatedTime}
                        </span>
                      </div>
                      <div className="text-[12px] mb-2" style={{ color: BRAND.textSub }}>{s.description}</div>
                      <div className="text-[11px] p-2 rounded-lg font-mono" style={{ backgroundColor: BRAND.cardElevated, color: BRAND.primary }}>
                        操作：{s.action}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            <div
              className="rounded-2xl p-4 mt-4"
              style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}
            >
              <div className="text-sm font-semibold mb-3" style={{ color: BRAND.text }}>官方联系方式（仅以下渠道有效）</div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {[
                  { icon: MessageCircle, label: '站内信', value: '登录后通过站内信联系' },
                  { icon: Mail, label: '官方验证邮箱', value: 'support@zsdex.example' },
                  { icon: Phone, label: '紧急电话', value: '7×24 客服专线（需通过官网验证）' },
                ].map((c) => (
                  <div key={c.label} className="p-3 rounded-lg" style={{ backgroundColor: BRAND.cardElevated }}>
                    <c.icon className="w-4 h-4 mb-1" style={{ color: BRAND.primary }} />
                    <div className="text-[10px]" style={{ color: BRAND.textMute }}>{c.label}</div>
                    <div className="text-[12px] font-mono" style={{ color: BRAND.text }}>{c.value}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* 底部 CTA */}
        <section
          className="rounded-2xl p-6 mb-8 text-center"
          style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}
        >
          <ShieldAlert className="w-10 h-10 mx-auto mb-3" style={{ color: BRAND.danger }} />
          <h2 className="text-xl font-bold mb-2" style={{ color: BRAND.text }}>投资有风险，入市需谨慎</h2>
          <p className="text-sm max-w-2xl mx-auto mb-4" style={{ color: BRAND.textSub }}>
            数字资产属于高风险投资品种，本金可能全部损失。请结合自身风险承受能力，
            合理配置资产，严格执行风控纪律，必要时寻求专业投资顾问意见。
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <button
              onClick={() => setTab('assessment')}
              className="px-5 py-2.5 rounded-xl text-sm font-medium flex items-center gap-1.5"
              style={{ backgroundColor: BRAND.danger, color: '#fff' }}
            >
              <Calculator className="w-4 h-4" />
              开始风险测评
            </button>
            <button
              onClick={() => setTab('education')}
              className="px-5 py-2.5 rounded-xl text-sm font-medium flex items-center gap-1.5"
              style={{ backgroundColor: BRAND.cardElevated, color: BRAND.text, border: `1px solid ${BRAND.border}` }}
            >
              <GraduationCap className="w-4 h-4" />
              投资者教育
            </button>
            <button
              onClick={() => setTab('emergency')}
              className="px-5 py-2.5 rounded-xl text-sm font-medium flex items-center gap-1.5"
              style={{ backgroundColor: BRAND.cardElevated, color: BRAND.text, border: `1px solid ${BRAND.border}` }}
            >
              <Phone className="w-4 h-4" />
              紧急应对
            </button>
          </div>
        </section>
      </div>

      {/* ============== Drawer ============== */}
      {drawer.open && drawerContent && (
        <>
          <div className="fixed inset-0 z-40" style={{ backgroundColor: 'rgba(0, 0, 0, 0.75)' }} onClick={closeDrawer} />
          <div
            className="fixed right-0 top-0 bottom-0 w-full max-w-2xl z-50 overflow-y-auto"
            style={{ backgroundColor: BRAND.cardElevated, borderLeft: `1px solid ${BRAND.border}`, animation: 'slideIn 0.3s ease-out' }}
          >
            <div className="sticky top-0 z-10 p-4 flex items-center justify-between" style={{ backgroundColor: BRAND.cardElevated, borderBottom: `1px solid ${BRAND.border}` }}>
              <div>
                <div className="text-base font-semibold" style={{ color: BRAND.text }}>{drawerContent.title}</div>
                <div className="text-[11px] mt-0.5" style={{ color: BRAND.textSub }}>{drawerContent.subtitle}</div>
              </div>
              <button onClick={closeDrawer} className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: BRAND.card, color: BRAND.textSub }}>
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5">
              {drawerContent.type === 'category' && (() => {
                const c = drawerContent.data as RiskCategory;
                const Icon = c.icon;
                return (
                  <>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: BRAND.dangerLt, color: BRAND.danger }}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <div className="flex-1">
                        <div className="text-lg font-bold" style={{ color: BRAND.text }}>{c.name}</div>
                        <div className="text-[10px] font-mono" style={{ color: BRAND.textMute }}>{c.enName}</div>
                      </div>
                      <RiskLevelBadge level={c.level} />
                    </div>
                    <div className="text-[13px] mb-3" style={{ color: BRAND.textSub }}>{c.description}</div>
                    <div className="p-3 rounded-lg mb-4" style={{ backgroundColor: BRAND.dangerLt }}>
                      <div className="text-[10px] mb-0.5" style={{ color: BRAND.textMute }}>影响</div>
                      <div className="text-[12px]" style={{ color: BRAND.danger }}>{c.impact}</div>
                    </div>
                    <div className="mb-4">
                      <div className="text-[11px] font-semibold mb-2" style={{ color: BRAND.textMute }}>发生概率</div>
                      <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: BRAND.card }}>
                        <div className="h-full" style={{ width: `${c.likelihood}%`, backgroundColor: c.likelihood >= 70 ? BRAND.danger : c.likelihood >= 40 ? BRAND.amber : BRAND.success }} />
                      </div>
                      <div className="text-right text-[10px] mt-1" style={{ color: BRAND.textMute }}>{c.likelihood}%</div>
                    </div>
                    <div className="mb-4">
                      <div className="text-[11px] font-semibold mb-2" style={{ color: BRAND.textMute }}>风险案例</div>
                      <ul className="space-y-1.5">
                        {c.examples.map((e) => (
                          <li key={e} className="text-[12px] flex items-start gap-2" style={{ color: BRAND.textSub }}>
                            <History className="w-3 h-3 mt-0.5 flex-shrink-0" style={{ color: BRAND.danger }} />
                            <span>{e}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <div className="text-[11px] font-semibold mb-2" style={{ color: BRAND.textMute }}>缓解措施</div>
                      <ul className="space-y-1.5">
                        {c.mitigations.map((m) => (
                          <li key={m} className="text-[12px] flex items-start gap-2" style={{ color: BRAND.text }}>
                            <CheckCircle2 className="w-3 h-3 mt-0.5 flex-shrink-0" style={{ color: BRAND.success }} />
                            <span>{m}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </>
                );
              })()}

              {drawerContent.type === 'asset' && (() => {
                const a = drawerContent.data as AssetRisk;
                return (
                  <>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center font-mono font-bold" style={{ backgroundColor: BRAND.dangerLt, color: BRAND.danger }}>
                        {a.symbol.slice(0, 3)}
                      </div>
                      <div className="flex-1">
                        <div className="text-lg font-bold" style={{ color: BRAND.text }}>{a.symbol} · {a.name}</div>
                        <div className="text-[10px]" style={{ color: BRAND.textMute }}>{a.category}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-[9px]" style={{ color: BRAND.textMute }}>风险评分</div>
                        <div className="text-2xl font-bold font-mono" style={{ color: a.riskScore >= 70 ? BRAND.danger : a.riskScore >= 50 ? BRAND.amber : BRAND.success }}>{a.riskScore}</div>
                      </div>
                    </div>
                    <div className="text-[13px] mb-4" style={{ color: BRAND.textSub }}>{a.description}</div>
                    <div className="grid grid-cols-3 gap-2 mb-4">
                      <div className="p-2 rounded-lg" style={{ backgroundColor: BRAND.card }}>
                        <div className="text-[10px]" style={{ color: BRAND.textMute }}>波动率 (30d)</div>
                        <div className="text-sm font-mono" style={{ color: BRAND.text }}>{a.volatility}%</div>
                      </div>
                      <div className="p-2 rounded-lg" style={{ backgroundColor: BRAND.card }}>
                        <div className="text-[10px]" style={{ color: BRAND.textMute }}>流动性</div>
                        <div className="text-sm" style={{ color: BRAND.text }}>{a.liquidity === 'high' ? '高' : a.liquidity === 'medium' ? '中' : '低'}</div>
                      </div>
                      <div className="p-2 rounded-lg" style={{ backgroundColor: BRAND.card }}>
                        <div className="text-[10px]" style={{ color: BRAND.textMute }}>中心化</div>
                        <div className="text-sm" style={{ color: BRAND.text }}>{a.centralization === 'high' ? '高' : a.centralization === 'medium' ? '中' : '低'}</div>
                      </div>
                    </div>
                    <div className="mb-4">
                      <div className="text-[11px] font-semibold mb-2" style={{ color: BRAND.textMute }}>分类风险</div>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="p-2 rounded-lg text-center" style={{ backgroundColor: BRAND.card }}>
                          <div className="text-[9px]" style={{ color: BRAND.textMute }}>市场风险</div>
                          <RiskLevelBadge level={a.marketRisk} />
                        </div>
                        <div className="p-2 rounded-lg text-center" style={{ backgroundColor: BRAND.card }}>
                          <div className="text-[9px]" style={{ color: BRAND.textMute }}>技术风险</div>
                          <RiskLevelBadge level={a.technicalRisk} />
                        </div>
                        <div className="p-2 rounded-lg text-center" style={{ backgroundColor: BRAND.card }}>
                          <div className="text-[9px]" style={{ color: BRAND.textMute }}>合规风险</div>
                          <RiskLevelBadge level={a.regulatoryRisk} />
                        </div>
                      </div>
                    </div>
                    <div>
                      <div className="text-[11px] font-semibold mb-2" style={{ color: BRAND.textMute }}>风险提示</div>
                      <ul className="space-y-1.5">
                        {a.warnings.map((w) => (
                          <li key={w} className="text-[12px] flex items-start gap-2" style={{ color: BRAND.text }}>
                            <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" style={{ color: BRAND.amber }} />
                            <span>{w}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </>
                );
              })()}

              {drawerContent.type === 'case' && (() => {
                const c = drawerContent.data as RiskCase;
                return (
                  <>
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded" style={{ backgroundColor: BRAND.dangerLt, color: BRAND.danger }}>{c.date}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: BRAND.card, color: BRAND.textMute }}>{c.category}</span>
                    </div>
                    <div className="text-lg font-bold mb-1" style={{ color: BRAND.text }}>{c.title}</div>
                    <div className="text-[11px] font-mono mb-3" style={{ color: BRAND.danger }}>{c.lossScale}</div>
                    <div className="text-[13px] mb-4" style={{ color: BRAND.textSub }}>{c.description}</div>
                    <div className="p-3 rounded-lg mb-4" style={{ backgroundColor: BRAND.amberLt }}>
                      <div className="text-[10px] mb-1" style={{ color: BRAND.amber }}>经验教训</div>
                      <div className="text-[12px]" style={{ color: BRAND.text }}>{c.lesson}</div>
                    </div>
                    <div>
                      <div className="text-[11px] font-semibold mb-2" style={{ color: BRAND.textMute }}>防范建议</div>
                      <ul className="space-y-1.5">
                        {c.prevention.map((p) => (
                          <li key={p} className="text-[12px] flex items-start gap-2" style={{ color: BRAND.text }}>
                            <CheckCircle2 className="w-3 h-3 mt-0.5 flex-shrink-0" style={{ color: BRAND.success }} />
                            <span>{p}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </>
                );
              })()}

              {drawerContent.type === 'edu' && (() => {
                const e = drawerContent.data as EduResource;
                return (
                  <>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: BRAND.primaryLt, color: BRAND.primary }}>
                        <GraduationCap className="w-6 h-6" />
                      </div>
                      <div className="flex-1">
                        <div className="text-lg font-bold" style={{ color: BRAND.text }}>{e.title}</div>
                        <div className="text-[10px]" style={{ color: BRAND.textMute }}>{e.topic} · {e.duration}</div>
                      </div>
                    </div>
                    <div className="text-[13px] mb-4" style={{ color: BRAND.textSub }}>{e.description}</div>
                    <div className="grid grid-cols-3 gap-2 mb-4">
                      <div className="p-2 rounded-lg" style={{ backgroundColor: BRAND.card }}>
                        <div className="text-[10px]" style={{ color: BRAND.textMute }}>时长</div>
                        <div className="text-sm" style={{ color: BRAND.text }}>{e.duration}</div>
                      </div>
                      <div className="p-2 rounded-lg" style={{ backgroundColor: BRAND.card }}>
                        <div className="text-[10px]" style={{ color: BRAND.textMute }}>已学习</div>
                        <div className="text-sm font-mono" style={{ color: BRAND.text }}>{e.enrolled.toLocaleString()}</div>
                      </div>
                      <div className="p-2 rounded-lg" style={{ backgroundColor: BRAND.card }}>
                        <div className="text-[10px]" style={{ color: BRAND.textMute }}>评分</div>
                        <div className="text-sm font-mono" style={{ color: BRAND.amber }}>★ {e.rating}</div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button className="flex-1 py-2.5 rounded-lg text-sm font-medium flex items-center justify-center gap-1.5" style={{ backgroundColor: BRAND.primary, color: BRAND.onPrimary }}>
                        <PlayCircle className="w-4 h-4" />
                        开始学习
                      </button>
                      <button className="px-4 py-2.5 rounded-lg text-sm" style={{ backgroundColor: BRAND.card, color: BRAND.textSub, border: `1px solid ${BRAND.border}` }}>
                        <Download className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </>
                );
              })()}

              {drawerContent.type === 'trade' && (() => {
                const t = drawerContent.data as TradeRisk;
                return (
                  <>
                    <div className="flex items-center gap-2 mb-3">
                      <LineChart className="w-5 h-5" style={{ color: BRAND.primary }} />
                      <span className="text-lg font-bold" style={{ color: BRAND.text }}>{t.name}</span>
                      {t.leverage && (
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded" style={{ backgroundColor: BRAND.dangerLt, color: BRAND.danger }}>
                          杠杆 {t.leverage}
                        </span>
                      )}
                    </div>
                    <div className="text-[13px] mb-4" style={{ color: BRAND.textSub }}>{t.description}</div>
                    <div className="mb-4">
                      <div className="text-[11px] font-semibold mb-2" style={{ color: BRAND.textMute }}>关键风险</div>
                      <div className="flex flex-wrap gap-1">
                        {t.keyRisks.map((r) => (
                          <span key={r} className="text-[10px] px-2 py-1 rounded" style={{ backgroundColor: BRAND.dangerLt, color: BRAND.danger }}>
                            {r}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="mb-4">
                      <div className="text-[11px] font-semibold mb-2" style={{ color: BRAND.textMute }}>风控措施</div>
                      <div className="flex flex-wrap gap-1">
                        {t.safeguards.map((s) => (
                          <span key={s} className="text-[10px] px-2 py-1 rounded" style={{ backgroundColor: BRAND.successLt, color: BRAND.success }}>
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="p-3 rounded-lg" style={{ backgroundColor: BRAND.cardElevated }}>
                      <div className="text-[10px]" style={{ color: BRAND.textMute }}>建议经验等级</div>
                      <div className="text-base font-semibold" style={{ color: BRAND.text }}>{t.requiredExperience}</div>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        </>
      )}

      {/* Help Drawer */}
      {helpOpen && (
        <>
          <div className="fixed inset-0 z-40" style={{ backgroundColor: 'rgba(0, 0, 0, 0.75)' }} onClick={() => setHelpOpen(false)} />
          <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md z-50 rounded-2xl p-5" style={{ backgroundColor: BRAND.cardElevated, border: `1px solid ${BRAND.border}` }}>
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
                { k: '1-7', v: '切换 Tab（总览/资产/交易/案例/教育/测评/紧急）' },
              ].map((s) => (
                <div key={s.k} className="flex items-center justify-between text-[12px] p-2 rounded-lg" style={{ backgroundColor: BRAND.card }}>
                  <span className="font-mono px-2 py-0.5 rounded text-[11px]" style={{ backgroundColor: BRAND.cardElevated, color: BRAND.primary }}>{s.k}</span>
                  <span style={{ color: BRAND.textSub }}>{s.v}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

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

export default PortalRiskDisclosure;
