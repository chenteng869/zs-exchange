import { BaseRepository, PaginationParams, PaginatedResult } from './base/base.repository';
import { Prisma } from '@prisma/client';

export class UserRepository extends BaseRepository<
  Prisma.CoreUserGetPayload<{}>,
  Prisma.CoreUserCreateInput,
  Prisma.CoreUserUpdateInput,
  Prisma.CoreUserWhereInput
> {
  constructor() {
    super('coreUser');
  }

  async findByUsername(username: string) {
    return this.model.findUnique({ where: { username } });
  }

  async findByEmail(email: string) {
    return this.model.findUnique({ where: { email } });
  }

  async findByReferralCode(referralCode: string) {
    return this.model.findUnique({ where: { referralCode } });
  }

  async findByUsernameOrEmail(identifier: string) {
    return this.model.findFirst({
      where: {
        OR: [{ username: identifier }, { email: identifier }],
      },
    });
  }

  async searchUsers(
    keyword: string,
    pagination: PaginationParams,
  ): Promise<PaginatedResult<Prisma.CoreUserGetPayload<{}>>> {
    const where = {
      OR: [
        { username: { contains: keyword, mode: 'insensitive' as const } },
        { email: { contains: keyword, mode: 'insensitive' as const } },
        { phone: { contains: keyword, mode: 'insensitive' as const } },
      ],
    };
    return this.paginate(pagination, where as any, {
      orderBy: { createdAt: 'desc' as const },
    });
  }

  async updateStatus(id: string, status: string) {
    return this.update(id, { status } as any);
  }

  async incrementApiKeyCount(id: string) {
    return this.model.update({
      where: { id },
      data: { apiKeyCount: { increment: 1 } },
    });
  }

  async decrementApiKeyCount(id: string) {
    return this.model.update({
      where: { id },
      data: { apiKeyCount: { decrement: 1 } },
    });
  }
}

export const userRepository = new UserRepository();
export default userRepository;