# H038\-22 个 Service：File Service 文件服务

# 第 22 个 Service：File Service 文件服务



本服务负责：



```Plain Text
文件上传凭证
短期签名 URL
KYC 文件隔离
文件访问审计
文件元数据
文件权限
文件归档
FileUploaded / FileAccessed / SignedUrlCreated 事件预留
```



---



# 1\. File Service 目录结构



```Plain Text
apps/file-service/
├── src/
│   ├── app.module.ts
│   ├── main.ts
│   ├── health/
│   ├── shared/
│   │   ├── file-errors.ts
│   │   ├── file-events.ts
│   │   ├── file-status.ts
│   │   └── file-types.ts
│   └── modules/
│       ├── files/
│       │   ├── files.module.ts
│       │   ├── files.controller.ts
│       │   ├── files.admin.controller.ts
│       │   ├── files.repository.ts
│       │   ├── files.service.ts
│       │   └── dto/
│       │       ├── create-upload-token.dto.ts
│       │       ├── complete-upload.dto.ts
│       │       ├── create-signed-url.dto.ts
│       │       └── query-files.dto.ts
│       ├── permissions/
│       │   ├── permissions.module.ts
│       │   ├── permissions.controller.ts
│       │   ├── permissions.admin.controller.ts
│       │   ├── permissions.repository.ts
│       │   ├── permissions.service.ts
│       │   └── dto/
│       │       ├── grant-file-permission.dto.ts
│       │       └── revoke-file-permission.dto.ts
│       └── access/
│           ├── access.module.ts
│           ├── access.controller.ts
│           ├── access.repository.ts
│           ├── access.service.ts
│           └── dto/
│               └── record-file-access.dto.ts
```



---



# 2\. Prisma 补充表



## 2\.1 FileObject



```Plain Text
model FileObject {
  id             String    @id
  fileNo         String    @unique @map("file_no")
  bucket         String
  objectKey      String    @unique @map("object_key")
  originalName   String?   @map("original_name")
  fileType       String    @map("file_type")
  mimeType       String?   @map("mime_type")
  fileSize       Int?      @map("file_size")
  checksum       String?
  ownerUserId    String?   @map("owner_user_id")
  businessType   String?   @map("business_type")
  businessId     String?   @map("business_id")
  sensitivity    String    @default("internal")
  storageClass   String    @default("standard") @map("storage_class")
  fileStatus     String    @default("pending_upload") @map("file_status")
  uploadedAt     DateTime? @map("uploaded_at")
  archivedAt     DateTime? @map("archived_at")
  createdAt      DateTime  @default(now()) @map("created_at")
  updatedAt      DateTime  @updatedAt @map("updated_at")
  metadata       Json?

  permissions    FilePermission[]
  accessLogs     FileAccessLog[]

  @@index([ownerUserId])
  @@index([businessType, businessId])
  @@index([fileType])
  @@index([fileStatus])
  @@map("file_objects")
}
```



## 2\.2 FilePermission



```Plain Text
model FilePermission {
  id             String    @id
  fileId         String    @map("file_id")
  principalType  String    @map("principal_type")
  principalId    String    @map("principal_id")
  permission     String
  grantedBy      String?   @map("granted_by")
  grantedAt      DateTime  @default(now()) @map("granted_at")
  revokedAt      DateTime? @map("revoked_at")
  status         String    @default("active")
  metadata       Json?

  file           FileObject @relation(fields: [fileId], references: [id])

  @@index([fileId])
  @@index([principalType, principalId])
  @@map("file_permissions")
}
```



## 2\.3 FileAccessLog



```Plain Text
model FileAccessLog {
  id             String   @id
  accessNo       String   @unique @map("access_no")
  fileId         String   @map("file_id")
  accessorType   String   @map("accessor_type")
  accessorId     String?  @map("accessor_id")
  accessAction   String   @map("access_action")
  ipAddress      String?  @map("ip_address")
  deviceId       String?  @map("device_id")
  result         String
  reason         String?
  createdAt      DateTime @default(now()) @map("created_at")
  metadata       Json?

  file           FileObject @relation(fields: [fileId], references: [id])

  @@index([fileId])
  @@index([accessorId])
  @@index([createdAt])
  @@map("file_access_logs")
}
```



## 2\.4 FileSignedUrl



```Plain Text
model FileSignedUrl {
  id             String    @id
  signedUrlNo    String    @unique @map("signed_url_no")
  fileId         String    @map("file_id")
  action         String
  expiresAt      DateTime  @map("expires_at")
  createdBy      String?   @map("created_by")
  usedAt         DateTime? @map("used_at")
  status         String    @default("active")
  createdAt      DateTime  @default(now()) @map("created_at")
  metadata       Json?

  @@index([fileId])
  @@index([status])
  @@map("file_signed_urls")
}
```



