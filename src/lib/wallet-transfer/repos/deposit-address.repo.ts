import { DepositAddressStatus, TransferChainType, WalletDepositAddress } from '@prisma/client';
import { BaseRepository } from './base-repo';

export class DepositAddressRepository extends BaseRepository {
  async create(data: {
    userId: string;
    walletId?: string;
    chainType: TransferChainType;
    chainId: string;
    address: string;
    memo?: string;
    derivationPath?: string;
    addressIndex: number;
    addressType?: string;
  }): Promise<WalletDepositAddress> {
    return this.prisma.walletDepositAddress.create({
      data: {
        userId: data.userId,
        walletId: data.walletId,
        chainType: data.chainType,
        chainId: data.chainId,
        address: data.address,
        memo: data.memo,
        derivationPath: data.derivationPath,
        addressIndex: data.addressIndex,
        addressType: data.addressType ?? 'deposit',
        status: DepositAddressStatus.active,
      },
    });
  }

  async findActiveByUserChain(params: {
    userId: string;
    walletId?: string;
    chainType: TransferChainType;
    chainId: string;
  }): Promise<WalletDepositAddress | null> {
    return this.prisma.walletDepositAddress.findFirst({
      where: {
        userId: params.userId,
        walletId: params.walletId,
        chainType: params.chainType,
        chainId: params.chainId,
        status: DepositAddressStatus.active,
      },
      orderBy: { id: 'asc' },
    });
  }

  async findByChainAddress(params: {
    chainType: TransferChainType;
    chainId: string;
    address: string;
  }): Promise<WalletDepositAddress | null> {
    return this.prisma.walletDepositAddress.findUnique({
      where: {
        chainType_chainId_address: {
          chainType: params.chainType,
          chainId: params.chainId,
          address: params.address,
        },
      },
    });
  }

  async listActiveAddresses(params: {
    chainType: TransferChainType;
    chainId: string;
    take?: number;
  }): Promise<WalletDepositAddress[]> {
    return this.prisma.walletDepositAddress.findMany({
      where: {
        chainType: params.chainType,
        chainId: params.chainId,
        status: DepositAddressStatus.active,
      },
      take: params.take ?? 10000,
      orderBy: { id: 'asc' },
    });
  }

  async nextAddressIndex(params: {
    chainType: TransferChainType;
    chainId: string;
  }): Promise<number> {
    const latest = await this.prisma.walletDepositAddress.findFirst({
      where: {
        chainType: params.chainType,
        chainId: params.chainId,
      },
      orderBy: { addressIndex: 'desc' },
      select: { addressIndex: true },
    });

    return (latest?.addressIndex ?? -1) + 1;
  }

  async markUsed(id: string): Promise<WalletDepositAddress> {
    return this.prisma.walletDepositAddress.update({
      where: { id },
      data: { lastUsedAt: new Date() },
    });
  }

  async disable(id: string): Promise<WalletDepositAddress> {
    return this.prisma.walletDepositAddress.update({
      where: { id },
      data: { status: DepositAddressStatus.disabled },
    });
  }
}

export const depositAddressRepo = new DepositAddressRepository();
