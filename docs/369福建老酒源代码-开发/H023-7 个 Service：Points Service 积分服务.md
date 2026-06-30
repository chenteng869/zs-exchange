# H023\-7 个 Service：Points Service 积分服务

下面继续按 23 个 Service 顺序写代码。



# 第 7 个 Service：Points Service 积分服务



本服务负责：



```Plain Text
FJ369 Points 权益值发放
cFJ369 贡献积分发放
积分账户查询
积分流水查询
订单支付后发积分
积分撤销
积分冻结 / 解冻预留
积分过期预留
PointsIssued outbox 事件
PointsRevoked outbox 事件
```



本服务采用统一资产账本模型：



```Plain Text
asset_accounts
asset_ledgers
```



积分业务专属记录放在：



```Plain Text
points_issue_records
points_expiration_records
points_rules
```



---



# 1\. Points Service 目录结构



```Plain Text
apps/points-service/
├── src/
│   ├── app.module.ts
│   ├── main.ts
│   ├── health/
│   ├── shared/
│   │   ├── points-errors.ts
│   │   ├── points-events.ts
│   │   ├── points-types.ts
│   │   └── points-ledger-types.ts
│   └── modules/
│       ├── points/
│       │   ├── points.module.ts
│       │   ├── points.controller.ts
│       │   ├── points.admin.controller.ts
│       │   ├── points.repository.ts
│       │   ├── points.service.ts
│       │   └── dto/
│       │       ├── issue-points.dto.ts
│       │       ├── revoke-points.dto.ts
│       │       ├── query-points-ledgers.dto.ts
│       │       └── query-user-points.dto.ts
│       └── rules/
│           ├── points-rules.module.ts
│           ├── points-rules.controller.ts
│           ├── points-rules.repository.ts
│           ├── points-rules.service.ts
│           └── dto/
│               └── create-points-rule.dto.ts
```



---



# 2\. Prisma 补充表



## 2\.1 PointsRule



```Plain Text
model PointsRule {
  id           String    @id
  ruleCode     String    @map("rule_code")
  ruleVersion  String    @map("rule_version")
  pointsType   String    @map("points_type")
  sourceType   String    @map("source_type")
  pointsPerUsd Decimal?  @map("points_per_usd") @db.Decimal(36, 18)
  fixedPoints  Decimal?  @map("fixed_points") @db.Decimal(36, 18)
  capAmount    Decimal?  @map("cap_amount") @db.Decimal(36, 18)
  status       String    @default("active")
  effectiveFrom DateTime? @map("effective_from")
  effectiveTo   DateTime? @map("effective_to")
  createdAt    DateTime  @default(now()) @map("created_at")
  updatedAt    DateTime  @updatedAt @map("updated_at")
  metadata     Json?

  @@unique([ruleCode, ruleVersion])
  @@index([pointsType])
  @@index([sourceType])
  @@map("points_rules")
}
```



## 2\.2 PointsIssueRecord



```Plain Text
model PointsIssueRecord {
  id            String   @id
  issueNo       String   @unique @map("issue_no")
  userId        String   @map("user_id")
  orderId       String?  @map("order_id")
  pointsType    String   @map("points_type")
  amount        Decimal  @db.Decimal(36, 18)
  ruleVersion   String?  @map("rule_version")
  assetLedgerId String?  @map("asset_ledger_id")
  issueStatus   String   @default("issued") @map("issue_status")
  sourceType    String   @map("source_type")
  sourceId      String   @map("source_id")
  createdAt     DateTime @default(now()) @map("created_at")
  updatedAt     DateTime @updatedAt @map("updated_at")
  metadata      Json?

  @@index([userId])
  @@index([orderId])
  @@index([sourceType, sourceId])
  @@map("points_issue_records")
}
```



## 2\.3 PointsExpirationRecord



```Plain Text
model PointsExpirationRecord {
  id            String   @id
  expirationNo  String   @unique @map("expiration_no")
  userId        String   @map("user_id")
  pointsType    String   @map("points_type")
  amount        Decimal  @db.Decimal(36, 18)
  expiredAt     DateTime @map("expired_at")
  assetLedgerId String?  @map("asset_ledger_id")
  status        String   @default("pending")
  createdAt     DateTime @default(now()) @map("created_at")
  metadata      Json?

  @@index([userId])
  @@index([pointsType])
  @@map("points_expiration_records")
}
```



