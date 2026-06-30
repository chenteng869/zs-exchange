# H021\-5 个 Service：Payment Service 支付服务

下面继续按 23 个 Service 顺序写代码。



# 第 5 个 Service：Payment Service 支付服务



本服务负责：



```Plain Text
创建支付单
查询支付单
模拟支付成功
支付回调
tx_hash 唯一校验
支付金额校验
支付状态机
支付成功事件
退款申请
退款审核预留
PaymentSucceeded outbox 事件
RefundRequested outbox 事件
```



---



# 1\. Payment Service 目录结构



```Plain Text
apps/payment-service/
├── src/
│   ├── app.module.ts
│   ├── main.ts
│   ├── health/
│   ├── shared/
│   │   ├── payment-errors.ts
│   │   ├── payment-events.ts
│   │   ├── payment-methods.ts
│   │   └── payment-status.ts
│   └── modules/
│       ├── payments/
│       │   ├── payments.module.ts
│       │   ├── payments.controller.ts
│       │   ├── payments.admin.controller.ts
│       │   ├── payments.repository.ts
│       │   ├── payments.service.ts
│       │   ├── payment.state-machine.ts
│       │   └── dto/
│       │       ├── create-payment.dto.ts
│       │       ├── payment-callback.dto.ts
│       │       ├── query-payments.dto.ts
│       │       └── simulate-payment-success.dto.ts
│       └── refunds/
│           ├── refunds.module.ts
│           ├── refunds.controller.ts
│           ├── refunds.admin.controller.ts
│           ├── refunds.repository.ts
│           ├── refunds.service.ts
│           └── dto/
│               ├── create-refund.dto.ts
│               ├── approve-refund.dto.ts
│               └── reject-refund.dto.ts
```



---



# 2\. Prisma 补充表



## 2\.1 PaymentCallback



```Plain Text
model PaymentCallback {
  id                String    @id
  paymentId         String?   @map("payment_id")
  provider          String
  callbackPayload   Json      @map("callback_payload")
  signature         String?
  signatureVerified Boolean   @default(false) @map("signature_verified")
  idempotencyKey    String    @unique @map("idempotency_key")
  processed         Boolean   @default(false)
  processedAt       DateTime? @map("processed_at")
  createdAt         DateTime  @default(now()) @map("created_at")

  payment           Payment?  @relation(fields: [paymentId], references: [id])

  @@index([paymentId])
  @@map("payment_callbacks")
}
```



## 2\.2 Refund



```Plain Text
model Refund {
  id            String    @id
  refundNo      String    @unique @map("refund_no")
  orderId       String    @map("order_id")
  paymentId     String?   @map("payment_id")
  userId        String    @map("user_id")
  refundAmount  Decimal   @map("refund_amount") @db.Decimal(36, 18)
  currency      String
  refundReason  String    @map("refund_reason")
  refundStatus  String    @default("requested") @map("refund_status")
  reviewerId    String?   @map("reviewer_id")
  reviewNote    String?   @map("review_note")
  processedAt   DateTime? @map("processed_at")
  createdAt     DateTime  @default(now()) @map("created_at")
  updatedAt     DateTime  @updatedAt @map("updated_at")
  metadata      Json?

  payment       Payment?  @relation(fields: [paymentId], references: [id])
  adjustments   RefundAdjustment[]

  @@index([orderId])
  @@index([userId])
  @@index([refundStatus])
  @@map("refunds")
}
```



## 2\.3 RefundAdjustment



```Plain Text
model RefundAdjustment {
  id             String   @id
  refundId       String   @map("refund_id")
  businessType   String   @map("business_type")
  businessId     String?  @map("business_id")
  adjustmentType String   @map("adjustment_type")
  amount         Decimal? @db.Decimal(36, 18)
  currency       String?
  status         String   @default("pending")
  createdAt      DateTime @default(now()) @map("created_at")
  metadata       Json?

  refund         Refund   @relation(fields: [refundId], references: [id])

  @@index([refundId])
  @@map("refund_adjustments")
}
```



## 2\.4 Payment 模型补充关系



在 `Payment` model 中补充：



```Plain Text
callbacks PaymentCallback[]
refunds   Refund[]
```



---



# 3\. Payment Events



`apps/payment-service/src/shared/payment-events.ts`



```TypeScript
export const PaymentEvents = {
  PAYMENT_CREATED: 'payment.created.v1',
  PAYMENT_PENDING: 'payment.pending.v1',
  PAYMENT_SUCCEEDED: 'payment.succeeded.v1',
  PAYMENT_FAILED: 'payment.failed.v1',
  PAYMENT_EXPIRED: 'payment.expired.v1',

  REFUND_REQUESTED: 'refund.requested.v1',
  REFUND_APPROVED: 'refund.approved.v1',
  REFUND_REJECTED: 'refund.rejected.v1',
  REFUND_SUCCEEDED: 'refund.succeeded.v1',
  REFUND_FAILED: 'refund.failed.v1'
} as const;
```



