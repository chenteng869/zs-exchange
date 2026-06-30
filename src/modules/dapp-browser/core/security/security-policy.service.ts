import type { SecurityRule, SecurityCheckType, SecurityCheckResult } from './security.types';
import { SecurityRuleStorageService } from './security-rule-storage.service';
import { DEFAULT_SECURITY_RULES } from './default-security-rules';

export interface SecurityPolicyConfig {
  urlBlockEnabled: boolean;
  domainBlacklistEnabled: boolean;
  phishingDetectionEnabled: boolean;
  homographDetectionEnabled: boolean;
  approvalWarningEnabled: boolean;
  calldataAnalysisEnabled: boolean;
  transactionSimulationEnabled: boolean;
}

export class SecurityPolicyService {
  private config: SecurityPolicyConfig = {
    urlBlockEnabled: true,
    domainBlacklistEnabled: true,
    phishingDetectionEnabled: true,
    homographDetectionEnabled: true,
    approvalWarningEnabled: true,
    calldataAnalysisEnabled: true,
    transactionSimulationEnabled: false,
  };

  constructor(private readonly ruleStorage: SecurityRuleStorageService = new SecurityRuleStorageService()) {
    this.initDefaultRules();
  }

  private initDefaultRules(): void {
    DEFAULT_SECURITY_RULES.forEach((rule) => {
      this.ruleStorage.save(rule);
    });
  }

  getConfig(): SecurityPolicyConfig {
    return { ...this.config };
  }

  updateConfig(config: Partial<SecurityPolicyConfig>): void {
    this.config = { ...this.config, ...config };
  }

  async getRules(type?: SecurityCheckType): Promise<SecurityRule[]> {
    if (type) {
      return this.ruleStorage.findByType(type);
    }
    return this.ruleStorage.getAll();
  }

  async addRule(rule: Omit<SecurityRule, 'ruleId' | 'createdAt' | 'updatedAt'>): Promise<SecurityRule> {
    const newRule: SecurityRule = {
      ...rule,
      ruleId: `rule_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    await this.ruleStorage.save(newRule);
    return newRule;
  }

  async updateRule(ruleId: string, updates: Partial<SecurityRule>): Promise<SecurityRule | undefined> {
    const rule = await this.ruleStorage.get(ruleId);
    if (rule) {
      const updatedRule: SecurityRule = { ...rule, ...updates, updatedAt: Date.now() };
      await this.ruleStorage.update(updatedRule);
      return updatedRule;
    }
    return undefined;
  }

  async deleteRule(ruleId: string): Promise<void> {
    await this.ruleStorage.delete(ruleId);
  }

  async enableRule(ruleId: string): Promise<void> {
    await this.ruleStorage.enable(ruleId);
  }

  async disableRule(ruleId: string): Promise<void> {
    await this.ruleStorage.disable(ruleId);
  }

  async evaluateUrl(url: string): Promise<{ allowed: boolean; riskLevel: SecurityCheckResult; violatedRules: SecurityRule[] }> {
    if (!this.config.urlBlockEnabled) {
      return { allowed: true, riskLevel: 'pass', violatedRules: [] };
    }

    const urlRules = await this.ruleStorage.findByType('url');
    const domainRules = await this.ruleStorage.findByType('domain');
    const violatedRules: SecurityRule[] = [];

    try {
      const urlObj = new URL(url);
      const hostname = urlObj.hostname.toLowerCase();

      for (const rule of [...urlRules, ...domainRules]) {
        if (!rule.enabled) continue;

        const regex = new RegExp(rule.pattern, 'i');
        const matches = regex.test(url) || regex.test(hostname);

        if (matches) {
          if (rule.action === 'block') {
            violatedRules.push(rule);
          } else if (rule.action === 'warn' && violatedRules.length === 0) {
            violatedRules.push(rule);
          }
        }
      }
    } catch {
      return { allowed: false, riskLevel: 'unknown', violatedRules: [] };
    }

    if (violatedRules.some((r) => r.action === 'block')) {
      return { allowed: false, riskLevel: 'block', violatedRules };
    }

    if (violatedRules.some((r) => r.action === 'warn')) {
      return { allowed: true, riskLevel: 'warning', violatedRules };
    }

    return { allowed: true, riskLevel: 'pass', violatedRules: [] };
  }

  async evaluateApproval(amount: string): Promise<{ allowed: boolean; riskLevel: SecurityCheckResult; warnings: string[] }> {
    if (!this.config.approvalWarningEnabled) {
      return { allowed: true, riskLevel: 'pass', warnings: [] };
    }

    const warnings: string[] = [];
    const approvalRules = await this.ruleStorage.findByType('approval');

    for (const rule of approvalRules) {
      if (!rule.enabled) continue;

      if (rule.pattern && amount.match(new RegExp(rule.pattern))) {
        if (rule.action === 'warn') {
          warnings.push(rule.name);
        } else if (rule.action === 'block') {
          return { allowed: false, riskLevel: 'block', warnings: [rule.name] };
        }
      }
    }

    const numericAmount = BigInt(amount);
    const maxSafeAmount = BigInt('1000000000000000000000');
    if (numericAmount > maxSafeAmount) {
      warnings.push('High value approval');
    }

    if (amount === '0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF') {
      warnings.push('Infinite approval');
      return { allowed: true, riskLevel: 'warning', warnings };
    }

    return {
      allowed: true,
      riskLevel: warnings.length > 0 ? 'warning' : 'pass',
      warnings,
    };
  }

  async evaluateCalldata(data: string): Promise<{ allowed: boolean; riskLevel: SecurityCheckResult; warnings: string[] }> {
    if (!this.config.calldataAnalysisEnabled) {
      return { allowed: true, riskLevel: 'pass', warnings: [] };
    }

    const warnings: string[] = [];
    const calldataRules = await this.ruleStorage.findByType('calldata');

    for (const rule of calldataRules) {
      if (!rule.enabled) continue;

      if (rule.pattern && data.toLowerCase().includes(rule.pattern.toLowerCase())) {
        if (rule.action === 'warn') {
          warnings.push(rule.name);
        } else if (rule.action === 'block') {
          return { allowed: false, riskLevel: 'block', warnings: [rule.name] };
        }
      }
    }

    return {
      allowed: true,
      riskLevel: warnings.length > 0 ? 'warning' : 'pass',
      warnings,
    };
  }

  async resetToDefault(): Promise<void> {
    await this.ruleStorage.clear();
    this.initDefaultRules();
    this.config = {
      urlBlockEnabled: true,
      domainBlacklistEnabled: true,
      phishingDetectionEnabled: true,
      homographDetectionEnabled: true,
      approvalWarningEnabled: true,
      calldataAnalysisEnabled: true,
      transactionSimulationEnabled: false,
    };
  }
}