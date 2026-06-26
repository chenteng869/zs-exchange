/**
 * 内置链列表
 *
 * 包含主流 EVM 链的配置信息，支持链添加、切换、自定义 RPC
 *
 * 遵循标准：
 *  - EIP-3085: wallet_addEthereumChain
 *  - EIP-3326: wallet_switchEthereumChain
 *  - CAIP-2: Blockchain ID Specification
 */

import type { ChainConfig } from '../sdk.types';

// ============================================================================
// 主流 EVM 链配置
// ============================================================================

/**
 * 以太坊主网
 */
export const ETHEREUM_MAINNET: ChainConfig = {
  chainId: 1,
  chainName: 'Ethereum Mainnet',
  chainType: 'evm',
  nativeCurrency: {
    name: 'Ethereum',
    symbol: 'ETH',
    decimals: 18,
  },
  rpcUrls: [
    'https://eth.llamarpc.com',
    'https://rpc.ankr.com/eth',
    'https://eth.drpc.org',
  ],
  blockExplorers: [
    {
      name: 'Etherscan',
      url: 'https://etherscan.io',
      standard: 'EIP3091',
    },
  ],
  shortName: 'eth',
  networkId: 1,
  priority: 1,
  enabled: true,
  gasConfig: {
    baseGasLimit: 21000,
    eip1559: true,
    maxGasLimit: 30000000,
    gasMultiplier: 1.2,
  },
};

/**
 * BNB Smart Chain 主网
 */
export const BSC_MAINNET: ChainConfig = {
  chainId: 56,
  chainName: 'BNB Smart Chain',
  chainType: 'evm',
  nativeCurrency: {
    name: 'BNB',
    symbol: 'BNB',
    decimals: 18,
  },
  rpcUrls: [
    'https://bsc-dataseed.binance.org',
    'https://rpc.ankr.com/bsc',
    'https://bsc.drpc.org',
  ],
  blockExplorers: [
    {
      name: 'BscScan',
      url: 'https://bscscan.com',
      standard: 'EIP3091',
    },
  ],
  shortName: 'bsc',
  networkId: 56,
  priority: 2,
  enabled: true,
  gasConfig: {
    baseGasLimit: 21000,
    eip1559: false,
    maxGasLimit: 100000000,
    gasMultiplier: 1.1,
    gasPrice: '5000000000',
  },
};

/**
 * Polygon 主网
 */
export const POLYGON_MAINNET: ChainConfig = {
  chainId: 137,
  chainName: 'Polygon',
  chainType: 'evm',
  nativeCurrency: {
    name: 'MATIC',
    symbol: 'MATIC',
    decimals: 18,
  },
  rpcUrls: [
    'https://polygon-rpc.com',
    'https://rpc.ankr.com/polygon',
    'https://polygon.drpc.org',
  ],
  blockExplorers: [
    {
      name: 'PolygonScan',
      url: 'https://polygonscan.com',
      standard: 'EIP3091',
    },
  ],
  shortName: 'matic',
  networkId: 137,
  priority: 3,
  enabled: true,
  gasConfig: {
    baseGasLimit: 21000,
    eip1559: true,
    maxGasLimit: 30000000,
    gasMultiplier: 1.2,
  },
};

/**
 * Arbitrum One 主网
 */
export const ARBITRUM_ONE: ChainConfig = {
  chainId: 42161,
  chainName: 'Arbitrum One',
  chainType: 'evm',
  nativeCurrency: {
    name: 'Ethereum',
    symbol: 'ETH',
    decimals: 18,
  },
  rpcUrls: [
    'https://arb1.arbitrum.io/rpc',
    'https://rpc.ankr.com/arbitrum',
    'https://arbitrum.drpc.org',
  ],
  blockExplorers: [
    {
      name: 'Arbiscan',
      url: 'https://arbiscan.io',
      standard: 'EIP3091',
    },
  ],
  shortName: 'arb1',
  networkId: 42161,
  priority: 4,
  enabled: true,
  gasConfig: {
    baseGasLimit: 21000,
    eip1559: true,
    maxGasLimit: 120000000,
    gasMultiplier: 1.2,
  },
};

/**
 * Optimism 主网
 */
