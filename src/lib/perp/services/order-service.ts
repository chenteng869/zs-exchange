import { PerpOrder, Prisma } from '@prisma/client';
import { orderRepo, positionRepo, accountRepo, contractRepo } from '../repos';
import { PaginationParams, PaginatedResult } from '../repos/base-repo';

export class OrderService {
  private orderRepo: typeof orderRepo;
  private positionRepo: typeof positionRepo;
  private accountRepo: typeof accountRepo;
  private contractRepo: typeof contractRepo;

  constructor(
    customOrderRepo?: typeof orderRepo,
    customPositionRepo?: typeof positionRepo,
    customAccountRepo?: typeof accountRepo,
    customContractRepo?: typeof contractRepo
  ) {
    this.orderRepo = customOrderRepo || orderRepo;
    this.positionRepo = customPositionRepo || positionRepo;
    this.accountRepo = customAccountRepo || accountRepo;
    this.contractRepo = customContractRepo || contractRepo;
  }

  async getById(id: string): Promise<PerpOrder | null> {
    return this.orderRepo.findById(id);
  }

  async getByOrderNo(orderNo: string): Promise<PerpOrder | null> {
    return this.orderRepo.findByOrderNo(orderNo);
  }

  async list(params: PaginationParams & {
    userId?: string;
    symbol?: string;
    side?: string;
    orderType?: string;
    status?: string;
    marginMode?: string;
  }): Promise<PaginatedResult<PerpOrder>> {
    return this.orderRepo.paginate(params);
  }

  async getUserOrders(userId: string, symbol?: string, status?: string): Promise<PerpOrder[]> {
    return this.orderRepo.findByUserId(userId, symbol, status);
  }

  async getOpenOrders(symbol: string, limit = 500): Promise<PerpOrder[]> {
    return this.orderRepo.findOpenOrdersBySymbol(symbol, limit);
  }

  async countOpenOrders(userId: string, symbol?: string): Promise<number> {
    return this.orderRepo.countOpenOrdersByUser(userId, symbol);
  }

  async placeOrder(data: Prisma.PerpOrderCreateInput): Promise<PerpOrder> {
    const orderNo = `PO${Date.now()}${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    return this.orderRepo.create({ ...data, orderNo });
  }

  async cancelOrder(id: string): Promise<PerpOrder> {
    return this.orderRepo.cancel(id);
  }

  async fillOrder(id: string, filledQty: Prisma.Decimal, avgFillPrice: Prisma.Decimal): Promise<PerpOrder> {
    return this.orderRepo.fill(id, filledQty, avgFillPrice);
  }

  async setStatus(id: string, status: string): Promise<PerpOrder> {
    return this.orderRepo.setStatus(id, status);
  }

  async validateOrder(data: {
    userId: string;
    symbol: string;
    side: string;
    qty: Prisma.Decimal;
    price?: Prisma.Decimal;
    leverage: number;
    marginMode: string;
    orderType: string;
  }): Promise<{ valid: boolean; reason?: string }> {
    const contract = await this.contractRepo.findBySymbol(data.symbol);
    if (!contract) return { valid: false, reason: 'Contract not found' };
    if (contract.status !== 'active') return { valid: false, reason: 'Contract inactive' };

    if (data.leverage < 1 || data.leverage > contract.maxLeverage) {
      return { valid: false, reason: 'Invalid leverage' };
    }

    if (data.qty.lt(contract.minOrderQty) || data.qty.gt(contract.maxOrderQty)) {
      return { valid: false, reason: 'Invalid quantity' };
    }

    return { valid: true };
  }
}

export const orderService = new OrderService();
