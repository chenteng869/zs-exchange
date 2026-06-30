# H026\-10 个 Service：生态算力服务

下面继续第 10 个 Service：Eco Power Service。



# 第 10 个 Service：生态算力服务



本服务负责：



```Plain Text
算力账户查询
算力流水查询
算力规则管理
算力调整
算力冻结
算力快照生成
全网算力统计
会员倍率 / 活跃倍率 / 风控系数计算
PowerGranted / PowerAdjusted / PowerSnapshotCreated 事件预留
```



---



# 1\. Eco Power Service 目录结构



```Plain Text
apps/eco-power-service/
├── src/
│   ├── app.module.ts
│   ├── main.ts
│   ├── health/
│   │   ├── health.controller.ts
│   │   └── health.module.ts
│   ├── shared/
│   │   ├── power-errors.ts
│   │   ├── power-events.ts
│   │   ├── power-status.ts
│   │   └── power-types.ts
│   └── modules/
│       ├── accounts/
│       │   ├── accounts.module.ts
│       │   ├── accounts.controller.ts
│       │   ├── accounts.admin.controller.ts
│       │   ├── accounts.repository.ts
│       │   ├── accounts.service.ts
│       │   └── dto/
│       │       ├── query-my-power.dto.ts
│       │       ├── query-power-ledgers.dto.ts
│       │       ├── adjust-power.dto.ts
│       │       └── freeze-power.dto.ts
│       ├── snapshots/
│       │   ├── snapshots.module.ts
│       │   ├── snapshots.controller.ts
│       │   ├── snapshots.admin.controller.ts
│       │   ├── snapshots.repository.ts
│       │   ├── snapshots.service.ts
│       │   └── dto/
│       │       └── create-snapshot.dto.ts
│       └── rules/
│           ├── rules.module.ts
│           ├── rules.controller.ts
│           ├── rules.repository.ts
│           ├── rules.service.ts
│           └── dto/
│               └── create-power-rule.dto.ts
```



---



# 2\. Prisma 补充表



## 2\.1 EcoPowerRule



```Plain Text
model EcoPowerRule {
  id              String    @id
  ruleCode        String    @map("rule_code")
  ruleVersion     String    @map("rule_version")
  ruleType        String    @map("rule_type")
  status          String    @default("active")
  basePower       Decimal?  @map("base_power") @db.Decimal(36, 18)
  consumptionRate Decimal?  @map("consumption_rate") @db.Decimal(36, 18)
  nftRate         Decimal?  @map("nft_rate") @db.Decimal(36, 18)
  mallRate        Decimal?  @map("mall_rate") @db.Decimal(36, 18)
  tfj369HoldingRate Decimal? @map("tfj369_holding_rate") @db.Decimal(36, 18)
  tfj369LockRate  Decimal?  @map("tfj369_lock_rate") @db.Decimal(36, 18)
  memberMultiplier Decimal?  @map("member_multiplier") @db.Decimal(36, 18)
  activityMultiplier Decimal? @map("activity_multiplier") @db.Decimal(36, 18)
  riskCoefficient Decimal?   @map("risk_coefficient") @db.Decimal(36, 18)
  effectiveFrom   DateTime?  @map("effective_from")
  effectiveTo     DateTime?  @map("effective_to")
  createdAt       DateTime   @default(now()) @map("created_at")
  updatedAt       DateTime   @updatedAt @map("updated_at")
  metadata        Json?

  @@unique([ruleCode, ruleVersion])
  @@map("eco_power_rules")
}
```



## 2\.2 EcoPowerAccount



```Plain Text
model EcoPowerAccount {
  id                  String   @id
  userId              String   @map("user_id")
  basePower           Decimal  @default(0) @map("base_power") @db.Decimal(36, 18)
  consumptionPower    Decimal  @default(0) @map("consumption_power") @db.Decimal(36, 18)
  nftPower            Decimal  @default(0) @map("nft_power") @db.Decimal(36, 18)
  mallPower           Decimal  @default(0) @map("mall_power") @db.Decimal(36, 18)
  tfj369HoldingPower  Decimal  @default(0) @map("tfj369_holding_power") @db.Decimal(36, 18)
  tfj369LockPower     Decimal  @default(0) @map("tfj369_lock_power") @db.Decimal(36, 18)
  nodeServicePower    Decimal  @default(0) @map("node_service_power") @db.Decimal(36, 18)
  otherPower          Decimal  @default(0) @map("other_power") @db.Decimal(36, 18)
  totalRawPower       Decimal  @default(0) @map("total_raw_power") @db.Decimal(36, 18)
  memberMultiplier    Decimal  @default(1) @map("member_multiplier") @db.Decimal(36, 18)
  activityMultiplier  Decimal  @default(1) @map("activity_multiplier") @db.Decimal(36, 18)
  riskCoefficient     Decimal  @default(1) @map("risk_coefficient") @db.Decimal(36, 18)
  effectivePower      Decimal  @default(0) @map("effective_power") @db.Decimal(36, 18)
  accountStatus       String   @default("active") @map("account_status")
  createdAt           DateTime @default(now()) @map("created_at")
  updatedAt           DateTime @updatedAt @map("updated_at")

  @@unique([userId])
  @@map("eco_power_accounts")
}
```



