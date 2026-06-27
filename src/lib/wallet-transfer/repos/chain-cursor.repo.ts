import { TransferChainType, WalletChainCursor } from '@prisma/client';
import { BaseRepository } from './base-repo';

export class ChainCursorRepository extends BaseRepository {
  async getOrCreate(params: {
    chainType: TransferChainType;
    chainId: string;
    scannerName: string;
    initialBlock?: bigint;
  }): Promise<WalletChainCursor> {
    return this.prisma.walletChainCursor.upsert({
      where: {
        chainType_chainId_scannerName: {
          chainType: params.chainType,
          chainId: params.chainId,
          scannerName: params.scannerName,
        },
      },
      create: {
        chainType: params.chainType,
        chainId: params.chainId,
        scannerName: params.scannerName,
        currentBlock: params.initialBlock ?? 0n,
        safeBlock: params.initialBlock ?? 0n,
        latestBlock: params.initialBlock ?? 0n,
        status: 'active',
      },
      update: {},
    });
  }

  async updateCursor(params: {
    chainType: TransferChainType;
    chainId: string;
    scannerName: string;
    currentBlock: bigint | number;
    safeBlock: bigint | number;
    latestBlock?: bigint | number;
  }): Promise<WalletChainCursor> {
    return this.prisma.walletChainCursor.update({
      where: {
        chainType_chainId_scannerName: {
          chainType: params.chainType,
          chainId: params.chainId,
          scannerName: params.scannerName,
        },
      },
      data: {
        currentBlock: BigInt(params.currentBlock),
        safeBlock: BigInt(params.safeBlock),
        latestBlock: params.latestBlock !== undefined
          ? BigInt(params.latestBlock)
          : undefined,
        status: 'active',
        errorMessage: null,
      },
    });
  }

  async markError(params: {
    chainType: TransferChainType;
    chainId: string;
    scannerName: string;
    errorMessage: string;
  }): Promise<WalletChainCursor> {
    return this.prisma.walletChainCursor.update({
      where: {
        chainType_chainId_scannerName: {
          chainType: params.chainType,
          chainId: params.chainId,
          scannerName: params.scannerName,
        },
      },
      data: {
        status: 'error',
        errorMessage: params.errorMessage.slice(0, 1024),
      },
    });
  }
}

export const chainCursorRepo = new ChainCursorRepository();
