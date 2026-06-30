# H022\- 6 个 Service：Revenue Service 收入分配服务

下面继续按 23 个 Service 顺序写代码。



# 第 6 个 Service：Revenue Service 收入分配服务



本服务负责：



```Plain Text
接收 order.paid / payment.succeeded 事件
生成 369 USD 40 / 30 / 30 分账
生成 revenue_allocations
生成 revenue_allocation_items
分账详情查询
分账池统计
分账审核
退款分账冲销
RevenueAllocated outbox 事件
RevenueReversed outbox 事件
```



---



# 1\. Revenue Service 目录结构



```Plain Text
apps/revenue-service/
├── src/
│   ├── app.module.ts
│   ├── main.ts
│   ├── health/
│   ├── shared/
│   │   ├── revenue-errors.ts
│   │   ├── revenue-events.ts
│   │   ├── revenue-pools.ts
│   │   └── revenue-status.ts
│   └── modules/
│       ├── allocations/
│       │   ├── allocations.module.ts
│       │   ├── allocations.controller.ts
│       │   ├── allocations.admin.controller.ts
│       │   ├── allocations.repository.ts
│       │   ├── allocations.service.ts
│       │   └── dto/
│       │       ├── create-allocation.dto.ts
│       │       ├── query-allocations.dto.ts
│       │       ├── approve-allocation.dto.ts
│       │       └── pool-summary-query.dto.ts
│       └── reversals/
│           ├── reversals.module.ts
│           ├── reversals.controller.ts
│           ├── reversals.admin.controller.ts
│           ├── reversals.repository.ts
│           ├── reversals.service.ts
│           └── dto/
│               ├── create-reversal.dto.ts
│               └── query-reversals.dto.ts
```



---



# 2\. Prisma 补充表



如果前面已经有 `RevenueAllocation` 和 `RevenueAllocationItem`，这里补充冲销表。



## 2\.1 RevenueReversal



```Plain Text
model RevenueReversal {
  id                   String   @id
  reversalNo            String   @unique @map("reversal_no")
  originalAllocationId  String   @map("original_allocation_id")
  refundId              String?  @map("refund_id")
  orderId               String   @map("order_id")
  reason                String
  status                String   @default("created")
  createdAt             DateTime @default(now()) @map("created_at")
  updatedAt             DateTime @updatedAt @map("updated_at")
  metadata              Json?

  items                 RevenueReversalItem[]

  @@index([originalAllocationId])
  @@index([orderId])
  @@index([refundId])
  @@map("revenue_reversals")
}
```



## 2\.2 RevenueReversalItem



```Plain Text
model RevenueReversalItem {
  id             String   @id
  reversalId     String   @map("reversal_id")
  originalItemId String   @map("original_item_id")
  poolType       String   @map("pool_type")
  reverseAmount  Decimal  @map("reverse_amount") @db.Decimal(36, 18)
  currency       String
  createdAt      DateTime @default(now()) @map("created_at")

  reversal       RevenueReversal @relation(fields: [reversalId], references: [id])

  @@index([reversalId])
  @@index([poolType])
  @@map("revenue_reversal_items")
}
```



## 2\.3 RevenueSettlement



```Plain Text
model RevenueSettlement {
  id               String    @id
  settlementNo     String    @unique @map("settlement_no")
  poolType         String    @map("pool_type")
  period           String
  totalAmount      Decimal   @map("total_amount") @db.Decimal(36, 18)
  currency         String
  settlementStatus String    @default("pending") @map("settlement_status")
  approvedBy       String?   @map("approved_by")
  paidAt           DateTime? @map("paid_at")
  createdAt        DateTime  @default(now()) @map("created_at")
  updatedAt        DateTime  @updatedAt @map("updated_at")
  metadata         Json?

  @@index([poolType])
  @@index([period])
  @@map("revenue_settlements")
}
```



---



# 3\. Revenue Events



`apps/revenue-service/src/shared/revenue-events.ts`



```TypeScript
export const RevenueEvents = {
  REVENUE_ALLOCATION_REQUESTED: 'revenue.allocation_requested.v1',
  REVENUE_ALLOCATED: 'revenue.allocated.v1',
  REVENUE_APPROVED: 'revenue.approved.v1',
  REVENUE_SETTLED: 'revenue.settled.v1',

  REVENUE_REVERSAL_REQUESTED: 'revenue.reversal_requested.v1',
  REVENUE_REVERSED: 'revenue.reversed.v1'
} as const;
```



---



# 4\. Revenue Errors



`apps/revenue-service/src/shared/revenue-errors.ts`



