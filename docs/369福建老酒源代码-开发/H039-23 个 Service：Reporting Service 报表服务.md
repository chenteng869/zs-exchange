# H039\-23 个 Service：Reporting Service 报表服务

# 第 23 个 Service：Reporting Service 报表服务



本服务负责：



```Plain Text
运营报表
财务报表
税务报表
用户增长
订单 GMV
收益分配
积分 / 算力 / 释放报表
报表任务
报表导出
ReportGenerated / ReportExported 事件预留
```



---



# 1\. Reporting Service 目录结构



```Plain Text
apps/reporting-service/
├── src/
│   ├── app.module.ts
│   ├── main.ts
│   ├── health/
│   ├── shared/
│   │   ├── report-errors.ts
│   │   ├── report-events.ts
│   │   ├── report-status.ts
│   │   └── report-types.ts
│   └── modules/
│       ├── reports/
│       │   ├── reports.module.ts
│       │   ├── reports.controller.ts
│       │   ├── reports.admin.controller.ts
│       │   ├── reports.repository.ts
│       │   ├── reports.service.ts
│       │   └── dto/
│       │       ├── create-report-task.dto.ts
│       │       ├── query-report-tasks.dto.ts
│       │       └── export-report.dto.ts
│       ├── dashboards/
│       │   ├── dashboards.module.ts
│       │   ├── dashboards.controller.ts
│       │   ├── dashboards.repository.ts
│       │   └── dashboards.service.ts
│       └── snapshots/
│           ├── snapshots.module.ts
│           ├── snapshots.controller.ts
│           ├── snapshots.admin.controller.ts
│           ├── snapshots.repository.ts
│           ├── snapshots.service.ts
│           └── dto/
│               └── create-report-snapshot.dto.ts
```



---



# 2\. Prisma 补充表



## 2\.1 ReportTask



```Plain Text
model ReportTask {
  id            String    @id
  taskNo        String    @unique @map("task_no")
  reportType    String    @map("report_type")
  periodStart   DateTime  @map("period_start")
  periodEnd     DateTime  @map("period_end")
  status        String    @default("created")
  requestedBy   String?   @map("requested_by")
  fileId        String?   @map("file_id")
  fileUrl       String?   @map("file_url")
  generatedAt   DateTime? @map("generated_at")
  exportedAt    DateTime? @map("exported_at")
  createdAt     DateTime  @default(now()) @map("created_at")
  updatedAt     DateTime  @updatedAt @map("updated_at")
  metadata      Json?

  @@index([reportType])
  @@index([status])
  @@index([periodStart, periodEnd])
  @@map("report_tasks")
}
```



## 2\.2 ReportSnapshot



```Plain Text
model ReportSnapshot {
  id             String   @id
  snapshotNo     String   @unique @map("snapshot_no")
  reportType     String   @map("report_type")
  snapshotPeriod String   @map("snapshot_period")
  metricsJson    Json     @map("metrics_json")
  status         String   @default("ready")
  createdBy      String?  @map("created_by")
  createdAt      DateTime @default(now()) @map("created_at")
  metadata       Json?

  @@unique([reportType, snapshotPeriod])
  @@index([reportType])
  @@index([snapshotPeriod])
  @@map("report_snapshots")
}
```



## 2\.3 DashboardMetric



```Plain Text
model DashboardMetric {
  id          String   @id
  metricKey   String   @map("metric_key")
  metricName  String   @map("metric_name")
  metricType  String   @map("metric_type")
  metricValue Decimal  @map("metric_value") @db.Decimal(36, 18)
  currency    String?
  dimension   Json?
  period      String
  createdAt   DateTime @default(now()) @map("created_at")
  metadata    Json?

  @@index([metricKey])
  @@index([metricType])
  @@index([period])
  @@map("dashboard_metrics")
}
```



---



# 3\. Shared 常量



`apps/reporting-service/src/shared/report-events.ts`



