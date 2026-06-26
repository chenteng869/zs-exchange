import { BaseRepository, PaginationParams, PaginatedResult } from './base/base.repository';
import { Prisma } from '@prisma/client';

export class DefiStakingPoolRepository extends BaseRepository<
  Prisma.DefiStakingPoolGetPayload<{}>,
  Prisma.DefiStakingPoolCreateInput,
  Prisma.DefiStakingPoolUpdateInput,
  Prisma.DefiStakingPoolWhereInput
> {
  constructor() {
    super('defiStakingPool');
  }

  async findActivePools(): Promise<Prisma.DefiStakingPoolGetPayload<{}>[]> {
    return this.model.findMany({
      where: { status: 'active' },
      orderBy: { apy: 'desc' },
    });
  }

  async findByCurrency(currency: string) {
    return this.model.findMany({
      where: { currency, status: 'active' },
      orderBy: { apy: 'desc' },
    });
  }

  async updateTotalStaked(poolId: string, amount: number) {
    return this.model.update({
      where: { id: poolId },
      data: { totalStaked: { increment: amount } },
    });
  }
}

export class DefiStakingRepository extends BaseRepository<
  Prisma.DefiStakingGetPayload<{}>,
  Prisma.DefiStakingCreateInput,
  Prisma.DefiStakingUpdateInput,
  Prisma.DefiStakingWhereInput
> {
  constructor() {
    super('defiStaking');
  }

  async findByUserId(userId: string, pagination: PaginationParams): Promise<PaginatedResult<Prisma.DefiStakingGetPayload<{}>>> {
    return this.paginate(pagination, { userId } as any, {
      orderBy: { stakedAt: 'desc' as const },
    });
  }

  async findByPoolId(poolId: string, pagination: PaginationParams): Promise<PaginatedResult<Prisma.DefiStakingGetPayload<{}>>> {
    return this.paginate(pagination, { poolId } as any, {
      orderBy: { stakedAt: 'desc' as const },
    });
  }

  async findActiveByUserId(userId: string) {
    return this.model.findMany({
      where: { userId, status: 'staking' },
      include: { pool: true },
      orderBy: { stakedAt: 'desc' },
    });
  }

  async stake(userId: string, poolId: string, amount: number) {
    return this.model.create({
      data: {
        userId,
        poolId,
        amount,
      },
    });
  }

  async unstake(id: string) {
    return this.update(id, { status: 'unstaked', unlockedAt: new Date() } as any);
  }

  async updateReward(id: string, reward: number) {
    return this.model.update({
      where: { id },
      data: { reward: { increment: reward } },
    });
  }
}

export class DefiLiquidityPoolRepository extends BaseRepository<
  Prisma.DefiLiquidityPoolGetPayload<{}>,
  Prisma.DefiLiquidityPoolCreateInput,
  Prisma.DefiLiquidityPoolUpdateInput,
  Prisma.DefiLiquidityPoolWhereInput
> {
  constructor() {
    super('defiLiquidityPool');
  }

  async findActivePools(): Promise<Prisma.DefiLiquidityPoolGetPayload<{}>[]> {
    return this.model.findMany({
      where: { status: 'active' },
      orderBy: { tvl: 'desc' },
    });
  }

  async updateTVL(poolId: string, tvl: number) {
    return this.model.update({
      where: { id: poolId },
      data: { tvl },
    });
  }
}

export class DefiSwapRepository extends BaseRepository<
  Prisma.DefiSwapGetPayload<{}>,
  Prisma.DefiSwapCreateInput,
  Prisma.DefiSwapUpdateInput,
  Prisma.DefiSwapWhereInput
> {
  constructor() {
    super('defiSwap');
  }

  async findByUserId(userId: string, pagination: PaginationParams): Promise<PaginatedResult<Prisma.DefiSwapGetPayload<{}>>> {
    return this.paginate(pagination, { userId } as any, {
      orderBy: { createdAt: 'desc' as const },
    });
  }

  async findByStatus(status: string, pagination: PaginationParams): Promise<PaginatedResult<Prisma.DefiSwapGetPayload<{}>>> {
    return this.paginate(pagination, { status } as any, {
      orderBy: { createdAt: 'asc' as const },
    });
  }
}

export const defiStakingPoolRepository = new DefiStakingPoolRepository();
export const defiStakingRepository = new DefiStakingRepository();
export const defiLiquidityPoolRepository = new DefiLiquidityPoolRepository();
export const defiSwapRepository = new DefiSwapRepository();
export default defiStakingRepository;