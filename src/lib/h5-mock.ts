/**
 * H5 Mock 数据工厂
 *
 * 为 H5 端所有页面提供模拟数据
 * 覆盖 15+ 种业务实体，后期对接真实 API 时仅需替换数据源
 */

/* ========== 1. 行情交易对 ========== */
export interface QuotePair {
  symbol: string;
  name: string;
  price: string;
  change: string;
  up: boolean;
  volume: string;
  high: string;
  low: string;
  hot: boolean;
}

export function getQuotePairs(): QuotePair[] {
  return [
    { symbol: 'BTC/USDT', name: 'Bitcoin',     price: '67,842.50', change: '+2.34%', volume: '24.5亿', high: '68,210.00', low: '66,980.00', up: true,  hot: true },
    { symbol: 'ETH/USDT', name: 'Ethereum',    price: '3,512.80',  change: '+1.87%', volume: '15.2亿', high: '3,548.00',  low: '3,420.50',  up: true,  hot: true },
    { symbol: 'SOL/USDT', name: 'Solana',      price: '182.45',    change: '-0.92%', volume: '8.3亿',  high: '186.20',    low: '180.10',    up: false, hot: true },
    { symbol: 'BNB/USDT', name: 'BNB',         price: '612.30',    change: '+0.45%', volume: '5.1亿',  high: '618.50',    low: '608.00',    up: true,  hot: false },
    { symbol: 'XRP/USDT', name: 'Ripple',      price: '0.5421',    change: '-1.23%', volume: '4.7亿',  high: '0.5510',    low: '0.5380',    up: false, hot: false },
    { symbol: 'ADA/USDT', name: 'Cardano',     price: '0.4523',    change: '+3.12%', volume: '3.2亿',  high: '0.4610',    low: '0.4380',    up: true,  hot: false },
    { symbol: 'DOGE/USDT',name: 'Dogecoin',    price: '0.1623',    change: '-2.45%', volume: '2.8亿',  high: '0.1680',    low: '0.1590',    up: false, hot: false },
    { symbol: 'AVAX/USDT',name: 'Avalanche',   price: '38.92',     change: '+1.23%', volume: '2.1亿',  high: '39.50',     low: '38.20',     up: true,  hot: false },
    { symbol: 'DOT/USDT', name: 'Polkadot',    price: '7.34',      change: '+0.87%', volume: '1.8亿',  high: '7.45',      low: '7.22',      up: true,  hot: false },
    { symbol: 'MATIC/USDT',name:'Polygon',     price: '0.7234',    change: '-0.34%', volume: '1.5亿',  high: '0.7350',    low: '0.7180',    up: false, hot: false },
    { symbol: 'LINK/USDT',name: 'Chainlink',   price: '14.82',     change: '+4.56%', volume: '1.2亿',  high: '15.20',     low: '14.10',     up: true,  hot: false },
    { symbol: 'UNI/USDT', name: 'Uniswap',     price: '7.89',      change: '-0.12%', volume: '0.9亿',  high: '8.02',      low: '7.75',      up: false, hot: false },
  ];
}

/* ========== 2. 用户资产 ========== */
export interface AssetItem {
  symbol: string;
  name: string;
  amount: string;
  value: string;
  pct: number;
  icon?: string;
}

export function getAssets(): AssetItem[] {
  return [
    { symbol: 'BTC',  name: 'Bitcoin',  amount: '1.2451', value: '84,478.32', pct: 32.4 },
    { symbol: 'ETH',  name: 'Ethereum', amount: '12.456',  value: '43,762.85', pct: 16.8 },
    { symbol: 'USDT', name: 'Tether',   amount: '32,456.78', value: '32,456.78', pct: 12.4 },
    { symbol: 'SOL',  name: 'Solana',   amount: '128.45',  value: '23,432.10', pct: 9.0 },
    { symbol: 'BNB',  name: 'BNB',      amount: '15.234',  value: '9,327.92',  pct: 3.6 },
    { symbol: 'ADA',  name: 'Cardano',  amount: '8,234.56', value: '3,725.32',  pct: 1.4 },
  ];
}

export function getTotalAssetValue(): number {
  return getAssets().reduce((s, a) => s + parseFloat(a.value.replace(/,/g, '')), 0);
}

/* ========== 3. 交易订单 ========== */
export interface OrderItem {
  id: string;
  pair: string;
  type: 'buy' | 'sell';
  orderType: 'limit' | 'market';
  price: string;
  amount: string;
  filled: string;
  status: 'pending' | 'partial' | 'filled' | 'cancelled';
  time: string;
}

export function getOrders(): OrderItem[] {
  return [
    { id: 'ORD-001', pair: 'BTC/USDT', type: 'buy',  orderType: 'limit',  price: '67,500.00', amount: '0.5000', filled: '0.5000', status: 'filled',    time: '10:23:45' },
    { id: 'ORD-002', pair: 'ETH/USDT', type: 'sell', orderType: 'market', price: '3,512.80',  amount: '2.0000', filled: '2.0000', status: 'filled',    time: '10:15:30' },
    { id: 'ORD-003', pair: 'SOL/USDT', type: 'buy',  orderType: 'limit',  price: '180.50',    amount: '10.000',  filled: '5.2000', status: 'partial',   time: '09:50:12' },
    { id: 'ORD-004', pair: 'DOGE/USDT',type: 'sell', orderType: 'limit',  price: '0.1650',    amount: '5000',    filled: '0',      status: 'pending',   time: '09:30:00' },
    { id: 'ORD-005', pair: 'ADA/USDT', type: 'buy',  orderType: 'market', price: '0.4523',    amount: '1000',    filled: '1000',   status: 'filled',    time: '08:45:22' },
  ];
}

/* ========== 4. NFT 项目 ========== */
export interface NFTItem {
  id: string;
  name: string;
  collection: string;
  image: string;  // emoji as placeholder
  price: string;
  change: string;
  up: boolean;
  owner: string;
}

export function getNFTs(): NFTItem[] {
  return [
    { id: 'NFT-001', name: 'CyberPunk #0427',   collection: 'CyberPunk ZS', image: '🤖', price: '2.45',  change: '+12.3%', up: true,  owner: '0x1a2b...c3d4' },
    { id: 'NFT-002', name: 'Dragon Genesis #128', collection: 'Dragon Saga', image: '🐉', price: '5.80',  change: '+8.7%',  up: true,  owner: '0x4e5f...a6b7' },
    { id: 'NFT-003', name: 'Samoa Wave #256',    collection: 'Island Vibes',image: '🏄', price: '1.20',  change: '-3.4%',  up: false, owner: '0x8c9d...e0f1' },
    { id: 'NFT-004', name: 'Golden Lion #007',   collection: 'Mythical Beasts', image: '🦁', price: '8.90', change: '+25.6%', up: true,  owner: '0x2g3h...i4j5' },
    { id: 'NFT-005', name: 'Star Walker #512',   collection: 'Space Odyssey',image: '🚀', price: '3.30',  change: '+5.2%',  up: true,  owner: '0x6k7l...m8n9' },
  ];
}

/* ========== 5. IDO 项目 ========== */
export interface IDOProject {
  id: string;
  name: string;
  symbol: string;
  description: string;
  raise: string;
  target: string;
  progress: number;
  status: 'upcoming' | 'ongoing' | 'ended';
  startTime: string;
  icon: string;
}

export function getIDOProjects(): IDOProject[] {
  return [
    { id: 'IDO-001', name: 'ZetaChain',     symbol: 'ZETA', description: '全链互操作协议',   raise: '120,000', target: '200,000', progress: 60, status: 'ongoing',  startTime: '2026-06-20', icon: '⚡' },
    { id: 'IDO-002', name: 'Sui Network',   symbol: 'SUI',  description: 'Move 语言 L1 公链', raise: '85,000',  target: '150,000', progress: 56, status: 'ongoing',  startTime: '2026-06-22', icon: '🌊' },
    { id: 'IDO-003', name: 'Sei Protocol',  symbol: 'SEI',  description: '订单簿 L1 区块链',  raise: '45,000',  target: '100,000', progress: 45, status: 'upcoming', startTime: '2026-07-01', icon: '🔴' },
    { id: 'IDO-004', name: 'Aptos Labs',    symbol: 'APT',  description: 'Move L1 高性能公链', raise: '0',       target: '250,000', progress: 0,  status: 'upcoming', startTime: '2026-07-15', icon: '⛓️' },
    { id: 'IDO-005', name: 'Pyth Network',  symbol: 'PYTH', description: '去中心化预言机',    raise: '200,000', target: '200,000', progress: 100,status: 'ended',    startTime: '2026-06-10', icon: '🔮' },
  ];
}

/* ========== 6. DeFi 池 ========== */
export interface DefiPool {
  id: string;
  name: string;
  tokens: string;
  apy: string;
  tvl: string;
  volume24h: string;
  risk: 'low' | 'mid' | 'high';
  icon: string;
}

export function getDefiPools(): DefiPool[] {
  return [
    { id: 'POOL-001', name: 'BTC-ETH 流动性池',   tokens: 'BTC/ETH', apy: '12.5%',  tvl: '$4.2M',  volume24h: '$890K', risk: 'low',  icon: '💧' },
    { id: 'POOL-002', name: 'USDT-USDC 稳定币池',  tokens: 'USDT/USDC', apy: '8.2%', tvl: '$6.8M',  volume24h: '$1.2M', risk: 'low',  icon: '💵' },
    { id: 'POOL-003', name: 'SOL 质押池',          tokens: 'SOL',      apy: '18.7%', tvl: '$2.1M',  volume24h: '$345K', risk: 'mid',  icon: '🌿' },
    { id: 'POOL-004', name: 'UNI 治理质押',         tokens: 'UNI',      apy: '9.8%',  tvl: '$1.5M',  volume24h: '$210K', risk: 'mid',  icon: '🏛️' },
    { id: 'POOL-005', name: 'MEME 农场',           tokens: 'DOGE/SHIB',apy: '45.2%', tvl: '$890K',  volume24h: '$567K', risk: 'high', icon: '🌾' },
  ];
}

