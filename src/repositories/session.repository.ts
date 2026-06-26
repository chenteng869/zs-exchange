import { BaseRepository, PaginationParams, PaginatedResult } from './base/base.repository';
import { Prisma } from '@prisma/client';

export class SessionRepository extends BaseRepository<
  Prisma.CoreSessionGetPayload<{}>,
  Prisma.CoreSessionCreateInput,
  Prisma.CoreSessionUpdateInput,
  Prisma.CoreSessionWhereInput
> {
  constructor() {
    super('coreSession');
  }

  async findByToken(token: string) {
    return this.model.findUnique({ where: { token } });
  }

  async findByRefreshToken(refreshToken: string) {
    return this.model.findUnique({ where: { refreshToken } });
  }

  async findByUserId(userId: string, pagination: PaginationParams): Promise<PaginatedResult<Prisma.CoreSessionGetPayload<{}>>> {
    return this.paginate(pagination, { userId } as any, {
      orderBy: { createdAt: 'desc' as const },
    });
  }

  async deleteByToken(token: string) {
    return this.model.delete({ where: { token } });
  }

  async deleteByUserId(userId: string) {
    return this.model.deleteMany({ where: { userId } });
  }

  async deleteExpired() {
    return this.model.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });
  }

  async revokeAllExcept(userId: string, sessionId: string) {
    return this.model.deleteMany({
      where: {
        userId,
        id: { not: sessionId },
      },
    });
  }
}

export const sessionRepository = new SessionRepository();
export default sessionRepository;