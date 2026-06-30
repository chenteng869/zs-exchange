# H037\-21 个 Service：Notification Service 通知服务

# 第 21 个 Service：Notification Service 通知服务



本服务负责：



```Plain Text
站内信
邮件
短信
Webhook
通知模板
通知任务
通知投递记录
失败重试
用户通知偏好
NotificationCreated / Delivered / Failed 事件预留
```



---



# 1\. Notification Service 目录结构



```Plain Text
apps/notification-service/
├── src/
│   ├── app.module.ts
│   ├── main.ts
│   ├── health/
│   ├── shared/
│   │   ├── notification-errors.ts
│   │   ├── notification-events.ts
│   │   ├── notification-status.ts
│   │   └── notification-types.ts
│   └── modules/
│       ├── templates/
│       │   ├── templates.module.ts
│       │   ├── templates.controller.ts
│       │   ├── templates.admin.controller.ts
│       │   ├── templates.repository.ts
│       │   ├── templates.service.ts
│       │   └── dto/
│       │       ├── create-template.dto.ts
│       │       └── query-templates.dto.ts
│       ├── notifications/
│       │   ├── notifications.module.ts
│       │   ├── notifications.controller.ts
│       │   ├── notifications.admin.controller.ts
│       │   ├── notifications.repository.ts
│       │   ├── notifications.service.ts
│       │   └── dto/
│       │       ├── create-notification.dto.ts
│       │       ├── retry-notification.dto.ts
│       │       └── query-notifications.dto.ts
│       └── preferences/
│           ├── preferences.module.ts
│           ├── preferences.controller.ts
│           ├── preferences.repository.ts
│           ├── preferences.service.ts
│           └── dto/
│               └── update-preference.dto.ts
```



---



# 2\. Prisma 补充表



## 2\.1 NotificationTemplate



```Plain Text
model NotificationTemplate {
  id             String   @id
  templateCode   String   @map("template_code")
  templateVersion String  @map("template_version")
  channel        String
  locale         String   @default("en-US")
  titleTemplate  String?  @map("title_template")
  bodyTemplate   String   @map("body_template")
  status         String   @default("active")
  createdAt      DateTime @default(now()) @map("created_at")
  updatedAt      DateTime @updatedAt @map("updated_at")
  metadata       Json?

  @@unique([templateCode, templateVersion, channel, locale])
  @@index([templateCode])
  @@index([channel])
  @@map("notification_templates")
}
```



## 2\.2 NotificationTask



```Plain Text
model NotificationTask {
  id              String    @id
  taskNo          String    @unique @map("task_no")
  userId          String?   @map("user_id")
  recipient       String
  channel         String
  templateCode    String?   @map("template_code")
  templateVersion String?   @map("template_version")
  locale          String    @default("en-US")
  title           String?
  body            String
  payload         Json?
  notificationType String   @map("notification_type")
  priority        Int       @default(100)
  taskStatus      String    @default("pending") @map("task_status")
  retryCount      Int       @default(0) @map("retry_count")
  maxRetries      Int       @default(3) @map("max_retries")
  nextRetryAt     DateTime? @map("next_retry_at")
  sentAt          DateTime? @map("sent_at")
  failedAt        DateTime? @map("failed_at")
  createdAt       DateTime  @default(now()) @map("created_at")
  updatedAt       DateTime  @updatedAt @map("updated_at")
  metadata        Json?

  deliveries      NotificationDelivery[]

  @@index([userId])
  @@index([channel])
  @@index([taskStatus])
  @@map("notification_tasks")
}
```



## 2\.3 NotificationDelivery



```Plain Text
model NotificationDelivery {
  id              String    @id
  deliveryNo      String    @unique @map("delivery_no")
  taskId          String    @map("task_id")
  channel         String
  provider        String?
  providerMessageId String? @map("provider_message_id")
  deliveryStatus  String    @default("created") @map("delivery_status")
  responseCode    String?   @map("response_code")
  responseBody    Json?     @map("response_body")
  attemptedAt     DateTime  @default(now()) @map("attempted_at")
  deliveredAt     DateTime? @map("delivered_at")
  failedAt        DateTime? @map("failed_at")
  errorMessage    String?   @map("error_message")

  task            NotificationTask @relation(fields: [taskId], references: [id])

  @@index([taskId])
  @@index([deliveryStatus])
  @@map("notification_deliveries")
}
```



## 2\.4 NotificationPreference



```Plain Text
model NotificationPreference {
  id               String   @id
  userId           String   @map("user_id")
  notificationType String   @map("notification_type")
  channel          String
  enabled          Boolean  @default(true)
  quietHoursJson   Json?    @map("quiet_hours_json")
  createdAt        DateTime @default(now()) @map("created_at")
  updatedAt        DateTime @updatedAt @map("updated_at")

  @@unique([userId, notificationType, channel])
  @@index([userId])
  @@map("notification_preferences")
}
```



---



# 3\. Shared 常量



`apps/notification-service/src/shared/notification-events.ts`



```TypeScript
export const NotificationEvents = {
  NOTIFICATION_CREATED: 'notification.created.v1',
  NOTIFICATION_SENT: 'notification.sent.v1',
  NOTIFICATION_DELIVERED: 'notification.delivered.v1',
  NOTIFICATION_FAILED: 'notification.failed.v1',
  TEMPLATE_CREATED: 'notification.template_created.v1',
  PREFERENCE_UPDATED: 'notification.preference_updated.v1'
} as const;
```



`apps/notification-service/src/shared/notification-errors.ts`



```TypeScript
export const NotificationErrors = {
  TEMPLATE_NOT_FOUND: 'NOTIFICATION_TEMPLATE_NOT_FOUND',
  TEMPLATE_ALREADY_EXISTS: 'NOTIFICATION_TEMPLATE_ALREADY_EXISTS',
  TEMPLATE_NOT_ACTIVE: 'NOTIFICATION_TEMPLATE_NOT_ACTIVE',
  TASK_NOT_FOUND: 'NOTIFICATION_TASK_NOT_FOUND',
  TASK_STATUS_INVALID: 'NOTIFICATION_TASK_STATUS_INVALID',
  TASK_DELIVERY_FAILED: 'NOTIFICATION_TASK_DELIVERY_FAILED',
  PREFERENCE_NOT_FOUND: 'NOTIFICATION_PREFERENCE_NOT_FOUND'
} as const;
```



`apps/notification-service/src/shared/notification-status.ts`



```TypeScript
export const NotificationTaskStatus = {
  PENDING: 'pending',
  SENDING: 'sending',
  SENT: 'sent',
  DELIVERED: 'delivered',
  FAILED: 'failed',
  CANCELLED: 'cancelled'
} as const;

export const NotificationDeliveryStatus = {
  CREATED: 'created',
  SENT: 'sent',
  DELIVERED: 'delivered',
  FAILED: 'failed'
} as const;

export const NotificationTemplateStatus = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  ARCHIVED: 'archived'
} as const;
```



`apps/notification-service/src/shared/notification-types.ts`



```TypeScript
export const NotificationChannels = {
  IN_APP: 'in_app',
  EMAIL: 'email',
  SMS: 'sms',
  WEBHOOK: 'webhook'
} as const;

export const NotificationTypes = {
  ORDER_CREATED: 'order_created',
  ORDER_PAID: 'order_paid',
  KYC_APPROVED: 'kyc_approved',
  KYC_REJECTED: 'kyc_rejected',
  REWARD_APPROVED: 'reward_approved',
  RELEASE_CLAIMABLE: 'release_claimable',
  RISK_ALERT: 'risk_alert',
  APPROVAL_PENDING: 'approval_pending',
  SYSTEM: 'system'
} as const;
```



---



# 4\. Templates DTO / Repository / Service



`apps/notification-service/src/modules/templates/dto/create-template.dto.ts`



```TypeScript
import { IsOptional, IsString } from 'class-validator';

export class CreateTemplateDto {
  @IsString()
  template_code!: string;

  @IsString()
  template_version!: string;

  @IsString()
  channel!: string;

  @IsOptional()
  @IsString()
  locale?: string;

  @IsOptional()
  @IsString()
  title_template?: string;

  @IsString()
  body_template!: string;
}
```



`apps/notification-service/src/modules/templates/dto/query-templates.dto.ts`



```TypeScript
import { IsOptional, IsString } from 'class-validator';

export class QueryTemplatesDto {
  @IsOptional()
  @IsString()
  template_code?: string;

  @IsOptional()
  @IsString()
  channel?: string;

  @IsOptional()
  @IsString()
  locale?: string;

  @IsOptional()
  @IsString()
  status?: string;
}
```



`apps/notification-service/src/modules/templates/templates.repository.ts`