export const OPTIMISM_MAINNET: ChainConfig = {
  chainId: 10,
  chainName: 'Optimism',
  chainType: 'evm',
  nativeCurrency: {
    name: 'Ethereum',
    symbol: 'ETH',
    decimals: 18,
  },
  rpcUrls: [
    'https://mainnet.optimism.io',
    'https://rpc.ankr.com/optimism',
    'https://optimism.drpc.org',
  ],
  blockExplorers: [
    {
      name: 'Optimistic Etherscan',
      url: 'https://optimistic.etherscan.io',
      standard: 'EIP3091',
    },
  ],
  shortName: 'oeth',
  networkId: 10,
  priority: 5,
  enabled: true,
  gasConfig: {
    baseGasLimit: 21000,
    eip1559: true,
    maxGasLimit: 30000000,
    gasMultiplier: 1.2,
  },
};

/**
 * Base 主网
 */
export const BASE_MAINNET: ChainConfig = {
  chainId: 8453,
  chainName: 'Base',
  chainType: 'evm',
  nativeCurrency: {
    name: 'Ethereum',
    symbol: 'ETH',
    decimals: 18,
  },
  rpcUrls: [
    'https://mainnet.base.org',
    'https://rpc.ankr.com/base',
    'https://base.drpc.org',
  ],
  blockExplorers: [
    {
      name: 'Basescan',
      url: 'https://basescan.org',
      standard: 'EIP3091',
    },
  ],
  shortName: 'base',
  networkId: 8453,
  priority: 6,
  enabled: true,
  gasConfig: {
    baseGasLimit: 21000,
    eip1559: true,
    maxGasLimit: 30000000,
    gasMultiplier: 1.2,
  },
};

/**
 * Avalanche C-Chain 主网
 */
export const AVALANCHE_C_CHAIN: ChainConfig = {
  chainId: 43114,
  chainName: 'Avalanche C-Chain',
  chainType: 'evm',
  nativeCurrency: {
    name: 'AVAX',
    symbol: 'AVAX',
    decimals: 18,
  },
  rpcUrls: [
    'https://api.avax.network/ext/bc/C/rpc',
    'https://rpc.ankr.com/avalanche',
    'https://avalanche.drpc.org',
  ],
  blockExplorers: [
    {
      name: 'Snowtrace',
      url: 'https://snowtrace.io',
      standard: 'EIP3091',
    },
  ],
  shortName: 'avax',
  networkId: 43114,
  priority: 7,
  enabled: true,
  gasConfig: {
    baseGasLimit: 21000,
    eip1559: true,
    maxGasLimit: 15000000,
    gasMultiplier: 1.2,
  },
};

/**
 * Fantom Opera 主网
 */
export const FANTOM_OPERA: ChainConfig = {
  chainId: 250,
  chainName: 'Fantom Opera',
  chainType: 'evm',
  nativeCurrency: {
    name: 'Fantom',
    symbol: 'FTM',
    decimals: 18,
  },
  rpcUrls: [
    'https://rpc.ftm.tools',
    'https://rpc.ankr.com/fantom',
  ],
  blockExplorers: [
    {
      name: 'FTMScan',
      url: 'https://ftmscan.com',
      standard: 'EIP3091',
    },
  ],
  shortName: 'ftm',
  networkId: 250,
  priority: 8,
  enabled: true,
  gasConfig: {
    baseGasLimit: 21000,
    eip1559: true,
    maxGasLimit: 15000000,
    gasMultiplier: 1.1,
  },
};

/**
 * Cronos 主网
 */
export const CRONOS_MAINNET: ChainConfig = {
  chainId: 25,
  chainName: 'Cronos',
  chainType: 'evm',
  nativeCurrency: {
    name: 'Cronos',
    symbol: 'CRO',
    decimals: 18,
  },
  rpcUrls: [
    'https://evm.cronos.org',
    'https://rpc.ankr.com/cronos',
  ],
  blockExplorers: [
    {
      name: 'Cronoscan',
      url: 'https://cronoscan.com',
      standard: 'EIP3091',
    },
  ],
  shortName: 'cro',
  networkId: 25,
  priority: 9,
  enabled: true,
  gasConfig: {
    baseGasLimit: 21000,
    eip1559: true,
    maxGasLimit: 30000000,
    gasMultiplier: 1.2,
  },
};

/**
 * Klaytn 主网
 */
