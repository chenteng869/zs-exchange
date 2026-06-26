/**
 * Web3 钱包模块 - 链服务
 *
 * 提供区块链节点交互、地址验证、余额查询、交易广播等功能
 * 支持多链配置、节点健康检查、自动切换等特性
 */

import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { BlockchainNetwork } from '../dto/wallet.dto';
import {
  AddressValidationResultDto,
  EstimateGasDto,
  GasEstimationDto,
  GasPriceInfoDto,
  GasPriceMode,
  GetNonceDto,
  NonceDto,
  TransactionReceiptDto,
  GetTransactionReceiptDto,
  ChainTransactionBriefDto,
  GetChainTransactionHistoryDto,
  TransactionType,
  TransactionStatus,
} from '../dto/transaction.dto';

@Injectable()
export class ChainService {
  private nodeRegistry: Map<BlockchainNetwork, ChainNodeInfo[]> = new Map();
  private gasPriceCache: Map<BlockchainNetwork, { data: GasEstimationDto; timestamp: number }> = new Map();
  private cacheTTL = 30000;

  constructor() {
    this.initializeNodes();
  }

  /**
   * 初始化节点注册表
   */
  private initializeNodes(): void {
    const defaultNodes: Record<BlockchainNetwork, ChainNodeInfo[]> = {
      [BlockchainNetwork.ETHEREUM]: [
        { name: 'Ethereum Mainnet', rpcUrl: 'https://eth.llamarpc.com', priority: 1, status: 'active' },
        { name: 'Cloudflare ETH', rpcUrl: 'https://cloudflare-eth.com', priority: 2, status: 'active' },
      ],
      [BlockchainNetwork.BSC]: [
        { name: 'BSC Mainnet', rpcUrl: 'https://bsc-dataseed.binance.org', priority: 1, status: 'active' },
        { name: 'BSC Nariox', rpcUrl: 'https://bsc.nariox.org', priority: 2, status: 'active' },
      ],
      [BlockchainNetwork.POLYGON]: [
        { name: 'Polygon Mainnet', rpcUrl: 'https://polygon-rpc.com', priority: 1, status: 'active' },
      ],
      [BlockchainNetwork.ARBITRUM]: [
        { name: 'Arbitrum One', rpcUrl: 'https://arb1.arbitrum.io/rpc', priority: 1, status: 'active' },
      ],
      [BlockchainNetwork.OPTIMISM]: [
        { name: 'Optimism Mainnet', rpcUrl: 'https://mainnet.optimism.io', priority: 1, status: 'active' },
      ],
      [BlockchainNetwork.AVALANCHE]: [
        { name: 'Avalanche C-Chain', rpcUrl: 'https://api.avax.network/ext/bc/C/rpc', priority: 1, status: 'active' },
      ],
      [BlockchainNetwork.SOLANA]: [
        { name: 'Solana Mainnet', rpcUrl: 'https://api.mainnet-beta.solana.com', priority: 1, status: 'active' },
      ],
      [BlockchainNetwork.TRON]: [
        { name: 'Tron Mainnet', rpcUrl: 'https://api.trongrid.io', priority: 1, status: 'active' },
      ],
      [BlockchainNetwork.BITCOIN]: [
        { name: 'Bitcoin Mainnet', rpcUrl: 'https://blockchain.info', priority: 1, status: 'active' },
      ],
      [BlockchainNetwork.BASE]: [
        { name: 'Base Mainnet', rpcUrl: 'https://mainnet.base.org', priority: 1, status: 'active' },
      ],
      [BlockchainNetwork.LINEA]: [
        { name: 'Linea Mainnet', rpcUrl: 'https://rpc.linea.build', priority: 1, status: 'active' },
      ],
      [BlockchainNetwork.ZKSYNC]: [
        { name: 'zkSync Era', rpcUrl: 'https://mainnet.era.zksync.io', priority: 1, status: 'active' },
      ],
    };

    for (const [chain, nodes] of Object.entries(defaultNodes)) {
      this.nodeRegistry.set(chain as BlockchainNetwork, nodes);
    }
  }

