# H028\-12 个 Service：推荐奖励服务

下面继续第 12 个 Service：Referral Service。



# 第 12 个 Service：推荐奖励服务



本服务负责：



```Plain Text
推荐关系校验
推荐奖励生成
推荐奖励锁定
推荐奖励审核
推荐奖励结算
推荐奖励追回
推荐奖励状态机
ReferralRewardCreated / Approved / Payable / Recovered 事件预留
```



---



# 1\. Referral Service 目录结构



```Plain Text
apps/referral-service/
├── src/
│   ├── app.module.ts
│   ├── main.ts
│   ├── health/
│   │   ├── health.controller.ts
│   │   └── health.module.ts
│   ├── shared/
│   │   ├── referral-errors.ts
│   │   ├── referral-events.ts
│   │   └── referral-status.ts
│   └── modules/
│       ├── bindings/
│       │   ├── bindings.module.ts
│       │   ├── bindings.controller.ts
│       │   ├── bindings.repository.ts
│       │   ├── bindings.service.ts
│       │   └── dto/
│       │       └── query-referral-binding.dto.ts
│       └── rewards/
│           ├── rewards.module.ts
│           ├── rewards.controller.ts
│           ├── rewards.admin.controller.ts
│           ├── rewards.repository.ts
│           ├── rewards.service.ts
│           └── dto/
│               ├── create-referral-reward.dto.ts
│               ├── approve-referral-reward.dto.ts
│               ├── recover-referral-reward.dto.ts
│               └── query-referral-rewards.dto.ts
```



---



# 2\. Prisma 补充表



## 2\.1 ReferralReward



```Plain Text
model ReferralReward {
  id             String    @id
  rewardNo       String    @unique @map("reward_no")
  orderId        String    @map("order_id")
  buyerId        String    @map("buyer_id")
  referrerId     String    @map("referrer_id")
  referrerCode   String?   @map("referrer_code")
  rewardRate     Decimal   @map("reward_rate") @db.Decimal(36, 18)
  orderAmount    Decimal   @map("order_amount") @db.Decimal(36, 18)
  rewardAmount   Decimal   @map("reward_amount") @db.Decimal(36, 18)
  taxAmount      Decimal   @default(0) @map("tax_amount") @db.Decimal(36, 18)
  netAmount      Decimal   @map("net_amount") @db.Decimal(36, 18)
  currency       String
  status         String    @default("created")
  riskStatus     String    @default("normal") @map("risk_status")
  lockUntil      DateTime? @map("lock_until")
  reviewedBy     String?   @map("reviewed_by")
  reviewNote     String?   @map("review_note")
  approvedAt     DateTime? @map("approved_at")
  payableAt      DateTime? @map("payable_at")
  paidAt         DateTime? @map("paid_at")
  recoveredAt    DateTime? @map("recovered_at")
  createdAt      DateTime  @default(now()) @map("created_at")
  updatedAt      DateTime  @updatedAt @map("updated_at")
  metadata       Json?

  @@index([orderId])
  @@index([buyerId])
  @@index([referrerId])
  @@index([status])
  @@map("referral_rewards")
}
```



## 2\.2 ReferralBindingSnapshot



```Plain Text
model ReferralBindingSnapshot {
  id           String   @id
  userId       String   @map("user_id")
  referrerId   String   @map("referrer_id")
  referrerCode String?  @map("referrer_code")
  bindSource   String   @map("bind_source")
  bindIp       String?  @map("bind_ip")
  bindDeviceId String?  @map("bind_device_id")
  isValid      Boolean  @default(true) @map("is_valid")
  riskStatus   String   @default("normal") @map("risk_status")
  createdAt    DateTime @default(now()) @map("created_at")
  metadata     Json?

  @@index([userId])
  @@index([referrerId])
  @@map("referral_binding_snapshots")
}
```



---



# 3\. Referral Events



`apps/referral-service/src/shared/referral-events.ts`



```TypeScript
export const ReferralEvents = {
  REFERRAL_BINDING_SNAPSHOT_CREATED: 'referral.binding_snapshot_created.v1',
  REFERRAL_REWARD_CREATED: 'referral.reward_created.v1',
  REFERRAL_REWARD_LOCKED: 'referral.reward_locked.v1',
  REFERRAL_REWARD_APPROVED: 'referral.reward_approved.v1',
  REFERRAL_REWARD_PAYABLE: 'referral.reward_payable.v1',
  REFERRAL_REWARD_PAID: 'referral.reward_paid.v1',
  REFERRAL_REWARD_RECOVERED: 'referral.reward_recovered.v1'
} as const;
```



