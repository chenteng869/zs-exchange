# H09\-《DApp 浏览器 Part 9：DApp 列表 / 搜索 / 收藏 / 最近访问 / 首页生态》

# 《DApp 浏览器 Part 9：DApp 列表 / 搜索 / 收藏 / 最近访问 / 首页生态》



本章实现 DApp 浏览器生态入口，覆盖：



- DApp Registry

- DApp 分类

- DApp 搜索

- Featured 推荐

- Favorites 收藏

- Recent Visits 最近访问

- DApp 首页 UI

- DApp Card

- Search Screen

- Category Tabs

- 打开 DApp

- DApp 风险等级展示

- 后台可管理数据结构

- 缓存与刷新

    

核心目标：



```Plain Text
用户打开 DApp 浏览器后，不只是输入 URL。
而是看到一个可运营、可搜索、可风控、可推荐、可收藏的 DApp 生态首页。
```



---



## 1\. 本章目录结构



```Bash
src/modules/dapp-browser/
  core/
    registry/
      dapp-registry.types.ts
      dapp-registry-storage.service.ts
      dapp-registry.repository.ts
      dapp-registry.service.ts
      dapp-search.service.ts
      dapp-category.service.ts
      dapp-favorite.service.ts
      dapp-recent.service.ts
      dapp-home.service.ts

  ui/
    screens/
      DappHomeScreen.tsx
      DappSearchScreen.tsx
      DappCategoryScreen.tsx
      DappFavoritesScreen.tsx
      DappRecentScreen.tsx

    components/
      DappCard.tsx
      DappGrid.tsx
      DappSearchBar.tsx
      DappCategoryTabs.tsx
      DappRiskBadge.tsx
      DappSectionHeader.tsx
      DappFeaturedBanner.tsx
```



---



## 2\. Registry 类型



### `core/registry/dapp-registry.types.ts`



```TypeScript
export type DappCategoryKey =
  | 'featured'
  | 'dex'
  | 'lending'
  | 'nft'
  | 'gamefi'
  | 'bridge'
  | 'staking'
  | 'tools'
  | 'social'
  | 'wallet'
  | 'infra'
  | 'other';

export type DappRegistryStatus =
  | 'active'
  | 'hidden'
  | 'blocked'
  | 'pending_review';

export type DappRegistryRiskLevel =
  | 'low'
  | 'medium'
  | 'high'
  | 'critical'
  | 'blocked';

export interface DappRegistryItem {
  dappId: string;

  name: string;
  description?: string;
  iconUrl?: string;
  url: string;
  origin: string;
  hostname: string;

  category: DappCategoryKey;
  tags: string[];
  chains: string[];

  status: DappRegistryStatus;
  riskLevel: DappRegistryRiskLevel;

  featured: boolean;
  verified: boolean;
  sortOrder: number;

  metrics?: {
    visits?: number;
    users?: number;
    score?: number;
  };

  createdAt: number;
  updatedAt: number;
}

export interface DappCategory {
  key: DappCategoryKey;
  label: string;
  description?: string;
  icon?: string;
  sortOrder: number;
  enabled: boolean;
}

export interface DappFavoriteRecord {
  favoriteId: string;
  userId: string;
  dappId: string;
  origin: string;
  createdAt: number;
}

export interface DappRecentVisitRecord {
  visitId: string;
  userId: string;
  dappId?: string;
  url: string;
  origin: string;
  hostname: string;
  title?: string;
  iconUrl?: string;
  visitedAt: number;
}

export interface DappSearchQuery {
  keyword?: string;
  category?: DappCategoryKey;
  chainId?: string;
  riskLevel?: DappRegistryRiskLevel;
  includeHidden?: boolean;
  includeBlocked?: boolean;
  limit?: number;
}

export interface DappHomeData {
  featured: DappRegistryItem[];
  categories: DappCategory[];
  popular: DappRegistryItem[];
  favorites: DappRegistryItem[];
  recent: DappRecentVisitRecord[];
}
```



---



## 3\. Registry Storage



生产可替换为：



```Plain Text
后端 API
SQLite
IndexedDB
MMKV Cache
远端配置中心
```



本章先提供内存实现。



### `core/registry/dapp-registry-storage.service.ts`



