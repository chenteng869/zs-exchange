/**
 * 地址簿服务
 *
 * 功能：
 *  - 联系人增删改查
 *  - 联系人搜索
 *  - 联系人分组
 *  - 导入导出
 *  - 收藏管理
 *  - 使用统计
 */

import type { Contact, CreateContactOptions, Address } from '../sdk.types';
import type {
  ContactCategory,
  ContactDetail,
  UpdateContactOptions,
  SearchContactOptions,
  ImportFormat,
  ImportResult,
  ExportOptions,
  ContactGroup,
} from './contact.types';

/**
 * 地址簿服务类
 */
export class AddressBookService {
  /** 联系人列表 */
  private contacts: ContactDetail[] = [];

  /** 分组列表 */
  private groups: ContactGroup[] = [];

  /** 已销毁标志 */
  private destroyed: boolean = false;

  /** 存储键 */
  private storageKey: string = 'wallet_sdk_address_book';

  /** 分组存储键 */
  private groupsStorageKey: string = 'wallet_sdk_contact_groups';

  // ==========================================================================
  // 构造函数
  // ==========================================================================

  constructor(
    private readonly sdk: any,
  ) {}

  // ==========================================================================
  // 初始化与销毁
  // ==========================================================================

  /**
   * 初始化地址簿服务
   */
  public async initialize(): Promise<void> {
    if (this.destroyed) return;

    this.loadContacts();
    this.loadGroups();

    console.log('[AddressBookService] 初始化完成');
  }

  /**
   * 销毁地址簿服务
   */
  public destroy(): void {
    this.destroyed = true;
    console.log('[AddressBookService] 已销毁');
  }

  // ==========================================================================
  // 联系人管理
  // ==========================================================================

  /**
   * 添加联系人
   */
  public addContact(options: CreateContactOptions): ContactDetail {
    if (this.destroyed) {
      throw new Error('Service is destroyed');
    }

    const chainId = options.chainId ?? 1;

    const existing = this.contacts.find(
      c => c.address.toLowerCase() === options.address.toLowerCase() && c.chainId === chainId
    );

    if (existing) {
      throw new Error('该地址的联系人已存在');
    }

    const contact: ContactDetail = {
      id: this.generateId(),
      name: options.name,
      address: options.address,
      chainId,
      avatar: options.avatar,
      email: options.email,
      phone: options.phone,
      note: options.note,
      tags: options.tags || [],
      isFavorite: options.isFavorite ?? false,
      category: (options.category || 'other') as ContactCategory,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      useCount: 0,
      relatedAddresses: options.relatedAddresses,
      verified: false,
    };

    this.contacts.push(contact);
    this.saveContacts();

    return contact;
  }

  /**
   * 获取联系人
   */
  public getContact(id: string): ContactDetail | undefined {
    return this.contacts.find(c => c.id === id);
  }

  /**
   * 根据地址获取联系人
   */
  public getContactByAddress(address: Address, chainId?: number): ContactDetail | undefined {
    return this.contacts.find(
      c => c.address.toLowerCase() === address.toLowerCase() &&
           (chainId === undefined || c.chainId === chainId)
    );
  }

  /**
   * 获取所有联系人
   */
  public getAllContacts(): ContactDetail[] {
    return [...this.contacts];
  }

  /**
   * 更新联系人
   */
  public updateContact(id: string, options: UpdateContactOptions): ContactDetail {
    const contact = this.contacts.find(c => c.id === id);
    if (!contact) {
      throw new Error('联系人不存在');
    }

    Object.assign(contact, options, { updatedAt: Date.now() });
    this.saveContacts();

    return contact;
  }

  /**
   * 删除联系人
   */
  public removeContact(id: string): void {
    const index = this.contacts.findIndex(c => c.id === id);
    if (index !== -1) {
      this.contacts.splice(index, 1);
      this.saveContacts();
    }
  }

  // ==========================================================================
  // 收藏管理
  // ==========================================================================

  /**
   * 收藏/取消收藏联系人
   */
  public toggleFavorite(id: string): boolean {
    const contact = this.contacts.find(c => c.id === id);
    if (!contact) {
      throw new Error('联系人不存在');
    }

    contact.isFavorite = !contact.isFavorite;
    contact.updatedAt = Date.now();
    this.saveContacts();

    return contact.isFavorite;
  }

  /**
   * 获取收藏的联系人
   */
  public getFavorites(): ContactDetail[] {
    return this.contacts.filter(c => c.isFavorite);
  }

  // ==========================================================================
  // 使用统计
  // ==========================================================================

  /**
   * 记录使用
   */
  public recordUsage(id: string): void {
    const contact = this.contacts.find(c => c.id === id);
    if (contact) {
      contact.useCount++;
      contact.lastUsedAt = Date.now();
      this.saveContacts();
    }
  }

  /**
   * 获取常用联系人
   */
  public getFrequentlyUsed(limit: number = 10): ContactDetail[] {
    return [...this.contacts]
      .sort((a, b) => (b.lastUsedAt ?? 0) - (a.lastUsedAt ?? 0))
      .slice(0, limit);
  }

