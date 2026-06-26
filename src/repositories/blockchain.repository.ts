import { BaseRepository, PaginationParams, PaginatedResult } from './base/base.repository';
import { Prisma } from '@prisma/client';

export class BlockchainTransactionRepository extends BaseRepository<
  Prisma.BlockchainTransactionGetPayload<{}>,
  Prisma.BlockchainTransactionCreateInput,
  Prisma.BlockchainTransactionUpdateInput,
  Prisma.BlockchainTransactionWhereInput
> {
  constructor() {
    super('blockchainTransaction');
  }

  async findByTxHash(txHash: string) {
    return this.model.findUnique({ where: { txHash } });
  }

  async findByChain(chainId: string, pagination: PaginationParams): Promise<PaginatedResult<Prisma.BlockchainTransactionGetPayload<{}>>> {
    return this.paginate(pagination, { chainId } as any, {
      orderBy: { createdAt: 'desc' as const },
    });
  }

  async findByAddress(address: string, chainId?: string) {
    const where: any = {
      OR: [{ fromAddress: address }, { toAddress: address }],
    };
    if (chainId) where.chainId = chainId;

    return this.model.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  async findPending(chainId?: string) {
    const where: any = { status: 'pending' };
    if (chainId) where.chainId = chainId;

    return this.model.findMany({
      where,
      orderBy: { createdAt: 'asc' },
    });
  }

  async updateStatus(txHash: string, status: string, blockNumber?: string, confirmedAt?: Date) {
    const data: any = { status };
    if (blockNumber) data.blockNumber = blockNumber;
    if (confirmedAt) data.confirmedAt = confirmedAt;

    return this.model.update({
      where: { txHash },
      data,
    });
  }
}

export class BlockchainContractRepository extends BaseRepository<
  Prisma.BlockchainContractGetPayload<{}>,
  Prisma.BlockchainContractCreateInput,
  Prisma.BlockchainContractUpdateInput,
  Prisma.BlockchainContractWhereInput
> {
  constructor() {
    super('blockchainContract');
  }

  async findByAddress(address: string) {
    return this.model.findUnique({ where: { address } });
  }

  async findByChain(chainId: string) {
    return this.model.findMany({
      where: { chainId, verified: true },
      orderBy: { name: 'asc' },
    });
  }

  async searchByName(name: string) {
    return this.model.findMany({
      where: {
        name: { contains: name, mode: 'insensitive' },
        verified: true,
      },
      orderBy: { name: 'asc' },
      take: 20,
    });
  }
}

export class BlockchainNotarizationRepository extends BaseRepository<
  Prisma.BlockchainNotarizationGetPayload<{}>,
  Prisma.BlockchainNotarizationCreateInput,
  Prisma.BlockchainNotarizationUpdateInput,
  Prisma.BlockchainNotarizationWhereInput
> {
  constructor() {
    super('blockchainNotarization');
  }

  async findByHash(hash: string) {
    return this.model.findUnique({ where: { hash } });
  }

  async findByDataType(dataType: string, pagination: PaginationParams): Promise<PaginatedResult<Prisma.BlockchainNotarizationGetPayload<{}>>> {
    return this.paginate(pagination, { dataType } as any, {
      orderBy: { createdAt: 'desc' as const },
    });
  }

  async findByDataHash(dataHash: string) {
    return this.model.findUnique({ where: { dataHash } });
  }

  async findPending() {
    return this.model.findMany({
      where: { status: 'pending' },
      orderBy: { createdAt: 'asc' },
    });
  }

  async confirm(id: string, txHash: string, blockNumber: string) {
    return this.update(id, {
      txHash,
      blockNumber,
      status: 'confirmed',
      confirmedAt: new Date(),
    } as any);
  }
}

export class BlockchainNodeRepository extends BaseRepository<
  Prisma.BlockchainNodeGetPayload<{}>,
  Prisma.BlockchainNodeCreateInput,
  Prisma.BlockchainNodeUpdateInput,
  Prisma.BlockchainNodeWhereInput
> {
  constructor() {
    super('blockchainNode');
  }

  async findByChain(chainId: string): Promise<Prisma.BlockchainNodeGetPayload<{}>[]> {
    return this.model.findMany({
      where: { chainId, status: 'active' },
      orderBy: { priority: 'asc' },
    });
  }

  async findActive(): Promise<Prisma.BlockchainNodeGetPayload<{}>[]> {
    return this.model.findMany({
      where: { status: 'active' },
      orderBy: { chainId: 'asc', priority: 'asc' },
    });
  }

  async getFirstByChain(chainId: string) {
    return this.model.findFirst({
      where: { chainId, status: 'active' },
      orderBy: { priority: 'asc' },
    });
  }
}

export const blockchainTransactionRepository = new BlockchainTransactionRepository();
export const blockchainContractRepository = new BlockchainContractRepository();
export const blockchainNotarizationRepository = new BlockchainNotarizationRepository();
export const blockchainNodeRepository = new BlockchainNodeRepository();
export default blockchainTransactionRepository;