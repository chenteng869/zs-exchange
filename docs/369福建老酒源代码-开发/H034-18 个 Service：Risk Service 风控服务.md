# H034\-18 个 Service：Risk Service 风控服务

下面继续第 18 个 Service：Risk Service 风控服务。



# 第 18 个 Service：Risk Service 风控服务



本服务负责：



```Plain Text
风险规则
风险评分
风控事件
风控案件
黑名单
设备指纹
用户 / 钱包 / 订单 / 支付风险检查
资产冻结建议
奖励追回建议
RiskDecisionCreated / RiskCaseCreated / BlacklistAdded 事件预留
```



---



# 1\. Risk Service 目录结构



```Plain Text
apps/risk-service/
├── src/
│   ├── app.module.ts
│   ├── main.ts
│   ├── health/
│   ├── shared/
│   │   ├── risk-errors.ts
│   │   ├── risk-events.ts
│   │   ├── risk-status.ts
│   │   └── risk-types.ts
│   └── modules/
│       ├── rules/
│       │   ├── rules.module.ts
│       │   ├── rules.controller.ts
│       │   ├── rules.admin.controller.ts
│       │   ├── rules.repository.ts
│       │   ├── rules.service.ts
│       │   └── dto/
│       │       ├── create-risk-rule.dto.ts
│       │       └── query-risk-rules.dto.ts
│       ├── decisions/
│       │   ├── decisions.module.ts
│       │   ├── decisions.controller.ts
│       │   ├── decisions.repository.ts
│       │   ├── decisions.service.ts
│       │   └── dto/
│       │       ├── evaluate-risk.dto.ts
│       │       └── query-risk-decisions.dto.ts
│       ├── cases/
│       │   ├── cases.module.ts
│       │   ├── cases.controller.ts
│       │   ├── cases.admin.controller.ts
│       │   ├── cases.repository.ts
│       │   ├── cases.service.ts
│       │   └── dto/
│       │       ├── create-risk-case.dto.ts
│       │       ├── assign-risk-case.dto.ts
│       │       ├── close-risk-case.dto.ts
│       │       └── query-risk-cases.dto.ts
│       ├── blacklist/
│       │   ├── blacklist.module.ts
│       │   ├── blacklist.controller.ts
│       │   ├── blacklist.admin.controller.ts
│       │   ├── blacklist.repository.ts
│       │   ├── blacklist.service.ts
│       │   └── dto/
│       │       ├── add-blacklist.dto.ts
│       │       └── query-blacklist.dto.ts
│       └── devices/
│           ├── devices.module.ts
│           ├── devices.controller.ts
│           ├── devices.repository.ts
│           ├── devices.service.ts
│           └── dto/
│               └── register-device.dto.ts
```



---



# 2\. Prisma 补充表



## 2\.1 RiskRule



```Plain Text
model RiskRule {
  id              String    @id
  ruleCode        String    @map("rule_code")
  ruleVersion     String    @map("rule_version")
  ruleName        String    @map("rule_name")
  riskType        String    @map("risk_type")
  targetType      String    @map("target_type")
  conditionJson   Json      @map("condition_json")
  score           Int       @default(0)
  decision        String
  priority        Int       @default(100)
  status          String    @default("active")
  effectiveFrom   DateTime? @map("effective_from")
  effectiveTo     DateTime? @map("effective_to")
  createdAt       DateTime  @default(now()) @map("created_at")
  updatedAt       DateTime  @updatedAt @map("updated_at")
  metadata        Json?

  @@unique([ruleCode, ruleVersion])
  @@index([riskType])
  @@index([targetType])
  @@index([status])
  @@map("risk_rules")
}
```



## 2\.2 RiskDecision



```Plain Text
model RiskDecision {
  id              String   @id
  decisionNo      String   @unique @map("decision_no")
  targetType      String   @map("target_type")
  targetId        String   @map("target_id")
  userId          String?  @map("user_id")
  riskType        String   @map("risk_type")
  totalScore      Int      @default(0) @map("total_score")
  decision        String
  matchedRules    Json?    @map("matched_rules")
  suggestion      String? 
  sourceType      String?  @map("source_type")
  sourceId        String?  @map("source_id")
  createdAt       DateTime @default(now()) @map("created_at")
  metadata        Json?

  @@index([targetType, targetId])
  @@index([userId])
  @@index([riskType])
  @@index([decision])
  @@map("risk_decisions")
}
```



## 2\.3 RiskCase



```Plain Text
model RiskCase {
  id              String    @id
  caseNo          String    @unique @map("case_no")
  caseType        String    @map("case_type")
  targetType      String    @map("target_type")
  targetId        String    @map("target_id")
  userId          String?   @map("user_id")
  riskLevel       String    @map("risk_level")
  caseStatus      String    @default("open") @map("case_status")
  decisionId      String?   @map("decision_id")
  assignedTo      String?   @map("assigned_to")
  resolution      String?
  openedAt        DateTime  @default(now()) @map("opened_at")
  assignedAt      DateTime? @map("assigned_at")
  closedAt        DateTime? @map("closed_at")
  createdAt       DateTime  @default(now()) @map("created_at")
  updatedAt       DateTime  @updatedAt @map("updated_at")
  metadata        Json?

  @@index([caseType])
  @@index([targetType, targetId])
  @@index([userId])
  @@index([caseStatus])
  @@map("risk_cases")
}
```



## 2\.4 RiskBlacklist



```Plain Text
model RiskBlacklist {
  id              String    @id
  blacklistNo     String    @unique @map("blacklist_no")
  targetType      String    @map("target_type")
  targetValue     String    @map("target_value")
  riskType        String    @map("risk_type")
  reason          String
  status          String    @default("active")
  sourceType      String?   @map("source_type")
  sourceId        String?   @map("source_id")
  createdBy       String?   @map("created_by")
  expiredAt       DateTime? @map("expired_at")
  createdAt       DateTime  @default(now()) @map("created_at")
  updatedAt       DateTime  @updatedAt @map("updated_at")
  metadata        Json?

  @@unique([targetType, targetValue, riskType])
  @@index([targetType])
  @@index([riskType])
  @@index([status])
  @@map("risk_blacklists")
}
```



## 2\.5 DeviceFingerprint