```TypeScript
export const RevenueErrors = {
  ALLOCATION_NOT_FOUND: 'REVENUE_ALLOCATION_NOT_FOUND',
  ALLOCATION_ALREADY_EXISTS: 'REVENUE_ALLOCATION_ALREADY_EXISTS',
  ALLOCATION_STATUS_INVALID: 'REVENUE_ALLOCATION_STATUS_INVALID',
  ALLOCATION_AMOUNT_INVALID: 'REVENUE_ALLOCATION_AMOUNT_INVALID',
  ALLOCATION_RULE_NOT_FOUND: 'REVENUE_ALLOCATION_RULE_NOT_FOUND',
  ALLOCATION_RULE_INVALID: 'REVENUE_ALLOCATION_RULE_INVALID',

  REVERSAL_NOT_FOUND: 'REVENUE_REVERSAL_NOT_FOUND',
  REVERSAL_ALREADY_EXISTS: 'REVENUE_REVERSAL_ALREADY_EXISTS',
  REVERSAL_AMOUNT_INVALID: 'REVENUE_REVERSAL_AMOUNT_INVALID',

  ORDER_NOT_FOUND: 'ORDER_NOT_FOUND',
  ORDER_NOT_PAID: 'ORDER_NOT_PAID'
} as const;
```



---



# 5\. Revenue Status



`apps/revenue-service/src/shared/revenue-status.ts`



```TypeScript
export const RevenueAllocationStatus = {
  PENDING: 'pending',
  CALCULATED: 'calculated',
  RISK_CHECKING: 'risk_checking',
  APPROVED: 'approved',
  SETTLED: 'settled',
  REVERSED: 'reversed',
  CANCELLED: 'cancelled'
} as const;

export const RevenueReversalStatus = {
  CREATED: 'created',
  APPROVED: 'approved',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
} as const;

export const RevenueAllocationTransitions: Record = {
  pending: ['calculated', 'cancelled'],
  calculated: ['risk_checking', 'approved', 'cancelled'],
  risk_checking: ['approved', 'cancelled'],
  approved: ['settled', 'reversed'],
  settled: ['reversed'],
  reversed: [],
  cancelled: []
};

export function canTransitRevenueStatus(from: string, to: string): boolean {
  return RevenueAllocationTransitions[from]?.includes(to) ?? false;
}
```



---



# 6\. Revenue Pools



`apps/revenue-service/src/shared/revenue-pools.ts`



```TypeScript
export const RevenuePools = {
  WINE_COST_POOL: 'wine_cost_pool',
  MARKET_ECOSYSTEM_POOL: 'market_ecosystem_pool',
  COMPANY_POOL: 'company_pool',
  REFERRAL_REWARD_POOL: 'referral_reward_pool',
  TEAM_REWARD_POOL: 'team_reward_pool',
  NODE_REWARD_POOL: 'node_reward_pool',
  POINTS_INCENTIVE_POOL: 'points_incentive_pool',
  DAPPX_NFT_AI_POOL: 'dappx_nft_ai_pool',
  TREASURY_ACTIVITY_POOL: 'treasury_activity_pool',
  TAX_RESERVED_POOL: 'tax_reserved_pool'
} as const;

export const Wine369RevenueRule = [
  {
    pool_type: RevenuePools.WINE_COST_POOL,
    percentage: '0.40'
  },
  {
    pool_type: RevenuePools.MARKET_ECOSYSTEM_POOL,
    percentage: '0.30'
  },
  {
    pool_type: RevenuePools.COMPANY_POOL,
    percentage: '0.30'
  }
] as const;
```



---



# 7\. DTO：CreateAllocationDto



`apps/revenue-service/src/modules/allocations/dto/create-allocation.dto.ts`



```TypeScript
import { IsOptional, IsString } from 'class-validator';

export class CreateAllocationDto {
  @IsString()
  order_id!: string;

  @IsString()
  order_no!: string;

  @IsString()
  user_id!: string;

  @IsString()
  product_type!: string;

  @IsString()
  paid_amount!: string;

  @IsOptional()
  @IsString()
  tax_amount?: string;

  @IsString()
  currency!: string;

  @IsOptional()
  @IsString()
  rule_id?: string;

  @IsOptional()
  @IsString()
  rule_version?: string;
}
```



---



# 8\. DTO：QueryAllocationsDto



`apps/revenue-service/src/modules/allocations/dto/query-allocations.dto.ts`



```TypeScript
import { IsOptional, IsString } from 'class-validator';

export class QueryAllocationsDto {
  @IsOptional()
  @IsString()
  allocation_no?: string;

  @IsOptional()
  @IsString()
  order_id?: string;

  @IsOptional()
  @IsString()
  user_id?: string;

  @IsOptional()
  @IsString()
  product_type?: string;

  @IsOptional()
  @IsString()
  allocation_status?: string;

  @IsOptional()
  page?: number;

  @IsOptional()
  page_size?: number;
}
```



