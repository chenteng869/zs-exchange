/**
 * NFT 资产管理模块
 *
 * 功能：
 *  - NFT 余额查询
 *  - NFT 详情（元数据）
 *  - NFT 转账
 *  - NFT 集合管理
 *  - NFT 展示与筛选
 *  - NFT 市场交互
 *  - ERC721 / ERC1155 / ERC404
 *  - 多链支持
 */

// ============================================================================
// 类型定义
// ============================================================================

export interface NFTToken {
  id: string;
  contractAddress: string;
  tokenId: string;
  tokenType: 'ERC721' | 'ERC1155' | 'ERC404' | 'SPL' | 'CW721';
  name: string;
  description: string;
  image: string;
  imageData?: string;
  externalUrl?: string;
  animationUrl?: string;
  youtubeUrl?: string;
  attributes: NFTAttribute[];
  traits: Record<string, string>;
  collection: NFTCollection;
  owner: string;
  chain: string;
  chainId: number;
  tokenUri?: string;
  metadata?: any;
  rarity?: {
    rank: number;
    totalSupply: number;
    score: number;
    rarityLabel: string;
  };
  floorPrice?: string;
  lastSale?: {
    price: string;
    timestamp: number;
    buyer: string;
    seller: string;
  };
  createdAt?: number;
  updatedAt?: number;
}

export interface NFTCollection {
  address: string;
  name: string;
  symbol: string;
  description: string;
  image: string;
  bannerImage?: string;
  totalSupply: number;
  ownerCount?: number;
  floorPrice?: string;
  totalVolume?: string;
  chain: string;
  chainId: number;
  tokenType: 'ERC721' | 'ERC1155' | 'ERC404' | 'SPL' | 'CW721';
  verified?: boolean;
  explicit?: boolean;
  category?: string;
  creator?: string;
  royalty?: number;
  website?: string;
  twitter?: string;
  discord?: string;
  telegram?: string;
  medium?: string;
  osUrl?: string;
  traits?: {
    trait_type: string;
    values: Array<{ value: string; count: number; rarity: number }>;
  }[];
}

export interface NFTAttribute {
  trait_type: string;
  value: string;
  display_type?: string;
  rarity?: number;
}

export interface NFTOwner {
  owner: string;
  tokenId: string;
  quantity?: number;
  acquiredAt?: number;
  acquiredFrom?: string;
}

export interface NFTTransferParams {
  contractAddress: string;
  tokenId: string;
  to: string;
  from?: string;
  amount?: number;
  tokenType: 'ERC721' | 'ERC1155' | 'ERC404' | 'SPL' | 'CW721';
  gasPrice?: string;
  gasLimit?: string;
  nonce?: number;
}

export interface NFTTransferResult {
  hash: string;
  from: string;
  to: string;
  contractAddress: string;
  tokenId: string;
  amount: number;
  status: 'pending' | 'confirmed' | 'failed';
  timestamp: number;
  fee?: string;
}

export interface NftListOptions {
  chain?: string;
  owner?: string;
  collection?: string;
  tokenType?: string;
  page?: number;
  pageSize?: number;
  sortBy?: 'recent' | 'rarity' | 'price_low' | 'price_high' | 'name';
  sortOrder?: 'asc' | 'desc';
  filters?: {
    traits?: Record<string, string[]>;
    priceMin?: string;
    priceMax?: string;
    hasRarity?: boolean;
    hasVideo?: boolean;
    hasAudio?: boolean;
  };
}

export interface NftMarketplaceListing {
  id: string;
  nft: NFTToken;
  seller: string;
  price: string;
  currency: string;
  marketplace: string;
  startTime?: number;
  endTime?: number;
  type: 'fixed' | 'auction';
  bids?: NftBid[];
  highestBid?: NftBid;
  status: 'active' | 'cancelled' | 'sold' | 'expired';
}

export interface NftBid {
  id: string;
  bidder: string;
  amount: string;
  currency: string;
  timestamp: number;
  status: 'active' | 'cancelled' | 'accepted' | 'outbid';
}