```Plain Text
model DeviceFingerprint {
  id              String   @id
  deviceId        String   @unique @map("device_id")
  userId          String?  @map("user_id")
  fingerprintHash String   @map("fingerprint_hash")
  ipAddress       String?  @map("ip_address")
  userAgent       String?  @map("user_agent")
  countryCode     String?  @map("country_code")
  deviceStatus    String   @default("normal") @map("device_status")
  firstSeenAt     DateTime @default(now()) @map("first_seen_at")
  lastSeenAt      DateTime @default(now()) @map("last_seen_at")
  createdAt       DateTime @default(now()) @map("created_at")
  updatedAt       DateTime @updatedAt @map("updated_at")
  metadata        Json?

  @@index([userId])
  @@index([fingerprintHash])
  @@index([deviceStatus])
  @@map("device_fingerprints")
}
```



---



# 3\. Shared 常量



`apps/risk-service/src/shared/risk-events.ts`



```TypeScript
export const RiskEvents = {
  RISK_RULE_CREATED: 'risk.rule_created.v1',
  RISK_DECISION_CREATED: 'risk.decision_created.v1',
  RISK_CASE_CREATED: 'risk.case_created.v1',
  RISK_CASE_ASSIGNED: 'risk.case_assigned.v1',
  RISK_CASE_CLOSED: 'risk.case_closed.v1',
  BLACKLIST_ADDED: 'risk.blacklist_added.v1',
  BLACKLIST_REMOVED: 'risk.blacklist_removed.v1',
  DEVICE_REGISTERED: 'risk.device_registered.v1'
} as const;
```



`apps/risk-service/src/shared/risk-errors.ts`



```TypeScript
export const RiskErrors = {
  RISK_RULE_NOT_FOUND: 'RISK_RULE_NOT_FOUND',
  RISK_RULE_ALREADY_EXISTS: 'RISK_RULE_ALREADY_EXISTS',
  RISK_DECISION_NOT_FOUND: 'RISK_DECISION_NOT_FOUND',
  RISK_CASE_NOT_FOUND: 'RISK_CASE_NOT_FOUND',
  RISK_CASE_STATUS_INVALID: 'RISK_CASE_STATUS_INVALID',
  BLACKLIST_ALREADY_EXISTS: 'RISK_BLACKLIST_ALREADY_EXISTS',
  BLACKLIST_NOT_FOUND: 'RISK_BLACKLIST_NOT_FOUND',
  DEVICE_NOT_FOUND: 'RISK_DEVICE_NOT_FOUND'
} as const;
```



`apps/risk-service/src/shared/risk-status.ts`



```TypeScript
export const RiskRuleStatus = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  ARCHIVED: 'archived'
} as const;

export const RiskDecisions = {
  PASS: 'pass',
  REVIEW: 'review',
  REJECT: 'reject',
  FREEZE: 'freeze',
  RECOVER: 'recover'
} as const;

export const RiskCaseStatus = {
  OPEN: 'open',
  ASSIGNED: 'assigned',
  INVESTIGATING: 'investigating',
  CLOSED: 'closed',
  CANCELLED: 'cancelled'
} as const;

export const BlacklistStatus = {
  ACTIVE: 'active',
  EXPIRED: 'expired',
  REMOVED: 'removed'
} as const;
```



`apps/risk-service/src/shared/risk-types.ts`



```TypeScript
export const RiskTypes = {
  USER: 'user',
  KYC: 'kyc',
  ORDER: 'order',
  PAYMENT: 'payment',
  WALLET: 'wallet',
  REWARD: 'reward',
  CONVERSION: 'conversion',
  TRADE: 'trade',
  DEVICE: 'device',
  TAX: 'tax'
} as const;

export const RiskTargetTypes = {
  USER: 'user',
  ORDER: 'order',
  PAYMENT: 'payment',
  WALLET: 'wallet',
  DEVICE: 'device',
  REWARD: 'reward',
  NFT: 'nft',
  NODE: 'node'
} as const;
```



---



# 4\. Rules DTO



`apps/risk-service/src/modules/rules/dto/create-risk-rule.dto.ts`



```TypeScript
import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreateRiskRuleDto {
  @IsString()
  rule_code!: string;

  @IsString()
  rule_version!: string;

  @IsString()
  rule_name!: string;

  @IsString()
  risk_type!: string;

  @IsString()
  target_type!: string;

  condition_json!: Record;

  @IsInt()
  score!: number;

  @IsString()
  decision!: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  priority?: number;

  @IsOptional()
  @IsString()
  effective_from?: string;

  @IsOptional()
  @IsString()
  effective_to?: string;
}
```



`apps/risk-service/src/modules/rules/dto/query-risk-rules.dto.ts`



```TypeScript
import { IsOptional, IsString } from 'class-validator';

export class QueryRiskRulesDto {
  @IsOptional()
  @IsString()
  risk_type?: string;

  @IsOptional()
  @IsString()
  target_type?: string;

  @IsOptional()
  @IsString()
  status?: string;
}
```



---



# 5\. Rules Repository / Service



`apps/risk-service/src/modules/rules/rules.repository.ts`



```TypeScript
import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { ulid } from 'ulid';

const prisma = new PrismaClient();

@Injectable()
export class RulesRepository {
  findByCode(ruleCode: string, ruleVersion: string) {
    return prisma.riskRule.findUnique({
      where: {
        ruleCode_ruleVersion: {
          ruleCode,
          ruleVersion
        }
      }
    });
  }

  findActive(params: { riskType?: string; targetType?: string }) {
    return prisma.riskRule.findMany({
      where: {
        riskType: params.riskType,
        targetType: params.targetType,
        status: 'active'
      },
      orderBy: [
        { priority: 'asc' },
        { createdAt: 'desc' }
      ]
    });
  }

  findMany(params: {
    riskType?: string;
    targetType?: string;
    status?: string;
  }) {
    return prisma.riskRule.findMany({
      where: {
        riskType: params.riskType,
        targetType: params.targetType,
        status: params.status
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  create(data: {
    ruleCode: string;
    ruleVersion: string;
    ruleName: string;
    riskType: string;
    targetType: string;
    conditionJson: Record;
    score: number;
    decision: string;
    priority: number;
    effectiveFrom?: Date;
    effectiveTo?: Date;
  }) {
    return prisma.$transaction(async (tx) => {
      const rule = await tx.riskRule.create({
        data: {
          id: ulid(),
          ruleCode: data.ruleCode,
          ruleVersion: data.ruleVersion,
          ruleName: data.ruleName,
          riskType: data.riskType,
          targetType: data.targetType,
          conditionJson: data.conditionJson,
          score: data.score,
          decision: data.decision,
          priority: data.priority,
          effectiveFrom: data.effectiveFrom,
          effectiveTo: data.effectiveTo,
          status: 'active'
        }
      });

      await tx.outboxEvent.create({
        data: {
          id: ulid(),
          eventType: 'risk.rule_created.v1',
          payload: {
            rule_id: rule.id,
            rule_code: rule.ruleCode,
            rule_version: rule.ruleVersion,
            risk_type: rule.riskType,
            target_type: rule.targetType,
            decision: rule.decision
          },
          status: 'pending',
          retryCount: 0
        }
      });

      return rule;
    });
  }
}
```



