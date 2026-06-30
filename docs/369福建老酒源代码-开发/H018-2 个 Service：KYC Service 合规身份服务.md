# H018\-2 个 Service：KYC Service 合规身份服务

下面继续按你指定的 23 个 Service 顺序写代码。



# 第 2 个 Service：KYC Service 合规身份服务



本服务负责：



```Plain Text
个人 KYC
企业 KYB
证件资料提交
审核通过
审核拒绝
人工复核
KYC / KYB 状态机
审核日志
KYC 文件访问审计预留
KycSubmitted / KycApproved / KycRejected 事件预留
```



---



# 1\. KYC Service 目录结构



```Plain Text
apps/kyc-service/
├── src/
│   ├── main.ts
│   ├── app.module.ts
│   ├── health/
│   │   ├── health.controller.ts
│   │   └── health.module.ts
│   ├── shared/
│   │   ├── kyc-errors.ts
│   │   ├── kyc-events.ts
│   │   └── kyc-status.ts
│   └── modules/
│       ├── kyc/
│       │   ├── kyc.module.ts
│       │   ├── kyc.controller.ts
│       │   ├── kyc.admin.controller.ts
│       │   ├── kyc.service.ts
│       │   ├── kyc.repository.ts
│       │   └── dto/
│       │       ├── submit-kyc.dto.ts
│       │       ├── approve-kyc.dto.ts
│       │       └── reject-kyc.dto.ts
│       └── kyb/
│           ├── kyb.module.ts
│           ├── kyb.controller.ts
│           ├── kyb.admin.controller.ts
│           ├── kyb.service.ts
│           ├── kyb.repository.ts
│           └── dto/
│               ├── submit-kyb.dto.ts
│               ├── approve-kyb.dto.ts
│               └── reject-kyb.dto.ts
```



---



# 2\. Prisma 需要补充的表



在 `prisma/schema.prisma` 增加：



```Plain Text
model UserKyc {
  id                 String    @id
  userId             String    @map("user_id")
  kycLevel           String    @default("standard") @map("kyc_level")
  kycStatus          String    @default("pending") @map("kyc_status")
  provider           String?
  documentType       String    @map("document_type")
  documentCountry    String    @map("document_country")
  documentNumberHash String?   @map("document_number_hash")
  documentFrontUrl   String?   @map("document_front_url")
  documentBackUrl    String?   @map("document_back_url")
  selfieUrl          String?   @map("selfie_url")
  reviewerId         String?   @map("reviewer_id")
  reviewNote         String?   @map("review_note")
  submittedAt        DateTime? @map("submitted_at")
  approvedAt         DateTime? @map("approved_at")
  rejectedAt         DateTime? @map("rejected_at")
  expiredAt          DateTime? @map("expired_at")
  createdAt          DateTime  @default(now()) @map("created_at")
  updatedAt          DateTime  @updatedAt @map("updated_at")
  metadata           Json?

  @@index([userId])
  @@index([kycStatus])
  @@index([documentCountry])
  @@map("user_kyc")
}

model UserKyb {
  id                     String    @id
  userId                 String    @map("user_id")
  companyName            String    @map("company_name")
  registrationNumberHash String?   @map("registration_number_hash")
  registrationCountry    String    @map("registration_country")
  companyAddress         String?   @map("company_address")
  beneficialOwnerInfo    Json?     @map("beneficial_owner_info")
  businessLicenseUrl     String?   @map("business_license_url")
  taxInfo                Json?     @map("tax_info")
  kybStatus              String    @default("pending") @map("kyb_status")
  provider               String?
  reviewerId             String?   @map("reviewer_id")
  reviewNote             String?   @map("review_note")
  submittedAt            DateTime? @map("submitted_at")
  approvedAt             DateTime? @map("approved_at")
  rejectedAt             DateTime? @map("rejected_at")
  expiredAt              DateTime? @map("expired_at")
  createdAt              DateTime  @default(now()) @map("created_at")
  updatedAt              DateTime  @updatedAt @map("updated_at")
  metadata               Json?

  @@index([userId])
  @@index([kybStatus])
  @@index([registrationCountry])
  @@map("user_kyb")
}

model KycReviewLog {
  id           String   @id
  targetType   String   @map("target_type")
  targetId     String   @map("target_id")
  fromStatus   String?  @map("from_status")
  toStatus     String   @map("to_status")
  reviewerId   String?  @map("reviewer_id")
  reviewNote   String?  @map("review_note")
  createdAt    DateTime @default(now()) @map("created_at")
  metadata     Json?

  @@index([targetType, targetId])
  @@index([reviewerId])
  @@map("kyc_review_logs")
}
```