---



# 3\. Shared 常量



`apps/file-service/src/shared/file-events.ts`



```TypeScript
export const FileEvents = {
  UPLOAD_TOKEN_CREATED: 'file.upload_token_created.v1',
  FILE_UPLOADED: 'file.uploaded.v1',
  SIGNED_URL_CREATED: 'file.signed_url_created.v1',
  FILE_ACCESSED: 'file.accessed.v1',
  FILE_PERMISSION_GRANTED: 'file.permission_granted.v1',
  FILE_PERMISSION_REVOKED: 'file.permission_revoked.v1',
  FILE_ARCHIVED: 'file.archived.v1'
} as const;
```



`apps/file-service/src/shared/file-errors.ts`



```TypeScript
export const FileErrors = {
  FILE_NOT_FOUND: 'FILE_NOT_FOUND',
  FILE_STATUS_INVALID: 'FILE_STATUS_INVALID',
  FILE_PERMISSION_DENIED: 'FILE_PERMISSION_DENIED',
  FILE_PERMISSION_NOT_FOUND: 'FILE_PERMISSION_NOT_FOUND',
  SIGNED_URL_NOT_FOUND: 'FILE_SIGNED_URL_NOT_FOUND',
  SIGNED_URL_EXPIRED: 'FILE_SIGNED_URL_EXPIRED',
  FILE_TYPE_INVALID: 'FILE_TYPE_INVALID'
} as const;
```



`apps/file-service/src/shared/file-status.ts`



```TypeScript
export const FileStatus = {
  PENDING_UPLOAD: 'pending_upload',
  UPLOADED: 'uploaded',
  ARCHIVED: 'archived',
  DELETED: 'deleted',
  QUARANTINED: 'quarantined'
} as const;

export const FilePermissionStatus = {
  ACTIVE: 'active',
  REVOKED: 'revoked',
  EXPIRED: 'expired'
} as const;

export const SignedUrlStatus = {
  ACTIVE: 'active',
  USED: 'used',
  EXPIRED: 'expired',
  REVOKED: 'revoked'
} as const;
```



`apps/file-service/src/shared/file-types.ts`



```TypeScript
export const FileTypes = {
  KYC_DOCUMENT: 'kyc_document',
  KYB_DOCUMENT: 'kyb_document',
  AVATAR: 'avatar',
  PRODUCT_IMAGE: 'product_image',
  NFT_METADATA: 'nft_metadata',
  CONTRACT: 'contract',
  FINANCE_REPORT: 'finance_report',
  AUDIT_ARCHIVE: 'audit_archive',
  OTHER: 'other'
} as const;

export const FileSensitivities = {
  PUBLIC: 'public',
  INTERNAL: 'internal',
  CONFIDENTIAL: 'confidential',
  RESTRICTED: 'restricted'
} as const;

export const FilePermissions = {
  READ: 'read',
  WRITE: 'write',
  DELETE: 'delete',
  ADMIN: 'admin'
} as const;
```



---



# 4\. Files DTO



`apps/file-service/src/modules/files/dto/create-upload-token.dto.ts`



```TypeScript
import { IsOptional, IsString } from 'class-validator';

export class CreateUploadTokenDto {
  @IsString()
  file_type!: string;

  @IsOptional()
  @IsString()
  original_name?: string;

  @IsOptional()
  @IsString()
  mime_type?: string;

  @IsOptional()
  file_size?: number;

  @IsOptional()
  @IsString()
  owner_user_id?: string;

  @IsOptional()
  @IsString()
  business_type?: string;

  @IsOptional()
  @IsString()
  business_id?: string;

  @IsOptional()
  @IsString()
  sensitivity?: string;
}
```



`apps/file-service/src/modules/files/dto/complete-upload.dto.ts`



```TypeScript
import { IsOptional, IsString } from 'class-validator';

export class CompleteUploadDto {
  @IsString()
  checksum!: string;

  @IsOptional()
  file_size?: number;
}
```



`apps/file-service/src/modules/files/dto/create-signed-url.dto.ts`



```TypeScript
import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreateSignedUrlDto {
  @IsString()
  action!: 'read' | 'write';

  @IsInt()
  @Min(1)
  expires_in_seconds!: number;

  @IsOptional()
  @IsString()
  created_by?: string;
}
```



`apps/file-service/src/modules/files/dto/query-files.dto.ts`



