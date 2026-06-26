import {
  KeyRiskAssessment,
  SignType,
  ChainType,
  RiskRuleConfig,
  RiskScoreWeights,
  LargeAmountThreshold,
} from './key.types';

export interface KeyRiskContext {
  walletId: string;
  userId: string;
  address: string;
  chainType: ChainType;
  signType: SignType;
  payload?: unknown;
  toAddress?: string;
  amount?: string;
  contractAddress?: string;
  dappDomain?: string;
  deviceId?: string;
  ipAddress?: string;
  userAgent?: string;
  isNewDevice?: boolean;
  isAbnormalLocation?: boolean;
}

export class KeyRiskService {
  private readonly riskRules: KeyRiskRule[] = [];
  private ruleConfigs: Map<string, RiskRuleConfig> = new Map();
  private blacklistAddresses: Set<string> = new Set();
  private blacklistContracts: Set<string> = new Set();
  private phishingDomains: Set<string> = new Set();
  private whitelistAddresses: Set<string> = new Set();
  private largeAmountThresholds: LargeAmountThreshold = {
    evm: '1000',
    solana: '100',
    bitcoin: '1',
    tron: '100000',
  };
  private scoreWeights: RiskScoreWeights = {
    amountRisk: 0.25,
    addressRisk: 0.25,
    contractRisk: 0.2,
    deviceRisk: 0.15,
    locationRisk: 0.1,
    behaviorRisk: 0.05,
  };
  private newAddressThreshold: number = 0;
  private dailyTransactionLimit: number = 100;
  private hourlyTransactionLimit: number = 10;
  private userTransactionHistory: Map<string, Array<{ timestamp: Date; amount: string; toAddress: string }>> = new Map();

  constructor() {
    this.registerDefaultRules();
  }

  registerRule(rule: KeyRiskRule): void {
    this.riskRules.push(rule);
  }

  registerRules(rules: KeyRiskRule[]): void {
    this.riskRules.push(...rules);
  }

  /**
   * 配置风控规则
   */
  configureRule(config: RiskRuleConfig): void {
    this.ruleConfigs.set(config.ruleCode, config);

    const rule = this.riskRules.find((r) => r.ruleCode === config.ruleCode);
    if (rule) {
      rule.enabled = config.enabled;
      if (config.action && rule.parameters) {
        rule.parameters.action = config.action;
      }
      if (config.threshold !== undefined && rule.parameters) {
        rule.parameters.threshold = config.threshold;
      }
      if (config.parameters && rule.parameters) {
        Object.assign(rule.parameters, config.parameters);
      }
    }
  }

  /**
   * 批量配置风控规则
   */
  configureRules(configs: RiskRuleConfig[]): void {
    configs.forEach((config) => this.configureRule(config));
  }

  /**
   * 获取所有规则配置
   */
  getRuleConfigs(): RiskRuleConfig[] {
    return this.riskRules.map((rule) => ({
      ruleCode: rule.ruleCode,
      enabled: rule.enabled !== false,
      action: rule.parameters?.action as RiskRuleConfig['action'],
      threshold: rule.parameters?.threshold as number,
      parameters: rule.parameters,
    }));
  }

  /**
   * 启用/禁用指定规则
   */
  setRuleEnabled(ruleCode: string, enabled: boolean): void {
    const rule = this.riskRules.find((r) => r.ruleCode === ruleCode);
    if (rule) {
      rule.enabled = enabled;
    }
  }

  /**
   * 添加黑名单地址
   */
  addBlacklistAddress(address: string): void {
    this.blacklistAddresses.add(address.toLowerCase());
  }

  /**
   * 批量添加黑名单地址
   */
  addBlacklistAddresses(addresses: string[]): void {
    addresses.forEach((addr) => this.blacklistAddresses.add(addr.toLowerCase()));
  }

  /**
   * 移除黑名单地址
   */
  removeBlacklistAddress(address: string): void {
    this.blacklistAddresses.delete(address.toLowerCase());
  }

  /**
   * 添加黑名单合约
   */
  addBlacklistContract(contractAddress: string): void {
    this.blacklistContracts.add(contractAddress.toLowerCase());
  }

  /**
   * 批量添加黑名单合约
   */
  addBlacklistContracts(contracts: string[]): void {
    contracts.forEach((addr) => this.blacklistContracts.add(addr.toLowerCase()));
  }

  /**
   * 添加白名单地址（大额转账豁免）
   */
  addWhitelistAddress(address: string): void {
    this.whitelistAddresses.add(address.toLowerCase());
  }

