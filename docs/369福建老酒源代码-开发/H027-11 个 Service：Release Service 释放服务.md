# H027\-11 个 Service：Release Service 释放服务

# 第 11 个 Service：Release Service 释放服务



本服务负责：



```Plain Text
释放池管理
释放额度计算
释放明细查询
用户领取
领取记录
Merkle Root 预留
链上领取状态预留
释放风控冻结
ReleaseCalculated / ReleaseClaimed 事件预留
```



---



# 1\. Release Service 目录结构



```Plain Text
apps/release-service/
├── src/
│   ├── app.module.ts
│   ├── main.ts
│   ├── health/
│   ├── shared/
│   │   ├── release-errors.ts
│   │   ├── release-events.ts
│   │   └── release-status.ts
│   └── modules/
│       ├── pools/
│       │   ├── pools.module.ts
│       │   ├── pools.controller.ts
│       │   ├── pools.admin.controller.ts
│       │   ├── pools.repository.ts
│       │   ├── pools.service.ts
│       │   └── dto/
│       │       ├── create-pool.dto.ts
│       │       ├── approve-pool.dto.ts
│       │       ├── calculate-pool.dto.ts
│       │       └── open-claim.dto.ts
│       ├── calculations/
│       │   ├── calculations.module.ts
│       │   ├── calculations.controller.ts
│       │   ├── calculations.admin.controller.ts
│       │   ├── calculations.repository.ts
│       │   ├── calculations.service.ts
│       │   └── dto/
│       │       └── risk-hold-calculation.dto.ts
│       └── claims/
│           ├── claims.module.ts
│           ├── claims.controller.ts
│           ├── claims.repository.ts
│           ├── claims.service.ts
│           └── dto/
│               └── create-claim.dto.ts
```



---



# 2\. Prisma 补充表



## 2\.1 ReleasePool



```Plain Text
model ReleasePool {
  id              String    @id
  poolNo          String    @unique @map("pool_no")
  poolPeriod      String    @map("pool_period")
  poolType        String    @map("pool_type")
  totalAmount     Decimal   @map("total_amount") @db.Decimal(36, 18)
  tokenSymbol     String    @map("token_symbol")
  status          String    @default("created")
  snapshotId      String?   @map("snapshot_id")
  merkleRoot      String?   @map("merkle_root")
  claimStartTime  DateTime? @map("claim_start_time")
  claimEndTime    DateTime? @map("claim_end_time")
  createdBy       String?   @map("created_by")
  approvedBy      String?   @map("approved_by")
  approvedAt      DateTime? @map("approved_at")
  calculatedAt    DateTime? @map("calculated_at")
  createdAt       DateTime  @default(now()) @map("created_at")
  updatedAt       DateTime  @updatedAt @map("updated_at")
  metadata        Json?

  calculations    ReleaseCalculation[]
  claims          ReleaseClaim[]

  @@index([poolPeriod])
  @@index([status])
  @@map("release_pools")
}
```



## 2\.2 ReleaseCalculation



```Plain Text
model ReleaseCalculation {
  id                 String   @id
  calculationNo      String   @unique @map("calculation_no")
  poolId             String   @map("pool_id")
  userId             String   @map("user_id")
  userEffectivePower Decimal  @map("user_effective_power") @db.Decimal(36, 18)
  totalNetworkPower  Decimal  @map("total_network_power") @db.Decimal(36, 18)
  calculatedAmount   Decimal  @map("calculated_amount") @db.Decimal(36, 18)
  monthlyCap         Decimal  @default(0) @map("monthly_cap") @db.Decimal(36, 18)
  remainingQuota     Decimal  @default(0) @map("remaining_quota") @db.Decimal(36, 18)
  actualAmount       Decimal  @map("actual_amount") @db.Decimal(36, 18)
  calculationStatus  String   @default("claimable") @map("calculation_status")
  riskStatus         String   @default("normal") @map("risk_status")
  createdAt          DateTime @default(now()) @map("created_at")
  updatedAt          DateTime @updatedAt @map("updated_at")
  metadata           Json?

  pool               ReleasePool @relation(fields: [poolId], references: [id])

  @@unique([poolId, userId])
  @@index([userId])
  @@index([calculationStatus])
  @@map("release_calculations")
}
```



## 2\.3 ReleaseClaim



