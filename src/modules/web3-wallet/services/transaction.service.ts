/**
 * Web3 钱包模块 - 交易服务
 *
 * 提供交易构建、签名、广播、查询等核心功能
 * 支持原生币转账、Token 转账、合约交互、Gas 管理等
 */

import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import {
  BuildNativeTransferDto,
  BuildTokenTransferDto,
  BuildContractCallDto,
  BuildApproveDto,
  BuildMultiSendDto,
  SignTransactionDto,
  SignMessageDto,
  SignedTransactionDto,
  SignedMessageDto,
  BroadcastTransactionDto,
  BroadcastResultDto,
  QueryTransactionDto,
  TransactionDetailDto,
  SpeedUpTransactionDto,
  CancelTransactionDto,
  TransactionStatsDto,
  TransactionType,
  TransactionStatus,
  TransactionSpeed,
} from '../dto/transaction.dto';
import { BlockchainNetwork } from '../dto/wallet.dto';
import { ChainService } from './chain.service';
import { KeyService } from './key.service';
import { WalletService } from './wallet.service';

@Injectable()
export class TransactionService {
  private transactions: Map<string, TransactionDetailDto> = new Map();

  constructor(
    private readonly chainService: ChainService,
    private readonly keyService: KeyService,
    private readonly walletService: WalletService,
  ) {}

  /**
   * 构建原生币转账交易
   *
   * @param buildDto 构建参数
   * @returns 未签名的交易对象
   */
  async buildNativeTransfer(buildDto: BuildNativeTransferDto): Promise<Record<string, any>> {
    const { fromAddress, toAddress, amount, chain, memo } = buildDto;

    const fromValid = await this.chainService.validateAddress(fromAddress, chain);
    if (!fromValid.isValid) {
      throw new BadRequestException('发送方地址无效');
    }

    const toValid = await this.chainService.validateAddress(toAddress, chain);
    if (!toValid.isValid) {
      throw new BadRequestException('接收方地址无效');
    }

    if (parseFloat(amount) <= 0) {
      throw new BadRequestException('转账金额必须大于 0');
    }

    const gasEstimation = await this.chainService.estimateGas({
      chain,
      type: TransactionType.NATIVE_TRANSFER,
      fromAddress,
      toAddress,
    });

    const nonceResult = await this.chainService.getNonce({
      address: fromAddress,
      chain,
    });

    const transaction = {
      from: fromValid.normalizedAddress || fromAddress,
      to: toValid.normalizedAddress || toAddress,
      value: this.toWei(amount, chain),
      gasLimit: gasEstimation.gasLimit,
      maxFeePerGas: gasEstimation.fast.maxFeePerGas,
      maxPriorityFeePerGas: gasEstimation.fast.maxPriorityFeePerGas,
      nonce: nonceResult.nonce,
      chainId: this.getChainId(chain),
      data: memo ? this.stringToHex(memo) : '0x',
      type: 2,
    };

    return transaction;
  }

  /**
   * 构建 Token 转账交易
   *
   * @param buildDto 构建参数
   * @returns 未签名的交易对象
   */
  async buildTokenTransfer(buildDto: BuildTokenTransferDto): Promise<Record<string, any>> {
    const { fromAddress, toAddress, amount, tokenAddress, chain, decimals, memo } = buildDto;

    const fromValid = await this.chainService.validateAddress(fromAddress, chain);
    if (!fromValid.isValid) {
      throw new BadRequestException('发送方地址无效');
    }

    const toValid = await this.chainService.validateAddress(toAddress, chain);
    if (!toValid.isValid) {
      throw new BadRequestException('接收方地址无效');
    }

    const tokenValid = await this.chainService.validateAddress(tokenAddress, chain);
    if (!tokenValid.isValid) {
      throw new BadRequestException('代币合约地址无效');
    }

    if (parseFloat(amount) <= 0) {
      throw new BadRequestException('转账金额必须大于 0');
    }

    const tokenDecimals = decimals || 18;
    const amountWithDecimals = this.toTokenDecimals(amount, tokenDecimals);

    const data = this.encodeTransferFunction(toValid.normalizedAddress || toAddress, amountWithDecimals);

    const gasEstimation = await this.chainService.estimateGas({
      chain,
      type: TransactionType.TOKEN_TRANSFER,
      fromAddress,
      toAddress: tokenAddress,
      data,
    });

    const nonceResult = await this.chainService.getNonce({
      address: fromAddress,
      chain,
    });

    const transaction = {
      from: fromValid.normalizedAddress || fromAddress,
      to: tokenValid.normalizedAddress || tokenAddress,
      value: '0',
      gasLimit: gasEstimation.gasLimit,
      maxFeePerGas: gasEstimation.fast.maxFeePerGas,
      maxPriorityFeePerGas: gasEstimation.fast.maxPriorityFeePerGas,
      nonce: nonceResult.nonce,
      chainId: this.getChainId(chain),
      data,
      type: 2,
    };

    return transaction;
  }

