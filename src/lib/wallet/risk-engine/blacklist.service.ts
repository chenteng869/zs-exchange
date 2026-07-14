/**
 * 黑白名单服务
 * 提供地址、合约、域名的黑白名单管理功能
 */

import { safeJsonParse } from '@/lib/security/safe-json-parse';
import {
  BlacklistEntry,
  WhitelistEntry,
  BlacklistType,
  RiskLevel,
  ImportResult,
} from './risk-engine.types';

/**
 * 黑白名单服务类
 * 提供完整的黑白名单管理功能
 */
export class BlacklistService {
  private blacklist: Map<BlacklistType, Map<string, BlacklistEntry>> = new Map();
  private whitelist: Map<BlacklistType, Map<string, WhitelistEntry>> = new Map();

  private entryIdCounter = 0;

  constructor() {
    this.initializeMaps();
  }

  /**
   * 初始化各类型的 Map
   */
  private initializeMaps(): void {
    for (const type of Object.values(BlacklistType)) {
      this.blacklist.set(type, new Map());
      this.whitelist.set(type, new Map());
    }
  }

  /**
   * 生成唯一 ID
   */
  private generateId(): string {
    this.entryIdCounter++;
    return `entry_${Date.now()}_${this.entryIdCounter}`;
  }

  /**
   * 标准化值（转小写）
   * @param value 值
   */
  private normalizeValue(value: string): string {
    return value.toLowerCase().trim();
  }

  // ============================================================
  // 黑名单操作
  // ============================================================

  /**
   * 添加黑名单条目
   * @param type 类型
   * @param value 值（地址/合约/域名）
   * @param options 选项
   */
  addToBlacklist(
    type: BlacklistType,
    value: string,
    options?: {
      reason?: string;
      source?: string;
      riskLevel?: RiskLevel;
      expiresAt?: Date;
      metadata?: Record<string, unknown>;
    }
  ): BlacklistEntry {
    const normalizedValue = this.normalizeValue(value);
    const map = this.blacklist.get(type);

    const existing = map?.get(normalizedValue);
    if (existing) {
      if (options?.reason) existing.reason = options.reason;
      if (options?.source) existing.source = options.source;
      if (options?.riskLevel) existing.riskLevel = options.riskLevel;
      if (options?.expiresAt) existing.expiresAt = options.expiresAt;
      if (options?.metadata) existing.metadata = { ...existing.metadata, ...options.metadata };
      existing.enabled = true;
      return existing;
    }

    const entry: BlacklistEntry = {
      id: this.generateId(),
      type,
      value: normalizedValue,
      reason: options?.reason,
      source: options?.source,
      riskLevel: options?.riskLevel || RiskLevel.CRITICAL,
      createdAt: new Date(),
      expiresAt: options?.expiresAt,
      enabled: true,
      metadata: options?.metadata,
    };

    map?.set(normalizedValue, entry);
    return entry;
  }

  /**
   * 批量添加到黑名单
   * @param type 类型
   * @param values 值列表
   */
  batchAddToBlacklist(
    type: BlacklistType,
    values: Array<{
      value: string;
      reason?: string;
      source?: string;
      riskLevel?: RiskLevel;
      expiresAt?: Date;
      metadata?: Record<string, unknown>;
    }>
  ): ImportResult {
    const result: ImportResult = {
      successCount: 0,
      failedCount: 0,
      skippedCount: 0,
      failures: [],
    };

    for (const item of values) {
      try {
        const map = this.blacklist.get(type);
        const normalizedValue = this.normalizeValue(item.value);

        if (map?.has(normalizedValue)) {
          result.skippedCount++;
        } else {
          result.successCount++;
        }

        this.addToBlacklist(type, item.value, {
          reason: item.reason,
          source: item.source,
          riskLevel: item.riskLevel,
          expiresAt: item.expiresAt,
          metadata: item.metadata,
        });
      } catch (error) {
        result.failedCount++;
        result.failures.push({
          value: item.value,
          reason: error instanceof Error ? error.message : '未知错误',
        });
      }
    }

    return result;
  }

  /**
   * 从黑名单移除
   * @param type 类型
   * @param value 值
   */
  removeFromBlacklist(type: BlacklistType, value: string): boolean {
    const normalizedValue = this.normalizeValue(value);
    const map = this.blacklist.get(type);
    return map?.delete(normalizedValue) || false;
  }

