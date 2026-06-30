# H020\-4 个 Service：Order Service 订单服务

下面继续按 23 个 Service 顺序写代码。



# 第 4 个 Service：Order Service 订单服务



本服务负责：



```Plain Text
订单创建
订单查询
订单状态机
订单取消
订单支付成功处理
订单风控冻结
订单状态日志
订单明细快照
履约任务预留
OrderCreated / OrderPaid 事件预留
```



---



# 1\. Order Service 目录结构



```Plain Text
apps/order-service/
├── src/
│   ├── main.ts
│   ├── app.module.ts
│   ├── health/
│   ├── shared/
│   │   ├── order-errors.ts
│   │   ├── order-events.ts
│   │   ├── order-status.ts
│   │   └── order-types.ts
│   └── modules/
│       └── orders/
│           ├── orders.module.ts
│           ├── orders.controller.ts
│           ├── orders.admin.controller.ts
│           ├── orders.service.ts
│           ├── orders.repository.ts
│           ├── order.state-machine.ts
│           └── dto/
│               ├── create-order.dto.ts
│               ├── query-orders.dto.ts
│               ├── cancel-order.dto.ts
│               ├── mark-order-paid.dto.ts
│               └── risk-hold-order.dto.ts
```



---



# 2\. Prisma 补充表



## 2\.1 OrderItem



```Plain Text
model OrderItem {
  id                  String   @id
  orderId             String   @map("order_id")
  productId           String   @map("product_id")
  productName         String   @map("product_name")
  productType         String   @map("product_type")
  quantity            Int
  unitPrice           Decimal  @map("unit_price") @db.Decimal(36, 18)
  totalPrice          Decimal  @map("total_price") @db.Decimal(36, 18)
  taxAmount           Decimal  @default(0) @map("tax_amount") @db.Decimal(36, 18)
  currency            String
  benefitSnapshotJson Json?    @map("benefit_snapshot_json")
  createdAt           DateTime @default(now()) @map("created_at")
  updatedAt           DateTime @updatedAt @map("updated_at")

  order               Order    @relation(fields: [orderId], references: [id])

  @@index([orderId])
  @@map("order_items")
}
```



## 2\.2 OrderStatusLog



```Plain Text
model OrderStatusLog {
  id          String   @id
  orderId     String   @map("order_id")
  fromStatus  String?  @map("from_status")
  toStatus    String   @map("to_status")
  reason      String?
  operatorId  String?  @map("operator_id")
  eventSource String   @default("system") @map("event_source")
  createdAt   DateTime @default(now()) @map("created_at")
  metadata    Json?

  order       Order    @relation(fields: [orderId], references: [id])

  @@index([orderId])
  @@map("order_status_logs")
}
```



## 2\.3 Fulfillment



```Plain Text
model Fulfillment {
  id              String   @id
  fulfillmentNo   String   @unique @map("fulfillment_no")
  orderId         String   @map("order_id")
  userId          String   @map("user_id")
  fulfillmentType String   @map("fulfillment_type")
  status          String   @default("pending")
  createdAt       DateTime @default(now()) @map("created_at")
  updatedAt       DateTime @updatedAt @map("updated_at")
  metadata        Json?

  order           Order    @relation(fields: [orderId], references: [id])
  items           FulfillmentItem[]

  @@index([orderId])
  @@index([userId])
  @@map("fulfillments")
}
```



## 2\.4 FulfillmentItem



```Plain Text
model FulfillmentItem {
  id            String    @id
  fulfillmentId String    @map("fulfillment_id")
  itemType      String    @map("item_type")
  itemId        String?   @map("item_id")
  status        String    @default("pending")
  trackingNo    String?   @map("tracking_no")
  carrier       String?
  deliveredAt   DateTime? @map("delivered_at")
  createdAt     DateTime  @default(now()) @map("created_at")
  updatedAt     DateTime  @updatedAt @map("updated_at")
  metadata      Json?

  fulfillment   Fulfillment @relation(fields: [fulfillmentId], references: [id])

  @@index([fulfillmentId])
  @@map("fulfillment_items")
}
```



