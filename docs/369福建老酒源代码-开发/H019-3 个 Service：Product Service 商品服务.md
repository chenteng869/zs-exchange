# H019\-3 个 Service：Product Service 商品服务

下面继续按 23 个 Service 顺序写代码。



# 第 3 个 Service：Product Service 商品服务



本服务负责：



```Plain Text
商品创建
商品编辑
商品权益配置
商品规则绑定
商品提交审核
商品审核通过
商品上架
商品下架
商品版本快照
商品地区限制
商品库存
福建老酒 369 标准权益包初始化
AEP 算力权益包初始化
```



---



# 1\. Product Service 目录结构



```Plain Text
apps/product-service/
├── src/
│   ├── main.ts
│   ├── app.module.ts
│   ├── health/
│   │   ├── health.controller.ts
│   │   └── health.module.ts
│   ├── shared/
│   │   ├── product-errors.ts
│   │   ├── product-events.ts
│   │   ├── product-status.ts
│   │   └── product-types.ts
│   └── modules/
│       ├── products/
│       │   ├── products.module.ts
│       │   ├── products.controller.ts
│       │   ├── products.admin.controller.ts
│       │   ├── products.service.ts
│       │   ├── products.repository.ts
│       │   └── dto/
│       │       ├── create-product.dto.ts
│       │       ├── update-product.dto.ts
│       │       ├── add-product-benefit.dto.ts
│       │       ├── bind-product-rule.dto.ts
│       │       ├── set-product-region-rule.dto.ts
│       │       └── query-products.dto.ts
│       └── bootstrap-products/
│           ├── bootstrap-products.module.ts
│           └── bootstrap-products.service.ts
```



---



# 2\. Prisma 补充表



在 `prisma/schema.prisma` 增加或补全以下模型。



## 2\.1 ProductBenefit



```Plain Text
model ProductBenefit {
  id            String   @id
  productId     String   @map("product_id")
  benefitType   String   @map("benefit_type")
  benefitName   String   @map("benefit_name")
  benefitValue  Decimal? @map("benefit_value") @db.Decimal(36, 18)
  benefitUnit   String?  @map("benefit_unit")
  effectiveDays Int?     @map("effective_days")
  status        String   @default("active")
  ruleVersion   String?  @map("rule_version")
  createdAt     DateTime @default(now()) @map("created_at")
  updatedAt     DateTime @updatedAt @map("updated_at")
  metadata      Json?

  product       Product  @relation(fields: [productId], references: [id])

  @@index([productId])
  @@index([benefitType])
  @@map("product_benefits")
}
```



---



## 2\.2 ProductRuleBinding



```Plain Text
model ProductRuleBinding {
  id            String    @id
  productId     String    @map("product_id")
  ruleType      String    @map("rule_type")
  ruleCode      String    @map("rule_code")
  ruleVersion   String    @map("rule_version")
  status        String    @default("active")
  effectiveFrom DateTime? @map("effective_from")
  effectiveTo   DateTime? @map("effective_to")
  createdAt     DateTime  @default(now()) @map("created_at")
  updatedAt     DateTime  @updatedAt @map("updated_at")

  product       Product   @relation(fields: [productId], references: [id])

  @@index([productId])
  @@index([ruleType])
  @@map("product_rule_bindings")
}
```



---



## 2\.3 ProductRegionRule



```Plain Text
model ProductRegionRule {
  id                String   @id
  productId          String   @map("product_id")
  countryCode        String   @map("country_code")
  regionStatus       String   @map("region_status")
  restrictionReason  String?  @map("restriction_reason")
  createdAt          DateTime @default(now()) @map("created_at")
  updatedAt          DateTime @updatedAt @map("updated_at")

  product            Product  @relation(fields: [productId], references: [id])

  @@unique([productId, countryCode])
  @@index([countryCode])
  @@map("product_region_rules")
}
```



---



## 2\.4 ProductVersion



```Plain Text
model ProductVersion {
  id            String   @id
  productId     String   @map("product_id")
  versionNo     String   @map("version_no")
  snapshotJson  Json     @map("snapshot_json")
  changeReason  String?  @map("change_reason")
  createdBy     String?  @map("created_by")
  approvedBy    String?  @map("approved_by")
  createdAt     DateTime @default(now()) @map("created_at")

  product       Product  @relation(fields: [productId], references: [id])

  @@index([productId])
  @@map("product_versions")
}
```



---



## 2\.5 ProductInventory



```Plain Text
model ProductInventory {
  id             String   @id
  productId      String   @map("product_id")
  warehouseId    String?  @map("warehouse_id")
  availableStock Int      @default(0) @map("available_stock")
  lockedStock    Int      @default(0) @map("locked_stock")
  soldStock      Int      @default(0) @map("sold_stock")
  returnedStock  Int      @default(0) @map("returned_stock")
  createdAt      DateTime @default(now()) @map("created_at")
  updatedAt      DateTime @updatedAt @map("updated_at")

  product        Product  @relation(fields: [productId], references: [id])

  @@index([productId])
  @@map("product_inventory")
}
```



---



## 2\.6 Product 模型补充关系



在已有 `Product` model 中补充：



