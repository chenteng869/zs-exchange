# H30\-14 个 Service：节点服务

下面继续第 14 个 Service：Node Service 节点服务。



# 第 14 个 Service：节点服务



本服务负责：



```Plain Text
城市节点 / 区域节点 / 国家节点 / 全球节点
节点申请
节点 KYB / 协议状态
节点审核
节点暂停 / 恢复 / 终止
节点服务记录
节点奖励 3 / 3 / 2 / 2
NodeRewardCreated / Approved / Recovered 事件预留
```



---



# 1\. Node Service 目录结构



```Plain Text
apps/node-service/
├── src/
│   ├── app.module.ts
│   ├── main.ts
│   ├── health/
│   ├── shared/
│   │   ├── node-errors.ts
│   │   ├── node-events.ts
│   │   ├── node-status.ts
│   │   └── node-types.ts
│   └── modules/
│       ├── nodes/
│       │   ├── nodes.module.ts
│       │   ├── nodes.controller.ts
│       │   ├── nodes.admin.controller.ts
│       │   ├── nodes.repository.ts
│       │   ├── nodes.service.ts
│       │   └── dto/
│       │       ├── apply-node.dto.ts
│       │       ├── approve-node.dto.ts
│       │       └── query-nodes.dto.ts
│       ├── service-records/
│       │   ├── service-records.module.ts
│       │   ├── service-records.controller.ts
│       │   ├── service-records.admin.controller.ts
│       │   ├── service-records.repository.ts
│       │   ├── service-records.service.ts
│       │   └── dto/
│       │       ├── submit-node-service-record.dto.ts
│       │       └── review-node-service-record.dto.ts
│       └── rewards/
│           ├── rewards.module.ts
│           ├── rewards.controller.ts
│           ├── rewards.admin.controller.ts
│           ├── rewards.repository.ts
│           ├── rewards.service.ts
│           └── dto/
│               ├── create-node-reward.dto.ts
│               ├── approve-node-reward.dto.ts
│               ├── recover-node-reward.dto.ts
│               └── query-node-rewards.dto.ts
```



---



# 2\. Prisma 补充表



## 2\.1 NodeProfile



```Plain Text
model NodeProfile {
  id             String    @id
  nodeNo         String    @unique @map("node_no")
  nodeName       String    @map("node_name")
  nodeUserId     String    @map("node_user_id")
  nodeLevel      String    @map("node_level")
  countryCode    String    @map("country_code")
  regionCode     String?   @map("region_code")
  cityCode       String?   @map("city_code")
  kybStatus      String    @default("pending") @map("kyb_status")
  agreementStatus String   @default("pending") @map("agreement_status")
  nodeStatus     String    @default("pending_review") @map("node_status")
  serviceArea    Json?     @map("service_area")
  approvedBy     String?   @map("approved_by")
  approvedAt     DateTime? @map("approved_at")
  suspendedAt    DateTime? @map("suspended_at")
  terminatedAt   DateTime? @map("terminated_at")
  createdAt      DateTime  @default(now()) @map("created_at")
  updatedAt      DateTime  @updatedAt @map("updated_at")
  metadata       Json?

  @@index([nodeUserId])
  @@index([nodeLevel])
  @@index([countryCode])
  @@index([nodeStatus])
  @@map("node_profiles")
}
```



## 2\.2 NodeServiceRecord



```Plain Text
model NodeServiceRecord {
  id             String    @id
  recordNo       String    @unique @map("record_no")
  nodeId         String    @map("node_id")
  nodeUserId     String    @map("node_user_id")
  serviceType    String    @map("service_type")
  relatedUserId  String?   @map("related_user_id")
  relatedOrderId String?   @map("related_order_id")
  evidenceUrl    String?   @map("evidence_url")
  status         String    @default("submitted")
  reviewerId     String?   @map("reviewer_id")
  reviewNote     String?   @map("review_note")
  submittedAt    DateTime  @default(now()) @map("submitted_at")
  reviewedAt     DateTime? @map("reviewed_at")
  createdAt      DateTime  @default(now()) @map("created_at")
  updatedAt      DateTime  @updatedAt @map("updated_at")
  metadata       Json?

  @@index([nodeId])
  @@index([nodeUserId])
  @@index([status])
  @@map("node_service_records")
}
```



## 2\.3 NodeReward



```Plain Text
model NodeReward {
  id            String    @id
  rewardNo      String    @unique @map("reward_no")
  orderId       String    @map("order_id")
  buyerId       String    @map("buyer_id")
  nodeId        String    @map("node_id")
  nodeUserId    String    @map("node_user_id")
  nodeLevel     String    @map("node_level")
  rewardRate    Decimal   @map("reward_rate") @db.Decimal(36, 18)
  orderAmount   Decimal   @map("order_amount") @db.Decimal(36, 18)
  rewardAmount  Decimal   @map("reward_amount") @db.Decimal(36, 18)
  taxAmount     Decimal   @default(0) @map("tax_amount") @db.Decimal(36, 18)
  netAmount     Decimal   @map("net_amount") @db.Decimal(36, 18)
  currency      String
  status        String    @default("created")
  riskStatus    String    @default("normal") @map("risk_status")
  lockUntil     DateTime? @map("lock_until")
  reviewedBy    String?   @map("reviewed_by")
  reviewNote    String?   @map("review_note")
  approvedAt    DateTime? @map("approved_at")
  payableAt     DateTime? @map("payable_at")
  paidAt        DateTime? @map("paid_at")
  recoveredAt   DateTime? @map("recovered_at")
  createdAt     DateTime  @default(now()) @map("created_at")
  updatedAt     DateTime  @updatedAt @map("updated_at")
  metadata      Json?

  @@index([orderId])
  @@index([buyerId])
  @@index([nodeId])
  @@index([nodeUserId])
  @@index([status])
  @@map("node_rewards")
}
```



