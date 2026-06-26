import type {
  AddressInfo,
  NavItem,
  HeroStat,
  LicenseInfo,
  BusinessEngine,
  FAQItem,
  FeatureItem,
  SecurityItem,
  StepItem,
  NodeInfo,
  ConnectionInfo,
} from '@/types';

// ==================== 三地地址信息 ====================
export const FOOTER_ADDRESSES: AddressInfo[] = [
  {
    region: '海南',
    city: '海口',
    address: '海南省海口市龙华区国贸路2号时代广场27层',
    phone: '+86-898-6677-8888',
    email: 'contact@zs-exchange.cn',
    flag: '🇨🇳',
  },
  {
    region: '萨摩亚',
    city: '阿皮亚',
    address: 'Level 2, Samoa Pacific Centre, Beach Road, Apia, Samoa',
    phone: '+685-20-000',
    email: 'samoa@zs-exchange.com',
    flag: '🇼🇸',
  },
  {
    region: '香港',
    city: '中环',
    address: '香港中环皇后大道中181号新纪元广场低座25楼2501-03室',
    phone: '+852-3000-8888',
    email: 'hk@zs-exchange.com',
    flag: '🇭🇰',
  },
];

// ==================== 导航菜单 ====================
export const NAV_ITEMS: NavItem[] = [
  { label: '首页', href: '/' },
  {
    label: '行情',
    href: '/markets',
    children: [
      { label: '行情市场', href: '/markets' },
      { label: '全部交易对', href: '/trade/pairs' },
    ],
  },
  {
    label: '合约',
    href: '/trade/futures',
    children: [
      { label: '合约交易', href: '/trade/futures' },
      { label: '永续合约', href: '/trade/futures/perpetual' },
      { label: '我的持仓', href: '/trade/futures/positions' },
      { label: '合约订单', href: '/trade/futures/orders' },
    ],
  },
  {
    label: '福建老酒',
    href: '/shop',
    badge: '首发',
    children: [
      { label: '商城首页', href: '/shop' },
      { label: '我的订单', href: '/shop/orders' },
      { label: '渠道中心', href: '/shop/channel' },
      { label: '分润明细', href: '/shop/profits' },
    ],
  },
  {
    label: 'Web3',
    href: '/web3',
    children: [
      { label: 'Web3钱包', href: '/web3/wallet' },
      { label: 'DApp浏览器', href: '/web3/browser' },
      { label: '跨链桥', href: '/web3/bridge' },
    ],
  },
  { label: '登录', href: '/login' },
  { label: '注册', href: '/register', variant: 'primary' as const },
];

// ==================== Hero统计卡片 (6张) ====================
export const HERO_STATS: HeroStat[] = [
  {
    id: 'dual-license',
    value: 'Dual',
    label: '萨摩亚双牌照合规交易所',
    icon: '🏛️',
  },
  {
    id: 'triple-node',
    value: '3Node',
    label: '三地运营中心(海南/萨摩亚/香港)',
    icon: '🌏',
  },
  {
    id: 'low-latency',
    value: '<10ms',
    label: '撮合引擎延迟',
    icon: '⚡',
  },
  {
    id: 'engines',
    value: '5Engine',
    label: '核心业务引擎集群',
    icon: '⚙️',
  },
  {
    id: 'pairs',
    value: '500+',
    label: '交易对数量',
    icon: '📊',
  },
  {
    id: 'countries',
    value: '180+',
    label: '覆盖国家与地区',
    icon: '🌍',
  },
];

// ==================== 牌照数据 (3张) ====================
export const LICENSES_DATA: LicenseInfo[] = [
  {
    id: 'samoa-exchange',
    type: 'exchange',
    country: '萨摩亚',
    countryCode: 'WS',
    licenseNumber: 'DSAEX-2024-001',
    issuer: 'Samoa Digital Assets Exchange Commission',
    description: '数字资产交易所牌照 - 合法开展加密货币现货、衍生品交易业务，受萨摩亚金融监管局监管',
    icon: '🪙',
    status: 'active',
    issuedDate: '2024-01-15',
  },
  {
    id: 'samoa-stock',
    type: 'stock',
    country: '萨摩亚',
    countryCode: 'WS',
    licenseNumber: 'DSAST-2024-002',
    issuer: 'Samoa Securities Trading Commission',
    description: '证券交易牌照 - 可开展STO(证券型代币发行)、数字证券交易、股权代币化等创新业务',
    icon: '📈',
    status: 'active',
    issuedDate: '2024-02-20',
  },
  {
    id: 'hk1683',
    type: 'exchange',
    country: '中国香港',
    countryCode: 'HK',
    licenseNumber: 'HKVASP-1683',
    issuer: 'Hong Kong Securities and Futures Commission',
    description: '香港虚拟资产交易平台牌照申请中 - 符合香港SFC虚拟资产交易平台监管框架要求',
    icon: '🇭🇰',
    status: 'pending',
    issuedDate: '2024-06-01',
  },
];

