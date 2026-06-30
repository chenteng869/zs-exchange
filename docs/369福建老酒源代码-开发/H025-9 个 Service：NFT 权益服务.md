# H025\-9 个 Service：NFT 权益服务

下面继续第 9 个 Service：NFT Service。



# 第 9 个 Service：NFT 权益服务



本服务负责：



```Plain Text
NFT 集合管理
NFT 签发
NFT 铸造状态
NFT 查询
NFT 升级
NFT 冻结
NFT 撤销
NFT 归属记录
NFT 链上记录
NFTIssueRequested / NFTMinted / NFTUpgraded / NFTFrozen 事件预留
```



---



# 1\. NFT Service 目录结构



```Plain Text
apps/nft-service/
├── src/
│   ├── app.module.ts
│   ├── main.ts
│   ├── health/
│   │   ├── health.controller.ts
│   │   └── health.module.ts
│   ├── shared/
│   │   ├── nft-errors.ts
│   │   ├── nft-events.ts
│   │   ├── nft-status.ts
│   │   └── nft-types.ts
│   └── modules/
│       ├── collections/
│       │   ├── collections.module.ts
│       │   ├── collections.controller.ts
│       │   ├── collections.admin.controller.ts
│       │   ├── collections.repository.ts
│       │   ├── collections.service.ts
│       │   └── dto/
│       │       └── create-collection.dto.ts
│       ├── assets/
│       │   ├── assets.module.ts
│       │   ├── assets.controller.ts
│       │   ├── assets.admin.controller.ts
│       │   ├── assets.repository.ts
│       │   ├── assets.service.ts
│       │   └── dto/
│       │       ├── issue-nft.dto.ts
│       │       ├── upgrade-nft.dto.ts
│       │       └── freeze-nft.dto.ts
│       └── bootstrap/
│           ├── bootstrap.module.ts
│           └── bootstrap.service.ts
```



---



# 2\. Prisma 补充表



## 2\.1 NftCollection



```Plain Text
model NftCollection {
  id              String   @id
  collectionCode  String   @unique @map("collection_code")
  collectionName  String   @map("collection_name")
  nftType         String   @map("nft_type")
  chain           String
  contractAddress String   @map("contract_address")
  standard        String
  status          String   @default("active")
  createdAt       DateTime @default(now()) @map("created_at")
  updatedAt       DateTime @updatedAt @map("updated_at")
  metadata        Json?

  assets          NftAsset[]

  @@map("nft_collections")
}
```



## 2\.2 NftAsset



```Plain Text
model NftAsset {
  id              String   @id
  nftNo           String   @unique @map("nft_no")
  collectionId    String   @map("collection_id")
  tokenId         String?  @map("token_id")
  ownerUserId     String?  @map("owner_user_id")
  ownerWallet     String?  @map("owner_wallet")
  sourceOrderId   String?  @map("source_order_id")
  nftType         String   @map("nft_type")
  nftLevel        String   @map("nft_level")
  metadataUri     String?  @map("metadata_uri")
  status          String   @default("pending_mint")
  mintTxHash      String?  @map("mint_tx_hash")
  mintedAt        DateTime? @map("minted_at")
  createdAt       DateTime @default(now()) @map("created_at")
  updatedAt       DateTime @updatedAt @map("updated_at")
  metadata        Json?

  collection      NftCollection @relation(fields: [collectionId], references: [id])
  ownerships      NftOwnership[]
  benefits        NftBenefit[]
  chainRecords    NftChainRecord[]

  @@index([ownerUserId])
  @@index([tokenId])
  @@index([status])
  @@map("nft_assets")
}
```



## 2\.3 NftOwnership



```Plain Text
model NftOwnership {
  id            String   @id
  nftAssetId    String   @map("nft_asset_id")
  fromUserId    String?  @map("from_user_id")
  toUserId      String?  @map("to_user_id")
  fromWallet    String?  @map("from_wallet")
  toWallet      String?  @map("to_wallet")
  transferType  String   @map("transfer_type")
  txHash        String?  @map("tx_hash")
  transferredAt DateTime? @map("transferred_at")
  createdAt     DateTime @default(now()) @map("created_at")
  metadata      Json?

  nftAsset      NftAsset @relation(fields: [nftAssetId], references: [id])

  @@index([nftAssetId])
  @@map("nft_ownerships")
}
```