```TypeScript
import { IsOptional, IsString } from 'class-validator';

export class QueryFilesDto {
  @IsOptional()
  @IsString()
  owner_user_id?: string;

  @IsOptional()
  @IsString()
  business_type?: string;

  @IsOptional()
  @IsString()
  business_id?: string;

  @IsOptional()
  @IsString()
  file_type?: string;

  @IsOptional()
  @IsString()
  file_status?: string;

  @IsOptional()
  page?: number;

  @IsOptional()
  page_size?: number;
}
```



---



# 5\. Files Repository / Service



`apps/file-service/src/modules/files/files.repository.ts`



```TypeScript
import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { ulid } from 'ulid';

const prisma = new PrismaClient();

@Injectable()
export class FilesRepository {
  createPending(data: {
    fileNo: string;
    bucket: string;
    objectKey: string;
    originalName?: string;
    fileType: string;
    mimeType?: string;
    fileSize?: number;
    ownerUserId?: string;
    businessType?: string;
    businessId?: string;
    sensitivity: string;
  }) {
    return prisma.$transaction(async (tx) => {
      const file = await tx.fileObject.create({
        data: {
          id: ulid(),
          fileNo: data.fileNo,
          bucket: data.bucket,
          objectKey: data.objectKey,
          originalName: data.originalName,
          fileType: data.fileType,
          mimeType: data.mimeType,
          fileSize: data.fileSize,
          ownerUserId: data.ownerUserId,
          businessType: data.businessType,
          businessId: data.businessId,
          sensitivity: data.sensitivity,
          fileStatus: 'pending_upload'
        }
      });

      await tx.outboxEvent.create({
        data: {
          id: ulid(),
          eventType: 'file.upload_token_created.v1',
          payload: {
            file_id: file.id,
            file_no: file.fileNo,
            bucket: file.bucket,
            object_key: file.objectKey,
            file_type: file.fileType,
            owner_user_id: file.ownerUserId
          },
          status: 'pending',
          retryCount: 0
        }
      });

      return file;
    });
  }

  findById(fileId: string) {
    return prisma.fileObject.findUnique({
      where: { id: fileId },
      include: {
        permissions: true,
        accessLogs: true
      }
    });
  }

  findMany(params: {
    ownerUserId?: string;
    businessType?: string;
    businessId?: string;
    fileType?: string;
    fileStatus?: string;
    page: number;
    pageSize: number;
  }) {
    return prisma.fileObject.findMany({
      where: {
        ownerUserId: params.ownerUserId,
        businessType: params.businessType,
        businessId: params.businessId,
        fileType: params.fileType,
        fileStatus: params.fileStatus
      },
      orderBy: { createdAt: 'desc' },
      skip: (params.page - 1) * params.pageSize,
      take: params.pageSize
    });
  }

  count(params: {
    ownerUserId?: string;
    businessType?: string;
    businessId?: string;
    fileType?: string;
    fileStatus?: string;
  }) {
    return prisma.fileObject.count({
      where: {
        ownerUserId: params.ownerUserId,
        businessType: params.businessType,
        businessId: params.businessId,
        fileType: params.fileType,
        fileStatus: params.fileStatus
      }
    });
  }

  completeUpload(fileId: string, checksum: string, fileSize?: number) {
    return prisma.$transaction(async (tx) => {
      const file = await tx.fileObject.update({
        where: { id: fileId },
        data: {
          checksum,
          fileSize,
          fileStatus: 'uploaded',
          uploadedAt: new Date()
        }
      });

      await tx.outboxEvent.create({
        data: {
          id: ulid(),
          eventType: 'file.uploaded.v1',
          payload: {
            file_id: file.id,
            file_no: file.fileNo,
            bucket: file.bucket,
            object_key: file.objectKey,
            checksum: file.checksum,
            file_size: file.fileSize
          },
          status: 'pending',
          retryCount: 0
        }
      });

      return file;
    });
  }

  createSignedUrl(data: {
    signedUrlNo: string;
    fileId: string;
    action: string;
    expiresAt: Date;
    createdBy?: string;
    url: string;
  }) {
    return prisma.$transaction(async (tx) => {
      const signed = await tx.fileSignedUrl.create({
        data: {
          id: ulid(),
          signedUrlNo: data.signedUrlNo,
          fileId: data.fileId,
          action: data.action,
          expiresAt: data.expiresAt,
          createdBy: data.createdBy,
          status: 'active',
          metadata: {
            url: data.url
          }
        }
      });

      await tx.outboxEvent.create({
        data: {
          id: ulid(),
          eventType: 'file.signed_url_created.v1',
          payload: {
            signed_url_id: signed.id,
            signed_url_no: signed.signedUrlNo,
            file_id: signed.fileId,
            action: signed.action,
            expires_at: signed.expiresAt
          },
          status: 'pending',
          retryCount: 0
        }
      });

      return signed;
    });
  }

  archive(fileId: string, reason?: string) {
    return prisma.fileObject.update({
      where: { id: fileId },
      data: {
        fileStatus: 'archived',
        archivedAt: new Date(),
        metadata: reason ? { reason } : undefined
      }
    });
  }
}
```