## 2\.5 Order 模型补充关系



在已有 `Order` model 中补充：



```Plain Text
items          OrderItem[]
statusLogs     OrderStatusLog[]
fulfillments   Fulfillment[]
```



---



# 3\. Order Events



`apps/order-service/src/shared/order-events.ts`



```TypeScript
export const OrderEvents = {
  ORDER_CREATED: 'order.created.v1',
  ORDER_CANCELLED: 'order.cancelled.v1',
  ORDER_PAID: 'order.paid.v1',
  ORDER_CONFIRMED: 'order.confirmed.v1',
  ORDER_RISK_HELD: 'order.risk_held.v1',
  ORDER_FULFILLING: 'order.fulfilling.v1',
  ORDER_FULFILLED: 'order.fulfilled.v1',
  ORDER_COMPLETED: 'order.completed.v1',
  ORDER_REFUND_REQUESTED: 'order.refund_requested.v1'
} as const;
```



---



# 4\. Order Errors



`apps/order-service/src/shared/order-errors.ts`



```TypeScript
export const OrderErrors = {
  ORDER_NOT_FOUND: 'ORDER_NOT_FOUND',
  ORDER_STATUS_INVALID: 'ORDER_STATUS_INVALID',
  ORDER_ALREADY_PAID: 'ORDER_ALREADY_PAID',
  ORDER_CANNOT_BE_CANCELLED: 'ORDER_CANNOT_BE_CANCELLED',
  ORDER_CANNOT_BE_PAID: 'ORDER_CANNOT_BE_PAID',
  ORDER_PRODUCT_REQUIRED: 'ORDER_PRODUCT_REQUIRED',
  ORDER_AMOUNT_INVALID: 'ORDER_AMOUNT_INVALID',
  PRODUCT_NOT_ACTIVE: 'PRODUCT_NOT_ACTIVE',
  USER_NOT_ALLOWED_TO_ORDER: 'USER_NOT_ALLOWED_TO_ORDER',
  ORDER_REGION_BLOCKED: 'ORDER_REGION_BLOCKED',
  ORDER_STOCK_INSUFFICIENT: 'ORDER_STOCK_INSUFFICIENT'
} as const;
```



---



# 5\. Order Status



`apps/order-service/src/shared/order-status.ts`



```TypeScript
export const OrderStatus = {
  CREATED: 'created',
  PENDING_PAYMENT: 'pending_payment',
  PAYMENT_PROCESSING: 'payment_processing',
  PAID: 'paid',
  RISK_CHECKING: 'risk_checking',
  CONFIRMED: 'confirmed',
  FULFILLING: 'fulfilling',
  FULFILLED: 'fulfilled',
  COMPLETED: 'completed',
  REFUND_REQUESTED: 'refund_requested',
  REFUND_REVIEWING: 'refund_reviewing',
  PARTIAL_REFUNDED: 'partial_refunded',
  REFUNDED: 'refunded',
  CANCELLED: 'cancelled',
  RISK_HOLD: 'risk_hold',
  FAILED: 'failed'
} as const;

export const PaymentStatus = {
  UNPAID: 'unpaid',
  PENDING: 'pending',
  PROCESSING: 'processing',
  SUCCESS: 'success',
  FAILED: 'failed',
  EXPIRED: 'expired'
} as const;

export const RefundStatus = {
  NONE: 'none',
  REQUESTED: 'requested',
  REVIEWING: 'reviewing',
  PARTIAL_REFUNDED: 'partial_refunded',
  REFUNDED: 'refunded',
  REJECTED: 'rejected'
} as const;
```



---



# 6\. Order Types



`apps/order-service/src/shared/order-types.ts`