```TypeScript
export const ReportEvents = {
  REPORT_TASK_CREATED: 'report.task_created.v1',
  REPORT_GENERATED: 'report.generated.v1',
  REPORT_EXPORTED: 'report.exported.v1',
  REPORT_SNAPSHOT_CREATED: 'report.snapshot_created.v1',
  DASHBOARD_METRIC_CREATED: 'report.dashboard_metric_created.v1'
} as const;
```



`apps/reporting-service/src/shared/report-errors.ts`



```TypeScript
export const ReportErrors = {
  REPORT_TASK_NOT_FOUND: 'REPORT_TASK_NOT_FOUND',
  REPORT_TASK_STATUS_INVALID: 'REPORT_TASK_STATUS_INVALID',
  REPORT_SNAPSHOT_NOT_FOUND: 'REPORT_SNAPSHOT_NOT_FOUND',
  REPORT_SNAPSHOT_ALREADY_EXISTS: 'REPORT_SNAPSHOT_ALREADY_EXISTS',
  REPORT_TYPE_INVALID: 'REPORT_TYPE_INVALID',
  REPORT_PERIOD_INVALID: 'REPORT_PERIOD_INVALID'
} as const;
```



`apps/reporting-service/src/shared/report-status.ts`



```TypeScript
export const ReportTaskStatus = {
  CREATED: 'created',
  PROCESSING: 'processing',
  GENERATED: 'generated',
  EXPORTED: 'exported',
  FAILED: 'failed',
  CANCELLED: 'cancelled'
} as const;

export const ReportSnapshotStatus = {
  READY: 'ready',
  ARCHIVED: 'archived'
} as const;
```



`apps/reporting-service/src/shared/report-types.ts`



```TypeScript
export const ReportTypes = {
  OPERATIONS_DAILY: 'operations_daily',
  FINANCE_DAILY: 'finance_daily',
  TAX_MONTHLY: 'tax_monthly',
  USER_GROWTH: 'user_growth',
  ORDER_GMV: 'order_gmv',
  REVENUE_ALLOCATION: 'revenue_allocation',
  POINTS_SUMMARY: 'points_summary',
  POWER_SUMMARY: 'power_summary',
  RELEASE_SUMMARY: 'release_summary',
  RISK_SUMMARY: 'risk_summary'
} as const;

export const DashboardMetricTypes = {
  USER: 'user',
  ORDER: 'order',
  FINANCE: 'finance',
  RISK: 'risk',
  POINTS: 'points',
  POWER: 'power',
  RELEASE: 'release'
} as const;
```



---



# 4\. Reports DTO



`apps/reporting-service/src/modules/reports/dto/create-report-task.dto.ts`



```TypeScript
import { IsOptional, IsString } from 'class-validator';

export class CreateReportTaskDto {
  @IsString()
  report_type!: string;

  @IsString()
  period_start!: string;

  @IsString()
  period_end!: string;

  @IsOptional()
  @IsString()
  requested_by?: string;
}
```



`apps/reporting-service/src/modules/reports/dto/query-report-tasks.dto.ts`



```TypeScript
import { IsOptional, IsString } from 'class-validator';

export class QueryReportTasksDto {
  @IsOptional()
  @IsString()
  report_type?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  requested_by?: string;

  @IsOptional()
  page?: number;

  @IsOptional()
  page_size?: number;
}
```



`apps/reporting-service/src/modules/reports/dto/export-report.dto.ts`



```TypeScript
import { IsOptional, IsString } from 'class-validator';

export class ExportReportDto {
  @IsString()
  file_url!: string;

  @IsOptional()
  @IsString()
  file_id?: string;
}
```



---



# 5\. Reports Repository



`apps/reporting-service/src/modules/reports/reports.repository.ts`