说明：



```Plain Text
KYC / KYB 不直接放在 identity-service 内部，是为了合规隔离。
KYC 文件访问以后必须走短期签名 URL，不直接公开文件地址。
```



---



# 3\. KYC Events



`apps/kyc-service/src/shared/kyc-events.ts`



```TypeScript
export const KycEvents = {
  KYC_SUBMITTED: 'kyc.submitted.v1',
  KYC_APPROVED: 'kyc.approved.v1',
  KYC_REJECTED: 'kyc.rejected.v1',
  KYC_EXPIRED: 'kyc.expired.v1',

  KYB_SUBMITTED: 'kyb.submitted.v1',
  KYB_APPROVED: 'kyb.approved.v1',
  KYB_REJECTED: 'kyb.rejected.v1',
  KYB_EXPIRED: 'kyb.expired.v1'
} as const;
```



---



# 4\. KYC Errors



`apps/kyc-service/src/shared/kyc-errors.ts`



```TypeScript
export const KycErrors = {
  KYC_NOT_FOUND: 'KYC_NOT_FOUND',
  KYC_ALREADY_SUBMITTED: 'KYC_ALREADY_SUBMITTED',
  KYC_STATUS_INVALID: 'KYC_STATUS_INVALID',
  KYC_ALREADY_APPROVED: 'KYC_ALREADY_APPROVED',
  KYC_DOCUMENT_REQUIRED: 'KYC_DOCUMENT_REQUIRED',

  KYB_NOT_FOUND: 'KYB_NOT_FOUND',
  KYB_ALREADY_SUBMITTED: 'KYB_ALREADY_SUBMITTED',
  KYB_STATUS_INVALID: 'KYB_STATUS_INVALID',
  KYB_ALREADY_APPROVED: 'KYB_ALREADY_APPROVED',
  KYB_DOCUMENT_REQUIRED: 'KYB_DOCUMENT_REQUIRED'
} as const;
```



---



# 5\. KYC 状态枚举



`apps/kyc-service/src/shared/kyc-status.ts`



```TypeScript
export const KycStatus = {
  NOT_SUBMITTED: 'not_submitted',
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  EXPIRED: 'expired',
  MANUAL_REVIEW: 'manual_review'
} as const;

export type KycStatusValue = typeof KycStatus[keyof typeof KycStatus];

export const KycStatusTransitions: Record = {
  not_submitted: ['pending'],
  pending: ['approved', 'rejected', 'manual_review'],
  manual_review: ['approved', 'rejected'],
  approved: ['expired'],
  rejected: ['pending'],
  expired: ['pending']
};

export function canTransitKycStatus(from: string, to: string): boolean {
  return KycStatusTransitions[from]?.includes(to) ?? false;
}
```



---



# 6\. Submit KYC DTO



`apps/kyc-service/src/modules/kyc/dto/submit-kyc.dto.ts`



```TypeScript
import { IsOptional, IsString } from 'class-validator';

export class SubmitKycDto {
  @IsString()
  user_id!: string;

  @IsOptional()
  @IsString()
  kyc_level?: string;

  @IsString()
  document_type!: string;

  @IsString()
  document_country!: string;

  @IsOptional()
  @IsString()
  document_number_hash?: string;

  @IsOptional()
  @IsString()
  document_front_url?: string;

  @IsOptional()
  @IsString()
  document_back_url?: string;

  @IsOptional()
  @IsString()
  selfie_url?: string;

  @IsOptional()
  @IsString()
  provider?: string;
}
```



---



# 7\. Approve KYC DTO



`apps/kyc-service/src/modules/kyc/dto/approve-kyc.dto.ts`