---



# 3\. Shared 常量



`apps/node-service/src/shared/node-events.ts`



```TypeScript
export const NodeEvents = {
  NODE_APPLIED: 'node.applied.v1',
  NODE_APPROVED: 'node.approved.v1',
  NODE_SUSPENDED: 'node.suspended.v1',
  NODE_RESTORED: 'node.restored.v1',
  NODE_TERMINATED: 'node.terminated.v1',
  NODE_SERVICE_RECORD_SUBMITTED: 'node.service_record_submitted.v1',
  NODE_SERVICE_RECORD_APPROVED: 'node.service_record_approved.v1',
  NODE_REWARD_CREATED: 'node.reward_created.v1',
  NODE_REWARD_APPROVED: 'node.reward_approved.v1',
  NODE_REWARD_PAYABLE: 'node.reward_payable.v1',
  NODE_REWARD_RECOVERED: 'node.reward_recovered.v1'
} as const;
```



`apps/node-service/src/shared/node-errors.ts`



```TypeScript
export const NodeErrors = {
  NODE_NOT_FOUND: 'NODE_NOT_FOUND',
  NODE_ALREADY_EXISTS: 'NODE_ALREADY_EXISTS',
  NODE_STATUS_INVALID: 'NODE_STATUS_INVALID',
  NODE_SERVICE_RECORD_NOT_FOUND: 'NODE_SERVICE_RECORD_NOT_FOUND',
  NODE_SERVICE_RECORD_STATUS_INVALID: 'NODE_SERVICE_RECORD_STATUS_INVALID',
  NODE_REWARD_ALREADY_EXISTS: 'NODE_REWARD_ALREADY_EXISTS',
  NODE_REWARD_NOT_FOUND: 'NODE_REWARD_NOT_FOUND',
  NODE_REWARD_STATUS_INVALID: 'NODE_REWARD_STATUS_INVALID',
  NODE_REWARD_AMOUNT_INVALID: 'NODE_REWARD_AMOUNT_INVALID',
  NODE_REWARD_NOT_RECOVERABLE: 'NODE_REWARD_NOT_RECOVERABLE'
} as const;
```



`apps/node-service/src/shared/node-status.ts`



```TypeScript
export const NodeStatus = {
  PENDING_REVIEW: 'pending_review',
  ACTIVE: 'active',
  SUSPENDED: 'suspended',
  TERMINATED: 'terminated',
  REJECTED: 'rejected'
} as const;

export const NodeRewardStatus = {
  CREATED: 'created',
  LOCKED: 'locked',
  RISK_CHECKING: 'risk_checking',
  APPROVED: 'approved',
  PAYABLE: 'payable',
  PAID: 'paid',
  RECOVERED: 'recovered',
  CANCELLED: 'cancelled',
  RISK_HOLD: 'risk_hold'
} as const;

export const NodeRewardTransitions: Record = {
  created: ['locked', 'risk_checking', 'cancelled'],
  locked: ['risk_checking', 'approved', 'cancelled'],
  risk_checking: ['approved', 'payable', 'cancelled', 'risk_hold'],
  approved: ['payable', 'cancelled', 'recovered'],
  payable: ['paid', 'recovered'],
  paid: ['recovered'],
  recovered: [],
  cancelled: [],
  risk_hold: ['approved', 'cancelled', 'recovered']
};

export function canTransitNodeRewardStatus(from: string, to: string): boolean {
  return NodeRewardTransitions[from]?.includes(to) ?? false;
}
```



`apps/node-service/src/shared/node-types.ts`



```TypeScript
export const NodeLevels = {
  CITY: 'city',
  REGION: 'region',
  COUNTRY: 'country',
  GLOBAL: 'global',
  STRATEGIC: 'strategic'
} as const;

export const NodeRewardRates: Record = {
  city: '0.03',
  region: '0.03',
  country: '0.02',
  global: '0.02',
  strategic: '0.02'
};
```



---



# 4\. Nodes DTO



`apps/node-service/src/modules/nodes/dto/apply-node.dto.ts`



```TypeScript
import { IsOptional, IsString } from 'class-validator';

export class ApplyNodeDto {
  @IsString()
  node_name!: string;

  @IsString()
  node_user_id!: string;

  @IsString()
  node_level!: string;

  @IsString()
  country_code!: string;

  @IsOptional()
  @IsString()
  region_code?: string;

  @IsOptional()
  @IsString()
  city_code?: string;
}
```



`apps/node-service/src/modules/nodes/dto/approve-node.dto.ts`



```TypeScript
import { IsOptional, IsString } from 'class-validator';

export class ApproveNodeDto {
  @IsString()
  reviewer_id!: string;

  @IsOptional()
  @IsString()
  review_note?: string;
}
```



`apps/node-service/src/modules/nodes/dto/query-nodes.dto.ts`



```TypeScript
import { IsOptional, IsString } from 'class-validator';

export class QueryNodesDto {
  @IsOptional()
  @IsString()
  node_user_id?: string;

  @IsOptional()
  @IsString()
  node_level?: string;

  @IsOptional()
  @IsString()
  country_code?: string;

  @IsOptional()
  @IsString()
  node_status?: string;

  @IsOptional()
  page?: number;

  @IsOptional()
  page_size?: number;
}
```



---



# 5\. Nodes Repository / Service



`apps/node-service/src/modules/nodes/nodes.repository.ts`



