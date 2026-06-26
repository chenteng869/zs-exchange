/**
 * 域名服务模块
 *
 * 支持的域名系统：
 *  - ENS (Ethereum Name Service)
 *  - SNS (Solana Name Service)
 *  - BNS (Base Name Service)
 *  - .bit (DAS)
 *  - Unstoppable Domains
 *  - Lens Protocol
 *  - Farcaster
 *  - Cosmos Names
 *  - TRON DAO
 *  - Space ID
 *
 * 功能：
 *  - 地址解析（正向解析）
 *  - 反向解析
 *  - 域名注册查询
 *  - 域名可用性检查
 *  - 域名信息查询
 *  - 批量解析
 *  - 缓存管理
 */

// ============================================================================
// 类型定义
// ============================================================================

export interface DomainName {
  name: string;
  normalizedName: string;
  topLevelDomain: string;
  fullName: string;
  registry: DomainRegistry;
  chain: string;
  chainId: number;
  isValid: boolean;
  isAvailable?: boolean;
  registered?: boolean;
  expiryDate?: number;
  createdAt?: number;
  owner?: string;
  manager?: string;
  resolver?: string;
  addresses: Record<string, string>;
  textRecords: Record<string, string>;
  contentHash?: string;
  avatar?: string;
  description?: string;
  url?: string;
  email?: string;
  twitter?: string;
  github?: string;
  discord?: string;
  telegram?: string;
  isPremium?: boolean;
  price?: string;
  renewalPrice?: string;
  gracePeriodEnd?: number;
  isWrapped?: boolean;
  fuses?: string[];
}

export type DomainRegistry =
  | 'ens'
  | 'sns'
  | 'bns'
  | 'bit'
  | 'unstoppable'
  | 'lens'
  | 'farcaster'
  | 'cosmos_names'
  | 'tron_dao'
  | 'space_id'
  | 'unknown';

export interface DomainResolutionResult {
  success: boolean;
  domain?: string;
  address?: string;
  registry?: DomainRegistry;
  chain?: string;
  error?: string;
  cacheHit?: boolean;
  timestamp: number;
}

export interface ReverseResolutionResult {
  success: boolean;
  address?: string;
  domain?: string;
  registry?: DomainRegistry;
  chain?: string;
  error?: string;
  cacheHit?: boolean;
  timestamp: number;
}

export interface BatchResolutionRequest {
  inputs: string[];
  type: 'forward' | 'reverse';
  chain?: string;
  registry?: DomainRegistry;
}

export interface BatchResolutionResult {
  results: Map<string, DomainResolutionResult | ReverseResolutionResult>;
  total: number;
  successCount: number;
  failedCount: number;
  duration: number;
}

export interface DomainAvailability {
  name: string;
  tld: string;
  isAvailable: boolean;
  price?: string;
  premium?: boolean;
  premiumPrice?: string;
  estimatedFee?: string;
  renewalPrice?: string;
  registrationYears?: number;
}

export interface DomainRecord {
  key: string;
  value: string;
  type: 'address' | 'text' | 'content' | 'interface';
  verified?: boolean;
}

export interface DomainSearchResult {
  name: string;
  isAvailable: boolean;
  price?: string;
  registry: DomainRegistry;
  relevance: number;
  suggestions: DomainAvailability[];
}

export interface DomainFilterOptions {
  registry?: DomainRegistry;
  tld?: string;
  minLength?: number;
  maxLength?: number;
  isAvailable?: boolean;
  sortBy?: 'name' | 'price' | 'expiry' | 'relevance';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}

export interface FavoriteDomain {
  name: string;
  registry: DomainRegistry;
  addedAt: number;
  notes?: string;
  isOwned: boolean;
}

// ============================================================================
// 域名系统配置
// ============================================================================

