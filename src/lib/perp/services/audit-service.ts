import { PerpAuditLog, Prisma } from '@prisma/client';
import { auditRepo } from '../repos';
import { PaginationParams, PaginatedResult } from '../repos/base-repo';

export class AuditService {
  private repo: typeof auditRepo;

  constructor(customRepo?: typeof auditRepo) {
    this.repo = customRepo || auditRepo;
  }

  async getById(id: string): Promise<PerpAuditLog | null> {
    return this.repo.findById(id);
  }

  async list(params: PaginationParams & {
    operatorId?: string;
    module?: string;
    action?: string;
    targetType?: string;
    startTime?: Date;
    endTime?: Date;
  }): Promise<PaginatedResult<PerpAuditLog>> {
    return this.repo.paginate(params);
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
    return this.repo.log(operatorId, operatorName, module, action, status, options);
  }

  async logContractChange(
    operatorId: string,
    operatorName: string,
    action: string,
    contractId: string,
    details: string,
    status: string = 'success',
    ip?: string
  ): Promise<PerpAuditLog> {
    return this.log(operatorId, operatorName, 'contract', action, status, {
      details,
      targetId: contractId,
      targetType: 'perp_contract',
      ipAddress: ip,
    });
  }

  async logAccountChange(
    operatorId: string,
    operatorName: string,
    action: string,
    accountId: string,
    details: string,
    status: string = 'success',
    ip?: string
  ): Promise<PerpAuditLog> {
    return this.log(operatorId, operatorName, 'account', action, status, {
      details,
      targetId: accountId,
      targetType: 'perp_account',
      ipAddress: ip,
    });
  }

  async logPositionChange(
    operatorId: string,
    operatorName: string,
    action: string,
    positionId: string,
    details: string,
    status: string = 'success',
    ip?: string
  ): Promise<PerpAuditLog> {
    return this.log(operatorId, operatorName, 'position', action, status, {
      details,
      targetId: positionId,
      targetType: 'perp_position',
      ipAddress: ip,
    });
  }

  async logLiquidation(
    operatorId: string,
    operatorName: string,
    action: string,
    liquidationId: string,
    details: string,
    status: string = 'success'
  ): Promise<PerpAuditLog> {
    return this.log(operatorId, operatorName, 'liquidation', action, status, {
      details,
      targetId: liquidationId,
      targetType: 'perp_liquidation',
    });
  }

  async logRiskEvent(
    operatorId: string,
    operatorName: string,
    action: string,
    details: string,
    status: string = 'success'
  ): Promise<PerpAuditLog> {
    return this.log(operatorId, operatorName, 'risk', action, status, {
      details,
      targetType: 'risk_event',
    });
  }
}

export const auditService = new AuditService();