---



# 3\. Points Events



`apps/points-service/src/shared/points-events.ts`



```TypeScript
export const PointsEvents = {
  POINTS_ISSUE_REQUESTED: 'points.issue_requested.v1',
  POINTS_ISSUED: 'points.issued.v1',
  POINTS_REVOKE_REQUESTED: 'points.revoke_requested.v1',
  POINTS_REVOKED: 'points.revoked.v1',
  POINTS_FROZEN: 'points.frozen.v1',
  POINTS_UNFROZEN: 'points.unfrozen.v1',
  POINTS_EXPIRED: 'points.expired.v1'
} as const;
```



---



# 4\. Points Errors



`apps/points-service/src/shared/points-errors.ts`



```TypeScript
export const PointsErrors = {
  POINTS_ACCOUNT_NOT_FOUND: 'POINTS_ACCOUNT_NOT_FOUND',
  POINTS_INSUFFICIENT_BALANCE: 'POINTS_INSUFFICIENT_BALANCE',
  POINTS_AMOUNT_INVALID: 'POINTS_AMOUNT_INVALID',
  POINTS_ALREADY_ISSUED: 'POINTS_ALREADY_ISSUED',
  POINTS_ISSUE_RECORD_NOT_FOUND: 'POINTS_ISSUE_RECORD_NOT_FOUND',
  POINTS_RULE_NOT_FOUND: 'POINTS_RULE_NOT_FOUND',
  POINTS_RULE_NOT_ACTIVE: 'POINTS_RULE_NOT_ACTIVE',
  POINTS_TYPE_INVALID: 'POINTS_TYPE_INVALID',
  POINTS_LEDGER_NOT_FOUND: 'POINTS_LEDGER_NOT_FOUND'
} as const;
```



---



# 5\. Points Types



`apps/points-service/src/shared/points-types.ts`



```TypeScript
export const PointsTypes = {
  FJ369_POINTS_VALUE: 'fj369_points_value',
  CFJ369: 'cfj369'
} as const;

export const PointsSymbols = {
  FJ369_POINTS_VALUE: 'FJ369_POINTS',
  CFJ369: 'cFJ369'
} as const;
```



---



# 6\. Points Ledger Types



`apps/points-service/src/shared/points-ledger-types.ts`



```TypeScript
export const PointsLedgerTypes = {
  EARN: 'earn',
  CONSUME: 'consume',
  FREEZE: 'freeze',
  UNFREEZE: 'unfreeze',
  CONVERT: 'convert',
  REVOKE: 'revoke',
  EXPIRE: 'expire',
  ADJUST_ADD: 'adjust_add',
  ADJUST_SUBTRACT: 'adjust_subtract'
} as const;
```



---



# 7\. DTO：IssuePointsDto



`apps/points-service/src/modules/points/dto/issue-points.dto.ts`



```TypeScript
import { IsOptional, IsString } from 'class-validator';

export class IssuePointsDto {
  @IsString()
  user_id!: string;

  @IsString()
  points_type!: string;

  @IsString()
  amount!: string;

  @IsString()
  source_type!: string;

  @IsString()
  source_id!: string;

  @IsOptional()
  @IsString()
  order_id?: string;

  @IsOptional()
  @IsString()
  rule_version?: string;
}
```



---



# 8\. DTO：RevokePointsDto



`apps/points-service/src/modules/points/dto/revoke-points.dto.ts`



```TypeScript
import { IsOptional, IsString } from 'class-validator';

export class RevokePointsDto {
  @IsString()
  user_id!: string;

  @IsString()
  points_type!: string;

  @IsString()
  amount!: string;

  @IsString()
  source_type!: string;

  @IsString()
  source_id!: string;

  @IsOptional()
  @IsString()
  order_id?: string;

  @IsOptional()
  @IsString()
  reason?: string;
}
```



---



# 9\. DTO：QueryPointsLedgersDto



`apps/points-service/src/modules/points/dto/query-points-ledgers.dto.ts`



