import { PerpAuditLog, Prisma } from '@prisma/client';
import { BaseRepository, PaginationParams, PaginatedResult, buildPagination, toPaginatedResult } from './base-repo';

export class AuditRepository extends BaseRepository {
  async findById(id: string): Promise<PerpAuditLog | null> {
    return this.prisma.perpAuditLog.findUnique({ where: { id } });
  }

  async paginate(params: PaginationParams & {
    operatorId?: string;
    module?: string;
    action?: string;
    targetType?: string;
    startTime?: Date;
    endTime?: Date;
  }): Promise<PaginatedResult<PerpAuditLog>> {
    const { skip, take, page, pageSize } = buildPagination(params);
    const where: Prisma.PerpAuditLogWhereInput = {};
    if (params.operatorId) where.operatorId = params.operatorId;
    if (params.module) where.module = params.module;
    if (params.action) where.action = params.action;
    if (params.targetType) where.targetType = params.targetType;
    if (params.startTime || params.endTime) {
      where.createdAt = {};
      if (params.startTime) where.createdAt.gte = params.startTime;
      if (params.endTime) where.createdAt.lte = params.endTime;
    }

    const [items, total] = await Promise.all([
      this.prisma.perpAuditLog.findMany({ where, skip, take, orderBy: { createdAt: 'desc' } }),
      this.prisma.perpAuditLog.count({ where }),
    ]);

    return toPaginatedResult(items, total, page, pageSize);
  }

  async create(data: Prisma.PerpAuditLogCreateInput): Promise<PerpAuditLog> {
    return this.prisma.perpAuditLog.create({ data });
  }

  async log(
    operatorId: string,
    operatorName: string,
    module: string,
    action: string,
    status: string,
    options: {
      details?: string;
      targetId?: string;
      targetType?: string;
      ipAddress?: string;
      userAgent?: string;
    } = {}
  ): Promise<PerpAuditLog> {
    return this.create({
      operatorId,
      operatorName,
      module,
      action,
      status,
      details: options.details,
      targetId: options.targetId,
      targetType: options.targetType,
      ipAddress: options.ipAddress,
      userAgent: options.userAgent,
    });
  }
}

export const auditRepo = new AuditRepository();