## 2\.3 EcoPowerLedger



```Plain Text
model EcoPowerLedger {
  id           String   @id
  ledgerNo     String   @unique @map("ledger_no")
  userId       String   @map("user_id")
  powerType    String   @map("power_type")
  changeType   String   @map("change_type")
  amount       Decimal  @db.Decimal(36, 18)
  balanceBefore Decimal @map("balance_before") @db.Decimal(36, 18)
  balanceAfter Decimal  @map("balance_after") @db.Decimal(36, 18)
  sourceType   String   @map("source_type")
  sourceId     String   @map("source_id")
  orderId      String?  @map("order_id")
  status       String   @default("normal")
  createdAt    DateTime @default(now()) @map("created_at")
  metadata     Json?

  @@index([userId])
  @@index([powerType])
  @@index([sourceType, sourceId])
  @@map("eco_power_ledgers")
}
```



## 2\.4 EcoPowerSnapshot



```Plain Text
model EcoPowerSnapshot {
  id             String   @id
  snapshotNo     String   @unique @map("snapshot_no")
  snapshotPeriod String   @map("snapshot_period")
  snapshotType   String   @map("snapshot_type")
  totalUsers     Int      @default(0) @map("total_users")
  totalRawPower   Decimal  @default(0) @map("total_raw_power") @db.Decimal(36, 18)
  totalEffectivePower Decimal @default(0) @map("total_effective_power") @db.Decimal(36, 18)
  ruleVersion    String?  @map("rule_version")
  status         String   @default("created")
  createdBy      String?  @map("created_by")
  createdAt      DateTime @default(now()) @map("created_at")
  metadata       Json?

  @@index([snapshotPeriod])
  @@map("eco_power_snapshots")
}
```



---



# 3\. Power Events



`apps/eco-power-service/src/shared/power-events.ts`



```TypeScript
export const PowerEvents = {
  POWER_GRANTED: 'power.granted.v1',
  POWER_ADJUSTED: 'power.adjusted.v1',
  POWER_FROZEN: 'power.frozen.v1',
  POWER_UNFROZEN: 'power.unfrozen.v1',
  POWER_SNAPSHOT_CREATED: 'power.snapshot_created.v1'
} as const;
```



---



# 4\. Power Errors



`apps/eco-power-service/src/shared/power-errors.ts`



```TypeScript
export const PowerErrors = {
  POWER_ACCOUNT_NOT_FOUND: 'POWER_ACCOUNT_NOT_FOUND',
  POWER_AMOUNT_INVALID: 'POWER_AMOUNT_INVALID',
  POWER_INSUFFICIENT_BALANCE: 'POWER_INSUFFICIENT_BALANCE',
  POWER_STATUS_INVALID: 'POWER_STATUS_INVALID',
  POWER_RULE_NOT_FOUND: 'POWER_RULE_NOT_FOUND',
  POWER_SNAPSHOT_NOT_FOUND: 'POWER_SNAPSHOT_NOT_FOUND',
  POWER_ALREADY_EXISTS: 'POWER_ALREADY_EXISTS'
} as const;
```



---



# 5\. Power Status



`apps/eco-power-service/src/shared/power-status.ts`



```TypeScript
export const PowerAccountStatus = {
  ACTIVE: 'active',
  FROZEN: 'frozen',
  RESTRICTED: 'restricted',
  CLOSED: 'closed'
} as const;

export const PowerLedgerTypes = {
  EARN: 'earn',
  ADJUST_ADD: 'adjust_add',
  ADJUST_SUBTRACT: 'adjust_subtract',
  FREEZE: 'freeze',
  UNFREEZE: 'unfreeze',
  EXPIRE: 'expire',
  REVOKE: 'revoke'
} as const;

export const SnapshotStatus = {
  CREATED: 'created',
  PROCESSING: 'processing',
  READY: 'ready',
  FAILED: 'failed'
} as const;
```



---



# 6\. Power Types



`apps/eco-power-service/src/shared/power-types.ts`



```TypeScript
export const PowerTypes = {
  BASE: 'base',
  CONSUMPTION: 'consumption',
  NFT: 'nft',
  MALL: 'mall',
  TFJ369_HOLDING: 'tfj369_holding',
  TFJ369_LOCK: 'tfj369_lock',
  NODE_SERVICE: 'node_service',
  OTHER: 'other'
} as const;
```



---



# 7\. DTO：QueryMyPowerDto



`apps/eco-power-service/src/modules/accounts/dto/query-my-power.dto.ts`



```TypeScript
import { IsString } from 'class-validator';

export class QueryMyPowerDto {
  @IsString()
  user_id!: string;
}
```



---