export interface NftActivity {
  id: string;
  type: 'mint' | 'transfer' | 'sale' | 'list' | 'bid' | 'cancel_list' | 'cancel_bid' | 'burn';
  nftId?: string;
  collectionAddress: string;
  tokenId: string;
  from?: string;
  to?: string;
  price?: string;
  currency?: string;
  timestamp: number;
  txHash?: string;
}

// ============================================================================
// 热门 NFT 集合（示例数据）
// ============================================================================

export const POPULAR_COLLECTIONS: Record<string, NFTCollection[]> = {
  ethereum: [
    {
      address: '0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D',
      name: 'Bored Ape YC',
      symbol: 'BAYC',
      description: 'The Bored Ape Yacht Club is a collection of 10,000 unique Bored Ape NFTs.',
      image: 'https://i.seadn.io/gcs/files/ff069bd5b9e4e0a9e0d0a5a9e4e4e4e4.png',
      bannerImage: 'https://i.seadn.io/gcs/files/banner.png',
      totalSupply: 10000,
      ownerCount: 6000,
      floorPrice: '35000000000000000000',
      totalVolume: '2500000000000000000000',
      chain: 'ethereum',
      chainId: 1,
      tokenType: 'ERC721',
      verified: true,
      category: 'PFP',
      creator: '0x0000000000000000000000000000000000000000',
      royalty: 2.5,
      website: 'https://boredapeyachtclub.com',
      twitter: 'https://twitter.com/BoredApeYC',
      discord: 'https://discord.gg/boredapeyachtclub',
      osUrl: 'https://opensea.io/collection/boredapeyachtclub',
    },
    {
      address: '0x49cF6f5d44E70224e2E23fDcdd2C053F30aDA28B',
      name: 'CryptoPunks',
      symbol: 'PUNK',
      description: '10,000 unique collectible characters with proof of ownership on the Ethereum blockchain.',
      image: 'https://i.seadn.io/gcs/files/punks.png',
      totalSupply: 10000,
      ownerCount: 3000,
      floorPrice: '85000000000000000000',
      totalVolume: '5000000000000000000000',
      chain: 'ethereum',
      chainId: 1,
      tokenType: 'ERC721',
      verified: true,
      category: 'PFP',
      royalty: 0,
      website: 'https://www.larvalabs.com/cryptopunks',
      osUrl: 'https://opensea.io/collection/cryptopunks',
    },
    {
      address: '0xED5AF388653567Af2F388E6224dC7C4b3241C544',
      name: 'Azuki',
      symbol: 'AZUKI',
      description: 'The Garden is a new digital city in the metaverse.',
      image: 'https://i.seadn.io/gcs/files/azuki.png',
      totalSupply: 20000,
      ownerCount: 12000,
      floorPrice: '12000000000000000000',
      totalVolume: '800000000000000000000',
      chain: 'ethereum',
      chainId: 1,
      tokenType: 'ERC721',
      verified: true,
      category: 'PFP',
      royalty: 5,
      website: 'https://azuki.com',
      twitter: 'https://twitter.com/azukiofficial',
      osUrl: 'https://opensea.io/collection/azuki',
    },
    {
      address: '0x34d85c9CDeB23FA97cb08333b511ac86E1C4E258',
      name: 'Otherdeed',
      symbol: 'OTHR',
      description: 'Land deeds for the Otherside metaverse.',
      image: 'https://i.seadn.io/gcs/files/otherdeed.png',
      totalSupply: 100000,
      ownerCount: 25000,
      floorPrice: '1000000000000000000',
      totalVolume: '600000000000000000000',
      chain: 'ethereum',
      chainId: 1,
      tokenType: 'ERC721',
      verified: true,
      category: 'Virtual Land',
      royalty: 5,
      website: 'https://otherside.xyz',
      osUrl: 'https://opensea.io/collection/otherdeed',
    },
    {
      address: '0xBD4455dA5929D5639EEc2d57b1A0A04F91bF7B78',
      name: 'CloneX',
      symbol: 'CLONEX',
      description: '20,000 next-gen Avatars, by RTFKT and Takashi Murakami.',
      image: 'https://i.seadn.io/gcs/files/clonex.png',
      totalSupply: 20000,
      ownerCount: 9000,
      floorPrice: '1500000000000000000',
      totalVolume: '400000000000000000000',
      chain: 'ethereum',
      chainId: 1,
      tokenType: 'ERC721',
      verified: true,
      category: 'PFP',
      royalty: 5,
      website: 'https://rtfkt.com',
      osUrl: 'https://opensea.io/collection/clonex',
    },
    {
      address: '0xa7d8d9ef8D8Ce8992Df33D8b8CF4Aebabd5bD270',
      name: 'Art Gobblers',
      symbol: 'GOBBLER',
      description: 'Art Gobblers are the first of their kind: mythical creatures that devour art.',
      image: 'https://i.seadn.io/gcs/files/gobblers.png',
      totalSupply: 2000,
      ownerCount: 1500,
      floorPrice: '2500000000000000000',
      totalVolume: '200000000000000000000',
      chain: 'ethereum',
      chainId: 1,
      tokenType: 'ERC721',
      verified: true,
      category: 'Art',
      royalty: 10,
      website: 'https://artgobblers.com',
      osUrl: 'https://opensea.io/collection/art-gobblers',
    },
    {
      address: '0x7Bd29408f11D2bFC23c34f18275bBf23bB716Bc7',
      name: 'Lil Pudgys',
      symbol: 'LILPUDGY',
      description: '22,000 adorable, round penguin companions.',
      image: 'https://i.seadn.io/gcs/files/lilpudgys.png',
      totalSupply: 22000,
      ownerCount: 13000,
      floorPrice: '500000000000000000',
      totalVolume: '150000000000000000000',
      chain: 'ethereum',
      chainId: 1,
      tokenType: 'ERC721',
      verified: true,
      category: 'PFP',
      royalty: 5,
      website: 'https://pudgypenguins.com',
      osUrl: 'https://opensea.io/collection/lil-pudgys',
    },
    {
      address: '0xBd3531dA5CF5857e7CfAA92426877b022e612cf8',
      name: 'Pudgy Penguins',
      symbol: 'PUDGY',
      description: 'The Pudgy Penguins are a collection of 8,888 unique NFTs.',
      image: 'https://i.seadn.io/gcs/files/pudgy.png',
      totalSupply: 8888,
      ownerCount: 5000,
      floorPrice: '8000000000000000000',
      totalVolume: '300000000000000000000',
      chain: 'ethereum',
      chainId: 1,
      tokenType: 'ERC721',
      verified: true,
      category: 'PFP',
      royalty: 5,
      website: 'https://pudgypenguins.com',
      osUrl: 'https://opensea.io/collection/pudgypenguins',
    },
    {
      address: '0xc3f733ca98E0daD0386979Eb96fb1722A1A05E69',
      name: 'Moonbirds',
      symbol: 'MOONBIRDS',
      description: '10,000 utility-enabled PFPs.',
      image: 'https://i.seadn.io/gcs/files/moonbirds.png',
      totalSupply: 10000,
      ownerCount: 7000,
      floorPrice: '6000000000000000000',
      totalVolume: '450000000000000000000',
      chain: 'ethereum',
      chainId: 1,
      tokenType: 'ERC721',
      verified: true,
      category: 'PFP',
      royalty: 5,
      website: 'https://moonbirds.xyz',
      osUrl: 'https://opensea.io/collection/moonbirds',
    },
    {
      address: '0x394e3c7E0c0f767fA5e800a3b7F6dD43B2E774A7',
      name: 'PROOF Collective',
      symbol: 'PROOF',
      description: 'PROOF Collective is a private community of 1,000 dedicated NFT collectors and artists.',
      image: 'https://i.seadn.io/gcs/files/proof.png',
      totalSupply: 1000,
      ownerCount: 800,
      floorPrice: '12000000000000000000',
      totalVolume: '180000000000000000000',
      chain: 'ethereum',
      chainId: 1,
      tokenType: 'ERC721',
      verified: true,
      category: 'Membership',
      royalty: 5,
      website: 'https://proof.xyz',
      osUrl: 'https://opensea.io/collection/proof-collective',
    },
  ],
  solana: [
    {
      address: 'SMBtHCCC6RYRutFEPb4gZVQLME8sGmK5M3Xn6QjP1B7',
      name: 'DeGods',
      symbol: 'DEGODS',
      description: 'DeGods is a digital art collection and global community.',
      image: 'https://i.seadn.io/gcs/files/degods.png',
      totalSupply: 10000,
      ownerCount: 5000,
      floorPrice: '2500000000',
      totalVolume: '500000000000',
      chain: 'solana',
      chainId: 0,
      tokenType: 'SPL',
      verified: true,
      category: 'PFP',
      royalty: 333,
      website: 'https://degods.com',
      twitter: 'https://twitter.com/DeGodsNFT',
    },
    {
      address: '8vuHCD85Fn8mTjCvDq3cZk7q9E4WwYrTtVvBbNnMmKk',
      name: 'y00ts',
      symbol: 'Y00TS',
      description: 'y00ts is a generative art project.',
      image: 'https://i.seadn.io/gcs/files/y00ts.png',
      totalSupply: 15000,
      ownerCount: 8000,
      floorPrice: '1500000000',
      totalVolume: '300000000000',
      chain: 'solana',
      chainId: 0,
      tokenType: 'SPL',
      verified: true,
      category: 'PFP',
      royalty: 333,
      website: 'https://y00ts.com',
    },
  ],
};