```Plain Text
benefits      ProductBenefit[]
ruleBindings  ProductRuleBinding[]
regionRules   ProductRegionRule[]
versions      ProductVersion[]
inventory     ProductInventory[]
```



---



# 3\. Product Events



`apps/product-service/src/shared/product-events.ts`



```TypeScript
export const ProductEvents = {
  PRODUCT_CREATED: 'product.created.v1',
  PRODUCT_UPDATED: 'product.updated.v1',
  PRODUCT_SUBMITTED_FOR_REVIEW: 'product.submitted_for_review.v1',
  PRODUCT_APPROVED: 'product.approved.v1',
  PRODUCT_ACTIVATED: 'product.activated.v1',
  PRODUCT_PAUSED: 'product.paused.v1',
  PRODUCT_ARCHIVED: 'product.archived.v1',
  PRODUCT_BENEFIT_ADDED: 'product.benefit_added.v1',
  PRODUCT_RULE_BOUND: 'product.rule_bound.v1',
  PRODUCT_REGION_RULE_SET: 'product.region_rule_set.v1',
  PRODUCT_VERSION_CREATED: 'product.version_created.v1'
} as const;
```



---



# 4\. Product Errors



`apps/product-service/src/shared/product-errors.ts`



```TypeScript
export const ProductErrors = {
  PRODUCT_NOT_FOUND: 'PRODUCT_NOT_FOUND',
  PRODUCT_ALREADY_EXISTS: 'PRODUCT_ALREADY_EXISTS',
  PRODUCT_STATUS_INVALID: 'PRODUCT_STATUS_INVALID',
  PRODUCT_NOT_ACTIVE: 'PRODUCT_NOT_ACTIVE',
  PRODUCT_PRICE_INVALID: 'PRODUCT_PRICE_INVALID',
  PRODUCT_TYPE_INVALID: 'PRODUCT_TYPE_INVALID',
  PRODUCT_BENEFIT_INVALID: 'PRODUCT_BENEFIT_INVALID',
  PRODUCT_RULE_BINDING_INVALID: 'PRODUCT_RULE_BINDING_INVALID',
  PRODUCT_REGION_RULE_INVALID: 'PRODUCT_REGION_RULE_INVALID',
  PRODUCT_INVENTORY_NOT_FOUND: 'PRODUCT_INVENTORY_NOT_FOUND',
  PRODUCT_STOCK_INSUFFICIENT: 'PRODUCT_STOCK_INSUFFICIENT'
} as const;
```



---



# 5\. Product Status



`apps/product-service/src/shared/product-status.ts`



```TypeScript
export const ProductStatus = {
  DRAFT: 'draft',
  PENDING_REVIEW: 'pending_review',
  APPROVED: 'approved',
  ACTIVE: 'active',
  PAUSED: 'paused',
  SOLD_OUT: 'sold_out',
  INACTIVE: 'inactive',
  ARCHIVED: 'archived'
} as const;

export const ProductStatusTransitions: Record = {
  draft: ['pending_review', 'archived'],
  pending_review: ['approved', 'draft'],
  approved: ['active', 'inactive'],
  active: ['paused', 'sold_out', 'inactive'],
  paused: ['active', 'inactive'],
  sold_out: ['inactive'],
  inactive: ['active', 'archived'],
  archived: []
};

export function canTransitProductStatus(from: string, to: string): boolean {
  return ProductStatusTransitions[from]?.includes(to) ?? false;
}
```



---



# 6\. Product Types



`apps/product-service/src/shared/product-types.ts`



```TypeScript
export const ProductTypes = {
  WINE_369: 'wine_369',
  AEP_1: 'aep_1',
  AEP_2: 'aep_2',
  AEP_3: 'aep_3',
  AEP_4: 'aep_4',
  AEP_5: 'aep_5',
  MALL_GOODS: 'mall_goods',
  NFT_UPGRADE: 'nft_upgrade',
  AI_PACKAGE: 'ai_package',
  VIRTUAL_POINTS_PACKAGE: 'virtual_points_package',
  CORPORATE_SERVICE: 'corporate_service',
  EVENT_TICKET: 'event_ticket'
} as const;

export const BenefitTypes = {
  PHYSICAL_WINE: 'physical_wine',
  WINEPASS_NFT: 'winepass_nft',
  FJ369_POINTS_VALUE: 'fj369_points_value',
  CFJ369_POINTS: 'cfj369_points',
  TFJ369_CONVERT_QUOTA: 'tfj369_convert_quota',
  ECO_POWER: 'eco_power',
  DAPPX_COUPON: 'dappx_coupon',
  AI_QUOTA: 'ai_quota',
  VIRTUAL_POINTS: 'virtual_points',
  GAMING_QUALIFICATION: 'gaming_qualification',
  RELEASE_QUALIFICATION: 'release_qualification',
  NODE_QUALIFICATION: 'node_qualification',
  MEMBERSHIP_LEVEL: 'membership_level'
} as const;

export const RuleTypes = {
  REVENUE_RULE: 'revenue_rule',
  POINTS_RULE: 'points_rule',
  POWER_RULE: 'power_rule',
  REWARD_RULE: 'reward_rule',
  TAX_RULE: 'tax_rule',
  RISK_RULE: 'risk_rule',
  FULFILLMENT_RULE: 'fulfillment_rule',
  REGION_RULE: 'region_rule'
} as const;
```



