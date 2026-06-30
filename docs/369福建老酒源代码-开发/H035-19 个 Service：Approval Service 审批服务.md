# H035\-19 个 Service：Approval Service 审批服务

# 第 19 个 Service：Approval Service 审批服务



本服务负责：



```Plain Text
审批申请
审批步骤
多级审批
审批执行
审批权限
高危操作审批
ApprovalCreated / Approved / Rejected / Executed 事件预留
```



---



# 1\. Approval Service 目录结构



```Plain Text
apps/approval-service/
├── src/
│   ├── app.module.ts
│   ├── main.ts
│   ├── health/
│   ├── shared/
│   │   ├── approval-errors.ts
│   │   ├── approval-events.ts
│   │   ├── approval-status.ts
│   │   └── approval-types.ts
│   └── modules/
│       ├── requests/
│       │   ├── requests.module.ts
│       │   ├── requests.controller.ts
│       │   ├── requests.admin.controller.ts
│       │   ├── requests.repository.ts
│       │   ├── requests.service.ts
│       │   └── dto/
│       │       ├── create-approval-request.dto.ts
│       │       ├── approve-request.dto.ts
│       │       ├── reject-request.dto.ts
│       │       └── query-approval-requests.dto.ts
│       └── policies/
│           ├── policies.module.ts
│           ├── policies.controller.ts
│           ├── policies.admin.controller.ts
│           ├── policies.repository.ts
│           ├── policies.service.ts
│           └── dto/
│               ├── create-approval-policy.dto.ts
│               └── query-approval-policies.dto.ts
```



---



# 2\. Prisma 补充表



## 2\.1 ApprovalPolicy



```Plain Text
model ApprovalPolicy {
  id             String   @id
  policyCode     String   @map("policy_code")
  policyVersion  String   @map("policy_version")
  policyName     String   @map("policy_name")
  businessType   String   @map("business_type")
  minAmount      Decimal? @map("min_amount") @db.Decimal(36, 18)
  maxAmount      Decimal? @map("max_amount") @db.Decimal(36, 18)
  currency       String?
  requiredSteps  Int      @default(1) @map("required_steps")
  approverRoles  Json     @map("approver_roles")
  status         String   @default("active")
  createdAt      DateTime @default(now()) @map("created_at")
  updatedAt      DateTime @updatedAt @map("updated_at")
  metadata       Json?

  @@unique([policyCode, policyVersion])
  @@index([businessType])
  @@map("approval_policies")
}
```



## 2\.2 ApprovalRequest



```Plain Text
model ApprovalRequest {
  id             String    @id
  approvalNo     String    @unique @map("approval_no")
  businessType   String    @map("business_type")
  businessId     String    @map("business_id")
  requesterId    String    @map("requester_id")
  amount         Decimal?  @db.Decimal(36, 18)
  currency       String?
  approvalStatus String    @default("pending") @map("approval_status")
  policyId       String?   @map("policy_id")
  currentStep    Int       @default(1) @map("current_step")
  requiredSteps  Int       @default(1) @map("required_steps")
  requestedAt    DateTime  @default(now()) @map("requested_at")
  approvedAt     DateTime? @map("approved_at")
  rejectedAt     DateTime? @map("rejected_at")
  executedAt     DateTime? @map("executed_at")
  metadata       Json?

  steps          ApprovalStep[]

  @@index([businessType, businessId])
  @@index([requesterId])
  @@index([approvalStatus])
  @@map("approval_requests")
}
```



## 2\.3 ApprovalStep



```Plain Text
model ApprovalStep {
  id             String    @id
  approvalId     String    @map("approval_id")
  stepNo         Int       @map("step_no")
  approverRole   String?   @map("approver_role")
  approverId     String?   @map("approver_id")
  stepStatus     String    @default("pending") @map("step_status")
  decision       String?
  comment        String?
  decidedAt      DateTime? @map("decided_at")
  createdAt      DateTime  @default(now()) @map("created_at")

  approval       ApprovalRequest @relation(fields: [approvalId], references: [id])

  @@unique([approvalId, stepNo])
  @@index([approverId])
  @@index([stepStatus])
  @@map("approval_steps")
}
```