```TypeScript
import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { ulid } from 'ulid';

const prisma = new PrismaClient();

@Injectable()
export class NodesRepository {
  findById(nodeId: string) {
    return prisma.nodeProfile.findUnique({ where: { id: nodeId } });
  }

  findByUserId(nodeUserId: string) {
    return prisma.nodeProfile.findFirst({ where: { nodeUserId } });
  }

  findMany(params: {
    nodeUserId?: string;
    nodeLevel?: string;
    countryCode?: string;
    nodeStatus?: string;
    page: number;
    pageSize: number;
  }) {
    return prisma.nodeProfile.findMany({
      where: {
        nodeUserId: params.nodeUserId,
        nodeLevel: params.nodeLevel,
        countryCode: params.countryCode,
        nodeStatus: params.nodeStatus
      },
      orderBy: { createdAt: 'desc' },
      skip: (params.page - 1) * params.pageSize,
      take: params.pageSize
    });
  }

  count(params: {
    nodeUserId?: string;
    nodeLevel?: string;
    countryCode?: string;
    nodeStatus?: string;
  }) {
    return prisma.nodeProfile.count({
      where: {
        nodeUserId: params.nodeUserId,
        nodeLevel: params.nodeLevel,
        countryCode: params.countryCode,
        nodeStatus: params.nodeStatus
      }
    });
  }

  apply(data: {
    nodeNo: string;
    nodeName: string;
    nodeUserId: string;
    nodeLevel: string;
    countryCode: string;
    regionCode?: string;
    cityCode?: string;
  }) {
    return prisma.$transaction(async (tx) => {
      const node = await tx.nodeProfile.create({
        data: {
          id: ulid(),
          nodeNo: data.nodeNo,
          nodeName: data.nodeName,
          nodeUserId: data.nodeUserId,
          nodeLevel: data.nodeLevel,
          countryCode: data.countryCode,
          regionCode: data.regionCode,
          cityCode: data.cityCode,
          kybStatus: 'pending',
          agreementStatus: 'pending',
          nodeStatus: 'pending_review'
        }
      });

      await tx.outboxEvent.create({
        data: {
          id: ulid(),
          eventType: 'node.applied.v1',
          payload: {
            node_id: node.id,
            node_no: node.nodeNo,
            node_user_id: node.nodeUserId,
            node_level: node.nodeLevel
          },
          status: 'pending',
          retryCount: 0
        }
      });

      return node;
    });
  }

  updateStatus(params: {
    nodeId: string;
    status: string;
    reviewerId?: string;
    reviewNote?: string;
    eventType?: string;
  }) {
    return prisma.$transaction(async (tx) => {
      const node = await tx.nodeProfile.update({
        where: { id: params.nodeId },
        data: {
          nodeStatus: params.status,
          approvedBy: params.status === 'active' ? params.reviewerId : undefined,
          approvedAt: params.status === 'active' ? new Date() : undefined,
          suspendedAt: params.status === 'suspended' ? new Date() : undefined,
          terminatedAt: params.status === 'terminated' ? new Date() : undefined,
          metadata: params.reviewNote ? { review_note: params.reviewNote } : undefined
        }
      });

      if (params.eventType) {
        await tx.outboxEvent.create({
          data: {
            id: ulid(),
            eventType: params.eventType,
            payload: {
              node_id: node.id,
              node_no: node.nodeNo,
              node_user_id: node.nodeUserId,
              node_level: node.nodeLevel,
              node_status: node.nodeStatus
            },
            status: 'pending',
            retryCount: 0
          }
        });
      }

      return node;
    });
  }
}
```



`apps/node-service/src/modules/nodes/nodes.service.ts`



