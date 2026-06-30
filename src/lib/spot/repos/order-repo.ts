import { SpotOrder, Prisma, SpotOrderStatus, SpotOrderSide, SpotOrderType } from '@prisma/client';
import { BaseRepository, PaginationParams, PaginatedResult, buildPagination, toPaginatedResult } from './base-repo';

export class SpotOrderRepository extends BaseRepository {
  async findById(id: string): Promise<SpotOrder | null> {
    return this.prisma.spotOrder.findUnique({ where: { id } });
  }

  async findByOrderNo(orderNo: string): Promise<SpotOrder | null> {
    return this.prisma.spotOrder.findUnique({ where: { orderNo } });
  }

  async findByClientOrderId(clientOrderId: string): Promise<SpotOrder | null> {
    return this.prisma.spotOrder.findFirst({ where: { clientOrderId } });
  }

  async findByUserId(userId: string): Promise<SpotOrder[]> {
    return this.prisma.spotOrder.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByUserIdAndMarket(userId: string, marketSymbol: string): Promise<SpotOrder[]> {
    return this.prisma.spotOrder.findMany({
      where: { userId, marketSymbol },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOpenOrdersByUserId(userId: string): Promise<SpotOrder[]> {
    return this.prisma.spotOrder.findMany({
      where: {
        userId,
        status: { in: [SpotOrderStatus.open, SpotOrderStatus.partially_filled] },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOpenOrdersByMarket(marketId: bigint): Promise<SpotOrder[]> {
    return this.prisma.spotOrder.findMany({
      where: {
        marketId,
        status: { in: [SpotOrderStatus.open, SpotOrderStatus.partially_filled] },
      },
      orderBy: { price: 'asc' },
    });
  }

  async paginate(params: PaginationParams & {
    userId?: string;
    marketSymbol?: string;
    status?: SpotOrderStatus;
    side?: SpotOrderSide;
    orderType?: SpotOrderType;
  }): Promise<PaginatedResult<SpotOrder>> {
    const { skip, take, page, pageSize } = buildPagination(params);
    const where: Prisma.SpotOrderWhereInput = {};
    if (params.userId) where.userId = params.userId;
    if (params.marketSymbol) where.marketSymbol = params.marketSymbol;
    if (params.status) where.status = params.status;
    if (params.side) where.side = params.side;
    if (params.orderType) where.orderType = params.orderType;

    const [items, total] = await Promise.all([
      this.prisma.spotOrder.findMany({ where, skip, take, orderBy: { createdAt: 'desc' } }),
      this.prisma.spotOrder.count({ where }),
    ]);

    return toPaginatedResult(items, total, page, pageSize);
  }

  async create(data: Prisma.SpotOrderCreateInput): Promise<SpotOrder> {
    return this.prisma.spotOrder.create({ data });
  }

  async update(id: string, data: Prisma.SpotOrderUpdateInput): Promise<SpotOrder> {
    return this.prisma.spotOrder.update({ where: { id }, data });
  }

  async updateByOrderNo(orderNo: string, data: Prisma.SpotOrderUpdateInput): Promise<SpotOrder> {
    return this.prisma.spotOrder.update({ where: { orderNo }, data });
  }

  async updateStatus(id: string, status: SpotOrderStatus): Promise<SpotOrder> {
    return this.update(id, { status });
  }

  async updateFilled(orderNo: string, filledQuantity: Prisma.Decimal, executedValue: Prisma.Decimal, remainingQuantity: Prisma.Decimal): Promise<SpotOrder> {
    return this.prisma.spotOrder.update({
      where: { orderNo },
      data: { filledQuantity, executedValue, remainingQuantity },
    });
  }

  async addFilled(orderNo: string, filledQuantity: Prisma.Decimal, executedValue: Prisma.Decimal): Promise<SpotOrder> {
    return this.prisma.spotOrder.update({
      where: { orderNo },
      data: {
        filledQuantity: { increment: filledQuantity },
        executedValue: { increment: executedValue },
        remainingQuantity: { decrement: filledQuantity },
      },
    });
  }

  async addFee(orderNo: string, fee: Prisma.Decimal): Promise<SpotOrder> {
    return this.prisma.spotOrder.update({
      where: { orderNo },
      data: { fee: { increment: fee } },
    });
  }

  async cancel(id: string): Promise<SpotOrder> {
    return this.prisma.spotOrder.update({
      where: { id },
      data: { status: SpotOrderStatus.canceled, canceledAt: new Date() },
    });
  }

  async expire(id: string): Promise<SpotOrder> {
    return this.prisma.spotOrder.update({
      where: { id },
      data: { status: SpotOrderStatus.expired, expiredAt: new Date() },
    });
  }

  async delete(id: string): Promise<SpotOrder> {
    return this.prisma.spotOrder.delete({ where: { id } });
  }
}

export const spotOrderRepo = new SpotOrderRepository();