---



# 3\. Shared 常量



`apps/approval-service/src/shared/approval-events.ts`



```TypeScript
export const ApprovalEvents = {
  APPROVAL_CREATED: 'approval.created.v1',
  APPROVAL_APPROVED: 'approval.approved.v1',
  APPROVAL_REJECTED: 'approval.rejected.v1',
  APPROVAL_EXECUTED: 'approval.executed.v1',
  APPROVAL_STEP_APPROVED: 'approval.step_approved.v1',
  APPROVAL_STEP_REJECTED: 'approval.step_rejected.v1',
  APPROVAL_POLICY_CREATED: 'approval.policy_created.v1'
} as const;
```



`apps/approval-service/src/shared/approval-errors.ts`



```TypeScript
export const ApprovalErrors = {
  POLICY_NOT_FOUND: 'APPROVAL_POLICY_NOT_FOUND',
  POLICY_ALREADY_EXISTS: 'APPROVAL_POLICY_ALREADY_EXISTS',
  REQUEST_NOT_FOUND: 'APPROVAL_REQUEST_NOT_FOUND',
  REQUEST_ALREADY_EXISTS: 'APPROVAL_REQUEST_ALREADY_EXISTS',
  REQUEST_STATUS_INVALID: 'APPROVAL_REQUEST_STATUS_INVALID',
  STEP_NOT_FOUND: 'APPROVAL_STEP_NOT_FOUND',
  STEP_STATUS_INVALID: 'APPROVAL_STEP_STATUS_INVALID',
  APPROVER_NOT_ALLOWED: 'APPROVAL_APPROVER_NOT_ALLOWED',
  AMOUNT_INVALID: 'APPROVAL_AMOUNT_INVALID'
} as const;
```



`apps/approval-service/src/shared/approval-status.ts`



```TypeScript
export const ApprovalStatus = {
  PENDING: 'pending',
  APPROVING: 'approving',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  EXECUTED: 'executed',
  CANCELLED: 'cancelled'
} as const;

export const ApprovalStepStatus = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  SKIPPED: 'skipped'
} as const;

export const ApprovalPolicyStatus = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  ARCHIVED: 'archived'
} as const;
```



`apps/approval-service/src/shared/approval-types.ts`



```TypeScript
export const ApprovalBusinessTypes = {
  REWARD_APPROVAL: 'reward_approval',
  REFUND_APPROVAL: 'refund_approval',
  FINANCE_SETTLEMENT: 'finance_settlement',
  TAX_PAYMENT: 'tax_payment',
  NODE_APPROVAL: 'node_approval',
  NFT_UPGRADE: 'nft_upgrade',
  RISK_RECOVERY: 'risk_recovery',
  MANUAL_ADJUSTMENT: 'manual_adjustment'
} as const;
```



---



# 4\. Policies DTO / Repository / Service



`apps/approval-service/src/modules/policies/dto/create-approval-policy.dto.ts`



```TypeScript
import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreateApprovalPolicyDto {
  @IsString()
  policy_code!: string;

  @IsString()
  policy_version!: string;

  @IsString()
  policy_name!: string;

  @IsString()
  business_type!: string;

  @IsOptional()
  @IsString()
  min_amount?: string;

  @IsOptional()
  @IsString()
  max_amount?: string;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsInt()
  @Min(1)
  required_steps!: number;

  approver_roles!: string[];
}
```



`apps/approval-service/src/modules/policies/dto/query-approval-policies.dto.ts`



```TypeScript
import { IsOptional, IsString } from 'class-validator';

export class QueryApprovalPoliciesDto {
  @IsOptional()
  @IsString()
  business_type?: string;

  @IsOptional()
  @IsString()
  status?: string;
}
```



`apps/approval-service/src/modules/policies/policies.repository.ts`



