# H031\-15 个 Service：DAppX Mall Service 商城服务

下面继续第 15 个 Service：DAppX Mall Service 商城服务。



# 第 15 个 Service：DAppX Mall Service 商城服务



本服务负责：



```Plain Text
商户管理
商城商品管理
商城订单
组合支付预留
积分 / Token / 优惠券消费预留
商户结算
商城风控状态
MallOrderCreated / MallOrderPaid / MerchantSettlementCreated 事件预留
```



---



# 1\. DAppX Mall Service 目录结构



```Plain Text
apps/dappx-mall-service/
├── src/
│   ├── app.module.ts
│   ├── main.ts
│   ├── health/
│   ├── shared/
│   │   ├── mall-errors.ts
│   │   ├── mall-events.ts
│   │   └── mall-status.ts
│   └── modules/
│       ├── merchants/
│       │   ├── merchants.module.ts
│       │   ├── merchants.controller.ts
│       │   ├── merchants.admin.controller.ts
│       │   ├── merchants.repository.ts
│       │   ├── merchants.service.ts
│       │   └── dto/
│       │       ├── create-merchant.dto.ts
│       │       ├── approve-merchant.dto.ts
│       │       └── query-merchants.dto.ts
│       ├── mall-products/
│       │   ├── mall-products.module.ts
│       │   ├── mall-products.controller.ts
│       │   ├── mall-products.admin.controller.ts
│       │   ├── mall-products.repository.ts
│       │   ├── mall-products.service.ts
│       │   └── dto/
│       │       ├── create-mall-product.dto.ts
│       │       └── query-mall-products.dto.ts
│       ├── mall-orders/
│       │   ├── mall-orders.module.ts
│       │   ├── mall-orders.controller.ts
│       │   ├── mall-orders.admin.controller.ts
│       │   ├── mall-orders.repository.ts
│       │   ├── mall-orders.service.ts
│       │   └── dto/
│       │       ├── create-mall-order.dto.ts
│       │       ├── pay-mall-order.dto.ts
│       │       └── query-mall-orders.dto.ts
│       └── settlements/
│           ├── settlements.module.ts
│           ├── settlements.controller.ts
│           ├── settlements.admin.controller.ts
│           ├── settlements.repository.ts
│           ├── settlements.service.ts
│           └── dto/
│               ├── create-merchant-settlement.dto.ts
│               └── approve-merchant-settlement.dto.ts
```



---



# 2\. Prisma 补充表



## 2\.1 MallMerchant



```Plain Text
model MallMerchant {
  id              String    @id
  merchantNo      String    @unique @map("merchant_no")
  merchantName    String    @map("merchant_name")
  ownerUserId     String    @map("owner_user_id")
  countryCode     String    @map("country_code")
  kybStatus       String    @default("pending") @map("kyb_status")
  merchantStatus  String    @default("pending_review") @map("merchant_status")
  settlementWallet String?  @map("settlement_wallet")
  settlementCurrency String @default("USD") @map("settlement_currency")
  commissionRate  Decimal   @default(0) @map("commission_rate") @db.Decimal(36, 18)
  approvedBy      String?   @map("approved_by")
  approvedAt      DateTime? @map("approved_at")
  suspendedAt     DateTime? @map("suspended_at")
  createdAt       DateTime  @default(now()) @map("created_at")
  updatedAt       DateTime  @updatedAt @map("updated_at")
  metadata        Json?

  products        MallProduct[]
  orders          MallOrder[]

  @@index([ownerUserId])
  @@index([merchantStatus])
  @@map("mall_merchants")
}
```



## 2\.2 MallProduct



```Plain Text
model MallProduct {
  id              String   @id
  productNo       String   @unique @map("product_no")
  merchantId      String   @map("merchant_id")
  productName     String   @map("product_name")
  productType     String   @map("product_type")
  price           Decimal  @db.Decimal(36, 18)
  currency        String
  stock           Int      @default(0)
  lockedStock     Int      @default(0) @map("locked_stock")
  soldStock       Int      @default(0) @map("sold_stock")
  status          String   @default("draft")
  createdAt       DateTime @default(now()) @map("created_at")
  updatedAt       DateTime @updatedAt @map("updated_at")
  metadata        Json?

  merchant        MallMerchant @relation(fields: [merchantId], references: [id])

  @@index([merchantId])
  @@index([status])
  @@map("mall_products")
}
```



## 2\.3 MallOrder



```Plain Text
model MallOrder {
  id              String    @id
  orderNo         String    @unique @map("order_no")
  userId          String    @map("user_id")
  merchantId      String    @map("merchant_id")
  productId       String    @map("product_id")
  quantity        Int
  unitPrice       Decimal   @map("unit_price") @db.Decimal(36, 18)
  totalAmount     Decimal   @map("total_amount") @db.Decimal(36, 18)
  discountAmount  Decimal   @default(0) @map("discount_amount") @db.Decimal(36, 18)
  payableAmount   Decimal   @map("payable_amount") @db.Decimal(36, 18)
  currency        String
  orderStatus     String    @default("pending_payment") @map("order_status")
  paymentStatus   String    @default("unpaid") @map("payment_status")
  settlementStatus String   @default("pending") @map("settlement_status")
  riskStatus      String    @default("normal") @map("risk_status")
  paidAt          DateTime? @map("paid_at")
  createdAt       DateTime  @default(now()) @map("created_at")
  updatedAt       DateTime  @updatedAt @map("updated_at")
  metadata        Json?

  merchant        MallMerchant @relation(fields: [merchantId], references: [id])

  @@index([userId])
  @@index([merchantId])
  @@index([orderStatus])
  @@map("mall_orders")
}
```



## 2\.4 MerchantSettlement



