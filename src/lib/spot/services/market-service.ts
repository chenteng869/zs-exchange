import { SpotMarket, Prisma, SpotMarketStatus } from '@prisma/client';
import { spotMarketRepo } from '../repos';
import { PaginationParams, PaginatedResult } from '../repos/base-repo';

export class SpotMarketService {
  private repo: typeof spotMarketRepo;

  constructor(customRepo?: typeof spotMarketRepo) {
    this.repo = customRepo || spotMarketRepo;
  }

  async getById(id: bigint): Promise<SpotMarket | null> {
    return this.repo.findById(id);
  }

  async getByMarketSymbol(marketSymbol: string): Promise<SpotMarket | null> {
    return this.repo.findByMarketSymbol(marketSymbol);
  }

  async getBySymbol(marketSymbol: string): Promise<SpotMarket | null> {
    return this.getByMarketSymbol(marketSymbol);
  }

  async getByBaseAndQuote(baseAsset: string, quoteAsset: string): Promise<SpotMarket | null> {
    return this.repo.findByBaseAndQuote(baseAsset, quoteAsset);
  }

  async getActiveMarkets(): Promise<SpotMarket[]> {
    return this.repo.findAllActive();
  }

  async getAllMarkets(): Promise<SpotMarket[]> {
    return this.repo.findAll();
  }

  async list(params: PaginationParams & { status?: SpotMarketStatus; marketSymbol?: string; baseAsset?: string; quoteAsset?: string }): Promise<PaginatedResult<SpotMarket>> {
    return this.repo.paginate(params);
  }

  async create(data: Prisma.SpotMarketCreateInput): Promise<SpotMarket> {
    return this.repo.create(data);
  }

  async update(id: bigint, data: Prisma.SpotMarketUpdateInput): Promise<SpotMarket> {
    return this.repo.update(id, data);
  }

  async updateByMarketSymbol(marketSymbol: string, data: Prisma.SpotMarketUpdateInput): Promise<SpotMarket> {
    return this.repo.updateByMarketSymbol(marketSymbol, data);
  }

  async setStatus(id: bigint, status: SpotMarketStatus): Promise<SpotMarket> {
    return this.repo.setStatus(id, status);
  }

  async suspendMarket(id: bigint): Promise<SpotMarket> {
    return this.repo.setStatus(id, SpotMarketStatus.suspended);
  }

  async resumeMarket(id: bigint): Promise<SpotMarket> {
    return this.repo.setStatus(id, SpotMarketStatus.trading);
  }

  async updateFeeRates(id: bigint, makerFeeRate: Prisma.Decimal, takerFeeRate: Prisma.Decimal): Promise<SpotMarket> {
    return this.repo.update(id, { makerFeeRate, takerFeeRate });
  }

  async updatePrecision(id: bigint, pricePrecision: number, quantityPrecision: number): Promise<SpotMarket> {
    return this.repo.update(id, { pricePrecision, quantityPrecision });
  }

  async updateLimits(id: bigint, minQuantity: Prisma.Decimal, minNotional: Prisma.Decimal, maxQuantity?: Prisma.Decimal, maxNotional?: Prisma.Decimal): Promise<SpotMarket> {
    const data: Prisma.SpotMarketUpdateInput = { minQuantity, minNotional };
    if (maxQuantity !== undefined) data.maxQuantity = maxQuantity;
    if (maxNotional !== undefined) data.maxNotional = maxNotional;
    return this.repo.update(id, data);
  }

  async validateMarket(marketSymbol: string): Promise<SpotMarket | null> {
    const market = await this.repo.findByMarketSymbol(marketSymbol);
    if (!market) return null;
    if (market.status !== SpotMarketStatus.trading) return null;
    return market;
  }

  async getMarketConfig(marketSymbol: string) {
    const market = await this.repo.findByMarketSymbol(marketSymbol);
    if (!market) return null;
    return {
      marketSymbol: market.marketSymbol,
      baseAsset: market.baseAsset,
      quoteAsset: market.quoteAsset,
      pricePrecision: market.pricePrecision,
      quantityPrecision: market.quantityPrecision,
      minQuantity: market.minQuantity,
      minNotional: market.minNotional,
      maxQuantity: market.maxQuantity,
      maxNotional: market.maxNotional,
      makerFeeRate: market.makerFeeRate,
      takerFeeRate: market.takerFeeRate,
      priceTickSize: market.priceTickSize,
      status: market.status,
    };
  }

  async delete(id: bigint): Promise<SpotMarket> {
    return this.repo.delete(id);
  }
}

export const spotMarketService = new SpotMarketService();