```TypeScript
import { IsOptional, IsString } from 'class-validator';

export class QueryPointsLedgersDto {
  @IsOptional()
  @IsString()
  user_id?: string;

  @IsOptional()
  @IsString()
  points_type?: string;

  @IsOptional()
  @IsString()
  change_type?: string;

  @IsOptional()
  @IsString()
  source_type?: string;

  @IsOptional()
  @IsString()
  source_id?: string;

  @IsOptional()
  page?: number;

  @IsOptional()
  page_size?: number;
}
```



---



# 10\. DTO：QueryUserPointsDto



`apps/points-service/src/modules/points/dto/query-user-points.dto.ts`



```TypeScript
import { IsString } from 'class-validator';

export class QueryUserPointsDto {
  @IsString()
  user_id!: string;
}
```



---



# 11\. Points Repository



`apps/points-service/src/modules/points/points.repository.ts`



```TypeScript
import { Injectable } from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';
import { ulid } from 'ulid';

const prisma = new PrismaClient();

@Injectable()
export class PointsRepository {
  findAccount(userId: string, assetType: string, assetSymbol: string) {
    return prisma.assetAccount.findUnique({
      where: {
        userId_assetType_assetSymbol: {
          userId,
          assetType,
          assetSymbol
        }
      }
    });
  }

  findIssueBySource(params: {
    userId: string;
    pointsType: string;
    sourceType: string;
    sourceId: string;
  }) {
    return prisma.pointsIssueRecord.findFirst({
      where: {
        userId: params.userId,
        pointsType: params.pointsType,
        sourceType: params.sourceType,
        sourceId: params.sourceId,
        issueStatus: 'issued'
      }
    });
  }

  issue(data: {
    issueNo: string;
    ledgerNo: string;
    userId: string;
    assetType: string;
    assetSymbol: string;
    amount: string;
    sourceType: string;
    sourceId: string;
    orderId?: string;
    ruleVersion?: string;
  }) {
    return prisma.$transaction(async (tx) => {
      const existing = await tx.assetAccount.findUnique({
        where: {
          userId_assetType_assetSymbol: {
            userId: data.userId,
            assetType: data.assetType,
            assetSymbol: data.assetSymbol
          }
        }
      });

      const balanceBefore = existing?.availableBalance || new Prisma.Decimal(0);
      const balanceAfter = balanceBefore.add(new Prisma.Decimal(data.amount));

      const account = existing
        ? await tx.assetAccount.update({
            where: {
              userId_assetType_assetSymbol: {
                userId: data.userId,
                assetType: data.assetType,
                assetSymbol: data.assetSymbol
              }
            },
            data: {
              availableBalance: balanceAfter,
              totalIn: existing.totalIn.add(new Prisma.Decimal(data.amount))
            }
          })
        : await tx.assetAccount.create({
            data: {
              id: ulid(),
              userId: data.userId,
              assetType: data.assetType,
              assetSymbol: data.assetSymbol,
              availableBalance: new Prisma.Decimal(data.amount),
              frozenBalance: new Prisma.Decimal(0),
              lockedBalance: new Prisma.Decimal(0),
              totalIn: new Prisma.Decimal(data.amount),
              totalOut: new Prisma.Decimal(0),
              accountStatus: 'active'
            }
          });

      const ledger = await tx.assetLedger.create({
        data: {
          id: ulid(),
          ledgerNo: data.ledgerNo,
          userId: data.userId,
          assetType: data.assetType,
          assetSymbol: data.assetSymbol,
          changeType: 'earn',
          amount: new Prisma.Decimal(data.amount),
          balanceBefore,
          balanceAfter,
          sourceType: data.sourceType,
          sourceId: data.sourceId,
          orderId: data.orderId,
          ruleVersion: data.ruleVersion,
          riskStatus: 'normal'
        }
      });

      const issue = await tx.pointsIssueRecord.create({
        data: {
          id: ulid(),
          issueNo: data.issueNo,
          userId: data.userId,
          orderId: data.orderId,
          pointsType: data.assetType,
          amount: new Prisma.Decimal(data.amount),
          ruleVersion: data.ruleVersion,
          assetLedgerId: ledger.id,
          issueStatus: 'issued',
          sourceType: data.sourceType,
          sourceId: data.sourceId
        }
      });

      await tx.outboxEvent.create({
        data: {
          id: ulid(),
          eventType: 'points.issued.v1',
          payload: {
            issue_id: issue.id,
            issue_no: issue.issueNo,
            user_id: data.userId,
            points_type: data.assetType,
            amount: data.amount,
            source_type: data.sourceType,
            source_id: data.sourceId,
            order_id: data.orderId,
            ledger_id: ledger.id,
            ledger_no: ledger.ledgerNo
          },
          status: 'pending',
          retryCount: 0
        }
      });

      return { account, ledger, issue };
    });
  }

  revoke(data: {
    ledgerNo: string;
    userId: string;
    assetType: string;
    assetSymbol: string;
    amount: string;
    sourceType: string;
    sourceId: string;
    orderId?: string;
    reason?: string;
  }) {
    return prisma.$transaction(async (tx) => {
      const account = await tx.assetAccount.findUnique({
        where: {
          userId_assetType_assetSymbol: {
            userId: data.userId,
            assetType: data.assetType,
            assetSymbol: data.assetSymbol
          }
        }
      });

      if (!account) {
        throw new Error('POINTS_ACCOUNT_NOT_FOUND');
      }

      const balanceBefore = account.availableBalance;
      const balanceAfter = balanceBefore.sub(new Prisma.Decimal(data.amount));

      if (balanceAfter.lt(0)) {
        throw new Error('POINTS_INSUFFICIENT_BALANCE');
      }

      const updatedAccount = await tx.assetAccount.update({
        where: {
          userId_assetType_assetSymbol: {
            userId: data.userId,
            assetType: data.assetType,
            assetSymbol: data.assetSymbol
          }
        },
        data: {
          availableBalance: balanceAfter,
          totalOut: account.totalOut.add(new Prisma.Decimal(data.amount))
        }
      });

      const ledger = await tx.assetLedger.create({
        data: {
          id: ulid(),
          ledgerNo: data.ledgerNo,
          userId: data.userId,
          assetType: data.assetType,
          assetSymbol: data.assetSymbol,
          changeType: 'revoke',
          amount: new Prisma.Decimal(data.amount).negated(),
          balanceBefore,
          balanceAfter,
          sourceType: data.sourceType,
          sourceId: data.sourceId,
          orderId: data.orderId,
          riskStatus: 'normal',
          metadata: {
            reason: data.reason
          }
        }
      });

      await tx.outboxEvent.create({
        data: {
          id: ulid(),
          eventType: 'points.revoked.v1',
          payload: {
            user_id: data.userId,
            points_type: data.assetType,
            amount: data.amount,
            source_type: data.sourceType,
            source_id: data.sourceId,
            order_id: data.orderId,
            reason: data.reason,
            ledger_id: ledger.id,
            ledger_no: ledger.ledgerNo
          },
          status: 'pending',
          retryCount: 0
        }
      });

      return { account: updatedAccount, ledger };
    });
  }

  findAccounts(userId: string) {
    return prisma.assetAccount.findMany({
      where: {
        userId,
        assetType: {
          in: ['fj369_points_value', 'cfj369']
        }
      }
    });
  }

  findLedgers(params: {
    userId?: string;
    pointsType?: string;
    changeType?: string;
    sourceType?: string;
    sourceId?: string;
    page: number;
    pageSize: number;
  }) {
    return prisma.assetLedger.findMany({
      where: {
        userId: params.userId,
        assetType: params.pointsType,
        changeType: params.changeType,
        sourceType: params.sourceType,
        sourceId: params.sourceId
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip: (params.page - 1) * params.pageSize,
      take: params.pageSize
    });
  }

  countLedgers(params: {
    userId?: string;
    pointsType?: string;
    changeType?: string;
    sourceType?: string;
    sourceId?: string;
  }) {
    return prisma.assetLedger.count({
      where: {
        userId: params.userId,
        assetType: params.pointsType,
        changeType: params.changeType,
        sourceType: params.sourceType,
        sourceId: params.sourceId
      }
    });
  }
}
```