```TypeScript
import { Injectable } from '@nestjs/common';
import { ulid } from 'ulid';
import { NodesRepository } from './nodes.repository';
import { ApplyNodeDto } from './dto/apply-node.dto';
import { ApproveNodeDto } from './dto/approve-node.dto';
import { QueryNodesDto } from './dto/query-nodes.dto';
import { NodeErrors } from '../../shared/node-errors';
import { NodeStatus } from '../../shared/node-status';

@Injectable()
export class NodesService {
  constructor(private readonly nodesRepository: NodesRepository) {}

  async apply(dto: ApplyNodeDto) {
    const existing = await this.nodesRepository.findByUserId(dto.node_user_id);
    if (existing) throw new Error(NodeErrors.NODE_ALREADY_EXISTS);

    const node = await this.nodesRepository.apply({
      nodeNo: this.generateNodeNo(),
      nodeName: dto.node_name,
      nodeUserId: dto.node_user_id,
      nodeLevel: dto.node_level,
      countryCode: dto.country_code,
      regionCode: dto.region_code,
      cityCode: dto.city_code
    });

    return this.formatNode(node);
  }

  async detail(nodeId: string) {
    const node = await this.nodesRepository.findById(nodeId);
    if (!node) throw new Error(NodeErrors.NODE_NOT_FOUND);
    return this.formatNode(node);
  }

  async list(query: QueryNodesDto) {
    const page = Number(query.page || 1);
    const pageSize = Math.min(Number(query.page_size || 20), 100);

    const [items, total] = await Promise.all([
      this.nodesRepository.findMany({
        nodeUserId: query.node_user_id,
        nodeLevel: query.node_level,
        countryCode: query.country_code,
        nodeStatus: query.node_status,
        page,
        pageSize
      }),
      this.nodesRepository.count({
        nodeUserId: query.node_user_id,
        nodeLevel: query.node_level,
        countryCode: query.country_code,
        nodeStatus: query.node_status
      })
    ]);

    return {
      items: items.map((node) => this.formatNode(node)),
      pagination: {
        page,
        page_size: pageSize,
        total,
        total_pages: Math.ceil(total / pageSize)
      }
    };
  }

  async approve(nodeId: string, dto: ApproveNodeDto) {
    const node = await this.nodesRepository.findById(nodeId);
    if (!node) throw new Error(NodeErrors.NODE_NOT_FOUND);
    if (node.nodeStatus !== NodeStatus.PENDING_REVIEW) {
      throw new Error(NodeErrors.NODE_STATUS_INVALID);
    }

    const updated = await this.nodesRepository.updateStatus({
      nodeId,
      status: NodeStatus.ACTIVE,
      reviewerId: dto.reviewer_id,
      reviewNote: dto.review_note,
      eventType: 'node.approved.v1'
    });

    return this.formatNode(updated);
  }

  async suspend(nodeId: string, reason?: string) {
    const node = await this.nodesRepository.findById(nodeId);
    if (!node) throw new Error(NodeErrors.NODE_NOT_FOUND);
    if (node.nodeStatus !== NodeStatus.ACTIVE) {
      throw new Error(NodeErrors.NODE_STATUS_INVALID);
    }

    const updated = await this.nodesRepository.updateStatus({
      nodeId,
      status: NodeStatus.SUSPENDED,
      reviewNote: reason,
      eventType: 'node.suspended.v1'
    });

    return this.formatNode(updated);
  }

  async restore(nodeId: string) {
    const node = await this.nodesRepository.findById(nodeId);
    if (!node) throw new Error(NodeErrors.NODE_NOT_FOUND);
    if (node.nodeStatus !== NodeStatus.SUSPENDED) {
      throw new Error(NodeErrors.NODE_STATUS_INVALID);
    }

    const updated = await this.nodesRepository.updateStatus({
      nodeId,
      status: NodeStatus.ACTIVE,
      eventType: 'node.restored.v1'
    });

    return this.formatNode(updated);
  }

  async terminate(nodeId: string, reason?: string) {
    const node = await this.nodesRepository.findById(nodeId);
    if (!node) throw new Error(NodeErrors.NODE_NOT_FOUND);

    const updated = await this.nodesRepository.updateStatus({
      nodeId,
      status: NodeStatus.TERMINATED,
      reviewNote: reason,
      eventType: 'node.terminated.v1'
    });

    return this.formatNode(updated);
  }

  private formatNode(node: any) {
    return {
      node_id: node.id,
      node_no: node.nodeNo,
      node_name: node.nodeName,
      node_user_id: node.nodeUserId,
      node_level: node.nodeLevel,
      country_code: node.countryCode,
      region_code: node.regionCode,
      city_code: node.cityCode,
      kyb_status: node.kybStatus,
      agreement_status: node.agreementStatus,
      node_status: node.nodeStatus,
      approved_by: node.approvedBy,
      approved_at: node.approvedAt
    };
  }

  private generateNodeNo() {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    return `NOD${date}${ulid()}`;
  }
}
```



---



# 6\. Nodes Controllers / Module



`apps/node-service/src/modules/nodes/nodes.controller.ts`



```TypeScript
import { Controller, Get, Param, Query } from '@nestjs/common';
import { NodesService } from './nodes.service';
import { QueryNodesDto } from './dto/query-nodes.dto';

@Controller('nodes')
export class NodesController {
  constructor(private readonly nodesService: NodesService) {}

  @Get()
  list(@Query() query: QueryNodesDto) {
    return this.nodesService.list(query);
  }

  @Get(':node_id')
  detail(@Param('node_id') nodeId: string) {
    return this.nodesService.detail(nodeId);
  }
}
```



`apps/node-service/src/modules/nodes/nodes.admin.controller.ts`



```TypeScript
import { Body, Controller, Param, Post } from '@nestjs/common';
import { NodesService } from './nodes.service';
import { ApplyNodeDto } from './dto/apply-node.dto';
import { ApproveNodeDto } from './dto/approve-node.dto';

@Controller('admin/nodes')
export class NodesAdminController {
  constructor(private readonly nodesService: NodesService) {}

  @Post('apply')
  apply(@Body() dto: ApplyNodeDto) {
    return this.nodesService.apply(dto);
  }

  @Post(':node_id/approve')
  approve(@Param('node_id') nodeId: string, @Body() dto: ApproveNodeDto) {
    return this.nodesService.approve(nodeId, dto);
  }

  @Post(':node_id/suspend')
  suspend(@Param('node_id') nodeId: string, @Body() dto: { reason?: string }) {
    return this.nodesService.suspend(nodeId, dto.reason);
  }

  @Post(':node_id/restore')
  restore(@Param('node_id') nodeId: string) {
    return this.nodesService.restore(nodeId);
  }

  @Post(':node_id/terminate')
  terminate(@Param('node_id') nodeId: string, @Body() dto: { reason?: string }) {
    return this.nodesService.terminate(nodeId, dto.reason);
  }
}
```



`apps/node-service/src/modules/nodes/nodes.module.ts`



```TypeScript
import { Module } from '@nestjs/common';
import { NodesController } from './nodes.controller';
import { NodesAdminController } from './nodes.admin.controller';
import { NodesService } from './nodes.service';
import { NodesRepository } from './nodes.repository';

@Module({
  controllers: [NodesController, NodesAdminController],
  providers: [NodesService, NodesRepository],
  exports: [NodesService]
})
export class NodesModule {}
```



---



# 7\. Service Records



`apps/node-service/src/modules/service-records/dto/submit-node-service-record.dto.ts`



```TypeScript
import { IsOptional, IsString } from 'class-validator';

export class SubmitNodeServiceRecordDto {
  @IsString()
  node_id!: string;

  @IsString()
  node_user_id!: string;

  @IsString()
  service_type!: string;

  @IsOptional()
  @IsString()
  related_user_id?: string;

  @IsOptional()
  @IsString()
  related_order_id?: string;

  @IsOptional()
  @IsString()
  evidence_url?: string;
}
```



`apps/node-service/src/modules/service-records/dto/review-node-service-record.dto.ts`



