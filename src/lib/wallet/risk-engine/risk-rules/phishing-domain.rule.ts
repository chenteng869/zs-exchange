/**
 * 钓鱼域名检测规则
 * 检测 DApp 域名是否为钓鱼网站，防止用户在恶意网站上签名
 */

import {
  RiskRule,
  RiskRuleResult,
  RiskContext,
  RiskLevel,
  RiskAction,
  RuleCategory,
  BlacklistType,
} from '../risk-engine.types';

/**
 * 钓鱼域名检测规则类
 * 用于检测 DApp 域名是否为钓鱼网站
 */
export class PhishingDomainRule implements RiskRule {
  readonly ruleCode = 'PHISHING_DOMAIN';
  readonly ruleName = '钓鱼域名检测';
  readonly description = '检测 DApp 域名是否为钓鱼网站，防止用户在恶意网站上签名';
  readonly category = RuleCategory.DOMAIN;
  readonly priority = 98;
  readonly version = '1.0.0';

  enabled = true;
  parameters = {
    action: RiskAction.REJECT,
    threshold: 100,
    similarityThreshold: 0.85,
  };

  private blacklistDomains: Map<string, { reason?: string; riskLevel?: RiskLevel; phishingType?: string }> =
    new Map();

  private whitelistDomains: Set<string> = new Set();

  private knownLegitimateDomains: string[] = [
    'uniswap.org',
    'app.uniswap.org',
    'sushi.com',
    'app.sushi.com',
    'opensea.io',
    'opensea.io',
    'blur.io',
    'coinbase.com',
    'binance.com',
    'metamask.io',
    'etherscan.io',
    'debank.com',
  ];

  constructor() {
    this.initializeDefaultLists();
  }

  /**
   * 初始化默认黑白名单
   */
  private initializeDefaultLists(): void {
    this.knownLegitimateDomains.forEach((domain) => {
      this.whitelistDomains.add(domain.toLowerCase());
    });
  }

  /**
   * 添加钓鱼域名
   * @param domain 域名
   * @param reason 原因
   * @param riskLevel 风险等级
   * @param phishingType 钓鱼类型
   */
  addPhishingDomain(
    domain: string,
    reason?: string,
    riskLevel: RiskLevel = RiskLevel.CRITICAL,
    phishingType?: string
  ): void {
    this.blacklistDomains.set(domain.toLowerCase(), { reason, riskLevel, phishingType });
  }

  /**
   * 批量添加钓鱼域名
   * @param domains 域名列表
   */
  addPhishingDomains(
    domains: Array<{ domain: string; reason?: string; riskLevel?: RiskLevel; phishingType?: string }>
  ): void {
    domains.forEach((item) => {
      this.addPhishingDomain(item.domain, item.reason, item.riskLevel || RiskLevel.CRITICAL, item.phishingType);
    });
  }

  /**
   * 移除钓鱼域名
   * @param domain 域名
   */
  removePhishingDomain(domain: string): boolean {
    return this.blacklistDomains.delete(domain.toLowerCase());
  }

  /**
   * 添加白名单域名
   * @param domain 域名
   */
  addWhitelistDomain(domain: string): void {
    this.whitelistDomains.add(domain.toLowerCase());
  }

  /**
   * 批量添加白名单域名
   * @param domains 域名列表
   */
  addWhitelistDomains(domains: string[]): void {
    domains.forEach((d) => this.whitelistDomains.add(d.toLowerCase()));
  }

  /**
   * 移除白名单域名
   * @param domain 域名
   */
  removeWhitelistDomain(domain: string): boolean {
    return this.whitelistDomains.delete(domain.toLowerCase());
  }

  /**
   * 检查域名是否在钓鱼黑名单中
   * @param domain 域名
   * @returns 黑名单信息
   */
  checkDomain(domain: string): {
    inBlacklist: boolean;
    reason?: string;
    riskLevel?: RiskLevel;
    phishingType?: string;
  } {
    const normalizedDomain = this.normalizeDomain(domain);
    const info = this.blacklistDomains.get(normalizedDomain);
    if (info) {
      return { inBlacklist: true, ...info };
    }
    return { inBlacklist: false };
  }