```TypeScript
import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { ulid } from 'ulid';

const prisma = new PrismaClient();

@Injectable()
export class TemplatesRepository {
  findByIdentity(params: {
    templateCode: string;
    templateVersion: string;
    channel: string;
    locale: string;
  }) {
    return prisma.notificationTemplate.findUnique({
      where: {
        templateCode_templateVersion_channel_locale: {
          templateCode: params.templateCode,
          templateVersion: params.templateVersion,
          channel: params.channel,
          locale: params.locale
        }
      }
    });
  }

  findActive(params: {
    templateCode: string;
    templateVersion?: string;
    channel: string;
    locale: string;
  }) {
    return prisma.notificationTemplate.findFirst({
      where: {
        templateCode: params.templateCode,
        templateVersion: params.templateVersion,
        channel: params.channel,
        locale: params.locale,
        status: 'active'
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  findMany(params: {
    templateCode?: string;
    channel?: string;
    locale?: string;
    status?: string;
  }) {
    return prisma.notificationTemplate.findMany({
      where: {
        templateCode: params.templateCode,
        channel: params.channel,
        locale: params.locale,
        status: params.status
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  create(data: {
    templateCode: string;
    templateVersion: string;
    channel: string;
    locale: string;
    titleTemplate?: string;
    bodyTemplate: string;
  }) {
    return prisma.$transaction(async (tx) => {
      const template = await tx.notificationTemplate.create({
        data: {
          id: ulid(),
          templateCode: data.templateCode,
          templateVersion: data.templateVersion,
          channel: data.channel,
          locale: data.locale,
          titleTemplate: data.titleTemplate,
          bodyTemplate: data.bodyTemplate,
          status: 'active'
        }
      });

      await tx.outboxEvent.create({
        data: {
          id: ulid(),
          eventType: 'notification.template_created.v1',
          payload: {
            template_id: template.id,
            template_code: template.templateCode,
            template_version: template.templateVersion,
            channel: template.channel,
            locale: template.locale
          },
          status: 'pending',
          retryCount: 0
        }
      });

      return template;
    });
  }
}
```



`apps/notification-service/src/modules/templates/templates.service.ts`



```TypeScript
import { Injectable } from '@nestjs/common';
import { TemplatesRepository } from './templates.repository';
import { CreateTemplateDto } from './dto/create-template.dto';
import { QueryTemplatesDto } from './dto/query-templates.dto';
import { NotificationErrors } from '../../shared/notification-errors';

@Injectable()
export class TemplatesService {
  constructor(private readonly templatesRepository: TemplatesRepository) {}

  async create(dto: CreateTemplateDto) {
    const locale = dto.locale || 'en-US';

    const existing = await this.templatesRepository.findByIdentity({
      templateCode: dto.template_code,
      templateVersion: dto.template_version,
      channel: dto.channel,
      locale
    });

    if (existing) {
      throw new Error(NotificationErrors.TEMPLATE_ALREADY_EXISTS);
    }

    const template = await this.templatesRepository.create({
      templateCode: dto.template_code,
      templateVersion: dto.template_version,
      channel: dto.channel,
      locale,
      titleTemplate: dto.title_template,
      bodyTemplate: dto.body_template
    });

    return this.formatTemplate(template);
  }

  async list(query: QueryTemplatesDto) {
    const items = await this.templatesRepository.findMany({
      templateCode: query.template_code,
      channel: query.channel,
      locale: query.locale,
      status: query.status
    });

    return {
      items: items.map((item) => this.formatTemplate(item))
    };
  }

  private formatTemplate(template: any) {
    return {
      template_id: template.id,
      template_code: template.templateCode,
      template_version: template.templateVersion,
      channel: template.channel,
      locale: template.locale,
      title_template: template.titleTemplate,
      body_template: template.bodyTemplate,
      status: template.status
    };
  }
}
```



---



# 5\. Templates Controllers / Module



`apps/notification-service/src/modules/templates/templates.controller.ts`



```TypeScript
import { Controller, Get, Query } from '@nestjs/common';
import { TemplatesService } from './templates.service';
import { QueryTemplatesDto } from './dto/query-templates.dto';

@Controller('notifications/templates')
export class TemplatesController {
  constructor(private readonly templatesService: TemplatesService) {}

  @Get()
  list(@Query() query: QueryTemplatesDto) {
    return this.templatesService.list(query);
  }
}
```



`apps/notification-service/src/modules/templates/templates.admin.controller.ts`



```TypeScript
import { Body, Controller, Post } from '@nestjs/common';
import { TemplatesService } from './templates.service';
import { CreateTemplateDto } from './dto/create-template.dto';

@Controller('admin/notifications/templates')
export class TemplatesAdminController {
  constructor(private readonly templatesService: TemplatesService) {}

  @Post()
  create(@Body() dto: CreateTemplateDto) {
    return this.templatesService.create(dto);
  }
}
```



`apps/notification-service/src/modules/templates/templates.module.ts`



```TypeScript
import { Module } from '@nestjs/common';
import { TemplatesController } from './templates.controller';
import { TemplatesAdminController } from './templates.admin.controller';
import { TemplatesService } from './templates.service';
import { TemplatesRepository } from './templates.repository';

@Module({
  controllers: [TemplatesController, TemplatesAdminController],
  providers: [TemplatesService, TemplatesRepository],
  exports: [TemplatesService, TemplatesRepository]
})
export class TemplatesModule {}
```



---



# 6\. Notifications DTO



`apps/notification-service/src/modules/notifications/dto/create-notification.dto.ts`



```TypeScript
import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreateNotificationDto {
  @IsOptional()
  @IsString()
  user_id?: string;

  @IsString()
  recipient!: string;

  @IsString()
  channel!: string;

  @IsString()
  notification_type!: string;

  @IsOptional()
  @IsString()
  template_code?: string;

  @IsOptional()
  @IsString()
  template_version?: string;

  @IsOptional()
  @IsString()
  locale?: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  body?: string;

  @IsOptional()
  payload?: Record;

  @IsOptional()
  @IsInt()
  @Min(0)
  priority?: number;
}
```



`apps/notification-service/src/modules/notifications/dto/retry-notification.dto.ts`



```TypeScript
import { IsOptional, IsString } from 'class-validator';

export class RetryNotificationDto {
  @IsOptional()
  @IsString()
  reason?: string;
}
```



`apps/notification-service/src/modules/notifications/dto/query-notifications.dto.ts`



```TypeScript
import { IsOptional, IsString } from 'class-validator';

export class QueryNotificationsDto {
  @IsOptional()
  @IsString()
  user_id?: string;

  @IsOptional()
  @IsString()
  channel?: string;

  @IsOptional()
  @IsString()
  notification_type?: string;

  @IsOptional()
  @IsString()
  task_status?: string;

  @IsOptional()
  page?: number;

  @IsOptional()
  page_size?: number;
}
```



---



# 7\. Notifications Repository



`apps/notification-service/src/modules/notifications/notifications.repository.ts`



```TypeScript
import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { ulid } from 'ulid';

const prisma = new PrismaClient();

@Injectable()
export class NotificationsRepository {
  findTemplate(params: {
    templateCode: string;
    templateVersion?: string;
    channel: string;
    locale: string;
  }) {
    return prisma.notificationTemplate.findFirst({
      where: {
        templateCode: params.templateCode,
        templateVersion: params.templateVersion,
        channel: params.channel,
        locale: params.locale,
        status: 'active'
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  findPreference(params: {
    userId: string;
    notificationType: string;
    channel: string;
  }) {
    return prisma.notificationPreference.findUnique({
      where: {
        userId_notificationType_channel: {
          userId: params.userId,
          notificationType: params.notificationType,
          channel: params.channel
        }
      }
    });
  }

  findById(taskId: string) {
    return prisma.notificationTask.findUnique({
      where: { id: taskId },
      include: { deliveries: true }
    });
  }

  create(data: {
    taskNo: string;
    userId?: string;
    recipient: string;
    channel: string;
    templateCode?: string;
    templateVersion?: string;
    locale: string;
    title?: string;
    body: string;
    payload?: Record;
    notificationType: string;
    priority: number;
  }) {
    return prisma.$transaction(async (tx) => {
      const task = await tx.notificationTask.create({
        data: {
          id: ulid(),
          taskNo: data.taskNo,
          userId: data.userId,
          recipient: data.recipient,
          channel: data.channel,
          templateCode: data.templateCode,
          templateVersion: data.templateVersion,
          locale: data.locale,
          title: data.title,
          body: data.body,
          payload: data.payload,
          notificationType: data.notificationType,
          priority: data.priority,
          taskStatus: 'pending'
        }
      });

      await tx.outboxEvent.create({
        data: {
          id: ulid(),
          eventType: 'notification.created.v1',
          payload: {
            task_id: task.id,
            task_no: task.taskNo,
            user_id: task.userId,
            recipient: task.recipient,
            channel: task.channel,
            notification_type: task.notificationType
          },
          status: 'pending',
          retryCount: 0
        }
      });

      return task;
    });
  }

  createDelivery(data: {
    deliveryNo: string;
    taskId: string;
    channel: string;
    provider?: string;
    providerMessageId?: string;
    deliveryStatus: string;
    responseCode?: string;
    responseBody?: Record;
    errorMessage?: string;
  }) {
    return prisma.notificationDelivery.create({
      data: {
        id: ulid(),
        deliveryNo: data.deliveryNo,
        taskId: data.taskId,
        channel: data.channel,
        provider: data.provider,
        providerMessageId: data.providerMessageId,
        deliveryStatus: data.deliveryStatus,
        responseCode: data.responseCode,
        responseBody: data.responseBody,
        errorMessage: data.errorMessage,
        deliveredAt: data.deliveryStatus === 'delivered' ? new Date() : undefined,
        failedAt: data.deliveryStatus === 'failed' ? new Date() : undefined
      }
    });
  }

  updateTaskStatus(params: {
    taskId: string;
    taskStatus: string;
    retryCount?: number;
    nextRetryAt?: Date;
  }) {
    return prisma.notificationTask.update({
      where: { id: params.taskId },
      data: {
        taskStatus: params.taskStatus,
        retryCount: params.retryCount,
        nextRetryAt: params.nextRetryAt,
        sentAt: params.taskStatus === 'sent' || params.taskStatus === 'delivered' ? new Date() : undefined,
        failedAt: params.taskStatus === 'failed' ? new Date() : undefined
      },
      include: { deliveries: true }
    });
  }

  findMany(params: {
    userId?: string;
    channel?: string;
    notificationType?: string;
    taskStatus?: string;
    page: number;
    pageSize: number;
  }) {
    return prisma.notificationTask.findMany({
      where: {
        userId: params.userId,
        channel: params.channel,
        notificationType: params.notificationType,
        taskStatus: params.taskStatus
      },
      include: { deliveries: true },
      orderBy: { createdAt: 'desc' },
      skip: (params.page - 1) * params.pageSize,
      take: params.pageSize
    });
  }

  count(params: {
    userId?: string;
    channel?: string;
    notificationType?: string;
    taskStatus?: string;
  }) {
    return prisma.notificationTask.count({
      where: {
        userId: params.userId,
        channel: params.channel,
        notificationType: params.notificationType,
        taskStatus: params.taskStatus
      }
    });
  }
}
```