```TypeScript
import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { ulid } from 'ulid';

const prisma = new PrismaClient();

@Injectable()
export class ReportsRepository {
  createTask(data: {
    taskNo: string;
    reportType: string;
    periodStart: Date;
    periodEnd: Date;
    requestedBy?: string;
  }) {
    return prisma.$transaction(async (tx) => {
      const task = await tx.reportTask.create({
        data: {
          id: ulid(),
          taskNo: data.taskNo,
          reportType: data.reportType,
          periodStart: data.periodStart,
          periodEnd: data.periodEnd,
          requestedBy: data.requestedBy,
          status: 'created'
        }
      });

      await tx.outboxEvent.create({
        data: {
          id: ulid(),
          eventType: 'report.task_created.v1',
          payload: {
            task_id: task.id,
            task_no: task.taskNo,
            report_type: task.reportType,
            period_start: task.periodStart,
            period_end: task.periodEnd
          },
          status: 'pending',
          retryCount: 0
        }
      });

      return task;
    });
  }

  findTaskById(taskId: string) {
    return prisma.reportTask.findUnique({
      where: { id: taskId }
    });
  }

  findTasks(params: {
    reportType?: string;
    status?: string;
    requestedBy?: string;
    page: number;
    pageSize: number;
  }) {
    return prisma.reportTask.findMany({
      where: {
        reportType: params.reportType,
        status: params.status,
        requestedBy: params.requestedBy
      },
      orderBy: { createdAt: 'desc' },
      skip: (params.page - 1) * params.pageSize,
      take: params.pageSize
    });
  }

  countTasks(params: {
    reportType?: string;
    status?: string;
    requestedBy?: string;
  }) {
    return prisma.reportTask.count({
      where: {
        reportType: params.reportType,
        status: params.status,
        requestedBy: params.requestedBy
      }
    });
  }

  markGenerated(taskId: string, metrics: Record) {
    return prisma.$transaction(async (tx) => {
      const task = await tx.reportTask.update({
        where: { id: taskId },
        data: {
          status: 'generated',
          generatedAt: new Date(),
          metadata: {
            metrics
          }
        }
      });

      await tx.outboxEvent.create({
        data: {
          id: ulid(),
          eventType: 'report.generated.v1',
          payload: {
            task_id: task.id,
            task_no: task.taskNo,
            report_type: task.reportType,
            generated_at: task.generatedAt
          },
          status: 'pending',
          retryCount: 0
        }
      });

      return task;
    });
  }

  exportTask(data: {
    taskId: string;
    fileId?: string;
    fileUrl: string;
  }) {
    return prisma.$transaction(async (tx) => {
      const task = await tx.reportTask.update({
        where: { id: data.taskId },
        data: {
          status: 'exported',
          fileId: data.fileId,
          fileUrl: data.fileUrl,
          exportedAt: new Date()
        }
      });

      await tx.outboxEvent.create({
        data: {
          id: ulid(),
          eventType: 'report.exported.v1',
          payload: {
            task_id: task.id,
            task_no: task.taskNo,
            report_type: task.reportType,
            file_id: task.fileId,
            file_url: task.fileUrl,
            exported_at: task.exportedAt
          },
          status: 'pending',
          retryCount: 0
        }
      });

      return task;
    });
  }
}
```



---



# 6\. Reports Service



`apps/reporting-service/src/modules/reports/reports.service.ts`



