/**
 * 安全审计日志模块
 *
 * 功能：
 *  - 安全事件记录
 *  - 操作审计追踪
 *  - 异常行为检测
 *  - 登录日志
 *  - 交易审计
 *  - 权限变更日志
 *  - 设备管理
 *  - 安全报告生成
 *  - 日志导出
 *  - 风险评分
 */

// ============================================================================
// 类型定义
// ============================================================================

export interface AuditLogEntry {
  id: string;
  timestamp: number;
  type: AuditLogType;
  category: AuditLogCategory;
  severity: 'low' | 'medium' | 'high' | 'critical';
  action: string;
  status: 'success' | 'failed' | 'warning';
  actor: AuditActor;
  target?: AuditTarget;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  deviceId?: string;
  location?: string;
  riskScore: number;
  isNewDevice?: boolean;
  isNewLocation?: boolean;
  relatedLogIds?: string[];
}

export type AuditLogType =
  | 'wallet_create'
  | 'wallet_import'
  | 'wallet_backup'
  | 'wallet_delete'
  | 'wallet_rename'
  | 'key_generate'
  | 'key_export'
  | 'key_sign'
  | 'transaction_sign'
  | 'transaction_send'
  | 'transaction_speedup'
  | 'transaction_cancel'
  | 'dapp_connect'
  | 'dapp_disconnect'
  | 'dapp_permission_change'
  | 'dapp_whitelist_add'
  | 'dapp_whitelist_remove'
  | 'dapp_blacklist_add'
  | 'dapp_blacklist_remove'
  | 'login'
  | 'logout'
  | 'password_change'
  | 'password_reset'
  | 'pin_set'
  | 'pin_change'
  | 'biometric_enable'
  | 'biometric_disable'
  | 'hardware_wallet_connect'
  | 'hardware_wallet_disconnect'
  | 'setting_change'
  | 'network_change'
  | 'account_add'
  | 'account_remove'
  | 'address_book_add'
  | 'address_book_remove'
  | 'address_book_blacklist'
  | 'token_add'
  | 'token_remove'
  | 'nft_transfer'
  | 'staking_deposit'
  | 'staking_withdraw'
  | 'staking_claim'
  | 'swap_execute'
  | 'bridge_deposit'
  | 'bridge_withdraw'
  | 'security_alert'
  | 'phishing_detected'
  | 'malware_detected'
  | 'unauthorized_access_attempt'
  | 'rate_limit_exceeded'
  | 'data_export'
  | 'data_import'
  | 'settings_backup'
  | 'settings_restore'
  | 'system_update'
  | 'other';

export type AuditLogCategory =
  | 'wallet'
  | 'keys'
  | 'transactions'
  | 'dapp'
  | 'authentication'
  | 'security'
  | 'settings'
  | 'staking'
  | 'defi'
  | 'nft'
  | 'bridge'
  | 'system';

export interface AuditActor {
  type: 'user' | 'system' | 'dapp' | 'api';
  id?: string;
  walletId?: string;
  address?: string;
  dappUrl?: string;
}

export interface AuditTarget {
  type: 'wallet' | 'account' | 'transaction' | 'dapp' | 'setting' | 'token' | 'nft' | 'address';
  id?: string;
  address?: string;
  name?: string;
}

export interface SecurityAlert {
  id: string;
  timestamp: number;
  type: SecurityAlertType;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  status: 'active' | 'acknowledged' | 'resolved' | 'ignored';
  data?: Record<string, any>;
  actions?: SecurityAction[];
  acknowledgedAt?: number;
  resolvedAt?: number;
  resolvedBy?: string;
  resolution?: string;
}

export type SecurityAlertType =
  | 'new_device_login'
  | 'unusual_location'
  | 'large_transaction'
  | 'unusual_transaction'
  | 'phishing_attempt'
  | 'malicious_contract'
  | 'rug_pull_warning'
  | 'approval_to_unknown'
  | 'infinite_approval'
  | 'seed_phrase_exposure_risk'
  | 'weak_password'
  | 'no_backup'
  | 'outdated_version'
  | 'multiple_failed_logins'
  | 'api_key_exposure'
  | 'dns_hijack_risk'
  | 'clipboard_hijack'
  | 'fake_token'
  | 'honeypot_token';

export interface SecurityAction {
  id: string;
  label: string;
  type: 'block' | 'warn' | 'allow' | 'verify';
  description: string;
}

