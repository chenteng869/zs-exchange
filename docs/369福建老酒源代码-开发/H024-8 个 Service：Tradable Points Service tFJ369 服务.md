# H024\-8 个 Service：Tradable Points Service tFJ369 服务

下面继续按 23 个 Service 顺序写代码。



# 第 8 个 Service：Tradable Points Service tFJ369 服务



本服务负责：



```Plain Text
cFJ369 转 tFJ369
会员等级转换比例
手续费计算
手续费分配
转换订单
转换审核
tFJ369 发放
cFJ369 扣减
tFJ369 锁定
tFJ369 解锁
tFJ369 交易订单骨架
ConversionApproved outbox 事件
TPointsIssued outbox 事件
TPointsLocked outbox 事件
TPointsTradeCreated outbox 事件
```



---



# 1\. tFJ369 Service 目录结构



```Plain Text
apps/tradable-points-service/
├── src/
│   ├── app.module.ts
│   ├── main.ts
│   ├── health/
│   ├── shared/
│   │   ├── tpoints-errors.ts
│   │   ├── tpoints-events.ts
│   │   ├── tpoints-status.ts
│   │   ├── tpoints-level-ratios.ts
│   │   └── tpoints-fees.ts
│   └── modules/
│       ├── conversions/
│       │   ├── conversions.module.ts
│       │   ├── conversions.controller.ts
│       │   ├── conversions.admin.controller.ts
│       │   ├── conversions.repository.ts
│       │   ├── conversions.service.ts
│       │   └── dto/
│       │       ├── preview-conversion.dto.ts
│       │       ├── create-conversion.dto.ts
│       │       ├── approve-conversion.dto.ts
│       │       └── reject-conversion.dto.ts
│       ├── locks/
│       │   ├── locks.module.ts
│       │   ├── locks.controller.ts
│       │   ├── locks.admin.controller.ts
│       │   ├── locks.repository.ts
│       │   ├── locks.service.ts
│       │   └── dto/
│       │       ├── create-lock.dto.ts
│       │       └── unlock-lock.dto.ts
│       └── trades/
│           ├── trades.module.ts
│           ├── trades.controller.ts
│           ├── trades.admin.controller.ts
│           ├── trades.repository.ts
│           ├── trades.service.ts
│           └── dto/
│               ├── create-buy-order.dto.ts
│               ├── create-sell-order.dto.ts
│               ├── cancel-trade-order.dto.ts
│               └── query-orderbook.dto.ts
```



---



# 2\. Prisma 补充表



## 2\.1 PointsConversionOrder



```Plain Text
model PointsConversionOrder {
  id            String    @id
  conversionNo  String    @unique @map("conversion_no")
  userId        String    @map("user_id")
  memberLevel   String    @map("member_level")
  cfj369Amount  Decimal   @map("cfj369_amount") @db.Decimal(36, 18)
  convertRatio  Decimal   @map("convert_ratio") @db.Decimal(36, 18)
  tfj369Gross   Decimal   @map("tfj369_gross") @db.Decimal(36, 18)
  feeRate       Decimal   @map("fee_rate") @db.Decimal(36, 18)
  feeAmount     Decimal   @map("fee_amount") @db.Decimal(36, 18)
  tfj369Net     Decimal   @map("tfj369_net") @db.Decimal(36, 18)
  status        String    @default("created")
  riskStatus    String    @default("normal") @map("risk_status")
  reviewerId    String?   @map("reviewer_id")
  reviewNote    String?   @map("review_note")
  createdAt     DateTime  @default(now()) @map("created_at")
  approvedAt    DateTime? @map("approved_at")
  completedAt   DateTime? @map("completed_at")
  cancelledAt   DateTime? @map("cancelled_at")
  updatedAt     DateTime  @updatedAt @map("updated_at")
  metadata      Json?

  @@index([userId])
  @@index([status])
  @@map("points_conversion_orders")
}
```



## 2\.2 PointsConversionFeeItem



```Plain Text
model PointsConversionFeeItem {
  id            String   @id
  conversionId  String   @map("conversion_id")
  feeType       String   @map("fee_type")
  percentage    Decimal  @db.Decimal(36, 18)
  amount        Decimal  @db.Decimal(36, 18)
  assetLedgerId String?  @map("asset_ledger_id")
  createdAt     DateTime @default(now()) @map("created_at")

  @@index([conversionId])
  @@map("points_conversion_fee_items")
}
```



## 2\.3 TPointsTradeOrder



```Plain Text
model TPointsTradeOrder {
  id            String    @id
  tradeNo       String    @unique @map("trade_no")
  userId        String    @map("user_id")
  tradeSide     String    @map("trade_side")
  amount        Decimal   @db.Decimal(36, 18)
  unitPrice     Decimal   @map("unit_price") @db.Decimal(36, 18)
  totalPrice    Decimal   @map("total_price") @db.Decimal(36, 18)
  currency      String
  feeAmount     Decimal   @default(0) @map("fee_amount") @db.Decimal(36, 18)
  status        String    @default("created")
  riskStatus    String    @default("normal") @map("risk_status")
  createdAt     DateTime  @default(now()) @map("created_at")
  matchedAt     DateTime? @map("matched_at")
  completedAt   DateTime? @map("completed_at")
  cancelledAt   DateTime? @map("cancelled_at")
  updatedAt     DateTime  @updatedAt @map("updated_at")
  metadata      Json?

  @@index([userId])
  @@index([status])
  @@index([tradeSide])
  @@map("tpoints_trade_orders")
}
```



## 2\.4 TPointsTradeMatch



