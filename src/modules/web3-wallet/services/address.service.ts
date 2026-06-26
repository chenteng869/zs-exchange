/**
 * Web3 钱包模块 - 地址簿服务
 *
 * 提供地址簿管理功能，包括地址的增删改查、分组管理、
 * 标签管理、地址标签搜索等功能
 */

import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { BlockchainNetwork } from '../dto/wallet.dto';

@Injectable()
export class AddressBookService {
  private addressBooks: Map<string, AddressBookItem[]> = new Map();
  private groups: Map<string, AddressGroup[]> = new Map();
  private tags: Map<string, string[]> = new Map();

  /**
   * 获取地址簿列表
   *
   * @param userId 用户ID
   * @param chain 链（可选）
   * @param groupId 分组ID（可选）
   * @param keyword 关键词（可选）
   * @param page 页码
   * @param pageSize 每页数量
   * @returns 地址列表和总数
   */
  async getAddressList(
    userId: string,
    chain?: BlockchainNetwork,
    groupId?: string,
    keyword?: string,
    page: number = 1,
    pageSize: number = 20,
  ): Promise<{ list: AddressBookItem[]; total: number }> {
    let addresses = this.addressBooks.get(userId) || [];

    if (chain) {
      addresses = addresses.filter((a) => a.chain === chain);
    }

    if (groupId) {
      addresses = addresses.filter((a) => a.groupId === groupId);
    }

    if (keyword) {
      const kw = keyword.toLowerCase();
      addresses = addresses.filter(
        (a) =>
          a.address.toLowerCase().includes(kw) ||
          a.label.toLowerCase().includes(kw) ||
          (a.notes && a.notes.toLowerCase().includes(kw)),
      );
    }

    addresses.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const total = addresses.length;
    const start = (page - 1) * pageSize;
    const list = addresses.slice(start, start + pageSize);

    return { list, total };
  }

  /**
   * 获取地址详情
   *
   * @param userId 用户ID
   * @param addressId 地址ID
   * @returns 地址详情
   */
  async getAddressById(userId: string, addressId: string): Promise<AddressBookItem> {
    const addresses = this.addressBooks.get(userId) || [];
    const address = addresses.find((a) => a.id === addressId);

    if (!address) {
      throw new NotFoundException('地址不存在');
    }

    return address;
  }