```Plain Text
model MerchantSettlement {
  id              String    @id
  settlementNo    String    @unique @map("settlement_no")
  merchantId      String    @map("merchant_id")
  period          String
  grossAmount     Decimal   @map("gross_amount") @db.Decimal(36, 18)
  commissionAmount Decimal  @map("commission_amount") @db.Decimal(36, 18)
  taxAmount       Decimal   @default(0) @map("tax_amount") @db.Decimal(36, 18)
  netAmount       Decimal   @map("net_amount") @db.Decimal(36, 18)
  currency        String
  settlementStatus String   @default("pending") @map("settlement_status")
  approvedBy      String?   @map("approved_by")
  approvedAt      DateTime? @map("approved_at")
  paidAt          DateTime? @map("paid_at")
  createdAt       DateTime  @default(now()) @map("created_at")
  updatedAt       DateTime  @updatedAt @map("updated_at")
  metadata        Json?

  @@index([merchantId])
  @@index([period])
  @@index([settlementStatus])
  @@map("merchant_settlements")
}
```



---



# 3\. Shared 常量



`apps/dappx-mall-service/src/shared/mall-events.ts`



```TypeScript
export const MallEvents = {
  MERCHANT_CREATED: 'mall.merchant_created.v1',
  MERCHANT_APPROVED: 'mall.merchant_approved.v1',
  MALL_PRODUCT_CREATED: 'mall.product_created.v1',
  MALL_ORDER_CREATED: 'mall.order_created.v1',
  MALL_ORDER_PAID: 'mall.order_paid.v1',
  MERCHANT_SETTLEMENT_CREATED: 'mall.merchant_settlement_created.v1',
  MERCHANT_SETTLEMENT_APPROVED: 'mall.merchant_settlement_approved.v1'
} as const;
```



`apps/dappx-mall-service/src/shared/mall-errors.ts`



```TypeScript
export const MallErrors = {
  MERCHANT_NOT_FOUND: 'MALL_MERCHANT_NOT_FOUND',
  MERCHANT_ALREADY_EXISTS: 'MALL_MERCHANT_ALREADY_EXISTS',
  MERCHANT_STATUS_INVALID: 'MALL_MERCHANT_STATUS_INVALID',
  PRODUCT_NOT_FOUND: 'MALL_PRODUCT_NOT_FOUND',
  PRODUCT_STATUS_INVALID: 'MALL_PRODUCT_STATUS_INVALID',
  STOCK_INSUFFICIENT: 'MALL_STOCK_INSUFFICIENT',
  ORDER_NOT_FOUND: 'MALL_ORDER_NOT_FOUND',
  ORDER_STATUS_INVALID: 'MALL_ORDER_STATUS_INVALID',
  SETTLEMENT_NOT_FOUND: 'MALL_SETTLEMENT_NOT_FOUND',
  SETTLEMENT_STATUS_INVALID: 'MALL_SETTLEMENT_STATUS_INVALID',
  AMOUNT_INVALID: 'MALL_AMOUNT_INVALID'
} as const;
```



`apps/dappx-mall-service/src/shared/mall-status.ts`



```TypeScript
export const MerchantStatus = {
  PENDING_REVIEW: 'pending_review',
  ACTIVE: 'active',
  SUSPENDED: 'suspended',
  REJECTED: 'rejected'
} as const;

export const MallProductStatus = {
  DRAFT: 'draft',
  ACTIVE: 'active',
  PAUSED: 'paused',
  SOLD_OUT: 'sold_out',
  ARCHIVED: 'archived'
} as const;

export const MallOrderStatus = {
  PENDING_PAYMENT: 'pending_payment',
  PAID: 'paid',
  FULFILLING: 'fulfilling',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  REFUNDED: 'refunded'
} as const;

export const MerchantSettlementStatus = {
  PENDING: 'pending',
  APPROVED: 'approved',
  PAID: 'paid',
  REJECTED: 'rejected'
} as const;
```



---



# 4\. Merchants DTO / Repository / Service



`apps/dappx-mall-service/src/modules/merchants/dto/create-merchant.dto.ts`



```TypeScript
import { IsOptional, IsString } from 'class-validator';

export class CreateMerchantDto {
  @IsString()
  merchant_name!: string;

  @IsString()
  owner_user_id!: string;

  @IsString()
  country_code!: string;

  @IsOptional()
  @IsString()
  settlement_wallet?: string;

  @IsOptional()
  @IsString()
  settlement_currency?: string;

  @IsOptional()
  @IsString()
  commission_rate?: string;
}
```



`apps/dappx-mall-service/src/modules/merchants/dto/approve-merchant.dto.ts`



```TypeScript
import { IsOptional, IsString } from 'class-validator';

export class ApproveMerchantDto {
  @IsString()
  reviewer_id!: string;

  @IsOptional()
  @IsString()
  review_note?: string;
}
```



`apps/dappx-mall-service/src/modules/merchants/dto/query-merchants.dto.ts`



```TypeScript
import { IsOptional, IsString } from 'class-validator';

export class QueryMerchantsDto {
  @IsOptional()
  @IsString()
  owner_user_id?: string;

  @IsOptional()
  @IsString()
  merchant_status?: string;

  @IsOptional()
  page?: number;

  @IsOptional()
  page_size?: number;
}
```



`apps/dappx-mall-service/src/modules/merchants/merchants.repository.ts`



