# H036\-20 个 Service：Audit Service 审计服务

# 第 20 个 Service：Audit Service 审计服务



本服务负责：



```Plain Text
操作审计
资金审计
审批审计
登录审计
风险审计
KYC 文件访问审计
敏感数据访问审计
审计查询
审计归档
AuditLogCreated / AuditArchived 事件预留
```



---



# 1\. Audit Service 目录结构



```Plain Text
apps/audit-service/
├── src/
│   ├── app.module.ts
│   ├── main.ts
│   ├── health/
│   ├── shared/
│   │   ├── audit-errors.ts
│   │   ├── audit-events.ts
│   │   ├── audit-status.ts
│   │   └── audit-types.ts
│   └── modules/
│       ├── logs/
│       │   ├── logs.module.ts
│       │   ├── logs.controller.ts
│       │   ├── logs.admin.controller.ts
│       │   ├── logs.repository.ts
│       │   ├── logs.service.ts
│       │   └── dto/
│       │       ├── create-audit-log.dto.ts
│       │       └── query-audit-logs.dto.ts
│       ├── access-logs/
│       │   ├── access-logs.module.ts
│       │   ├── access-logs.controller.ts
│       │   ├── access-logs.repository.ts
│       │   ├── access-logs.service.ts
│       │   └── dto/
│       │       ├── create-access-log.dto.ts
│       │       └── query-access-logs.dto.ts
│       └── archives/
│           ├── archives.module.ts
│           ├── archives.admin.controller.ts
│           ├── archives.repository.ts
│           ├── archives.service.ts
│           └── dto/
│               └── create-audit-archive.dto.ts
```



---



# 2\. Prisma 补充表



## 2\.1 AuditLog



```Plain Text
model AuditLog {
  id            String   @id
  auditNo       String   @unique @map("audit_no")
  auditType     String   @map("audit_type")
  action        String
  actorType     String?  @map("actor_type")
  actorId       String?  @map("actor_id")
  targetType    String?  @map("target_type")
  targetId      String?  @map("target_id")
  serviceName   String   @map("service_name")
  requestId     String?  @map("request_id")
  traceId       String?  @map("trace_id")
  ipAddress     String?  @map("ip_address")
  deviceId      String?  @map("device_id")
  result        String
  riskLevel     String   @default("low") @map("risk_level")
  beforeJson    Json?    @map("before_json")
  afterJson     Json?    @map("after_json")
  metadata      Json?
  createdAt     DateTime @default(now()) @map("created_at")

  @@index([auditType])
  @@index([actorId])
  @@index([targetType, targetId])
  @@index([serviceName])
  @@index([createdAt])
  @@map("audit_logs")
}
```



## 2\.2 DataAccessLog



```Plain Text
model DataAccessLog {
  id             String   @id
  accessNo       String   @unique @map("access_no")
  dataType       String   @map("data_type")
  dataId         String?  @map("data_id")
  accessAction   String   @map("access_action")
  accessorType   String?  @map("accessor_type")
  accessorId     String?  @map("accessor_id")
  serviceName    String   @map("service_name")
  purpose        String?
  legalBasis     String?  @map("legal_basis")
  fieldMask      Json?    @map("field_mask")
  ipAddress      String?  @map("ip_address")
  deviceId       String?  @map("device_id")
  result         String
  createdAt      DateTime @default(now()) @map("created_at")
  metadata       Json?

  @@index([dataType])
  @@index([dataId])
  @@index([accessorId])
  @@index([createdAt])
  @@map("data_access_logs")
}
```



## 2\.3 AuditArchive



```Plain Text
model AuditArchive {
  id             String    @id
  archiveNo      String    @unique @map("archive_no")
  archiveType    String    @map("archive_type")
  periodStart    DateTime  @map("period_start")
  periodEnd      DateTime  @map("period_end")
  storageUri     String    @map("storage_uri")
  recordCount    Int       @default(0) @map("record_count")
  checksum       String?
  archiveStatus  String    @default("created") @map("archive_status")
  createdBy      String?   @map("created_by")
  completedAt    DateTime? @map("completed_at")
  createdAt      DateTime  @default(now()) @map("created_at")
  metadata       Json?

  @@index([archiveType])
  @@index([archiveStatus])
  @@map("audit_archives")
}
```