---



# 9\. DTO：ApproveAllocationDto



`apps/revenue-service/src/modules/allocations/dto/approve-allocation.dto.ts`



```TypeScript
import { IsOptional, IsString } from 'class-validator';

export class ApproveAllocationDto {
  @IsString()
  reviewer_id!: string;

  @IsOptional()
  @IsString()
  review_note?: string;
}
```



---



# 10\. DTO：PoolSummaryQueryDto



`apps/revenue-service/src/modules/allocations/dto/pool-summary-query.dto.ts`



```TypeScript
import { IsOptional, IsString } from 'class-validator';

export class PoolSummaryQueryDto {
  @IsOptional()
  @IsString()
  pool_type?: string;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsString()
  start_time?: string;

  @IsOptional()
  @IsString()
  end_time?: string;
}
```



---



# 11\. Allocations Repository



`apps/revenue-service/src/modules/allocations/allocations.repository.ts`



```TypeScript
import { Injectable } from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';
import { ulid } from 'ulid';

const prisma = new PrismaClient();

@Injectable()
export class AllocationsRepository {
  findById(allocationId: string) {
    return prisma.revenueAllocation.findUnique({
      where: { id: allocationId },
      include: {
        items: true
      }
    });
  }

  findByOrderId(orderId: string) {
    return prisma.revenueAllocation.findFirst({
      where: { orderId },
      include: {
        items: true
      }
    });
  }

  findMany(params: {
    allocationNo?: string;
    orderId?: string;
    userId?: string;
    productType?: string;
    allocationStatus?: string;
    page: number;
    pageSize: number;
  }) {
    return prisma.revenueAllocation.findMany({
      where: {
        allocationNo: params.allocationNo,
        orderId: params.orderId,
        userId: params.userId,
        productType: params.productType,
        allocationStatus: params.allocationStatus
      },
      include: {
        items: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip: (params.page - 1) * params.pageSize,
      take: params.pageSize
    });
  }

  count(params: {
    allocationNo?: string;
    orderId?: string;
    userId?: string;
    productType?: string;
    allocationStatus?: string;
  }) {
    return prisma.revenueAllocation.count({
      where: {
        allocationNo: params.allocationNo,
        orderId: params.orderId,
        userId: params.userId,
        productType: params.productType,
        allocationStatus: params.allocationStatus
      }
    });
  }

  createWithItems(data: {
    allocationNo: string;
    orderId: string;
    userId: string;
    productType: string;
    ruleId?: string;
    ruleVersion: string;
    paidAmount: string;
    taxAmount: string;
    netAmount: string;
    currency: string;
    items: Array;
  }) {
    return prisma.$transaction(async (tx) => {
      const allocation = await tx.revenueAllocation.create({
        data: {
          id: ulid(),
          allocationNo: data.allocationNo,
          orderId: data.orderId,
          userId: data.userId,
          productType: data.productType,
          ruleId: data.ruleId,
          ruleVersion: data.ruleVersion,
          paidAmount: new Prisma.Decimal(data.paidAmount),
          taxAmount: new Prisma.Decimal(data.taxAmount),
          netAmount: new Prisma.Decimal(data.netAmount),
          currency: data.currency,
          allocationStatus: 'calculated'
        }
      });

      for (const item of data.items) {
        await tx.revenueAllocationItem.create({
          data: {
            id: ulid(),
            allocationId: allocation.id,
            poolType: item.poolType,
            percentage: new Prisma.Decimal(item.percentage),
            amount: new Prisma.Decimal(item.amount),
            currency: data.currency,
            status: 'calculated'
          }
        });
      }

      await tx.outboxEvent.create({
        data: {
          id: ulid(),
          eventType: 'revenue.allocated.v1',
          payload: {
            allocation_id: allocation.id,
            allocation_no: allocation.allocationNo,
            order_id: allocation.orderId,
            user_id: allocation.userId,
            product_type: allocation.productType,
            paid_amount: allocation.paidAmount.toString(),
            tax_amount: allocation.taxAmount.toString(),
            net_amount: allocation.netAmount.toString(),
            currency: allocation.currency,
            rule_version: allocation.ruleVersion
          },
          status: 'pending',
          retryCount: 0
        }
      });

      return tx.revenueAllocation.findUnique({
        where: { id: allocation.id },
        include: { items: true }
      });
    });
  }

  approve(params: {
    allocationId: string;
    reviewerId: string;
    reviewNote?: string;
  }) {
    return prisma.$transaction(async (tx) => {
      const allocation = await tx.revenueAllocation.update({
        where: { id: params.allocationId },
        data: {
          allocationStatus: 'approved',
          metadata: {
            reviewer_id: params.reviewerId,
            review_note: params.reviewNote
          }
        }
      });

      await tx.outboxEvent.create({
        data: {
          id: ulid(),
          eventType: 'revenue.approved.v1',
          payload: {
            allocation_id: allocation.id,
            allocation_no: allocation.allocationNo,
            order_id: allocation.orderId,
            user_id: allocation.userId,
            currency: allocation.currency
          },
          status: 'pending',
          retryCount: 0
        }
      });

      return allocation;
    });
  }

  async poolSummary(params: {
    poolType?: string;
    currency?: string;
    startTime?: Date;
    endTime?: Date;
  }) {
    const result = await prisma.revenueAllocationItem.groupBy({
      by: ['poolType', 'currency'],
      where: {
        poolType: params.poolType,
        currency: params.currency,
        createdAt: {
          gte: params.startTime,
          lte: params.endTime
        }
      },
      _sum: {
        amount: true
      }
    });

    return result;
  }
}
```