---



# 4\. Payment Errors



`apps/payment-service/src/shared/payment-errors.ts`



```TypeScript
export const PaymentErrors = {
  PAYMENT_NOT_FOUND: 'PAYMENT_NOT_FOUND',
  PAYMENT_ALREADY_EXISTS: 'PAYMENT_ALREADY_EXISTS',
  PAYMENT_STATUS_INVALID: 'PAYMENT_STATUS_INVALID',
  PAYMENT_ALREADY_SUCCESS: 'PAYMENT_ALREADY_SUCCESS',
  PAYMENT_AMOUNT_MISMATCH: 'PAYMENT_AMOUNT_MISMATCH',
  PAYMENT_CURRENCY_MISMATCH: 'PAYMENT_CURRENCY_MISMATCH',
  PAYMENT_TX_HASH_DUPLICATED: 'PAYMENT_TX_HASH_DUPLICATED',
  PAYMENT_CALLBACK_DUPLICATED: 'PAYMENT_CALLBACK_DUPLICATED',
  PAYMENT_CALLBACK_SIGNATURE_INVALID: 'PAYMENT_CALLBACK_SIGNATURE_INVALID',

  ORDER_NOT_FOUND: 'ORDER_NOT_FOUND',
  ORDER_NOT_PAYABLE: 'ORDER_NOT_PAYABLE',

  REFUND_NOT_FOUND: 'REFUND_NOT_FOUND',
  REFUND_STATUS_INVALID: 'REFUND_STATUS_INVALID',
  REFUND_AMOUNT_INVALID: 'REFUND_AMOUNT_INVALID'
} as const;
```



---



# 5\. Payment Status



`apps/payment-service/src/shared/payment-status.ts`



```TypeScript
export const PaymentStatus = {
  CREATED: 'created',
  PENDING: 'pending',
  PROCESSING: 'processing',
  SUCCESS: 'success',
  FAILED: 'failed',
  EXPIRED: 'expired',
  MANUAL_REVIEW: 'manual_review'
} as const;

export const RefundStatus = {
  REQUESTED: 'requested',
  REVIEWING: 'reviewing',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  PROCESSING: 'processing',
  REFUNDED: 'refunded',
  FAILED: 'failed'
} as const;
```



---



# 6\. Payment Methods



`apps/payment-service/src/shared/payment-methods.ts`



```TypeScript
export const PaymentMethods = {
  USDT: 'usdt',
  BANK_CARD: 'bank_card',
  CREDIT_CARD: 'credit_card',
  THIRD_PARTY: 'third_party',
  PLATFORM_BALANCE: 'platform_balance',
  FJ369_TOKEN: 'fj369_token',
  TFJ369: 'tfj369',
  DAPPX_CREDIT: 'dappx_credit',
  MANUAL: 'manual'
} as const;
```



---



# 7\. Payment 状态机



`apps/payment-service/src/modules/payments/payment.state-machine.ts`



```TypeScript
export const PaymentStateTransitions: Record = {
  created: ['pending', 'processing', 'expired', 'failed'],
  pending: ['processing', 'success', 'expired', 'failed', 'manual_review'],
  processing: ['success', 'failed', 'manual_review'],
  manual_review: ['success', 'failed'],
  success: [],
  failed: [],
  expired: []
};

export function canTransitPaymentStatus(from: string, to: string): boolean {
  return PaymentStateTransitions[from]?.includes(to) ?? false;
}
```



---



# 8\. DTO：CreatePaymentDto



`apps/payment-service/src/modules/payments/dto/create-payment.dto.ts`



```TypeScript
import { IsOptional, IsString } from 'class-validator';

export class CreatePaymentDto {
  @IsString()
  order_id!: string;

  @IsString()
  user_id!: string;

  @IsString()
  payment_method!: string;

  @IsOptional()
  @IsString()
  payment_channel?: string;

  @IsString()
  amount!: string;

  @IsString()
  currency!: string;

  @IsOptional()
  @IsString()
  chain?: string;
}
```



---



# 9\. DTO：PaymentCallbackDto



`apps/payment-service/src/modules/payments/dto/payment-callback.dto.ts`



```TypeScript
import { IsOptional, IsString } from 'class-validator';

export class PaymentCallbackDto {
  @IsString()
  payment_no!: string;

  @IsString()
  amount!: string;

  @IsString()
  currency!: string;

  @IsString()
  status!: string;

  @IsOptional()
  @IsString()
  tx_hash?: string;

  @IsOptional()
  @IsString()
  signature?: string;

  @IsOptional()
  @IsString()
  idempotency_key?: string;
}
```