```TypeScript
import { IsOptional, IsString } from 'class-validator';

export class ReviewNodeServiceRecordDto {
  @IsString()
  reviewer_id!: string;

  @IsString()
  status!: 'approved' | 'rejected' | 'need_more_info';

  @IsOptional()
  @IsString()
  review_note?: string;
}
```



`apps/node-service/src/modules/service-records/service-records.repository.ts`



```TypeScript
import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { ulid } from 'ulid';

const prisma = new PrismaClient();

@Injectable()
export class ServiceRecordsRepository {
  create(data: {
    recordNo: string;
    nodeId: string;
    nodeUserId: string;
    serviceType: string;
    relatedUserId?: string;
    relatedOrderId?: string;
    evidenceUrl?: string;
  }) {
    return prisma.nodeServiceRecord.create({
      data: {
        id: ulid(),
        recordNo: data.recordNo,
        nodeId: data.nodeId,
        nodeUserId: data.nodeUserId,
        serviceType: data.serviceType,
        relatedUserId: data.relatedUserId,
        relatedOrderId: data.relatedOrderId,
        evidenceUrl: data.evidenceUrl,
        status: 'submitted'
      }
    });
  }

  findById(recordId: string) {
    return prisma.nodeServiceRecord.findUnique({ where: { id: recordId } });
  }

  review(recordId: string, reviewerId: string, status: string, reviewNote?: string) {
    return prisma.nodeServiceRecord.update({
      where: { id: recordId },
      data: {
        status,
        reviewerId,
        reviewNote,
        reviewedAt: new Date()
      }
    });
  }
}
```



`apps/node-service/src/modules/service-records/service-records.service.ts`



```TypeScript
import { Injectable } from '@nestjs/common';
import { ulid } from 'ulid';
import { ServiceRecordsRepository } from './service-records.repository';
import { SubmitNodeServiceRecordDto } from './dto/submit-node-service-record.dto';
import { ReviewNodeServiceRecordDto } from './dto/review-node-service-record.dto';
import { NodeErrors } from '../../shared/node-errors';

@Injectable()
export class ServiceRecordsService {
  constructor(private readonly recordsRepository: ServiceRecordsRepository) {}

  async submit(dto: SubmitNodeServiceRecordDto) {
    const record = await this.recordsRepository.create({
      recordNo: this.generateRecordNo(),
      nodeId: dto.node_id,
      nodeUserId: dto.node_user_id,
      serviceType: dto.service_type,
      relatedUserId: dto.related_user_id,
      relatedOrderId: dto.related_order_id,
      evidenceUrl: dto.evidence_url
    });

    return this.formatRecord(record);
  }

  async review(recordId: string, dto: ReviewNodeServiceRecordDto) {
    const record = await this.recordsRepository.findById(recordId);
    if (!record) throw new Error(NodeErrors.NODE_SERVICE_RECORD_NOT_FOUND);
    if (record.status !== 'submitted') {
      throw new Error(NodeErrors.NODE_SERVICE_RECORD_STATUS_INVALID);
    }

    const updated = await this.recordsRepository.review(
      recordId,
      dto.reviewer_id,
      dto.status,
      dto.review_note
    );

    return this.formatRecord(updated);
  }

  private formatRecord(record: any) {
    return {
      record_id: record.id,
      record_no: record.recordNo,
      node_id: record.nodeId,
      node_user_id: record.nodeUserId,
      service_type: record.serviceType,
      related_user_id: record.relatedUserId,
      related_order_id: record.relatedOrderId,
      evidence_url: record.evidenceUrl,
      status: record.status,
      reviewer_id: record.reviewerId,
      review_note: record.reviewNote
    };
  }

  private generateRecordNo() {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    return `NSR${date}${ulid()}`;
  }
}
```



`apps/node-service/src/modules/service-records/service-records.controller.ts`



```TypeScript
import { Body, Controller, Post } from '@nestjs/common';
import { ServiceRecordsService } from './service-records.service';
import { SubmitNodeServiceRecordDto } from './dto/submit-node-service-record.dto';

@Controller('nodes/service-records')
export class ServiceRecordsController {
  constructor(private readonly recordsService: ServiceRecordsService) {}

  @Post()
  submit(@Body() dto: SubmitNodeServiceRecordDto) {
    return this.recordsService.submit(dto);
  }
}
```



`apps/node-service/src/modules/service-records/service-records.admin.controller.ts`



```TypeScript
import { Body, Controller, Param, Post } from '@nestjs/common';
import { ServiceRecordsService } from './service-records.service';
import { ReviewNodeServiceRecordDto } from './dto/review-node-service-record.dto';

@Controller('admin/nodes/service-records')
export class ServiceRecordsAdminController {
  constructor(private readonly recordsService: ServiceRecordsService) {}

  @Post(':record_id/review')
  review(
    @Param('record_id') recordId: string,
    @Body() dto: ReviewNodeServiceRecordDto
  ) {
    return this.recordsService.review(recordId, dto);
  }
}
```



`apps/node-service/src/modules/service-records/service-records.module.ts`



```TypeScript
import { Module } from '@nestjs/common';
import { ServiceRecordsController } from './service-records.controller';
import { ServiceRecordsAdminController } from './service-records.admin.controller';
import { ServiceRecordsService } from './service-records.service';
import { ServiceRecordsRepository } from './service-records.repository';

@Module({
  controllers: [ServiceRecordsController, ServiceRecordsAdminController],
  providers: [ServiceRecordsService, ServiceRecordsRepository],
  exports: [ServiceRecordsService]
})
export class ServiceRecordsModule {}
```



---



# 8\. Node Rewards DTO



`apps/node-service/src/modules/rewards/dto/create-node-reward.dto.ts`