```TypeScript
import { Injectable } from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';
import { ulid } from 'ulid';

const prisma = new PrismaClient();

@Injectable()
export class PoliciesRepository {
  findByCode(policyCode: string, policyVersion: string) {
    return prisma.approvalPolicy.findUnique({
      where: {
        policyCode_policyVersion: {
          policyCode,
          policyVersion
        }
      }
    });
  }

  findActiveByBusinessType(businessType: string, amount?: string, currency?: string) {
    return prisma.approvalPolicy.findFirst({
      where: {
        businessType,
        currency,
        status: 'active',
        OR: [
          { minAmount: null },
          { minAmount: { lte: amount ? new Prisma.Decimal(amount) : undefined } }
        ],
        AND: [
          {
            OR: [
              { maxAmount: null },
              { maxAmount: { gte: amount ? new Prisma.Decimal(amount) : undefined } }
            ]
          }
        ]
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  findMany(params: { businessType?: string; status?: string }) {
    return prisma.approvalPolicy.findMany({
      where: {
        businessType: params.businessType,
        status: params.status
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  create(data: {
    policyCode: string;
    policyVersion: string;
    policyName: string;
    businessType: string;
    minAmount?: string;
    maxAmount?: string;
    currency?: string;
    requiredSteps: number;
    approverRoles: string[];
  }) {
    return prisma.$transaction(async (tx) => {
      const policy = await tx.approvalPolicy.create({
        data: {
          id: ulid(),
          policyCode: data.policyCode,
          policyVersion: data.policyVersion,
          policyName: data.policyName,
          businessType: data.businessType,
          minAmount: data.minAmount ? new Prisma.Decimal(data.minAmount) : undefined,
          maxAmount: data.maxAmount ? new Prisma.Decimal(data.maxAmount) : undefined,
          currency: data.currency,
          requiredSteps: data.requiredSteps,
          approverRoles: data.approverRoles,
          status: 'active'
        }
      });

      await tx.outboxEvent.create({
        data: {
          id: ulid(),
          eventType: 'approval.policy_created.v1',
          payload: {
            policy_id: policy.id,
            policy_code: policy.policyCode,
            policy_version: policy.policyVersion,
            business_type: policy.businessType,
            required_steps: policy.requiredSteps
          },
          status: 'pending',
          retryCount: 0
        }
      });

      return policy;
    });
  }
}
```



`apps/approval-service/src/modules/policies/policies.service.ts`



```TypeScript
import { Injectable } from '@nestjs/common';
import Decimal from 'decimal.js';
import { PoliciesRepository } from './policies.repository';
import { CreateApprovalPolicyDto } from './dto/create-approval-policy.dto';
import { QueryApprovalPoliciesDto } from './dto/query-approval-policies.dto';
import { ApprovalErrors } from '../../shared/approval-errors';

@Injectable()
export class PoliciesService {
  constructor(private readonly policiesRepository: PoliciesRepository) {}

  async create(dto: CreateApprovalPolicyDto) {
    const existing = await this.policiesRepository.findByCode(
      dto.policy_code,
      dto.policy_version
    );

    if (existing) {
      throw new Error(ApprovalErrors.POLICY_ALREADY_EXISTS);
    }

    if (
      (dto.min_amount && new Decimal(dto.min_amount).lt(0)) ||
      (dto.max_amount && new Decimal(dto.max_amount).lt(0))
    ) {
      throw new Error(ApprovalErrors.AMOUNT_INVALID);
    }

    const policy = await this.policiesRepository.create({
      policyCode: dto.policy_code,
      policyVersion: dto.policy_version,
      policyName: dto.policy_name,
      businessType: dto.business_type,
      minAmount: dto.min_amount,
      maxAmount: dto.max_amount,
      currency: dto.currency,
      requiredSteps: dto.required_steps,
      approverRoles: dto.approver_roles
    });

    return this.formatPolicy(policy);
  }

  async list(query: QueryApprovalPoliciesDto) {
    const items = await this.policiesRepository.findMany({
      businessType: query.business_type,
      status: query.status
    });

    return {
      items: items.map((item) => this.formatPolicy(item))
    };
  }

  private formatPolicy(policy: any) {
    return {
      policy_id: policy.id,
      policy_code: policy.policyCode,
      policy_version: policy.policyVersion,
      policy_name: policy.policyName,
      business_type: policy.businessType,
      min_amount: policy.minAmount?.toString(),
      max_amount: policy.maxAmount?.toString(),
      currency: policy.currency,
      required_steps: policy.requiredSteps,
      approver_roles: policy.approverRoles,
      status: policy.status
    };
  }
}
```



