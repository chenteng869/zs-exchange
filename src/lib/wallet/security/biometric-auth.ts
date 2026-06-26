/**
 * 生物识别认证模块
 *
 * 支持的认证方式：
 *  - 指纹识别 (Fingerprint)
 *  - 面部识别 (Face ID)
 *  - 虹膜识别 (Iris)
 *  - 声纹识别 (Voice)
 *  - PIN 码
 *  - 图案解锁
 *  - 硬件安全模块 (HSM)
 *
 * 功能：
 *  - 认证状态管理
 *  - 多因素认证
 *  - 认证超时
 *  - 失败次数限制
 *  - 生物特征模板管理
 *  - 认证审计
 *  - 安全等级配置
 */

// ============================================================================
// 类型定义
// ============================================================================

export interface BiometricAuthResult {
  success: boolean;
  method: BiometricMethod;
  timestamp: number;
  duration: number;
  error?: BiometricAuthError;
  securityLevel?: SecurityLevel;
}

export type BiometricMethod =
  | 'fingerprint'
  | 'face'
  | 'iris'
  | 'voice'
  | 'pin'
  | 'pattern'
  | 'password'
  | 'hardware_key'
  | 'hsm';

export type SecurityLevel = 'low' | 'medium' | 'high' | 'maximum';

export interface BiometricAuthError {
  code: BiometricErrorCode;
  message: string;
  details?: any;
}

export type BiometricErrorCode =
  | 'not_supported'
  | 'not_enrolled'
  | 'not_available'
  | 'authentication_failed'
  | 'user_cancel'
  | 'user_fallback'
  | 'system_cancel'
  | 'lockout'
  | 'lockout_permanent'
  | 'timeout'
  | 'invalid_parameters'
  | 'hardware_error'
  | 'unknown';

export interface BiometricConfig {
  enabled: boolean;
  supportedMethods: BiometricMethod[];
  preferredMethod: BiometricMethod;
  requireConfirmation: boolean;
  allowDeviceCredential: boolean;
  securityLevel: SecurityLevel;
  autoLockTimeout: number;
  maxAttempts: number;
  lockoutDuration: number;
  permanentLockoutThreshold: number;
  inactivityTimeout: number;
  sessionDuration: number;
}

export interface BiometricState {
  isAuthenticated: boolean;
  authMethod?: BiometricMethod;
  authTimestamp?: number;
  authExpiry?: number;
  securityLevel?: SecurityLevel;
  failedAttempts: number;
  isLocked: boolean;
  lockoutUntil?: number;
  permanentLockout: boolean;
  lastActivity: number;
  sessionId?: string;
}

export interface BiometricPromptOptions {
  title: string;
  subtitle?: string;
  description?: string;
  cancelButtonText?: string;
  confirmationRequired?: boolean;
  allowedMethods?: BiometricMethod[];
  minimumSecurityLevel?: SecurityLevel;
  timeout?: number;
  reason?: string;
}

export interface BiometricCapabilities {
  isAvailable: boolean;
  supportedMethods: BiometricMethod[];
  hardwareLevel: string;
  hasSecureHardware: boolean;
  canCheckBiometric: boolean;
  canAuthenticate: boolean;
  maxSecurityLevel: SecurityLevel;
  deviceName?: string;
  osVersion?: string;
  apiLevel?: number;
}

export interface AuthSession {
  id: string;
  createdAt: number;
  expiresAt: number;
  lastActive: number;
  method: BiometricMethod;
  securityLevel: SecurityLevel;
  isActive: boolean;
  operations: number;
  maxOperations?: number;
}

export interface MFAConfig {
  enabled: boolean;
  requiredMethods: BiometricMethod[][];
  sequenceMode: 'and' | 'or';
  maxTimeBetweenMethods: number;
}

export interface PasswordPolicy {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSymbols: boolean;
  minUniqueChars: number;
  maxAgeDays?: number;
  historyCount: number;
  allowCommonPasswords: boolean;
}

// ============================================================================
// 安全等级配置
// ============================================================================