```TypeScript
import { IsOptional, IsString } from 'class-validator';

export class ApproveKycDto {
  @IsString()
  reviewer_id!: string;

  @IsOptional()
  @IsString()
  review_note?: string;
}
```



---



# 8\. Reject KYC DTO



`apps/kyc-service/src/modules/kyc/dto/reject-kyc.dto.ts`



```TypeScript
import { IsString } from 'class-validator';

export class RejectKycDto {
  @IsString()
  reviewer_id!: string;

  @IsString()
  review_note!: string;
}
```



---



# 9\. KYC Repository



`apps/kyc-service/src/modules/kyc/kyc.repository.ts`



```TypeScript
import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { ulid } from 'ulid';

const prisma = new PrismaClient();

@Injectable()
export class KycRepository {
  findLatestByUserId(userId: string) {
    return prisma.userKyc.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });
  }

  findById(kycId: string) {
    return prisma.userKyc.findUnique({
      where: { id: kycId }
    });
  }

  create(data: {
    userId: string;
    kycLevel: string;
    provider?: string;
    documentType: string;
    documentCountry: string;
    documentNumberHash?: string;
    documentFrontUrl?: string;
    documentBackUrl?: string;
    selfieUrl?: string;
  }) {
    return prisma.userKyc.create({
      data: {
        id: ulid(),
        userId: data.userId,
        kycLevel: data.kycLevel,
        provider: data.provider,
        documentType: data.documentType,
        documentCountry: data.documentCountry,
        documentNumberHash: data.documentNumberHash,
        documentFrontUrl: data.documentFrontUrl,
        documentBackUrl: data.documentBackUrl,
        selfieUrl: data.selfieUrl,
        kycStatus: 'pending',
        submittedAt: new Date()
      }
    });
  }

  updateStatus(params: {
    kycId: string;
    fromStatus?: string;
    toStatus: string;
    reviewerId?: string;
    reviewNote?: string;
  }) {
    const now = new Date();

    return prisma.$transaction(async (tx) => {
      const updated = await tx.userKyc.update({
        where: { id: params.kycId },
        data: {
          kycStatus: params.toStatus,
          reviewerId: params.reviewerId,
          reviewNote: params.reviewNote,
          approvedAt: params.toStatus === 'approved' ? now : undefined,
          rejectedAt: params.toStatus === 'rejected' ? now : undefined,
          expiredAt: params.toStatus === 'expired' ? now : undefined
        }
      });

      await tx.kycReviewLog.create({
        data: {
          id: ulid(),
          targetType: 'kyc',
          targetId: params.kycId,
          fromStatus: params.fromStatus,
          toStatus: params.toStatus,
          reviewerId: params.reviewerId,
          reviewNote: params.reviewNote
        }
      });

      return updated;
    });
  }
}
```



---



# 10\. KYC Service



`apps/kyc-service/src/modules/kyc/kyc.service.ts`