```Plain Text
model TPointsTradeMatch {
  id            String   @id
  matchNo       String   @unique @map("match_no")
  buyOrderId    String   @map("buy_order_id")
  sellOrderId   String   @map("sell_order_id")
  buyerId       String   @map("buyer_id")
  sellerId      String   @map("seller_id")
  amount        Decimal  @db.Decimal(36, 18)
  unitPrice     Decimal  @map("unit_price") @db.Decimal(36, 18)
  totalPrice    Decimal  @map("total_price") @db.Decimal(36, 18)
  feeAmount     Decimal  @default(0) @map("fee_amount") @db.Decimal(36, 18)
  matchedAt     DateTime @map("matched_at")
  createdAt     DateTime @default(now()) @map("created_at")
  metadata      Json?

  @@index([buyOrderId])
  @@index([sellOrderId])
  @@map("tpoints_trade_matches")
}
```



## 2\.5 TPointsTradeFee



```Plain Text
model TPointsTradeFee {
  id            String   @id
  tradeOrderId  String   @map("trade_order_id")
  matchId       String?  @map("match_id")
  feeType       String   @map("fee_type")
  percentage    Decimal  @db.Decimal(36, 18)
  amount        Decimal  @db.Decimal(36, 18)
  assetLedgerId String?  @map("asset_ledger_id")
  createdAt     DateTime @default(now()) @map("created_at")

  @@index([tradeOrderId])
  @@index([feeType])
  @@map("tpoints_trade_fees")
}
```



## 2\.6 TPointsLock



```Plain Text
model TPointsLock {
  id            String    @id
  lockNo        String    @unique @map("lock_no")
  userId        String    @map("user_id")
  amount        Decimal   @db.Decimal(36, 18)
  lockDays      Int       @map("lock_days")
  lockMultiplier Decimal  @map("lock_multiplier") @db.Decimal(36, 18)
  lockedAt      DateTime  @map("locked_at")
  unlockAt      DateTime  @map("unlock_at")
  lockStatus    String    @default("locked") @map("lock_status")
  assetLedgerId String?   @map("asset_ledger_id")
  createdAt     DateTime  @default(now()) @map("created_at")
  updatedAt     DateTime  @updatedAt @map("updated_at")
  metadata      Json?

  @@index([userId])
  @@index([lockStatus])
  @@map("tpoints_locks")
}
```



---



# 3\. tFJ369 Events



`apps/tradable-points-service/src/shared/tpoints-events.ts`



```TypeScript
export const TPointsEvents = {
  CONVERSION_PREVIEWED: 'tpoints.conversion_previewed.v1',
  CONVERSION_CREATED: 'tpoints.conversion_created.v1',
  CONVERSION_APPROVED: 'tpoints.conversion_approved.v1',
  CONVERSION_REJECTED: 'tpoints.conversion_rejected.v1',
  TPOINTS_ISSUED: 'tpoints.issued.v1',
  TPOINTS_FEE_CHARGED: 'tpoints.fee_charged.v1',
  TPOINTS_LOCKED: 'tpoints.locked.v1',
  TPOINTS_UNLOCKED: 'tpoints.unlocked.v1',
  TRADE_ORDER_CREATED: 'tpoints.trade_order_created.v1',
  TRADE_ORDER_CANCELLED: 'tpoints.trade_order_cancelled.v1',
  TRADE_ORDER_MATCHED: 'tpoints.trade_order_matched.v1',
  TRADE_ORDER_COMPLETED: 'tpoints.trade_order_completed.v1'
} as const;
```



---



# 4\. tFJ369 Errors



`apps/tradable-points-service/src/shared/tpoints-errors.ts`



```TypeScript
export const TPointsErrors = {
  CONVERSION_NOT_FOUND: 'TPOINTS_CONVERSION_NOT_FOUND',
  CONVERSION_ALREADY_EXISTS: 'TPOINTS_CONVERSION_ALREADY_EXISTS',
  CONVERSION_STATUS_INVALID: 'TPOINTS_CONVERSION_STATUS_INVALID',
  CONVERSION_AMOUNT_INVALID: 'TPOINTS_CONVERSION_AMOUNT_INVALID',
  CONVERSION_LIMIT_EXCEEDED: 'TPOINTS_CONVERSION_LIMIT_EXCEEDED',
  CONVERSION_RATIO_NOT_FOUND: 'TPOINTS_CONVERSION_RATIO_NOT_FOUND',

  LOCK_NOT_FOUND: 'TPOINTS_LOCK_NOT_FOUND',
  LOCK_STATUS_INVALID: 'TPOINTS_LOCK_STATUS_INVALID',
  LOCK_AMOUNT_INVALID: 'TPOINTS_LOCK_AMOUNT_INVALID',
  LOCK_EXPIRED: 'TPOINTS_LOCK_EXPIRED',

  TRADE_NOT_FOUND: 'TPOINTS_TRADE_NOT_FOUND',
  TRADE_STATUS_INVALID: 'TPOINTS_TRADE_STATUS_INVALID',
  TRADE_AMOUNT_INVALID: 'TPOINTS_TRADE_AMOUNT_INVALID',
  TRADE_ORDERBOOK_EMPTY: 'TPOINTS_TRADE_ORDERBOOK_EMPTY'
} as const;
```



---



# 5\. tFJ369 Status



`apps/tradable-points-service/src/shared/tpoints-status.ts`



```TypeScript
export const ConversionStatus = {
  CREATED: 'created',
  PENDING_REVIEW: 'pending_review',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  RISK_HOLD: 'risk_hold'
} as const;

export const LockStatus = {
  LOCKED: 'locked',
  UNLOCK_PENDING: 'unlock_pending',
  UNLOCKED: 'unlocked',
  FORCE_UNLOCKED: 'force_unlocked',
  RISK_FROZEN: 'risk_frozen'
} as const;

export const TradeStatus = {
  CREATED: 'created',
  OPEN: 'open',
  PARTIAL_MATCHED: 'partial_matched',
  MATCHED: 'matched',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  FAILED: 'failed',
  RISK_HOLD: 'risk_hold'
} as const;
```



---



# 6\. tFJ369 Level Ratios