> 如果 `RevenueAllocation` model 还没有 `ruleId`、`metadata` 字段，需要补：
> 
> 
> 
> ```Plain Text
> ruleId   String? @map("rule_id")
> metadata Json?
> ```
> 
> 



---



# 12\. Allocations Service



`apps/revenue-service/src/modules/allocations/allocations.service.ts`



```TypeScript
import { Injectable } from '@nestjs/common';
import Decimal from 'decimal.js';
import { ulid } from 'ulid';
import { AllocationsRepository } from './allocations.repository';
import { CreateAllocationDto } from './dto/create-allocation.dto';
import { QueryAllocationsDto } from './dto/query-allocations.dto';
import { ApproveAllocationDto } from './dto/approve-allocation.dto';
import { PoolSummaryQueryDto } from './dto/pool-summary-query.dto';
import { RevenueErrors } from '../../shared/revenue-errors';
import { Wine369RevenueRule } from '../../shared/revenue-pools';
import { RevenueAllocationStatus } from '../../shared/revenue-status';

@Injectable()
export class AllocationsService {
  constructor(private readonly allocationsRepository: AllocationsRepository) {}

  async create(dto: CreateAllocationDto) {
    const existing = await this.allocationsRepository.findByOrderId(dto.order_id);

    if (existing) {
      throw new Error(RevenueErrors.ALLOCATION_ALREADY_EXISTS);
    }

    const taxAmount = new Decimal(dto.tax_amount || '0');
    const paidAmount = new Decimal(dto.paid_amount);

    if (paidAmount.lte(0)) {
      throw new Error(RevenueErrors.ALLOCATION_AMOUNT_INVALID);
    }

    const netAmount = paidAmount.sub(taxAmount);

    if (netAmount.lt(0)) {
      throw new Error(RevenueErrors.ALLOCATION_AMOUNT_INVALID);
    }

    const items = this.calculateItems({
      productType: dto.product_type,
      netAmount
    });

    const allocation = await this.allocationsRepository.createWithItems({
      allocationNo: this.generateAllocationNo(),
      orderId: dto.order_id,
      userId: dto.user_id,
      productType: dto.product_type,
      ruleId: dto.rule_id,
      ruleVersion: dto.rule_version || 'WINE_369_REVENUE_RULE_V1',
      paidAmount: paidAmount.toFixed(18),
      taxAmount: taxAmount.toFixed(18),
      netAmount: netAmount.toFixed(18),
      currency: dto.currency,
      items
    });

    return this.formatAllocation(allocation);
  }

  async detailByOrderId(orderId: string) {
    const allocation = await this.allocationsRepository.findByOrderId(orderId);

    if (!allocation) {
      throw new Error(RevenueErrors.ALLOCATION_NOT_FOUND);
    }

    return this.formatAllocation(allocation);
  }

  async detail(allocationId: string) {
    const allocation = await this.allocationsRepository.findById(allocationId);

    if (!allocation) {
      throw new Error(RevenueErrors.ALLOCATION_NOT_FOUND);
    }

    return this.formatAllocation(allocation);
  }

  async list(query: QueryAllocationsDto) {
    const page = Number(query.page || 1);
    const pageSize = Math.min(Number(query.page_size || 20), 100);

    const [items, total] = await Promise.all([
      this.allocationsRepository.findMany({
        allocationNo: query.allocation_no,
        orderId: query.order_id,
        userId: query.user_id,
        productType: query.product_type,
        allocationStatus: query.allocation_status,
        page,
        pageSize
      }),
      this.allocationsRepository.count({
        allocationNo: query.allocation_no,
        orderId: query.order_id,
        userId: query.user_id,
        productType: query.product_type,
        allocationStatus: query.allocation_status
      })
    ]);

    return {
      items: items.map((item) => this.formatAllocation(item)),
      pagination: {
        page,
        page_size: pageSize,
        total,
        total_pages: Math.ceil(total / pageSize)
      }
    };
  }

  async approve(allocationId: string, dto: ApproveAllocationDto) {
    const allocation = await this.allocationsRepository.findById(allocationId);

    if (!allocation) {
      throw new Error(RevenueErrors.ALLOCATION_NOT_FOUND);
    }

    if (allocation.allocationStatus !== RevenueAllocationStatus.CALCULATED) {
      throw new Error(RevenueErrors.ALLOCATION_STATUS_INVALID);
    }

    const updated = await this.allocationsRepository.approve({
      allocationId,
      reviewerId: dto.reviewer_id,
      reviewNote: dto.review_note
    });

    return {
      allocation_id: updated.id,
      allocation_no: updated.allocationNo,
      allocation_status: updated.allocationStatus
    };
  }

  async poolSummary(query: PoolSummaryQueryDto) {
    const result = await this.allocationsRepository.poolSummary({
      poolType: query.pool_type,
      currency: query.currency,
      startTime: query.start_time ? new Date(query.start_time) : undefined,
      endTime: query.end_time ? new Date(query.end_time) : undefined
    });

    return {
      items: result.map((item) => ({
        pool_type: item.poolType,
        currency: item.currency,
        total_amount: item._sum.amount?.toString() || '0.000000000000000000'
      }))
    };
  }

  private calculateItems(params: {
    productType: string;
    netAmount: Decimal;
  }) {
    if (params.productType !== 'wine_369') {
      throw new Error(RevenueErrors.ALLOCATION_RULE_NOT_FOUND);
    }

    return Wine369RevenueRule.map((rule) => ({
      poolType: rule.pool_type,
      percentage: new Decimal(rule.percentage).toFixed(18),
      amount: params.netAmount.mul(rule.percentage).toFixed(18)
    }));
  }

  private formatAllocation(allocation: any) {
    return {
      allocation_id: allocation.id,
      allocation_no: allocation.allocationNo,
      order_id: allocation.orderId,
      user_id: allocation.userId,
      product_type: allocation.productType,
      rule_id: allocation.ruleId,
      rule_version: allocation.ruleVersion,
      paid_amount: allocation.paidAmount.toString(),
      tax_amount: allocation.taxAmount.toString(),
      net_amount: allocation.netAmount.toString(),
      currency: allocation.currency,
      allocation_status: allocation.allocationStatus,
      items: allocation.items?.map((item: any) => ({
        item_id: item.id,
        pool_type: item.poolType,
        percentage: item.percentage.toString(),
        amount: item.amount.toString(),
        currency: item.currency,
        status: item.status
      })) || []
    };
  }

  private generateAllocationNo() {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    return `ALC${date}${ulid()}`;
  }
}
```