```TypeScript
import { Injectable } from '@nestjs/common';
import { KycRepository } from './kyc.repository';
import { SubmitKycDto } from './dto/submit-kyc.dto';
import { ApproveKycDto } from './dto/approve-kyc.dto';
import { RejectKycDto } from './dto/reject-kyc.dto';
import { KycErrors } from '../../shared/kyc-errors';
import { canTransitKycStatus } from '../../shared/kyc-status';

@Injectable()
export class KycService {
  constructor(private readonly kycRepository: KycRepository) {}

  async submit(dto: SubmitKycDto) {
    const latest = await this.kycRepository.findLatestByUserId(dto.user_id);

    if (latest && ['pending', 'manual_review', 'approved'].includes(latest.kycStatus)) {
      throw new Error(KycErrors.KYC_ALREADY_SUBMITTED);
    }

    if (!dto.document_front_url && !dto.document_number_hash) {
      throw new Error(KycErrors.KYC_DOCUMENT_REQUIRED);
    }

    const kyc = await this.kycRepository.create({
      userId: dto.user_id,
      kycLevel: dto.kyc_level || 'standard',
      provider: dto.provider,
      documentType: dto.document_type,
      documentCountry: dto.document_country,
      documentNumberHash: dto.document_number_hash,
      documentFrontUrl: dto.document_front_url,
      documentBackUrl: dto.document_back_url,
      selfieUrl: dto.selfie_url
    });

    return {
      kyc_id: kyc.id,
      user_id: kyc.userId,
      kyc_status: kyc.kycStatus,
      submitted_at: kyc.submittedAt
    };
  }

  async getLatestByUserId(userId: string) {
    const kyc = await this.kycRepository.findLatestByUserId(userId);

    if (!kyc) {
      return {
        user_id: userId,
        kyc_status: 'not_submitted'
      };
    }

    return {
      kyc_id: kyc.id,
      user_id: kyc.userId,
      kyc_level: kyc.kycLevel,
      kyc_status: kyc.kycStatus,
      document_type: kyc.documentType,
      document_country: kyc.documentCountry,
      submitted_at: kyc.submittedAt,
      approved_at: kyc.approvedAt,
      rejected_at: kyc.rejectedAt
    };
  }

  async approve(kycId: string, dto: ApproveKycDto) {
    const kyc = await this.kycRepository.findById(kycId);

    if (!kyc) {
      throw new Error(KycErrors.KYC_NOT_FOUND);
    }

    if (!canTransitKycStatus(kyc.kycStatus, 'approved')) {
      throw new Error(KycErrors.KYC_STATUS_INVALID);
    }

    const updated = await this.kycRepository.updateStatus({
      kycId,
      fromStatus: kyc.kycStatus,
      toStatus: 'approved',
      reviewerId: dto.reviewer_id,
      reviewNote: dto.review_note
    });

    return {
      kyc_id: updated.id,
      user_id: updated.userId,
      kyc_status: updated.kycStatus,
      approved_at: updated.approvedAt
    };
  }

  async reject(kycId: string, dto: RejectKycDto) {
    const kyc = await this.kycRepository.findById(kycId);

    if (!kyc) {
      throw new Error(KycErrors.KYC_NOT_FOUND);
    }

    if (!canTransitKycStatus(kyc.kycStatus, 'rejected')) {
      throw new Error(KycErrors.KYC_STATUS_INVALID);
    }

    const updated = await this.kycRepository.updateStatus({
      kycId,
      fromStatus: kyc.kycStatus,
      toStatus: 'rejected',
      reviewerId: dto.reviewer_id,
      reviewNote: dto.review_note
    });

    return {
      kyc_id: updated.id,
      user_id: updated.userId,
      kyc_status: updated.kycStatus,
      rejected_at: updated.rejectedAt,
      review_note: updated.reviewNote
    };
  }

  async manualReview(kycId: string, reviewerId: string, reviewNote?: string) {
    const kyc = await this.kycRepository.findById(kycId);

    if (!kyc) {
      throw new Error(KycErrors.KYC_NOT_FOUND);
    }

    if (!canTransitKycStatus(kyc.kycStatus, 'manual_review')) {
      throw new Error(KycErrors.KYC_STATUS_INVALID);
    }

    const updated = await this.kycRepository.updateStatus({
      kycId,
      fromStatus: kyc.kycStatus,
      toStatus: 'manual_review',
      reviewerId,
      reviewNote
    });

    return {
      kyc_id: updated.id,
      kyc_status: updated.kycStatus
    };
  }
}
```



---



# 11\. KYC User Controller



`apps/kyc-service/src/modules/kyc/kyc.controller.ts`



```TypeScript
import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { KycService } from './kyc.service';
import { SubmitKycDto } from './dto/submit-kyc.dto';

@Controller('kyc')
export class KycController {
  constructor(private readonly kycService: KycService) {}

  @Post('submit')
  submit(@Body() dto: SubmitKycDto) {
    return this.kycService.submit(dto);
  }

  @Get('users/:user_id/status')
  getStatus(@Param('user_id') userId: string) {
    return this.kycService.getLatestByUserId(userId);
  }
}
```



---



# 12\. KYC Admin Controller



`apps/kyc-service/src/modules/kyc/kyc.admin.controller.ts`