```TypeScript
import { IsString } from 'class-validator';

export class CreateNodeRewardDto {
  @IsString()
  order_id!: string;

  @IsString()
  buyer_id!: string;

  @IsString()
  node_id!: string;

  @IsString()
  node_user_id!: string;

  @IsString()
  node_level!: string;

  @IsString()
  order_amount!: string;

  @IsString()
  currency!: string;

  @IsString()
  lock_until!: string;
}
```



`apps/node-service/src/modules/rewards/dto/approve-node-reward.dto.ts`



```TypeScript
import { IsOptional, IsString } from 'class-validator';

export class ApproveNodeRewardDto {
  @IsString()
  reviewer_id!: string;

  @IsOptional()
  @IsString()
  review_note?: string;
}
```



`apps/node-service/src/modules/rewards/dto/recover-node-reward.dto.ts`



```TypeScript
import { IsString } from 'class-validator';

export class RecoverNodeRewardDto {
  @IsString()
  reason!: string;

  @IsString()
  approval_id!: string;
}
```



`apps/node-service/src/modules/rewards/dto/query-node-rewards.dto.ts`



```TypeScript
import { IsOptional, IsString } from 'class-validator';

export class QueryNodeRewardsDto {
  @IsOptional()
  @IsString()
  reward_no?: string;

  @IsOptional()
  @IsString()
  order_id?: string;

  @IsOptional()
  @IsString()
  node_id?: string;

  @IsOptional()
  @IsString()
  node_user_id?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  page?: number;

  @IsOptional()
  page_size?: number;
}
```



---



# 9\. Node Rewards Repository / Service



`apps/node-service/src/modules/rewards/rewards.repository.ts`



```TypeScript
import { Injectable } from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';
import { ulid } from 'ulid';

const prisma = new PrismaClient();

@Injectable()
export class RewardsRepository {
  findById(rewardId: string) {
    return prisma.nodeReward.findUnique({ where: { id: rewardId } });
  }

  findByOrderAndNode(orderId: string, nodeId: string) {
    return prisma.nodeReward.findFirst({ where: { orderId, nodeId } });
  }

  findMany(params: {
    rewardNo?: string;
    orderId?: string;
    nodeId?: string;
    nodeUserId?: string;
    status?: string;
    page: number;
    pageSize: number;
  }) {
    return prisma.nodeReward.findMany({
      where: {
        rewardNo: params.rewardNo,
        orderId: params.orderId,
        nodeId: params.nodeId,
        nodeUserId: params.nodeUserId,
        status: params.status
      },
      orderBy: { createdAt: 'desc' },
      skip: (params.page - 1) * params.pageSize,
      take: params.pageSize
    });
  }

  count(params: {
    rewardNo?: string;
    orderId?: string;
    nodeId?: string;
    nodeUserId?: string;
    status?: string;
  }) {
    return prisma.nodeReward.count({
      where: {
        rewardNo: params.rewardNo,
        orderId: params.orderId,
        nodeId: params.nodeId,
        nodeUserId: params.nodeUserId,
        status: params.status
      }
    });
  }

  create(data: {
    rewardNo: string;
    orderId: string;
    buyerId: string;
    nodeId: string;
    nodeUserId: string;
    nodeLevel: string;
    rewardRate: string;
    orderAmount: string;
    rewardAmount: string;
    taxAmount: string;
    netAmount: string;
    currency: string;
    lockUntil: Date;
  }) {
    return prisma.$transaction(async (tx) => {
      const reward = await tx.nodeReward.create({
        data: {
          id: ulid(),
          rewardNo: data.rewardNo,
          orderId: data.orderId,
          buyerId: data.buyerId,
          nodeId: data.nodeId,
          nodeUserId: data.nodeUserId,
          nodeLevel: data.nodeLevel,
          rewardRate: new Prisma.Decimal(data.rewardRate),
          orderAmount: new Prisma.Decimal(data.orderAmount),
          rewardAmount: new Prisma.Decimal(data.rewardAmount),
          taxAmount: new Prisma.Decimal(data.taxAmount),
          netAmount: new Prisma.Decimal(data.netAmount),
          currency: data.currency,
          status: 'locked',
          lockUntil: data.lockUntil
        }
      });

      await tx.outboxEvent.create({
        data: {
          id: ulid(),
          eventType: 'node.reward_created.v1',
          payload: {
            reward_id: reward.id,
            reward_no: reward.rewardNo,
            order_id: reward.orderId,
            node_id: reward.nodeId,
            node_user_id: reward.nodeUserId,
            node_level: reward.nodeLevel,
            reward_amount: reward.rewardAmount.toString(),
            currency: reward.currency
          },
          status: 'pending',
          retryCount: 0
        }
      });

      return reward;
    });
  }

  updateStatus(params: {
    rewardId: string;
    status: string;
    reviewerId?: string;
    reviewNote?: string;
    eventType?: string;
  }) {
    return prisma.$transaction(async (tx) => {
      const updated = await tx.nodeReward.update({
        where: { id: params.rewardId },
        data: {
          status: params.status,
          reviewedBy: params.reviewerId,
          reviewNote: params.reviewNote,
          approvedAt: params.status === 'approved' ? new Date() : undefined,
          payableAt: params.status === 'payable' ? new Date() : undefined,
          paidAt: params.status === 'paid' ? new Date() : undefined,
          recoveredAt: params.status === 'recovered' ? new Date() : undefined
        }
      });

      if (params.eventType) {
        await tx.outboxEvent.create({
          data: {
            id: ulid(),
            eventType: params.eventType,
            payload: {
              reward_id: updated.id,
              reward_no: updated.rewardNo,
              order_id: updated.orderId,
              node_id: updated.nodeId,
              status: updated.status
            },
            status: 'pending',
            retryCount: 0
          }
        });
      }

      return updated;
    });
  }
}
```



`apps/node-service/src/modules/rewards/rewards.service.ts`



