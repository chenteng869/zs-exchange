import { PerpContract, Prisma } from '@prisma/client';
import { BaseRepository, contractRepo } from '../repos';
import { PaginationParams, PaginatedResult } from '../repos/base-repo';

export class ContractService {
  private repo: typeof contractRepo;

  constructor(customRepo?: typeof contractRepo) {
    this.repo = customRepo || contractRepo;
  }

  async getById(id: string): Promise<PerpContract | null> {
    return this.repo.findById(id);
  }

  async getBySymbol(symbol: string): Promise<PerpContract | null> {
    return this.repo.findBySymbol(symbol);
  }

  async getActiveContracts(): Promise<PerpContract[]> {
    return this.repo.findAllActive();
  }

  async list(params: PaginationParams & { status?: string; symbol?: string }): Promise<PaginatedResult<PerpContract>> {
    return this.repo.paginate(params);
  }

  async create(data: Prisma.PerpContractCreateInput): Promise<PerpContract> {
    return this.repo.create(data);
  }

  async update(id: string, data: Prisma.PerpContractUpdateInput): Promise<PerpContract> {
    return this.repo.update(id, data);
  }

  async setStatus(id: string, status: string): Promise<PerpContract> {
    return this.repo.setStatus(id, status);
  }

  async updateFeeRates(id: string, makerFeeRate: Prisma.Decimal, takerFeeRate: Prisma.Decimal): Promise<PerpContract> {
    return this.repo.update(id, { makerFeeRate, takerFeeRate });
  }

  async updateLeverageConfig(id: string, maxLeverage: number, initialMarginRate: Prisma.Decimal, maintenanceMarginRate: Prisma.Decimal): Promise<PerpContract> {
    return this.repo.update(id, { maxLeverage, initialMarginRate, maintenanceMarginRate });
  }

  async validateLeverage(symbol: string, leverage: number): Promise<boolean> {
    const contract = await this.repo.findBySymbol(symbol);
    if (!contract) return false;
    return leverage > 0 && leverage <= contract.maxLeverage;
  }

  async getContractConfig(symbol: string) {
    const contract = await this.repo.findBySymbol(symbol);
    if (!contract) return null;
    return {
      symbol: contract.symbol,
      baseAsset: contract.baseAsset,
      quoteAsset: contract.quoteAsset,
      maxLeverage: contract.maxLeverage,
      minOrderQty: contract.minOrderQty,
      maxOrderQty: contract.maxOrderQty,
      initialMarginRate: contract.initialMarginRate,
      maintenanceMarginRate: contract.maintenanceMarginRate,
      makerFeeRate: contract.makerFeeRate,
      takerFeeRate: contract.takerFeeRate,
      pricePrecision: contract.pricePrecision,
      qtyPrecision: contract.qtyPrecision,
    };
  }
}

export const contractService = new ContractService();