```TypeScript
import {
  DappFavoriteRecord,
  DappRecentVisitRecord,
  DappRegistryItem,
  DappSearchQuery,
} from './dapp-registry.types';

export interface DappRegistryStorageService {
  listDapps(query?: DappSearchQuery): Promise;
  getDapp(dappId: string): Promise;
  getDappByOrigin(origin: string): Promise;
  upsertDapp(item: DappRegistryItem): Promise;

  listFavorites(userId: string): Promise;
  addFavorite(record: DappFavoriteRecord): Promise;
  removeFavorite(userId: string, dappId: string): Promise;

  listRecent(userId: string, limit?: number): Promise;
  addRecent(record: DappRecentVisitRecord): Promise;
  clearRecent(userId: string): Promise;
}

export class InMemoryDappRegistryStorageService
  implements DappRegistryStorageService {
  private readonly dapps = new Map();
  private readonly favorites = new Map();
  private readonly recent = new Map();

  constructor(initialDapps: DappRegistryItem[] = []) {
    for (const dapp of initialDapps) {
      this.dapps.set(dapp.dappId, dapp);
    }
  }

  async listDapps(query: DappSearchQuery = {}): Promise {
    const keyword = query.keyword?.trim().toLowerCase();

    return Array.from(this.dapps.values())
      .filter((item) => {
        if (!query.includeHidden && item.status === 'hidden') return false;
        if (!query.includeBlocked && item.status === 'blocked') return false;
        if (item.status === 'pending_review') return false;

        if (query.category && item.category !== query.category) return false;
        if (query.chainId && !item.chains.includes(query.chainId)) return false;
        if (query.riskLevel && item.riskLevel !== query.riskLevel) return false;

        if (keyword) {
          const haystack = [
            item.name,
            item.description,
            item.hostname,
            item.category,
            ...item.tags,
          ]
            .filter(Boolean)
            .join(' ')
            .toLowerCase();

          if (!haystack.includes(keyword)) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (a.featured !== b.featured) return a.featured ? -1 : 1;
        if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
        return a.name.localeCompare(b.name);
      })
      .slice(0, query.limit ?? 100);
  }

  async getDapp(dappId: string): Promise {
    return this.dapps.get(dappId) ?? null;
  }

  async getDappByOrigin(origin: string): Promise {
    return (
      Array.from(this.dapps.values()).find((item) => item.origin === origin) ??
      null
    );
  }

  async upsertDapp(item: DappRegistryItem): Promise {
    this.dapps.set(item.dappId, item);
  }

  async listFavorites(userId: string): Promise {
    return Array.from(this.favorites.values())
      .filter((item) => item.userId === userId)
      .sort((a, b) => b.createdAt - a.createdAt);
  }

  async addFavorite(record: DappFavoriteRecord): Promise {
    this.favorites.set(`${record.userId}:${record.dappId}`, record);
  }

  async removeFavorite(userId: string, dappId: string): Promise {
    this.favorites.delete(`${userId}:${dappId}`);
  }

  async listRecent(userId: string, limit = 20): Promise {
    return Array.from(this.recent.values())
      .filter((item) => item.userId === userId)
      .sort((a, b) => b.visitedAt - a.visitedAt)
      .slice(0, limit);
  }

  async addRecent(record: DappRecentVisitRecord): Promise {
    const key = `${record.userId}:${record.origin}`;

    this.recent.set(key, record);
  }

  async clearRecent(userId: string): Promise {
    for (const [key, item] of Array.from(this.recent.entries())) {
      if (item.userId === userId) {
        this.recent.delete(key);
      }
    }
  }
}
```



---



## 4\. 默认 DApp 数据



### `core/registry/default-dapps.ts`



```TypeScript
import { DappRegistryItem } from './dapp-registry.types';

const now = Date.now();

export const DEFAULT_DAPPS: DappRegistryItem[] = [
  {
    dappId: 'uniswap',
    name: 'Uniswap',
    description: '去中心化交易协议',
    iconUrl: 'https://app.uniswap.org/favicon.png',
    url: 'https://app.uniswap.org',
    origin: 'https://app.uniswap.org',
    hostname: 'app.uniswap.org',
    category: 'dex',
    tags: ['swap', 'dex', 'ethereum'],
    chains: ['0x1', '0xa', '0xa4b1', '0x89', '0x2105'],
    status: 'active',
    riskLevel: 'low',
    featured: true,
    verified: true,
    sortOrder: 10,
    createdAt: now,
    updatedAt: now,
  },
  {
    dappId: 'aave',
    name: 'Aave',
    description: '去中心化借贷协议',
    iconUrl: 'https://app.aave.com/favicon.ico',
    url: 'https://app.aave.com',
    origin: 'https://app.aave.com',
    hostname: 'app.aave.com',
    category: 'lending',
    tags: ['lending', 'borrow', 'earn'],
    chains: ['0x1', '0xa', '0xa4b1', '0x89'],
    status: 'active',
    riskLevel: 'low',
    featured: true,
    verified: true,
    sortOrder: 20,
    createdAt: now,
    updatedAt: now,
  },
  {
    dappId: 'opensea',
    name: 'OpenSea',
    description: 'NFT 市场',
    iconUrl: 'https://opensea.io/static/images/logos/opensea.svg',
    url: 'https://opensea.io',
    origin: 'https://opensea.io',
    hostname: 'opensea.io',
    category: 'nft',
    tags: ['nft', 'marketplace'],
    chains: ['0x1', '0x89', '0xa4b1', '0x2105'],
    status: 'active',
    riskLevel: 'low',
    featured: true,
    verified: true,
    sortOrder: 30,
    createdAt: now,
    updatedAt: now,
  },
  {
    dappId: 'pancakeswap',
    name: 'PancakeSwap',
    description: 'BNB Chain 上的 DEX',
    iconUrl: 'https://pancakeswap.finance/favicon.ico',
    url: 'https://pancakeswap.finance',
    origin: 'https://pancakeswap.finance',
    hostname: 'pancakeswap.finance',
    category: 'dex',
    tags: ['swap', 'dex', 'bsc'],
    chains: ['0x38'],
    status: 'active',
    riskLevel: 'low',
    featured: true,
    verified: true,
    sortOrder: 40,
    createdAt: now,
    updatedAt: now,
  },
  {
    dappId: 'snapshot',
    name: 'Snapshot',
    description: 'DAO 治理投票工具',
    iconUrl: 'https://snapshot.org/favicon.ico',
    url: 'https://snapshot.org',
    origin: 'https://snapshot.org',
    hostname: 'snapshot.org',
    category: 'tools',
    tags: ['dao', 'governance', 'vote'],
    chains: ['0x1'],
    status: 'active',
    riskLevel: 'low',
    featured: false,
    verified: true,
    sortOrder: 50,
    createdAt: now,
    updatedAt: now,
  },
];
```