---



# 10\. DTO：SimulatePaymentSuccessDto



`apps/payment-service/src/modules/payments/dto/simulate-payment-success.dto.ts`



```TypeScript
import { IsOptional, IsString } from 'class-validator';

export class SimulatePaymentSuccessDto {
  @IsString()
  tx_hash!: string;

  @IsOptional()
  @IsString()
  operator_id?: string;
}
```



---



# 11\. DTO：QueryPaymentsDto



`apps/payment-service/src/modules/payments/dto/query-payments.dto.ts`



```TypeScript
import { IsOptional, IsString } from 'class-validator';

export class QueryPaymentsDto {
  @IsOptional()
  @IsString()
  payment_no?: string;

  @IsOptional()
  @IsString()
  order_id?: string;

  @IsOptional()
  @IsString()
  user_id?: string;

  @IsOptional()
  @IsString()
  payment_status?: string;

  @IsOptional()
  page?: number;

  @IsOptional()
  page_size?: number;
}
```



---



# 12\. Payments Repository



`apps/payment-service/src/modules/payments/payments.repository.ts`



```TypeScript
import { Injectable } from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';
import { ulid } from 'ulid';

const prisma = new PrismaClient();

@Injectable()
export class PaymentsRepository {
  findById(paymentId: string) {
    return prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        callbacks: true,
        refunds: true
      }
    });
  }

  findByNo(paymentNo: string) {
    return prisma.payment.findUnique({
      where: { paymentNo },
      include: {
        callbacks: true
      }
    });
  }

  findByTxHash(txHash: string) {
    return prisma.payment.findUnique({
      where: { txHash }
    });
  }

  findMany(params: {
    paymentNo?: string;
    orderId?: string;
    userId?: string;
    paymentStatus?: string;
    page: number;
    pageSize: number;
  }) {
    return prisma.payment.findMany({
      where: {
        paymentNo: params.paymentNo,
        orderId: params.orderId,
        userId: params.userId,
        paymentStatus: params.paymentStatus
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip: (params.page - 1) * params.pageSize,
      take: params.pageSize
    });
  }

  count(params: {
    paymentNo?: string;
    orderId?: string;
    userId?: string;
    paymentStatus?: string;
  }) {
    return prisma.payment.count({
      where: {
        paymentNo: params.paymentNo,
        orderId: params.orderId,
        userId: params.userId,
        paymentStatus: params.paymentStatus
      }
    });
  }

  create(data: {
    paymentNo: string;
    orderId: string;
    userId: string;
    paymentMethod: string;
    paymentChannel?: string;
    amount: string;
    currency: string;
    receiverWallet?: string;
    expiredAt?: Date;
  }) {
    return prisma.$transaction(async (tx) => {
      const payment = await tx.payment.create({
        data: {
          id: ulid(),
          paymentNo: data.paymentNo,
          orderId: data.orderId,
          userId: data.userId,
          paymentMethod: data.paymentMethod,
          paymentChannel: data.paymentChannel,
          amount: new Prisma.Decimal(data.amount),
          currency: data.currency,
          paymentStatus: 'pending',
          receiverWallet: data.receiverWallet,
          expiredAt: data.expiredAt
        }
      });

      await tx.outboxEvent.create({
        data: {
          id: ulid(),
          eventType: 'payment.created.v1',
          payload: {
            payment_id: payment.id,
            payment_no: payment.paymentNo,
            order_id: payment.orderId,
            user_id: payment.userId,
            amount: payment.amount.toString(),
            currency: payment.currency,
            payment_method: payment.paymentMethod
          },
          status: 'pending',
          retryCount: 0
        }
      });

      return payment;
    });
  }

  markSuccess(params: {
    paymentId: string;
    txHash?: string;
    callbackPayload?: Prisma.InputJsonValue;
    provider?: string;
    idempotencyKey?: string;
    signature?: string;
  }) {
    return prisma.$transaction(async (tx) => {
      const payment = await tx.payment.update({
        where: { id: params.paymentId },
        data: {
          paymentStatus: 'success',
          txHash: params.txHash,
          paidAt: new Date()
        }
      });

      if (params.callbackPayload && params.provider && params.idempotencyKey) {
        await tx.paymentCallback.create({
          data: {
            id: ulid(),
            paymentId: payment.id,
            provider: params.provider,
            callbackPayload: params.callbackPayload,
            signature: params.signature,
            signatureVerified: true,
            idempotencyKey: params.idempotencyKey,
            processed: true,
            processedAt: new Date()
          }
        });
      }

      await tx.outboxEvent.create({
        data: {
          id: ulid(),
          eventType: 'payment.succeeded.v1',
          payload: {
            payment_id: payment.id,
            payment_no: payment.paymentNo,
            order_id: payment.orderId,
            user_id: payment.userId,
            amount: payment.amount.toString(),
            currency: payment.currency,
            tx_hash: payment.txHash
          },
          status: 'pending',
          retryCount: 0
        }
      });

      return payment;
    });
  }

  markFailed(params: {
    paymentId: string;
    reason?: string;
  }) {
    return prisma.payment.update({
      where: { id: params.paymentId },
      data: {
        paymentStatus: 'failed',
        metadata: {
          reason: params.reason
        }
      }
    });
  }

  createCallback(data: {
    paymentId?: string;
    provider: string;
    callbackPayload: Prisma.InputJsonValue;
    signature?: string;
    signatureVerified: boolean;
    idempotencyKey: string;
    processed: boolean;
  }) {
    return prisma.paymentCallback.create({
      data: {
        id: ulid(),
        paymentId: data.paymentId,
        provider: data.provider,
        callbackPayload: data.callbackPayload,
        signature: data.signature,
        signatureVerified: data.signatureVerified,
        idempotencyKey: data.idempotencyKey,
        processed: data.processed,
        processedAt: data.processed ? new Date() : undefined
      }
    });
  }
}
```