```TypeScript
import { Injectable } from '@nestjs/common';
import { ulid } from 'ulid';
import { ReportsRepository } from './reports.repository';
import { CreateReportTaskDto } from './dto/create-report-task.dto';
import { QueryReportTasksDto } from './dto/query-report-tasks.dto';
import { ExportReportDto } from './dto/export-report.dto';
import { ReportErrors } from '../../shared/report-errors';
import { ReportTaskStatus } from '../../shared/report-status';

@Injectable()
export class ReportsService {
  constructor(private readonly reportsRepository: ReportsRepository) {}

  async createTask(dto: CreateReportTaskDto) {
    const start = new Date(dto.period_start);
    const end = new Date(dto.period_end);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start > end) {
      throw new Error(ReportErrors.REPORT_PERIOD_INVALID);
    }

    const task = await this.reportsRepository.createTask({
      taskNo: this.generateTaskNo(),
      reportType: dto.report_type,
      periodStart: start,
      periodEnd: end,
      requestedBy: dto.requested_by
    });

    return this.formatTask(task);
  }

  async detail(taskId: string) {
    const task = await this.reportsRepository.findTaskById(taskId);
    if (!task) throw new Error(ReportErrors.REPORT_TASK_NOT_FOUND);
    return this.formatTask(task);
  }

  async list(query: QueryReportTasksDto) {
    const page = Number(query.page || 1);
    const pageSize = Math.min(Number(query.page_size || 20), 100);

    const [items, total] = await Promise.all([
      this.reportsRepository.findTasks({
        reportType: query.report_type,
        status: query.status,
        requestedBy: query.requested_by,
        page,
        pageSize
      }),
      this.reportsRepository.countTasks({
        reportType: query.report_type,
        status: query.status,
        requestedBy: query.requested_by
      })
    ]);

    return {
      items: items.map((item) => this.formatTask(item)),
      pagination: {
        page,
        page_size: pageSize,
        total,
        total_pages: Math.ceil(total / pageSize)
      }
    };
  }

  async generate(taskId: string) {
    const task = await this.reportsRepository.findTaskById(taskId);
    if (!task) throw new Error(ReportErrors.REPORT_TASK_NOT_FOUND);

    if (![ReportTaskStatus.CREATED, ReportTaskStatus.PROCESSING].includes(task.status as any)) {
      throw new Error(ReportErrors.REPORT_TASK_STATUS_INVALID);
    }

    const metrics = this.mockGenerateMetrics(task.reportType);

    const updated = await this.reportsRepository.markGenerated(taskId, metrics);
    return this.formatTask(updated);
  }

  async export(taskId: string, dto: ExportReportDto) {
    const task = await this.reportsRepository.findTaskById(taskId);
    if (!task) throw new Error(ReportErrors.REPORT_TASK_NOT_FOUND);

    if (task.status !== ReportTaskStatus.GENERATED) {
      throw new Error(ReportErrors.REPORT_TASK_STATUS_INVALID);
    }

    const updated = await this.reportsRepository.exportTask({
      taskId,
      fileId: dto.file_id,
      fileUrl: dto.file_url
    });

    return this.formatTask(updated);
  }

  private mockGenerateMetrics(reportType: string) {
    if (reportType === 'order_gmv') {
      return {
        order_count: 0,
        gmv: '0.000000000000000000',
        paid_order_count: 0,
        refund_amount: '0.000000000000000000'
      };
    }

    if (reportType === 'finance_daily') {
      return {
        revenue: '0.000000000000000000',
        cost: '0.000000000000000000',
        reward_accrual: '0.000000000000000000',
        net_income: '0.000000000000000000'
      };
    }

    if (reportType === 'user_growth') {
      return {
        new_users: 0,
        active_users: 0,
        kyc_passed_users: 0
      };
    }

    return {
      generated: true,
      report_type: reportType
    };
  }

  private formatTask(task: any) {
    return {
      task_id: task.id,
      task_no: task.taskNo,
      report_type: task.reportType,
      period_start: task.periodStart,
      period_end: task.periodEnd,
      status: task.status,
      requested_by: task.requestedBy,
      file_id: task.fileId,
      file_url: task.fileUrl,
      generated_at: task.generatedAt,
      exported_at: task.exportedAt,
      metadata: task.metadata
    };
  }

  private generateTaskNo() {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    return `RPT${date}${ulid()}`;
  }
}
```



---



# 7\. Reports Controllers / Module



`apps/reporting-service/src/modules/reports/reports.controller.ts`



```TypeScript
import { Controller, Get, Param, Query } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { QueryReportTasksDto } from './dto/query-report-tasks.dto';

@Controller('reports/tasks')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get()
  list(@Query() query: QueryReportTasksDto) {
    return this.reportsService.list(query);
  }

  @Get(':task_id')
  detail(@Param('task_id') taskId: string) {
    return this.reportsService.detail(taskId);
  }
}
```



`apps/reporting-service/src/modules/reports/reports.admin.controller.ts`



