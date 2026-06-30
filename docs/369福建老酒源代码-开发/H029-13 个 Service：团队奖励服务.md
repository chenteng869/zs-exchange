# H029\-13 个 Service：团队奖励服务

下面继续第 13 个 Service：Team Reward Service。



# 第 13 个 Service：团队奖励服务



本服务负责：



```Plain Text
团队 5 / 3 / 2 奖励
团队服务记录审核
团队关系管理
团队奖励锁定
团队奖励审核
团队奖励结算
团队奖励追回
TeamRewardCreated / Approved / Payable / Recovered 事件预留
```



---



# 1\. Team Reward Service 目录结构



```Plain Text
apps/team-reward-service/
├── src/
│   ├── app.module.ts
│   ├── main.ts
│   ├── health/
│   │   ├── health.controller.ts
│   │   └── health.module.ts
│   ├── shared/
│   │   ├── team-reward-errors.ts
│   │   ├── team-reward-events.ts
│   │   └── team-reward-status.ts
│   └── modules/
│       ├── relations/
│       │   ├── relations.module.ts
│       │   ├── relations.controller.ts
│       │   ├── relations.repository.ts
│       │   ├── relations.service.ts
│       │   └── dto/
│       │       └── query-team-relation.dto.ts
│       └── rewards/
│           ├── rewards.module.ts
│           ├── rewards.controller.ts
│           ├── rewards.admin.controller.ts
│           ├── rewards.repository.ts
│           ├── rewards.service.ts
│           └── dto/
│               ├── create-team-reward.dto.ts
│               ├── approve-team-reward.dto.ts
│               ├── recover-team-reward.dto.ts
│               └── query-team-rewards.dto.ts
```



---



# 2\. Prisma 补充表



## 2\.1 TeamRelation



```Plain Text
model TeamRelation {
  id            String   @id
  userId        String   @unique @map("user_id")
  parentId      String?  @map("parent_id")
  levelPath     String   @map("level_path")
  relationType  String   @default("team") @map("relation_type")
  isValid       Boolean  @default(true) @map("is_valid")
  riskStatus    String   @default("normal") @map("risk_status")
  createdAt     DateTime @default(now()) @map("created_at")
  updatedAt     DateTime @updatedAt @map("updated_at")
  metadata      Json?

  @@index([parentId])
  @@map("team_relations")
}
```



## 2\.2 TeamReward



```Plain Text
model TeamReward {
  id            String    @id
  rewardNo      String    @unique @map("reward_no")
  orderId       String    @map("order_id")
  buyerId       String    @map("buyer_id")
  teamUserId    String    @map("team_user_id")
  levelNumber   Int       @map("level_number")
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
  @@index([teamUserId])
  @@index([status])
  @@map("team_rewards")
}
```



## 2\.3 TeamServiceRecord



```Plain Text
model TeamServiceRecord {
  id            String   @id
  userId        String   @map("user_id")
  serviceType   String   @map("service_type")
  relatedUserId String?  @map("related_user_id")
  relatedOrderId String? @map("related_order_id")
  evidenceUrl   String?  @map("evidence_url")
  status        String   @default("submitted")
  reviewerId    String?  @map("reviewer_id")
  reviewNote    String?  @map("review_note")
  submittedAt   DateTime @default(now()) @map("submitted_at")
  reviewedAt    DateTime? @map("reviewed_at")
  createdAt     DateTime @default(now()) @map("created_at")
  updatedAt     DateTime @updatedAt @map("updated_at")
  metadata      Json?

  @@index([userId])
  @@index([status])
  @@map("team_service_records")
}
```



---



# 3\. Team Reward Events



`apps/team-reward-service/src/shared/team-reward-events.ts`



```TypeScript
export const TeamRewardEvents = {
  TEAM_RELATION_CREATED: 'team.relation_created.v1',
  TEAM_REWARD_CREATED: 'team.reward_created.v1',
  TEAM_REWARD_LOCKED: 'team.reward_locked.v1',
  TEAM_REWARD_APPROVED: 'team.reward_approved.v1',
  TEAM_REWARD_PAYABLE: 'team.reward_payable.v1',
  TEAM_REWARD_PAID: 'team.reward_paid.v1',
  TEAM_REWARD_RECOVERED: 'team.reward_recovered.v1'
} as const;
```



---



# 4\. Team Reward Errors



`apps/team-reward-service/src/shared/team-reward-errors.ts`