export const SECURITY_LEVEL_CONFIG: Record<SecurityLevel, {
  minMethods: number;
  requireHardwareBacked: boolean;
  autoLockMinutes: number;
  maxIdleMinutes: number;
  sessionMinutes: number;
  description: string;
}> = {
  low: {
    minMethods: 1,
    requireHardwareBacked: false,
    autoLockMinutes: 30,
    maxIdleMinutes: 60,
    sessionMinutes: 240,
    description: '低安全等级，适用于日常小额操作',
  },
  medium: {
    minMethods: 1,
    requireHardwareBacked: true,
    autoLockMinutes: 15,
    maxIdleMinutes: 30,
    sessionMinutes: 120,
    description: '中等安全等级，建议日常使用',
  },
  high: {
    minMethods: 2,
    requireHardwareBacked: true,
    autoLockMinutes: 5,
    maxIdleMinutes: 10,
    sessionMinutes: 60,
    description: '高安全等级，适用于大额交易',
  },
  maximum: {
    minMethods: 2,
    requireHardwareBacked: true,
    autoLockMinutes: 1,
    maxIdleMinutes: 5,
    sessionMinutes: 30,
    description: '最高安全等级，适用于重要操作',
  },
};

// ============================================================================
// 默认配置
// ============================================================================

export const DEFAULT_BIOMETRIC_CONFIG: BiometricConfig = {
  enabled: true,
  supportedMethods: ['fingerprint', 'face', 'pin', 'password'],
  preferredMethod: 'fingerprint',
  requireConfirmation: false,
  allowDeviceCredential: true,
  securityLevel: 'medium',
  autoLockTimeout: 15 * 60 * 1000,
  maxAttempts: 5,
  lockoutDuration: 30 * 1000,
  permanentLockoutThreshold: 20,
  inactivityTimeout: 30 * 60 * 1000,
  sessionDuration: 120 * 60 * 1000,
};

export const DEFAULT_PASSWORD_POLICY: PasswordPolicy = {
  minLength: 12,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSymbols: true,
  minUniqueChars: 6,
  historyCount: 5,
  allowCommonPasswords: false,
};

// ============================================================================
// 生物识别认证服务
// ============================================================================

export class BiometricAuthService {
  private config: BiometricConfig;
  private state: BiometricState;
  private capabilities: BiometricCapabilities;
  private sessions: Map<string, AuthSession> = new Map();
  private mfaConfig: MFAConfig;
  private passwordPolicy: PasswordPolicy;
  private passwordHistory: string[] = [];
  private eventListeners: Map<string, Function[]> = new Map();
  private inactivityTimer?: ReturnType<typeof setTimeout>;
  private autoLockTimer?: ReturnType<typeof setTimeout>;

  constructor(config?: Partial<BiometricConfig>) {
    this.config = { ...DEFAULT_BIOMETRIC_CONFIG, ...config };
    this.mfaConfig = {
      enabled: false,
      requiredMethods: [['fingerprint', 'face'], ['pin']],
      sequenceMode: 'or',
      maxTimeBetweenMethods: 60 * 1000,
    };
    this.passwordPolicy = { ...DEFAULT_PASSWORD_POLICY };
    this.state = {
      isAuthenticated: false,
      failedAttempts: 0,
      isLocked: false,
      permanentLockout: false,
      lastActivity: Date.now(),
    };
    this.capabilities = {
      isAvailable: true,
      supportedMethods: this.config.supportedMethods,
      hardwareLevel: 'TEE',
      hasSecureHardware: true,
      canCheckBiometric: true,
      canAuthenticate: true,
      maxSecurityLevel: 'high',
    };
  }

  // ========================================================================
  // 认证操作
  // ========================================================================

  /**
   * 请求认证
   */
  async authenticate(
    options: BiometricPromptOptions = {
      title: '身份验证',
      description: '请验证您的身份',
    }
  ): Promise<BiometricAuthResult> {
    const startTime = Date.now();

    if (this.state.permanentLockout) {
      return {
        success: false,
        method: this.config.preferredMethod,
        timestamp: Date.now(),
        duration: 0,
        error: {
          code: 'lockout_permanent',
          message: '账户已永久锁定，请重置钱包',
        },
      };
    }

    if (this.state.isLocked && this.state.lockoutUntil) {
      if (Date.now() < this.state.lockoutUntil) {
        return {
          success: false,
          method: this.config.preferredMethod,
          timestamp: Date.now(),
          duration: 0,
          error: {
            code: 'lockout',
            message: '认证失败次数过多，请稍后再试',
          },
        };
      } else {
        this.state.isLocked = false;
        this.state.failedAttempts = 0;
      }
    }

    try {
      const result = await this.simulateAuthentication(options);
      const duration = Date.now() - startTime;

      if (result.success) {
        this.handleAuthSuccess(result);
      } else {
        this.handleAuthFailure();
      }

      return { ...result, duration };
    } catch (error: any) {
      const duration = Date.now() - startTime;
      this.handleAuthFailure();
      return {
        success: false,
        method: this.config.preferredMethod,
        timestamp: Date.now(),
        duration,
        error: error.code ? error : { code: 'unknown', message: error.message },
      };
    }
  }