  /**
   * 获取最近使用的联系人
   */
  public getRecentContacts(limit: number = 10): ContactDetail[] {
    return [...this.contacts]
      .filter(c => c.lastUsedAt !== undefined)
      .sort((a, b) => (b.lastUsedAt ?? 0) - (a.lastUsedAt ?? 0))
      .slice(0, limit);
  }

  // ==========================================================================
  // 搜索
  // ==========================================================================

  /**
   * 搜索联系人
   */
  public searchContacts(options: SearchContactOptions = {}): ContactDetail[] {
    let results = [...this.contacts];

    if (options.keyword) {
      const keyword = options.keyword.toLowerCase();
      results = results.filter(c =>
        c.name.toLowerCase().includes(keyword) ||
        c.address.toLowerCase().includes(keyword) ||
        c.email?.toLowerCase().includes(keyword) ||
        c.tags.some(t => t.toLowerCase().includes(keyword))
      );
    }

    if (options.chainId !== undefined) {
      results = results.filter(c => c.chainId === options.chainId);
    }

    if (options.tags && options.tags.length > 0) {
      results = results.filter(c =>
        options.tags!.some(tag => c.tags.includes(tag))
      );
    }

    if (options.category) {
      results = results.filter(c => c.category === options.category);
    }

    if (options.favoritesOnly) {
      results = results.filter(c => c.isFavorite);
    }

    const sortBy = options.sortBy || 'name';
    const sortOrder = options.sortOrder || 'asc';

    results.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'lastUsed':
          comparison = (a.lastUsedAt ?? 0) - (b.lastUsedAt ?? 0);
          break;
        case 'useCount':
          comparison = a.useCount - b.useCount;
          break;
        case 'createdAt':
          comparison = a.createdAt - b.createdAt;
          break;
      }