> 如果 `AssetLedger` model 还没有 `metadata Json?`，需要补上：
> 
> 
> 
> ```Plain Text
> metadata Json?
> ```
> 
> 



---



# 12\. Points Service



`apps/points-service/src/modules/points/points.service.ts`



```TypeScript
import { Injectable } from '@nestjs/common';
import Decimal from 'decimal.js';
import { ulid } from 'ulid';
import { PointsRepository } from './points.repository';
import { IssuePointsDto } from './dto/issue-points.dto';
import { RevokePointsDto } from './dto/revoke-points.dto';
import { QueryPointsLedgersDto } from './dto/query-points-ledgers.dto';
import { PointsErrors } from '../../shared/points-errors';
import { PointsSymbols, PointsTypes } from '../../shared/points-types';

@Injectable()
export class PointsService {
  constructor(private readonly pointsRepository: PointsRepository) {}

  async issue(dto: IssuePointsDto) {
    this.assertValidPointsType(dto.points_type);
    this.assertPositiveAmount(dto.amount);

    const existing = await this.pointsRepository.findIssueBySource({
      userId: dto.user_id,
      pointsType: dto.points_type,
      sourceType: dto.source_type,
      sourceId: dto.source_id
    });

    if (existing) {
      throw new Error(PointsErrors.POINTS_ALREADY_ISSUED);
    }

    const symbol = this.getSymbol(dto.points_type);

    const result = await this.pointsRepository.issue({
      issueNo: this.generateIssueNo(),
      ledgerNo: this.generateLedgerNo(),
      userId: dto.user_id,
      assetType: dto.points_type,
      assetSymbol: symbol,
      amount: new Decimal(dto.amount).toFixed(18),
      sourceType: dto.source_type,
      sourceId: dto.source_id,
      orderId: dto.order_id,
      ruleVersion: dto.rule_version
    });

    return {
      issue_id: result.issue.id,
      issue_no: result.issue.issueNo,
      user_id: dto.user_id,
      points_type: dto.points_type,
      asset_symbol: symbol,
      amount: result.issue.amount.toString(),
      issue_status: result.issue.issueStatus,
      ledger_no: result.ledger.ledgerNo,
      balance_after: result.ledger.balanceAfter.toString()
    };
  }

  async revoke(dto: RevokePointsDto) {
    this.assertValidPointsType(dto.points_type);
    this.assertPositiveAmount(dto.amount);

    const symbol = this.getSymbol(dto.points_type);

    const result = await this.pointsRepository.revoke({
      ledgerNo: this.generateLedgerNo(),
      userId: dto.user_id,
      assetType: dto.points_type,
      assetSymbol: symbol,
      amount: new Decimal(dto.amount).toFixed(18),
      sourceType: dto.source_type,
      sourceId: dto.source_id,
      orderId: dto.order_id,
      reason: dto.reason
    });

    return {
      user_id: dto.user_id,
      points_type: dto.points_type,
      asset_symbol: symbol,
      revoked_amount: new Decimal(dto.amount).toFixed(18),
      ledger_no: result.ledger.ledgerNo,
      balance_after: result.ledger.balanceAfter.toString()
    };
  }

  async getUserPoints(userId: string) {
    const accounts = await this.pointsRepository.findAccounts(userId);

    const fj369 = accounts.find((item) => item.assetType === PointsTypes.FJ369_POINTS_VALUE);
    const cfj369 = accounts.find((item) => item.assetType === PointsTypes.CFJ369);

    return {
      user_id: userId,
      fj369_points_value: {
        available_balance: fj369?.availableBalance.toString() || '0.000000000000000000',
        frozen_balance: fj369?.frozenBalance.toString() || '0.000000000000000000',
        locked_balance: fj369?.lockedBalance.toString() || '0.000000000000000000'
      },
      cfj369: {
        available_balance: cfj369?.availableBalance.toString() || '0.000000000000000000',
        frozen_balance: cfj369?.frozenBalance.toString() || '0.000000000000000000',
        locked_balance: cfj369?.lockedBalance.toString() || '0.000000000000000000'
      }
    };
  }

  async listLedgers(query: QueryPointsLedgersDto) {
    const page = Number(query.page || 1);
    const pageSize = Math.min(Number(query.page_size || 20), 100);

    const [items, total] = await Promise.all([
      this.pointsRepository.findLedgers({
        userId: query.user_id,
        pointsType: query.points_type,
        changeType: query.change_type,
        sourceType: query.source_type,
        sourceId: query.source_id,
        page,
        pageSize
      }),
      this.pointsRepository.countLedgers({
        userId: query.user_id,
        pointsType: query.points_type,
        changeType: query.change_type,
        sourceType: query.source_type,
        sourceId: query.source_id
      })
    ]);

    return {
      items: items.map((item) => ({
        ledger_id: item.id,
        ledger_no: item.ledgerNo,
        user_id: item.userId,
        points_type: item.assetType,
        asset_symbol: item.assetSymbol,
        change_type: item.changeType,
        amount: item.amount.toString(),
        balance_before: item.balanceBefore.toString(),
        balance_after: item.balanceAfter.toString(),
        source_type: item.sourceType,
        source_id: item.sourceId,
        order_id: item.orderId,
        rule_version: item.ruleVersion,
        created_at: item.createdAt
      })),
      pagination: {
        page,
        page_size: pageSize,
        total,
        total_pages: Math.ceil(total / pageSize)
      }
    };
  }

  async issueWine369OrderPoints(params: {
    user_id: string;
    order_id: string;
    order_amount: string;
    currency: string;
  }) {
    const fj369Points = await this.issue({
      user_id: params.user_id,
      points_type: PointsTypes.FJ369_POINTS_VALUE,
      amount: '369000',
      source_type: 'wine_order',
      source_id: params.order_id,
      order_id: params.order_id,
      rule_version: 'WINE_369_POINTS_RULE_V1'
    });

    const cfj369Amount = new Decimal(params.order_amount).mul(10).toFixed(18);

    const cfj369 = await this.issue({
      user_id: params.user_id,
      points_type: PointsTypes.CFJ369,
      amount: cfj369Amount,
      source_type: 'wine_order',
      source_id: params.order_id,
      order_id: params.order_id,
      rule_version: 'WINE_369_CFJ369_RULE_V1'
    });

    return {
      user_id: params.user_id,
      order_id: params.order_id,
      fj369_points_value: fj369Points,
      cfj369
    };
  }

  private assertValidPointsType(pointsType: string) {
    if (![PointsTypes.FJ369_POINTS_VALUE, PointsTypes.CFJ369].includes(pointsType as any)) {
      throw new Error(PointsErrors.POINTS_TYPE_INVALID);
    }
  }

  private assertPositiveAmount(amount: string) {
    if (new Decimal(amount).lte(0)) {
      throw new Error(PointsErrors.POINTS_AMOUNT_INVALID);
    }
  }

  private getSymbol(pointsType: string) {
    if (pointsType === PointsTypes.FJ369_POINTS_VALUE) {
      return PointsSymbols.FJ369_POINTS_VALUE;
    }

    if (pointsType === PointsTypes.CFJ369) {
      return PointsSymbols.CFJ369;
    }

    throw new Error(PointsErrors.POINTS_TYPE_INVALID);
  }

  private generateIssueNo() {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    return `PIS${date}${ulid()}`;
  }

  private generateLedgerNo() {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    return `LED${date}${ulid()}`;
  }
}
```



