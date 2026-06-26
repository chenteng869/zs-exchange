/**
 * Web3 钱包模块 - 钱包服务
 *
 * 提供钱包的创建、查询、更新、删除等核心业务逻辑
 * 支持多链钱包、HD 钱包、地址管理、余额查询等功能
 */

import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import {
  CreateWalletDto,
  CreateHDWalletDto,
  ImportWalletDto,
  ImportMnemonicDto,
  QueryWalletDto,
  UpdateWalletDto,
  WalletDetailDto,
  WalletAddressDto,
  GenerateAddressDto,
  ValidateAddressDto,
  AddressValidationResultDto,
  QueryBalanceDto,
  TotalBalanceDto,
  BalanceDetailDto,
  ExportPrivateKeyDto,
  ExportMnemonicDto,
  PrivateKeyExportDto,
  MnemonicExportDto,
  DeleteWalletDto,
  WalletStatsDto,
  WalletOperationLogDto,
  BatchQueryWalletsDto,
  BatchFreezeWalletsDto,
  WalletType,
  WalletStatus,
  BlockchainNetwork,
  WalletSecurityLevel,
  RenameWalletDto,
  SetPrimaryWalletDto,
} from '../dto/wallet.dto';
import { KeyService } from './key.service';
import { ChainService } from './chain.service';

@Injectable()
export class WalletService {
  constructor(
    private readonly keyService: KeyService,
    private readonly chainService: ChainService,
  ) {}