---



# 3\. Shared 常量



`apps/audit-service/src/shared/audit-events.ts`



```TypeScript
export const AuditEvents = {
  AUDIT_LOG_CREATED: 'audit.log_created.v1',
  DATA_ACCESS_LOG_CREATED: 'audit.data_access_log_created.v1',
  AUDIT_ARCHIVE_CREATED: 'audit.archive_created.v1',
  AUDIT_ARCHIVED: 'audit.archived.v1'
} as const;
```



`apps/audit-service/src/shared/audit-errors.ts`



```TypeScript
export const AuditErrors = {
  AUDIT_LOG_NOT_FOUND: 'AUDIT_LOG_NOT_FOUND',
  ACCESS_LOG_NOT_FOUND: 'ACCESS_LOG_NOT_FOUND',
  ARCHIVE_NOT_FOUND: 'AUDIT_ARCHIVE_NOT_FOUND',
  ARCHIVE_STATUS_INVALID: 'AUDIT_ARCHIVE_STATUS_INVALID',
  AUDIT_QUERY_INVALID: 'AUDIT_QUERY_INVALID'
} as const;
```



`apps/audit-service/src/shared/audit-status.ts`



```TypeScript
export const AuditResult = {
  SUCCESS: 'success',
  FAILED: 'failed',
  DENIED: 'denied',
  PARTIAL: 'partial'
} as const;

export const AuditArchiveStatus = {
  CREATED: 'created',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed'
} as const;
```



`apps/audit-service/src/shared/audit-types.ts`



```TypeScript
export const AuditTypes = {
  AUTH: 'auth',
  OPERATION: 'operation',
  FINANCE: 'finance',
  APPROVAL: 'approval',
  RISK: 'risk',
  KYC: 'kyc',
  DATA_ACCESS: 'data_access',
  ADMIN: 'admin',
  SYSTEM: 'system'
} as const;

export const DataAccessTypes = {
  KYC_DOCUMENT: 'kyc_document',
  USER_PROFILE: 'user_profile',
  WALLET: 'wallet',
  FINANCE_LEDGER: 'finance_ledger',
  TAX_RECORD: 'tax_record',
  RISK_CASE: 'risk_case',
  APPROVAL_REQUEST: 'approval_request'
} as const;
```



---



# 4\. Logs DTO



`apps/audit-service/src/modules/logs/dto/create-audit-log.dto.ts`



```TypeScript
import { IsOptional, IsString } from 'class-validator';

export class CreateAuditLogDto {
  @IsString()
  audit_type!: string;

  @IsString()
  action!: string;

  @IsOptional()
  @IsString()
  actor_type?: string;

  @IsOptional()
  @IsString()
  actor_id?: string;

  @IsOptional()
  @IsString()
  target_type?: string;

  @IsOptional()
  @IsString()
  target_id?: string;

  @IsString()
  service_name!: string;

  @IsOptional()
  @IsString()
  request_id?: string;

  @IsOptional()
  @IsString()
  trace_id?: string;

  @IsOptional()
  @IsString()
  ip_address?: string;

  @IsOptional()
  @IsString()
  device_id?: string;

  @IsString()
  result!: string;

  @IsOptional()
  @IsString()
  risk_level?: string;

  @IsOptional()
  before_json?: Record;

  @IsOptional()
  after_json?: Record;

  @IsOptional()
  metadata?: Record;
}
```



`apps/audit-service/src/modules/logs/dto/query-audit-logs.dto.ts`



```TypeScript
import { IsOptional, IsString } from 'class-validator';

export class QueryAuditLogsDto {
  @IsOptional()
  @IsString()
  audit_type?: string;

  @IsOptional()
  @IsString()
  actor_id?: string;

  @IsOptional()
  @IsString()
  target_type?: string;

  @IsOptional()
  @IsString()
  target_id?: string;

  @IsOptional()
  @IsString()
  service_name?: string;

  @IsOptional()
  @IsString()
  result?: string;

  @IsOptional()
  @IsString()
  start_time?: string;

  @IsOptional()
  @IsString()
  end_time?: string;

  @IsOptional()
  page?: number;

  @IsOptional()
  page_size?: number;
}
```



---



# 5\. Logs Repository