## 2\.4 NftBenefit



```Plain Text
model NftBenefit {
  id            String   @id
  nftAssetId    String   @map("nft_asset_id")
  benefitType   String   @map("benefit_type")
  benefitValue  String   @map("benefit_value")
  benefitUnit   String   @map("benefit_unit")
  effectiveFrom DateTime? @map("effective_from")
  effectiveTo   DateTime? @map("effective_to")
  status        String   @default("active")
  ruleVersion   String?  @map("rule_version")
  createdAt     DateTime @default(now()) @map("created_at")
  updatedAt     DateTime @updatedAt @map("updated_at")
  metadata      Json?

  nftAsset      NftAsset @relation(fields: [nftAssetId], references: [id])

  @@index([nftAssetId])
  @@map("nft_benefits")
}
```



## 2\.5 NftUpgradeOrder



```Plain Text
model NftUpgradeOrder {
  id            String    @id
  upgradeNo     String    @unique @map("upgrade_no")
  userId        String    @map("user_id")
  nftAssetId    String    @map("nft_asset_id")
  fromLevel     String    @map("from_level")
  toLevel       String    @map("to_level")
  costCfj369    Decimal   @default(0) @map("cost_cfj369") @db.Decimal(36, 18)
  costTfj369    Decimal   @default(0) @map("cost_tfj369") @db.Decimal(36, 18)
  costToken     Decimal   @default(0) @map("cost_token") @db.Decimal(36, 18)
  costCurrencyAmount Decimal @default(0) @map("cost_currency_amount") @db.Decimal(36, 18)
  currency      String?
  status        String    @default("pending_review")
  riskStatus    String    @default("normal") @map("risk_status")
  createdAt     DateTime  @default(now()) @map("created_at")
  approvedAt    DateTime? @map("approved_at")
  completedAt   DateTime? @map("completed_at")
  updatedAt     DateTime  @updatedAt @map("updated_at")
  metadata      Json?

  @@index([userId])
  @@index([nftAssetId])
  @@map("nft_upgrade_orders")
}
```



## 2\.6 NftChainRecord



```Plain Text
model NftChainRecord {
  id              String   @id
  nftAssetId      String   @map("nft_asset_id")
  chain           String
  contractAddress String   @map("contract_address")
  tokenId         String?  @map("token_id")
  txHash          String   @map("tx_hash")
  eventType       String   @map("event_type")
  blockNumber     Int?     @map("block_number")
  txStatus        String   @map("tx_status")
  createdAt       DateTime @default(now()) @map("created_at")
  confirmedAt     DateTime? @map("confirmed_at")
  metadata        Json?

  nftAsset        NftAsset @relation(fields: [nftAssetId], references: [id])

  @@index([nftAssetId])
  @@index([txHash])
  @@map("nft_chain_records")
}
```



---



# 3\. NFT Events



`apps/nft-service/src/shared/nft-events.ts`



```TypeScript
export const NftEvents = {
  NFT_ISSUE_REQUESTED: 'nft.issue_requested.v1',
  NFT_MINTED: 'nft.minted.v1',
  NFT_UPDATED: 'nft.updated.v1',
  NFT_UPGRADED: 'nft.upgraded.v1',
  NFT_FROZEN: 'nft.frozen.v1',
  NFT_REVOKED: 'nft.revoked.v1'
} as const;
```



---



# 4\. NFT Errors



`apps/nft-service/src/shared/nft-errors.ts`