---



# 5\. Policies Controllers / Module



`apps/approval-service/src/modules/policies/policies.controller.ts`



```TypeScript
import { Controller, Get, Query } from '@nestjs/common';
import { PoliciesService } from './policies.service';
import { QueryApprovalPoliciesDto } from './dto/query-approval-policies.dto';

@Controller('approvals/policies')
export class PoliciesController {
  constructor(private readonly policiesService: PoliciesService) {}

  @Get()
  list(@Query() query: QueryApprovalPoliciesDto) {
    return this.policiesService.list(query);
  }
}
```



`apps/approval-service/src/modules/policies/policies.admin.controller.ts`



```TypeScript
import { Body, Controller, Post } from '@nestjs/common';
import { PoliciesService } from './policies.service';
import { CreateApprovalPolicyDto } from './dto/create-approval-policy.dto';

@Controller('admin/approvals/policies')
export class PoliciesAdminController {
  constructor(private readonly policiesService: PoliciesService) {}

  @Post()
  create(@Body() dto: CreateApprovalPolicyDto) {
    return this.policiesService.create(dto);
  }
}
```



`apps/approval-service/src/modules/policies/policies.module.ts`



```TypeScript
import { Module } from '@nestjs/common';
import { PoliciesController } from './policies.controller';
import { PoliciesAdminController } from './policies.admin.controller';
import { PoliciesService } from './policies.service';
import { PoliciesRepository } from './policies.repository';

@Module({
  controllers: [PoliciesController, PoliciesAdminController],
  providers: [PoliciesService, PoliciesRepository],
  exports: [PoliciesService, PoliciesRepository]
})
export class PoliciesModule {}
```



---



# 6\. Requests DTO



`apps/approval-service/src/modules/requests/dto/create-approval-request.dto.ts`



```TypeScript
import { IsOptional, IsString } from 'class-validator';

export class CreateApprovalRequestDto {
  @IsString()
  business_type!: string;

  @IsString()
  business_id!: string;

  @IsString()
  requester_id!: string;

  @IsOptional()
  @IsString()
  amount?: string;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  metadata?: Record;
}
```



`apps/approval-service/src/modules/requests/dto/approve-request.dto.ts`



```TypeScript
import { IsOptional, IsString } from 'class-validator';

export class ApproveRequestDto {
  @IsString()
  approver_id!: string;

  @IsString()
  approver_role!: string;

  @IsOptional()
  @IsString()
  comment?: string;
}
```



`apps/approval-service/src/modules/requests/dto/reject-request.dto.ts`



```TypeScript
import { IsString } from 'class-validator';

export class RejectRequestDto {
  @IsString()
  approver_id!: string;

  @IsString()
  approver_role!: string;

  @IsString()
  comment!: string;
}
```



`apps/approval-service/src/modules/requests/dto/query-approval-requests.dto.ts`



```TypeScript
import { IsOptional, IsString } from 'class-validator';

export class QueryApprovalRequestsDto {
  @IsOptional()
  @IsString()
  business_type?: string;

  @IsOptional()
  @IsString()
  business_id?: string;

  @IsOptional()
  @IsString()
  requester_id?: string;

  @IsOptional()
  @IsString()
  approval_status?: string;

  @IsOptional()
  page?: number;

  @IsOptional()
  page_size?: number;
}
```



---



# 7\. Requests Repository



`apps/approval-service/src/modules/requests/requests.repository.ts`