# 8\. DTO：QueryPowerLedgersDto



`apps/eco-power-service/src/modules/accounts/dto/query-power-ledgers.dto.ts`



```TypeScript
import { IsOptional, IsString } from 'class-validator';

export class QueryPowerLedgersDto {
  @IsOptional()
  @IsString()
  user_id?: string;

  @IsOptional()
  @IsString()
  power_type?: string;

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



# 9\. DTO：AdjustPowerDto



`apps/eco-power-service/src/modules/accounts/dto/adjust-power.dto.ts`



```TypeScript
import { IsOptional, IsString } from 'class-validator';

export class AdjustPowerDto {
  @IsString()
  user_id!: string;

  @IsString()
  power_type!: string;

  @IsString()
  change_type!: string;

  @IsString()
  amount!: string;

  @IsString()
  reason!: string;

  @IsOptional()
  @IsString()
  source_type?: string;

  @IsOptional()
  @IsString()
  source_id?: string;

  @IsOptional()
  @IsString()
  approval_id?: string;
}
```



---



# 10\. DTO：FreezePowerDto



`apps/eco-power-service/src/modules/accounts/dto/freeze-power.dto.ts`



```TypeScript
import { IsString } from 'class-validator';

export class FreezePowerDto {
  @IsString()
  user_id!: string;

  @IsString()
  amount!: string;

  @IsString()
  reason!: string;

  @IsString()
  approval_id!: string;
}
```



---



# 11\. DTO：CreateSnapshotDto



`apps/eco-power-service/src/modules/snapshots/dto/create-snapshot.dto.ts`



```TypeScript
import { IsString } from 'class-validator';

export class CreateSnapshotDto {
  @IsString()
  snapshot_period!: string;

  @IsString()
  snapshot_type!: string;

  @IsString()
  reason!: string;

  @IsOptional()
  @IsString()
  created_by?: string;
}
```



---



# 12\. DTO：CreatePowerRuleDto



`apps/eco-power-service/src/modules/rules/dto/create-power-rule.dto.ts`



```TypeScript
import { IsOptional, IsString } from 'class-validator';

export class CreatePowerRuleDto {
  @IsString()
  rule_code!: string;

  @IsString()
  rule_version!: string;

  @IsString()
  rule_type!: string;

  @IsOptional()
  @IsString()
  base_power?: string;

  @IsOptional()
  @IsString()
  consumption_rate?: string;

  @IsOptional()
  @IsString()
  nft_rate?: string;

  @IsOptional()
  @IsString()
  mall_rate?: string;

  @IsOptional()
  @IsString()
  tfj369_holding_rate?: string;

  @IsOptional()
  @IsString()
  tfj369_lock_rate?: string;

  @IsOptional()
  @IsString()
  member_multiplier?: string;

  @IsOptional()
  @IsString()
  activity_multiplier?: string;

  @IsOptional()
  @IsString()
  risk_coefficient?: string;

  @IsOptional()
  @IsString()
  effective_from?: string;

  @IsOptional()
  @IsString()
  effective_to?: string;
}
```



---



# 13\. Accounts Repository



`apps/eco-power-service/src/modules/accounts/accounts.repository.ts`



```TypeScript
import { Injectable } from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';
import { ulid } from 'ulid';

const prisma = new PrismaClient();

@Injectable()
export class AccountsRepository {
  findByUserId(userId: string) {
    return prisma.ecoPowerAccount.findUnique({
      where: { userId }
    });
  }

  upsertAccount(data: {
    userId: string;
    basePower?: string;
    consumptionPower?: string;
    nftPower?: string;
    mallPower?: string;
    tfj369HoldingPower?: string;
    tfj369LockPower?: string;
    nodeServicePower?: string;
    otherPower?: string;
    memberMultiplier?: string;
    activityMultiplier?: string;
    riskCoefficient?: string;
  }) {
    const base = new Prisma.Decimal(data.basePower || '0');
    const consumption = new Prisma.Decimal(data.consumptionPower || '0');
    const nft = new Prisma.Decimal(data.nftPower || '0');
    const mall = new Prisma.Decimal(data.mallPower || '0');
    const holding = new Prisma.Decimal(data.tfj369HoldingPower || '0');
    const lock = new Prisma.Decimal(data.tfj369LockPower || '0');
    const node = new Prisma.Decimal(data.nodeServicePower || '0');
    const other = new Prisma.Decimal(data.otherPower || '0');

    const totalRaw = base.add(consumption).add(nft).add(mall).add(holding).add(lock).add(node).add(other);
    const memberMultiplier = new Prisma.Decimal(data.memberMultiplier || '1');
    const activityMultiplier = new Prisma.Decimal(data.activityMultiplier || '1');
    const riskCoefficient = new Prisma.Decimal(data.riskCoefficient || '1');
    const effective = totalRaw.mul(memberMultiplier).mul(activityMultiplier).mul(riskCoefficient);

    return prisma.ecoPowerAccount.upsert({
      where: { userId: data.userId },
      create: {
        id: ulid(),
        userId: data.userId,
        basePower: base,
        consumptionPower: consumption,
        nftPower: nft,
        mallPower: mall,
        tfj369HoldingPower: holding,
        tfj369LockPower: lock,
        nodeServicePower: node,
        otherPower: other,
        totalRawPower: totalRaw,
        memberMultiplier,
        activityMultiplier,
        riskCoefficient,
        effectivePower: effective,
        accountStatus: 'active'
      },
      update: {
        basePower: base,
        consumptionPower: consumption,
        nftPower: nft,
        mallPower: mall,
        tfj369HoldingPower: holding,
        tfj369LockPower: lock,
        nodeServicePower: node,
        otherPower: other,
        totalRawPower: totalRaw,
        memberMultiplier,
        activityMultiplier,
        riskCoefficient,
        effectivePower: effective
      }
    });
  }

