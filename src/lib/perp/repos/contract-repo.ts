import { PerpContract, Prisma } from '@prisma/client';
import { BaseRepository, PaginationParams, PaginatedResult, buildPagination, toPaginatedResult } from './base-repo';

export class ContractRepository extends BaseRepository {
  async findById(id: string): Promise<PerpContract | null> {
    return this.prisma.perpContract.findUnique({ where: { id } });
  }

  async findBySymbol(symbol: string): Promise<PerpContract | null> {
    return this.prisma.perpContract.findUnique({ where: { symbol } });
  }

  async findAllActive(): Promise<PerpContract[]> {
    return this.prisma.perpContract.findMany({
      where: { status: 'active' },
      orderBy: { symbol: 'asc' },
    });
  }

  async paginate(params: PaginationParams & { status?: string; symbol?: string }): Promise<PaginatedResult<PerpContract>> {
    const { skip, take, page, pageSize } = buildPagination(params);
    const where: Prisma.PerpContractWhereInput = {};
    if (params.status) where.status = params.status;
    if (params.symbol) where.symbol = { contains: params.symbol };

    const [items, total] = await Promise.all([
      this.prisma.perpContract.findMany({ where, skip, take, orderBy: { createdAt: 'desc' } }),
      this.prisma.perpContract.count({ where }),
    ]);

    return toPaginatedResult(items, total, page, pageSize);
  }

  async create(data: Prisma.PerpContractCreateInput): Promise<PerpContract> {
    return this.prisma.perpContract.create({ data });
  }

  async update(id: string, data: Prisma.PerpContractUpdateInput): Promise<PerpContract> {
    return this.prisma.perpContract.update({ where: { id }, data });
  }

  async updateBySymbol(symbol: string, data: Prisma.PerpContractUpdateInput): Promise<PerpContract> {
    return this.prisma.perpContract.update({ where: { symbol }, data });
  }

  async setStatus(id: string, status: string): Promise<PerpContract> {
    return this.update(id, { status });
  }
}

export const contractRepo = new ContractRepository();