```TypeScript
import { Injectable } from '@nestjs/common';
import Decimal from 'decimal.js';
import { ulid } from 'ulid';
import { RewardsRepository } from './rewards.repository';
import { CreateNodeRewardDto } from './dto/create-node-reward.dto';
import { ApproveNodeRewardDto } from './dto/approve-node-reward.dto';
import { RecoverNodeRewardDto } from './dto/recover-node-reward.dto';
import { QueryNodeRewardsDto } from './dto/query-node-rewards.dto';
import { NodeErrors } from '../../shared/node-errors';
import { NodeRewardRates } from '../../shared/node-types';
import { NodeRewardStatus, canTransitNodeRewardStatus } from '../../shared/node-status';

@Injectable()
export class RewardsService {
  constructor(private readonly rewardsRepository: RewardsRepository) {}

  async create(dto: CreateNodeRewardDto) {
    const rewardRate = NodeRewardRates[dto.node_level];
    if (!rewardRate) throw new Error(NodeErrors.NODE_REWARD_AMOUNT_INVALID);

    const existing = await this.rewardsRepository.findByOrderAndNode(dto.order_id, dto.node_id);
    if (existing) throw new Error(NodeErrors.NODE_REWARD_ALREADY_EXISTS);

    const rewardAmount = new Decimal(dto.order_amount).mul(rewardRate);
    const taxAmount = rewardAmount.mul('0.10');
    const netAmount = rewardAmount.sub(taxAmount);

    const reward = await this.rewardsRepository.create({
      rewardNo: this.generateRewardNo(),
      orderId: dto.order_id,
      buyerId: dto.buyer_id,
      nodeId: dto.node_id,
      nodeUserId: dto.node_user_id,
      nodeLevel: dto.node_level,
      rewardRate: new Decimal(rewardRate).toFixed(18),
      orderAmount: new Decimal(dto.order_amount).toFixed(18),
      rewardAmount: rewardAmount.toFixed(18),
      taxAmount: taxAmount.toFixed(18),
      netAmount: netAmount.toFixed(18),
      currency: dto.currency,
      lockUntil: new Date(dto.lock_until)
    });

    return this.formatReward(reward);
  }

  async list(query: QueryNodeRewardsDto) {
    const page = Number(query.page || 1);
    const pageSize = Math.min(Number(query.page_size || 20), 100);

    const [items, total] = await Promise.all([
      this.rewardsRepository.findMany({
        rewardNo: query.reward_no,
        orderId: query.order_id,
        nodeId: query.node_id,
        nodeUserId: query.node_user_id,
        status: query.status,
        page,
        pageSize
      }),
      this.rewardsRepository.count({
        rewardNo: query.reward_no,
        orderId: query.order_id,
        nodeId: query.node_id,
        nodeUserId: query.node_user_id,
        status: query.status
      })
    ]);

    return {
      items: items.map((item) => this.formatReward(item)),
      pagination: {
        page,
        page_size: pageSize,
        total,
        total_pages: Math.ceil(total / pageSize)
      }
    };
  }

  async detail(rewardId: string) {
    const reward = await this.rewardsRepository.findById(rewardId);
    if (!reward) throw new Error(NodeErrors.NODE_REWARD_NOT_FOUND);
    return this.formatReward(reward);
  }

  async approve(rewardId: string, dto: ApproveNodeRewardDto) {
    const reward = await this.rewardsRepository.findById(rewardId);
    if (!reward) throw new Error(NodeErrors.NODE_REWARD_NOT_FOUND);
    if (!canTransitNodeRewardStatus(reward.status, NodeRewardStatus.APPROVED)) {
      throw new Error(NodeErrors.NODE_REWARD_STATUS_INVALID);
    }

    const updated = await this.rewardsRepository.updateStatus({
      rewardId,
      status: NodeRewardStatus.APPROVED,
      reviewerId: dto.reviewer_id,
      reviewNote: dto.review_note,
      eventType: 'node.reward_approved.v1'
    });

    return this.formatReward(updated);
  }

  async markPayable(rewardId: string) {
    const reward = await this.rewardsRepository.findById(rewardId);
    if (!reward) throw new Error(NodeErrors.NODE_REWARD_NOT_FOUND);
    if (!canTransitNodeRewardStatus(reward.status, NodeRewardStatus.PAYABLE)) {
      throw new Error(NodeErrors.NODE_REWARD_STATUS_INVALID);
    }

    const updated = await this.rewardsRepository.updateStatus({
      rewardId,
      status: NodeRewardStatus.PAYABLE,
      eventType: 'node.reward_payable.v1'
    });

    return this.formatReward(updated);
  }

  async recover(rewardId: string, dto: RecoverNodeRewardDto) {
    const reward = await this.rewardsRepository.findById(rewardId);
    if (!reward) throw new Error(NodeErrors.NODE_REWARD_NOT_FOUND);

    const updated = await this.rewardsRepository.updateStatus({
      rewardId,
      status: NodeRewardStatus.RECOVERED,
      reviewNote: dto.reason,
      eventType: 'node.reward_recovered.v1'
    });

    return {
      ...this.formatReward(updated),
      approval_id: dto.approval_id
    };
  }

  private formatReward(reward: any) {
    return {
      reward_id: reward.id,
      reward_no: reward.rewardNo,
      order_id: reward.orderId,
      buyer_id: reward.buyerId,
      node_id: reward.nodeId,
      node_user_id: reward.nodeUserId,
      node_level: reward.nodeLevel,
      reward_rate: reward.rewardRate.toString(),
      order_amount: reward.orderAmount.toString(),
      reward_amount: reward.rewardAmount.toString(),
      tax_amount: reward.taxAmount.toString(),
      net_amount: reward.netAmount.toString(),
      currency: reward.currency,
      status: reward.status,
      risk_status: reward.riskStatus,
      lock_until: reward.lockUntil
    };
  }

  private generateRewardNo() {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    return `NRW${date}${ulid()}`;
  }
}
```