`apps/file-service/src/modules/files/files.service.ts`



```TypeScript
import { Injectable } from '@nestjs/common';
import { ulid } from 'ulid';
import { FilesRepository } from './files.repository';
import { CreateUploadTokenDto } from './dto/create-upload-token.dto';
import { CompleteUploadDto } from './dto/complete-upload.dto';
import { CreateSignedUrlDto } from './dto/create-signed-url.dto';
import { QueryFilesDto } from './dto/query-files.dto';
import { FileErrors } from '../../shared/file-errors';
import { FileSensitivities } from '../../shared/file-types';
import { FileStatus } from '../../shared/file-status';

@Injectable()
export class FilesService {
  constructor(private readonly filesRepository: FilesRepository) {}

  async createUploadToken(dto: CreateUploadTokenDto) {
    const bucket = this.resolveBucket(dto.file_type, dto.sensitivity);
    const objectKey = this.generateObjectKey(dto.file_type, dto.original_name);

    const file = await this.filesRepository.createPending({
      fileNo: this.generateFileNo(),
      bucket,
      objectKey,
      originalName: dto.original_name,
      fileType: dto.file_type,
      mimeType: dto.mime_type,
      fileSize: dto.file_size,
      ownerUserId: dto.owner_user_id,
      businessType: dto.business_type,
      businessId: dto.business_id,
      sensitivity: dto.sensitivity || FileSensitivities.INTERNAL
    });

    return {
      file_id: file.id,
      file_no: file.fileNo,
      bucket: file.bucket,
      object_key: file.objectKey,
      upload_url: this.mockSignedStorageUrl(file.bucket, file.objectKey, 'write', 900),
      expires_in_seconds: 900,
      file_status: file.fileStatus
    };
  }

  async completeUpload(fileId: string, dto: CompleteUploadDto) {
    const file = await this.filesRepository.findById(fileId);
    if (!file) throw new Error(FileErrors.FILE_NOT_FOUND);
    if (file.fileStatus !== FileStatus.PENDING_UPLOAD) {
      throw new Error(FileErrors.FILE_STATUS_INVALID);
    }

    const updated = await this.filesRepository.completeUpload(
      fileId,
      dto.checksum,
      dto.file_size
    );

    return this.formatFile(updated);
  }

  async createSignedUrl(fileId: string, dto: CreateSignedUrlDto) {
    const file = await this.filesRepository.findById(fileId);
    if (!file) throw new Error(FileErrors.FILE_NOT_FOUND);
    if (file.fileStatus !== FileStatus.UPLOADED) {
      throw new Error(FileErrors.FILE_STATUS_INVALID);
    }

    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + dto.expires_in_seconds);

    const url = this.mockSignedStorageUrl(
      file.bucket,
      file.objectKey,
      dto.action,
      dto.expires_in_seconds
    );

    const signed = await this.filesRepository.createSignedUrl({
      signedUrlNo: this.generateSignedUrlNo(),
      fileId,
      action: dto.action,
      expiresAt,
      createdBy: dto.created_by,
      url
    });

    return {
      signed_url_id: signed.id,
      signed_url_no: signed.signedUrlNo,
      file_id: signed.fileId,
      action: signed.action,
      signed_url: (signed.metadata as any)?.url,
      expires_at: signed.expiresAt,
      status: signed.status
    };
  }

  async detail(fileId: string) {
    const file = await this.filesRepository.findById(fileId);
    if (!file) throw new Error(FileErrors.FILE_NOT_FOUND);
    return this.formatFile(file);
  }

  async list(query: QueryFilesDto) {
    const page = Number(query.page || 1);
    const pageSize = Math.min(Number(query.page_size || 20), 100);

    const [items, total] = await Promise.all([
      this.filesRepository.findMany({
        ownerUserId: query.owner_user_id,
        businessType: query.business_type,
        businessId: query.business_id,
        fileType: query.file_type,
        fileStatus: query.file_status,
        page,
        pageSize
      }),
      this.filesRepository.count({
        ownerUserId: query.owner_user_id,
        businessType: query.business_type,
        businessId: query.business_id,
        fileType: query.file_type,
        fileStatus: query.file_status
      })
    ]);

    return {
      items: items.map((item) => this.formatFile(item)),
      pagination: {
        page,
        page_size: pageSize,
        total,
        total_pages: Math.ceil(total / pageSize)
      }
    };
  }

  async archive(fileId: string, reason?: string) {
    const file = await this.filesRepository.findById(fileId);
    if (!file) throw new Error(FileErrors.FILE_NOT_FOUND);

    const updated = await this.filesRepository.archive(fileId, reason);
    return this.formatFile(updated);
  }

  private resolveBucket(fileType: string, sensitivity?: string) {
    if (fileType === 'kyc_document' || sensitivity === FileSensitivities.RESTRICTED) {
      return process.env.RESTRICTED_FILE_BUCKET || 'restricted-files';
    }

    if (sensitivity === FileSensitivities.PUBLIC) {
      return process.env.PUBLIC_FILE_BUCKET || 'public-files';
    }

    return process.env.INTERNAL_FILE_BUCKET || 'internal-files';
  }

  private generateObjectKey(fileType: string, originalName?: string) {
    const safeName = (originalName || 'file').replace(/[^a-zA-Z0-9._-]/g, '_');
    const date = new Date().toISOString().slice(0, 10);
    return `${fileType}/${date}/${ulid()}-${safeName}`;
  }

  private mockSignedStorageUrl(bucket: string, objectKey: string, action: string, expires: number) {
    return `https://storage.local/${bucket}/${encodeURIComponent(objectKey)}?action=${action}&expires=${expires}&token=${ulid()}`;
  }

  private formatFile(file: any) {
    return {
      file_id: file.id,
      file_no: file.fileNo,
      bucket: file.bucket,
      object_key: file.objectKey,
      original_name: file.originalName,
      file_type: file.fileType,
      mime_type: file.mimeType,
      file_size: file.fileSize,
      checksum: file.checksum,
      owner_user_id: file.ownerUserId,
      business_type: file.businessType,
      business_id: file.businessId,
      sensitivity: file.sensitivity,
      storage_class: file.storageClass,
      file_status: file.fileStatus,
      uploaded_at: file.uploadedAt,
      archived_at: file.archivedAt
    };
  }

  private generateFileNo() {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    return `FIL${date}${ulid()}`;
  }

  private generateSignedUrlNo() {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    return `FSU${date}${ulid()}`;
  }
}
```



---



# 6\. Files Controllers / Module



`apps/file-service/src/modules/files/files.controller.ts`



```TypeScript
import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { FilesService } from './files.service';
import { CreateUploadTokenDto } from './dto/create-upload-token.dto';
import { CompleteUploadDto } from './dto/complete-upload.dto';
import { CreateSignedUrlDto } from './dto/create-signed-url.dto';
import { QueryFilesDto } from './dto/query-files.dto';

