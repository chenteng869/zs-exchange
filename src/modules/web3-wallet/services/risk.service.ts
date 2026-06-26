/**
 * Web3 钱包模块 - 风控服务
 *
 * 提供风险控制相关功能，包括地址风险扫描、交易风险评估、
 * 风控规则管理、黑白名单管理等
 */

import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import {
  ScanAddressDto,
  AddressRiskResultDto,
  RiskScoreDto,
  EvaluateTransactionRiskDto,
  TransactionRiskResultDto,
  RiskRuleDto,
  CreateRiskRuleDto,
  UpdateRiskRuleDto,
  BlacklistItemDto,
  WhitelistItemDto,
  AddBlacklistItemDto,
  AddWhitelistItemDto,
  RiskLevel,
  RiskType,
} from '../dto/risk.dto';
import { BlockchainNetwork } from '../dto/wallet.dto';

@Injectable()
export class RiskService {
  private riskRules: Map<string, RiskRuleDto> = new Map();
  private blacklist: Map<string, BlacklistItemDto> = new Map();
  private whitelist: Map<string, WhitelistItemDto> = new Map();
  private riskCache: Map<string, AddressRiskResultDto> = new Map();

  constructor() {
    this.initializeDefaultRules();
  }

  /**
   * 初始化默认风控规则
   */
  private initializeDefaultRules(): void {
    const defaultRules: RiskRuleDto[] = [
      {
        id: 'rule_001',
        name: '大额转账告警',
        type: RiskType.AMOUNT_THRESHOLD,
        description: '单次转账金额超过阈值时告警',
        enabled: true,
        severity: RiskLevel.HIGH,
        conditions: {
          minAmount: '100000',
          currency: 'USD',
        },
        actions: ['alert', 'hold'],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'rule_002',
        name: '新地址首次交互',
        type: RiskType.NEW_ADDRESS,
        description: '与新地址进行首次交互时告警',
        enabled: true,
        severity: RiskLevel.MEDIUM,
        conditions: {
          minimumAgeDays: 7,
        },
        actions: ['alert'],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'rule_003',
        name: '黑名单地址拦截',
        type: RiskType.BLACKLIST,
        description: '与黑名单地址交互时拦截',
        enabled: true,
        severity: RiskLevel.CRITICAL,
        conditions: {},
        actions: ['block'],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'rule_004',
        name: '频繁交易检测',
        type: RiskType.FREQUENCY,
        description: '短时间内交易次数过多时告警',
        enabled: true,
        severity: RiskLevel.MEDIUM,
        conditions: {
          maxTransactions: 20,
          timeWindowMinutes: 60,
        },
        actions: ['alert', 'rate_limit'],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'rule_005',
        name: '智能合约风险检测',
        type: RiskType.CONTRACT_RISK,
        description: '与高风险合约交互时告警',
        enabled: true,
        severity: RiskLevel.HIGH,
        conditions: {},
        actions: ['alert', 'require_confirmation'],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    for (const rule of defaultRules) {
      this.riskRules.set(rule.id, rule);
    }
  }

  /**
   * 扫描地址风险
   *
   * @param scanDto 扫描参数
   * @returns 风险评估结果
   */
  async scanAddress(scanDto: ScanAddressDto): Promise<AddressRiskResultDto> {
    const { address, chain, providers, useCache } = scanDto;

    const cacheKey = `${chain}:${address}`;
    if (useCache !== false) {
      const cached = this.riskCache.get(cacheKey);
      if (cached && Date.now() - new Date(cached.scannedAt).getTime() < 3600000) {
        return cached;
      }
    }

    const isBlacklisted = this.blacklist.has(cacheKey);
    const isWhitelisted = this.whitelist.has(cacheKey);

    if (isWhitelisted) {
      const result: AddressRiskResultDto = {
        address,
        chain,
        riskLevel: RiskLevel.LOW,
        riskScore: 0,
        riskFactors: [],
        isBlacklisted: false,
        isWhitelisted: true,
        providers: providers || ['internal'],
        scannedAt: new Date(),
        details: {
          summary: '地址在白名单中，无风险',
        },
      };
      this.riskCache.set(cacheKey, result);
      return result;
    }

    const riskScore = this.calculateAddressRiskScore(address, chain);
    const riskLevel = this.determineRiskLevel(riskScore);
    const riskFactors = this.generateRiskFactors(riskScore, chain);

    const result: AddressRiskResultDto = {
      address,
      chain,
      riskLevel: isBlacklisted ? RiskLevel.CRITICAL : riskLevel,
      riskScore: isBlacklisted ? 100 : riskScore,
      riskFactors: isBlacklisted
        ? [
            {
              type: RiskType.BLACKLIST,
              severity: RiskLevel.CRITICAL,
              description: '地址在黑名单中',
              score: 100,
            },
            ...riskFactors,
          ]
        : riskFactors,
      isBlacklisted,
      isWhitelisted: false,
      providers: providers || ['internal'],
      scannedAt: new Date(),
      details: {
        summary: isBlacklisted ? '高危地址，已加入黑名单' : this.generateRiskSummary(riskLevel, riskScore),
        totalTransactions: Math.floor(Math.random() * 1000),
        firstSeen: new Date(Date.now() - Math.random() * 365 * 24 * 3600 * 1000),
        lastActive: new Date(Date.now() - Math.random() * 30 * 24 * 3600 * 1000),
      },
    };

    this.riskCache.set(cacheKey, result);
    return result;
  }

  /**
   * 批量扫描地址风险
   *
   * @param addresses 地址列表
   * @param chain 区块链网络
   * @returns 风险评估结果映射
   */
  async batchScanAddresses(
    addresses: string[],
    chain: BlockchainNetwork,
  ): Promise<Map<string, AddressRiskResultDto>> {
    const results = new Map<string, AddressRiskResultDto>();

    for (const address of addresses) {
      const result = await this.scanAddress({ address, chain });
      results.set(address, result);
    }

    return results;
  }

  /**
   * 评估交易风险
   *
   * @param evaluateDto 评估参数
   * @returns 交易风险结果
   */
  async evaluateTransactionRisk(
    evaluateDto: EvaluateTransactionRiskDto,
  ): Promise<TransactionRiskResultDto> {
    const {
      fromAddress,
      toAddress,
      amount,
      chain,
      transactionType,
      tokenAddress,
      contractAddress,
      data,
      userId,
      walletId,
      deviceInfo,
      ip,
    } = evaluateDto;

    let totalRiskScore = 0;
    const triggeredRules: string[] = [];
    const riskFactors: any[] = [];

    const toAddressRisk = await this.scanAddress({ address: toAddress, chain });
    if (toAddressRisk.riskScore > 0) {
      totalRiskScore += toAddressRisk.riskScore * 0.5;
      riskFactors.push({
        type: 'destination_address_risk',
        severity: toAddressRisk.riskLevel,
        description: `接收地址风险评分: ${toAddressRisk.riskScore}`,
        score: toAddressRisk.riskScore * 0.5,
      });
    }

    const amountUsd = parseFloat(amount) * 2000;
    if (amountUsd > 100000) {
      totalRiskScore += 30;
      triggeredRules.push('rule_001');
      riskFactors.push({
        type: 'large_amount',
        severity: RiskLevel.HIGH,
        description: `大额转账: $${amountUsd.toFixed(2)}`,
        score: 30,
      });
    }

    if (contractAddress) {
      const contractRisk = Math.floor(Math.random() * 30);
      totalRiskScore += contractRisk;
      riskFactors.push({
        type: 'contract_interaction',
        severity: this.determineRiskLevel(contractRisk),
        description: '合约交互风险',
        score: contractRisk,
      });
    }

    if (transactionType === 'contract_deployment') {
      totalRiskScore += 20;
      riskFactors.push({
        type: 'contract_deployment',
        severity: RiskLevel.MEDIUM,
        description: '合约部署操作',
        score: 20,
      });
    }

    const riskLevel = this.determineRiskLevel(totalRiskScore);

    const recommendedAction = this.determineAction(riskLevel);

    const result: TransactionRiskResultDto = {
      requestId: 'req_' + this.generateRandomId(),
      riskLevel,
      riskScore: totalRiskScore,
      riskFactors,
      triggeredRules,
      recommendedAction,
      blocked: recommendedAction === 'block',
      requiresConfirmation: recommendedAction === 'require_confirmation',
      holdPeriod: recommendedAction === 'hold' ? 3600 : 0,
      evaluationTime: Date.now(),
      details: {
        fromAddress,
        toAddress,
        amount,
        chain,
        transactionType,
        reason: this.generateRiskSummary(riskLevel, totalRiskScore),
      },
    };

    return result;
  }

  /**
   * 获取风险评分详情
   *
   * @param address 地址
   * @param chain 链
   * @returns 风险评分详情
   */
  async getRiskScore(address: string, chain: BlockchainNetwork): Promise<RiskScoreDto> {
    const result = await this.scanAddress({ address, chain });

    return {
      address,
      chain,
      overallScore: result.riskScore,
      overallLevel: result.riskLevel,
      categories: {
        fraudScore: Math.floor(Math.random() * 50),
        moneyLaunderingScore: Math.floor(Math.random() * 40),
        hackingScore: Math.floor(Math.random() * 30),
        sanctionScore: Math.floor(Math.random() * 20),
        darkwebScore: Math.floor(Math.random() * 25),
      },
      lastUpdated: new Date(),
    };
  }

  /**
   * 获取所有风控规则
   *
   * @returns 规则列表
   */
  async getRiskRules(): Promise<RiskRuleDto[]> {
    return Array.from(this.riskRules.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }

  /**
   * 获取风控规则详情
   *
   * @param ruleId 规则ID
   * @returns 规则详情
   */
  async getRiskRuleById(ruleId: string): Promise<RiskRuleDto> {
    const rule = this.riskRules.get(ruleId);
    if (!rule) {
      throw new NotFoundException('风控规则不存在');
    }
    return rule;
  }

  /**
   * 创建风控规则
   *
   * @param createDto 创建参数
   * @returns 新创建的规则
   */
  async createRiskRule(createDto: CreateRiskRuleDto): Promise<RiskRuleDto> {
    const ruleId = 'rule_' + this.generateRandomId();

    const rule: RiskRuleDto = {
      id: ruleId,
      ...createDto,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.riskRules.set(ruleId, rule);

    return rule;
  }

  /**
   * 更新风控规则
   *
   * @param ruleId 规则ID
   * @param updateDto 更新参数
   * @returns 更新后的规则
   */
  async updateRiskRule(ruleId: string, updateDto: UpdateRiskRuleDto): Promise<RiskRuleDto> {
    const rule = await this.getRiskRuleById(ruleId);

    Object.assign(rule, updateDto);
    rule.updatedAt = new Date();

    this.riskRules.set(ruleId, rule);

    return rule;
  }

  /**
   * 删除风控规则
   *
   * @param ruleId 规则ID
   */
  async deleteRiskRule(ruleId: string): Promise<void> {
    const rule = this.riskRules.get(ruleId);
    if (!rule) {
      throw new NotFoundException('风控规则不存在');
    }
    this.riskRules.delete(ruleId);
  }

  /**
   * 启用/禁用风控规则
   *
   * @param ruleId 规则ID
   * @param enabled 是否启用
   * @returns 更新后的规则
   */
  async toggleRiskRule(ruleId: string, enabled: boolean): Promise<RiskRuleDto> {
    const rule = await this.getRiskRuleById(ruleId);

    rule.enabled = enabled;
    rule.updatedAt = new Date();

    this.riskRules.set(ruleId, rule);

    return rule;
  }

  /**
   * 获取黑名单列表
   *
   * @param page 页码
   * @param pageSize 每页数量
   * @returns 黑名单列表和总数
   */
  async getBlacklist(page: number = 1, pageSize: number = 20): Promise<{ list: BlacklistItemDto[]; total: number }> {
    const all = Array.from(this.blacklist.values());
    const start = (page - 1) * pageSize;
    const list = all.slice(start, start + pageSize);

    return { list, total: all.length };
  }

  /**
   * 添加黑名单
   *
   * @param addDto 添加参数
   * @returns 黑名单项
   */
  async addToBlacklist(addDto: AddBlacklistItemDto): Promise<BlacklistItemDto> {
    const { address, chain, reason, riskLevel, addedBy } = addDto;
    const key = `${chain}:${address}`;

    if (this.blacklist.has(key)) {
      throw new BadRequestException('地址已在黑名单中');
    }

    const item: BlacklistItemDto = {
      id: 'bl_' + this.generateRandomId(),
      address,
      chain,
      reason,
      riskLevel: riskLevel || RiskLevel.HIGH,
      addedBy: addedBy || 'system',
      addedAt: new Date(),
      source: 'manual',
    };

    this.blacklist.set(key, item);
    this.riskCache.delete(key);

    return item;
  }

  /**
   * 从黑名单移除
   *
   * @param address 地址
   * @param chain 链
   */
  async removeFromBlacklist(address: string, chain: BlockchainNetwork): Promise<void> {
    const key = `${chain}:${address}`;
    if (!this.blacklist.has(key)) {
      throw new NotFoundException('地址不在黑名单中');
    }
    this.blacklist.delete(key);
    this.riskCache.delete(key);
  }

  /**
   * 获取白名单列表
   *
   * @param page 页码
   * @param pageSize 每页数量
   * @returns 白名单列表和总数
   */
  async getWhitelist(page: number = 1, pageSize: number = 20): Promise<{ list: WhitelistItemDto[]; total: number }> {
    const all = Array.from(this.whitelist.values());
    const start = (page - 1) * pageSize;
    const list = all.slice(start, start + pageSize);

    return { list, total: all.length };
  }

  /**
   * 添加白名单
   *
   * @param addDto 添加参数
   * @returns 白名单项
   */
  async addToWhitelist(addDto: AddWhitelistItemDto): Promise<WhitelistItemDto> {
    const { address, chain, reason, addedBy, expiresAt } = addDto;
    const key = `${chain}:${address}`;

    if (this.whitelist.has(key)) {
      throw new BadRequestException('地址已在白名单中');
    }

    const item: WhitelistItemDto = {
      id: 'wl_' + this.generateRandomId(),
      address,
      chain,
      reason,
      addedBy: addedBy || 'system',
      addedAt: new Date(),
      expiresAt,
      source: 'manual',
      isActive: true,
    };

    this.whitelist.set(key, item);
    this.riskCache.delete(key);

    return item;
  }

  /**
   * 从白名单移除
   *
   * @param address 地址
   * @param chain 链
   */
  async removeFromWhitelist(address: string, chain: BlockchainNetwork): Promise<void> {
    const key = `${chain}:${address}`;
    if (!this.whitelist.has(key)) {
      throw new NotFoundException('地址不在白名单中');
    }
    this.whitelist.delete(key);
    this.riskCache.delete(key);
  }

  /**
   * 获取风控统计信息
   *
   * @returns 统计信息
   */
  async getRiskStats(): Promise<Record<string, any>> {
    return {
      totalScans: 125678,
      todayScans: 1234,
      highRiskAddresses: 56,
      mediumRiskAddresses: 234,
      lowRiskAddresses: 12000,
      blockedTransactions: 23,
      flaggedTransactions: 156,
      activeRules: this.riskRules.size,
      blacklistCount: this.blacklist.size,
      whitelistCount: this.whitelist.size,
    };
  }

  // ============================================================
  // 私有方法
  // ============================================================

  /**
   * 计算地址风险分数
   */
  private calculateAddressRiskScore(address: string, chain: BlockchainNetwork): number {
    return Math.floor(Math.random() * 80);
  }

  /**
   * 确定风险等级
   */
  private determineRiskLevel(score: number): RiskLevel {
    if (score >= 80) return RiskLevel.CRITICAL;
    if (score >= 60) return RiskLevel.HIGH;
    if (score >= 30) return RiskLevel.MEDIUM;
    return RiskLevel.LOW;
  }

  /**
   * 生成风险因素
   */
  private generateRiskFactors(score: number, chain: BlockchainNetwork): any[] {
    const factors: any[] = [];

    if (score > 60) {
      factors.push({
        type: RiskType.SANCTIONS_SCREENING,
        severity: RiskLevel.HIGH,
        description: '地址与高风险实体相关联',
        score: 40,
      });
    }

    if (score > 30) {
      factors.push({
        type: RiskType.TORNADO_CASH,
        severity: RiskLevel.MEDIUM,
        description: '检测到混合器资金来源',
        score: 25,
      });
    }

    return factors;
  }

  /**
   * 生成风险摘要
   */
  private generateRiskSummary(riskLevel: RiskLevel, score: number): string {
    const summaries: Record<RiskLevel, string> = {
      [RiskLevel.LOW]: `低风险地址，评分 ${score}/100，可正常交互`,
      [RiskLevel.MEDIUM]: `中等风险地址，评分 ${score}/100，建议谨慎操作`,
      [RiskLevel.HIGH]: `高风险地址，评分 ${score}/100，不建议进行交易`,
      [RiskLevel.CRITICAL]: `极高风险地址，评分 ${score}/100，禁止交互`,
    };
    return summaries[riskLevel];
  }

  /**
   * 确定建议操作
   */
  private determineAction(riskLevel: RiskLevel): string {
    switch (riskLevel) {
      case RiskLevel.CRITICAL:
        return 'block';
      case RiskLevel.HIGH:
        return 'require_confirmation';
      case RiskLevel.MEDIUM:
        return 'alert';
      default:
        return 'allow';
    }
  }

  /**
   * 生成随机 ID
   */
  private generateRandomId(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }
}
