export enum PolicyEffect {
  ALLOW = 'allow',
  DENY = 'deny',
}

export enum PolicyConditionOperator {
  LESS_THAN = 'less_than',
  GREATER_THAN = 'greater_than',
  IN = 'in',
  NOT_IN = 'not_in',
}

export enum PolicyResourceType {
  TRANSACTION = 'transaction',
  KEY = 'key',
}

export enum PolicyActionType {
  SIGN = 'sign',
  DELETE = 'delete',
}

type Policy = {
  policyId: string;
  name: string;
  description?: string;
  effect: PolicyEffect;
  resources: Array<PolicyResourceType | '*'>;
  actions: Array<PolicyActionType | '*'>;
  conditions: Array<{ field: string; operator: PolicyConditionOperator; value: any }>;
  enabled: boolean;
  priority: number;
};

export class PolicyEngine {
  private policies: Policy[] = [];
  private totalEvaluations = 0;

  getConfig(): Record<string, unknown> {
    return { policyCount: this.policies.length };
  }

  addPolicy(policy: Policy): void {
    this.policies.push({ ...policy });
    this.policies.sort((a, b) => b.priority - a.priority);
  }

  addPolicies(policies: Policy[]): void {
    for (const p of policies) this.addPolicy(p);
  }

  getPolicies(): Policy[] {
    return [...this.policies];
  }

  getPolicy(policyId: string): Policy | undefined {
    return this.policies.find((p) => p.policyId === policyId);
  }

  updatePolicy(policyId: string, patch: Partial<Policy>): void {
    this.policies = this.policies.map((p) => (p.policyId === policyId ? { ...p, ...patch } : p));
    this.policies.sort((a, b) => b.priority - a.priority);
  }

  removePolicy(policyId: string): void {
    this.policies = this.policies.filter((p) => p.policyId !== policyId);
  }

  setPolicyEnabled(policyId: string, enabled: boolean): void {
    this.updatePolicy(policyId, { enabled });
  }

  evaluate(input: {
    userId: string;
    resource: PolicyResourceType;
    action: PolicyActionType;
    context: Record<string, unknown>;
  }): { allowed: boolean; matchedPolicies: Policy[]; reason: string } {
    this.totalEvaluations++;
    const matched = this.policies.filter((p) => this.matches(input, p));
    const first = matched[0];
    if (!first) {
      return { allowed: true, matchedPolicies: [], reason: 'no_policy_matched' };
    }
    return {
      allowed: first.effect !== PolicyEffect.DENY,
      matchedPolicies: matched,
      reason: `matched:${first.policyId}`,
    };
  }

  getPolicyTemplates(): Array<{ id: string; name: string }> {
    return [
      { id: 'large-transaction-approval', name: 'Large Transaction Approval' },
      { id: 'address-whitelist', name: 'Address Whitelist' },
    ];
  }

  exportPolicies(): { policies: Policy[] } {
    return { policies: this.getPolicies() };
  }

  importPolicies(data: { policies: Policy[] }): void {
    this.policies = [...data.policies];
    this.policies.sort((a, b) => b.priority - a.priority);
  }

  getStats(): { totalEvaluations: number } {
    return { totalEvaluations: this.totalEvaluations };
  }

  private matches(input: { resource: PolicyResourceType; action: PolicyActionType; context: Record<string, unknown> }, policy: Policy): boolean {
    if (!policy.enabled) return false;

    const resourceOk = policy.resources.includes('*') || policy.resources.includes(input.resource);
    const actionOk = policy.actions.includes('*') || policy.actions.includes(input.action);
    if (!resourceOk || !actionOk) return false;

    return policy.conditions.every((c) => this.matchCondition(c, input.context));
  }

  private matchCondition(cond: { field: string; operator: PolicyConditionOperator; value: any }, context: Record<string, unknown>): boolean {
    const value = context[cond.field];
    switch (cond.operator) {
      case PolicyConditionOperator.LESS_THAN:
        return BigInt(value as any) < BigInt(cond.value);
      case PolicyConditionOperator.GREATER_THAN:
        return BigInt(value as any) > BigInt(cond.value);
      case PolicyConditionOperator.IN:
        return Array.isArray(cond.value) ? cond.value.includes(value) : false;
      case PolicyConditionOperator.NOT_IN:
        return Array.isArray(cond.value) ? !cond.value.includes(value) : true;
      default:
        return true;
    }
  }
}

export const policyEngine = new PolicyEngine();