`apps/tradable-points-service/src/shared/tpoints-level-ratios.ts`



```TypeScript
export const TPointsLevelRatios = {
  bronze: '100',
  silver: '95',
  gold: '90',
  platinum: '85',
  diamond: '80',
  genesis: '75'
} as const;
```



---



# 7\. tFJ369 Fees



`apps/tradable-points-service/src/shared/tpoints-fees.ts`



```TypeScript
export const TPointsFeeConfig = {
  fee_rate: '0.05',
  fee_distribution: {
    burn: '0.30',
    reward_pool: '0.40',
    liquidity_operation_pool: '0.30'
  }
} as const;
```



---



# 8\. DTO：PreviewConversionDto



`apps/tradable-points-service/src/modules/conversions/dto/preview-conversion.dto.ts`



```TypeScript
import { IsString } from 'class-validator';

export class PreviewConversionDto {
  @IsString()
  cfj369_amount!: string;
}
```



---



# 9\. DTO：CreateConversionDto



`apps/tradable-points-service/src/modules/conversions/dto/create-conversion.dto.ts`



```TypeScript
import { IsString } from 'class-validator';

export class CreateConversionDto {
  @IsString()
  user_id!: string;

  @IsString()
  cfj369_amount!: string;
}
```



---



# 10\. DTO：ApproveConversionDto



`apps/tradable-points-service/src/modules/conversions/dto/approve-conversion.dto.ts`



```TypeScript
import { IsOptional, IsString } from 'class-validator';

export class ApproveConversionDto {
  @IsString()
  reviewer_id!: string;

  @IsOptional()
  @IsString()
  review_note?: string;
}
```



---



# 11\. DTO：RejectConversionDto



`apps/tradable-points-service/src/modules/conversions/dto/reject-conversion.dto.ts`



```TypeScript
import { IsString } from 'class-validator';

export class RejectConversionDto {
  @IsString()
  reviewer_id!: string;

  @IsString()
  review_note!: string;
}
```



---



# 12\. Conversions Repository



`apps/tradable-points-service/src/modules/conversions/conversions.repository.ts`



```TypeScript
import { Injectable } from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';
import { ulid } from 'ulid';

const prisma = new PrismaClient();

@Injectable()
export class ConversionsRepository {
  findById(conversionId: string) {
    return prisma.pointsConversionOrder.findUnique({
      where: { id: conversionId }
    });
  }

  findByUserAndSource(userId: string, sourceId: string) {
    return prisma.pointsConversionOrder.findFirst({
      where: {
        userId,
        metadata: {
          path: ['source_id'],
          equals: sourceId
        }
      }
    });
  }

  create(data: {
    conversionNo: string;
    userId: string;
    memberLevel: string;
    cfj369Amount: string;
    convertRatio: string;
    tfj369Gross: string;
    feeRate: string;
    feeAmount: string;
    tfj369Net: string;
    sourceType?: string;
    sourceId?: string;
  }) {
    return prisma.$transaction(async (tx) => {
      const conversion = await tx.pointsConversionOrder.create({
        data: {
          id: ulid(),
          conversionNo: data.conversionNo,
          userId: data.userId,
          memberLevel: data.memberLevel,
          cfj369Amount: new Prisma.Decimal(data.cfj369Amount),
          convertRatio: new Prisma.Decimal(data.convertRatio),
          tfj369Gross: new Prisma.Decimal(data.tfj369Gross),
          feeRate: new Prisma.Decimal(data.feeRate),
          feeAmount: new Prisma.Decimal(data.feeAmount),
          tfj369Net: new Prisma.Decimal(data.tfj369Net),
          status: 'created',
          riskStatus: 'normal',
          metadata: {
            source_type: data.sourceType || 'manual',
            source_id: data.sourceId || null
          }
        }
      });

      await tx.outboxEvent.create({
        data: {
          id: ulid(),
          eventType: 'tpoints.conversion_created.v1',
          payload: {
            conversion_id: conversion.id,
            conversion_no: conversion.conversionNo,
            user_id: conversion.userId,
            member_level: conversion.memberLevel,
            cfj369_amount: conversion.cfj369Amount.toString(),
            convert_ratio: conversion.convertRatio.toString(),
            tfj369_gross: conversion.tfj369Gross.toString(),
            fee_amount: conversion.feeAmount.toString(),
            tfj369_net: conversion.tfj369Net.toString()
          },
          status: 'pending',
          retryCount: 0
        }
      });

      return conversion;
    });
  }

  updateStatus(params: {
    conversionId: string;
    status: string;
    reviewerId?: string;
    reviewNote?: string;
  }) {
    return prisma.$transaction(async (tx) => {
      const updated = await tx.pointsConversionOrder.update({
        where: { id: params.conversionId },
        data: {
          status: params.status,
          reviewerId: params.reviewerId,
          reviewNote: params.reviewNote,
          approvedAt: params.status === 'approved' ? new Date() : undefined,
          completedAt: params.status === 'completed' ? new Date() : undefined,
          cancelledAt: params.status === 'cancelled' ? new Date() : undefined
        }
      });

      await tx.outboxEvent.create({
        data: {
          id: ulid(),
          eventType:
            params.status === 'approved'
              ? 'tpoints.conversion_approved.v1'
              : 'tpoints.conversion_rejected.v1',
          payload: {
            conversion_id: updated.id,
            conversion_no: updated.conversionNo,
            user_id: updated.userId,
            status: updated.status,
            reviewer_id: params.reviewerId,
            review_note: params.reviewNote
          },
          status: 'pending',
          retryCount: 0
        }
      });

      return updated;
    });
  }

  createFeeItems(params: {
    conversionId: string;
    currency: string;
    feeAmount: string;
  }) {
    return prisma.$transaction(async (tx) => {
      const burnAmount = new Prisma.Decimal(params.feeAmount).mul('0.30');
      const rewardAmount = new Prisma.Decimal(params.feeAmount).mul('0.40');
      const liquidityAmount = new Prisma.Decimal(params.feeAmount).mul('0.30');

      const items = [
        {
          feeType: 'burn',
          percentage: '0.30',
          amount: burnAmount
        },
        {
          feeType: 'reward_pool',
          percentage: '0.40',
          amount: rewardAmount
        },
        {
          feeType: 'liquidity_operation_pool',
          percentage: '0.30',
          amount: liquidityAmount
        }
      ];

      for (const item of items) {
        await tx.pointsConversionFeeItem.create({
          data: {
            id: ulid(),
            conversionId: params.conversionId,
            feeType: item.feeType,
            percentage: new Prisma.Decimal(item.percentage),
            amount: item.amount
          }
        });
      }

      return items;
    });
  }
}
```