@Controller('files')
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Post('upload-token')
  createUploadToken(@Body() dto: CreateUploadTokenDto) {
    return this.filesService.createUploadToken(dto);
  }

  @Post(':file_id/complete-upload')
  completeUpload(
    @Param('file_id') fileId: string,
    @Body() dto: CompleteUploadDto
  ) {
    return this.filesService.completeUpload(fileId, dto);
  }

  @Post(':file_id/signed-url')
  createSignedUrl(
    @Param('file_id') fileId: string,
    @Body() dto: CreateSignedUrlDto
  ) {
    return this.filesService.createSignedUrl(fileId, dto);
  }

  @Get()
  list(@Query() query: QueryFilesDto) {
    return this.filesService.list(query);
  }

  @Get(':file_id')
  detail(@Param('file_id') fileId: string) {
    return this.filesService.detail(fileId);
  }
}
```



`apps/file-service/src/modules/files/files.admin.controller.ts`



```TypeScript
import { Body, Controller, Param, Post } from '@nestjs/common';
import { FilesService } from './files.service';

@Controller('admin/files')
export class FilesAdminController {
  constructor(private readonly filesService: FilesService) {}

  @Post(':file_id/archive')
  archive(@Param('file_id') fileId: string, @Body() dto: { reason?: string }) {
    return this.filesService.archive(fileId, dto.reason);
  }
}
```



`apps/file-service/src/modules/files/files.module.ts`



```TypeScript
import { Module } from '@nestjs/common';
import { FilesController } from './files.controller';
import { FilesAdminController } from './files.admin.controller';
import { FilesService } from './files.service';
import { FilesRepository } from './files.repository';