```TypeScript
import { Body, Controller, Param, Post } from '@nestjs/common';
import { KycService } from './kyc.service';
import { ApproveKycDto } from './dto/approve-kyc.dto';
import { RejectKycDto } from './dto/reject-kyc.dto';

@Controller('admin/kyc')
export class KycAdminController {
  constructor(private readonly kycService: KycService) {}

  @Post(':kyc_id/approve')
  approve(@Param('kyc_id') kycId: string, @Body() dto: ApproveKycDto) {
    return this.kycService.approve(kycId, dto);
  }

  @Post(':kyc_id/reject')
  reject(@Param('kyc_id') kycId: string, @Body() dto: RejectKycDto) {
    return this.kycService.reject(kycId, dto);
  }

  @Post(':kyc_id/manual-review')
  manualReview(
    @Param('kyc_id') kycId: string,
    @Body() dto: { reviewer_id: string; review_note?: string }
  ) {
    return this.kycService.manualReview(
      kycId,
      dto.reviewer_id,
      dto.review_note
    );
  }
}
```



---



# 13\. KYC Module



`apps/kyc-service/src/modules/kyc/kyc.module.ts`



```TypeScript
import { Module } from '@nestjs/common';
import { KycController } from './kyc.controller';
import { KycAdminController } from './kyc.admin.controller';
import { KycService } from './kyc.service';
import { KycRepository } from './kyc.repository';

@Module({
  controllers: [KycController, KycAdminController],
  providers: [KycService, KycRepository],
  exports: [KycService]
})
export class KycModule {}
```



---



# 14\. Submit KYB DTO



`apps/kyc-service/src/modules/kyb/dto/submit-kyb.dto.ts`



```TypeScript
import { IsOptional, IsString } from 'class-validator';

export class SubmitKybDto {
  @IsString()
  user_id!: string;

  @IsString()
  company_name!: string;

  @IsString()
  registration_country!: string;

  @IsOptional()
  @IsString()
  registration_number_hash?: string;

  @IsOptional()
  @IsString()
  company_address?: string;

  @IsOptional()
  beneficial_owner_info?: Record;

  @IsOptional()
  @IsString()
  business_license_url?: string;

  @IsOptional()
  tax_info?: Record;

  @IsOptional()
  @IsString()
  provider?: string;
}
```



---



# 15\. Approve KYB DTO



`apps/kyc-service/src/modules/kyb/dto/approve-kyb.dto.ts`



```TypeScript
import { IsOptional, IsString } from 'class-validator';

export class ApproveKybDto {
  @IsString()
  reviewer_id!: string;

  @IsOptional()
  @IsString()
  review_note?: string;
}
```



---



# 16\. Reject KYB DTO



`apps/kyc-service/src/modules/kyb/dto/reject-kyb.dto.ts`



```TypeScript
import { IsString } from 'class-validator';

export class RejectKybDto {
  @IsString()
  reviewer_id!: string;

  @IsString()
  review_note!: string;
}
```



---



# 17\. KYB Repository



`apps/kyc-service/src/modules/kyb/kyb.repository.ts`



```TypeScript
import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { ulid } from 'ulid';

const prisma = new PrismaClient();

@Injectable()
export class KybRepository {
  findLatestByUserId(userId: string) {
    return prisma.userKyb.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });
  }

  findById(kybId: string) {
    return prisma.userKyb.findUnique({
      where: { id: kybId }
    });
  }

  create(data: {
    userId: string;
    companyName: string;
    registrationCountry: string;
    registrationNumberHash?: string;
    companyAddress?: string;
    beneficialOwnerInfo?: Record;
    businessLicenseUrl?: string;
    taxInfo?: Record;
    provider?: string;
  }) {
    return prisma.userKyb.create({
      data: {
        id: ulid(),
        userId: data.userId,
        companyName: data.companyName,
        registrationCountry: data.registrationCountry,
        registrationNumberHash: data.registrationNumberHash,
        companyAddress: data.companyAddress,
        beneficialOwnerInfo: data.beneficialOwnerInfo,
        businessLicenseUrl: data.businessLicenseUrl,
        taxInfo: data.taxInfo,
        provider: data.provider,
        kybStatus: 'pending',
        submittedAt: new Date()
      }
    });
  }

  updateStatus(params: {
    kybId: string;
    fromStatus?: string;
    toStatus: string;
    reviewerId?: string;
    reviewNote?: string;
  }) {
    const now = new Date();

    return prisma.$transaction(async (tx) => {
      const updated = await tx.userKyb.update({
        where: { id: params.kybId },
        data: {
          kybStatus: params.toStatus,
          reviewerId: params.reviewerId,
          reviewNote: params.reviewNote,
          approvedAt: params.toStatus === 'approved' ? now : undefined,
          rejectedAt: params.toStatus === 'rejected' ? now : undefined,
          expiredAt: params.toStatus === 'expired' ? now : undefined
        }
      });

      await tx.kycReviewLog.create({
        data: {
          id: ulid(),
          targetType: 'kyb',
          targetId: params.kybId,
          fromStatus: params.fromStatus,
          toStatus: params.toStatus,
          reviewerId: params.reviewerId,
          reviewNote: params.reviewNote
        }
      });

      return updated;
    });
  }
}
```