export const DOMAIN_REGISTRIES: Record<DomainRegistry, {
  name: string;
  logoURI?: string;
  supportedChains: string[];
  supportedTLDs: string[];
  officialSite?: string;
  features: string[];
}> = {
  ens: {
    name: 'Ethereum Name Service',
    supportedChains: ['ethereum'],
    supportedTLDs: ['.eth', '.xyz', '.luxe', '.kred', '.art', '.club'],
    officialSite: 'https://ens.domains',
    features: ['reverse_resolution', 'multichain', 'text_records', 'content_hash', 'avatar', 'subdomains', 'wrapped'],
  },
  sns: {
    name: 'Solana Name Service',
    supportedChains: ['solana'],
    supportedTLDs: ['.sol'],
    officialSite: 'https://sns.id',
    features: ['reverse_resolution', 'text_records', 'subdomains'],
  },
  bns: {
    name: 'Base Name Service',
    supportedChains: ['base'],
    supportedTLDs: ['.base.eth'],
    features: ['reverse_resolution', 'text_records'],
  },
  bit: {
    name: '.bit (DAS)',
    supportedChains: ['ethereum', 'bsc', 'polygon', 'tron', 'solana'],
    supportedTLDs: ['.bit'],
    officialSite: 'https://did.id',
    features: ['reverse_resolution', 'multichain', 'cross_chain', 'text_records', 'subdomains'],
  },
  unstoppable: {
    name: 'Unstoppable Domains',
    supportedChains: ['ethereum', 'polygon'],
    supportedTLDs: ['.crypto', '.nft', '.blockchain', '.bitcoin', '.wallet', '.888', '.dao', '.x', '.klever', '.hi'],
    officialSite: 'https://unstoppabledomains.com',
    features: ['multichain', 'text_records', 'browser_support'],
  },
  lens: {
    name: 'Lens Protocol',
    supportedChains: ['polygon'],
    supportedTLDs: ['.lens'],
    officialSite: 'https://lens.xyz',
    features: ['social', 'profile', 'reverse_resolution'],
  },
  farcaster: {
    name: 'Farcaster',
    supportedChains: ['optimism'],
    supportedTLDs: ['.fcast.id'],
    officialSite: 'https://farcaster.xyz',
    features: ['social', 'profile'],
  },
  cosmos_names: {
    name: 'Cosmos Names',
    supportedChains: ['cosmos'],
    supportedTLDs: ['.cosmos'],
    features: ['reverse_resolution', 'ibc'],
  },
  tron_dao: {
    name: 'TRON DAO Names',
    supportedChains: ['tron'],
    supportedTLDs: ['.tron'],
    features: ['reverse_resolution', 'text_records'],
  },
  space_id: {
    name: 'Space ID',
    supportedChains: ['bsc', 'arbitrum', 'ethereum'],
    supportedTLDs: ['.bnb', '.arb', '.eth'],
    officialSite: 'https://space.id',
    features: ['multichain', 'reverse_resolution', 'text_records'],
  },
  unknown: {
    name: 'Unknown',
    supportedChains: [],
    supportedTLDs: [],
    features: [],
  },
};

// ============================================================================
// 示例域名数据
// ============================================================================

const MOCK_DOMAINS: Record<string, DomainName> = {
  'vitalik.eth': {
    name: 'vitalik',
    normalizedName: 'vitalik',
    topLevelDomain: '.eth',
    fullName: 'vitalik.eth',
    registry: 'ens',
    chain: 'ethereum',
    chainId: 1,
    isValid: true,
    registered: true,
    expiryDate: Date.now() + 365 * 24 * 60 * 60 * 1000,
    createdAt: Date.now() - 5 * 365 * 24 * 60 * 60 * 1000,
    owner: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
    resolver: '0x4976fb03C32e5B8cfe2b6cCB31c09Ba78EBaBa41',
    addresses: {
      ETH: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
      BTC: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
      SOL: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
    },
    textRecords: {
      email: 'vitalik@ethereum.org',
      url: 'https://vitalik.ca',
      avatar: 'https://ipfs.io/ipfs/Qm...',
      description: 'Ethereum co-founder',
      twitter: 'VitalikButerin',
      github: 'vbuterin',
    },
    contentHash: 'ipfs://Qm...',
    avatar: 'https://ipfs.io/ipfs/Qm...',
  },
  'satoshi.btc': {
    name: 'satoshi',
    normalizedName: 'satoshi',
    topLevelDomain: '.btc',
    fullName: 'satoshi.btc',
    registry: 'unstoppable',
    chain: 'ethereum',
    chainId: 1,
    isValid: true,
    registered: true,
    owner: '0x0000000000000000000000000000000000000000',
    addresses: {
      BTC: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
      ETH: '0x0000000000000000000000000000000000000000',
    },
    textRecords: {},
  },
};