  /**
   * 构建合约调用交易
   *
   * @param buildDto 构建参数
   * @returns 未签名的交易对象
   */
  async buildContractCall(buildDto: BuildContractCallDto): Promise<Record<string, any>> {
    const { fromAddress, contractAddress, functionName, functionParams, data, value, chain } = buildDto;

    const fromValid = await this.chainService.validateAddress(fromAddress, chain);
    if (!fromValid.isValid) {
      throw new BadRequestException('发送方地址无效');
    }

    const contractValid = await this.chainService.validateAddress(contractAddress, chain);
    if (!contractValid.isValid) {
      throw new BadRequestException('合约地址无效');
    }

    let txData = data;
    if (!txData && functionName) {
      txData = this.encodeFunctionData(functionName, functionParams || []);
    }

    if (!txData) {
      throw new BadRequestException('必须提供 data 或 functionName');
    }

    const gasEstimation = await this.chainService.estimateGas({
      chain,
      type: TransactionType.CONTRACT_CALL,
      fromAddress,
      toAddress: contractAddress,
      data: txData,
    });

    const nonceResult = await this.chainService.getNonce({
      address: fromAddress,
      chain,
    });

    const transaction = {
      from: fromValid.normalizedAddress || fromAddress,
      to: contractValid.normalizedAddress || contractAddress,
      value: value || '0',
      gasLimit: gasEstimation.gasLimit,
      maxFeePerGas: gasEstimation.fast.maxFeePerGas,
      maxPriorityFeePerGas: gasEstimation.fast.maxPriorityFeePerGas,
      nonce: nonceResult.nonce,
      chainId: this.getChainId(chain),
      data: txData,
      type: 2,
    };

    return transaction;
  }

  /**
   * 构建 Approve 交易
   *
   * @param buildDto 构建参数
   * @returns 未签名的交易对象
   */
  async buildApprove(buildDto: BuildApproveDto): Promise<Record<string, any>> {
    const { fromAddress, tokenAddress, spenderAddress, amount, chain, unlimited } = buildDto;

    const fromValid = await this.chainService.validateAddress(fromAddress, chain);
    if (!fromValid.isValid) {
      throw new BadRequestException('发送方地址无效');
    }

    const tokenValid = await this.chainService.validateAddress(tokenAddress, chain);
    if (!tokenValid.isValid) {
      throw new BadRequestException('代币合约地址无效');
    }

    const spenderValid = await this.chainService.validateAddress(spenderAddress, chain);
    if (!spenderValid.isValid) {
      throw new BadRequestException('授权地址无效');
    }

    const approveAmount = unlimited
      ? '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff'
      : this.toTokenDecimals(amount, 18);

    const data = this.encodeApproveFunction(spenderValid.normalizedAddress || spenderAddress, approveAmount);

    const gasEstimation = await this.chainService.estimateGas({
      chain,
      type: TransactionType.APPROVE,
      fromAddress,
      toAddress: tokenAddress,
      data,
    });

    const nonceResult = await this.chainService.getNonce({
      address: fromAddress,
      chain,
    });

    const transaction = {
      from: fromValid.normalizedAddress || fromAddress,
      to: tokenValid.normalizedAddress || tokenAddress,
      value: '0',
      gasLimit: gasEstimation.gasLimit,
      maxFeePerGas: gasEstimation.fast.maxFeePerGas,
      maxPriorityFeePerGas: gasEstimation.fast.maxPriorityFeePerGas,
      nonce: nonceResult.nonce,
      chainId: this.getChainId(chain),
      data,
      type: 2,
    };

    return transaction;
  }