export const KLAYTN_MAINNET: ChainConfig = {
  chainId: 8217,
  chainName: 'Klaytn',
  chainType: 'evm',
  nativeCurrency: {
    name: 'KLAY',
    symbol: 'KLAY',
    decimals: 18,
  },
  rpcUrls: [
    'https://public-en-cypress.klaytn.net',
  ],
  blockExplorers: [
    {
      name: 'KlaytnScope',
      url: 'https://scope.klaytn.com',
      standard: 'none',
    },
  ],
  shortName: 'klaytn',
  networkId: 8217,
  priority: 10,
  enabled: true,
  gasConfig: {
    baseGasLimit: 21000,
    eip1559: true,
    maxGasLimit: 100000000,
    gasMultiplier: 1.1,
  },
};

// ============================================================================
// 测试网
// ============================================================================

/**
 * 以太坊 Sepolia 测试网
 */
export const ETHEREUM_SEPOLIA: ChainConfig = {
  chainId: 11155111,
  chainName: 'Sepolia Testnet',
  chainType: 'evm',
  nativeCurrency: {
    name: 'Ethereum',
    symbol: 'ETH',
    decimals: 18,
  },
  rpcUrls: [
    'https://rpc.sepolia.org',
    'https://rpc.ankr.com/eth_sepolia',
    'https://sepolia.drpc.org',
  ],
  blockExplorers: [
    {
      name: 'Etherscan',
      url: 'https://sepolia.etherscan.io',
      standard: 'EIP3091',
    },
  ],
  testnet: true,
  shortName: 'sepolia',
  networkId: 11155111,
  priority: 100,
  enabled: true,
  gasConfig: {
    baseGasLimit: 21000,
    eip1559: true,
    maxGasLimit: 30000000,
    gasMultiplier: 1.2,
  },
};

/**
 * BSC 测试网
 */
export const BSC_TESTNET: ChainConfig = {
  chainId: 97,
  chainName: 'BNB Testnet',
  chainType: 'evm',
  nativeCurrency: {
    name: 'BNB',
    symbol: 'tBNB',
    decimals: 18,
  },
  rpcUrls: [
    'https://data-seed-prebsc-1-s1.binance.org:8545',
    'https://rpc.ankr.com/bsc_testnet_chapel',
  ],
  blockExplorers: [
    {
      name: 'BscScan',
      url: 'https://testnet.bscscan.com',
      standard: 'EIP3091',
    },
  ],
  testnet: true,
  shortName: 'tbsc',
  networkId: 97,
  priority: 101,
  enabled: true,
  gasConfig: {
    baseGasLimit: 21000,
    eip1559: false,
    maxGasLimit: 100000000,
    gasMultiplier: 1.1,
    gasPrice: '10000000000',
  },
};

/**
 * Polygon Amoy 测试网
 */
export const POLYGON_AMOY: ChainConfig = {
  chainId: 80002,
  chainName: 'Polygon Amoy',
  chainType: 'evm',
  nativeCurrency: {
    name: 'MATIC',
    symbol: 'MATIC',
    decimals: 18,
  },
  rpcUrls: [
    'https://rpc-amoy.polygon.technology',
    'https://rpc.ankr.com/polygon_amoy',
  ],
  blockExplorers: [
    {
      name: 'PolygonScan',
      url: 'https://amoy.polygonscan.com',
      standard: 'EIP3091',
    },
  ],
  testnet: true,
  shortName: 'amoy',
  networkId: 80002,
  priority: 102,
  enabled: true,
  gasConfig: {
    baseGasLimit: 21000,
    eip1559: true,
    maxGasLimit: 30000000,
    gasMultiplier: 1.2,
  },
};

/**
 * Arbitrum Sepolia 测试网
 */
export const ARBITRUM_SEPOLIA: ChainConfig = {
  chainId: 421614,
  chainName: 'Arbitrum Sepolia',
  chainType: 'evm',
  nativeCurrency: {
    name: 'Ethereum',
    symbol: 'ETH',
    decimals: 18,
  },
  rpcUrls: [
    'https://sepolia-rollup.arbitrum.io/rpc',
    'https://rpc.ankr.com/arbitrum_sepolia',
  ],
  blockExplorers: [
    {
      name: 'Arbiscan',
      url: 'https://sepolia.arbiscan.io',
      standard: 'EIP3091',
    },
  ],
  testnet: true,
  shortName: 'arb-sepolia',
  networkId: 421614,
  priority: 103,
  enabled: true,
  gasConfig: {
    baseGasLimit: 21000,
    eip1559: true,
    maxGasLimit: 120000000,
    gasMultiplier: 1.2,
  },
};

/**
 * Optimism Sepolia 测试网
 */