---



# 13\. Conversions Service



`apps/tradable-points-service/src/modules/conversions/conversions.service.ts`



```TypeScript
import { Injectable } from '@nestjs/common';
import Decimal from 'decimal.js';
import { ulid } from 'ulid';
import { ConversionsRepository } from './conversions.repository';
import { PreviewConversionDto } from './dto/preview-conversion.dto';
import { CreateConversionDto } from './dto/create-conversion.dto';
import { ApproveConversionDto } from './dto/approve-conversion.dto';
import { RejectConversionDto } from './dto/reject-conversion.dto';
import { TPointsErrors } from '../../shared/tpoints-errors';
import { TPointsFeeConfig } from '../../shared/tpoints-fees';
import { TPointsLevelRatios } from '../../shared/tpoints-level-ratios';
import { ConversionStatus } from '../../shared/tpoints-status';

@Injectable()
export class ConversionsService {
  constructor(private readonly conversionsRepository: ConversionsRepository) {}

  preview(dto: PreviewConversionDto, memberLevel = 'bronze') {
    const ratio = TPointsLevelRatios[memberLevel as keyof typeof TPointsLevelRatios];

    if (!ratio) {
      throw new Error(TPointsErrors.CONVERSION_RATIO_NOT_FOUND);
    }

    const cfj369Amount = new Decimal(dto.cfj369_amount);
    if (cfj369Amount.lte(0)) {
      throw new Error(TPointsErrors.CONVERSION_AMOUNT_INVALID);
    }

    const convertRatio = new Decimal(ratio);
    const tfj369Gross = cfj369Amount.div(convertRatio);
    const feeRate = new Decimal(TPointsFeeConfig.fee_rate);
    const feeAmount = tfj369Gross.mul(feeRate);
    const tfj369Net = tfj369Gross.sub(feeAmount);

    return {
      member_level: memberLevel,
      convert_ratio: convertRatio.toFixed(18),
      cfj369_amount: cfj369Amount.toFixed(18),
      tfj369_gross: tfj369Gross.toFixed(18),
      fee_rate: feeRate.toFixed(18),
      fee_amount: feeAmount.toFixed(18),
      tfj369_net: tfj369Net.toFixed(18),
      fee_items: [
        {
          fee_type: 'burn',
          amount: feeAmount.mul('0.30').toFixed(18)
        },
        {
          fee_type: 'reward_pool',
          amount: feeAmount.mul('0.40').toFixed(18)
        },
        {
          fee_type: 'liquidity_operation_pool',
          amount: feeAmount.mul('0.30').toFixed(18)
        }
      ]
    };
  }

  async create(dto: CreateConversionDto, memberLevel = 'bronze') {
    const preview = this.preview(
      { cfj369_amount: dto.cfj369_amount },
      memberLevel
    );

    const conversion = await this.conversionsRepository.create({
      conversionNo: this.generateConversionNo(),
      userId: dto.user_id,
      memberLevel,
      cfj369Amount: preview.cfj369_amount,
      convertRatio: preview.convert_ratio,
      tfj369Gross: preview.tfj369_gross,
      feeRate: preview.fee_rate,
      feeAmount: preview.fee_amount,
      tfj369Net: preview.tfJ369_net || preview.tfj369_net,
      sourceType: 'manual',
      sourceId: ulid()
    });

    await this.conversionsRepository.createFeeItems({
      conversionId: conversion.id,
      currency: 'tFJ369',
      feeAmount: preview.fee_amount
    });

    return {
      conversion_id: conversion.id,
      conversion_no: conversion.conversionNo,
      user_id: conversion.userId,
      member_level: conversion.memberLevel,
      cfj369_amount: conversion.cfj369Amount.toString(),
      tfj369_gross: conversion.tfj369Gross.toString(),
      fee_rate: conversion.feeRate.toString(),
      fee_amount: conversion.feeAmount.toString(),
      tfj369_net: conversion.tfj369Net.toString(),
      status: conversion.status
    };
  }

  async approve(conversionId: string, dto: ApproveConversionDto) {
    const conversion = await this.conversionsRepository.findById(conversionId);

    if (!conversion) {
      throw new Error(TPointsErrors.CONVERSION_NOT_FOUND);
    }

    if (conversion.status !== ConversionStatus.CREATED && conversion.status !== ConversionStatus.PENDING_REVIEW) {
      throw new Error(TPointsErrors.CONVERSION_STATUS_INVALID);
    }

    const updated = await this.conversionsRepository.updateStatus({
      conversionId,
      status: ConversionStatus.APPROVED,
      reviewerId: dto.reviewer_id,
      reviewNote: dto.review_note
    });

    const completed = await this.conversionsRepository.updateStatus({
      conversionId,
      status: ConversionStatus.COMPLETED,
      reviewerId: dto.reviewer_id,
      reviewNote: dto.review_note
    });

    return {
      conversion_id: completed.id,
      conversion_no: completed.conversionNo,
      status: completed.status,
      approved_at: updated.approvedAt || completed.approvedAt,
      completed_at: completed.completedAt
    };
  }

  async reject(conversionId: string, dto: RejectConversionDto) {
    const conversion = await this.conversionsRepository.findById(conversionId);

    if (!conversion) {
      throw new Error(TPointsErrors.CONVERSION_NOT_FOUND);
    }

    if (conversion.status !== ConversionStatus.CREATED && conversion.status !== ConversionStatus.PENDING_REVIEW) {
      throw new Error(TPointsErrors.CONVERSION_STATUS_INVALID);
    }

    const updated = await this.conversionsRepository.updateStatus({
      conversionId,
      status: ConversionStatus.REJECTED,
      reviewerId: dto.reviewer_id,
      reviewNote: dto.review_note
    });

    return {
      conversion_id: updated.id,
      conversion_no: updated.conversionNo,
      status: updated.status,
      review_note: updated.reviewNote
    };
  }

  private generateConversionNo() {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    return `CNV${date}${ulid()}`;
  }
}
```