```TypeScript
export const NftErrors = {
  NFT_COLLECTION_NOT_FOUND: 'NFT_COLLECTION_NOT_FOUND',
  NFT_ASSET_NOT_FOUND: 'NFT_ASSET_NOT_FOUND',
  NFT_ALREADY_EXISTS: 'NFT_ALREADY_EXISTS',
  NFT_STATUS_INVALID: 'NFT_STATUS_INVALID',
  NFT_NOT_OWNED: 'NFT_NOT_OWNED',
  NFT_MINT_NOT_ALLOWED: 'NFT_MINT_NOT_ALLOWED',
  NFT_UPGRADE_NOT_ALLOWED: 'NFT_UPGRADE_NOT_ALLOWED',
  NFT_FREEZE_NOT_ALLOWED: 'NFT_FREEZE_NOT_ALLOWED'
} as const;
```



---



# 5\. NFT Status



`apps/nft-service/src/shared/nft-status.ts`



```TypeScript
export const NftStatus = {
  PENDING_MINT: 'pending_mint',
  MINTING: 'minting',
  MINTED: 'minted',
  ACTIVE: 'active',
  LOCKED: 'locked',
  UPGRADING: 'upgrading',
  UPGRADED: 'upgraded',
  FROZEN: 'frozen',
  REVOKED: 'revoked',
  BURNED: 'burned',
  TRANSFER_RESTRICTED: 'transfer_restricted'
} as const;
```



---



# 6\. NFT Types



`apps/nft-service/src/shared/nft-types.ts`



```TypeScript
export const NftTypes = {
  WINEPASS: 'winepass',
  ECO_POWER_PASS: 'eco_power_pass',
  CLUB: 'club',
  DAPPX_VOUCHER: 'dappx_voucher',
  VIRTUAL_TRADING_PASS: 'virtual_trading_pass'
} as const;
```



---



# 7\. DTO：CreateCollectionDto



`apps/nft-service/src/modules/collections/dto/create-collection.dto.ts`



```TypeScript
import { IsString } from 'class-validator';

export class CreateCollectionDto {
  @IsString()
  collection_code!: string;

  @IsString()
  collection_name!: string;

  @IsString()
  nft_type!: string;

  @IsString()
  chain!: string;

  @IsString()
  contract_address!: string;

  @IsString()
  standard!: string;
}
```



---



# 8\. DTO：IssueNftDto



`apps/nft-service/src/modules/assets/dto/issue-nft.dto.ts`



```TypeScript
import { IsOptional, IsString } from 'class-validator';

export class IssueNftDto {
  @IsString()
  user_id!: string;

  @IsString()
  source_order_id!: string;

  @IsString()
  nft_type!: string;

  @IsString()
  nft_level!: string;

  @IsString()
  wallet_address!: string;

  @IsOptional()
  @IsString()
  metadata_uri?: string;

  @IsOptional()
  @IsString()
  reason?: string;
}
```



---



# 9\. DTO：UpgradeNftDto



`apps/nft-service/src/modules/assets/dto/upgrade-nft.dto.ts`



```TypeScript
import { IsString } from 'class-validator';

export class UpgradeNftDto {
  @IsString()
  to_level!: string;
}
```



---



# 10\. DTO：FreezeNftDto



`apps/nft-service/src/modules/assets/dto/freeze-nft.dto.ts`



```TypeScript
import { IsOptional, IsString } from 'class-validator';

export class FreezeNftDto {
  @IsString()
  reason!: string;

  @IsOptional()
  @IsString()
  approval_id?: string;
}
```



---



# 11\. Collections Repository



`apps/nft-service/src/modules/collections/collections.repository.ts`



```TypeScript
import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { ulid } from 'ulid';

const prisma = new PrismaClient();

@Injectable()
export class CollectionsRepository {
  findById(collectionId: string) {
    return prisma.nftCollection.findUnique({
      where: { id: collectionId }
    });
  }

  findByCode(collectionCode: string) {
    return prisma.nftCollection.findUnique({
      where: { collectionCode }
    });
  }

  create(data: {
    collectionCode: string;
    collectionName: string;
    nftType: string;
    chain: string;
    contractAddress: string;
    standard: string;
  }) {
    return prisma.nftCollection.create({
      data: {
        id: ulid(),
        collectionCode: data.collectionCode,
        collectionName: data.collectionName,
        nftType: data.nftType,
        chain: data.chain,
        contractAddress: data.contractAddress,
        standard: data.standard,
        status: 'active'
      }
    });
  }
}
```