`apps/risk-service/src/modules/rules/rules.service.ts`



```TypeScript
import { Injectable } from '@nestjs/common';
import { RulesRepository } from './rules.repository';
import { CreateRiskRuleDto } from './dto/create-risk-rule.dto';
import { QueryRiskRulesDto } from './dto/query-risk-rules.dto';
import { RiskErrors } from '../../shared/risk-errors';

@Injectable()
export class RulesService {
  constructor(private readonly rulesRepository: RulesRepository) {}

  async create(dto: CreateRiskRuleDto) {
    const existing = await this.rulesRepository.findByCode(
      dto.rule_code,
      dto.rule_version
    );

    if (existing) {
      throw new Error(RiskErrors.RISK_RULE_ALREADY_EXISTS);
    }

    const rule = await this.rulesRepository.create({
      ruleCode: dto.rule_code,
      ruleVersion: dto.rule_version,
      ruleName: dto.rule_name,
      riskType: dto.risk_type,
      targetType: dto.target_type,
      conditionJson: dto.condition_json,
      score: dto.score,
      decision: dto.decision,
      priority: dto.priority ?? 100,
      effectiveFrom: dto.effective_from ? new Date(dto.effective_from) : undefined,
      effectiveTo: dto.effective_to ? new Date(dto.effective_to) : undefined
    });

    return this.formatRule(rule);
  }

  async list(query: QueryRiskRulesDto) {
    const items = await this.rulesRepository.findMany({
      riskType: query.risk_type,
      targetType: query.target_type,
      status: query.status
    });

    return {
      items: items.map((item) => this.formatRule(item))
    };
  }

  private formatRule(rule: any) {
    return {
      rule_id: rule.id,
      rule_code: rule.ruleCode,
      rule_version: rule.ruleVersion,
      rule_name: rule.ruleName,
      risk_type: rule.riskType,
      target_type: rule.targetType,
      score: rule.score,
      decision: rule.decision,
      priority: rule.priority,
      status: rule.status
    };
  }
}
```



---



# 6\. Rules Controllers / Module



`apps/risk-service/src/modules/rules/rules.controller.ts`



```TypeScript
import { Controller, Get, Query } from '@nestjs/common';
import { RulesService } from './rules.service';
import { QueryRiskRulesDto } from './dto/query-risk-rules.dto';

@Controller('risk/rules')
export class RulesController {
  constructor(private readonly rulesService: RulesService) {}

  @Get()
  list(@Query() query: QueryRiskRulesDto) {
    return this.rulesService.list(query);
  }
}
```



`apps/risk-service/src/modules/rules/rules.admin.controller.ts`



```TypeScript
import { Body, Controller, Post } from '@nestjs/common';
import { RulesService } from './rules.service';
import { CreateRiskRuleDto } from './dto/create-risk-rule.dto';

@Controller('admin/risk/rules')
export class RulesAdminController {
  constructor(private readonly rulesService: RulesService) {}

  @Post()
  create(@Body() dto: CreateRiskRuleDto) {
    return this.rulesService.create(dto);
  }
}
```



`apps/risk-service/src/modules/rules/rules.module.ts`



```TypeScript
import { Module } from '@nestjs/common';
import { RulesController } from './rules.controller';
import { RulesAdminController } from './rules.admin.controller';
import { RulesService } from './rules.service';
import { RulesRepository } from './rules.repository';

@Module({
  controllers: [RulesController, RulesAdminController],
  providers: [RulesService, RulesRepository],
  exports: [RulesService, RulesRepository]
})
export class RulesModule {}
```



---



# 7\. Decisions DTO



`apps/risk-service/src/modules/decisions/dto/evaluate-risk.dto.ts`



```TypeScript
import { IsOptional, IsString } from 'class-validator';

export class EvaluateRiskDto {
  @IsString()
  target_type!: string;

  @IsString()
  target_id!: string;

  @IsString()
  risk_type!: string;

  @IsOptional()
  @IsString()
  user_id?: string;

  @IsOptional()
  @IsString()
  source_type?: string;

  @IsOptional()
  @IsString()
  source_id?: string;

  payload?: Record;
}
```



`apps/risk-service/src/modules/decisions/dto/query-risk-decisions.dto.ts`



```TypeScript
import { IsOptional, IsString } from 'class-validator';

export class QueryRiskDecisionsDto {
  @IsOptional()
  @IsString()
  target_type?: string;

  @IsOptional()
  @IsString()
  target_id?: string;

  @IsOptional()
  @IsString()
  user_id?: string;

  @IsOptional()
  @IsString()
  decision?: string;

  @IsOptional()
  page?: number;

  @IsOptional()
  page_size?: number;
}
```



---



# 8\. Decisions Repository / Service



`apps/risk-service/src/modules/decisions/decisions.repository.ts`