```TypeScript
export const OrderTypes = {
  WINE_ORDER: 'wine_order',
  AEP_ORDER: 'aep_order',
  MALL_ORDER: 'mall_order',
  NFT_UPGRADE_ORDER: 'nft_upgrade_order',
  AI_SERVICE_ORDER: 'ai_service_order',
  VIRTUAL_POINTS_ORDER: 'virtual_points_order',
  CORPORATE_SERVICE_ORDER: 'corporate_service_order',
  EVENT_TICKET_ORDER: 'event_ticket_order'
} as const;
```



---



# 7\. Order 状态机



`apps/order-service/src/modules/orders/order.state-machine.ts`



```TypeScript
export const OrderStateTransitions: Record = {
  created: ['pending_payment', 'cancelled'],
  pending_payment: ['payment_processing', 'paid', 'cancelled', 'failed'],
  payment_processing: ['paid', 'failed', 'cancelled'],
  paid: ['risk_checking', 'confirmed', 'refund_requested', 'risk_hold'],
  risk_checking: ['confirmed', 'risk_hold', 'cancelled'],
  confirmed: ['fulfilling', 'refund_requested', 'risk_hold'],
  fulfilling: ['fulfilled', 'risk_hold'],
  fulfilled: ['completed', 'refund_requested'],
  completed: ['refund_requested'],
  refund_requested: ['refund_reviewing', 'cancelled'],
  refund_reviewing: ['refunded', 'partial_refunded', 'confirmed'],
  partial_refunded: ['completed'],
  refunded: [],
  cancelled: [],
  risk_hold: ['confirmed', 'cancelled', 'refund_requested'],
  failed: []
};

export function canTransitOrderStatus(from: string, to: string): boolean {
  return OrderStateTransitions[from]?.includes(to) ?? false;
}
```



---



# 8\. DTO：CreateOrderDto



`apps/order-service/src/modules/orders/dto/create-order.dto.ts`



```TypeScript
import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreateOrderDto {
  @IsString()
  user_id!: string;

  @IsString()
  product_id!: string;

  @IsInt()
  @Min(1)
  quantity!: number;

  @IsString()
  currency!: string;

  @IsOptional()
  @IsString()
  shipping_address_id?: string;

  @IsOptional()
  @IsString()
  referral_code?: string;
}
```



---



# 9\. DTO：QueryOrdersDto



`apps/order-service/src/modules/orders/dto/query-orders.dto.ts`



```TypeScript
import { IsOptional, IsString } from 'class-validator';

export class QueryOrdersDto {
  @IsOptional()
  @IsString()
  user_id?: string;

  @IsOptional()
  @IsString()
  order_no?: string;

  @IsOptional()
  @IsString()
  product_type?: string;

  @IsOptional()
  @IsString()
  order_status?: string;

  @IsOptional()
  @IsString()
  payment_status?: string;

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



# 10\. DTO：CancelOrderDto



`apps/order-service/src/modules/orders/dto/cancel-order.dto.ts`



```TypeScript
import { IsOptional, IsString } from 'class-validator';

export class CancelOrderDto {
  @IsString()
  reason!: string;

  @IsOptional()
  @IsString()
  operator_id?: string;
}
```



---



# 11\. DTO：MarkOrderPaidDto



`apps/order-service/src/modules/orders/dto/mark-order-paid.dto.ts`



```TypeScript
import { IsOptional, IsString } from 'class-validator';

export class MarkOrderPaidDto {
  @IsString()
  payment_id!: string;

  @IsString()
  payment_no!: string;

  @IsString()
  paid_amount!: string;

  @IsString()
  currency!: string;

  @IsOptional()
  @IsString()
  tx_hash?: string;

  @IsOptional()
  @IsString()
  operator_id?: string;
}
```



---



# 12\. DTO：RiskHoldOrderDto



`apps/order-service/src/modules/orders/dto/risk-hold-order.dto.ts`



```TypeScript
import { IsOptional, IsString } from 'class-validator';