---



# 7\. DTO：CreateProductDto



`apps/product-service/src/modules/products/dto/create-product.dto.ts`



```TypeScript
import {
  IsBoolean,
  IsOptional,
  IsString,
  MinLength
} from 'class-validator';

export class CreateProductDto {
  @IsString()
  product_type!: string;

  @IsString()
  @MinLength(2)
  product_name!: string;

  @IsOptional()
  @IsString()
  subtitle?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  price!: string;

  @IsString()
  currency!: string;

  @IsOptional()
  @IsString()
  tax_mode?: string;

  @IsOptional()
  stock?: number;

  @IsOptional()
  @IsBoolean()
  requires_kyc?: boolean;

  @IsOptional()
  @IsBoolean()
  requires_kyb?: boolean;

  @IsOptional()
  @IsBoolean()
  requires_wallet?: boolean;

  @IsOptional()
  @IsString()
  created_by?: string;
}
```



---



# 8\. DTO：UpdateProductDto



`apps/product-service/src/modules/products/dto/update-product.dto.ts`



```TypeScript
import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class UpdateProductDto {
  @IsOptional()
  @IsString()
  product_name?: string;

  @IsOptional()
  @IsString()
  subtitle?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  price?: string;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsString()
  tax_mode?: string;

  @IsOptional()
  @IsBoolean()
  requires_kyc?: boolean;

  @IsOptional()
  @IsBoolean()
  requires_kyb?: boolean;

  @IsOptional()
  @IsBoolean()
  requires_wallet?: boolean;

  @IsOptional()
  @IsString()
  change_reason?: string;

  @IsOptional()
  @IsString()
  updated_by?: string;
}
```



---



# 9\. DTO：AddProductBenefitDto



`apps/product-service/src/modules/products/dto/add-product-benefit.dto.ts`



```TypeScript
import { IsOptional, IsString, IsNumberString, IsInt } from 'class-validator';

export class AddProductBenefitDto {
  @IsString()
  benefit_type!: string;

  @IsString()
  benefit_name!: string;

  @IsOptional()
  @IsNumberString()
  benefit_value?: string;

  @IsOptional()
  @IsString()
  benefit_unit?: string;

  @IsOptional()
  @IsInt()
  effective_days?: number;

  @IsOptional()
  @IsString()
  rule_version?: string;
}
```



---



# 10\. DTO：BindProductRuleDto



`apps/product-service/src/modules/products/dto/bind-product-rule.dto.ts`



```TypeScript
import { IsOptional, IsString } from 'class-validator';

export class BindProductRuleDto {
  @IsString()
  rule_type!: string;

  @IsString()
  rule_code!: string;

  @IsString()
  rule_version!: string;

  @IsOptional()
  @IsString()
  effective_from?: string;

  @IsOptional()
  @IsString()
  effective_to?: string;
}
```



---



# 11\. DTO：SetProductRegionRuleDto



`apps/product-service/src/modules/products/dto/set-product-region-rule.dto.ts`



```TypeScript
import { IsOptional, IsString } from 'class-validator';

export class SetProductRegionRuleDto {
  @IsString()
  country_code!: string;

  @IsString()
  region_status!: 'allowed' | 'restricted' | 'blocked' | 'manual_review';

  @IsOptional()
  @IsString()
  restriction_reason?: string;
}
```



---



# 12\. DTO：QueryProductsDto



`apps/product-service/src/modules/products/dto/query-products.dto.ts`



```TypeScript
import { IsOptional, IsString } from 'class-validator';

export class QueryProductsDto {
  @IsOptional()
  @IsString()
  product_type?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  country_code?: string;

  @IsOptional()
  page?: number;

  @IsOptional()
  page_size?: number;
}
```



---



# 13\. Products Repository



`apps/product-service/src/modules/products/products.repository.ts`