`apps/audit-service/src/modules/logs/logs.repository.ts`



```TypeScript
import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { ulid } from 'ulid';

const prisma = new PrismaClient();

@Injectable()
export class LogsRepository {
  create(data: {
    auditNo: string;
    auditType: string;
    action: string;
    actorType?: string;
    actorId?: string;
    targetType?: string;
    targetId?: string;
    serviceName: string;
    requestId?: string;
    traceId?: string;
    ipAddress?: string;
    deviceId?: string;
    result: string;
    riskLevel: string;
    beforeJson?: Record;
    afterJson?: Record;
    metadata?: Record;
  }) {
    return prisma.$transaction(async (tx) => {
      const log = await tx.auditLog.create({
        data: {
          id: ulid(),
          auditNo: data.auditNo,
          auditType: data.auditType,
          action: data.action,
          actorType: data.actorType,
          actorId: data.actorId,
          targetType: data.targetType,
          targetId: data.targetId,
          serviceName: data.serviceName,
          requestId: data.requestId,
          traceId: data.traceId,
          ipAddress: data.ipAddress,
          deviceId: data.deviceId,
          result: data.result,
          riskLevel: data.riskLevel,
          beforeJson: data.beforeJson,
          afterJson: data.afterJson,
          metadata: data.metadata
        }
      });

      await tx.outboxEvent.create({
        data: {
          id: ulid(),
          eventType: 'audit.log_created.v1',
          payload: {
            audit_id: log.id,
            audit_no: log.auditNo,
            audit_type: log.auditType,
            action: log.action,
            actor_id: log.actorId,
            target_type: log.targetType,
            target_id: log.targetId,
            service_name: log.serviceName,
            result: log.result
          },
          status: 'pending',
          retryCount: 0
        }
      });

      return log;
    });
  }

  findById(auditId: string) {
    return prisma.auditLog.findUnique({
      where: { id: auditId }
    });
  }

  findMany(params: {
    auditType?: string;
    actorId?: string;
    targetType?: string;
    targetId?: string;
    serviceName?: string;
    result?: string;
    startTime?: Date;
    endTime?: Date;
    page: number;
    pageSize: number;
  }) {
    return prisma.auditLog.findMany({
      where: {
        auditType: params.auditType,
        actorId: params.actorId,
        targetType: params.targetType,
        targetId: params.targetId,
        serviceName: params.serviceName,
        result: params.result,
        createdAt: {
          gte: params.startTime,
          lte: params.endTime
        }
      },
      orderBy: { createdAt: 'desc' },
      skip: (params.page - 1) * params.pageSize,
      take: params.pageSize
    });
  }

  count(params: {
    auditType?: string;
    actorId?: string;
    targetType?: string;
    targetId?: string;
    serviceName?: string;
    result?: string;
    startTime?: Date;
    endTime?: Date;
  }) {
    return prisma.auditLog.count({
      where: {
        auditType: params.auditType,
        actorId: params.actorId,
        targetType: params.targetType,
        targetId: params.targetId,
        serviceName: params.serviceName,
        result: params.result,
        createdAt: {
          gte: params.startTime,
          lte: params.endTime
        }
      }
    });
  }
}
```



---



# 6\. Logs Service



`apps/audit-service/src/modules/logs/logs.service.ts`