---



# 14\. Conversions User Controller



`apps/tradable-points-service/src/modules/conversions/conversions.controller.ts`



```TypeScript
import { Body, Controller, Post } from '@nestjs/common';
import { ConversionsService } from './conversions.service';
import { PreviewConversionDto } from './dto/preview-conversion.dto';
import { CreateConversionDto } from './dto/create-conversion.dto';

@Controller('tpoints')
export class ConversionsController {
  constructor(private readonly conversionsService: ConversionsService) {}

  @Post('conversions/preview')
  preview(@Body() dto: PreviewConversionDto) {
    return this.conversionsService.preview(dto);
  }

  @Post('conversions')
  create(@Body() dto: CreateConversionDto) {
    return this.conversionsService.create(dto);
  }
}
```



---



# 15\. Conversions Admin Controller



`apps/tradable-points-service/src/modules/conversions/conversions.admin.controller.ts`



```TypeScript
import { Body, Controller, Param, Post } from '@nestjs/common';
import { ConversionsService } from './conversions.service';
import { ApproveConversionDto } from './dto/approve-conversion.dto';
import { RejectConversionDto } from './dto/reject-conversion.dto';

@Controller('admin/tpoints/conversions')
export class ConversionsAdminController {
  constructor(private readonly conversionsService: ConversionsService) {}

  @Post(':conversion_id/approve')
  approve(
    @Param('conversion_id') conversionId: string,
    @Body() dto: ApproveConversionDto
  ) {
    return this.conversionsService.approve(conversionId, dto);
  }

  @Post(':conversion_id/reject')
  reject(
    @Param('conversion_id') conversionId: string,
    @Body() dto: RejectConversionDto
  ) {
    return this.conversionsService.reject(conversionId, dto);
  }
}
```



---



# 16\. Conversions Module



`apps/tradable-points-service/src/modules/conversions/conversions.module.ts`



```TypeScript
import { Module } from '@nestjs/common';
import { ConversionsController } from './conversions.controller';
import { ConversionsAdminController } from './conversions.admin.controller';
import { ConversionsService } from './conversions.service';
import { ConversionsRepository } from './conversions.repository';

@Module({
  controllers: [ConversionsController, ConversionsAdminController],
  providers: [ConversionsService, ConversionsRepository],
  exports: [ConversionsService]
})
export class ConversionsModule {}
```



---



# 17\. DTO：CreateLockDto



`apps/tradable-points-service/src/modules/locks/dto/create-lock.dto.ts`



```TypeScript
import { IsInt, IsString, Min } from 'class-validator';

export class CreateLockDto {
  @IsString()
  user_id!: string;

  @IsString()
  amount!: string;

  @IsInt()
  @Min(1)
  lock_days!: number;
}
```



---



# 18\. DTO：UnlockLockDto



`apps/tradable-points-service/src/modules/locks/dto/unlock-lock.dto.ts`



```TypeScript
import { IsOptional, IsString } from 'class-validator';

export class UnlockLockDto {
  @IsOptional()
  @IsString()
  operator_id?: string;

  @IsOptional()
  @IsString()
  reason?: string;
}
```



---



# 19\. Locks Repository



`apps/tradable-points-service/src/modules/locks/locks.repository.ts`



```TypeScript
import { Injectable } from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';
import { ulid } from 'ulid';

const prisma = new PrismaClient();

@Injectable()
export class LocksRepository {
  create(data: {
    lockNo: string;
    userId: string;
    amount: string;
    lockDays: number;
    lockMultiplier: string;
    assetLedgerId?: string;
  }) {
    const lockedAt = new Date();
    const unlockAt = new Date(lockedAt);
    unlockAt.setDate(unlockAt.getDate() + data.lockDays);

    return prisma.$transaction(async (tx) => {
      const lock = await tx.tPointsLock.create({
        data: {
          id: ulid(),
          lockNo: data.lockNo,
          userId: data.userId,
          amount: new Prisma.Decimal(data.amount),
          lockDays: data.lockDays,
          lockMultiplier: new Prisma.Decimal(data.lockMultiplier),
          lockedAt,
          unlockAt,
          lockStatus: 'locked',
          assetLedgerId: data.assetLedgerId
        }
      });

      await tx.outboxEvent.create({
        data: {
          id: ulid(),
          eventType: 'tpoints.locked.v1',
          payload: {
            lock_id: lock.id,
            lock_no: lock.lockNo,
            user_id: lock.userId,
            amount: lock.amount.toString(),
            lock_days: lock.lockDays,
            lock_multiplier: lock.lockMultiplier.toString(),
            unlock_at: lock.unlockAt
          },
          status: 'pending',
          retryCount: 0
        }
      });

      return lock;
    });
  }

  findById(lockId: string) {
    return prisma.tPointsLock.findUnique({
      where: { id: lockId }
    });
  }

  updateStatus(lockId: string, lockStatus: string) {
    return prisma.tPointsLock.update({
      where: { id: lockId },
      data: {
        lockStatus
      }
    });
  }
}
```