// ============================================================================
// NFT 管理器
// ============================================================================

export class NFTManager {
  private collections: Map<string, NFTCollection> = new Map();
  private nfts: Map<string, NFTToken> = new Map();
  private ownerNFTs: Map<string, string[]> = new Map();
  private listings: Map<string, NftMarketplaceListing> = new Map();
  private activities: NftActivity[] = [];
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private cacheTTL: number = 5 * 60 * 1000;

  constructor() {
    this.initializeCollections();
  }

  private initializeCollections(): void {
    for (const chain of Object.keys(POPULAR_COLLECTIONS)) {
      const collections = POPULAR_COLLECTIONS[chain];
      for (const collection of collections) {
        const key = this.getCollectionKey(collection.chain, collection.address);
        this.collections.set(key, collection);
      }
    }
  }

  private getCollectionKey(chain: string, address: string): string {
    return `${chain}:${address.toLowerCase()}`;
  }

  private getNFTKey(chain: string, contractAddress: string, tokenId: string): string {
    return `${chain}:${contractAddress.toLowerCase()}:${tokenId}`;
  }

  // ========================================================================
  // 集合管理
  // ========================================================================

  /**
   * 获取集合信息
   */
  getCollection(chain: string, address: string): NFTCollection | undefined {
    return this.collections.get(this.getCollectionKey(chain, address));
  }