---



# 8\. Notifications Service



`apps/notification-service/src/modules/notifications/notifications.service.ts`



```TypeScript
import { Injectable } from '@nestjs/common';
import { ulid } from 'ulid';
import { NotificationsRepository } from './notifications.repository';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { RetryNotificationDto } from './dto/retry-notification.dto';
import { QueryNotificationsDto } from './dto/query-notifications.dto';
import { NotificationErrors } from '../../shared/notification-errors';
import {
  NotificationDeliveryStatus,
  NotificationTaskStatus
} from '../../shared/notification-status';

@Injectable()
export class NotificationsService {
  constructor(private readonly notificationsRepository: NotificationsRepository) {}

  async create(dto: CreateNotificationDto) {
    if (dto.user_id) {
      const pref = await this.notificationsRepository.findPreference({
        userId: dto.user_id,
        notificationType: dto.notification_type,
        channel: dto.channel
      });

      if (pref && !pref.enabled) {
        throw new Error(NotificationErrors.TASK_STATUS_INVALID);
      }
    }

    const locale = dto.locale || 'en-US';

    let title = dto.title;
    let body = dto.body;

    if (dto.template_code) {
      const template = await this.notificationsRepository.findTemplate({
        templateCode: dto.template_code,
        templateVersion: dto.template_version,
        channel: dto.channel,
        locale
      });

      if (!template) {
        throw new Error(NotificationErrors.TEMPLATE_NOT_FOUND);
      }

      title = this.render(template.titleTemplate, dto.payload || {});
      body = this.render(template.bodyTemplate, dto.payload || {});
    }

    if (!body) {
      throw new Error(NotificationErrors.TEMPLATE_NOT_FOUND);
    }

    const task = await this.notificationsRepository.create({
      taskNo: this.generateTaskNo(),
      userId: dto.user_id,
      recipient: dto.recipient,
      channel: dto.channel,
      templateCode: dto.template_code,
      templateVersion: dto.template_version,
      locale,
      title,
      body,
      payload: dto.payload,
      notificationType: dto.notification_type,
      priority: dto.priority ?? 100
    });

    return this.formatTask(task);
  }

  async send(taskId: string) {
    const task = await this.notificationsRepository.findById(taskId);
    if (!task) throw new Error(NotificationErrors.TASK_NOT_FOUND);

    if (![NotificationTaskStatus.PENDING, NotificationTaskStatus.FAILED].includes(task.taskStatus as any)) {
      throw new Error(NotificationErrors.TASK_STATUS_INVALID);
    }

    const delivery = await this.notificationsRepository.createDelivery({
      deliveryNo: this.generateDeliveryNo(),
      taskId: task.id,
      channel: task.channel,
      provider: this.resolveProvider(task.channel),
      providerMessageId: `mock_${ulid()}`,
      deliveryStatus: NotificationDeliveryStatus.DELIVERED,
      responseCode: '200',
      responseBody: {
        mock: true
      }
    });

    const updated = await this.notificationsRepository.updateTaskStatus({
      taskId: task.id,
      taskStatus: NotificationTaskStatus.DELIVERED
    });

    return {
      ...this.formatTask(updated),
      last_delivery: {
        delivery_id: delivery.id,
        delivery_no: delivery.deliveryNo,
        delivery_status: delivery.deliveryStatus
      }
    };
  }

  async retry(taskId: string, dto: RetryNotificationDto) {
    const task = await this.notificationsRepository.findById(taskId);
    if (!task) throw new Error(NotificationErrors.TASK_NOT_FOUND);

    if (task.retryCount >= task.maxRetries) {
      throw new Error(NotificationErrors.TASK_DELIVERY_FAILED);
    }

    await this.notificationsRepository.updateTaskStatus({
      taskId,
      taskStatus: NotificationTaskStatus.PENDING,
      retryCount: task.retryCount + 1,
      nextRetryAt: undefined
    });

    return this.send(taskId);
  }

  async detail(taskId: string) {
    const task = await this.notificationsRepository.findById(taskId);
    if (!task) throw new Error(NotificationErrors.TASK_NOT_FOUND);
    return this.formatTask(task);
  }

  async list(query: QueryNotificationsDto) {
    const page = Number(query.page || 1);
    const pageSize = Math.min(Number(query.page_size || 20), 100);

    const [items, total] = await Promise.all([
      this.notificationsRepository.findMany({
        userId: query.user_id,
        channel: query.channel,
        notificationType: query.notification_type,
        taskStatus: query.task_status,
        page,
        pageSize
      }),
      this.notificationsRepository.count({
        userId: query.user_id,
        channel: query.channel,
        notificationType: query.notification_type,
        taskStatus: query.task_status
      })
    ]);

    return {
      items: items.map((item) => this.formatTask(item)),
      pagination: {
        page,
        page_size: pageSize,
        total,
        total_pages: Math.ceil(total / pageSize)
      }
    };
  }

  private render(template: string | null | undefined, payload: Record) {
    if (!template) return undefined;

    return template.replace(/\{\{([a-zA-Z0-9_.]+)\}\}/g, (_match, key) => {
      const value = key.split('.').reduce((current: any, part: string) => {
        if (current && typeof current === 'object') return current[part];
        return undefined;
      }, payload);

      return value === undefined || value === null ? '' : String(value);
    });
  }

  private resolveProvider(channel: string) {
    if (channel === 'email') return 'mock_email';
    if (channel === 'sms') return 'mock_sms';
    if (channel === 'webhook') return 'mock_webhook';
    return 'in_app';
  }

  private formatTask(task: any) {
    return {
      task_id: task.id,
      task_no: task.taskNo,
      user_id: task.userId,
      recipient: task.recipient,
      channel: task.channel,
      template_code: task.templateCode,
      template_version: task.templateVersion,
      locale: task.locale,
      title: task.title,
      body: task.body,
      payload: task.payload,
      notification_type: task.notificationType,
      priority: task.priority,
      task_status: task.taskStatus,
      retry_count: task.retryCount,
      max_retries: task.maxRetries,
      next_retry_at: task.nextRetryAt,
      sent_at: task.sentAt,
      failed_at: task.failedAt,
      deliveries: task.deliveries?.map((delivery: any) => ({
        delivery_id: delivery.id,
        delivery_no: delivery.deliveryNo,
        provider: delivery.provider,
        provider_message_id: delivery.providerMessageId,
        delivery_status: delivery.deliveryStatus,
        attempted_at: delivery.attemptedAt,
        delivered_at: delivery.deliveredAt,
        failed_at: delivery.failedAt,
        error_message: delivery.errorMessage
      })) || []
    };
  }

  private generateTaskNo() {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    return `NTF${date}${ulid()}`;
  }

  private generateDeliveryNo() {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    return `NDL${date}${ulid()}`;
  }
}
```



---



# 9\. Notifications Controllers / Module



`apps/notification-service/src/modules/notifications/notifications.controller.ts`



```TypeScript
import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { QueryNotificationsDto } from './dto/query-notifications.dto';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post()
  create(@Body() dto: CreateNotificationDto) {
    return this.notificationsService.create(dto);
  }

  @Get()
  list(@Query() query: QueryNotificationsDto) {
    return this.notificationsService.list(query);
  }

  @Get(':task_id')
  detail(@Param('task_id') taskId: string) {
    return this.notificationsService.detail(taskId);
  }
}
```



`apps/notification-service/src/modules/notifications/notifications.admin.controller.ts`



```TypeScript
import { Body, Controller, Param, Post } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { RetryNotificationDto } from './dto/retry-notification.dto';

@Controller('admin/notifications')
export class NotificationsAdminController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post(':task_id/send')
  send(@Param('task_id') taskId: string) {
    return this.notificationsService.send(taskId);
  }

  @Post(':task_id/retry')
  retry(@Param('task_id') taskId: string, @Body() dto: RetryNotificationDto) {
    return this.notificationsService.retry(taskId, dto);
  }
}
```



`apps/notification-service/src/modules/notifications/notifications.module.ts`



```TypeScript
import { Module } from '@nestjs/common';
import { NotificationsController } from './notifications.controller';
import { NotificationsAdminController } from './notifications.admin.controller';
import { NotificationsService } from './notifications.service';
import { NotificationsRepository } from './notifications.repository';

@Module({
  controllers: [NotificationsController, NotificationsAdminController],
  providers: [NotificationsService, NotificationsRepository],
  exports: [NotificationsService]
})
export class NotificationsModule {}
```



---



# 10\. Preferences DTO / Repository / Service



`apps/notification-service/src/modules/preferences/dto/update-preference.dto.ts`