```TypeScript
import { Injectable } from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';
import { ulid } from 'ulid';

const prisma = new PrismaClient();

@Injectable()
export class MerchantsRepository {
  findById(merchantId: string) {
    return prisma.mallMerchant.findUnique({ where: { id: merchantId } });
  }

  findByOwner(ownerUserId: string) {
    return prisma.mallMerchant.findFirst({ where: { ownerUserId } });
  }

  findMany(params: {
    ownerUserId?: string;
    merchantStatus?: string;
    page: number;
    pageSize: number;
  }) {
    return prisma.mallMerchant.findMany({
      where: {
        ownerUserId: params.ownerUserId,
        merchantStatus: params.merchantStatus
      },
      orderBy: { createdAt: 'desc' },
      skip: (params.page - 1) * params.pageSize,
      take: params.pageSize
    });
  }

  count(params: { ownerUserId?: string; merchantStatus?: string }) {
    return prisma.mallMerchant.count({
      where: {
        ownerUserId: params.ownerUserId,
        merchantStatus: params.merchantStatus
      }
    });
  }

  create(data: {
    merchantNo: string;
    merchantName: string;
    ownerUserId: string;
    countryCode: string;
    settlementWallet?: string;
    settlementCurrency: string;
    commissionRate: string;
  }) {
    return prisma.$transaction(async (tx) => {
      const merchant = await tx.mallMerchant.create({
        data: {
          id: ulid(),
          merchantNo: data.merchantNo,
          merchantName: data.merchantName,
          ownerUserId: data.ownerUserId,
          countryCode: data.countryCode,
          settlementWallet: data.settlementWallet,
          settlementCurrency: data.settlementCurrency,
          commissionRate: new Prisma.Decimal(data.commissionRate),
          merchantStatus: 'pending_review'
        }
      });

      await tx.outboxEvent.create({
        data: {
          id: ulid(),
          eventType: 'mall.merchant_created.v1',
          payload: {
            merchant_id: merchant.id,
            merchant_no: merchant.merchantNo,
            owner_user_id: merchant.ownerUserId
          },
          status: 'pending',
          retryCount: 0
        }
      });

      return merchant;
    });
  }

  approve(merchantId: string, reviewerId: string, reviewNote?: string) {
    return prisma.$transaction(async (tx) => {
      const merchant = await tx.mallMerchant.update({
        where: { id: merchantId },
        data: {
          merchantStatus: 'active',
          approvedBy: reviewerId,
          approvedAt: new Date(),
          metadata: reviewNote ? { review_note: reviewNote } : undefined
        }
      });

      await tx.outboxEvent.create({
        data: {
          id: ulid(),
          eventType: 'mall.merchant_approved.v1',
          payload: {
            merchant_id: merchant.id,
            merchant_no: merchant.merchantNo,
            reviewer_id: reviewerId
          },
          status: 'pending',
          retryCount: 0
        }
      });

      return merchant;
    });
  }
}
```



`apps/dappx-mall-service/src/modules/merchants/merchants.service.ts`



```TypeScript
import { Injectable } from '@nestjs/common';
import { ulid } from 'ulid';
import { MerchantsRepository } from './merchants.repository';
import { CreateMerchantDto } from './dto/create-merchant.dto';
import { ApproveMerchantDto } from './dto/approve-merchant.dto';
import { QueryMerchantsDto } from './dto/query-merchants.dto';
import { MallErrors } from '../../shared/mall-errors';
import { MerchantStatus } from '../../shared/mall-status';

@Injectable()
export class MerchantsService {
  constructor(private readonly merchantsRepository: MerchantsRepository) {}

  async create(dto: CreateMerchantDto) {
    const existing = await this.merchantsRepository.findByOwner(dto.owner_user_id);
    if (existing) throw new Error(MallErrors.MERCHANT_ALREADY_EXISTS);

    const merchant = await this.merchantsRepository.create({
      merchantNo: this.generateMerchantNo(),
      merchantName: dto.merchant_name,
      ownerUserId: dto.owner_user_id,
      countryCode: dto.country_code,
      settlementWallet: dto.settlement_wallet,
      settlementCurrency: dto.settlement_currency || 'USD',
      commissionRate: dto.commission_rate || '0.05'
    });

    return this.formatMerchant(merchant);
  }

  async detail(merchantId: string) {
    const merchant = await this.merchantsRepository.findById(merchantId);
    if (!merchant) throw new Error(MallErrors.MERCHANT_NOT_FOUND);
    return this.formatMerchant(merchant);
  }

  async list(query: QueryMerchantsDto) {
    const page = Number(query.page || 1);
    const pageSize = Math.min(Number(query.page_size || 20), 100);

    const [items, total] = await Promise.all([
      this.merchantsRepository.findMany({
        ownerUserId: query.owner_user_id,
        merchantStatus: query.merchant_status,
        page,
        pageSize
      }),
      this.merchantsRepository.count({
        ownerUserId: query.owner_user_id,
        merchantStatus: query.merchant_status
      })
    ]);

    return {
      items: items.map((item) => this.formatMerchant(item)),
      pagination: {
        page,
        page_size: pageSize,
        total,
        total_pages: Math.ceil(total / pageSize)
      }
    };
  }

  async approve(merchantId: string, dto: ApproveMerchantDto) {
    const merchant = await this.merchantsRepository.findById(merchantId);
    if (!merchant) throw new Error(MallErrors.MERCHANT_NOT_FOUND);
    if (merchant.merchantStatus !== MerchantStatus.PENDING_REVIEW) {
      throw new Error(MallErrors.MERCHANT_STATUS_INVALID);
    }

    const updated = await this.merchantsRepository.approve(
      merchantId,
      dto.reviewer_id,
      dto.review_note
    );

    return this.formatMerchant(updated);
  }

  private formatMerchant(merchant: any) {
    return {
      merchant_id: merchant.id,
      merchant_no: merchant.merchantNo,
      merchant_name: merchant.merchantName,
      owner_user_id: merchant.ownerUserId,
      country_code: merchant.countryCode,
      kyb_status: merchant.kybStatus,
      merchant_status: merchant.merchantStatus,
      settlement_wallet: merchant.settlementWallet,
      settlement_currency: merchant.settlementCurrency,
      commission_rate: merchant.commissionRate.toString(),
      approved_by: merchant.approvedBy,
      approved_at: merchant.approvedAt
    };
  }

  private generateMerchantNo() {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    return `MCH${date}${ulid()}`;
  }
}
```



