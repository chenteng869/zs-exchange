# H033\-17 个 Service：Tax Service 税务服务

下面继续第 17 个 Service：Tax Service 税务服务。



# 第 17 个 Service：Tax Service 税务服务



本服务负责：



```Plain Text
税务规则
订单税
佣金税
VAT / GST / 销售税
税务记录
税务报表
税务支付状态
TaxCalculated / TaxRecorded / TaxPaid 事件预留
```



---



# 1\. Tax Service 目录结构



```Plain Text
apps/tax-service/
├── src/
│   ├── app.module.ts
│   ├── main.ts
│   ├── health/
│   ├── shared/
│   │   ├── tax-errors.ts
│   │   ├── tax-events.ts
│   │   ├── tax-status.ts
│   │   └── tax-types.ts
│   └── modules/
│       ├── rules/
│       │   ├── rules.module.ts
│       │   ├── rules.controller.ts
│       │   ├── rules.admin.controller.ts
│       │   ├── rules.repository.ts
│       │   ├── rules.service.ts
│       │   └── dto/
│       │       ├── create-tax-rule.dto.ts
│       │       └── query-tax-rules.dto.ts
│       ├── records/
│       │   ├── records.module.ts
│       │   ├── records.controller.ts
│       │   ├── records.admin.controller.ts
│       │   ├── records.repository.ts
│       │   ├── records.service.ts
│       │   └── dto/
│       │       ├── calculate-tax.dto.ts
│       │       ├── create-tax-record.dto.ts
│       │       ├── mark-tax-paid.dto.ts
│       │       └── query-tax-records.dto.ts
│       └── reports/
│           ├── reports.module.ts
│           ├── reports.controller.ts
│           ├── reports.repository.ts
│           └── reports.service.ts
```



---



# 2\. Prisma 补充表



## 2\.1 TaxRule



```Plain Text
model TaxRule {
  id              String    @id
  ruleCode        String    @map("rule_code")
  ruleVersion     String    @map("rule_version")
  taxType         String    @map("tax_type")
  countryCode     String    @map("country_code")
  regionCode      String?   @map("region_code")
  productType     String?   @map("product_type")
  sourceType      String?   @map("source_type")
  taxRate         Decimal   @map("tax_rate") @db.Decimal(36, 18)
  includedInPrice Boolean   @default(false) @map("included_in_price")
  status          String    @default("active")
  effectiveFrom   DateTime? @map("effective_from")
  effectiveTo     DateTime? @map("effective_to")
  createdAt       DateTime  @default(now()) @map("created_at")
  updatedAt       DateTime  @updatedAt @map("updated_at")
  metadata        Json?

  @@unique([ruleCode, ruleVersion])
  @@index([countryCode])
  @@index([taxType])
  @@map("tax_rules")
}
```



## 2\.2 TaxRecord



```Plain Text
model TaxRecord {
  id             String    @id
  taxNo          String    @unique @map("tax_no")
  taxType        String    @map("tax_type")
  sourceType     String    @map("source_type")
  sourceId       String    @map("source_id")
  orderId        String?   @map("order_id")
  userId         String?   @map("user_id")
  countryCode    String    @map("country_code")
  regionCode     String?   @map("region_code")
  taxableAmount  Decimal   @map("taxable_amount") @db.Decimal(36, 18)
  taxRate        Decimal   @map("tax_rate") @db.Decimal(36, 18)
  taxAmount      Decimal   @map("tax_amount") @db.Decimal(36, 18)
  currency       String
  ruleCode       String?   @map("rule_code")
  ruleVersion    String?   @map("rule_version")
  taxStatus      String    @default("recorded") @map("tax_status")
  paidAt         DateTime? @map("paid_at")
  createdAt      DateTime  @default(now()) @map("created_at")
  updatedAt      DateTime  @updatedAt @map("updated_at")
  metadata       Json?

  @@index([sourceType, sourceId])
  @@index([orderId])
  @@index([countryCode])
  @@index([taxStatus])
  @@map("tax_records")
}
```



## 2\.3 TaxReport