---



# 13\. Allocations User Controller



`apps/revenue-service/src/modules/allocations/allocations.controller.ts`



```TypeScript
import { Controller, Get, Param } from '@nestjs/common';
import { AllocationsService } from './allocations.service';

@Controller('revenue')
export class AllocationsController {
  constructor(private readonly allocationsService: AllocationsService) {}

  @Get('orders/:order_id/allocation')
  detailByOrder(@Param('order_id') orderId: string) {
    return this.allocationsService.detailByOrderId(orderId);
  }
}
```



---



# 14\. Allocations Admin Controller



`apps/revenue-service/src/modules/allocations/allocations.admin.controller.ts`



```TypeScript
import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { AllocationsService } from './allocations.service';
import { CreateAllocationDto } from './dto/create-allocation.dto';
import { QueryAllocationsDto } from './dto/query-allocations.dto';
import { ApproveAllocationDto } from './dto/approve-allocation.dto';
import { PoolSummaryQueryDto } from './dto/pool-summary-query.dto';

@Controller('admin/revenue')
export class AllocationsAdminController {
  constructor(private readonly allocationsService: AllocationsService) {}

  @Post('allocations')
  create(@Body() dto: CreateAllocationDto) {
    return this.allocationsService.create(dto);
  }

  @Get('allocations')
  list(@Query() query: QueryAllocationsDto) {
    return this.allocationsService.list(query);
  }

  @Get('allocations/:allocation_id')
  detail(@Param('allocation_id') allocationId: string) {
    return this.allocationsService.detail(allocationId);
  }

  @Get('allocations/order/:order_id')
  detailByOrder(@Param('order_id') orderId: string) {
    return this.allocationsService.detailByOrderId(orderId);
  }

  @Post('allocations/:allocation_id/approve')
  approve(
    @Param('allocation_id') allocationId: string,
    @Body() dto: ApproveAllocationDto
  ) {
    return this.allocationsService.approve(allocationId, dto);
  }

  @Get('pools/summary')
  poolSummary(@Query() query: PoolSummaryQueryDto) {
    return this.allocationsService.poolSummary(query);
  }
}
```