---



# 20\. Locks Service



`apps/tradable-points-service/src/modules/locks/locks.service.ts`



```TypeScript
import { Injectable } from '@nestjs/common';
import Decimal from 'decimal.js';
import { ulid } from 'ulid';
import { LocksRepository } from './locks.repository';
import { CreateLockDto } from './dto/create-lock.dto';
import { UnlockLockDto } from './dto/unlock-lock.dto';
import { TPointsErrors } from '../../shared/tpoints-errors';
import { LockStatus } from '../../shared/tpoints-status';

@Injectable()
export class LocksService {
  constructor(private readonly locksRepository: LocksRepository) {}

  async create(dto: CreateLockDto) {
    if (new Decimal(dto.amount).lte(0)) {
      throw new Error(TPointsErrors.LOCK_AMOUNT_INVALID);
    }

    const lockMultiplier = this.calculateMultiplier(dto.lock_days);

    const lock = await this.locksRepository.create({
      lockNo: this.generateLockNo(),
      userId: dto.user_id,
      amount: new Decimal(dto.amount).toFixed(18),
      lockDays: dto.lock_days,
      lockMultiplier
    });

    return {
      lock_id: lock.id,
      lock_no: lock.lockNo,
      user_id: lock.userId,
      amount: lock.amount.toString(),
      lock_days: lock.lockDays,
      lock_multiplier: lock.lockMultiplier.toString(),
      lock_status: lock.lockStatus,
      locked_at: lock.lockedAt,
      unlock_at: lock.unlockAt
    };
  }

  async detail(lockId: string) {
    const lock = await this.locksRepository.findById(lockId);

    if (!lock) {
      throw new Error(TPointsErrors.LOCK_NOT_FOUND);
    }

    return {
      lock_id: lock.id,
      lock_no: lock.lockNo,
      user_id: lock.userId,
      amount: lock.amount.toString(),
      lock_days: lock.lockDays,
      lock_multiplier: lock.lockMultiplier.toString(),
      lock_status: lock.lockStatus,
      locked_at: lock.lockedAt,
      unlock_at: lock.unlockAt,
      asset_ledger_id: lock.assetLedgerId
    };
  }

  async unlock(lockId: string, dto: UnlockLockDto) {
    const lock = await this.locksRepository.findById(lockId);

    if (!lock) {
      throw new Error(TPointsErrors.LOCK_NOT_FOUND);
    }

    if (lock.lockStatus !== LockStatus.LOCKED && lock.lockStatus !== LockStatus.UNLOCK_PENDING) {
      throw new Error(TPointsErrors.LOCK_STATUS_INVALID);
    }

    if (new Date() = 365) return '1.25';
    if (lockDays >= 180) return '1.15';
    if (lockDays >= 90) return '1.10';
    return '1.00';
  }

  private generateLockNo() {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    return `LCK${date}${ulid()}`;
  }
}
```



---



# 21\. Locks Controllers



`apps/tradable-points-service/src/modules/locks/locks.controller.ts`



```TypeScript
import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { LocksService } from './locks.service';
import { CreateLockDto } from './dto/create-lock.dto';

@Controller('tpoints/locks')
export class LocksController {
  constructor(private readonly locksService: LocksService) {}

  @Post()
  create(@Body() dto: CreateLockDto) {
    return this.locksService.create(dto);
  }

  @Get(':lock_id')
  detail(@Param('lock_id') lockId: string) {
    return this.locksService.detail(lockId);
  }
}
```



`apps/tradable-points-service/src/modules/locks/locks.admin.controller.ts`



```TypeScript
import { Body, Controller, Param, Post } from '@nestjs/common';
import { LocksService } from './locks.service';
import { UnlockLockDto } from './dto/unlock-lock.dto';

@Controller('admin/tpoints/locks')
export class LocksAdminController {
  constructor(private readonly locksService: LocksService) {}

  @Post(':lock_id/unlock')
  unlock(@Param('lock_id') lockId: string, @Body() dto: UnlockLockDto) {
    return this.locksService.unlock(lockId, dto);
  }
}
```



`apps/tradable-points-service/src/modules/locks/locks.module.ts`



```TypeScript
import { Module } from '@nestjs/common';
import { LocksController } from './locks.controller';
import { LocksAdminController } from './locks.admin.controller';
import { LocksService } from './locks.service';
import { LocksRepository } from './locks.repository';

@Module({
  controllers: [LocksController, LocksAdminController],
  providers: [LocksService, LocksRepository],
  exports: [LocksService]
})
export class LocksModule {}
```



---



# 22\. DTO：CreateBuyOrderDto



`apps/tradable-points-service/src/modules/trades/dto/create-buy-order.dto.ts`



```TypeScript
import { IsString } from 'class-validator';

export class CreateBuyOrderDto {
  @IsString()
  user_id!: string;

  @IsString()
  amount!: string;

  @IsString()
  unit_price!: string;

  @IsString()
  currency!: string;
}
```



---



# 23\. DTO：CreateSellOrderDto



`apps/tradable-points-service/src/modules/trades/dto/create-sell-order.dto.ts`



```TypeScript
import { IsString } from 'class-validator';

export class CreateSellOrderDto {
  @IsString()
  user_id!: string;

  @IsString()
  amount!: string;

  @IsString()
  unit_price!: string;

  @IsString()
  currency!: string;
}
```



---



# 24\. DTO：CancelTradeOrderDto



`apps/tradable-points-service/src/modules/trades/dto/cancel-trade-order.dto.ts`



```TypeScript
import { IsOptional, IsString } from 'class-validator';

export class CancelTradeOrderDto {
  @IsOptional()
  @IsString()
  operator_id?: string;

  @IsOptional()
  @IsString()
  reason?: string;
}
```



---



# 25\. DTO：QueryOrderbookDto



