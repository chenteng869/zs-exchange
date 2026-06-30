import { SpotTrade, Prisma, SpotOrderSide, SpotTradeRole } from '@prisma/client';
import { spotTradeRepo } from '../repos';
import { PaginationParams, PaginatedResult } from '../repos/base-repo';

export interface CreateTradeParams {
  orderId: string;
  counterOrderId: string;
  userId: string;
  counterUserId: string;
  marketId: bigint;
  marketSymbol: string;
  side: SpotOrderSide;
  price: Prisma.Decimal;
  quantity: Prisma.Decimal;
  value: Prisma.Decimal;
  fee: Prisma.Decimal;
  feeCurrency: string;
  role: SpotTradeRole;
  makerOrderNo?: string;
  takerOrderNo?: string;
}

export interface CreateTradeManyParams {
  tradeNo: string;
  orderId: string;
  counterOrderId: string;
  userId: string;
  counterUserId: string;
  marketId: bigint;
  marketSymbol: string;
  side: SpotOrderSide;
  price: Prisma.Decimal;
  quantity: Prisma.Decimal;
  value: Prisma.Decimal;
  fee: Prisma.Decimal;
  feeCurrency: string;
  role: SpotTradeRole;
  makerOrderNo?: string;
  takerOrderNo?: string;
}

export class SpotTradeService {
  private repo: typeof spotTradeRepo;

  constructor(customRepo?: typeof spotTradeRepo) {
    this.repo = customRepo || spotTradeRepo;
  }

  async getById(id: string): Promise<SpotTrade | null> {
    return this.repo.findById(id);
  }

  async getByTradeNo(tradeNo: string): Promise<SpotTrade | null> {
    return this.repo.findByTradeNo(tradeNo);
  }

  async getByOrderId(orderId: string): Promise<SpotTrade[]> {
    return this.repo.findByOrderId(orderId);
  }

  async getByUserId(userId: string): Promise<SpotTrade[]> {
    return this.repo.findByUserId(userId);
  }

  async getByUserIdAndMarket(userId: string, marketSymbol: string): Promise<SpotTrade[]> {
    return this.repo.findByUserIdAndMarket(userId, marketSymbol);
  }

  async getByMarket(marketId: bigint): Promise<SpotTrade[]> {
    return this.repo.findByMarket(marketId);
  }

  async getRecentTrades(marketId: bigint, limit: number = 50): Promise<SpotTrade[]> {
    return this.repo.findRecentTrades(marketId, limit);
  }

  async list(params: PaginationParams & {
    userId?: string;
    marketSymbol?: string;
    orderId?: string;
    side?: SpotOrderSide;
    role?: SpotTradeRole;
  }): Promise<PaginatedResult<SpotTrade>> {
    return this.repo.paginate(params);
  }

  async create(params: CreateTradeParams): Promise<SpotTrade> {
    return this.repo.create({
      tradeNo: `ST${Date.now()}${Math.random().toString(36).substr(2, 9)}`,
      order: { connect: { id: params.orderId } },
      counterOrderId: params.counterOrderId,
      userId: params.userId,
      counterUserId: params.counterUserId,
      market: { connect: { id: params.marketId } },
      marketSymbol: params.marketSymbol,
      side: params.side,
      price: params.price,
      quantity: params.quantity,
      value: params.value,
      fee: params.fee,
      feeCurrency: params.feeCurrency,
      role: params.role,
      makerOrderNo: params.makerOrderNo,
      takerOrderNo: params.takerOrderNo,
    });
  }

  async createBatch(trades: CreateTradeManyParams[]): Promise<Prisma.BatchPayload> {
    const data = trades.map(params => ({
      tradeNo: params.tradeNo,
      orderId: params.orderId,
      counterOrderId: params.counterOrderId,
      userId: params.userId,
      counterUserId: params.counterUserId,
      marketId: params.marketId,
      marketSymbol: params.marketSymbol,
      side: params.side,
      price: params.price,
      quantity: params.quantity,
      value: params.value,
      fee: params.fee,
      feeCurrency: params.feeCurrency,
      role: params.role,
      makerOrderNo: params.makerOrderNo,
      takerOrderNo: params.takerOrderNo,
    }));
    return this.repo.createBatch(data);
  }

  async get24hVolume(marketId: bigint): Promise<Prisma.Decimal> {
    return this.repo.get24hVolume(marketId);
  }

  async getTradesHistory(userId: string, marketSymbol?: string, page: number = 1, pageSize: number = 20): Promise<PaginatedResult<SpotTrade>> {
    return this.repo.paginate({
      page,
      pageSize,
      userId,
      marketSymbol,
    });
  }
}

export const spotTradeService = new SpotTradeService();