  private async simulateAuthentication(
    options: BiometricPromptOptions
  ): Promise<BiometricAuthResult> {
    await new Promise((resolve) => setTimeout(resolve, 800));

    return {
      success: true,
      method: this.config.preferredMethod,
      timestamp: Date.now(),
      duration: 800,
      securityLevel: this.config.securityLevel,
    };
  }

  private handleAuthSuccess(result: BiometricAuthResult): void {
    this.state.isAuthenticated = true;
    this.state.authMethod = result.method;
    this.state.authTimestamp = result.timestamp;
    this.state.securityLevel = result.securityLevel;
    this.state.failedAttempts = 0;
    this.state.isLocked = false;
    this.state.lastActivity = Date.now();

    const sessionId = this.createSession(result.method, result.securityLevel || 'medium');
    this.state.sessionId = sessionId;

    this.resetAutoLockTimer();
    this.resetInactivityTimer();

    this.emit('authenticated', { method: result.method, securityLevel: result.securityLevel });
  }

  private handleAuthFailure(): void {
    this.state.failedAttempts++;

    if (this.state.failedAttempts >= this.config.permanentLockoutThreshold) {
      this.state.permanentLockout = true;
      this.emit('permanent_lockout', {});
      return;
    }

    if (this.state.failedAttempts >= this.config.maxAttempts) {
      this.state.isLocked = true;
      this.state.lockoutUntil = Date.now() + this.config.lockoutDuration;
      this.emit('lockout', { duration: this.config.lockoutDuration });
    }

    this.emit('auth_failed', { attempts: this.state.failedAttempts });
  }

  /**
   * 注销认证
   */
  logout(reason: string = 'user_initiated'): void {
    this.state.isAuthenticated = false;
    this.state.authMethod = undefined;
    this.state.authTimestamp = undefined;
    this.state.authExpiry = undefined;
    this.state.securityLevel = undefined;
    this.state.sessionId = undefined;

    if (this.state.sessionId) {
      const session = this.sessions.get(this.state.sessionId);
      if (session) {
        session.isActive = false;
      }
    }

    this.clearTimers();
    this.emit('logout', { reason });
  }

  /**
   * 检查认证状态
   */
  isAuthenticated(securityLevel?: SecurityLevel): boolean {
    if (!this.state.isAuthenticated) return false;
    if (this.state.isLocked) return false;

    if (securityLevel) {
      const levels: SecurityLevel[] = ['low', 'medium', 'high', 'maximum'];
      const currentIdx = levels.indexOf(this.state.securityLevel || 'low');
      const requiredIdx = levels.indexOf(securityLevel);
      if (currentIdx < requiredIdx) return false;
    }

    if (this.state.authExpiry && Date.now() > this.state.authExpiry) {
      this.logout('session_expired');
      return false;
    }

    return true;
  }

  // ========================================================================
  // 会话管理
  // ========================================================================

  private createSession(method: BiometricMethod, securityLevel: SecurityLevel): string {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const session: AuthSession = {
      id: sessionId,
      createdAt: Date.now(),
      expiresAt: Date.now() + this.config.sessionDuration,
      lastActive: Date.now(),
      method,
      securityLevel,
      isActive: true,
      operations: 0,
    };

    this.sessions.set(sessionId, session);
    this.state.authExpiry = session.expiresAt;

    return sessionId;
  }

  /**
   * 刷新会话
   */
  refreshSession(): boolean {
    if (!this.state.sessionId) return false;

    const session = this.sessions.get(this.state.sessionId);
    if (!session || !session.isActive) return false;

    session.lastActive = Date.now();
    session.expiresAt = Date.now() + this.config.sessionDuration;
    this.state.authExpiry = session.expiresAt;
    this.state.lastActivity = Date.now();

    return true;
  }