---



## 5\. Registry Repository



### `core/registry/dapp-registry.repository.ts`



```TypeScript
import {
  DappFavoriteRecord,
  DappRecentVisitRecord,
  DappRegistryItem,
  DappSearchQuery,
} from './dapp-registry.types';
import { DappRegistryStorageService } from './dapp-registry-storage.service';

export class DappRegistryRepository {
  constructor(
    private readonly storage: DappRegistryStorageService,
  ) {}

  list(query?: DappSearchQuery): Promise {
    return this.storage.listDapps(query);
  }

  getById(dappId: string): Promise {
    return this.storage.getDapp(dappId);
  }

  getByOrigin(origin: string): Promise {
    return this.storage.getDappByOrigin(origin);
  }

  upsert(item: DappRegistryItem): Promise {
    return this.storage.upsertDapp(item);
  }

  listFavorites(userId: string): Promise {
    return this.storage.listFavorites(userId);
  }

  addFavorite(record: DappFavoriteRecord): Promise {
    return this.storage.addFavorite(record);
  }

  removeFavorite(userId: string, dappId: string): Promise {
    return this.storage.removeFavorite(userId, dappId);
  }

  listRecent(userId: string, limit?: number): Promise {
    return this.storage.listRecent(userId, limit);
  }

  addRecent(record: DappRecentVisitRecord): Promise {
    return this.storage.addRecent(record);
  }

  clearRecent(userId: string): Promise {
    return this.storage.clearRecent(userId);
  }
}
```



---



## 6\. Registry Service



### `core/registry/dapp-registry.service.ts`



```TypeScript
import { getUrlHostname, getUrlOrigin } from '../../shared/utils/url-safety';
import {
  DappRegistryItem,
  DappSearchQuery,
} from './dapp-registry.types';
import { DappRegistryRepository } from './dapp-registry.repository';

export class DappRegistryService {
  constructor(
    private readonly repo: DappRegistryRepository,
  ) {}

  async listDapps(query?: DappSearchQuery): Promise {
    return this.repo.list(query);
  }

  async getDapp(dappId: string): Promise {
    return this.repo.getById(dappId);
  }

  async getDappByUrl(url: string): Promise {
    const origin = getUrlOrigin(url);
    return this.repo.getByOrigin(origin);
  }

  async upsertDapp(input: Omit & {
    createdAt?: number;
    updatedAt?: number;
  }): Promise {
    const now = Date.now();

    const item: DappRegistryItem = {
      ...input,
      origin: getUrlOrigin(input.url),
      hostname: getUrlHostname(input.url),
      createdAt: input.createdAt ?? now,
      updatedAt: now,
    };

    await this.repo.upsert(item);

    return item;
  }

  async assertDappOpenable(dappId: string): Promise {
    const dapp = await this.repo.getById(dappId);

    if (!dapp) {
      throw new Error('DAPP_NOT_FOUND');
    }

    if (dapp.status === 'blocked') {
      throw new Error('DAPP_BLOCKED');
    }

    if (dapp.status === 'hidden' || dapp.status === 'pending_review') {
      throw new Error('DAPP_NOT_AVAILABLE');
    }

    return dapp;
  }
}
```



---



## 7\. Category Service



### `core/registry/dapp-category.service.ts`



```TypeScript
import { DappCategory } from './dapp-registry.types';

export class DappCategoryService {
  listCategories(): DappCategory[] {
    return [
      {
        key: 'featured',
        label: '推荐',
        icon: '⭐',
        sortOrder: 0,
        enabled: true,
      },
      {
        key: 'dex',
        label: 'DEX',
        icon: '🔁',
        sortOrder: 10,
        enabled: true,
      },
      {
        key: 'lending',
        label: '借贷',
        icon: '🏦',
        sortOrder: 20,
        enabled: true,
      },
      {
        key: 'nft',
        label: 'NFT',
        icon: '🖼️',
        sortOrder: 30,
        enabled: true,
      },
      {
        key: 'bridge',
        label: '跨链',
        icon: '🌉',
        sortOrder: 40,
        enabled: true,
      },
      {
        key: 'gamefi',
        label: 'GameFi',
        icon: '🎮',
        sortOrder: 50,
        enabled: true,
      },
      {
        key: 'staking',
        label: '质押',
        icon: '📈',
        sortOrder: 60,
        enabled: true,
      },
      {
        key: 'tools',
        label: '工具',
        icon: '🛠️',
        sortOrder: 70,
        enabled: true,
      },
    ].sort((a, b) => a.sortOrder - b.sortOrder);
  }
}
```



---



## 8\. Search Service



### `core/registry/dapp-search.service.ts`



