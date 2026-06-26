import { BaseRepository, PaginationParams, PaginatedResult } from './base/base.repository';
import { Prisma } from '@prisma/client';

export class KycApplicationRepository extends BaseRepository<
  Prisma.KycApplicationGetPayload<{}>,
  Prisma.KycApplicationCreateInput,
  Prisma.KycApplicationUpdateInput,
  Prisma.KycApplicationWhereInput
> {
  constructor() {
    super('kycApplication');
  }

  async findByUserId(userId: string) {
    return this.model.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findLatestByUserId(userId: string) {
    return this.model.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByStatus(status: string, pagination: PaginationParams): Promise<PaginatedResult<Prisma.KycApplicationGetPayload<{}>>> {
    return this.paginate(pagination, { status } as any, {
      orderBy: { createdAt: 'asc' as const },
    });
  }

  async findPending(pagination: PaginationParams): Promise<PaginatedResult<Prisma.KycApplicationGetPayload<{}>>> {
    return this.findByStatus('pending', pagination);
  }

  async updateStatus(id: string, status: string, reviewedBy: string, reviewNotes?: string) {
    return this.update(id, {
      status,
      reviewedBy,
      reviewNotes,
      reviewedAt: new Date(),
    } as any);
  }

  async approve(id: string, reviewedBy: string, reviewNotes?: string) {
    return this.updateStatus(id, 'approved', reviewedBy, reviewNotes);
  }

  async reject(id: string, reviewedBy: string, reviewNotes: string) {
    return this.updateStatus(id, 'rejected', reviewedBy, reviewNotes);
  }

  async getStats() {
    const [total, pending, approved, rejected] = await Promise.all([
      this.model.count(),
      this.model.count({ where: { status: 'pending' } }),
      this.model.count({ where: { status: 'approved' } }),
      this.model.count({ where: { status: 'rejected' } }),
    ]);
    return { total, pending, approved, rejected };
  }
}

export class KycRiskAssessmentRepository extends BaseRepository<
  Prisma.KycRiskAssessmentGetPayload<{}>,
  Prisma.KycRiskAssessmentCreateInput,
  Prisma.KycRiskAssessmentUpdateInput,
  Prisma.KycRiskAssessmentWhereInput
> {
  constructor() {
    super('kycRiskAssessment');
  }

  async findByUserId(userId: string) {
    return this.model.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findLatestByUserId(userId: string) {
    return this.model.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByLevel(level: string) {
    return this.model.findMany({
      where: { level },
      orderBy: { createdAt: 'desc' },
    });
  }
}

export class KycComplianceFreezeRepository extends BaseRepository<
  Prisma.KycComplianceFreezeGetPayload<{}>,
  Prisma.KycComplianceFreezeCreateInput,
  Prisma.KycComplianceFreezeUpdateInput,
  Prisma.KycComplianceFreezeWhereInput
> {
  constructor() {
    super('kycComplianceFreeze');
  }

  async findByUserId(userId: string) {
    return this.model.findMany({
      where: { userId },
      orderBy: { frozenAt: 'desc' },
    });
  }

  async findActiveByUserId(userId: string) {
    return this.model.findMany({
      where: { userId, status: 'active' },
      orderBy: { frozenAt: 'desc' },
    });
  }

  async hasActiveFreeze(userId: string): Promise<boolean> {
    const count = await this.model.count({
      where: { userId, status: 'active' },
    });
    return count > 0;
  }

  async unfreeze(id: string, unfrozenBy: string) {
    return this.update(id, {
      status: 'unfrozen',
      unfrozenAt: new Date(),
      frozenBy: unfrozenBy,
    } as any);
  }

  async freeze(userId: string, type: string, reason: string, frozenBy: string) {
    return this.model.create({
      data: {
        userId,
        type,
        reason,
        frozenBy,
      },
    });
  }
}

export const kycApplicationRepository = new KycApplicationRepository();
export const kycRiskAssessmentRepository = new KycRiskAssessmentRepository();
export const kycComplianceFreezeRepository = new KycComplianceFreezeRepository();
export default kycApplicationRepository;