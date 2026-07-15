import {
  CreateMnemonicKeyInput,
  ImportMnemonicInput,
  ImportPrivateKeyInput,
  SignMessageInput,
  SignTypedDataInput,
  SignEvmTransactionInput,
  SignSolanaTransactionInput,
  SignBitcoinTransactionInput,
  SignTronTransactionInput,
  SignResult,
  SignType,
  KeyMaterialRecord,
  WalletKeyType,
  ChainType,
  DerivedEvmAccount,
  DerivedSolanaAccount,
  DerivedBitcoinAccount,
  DerivedTronAccount,
  WatchOnlyWalletInput,
  HardwareWalletInput,
  MPCWalletInput,
  ExportKeyInput,
  ExportKeyResult,
  VerifyBackupInput,
  VerifyBackupResult,
  SignAuditLogEntry,
  KeyRotationInput,
  DestroyKeyInput,
  DestroyKeyResult,
  MultiPasswordDerivationInput,
  HardwareWalletSignInput,
  MPCSignInput,
} from './key.types';
import { WalletKeyErrors } from './key.errors';
import { keystoreCrypto } from './keystore.crypto';
import { SolanaSigner } from './solana-signer';
import { BitcoinSigner } from './bitcoin-signer';
import { TronSigner } from './tron-signer';
import { keyRiskService, KeyRiskContext } from './key-risk.service';
import { generateMnemonic, validateMnemonic, mnemonicToSeed } from '../core/mnemonic';
import { fromSeed, deriveChild } from '../core/hd-wallet';
import { toChecksumAddress } from '../core/private-key';
import { Keypair, PublicKey } from '@solana/web3.js';
import bs58 from 'bs58';
import { safeJsonParse } from '@/lib/security/safe-json-parse';

export class KeyService {
  private readonly keyMaterials: Map<string, KeyMaterialRecord> = new Map();
  private readonly auditLogs: SignAuditLogEntry[] = [];
  // Solana-first: EVM 签名器已废弃
  // private evmSignerCache: Map<number, EvmSigner> = new Map();
  private solanaSigner: SolanaSigner = new SolanaSigner();
  private bitcoinSignerCache: Map<string, BitcoinSigner> = new Map();
  private tronSigner: TronSigner = new TronSigner();
  private hardwareWalletAdapters: Map<string, HardwareWalletAdapter> = new Map();
  private mpcProviders: Map<string, MPCProviderAdapter> = new Map();
  private exportEnabled: boolean = true;
  private destroyedWallets: Set<string> = new Set();