```TypeScript
import { Injectable } from '@nestjs/common';
import { PrismaClient, Prisma } from '@prisma/client';
import { ulid } from 'ulid';

const prisma = new PrismaClient();

@Injectable()
export class ProductsRepository {
  findById(productId: string) {
    return prisma.product.findUnique({
      where: { id: productId },
      include: {
        benefits: true,
        ruleBindings: true,
        regionRules: true,
        inventory: true
      }
    });
  }

  findByNo(productNo: string) {
    return prisma.product.findUnique({
      where: { productNo }
    });
  }

  findMany(params: {
    productType?: string;
    status?: string;
    page: number;
    pageSize: number;
  }) {
    return prisma.product.findMany({
      where: {
        productType: params.productType,
        status: params.status,
        deletedAt: null
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip: (params.page - 1) * params.pageSize,
      take: params.pageSize,
      include: {
        benefits: true,
        ruleBindings: true
      }
    });
  }

  count(params: { productType?: string; status?: string }) {
    return prisma.product.count({
      where: {
        productType: params.productType,
        status: params.status,
        deletedAt: null
      }
    });
  }

  create(data: {
    productNo: string;
    productType: string;
    productName: string;
    subtitle?: string;
    description?: string;
    price: string;
    currency: string;
    taxMode?: string;
    requiresKyc?: boolean;
    requiresKyb?: boolean;
    requiresWallet?: boolean;
  }) {
    return prisma.product.create({
      data: {
        id: ulid(),
        productNo: data.productNo,
        productType: data.productType,
        productName: data.productName,
        subtitle: data.subtitle,
        description: data.description,
        price: new Prisma.Decimal(data.price),
        currency: data.currency,
        taxMode: data.taxMode || 'tax_excluded',
        status: 'draft',
        requiresKyc: data.requiresKyc ?? false,
        requiresKyb: data.requiresKyb ?? false,
        requiresWallet: data.requiresWallet ?? false
      }
    });
  }

  update(productId: string, data: Prisma.ProductUpdateInput) {
    return prisma.product.update({
      where: { id: productId },
      data
    });
  }

  createBenefit(data: {
    productId: string;
    benefitType: string;
    benefitName: string;
    benefitValue?: string;
    benefitUnit?: string;
    effectiveDays?: number;
    ruleVersion?: string;
  }) {
    return prisma.productBenefit.create({
      data: {
        id: ulid(),
        productId: data.productId,
        benefitType: data.benefitType,
        benefitName: data.benefitName,
        benefitValue: data.benefitValue
          ? new Prisma.Decimal(data.benefitValue)
          : undefined,
        benefitUnit: data.benefitUnit,
        effectiveDays: data.effectiveDays,
        ruleVersion: data.ruleVersion,
        status: 'active'
      }
    });
  }

  bindRule(data: {
    productId: string;
    ruleType: string;
    ruleCode: string;
    ruleVersion: string;
    effectiveFrom?: Date;
    effectiveTo?: Date;
  }) {
    return prisma.productRuleBinding.create({
      data: {
        id: ulid(),
        productId: data.productId,
        ruleType: data.ruleType,
        ruleCode: data.ruleCode,
        ruleVersion: data.ruleVersion,
        effectiveFrom: data.effectiveFrom,
        effectiveTo: data.effectiveTo,
        status: 'active'
      }
    });
  }

  upsertRegionRule(data: {
    productId: string;
    countryCode: string;
    regionStatus: string;
    restrictionReason?: string;
  }) {
    return prisma.productRegionRule.upsert({
      where: {
        productId_countryCode: {
          productId: data.productId,
          countryCode: data.countryCode
        }
      },
      create: {
        id: ulid(),
        productId: data.productId,
        countryCode: data.countryCode,
        regionStatus: data.regionStatus,
        restrictionReason: data.restrictionReason
      },
      update: {
        regionStatus: data.regionStatus,
        restrictionReason: data.restrictionReason
      }
    });
  }

  createVersion(data: {
    productId: string;
    versionNo: string;
    snapshotJson: Prisma.InputJsonValue;
    changeReason?: string;
    createdBy?: string;
    approvedBy?: string;
  }) {
    return prisma.productVersion.create({
      data: {
        id: ulid(),
        productId: data.productId,
        versionNo: data.versionNo,
        snapshotJson: data.snapshotJson,
        changeReason: data.changeReason,
        createdBy: data.createdBy,
        approvedBy: data.approvedBy
      }
    });
  }

  createInventory(data: {
    productId: string;
    availableStock: number;
  }) {
    return prisma.productInventory.create({
      data: {
        id: ulid(),
        productId: data.productId,
        availableStock: data.availableStock,
        lockedStock: 0,
        soldStock: 0,
        returnedStock: 0
      }
    });
  }
}
```



> 注意：如果你的 Prisma 版本生成的复合唯一字段名不同，`productId_countryCode` 需要按 Prisma 实际生成名称调整。
> 
> 



---



# 14\. Products Service



`apps/product-service/src/modules/products/products.service.ts`



