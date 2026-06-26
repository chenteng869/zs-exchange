/**
 * 交易历史服务
 *
 * 功能：
 *  - 交易记录管理
 *  - 交易状态追踪
 *  - 交易详情查询
 *  - 交易搜索和筛选
 *  - 交易分类
 *  - 交易标签
 *  - 交易备注
 *  - 导出交易记录
 *  - 交易统计
 *  - 地址簿管理
 *  - 交易风险评估
 */

// ============================================================================
// 类型定义
// ============================================================================

export interface TransactionRecord {
  hash: string;
  chain: string;
  chainId: number;
  from: string;
  to: string;
  value: string;
  valueFormatted: string;
  valueUsd?: string;
  gasPrice: string;
  gasLimit: string;
  gasUsed?: string;
  gasFee?: string;
  gasFeeFormatted?: string;
  gasFeeUsd?: string;
  nonce: number;
  data?: string;
  status: TransactionStatus;
  type: TransactionType;
  category: TransactionCategory;
  direction: 'in' | 'out' | 'self';
  blockNumber?: number;
  blockHash?: string;
  timestamp: number;
  confirmations?: number;
  maxConfirmations?: number;
  feeToken?: TokenInfo;
  tokens?: TokenTransfer[];
  nfts?: NftTransfer[];
  contractAddress?: string;
  method?: string;
  methodId?: string;
  error?: string;
  revertReason?: string;
  tags: string[];
  notes?: string;
  isScam?: boolean;
  riskLevel?: 'safe' | 'warning' | 'danger';
  relatedTransactions?: string[];
  labels: TransactionLabel[];
}

export type TransactionStatus =
  | 'pending'
  | 'confirmed'
  | 'failed'
  | 'replaced'
  | 'cancelled'
  | 'dropped';

export type TransactionType =
  | 'transfer'
  | 'token_transfer'
  | 'nft_transfer'
  | 'contract_deployment'
  | 'contract_call'
  | 'approve'
  | 'swap'
  | 'stake'
  | 'unstake'
  | 'claim'
  | 'delegate'
  | 'undelegate'
  | 'wrap'
  | 'unwrap'
  | 'bridge_in'
  | 'bridge_out'
  | 'mint'
  | 'burn'
  | 'airdrop'
  | 'multisig'
  | 'other';

export type TransactionCategory =
  | 'send'
  | 'receive'
  | 'swap'
  | 'defi'
  | 'nft'
  | 'staking'
  | 'bridge'
  | 'contract'
  | 'internal';

export interface TransactionLabel {
  key: string;
  value: string;
  color?: string;
}

export interface TokenTransfer {
  token: TokenInfo;
  from: string;
  to: string;
  amount: string;
  amountFormatted: string;
  usdValue?: string;
  tokenId?: string;
}

export interface NftTransfer {
  contract: string;
  tokenId: string;
  from: string;
  to: string;
  name?: string;
  image?: string;
  collection?: string;
}

export interface TokenInfo {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  logoURI?: string;
  isNative?: boolean;
}

export interface TransactionFilter {
  chain?: string;
  address?: string;
  type?: TransactionType;
  category?: TransactionCategory;
  status?: TransactionStatus;
  direction?: 'in' | 'out';
  startDate?: number;
  endDate?: number;
  minValue?: string;
  maxValue?: string;
  tokenAddress?: string;
  contractAddress?: string;
  method?: string;
  tags?: string[];
  isScam?: boolean;
  riskLevel?: string;
  search?: string;
  sortBy?: 'timestamp' | 'value' | 'fee';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}

export interface TransactionStats {
  totalTransactions: number;
  totalSent: number;
  totalReceived: number;
  totalFees: string;
  totalFeesUsd: string;
  totalVolume: string;
  totalVolumeUsd: string;
  successRate: number;
  avgGasPrice: string;
  avgConfirmationTime: number;
  firstTransactionDate?: number;
  lastTransactionDate?: number;
  uniqueAddresses: number;
  uniqueTokens: number;
  byType: Record<string, number>;
  byCategory: Record<string, number>;
}

export interface TransactionExportOptions {
  format: 'csv' | 'json' | 'xlsx';
  fields?: string[];
  includeHeaders?: boolean;
  locale?: string;
}

export interface AddressBookEntry {
  address: string;
  name: string;
  label: string;
  description?: string;
  chain?: string;
  tags: string[];
  isFavorite: boolean;
  isBlacklisted: boolean;
  riskLevel?: 'safe' | 'warning' | 'danger';
  lastUsed?: number;
  createdAt: number;
  updatedAt: number;
}