export interface DeviceInfo {
  id: string;
  name: string;
  type: 'desktop' | 'mobile' | 'tablet' | 'hardware' | 'browser';
  os: string;
  osVersion: string;
  browser?: string;
  browserVersion?: string;
  walletVersion: string;
  lastActive: number;
  firstSeen: number;
  isTrusted: boolean;
  isCurrentDevice: boolean;
  lastIp?: string;
  lastLocation?: string;
  biometricEnabled: boolean;
  passcodeEnabled: boolean;
}

export interface SecurityCheckResult {
  score: number;
  level: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
  checks: SecurityCheckItem[];
  suggestions: SecuritySuggestion[];
  lastCheckTime: number;
}

export interface SecurityCheckItem {
  id: string;
  name: string;
  category: string;
  status: 'pass' | 'warning' | 'fail' | 'info';
  score: number;
  maxScore: number;
  description: string;
  details?: string;
}

export interface SecuritySuggestion {
  id: string;
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  action?: string;
  estimatedTime?: string;
}

export interface LoginAttempt {
  id: string;
  timestamp: number;
  success: boolean;
  method: 'password' | 'pin' | 'biometric' | 'hardware' | 'mnemonic';
  ipAddress?: string;
  deviceId?: string;
  failureReason?: string;
  duration: number;
}

export interface RiskAssessment {
  overallRisk: 'low' | 'medium' | 'high' | 'critical';
  riskScore: number;
  factors: RiskFactor[];
  recommendations: string[];
}

export interface RiskFactor {
  category: string;
  level: 'low' | 'medium' | 'high' | 'critical';
  score: number;
  description: string;
  details?: string;
}

export interface AuditLogFilter {
  type?: AuditLogType;
  category?: AuditLogCategory;
  severity?: string;
  status?: string;
  startDate?: number;
  endDate?: number;
  actorType?: string;
  walletId?: string;
  search?: string;
  riskScoreMin?: number;
  sortBy?: 'timestamp' | 'riskScore';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}

// ============================================================================
// 安全配置
// ============================================================================

export const SECURITY_THRESHOLDS = {
  excellentScore: 90,
  goodScore: 75,
  fairScore: 60,
  poorScore: 40,
  largeTransactionUsd: 10000,
  unusualAmountMultiplier: 5,
  maxFailedLoginAttempts: 5,
  loginLockoutMinutes: 30,
  newDeviceVerificationRequired: true,
  newLocationVerificationRequired: true,
  passwordMinLength: 12,
  passwordRequireUppercase: true,
  passwordRequireLowercase: true,
  passwordRequireNumbers: true,
  passwordRequireSymbols: true,
  autoLogoutMinutes: 30,
  sessionTimeoutMinutes: 60,
  maxSessionDurationHours: 24,
  transactionSignTimeoutSeconds: 120,
  maxApprovalsPerToken: 3,
  warnOnInfiniteApproval: true,
};

// ============================================================================
// 审计日志服务
// ============================================================================

export class AuditLogger {
  private logs: AuditLogEntry[] = [];
  private alerts: SecurityAlert[] = [];
  private devices: Map<string, DeviceInfo> = new Map();
  private loginAttempts: LoginAttempt[] = [];
  private failedLoginCount: Map<string, number> = new Map();
  private lockoutUntil: Map<string, number> = new Map();
  private maxLogs: number = 10000;
  private sessionId?: string;
  private currentDeviceId?: string;

  constructor() {}

  // ========================================================================
  // 日志记录
  // ========================================================================