---



# 13\. Points User Controller



`apps/points-service/src/modules/points/points.controller.ts`



```TypeScript
import { Controller, Get, Param, Query } from '@nestjs/common';
import { PointsService } from './points.service';
import { QueryPointsLedgersDto } from './dto/query-points-ledgers.dto';

@Controller('points')
export class PointsController {
  constructor(private readonly pointsService: PointsService) {}

  @Get('users/:user_id')
  getUserPoints(@Param('user_id') userId: string) {
    return this.pointsService.getUserPoints(userId);
  }

  @Get('ledgers')
  listLedgers(@Query() query: QueryPointsLedgersDto) {
    return this.pointsService.listLedgers(query);
  }
}
```



---



# 14\. Points Admin Controller



`apps/points-service/src/modules/points/points.admin.controller.ts`



```TypeScript
import { Body, Controller, Post } from '@nestjs/common';
import { PointsService } from './points.service';
import { IssuePointsDto } from './dto/issue-points.dto';
import { RevokePointsDto } from './dto/revoke-points.dto';

@Controller('admin/points')
export class PointsAdminController {
  constructor(private readonly pointsService: PointsService) {}

  @Post('issue')
  issue(@Body() dto: IssuePointsDto) {
    return this.pointsService.issue(dto);
  }

  @Post('revoke')
  revoke(@Body() dto: RevokePointsDto) {
    return this.pointsService.revoke(dto);
  }

  @Post('issue-wine-369-order')
  issueWine369OrderPoints(
    @Body()
    dto: {
      user_id: string;
      order_id: string;
      order_amount: string;
      currency: string;
    }
  ) {
    return this.pointsService.issueWine369OrderPoints(dto);
  }
}
```