```TypeScript
import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class UpdatePreferenceDto {
  @IsString()
  user_id!: string;

  @IsString()
  notification_type!: string;

  @IsString()
  channel!: string;

  @IsBoolean()
  enabled!: boolean;

  @IsOptional()
  quiet_hours_json?: Record;
}
```



`apps/notification-service/src/modules/preferences/preferences.repository.ts`



```TypeScript
import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { ulid } from 'ulid';

const prisma = new PrismaClient();

@Injectable()
export class PreferencesRepository {
  upsert(data: {
    userId: string;
    notificationType: string;
    channel: string;
    enabled: boolean;
    quietHoursJson?: Record;
  }) {
    return prisma.$transaction(async (tx) => {
      const preference = await tx.notificationPreference.upsert({
        where: {
          userId_notificationType_channel: {
            userId: data.userId,
            notificationType: data.notificationType,
            channel: data.channel
          }
        },
        create: {
          id: ulid(),
          userId: data.userId,
          notificationType: data.notificationType,
          channel: data.channel,
          enabled: data.enabled,
          quietHoursJson: data.quietHoursJson
        },
        update: {
          enabled: data.enabled,
          quietHoursJson: data.quietHoursJson
        }
      });

      await tx.outboxEvent.create({
        data: {
          id: ulid(),
          eventType: 'notification.preference_updated.v1',
          payload: {
            preference_id: preference.id,
            user_id: preference.userId,
            notification_type: preference.notificationType,
            channel: preference.channel,
            enabled: preference.enabled
          },
          status: 'pending',
          retryCount: 0
        }
      });

      return preference;
    });
  }

  findByUserId(userId: string) {
    return prisma.notificationPreference.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' }
    });
  }
}
```



`apps/notification-service/src/modules/preferences/preferences.service.ts`



```TypeScript
import { Injectable } from '@nestjs/common';
import { PreferencesRepository } from './preferences.repository';
import { UpdatePreferenceDto } from './dto/update-preference.dto';

@Injectable()
export class PreferencesService {
  constructor(private readonly preferencesRepository: PreferencesRepository) {}

  async update(dto: UpdatePreferenceDto) {
    const preference = await this.preferencesRepository.upsert({
      userId: dto.user_id,
      notificationType: dto.notification_type,
      channel: dto.channel,
      enabled: dto.enabled,
      quietHoursJson: dto.quiet_hours_json
    });

    return this.formatPreference(preference);
  }

  async list(userId: string) {
    const items = await this.preferencesRepository.findByUserId(userId);

    return {
      items: items.map((item) => this.formatPreference(item))
    };
  }

  private formatPreference(preference: any) {
    return {
      preference_id: preference.id,
      user_id: preference.userId,
      notification_type: preference.notificationType,
      channel: preference.channel,
      enabled: preference.enabled,
      quiet_hours_json: preference.quietHoursJson,
      updated_at: preference.updatedAt
    };
  }
}
```



---



# 11\. Preferences Controller / Module



`apps/notification-service/src/modules/preferences/preferences.controller.ts`



```TypeScript
import { Body, Controller, Get, Param, Put } from '@nestjs/common';
import { PreferencesService } from './preferences.service';
import { UpdatePreferenceDto } from './dto/update-preference.dto';

@Controller('notifications/preferences')
export class PreferencesController {
  constructor(private readonly preferencesService: PreferencesService) {}

  @Put()
  update(@Body() dto: UpdatePreferenceDto) {
    return this.preferencesService.update(dto);
  }

  @Get('users/:user_id')
  list(@Param('user_id') userId: string) {
    return this.preferencesService.list(userId);
  }
}
```



`apps/notification-service/src/modules/preferences/preferences.module.ts`



```TypeScript
import { Module } from '@nestjs/common';
import { PreferencesController } from './preferences.controller';
import { PreferencesService } from './preferences.service';
import { PreferencesRepository } from './preferences.repository';

@Module({
  controllers: [PreferencesController],
  providers: [PreferencesService, PreferencesRepository],
  exports: [PreferencesService]
})
export class PreferencesModule {}
```



---



# 12\. Notification App Module



`apps/notification-service/src/app.module.ts`



```TypeScript
import { Module } from '@nestjs/common';
import { HealthModule } from './health/health.module';
import { TemplatesModule } from './modules/templates/templates.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { PreferencesModule } from './modules/preferences/preferences.module';

@Module({
  imports: [
    HealthModule,
    TemplatesModule,
    NotificationsModule,
    PreferencesModule
  ]
})
export class AppModule {}
```



---



# 13\. Notification Service 当前 API



## 业务端



```HTTP
GET /api/v1/notifications/templates

POST /api/v1/notifications
GET /api/v1/notifications
GET /api/v1/notifications/:task_id

PUT /api/v1/notifications/preferences
GET /api/v1/notifications/preferences/users/:user_id
```



## 后台端



```HTTP
POST /api/v1/admin/notifications/templates
POST /api/v1/admin/notifications/:task_id/send
POST /api/v1/admin/notifications/:task_id/retry
```



---



# 14\. Notification Service 已具备能力



这一版完成后，Notification Service 支持：



```Plain Text
通知模板创建 / 查询
模板变量渲染
通知任务创建
站内信 / 邮件 / 短信 / Webhook 通道抽象
Mock 投递
投递记录
失败重试
通知偏好设置
Notification outbox 事件
```



---



# 15\. 后续必须补强



```Plain Text
统一 AppException
PrismaModule 注入
真实 Email Provider
真实 SMS Provider
真实 Webhook 签名
站内信已读状态
批量通知
延迟发送
失败重试调度器
限流
用户退订
Audit Log
Admin 权限 Guard
```



---



# 16\. 下一步继续



按 23 个 Service 顺序，下一步写：



```Plain Text
22. Reporting Service 报表服务
```



下一步会覆盖：



```Plain Text
业务报表
财务报表
税务报表
用户增长
订单销售
奖励统计
节点统计
报表任务
报表导出
```# 第 21 个 Service：Notification Service 通知服务

本服务负责：

```text
站内信
邮件
短信
Webhook
通知模板
通知任务
通知投递记录
失败重试
用户通知偏好
NotificationCreated / Delivered / Failed 事件预留
```



---



# 1\. Notification Service 目录结构



```Plain Text
apps/notification-service/
├── src/
│   ├── app.module.ts
│   ├── main.ts
│   ├── health/
│   ├── shared/
│   │   ├── notification-errors.ts
│   │   ├── notification-events.ts
│   │   ├── notification-status.ts
│   │   └── notification-types.ts
│   └── modules/
│       ├── templates/
│       │   ├── templates.module.ts
│       │   ├── templates.controller.ts
│       │   ├── templates.admin.controller.ts
│       │   ├── templates.repository.ts
│       │   ├── templates.service.ts
│       │   └── dto/
│       │       ├── create-template.dto.ts
│       │       └── query-templates.dto.ts
│       ├── notifications/
│       │   ├── notifications.module.ts
│       │   ├── notifications.controller.ts
│       │   ├── notifications.admin.controller.ts
│       │   ├── notifications.repository.ts
│       │   ├── notifications.service.ts
│       │   └── dto/
│       │       ├── create-notification.dto.ts
│       │       ├── query-notifications.dto.ts
│       │       └── mark-notification-read.dto.ts
│       ├── deliveries/
│       │   ├── deliveries.module.ts
│       │   ├── deliveries.controller.ts
│       │   ├── deliveries.admin.controller.ts
│       │   ├── deliveries.repository.ts
│       │   ├── deliveries.service.ts
│       │   └── dto/
│       │       ├── retry-delivery.dto.ts
│       │       └── query-deliveries.dto.ts
│       └── preferences/
│           ├── preferences.module.ts
│           ├── preferences.controller.ts
│           ├── preferences.repository.ts
│           ├── preferences.service.ts
│           └── dto/
│               └── upsert-preference.dto.ts
```



---



# 2\. Prisma 补充表



## 2\.1 NotificationTemplate



```Plain Text
model NotificationTemplate {
  id              String   @id
  templateCode    String   @map("template_code")
  templateVersion String   @map("template_version")
  channel         String
  titleTemplate   String?  @map("title_template")
  bodyTemplate    String   @map("body_template")
  locale          String   @default("zh-CN")
  status          String   @default("active")
  createdAt       DateTime @default(now()) @map("created_at")
  updatedAt       DateTime @updatedAt @map("updated_at")
  metadata        Json?

  @@unique([templateCode, templateVersion, channel, locale])
  @@index([templateCode])
  @@index([channel])
  @@map("notification_templates")
}
```



## 2\.2 Notification



```Plain Text
model Notification {
  id              String    @id
  notificationNo  String    @unique @map("notification_no")
  userId          String?   @map("user_id")
  targetType      String    @map("target_type")
  targetAddress   String?   @map("target_address")
  channel         String
  templateCode    String?   @map("template_code")
  title           String?
  body            String
  priority        String    @default("normal")
  notificationStatus String @default("created") @map("notification_status")
  readAt          DateTime? @map("read_at")
  sourceType      String?   @map("source_type")
  sourceId        String?   @map("source_id")
  scheduledAt     DateTime? @map("scheduled_at")
  createdAt       DateTime  @default(now()) @map("created_at")
  updatedAt       DateTime  @updatedAt @map("updated_at")
  metadata        Json?

  deliveries      NotificationDelivery[]

  @@index([userId])
  @@index([channel])
  @@index([notificationStatus])
  @@index([sourceType, sourceId])
  @@map("notifications")
}
```



## 2\.3 NotificationDelivery



