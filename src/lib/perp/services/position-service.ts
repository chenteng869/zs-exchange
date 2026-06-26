import { PerpPosition, Prisma } from '@prisma/client';
import { positionRepo, accountRepo, contractRepo } from '../repos';
import { PaginationParams, PaginatedResult } from '../repos/base-repo';

export class PositionService {
  private positionRepo: typeof positionRepo;
  private accountRepo: typeof accountRepo;
  private contractRepo: typeof contractRepo;

  constructor(
    customPositionRepo?: typeof positionRepo,
    customAccountRepo?: typeof accountRepo,
    customContractRepo?: typeof contractRepo
  ) {
    this.positionRepo = customPositionRepo || positionRepo;
    this.accountRepo = customAccountRepo || accountRepo;
    this.contractRepo = customContractRepo || contractRepo;
  }

  async getById(id: string): Promise<PerpPosition | null> {
    return this.positionRepo.findById(id);
  }

  async getByUserSymbolSideMargin(
    userId: string,
    symbol: string,
    side: string,
    marginMode: string
  ): Promise<PerpPosition | null> {
    return this.positionRepo.findByUserSymbolSideMargin(userId, symbol, side, marginMode);
  }

  async getUserPositions(userId: string, symbol?: string): Promise<PerpPosition[]> {
    return this.positionRepo.findByUserId(userId, symbol);
  }

  async list(params: PaginationParams & {
    userId?: string;
    symbol?: string;
    side?: string;
    status?: string;
    marginMode?: string;
  }): Promise<PaginatedResult<PerpPosition>> {
    return this.positionRepo.paginate(params);
  }

  async updateMarkPrice(id: string, markPrice: Prisma.Decimal, unrealizedPnl: Prisma.Decimal): Promise<PerpPosition> {
    return this.positionRepo.updateMarkPrice(id, markPrice, unrealizedPnl);
  }

  async updateLiquidationPrice(id: string, liquidationPrice: Prisma.Decimal): Promise<PerpPosition> {
    return this.positionRepo.updateLiquidationPrice(id, liquidationPrice);
  }

  async closePosition(id: string, closeTime?: Date): Promise<PerpPosition> {
    return this.positionRepo.setStatus(id, 'closed', closeTime);
  }

  async getLiquidationCandidates(symbol: string, batchSize = 100): Promise<PerpPosition[]> {
    return this.positionRepo.findAllActiveForLiquidation(symbol, batchSize);
  }

  async getPositionSummary(userId: string, symbol: string) {
    const positions = await this.positionRepo.findByUserId(userId, symbol);
    let totalUnrealizedPnl = new Prisma.Decimal(0);
    let totalMargin = new Prisma.Decimal(0);

    for (const pos of positions) {
      totalUnrealizedPnl = totalUnrealizedPnl.add(pos.unrealizedPnl);
      totalMargin = totalMargin.add(pos.positionMargin);
    }

    return {
      positions,
      totalUnrealizedPnl,
      totalMargin,
      positionCount: positions.length,
    };
  }
}

export const positionService = new PositionService();