---



# 15\. Points Module



`apps/points-service/src/modules/points/points.module.ts`



```TypeScript
import { Module } from '@nestjs/common';
import { PointsController } from './points.controller';
import { PointsAdminController } from './points.admin.controller';
import { PointsService } from './points.service';
import { PointsRepository } from './points.repository';

@Module({
  controllers: [PointsController, PointsAdminController],
  providers: [PointsService, PointsRepository],
  exports: [PointsService]
})
export class PointsModule {}
```



---



# 16\. DTO：CreatePointsRuleDto



`apps/points-service/src/modules/rules/dto/create-points-rule.dto.ts`



```TypeScript
import { IsOptional, IsString } from 'class-validator';

export class CreatePointsRuleDto {
  @IsString()
  rule_code!: string;

  @IsString()
  rule_version!: string;

  @IsString()
  points_type!: string;

  @IsString()
  source_type!: string;

  @IsOptional()
  @IsString()
  points_per_usd?: string;

  @IsOptional()
  @IsString()
  fixed_points?: string;

  @IsOptional()
  @IsString()
  cap_amount?: string;

  @IsOptional()
  @IsString()
  effective_from?: string;

  @IsOptional()
  @IsString()
  effective_to?: string;
}
```



---



# 17\. Points Rules Repository