```TypeScript
import { Injectable } from '@nestjs/common';
import { ulid } from 'ulid';
import { LogsRepository } from './logs.repository';
import { CreateAuditLogDto } from './dto/create-audit-log.dto';
import { QueryAuditLogsDto } from './dto/query-audit-logs.dto';
import { AuditErrors } from '../../shared/audit-errors';

@Injectable()
export class LogsService {
  constructor(private readonly logsRepository: LogsRepository) {}

  async create(dto: CreateAuditLogDto) {
    const log = await this.logsRepository.create({
      auditNo: this.generateAuditNo(),
      auditType: dto.audit_type,
      action: dto.action,
      actorType: dto.actor_type,
      actorId: dto.actor_id,
      targetType: dto.target_type,
      targetId: dto.target_id,
      serviceName: dto.service_name,
      requestId: dto.request_id,
      traceId: dto.trace_id,
      ipAddress: dto.ip_address,
      deviceId: dto.device_id,
      result: dto.result,
      riskLevel: dto.risk_level || 'low',
      beforeJson: dto.before_json,
      afterJson: dto.after_json,
      metadata: dto.metadata
    });

    return this.formatLog(log);
  }

  async detail(auditId: string) {
    const log = await this.logsRepository.findById(auditId);
    if (!log) throw new Error(AuditErrors.AUDIT_LOG_NOT_FOUND);
    return this.formatLog(log);
  }

  async list(query: QueryAuditLogsDto) {
    const page = Number(query.page || 1);
    const pageSize = Math.min(Number(query.page_size || 20), 100);

    const [items, total] = await Promise.all([
      this.logsRepository.findMany({
        auditType: query.audit_type,
        actorId: query.actor_id,
        targetType: query.target_type,
        targetId: query.target_id,
        serviceName: query.service_name,
        result: query.result,
        startTime: query.start_time ? new Date(query.start_time) : undefined,
        endTime: query.end_time ? new Date(query.end_time) : undefined,
        page,
        pageSize
      }),
      this.logsRepository.count({
        auditType: query.audit_type,
        actorId: query.actor_id,
        targetType: query.target_type,
        targetId: query.target_id,
        serviceName: query.service_name,
        result: query.result,
        startTime: query.start_time ? new Date(query.start_time) : undefined,
        endTime: query.end_time ? new Date(query.end_time) : undefined
      })
    ]);

    return {
      items: items.map((item) => this.formatLog(item)),
      pagination: {
        page,
        page_size: pageSize,
        total,
        total_pages: Math.ceil(total / pageSize)
      }
    };
  }

  private formatLog(log: any) {
    return {
      audit_id: log.id,
      audit_no: log.auditNo,
      audit_type: log.auditType,
      action: log.action,
      actor_type: log.actorType,
      actor_id: log.actorId,
      target_type: log.targetType,
      target_id: log.targetId,
      service_name: log.serviceName,
      request_id: log.requestId,
      trace_id: log.traceId,
      ip_address: log.ipAddress,
      device_id: log.deviceId,
      result: log.result,
      risk_level: log.riskLevel,
      before_json: log.beforeJson,
      after_json: log.afterJson,
      metadata: log.metadata,
      created_at: log.createdAt
    };
  }

  private generateAuditNo() {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    return `AUD${date}${ulid()}`;
  }
}
```



---



# 7\. Logs Controllers / Module



`apps/audit-service/src/modules/logs/logs.controller.ts`



```TypeScript
import { Controller, Get, Param, Query } from '@nestjs/common';
import { LogsService } from './logs.service';
import { QueryAuditLogsDto } from './dto/query-audit-logs.dto';

@Controller('audit/logs')
export class LogsController {
  constructor(private readonly logsService: LogsService) {}

  @Get()
  list(@Query() query: QueryAuditLogsDto) {
    return this.logsService.list(query);
  }

  @Get(':audit_id')
  detail(@Param('audit_id') auditId: string) {
    return this.logsService.detail(auditId);
  }
}
```



`apps/audit-service/src/modules/logs/logs.admin.controller.ts`



```TypeScript
import { Body, Controller, Post } from '@nestjs/common';
import { LogsService } from './logs.service';
import { CreateAuditLogDto } from './dto/create-audit-log.dto';

@Controller('admin/audit/logs')
export class LogsAdminController {
  constructor(private readonly logsService: LogsService) {}

  @Post()
  create(@Body() dto: CreateAuditLogDto) {
    return this.logsService.create(dto);
  }
}
```



`apps/audit-service/src/modules/logs/logs.module.ts`



```TypeScript
import { Module } from '@nestjs/common';
import { LogsController } from './logs.controller';
import { LogsAdminController } from './logs.admin.controller';
import { LogsService } from './logs.service';
import { LogsRepository } from './logs.repository';

@Module({
  controllers: [LogsController, LogsAdminController],
  providers: [LogsService, LogsRepository],
  exports: [LogsService]
})
export class LogsModule {}
```



---



# 8\. Access Logs DTO



`apps/audit-service/src/modules/access-logs/dto/create-access-log.dto.ts`