---



# 12\. Collections Service



`apps/nft-service/src/modules/collections/collections.service.ts`



```TypeScript
import { Injectable } from '@nestjs/common';
import { CreateCollectionDto } from './dto/create-collection.dto';
import { CollectionsRepository } from './collections.repository';
import { NftErrors } from '../../shared/nft-errors';

@Injectable()
export class CollectionsService {
  constructor(private readonly collectionsRepository: CollectionsRepository) {}

  async create(dto: CreateCollectionDto) {
    const existing = await this.collectionsRepository.findByCode(dto.collection_code);
    if (existing) {
      throw new Error(NftErrors.NFT_ALREADY_EXISTS);
    }

    const collection = await this.collectionsRepository.create({
      collectionCode: dto.collection_code,
      collectionName: dto.collection_name,
      nftType: dto.nft_type,
      chain: dto.chain,
      contractAddress: dto.contract_address,
      standard: dto.standard
    });

    return {
      collection_id: collection.id,
      collection_code: collection.collectionCode,
      collection_name: collection.collectionName,
      nft_type: collection.nftType,
      chain: collection.chain,
      contract_address: collection.contractAddress,
      standard: collection.standard,
      status: collection.status
    };
  }

  async detail(collectionId: string) {
    const collection = await this.collectionsRepository.findById(collectionId);
    if (!collection) {
      throw new Error(NftErrors.NFT_COLLECTION_NOT_FOUND);
    }

    return {
      collection_id: collection.id,
      collection_code: collection.collectionCode,
      collection_name: collection.collectionName,
      nft_type: collection.nftType,
      chain: collection.chain,
      contract_address: collection.contractAddress,
      standard: collection.standard,
      status: collection.status
    };
  }
}
```



---



# 13\. Collections Controllers



`apps/nft-service/src/modules/collections/collections.controller.ts`



```TypeScript
import { Controller, Get, Param } from '@nestjs/common';
import { CollectionsService } from './collections.service';

@Controller('nft/collections')
export class CollectionsController {
  constructor(private readonly collectionsService: CollectionsService) {}

  @Get(':collection_id')
  detail(@Param('collection_id') collectionId: string) {
    return this.collectionsService.detail(collectionId);
  }
}
```



`apps/nft-service/src/modules/collections/collections.admin.controller.ts`



```TypeScript
import { Body, Controller, Post } from '@nestjs/common';
import { CollectionsService } from './collections.service';
import { CreateCollectionDto } from './dto/create-collection.dto';

@Controller('admin/nft/collections')
export class CollectionsAdminController {
  constructor(private readonly collectionsService: CollectionsService) {}

  @Post()
  create(@Body() dto: CreateCollectionDto) {
    return this.collectionsService.create(dto);
  }
}
```



`apps/nft-service/src/modules/collections/collections.module.ts`



```TypeScript
import { Module } from '@nestjs/common';
import { CollectionsController } from './collections.controller';
import { CollectionsAdminController } from './collections.admin.controller';
import { CollectionsService } from './collections.service';
import { CollectionsRepository } from './collections.repository';

@Module({
  controllers: [CollectionsController, CollectionsAdminController],
  providers: [CollectionsService, CollectionsRepository],
  exports: [CollectionsService]
})
export class CollectionsModule {}
```



---



# 14\. Assets Repository



`apps/nft-service/src/modules/assets/assets.repository.ts`