  createLedger(data: {
    ledgerNo: string;
    userId: string;
    powerType: string;
    changeType: string;
    amount: string;
    balanceBefore: string;
    balanceAfter: string;
    sourceType: string;
    sourceId: string;
    orderId?: string;
  }) {
    return prisma.ecoPowerLedger.create({
      data: {
        id: ulid(),
        ledgerNo: data.ledgerNo,
        userId: data.userId,
        powerType: data.powerType,
        changeType: data.changeType,
        amount: new Prisma.Decimal(data.amount),
        balanceBefore: new Prisma.Decimal(data.balanceBefore),
        balanceAfter: new Prisma.Decimal(data.balanceAfter),
        sourceType: data.sourceType,
        sourceId: data.sourceId,
        orderId: data.orderId,
        status: 'normal'
      }
    });
  }

  findLedgers(params: {
    userId?: string;
    powerType?: string;
    changeType?: string;
    sourceType?: string;
    sourceId?: string;
    page: number;
    pageSize: number;
  }) {
    return prisma.ecoPowerLedger.findMany({
      where: {
        userId: params.userId,
        powerType: params.powerType,
        changeType: params.changeType,
        sourceType: params.sourceType,
        sourceId: params.sourceId
      },
      orderBy: { createdAt: 'desc' },
      skip: (params.page - 1) * params.pageSize,
      take: params.pageSize
    });
  }

  countLedgers(params: {
    userId?: string;
    powerType?: string;
    changeType?: string;
    sourceType?: string;
    sourceId?: string;
  }) {
    return prisma.ecoPowerLedger.count({
      where: {
        userId: params.userId,
        powerType: params.powerType,
        changeType: params.changeType,
        sourceType: params.sourceType,
        sourceId: params.sourceId
      }
    });
  }
}
```



---



# 14\. Accounts Service



`apps/eco-power-service/src/modules/accounts/accounts.service.ts`



```TypeScript
import { Injectable } from '@nestjs/common';
import Decimal from 'decimal.js';
import { ulid } from 'ulid';
import { AccountsRepository } from './accounts.repository';
import { QueryMyPowerDto } from './dto/query-my-power.dto';
import { QueryPowerLedgersDto } from './dto/query-power-ledgers.dto';
import { AdjustPowerDto } from './dto/adjust-power.dto';
import { FreezePowerDto } from './dto/freeze-power.dto';
import { PowerErrors } from '../../shared/power-errors';

@Injectable()
export class AccountsService {
  constructor(private readonly accountsRepository: AccountsRepository) {}

  async getMyPower(dto: QueryMyPowerDto) {
    const account = await this.accountsRepository.findByUserId(dto.user_id);

    if (!account) {
      return {
        user_id: dto.user_id,
        base_power: '0.000000000000000000',
        consumption_power: '0.000000000000000000',
        nft_power: '0.000000000000000000',
        mall_power: '0.000000000000000000',
        tfj369_holding_power: '0.000000000000000000',
        tfj369_lock_power: '0.000000000000000000',
        total_raw_power: '0.000000000000000000',
        member_multiplier: '1.000000000000000000',
        activity_multiplier: '1.000000000000000000',
        risk_coefficient: '1.000000000000000000',
        effective_power: '0.000000000000000000'
      };
    }

    return this.formatAccount(account);
  }