```Plain Text
model ReleaseClaim {
  id           String    @id
  claimNo      String    @unique @map("claim_no")
  poolId       String    @map("pool_id")
  calculationId String   @map("calculation_id")
  userId       String    @map("user_id")
  claimAmount  Decimal   @map("claim_amount") @db.Decimal(36, 18)
  tokenSymbol  String    @map("token_symbol")
  claimStatus  String    @default("processing") @map("claim_status")
  txHash       String?   @map("tx_hash")
  claimedAt    DateTime? @map("claimed_at")
  createdAt    DateTime  @default(now()) @map("created_at")
  updatedAt    DateTime  @updatedAt @map("updated_at")
  metadata     Json?

  pool         ReleasePool @relation(fields: [poolId], references: [id])

  @@unique([poolId, userId])
  @@index([userId])
  @@index([claimStatus])
  @@map("release_claims")
}
```



---



# 3\. Release Events



`apps/release-service/src/shared/release-events.ts`



```TypeScript
export const ReleaseEvents = {
  RELEASE_POOL_CREATED: 'release.pool_created.v1',
  RELEASE_POOL_APPROVED: 'release.pool_approved.v1',
  RELEASE_CALCULATED: 'release.calculated.v1',
  RELEASE_CLAIM_OPENED: 'release.claim_opened.v1',
  RELEASE_CLAIMED: 'release.claimed.v1',
  RELEASE_RISK_HELD: 'release.risk_held.v1'
} as const;
```



---



# 4\. Release Errors



`apps/release-service/src/shared/release-errors.ts`



```TypeScript
export const ReleaseErrors = {
  RELEASE_POOL_NOT_FOUND: 'RELEASE_POOL_NOT_FOUND',
  RELEASE_POOL_STATUS_INVALID: 'RELEASE_POOL_STATUS_INVALID',
  RELEASE_POOL_NOT_OPEN: 'RELEASE_POOL_NOT_OPEN',
  RELEASE_CALCULATION_NOT_FOUND: 'RELEASE_CALCULATION_NOT_FOUND',
  RELEASE_NOT_CLAIMABLE: 'RELEASE_NOT_CLAIMABLE',
  RELEASE_ALREADY_CLAIMED: 'RELEASE_ALREADY_CLAIMED',
  RELEASE_AMOUNT_INVALID: 'RELEASE_AMOUNT_INVALID'
} as const;
```



---



# 5\. Release Status



`apps/release-service/src/shared/release-status.ts`



```TypeScript
export const ReleasePoolStatus = {
  CREATED: 'created',
  APPROVED: 'approved',
  SNAPSHOT_READY: 'snapshot_ready',
  CALCULATED: 'calculated',
  CLAIM_OPEN: 'claim_open',
  CLOSED: 'closed',
  CANCELLED: 'cancelled'
} as const;

export const ReleaseCalculationStatus = {
  CLAIMABLE: 'claimable',
  CLAIMED: 'claimed',
  RISK_HOLD: 'risk_hold',
  CANCELLED: 'cancelled'
} as const;

export const ReleaseClaimStatus = {
  PROCESSING: 'processing',
  CLAIMED: 'claimed',
  FAILED: 'failed',
  CLAIMABLE_ONCHAIN: 'claimable_onchain'
} as const;
```



---



# 6\. DTO



`apps/release-service/src/modules/pools/dto/create-pool.dto.ts`



```TypeScript
import { IsOptional, IsString } from 'class-validator';

export class CreatePoolDto {
  @IsString()
  pool_period!: string;

  @IsString()
  pool_type!: string;

  @IsString()
  total_amount!: string;

  @IsString()
  token_symbol!: string;

  @IsString()
  reason!: string;

  @IsOptional()
  @IsString()
  created_by?: string;
}
```



`apps/release-service/src/modules/pools/dto/approve-pool.dto.ts`



```TypeScript
import { IsString } from 'class-validator';

export class ApprovePoolDto {
  @IsString()
  approval_id!: string;

  @IsString()
  reviewer_id!: string;

  @IsString()
  review_note!: string;
}
```



`apps/release-service/src/modules/pools/dto/calculate-pool.dto.ts`



```TypeScript
import { IsString } from 'class-validator';

export class CalculatePoolDto {
  @IsString()
  snapshot_id!: string;

  @IsString()
  reason!: string;
}
```



`apps/release-service/src/modules/pools/dto/open-claim.dto.ts`