export interface PendingTransaction {
  hash: string;
  submittedAt: number;
  expectedBlocks?: number;
  currentBlock?: number;
  estimatedTime?: number;
  status: 'pending' | 'replaced' | 'cancelled';
  originalGasPrice?: string;
  speedUpCount: number;
  cancelCount: number;
}

// ============================================================================
// 交易分类配置
// ============================================================================

export const TRANSACTION_METHOD_MAP: Record<string, { method: string; type: TransactionType; category: TransactionCategory }> = {
  '0xa9059cbb': { method: 'transfer', type: 'token_transfer', category: 'send' },
  '0x23b872dd': { method: 'transferFrom', type: 'token_transfer', category: 'send' },
  '0x095ea7b3': { method: 'approve', type: 'approve', category: 'defi' },
  '0x38ed1739': { method: 'swapExactTokensForTokens', type: 'swap', category: 'swap' },
  '0x7ff36ab5': { method: 'swapExactETHForTokens', type: 'swap', category: 'swap' },
  '0x18cbafe5': { method: 'swapExactTokensForETH', type: 'swap', category: 'swap' },
  '0xfb3bdb41': { method: 'swapETHForExactTokens', type: 'swap', category: 'swap' },
  '0x5c11d795': { method: 'swapExactTokensForTokensSupportingFeeOnTransferTokens', type: 'swap', category: 'swap' },
  '0xb6f9de95': { method: 'swapExactETHForTokensSupportingFeeOnTransferTokens', type: 'swap', category: 'swap' },
  '0x791ac947': { method: 'swapExactTokensForETHSupportingFeeOnTransferTokens', type: 'swap', category: 'swap' },
  '0x6ebd4949': { method: 'stake', type: 'stake', category: 'staking' },
  '0x2e1a7d4d': { method: 'withdraw', type: 'unstake', category: 'staking' },
  '0x3d4a266c': { method: 'getReward', type: 'claim', category: 'staking' },
  '0x64278152': { method: 'enter', type: 'stake', category: 'staking' },
  '0xbe65b368': { method: 'leave', type: 'unstake', category: 'staking' },
  '0xd0e30db0': { method: 'deposit', type: 'wrap', category: 'defi' },
  '0x2e1a7d4d_weth': { method: 'withdraw', type: 'unwrap', category: 'defi' },
  '0x42842e0e': { method: 'safeTransferFrom', type: 'nft_transfer', category: 'nft' },
  '0xb88d4fde': { method: 'safeTransferFrom data', type: 'nft_transfer', category: 'nft' },
  '0xf242432a': { method: 'safeTransferFrom 1155', type: 'nft_transfer', category: 'nft' },
  '0x2eb2c2d6': { method: 'safeBatchTransferFrom', type: 'nft_transfer', category: 'nft' },
  '0x1249c58b': { method: 'mint', type: 'mint', category: 'nft' },
  '0xa0712d68': { method: 'mint', type: 'mint', category: 'nft' },
};

// ============================================================================
// 交易历史服务
// ============================================================================

export class TransactionHistoryService {
  private transactions: Map<string, TransactionRecord> = new Map();
  private addressTransactions: Map<string, Set<string>> = new Map();
  private pendingTransactions: Map<string, PendingTransaction> = new Map();
  private addressBook: Map<string, AddressBookEntry> = new Map();
  private labels: Map<string, TransactionLabel[]> = new Map();
  private tags: Set<string> = new Set();
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private cacheTTL: number = 30 * 1000;
  private maxTransactions: number = 10000;

  constructor() {
    this.initializeDefaultTags();
  }

  private initializeDefaultTags(): void {
    const defaultTags = ['important', 'recurring', 'salary', 'investment', 'expense', 'gift', 'refund', 'airdrop'];
    for (const tag of defaultTags) {
      this.tags.add(tag);
    }
  }

  // ========================================================================
  // 交易管理
  // ========================================================================

  /**
   * 添加交易
   */
  addTransaction(tx: TransactionRecord): void {
    this.transactions.set(tx.hash, tx);

    if (!this.addressTransactions.has(tx.from)) {
      this.addressTransactions.set(tx.from, new Set());
    }
    this.addressTransactions.get(tx.from)!.add(tx.hash);

    if (!this.addressTransactions.has(tx.to)) {
      this.addressTransactions.set(tx.to, new Set());
    }
    this.addressTransactions.get(tx.to)!.add(tx.hash);

    if (this.transactions.size > this.maxTransactions) {
      this.cleanupOldTransactions();
    }
  }