```TypeScript
export const TeamRewardErrors = {
  TEAM_RELATION_NOT_FOUND: 'TEAM_RELATION_NOT_FOUND',
  TEAM_RELATION_INVALID: 'TEAM_RELATION_INVALID',
  TEAM_RELATION_LOOP_NOT_ALLOWED: 'TEAM_RELATION_LOOP_NOT_ALLOWED',
  TEAM_REWARD_ALREADY_EXISTS: 'TEAM_REWARD_ALREADY_EXISTS',
  TEAM_REWARD_NOT_FOUND: 'TEAM_REWARD_NOT_FOUND',
  TEAM_REWARD_STATUS_INVALID: 'TEAM_REWARD_STATUS_INVALID',
  TEAM_REWARD_AMOUNT_INVALID: 'TEAM_REWARD_AMOUNT_INVALID',
  TEAM_REWARD_NOT_RECOVERABLE: 'TEAM_REWARD_NOT_RECOVERABLE'
} as const;
```



---



# 5\. Team Reward Status



`apps/team-reward-service/src/shared/team-reward-status.ts`



```TypeScript
export const TeamRewardStatus = {
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

export const TeamRewardTransitions: Record = {
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

export function canTransitTeamRewardStatus(from: string, to: string): boolean {
  return TeamRewardTransitions[from]?.includes(to) ?? false;
}
```



---



# 6\. DTO：QueryTeamRelationDto



`apps/team-reward-service/src/modules/relations/dto/query-team-relation.dto.ts`



```TypeScript
import { IsOptional, IsString } from 'class-validator';

export class QueryTeamRelationDto {
  @IsOptional()
  @IsString()
  user_id?: string;

  @IsOptional()
  @IsString()
  parent_id?: string;
}
```



---



# 7\. DTO：CreateTeamRewardDto



`apps/team-reward-service/src/modules/rewards/dto/create-team-reward.dto.ts`



```TypeScript
import { IsInt, IsString, Min } from 'class-validator';

export class CreateTeamRewardDto {
  @IsString()
  order_id!: string;

  @IsString()
  buyer_id!: string;

  @IsString()
  team_user_id!: string;

  @IsInt()
  @Min(1)
  level_number!: number;

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



# 8\. DTO：ApproveTeamRewardDto



`apps/team-reward-service/src/modules/rewards/dto/approve-team-reward.dto.ts`



```TypeScript
import { IsOptional, IsString } from 'class-validator';

export class ApproveTeamRewardDto {
  @IsString()
  reviewer_id!: string;

  @IsOptional()
  @IsString()
  review_note?: string;
}
```



---



# 9\. DTO：RecoverTeamRewardDto



`apps/team-reward-service/src/modules/rewards/dto/recover-team-reward.dto.ts`



```TypeScript
import { IsString } from 'class-validator';

export class RecoverTeamRewardDto {
  @IsString()
  reason!: string;

  @IsString()
  approval_id!: string;
}
```



---



# 10\. DTO：QueryTeamRewardsDto



`apps/team-reward-service/src/modules/rewards/dto/query-team-rewards.dto.ts`



```TypeScript
import { IsOptional, IsString } from 'class-validator';

