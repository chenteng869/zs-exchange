/**
 * Alchemy NFT API（2026-07-11 新建 · P3-5）
 *
 * 数字藏品模块基础能力：
 *  - getNFTsForOwner(address)        · 用户 NFT 列表
 *  - getNFTMetadata(contract, tokenId) · 单个 NFT 元数据
 *  - getOwnersForNFT(contract, tokenId) · NFT 持有者
 *  - getNFTsForCollection(contract)    · 整个 collection
 *
 * 节省：
 *  - 旧实现：自建 NFT 索引器（4 周）
 *  - 新实现：5 分钟对接
 */

import { NftTokenType } from 'alchemy-sdk';
import { getAlchemySdkForChain } from './client';

// =============================================================================
// 类型
// =============================================================================

export interface NftItem {
  contractAddress: string;
  tokenId: string;
  tokenType: 'ERC721' | 'ERC1155';
  name: string;
  symbol?: string;
  image?: string;
  imageUrl?: string;
  animationUrl?: string;
  description?: string;
  attributes?: Array<{ trait_type: string; value: string | number; display_type?: string }>;
  balance?: string; // ERC-1155 数量
  collection?: {
    name: string;
    slug?: string;
    imageUrl?: string;
  };
}

export interface NftMetadata extends NftItem {
  /** 完整元数据（含所有字段）*/
  raw?: any;
}

export interface NftCollection {
  address: string;
  name: string;
  symbol?: string;
  totalSupply?: string;
  imageUrl?: string;
}

// =============================================================================
// NFT 列表
// =============================================================================

/**
 * 获取用户拥有的所有 NFT
 */
export async function getNFTsForOwner(
  address: string,
  chainKey: string = 'eth',
  options: {
    contractAddresses?: string[];
    withMetadata?: boolean;
    pageKey?: string;
    pageSize?: number;
  } = {},
): Promise<{ nfts: NftItem[]; pageKey?: string; totalCount: number }> {
  try {
    const sdk = getAlchemySdkForChain(chainKey);
    // 2026-07-11 修复：移除不存在的 withMetadata 选项
    // 默认走 GetNftsForOwnerOptions 重载（带 metadata）；如要省 metadata 走 GetBaseNftsForOwnerOptions
    const response = await sdk.nft.getNftsForOwner(address, {
      contractAddresses: options.contractAddresses,
      pageKey: options.pageKey,
      pageSize: Math.min(options.pageSize || 100, 100),
    });

    const nfts = (response.ownedNfts || []).map(mapAlchemyNft);
    return {
      nfts,
      pageKey: response.pageKey,
      totalCount: nfts.length,
    };
  } catch (err) {
    throw new Error(`getNFTsForOwner failed: ${(err as Error).message}`);
  }
}

/**
 * 获取整个 collection 的所有 NFT
 */
export async function getNFTsForCollection(
  contractAddress: string,
  chainKey: string = 'eth',
  options: { withMetadata?: boolean; pageKey?: string; pageSize?: number } = {},
): Promise<{ nfts: NftItem[]; pageKey?: string; totalCount: number }> {
  try {
    const sdk = getAlchemySdkForChain(chainKey);
    // 2026-07-11: Alchemy v3.6 SDK 中方法名是 getNftsForContract（不是 getNftsForCollection）
    const response = await sdk.nft.getNftsForContract(contractAddress, {
      omitMetadata: options.withMetadata === false,  // 默认 withMetadata=true，等价 omitMetadata=false
      pageKey: options.pageKey,
      pageSize: Math.min(options.pageSize || 100, 100),
    });

    const nfts = (response.nfts || []).map(mapAlchemyNft);
    return {
      nfts,
      pageKey: response.pageKey,
      totalCount: nfts.length,
    };
  } catch (err) {
    throw new Error(`getNFTsForCollection failed: ${(err as Error).message}`);
  }
}

// =============================================================================
// NFT 元数据
// =============================================================================