---



# 4\. Referral Errors



`apps/referral-service/src/shared/referral-errors.ts`



```TypeScript
export const ReferralErrors = {
  BINDING_NOT_FOUND: 'REFERRAL_BINDING_NOT_FOUND',
  BINDING_INVALID: 'REFERRAL_BINDING_INVALID',
  BINDING_SELF_NOT_ALLOWED: 'REFERRAL_BINDING_SELF_NOT_ALLOWED',
  REWARD_ALREADY_EXISTS: 'REFERRAL_REWARD_ALREADY_EXISTS',
  REWARD_NOT_FOUND: 'REFERRAL_REWARD_NOT_FOUND',
  REWARD_STATUS_INVALID: 'REFERRAL_REWARD_STATUS_INVALID',
  REWARD_AMOUNT_INVALID: 'REFERRAL_REWARD_AMOUNT_INVALID',
  REWARD_NOT_PAYABLE: 'REFERRAL_REWARD_NOT_PAYABLE',
  REWARD_NOT_RECOVERABLE: 'REFERRAL_REWARD_NOT_RECOVERABLE'
} as const;
```



---



# 5\. Referral Status



`apps/referral-service/src/shared/referral-status.ts`



```TypeScript
export const ReferralRewardStatus = {
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

export const ReferralRewardTransitions: Record = {
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

export function canTransitReferralRewardStatus(from: string, to: string): boolean {
  return ReferralRewardTransitions[from]?.includes(to) ?? false;
}
```



---



# 6\. DTO：QueryReferralBindingDto



`apps/referral-service/src/modules/bindings/dto/query-referral-binding.dto.ts`



```TypeScript
import { IsOptional, IsString } from 'class-validator';

export class QueryReferralBindingDto {
  @IsOptional()
  @IsString()
  user_id?: string;

  @IsOptional()
  @IsString()
  referrer_id?: string;
}
```



---



# 7\. DTO：CreateReferralRewardDto



`apps/referral-service/src/modules/rewards/dto/create-referral-reward.dto.ts`



```TypeScript
import { IsString } from 'class-validator';

export class CreateReferralRewardDto {
  @IsString()
  order_id!: string;

  @IsString()
  buyer_id!: string;

  @IsString()
  referrer_id!: string;

  @IsString()
  reward_rate!: string;

  @IsString()
  order_amount!: string;

  @IsString()
  currency!: string;

  @IsString()
  lock_until!: string;
}
```



---



# 8\. DTO：ApproveReferralRewardDto



`apps/referral-service/src/modules/rewards/dto/approve-referral-reward.dto.ts`



```TypeScript
import { IsOptional, IsString } from 'class-validator';

export class ApproveReferralRewardDto {
  @IsString()
  reviewer_id!: string;

  @IsOptional()
  @IsString()
  review_note?: string;
}
```



---



# 9\. DTO：RecoverReferralRewardDto



`apps/referral-service/src/modules/rewards/dto/recover-referral-reward.dto.ts`



```TypeScript
import { IsString } from 'class-validator';

export class RecoverReferralRewardDto {
  @IsString()
  reason!: string;

  @IsString()
  approval_id!: string;
}
```



---



# 10\. DTO：QueryReferralRewardsDto



`apps/referral-service/src/modules/rewards/dto/query-referral-rewards.dto.ts`



```TypeScript
import { IsOptional, IsString } from 'class-validator';

export class QueryReferralRewardsDto {
  @IsOptional()
  @IsString()
  reward_no?: string;

  @IsOptional()
  @IsString()
  order_id?: string;

  @IsOptional()
  @IsString()
  buyer_id?: string;

  @IsOptional()
  @IsString()
  referrer_id?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  risk_status?: string;

  @IsOptional()
  page?: number;

  @IsOptional()
  page_size?: number;
}
```



---



# 11\. Bindings Repository



`apps/referral-service/src/modules/bindings/bindings.repository.ts`



