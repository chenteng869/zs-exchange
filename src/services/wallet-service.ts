/**
 * 钱包服务层 (Web3 + 多链)
 *
 * 业务职责:
 *  1. 连接真实区块链 RPC (Ethereum/BSC/Polygon/Arbitrum/Solana/Tron)
 *  2. 用户钱包管理 (创建 / 导入 / 列表 / 默认)
 *  3. 余额查询 (原生币 + ERC20/TRC20/SPL 代币)
 *  4. 充值地址生成 + 提现广播
 *  5. Gas 估算 + 交易状态追踪
 *
 * 接入策略:
 *  - 真实环境:  链上 RPC (Alchemy / Infura / TronGrid / Solana RPC)
 *  - 演示环境:  调用后端 /api/wallet/* (BFF) 桥接
 *  - 失败降级:  返回本地生成的伪地址 + 0 余额 (前端不报错)
 *
 * 第三方依赖 (运行时通过后端 .env 注入):
 *  - ALCHEMY_API_KEY
 *  - INFURA_PROJECT_ID
 *  - TRONGRID_API_KEY
 *  - SOLANA_RPC_URL
 */

import { http, normalizeError, ApiError, USE_MOCK } from './api-client';
import { logger } from '@/lib/logger';

// ============================================================================
// 类型
// ============================================================================

export type ChainId =
  | 'ETH'
  | 'BSC'
  | 'POLYGON'
  | 'ARBITRUM'
  | 'OPTIMISM'
  | 'BASE'
  | 'SOLANA'
  | 'TRON'
  | 'BTC';

export type WalletType = 'hot' | 'cold' | 'custodial';

export interface Wallet {
  id: string;
  userId: string;
  chain: ChainId;
  asset: string;
  type: WalletType;
  address: string;
  label?: string;
  isDefault: boolean;
  balance: string;          // 主币余额
  tokens: TokenBalance[];   // 代币余额
  status: 'active' | 'frozen' | 'closed';
  createdAt: string;
}

export interface TokenBalance {
  symbol: string;
  name: string;
  contractAddress: string;
  decimals: number;
  balance: string;          // 原始精度
  balanceFormatted: string; // UI 显示
  priceUsd?: number;
  valueUsd?: number;
}

export interface ChainStatus {
  chain: ChainId;
  name: string;
  rpc: string;
  blockHeight: number;
  gasPrice: string;
  healthy: boolean;
  latencyMs?: number;
}

export interface CreateWalletRequest {
  userId: string;
  chain: ChainId;
  asset: string;
  type?: WalletType;
  label?: string;
}

export interface WithdrawalRequest {
  walletId: string;
  toAddress: string;
  amount: string;
  asset: string;
  memo?: string;
}

export interface TransactionRecord {
  hash: string;
  chain: ChainId;
  from: string;
  to: string;
  amount: string;
  asset: string;
  fee: string;
  status: 'pending' | 'confirmed' | 'failed';
  blockHeight?: number;
  confirmations: number;
  timestamp: number;
  direction: 'in' | 'out';
}

// ============================================================================
// 链元数据
// ============================================================================