/* ========== 7. 资讯/公告 ========== */
export interface NewsItem {
  id: string;
  tag: string;
  title: string;
  time: string;
  type: 'news' | 'announcement' | 'activity';
}

export function getNews(): NewsItem[] {
  return [
    { id: 'NEWS-001', tag: '🔥 热门', title: 'BTC突破68000美元，机构资金持续流入',        time: '5分钟前',  type: 'news' },
    { id: 'NEWS-002', tag: '📊 行情', title: 'ETH Layer2生态TVL突破500亿美元',            time: '1小时前',  type: 'news' },
    { id: 'NEWS-003', tag: '🏛️ 监管', title: '香港证监会发布新虚拟资产交易指南',            time: '2小时前',  type: 'news' },
    { id: 'NEWS-004', tag: '💎 项目', title: 'ZetaChain IDO 白名单申请中',                time: '3小时前',  type: 'announcement' },
    { id: 'NEWS-005', tag: '🎯 活动', title: '夏日交易大赛 — 50,000 USDT 奖池',           time: '1天前',   type: 'activity' },
    { id: 'NEWS-006', tag: '📢 公告', title: '第七期 NFT 盲盒将于本周五 20:00 开售',       time: '1天前',   type: 'announcement' },
    { id: 'NEWS-007', tag: '💎 项目', title: '萨摩亚持牌项目 ZS Exchange Q3 路演启动',     time: '2天前',   type: 'news' },
    { id: 'NEWS-008', tag: '🎯 活动', title: '邀请好友享 30% 手续费返佣，上不封顶',         time: '3天前',   type: 'activity' },
  ];
}

/* ========== 8. 推荐/发现内容 ========== */
export interface RecommendItem {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  href: string;
  tag?: string;
}

export function getDiscoverEntries(): RecommendItem[] {
  return [
    { id: 'REC-001', title: 'NFT 市场',    description: '数字艺术品 & 收藏品', icon: '🎨', color: '#F472B6', href: '/h5/nft', tag: '热门' },
    { id: 'REC-002', title: 'IDO 打新',     description: '一级市场热门项目',    icon: '🚀', color: '#34D399', href: '/h5/ido', tag: '新上线' },
    { id: 'REC-003', title: 'DeFi 理财',    description: '流动性挖矿 & 质押',   icon: '🔄', color: '#7C3AED', href: '/h5/defi' },
    { id: 'REC-004', title: '量化交易',     description: 'AI 策略自动交易',     icon: '🤖', color: '#38BDF8', href: '/h5/trade?type=futures', tag: '推荐' },
    { id: 'REC-005', title: '资讯中心',     description: '实时行情 & 深度分析',  icon: '📰', color: '#F0B90B', href: '/h5/news' },
    { id: 'REC-006', title: '理财超市',     description: '定期 & 活期理财产品',  icon: '💰', color: '#F59E0B', href: '/h5/assets?tab=earn' },
    { id: 'REC-007', title: '合约交易',     description: '多空双向，高倍杠杆',   icon: '📈', color: '#EF4444', href: '/h5/trade?type=futures', tag: '热门' },
    { id: 'REC-008', title: '牌照公示',     description: '双牌照合规透明',      icon: '🏛️', color: '#FCD535', href: '/h5/licenses' },
  ];
}

