/**
 * 永续合约注册表
 *
 *  - 预定义 USDT-M 主流永续合约（BTC/ETH/SOL/BNB/XRP）
 *  - 支持运行时查询、更新（admin 后台调参用）
 *  - 全局单例 + 自定义实例两套 API
 *
 * 与 src/lib/market/kaiko/kaiko-service.ts 协作：
 *  Kaiko 推送 indexPrice -> FundingEngine 预测 funding -> markPrice
 */

import type { Contract } from './types';

// ============================================================================
// 预定义合约
// ============================================================================

export const DEFAULT_CONTRACTS: Contract[] = [
  {
    symbol: 'BTCUSDT',
    baseAsset: 'BTC',
    quoteAsset: 'USDT',
    tickSize: '0.1',
    stepSize: '0.001',
    minQty: '0.001',
    maxQty: '1000',
    minNotional: '5',
    maxLeverage: 125,
    defaultLeverage: 20,
    maintenanceMarginRate: 0.005,
    initialMarginRate: 0.01,
    makerFee: 0.0002,
    takerFee: 0.0005,
    fundingIntervalHours: 8,
    fundingCap: 0.0075,
    isActive: true,
  },
  {
    symbol: 'ETHUSDT',
    baseAsset: 'ETH',
    quoteAsset: 'USDT',
    tickSize: '0.01',
    stepSize: '0.001',
    minQty: '0.001',
    maxQty: '10000',
    minNotional: '5',
    maxLeverage: 100,
    defaultLeverage: 20,
    maintenanceMarginRate: 0.005,
    initialMarginRate: 0.01,
    makerFee: 0.0002,
    takerFee: 0.0005,
    fundingIntervalHours: 8,
    fundingCap: 0.0075,
    isActive: true,
  },
  {
    symbol: 'SOLUSDT',
    baseAsset: 'SOL',
    quoteAsset: 'USDT',
    tickSize: '0.001',
    stepSize: '0.01',
    minQty: '0.01',
    maxQty: '100000',
    minNotional: '5',
    maxLeverage: 75,
    defaultLeverage: 20,
    maintenanceMarginRate: 0.01,
    initialMarginRate: 0.02,
    makerFee: 0.0002,
    takerFee: 0.0005,
    fundingIntervalHours: 8,
    fundingCap: 0.0075,
    isActive: true,
  },
  {
    symbol: 'BNBUSDT',
    baseAsset: 'BNB',
    quoteAsset: 'USDT',
    tickSize: '0.01',
    stepSize: '0.001',
    minQty: '0.001',
    maxQty: '50000',
    minNotional: '5',
    maxLeverage: 75,
    defaultLeverage: 20,
    maintenanceMarginRate: 0.01,
    initialMarginRate: 0.02,
    makerFee: 0.0002,
    takerFee: 0.0005,
    fundingIntervalHours: 8,
    fundingCap: 0.0075,
    isActive: true,
  },
  {
    symbol: 'XRPUSDT',
    baseAsset: 'XRP',
    quoteAsset: 'USDT',
    tickSize: '0.0001',
    stepSize: '1',
    minQty: '1',
    maxQty: '1000000',
    minNotional: '5',
    maxLeverage: 75,
    defaultLeverage: 20,
    maintenanceMarginRate: 0.02,
    initialMarginRate: 0.05,
    makerFee: 0.0004,
    takerFee: 0.0005,
    fundingIntervalHours: 8,
    fundingCap: 0.0075,
    isActive: true,
  },
];

/** 关键常量 */
export const MAINTENANCE_MARGIN_RATES: Record<string, number> = {
  BTCUSDT: 0.005,
  ETHUSDT: 0.005,
  SOLUSDT: 0.01,
  BNBUSDT: 0.01,
  XRPUSDT: 0.02,
};

export const FUNDING_INTERVAL_HOURS = 8;
export const MAX_LEVERAGE = 125;
export const DEFAULT_LEVERAGE = 20;
export const INSURANCE_FUND_INITIAL = '1000000';
export const LIQUIDATION_FEE_RATE = 0.005;
export const ADL_TRIGGER_RATIO = 0.1;

// ============================================================================
// 注册表实现
// ============================================================================

export class ContractRegistry {
  private contracts: Map<string, Contract> = new Map();

  constructor(initial: Contract[] = DEFAULT_CONTRACTS) {
    for (const c of initial) {
      this.contracts.set(c.symbol, { ...c });
    }
  }

  /** 根据 symbol 查询合约，未激活或不存在返回 null。 */
  getContract(symbol: string): Contract | null {
    const c = this.contracts.get(symbol);
    if (!c || !c.isActive) return null;
    return { ...c };
  }

  /** 获取全部合约（包含未激活的），返回拷贝。 */
  getAllContracts(): Contract[] {
    return Array.from(this.contracts.values()).map((c) => ({ ...c }));
  }

  /** 获取全部激活的合约。 */
  getActiveContracts(): Contract[] {
    return this.getAllContracts().filter((c) => c.isActive);
  }

  /** 更新合约参数（admin 后台调参）。 */
  updateContract(symbol: string, updates: Partial<Contract>): Contract {
    const cur = this.contracts.get(symbol);
    if (!cur) {
      throw new Error(`Contract not found: ${symbol}`);
    }
    const next: Contract = { ...cur, ...updates, symbol: cur.symbol };
    this.contracts.set(symbol, next);
    return { ...next };
  }

  /** 添加新合约。 */
  addContract(contract: Contract): void {
    if (this.contracts.has(contract.symbol)) {
      throw new Error(`Contract already exists: ${contract.symbol}`);
    }
    this.contracts.set(contract.symbol, { ...contract });
  }

  upsertContract(contract: Contract): Contract {
    const current = this.contracts.get(contract.symbol);
    const next: Contract = current ? { ...current, ...contract } : { ...contract };
    this.contracts.set(contract.symbol, next);
    return { ...next };
  }

  /** 测试/治理：移除合约。 */
  removeContract(symbol: string): boolean {
    return this.contracts.delete(symbol);
  }

  /** 测试：清空。 */
  reset(): void {
    this.contracts.clear();
  }

  size(): number {
    return this.contracts.size;
  }
}

/** 全局单例。 */
export const globalContractRegistry = new ContractRegistry();
