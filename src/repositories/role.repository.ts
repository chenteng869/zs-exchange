import { BaseRepository, PaginationParams, PaginatedResult } from './base/base.repository';
import { Prisma } from '@prisma/client';

export class RoleRepository extends BaseRepository<
  Prisma.CoreRoleGetPayload<{}>,
  Prisma.CoreRoleCreateInput,
  Prisma.CoreRoleUpdateInput,
  Prisma.CoreRoleWhereInput
> {
  constructor() {
    super('coreRole');
  }

  async findByName(name: string) {
    return this.model.findUnique({ where: { name } });
  }

  async findAll(): Promise<Prisma.CoreRoleGetPayload<{}>[]> {
    return this.model.findMany({ orderBy: { createdAt: 'asc' } });
  }
}

export class UserRoleRepository extends BaseRepository<
  Prisma.CoreUserRoleGetPayload<{}>,
  Prisma.CoreUserRoleCreateInput,
  Prisma.CoreUserRoleUpdateInput,
  Prisma.CoreUserRoleWhereInput
> {
  constructor() {
    super('coreUserRole');
  }

  async findByUserId(userId: string) {
    return this.model.findMany({
      where: { userId },
      include: { role: true },
    });
  }

  async findByRoleId(roleId: string) {
    return this.model.findMany({
      where: { roleId },
      include: { user: true },
    });
  }

  async assignRole(userId: string, roleId: string) {
    return this.model.upsert({
      where: { userId_roleId: { userId, roleId } } as any,
      create: { userId, roleId },
      update: {},
    });
  }

  async removeRole(userId: string, roleId: string) {
    return this.model.deleteMany({
      where: { userId, roleId },
    });
  }

  async removeAllRoles(userId: string) {
    return this.model.deleteMany({ where: { userId } });
  }
}

export const roleRepository = new RoleRepository();
export const userRoleRepository = new UserRoleRepository();
export default roleRepository;