```TypeScript
import { IsString } from 'class-validator';

export class OpenClaimDto {
  @IsString()
  approval_id!: string;

  @IsString()
  claim_start_time!: string;

  @IsString()
  claim_end_time!: string;
}
```



`apps/release-service/src/modules/claims/dto/create-claim.dto.ts`



```TypeScript
import { IsString } from 'class-validator';

export class CreateClaimDto {
  @IsString()
  pool_id!: string;

  @IsString()
  user_id!: string;
}
```



`apps/release-service/src/modules/calculations/dto/risk-hold-calculation.dto.ts`



```TypeScript
import { IsString } from 'class-validator';

export class RiskHoldCalculationDto {
  @IsString()
  reason!: string;
}
```



---



# 7\. Pools Repository



`apps/release-service/src/modules/pools/pools.repository.ts`



```TypeScript
import { Injectable } from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';
import { ulid } from 'ulid';

const prisma = new PrismaClient();

@Injectable()
export class PoolsRepository {
  create(data: {
    poolNo: string;
    poolPeriod: string;
    poolType: string;
    totalAmount: string;
    tokenSymbol: string;
    reason: string;
    createdBy?: string;
  }) {
    return prisma.$transaction(async (tx) => {
      const pool = await tx.releasePool.create({
        data: {
          id: ulid(),
          poolNo: data.poolNo,
          poolPeriod: data.poolPeriod,
          poolType: data.poolType,
          totalAmount: new Prisma.Decimal(data.totalAmount),
          tokenSymbol: data.tokenSymbol,
          status: 'created',
          createdBy: data.createdBy,
          metadata: { reason: data.reason }
        }
      });

      await tx.outboxEvent.create({
        data: {
          id: ulid(),
          eventType: 'release.pool_created.v1',
          payload: {
            pool_id: pool.id,
            pool_no: pool.poolNo,
            pool_period: pool.poolPeriod,
            total_amount: pool.totalAmount.toString(),
            token_symbol: pool.tokenSymbol
          },
          status: 'pending',
          retryCount: 0
        }
      });

      return pool;
    });
  }

  findById(poolId: string) {
    return prisma.releasePool.findUnique({
      where: { id: poolId },
      include: { calculations: true, claims: true }
    });
  }

  approve(poolId: string, reviewerId: string, reviewNote: string) {
    return prisma.$transaction(async (tx) => {
      const pool = await tx.releasePool.update({
        where: { id: poolId },
        data: {
          status: 'approved',
          approvedBy: reviewerId,
          approvedAt: new Date(),
          metadata: { review_note: reviewNote }
        }
      });

      await tx.outboxEvent.create({
        data: {
          id: ulid(),
          eventType: 'release.pool_approved.v1',
          payload: {
            pool_id: pool.id,
            pool_no: pool.poolNo,
            reviewer_id: reviewerId
          },
          status: 'pending',
          retryCount: 0
        }
      });

      return pool;
    });
  }

  updateForCalculation(poolId: string, snapshotId: string) {
    return prisma.releasePool.update({
      where: { id: poolId },
      data: {
        status: 'calculated',
        snapshotId,
        calculatedAt: new Date()
      }
    });
  }

  openClaim(poolId: string, startTime: Date, endTime: Date) {
    return prisma.$transaction(async (tx) => {
      const pool = await tx.releasePool.update({
        where: { id: poolId },
        data: {
          status: 'claim_open',
          claimStartTime: startTime,
          claimEndTime: endTime
        }
      });

      await tx.outboxEvent.create({
        data: {
          id: ulid(),
          eventType: 'release.claim_opened.v1',
          payload: {
            pool_id: pool.id,
            pool_no: pool.poolNo,
            claim_start_time: pool.claimStartTime,
            claim_end_time: pool.claimEndTime
          },
          status: 'pending',
          retryCount: 0
        }
      });

      return pool;
    });
  }
}
```



---



# 8\. Pools Service



`apps/release-service/src/modules/pools/pools.service.ts`



