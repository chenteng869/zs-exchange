import type { SecurityRule, SecurityRuleStorage, SecurityCheckType } from './security.types';

export class SecurityRuleStorageService implements SecurityRuleStorage {
  private rules = new Map<string, SecurityRule>();

  async save(rule: SecurityRule): Promise<void> {
    this.rules.set(rule.ruleId, rule);
  }

  async get(ruleId: string): Promise<SecurityRule | undefined> {
    return this.rules.get(ruleId);
  }

  async findByType(type: SecurityCheckType): Promise<SecurityRule[]> {
    return Array.from(this.rules.values()).filter((rule) => rule.type === type && rule.enabled);
  }

  async getAll(): Promise<SecurityRule[]> {
    return Array.from(this.rules.values());
  }

  async update(rule: SecurityRule): Promise<void> {
    this.rules.set(rule.ruleId, { ...rule, updatedAt: Date.now() });
  }

  async delete(ruleId: string): Promise<void> {
    this.rules.delete(ruleId);
  }

  async enable(ruleId: string): Promise<void> {
    const rule = await this.get(ruleId);
    if (rule) {
      rule.enabled = true;
      rule.updatedAt = Date.now();
      this.rules.set(ruleId, rule);
    }
  }

  async disable(ruleId: string): Promise<void> {
    const rule = await this.get(ruleId);
    if (rule) {
      rule.enabled = false;
      rule.updatedAt = Date.now();
      this.rules.set(ruleId, rule);
    }
  }

  async clear(): Promise<void> {
    this.rules.clear();
  }
}