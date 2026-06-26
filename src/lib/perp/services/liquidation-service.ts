import { PerpLiquidation, Prisma } from '@prisma/client';
import { liquidationRepo, positionRepo, accountRepo, insuranceRepo } from '../repos';
import { PaginationParams, PaginatedResult } from '../repos/base-repo';

export class LiquidationService {
  private liquidationRepo: typeof liquidationRepo;
  private positionRepo: typeof positionRepo;
  private accountRepo: typeof accountRepo;
  private insuranceRepo: typeof insuranceRepo;

  constructor(
    customLiquidationRepo?: typeof liquidationRepo,
    customPositionRepo?: typeof positionRepo,
    customAccountRepo?: typeof accountRepo,
    customInsuranceRepo?: typeof insuranceRepo
  ) {
    this.liquidationRepo = customLiquidationRepo || liquidationRepo;
    this.positionRepo = customPositionRepo || positionRepo;
    this.accountRepo = customAccountRepo || accountRepo;
    this.insuranceRepo = customInsuranceRepo || insuranceRepo;
  }

  async getById(id: string): Promise<PerpLiquidation | null> {
    return this.liquidationRepo.findById(id);
  }

  async getByLiquidationNo(liquidationNo: string): Promise<PerpLiquidation | null> {
    return this.liquidationRepo.findByLiquidationNo(liquidationNo);
  }

  async list(params: PaginationParams & {
    userId?: string;
    symbol?: string;
    status?: string;
    adlTriggered?: boolean;
    startTime?: Date;
    endTime?: Date;
  }): Promise<PaginatedResult<PerpLiquidation>> {
    return this.liquidationRepo.paginate(params);
  }

  async getUserLiquidations(userId: string, symbol?: string, limit = 100): Promise<PerpLiquidation[]> {
    return this.liquidationRepo.findByUserId(userId, symbol, limit);
  }

  checkLiquidation(position: {
    positionQty: Prisma.Decimal | string;
    markPrice: Prisma.Decimal | string;
    liquidationPrice: Prisma.Decimal | string;
    side: string;
  }): boolean {
    const markPrice = new Prisma.Decimal(position.markPrice);
    const liqPrice = new Prisma.Decimal(position.liquidationPrice);

    if (position.side === 'long') {
      return markPrice.lte(liqPrice);
    } else {
      return markPrice.gte(liqPrice);
    }
  }

  async executeLiquidation(positionId: string, markPrice: Prisma.Decimal): Promise<PerpLiquidation> {
    const position = await this.positionRepo.findById(positionId);
    if (!position) throw new Error('Position not found');

    const liquidationNo = `LQ${Date.now()}${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const qty = new Prisma.Decimal(position.positionQty);
    const liquidationValue = qty.mul(markPrice);

    const liquidation = await this.liquidationRepo.create({
      liquidationNo,
      userId: position.userId,
      account: { connect: { id: position.accountId } },
      position: { connect: { id: position.id } },
      contract: { connect: { id: position.contractId } },
      symbol: position.symbol,
      side: position.side,
      liquidationQty: qty,
      liquidationPrice: markPrice,
      bankruptcyPrice: position.liquidationPrice,
      markPrice,
      liquidationValue,
      realizedPnl: position.unrealizedPnl,
      status: 'processing',
      reason: 'mark_price_hit_liquidation',
    });

    await this.positionRepo.setStatus(positionId, 'liquidating');

    return liquidation;
  }

  async completeLiquidation(
    id: string,
    insuranceFundUsed: Prisma.Decimal,
    adlTriggered: boolean = false
  ): Promise<PerpLiquidation> {
    const liquidation = await this.liquidationRepo.findById(id);
    if (!liquidation) throw new Error('Liquidation not found');

    if (insuranceFundUsed.gt(0)) {
      await this.insuranceRepo.useFund(liquidation.symbol, insuranceFundUsed);
    }

    await this.positionRepo.setStatus(liquidation.positionId, 'closed');

    return this.liquidationRepo.update(id, {
      status: 'completed',
      insuranceFundUsed,
      adlTriggered,
    });
  }
}

export const liquidationService = new LiquidationService();