@Module({
  controllers: [FilesController, FilesAdminController],
  providers: [FilesService, FilesRepository],
  exports: [FilesService]
})
export class FilesModule {}
```



---



# 7\. Permissions DTO / Repository / Service



`apps/file-service/src/modules/permissions/dto/grant-file-permission.dto.ts`



```TypeScript
import { IsString } from 'class-validator';

export class GrantFilePermissionDto {
  @IsString()
  principal_type!: string;

  @IsString()
  principal_id!: string;

  @IsString()
  permission!: string;

  @IsString()
  granted_by!: string;
}
```



`apps/file-service/src/modules/permissions/dto/revoke-file-permission.dto.ts`



```TypeScript
import { IsString } from 'class-validator';

export class RevokeFilePermissionDto {
  @IsString()
  reason!: string;
}
```



`apps/file-service/src/modules/permissions/permissions.repository.ts`



```TypeScript
import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { ulid } from 'ulid';

const prisma = new PrismaClient();

@Injectable()
export class PermissionsRepository {
  findFile(fileId: string) {
    return prisma.fileObject.findUnique({ where: { id: fileId } });
  }

  grant(data: {
    fileId: string;
    principalType: string;
    principalId: string;
    permission: string;
    grantedBy: string;
  }) {
    return prisma.$transaction(async (tx) => {
      const permission = await tx.filePermission.create({
        data: {
          id: ulid(),
          fileId: data.fileId,
          principalType: data.principalType,
          principalId: data.principalId,
          permission: data.permission,
          grantedBy: data.grantedBy,
          status: 'active'
        }
      });

      await tx.outboxEvent.create({
        data: {
          id: ulid(),
          eventType: 'file.permission_granted.v1',
          payload: {
            permission_id: permission.id,
            file_id: permission.fileId,
            principal_type: permission.principalType,
            principal_id: permission.principalId,
            permission: permission.permission
          },
          status: 'pending',
          retryCount: 0
        }
      });

      return permission;
    });
  }

  findById(permissionId: string) {
    return prisma.filePermission.findUnique({
      where: { id: permissionId }
    });
  }

  revoke(permissionId: string, reason: string) {
    return prisma.$transaction(async (tx) => {
      const permission = await tx.filePermission.update({
        where: { id: permissionId },
        data: {
          status: 'revoked',
          revokedAt: new Date(),
          metadata: { reason }
        }
      });

      await tx.outboxEvent.create({
        data: {
          id: ulid(),
          eventType: 'file.permission_revoked.v1',
          payload: {
            permission_id: permission.id,
            file_id: permission.fileId,
            principal_type: permission.principalType,
            principal_id: permission.principalId
          },
          status: 'pending',
          retryCount: 0
        }
      });

      return permission;
    });
  }
}
```



`apps/file-service/src/modules/permissions/permissions.service.ts`



```TypeScript
import { Injectable } from '@nestjs/common';
import { PermissionsRepository } from './permissions.repository';
import { GrantFilePermissionDto } from './dto/grant-file-permission.dto';
import { RevokeFilePermissionDto } from './dto/revoke-file-permission.dto';
import { FileErrors } from '../../shared/file-errors';
import { FilePermissionStatus } from '../../shared/file-status';

@Injectable()
export class PermissionsService {
  constructor(private readonly permissionsRepository: PermissionsRepository) {}

  async grant(fileId: string, dto: GrantFilePermissionDto) {
    const file = await this.permissionsRepository.findFile(fileId);
    if (!file) throw new Error(FileErrors.FILE_NOT_FOUND);

    const permission = await this.permissionsRepository.grant({
      fileId,
      principalType: dto.principal_type,
      principalId: dto.principal_id,
      permission: dto.permission,
      grantedBy: dto.granted_by
    });

    return this.formatPermission(permission);
  }

  async revoke(permissionId: string, dto: RevokeFilePermissionDto) {
    const permission = await this.permissionsRepository.findById(permissionId);
    if (!permission) throw new Error(FileErrors.FILE_PERMISSION_NOT_FOUND);
    if (permission.status !== FilePermissionStatus.ACTIVE) {
      throw new Error(FileErrors.FILE_STATUS_INVALID);
    }

    const updated = await this.permissionsRepository.revoke(
      permissionId,
      dto.reason
    );

    return this.formatPermission(updated);
  }

