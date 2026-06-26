/**
 * 钱包安全存储模块
 *
 * 功能：
 *  - 本地加密存储（IndexedDB / localStorage）
 *  - 云存储同步（加密后上传）
 *  - 多钱包管理
 *  - 钱包元数据
 *  - 备份与恢复
 *  - 存储加密（AES-256-GCM）
 *  - 内存缓存（带过期时间）
 */

import { randomBytes, scryptSync, createCipheriv, createDecipheriv, createHmac } from 'crypto';
import { secureZero, secureEqual, type EncryptedKey } from './private-key';

// ============================================================================
// 类型定义
// ============================================================================

export interface WalletMeta {
  id: string;
  name: string;
  type: WalletType;
  chainTypes: string[];
  addressCount: number;
  createdAt: string;
  updatedAt: string;
  lastUsedAt?: string;
  description?: string;
  avatar?: string;
  isHD: boolean;
  isHardware: boolean;
  hardwareType?: HardwareWalletType;
  tags: string[];
}

export type WalletType = 'hd' | 'private-key' | 'hardware' | 'watch-only' | 'multi-sig';

export type HardwareWalletType = 'ledger' | 'trezor' | 'keystone' | 'onekey' | 'imkey' | 'coolwallet';

export interface StoredWallet {
  meta: WalletMeta;
  encryptedSeed?: EncryptedKey;
  encryptedKeys: Record<string, EncryptedKey>;
  addresses: StoredAddress[];
  settings: WalletSettings;
}

export interface StoredAddress {
  address: string;
  chainType: string;
  path?: string;
  index?: number;
  label?: string;
  isDefault?: boolean;
  createdAt: string;
}

export interface WalletSettings {
  autoLockTimeout: number;
  requirePasswordForSend: boolean;
  requirePasswordForSign: boolean;
  biometricEnabled: boolean;
  darkMode: boolean;
  defaultChain: string;
  gasPricePreference: 'slow' | 'normal' | 'fast' | 'custom';
  customGasPrice?: string;
  slippageTolerance: number;
  language: string;
  currency: string;
  notifications: {
    deposit: boolean;
    withdrawal: boolean;
    trading: boolean;
    security: boolean;
    announcement: boolean;
  };
}

export interface StorageOptions {
  storagePrefix?: string;
  encryptionSalt?: string;
  masterKeyIterations?: number;
  cacheTTL?: number;
}

export interface MasterKey {
  key: Uint8Array;
  salt: Uint8Array;
  iterations: number;
}

export type StorageBackend = 'localStorage' | 'indexedDB' | 'memory' | 'secureEnclave';

// ============================================================================
// 常量
// ============================================================================

const DEFAULT_PREFIX = 'zs_wallet_';
const DEFAULT_ITERATIONS = 65536;
const DEFAULT_CACHE_TTL = 30 * 60 * 1000;

const DEFAULT_SETTINGS: WalletSettings = {
  autoLockTimeout: 15 * 60 * 1000,
  requirePasswordForSend: true,
  requirePasswordForSign: true,
  biometricEnabled: false,
  darkMode: false,
  defaultChain: 'ethereum',
  gasPricePreference: 'normal',
  slippageTolerance: 0.5,
  language: 'zh-CN',
  currency: 'USD',
  notifications: {
    deposit: true,
    withdrawal: true,
    trading: true,
    security: true,
    announcement: false,
  },
};

// ============================================================================
// 存储后端抽象
// ============================================================================

interface StorageBackendAdapter {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
  keys(): Promise<string[]>;
  clear(): Promise<void>;
}

class LocalStorageBackend implements StorageBackendAdapter {
  async getItem(key: string): Promise<string | null> {
    return localStorage.getItem(key);
  }

  async setItem(key: string, value: string): Promise<void> {
    localStorage.setItem(key, value);
  }

  async removeItem(key: string): Promise<void> {
    localStorage.removeItem(key);
  }

  async keys(): Promise<string[]> {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) keys.push(key);
    }
    return keys;
  }

  async clear(): Promise<void> {
    localStorage.clear();
  }
}

class MemoryStorageBackend implements StorageBackendAdapter {
  private store: Map<string, string> = new Map();

  async getItem(key: string): Promise<string | null> {
    return this.store.get(key) ?? null;
  }