  /**
   * 获取指定链的热门集合
   */
  getPopularCollections(chain?: string, limit: number = 20): NFTCollection[] {
    const result: NFTCollection[] = [];
    for (const collection of this.collections.values()) {
      if (chain && collection.chain !== chain) continue;
      result.push(collection);
    }
    return result.sort((a, b) => {
      const aVol = parseFloat(a.totalVolume || '0');
      const bVol = parseFloat(b.totalVolume || '0');
      return bVol - aVol;
    }).slice(0, limit);
  }

  /**
   * 添加集合
   */
  addCollection(collection: NFTCollection): boolean {
    const key = this.getCollectionKey(collection.chain, collection.address);
    if (this.collections.has(key)) return false;
    this.collections.set(key, collection);
    return true;
  }

  /**
   * 搜索集合
   */
  searchCollections(query: string, chain?: string): NFTCollection[] {
    const queryLower = query.toLowerCase();
    const results: Array<{ collection: NFTCollection; score: number }> = [];

    for (const collection of this.collections.values()) {
      if (chain && collection.chain !== chain) continue;

      let score = 0;
      if (collection.name.toLowerCase() === queryLower) score += 100;
      else if (collection.name.toLowerCase().includes(queryLower)) score += 50;
      if (collection.symbol.toLowerCase() === queryLower) score += 80;
      else if (collection.symbol.toLowerCase().includes(queryLower)) score += 40;
      if (collection.address.toLowerCase() === queryLower) score += 90;
      if (collection.category?.toLowerCase().includes(queryLower)) score += 20;

      if (score > 0) {
        results.push({ collection, score });
      }
    }

    return results.sort((a, b) => b.score - a.score).map((r) => r.collection);
  }