```Plain Text
model NotificationDelivery {
  id              String    @id
  deliveryNo      String    @unique @map("delivery_no")
  notificationId  String    @map("notification_id")
  channel         String
  provider        String?
  targetAddress   String?   @map("target_address")
  deliveryStatus  String    @default("pending") @map("delivery_status")
  retryCount      Int       @default(0) @map("retry_count")
  maxRetry        Int       @default(3) @map("max_retry")
  providerMessageId String? @map("provider_message_id")
  errorCode       String?   @map("error_code")
  errorMessage    String?   @map("error_message")
  deliveredAt     DateTime? @map("delivered_at")
  failedAt        DateTime? @map("failed_at")
  nextRetryAt     DateTime? @map("next_retry_at")
  createdAt       DateTime  @default(now()) @map("created_at")
  updatedAt       DateTime  @updatedAt @map("updated_at")
  metadata        Json?

  notification    Notification @relation(fields: [notificationId], references: [id])

  @@index([notificationId])
  @@index([deliveryStatus])
  @@index([channel])
  @@map("notification_deliveries")
}
```



## 2\.4 NotificationPreference



```Plain Text
model NotificationPreference {
  id              String   @id
  userId          String   @map("user_id")
  channel         String
  notificationType String  @map("notification_type")
  enabled         Boolean  @default(true)
  quietHoursStart String?  @map("quiet_hours_start")
  quietHoursEnd   String?  @map("quiet_hours_end")
  locale          String   @default("zh-CN")
  createdAt       DateTime @default(now()) @map("created_at")
  updatedAt       DateTime @updatedAt @map("updated_at")
  metadata        Json?

  @@unique([userId, channel, notificationType])
  @@index([userId])
  @@map("notification_preferences")
}
```



---



# 3\. Shared 常量



`apps/notification-service/src/shared/notification-events.ts`



```TypeScript
export const NotificationEvents = {
  TEMPLATE_CREATED: 'notification.template_created.v1',
  NOTIFICATION_CREATED: 'notification.created.v1',
  NOTIFICATION_READ: 'notification.read.v1',
  DELIVERY_CREATED: 'notification.delivery_created.v1',
  DELIVERY_SUCCEEDED: 'notification.delivery_succeeded.v1',
  DELIVERY_FAILED: 'notification.delivery_failed.v1',
  DELIVERY_RETRY_SCHEDULED: 'notification.delivery_retry_scheduled.v1',
  PREFERENCE_UPDATED: 'notification.preference_updated.v1'
} as const;
```



`apps/notification-service/src/shared/notification-errors.ts`



```TypeScript
export const NotificationErrors = {
  TEMPLATE_NOT_FOUND: 'NOTIFICATION_TEMPLATE_NOT_FOUND',
  TEMPLATE_ALREADY_EXISTS: 'NOTIFICATION_TEMPLATE_ALREADY_EXISTS',
  NOTIFICATION_NOT_FOUND: 'NOTIFICATION_NOT_FOUND',
  NOTIFICATION_STATUS_INVALID: 'NOTIFICATION_STATUS_INVALID',
  DELIVERY_NOT_FOUND: 'NOTIFICATION_DELIVERY_NOT_FOUND',
  DELIVERY_STATUS_INVALID: 'NOTIFICATION_DELIVERY_STATUS_INVALID',
  PREFERENCE_NOT_FOUND: 'NOTIFICATION_PREFERENCE_NOT_FOUND',
  CHANNEL_INVALID: 'NOTIFICATION_CHANNEL_INVALID'
} as const;
```



`apps/notification-service/src/shared/notification-status.ts`



```TypeScript
export const NotificationStatus = {
  CREATED: 'created',
  QUEUED: 'queued',
  SENT: 'sent',
  READ: 'read',
  CANCELLED: 'cancelled',
  FAILED: 'failed'
} as const;

export const DeliveryStatus = {
  PENDING: 'pending',
  SENDING: 'sending',
  DELIVERED: 'delivered',
  FAILED: 'failed',
  RETRY_SCHEDULED: 'retry_scheduled',
  CANCELLED: 'cancelled'
} as const;

export const TemplateStatus = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  ARCHIVED: 'archived'
} as const;
```



`apps/notification-service/src/shared/notification-types.ts`



```TypeScript
export const NotificationChannels = {
  IN_APP: 'in_app',
  EMAIL: 'email',
  SMS: 'sms',
  WEBHOOK: 'webhook',
  PUSH: 'push'
} as const;

export const NotificationPriorities = {
  LOW: 'low',
  NORMAL: 'normal',
  HIGH: 'high',
  URGENT: 'urgent'
} as const;

export const NotificationTargetTypes = {
  USER: 'user',
  EMAIL: 'email',
  PHONE: 'phone',
  WEBHOOK_URL: 'webhook_url',
  DEVICE: 'device'
} as const;
```



---



# 4\. Templates DTO



`apps/notification-service/src/modules/templates/dto/create-template.dto.ts`



```TypeScript
import { IsOptional, IsString } from 'class-validator';

export class CreateTemplateDto {
  @IsString()
  template_code!: string;

  @IsString()
  template_version!: string;

  @IsString()
  channel!: string;

  @IsOptional()
  @IsString()
  title_template?: string;

  @IsString()
  body_template!: string;

  @IsOptional()
  @IsString()
  locale?: string;
}
```



`apps/notification-service/src/modules/templates/dto/query-templates.dto.ts`



```TypeScript
import { IsOptional, IsString } from 'class-validator';

export class QueryTemplatesDto {
  @IsOptional()
  @IsString()
  template_code?: string;

  @IsOptional()
  @IsString()
  channel?: string;

  @IsOptional()
  @IsString()
  locale?: string;

  @IsOptional()
  @IsString()
  status?: string;
}
```



---



# 5\. Templates Repository / Service



`apps/notification-service/src/modules/templates/templates.repository.ts`



```TypeScript
import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { ulid } from 'ulid';

const prisma = new PrismaClient();

@Injectable()
export class TemplatesRepository {
  findByUnique(params: {
    templateCode: string;
    templateVersion: string;
    channel: string;
    locale: string;
  }) {
    return prisma.notificationTemplate.findUnique({
      where: {
        templateCode_templateVersion_channel_locale: params
      }
    });
  }

  findActive(params: {
    templateCode: string;
    channel: string;
    locale: string;
  }) {
    return prisma.notificationTemplate.findFirst({
      where: {
        templateCode: params.templateCode,
        channel: params.channel,
        locale: params.locale,
        status: 'active'
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  findMany(params: {
    templateCode?: string;
    channel?: string;
    locale?: string;
    status?: string;
  }) {
    return prisma.notificationTemplate.findMany({
      where: {
        templateCode: params.templateCode,
        channel: params.channel,
        locale: params.locale,
        status: params.status
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  create(data: {
    templateCode: string;
    templateVersion: string;
    channel: string;
    titleTemplate?: string;
    bodyTemplate: string;
    locale: string;
  }) {
    return prisma.$transaction(async (tx) => {
      const template = await tx.notificationTemplate.create({
        data: {
          id: ulid(),
          templateCode: data.templateCode,
          templateVersion: data.templateVersion,
          channel: data.channel,
          titleTemplate: data.titleTemplate,
          bodyTemplate: data.bodyTemplate,
          locale: data.locale,
          status: 'active'
        }
      });

      await tx.outboxEvent.create({
        data: {
          id: ulid(),
          eventType: 'notification.template_created.v1',
          payload: {
            template_id: template.id,
            template_code: template.templateCode,
            template_version: template.templateVersion,
            channel: template.channel,
            locale: template.locale
          },
          status: 'pending',
          retryCount: 0
        }
      });

      return template;
    });
  }
}
```



`apps/notification-service/src/modules/templates/templates.service.ts`



```TypeScript
import { Injectable } from '@nestjs/common';
import { TemplatesRepository } from './templates.repository';
import { CreateTemplateDto } from './dto/create-template.dto';
import { QueryTemplatesDto } from './dto/query-templates.dto';
import { NotificationErrors } from '../../shared/notification-errors';

@Injectable()
export class TemplatesService {
  constructor(private readonly templatesRepository: TemplatesRepository) {}

  async create(dto: CreateTemplateDto) {
    const locale = dto.locale || 'zh-CN';

    const existing = await this.templatesRepository.findByUnique({
      templateCode: dto.template_code,
      templateVersion: dto.template_version,
      channel: dto.channel,
      locale
    });

    if (existing) {
      throw new Error(NotificationErrors.TEMPLATE_ALREADY_EXISTS);
    }

    const template = await this.templatesRepository.create({
      templateCode: dto.template_code,
      templateVersion: dto.template_version,
      channel: dto.channel,
      titleTemplate: dto.title_template,
      bodyTemplate: dto.body_template,
      locale
    });

    return this.formatTemplate(template);
  }

  async list(query: QueryTemplatesDto) {
    const items = await this.templatesRepository.findMany({
      templateCode: query.template_code,
      channel: query.channel,
      locale: query.locale,
      status: query.status
    });

    return {
      items: items.map((item) => this.formatTemplate(item))
    };
  }

  private formatTemplate(template: any) {
    return {
      template_id: template.id,
      template_code: template.templateCode,
      template_version: template.templateVersion,
      channel: template.channel,
      title_template: template.titleTemplate,
      body_template: template.bodyTemplate,
      locale: template.locale,
      status: template.status
    };
  }
}
```



---



# 6\. Templates Controllers / Module



`apps/notification-service/src/modules/templates/templates.controller.ts`