  private formatPermission(permission: any) {
    return {
      permission_id: permission.id,
      file_id: permission.fileId,
      principal_type: permission.principalType,
      principal_id: permission.principalId,
      permission: permission.permission,
      granted_by: permission.grantedBy,
      granted_at: permission.grantedAt,
      revoked_at: permission.revokedAt,
      status: permission.status
    };
  }
}
```



---



# 8\. Permissions Controllers / Module



`apps/file-service/src/modules/permissions/permissions.controller.ts`



```TypeScript
import { Body, Controller, Param, Post } from '@nestjs/common';
import { PermissionsService } from './permissions.service';
import { GrantFilePermissionDto } from './dto/grant-file-permission.dto';

@Controller('files')
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Post(':file_id/permissions')
  grant(
    @Param('file_id') fileId: string,
    @Body() dto: GrantFilePermissionDto
  ) {
    return this.permissionsService.grant(fileId, dto);
  }
}
```



`apps/file-service/src/modules/permissions/permissions.admin.controller.ts`



```TypeScript
import { Body, Controller, Param, Post } from '@nestjs/common';
import { PermissionsService } from './permissions.service';
import { RevokeFilePermissionDto } from './dto/revoke-file-permission.dto';

@Controller('admin/files/permissions')
export class PermissionsAdminController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Post(':permission_id/revoke')
  revoke(
    @Param('permission_id') permissionId: string,
    @Body() dto: RevokeFilePermissionDto
  ) {
    return this.permissionsService.revoke(permissionId, dto);
  }
}
```



`apps/file-service/src/modules/permissions/permissions.module.ts`



```TypeScript
import { Module } from '@nestjs/common';
import { PermissionsController } from './permissions.controller';
import { PermissionsAdminController } from './permissions.admin.controller';
import { PermissionsService } from './permissions.service';
import { PermissionsRepository } from './permissions.repository';

@Module({
  controllers: [PermissionsController, PermissionsAdminController],
  providers: [PermissionsService, PermissionsRepository],
  exports: [PermissionsService]
})
export class PermissionsModule {}
```



---



# 9\. Access DTO / Repository / Service



`apps/file-service/src/modules/access/dto/record-file-access.dto.ts`



```TypeScript
import { IsOptional, IsString } from 'class-validator';

export class RecordFileAccessDto {
  @IsString()
  accessor_type!: string;

  @IsOptional()
  @IsString()
  accessor_id?: string;

  @IsString()
  access_action!: string;

  @IsOptional()
  @IsString()
  ip_address?: string;

  @IsOptional()
  @IsString()
  device_id?: string;

  @IsString()
  result!: string;

  @IsOptional()
  @IsString()
  reason?: string;
}
```



`apps/file-service/src/modules/access/access.repository.ts`



```TypeScript
import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { ulid } from 'ulid';

const prisma = new PrismaClient();

@Injectable()
export class AccessRepository {
  findFile(fileId: string) {
    return prisma.fileObject.findUnique({ where: { id: fileId } });
  }

  create(data: {
    accessNo: string;
    fileId: string;
    accessorType: string;
    accessorId?: string;
    accessAction: string;
    ipAddress?: string;
    deviceId?: string;
    result: string;
    reason?: string;
  }) {
    return prisma.$transaction(async (tx) => {
      const log = await tx.fileAccessLog.create({
        data: {
          id: ulid(),
          accessNo: data.accessNo,
          fileId: data.fileId,
          accessorType: data.accessorType,
          accessorId: data.accessorId,
          accessAction: data.accessAction,
          ipAddress: data.ipAddress,
          deviceId: data.deviceId,
          result: data.result,
          reason: data.reason
        }
      });

      await tx.outboxEvent.create({
        data: {
          id: ulid(),
          eventType: 'file.accessed.v1',
          payload: {
            access_id: log.id,
            access_no: log.accessNo,
            file_id: log.fileId,
            accessor_type: log.accessorType,
            accessor_id: log.accessorId,
            access_action: log.accessAction,
            result: log.result
          },
          status: 'pending',
          retryCount: 0
        }
      });

      return log;
    });
  }

  listByFile(fileId: string) {
    return prisma.fileAccessLog.findMany({
      where: { fileId },
      orderBy: { createdAt: 'desc' }
    });
  }
}
```



`apps/file-service/src/modules/access/access.service.ts`



```TypeScript
import { Injectable } from '@nestjs/common';
import { ulid } from 'ulid';
import { AccessRepository } from './access.repository';
import { RecordFileAccessDto } from './dto/record-file-access.dto';
import { FileErrors } from '../../shared/file-errors';

@Injectable()
export class AccessService {
  constructor(private readonly accessRepository: AccessRepository) {}