> 如果 `Payment` model 还没有 `paymentChannel`、`receiverWallet`、`metadata` 字段，需要补上：
> 
> 
> 
> ```Plain Text
> paymentChannel String? @map("payment_channel")
> receiverWallet String? @map("receiver_wallet")
> metadata Json?
> ```
> 
> 



---



# 13\. Payments Service



`apps/payment-service/src/modules/payments/payments.service.ts`



```TypeScript
import { Injectable } from '@nestjs/common';
import Decimal from 'decimal.js';
import { ulid } from 'ulid';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { PaymentCallbackDto } from './dto/payment-callback.dto';
import { QueryPaymentsDto } from './dto/query-payments.dto';
import { SimulatePaymentSuccessDto } from './dto/simulate-payment-success.dto';
import { PaymentsRepository } from './payments.repository';
import { PaymentErrors } from '../../shared/payment-errors';
import { PaymentStatus } from '../../shared/payment-status';
import { canTransitPaymentStatus } from './payment.state-machine';

@Injectable()
export class PaymentsService {
  constructor(private readonly paymentsRepository: PaymentsRepository) {}

  async create(dto: CreatePaymentDto) {
    const payment = await this.paymentsRepository.create({
      paymentNo: this.generatePaymentNo(),
      orderId: dto.order_id,
      userId: dto.user_id,
      paymentMethod: dto.payment_method,
      paymentChannel: dto.payment_channel,
      amount: new Decimal(dto.amount).toFixed(18),
      currency: dto.currency,
      receiverWallet: this.getReceiverWallet(dto.payment_method, dto.chain),
      expiredAt: this.getDefaultExpiredAt()
    });

    return {
      payment_id: payment.id,
      payment_no: payment.paymentNo,
      order_id: payment.orderId,
      amount: payment.amount.toString(),
      currency: payment.currency,
      payment_method: payment.paymentMethod,
      receiver_wallet: payment.receiverWallet,
      payment_status: payment.paymentStatus,
      expired_at: payment.expiredAt
    };
  }

  async detail(paymentId: string) {
    const payment = await this.paymentsRepository.findById(paymentId);

    if (!payment) {
      throw new Error(PaymentErrors.PAYMENT_NOT_FOUND);
    }

    return {
      payment_id: payment.id,
      payment_no: payment.paymentNo,
      order_id: payment.orderId,
      user_id: payment.userId,
      payment_method: payment.paymentMethod,
      amount: payment.amount.toString(),
      currency: payment.currency,
      payment_status: payment.paymentStatus,
      tx_hash: payment.txHash,
      paid_at: payment.paidAt,
      expired_at: payment.expiredAt
    };
  }

  async list(query: QueryPaymentsDto) {
    const page = Number(query.page || 1);
    const pageSize = Math.min(Number(query.page_size || 20), 100);

    const [items, total] = await Promise.all([
      this.paymentsRepository.findMany({
        paymentNo: query.payment_no,
        orderId: query.order_id,
        userId: query.user_id,
        paymentStatus: query.payment_status,
        page,
        pageSize
      }),
      this.paymentsRepository.count({
        paymentNo: query.payment_no,
        orderId: query.order_id,
        userId: query.user_id,
        paymentStatus: query.payment_status
      })
    ]);

    return {
      items: items.map((payment) => ({
        payment_id: payment.id,
        payment_no: payment.paymentNo,
        order_id: payment.orderId,
        user_id: payment.userId,
        payment_method: payment.paymentMethod,
        amount: payment.amount.toString(),
        currency: payment.currency,
        payment_status: payment.paymentStatus,
        tx_hash: payment.txHash,
        created_at: payment.createdAt
      })),
      pagination: {
        page,
        page_size: pageSize,
        total,
        total_pages: Math.ceil(total / pageSize)
      }
    };
  }

  async simulateSuccess(paymentId: string, dto: SimulatePaymentSuccessDto) {
    const payment = await this.paymentsRepository.findById(paymentId);

    if (!payment) {
      throw new Error(PaymentErrors.PAYMENT_NOT_FOUND);
    }

    if (!canTransitPaymentStatus(payment.paymentStatus, PaymentStatus.SUCCESS)) {
      throw new Error(PaymentErrors.PAYMENT_STATUS_INVALID);
    }

    if (dto.tx_hash) {
      const existing = await this.paymentsRepository.findByTxHash(dto.tx_hash);
      if (existing && existing.id !== payment.id) {
        throw new Error(PaymentErrors.PAYMENT_TX_HASH_DUPLICATED);
      }
    }

    const updated = await this.paymentsRepository.markSuccess({
      paymentId: payment.id,
      txHash: dto.tx_hash
    });

    return {
      payment_id: updated.id,
      payment_no: updated.paymentNo,
      order_id: updated.orderId,
      payment_status: updated.paymentStatus,
      tx_hash: updated.txHash,
      paid_at: updated.paidAt
    };
  }

  async handleCallback(provider: string, dto: PaymentCallbackDto) {
    const payment = await this.paymentsRepository.findByNo(dto.payment_no);

    if (!payment) {
      await this.paymentsRepository.createCallback({
        provider,
        callbackPayload: dto as any,
        signature: dto.signature,
        signatureVerified: false,
        idempotencyKey: dto.idempotency_key || this.generateCallbackKey(provider, dto),
        processed: false
      });

      throw new Error(PaymentErrors.PAYMENT_NOT_FOUND);
    }

    if (payment.paymentStatus === PaymentStatus.SUCCESS) {
      return {
        payment_id: payment.id,
        payment_no: payment.paymentNo,
        payment_status: payment.paymentStatus,
        duplicated: true
      };
    }

    if (!new Decimal(dto.amount).eq(payment.amount.toString())) {
      throw new Error(PaymentErrors.PAYMENT_AMOUNT_MISMATCH);
    }

    if (dto.currency !== payment.currency) {
      throw new Error(PaymentErrors.PAYMENT_CURRENCY_MISMATCH);
    }

    if (dto.tx_hash) {
      const existing = await this.paymentsRepository.findByTxHash(dto.tx_hash);
      if (existing && existing.id !== payment.id) {
        throw new Error(PaymentErrors.PAYMENT_TX_HASH_DUPLICATED);
      }
    }

    if (dto.status !== 'success') {
      const failed = await this.paymentsRepository.markFailed({
        paymentId: payment.id,
        reason: dto.status
      });

      return {
        payment_id: failed.id,
        payment_no: failed.paymentNo,
        payment_status: failed.paymentStatus
      };
    }

    const updated = await this.paymentsRepository.markSuccess({
      paymentId: payment.id,
      txHash: dto.tx_hash,
      callbackPayload: dto as any,
      provider,
      idempotencyKey: dto.idempotency_key || this.generateCallbackKey(provider, dto),
      signature: dto.signature
    });

    return {
      payment_id: updated.id,
      payment_no: updated.paymentNo,
      order_id: updated.orderId,
      payment_status: updated.paymentStatus,
      tx_hash: updated.txHash,
      paid_at: updated.paidAt
    };
  }

  private generatePaymentNo() {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    return `PAY${date}${ulid()}`;
  }

  private getReceiverWallet(paymentMethod: string, chain?: string) {
    if (paymentMethod === 'usdt') {
      if (chain === 'BSC') return process.env.BSC_USDT_RECEIVER || '0xBscReceiver';
      if (chain === 'ETH') return process.env.ETH_USDT_RECEIVER || '0xEthReceiver';
      return process.env.USDT_RECEIVER || '0xUsdtReceiver';
    }

    return undefined;
  }

  private getDefaultExpiredAt() {
    const date = new Date();
    date.setMinutes(date.getMinutes() + 60);
    return date;
  }

  private generateCallbackKey(provider: string, dto: PaymentCallbackDto) {
    return `${provider}:${dto.payment_no}:${dto.tx_hash || dto.status}`;
  }
}
```



