import { LockStatus, Prisma, WalletHotWalletLock } from '@prisma/client';
import { BaseRepository } from './base-repo';
import { generateNo } from '../types';

export class HotWalletLockRepository extends BaseRepository {
  async findByBiz(params: {
    walletNo: string;
    bizType: string;
    bizNo: string;
  }): Promise<WalletHotWalletLock | null> {
    return this.prisma.walletHotWalletLock.findUnique({
      where: {
        walletNo_bizType_bizNo: {
          walletNo: params.walletNo,
          bizType: params.bizType,
          bizNo: params.bizNo,
        },
      },
    });
  }

  async consume(lockNo: string): Promise<WalletHotWalletLock> {
    const lock = await this.prisma.walletHotWalletLock.findUnique({
      where: { lockNo },
    });

    if (!lock) throw new Error('HOT_WALLET_LOCK_NOT_FOUND');
    if (lock.status !== LockStatus.locked) {
      throw new Error('HOT_WALLET_LOCK_NOT_ACTIVE');
    }

    await this.prisma.walletHotWallet.update({
      where: { walletNo: lock.walletNo },
      data: {
        lockedBalance: { decrement: lock.amount },
        balance: { decrement: lock.amount },
      },
    });

    return this.prisma.walletHotWalletLock.update({
      where: { lockNo },
      data: {
        status: LockStatus.consumed,
        consumedAt: new Date(),
      },
    });
  }

  async release(lockNo: string): Promise<WalletHotWalletLock> {
    const lock = await this.prisma.walletHotWalletLock.findUnique({
      where: { lockNo },
    });

    if (!lock) throw new Error('HOT_WALLET_LOCK_NOT_FOUND');
    if (lock.status !== LockStatus.locked) {
      throw new Error('HOT_WALLET_LOCK_NOT_ACTIVE');
    }

    await this.prisma.walletHotWallet.update({
      where: { walletNo: lock.walletNo },
      data: {
        lockedBalance: { decrement: lock.amount },
        availableBalance: { increment: lock.amount },
      },
    });

    return this.prisma.walletHotWalletLock.update({
      where: { lockNo },
      data: {
        status: LockStatus.released,
        releasedAt: new Date(),
      },
    });
  }

  async expireOld(now = new Date()): Promise<{ count: number }> {
    const expiredLocks = await this.prisma.walletHotWalletLock.findMany({
      where: {
        status: LockStatus.locked,
        expiresAt: { lt: now },
      },
    });

    for (const lock of expiredLocks) {
      await this.release(lock.lockNo);
      await this.prisma.walletHotWalletLock.update({
        where: { lockNo: lock.lockNo },
        data: { status: LockStatus.expired },
      });
    }

    return { count: expiredLocks.length };
  }

  async listByWallet(walletNo: string, status?: LockStatus): Promise<WalletHotWalletLock[]> {
    return this.prisma.walletHotWalletLock.findMany({
      where: { walletNo, status },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }
}

export const hotWalletLockRepo = new HotWalletLockRepository();