/* ========== 9. K 线（简化模拟） ========== */
export interface KlinePoint {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export function getKline(symbol?: string): KlinePoint[] {
  const base = symbol === 'ETH/USDT' ? 3512 : 67842;
  return Array.from({ length: 30 }, (_, i) => {
    const volatility = base * 0.02;
    const open = base + (Math.random() - 0.5) * volatility;
    const close = open + (Math.random() - 0.5) * volatility * 0.5;
    return {
      time: `06-${String(i + 1).padStart(2, '0')}`,
      open: Math.round(open * 100) / 100,
      high: Math.round(Math.max(open, close) * 100) / 100,
      low: Math.round(Math.min(open, close) * 100) / 100,
      close: Math.round(close * 100) / 100,
      volume: Math.round(Math.random() * 10000 * 100) / 100,
    };
  });
}

/* ========== 10. 用户资料 ========== */
export interface UserProfile {
  uid: string;
  nickname: string;
  avatar: string;
  email: string;
  phone: string;
  kycLevel: 0 | 1 | 2;
  vipLevel: string;
  registerTime: string;
}

export function getUserProfile(): UserProfile {
  return {
    uid: 'ZS-10086',
    nickname: 'Trader_Z',
    avatar: '👤',
    email: 'user***@example.com',
    phone: '+86 138****5678',
    kycLevel: 2,
    vipLevel: 'VIP3',
    registerTime: '2025-12-01',
  };
}

/* ========== 11. 通知 ========== */
export interface NotificationItem {
  id: string;
  title: string;
  content: string;
  time: string;
  read: boolean;
  type: 'system' | 'trade' | 'activity';
}

export function getNotifications(): NotificationItem[] {
  return [
    { id: 'NOTIF-001', title: '提币成功',    content: '您的 BTC 提币请求已处理完成',              time: '10 分钟前', read: false, type: 'trade' },
    { id: 'NOTIF-002', title: '委托成交',    content: 'BTC/USDT 买入委托已全部成交 0.5 BTC',        time: '30 分钟前', read: false, type: 'trade' },
    { id: 'NOTIF-003', title: '活动提醒',    content: '夏日交易大赛已开始，快来参与！',              time: '2 小时前',  read: true,  type: 'activity' },
    { id: 'NOTIF-004', title: '系统升级',    content: '平台将于 06-28 02:00-04:00 进行系统维护',     time: '1 天前',    read: true,  type: 'system' },
  ];
}

/* ========== 12. 推荐返佣 ========== */
export interface ReferralData {
  code: string;
  totalInvites: number;
  activeInvites: number;
  totalCommission: string;
  todayCommission: string;
  commissionRate: string;
}

export function getReferralData(): ReferralData {
  return {
    code: 'ZS10086',
    totalInvites: 128,
    activeInvites: 45,
    totalCommission: '12,458.32',
    todayCommission: '234.56',
    commissionRate: '30%',
  };
}

/* ========== 13. 牌照信息 ========== */
export interface LicenseInfo {
  name: string;
  authority: string;
  licenseNo: string;
  status: 'active' | 'pending' | 'expired';
  issueDate: string;
  expiryDate: string;
  scope: string;
}

export function getLicenses(): LicenseInfo[] {
  return [
    { name: '数字资产交易所牌照', authority: '萨摩亚金融服务监管局', licenseNo: 'SFC-DEX-2025-001', status: 'active', issueDate: '2025-06-01', expiryDate: '2027-06-01', scope: '数字资产现货交易、币币兑换' },
    { name: '证券交易所牌照',     authority: '萨摩亚金融服务监管局', licenseNo: 'SFC-SEX-2025-002', status: 'active', issueDate: '2025-06-01', expiryDate: '2027-06-01', scope: '证券型代币发行与交易' },
  ];
}

/* ========== 14. 钱包交易历史 ========== */
export interface WalletTx {
  id: string;
  type: 'deposit' | 'withdraw' | 'transfer_in' | 'transfer_out';
  symbol: string;
  amount: string;
  status: 'success' | 'pending' | 'failed';
  time: string;
  txid?: string;
}

export function getWalletTx(): WalletTx[] {
  return [
    { id: 'TX-001', type: 'deposit',     symbol: 'BTC',  amount: '+0.5000', status: 'success', time: '2026-06-23 14:32:10', txid: '0xabc...def' },
    { id: 'TX-002', type: 'transfer_out', symbol: 'USDT', amount: '-500.00', status: 'success', time: '2026-06-23 11:20:45' },
    { id: 'TX-003', type: 'withdraw',    symbol: 'ETH',  amount: '-2.0000', status: 'pending', time: '2026-06-23 09:15:30', txid: '0x123...456' },
    { id: 'TX-004', type: 'deposit',     symbol: 'SOL',  amount: '+50.000', status: 'success', time: '2026-06-22 22:05:00' },
    { id: 'TX-005', type: 'transfer_in', symbol: 'USDT', amount: '+2,000',  status: 'success', time: '2026-06-22 16:40:12' },
  ];
}

/* ========== 15. 业务矩阵功能入口 ========== */
export interface FeatureEntry {
  icon: string;
  label: string;
  href: string;
  color: string;
  desc?: string;
  badge?: string;
}

export function getFeatureEntries(): FeatureEntry[] {
  return [
    { icon: '💱', label: '现货交易', href: '/h5/trade', color: '#F0B90B' },
    { icon: '📈', label: '合约交易', href: '/h5/trade?type=futures', color: '#38BDF8' },
    { icon: '💰', label: '理财',     href: '/h5/assets?tab=earn', color: '#A78BFA' },
    { icon: '🎨', label: 'NFT',      href: '/h5/nft', color: '#F472B6' },
    { icon: '🚀', label: 'IDO',      href: '/h5/ido', color: '#34D399' },
    { icon: '🔄', label: 'DeFi',     href: '/h5/defi', color: '#7C3AED' },
    { icon: '🤖', label: '量化',     href: '/h5/trade?type=futures', color: '#06B6D4' },
    { icon: '📰', label: '资讯',     href: '/h5/news', color: '#F59E0B' },
  ];
}

/* ========== 16. 盲盒数据 ========== */
export interface BlindBox {
  id: string;
  name: string;
  series: string;
  price: string;
  totalQty: number;
  remainQty: number;
  rarity: 'N' | 'R' | 'SR' | 'SSR';
  icon: string;
  openTime: string;
}

export function getBlindBoxes(): BlindBox[] {
  return [
    { id: 'BOX-001', name: '赛博纪元',   series: 'CyberPunk ZS', price: '0.05', totalQty: 1000, remainQty: 623, rarity: 'SR', icon: '📦', openTime: '2026-06-26 20:00' },
    { id: 'BOX-002', name: '神龙传说',   series: 'Dragon Saga',  price: '0.08', totalQty: 800,  remainQty: 412, rarity: 'SSR',icon: '🐉', openTime: '2026-06-28 20:00' },
    { id: 'BOX-003', name: '星海漫游',   series: 'Space Odyssey',price: '0.03', totalQty: 2000, remainQty: 1528, rarity: 'R',  icon: '🌌', openTime: '2026-07-01 20:00' },
    { id: 'BOX-004', name: '黄金时代',   series: 'Mythical Beasts',price:'0.12',totalQty: 500, remainQty: 234, rarity: 'SSR',icon: '🏆', openTime: '2026-07-05 20:00' },
  ];
}

/* ========== 17. 量化策略 ========== */
export interface QuantStrategy {
  id: string;
  name: string;
  provider: string;
  apy: string;
  tvl: string;
  riskLevel: '低' | '中' | '高';
  minInvest: string;
  cycle: string;
  status: 'running' | 'closed';
}

export function getQuantStrategies(): QuantStrategy[] {
  return [
    { id: 'QUANT-001', name: '网格套利 BTC',     provider: 'ZS Quant Lab', apy: '15.2%', tvl: '$2.3M', riskLevel: '低', minInvest: '0.1 BTC', cycle: '7天', status: 'running' },
    { id: 'QUANT-002', name: '趋势跟踪 ETH',     provider: 'AlphaTech',   apy: '22.8%', tvl: '$1.8M', riskLevel: '中', minInvest: '1 ETH',   cycle: '30天', status: 'running' },
    { id: 'QUANT-003', name: '跨期套利 USDT',    provider: 'ZS Quant Lab', apy: '9.5%', tvl: '$5.6M', riskLevel: '低', minInvest: '100 USDT', cycle: '15天', status: 'running' },
    { id: 'QUANT-004', name: '高频做市 SOL',     provider: 'MarketPro',   apy: '35.6%', tvl: '$890K', riskLevel: '高', minInvest: '10 SOL',   cycle: '7天',  status: 'closed' },
  ];
}

/* ========== 18. 热点搜索词 ========== */
export function getHotSearchKeywords(): string[] {
  return ['BTC', 'ETH', 'NFT盲盒', 'IDO ZetaChain', 'DeFi挖矿', '合约交易', '量化策略', '双牌照'];
}

/* ========== 19. 公告横幅 ========== */
export interface BannerItem {
  id: string;
  title: string;
  subtitle: string;
  color: string;
  href: string;
}

export function getBanners(): BannerItem[] {
  return [
    { id: 'BAN-001', title: '夏日交易大赛', subtitle: '50,000 USDT 奖池等你来战', color: '#F0B90B', href: '/h5/news' },
    { id: 'BAN-002', title: '第七期 NFT 盲盒', subtitle: '6月28日 20:00 开售',    color: '#F472B6', href: '/h5/nft' },
    { id: 'BAN-003', title: 'ZetaChain IDO', subtitle: '全链互操作协议白名单',    color: '#38BDF8', href: '/h5/ido' },
  ];
}

/* ========== 20. 质押池 (PoS Staking) ========== */
export interface StakePool {
  id: string;
  symbol: string;
  name: string;
  network: string;
  apy: string;
  totalStaked: string;
  minStake: string;
  lockDays: number;
  rewardToken: string;
  status: 'active' | 'paused' | 'ended';
  icon: string;
  riskLevel: 'low' | 'mid' | 'high';
}

export function getStakePools(): StakePool[] {
  return [
    { id: 'SK-001', symbol: 'ETH',  name: 'ETH 2.0 验证者',   network: 'Ethereum',  apy: '4.82%',  totalStaked: '$128.4M', minStake: '0.01 ETH',  lockDays: 0,  rewardToken: 'ETH',  status: 'active', icon: 'Ξ',  riskLevel: 'low'  },
    { id: 'SK-002', symbol: 'SOL',  name: 'Solana PoS 质押', network: 'Solana',    apy: '6.85%',  totalStaked: '$45.2M',  minStake: '0.1 SOL',   lockDays: 3,  rewardToken: 'SOL',  status: 'active', icon: '◎',  riskLevel: 'low'  },
    { id: 'SK-003', symbol: 'DOT',  name: 'Polkadot Nominator',network:'Polkadot',  apy: '14.2%',  totalStaked: '$8.6M',   minStake: '1 DOT',    lockDays: 28, rewardToken: 'DOT',  status: 'active', icon: '●',  riskLevel: 'mid'  },
    { id: 'SK-004', symbol: 'ADA',  name: 'Cardano 质押池',   network: 'Cardano',   apy: '3.45%',  totalStaked: '$12.4M',  minStake: '1 ADA',    lockDays: 0,  rewardToken: 'ADA',  status: 'active', icon: '₳',  riskLevel: 'low'  },
    { id: 'SK-005', symbol: 'ATOM', name: 'Cosmos 验证人',    network: 'Cosmos Hub',apy: '18.7%',  totalStaked: '$5.2M',   minStake: '0.1 ATOM', lockDays: 21, rewardToken: 'ATOM', status: 'active', icon: '⚛',  riskLevel: 'mid'  },
    { id: 'SK-006', symbol: 'BNB',  name: 'BNB Chain 质押',   network: 'BSC',       apy: '5.12%',  totalStaked: '$32.8M',  minStake: '0.01 BNB', lockDays: 7,  rewardToken: 'BNB',  status: 'active', icon: 'B',  riskLevel: 'low'  },
    { id: 'SK-007', symbol: 'APT',  name: 'Aptos 质押',       network: 'Aptos',     apy: '7.05%',  totalStaked: '$2.1M',   minStake: '10 APT',   lockDays: 14, rewardToken: 'APT',  status: 'active', icon: 'A',  riskLevel: 'mid'  },
    { id: 'SK-008', symbol: 'MATIC',name: 'Polygon 验证人',   network: 'Polygon',   apy: '5.68%',  totalStaked: '$18.5M',  minStake: '1 MATIC',  lockDays: 3,  rewardToken: 'MATIC',status: 'paused', icon: 'M',  riskLevel: 'low'  },
  ];
}

/* ========== 21. 活期/定期理财 ========== */
export interface SavingsProduct {
  id: string;
  name: string;
  symbol: string;
  type: 'flexible' | 'fixed';
  apy: string;
  baseApy?: string;
  bonusApy?: string;
  duration?: number; // 天
  minAmount: string;
  totalQuota: string;
  sold: string;
  risk: 'low' | 'mid' | 'high';
  status: 'available' | 'soldout' | 'ended';
  features: string[];
}

export function getSavingsProducts(): SavingsProduct[] {
  return [
    // 活期
    { id: 'SV-F01', name: 'USDT 活期',     symbol: 'USDT', type: 'flexible', apy: '4.50%',  minAmount: '10 USDT',   totalQuota: '不设上限', sold: '$45.2M', risk: 'low', status: 'available', features: ['随存随取', 'T+0 到账', '保本保息'] },
    { id: 'SV-F02', name: 'BTC 活期',      symbol: 'BTC',  type: 'flexible', apy: '1.85%',  minAmount: '0.001 BTC', totalQuota: '不设上限', sold: '$18.6M', risk: 'low', status: 'available', features: ['随存随取', 'T+0 到账'] },
    { id: 'SV-F03', name: 'ETH 活期',      symbol: 'ETH',  type: 'flexible', apy: '2.45%',  minAmount: '0.01 ETH',  totalQuota: '不设上限', sold: '$22.1M', risk: 'low', status: 'available', features: ['随存随取', 'T+0 到账'] },
    { id: 'SV-F04', name: 'USDC 活期',     symbol: 'USDC', type: 'flexible', apy: '4.20%',  minAmount: '10 USDC',   totalQuota: '不设上限', sold: '$12.5M', risk: 'low', status: 'available', features: ['随存随取', 'T+0 到账', '保本保息'] },
    // 定期
    { id: 'SV-D01', name: 'USDT 30天定期', symbol: 'USDT', type: 'fixed',    apy: '6.80%',  baseApy: '4.50%', bonusApy: '+2.30%', duration: 30,  minAmount: '100 USDT',  totalQuota: '$20,000,000', sold: '65%', risk: 'low', status: 'available', features: ['30 天锁仓', '保本保息', '到期自动续'] },
    { id: 'SV-D02', name: 'USDT 90天定期', symbol: 'USDT', type: 'fixed',    apy: '9.20%',  baseApy: '4.50%', bonusApy: '+4.70%', duration: 90,  minAmount: '100 USDT',  totalQuota: '$15,000,000', sold: '42%', risk: 'low', status: 'available', features: ['90 天锁仓', '保本保息', '高收益'] },
    { id: 'SV-D03', name: 'USDT 180天定期',symbol: 'USDT', type: 'fixed',    apy: '12.50%', baseApy: '4.50%', bonusApy: '+8.00%', duration: 180, minAmount: '500 USDT',  totalQuota: '$10,000,000', sold: '78%', risk: 'low', status: 'available', features: ['180 天锁仓', '保本保息', '超高收益'] },
    { id: 'SV-D04', name: 'BTC 30天定期',  symbol: 'BTC',  type: 'fixed',    apy: '3.20%',  baseApy: '1.85%', bonusApy: '+1.35%', duration: 30,  minAmount: '0.01 BTC',  totalQuota: '$5,000,000',  sold: '32%', risk: 'low', status: 'available', features: ['30 天锁仓', '保本保息'] },
    { id: 'SV-D05', name: 'ETH 60天定期',  symbol: 'ETH',  type: 'fixed',    apy: '5.20%',  baseApy: '2.45%', bonusApy: '+2.75%', duration: 60,  minAmount: '0.1 ETH',   totalQuota: '$8,000,000',  sold: '55%', risk: 'low', status: 'available', features: ['60 天锁仓', '保本保息', '中长线'] },
    { id: 'SV-D06', name: 'USDC 365天定期',symbol: 'USDC', type: 'fixed',    apy: '15.80%', baseApy: '4.20%', bonusApy: '+11.60%',duration: 365, minAmount: '1000 USDC', totalQuota: '$5,000,000',  sold: '88%', risk: 'low', status: 'soldout',   features: ['365 天锁仓', '保本保息', '顶格收益'] },
  ];
}

/* ========== 24. IDO 项目 ========== */
export interface IdoProject {
  id: string;
  name: string;
  symbol: string;
  logo: string;
  description: string;
  category: string;
  status: 'upcoming' | 'live' | 'ended' | 'soldout';
  startTime: string;
  endTime: string;
  totalRaise: string;
  soldPct: number;
  price: string;
  fdv: string;
  vesting: string;
  network: string;
  hot: boolean;
  participants: number;
  tiers: { name: string; minHold: string; allocation: string; price: string; soldPct: number }[];
}
export function getIdoProjects(): IdoProject[] {
  return [
    { id: 'IDO-001', name: 'MetaVerse X', symbol: 'MVX', logo: 'M', description: '下一代元宇宙社交平台，集成 VR/AR 与 AI 数字人', category: '元宇宙', status: 'live', startTime: '2026-06-20 14:00', endTime: '2026-06-25 14:00', totalRaise: '$5,000,000', soldPct: 68, price: '$0.025', fdv: '$25,000,000', vesting: 'TGE 25%, 3 月线性释放', network: 'Ethereum', hot: true, participants: 8420, tiers: [
      { name: '青铜', minHold: '100 ZS',  allocation: '100 USDT', price: '$0.022', soldPct: 85 },
      { name: '白银', minHold: '500 ZS',  allocation: '500 USDT', price: '$0.024', soldPct: 72 },
      { name: '黄金', minHold: '2000 ZS', allocation: '2000 USDT', price: '$0.025', soldPct: 58 },
      { name: '钻石', minHold: '10000 ZS',allocation: '10000 USDT',price: '$0.025', soldPct: 32 },
    ]},
    { id: 'IDO-002', name: 'ZK Rollup Hub', symbol: 'ZKR', logo: 'Z', description: 'Layer2 聚合 ZK Rollup 解决方案，零知识证明扩容', category: 'Layer2', status: 'live', startTime: '2026-06-22 10:00', endTime: '2026-06-27 10:00', totalRaise: '$8,000,000', soldPct: 42, price: '$0.40', fdv: '$40,000,000', vesting: 'TGE 20%, 6 月线性释放', network: 'Polygon', hot: true, participants: 5210, tiers: [
      { name: '青铜', minHold: '100 ZS',  allocation: '200 USDT', price: '$0.36', soldPct: 65 },
      { name: '白银', minHold: '500 ZS',  allocation: '1000 USDT',price: '$0.38', soldPct: 45 },
      { name: '黄金', minHold: '2000 ZS', allocation: '5000 USDT',price: '$0.40', soldPct: 28 },
    ]},
    { id: 'IDO-003', name: 'AI Compute Net', symbol: 'AICN', logo: 'A', description: '分布式 AI 算力网络，链上调度 GPU 资源', category: 'AI', status: 'upcoming', startTime: '2026-06-28 14:00', endTime: '2026-07-03 14:00', totalRaise: '$12,000,000', soldPct: 0, price: '$0.85', fdv: '$85,000,000', vesting: 'TGE 15%, 9 月线性释放', network: 'Solana', hot: true, participants: 0, tiers: [
      { name: '白银', minHold: '500 ZS',  allocation: '300 USDT', price: '$0.78', soldPct: 0 },
      { name: '黄金', minHold: '2000 ZS', allocation: '1500 USDT',price: '$0.82', soldPct: 0 },
      { name: '钻石', minHold: '10000 ZS',allocation: '8000 USDT',price: '$0.85', soldPct: 0 },
    ]},
    { id: 'IDO-004', name: 'GameFi Engine', symbol: 'GFE', logo: 'G', description: '链上游戏引擎 SDK，开发者友好的 GameFi 中间件', category: 'GameFi', status: 'upcoming', startTime: '2026-07-05 10:00', endTime: '2026-07-10 10:00', totalRaise: '$3,500,000', soldPct: 0, price: '$0.12', fdv: '$12,000,000', vesting: 'TGE 30%, 3 月线性释放', network: 'BSC', hot: false, participants: 0, tiers: [
      { name: '青铜', minHold: '100 ZS',  allocation: '150 USDT', price: '$0.10', soldPct: 0 },
      { name: '白银', minHold: '500 ZS',  allocation: '800 USDT', price: '$0.11', soldPct: 0 },
    ]},
    { id: 'IDO-005', name: 'DePIN Storage', symbol: 'DPS', logo: 'D', description: '去中心化物理存储网络，整合闲置硬盘空间', category: 'DePIN', status: 'ended', startTime: '2026-06-10 10:00', endTime: '2026-06-15 10:00', totalRaise: '$6,000,000', soldPct: 100, price: '$0.30', fdv: '$30,000,000', vesting: 'TGE 25%, 6 月线性释放', network: 'Polygon', hot: false, participants: 12840, tiers: [
      { name: '青铜', minHold: '100 ZS',  allocation: '200 USDT', price: '$0.27', soldPct: 100 },
      { name: '白银', minHold: '500 ZS',  allocation: '1000 USDT',price: '$0.29', soldPct: 100 },
    ]},
    { id: 'IDO-006', name: 'RWA Tokenize', symbol: 'RWA', logo: 'R', description: '现实世界资产上链协议，房产/艺术品/债券 RWA 化', category: 'RWA', status: 'soldout', startTime: '2026-06-05 10:00', endTime: '2026-06-10 10:00', totalRaise: '$10,000,000', soldPct: 100, price: '$1.20', fdv: '$120,000,000', vesting: 'TGE 10%, 12 月线性释放', network: 'Ethereum', hot: false, participants: 24180, tiers: [
      { name: '黄金', minHold: '2000 ZS', allocation: '5000 USDT',price: '$1.15', soldPct: 100 },
      { name: '钻石', minHold: '10000 ZS',allocation: '30000 USDT',price: '$1.20', soldPct: 100 },
    ]},
  ];
}
export function getIdoById(id: string): IdoProject | undefined {
  return getIdoProjects().find(p => p.id === id);
}

/* ========== 25. NFT 藏品 ========== */
export interface NftCollection {
  id: string;
  name: string;
  symbol: string;
  cover: string;       // 渐变色
  emoji: string;
  category: 'art' | 'music' | 'game' | 'sport' | 'ip' | 'domain';
  description: string;
  floorPrice: string;
  volume: string;
  items: number;
  owners: number;
  listed: number;
  chain: string;
  verified: boolean;
  hot: boolean;
  change: string;
}
export function getNftCollections(): NftCollection[] {
  return [
    { id: 'NFT-001', name: 'ZS Genesis Genesis', symbol: 'ZSG',  cover: 'linear-gradient(135deg, #F0B90B 0%, #FCD535 100%)', emoji: '👑', category: 'ip',     description: 'ZS Exchange 创世NFT，限量1000个',         floorPrice: '2.5 ETH', volume: '1280 ETH', items: 1000, owners: 642, listed: 38,  chain: 'Ethereum', verified: true,  hot: true,  change: '+12.5%' },
    { id: 'NFT-002', name: 'CyberPunk 2078',   symbol: 'CP78', cover: 'linear-gradient(135deg, #A78BFA 0%, #7C3AED 100%)', emoji: '🤖', category: 'art',    description: '赛博朋克风格数字艺术作品集',                 floorPrice: '0.85 ETH',volume: '420 ETH',  items: 8888, owners: 4280,listed: 215, chain: 'Polygon',  verified: true,  hot: true,  change: '+8.2%'  },
    { id: 'NFT-003', name: 'AI Punks',         symbol: 'AIP',  cover: 'linear-gradient(135deg, #38BDF8 0%, #1E40AF 100%)', emoji: '🎨', category: 'art',    description: 'AI 生成朋克头像，10000 个独特角色',         floorPrice: '0.32 ETH',volume: '186 ETH',  items: 10000,owners: 5210,listed: 480, chain: 'Ethereum', verified: true,  hot: true,  change: '+15.3%' },
    { id: 'NFT-004', name: 'Meta Warriors',    symbol: 'MW',   cover: 'linear-gradient(135deg, #F472B6 0%, #DB2777 100%)', emoji: '⚔️', category: 'game',   description: '元宇宙游戏角色卡牌，战斗/养成玩法',         floorPrice: '120 MATIC',volume: '85K MATIC',items: 5000, owners: 3120,listed: 420, chain: 'Polygon',  verified: true,  hot: false, change: '-3.2%'  },
    { id: 'NFT-005', name: 'Music Genesis',    symbol: 'MG',   cover: 'linear-gradient(135deg, #22D3EE 0%, #0891B2 100%)', emoji: '🎵', category: 'music',  description: '音乐人数字专辑 NFT，分版税自动分成',         floorPrice: '0.15 ETH',volume: '64 ETH',   items: 2000, owners: 1480,listed: 92,  chain: 'Ethereum', verified: true,  hot: false, change: '+5.6%'  },
    { id: 'NFT-006', name: 'NBA Top Shot',     symbol: 'NBA',  cover: 'linear-gradient(135deg, #F0B90B 0%, #B45309 100%)', emoji: '🏀', category: 'sport',  description: 'NBA 官方明星卡牌，真实比赛精彩瞬间',         floorPrice: '85 USDC', volume: '2.4M USDC',items: 18000,owners: 8420,listed: 680, chain: 'Flow',     verified: true,  hot: true,  change: '+22.1%' },
    { id: 'NFT-007', name: 'BNB Domain Club',  symbol: 'BNB',  cover: 'linear-gradient(135deg, #F0B90B 0%, #FCD535 100%)', emoji: '🌐', category: 'domain', description: 'BNB 链域名 NFT，xxx.bnb 永久所有权',         floorPrice: '50 USDC', volume: '180K USDC',items: 50000,owners: 12000,listed: 1200,chain: 'BSC',      verified: true,  hot: false, change: '+1.2%'  },
    { id: 'NFT-008', name: 'Pixel Pets',       symbol: 'PP',   cover: 'linear-gradient(135deg, #34D399 0%, #059669 100%)', emoji: '🐱', category: 'game',   description: '像素宠物养成游戏，每只都是独一无二',         floorPrice: '0.05 ETH',volume: '32 ETH',   items: 12000,owners: 6840,listed: 320, chain: 'Polygon',  verified: true,  hot: false, change: '-1.5%'  },
  ];
}
export function getNftById(id: string): NftCollection | undefined {
  return getNftCollections().find(c => c.id === id);
}

export interface NftItem {
  id: string;
  collectionId: string;
  tokenId: string;
  name: string;
  rank: number;
  price: string;
  lastSale: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  attributes: { trait: string; value: string; pct: string }[];
}
export function getNftItems(collectionId: string): NftItem[] {
  return [
    { id: `${collectionId}-001`, collectionId, tokenId: '#1001', name: 'Genesis #1001', rank: 1,  price: '5.5 ETH', lastSale: '5.0 ETH', rarity: 'legendary', attributes: [
      { trait: '背景', value: '金色',  pct: '0.5%' },
      { trait: '眼睛', value: '激光', pct: '1.2%' },
      { trait: '装饰', value: '皇冠', pct: '0.8%' },
    ]},
    { id: `${collectionId}-002`, collectionId, tokenId: '#1002', name: 'Genesis #1002', rank: 5,  price: '3.2 ETH', lastSale: '3.0 ETH', rarity: 'epic', attributes: [
      { trait: '背景', value: '蓝色',  pct: '5%' },
      { trait: '眼睛', value: '火焰', pct: '3%' },
      { trait: '装饰', value: '翅膀', pct: '2%' },
    ]},
    { id: `${collectionId}-003`, collectionId, tokenId: '#1003', name: 'Genesis #1003', rank: 12, price: '2.8 ETH', lastSale: '2.5 ETH', rarity: 'epic', attributes: [
      { trait: '背景', value: '紫色',  pct: '8%' },
      { trait: '眼睛', value: '星形', pct: '4%' },
    ]},
    { id: `${collectionId}-004`, collectionId, tokenId: '#1004', name: 'Genesis #1004', rank: 28, price: '2.5 ETH', lastSale: '2.4 ETH', rarity: 'rare', attributes: [
      { trait: '背景', value: '橙色',  pct: '12%' },
      { trait: '眼睛', value: '普通', pct: '40%' },
    ]},
  ];
}

/* ========== 26. DEX 流动性池 ========== */
export interface DexPool {
  id: string;
  pair: string;
  token0: string;
  token1: string;
  tvl: string;
  volume24h: string;
  volume7d: string;
  apr: string;
  fees: string;
  myLiquidity: string;
  myShare: string;
}
export function getDexPools(): DexPool[] {
  return [
    { id: 'DXP-001', pair: 'ETH/USDT',   token0: 'ETH',  token1: 'USDT', tvl: '$48.2M', volume24h: '$12.4M', volume7d: '$85.2M', apr: '12.4%', fees: '0.3%',  myLiquidity: '$1,250.00', myShare: '0.0026%' },
    { id: 'DXP-002', pair: 'BTC/USDT',   token0: 'BTC',  token1: 'USDT', tvl: '$32.5M', volume24h: '$8.9M',  volume7d: '$62.1M', apr: '8.5%',  fees: '0.3%',  myLiquidity: '$850.00',   myShare: '0.0026%' },
    { id: 'DXP-003', pair: 'ZS/USDT',    token0: 'ZS',   token1: 'USDT', tvl: '$18.6M', volume24h: '$4.2M',  volume7d: '$28.5M', apr: '24.8%', fees: '0.3%',  myLiquidity: '$2,800.00', myShare: '0.015%' },
    { id: 'DXP-004', pair: 'SOL/USDT',   token0: 'SOL',  token1: 'USDT', tvl: '$15.2M', volume24h: '$3.8M',  volume7d: '$24.1M', apr: '18.6%', fees: '0.3%',  myLiquidity: '$0',        myShare: '0%' },
    { id: 'DXP-005', pair: 'ETH/USDC',   token0: 'ETH',  token1: 'USDC', tvl: '$22.8M', volume24h: '$6.5M',  volume7d: '$42.3M', apr: '10.2%', fees: '0.3%',  myLiquidity: '$420.00',   myShare: '0.0018%' },
    { id: 'DXP-006', pair: 'MATIC/USDT', token0: 'MATIC',token1: 'USDT', tvl: '$8.4M',  volume24h: '$1.8M',  volume7d: '$12.5M', apr: '32.5%', fees: '0.3%',  myLiquidity: '$0',        myShare: '0%' },
  ];
}
export function getDexById(id: string): DexPool | undefined {
  return getDexPools().find(p => p.id === id);
}

/* ========== 27. OTC 商家 ========== */
export interface OtcMerchant {
  id: string;
  name: string;
  avatar: string;
  verified: boolean;
  vipLevel: 'gold' | 'platinum' | 'diamond' | 'normal';
  completedOrders: number;
  completionRate: string;
  avgReleaseTime: string;
  paymentMethods: string[];
  assets: string[];
  online: boolean;
  rating: number;
  trust: string;
}
export function getOtcMerchants(): OtcMerchant[] {
  return [
    { id: 'OMC-001', name: '币安大客户部', avatar: 'B', verified: true,  vipLevel: 'diamond', completedOrders: 12840, completionRate: '99.8%', avgReleaseTime: '2 分钟', paymentMethods: ['银行转账', '支付宝', '微信'],  assets: ['USDT', 'BTC', 'ETH', 'BNB'],     online: true,  rating: 4.9, trust: '殿堂' },
    { id: 'OMC-002', name: 'OTC 专业户 Leo', avatar: 'L', verified: true,  vipLevel: 'platinum',completedOrders: 8420,  completionRate: '99.5%', avgReleaseTime: '3 分钟', paymentMethods: ['银行转账', '支付宝'],           assets: ['USDT', 'BTC', 'ETH'],            online: true,  rating: 4.8, trust: '顶级' },
    { id: 'OMC-003', name: '胡老板币圈',    avatar: 'H', verified: true,  vipLevel: 'gold',    completedOrders: 5210,  completionRate: '99.2%', avgReleaseTime: '5 分钟', paymentMethods: ['银行转账', '微信'],             assets: ['USDT', 'BTC'],                   online: true,  rating: 4.7, trust: '高级' },
    { id: 'OMC-004', name: 'Maya 东南亚',   avatar: 'M', verified: true,  vipLevel: 'platinum',completedOrders: 12840, completionRate: '99.6%', avgReleaseTime: '4 分钟', paymentMethods: ['银行转账', 'PayPal'],           assets: ['USDT', 'ETH', 'SOL'],            online: true,  rating: 4.8, trust: '顶级' },
    { id: 'OMC-005', name: 'OTC 商家 09',   avatar: '9', verified: false, vipLevel: 'normal',  completedOrders: 820,   completionRate: '96.5%', avgReleaseTime: '15 分钟', paymentMethods: ['银行转账'],                   assets: ['USDT'],                          online: true,  rating: 4.2, trust: '普通' },
    { id: 'OMC-006', name: '南哥大宗',      avatar: 'N', verified: true,  vipLevel: 'gold',    completedOrders: 3210,  completionRate: '99.0%', avgReleaseTime: '8 分钟', paymentMethods: ['银行转账', '对公账户'],         assets: ['USDT', 'BTC', 'ETH', 'BNB'],     online: false, rating: 4.6, trust: '高级' },
  ];
}
export function getOtcMerchantById(id: string): OtcMerchant | undefined {
  return getOtcMerchants().find(m => m.id === id);
}

export interface OtcOrder {
  id: string;
  type: 'buy' | 'sell';
  asset: string;
  amount: string;
  price: string;
  total: string;
  fiat: string;
  merchant: string;
  status: 'pending' | 'paid' | 'released' | 'cancelled' | 'appealing';
  createdAt: string;
  expiresIn: string;
}

/* ========== 28. 内容 Feed ========== */
export interface ContentArticle {
  id: string;
  title: string;
  cover: string;     // 渐变色
  emoji: string;
  category: 'news' | 'analysis' | 'tutorial' | 'interview' | 'event';
  author: string;
  authorAvatar: string;
  excerpt: string;
  views: number;
  likes: number;
  comments: number;
  time: string;
  pinned?: boolean;
  hot?: boolean;
  tag?: string;
}
export function getContentArticles(): ContentArticle[] {
  return [
    { id: 'A-001', title: 'BTC 突破 7 万美元：减半行情正式启动？', cover: 'linear-gradient(135deg, #F0B90B 0%, #B45309 100%)', emoji: '📈', category: 'analysis', author: '区块链李白',  authorAvatar: '李', excerpt: '比特币现货 ETF 持续净流入，机构资金加速进场。本文从链上数据、宏观环境、监管动态三个维度分析 BTC 减半行情。', views: 12480, likes: 1820, comments: 256, time: '2 小时前', pinned: true,  hot: true,  tag: '热点' },
    { id: 'A-002', title: 'ZK Rollup 技术详解：从原理到实践',     cover: 'linear-gradient(135deg, #A78BFA 0%, #7C3AED 100%)', emoji: '🔬', category: 'tutorial', author: 'ZK 研究员',     authorAvatar: 'Z', excerpt: '深入解析 ZK Rollup 的工作原理、主流项目对比、开发者如何选择。',                                          views: 8240,  likes: 1240, comments: 142, time: '5 小时前',               hot: true,  tag: '深度' },
    { id: 'A-003', title: '对话 Vitalik：以太坊 L2 生态未来 5 年', cover: 'linear-gradient(135deg, #38BDF8 0%, #1E40AF 100%)', emoji: '💬', category: 'interview', author: 'CoinDesk 中文', authorAvatar: 'C', excerpt: 'Vitalik 独家专访，畅谈以太坊路线图、L2 互操作性、ZK 技术演进。',                                            views: 6420,  likes: 980,  comments: 188, time: '昨天',                   hot: true,  tag: '专访' },
    { id: 'A-004', title: '新手必看：DeFi 入门 7 步走',         cover: 'linear-gradient(135deg, #34D399 0%, #10B981 100%)', emoji: '🌱', category: 'tutorial', author: 'DeFi 教练',     authorAvatar: 'D', excerpt: '从钱包选择到 DEX 交易，从质押到流动性挖矿，一步步带你进入 DeFi 世界。',                                  views: 5420,  likes: 720,  comments: 96,  time: '2 天前' },
    { id: 'A-005', title: '香港加密 ETF 获批：亚太新格局',     cover: 'linear-gradient(135deg, #F472B6 0%, #DB2777 100%)', emoji: '🌏', category: 'news',     author: '财经前沿',     authorAvatar: '财', excerpt: '香港证监会批准首批加密现货 ETF，亚太市场进入新阶段。',                                                   views: 4820,  likes: 620,  comments: 124, time: '2 天前' },
    { id: 'A-006', title: 'NFTFi 报告：借贷市场破 50 亿美元',   cover: 'linear-gradient(135deg, #22D3EE 0%, #0891B2 100%)', emoji: '💎', category: 'analysis', author: 'NFT 观察家',   authorAvatar: 'N', excerpt: 'NFT 金融化加速，BendDAO 等借贷协议规模持续增长。',                                                          views: 3620,  likes: 480,  comments: 68,  time: '3 天前' },
    { id: 'A-007', title: 'Web3 游戏周报：Top 5 热门链游',     cover: 'linear-gradient(135deg, #F0B90B 0%, #FCD535 100%)', emoji: '🎮', category: 'event',    author: 'GameFi 观察',  authorAvatar: 'G', excerpt: 'Pixels、Big Time、Star Atlas 等链游数据全面解析。',                                                       views: 2840,  likes: 380,  comments: 52,  time: '4 天前' },
    { id: 'A-008', title: 'Solana 生态复兴：DePIN 大爆发',     cover: 'linear-gradient(135deg, #A78BFA 0%, #5B21B6 100%)', emoji: '⚡', category: 'analysis', author: 'SOL 分析师',   authorAvatar: 'S', excerpt: 'Solana 链上活跃地址创新高，DePIN 项目总锁仓突破 100 亿美元。',                                            views: 2240,  likes: 320,  comments: 48,  time: '5 天前' },
  ];
}
export function getArticleById(id: string): ContentArticle | undefined {
  return getContentArticles().find(a => a.id === id);
}

export interface VideoItem {
  id: string;
  title: string;
  cover: string;
  emoji: string;
  author: string;
  authorAvatar: string;
  duration: string;
  views: number;
  likes: number;
  category: 'news' | 'tutorial' | 'interview' | 'live' | 'fun';
  vip?: boolean;
}
export function getVideos(): VideoItem[] {
  return [
    { id: 'V-001', title: 'BTC 行情分析：减半前最后机会？',     cover: 'linear-gradient(135deg, #F0B90B 0%, #B45309 100%)', emoji: '📈', author: '老李说币',  authorAvatar: '李', duration: '12:35', views: 124800, likes: 8400, category: 'news',     vip: true },
    { id: 'V-002', title: '手把手教你用 ZS DEX 兑换',          cover: 'linear-gradient(135deg, #34D399 0%, #10B981 100%)', emoji: '🎬', author: 'DeFi 教练', authorAvatar: 'D', duration: '8:42',  views: 62400,  likes: 4280, category: 'tutorial' },
    { id: 'V-003', title: 'Vitalik 上海峰会演讲全程',          cover: 'linear-gradient(135deg, #38BDF8 0%, #1E40AF 100%)', emoji: '🎤', author: '以太坊基金会', authorAvatar: 'V', duration: '45:20', views: 284600, likes: 18600, category: 'interview' },
    { id: 'V-004', title: '3 分钟看懂 ZK Rollup',              cover: 'linear-gradient(135deg, #A78BFA 0%, #7C3AED 100%)', emoji: '⚡', author: 'ZK 实验室', authorAvatar: 'Z', duration: '3:15',  views: 38420,  likes: 2640, category: 'tutorial' },
    { id: 'V-005', title: 'NFT 投资攻略：从白嫖到精通',        cover: 'linear-gradient(135deg, #F472B6 0%, #DB2777 100%)', emoji: '🎨', author: 'NFT 玩家',  authorAvatar: 'N', duration: '18:50', views: 84200,  likes: 5840, category: 'tutorial' },
    { id: 'V-006', title: '链上侦探：破解 1000 万美元盗币案',  cover: 'linear-gradient(135deg, #22D3EE 0%, #0891B2 100%)', emoji: '🔍', author: '链上安全',  authorAvatar: '链', duration: '22:30', views: 152000, likes: 9800, category: 'news' },
  ];
}

export interface LiveRoom {
  id: string;
  title: string;
  cover: string;
  emoji: string;
  host: string;
  hostAvatar: string;
  category: 'trading' | 'chat' | 'ama' | 'music' | 'game';
  viewers: number;
  status: 'live' | 'upcoming' | 'ended';
  startTime: string;
  tags: string[];
  vip?: boolean;
  hot?: boolean;
}
export function getLiveRooms(): LiveRoom[] {
  return [
    { id: 'L-001', title: 'BTC 实时行情解盘',           cover: 'linear-gradient(135deg, #F0B90B 0%, #B45309 100%)', emoji: '📊', host: '老李说币',  hostAvatar: '李', category: 'trading', viewers: 8420,  status: 'live',     startTime: '进行中',           tags: ['BTC', '行情', '实盘'], vip: true, hot: true },
    { id: 'L-002', title: 'AMA：对话 ZK Rollup 团队',   cover: 'linear-gradient(135deg, #A78BFA 0%, #7C3AED 100%)', emoji: '🎤', host: 'ZK Labs',   hostAvatar: 'Z', category: 'ama',     viewers: 4820,  status: 'live',     startTime: '进行中',           tags: ['ZK', 'AMA', '技术'] },
    { id: 'L-003', title: '今晚 8 点：DeFi 新机会分享', cover: 'linear-gradient(135deg, #34D399 0%, #10B981 100%)', emoji: '🎯', host: 'DeFi 教练', hostAvatar: 'D', category: 'ama',     viewers: 0,     status: 'upcoming', startTime: '今天 20:00',       tags: ['DeFi', '机会'] },
    { id: 'L-004', title: 'NFT 实战交易分享',           cover: 'linear-gradient(135deg, #F472B6 0%, #DB2777 100%)', emoji: '💎', host: 'NFT 玩家',  hostAvatar: 'N', category: 'chat',    viewers: 2480,  status: 'live',     startTime: '进行中',           tags: ['NFT', '交易'] },
    { id: 'L-005', title: '链游试玩：Pixels 周末赛',    cover: 'linear-gradient(135deg, #22D3EE 0%, #0891B2 100%)', emoji: '🎮', host: 'GameFi 主播', hostAvatar: 'G', category: 'game',  viewers: 1240,  status: 'live',     startTime: '进行中',           tags: ['游戏', 'Pixels'] },
    { id: 'L-006', title: 'Web3 音乐之夜',             cover: 'linear-gradient(135deg, #A78BFA 0%, #DB2777 100%)', emoji: '🎵', host: '音乐 DAO',  hostAvatar: 'M', category: 'music',   viewers: 0,     status: 'ended',    startTime: '昨天 21:00',       tags: ['音乐', 'Web3'] },
  ];
}

export interface Topic {
  id: string;
  name: string;
  description: string;
  posts: number;
  followers: number;
  hot: boolean;
  color: string;
  emoji: string;
}
export function getTopics(): Topic[] {
  return [
    { id: 'T-001', name: '#BTC减半行情',    description: '讨论比特币减半后的市场走势', posts: 12480, followers: 24820, hot: true,  color: '#F0B90B', emoji: '📈' },
    { id: 'T-002', name: '#ZKEthereum',     description: '以太坊 ZK 技术与 L2 生态',     posts: 8420,  followers: 18620, hot: true,  color: '#A78BFA', emoji: '⚡' },
    { id: 'T-003', name: '#DeFiSummer',     description: 'DeFi 复兴与新机会',             posts: 6420,  followers: 12480, hot: true,  color: '#34D399', emoji: '🌱' },
    { id: 'T-004', name: '#NFTFi',          description: 'NFT 金融化与借贷',              posts: 4820,  followers: 8420,  hot: false, color: '#F472B6', emoji: '💎' },
    { id: 'T-005', name: '#GameFi赛季',     description: '链游赛季与锦标赛',              posts: 3820,  followers: 6420,  hot: false, color: '#22D3EE', emoji: '🎮' },
    { id: 'T-006', name: '#Web3工作',       description: 'Web3 招聘与远程机会',           posts: 2820,  followers: 5420,  hot: false, color: '#38BDF8', emoji: '💼' },
  ];
}

/* ========== 29. 游戏 ========== */
export interface Game {
  id: string;
  name: string;
  cover: string;
  emoji: string;
  category: 'rpg' | 'strategy' | 'casual' | 'puzzle' | 'fps' | 'sport';
  developer: string;
  description: string;
  rating: number;
  ratingCount: number;
  players: number;
  peak: number;
  chains: string[];
  reward: boolean;
  featured: boolean;
  hot: boolean;
  vip?: boolean;
  size: string;
  release: string;
}
export function getGames(): Game[] {
  return [
    { id: 'G-001', name: 'Pixel Warriors',     cover: 'linear-gradient(135deg, #F0B90B 0%, #FCD535 100%)', emoji: '⚔️', category: 'rpg',      developer: 'Pixel Studio',  description: '像素风 RPG，去中心化角色卡牌战斗',           rating: 4.8, ratingCount: 24820, players: 12480, peak: 28420, chains: ['Polygon', 'BSC'],     reward: true,  featured: true,  hot: true,  size: '256MB', release: '2026-03-12' },
    { id: 'G-002', name: 'Crypto Cards',       cover: 'linear-gradient(135deg, #A78BFA 0%, #7C3AED 100%)', emoji: '🃏', category: 'strategy', developer: 'Card Master',   description: '集换式卡牌，NFT 资产互通',                    rating: 4.7, ratingCount: 18620, players: 8420,  peak: 18620, chains: ['Ethereum', 'Polygon'], reward: true,  featured: true,  hot: true,  size: '128MB', release: '2026-04-20' },
    { id: 'G-003', name: 'Meta Farm',          cover: 'linear-gradient(135deg, #34D399 0%, #10B981 100%)', emoji: '🌾', category: 'casual',   developer: 'Farm Team',     description: '区块链农场养成游戏',                          rating: 4.6, ratingCount: 12480, players: 6420,  peak: 12480, chains: ['BSC'],                reward: true,  featured: false, hot: true,  size: '85MB',  release: '2026-02-08' },
    { id: 'G-004', name: 'Space Mining',       cover: 'linear-gradient(135deg, #38BDF8 0%, #1E40AF 100%)', emoji: '🚀', category: 'strategy', developer: 'Space Inc',     description: '太空挖矿战略游戏',                            rating: 4.5, ratingCount: 8420,  players: 4820,  peak: 8420,  chains: ['Polygon'],            reward: true,  featured: false, hot: false, size: '180MB', release: '2026-05-15' },
    { id: 'G-005', name: 'Zombie Run',         cover: 'linear-gradient(135deg, #F472B6 0%, #DB2777 100%)', emoji: '🧟', category: 'fps',      developer: 'Survival Co',   description: '末日生存 FPS，打僵尸赚代币',                  rating: 4.4, ratingCount: 6420,  players: 3820,  peak: 6420,  chains: ['Solana'],             reward: true,  featured: false, hot: false, size: '320MB', release: '2026-06-01' },
    { id: 'G-006', name: 'Puzzle Master',      cover: 'linear-gradient(135deg, #22D3EE 0%, #0891B2 100%)', emoji: '🧩', category: 'puzzle',   developer: 'Puzzle Inc',    description: '益智解谜，每日签到领 ZS',                    rating: 4.3, ratingCount: 4820,  players: 2840,  peak: 4820,  chains: ['BSC'],                reward: false, featured: false, hot: false, size: '45MB',  release: '2026-01-18' },
  ];
}
export function getGameById(id: string): Game | undefined {
  return getGames().find(g => g.id === id);
}

export interface Tournament {
  id: string;
  game: string;
  gameId: string;
  name: string;
  cover: string;
  emoji: string;
  prizePool: string;
  participants: number;
  maxParticipants: number;
  startTime: string;
  endTime: string;
  status: 'registering' | 'live' | 'ended';
  fee: string;
  host: string;
}
export function getTournaments(): Tournament[] {
  return [
    { id: 'TR-001', game: 'Pixel Warriors', gameId: 'G-001', name: 'Pixel Warriors 春季锦标赛',   cover: 'linear-gradient(135deg, #F0B90B 0%, #FCD535 100%)', emoji: '⚔️', prizePool: '$50,000',  participants: 1284, maxParticipants: 2048, startTime: '2026-07-01', endTime: '2026-07-15', status: 'registering', fee: '$10', host: 'Pixel Studio' },
    { id: 'TR-002', game: 'Crypto Cards',   gameId: 'G-002', name: 'Crypto Cards 冠军联赛',     cover: 'linear-gradient(135deg, #A78BFA 0%, #7C3AED 100%)', emoji: '🃏', prizePool: '$30,000',  participants: 820,  maxParticipants: 1024, startTime: '2026-06-28', endTime: '2026-07-05', status: 'registering', fee: '$5',  host: 'Card Master' },
    { id: 'TR-003', game: 'Meta Farm',      gameId: 'G-003', name: 'Meta Farm 夏季赛',          cover: 'linear-gradient(135deg, #34D399 0%, #10B981 100%)', emoji: '🌾', prizePool: '$20,000',  participants: 520,  maxParticipants: 1024, startTime: '2026-06-25', endTime: '2026-07-10', status: 'live',        fee: '免费', host: 'Farm Team' },
    { id: 'TR-004', game: 'Space Mining',   gameId: 'G-004', name: 'Space Mining 月度赛',       cover: 'linear-gradient(135deg, #38BDF8 0%, #1E40AF 100%)', emoji: '🚀', prizePool: '$15,000',  participants: 240,  maxParticipants: 512,  startTime: '2026-06-20', endTime: '2026-06-22', status: 'ended',       fee: '$3',  host: 'Space Inc' },
  ];
}
export function getTournamentById(id: string): Tournament | undefined {
  return getTournaments().find(t => t.id === id);
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  emoji: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  reward: string;
  progress: number;     // 0-100
  unlocked: boolean;
  date?: string;
}
export function getAchievements(): Achievement[] {
  return [
    { id: 'AC-001', name: '初出茅庐',       description: '完成首场战斗',           emoji: '🎯', rarity: 'common',    reward: '100 ZS',     progress: 100, unlocked: true,  date: '2026-05-12' },
    { id: 'AC-002', name: '连胜之星',       description: '连续赢得 10 场战斗',     emoji: '⭐', rarity: 'rare',      reward: '500 ZS',     progress: 100, unlocked: true,  date: '2026-05-25' },
    { id: 'AC-003', name: '百万富翁',       description: '单日获得 100 万金币',    emoji: '💰', rarity: 'epic',      reward: '1000 ZS',    progress: 72,  unlocked: false },
    { id: 'AC-004', name: '传说收藏家',     description: '收集 100 张传说卡牌',    emoji: '👑', rarity: 'legendary', reward: '5000 ZS',    progress: 38,  unlocked: false },
    { id: 'AC-005', name: '社交达人',       description: '添加 50 个好友',         emoji: '🤝', rarity: 'rare',      reward: '300 ZS',     progress: 100, unlocked: true,  date: '2026-06-08' },
    { id: 'AC-006', name: '挑战者',         description: '参加 10 次锦标赛',       emoji: '🏆', rarity: 'epic',      reward: '800 ZS',     progress: 60,  unlocked: false },
    { id: 'AC-007', name: '全勤玩家',       description: '连续登录 30 天',         emoji: '📅', rarity: 'rare',      reward: '200 ZS',     progress: 100, unlocked: true,  date: '2026-06-22' },
    { id: 'AC-008', name: '宇宙征服者',     description: '在所有链上完成 1 场战斗', emoji: '🌌', rarity: 'legendary', reward: '10000 ZS',   progress: 25,  unlocked: false },
  ];
}

/* ========== 30. 电商 ========== */
export interface ShopProduct {
  id: string;
  name: string;
  cover: string;
  emoji: string;
  category: 'digital' | 'physical' | 'service' | 'gift';
  price: string;
  originalPrice?: string;
  currency: 'USDT' | 'ZS' | 'CNY';
  rating: number;
  sold: number;
  stock: number;
  description: string;
  hot?: boolean;
  new?: boolean;
  discount?: number;
  seller: string;
  tags: string[];
  specs?: { label: string; value: string }[];
}
export function getShopProducts(): ShopProduct[] {
  return [
    { id: 'SP-001', name: 'iPhone 16 Pro Max 256GB',     cover: 'linear-gradient(135deg, #38BDF8 0%, #1E40AF 100%)', emoji: '📱', category: 'physical', price: '9999',  originalPrice: '10999',  currency: 'CNY',  rating: 4.9, sold: 1840, stock: 286, description: 'Apple 旗舰手机，A18 Pro 芯片',                    hot: true,  discount: 9,  seller: 'Apple 官方旗舰店', tags: ['官方', '正品', '顺丰包邮'], specs: [{ label: '颜色', value: '原色钛金属' }, { label: '容量', value: '256GB' }, { label: '版本', value: '国行' }] },
    { id: 'SP-002', name: '索尼 PS5 Pro 国行',            cover: 'linear-gradient(135deg, #38BDF8 0%, #0EA5E9 100%)', emoji: '🎮', category: 'physical', price: '4999',  originalPrice: '5499',  currency: 'CNY',  rating: 4.8, sold: 824,  stock: 120, description: 'PS5 Pro 主机 + 手柄',                            hot: true,  discount: 9,  seller: '索尼官方旗舰店',   tags: ['官方', '正品', '一年保修'] },
    { id: 'SP-003', name: 'MacBook Air M4 13寸',         cover: 'linear-gradient(135deg, #A78BFA 0%, #7C3AED 100%)', emoji: '💻', category: 'physical', price: '8999',  originalPrice: '9999',  currency: 'CNY',  rating: 4.9, sold: 1240, stock: 186, description: 'Apple M4 芯片，16GB 内存',                       new: true,  discount: 9,  seller: 'Apple 官方旗舰店', tags: ['官方', '正品'] },
    { id: 'SP-004', name: '比特币周边 T 恤',              cover: 'linear-gradient(135deg, #F0B90B 0%, #B45309 100%)', emoji: '👕', category: 'physical', price: '199',                      currency: 'CNY',  rating: 4.6, sold: 482,  stock: 999, description: '100% 纯棉，限量发行',                            seller: 'BTC 周边店',       tags: ['限量', '纯棉'] },
    { id: 'SP-005', name: 'ZS Exchange 周边礼盒',         cover: 'linear-gradient(135deg, #FCD535 0%, #F0B90B 100%)', emoji: '🎁', category: 'gift',     price: '999',                      currency: 'CNY',  rating: 5.0, sold: 286,  stock: 50,  description: '包含 T 恤、帽子、水杯、贴纸',                    hot: true,  seller: 'ZS 官方商城',       tags: ['官方', '礼盒'] },
    { id: 'SP-006', name: '《精通 DeFi》纸质书',          cover: 'linear-gradient(135deg, #34D399 0%, #10B981 100%)', emoji: '📚', category: 'physical', price: '89',                       currency: 'CNY',  rating: 4.7, sold: 1280, stock: 999, description: 'DeFi 入门到精通，作者签名版',                    seller: '区块链出版社',     tags: ['签名版', '包邮'] },
    { id: 'SP-007', name: 'VIP 会员 1 年',                cover: 'linear-gradient(135deg, #A78BFA 0%, #DB2777 100%)', emoji: '👑', category: 'service',  price: '199',   originalPrice: '299',    currency: 'CNY',  rating: 4.8, sold: 2840, stock: 999, description: '享受 VIP 专属权益',                              new: true,  discount: 7,  seller: 'ZS 官方',          tags: ['官方', 'VIP'] },
    { id: 'SP-008', name: '1v1 投顾咨询 1 小时',          cover: 'linear-gradient(135deg, #FCD535 0%, #B45309 100%)', emoji: '🎓', category: 'service',  price: '888',                      currency: 'CNY',  rating: 4.9, sold: 420,  stock: 999, description: '专业分析师 1 对 1 服务',                          seller: 'ZS 学院',          tags: ['专业', '一对一'] },
  ];
}
export function getProductById(id: string): ShopProduct | undefined {
  return getShopProducts().find(p => p.id === id);
}

export interface ShopOrder {
  id: string;
  productId: string;
  product: ShopProduct;
  qty: number;
  total: string;
  status: 'pending' | 'paid' | 'shipped' | 'completed' | 'cancelled' | 'refunding';
  createdAt: string;
  trackingNo?: string;
  payMethod: string;
}
export function getShopOrders(): ShopOrder[] {
  return [
    { id: 'SO-10001', productId: 'SP-001', product: getShopProducts()[0], qty: 1, total: '9999.00', status: 'shipped',   createdAt: '2026-06-22 14:30', trackingNo: 'SF1234567890', payMethod: '支付宝' },
    { id: 'SO-10002', productId: 'SP-005', product: getShopProducts()[4], qty: 1, total: '999.00',  status: 'paid',      createdAt: '2026-06-24 10:15', payMethod: '微信' },
    { id: 'SO-10003', productId: 'SP-007', product: getShopProducts()[6], qty: 1, total: '199.00',  status: 'completed', createdAt: '2026-06-15 09:45', payMethod: 'USDT' },
    { id: 'SO-10004', productId: 'SP-004', product: getShopProducts()[3], qty: 2, total: '398.00',  status: 'pending',   createdAt: '2026-06-24 11:20', payMethod: '未支付' },
    { id: 'SO-10005', productId: 'SP-006', product: getShopProducts()[5], qty: 1, total: '89.00',   status: 'cancelled', createdAt: '2026-06-20 16:00', payMethod: '支付宝' },
  ];
}
export function getShopOrderById(id: string): ShopOrder | undefined {
  return getShopOrders().find(o => o.id === id);
}

export interface Coupon {
  id: string;
  name: string;
  type: 'discount' | 'cash' | 'shipping';
  value: string;
  minSpend: string;
  scope: string;
  expiresAt: string;
  status: 'unused' | 'used' | 'expired';
}
export function getCoupons(): Coupon[] {
  return [
    { id: 'CP-001', name: '新人专享券',           type: 'discount', value: '9 折',  minSpend: '¥0',   scope: '全场通用',     expiresAt: '2026-12-31', status: 'unused' },
    { id: 'CP-002', name: '满 1000 减 100',        type: 'cash',     value: '¥100', minSpend: '¥1000', scope: '数码/家电',     expiresAt: '2026-07-15', status: 'unused' },
    { id: 'CP-003', name: '包邮券',                type: 'shipping', value: '包邮',  minSpend: '¥0',   scope: '全场通用',     expiresAt: '2026-08-31', status: 'unused' },
    { id: 'CP-004', name: '满 500 减 50',          type: 'cash',     value: '¥50',  minSpend: '¥500',  scope: '服饰/图书',     expiresAt: '2026-07-31', status: 'used' },
    { id: 'CP-005', name: 'VIP 专享 8 折',         type: 'discount', value: '8 折',  minSpend: '¥0',   scope: '全场通用',     expiresAt: '2026-09-30', status: 'unused' },
    { id: 'CP-006', name: '会员日专享 7 折',        type: 'discount', value: '7 折',  minSpend: '¥299',  scope: '指定商品',     expiresAt: '2026-06-10', status: 'expired' },
  ];
}
export function getOtcOrders(): OtcOrder[] {
  return [
    { id: 'OTO-10001', type: 'buy',  asset: 'USDT', amount: '1000',  price: '7.18',  total: '7180',   fiat: 'CNY', merchant: '币安大客户部', status: 'released', createdAt: '2026-06-22 14:30', expiresIn: '已完成' },
    { id: 'OTO-10002', type: 'sell', asset: 'BTC',  amount: '0.05',  price: '485800',total: '24290',  fiat: 'CNY', merchant: 'OTC 专业户 Leo',status: 'pending',  createdAt: '2026-06-24 10:15', expiresIn: '14:32' },
    { id: 'OTO-10003', type: 'buy',  asset: 'ETH',  amount: '2.5',   price: '25200', total: '63000',  fiat: 'CNY', merchant: '胡老板币圈',   status: 'paid',     createdAt: '2026-06-24 09:45', expiresIn: '待放币' },
    { id: 'OTO-10004', type: 'sell', asset: 'USDT', amount: '5000',  price: '7.16',  total: '35800',  fiat: 'CNY', merchant: 'Maya 东南亚',   status: 'released', createdAt: '2026-06-23 18:20', expiresIn: '已完成' },
    { id: 'OTO-10005', type: 'buy',  asset: 'BNB',  amount: '10',    price: '4392',  total: '43920',  fiat: 'CNY', merchant: '南哥大宗',     status: 'cancelled',createdAt: '2026-06-23 11:00', expiresIn: '已取消' },
    { id: 'OTO-10006', type: 'sell', asset: 'USDT', amount: '2000',  price: '7.15',  total: '14300',  fiat: 'CNY', merchant: '币安大客户部', status: 'appealing',createdAt: '2026-06-22 21:30', expiresIn: '申诉中' },
  ];
}

/* ========== 22. DeFi 持仓 ========== */
export interface DefiPosition {
  id: string;
  poolId: string;
  poolName: string;
  tokens: string;
  myShare: string;        // LP 数量
  shareValue: string;     // 价值
  pnl: string;            // 收益
  pnlPct: string;         // 收益率
  apy: string;
  days: number;
  iconColor: string;
}

export function getDefiPositions(): DefiPosition[] {
  return [
    { id: 'POS-001', poolId: 'POOL-001', poolName: 'BTC-ETH 流动性池',   tokens: 'BTC/ETH',   myShare: '0.4521',  shareValue: '$12,458.32', pnl: '+$1,234.56',  pnlPct: '+10.98%', apy: '12.5%',  days: 32, iconColor: '#F0B90B' },
    { id: 'POS-002', poolId: 'POOL-002', poolName: 'USDT-USDC 稳定币池',  tokens: 'USDT/USDC', myShare: '5,200',   shareValue: '$5,200.00',  pnl: '+$126.45',    pnlPct: '+2.43%',  apy: '8.2%',   days: 18, iconColor: '#38BDF8' },
    { id: 'POS-003', poolId: 'POOL-003', poolName: 'SOL 质押池',          tokens: 'SOL',       myShare: '128.5',   shareValue: '$23,432.10', pnl: '+$3,452.18',  pnlPct: '+17.28%', apy: '18.7%',  days: 45, iconColor: '#A78BFA' },
    { id: 'POS-004', poolId: 'POOL-004', poolName: 'UNI 治理质押',         tokens: 'UNI',       myShare: '189.6',   shareValue: '$1,495.98',  pnl: '-$23.45',     pnlPct: '-1.54%',  apy: '9.8%',   days: 12, iconColor: '#F472B6' },
  ];
}

/* ========== 23. DeFi 收益历史 ========== */
export interface DefiReward {
  id: string;
  date: string;
  pool: string;
  type: 'add' | 'remove' | 'harvest' | 'swap';
  token: string;
  amount: string;
  value: string;
  status: 'success' | 'pending' | 'failed';
}

export function getDefiRewards(): DefiReward[] {
  return [
    { id: 'RW-001', date: '2026-06-24 14:32', pool: 'SOL 质押池',         type: 'harvest', token: 'SOL',  amount: '+2.45',   value: '+$447.20',   status: 'success' },
    { id: 'RW-002', date: '2026-06-24 09:15', pool: 'BTC-ETH 流动性池',   type: 'add',     token: 'BTC/ETH', amount: '+0.05', value: '+$3,400.00', status: 'success' },
    { id: 'RW-003', date: '2026-06-23 22:10', pool: 'USDT-USDC 稳定币池', type: 'harvest', token: 'USDT', amount: '+12.45',  value: '+$12.45',     status: 'success' },
    { id: 'RW-004', date: '2026-06-23 16:40', pool: 'SOL 质押池',         type: 'harvest', token: 'SOL',  amount: '+2.38',   value: '+$434.30',   status: 'success' },
    { id: 'RW-005', date: '2026-06-22 11:20', pool: 'USDT-USDC 稳定币池', type: 'remove',  token: 'USDT', amount: '-200.00', value: '-$200.00',   status: 'success' },
    { id: 'RW-006', date: '2026-06-22 09:30', pool: 'BTC-ETH 流动性池',   type: 'swap',    token: 'ETH',  amount: '+1.20',   value: '+$4,215.00', status: 'success' },
    { id: 'RW-007', date: '2026-06-21 18:22', pool: 'UNI 治理质押',         type: 'harvest', token: 'UNI',  amount: '+8.45',   value: '+$66.70',    status: 'pending' },
  ];
}