```TypeScript
import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { ulid } from 'ulid';

const prisma = new PrismaClient();

@Injectable()
export class DecisionsRepository {
  findRules(riskType: string, targetType: string) {
    return prisma.riskRule.findMany({
      where: {
        riskType,
        targetType,
        status: 'active'
      },
      orderBy: [
        { priority: 'asc' },
        { createdAt: 'desc' }
      ]
    });
  }

  findBlacklist(params: {
    targetType: string;
    targetValue: string;
    riskType: string;
  }) {
    return prisma.riskBlacklist.findFirst({
      where: {
        targetType: params.targetType,
        targetValue: params.targetValue,
        riskType: params.riskType,
        status: 'active'
      }
    });
  }

  createDecision(data: {
    decisionNo: string;
    targetType: string;
    targetId: string;
    userId?: string;
    riskType: string;
    totalScore: number;
    decision: string;
    matchedRules: unknown[];
    suggestion?: string;
    sourceType?: string;
    sourceId?: string;
    payload?: Record;
  }) {
    return prisma.$transaction(async (tx) => {
      const decision = await tx.riskDecision.create({
        data: {
          id: ulid(),
          decisionNo: data.decisionNo,
          targetType: data.targetType,
          targetId: data.targetId,
          userId: data.userId,
          riskType: data.riskType,
          totalScore: data.totalScore,
          decision: data.decision,
          matchedRules: data.matchedRules,
          suggestion: data.suggestion,
          sourceType: data.sourceType,
          sourceId: data.sourceId,
          metadata: data.payload
        }
      });

      await tx.outboxEvent.create({
        data: {
          id: ulid(),
          eventType: 'risk.decision_created.v1',
          payload: {
            decision_id: decision.id,
            decision_no: decision.decisionNo,
            target_type: decision.targetType,
            target_id: decision.targetId,
            user_id: decision.userId,
            risk_type: decision.riskType,
            total_score: decision.totalScore,
            decision: decision.decision,
            suggestion: decision.suggestion
          },
          status: 'pending',
          retryCount: 0
        }
      });

      return decision;
    });
  }

  findMany(params: {
    targetType?: string;
    targetId?: string;
    userId?: string;
    decision?: string;
    page: number;
    pageSize: number;
  }) {
    return prisma.riskDecision.findMany({
      where: {
        targetType: params.targetType,
        targetId: params.targetId,
        userId: params.userId,
        decision: params.decision
      },
      orderBy: { createdAt: 'desc' },
      skip: (params.page - 1) * params.pageSize,
      take: params.pageSize
    });
  }

  count(params: {
    targetType?: string;
    targetId?: string;
    userId?: string;
    decision?: string;
  }) {
    return prisma.riskDecision.count({
      where: {
        targetType: params.targetType,
        targetId: params.targetId,
        userId: params.userId,
        decision: params.decision
      }
    });
  }
}
```



`apps/risk-service/src/modules/decisions/decisions.service.ts`



```TypeScript
import { Injectable } from '@nestjs/common';
import { ulid } from 'ulid';
import { DecisionsRepository } from './decisions.repository';
import { EvaluateRiskDto } from './dto/evaluate-risk.dto';
import { QueryRiskDecisionsDto } from './dto/query-risk-decisions.dto';
import { RiskDecisions } from '../../shared/risk-status';

@Injectable()
export class DecisionsService {
  constructor(private readonly decisionsRepository: DecisionsRepository) {}

  async evaluate(dto: EvaluateRiskDto) {
    const rules = await this.decisionsRepository.findRules(
      dto.risk_type,
      dto.target_type
    );

    const blacklist = await this.decisionsRepository.findBlacklist({
      targetType: dto.target_type,
      targetValue: dto.target_id,
      riskType: dto.risk_type
    });

    const matchedRules = [];
    let totalScore = 0;
    let decision = RiskDecisions.PASS;
    let suggestion = 'allow';

    if (blacklist) {
      totalScore += 100;
      decision = RiskDecisions.REJECT;
      suggestion = 'blacklisted';
      matchedRules.push({
        type: 'blacklist',
        blacklist_id: blacklist.id,
        reason: blacklist.reason
      });
    }

    for (const rule of rules) {
      const matched = this.matchRule(rule.conditionJson as any, dto.payload || {});
      if (!matched) continue;

      totalScore += rule.score;
      matchedRules.push({
        rule_id: rule.id,
        rule_code: rule.ruleCode,
        score: rule.score,
        decision: rule.decision
      });

      decision = this.pickHigherDecision(decision, rule.decision);
    }

    if (decision === RiskDecisions.PASS && totalScore >= 80) {
      decision = RiskDecisions.REVIEW;
      suggestion = 'manual_review';
    }

    if (decision === RiskDecisions.PASS && totalScore >= 100) {
      decision = RiskDecisions.REJECT;
      suggestion = 'reject';
    }

    const riskDecision = await this.decisionsRepository.createDecision({
      decisionNo: this.generateDecisionNo(),
      targetType: dto.target_type,
      targetId: dto.target_id,
      userId: dto.user_id,
      riskType: dto.risk_type,
      totalScore,
      decision,
      matchedRules,
      suggestion,
      sourceType: dto.source_type,
      sourceId: dto.source_id,
      payload: dto.payload
    });

    return this.formatDecision(riskDecision);
  }

  async list(query: QueryRiskDecisionsDto) {
    const page = Number(query.page || 1);
    const pageSize = Math.min(Number(query.page_size || 20), 100);

    const [items, total] = await Promise.all([
      this.decisionsRepository.findMany({
        targetType: query.target_type,
        targetId: query.target_id,
        userId: query.user_id,
        decision: query.decision,
        page,
        pageSize
      }),
      this.decisionsRepository.count({
        targetType: query.target_type,
        targetId: query.target_id,
        userId: query.user_id,
        decision: query.decision
      })
    ]);

    return {
      items: items.map((item) => this.formatDecision(item)),
      pagination: {
        page,
        page_size: pageSize,
        total,
        total_pages: Math.ceil(total / pageSize)
      }
    };
  }

  private matchRule(condition: Record, payload: Record) {
    // 第一版只支持简单 equals 条件；后续接规则表达式引擎。
    const equals = condition.equals as Record | undefined;
    if (!equals) return false;

    return Object.entries(equals).every(([key, value]) => payload[key] === value);
  }

  private pickHigherDecision(current: string, next: string) {
    const weight: Record = {
      pass: 1,
      review: 2,
      freeze: 3,
      recover: 4,
      reject: 5
    };

    return (weight[next] || 0) > (weight[current] || 0) ? next : current;
  }

  private formatDecision(decision: any) {
    return {
      decision_id: decision.id,
      decision_no: decision.decisionNo,
      target_type: decision.targetType,
      target_id: decision.targetId,
      user_id: decision.userId,
      risk_type: decision.riskType,
      total_score: decision.totalScore,
      decision: decision.decision,
      suggestion: decision.suggestion,
      matched_rules: decision.matchedRules,
      source_type: decision.sourceType,
      source_id: decision.sourceId,
      created_at: decision.createdAt
    };
  }

  private generateDecisionNo() {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    return `RDC${date}${ulid()}`;
  }
}
```