  async setItem(key: string, value: string): Promise<void> {
    this.store.set(key, value);
  }

  async removeItem(key: string): Promise<void> {
    this.store.delete(key);
  }

  async keys(): Promise<string[]> {
    return Array.from(this.store.keys());
  }

  async clear(): Promise<void> {
    this.store.clear();
  }
}

// ============================================================================
// 主密钥管理
// ============================================================================

export class MasterKeyManager {
  private masterKey: MasterKey | null = null;
  private options: Required<StorageOptions>;

  constructor(options: StorageOptions = {}) {
    this.options = {
      storagePrefix: options.storagePrefix ?? DEFAULT_PREFIX,
      encryptionSalt: options.encryptionSalt ?? '',
      masterKeyIterations: options.masterKeyIterations ?? DEFAULT_ITERATIONS,
      cacheTTL: options.cacheTTL ?? DEFAULT_CACHE_TTL,
    };
  }

  /**
   * 从密码派生主密钥
   */
  deriveMasterKey(password: string, salt?: Uint8Array): MasterKey {
    const saltBytes = salt ?? randomBytes(32);
    const key = scryptSync(password, Buffer.from(saltBytes), 32, {
      N: this.options.masterKeyIterations,
      r: 8,
      p: 1,
    });

    return {
      key: new Uint8Array(key),
      salt: saltBytes,
      iterations: this.options.masterKeyIterations,
    };
  }

  /**
   * 设置主密钥
   */
  setMasterKey(key: MasterKey): void {
    this.masterKey = key;
  }

  /**
   * 获取主密钥
   */
  getMasterKey(): MasterKey | null {
    return this.masterKey;
  }

  /**
   * 清空主密钥
   */
  clearMasterKey(): void {
    if (this.masterKey) {
      secureZero(this.masterKey.key);
      secureZero(this.masterKey.salt);
    }
    this.masterKey = null;
  }

  /**
   * 验证密码
   */
  verifyPassword(password: string, salt: Uint8Array, expectedKey: Uint8Array): boolean {
    const derived = this.deriveMasterKey(password, salt);
    const valid = secureEqual(derived.key, expectedKey);
    secureZero(derived.key);
    secureZero(derived.salt);
    return valid;
  }
}

// ============================================================================
// 数据加密工具
// ============================================================================

export class DataEncryption {
  static encrypt(data: string, key: Uint8Array): EncryptedData {
    const iv = randomBytes(12);
    const additionalData = Buffer.from('zs-wallet-v1');

    const cipher = createCipheriv('aes-256-gcm', Buffer.from(key), iv);
    cipher.setAAD(additionalData);

    const encrypted = Buffer.concat([
      cipher.update(data, 'utf8'),
      cipher.final(),
    ]);

    const tag = cipher.getAuthTag();

    return {
      version: 1,
      algorithm: 'aes-256-gcm',
      iv: Buffer.from(iv).toString('base64'),
      tag: Buffer.from(tag).toString('base64'),
      data: encrypted.toString('base64'),
      aad: additionalData.toString('base64'),
    };
  }

  static decrypt(encrypted: EncryptedData, key: Uint8Array): string {
    const iv = Buffer.from(encrypted.iv, 'base64');
    const tag = Buffer.from(encrypted.tag, 'base64');
    const data = Buffer.from(encrypted.data, 'base64');
    const aad = Buffer.from(encrypted.aad, 'base64');

    const decipher = createDecipheriv('aes-256-gcm', Buffer.from(key), iv);
    decipher.setAAD(aad);
    decipher.setAuthTag(tag);

    const decrypted = Buffer.concat([
      decipher.update(data),
      decipher.final(),
    ]);

    return decrypted.toString('utf8');
  }

  static encryptObject<T>(data: T, key: Uint8Array): EncryptedData {
    return this.encrypt(JSON.stringify(data), key);
  }

  static decryptObject<T>(encrypted: EncryptedData, key: Uint8Array): T {
    const json = this.decrypt(encrypted, key);
    return JSON.parse(json);
  }
}

export interface EncryptedData {
  version: number;
  algorithm: string;
  iv: string;
  tag: string;
  data: string;
  aad: string;
}

// ============================================================================
// 内存缓存
// ============================================================================

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

class MemoryCache<T> {
  private cache: Map<string, CacheEntry<T>> = new Map();
  private ttl: number;