  /**
   * 检查是否在黑名单中
   * @param type 类型
   * @param value 值
   */
  isInBlacklist(type: BlacklistType, value: string): {
    inBlacklist: boolean;
    entry?: BlacklistEntry;
  } {
    const normalizedValue = this.normalizeValue(value);
    const map = this.blacklist.get(type);
    const entry = map?.get(normalizedValue);

    if (entry && entry.enabled) {
      if (entry.expiresAt && entry.expiresAt < new Date()) {
        return { inBlacklist: false };
      }
      return { inBlacklist: true, entry };
    }

    return { inBlacklist: false };
  }

  /**
   * 检查地址是否在黑名单中
   */
  isAddressBlacklisted(address: string): boolean {
    return this.isInBlacklist(BlacklistType.ADDRESS, address).inBlacklist;
  }

  /**
   * 检查合约是否在黑名单中
   */
  isContractBlacklisted(contractAddress: string): boolean {
    return this.isInBlacklist(BlacklistType.CONTRACT, contractAddress).inBlacklist;
  }

  /**
   * 检查域名是否在黑名单中
   */
  isDomainBlacklisted(domain: string): boolean {
    return this.isInBlacklist(BlacklistType.DOMAIN, domain).inBlacklist;
  }

  // Legacy compatibility helpers for existing tests and callers.
  addAddress(address: string): void {
    this.addToBlacklist(BlacklistType.ADDRESS, address);
  }

  addAddresses(addresses: string[]): void {
    this.batchAddToBlacklist(
      BlacklistType.ADDRESS,
      addresses.map((value) => ({ value }))
    );
  }

  removeAddress(address: string): boolean {
    return this.removeFromBlacklist(BlacklistType.ADDRESS, address);
  }

  getBlacklistedAddresses(): string[] {
    return this.getBlacklist(BlacklistType.ADDRESS).map((item) => item.value);
  }

  clearAddresses(): void {
    this.clearBlacklist(BlacklistType.ADDRESS);
  }

  addContract(contractAddress: string): void {
    this.addToBlacklist(BlacklistType.CONTRACT, contractAddress);
  }

  addContracts(contractAddresses: string[]): void {
    this.batchAddToBlacklist(
      BlacklistType.CONTRACT,
      contractAddresses.map((value) => ({ value }))
    );
  }

  removeContract(contractAddress: string): boolean {
    return this.removeFromBlacklist(BlacklistType.CONTRACT, contractAddress);
  }

  getBlacklistedContracts(): string[] {
    return this.getBlacklist(BlacklistType.CONTRACT).map((item) => item.value);
  }

  clearContracts(): void {
    this.clearBlacklist(BlacklistType.CONTRACT);
  }

  addDomain(domain: string): void {
    this.addToBlacklist(BlacklistType.DOMAIN, domain);
  }

  addDomains(domains: string[]): void {
    this.batchAddToBlacklist(
      BlacklistType.DOMAIN,
      domains.map((value) => ({ value }))
    );
  }

  removeDomain(domain: string): boolean {
    return this.removeFromBlacklist(BlacklistType.DOMAIN, domain);
  }

  getBlacklistedDomains(): string[] {
    return this.getBlacklist(BlacklistType.DOMAIN).map((item) => item.value);
  }

  clearDomains(): void {
    this.clearBlacklist(BlacklistType.DOMAIN);
  }

  addWhitelistAddress(address: string): void {
    this.addToWhitelist(BlacklistType.ADDRESS, address);
  }

  addWhitelistAddresses(addresses: string[]): void {
    this.batchAddToWhitelist(
      BlacklistType.ADDRESS,
      addresses.map((value) => ({ value }))
    );
  }

  removeWhitelistAddress(address: string): boolean {
    return this.removeFromWhitelist(BlacklistType.ADDRESS, address);
  }

  isAddressWhitelisted(address: string): boolean {
    return this.isInWhitelist(BlacklistType.ADDRESS, address).inWhitelist;
  }

  importBlacklist(data: {
    addresses?: string[];
    contracts?: string[];
    domains?: string[];
  }): void {
    if (data.addresses && data.addresses.length > 0) {
      this.addAddresses(data.addresses);
    }
    if (data.contracts && data.contracts.length > 0) {
      this.addContracts(data.contracts);
    }
    if (data.domains && data.domains.length > 0) {
      this.addDomains(data.domains);
    }
  }