```TypeScript
import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { ulid } from 'ulid';

const prisma = new PrismaClient();

@Injectable()
export class BindingsRepository {
  findByUserId(userId: string) {
    return prisma.userReferralBinding.findUnique({
      where: { userId }
    });
  }

  findByReferrerId(referrerId: string) {
    return prisma.userReferralBinding.findMany({
      where: { referrerId }
    });
  }

  createSnapshot(data: {
    userId: string;
    referrerId: string;
    referrerCode?: string;
    bindSource: string;
    bindIp?: string;
    bindDeviceId?: string;
    isValid: boolean;
    riskStatus: string;
  }) {
    return prisma.referralBindingSnapshot.create({
      data: {
        id: ulid(),
        userId: data.userId,
        referrerId: data.referrerId,
        referrerCode: data.referrerCode,
        bindSource: data.bindSource,
        bindIp: data.bindIp,
        bindDeviceId: data.bindDeviceId,
        isValid: data.isValid,
        riskStatus: data.riskStatus
      }
    });
  }
}
```



---



# 12\. Bindings Service



`apps/referral-service/src/modules/bindings/bindings.service.ts`



```TypeScript
import { Injectable } from '@nestjs/common';
import { BindingsRepository } from './bindings.repository';
import { QueryReferralBindingDto } from './dto/query-referral-binding.dto';
import { ReferralErrors } from '../../shared/referral-errors';

@Injectable()
export class BindingsService {
  constructor(private readonly bindingsRepository: BindingsRepository) {}

  async getBinding(query: QueryReferralBindingDto) {
    if (!query.user_id && !query.referrer_id) {
      return { items: [] };
    }

    if (query.user_id) {
      const binding = await this.bindingsRepository.findByUserId(query.user_id);
      return {
        items: binding
          ? [
              {
                user_id: binding.userId,
                referrer_id: binding.referrerId,
                bind_source: binding.bindSource,
                bind_ip: binding.bindIp,
                bind_device_id: binding.bindDeviceId,
                is_valid: binding.isValid,
                risk_status: binding.riskStatus,
                bound_at: binding.boundAt
              }
            ]
          : []
      };
    }

    if (query.referrer_id) {
      const items = await this.bindingsRepository.findByReferrerId(query.referrer_id);
      return {
        items: items.map((binding) => ({
          user_id: binding.userId,
          referrer_id: binding.referrerId,
          bind_source: binding.bindSource,
          is_valid: binding.isValid,
          risk_status: binding.riskStatus,
          bound_at: binding.boundAt
        }))
      };
    }

    throw new Error(ReferralErrors.BINDING_NOT_FOUND);
  }

  async createSnapshot(binding: {
    userId: string;
    referrerId: string;
    referrerCode?: string;
    bindSource: string;
    bindIp?: string;
    bindDeviceId?: string;
    isValid: boolean;
    riskStatus: string;
  }) {
    return this.bindingsRepository.createSnapshot(binding);
  }
}
```



---



# 13\. Bindings Controller



`apps/referral-service/src/modules/bindings/bindings.controller.ts`



```TypeScript
import { Controller, Get, Query } from '@nestjs/common';
import { BindingsService } from './bindings.service';
import { QueryReferralBindingDto } from './dto/query-referral-binding.dto';

@Controller('referrals/bindings')
export class BindingsController {
  constructor(private readonly bindingsService: BindingsService) {}

  @Get()
  getBinding(@Query() query: QueryReferralBindingDto) {
    return this.bindingsService.getBinding(query);
  }
}
```



---



# 14\. Bindings Module



`apps/referral-service/src/modules/bindings/bindings.module.ts`



```TypeScript
import { Module } from '@nestjs/common';
import { BindingsController } from './bindings.controller';
import { BindingsService } from './bindings.service';
import { BindingsRepository } from './bindings.repository';

@Module({
  controllers: [BindingsController],
  providers: [BindingsService, BindingsRepository],
  exports: [BindingsService]
})
export class BindingsModule {}
```



---



# 15\. Rewards Repository



`apps/referral-service/src/modules/rewards/rewards.repository.ts`