```TypeScript
import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ulid } from 'ulid';
import { ProductsRepository } from './products.repository';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { AddProductBenefitDto } from './dto/add-product-benefit.dto';
import { BindProductRuleDto } from './dto/bind-product-rule.dto';
import { SetProductRegionRuleDto } from './dto/set-product-region-rule.dto';
import { QueryProductsDto } from './dto/query-products.dto';
import { ProductErrors } from '../../shared/product-errors';
import {
  canTransitProductStatus,
  ProductStatus
} from '../../shared/product-status';

@Injectable()
export class ProductsService {
  constructor(private readonly productsRepository: ProductsRepository) {}

  async create(dto: CreateProductDto) {
    const product = await this.productsRepository.create({
      productNo: this.generateProductNo(),
      productType: dto.product_type,
      productName: dto.product_name,
      subtitle: dto.subtitle,
      description: dto.description,
      price: dto.price,
      currency: dto.currency,
      taxMode: dto.tax_mode,
      requiresKyc: dto.requires_kyc,
      requiresKyb: dto.requires_kyb,
      requiresWallet: dto.requires_wallet
    });

    if (typeof dto.stock === 'number') {
      await this.productsRepository.createInventory({
        productId: product.id,
        availableStock: dto.stock
      });
    }

    await this.createVersion(product.id, '1.0', 'initial create', dto.created_by);

    return {
      product_id: product.id,
      product_no: product.productNo,
      product_type: product.productType,
      product_name: product.productName,
      price: product.price.toString(),
      currency: product.currency,
      status: product.status
    };
  }

  async update(productId: string, dto: UpdateProductDto) {
    const product = await this.productsRepository.findById(productId);

    if (!product) {
      throw new Error(ProductErrors.PRODUCT_NOT_FOUND);
    }

    if (![ProductStatus.DRAFT, ProductStatus.INACTIVE, ProductStatus.PAUSED].includes(product.status as any)) {
      throw new Error(ProductErrors.PRODUCT_STATUS_INVALID);
    }

    const updated = await this.productsRepository.update(productId, {
      productName: dto.product_name,
      subtitle: dto.subtitle,
      description: dto.description,
      price: dto.price ? new Prisma.Decimal(dto.price) : undefined,
      currency: dto.currency,
      taxMode: dto.tax_mode,
      requiresKyc: dto.requires_kyc,
      requiresKyb: dto.requires_kyb,
      requiresWallet: dto.requires_wallet
    });

    await this.createVersion(
      productId,
      this.nextVersionNo(),
      dto.change_reason || 'product updated',
      dto.updated_by
    );

    return {
      product_id: updated.id,
      product_no: updated.productNo,
      status: updated.status
    };
  }

  async list(query: QueryProductsDto) {
    const page = Number(query.page || 1);
    const pageSize = Math.min(Number(query.page_size || 20), 100);

    const [items, total] = await Promise.all([
      this.productsRepository.findMany({
        productType: query.product_type,
        status: query.status,
        page,
        pageSize
      }),
      this.productsRepository.count({
        productType: query.product_type,
        status: query.status
      })
    ]);

    return {
      items: items.map((item) => ({
        product_id: item.id,
        product_no: item.productNo,
        product_type: item.productType,
        product_name: item.productName,
        price: item.price.toString(),
        currency: item.currency,
        status: item.status,
        requires_kyc: item.requiresKyc,
        requires_wallet: item.requiresWallet,
        benefits: item.benefits?.map((b) => ({
          benefit_type: b.benefitType,
          benefit_name: b.benefitName,
          benefit_value: b.benefitValue?.toString()
        }))
      })),
      pagination: {
        page,
        page_size: pageSize,
        total,
        total_pages: Math.ceil(total / pageSize)
      }
    };
  }

  async detail(productId: string) {
    const product = await this.productsRepository.findById(productId);

    if (!product) {
      throw new Error(ProductErrors.PRODUCT_NOT_FOUND);
    }

    return {
      product_id: product.id,
      product_no: product.productNo,
      product_type: product.productType,
      product_name: product.productName,
      subtitle: product.subtitle,
      description: product.description,
      price: product.price.toString(),
      currency: product.currency,
      tax_mode: product.taxMode,
      status: product.status,
      requires_kyc: product.requiresKyc,
      requires_kyb: product.requiresKyb,
      requires_wallet: product.requiresWallet,
      benefits: product.benefits.map((b) => ({
        benefit_id: b.id,
        benefit_type: b.benefitType,
        benefit_name: b.benefitName,
        benefit_value: b.benefitValue?.toString(),
        benefit_unit: b.benefitUnit,
        effective_days: b.effectiveDays,
        status: b.status,
        rule_version: b.ruleVersion
      })),
      rule_bindings: product.ruleBindings.map((r) => ({
        binding_id: r.id,
        rule_type: r.ruleType,
        rule_code: r.ruleCode,
        rule_version: r.ruleVersion,
        status: r.status
      })),
      region_rules: product.regionRules.map((r) => ({
        country_code: r.countryCode,
        region_status: r.regionStatus,
        restriction_reason: r.restrictionReason
      }))
    };
  }

  async addBenefit(productId: string, dto: AddProductBenefitDto) {
    const product = await this.productsRepository.findById(productId);

    if (!product) {
      throw new Error(ProductErrors.PRODUCT_NOT_FOUND);
    }

    if (![ProductStatus.DRAFT, ProductStatus.APPROVED, ProductStatus.INACTIVE].includes(product.status as any)) {
      throw new Error(ProductErrors.PRODUCT_STATUS_INVALID);
    }

    const benefit = await this.productsRepository.createBenefit({
      productId,
      benefitType: dto.benefit_type,
      benefitName: dto.benefit_name,
      benefitValue: dto.benefit_value,
      benefitUnit: dto.benefit_unit,
      effectiveDays: dto.effective_days,
      ruleVersion: dto.rule_version
    });

    await this.createVersion(productId, this.nextVersionNo(), 'benefit added');

    return {
      benefit_id: benefit.id,
      product_id: benefit.productId,
      benefit_type: benefit.benefitType,
      benefit_name: benefit.benefitName,
      benefit_value: benefit.benefitValue?.toString(),
      status: benefit.status
    };
  }

  async bindRule(productId: string, dto: BindProductRuleDto) {
    const product = await this.productsRepository.findById(productId);

    if (!product) {
      throw new Error(ProductErrors.PRODUCT_NOT_FOUND);
    }

    const binding = await this.productsRepository.bindRule({
      productId,
      ruleType: dto.rule_type,
      ruleCode: dto.rule_code,
      ruleVersion: dto.rule_version,
      effectiveFrom: dto.effective_from ? new Date(dto.effective_from) : undefined,
      effectiveTo: dto.effective_to ? new Date(dto.effective_to) : undefined
    });

    await this.createVersion(productId, this.nextVersionNo(), 'rule binding added');

    return {
      binding_id: binding.id,
      product_id: binding.productId,
      rule_type: binding.ruleType,
      rule_code: binding.ruleCode,
      rule_version: binding.ruleVersion,
      status: binding.status
    };
  }

  async setRegionRule(productId: string, dto: SetProductRegionRuleDto) {
    const product = await this.productsRepository.findById(productId);

    if (!product) {
      throw new Error(ProductErrors.PRODUCT_NOT_FOUND);
    }

    const rule = await this.productsRepository.upsertRegionRule({
      productId,
      countryCode: dto.country_code,
      regionStatus: dto.region_status,
      restrictionReason: dto.restriction_reason
    });

    await this.createVersion(productId, this.nextVersionNo(), 'region rule changed');

    return {
      product_id: rule.productId,
      country_code: rule.countryCode,
      region_status: rule.regionStatus,
      restriction_reason: rule.restrictionReason
    };
  }

  async submitReview(productId: string) {
    return this.changeStatus(productId, ProductStatus.PENDING_REVIEW);
  }

  async approve(productId: string, approvedBy?: string) {
    const updated = await this.changeStatus(productId, ProductStatus.APPROVED);
    await this.createVersion(productId, this.nextVersionNo(), 'product approved', undefined, approvedBy);
    return updated;
  }

  async activate(productId: string) {
    return this.changeStatus(productId, ProductStatus.ACTIVE);
  }

  async pause(productId: string) {
    return this.changeStatus(productId, ProductStatus.PAUSED);
  }

  async inactive(productId: string) {
    return this.changeStatus(productId, ProductStatus.INACTIVE);
  }

  private async changeStatus(productId: string, toStatus: string) {
    const product = await this.productsRepository.findById(productId);

    if (!product) {
      throw new Error(ProductErrors.PRODUCT_NOT_FOUND);
    }

    if (!canTransitProductStatus(product.status, toStatus)) {
      throw new Error(ProductErrors.PRODUCT_STATUS_INVALID);
    }

    const updated = await this.productsRepository.update(productId, {
      status: toStatus
    });

    return {
      product_id: updated.id,
      product_no: updated.productNo,
      from_status: product.status,
      to_status: updated.status
    };
  }

  private async createVersion(
    productId: string,
    versionNo: string,
    reason?: string,
    createdBy?: string,
    approvedBy?: string
  ) {
    const product = await this.productsRepository.findById(productId);

    if (!product) return;

    return this.productsRepository.createVersion({
      productId,
      versionNo,
      snapshotJson: product as unknown as Prisma.InputJsonValue,
      changeReason: reason,
      createdBy,
      approvedBy
    });
  }

  private generateProductNo() {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    return `PRD${date}${ulid()}`;
  }

  private nextVersionNo() {
    return `v${Date.now()}`;
  }
}
```