  exportBlacklist(): {
    addresses: string[];
    contracts: string[];
    domains: string[];
  } {
    return {
      addresses: this.getBlacklistedAddresses(),
      contracts: this.getBlacklistedContracts(),
      domains: this.getBlacklistedDomains(),
    };
  }

  getStats(): {
    blacklistedAddresses: number;
    blacklistedContracts: number;
    blacklistedDomains: number;
    whitelistedAddresses: number;
  } {
    return {
      blacklistedAddresses: this.getBlacklistCount(BlacklistType.ADDRESS),
      blacklistedContracts: this.getBlacklistCount(BlacklistType.CONTRACT),
      blacklistedDomains: this.getBlacklistCount(BlacklistType.DOMAIN),
      whitelistedAddresses: this.getWhitelistCount(BlacklistType.ADDRESS),
    };
  }

  save(): void {
    // Intentionally no-op for test compatibility in non-browser runtime.
  }

  load(): void {
    // Intentionally no-op for test compatibility in non-browser runtime.
  }

  /**
   * 获取黑名单列表
   * @param type 类型
   * @param includeDisabled 是否包含已禁用的
   */
  getBlacklist(type: BlacklistType, includeDisabled = false): BlacklistEntry[] {
    const map = this.blacklist.get(type);
    if (!map) return [];

    const entries = Array.from(map.values());
    if (!includeDisabled) {
      return entries.filter((e) => e.enabled);
    }
    return entries;
  }

  /**
   * 启用/禁用黑名单条目
   * @param type 类型
   * @param value 值
   * @param enabled 是否启用
   */
  setBlacklistEnabled(type: BlacklistType, value: string, enabled: boolean): boolean {
    const normalizedValue = this.normalizeValue(value);
    const map = this.blacklist.get(type);
    const entry = map?.get(normalizedValue);

    if (entry) {
      entry.enabled = enabled;
      return true;
    }
    return false;
  }

  /**
   * 获取黑名单条目数量
   * @param type 类型
   * @param includeDisabled 是否包含已禁用的
   */
  getBlacklistCount(type: BlacklistType, includeDisabled = false): number {
    const entries = this.getBlacklist(type, includeDisabled);
    return entries.length;
  }

  /**
   * 清空指定类型的黑名单
   * @param type 类型
   */
  clearBlacklist(type: BlacklistType): void {
    const map = this.blacklist.get(type);
    map?.clear();
  }

  /**
   * 清空所有黑名单
   */
  clearAllBlacklists(): void {
    for (const type of Object.values(BlacklistType)) {
      this.clearBlacklist(type);
    }
  }

  // ============================================================
  // 白名单操作
  // ============================================================

  /**
   * 添加白名单条目
   * @param type 类型
   * @param value 值（地址/合约/域名）
   * @param options 选项
   */
  addToWhitelist(
    type: BlacklistType,
    value: string,
    options?: {
      remark?: string;
      source?: string;
      expiresAt?: Date;
      metadata?: Record<string, unknown>;
    }
  ): WhitelistEntry {
    const normalizedValue = this.normalizeValue(value);
    const map = this.whitelist.get(type);

    const existing = map?.get(normalizedValue);
    if (existing) {
      if (options?.remark) existing.remark = options.remark;
      if (options?.source) existing.source = options.source;
      if (options?.expiresAt) existing.expiresAt = options.expiresAt;
      if (options?.metadata) existing.metadata = { ...existing.metadata, ...options.metadata };
      existing.enabled = true;
      return existing;
    }

    const entry: WhitelistEntry = {
      id: this.generateId(),
      type,
      value: normalizedValue,
      remark: options?.remark,
      source: options?.source,
      createdAt: new Date(),
      expiresAt: options?.expiresAt,
      enabled: true,
      metadata: options?.metadata,
    };

    map?.set(normalizedValue, entry);
    return entry;
  }

  /**
   * 批量添加到白名单
   * @param type 类型
   * @param values 值列表
   */
  batchAddToWhitelist(
    type: BlacklistType,
    values: Array<{
      value: string;
      remark?: string;
      source?: string;
      expiresAt?: Date;
      metadata?: Record<string, unknown>;
    }>
  ): ImportResult {
    const result: ImportResult = {
      successCount: 0,
      failedCount: 0,
      skippedCount: 0,
      failures: [],
    };

    for (const item of values) {
      try {
        const map = this.whitelist.get(type);
        const normalizedValue = this.normalizeValue(item.value);

        if (map?.has(normalizedValue)) {
          result.skippedCount++;
        } else {
          result.successCount++;
        }

        this.addToWhitelist(type, item.value, {
          remark: item.remark,
          source: item.source,
          expiresAt: item.expiresAt,
          metadata: item.metadata,
        });
      } catch (error) {
        result.failedCount++;
        result.failures.push({
          value: item.value,
          reason: error instanceof Error ? error.message : '未知错误',
        });
      }
    }

    return result;
  }