```TypeScript
import { Body, Controller, Param, Post } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { CreateReportTaskDto } from './dto/create-report-task.dto';
import { ExportReportDto } from './dto/export-report.dto';

@Controller('admin/reports/tasks')
export class ReportsAdminController {
  constructor(private readonly reportsService: ReportsService) {}

  @Post()
  createTask(@Body() dto: CreateReportTaskDto) {
    return this.reportsService.createTask(dto);
  }

  @Post(':task_id/generate')
  generate(@Param('task_id') taskId: string) {
    return this.reportsService.generate(taskId);
  }

  @Post(':task_id/export')
  export(@Param('task_id') taskId: string, @Body() dto: ExportReportDto) {
    return this.reportsService.export(taskId, dto);
  }
}
```



`apps/reporting-service/src/modules/reports/reports.module.ts`



```TypeScript
import { Module } from '@nestjs/common';
import { ReportsController } from './reports.controller';
import { ReportsAdminController } from './reports.admin.controller';
import { ReportsService } from './reports.service';
import { ReportsRepository } from './reports.repository';

@Module({
  controllers: [ReportsController, ReportsAdminController],
  providers: [ReportsService, ReportsRepository],
  exports: [ReportsService]
})
export class ReportsModule {}
```



---



# 8\. Dashboards Repository / Service



`apps/reporting-service/src/modules/dashboards/dashboards.repository.ts`



```TypeScript
import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

@Injectable()
export class DashboardsRepository {
  latestMetrics(params: {
    metricType?: string;
    period?: string;
  }) {
    return prisma.dashboardMetric.findMany({
      where: {
        metricType: params.metricType,
        period: params.period
      },
      orderBy: { createdAt: 'desc' }
    });
  }
}
```



`apps/reporting-service/src/modules/dashboards/dashboards.service.ts`



```TypeScript
import { Injectable } from '@nestjs/common';
import { DashboardsRepository } from './dashboards.repository';

@Injectable()
export class DashboardsService {
  constructor(private readonly dashboardsRepository: DashboardsRepository) {}

  async overview(query: { metric_type?: string; period?: string }) {
    const items = await this.dashboardsRepository.latestMetrics({
      metricType: query.metric_type,
      period: query.period
    });

    return {
      items: items.map((item) => ({
        metric_key: item.metricKey,
        metric_name: item.metricName,
        metric_type: item.metricType,
        metric_value: item.metricValue.toString(),
        currency: item.currency,
        dimension: item.dimension,
        period: item.period,
        created_at: item.createdAt
      }))
    };
  }
}
```



`apps/reporting-service/src/modules/dashboards/dashboards.controller.ts`



```TypeScript
import { Controller, Get, Query } from '@nestjs/common';
import { DashboardsService } from './dashboards.service';

@Controller('reports/dashboards')
export class DashboardsController {
  constructor(private readonly dashboardsService: DashboardsService) {}

  @Get('overview')
  overview(@Query() query: { metric_type?: string; period?: string }) {
    return this.dashboardsService.overview(query);
  }
}
```



`apps/reporting-service/src/modules/dashboards/dashboards.module.ts`



```TypeScript
import { Module } from '@nestjs/common';
import { DashboardsController } from './dashboards.controller';
import { DashboardsService } from './dashboards.service';
import { DashboardsRepository } from './dashboards.repository';

@Module({
  controllers: [DashboardsController],
  providers: [DashboardsService, DashboardsRepository],
  exports: [DashboardsService]
})
export class DashboardsModule {}
```



---



# 9\. Snapshots DTO / Repository / Service



`apps/reporting-service/src/modules/snapshots/dto/create-report-snapshot.dto.ts`



```TypeScript
import { IsOptional, IsString } from 'class-validator';

export class CreateReportSnapshotDto {
  @IsString()
  report_type!: string;

  @IsString()
  snapshot_period!: string;

  metrics_json!: Record;

  @IsOptional()
  @IsString()
  created_by?: string;
}
```



`apps/reporting-service/src/modules/snapshots/snapshots.repository.ts`