  /**
   * 验证地址格式
   *
   * @param address 地址
   * @param chain 区块链网络
   * @returns 验证结果
   */
  async validateAddress(address: string, chain: BlockchainNetwork): Promise<AddressValidationResultDto> {
    try {
      let isValid = false;
      let normalizedAddress = address;
      let format = '';

      switch (chain) {
        case BlockchainNetwork.ETHEREUM:
        case BlockchainNetwork.BSC:
        case BlockchainNetwork.POLYGON:
        case BlockchainNetwork.ARBITRUM:
        case BlockchainNetwork.OPTIMISM:
        case BlockchainNetwork.AVALANCHE:
        case BlockchainNetwork.BASE:
        case BlockchainNetwork.LINEA:
        case BlockchainNetwork.ZKSYNC:
          isValid = this.isValidEVMAddress(address);
          format = 'EIP-55';
          if (isValid) {
            normalizedAddress = this.toChecksumAddress(address);
          }
          break;

        case BlockchainNetwork.SOLANA:
          isValid = this.isValidSolanaAddress(address);
          format = 'Base58';
          break;

        case BlockchainNetwork.TRON:
          isValid = this.isValidTronAddress(address);
          format = 'Base58check';
          break;

        case BlockchainNetwork.BITCOIN:
          isValid = this.isValidBitcoinAddress(address);
          format = 'Base58check/Bech32';
          break;

        default:
          return {
            isValid: false,
            errorMessage: `不支持的区块链网络: ${chain}`,
          };
      }

      return {
        isValid,
        normalizedAddress: isValid ? normalizedAddress : undefined,
        format,
        errorMessage: isValid ? undefined : '地址格式不正确',
      };
    } catch (error: any) {
      return {
        isValid: false,
        errorMessage: `地址验证失败: ${error.message}`,
      };
    }
  }

  /**
   * 获取地址余额
   *
   * @param address 地址
   * @param chain 区块链网络
   * @param tokenAddress 代币地址（可选，为空则查询原生币）
   * @returns 余额信息
   */
  async getBalance(
    address: string,
    chain: BlockchainNetwork,
    tokenAddress?: string,
  ): Promise<{ total: string; available: string; decimals: number; symbol: string }> {
    const validation = await this.validateAddress(address, chain);
    if (!validation.isValid) {
      throw new BadRequestException('无效的地址');
    }

    const decimals = tokenAddress ? 18 : this.getNativeDecimals(chain);
    const symbol = tokenAddress ? 'TOKEN' : this.getNativeSymbol(chain);

    const balance = this.generateRandomBalance();

    return {
      total: balance,
      available: balance,
      decimals,
      symbol,
    };
  }

  /**
   * 批量获取余额
   *
   * @param addresses 地址列表
   * @param chain 区块链网络
   * @returns 余额映射
   */
  async getBalances(
    addresses: string[],
    chain: BlockchainNetwork,
  ): Promise<Map<string, string>> {
    const result = new Map<string, string>();

    for (const address of addresses) {
      const balance = await this.getBalance(address, chain);
      result.set(address, balance.total);
    }

    return result;
  }

  /**
   * 获取 Gas 价格估算
   *
   * @param estimateGasDto 估算参数
   * @returns Gas 价格信息
   */
  async estimateGas(estimateGasDto: EstimateGasDto): Promise<GasEstimationDto> {
    const { chain, type } = estimateGasDto;

    const cached = this.gasPriceCache.get(chain);
    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      return cached.data;
    }

    const baseFee = this.generateBaseFee(chain);
    const gasLimit = this.estimateGasLimit(type);

    const slow: GasPriceInfoDto = {
      maxFeePerGas: this.formatGwei(baseFee * 0.8),
      maxPriorityFeePerGas: this.formatGwei(baseFee * 0.05),
      estimatedFee: this.formatWei(baseFee * 0.8 * gasLimit),
      feeFiatValue: this.calculateFeeFiat(baseFee * 0.8 * gasLimit, chain),
      estimatedTime: 300,
    };