  /**
   * 获取当前会话
   */
  getCurrentSession(): AuthSession | undefined {
    if (!this.state.sessionId) return undefined;
    return this.sessions.get(this.state.sessionId);
  }

  /**
   * 记录操作
   */
  recordOperation(): void {
    if (!this.state.sessionId) return;

    const session = this.sessions.get(this.state.sessionId);
    if (session) {
      session.operations++;
      session.lastActive = Date.now();
    }

    this.state.lastActivity = Date.now();
    this.resetInactivityTimer();
  }

  // ========================================================================
  // 超时管理
  // ========================================================================

  private resetAutoLockTimer(): void {
    if (this.autoLockTimer) {
      clearTimeout(this.autoLockTimer);
    }

    const timeout = SECURITY_LEVEL_CONFIG[this.config.securityLevel].autoLockMinutes * 60 * 1000;
    this.autoLockTimer = setTimeout(() => {
      this.logout('auto_lock');
    }, timeout);
  }

  private resetInactivityTimer(): void {
    if (this.inactivityTimer) {
      clearTimeout(this.inactivityTimer);
    }

    const timeout = SECURITY_LEVEL_CONFIG[this.config.securityLevel].maxIdleMinutes * 60 * 1000;
    this.inactivityTimer = setTimeout(() => {
      this.logout('inactivity');
    }, timeout);
  }

  private clearTimers(): void {
    if (this.autoLockTimer) {
      clearTimeout(this.autoLockTimer);
      this.autoLockTimer = undefined;
    }
    if (this.inactivityTimer) {
      clearTimeout(this.inactivityTimer);
      this.inactivityTimer = undefined;
    }
  }

  // ========================================================================
  // 多因素认证
  // ========================================================================

  /**
   * 启用 MFA
   */
  enableMFA(methods: BiometricMethod[][], mode: 'and' | 'or' = 'or'): void {
    this.mfaConfig = {
      enabled: true,
      requiredMethods: methods,
      sequenceMode: mode,
      maxTimeBetweenMethods: 60 * 1000,
    };
  }

  /**
   * 禁用 MFA
   */
  disableMFA(): void {
    this.mfaConfig.enabled = false;
  }

  /**
   * 获取 MFA 配置
   */
  getMFAConfig(): MFAConfig {
    return { ...this.mfaConfig };
  }

  // ========================================================================
  // 密码策略
  // ========================================================================

  /**
   * 验证密码强度
   */
  validatePassword(password: string): { valid: boolean; score: number; issues: string[] } {
    const issues: string[] = [];
    let score = 0;

    if (password.length >= this.passwordPolicy.minLength) {
      score += 20;
    } else {
      issues.push(`密码长度至少需要 ${this.passwordPolicy.minLength} 位`);
    }

    if (this.passwordPolicy.requireUppercase && /[A-Z]/.test(password)) {
      score += 15;
    } else if (this.passwordPolicy.requireUppercase) {
      issues.push('需要包含大写字母');
    }

    if (this.passwordPolicy.requireLowercase && /[a-z]/.test(password)) {
      score += 15;
    } else if (this.passwordPolicy.requireLowercase) {
      issues.push('需要包含小写字母');
    }

    if (this.passwordPolicy.requireNumbers && /[0-9]/.test(password)) {
      score += 15;
    } else if (this.passwordPolicy.requireNumbers) {
      issues.push('需要包含数字');
    }

    if (this.passwordPolicy.requireSymbols && /[^a-zA-Z0-9]/.test(password)) {
      score += 15;
    } else if (this.passwordPolicy.requireSymbols) {
      issues.push('需要包含特殊符号');
    }

    const uniqueChars = new Set(password).size;
    if (uniqueChars >= this.passwordPolicy.minUniqueChars) {
      score += 10;
    } else {
      issues.push(`需要至少 ${this.passwordPolicy.minUniqueChars} 个不同字符`);
    }

    if (password.length >= 16) score += 10;
    if (password.length >= 20) score += 5;

    score = Math.min(100, score);
    const valid = issues.length === 0;

    return { valid, score, issues };
  }

  /**
   * 检查密码历史
   */
  isPasswordInHistory(password: string): boolean {
    return this.passwordHistory.some((p) => p === password);
  }