`apps/points-service/src/modules/rules/points-rules.repository.ts`



```TypeScript
import { Injectable } from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';
import { ulid } from 'ulid';

const prisma = new PrismaClient();

@Injectable()
export class PointsRulesRepository {
  create(data: {
    ruleCode: string;
    ruleVersion: string;
    pointsType: string;
    sourceType: string;
    pointsPerUsd?: string;
    fixedPoints?: string;
    capAmount?: string;
    effectiveFrom?: Date;
    effectiveTo?: Date;
  }) {
    return prisma.pointsRule.create({
      data: {
        id: ulid(),
        ruleCode: data.ruleCode,
        ruleVersion: data.ruleVersion,
        pointsType: data.pointsType,
        sourceType: data.sourceType,
        pointsPerUsd: data.pointsPerUsd ? new Prisma.Decimal(data.pointsPerUsd) : undefined,
        fixedPoints: data.fixedPoints ? new Prisma.Decimal(data.fixedPoints) : undefined,
        capAmount: data.capAmount ? new Prisma.Decimal(data.capAmount) : undefined,
        effectiveFrom: data.effectiveFrom,
        effectiveTo: data.effectiveTo,
        status: 'active'
      }
    });
  }

  findActive(ruleCode: string, ruleVersion: string) {
    return prisma.pointsRule.findUnique({
      where: {
        ruleCode_ruleVersion: {
          ruleCode,
          ruleVersion
        }
      }
    });
  }
}
```



---



# 18\. Points Rules Service



`apps/points-service/src/modules/rules/points-rules.service.ts`



```TypeScript
import { Injectable } from '@nestjs/common';
import { CreatePointsRuleDto } from './dto/create-points-rule.dto';
import { PointsRulesRepository } from './points-rules.repository';

@Injectable()
export class PointsRulesService {
  constructor(private readonly rulesRepository: PointsRulesRepository) {}

  async create(dto: CreatePointsRuleDto) {
    const rule = await this.rulesRepository.create({
      ruleCode: dto.rule_code,
      ruleVersion: dto.rule_version,
      pointsType: dto.points_type,
      sourceType: dto.source_type,
      pointsPerUsd: dto.points_per_usd,
      fixedPoints: dto.fixed_points,
      capAmount: dto.cap_amount,
      effectiveFrom: dto.effective_from ? new Date(dto.effective_from) : undefined,
      effectiveTo: dto.effective_to ? new Date(dto.effective_to) : undefined
    });

    return {
      rule_id: rule.id,
      rule_code: rule.ruleCode,
      rule_version: rule.ruleVersion,
      points_type: rule.pointsType,
      source_type: rule.sourceType,
      points_per_usd: rule.pointsPerUsd?.toString(),
      fixed_points: rule.fixedPoints?.toString(),
      status: rule.status
    };
  }
}
```



