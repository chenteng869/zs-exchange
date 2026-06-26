import { BaseRepository, PaginationParams, PaginatedResult } from './base/base.repository';
import { Prisma } from '@prisma/client';

export class NftCategoryRepository extends BaseRepository<
  Prisma.NftCategoryGetPayload<{}>,
  Prisma.NftCategoryCreateInput,
  Prisma.NftCategoryUpdateInput,
  Prisma.NftCategoryWhereInput
> {
  constructor() {
    super('nftCategory');
  }

  async findActiveCategories(): Promise<Prisma.NftCategoryGetPayload<{}>[]> {
    return this.model.findMany({
      where: { status: 'active' },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByChain(chainId: string) {
    return this.model.findMany({
      where: { chainId, status: 'active' },
      orderBy: { createdAt: 'desc' },
    });
  }

  async incrementTotalSupply(categoryId: string) {
    return this.model.update({
      where: { id: categoryId },
      data: { totalSupply: { increment: 1 } },
    });
  }
}

export class NftItemRepository extends BaseRepository<
  Prisma.NftItemGetPayload<{}>,
  Prisma.NftItemCreateInput,
  Prisma.NftItemUpdateInput,
  Prisma.NftItemWhereInput
> {
  constructor() {
    super('nftItem');
  }

  async findByCategory(categoryId: string, pagination: PaginationParams): Promise<PaginatedResult<Prisma.NftItemGetPayload<{}>>> {
    return this.paginate(pagination, { categoryId, status: 'active' } as any, {
      orderBy: { mintedAt: 'desc' as const },
    });
  }

  async findByOwner(ownerId: string, pagination: PaginationParams): Promise<PaginatedResult<Prisma.NftItemGetPayload<{}>>> {
    return this.paginate(pagination, { ownerId, status: 'active' } as any, {
      orderBy: { mintedAt: 'desc' as const },
    });
  }

  async findByTokenId(categoryId: string, tokenId: string) {
    return this.model.findFirst({
      where: { categoryId, tokenId },
    });
  }

  async transfer(id: string, newOwnerId: string) {
    return this.update(id, { ownerId: newOwnerId } as any);
  }

  async mint(categoryId: string, tokenId: string, ownerId: string, metadata: any, imageUrl?: string) {
    return this.model.create({
      data: {
        categoryId,
        tokenId,
        ownerId,
        metadata,
        imageUrl,
        mintedAt: new Date(),
      },
    });
  }
}

export class NftOrderRepository extends BaseRepository<
  Prisma.NftOrderGetPayload<{}>,
  Prisma.NftOrderCreateInput,
  Prisma.NftOrderUpdateInput,
  Prisma.NftOrderWhereInput
> {
  constructor() {
    super('nftOrder');
  }

  async findActiveOrders(itemId: string) {
    return this.model.findMany({
      where: { itemId, status: 'active' },
      orderBy: { price: 'asc' },
    });
  }

  async findBySeller(sellerId: string, pagination: PaginationParams): Promise<PaginatedResult<Prisma.NftOrderGetPayload<{}>>> {
    return this.paginate(pagination, { sellerId } as any, {
      orderBy: { createdAt: 'desc' as const },
    });
  }

  async findByType(type: string, pagination: PaginationParams): Promise<PaginatedResult<Prisma.NftOrderGetPayload<{}>>> {
    return this.paginate(pagination, { type, status: 'active' } as any, {
      orderBy: { createdAt: 'desc' as const },
    });
  }

  async cancelOrder(id: string) {
    return this.update(id, { status: 'cancelled' } as any);
  }

  async fulfillOrder(id: string, buyerId: string) {
    return this.update(id, { buyerId, status: 'completed', completedAt: new Date() } as any);
  }
}

export const nftCategoryRepository = new NftCategoryRepository();
export const nftItemRepository = new NftItemRepository();
export const nftOrderRepository = new NftOrderRepository();
export default nftCategoryRepository;