```TypeScript
import { Injectable } from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';
import { ulid } from 'ulid';

const prisma = new PrismaClient();

@Injectable()
export class RequestsRepository {
  findPolicy(businessType: string, amount?: string, currency?: string) {
    return prisma.approvalPolicy.findFirst({
      where: {
        businessType,
        currency,
        status: 'active',
        OR: [
          { minAmount: null },
          { minAmount: { lte: amount ? new Prisma.Decimal(amount) : undefined } }
        ],
        AND: [
          {
            OR: [
              { maxAmount: null },
              { maxAmount: { gte: amount ? new Prisma.Decimal(amount) : undefined } }
            ]
          }
        ]
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  findExisting(businessType: string, businessId: string) {
    return prisma.approvalRequest.findFirst({
      where: {
        businessType,
        businessId,
        approvalStatus: {
          in: ['pending', 'approving', 'approved']
        }
      }
    });
  }

  findById(approvalId: string) {
    return prisma.approvalRequest.findUnique({
      where: { id: approvalId },
      include: { steps: true }
    });
  }

  create(data: {
    approvalNo: string;
    businessType: string;
    businessId: string;
    requesterId: string;
    amount?: string;
    currency?: string;
    policyId?: string;
    requiredSteps: number;
    approverRoles: string[];
    metadata?: Record;
  }) {
    return prisma.$transaction(async (tx) => {
      const request = await tx.approvalRequest.create({
        data: {
          id: ulid(),
          approvalNo: data.approvalNo,
          businessType: data.businessType,
          businessId: data.businessId,
          requesterId: data.requesterId,
          amount: data.amount ? new Prisma.Decimal(data.amount) : undefined,
          currency: data.currency,
          policyId: data.policyId,
          requiredSteps: data.requiredSteps,
          currentStep: 1,
          approvalStatus: 'pending',
          metadata: data.metadata
        }
      });

      for (let stepNo = 1; stepNo  {
      await tx.approvalStep.update({
        where: {
          approvalId_stepNo: {
            approvalId: params.approvalId,
            stepNo: params.stepNo
          }
        },
        data: {
          stepStatus: 'approved',
          decision: 'approved',
          approverId: params.approverId,
          comment: params.comment,
          decidedAt: new Date()
        }
      });

      const request = await tx.approvalRequest.update({
        where: { id: params.approvalId },
        data: {
          approvalStatus: params.isFinal ? 'approved' : 'approving',
          currentStep: params.isFinal ? params.stepNo : params.stepNo + 1,
          approvedAt: params.isFinal ? new Date() : undefined
        },
        include: { steps: true }
      });

      await tx.outboxEvent.create({
        data: {
          id: ulid(),
          eventType: params.isFinal
            ? 'approval.approved.v1'
            : 'approval.step_approved.v1',
          payload: {
            approval_id: request.id,
            approval_no: request.approvalNo,
            business_type: request.businessType,
            business_id: request.businessId,
            step_no: params.stepNo,
            approver_id: params.approverId
          },
          status: 'pending',
          retryCount: 0
        }
      });

      return request;
    });
  }

  rejectStep(params: {
    approvalId: string;
    stepNo: number;
    approverId: string;
    comment: string;
  }) {
    return prisma.$transaction(async (tx) => {
      await tx.approvalStep.update({
        where: {
          approvalId_stepNo: {
            approvalId: params.approvalId,
            stepNo: params.stepNo
          }
        },
        data: {
          stepStatus: 'rejected',
          decision: 'rejected',
          approverId: params.approverId,
          comment: params.comment,
          decidedAt: new Date()
        }
      });

      const request = await tx.approvalRequest.update({
        where: { id: params.approvalId },
        data: {
          approvalStatus: 'rejected',
          rejectedAt: new Date()
        },
        include: { steps: true }
      });

      await tx.outboxEvent.create({
        data: {
          id: ulid(),
          eventType: 'approval.rejected.v1',
          payload: {
            approval_id: request.id,
            approval_no: request.approvalNo,
            business_type: request.businessType,
            business_id: request.businessId,
            step_no: params.stepNo,
            approver_id: params.approverId
          },
          status: 'pending',
          retryCount: 0
        }
      });

      return request;
    });
  }

  execute(approvalId: string) {
    return prisma.$transaction(async (tx) => {
      const request = await tx.approvalRequest.update({
        where: { id: approvalId },
        data: {
          approvalStatus: 'executed',
          executedAt: new Date()
        },
        include: { steps: true }
      });

      await tx.outboxEvent.create({
        data: {
          id: ulid(),
          eventType: 'approval.executed.v1',
          payload: {
            approval_id: request.id,
            approval_no: request.approvalNo,
            business_type: request.businessType,
            business_id: request.businessId
          },
          status: 'pending',
          retryCount: 0
        }
      });

      return request;
    });
  }

  findMany(params: {
    businessType?: string;
    businessId?: string;
    requesterId?: string;
    approvalStatus?: string;
    page: number;
    pageSize: number;
  }) {
    return prisma.approvalRequest.findMany({
      where: {
        businessType: params.businessType,
        businessId: params.businessId,
        requesterId: params.requesterId,
        approvalStatus: params.approvalStatus
      },
      include: { steps: true },
      orderBy: { requestedAt: 'desc' },
      skip: (params.page - 1) * params.pageSize,
      take: params.pageSize
    });
  }

  count(params: {
    businessType?: string;
    businessId?: string;
    requesterId?: string;
    approvalStatus?: string;
  }) {
    return prisma.approvalRequest.count({
      where: {
        businessType: params.businessType,
        businessId: params.businessId,
        requesterId: params.requesterId,
        approvalStatus: params.approvalStatus
      }
    });
  }
}
```