  async createMnemonicKey(input: CreateMnemonicKeyInput): Promise<KeyMaterialRecord> {
    const strength = input.strength || 128;
    const mnemonic = generateMnemonic({ length: this.strengthToWordCount(strength) });

    const encryptedMnemonic = keystoreCrypto.encryptMnemonic(
      mnemonic.mnemonic,
      input.password,
    );

    const id = this.generateId();
    const record: KeyMaterialRecord = {
      id,
      walletId: input.walletId,
      keyType: 'mnemonic',
      encryptionVersion: 'v1',
      encryptedMnemonic,
      derivationRoot: "m/44'/60'/0'/0/0",
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.keyMaterials.set(id, record);
    return record;
  }

  async importMnemonic(input: ImportMnemonicInput): Promise<KeyMaterialRecord> {
    const validation = validateMnemonic(input.mnemonic);
    if (!validation.valid) {
      throw WalletKeyErrors.INVALID_MNEMONIC((validation as Extract<typeof validation, { valid: false }>).error);
    }

    const encryptedMnemonic = keystoreCrypto.encryptMnemonic(
      input.mnemonic,
      input.password,
    );

    const id = this.generateId();
    const record: KeyMaterialRecord = {
      id,
      walletId: input.walletId,
      keyType: 'mnemonic',
      encryptionVersion: 'v1',
      encryptedMnemonic,
      derivationRoot: "m/44'/60'/0'/0/0",
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.keyMaterials.set(id, record);
    return record;
  }

  async importPrivateKey(input: ImportPrivateKeyInput): Promise<KeyMaterialRecord> {
    if (!input.privateKey || input.privateKey.length < 64) {
      throw WalletKeyErrors.INVALID_PRIVATE_KEY();
    }

    const encryptedPrivateKey = keystoreCrypto.encryptPrivateKey(
      input.privateKey,
      input.password,
    );

    const id = this.generateId();
    const record: KeyMaterialRecord = {
      id,
      walletId: input.walletId,
      keyType: 'private_key',
      encryptionVersion: 'v1',
      encryptedPrivateKey,
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.keyMaterials.set(id, record);
    return record;
  }

  async getKeyMaterial(walletId: string): Promise<KeyMaterialRecord> {
    for (const record of this.keyMaterials.values()) {
      if (record.walletId === walletId && record.status === 'active') {
        return record;
      }
    }
    throw WalletKeyErrors.KEY_MATERIAL_NOT_FOUND(walletId);
  }

  async deriveEvmAddress(
    walletId: string,
    password: string,
    index: number = 0,
  ): Promise<DerivedEvmAccount> {
    const keyMaterial = await this.getKeyMaterial(walletId);

    if (keyMaterial.keyType === 'watch_only') {
      throw WalletKeyErrors.WATCH_ONLY_CANNOT_SIGN();
    }

    if (keyMaterial.keyType === 'mnemonic' && keyMaterial.encryptedMnemonic) {
      const mnemonic = keystoreCrypto.decryptMnemonic(
        keyMaterial.encryptedMnemonic,
        password,
      );
      const seed = await mnemonicToSeed(mnemonic);
      const root = fromSeed(seed);
      const path = `m/44'/60'/0'/0/${index}`;
      const child = this.derivePath(root, path);
      const privateKeyHex = Buffer.from(child.privateKey).toString('hex');
      const publicKeyHex = Buffer.from(child.publicKey).toString('hex');
      const address = this.privateKeyToEvmAddress(privateKeyHex);

      return {
        address,
        publicKey: publicKeyHex,
        privateKey: privateKeyHex,
        derivationPath: path,
      };
    }

    if (keyMaterial.keyType === 'private_key' && keyMaterial.encryptedPrivateKey) {
      const privateKey = keystoreCrypto.decryptPrivateKey(
        keyMaterial.encryptedPrivateKey,
        password,
      );
      const publicKey = this.privateKeyToPublicKey(privateKey);
      const address = this.privateKeyToEvmAddress(privateKey);

      return {
        address,
        publicKey,
        privateKey,
        derivationPath: 'imported',
      };
    }

    throw WalletKeyErrors.KEY_MATERIAL_NOT_FOUND(walletId);
  }

  async deriveSolanaAddress(
    walletId: string,
    password: string,
    index: number = 0,
  ): Promise<DerivedSolanaAccount> {
    const keyMaterial = await this.getKeyMaterial(walletId);

    if (keyMaterial.keyType === 'mnemonic' && keyMaterial.encryptedMnemonic) {
      const mnemonic = keystoreCrypto.decryptMnemonic(
        keyMaterial.encryptedMnemonic,
        password,
      );
      const seed = await mnemonicToSeed(mnemonic);
      const root = fromSeed(seed);
      const path = `m/44'/501'/0'/0/${index}`;
      const child = this.derivePath(root, path);
      const keypair = Keypair.fromSeed(Buffer.from(child.privateKey));
      const publicKey = keypair.publicKey.toBase58();
      const privateKey = bs58.encode(keypair.secretKey);

      return {
        address: publicKey,
        publicKey,
        privateKey,
        derivationPath: path,
      };
    }

    throw WalletKeyErrors.KEY_MATERIAL_NOT_FOUND(walletId);
  }

  async deriveBitcoinAddress(
    walletId: string,
    password: string,
    index: number = 0,
  ): Promise<DerivedBitcoinAccount> {
    const keyMaterial = await this.getKeyMaterial(walletId);

    if (keyMaterial.keyType === 'mnemonic' && keyMaterial.encryptedMnemonic) {
      const mnemonic = keystoreCrypto.decryptMnemonic(
        keyMaterial.encryptedMnemonic,
        password,
      );
      const seed = await mnemonicToSeed(mnemonic);
      const root = fromSeed(seed);
      const path = `m/84'/0'/0'/0/${index}`;
      const child = this.derivePath(root, path);
      const privateKeyHex = Buffer.from(child.privateKey).toString('hex');
      const publicKey = Buffer.from(child.publicKey).toString('hex');
      const address = this.publicKeyToBitcoinAddress(publicKey);
      const wif = this.privateKeyToWif(privateKeyHex);

      return {
        address,
        publicKey,
        privateKey: privateKeyHex,
        wif,
        derivationPath: path,
        scriptType: 'native-segwit',
      };
    }

    throw WalletKeyErrors.KEY_MATERIAL_NOT_FOUND(walletId);
  }

  async deriveTronAddress(
    walletId: string,
    password: string,
    index: number = 0,
  ): Promise<DerivedTronAccount> {
    const evmAccount = await this.deriveEvmAddress(walletId, password, index);
    const address = this.evmAddressToTronAddress(evmAccount.address);

    return {
      address,
      publicKey: evmAccount.publicKey,
      privateKey: evmAccount.privateKey,
      derivationPath: evmAccount.derivationPath,
    };
  }

  /**
   * ⚠️ Solana-first 架构：EVM 已废弃
   */
  async signEvmMessage(input: SignMessageInput): Promise<SignResult> {
    void input;
    throw new Error(
      'EVM is deprecated under Solana-first architecture. ' +
      'Use signSolanaMessage or signSolanaTransaction. ' +
      'See: docs/工业级最终方案：Solana-first 统一生态架构.md §0'
    );
  }

  /**
   * ⚠️ Solana-first 架构：EVM 已废弃
   */
  async signEvmTypedData(input: SignTypedDataInput): Promise<SignResult> {
    void input;
    throw new Error(
      'EVM typed data signing is deprecated under Solana-first architecture. ' +
      'Use Solana signing. See: docs/工业级最终方案：Solana-first 统一生态架构.md §0'
    );
  }

  /**
   * ⚠️ Solana-first 架构：EVM 已废弃
   */
  async signEvmTransaction(input: SignEvmTransactionInput): Promise<SignResult> {
    void input;
    throw new Error(
      'EVM transaction signing is deprecated under Solana-first architecture. ' +
      'Use signSolanaTransaction. See: docs/工业级最终方案：Solana-first 统一生态架构.md §0'
    );
  }

  async signSolanaTransaction(input: SignSolanaTransactionInput): Promise<SignResult> {
    const riskAssessment = await this.evaluateSignatureRisk({
      walletId: input.walletId,
      userId: input.userId,
      address: input.address,
      chainType: 'solana',
      signType: 'transaction',
      payload: input.unsignedTx,
    });

    if (!riskAssessment.allowed && riskAssessment.action === 'reject') {
      throw WalletKeyErrors.SIGN_REJECTED_BY_RISK(riskAssessment.reasons.join('; '));
    }

    try {
      const account = await this.deriveSolanaAddress(input.walletId, input.password);
      const result = await this.solanaSigner.signTransaction(input, account.privateKey);

      await this.recordAuditLog({
        walletId: input.walletId,
        userId: input.userId,
        address: input.address,
        chainType: 'solana',
        signType: 'transaction',
        riskScore: riskAssessment.riskScore,
        riskLevel: riskAssessment.riskLevel,
        action: riskAssessment.action,
        success: true,
      });

      return result;
    } catch (error) {
      await this.recordAuditLog({
        walletId: input.walletId,
        userId: input.userId,
        address: input.address,
        chainType: 'solana',
        signType: 'transaction',
        riskScore: riskAssessment.riskScore,
        riskLevel: riskAssessment.riskLevel,
        action: riskAssessment.action,
        success: false,
        errorCode: 'SOLANA_SIGN_FAILED',
      });
      throw error;
    }
  }

  /**
   * 观察钱包：导入观察钱包地址（仅监控，无法签名）
   */
  async importWatchOnlyWallet(input: WatchOnlyWalletInput): Promise<KeyMaterialRecord> {
    if (!input.address) {
      throw WalletKeyErrors.INVALID_WATCH_ONLY_ADDRESS();
    }

    if (this.destroyedWallets.has(input.walletId)) {
      throw WalletKeyErrors.KEY_ALREADY_DESTROYED(input.walletId);
    }

    const id = this.generateId();
    const record: KeyMaterialRecord = {
      id,
      walletId: input.walletId,
      keyType: 'watch_only',
      encryptionVersion: 'v1',
      publicKey: input.publicKey,
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.keyMaterials.set(id, record);
    return record;
  }

  /**
   * 硬件钱包：注册硬件钱包
   */
  async registerHardwareWallet(input: HardwareWalletInput): Promise<KeyMaterialRecord> {
    if (this.destroyedWallets.has(input.walletId)) {
      throw WalletKeyErrors.KEY_ALREADY_DESTROYED(input.walletId);
    }

    const id = this.generateId();
    const record: KeyMaterialRecord = {
      id,
      walletId: input.walletId,
      keyType: 'hardware',
      encryptionVersion: 'v1',
      keyRef: input.deviceId,
      kmsProvider: input.deviceType,
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.keyMaterials.set(id, record);
    return record;
  }

  /**
   * 硬件钱包：使用硬件钱包签名
   */
  async signWithHardwareWallet(input: HardwareWalletSignInput): Promise<SignResult> {
    const keyMaterial = await this.getKeyMaterial(input.walletId);

    if (keyMaterial.keyType !== 'hardware') {
      throw WalletKeyErrors.HARDWARE_WALLET_ERROR('Not a hardware wallet');
    }

    const deviceType = keyMaterial.kmsProvider;
    const adapter = this.hardwareWalletAdapters.get(deviceType || '');

    if (!adapter) {
      throw WalletKeyErrors.UNSUPPORTED_HARDWARE_DEVICE(deviceType);
    }

    const riskAssessment = await this.evaluateSignatureRisk({
      walletId: input.walletId,
      userId: input.userId,
      address: input.address,
      chainType: input.chainType,
      signType: input.signType,
      payload: input.payload,
    });

    if (!riskAssessment.allowed && riskAssessment.action === 'reject') {
      throw WalletKeyErrors.SIGN_REJECTED_BY_RISK(riskAssessment.reasons.join('; '));
    }

    try {
      const result = await adapter.sign({
        ...input,
        deviceId: keyMaterial.keyRef || '',
      });

      await this.recordAuditLog({
        walletId: input.walletId,
        userId: input.userId,
        address: input.address,
        chainType: input.chainType,
        signType: input.signType,
        riskScore: riskAssessment.riskScore,
        riskLevel: riskAssessment.riskLevel,
        action: riskAssessment.action,
        success: true,
      });

      return result;
    } catch (error) {
      await this.recordAuditLog({
        walletId: input.walletId,
        userId: input.userId,
        address: input.address,
        chainType: input.chainType,
        signType: input.signType,
        riskScore: riskAssessment.riskScore,
        riskLevel: riskAssessment.riskLevel,
        action: riskAssessment.action,
        success: false,
        errorCode: 'HARDWARE_SIGN_FAILED',
      });
      throw WalletKeyErrors.HARDWARE_WALLET_ERROR(error);
    }
  }

  /**
   * 硬件钱包：注册硬件钱包适配器
   */
  registerHardwareAdapter(deviceType: string, adapter: HardwareWalletAdapter): void {
    this.hardwareWalletAdapters.set(deviceType, adapter);
  }

  /**
   * MPC 钱包：注册 MPC 钱包
   */
  async registerMPCWallet(input: MPCWalletInput): Promise<KeyMaterialRecord> {
    if (this.destroyedWallets.has(input.walletId)) {
      throw WalletKeyErrors.KEY_ALREADY_DESTROYED(input.walletId);
    }

    const id = this.generateId();
    const record: KeyMaterialRecord = {
      id,
      walletId: input.walletId,
      keyType: 'mpc',
      encryptionVersion: 'v1',
      keyRef: input.keyRef,
      kmsProvider: input.mpcProvider,
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.keyMaterials.set(id, record);
    return record;
  }

  /**
   * MPC 钱包：使用 MPC 签名
   */
  async signWithMPC(input: MPCSignInput): Promise<SignResult> {
    const keyMaterial = await this.getKeyMaterial(input.walletId);

    if (keyMaterial.keyType !== 'mpc') {
      throw WalletKeyErrors.MPC_SIGNING_ERROR('Not an MPC wallet');
    }

    const provider = keyMaterial.kmsProvider;
    const mpcAdapter = this.mpcProviders.get(provider || '');

    if (!mpcAdapter) {
      throw WalletKeyErrors.MPC_SIGNING_ERROR('MPC provider not configured');
    }

    const riskAssessment = await this.evaluateSignatureRisk({
      walletId: input.walletId,
      userId: input.userId,
      address: input.address,
      chainType: input.chainType,
      signType: input.signType,
      payload: input.payload,
    });

    if (!riskAssessment.allowed && riskAssessment.action === 'reject') {
      throw WalletKeyErrors.SIGN_REJECTED_BY_RISK(riskAssessment.reasons.join('; '));
    }

    try {
      const result = await mpcAdapter.sign({
        ...input,
        keyRef: keyMaterial.keyRef || '',
      });

      await this.recordAuditLog({
        walletId: input.walletId,
        userId: input.userId,
        address: input.address,
        chainType: input.chainType,
        signType: input.signType,
        riskScore: riskAssessment.riskScore,
        riskLevel: riskAssessment.riskLevel,
        action: riskAssessment.action,
        success: true,
      });

      return result;
    } catch (error) {
      await this.recordAuditLog({
        walletId: input.walletId,
        userId: input.userId,
        address: input.address,
        chainType: input.chainType,
        signType: input.signType,
        riskScore: riskAssessment.riskScore,
        riskLevel: riskAssessment.riskLevel,
        action: riskAssessment.action,
        success: false,
        errorCode: 'MPC_SIGN_FAILED',
      });
      throw WalletKeyErrors.MPC_SIGNING_ERROR(error);
    }
  }

  /**
   * MPC 钱包：注册 MPC 提供者适配器
   */
  registerMPCProvider(provider: string, adapter: MPCProviderAdapter): void {
    this.mpcProviders.set(provider, adapter);
  }

  /**
   * 密钥导出：导出密钥材料
   */
  async exportKey(input: ExportKeyInput): Promise<ExportKeyResult> {
    if (!this.exportEnabled) {
      throw WalletKeyErrors.EXPORT_NOT_ALLOWED('Export is disabled by policy');
    }

    if (this.destroyedWallets.has(input.walletId)) {
      throw WalletKeyErrors.KEY_ALREADY_DESTROYED(input.walletId);
    }

    const keyMaterial = await this.getKeyMaterial(input.walletId);

    if (keyMaterial.keyType === 'watch_only') {
      throw WalletKeyErrors.WATCH_ONLY_CANNOT_SIGN();
    }

    if (keyMaterial.keyType === 'hardware' || keyMaterial.keyType === 'mpc') {
      throw WalletKeyErrors.EXPORT_NOT_ALLOWED('Hardware/MPC wallets cannot export private keys');
    }

    if (input.exportType === 'mnemonic' && keyMaterial.encryptedMnemonic) {
      const mnemonic = keystoreCrypto.decryptMnemonic(
        keyMaterial.encryptedMnemonic,
        input.password,
      );

      await this.recordAuditLog({
        walletId: input.walletId,
        userId: input.userId,
        address: input.address || '',
        chainType: input.chainType || 'evm',
        signType: 'message',
        riskScore: 100,
        riskLevel: 'critical',
        action: 'second_confirm',
        success: true,
      });

      return {
        exportType: 'mnemonic',
        data: mnemonic,
        exportedAt: new Date(),
      };
    }

    if (input.exportType === 'private_key' && input.chainType) {
      let privateKey = '';
      let address = '';

      if (keyMaterial.encryptedPrivateKey) {
        privateKey = keystoreCrypto.decryptPrivateKey(
          keyMaterial.encryptedPrivateKey,
          input.password,
        );
        address = input.address || '';
      } else if (keyMaterial.encryptedMnemonic) {
        const mnemonic = keystoreCrypto.decryptMnemonic(
          keyMaterial.encryptedMnemonic,
          input.password,
        );
        const seed = await mnemonicToSeed(mnemonic);
        const root = fromSeed(seed);
        const derivationPath = this.getDerivationPath(input.chainType, 0);
        const child = this.derivePath(root, derivationPath);
        privateKey = Buffer.from(child.privateKey).toString('hex');
        address = this.getAddressFromPrivateKey(privateKey, input.chainType);
      }

      await this.recordAuditLog({
        walletId: input.walletId,
        userId: input.userId,
        address,
        chainType: input.chainType,
        signType: 'message',
        riskScore: 100,
        riskLevel: 'critical',
        action: 'second_confirm',
        success: true,
      });

      return {
        exportType: 'private_key',
        data: privateKey,
        address,
        chainType: input.chainType,
        exportedAt: new Date(),
      };
    }

    if (input.exportType === 'keystore') {
      const encryptedData = keyMaterial.encryptedMnemonic || keyMaterial.encryptedPrivateKey || '';

      return {
        exportType: 'keystore',
        data: encryptedData,
        chainType: input.chainType,
        exportedAt: new Date(),
      };
    }

    throw WalletKeyErrors.EXPORT_NOT_ALLOWED('Unsupported export type');
  }

  /**
   * 密钥导出验证：验证导出的密钥是否正确
   */
  async verifyExport(input: ExportKeyInput, exportedData: string): Promise<boolean> {
    try {
      const keyMaterial = await this.getKeyMaterial(input.walletId);

      if (input.exportType === 'mnemonic' && keyMaterial.encryptedMnemonic) {
        const mnemonic = keystoreCrypto.decryptMnemonic(
          keyMaterial.encryptedMnemonic,
          input.password,
        );
        return mnemonic === exportedData;
      }

      if (input.exportType === 'private_key' && keyMaterial.encryptedPrivateKey) {
        const privateKey = keystoreCrypto.decryptPrivateKey(
          keyMaterial.encryptedPrivateKey,
          input.password,
        );
        return privateKey === exportedData;
      }

      return false;
    } catch {
      return false;
    }
  }

  /**
   * 密钥备份验证：验证备份数据是否与当前钱包匹配
   */
  async verifyBackup(input: VerifyBackupInput): Promise<VerifyBackupResult> {
    try {
      const keyMaterial = await this.getKeyMaterial(input.walletId);

      if (this.destroyedWallets.has(input.walletId)) {
        throw WalletKeyErrors.KEY_ALREADY_DESTROYED(input.walletId);
      }

      if (input.backupType === 'mnemonic') {
        const validation = validateMnemonic(input.backupData);
        if (!validation.valid) {
          return {
            valid: false,
            matched: false,
          };
        }

        if (keyMaterial.encryptedMnemonic) {
          const currentMnemonic = keystoreCrypto.decryptMnemonic(
            keyMaterial.encryptedMnemonic,
            input.password,
          );
          const matched = currentMnemonic === input.backupData;

          return {
            valid: true,
            matched,
            chainType: 'evm',
          };
        }

        return {
          valid: true,
          matched: false,
        };
      }

      if (input.backupType === 'private_key') {
        if (keyMaterial.encryptedPrivateKey) {
          const currentPrivateKey = keystoreCrypto.decryptPrivateKey(
            keyMaterial.encryptedPrivateKey,
            input.password,
          );
          const matched = currentPrivateKey.toLowerCase() === input.backupData.toLowerCase();

          return {
            valid: true,
            matched,
          };
        }

        return {
          valid: input.backupData.length >= 64,
          matched: false,
        };
      }

      if (input.backupType === 'keystore') {
        const parsed = safeJsonParse<unknown>(input.backupData, {
          context: 'wallet-keystore-backup',
          maxBytes: 1 * 1024 * 1024,
          silent: true,
          defaultValue: null,
        });
        if (parsed === null) {
          return {
            valid: false,
            matched: false,
          };
        }
        return {
          valid: true,
          matched: input.backupData === (keyMaterial.encryptedMnemonic || keyMaterial.encryptedPrivateKey),
        };
      }

      throw WalletKeyErrors.BACKUP_VERIFICATION_FAILED('Unsupported backup type');
    } catch (error) {
      throw WalletKeyErrors.BACKUP_VERIFICATION_FAILED(error as string);
    }
  }

  /**
   * 签名审计日志：记录签名审计日志
   */
  async recordAuditLog(entry: Partial<SignAuditLogEntry> & {
    walletId: string;
    userId: string;
    address: string;
    chainType: ChainType;
    signType: SignType;
    riskScore: number;
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    action: 'allow' | 'warn' | 'second_confirm' | 'delay' | 'manual_review' | 'reject';
    success: boolean;
  }): Promise<void> {
    try {
      const logEntry: SignAuditLogEntry = {
        id: this.generateAuditLogId(),
        timestamp: new Date(),
        ...entry,
      };

      this.auditLogs.push(logEntry);
    } catch (error) {
      console.error('Failed to record audit log:', error);
    }
  }

  /**
   * 签名审计日志：查询审计日志
   */
  async getAuditLogs(walletId: string, limit: number = 100): Promise<SignAuditLogEntry[]> {
    return this.auditLogs
      .filter((log) => log.walletId === walletId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  /**
   * 密钥轮换：增强版密钥轮换（支持轮换原因记录）
   */
  async rotateKeyV2(input: KeyRotationInput): Promise<KeyMaterialRecord> {
    if (this.destroyedWallets.has(input.walletId)) {
      throw WalletKeyErrors.KEY_ALREADY_DESTROYED(input.walletId);
    }

    const keyMaterial = await this.getKeyMaterial(input.walletId);

    let mnemonic: string | null = null;
    let privateKey: string | null = null;

    try {
      if (keyMaterial.encryptedMnemonic) {
        mnemonic = keystoreCrypto.decryptMnemonic(
          keyMaterial.encryptedMnemonic,
          input.oldPassword,
        );
      }
      if (keyMaterial.encryptedPrivateKey) {
        privateKey = keystoreCrypto.decryptPrivateKey(
          keyMaterial.encryptedPrivateKey,
          input.oldPassword,
        );
      }
    } catch (error) {
      throw WalletKeyErrors.KEY_ROTATION_FAILED('Old password verification failed');
    }

    keyMaterial.status = 'rotated';
    keyMaterial.updatedAt = new Date();

    const newId = this.generateId();
    const newRecord: KeyMaterialRecord = {
      ...keyMaterial,
      id: newId,
      status: 'active',
      encryptedMnemonic: mnemonic ? keystoreCrypto.encryptMnemonic(mnemonic, input.newPassword) : undefined,
      encryptedPrivateKey: privateKey ? keystoreCrypto.encryptPrivateKey(privateKey, input.newPassword) : undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.keyMaterials.set(newId, newRecord);

    await this.recordAuditLog({
      walletId: input.walletId,
      userId: input.userId,
      address: '',
      chainType: 'evm',
      signType: 'message',
      riskScore: 50,
      riskLevel: 'medium',
      action: 'allow',
      success: true,
      txHash: `rotation_${newId}`,
    });

    return newRecord;
  }

  /**
   * 密钥销毁：销毁密钥材料（不可逆操作）
   */
  async destroyKey(input: DestroyKeyInput): Promise<DestroyKeyResult> {
    if (input.confirmText !== 'I understand that this action is irreversible') {
      throw WalletKeyErrors.KEY_DESTROY_CONFIRM_MISMATCH();
    }

    if (this.destroyedWallets.has(input.walletId)) {
      throw WalletKeyErrors.KEY_ALREADY_DESTROYED(input.walletId);
    }

    const keyMaterial = await this.getKeyMaterial(input.walletId);

    try {
      if (keyMaterial.encryptedMnemonic) {
        keystoreCrypto.decryptMnemonic(
          keyMaterial.encryptedMnemonic,
          input.password,
        );
      }
      if (keyMaterial.encryptedPrivateKey) {
        keystoreCrypto.decryptPrivateKey(
          keyMaterial.encryptedPrivateKey,
          input.password,
        );
      }
    } catch (error) {
      throw WalletKeyErrors.DECRYPT_FAILED();
    }

    keyMaterial.status = 'revoked';
    keyMaterial.updatedAt = new Date();
    keyMaterial.encryptedMnemonic = undefined;
    keyMaterial.encryptedPrivateKey = undefined;

    this.destroyedWallets.add(input.walletId);

    await this.recordAuditLog({
      walletId: input.walletId,
      userId: input.userId,
      address: '',
      chainType: 'evm',
      signType: 'message',
      riskScore: 100,
      riskLevel: 'critical',
      action: 'second_confirm',
      success: true,
    });

    return {
      success: true,
      walletId: input.walletId,
      destroyedAt: new Date(),
      backupRequired: keyMaterial.keyType === 'mnemonic' || keyMaterial.keyType === 'private_key',
    };
  }

  /**
   * 检查钱包是否已被销毁
   */
  isWalletDestroyed(walletId: string): boolean {
    return this.destroyedWallets.has(walletId);
  }

  /**
   * 多密码派生：使用双重密码派生额外账户
   */
  async deriveWithMultiPassword(input: MultiPasswordDerivationInput): Promise<DerivedEvmAccount | DerivedSolanaAccount | DerivedBitcoinAccount | DerivedTronAccount> {
    try {
      const keyMaterial = await this.getKeyMaterial(input.walletId);

      if (keyMaterial.keyType === 'watch_only') {
        throw WalletKeyErrors.WATCH_ONLY_CANNOT_SIGN();
      }

      if (this.destroyedWallets.has(input.walletId)) {
        throw WalletKeyErrors.KEY_ALREADY_DESTROYED(input.walletId);
      }

      if (!keyMaterial.encryptedMnemonic) {
        throw WalletKeyErrors.MULTI_PASSWORD_DERIVATION_FAILED('Multi-password derivation requires mnemonic');
      }

      const mnemonic = keystoreCrypto.decryptMnemonic(
        keyMaterial.encryptedMnemonic,
        input.primaryPassword,
      );

      const secondaryHash = keystoreCrypto.sha256(input.secondaryPassword);
      const combinedSeed = mnemonic + secondaryHash.slice(0, 32);
      const seed = await mnemonicToSeed(combinedSeed);
      const root = fromSeed(seed);
      const index = input.index || 0;
      const path = this.getDerivationPath(input.chainType, index);
      const child = this.derivePath(root, path);
      const privateKeyHex = Buffer.from(child.privateKey).toString('hex');

      switch (input.chainType) {
        case 'evm':
          const evmAddress = this.privateKeyToEvmAddress(privateKeyHex);
          const evmPublicKey = Buffer.from(child.publicKey).toString('hex');
          return {
            address: evmAddress,
            publicKey: evmPublicKey,
            privateKey: privateKeyHex,
            derivationPath: path,
          } as DerivedEvmAccount;

        case 'solana':
          const solKeypair = Keypair.fromSeed(Buffer.from(child.privateKey));
          const solPublicKey = solKeypair.publicKey.toBase58();
          return {
            address: solPublicKey,
            publicKey: solPublicKey,
            privateKey: bs58.encode(solKeypair.secretKey),
            derivationPath: path,
          } as DerivedSolanaAccount;

        case 'bitcoin':
          const btcSigner = this.getBitcoinSigner('mainnet');
          const btcAccount = btcSigner.deriveAccount(privateKeyHex, 'native-segwit');
          return btcAccount;

        case 'tron':
          const tronAccount = this.tronSigner.deriveAccount(privateKeyHex);
          return tronAccount;

        default:
          throw WalletKeyErrors.INVALID_CHAIN_TYPE(input.chainType);
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'WalletKeyError') {
        throw error;
      }
      throw WalletKeyErrors.MULTI_PASSWORD_DERIVATION_FAILED(error as string);
    }
  }

  /**
   * 签名 Bitcoin 交易
   */
  async signBitcoinTransaction(input: SignBitcoinTransactionInput): Promise<SignResult> {
    const riskAssessment = await this.evaluateSignatureRisk({
      walletId: input.walletId,
      userId: input.userId,
      address: input.address,
      chainType: 'bitcoin',
      signType: 'transaction',
      payload: input.psbt,
    });

    if (!riskAssessment.allowed && riskAssessment.action === 'reject') {
      throw WalletKeyErrors.SIGN_REJECTED_BY_RISK(riskAssessment.reasons.join('; '));
    }

    const bitcoinAccount = await this.deriveBitcoinAddress(input.walletId, input.password);
    const signer = this.getBitcoinSigner('mainnet');
    const result = await signer.signTransaction(input, bitcoinAccount.privateKey);

    await this.recordAuditLog({
      walletId: input.walletId,
      userId: input.userId,
      address: input.address,
      chainType: 'bitcoin',
      signType: 'transaction',
      riskScore: riskAssessment.riskScore,
      riskLevel: riskAssessment.riskLevel,
      action: riskAssessment.action,
      success: true,
    });

    return result;
  }

  /**
   * 签名 Tron 交易
   */
  async signTronTransaction(input: SignTronTransactionInput): Promise<SignResult> {
    const riskAssessment = await this.evaluateSignatureRisk({
      walletId: input.walletId,
      userId: input.userId,
      address: input.address,
      chainType: 'tron',
      signType: 'transaction',
      payload: input.transaction,
    });

    if (!riskAssessment.allowed && riskAssessment.action === 'reject') {
      throw WalletKeyErrors.SIGN_REJECTED_BY_RISK(riskAssessment.reasons.join('; '));
    }

    const tronAccount = await this.deriveTronAddress(input.walletId, input.password);
    const result = await this.tronSigner.signTransaction(input, tronAccount.privateKey);

    await this.recordAuditLog({
      walletId: input.walletId,
      userId: input.userId,
      address: input.address,
      chainType: 'tron',
      signType: 'transaction',
      riskScore: riskAssessment.riskScore,
      riskLevel: riskAssessment.riskLevel,
      action: riskAssessment.action,
      success: true,
    });

    return result;
  }

  /**
   * 设置是否允许密钥导出
   */
  setExportEnabled(enabled: boolean): void {
    this.exportEnabled = enabled;
  }

  private async evaluateSignatureRisk(ctx: KeyRiskContext) {
    return await keyRiskService.evaluate(ctx);
  }

  private getBitcoinSigner(network: 'mainnet' | 'testnet'): BitcoinSigner {
    if (!this.bitcoinSignerCache.has(network)) {
      this.bitcoinSignerCache.set(network, new BitcoinSigner(network));
    }
    return this.bitcoinSignerCache.get(network)!;
  }

  private getDerivationPath(chainType: ChainType, index: number): string {
    switch (chainType) {
      case 'evm':
        return `m/44'/60'/0'/0/${index}`;
      case 'solana':
        return `m/44'/501'/0'/0/${index}`;
      case 'bitcoin':
        return `m/84'/0'/0'/0/${index}`;
      case 'tron':
        return `m/44'/195'/0'/0/${index}`;
      default:
        return `m/44'/60'/0'/0/${index}`;
    }
  }

  private getAddressFromPrivateKey(privateKey: string, chainType: ChainType): string {
    switch (chainType) {
      case 'evm':
        return this.privateKeyToEvmAddress(privateKey);
      case 'solana':
        const solPubKey = this.solanaPrivateKeyToPublicKey(privateKey);
        return this.publicKeyToSolanaAddress(solPubKey);
      case 'bitcoin':
        const btcPubKey = this.privateKeyToPublicKey(privateKey);
        return this.publicKeyToBitcoinAddress(btcPubKey);
      case 'tron':
        const evmAddr = this.privateKeyToEvmAddress(privateKey);
        return this.evmAddressToTronAddress(evmAddr);
      default:
        return this.privateKeyToEvmAddress(privateKey);
    }
  }

  private generateAuditLogId(): string {
    return `audit_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
  }

  // Solana-first: EVM 签名器已废弃，方法保留作为占位
  // private getEvmSigner(chainId: number): EvmSigner {
  //   if (!this.evmSignerCache.has(chainId)) {
  //     this.evmSignerCache.set(chainId, new EvmSigner(chainId));
  //   }
  //   return this.evmSignerCache.get(chainId)!;
  // }
  private getEvmSigner(_chainId: number): never {
    throw new Error('EVM signer is deprecated in Solana-first architecture (2026-07-01)');
  }

  private derivePath(root: any, path: string): any {
    const parts = path.replace('m/', '').split('/');
    let node = root;
    for (const part of parts) {
      let index = parseInt(part);
      if (part.endsWith("'")) {
        index = parseInt(part.slice(0, -1)) + 0x80000000;
      }
      node = this.deriveChild(node, index);
    }
    return node;
  }

  private deriveChild(node: any, index: number): any {
    return deriveChild(node, index);
  }

  private privateKeyToEvmAddress(privateKey: string): string {
    const publicKey = this.privateKeyToPublicKey(privateKey);
    const hash = keystoreCrypto.keccak256(Buffer.from(publicKey, 'hex'));
    return toChecksumAddress('0x' + hash.slice(-40));
  }

  private privateKeyToPublicKey(privateKey: string): string {
    return keystoreCrypto.sha256(privateKey);
  }

  private solanaPrivateKeyToPublicKey(privateKey: string): string {
    return this.solanaKeypairFromPrivateKey(privateKey).publicKey.toBase58();
  }

  private publicKeyToSolanaAddress(publicKey: string): string {
    return new PublicKey(publicKey).toBase58();
  }

  private solanaKeypairFromPrivateKey(privateKey: string): Keypair {
    const normalized = privateKey.startsWith('0x') ? privateKey.slice(2) : privateKey;
    if (/^[0-9a-fA-F]{64}$/.test(normalized)) {
      return Keypair.fromSeed(Buffer.from(normalized, 'hex'));
    }

    const decoded = bs58.decode(privateKey);
    if (decoded.length === 64) {
      return Keypair.fromSecretKey(decoded);
    }
    if (decoded.length === 32) {
      return Keypair.fromSeed(decoded);
    }

    throw WalletKeyErrors.INVALID_PRIVATE_KEY('Invalid Solana private key format');
  }

  private publicKeyToBitcoinAddress(publicKey: string): string {
    const sha256 = keystoreCrypto.sha256(Buffer.from(publicKey, 'hex'));
    const hash160 = this.hash160(Buffer.from(sha256, 'hex'));
    return 'bc1' + this.bech32Encode(hash160);
  }

  private privateKeyToWif(privateKey: string): string {
    const version = '80';
    const compressed = '01';
    const key = version + privateKey + compressed;
    const hash = keystoreCrypto.sha256(Buffer.from(key, 'hex'));
    const hash2 = keystoreCrypto.sha256(Buffer.from(hash, 'hex'));
    const checksum = hash2.slice(0, 8);
    return this.base58Encode(Buffer.from(key + checksum, 'hex'));
  }

  private evmAddressToTronAddress(evmAddress: string): string {
    const hexAddress = evmAddress.startsWith('0x') ? evmAddress.slice(2) : evmAddress;
    return 'T' + this.base58Encode(Buffer.from(hexAddress, 'hex'));
  }

  private hash160(data: Buffer): Buffer {
    const sha = keystoreCrypto.sha256(data);
    return Buffer.from(keystoreCrypto.keccak256(Buffer.from(sha, 'hex')).slice(0, 40), 'hex');
  }

  private bech32Encode(data: Buffer): string {
    return data.toString('hex');
  }

  private base58Encode(buffer: Buffer): string {
    const alphabet = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
    let num = BigInt('0x' + buffer.toString('hex'));
    let result = '';
    while (num > 0) {
      const remainder = Number(num % 58n);
      result = alphabet[remainder] + result;
      num = num / 58n;
    }
    for (const byte of buffer) {
      if (byte === 0) result = '1' + result;
      else break;
    }
    return result;
  }

  private strengthToWordCount(strength: number): 12 | 15 | 18 | 21 | 24 {
    switch (strength) {
      case 128: return 12;
      case 160: return 15;
      case 192: return 18;
      case 224: return 21;
      case 256: return 24;
      default: return 12;
    }
  }

  private generateId(): string {
    return `key_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
  }
}

export const keyService = new KeyService();

/**
 * 硬件钱包适配器接口
 * 用于对接不同类型的硬件钱包（Ledger、Trezor、Keystone、OneKey 等）
 */
export interface HardwareWalletAdapter {
  readonly deviceType: string;

  connect(): Promise<boolean>;

  disconnect(): Promise<void>;

  getAddress(
    derivationPath: string,
    chainType: ChainType,
  ): Promise<{ address: string; publicKey: string }>;

  sign(input: HardwareWalletSignInput & { deviceId: string }): Promise<SignResult>;

  signTransaction(input: HardwareWalletSignInput & { deviceId: string }): Promise<SignResult>;

  signMessage(input: HardwareWalletSignInput & { deviceId: string }): Promise<SignResult>;
}

/**
 * MPC 钱包提供者适配器接口
 * 用于对接不同的 MPC 服务提供商
 */
export interface MPCProviderAdapter {
  readonly provider: string;

  initialize(config: Record<string, unknown>): Promise<boolean>;

  generateKey(partyId: string): Promise<{ keyRef: string; publicKey: string }>;

  sign(input: MPCSignInput & { keyRef: string }): Promise<SignResult>;

  signTransaction(input: MPCSignInput & { keyRef: string }): Promise<SignResult>;

  signMessage(input: MPCSignInput & { keyRef: string }): Promise<SignResult>;

  reshare(keyRef: string, newParties: string[]): Promise<boolean>;
}