export const OPTIMISM_SEPOLIA: ChainConfig = {
  chainId: 11155420,
  chainName: 'Optimism Sepolia',
  chainType: 'evm',
  nativeCurrency: {
    name: 'Ethereum',
    symbol: 'ETH',
    decimals: 18,
  },
  rpcUrls: [
    'https://sepolia.optimism.io',
    'https://rpc.ankr.com/optimism_sepolia',
  ],
  blockExplorers: [
    {
      name: 'Optimistic Etherscan',
      url: 'https://sepolia-optimism.etherscan.io',
      standard: 'EIP3091',
    },
  ],
  testnet: true,
  shortName: 'op-sepolia',
  networkId: 11155420,
  priority: 104,
  enabled: true,
  gasConfig: {
    baseGasLimit: 21000,
    eip1559: true,
    maxGasLimit: 30000000,
    gasMultiplier: 1.2,
  },
};

/**
 * Base Sepolia 测试网
 */
export const BASE_SEPOLIA: ChainConfig = {
  chainId: 84532,
  chainName: 'Base Sepolia',
  chainType: 'evm',
  nativeCurrency: {
    name: 'Ethereum',
    symbol: 'ETH',
    decimals: 18,
  },
  rpcUrls: [
    'https://sepolia.base.org',
    'https://rpc.ankr.com/base_sepolia',
  ],
  blockExplorers: [
    {
      name: 'Basescan',
      url: 'https://sepolia.basescan.org',
      standard: 'EIP3091',
    },
  ],
  testnet: true,
  shortName: 'base-sepolia',
  networkId: 84532,
  priority: 105,
  enabled: true,
  gasConfig: {
    baseGasLimit: 21000,
    eip1559: true,
    maxGasLimit: 30000000,
    gasMultiplier: 1.2,
  },
};

// ============================================================================
// 默认链列表
// ============================================================================

/** 默认主网链列表 */
export const MAINNET_CHAINS: ChainConfig[] = [
  ETHEREUM_MAINNET,
  BSC_MAINNET,
  POLYGON_MAINNET,
  ARBITRUM_ONE,
  OPTIMISM_MAINNET,
  BASE_MAINNET,
  AVALANCHE_C_CHAIN,
  FANTOM_OPERA,
  CRONOS_MAINNET,
  KLAYTN_MAINNET,
];

/** 默认测试网链列表 */
export const TESTNET_CHAINS: ChainConfig[] = [
  ETHEREUM_SEPOLIA,
  BSC_TESTNET,
  POLYGON_AMOY,
  ARBITRUM_SEPOLIA,
  OPTIMISM_SEPOLIA,
  BASE_SEPOLIA,
];

/** 兼容旧导出：所有内置链 */
export const BUILTIN_CHAINS: ChainConfig[] = getAllBuiltinChains();

/**
 * 获取所有内置链
 */
export function getAllBuiltinChains(): ChainConfig[] {
  return [...MAINNET_CHAINS, ...TESTNET_CHAINS];
}

/** 兼容旧导出：根据链 ID 获取内置链 */
export function getBuiltinChain(chainId: number): ChainConfig | undefined {
  return findChainById(chainId);
}

/** 兼容旧导出：根据网络类型获取内置链 */
export function getBuiltinChainsByType(type: 'mainnet' | 'testnet' | 'all' = 'all'): ChainConfig[] {
  if (type === 'mainnet') return getMainnetChains();
  if (type === 'testnet') return getTestnetChains();
  return getAllBuiltinChains();
}

/**
 * 获取主网链列表
 */
export function getMainnetChains(): ChainConfig[] {
  return [...MAINNET_CHAINS];
}

/**
 * 获取测试网链列表
 */
export function getTestnetChains(): ChainConfig[] {
  return [...TESTNET_CHAINS];
}

/**
 * 根据链 ID 查找链配置
 */
export function findChainById(chainId: number, chains: ChainConfig[] = getAllBuiltinChains()): ChainConfig | undefined {
  return chains.find(c => c.chainId === chainId);
}

/**
 * 根据链名称查找链配置
 */
export function findChainByName(name: string, chains: ChainConfig[] = getAllBuiltinChains()): ChainConfig | undefined {
  return chains.find(c =>
    c.chainName.toLowerCase() === name.toLowerCase() ||
    c.shortName?.toLowerCase() === name.toLowerCase()
  );
}

/**
 * 按优先级排序链
 */
export function sortChainsByPriority(chains: ChainConfig[]): ChainConfig[] {
  return [...chains].sort((a, b) => (a.priority ?? 999) - (b.priority ?? 999));
}