---



# 14\. Payments User Controller



`apps/payment-service/src/modules/payments/payments.controller.ts`



```TypeScript
import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { QueryPaymentsDto } from './dto/query-payments.dto';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post()
  create(@Body() dto: CreatePaymentDto) {
    return this.paymentsService.create(dto);
  }

  @Get()
  list(@Query() query: QueryPaymentsDto) {
    return this.paymentsService.list(query);
  }

  @Get(':payment_id')
  detail(@Param('payment_id') paymentId: string) {
    return this.paymentsService.detail(paymentId);
  }
}
```



---



# 15\. Payments Admin Controller



`apps/payment-service/src/modules/payments/payments.admin.controller.ts`



```TypeScript
import { Body, Controller, Param, Post } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { SimulatePaymentSuccessDto } from './dto/simulate-payment-success.dto';

@Controller('admin/payments')
export class PaymentsAdminController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post(':payment_id/simulate-success')
  simulateSuccess(
    @Param('payment_id') paymentId: string,
    @Body() dto: SimulatePaymentSuccessDto
  ) {
    return this.paymentsService.simulateSuccess(paymentId, dto);
  }
}
```



---



# 16\. Payment Webhook Controller



`apps/payment-service/src/modules/payments/payments.webhook.controller.ts`



```TypeScript
import { Body, Controller, Param, Post } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PaymentCallbackDto } from './dto/payment-callback.dto';

@Controller('webhooks/payments')
export class PaymentsWebhookController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post(':provider')
  handleCallback(
    @Param('provider') provider: string,
    @Body() dto: PaymentCallbackDto
  ) {
    return this.paymentsService.handleCallback(provider, dto);
  }
}
```