// ==================== 业务引擎 (5大引擎) ====================
export const BUSINESS_ENGINES: BusinessEngine[] = [
  {
    id: 'matching-engine',
    name: '高性能撮合引擎',
    nameEn: 'High Performance Matching Engine',
    icon: '⚡',
    description: '基于Rust开发的自研撮合引擎，支持每秒百万级订单处理，延迟低于10ms',
    features: ['内存撮合', '多级价格队列', 'FAK/FOK/GTC订单类型', '热备容灾'],
  },
  {
    id: 'risk-engine',
    name: '智能风控引擎',
    nameEn: 'Intelligent Risk Control Engine',
    icon: '🛡️',
    description: 'AI驱动的实时风控系统，支持异常交易检测、反洗钱监控、市场操纵识别',
    features: ['实时监控', 'AI异常检测', 'AML/KYC集成', '多维度风控'],
  },
  {
    id: 'settlement-engine',
    name: '清结算引擎',
    nameEn: 'Settlement & Clearing Engine',
    icon: '💰',
    description: 'T+0/T+1灵活清算模式，支持多币种自动划转，确保资金安全高效流转',
    features: ['T+0/T+1模式', '多币种支持', '智能路由', '对账自动化'],
  },
  {
    id: 'market-data-engine',
    name: '行情数据引擎',
    nameEn: 'Market Data Engine',
    icon: '📊',
    description: '分布式行情聚合系统，整合全球主流交易所数据，提供毫秒级行情推送',
    features: ['多源聚合', 'WebSocket推送', 'K线生成', '深度数据'],
  },
  {
    id: 'compliance-engine',
    name: '合规审计引擎',
    nameEn: 'Compliance & Audit Engine',
    icon: '✅',
    description: '符合国际标准的合规体系，支持交易记录留存、监管报送、审计追踪全流程管理',
    features: ['交易存证', '监管报送', '区块链存证', '审计追溯'],
  },
];

// ==================== FAQ问答 (8个) ====================
export const FAQ_DATA: FAQItem[] = [
  {
    id: 'faq-1',
    question: 'ZS Exchange持有哪些牌照？',
    answer: 'ZS Exchange持有萨摩亚数字资产交易所牌照(DSAEX-2024-001)和萨摩亚证券交易牌照(DSAST-2024-002)，同时正在申请香港SFC虚拟资产交易平台牌照。我们严格遵循国际监管标准，为用户提供安全合规的交易环境。',
    category: 'license',
  },
  {
    id: 'faq-2',
    question: '如何注册并开始交易？',
    answer: '注册流程简单快捷：1. 使用邮箱或手机号注册账户；2. 完成KYC身份认证；3. 充值USDT或其他支持的加密货币；4. 选择交易对开始交易。整个过程通常可在15分钟内完成。',
    category: 'general',
  },
  {
    id: 'faq-3',
    question: 'ZS Exchange支持哪些交易方式？',
    answer: '我们提供多种交易方式：现货交易(Spot)、永续合约(Perpetual Futures)、交割合约(Delivery Futures)、杠杆交易(Margin Trading)，最高支持100倍杠杆。未来还将推出期权交易和指数产品。',
    category: 'trading',
  },
  {
    id: 'faq-4',
    question: '资金安全如何保障？',
    answer: '我们采用多重安全保障措施：98%的冷钱包存储、多重签名技术、24/7实时监控、保险基金池。所有用户资产均独立存储在托管银行，并与公司运营资金完全隔离。',
    category: 'security',
  },
  {
    id: 'faq-5',
    question: '手续费是多少？是否有优惠？',
    answer: '现货交易手续费率为Maker 0.08% / Taker 0.1%，合约交易为0.05%。VIP用户可享受更低费率，使用平台原生代币ZST支付手续费还可享受额外折扣。',
    category: 'trading',
  },
  {
    id: 'faq-6',
    question: '萨摩亚牌照是否被国际认可？',
    answer: '萨摩亚是英联邦成员国，其金融监管框架遵循国际标准。我们的牌照由萨摩亚政府授权的专业监管机构颁发，符合FATF(反洗钱金融行动特别工作组)的要求，在全球范围内具有法律效力。',
    category: 'license',
  },
  {
    id: 'faq-7',
    question: '如何联系客服？',
    answer: '我们提供7x24小时多渠道客服支持：在线工单系统、邮件(support@zs-exchange.com)、Telegram官方群、以及海南/香港办公室电话。VIP用户还享有专属客户经理一对一服务。',
    category: 'general',
  },
  {
    id: 'faq-8',
    question: '是否支持API交易？',
    answer: '是的，我们提供完整的REST API和WebSocket接口，支持程序化交易、量化策略执行、行情数据获取等功能。API文档详尽，并提供SDK示例代码(Python/Node.js/Go)。',
    category: 'trading',
  },
];