```TypeScript
import { Controller, Get, Query } from '@nestjs/common';
import { TemplatesService } from './templates.service';
import { QueryTemplatesDto } from './dto/query-templates.dto';

@Controller('notifications/templates')
export class TemplatesController {
  constructor(private readonly templatesService: TemplatesService) {}

  @Get()
  list(@Query() query: QueryTemplatesDto) {
    return this.templatesService.list(query);
  }
}
```



`apps/notification-service/src/modules/templates/templates.admin.controller.ts`



```TypeScript
import { Body, Controller, Post } from '@nestjs/common';
import { TemplatesService } from './templates.service';
import { CreateTemplateDto } from './dto/create-template.dto';

@Controller('admin/notifications/templates')
export class TemplatesAdminController {
  constructor(private readonly templatesService: TemplatesService) {}

  @Post()
  create(@Body() dto: CreateTemplateDto) {
    return this.templatesService.create(dto);
  }
}
```



`apps/notification-service/src/modules/templates/templates.module.ts`



```TypeScript
import { Module } from '@nestjs/common';
import { TemplatesController } from './templates.controller';
import { TemplatesAdminController } from './templates.admin.controller';
import { TemplatesService } from './templates.service';
import { TemplatesRepository } from './templates.repository';

@Module({
  controllers: [TemplatesController, TemplatesAdminController],
  providers: [TemplatesService, TemplatesRepository],
  exports: [TemplatesService, TemplatesRepository]
})
export class TemplatesModule {}
```



---



# 7\. Notifications DTO



`apps/notification-service/src/modules/notifications/dto/create-notification.dto.ts`



```TypeScript
import { IsOptional, IsString } from 'class-validator';

export class CreateNotificationDto {
  @IsOptional()
  @IsString()
  user_id?: string;

  @IsString()
  target_type!: string;

  @IsOptional()
  @IsString()
  target_address?: string;

  @IsString()
  channel!: string;

  @IsOptional()
  @IsString()
  template_code?: string;

  @IsOptional()
  variables?: Record;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  body?: string;

  @IsOptional()
  @IsString()
  priority?: string;

  @IsOptional()
  @IsString()
  source_type?: string;

  @IsOptional()
  @IsString()
  source_id?: string;

  @IsOptional()
  @IsString()
  scheduled_at?: string;
}
```



`apps/notification-service/src/modules/notifications/dto/query-notifications.dto.ts`



```TypeScript
import { IsOptional, IsString } from 'class-validator';

export class QueryNotificationsDto {
  @IsOptional()
  @IsString()
  user_id?: string;

  @IsOptional()
  @IsString()
  channel?: string;

  @IsOptional()
  @IsString()
  notification_status?: string;

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



`apps/notification-service/src/modules/notifications/dto/mark-notification-read.dto.ts`



```TypeScript
import { IsOptional, IsString } from 'class-validator';

export class MarkNotificationReadDto {
  @IsOptional()
  @IsString()
  user_id?: string;
}
```



---



# 8\. Notifications Repository / Service



`apps/notification-service/src/modules/notifications/notifications.repository.ts`



```TypeScript
import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { ulid } from 'ulid';

const prisma = new PrismaClient();

@Injectable()
export class NotificationsRepository {
  findTemplate(templateCode: string, channel: string, locale = 'zh-CN') {
    return prisma.notificationTemplate.findFirst({
      where: {
        templateCode,
        channel,
        locale,
        status: 'active'
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  create(data: {
    notificationNo: string;
    userId?: string;
    targetType: string;
    targetAddress?: string;
    channel: string;
    templateCode?: string;
    title?: string;
    body: string;
    priority: string;
    sourceType?: string;
    sourceId?: string;
    scheduledAt?: Date;
    variables?: Record;
  }) {
    return prisma.$transaction(async (tx) => {
      const notification = await tx.notification.create({
        data: {
          id: ulid(),
          notificationNo: data.notificationNo,
          userId: data.userId,
          targetType: data.targetType,
          targetAddress: data.targetAddress,
          channel: data.channel,
          templateCode: data.templateCode,
          title: data.title,
          body: data.body,
          priority: data.priority,
          notificationStatus: 'created',
          sourceType: data.sourceType,
          sourceId: data.sourceId,
          scheduledAt: data.scheduledAt,
          metadata: {
            variables: data.variables || {}
          }
        }
      });

      const delivery = await tx.notificationDelivery.create({
        data: {
          id: ulid(),
          deliveryNo: `NDL${new Date().toISOString().slice(0, 10).replace(/-/g, '')}${ulid()}`,
          notificationId: notification.id,
          channel: notification.channel,
          targetAddress: notification.targetAddress,
          deliveryStatus: 'pending',
          retryCount: 0,
          maxRetry: 3
        }
      });

      await tx.outboxEvent.create({
        data: {
          id: ulid(),
          eventType: 'notification.created.v1',
          payload: {
            notification_id: notification.id,
            notification_no: notification.notificationNo,
            user_id: notification.userId,
            channel: notification.channel,
            delivery_id: delivery.id,
            delivery_no: delivery.deliveryNo
          },
          status: 'pending',
          retryCount: 0
        }
      });

      return tx.notification.findUnique({
        where: { id: notification.id },
        include: { deliveries: true }
      });
    });
  }

  findById(notificationId: string) {
    return prisma.notification.findUnique({
      where: { id: notificationId },
      include: { deliveries: true }
    });
  }

  findMany(params: {
    userId?: string;
    channel?: string;
    notificationStatus?: string;
    sourceType?: string;
    sourceId?: string;
    page: number;
    pageSize: number;
  }) {
    return prisma.notification.findMany({
      where: {
        userId: params.userId,
        channel: params.channel,
        notificationStatus: params.notificationStatus,
        sourceType: params.sourceType,
        sourceId: params.sourceId
      },
      include: { deliveries: true },
      orderBy: { createdAt: 'desc' },
      skip: (params.page - 1) * params.pageSize,
      take: params.pageSize
    });
  }

  count(params: {
    userId?: string;
    channel?: string;
    notificationStatus?: string;
    sourceType?: string;
    sourceId?: string;
  }) {
    return prisma.notification.count({
      where: {
        userId: params.userId,
        channel: params.channel,
        notificationStatus: params.notificationStatus,
        sourceType: params.sourceType,
        sourceId: params.sourceId
      }
    });
  }

  markRead(notificationId: string) {
    return prisma.$transaction(async (tx) => {
      const notification = await tx.notification.update({
        where: { id: notificationId },
        data: {
          notificationStatus: 'read',
          readAt: new Date()
        },
        include: { deliveries: true }
      });

      await tx.outboxEvent.create({
        data: {
          id: ulid(),
          eventType: 'notification.read.v1',
          payload: {
            notification_id: notification.id,
            notification_no: notification.notificationNo,
            user_id: notification.userId,
            read_at: notification.readAt
          },
          status: 'pending',
          retryCount: 0
        }
      });

      return notification;
    });
  }
}
```



`apps/notification-service/src/modules/notifications/notifications.service.ts`



```TypeScript
import { Injectable } from '@nestjs/common';
import { ulid } from 'ulid';
import { NotificationsRepository } from './notifications.repository';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { QueryNotificationsDto } from './dto/query-notifications.dto';
import { MarkNotificationReadDto } from './dto/mark-notification-read.dto';
import { NotificationErrors } from '../../shared/notification-errors';

@Injectable()
export class NotificationsService {
  constructor(private readonly notificationsRepository: NotificationsRepository) {}

  async create(dto: CreateNotificationDto) {
    let title = dto.title;
    let body = dto.body;

    if (dto.template_code) {
      const template = await this.notificationsRepository.findTemplate(
        dto.template_code,
        dto.channel
      );

      if (!template) {
        throw new Error(NotificationErrors.TEMPLATE_NOT_FOUND);
      }

      title = template.titleTemplate
        ? this.render(template.titleTemplate, dto.variables || {})
        : title;

      body = this.render(template.bodyTemplate, dto.variables || {});
    }

    if (!body) {
      throw new Error(NotificationErrors.TEMPLATE_NOT_FOUND);
    }

    const notification = await this.notificationsRepository.create({
      notificationNo: this.generateNotificationNo(),
      userId: dto.user_id,
      targetType: dto.target_type,
      targetAddress: dto.target_address,
      channel: dto.channel,
      templateCode: dto.template_code,
      title,
      body,
      priority: dto.priority || 'normal',
      sourceType: dto.source_type,
      sourceId: dto.source_id,
      scheduledAt: dto.scheduled_at ? new Date(dto.scheduled_at) : undefined,
      variables: dto.variables
    });

    return this.formatNotification(notification);
  }

  async detail(notificationId: string) {
    const notification = await this.notificationsRepository.findById(notificationId);
    if (!notification) throw new Error(NotificationErrors.NOTIFICATION_NOT_FOUND);
    return this.formatNotification(notification);
  }

  async list(query: QueryNotificationsDto) {
    const page = Number(query.page || 1);
    const pageSize = Math.min(Number(query.page_size || 20), 100);

    const [items, total] = await Promise.all([
      this.notificationsRepository.findMany({
        userId: query.user_id,
        channel: query.channel,
        notificationStatus: query.notification_status,
        sourceType: query.source_type,
        sourceId: query.source_id,
        page,
        pageSize
      }),
      this.notificationsRepository.count({
        userId: query.user_id,
        channel: query.channel,
        notificationStatus: query.notification_status,
        sourceType: query.source_type,
        sourceId: query.source_id
      })
    ]);

    return {
      items: items.map((item) => this.formatNotification(item)),
      pagination: {
        page,
        page_size: pageSize,
        total,
        total_pages: Math.ceil(total / pageSize)
      }
    };
  }

  async markRead(notificationId: string, dto: MarkNotificationReadDto) {
    const notification = await this.notificationsRepository.findById(notificationId);

    if (!notification) {
      throw new Error(NotificationErrors.NOTIFICATION_NOT_FOUND);
    }

    if (dto.user_id && notification.userId !== dto.user_id) {
      throw new Error(NotificationErrors.NOTIFICATION_NOT_FOUND);
    }

    const updated = await this.notificationsRepository.markRead(notificationId);
    return this.formatNotification(updated);
  }

  private render(template: string, variables: Record) {
    return template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
      const value = variables[key];
      return value === undefined || value === null ? '' : String(value);
    });
  }

  private formatNotification(notification: any) {
    return {
      notification_id: notification.id,
      notification_no: notification.notificationNo,
      user_id: notification.userId,
      target_type: notification.targetType,
      target_address: notification.targetAddress,
      channel: notification.channel,
      template_code: notification.templateCode,
      title: notification.title,
      body: notification.body,
      priority: notification.priority,
      notification_status: notification.notificationStatus,
      read_at: notification.readAt,
      source_type: notification.sourceType,
      source_id: notification.sourceId,
      scheduled_at: notification.scheduledAt,
      deliveries: notification.deliveries?.map((delivery: any) => ({
        delivery_id: delivery.id,
        delivery_no: delivery.deliveryNo,
        channel: delivery.channel,
        provider: delivery.provider,
        target_address: delivery.targetAddress,
        delivery_status: delivery.deliveryStatus,
        retry_count: delivery.retryCount,
        delivered_at: delivery.deliveredAt,
        failed_at: delivery.failedAt,
        next_retry_at: delivery.nextRetryAt
      })) || []
    };
  }

  private generateNotificationNo() {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    return `NTF${date}${ulid()}`;
  }
}
```



---



# 9\. Notifications Controllers / Module



`apps/notification-service/src/modules/notifications/notifications.controller.ts`



```TypeScript
import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { QueryNotificationsDto } from './dto/query-notifications.dto';
import { MarkNotificationReadDto } from './dto/mark-notification-read.dto';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  list(@Query() query: QueryNotificationsDto) {
    return this.notificationsService.list(query);
  }

  @Get(':notification_id')
  detail(@Param('notification_id') notificationId: string) {
    return this.notificationsService.detail(notificationId);
  }

  @Post(':notification_id/read')
  markRead(
    @Param('notification_id') notificationId: string,
    @Body() dto: MarkNotificationReadDto
  ) {
    return this.notificationsService.markRead(notificationId, dto);
  }
}
```



`apps/notification-service/src/modules/notifications/notifications.admin.controller.ts`



```TypeScript
import { Body, Controller, Post } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { CreateNotificationDto } from './dto/create-notification.dto';

@Controller('admin/notifications')
export class NotificationsAdminController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post()
  create(@Body() dto: CreateNotificationDto) {
    return this.notificationsService.create(dto);
  }
}
```



`apps/notification-service/src/modules/notifications/notifications.module.ts`



```TypeScript
import { Module } from '@nestjs/common';
import { NotificationsController } from './notifications.controller';
import { NotificationsAdminController } from './notifications.admin.controller';
import { NotificationsService } from './notifications.service';
import { NotificationsRepository } from './notifications.repository';

