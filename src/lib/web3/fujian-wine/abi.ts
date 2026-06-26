// 福建老酒分润合约 ABI（精简版，用于前端调用）
export const FUJIAN_WINE_ABI = [
  // 读方法
  {
    name: 'owner',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'address' }],
  },
  {
    name: 'orderCount',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint256' }],
  },
  {
    name: 'orders',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'orderId', type: 'uint256' }],
    outputs: [
      { name: 'orderId', type: 'uint256' },
      { name: 'buyer', type: 'address' },
      { name: 'referrer', type: 'address' },
      { name: 'priceTier', type: 'uint256' },
      { name: 'productCost', type: 'uint256' },
      { name: 'aiopcCommission', type: 'uint256' },
      { name: 'profitPoolTotal', type: 'uint256' },
      { name: 'zsVentureShare', type: 'uint256' },
      { name: 'overseasCryptoShare', type: 'uint256' },
      { name: 'businessSchoolShare', type: 'uint256' },
      { name: 'techTeamShare', type: 'uint256' },
      { name: 'operationsShare', type: 'uint256' },
      { name: 'affairsDeptShare', type: 'uint256' },
      { name: 'referrerShare', type: 'uint256' },
      { name: 'timestamp', type: 'uint256' },
      { name: 'processed', type: 'bool' },
    ],
  },
  {
    name: 'totalEarned',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ type: 'address' }],
    outputs: [{ type: 'uint256' }],
  },
  {
    name: 'getUserOrderCount',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'user', type: 'address' }],
    outputs: [{ type: 'uint256' }],
  },
  {
    name: 'getUserOrders',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'user', type: 'address' },
      { name: 'offset', type: 'uint256' },
      { name: 'limit', type: 'uint256' },
    ],
    outputs: [
      {
        type: 'tuple[]',
        components: [
          { name: 'orderId', type: 'uint256' },
          { name: 'buyer', type: 'address' },
          { name: 'referrer', type: 'address' },
          { name: 'priceTier', type: 'uint256' },
          { name: 'productCost', type: 'uint256' },
          { name: 'aiopcCommission', type: 'uint256' },
          { name: 'profitPoolTotal', type: 'uint256' },
          { name: 'zsVentureShare', type: 'uint256' },
          { name: 'overseasCryptoShare', type: 'uint256' },
          { name: 'businessSchoolShare', type: 'uint256' },
          { name: 'techTeamShare', type: 'uint256' },
          { name: 'operationsShare', type: 'uint256' },
          { name: 'affairsDeptShare', type: 'uint256' },
          { name: 'referrerShare', type: 'uint256' },
          { name: 'timestamp', type: 'uint256' },
          { name: 'processed', type: 'bool' },
        ],
      },
    ],
  },
  {
    name: 'getProfitBreakdown',
    type: 'function',
    stateMutability: 'pure',
    inputs: [{ name: 'priceTier', type: 'uint256' }],
    outputs: [
      { name: 'productCost', type: 'uint256' },
      { name: 'aiopcCommission', type: 'uint256' },
      { name: 'profitPool', type: 'uint256' },
      { name: 'zsVentureShare', type: 'uint256' },
      { name: 'overseasCryptoShare', type: 'uint256' },
      { name: 'businessSchoolShare', type: 'uint256' },
      { name: 'techTeamShare', type: 'uint256' },
      { name: 'operationsShare', type: 'uint256' },
      { name: 'affairsDeptShare', type: 'uint256' },
      { name: 'referrerShare', type: 'uint256' },
    ],
  },
  // 常量
  { name: 'PRICE_369', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint256' }] },
  { name: 'PRICE_699', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint256' }] },
  // 写方法
  {
    name: 'createOrder',
    type: 'function',
    stateMutability: 'payable',
    inputs: [
      { name: 'referrer', type: 'address' },
      { name: 'priceTier', type: 'uint256' },
    ],
    outputs: [{ type: 'uint256' }],
  },
  // 管理方法
  {
    name: 'setProductCostWallet',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: '_wallet', type: 'address' }],
    outputs: [],
  },
  {
    name: 'setAiopcCommissionWallet',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: '_wallet', type: 'address' }],
    outputs: [],
  },
  {
    name: 'setZsVentureWallet',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: '_wallet', type: 'address' }],
    outputs: [],
  },
  {
    name: 'setOverseasCryptoWallet',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: '_wallet', type: 'address' }],
    outputs: [],
  },
  {
    name: 'setBusinessSchoolWallet',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: '_wallet', type: 'address' }],
    outputs: [],
  },
  {
    name: 'setTechTeamWallet',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: '_wallet', type: 'address' }],
    outputs: [],
  },
  {
    name: 'setOperationsWallet',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: '_wallet', type: 'address' }],
    outputs: [],
  },
  {
    name: 'setAffairsDeptWallet',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: '_wallet', type: 'address' }],
    outputs: [],
  },
  {
    name: 'transferOwnership',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'newOwner', type: 'address' }],
    outputs: [],
  },
  {
    name: 'emergencyWithdraw',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [],
    outputs: [],
  },
  // 事件
  {
    name: 'OrderCreated',
    type: 'event',
    inputs: [
      { indexed: true, name: 'orderId', type: 'uint256' },
      { indexed: true, name: 'buyer', type: 'address' },
      { indexed: true, name: 'referrer', type: 'address' },
      { name: 'priceTier', type: 'uint256' },
      { name: 'timestamp', type: 'uint256' },
    ],
  },
  {
    name: 'ProfitDistributed',
    type: 'event',
    inputs: [
      { indexed: true, name: 'orderId', type: 'uint256' },
      { name: 'productCost', type: 'uint256' },
      { name: 'aiopcCommission', type: 'uint256' },
      { name: 'profitPoolTotal', type: 'uint256' },
      { name: 'timestamp', type: 'uint256' },
    ],
  },
  {
    name: 'RoleShareDistributed',
    type: 'event',
    inputs: [
      { indexed: true, name: 'orderId', type: 'uint256' },
      { indexed: true, name: 'wallet', type: 'address' },
      { name: 'role', type: 'string' },
      { name: 'amount', type: 'uint256' },
    ],
  },
  {
    name: 'WalletUpdated',
    type: 'event',
    inputs: [
      { name: 'role', type: 'string' },
      { name: 'oldWallet', type: 'address' },
      { name: 'newWallet', type: 'address' },
    ],
  },
] as const;