  /**
   * 批量添加白名单地址
   */
  addWhitelistAddresses(addresses: string[]): void {
    addresses.forEach((addr) => this.whitelistAddresses.add(addr.toLowerCase()));
  }

  /**
   * 添加钓鱼域名
   */
  addPhishingDomain(domain: string): void {
    this.phishingDomains.add(domain.toLowerCase());
  }

  /**
   * 批量添加钓鱼域名
   */
  addPhishingDomains(domains: string[]): void {
    domains.forEach((d) => this.phishingDomains.add(d.toLowerCase()));
  }

  /**
   * 设置大额转账阈值
   */
  setLargeAmountThreshold(chain: keyof LargeAmountThreshold, amount: string): void {
    this.largeAmountThresholds[chain] = amount;
  }

  /**
   * 设置风险评分权重
   */
  setScoreWeights(weights: Partial<RiskScoreWeights>): void {
    Object.assign(this.scoreWeights, weights);
  }

  /**
   * 设置新地址阈值（首次交互判定次数）
   */
  setNewAddressThreshold(threshold: number): void {
    this.newAddressThreshold = threshold;
  }

  /**
   * 设置每日交易限额
   */
  setDailyTransactionLimit(limit: number): void {
    this.dailyTransactionLimit = limit;
  }

  /**
   * 设置每小时交易限额
   */
  setHourlyTransactionLimit(limit: number): void {
    this.hourlyTransactionLimit = limit;
  }

  /**
   * 记录用户交易历史（用于行为风控）
   */
  recordTransaction(userId: string, amount: string, toAddress: string): void {
    const history = this.userTransactionHistory.get(userId) || [];
    history.push({
      timestamp: new Date(),
      amount,
      toAddress: toAddress.toLowerCase(),
    });

    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const filtered = history.filter((t) => t.timestamp > oneDayAgo);
    this.userTransactionHistory.set(userId, filtered);
  }

  /**
   * 计算综合风险评分（加权模型）
   */
  calculateRiskScore(ctx: KeyRiskContext, matchedRules: KeyRiskRuleResult[]): number {
    let totalScore = 0;

    const amountScore = this.calculateAmountRisk(ctx);
    const addressScore = this.calculateAddressRisk(ctx);
    const contractScore = this.calculateContractRisk(ctx);
    const deviceScore = this.calculateDeviceRisk(ctx);
    const locationScore = this.calculateLocationRisk(ctx);
    const behaviorScore = this.calculateBehaviorRisk(ctx);

    totalScore += amountScore * this.scoreWeights.amountRisk;
    totalScore += addressScore * this.scoreWeights.addressRisk;
    totalScore += contractScore * this.scoreWeights.contractRisk;
    totalScore += deviceScore * this.scoreWeights.deviceRisk;
    totalScore += locationScore * this.scoreWeights.locationRisk;
    totalScore += behaviorScore * this.scoreWeights.behaviorRisk;

    const ruleBasedScore = matchedRules.reduce((sum, r) => sum + r.score, 0);
    totalScore = Math.max(totalScore, ruleBasedScore * 0.6);

    return Math.min(Math.round(totalScore), 100);
  }

  /**
   * 计算金额风险分
   */
  private calculateAmountRisk(ctx: KeyRiskContext): number {
    if (!ctx.amount || !ctx.chainType) return 0;

    const threshold = parseFloat(this.largeAmountThresholds[ctx.chainType] || '1000');
    const amount = parseFloat(ctx.amount);

    if (amount >= threshold * 10) return 100;
    if (amount >= threshold * 5) return 80;
    if (amount >= threshold * 2) return 60;
    if (amount >= threshold) return 40;
    if (amount >= threshold * 0.5) return 20;
    return 0;
  }

  /**
   * 计算地址风险分
   */
  private calculateAddressRisk(ctx: KeyRiskContext): number {
    if (!ctx.toAddress) return 0;

    const address = ctx.toAddress.toLowerCase();

    if (this.blacklistAddresses.has(address)) return 100;
    if (this.whitelistAddresses.has(address)) return 0;

    const history = this.userTransactionHistory.get(ctx.userId) || [];
    const pastInteractions = history.filter((t) => t.toAddress === address).length;

    if (pastInteractions <= this.newAddressThreshold) return 40;
    if (pastInteractions < 3) return 20;
    return 0;
  }

