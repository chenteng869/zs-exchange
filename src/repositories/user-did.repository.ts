import prisma from '@/lib/prisma';

export interface CreateUserDidInput {
  userId: string;
  did: string;
  method: string;
  chainType: string;
  chainId: string;
  publicKey: string;
  keyRef?: string | null;
  document: unknown;
  anchorStatus?: string;
}

export interface UpdateUserDidAnchorInput {
  anchorStatus: string;
  anchorTxHash?: string | null;
  anchorBlockNo?: bigint | number | null;
  anchorTimestamp?: Date | null;
  lastAnchoredAt?: Date | null;
}

export class UserDidRepository {
  private get model() {
    return (prisma as any).coreUserDid;
  }

  async findByUserId(userId: string) {
    return this.model.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByDid(did: string) {
    return this.model.findUnique({ where: { did } });
  }

  async create(data: CreateUserDidInput) {
    return this.model.create({
      data: {
        userId: data.userId,
        did: data.did,
        method: data.method,
        chainType: data.chainType,
        chainId: data.chainId,
        publicKey: data.publicKey,
        keyRef: data.keyRef ?? null,
        document: data.document,
        anchorStatus: data.anchorStatus ?? 'pending',
      },
    });
  }

  async updateAnchor(did: string, data: UpdateUserDidAnchorInput) {
    return this.model.update({
      where: { did },
      data: {
        anchorStatus: data.anchorStatus,
        anchorTxHash: data.anchorTxHash ?? null,
        anchorBlockNo:
          data.anchorBlockNo === undefined || data.anchorBlockNo === null
            ? null
            : BigInt(data.anchorBlockNo),
        anchorTimestamp: data.anchorTimestamp ?? null,
        lastAnchoredAt: data.lastAnchoredAt ?? null,
      },
    });
  }
}

export const userDidRepository = new UserDidRepository();
export default userDidRepository;