```TypeScript
import { IsOptional, IsString } from 'class-validator';

export class CreateAccessLogDto {
  @IsString()
  data_type!: string;

  @IsOptional()
  @IsString()
  data_id?: string;

  @IsString()
  access_action!: string;

  @IsOptional()
  @IsString()
  accessor_type?: string;

  @IsOptional()
  @IsString()
  accessor_id?: string;

  @IsString()
  service_name!: string;

  @IsOptional()
  @IsString()
  purpose?: string;

  @IsOptional()
  @IsString()
  legal_basis?: string;

  @IsOptional()
  field_mask?: Record;

  @IsOptional()
  @IsString()
  ip_address?: string;

  @IsOptional()
  @IsString()
  device_id?: string;

  @IsString()
  result!: string;

  @IsOptional()
  metadata?: Record;
}
```



`apps/audit-service/src/modules/access-logs/dto/query-access-logs.dto.ts`



```TypeScript
import { IsOptional, IsString } from 'class-validator';

export class QueryAccessLogsDto {
  @IsOptional()
  @IsString()
  data_type?: string;

  @IsOptional()
  @IsString()
  data_id?: string;

  @IsOptional()
  @IsString()
  accessor_id?: string;

  @IsOptional()
  @IsString()
  service_name?: string;

  @IsOptional()
  @IsString()
  result?: string;

  @IsOptional()
  @IsString()
  start_time?: string;

  @IsOptional()
  @IsString()
  end_time?: string;

  @IsOptional()
  page?: number;

  @IsOptional()
  page_size?: number;
}
```



---



# 9\. Access Logs Repository / Service



`apps/audit-service/src/modules/access-logs/access-logs.repository.ts`



```TypeScript
import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { ulid } from 'ulid';

const prisma = new PrismaClient();

@Injectable()
export class AccessLogsRepository {
  create(data: {
    accessNo: string;
    dataType: string;
    dataId?: string;
    accessAction: string;
    accessorType?: string;
    accessorId?: string;
    serviceName: string;
    purpose?: string;
    legalBasis?: string;
    fieldMask?: Record;
    ipAddress?: string;
    deviceId?: string;
    result: string;
    metadata?: Record;
  }) {
    return prisma.$transaction(async (tx) => {
      const log = await tx.dataAccessLog.create({
        data: {
          id: ulid(),
          accessNo: data.accessNo,
          dataType: data.dataType,
          dataId: data.dataId,
          accessAction: data.accessAction,
          accessorType: data.accessorType,
          accessorId: data.accessorId,
          serviceName: data.serviceName,
          purpose: data.purpose,
          legalBasis: data.legalBasis,
          fieldMask: data.fieldMask,
          ipAddress: data.ipAddress,
          deviceId: data.deviceId,
          result: data.result,
          metadata: data.metadata
        }
      });

      await tx.outboxEvent.create({
        data: {
          id: ulid(),
          eventType: 'audit.data_access_log_created.v1',
          payload: {
            access_id: log.id,
            access_no: log.accessNo,
            data_type: log.dataType,
            data_id: log.dataId,
            accessor_id: log.accessorId,
            service_name: log.serviceName,
            result: log.result
          },
          status: 'pending',
          retryCount: 0
        }
      });

      return log;
    });
  }

  findById(accessId: string) {
    return prisma.dataAccessLog.findUnique({
      where: { id: accessId }
    });
  }

  findMany(params: {
    dataType?: string;
    dataId?: string;
    accessorId?: string;
    serviceName?: string;
    result?: string;
    startTime?: Date;
    endTime?: Date;
    page: number;
    pageSize: number;
  }) {
    return prisma.dataAccessLog.findMany({
      where: {
        dataType: params.dataType,
        dataId: params.dataId,
        accessorId: params.accessorId,
        serviceName: params.serviceName,
        result: params.result,
        createdAt: {
          gte: params.startTime,
          lte: params.endTime
        }
      },
      orderBy: { createdAt: 'desc' },
      skip: (params.page - 1) * params.pageSize,
      take: params.pageSize
    });
  }

  count(params: {
    dataType?: string;
    dataId?: string;
    accessorId?: string;
    serviceName?: string;
    result?: string;
    startTime?: Date;
    endTime?: Date;
  }) {
    return prisma.dataAccessLog.count({
      where: {
        dataType: params.dataType,
        dataId: params.dataId,
        accessorId: params.accessorId,
        serviceName: params.serviceName,
        result: params.result,
        createdAt: {
          gte: params.startTime,
          lte: params.endTime
        }
      }
    });
  }
}
```