---



# 5\. Merchants Controllers / Module



`apps/dappx-mall-service/src/modules/merchants/merchants.controller.ts`



```TypeScript
import { Controller, Get, Param, Query } from '@nestjs/common';
import { MerchantsService } from './merchants.service';
import { QueryMerchantsDto } from './dto/query-merchants.dto';

@Controller('mall/merchants')
export class MerchantsController {
  constructor(private readonly merchantsService: MerchantsService) {}

  @Get()
  list(@Query() query: QueryMerchantsDto) {
    return this.merchantsService.list(query);
  }

  @Get(':merchant_id')
  detail(@Param('merchant_id') merchantId: string) {
    return this.merchantsService.detail(merchantId);
  }
}
```



`apps/dappx-mall-service/src/modules/merchants/merchants.admin.controller.ts`



```TypeScript
import { Body, Controller, Param, Post } from '@nestjs/common';
import { MerchantsService } from './merchants.service';
import { CreateMerchantDto } from './dto/create-merchant.dto';
import { ApproveMerchantDto } from './dto/approve-merchant.dto';

@Controller('admin/mall/merchants')
export class MerchantsAdminController {
  constructor(private readonly merchantsService: MerchantsService) {}

  @Post()
  create(@Body() dto: CreateMerchantDto) {
    return this.merchantsService.create(dto);
  }

  @Post(':merchant_id/approve')
  approve(
    @Param('merchant_id') merchantId: string,
    @Body() dto: ApproveMerchantDto
  ) {
    return this.merchantsService.approve(merchantId, dto);
  }
}
```



`apps/dappx-mall-service/src/modules/merchants/merchants.module.ts`



```TypeScript
import { Module } from '@nestjs/common';
import { MerchantsController } from './merchants.controller';
import { MerchantsAdminController } from './merchants.admin.controller';
import { MerchantsService } from './merchants.service';
import { MerchantsRepository } from './merchants.repository';

@Module({
  controllers: [MerchantsController, MerchantsAdminController],
  providers: [MerchantsService, MerchantsRepository],
  exports: [MerchantsService]
})
export class MerchantsModule {}
```



---



# 6\. Mall Products DTO / Repository / Service



`apps/dappx-mall-service/src/modules/mall-products/dto/create-mall-product.dto.ts`



```TypeScript
import { IsInt, IsString, Min } from 'class-validator';

export class CreateMallProductDto {
  @IsString()
  merchant_id!: string;

  @IsString()
  product_name!: string;

  @IsString()
  product_type!: string;

  @IsString()
  price!: string;

  @IsString()
  currency!: string;

  @IsInt()
  @Min(0)
  stock!: number;
}
```



`apps/dappx-mall-service/src/modules/mall-products/dto/query-mall-products.dto.ts`



```TypeScript
import { IsOptional, IsString } from 'class-validator';

export class QueryMallProductsDto {
  @IsOptional()
  @IsString()
  merchant_id?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  page?: number;

  @IsOptional()
  page_size?: number;
}
```



`apps/dappx-mall-service/src/modules/mall-products/mall-products.repository.ts`



```TypeScript
import { Injectable } from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';
import { ulid } from 'ulid';

const prisma = new PrismaClient();

@Injectable()
export class MallProductsRepository {
  findById(productId: string) {
    return prisma.mallProduct.findUnique({ where: { id: productId } });
  }

  create(data: {
    productNo: string;
    merchantId: string;
    productName: string;
    productType: string;
    price: string;
    currency: string;
    stock: number;
  }) {
    return prisma.$transaction(async (tx) => {
      const product = await tx.mallProduct.create({
        data: {
          id: ulid(),
          productNo: data.productNo,
          merchantId: data.merchantId,
          productName: data.productName,
          productType: data.productType,
          price: new Prisma.Decimal(data.price),
          currency: data.currency,
          stock: data.stock,
          status: 'active'
        }
      });

      await tx.outboxEvent.create({
        data: {
          id: ulid(),
          eventType: 'mall.product_created.v1',
          payload: {
            product_id: product.id,
            product_no: product.productNo,
            merchant_id: product.merchantId,
            price: product.price.toString(),
            currency: product.currency
          },
          status: 'pending',
          retryCount: 0
        }
      });

      return product;
    });
  }

  findMany(params: {
    merchantId?: string;
    status?: string;
    page: number;
    pageSize: number;
  }) {
    return prisma.mallProduct.findMany({
      where: {
        merchantId: params.merchantId,
        status: params.status
      },
      orderBy: { createdAt: 'desc' },
      skip: (params.page - 1) * params.pageSize,
      take: params.pageSize
    });
  }

  count(params: { merchantId?: string; status?: string }) {
    return prisma.mallProduct.count({
      where: {
        merchantId: params.merchantId,
        status: params.status
      }
    });
  }
}
```



`apps/dappx-mall-service/src/modules/mall-products/mall-products.service.ts`



