/**
 * 联系人类型定义
 *
 * 包含地址簿相关的类型定义
 */

import type { Address } from '../sdk.types';

// ============================================================================
// 联系人类型
// ============================================================================

/** 联系人分类 */
export type ContactCategory =
  | 'exchange'
  | 'defi'
  | 'nft'
  | 'friend'
  | 'family'
  | 'work'
  | 'other';

/** 联系人标签 */
export interface ContactTag {
  /** 标签 ID */
  id: string;
  /** 标签名称 */
  name: string;
  /** 标签颜色 */
  color?: string;
}

/** 联系人分组 */
export interface ContactGroup {
  /** 分组 ID */
  id: string;
  /** 分组名称 */
  name: string;
  /** 分组描述 */
  description?: string;
  /** 联系人 ID 列表 */
  contactIds: string[];
  /** 创建时间 */
  createdAt: number;
  /** 更新时间 */
  updatedAt: number;
}

/** 联系人交易记录 */
export interface ContactTransaction {
  /** 交易哈希 */
  txHash: string;
  /** 链 ID */
  chainId: number;
  /** 交易时间 */
  timestamp: number;
  /** 交易方向 */
  direction: 'incoming' | 'outgoing';
  /** 金额 */
  amount: string;
  /** 代币符号 */
  symbol: string;
}

/** 联系人详情 */
export interface ContactDetail {
  /** 联系人 ID */
  id: string;
  /** 联系人名称 */
  name: string;
  /** 联系人地址 */
  address: Address;
  /** 链 ID */
  chainId: number;
  /** 联系人头像 */
  avatar?: string;
  /** 邮箱 */
  email?: string;
  /** 电话 */
  phone?: string;
  /** 备注 */
  note?: string;
  /** 标签列表 */
  tags: string[];
  /** 是否收藏 */
  isFavorite: boolean;
  /** 分类 */
  category?: ContactCategory;
  /** 创建时间 */
  createdAt: number;
  /** 更新时间 */
  updatedAt: number;
  /** 最近使用时间 */
  lastUsedAt?: number;
  /** 使用次数 */
  useCount: number;
  /** 关联地址列表（多链） */
  relatedAddresses?: Array<{
    chainId: number;
    address: Address;
  }>;
  /** 风险等级 */
  riskLevel?: 'safe' | 'warning' | 'danger';
  /** 风险提示 */
  riskWarnings?: string[];
  /** 是否已验证 */
  verified?: boolean;
  /** 验证方式 */
  verifiedBy?: 'manual' | 'email' | 'phone' | 'domain';
}

/** 创建联系人参数 */
export interface CreateContactOptions {
  name: string;
  address: Address;
  chainId?: number;
  avatar?: string;
  email?: string;
  phone?: string;
  note?: string;
  tags?: string[];
  isFavorite?: boolean;
  category?: ContactCategory;
  relatedAddresses?: Array<{
    chainId: number;
    address: Address;
  }>;
}

/** 更新联系人参数 */
export interface UpdateContactOptions {
  name?: string;
  address?: Address;
  chainId?: number;
  avatar?: string;
  email?: string;
  phone?: string;
  note?: string;
  tags?: string[];
  isFavorite?: boolean;
  category?: ContactCategory;
  relatedAddresses?: Array<{
    chainId: number;
    address: Address;
  }>;
}

/** 搜索联系人选项 */
export interface SearchContactOptions {
  /** 搜索关键词 */
  keyword?: string;
  /** 链 ID 过滤 */
  chainId?: number;
  /** 标签过滤 */
  tags?: string[];
  /** 分类过滤 */
  category?: ContactCategory;
  /** 是否仅收藏 */
  favoritesOnly?: boolean;
  /** 排序方式 */
  sortBy?: 'name' | 'lastUsed' | 'useCount' | 'createdAt';
  /** 排序方向 */
  sortOrder?: 'asc' | 'desc';
  /** 分页偏移 */
  offset?: number;
  /** 分页限制 */
  limit?: number;
}

/** 地址簿导入格式 */
export type ImportFormat = 'json' | 'csv';

/** 导入结果 */
export interface ImportResult {
  /** 成功导入数量 */
  success: number;
  /** 失败数量 */
  failed: number;
  /** 跳过数量（重复） */
  skipped: number;
  /** 失败详情 */
  errors: Array<{
    name?: string;
    address?: string;
    reason: string;
  }>;
}

/** 导出选项 */
export interface ExportOptions {
  format: ImportFormat;
  /** 导出特定链的联系人 */
  chainId?: number;
  /** 仅导出收藏 */
  favoritesOnly?: boolean;
  /** 仅导出特定标签 */
  tags?: string[];
}

/** 兼容旧导出：导出格式 */
export type ExportFormat = ImportFormat;

/** 兼容旧导出：风险等级 */
export type RiskLevel = 'safe' | 'warning' | 'danger';

/** 兼容旧导出：联系人统计 */
export interface ContactStats {
  total: number;
  favorites: number;
  categories: Record<ContactCategory, number>;
}