  async record(fileId: string, dto: RecordFileAccessDto) {
    const file = await this.accessRepository.findFile(fileId);
    if (!file) throw new Error(FileErrors.FILE_NOT_FOUND);

    const log = await this.accessRepository.create({
      accessNo: this.generateAccessNo(),
      fileId,
      accessorType: dto.accessor_type,
      accessorId: dto.accessor_id,
      accessAction: dto.access_action,
      ipAddress: dto.ip_address,
      deviceId: dto.device_id,
      result: dto.result,
      reason: dto.reason
    });

    return this.formatAccessLog(log);
  }

  async listByFile(fileId: string) {
    const file = await this.accessRepository.findFile(fileId);
    if (!file) throw new Error(FileErrors.FILE_NOT_FOUND);

    const items = await this.accessRepository.listByFile(fileId);

    return {
      items: items.map((item) => this.formatAccessLog(item))
    };
  }

  private formatAccessLog(log: any) {
    return {
      access_id: log.id,
      access_no: log.accessNo,
      file_id: log.fileId,
      accessor_type: log.accessorType,
      accessor_id: log.accessorId,
      access_action: log.accessAction,
      ip_address: log.ipAddress,
      device_id: log.deviceId,
      result: log.result,
      reason: log.reason,
      created_at: log.createdAt
    };
  }

  private generateAccessNo() {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    return `FAL${date}${ulid()}`;
  }
}
```



---



# 10\. Access Controller / Module



`apps/file-service/src/modules/access/access.controller.ts`



```TypeScript
import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { AccessService } from './access.service';
import { RecordFileAccessDto } from './dto/record-file-access.dto';

@Controller('files')
export class AccessController {
  constructor(private readonly accessService: AccessService) {}

  @Post(':file_id/access-logs')
  record(@Param('file_id') fileId: string, @Body() dto: RecordFileAccessDto) {
    return this.accessService.record(fileId, dto);
  }

  @Get(':file_id/access-logs')
  listByFile(@Param('file_id') fileId: string) {
    return this.accessService.listByFile(fileId);
  }
}
```



`apps/file-service/src/modules/access/access.module.ts`



```TypeScript
import { Module } from '@nestjs/common';
import { AccessController } from './access.controller';
import { AccessService } from './access.service';
import { AccessRepository } from './access.repository';

@Module({
  controllers: [AccessController],
  providers: [AccessService, AccessRepository],
  exports: [AccessService]
})
export class AccessModule {}
```



---



# 11\. File App Module



`apps/file-service/src/app.module.ts`



```TypeScript
import { Module } from '@nestjs/common';
import { HealthModule } from './health/health.module';
import { FilesModule } from './modules/files/files.module';
import { PermissionsModule } from './modules/permissions/permissions.module';
import { AccessModule } from './modules/access/access.module';

@Module({
  imports: [
    HealthModule,
    FilesModule,
    PermissionsModule,
    AccessModule
  ]
})
export class AppModule {}
```



---



# 12\. File Service 当前 API



## 用户端 / 业务端



```HTTP
POST /api/v1/files/upload-token
POST /api/v1/files/:file_id/complete-upload
POST /api/v1/files/:file_id/signed-url
GET /api/v1/files
GET /api/v1/files/:file_id

POST /api/v1/files/:file_id/permissions
POST /api/v1/files/:file_id/access-logs
GET /api/v1/files/:file_id/access-logs
```



## 后台端



```HTTP
POST /api/v1/admin/files/:file_id/archive
POST /api/v1/admin/files/permissions/:permission_id/revoke
```



---



# 13\. File Service 已具备能力



这一版完成后，File Service 支持：



```Plain Text
创建上传凭证
生成对象存储 key
按敏感等级分桶
完成上传
短期签名 URL
文件列表 / 详情
文件授权
文件权限撤销
文件访问日志
文件归档
File outbox 事件
```



---



# 14\. 后续必须补强



```Plain Text
统一 AppException
PrismaModule 注入
真实 S3 / OSS / MinIO Provider
真实预签名 URL
文件病毒扫描
KYC 文件强隔离
文件访问强鉴权
自动写 Audit Service
生命周期归档
WORM 存储
Admin 权限 Guard
```



---



# 15\. 下一步继续



按 23 个 Service 顺序，下一步写最后一个：



```Plain Text
23. Reporting Service 报表服务
```



下一步会覆盖：



```Plain Text
运营报表
财务报表
税务报表
用户增长
订单 GMV
收益分配
积分 / 算力 / 释放报表
报表任务
报表导出
```