  /**
   * 批量添加交易
   */
  addTransactions(txs: TransactionRecord[]): void {
    for (const tx of txs) {
      this.addTransaction(tx);
    }
  }

  /**
   * 获取交易
   */
  getTransaction(hash: string): TransactionRecord | undefined {
    return this.transactions.get(hash);
  }

  /**
   * 更新交易状态
   */
  updateTransactionStatus(hash: string, status: TransactionStatus, data?: Partial<TransactionRecord>): boolean {
    const tx = this.transactions.get(hash);
    if (!tx) return false;

    tx.status = status;
    if (data) {
      Object.assign(tx, data);
    }

    if (status === 'confirmed' || status === 'failed') {
      this.pendingTransactions.delete(hash);
    }

    return true;
  }

  /**
   * 查询交易列表
   */
  getTransactions(filter: TransactionFilter = {}): { transactions: TransactionRecord[]; total: number; page: number; pageSize: number } {
    let transactions = Array.from(this.transactions.values());

    if (filter.chain) {
      transactions = transactions.filter((t) => t.chain === filter.chain);
    }
    if (filter.address) {
      const addr = filter.address.toLowerCase();
      transactions = transactions.filter(
        (t) =>
          t.from.toLowerCase() === addr ||
          t.to.toLowerCase() === addr ||
          t.tokens?.some((tok) => tok.from.toLowerCase() === addr || tok.to.toLowerCase() === addr)
      );
    }
    if (filter.type) {
      transactions = transactions.filter((t) => t.type === filter.type);
    }
    if (filter.category) {
      transactions = transactions.filter((t) => t.category === filter.category);
    }
    if (filter.status) {
      transactions = transactions.filter((t) => t.status === filter.status);
    }
    if (filter.direction && filter.address) {
      const addr = filter.address.toLowerCase();
      transactions = transactions.filter((t) => {
        if (filter.direction === 'in') return t.to.toLowerCase() === addr;
        return t.from.toLowerCase() === addr;
      });
    }
    if (filter.startDate) {
      transactions = transactions.filter((t) => t.timestamp >= filter.startDate!);
    }
    if (filter.endDate) {
      transactions = transactions.filter((t) => t.timestamp <= filter.endDate!);
    }
    if (filter.tokenAddress) {
      const tokenAddr = filter.tokenAddress.toLowerCase();
      transactions = transactions.filter(
        (t) => t.tokens?.some((tok) => tok.token.address.toLowerCase() === tokenAddr)
      );
    }
    if (filter.contractAddress) {
      const contractAddr = filter.contractAddress.toLowerCase();
      transactions = transactions.filter((t) => t.contractAddress?.toLowerCase() === contractAddr);
    }
    if (filter.method) {
      transactions = transactions.filter((t) => t.method?.toLowerCase() === filter.method!.toLowerCase());
    }
    if (filter.tags && filter.tags.length > 0) {
      transactions = transactions.filter((t) =>
        filter.tags!.some((tag) => t.tags.includes(tag))
      );
    }
    if (filter.isScam !== undefined) {
      transactions = transactions.filter((t) => t.isScam === filter.isScam);
    }
    if (filter.riskLevel) {
      transactions = transactions.filter((t) => t.riskLevel === filter.riskLevel);
    }
    if (filter.search) {
      const search = filter.search.toLowerCase();
      transactions = transactions.filter(
        (t) =>
          t.hash.toLowerCase().includes(search) ||
          t.from.toLowerCase().includes(search) ||
          t.to.toLowerCase().includes(search) ||
          t.notes?.toLowerCase().includes(search) ||
          t.tags.some((tag) => tag.toLowerCase().includes(search)) ||
          t.tokens?.some((tok) => tok.token.symbol.toLowerCase().includes(search))
      );
    }

    const sortBy = filter.sortBy || 'timestamp';
    const sortOrder = filter.sortOrder || 'desc';
    transactions.sort((a, b) => {
      let diff = 0;
      switch (sortBy) {
        case 'timestamp':
          diff = a.timestamp - b.timestamp;
          break;
        case 'value':
          diff = parseFloat(a.valueFormatted) - parseFloat(b.valueFormatted);
          break;
        case 'fee':
          diff = parseFloat(a.gasFeeFormatted || '0') - parseFloat(b.gasFeeFormatted || '0');
          break;
      }
      return sortOrder === 'desc' ? -diff : diff;
    });

    const total = transactions.length;
    const page = filter.page || 1;
    const pageSize = filter.pageSize || 20;
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    transactions = transactions.slice(start, end);

    return { transactions, total, page, pageSize };
  }