  /**
   * 计算合约风险分
   */
  private calculateContractRisk(ctx: KeyRiskContext): number {
    if (!ctx.contractAddress) return 0;

    const contract = ctx.contractAddress.toLowerCase();
    if (this.blacklistContracts.has(contract)) return 100;

    const payload = ctx.payload as Record<string, unknown>;
    if (payload && this.isUnlimitedApproval(payload)) return 60;
    if (payload && this.isNftApprovalForAll(payload)) return 70;

    return 0;
  }

  /**
   * 计算设备风险分
   */
  private calculateDeviceRisk(ctx: KeyRiskContext): number {
    if (ctx.isNewDevice) return 50;
    return 0;
  }

  /**
   * 计算位置风险分
   */
  private calculateLocationRisk(ctx: KeyRiskContext): number {
    if (ctx.isAbnormalLocation) return 60;
    return 0;
  }

  /**
   * 计算行为风险分
   */
  private calculateBehaviorRisk(ctx: KeyRiskContext): number {
    const history = this.userTransactionHistory.get(ctx.userId) || [];
    const now = new Date();

    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const hourlyCount = history.filter((t) => t.timestamp > oneHourAgo).length;

    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const dailyCount = history.filter((t) => t.timestamp > oneDayAgo).length;

    let score = 0;
    if (hourlyCount > this.hourlyTransactionLimit) score += 40;
    if (dailyCount > this.dailyTransactionLimit) score += 30;

    return Math.min(score, 100);
  }

  async evaluate(ctx: KeyRiskContext): Promise<KeyRiskAssessment> {
    const results: KeyRiskRuleResult[] = [];

    for (const rule of this.riskRules) {
      if (rule.enabled !== false) {
        try {
          const result = await rule.evaluate(ctx);
          results.push(result);
        } catch (error) {
          results.push({
            ruleCode: rule.ruleCode,
            ruleName: rule.ruleName,
            matched: false,
            score: 0,
            level: 'low',
            action: 'allow',
            reason: `Rule evaluation error: ${error}`,
          });
        }
      }
    }

    const matchedResults = results.filter((r) => r.matched);
    const weightedScore = this.calculateRiskScore(ctx, matchedResults);
    const ruleBasedScore = matchedResults.reduce((sum, r) => sum + r.score, 0);
    const finalScore = Math.max(weightedScore, Math.min(ruleBasedScore, 100));

    let riskLevel: KeyRiskAssessment['riskLevel'] = 'low';
    if (finalScore >= 85) riskLevel = 'critical';
    else if (finalScore >= 60) riskLevel = 'high';
    else if (finalScore >= 30) riskLevel = 'medium';

    let action: KeyRiskAssessment['action'] = 'allow';
    const actions = matchedResults.map((r) => r.action);
    if (actions.includes('reject')) action = 'reject';
    else if (actions.includes('manual_review')) action = 'manual_review';
    else if (actions.includes('delay')) action = 'delay';
    else if (actions.includes('second_confirm')) action = 'second_confirm';
    else if (actions.includes('warn')) action = 'warn';

    if (action === 'allow' && finalScore >= 70) {
      action = 'second_confirm';
    } else if (action === 'allow' && finalScore >= 40) {
      action = 'warn';
    }

    const reasons = matchedResults.map((r) => r.reason || r.ruleName);

    if (finalScore >= 30 && reasons.length === 0) {
      reasons.push(`综合风险评分: ${finalScore}/100`);
    }

    const allowed = action === 'allow' || action === 'warn';

    return {
      allowed,
      riskScore: finalScore,
      riskLevel,
      reasons,
      action,
    };
  }

