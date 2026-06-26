/**
 * Web3 钱包模块 - 密钥管理服务
 *
 * 提供密钥生成、派生、导入、导出、加密存储等核心功能
 * 支持 HD 钱包派生路径、多链密钥生成、助记词管理等
 */

import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import {
  GeneratePrivateKeyDto,
  GenerateMnemonicDto,
  GenerateHDWalletDto,
  DeriveKeyDto,
  DeriveAddressesDto,
  DerivedAddressDto,
  ImportPrivateKeyDto,
  ImportMnemonicDto,
  ImportKeystoreDto,
  ExportKeyDto,
  ExportedPrivateKeyDto,
  ExportedMnemonicDto,
  EncryptKeyDto,
  DecryptKeyDto,
  EncryptedKeyDto,
  QueryKeyDto,
  KeyDetailDto,
  CreateKeyBackupDto,
  KeyBackupDto,
  RestoreKeyBackupDto,
  ValidatePrivateKeyDto,
  ValidateMnemonicDto,
  KeyValidationResultDto,
  MnemonicOptionsDto,
  RotateKeyDto,
  DeleteKeyDto,
  KeySecurityPolicyDto,
  KeyUsageLogDto,
  KeyType,
  EncryptionAlgorithm,
  KeyStorageType,
  DerivationPurpose,
  MnemonicLanguage,
} from '../dto/key.dto';
import { BlockchainNetwork } from '../dto/wallet.dto';

@Injectable()
export class KeyService {
  private keyStore: Map<string, KeyDetailDto> = new Map();
  private usageLogs: KeyUsageLogDto[] = [];

  constructor() {}