// 合约地址配置（按链 ID）
export const FUJIAN_WINE_CONTRACTS: Record<number, string> = {
  84532: '0x0000000000000000000000000000000000000000', // Base Sepolia（部署后替换）
  8453: '0x0000000000000000000000000000000000000000',  // Base Mainnet（部署后替换）
  31337: '0x0000000000000000000000000000000000000000', // Hardhat 本地
};

// 价格档位
export const PRICE_TIERS = {
  TIER_369: 369, // 美元
  TIER_699: 699, // 美元
};

// 角色定义
export const PROFIT_ROLES = [
  { key: 'productCost', label: '产品成本', color: '#8B4513' },
  { key: 'aiopcCommission', label: 'AIOPC 创业家大宗提成', color: '#D2691E' },
  { key: 'zsVenture', label: '中萨合资公司', color: '#F0B90B' },
  { key: 'overseasCrypto', label: '海外加密资产公司', color: '#00BFFF' },
  { key: 'businessSchool', label: '商学院事业部', color: '#32CD32' },
  { key: 'techTeam', label: '太初国链技术团队', color: '#6B46C1' },
  { key: 'operations', label: '运营事业部', color: '#EC4899' },
  { key: 'affairsDept', label: '创业家事务部', color: '#14B8A6' },
  { key: 'referrer', label: '推荐人奖励', color: '#F97316' },
] as const;