---



# 15\. Allocations Module



`apps/revenue-service/src/modules/allocations/allocations.module.ts`



```TypeScript
import { Module } from '@nestjs/common';
import { AllocationsController } from './allocations.controller';
import { AllocationsAdminController } from './allocations.admin.controller';
import { AllocationsService } from './allocations.service';
import { AllocationsRepository } from './allocations.repository';

@Module({
  controllers: [AllocationsController, AllocationsAdminController],
  providers: [AllocationsService, AllocationsRepository],
  exports: [AllocationsService]
})
export class AllocationsModule {}
```



---



# 16\. DTO：CreateReversalDto



`apps/revenue-service/src/modules/reversals/dto/create-reversal.dto.ts`



```TypeScript
import { IsOptional, IsString } from 'class-validator';

export class CreateReversalDto {
  @IsString()
  original_allocation_id!: string;

  @IsString()
  order_id!: string;

  @IsOptional()
  @IsString()
  refund_id?: string;

  @IsString()
  reason!: string;
}
```



---



# 17\. DTO：QueryReversalsDto



`apps/revenue-service/src/modules/reversals/dto/query-reversals.dto.ts`



```TypeScript
import { IsOptional, IsString } from 'class-validator';

export class QueryReversalsDto {
  @IsOptional()
  @IsString()
  reversal_no?: string;

  @IsOptional()
  @IsString()
  order_id?: string;

  @IsOptional()
  @IsString()
  refund_id?: string;

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



# 18\. Reversals Repository



`apps/revenue-service/src/modules/reversals/reversals.repository.ts`



```TypeScript
import { Injectable } from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';
import { ulid } from 'ulid';

const prisma = new PrismaClient();

@Injectable()
export class ReversalsRepository {
  findAllocation(allocationId: string) {
    return prisma.revenueAllocation.findUnique({
      where: { id: allocationId },
      include: {
        items: true
      }
    });
  }

  findById(reversalId: string) {
    return prisma.revenueReversal.findUnique({
      where: { id: reversalId },
      include: {
        items: true
      }
    });
  }

  findByOriginalAllocationId(originalAllocationId: string) {
    return prisma.revenueReversal.findFirst({
      where: {
        originalAllocationId
      },
      include: {
        items: true
      }
    });
  }

  findMany(params: {
    reversalNo?: string;
    orderId?: string;
    refundId?: string;
    status?: string;
    page: number;
    pageSize: number;
  }) {
    return prisma.revenueReversal.findMany({
      where: {
        reversalNo: params.reversalNo,
        orderId: params.orderId,
        refundId: params.refundId,
        status: params.status
      },
      include: {
        items: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip: (params.page - 1) * params.pageSize,
      take: params.pageSize
    });
  }

  count(params: {
    reversalNo?: string;
    orderId?: string;
    refundId?: string;
    status?: string;
  }) {
    return prisma.revenueReversal.count({
      where: {
        reversalNo: params.reversalNo,
        orderId: params.orderId,
        refundId: params.refundId,
        status: params.status
      }
    });
  }

  createFromAllocation(data: {
    reversalNo: string;
    originalAllocationId: string;
    orderId: string;
    refundId?: string;
    reason: string;
    items: Array;
  }) {
    return prisma.$transaction(async (tx) => {
      const reversal = await tx.revenueReversal.create({
        data: {
          id: ulid(),
          reversalNo: data.reversalNo,
          originalAllocationId: data.originalAllocationId,
          orderId: data.orderId,
          refundId: data.refundId,
          reason: data.reason,
          status: 'completed'
        }
      });

      for (const item of data.items) {
        await tx.revenueReversalItem.create({
          data: {
            id: ulid(),
            reversalId: reversal.id,
            originalItemId: item.originalItemId,
            poolType: item.poolType,
            reverseAmount: new Prisma.Decimal(item.reverseAmount),
            currency: item.currency
          }
        });
      }

      await tx.revenueAllocation.update({
        where: {
          id: data.originalAllocationId
        },
        data: {
          allocationStatus: 'reversed'
        }
      });

      await tx.outboxEvent.create({
        data: {
          id: ulid(),
          eventType: 'revenue.reversed.v1',
          payload: {
            reversal_id: reversal.id,
            reversal_no: reversal.reversalNo,
            original_allocation_id: data.originalAllocationId,
            order_id: data.orderId,
            refund_id: data.refundId
          },
          status: 'pending',
          retryCount: 0
        }
      });

      return tx.revenueReversal.findUnique({
        where: { id: reversal.id },
        include: { items: true }
      });
    });
  }
}
```



---



# 19\. Reversals Service



`apps/revenue-service/src/modules/reversals/reversals.service.ts`



```TypeScript
import { Injectable } from '@nestjs/common';
import { ulid } from 'ulid';
import { CreateReversalDto } from './dto/create-reversal.dto';
import { QueryReversalsDto } from './dto/query-reversals.dto';
import { ReversalsRepository } from './reversals.repository';
import { RevenueErrors } from '../../shared/revenue-errors';

@Injectable()
export class ReversalsService {
  constructor(private readonly reversalsRepository: ReversalsRepository) {}