  private registerDefaultRules(): void {
    this.registerRules([
      {
        ruleCode: 'BLACKLIST_ADDRESS',
        ruleName: '黑名单地址检测',
        enabled: true,
        parameters: { action: 'reject' },
        evaluate: async (ctx) => {
          if (ctx.toAddress && this.blacklistAddresses.has(ctx.toAddress.toLowerCase())) {
            return {
              ruleCode: 'BLACKLIST_ADDRESS',
              ruleName: '黑名单地址检测',
              matched: true,
              score: 100,
              level: 'critical',
              action: 'reject',
              reason: '收款地址在黑名单中',
            };
          }
          return {
            ruleCode: 'BLACKLIST_ADDRESS',
            ruleName: '黑名单地址检测',
            matched: false,
            score: 0,
            level: 'low',
            action: 'allow',
          };
        },
      },
      {
        ruleCode: 'BLACKLIST_CONTRACT',
        ruleName: '黑名单合约检测',
        enabled: true,
        parameters: { action: 'reject' },
        evaluate: async (ctx) => {
          if (ctx.contractAddress && this.blacklistContracts.has(ctx.contractAddress.toLowerCase())) {
            return {
              ruleCode: 'BLACKLIST_CONTRACT',
              ruleName: '黑名单合约检测',
              matched: true,
              score: 100,
              level: 'critical',
              action: 'reject',
              reason: '交互的合约地址在黑名单中',
            };
          }
          return {
            ruleCode: 'BLACKLIST_CONTRACT',
            ruleName: '黑名单合约检测',
            matched: false,
            score: 0,
            level: 'low',
            action: 'allow',
          };
        },
      },
      {
        ruleCode: 'UNLIMITED_APPROVAL',
        ruleName: '无限授权检测',
        enabled: true,
        parameters: { action: 'second_confirm', threshold: 50 },
        evaluate: async (ctx) => {
          if (ctx.signType === 'typed_data' || ctx.signType === 'transaction') {
            const payload = ctx.payload as Record<string, unknown>;
            if (payload && this.isUnlimitedApproval(payload)) {
              return {
                ruleCode: 'UNLIMITED_APPROVAL',
                ruleName: '无限授权检测',
                matched: true,
                score: 50,
                level: 'high',
                action: 'second_confirm',
                reason: '检测到无限授权操作，请谨慎确认',
              };
            }
          }
          return {
            ruleCode: 'UNLIMITED_APPROVAL',
            ruleName: '无限授权检测',
            matched: false,
            score: 0,
            level: 'low',
            action: 'allow',
          };
        },
      },
      {
        ruleCode: 'PERMIT_SIGNATURE',
        ruleName: 'Permit 免 Gas 签名检测',
        enabled: true,
        parameters: { action: 'second_confirm', threshold: 40 },
        evaluate: async (ctx) => {
          if (ctx.signType === 'typed_data') {
            const payload = ctx.payload as Record<string, unknown>;
            if (payload && this.isPermitSignature(payload)) {
              return {
                ruleCode: 'PERMIT_SIGNATURE',
                ruleName: 'Permit 免 Gas 签名检测',
                matched: true,
                score: 40,
                level: 'medium',
                action: 'second_confirm',
                reason: '检测到 Permit 签名操作，请确认授权金额',
              };
            }
          }
          return {
            ruleCode: 'PERMIT_SIGNATURE',
            ruleName: 'Permit 免 Gas 签名检测',
            matched: false,
            score: 0,
            level: 'low',
            action: 'allow',
          };
        },
      },
      {
        ruleCode: 'NFT_APPROVAL_FOR_ALL',
        ruleName: 'NFT 批量授权检测',
        enabled: true,
        parameters: { action: 'second_confirm', threshold: 60 },
        evaluate: async (ctx) => {
          if (ctx.signType === 'transaction') {
            const payload = ctx.payload as Record<string, unknown>;
            if (payload && this.isNftApprovalForAll(payload)) {
              return {
                ruleCode: 'NFT_APPROVAL_FOR_ALL',
                ruleName: 'NFT 批量授权检测',
                matched: true,
                score: 60,
                level: 'high',
                action: 'second_confirm',
                reason: '检测到 NFT 批量授权操作（setApprovalForAll），风险较高',
              };
            }
          }
          return {
            ruleCode: 'NFT_APPROVAL_FOR_ALL',
            ruleName: 'NFT 批量授权检测',
            matched: false,
            score: 0,
            level: 'low',
            action: 'allow',
          };
        },
      },
      {
        ruleCode: 'LARGE_TRANSFER',
        ruleName: '大额转账检测',
        enabled: true,
        parameters: { action: 'second_confirm', threshold: 35 },
        evaluate: async (ctx) => {
          if (ctx.amount && ctx.chainType && this.isLargeAmount(ctx.amount, ctx.chainType)) {
            const isWhitelisted = ctx.toAddress && this.whitelistAddresses.has(ctx.toAddress.toLowerCase());
            if (!isWhitelisted) {
              return {
                ruleCode: 'LARGE_TRANSFER',
                ruleName: '大额转账检测',
                matched: true,
                score: 35,
                level: 'medium',
                action: 'second_confirm',
                reason: '转账金额较大，请再次确认',
              };
            }
          }
          return {
            ruleCode: 'LARGE_TRANSFER',
            ruleName: '大额转账检测',
            matched: false,
            score: 0,
            level: 'low',
            action: 'allow',
          };
        },
      },
      {
        ruleCode: 'NEW_ADDRESS',
        ruleName: '新地址转账检测',
        enabled: true,
        parameters: { action: 'second_confirm', threshold: 30 },
        evaluate: async (ctx) => {
          if (ctx.toAddress && ctx.signType === 'transaction') {
            const history = this.userTransactionHistory.get(ctx.userId) || [];
            const pastInteractions = history.filter(
              (t) => t.toAddress === ctx.toAddress?.toLowerCase(),
            ).length;
            if (pastInteractions <= this.newAddressThreshold) {
              return {
                ruleCode: 'NEW_ADDRESS',
                ruleName: '新地址转账检测',
                matched: true,
                score: 30,
                level: 'medium',
                action: 'second_confirm',
                reason: '检测到向新地址转账，请确认收款地址无误',
              };
            }
          }
          return {
            ruleCode: 'NEW_ADDRESS',
            ruleName: '新地址转账检测',
            matched: false,
            score: 0,
            level: 'low',
            action: 'allow',
          };
        },
      },
      {
        ruleCode: 'FREQUENT_TRANSACTIONS',
        ruleName: '高频交易检测',
        enabled: true,
        parameters: { action: 'delay', threshold: 25 },
        evaluate: async (ctx) => {
          const history = this.userTransactionHistory.get(ctx.userId) || [];
          const now = new Date();
          const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
          const hourlyCount = history.filter((t) => t.timestamp > oneHourAgo).length;

          if (hourlyCount >= this.hourlyTransactionLimit) {
            return {
              ruleCode: 'FREQUENT_TRANSACTIONS',
              ruleName: '高频交易检测',
              matched: true,
              score: 45,
              level: 'high',
              action: 'delay',
              reason: '检测到短时间内频繁交易，请稍后再试',
            };
          }
          return {
            ruleCode: 'FREQUENT_TRANSACTIONS',
            ruleName: '高频交易检测',
            matched: false,
            score: 0,
            level: 'low',
            action: 'allow',
          };
        },
      },
      {
        ruleCode: 'NEW_DEVICE',
        ruleName: '新设备签名检测',
        enabled: true,
        parameters: { action: 'second_confirm', threshold: 25 },
        evaluate: async (ctx) => {
          if (ctx.isNewDevice) {
            return {
              ruleCode: 'NEW_DEVICE',
              ruleName: '新设备签名检测',
              matched: true,
              score: 25,
              level: 'medium',
              action: 'second_confirm',
              reason: '新设备首次签名，请确认是您本人操作',
            };
          }
          return {
            ruleCode: 'NEW_DEVICE',
            ruleName: '新设备签名检测',
            matched: false,
            score: 0,
            level: 'low',
            action: 'allow',
          };
        },
      },
      {
        ruleCode: 'ABNORMAL_IP',
        ruleName: '异常 IP 检测',
        enabled: true,
        parameters: { action: 'second_confirm', threshold: 30 },
        evaluate: async (ctx) => {
          if (ctx.isAbnormalLocation) {
            return {
              ruleCode: 'ABNORMAL_IP',
              ruleName: '异常 IP 检测',
              matched: true,
              score: 30,
              level: 'medium',
              action: 'second_confirm',
              reason: '检测到异常登录地点，请确认是您本人操作',
            };
          }
          return {
            ruleCode: 'ABNORMAL_IP',
            ruleName: '异常 IP 检测',
            matched: false,
            score: 0,
            level: 'low',
            action: 'allow',
          };
        },
      },
      {
        ruleCode: 'PHISHING_DAPP',
        ruleName: '钓鱼 DApp 检测',
        enabled: true,
        parameters: { action: 'reject' },
        evaluate: async (ctx) => {
          if (ctx.dappDomain && this.phishingDomains.has(ctx.dappDomain.toLowerCase())) {
            return {
              ruleCode: 'PHISHING_DAPP',
              ruleName: '钓鱼 DApp 检测',
              matched: true,
              score: 100,
              level: 'critical',
              action: 'reject',
              reason: '该 DApp 域名被标记为钓鱼网站，已阻止操作',
            };
          }
          return {
            ruleCode: 'PHISHING_DAPP',
            ruleName: '钓鱼 DApp 检测',
            matched: false,
            score: 0,
            level: 'low',
            action: 'allow',
          };
        },
      },
      {
        ruleCode: 'SUSPICIOUS_CONTRACT',
        ruleName: '可疑合约交互检测',
        enabled: true,
        parameters: { action: 'second_confirm', threshold: 45 },
        evaluate: async (ctx) => {
          if (ctx.contractAddress && ctx.signType === 'transaction') {
            const payload = ctx.payload as Record<string, unknown>;
            if (payload && this.isSuspiciousContractInteraction(payload)) {
              return {
                ruleCode: 'SUSPICIOUS_CONTRACT',
                ruleName: '可疑合约交互检测',
                matched: true,
                score: 45,
                level: 'high',
                action: 'second_confirm',
                reason: '检测到可疑的合约交互，请仔细核对操作内容',
              };
            }
          }
          return {
            ruleCode: 'SUSPICIOUS_CONTRACT',
            ruleName: '可疑合约交互检测',
            matched: false,
            score: 0,
            level: 'low',
            action: 'allow',
          };
        },
      },
      {
        ruleCode: 'ZERO_VALUE_TRANSFER',
        ruleName: '零值转账检测',
        enabled: true,
        parameters: { action: 'warn', threshold: 15 },
        evaluate: async (ctx) => {
          if (ctx.amount && parseFloat(ctx.amount) === 0 && ctx.signType === 'transaction') {
            return {
              ruleCode: 'ZERO_VALUE_TRANSFER',
              ruleName: '零值转账检测',
              matched: true,
              score: 15,
              level: 'low',
              action: 'warn',
              reason: '检测到零值转账，可能是授权操作或测试交易',
            };
          }
          return {
            ruleCode: 'ZERO_VALUE_TRANSFER',
            ruleName: '零值转账检测',
            matched: false,
            score: 0,
            level: 'low',
            action: 'allow',
          };
        },
      },
    ]);
  }

