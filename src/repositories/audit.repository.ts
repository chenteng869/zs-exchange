import { BaseRepository, PaginationParams, PaginatedResult } from './base/base.repository';
import { Prisma } from '@prisma/client';

export class AuditLogRepository extends BaseRepository<
  Prisma.AuditLogGetPayload<{}>,
  Prisma.AuditLogCreateInput,
  Prisma.AuditLogUpdateInput,
  Prisma.AuditLogWhereInput
> {
  constructor() {
    super('auditLog');
  }

  async findByOperator(operatorId: string, pagination: PaginationParams): Promise<PaginatedResult<Prisma.AuditLogGetPayload<{}>>> {
    return this.paginate(pagination, { operatorId } as any, {
      orderBy: { createdAt: 'desc' as const },
    });
  }

  async findByModule(module: string, pagination: PaginationParams): Promise<PaginatedResult<Prisma.AuditLogGetPayload<{}>>> {
    return this.paginate(pagination, { module } as any, {
      orderBy: { createdAt: 'desc' as const },
    });
  }

  async findByAction(action: string, pagination: PaginationParams): Promise<PaginatedResult<Prisma.AuditLogGetPayload<{}>>> {
    return this.paginate(pagination, { action } as any, {
      orderBy: { createdAt: 'desc' as const },
    });
  }

  async findByTarget(targetType: string, targetId: string) {
    return this.model.findMany({
      where: { targetType, targetId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async search(filters: {
    operatorId?: string;
    module?: string;
    action?: string;
    status?: string;
    startTime?: Date;
    endTime?: Date;
  }, pagination: PaginationParams): Promise<PaginatedResult<Prisma.AuditLogGetPayload<{}>>> {
    const where: any = {};
    if (filters.operatorId) where.operatorId = filters.operatorId;
    if (filters.module) where.module = filters.module;
    if (filters.action) where.action = filters.action;
    if (filters.status) where.status = filters.status;
    if (filters.startTime || filters.endTime) {
      where.createdAt = {};
      if (filters.startTime) where.createdAt.gte = filters.startTime;
      if (filters.endTime) where.createdAt.lte = filters.endTime;
    }

    return this.paginate(pagination, where, {
      orderBy: { createdAt: 'desc' as const },
    });
  }

  async log(operatorId: string, operatorName: string, operatorRole: string, module: string, action: string, details?: string, targetId?: string, targetType?: string, ip?: string, userAgent?: string, status: string = 'success') {
    return this.model.create({
      data: {
        operatorId,
        operatorName,
        operatorRole,
        module,
        action,
        details,
        targetId,
        targetType,
        ipAddress: ip,
        userAgent,
        status,
      },
    });
  }

  async deleteOld(days: number = 90) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    return this.model.deleteMany({
      where: { createdAt: { lt: cutoffDate } },
    });
  }
}

export class AuditLoginLogRepository extends BaseRepository<
  Prisma.AuditLoginLogGetPayload<{}>,
  Prisma.AuditLoginLogCreateInput,
  Prisma.AuditLoginLogUpdateInput,
  Prisma.AuditLoginLogWhereInput
> {
  constructor() {
    super('auditLoginLog');
  }

  async findByUserId(userId: string, pagination: PaginationParams): Promise<PaginatedResult<Prisma.AuditLoginLogGetPayload<{}>>> {
    return this.paginate(pagination, { userId } as any, {
      orderBy: { createdAt: 'desc' as const },
    });
  }

  async findByIp(ipAddress: string, pagination: PaginationParams): Promise<PaginatedResult<Prisma.AuditLoginLogGetPayload<{}>>> {
    return this.paginate(pagination, { ipAddress } as any, {
      orderBy: { createdAt: 'desc' as const },
    });
  }

  async logSuccess(userId: string, username: string, ipAddress: string, userAgent?: string) {
    return this.model.create({
      data: {
        userId,
        username,
        ipAddress,
        userAgent,
        status: 'success',
        createdAt: new Date(),
      },
    });
  }

  async logFailure(username: string, ipAddress: string, errorMessage: string, userAgent?: string) {
    return this.model.create({
      data: {
        username,
        ipAddress,
        userAgent,
        status: 'failed',
        errorMessage,
        createdAt: new Date(),
      },
    });
  }

  async getRecentFailures(ipAddress: string, windowMinutes: number = 30): Promise<number> {
    const windowStart = new Date(Date.now() - windowMinutes * 60 * 1000);
    return this.model.count({
      where: {
        ipAddress,
        status: 'failed',
        createdAt: { gte: windowStart },
      },
    });
  }

  async deleteOld(days: number = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    return this.model.deleteMany({
      where: { createdAt: { lt: cutoffDate } },
    });
  }
}

export class AuditApiAccessLogRepository extends BaseRepository<
  Prisma.AuditApiAccessLogGetPayload<{}>,
  Prisma.AuditApiAccessLogCreateInput,
  Prisma.AuditApiAccessLogUpdateInput,
  Prisma.AuditApiAccessLogWhereInput
> {
  constructor() {
    super('auditApiAccessLog');
  }

  async findByUserId(userId: string, pagination: PaginationParams): Promise<PaginatedResult<Prisma.AuditApiAccessLogGetPayload<{}>>> {
    return this.paginate(pagination, { userId } as any, {
      orderBy: { createdAt: 'desc' as const },
    });
  }

  async findByApiKey(apiKeyId: string, pagination: PaginationParams): Promise<PaginatedResult<Prisma.AuditApiAccessLogGetPayload<{}>>> {
    return this.paginate(pagination, { apiKeyId } as any, {
      orderBy: { createdAt: 'desc' as const },
    });
  }

  async findByEndpoint(endpoint: string, pagination: PaginationParams): Promise<PaginatedResult<Prisma.AuditApiAccessLogGetPayload<{}>>> {
    return this.paginate(pagination, { endpoint } as any, {
      orderBy: { createdAt: 'desc' as const },
    });
  }

  async getStats(startTime: Date, endTime: Date) {
    const result = await this.model.aggregate({
      where: {
        createdAt: { gte: startTime, lte: endTime },
      },
      _count: true,
      _avg: { responseTime: true },
      _sum: { requestSize: true, responseSize: true },
    });

    const statusCodes = await this.model.groupBy({
      by: ['statusCode'],
      where: {
        createdAt: { gte: startTime, lte: endTime },
      },
      _count: true,
    });

    return {
      totalRequests: result._count,
      avgResponseTime: result._avg.responseTime || 0,
      totalRequestSize: result._sum.requestSize || 0,
      totalResponseSize: result._sum.responseSize || 0,
      statusCodes,
    };
  }

  async deleteOld(days: number = 7) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    return this.model.deleteMany({
      where: { createdAt: { lt: cutoffDate } },
    });
  }
}

export const auditLogRepository = new AuditLogRepository();
export const auditLoginLogRepository = new AuditLoginLogRepository();
export const auditApiAccessLogRepository = new AuditApiAccessLogRepository();
export default auditLogRepository;