```Plain Text
model TaxReport {
  id            String    @id
  reportNo      String    @unique @map("report_no")
  reportPeriod  String    @map("report_period")
  countryCode   String    @map("country_code")
  taxType       String    @map("tax_type")
  taxableAmount Decimal   @map("taxable_amount") @db.Decimal(36, 18)
  taxAmount     Decimal   @map("tax_amount") @db.Decimal(36, 18)
  currency      String
  reportStatus  String    @default("created") @map("report_status")
  submittedAt   DateTime? @map("submitted_at")
  paidAt        DateTime? @map("paid_at")
  createdAt     DateTime  @default(now()) @map("created_at")
  updatedAt     DateTime  @updatedAt @map("updated_at")
  metadata      Json?

  @@index([reportPeriod])
  @@index([countryCode])
  @@map("tax_reports")
}
```



---



# 3\. Shared 常量



`apps/tax-service/src/shared/tax-events.ts`



```TypeScript
export const TaxEvents = {
  TAX_RULE_CREATED: 'tax.rule_created.v1',
  TAX_CALCULATED: 'tax.calculated.v1',
  TAX_RECORDED: 'tax.recorded.v1',
  TAX_PAID: 'tax.paid.v1',
  TAX_REPORT_CREATED: 'tax.report_created.v1',
  TAX_REPORT_SUBMITTED: 'tax.report_submitted.v1'
} as const;
```



`apps/tax-service/src/shared/tax-errors.ts`



```TypeScript
export const TaxErrors = {
  TAX_RULE_NOT_FOUND: 'TAX_RULE_NOT_FOUND',
  TAX_RULE_ALREADY_EXISTS: 'TAX_RULE_ALREADY_EXISTS',
  TAX_RULE_NOT_ACTIVE: 'TAX_RULE_NOT_ACTIVE',
  TAX_RECORD_NOT_FOUND: 'TAX_RECORD_NOT_FOUND',
  TAX_RECORD_ALREADY_EXISTS: 'TAX_RECORD_ALREADY_EXISTS',
  TAX_RECORD_STATUS_INVALID: 'TAX_RECORD_STATUS_INVALID',
  TAX_AMOUNT_INVALID: 'TAX_AMOUNT_INVALID',
  TAX_REPORT_NOT_FOUND: 'TAX_REPORT_NOT_FOUND'
} as const;
```



`apps/tax-service/src/shared/tax-status.ts`



```TypeScript
export const TaxRuleStatus = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  ARCHIVED: 'archived'
} as const;

export const TaxRecordStatus = {
  RECORDED: 'recorded',
  PAYABLE: 'payable',
  PAID: 'paid',
  REVERSED: 'reversed',
  CANCELLED: 'cancelled'
} as const;

export const TaxReportStatus = {
  CREATED: 'created',
  SUBMITTED: 'submitted',
  PAID: 'paid',
  CANCELLED: 'cancelled'
} as const;
```



`apps/tax-service/src/shared/tax-types.ts`



```TypeScript
export const TaxTypes = {
  ORDER_SALES_TAX: 'order_sales_tax',
  VAT: 'vat',
  GST: 'gst',
  COMMISSION_TAX: 'commission_tax',
  MERCHANT_SETTLEMENT_TAX: 'merchant_settlement_tax',
  REWARD_WITHHOLDING_TAX: 'reward_withholding_tax',
  SERVICE_TAX: 'service_tax'
} as const;
```



---



# 4\. Rules DTO



`apps/tax-service/src/modules/rules/dto/create-tax-rule.dto.ts`



```TypeScript
import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class CreateTaxRuleDto {
  @IsString()
  rule_code!: string;

  @IsString()
  rule_version!: string;

  @IsString()
  tax_type!: string;

  @IsString()
  country_code!: string;

  @IsOptional()
  @IsString()
  region_code?: string;

  @IsOptional()
  @IsString()
  product_type?: string;

  @IsOptional()
  @IsString()
  source_type?: string;

  @IsString()
  tax_rate!: string;

  @IsOptional()
  @IsBoolean()
  included_in_price?: boolean;

  @IsOptional()
  @IsString()
  effective_from?: string;

  @IsOptional()
  @IsString()
  effective_to?: string;
}
```



`apps/tax-service/src/modules/rules/dto/query-tax-rules.dto.ts`



```TypeScript
import { IsOptional, IsString } from 'class-validator';

export class QueryTaxRulesDto {
  @IsOptional()
  @IsString()
  tax_type?: string;

  @IsOptional()
  @IsString()
  country_code?: string;

  @IsOptional()
  @IsString()
  product_type?: string;

  @IsOptional()
  @IsString()
  status?: string;
}
```