```TypeScript
import { Injectable } from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';
import { ulid } from 'ulid';

const prisma = new PrismaClient();

@Injectable()
export class RewardsRepository {
  findById(rewardId: string) {
    return prisma.referralReward.findUnique({
      where: { id: rewardId }
    });
  }

  findByOrderId(orderId: string) {
    return prisma.referralReward.findFirst({
      where: { orderId }
    });
  }

  findMany(params: {
    rewardNo?: string;
    orderId?: string;
    buyerId?: string;
    referrerId?: string;
    status?: string;
    riskStatus?: string;
    page: number;
    pageSize: number;
  }) {
    return prisma.referralReward.findMany({
      where: {
        rewardNo: params.rewardNo,
        orderId: params.orderId,
        buyerId: params.buyerId,
        referrerId: params.referrerId,
        status: params.status,
        riskStatus: params.riskStatus
      },
      orderBy: { createdAt: 'desc' },
      skip: (params.page - 1) * params.pageSize,
      take: params.pageSize
    });
  }

  count(params: {
    rewardNo?: string;
    orderId?: string;
    buyerId?: string;
    referrerId?: string;
    status?: string;
    riskStatus?: string;
  }) {
    return prisma.referralReward.count({
      where: {
        rewardNo: params.rewardNo,
        orderId: params.orderId,
        buyerId: params.buyerId,
        referrerId: params.referrerId,
        status: params.status,
        riskStatus: params.riskStatus
      }
    });
  }

  create(data: {
    rewardNo: string;
    orderId: string;
    buyerId: string;
    referrerId: string;
    referrerCode?: string;
    rewardRate: string;
    orderAmount: string;
    rewardAmount: string;
    taxAmount: string;
    netAmount: string;
    currency: string;
    lockUntil: Date;
  }) {
    return prisma.$transaction(async (tx) => {
      const reward = await tx.referralReward.create({
        data: {
          id: ulid(),
          rewardNo: data.rewardNo,
          orderId: data.orderId,
          buyerId: data.buyerId,
          referrerId: data.referrerId,
          referrerCode: data.referrerCode,
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
          eventType: 'referral.reward_created.v1',
          payload: {
            reward_id: reward.id,
            reward_no: reward.rewardNo,
            order_id: reward.orderId,
            buyer_id: reward.buyerId,
            referrer_id: reward.referrerId,
            reward_rate: reward.rewardRate.toString(),
            reward_amount: reward.rewardAmount.toString(),
            currency: reward.currency,
            lock_until: reward.lockUntil
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
      const updated = await tx.referralReward.update({
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
              buyer_id: updated.buyerId,
              referrer_id: updated.referrerId,
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



---



# 16\. Rewards Service



`apps/referral-service/src/modules/rewards/rewards.service.ts`



```TypeScript
import { Injectable } from '@nestjs/common';
import Decimal from 'decimal.js';
import { ulid } from 'ulid';
import { RewardsRepository } from './rewards.repository';
import { CreateReferralRewardDto } from './dto/create-referral-reward.dto';
import { ApproveReferralRewardDto } from './dto/approve-referral-reward.dto';
import { RecoverReferralRewardDto } from './dto/recover-referral-reward.dto';
import { QueryReferralRewardsDto } from './dto/query-referral-rewards.dto';
import { ReferralErrors } from '../../shared/referral-errors';
import { ReferralRewardStatus, canTransitReferralRewardStatus } from '../../shared/referral-status';

@Injectable()
export class RewardsService {
  constructor(private readonly rewardsRepository: RewardsRepository) {}

  async create(dto: CreateReferralRewardDto) {
    if (new Decimal(dto.reward_rate).lte(0) || new Decimal(dto.order_amount).lte(0)) {
      throw new Error(ReferralErrors.REWARD_AMOUNT_INVALID);
    }

    const existing = await this.rewardsRepository.findByOrderId(dto.order_id);
    if (existing) {
      throw new Error(ReferralErrors.REWARD_ALREADY_EXISTS);
    }

    const rewardAmount = new Decimal(dto.order_amount).mul(dto.reward_rate);
    const taxAmount = rewardAmount.mul('0.10');
    const netAmount = rewardAmount.sub(taxAmount);

    const reward = await this.rewardsRepository.create({
      rewardNo: this.generateRewardNo(),
      orderId: dto.order_id,
      buyerId: dto.buyer_id,
      referrerId: dto.referrer_id,
      rewardRate: new Decimal(dto.reward_rate).toFixed(18),
      orderAmount: new Decimal(dto.order_amount).toFixed(18),
      rewardAmount: rewardAmount.toFixed(18),
      taxAmount: taxAmount.toFixed(18),
      netAmount: netAmount.toFixed(18),
      currency: dto.currency,
      lockUntil: new Date(dto.lock_until)
    });

    return this.formatReward(reward);
  }

  async detail(rewardId: string) {
    const reward = await this.rewardsRepository.findById(rewardId);
    if (!reward) {
      throw new Error(ReferralErrors.REWARD_NOT_FOUND);
    }

    return this.formatReward(reward);
  }