  /**
   * 从白名单移除
   * @param type 类型
   * @param value 值
   */
  removeFromWhitelist(type: BlacklistType, value: string): boolean {
    const normalizedValue = this.normalizeValue(value);
    const map = this.whitelist.get(type);
    return map?.delete(normalizedValue) || false;
  }

  /**
   * 检查是否在白名单中
   * @param type 类型
   * @param value 值
   */
  isInWhitelist(type: BlacklistType, value: string): {
    inWhitelist: boolean;
    entry?: WhitelistEntry;
  } {
    const normalizedValue = this.normalizeValue(value);
    const map = this.whitelist.get(type);
    const entry = map?.get(normalizedValue);

    if (entry && entry.enabled) {
      if (entry.expiresAt && entry.expiresAt < new Date()) {
        return { inWhitelist: false };
      }
      return { inWhitelist: true, entry };
    }

    return { inWhitelist: false };
  }

  /**
   * 获取白名单列表
   * @param type 类型
   * @param includeDisabled 是否包含已禁用的
   */
  getWhitelist(type: BlacklistType, includeDisabled = false): WhitelistEntry[] {
    const map = this.whitelist.get(type);
    if (!map) return [];

    const entries = Array.from(map.values());
    if (!includeDisabled) {
      return entries.filter((e) => e.enabled);
    }
    return entries;
  }

  /**
   * 启用/禁用白名单条目
   * @param type 类型
   * @param value 值
   * @param enabled 是否启用
   */
  setWhitelistEnabled(type: BlacklistType, value: string, enabled: boolean): boolean {
    const normalizedValue = this.normalizeValue(value);
    const map = this.whitelist.get(type);
    const entry = map?.get(normalizedValue);

    if (entry) {
      entry.enabled = enabled;
      return true;
    }
    return false;
  }

  /**
   * 获取白名单条目数量
   * @param type 类型
   * @param includeDisabled 是否包含已禁用的
   */
  getWhitelistCount(type: BlacklistType, includeDisabled = false): number {
    const entries = this.getWhitelist(type, includeDisabled);
    return entries.length;
  }

  /**
   * 清空指定类型的白名单
   * @param type 类型
   */
  clearWhitelist(type: BlacklistType): void {
    const map = this.whitelist.get(type);
    map?.clear();
  }

  /**
   * 清空所有白名单
   */
  clearAllWhitelists(): void {
    for (const type of Object.values(BlacklistType)) {
      this.clearWhitelist(type);
    }
  }

  // ============================================================
  // 导入导出
  // ============================================================

  /**
   * 从 JSON 导入黑名单
   * @param type 类型
   * @param json JSON 数据
   */
  importBlacklistFromJSON(type: BlacklistType, json: string): ImportResult {
    const data = safeJsonParse<unknown>(json, {
      context: 'blacklist-import',
      maxBytes: 5 * 1024 * 1024,
      silent: true,
      defaultValue: null,
    });
    if (data === null) {
      return {
        successCount: 0,
        failedCount: 1,
        skippedCount: 0,
        failures: [{ value: 'N/A', reason: 'JSON 解析失败' }],
      };
    }
    try {
      const items: Array<{
        value: string;
        reason?: string;
        source?: string;
        riskLevel?: RiskLevel;
      }> = Array.isArray(data) ? data : (data as any).items || [];

      return this.batchAddToBlacklist(
        type,
        items.map((item) => ({
          value: item.value,
          reason: item.reason,
          source: item.source,
          riskLevel: item.riskLevel,
        }))
      );
    } catch (error) {
      return {
        successCount: 0,
        failedCount: 1,
        skippedCount: 0,
        failures: [{ value: 'N/A', reason: `JSON 解析失败: ${error}` }],
      };
    }
  }

  /**
   * 导出黑名单为 JSON
   * @param type 类型
   */
  exportBlacklistToJSON(type: BlacklistType): string {
    const entries = this.getBlacklist(type);
    return JSON.stringify(entries, null, 2);
  }

