import { HotWalletRole, HotWalletStatus, Prisma, TransferChainType, WalletHotWallet } from '@prisma/client';
import { BaseRepository } from './base-repo';
import { generateNo } from '../types';

export class HotWalletRepository extends BaseRepository {
  async create(data: {
    chainType: TransferChainType;
    chainId: string;
    address: string;
    assetSymbol?: string;
    contractAddress?: string;
    walletRole: HotWalletRole;
    minBalance?: string | Prisma.Decimal;
    maxBalance?: string | Prisma.Decimal;
    sweepThreshold?: string | Prisma.Decimal;
    keyRef?: string;
    provider?: string;
  }): Promise<WalletHotWallet> {
    const walletNo = generateNo('HW');

    return this.prisma.walletHotWallet.create({
      data: {
        walletNo,
        chainType: data.chainType,
        chainId: data.chainId,
        address: data.address,
        assetSymbol: data.assetSymbol,
        contractAddress: data.contractAddress ?? '',
        walletRole: data.walletRole,
        minBalance: data.minBalance ?? '0',
        maxBalance: data.maxBalance ?? '0',
        sweepThreshold: data.sweepThreshold ?? '0',
        keyRef: data.keyRef,
        provider: data.provider,
        status: HotWalletStatus.active,
      },
    });
  }

  async findByWalletNo(walletNo: string): Promise<WalletHotWallet | null> {
    return this.prisma.walletHotWallet.findUnique({
      where: { walletNo },
    });
  }

  async listAvailableHotWallets(params: {
    chainType: TransferChainType;
    chainId: string;
    assetSymbol: string;
    contractAddress?: string;
  }): Promise<WalletHotWallet[]> {
    return this.prisma.walletHotWallet.findMany({
      where: {
        chainType: params.chainType,
        chainId: params.chainId,
        assetSymbol: params.assetSymbol,
        contractAddress: params.contractAddress ?? '',
        walletRole: HotWalletRole.hot,
        status: HotWalletStatus.active,
      },
      orderBy: [
        { availableBalance: 'desc' },
        { id: 'asc' },
      ],
    });
  }

  async findSweepTarget(params: {
    chainType: TransferChainType;
    chainId: string;
    assetSymbol?: string;
    contractAddress?: string;
  }): Promise<WalletHotWallet | null> {
    return this.prisma.walletHotWallet.findFirst({
      where: {
        chainType: params.chainType,
        chainId: params.chainId,
        assetSymbol: params.assetSymbol,
        contractAddress: params.contractAddress ?? '',
        walletRole: {
          in: [
            HotWalletRole.hot,
            HotWalletRole.warm,
          ],
        },
        status: HotWalletStatus.active,
      },
      orderBy: { id: 'asc' },
    });
  }

  async updateBalance(params: {
    walletNo: string;
    balance: string | Prisma.Decimal;
    availableBalance?: string | Prisma.Decimal;
    lockedBalance?: string | Prisma.Decimal;
  }): Promise<WalletHotWallet> {
    return this.prisma.walletHotWallet.update({
      where: { walletNo: params.walletNo },
      data: {
        balance: params.balance,
        availableBalance: params.availableBalance,
        lockedBalance: params.lockedBalance,
        lastSyncAt: new Date(),
      },
    });
  }

  async lockBalance(params: {
    walletNo: string;
    amount: string | Prisma.Decimal;
    bizType: string;
    bizNo: string;
    lockNo: string;
    expiresAt?: Date;
  }): Promise<{ wallet: WalletHotWallet; lock: any }> {
    const wallet = await this.prisma.walletHotWallet.findUnique({
      where: { walletNo: params.walletNo },
    });

    if (!wallet) throw new Error('HOT_WALLET_NOT_FOUND');

    const amount = new Prisma.Decimal(params.amount);

    if (wallet.availableBalance.lessThan(amount)) {
      throw new Error('HOT_WALLET_INSUFFICIENT_BALANCE');
    }

    const updatedWallet = await this.prisma.walletHotWallet.update({
      where: { walletNo: params.walletNo },
      data: {
        availableBalance: { decrement: amount },
        lockedBalance: { increment: amount },
      },
    });

    const lock = await this.prisma.walletHotWalletLock.create({
      data: {
        lockNo: params.lockNo,
        walletNo: params.walletNo,
        bizType: params.bizType,
        bizNo: params.bizNo,
        assetSymbol: wallet.assetSymbol ?? '',
        contractAddress: wallet.contractAddress ?? '',
        amount,
        status: 'locked',
        expiresAt: params.expiresAt,
      },
    });

    return { wallet: updatedWallet, lock };
  }

  async freeze(walletNo: string): Promise<WalletHotWallet> {
    return this.prisma.walletHotWallet.update({
      where: { walletNo },
      data: { status: HotWalletStatus.frozen },
    });
  }

  async unfreeze(walletNo: string): Promise<WalletHotWallet> {
    return this.prisma.walletHotWallet.update({
      where: { walletNo },
      data: { status: HotWalletStatus.active },
    });
  }

  async listByRole(params: {
    chainType: TransferChainType;
    chainId: string;
    walletRole: HotWalletRole;
    status?: HotWalletStatus;
  }): Promise<WalletHotWallet[]> {
    return this.prisma.walletHotWallet.findMany({
      where: {
        chainType: params.chainType,
        chainId: params.chainId,
        walletRole: params.walletRole,
        status: params.status,
      },
      orderBy: { id: 'asc' },
    });
  }
}

export const hotWalletRepo = new HotWalletRepository();