---



# 10\. Node Rewards Controllers / Module



`apps/node-service/src/modules/rewards/rewards.controller.ts`



```TypeScript
import { Controller, Get, Param, Query } from '@nestjs/common';
import { RewardsService } from './rewards.service';
import { QueryNodeRewardsDto } from './dto/query-node-rewards.dto';

@Controller('nodes/rewards')
export class RewardsController {
  constructor(private readonly rewardsService: RewardsService) {}

  @Get()
  list(@Query() query: QueryNodeRewardsDto) {
    return this.rewardsService.list(query);
  }

  @Get(':reward_id')
  detail(@Param('reward_id') rewardId: string) {
    return this.rewardsService.detail(rewardId);
  }
}
```



`apps/node-service/src/modules/rewards/rewards.admin.controller.ts`



```TypeScript
import { Body, Controller, Param, Post } from '@nestjs/common';
import { RewardsService } from './rewards.service';
import { CreateNodeRewardDto } from './dto/create-node-reward.dto';
import { ApproveNodeRewardDto } from './dto/approve-node-reward.dto';
import { RecoverNodeRewardDto } from './dto/recover-node-reward.dto';

@Controller('admin/nodes/rewards')
export class RewardsAdminController {
  constructor(private readonly rewardsService: RewardsService) {}

  @Post()
  create(@Body() dto: CreateNodeRewardDto) {
    return this.rewardsService.create(dto);
  }

  @Post(':reward_id/approve')
  approve(@Param('reward_id') rewardId: string, @Body() dto: ApproveNodeRewardDto) {
    return this.rewardsService.approve(rewardId, dto);
  }

  @Post(':reward_id/payable')
  payable(@Param('reward_id') rewardId: string) {
    return this.rewardsService.markPayable(rewardId);
  }

  @Post(':reward_id/recover')
  recover(@Param('reward_id') rewardId: string, @Body() dto: RecoverNodeRewardDto) {
    return this.rewardsService.recover(rewardId, dto);
  }
}
```



`apps/node-service/src/modules/rewards/rewards.module.ts`



```TypeScript
import { Module } from '@nestjs/common';
import { RewardsController } from './rewards.controller';
import { RewardsAdminController } from './rewards.admin.controller';
import { RewardsService } from './rewards.service';
import { RewardsRepository } from './rewards.repository';

@Module({
  controllers: [RewardsController, RewardsAdminController],
  providers: [RewardsService, RewardsRepository],
  exports: [RewardsService]
})
export class RewardsModule {}
```



---



# 11\. Node App Module



`apps/node-service/src/app.module.ts`



```TypeScript
import { Module } from '@nestjs/common';
import { HealthModule } from './health/health.module';
import { NodesModule } from './modules/nodes/nodes.module';
import { ServiceRecordsModule } from './modules/service-records/service-records.module';
import { RewardsModule } from './modules/rewards/rewards.module';

@Module({
  imports: [
    HealthModule,
    NodesModule,
    ServiceRecordsModule,
    RewardsModule
  ]
})
export class AppModule {}
```



---



# 12\. Node Service 当前 API



## 用户端



```HTTP
GET /api/v1/nodes
GET /api/v1/nodes/:node_id
POST /api/v1/nodes/service-records
GET /api/v1/nodes/rewards
GET /api/v1/nodes/rewards/:reward_id
```



## 后台端



```HTTP
POST /api/v1/admin/nodes/apply
POST /api/v1/admin/nodes/:node_id/approve
POST /api/v1/admin/nodes/:node_id/suspend
POST /api/v1/admin/nodes/:node_id/restore
POST /api/v1/admin/nodes/:node_id/terminate
POST /api/v1/admin/nodes/service-records/:record_id/review
POST /api/v1/admin/nodes/rewards
POST /api/v1/admin/nodes/rewards/:reward_id/approve
POST /api/v1/admin/nodes/rewards/:reward_id/payable
POST /api/v1/admin/nodes/rewards/:reward_id/recover
```



---



# 13\. 节点奖励验证



节点奖励率：



```Plain Text
城市节点：3%
区域节点：3%
国家节点：2%
全球节点：2%
战略节点：2%
```



示例，城市节点订单 369 USD：



```JSON
{
  "node_level": "city",
  "order_amount": "369.000000000000000000",
  "reward_rate": "0.030000000000000000",
  "reward_amount": "11.070000000000000000",
  "tax_amount": "1.107000000000000000",
  "net_amount": "9.963000000000000000"
}
```



---



# 14\. Node Service 已具备能力



这一版完成后，Node Service 支持：



```Plain Text
节点申请
节点查询
节点审核通过
节点暂停 / 恢复 / 终止
节点服务记录提交
节点服务记录审核
节点奖励创建
节点奖励审核
节点奖励转 payable
节点奖励追回
节点事件 outbox
```



---



# 15\. 还需要补强的工业级能力



下一步需要补：



```Plain Text
统一 AppException
PrismaModule 注入
KYB Service 联动
节点协议电子签联动
真实区域授权校验
真实服务记录和奖励发放强绑定
Risk Service 风控
Approval Service 审批
Audit Log
Finance / Tax 联动
Admin 权限 Guard
幂等奖励生成
```



---



# 16\. 下一步继续



按 23 个 Service 顺序，下一步写：



```Plain Text
15. DAppX Mall Service 商城服务
```



下一步会覆盖：



```Plain Text
商户管理
商城商品
商城订单
组合支付
商户结算
DAppX Mall OrderCreated / MerchantSettlementCreated 事件
```