```TypeScript
import { Injectable } from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';
import { ulid } from 'ulid';

const prisma = new PrismaClient();

@Injectable()
export class SnapshotsRepository {
  findExisting(reportType: string, snapshotPeriod: string) {
    return prisma.reportSnapshot.findUnique({
      where: {
        reportType_snapshotPeriod: {
          reportType,
          snapshotPeriod
        }
      }
    });
  }

  create(data: {
    snapshotNo: string;
    reportType: string;
    snapshotPeriod: string;
    metricsJson: Record;
    createdBy?: string;
  }) {
    return prisma.$transaction(async (tx) => {
      const snapshot = await tx.reportSnapshot.create({
        data: {
          id: ulid(),
          snapshotNo: data.snapshotNo,
          reportType: data.reportType,
          snapshotPeriod: data.snapshotPeriod,
          metricsJson: data.metricsJson,
          createdBy: data.createdBy,
          status: 'ready'
        }
      });

      await tx.outboxEvent.create({
        data: {
          id: ulid(),
          eventType: 'report.snapshot_created.v1',
          payload: {
            snapshot_id: snapshot.id,
            snapshot_no: snapshot.snapshotNo,
            report_type: snapshot.reportType,
            snapshot_period: snapshot.snapshotPeriod
          },
          status: 'pending',
          retryCount: 0
        }
      });

      return snapshot;
    });
  }

  list(params: {
    reportType?: string;
    snapshotPeriod?: string;
  }) {
    return prisma.reportSnapshot.findMany({
      where: {
        reportType: params.reportType,
        snapshotPeriod: params.snapshotPeriod
      },
      orderBy: { createdAt: 'desc' }
    });
  }
}
```



`apps/reporting-service/src/modules/snapshots/snapshots.service.ts`



```TypeScript
import { Injectable } from '@nestjs/common';
import { ulid } from 'ulid';
import { SnapshotsRepository } from './snapshots.repository';
import { CreateReportSnapshotDto } from './dto/create-report-snapshot.dto';
import { ReportErrors } from '../../shared/report-errors';

@Injectable()
export class SnapshotsService {
  constructor(private readonly snapshotsRepository: SnapshotsRepository) {}

  async create(dto: CreateReportSnapshotDto) {
    const existing = await this.snapshotsRepository.findExisting(
      dto.report_type,
      dto.snapshot_period
    );

    if (existing) {
      throw new Error(ReportErrors.REPORT_SNAPSHOT_ALREADY_EXISTS);
    }

    const snapshot = await this.snapshotsRepository.create({
      snapshotNo: this.generateSnapshotNo(),
      reportType: dto.report_type,
      snapshotPeriod: dto.snapshot_period,
      metricsJson: dto.metrics_json,
      createdBy: dto.created_by
    });

    return this.formatSnapshot(snapshot);
  }

  async list(query: { report_type?: string; snapshot_period?: string }) {
    const items = await this.snapshotsRepository.list({
      reportType: query.report_type,
      snapshotPeriod: query.snapshot_period
    });

    return {
      items: items.map((item) => this.formatSnapshot(item))
    };
  }

  private formatSnapshot(snapshot: any) {
    return {
      snapshot_id: snapshot.id,
      snapshot_no: snapshot.snapshotNo,
      report_type: snapshot.reportType,
      snapshot_period: snapshot.snapshotPeriod,
      metrics_json: snapshot.metricsJson,
      status: snapshot.status,
      created_by: snapshot.createdBy,
      created_at: snapshot.createdAt
    };
  }

  private generateSnapshotNo() {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    return `RSN${date}${ulid()}`;
  }
}
```



---



# 10\. Snapshots Controllers / Module



`apps/reporting-service/src/modules/snapshots/snapshots.controller.ts`



```TypeScript
import { Controller, Get, Query } from '@nestjs/common';
import { SnapshotsService } from './snapshots.service';

@Controller('reports/snapshots')
export class SnapshotsController {
  constructor(private readonly snapshotsService: SnapshotsService) {}

  @Get()
  list(@Query() query: { report_type?: string; snapshot_period?: string }) {
    return this.snapshotsService.list(query);
  }
}
```



`apps/reporting-service/src/modules/snapshots/snapshots.admin.controller.ts`