---



# 5\. Rules Repository



`apps/tax-service/src/modules/rules/rules.repository.ts`



```TypeScript
import { Injectable } from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';
import { ulid } from 'ulid';

const prisma = new PrismaClient();

@Injectable()
export class RulesRepository {
  findByCode(ruleCode: string, ruleVersion: string) {
    return prisma.taxRule.findUnique({
      where: {
        ruleCode_ruleVersion: {
          ruleCode,
          ruleVersion
        }
      }
    });
  }

  findActive(params: {
    taxType: string;
    countryCode: string;
    productType?: string;
    sourceType?: string;
  }) {
    return prisma.taxRule.findFirst({
      where: {
        taxType: params.taxType,
        countryCode: params.countryCode,
        productType: params.productType,
        sourceType: params.sourceType,
        status: 'active',
        OR: [
          { effectiveFrom: null },
          { effectiveFrom: { lte: new Date() } }
        ],
        AND: [
          {
            OR: [
              { effectiveTo: null },
              { effectiveTo: { gte: new Date() } }
            ]
          }
        ]
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
  }

  findMany(params: {
    taxType?: string;
    countryCode?: string;
    productType?: string;
    status?: string;
  }) {
    return prisma.taxRule.findMany({
      where: {
        taxType: params.taxType,
        countryCode: params.countryCode,
        productType: params.productType,
        status: params.status
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  create(data: {
    ruleCode: string;
    ruleVersion: string;
    taxType: string;
    countryCode: string;
    regionCode?: string;
    productType?: string;
    sourceType?: string;
    taxRate: string;
    includedInPrice: boolean;
    effectiveFrom?: Date;
    effectiveTo?: Date;
  }) {
    return prisma.$transaction(async (tx) => {
      const rule = await tx.taxRule.create({
        data: {
          id: ulid(),
          ruleCode: data.ruleCode,
          ruleVersion: data.ruleVersion,
          taxType: data.taxType,
          countryCode: data.countryCode,
          regionCode: data.regionCode,
          productType: data.productType,
          sourceType: data.sourceType,
          taxRate: new Prisma.Decimal(data.taxRate),
          includedInPrice: data.includedInPrice,
          effectiveFrom: data.effectiveFrom,
          effectiveTo: data.effectiveTo,
          status: 'active'
        }
      });

      await tx.outboxEvent.create({
        data: {
          id: ulid(),
          eventType: 'tax.rule_created.v1',
          payload: {
            rule_id: rule.id,
            rule_code: rule.ruleCode,
            rule_version: rule.ruleVersion,
            tax_type: rule.taxType,
            country_code: rule.countryCode,
            tax_rate: rule.taxRate.toString()
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



---



# 6\. Rules Service



`apps/tax-service/src/modules/rules/rules.service.ts`



```TypeScript
import { Injectable } from '@nestjs/common';
import Decimal from 'decimal.js';
import { RulesRepository } from './rules.repository';
import { CreateTaxRuleDto } from './dto/create-tax-rule.dto';
import { QueryTaxRulesDto } from './dto/query-tax-rules.dto';
import { TaxErrors } from '../../shared/tax-errors';

@Injectable()
export class RulesService {
  constructor(private readonly rulesRepository: RulesRepository) {}

  async create(dto: CreateTaxRuleDto) {
    const existing = await this.rulesRepository.findByCode(
      dto.rule_code,
      dto.rule_version
    );

    if (existing) {
      throw new Error(TaxErrors.TAX_RULE_ALREADY_EXISTS);
    }

    if (new Decimal(dto.tax_rate).lt(0)) {
      throw new Error(TaxErrors.TAX_AMOUNT_INVALID);
    }

    const rule = await this.rulesRepository.create({
      ruleCode: dto.rule_code,
      ruleVersion: dto.rule_version,
      taxType: dto.tax_type,
      countryCode: dto.country_code,
      regionCode: dto.region_code,
      productType: dto.product_type,
      sourceType: dto.source_type,
      taxRate: new Decimal(dto.tax_rate).toFixed(18),
      includedInPrice: dto.included_in_price ?? false,
      effectiveFrom: dto.effective_from ? new Date(dto.effective_from) : undefined,
      effectiveTo: dto.effective_to ? new Date(dto.effective_to) : undefined
    });

    return this.formatRule(rule);
  }