  private isUnlimitedApproval(payload: Record<string, unknown>): boolean {
    const data = (payload.data || payload.message) as string;
    if (typeof data === 'string') {
      if (data.includes('095ea7b3')) {
        const value = data.slice(138, 202);
        const maxUint256 = 'f'.repeat(64);
        return value.toLowerCase() === maxUint256;
      }
    }
    return false;
  }

  private isPermitSignature(payload: Record<string, unknown>): boolean {
    const types = payload.types as Record<string, unknown>;
    if (types && types['Permit']) {
      return true;
    }
    const message = payload.message as Record<string, unknown>;
    if (message && message['value'] && message['deadline']) {
      return true;
    }
    return false;
  }

  private isNftApprovalForAll(payload: Record<string, unknown>): boolean {
    const data = payload.data as string;
    if (typeof data === 'string') {
      return data.includes('a22cb465');
    }
    return false;
  }

  private isLargeAmount(amount: string, chainType: ChainType): boolean {
    try {
      const value = parseFloat(amount);
      const threshold = parseFloat(this.largeAmountThresholds[chainType] || '1000');
      return value >= threshold;
    } catch {
      return false;
    }
  }

  /**
   * 检测可疑合约交互（selfdestruct、delegatecall 等高危操作）
   */
  private isSuspiciousContractInteraction(payload: Record<string, unknown>): boolean {
    const data = (payload.data || payload.input) as string;
    if (typeof data === 'string' && data.length >= 10) {
      const methodId = data.slice(0, 10).toLowerCase();

      const suspiciousMethods = [
        '0xff000000',
        '0xf4f4f4f4',
        '0xd0e30db0',
        '0x2e1a7d4d',
        '0x3ccfd60b',
      ];

      if (suspiciousMethods.includes(methodId)) {
        return true;
      }
    }

    const value = payload.value as string;
    const to = payload.to as string;
    if (value && to && parseFloat(value) > 0) {
      if (data && data.length > 10 && !data.startsWith('0xa9059cbb')) {
        const lowerData = data.toLowerCase();
        if (lowerData.includes('delegatecall') || lowerData.includes('selfdestruct')) {
          return true;
        }
      }
    }

    return false;
  }
}

export interface KeyRiskRule {
  readonly ruleCode: string;
  readonly ruleName: string;
  enabled?: boolean;
  parameters?: Record<string, unknown>;
  evaluate(ctx: KeyRiskContext): Promise<KeyRiskRuleResult>;
}

export interface KeyRiskRuleResult {
  ruleCode: string;
  ruleName: string;
  matched: boolean;
  score: number;
  level: 'low' | 'medium' | 'high' | 'critical';
  action: 'allow' | 'warn' | 'second_confirm' | 'delay' | 'manual_review' | 'reject';
  reason?: string;
  detail?: Record<string, unknown>;
}

export const keyRiskService = new KeyRiskService();