---



# 19\. Points Rules Controller



`apps/points-service/src/modules/rules/points-rules.controller.ts`



```TypeScript
import { Body, Controller, Post } from '@nestjs/common';
import { PointsRulesService } from './points-rules.service';
import { CreatePointsRuleDto } from './dto/create-points-rule.dto';

@Controller('admin/points/rules')
export class PointsRulesController {
  constructor(private readonly pointsRulesService: PointsRulesService) {}

  @Post()
  create(@Body() dto: CreatePointsRuleDto) {
    return this.pointsRulesService.create(dto);
  }
}
```



---



# 20\. Points Rules Module



`apps/points-service/src/modules/rules/points-rules.module.ts`



```TypeScript
import { Module } from '@nestjs/common';
import { PointsRulesController } from './points-rules.controller';
import { PointsRulesService } from './points-rules.service';
import { PointsRulesRepository } from './points-rules.repository';

@Module({
  controllers: [PointsRulesController],
  providers: [PointsRulesService, PointsRulesRepository],
  exports: [PointsRulesService]
})
export class PointsRulesModule {}
```



---



# 21\. Points App Module



`apps/points-service/src/app.module.ts`



```TypeScript
import { Module } from '@nestjs/common';
import { HealthModule } from './health/health.module';
import { PointsModule } from './modules/points/points.module';
import { PointsRulesModule } from './modules/rules/points-rules.module';

@Module({
  imports: [
    HealthModule,
    PointsModule,
    PointsRulesModule
  ]
})
export class AppModule {}
```



---



# 22\. Points Service 当前 API



## 用户端



```HTTP
GET /api/v1/points/users/:user_id
GET /api/v1/points/ledgers
```



## 后台端



```HTTP
POST /api/v1/admin/points/issue
POST /api/v1/admin/points/revoke
POST /api/v1/admin/points/issue-wine-369-order
POST /api/v1/admin/points/rules
```



---



# 23\. 369 酒订单积分验证



请求：



```JSON
{
  "user_id": "usr_001",
  "order_id": "ord_001",
  "order_amount": "369",
  "currency": "USD"
}
```



结果：



```JSON
{
  "fj369_points_value": {
    "points_type": "fj369_points_value",
    "amount": "369000.000000000000000000"
  },
  "cfj369": {
    "points_type": "cfj369",
    "amount": "3690.000000000000000000"
  }
}
```



对应资产账户：



```Plain Text
fj369_points_value available_balance += 369000
cfj369 available_balance += 3690
```



对应流水：



```Plain Text
asset_ledgers change_type = earn
source_type = wine_order
source_id = order_id
```



---



# 24\. Points Service 已具备能力



这一版完成后，Points Service 支持：



```Plain Text
FJ369 Points 权益值发放
cFJ369 发放
用户积分账户查询
积分流水查询
防止同来源重复发放
积分撤销
余额不足禁止撤销
369 酒订单固定发 369,000 权益值
369 酒订单按 1 USD = 10 cFJ369 发放
PointsIssued outbox 事件
PointsRevoked outbox 事件
积分规则创建
```



---



# 25\. 还需要补强的工业级能力



下一步基础库完善后补：



```Plain Text
统一 AppException
PrismaModule 注入
真实事件消费 order.paid.v1
规则引擎读取 points rule
Idempotency-Key
审批流接入
Admin 权限 Guard
Audit Log
Risk Check
积分冻结 / 解冻
积分过期任务
积分冲正记录
调用 Asset Ledger Service，而不是本服务直接写 asset_accounts
```



> 工业级最终形态：Points Service 不应该直接写资产账户，应该调用 Asset Ledger Service。  
> 
> 当前代码是为了先跑通链路，后续会抽成统一资产账本服务。
> 
> 



---



# 26\. 下一步继续



按 23 个 Service 顺序，下一步写：



```Plain Text
8. Tradable Points Service tFJ369 服务
```



Tradable Points Service 第一版会包含：



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
```



需要补充数据库：



```Plain Text
points_conversion_orders
points_conversion_fee_items
tpoints_trade_orders
tpoints_trade_matches
tpoints_trade_fees
tpoints_locks
```