---



# 8\. Requests Service



`apps/approval-service/src/modules/requests/requests.service.ts`



```TypeScript
import { Injectable } from '@nestjs/common';
import Decimal from 'decimal.js';
import { ulid } from 'ulid';
import { RequestsRepository } from './requests.repository';
import { CreateApprovalRequestDto } from './dto/create-approval-request.dto';
import { ApproveRequestDto } from './dto/approve-request.dto';
import { RejectRequestDto } from './dto/reject-request.dto';
import { QueryApprovalRequestsDto } from './dto/query-approval-requests.dto';
import { ApprovalErrors } from '../../shared/approval-errors';
import { ApprovalStatus } from '../../shared/approval-status';

@Injectable()
export class RequestsService {
  constructor(private readonly requestsRepository: RequestsRepository) {}

  async create(dto: CreateApprovalRequestDto) {
    if (dto.amount && new Decimal(dto.amount).lt(0)) {
      throw new Error(ApprovalErrors.AMOUNT_INVALID);
    }

    const existing = await this.requestsRepository.findExisting(
      dto.business_type,
      dto.business_id
    );

    if (existing) {
      throw new Error(ApprovalErrors.REQUEST_ALREADY_EXISTS);
    }

    const policy = await this.requestsRepository.findPolicy(
      dto.business_type,
      dto.amount,
      dto.currency
    );

    const approverRoles = Array.isArray(policy?.approverRoles)
      ? (policy?.approverRoles as string[])
      : ['admin'];

    const request = await this.requestsRepository.create({
      approvalNo: this.generateApprovalNo(),
      businessType: dto.business_type,
      businessId: dto.business_id,
      requesterId: dto.requester_id,
      amount: dto.amount,
      currency: dto.currency,
      policyId: policy?.id,
      requiredSteps: policy?.requiredSteps || 1,
      approverRoles,
      metadata: dto.metadata
    });

    return this.formatRequest(request);
  }

  async detail(approvalId: string) {
    const request = await this.requestsRepository.findById(approvalId);
    if (!request) throw new Error(ApprovalErrors.REQUEST_NOT_FOUND);
    return this.formatRequest(request);
  }

  async list(query: QueryApprovalRequestsDto) {
    const page = Number(query.page || 1);
    const pageSize = Math.min(Number(query.page_size || 20), 100);

    const [items, total] = await Promise.all([
      this.requestsRepository.findMany({
        businessType: query.business_type,
        businessId: query.business_id,
        requesterId: query.requester_id,
        approvalStatus: query.approval_status,
        page,
        pageSize
      }),
      this.requestsRepository.count({
        businessType: query.business_type,
        businessId: query.business_id,
        requesterId: query.requester_id,
        approvalStatus: query.approval_status
      })
    ]);

    return {
      items: items.map((item) => this.formatRequest(item)),
      pagination: {
        page,
        page_size: pageSize,
        total,
        total_pages: Math.ceil(total / pageSize)
      }
    };
  }

  async approve(approvalId: string, dto: ApproveRequestDto) {
    const request = await this.requestsRepository.findById(approvalId);
    if (!request) throw new Error(ApprovalErrors.REQUEST_NOT_FOUND);

    if (
      ![ApprovalStatus.PENDING, ApprovalStatus.APPROVING].includes(
        request.approvalStatus as any
      )
    ) {
      throw new Error(ApprovalErrors.REQUEST_STATUS_INVALID);
    }

    const currentStep = request.steps.find(
      (step) => step.stepNo === request.currentStep
    );

    if (!currentStep) throw new Error(ApprovalErrors.STEP_NOT_FOUND);

    if (currentStep.stepStatus !== 'pending') {
      throw new Error(ApprovalErrors.STEP_STATUS_INVALID);
    }

    if (
      currentStep.approverRole &&
      currentStep.approverRole !== dto.approver_role
    ) {
      throw new Error(ApprovalErrors.APPROVER_NOT_ALLOWED);
    }

    const isFinal = request.currentStep >= request.requiredSteps;

    const updated = await this.requestsRepository.approveStep({
      approvalId,
      stepNo: request.currentStep,
      approverId: dto.approver_id,
      comment: dto.comment,
      isFinal
    });

    return this.formatRequest(updated);
  }

  async reject(approvalId: string, dto: RejectRequestDto) {
    const request = await this.requestsRepository.findById(approvalId);
    if (!request) throw new Error(ApprovalErrors.REQUEST_NOT_FOUND);

    if (
      ![ApprovalStatus.PENDING, ApprovalStatus.APPROVING].includes(
        request.approvalStatus as any
      )
    ) {
      throw new Error(ApprovalErrors.REQUEST_STATUS_INVALID);
    }

    const currentStep = request.steps.find(
      (step) => step.stepNo === request.currentStep
    );

    if (!currentStep) throw new Error(ApprovalErrors.STEP_NOT_FOUND);

    if (
      currentStep.approverRole &&
      currentStep.approverRole !== dto.approver_role
    ) {
      throw new Error(ApprovalErrors.APPROVER_NOT_ALLOWED);
    }

    const updated = await this.requestsRepository.rejectStep({
      approvalId,
      stepNo: request.currentStep,
      approverId: dto.approver_id,
      comment: dto.comment
    });

    return this.formatRequest(updated);
  }

  async execute(approvalId: string) {
    const request = await this.requestsRepository.findById(approvalId);
    if (!request) throw new Error(ApprovalErrors.REQUEST_NOT_FOUND);

    if (request.approvalStatus !== ApprovalStatus.APPROVED) {
      throw new Error(ApprovalErrors.REQUEST_STATUS_INVALID);
    }

    const updated = await this.requestsRepository.execute(approvalId);
    return this.formatRequest(updated);
  }

  private formatRequest(request: any) {
    return {
      approval_id: request.id,
      approval_no: request.approvalNo,
      business_type: request.businessType,
      business_id: request.businessId,
      requester_id: request.requesterId,
      amount: request.amount?.toString(),
      currency: request.currency,
      approval_status: request.approvalStatus,
      policy_id: request.policyId,
      current_step: request.currentStep,
      required_steps: request.requiredSteps,
      requested_at: request.requestedAt,
      approved_at: request.approvedAt,
      rejected_at: request.rejectedAt,
      executed_at: request.executedAt,
      steps: request.steps?.map((step: any) => ({
        step_id: step.id,
        step_no: step.stepNo,
        approver_role: step.approverRole,
        approver_id: step.approverId,
        step_status: step.stepStatus,
        decision: step.decision,
        comment: step.comment,
        decided_at: step.decidedAt
      })) || []
    };
  }

  private generateApprovalNo() {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    return `APR${date}${ulid()}`;
  }
}
```