  async list(query: QueryTaxRulesDto) {
    const items = await this.rulesRepository.findMany({
      taxType: query.tax_type,
      countryCode: query.country_code,
      productType: query.product_type,
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
      tax_type: rule.taxType,
      country_code: rule.countryCode,
      region_code: rule.regionCode,
      product_type: rule.productType,
      source_type: rule.sourceType,
      tax_rate: rule.taxRate.toString(),
      included_in_price: rule.includedInPrice,
      status: rule.status,
      effective_from: rule.effectiveFrom,
      effective_to: rule.effectiveTo
    };
  }
}
```



---



# 7\. Rules Controllers / Module



`apps/tax-service/src/modules/rules/rules.controller.ts`



```TypeScript
import { Controller, Get, Query } from '@nestjs/common';
import { RulesService } from './rules.service';
import { QueryTaxRulesDto } from './dto/query-tax-rules.dto';

@Controller('tax/rules')
export class RulesController {
  constructor(private readonly rulesService: RulesService) {}

  @Get()
  list(@Query() query: QueryTaxRulesDto) {
    return this.rulesService.list(query);
  }
}
```



`apps/tax-service/src/modules/rules/rules.admin.controller.ts`



```TypeScript
import { Body, Controller, Post } from '@nestjs/common';
import { RulesService } from './rules.service';
import { CreateTaxRuleDto } from './dto/create-tax-rule.dto';

@Controller('admin/tax/rules')
export class RulesAdminController {
  constructor(private readonly rulesService: RulesService) {}

  @Post()
  create(@Body() dto: CreateTaxRuleDto) {
    return this.rulesService.create(dto);
  }
}
```



`apps/tax-service/src/modules/rules/rules.module.ts`



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



# 8\. Records DTO



`apps/tax-service/src/modules/records/dto/calculate-tax.dto.ts`



```TypeScript
import { IsOptional, IsString } from 'class-validator';

export class CalculateTaxDto {
  @IsString()
  tax_type!: string;

  @IsString()
  country_code!: string;

  @IsOptional()
  @IsString()
  region_code?: string;

  @IsOptional()
  @IsString()
  product_type?: string;

  @IsOptional()
  @IsString()
  source_type?: string;

  @IsString()
  taxable_amount!: string;

  @IsString()
  currency!: string;
}
```



`apps/tax-service/src/modules/records/dto/create-tax-record.dto.ts`



```TypeScript
import { IsOptional, IsString } from 'class-validator';

export class CreateTaxRecordDto {
  @IsString()
  tax_type!: string;

  @IsString()
  source_type!: string;

  @IsString()
  source_id!: string;

  @IsOptional()
  @IsString()
  order_id?: string;

  @IsOptional()
  @IsString()
  user_id?: string;

  @IsString()
  country_code!: string;

  @IsOptional()
  @IsString()
  region_code?: string;

  @IsOptional()
  @IsString()
  product_type?: string;

  @IsString()
  taxable_amount!: string;

  @IsString()
  currency!: string;
}
```



`apps/tax-service/src/modules/records/dto/mark-tax-paid.dto.ts`



```TypeScript
import { IsOptional, IsString } from 'class-validator';

export class MarkTaxPaidDto {
  @IsString()
  payment_reference!: string;

  @IsOptional()
  @IsString()
  paid_by?: string;
}
```



`apps/tax-service/src/modules/records/dto/query-tax-records.dto.ts`



```TypeScript
import { IsOptional, IsString } from 'class-validator';

export class QueryTaxRecordsDto {
  @IsOptional()
  @IsString()
  tax_type?: string;

  @IsOptional()
  @IsString()
  source_type?: string;

  @IsOptional()
  @IsString()
  source_id?: string;

  @IsOptional()
  @IsString()
  order_id?: string;

  @IsOptional()
  @IsString()
  country_code?: string;

  @IsOptional()
  @IsString()
  tax_status?: string;

  @IsOptional()
  page?: number;