  /**
   * 创建新钱包
   *
   * @param createWalletDto 创建钱包参数
   * @returns 钱包详情
   */
  async createWallet(createWalletDto: CreateWalletDto): Promise<WalletDetailDto> {
    const { userId, type, name, primaryChain, chains, isHD, hdIndex, description, metadata } = createWalletDto;

    this.validateWalletType(type);

    const walletId = this.generateId();
    const walletName = name || `${this.getWalletTypeLabel(type)} #${this.generateShortId()}`;

    const addresses: WalletAddressDto[] = [];

    if (primaryChain) {
      const keyResult = await this.keyService.generateKeyPair(primaryChain, isHD ? 'hd' : 'single');
      addresses.push({
        address: keyResult.address,
        chain: primaryChain,
        tag: 'primary',
      });
    }

    if (chains && chains.length > 0) {
      for (const chain of chains) {
        if (chain !== primaryChain) {
          const keyResult = await this.keyService.generateKeyPair(chain, isHD ? 'hd' : 'single');
          addresses.push({
            address: keyResult.address,
            chain,
            tag: 'secondary',
          });
        }
      }
    }

    const securityLevel = this.calculateSecurityLevel(type, isHD || false);

    const wallet: WalletDetailDto = {
      id: walletId,
      userId,
      type,
      name: walletName,
      status: WalletStatus.ACTIVE,
      primaryChain: primaryChain || BlockchainNetwork.ETHEREUM,
      addresses,
      isHD,
      hdIndex,
      securityLevel,
      description,
      metadata,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await this.logOperation(walletId, userId, 'create_wallet', `创建钱包: ${walletName}`);

    return wallet;
  }

  /**
   * 创建 HD 钱包
   *
   * @param createHDWalletDto 创建 HD 钱包参数
   * @returns 钱包详情
   */
  async createHDWallet(createHDWalletDto: CreateHDWalletDto): Promise<WalletDetailDto> {
    const { userId, name, primaryChain, chains, initialAddressCount, description } = createHDWalletDto;

    const walletId = this.generateId();
    const walletName = name || `HD Wallet #${this.generateShortId()}`;

    const mnemonicResult = await this.keyService.generateMnemonic(12);

    const addresses: WalletAddressDto[] = [];

    const primaryAddresses = await this.keyService.deriveAddresses(
      mnemonicResult.mnemonic,
      primaryChain,
      initialAddressCount || 1,
      0,
    );
    primaryAddresses.forEach((addr, index) => {
      addresses.push({
        address: addr.address,
        chain: primaryChain,
        tag: index === 0 ? 'primary' : `derived-${index}`,
      });
    });

    if (chains && chains.length > 0) {
      for (const chain of chains) {
        if (chain !== primaryChain) {
          const chainAddresses = await this.keyService.deriveAddresses(
            mnemonicResult.mnemonic,
            chain,
            1,
            0,
          );
          if (chainAddresses.length > 0) {
            addresses.push({
              address: chainAddresses[0].address,
              chain,
              tag: 'secondary',
            });
          }
        }
      }
    }

    const wallet: WalletDetailDto = {
      id: walletId,
      userId,
      type: WalletType.HD,
      name: walletName,
      status: WalletStatus.ACTIVE,
      primaryChain,
      addresses,
      isHD: true,
      hdIndex: 0,
      securityLevel: WalletSecurityLevel.HIGH,
      description,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await this.logOperation(walletId, userId, 'create_hd_wallet', `创建HD钱包: ${walletName}`);

    return wallet;
  }

  /**
   * 导入钱包（私钥导入）
   *
   * @param importWalletDto 导入钱包参数
   * @returns 钱包详情
   */
  async importWallet(importWalletDto: ImportWalletDto): Promise<WalletDetailDto> {
    const { userId, type, privateKey, name, chain, description, metadata } = importWalletDto;

    this.validateWalletType(type);

    const isValid = await this.keyService.validatePrivateKey(privateKey, chain || BlockchainNetwork.ETHEREUM);
    if (!isValid) {
      throw new BadRequestException('无效的私钥');
    }

    const address = await this.keyService.getAddressFromPrivateKey(
      privateKey,
      chain || BlockchainNetwork.ETHEREUM,
    );

    const walletId = this.generateId();
    const walletName = name || `导入钱包 #${this.generateShortId()}`;

    const addresses: WalletAddressDto[] = [
      {
        address,
        chain: chain || BlockchainNetwork.ETHEREUM,
        tag: 'imported',
      },
    ];

    const wallet: WalletDetailDto = {
      id: walletId,
      userId,
      type,
      name: walletName,
      status: WalletStatus.ACTIVE,
      primaryChain: chain || BlockchainNetwork.ETHEREUM,
      addresses,
      isHD: false,
      securityLevel: WalletSecurityLevel.MEDIUM,
      description,
      metadata,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await this.logOperation(walletId, userId, 'import_wallet', `导入钱包: ${walletName}`);

    return wallet;
  }

  /**
   * 通过助记词导入钱包
   *
   * @param importMnemonicDto 助记词导入参数
   * @returns 钱包详情
   */
  async importMnemonic(importMnemonicDto: ImportMnemonicDto): Promise<WalletDetailDto> {
    const { userId, mnemonic, passphrase, name, primaryChain, chains, description } = importMnemonicDto;

    const isValid = await this.keyService.validateMnemonic(mnemonic);
    if (!isValid) {
      throw new BadRequestException('无效的助记词');
    }

    const walletId = this.generateId();
    const walletName = name || `助记词钱包 #${this.generateShortId()}`;

    const addresses: WalletAddressDto[] = [];

    const primaryAddress = await this.keyService.deriveAddressFromMnemonic(
      mnemonic,
      primaryChain,
      0,
      passphrase,
    );
    addresses.push({
      address: primaryAddress.address,
      chain: primaryChain,
      tag: 'primary',
    });

    if (chains && chains.length > 0) {
      for (const chain of chains) {
        if (chain !== primaryChain) {
          const chainAddress = await this.keyService.deriveAddressFromMnemonic(
            mnemonic,
            chain,
            0,
            passphrase,
          );
          addresses.push({
            address: chainAddress.address,
            chain,
            tag: 'secondary',
          });
        }
      }
    }

    const wallet: WalletDetailDto = {
      id: walletId,
      userId,
      type: WalletType.HD,
      name: walletName,
      status: WalletStatus.ACTIVE,
      primaryChain,
      addresses,
      isHD: true,
      hdIndex: 0,
      securityLevel: WalletSecurityLevel.HIGH,
      description,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await this.logOperation(walletId, userId, 'import_mnemonic', `通过助记词导入钱包: ${walletName}`);

    return wallet;
  }

  /**
   * 获取钱包详情
   *
   * @param walletId 钱包ID
   * @param userId 用户ID（用于权限验证）
   * @returns 钱包详情
   */
  async getWalletById(walletId: string, userId?: string): Promise<WalletDetailDto> {
    const wallet = await this.findWalletById(walletId);

    if (!wallet) {
      throw new NotFoundException('钱包不存在');
    }

    if (userId && wallet.userId !== userId) {
      throw new ForbiddenException('无权限访问该钱包');
    }

    return wallet;
  }

  /**
   * 查询钱包列表
   *
   * @param queryWalletDto 查询参数
   * @returns 钱包列表和总数
   */
  async getWallets(queryWalletDto: QueryWalletDto): Promise<{ list: WalletDetailDto[]; total: number }> {
    const { page, pageSize, userId, type, status, chain, isHD, keyword } = queryWalletDto;

    const mockWallets: WalletDetailDto[] = this.generateMockWallets(20);

    let filtered = mockWallets;

    if (userId) {
      filtered = filtered.filter((w) => w.userId === userId);
    }
    if (type) {
      filtered = filtered.filter((w) => w.type === type);
    }
    if (status) {
      filtered = filtered.filter((w) => w.status === status);
    }
    if (chain) {
      filtered = filtered.filter((w) => w.addresses.some((a) => a.chain === chain));
    }
    if (isHD !== undefined) {
      filtered = filtered.filter((w) => w.isHD === isHD);
    }
    if (keyword) {
      filtered = filtered.filter(
        (w) => w.name.toLowerCase().includes(keyword.toLowerCase()),
      );
    }

    const start = (page - 1) * pageSize;
    const list = filtered.slice(start, start + pageSize);

    return {
      list,
      total: filtered.length,
    };
  }

  /**
   * 更新钱包信息
   *
   * @param walletId 钱包ID
   * @param updateWalletDto 更新参数
   * @param userId 用户ID
   * @returns 更新后的钱包详情
   */
  async updateWallet(
    walletId: string,
    updateWalletDto: UpdateWalletDto,
    userId: string,
  ): Promise<WalletDetailDto> {
    const wallet = await this.getWalletById(walletId, userId);

    const updated: WalletDetailDto = {
      ...wallet,
      ...updateWalletDto,
      updatedAt: new Date(),
    };

    await this.logOperation(walletId, userId, 'update_wallet', '更新钱包信息');

    return updated;
  }

  /**
   * 重命名钱包
   *
   * @param walletId 钱包ID
   * @param renameWalletDto 重命名参数
   * @param userId 用户ID
   * @returns 更新后的钱包详情
   */
  async renameWallet(
    walletId: string,
    renameWalletDto: RenameWalletDto,
    userId: string,
  ): Promise<WalletDetailDto> {
    const wallet = await this.getWalletById(walletId, userId);

    wallet.name = renameWalletDto.name;
    wallet.updatedAt = new Date();

    await this.logOperation(walletId, userId, 'rename_wallet', `重命名钱包为: ${renameWalletDto.name}`);

    return wallet;
  }

  /**
   * 设置主钱包
   *
   * @param setPrimaryWalletDto 设置主钱包参数
   * @param userId 用户ID
   * @returns 操作结果
   */
  async setPrimaryWallet(
    setPrimaryWalletDto: SetPrimaryWalletDto,
    userId: string,
  ): Promise<{ success: boolean; message: string }> {
    const { walletId } = setPrimaryWalletDto;

    const wallet = await this.getWalletById(walletId, userId);

    if (wallet.status !== WalletStatus.ACTIVE) {
      throw new BadRequestException('只能设置活跃状态的钱包为主钱包');
    }

    await this.logOperation(walletId, userId, 'set_primary_wallet', '设置主钱包');

    return {
      success: true,
      message: '主钱包设置成功',
    };
  }

  /**
   * 生成新地址
   *
   * @param walletId 钱包ID
   * @param generateAddressDto 生成地址参数
   * @param userId 用户ID
   * @returns 新生成的地址列表
   */
  async generateAddress(
    walletId: string,
    generateAddressDto: GenerateAddressDto,
    userId: string,
  ): Promise<WalletAddressDto[]> {
    const wallet = await this.getWalletById(walletId, userId);

    const { chain, label, count } = generateAddressDto;

    if (!wallet.isHD) {
      throw new BadRequestException('仅 HD 钱包支持生成新地址');
    }

    const newAddresses: WalletAddressDto[] = [];
    const currentIndex = wallet.hdIndex || 0;

    for (let i = 0; i < count; i++) {
      const addressIndex = currentIndex + i + 1;
      const address = `0x${this.generateRandomHex(40)}`;
      newAddresses.push({
        address,
        chain,
        tag: label || `地址 ${addressIndex + 1}`,
      });
    }

    wallet.hdIndex = currentIndex + count;
    wallet.addresses = [...wallet.addresses, ...newAddresses];
    wallet.updatedAt = new Date();

    await this.logOperation(walletId, userId, 'generate_address', `生成 ${count} 个 ${chain} 地址`);

    return newAddresses;
  }

  /**
   * 验证地址格式
   *
   * @param validateAddressDto 验证参数
   * @returns 验证结果
   */
  async validateAddress(validateAddressDto: ValidateAddressDto): Promise<AddressValidationResultDto> {
    const { address, chain } = validateAddressDto;

    const result = await this.chainService.validateAddress(address, chain);

    return result;
  }

  /**
   * 获取钱包余额
   *
   * @param walletId 钱包ID
   * @param queryBalanceDto 查询余额参数
   * @param userId 用户ID
   * @returns 总余额详情
   */
  async getBalances(
    walletId: string,
    queryBalanceDto: QueryBalanceDto,
    userId: string,
  ): Promise<TotalBalanceDto> {
    const wallet = await this.getWalletById(walletId, userId);
    const { chain, includeFiat, fiatCurrency } = queryBalanceDto;

    const balances: BalanceDetailDto[] = [];

    const targetAddresses = chain
      ? wallet.addresses.filter((a) => a.chain === chain)
      : wallet.addresses;

    for (const addr of targetAddresses) {
      const balance = await this.chainService.getBalance(addr.address, addr.chain);

      balances.push({
        currency: this.getChainNativeToken(addr.chain),
        balance: balance.total,
        available: balance.available,
        frozen: '0',
        locked: '0',
        fiatValue: includeFiat ? this.calculateFiatValue(balance.total, addr.chain) : undefined,
        fiatCurrency: includeFiat ? fiatCurrency : undefined,
        decimals: 18,
        chain: addr.chain,
      });
    }

    const totalFiatValue = balances.reduce((sum, b) => {
      if (b.fiatValue) {
        return sum + parseFloat(b.fiatValue);
      }
      return sum;
    }, 0);

    return {
      totalFiatValue: totalFiatValue.toFixed(2),
      fiatCurrency: fiatCurrency || 'USD',
      balances,
      lastUpdated: Date.now(),
    };
  }

  /**
   * 导出私钥
   *
   * @param walletId 钱包ID
   * @param exportPrivateKeyDto 导出参数
   * @param userId 用户ID
   * @returns 私钥导出结果
   */
  async exportPrivateKey(
    walletId: string,
    exportPrivateKeyDto: ExportPrivateKeyDto,
    userId: string,
  ): Promise<PrivateKeyExportDto> {
    const wallet = await this.getWalletById(walletId, userId);
    const { password, verificationCode } = exportPrivateKeyDto;

    if (wallet.status !== WalletStatus.ACTIVE) {
      throw new BadRequestException('钱包状态异常，无法导出私钥');
    }

    const primaryAddress = wallet.addresses.find((a) => a.chain === wallet.primaryChain);
    if (!primaryAddress) {
      throw new NotFoundException('未找到主地址');
    }

    const privateKey = `0x${this.generateRandomHex(64)}`;

    await this.logOperation(walletId, userId, 'export_private_key', '导出私钥');

    return {
      privateKey,
      chain: wallet.primaryChain,
      address: primaryAddress.address,
      expiresAt: Date.now() + 5 * 60 * 1000,
    };
  }

  /**
   * 导出助记词
   *
   * @param walletId 钱包ID
   * @param exportMnemonicDto 导出参数
   * @param userId 用户ID
   * @returns 助记词导出结果
   */
  async exportMnemonic(
    walletId: string,
    exportMnemonicDto: ExportMnemonicDto,
    userId: string,
  ): Promise<MnemonicExportDto> {
    const wallet = await this.getWalletById(walletId, userId);

    if (!wallet.isHD) {
      throw new BadRequestException('仅 HD 钱包支持导出助记词');
    }

    if (wallet.status !== WalletStatus.ACTIVE) {
      throw new BadRequestException('钱包状态异常，无法导出助记词');
    }

    const mnemonic = await this.keyService.generateMnemonic(12);

    await this.logOperation(walletId, userId, 'export_mnemonic', '导出助记词');

    return {
      mnemonic: mnemonic.mnemonic,
      derivationPath: `m/44'/60'/0'/0/0`,
      addresses: wallet.addresses.map((a) => ({
        address: a.address,
        path: `m/44'/60'/0'/0/${wallet.addresses.indexOf(a)}`,
        index: wallet.addresses.indexOf(a),
        chain: a.chain,
      })),
      expiresAt: Date.now() + 5 * 60 * 1000,
    };
  }

  /**
   * 删除钱包
   *
   * @param walletId 钱包ID
   * @param deleteWalletDto 删除参数
   * @param userId 用户ID
   * @returns 操作结果
   */
  async deleteWallet(
    walletId: string,
    deleteWalletDto: DeleteWalletDto,
    userId: string,
  ): Promise<{ success: boolean; message: string }> {
    const wallet = await this.getWalletById(walletId, userId);

    if (wallet.status === WalletStatus.DELETED) {
      throw new BadRequestException('钱包已删除');
    }

    wallet.status = WalletStatus.DELETED;
    wallet.updatedAt = new Date();

    await this.logOperation(walletId, userId, 'delete_wallet', `删除钱包: ${deleteWalletDto.reason || '用户主动删除'}`);

    return {
      success: true,
      message: '钱包删除成功',
    };
  }

  /**
   * 冻结钱包
   *
   * @param walletId 钱包ID
   * @param reason 冻结原因
   * @param operatorId 操作人ID
   * @returns 操作结果
   */
  async freezeWallet(
    walletId: string,
    reason: string,
    operatorId: string,
  ): Promise<WalletDetailDto> {
    const wallet = await this.getWalletById(walletId);

    if (wallet.status === WalletStatus.FROZEN) {
      throw new BadRequestException('钱包已冻结');
    }

    wallet.status = WalletStatus.FROZEN;
    wallet.updatedAt = new Date();

    await this.logOperation(walletId, operatorId, 'freeze_wallet', `冻结钱包: ${reason}`);

    return wallet;
  }

  /**
   * 解冻钱包
   *
   * @param walletId 钱包ID
   * @param reason 解冻原因
   * @param operatorId 操作人ID
   * @returns 操作结果
   */
  async unfreezeWallet(
    walletId: string,
    reason: string,
    operatorId: string,
  ): Promise<WalletDetailDto> {
    const wallet = await this.getWalletById(walletId);

    if (wallet.status !== WalletStatus.FROZEN) {
      throw new BadRequestException('钱包未处于冻结状态');
    }

    wallet.status = WalletStatus.ACTIVE;
    wallet.updatedAt = new Date();

    await this.logOperation(walletId, operatorId, 'unfreeze_wallet', `解冻钱包: ${reason}`);

    return wallet;
  }

  /**
   * 获取钱包统计信息
   *
   * @param userId 用户ID
   * @returns 统计信息
   */
  async getWalletStats(userId?: string): Promise<WalletStatsDto> {
    return {
      totalWallets: 156,
      activeWallets: 142,
      totalAddresses: 328,
      supportedChains: 12,
      totalBalanceUsd: '2456789.50',
      todayTransactions: 89,
      pendingTransactions: 12,
    };
  }

  /**
   * 获取钱包操作记录
   *
   * @param walletId 钱包ID
   * @param userId 用户ID
   * @param page 页码
   * @param pageSize 每页数量
   * @returns 操作记录列表
   */
  async getOperationLogs(
    walletId: string,
    userId: string,
    page: number = 1,
    pageSize: number = 20,
  ): Promise<{ list: WalletOperationLogDto[]; total: number }> {
    await this.getWalletById(walletId, userId);

    const logs: WalletOperationLogDto[] = [];
    const actions = ['create_wallet', 'update_wallet', 'export_private_key', 'generate_address', 'transaction_send'];

    for (let i = 0; i < 30; i++) {
      logs.push({
        id: `log_${i}`,
        walletId,
        action: actions[i % actions.length],
        details: `操作详情 ${i + 1}`,
        ipAddress: `192.168.1.${i % 255}`,
        userAgent: 'Mozilla/5.0',
        createdAt: new Date(Date.now() - i * 3600000),
      });
    }

    const start = (page - 1) * pageSize;

    return {
      list: logs.slice(start, start + pageSize),
      total: logs.length,
    };
  }

  /**
   * 批量查询钱包
   *
   * @param batchQueryDto 批量查询参数
   * @returns 钱包列表
   */
  async batchGetWallets(batchQueryDto: BatchQueryWalletsDto): Promise<WalletDetailDto[]> {
    const { walletIds } = batchQueryDto;

    const wallets: WalletDetailDto[] = [];
    for (const id of walletIds) {
      try {
        const wallet = await this.getWalletById(id);
        wallets.push(wallet);
      } catch (e) {
        // 忽略不存在的钱包
      }
    }

    return wallets;
  }

  /**
   * 批量冻结/解冻钱包
   *
   * @param batchFreezeDto 批量操作参数
   * @param operatorId 操作人ID
   * @returns 操作结果
   */
  async batchFreezeWallets(
    batchFreezeDto: BatchFreezeWalletsDto,
    operatorId: string,
  ): Promise<{ success: number; failed: number; results: Array<{ walletId: string; success: boolean; message?: string }> }> {
    const { walletIds, status, reason } = batchFreezeDto;

    const results: Array<{ walletId: string; success: boolean; message?: string }> = [];
    let successCount = 0;
    let failedCount = 0;

    for (const walletId of walletIds) {
      try {
        if (status === WalletStatus.FROZEN) {
          await this.freezeWallet(walletId, reason || '批量冻结', operatorId);
        } else if (status === WalletStatus.ACTIVE) {
          await this.unfreezeWallet(walletId, reason || '批量解冻', operatorId);
        }
        results.push({ walletId, success: true });
        successCount++;
      } catch (error: any) {
        results.push({ walletId, success: false, message: error.message });
        failedCount++;
      }
    }

    return {
      success: successCount,
      failed: failedCount,
      results,
    };
  }

  // ============================================================
  // 私有方法
  // ============================================================

  /**
   * 根据ID查找钱包
   */
  private async findWalletById(walletId: string): Promise<WalletDetailDto | null> {
    const mockWallets = this.generateMockWallets(10);
    return mockWallets.find((w) => w.id === walletId) || null;
  }

  /**
   * 验证钱包类型
   */
  private validateWalletType(type: WalletType): void {
    const validTypes = Object.values(WalletType);
    if (!validTypes.includes(type)) {
      throw new BadRequestException(`无效的钱包类型: ${type}`);
    }
  }

  /**
   * 计算安全等级
   */
  private calculateSecurityLevel(type: WalletType, isHD: boolean): WalletSecurityLevel {
    if (type === WalletType.HARDWARE) return WalletSecurityLevel.ULTRA;
    if (type === WalletType.MPC) return WalletSecurityLevel.HIGH;
    if (type === WalletType.MULTI_SIG) return WalletSecurityLevel.HIGH;
    if (isHD) return WalletSecurityLevel.HIGH;
    if (type === WalletType.SMART) return WalletSecurityLevel.MEDIUM;
    return WalletSecurityLevel.MEDIUM;
  }

  /**
   * 获取钱包类型标签
   */
  private getWalletTypeLabel(type: WalletType): string {
    const labels: Record<WalletType, string> = {
      [WalletType.EOA]: 'EOA 钱包',
      [WalletType.HD]: 'HD 钱包',
      [WalletType.MULTI_SIG]: '多签钱包',
      [WalletType.MPC]: 'MPC 钱包',
      [WalletType.HARDWARE]: '硬件钱包',
      [WalletType.SMART]: '智能钱包',
      [WalletType.CUSTODIAL]: '托管钱包',
    };
    return labels[type] || '钱包';
  }

  /**
   * 获取链原生代币
   */
  private getChainNativeToken(chain: BlockchainNetwork): string {
    const tokens: Record<BlockchainNetwork, string> = {
      [BlockchainNetwork.ETHEREUM]: 'ETH',
      [BlockchainNetwork.BSC]: 'BNB',
      [BlockchainNetwork.POLYGON]: 'MATIC',
      [BlockchainNetwork.ARBITRUM]: 'ETH',
      [BlockchainNetwork.OPTIMISM]: 'ETH',
      [BlockchainNetwork.AVALANCHE]: 'AVAX',
      [BlockchainNetwork.SOLANA]: 'SOL',
      [BlockchainNetwork.TRON]: 'TRX',
      [BlockchainNetwork.BITCOIN]: 'BTC',
      [BlockchainNetwork.BASE]: 'ETH',
      [BlockchainNetwork.LINEA]: 'ETH',
      [BlockchainNetwork.ZKSYNC]: 'ETH',
    };
    return tokens[chain] || 'UNKNOWN';
  }

  /**
   * 计算法币价值
   */
  private calculateFiatValue(amount: string, chain: BlockchainNetwork): string {
    const prices: Record<BlockchainNetwork, number> = {
      [BlockchainNetwork.ETHEREUM]: 3200,
      [BlockchainNetwork.BSC]: 580,
      [BlockchainNetwork.POLYGON]: 0.8,
      [BlockchainNetwork.ARBITRUM]: 3200,
      [BlockchainNetwork.OPTIMISM]: 3200,
      [BlockchainNetwork.AVALANCHE]: 35,
      [BlockchainNetwork.SOLANA]: 150,
      [BlockchainNetwork.TRON]: 0.12,
      [BlockchainNetwork.BITCOIN]: 65000,
      [BlockchainNetwork.BASE]: 3200,
      [BlockchainNetwork.LINEA]: 3200,
      [BlockchainNetwork.ZKSYNC]: 3200,
    };

    const price = prices[chain] || 0;
    const value = parseFloat(amount) * price;
    return value.toFixed(2);
  }

  /**
   * 生成唯一ID
   */
  private generateId(): string {
    return 'wallet_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  /**
   * 生成短ID
   */
  private generateShortId(): string {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
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
   * 记录操作日志
   */
  private async logOperation(walletId: string, userId: string, action: string, details: string): Promise<void> {
    console.log(`[WalletService] ${action} - wallet: ${walletId}, user: ${userId}, details: ${details}`);
  }

  /**
   * 生成模拟钱包数据
   */
  private generateMockWallets(count: number): WalletDetailDto[] {
    const wallets: WalletDetailDto[] = [];
    const types = Object.values(WalletType);
    const chains = Object.values(BlockchainNetwork);
    const statuses = Object.values(WalletStatus);

    for (let i = 0; i < count; i++) {
      const chain = chains[i % chains.length];
      wallets.push({
        id: `wallet_${i}`,
        userId: `user_${i % 5}`,
        type: types[i % types.length],
        name: `测试钱包 ${i + 1}`,
        status: statuses[i % statuses.length],
        primaryChain: chain,
        addresses: [
          {
            address: `0x${this.generateRandomHex(40)}`,
            chain,
            tag: 'primary',
          },
        ],
        isHD: i % 2 === 0,
        hdIndex: i % 10,
        securityLevel: WalletSecurityLevel.MEDIUM,
        description: `这是第 ${i + 1} 个测试钱包`,
        createdAt: new Date(Date.now() - i * 86400000),
        updatedAt: new Date(Date.now() - i * 3600000),
      });
    }

    return wallets;
  }
}