---



# 9\. Decisions Controllers / Module



`apps/risk-service/src/modules/decisions/decisions.controller.ts`



```TypeScript
import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { DecisionsService } from './decisions.service';
import { EvaluateRiskDto } from './dto/evaluate-risk.dto';
import { QueryRiskDecisionsDto } from './dto/query-risk-decisions.dto';

@Controller('risk/decisions')
export class DecisionsController {
  constructor(private readonly decisionsService: DecisionsService) {}

  @Post('evaluate')
  evaluate(@Body() dto: EvaluateRiskDto) {
    return this.decisionsService.evaluate(dto);
  }

  @Get()
  list(@Query() query: QueryRiskDecisionsDto) {
    return this.decisionsService.list(query);
  }
}
```



`apps/risk-service/src/modules/decisions/decisions.module.ts`



```TypeScript
import { Module } from '@nestjs/common';
import { DecisionsController } from './decisions.controller';
import { DecisionsService } from './decisions.service';
import { DecisionsRepository } from './decisions.repository';

@Module({
  controllers: [DecisionsController],
  providers: [DecisionsService, DecisionsRepository],
  exports: [DecisionsService]
})
export class DecisionsModule {}
```



---



# 10\. Cases DTO / Repository / Service



`apps/risk-service/src/modules/cases/dto/create-risk-case.dto.ts`



```TypeScript
import { IsOptional, IsString } from 'class-validator';

export class CreateRiskCaseDto {
  @IsString()
  case_type!: string;

  @IsString()
  target_type!: string;

  @IsString()
  target_id!: string;

  @IsOptional()
  @IsString()
  user_id?: string;

  @IsString()
  risk_level!: string;

  @IsOptional()
  @IsString()
  decision_id?: string;

  @IsOptional()
  metadata?: Record;
}
```



`apps/risk-service/src/modules/cases/dto/assign-risk-case.dto.ts`



```TypeScript
import { IsString } from 'class-validator';

export class AssignRiskCaseDto {
  @IsString()
  assigned_to!: string;
}
```



`apps/risk-service/src/modules/cases/dto/close-risk-case.dto.ts`



```TypeScript
import { IsString } from 'class-validator';

export class CloseRiskCaseDto {
  @IsString()
  resolution!: string;
}
```



`apps/risk-service/src/modules/cases/dto/query-risk-cases.dto.ts`



```TypeScript
import { IsOptional, IsString } from 'class-validator';

export class QueryRiskCasesDto {
  @IsOptional()
  @IsString()
  case_type?: string;

  @IsOptional()
  @IsString()
  user_id?: string;

  @IsOptional()
  @IsString()
  case_status?: string;

  @IsOptional()
  @IsString()
  assigned_to?: string;

  @IsOptional()
  page?: number;

  @IsOptional()
  page_size?: number;
}
```



`apps/risk-service/src/modules/cases/cases.repository.ts`



```TypeScript
import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { ulid } from 'ulid';

const prisma = new PrismaClient();

@Injectable()
export class CasesRepository {
  findById(caseId: string) {
    return prisma.riskCase.findUnique({
      where: { id: caseId }
    });
  }

  create(data: {
    caseNo: string;
    caseType: string;
    targetType: string;
    targetId: string;
    userId?: string;
    riskLevel: string;
    decisionId?: string;
    metadata?: Record;
  }) {
    return prisma.$transaction(async (tx) => {
      const riskCase = await tx.riskCase.create({
        data: {
          id: ulid(),
          caseNo: data.caseNo,
          caseType: data.caseType,
          targetType: data.targetType,
          targetId: data.targetId,
          userId: data.userId,
          riskLevel: data.riskLevel,
          decisionId: data.decisionId,
          caseStatus: 'open',
          metadata: data.metadata
        }
      });

      await tx.outboxEvent.create({
        data: {
          id: ulid(),
          eventType: 'risk.case_created.v1',
          payload: {
            case_id: riskCase.id,
            case_no: riskCase.caseNo,
            case_type: riskCase.caseType,
            target_type: riskCase.targetType,
            target_id: riskCase.targetId,
            risk_level: riskCase.riskLevel
          },
          status: 'pending',
          retryCount: 0
        }
      });

      return riskCase;
    });
  }

  assign(caseId: string, assignedTo: string) {
    return prisma.riskCase.update({
      where: { id: caseId },
      data: {
        caseStatus: 'assigned',
        assignedTo,
        assignedAt: new Date()
      }
    });
  }

  close(caseId: string, resolution: string) {
    return prisma.riskCase.update({
      where: { id: caseId },
      data: {
        caseStatus: 'closed',
        resolution,
        closedAt: new Date()
      }
    });
  }

  findMany(params: {
    caseType?: string;
    userId?: string;
    caseStatus?: string;
    assignedTo?: string;
    page: number;
    pageSize: number;
  }) {
    return prisma.riskCase.findMany({
      where: {
        caseType: params.caseType,
        userId: params.userId,
        caseStatus: params.caseStatus,
        assignedTo: params.assignedTo
      },
      orderBy: { createdAt: 'desc' },
      skip: (params.page - 1) * params.pageSize,
      take: params.pageSize
    });
  }

  count(params: {
    caseType?: string;
    userId?: string;
    caseStatus?: string;
    assignedTo?: string;
  }) {
    return prisma.riskCase.count({
      where: {
        caseType: params.caseType,
        userId: params.userId,
        caseStatus: params.caseStatus,
        assignedTo: params.assignedTo
      }
    });
  }
}
```



`apps/risk-service/src/modules/cases/cases.service.ts`