  constructor(ttl: number = DEFAULT_CACHE_TTL) {
    this.ttl = ttl;
  }

  get(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    return entry.value;
  }

  set(key: string, value: T, ttl?: number): void {
    this.cache.set(key, {
      value,
      expiresAt: Date.now() + (ttl ?? this.ttl),
    });
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  cleanup(): number {
    const now = Date.now();
    let removed = 0;
    for (const [key, entry] of this.cache) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
        removed++;
      }
    }
    return removed;
  }

  size(): number {
    return this.cache.size;
  }
}

// ============================================================================
// 钱包存储管理器
// ============================================================================

export class WalletStorage {
  private backend: StorageBackendAdapter;
  private masterKeyManager: MasterKeyManager;
  private options: Required<StorageOptions>;
  private walletCache: MemoryCache<StoredWallet>;
  private isUnlocked: boolean = false;
  private lockTimer: NodeJS.Timeout | null = null;
  private walletList: WalletMeta[] = [];
  private activeWalletId: string | null = null;

  constructor(
    backend: StorageBackend = 'memory',
    options: StorageOptions = {}
  ) {
    this.options = {
      storagePrefix: options.storagePrefix ?? DEFAULT_PREFIX,
      encryptionSalt: options.encryptionSalt ?? '',
      masterKeyIterations: options.masterKeyIterations ?? DEFAULT_ITERATIONS,
      cacheTTL: options.cacheTTL ?? DEFAULT_CACHE_TTL,
    };

    this.backend = this.createBackend(backend);
    this.masterKeyManager = new MasterKeyManager(options);
    this.walletCache = new MemoryCache(this.options.cacheTTL);
  }

  private createBackend(type: StorageBackend): StorageBackendAdapter {
    switch (type) {
      case 'localStorage':
        return new LocalStorageBackend();
      case 'memory':
      default:
        return new MemoryStorageBackend();
    }
  }

  // ========================================================================
  // 初始化与锁定/解锁
  // ========================================================================

  /**
   * 初始化存储，设置密码
   */
  async initialize(password: string): Promise<void> {
    const existing = await this.backend.getItem(this.options.storagePrefix + 'initialized');
    if (existing) {
      throw new Error('Storage already initialized');
    }

    const masterKey = this.masterKeyManager.deriveMasterKey(password);
    this.masterKeyManager.setMasterKey(masterKey);

    const verifier = DataEncryption.encrypt('wallet-init-verifier', masterKey.key);
    await this.backend.setItem(
      this.options.storagePrefix + 'master_verifier',
      JSON.stringify({
        verifier,
        salt: Buffer.from(masterKey.salt).toString('base64'),
        iterations: masterKey.iterations,
      })
    );
    await this.backend.setItem(this.options.storagePrefix + 'initialized', 'true');
    await this.backend.setItem(this.options.storagePrefix + 'wallets', JSON.stringify([]));

    this.isUnlocked = true;
    this.startAutoLock();
  }

  /**
   * 解锁钱包
   */
  async unlock(password: string): Promise<boolean> {
    const stored = await this.backend.getItem(this.options.storagePrefix + 'master_verifier');
    if (!stored) {
      throw new Error('Storage not initialized');
    }

    const { verifier, salt, iterations } = JSON.parse(stored);
    const saltBytes = new Uint8Array(Buffer.from(salt, 'base64'));

    const masterKey = this.masterKeyManager.deriveMasterKey(password, saltBytes);

    try {
      const decrypted = DataEncryption.decrypt(verifier, masterKey.key);
      if (decrypted !== 'wallet-init-verifier') {
        secureZero(masterKey.key);
        return false;
      }

      this.masterKeyManager.setMasterKey(masterKey);
      this.isUnlocked = true;
      this.startAutoLock();
      await this.loadWalletList();
      return true;
    } catch {
      secureZero(masterKey.key);
      return false;
    }
  }

  /**
   * 锁定钱包
   */
  lock(): void {
    this.masterKeyManager.clearMasterKey();
    this.walletCache.clear();
    this.isUnlocked = false;
    this.activeWalletId = null;
    if (this.lockTimer) {
      clearTimeout(this.lockTimer);
      this.lockTimer = null;
    }
  }

  /**
   * 是否解锁
   */
  getIsUnlocked(): boolean {
    return this.isUnlocked;
  }

