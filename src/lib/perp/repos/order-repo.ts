import { PerpOrder, Prisma } from '@prisma/client';
import { BaseRepository, PaginationParams, PaginatedResult, buildPagination, toPaginatedResult } from './base-repo';

export class OrderRepository extends BaseRepository {
  async findById(id: string): Promise<PerpOrder | null> {
    return this.prisma.perpOrder.findUnique({ where: { id } });
  }

  async findByOrderNo(orderNo: string): Promise<PerpOrder | null> {
    return this.prisma.perpOrder.findUnique({ where: { orderNo } });
  }

  async findByClientOrderId(userId: string, clientOrderId: string): Promise<PerpOrder | null> {
    return this.prisma.perpOrder.findFirst({ where: { userId, clientOrderId } });
  }

  async findByUserId(userId: string, symbol?: string, status?: string): Promise<PerpOrder[]> {
    const where: Prisma.PerpOrderWhereInput = { userId };
    if (symbol) where.symbol = symbol;
    if (status) where.status = status;
    return this.prisma.perpOrder.findMany({ where, orderBy: { createdAt: 'desc' }, take: 100 });
  }

  async paginate(params: PaginationParams & {
    userId?: string;
    symbol?: string;
    side?: string;
    orderType?: string;
    status?: string;
    marginMode?: string;
  }): Promise<PaginatedResult<PerpOrder>> {
    const { skip, take, page, pageSize } = buildPagination(params);
    const where: Prisma.PerpOrderWhereInput = {};
    if (params.userId) where.userId = params.userId;
    if (params.symbol) where.symbol = params.symbol;
    if (params.side) where.side = params.side;
    if (params.orderType) where.orderType = params.orderType;
    if (params.status) where.status = params.status;
    if (params.marginMode) where.marginMode = params.marginMode;

    const [items, total] = await Promise.all([
      this.prisma.perpOrder.findMany({ where, skip, take, orderBy: { createdAt: 'desc' } }),
      this.prisma.perpOrder.count({ where }),
    ]);

    return toPaginatedResult(items, total, page, pageSize);
  }

  async create(data: Prisma.PerpOrderCreateInput, tx?: Prisma.TransactionClient): Promise<PerpOrder> {
    const client = tx || this.prisma;
    return client.perpOrder.create({ data });
  }

  async update(id: string, data: Prisma.PerpOrderUpdateInput): Promise<PerpOrder> {
    return this.prisma.perpOrder.update({ where: { id }, data });
  }

  async setStatus(id: string, status: string): Promise<PerpOrder> {
    return this.update(id, { status });
  }

  async cancel(id: string): Promise<PerpOrder> {
    return this.update(id, { status: 'canceled', canceledAt: new Date() });
  }

  async fill(id: string, filledQty: Prisma.Decimal, avgFillPrice: Prisma.Decimal): Promise<PerpOrder> {
    return this.update(id, { filledQty, avgFillPrice, status: 'filled' });
  }

  async findOpenOrdersBySymbol(symbol: string, limit = 500): Promise<PerpOrder[]> {
    return this.prisma.perpOrder.findMany({
      where: { symbol, status: { in: ['pending', 'open', 'partial'] } },
      orderBy: { createdAt: 'asc' },
      take: limit,
    });
  }

  async countOpenOrdersByUser(userId: string, symbol?: string): Promise<number> {
    const where: Prisma.PerpOrderWhereInput = {
      userId,
      status: { in: ['pending', 'open', 'partial'] },
    };
    if (symbol) where.symbol = symbol;
    return this.prisma.perpOrder.count({ where });
  }
}

export const orderRepo = new OrderRepository();