---



# 9\. Requests Controllers / Module



`apps/approval-service/src/modules/requests/requests.controller.ts`



```TypeScript
import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { RequestsService } from './requests.service';
import { CreateApprovalRequestDto } from './dto/create-approval-request.dto';
import { QueryApprovalRequestsDto } from './dto/query-approval-requests.dto';

@Controller('approvals/requests')
export class RequestsController {
  constructor(private readonly requestsService: RequestsService) {}

  @Post()
  create(@Body() dto: CreateApprovalRequestDto) {
    return this.requestsService.create(dto);
  }

  @Get()
  list(@Query() query: QueryApprovalRequestsDto) {
    return this.requestsService.list(query);
  }

  @Get(':approval_id')
  detail(@Param('approval_id') approvalId: string) {
    return this.requestsService.detail(approvalId);
  }
}
```



`apps/approval-service/src/modules/requests/requests.admin.controller.ts`



```TypeScript
import { Body, Controller, Param, Post } from '@nestjs/common';
import { RequestsService } from './requests.service';
import { ApproveRequestDto } from './dto/approve-request.dto';
import { RejectRequestDto } from './dto/reject-request.dto';

@Controller('admin/approvals/requests')
export class RequestsAdminController {
  constructor(private readonly requestsService: RequestsService) {}

  @Post(':approval_id/approve')
  approve(
    @Param('approval_id') approvalId: string,
    @Body() dto: ApproveRequestDto
  ) {
    return this.requestsService.approve(approvalId, dto);
  }

  @Post(':approval_id/reject')
  reject(
    @Param('approval_id') approvalId: string,
    @Body() dto: RejectRequestDto
  ) {
    return this.requestsService.reject(approvalId, dto);
  }

  @Post(':approval_id/execute')
  execute(@Param('approval_id') approvalId: string) {
    return this.requestsService.execute(approvalId);
  }
}
```