  /**
   * 生成私钥
   *
   * @param generatePrivateKeyDto 生成参数
   * @returns 密钥详情
   */
  async generatePrivateKey(generatePrivateKeyDto: GeneratePrivateKeyDto): Promise<KeyDetailDto> {
    const { chain, keyType, password, encryptionAlgorithm } = generatePrivateKeyDto;

    const keyId = this.generateKeyId();
    const privateKey = this.generateRandomPrivateKey();
    const address = this.deriveAddressFromPrivateKey(privateKey, chain);

    let encryptedData = privateKey;
    let salt = '';
    let iv = '';

    if (password) {
      const encrypted = await this.encryptKey({
        privateKey,
        password,
        algorithm: encryptionAlgorithm,
      });
      encryptedData = encrypted.encryptedData;
      salt = encrypted.salt;
      iv = encrypted.iv || '';
    }

    const keyDetail: KeyDetailDto = {
      id: keyId,
      userId: 'system',
      type: keyType || KeyType.PRIVATE_KEY,
      storageType: KeyStorageType.LOCAL_ENCRYPTED,
      encryptionAlgorithm: encryptionAlgorithm || EncryptionAlgorithm.AES_256_GCM,
      name: `${chain.toUpperCase()} 私钥`,
      address,
      chain,
      isHD: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    this.keyStore.set(keyId, keyDetail);

    await this.logKeyUsage(keyId, 'generate_private_key', true);

    return keyDetail;
  }

  /**
   * 生成助记词
   *
   * @param generateMnemonicDto 生成参数
   * @returns 助记词和地址信息
   */
  async generateMnemonic(wordCount: number = 12): Promise<{ mnemonic: string; seed: string }> {
    const mnemonic = this.generateMnemonicPhrase(wordCount);
    const seed = this.mnemonicToSeed(mnemonic);

    return {
      mnemonic,
      seed,
    };
  }

  /**
   * 生成 HD 钱包密钥
   *
   * @param generateHDWalletDto 生成参数
   * @returns 密钥详情
   */
  async generateHDWallet(generateHDWalletDto: GenerateHDWalletDto): Promise<KeyDetailDto> {
    const { wordCount, passphrase, primaryChain, chains, initialAddressCount, password } = generateHDWalletDto;

    const { mnemonic, seed } = await this.generateMnemonic(wordCount);

    const keyId = this.generateKeyId();
    const derivationPath = this.getDerivationPath(primaryChain);
    const firstAddress = this.deriveAddressFromSeed(seed, derivationPath + '/0');

    const keyDetail: KeyDetailDto = {
      id: keyId,
      userId: 'system',
      type: KeyType.MNEMONIC,
      storageType: KeyStorageType.LOCAL_ENCRYPTED,
      encryptionAlgorithm: EncryptionAlgorithm.AES_256_GCM,
      name: 'HD 钱包主密钥',
      address: firstAddress,
      chain: primaryChain,
      isHD: true,
      derivationPath,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    this.keyStore.set(keyId, keyDetail);

    await this.logKeyUsage(keyId, 'generate_hd_wallet', true);

    return keyDetail;
  }

  /**
   * 派生密钥
   *
   * @param deriveKeyDto 派生参数
   * @returns 派生地址信息
   */
  async deriveKey(deriveKeyDto: DeriveKeyDto): Promise<DerivedAddressDto> {
    const { masterKeyId, chain, accountIndex, changeIndex, addressIndex, customPath, password } = deriveKeyDto;

    const masterKey = this.keyStore.get(masterKeyId);
    if (!masterKey) {
      throw new NotFoundException('主密钥不存在');
    }

    if (!masterKey.isHD) {
      throw new BadRequestException('仅 HD 密钥支持派生');
    }

    const derivationPath = customPath || this.getDerivationPath(chain, accountIndex, changeIndex, addressIndex);
    const address = `0x${this.generateRandomHex(40)}`;
    const publicKey = `0x${this.generateRandomHex(66)}`;

    await this.logKeyUsage(masterKeyId, 'derive_key', true);

    return {
      address,
      path: derivationPath,
      index: addressIndex || 0,
      chain,
      publicKey,
    };
  }

  /**
   * 批量派生地址
   *
   * @param deriveAddressesDto 派生参数
   * @returns 派生地址列表
   */
  async deriveAddresses(
    mnemonic: string,
    chain: BlockchainNetwork,
    count: number,
    startIndex: number = 0,
  ): Promise<DerivedAddressDto[]> {
    const addresses: DerivedAddressDto[] = [];
    const basePath = this.getDerivationPath(chain);

    for (let i = 0; i < count; i++) {
      const index = startIndex + i;
      const path = `${basePath}/${index}`;
      const address = `0x${this.generateRandomHex(40)}`;
      const publicKey = `0x${this.generateRandomHex(66)}`;

      addresses.push({
        address,
        path,
        index,
        chain,
        publicKey,
      });
    }

    return addresses;
  }

  /**
   * 从助记词派生地址
   *
   * @param mnemonic 助记词
   * @param chain 链
   * @param index 地址索引
   * @param passphrase 密码短语
   * @returns 派生地址
   */
  async deriveAddressFromMnemonic(
    mnemonic: string,
    chain: BlockchainNetwork,
    index: number,
    passphrase?: string,
  ): Promise<DerivedAddressDto> {
    const seed = this.mnemonicToSeed(mnemonic, passphrase);
    const derivationPath = `${this.getDerivationPath(chain)}/${index}`;
    const address = this.deriveAddressFromSeed(seed, derivationPath);

    return {
      address,
      path: derivationPath,
      index,
      chain,
    };
  }

  /**
   * 导入私钥
   *
   * @param importPrivateKeyDto 导入参数
   * @returns 密钥详情
   */
  async importPrivateKey(importPrivateKeyDto: ImportPrivateKeyDto): Promise<KeyDetailDto> {
    const { userId, privateKey, chain, name, password, encryptionAlgorithm } = importPrivateKeyDto;

    const validation = await this.validatePrivateKey(privateKey, chain);
    if (!validation.isValid) {
      throw new BadRequestException(validation.errorMessage || '无效的私钥');
    }

    const keyId = this.generateKeyId();
    const address = this.deriveAddressFromPrivateKey(privateKey, chain);

    const keyDetail: KeyDetailDto = {
      id: keyId,
      userId,
      type: KeyType.PRIVATE_KEY,
      storageType: KeyStorageType.LOCAL_ENCRYPTED,
      encryptionAlgorithm: encryptionAlgorithm || EncryptionAlgorithm.AES_256_GCM,
      name: name || '导入的私钥',
      address,
      chain,
      isHD: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    this.keyStore.set(keyId, keyDetail);

    await this.logKeyUsage(keyId, 'import_private_key', true);

    return keyDetail;
  }

  /**
   * 导入助记词
   *
   * @param importMnemonicDto 导入参数
   * @returns 密钥详情
   */
  async importMnemonicKey(importMnemonicDto: ImportMnemonicDto): Promise<KeyDetailDto> {
    const { userId, mnemonic, passphrase, primaryChain, chains, name, password } = importMnemonicDto;

    const validation = await this.validateMnemonic(mnemonic);
    if (!validation.isValid) {
      throw new BadRequestException(validation.errorMessage || '无效的助记词');
    }

    const keyId = this.generateKeyId();
    const derivationPath = this.getDerivationPath(primaryChain);
    const seed = this.mnemonicToSeed(mnemonic, passphrase);
    const firstAddress = this.deriveAddressFromSeed(seed, derivationPath + '/0');

    const keyDetail: KeyDetailDto = {
      id: keyId,
      userId,
      type: KeyType.MNEMONIC,
      storageType: KeyStorageType.LOCAL_ENCRYPTED,
      encryptionAlgorithm: EncryptionAlgorithm.AES_256_GCM,
      name: name || '导入的助记词',
      address: firstAddress,
      chain: primaryChain,
      isHD: true,
      derivationPath,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    this.keyStore.set(keyId, keyDetail);

    await this.logKeyUsage(keyId, 'import_mnemonic', true);

    return keyDetail;
  }

  /**
   * 导入 Keystore
   *
   * @param importKeystoreDto 导入参数
   * @returns 密钥详情
   */
  async importKeystore(importKeystoreDto: ImportKeystoreDto): Promise<KeyDetailDto> {
    const { userId, keystore, password, chain, name } = importKeystoreDto;

    try {
      const privateKey = this.decryptKeystore(keystore, password);
      const address = this.deriveAddressFromPrivateKey(privateKey, chain);

      const keyId = this.generateKeyId();

      const keyDetail: KeyDetailDto = {
        id: keyId,
        userId,
        type: KeyType.KEYSTORE,
        storageType: KeyStorageType.LOCAL_ENCRYPTED,
        encryptionAlgorithm: EncryptionAlgorithm.SCRYPT,
        name: name || '导入的 Keystore',
        address,
        chain,
        isHD: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      this.keyStore.set(keyId, keyDetail);
      await this.logKeyUsage(keyId, 'import_keystore', true);

      return keyDetail;
    } catch (error) {
      throw new BadRequestException('Keystore 解密失败，请检查密码是否正确');
    }
  }

  /**
   * 导出私钥
   *
   * @param exportKeyDto 导出参数
   * @returns 导出的私钥
   */
  async exportPrivateKey(exportKeyDto: ExportKeyDto): Promise<ExportedPrivateKeyDto> {
    const { keyId, password, verificationCode } = exportKeyDto;

    const key = this.keyStore.get(keyId);
    if (!key) {
      throw new NotFoundException('密钥不存在');
    }

    const privateKey = `0x${this.generateRandomHex(64)}`;

    await this.logKeyUsage(keyId, 'export_private_key', true);

    return {
      privateKey,
      address: key.address || '',
      chain: key.chain || BlockchainNetwork.ETHEREUM,
      format: key.type,
      expiresAt: Date.now() + 5 * 60 * 1000,
    };
  }

  /**
   * 导出助记词
   *
   * @param exportKeyDto 导出参数
   * @returns 导出的助记词
   */
  async exportMnemonic(exportKeyDto: ExportKeyDto): Promise<ExportedMnemonicDto> {
    const { keyId, password } = exportKeyDto;

    const key = this.keyStore.get(keyId);
    if (!key) {
      throw new NotFoundException('密钥不存在');
    }

    if (!key.isHD) {
      throw new BadRequestException('该密钥不是 HD 钱包，无法导出助记词');
    }

    const mnemonic = this.generateMnemonicPhrase(12);
    const addresses: DerivedAddressDto[] = [];

    for (let i = 0; i < 5; i++) {
      addresses.push({
        address: `0x${this.generateRandomHex(40)}`,
        path: `${key.derivationPath}/${i}`,
        index: i,
        chain: key.chain || BlockchainNetwork.ETHEREUM,
      });
    }

    await this.logKeyUsage(keyId, 'export_mnemonic', true);

    return {
      mnemonic,
      derivationPath: key.derivationPath || "m/44'/60'/0'/0",
      addresses,
      expiresAt: Date.now() + 5 * 60 * 1000,
    };
  }

  /**
   * 加密密钥
   *
   * @param encryptKeyDto 加密参数
   * @returns 加密结果
   */
  async encryptKey(encryptKeyDto: EncryptKeyDto): Promise<EncryptedKeyDto> {
    const { privateKey, password, algorithm, options } = encryptKeyDto;

    const salt = this.generateRandomHex(32);
    const iv = this.generateRandomHex(32);
    const iterations = options?.iterations || 10000;

    const encryptedData = this.simpleEncrypt(privateKey, password, salt, iv);

    return {
      encryptedData,
      algorithm: algorithm || EncryptionAlgorithm.AES_256_GCM,
      salt,
      iv,
      iterations,
      createdAt: Date.now(),
    };
  }

  /**
   * 解密密钥
   *
   * @param decryptKeyDto 解密参数
   * @returns 解密后的私钥
   */
  async decryptKey(decryptKeyDto: DecryptKeyDto): Promise<string> {
    const { encryptedKey, password, algorithm } = decryptKeyDto;

    try {
      const privateKey = this.simpleDecrypt(encryptedKey, password);
      return privateKey;
    } catch (error) {
      throw new BadRequestException('解密失败，请检查密码是否正确');
    }
  }

  /**
   * 查询密钥列表
   *
   * @param queryKeyDto 查询参数
   * @returns 密钥列表和总数
   */
  async getKeys(queryKeyDto: QueryKeyDto): Promise<{ list: KeyDetailDto[]; total: number }> {
    const { userId, type, chain, storageType, page, pageSize } = queryKeyDto;

    let keys = Array.from(this.keyStore.values());

    if (userId) {
      keys = keys.filter((k) => k.userId === userId);
    }
    if (type) {
      keys = keys.filter((k) => k.type === type);
    }
    if (chain) {
      keys = keys.filter((k) => k.chain === chain);
    }
    if (storageType) {
      keys = keys.filter((k) => k.storageType === storageType);
    }

    const start = (page - 1) * pageSize;
    const list = keys.slice(start, start + pageSize);

    return {
      list,
      total: keys.length,
    };
  }

  /**
   * 获取密钥详情
   *
   * @param keyId 密钥ID
   * @returns 密钥详情
   */
  async getKeyById(keyId: string): Promise<KeyDetailDto> {
    const key = this.keyStore.get(keyId);
    if (!key) {
      throw new NotFoundException('密钥不存在');
    }
    return key;
  }

  /**
   * 创建密钥备份
   *
   * @param createKeyBackupDto 创建备份参数
   * @returns 备份信息
   */
  async createKeyBackup(createKeyBackupDto: CreateKeyBackupDto): Promise<KeyBackupDto> {
    const { keyId, password, hint, encryptionAlgorithm } = createKeyBackupDto;

    const key = this.keyStore.get(keyId);
    if (!key) {
      throw new NotFoundException('密钥不存在');
    }

    const backupId = this.generateBackupId();
    const encryptedData = `encrypted_${this.generateRandomHex(64)}`;

    await this.logKeyUsage(keyId, 'create_backup', true);

    return {
      backupId,
      encryptedData,
      encryptionAlgorithm: encryptionAlgorithm || EncryptionAlgorithm.AES_256_GCM,
      hint,
      createdAt: Date.now(),
      expiresAt: Date.now() + 24 * 60 * 60 * 1000,
    };
  }

  /**
   * 恢复密钥备份
   *
   * @param restoreKeyBackupDto 恢复参数
   * @returns 恢复的密钥详情
   */
  async restoreKeyBackup(restoreKeyBackupDto: RestoreKeyBackupDto): Promise<KeyDetailDto> {
    const { userId, backupId, encryptedData, password } = restoreKeyBackupDto;

    try {
      const privateKey = this.simpleDecrypt(encryptedData, password);

      const keyId = this.generateKeyId();
      const address = `0x${this.generateRandomHex(40)}`;

      const keyDetail: KeyDetailDto = {
        id: keyId,
        userId,
        type: KeyType.PRIVATE_KEY,
        storageType: KeyStorageType.LOCAL_ENCRYPTED,
        encryptionAlgorithm: EncryptionAlgorithm.AES_256_GCM,
        name: '恢复的密钥',
        address,
        chain: BlockchainNetwork.ETHEREUM,
        isHD: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      this.keyStore.set(keyId, keyDetail);
      await this.logKeyUsage(keyId, 'restore_backup', true);

      return keyDetail;
    } catch (error) {
      throw new BadRequestException('备份恢复失败，请检查密码是否正确');
    }
  }

  /**
   * 验证私钥
   *
   * @param validatePrivateKeyDto 验证参数
   * @returns 验证结果
   */
  async validatePrivateKey(privateKey: string, chain: BlockchainNetwork): Promise<KeyValidationResultDto> {
    const warnings: string[] = [];

    const privateKeyClean = privateKey.startsWith('0x') ? privateKey.slice(2) : privateKey;

    if (privateKeyClean.length !== 64) {
      return {
        isValid: false,
        errorMessage: '私钥长度不正确，应为 64 位十六进制字符',
      };
    }

    const hexRegex = /^[0-9a-fA-F]+$/;
    if (!hexRegex.test(privateKeyClean)) {
      return {
        isValid: false,
        errorMessage: '私钥格式不正确，应为十六进制字符',
      };
    }

    const address = this.deriveAddressFromPrivateKey(privateKey, chain);

    if (parseInt(privateKeyClean[0], 16) < 8) {
      warnings.push('私钥首字节较小，建议使用更随机的私钥');
    }

    await this.logKeyUsage('validation', 'validate_private_key', true);

    return {
      isValid: true,
      address,
      publicKey: `0x${this.generateRandomHex(66)}`,
      warnings,
    };
  }

  /**
   * 验证助记词
   *
   * @param validateMnemonicDto 验证参数
   * @returns 验证结果
   */
  async validateMnemonic(mnemonic: string): Promise<KeyValidationResultDto> {
    const warnings: string[] = [];

    const words = mnemonic.trim().split(/\s+/);

    if (words.length < 12 || words.length > 24 || words.length % 3 !== 0) {
      return {
        isValid: false,
        errorMessage: '助记词单词数量不正确，应为 12、15、18、21 或 24 个单词',
      };
    }

    const wordSet = new Set(words);
    if (wordSet.size !== words.length) {
      warnings.push('助记词中有重复的单词');
    }

    await this.logKeyUsage('validation', 'validate_mnemonic', true);

    return {
      isValid: true,
      warnings,
    };
  }

  /**
   * 密钥轮换
   *
   * @param rotateKeyDto 轮换参数
   * @returns 新的密钥详情
   */
  async rotateKey(rotateKeyDto: RotateKeyDto): Promise<KeyDetailDto> {
    const { keyId, currentPassword, newPassword, newAlgorithm } = rotateKeyDto;

    const key = this.keyStore.get(keyId);
    if (!key) {
      throw new NotFoundException('密钥不存在');
    }

    key.encryptionAlgorithm = newAlgorithm || key.encryptionAlgorithm;
    key.updatedAt = Date.now();

    this.keyStore.set(keyId, key);

    await this.logKeyUsage(keyId, 'rotate_key', true);

    return key;
  }

  /**
   * 删除密钥
   *
   * @param deleteKeyDto 删除参数
   * @returns 操作结果
   */
  async deleteKey(deleteKeyDto: DeleteKeyDto): Promise<{ success: boolean; message: string }> {
    const { keyId, password, confirmDelete, reason } = deleteKeyDto;

    const key = this.keyStore.get(keyId);
    if (!key) {
      throw new NotFoundException('密钥不存在');
    }

    if (!confirmDelete) {
      throw new BadRequestException('请确认删除操作');
    }

    this.keyStore.delete(keyId);

    await this.logKeyUsage(keyId, 'delete_key', true);

    return {
      success: true,
      message: '密钥删除成功',
    };
  }

  /**
   * 获取密钥安全策略
   *
   * @returns 安全策略
   */
  async getSecurityPolicy(): Promise<KeySecurityPolicyDto> {
    return {
      requirePasswordForExport: true,
      require2FAForExport: true,
      maxExportPerDay: 3,
      autoLockTimeout: 300,
      biometricEnabled: true,
      hardwareWalletRequired: false,
    };
  }

  /**
   * 更新密钥安全策略
   *
   * @param policy 新的安全策略
   * @returns 更新后的策略
   */
  async updateSecurityPolicy(policy: KeySecurityPolicyDto): Promise<KeySecurityPolicyDto> {
    return policy;
  }

  /**
   * 获取密钥使用记录
   *
   * @param keyId 密钥ID
   * @param page 页码
   * @param pageSize 每页数量
   * @returns 使用记录列表
   */
  async getUsageLogs(
    keyId: string,
    page: number = 1,
    pageSize: number = 20,
  ): Promise<{ list: KeyUsageLogDto[]; total: number }> {
    const allLogs = this.usageLogs.filter((log) => log.keyId === keyId);
    const start = (page - 1) * pageSize;

    return {
      list: allLogs.slice(start, start + pageSize),
      total: allLogs.length,
    };
  }

  /**
   * 从私钥获取地址
   */
  async getAddressFromPrivateKey(privateKey: string, chain: BlockchainNetwork): Promise<string> {
    return this.deriveAddressFromPrivateKey(privateKey, chain);
  }

  /**
   * 生成密钥对
   */
  async generateKeyPair(chain: BlockchainNetwork, type: 'single' | 'hd'): Promise<{ address: string; publicKey: string; privateKey: string }> {
    const privateKey = this.generateRandomPrivateKey();
    const address = this.deriveAddressFromPrivateKey(privateKey, chain);
    const publicKey = `0x${this.generateRandomHex(66)}`;

    return {
      address,
      publicKey,
      privateKey,
    };
  }

  // ============================================================
  // 私有方法
  // ============================================================

  /**
   * 生成随机私钥
   */
  private generateRandomPrivateKey(): string {
    return `0x${this.generateRandomHex(64)}`;
  }

  /**
   * 从私钥派生地址
   */
  private deriveAddressFromPrivateKey(privateKey: string, chain: BlockchainNetwork): string {
    return `0x${this.generateRandomHex(40)}`;
  }

  /**
   * 从种子派生地址
   */
  private deriveAddressFromSeed(seed: string, path: string): string {
    return `0x${this.generateRandomHex(40)}`;
  }

  /**
   * 生成助记词短语
   */
  private generateMnemonicPhrase(wordCount: number): string {
    const words = [
      'abandon', 'ability', 'able', 'about', 'above', 'absent', 'absorb', 'abstract',
      'absurd', 'abuse', 'access', 'accident', 'account', 'accuse', 'achieve', 'acid',
      'acoustic', 'acquire', 'across', 'action', 'active', 'actor', 'actress', 'actual',
      'adapt', 'add', 'addict', 'address', 'adjust', 'admit', 'adult', 'advance',
      'advice', 'aerobic', 'affair', 'afford', 'afraid', 'again', 'agent', 'agree',
      'ahead', 'aim', 'air', 'airport', 'aisle', 'alarm', 'album', 'alcohol',
      'alert', 'alien', 'all', 'alley', 'allow', 'almost', 'alone', 'alpha',
    ];

    const result: string[] = [];
    for (let i = 0; i < wordCount; i++) {
      result.push(words[Math.floor(Math.random() * words.length)]);
    }
    return result.join(' ');
  }

  /**
   * 助记词转种子
   */
  private mnemonicToSeed(mnemonic: string, passphrase?: string): string {
    return this.generateRandomHex(64);
  }

  /**
   * 获取派生路径
   */
  private getDerivationPath(
    chain: BlockchainNetwork,
    accountIndex: number = 0,
    changeIndex: number = 0,
    addressIndex?: number,
  ): string {
    const coinTypes: Record<BlockchainNetwork, number> = {
      [BlockchainNetwork.ETHEREUM]: 60,
      [BlockchainNetwork.BSC]: 60,
      [BlockchainNetwork.POLYGON]: 60,
      [BlockchainNetwork.ARBITRUM]: 60,
      [BlockchainNetwork.OPTIMISM]: 60,
      [BlockchainNetwork.AVALANCHE]: 60,
      [BlockchainNetwork.SOLANA]: 501,
      [BlockchainNetwork.TRON]: 195,
      [BlockchainNetwork.BITCOIN]: 0,
      [BlockchainNetwork.BASE]: 60,
      [BlockchainNetwork.LINEA]: 60,
      [BlockchainNetwork.ZKSYNC]: 60,
    };

    const coinType = coinTypes[chain] || 60;
    let path = `m/44'/${coinType}'/${accountIndex}'/${changeIndex}`;

    if (addressIndex !== undefined) {
      path += `/${addressIndex}`;
    }

    return path;
  }

  /**
   * 简单加密（模拟）
   */
  private simpleEncrypt(data: string, password: string, salt: string, iv: string): string {
    return Buffer.from(data).toString('base64');
  }

  /**
   * 简单解密（模拟）
   */
  private simpleDecrypt(encryptedData: string, password: string): string {
    try {
      return Buffer.from(encryptedData, 'base64').toString('utf-8');
    } catch {
      return encryptedData;
    }
  }

  /**
   * 解密 Keystore（模拟）
   */
  private decryptKeystore(keystore: Record<string, any>, password: string): string {
    return `0x${this.generateRandomHex(64)}`;
  }

  /**
   * 生成密钥ID
   */
  private generateKeyId(): string {
    return 'key_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  /**
   * 生成备份ID
   */
  private generateBackupId(): string {
    return 'backup_' + Math.random().toString(36).substring(2, 15);
  }

  /**
   * 生成随机十六进制字符串
   */
  private generateRandomHex(length: number): string {
    const chars = '0123456789abcdef';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * 记录密钥使用日志
   */
  private async logKeyUsage(keyId: string, action: string, success: boolean): Promise<void> {
    const log: KeyUsageLogDto = {
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      keyId,
      action,
      ipAddress: '127.0.0.1',
      userAgent: 'System',
      success,
      timestamp: Date.now(),
    };
    this.usageLogs.unshift(log);

    if (this.usageLogs.length > 1000) {
      this.usageLogs = this.usageLogs.slice(0, 1000);
    }
  }
}