```TypeScript
import { Injectable } from '@nestjs/common';
import Decimal from 'decimal.js';
import { ulid } from 'ulid';
import { PoolsRepository } from './pools.repository';
import { CreatePoolDto } from './dto/create-pool.dto';
import { ApprovePoolDto } from './dto/approve-pool.dto';
import { CalculatePoolDto } from './dto/calculate-pool.dto';
import { OpenClaimDto } from './dto/open-claim.dto';
import { ReleaseErrors } from '../../shared/release-errors';
import { ReleasePoolStatus } from '../../shared/release-status';

@Injectable()
export class PoolsService {
  constructor(private readonly poolsRepository: PoolsRepository) {}

  async create(dto: CreatePoolDto) {
    if (new Decimal(dto.total_amount).lte(0)) {
      throw new Error(ReleaseErrors.RELEASE_AMOUNT_INVALID);
    }

    const pool = await this.poolsRepository.create({
      poolNo: this.generatePoolNo(),
      poolPeriod: dto.pool_period,
      poolType: dto.pool_type,
      totalAmount: new Decimal(dto.total_amount).toFixed(18),
      tokenSymbol: dto.token_symbol,
      reason: dto.reason,
      createdBy: dto.created_by
    });

    return {
      pool_id: pool.id,
      pool_no: pool.poolNo,
      pool_period: pool.poolPeriod,
      total_amount: pool.totalAmount.toString(),
      token_symbol: pool.tokenSymbol,
      status: pool.status
    };
  }

  async detail(poolId: string) {
    const pool = await this.poolsRepository.findById(poolId);
    if (!pool) {
      throw new Error(ReleaseErrors.RELEASE_POOL_NOT_FOUND);
    }

    return {
      pool_id: pool.id,
      pool_no: pool.poolNo,
      pool_period: pool.poolPeriod,
      pool_type: pool.poolType,
      total_amount: pool.totalAmount.toString(),
      token_symbol: pool.tokenSymbol,
      status: pool.status,
      snapshot_id: pool.snapshotId,
      claim_start_time: pool.claimStartTime,
      claim_end_time: pool.claimEndTime
    };
  }

  async approve(poolId: string, dto: ApprovePoolDto) {
    const pool = await this.poolsRepository.findById(poolId);
    if (!pool) throw new Error(ReleaseErrors.RELEASE_POOL_NOT_FOUND);
    if (pool.status !== ReleasePoolStatus.CREATED) {
      throw new Error(ReleaseErrors.RELEASE_POOL_STATUS_INVALID);
    }

    const updated = await this.poolsRepository.approve(
      poolId,
      dto.reviewer_id,
      dto.review_note
    );

    return {
      pool_id: updated.id,
      pool_no: updated.poolNo,
      status: updated.status,
      approval_id: dto.approval_id
    };
  }

  async calculate(poolId: string, dto: CalculatePoolDto) {
    const pool = await this.poolsRepository.findById(poolId);
    if (!pool) throw new Error(ReleaseErrors.RELEASE_POOL_NOT_FOUND);
    if (pool.status !== ReleasePoolStatus.APPROVED) {
      throw new Error(ReleaseErrors.RELEASE_POOL_STATUS_INVALID);
    }

    const updated = await this.poolsRepository.updateForCalculation(
      poolId,
      dto.snapshot_id
    );

    return {
      pool_id: updated.id,
      pool_no: updated.poolNo,
      status: updated.status,
      snapshot_id: updated.snapshotId
    };
  }

  async openClaim(poolId: string, dto: OpenClaimDto) {
    const pool = await this.poolsRepository.findById(poolId);
    if (!pool) throw new Error(ReleaseErrors.RELEASE_POOL_NOT_FOUND);
    if (pool.status !== ReleasePoolStatus.CALCULATED) {
      throw new Error(ReleaseErrors.RELEASE_POOL_STATUS_INVALID);
    }

    const updated = await this.poolsRepository.openClaim(
      poolId,
      new Date(dto.claim_start_time),
      new Date(dto.claim_end_time)
    );

    return {
      pool_id: updated.id,
      pool_no: updated.poolNo,
      status: updated.status,
      claim_start_time: updated.claimStartTime,
      claim_end_time: updated.claimEndTime,
      approval_id: dto.approval_id
    };
  }

  private generatePoolNo() {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    return `RLP${date}${ulid()}`;
  }
}
```



---



# 9\. Pools Controllers / Module



`apps/release-service/src/modules/pools/pools.controller.ts`



```TypeScript
import { Controller, Get, Param } from '@nestjs/common';
import { PoolsService } from './pools.service';

@Controller('releases/pools')
export class PoolsController {
  constructor(private readonly poolsService: PoolsService) {}

  @Get(':pool_id')
  detail(@Param('pool_id') poolId: string) {
    return this.poolsService.detail(poolId);
  }
}
```



`apps/release-service/src/modules/pools/pools.admin.controller.ts`



