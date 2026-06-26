import { BaseRepository, PaginationParams, PaginatedResult } from './base/base.repository';
import { Prisma } from '@prisma/client';

export class AiModelRepository extends BaseRepository<
  Prisma.AiModelGetPayload<{}>,
  Prisma.AiModelCreateInput,
  Prisma.AiModelUpdateInput,
  Prisma.AiModelWhereInput
> {
  constructor() {
    super('aiModel');
  }

  async findByName(name: string) {
    return this.model.findUnique({ where: { name } });
  }

  async findEnabled(): Promise<Prisma.AiModelGetPayload<{}>[]> {
    return this.model.findMany({
      where: { enabled: true },
      orderBy: { priority: 'asc' },
    });
  }

  async findByProvider(provider: string) {
    return this.model.findMany({
      where: { provider, enabled: true },
      orderBy: { priority: 'asc' },
    });
  }

  async getFirstEnabled() {
    return this.model.findFirst({
      where: { enabled: true },
      orderBy: { priority: 'asc' },
    });
  }
}

export class AiCompletionRepository extends BaseRepository<
  Prisma.AiCompletionGetPayload<{}>,
  Prisma.AiCompletionCreateInput,
  Prisma.AiCompletionUpdateInput,
  Prisma.AiCompletionWhereInput
> {
  constructor() {
    super('aiCompletion');
  }

  async findByUserId(userId: string, pagination: PaginationParams): Promise<PaginatedResult<Prisma.AiCompletionGetPayload<{}>>> {
    return this.paginate(pagination, { userId } as any, {
      orderBy: { createdAt: 'desc' as const },
    });
  }

  async findByModel(modelId: string, pagination: PaginationParams): Promise<PaginatedResult<Prisma.AiCompletionGetPayload<{}>>> {
    return this.paginate(pagination, { modelId } as any, {
      orderBy: { createdAt: 'desc' as const },
    });
  }

  async getUsageStats(userId: string, startTime: Date, endTime: Date) {
    const result = await this.model.aggregate({
      where: {
        userId,
        createdAt: { gte: startTime, lte: endTime },
        status: 'completed',
      },
      _sum: {
        promptTokens: true,
        completionTokens: true,
        totalTokens: true,
        cost: true,
      },
      _count: true,
    });
    return {
      totalRequests: result._count,
      promptTokens: result._sum.promptTokens || 0,
      completionTokens: result._sum.completionTokens || 0,
      totalTokens: result._sum.totalTokens || 0,
      totalCost: result._sum.cost || 0,
    };
  }
}

export class AiAgentRepository extends BaseRepository<
  Prisma.AiAgentGetPayload<{}>,
  Prisma.AiAgentCreateInput,
  Prisma.AiAgentUpdateInput,
  Prisma.AiAgentWhereInput
> {
  constructor() {
    super('aiAgent');
  }

  async findByName(name: string) {
    return this.model.findUnique({ where: { name } });
  }

  async findEnabled(): Promise<Prisma.AiAgentGetPayload<{}>[]> {
    return this.model.findMany({
      where: { enabled: true },
      include: { model: true },
      orderBy: { createdAt: 'desc' },
    });
  }
}

export class AiAnalysisRepository extends BaseRepository<
  Prisma.AiAnalysisGetPayload<{}>,
  Prisma.AiAnalysisCreateInput,
  Prisma.AiAnalysisUpdateInput,
  Prisma.AiAnalysisWhereInput
> {
  constructor() {
    super('aiAnalysis');
  }

  async findByType(type: string, pagination: PaginationParams): Promise<PaginatedResult<Prisma.AiAnalysisGetPayload<{}>>> {
    return this.paginate(pagination, { type } as any, {
      orderBy: { createdAt: 'desc' as const },
    });
  }

  async findByUser(userId: string, type?: string) {
    const where: any = { userId };
    if (type) where.type = type;

    return this.model.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async getLatest(type: string) {
    return this.model.findFirst({
      where: { type },
      orderBy: { createdAt: 'desc' },
    });
  }
}

export const aiModelRepository = new AiModelRepository();
export const aiCompletionRepository = new AiCompletionRepository();
export const aiAgentRepository = new AiAgentRepository();
export const aiAnalysisRepository = new AiAnalysisRepository();
export default aiModelRepository;