---



# 18\. KYB Service



`apps/kyc-service/src/modules/kyb/kyb.service.ts`



```TypeScript
import { Injectable } from '@nestjs/common';
import { KybRepository } from './kyb.repository';
import { SubmitKybDto } from './dto/submit-kyb.dto';
import { ApproveKybDto } from './dto/approve-kyb.dto';
import { RejectKybDto } from './dto/reject-kyb.dto';
import { KycErrors } from '../../shared/kyc-errors';
import { canTransitKycStatus } from '../../shared/kyc-status';

@Injectable()
export class KybService {
  constructor(private readonly kybRepository: KybRepository) {}

  async submit(dto: SubmitKybDto) {
    const latest = await this.kybRepository.findLatestByUserId(dto.user_id);

    if (latest && ['pending', 'manual_review', 'approved'].includes(latest.kybStatus)) {
      throw new Error(KycErrors.KYB_ALREADY_SUBMITTED);
    }

    if (!dto.business_license_url && !dto.registration_number_hash) {
      throw new Error(KycErrors.KYB_DOCUMENT_REQUIRED);
    }

    const kyb = await this.kybRepository.create({
      userId: dto.user_id,
      companyName: dto.company_name,
      registrationCountry: dto.registration_country,
      registrationNumberHash: dto.registration_number_hash,
      companyAddress: dto.company_address,
      beneficialOwnerInfo: dto.beneficial_owner_info,
      businessLicenseUrl: dto.business_license_url,
      taxInfo: dto.tax_info,
      provider: dto.provider
    });

    return {
      kyb_id: kyb.id,
      user_id: kyb.userId,
      kyb_status: kyb.kybStatus,
      submitted_at: kyb.submittedAt
    };
  }

  async getLatestByUserId(userId: string) {
    const kyb = await this.kybRepository.findLatestByUserId(userId);

    if (!kyb) {
      return {
        user_id: userId,
        kyb_status: 'not_submitted'
      };
    }

    return {
      kyb_id: kyb.id,
      user_id: kyb.userId,
      company_name: kyb.companyName,
      registration_country: kyb.registrationCountry,
      kyb_status: kyb.kybStatus,
      submitted_at: kyb.submittedAt,
      approved_at: kyb.approvedAt,
      rejected_at: kyb.rejectedAt
    };
  }

  async approve(kybId: string, dto: ApproveKybDto) {
    const kyb = await this.kybRepository.findById(kybId);

    if (!kyb) {
      throw new Error(KycErrors.KYB_NOT_FOUND);
    }

    if (!canTransitKycStatus(kyb.kybStatus, 'approved')) {
      throw new Error(KycErrors.KYB_STATUS_INVALID);
    }

    const updated = await this.kybRepository.updateStatus({
      kybId,
      fromStatus: kyb.kybStatus,
      toStatus: 'approved',
      reviewerId: dto.reviewer_id,
      reviewNote: dto.review_note
    });

    return {
      kyb_id: updated.id,
      user_id: updated.userId,
      kyb_status: updated.kybStatus,
      approved_at: updated.approvedAt
    };
  }

  async reject(kybId: string, dto: RejectKybDto) {
    const kyb = await this.kybRepository.findById(kybId);

    if (!kyb) {
      throw new Error(KycErrors.KYB_NOT_FOUND);
    }

    if (!canTransitKycStatus(kyb.kybStatus, 'rejected')) {
      throw new Error(KycErrors.KYB_STATUS_INVALID);
    }

    const updated = await this.kybRepository.updateStatus({
      kybId,
      fromStatus: kyb.kybStatus,
      toStatus: 'rejected',
      reviewerId: dto.reviewer_id,
      reviewNote: dto.review_note
    });

    return {
      kyb_id: updated.id,
      user_id: updated.userId,
      kyb_status: updated.kybStatus,
      rejected_at: updated.rejectedAt,
      review_note: updated.reviewNote
    };
  }
}
```