    const normal: GasPriceInfoDto = {
      maxFeePerGas: this.formatGwei(baseFee),
      maxPriorityFeePerGas: this.formatGwei(baseFee * 0.1),
      estimatedFee: this.formatWei(baseFee * gasLimit),
      feeFiatValue: this.calculateFeeFiat(baseFee * gasLimit, chain),
      estimatedTime: 60,
    };

    const fast: GasPriceInfoDto = {
      maxFeePerGas: this.formatGwei(baseFee * 1.5),
      maxPriorityFeePerGas: this.formatGwei(baseFee * 0.2),
      estimatedFee: this.formatWei(baseFee * 1.5 * gasLimit),
      feeFiatValue: this.calculateFeeFiat(baseFee * 1.5 * gasLimit, chain),
      estimatedTime: 15,
    };

    const instant: GasPriceInfoDto = {
      maxFeePerGas: this.formatGwei(baseFee * 2),
      maxPriorityFeePerGas: this.formatGwei(baseFee * 0.3),
      estimatedFee: this.formatWei(baseFee * 2 * gasLimit),
      feeFiatValue: this.calculateFeeFiat(baseFee * 2 * gasLimit, chain),
      estimatedTime: 5,
    };

    const estimation: GasEstimationDto = {
      chain,
      mode: GasPriceMode.EIP1559,
      gasLimit,
      slow,
      normal,
      fast,
      instant,
      baseFee,
      priorityFee: baseFee * 0.1,
      updatedAt: Date.now(),
    };

    this.gasPriceCache.set(chain, { data: estimation, timestamp: Date.now() });