---



# 15\. Products User Controller



`apps/product-service/src/modules/products/products.controller.ts`



```TypeScript
import { Controller, Get, Param, Query } from '@nestjs/common';
import { ProductsService } from './products.service';
import { QueryProductsDto } from './dto/query-products.dto';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  list(@Query() query: QueryProductsDto) {
    return this.productsService.list(query);
  }

  @Get(':product_id')
  detail(@Param('product_id') productId: string) {
    return this.productsService.detail(productId);
  }
}
```



---



# 16\. Products Admin Controller



`apps/product-service/src/modules/products/products.admin.controller.ts`



```TypeScript
import { Body, Controller, Param, Post, Put } from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { AddProductBenefitDto } from './dto/add-product-benefit.dto';
import { BindProductRuleDto } from './dto/bind-product-rule.dto';
import { SetProductRegionRuleDto } from './dto/set-product-region-rule.dto';

@Controller('admin/products')
export class ProductsAdminController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  create(@Body() dto: CreateProductDto) {
    return this.productsService.create(dto);
  }

  @Put(':product_id')
  update(
    @Param('product_id') productId: string,
    @Body() dto: UpdateProductDto
  ) {
    return this.productsService.update(productId, dto);
  }

  @Post(':product_id/benefits')
  addBenefit(
    @Param('product_id') productId: string,
    @Body() dto: AddProductBenefitDto
  ) {
    return this.productsService.addBenefit(productId, dto);
  }

  @Post(':product_id/rules')
  bindRule(
    @Param('product_id') productId: string,
    @Body() dto: BindProductRuleDto
  ) {
    return this.productsService.bindRule(productId, dto);
  }

  @Post(':product_id/region-rules')
  setRegionRule(
    @Param('product_id') productId: string,
    @Body() dto: SetProductRegionRuleDto
  ) {
    return this.productsService.setRegionRule(productId, dto);
  }

  @Post(':product_id/submit-review')
  submitReview(@Param('product_id') productId: string) {
    return this.productsService.submitReview(productId);
  }

  @Post(':product_id/approve')
  approve(
    @Param('product_id') productId: string,
    @Body() dto: { approved_by?: string }
  ) {
    return this.productsService.approve(productId, dto.approved_by);
  }

  @Post(':product_id/activate')
  activate(@Param('product_id') productId: string) {
    return this.productsService.activate(productId);
  }

  @Post(':product_id/pause')
  pause(@Param('product_id') productId: string) {
    return this.productsService.pause(productId);
  }

  @Post(':product_id/inactive')
  inactive(@Param('product_id') productId: string) {
    return this.productsService.inactive(productId);
  }
}
```