---



# 17\. Payments Module



`apps/payment-service/src/modules/payments/payments.module.ts`



```TypeScript
import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { PaymentsAdminController } from './payments.admin.controller';
import { PaymentsWebhookController } from './payments.webhook.controller';
import { PaymentsService } from './payments.service';
import { PaymentsRepository } from './payments.repository';

@Module({
  controllers: [
    PaymentsController,
    PaymentsAdminController,
    PaymentsWebhookController
  ],
  providers: [PaymentsService, PaymentsRepository],
  exports: [PaymentsService]
})
export class PaymentsModule {}
```



---



# 18\. DTO：CreateRefundDto



`apps/payment-service/src/modules/refunds/dto/create-refund.dto.ts`



```TypeScript
import { IsOptional, IsString } from 'class-validator';

export class CreateRefundDto {
  @IsString()
  order_id!: string;

  @IsOptional()
  @IsString()
  payment_id?: string;

  @IsString()
  user_id!: string;

  @IsString()
  refund_amount!: string;

  @IsString()
  currency!: string;

  @IsString()
  refund_reason!: string;
}
```



---



# 19\. DTO：ApproveRefundDto



`apps/payment-service/src/modules/refunds/dto/approve-refund.dto.ts`



```TypeScript
import { IsOptional, IsString } from 'class-validator';

export class ApproveRefundDto {
  @IsString()
  reviewer_id!: string;

  @IsOptional()
  @IsString()
  review_note?: string;
}
```



---



# 20\. DTO：RejectRefundDto



`apps/payment-service/src/modules/refunds/dto/reject-refund.dto.ts`



```TypeScript
import { IsString } from 'class-validator';

export class RejectRefundDto {
  @IsString()
  reviewer_id!: string;

  @IsString()
  review_note!: string;
}
```



---



# 21\. Refunds Repository



`apps/payment-service/src/modules/refunds/refunds.repository.ts`



```TypeScript
import { Injectable } from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';
import { ulid } from 'ulid';

const prisma = new PrismaClient();

@Injectable()
export class RefundsRepository {
  findById(refundId: string) {
    return prisma.refund.findUnique({
      where: { id: refundId },
      include: {
        adjustments: true
      }
    });
  }

  create(data: {
    refundNo: string;
    orderId: string;
    paymentId?: string;
    userId: string;
    refundAmount: string;
    currency: string;
    refundReason: string;
  }) {
    return prisma.$transaction(async (tx) => {
      const refund = await tx.refund.create({
        data: {
          id: ulid(),
          refundNo: data.refundNo,
          orderId: data.orderId,
          paymentId: data.paymentId,
          userId: data.userId,
          refundAmount: new Prisma.Decimal(data.refundAmount),
          currency: data.currency,
          refundReason: data.refundReason,
          refundStatus: 'requested'
        }
      });

      await tx.outboxEvent.create({
        data: {
          id: ulid(),
          eventType: 'refund.requested.v1',
          payload: {
            refund_id: refund.id,
            refund_no: refund.refundNo,
            order_id: refund.orderId,
            user_id: refund.userId,
            refund_amount: refund.refundAmount.toString(),
            currency: refund.currency
          },
          status: 'pending',
          retryCount: 0
        }
      });

      return refund;
    });
  }

  updateStatus(params: {
    refundId: string;
    refundStatus: string;
    reviewerId?: string;
    reviewNote?: string;
    eventType?: string;
  }) {
    return prisma.$transaction(async (tx) => {
      const refund = await tx.refund.update({
        where: { id: params.refundId },
        data: {
          refundStatus: params.refundStatus,
          reviewerId: params.reviewerId,
          reviewNote: params.reviewNote,
          processedAt: ['refunded', 'failed'].includes(params.refundStatus)
            ? new Date()
            : undefined
        }
      });

      if (params.eventType) {
        await tx.outboxEvent.create({
          data: {
            id: ulid(),
            eventType: params.eventType,
            payload: {
              refund_id: refund.id,
              refund_no: refund.refundNo,
              order_id: refund.orderId,
              user_id: refund.userId,
              refund_amount: refund.refundAmount.toString(),
              currency: refund.currency,
              refund_status: refund.refundStatus
            },
            status: 'pending',
            retryCount: 0
          }
        });
      }

      return refund;
    });
  }
}
```