  // ========================================================================
  // NFT 管理
  // ========================================================================

  /**
   * 添加 NFT
   */
  addNFT(nft: NFTToken): void {
    const key = this.getNFTKey(nft.chain, nft.contractAddress, nft.tokenId);
    this.nfts.set(key, nft);

    const ownerKey = `${nft.chain}:${nft.owner}`;
    if (!this.ownerNFTs.has(ownerKey)) {
      this.ownerNFTs.set(ownerKey, []);
    }
    const list = this.ownerNFTs.get(ownerKey)!;
    if (!list.includes(key)) {
      list.push(key);
    }
  }

  /**
   * 批量添加 NFT
   */
  addNFTs(nfts: NFTToken[]): void {
    for (const nft of nfts) {
      this.addNFT(nft);
    }
  }

  /**
   * 获取 NFT
   */
  getNFT(chain: string, contractAddress: string, tokenId: string): NFTToken | undefined {
    return this.nfts.get(this.getNFTKey(chain, contractAddress, tokenId));
  }

  /**
   * 获取用户的 NFT
   */
  getOwnerNFTs(
    chain: string,
    owner: string,
    options: {
      collection?: string;
      page?: number;
      pageSize?: number;
      sortBy?: string;
    } = {}
  ): { nfts: NFTToken[]; total: number } {
    const ownerKey = `${chain}:${owner}`;
    const nftKeys = this.ownerNFTs.get(ownerKey) || [];
    let nfts: NFTToken[] = [];

    for (const key of nftKeys) {
      const nft = this.nfts.get(key);
      if (!nft) continue;
      if (options.collection && nft.contractAddress.toLowerCase() !== options.collection.toLowerCase()) continue;
      nfts.push(nft);
    }

    const total = nfts.length;

    const page = options.page || 1;
    const pageSize = options.pageSize || 20;
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    nfts = nfts.slice(start, end);

    return { nfts, total };
  }

  /**
   * 获取集合的 NFT 列表
   */
  getCollectionNFTs(
    chain: string,
    collectionAddress: string,
    options: NftListOptions = {}
  ): { nfts: NFTToken[]; total: number } {
    const collectionKey = this.getCollectionKey(chain, collectionAddress);
    let nfts: NFTToken[] = [];

    for (const nft of this.nfts.values()) {
      if (nft.chain !== chain) continue;
      if (nft.contractAddress.toLowerCase() !== collectionAddress.toLowerCase()) continue;
      nfts.push(nft);
    }

    const total = nfts.length;

    switch (options.sortBy) {
      case 'rarity':
        nfts.sort((a, b) => (a.rarity?.rank || 999999) - (b.rarity?.rank || 999999));
        break;
      case 'name':
        nfts.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'recent':
      default:
        nfts.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    }

    if (options.sortOrder === 'desc' && options.sortBy !== 'rarity') {
      nfts.reverse();
    }

    const page = options.page || 1;
    const pageSize = options.pageSize || 20;
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    nfts = nfts.slice(start, end);

    return { nfts, total };
  }

  // ========================================================================
  // 市场挂单
  // ========================================================================

  /**
   * 获取挂单
   */
  getListing(listingId: string): NftMarketplaceListing | undefined {
    return this.listings.get(listingId);
  }

  /**
   * 获取集合的挂单
   */
  getCollectionListings(chain: string, collectionAddress: string): NftMarketplaceListing[] {
    const result: NftMarketplaceListing[] = [];
    for (const listing of this.listings.values()) {
      if (listing.nft.chain !== chain) continue;
      if (listing.nft.contractAddress.toLowerCase() !== collectionAddress.toLowerCase()) continue;
      if (listing.status !== 'active') continue;
      result.push(listing);
    }
    return result.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
  }

  /**
   * 添加挂单
   */
  addListing(listing: NftMarketplaceListing): void {
    this.listings.set(listing.id, listing);
    this.addActivity({
      id: 'act_' + Date.now(),
      type: 'list',
      collectionAddress: listing.nft.contractAddress,
      tokenId: listing.nft.tokenId,
      from: listing.seller,
      price: listing.price,
      currency: listing.currency,
      timestamp: Date.now(),
    });
  }