`apps/audit-service/src/modules/access-logs/access-logs.service.ts`



```TypeScript
import { Injectable } from '@nestjs/common';
import { ulid } from 'ulid';
import { AccessLogsRepository } from './access-logs.repository';
import { CreateAccessLogDto } from './dto/create-access-log.dto';
import { QueryAccessLogsDto } from './dto/query-access-logs.dto';
import { AuditErrors } from '../../shared/audit-errors';

@Injectable()
export class AccessLogsService {
  constructor(private readonly accessLogsRepository: AccessLogsRepository) {}

  async create(dto: CreateAccessLogDto) {
    const log = await this.accessLogsRepository.create({
      accessNo: this.generateAccessNo(),
      dataType: dto.data_type,
      dataId: dto.data_id,
      accessAction: dto.access_action,
      accessorType: dto.accessor_type,
      accessorId: dto.accessor_id,
      serviceName: dto.service_name,
      purpose: dto.purpose,
      legalBasis: dto.legal_basis,
      fieldMask: dto.field_mask,
      ipAddress: dto.ip_address,
      deviceId: dto.device_id,
      result: dto.result,
      metadata: dto.metadata
    });

    return this.formatLog(log);
  }

  async detail(accessId: string) {
    const log = await this.accessLogsRepository.findById(accessId);
    if (!log) throw new Error(AuditErrors.ACCESS_LOG_NOT_FOUND);
    return this.formatLog(log);
  }

  async list(query: QueryAccessLogsDto) {
    const page = Number(query.page || 1);
    const pageSize = Math.min(Number(query.page_size || 20), 100);

    const [items, total] = await Promise.all([
      this.accessLogsRepository.findMany({
        dataType: query.data_type,
        dataId: query.data_id,
        accessorId: query.accessor_id,
        serviceName: query.service_name,
        result: query.result,
        startTime: query.start_time ? new Date(query.start_time) : undefined,
        endTime: query.end_time ? new Date(query.end_time) : undefined,
        page,
        pageSize
      }),
      this.accessLogsRepository.count({
        dataType: query.data_type,
        dataId: query.data_id,
        accessorId: query.accessor_id,
        serviceName: query.service_name,
        result: query.result,
        startTime: query.start_time ? new Date(query.start_time) : undefined,
        endTime: query.end_time ? new Date(query.end_time) : undefined
      })
    ]);

    return {
      items: items.map((item) => this.formatLog(item)),
      pagination: {
        page,
        page_size: pageSize,
        total,
        total_pages: Math.ceil(total / pageSize)
      }
    };
  }

  private formatLog(log: any) {
    return {
      access_id: log.id,
      access_no: log.accessNo,
      data_type: log.dataType,
      data_id: log.dataId,
      access_action: log.accessAction,
      accessor_type: log.accessorType,
      accessor_id: log.accessorId,
      service_name: log.serviceName,
      purpose: log.purpose,
      legal_basis: log.legalBasis,
      field_mask: log.fieldMask,
      ip_address: log.ipAddress,
      device_id: log.deviceId,
      result: log.result,
      metadata: log.metadata,
      created_at: log.createdAt
    };
  }

  private generateAccessNo() {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    return `DAL${date}${ulid()}`;
  }
}
```



---



# 10\. Access Logs Controllers / Module



`apps/audit-service/src/modules/access-logs/access-logs.controller.ts`



```TypeScript
import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { AccessLogsService } from './access-logs.service';
import { CreateAccessLogDto } from './dto/create-access-log.dto';
import { QueryAccessLogsDto } from './dto/query-access-logs.dto';

@Controller('audit/access-logs')
export class AccessLogsController {
  constructor(private readonly accessLogsService: AccessLogsService) {}

  @Post()
  create(@Body() dto: CreateAccessLogDto) {
    return this.accessLogsService.create(dto);
  }

  @Get()
  list(@Query() query: QueryAccessLogsDto) {
    return this.accessLogsService.list(query);
  }

  @Get(':access_id')
  detail(@Param('access_id') accessId: string) {
    return this.accessLogsService.detail(accessId);
  }
}
```