```TypeScript
import { Injectable } from '@nestjs/common';
import { ulid } from 'ulid';
import { CasesRepository } from './cases.repository';
import { CreateRiskCaseDto } from './dto/create-risk-case.dto';
import { AssignRiskCaseDto } from './dto/assign-risk-case.dto';
import { CloseRiskCaseDto } from './dto/close-risk-case.dto';
import { QueryRiskCasesDto } from './dto/query-risk-cases.dto';
import { RiskErrors } from '../../shared/risk-errors';
import { RiskCaseStatus } from '../../shared/risk-status';

@Injectable()
export class CasesService {
  constructor(private readonly casesRepository: CasesRepository) {}

  async create(dto: CreateRiskCaseDto) {
    const riskCase = await this.casesRepository.create({
      caseNo: this.generateCaseNo(),
      caseType: dto.case_type,
      targetType: dto.target_type,
      targetId: dto.target_id,
      userId: dto.user_id,
      riskLevel: dto.risk_level,
      decisionId: dto.decision_id,
      metadata: dto.metadata
    });

    return this.formatCase(riskCase);
  }

  async assign(caseId: string, dto: AssignRiskCaseDto) {
    const riskCase = await this.casesRepository.findById(caseId);
    if (!riskCase) throw new Error(RiskErrors.RISK_CASE_NOT_FOUND);
    if (riskCase.caseStatus === RiskCaseStatus.CLOSED) {
      throw new Error(RiskErrors.RISK_CASE_STATUS_INVALID);
    }

    const updated = await this.casesRepository.assign(caseId, dto.assigned_to);
    return this.formatCase(updated);
  }

  async close(caseId: string, dto: CloseRiskCaseDto) {
    const riskCase = await this.casesRepository.findById(caseId);
    if (!riskCase) throw new Error(RiskErrors.RISK_CASE_NOT_FOUND);
    if (riskCase.caseStatus === RiskCaseStatus.CLOSED) {
      throw new Error(RiskErrors.RISK_CASE_STATUS_INVALID);
    }

    const updated = await this.casesRepository.close(caseId, dto.resolution);
    return this.formatCase(updated);
  }

  async list(query: QueryRiskCasesDto) {
    const page = Number(query.page || 1);
    const pageSize = Math.min(Number(query.page_size || 20), 100);

    const [items, total] = await Promise.all([
      this.casesRepository.findMany({
        caseType: query.case_type,
        userId: query.user_id,
        caseStatus: query.case_status,
        assignedTo: query.assigned_to,
        page,
        pageSize
      }),
      this.casesRepository.count({
        caseType: query.case_type,
        userId: query.user_id,
        caseStatus: query.case_status,
        assignedTo: query.assigned_to
      })
    ]);

    return {
      items: items.map((item) => this.formatCase(item)),
      pagination: {
        page,
        page_size: pageSize,
        total,
        total_pages: Math.ceil(total / pageSize)
      }
    };
  }

  private formatCase(item: any) {
    return {
      case_id: item.id,
      case_no: item.caseNo,
      case_type: item.caseType,
      target_type: item.targetType,
      target_id: item.targetId,
      user_id: item.userId,
      risk_level: item.riskLevel,
      case_status: item.caseStatus,
      decision_id: item.decisionId,
      assigned_to: item.assignedTo,
      resolution: item.resolution,
      opened_at: item.openedAt,
      assigned_at: item.assignedAt,
      closed_at: item.closedAt
    };
  }

  private generateCaseNo() {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    return `RCS${date}${ulid()}`;
  }
}
```



---



# 11\. Cases Controllers / Module



`apps/risk-service/src/modules/cases/cases.controller.ts`



```TypeScript
import { Controller, Get, Query } from '@nestjs/common';
import { CasesService } from './cases.service';
import { QueryRiskCasesDto } from './dto/query-risk-cases.dto';

@Controller('risk/cases')
export class CasesController {
  constructor(private readonly casesService: CasesService) {}

  @Get()
  list(@Query() query: QueryRiskCasesDto) {
    return this.casesService.list(query);
  }
}
```



`apps/risk-service/src/modules/cases/cases.admin.controller.ts`



```TypeScript
import { Body, Controller, Param, Post } from '@nestjs/common';
import { CasesService } from './cases.service';
import { CreateRiskCaseDto } from './dto/create-risk-case.dto';
import { AssignRiskCaseDto } from './dto/assign-risk-case.dto';
import { CloseRiskCaseDto } from './dto/close-risk-case.dto';

@Controller('admin/risk/cases')
export class CasesAdminController {
  constructor(private readonly casesService: CasesService) {}

  @Post()
  create(@Body() dto: CreateRiskCaseDto) {
    return this.casesService.create(dto);
  }

  @Post(':case_id/assign')
  assign(@Param('case_id') caseId: string, @Body() dto: AssignRiskCaseDto) {
    return this.casesService.assign(caseId, dto);
  }

  @Post(':case_id/close')
  close(@Param('case_id') caseId: string, @Body() dto: CloseRiskCaseDto) {
    return this.casesService.close(caseId, dto);
  }
}
```



`apps/risk-service/src/modules/cases/cases.module.ts`



```TypeScript
import { Module } from '@nestjs/common';
import { CasesController } from './cases.controller';
import { CasesAdminController } from './cases.admin.controller';
import { CasesService } from './cases.service';
import { CasesRepository } from './cases.repository';

@Module({
  controllers: [CasesController, CasesAdminController],
  providers: [CasesService, CasesRepository],
  exports: [CasesService]
})
export class CasesModule {}
```



---



# 12\. Blacklist DTO / Repository / Service



`apps/risk-service/src/modules/blacklist/dto/add-blacklist.dto.ts`



```TypeScript
import { IsOptional, IsString } from 'class-validator';

export class AddBlacklistDto {
  @IsString()
  target_type!: string;

  @IsString()
  target_value!: string;

  @IsString()
  risk_type!: string;

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
  created_by?: string;

  @IsOptional()
  @IsString()
  expired_at?: string;
}
```



`apps/risk-service/src/modules/blacklist/dto/query-blacklist.dto.ts`



```TypeScript
import { IsOptional, IsString } from 'class-validator';

export class QueryBlacklistDto {
  @IsOptional()
  @IsString()
  target_type?: string;

  @IsOptional()
  @IsString()
  target_value?: string;

  @IsOptional()
  @IsString()
  risk_type?: string;

  @IsOptional()
  @IsString()
  status?: string;
}
```