---



# 19\. KYB User Controller



`apps/kyc-service/src/modules/kyb/kyb.controller.ts`



```TypeScript
import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { KybService } from './kyb.service';
import { SubmitKybDto } from './dto/submit-kyb.dto';

@Controller('kyb')
export class KybController {
  constructor(private readonly kybService: KybService) {}

  @Post('submit')
  submit(@Body() dto: SubmitKybDto) {
    return this.kybService.submit(dto);
  }

  @Get('users/:user_id/status')
  getStatus(@Param('user_id') userId: string) {
    return this.kybService.getLatestByUserId(userId);
  }
}
```



---



# 20\. KYB Admin Controller



`apps/kyc-service/src/modules/kyb/kyb.admin.controller.ts`



```TypeScript
import { Body, Controller, Param, Post } from '@nestjs/common';
import { KybService } from './kyb.service';
import { ApproveKybDto } from './dto/approve-kyb.dto';
import { RejectKybDto } from './dto/reject-kyb.dto';

@Controller('admin/kyb')
export class KybAdminController {
  constructor(private readonly kybService: KybService) {}

  @Post(':kyb_id/approve')
  approve(@Param('kyb_id') kybId: string, @Body() dto: ApproveKybDto) {
    return this.kybService.approve(kybId, dto);
  }

  @Post(':kyb_id/reject')
  reject(@Param('kyb_id') kybId: string, @Body() dto: RejectKybDto) {
    return this.kybService.reject(kybId, dto);
  }
}
```



---



# 21\. KYB Module



`apps/kyc-service/src/modules/kyb/kyb.module.ts`



```TypeScript
import { Module } from '@nestjs/common';
import { KybController } from './kyb.controller';
import { KybAdminController } from './kyb.admin.controller';
import { KybService } from './kyb.service';
import { KybRepository } from './kyb.repository';

@Module({
  controllers: [KybController, KybAdminController],
  providers: [KybService, KybRepository],
  exports: [KybService]
})
export class KybModule {}
```



---



# 22\. KYC Service App Module



`apps/kyc-service/src/app.module.ts`



```TypeScript
import { Module } from '@nestjs/common';
import { HealthModule } from './health/health.module';
import { KycModule } from './modules/kyc/kyc.module';
import { KybModule } from './modules/kyb/kyb.module';

@Module({
  imports: [
    HealthModule,
    KycModule,
    KybModule
  ]
})
export class AppModule {}
```



---



# 23\. KYC Service 已完成能力



这一版完成后，KYC Service 已具备：



```Plain Text
个人 KYC 提交
个人 KYC 状态查询
后台 KYC 审核通过
后台 KYC 拒绝
后台 KYC 转人工复核
企业 KYB 提交
企业 KYB 状态查询
后台 KYB 审核通过
后台 KYB 拒绝
KYC / KYB 审核日志
KYC / KYB 状态机
```



---



# 24\. 需要马上补强的工业级能力



下一轮基础库完成后，这个服务必须补：



```Plain Text
统一 AppException
Admin JWT 权限校验
审批流接入
KYC 文件短期签名 URL
KYC 文件访问审计
KYC 第三方服务回调
KYC / KYB 结果同步 Identity Service 用户状态
Outbox 事件写入
Risk Service 风控检查
Audit Service 审计日志
```



---



# 25\. 下一步继续



按 23 个 Service 顺序，下一步写：



```Plain Text
3. Product Service 商品服务
```



Product Service 第一版会包含：



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
福建老酒 369 标准权益包初始化
AEP 商品初始化
```



需要补充数据库：



```Plain Text
products
product_versions
product_benefits
product_rule_bindings
product_region_rules
product_inventory
```