@Module({
  controllers: [NotificationsController, NotificationsAdminController],
  providers: [NotificationsService, NotificationsRepository],
  exports: [NotificationsService]
})
export class NotificationsModule {}
```



---



# 10\. Deliveries DTO / Repository / Service



`apps/notification-service/src/modules/deliveries/dto/query-deliveries.dto.ts`



```TypeScript
import { IsOptional, IsString } from 'class-validator';

export class QueryDeliveriesDto {
  @IsOptional()
  @IsString()
  notification_id?: string;

  @IsOptional()
  @IsString()
  channel?: string;

  @IsOptional()
  @IsString()
  delivery_status?: string;

  @IsOptional()
  page?: number;

  @IsOptional()
  page_size?: number;
}
```



`apps/notification-service/src/modules/deliveries/dto/retry-delivery.dto.ts`



```TypeScript
import { IsOptional, IsString } from 'class-validator';

export class RetryDeliveryDto {
  @IsOptional()
  @IsString()
  reason?: string;
}
```



`apps/notification-service/src/modules/deliveries/deliveries.repository.ts`



```TypeScript
import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { ulid } from 'ulid';

const prisma = new PrismaClient();

@Injectable()
export class DeliveriesRepository {
  findById(deliveryId: string) {
    return prisma.notificationDelivery.findUnique({
      where: { id: deliveryId },
      include: { notification: true }
    });
  }

  findMany(params: {
    notificationId?: string;
    channel?: string;
    deliveryStatus?: string;
    page: number;
    pageSize: number;
  }) {
    return prisma.notificationDelivery.findMany({
      where: {
        notificationId: params.notificationId,
        channel: params.channel,
        deliveryStatus: params.deliveryStatus
      },
      orderBy: { createdAt: 'desc' },
      skip: (params.page - 1) * params.pageSize,
      take: params.pageSize
    });
  }

  count(params: {
    notificationId?: string;
    channel?: string;
    deliveryStatus?: string;
  }) {
    return prisma.notificationDelivery.count({
      where: {
        notificationId: params.notificationId,
        channel: params.channel,
        deliveryStatus: params.deliveryStatus
      }
    });
  }

  markDelivered(deliveryId: string, providerMessageId?: string) {
    return prisma.$transaction(async (tx) => {
      const delivery = await tx.notificationDelivery.update({
        where: { id: deliveryId },
        data: {
          deliveryStatus: 'delivered',
          providerMessageId,
          deliveredAt: new Date()
        }
      });

      await tx.notification.update({
        where: { id: delivery.notificationId },
        data: { notificationStatus: 'sent' }
      });

      await tx.outboxEvent.create({
        data: {
          id: ulid(),
          eventType: 'notification.delivery_succeeded.v1',
          payload: {
            delivery_id: delivery.id,
            delivery_no: delivery.deliveryNo,
            notification_id: delivery.notificationId,
            provider_message_id: delivery.providerMessageId
          },
          status: 'pending',
          retryCount: 0
        }
      });

      return delivery;
    });
  }

  markFailed(params: {
    deliveryId: string;
    errorCode?: string;
    errorMessage?: string;
    nextRetryAt?: Date;
  }) {
    return prisma.$transaction(async (tx) => {
      const current = await tx.notificationDelivery.findUniqueOrThrow({
        where: { id: params.deliveryId }
      });

      const retryCount = current.retryCount + 1;
      const shouldRetry = retryCount  this.formatDelivery(item)),
      pagination: {
        page,
        page_size: pageSize,
        total,
        total_pages: Math.ceil(total / pageSize)
      }
    };
  }

  async markDelivered(deliveryId: string, providerMessageId?: string) {
    const delivery = await this.deliveriesRepository.findById(deliveryId);
    if (!delivery) throw new Error(NotificationErrors.DELIVERY_NOT_FOUND);

    if (
      ![
        DeliveryStatus.PENDING,
        DeliveryStatus.SENDING,
        DeliveryStatus.RETRY_SCHEDULED
      ].includes(delivery.deliveryStatus as any)
    ) {
      throw new Error(NotificationErrors.DELIVERY_STATUS_INVALID);
    }

    const updated = await this.deliveriesRepository.markDelivered(
      deliveryId,
      providerMessageId
    );

    return this.formatDelivery(updated);
  }

  async markFailed(
    deliveryId: string,
    errorCode?: string,
    errorMessage?: string
  ) {
    const delivery = await this.deliveriesRepository.findById(deliveryId);
    if (!delivery) throw new Error(NotificationErrors.DELIVERY_NOT_FOUND);

    const nextRetryAt = new Date();
    nextRetryAt.setMinutes(nextRetryAt.getMinutes() + 5);

    const updated = await this.deliveriesRepository.markFailed({
      deliveryId,
      errorCode,
      errorMessage,
      nextRetryAt
    });

    return this.formatDelivery(updated);
  }

  async retry(deliveryId: string, dto: RetryDeliveryDto) {
    const delivery = await this.deliveriesRepository.findById(deliveryId);
    if (!delivery) throw new Error(NotificationErrors.DELIVERY_NOT_FOUND);

    if (
      ![
        DeliveryStatus.FAILED,
        DeliveryStatus.RETRY_SCHEDULED
      ].includes(delivery.deliveryStatus as any)
    ) {
      throw new Error(NotificationErrors.DELIVERY_STATUS_INVALID);
    }

    const updated = await this.deliveriesRepository.scheduleRetry(deliveryId);

    return {
      ...this.formatDelivery(updated),
      reason: dto.reason
    };
  }

  private formatDelivery(delivery: any) {
    return {
      delivery_id: delivery.id,
      delivery_no: delivery.deliveryNo,
      notification_id: delivery.notificationId,
      channel: delivery.channel,
      provider: delivery.provider,
      target_address: delivery.targetAddress,
      delivery_status: delivery.deliveryStatus,
      retry_count: delivery.retryCount,
      max_retry: delivery.maxRetry,
      provider_message_id: delivery.providerMessageId,
      error_code: delivery.errorCode,
      error_message: delivery.errorMessage,
      delivered_at: delivery.deliveredAt,
      failed_at: delivery.failedAt,
      next_retry_at: delivery.nextRetryAt
    };
  }
}
```



---



# 11\. Deliveries Controllers / Module



`apps/notification-service/src/modules/deliveries/deliveries.controller.ts`



```TypeScript
import { Controller, Get, Query } from '@nestjs/common';
import { DeliveriesService } from './deliveries.service';
import { QueryDeliveriesDto } from './dto/query-deliveries.dto';