`apps/risk-service/src/modules/blacklist/blacklist.repository.ts`



```TypeScript
import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { ulid } from 'ulid';

const prisma = new PrismaClient();

@Injectable()
export class BlacklistRepository {
  findExisting(targetType: string, targetValue: string, riskType: string) {
    return prisma.riskBlacklist.findUnique({
      where: {
        targetType_targetValue_riskType: {
          targetType,
          targetValue,
          riskType
        }
      }
    });
  }

  create(data: {
    blacklistNo: string;
    targetType: string;
    targetValue: string;
    riskType: string;
    reason: string;
    sourceType?: string;
    sourceId?: string;
    createdBy?: string;
    expiredAt?: Date;
  }) {
    return prisma.$transaction(async (tx) => {
      const blacklist = await tx.riskBlacklist.create({
        data: {
          id: ulid(),
          blacklistNo: data.blacklistNo,
          targetType: data.targetType,
          targetValue: data.targetValue,
          riskType: data.riskType,
          reason: data.reason,
          sourceType: data.sourceType,
          sourceId: data.sourceId,
          createdBy: data.createdBy,
          expiredAt: data.expiredAt,
          status: 'active'
        }
      });

      await tx.outboxEvent.create({
        data: {
          id: ulid(),
          eventType: 'risk.blacklist_added.v1',
          payload: {
            blacklist_id: blacklist.id,
            blacklist_no: blacklist.blacklistNo,
            target_type: blacklist.targetType,
            target_value: blacklist.targetValue,
            risk_type: blacklist.riskType,
            reason: blacklist.reason
          },
          status: 'pending',
          retryCount: 0
        }
      });

      return blacklist;
    });
  }

  findMany(params: {
    targetType?: string;
    targetValue?: string;
    riskType?: string;
    status?: string;
  }) {
    return prisma.riskBlacklist.findMany({
      where: {
        targetType: params.targetType,
        targetValue: params.targetValue,
        riskType: params.riskType,
        status: params.status
      },
      orderBy: { createdAt: 'desc' }
    });
  }
}
```



`apps/risk-service/src/modules/blacklist/blacklist.service.ts`



```TypeScript
import { Injectable } from '@nestjs/common';
import { ulid } from 'ulid';
import { BlacklistRepository } from './blacklist.repository';
import { AddBlacklistDto } from './dto/add-blacklist.dto';
import { QueryBlacklistDto } from './dto/query-blacklist.dto';
import { RiskErrors } from '../../shared/risk-errors';

@Injectable()
export class BlacklistService {
  constructor(private readonly blacklistRepository: BlacklistRepository) {}

  async add(dto: AddBlacklistDto) {
    const existing = await this.blacklistRepository.findExisting(
      dto.target_type,
      dto.target_value,
      dto.risk_type
    );

    if (existing && existing.status === 'active') {
      throw new Error(RiskErrors.BLACKLIST_ALREADY_EXISTS);
    }

    const item = await this.blacklistRepository.create({
      blacklistNo: this.generateBlacklistNo(),
      targetType: dto.target_type,
      targetValue: dto.target_value,
      riskType: dto.risk_type,
      reason: dto.reason,
      sourceType: dto.source_type,
      sourceId: dto.source_id,
      createdBy: dto.created_by,
      expiredAt: dto.expired_at ? new Date(dto.expired_at) : undefined
    });

    return this.formatBlacklist(item);
  }

  async list(query: QueryBlacklistDto) {
    const items = await this.blacklistRepository.findMany({
      targetType: query.target_type,
      targetValue: query.target_value,
      riskType: query.risk_type,
      status: query.status
    });

    return {
      items: items.map((item) => this.formatBlacklist(item))
    };
  }

  private formatBlacklist(item: any) {
    return {
      blacklist_id: item.id,
      blacklist_no: item.blacklistNo,
      target_type: item.targetType,
      target_value: item.targetValue,
      risk_type: item.riskType,
      reason: item.reason,
      status: item.status,
      source_type: item.sourceType,
      source_id: item.sourceId,
      created_by: item.createdBy,
      expired_at: item.expiredAt,
      created_at: item.createdAt
    };
  }

  private generateBlacklistNo() {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    return `BLK${date}${ulid()}`;
  }
}
```



---



# 13\. Blacklist Controllers / Module



`apps/risk-service/src/modules/blacklist/blacklist.controller.ts`



```TypeScript
import { Controller, Get, Query } from '@nestjs/common';
import { BlacklistService } from './blacklist.service';
import { QueryBlacklistDto } from './dto/query-blacklist.dto';

@Controller('risk/blacklist')
export class BlacklistController {
  constructor(private readonly blacklistService: BlacklistService) {}

  @Get()
  list(@Query() query: QueryBlacklistDto) {
    return this.blacklistService.list(query);
  }
}
```



`apps/risk-service/src/modules/blacklist/blacklist.admin.controller.ts`



```TypeScript
import { Body, Controller, Post } from '@nestjs/common';
import { BlacklistService } from './blacklist.service';
import { AddBlacklistDto } from './dto/add-blacklist.dto';

@Controller('admin/risk/blacklist')
export class BlacklistAdminController {
  constructor(private readonly blacklistService: BlacklistService) {}

  @Post()
  add(@Body() dto: AddBlacklistDto) {
    return this.blacklistService.add(dto);
  }
}
```



`apps/risk-service/src/modules/blacklist/blacklist.module.ts`



```TypeScript
import { Module } from '@nestjs/common';
import { BlacklistController } from './blacklist.controller';
import { BlacklistAdminController } from './blacklist.admin.controller';
import { BlacklistService } from './blacklist.service';
import { BlacklistRepository } from './blacklist.repository';

@Module({
  controllers: [BlacklistController, BlacklistAdminController],
  providers: [BlacklistService, BlacklistRepository],
  exports: [BlacklistService]
})
export class BlacklistModule {}
```



---



# 14\. Devices DTO / Repository / Service



`apps/risk-service/src/modules/devices/dto/register-device.dto.ts`



```TypeScript
import { IsOptional, IsString } from 'class-validator';

export class RegisterDeviceDto {
  @IsString()
  device_id!: string;

  @IsOptional()
  @IsString()
  user_id?: string;

  @IsString()
  fingerprint_hash!: string;

  @IsOptional()
  @IsString()
  ip_address?: string;

  @IsOptional()
  @IsString()
  user_agent?: string;

  @IsOptional()
  @IsString()
  country_code?: string;
}
```



