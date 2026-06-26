import { BaseRepository, PaginationParams, PaginatedResult } from './base/base.repository';
import { Prisma } from '@prisma/client';

export class NotificationRepository extends BaseRepository<
  Prisma.CoreNotificationGetPayload<{}>,
  Prisma.CoreNotificationCreateInput,
  Prisma.CoreNotificationUpdateInput,
  Prisma.CoreNotificationWhereInput
> {
  constructor() {
    super('coreNotification');
  }

  async findByUserId(userId: string, pagination: PaginationParams): Promise<PaginatedResult<Prisma.CoreNotificationGetPayload<{}>>> {
    return this.paginate(pagination, { userId } as any, {
      orderBy: { createdAt: 'desc' as const },
    });
  }

  async findUnreadByUserId(userId: string, pagination: PaginationParams): Promise<PaginatedResult<Prisma.CoreNotificationGetPayload<{}>>> {
    return this.paginate(pagination, { userId, read: false } as any, {
      orderBy: { createdAt: 'desc' as const },
    });
  }

  async countUnread(userId: string): Promise<number> {
    return this.model.count({ where: { userId, read: false } });
  }

  async markAsRead(id: string) {
    return this.update(id, { read: true, readAt: new Date() } as any);
  }

  async markAllAsRead(userId: string) {
    return this.model.updateMany({
      where: { userId, read: false },
      data: { read: true, readAt: new Date() },
    });
  }

  async createManyForUsers(userIds: string[], data: Omit<Prisma.CoreNotificationCreateInput, 'userId'>) {
    const notifications = userIds.map(userId => ({
      ...data,
      userId,
    }));
    return this.model.createMany({ data: notifications });
  }

  async deleteOld(userId: string, days: number = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    return this.model.deleteMany({
      where: { userId, createdAt: { lt: cutoffDate } },
    });
  }
}

export const notificationRepository = new NotificationRepository();
export default notificationRepository;