`apps/approval-service/src/modules/requests/requests.module.ts`



```TypeScript
import { Module } from '@nestjs/common';
import { RequestsController } from './requests.controller';
import { RequestsAdminController } from './requests.admin.controller';
import { RequestsService } from './requests.service';
import { RequestsRepository } from './requests.repository';

@Module({
  controllers: [RequestsController, RequestsAdminController],
  providers: [RequestsService, RequestsRepository],
  exports: [RequestsService]
})
export class RequestsModule {}
```



---



# 10\. Approval App Module



`apps/approval-service/src/app.module.ts`



```TypeScript
import { Module } from '@nestjs/common';
import { HealthModule } from './health/health.module';
import { RequestsModule } from './modules/requests/requests.module';
import { PoliciesModule } from './modules/policies/policies.module';

@Module({
  imports: [
    HealthModule,
    RequestsModule,
    PoliciesModule
  ]
})
export class AppModule {}
```



---



# 11\. Approval Service 当前 API



## 业务端



```HTTP
GET /api/v1/approvals/policies
POST /api/v1/approvals/requests
GET /api/v1/approvals/requests
GET /api/v1/approvals/requests/:approval_id
```



## 后台端



```HTTP
POST /api/v1/admin/approvals/policies
POST /api/v1/admin/approvals/requests/:approval_id/approve
POST /api/v1/admin/approvals/requests/:approval_id/reject
POST /api/v1/admin/approvals/requests/:approval_id/execute
```



---



# 12\. Approval Service 已具备能力



这一版完成后，Approval Service 支持：



```Plain Text
审批策略创建
审批策略查询
审批申请创建
自动匹配审批策略
自动生成审批步骤
多级审批
驳回审批
执行审批
审批列表 / 详情查询
Approval outbox 事件
```



---



# 13\. 后续必须补强



```Plain Text
统一 AppException
PrismaModule 注入
审批人权限校验
审批角色动态解析
审批超时 / 催办
审批撤回
审批委托
审批流模板
审批执行回调业务服务
Audit Log
Admin 权限 Guard
```



---



# 14\. 下一步继续



按 23 个 Service 顺序，下一步写：



```Plain Text
20. Audit Service 审计服务
```



下一步会覆盖：



```Plain Text
操作审计
资金审计
审批审计
登录审计
风险审计
数据访问审计
审计查询
审计归档
```