// ============================================================================
// 域名服务
// ============================================================================

export class DomainService {
  private cache: Map<string, { data: any; timestamp: number; ttl: number }> = new Map();
  private favorites: FavoriteDomain[] = [];
  private defaultChain: string = 'ethereum';
  private defaultRegistry: DomainRegistry = 'ens';
  private cacheTTL: number = 5 * 60 * 1000;
  private maxCacheSize: number = 1000;

  constructor() {}

  // ========================================================================
  // 正向解析（域名 -> 地址）
  // ========================================================================

  /**
   * 解析域名
   */
  async resolve(
    domain: string,
    chain?: string,
    registry?: DomainRegistry
  ): Promise<DomainResolutionResult> {
    const normalizedDomain = this.normalizeDomain(domain);
    const cacheKey = `resolve:${normalizedDomain}:${chain || 'all'}:${registry || 'all'}`;

    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      return {
        ...cached.data,
        cacheHit: true,
        timestamp: Date.now(),
      };
    }

    const detectedRegistry = registry || this.detectRegistry(normalizedDomain);
    const detectedChain = chain || this.getDefaultChainForRegistry(detectedRegistry);

    let result: DomainResolutionResult;

    try {
      const mockDomain = MOCK_DOMAINS[normalizedDomain];
      if (mockDomain) {
        result = {
          success: true,
          domain: normalizedDomain,
          address: mockDomain.addresses['ETH'] || mockDomain.owner,
          registry: detectedRegistry,
          chain: detectedChain,
          timestamp: Date.now(),
        };
      } else {
        result = {
          success: false,
          domain: normalizedDomain,
          registry: detectedRegistry,
          chain: detectedChain,
          error: 'Domain not found',
          timestamp: Date.now(),
        };
      }
    } catch (e: any) {
      result = {
        success: false,
        domain: normalizedDomain,
        registry: detectedRegistry,
        chain: detectedChain,
        error: e.message || 'Resolution failed',
        timestamp: Date.now(),
      };
    }