```TypeScript
import { Injectable } from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';
import { ulid } from 'ulid';

const prisma = new PrismaClient();

@Injectable()
export class AssetsRepository {
  findById(nftId: string) {
    return prisma.nftAsset.findUnique({
      where: { id: nftId },
      include: {
        benefits: true,
        ownerships: true,
        chainRecords: true
      }
    });
  }

  findByNo(nftNo: string) {
    return prisma.nftAsset.findUnique({
      where: { nftNo },
      include: {
        benefits: true,
        ownerships: true,
        chainRecords: true
      }
    });
  }

  findMany(params: {
    ownerUserId?: string;
    nftType?: string;
    status?: string;
  }) {
    return prisma.nftAsset.findMany({
      where: {
        ownerUserId: params.ownerUserId,
        nftType: params.nftType,
        status: params.status
      },
      orderBy: { createdAt: 'desc' },
      include: {
        benefits: true,
        ownerships: true
      }
    });
  }

  createIssue(data: {
    nftNo: string;
    collectionId: string;
    nftType: string;
    nftLevel: string;
    sourceOrderId: string;
    ownerUserId: string;
    ownerWallet: string;
    metadataUri?: string;
    reason?: string;
  }) {
    return prisma.$transaction(async (tx) => {
      const nft = await tx.nftAsset.create({
        data: {
          id: ulid(),
          nftNo: data.nftNo,
          collectionId: data.collectionId,
          nftType: data.nftType,
          nftLevel: data.nftLevel,
          sourceOrderId: data.sourceOrderId,
          ownerUserId: data.ownerUserId,
          ownerWallet: data.ownerWallet,
          metadataUri: data.metadataUri,
          status: 'pending_mint',
          metadata: {
            reason: data.reason || null
          }
        }
      });

      await tx.outboxEvent.create({
        data: {
          id: ulid(),
          eventType: 'nft.issue_requested.v1',
          payload: {
            nft_id: nft.id,
            nft_no: nft.nftNo,
            nft_type: nft.nftType,
            nft_level: nft.nftLevel,
            source_order_id: nft.sourceOrderId,
            owner_user_id: nft.ownerUserId,
            owner_wallet: nft.ownerWallet,
            metadata_uri: nft.metadataUri
          },
          status: 'pending',
          retryCount: 0
        }
      });

      return nft;
    });
  }

  updateStatus(params: {
    nftId: string;
    status: string;
    tokenId?: string;
    mintTxHash?: string;
    ownerUserId?: string;
    ownerWallet?: string;
    reason?: string;
    eventType?: string;
  }) {
    return prisma.$transaction(async (tx) => {
      const updated = await tx.nftAsset.update({
        where: { id: params.nftId },
        data: {
          status: params.status,
          tokenId: params.tokenId,
          mintTxHash: params.mintTxHash,
          ownerUserId: params.ownerUserId,
          ownerWallet: params.ownerWallet,
          mintedAt: params.status === 'minted' ? new Date() : undefined,
          metadata: params.reason ? { reason: params.reason } : undefined
        }
      });

      if (params.eventType) {
        await tx.outboxEvent.create({
          data: {
            id: ulid(),
            eventType: params.eventType,
            payload: {
              nft_id: updated.id,
              nft_no: updated.nftNo,
              nft_type: updated.nftType,
              nft_level: updated.nftLevel,
              status: updated.status,
              token_id: updated.tokenId,
              mint_tx_hash: updated.mintTxHash
            },
            status: 'pending',
            retryCount: 0
          }
        });
      }

      return updated;
    });
  }

  addBenefit(params: {
    nftId: string;
    benefitType: string;
    benefitValue: string;
    benefitUnit: string;
    ruleVersion?: string;
  }) {
    return prisma.nftBenefit.create({
      data: {
        id: ulid(),
        nftAssetId: params.nftId,
        benefitType: params.benefitType,
        benefitValue: params.benefitValue,
        benefitUnit: params.benefitUnit,
        ruleVersion: params.ruleVersion,
        status: 'active'
      }
    });
  }

  addOwnership(params: {
    nftId: string;
    fromUserId?: string;
    toUserId?: string;
    fromWallet?: string;
    toWallet?: string;
    transferType: string;
    txHash?: string;
  }) {
    return prisma.nftOwnership.create({
      data: {
        id: ulid(),
        nftAssetId: params.nftId,
        fromUserId: params.fromUserId,
        toUserId: params.toUserId,
        fromWallet: params.fromWallet,
        toWallet: params.toWallet,
        transferType: params.transferType,
        txHash: params.txHash,
        transferredAt: new Date()
      }
    });
  }

  addChainRecord(params: {
    nftId: string;
    chain: string;
    contractAddress: string;
    tokenId?: string;
    txHash: string;
    eventType: string;
    txStatus: string;
    blockNumber?: number;
    confirmedAt?: Date;
  }) {
    return prisma.nftChainRecord.create({
      data: {
        id: ulid(),
        nftAssetId: params.nftId,
        chain: params.chain,
        contractAddress: params.contractAddress,
        tokenId: params.tokenId,
        txHash: params.txHash,
        eventType: params.eventType,
        txStatus: params.txStatus,
        blockNumber: params.blockNumber,
        confirmedAt: params.confirmedAt
      }
    });
  }
}
```