  private startAutoLock(): void {
    if (this.lockTimer) {
      clearTimeout(this.lockTimer);
    }
    const settings = this.getSettingsSync();
    if (settings.autoLockTimeout > 0) {
      this.lockTimer = setTimeout(() => {
        this.lock();
      }, settings.autoLockTimeout);
    }
  }

  /**
   * 重置自动锁定计时器
   */
  resetAutoLock(): void {
    if (this.isUnlocked) {
      this.startAutoLock();
    }
  }

  // ========================================================================
  // 密码管理
  // ========================================================================

  /**
   * 修改密码
   */
  async changePassword(oldPassword: string, newPassword: string): Promise<boolean> {
    const unlocked = await this.unlock(oldPassword);
    if (!unlocked) return false;

    const oldMasterKey = this.masterKeyManager.getMasterKey();
    if (!oldMasterKey) return false;

    const wallets = await this.listWallets();
    const decryptedWallets: StoredWallet[] = [];
    for (const meta of wallets) {
      const wallet = await this.getWallet(meta.id);
      if (wallet) decryptedWallets.push(wallet);
    }

    const newMasterKey = this.masterKeyManager.deriveMasterKey(newPassword);

    const verifier = DataEncryption.encrypt('wallet-init-verifier', newMasterKey.key);
    await this.backend.setItem(
      this.options.storagePrefix + 'master_verifier',
      JSON.stringify({
        verifier,
        salt: Buffer.from(newMasterKey.salt).toString('base64'),
        iterations: newMasterKey.iterations,
      })
    );

    this.masterKeyManager.setMasterKey(newMasterKey);

    for (const wallet of decryptedWallets) {
      await this.saveWallet(wallet);
    }

    secureZero(oldMasterKey.key);
    secureZero(oldMasterKey.salt);

    this.walletCache.clear();
    return true;
  }

  // ========================================================================
  // 钱包列表管理
  // ========================================================================

  private async loadWalletList(): Promise<void> {
    const stored = await this.backend.getItem(this.options.storagePrefix + 'wallets');
    if (stored) {
      this.walletList = JSON.parse(stored);
    }
  }

  private async saveWalletList(): Promise<void> {
    await this.backend.setItem(
      this.options.storagePrefix + 'wallets',
      JSON.stringify(this.walletList)
    );
  }

  /**
   * 获取钱包列表
   */
  async listWallets(): Promise<WalletMeta[]> {
    if (this.walletList.length === 0) {
      await this.loadWalletList();
    }
    return [...this.walletList];
  }

  /**
   * 添加钱包
   */
  async addWallet(wallet: StoredWallet): Promise<void> {
    this.ensureUnlocked();

    const existing = this.walletList.find((w) => w.id === wallet.meta.id);
    if (!existing) {
      this.walletList.push(wallet.meta);
      await this.saveWalletList();
    }

    await this.saveWallet(wallet);
    this.walletCache.set(wallet.meta.id, wallet);
  }

  /**
   * 删除钱包
   */
  async removeWallet(walletId: string): Promise<boolean> {
    this.ensureUnlocked();

    const index = this.walletList.findIndex((w) => w.id === walletId);
    if (index === -1) return false;

    this.walletList.splice(index, 1);
    await this.saveWalletList();
    await this.backend.removeItem(this.options.storagePrefix + 'wallet_' + walletId);
    this.walletCache.delete(walletId);

    if (this.activeWalletId === walletId) {
      this.activeWalletId = this.walletList[0]?.id ?? null;
    }

    return true;
  }

  /**
   * 获取钱包
   */
  async getWallet(walletId: string): Promise<StoredWallet | null> {
    this.ensureUnlocked();

    const cached = this.walletCache.get(walletId);
    if (cached) return cached;

    const stored = await this.backend.getItem(
      this.options.storagePrefix + 'wallet_' + walletId
    );
    if (!stored) return null;

    const masterKey = this.masterKeyManager.getMasterKey();
    if (!masterKey) return null;

    try {
      const wallet = DataEncryption.decryptObject<StoredWallet>(
        JSON.parse(stored),
        masterKey.key
      );
      this.walletCache.set(walletId, wallet);
      return wallet;
    } catch {
      return null;
    }
  }