export class QueryTeamRewardsDto {
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
  team_user_id?: string;

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



# 11\. Relations Repository



`apps/team-reward-service/src/modules/relations/relations.repository.ts`



```TypeScript
import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { ulid } from 'ulid';

const prisma = new PrismaClient();

@Injectable()
export class RelationsRepository {
  findByUserId(userId: string) {
    return prisma.teamRelation.findUnique({
      where: { userId }
    });
  }

  findByParentId(parentId: string) {
    return prisma.teamRelation.findMany({
      where: { parentId }
    });
  }

  createRelation(data: {
    userId: string;
    parentId?: string;
    levelPath: string;
    relationType?: string;
    isValid?: boolean;
    riskStatus?: string;
  }) {
    return prisma.teamRelation.create({
      data: {
        id: ulid(),
        userId: data.userId,
        parentId: data.parentId,
        levelPath: data.levelPath,
        relationType: data.relationType || 'team',
        isValid: data.isValid ?? true,
        riskStatus: data.riskStatus || 'normal'
      }
    });
  }
}
```



---



# 12\. Relations Service



`apps/team-reward-service/src/modules/relations/relations.service.ts`



```TypeScript
import { Injectable } from '@nestjs/common';
import { RelationsRepository } from './relations.repository';
import { QueryTeamRelationDto } from './dto/query-team-relation.dto';
import { TeamRewardErrors } from '../../shared/team-reward-errors';

@Injectable()
export class RelationsService {
  constructor(private readonly relationsRepository: RelationsRepository) {}

  async getRelation(query: QueryTeamRelationDto) {
    if (query.user_id) {
      const relation = await this.relationsRepository.findByUserId(query.user_id);
      return {
        items: relation
          ? [
              {
                user_id: relation.userId,
                parent_id: relation.parentId,
                level_path: relation.levelPath,
                relation_type: relation.relationType,
                is_valid: relation.isValid,
                risk_status: relation.riskStatus
              }
            ]
          : []
      };
    }

    if (query.parent_id) {
      const items = await this.relationsRepository.findByParentId(query.parent_id);
      return {
        items: items.map((relation) => ({
          user_id: relation.userId,
          parent_id: relation.parentId,
          level_path: relation.levelPath,
          relation_type: relation.relationType,
          is_valid: relation.isValid,
          risk_status: relation.riskStatus
        }))
      };
    }

    return { items: [] };
  }

  async createRelation(data: {
    userId: string;
    parentId?: string;
    levelPath: string;
    relationType?: string;
    isValid?: boolean;
    riskStatus?: string;
  }) {
    if (data.parentId && data.parentId === data.userId) {
      throw new Error(TeamRewardErrors.TEAM_RELATION_LOOP_NOT_ALLOWED);
    }

    return this.relationsRepository.createRelation(data);
  }
}
```



---



# 13\. Relations Controller / Module



`apps/team-reward-service/src/modules/relations/relations.controller.ts`



```TypeScript
import { Controller, Get, Query } from '@nestjs/common';
import { RelationsService } from './relations.service';
import { QueryTeamRelationDto } from './dto/query-team-relation.dto';

@Controller('team/relations')
export class RelationsController {
  constructor(private readonly relationsService: RelationsService) {}

  @Get()
  getRelation(@Query() query: QueryTeamRelationDto) {
    return this.relationsService.getRelation(query);
  }
}
```



`apps/team-reward-service/src/modules/relations/relations.module.ts`



```TypeScript
import { Module } from '@nestjs/common';
import { RelationsController } from './relations.controller';
import { RelationsService } from './relations.service';
import { RelationsRepository } from './relations.repository';

@Module({
  controllers: [RelationsController],
  providers: [RelationsService, RelationsRepository],
  exports: [RelationsService]
})
export class RelationsModule {}
```



---



# 14\. Rewards Repository



`apps/team-reward-service/src/modules/rewards/rewards.repository.ts`



```TypeScript
import { Injectable } from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';
import { ulid } from 'ulid';

const prisma = new PrismaClient();

@Injectable()
export class RewardsRepository {
  findById(rewardId: string) {
    return prisma.teamReward.findUnique({
      where: { id: rewardId }
    });
  }

  findByOrderId(orderId: string) {
    return prisma.teamReward.findFirst({
      where: { orderId }
    });
  }

  findMany(params: {
    rewardNo?: string;
    orderId?: string;
    buyerId?: string;
    teamUserId?: string;
    status?: string;
    riskStatus?: string;
    page: number;
    pageSize: number;
  }) {
    return prisma.teamReward.findMany({
      where: {
        rewardNo: params.rewardNo,
        orderId: params.orderId,
        buyerId: params.buyerId,
        teamUserId: params.teamUserId,
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
    teamUserId?: string;
    status?: string;
    riskStatus?: string;
  }) {
    return prisma.teamReward.count({
      where: {
        rewardNo: params.rewardNo,
        orderId: params.orderId,
        buyerId: params.buyerId,
        teamUserId: params.teamUserId,
        status: params.status,
        riskStatus: params.riskStatus
      }
    });
  }

  create(data: {
    rewardNo: string;
    orderId: string;
    buyerId: string;
    teamUserId: string;
    levelNumber: number;
    rewardRate: string;
    orderAmount: string;
    rewardAmount: string;
    taxAmount: string;
    netAmount: string;
    currency: string;
    lockUntil: Date;
  }) {
    return prisma.$transaction(async (tx) => {
      const reward = await tx.teamReward.create({
        data: {
          id: ulid(),
          rewardNo: data.rewardNo,
          orderId: data.orderId,
          buyerId: data.buyerId,
          teamUserId: data.teamUserId,
          levelNumber: data.levelNumber,
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
          eventType: 'team.reward_created.v1',
          payload: {
            reward_id: reward.id,
            reward_no: reward.rewardNo,
            order_id: reward.orderId,
            buyer_id: reward.buyerId,
            team_user_id: reward.teamUserId,
            level_number: reward.levelNumber,
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
      const updated = await tx.teamReward.update({
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
              team_user_id: updated.teamUserId,
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



# 15\. Rewards Service



`apps/team-reward-service/src/modules/rewards/rewards.service.ts`



```TypeScript
import { Injectable } from '@nestjs/common';
import Decimal from 'decimal.js';
import { ulid } from 'ulid';
import { RewardsRepository } from './rewards.repository';
import { CreateTeamRewardDto } from './dto/create-team-reward.dto';
import { ApproveTeamRewardDto } from './dto/approve-team-reward.dto';
import { RecoverTeamRewardDto } from './dto/recover-team-reward.dto';
import { QueryTeamRewardsDto } from './dto/query-team-rewards.dto';
import { TeamRewardErrors } from '../../shared/team-reward-errors';
import { TeamRewardStatus, canTransitTeamRewardStatus } from '../../shared/team-reward-status';

@Injectable()
export class RewardsService {
  constructor(private readonly rewardsRepository: RewardsRepository) {}