  async create(dto: CreateReversalDto) {
    const allocation = await this.reversalsRepository.findAllocation(
      dto.original_allocation_id
    );

    if (!allocation) {
      throw new Error(RevenueErrors.ALLOCATION_NOT_FOUND);
    }

    const existing = await this.reversalsRepository.findByOriginalAllocationId(
      dto.original_allocation_id
    );

    if (existing) {
      throw new Error(RevenueErrors.REVERSAL_ALREADY_EXISTS);
    }

    const reversal = await this.reversalsRepository.createFromAllocation({
      reversalNo: this.generateReversalNo(),
      originalAllocationId: dto.original_allocation_id,
      orderId: dto.order_id,
      refundId: dto.refund_id,
      reason: dto.reason,
      items: allocation.items.map((item) => ({
        originalItemId: item.id,
        poolType: item.poolType,
        reverseAmount: item.amount.negated().toFixed(18),
        currency: item.currency
      }))
    });

    return this.formatReversal(reversal);
  }

  async detail(reversalId: string) {
    const reversal = await this.reversalsRepository.findById(reversalId);

    if (!reversal) {
      throw new Error(RevenueErrors.REVERSAL_NOT_FOUND);
    }

    return this.formatReversal(reversal);
  }

  async list(query: QueryReversalsDto) {
    const page = Number(query.page || 1);
    const pageSize = Math.min(Number(query.page_size || 20), 100);

    const [items, total] = await Promise.all([
      this.reversalsRepository.findMany({
        reversalNo: query.reversal_no,
        orderId: query.order_id,
        refundId: query.refund_id,
        status: query.status,
        page,
        pageSize
      }),
      this.reversalsRepository.count({
        reversalNo: query.reversal_no,
        orderId: query.order_id,
        refundId: query.refund_id,
        status: query.status
      })
    ]);

    return {
      items: items.map((item) => this.formatReversal(item)),
      pagination: {
        page,
        page_size: pageSize,
        total,
        total_pages: Math.ceil(total / pageSize)
      }
    };
  }

  private formatReversal(reversal: any) {
    return {
      reversal_id: reversal.id,
      reversal_no: reversal.reversalNo,
      original_allocation_id: reversal.originalAllocationId,
      order_id: reversal.orderId,
      refund_id: reversal.refundId,
      reason: reversal.reason,
      status: reversal.status,
      items: reversal.items?.map((item: any) => ({
        item_id: item.id,
        original_item_id: item.originalItemId,
        pool_type: item.poolType,
        reverse_amount: item.reverseAmount.toString(),
        currency: item.currency
      })) || []
    };
  }

  private generateReversalNo() {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    return `RVR${date}${ulid()}`;
  }
}
```



---



# 20\. Reversals Admin Controller



`apps/revenue-service/src/modules/reversals/reversals.admin.controller.ts`



```TypeScript
import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ReversalsService } from './reversals.service';
import { CreateReversalDto } from './dto/create-reversal.dto';
import { QueryReversalsDto } from './dto/query-reversals.dto';

@Controller('admin/revenue/reversals')
export class ReversalsAdminController {
  constructor(private readonly reversalsService: ReversalsService) {}

  @Post()
  create(@Body() dto: CreateReversalDto) {
    return this.reversalsService.create(dto);
  }

  @Get()
  list(@Query() query: QueryReversalsDto) {
    return this.reversalsService.list(query);
  }

  @Get(':reversal_id')
  detail(@Param('reversal_id') reversalId: string) {
    return this.reversalsService.detail(reversalId);
  }
}
```



---



# 21\. Reversals Controller



`apps/revenue-service/src/modules/reversals/reversals.controller.ts`



```TypeScript
import { Controller, Get, Param } from '@nestjs/common';
import { ReversalsService } from './reversals.service';

@Controller('revenue/reversals')
export class ReversalsController {
  constructor(private readonly reversalsService: ReversalsService) {}