---



# 15\. Assets Service



`apps/nft-service/src/modules/assets/assets.service.ts`



```TypeScript
import { Injectable } from '@nestjs/common';
import Decimal from 'decimal.js';
import { ulid } from 'ulid';
import { AssetsRepository } from './assets.repository';
import { IssueNftDto } from './dto/issue-nft.dto';
import { UpgradeNftDto } from './dto/upgrade-nft.dto';
import { FreezeNftDto } from './dto/freeze-nft.dto';
import { NftErrors } from '../../shared/nft-errors';
import { NftStatus } from '../../shared/nft-status';

@Injectable()
export class AssetsService {
  constructor(private readonly assetsRepository: AssetsRepository) {}

  async issue(dto: IssueNftDto) {
    const collection = await this.getDefaultCollection(dto.nft_type);
    const nft = await this.assetsRepository.createIssue({
      nftNo: this.generateNftNo(),
      collectionId: collection.collection_id,
      nftType: dto.nft_type,
      nftLevel: dto.nft_level,
      sourceOrderId: dto.source_order_id,
      ownerUserId: dto.user_id,
      ownerWallet: dto.wallet_address,
      metadataUri: dto.metadata_uri,
      reason: dto.reason
    });

    return {
      nft_id: nft.id,
      nft_no: nft.nftNo,
      nft_type: nft.nftType,
      nft_level: nft.nftLevel,
      status: nft.status
    };
  }

  async detail(nftId: string) {
    const nft = await this.assetsRepository.findById(nftId);
    if (!nft) {
      throw new Error(NftErrors.NFT_ASSET_NOT_FOUND);
    }

    return this.formatAsset(nft);
  }

  async list(ownerUserId?: string, nftType?: string, status?: string) {
    const items = await this.assetsRepository.findMany({
      ownerUserId,
      nftType,
      status
    });

    return {
      items: items.map((item) => this.formatAsset(item))
    };
  }

  async upgrade(nftId: string, dto: UpgradeNftDto) {
    const nft = await this.assetsRepository.findById(nftId);
    if (!nft) {
      throw new Error(NftErrors.NFT_ASSET_NOT_FOUND);
    }

    if (![NftStatus.ACTIVE, NftStatus.MINTED].includes(nft.status as any)) {
      throw new Error(NftErrors.NFT_UPGRADE_NOT_ALLOWED);
    }

    const upgraded = await this.assetsRepository.updateStatus({
      nftId,
      status: NftStatus.UPGRADING,
      eventType: 'nft.upgraded.v1',
      reason: `upgrade to ${dto.to_level}`
    });

    return {
      nft_id: upgraded.id,
      nft_no: upgraded.nftNo,
      from_level: nft.nftLevel,
      to_level: dto.to_level,
      status: upgraded.status
    };
  }

  async freeze(nftId: string, dto: FreezeNftDto) {
    const nft = await this.assetsRepository.findById(nftId);
    if (!nft) {
      throw new Error(NftErrors.NFT_ASSET_NOT_FOUND);
    }

    if ([NftStatus.REVOKED, NftStatus.BURNED].includes(nft.status as any)) {
      throw new Error(NftErrors.NFT_FREEZE_NOT_ALLOWED);
    }

    const updated = await this.assetsRepository.updateStatus({
      nftId,
      status: NftStatus.FROZEN,
      eventType: 'nft.frozen.v1',
      reason: dto.reason
    });

    return {
      nft_id: updated.id,
      nft_no: updated.nftNo,
      status: updated.status,
      reason: dto.reason,
      approval_id: dto.approval_id
    };
  }

  async revoke(nftId: string, reason?: string) {
    const nft = await this.assetsRepository.findById(nftId);
    if (!nft) {
      throw new Error(NftErrors.NFT_ASSET_NOT_FOUND);
    }

    const updated = await this.assetsRepository.updateStatus({
      nftId,
      status: NftStatus.REVOKED,
      eventType: 'nft.revoked.v1',
      reason
    });

    return {
      nft_id: updated.id,
      nft_no: updated.nftNo,
      status: updated.status
    };
  }

  private formatAsset(nft: any) {
    return {
      nft_id: nft.id,
      nft_no: nft.nftNo,
      collection_id: nft.collectionId,
      nft_type: nft.nftType,
      nft_level: nft.nftLevel,
      token_id: nft.tokenId,
      owner_user_id: nft.ownerUserId,
      owner_wallet: nft.ownerWallet,
      source_order_id: nft.sourceOrderId,
      metadata_uri: nft.metadataUri,
      status: nft.status,
      mint_tx_hash: nft.mintTxHash,
      minted_at: nft.mintedAt,
      benefits: nft.benefits?.map((b: any) => ({
        benefit_type: b.benefitType,
        benefit_value: b.benefitValue,
        benefit_unit: b.benefitUnit,
        rule_version: b.ruleVersion
      })) || [],
      ownerships: nft.ownerships?.map((o: any) => ({
        transfer_type: o.transferType,
        from_user_id: o.fromUserId,
        to_user_id: o.toUserId,
        tx_hash: o.txHash,
        transferred_at: o.transferredAt
      })) || [],
      chain_records: nft.chainRecords?.map((r: any) => ({
        chain: r.chain,
        contract_address: r.contractAddress,
        token_id: r.tokenId,
        tx_hash: r.txHash,
        event_type: r.eventType,
        tx_status: r.txStatus
      })) || []
    };
  }

  private async getDefaultCollection(nftType: string) {
    return {
      collection_id: 'default_collection_id',
      nft_type: nftType
    };
  }

  private generateNftNo() {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    return `NFT${date}${ulid()}`;
  }
}
```