---



# 22\. Refunds Service



`apps/payment-service/src/modules/refunds/refunds.service.ts`



```TypeScript
import { Injectable } from '@nestjs/common';
import Decimal from 'decimal.js';
import { ulid } from 'ulid';
import { CreateRefundDto } from './dto/create-refund.dto';
import { ApproveRefundDto } from './dto/approve-refund.dto';
import { RejectRefundDto } from './dto/reject-refund.dto';
import { RefundsRepository } from './refunds.repository';
import { PaymentErrors } from '../../shared/payment-errors';
import { RefundStatus } from '../../shared/payment-status';
import { PaymentEvents } from '../../shared/payment-events';

@Injectable()
export class RefundsService {
  constructor(private readonly refundsRepository: RefundsRepository) {}

  async create(dto: CreateRefundDto) {
    if (new Decimal(dto.refund_amount).lte(0)) {
      throw new Error(PaymentErrors.REFUND_AMOUNT_INVALID);
    }

    const refund = await this.refundsRepository.create({
      refundNo: this.generateRefundNo(),
      orderId: dto.order_id,
      paymentId: dto.payment_id,
      userId: dto.user_id,
      refundAmount: new Decimal(dto.refund_amount).toFixed(18),
      currency: dto.currency,
      refundReason: dto.refund_reason
    });

    return {
      refund_id: refund.id,
      refund_no: refund.refundNo,
      order_id: refund.orderId,
      refund_amount: refund.refundAmount.toString(),
      currency: refund.currency,
      refund_status: refund.refundStatus
    };
  }

  async detail(refundId: string) {
    const refund = await this.refundsRepository.findById(refundId);

    if (!refund) {
      throw new Error(PaymentErrors.REFUND_NOT_FOUND);
    }

    return {
      refund_id: refund.id,
      refund_no: refund.refundNo,
      order_id: refund.orderId,
      payment_id: refund.paymentId,
      user_id: refund.userId,
      refund_amount: refund.refundAmount.toString(),
      currency: refund.currency,
      refund_reason: refund.refundReason,
      refund_status: refund.refundStatus,
      reviewer_id: refund.reviewerId,
      review_note: refund.reviewNote,
      created_at: refund.createdAt
    };
  }

  async approve(refundId: string, dto: ApproveRefundDto) {
    const refund = await this.refundsRepository.findById(refundId);

    if (!refund) {
      throw new Error(PaymentErrors.REFUND_NOT_FOUND);
    }

    if (refund.refundStatus !== RefundStatus.REQUESTED) {
      throw new Error(PaymentErrors.REFUND_STATUS_INVALID);
    }

    const updated = await this.refundsRepository.updateStatus({
      refundId,
      refundStatus: RefundStatus.APPROVED,
      reviewerId: dto.reviewer_id,
      reviewNote: dto.review_note,
      eventType: PaymentEvents.REFUND_APPROVED
    });

    return {
      refund_id: updated.id,
      refund_no: updated.refundNo,
      refund_status: updated.refundStatus
    };
  }

  async reject(refundId: string, dto: RejectRefundDto) {
    const refund = await this.refundsRepository.findById(refundId);

    if (!refund) {
      throw new Error(PaymentErrors.REFUND_NOT_FOUND);
    }

    if (refund.refundStatus !== RefundStatus.REQUESTED) {
      throw new Error(PaymentErrors.REFUND_STATUS_INVALID);
    }

    const updated = await this.refundsRepository.updateStatus({
      refundId,
      refundStatus: RefundStatus.REJECTED,
      reviewerId: dto.reviewer_id,
      reviewNote: dto.review_note,
      eventType: PaymentEvents.REFUND_REJECTED
    });

    return {
      refund_id: updated.id,
      refund_no: updated.refundNo,
      refund_status: updated.refundStatus,
      review_note: updated.reviewNote
    };
  }

  private generateRefundNo() {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    return `RFN${date}${ulid()}`;
  }
}
```