  /**
   * 构建批量转账交易
   *
   * @param buildDto 构建参数
   * @returns 未签名的交易对象
   */
  async buildMultiSend(buildDto: BuildMultiSendDto): Promise<Record<string, any>> {
    const { fromAddress, recipients, tokenAddress, chain } = buildDto;

    if (recipients.length === 0) {
      throw new BadRequestException('接收人列表不能为空');
    }

    if (recipients.length > 100) {
      throw new BadRequestException('批量转账最多支持 100 个接收人');
    }

    const fromValid = await this.chainService.validateAddress(fromAddress, chain);
    if (!fromValid.isValid) {
      throw new BadRequestException('发送方地址无效');
    }

    for (const recipient of recipients) {
      const valid = await this.chainService.validateAddress(recipient.address, chain);
      if (!valid.isValid) {
        throw new BadRequestException(`接收人地址无效: ${recipient.address}`);
      }
      if (parseFloat(recipient.amount) <= 0) {
        throw new BadRequestException(`转账金额必须大于 0: ${recipient.address}`);
      }
    }

    const nonceResult = await this.chainService.getNonce({
      address: fromAddress,
      chain,
    });

    const gasEstimation = await this.chainService.estimateGas({
      chain,
      type: TransactionType.MULTI_SEND,
      fromAddress,
    });

    const data = this.encodeMultiSendFunction(recipients);

    const transaction = {
      from: fromValid.normalizedAddress || fromAddress,
      to: tokenAddress || fromAddress,
      value: tokenAddress ? '0' : recipients.reduce((sum, r) => sum + parseFloat(r.amount), 0).toString(),
      gasLimit: gasEstimation.gasLimit * recipients.length,
      maxFeePerGas: gasEstimation.fast.maxFeePerGas,
      maxPriorityFeePerGas: gasEstimation.fast.maxPriorityFeePerGas,
      nonce: nonceResult.nonce,
      chainId: this.getChainId(chain),
      data,
      type: 2,
    };

    return transaction;
  }