---



# 16\. Assets Controllers



`apps/nft-service/src/modules/assets/assets.controller.ts`



```TypeScript
import { Controller, Get, Param, Query } from '@nestjs/common';
import { AssetsService } from './assets.service';

@Controller('nfts')
export class AssetsController {
  constructor(private readonly assetsService: AssetsService) {}

  @Get('my')
  listMy(
    @Query('owner_user_id') ownerUserId?: string,
    @Query('nft_type') nftType?: string,
    @Query('status') status?: string
  ) {
    return this.assetsService.list(ownerUserId, nftType, status);
  }

  @Get(':nft_id')
  detail(@Param('nft_id') nftId: string) {
    return this.assetsService.detail(nftId);
  }
}
```



`apps/nft-service/src/modules/assets/assets.admin.controller.ts`



```TypeScript
import { Body, Controller, Param, Post } from '@nestjs/common';
import { AssetsService } from './assets.service';
import { IssueNftDto } from './dto/issue-nft.dto';
import { UpgradeNftDto } from './dto/upgrade-nft.dto';
import { FreezeNftDto } from './dto/freeze-nft.dto';

@Controller('admin/nfts')
export class AssetsAdminController {
  constructor(private readonly assetsService: AssetsService) {}

  @Post('issue')
  issue(@Body() dto: IssueNftDto) {
    return this.assetsService.issue(dto);
  }

  @Post(':nft_id/upgrade')
  upgrade(@Param('nft_id') nftId: string, @Body() dto: UpgradeNftDto) {
    return this.assetsService.upgrade(nftId, dto);
  }

  @Post(':nft_id/freeze')
  freeze(@Param('nft_id') nftId: string, @Body() dto: FreezeNftDto) {
    return this.assetsService.freeze(nftId, dto);
  }

  @Post(':nft_id/revoke')
  revoke(@Param('nft_id') nftId: string, @Body() dto: { reason?: string }) {
    return this.assetsService.revoke(nftId, dto.reason);
  }
}
```