```TypeScript
import { Body, Controller, Param, Post } from '@nestjs/common';
import { PoolsService } from './pools.service';
import { CreatePoolDto } from './dto/create-pool.dto';
import { ApprovePoolDto } from './dto/approve-pool.dto';
import { CalculatePoolDto } from './dto/calculate-pool.dto';
import { OpenClaimDto } from './dto/open-claim.dto';

@Controller('admin/releases/pools')
export class PoolsAdminController {
  constructor(private readonly poolsService: PoolsService) {}

  @Post()
  create(@Body() dto: CreatePoolDto) {
    return this.poolsService.create(dto);
  }

  @Post(':pool_id/approve')
  approve(@Param('pool_id') poolId: string, @Body() dto: ApprovePoolDto) {
    return this.poolsService.approve(poolId, dto);
  }

  @Post(':pool_id/calculate')
  calculate(@Param('pool_id') poolId: string, @Body() dto: CalculatePoolDto) {
    return this.poolsService.calculate(poolId, dto);
  }

  @Post(':pool_id/open-claim')
  openClaim(@Param('pool_id') poolId: string, @Body() dto: OpenClaimDto) {
    return this.poolsService.openClaim(poolId, dto);
  }
}
```



`apps/release-service/src/modules/pools/pools.module.ts`



```TypeScript
import { Module } from '@nestjs/common';
import { PoolsController } from './pools.controller';
import { PoolsAdminController } from './pools.admin.controller';
import { PoolsService } from './pools.service';
import { PoolsRepository } from './pools.repository';

@Module({
  controllers: [PoolsController, PoolsAdminController],
  providers: [PoolsService, PoolsRepository],
  exports: [PoolsService]
})
export class PoolsModule {}
```



---



# 10\. Calculations Repository / Service



`apps/release-service/src/modules/calculations/calculations.repository.ts`



```TypeScript
import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

@Injectable()
export class CalculationsRepository {
  findById(calculationId: string) {
    return prisma.releaseCalculation.findUnique({
      where: { id: calculationId }
    });
  }

  findByPoolAndUser(poolId: string, userId: string) {
    return prisma.releaseCalculation.findUnique({
      where: {
        poolId_userId: { poolId, userId }
      }
    });
  }

  list(poolId: string) {
    return prisma.releaseCalculation.findMany({
      where: { poolId },
      orderBy: { createdAt: 'desc' }
    });
  }

  riskHold(calculationId: string, reason: string) {
    return prisma.releaseCalculation.update({
      where: { id: calculationId },
      data: {
        calculationStatus: 'risk_hold',
        riskStatus: 'risk_hold',
        metadata: { reason }
      }
    });
  }
}
```



`apps/release-service/src/modules/calculations/calculations.service.ts`



```TypeScript
import { Injectable } from '@nestjs/common';
import { CalculationsRepository } from './calculations.repository';
import { RiskHoldCalculationDto } from './dto/risk-hold-calculation.dto';
import { ReleaseErrors } from '../../shared/release-errors';

@Injectable()
export class CalculationsService {
  constructor(private readonly calculationsRepository: CalculationsRepository) {}

  async list(poolId: string) {
    const items = await this.calculationsRepository.list(poolId);

    return {
      items: items.map((item) => ({
        calculation_id: item.id,
        calculation_no: item.calculationNo,
        pool_id: item.poolId,
        user_id: item.userId,
        user_effective_power: item.userEffectivePower.toString(),
        total_network_power: item.totalNetworkPower.toString(),
        calculated_amount: item.calculatedAmount.toString(),
        actual_amount: item.actualAmount.toString(),
        calculation_status: item.calculationStatus,
        risk_status: item.riskStatus
      }))
    };
  }

  async riskHold(calculationId: string, dto: RiskHoldCalculationDto) {
    const existing = await this.calculationsRepository.findById(calculationId);
    if (!existing) {
      throw new Error(ReleaseErrors.RELEASE_CALCULATION_NOT_FOUND);
    }

    const updated = await this.calculationsRepository.riskHold(
      calculationId,
      dto.reason
    );

    return {
      calculation_id: updated.id,
      calculation_status: updated.calculationStatus,
      risk_status: updated.riskStatus
    };
  }
}
```



`apps/release-service/src/modules/calculations/calculations.controller.ts`