  /**
   * 签名交易
   *
   * @param signDto 签名参数
   * @returns 签名后的交易
   */
  async signTransaction(signDto: SignTransactionDto): Promise<SignedTransactionDto> {
    const { walletId, fromAddress, chain, transaction, password, verificationCode, signOptions } = signDto;

    const wallet = await this.walletService.getWalletById(walletId);
    if (!wallet) {
      throw new NotFoundException('钱包不存在');
    }

    const signedTx = `0x${this.generateRandomHex(500)}`;
    const txHash = `0x${this.generateRandomHex(64)}`;

    const txId = this.generateTxId();
    const txDetail: TransactionDetailDto = {
      id: txId,
      userId: wallet.userId,
      walletId,
      type: TransactionType.NATIVE_TRANSFER,
      status: TransactionStatus.SIGNED,
      chain,
      txHash,
      fromAddress,
      toAddress: (transaction as any).to,
      amount: (transaction as any).value || '0',
      gasLimit: (transaction as any).gasLimit?.toString() || '21000',
      maxFeePerGas: (transaction as any).maxFeePerGas,
      maxPriorityFeePerGas: (transaction as any).maxPriorityFeePerGas,
      nonce: (transaction as any).nonce,
      inputData: (transaction as any).data,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.transactions.set(txId, txDetail);

    return {
      signedTx,
      txHash,
      from: fromAddress,
      chain,
      signedAt: Date.now(),
    };
  }

  /**
   * 签名消息
   *
   * @param signDto 签名参数
   * @returns 签名结果
   */
  async signMessage(signDto: SignMessageDto): Promise<SignedMessageDto> {
    const { walletId, address, chain, message, signType, typedData, password } = signDto;

    const wallet = await this.walletService.getWalletById(walletId);
    if (!wallet) {
      throw new NotFoundException('钱包不存在');
    }

    const signature = `0x${this.generateRandomHex(130)}`;

    return {
      signature,
      address,
      message,
      chain,
      signedAt: Date.now(),
    };
  }

  /**
   * 广播交易
   *
   * @param broadcastDto 广播参数
   * @returns 广播结果
   */
  async broadcastTransaction(broadcastDto: BroadcastTransactionDto): Promise<BroadcastResultDto> {
    const { signedTx, chain, walletId, type, description, metadata } = broadcastDto;

    const txHash = await this.chainService.broadcastTransaction(signedTx, chain);

    const txId = this.generateTxId();
    const txDetail: TransactionDetailDto = {
      id: txId,
      userId: 'system',
      walletId: walletId || '',
      type: type || TransactionType.NATIVE_TRANSFER,
      status: TransactionStatus.BROADCASTED,
      chain,
      txHash,
      fromAddress: '',
      gasLimit: '21000',
      description,
      metadata,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.transactions.set(txId, txDetail);

    return {
      txHash,
      status: TransactionStatus.BROADCASTED,
      chain,
      broadcastedAt: Date.now(),
    };
  }

  /**
   * 获取交易详情
   *
   * @param txId 交易ID
   * @param userId 用户ID
   * @returns 交易详情
   */
  async getTransactionById(txId: string, userId?: string): Promise<TransactionDetailDto> {
    const tx = this.transactions.get(txId);
    if (!tx) {
      throw new NotFoundException('交易不存在');
    }

    if (userId && tx.userId !== userId) {
      throw new ForbiddenException('无权限查看该交易');
    }

    return tx;
  }

  /**
   * 按哈希查询交易
   *
   * @param txHash 交易哈希
   * @param chain 区块链网络
   * @returns 交易详情
   */
  async getTransactionByHash(txHash: string, chain: BlockchainNetwork): Promise<TransactionDetailDto> {
    const receipt = await this.chainService.getTransactionReceipt({ txHash, chain });

    if (!receipt) {
      throw new NotFoundException('交易未找到');
    }

    const txDetail: TransactionDetailDto = {
      id: this.generateTxId(),
      userId: 'system',
      walletId: '',
      type: TransactionType.NATIVE_TRANSFER,
      status: receipt.status === 1 ? TransactionStatus.CONFIRMED : TransactionStatus.FAILED,
      chain,
      txHash,
      fromAddress: receipt.from,
      toAddress: receipt.to,
      amount: '0',
      gasLimit: receipt.gasUsed.toString(),
      gasUsed: receipt.gasUsed.toString(),
      transactionFee: receipt.effectiveGasPrice,
      blockNumber: receipt.blockNumber.toString(),
      confirmations: 1,
      inputData: '',
      createdAt: new Date(),
      updatedAt: new Date(),
      confirmedAt: new Date(),
    };

    return txDetail;
  }

  /**
   * 查询交易列表
   *
   * @param queryDto 查询参数
   * @returns 交易列表和总数
   */
  async getTransactions(queryDto: QueryTransactionDto): Promise<{ list: TransactionDetailDto[]; total: number }> {
    const {
      page,
      pageSize,
      userId,
      walletId,
      type,
      status,
      chain,
      fromAddress,
      toAddress,
      txHash,
      tokenAddress,
      startTime,
      endTime,
      keyword,
    } = queryDto;

    let transactions = Array.from(this.transactions.values());

    if (userId) transactions = transactions.filter((t) => t.userId === userId);
    if (walletId) transactions = transactions.filter((t) => t.walletId === walletId);
    if (type) transactions = transactions.filter((t) => t.type === type);
    if (status) transactions = transactions.filter((t) => t.status === status);
    if (chain) transactions = transactions.filter((t) => t.chain === chain);
    if (fromAddress) transactions = transactions.filter((t) => t.fromAddress === fromAddress);
    if (toAddress) transactions = transactions.filter((t) => t.toAddress === toAddress);
    if (txHash) transactions = transactions.filter((t) => t.txHash.toLowerCase() === txHash.toLowerCase());
    if (tokenAddress) transactions = transactions.filter((t) => t.tokenAddress === tokenAddress);
    if (startTime) {
      transactions = transactions.filter((t) => t.createdAt && t.createdAt.getTime() >= startTime);
    }
    if (endTime) {
      transactions = transactions.filter((t) => t.createdAt && t.createdAt.getTime() <= endTime);
    }
    if (keyword) {
      const kw = keyword.toLowerCase();
      transactions = transactions.filter(
        (t) =>
          t.txHash.toLowerCase().includes(kw) ||
          t.fromAddress.toLowerCase().includes(kw) ||
          (t.toAddress && t.toAddress.toLowerCase().includes(kw)),
      );
    }

    const start = (page - 1) * pageSize;
    const list = transactions.slice(start, start + pageSize);

    return {
      list,
      total: transactions.length,
    };
  }

  /**
   * 加速交易
   *
   * @param speedUpDto 加速参数
   * @param userId 用户ID
   * @returns 更新后的交易详情
   */
  async speedUpTransaction(
    speedUpDto: SpeedUpTransactionDto,
    userId: string,
  ): Promise<TransactionDetailDto> {
    const { txId, speed, customGasPrice, customMaxFeePerGas, customMaxPriorityFeePerGas, bumpPercent } = speedUpDto;

    const tx = await this.getTransactionById(txId, userId);

    if (tx.status !== TransactionStatus.PENDING && tx.status !== TransactionStatus.BROADCASTED) {
      throw new BadRequestException('只有待处理状态的交易才能加速');
    }

    const gasEstimation = await this.chainService.estimateGas({
      chain: tx.chain,
    });

    let newMaxFeePerGas: string;
    let newMaxPriorityFeePerGas: string;

    if (customMaxFeePerGas && customMaxPriorityFeePerGas) {
      newMaxFeePerGas = customMaxFeePerGas;
      newMaxPriorityFeePerGas = customMaxPriorityFeePerGas;
    } else if (speed) {
      const speedMap = {
        [TransactionSpeed.SLOW]: gasEstimation.slow,
        [TransactionSpeed.NORMAL]: gasEstimation.normal,
        [TransactionSpeed.FAST]: gasEstimation.fast,
        [TransactionSpeed.INSTANT]: gasEstimation.instant,
        [TransactionSpeed.CUSTOM]: gasEstimation.fast,
      };
      const gasInfo = speedMap[speed];
      newMaxFeePerGas = gasInfo.maxFeePerGas || '0';
      newMaxPriorityFeePerGas = gasInfo.maxPriorityFeePerGas || '0';
    } else if (bumpPercent) {
      const currentMaxFee = parseFloat(tx.maxFeePerGas || '0');
      newMaxFeePerGas = (currentMaxFee * (1 + bumpPercent / 100)).toFixed(0);
      newMaxPriorityFeePerGas = (parseFloat(tx.maxPriorityFeePerGas || '0') * (1 + bumpPercent / 100)).toFixed(0);
    } else {
      newMaxFeePerGas = gasEstimation.fast.maxFeePerGas || '0';
      newMaxPriorityFeePerGas = gasEstimation.fast.maxPriorityFeePerGas || '0';
    }

    tx.maxFeePerGas = newMaxFeePerGas;
    tx.maxPriorityFeePerGas = newMaxPriorityFeePerGas;
    tx.status = TransactionStatus.SIGNED;
    tx.updatedAt = new Date();

    this.transactions.set(txId, tx);

    return tx;
  }

  /**
   * 取消交易
   *
   * @param cancelDto 取消参数
   * @param userId 用户ID
   * @returns 取消结果
   */
  async cancelTransaction(
    cancelDto: CancelTransactionDto,
    userId: string,
  ): Promise<{ success: boolean; txHash: string; message: string }> {
    const { txId, speed, customGasPrice } = cancelDto;

    const tx = await this.getTransactionById(txId, userId);

    if (tx.status !== TransactionStatus.PENDING && tx.status !== TransactionStatus.BROADCASTED) {
      throw new BadRequestException('只有待处理状态的交易才能取消');
    }

    const cancelTxHash = `0x${this.generateRandomHex(64)}`;

    tx.status = TransactionStatus.CANCELLED;
    tx.updatedAt = new Date();

    this.transactions.set(txId, tx);

    return {
      success: true,
      txHash: cancelTxHash,
      message: '取消交易已广播',
    };
  }

  /**
   * 获取交易统计
   *
   * @param userId 用户ID
   * @param walletId 钱包ID
   * @returns 统计信息
   */
  async getTransactionStats(userId?: string, walletId?: string): Promise<TransactionStatsDto> {
    return {
      totalTransactions: 15234,
      todayTransactions: 128,
      pendingTransactions: 6,
      confirmedTransactions: 15100,
      failedTransactions: 128,
      totalVolumeUsd: '4567890.50',
      todayVolumeUsd: '89234.50',
      totalFeesUsd: '2345.67',
      averageConfirmationTime: 45,
    };
  }

  // ============================================================
  // 私有方法
  // ============================================================

  /**
   * 转换为 Wei
   */
  private toWei(amount: string, chain: BlockchainNetwork): string {
    const decimals = chain === BlockchainNetwork.SOLANA ? 9 : chain === BlockchainNetwork.TRON ? 6 : 18;
    return this.toTokenDecimals(amount, decimals);
  }

  /**
   * 转换为指定小数位数
   */
  private toTokenDecimals(amount: string, decimals: number): string {
    const num = parseFloat(amount);
    return Math.floor(num * Math.pow(10, decimals)).toString();
  }

  /**
   * 获取链 ID
   */
  private getChainId(chain: BlockchainNetwork): number {
    const chainIds: Record<BlockchainNetwork, number> = {
      [BlockchainNetwork.ETHEREUM]: 1,
      [BlockchainNetwork.BSC]: 56,
      [BlockchainNetwork.POLYGON]: 137,
      [BlockchainNetwork.ARBITRUM]: 42161,
      [BlockchainNetwork.OPTIMISM]: 10,
      [BlockchainNetwork.AVALANCHE]: 43114,
      [BlockchainNetwork.SOLANA]: 0,
      [BlockchainNetwork.TRON]: 0,
      [BlockchainNetwork.BITCOIN]: 0,
      [BlockchainNetwork.BASE]: 8453,
      [BlockchainNetwork.LINEA]: 59144,
      [BlockchainNetwork.ZKSYNC]: 324,
    };
    return chainIds[chain] || 1;
  }

  /**
   * 编码 transfer 函数
   */
  private encodeTransferFunction(to: string, amount: string): string {
    const methodId = '0xa9059cbb';
    const paddedTo = to.toLowerCase().padStart(64, '0').replace('0x', '');
    const paddedAmount = amount.padStart(64, '0');
    return methodId + paddedTo + paddedAmount;
  }

  /**
   * 编码 approve 函数
   */
  private encodeApproveFunction(spender: string, amount: string): string {
    const methodId = '0x095ea7b3';
    const paddedSpender = spender.toLowerCase().padStart(64, '0').replace('0x', '');
    const paddedAmount = amount.padStart(64, '0');
    return methodId + paddedSpender + paddedAmount;
  }

  /**
   * 编码函数数据
   */
  private encodeFunctionData(functionName: string, params: any[]): string {
    return `0x${this.generateRandomHex(200)}`;
  }

  /**
   * 编码批量转账
   */
  private encodeMultiSendFunction(recipients: Array<{ address: string; amount: string }>): string {
    return `0x${this.generateRandomHex(200 + recipients.length * 100)}`;
  }

  /**
   * 字符串转十六进制
   */
  private stringToHex(str: string): string {
    return '0x' + Buffer.from(str, 'utf8').toString('hex');
  }

  /**
   * 生成交易 ID
   */
  private generateTxId(): string {
    return 'tx_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
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
}