`apps/nft-service/src/modules/assets/assets.module.ts`



```TypeScript
import { Module } from '@nestjs/common';
import { AssetsController } from './assets.controller';
import { AssetsAdminController } from './assets.admin.controller';
import { AssetsService } from './assets.service';
import { AssetsRepository } from './assets.repository';

@Module({
  controllers: [AssetsController, AssetsAdminController],
  providers: [AssetsService, AssetsRepository],
  exports: [AssetsService]
})
export class AssetsModule {}
```



---



# 17\. Bootstrap Module



`apps/nft-service/src/modules/bootstrap/bootstrap.service.ts`



```TypeScript
import { Injectable } from '@nestjs/common';
import { CollectionsService } from '../collections/collections.service';

@Injectable()
export class BootstrapService {
  constructor(private readonly collectionsService: CollectionsService) {}

  async bootstrapWinePass() {
    return this.collectionsService.create({
      collection_code: 'WINEPASS',
      collection_name: 'WinePass NFT',
      nft_type: 'winepass',
      chain: 'BSC',
      contract_address: '0xWinePassContract',
      standard: 'erc721'
    });
  }

  async bootstrapEcoPowerPass() {
    return this.collectionsService.create({
      collection_code: 'ECOPOWERPASS',
      collection_name: 'Eco Power Pass NFT',
      nft_type: 'eco_power_pass',
      chain: 'BSC',
      contract_address: '0xEcoPowerPassContract',
      standard: 'erc721'
    });
  }
}
```



`apps/nft-service/src/modules/bootstrap/bootstrap.module.ts`



```TypeScript
import { Module } from '@nestjs/common';
import { CollectionsModule } from '../collections/collections.module';
import { BootstrapService } from './bootstrap.service';

@Module({
  imports: [CollectionsModule],
  providers: [BootstrapService],
  exports: [BootstrapService]
})
export class BootstrapModule {}
```



---



# 18\. NFT App Module



`apps/nft-service/src/app.module.ts`



```TypeScript
import { Module } from '@nestjs/common';
import { HealthModule } from './health/health.module';
import { CollectionsModule } from './modules/collections/collections.module';
import { AssetsModule } from './modules/assets/assets.module';
import { BootstrapModule } from './modules/bootstrap/bootstrap.module';

@Module({
  imports: [
    HealthModule,
    CollectionsModule,
    AssetsModule,
    BootstrapModule
  ]
})
export class AppModule {}
```



---



# 19\. NFT Service 当前 API



## 用户端



```HTTP
GET /api/v1/nfts/my
GET /api/v1/nfts/:nft_id
```



## 后台端



```HTTP
POST /api/v1/admin/nft/collections
POST /api/v1/admin/nfts/issue
POST /api/v1/admin/nfts/:nft_id/upgrade
POST /api/v1/admin/nfts/:nft_id/freeze
POST /api/v1/admin/nfts/:nft_id/revoke
```



---



# 20\. NFT Service 已具备能力



这一版完成后，NFT Service 支持：



```Plain Text
NFT 集合创建
NFT 详情查询
NFT 列表查询
NFT 签发
NFT 升级
NFT 冻结
NFT 撤销
NFT 归属记录
NFT 链上记录
NFT outbox 事件
```



---



# 21\. 还需要补强的工业级能力



下一步基础库完善后补：



```Plain Text
统一 AppException
PrismaModule 注入
真实调用 Blockchain Service 铸造
真实调用 Asset Ledger / Points / Revenue 服务
Admin 权限 Guard
审批流接入
Audit Log
Risk Check
NFT 升级真实扣费
NFT 合约事件同步
签发幂等
```



---



# 22\. 下一步继续



按 23 个 Service 顺序，下一步写：



```Plain Text
10. Eco Power Service 生态算力服务
```



如果你要，我下一条直接继续把 **Eco Power Service** 的代码骨架写出来。