  @Get(':reversal_id')
  detail(@Param('reversal_id') reversalId: string) {
    return this.reversalsService.detail(reversalId);
  }
}
```



---



# 22\. Reversals Module



`apps/revenue-service/src/modules/reversals/reversals.module.ts`



```TypeScript
import { Module } from '@nestjs/common';
import { ReversalsController } from './reversals.controller';
import { ReversalsAdminController } from './reversals.admin.controller';
import { ReversalsService } from './reversals.service';
import { ReversalsRepository } from './reversals.repository';

@Module({
  controllers: [ReversalsController, ReversalsAdminController],
  providers: [ReversalsService, ReversalsRepository],
  exports: [ReversalsService]
})
export class ReversalsModule {}
```



---



# 23\. Revenue App Module



`apps/revenue-service/src/app.module.ts`



```TypeScript
import { Module } from '@nestjs/common';
import { HealthModule } from './health/health.module';
import { AllocationsModule } from './modules/allocations/allocations.module';
import { ReversalsModule } from './modules/reversals/reversals.module';

@Module({
  imports: [
    HealthModule,
    AllocationsModule,
    ReversalsModule
  ]
})
export class AppModule {}
```



---



# 24\. Revenue Service 当前 API



## 用户端 / 业务查询



```HTTP
GET /api/v1/revenue/orders/:order_id/allocation
GET /api/v1/revenue/reversals/:reversal_id
```



## 后台端



```HTTP
POST /api/v1/admin/revenue/allocations
GET /api/v1/admin/revenue/allocations
GET /api/v1/admin/revenue/allocations/:allocation_id
GET /api/v1/admin/revenue/allocations/order/:order_id
POST /api/v1/admin/revenue/allocations/:allocation_id/approve
GET /api/v1/admin/revenue/pools/summary

POST /api/v1/admin/revenue/reversals
GET /api/v1/admin/revenue/reversals
GET /api/v1/admin/revenue/reversals/:reversal_id
```



---



# 25\. 369 USD 分账结果验证



请求：



```JSON
{
  "order_id": "ord_001",
  "order_no": "ORD202601010001",
  "user_id": "usr_001",
  "product_type": "wine_369",
  "paid_amount": "369",
  "tax_amount": "0",
  "currency": "USD",
  "rule_version": "WINE_369_REVENUE_RULE_V1"
}
```



结果：



```JSON
{
  "paid_amount": "369.000000000000000000",
  "tax_amount": "0.000000000000000000",
  "net_amount": "369.000000000000000000",
  "items": [
    {
      "pool_type": "wine_cost_pool",
      "percentage": "0.400000000000000000",
      "amount": "147.600000000000000000"
    },
    {
      "pool_type": "market_ecosystem_pool",
      "percentage": "0.300000000000000000",
      "amount": "110.700000000000000000"
    },
    {
      "pool_type": "company_pool",
      "percentage": "0.300000000000000000",
      "amount": "110.700000000000000000"
    }
  ]
}
```



退款冲销结果：



```JSON
{
  "items": [
    {
      "pool_type": "wine_cost_pool",
      "reverse_amount": "-147.600000000000000000"
    },
    {
      "pool_type": "market_ecosystem_pool",
      "reverse_amount": "-110.700000000000000000"
    },
    {
      "pool_type": "company_pool",
      "reverse_amount": "-110.700000000000000000"
    }
  ]
}
```



---



# 26\. Revenue Service 已具备能力



这一版完成后，Revenue Service 支持：



```Plain Text
创建订单分账
防止重复分账
369 USD 40 / 30 / 30 分配
按净收入分配
支持税额扣除
生成分账主记录
生成分账明细
分账详情查询
分账列表查询
分账池统计
分账审核
退款分账冲销
冲销不删除原记录
冲销生成负数记录
RevenueAllocated outbox 事件
RevenueApproved outbox 事件
RevenueReversed outbox 事件
```



---



# 27\. 还需要补强的工业级能力



下一步基础库完善后补：



```Plain Text
统一 AppException
PrismaModule 注入
真实事件消费 order.paid.v1
真实规则引擎读取 revenue rule
分账重算但保留旧版本
财务流水联动 Finance Service
税务联动 Tax Service
审批流接入
Audit Log
Admin 权限 Guard
多币种汇率支持
含税 / 不含税规则版本化
```



---



# 28\. 下一步继续



按 23 个 Service 顺序，下一步写：



```Plain Text
7. Points Service 积分服务
```



Points Service 第一版会包含：



```Plain Text
FJ369 Points 权益值发放
cFJ369 发放
积分账户查询
积分流水查询
订单支付后自动发积分
积分撤销
积分冻结预留
积分过期预留
PointsIssued outbox 事件
PointsRevoked outbox 事件
```



需要补强数据库：



```Plain Text
asset_accounts
asset_ledgers
points_issue_records
points_expiration_records
points_rules
```