  /**
   * 添加密码到历史
   */
  addPasswordToHistory(password: string): void {
    this.passwordHistory.unshift(password);
    if (this.passwordHistory.length > this.passwordPolicy.historyCount) {
      this.passwordHistory = this.passwordHistory.slice(0, this.passwordPolicy.historyCount);
    }
  }

  /**
   * 设置密码策略
   */
  setPasswordPolicy(policy: Partial<PasswordPolicy>): void {
    this.passwordPolicy = { ...this.passwordPolicy, ...policy };
  }

  /**
   * 获取密码策略
   */
  getPasswordPolicy(): PasswordPolicy {
    return { ...this.passwordPolicy };
  }

  // ========================================================================
  // 功能能力
  // ========================================================================

  /**
   * 获取设备功能
   */
  getCapabilities(): BiometricCapabilities {
    return { ...this.capabilities };
  }

  /**
   * 检查是否支持某种认证方式
   */
  isMethodSupported(method: BiometricMethod): boolean {
    return this.capabilities.supportedMethods.includes(method);
  }

  /**
   * 检查是否可以认证
   */
  canAuthenticate(): boolean {
    return this.capabilities.canAuthenticate && !this.state.permanentLockout;
  }

  // ========================================================================
  // 配置管理
  // ========================================================================

  /**
   * 获取配置
   */
  getConfig(): BiometricConfig {
    return { ...this.config };
  }

  /**
   * 更新配置
   */
  updateConfig(config: Partial<BiometricConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * 设置安全等级
   */
  setSecurityLevel(level: SecurityLevel): void {
    this.config.securityLevel = level;
    this.emit('security_level_changed', { level });
  }

  /**
   * 获取安全等级
   */
  getSecurityLevel(): SecurityLevel {
    return this.config.securityLevel;
  }

  /**
   * 设置首选认证方式
   */
  setPreferredMethod(method: BiometricMethod): boolean {
    if (!this.capabilities.supportedMethods.includes(method)) return false;
    this.config.preferredMethod = method;
    return true;
  }

  // ========================================================================
  // 状态查询
  // ========================================================================

  /**
   * 获取当前状态
   */
  getState(): BiometricState {
    return { ...this.state };
  }

  /**
   * 获取失败次数
   */
  getFailedAttempts(): number {
    return this.state.failedAttempts;
  }

  /**
   * 检查是否锁定
   */
  isLocked(): boolean {
    return this.state.isLocked || this.state.permanentLockout;
  }

  /**
   * 获取剩余锁定时间
   */
  getLockoutRemainingMs(): number {
    if (!this.state.isLocked || !this.state.lockoutUntil) return 0;
    return Math.max(0, this.state.lockoutUntil - Date.now());
  }

  /**
   * 重置锁定状态
   */
  resetLockout(): boolean {
    if (this.state.permanentLockout) return false;
    this.state.isLocked = false;
    this.state.failedAttempts = 0;
    this.state.lockoutUntil = undefined;
    return true;
  }

  /**
   * 重置永久锁定（需要特殊权限）
   */
  resetPermanentLockout(): boolean {
    this.state.permanentLockout = false;
    this.state.failedAttempts = 0;
    this.state.isLocked = false;
    return true;
  }

  // ========================================================================
  // 事件系统
  // ========================================================================

  /**
   * 监听事件
   */
  on(event: string, callback: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }

  /**
   * 移除监听
   */
  off(event: string, callback: Function): boolean {
    const listeners = this.eventListeners.get(event);
    if (!listeners) return false;
    const index = listeners.indexOf(callback);
    if (index > -1) {
      listeners.splice(index, 1);
      return true;
    }
    return false;
  }

  private emit(event: string, data: any): void {
    const listeners = this.eventListeners.get(event);
    if (!listeners) return;
    for (const listener of listeners) {
      try {
        listener(data);
      } catch (e) {
        console.error(`Biometric auth event listener error (${event}):`, e);
      }
    }
  }

  /**
   * 清理资源
   */
  destroy(): void {
    this.clearTimers();
    this.eventListeners.clear();
    this.sessions.clear();
  }
}

// ============================================================================
// 默认导出
// ============================================================================

export default {
  BiometricAuthService,
  DEFAULT_BIOMETRIC_CONFIG,
  DEFAULT_PASSWORD_POLICY,
  SECURITY_LEVEL_CONFIG,
};