  // ========================================================================
  // 待处理交易
  // ========================================================================

  /**
   * 添加待处理交易
   */
  addPendingTransaction(hash: string, expectedBlocks?: number): void {
    this.pendingTransactions.set(hash, {
      hash,
      submittedAt: Date.now(),
      expectedBlocks,
      status: 'pending',
      speedUpCount: 0,
      cancelCount: 0,
    });
  }

  /**
   * 获取待处理交易
   */
  getPendingTransactions(): PendingTransaction[] {
    return Array.from(this.pendingTransactions.values()).sort(
      (a, b) => b.submittedAt - a.submittedAt
    );
  }

  /**
   * 加速交易
   */
  speedUpTransaction(hash: string, newHash: string): boolean {
    const pending = this.pendingTransactions.get(hash);
    if (!pending) return false;

    pending.status = 'replaced';
    pending.speedUpCount++;

    this.pendingTransactions.set(newHash, {
      hash: newHash,
      submittedAt: Date.now(),
      status: 'pending',
      speedUpCount: pending.speedUpCount,
      cancelCount: pending.cancelCount,
    });

    return true;
  }

  /**
   * 取消交易
   */
  cancelTransaction(hash: string, cancelHash: string): boolean {
    const pending = this.pendingTransactions.get(hash);
    if (!pending) return false;

    pending.status = 'cancelled';
    pending.cancelCount++;

    this.pendingTransactions.set(cancelHash, {
      hash: cancelHash,
      submittedAt: Date.now(),
      status: 'pending',
      speedUpCount: pending.speedUpCount,
      cancelCount: pending.cancelCount,
    });

    return true;
  }

  // ========================================================================
  // 地址簿
  // ========================================================================

  /**
   * 添加地址簿条目
   */
  addAddressBookEntry(entry: AddressBookEntry): void {
    this.addressBook.set(entry.address.toLowerCase(), {
      ...entry,
      updatedAt: Date.now(),
    });
  }

  /**
   * 获取地址簿条目
   */
  getAddressBookEntry(address: string): AddressBookEntry | undefined {
    return this.addressBook.get(address.toLowerCase());
  }

  /**
   * 获取所有地址簿条目
   */
  getAddressBook(options: {
    chain?: string;
    isFavorite?: boolean;
    isBlacklisted?: boolean;
    search?: string;
    sortBy?: 'name' | 'lastUsed' | 'createdAt';
    sortOrder?: 'asc' | 'desc';
  } = {}): AddressBookEntry[] {
    let entries = Array.from(this.addressBook.values());

    if (options.chain) {
      entries = entries.filter((e) => e.chain === options.chain || !e.chain);
    }
    if (options.isFavorite !== undefined) {
      entries = entries.filter((e) => e.isFavorite === options.isFavorite);
    }
    if (options.isBlacklisted !== undefined) {
      entries = entries.filter((e) => e.isBlacklisted === options.isBlacklisted);
    }
    if (options.search) {
      const search = options.search.toLowerCase();
      entries = entries.filter(
        (e) =>
          e.name.toLowerCase().includes(search) ||
          e.address.toLowerCase().includes(search) ||
          e.label.toLowerCase().includes(search) ||
          e.tags.some((t) => t.toLowerCase().includes(search))
      );
    }

    const sortBy = options.sortBy || 'name';
    const sortOrder = options.sortOrder || 'asc';
    entries.sort((a, b) => {
      let diff = 0;
      switch (sortBy) {
        case 'name':
          diff = a.name.localeCompare(b.name);
          break;
        case 'lastUsed':
          diff = (a.lastUsed || 0) - (b.lastUsed || 0);
          break;
        case 'createdAt':
          diff = a.createdAt - b.createdAt;
          break;
      }
      return sortOrder === 'desc' ? -diff : diff;
    });

    return entries;
  }