`apps/audit-service/src/modules/access-logs/access-logs.module.ts`



```TypeScript
import { Module } from '@nestjs/common';
import { AccessLogsController } from './access-logs.controller';
import { AccessLogsService } from './access-logs.service';
import { AccessLogsRepository } from './access-logs.repository';

@Module({
  controllers: [AccessLogsController],
  providers: [AccessLogsService, AccessLogsRepository],
  exports: [AccessLogsService]
})
export class AccessLogsModule {}
```



---



# 11\. Archives DTO / Repository / Service



`apps/audit-service/src/modules/archives/dto/create-audit-archive.dto.ts`



```TypeScript
import { IsOptional, IsString } from 'class-validator';

export class CreateAuditArchiveDto {
  @IsString()
  archive_type!: string;

  @IsString()
  period_start!: string;

  @IsString()
  period_end!: string;

  @IsString()
  storage_uri!: string;

  @IsOptional()
  @IsString()
  created_by?: string;
}
```



`apps/audit-service/src/modules/archives/archives.repository.ts`



```TypeScript
import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { ulid } from 'ulid';

const prisma = new PrismaClient();

@Injectable()
export class ArchivesRepository {
  create(data: {
    archiveNo: string;
    archiveType: string;
    periodStart: Date;
    periodEnd: Date;
    storageUri: string;
    recordCount: number;
    checksum?: string;
    createdBy?: string;
  }) {
    return prisma.$transaction(async (tx) => {
      const archive = await tx.auditArchive.create({
        data: {
          id: ulid(),
          archiveNo: data.archiveNo,
          archiveType: data.archiveType,
          periodStart: data.periodStart,
          periodEnd: data.periodEnd,
          storageUri: data.storageUri,
          recordCount: data.recordCount,
          checksum: data.checksum,
          archiveStatus: 'completed',
          completedAt: new Date(),
          createdBy: data.createdBy
        }
      });

      await tx.outboxEvent.create({
        data: {
          id: ulid(),
          eventType: 'audit.archived.v1',
          payload: {
            archive_id: archive.id,
            archive_no: archive.archiveNo,
            archive_type: archive.archiveType,
            period_start: archive.periodStart,
            period_end: archive.periodEnd,
            storage_uri: archive.storageUri,
            record_count: archive.recordCount
          },
          status: 'pending',
          retryCount: 0
        }
      });

      return archive;
    });
  }

  findById(archiveId: string) {
    return prisma.auditArchive.findUnique({
      where: { id: archiveId }
    });
  }

  countAuditLogs(start: Date, end: Date) {
    return prisma.auditLog.count({
      where: {
        createdAt: {
          gte: start,
          lte: end
        }
      }
    });
  }

  countAccessLogs(start: Date, end: Date) {
    return prisma.dataAccessLog.count({
      where: {
        createdAt: {
          gte: start,
          lte: end
        }
      }
    });
  }
}
```



`apps/audit-service/src/modules/archives/archives.service.ts`



```TypeScript
import { Injectable } from '@nestjs/common';
import { createHash } from 'crypto';
import { ulid } from 'ulid';
import { ArchivesRepository } from './archives.repository';
import { CreateAuditArchiveDto } from './dto/create-audit-archive.dto';
import { AuditErrors } from '../../shared/audit-errors';

@Injectable()
export class ArchivesService {
  constructor(private readonly archivesRepository: ArchivesRepository) {}

  async create(dto: CreateAuditArchiveDto) {
    const start = new Date(dto.period_start);
    const end = new Date(dto.period_end);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start > end) {
      throw new Error(AuditErrors.AUDIT_QUERY_INVALID);
    }

    const recordCount =
      dto.archive_type === 'data_access'
        ? await this.archivesRepository.countAccessLogs(start, end)
        : await this.archivesRepository.countAuditLogs(start, end);

    const checksum = createHash('sha256')
      .update(`${dto.archive_type}:${dto.period_start}:${dto.period_end}:${recordCount}`)
      .digest('hex');

    const archive = await this.archivesRepository.create({
      archiveNo: this.generateArchiveNo(),
      archiveType: dto.archive_type,
      periodStart: start,
      periodEnd: end,
      storageUri: dto.storage_uri,
      recordCount,
      checksum,
      createdBy: dto.created_by
    });

    return {
      archive_id: archive.id,
      archive_no: archive.archiveNo,
      archive_type: archive.archiveType,
      period_start: archive.periodStart,
      period_end: archive.periodEnd,
      storage_uri: archive.storageUri,
      record_count: archive.recordCount,
      checksum: archive.checksum,
      archive_status: archive.archiveStatus,
      completed_at: archive.completedAt
    };
  }

  async detail(archiveId: string) {
    const archive = await this.archivesRepository.findById(archiveId);
    if (!archive) throw new Error(AuditErrors.ARCHIVE_NOT_FOUND);

    return {
      archive_id: archive.id,
      archive_no: archive.archiveNo,
      archive_type: archive.archiveType,
      period_start: archive.periodStart,
      period_end: archive.periodEnd,
      storage_uri: archive.storageUri,
      record_count: archive.recordCount,
      checksum: archive.checksum,
      archive_status: archive.archiveStatus,
      completed_at: archive.completedAt,
      created_by: archive.createdBy
    };
  }

  private generateArchiveNo() {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    return `AAR${date}${ulid()}`;
  }
}
```