  /**
   * 添加地址到地址簿
   *
   * @param userId 用户ID
   * @param createDto 创建参数
   * @returns 新建的地址
   */
  async addAddress(
    userId: string,
    createDto: {
      address: string;
      chain: BlockchainNetwork;
      label: string;
      notes?: string;
      groupId?: string;
      tags?: string[];
      isFavorite?: boolean;
    },
  ): Promise<AddressBookItem> {
    const addresses = this.addressBooks.get(userId) || [];

    const exists = addresses.some(
      (a) => a.address.toLowerCase() === createDto.address.toLowerCase() && a.chain === createDto.chain,
    );

    if (exists) {
      throw new BadRequestException('该地址已在地址簿中');
    }

    const addressId = 'addr_' + this.generateRandomId();

    const newAddress: AddressBookItem = {
      id: addressId,
      ...createDto,
      tags: createDto.tags || [],
      isFavorite: createDto.isFavorite || false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    addresses.push(newAddress);
    this.addressBooks.set(userId, addresses);

    return newAddress;
  }

  /**
   * 更新地址信息
   *
   * @param userId 用户ID
   * @param addressId 地址ID
   * @param updateDto 更新数据
   * @returns 更新后的地址
   */
  async updateAddress(
    userId: string,
    addressId: string,
    updateDto: {
      label?: string;
      notes?: string;
      groupId?: string;
      tags?: string[];
      isFavorite?: boolean;
    },
  ): Promise<AddressBookItem> {
    const addresses = this.addressBooks.get(userId) || [];
    const index = addresses.findIndex((a) => a.id === addressId);

    if (index === -1) {
      throw new NotFoundException('地址不存在');
    }

    addresses[index] = {
      ...addresses[index],
      ...updateDto,
      updatedAt: new Date(),
    };

    this.addressBooks.set(userId, addresses);

    return addresses[index];
  }

  /**
   * 删除地址
   *
   * @param userId 用户ID
   * @param addressId 地址ID
   */
  async deleteAddress(userId: string, addressId: string): Promise<void> {
    const addresses = this.addressBooks.get(userId) || [];
    const index = addresses.findIndex((a) => a.id === addressId);

    if (index === -1) {
      throw new NotFoundException('地址不存在');
    }

    addresses.splice(index, 1);
    this.addressBooks.set(userId, addresses);
  }

  /**
   * 收藏/取消收藏地址
   *
   * @param userId 用户ID
   * @param addressId 地址ID
   * @param isFavorite 是否收藏
   * @returns 更新后的地址
   */
  async toggleFavorite(userId: string, addressId: string, isFavorite: boolean): Promise<AddressBookItem> {
    return this.updateAddress(userId, addressId, { isFavorite });
  }

  /**
   * 获取收藏的地址
   *
   * @param userId 用户ID
   * @param chain 链（可选）
   * @returns 收藏的地址列表
   */
  async getFavorites(userId: string, chain?: BlockchainNetwork): Promise<AddressBookItem[]> {
    let addresses = this.addressBooks.get(userId) || [];
    addresses = addresses.filter((a) => a.isFavorite);

    if (chain) {
      addresses = addresses.filter((a) => a.chain === chain);
    }

    return addresses;
  }

  /**
   * 获取分组列表
   *
   * @param userId 用户ID
   * @returns 分组列表
   */
  async getGroups(userId: string): Promise<AddressGroup[]> {
    return this.groups.get(userId) || [];
  }

  /**
   * 创建分组
   *
   * @param userId 用户ID
   * @param name 分组名称
   * @param description 描述（可选）
   * @param color 颜色（可选）
   * @returns 新建的分组
   */
  async createGroup(
    userId: string,
    name: string,
    description?: string,
    color?: string,
  ): Promise<AddressGroup> {
    const userGroups = this.groups.get(userId) || [];

    const exists = userGroups.some((g) => g.name === name);
    if (exists) {
      throw new BadRequestException('分组名称已存在');
    }

    const groupId = 'group_' + this.generateRandomId();

    const group: AddressGroup = {
      id: groupId,
      name,
      description,
      color: color || '#3b82f6',
      addressCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    userGroups.push(group);
    this.groups.set(userId, userGroups);

    return group;
  }

  /**
   * 更新分组
   *
   * @param userId 用户ID
   * @param groupId 分组ID
   * @param updateDto 更新数据
   * @returns 更新后的分组
   */
  async updateGroup(
    userId: string,
    groupId: string,
    updateDto: { name?: string; description?: string; color?: string },
  ): Promise<AddressGroup> {
    const userGroups = this.groups.get(userId) || [];
    const index = userGroups.findIndex((g) => g.id === groupId);

    if (index === -1) {
      throw new NotFoundException('分组不存在');
    }

    if (updateDto.name) {
      const exists = userGroups.some((g) => g.name === updateDto.name && g.id !== groupId);
      if (exists) {
        throw new BadRequestException('分组名称已存在');
      }
    }

    userGroups[index] = {
      ...userGroups[index],
      ...updateDto,
      updatedAt: new Date(),
    };

    this.groups.set(userId, userGroups);

    return userGroups[index];
  }

  /**
   * 删除分组
   *
   * @param userId 用户ID
   * @param groupId 分组ID
   */
  async deleteGroup(userId: string, groupId: string): Promise<void> {
    const userGroups = this.groups.get(userId) || [];
    const index = userGroups.findIndex((g) => g.id === groupId);

    if (index === -1) {
      throw new NotFoundException('分组不存在');
    }

    userGroups.splice(index, 1);
    this.groups.set(userId, userGroups);

    const addresses = this.addressBooks.get(userId) || [];
    for (const addr of addresses) {
      if (addr.groupId === groupId) {
        addr.groupId = undefined;
      }
    }
    this.addressBooks.set(userId, addresses);
  }

  /**
   * 获取所有标签
   *
   * @param userId 用户ID
   * @returns 标签列表
   */
  async getAllTags(userId: string): Promise<string[]> {
    const addresses = this.addressBooks.get(userId) || [];
    const tagSet = new Set<string>();

    for (const addr of addresses) {
      if (addr.tags) {
        for (const tag of addr.tags) {
          tagSet.add(tag);
        }
      }
    }

    return Array.from(tagSet).sort();
  }

  /**
   * 按标签筛选地址
   *
   * @param userId 用户ID
   * @param tag 标签
   * @returns 地址列表
   */
  async getAddressesByTag(userId: string, tag: string): Promise<AddressBookItem[]> {
    const addresses = this.addressBooks.get(userId) || [];
    return addresses.filter((a) => a.tags?.includes(tag));
  }

  /**
   * 批量导入地址
   *
   * @param userId 用户ID
   * @param addresses 地址列表
   * @returns 导入结果
   */
  async batchImport(
    userId: string,
    addresses: Array<{
      address: string;
      chain: BlockchainNetwork;
      label: string;
      notes?: string;
      groupId?: string;
      tags?: string[];
    }>,
  ): Promise<{ success: number; failed: number; errors: string[] }> {
    let success = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const addr of addresses) {
      try {
        await this.addAddress(userId, addr);
        success++;
      } catch (error: any) {
        failed++;
        errors.push(`${addr.address}: ${error.message}`);
      }
    }

    return { success, failed, errors };
  }

  /**
   * 搜索地址
   *
   * @param userId 用户ID
   * @param query 搜索查询
   * @param chain 链（可选）
   * @returns 搜索结果
   */
  async searchAddresses(
    userId: string,
    query: string,
    chain?: BlockchainNetwork,
  ): Promise<AddressBookItem[]> {
    const { list } = await this.getAddressList(userId, chain, undefined, query, 1, 50);
    return list;
  }

  /**
   * 获取地址簿统计
   *
   * @param userId 用户ID
   * @returns 统计信息
   */
  async getStats(userId: string): Promise<Record<string, any>> {
    const addresses = this.addressBooks.get(userId) || [];
    const userGroups = this.groups.get(userId) || [];

    const chainCounts: Record<string, number> = {};
    for (const addr of addresses) {
      chainCounts[addr.chain] = (chainCounts[addr.chain] || 0) + 1;
    }

    return {
      totalAddresses: addresses.length,
      favoriteCount: addresses.filter((a) => a.isFavorite).length,
      groupCount: userGroups.length,
      tagCount: (await this.getAllTags(userId)).length,
      byChain: chainCounts,
    };
  }

  // ============================================================
  // 私有方法
  // ============================================================

  /**
   * 生成随机 ID
   */
  private generateRandomId(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }
}

/**
 * 地址簿项
 */
interface AddressBookItem {
  id: string;
  address: string;
  chain: BlockchainNetwork;
  label: string;
  notes?: string;
  groupId?: string;
  tags?: string[];
  isFavorite: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 地址分组
 */
interface AddressGroup {
  id: string;
  name: string;
  description?: string;
  color: string;
  addressCount: number;
  createdAt: Date;
  updatedAt: Date;
}
