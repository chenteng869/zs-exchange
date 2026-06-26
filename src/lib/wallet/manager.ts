/**
 * 钱包管理 (WalletManager)
 *
 * 负责：
 *  - 为用户在不同链上生成钱包
 *  - 维护用户钱包列表
 *  - 默认钱包管理
 *  - asset -> wallet 内部映射
 */

import type { ID, Wallet, WalletType } from '@/types/models';
import { AddressError, generateAddress, type Chain } from './address';

// =============================================================================
// 自定义错误
// =============================================================================

export class WalletError extends Error {
  public readonly code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
    this.name = 'WalletError';
  }
}

// =============================================================================
// 内部存储
// =============================================================================

interface CreateWalletParams {
  userId: ID;
  asset: string;
  chain: Chain;
  type?: WalletType;
  label?: string;
}

// =============================================================================
// WalletManager
// =============================================================================

export class WalletManager {
  /** 全局钱包（包含热钱包、冷钱包） */
  private wallets: Map<ID, Wallet> = new Map();
  /** userId -> Set<walletId> */
  private userIndex: Map<ID, Set<ID>> = new Map();
  /** userId|asset -> walletId (默认钱包) */
  private defaultIndex: Map<string, ID> = new Map();

  /**
   * 创建钱包
   */
  createWallet(userId: ID, asset: string, type: WalletType = 'hot'): Wallet {
    // 内部用户/资产/类型组合
    const chain = this.inferChain(asset, type);
    const id = this.generateId('w');
    const address = generateAddress(chain, `${userId}:${asset}:${id}`);

    const now = new Date().toISOString();
    const wallet: Wallet = {
      id,
      userId,
      type,
      asset,
      address,
      chain,
      balance: '0',
      status: 'active',
      isDefault: false,
      createdAt: now,
    };

    this.wallets.set(id, wallet);
    this.attachToUser(userId, id);

    // 自动设置默认（首个）
    const defaultKey = this.defaultKey(userId, asset);
    if (!this.defaultIndex.has(defaultKey)) {
      this.setDefaultWallet(id);
    }

    return wallet;
  }

  /**
   * 获取用户所有钱包
   */
  getWallets(userId: ID): Wallet[] {
    const ids = this.userIndex.get(userId);
    if (!ids) return [];
    return Array.from(ids)
      .map((id) => this.wallets.get(id))
      .filter((w): w is Wallet => Boolean(w));
  }

  /**
   * 获取默认钱包
   */
  getDefaultWallet(userId: ID, asset: string): Wallet | undefined {
    const key = this.defaultKey(userId, asset);
    const id = this.defaultIndex.get(key);
    if (!id) return undefined;
    return this.wallets.get(id);
  }

  /**
   * 设置默认钱包
   */
  setDefaultWallet(walletId: ID): Wallet {
    const wallet = this.wallets.get(walletId);
    if (!wallet) {
      throw new WalletError('WALLET_NOT_FOUND', `Wallet not found: ${walletId}`);
    }
    // 取消同 user/asset 的其他默认
    const sameKey = this.defaultKey(wallet.userId, wallet.asset);
    for (const w of this.wallets.values()) {
      if (w.userId === wallet.userId && w.asset === wallet.asset) {
        if (w.isDefault) w.isDefault = false;
      }
    }
    wallet.isDefault = true;
    this.defaultIndex.set(sameKey, walletId);
    return wallet;
  }

  /**
   * 通过 ID 获取钱包
   */
  getWallet(walletId: ID): Wallet | undefined {
    return this.wallets.get(walletId);
  }

  /**
   * 通过地址查找钱包
   */
  findByAddress(address: string): Wallet | undefined {
    for (const w of this.wallets.values()) {
      if (w.address === address) return w;
    }
    return undefined;
  }

  /**
   * 更新余额（内部使用）
   */
  updateBalance(walletId: ID, balance: string): Wallet {
    const w = this.wallets.get(walletId);
    if (!w) {
      throw new WalletError('WALLET_NOT_FOUND', `Wallet not found: ${walletId}`);
    }
    w.balance = balance;
    return w;
  }

  /**
   * 列出所有用户 ID
   */
  listUserIds(): ID[] {
    return Array.from(this.userIndex.keys());
  }

  /**
   * 内部：推断 chain
   *  - USDT/USDC: 默认 ERC20 (ETH)
   *  - BTC -> BTC
   *  - TRX -> TRX
   *  - BNB -> BSC
   *  - SOL -> SOL
   *  - ETH -> ETH
   */
  private inferChain(asset: string, type: WalletType): Chain {
    const upper = asset.toUpperCase();
    if (upper === 'BTC') return 'BTC';
    if (upper === 'ETH') return 'ETH';
    if (upper === 'TRX') return 'TRX';
    if (upper === 'BNB') return 'BSC';
    if (upper === 'SOL') return 'SOL';
    // 稳定币 / ERC20 默认
    return 'ETH';
  }

  /** user|asset 默认键 */
  private defaultKey(userId: ID, asset: string): string {
    return `${userId}|${asset}`;
  }

  private attachToUser(userId: ID, walletId: ID): void {
    let set = this.userIndex.get(userId);
    if (!set) {
      set = new Set();
      this.userIndex.set(userId, set);
    }
    set.add(walletId);
  }

  private generateId(prefix: string): string {
    // 不引入 nanoid，自行实现一个
    return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
  }
}

// 重新导出 AddressError 供上层使用
export { AddressError };