export const CHAIN_META: Record<ChainId, {
  name: string;
  symbol: string;
  decimals: number;
  explorer: string;
  defaultRpc: string;
  tokens: Array<{ symbol: string; contract?: string; decimals: number }>;
}> = {
  ETH: {
    name: 'Ethereum',
    symbol: 'ETH',
    decimals: 18,
    explorer: 'https://etherscan.io',
    defaultRpc: 'https://eth.llamarpc.com',
    tokens: [
      { symbol: 'USDT', contract: '0xdAC17F958D2ee523a2206206994597C13D831ec7', decimals: 6 },
      { symbol: 'USDC', contract: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', decimals: 6 },
      { symbol: 'DAI',  contract: '0x6B175474E89094C44Da98b954EedeAC495271d0F', decimals: 18 },
    ],
  },
  BSC: {
    name: 'BNB Smart Chain',
    symbol: 'BNB',
    decimals: 18,
    explorer: 'https://bscscan.com',
    defaultRpc: 'https://bsc-dataseed.binance.org',
    tokens: [
      { symbol: 'USDT', contract: '0x55d398326f99059fF775485246999027B3197955', decimals: 18 },
      { symbol: 'BUSD', contract: '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56', decimals: 18 },
    ],
  },
  POLYGON: {
    name: 'Polygon',
    symbol: 'MATIC',
    decimals: 18,
    explorer: 'https://polygonscan.com',
    defaultRpc: 'https://polygon-rpc.com',
    tokens: [
      { symbol: 'USDT', contract: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F', decimals: 6 },
      { symbol: 'USDC', contract: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174', decimals: 6 },
    ],
  },
  ARBITRUM: {
    name: 'Arbitrum One',
    symbol: 'ETH',
    decimals: 18,
    explorer: 'https://arbiscan.io',
    defaultRpc: 'https://arb1.arbitrum.io/rpc',
    tokens: [
      { symbol: 'USDT', contract: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9', decimals: 6 },
      { symbol: 'ARB',  contract: '0x912CE59144191C1204E64559FE8253a0e49E6548', decimals: 18 },
    ],
  },
  OPTIMISM: {
    name: 'Optimism',
    symbol: 'ETH',
    decimals: 18,
    explorer: 'https://optimistic.etherscan.io',
    defaultRpc: 'https://mainnet.optimism.io',
    tokens: [
      { symbol: 'USDC', contract: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85', decimals: 6 },
    ],
  },
  BASE: {
    name: 'Base',
    symbol: 'ETH',
    decimals: 18,
    explorer: 'https://basescan.org',
    defaultRpc: 'https://mainnet.base.org',
    tokens: [
      { symbol: 'USDC', contract: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', decimals: 6 },
    ],
  },
  SOLANA: {
    name: 'Solana',
    symbol: 'SOL',
    decimals: 9,
    explorer: 'https://solscan.io',
    defaultRpc: 'https://api.mainnet-beta.solana.com',
    tokens: [
      { symbol: 'USDC', contract: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', decimals: 6 },
      { symbol: 'USDT', contract: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB', decimals: 6 },
    ],
  },
  TRON: {
    name: 'Tron',
    symbol: 'TRX',
    decimals: 6,
    explorer: 'https://tronscan.org',
    defaultRpc: 'https://api.trongrid.io',
    tokens: [
      { symbol: 'USDT', contract: 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t', decimals: 6 },
    ],
  },
  BTC: {
    name: 'Bitcoin',
    symbol: 'BTC',
    decimals: 8,
    explorer: 'https://blockchair.com/bitcoin',
    defaultRpc: 'https://blockstream.info/api',
    tokens: [],
  },
};

// ============================================================================
// 服务
// ============================================================================

export const walletService = {
  /**
   * 获取用户所有钱包
   */
  async list(userId: string): Promise<Wallet[]> {
    try {
      const res = await http.get<{ data: Wallet[] }>(`/wallet/user/${userId}`);
      return res.data;
    } catch (e) {
      if (USE_MOCK) return mockWallets(userId);
      throw normalizeError(e);
    }
  },

  /**
   * 创建新钱包
   */
  async create(req: CreateWalletRequest): Promise<Wallet> {
    try {
      const res = await http.post<{ data: Wallet }>('/wallet/create', req);
      logger.info('[wallet] create', req.chain, res.data.address);
      return res.data;
    } catch (e) {
      if (USE_MOCK) return mockCreateWallet(req);
      throw normalizeError(e);
    }
  },

  /**
   * 设置默认钱包
   */
  async setDefault(walletId: string): Promise<void> {
    try {
      await http.put<void>(`/wallet/${walletId}/default`);
    } catch (e) {
      if (!USE_MOCK) throw normalizeError(e);
    }
  },

  /**
   * 查询余额 (原生币 + 代币)
   */
  async getBalance(walletId: string): Promise<{
    native: string;
    tokens: TokenBalance[];
  }> {
    try {
      const res = await http.get<{ data: { native: string; tokens: TokenBalance[] } }>(
        `/wallet/${walletId}/balance`
      );
      return res.data;
    } catch (e) {
      if (USE_MOCK) return mockBalance(walletId);
      throw normalizeError(e);
    }
  },

  /**
   * 获取充值地址
   */
  async getDepositAddress(walletId: string): Promise<{ address: string; memo?: string; qrCode?: string }> {
    try {
      const res = await http.get<{ data: { address: string; memo?: string; qrCode?: string } }>(
        `/wallet/${walletId}/deposit-address`
      );
      return res.data;
    } catch (e) {
      if (USE_MOCK) return { address: mockAddress('ETH') };
      throw normalizeError(e);
    }
  },

  /**
   * 发起提现
   */
  async withdraw(req: WithdrawalRequest): Promise<{ txHash: string; status: 'pending' }> {
    try {
      const res = await http.post<{ data: { txHash: string; status: 'pending' } }>(
        '/wallet/withdraw',
        req
      );
      return res.data;
    } catch (e) {
      if (USE_MOCK) return { txHash: mockHash(), status: 'pending' };
      throw normalizeError(e);
    }
  },

  /**
   * 查询交易记录
   */
  async getTransactions(
    walletId: string,
    params?: { page?: number; pageSize?: number; direction?: 'in' | 'out' }
  ): Promise<{ items: TransactionRecord[]; total: number }> {
    try {
      const res = await http.get<{ data: { items: TransactionRecord[]; total: number } }>(
        `/wallet/${walletId}/transactions`,
        { params }
      );
      return res.data;
    } catch (e) {
      if (USE_MOCK) return mockTransactions();
      throw normalizeError(e);
    }
  },

  /**
   * 估算 Gas
   */
  async estimateGas(chain: ChainId, to: string, amount: string, asset: string): Promise<{
    gasPrice: string;
    gasLimit: string;
    feeNative: string;
    feeUsd: number;
  }> {
    try {
      const res = await http.post<{ data: any }>('/wallet/estimate-gas', {
        chain, to, amount, asset,
      });
      return res.data;
    } catch (e) {
      if (USE_MOCK) {
        return {
          gasPrice: '20',
          gasLimit: '21000',
          feeNative: '0.00042',
          feeUsd: 1.4,
        };
      }
      throw normalizeError(e);
    }
  },

  /**
   * 链健康检查
   */
  async probeChains(): Promise<ChainStatus[]> {
    try {
      const res = await http.get<{ data: ChainStatus[] }>('/wallet/chains/status');
      return res.data;
    } catch (e) {
      if (USE_MOCK) return mockChainStatus();
      throw normalizeError(e);
    }
  },
};

// ============================================================================
// Mock 数据 (USE_MOCK 模式下返回)
// ============================================================================

function mockAddress(prefix: string): string {
  const hex = Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
  if (prefix === 'BTC') return 'bc1q' + hex.slice(0, 38);
  if (prefix === 'TRON') return 'T' + hex.slice(0, 33);
  return '0x' + hex;
}

function mockHash(): string {
  return '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
}

function mockWallets(userId: string): Wallet[] {
  const chains: ChainId[] = ['ETH', 'BSC', 'TRON', 'SOLANA'];
  return chains.map((c, i) => {
    const meta = CHAIN_META[c];
    return {
      id: `w_${c}_${i}`,
      userId,
      chain: c,
      asset: meta.symbol,
      type: 'hot',
      address: mockAddress(c),
      label: `${meta.name} 钱包`,
      isDefault: i === 0,
      balance: (Math.random() * 5).toFixed(4),
      tokens: meta.tokens.map((t) => ({
        symbol: t.symbol,
        name: t.symbol,
        contractAddress: t.contract || '',
        decimals: t.decimals,
        balance: (Math.random() * 1000).toFixed(2),
        balanceFormatted: (Math.random() * 1000).toFixed(2),
        priceUsd: 1,
        valueUsd: Math.random() * 1000,
      })),
      status: 'active',
      createdAt: new Date(Date.now() - i * 86400_000).toISOString(),
    };
  });
}

function mockCreateWallet(req: CreateWalletRequest): Wallet {
  return {
    id: `w_${req.chain}_${Date.now()}`,
    userId: req.userId,
    chain: req.chain,
    asset: req.asset,
    type: req.type || 'hot',
    address: mockAddress(req.chain),
    label: req.label || `${req.chain} 钱包`,
    isDefault: false,
    balance: '0',
    tokens: [],
    status: 'active',
    createdAt: new Date().toISOString(),
  };
}

function mockBalance(walletId: string): { native: string; tokens: TokenBalance[] } {
  return {
    native: (Math.random() * 3).toFixed(4),
    tokens: [
      {
        symbol: 'USDT', name: 'Tether USD',
        contractAddress: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
        decimals: 6,
        balance: '1000000000',
        balanceFormatted: '1000.00',
        priceUsd: 1, valueUsd: 1000,
      },
    ],
  };
}

function mockTransactions(): { items: TransactionRecord[]; total: number } {
  const now = Date.now();
  return {
    total: 8,
    items: Array.from({ length: 5 }, (_, i) => ({
      hash: mockHash(),
      chain: 'ETH' as ChainId,
      from: mockAddress('ETH'),
      to: mockAddress('ETH'),
      amount: (Math.random() * 0.5).toFixed(4),
      asset: 'ETH',
      fee: '0.0008',
      status: 'confirmed' as const,
      blockHeight: 18500000 - i,
      confirmations: 12 + i,
      timestamp: now - i * 3600_000,
      direction: i % 2 === 0 ? 'in' as const : 'out' as const,
    })),
  };
}

function mockChainStatus(): ChainStatus[] {
  return Object.entries(CHAIN_META).map(([id, meta]) => ({
    chain: id as ChainId,
    name: meta.name,
    rpc: meta.defaultRpc,
    blockHeight: 18500000 + Math.floor(Math.random() * 100000),
    gasPrice: (10 + Math.random() * 50).toFixed(2),
    healthy: Math.random() > 0.05,
    latencyMs: 50 + Math.floor(Math.random() * 200),
  }));
}

export default walletService;