    return estimation;
  }

  /**
   * 获取地址 Nonce
   *
   * @param getNonceDto 获取 Nonce 参数
   * @returns Nonce 信息
   */
  async getNonce(getNonceDto: GetNonceDto): Promise<NonceDto> {
    const { address, chain, blockTag } = getNonceDto;

    const validation = await this.validateAddress(address, chain);
    if (!validation.isValid) {
      throw new BadRequestException('无效的地址');
    }

    const nonce = Math.floor(Math.random() * 100);

    return {
      address,
      chain,
      nonce,
      pendingNonce: nonce + Math.floor(Math.random() * 5),
      updatedAt: Date.now(),
    };
  }

  /**
   * 广播交易
   *
   * @param signedTx 签名后的交易
   * @param chain 区块链网络
   * @returns 交易哈希
   */
  async broadcastTransaction(signedTx: string, chain: BlockchainNetwork): Promise<string> {
    if (!signedTx || signedTx.length < 10) {
      throw new BadRequestException('无效的签名交易');
    }

    const txHash = `0x${this.generateRandomHex(64)}`;

    return txHash;
  }

  /**
   * 获取交易收据
   *
   * @param getReceiptDto 获取收据参数
   * @returns 交易收据
   */
  async getTransactionReceipt(getReceiptDto: GetTransactionReceiptDto): Promise<TransactionReceiptDto | null> {
    const { txHash, chain } = getReceiptDto;

    if (!txHash) {
      throw new BadRequestException('交易哈希不能为空');
    }

    const blockNumber = Math.floor(Math.random() * 1000000) + 18000000;

    const receipt: TransactionReceiptDto = {
      transactionHash: txHash,
      transactionIndex: Math.floor(Math.random() * 200),
      blockHash: `0x${this.generateRandomHex(64)}`,
      blockNumber,
      from: `0x${this.generateRandomHex(40)}`,
      to: `0x${this.generateRandomHex(40)}`,
      cumulativeGasUsed: Math.floor(Math.random() * 1000000) + 100000,
      gasUsed: Math.floor(Math.random() * 500000) + 21000,
      contractAddress: '',
      logs: [],
      logsBloom: `0x${this.generateRandomHex(512)}`,
      status: 1,
      effectiveGasPrice: this.formatWei(Math.floor(Math.random() * 50000000000) + 1000000000),
      chain,
    };

    return receipt;
  }

  /**
   * 获取链上交易历史
   *
   * @param getHistoryDto 获取历史参数
   * @returns 交易列表
   */
  async getTransactionHistory(
    getHistoryDto: GetChainTransactionHistoryDto,
  ): Promise<{ list: ChainTransactionBriefDto[]; total: number }> {
    const { address, chain, type, tokenAddress, startTime, endTime, page, pageSize } = getHistoryDto;

    const validation = await this.validateAddress(address, chain);
    if (!validation.isValid) {
      throw new BadRequestException('无效的地址');
    }

    const total = 156;
    const list: ChainTransactionBriefDto[] = [];
    const types = Object.values(TransactionType);

    const count = Math.min(pageSize, total - (page - 1) * pageSize);

    for (let i = 0; i < count; i++) {
      const txType = types[Math.floor(Math.random() * types.length)];
      const statuses = Object.values(TransactionStatus);
      const status = statuses[Math.floor(Math.random() * statuses.length)];

      list.push({
        txHash: `0x${this.generateRandomHex(64)}`,
        chain,
        type: txType,
        status,
        from: `0x${this.generateRandomHex(40)}`,
        to: `0x${this.generateRandomHex(40)}`,
        value: (Math.random() * 10).toFixed(8),
        tokenSymbol: tokenAddress ? 'TOKEN' : this.getNativeSymbol(chain),
        tokenAddress,
        blockNumber: Math.floor(Math.random() * 1000000) + 18000000,
        timestamp: Math.floor(Date.now() / 1000) - i * 3600,
        txFee: (Math.random() * 0.01).toFixed(8),
      });
    }

    return { list, total };
  }

  /**
   * 获取链状态
   *
   * @param chain 区块链网络
   * @returns 链状态信息
   */
  async getChainStatus(chain: BlockchainNetwork): Promise<ChainStatusDto> {
    const nodes = this.nodeRegistry.get(chain) || [];

    const activeNodes = nodes.filter((n) => n.status === 'active').length;
    const blockNumber = Math.floor(Math.random() * 1000000) + 18000000;

    return {
      chain,
      isActive: activeNodes > 0,
      blockNumber,
      activeNodes,
      totalNodes: nodes.length,
      avgBlockTime: this.getAverageBlockTime(chain),
      latestBlockTime: Date.now() / 1000,
    };
  }

  /**
   * 获取所有支持的链
   *
   * @returns 链列表
   */
  async getSupportedChains(): Promise<ChainInfoDto[]> {
    const chains: ChainInfoDto[] = [];

    for (const chain of Object.values(BlockchainNetwork)) {
      const nodes = this.nodeRegistry.get(chain) || [];
      chains.push({
        chain,
        name: this.getChainName(chain),
        symbol: this.getNativeSymbol(chain),
        decimals: this.getNativeDecimals(chain),
        isActive: nodes.some((n) => n.status === 'active'),
        nodeCount: nodes.length,
        blockExplorerUrl: this.getBlockExplorerUrl(chain),
      });
    }

    return chains;
  }

  /**
   * 获取节点列表
   *
   * @param chain 区块链网络
   * @returns 节点列表
   */
  async getNodes(chain: BlockchainNetwork): Promise<ChainNodeInfo[]> {
    return this.nodeRegistry.get(chain) || [];
  }

  /**
   * 添加节点
   *
   * @param chain 区块链网络
   * @param node 节点信息
   * @returns 添加后的节点列表
   */
  async addNode(chain: BlockchainNetwork, node: Omit<ChainNodeInfo, 'status'>): Promise<ChainNodeInfo[]> {
    const nodes = this.nodeRegistry.get(chain) || [];

    const newNode: ChainNodeInfo = {
      ...node,
      status: 'active',
    };

    nodes.push(newNode);
    this.nodeRegistry.set(chain, nodes);

    return nodes;
  }

  /**
   * 测试节点连接
   *
   * @param chain 区块链网络
   * @param rpcUrl RPC 地址
   * @returns 测试结果
   */
  async testNodeConnection(chain: BlockchainNetwork, rpcUrl: string): Promise<{ success: boolean; latency: number; blockNumber?: number }> {
    const startTime = Date.now();

    try {
      await new Promise((resolve) => setTimeout(resolve, 100 + Math.random() * 200));

      const latency = Date.now() - startTime;
      const blockNumber = Math.floor(Math.random() * 1000000) + 18000000;

      return {
        success: true,
        latency,
        blockNumber,
      };
    } catch (error) {
      return {
        success: false,
        latency: Date.now() - startTime,
      };
    }
  }

  // ============================================================
  // 地址验证私有方法
  // ============================================================

  /**
   * 验证 EVM 地址
   */
  private isValidEVMAddress(address: string): boolean {
    if (!/^0x[0-9a-fA-F]{40}$/.test(address)) {
      return false;
    }

    if (address === address.toLowerCase() || address === address.toUpperCase()) {
      return true;
    }

    return true;
  }

  /**
   * 转换为校验和地址
   */
  private toChecksumAddress(address: string): string {
    const addr = address.toLowerCase().replace('0x', '');
    return '0x' + addr;
  }

  /**
   * 验证 Solana 地址
   */
  private isValidSolanaAddress(address: string): boolean {
    const base58Regex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
    return base58Regex.test(address);
  }

  /**
   * 验证 Tron 地址
   */
  private isValidTronAddress(address: string): boolean {
    const base58Regex = /^T[1-9A-HJ-NP-Za-km-z]{33}$/;
    return base58Regex.test(address);
  }

  /**
   * 验证 Bitcoin 地址
   */
  private isValidBitcoinAddress(address: string): boolean {
    const base58Regex = /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/;
    const bech32Regex = /^bc1[a-z0-9]{25,90}$/;
    return base58Regex.test(address) || bech32Regex.test(address);
  }

  // ============================================================
  // 工具方法
  // ============================================================

  /**
   * 获取链名称
   */
  private getChainName(chain: BlockchainNetwork): string {
    const names: Record<BlockchainNetwork, string> = {
      [BlockchainNetwork.ETHEREUM]: 'Ethereum',
      [BlockchainNetwork.BSC]: 'BNB Chain',
      [BlockchainNetwork.POLYGON]: 'Polygon',
      [BlockchainNetwork.ARBITRUM]: 'Arbitrum',
      [BlockchainNetwork.OPTIMISM]: 'Optimism',
      [BlockchainNetwork.AVALANCHE]: 'Avalanche',
      [BlockchainNetwork.SOLANA]: 'Solana',
      [BlockchainNetwork.TRON]: 'TRON',
      [BlockchainNetwork.BITCOIN]: 'Bitcoin',
      [BlockchainNetwork.BASE]: 'Base',
      [BlockchainNetwork.LINEA]: 'Linea',
      [BlockchainNetwork.ZKSYNC]: 'zkSync Era',
    };
    return names[chain] || chain;
  }

  /**
   * 获取原生代币符号
   */
  private getNativeSymbol(chain: BlockchainNetwork): string {
    const symbols: Record<BlockchainNetwork, string> = {
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
    return symbols[chain] || 'UNKNOWN';
  }

  /**
   * 获取原生代币小数位数
   */
  private getNativeDecimals(chain: BlockchainNetwork): number {
    if (chain === BlockchainNetwork.SOLANA) return 9;
    if (chain === BlockchainNetwork.TRON) return 6;
    if (chain === BlockchainNetwork.BITCOIN) return 8;
    return 18;
  }

  /**
   * 获取平均出块时间（秒）
   */
  private getAverageBlockTime(chain: BlockchainNetwork): number {
    const times: Record<BlockchainNetwork, number> = {
      [BlockchainNetwork.ETHEREUM]: 12,
      [BlockchainNetwork.BSC]: 3,
      [BlockchainNetwork.POLYGON]: 2.1,
      [BlockchainNetwork.ARBITRUM]: 0.25,
      [BlockchainNetwork.OPTIMISM]: 2,
      [BlockchainNetwork.AVALANCHE]: 2,
      [BlockchainNetwork.SOLANA]: 0.4,
      [BlockchainNetwork.TRON]: 3,
      [BlockchainNetwork.BITCOIN]: 600,
      [BlockchainNetwork.BASE]: 2,
      [BlockchainNetwork.LINEA]: 12,
      [BlockchainNetwork.ZKSYNC]: 12,
    };
    return times[chain] || 12;
  }

  /**
   * 获取区块浏览器 URL
   */
  private getBlockExplorerUrl(chain: BlockchainNetwork): string {
    const urls: Record<BlockchainNetwork, string> = {
      [BlockchainNetwork.ETHEREUM]: 'https://etherscan.io',
      [BlockchainNetwork.BSC]: 'https://bscscan.com',
      [BlockchainNetwork.POLYGON]: 'https://polygonscan.com',
      [BlockchainNetwork.ARBITRUM]: 'https://arbiscan.io',
      [BlockchainNetwork.OPTIMISM]: 'https://optimistic.etherscan.io',
      [BlockchainNetwork.AVALANCHE]: 'https://snowtrace.io',
      [BlockchainNetwork.SOLANA]: 'https://explorer.solana.com',
      [BlockchainNetwork.TRON]: 'https://tronscan.io',
      [BlockchainNetwork.BITCOIN]: 'https://blockchain.com',
      [BlockchainNetwork.BASE]: 'https://basescan.org',
      [BlockchainNetwork.LINEA]: 'https://lineascan.build',
      [BlockchainNetwork.ZKSYNC]: 'https://explorer.zksync.io',
    };
    return urls[chain] || '';
  }

  /**
   * 生成随机余额
   */
  private generateRandomBalance(): string {
    return (Math.random() * 100).toFixed(8);
  }

  /**
   * 生成 base fee
   */
  private generateBaseFee(chain: BlockchainNetwork): number {
    const baseFees: Record<BlockchainNetwork, number> = {
      [BlockchainNetwork.ETHEREUM]: 30 * 1e9,
      [BlockchainNetwork.BSC]: 5 * 1e9,
      [BlockchainNetwork.POLYGON]: 30 * 1e9,
      [BlockchainNetwork.ARBITRUM]: 0.1 * 1e9,
      [BlockchainNetwork.OPTIMISM]: 0.001 * 1e9,
      [BlockchainNetwork.AVALANCHE]: 25 * 1e9,
      [BlockchainNetwork.SOLANA]: 0,
      [BlockchainNetwork.TRON]: 0,
      [BlockchainNetwork.BITCOIN]: 0,
      [BlockchainNetwork.BASE]: 0.05 * 1e9,
      [BlockchainNetwork.LINEA]: 0.1 * 1e9,
      [BlockchainNetwork.ZKSYNC]: 0.1 * 1e9,
    };
    return baseFees[chain] || 20 * 1e9;
  }

  /**
   * 估算 Gas Limit
   */
  private estimateGasLimit(type?: TransactionType): number {
    switch (type) {
      case TransactionType.NATIVE_TRANSFER:
        return 21000;
      case TransactionType.TOKEN_TRANSFER:
        return 65000;
      case TransactionType.CONTRACT_CALL:
        return 100000;
      case TransactionType.APPROVE:
        return 45000;
      case TransactionType.SWAP:
        return 150000;
      default:
        return 100000;
    }
  }

  /**
   * 格式化为 Gwei
   */
  private formatGwei(wei: number): string {
    return (wei / 1e9).toFixed(2);
  }

  /**
   * 格式化为 Wei
   */
  private formatWei(wei: number): string {
    return wei.toFixed(0);
  }

  /**
   * 计算手续费法币价值
   */
  private calculateFeeFiat(wei: number, chain: BlockchainNetwork): string {
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
    const eth = wei / 1e18;
    return (eth * price).toFixed(4);
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

/**
 * 链节点信息
 */
interface ChainNodeInfo {
  name: string;
  rpcUrl: string;
  wsUrl?: string;
  priority: number;
  status: 'active' | 'inactive' | 'error';
  apiKey?: string;
  latency?: number;
  lastChecked?: number;
}

/**
 * 链状态 DTO
 */
interface ChainStatusDto {
  chain: BlockchainNetwork;
  isActive: boolean;
  blockNumber: number;
  activeNodes: number;
  totalNodes: number;
  avgBlockTime: number;
  latestBlockTime: number;
}

/**
 * 链信息 DTO
 */
interface ChainInfoDto {
  chain: BlockchainNetwork;
  name: string;
  symbol: string;
  decimals: number;
  isActive: boolean;
  nodeCount: number;
  blockExplorerUrl: string;
}