```TypeScript
import { Controller, Get, Param } from '@nestjs/common';
import { CalculationsService } from './calculations.service';

@Controller('releases/pools')
export class CalculationsController {
  constructor(private readonly calculationsService: CalculationsService) {}

  @Get(':pool_id/calculations')
  list(@Param('pool_id') poolId: string) {
    return this.calculationsService.list(poolId);
  }
}
```



`apps/release-service/src/modules/calculations/calculations.admin.controller.ts`



```TypeScript
import { Body, Controller, Param, Post } from '@nestjs/common';
import { CalculationsService } from './calculations.service';
import { RiskHoldCalculationDto } from './dto/risk-hold-calculation.dto';

@Controller('admin/releases/calculations')
export class CalculationsAdminController {
  constructor(private readonly calculationsService: CalculationsService) {}

  @Post(':calculation_id/risk-hold')
  riskHold(
    @Param('calculation_id') calculationId: string,
    @Body() dto: RiskHoldCalculationDto
  ) {
    return this.calculationsService.riskHold(calculationId, dto);
  }
}
```



`apps/release-service/src/modules/calculations/calculations.module.ts`



```TypeScript
import { Module } from '@nestjs/common';
import { CalculationsController } from './calculations.controller';
import { CalculationsAdminController } from './calculations.admin.controller';
import { CalculationsService } from './calculations.service';
import { CalculationsRepository } from './calculations.repository';

@Module({
  controllers: [CalculationsController, CalculationsAdminController],
  providers: [CalculationsService, CalculationsRepository],
  exports: [CalculationsService]
})
export class CalculationsModule {}
```



---



# 11\. Claims Repository / Service



`apps/release-service/src/modules/claims/claims.repository.ts`



```TypeScript
import { Injectable } from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';
import { ulid } from 'ulid';

const prisma = new PrismaClient();

@Injectable()
export class ClaimsRepository {
  findPool(poolId: string) {
    return prisma.releasePool.findUnique({
      where: { id: poolId }
    });
  }

  findCalculation(poolId: string, userId: string) {
    return prisma.releaseCalculation.findUnique({
      where: {
        poolId_userId: { poolId, userId }
      }
    });
  }

  findClaim(poolId: string, userId: string) {
    return prisma.releaseClaim.findUnique({
      where: {
        poolId_userId: { poolId, userId }
      }
    });
  }

  createClaim(data: {
    claimNo: string;
    poolId: string;
    calculationId: string;
    userId: string;
    claimAmount: string;
    tokenSymbol: string;
  }) {
    return prisma.$transaction(async (tx) => {
      const claim = await tx.releaseClaim.create({
        data: {
          id: ulid(),
          claimNo: data.claimNo,
          poolId: data.poolId,
          calculationId: data.calculationId,
          userId: data.userId,
          claimAmount: new Prisma.Decimal(data.claimAmount),
          tokenSymbol: data.tokenSymbol,
          claimStatus: 'claimed',
          claimedAt: new Date()
        }
      });

      await tx.releaseCalculation.update({
        where: { id: data.calculationId },
        data: { calculationStatus: 'claimed' }
      });

      await tx.outboxEvent.create({
        data: {
          id: ulid(),
          eventType: 'release.claimed.v1',
          payload: {
            claim_id: claim.id,
            claim_no: claim.claimNo,
            pool_id: claim.poolId,
            user_id: claim.userId,
            claim_amount: claim.claimAmount.toString(),
            token_symbol: claim.tokenSymbol
          },
          status: 'pending',
          retryCount: 0
        }
      });

      return claim;
    });
  }
}
```



`apps/release-service/src/modules/claims/claims.service.ts`