`apps/risk-service/src/modules/devices/devices.repository.ts`



```TypeScript
import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { ulid } from 'ulid';

const prisma = new PrismaClient();

@Injectable()
export class DevicesRepository {
  upsert(data: {
    deviceId: string;
    userId?: string;
    fingerprintHash: string;
    ipAddress?: string;
    userAgent?: string;
    countryCode?: string;
  }) {
    return prisma.deviceFingerprint.upsert({
      where: { deviceId: data.deviceId },
      create: {
        id: ulid(),
        deviceId: data.deviceId,
        userId: data.userId,
        fingerprintHash: data.fingerprintHash,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        countryCode: data.countryCode,
        deviceStatus: 'normal',
        firstSeenAt: new Date(),
        lastSeenAt: new Date()
      },
      update: {
        userId: data.userId,
        fingerprintHash: data.fingerprintHash,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        countryCode: data.countryCode,
        lastSeenAt: new Date()
      }
    });
  }

  findByDeviceId(deviceId: string) {
    return prisma.deviceFingerprint.findUnique({
      where: { deviceId }
    });
  }
}
```



`apps/risk-service/src/modules/devices/devices.service.ts`



```TypeScript
import { Injectable } from '@nestjs/common';
import { DevicesRepository } from './devices.repository';
import { RegisterDeviceDto } from './dto/register-device.dto';
import { RiskErrors } from '../../shared/risk-errors';

@Injectable()
export class DevicesService {
  constructor(private readonly devicesRepository: DevicesRepository) {}

  async register(dto: RegisterDeviceDto) {
    const device = await this.devicesRepository.upsert({
      deviceId: dto.device_id,
      userId: dto.user_id,
      fingerprintHash: dto.fingerprint_hash,
      ipAddress: dto.ip_address,
      userAgent: dto.user_agent,
      countryCode: dto.country_code
    });

    return this.formatDevice(device);
  }

  async detail(deviceId: string) {
    const device = await this.devicesRepository.findByDeviceId(deviceId);
    if (!device) throw new Error(RiskErrors.DEVICE_NOT_FOUND);
    return this.formatDevice(device);
  }

  private formatDevice(device: any) {
    return {
      device_id: device.deviceId,
      user_id: device.userId,
      fingerprint_hash: device.fingerprintHash,
      ip_address: device.ipAddress,
      user_agent: device.userAgent,
      country_code: device.countryCode,
      device_status: device.deviceStatus,
      first_seen_at: device.firstSeenAt,
      last_seen_at: device.lastSeenAt
    };
  }
}
```



---



# 15\. Devices Controllers / Module



`apps/risk-service/src/modules/devices/devices.controller.ts`



```TypeScript
import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { DevicesService } from './devices.service';
import { RegisterDeviceDto } from './dto/register-device.dto';

@Controller('risk/devices')
export class DevicesController {
  constructor(private readonly devicesService: DevicesService) {}

  @Post()
  register(@Body() dto: RegisterDeviceDto) {
    return this.devicesService.register(dto);
  }

  @Get(':device_id')
  detail(@Param('device_id') deviceId: string) {
    return this.devicesService.detail(deviceId);
  }
}
```



`apps/risk-service/src/modules/devices/devices.module.ts`



```TypeScript
import { Module } from '@nestjs/common';
import { DevicesController } from './devices.controller';
import { DevicesService } from './devices.service';
import { DevicesRepository } from './devices.repository';

@Module({
  controllers: [DevicesController],
  providers: [DevicesService, DevicesRepository],
  exports: [DevicesService]
})
export class DevicesModule {}
```



---



# 16\. Risk App Module



`apps/risk-service/src/app.module.ts`



```TypeScript
import { Module } from '@nestjs/common';
import { HealthModule } from './health/health.module';
import { RulesModule } from './modules/rules/rules.module';
import { DecisionsModule } from './modules/decisions/decisions.module';
import { CasesModule } from './modules/cases/cases.module';
import { BlacklistModule } from './modules/blacklist/blacklist.module';
import { DevicesModule } from './modules/devices/devices.module';

@Module({
  imports: [
    HealthModule,
    RulesModule,
    DecisionsModule,
    CasesModule,
    BlacklistModule,
    DevicesModule
  ]
})
export class AppModule {}
```



---



# 17\. Risk Service 当前 API



## 业务端



```HTTP
GET /api/v1/risk/rules
POST /api/v1/risk/decisions/evaluate
GET /api/v1/risk/decisions
GET /api/v1/risk/cases
GET /api/v1/risk/blacklist
POST /api/v1/risk/devices
GET /api/v1/risk/devices/:device_id
```



## 后台端



```HTTP
POST /api/v1/admin/risk/rules
POST /api/v1/admin/risk/cases
POST /api/v1/admin/risk/cases/:case_id/assign
POST /api/v1/admin/risk/cases/:case_id/close
POST /api/v1/admin/risk/blacklist
```



---



# 18\. Risk Service 已具备能力



这一版完成后，Risk Service 支持：



```Plain Text
风险规则创建 / 查询
简单规则匹配
黑名单检查
风险评分
风险决策 pass / review / freeze / recover / reject
风控案件创建 / 分配 / 关闭
黑名单添加 / 查询
设备指纹注册 / 查询
Risk outbox 事件
```



---



# 19\. 后续必须补强



```Plain Text
统一 AppException
PrismaModule 注入
规则表达式引擎
规则灰度 / 权重 / 命中解释
设备聚类
IP / 钱包 / 行为图谱
资产冻结建议联动
奖励追回建议联动
Approval Service 联动
Audit Log
Admin 权限 Guard
风控案件 SLA
机器学习评分接口预留
```



---



# 20\. 下一步继续



按 23 个 Service 顺序，下一步写：



```Plain Text
19. Approval Service 审批服务
```



下一步会覆盖：



```Plain Text
审批申请
审批步骤
多级审批
审批执行
审批权限
高危操作审批
ApprovalCreated / ApprovalApproved / ApprovalRejected / ApprovalExecuted 事件
```