  /**
   * 更新地址簿条目
   */
  updateAddressBookEntry(address: string, updates: Partial<AddressBookEntry>): boolean {
    const entry = this.addressBook.get(address.toLowerCase());
    if (!entry) return false;

    Object.assign(entry, updates, { updatedAt: Date.now() });
    return true;
  }

  /**
   * 删除地址簿条目
   */
  deleteAddressBookEntry(address: string): boolean {
    return this.addressBook.delete(address.toLowerCase());
  }

  /**
   * 标记收藏
   */
  toggleFavorite(address: string): boolean {
    const entry = this.addressBook.get(address.toLowerCase());
    if (!entry) return false;
    entry.isFavorite = !entry.isFavorite;
    entry.updatedAt = Date.now();
    return entry.isFavorite;
  }

  /**
   * 标记黑名单
   */
  toggleBlacklist(address: string): boolean {
    const entry = this.addressBook.get(address.toLowerCase());
    if (entry) {
      entry.isBlacklisted = !entry.isBlacklisted;
      entry.updatedAt = Date.now();
      return entry.isBlacklisted;
    }

    this.addAddressBookEntry({
      address,
      name: address.slice(0, 10) + '...' + address.slice(-8),
      label: 'Unknown',
      tags: [],
      isFavorite: false,
      isBlacklisted: true,
      riskLevel: 'danger',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return true;
  }

  // ========================================================================
  // 交易标签和备注
  // ========================================================================

  /**
   * 添加标签
   */
  addTag(tag: string): boolean {
    if (this.tags.has(tag)) return false;
    this.tags.add(tag);
    return true;
  }

  /**
   * 获取所有标签
   */
  getAllTags(): string[] {
    return Array.from(this.tags);
  }

  /**
   * 删除标签
   */
  deleteTag(tag: string): boolean {
    return this.tags.delete(tag);
  }

  /**
   * 给交易添加标签
   */
  addTransactionTag(hash: string, tag: string): boolean {
    const tx = this.transactions.get(hash);
    if (!tx) return false;
    if (!tx.tags.includes(tag)) {
      tx.tags.push(tag);
      this.tags.add(tag);
    }
    return true;
  }

  /**
   * 移除交易标签
   */
  removeTransactionTag(hash: string, tag: string): boolean {
    const tx = this.transactions.get(hash);
    if (!tx) return false;
    const index = tx.tags.indexOf(tag);
    if (index > -1) {
      tx.tags.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * 设置交易备注
   */
  setTransactionNotes(hash: string, notes: string): boolean {
    const tx = this.transactions.get(hash);
    if (!tx) return false;
    tx.notes = notes;
    return true;
  }

  // ========================================================================
  // 统计信息
  // ========================================================================

  getStats(address?: string, chain?: string): TransactionStats {
    let transactions = Array.from(this.transactions.values());

    if (chain) {
      transactions = transactions.filter((t) => t.chain === chain);
    }
    if (address) {
      const addr = address.toLowerCase();
      transactions = transactions.filter(
        (t) => t.from.toLowerCase() === addr || t.to.toLowerCase() === addr
      );
    }

    const totalTransactions = transactions.length;
    let totalSent = 0;
    let totalReceived = 0;
    let totalFees = 0;
    let totalVolume = 0;
    let successCount = 0;
    let totalGasPrice = 0;
    let uniqueAddresses = new Set<string>();
    let uniqueTokens = new Set<string>();
    let firstDate: number | undefined;
    let lastDate: number | undefined;

    const byType: Record<string, number> = {};
    const byCategory: Record<string, number> = {};

    for (const tx of transactions) {
      const value = parseFloat(tx.valueFormatted);
      const fee = parseFloat(tx.gasFeeFormatted || '0');

      if (tx.status === 'confirmed') successCount++;
      totalVolume += value;
      totalFees += fee;
      totalGasPrice += parseFloat(tx.gasPrice);

      if (address) {
        const addr = address.toLowerCase();
        if (tx.from.toLowerCase() === addr) {
          totalSent += value;
        } else if (tx.to.toLowerCase() === addr) {
          totalReceived += value;
        }
      }

      uniqueAddresses.add(tx.from);
      uniqueAddresses.add(tx.to);

      if (tx.tokens) {
        for (const tok of tx.tokens) {
          uniqueTokens.add(tok.token.address);
        }
      }

      byType[tx.type] = (byType[tx.type] || 0) + 1;
      byCategory[tx.category] = (byCategory[tx.category] || 0) + 1;

      if (!firstDate || tx.timestamp < firstDate) firstDate = tx.timestamp;
      if (!lastDate || tx.timestamp > lastDate) lastDate = tx.timestamp;
    }

    return {
      totalTransactions,
      totalSent,
      totalReceived,
      totalFees: totalFees.toFixed(8),
      totalFeesUsd: '0',
      totalVolume: totalVolume.toFixed(8),
      totalVolumeUsd: '0',
      successRate: totalTransactions > 0 ? (successCount / totalTransactions) * 100 : 0,
      avgGasPrice: totalTransactions > 0 ? (totalGasPrice / totalTransactions).toString() : '0',
      avgConfirmationTime: 0,
      firstTransactionDate: firstDate,
      lastTransactionDate: lastDate,
      uniqueAddresses: uniqueAddresses.size,
      uniqueTokens: uniqueTokens.size,
      byType,
      byCategory,
    };
  }

  // ========================================================================
  // 导出
  // ========================================================================

  exportTransactions(
    filter: TransactionFilter,
    options: TransactionExportOptions
  ): string {
    const { transactions } = this.getTransactions({ ...filter, page: 1, pageSize: 10000 });

    if (options.format === 'json') {
      return JSON.stringify(transactions, null, 2);
    }

    if (options.format === 'csv') {
      const fields = options.fields || [
        'hash', 'chain', 'from', 'to', 'valueFormatted', 'status', 'type',
        'timestamp', 'gasFeeFormatted', 'method', 'notes'
      ];

      const headers = fields.join(',');
      const rows = transactions.map((tx) =>
        fields.map((f) => {
          let val = (tx as any)[f];
          if (typeof val === 'string' && val.includes(',')) {
            val = `"${val.replace(/"/g, '""')}"`;
          }
          return val ?? '';
        }).join(',')
      );

      return [headers, ...rows].join('\n');
    }

    return '';
  }

  // ========================================================================
  // 交易解析
  // ========================================================================

  /**
   * 解析交易类型
   */
  parseTransactionType(data?: string, value?: string, to?: string): { type: TransactionType; method?: string; category: TransactionCategory } {
    if (!data || data.length < 10) {
      if (value && BigInt(value) > 0n) {
        return { type: 'transfer', category: 'send' };
      }
      return { type: 'other', category: 'contract' };
    }

    const methodId = data.slice(0, 10).toLowerCase();
    const mapping = TRANSACTION_METHOD_MAP[methodId];

    if (mapping) {
      return mapping;
    }

    return { type: 'contract_call', method: methodId, category: 'contract' };
  }

  /**
   * 检测交易方向
   */
  detectDirection(from: string, to: string, userAddress: string): 'in' | 'out' | 'self' {
    const user = userAddress.toLowerCase();
    if (from.toLowerCase() === user && to.toLowerCase() === user) return 'self';
    if (to.toLowerCase() === user) return 'in';
    return 'out';
  }

  /**
   * 风险评估
   */
  assessRisk(tx: TransactionRecord): 'safe' | 'warning' | 'danger' {
    if (tx.isScam) return 'danger';

    const toEntry = this.addressBook.get(tx.to.toLowerCase());
    if (toEntry?.isBlacklisted) return 'danger';
    if (toEntry?.riskLevel === 'danger') return 'danger';
    if (toEntry?.riskLevel === 'warning') return 'warning';
    if (toEntry) return 'safe';

    if (tx.type === 'approve' && BigInt(tx.value) === 0n) {
      return 'warning';
    }

    if (tx.category === 'defi' && !toEntry?.isFavorite) {
      return 'warning';
    }

    return 'safe';
  }

  // ========================================================================
  // 工具方法
  // ========================================================================

  private cleanupOldTransactions(): void {
    const sorted = Array.from(this.transactions.values()).sort(
      (a, b) => b.timestamp - a.timestamp
    );
    const toRemove = sorted.slice(this.maxTransactions);
    for (const tx of toRemove) {
      this.transactions.delete(tx.hash);
      for (const [addr, hashes] of this.addressTransactions) {
        hashes.delete(tx.hash);
      }
    }
  }

  /**
   * 获取交易数量
   */
  getTransactionCount(): number {
    return this.transactions.size;
  }

  /**
   * 清除缓存
   */
  clearCache(): void {
    this.cache.clear();
  }
}

// ============================================================================
// 默认导出
// ============================================================================

export default {
  TransactionHistoryService,
  TRANSACTION_METHOD_MAP,
};