  async list(query: QueryReferralRewardsDto) {
    const page = Number(query.page || 1);
    const pageSize = Math.min(Number(query.page_size || 20), 100);

    const [items, total] = await Promise.all([
      this.rewardsRepository.findMany({
        rewardNo: query.reward_no,
        orderId: query.order_id,
        buyerId: query.buyer_id,
        referrerId: query.referrer_id,
        status: query.status,
        riskStatus: query.risk_status,
        page,
        pageSize
      }),
      this.rewardsRepository.count({
        rewardNo: query.reward_no,
        orderId: query.order_id,
        buyerId: query.buyer_id,
        referrerId: query.referrer_id,
        status: query.status,
        riskStatus: query.risk_status
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

  async approve(rewardId: string, dto: ApproveReferralRewardDto) {
    const reward = await this.rewardsRepository.findById(rewardId);
    if (!reward) {
      throw new Error(ReferralErrors.REWARD_NOT_FOUND);
    }

    if (!canTransitReferralRewardStatus(reward.status, ReferralRewardStatus.APPROVED)) {
      throw new Error(ReferralErrors.REWARD_STATUS_INVALID);
    }

    const updated = await this.rewardsRepository.updateStatus({
      rewardId,
      status: ReferralRewardStatus.APPROVED,
      reviewerId: dto.reviewer_id,
      reviewNote: dto.review_note,
      eventType: 'referral.reward_approved.v1'
    });

    return {
      reward_id: updated.id,
      reward_no: updated.rewardNo,
      reward_status: updated.status
    };
  }

  async markPayable(rewardId: string) {
    const reward = await this.rewardsRepository.findById(rewardId);
    if (!reward) {
      throw new Error(ReferralErrors.REWARD_NOT_FOUND);
    }

    if (!canTransitReferralRewardStatus(reward.status, ReferralRewardStatus.PAYABLE)) {
      throw new Error(ReferralErrors.REWARD_STATUS_INVALID);
    }

    const updated = await this.rewardsRepository.updateStatus({
      rewardId,
      status: ReferralRewardStatus.PAYABLE,
      eventType: 'referral.reward_payable.v1'
    });

    return {
      reward_id: updated.id,
      reward_no: updated.rewardNo,
      reward_status: updated.status
    };
  }

  async recover(rewardId: string, dto: RecoverReferralRewardDto) {
    const reward = await this.rewardsRepository.findById(rewardId);
    if (!reward) {
      throw new Error(ReferralErrors.REWARD_NOT_FOUND);
    }

    if (
      ![
        ReferralRewardStatus.APPROVED,
        ReferralRewardStatus.PAYABLE,
        ReferralRewardStatus.PAID,
        ReferralRewardStatus.RISK_HOLD
      ].includes(reward.status as any)
    ) {
      throw new Error(ReferralErrors.REWARD_NOT_RECOVERABLE);
    }

    const updated = await this.rewardsRepository.updateStatus({
      rewardId,
      status: ReferralRewardStatus.RECOVERED,
      reviewNote: dto.reason,
      eventType: 'referral.reward_recovered.v1'
    });

    return {
      reward_id: updated.id,
      reward_no: updated.rewardNo,
      reward_status: updated.status
    };
  }

  private formatReward(reward: any) {
    return {
      reward_id: reward.id,
      reward_no: reward.rewardNo,
      order_id: reward.orderId,
      buyer_id: reward.buyerId,
      referrer_id: reward.referrerId,
      reward_rate: reward.rewardRate.toString(),
      order_amount: reward.orderAmount.toString(),
      reward_amount: reward.rewardAmount.toString(),
      tax_amount: reward.taxAmount.toString(),
      net_amount: reward.netAmount.toString(),
      currency: reward.currency,
      status: reward.status,
      risk_status: reward.riskStatus,
      lock_until: reward.lockUntil,
      reviewed_by: reward.reviewedBy,
      review_note: reward.reviewNote,
      approved_at: reward.approvedAt,
      payable_at: reward.payableAt,
      paid_at: reward.paidAt,
      recovered_at: reward.recoveredAt
    };
  }

  private generateRewardNo() {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    return `RRW${date}${ulid()}`;
  }
}
```



---



# 17\. Rewards Controllers



`apps/referral-service/src/modules/rewards/rewards.controller.ts`



```TypeScript
import { Controller, Get, Param, Query } from '@nestjs/common';
import { RewardsService } from './rewards.service';
import { QueryReferralRewardsDto } from './dto/query-referral-rewards.dto';

@Controller('referrals/rewards')
export class RewardsController {
  constructor(private readonly rewardsService: RewardsService) {}

  @Get()
  list(@Query() query: QueryReferralRewardsDto) {
    return this.rewardsService.list(query);
  }

  @Get(':reward_id')
  detail(@Param('reward_id') rewardId: string) {
    return this.rewardsService.detail(rewardId);
  }
}
```



`apps/referral-service/src/modules/rewards/rewards.admin.controller.ts`



```TypeScript
import { Body, Controller, Param, Post } from '@nestjs/common';
import { RewardsService } from './rewards.service';
import { CreateReferralRewardDto } from './dto/create-referral-reward.dto';
import { ApproveReferralRewardDto } from './dto/approve-referral-reward.dto';
import { RecoverReferralRewardDto } from './dto/recover-referral-reward.dto';

@Controller('admin/referrals/rewards')
export class RewardsAdminController {
  constructor(private readonly rewardsService: RewardsService) {}

  @Post()
  create(@Body() dto: CreateReferralRewardDto) {
    return this.rewardsService.create(dto);
  }

  @Post(':reward_id/approve')
  approve(
    @Param('reward_id') rewardId: string,
    @Body() dto: ApproveReferralRewardDto
  ) {
    return this.rewardsService.approve(rewardId, dto);
  }

  @Post(':reward_id/payable')
  payable(@Param('reward_id') rewardId: string) {
    return this.rewardsService.markPayable(rewardId);
  }

  @Post(':reward_id/recover')
  recover(
    @Param('reward_id') rewardId: string,
    @Body() dto: RecoverReferralRewardDto
  ) {
    return this.rewardsService.recover(rewardId, dto);
  }
}
```



---



# 18\. Rewards Module



`apps/referral-service/src/modules/rewards/rewards.module.ts`



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



# 19\. Referral App Module



`apps/referral-service/src/app.module.ts`



```TypeScript
import { Module } from '@nestjs/common';
import { HealthModule } from './health/health.module';
import { BindingsModule } from './modules/bindings/bindings.module';
import { RewardsModule } from './modules/rewards/rewards.module';

@Module({
  imports: [
    HealthModule,
    BindingsModule,
    RewardsModule
  ]
})
export class AppModule {}
```



---



# 20\. Referral Service 当前 API



## 用户端



```HTTP
GET /api/v1/referrals/bindings
GET /api/v1/referrals/rewards
GET /api/v1/referrals/rewards/:reward_id
```



## 后台端



```HTTP
POST /api/v1/admin/referrals/rewards
POST /api/v1/admin/referrals/rewards/:reward_id/approve
POST /api/v1/admin/referrals/rewards/:reward_id/payable
POST /api/v1/admin/referrals/rewards/:reward_id/recover
```



---



# 21\. 业务结果验证



推荐奖励规则：



```Plain Text
reward_amount = order_amount × 10%
tax_amount = reward_amount × 10%
net_amount = reward_amount - tax_amount
```



示例：



```JSON
{
  "order_amount": "369.000000000000000000",
  "reward_rate": "0.100000000000000000",
  "reward_amount": "36.900000000000000000",
  "tax_amount": "3.690000000000000000",
  "net_amount": "33.210000000000000000"
}
```



---



# 22\. Referral Service 已具备能力



这一版完成后，Referral Service 支持：



```Plain Text
推荐关系查询
推荐绑定快照
推荐奖励创建
推荐奖励锁定
推荐奖励审核
推荐奖励转 payable
推荐奖励追回
推荐奖励状态机
推荐奖励事件 outbox
```



---



# 23\. 还需要补强的工业级能力



下一步需要补：



```Plain Text
统一 AppException
PrismaModule 注入
真实消费订单支付事件
真实 KYC 校验
真实 Risk Service 风控预检查
真实 Finance Service 结算联动
真实 Tax Service 税务记录联动
真实 Approval Service 审批联动
Audit Log
Admin 权限 Guard
幂等奖励生成
```



---



# 24\. 下一步继续



按 23 个 Service 顺序，下一步写：



```Plain Text
13. Team Reward Service 团队奖励服务
```



下一步会覆盖：



```Plain Text
团队 5 / 3 / 2 奖励
团队服务记录
奖励审核
奖励追回
TeamRewardCreated / Approved / Recovered 事件
```