  // ========================================================================
  // 活动记录
  // ========================================================================

  /**
   * 添加活动记录
   */
  addActivity(activity: NftActivity): void {
    this.activities.unshift(activity);
    if (this.activities.length > 10000) {
      this.activities = this.activities.slice(0, 10000);
    }
  }

  /**
   * 获取 NFT 活动历史
   */
  getNFTActivity(
    chain: string,
    contractAddress: string,
    tokenId: string,
    types?: string[],
    limit: number = 50
  ): NftActivity[] {
    const result: NftActivity[] = [];
    for (const activity of this.activities) {
      if (activity.collectionAddress.toLowerCase() !== contractAddress.toLowerCase()) continue;
      if (activity.tokenId !== tokenId) continue;
      if (types && !types.includes(activity.type)) continue;
      result.push(activity);
      if (result.length >= limit) break;
    }
    return result;
  }

  /**
   * 获取集合活动历史
   */
  getCollectionActivity(
    chain: string,
    collectionAddress: string,
    types?: string[],
    limit: number = 100
  ): NftActivity[] {
    const result: NftActivity[] = [];
    for (const activity of this.activities) {
      if (activity.collectionAddress.toLowerCase() !== collectionAddress.toLowerCase()) continue;
      if (types && !types.includes(activity.type)) continue;
      result.push(activity);
      if (result.length >= limit) break;
    }
    return result;
  }

  // ========================================================================
  // 工具函数
  // ========================================================================

  /**
   * 计算 NFT 稀有度（简化版）
   */
  calculateRarity(
    nftAttributes: NFTAttribute[],
    collectionTraits: NFTCollection['traits']
  ): { rank: number; score: number; rarityLabel: string } {
    let score = 0;

    for (const attr of nftAttributes) {
      const trait = collectionTraits?.find((t) => t.trait_type === attr.trait_type);
      if (trait) {
        const value = trait.values.find((v) => v.value === attr.value);
        if (value && value.count > 0) {
          score += 1 / (value.count / (trait.values.reduce((sum, v) => sum + v.count, 0) || 1));
        }
      }
    }

    const rarityLabel = score > 100 ? 'Legendary' : score > 50 ? 'Epic' : score > 20 ? 'Rare' : score > 10 ? 'Uncommon' : 'Common';

    return {
      rank: Math.max(1, Math.floor(10000 / score)),
      score,
      rarityLabel,
    };
  }

  /**
   * 格式化 NFT 属性
   */
  formatAttributes(attributes: any[]): NFTAttribute[] {
    return attributes.map((attr) => ({
      trait_type: attr.trait_type || attr.traitType || '',
      value: String(attr.value),
      display_type: attr.display_type || attr.displayType,
    }));
  }

  /**
   * 解析 IPFS URL
   */
  resolveIPFSUrl(ipfsUrl: string): string {
    if (!ipfsUrl) return '';
    if (ipfsUrl.startsWith('ipfs://')) {
      return ipfsUrl.replace('ipfs://', 'https://ipfs.io/ipfs/');
    }
    if (ipfsUrl.startsWith('Qm')) {
      return `https://ipfs.io/ipfs/${ipfsUrl}`;
    }
    return ipfsUrl;
  }

  /**
   * 获取 NFT 统计
   */
  getNFTStats(chain: string, owner: string): {
    totalCount: number;
    collectionCount: number;
    estimatedValue: string;
    floorValue: string;
  } {
    const ownerKey = `${chain}:${owner}`;
    const nftKeys = this.ownerNFTs.get(ownerKey) || [];
    const collections = new Set<string>();
    let floorValue = 0;

    for (const key of nftKeys) {
      const nft = this.nfts.get(key);
      if (!nft) continue;
      collections.add(nft.contractAddress);
      if (nft.floorPrice) {
        floorValue += parseFloat(nft.floorPrice);
      }
    }

    return {
      totalCount: nftKeys.length,
      collectionCount: collections.size,
      estimatedValue: floorValue.toString(),
      floorValue: floorValue.toString(),
    };
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
}

// ============================================================================
// 默认导出
// ============================================================================

export default {
  NFTManager,
  POPULAR_COLLECTIONS,
};
