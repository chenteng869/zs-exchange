import { TransferChainType, WalletDepositAddress } from '@prisma/client';
import { keyService } from '../wallet/key/key.service';
import { depositAddressRepo } from './repos/deposit-address.repo';

export interface CreateDepositAddressParams {
  userId: string;
  walletId?: string;
  chainType: TransferChainType;
  chainId: string;
  assetSymbol: string;
  contractAddress?: string;
  mnemonicPassword?: string;
}

export class DepositAddressService {
  async getOrCreateAddress(params: CreateDepositAddressParams): Promise<WalletDepositAddress> {
    const existing = await depositAddressRepo.findActiveByUserChain({
      userId: params.userId,
      walletId: params.walletId,
      chainType: params.chainType,
      chainId: params.chainId,
    });

    if (existing) {
      return existing;
    }

    return this.createNewAddress(params);
  }

  async createNewAddress(params: CreateDepositAddressParams): Promise<WalletDepositAddress> {
    const nextIndex = await depositAddressRepo.nextAddressIndex({
      chainType: params.chainType,
      chainId: params.chainId,
    });

    const { address, derivationPath } = await this.deriveAddress(
      params.walletId ?? 'default',
      params.mnemonicPassword ?? 'default',
      params.chainType,
      nextIndex,
    );

    const addressRecord = await depositAddressRepo.create({
      userId: params.userId,
      walletId: params.walletId,
      chainType: params.chainType,
      chainId: params.chainId,
      address,
      addressIndex: nextIndex,
      derivationPath,
    });

    return addressRecord;
  }

  private async deriveAddress(
    walletId: string,
    password: string,
    chainType: TransferChainType,
    index: number,
  ): Promise<{ address: string; derivationPath: string; publicKey?: string; privateKey?: string }> {
    switch (chainType) {
      case TransferChainType.evm: {
        const account = await keyService.deriveEvmAddress(walletId, password, index);
        return {
          address: account.address,
          derivationPath: account.derivationPath,
          publicKey: account.publicKey,
        };
      }
      case TransferChainType.tron: {
        const account = await keyService.deriveTronAddress(walletId, password, index);
        return {
          address: account.address,
          derivationPath: account.derivationPath,
          publicKey: account.publicKey,
        };
      }
      case TransferChainType.solana: {
        const account = await keyService.deriveSolanaAddress(walletId, password, index);
        return {
          address: account.address,
          derivationPath: account.derivationPath,
          publicKey: account.publicKey,
        };
      }
      default:
        throw new Error(`UNSUPPORTED_CHAIN_TYPE: ${chainType}`);
    }
  }

  async listUserAddresses(params: {
    userId: string;
    chainType?: TransferChainType;
    chainId?: string;
  }): Promise<WalletDepositAddress[]> {
    const all = await depositAddressRepo.listActiveAddresses({
      chainType: params.chainType ?? TransferChainType.evm,
      chainId: params.chainId ?? '1',
    });
    return all.filter((addr) => addr.userId === params.userId);
  }

  async verifyAddress(params: {
    chainType: TransferChainType;
    chainId: string;
    address: string;
  }): Promise<{ isValid: boolean; record: WalletDepositAddress | null }> {
    const record = await depositAddressRepo.findByChainAddress({
      chainType: params.chainType,
      chainId: params.chainId,
      address: params.address,
    });

    return {
      isValid: !!record,
      record,
    };
  }
}

export const depositAddressService = new DepositAddressService();