---



# 17\. Products Module



`apps/product-service/src/modules/products/products.module.ts`



```TypeScript
import { Module } from '@nestjs/common';
import { ProductsController } from './products.controller';
import { ProductsAdminController } from './products.admin.controller';
import { ProductsService } from './products.service';
import { ProductsRepository } from './products.repository';

@Module({
  controllers: [ProductsController, ProductsAdminController],
  providers: [ProductsService, ProductsRepository],
  exports: [ProductsService]
})
export class ProductsModule {}
```



---



# 18\. Bootstrap Products Service



用于初始化福建老酒 369 和 AEP 商品。



`apps/product-service/src/modules/bootstrap-products/bootstrap-products.service.ts`



```TypeScript
import { Injectable } from '@nestjs/common';
import { ProductsService } from '../products/products.service';
import { BenefitTypes, ProductTypes, RuleTypes } from '../../shared/product-types';

@Injectable()
export class BootstrapProductsService {
  constructor(private readonly productsService: ProductsService) {}

  async bootstrapWine369() {
    const product = await this.productsService.create({
      product_type: ProductTypes.WINE_369,
      product_name: '福建老酒 369 标准权益包',
      subtitle: '福建老酒 + WinePass NFT + FJ369 Points 权益值',
      description: '福建老酒 369 全球生态标准权益包',
      price: '369',
      currency: 'USD',
      tax_mode: 'tax_excluded',
      stock: 1000000,
      requires_kyc: true,
      requires_wallet: true,
      created_by: 'system'
    });

    const productId = product.product_id;

    await this.productsService.addBenefit(productId, {
      benefit_type: BenefitTypes.PHYSICAL_WINE,
      benefit_name: '福建老酒实物权益',
      benefit_value: '1',
      benefit_unit: 'bottle'
    });

    await this.productsService.addBenefit(productId, {
      benefit_type: BenefitTypes.WINEPASS_NFT,
      benefit_name: 'WinePass NFT',
      benefit_value: '1',
      benefit_unit: 'nft'
    });

    await this.productsService.addBenefit(productId, {
      benefit_type: BenefitTypes.FJ369_POINTS_VALUE,
      benefit_name: 'FJ369 Points 权益值',
      benefit_value: '369000',
      benefit_unit: 'points'
    });

    await this.productsService.addBenefit(productId, {
      benefit_type: BenefitTypes.CFJ369_POINTS,
      benefit_name: 'cFJ369 贡献积分',
      benefit_value: '3690',
      benefit_unit: 'points',
      rule_version: 'WINE_369_POINTS_RULE_V1'
    });

    await this.productsService.addBenefit(productId, {
      benefit_type: BenefitTypes.TFJ369_CONVERT_QUOTA,
      benefit_name: 'tFJ369 转换资格',
      benefit_value: '1',
      benefit_unit: 'qualification'
    });

    await this.productsService.addBenefit(productId, {
      benefit_type: BenefitTypes.ECO_POWER,
      benefit_name: '生态算力参与资格',
      benefit_value: '3690',
      benefit_unit: 'power'
    });

    await this.productsService.bindRule(productId, {
      rule_type: RuleTypes.REVENUE_RULE,
      rule_code: 'WINE_369_REVENUE_RULE',
      rule_version: '1.0'
    });

    await this.productsService.bindRule(productId, {
      rule_type: RuleTypes.POINTS_RULE,
      rule_code: 'WINE_369_POINTS_RULE',
      rule_version: '1.0'
    });

    await this.productsService.bindRule(productId, {
      rule_type: RuleTypes.REWARD_RULE,
      rule_code: 'WINE_369_REWARD_RULE',
      rule_version: '1.0'
    });

    await this.productsService.bindRule(productId, {
      rule_type: RuleTypes.TAX_RULE,
      rule_code: 'REGION_TAX_RULE',
      rule_version: '1.0'
    });

    await this.productsService.submitReview(productId);
    await this.productsService.approve(productId, 'system');
    await this.productsService.activate(productId);

    return this.productsService.detail(productId);
  }

  async bootstrapAepProducts() {
    const configs = [
      { type: ProductTypes.AEP_1, name: 'AEP-1 火种算力权益包', price: '99', power: '100' },
      { type: ProductTypes.AEP_2, name: 'AEP-2 标准算力权益包', price: '369', power: '500' },
      { type: ProductTypes.AEP_3, name: 'AEP-3 增强算力权益包', price: '999', power: '1800' },
      { type: ProductTypes.AEP_4, name: 'AEP-4 节点算力权益包', price: '3690', power: '8000' }
    ];

    const results = [];

    for (const cfg of configs) {
      const product = await this.productsService.create({
        product_type: cfg.type,
        product_name: cfg.name,
        price: cfg.price,
        currency: 'USD',
        tax_mode: 'tax_excluded',
        stock: 100000,
        requires_kyc: true,
        requires_wallet: true,
        created_by: 'system'
      });

      await this.productsService.addBenefit(product.product_id, {
        benefit_type: BenefitTypes.ECO_POWER,
        benefit_name: 'AEP 基础算力',
        benefit_value: cfg.power,
        benefit_unit: 'power'
      });

      await this.productsService.bindRule(product.product_id, {
        rule_type: RuleTypes.POWER_RULE,
        rule_code: 'AEP_POWER_RULE',
        rule_version: '1.0'
      });

      await this.productsService.submitReview(product.product_id);
      await this.productsService.approve(product.product_id, 'system');
      await this.productsService.activate(product.product_id);

      results.push(await this.productsService.detail(product.product_id));
    }

    return results;
  }
}
```