export class RiskHoldOrderDto {
  @IsString()
  reason!: string;

  @IsOptional()
  @IsString()
  operator_id?: string;
}
```



---



# 13\. Orders Repository



`apps/order-service/src/modules/orders/orders.repository.ts`



```TypeScript
import { Injectable } from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';
import { ulid } from 'ulid';

const prisma = new PrismaClient();

@Injectable()
export class OrdersRepository {
  findById(orderId: string) {
    return prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: true,
        statusLogs: true,
        payments: true,
        allocations: true,
        fulfillments: {
          include: {
            items: true
          }
        }
      }
    });
  }

  findByNo(orderNo: string) {
    return prisma.order.findUnique({
      where: { orderNo },
      include: {
        items: true
      }
    });
  }

  findMany(params: {
    userId?: string;
    orderNo?: string;
    productType?: string;
    orderStatus?: string;
    paymentStatus?: string;
    riskStatus?: string;
    page: number;
    pageSize: number;
  }) {
    return prisma.order.findMany({
      where: {
        userId: params.userId,
        orderNo: params.orderNo,
        productType: params.productType,
        orderStatus: params.orderStatus,
        paymentStatus: params.paymentStatus,
        riskStatus: params.riskStatus
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip: (params.page - 1) * params.pageSize,
      take: params.pageSize,
      include: {
        items: true
      }
    });
  }

  count(params: {
    userId?: string;
    orderNo?: string;
    productType?: string;
    orderStatus?: string;
    paymentStatus?: string;
    riskStatus?: string;
  }) {
    return prisma.order.count({
      where: {
        userId: params.userId,
        orderNo: params.orderNo,
        productType: params.productType,
        orderStatus: params.orderStatus,
        paymentStatus: params.paymentStatus,
        riskStatus: params.riskStatus
      }
    });
  }

  createWithItem(data: {
    orderNo: string;
    userId: string;
    productId: string;
    productType: string;
    productName: string;
    quantity: number;
    unitPrice: string;
    totalAmount: string;
    taxAmount: string;
    payableAmount: string;
    currency: string;
    referrerId?: string;
    benefitSnapshotJson?: Prisma.InputJsonValue;
  }) {
    return prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          id: ulid(),
          orderNo: data.orderNo,
          userId: data.userId,
          productId: data.productId,
          productType: data.productType,
          quantity: data.quantity,
          unitPrice: new Prisma.Decimal(data.unitPrice),
          totalAmount: new Prisma.Decimal(data.totalAmount),
          taxAmount: new Prisma.Decimal(data.taxAmount),
          payableAmount: new Prisma.Decimal(data.payableAmount),
          currency: data.currency,
          orderStatus: 'pending_payment',
          paymentStatus: 'unpaid',
          refundStatus: 'none',
          riskStatus: 'normal',
          referrerId: data.referrerId
        }
      });

      await tx.orderItem.create({
        data: {
          id: ulid(),
          orderId: order.id,
          productId: data.productId,
          productName: data.productName,
          productType: data.productType,
          quantity: data.quantity,
          unitPrice: new Prisma.Decimal(data.unitPrice),
          totalPrice: new Prisma.Decimal(data.totalAmount),
          taxAmount: new Prisma.Decimal(data.taxAmount),
          currency: data.currency,
          benefitSnapshotJson: data.benefitSnapshotJson
        }
      });

      await tx.orderStatusLog.create({
        data: {
          id: ulid(),
          orderId: order.id,
          fromStatus: null,
          toStatus: 'pending_payment',
          reason: 'order created',
          eventSource: 'system'
        }
      });

      await tx.outboxEvent.create({
        data: {
          id: ulid(),
          eventType: 'order.created.v1',
          payload: {
            order_id: order.id,
            order_no: order.orderNo,
            user_id: order.userId,
            product_id: order.productId,
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

  updateStatus(params: {
    orderId: string;
    fromStatus: string;
    toStatus: string;
    reason?: string;
    operatorId?: string;
    eventSource?: string;
    paymentStatus?: string;
    riskStatus?: string;
  }) {
    return prisma.$transaction(async (tx) => {
      const order = await tx.order.update({
        where: { id: params.orderId },
        data: {
          orderStatus: params.toStatus,
          paymentStatus: params.paymentStatus,
          riskStatus: params.riskStatus
        }
      });

      await tx.orderStatusLog.create({
        data: {
          id: ulid(),
          orderId: params.orderId,
          fromStatus: params.fromStatus,
          toStatus: params.toStatus,
          reason: params.reason,
          operatorId: params.operatorId,
          eventSource: params.eventSource || 'system'
        }
      });

      return order;
    });
  }

  markPaid(params: {
    orderId: string;
    fromStatus: string;
    paymentStatus: string;
    reason?: string;
    operatorId?: string;
  }) {
    return prisma.$transaction(async (tx) => {
      const order = await tx.order.update({
        where: { id: params.orderId },
        data: {
          orderStatus: 'paid',
          paymentStatus: params.paymentStatus,
          paidAt: new Date()
        }
      });

      await tx.orderStatusLog.create({
        data: {
          id: ulid(),
          orderId: params.orderId,
          fromStatus: params.fromStatus,
          toStatus: 'paid',
          reason: params.reason || 'payment succeeded',
          operatorId: params.operatorId,
          eventSource: 'payment'
        }
      });

      await tx.outboxEvent.create({
        data: {
          id: ulid(),
          eventType: 'order.paid.v1',
          payload: {
            order_id: order.id,
            order_no: order.orderNo,
            user_id: order.userId,
            product_id: order.productId,
            product_type: order.productType,
            paid_amount: order.payableAmount.toString(),
            tax_amount: order.taxAmount.toString(),
            currency: order.currency
          },
          status: 'pending',
          retryCount: 0
        }
      });

      return order;
    });
  }
}
```



---



# 14\. Orders Service



`apps/order-service/src/modules/orders/orders.service.ts`



```TypeScript
import { Injectable } from '@nestjs/common';
import Decimal from 'decimal.js';
import { ulid } from 'ulid';
import { OrdersRepository } from './orders.repository';
import { CreateOrderDto } from './dto/create-order.dto';
import { QueryOrdersDto } from './dto/query-orders.dto';
import { CancelOrderDto } from './dto/cancel-order.dto';
import { MarkOrderPaidDto } from './dto/mark-order-paid.dto';
import { RiskHoldOrderDto } from './dto/risk-hold-order.dto';
import { OrderErrors } from '../../shared/order-errors';
import { OrderStatus, PaymentStatus } from '../../shared/order-status';
import { canTransitOrderStatus } from './order.state-machine';

@Injectable()
export class OrdersService {
  constructor(private readonly ordersRepository: OrdersRepository) {}

  async create(dto: CreateOrderDto) {
    const productSnapshot = await this.getProductSnapshot(dto.product_id);

    if (productSnapshot.status !== 'active') {
      throw new Error(OrderErrors.PRODUCT_NOT_ACTIVE);
    }

    if (dto.currency !== productSnapshot.currency) {
      throw new Error(OrderErrors.ORDER_AMOUNT_INVALID);
    }

    const unitPrice = new Decimal(productSnapshot.price);
    const quantity = new Decimal(dto.quantity);
    const totalAmount = unitPrice.mul(quantity);
    const taxAmount = new Decimal(0);
    const payableAmount = totalAmount.add(taxAmount);

    const order = await this.ordersRepository.createWithItem({
      orderNo: this.generateOrderNo(),
      userId: dto.user_id,
      productId: productSnapshot.product_id,
      productType: productSnapshot.product_type,
      productName: productSnapshot.product_name,
      quantity: dto.quantity,
      unitPrice: unitPrice.toFixed(18),
      totalAmount: totalAmount.toFixed(18),
      taxAmount: taxAmount.toFixed(18),
      payableAmount: payableAmount.toFixed(18),
      currency: dto.currency,
      benefitSnapshotJson: productSnapshot.benefits
    });

    return {
      order_id: order.id,
      order_no: order.orderNo,
      product_type: order.productType,
      quantity: order.quantity,
      total_amount: order.totalAmount.toString(),
      tax_amount: order.taxAmount.toString(),
      payable_amount: order.payableAmount.toString(),
      currency: order.currency,
      order_status: order.orderStatus,
      payment_status: order.paymentStatus
    };
  }

  async detail(orderId: string) {
    const order = await this.ordersRepository.findById(orderId);

    if (!order) {
      throw new Error(OrderErrors.ORDER_NOT_FOUND);
    }

    return {
      order_id: order.id,
      order_no: order.orderNo,
      user_id: order.userId,
      product_id: order.productId,
      product_type: order.productType,
      quantity: order.quantity,
      total_amount: order.totalAmount.toString(),
      tax_amount: order.taxAmount.toString(),
      payable_amount: order.payableAmount.toString(),
      currency: order.currency,
      order_status: order.orderStatus,
      payment_status: order.paymentStatus,
      refund_status: order.refundStatus,
      risk_status: order.riskStatus,
      items: order.items.map((item) => ({
        item_id: item.id,
        product_id: item.productId,
        product_name: item.productName,
        product_type: item.productType,
        quantity: item.quantity,
        unit_price: item.unitPrice.toString(),
        total_price: item.totalPrice.toString(),
        benefit_snapshot: item.benefitSnapshotJson
      })),
      status_logs: order.statusLogs.map((log) => ({
        from_status: log.fromStatus,
        to_status: log.toStatus,
        reason: log.reason,
        event_source: log.eventSource,
        created_at: log.createdAt
      }))
    };
  }

  async list(query: QueryOrdersDto) {
    const page = Number(query.page || 1);
    const pageSize = Math.min(Number(query.page_size || 20), 100);

    const [items, total] = await Promise.all([
      this.ordersRepository.findMany({
        userId: query.user_id,
        orderNo: query.order_no,
        productType: query.product_type,
        orderStatus: query.order_status,
        paymentStatus: query.payment_status,
        riskStatus: query.risk_status,
        page,
        pageSize
      }),
      this.ordersRepository.count({
        userId: query.user_id,
        orderNo: query.order_no,
        productType: query.product_type,
        orderStatus: query.order_status,
        paymentStatus: query.payment_status,
        riskStatus: query.risk_status
      })
    ]);

    return {
      items: items.map((order) => ({
        order_id: order.id,
        order_no: order.orderNo,
        user_id: order.userId,
        product_type: order.productType,
        payable_amount: order.payableAmount.toString(),
        currency: order.currency,
        order_status: order.orderStatus,
        payment_status: order.paymentStatus,
        refund_status: order.refundStatus,
        risk_status: order.riskStatus,
        created_at: order.createdAt
      })),
      pagination: {
        page,
        page_size: pageSize,
        total,
        total_pages: Math.ceil(total / pageSize)
      }
    };
  }

  async cancel(orderId: string, dto: CancelOrderDto) {
    const order = await this.ordersRepository.findById(orderId);

    if (!order) {
      throw new Error(OrderErrors.ORDER_NOT_FOUND);
    }

    if (!canTransitOrderStatus(order.orderStatus, OrderStatus.CANCELLED)) {
      throw new Error(OrderErrors.ORDER_CANNOT_BE_CANCELLED);
    }

    const updated = await this.ordersRepository.updateStatus({
      orderId,
      fromStatus: order.orderStatus,
      toStatus: OrderStatus.CANCELLED,
      reason: dto.reason,
      operatorId: dto.operator_id,
      eventSource: dto.operator_id ? 'admin' : 'user'
    });

    return {
      order_id: updated.id,
      from_status: order.orderStatus,
      to_status: updated.orderStatus
    };
  }

  async markPaid(orderId: string, dto: MarkOrderPaidDto) {
    const order = await this.ordersRepository.findById(orderId);

    if (!order) {
      throw new Error(OrderErrors.ORDER_NOT_FOUND);
    }

    if (!canTransitOrderStatus(order.orderStatus, OrderStatus.PAID)) {
      throw new Error(OrderErrors.ORDER_CANNOT_BE_PAID);
    }

    if (new Decimal(dto.paid_amount).lt(order.payableAmount.toString())) {
      throw new Error(OrderErrors.ORDER_AMOUNT_INVALID);
    }

    const updated = await this.ordersRepository.markPaid({
      orderId,
      fromStatus: order.orderStatus,
      paymentStatus: PaymentStatus.SUCCESS,
      reason: 'payment succeeded',
      operatorId: dto.operator_id
    });

    return {
      order_id: updated.id,
      order_no: updated.orderNo,
      order_status: updated.orderStatus,
      payment_status: updated.paymentStatus,
      paid_amount: dto.paid_amount,
      currency: dto.currency
    };
  }

  async riskHold(orderId: string, dto: RiskHoldOrderDto) {
    const order = await this.ordersRepository.findById(orderId);

    if (!order) {
      throw new Error(OrderErrors.ORDER_NOT_FOUND);
    }

    if (!canTransitOrderStatus(order.orderStatus, OrderStatus.RISK_HOLD)) {
      throw new Error(OrderErrors.ORDER_STATUS_INVALID);
    }

    const updated = await this.ordersRepository.updateStatus({
      orderId,
      fromStatus: order.orderStatus,
      toStatus: OrderStatus.RISK_HOLD,
      riskStatus: 'risk_hold',
      reason: dto.reason,
      operatorId: dto.operator_id,
      eventSource: 'risk'
    });

    return {
      order_id: updated.id,
      from_status: order.orderStatus,
      to_status: updated.orderStatus,
      risk_status: updated.riskStatus
    };
  }

  private generateOrderNo() {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    return `ORD${date}${ulid()}`;
  }

  private async getProductSnapshot(productId: string) {
    // 第一版用内部 HTTP / RPC 前先占位。
    // 后续应改为调用 Product Service：GET /api/v1/products/:product_id
    if (!productId) {
      throw new Error(OrderErrors.ORDER_PRODUCT_REQUIRED);
    }

    return {
      product_id: productId,
      product_type: 'wine_369',
      product_name: '福建老酒 369 标准权益包',
      price: '369.000000000000000000',
      currency: 'USD',
      status: 'active',
      benefits: [
        {
          benefit_type: 'physical_wine',
          benefit_name: '福建老酒实物权益',
          benefit_value: '1'
        },
        {
          benefit_type: 'winepass_nft',
          benefit_name: 'WinePass NFT',
          benefit_value: '1'
        },
        {
          benefit_type: 'fj369_points_value',
          benefit_name: 'FJ369 Points 权益值',
          benefit_value: '369000'
        },
        {
          benefit_type: 'cfj369_points',
          benefit_name: 'cFJ369 贡献积分',
          benefit_value: '3690'
        }
      ]
    };
  }
}
```



---



# 15\. Orders User Controller



`apps/order-service/src/modules/orders/orders.controller.ts`



```TypeScript
import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { QueryOrdersDto } from './dto/query-orders.dto';
import { CancelOrderDto } from './dto/cancel-order.dto';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  create(@Body() dto: CreateOrderDto) {
    return this.ordersService.create(dto);
  }

  @Get()
  list(@Query() query: QueryOrdersDto) {
    return this.ordersService.list(query);
  }

  @Get(':order_id')
  detail(@Param('order_id') orderId: string) {
    return this.ordersService.detail(orderId);
  }

  @Post(':order_id/cancel')
  cancel(
    @Param('order_id') orderId: string,
    @Body() dto: CancelOrderDto
  ) {
    return this.ordersService.cancel(orderId, dto);
  }
}
```



---



# 16\. Orders Admin Controller



`apps/order-service/src/modules/orders/orders.admin.controller.ts`



```TypeScript
import { Body, Controller, Param, Post } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { MarkOrderPaidDto } from './dto/mark-order-paid.dto';
import { RiskHoldOrderDto } from './dto/risk-hold-order.dto';

@Controller('admin/orders')
export class OrdersAdminController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post(':order_id/mark-paid')
  markPaid(
    @Param('order_id') orderId: string,
    @Body() dto: MarkOrderPaidDto
  ) {
    return this.ordersService.markPaid(orderId, dto);
  }

  @Post(':order_id/risk-hold')
  riskHold(
    @Param('order_id') orderId: string,
    @Body() dto: RiskHoldOrderDto
  ) {
    return this.ordersService.riskHold(orderId, dto);
  }
}
```



---



# 17\. Orders Module



`apps/order-service/src/modules/orders/orders.module.ts`



```TypeScript
import { Module } from '@nestjs/common';
import { OrdersController } from './orders.controller';
import { OrdersAdminController } from './orders.admin.controller';
import { OrdersService } from './orders.service';
import { OrdersRepository } from './orders.repository';

@Module({
  controllers: [OrdersController, OrdersAdminController],
  providers: [OrdersService, OrdersRepository],
  exports: [OrdersService]
})
export class OrdersModule {}
```



---



# 18\. Order App Module



`apps/order-service/src/app.module.ts`



```TypeScript
import { Module } from '@nestjs/common';
import { HealthModule } from './health/health.module';
import { OrdersModule } from './modules/orders/orders.module';

@Module({
  imports: [
    HealthModule,
    OrdersModule
  ]
})
export class AppModule {}
```



---



# 19\. Order Service 当前 API



## 用户端



```HTTP
POST /api/v1/orders
GET /api/v1/orders
GET /api/v1/orders/:order_id
POST /api/v1/orders/:order_id/cancel
```



## 后台端



```HTTP
POST /api/v1/admin/orders/:order_id/mark-paid
POST /api/v1/admin/orders/:order_id/risk-hold
```



---



# 20\. Order Service 已具备能力



这一版完成后，Order Service 支持：



```Plain Text
创建订单
生成订单编号
生成订单明细
保存商品权益快照
订单列表
订单详情
订单取消
订单支付成功标记
订单风控冻结
订单状态机校验
订单状态日志
OrderCreated outbox 事件
OrderPaid outbox 事件
```



---



# 21\. 还需要补强的工业级能力



下一步基础库完善后补：



```Plain Text
统一 AppException
PrismaModule 注入
Idempotency-Key 幂等创建订单
真实调用 Product Service
真实调用 Identity / KYC Service 校验用户状态
真实调用 Risk Service 预检查
库存锁定与释放
team_chain / node_chain 快照
订单确认后生成履约任务
支付回调由 Payment Service 驱动
Outbox 发布器
Audit Log
Admin 权限 Guard
```



---



# 22\. 下一步继续



按 23 个 Service 顺序，下一步写：



```Plain Text
5. Payment Service 支付服务
```



Payment Service 第一版会包含：



```Plain Text
创建支付单
查询支付单
模拟支付成功
支付回调
tx_hash 唯一校验
支付金额校验
支付状态机
支付成功后通知 Order Service
退款申请
退款审核预留
PaymentSucceeded outbox 事件
```



需要补充数据库：



```Plain Text
payments
payment_callbacks
refunds
refund_adjustments
```