  async adjust(dto: AdjustPowerDto) {
    this.assertPositive(dto.amount);

    const account = await this.accountsRepository.findByUserId(dto.user_id);

    const updated = await this.accountsRepository.upsertAccount({
      userId: dto.user_id,
      basePower: account?.basePower.toString() || '0',
      consumptionPower: account?.consumptionPower.toString() || '0',
      nftPower: account?.nftPower.toString() || '0',
      mallPower: account?.mallPower.toString() || '0',
      tfj369HoldingPower: account?.tfj369HoldingPower.toString() || '0',
      tfj369LockPower: account?.tfj369LockPower.toString() || '0',
      nodeServicePower: account?.nodeServicePower.toString() || '0',
      otherPower: account?.otherPower.toString() || '0',
      memberMultiplier: account?.memberMultiplier.toString() || '1',
      activityMultiplier: account?.activityMultiplier.toString() || '1',
      riskCoefficient: account?.riskCoefficient.toString() || '1'
    });

    const balanceBefore = new Decimal(account?.effectivePower.toString() || '0');
    const delta = new Decimal(dto.amount);
    const balanceAfter = dto.change_type === 'adjust_subtract'
      ? balanceBefore.sub(delta)
      : balanceBefore.add(delta);

    const finalAccount = await this.accountsRepository.upsertAccount({
      userId: dto.user_id,
      basePower: updated.basePower.toString(),
      consumptionPower: updated.consumptionPower.toString(),
      nftPower: updated.nftPower.toString(),
      mallPower: updated.mallPower.toString(),
      tfj369HoldingPower: updated.tfj369HoldingPower.toString(),
      tfj369LockPower: updated.tfj369LockPower.toString(),
      nodeServicePower: updated.nodeServicePower.toString(),
      otherPower: updated.otherPower.toString(),
      memberMultiplier: updated.memberMultiplier.toString(),
      activityMultiplier: updated.activityMultiplier.toString(),
      riskCoefficient: updated.riskCoefficient.toString()
    });

    await this.accountsRepository.createLedger({
      ledgerNo: this.generateLedgerNo(),
      userId: dto.user_id,
      powerType: dto.power_type,
      changeType: dto.change_type,
      amount: delta.toFixed(18),
      balanceBefore: balanceBefore.toFixed(18),
      balanceAfter: balanceAfter.toFixed(18),
      sourceType: dto.source_type || 'manual_adjustment',
      sourceId: dto.source_id || ulid(),
      orderId: undefined
    });

    return {
      user_id: dto.user_id,
      power_type: dto.power_type,
      change_type: dto.change_type,
      amount: delta.toFixed(18),
      effective_power: finalAccount.effectivePower.toString()
    };
  }

  async freeze(dto: FreezePowerDto) {
    const account = await this.accountsRepository.findByUserId(dto.user_id);
    if (!account) {
      throw new Error(PowerErrors.POWER_ACCOUNT_NOT_FOUND);
    }

    await this.accountsRepository.upsertAccount({
      userId: dto.user_id,
      basePower: account.basePower.toString(),
      consumptionPower: account.consumptionPower.toString(),
      nftPower: account.nftPower.toString(),
      mallPower: account.mallPower.toString(),
      tfj369HoldingPower: account.tfj369HoldingPower.toString(),
      tfj369LockPower: account.tfj369LockPower.toString(),
      nodeServicePower: account.nodeServicePower.toString(),
      otherPower: account.otherPower.toString(),
      memberMultiplier: account.memberMultiplier.toString(),
      activityMultiplier: account.activityMultiplier.toString(),
      riskCoefficient: '0'
    });

    return {
      user_id: dto.user_id,
      freeze_amount: new Decimal(dto.amount).toFixed(18),
      status: 'frozen',
      reason: dto.reason,
      approval_id: dto.approval_id
    };
  }