---



# 23\. Refunds User Controller



`apps/payment-service/src/modules/refunds/refunds.controller.ts`



```TypeScript
import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { RefundsService } from './refunds.service';
import { CreateRefundDto } from './dto/create-refund.dto';

@Controller('refunds')
export class RefundsController {
  constructor(private readonly refundsService: RefundsService) {}

  @Post()
  create(@Body() dto: CreateRefundDto) {
    return this.refundsService.create(dto);
  }

  @Get(':refund_id')
  detail(@Param('refund_id') refundId: string) {
    return this.refundsService.detail(refundId);
  }
}
```



---



# 24\. Refunds Admin Controller



`apps/payment-service/src/modules/refunds/refunds.admin.controller.ts`



```TypeScript
import { Body, Controller, Param, Post } from '@nestjs/common';
import { RefundsService } from './refunds.service';
import { ApproveRefundDto } from './dto/approve-refund.dto';
import { RejectRefundDto } from './dto/reject-refund.dto';

@Controller('admin/refunds')
export class RefundsAdminController {
  constructor(private readonly refundsService: RefundsService) {}

  @Post(':refund_id/approve')
  approve(
    @Param('refund_id') refundId: string,
    @Body() dto: ApproveRefundDto
  ) {
    return this.refundsService.approve(refundId, dto);
  }

  @Post(':refund_id/reject')
  reject(
    @Param('refund_id') refundId: string,
    @Body() dto: RejectRefundDto
  ) {
    return this.refundsService.reject(refundId, dto);
  }
}
```



---



# 25\. Refunds Module



`apps/payment-service/src/modules/refunds/refunds.module.ts`



```TypeScript
import { Module } from '@nestjs/common';
import { RefundsController } from './refunds.controller';
import { RefundsAdminController } from './refunds.admin.controller';
import { RefundsService } from './refunds.service';
import { RefundsRepository } from './refunds.repository';

@Module({
  controllers: [RefundsController, RefundsAdminController],
  providers: [RefundsService, RefundsRepository],
  exports: [RefundsService]
})
export class RefundsModule {}
```



---



# 26\. Payment App Module



`apps/payment-service/src/app.module.ts`



```TypeScript
import { Module } from '@nestjs/common';
import { HealthModule } from './health/health.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { RefundsModule } from './modules/refunds/refunds.module';

@Module({
  imports: [
    HealthModule,
    PaymentsModule,
    RefundsModule
  ]
})
export class AppModule {}
```



---



# 27\. Payment Service 当前 API



## 用户端



```HTTP
POST /api/v1/payments
GET /api/v1/payments
GET /api/v1/payments/:payment_id

POST /api/v1/refunds
GET /api/v1/refunds/:refund_id
```



## 后台端



```HTTP
POST /api/v1/admin/payments/:payment_id/simulate-success

POST /api/v1/admin/refunds/:refund_id/approve
POST /api/v1/admin/refunds/:refund_id/reject
```



## 回调端



```HTTP
POST /api/v1/webhooks/payments/:provider
```



---



# 28\. Payment Service 已具备能力



这一版完成后，Payment Service 支持：



```Plain Text
创建支付单
查询支付单
支付列表
模拟支付成功
支付回调处理
支付金额校验
支付币种校验
tx_hash 唯一校验
重复成功回调幂等返回
PaymentCreated outbox 事件
PaymentSucceeded outbox 事件
退款申请
退款审核通过
退款审核拒绝
RefundRequested outbox 事件
RefundApproved outbox 事件
RefundRejected outbox 事件
```



---



# 29\. 还需要补强的工业级能力



下一步基础库完善后补：



```Plain Text
统一 AppException
PrismaModule 注入
真实 Idempotency-Key 拦截器
支付回调签名校验
支付通道 Provider 抽象
USDT 链上监听
支付成功后自动调用 Order Service markPaid
退款成功后自动触发冲销链路
Audit Log
Risk Check
Admin 权限 Guard
支付单过期定时任务
人工确认支付审批流
```



---



# 30\. 下一步继续



按 23 个 Service 顺序，下一步写：



```Plain Text
6. Revenue Service 收入分配服务
```



Revenue Service 第一版会包含：



```Plain Text
接收 order.paid 事件
生成 369 USD 40 / 30 / 30 分账
生成 revenue_allocations
生成 revenue_allocation_items
分账详情查询
分账池统计
退款分账冲销预留
RevenueAllocated outbox 事件
```



需要补强数据库：



```Plain Text
revenue_allocations
revenue_allocation_items
revenue_reversals
revenue_reversal_items
revenue_settlements
```