```TypeScript
import { Injectable } from '@nestjs/common';
import { ulid } from 'ulid';
import { MallProductsRepository } from './mall-products.repository';
import { CreateMallProductDto } from './dto/create-mall-product.dto';
import { QueryMallProductsDto } from './dto/query-mall-products.dto';
import { MallErrors } from '../../shared/mall-errors';

@Injectable()
export class MallProductsService {
  constructor(private readonly productsRepository: MallProductsRepository) {}

  async create(dto: CreateMallProductDto) {
    const product = await this.productsRepository.create({
      productNo: this.generateProductNo(),
      merchantId: dto.merchant_id,
      productName: dto.product_name,
      productType: dto.product_type,
      price: dto.price,
      currency: dto.currency,
      stock: dto.stock
    });

    return this.formatProduct(product);
  }

  async detail(productId: string) {
    const product = await this.productsRepository.findById(productId);
    if (!product) throw new Error(MallErrors.PRODUCT_NOT_FOUND);
    return this.formatProduct(product);
  }

  async list(query: QueryMallProductsDto) {
    const page = Number(query.page || 1);
    const pageSize = Math.min(Number(query.page_size || 20), 100);

    const [items, total] = await Promise.all([
      this.productsRepository.findMany({
        merchantId: query.merchant_id,
        status: query.status,
        page,
        pageSize
      }),
      this.productsRepository.count({
        merchantId: query.merchant_id,
        status: query.status
      })
    ]);

    return {
      items: items.map((item) => this.formatProduct(item)),
      pagination: {
        page,
        page_size: pageSize,
        total,
        total_pages: Math.ceil(total / pageSize)
      }
    };
  }

  private formatProduct(product: any) {
    return {
      product_id: product.id,
      product_no: product.productNo,
      merchant_id: product.merchantId,
      product_name: product.productName,
      product_type: product.productType,
      price: product.price.toString(),
      currency: product.currency,
      stock: product.stock,
      locked_stock: product.lockedStock,
      sold_stock: product.soldStock,
      status: product.status
    };
  }

  private generateProductNo() {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    return `MPD${date}${ulid()}`;
  }
}
```



---



# 7\. Mall Products Controllers / Module



`apps/dappx-mall-service/src/modules/mall-products/mall-products.controller.ts`



```TypeScript
import { Controller, Get, Param, Query } from '@nestjs/common';
import { MallProductsService } from './mall-products.service';
import { QueryMallProductsDto } from './dto/query-mall-products.dto';

@Controller('mall/products')
export class MallProductsController {
  constructor(private readonly productsService: MallProductsService) {}

  @Get()
  list(@Query() query: QueryMallProductsDto) {
    return this.productsService.list(query);
  }

  @Get(':product_id')
  detail(@Param('product_id') productId: string) {
    return this.productsService.detail(productId);
  }
}
```



`apps/dappx-mall-service/src/modules/mall-products/mall-products.admin.controller.ts`



```TypeScript
import { Body, Controller, Post } from '@nestjs/common';
import { MallProductsService } from './mall-products.service';
import { CreateMallProductDto } from './dto/create-mall-product.dto';

@Controller('admin/mall/products')
export class MallProductsAdminController {
  constructor(private readonly productsService: MallProductsService) {}

  @Post()
  create(@Body() dto: CreateMallProductDto) {
    return this.productsService.create(dto);
  }
}
```



`apps/dappx-mall-service/src/modules/mall-products/mall-products.module.ts`



```TypeScript
import { Module } from '@nestjs/common';
import { MallProductsController } from './mall-products.controller';
import { MallProductsAdminController } from './mall-products.admin.controller';
import { MallProductsService } from './mall-products.service';
import { MallProductsRepository } from './mall-products.repository';

@Module({
  controllers: [MallProductsController, MallProductsAdminController],
  providers: [MallProductsService, MallProductsRepository],
  exports: [MallProductsService]
})
export class MallProductsModule {}
```



---



# 8\. Mall Orders DTO / Repository / Service



`apps/dappx-mall-service/src/modules/mall-orders/dto/create-mall-order.dto.ts`



```TypeScript
import { IsInt, IsString, Min } from 'class-validator';

export class CreateMallOrderDto {
  @IsString()
  user_id!: string;

  @IsString()
  product_id!: string;

  @IsInt()
  @Min(1)
  quantity!: number;
}
```



`apps/dappx-mall-service/src/modules/mall-orders/dto/pay-mall-order.dto.ts`



```TypeScript
import { IsOptional, IsString } from 'class-validator';

export class PayMallOrderDto {
  @IsString()
  paid_amount!: string;

  @IsString()
  currency!: string;

  @IsOptional()
  @IsString()
  payment_id?: string;
}
```



`apps/dappx-mall-service/src/modules/mall-orders/dto/query-mall-orders.dto.ts`



```TypeScript
import { IsOptional, IsString } from 'class-validator';

export class QueryMallOrdersDto {
  @IsOptional()
  @IsString()
  user_id?: string;

  @IsOptional()
  @IsString()
  merchant_id?: string;

  @IsOptional()
  @IsString()
  order_status?: string;

  @IsOptional()
  page?: number;

  @IsOptional()
  page_size?: number;
}
```



`apps/dappx-mall-service/src/modules/mall-orders/mall-orders.repository.ts`