---



# 19\. Bootstrap Products Module



`apps/product-service/src/modules/bootstrap-products/bootstrap-products.module.ts`



```TypeScript
import { Module } from '@nestjs/common';
import { ProductsModule } from '../products/products.module';
import { BootstrapProductsService } from './bootstrap-products.service';

@Module({
  imports: [ProductsModule],
  providers: [BootstrapProductsService],
  exports: [BootstrapProductsService]
})
export class BootstrapProductsModule {}
```



---



# 20\. Bootstrap Admin Controller



可选：用于开发/测试环境初始化商品。



`apps/product-service/src/modules/bootstrap-products/bootstrap-products.controller.ts`



```TypeScript
import { Controller, Post } from '@nestjs/common';
import { BootstrapProductsService } from './bootstrap-products.service';

@Controller('admin/bootstrap-products')
export class BootstrapProductsController {
  constructor(private readonly bootstrapProductsService: BootstrapProductsService) {}

  @Post('wine-369')
  bootstrapWine369() {
    return this.bootstrapProductsService.bootstrapWine369();
  }

  @Post('aep')
  bootstrapAepProducts() {
    return this.bootstrapProductsService.bootstrapAepProducts();
  }
}
```



然后修改 `bootstrap-products.module.ts`：



```TypeScript
import { Module } from '@nestjs/common';
import { ProductsModule } from '../products/products.module';
import { BootstrapProductsService } from './bootstrap-products.service';
import { BootstrapProductsController } from './bootstrap-products.controller';

@Module({
  imports: [ProductsModule],
  controllers: [BootstrapProductsController],
  providers: [BootstrapProductsService],
  exports: [BootstrapProductsService]
})
export class BootstrapProductsModule {}
```



---



# 21\. Product App Module



`apps/product-service/src/app.module.ts`



```TypeScript
import { Module } from '@nestjs/common';
import { HealthModule } from './health/health.module';
import { ProductsModule } from './modules/products/products.module';
import { BootstrapProductsModule } from './modules/bootstrap-products/bootstrap-products.module';

@Module({
  imports: [
    HealthModule,
    ProductsModule,
    BootstrapProductsModule
  ]
})
export class AppModule {}
```



---



# 22\. Product Service 当前 API



## 用户端



```HTTP
GET /api/v1/products
GET /api/v1/products/:product_id
```



---



## 后台端



```HTTP
POST /api/v1/admin/products
PUT /api/v1/admin/products/:product_id
POST /api/v1/admin/products/:product_id/benefits
POST /api/v1/admin/products/:product_id/rules
POST /api/v1/admin/products/:product_id/region-rules
POST /api/v1/admin/products/:product_id/submit-review
POST /api/v1/admin/products/:product_id/approve
POST /api/v1/admin/products/:product_id/activate
POST /api/v1/admin/products/:product_id/pause
POST /api/v1/admin/products/:product_id/inactive
```



---



## 初始化接口



```HTTP
POST /api/v1/admin/bootstrap-products/wine-369
POST /api/v1/admin/bootstrap-products/aep
```



---



# 23\. Product Service 已具备能力



这一版完成后，Product Service 已经支持：



```Plain Text
商品创建
商品修改
商品列表
商品详情
商品权益配置
商品规则绑定
商品地区限制
商品状态机
商品提交审核
商品审核通过
商品上架
商品暂停
商品下架
商品版本快照
福建老酒 369 标准权益包初始化
AEP 算力权益包初始化
```



---



# 24\. 还需要补强的工业级能力



下一步基础库完善后需要补：



```Plain Text
统一 AppException
统一 PrismaModule 注入
Admin 权限 Guard
审批流接入
Outbox 事件
Audit Log
商品库存锁定接口
商品库存释放接口
商品库存扣减接口
商品规则从 Rule Service / Config Center 查询
商品版本号严格递增
初始化接口限制仅 development / admin 可调用
```



---



# 25\. 下一步继续



按 23 个 Service 顺序，下一步写：



```Plain Text
4. Order Service 订单服务
```



Order Service 第一版会包含：



```Plain Text
订单创建
订单查询
订单状态机
订单取消
订单支付成功处理
订单风控冻结
订单履约状态
订单事件 OrderCreated / OrderPaid
创建订单时读取 Product Service 商品快照
生成 order_items
绑定推荐人 / team_chain / node_chain 预留
幂等创建订单预留
```



需要补充数据库：



```Plain Text
orders
order_items
order_status_logs
fulfillments
fulfillment_items
```