`apps/tradable-points-service/src/modules/trades/dto/query-orderbook.dto.ts`



```TypeScript
import { IsOptional, IsString } from 'class-validator';

export class QueryOrderbookDto {
  @IsOptional()
  @IsString()
  currency?: string;
}
```



---



# 26\. Trades Repository



`apps/tradable-points-service/src/modules/trades/trades.repository.ts`



```TypeScript
import { Injectable } from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';
import { ulid } from 'ulid';

const prisma = new PrismaClient();

@Injectable()
export class TradesRepository {
  createOrder(data: {
    tradeNo: string;
    userId: string;
    tradeSide: string;
    amount: string;
    unitPrice: string;
    currency: string;
  }) {
    return prisma.$transaction(async (tx) => {
      const order = await tx.tPointsTradeOrder.create({
        data: {
          id: ulid(),
          tradeNo: data.tradeNo,
          userId: data.userId,
          tradeSide: data.tradeSide,
          amount: new Prisma.Decimal(data.amount),
          unitPrice: new Prisma.Decimal(data.unitPrice),
          totalPrice: new Prisma.Decimal(data.amount).mul(new Prisma.Decimal(data.unitPrice)),
          currency: data.currency,
          feeAmount: new Prisma.Decimal(0),
          status: 'open',
          riskStatus: 'normal'
        }
      });

      await tx.outboxEvent.create({
        data: {
          id: ulid(),
          eventType: 'tpoints.trade_order_created.v1',
          payload: {
            trade_id: order.id,
            trade_no: order.tradeNo,
            user_id: order.userId,
            trade_side: order.tradeSide,
            amount: order.amount.toString(),
            unit_price: order.unitPrice.toString(),
            total_price: order.totalPrice.toString(),
            currency: order.currency
          },
          status: 'pending',
          retryCount: 0
        }
      });

      return order;
    });
  }

  findById(tradeId: string) {
    return prisma.tPointsTradeOrder.findUnique({
      where: { id: tradeId }
    });
  }

  findMany(params: { tradeSide?: string; currency?: string; status?: string }) {
    return prisma.tPointsTradeOrder.findMany({
      where: {
        tradeSide: params.tradeSide,
        currency: params.currency,
        status: params.status
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  cancel(tradeId: string) {
    return prisma.tPointsTradeOrder.update({
      where: { id: tradeId },
      data: {
        status: 'cancelled',
        cancelledAt: new Date()
      }
    });
  }
}
```



---



# 27\. Trades Service



`apps/tradable-points-service/src/modules/trades/trades.service.ts`



```TypeScript
import { Injectable } from '@nestjs/common';
import Decimal from 'decimal.js';
import { ulid } from 'ulid';
import { TradesRepository } from './trades.repository';
import { CreateBuyOrderDto } from './dto/create-buy-order.dto';
import { CreateSellOrderDto } from './dto/create-sell-order.dto';
import { CancelTradeOrderDto } from './dto/cancel-trade-order.dto';
import { QueryOrderbookDto } from './dto/query-orderbook.dto';
import { TPointsErrors } from '../../shared/tpoints-errors';
import { TradeStatus } from '../../shared/tpoints-status';

@Injectable()
export class TradesService {
  constructor(private readonly tradesRepository: TradesRepository) {}

  async createBuyOrder(dto: CreateBuyOrderDto) {
    return this.createOrder(dto, 'buy');
  }

  async createSellOrder(dto: CreateSellOrderDto) {
    return this.createOrder(dto, 'sell');
  }

  async listOrderbook(query: QueryOrderbookDto) {
    const currency = query.currency || 'USDT';
    const items = await this.tradesRepository.findMany({ currency });

    return {
      symbol: `tFJ369/${currency}`,
      bids: items
        .filter((item) => item.tradeSide === 'buy' && item.status === 'open')
        .map((item) => ({
          trade_no: item.tradeNo,
          amount: item.amount.toString(),
          unit_price: item.unitPrice.toString()
        })),
      asks: items
        .filter((item) => item.tradeSide === 'sell' && item.status === 'open')
        .map((item) => ({
          trade_no: item.tradeNo,
          amount: item.amount.toString(),
          unit_price: item.unitPrice.toString()
        }))
    };
  }

  async detail(tradeId: string) {
    const trade = await this.tradesRepository.findById(tradeId);

    if (!trade) {
      throw new Error(TPointsErrors.TRADE_NOT_FOUND);
    }

    return {
      trade_id: trade.id,
      trade_no: trade.tradeNo,
      user_id: trade.userId,
      trade_side: trade.tradeSide,
      amount: trade.amount.toString(),
      unit_price: trade.unitPrice.toString(),
      total_price: trade.totalPrice.toString(),
      currency: trade.currency,
      fee_amount: trade.feeAmount.toString(),
      status: trade.status,
      risk_status: trade.riskStatus,
      created_at: trade.createdAt
    };
  }

  async cancel(tradeId: string, dto: CancelTradeOrderDto) {
    const trade = await this.tradesRepository.findById(tradeId);

    if (!trade) {
      throw new Error(TPointsErrors.TRADE_NOT_FOUND);
    }

    if (trade.status !== TradeStatus.OPEN && trade.status !== TradeStatus.CREATED) {
      throw new Error(TPointsErrors.TRADE_STATUS_INVALID);
    }

    const updated = await this.tradesRepository.cancel(tradeId);

    return {
      trade_id: updated.id,
      trade_no: updated.tradeNo,
      status: updated.status,
      cancelled_at: updated.cancelledAt,
      operator_id: dto.operator_id,
      reason: dto.reason
    };
  }

  private async createOrder(
    dto: CreateBuyOrderDto | CreateSellOrderDto,
    side: 'buy' | 'sell'
  ) {
    if (new Decimal(dto.amount).lte(0) || new Decimal(dto.unit_price).lte(0)) {
      throw new Error(TPointsErrors.TRADE_AMOUNT_INVALID);
    }

    const order = await this.tradesRepository.createOrder({
      tradeNo: this.generateTradeNo(),
      userId: dto.user_id,
      tradeSide: side,
      amount: new Decimal(dto.amount).toFixed(18),
      unitPrice: new Decimal(dto.unit_price).toFixed(18),
      currency: dto.currency
    });

    return {
      trade_order_id: order.id,
      trade_no: order.tradeNo,
      trade_side: order.tradeSide,
      amount: order.amount.toString(),
      unit_price: order.unitPrice.toString(),
      total_price: order.totalPrice.toString(),
      currency: order.currency,
      status: order.status
    };
  }

  private generateTradeNo() {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    return `TRD${date}${ulid()}`;
  }
}
```