// ==================== 特性卡片 (6大特性) ====================
export const FEATURES: FeatureItem[] = [
  {
    id: 'feature-compliance',
    title: '双牌照合规',
    description: '持有萨摩亚数字资产交易所+证券交易双牌照，符合国际监管标准',
    icon: '🏛️',
  },
  {
    id: 'feature-security',
    title: '银行级安全',
    description: '冷热钱包分离、多重签名、实时风控，资产安全保障行业领先',
    icon: '🔒',
  },
  {
    id: 'feature-speed',
    title: '极速撮合',
    description: '自研Rust撮合引擎，延迟<10ms，支撑百万级TPS高并发交易',
    icon: '⚡',
  },
  {
    id: 'feature-liquidity',
    title: '深度流动性',
    description: '500+交易对，全球流动性聚合，盘口深度充足，滑点极小',
    icon: '💧',
  },
  {
    id: 'feature-multi-assets',
    title: '多元资产',
    description: '支持现货、合约、杠杆、理财、NFT、IDO等多种投资品种',
    icon: '🎯',
  },
  {
    id: 'feature-global',
    title: '全球化服务',
    description: '海南/萨摩亚/香港三地运营，支持180+国家和地区用户访问',
    icon: '🌍',
  },
];

// ==================== 安全项目 (6项安全) ====================
export const SECURITY_ITEMS: SecurityItem[] = [
  {
    id: 'security-cold-wallet',
    title: '冷钱包存储',
    description: '98%资产离线存储于硬件冷钱包，物理隔离杜绝黑客攻击风险',
    icon: '❄️',
  },
  {
    id: 'security-multi-sig',
    title: '多重签名',
    description: '关键操作需3/5多方签名确认，防止单点故障和内部作恶',
    icon: '🔐',
  },
  {
    id: 'security-realtime-monitor',
    title: '实时监控',
    description: '7x24小时AI驱动监控系统，异常行为秒级响应拦截',
    icon: '👁️',
  },
  {
    id: 'security-insurance-fund',
    title: '保险基金',
    description: '设立专项风险准备金池，极端情况下全额赔付用户损失',
    icon: '🛡️',
  },
  {
    id: 'security-kyc-aml',
    title: 'KYC/AML合规',
    description: '严格的身份认证与反洗钱流程，符合FATF国际标准',
    icon: '✅',
  },
  {
    id: 'security-audit',
    title: '第三方审计',
    description: '定期接受知名安全机构(Certik/SLOWMIST)智能合约与系统安全审计',
    icon: '📋',
  },
];

// ==================== 入门步骤 (4步入门) ====================
export const STEPS: StepItem[] = [
  {
    id: 1,
    title: '注册账户',
    description: '使用邮箱或手机号快速注册，完成基础信息填写',
    icon: '📝',
  },
  {
    id: 2,
    title: '身份验证',
    description: '上传身份证件完成KYC认证，通常5分钟内审核通过',
    icon: '🆔',
  },
  {
    id: 3,
    title: '充值资产',
    description: '通过链上转账或法币通道充值USDT、BTC等主流加密货币',
    icon: '💳',
  },
  {
    id: 4,
    title: '开始交易',
    description: '选择交易对，下单买入/卖出，体验专业级交易服务',
    icon: '🚀',
  },
];

// ==================== 三地节点数据 (3节点) ====================
export const NODES: NodeInfo[] = [
  {
    id: 'hainan',
    city: '海南',
    country: '中国',
    flag: '🇨🇳',
    role: '运营根基',
    roleEn: 'Operations Hub',
    color: '#3B82F6',
    colorFrom: '#3B82F6',
    colorTo: '#06B6D4',
    isCore: false,
    assets: ['用户运营中心', '技术支持团队', '市场推广基地', '合规风控分部'],
    position: { x: 25, y: 20 },
  },
  {
    id: 'samoa',
    city: '萨摩亚',
    country: '萨摩亚',
    flag: '🇼🇸',
    role: '核心节点 · 牌照中心',
    roleEn: 'CORE NODE · License Center',
    color: '#10B981',
    colorFrom: '#10B981',
    colorTo: '#14B8A6',
    isCore: true,
    assets: ['数字资产交易所牌照', '证券交易所牌照', 'STO发行通道', '企业上市服务'],
    position: { x: 50, y: 70 },
  },
  {
    id: 'hongkong',
    city: '香港',
    country: '中国香港',
    flag: '🇭🇰',
    role: '资本出口',
    roleEn: 'Capital Gateway',
    color: '#D4AF37',
    colorFrom: '#D4AF37',
    colorTo: '#F59E0B',
    isCore: false,
    assets: ['HK1683上市通道', '港股IPO服务', 'SPAC/RTO通道', '国际资本对接'],
    position: { x: 75, y: 20 },
  },
];

// ==================== 三地连线数据 (3条连线) ====================
export const CONNECTIONS: ConnectionInfo[] = [
  { from: 'hainan', to: 'samoa', type: 'primary' },
  { from: 'samoa', to: 'hongkong', type: 'primary' },
  { from: 'hainan', to: 'hongkong', type: 'secondary' },
];