/**
 * 获取单个 NFT 的完整元数据
 */
export async function getNFTMetadata(
  contractAddress: string,
  tokenId: string,
  chainKey: string = 'eth',
  options: { tokenType?: 'ERC721' | 'ERC1155'; refreshCache?: boolean } = {},
): Promise<NftMetadata> {
  try {
    const sdk = getAlchemySdkForChain(chainKey);
    // 2026-07-11 修复：tokenType 必须是 NftTokenType 枚举，不能是字符串字面量
    const tokenTypeEnum: NftTokenType | undefined = options.tokenType === 'ERC721' ? NftTokenType.ERC721
      : options.tokenType === 'ERC1155' ? NftTokenType.ERC1155
      : undefined;
    const meta = await sdk.nft.getNftMetadata(
      contractAddress,
      tokenId,
      {
        tokenType: tokenTypeEnum,
        refreshCache: options.refreshCache || false,
      },
    );
    return {
      ...mapAlchemyNft(meta),
      raw: meta.raw,
    };
  } catch (err) {
    throw new Error(`getNFTMetadata failed: ${(err as Error).message}`);
  }
}

// =============================================================================
// NFT 持有者
// =============================================================================

/**
 * 获取 NFT 的所有持有者（ERC-1155 支持数量）
 */
export async function getOwnersForNFT(
  contractAddress: string,
  tokenId: string,
  chainKey: string = 'eth',
): Promise<{ owners: Array<{ ownerAddress: string; tokenBalances?: Array<{ tokenId: string; balance: string }> }>; totalCount: number }> {
  try {
    const sdk = getAlchemySdkForChain(chainKey);
    const response = await sdk.nft.getOwnersForNft(contractAddress, tokenId);
    return {
      owners: (response.owners || []).map((o: any) => ({
        ownerAddress: typeof o === 'string' ? o : o.ownerAddress,
        tokenBalances: o.tokenBalances,
      })),
      totalCount: (response.owners || []).length,
    };
  } catch (err) {
    throw new Error(`getOwnersForNFT failed: ${(err as Error).message}`);
  }
}

// =============================================================================
// Collection 信息
// =============================================================================

/**
 * 获取 Collection 概览
 */
export async function getCollectionMetadata(
  contractAddress: string,
  chainKey: string = 'eth',
): Promise<NftCollection> {
  try {
    const sdk = getAlchemySdkForChain(chainKey);
    const meta = await sdk.nft.getContractMetadata(contractAddress);
    // 2026-07-11: Alchemy v3.6 SDK 中 NftContract 没有 openSea 字段
    // 用 imageUrl/openSea 替代逻辑：从 getContractMetadataBatch 或 fallback
    return {
      address: contractAddress,
      name: meta.name || 'Unknown Collection',
      symbol: meta.symbol,
      totalSupply: meta.totalSupply,
      imageUrl: (meta as any).imageUrl || (meta as any).openSea?.imageUrl || undefined,
    };
  } catch (err) {
    throw new Error(`getCollectionMetadata failed: ${(err as Error).message}`);
  }
}

// =============================================================================
// 工具
// =============================================================================

function mapAlchemyNft(n: any): NftItem {
  return {
    contractAddress: n.contract?.address || n.contract?.contractAddress || '',
    tokenId: n.tokenId,
    tokenType: n.tokenType,
    name: n.name || n.contract?.name || 'Untitled',
    symbol: n.contract?.symbol,
    image: n.image?.cachedUrl || n.image?.originalUrl,
    imageUrl: n.image?.cachedUrl || n.image?.originalUrl,
    animationUrl: n.animation?.cachedUrl || n.animation?.originalUrl,
    description: n.description,
    attributes: n.raw?.metadata?.attributes || n.attributes,
    balance: n.balance,
    collection: n.collection ? {
      name: n.collection.name,
      slug: n.collection.slug,
      imageUrl: n.collection.imageUrl,
    } : undefined,
  };
}