      return sortOrder === 'desc' ? -comparison : comparison;
    });

    if (options.offset !== undefined) {
      results = results.slice(options.offset);
    }

    if (options.limit !== undefined) {
      results = results.slice(0, options.limit);
    }

    return results;
  }

  // ==========================================================================
  // 分组管理
  // ==========================================================================

  /**
   * 创建分组
   */
  public createGroup(name: string, description?: string): ContactGroup {
    const group: ContactGroup = {
      id: this.generateId('group'),
      name,
      description,
      contactIds: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    this.groups.push(group);
    this.saveGroups();

    return group;
  }

  /**
   * 获取所有分组
   */
  public getGroups(): ContactGroup[] {
    return [...this.groups];
  }

  /**
   * 更新分组
   */
  public updateGroup(groupId: string, name?: string, description?: string): ContactGroup {
    const group = this.groups.find(g => g.id === groupId);
    if (!group) {
      throw new Error('分组不存在');
    }

    if (name !== undefined) group.name = name;
    if (description !== undefined) group.description = description;
    group.updatedAt = Date.now();

    this.saveGroups();
    return group;
  }

  /**
   * 删除分组
   */
  public removeGroup(groupId: string): void {
    const index = this.groups.findIndex(g => g.id === groupId);
    if (index !== -1) {
      this.groups.splice(index, 1);
      this.saveGroups();
    }
  }

  /**
   * 添加联系人到分组
   */
  public addContactToGroup(groupId: string, contactId: string): void {
    const group = this.groups.find(g => g.id === groupId);
    if (!group) {
      throw new Error('分组不存在');
    }

    if (!group.contactIds.includes(contactId)) {
      group.contactIds.push(contactId);
      group.updatedAt = Date.now();
      this.saveGroups();
    }
  }

  /**
   * 从分组移除联系人
   */
  public removeContactFromGroup(groupId: string, contactId: string): void {
    const group = this.groups.find(g => g.id === groupId);
    if (!group) return;

    const index = group.contactIds.indexOf(contactId);
    if (index !== -1) {
      group.contactIds.splice(index, 1);
      group.updatedAt = Date.now();
      this.saveGroups();
    }
  }

  /**
   * 获取分组中的联系人
   */
  public getGroupContacts(groupId: string): ContactDetail[] {
    const group = this.groups.find(g => g.id === groupId);
    if (!group) return [];

    return group.contactIds
      .map(id => this.contacts.find(c => c.id === id))
      .filter((c): c is ContactDetail => !!c);
  }

  // ==========================================================================
  // 导入导出
  // ==========================================================================

  /**
   * 导入联系人
   */
  public importContacts(data: string, format: ImportFormat): ImportResult {
    const result: ImportResult = {
      success: 0,
      failed: 0,
      skipped: 0,
      errors: [],
    };

    let contactsToImport: CreateContactOptions[] = [];

    try {
      if (format === 'json') {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) {
          contactsToImport = parsed;
        } else if (parsed.contacts && Array.isArray(parsed.contacts)) {
          contactsToImport = parsed.contacts;
        }
      } else if (format === 'csv') {
        contactsToImport = this.parseCSV(data);
      }
    } catch (error) {
      result.failed++;
      result.errors.push({ reason: `解析失败: ${(error as Error).message}` });
      return result;
    }

    for (const contactData of contactsToImport) {
      try {
        if (!contactData.name || !contactData.address) {
          result.failed++;
          result.errors.push({
            name: contactData.name,
            address: contactData.address,
            reason: '缺少必要字段',
          });
          continue;
        }

        const chainId = contactData.chainId ?? 1;
        const existing = this.contacts.find(
          c => c.address.toLowerCase() === contactData.address.toLowerCase() && c.chainId === chainId
        );

        if (existing) {
          result.skipped++;
          continue;
        }

        this.addContact(contactData);
        result.success++;
      } catch (error) {
        result.failed++;
        result.errors.push({
          name: contactData.name,
          address: contactData.address,
          reason: (error as Error).message,
        });
      }
    }

    return result;
  }

  /**
   * 导出联系人
   */
  public exportContacts(options: ExportOptions): string {
    let contacts = [...this.contacts];

    if (options.chainId !== undefined) {
      contacts = contacts.filter(c => c.chainId === options.chainId);
    }

    if (options.favoritesOnly) {
      contacts = contacts.filter(c => c.isFavorite);
    }

    if (options.tags && options.tags.length > 0) {
      contacts = contacts.filter(c =>
        options.tags!.some(tag => c.tags.includes(tag))
      );
    }

    if (options.format === 'json') {
      return JSON.stringify(contacts, null, 2);
    } else {
      return this.toCSV(contacts);
    }
  }

  // ==========================================================================
  // 统计
  // ==========================================================================

  /**
   * 获取联系人总数
   */
  public getContactCount(): number {
    return this.contacts.length;
  }

  /**
   * 获取收藏数量
   */
  public getFavoriteCount(): number {
    return this.contacts.filter(c => c.isFavorite).length;
  }

  /**
   * 获取指定链的联系人数量
   */
  public getChainContactCount(chainId: number): number {
    return this.contacts.filter(c => c.chainId === chainId).length;
  }

  /**
   * 获取所有标签
   */
  public getAllTags(): string[] {
    const tagSet = new Set<string>();
    this.contacts.forEach(c => {
      c.tags.forEach(tag => tagSet.add(tag));
    });
    return Array.from(tagSet);
  }

  // ==========================================================================
  // 内部方法
  // ==========================================================================

  /**
   * 生成 ID
   */
  private generateId(prefix: string = 'contact'): string {
    return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
  }

  /**
   * 解析 CSV
   */
  private parseCSV(data: string): CreateContactOptions[] {
    const lines = data.trim().split('\n');
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const contacts: CreateContactOptions[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      const contact: any = {};

      headers.forEach((header, index) => {
        const value = values[index] || '';
        switch (header) {
          case 'name':
            contact.name = value;
            break;
          case 'address':
            contact.address = value;
            break;
          case 'chainid':
          case 'chain_id':
            contact.chainId = parseInt(value) || 1;
            break;
          case 'email':
            contact.email = value;
            break;
          case 'phone':
            contact.phone = value;
            break;
          case 'note':
          case 'notes':
            contact.note = value;
            break;
          case 'tags':
            contact.tags = value.split(';').filter(Boolean);
            break;
          case 'favorite':
          case 'isfavorite':
            contact.isFavorite = value.toLowerCase() === 'true' || value === '1';
            break;
        }
      });

      if (contact.name && contact.address) {
        contacts.push(contact);
      }
    }

    return contacts;
  }

  /**
   * 转换为 CSV
   */
  private toCSV(contacts: ContactDetail[]): string {
    const headers = ['name', 'address', 'chainId', 'email', 'phone', 'note', 'tags', 'isFavorite'];
    const lines = [headers.join(',')];

    for (const contact of contacts) {
      const row = [
        contact.name,
        contact.address,
        contact.chainId.toString(),
        contact.email || '',
        contact.phone || '',
        contact.note || '',
        contact.tags.join(';'),
        contact.isFavorite.toString(),
      ];
      lines.push(row.join(','));
    }

    return lines.join('\n');
  }

  /**
   * 从存储加载联系人
   */
  private loadContacts(): void {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        this.contacts = JSON.parse(stored);
      }
    } catch (error) {
      console.error('[AddressBookService] 加载联系人失败', error);
      this.contacts = [];
    }
  }

  /**
   * 保存联系人到存储
   */
  private saveContacts(): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.contacts));
    } catch (error) {
      console.error('[AddressBookService] 保存联系人失败', error);
    }
  }

  /**
   * 从存储加载分组
   */
  private loadGroups(): void {
    try {
      const stored = localStorage.getItem(this.groupsStorageKey);
      if (stored) {
        this.groups = JSON.parse(stored);
      }
    } catch (error) {
      console.error('[AddressBookService] 加载分组失败', error);
      this.groups = [];
    }
  }

  /**
   * 保存分组到存储
   */
  private saveGroups(): void {
    try {
      localStorage.setItem(this.groupsStorageKey, JSON.stringify(this.groups));
    } catch (error) {
      console.error('[AddressBookService] 保存分组失败', error);
    }
  }
}