```TypeScript
import { Injectable } from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';
import { ulid } from 'ulid';

const prisma = new PrismaClient();

@Injectable()
export class MallOrdersRepository {
  findProduct(productId: string) {
    return prisma.mallProduct.findUnique({ where: { id: productId } });
  }

  findById(orderId: string) {
    return prisma.mallOrder.findUnique({ where: { id: orderId } });
  }

  create(data: {
    orderNo: string;
    userId: string;
    merchantId: string;
    productId: string;
    quantity: number;
    unitPrice: string;
    totalAmount: string;
    payableAmount: string;
    currency: string;
  }) {
    return prisma.$transaction(async (tx) => {
      const order = await tx.mallOrder.create({
        data: {
          id: ulid(),
          orderNo: data.orderNo,
          userId: data.userId,
          merchantId: data.merchantId,
          productId: data.productId,
          quantity: data.quantity,
          unitPrice: new Prisma.Decimal(data.unitPrice),
          totalAmount: new Prisma.Decimal(data.totalAmount),
          payableAmount: new Prisma.Decimal(data.payableAmount),
          currency: data.currency,
          orderStatus: 'pending_payment',
          paymentStatus: 'unpaid'
        }
      });

      await tx.mallProduct.update({
        where: { id: data.productId },
        data: {
          lockedStock: { increment: data.quantity }
        }
      });

      await tx.outboxEvent.create({
        data: {
          id: ulid(),
          eventType: 'mall.order_created.v1',
          payload: {
            order_id: order.id,
            order_no: order.orderNo,
            user_id: order.userId,
            merchant_id: order.merchantId,
            payable_amount: order.payableAmount.toString(),
            currency: order.currency
          },
          status: 'pending',
          retryCount: 0
        }
      });

      return order;
    });
  }

  markPaid(orderId: string, paymentId?: string) {
    return prisma.$transaction(async (tx) => {
      const order = await tx.mallOrder.update({
        where: { id: orderId },
        data: {
          orderStatus: 'paid',
          paymentStatus: 'success',
          paidAt: new Date(),
          metadata: paymentId ? { payment_id: paymentId } : undefined
        }
      });

      await tx.mallProduct.update({
        where: { id: order.productId },
        data: {
          lockedStock: { decrement: order.quantity },
          soldStock: { increment: order.quantity }
        }
      });

      await tx.outboxEvent.create({
        data: {
          id: ulid(),
          eventType: 'mall.order_paid.v1',
          payload: {
            order_id: order.id,
            order_no: order.orderNo,
            merchant_id: order.merchantId,
            user_id: order.userId,
            payable_amount: order.payableAmount.toString(),
            currency: order.currency
          },
          status: 'pending',
          retryCount: 0
        }
      });

      return order;
    });
  }

  findMany(params: {
    userId?: string;
    merchantId?: string;
    orderStatus?: string;
    page: number;
    pageSize: number;
  }) {
    return prisma.mallOrder.findMany({
      where: {
        userId: params.userId,
        merchantId: params.merchantId,
        orderStatus: params.orderStatus
      },
      orderBy: { createdAt: 'desc' },
      skip: (params.page - 1) * params.pageSize,
      take: params.pageSize
    });
  }

  count(params: { userId?: string; merchantId?: string; orderStatus?: string }) {
    return prisma.mallOrder.count({
      where: {
        userId: params.userId,
        merchantId: params.merchantId,
        orderStatus: params.orderStatus
      }
    });
  }
}
```



`apps/dappx-mall-service/src/modules/mall-orders/mall-orders.service.ts`



```TypeScript
import { Injectable } from '@nestjs/common';
import Decimal from 'decimal.js';
import { ulid } from 'ulid';
import { MallOrdersRepository } from './mall-orders.repository';
import { CreateMallOrderDto } from './dto/create-mall-order.dto';
import { PayMallOrderDto } from './dto/pay-mall-order.dto';
import { QueryMallOrdersDto } from './dto/query-mall-orders.dto';
import { MallErrors } from '../../shared/mall-errors';

@Injectable()
export class MallOrdersService {
  constructor(private readonly ordersRepository: MallOrdersRepository) {}

  async create(dto: CreateMallOrderDto) {
    const product = await this.ordersRepository.findProduct(dto.product_id);
    if (!product) throw new Error(MallErrors.PRODUCT_NOT_FOUND);
    if (product.status !== 'active') throw new Error(MallErrors.PRODUCT_STATUS_INVALID);
    if (product.stock - product.lockedStock - product.soldStock  this.formatOrder(item)),
      pagination: {
        page,
        page_size: pageSize,
        total,
        total_pages: Math.ceil(total / pageSize)
      }
    };
  }

  private formatOrder(order: any) {
    return {
      order_id: order.id,
      order_no: order.orderNo,
      user_id: order.userId,
      merchant_id: order.merchantId,
      product_id: order.productId,
      quantity: order.quantity,
      unit_price: order.unitPrice.toString(),
      total_amount: order.totalAmount.toString(),
      payable_amount: order.payableAmount.toString(),
      currency: order.currency,
      order_status: order.orderStatus,
      payment_status: order.paymentStatus,
      settlement_status: order.settlementStatus,
      risk_status: order.riskStatus,
      paid_at: order.paidAt
    };
  }

  private generateOrderNo() {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    return `MOR${date}${ulid()}`;
  }
}
```



---



# 9\. Mall Orders Controllers / Module



`apps/dappx-mall-service/src/modules/mall-orders/mall-orders.controller.ts`



```TypeScript
import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { MallOrdersService } from './mall-orders.service';
import { CreateMallOrderDto } from './dto/create-mall-order.dto';
import { QueryMallOrdersDto } from './dto/query-mall-orders.dto';

@Controller('mall/orders')
export class MallOrdersController {
  constructor(private readonly ordersService: MallOrdersService) {}

  @Post()
  create(@Body() dto: CreateMallOrderDto) {
    return this.ordersService.create(dto);
  }

  @Get()
  list(@Query() query: QueryMallOrdersDto) {
    return this.ordersService.list(query);
  }

  @Get(':order_id')
  detail(@Param('order_id') orderId: string) {
    return this.ordersService.detail(orderId);
  }
}
```



`apps/dappx-mall-service/src/modules/mall-orders/mall-orders.admin.controller.ts`



```TypeScript
import { Body, Controller, Param, Post } from '@nestjs/common';
import { MallOrdersService } from './mall-orders.service';
import { PayMallOrderDto } from './dto/pay-mall-order.dto';

@Controller('admin/mall/orders')
export class MallOrdersAdminController {
  constructor(private readonly ordersService: MallOrdersService) {}

  @Post(':order_id/pay')
  pay(@Param('order_id') orderId: string, @Body() dto: PayMallOrderDto) {
    return this.ordersService.pay(orderId, dto);
  }
}
```