  async listLedgers(query: QueryPowerLedgersDto) {
    const page = Number(query.page || 1);
    const pageSize = Math.min(Number(query.page_size || 20), 100);

    const [items, total] = await Promise.all([
      this.accountsRepository.findLedgers({
        userId: query.user_id,
        powerType: query.power_type,
        changeType: query.change_type,
        sourceType: query.source_type,
        sourceId: query.source_id,
        page,
        pageSize
      }),
      this.accountsRepository.countLedgers({
        userId: query.user_id,
        powerType: query.power_type,
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
        power_type: item.powerType,
        change_type: item.changeType,
        amount: item.amount.toString(),
        balance_before: item.balanceBefore.toString(),
        balance_after: item.balanceAfter.toString(),
        source_type: item.sourceType,
        source_id: item.sourceId,
        order_id: item.orderId,
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

  private assertPositive(amount: string) {
    if (new Decimal(amount).lte(0)) {
      throw new Error(PowerErrors.POWER_AMOUNT_INVALID);
    }
  }

  private formatAccount(account: any) {
    return {
      user_id: account.userId,
      base_power: account.basePower.toString(),
      consumption_power: account.consumptionPower.toString(),
      nft_power: account.nftPower.toString(),
      mall_power: account.mallPower.toString(),
      tfj369_holding_power: account.tfj369HoldingPower.toString(),
      tfj369_lock_power: account.tfj369LockPower.toString(),
      node_service_power: account.nodeServicePower.toString(),
      other_power: account.otherPower.toString(),
      total_raw_power: account.totalRawPower.toString(),
      member_multiplier: account.memberMultiplier.toString(),
      activity_multiplier: account.activityMultiplier.toString(),
      risk_coefficient: account.riskCoefficient.toString(),
      effective_power: account.effectivePower.toString(),
      account_status: account.accountStatus
    };
  }

  private generateLedgerNo() {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    return `PWR${date}${ulid()}`;
  }
}
```



---



# 15\. Accounts Controllers



`apps/eco-power-service/src/modules/accounts/accounts.controller.ts`



```TypeScript
import { Controller, Get, Param, Query } from '@nestjs/common';
import { AccountsService } from './accounts.service';
import { QueryMyPowerDto } from './dto/query-my-power.dto';
import { QueryPowerLedgersDto } from './dto/query-power-ledgers.dto';

@Controller('power')
export class AccountsController {
  constructor(private readonly accountsService: AccountsService) {}

  @Get('my')
  getMyPower(@Query() query: QueryMyPowerDto) {
    return this.accountsService.getMyPower(query);
  }

  @Get('ledgers')
  listLedgers(@Query() query: QueryPowerLedgersDto) {
    return this.accountsService.listLedgers(query);
  }
}
```



`apps/eco-power-service/src/modules/accounts/accounts.admin.controller.ts`



```TypeScript
import { Body, Controller, Post } from '@nestjs/common';
import { AccountsService } from './accounts.service';
import { AdjustPowerDto } from './dto/adjust-power.dto';
import { FreezePowerDto } from './dto/freeze-power.dto';

@Controller('admin/power')
export class AccountsAdminController {
  constructor(private readonly accountsService: AccountsService) {}

  @Post('adjust')
  adjust(@Body() dto: AdjustPowerDto) {
    return this.accountsService.adjust(dto);
  }

  @Post('freeze')
  freeze(@Body() dto: FreezePowerDto) {
    return this.accountsService.freeze(dto);
  }
}
```



`apps/eco-power-service/src/modules/accounts/accounts.module.ts`



```TypeScript
import { Module } from '@nestjs/common';
import { AccountsController } from './accounts.controller';
import { AccountsAdminController } from './accounts.admin.controller';
import { AccountsService } from './accounts.service';
import { AccountsRepository } from './accounts.repository';

@Module({
  controllers: [AccountsController, AccountsAdminController],
  providers: [AccountsService, AccountsRepository],
  exports: [AccountsService]
})
export class AccountsModule {}
```



---



# 16\. Snapshots Repository



`apps/eco-power-service/src/modules/snapshots/snapshots.repository.ts`



```TypeScript
import { Injectable } from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';
import { ulid } from 'ulid';

const prisma = new PrismaClient();

@Injectable()
export class SnapshotsRepository {
  create(data: {
    snapshotNo: string;
    snapshotPeriod: string;
    snapshotType: string;
    reason: string;
    createdBy?: string;
  }) {
    return prisma.ecoPowerSnapshot.create({
      data: {
        id: ulid(),
        snapshotNo: data.snapshotNo,
        snapshotPeriod: data.snapshotPeriod,
        snapshotType: data.snapshotType,
        status: 'created',
        createdBy: data.createdBy,
        metadata: {
          reason: data.reason
        }
      }
    });
  }

  findById(snapshotId: string) {
    return prisma.ecoPowerSnapshot.findUnique({
      where: { id: snapshotId }
    });
  }

  list(params: {
    snapshotPeriod?: string;
    snapshotType?: string;
    page: number;
    pageSize: number;
  }) {
    return prisma.ecoPowerSnapshot.findMany({
      where: {
        snapshotPeriod: params.snapshotPeriod,
        snapshotType: params.snapshotType
      },
      orderBy: { createdAt: 'desc' },
      skip: (params.page - 1) * params.pageSize,
      take: params.pageSize
    });
  }

  count(params: { snapshotPeriod?: string; snapshotType?: string }) {
    return prisma.ecoPowerSnapshot.count({
      where: {
        snapshotPeriod: params.snapshotPeriod,
        snapshotType: params.snapshotType
      }
    });
  }

  markReady(snapshotId: string, totalUsers: number, totalRawPower: string, totalEffectivePower: string) {
    return prisma.ecoPowerSnapshot.update({
      where: { id: snapshotId },
      data: {
        status: 'ready',
        totalUsers,
        totalRawPower: new Prisma.Decimal(totalRawPower),
        totalEffectivePower: new Prisma.Decimal(totalEffectivePower)
      }
    });
  }
}
```



---



# 17\. Snapshots Service



`apps/eco-power-service/src/modules/snapshots/snapshots.service.ts`



```TypeScript
import { Injectable } from '@nestjs/common';
import { ulid } from 'ulid';
import { SnapshotsRepository } from './snapshots.repository';
import { CreateSnapshotDto } from './dto/create-snapshot.dto';
import { SnapshotStatus } from '../../shared/power-status';

@Injectable()
export class SnapshotsService {
  constructor(private readonly snapshotsRepository: SnapshotsRepository) {}

  async create(dto: CreateSnapshotDto) {
    const snapshot = await this.snapshotsRepository.create({
      snapshotNo: this.generateSnapshotNo(),
      snapshotPeriod: dto.snapshot_period,
      snapshotType: dto.snapshot_type,
      reason: dto.reason,
      createdBy: dto.created_by
    });

    return {
      snapshot_id: snapshot.id,
      snapshot_no: snapshot.snapshotNo,
      snapshot_period: snapshot.snapshotPeriod,
      snapshot_type: snapshot.snapshotType,
      snapshot_status: snapshot.status
    };
  }

  async detail(snapshotId: string) {
    const snapshot = await this.snapshotsRepository.findById(snapshotId);
    if (!snapshot) {
      return {
        snapshot_id: snapshotId,
        snapshot_status: 'not_found'
      };
    }

    return {
      snapshot_id: snapshot.id,
      snapshot_no: snapshot.snapshotNo,
      snapshot_period: snapshot.snapshotPeriod,
      snapshot_type: snapshot.snapshotType,
      total_users: snapshot.totalUsers,
      total_raw_power: snapshot.totalRawPower.toString(),
      total_effective_power: snapshot.totalEffectivePower.toString(),
      snapshot_status: snapshot.status,
      created_by: snapshot.createdBy,
      created_at: snapshot.createdAt
    };
  }

  async list(query: {
    snapshot_period?: string;
    snapshot_type?: string;
    page?: number;
    page_size?: number;
  }) {
    const page = Number(query.page || 1);
    const pageSize = Math.min(Number(query.page_size || 20), 100);

    const [items, total] = await Promise.all([
      this.snapshotsRepository.list({
        snapshotPeriod: query.snapshot_period,
        snapshotType: query.snapshot_type,
        page,
        pageSize
      }),
      this.snapshotsRepository.count({
        snapshotPeriod: query.snapshot_period,
        snapshotType: query.snapshot_type
      })
    ]);

    return {
      items: items.map((item) => ({
        snapshot_id: item.id,
        snapshot_no: item.snapshotNo,
        snapshot_period: item.snapshotPeriod,
        snapshot_type: item.snapshotType,
        total_users: item.totalUsers,
        total_raw_power: item.totalRawPower.toString(),
        total_effective_power: item.totalEffectivePower.toString(),
        snapshot_status: item.status,
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

  private generateSnapshotNo() {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    return `PWS${date}${ulid()}`;
  }
}
```



---



# 18\. Snapshots Controllers



`apps/eco-power-service/src/modules/snapshots/snapshots.controller.ts`



```TypeScript
import { Controller, Get, Param, Query } from '@nestjs/common';
import { SnapshotsService } from './snapshots.service';

@Controller('power/snapshots')
export class SnapshotsController {
  constructor(private readonly snapshotsService: SnapshotsService) {}

  @Get()
  list(@Query() query: any) {
    return this.snapshotsService.list(query);
  }

  @Get(':snapshot_id')
  detail(@Param('snapshot_id') snapshotId: string) {
    return this.snapshotsService.detail(snapshotId);
  }
}
```



`apps/eco-power-service/src/modules/snapshots/snapshots.admin.controller.ts`



```TypeScript
import { Body, Controller, Post } from '@nestjs/common';
import { SnapshotsService } from './snapshots.service';
import { CreateSnapshotDto } from './dto/create-snapshot.dto';

@Controller('admin/power/snapshots')
export class SnapshotsAdminController {
  constructor(private readonly snapshotsService: SnapshotsService) {}

  @Post()
  create(@Body() dto: CreateSnapshotDto) {
    return this.snapshotsService.create(dto);
  }
}
```



`apps/eco-power-service/src/modules/snapshots/snapshots.module.ts`



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



# 19\. Rules Repository



`apps/eco-power-service/src/modules/rules/rules.repository.ts`



```TypeScript
import { Injectable } from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';
import { ulid } from 'ulid';

const prisma = new PrismaClient();

@Injectable()
export class RulesRepository {
  create(data: {
    ruleCode: string;
    ruleVersion: string;
    ruleType: string;
    basePower?: string;
    consumptionRate?: string;
    nftRate?: string;
    mallRate?: string;
    tfj369HoldingRate?: string;
    tfj369LockRate?: string;
    memberMultiplier?: string;
    activityMultiplier?: string;
    riskCoefficient?: string;
    effectiveFrom?: Date;
    effectiveTo?: Date;
  }) {
    return prisma.ecoPowerRule.create({
      data: {
        id: ulid(),
        ruleCode: data.ruleCode,
        ruleVersion: data.ruleVersion,
        ruleType: data.ruleType,
        basePower: data.basePower ? new Prisma.Decimal(data.basePower) : undefined,
        consumptionRate: data.consumptionRate ? new Prisma.Decimal(data.consumptionRate) : undefined,
        nftRate: data.nftRate ? new Prisma.Decimal(data.nftRate) : undefined,
        mallRate: data.mallRate ? new Prisma.Decimal(data.mallRate) : undefined,
        tfj369HoldingRate: data.tfj369HoldingRate ? new Prisma.Decimal(data.tfj369HoldingRate) : undefined,
        tfj369LockRate: data.tfj369LockRate ? new Prisma.Decimal(data.tfj369LockRate) : undefined,
        memberMultiplier: data.memberMultiplier ? new Prisma.Decimal(data.memberMultiplier) : undefined,
        activityMultiplier: data.activityMultiplier ? new Prisma.Decimal(data.activityMultiplier) : undefined,
        riskCoefficient: data.riskCoefficient ? new Prisma.Decimal(data.riskCoefficient) : undefined,
        effectiveFrom: data.effectiveFrom,
        effectiveTo: data.effectiveTo,
        status: 'active'
      }
    });
  }

  findByRuleCode(ruleCode: string, ruleVersion: string) {
    return prisma.ecoPowerRule.findUnique({
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



# 20\. Rules Service



`apps/eco-power-service/src/modules/rules/rules.service.ts`



```TypeScript
import { Injectable } from '@nestjs/common';
import { CreatePowerRuleDto } from './dto/create-power-rule.dto';
import { RulesRepository } from './rules.repository';

@Injectable()
export class RulesService {
  constructor(private readonly rulesRepository: RulesRepository) {}

  async create(dto: CreatePowerRuleDto) {
    const rule = await this.rulesRepository.create({
      ruleCode: dto.rule_code,
      ruleVersion: dto.rule_version,
      ruleType: dto.rule_type,
      basePower: dto.base_power,
      consumptionRate: dto.consumption_rate,
      nftRate: dto.nft_rate,
      mallRate: dto.mall_rate,
      tfj369HoldingRate: dto.tfj369_holding_rate,
      tfj369LockRate: dto.tfj369_lock_rate,
      memberMultiplier: dto.member_multiplier,
      activityMultiplier: dto.activity_multiplier,
      riskCoefficient: dto.risk_coefficient,
      effectiveFrom: dto.effective_from ? new Date(dto.effective_from) : undefined,
      effectiveTo: dto.effective_to ? new Date(dto.effective_to) : undefined
    });

    return {
      rule_id: rule.id,
      rule_code: rule.ruleCode,
      rule_version: rule.ruleVersion,
      rule_type: rule.ruleType,
      status: rule.status
    };
  }
}
```



---



# 21\. Rules Controller / Module



`apps/eco-power-service/src/modules/rules/rules.controller.ts`



```TypeScript
import { Body, Controller, Post } from '@nestjs/common';
import { RulesService } from './rules.service';
import { CreatePowerRuleDto } from './dto/create-power-rule.dto';

@Controller('admin/power/rules')
export class RulesController {
  constructor(private readonly rulesService: RulesService) {}

  @Post()
  create(@Body() dto: CreatePowerRuleDto) {
    return this.rulesService.create(dto);
  }
}
```



`apps/eco-power-service/src/modules/rules/rules.module.ts`



```TypeScript
import { Module } from '@nestjs/common';
import { RulesController } from './rules.controller';
import { RulesService } from './rules.service';
import { RulesRepository } from './rules.repository';

@Module({
  controllers: [RulesController],
  providers: [RulesService, RulesRepository],
  exports: [RulesService]
})
export class RulesModule {}
```



---



# 22\. Eco Power App Module



`apps/eco-power-service/src/app.module.ts`



```TypeScript
import { Module } from '@nestjs/common';
import { HealthModule } from './health/health.module';
import { AccountsModule } from './modules/accounts/accounts.module';
import { SnapshotsModule } from './modules/snapshots/snapshots.module';
import { RulesModule } from './modules/rules/rules.module';

@Module({
  imports: [
    HealthModule,
    AccountsModule,
    SnapshotsModule,
    RulesModule
  ]
})
export class AppModule {}
```



---



# 23\. Eco Power Service 当前 API



## 用户端



```HTTP
GET /api/v1/power/my
GET /api/v1/power/ledgers
GET /api/v1/power/snapshots
GET /api/v1/power/snapshots/:snapshot_id
```



## 后台端



```HTTP
POST /api/v1/admin/power/adjust
POST /api/v1/admin/power/freeze
POST /api/v1/admin/power/snapshots
POST /api/v1/admin/power/rules
```



---



# 24\. Eco Power 服务已具备能力



这一版完成后，Eco Power Service 支持：



```Plain Text
生态算力账户查询
生态算力流水查询
生态算力规则创建
算力调整
算力冻结
算力快照创建
算力快照列表
有效算力计算
会员倍率 / 活跃倍率 / 风控系数参与计算
```



---



# 25\. 还需要补强的工业级能力



下一步需要补：



```Plain Text
统一 AppException
PrismaModule 注入
真实算力来源读取
订单 / NFT / tFJ369 / 商城消费算力联动
快照批处理任务
总网算力汇总
审批流接入
Audit Log
Risk Check
幂等调整
冻结算力回滚
```



---



# 26\. 下一步继续



按 23 个 Service 顺序，下一步写：



```Plain Text
11. Release Service 释放服务
```



我可以下一条直接继续把 **Release Service** 的代码骨架写出来。

