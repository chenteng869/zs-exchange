import { PrismaClient, Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';

export interface PaginationParams {
  page?: number;
  pageSize?: number;
}

export interface PaginatedResult<T> {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
}

export abstract class BaseRepository<T, CreateInput, UpdateInput, WhereInput> {
  protected prisma: PrismaClient;
  protected modelName: string;

  constructor(modelName: string) {
    this.prisma = prisma;
    this.modelName = modelName;
  }

  protected get model() {
    return (this.prisma as any)[this.modelName];
  }

  async findById(id: string): Promise<T | null> {
    return this.model.findUnique({ where: { id } as any });
  }

  async findOne(where: WhereInput): Promise<T | null> {
    return this.model.findUnique({ where });
  }

  async findMany(where?: WhereInput, options?: {
    orderBy?: any;
    skip?: number;
    take?: number;
    include?: any;
    select?: any;
  }): Promise<T[]> {
    return this.model.findMany({
      where,
      ...options,
    });
  }

  async paginate(
    params: PaginationParams,
    where?: WhereInput,
    options?: {
      orderBy?: any;
      include?: any;
      select?: any;
    },
  ): Promise<PaginatedResult<T>> {
    const page = params.page || 1;
    const pageSize = params.pageSize || 20;
    const skip = (page - 1) * pageSize;

    const [list, total] = await Promise.all([
      this.model.findMany({
        where,
        skip,
        take: pageSize,
        ...options,
      }),
      this.model.count({ where }),
    ]);

    return {
      list,
      total,
      page,
      pageSize,
    };
  }

  async create(data: CreateInput): Promise<T> {
    return this.model.create({ data });
  }

  async createMany(data: CreateInput[]): Promise<{ count: number }> {
    return this.model.createMany({ data });
  }

  async update(id: string, data: UpdateInput): Promise<T> {
    return this.model.update({ where: { id }, data });
  }

  async updateMany(where: WhereInput, data: UpdateInput): Promise<{ count: number }> {
    return this.model.updateMany({ where, data });
  }

  async upsert(where: WhereInput, create: CreateInput, update: UpdateInput): Promise<T> {
    return this.model.upsert({ where, create, update });
  }

  async delete(id: string): Promise<T> {
    return this.model.delete({ where: { id } });
  }

  async deleteMany(where: WhereInput): Promise<{ count: number }> {
    return this.model.deleteMany({ where });
  }

  async count(where?: WhereInput): Promise<number> {
    return this.model.count({ where });
  }

  async exists(where: WhereInput): Promise<boolean> {
    const count = await this.model.count({ where });
    return count > 0;
  }
}

export default BaseRepository;