---



# 12\. Archives Controller / Module



`apps/audit-service/src/modules/archives/archives.admin.controller.ts`



```TypeScript
import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ArchivesService } from './archives.service';
import { CreateAuditArchiveDto } from './dto/create-audit-archive.dto';

@Controller('admin/audit/archives')
export class ArchivesAdminController {
  constructor(private readonly archivesService: ArchivesService) {}

  @Post()
  create(@Body() dto: CreateAuditArchiveDto) {
    return this.archivesService.create(dto);
  }

  @Get(':archive_id')
  detail(@Param('archive_id') archiveId: string) {
    return this.archivesService.detail(archiveId);
  }
}
```



`apps/audit-service/src/modules/archives/archives.module.ts`



```TypeScript
import { Module } from '@nestjs/common';
import { ArchivesAdminController } from './archives.admin.controller';
import { ArchivesService } from './archives.service';
import { ArchivesRepository } from './archives.repository';

@Module({
  controllers: [ArchivesAdminController],
  providers: [ArchivesService, ArchivesRepository],
  exports: [ArchivesService]
})
export class ArchivesModule {}
```



---



# 13\. Audit App Module



`apps/audit-service/src/app.module.ts`



```TypeScript
import { Module } from '@nestjs/common';
import { HealthModule } from './health/health.module';
import { LogsModule } from './modules/logs/logs.module';
import { AccessLogsModule } from './modules/access-logs/access-logs.module';
import { ArchivesModule } from './modules/archives/archives.module';

@Module({
  imports: [
    HealthModule,
    LogsModule,
    AccessLogsModule,
    ArchivesModule
  ]
})
export class AppModule {}
```



---



# 14\. Audit Service 当前 API



## 查询端



```HTTP
GET /api/v1/audit/logs
GET /api/v1/audit/logs/:audit_id

POST /api/v1/audit/access-logs
GET /api/v1/audit/access-logs
GET /api/v1/audit/access-logs/:access_id
```



## 后台端



```HTTP
POST /api/v1/admin/audit/logs

POST /api/v1/admin/audit/archives
GET /api/v1/admin/audit/archives/:archive_id
```



---



# 15\. Audit Service 已具备能力



这一版完成后，Audit Service 支持：



```Plain Text
通用审计日志写入
通用审计日志查询
敏感数据访问日志写入
敏感数据访问日志查询
审计归档记录创建
归档记录校验 checksum
Audit outbox 事件
```



---



# 16\. 后续必须补强



```Plain Text
统一 AppException
PrismaModule 注入
日志不可篡改链
审计日志冷存储导出
PII 字段脱敏
KYC 文件访问强制审计
Finance / Approval / Risk 自动埋点
WORM 存储
审计报表
Admin 权限 Guard
```



---



# 17\. 下一步继续



按 23 个 Service 顺序，下一步写：



```Plain Text
21. Notification Service 通知服务
```



下一步会覆盖：



```Plain Text
站内信
邮件
短信
Webhook
通知模板
通知任务
通知投递记录
失败重试
NotificationCreated / Delivered / Failed 事件
```