```TypeScript
import {
  DappRegistryItem,
  DappSearchQuery,
} from './dapp-registry.types';
import { DappRegistryService } from './dapp-registry.service';

export class DappSearchService {
  constructor(
    private readonly registry: DappRegistryService,
  ) {}

  async search(query: DappSearchQuery): Promise {
    const keyword = query.keyword?.trim();

    if (!keyword && !query.category && !query.chainId) {
      return this.registry.listDapps({
        ...query,
        limit: query.limit ?? 50,
      });
    }

    const results = await this.registry.listDapps({
      ...query,
      keyword,
      limit: query.limit ?? 100,
    });

    return this.rank(results, keyword);
  }

  private rank(items: DappRegistryItem[], keyword?: string): DappRegistryItem[] {
    if (!keyword) return items;

    const lower = keyword.toLowerCase();

    return [...items].sort((a, b) => {
      return score(b, lower) - score(a, lower);
    });
  }
}

function score(item: DappRegistryItem, keyword: string): number {
  let value = 0;

  if (item.name.toLowerCase() === keyword) value += 100;
  if (item.name.toLowerCase().includes(keyword)) value += 60;
  if (item.hostname.toLowerCase().includes(keyword)) value += 40;
  if (item.tags.some((tag) => tag.toLowerCase().includes(keyword))) value += 20;
  if (item.featured) value += 10;
  if (item.verified) value += 10;
  if (item.riskLevel === 'low') value += 5;
  if (item.status === 'blocked') value -= 1000;

  return value;
}
```



---



## 9\. Favorite Service



### `core/registry/dapp-favorite.service.ts`



```TypeScript
import {
  DappFavoriteRecord,
  DappRegistryItem,
} from './dapp-registry.types';
import { DappRegistryRepository } from './dapp-registry.repository';

export class DappFavoriteService {
  constructor(
    private readonly repo: DappRegistryRepository,
  ) {}

  async listFavorites(userId: string): Promise {
    const records = await this.repo.listFavorites(userId);

    const items: DappRegistryItem[] = [];

    for (const record of records) {
      const dapp = await this.repo.getById(record.dappId);
      if (dapp && dapp.status === 'active') {
        items.push(dapp);
      }
    }

    return items;
  }

  async isFavorite(input: {
    userId: string;
    dappId: string;
  }): Promise {
    const records = await this.repo.listFavorites(input.userId);
    return records.some((item) => item.dappId === input.dappId);
  }

  async addFavorite(input: {
    userId: string;
    dapp: DappRegistryItem;
  }): Promise {
    const record: DappFavoriteRecord = {
      favoriteId: this.newFavoriteId(),
      userId: input.userId,
      dappId: input.dapp.dappId,
      origin: input.dapp.origin,
      createdAt: Date.now(),
    };

    await this.repo.addFavorite(record);

    return record;
  }

  async removeFavorite(input: {
    userId: string;
    dappId: string;
  }): Promise {
    await this.repo.removeFavorite(input.userId, input.dappId);
  }

  async toggleFavorite(input: {
    userId: string;
    dapp: DappRegistryItem;
  }): Promise {
    const exists = await this.isFavorite({
      userId: input.userId,
      dappId: input.dapp.dappId,
    });

    if (exists) {
      await this.removeFavorite({
        userId: input.userId,
        dappId: input.dapp.dappId,
      });

      return {
        favorite: false,
      };
    }

    await this.addFavorite(input);

    return {
      favorite: true,
    };
  }

  private newFavoriteId(): string {
    return `DFAV-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  }
}
```



---



## 10\. Recent Service



### `core/registry/dapp-recent.service.ts`



```TypeScript
import {
  DappRecentVisitRecord,
  DappRegistryItem,
} from './dapp-registry.types';
import { DappRegistryRepository } from './dapp-registry.repository';
import {
  getUrlHostname,
  getUrlOrigin,
} from '../../shared/utils/url-safety';

export class DappRecentService {
  constructor(
    private readonly repo: DappRegistryRepository,
  ) {}

  async recordVisit(input: {
    userId: string;
    url: string;
    dapp?: DappRegistryItem | null;
    title?: string;
    iconUrl?: string;
  }): Promise {
    const origin = getUrlOrigin(input.url);
    const hostname = getUrlHostname(input.url);

    const record: DappRecentVisitRecord = {
      visitId: this.newVisitId(),
      userId: input.userId,
      dappId: input.dapp?.dappId,
      url: input.url,
      origin,
      hostname,
      title: input.title ?? input.dapp?.name,
      iconUrl: input.iconUrl ?? input.dapp?.iconUrl,
      visitedAt: Date.now(),
    };

    await this.repo.addRecent(record);

    return record;
  }

  async listRecent(input: {
    userId: string;
    limit?: number;
  }): Promise {
    return this.repo.listRecent(input.userId, input.limit ?? 20);
  }

  async clearRecent(userId: string): Promise {
    await this.repo.clearRecent(userId);
  }

