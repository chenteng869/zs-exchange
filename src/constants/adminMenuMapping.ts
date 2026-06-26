'use client';

// 中萨数字科技集团 管理后台菜单与门户首页功能区域映射关系 (v2.0 生态增强版)
export const adminMenuPortalMapping = {
  // 主菜单分组映射
  mainGroups: {
    '/admin/dashboard': {
      title: '数据中心',
      portalSection: 'dashboard',
      iconKey: 'dashboard',
      description: '平台核心数据概览与统计分析',
    },
    'web3-group': {
      title: 'Web3.0 管理',
      portalSection: 'web3',
      iconKey: 'thunderbolt',
      description: 'Web3 数据看板、DApp 接入管理、区块链监控',
    },
    'chain-group': {
      title: '公链管理',
      portalSection: 'chain',
      iconKey: 'global',
      description: '节点管理、区块浏览、链上治理、网络监控、跨链桥',
    },
    'cex-group': {
      title: 'CEX 交易所',
      portalSection: 'cex',
      iconKey: 'creditcard',
      description: '币币交易、合约交易、杠杆交易、订单管理、交易对配置、行情管理、风险控制',
    },
    'dex-group': {
      title: 'DEX 交易所',
      portalSection: 'dex',
      iconKey: 'swap',
      description: '流动性池、闪兑交易、流动性挖矿、交易对管理',
    },
    'defi-group': {
      title: 'DeFi 管理',
      portalSection: 'defi',
      iconKey: 'fund',
      description: '质押管理、流动性管理、收益分配',
    },
    'wallet-group': {
      title: 'Web3 钱包',
      portalSection: 'wallet',
      iconKey: 'wallet',
      description: '地址管理、资产监控、交易记录、NFT 资产、安全策略',
    },
    'staking-group': {
      title: '质押挖矿',
      portalSection: 'staking',
      iconKey: 'accountbook',
      description: '矿池管理、质押记录、收益发放、推荐关系、收益率配置',
    },
    'ido-group': {
      title: 'IDO/Launchpad',
      portalSection: 'ido',
      iconKey: 'rocket',
      description: '项目管理、白名单管理、申购管理、解锁计划、代币发放',
    },
    'ai-brain-group': {
      title: 'AI策略大脑',
      portalSection: 'quant',
      iconKey: 'robot',
      description: 'AI量化策略、智能投研、投资组合、回测中心、12位投资大师、策略市场',
    },
    'copy-trading-group': {
      title: '跟单与交易',
      portalSection: 'copy-trading',
      iconKey: 'link',
      description: '跟单管理、策略订阅、绩效分析、自动交易日志',
    },
    'token-score-group': {
      title: '代币评分系统',
      portalSection: 'token-score',
      iconKey: 'star',
      description: '代币AI评分、经济模型审计、链上健康度、上币定价建议、风险预警',
    },
    'enterprise-advisor-group': {
      title: '企业AI投研',
      portalSection: 'enterprise-advisor',
      iconKey: 'bank',
      description: '企业诊断报告、行业对标矩阵、供应链图谱、AIOPC工具推荐、数字化评估',
    },
    'strategy-distribution-group': {
      title: '策略分销中心',
      portalSection: 'strategy-distribution',
      iconKey: 'fund',
      description: '策略产品化、分销网络、转化漏斗、流量分析、收益分成报表',
    },
    'ipo-assessment-group': {
      title: 'IPO评估系统',
      portalSection: 'ipo-assessment',
      iconKey: 'trophy',
      description: '上市Pipeline、可行性评分、DCF估值、同行对标、定价模拟、路演材料生成',
    },
    'entertainment-group': {
      title: '娱乐游戏',
      portalSection: 'entertainment',
      iconKey: 'trophy',
      description: '幸运抽奖、盲盒系统、竞技游戏、奖品管理、中奖记录',
    },
    'ecommerce-group': {
      title: '电商商城',
      portalSection: 'ecommerce',
      iconKey: 'shop',
      description: '商品管理、订单管理、库存管理、物流配置、财务管理',
    },
    'content-group': {
      title: '国学内容',
      portalSection: 'content',
      iconKey: 'filetext',
      description: '国学动漫、真人短剧、非遗内容、内容审核、内容 NFT',
    },
    'user-group': {
      title: '用户运营',
      portalSection: 'user',
      iconKey: 'team',
      description: '用户管理、KYC 审核、等级管理、邀请关系',
    },
    'finance-group': {
      title: '财务中心',
      portalSection: 'finance',
      iconKey: 'dollar',
      description: '财务概览、收入统计、对账管理、结算管理',
    },
    'system-group': {
      title: '系统管理',
      portalSection: 'system',
      iconKey: 'setting',
      description: '系统设置、管理员管理、权限管理、操作日志、服务器监控',
    },
  },

  // 子菜单详细映射
  subMenuItems: {
    // Web3.0 管理
    '/admin/web3/dashboard': {
      title: 'Web3 数据看板',
      portalSection: 'web3-dashboard',
      group: 'web3-group',
    },
    '/admin/web3/dapps': {
      title: 'DApp 接入管理',
      portalSection: 'web3-dapps',
      group: 'web3-group',
    },
    '/admin/web3/blockchain': {
      title: '区块链监控',
      portalSection: 'web3-blockchain',
      group: 'web3-group',
    },

    // 公链管理
    '/admin/chain/nodes': {
      title: '节点管理',
      portalSection: 'chain-nodes',
      group: 'chain-group',
    },
    '/admin/chain/explorer': {
      title: '区块浏览',
      portalSection: 'chain-explorer',
      group: 'chain-group',
    },
    '/admin/chain/governance': {
      title: '链上治理',
      portalSection: 'chain-governance',
      group: 'chain-group',
    },
    '/admin/chain/monitor': {
      title: '网络监控',
      portalSection: 'chain-monitor',
      group: 'chain-group',
    },
    '/admin/chain/bridge': {
      title: '跨链桥',
      portalSection: 'chain-bridge',
      group: 'chain-group',
    },

    // CEX 交易所
    '/admin/cex/spot': {
      title: '币币交易',
      portalSection: 'cex-spot',
      group: 'cex-group',
    },
    '/admin/cex/futures': {
      title: '合约交易',
      portalSection: 'cex-futures',
      group: 'cex-group',
    },
    '/admin/cex/leverage': {
      title: '杠杆交易',
      portalSection: 'cex-leverage',
      group: 'cex-group',
    },
    '/admin/cex/orders': {
      title: '订单管理',
      portalSection: 'cex-orders',
      group: 'cex-group',
    },
    '/admin/cex/pairs': {
      title: '交易对配置',
      portalSection: 'cex-pairs',
      group: 'cex-group',
    },
    '/admin/cex/market': {
      title: '行情管理',
      portalSection: 'cex-market',
      group: 'cex-group',
    },
    '/admin/cex/risk': {
      title: '风险控制',
      portalSection: 'cex-risk',
      group: 'cex-group',
    },

    // DEX 交易所
    '/admin/dex/pools': {
      title: '流动性池',
      portalSection: 'dex-pools',
      group: 'dex-group',
    },
    '/admin/dex/swap': {
      title: '闪兑交易',
      portalSection: 'dex-swap',
      group: 'dex-group',
    },
    '/admin/dex/farming': {
      title: '流动性挖矿',
      portalSection: 'dex-farming',
      group: 'dex-group',
    },
    '/admin/dex/pairs': {
      title: '交易对管理',
      portalSection: 'dex-pairs',
      group: 'dex-group',
    },

    // DeFi 管理
    '/admin/defi/staking': {
      title: '质押管理',
      portalSection: 'defi-staking',
      group: 'defi-group',
    },
    '/admin/defi/liquidity': {
      title: '流动性管理',
      portalSection: 'defi-liquidity',
      group: 'defi-group',
    },
    '/admin/defi/rewards': {
      title: '收益分配',
      portalSection: 'defi-rewards',
      group: 'defi-group',
    },

    // Web3 钱包
    '/admin/wallet/addresses': {
      title: '地址管理',
      portalSection: 'wallet-addresses',
      group: 'wallet-group',
    },
    '/admin/wallet/assets': {
      title: '资产监控',
      portalSection: 'wallet-assets',
      group: 'wallet-group',
    },
    '/admin/wallet/transactions': {
      title: '交易记录',
      portalSection: 'wallet-transactions',
      group: 'wallet-group',
    },
    '/admin/wallet/nfts': {
      title: 'NFT 资产',
      portalSection: 'wallet-nfts',
      group: 'wallet-group',
    },
    '/admin/wallet/security': {
      title: '安全策略',
      portalSection: 'wallet-security',
      group: 'wallet-group',
    },

    // 质押挖矿
    '/admin/staking/pools': {
      title: '矿池管理',
      portalSection: 'staking-pools',
      group: 'staking-group',
    },
    '/admin/staking/records': {
      title: '质押记录',
      portalSection: 'staking-records',
      group: 'staking-group',
    },
    '/admin/staking/rewards': {
      title: '收益发放',
      portalSection: 'staking-rewards',
      group: 'staking-group',
    },
    '/admin/staking/referral': {
      title: '推荐关系',
      portalSection: 'staking-referral',
      group: 'staking-group',
    },
    '/admin/staking/config': {
      title: '收益率配置',
      portalSection: 'staking-config',
      group: 'staking-group',
    },

    // IDO/Launchpad
    '/admin/ido/projects': {
      title: '项目管理',
      portalSection: 'ido-projects',
      group: 'ido-group',
    },
    '/admin/ido/whitelist': {
      title: '白名单管理',
      portalSection: 'ido-whitelist',
      group: 'ido-group',
    },
    '/admin/ido/subscriptions': {
      title: '申购管理',
      portalSection: 'ido-subscriptions',
      group: 'ido-group',
    },
    '/admin/ido/unlock': {
      title: '解锁计划',
      portalSection: 'ido-unlock',
      group: 'ido-group',
    },
    '/admin/ido/distribution': {
      title: '代币发放',
      portalSection: 'ido-distribution',
      group: 'ido-group',
    },

    // ====== AI策略大脑（原量化交易升级） ======
    '/admin/quant/dashboard': {
      title: '仪表盘总览',
      portalSection: 'quant-dashboard',
      group: 'ai-brain-group',
    },
    '/admin/quant/analysis': {
      title: '智能分析控制台',
      portalSection: 'quant-analysis',
      group: 'ai-brain-group',
    },
    '/admin/quant/portfolio': {
      title: '投资组合管理',
      portalSection: 'quant-portfolio',
      group: 'ai-brain-group',
    },
    '/admin/quant/backtest': {
      title: '回测中心',
      portalSection: 'quant-backtest',
      group: 'ai-brain-group',
    },
    '/admin/quant/agents': {
      title: '智能体面板(12大师)',
      portalSection: 'quant-agents',
      group: 'ai-brain-group',
    },
    '/admin/quant/settings': {
      title: '系统设置(API/模型)',
      portalSection: 'quant-settings',
      group: 'ai-brain-group',
    },
    '/admin/quant/strategy-market': {
      title: '策略市场',
      portalSection: 'quant-strategy-market',
      group: 'ai-brain-group',
    },

    // ====== 跟单与交易 ======
    '/admin/quant/copy-trading': {
      title: '跟单管理中心',
      portalSection: 'copy-trading-center',
      group: 'copy-trading-group',
    },
    '/admin/quant/copy-performance': {
      title: '跟单绩效分析',
      portalSection: 'copy-performance',
      group: 'copy-trading-group',
    },
    '/admin/quant/subscriptions': {
      title: '订阅管理',
      portalSection: 'copy-subscriptions',
      group: 'copy-trading-group',
    },
    '/admin/quant/trade-logs': {
      title: '自动交易日志',
      portalSection: 'trade-logs',
      group: 'copy-trading-group',
    },

    // ====== 代币评分系统 ======
    '/admin/quant/token-score': {
      title: '代币项目总览',
      portalSection: 'token-score-overview',
      group: 'token-score-group',
    },
    '/admin/quant/token-score/[id]': {
      title: 'AI评分详情',
      portalSection: 'token-score-detail',
      group: 'token-score-group',
    },
    '/admin/quant/token-audit': {
      title: '经济模型审计',
      portalSection: 'token-audit',
      group: 'token-score-group',
    },
    '/admin/quant/token-onchain': {
      title: '链上健康度分析',
      portalSection: 'token-onchain',
      group: 'token-score-group',
    },
    '/admin/quant/token-pricing': {
      title: '上币定价建议',
      portalSection: 'token-pricing',
      group: 'token-score-group',
    },
    '/admin/quant/token-warnings': {
      title: '风险预警列表',
      portalSection: 'token-warnings',
      group: 'token-score-group',
    },

    // ====== 企业AI投研 ======
    '/admin/quant/enterprise-advisor': {
      title: '入驻企业看板',
      portalSection: 'enterprise-advisor-dashboard',
      group: 'enterprise-advisor-group',
    },
    '/admin/quant/enterprise-report': {
      title: '企业诊断报告',
      portalSection: 'enterprise-report',
      group: 'enterprise-advisor-group',
    },
    '/admin/quant/benchmark': {
      title: '行业对标矩阵',
      portalSection: 'benchmark-matrix',
      group: 'enterprise-advisor-group',
    },
    '/admin/quant/supply-chain': {
      title: '供应链关系图谱',
      portalSection: 'supply-chain-graph',
      group: 'enterprise-advisor-group',
    },
    '/admin/quant/aiopc-tools': {
      title: 'AIOPC工具推荐',
      portalSection: 'aiopc-tools-recommend',
      group: 'enterprise-advisor-group',
    },
    '/admin/quant/digital-maturity': {
      title: '数字化成熟度评估',
      portalSection: 'digital-maturity',
      group: 'enterprise-advisor-group',
    },

    // ====== 策略分销中心 ======
    '/admin/quant/distribution/products': {
      title: '策略产品化面板',
      portalSection: 'distribution-products',
      group: 'strategy-distribution-group',
    },
    '/admin/quant/distribution/network': {
      title: '分销网络看板',
      portalSection: 'distribution-network',
      group: 'strategy-distribution-group',
    },
    '/admin/quant/distribution/funnel': {
      title: '策略转化漏斗',
      portalSection: 'distribution-funnel',
      group: 'strategy-distribution-group',
    },
    '/admin/quant/distribution/analytics': {
      title: '流量来源分析',
      portalSection: 'distribution-analytics',
      group: 'strategy-distribution-group',
    },
    '/admin/quant/distribution/settlement': {
      title: '收益分成报表',
      portalSection: 'distribution-settlement',
      group: 'strategy-distribution-group',
    },

    // ====== IPO评估系统 ======
    '/admin/quant/ipo-assessment': {
      title: 'IPO候选Pipeline',
      portalSection: 'ipo-pipeline',
      group: 'ipo-assessment-group',
    },
    '/admin/quant/ipo-score': {
      title: '上市可行性评分',
      portalSection: 'ipo-feasibility-score',
      group: 'ipo-assessment-group',
    },
    '/admin/quant/ipo-dcf': {
      title: 'DCF估值报告',
      portalSection: 'ipo-dcf-report',
      group: 'ipo-assessment-group',
    },
    '/admin/quant/ipo-peers': {
      title: '同行可比公司分析',
      portalSection: 'ipo-peer-analysis',
      group: 'ipo-assessment-group',
    },
    '/admin/quant/ipo-simulator': {
      title: 'IPO定价模拟器',
      portalSection: 'ipo-pricing-simulator',
      group: 'ipo-assessment-group',
    },
    '/admin/quant/ipo-roadshow': {
      title: '路演材料生成器',
      portalSection: 'ipo-roadshow-generator',
      group: 'ipo-assessment-group',
    },

    // 娱乐游戏
    '/admin/entertainment/lottery': {
      title: '幸运抽奖',
      portalSection: 'entertainment-lottery',
      group: 'entertainment-group',
    },
    '/admin/entertainment/blindbox': {
      title: '盲盒系统',
      portalSection: 'entertainment-blindbox',
      group: 'entertainment-group',
    },
    '/admin/entertainment/games': {
      title: '竞技游戏',
      portalSection: 'entertainment-games',
      group: 'entertainment-group',
    },
    '/admin/entertainment/prizes': {
      title: '奖品管理',
      portalSection: 'entertainment-prizes',
      group: 'entertainment-group',
    },
    '/admin/entertainment/records': {
      title: '中奖记录',
      portalSection: 'entertainment-records',
      group: 'entertainment-group',
    },

    // 电商商城
    '/admin/ecommerce/products': {
      title: '商品管理',
      portalSection: 'ecommerce-products',
      group: 'ecommerce-group',
    },
    '/admin/ecommerce/orders': {
      title: '订单管理',
      portalSection: 'ecommerce-orders',
      group: 'ecommerce-group',
    },
    '/admin/ecommerce/inventory': {
      title: '库存管理',
      portalSection: 'ecommerce-inventory',
      group: 'ecommerce-group',
    },
    '/admin/ecommerce/logistics': {
      title: '物流配置',
      portalSection: 'ecommerce-logistics',
      group: 'ecommerce-group',
    },
    '/admin/ecommerce/finance': {
      title: '财务管理',
      portalSection: 'ecommerce-finance',
      group: 'ecommerce-group',
    },

    // 国学内容
    '/admin/content/animation': {
      title: '国学动漫',
      portalSection: 'content-animation',
      group: 'content-group',
    },
    '/admin/content/drama': {
      title: '真人短剧',
      portalSection: 'content-drama',
      group: 'content-group',
    },
    '/admin/content/heritage': {
      title: '非遗内容',
      portalSection: 'content-heritage',
      group: 'content-group',
    },
    '/admin/content/audit': {
      title: '内容审核',
      portalSection: 'content-audit',
      group: 'content-group',
    },
    '/admin/content/nft': {
      title: '内容 NFT',
      portalSection: 'content-nft',
      group: 'content-group',
    },

    // 用户运营
    '/admin/users': {
      title: '用户管理',
      portalSection: 'user-management',
      group: 'user-group',
    },
    '/admin/users/kyc': {
      title: 'KYC 审核',
      portalSection: 'user-kyc',
      group: 'user-group',
    },
    '/admin/users/levels': {
      title: '等级管理',
      portalSection: 'user-levels',
      group: 'user-group',
    },
    '/admin/users/invite': {
      title: '邀请关系',
      portalSection: 'user-invite',
      group: 'user-group',
    },

    // 财务中心
    '/admin/finance/overview': {
      title: '财务概览',
      portalSection: 'finance-overview',
      group: 'finance-group',
    },
    '/admin/finance/revenue': {
      title: '收入统计',
      portalSection: 'finance-revenue',
      group: 'finance-group',
    },
    '/admin/finance/reconciliation': {
      title: '对账管理',
      portalSection: 'finance-reconciliation',
      group: 'finance-group',
    },
    '/admin/finance/settlement': {
      title: '结算管理',
      portalSection: 'finance-settlement',
      group: 'finance-group',
    },

    // 系统管理
    '/admin/settings': {
      title: '系统设置',
      portalSection: 'system-settings',
      group: 'system-group',
    },
    '/admin/settings/admins': {
      title: '管理员管理',
      portalSection: 'system-admins',
      group: 'system-group',
    },
    '/admin/settings/roles': {
      title: '权限管理',
      portalSection: 'system-roles',
      group: 'system-group',
    },
    '/admin/audit-logs': {
      title: '操作日志',
      portalSection: 'system-logs',
      group: 'system-group',
    },
    '/admin/settings/server': {
      title: '服务器监控',
      portalSection: 'system-server',
      group: 'system-group',
    },

    // ====== v2.0 新增：第17组 企业服务 子菜单 ======
    '/admin/enterprise/registration': {
      title: '公司注册管理',
      portalSection: 'enterprise-registration',
      group: 'enterprise-group',
    },
    '/admin/enterprise/spv': {
      title: 'SPV 公司管理',
      portalSection: 'enterprise-spv',
      group: 'enterprise-group',
    },
    '/admin/enterprise/services': {
      title: '企业服务产品',
      portalSection: 'enterprise-services',
      group: 'enterprise-group',
    },
    '/admin/enterprise/customers': {
      title: '客户关系管理',
      portalSection: 'enterprise-customers',
      group: 'enterprise-group',
    },
    '/admin/enterprise/compliance': {
      title: '企业合规管理',
      portalSection: 'enterprise-compliance',
      group: 'enterprise-group',
    },

    // ====== v2.0 新增：第18组 代币发行服务 子菜单 ======
    '/admin/token/projects': {
      title: '发行项目管理',
      portalSection: 'token-projects',
      group: 'token-issue-group',
    },
    '/admin/token/design': {
      title: '代币经济设计',
      portalSection: 'token-design',
      group: 'token-issue-group',
    },
    '/admin/token/deployment': {
      title: '代币部署管理',
      portalSection: 'token-deployment',
      group: 'token-issue-group',
    },
    '/admin/token/listing': {
      title: '上币管理',
      portalSection: 'token-listing',
      group: 'token-issue-group',
    },
    '/admin/token/compliance': {
      title: '代币合规',
      portalSection: 'token-compliance',
      group: 'token-issue-group',
    },

    // ====== v2.0 新增：第19组 上市通道服务 子菜单 ======
    '/admin/listing/samoa': {
      title: '萨摩亚证券交易所',
      portalSection: 'listing-samoa',
      group: 'listing-channel-group',
    },
    '/admin/listing/hk': {
      title: '香港 HK1683',
      portalSection: 'listing-hk',
      group: 'listing-channel-group',
    },
    '/admin/listing/pipeline': {
      title: '上市项目管线',
      portalSection: 'listing-pipeline',
      group: 'listing-channel-group',
    },
    '/admin/listing/post-listing': {
      title: '上市后服务',
      portalSection: 'listing-post-listing',
      group: 'listing-channel-group',
    },

    // ====== v2.0 新增：第20组 AIOPC 产业园 子菜单 ======
    '/admin/aiopc/park': {
      title: '产业园运营',
      portalSection: 'aiopc-park',
      group: 'aiopc-group',
    },
    '/admin/aiopc/members': {
      title: '入驻企业管理',
      portalSection: 'aiopc-members',
      group: 'aiopc-group',
    },
    '/admin/aiopc/tools': {
      title: 'AI 工具赋能',
      portalSection: 'aiopc-tools',
      group: 'aiopc-group',
    },
    '/admin/aiopc/spv-link': {
      title: '海萨联动',
      portalSection: 'aiopc-spv-link',
      group: 'aiopc-group',
    },
    '/admin/aiopc/global-replication': {
      title: '全球复制计划',
      portalSection: 'aiopc-global-replication',
      group: 'aiopc-group',
    },

    // ====== v2.0 新增：第21组 全球直销体系 子菜单 ======
    '/admin/dsales/network': {
      title: '分销网络',
      portalSection: 'dsales-network',
      group: 'direct-sales-group',
    },
    '/admin/dsales/products': {
      title: '直销产品',
      portalSection: 'dsales-products',
      group: 'direct-sales-group',
    },
    '/admin/dsales/commission': {
      title: '佣金结算',
      portalSection: 'dsales-commission',
      group: 'direct-sales-group',
    },
    '/admin/dsales/training': {
      title: '培训认证',
      portalSection: 'dsales-training',
      group: 'direct-sales-group',
    },
    '/admin/dsales/compliance': {
      title: '直销合规',
      portalSection: 'dsales-compliance',
      group: 'direct-sales-group',
    },

    // ====== v2.0 新增：第22组 牌照与合规中心 子菜单 ======
    '/admin/license/portfolio': {
      title: '牌照资产管理',
      portalSection: 'license-portfolio',
      group: 'license-hub-group',
    },
    '/admin/license/jurisdictions': {
      title: '多法域合规',
      portalSection: 'license-jurisdictions',
      group: 'license-hub-group',
    },
    '/admin/license/audit': {
      title: '内部审计',
      portalSection: 'license-audit',
      group: 'license-hub-group',
    },
    '/admin/license/governance': {
      title: '治理与风控',
      portalSection: 'license-governance',
      group: 'license-hub-group',
    },
    },
};

// 门户首页模块顺序配置
export const portalModulesOrder = [
  'dashboard',
  'web3',
  'chain',
  'cex',
  'dex',
  'defi',
  'wallet',
  'staking',
  'ido',
  // AI策略大脑体系（原 quant 升级）
  'ai-brain',
  'copy-trading',
  'token-score',
  'enterprise-advisor',
  'strategy-distribution',
  'ipo-assessment',
  'entertainment',
  'ecommerce',
  'content',
  'user',
  'finance',
  'system',
  // v2.0 新增模块
  'enterprise',
  'token-issue',
  'listing-channel',
  'aiopc',
  'direct-sales',
  'license-hub',
];

// 获取门户首页功能区域配置
export function getPortalModuleConfig(sectionKey: string) {
  const groupMapping = adminMenuPortalMapping.mainGroups;
  return Object.values(groupMapping).find(item => item.portalSection === sectionKey);
}

// 管理员后台菜单分组列表
export const adminMenuGroups = Object.keys(adminMenuPortalMapping.mainGroups);