`apps/dappx-mall-service/src/modules/mall-orders/mall-orders.module.ts`



```TypeScript
import { Module } from '@nestjs/common';
import { MallOrdersController } from './mall-orders.controller';
import { MallOrdersAdminController } from './mall-orders.admin.controller';
import { MallOrdersService } from './mall-orders.service';
import { MallOrdersRepository } from './mall-orders.repository';

@Module({
  controllers: [MallOrdersController, MallOrdersAdminController],
  providers: [MallOrdersService, MallOrdersRepository],
  exports: [MallOrdersService]
})
export class MallOrdersModule {}
```



---



# 10\. Settlements DTO / Repository / Service



`apps/dappx-mall-service/src/modules/settlements/dto/create-merchant-settlement.dto.ts`



```TypeScript
import { IsString } from 'class-validator';

export class CreateMerchantSettlementDto {
  @IsString()
  merchant_id!: string;

  @IsString()
  period!: string;

  @IsString()
  gross_amount!: string;

  @IsString()
  commission_rate!: string;

  @IsString()
  currency!: string;
}
```



`apps/dappx-mall-service/src/modules/settlements/dto/approve-merchant-settlement.dto.ts`



```TypeScript
import { IsOptional, IsString } from 'class-validator';

export class ApproveMerchantSettlementDto {
  @IsString()
  reviewer_id!: string;

  @IsOptional()
  @IsString()
  review_note?: string;
}
```



`apps/dappx-mall-service/src/modules/settlements/settlements.repository.ts`



```TypeScript
import { Injectable } from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';
import { ulid } from 'ulid';

const prisma = new PrismaClient();

@Injectable()
export class SettlementsRepository {
  findById(settlementId: string) {
    return prisma.merchantSettlement.findUnique({ where: { id: settlementId } });
  }

  create(data: {
    settlementNo: string;
    merchantId: string;
    period: string;
    grossAmount: string;
    commissionAmount: string;
    taxAmount: string;
    netAmount: string;
    currency: string;
  }) {
    return prisma.$transaction(async (tx) => {
      const settlement = await tx.merchantSettlement.create({
        data: {
          id: ulid(),
          settlementNo: data.settlementNo,
          merchantId: data.merchantId,
          period: data.period,
          grossAmount: new Prisma.Decimal(data.grossAmount),
          commissionAmount: new Prisma.Decimal(data.commissionAmount),
          taxAmount: new Prisma.Decimal(data.taxAmount),
          netAmount: new Prisma.Decimal(data.netAmount),
          currency: data.currency,
          settlementStatus: 'pending'
        }
      });

      await tx.outboxEvent.create({
        data: {
          id: ulid(),
          eventType: 'mall.merchant_settlement_created.v1',
          payload: {
            settlement_id: settlement.id,
            settlement_no: settlement.settlementNo,
            merchant_id: settlement.merchantId,
            gross_amount: settlement.grossAmount.toString(),
            net_amount: settlement.netAmount.toString(),
            currency: settlement.currency
          },
          status: 'pending',
          retryCount: 0
        }
      });

      return settlement;
    });
  }

  approve(settlementId: string, reviewerId: string, reviewNote?: string) {
    return prisma.$transaction(async (tx) => {
      const settlement = await tx.merchantSettlement.update({
        where: { id: settlementId },
        data: {
          settlementStatus: 'approved',
          approvedBy: reviewerId,
          approvedAt: new Date(),
          metadata: reviewNote ? { review_note: reviewNote } : undefined
        }
      });

      await tx.outboxEvent.create({
        data: {
          id: ulid(),
          eventType: 'mall.merchant_settlement_approved.v1',
          payload: {
            settlement_id: settlement.id,
            settlement_no: settlement.settlementNo,
            merchant_id: settlement.merchantId,
            reviewer_id: reviewerId
          },
          status: 'pending',
          retryCount: 0
        }
      });

      return settlement;
    });
  }
}
```



`apps/dappx-mall-service/src/modules/settlements/settlements.service.ts`



```TypeScript
import { Injectable } from '@nestjs/common';
import Decimal from 'decimal.js';
import { ulid } from 'ulid';
import { SettlementsRepository } from './settlements.repository';
import { CreateMerchantSettlementDto } from './dto/create-merchant-settlement.dto';
import { ApproveMerchantSettlementDto } from './dto/approve-merchant-settlement.dto';
import { MallErrors } from '../../shared/mall-errors';
import { MerchantSettlementStatus } from '../../shared/mall-status';

@Injectable()
export class SettlementsService {
  constructor(private readonly settlementsRepository: SettlementsRepository) {}

  async create(dto: CreateMerchantSettlementDto) {
    const gross = new Decimal(dto.gross_amount);
    if (gross.lte(0)) throw new Error(MallErrors.AMOUNT_INVALID);

    const commission = gross.mul(dto.commission_rate);
    const tax = gross.sub(commission).mul('0.10');
    const net = gross.sub(commission).sub(tax);

    const settlement = await this.settlementsRepository.create({
      settlementNo: this.generateSettlementNo(),
      merchantId: dto.merchant_id,
      period: dto.period,
      grossAmount: gross.toFixed(18),
      commissionAmount: commission.toFixed(18),
      taxAmount: tax.toFixed(18),
      netAmount: net.toFixed(18),
      currency: dto.currency
    });

    return this.formatSettlement(settlement);
  }

  async approve(settlementId: string, dto: ApproveMerchantSettlementDto) {
    const settlement = await this.settlementsRepository.findById(settlementId);
    if (!settlement) throw new Error(MallErrors.SETTLEMENT_NOT_FOUND);
    if (settlement.settlementStatus !== MerchantSettlementStatus.PENDING) {
      throw new Error(MallErrors.SETTLEMENT_STATUS_INVALID);
    }

    const updated = await this.settlementsRepository.approve(
      settlementId,
      dto.reviewer_id,
      dto.review_note
    );

    return this.formatSettlement(updated);
  }

  async detail(settlementId: string) {
    const settlement = await this.settlementsRepository.findById(settlementId);
    if (!settlement) throw new Error(MallErrors.SETTLEMENT_NOT_FOUND);
    return this.formatSettlement(settlement);
  }

  private formatSettlement(settlement: any) {
    return {
      settlement_id: settlement.id,
      settlement_no: settlement.settlementNo,
      merchant_id: settlement.merchantId,
      period: settlement.period,
      gross_amount: settlement.grossAmount.toString(),
      commission_amount: settlement.commissionAmount.toString(),
      tax_amount: settlement.taxAmount.toString(),
      net_amount: settlement.netAmount.toString(),
      currency: settlement.currency,
      settlement_status: settlement.settlementStatus,
      approved_by: settlement.approvedBy,
      approved_at: settlement.approvedAt
    };
  }

  private generateSettlementNo() {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    return `MST${date}${ulid()}`;
  }
}
```



