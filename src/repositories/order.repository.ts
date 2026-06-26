import { BaseRepository, PaginationParams, PaginatedResult } from './base/base.repository';
import { Prisma } from '@prisma/client';

export class OrderRepository extends BaseRepository<
  Prisma.TradeOrderGetPayload<{}>,
  Prisma.TradeOrderCreateInput,
  Prisma.TradeOrderUpdateInput,
  Prisma.TradeOrderWhereInput
> {
  constructor() {
    super('tradeOrder');
  }

  async findByUserId(userId: string, pagination: PaginationParams, filters?: {
    symbol?: string;
    side?: string;
    status?: string;
    type?: string;
  }): Promise<PaginatedResult<Prisma.TradeOrderGetPayload<{}>>> {
    const where: any = { userId };
    if (filters?.symbol) where.symbol = filters.symbol;
    if (filters?.side) where.side = filters.side;
    if (filters?.status) where.status = filters.status;
    if (filters?.type) where.type = filters.type;

    return this.paginate(pagination, where, {
      orderBy: { createdAt: 'desc' as const },
    });
  }

  async findActiveOrders(userId: string, symbol?: string) {
    const where: any = {
      userId,
      status: { in: ['pending', 'open', 'partial'] },
    };
    if (symbol) where.symbol = symbol;

    return this.model.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOrderHistory(userId: string, pagination: PaginationParams, symbol?: string): Promise<PaginatedResult<Prisma.TradeOrderGetPayload<{}>>> {
    const where: any = {
      userId,
      status: { in: ['filled', 'cancelled', 'rejected', 'expired'] },
    };
    if (symbol) where.symbol = symbol;

    return this.paginate(pagination, where, {
      orderBy: { createdAt: 'desc' as const },
    });
  }

  async findByClientOrderId(userId: string, clientOrderId: string) {
    return this.model.findFirst({
      where: { userId, clientOrderId },
    });
  }

  async findOpenOrdersBySymbol(symbol: string) {
    return this.model.findMany({
      where: {
        symbol,
        status: { in: ['pending', 'open', 'partial'] },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async updateStatus(id: string, status: string, closedAt?: Date) {
    return this.update(id, { status, closedAt: closedAt || new Date() } as any);
  }

  async fillOrder(id: string, filledAmount: number, executedValue: number, fee: number) {
    return this.model.update({
      where: { id },
      data: {
        filledAmount: { increment: filledAmount },
        remainingAmount: { decrement: filledAmount },
        executedValue: { increment: executedValue },
        fee: { increment: fee },
      },
    });
  }

  async cancelAllOpenOrders(userId: string, symbol?: string) {
    const where: any = {
      userId,
      status: { in: ['pending', 'open', 'partial'] },
    };
    if (symbol) where.symbol = symbol;

    return this.model.updateMany({
      where,
      data: { status: 'cancelled', closedAt: new Date() },
    });
  }
}

export const orderRepository = new OrderRepository();
export default orderRepository;