---



# 28\. Trades Controllers



`apps/tradable-points-service/src/modules/trades/trades.controller.ts`



```TypeScript
import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { TradesService } from './trades.service';
import { CreateBuyOrderDto } from './dto/create-buy-order.dto';
import { CreateSellOrderDto } from './dto/create-sell-order.dto';
import { QueryOrderbookDto } from './dto/query-orderbook.dto';

@Controller('tpoints')
export class TradesController {
  constructor(private readonly tradesService: TradesService) {}

  @Post('trades/buy')
  createBuy(@Body() dto: CreateBuyOrderDto) {
    return this.tradesService.createBuyOrder(dto);
  }

  @Post('trades/sell')
  createSell(@Body() dto: CreateSellOrderDto) {
    return this.tradesService.createSellOrder(dto);
  }

  @Get('market/orderbook')
  orderbook(@Query() query: QueryOrderbookDto) {
    return this.tradesService.listOrderbook(query);
  }

  @Get('market/trades/:trade_id')
  detail(@Param('trade_id') tradeId: string) {
    return this.tradesService.detail(tradeId);
  }
}
```



`apps/tradable-points-service/src/modules/trades/trades.admin.controller.ts`



```TypeScript
import { Body, Controller, Param, Post } from '@nestjs/common';
import { TradesService } from './trades.service';
import { CancelTradeOrderDto } from './dto/cancel-trade-order.dto';

@Controller('admin/tpoints/trades')
export class TradesAdminController {
  constructor(private readonly tradesService: TradesService) {}

  @Post(':trade_id/cancel')
  cancel(@Param('trade_id') tradeId: string, @Body() dto: CancelTradeOrderDto) {
    return this.tradesService.cancel(tradeId, dto);
  }
}
```



`apps/tradable-points-service/src/modules/trades/trades.module.ts`



```TypeScript
import { Module } from '@nestjs/common';
import { TradesController } from './trades.controller';
import { TradesAdminController } from './trades.admin.controller';
import { TradesService } from './trades.service';
import { TradesRepository } from './trades.repository';

@Module({
  controllers: [TradesController, TradesAdminController],
  providers: [TradesService, TradesRepository],
  exports: [TradesService]
})
export class TradesModule {}
```



---



# 29\. tFJ369 App Module



`apps/tradable-points-service/src/app.module.ts`



```TypeScript
import { Module } from '@nestjs/common';
import { HealthModule } from './health/health.module';
import { ConversionsModule } from './modules/conversions/conversions.module';
import { LocksModule } from './modules/locks/locks.module';
import { TradesModule } from './modules/trades/trades.module';

@Module({
  imports: [
    HealthModule,
    ConversionsModule,
    LocksModule,
    TradesModule
  ]
})
export class AppModule {}
```



---



# 30\. tFJ369 Service 当前 API



## 用户端



```HTTP
POST /api/v1/tpoints/conversions/preview
POST /api/v1/tpoints/conversions
POST /api/v1/tpoints/locks
GET /api/v1/tpoints/locks/:lock_id
POST /api/v1/tpoints/trades/buy
POST /api/v1/tpoints/trades/sell
GET /api/v1/tpoints/market/orderbook
GET /api/v1/tpoints/market/trades/:trade_id
```



## 后台端



```HTTP
POST /api/v1/admin/tpoints/conversions/:conversion_id/approve
POST /api/v1/admin/tpoints/conversions/:conversion_id/reject
POST /api/v1/admin/tpoints/locks/:lock_id/unlock
POST /api/v1/admin/tpoints/trades/:trade_id/cancel
```



---



# 31\. tFJ369 服务已具备能力



这一版完成后，tFJ369 Service 支持：



```Plain Text
cFJ369 转换预览
会员等级转换比例
手续费计算
手续费分配
转换订单创建
转换审核通过
转换审核拒绝
tFJ369 锁定
tFJ369 解锁
tFJ369 买单
tFJ369 卖单
交易盘口查看
交易订单取消
转换和交易事件 outbox
```



---



# 32\. 还需要补强的工业级能力



下一步需要补：



```Plain Text
统一 AppException
PrismaModule 注入
真实调用 Asset Ledger Service
真实调用 Points Service 扣减 cFJ369
真实调用 Risk Service 检查转换 / 交易风险
真实调用 Approval Service
Admin 权限 Guard
Audit Log
幂等转换 / 交易
撮合引擎
成交回执
手续费分账
链上 tFJ369 合约联动
```



---



# 33\. 下一步继续



按 23 个 Service 顺序，下一步写：



```Plain Text
9. NFT Service NFT 权益服务
```



NFT Service 第一版会包含：



```Plain Text
NFT 集合
NFT 签发
NFT 铸造
NFT 查询
NFT 升级
NFT 冻结
NFT 撤销
NFT 归属记录
NFT 链上记录
NFTIssueRequested outbox 事件
NFTMinted outbox 事件
NFTUpgraded outbox 事件
```



需要补充数据库：



```Plain Text
nft_collections
nft_assets
nft_ownerships
nft_benefits
nft_upgrade_orders
nft_chain_records
```