```TypeScript
import { Injectable } from '@nestjs/common';
import { ulid } from 'ulid';
import { ClaimsRepository } from './claims.repository';
import { CreateClaimDto } from './dto/create-claim.dto';
import { ReleaseErrors } from '../../shared/release-errors';
import {
  ReleaseCalculationStatus,
  ReleasePoolStatus
} from '../../shared/release-status';

@Injectable()
export class ClaimsService {
  constructor(private readonly claimsRepository: ClaimsRepository) {}

  async claim(dto: CreateClaimDto) {
    const pool = await this.claimsRepository.findPool(dto.pool_id);
    if (!pool) throw new Error(ReleaseErrors.RELEASE_POOL_NOT_FOUND);
    if (pool.status !== ReleasePoolStatus.CLAIM_OPEN) {
      throw new Error(ReleaseErrors.RELEASE_POOL_NOT_OPEN);
    }

    const existingClaim = await this.claimsRepository.findClaim(
      dto.pool_id,
      dto.user_id
    );
    if (existingClaim) throw new Error(ReleaseErrors.RELEASE_ALREADY_CLAIMED);

    const calculation = await this.claimsRepository.findCalculation(
      dto.pool_id,
      dto.user_id
    );
    if (!calculation) {
      throw new Error(ReleaseErrors.RELEASE_CALCULATION_NOT_FOUND);
    }

    if (calculation.calculationStatus !== ReleaseCalculationStatus.CLAIMABLE) {
      throw new Error(ReleaseErrors.RELEASE_NOT_CLAIMABLE);
    }

    const claim = await this.claimsRepository.createClaim({
      claimNo: this.generateClaimNo(),
      poolId: dto.pool_id,
      calculationId: calculation.id,
      userId: dto.user_id,
      claimAmount: calculation.actualAmount.toString(),
      tokenSymbol: pool.tokenSymbol
    });

    return {
      claim_id: claim.id,
      claim_no: claim.claimNo,
      pool_id: claim.poolId,
      user_id: claim.userId,
      claim_amount: claim.claimAmount.toString(),
      token_symbol: claim.tokenSymbol,
      claim_status: claim.claimStatus,
      claimed_at: claim.claimedAt
    };
  }

  private generateClaimNo() {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    return `CLM${date}${ulid()}`;
  }
}
```



`apps/release-service/src/modules/claims/claims.controller.ts`



```TypeScript
import { Body, Controller, Post } from '@nestjs/common';
import { ClaimsService } from './claims.service';
import { CreateClaimDto } from './dto/create-claim.dto';

@Controller('releases/claims')
export class ClaimsController {
  constructor(private readonly claimsService: ClaimsService) {}

  @Post()
  claim(@Body() dto: CreateClaimDto) {
    return this.claimsService.claim(dto);
  }
}
```



`apps/release-service/src/modules/claims/claims.module.ts`



```TypeScript
import { Module } from '@nestjs/common';
import { ClaimsController } from './claims.controller';
import { ClaimsService } from './claims.service';
import { ClaimsRepository } from './claims.repository';

@Module({
  controllers: [ClaimsController],
  providers: [ClaimsService, ClaimsRepository],
  exports: [ClaimsService]
})
export class ClaimsModule {}
```



---



# 12\. Release App Module



`apps/release-service/src/app.module.ts`



```TypeScript
import { Module } from '@nestjs/common';
import { HealthModule } from './health/health.module';
import { PoolsModule } from './modules/pools/pools.module';
import { CalculationsModule } from './modules/calculations/calculations.module';
import { ClaimsModule } from './modules/claims/claims.module';

@Module({
  imports: [
    HealthModule,
    PoolsModule,
    CalculationsModule,
    ClaimsModule
  ]
})
export class AppModule {}
```



---



# 13\. Release Service 当前 API



## 用户端



```HTTP
GET /api/v1/releases/pools/:pool_id
GET /api/v1/releases/pools/:pool_id/calculations
POST /api/v1/releases/claims
```



## 后台端



```HTTP
POST /api/v1/admin/releases/pools
POST /api/v1/admin/releases/pools/:pool_id/approve
POST /api/v1/admin/releases/pools/:pool_id/calculate
POST /api/v1/admin/releases/pools/:pool_id/open-claim
POST /api/v1/admin/releases/calculations/:calculation_id/risk-hold
```



---



# 14\. Release Service 已具备能力



这一版完成后，Release Service 支持：



```Plain Text
释放池创建
释放池审批
释放池计算状态更新
开放领取
释放明细查询
释放明细风控冻结
用户领取释放
防重复领取
领取后更新计算状态
Release outbox 事件
```



---



# 15\. 后续必须补强



```Plain Text
真实算力快照读取
批量生成 release_calculations
Merkle Root 生成
链上领取模式
释放额度上限规则
地区合规检查
KYC 检查
Risk Service 接入
Approval Service 接入
Audit Log
Admin 权限 Guard
```



---



# 16\. 下一步继续



按 23 个 Service 顺序，下一步写：



```Plain Text
12. Referral Service 推荐奖励服务
```



下一步会覆盖：



```Plain Text
推荐人 10% 奖励
推荐关系校验
奖励锁定
奖励审核
奖励结算
奖励追回
ReferralRewardCreated / Approved / Recovered 事件
```