  /**
   * 从纯文本导入黑名单（每行一个值）
   * @param type 类型
   * @param text 文本内容
   * @param defaultReason 默认原因
   */
  importBlacklistFromText(
    type: BlacklistType,
    text: string,
    defaultReason = '批量导入'
  ): ImportResult {
    const lines = text
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0 && !line.startsWith('#'));

    const items = lines.map((line) => ({
      value: line,
      reason: defaultReason,
    }));

    return this.batchAddToBlacklist(type, items);
  }

  /**
   * 导出黑名单为纯文本
   * @param type 类型
   */
  exportBlacklistToText(type: BlacklistType): string {
    const entries = this.getBlacklist(type);
    return entries.map((e) => e.value).join('\n');
  }

  /**
   * 从 JSON 导入白名单
   * @param type 类型
   * @param json JSON 数据
   */
  importWhitelistFromJSON(type: BlacklistType, json: string): ImportResult {
    const data = safeJsonParse<unknown>(json, {
      context: 'whitelist-import',
      maxBytes: 5 * 1024 * 1024,
      silent: true,
      defaultValue: null,
    });
    if (data === null) {
      return {
        successCount: 0,
        failedCount: 1,
        skippedCount: 0,
        failures: [{ value: 'N/A', reason: 'JSON 解析失败' }],
      };
    }
    try {
      const items: Array<{
        value: string;
        remark?: string;
        source?: string;
      }> = Array.isArray(data) ? data : (data as any).items || [];

      return this.batchAddToWhitelist(
        type,
        items.map((item) => ({
          value: item.value,
          remark: item.remark,
          source: item.source,
        }))
      );
    } catch (error) {
      return {
        successCount: 0,
        failedCount: 1,
        skippedCount: 0,
        failures: [{ value: 'N/A', reason: `JSON 解析失败: ${error}` }],
      };
    }
  }

  /**
   * 导出白名单为 JSON
   * @param type 类型
   */
  exportWhitelistToJSON(type: BlacklistType): string {
    const entries = this.getWhitelist(type);
    return JSON.stringify(entries, null, 2);
  }

  // ============================================================
  // 工具方法
  // ============================================================

  /**
   * 清理过期的条目
   */
  cleanupExpired(): { blacklistRemoved: number; whitelistRemoved: number } {
    let blacklistRemoved = 0;
    let whitelistRemoved = 0;
    const now = new Date();

    for (const type of Object.values(BlacklistType)) {
      const blacklistMap = this.blacklist.get(type);
      if (blacklistMap) {
        for (const [value, entry] of blacklistMap) {
          if (entry.expiresAt && entry.expiresAt < now) {
            blacklistMap.delete(value);
            blacklistRemoved++;
          }
        }
      }

      const whitelistMap = this.whitelist.get(type);
      if (whitelistMap) {
        for (const [value, entry] of whitelistMap) {
          if (entry.expiresAt && entry.expiresAt < now) {
            whitelistMap.delete(value);
            whitelistRemoved++;
          }
        }
      }
    }

    return { blacklistRemoved, whitelistRemoved };
  }

  /**
   * 获取统计信息
   */
  getStatistics(): {
    blacklist: Record<BlacklistType, number>;
    whitelist: Record<BlacklistType, number>;
    total: number;
  } {
    const blacklistStats = {} as Record<BlacklistType, number>;
    const whitelistStats = {} as Record<BlacklistType, number>;
    let total = 0;

    for (const type of Object.values(BlacklistType)) {
      blacklistStats[type] = this.getBlacklistCount(type);
      whitelistStats[type] = this.getWhitelistCount(type);
      total += blacklistStats[type] + whitelistStats[type];
    }

    return {
      blacklist: blacklistStats,
      whitelist: whitelistStats,
      total,
    };
  }

  /**
   * 检查值是否在白名单中（优先白名单）
   * @param type 类型
   * @param value 值
   */
  checkValue(type: BlacklistType, value: string): {
    status: 'whitelisted' | 'blacklisted' | 'unknown';
    entry?: BlacklistEntry | WhitelistEntry;
  } {
    const whitelistResult = this.isInWhitelist(type, value);
    if (whitelistResult.inWhitelist) {
      return { status: 'whitelisted', entry: whitelistResult.entry };
    }

    const blacklistResult = this.isInBlacklist(type, value);
    if (blacklistResult.inBlacklist) {
      return { status: 'blacklisted', entry: blacklistResult.entry };
    }

    return { status: 'unknown' };
  }
}

export const blacklistService = new BlacklistService();