---



# 11\. Settlements Controllers / Module



`apps/dappx-mall-service/src/modules/settlements/settlements.controller.ts`



```TypeScript
import { Controller, Get, Param } from '@nestjs/common';
import { SettlementsService } from './settlements.service';

@Controller('mall/settlements')
export class SettlementsController {
  constructor(private readonly settlementsService: SettlementsService) {}

  @Get(':settlement_id')
  detail(@Param('settlement_id') settlementId: string) {
    return this.settlementsService.detail(settlementId);
  }
}
```



`apps/dappx-mall-service/src/modules/settlements/settlements.admin.controller.ts`



```TypeScript
import { Body, Controller, Param, Post } from '@nestjs/common';
import { SettlementsService } from './settlements.service';
import { CreateMerchantSettlementDto } from './dto/create-merchant-settlement.dto';
import { ApproveMerchantSettlementDto } from './dto/approve-merchant-settlement.dto';

@Controller('admin/mall/settlements')
export class SettlementsAdminController {
  constructor(private readonly settlementsService: SettlementsService) {}

  @Post()
  create(@Body() dto: CreateMerchantSettlementDto) {
    return this.settlementsService.create(dto);
  }

  @Post(':settlement_id/approve')
  approve(
    @Param('settlement_id') settlementId: string,
    @Body() dto: ApproveMerchantSettlementDto
  ) {
    return this.settlementsService.approve(settlementId, dto);
  }
}
```



`apps/dappx-mall-service/src/modules/settlements/settlements.module.ts`



```TypeScript
import { Module } from '@nestjs/common';
import { SettlementsController } from './settlements.controller';
import { SettlementsAdminController } from './settlements.admin.controller';
import { SettlementsService } from './settlements.service';
import { SettlementsRepository } from './settlements.repository';

@Module({
  controllers: [SettlementsController, SettlementsAdminController],
  providers: [SettlementsService, SettlementsRepository],
  exports: [SettlementsService]
})
export class SettlementsModule {}
```



---



# 12\. DAppX Mall App Module



`apps/dappx-mall-service/src/app.module.ts`



```TypeScript
import { Module } from '@nestjs/common';
import { HealthModule } from './health/health.module';
import { MerchantsModule } from './modules/merchants/merchants.module';
import { MallProductsModule } from './modules/mall-products/mall-products.module';
import { MallOrdersModule } from './modules/mall-orders/mall-orders.module';
import { SettlementsModule } from './modules/settlements/settlements.module';

@Module({
  imports: [
    HealthModule,
    MerchantsModule,
    MallProductsModule,
    MallOrdersModule,
    SettlementsModule
  ]
})
export class AppModule {}
```



---



# 13\. DAppX Mall Service 当前 API



## 用户端



```HTTP
GET /api/v1/mall/merchants
GET /api/v1/mall/merchants/:merchant_id
GET /api/v1/mall/products
GET /api/v1/mall/products/:product_id
POST /api/v1/mall/orders
GET /api/v1/mall/orders
GET /api/v1/mall/orders/:order_id
GET /api/v1/mall/settlements/:settlement_id
```



## 后台端



```HTTP
POST /api/v1/admin/mall/merchants
POST /api/v1/admin/mall/merchants/:merchant_id/approve
POST /api/v1/admin/mall/products
POST /api/v1/admin/mall/orders/:order_id/pay
POST /api/v1/admin/mall/settlements
POST /api/v1/admin/mall/settlements/:settlement_id/approve
```



---



# 14\. DAppX Mall Service 已具备能力



这一版完成后，商城服务支持：



```Plain Text
商户创建
商户审核
商户列表 / 详情
商城商品创建
商城商品列表 / 详情
商城订单创建
商城订单支付
库存锁定 / 扣减
商户结算创建
商户结算审核
商城事件 outbox
```



---



# 15\. 后续必须补强



```Plain Text
统一 AppException
PrismaModule 注入
真实组合支付
优惠券 / FJ369 / tFJ369 支付
商户 KYB 联动
订单履约
退款
商户自动结算周期
Finance Service 联动
Tax Service 联动
Risk Service 联动
Approval Service 联动
Audit Log
Admin 权限 Guard
```



---



# 16\. 下一步继续



按 23 个 Service 顺序，下一步写：



```Plain Text
16. Finance Service 财务账本服务
```



下一步会覆盖：



```Plain Text
财务账户
财务流水
收入确认
成本池 / 市场池 / 公司池
奖励计提
退款冲销
结算单
财务报表基础
```