@Controller('notifications/deliveries')
export class DeliveriesController {
  constructor(private readonly deliveriesService: DeliveriesService) {}

  @Get()
  list(@Query() query: QueryDeliveriesDto) {
    return this.deliveriesService.list(query);
  }
}
```



`apps/notification-service/src/modules/deliveries/deliveries.admin.controller.ts`



```TypeScript
import { Body, Controller, Param, Post } from '@nestjs/common';
import { DeliveriesService } from './deliveries.service';
import { RetryDeliveryDto } from './dto/retry-delivery.dto';

@Controller('admin/notifications/deliveries')
export class DeliveriesAdminController {
  constructor(private readonly deliveriesService: DeliveriesService) {}

  @Post(':delivery_id/delivered')
  markDelivered(
    @Param('delivery_id') deliveryId: string,
    @Body() dto: { provider_message_id?: string }
  ) {
    return this.deliveriesService.markDelivered(
      deliveryId,
      dto.provider_message_id
    );
  }

  @Post(':delivery_id/failed')
  markFailed(
    @Param('delivery_id') deliveryId: string,
    @Body() dto: { error_code?: string; error_message?: string }
  ) {
    return this.deliveriesService.markFailed(
      deliveryId,
      dto.error_code,
      dto.error_message
    );
  }

  @Post(':delivery_id/retry')
  retry(@Param('delivery_id') deliveryId: string, @Body() dto: RetryDeliveryDto) {
    return this.deliveriesService.retry(deliveryId, dto);
  }
}
```



`apps/notification-service/src/modules/deliveries/deliveries.module.ts`



```TypeScript
import { Module } from '@nestjs/common';
import { DeliveriesController } from './deliveries.controller';
import { DeliveriesAdminController } from './deliveries.admin.controller';
import { DeliveriesService } from './deliveries.service';
import { DeliveriesRepository } from './deliveries.repository';

@Module({
  controllers: [DeliveriesController, DeliveriesAdminController],
  providers: [DeliveriesService, DeliveriesRepository],
  exports: [DeliveriesService]
})
export class DeliveriesModule {}
```



---



# 12\. Preferences DTO / Repository / Service



`apps/notification-service/src/modules/preferences/dto/upsert-preference.dto.ts`



```TypeScript
import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class UpsertPreferenceDto {
  @IsString()
  user_id!: string;

  @IsString()
  channel!: string;

  @IsString()
  notification_type!: string;

  @IsBoolean()
  enabled!: boolean;

  @IsOptional()
  @IsString()
  quiet_hours_start?: string;

  @IsOptional()
  @IsString()
  quiet_hours_end?: string;

  @IsOptional()
  @IsString()
  locale?: string;
}
```



`apps/notification-service/src/modules/preferences/preferences.repository.ts`



```TypeScript
import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { ulid } from 'ulid';

const prisma = new PrismaClient();

@Injectable()
export class PreferencesRepository {
  upsert(data: {
    userId: string;
    channel: string;
    notificationType: string;
    enabled: boolean;
    quietHoursStart?: string;
    quietHoursEnd?: string;
    locale: string;
  }) {
    return prisma.$transaction(async (tx) => {
      const preference = await tx.notificationPreference.upsert({
        where: {
          userId_channel_notificationType: {
            userId: data.userId,
            channel: data.channel,
            notificationType: data.notificationType
          }
        },
        create: {
          id: ulid(),
          userId: data.userId,
          channel: data.channel,
          notificationType: data.notificationType,
          enabled: data.enabled,
          quietHoursStart: data.quietHoursStart,
          quietHoursEnd: data.quietHoursEnd,
          locale: data.locale
        },
        update: {
          enabled: data.enabled,
          quietHoursStart: data.quietHoursStart,
          quietHoursEnd: data.quietHoursEnd,
          locale: data.locale
        }
      });

      await tx.outboxEvent.create({
        data: {
          id: ulid(),
          eventType: 'notification.preference_updated.v1',
          payload: {
            preference_id: preference.id,
            user_id: preference.userId,
            channel: preference.channel,
            notification_type: preference.notificationType,
            enabled: preference.enabled
          },
          status: 'pending',
          retryCount: 0
        }
      });

      return preference;
    });
  }

  findByUserId(userId: string) {
    return prisma.notificationPreference.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });
  }
}
```



`apps/notification-service/src/modules/preferences/preferences.service.ts`



```TypeScript
import { Injectable } from '@nestjs/common';
import { PreferencesRepository } from './preferences.repository';
import { UpsertPreferenceDto } from './dto/upsert-preference.dto';

@Injectable()
export class PreferencesService {
  constructor(private readonly preferencesRepository: PreferencesRepository) {}

  async upsert(dto: UpsertPreferenceDto) {
    const preference = await this.preferencesRepository.upsert({
      userId: dto.user_id,
      channel: dto.channel,
      notificationType: dto.notification_type,
      enabled: dto.enabled,
      quietHoursStart: dto.quiet_hours_start,
      quietHoursEnd: dto.quiet_hours_end,
      locale: dto.locale || 'zh-CN'
    });

    return this.formatPreference(preference);
  }

  async listByUser(userId: string) {
    const items = await this.preferencesRepository.findByUserId(userId);

    return {
      items: items.map((item) => this.formatPreference(item))
    };
  }

  private formatPreference(preference: any) {
    return {
      preference_id: preference.id,
      user_id: preference.userId,
      channel: preference.channel,
      notification_type: preference.notificationType,
      enabled: preference.enabled,
      quiet_hours_start: preference.quietHoursStart,
      quiet_hours_end: preference.quietHoursEnd,
      locale: preference.locale
    };
  }
}
```



---



# 13\. Preferences Controller / Module



`apps/notification-service/src/modules/preferences/preferences.controller.ts`



```TypeScript
import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { PreferencesService } from './preferences.service';
import { UpsertPreferenceDto } from './dto/upsert-preference.dto';

@Controller('notifications/preferences')
export class PreferencesController {
  constructor(private readonly preferencesService: PreferencesService) {}

  @Post()
  upsert(@Body() dto: UpsertPreferenceDto) {
    return this.preferencesService.upsert(dto);
  }

  @Get('users/:user_id')
  listByUser(@Param('user_id') userId: string) {
    return this.preferencesService.listByUser(userId);
  }
}
```



`apps/notification-service/src/modules/preferences/preferences.module.ts`



```TypeScript
import { Module } from '@nestjs/common';
import { PreferencesController } from './preferences.controller';
import { PreferencesService } from './preferences.service';
import { PreferencesRepository } from './preferences.repository';

@Module({
  controllers: [PreferencesController],
  providers: [PreferencesService, PreferencesRepository],
  exports: [PreferencesService]
})
export class PreferencesModule {}
```



---



# 14\. Notification App Module



`apps/notification-service/src/app.module.ts`



```TypeScript
import { Module } from '@nestjs/common';
import { HealthModule } from './health/health.module';
import { TemplatesModule } from './modules/templates/templates.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { DeliveriesModule } from './modules/deliveries/deliveries.module';
import { PreferencesModule } from './modules/preferences/preferences.module';

@Module({
  imports: [
    HealthModule,
    TemplatesModule,
    NotificationsModule,
    DeliveriesModule,
    PreferencesModule
  ]
})
export class AppModule {}
```



---



# 15\. Notification Service 当前 API



## 用户端 / 业务端



```HTTP
GET /api/v1/notifications
GET /api/v1/notifications/:notification_id
POST /api/v1/notifications/:notification_id/read

GET /api/v1/notifications/templates
GET /api/v1/notifications/deliveries

POST /api/v1/notifications/preferences
GET /api/v1/notifications/preferences/users/:user_id
```



## 后台端



```HTTP
POST /api/v1/admin/notifications
POST /api/v1/admin/notifications/templates

POST /api/v1/admin/notifications/deliveries/:delivery_id/delivered
POST /api/v1/admin/notifications/deliveries/:delivery_id/failed
POST /api/v1/admin/notifications/deliveries/:delivery_id/retry
```



---



# 16\. Notification Service 已具备能力



这一版完成后，Notification Service 支持：



```Plain Text
通知模板创建 / 查询
模板变量渲染
站内信 / 邮件 / 短信 / Webhook / Push 通道建模
通知创建
通知查询
通知已读
投递记录创建
投递成功标记
投递失败标记
失败重试调度
用户通知偏好设置
Notification outbox 事件
```



---



# 17\. 后续必须补强



```Plain Text
统一 AppException
PrismaModule 注入
真实 Email Provider
真实 SMS Provider
真实 Push Provider
Webhook 签名与重试
通知偏好在发送前强校验
静默时间处理
批量通知
延迟队列
模板国际化版本管理
Admin 权限 Guard
Audit Log
```



---



# 18\. 下一步继续



按 23 个 Service 顺序，下一步写：



```Plain Text
22. File Service 文件服务
```



下一步会覆盖：



```Plain Text
文件上传凭证
短期签名 URL
KYC 文件隔离
文件访问审计
文件元数据
文件权限
FileUploaded / FileAccessed / SignedUrlCreated 事件
```