    this.setCache(cacheKey, result, this.cacheTTL);
    return result;
  }

  /**
   * 获取域名详细信息
   */
  async getDomainInfo(
    domain: string,
    chain?: string
  ): Promise<DomainName | null> {
    const normalizedDomain = this.normalizeDomain(domain);
    const cacheKey = `info:${normalizedDomain}:${chain || 'all'}`;

    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      return cached.data;
    }

    const mockDomain = MOCK_DOMAINS[normalizedDomain];
    if (mockDomain) {
      this.setCache(cacheKey, mockDomain, this.cacheTTL);
      return mockDomain;
    }

    return null;
  }

  // ========================================================================
  // 反向解析（地址 -> 域名）
  // ========================================================================

  /**
   * 反向解析
   */
  async reverseResolve(
    address: string,
    chain?: string,
    registry?: DomainRegistry
  ): Promise<ReverseResolutionResult> {
    const normalizedAddress = address.toLowerCase();
    const cacheKey = `reverse:${normalizedAddress}:${chain || 'all'}:${registry || 'all'}`;

    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      return {
        ...cached.data,
        cacheHit: true,
        timestamp: Date.now(),
      };
    }

    const detectedChain = chain || this.defaultChain;

    let result: ReverseResolutionResult = {
      success: false,
      address: normalizedAddress,
      chain: detectedChain,
      error: 'No reverse record found',
      timestamp: Date.now(),
    };

    for (const [name, info] of Object.entries(MOCK_DOMAINS)) {
      if (info.owner?.toLowerCase() === normalizedAddress) {
        result = {
          success: true,
          address: normalizedAddress,
          domain: name,
          registry: info.registry,
          chain: info.chain,
          timestamp: Date.now(),
        };
        break;
      }
    }

    this.setCache(cacheKey, result, this.cacheTTL);
    return result;
  }

  // ========================================================================
  // 批量解析
  // ========================================================================

  /**
   * 批量解析
   */
  async batchResolve(
    request: BatchResolutionRequest
  ): Promise<BatchResolutionResult> {
    const startTime = Date.now();
    const results = new Map<string, DomainResolutionResult | ReverseResolutionResult>();

    const promises = request.inputs.map(async (input) => {
      if (request.type === 'forward') {
        return this.resolve(input, request.chain, request.registry);
      } else {
        return this.reverseResolve(input, request.chain, request.registry);
      }
    });

    const resolved = await Promise.all(promises);

    for (let i = 0; i < request.inputs.length; i++) {
      results.set(request.inputs[i], resolved[i]);
    }

    let successCount = 0;
    for (const result of results.values()) {
      if (result.success) successCount++;
    }

    return {
      results,
      total: request.inputs.length,
      successCount,
      failedCount: request.inputs.length - successCount,
      duration: Date.now() - startTime,
    };
  }

  // ========================================================================
  // 域名可用性
  // ========================================================================

  /**
   * 检查域名可用性
   */
  async checkAvailability(
    name: string,
    tld: string = '.eth',
    registry?: DomainRegistry
  ): Promise<DomainAvailability> {
    const normalizedName = this.normalizeName(name);
    const fullName = `${normalizedName}${tld}`;
    const cacheKey = `available:${fullName}:${registry || 'auto'}`;

    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < 60 * 1000) {
      return cached.data;
    }

    const detectedRegistry = registry || this.getRegistryForTLD(tld);
    const isAvailable = !MOCK_DOMAINS[fullName] && normalizedName.length >= 3;

    let price = this.getBasePrice(normalizedName, tld);
    const isPremium = this.isPremiumName(normalizedName);
    let premiumPrice: string | undefined;

    if (isPremium) {
      premiumPrice = (parseFloat(price) * 5).toString();
    }

    const result: DomainAvailability = {
      name: normalizedName,
      tld,
      isAvailable,
      price: isAvailable ? price : undefined,
      premium: isPremium,
      premiumPrice: isPremium ? premiumPrice : undefined,
      renewalPrice: price,
      registrationYears: 1,
    };

    this.setCache(cacheKey, result, 60 * 1000);
    return result;
  }

  /**
   * 搜索域名
   */
  async searchDomains(
    query: string,
    options: DomainFilterOptions = {}
  ): Promise<{ results: DomainSearchResult[]; total: number }> {
    const normalizedQuery = this.normalizeName(query);
    const tlds = options.tld
      ? [options.tld]
      : ['.eth', '.sol', '.bnb', '.bit', '.lens'];

    const results: DomainSearchResult[] = [];

    for (const tld of tlds) {
      const availability = await this.checkAvailability(normalizedQuery, tld, options.registry);
      const registry = this.getRegistryForTLD(tld);

      const suggestions: DomainAvailability[] = [];
      const variations = this.generateNameVariations(normalizedQuery);
      for (const variation of variations.slice(0, 5)) {
        const sugg = await this.checkAvailability(variation, tld, registry);
        suggestions.push(sugg);
      }

      results.push({
        name: `${normalizedQuery}${tld}`,
        isAvailable: availability.isAvailable,
        price: availability.price,
        registry,
        relevance: this.calculateRelevance(normalizedQuery, normalizedQuery),
        suggestions,
      });
    }

    const sortBy = options.sortBy || 'relevance';
    const sortOrder = options.sortOrder || 'desc';
    results.sort((a, b) => {
      let diff = 0;
      switch (sortBy) {
        case 'name':
          diff = a.name.localeCompare(b.name);
          break;
        case 'price':
          diff = parseFloat(a.price || '0') - parseFloat(b.price || '0');
          break;
        case 'relevance':
          diff = a.relevance - b.relevance;
          break;
      }
      return sortOrder === 'desc' ? -diff : diff;
    });

    const total = results.length;
    const page = options.page || 1;
    const pageSize = options.pageSize || 20;
    const start = (page - 1) * pageSize;
    const paginated = results.slice(start, start + pageSize);

    return { results: paginated, total };
  }

  // ========================================================================
  // 域名记录
  // ========================================================================

  /**
   * 获取地址记录
   */
  async getAddressRecord(
    domain: string,
    coinType: string = 'ETH'
  ): Promise<string | null> {
    const info = await this.getDomainInfo(domain);
    if (!info) return null;
    return info.addresses[coinType] || null;
  }

  /**
   * 获取文本记录
   */
  async getTextRecord(
    domain: string,
    key: string
  ): Promise<string | null> {
    const info = await this.getDomainInfo(domain);
    if (!info) return null;
    return info.textRecords[key] || null;
  }

  /**
   * 获取所有记录
   */
  async getAllRecords(domain: string): Promise<DomainRecord[]> {
    const info = await this.getDomainInfo(domain);
    if (!info) return [];

    const records: DomainRecord[] = [];

    for (const [key, value] of Object.entries(info.addresses)) {
      records.push({ key, value, type: 'address' });
    }

    for (const [key, value] of Object.entries(info.textRecords)) {
      records.push({ key, value, type: 'text' });
    }

    if (info.contentHash) {
      records.push({ key: 'contenthash', value: info.contentHash, type: 'content' });
    }

    return records;
  }

  // ========================================================================
  // 收藏
  // ========================================================================

  /**
   * 添加收藏
   */
  addFavorite(name: string, registry: DomainRegistry, isOwned: boolean = false): boolean {
    const exists = this.favorites.some((f) => f.name === name && f.registry === registry);
    if (exists) return false;

    this.favorites.push({
      name,
      registry,
      addedAt: Date.now(),
      isOwned,
    });
    return true;
  }

  /**
   * 移除收藏
   */
  removeFavorite(name: string, registry: DomainRegistry): boolean {
    const index = this.favorites.findIndex((f) => f.name === name && f.registry === registry);
    if (index > -1) {
      this.favorites.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * 获取收藏列表
   */
  getFavorites(): FavoriteDomain[] {
    return [...this.favorites].sort((a, b) => b.addedAt - a.addedAt);
  }

  /**
   * 检查是否已收藏
   */
  isFavorite(name: string, registry: DomainRegistry): boolean {
    return this.favorites.some((f) => f.name === name && f.registry === registry);
  }

  // ========================================================================
  // 注册商信息
  // ========================================================================

  /**
   * 获取支持的注册商
   */
  getSupportedRegistries(): DomainRegistry[] {
    return Object.keys(DOMAIN_REGISTRIES).filter((r) => r !== 'unknown') as DomainRegistry[];
  }

  /**
   * 获取注册商信息
   */
  getRegistryInfo(registry: DomainRegistry): typeof DOMAIN_REGISTRIES.ens | null {
    return DOMAIN_REGISTRIES[registry] || null;
  }

  /**
   * 获取支持的 TLD
   */
  getSupportedTLDs(registry?: DomainRegistry): string[] {
    if (registry) {
      return DOMAIN_REGISTRIES[registry]?.supportedTLDs || [];
    }

    const tlds = new Set<string>();
    for (const reg of Object.values(DOMAIN_REGISTRIES)) {
      for (const tld of reg.supportedTLDs) {
        tlds.add(tld);
      }
    }
    return Array.from(tlds);
  }

  // ========================================================================
  // 工具方法
  // ========================================================================

  /**
   * 检测域名所属注册商
   */
  detectRegistry(domain: string): DomainRegistry {
    const lowerDomain = domain.toLowerCase();

    for (const [registry, config] of Object.entries(DOMAIN_REGISTRIES)) {
      if (registry === 'unknown') continue;
      for (const tld of config.supportedTLDs) {
        if (lowerDomain.endsWith(tld)) {
          return registry as DomainRegistry;
        }
      }
    }

    return 'unknown';
  }

  /**
   * 验证域名格式
   */
  isValidDomain(domain: string): boolean {
    if (!domain || domain.length > 253) return false;

    const labels = domain.split('.');
    if (labels.length < 2) return false;

    for (const label of labels) {
      if (label.length === 0 || label.length > 63) return false;
      if (!/^[a-z0-9-]+$/i.test(label)) return false;
      if (label.startsWith('-') || label.endsWith('-')) return false;
    }

    return true;
  }

  /**
   * 验证地址格式
   */
  isValidAddress(address: string, chain?: string): boolean {
    if (chain === 'solana') {
      return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address);
    }
    if (chain === 'bitcoin') {
      return /^(bc1|[13])[a-zA-HJ-NP-Z0-9]{25,39}$/.test(address);
    }
    if (chain === 'cosmos') {
      return /^cosmos1[a-z0-9]{38}$/.test(address);
    }
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  }

  private normalizeDomain(domain: string): string {
    return domain.toLowerCase().trim();
  }

  private normalizeName(name: string): string {
    return name.toLowerCase().trim().replace(/[^a-z0-9-]/g, '');
  }

  private getRegistryForTLD(tld: string): DomainRegistry {
    const lowerTld = tld.toLowerCase();
    for (const [registry, config] of Object.entries(DOMAIN_REGISTRIES)) {
      if (config.supportedTLDs.some((t) => t.toLowerCase() === lowerTld)) {
        return registry as DomainRegistry;
      }
    }
    return 'unknown';
  }

  private getDefaultChainForRegistry(registry: DomainRegistry): string {
    const config = DOMAIN_REGISTRIES[registry];
    if (!config || config.supportedChains.length === 0) return this.defaultChain;
    return config.supportedChains[0];
  }

  private getBasePrice(name: string, tld: string): string {
    const length = name.length;
    let basePrice = 5;

    if (length <= 3) basePrice = 640;
    else if (length === 4) basePrice = 160;
    else if (length === 5) basePrice = 5;
    else basePrice = 5;

    if (tld === '.eth') basePrice = basePrice;
    else if (tld === '.sol') basePrice = basePrice * 0.5;
    else if (tld === '.bit') basePrice = basePrice * 0.8;

    return basePrice.toFixed(2);
  }

  private isPremiumName(name: string): boolean {
    const premiumWords = ['eth', 'btc', 'crypto', 'nft', 'dao', 'defi', 'web3', 'meta', 'vip', '000', '888', '666'];
    const lowerName = name.toLowerCase();
    return premiumWords.some((word) => lowerName.includes(word)) || name.length <= 3;
  }

  private generateNameVariations(name: string): string[] {
    const variations: string[] = [];
    const suffixes = ['official', 'app', 'io', 'xyz', 'dao', 'lab', 'hq', 'studio'];
    const prefixes = ['the', 'my', 'our', 'crypto', 'web3'];

    for (const suffix of suffixes) {
      variations.push(`${name}${suffix}`);
    }
    for (const prefix of prefixes) {
      variations.push(`${prefix}${name}`);
    }

    return variations;
  }

  private calculateRelevance(query: string, name: string): number {
    if (query === name) return 100;
    if (name.startsWith(query)) return 90;
    if (name.endsWith(query)) return 80;
    if (name.includes(query)) return 70;
    return 50;
  }

  // ========================================================================
  // 缓存管理
  // ========================================================================

  private setCache(key: string, data: any, ttl: number): void {
    if (this.cache.size >= this.maxCacheSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) this.cache.delete(firstKey);
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  /**
   * 清除缓存
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * 获取缓存大小
   */
  getCacheSize(): number {
    return this.cache.size;
  }

  /**
   * 设置缓存 TTL
   */
  setCacheTTL(ttl: number): void {
    this.cacheTTL = ttl;
  }

  /**
   * 设置默认链
   */
  setDefaultChain(chain: string): void {
    this.defaultChain = chain;
  }

  /**
   * 设置默认注册商
   */
  setDefaultRegistry(registry: DomainRegistry): void {
    this.defaultRegistry = registry;
  }
}

// ============================================================================
// 默认导出
// ============================================================================

export default {
  DomainService,
  DOMAIN_REGISTRIES,
};