  /**
   * 检查域名是否在白名单中
   * @param domain 域名
   */
  isWhitelisted(domain: string): boolean {
    const normalizedDomain = this.normalizeDomain(domain);
    return this.whitelistDomains.has(normalizedDomain);
  }

  /**
   * 标准化域名
   * @param domain 域名
   * @returns 标准化后的域名
   */
  private normalizeDomain(domain: string): string {
    let normalized = domain.toLowerCase().trim();
    normalized = normalized.replace(/^https?:\/\//, '');
    normalized = normalized.split('/')[0];
    return normalized;
  }

  /**
   * 提取主域名
   * @param domain 完整域名
   * @returns 主域名
   */
  private extractRootDomain(domain: string): string {
    const normalized = this.normalizeDomain(domain);
    const parts = normalized.split('.');
    if (parts.length >= 2) {
      return parts.slice(-2).join('.');
    }
    return normalized;
  }

  /**
   * 计算字符串相似度（简单实现）
   * @param str1 字符串1
   * @param str2 字符串2
   * @returns 相似度 0-1
   */
  private calculateSimilarity(str1: string, str2: string): number {
    const s1 = str1.toLowerCase();
    const s2 = str2.toLowerCase();

    if (s1 === s2) return 1;
    if (s1.length === 0 || s2.length === 0) return 0;

    const matrix: number[][] = [];

    for (let i = 0; i <= s2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= s1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= s2.length; i++) {
      for (let j = 1; j <= s1.length; j++) {
        if (s2.charAt(i - 1) === s1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    const editDistance = matrix[s2.length][s1.length];
    const maxLength = Math.max(s1.length, s2.length);
    return 1 - editDistance / maxLength;
  }

  /**
   * 检测是否为仿冒域名
   * @param domain 待检测域名
   * @returns 仿冒检测结果
   */
  detectSpoofing(domain: string): {
    isSpoofed: boolean;
    similarTo?: string;
    similarity?: number;
    details?: string[];
  } {
    const normalizedDomain = this.normalizeDomain(domain);
    const rootDomain = this.extractRootDomain(normalizedDomain);
    const details: string[] = [];

    if (this.whitelistDomains.has(normalizedDomain)) {
      return { isSpoofed: false };
    }

    let highestSimilarity = 0;
    let mostSimilarDomain = '';

    for (const legitDomain of this.knownLegitimateDomains) {
      const legitRoot = this.extractRootDomain(legitDomain);
      const similarity = this.calculateSimilarity(rootDomain, legitRoot);

      if (similarity > highestSimilarity) {
        highestSimilarity = similarity;
        mostSimilarDomain = legitDomain;
      }
    }

    const threshold = this.parameters.similarityThreshold || 0.85;

    if (highestSimilarity >= threshold && highestSimilarity < 1) {
      details.push(`与知名域名 ${mostSimilarDomain} 相似度达到 ${(highestSimilarity * 100).toFixed(1)}%`);
      return {
        isSpoofed: true,
        similarTo: mostSimilarDomain,
        similarity: highestSimilarity,
        details,
      };
    }

    const suspiciousPatterns = [
      { pattern: /-/, desc: '包含连字符，可能是仿冒域名' },
      { pattern: /\d+\./, desc: '包含数字，可能是仿冒域名' },
      { pattern: /^.*(login|signin|connect|verify|validate).*\./i, desc: '包含可疑关键词' },
    ];

    for (const { pattern, desc } of suspiciousPatterns) {
      if (pattern.test(rootDomain)) {
        details.push(desc);
      }
    }

    if (details.length >= 2) {
      return { isSpoofed: true, details };
    }

    return { isSpoofed: false };
  }

  /**
   * 获取钓鱼域名数量
   */
  getBlacklistCount(): number {
    return this.blacklistDomains.size;
  }

  /**
   * 获取白名单域名数量
   */
  getWhitelistCount(): number {
    return this.whitelistDomains.size;
  }

  /**
   * 清空钓鱼域名黑名单
   */
  clearBlacklist(): void {
    this.blacklistDomains.clear();
  }

  /**
   * 获取所有钓鱼域名
   */
  getAllPhishingDomains(): Array<{
    domain: string;
    reason?: string;
    riskLevel?: RiskLevel;
    phishingType?: string;
  }> {
    const result: Array<{
      domain: string;
      reason?: string;
      riskLevel?: RiskLevel;
      phishingType?: string;
    }> = [];
    this.blacklistDomains.forEach((info, domain) => {
      result.push({ domain, ...info });
    });
    return result;
  }

  /**
   * 判断规则是否适用于当前上下文
   * @param context 风控上下文
   * @returns 是否适用
   */
  isApplicable(context: RiskContext): boolean {
    if (!this.enabled) return false;
    if (!context.dapp?.domain) return false;
    return true;
  }

  /**
   * 执行规则评估
   * @param context 风控上下文
   * @returns 规则评估结果
   */
  async evaluate(context: RiskContext): Promise<RiskRuleResult> {
    const startTime = Date.now();

    if (!this.isApplicable(context)) {
      return this.createNotApplicableResult(startTime, '无 DApp 域名信息');
    }

    const domain = context.dapp?.domain || '';

    const blacklistInfo = this.blacklistDomains.get(this.normalizeDomain(domain));
    if (blacklistInfo) {
      const riskLevel = blacklistInfo.riskLevel || RiskLevel.CRITICAL;
      const action = this.parameters.action || RiskAction.REJECT;
      const score = this.parameters.threshold || 100;

      return {
        ruleCode: this.ruleCode,
        ruleName: this.ruleName,
        category: this.category,
        matched: true,
        score,
        level: riskLevel,
        action,
        reason: blacklistInfo.reason
          ? `该域名被标记为钓鱼网站：${blacklistInfo.reason}`
          : '该 DApp 域名被标记为钓鱼网站，已阻止操作',
        detail: {
          domain,
          blacklistReason: blacklistInfo.reason,
          phishingType: blacklistInfo.phishingType,
          blacklistType: BlacklistType.DOMAIN,
        },
        priority: this.priority,
        evaluationTime: Date.now() - startTime,
      };
    }

    const spoofingResult = this.detectSpoofing(domain);
    if (spoofingResult.isSpoofed) {
      return {
        ruleCode: this.ruleCode,
        ruleName: this.ruleName,
        category: this.category,
        matched: true,
        score: 70,
        level: RiskLevel.HIGH,
        action: RiskAction.SECOND_CONFIRM,
        reason: '检测到可疑的仿冒域名，请仔细核实网站真实性',
        detail: {
          domain,
          isSuspicious: true,
          similarTo: spoofingResult.similarTo,
          similarity: spoofingResult.similarity,
          details: spoofingResult.details,
        },
        priority: this.priority,
        evaluationTime: Date.now() - startTime,
      };
    }

    return {
      ruleCode: this.ruleCode,
      ruleName: this.ruleName,
      category: this.category,
      matched: false,
      score: 0,
      level: RiskLevel.LOW,
      action: RiskAction.ALLOW,
      priority: this.priority,
      evaluationTime: Date.now() - startTime,
    };
  }

  /**
   * 创建不适用的结果
   * @param startTime 开始时间
   * @param reason 原因
   * @returns 规则结果
   */
  private createNotApplicableResult(startTime: number, reason: string): RiskRuleResult {
    return {
      ruleCode: this.ruleCode,
      ruleName: this.ruleName,
      category: this.category,
      matched: false,
      score: 0,
      level: RiskLevel.LOW,
      action: RiskAction.ALLOW,
      reason: `规则不适用（${reason}）`,
      priority: this.priority,
      evaluationTime: Date.now() - startTime,
    };
  }
}

export const phishingDomainRule = new PhishingDomainRule();