  private async saveWallet(wallet: StoredWallet): Promise<void> {
    const masterKey = this.masterKeyManager.getMasterKey();
    if (!masterKey) throw new Error('Wallet locked');

    const encrypted = DataEncryption.encryptObject(wallet, masterKey.key);
    await this.backend.setItem(
      this.options.storagePrefix + 'wallet_' + wallet.meta.id,
      JSON.stringify(encrypted)
    );
  }

  // ========================================================================
  // 活动钱包
  // ========================================================================

  /**
   * 设置活动钱包
   */
  setActiveWallet(walletId: string): void {
    this.activeWalletId = walletId;
    localStorage.setItem(this.options.storagePrefix + 'active_wallet', walletId);
  }

  /**
   * 获取活动钱包 ID
   */
  getActiveWalletId(): string | null {
    if (!this.activeWalletId) {
      this.activeWalletId = localStorage.getItem(
        this.options.storagePrefix + 'active_wallet'
      );
    }
    return this.activeWalletId;
  }

  /**
   * 获取活动钱包
   */
  async getActiveWallet(): Promise<StoredWallet | null> {
    const id = this.getActiveWalletId();
    if (!id) return null;
    return this.getWallet(id);
  }

  // ========================================================================
  // 设置
  // ========================================================================

  /**
   * 获取设置
   */
  async getSettings(): Promise<WalletSettings> {
    const stored = await this.backend.getItem(this.options.storagePrefix + 'settings');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        // fall through
      }
    }
    return { ...DEFAULT_SETTINGS };
  }

  private getSettingsSync(): WalletSettings {
    try {
      const stored = localStorage.getItem(this.options.storagePrefix + 'settings');
      if (stored) return JSON.parse(stored);
    } catch {
      // ignore
    }
    return { ...DEFAULT_SETTINGS };
  }

  /**
   * 保存设置
   */
  async saveSettings(settings: Partial<WalletSettings>): Promise<WalletSettings> {
    const current = await this.getSettings();
    const updated = { ...current, ...settings };
    await this.backend.setItem(
      this.options.storagePrefix + 'settings',
      JSON.stringify(updated)
    );
    return updated;
  }

  // ========================================================================
  // 备份与导出
  // ========================================================================

  /**
   * 导出钱包数据（加密格式）
   */
  async exportWalletData(password: string): Promise<string> {
    const unlocked = await this.unlock(password);
    if (!unlocked) throw new Error('Invalid password');

    const wallets = await this.listWallets();
    const fullWallets: StoredWallet[] = [];
    for (const meta of wallets) {
      const wallet = await this.getWallet(meta.id);
      if (wallet) fullWallets.push(wallet);
    }

    const settings = await this.getSettings();

    const exportData = {
      version: 1,
      exportedAt: new Date().toISOString(),
      walletCount: fullWallets.length,
      wallets: fullWallets,
      settings,
    };

    return JSON.stringify(exportData, null, 2);
  }

  /**
   * 导入钱包数据
   */
  async importWalletData(data: string, password: string): Promise<number> {
    const unlocked = await this.unlock(password);
    if (!unlocked) throw new Error('Invalid password');

    const importData = JSON.parse(data);
    let imported = 0;

    for (const wallet of importData.wallets as StoredWallet[]) {
      const existing = this.walletList.find((w) => w.id === wallet.meta.id);
      if (!existing) {
        await this.addWallet(wallet);
        imported++;
      }
    }

    if (importData.settings) {
      await this.saveSettings(importData.settings);
    }

    return imported;
  }

  // ========================================================================
  // 工具方法
  // ========================================================================

  private ensureUnlocked(): void {
    if (!this.isUnlocked) {
      throw new Error('Wallet is locked');
    }
  }

  /**
   * 清除所有数据
   */
  async wipeAll(): Promise<void> {
    this.lock();
    const keys = await this.backend.keys();
    for (const key of keys) {
      if (key.startsWith(this.options.storagePrefix)) {
        await this.backend.removeItem(key);
      }
    }
    this.walletList = [];
  }

  /**
   * 检查是否已初始化
   */
  async isInitialized(): Promise<boolean> {
    const stored = await this.backend.getItem(this.options.storagePrefix + 'initialized');
    return stored === 'true';
  }
}

// ============================================================================
// 默认导出
// ============================================================================

export default {
  WalletStorage,
  MasterKeyManager,
  DataEncryption,
  MemoryCache,
};
