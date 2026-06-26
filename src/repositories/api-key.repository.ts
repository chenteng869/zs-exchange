import { BaseRepository, PaginationParams, PaginatedResult } from './base/base.repository';
import { Prisma } from '@prisma/client';

export class ApiKeyRepository extends BaseRepository<
  Prisma.CoreApiKeyGetPayload<{}>,
  Prisma.CoreApiKeyCreateInput,
  Prisma.CoreApiKeyUpdateInput,
  Prisma.CoreApiKeyWhereInput
> {
  constructor() {
    super('coreApiKey');
  }

  async findByApiKey(apiKey: string) {
    return this.model.findUnique({ where: { apiKey } });
  }

  async findByUserId(userId: string, pagination: PaginationParams): Promise<PaginatedResult<Prisma.CoreApiKeyGetPayload<{}>>> {
    return this.paginate(pagination, { userId } as any, {
      orderBy: { createdAt: 'desc' as const },
    });
  }

  async findActiveByUserId(userId: string) {
    return this.model.findMany({
      where: { userId, status: 'active' },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateLastUsedAt(id: string) {
    return this.model.update({
      where: { id },
      data: { lastUsedAt: new Date() },
    });
  }

  async rotateSecret(id: string, newSecretKey: string) {
    return this.model.update({
      where: { id },
      data: { secretKey: newSecretKey },
    });
  }

  async updateStatus(id: string, status: string) {
    return this.update(id, { status } as any);
  }

  async countByUserId(userId: string) {
    return this.model.count({ where: { userId } });
  }
}

export const apiKeyRepository = new ApiKeyRepository();
export default apiKeyRepository;