  @IsOptional()
  page_size?: number;
}
```



---



# 9\. Records Repository



`apps/tax-service/src/modules/records/records.repository.ts`



```TypeScript
import { Injectable } from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';
import { ulid } from 'ulid';

const prisma = new PrismaClient();

@Injectable()
export class RecordsRepository {
  findRule(params: {
    taxType: string;
    countryCode: string;
    productType?: string;
    sourceType?: string;
  }) {
    return prisma.taxRule.findFirst({
      where: {
        taxType: params.taxType,
        countryCode: params.countryCode,
        productType: params.productType,
        sourceType: params.sourceType,
        status: 'active'
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  findById(recordId: string) {
    return prisma.taxRecord.findUnique({
      where: { id: recordId }
    });
  }

  findBySource(sourceType: string, sourceId: string) {
    return prisma.taxRecord.findFirst({
      where: { sourceType, sourceId }
    });
  }

  findMany(params: {
    taxType?: string;
    sourceType?: string;
    sourceId?: string;
    orderId?: string;
    countryCode?: string;
    taxStatus?: string;
    page: number;
    pageSize: number;
  }) {
    return prisma.taxRecord.findMany({
      where: {
        taxType: params.taxType,
        sourceType: params.sourceType,
        sourceId: params.sourceId,
        orderId: params.orderId,
        countryCode: params.countryCode,
        taxStatus: params.taxStatus
      },
      orderBy: { createdAt: 'desc' },
      skip: (params.page - 1) * params.pageSize,
      take: params.pageSize
    });
  }

  count(params: {
    taxType?: string;
    sourceType?: string;
    sourceId?: string;
    orderId?: string;
    countryCode?: string;
    taxStatus?: string;
  }) {
    return prisma.taxRecord.count({
      where: {
        taxType: params.taxType,
        sourceType: params.sourceType,
        sourceId: params.sourceId,
        orderId: params.orderId,
        countryCode: params.countryCode,
        taxStatus: params.taxStatus
      }
    });
  }

  create(data: {
    taxNo: string;
    taxType: string;
    sourceType: string;
    sourceId: string;
    orderId?: string;
    userId?: string;
    countryCode: string;
    regionCode?: string;
    taxableAmount: string;
    taxRate: string;
    taxAmount: string;
    currency: string;
    ruleCode?: string;
    ruleVersion?: string;
  }) {
    return prisma.$transaction(async (tx) => {
      const record = await tx.taxRecord.create({
        data: {
          id: ulid(),
          taxNo: data.taxNo,
          taxType: data.taxType,
          sourceType: data.sourceType,
          sourceId: data.sourceId,
          orderId: data.orderId,
          userId: data.userId,
          countryCode: data.countryCode,
          regionCode: data.regionCode,
          taxableAmount: new Prisma.Decimal(data.taxableAmount),
          taxRate: new Prisma.Decimal(data.taxRate),
          taxAmount: new Prisma.Decimal(data.taxAmount),
          currency: data.currency,
          ruleCode: data.ruleCode,
          ruleVersion: data.ruleVersion,
          taxStatus: 'recorded'
        }
      });

      await tx.outboxEvent.create({
        data: {
          id: ulid(),
          eventType: 'tax.recorded.v1',
          payload: {
            tax_record_id: record.id,
            tax_no: record.taxNo,
            tax_type: record.taxType,
            source_type: record.sourceType,
            source_id: record.sourceId,
            taxable_amount: record.taxableAmount.toString(),
            tax_amount: record.taxAmount.toString(),
            currency: record.currency
          },
          status: 'pending',
          retryCount: 0
        }
      });

      return record;
    });
  }

  markPaid(recordId: string, paymentReference: string, paidBy?: string) {
    return prisma.$transaction(async (tx) => {
      const record = await tx.taxRecord.update({
        where: { id: recordId },
        data: {
          taxStatus: 'paid',
          paidAt: new Date(),
          metadata: {
            payment_reference: paymentReference,
            paid_by: paidBy || null
          }
        }
      });

      await tx.outboxEvent.create({
        data: {
          id: ulid(),
          eventType: 'tax.paid.v1',
          payload: {
            tax_record_id: record.id,
            tax_no: record.taxNo,
            tax_amount: record.taxAmount.toString(),
            currency: record.currency,
            payment_reference: paymentReference
          },
          status: 'pending',
          retryCount: 0
        }
      });

      return record;
    });
  }
}
```



---



# 10\. Records Service



`apps/tax-service/src/modules/records/records.service.ts`



```TypeScript
import { Injectable } from '@nestjs/common';
import Decimal from 'decimal.js';
import { ulid } from 'ulid';
import { RecordsRepository } from './records.repository';
import { CalculateTaxDto } from './dto/calculate-tax.dto';
import { CreateTaxRecordDto } from './dto/create-tax-record.dto';
import { MarkTaxPaidDto } from './dto/mark-tax-paid.dto';
import { QueryTaxRecordsDto } from './dto/query-tax-records.dto';
import { TaxErrors } from '../../shared/tax-errors';
import { TaxRecordStatus } from '../../shared/tax-status';

@Injectable()
export class RecordsService {
  constructor(private readonly recordsRepository: RecordsRepository) {}

  async calculate(dto: CalculateTaxDto) {
    const rule = await this.recordsRepository.findRule({
      taxType: dto.tax_type,
      countryCode: dto.country_code,
      productType: dto.product_type,
      sourceType: dto.source_type
    });

    if (!rule) {
      throw new Error(TaxErrors.TAX_RULE_NOT_FOUND);
    }

    const taxableAmount = new Decimal(dto.taxable_amount);
    if (taxableAmount.lt(0)) {
      throw new Error(TaxErrors.TAX_AMOUNT_INVALID);
    }

    const taxAmount = rule.includedInPrice
      ? taxableAmount.sub(taxableAmount.div(new Decimal(1).add(rule.taxRate.toString())))
      : taxableAmount.mul(rule.taxRate.toString());

    return {
      tax_type: dto.tax_type,
      country_code: dto.country_code,
      taxable_amount: taxableAmount.toFixed(18),
      tax_rate: rule.taxRate.toString(),
      tax_amount: taxAmount.toFixed(18),
      currency: dto.currency,
      included_in_price: rule.includedInPrice,
      rule_code: rule.ruleCode,
      rule_version: rule.ruleVersion
    };
  }

  async create(dto: CreateTaxRecordDto) {
    const existing = await this.recordsRepository.findBySource(
      dto.source_type,
      dto.source_id
    );

    if (existing) {
      throw new Error(TaxErrors.TAX_RECORD_ALREADY_EXISTS);
    }

    const result = await this.calculate({
      tax_type: dto.tax_type,
      country_code: dto.country_code,
      region_code: dto.region_code,
      product_type: dto.product_type,
      source_type: dto.source_type,
      taxable_amount: dto.taxable_amount,
      currency: dto.currency
    });

    const record = await this.recordsRepository.create({
      taxNo: this.generateTaxNo(),
      taxType: dto.tax_type,
      sourceType: dto.source_type,
      sourceId: dto.source_id,
      orderId: dto.order_id,
      userId: dto.user_id,
      countryCode: dto.country_code,
      regionCode: dto.region_code,
      taxableAmount: result.taxable_amount,
      taxRate: result.tax_rate,
      taxAmount: result.tax_amount,
      currency: dto.currency,
      ruleCode: result.rule_code,
      ruleVersion: result.rule_version
    });

    return this.formatRecord(record);
  }

  async detail(recordId: string) {
    const record = await this.recordsRepository.findById(recordId);
    if (!record) {
      throw new Error(TaxErrors.TAX_RECORD_NOT_FOUND);
    }

    return this.formatRecord(record);
  }

  async list(query: QueryTaxRecordsDto) {
    const page = Number(query.page || 1);
    const pageSize = Math.min(Number(query.page_size || 20), 100);

    const [items, total] = await Promise.all([
      this.recordsRepository.findMany({
        taxType: query.tax_type,
        sourceType: query.source_type,
        sourceId: query.source_id,
        orderId: query.order_id,
        countryCode: query.country_code,
        taxStatus: query.tax_status,
        page,
        pageSize
      }),
      this.recordsRepository.count({
        taxType: query.tax_type,
        sourceType: query.source_type,
        sourceId: query.source_id,
        orderId: query.order_id,
        countryCode: query.country_code,
        taxStatus: query.tax_status
      })
    ]);

    return {
      items: items.map((item) => this.formatRecord(item)),
      pagination: {
        page,
        page_size: pageSize,
        total,
        total_pages: Math.ceil(total / pageSize)
      }
    };
  }

  async markPaid(recordId: string, dto: MarkTaxPaidDto) {
    const record = await this.recordsRepository.findById(recordId);

    if (!record) {
      throw new Error(TaxErrors.TAX_RECORD_NOT_FOUND);
    }

    if (record.taxStatus === TaxRecordStatus.PAID) {
      throw new Error(TaxErrors.TAX_RECORD_STATUS_INVALID);
    }

    const updated = await this.recordsRepository.markPaid(
      recordId,
      dto.payment_reference,
      dto.paid_by
    );

    return this.formatRecord(updated);
  }

  private formatRecord(record: any) {
    return {
      tax_record_id: record.id,
      tax_no: record.taxNo,
      tax_type: record.taxType,
      source_type: record.sourceType,
      source_id: record.sourceId,
      order_id: record.orderId,
      user_id: record.userId,
      country_code: record.countryCode,
      region_code: record.regionCode,
      taxable_amount: record.taxableAmount.toString(),
      tax_rate: record.taxRate.toString(),
      tax_amount: record.taxAmount.toString(),
      currency: record.currency,
      rule_code: record.ruleCode,
      rule_version: record.ruleVersion,
      tax_status: record.taxStatus,
      paid_at: record.paidAt,
      created_at: record.createdAt
    };
  }

  private generateTaxNo() {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    return `TAX${date}${ulid()}`;
  }
}
```



---



# 11\. Records Controllers / Module



`apps/tax-service/src/modules/records/records.controller.ts`



```TypeScript
import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { RecordsService } from './records.service';
import { CalculateTaxDto } from './dto/calculate-tax.dto';
import { QueryTaxRecordsDto } from './dto/query-tax-records.dto';

@Controller('tax/records')
export class RecordsController {
  constructor(private readonly recordsService: RecordsService) {}

  @Post('calculate')
  calculate(@Body() dto: CalculateTaxDto) {
    return this.recordsService.calculate(dto);
  }

  @Get()
  list(@Query() query: QueryTaxRecordsDto) {
    return this.recordsService.list(query);
  }

  @Get(':record_id')
  detail(@Param('record_id') recordId: string) {
    return this.recordsService.detail(recordId);
  }
}
```



`apps/tax-service/src/modules/records/records.admin.controller.ts`



```TypeScript
import { Body, Controller, Param, Post } from '@nestjs/common';
import { RecordsService } from './records.service';
import { CreateTaxRecordDto } from './dto/create-tax-record.dto';
import { MarkTaxPaidDto } from './dto/mark-tax-paid.dto';

@Controller('admin/tax/records')
export class RecordsAdminController {
  constructor(private readonly recordsService: RecordsService) {}

  @Post()
  create(@Body() dto: CreateTaxRecordDto) {
    return this.recordsService.create(dto);
  }

  @Post(':record_id/paid')
  markPaid(
    @Param('record_id') recordId: string,
    @Body() dto: MarkTaxPaidDto
  ) {
    return this.recordsService.markPaid(recordId, dto);
  }
}
```



`apps/tax-service/src/modules/records/records.module.ts`



```TypeScript
import { Module } from '@nestjs/common';
import { RecordsController } from './records.controller';
import { RecordsAdminController } from './records.admin.controller';
import { RecordsService } from './records.service';
import { RecordsRepository } from './records.repository';

@Module({
  controllers: [RecordsController, RecordsAdminController],
  providers: [RecordsService, RecordsRepository],
  exports: [RecordsService]
})
export class RecordsModule {}
```



---



# 12\. Reports Repository / Service



`apps/tax-service/src/modules/reports/reports.repository.ts`



```TypeScript
import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

@Injectable()
export class ReportsRepository {
  summary(params: {
    taxType?: string;
    countryCode?: string;
    currency?: string;
    startTime?: Date;
    endTime?: Date;
  }) {
    return prisma.taxRecord.groupBy({
      by: ['taxType', 'countryCode', 'currency', 'taxStatus'],
      where: {
        taxType: params.taxType,
        countryCode: params.countryCode,
        currency: params.currency,
        createdAt: {
          gte: params.startTime,
          lte: params.endTime
        }
      },
      _sum: {
        taxableAmount: true,
        taxAmount: true
      },
      _count: {
        id: true
      }
    });
  }
}
```



`apps/tax-service/src/modules/reports/reports.service.ts`



```TypeScript
import { Injectable } from '@nestjs/common';
import { ReportsRepository } from './reports.repository';

@Injectable()
export class ReportsService {
  constructor(private readonly reportsRepository: ReportsRepository) {}

  async summary(query: {
    tax_type?: string;
    country_code?: string;
    currency?: string;
    start_time?: string;
    end_time?: string;
  }) {
    const items = await this.reportsRepository.summary({
      taxType: query.tax_type,
      countryCode: query.country_code,
      currency: query.currency,
      startTime: query.start_time ? new Date(query.start_time) : undefined,
      endTime: query.end_time ? new Date(query.end_time) : undefined
    });

    return {
      items: items.map((item) => ({
        tax_type: item.taxType,
        country_code: item.countryCode,
        currency: item.currency,
        tax_status: item.taxStatus,
        taxable_amount: item._sum.taxableAmount?.toString() || '0.000000000000000000',
        tax_amount: item._sum.taxAmount?.toString() || '0.000000000000000000',
        record_count: item._count.id
      }))
    };
  }
}
```



`apps/tax-service/src/modules/reports/reports.controller.ts`



```TypeScript
import { Controller, Get, Query } from '@nestjs/common';
import { ReportsService } from './reports.service';

@Controller('tax/reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('summary')
  summary(
    @Query()
    query: {
      tax_type?: string;
      country_code?: string;
      currency?: string;
      start_time?: string;
      end_time?: string;
    }
  ) {
    return this.reportsService.summary(query);
  }
}
```



`apps/tax-service/src/modules/reports/reports.module.ts`



```TypeScript
import { Module } from '@nestjs/common';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { ReportsRepository } from './reports.repository';

@Module({
  controllers: [ReportsController],
  providers: [ReportsService, ReportsRepository],
  exports: [ReportsService]
})
export class ReportsModule {}
```



---



# 13\. Tax App Module



`apps/tax-service/src/app.module.ts`



```TypeScript
import { Module } from '@nestjs/common';
import { HealthModule } from './health/health.module';
import { RulesModule } from './modules/rules/rules.module';
import { RecordsModule } from './modules/records/records.module';
import { ReportsModule } from './modules/reports/reports.module';

@Module({
  imports: [
    HealthModule,
    RulesModule,
    RecordsModule,
    ReportsModule
  ]
})
export class AppModule {}
```



---



# 14\. Tax Service 当前 API



## 查询端



```HTTP
GET /api/v1/tax/rules
POST /api/v1/tax/records/calculate
GET /api/v1/tax/records
GET /api/v1/tax/records/:record_id
GET /api/v1/tax/reports/summary
```



## 后台端



```HTTP
POST /api/v1/admin/tax/rules
POST /api/v1/admin/tax/records
POST /api/v1/admin/tax/records/:record_id/paid
```



---



# 15\. 税务计算验证



不含税价格：



```JSON
{
  "taxable_amount": "369.000000000000000000",
  "tax_rate": "0.100000000000000000",
  "tax_amount": "36.900000000000000000"
}
```



含税价格：



```Plain Text
tax_amount = amount - amount / (1 + tax_rate)
```



```JSON
{
  "taxable_amount": "369.000000000000000000",
  "tax_rate": "0.100000000000000000",
  "tax_amount": "33.545454545454545455"
}
```



---



# 16\. Tax Service 已具备能力



这一版完成后，Tax Service 支持：



```Plain Text
税务规则创建
税务规则查询
按国家 / 商品 / 来源匹配税务规则
不含税税额计算
含税税额拆分
税务记录创建
税务记录查询
税务支付标记
税务汇总报表
Tax outbox 事件
```



---



# 17\. 后续必须补强



```Plain Text
统一 AppException
PrismaModule 注入
国家 / 州 / 城市多级税率
免税规则
税务主体识别
奖励代扣税
发票服务
税务申报文件生成
Finance Service 联动
Reporting Service 联动
Approval Service 联动
Audit Log
Admin 权限 Guard
```



---



# 18\. 下一步继续



按 23 个 Service 顺序，下一步写：



```Plain Text
18. Risk Service 风控服务
```



下一步会覆盖：



```Plain Text
风险规则
风险评分
风控事件
风控案件
黑名单
设备指纹
资产冻结建议
奖励追回建议
```