  async create(dto: CreateTeamRewardDto) {
    if (new Decimal(dto.reward_rate).lte(0) || new Decimal(dto.order_amount).lte(0)) {
      throw new Error(TeamRewardErrors.TEAM_REWARD_AMOUNT_INVALID);
    }

    const existing = await this.rewardsRepository.findByOrderId(dto.order_id);
    if (existing) {
      throw new Error(TeamRewardErrors.TEAM_REWARD_ALREADY_EXISTS);
    }

    const rewardAmount = new Decimal(dto.order_amount).mul(dto.reward_rate);
    const taxAmount = rewardAmount.mul('0.10');
    const netAmount = rewardAmount.sub(taxAmount);

    const reward = await this.rewardsRepository.create({
      rewardNo: this.generateRewardNo(),
      orderId: dto.order_id,
      buyerId: dto.buyer_id,
      teamUserId: dto.team_user_id,
      levelNumber: dto.level_number,
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
    if (!reward) throw new Error(TeamRewardErrors.TEAM_REWARD_NOT_FOUND);
    return this.formatReward(reward);
  }

  async list(query: QueryTeamRewardsDto) {
    const page = Number(query.page || 1);
    const pageSize = Math.min(Number(query.page_size || 20), 100);

    const [items, total] = await Promise.all([
      this.rewardsRepository.findMany({
        rewardNo: query.reward_no,
        orderId: query.order_id,
        buyerId: query.buyer_id,
        teamUserId: query.team_user_id,
        status: query.status,
        riskStatus: query.risk_status,
        page,
        pageSize
      }),
      this.rewardsRepository.count({
        rewardNo: query.reward_no,
        orderId: query.order_id,
        buyerId: query.buyer_id,
        teamUserId: query.team_user_id,
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

  async approve(rewardId: string, dto: ApproveTeamRewardDto) {
    const reward = await this.rewardsRepository.findById(rewardId);
    if (!reward) throw new Error(TeamRewardErrors.TEAM_REWARD_NOT_FOUND);

    if (!canTransitTeamRewardStatus(reward.status, TeamRewardStatus.APPROVED)) {
      throw new Error(TeamRewardErrors.TEAM_REWARD_STATUS_INVALID);
    }

    const updated = await this.rewardsRepository.updateStatus({
      rewardId,
      status: TeamRewardStatus.APPROVED,
      reviewerId: dto.reviewer_id,
      reviewNote: dto.review_note,
      eventType: 'team.reward_approved.v1'
    });

    return {
      reward_id: updated.id,
      reward_no: updated.rewardNo,
      reward_status: updated.status
    };
  }

  async markPayable(rewardId: string) {
    const reward = await this.rewardsRepository.findById(rewardId);
    if (!reward) throw new Error(TeamRewardErrors.TEAM_REWARD_NOT_FOUND);

    if (!canTransitTeamRewardStatus(reward.status, TeamRewardStatus.PAYABLE)) {
      throw new Error(TeamRewardErrors.TEAM_REWARD_STATUS_INVALID);
    }

    const updated = await this.rewardsRepository.updateStatus({
      rewardId,
      status: TeamRewardStatus.PAYABLE,
      eventType: 'team.reward_payable.v1'
    });

    return {
      reward_id: updated.id,
      reward_no: updated.rewardNo,
      reward_status: updated.status
    };
  }

  async recover(rewardId: string, dto: RecoverTeamRewardDto) {
    const reward = await this.rewardsRepository.findById(rewardId);
    if (!reward) throw new Error(TeamRewardErrors.TEAM_REWARD_NOT_FOUND);

    if (
      ![
        TeamRewardStatus.APPROVED,
        TeamRewardStatus.PAYABLE,
        TeamRewardStatus.PAID,
        TeamRewardStatus.RISK_HOLD
      ].includes(reward.status as any)
    ) {
      throw new Error(TeamRewardErrors.TEAM_REWARD_NOT_RECOVERABLE);
    }

    const updated = await this.rewardsRepository.updateStatus({
      rewardId,
      status: TeamRewardStatus.RECOVERED,
      reviewNote: dto.reason,
      eventType: 'team.reward_recovered.v1'
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
      team_user_id: reward.teamUserId,
      level_number: reward.levelNumber,
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
    return `TRW${date}${ulid()}`;
  }
}
```



---



# 16\. Rewards Controllers



`apps/team-reward-service/src/modules/rewards/rewards.controller.ts`



```TypeScript
import { Controller, Get, Param, Query } from '@nestjs/common';
import { RewardsService } from './rewards.service';
import { QueryTeamRewardsDto } from './dto/query-team-rewards.dto';

@Controller('team/rewards')
export class RewardsController {
  constructor(private readonly rewardsService: RewardsService) {}

  @Get()
  list(@Query() query: QueryTeamRewardsDto) {
    return this.rewardsService.list(query);
  }

  @Get(':reward_id')
  detail(@Param('reward_id') rewardId: string) {
    return this.rewardsService.detail(rewardId);
  }
}
```



`apps/team-reward-service/src/modules/rewards/rewards.admin.controller.ts`



```TypeScript
import { Body, Controller, Param, Post } from '@nestjs/common';
import { RewardsService } from './rewards.service';
import { CreateTeamRewardDto } from './dto/create-team-reward.dto';
import { ApproveTeamRewardDto } from './dto/approve-team-reward.dto';
import { RecoverTeamRewardDto } from './dto/recover-team-reward.dto';

@Controller('admin/team/rewards')
export class RewardsAdminController {
  constructor(private readonly rewardsService: RewardsService) {}

  @Post()
  create(@Body() dto: CreateTeamRewardDto) {
    return this.rewardsService.create(dto);
  }

  @Post(':reward_id/approve')
  approve(
    @Param('reward_id') rewardId: string,
    @Body() dto: ApproveTeamRewardDto
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
    @Body() dto: RecoverTeamRewardDto
  ) {
    return this.rewardsService.recover(rewardId, dto);
  }
}
```



---



# 17\. Rewards Module



`apps/team-reward-service/src/modules/rewards/rewards.module.ts`



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



# 18\. Team Reward App Module



`apps/team-reward-service/src/app.module.ts`



```TypeScript
import { Module } from '@nestjs/common';
import { HealthModule } from './health/health.module';
import { RelationsModule } from './modules/relations/relations.module';
import { RewardsModule } from './modules/rewards/rewards.module';

@Module({
  imports: [
    HealthModule,
    RelationsModule,
    RewardsModule
  ]
})
export class AppModule {}
```



---



# 19\. Team Reward Service 当前 API



## 用户端



```HTTP
GET /api/v1/team/relations
GET /api/v1/team/rewards
GET /api/v1/team/rewards/:reward_id
```



## 后台端



```HTTP
POST /api/v1/admin/team/rewards
POST /api/v1/admin/team/rewards/:reward_id/approve
POST /api/v1/admin/team/rewards/:reward_id/payable
POST /api/v1/admin/team/rewards/:reward_id/recover
```



---



# 20\. 团队奖励结果验证



```Plain Text
reward_amount = order_amount × reward_rate
tax_amount = reward_amount × 10%
net_amount = reward_amount - tax_amount
```



如果某层奖励率是 5%：



```JSON
{
  "order_amount": "369.000000000000000000",
  "reward_rate": "0.050000000000000000",
  "reward_amount": "18.450000000000000000",
  "tax_amount": "1.845000000000000000",
  "net_amount": "16.605000000000000000"
}
```



---



# 21\. Team Reward Service 已具备能力



这一版完成后，Team Reward Service 支持：



```Plain Text
团队关系查询
团队奖励创建
团队奖励锁定
团队奖励审核
团队奖励转 payable
团队奖励追回
团队奖励状态机
团队奖励事件 outbox
```



---



# 22\. 还需要补强的工业级能力



下一步需要补：



```Plain Text
统一 AppException
PrismaModule 注入
真实消费订单支付事件
真实团队服务记录审核
真实 Risk Service 风控预检查
真实 Finance Service 联动
真实 Tax Service 联动
真实 Approval Service 联动
Audit Log
Admin 权限 Guard
```



---



# 23\. 下一步继续



按你前面定义的顺序，下一步应该写：



```Plain Text
14. Node Service 节点服务
```



如果你继续，我下一条直接写 **Node Service** 的代码骨架。