```TypeScript
import { Body, Controller, Post } from '@nestjs/common';
import { SnapshotsService } from './snapshots.service';
import { CreateReportSnapshotDto } from './dto/create-report-snapshot.dto';

@Controller('admin/reports/snapshots')
export class SnapshotsAdminController {
  constructor(private readonly snapshotsService: SnapshotsService) {}

  @Post()
  create(@Body() dto: CreateReportSnapshotDto) {
    return this.snapshotsService.create(dto);
  }
}
```



`apps/reporting-service/src/modules/snapshots/snapshots.module.ts`



```TypeScript
import { Module } from '@nestjs/common';
import { SnapshotsController } from './snapshots.controller';
import { SnapshotsAdminController } from './snapshots.admin.controller';
import { SnapshotsService } from './snapshots.service';
import { SnapshotsRepository } from './snapshots.repository';

@Module({
  controllers: [SnapshotsController, SnapshotsAdminController],
  providers: [SnapshotsService, SnapshotsRepository],
  exports: [SnapshotsService]
})
export class SnapshotsModule {}
```



---



# 11\. Reporting App Module



`apps/reporting-service/src/app.module.ts`



```TypeScript
import { Module } from '@nestjs/common';
import { HealthModule } from './health/health.module';
import { ReportsModule } from './modules/reports/reports.module';
import { DashboardsModule } from './modules/dashboards/dashboards.module';
import { SnapshotsModule } from './modules/snapshots/snapshots.module';

@Module({
  imports: [
    HealthModule,
    ReportsModule,
    DashboardsModule,
    SnapshotsModule
  ]
})
export class AppModule {}
```



---



# 12\. Reporting Service 当前 API



## 查询端



```HTTP
GET /api/v1/reports/tasks
GET /api/v1/reports/tasks/:task_id

GET /api/v1/reports/dashboards/overview

GET /api/v1/reports/snapshots
```



## 后台端



```HTTP
POST /api/v1/admin/reports/tasks
POST /api/v1/admin/reports/tasks/:task_id/generate
POST /api/v1/admin/reports/tasks/:task_id/export

POST /api/v1/admin/reports/snapshots
```



---



# 13\. Reporting Service 已具备能力



这一版完成后，Reporting Service 支持：



```Plain Text
报表任务创建
报表任务查询
报表任务生成
报表导出标记
Dashboard 指标查询
报表快照创建
报表快照查询
Reporting outbox 事件
```



---



# 14\. 后续必须补强



```Plain Text
统一 AppException
PrismaModule 注入
真实跨服务指标聚合
报表计算任务队列
CSV / XLSX / PDF 导出
调用 File Service 存储报表
大报表分页生成
指标权限控制
BI 查询 DSL
Admin 权限 Guard
Audit Log
```



---



# 15\. 23 个 Service 第一轮完成



到这里，23 个 Service 的第一轮业务骨架已经全部覆盖：



```Plain Text
1. Identity Service
2. KYC Service
3. Product Service
4. Order Service
5. Payment Service
6. Revenue Service
7. Points Service
8. Tradable Points Service
9. NFT Service
10. Eco Power Service
11. Release Service
12. Referral Service
13. Team Reward Service
14. Node Service
15. DAppX Mall Service
16. Finance Service
17. Tax Service
18. Risk Service
19. Approval Service
20. Audit Service
21. Notification Service
22. File Service
23. Reporting Service
```



---



# 16\. 下一阶段建议



下一阶段不建议继续堆新业务 Service，而是进入「工业化补强层」：



```Plain Text
1. 统一 PrismaModule / DatabaseModule
2. 统一 AppException + ErrorCode
3. 统一 Response 格式
4. 统一 Auth Guard / Admin Guard
5. 统一 Audit Interceptor
6. 统一 Idempotency-Key
7. Outbox Publisher
8. Event Consumer 基座
9. 服务间 HTTP Client / RPC Client
10. 配置中心 / Env 校验
11. 日志 / Trace / Metrics
12. Docker Compose 一键启动
13. 数据库 migration 合并
14. E2E 流程测试
```



建议下一步先写：



```Plain Text
Platform Shared Kernel / Common Library
```



也就是把所有服务共用的能力先抽出来。

