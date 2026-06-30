export type SecurityCheckType = 'url' | 'domain' | 'contract' | 'calldata' | 'approval';

export type SecurityCheckResult = 'pass' | 'warning' | 'block' | 'unknown';

export type PhishingType =
  | 'exact_match'
  | 'similar_domain'
  | 'typosquatting'
  | 'subdomain'
  | 'suspicious_tld'
  | 'redirect_chain';

export interface SecurityCheck {
  checkId: string;
  type: SecurityCheckType;
  result: SecurityCheckResult;
  details?: Record<string, unknown>;
  timestamp: number;
}

export interface UrlRiskInfo {
  url: string;
  origin: string;
  hostname: string;
  protocol: string;
  pathname: string;
  search: string;
  hash: string;
  isHttps: boolean;
  isLocalhost: boolean;
  isIPAddress: boolean;
  port?: number;
  riskLevel: SecurityCheckResult;
  phishingType?: PhishingType;
  similarDomains?: string[];
  blacklisted?: boolean;
  whitelisted?: boolean;
}

export interface DomainBlacklistEntry {
  entryId: string;
  hostname: string;
  pattern?: string;
  reason: string;
  phishingType?: PhishingType;
  severity: 'medium' | 'high' | 'critical';
  blockedAt: number;
  expiresAt?: number;
}

export interface ContractBlacklistEntry {
  entryId: string;
  chainId: string;
  contractAddress: string;
  contractName?: string;
  reason: string;
  severity: 'medium' | 'high' | 'critical';
  blockedAt: number;
  expiresAt?: number;
}

export interface ApprovalRiskInfo {
  spender: string;
  tokenAddress: string;
  tokenSymbol?: string;
  amount: string;
  isInfinite: boolean;
  riskLevel: SecurityCheckResult;
  warningMessage?: string;
}

export interface CalldataDecodeResult {
  functionName?: string;
  functionSignature?: string;
  parameters?: Record<string, unknown>;
  decoded?: boolean;
  riskLevel: SecurityCheckResult;
  warningMessage?: string;
}

export interface SecurityWarning {
  warningId: string;
  type: SecurityCheckType;
  level: 'warning' | 'danger';
  title: string;
  message: string;
  action?: string;
  data?: Record<string, unknown>;
}

export interface TransactionSimulationResult {
  success: boolean;
  revertReason?: string;
  gasEstimation?: string;
  stateChanges?: Record<string, unknown>;
  riskLevel: SecurityCheckResult;
  warnings?: SecurityWarning[];
}

export interface SecurityRule {
  ruleId: string;
  type: SecurityCheckType;
  name: string;
  description?: string;
  pattern: string;
  action: 'allow' | 'block' | 'warn';
  severity?: 'low' | 'medium' | 'high' | 'critical';
  enabled: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface SecurityRuleStorage {
  save(rule: SecurityRule): Promise<void>;
  get(ruleId: string): Promise<SecurityRule | undefined>;
  findByType(type: SecurityCheckType): Promise<SecurityRule[]>;
  getAll(): Promise<SecurityRule[]>;
  update(rule: SecurityRule): Promise<void>;
  delete(ruleId: string): Promise<void>;
  enable(ruleId: string): Promise<void>;
  disable(ruleId: string): Promise<void>;
  clear(): Promise<void>;
}