  private newVisitId(): string {
    return `DVIS-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  }
}
```



---



## 11\. Home Service



### `core/registry/dapp-home.service.ts`



```TypeScript
import { DappHomeData } from './dapp-registry.types';
import { DappRegistryService } from './dapp-registry.service';
import { DappCategoryService } from './dapp-category.service';
import { DappFavoriteService } from './dapp-favorite.service';
import { DappRecentService } from './dapp-recent.service';

export class DappHomeService {
  constructor(
    private readonly registry: DappRegistryService,
    private readonly category: DappCategoryService,
    private readonly favorite: DappFavoriteService,
    private readonly recent: DappRecentService,
  ) {}

  async getHomeData(input: {
    userId: string;
    chainId?: string;
  }): Promise {
    const featured = await this.registry.listDapps({
      category: undefined,
      chainId: input.chainId,
      limit: 10,
    });

    const popular = await this.registry.listDapps({
      chainId: input.chainId,
      limit: 20,
    });

    const favorites = await this.favorite.listFavorites(input.userId);
    const recent = await this.recent.listRecent({
      userId: input.userId,
      limit: 10,
    });

    return {
      featured: featured.filter((item) => item.featured).slice(0, 8),
      categories: this.category.listCategories(),
      popular,
      favorites,
      recent,
    };
  }
}
```



---



## 12\. Runtime 工厂接入 Registry



### `core/router/create-dapp-router-runtime.ts` 新增



```TypeScript
import { DEFAULT_DAPPS } from '../registry/default-dapps';
import { InMemoryDappRegistryStorageService } from '../registry/dapp-registry-storage.service';
import { DappRegistryRepository } from '../registry/dapp-registry.repository';
import { DappRegistryService } from '../registry/dapp-registry.service';
import { DappSearchService } from '../registry/dapp-search.service';
import { DappCategoryService } from '../registry/dapp-category.service';
import { DappFavoriteService } from '../registry/dapp-favorite.service';
import { DappRecentService } from '../registry/dapp-recent.service';
import { DappHomeService } from '../registry/dapp-home.service';
```



工厂内部新增：



```TypeScript
const dappRegistryStorage = new InMemoryDappRegistryStorageService(DEFAULT_DAPPS);
const dappRegistryRepo = new DappRegistryRepository(dappRegistryStorage);
const dappRegistry = new DappRegistryService(dappRegistryRepo);
const dappSearch = new DappSearchService(dappRegistry);
const dappCategory = new DappCategoryService();
const dappFavorite = new DappFavoriteService(dappRegistryRepo);
const dappRecent = new DappRecentService(dappRegistryRepo);
const dappHome = new DappHomeService(
  dappRegistry,
  dappCategory,
  dappFavorite,
  dappRecent,
);
```



返回对象追加：



```TypeScript
return {
  ...

  dappRegistryStorage,
  dappRegistryRepo,
  dappRegistry,
  dappSearch,
  dappCategory,
  dappFavorite,
  dappRecent,
  dappHome,
};
```



---



## 13\. UI：Risk Badge



### `ui/components/DappRiskBadge.tsx`



```TypeScript
import React from 'react';
import { Text, View } from 'react-native';
import { DappRegistryRiskLevel } from '../../core/registry/dapp-registry.types';

export function DappRiskBadge(props: {
  riskLevel: DappRegistryRiskLevel;
}) {
  if (props.riskLevel === 'low') return null;

  const color = getColor(props.riskLevel);

  return (
    
      
        {label(props.riskLevel)}
      
    
  );
}

function label(level: DappRegistryRiskLevel) {
  const map: Record = {
    low: '安全',
    medium: '注意',
    high: '高风险',
    critical: '极高风险',
    blocked: '已拦截',
  };

  return map[level];
}

function getColor(level: DappRegistryRiskLevel) {
  switch (level) {
    case 'medium':
      return { bg: '#FFFBEB', fg: '#92400E' };
    case 'high':
      return { bg: '#FFF7ED', fg: '#C2410C' };
    case 'critical':
    case 'blocked':
      return { bg: '#FEF2F2', fg: '#991B1B' };
    default:
      return { bg: '#ECFDF5', fg: '#047857' };
  }
}
```



---



## 14\. UI：DApp Card



### `ui/components/DappCard.tsx`



```TypeScript
import React from 'react';
import {
  Image,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { DappRegistryItem } from '../../core/registry/dapp-registry.types';
import { DappRiskBadge } from './DappRiskBadge';

export function DappCard(props: {
  dapp: DappRegistryItem;
  favorite?: boolean;
  compact?: boolean;
  onPress: () => void;
  onToggleFavorite?: () => void;
}) {
  const dapp = props.dapp;

  return (
    
      
        
          {dapp.iconUrl ? (
            
          ) : (
            
              
                {dapp.name.slice(0, 1)}
              
            
          )}
        

        
          
            
              {dapp.name}
            

            {dapp.verified && (
              ✓
            )}
          

          
            {dapp.description ?? dapp.hostname}
          

          
            
          
        

        {props.onToggleFavorite && (
          
            
              {props.favorite ? '★' : '☆'}
            
          
        )}
      
    
  );
}
```



---



## 15\. UI：DApp Grid



### `ui/components/DappGrid.tsx`



```TypeScript
import React from 'react';
import { FlatList, View } from 'react-native';
import { DappRegistryItem } from '../../core/registry/dapp-registry.types';
import { DappCard } from './DappCard';

export function DappGrid(props: {
  items: DappRegistryItem[];
  favorites?: Set;
  onOpen: (dapp: DappRegistryItem) => void;
  onToggleFavorite?: (dapp: DappRegistryItem) => void;
}) {
  return (
     item.dappId}
      numColumns={3}
      columnWrapperStyle={{
        gap: 10,
        marginBottom: 10,
      }}
      renderItem={({ item }) => (
        
           props.onOpen(item)}
            onToggleFavorite={
              props.onToggleFavorite
                ? () => props.onToggleFavorite?.(item)
                : undefined
            }
          />
        
      )}
    />
  );
}
```



---



## 16\. UI：Search Bar



### `ui/components/DappSearchBar.tsx`



```TypeScript
import React, { useState } from 'react';
import {
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

export function DappSearchBar(props: {
  placeholder?: string;
  onSearch: (keyword: string) => void;
  onFocus?: () => void;
}) {
  const [value, setValue] = useState('');

  function submit() {
    props.onSearch(value.trim());
  }

  return (
    
      🔍

      

      {value.length > 0 && (
         {
            setValue('');
            props.onSearch('');
          }}
        >
          ✕
        
      )}
    
  );
}
```



---



## 17\. UI：Category Tabs



### `ui/components/DappCategoryTabs.tsx`



```TypeScript
import React from 'react';
import {
  ScrollView,
  Text,
  TouchableOpacity,
} from 'react-native';
import {
  DappCategory,
  DappCategoryKey,
} from '../../core/registry/dapp-registry.types';

export function DappCategoryTabs(props: {
  categories: DappCategory[];
  active?: DappCategoryKey;
  onChange: (category: DappCategoryKey) => void;
}) {
  return (
    
      {props.categories
        .filter((item) => item.enabled)
        .map((item) => {
          const active = props.active === item.key;

          return (
             props.onChange(item.key)}
              style={{
                paddingHorizontal: 14,
                paddingVertical: 8,
                borderRadius: 999,
                backgroundColor: active ? '#111827' : '#F3F4F6',
              }}
            >
              
                {item.icon ? `${item.icon} ` : ''}
                {item.label}
              
            
          );
        })}
    
  );
}
```



---



## 18\. UI：Section Header



### `ui/components/DappSectionHeader.tsx`



```TypeScript
import React from 'react';
import {
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export function DappSectionHeader(props: {
  title: string;
  actionText?: string;
  onAction?: () => void;
}) {
  return (
    
      
        {props.title}
      

      {props.actionText && props.onAction && (
        
          
            {props.actionText}
          
        
      )}
    
  );
}
```



---



## 19\. UI：Featured Banner



### `ui/components/DappFeaturedBanner.tsx`



```TypeScript
import React from 'react';
import {
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { DappRegistryItem } from '../../core/registry/dapp-registry.types';

export function DappFeaturedBanner(props: {
  items: DappRegistryItem[];
  onOpen: (dapp: DappRegistryItem) => void;
}) {
  if (props.items.length === 0) return null;

  return (
    
      {props.items.map((item) => (
         props.onOpen(item)}
          style={{
            width: 260,
            minHeight: 120,
            padding: 16,
            borderRadius: 20,
            backgroundColor: '#111827',
            flexDirection: 'row',
            alignItems: 'center',
            gap: 14,
          }}
        >
          {item.iconUrl && (
            
          )}

          
            
              {item.name}
            

            
              {item.description ?? item.hostname}
            
          
        
      ))}
    
  );
}
```



---



## 20\. DApp Home Screen



### `ui/screens/DappHomeScreen.tsx`



```TypeScript
import React, { useEffect, useState } from 'react';
import {
  ScrollView,
  Text,
  View,
} from 'react-native';
import {
  DappCategoryKey,
  DappHomeData,
  DappRegistryItem,
} from '../../core/registry/dapp-registry.types';
import { DappHomeService } from '../../core/registry/dapp-home.service';
import { DappSearchService } from '../../core/registry/dapp-search.service';
import { DappFavoriteService } from '../../core/registry/dapp-favorite.service';
import { DappRecentService } from '../../core/registry/dapp-recent.service';
import { DappFeaturedBanner } from '../components/DappFeaturedBanner';
import { DappSearchBar } from '../components/DappSearchBar';
import { DappCategoryTabs } from '../components/DappCategoryTabs';
import { DappSectionHeader } from '../components/DappSectionHeader';
import { DappGrid } from '../components/DappGrid';
import { DappCard } from '../components/DappCard';

export function DappHomeScreen(props: {
  userId: string;
  chainId?: string;

  homeService: DappHomeService;
  searchService: DappSearchService;
  favoriteService: DappFavoriteService;
  recentService: DappRecentService;

  onOpenDapp: (dapp: DappRegistryItem) => void;
  onSearchSubmit?: (keyword: string) => void;
}) {
  const [home, setHome] = useState(null);
  const [activeCategory, setActiveCategory] = useState('featured');
  const [categoryItems, setCategoryItems] = useState([]);
  const [favoriteIds, setFavoriteIds] = useState>(new Set());

  async function load() {
    const data = await props.homeService.getHomeData({
      userId: props.userId,
      chainId: props.chainId,
    });

    setHome(data);
    setFavoriteIds(new Set(data.favorites.map((item) => item.dappId)));

    const items = await props.searchService.search({
      category: activeCategory === 'featured' ? undefined : activeCategory,
      chainId: props.chainId,
      limit: 30,
    });

    setCategoryItems(
      activeCategory === 'featured'
        ? items.filter((item) => item.featured)
        : items,
    );
  }

  useEffect(() => {
    void load();
  }, [props.userId, props.chainId, activeCategory]);

  async function toggleFavorite(dapp: DappRegistryItem) {
    const result = await props.favoriteService.toggleFavorite({
      userId: props.userId,
      dapp,
    });

    setFavoriteIds((prev) => {
      const next = new Set(prev);

      if (result.favorite) {
        next.add(dapp.dappId);
      } else {
        next.delete(dapp.dappId);
      }

      return next;
    });
  }

  async function openDapp(dapp: DappRegistryItem) {
    await props.recentService.recordVisit({
      userId: props.userId,
      url: dapp.url,
      dapp,
    });

    props.onOpenDapp(dapp);
  }

  if (!home) {
    return (
      
        加载 DApp 首页...
      
    );
  }

  return (
    
      
        DApp 浏览器
      

       props.onSearchSubmit?.(keyword)}
        onFocus={() => props.onSearchSubmit?.('')}
      />

      

      

      {home.favorites.length > 0 && (
        <>
          

          
            {home.favorites.map((item) => (
               openDapp(item)}
                onToggleFavorite={() => toggleFavorite(item)}
              />
            ))}
          
        
      )}

      {home.recent.length > 0 && (
        <>
          

          
            {home.recent.map((item) => (
              
                
                  {item.title ?? item.hostname}
                

                
                  {item.hostname}
                
              
            ))}
          
        
      )}

      

      

      
    
  );
}
```



---



## 21\. Search Screen



### `ui/screens/DappSearchScreen.tsx`



```TypeScript
import React, { useEffect, useState } from 'react';
import {
  FlatList,
  Text,
  View,
} from 'react-native';
import {
  DappRegistryItem,
} from '../../core/registry/dapp-registry.types';
import { DappSearchService } from '../../core/registry/dapp-search.service';
import { DappFavoriteService } from '../../core/registry/dapp-favorite.service';
import { DappRecentService } from '../../core/registry/dapp-recent.service';
import { DappSearchBar } from '../components/DappSearchBar';
import { DappCard } from '../components/DappCard';

export function DappSearchScreen(props: {
  userId: string;
  chainId?: string;
  initialKeyword?: string;
  searchService: DappSearchService;
  favoriteService: DappFavoriteService;
  recentService: DappRecentService;
  onOpenDapp: (dapp: DappRegistryItem) => void;
}) {
  const [keyword, setKeyword] = useState(props.initialKeyword ?? '');
  const [items, setItems] = useState([]);
  const [favoriteIds, setFavoriteIds] = useState>(new Set());

  async function search(nextKeyword = keyword) {
    const data = await props.searchService.search({
      keyword: nextKeyword,
      chainId: props.chainId,
      limit: 100,
    });

    const favs = await props.favoriteService.listFavorites(props.userId);

    setItems(data);
    setFavoriteIds(new Set(favs.map((item) => item.dappId)));
  }

  useEffect(() => {
    void search(keyword);
  }, [keyword, props.chainId]);

  async function openDapp(dapp: DappRegistryItem) {
    await props.recentService.recordVisit({
      userId: props.userId,
      url: dapp.url,
      dapp,
    });

    props.onOpenDapp(dapp);
  }

  async function toggleFavorite(dapp: DappRegistryItem) {
    const result = await props.favoriteService.toggleFavorite({
      userId: props.userId,
      dapp,
    });

    setFavoriteIds((prev) => {
      const next = new Set(prev);
      result.favorite ? next.add(dapp.dappId) : next.delete(dapp.dappId);
      return next;
    });
  }

  return (
    
      

       item.dappId}
        renderItem={({ item }) => (
          
             openDapp(item)}
              onToggleFavorite={() => toggleFavorite(item)}
            />
          
        )}
        ListEmptyComponent={
          
            未找到相关 DApp
          
        }
      />
    
  );
}
```



---



## 22\. Favorites Screen



### `ui/screens/DappFavoritesScreen.tsx`



```TypeScript
import React, { useEffect, useState } from 'react';
import {
  FlatList,
  Text,
  View,
} from 'react-native';
import { DappRegistryItem } from '../../core/registry/dapp-registry.types';
import { DappFavoriteService } from '../../core/registry/dapp-favorite.service';
import { DappRecentService } from '../../core/registry/dapp-recent.service';
import { DappCard } from '../components/DappCard';

export function DappFavoritesScreen(props: {
  userId: string;
  favoriteService: DappFavoriteService;
  recentService: DappRecentService;
  onOpenDapp: (dapp: DappRegistryItem) => void;
}) {
  const [items, setItems] = useState([]);

  async function load() {
    setItems(await props.favoriteService.listFavorites(props.userId));
  }

  useEffect(() => {
    void load();
  }, [props.userId]);

  async function openDapp(dapp: DappRegistryItem) {
    await props.recentService.recordVisit({
      userId: props.userId,
      url: dapp.url,
      dapp,
    });

    props.onOpenDapp(dapp);
  }

  async function remove(dapp: DappRegistryItem) {
    await props.favoriteService.removeFavorite({
      userId: props.userId,
      dappId: dapp.dappId,
    });

    await load();
  }

  return (
    
      
        我的收藏
      

       item.dappId}
        renderItem={({ item }) => (
          
             openDapp(item)}
              onToggleFavorite={() => remove(item)}
            />
          
        )}
        ListEmptyComponent={
          
            暂无收藏 DApp
          
        }
      />
    
  );
}
```



---



## 23\. Recent Screen



### `ui/screens/DappRecentScreen.tsx`



```TypeScript
import React, { useEffect, useState } from 'react';
import {
  FlatList,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { DappRecentVisitRecord } from '../../core/registry/dapp-registry.types';
import { DappRecentService } from '../../core/registry/dapp-recent.service';

export function DappRecentScreen(props: {
  userId: string;
  recentService: DappRecentService;
  onOpenUrl: (url: string) => void;
}) {
  const [items, setItems] = useState([]);

  async function load() {
    setItems(await props.recentService.listRecent({
      userId: props.userId,
      limit: 50,
    }));
  }

  useEffect(() => {
    void load();
  }, [props.userId]);

  async function clear() {
    await props.recentService.clearRecent(props.userId);
    await load();
  }

  return (
    
      
        
          最近访问
        

        
          
            清空
          
        
      

       item.visitId}
        renderItem={({ item }) => (
           props.onOpenUrl(item.url)}
            style={{
              padding: 14,
              borderRadius: 14,
              borderWidth: 1,
              borderColor: '#E5E7EB',
              backgroundColor: '#FFFFFF',
              marginBottom: 10,
            }}
          >
            
              {item.title ?? item.hostname}
            

            
              {item.url}
            

            
              {new Date(item.visitedAt).toLocaleString()}
            
          
        )}
        ListEmptyComponent={
          
            暂无访问记录
          
        }
      />
    
  );
}
```



---



## 24\. 打开 DApp 流程



页面跳转逻辑建议：



```TypeScript
function openDapp(dapp: DappRegistryItem) {
  navigation.navigate('DappBrowser', {
    url: dapp.url,
    dappId: dapp.dappId,
  });
}
```



打开 URL：



```TypeScript
function openUrl(url: string) {
  navigation.navigate('DappBrowser', {
    url,
  });
}
```



---



## 25\. 与安全系统联动



DApp Registry 中：



```TypeScript
riskLevel: 'blocked'
status: 'blocked'
```



打开时必须拦截：



```TypeScript
await dappRegistry.assertDappOpenable(dappId);
```



如果用户手动输入 URL，则 Part 11 安全系统会做：



```Plain Text
URL Security
Phishing Detector
Domain Blacklist
```



---



## 26\. 后台可管理数据结构



后端建议 Prisma：



```Plain Text
model DappRegistryItem {
  id          BigInt   @id @default(autoincrement())
  dappId      String   @unique @db.VarChar(64)

  name        String   @db.VarChar(128)
  description String?  @db.VarChar(512)
  iconUrl     String?  @db.VarChar(1024)
  url         String   @db.VarChar(1024)
  origin      String   @db.VarChar(512)
  hostname    String   @db.VarChar(255)

  category    String   @db.VarChar(64)
  tags        Json
  chains      Json

  status      String   @default("active") @db.VarChar(32)
  riskLevel   String   @default("low") @db.VarChar(32)

  featured    Boolean  @default(false)
  verified    Boolean  @default(false)
  sortOrder   Int      @default(0)

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([category])
  @@index([status])
  @@index([riskLevel])
  @@index([featured])
  @@index([hostname])
  @@map("dapp_registry_items")
}
```



收藏：



```Plain Text
model DappFavorite {
  id          BigInt   @id @default(autoincrement())
  favoriteId  String   @unique @db.VarChar(64)
  userId      BigInt
  dappId      String   @db.VarChar(64)
  origin      String   @db.VarChar(512)
  createdAt   DateTime @default(now())

  @@unique([userId, dappId])
  @@index([userId])
  @@map("dapp_favorites")
}
```



最近访问：



```Plain Text
model DappRecentVisit {
  id          BigInt   @id @default(autoincrement())
  visitId     String   @unique @db.VarChar(64)
  userId      BigInt
  dappId      String?  @db.VarChar(64)
  url         String   @db.VarChar(1024)
  origin      String   @db.VarChar(512)
  hostname    String   @db.VarChar(255)
  title       String?  @db.VarChar(255)
  iconUrl     String?  @db.VarChar(1024)
  visitedAt   DateTime @default(now())

  @@unique([userId, origin])
  @@index([userId])
  @@index([visitedAt])
  @@map("dapp_recent_visits")
}
```



---



## 27\. 缓存策略



生产建议：



```Plain Text
DApp Registry:
  - App 启动拉远端配置
  - 本地 SQLite / MMKV 缓存
  - 版本号增量更新
  - blocked 状态实时覆盖

Favorites:
  - 本地优先
  - 登录后云同步

Recent:
  - 本地保存
  - 可选云同步
```



---



## 28\. 本章完成内容



本章完成：



```Plain Text
DApp Registry 类型
Registry Storage
Registry Repository
Registry Service
默认 DApp 数据
分类服务
搜索服务
收藏服务
最近访问服务
首页聚合服务
DApp Card
DApp Grid
Search Bar
Category Tabs
Featured Banner
Home Screen
Search Screen
Favorites Screen
Recent Screen
后台数据结构建议
缓存策略
```



现在 DApp 浏览器具备完整生态首页能力：



```Plain Text
DApp Home
  -> Featured
  -> Category
  -> Search
  -> Favorite
  -> Recent
  -> Open DApp
  -> Secure WebView
```



---



## 29\. 下一章继续



下一段继续：



**《DApp 浏览器 Part 10：WalletConnect v2 工业级接入》**



将覆盖：



```Plain Text
WalletConnect SignClient
Pairing URI
Session Proposal
Session Approval Modal
Namespace 构建
Session Storage
Session Request Handler
personal_sign
eth_signTypedData_v4
eth_sendTransaction
wallet_switchEthereumChain
wallet_addEthereumChain
Session Delete
Event Sync
WalletConnect Sessions 页面
```



WalletConnect 是工业级 DApp 浏览器必须支持的外部连接入口。