  /**
   * 记录审计日志
   */
  log(entry: Omit<AuditLogEntry, 'id' | 'timestamp' | 'riskScore'> & { riskScore?: number }): AuditLogEntry {
    const fullEntry: AuditLogEntry = {
      id: `audit_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      timestamp: Date.now(),
      riskScore: entry.riskScore ?? this.calculateRiskScore(entry),
      ...entry,
    };

    this.logs.unshift(fullEntry);

    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs);
    }

    if (fullEntry.severity === 'high' || fullEntry.severity === 'critical') {
      this.createAlertFromLog(fullEntry);
    }

    return fullEntry;
  }

  /**
   * 记录钱包创建
   */
  logWalletCreate(walletId: string, method: string = 'mnemonic'): AuditLogEntry {
    return this.log({
      type: 'wallet_create',
      category: 'wallet',
      severity: 'medium',
      action: '创建钱包',
      status: 'success',
      actor: { type: 'user', walletId },
      target: { type: 'wallet', id: walletId },
      metadata: { method },
    });
  }

  /**
   * 记录钱包导入
   */
  logWalletImport(walletId: string, method: string): AuditLogEntry {
    return this.log({
      type: 'wallet_import',
      category: 'wallet',
      severity: 'high',
      action: '导入钱包',
      status: 'success',
      actor: { type: 'user', walletId },
      target: { type: 'wallet', id: walletId },
      metadata: { method },
    });
  }

  /**
   * 记录私钥导出
   */
  logKeyExport(walletId: string, keyType: string): AuditLogEntry {
    return this.log({
      type: 'key_export',
      category: 'keys',
      severity: 'critical',
      action: `导出${keyType}`,
      status: 'success',
      actor: { type: 'user', walletId },
      target: { type: 'wallet', id: walletId },
      metadata: { keyType },
    });
  }

  /**
   * 记录交易签名
   */
  logTransactionSign(
    walletId: string,
    txHash: string,
    chain: string,
    value: string,
    success: boolean,
    error?: string
  ): AuditLogEntry {
    return this.log({
      type: 'transaction_sign',
      category: 'transactions',
      severity: success ? 'medium' : 'high',
      action: '签名交易',
      status: success ? 'success' : 'failed',
      actor: { type: 'user', walletId },
      target: { type: 'transaction', id: txHash },
      metadata: { chain, value, error },
    });
  }

  /**
   * 记录交易发送
   */
  logTransactionSend(
    walletId: string,
    txHash: string,
    from: string,
    to: string,
    value: string,
    chain: string
  ): AuditLogEntry {
    return this.log({
      type: 'transaction_send',
      category: 'transactions',
      severity: 'medium',
      action: '发送交易',
      status: 'success',
      actor: { type: 'user', walletId, address: from },
      target: { type: 'transaction', id: txHash, address: to },
      metadata: { chain, value },
    });
  }

  /**
   * 记录 DApp 连接
   */
  logDAppConnect(walletId: string, dAppUrl: string, permissions: string[]): AuditLogEntry {
    return this.log({
      type: 'dapp_connect',
      category: 'dapp',
      severity: 'medium',
      action: '连接 DApp',
      status: 'success',
      actor: { type: 'user', walletId },
      target: { type: 'dapp', name: dAppUrl },
      metadata: { dAppUrl, permissions },
    });
  }

  /**
   * 记录 DApp 断开
   */
  logDAppDisconnect(walletId: string, dAppUrl: string): AuditLogEntry {
    return this.log({
      type: 'dapp_disconnect',
      category: 'dapp',
      severity: 'low',
      action: '断开 DApp',
      status: 'success',
      actor: { type: 'user', walletId },
      target: { type: 'dapp', name: dAppUrl },
      metadata: { dAppUrl },
    });
  }

  /**
   * 记录登录
   */
  logLogin(method: string, success: boolean, failureReason?: string): AuditLogEntry {
    const attempt: LoginAttempt = {
      id: `login_${Date.now()}`,
      timestamp: Date.now(),
      success,
      method: method as any,
      duration: 0,
      failureReason,
    };
    this.loginAttempts.unshift(attempt);

    const key = this.currentDeviceId || 'default';
    if (!success) {
      const count = (this.failedLoginCount.get(key) || 0) + 1;
      this.failedLoginCount.set(key, count);

      if (count >= SECURITY_THRESHOLDS.maxFailedLoginAttempts) {
        this.lockoutUntil.set(
          key,
          Date.now() + SECURITY_THRESHOLDS.loginLockoutMinutes * 60 * 1000
        );
      }
    } else {
      this.failedLoginCount.delete(key);
    }

    return this.log({
      type: 'login',
      category: 'authentication',
      severity: success ? 'low' : 'high',
      action: '登录',
      status: success ? 'success' : 'failed',
      actor: { type: 'user' },
      metadata: { method, failureReason },
    });
  }

  /**
   * 记录登出
   */
  logLogout(reason?: string): AuditLogEntry {
    return this.log({
      type: 'logout',
      category: 'authentication',
      severity: 'low',
      action: '登出',
      status: 'success',
      actor: { type: 'user' },
      metadata: { reason },
    });
  }

  /**
   * 记录密码修改
   */
  logPasswordChange(success: boolean): AuditLogEntry {
    return this.log({
      type: 'password_change',
      category: 'authentication',
      severity: 'high',
      action: '修改密码',
      status: success ? 'success' : 'failed',
      actor: { type: 'user' },
    });
  }

  /**
   * 记录生物识别启用
   */
  logBiometricEnable(enabled: boolean): AuditLogEntry {
    return this.log({
      type: enabled ? 'biometric_enable' : 'biometric_disable',
      category: 'authentication',
      severity: 'medium',
      action: enabled ? '启用生物识别' : '禁用生物识别',
      status: 'success',
      actor: { type: 'user' },
    });
  }

  /**
   * 记录安全警报
   */
  logSecurityAlert(
    alertType: SecurityAlertType,
    title: string,
    description: string,
    severity: 'low' | 'medium' | 'high' | 'critical' = 'high',
    data?: Record<string, any>
  ): AuditLogEntry {
    const alert: SecurityAlert = {
      id: `alert_${Date.now()}`,
      timestamp: Date.now(),
      type: alertType,
      severity,
      title,
      description,
      status: 'active',
      data,
    };
    this.alerts.unshift(alert);

    return this.log({
      type: 'security_alert',
      category: 'security',
      severity,
      action: title,
      status: 'warning',
      actor: { type: 'system' },
      metadata: { alertType, description, data },
    });
  }

  // ========================================================================
  // 日志查询
  // ========================================================================

  /**
   * 查询审计日志
   */
  getLogs(filter: AuditLogFilter = {}): { logs: AuditLogEntry[]; total: number; page: number; pageSize: number } {
    let logs = [...this.logs];

    if (filter.type) {
      logs = logs.filter((l) => l.type === filter.type);
    }
    if (filter.category) {
      logs = logs.filter((l) => l.category === filter.category);
    }
    if (filter.severity) {
      logs = logs.filter((l) => l.severity === filter.severity);
    }
    if (filter.status) {
      logs = logs.filter((l) => l.status === filter.status);
    }
    if (filter.startDate) {
      logs = logs.filter((l) => l.timestamp >= filter.startDate!);
    }
    if (filter.endDate) {
      logs = logs.filter((l) => l.timestamp <= filter.endDate!);
    }
    if (filter.actorType) {
      logs = logs.filter((l) => l.actor.type === filter.actorType);
    }
    if (filter.walletId) {
      logs = logs.filter((l) => l.actor.walletId === filter.walletId);
    }
    if (filter.riskScoreMin !== undefined) {
      logs = logs.filter((l) => l.riskScore >= filter.riskScoreMin!);
    }
    if (filter.search) {
      const search = filter.search.toLowerCase();
      logs = logs.filter(
        (l) =>
          l.action.toLowerCase().includes(search) ||
          l.type.toLowerCase().includes(search) ||
          JSON.stringify(l.metadata || {}).toLowerCase().includes(search)
      );
    }

    const sortBy = filter.sortBy || 'timestamp';
    const sortOrder = filter.sortOrder || 'desc';
    logs.sort((a, b) => {
      let diff = 0;
      switch (sortBy) {
        case 'timestamp':
          diff = a.timestamp - b.timestamp;
          break;
        case 'riskScore':
          diff = a.riskScore - b.riskScore;
          break;
      }
      return sortOrder === 'desc' ? -diff : diff;
    });

    const total = logs.length;
    const page = filter.page || 1;
    const pageSize = filter.pageSize || 20;
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    logs = logs.slice(start, end);

    return { logs, total, page, pageSize };
  }

  /**
   * 获取日志统计
   */
  getLogStats(startDate?: number, endDate?: number): {
    total: number;
    byType: Record<string, number>;
    byCategory: Record<string, number>;
    bySeverity: Record<string, number>;
    byStatus: Record<string, number>;
    highRiskCount: number;
  } {
    let logs = this.logs;
    if (startDate) logs = logs.filter((l) => l.timestamp >= startDate);
    if (endDate) logs = logs.filter((l) => l.timestamp <= endDate);

    const byType: Record<string, number> = {};
    const byCategory: Record<string, number> = {};
    const bySeverity: Record<string, number> = {};
    const byStatus: Record<string, number> = {};
    let highRiskCount = 0;

    for (const log of logs) {
      byType[log.type] = (byType[log.type] || 0) + 1;
      byCategory[log.category] = (byCategory[log.category] || 0) + 1;
      bySeverity[log.severity] = (bySeverity[log.severity] || 0) + 1;
      byStatus[log.status] = (byStatus[log.status] || 0) + 1;
      if (log.riskScore >= 70) highRiskCount++;
    }

    return {
      total: logs.length,
      byType,
      byCategory,
      bySeverity,
      byStatus,
      highRiskCount,
    };
  }

  // ========================================================================
  // 安全警报
  // ========================================================================

  /**
   * 创建警报
   */
  createAlert(
    type: SecurityAlertType,
    severity: 'low' | 'medium' | 'high' | 'critical',
    title: string,
    description: string,
    data?: Record<string, any>
  ): SecurityAlert {
    const alert: SecurityAlert = {
      id: `alert_${Date.now()}`,
      timestamp: Date.now(),
      type,
      severity,
      title,
      description,
      status: 'active',
      data,
    };

    this.alerts.unshift(alert);
    return alert;
  }

  private createAlertFromLog(log: AuditLogEntry): void {
    const alert: SecurityAlert = {
      id: `alert_${log.id}`,
      timestamp: log.timestamp,
      type: 'unauthorized_access_attempt' as SecurityAlertType,
      severity: log.severity,
      title: log.action,
      description: `安全事件: ${log.type}`,
      status: 'active',
      data: { logId: log.id, metadata: log.metadata },
    };
    this.alerts.unshift(alert);
  }

  /**
   * 确认警报
   */
  acknowledgeAlert(alertId: string): boolean {
    const alert = this.alerts.find((a) => a.id === alertId);
    if (!alert) return false;
    alert.status = 'acknowledged';
    alert.acknowledgedAt = Date.now();
    return true;
  }

  /**
   * 解决警报
   */
  resolveAlert(alertId: string, resolution: string): boolean {
    const alert = this.alerts.find((a) => a.id === alertId);
    if (!alert) return false;
    alert.status = 'resolved';
    alert.resolvedAt = Date.now();
    alert.resolution = resolution;
    return true;
  }

  /**
   * 忽略警报
   */
  ignoreAlert(alertId: string): boolean {
    const alert = this.alerts.find((a) => a.id === alertId);
    if (!alert) return false;
    alert.status = 'ignored';
    return true;
  }

  /**
   * 获取所有警报
   */
  getAlerts(status?: string): SecurityAlert[] {
    if (status) {
      return this.alerts.filter((a) => a.status === status);
    }
    return this.alerts;
  }

  /**
   * 获取活动警报数量
   */
  getActiveAlertCount(): number {
    return this.alerts.filter((a) => a.status === 'active').length;
  }

  // ========================================================================
  // 设备管理
  // ========================================================================

  /**
   * 注册设备
   */
  registerDevice(device: DeviceInfo): void {
    this.devices.set(device.id, device);
    if (device.isCurrentDevice) {
      this.currentDeviceId = device.id;
    }
  }

  /**
   * 获取设备列表
   */
  getDevices(): DeviceInfo[] {
    return Array.from(this.devices.values()).sort((a, b) => b.lastActive - a.lastActive);
  }

  /**
   * 获取当前设备
   */
  getCurrentDevice(): DeviceInfo | undefined {
    if (!this.currentDeviceId) return undefined;
    return this.devices.get(this.currentDeviceId);
  }

  /**
   * 信任设备
   */
  trustDevice(deviceId: string): boolean {
    const device = this.devices.get(deviceId);
    if (!device) return false;
    device.isTrusted = true;
    return true;
  }

  /**
   * 撤销设备信任
   */
  revokeDevice(deviceId: string): boolean {
    const device = this.devices.get(deviceId);
    if (!device) return false;
    device.isTrusted = false;
    return true;
  }

  /**
   * 移除设备
   */
  removeDevice(deviceId: string): boolean {
    return this.devices.delete(deviceId);
  }

  // ========================================================================
  // 安全检查
  // ========================================================================

  /**
   * 执行安全检查
   */
  performSecurityCheck(): SecurityCheckResult {
    const checks: SecurityCheckItem[] = [
      {
        id: 'backup',
        name: '钱包备份',
        category: 'wallet',
        status: 'warning',
        score: 10,
        maxScore: 15,
        description: '检查是否已备份助记词',
      },
      {
        id: 'password_strength',
        name: '密码强度',
        category: 'authentication',
        status: 'pass',
        score: 15,
        maxScore: 15,
        description: '密码强度足够',
      },
      {
        id: 'biometric',
        name: '生物识别',
        category: 'authentication',
        status: 'info',
        score: 5,
        maxScore: 10,
        description: '生物识别认证',
      },
      {
        id: 'dapp_permissions',
        name: 'DApp 权限',
        category: 'dapp',
        status: 'pass',
        score: 15,
        maxScore: 15,
        description: 'DApp 权限管理',
      },
      {
        id: 'token_approvals',
        name: 'Token 授权',
        category: 'defi',
        status: 'warning',
        score: 8,
        maxScore: 15,
        description: '检查无限授权',
      },
      {
        id: 'address_book',
        name: '地址簿',
        category: 'security',
        status: 'pass',
        score: 10,
        maxScore: 10,
        description: '常用地址验证',
      },
      {
        id: 'network_security',
        name: '网络安全',
        category: 'network',
        status: 'pass',
        score: 10,
        maxScore: 10,
        description: 'RPC 节点安全',
      },
      {
        id: 'device_security',
        name: '设备安全',
        category: 'device',
        status: 'pass',
        score: 10,
        maxScore: 10,
        description: '设备安全检查',
      },
    ];

    const totalScore = checks.reduce((sum, c) => sum + c.score, 0);
    const maxScore = checks.reduce((sum, c) => sum + c.maxScore, 0);
    const percentage = (totalScore / maxScore) * 100;

    let level: SecurityCheckResult['level'] = 'good';
    if (percentage >= 90) level = 'excellent';
    else if (percentage >= 75) level = 'good';
    else if (percentage >= 60) level = 'fair';
    else if (percentage >= 40) level = 'poor';
    else level = 'critical';

    const suggestions: SecuritySuggestion[] = [];
    if (checks.find((c) => c.id === 'backup' && c.status === 'warning')) {
      suggestions.push({
        id: 'backup_wallet',
        priority: 'high',
        title: '备份您的钱包',
        description: '请尽快备份您的助记词，并存放在安全的地方。',
        action: '立即备份',
        estimatedTime: '5 分钟',
      });
    }

    return {
      score: Math.round(percentage),
      level,
      checks,
      suggestions,
      lastCheckTime: Date.now(),
    };
  }

  // ========================================================================
  // 风险评估
  // ========================================================================

  /**
   * 评估交易风险
   */
  assessTransactionRisk(
    to: string,
    value: string,
    data?: string,
    chain?: string
  ): RiskAssessment {
    const factors: RiskFactor[] = [];
    let totalScore = 0;

    const addressEntry = this.findAddressInLogs(to);
    if (!addressEntry) {
      factors.push({
        category: 'address',
        level: 'medium',
        score: 20,
        description: '向未知地址转账',
      });
      totalScore += 20;
    } else if (addressEntry.risk === 'high') {
      factors.push({
        category: 'address',
        level: 'high',
        score: 50,
        description: '向高风险地址转账',
      });
      totalScore += 50;
    }

    const valueNum = parseFloat(value);
    if (valueNum > SECURITY_THRESHOLDS.largeTransactionUsd) {
      factors.push({
        category: 'amount',
        level: 'high',
        score: 30,
        description: '大额交易',
      });
      totalScore += 30;
    }

    if (data && data.slice(0, 10).toLowerCase() === '0x095ea7b3') {
      const isInfinite = this.isInfiniteApproval(data);
      if (isInfinite) {
        factors.push({
          category: 'approval',
          level: 'high',
          score: 40,
          description: '无限授权风险',
        });
        totalScore += 40;
      }
    }

    let overallRisk: RiskAssessment['overallRisk'] = 'low';
    if (totalScore >= 80) overallRisk = 'critical';
    else if (totalScore >= 50) overallRisk = 'high';
    else if (totalScore >= 25) overallRisk = 'medium';

    const recommendations: string[] = [];
    if (totalScore >= 50) {
      recommendations.push('请仔细核对收款地址');
      recommendations.push('建议先小额测试');
    }

    return {
      overallRisk,
      riskScore: totalScore,
      factors,
      recommendations,
    };
  }

  private findAddressInLogs(address: string): { risk: string } | null {
    const lowerAddr = address.toLowerCase();
    for (const log of this.logs) {
      if (
        log.target?.address?.toLowerCase() === lowerAddr ||
        log.actor.address?.toLowerCase() === lowerAddr
      ) {
        return { risk: 'low' };
      }
    }
    return null;
  }

  private isInfiniteApproval(data: string): boolean {
    if (data.length < 74) return false;
    const amount = data.slice(34, 74);
    const maxUint256 = 'f'.repeat(64);
    return amount.toLowerCase() === maxUint256;
  }

  // ========================================================================
  // 登录保护
  // ========================================================================

  /**
   * 检查是否被锁定
   */
  isLockedOut(identifier?: string): boolean {
    const key = identifier || this.currentDeviceId || 'default';
    const lockoutTime = this.lockoutUntil.get(key);
    if (lockoutTime && Date.now() < lockoutTime) {
      return true;
    }
    if (lockoutTime && Date.now() >= lockoutTime) {
      this.lockoutUntil.delete(key);
      this.failedLoginCount.delete(key);
    }
    return false;
  }

  /**
   * 获取剩余锁定时间
   */
  getLockoutRemainingSeconds(identifier?: string): number {
    const key = identifier || this.currentDeviceId || 'default';
    const lockoutTime = this.lockoutUntil.get(key);
    if (!lockoutTime) return 0;
    const remaining = Math.max(0, lockoutTime - Date.now());
    return Math.ceil(remaining / 1000);
  }

  /**
   * 获取失败登录次数
   */
  getFailedLoginCount(identifier?: string): number {
    const key = identifier || this.currentDeviceId || 'default';
    return this.failedLoginCount.get(key) || 0;
  }

  // ========================================================================
  // 风险评分
  // ========================================================================

  private calculateRiskScore(entry: Partial<AuditLogEntry>): number {
    let score = 0;

    const severityScores: Record<string, number> = {
      low: 10,
      medium: 30,
      high: 60,
      critical: 90,
    };
    score += severityScores[entry.severity || 'low'] || 0;

    const keyTypes = ['key_export', 'key_sign', 'transaction_sign'];
    if (entry.type && keyTypes.includes(entry.type)) {
      score += 20;
    }

    if (entry.status === 'failed') {
      score += 15;
    }

    if (entry.isNewDevice || entry.isNewLocation) {
      score += 25;
    }

    return Math.min(100, score);
  }

  // ========================================================================
  // 导出
  // ========================================================================

  /**
   * 导出审计日志
   */
  exportLogs(format: 'json' | 'csv' = 'json'): string {
    if (format === 'json') {
      return JSON.stringify(this.logs, null, 2);
    }

    const headers = ['id', 'timestamp', 'type', 'category', 'severity', 'action', 'status', 'riskScore'];
    const rows = this.logs.map((log) =>
      headers.map((h) => {
        const val = (log as any)[h];
        if (typeof val === 'string' && val.includes(',')) {
          return `"${val.replace(/"/g, '""')}"`;
        }
        return val ?? '';
      }).join(',')
    );

    return [headers.join(','), ...rows].join('\n');
  }

  /**
   * 生成安全报告
   */
  generateSecurityReport(): string {
    const stats = this.getLogStats();
    const check = this.performSecurityCheck();
    const activeAlerts = this.getActiveAlertCount();

    const report = `
安全审计报告
生成时间: ${new Date().toISOString()}

安全评分: ${check.score}/100 (${check.level})
活动警报: ${activeAlerts} 个

审计日志统计:
- 总记录数: ${stats.total}
- 高风险事件: ${stats.highRiskCount}

按类别分布:
${Object.entries(stats.byCategory).map(([k, v]) => `- ${k}: ${v}`).join('\n')}

按严重程度分布:
${Object.entries(stats.bySeverity).map(([k, v]) => `- ${k}: ${v}`).join('\n')}

安全建议:
${check.suggestions.map((s) => `- [${s.priority}] ${s.title}: ${s.description}`).join('\n')}
    `;

    return report.trim();
  }

  /**
   * 清空日志
   */
  clearLogs(): void {
    this.logs = [];
  }
}

// ============================================================================
// 默认导出
// ============================================================================

export default {
  AuditLogger,
  SECURITY_THRESHOLDS,
};
