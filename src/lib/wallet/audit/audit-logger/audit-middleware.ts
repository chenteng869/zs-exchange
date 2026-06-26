/**
 * 审计中间件 (AuditMiddleware)
 *
 * 功能：
 *  - 请求审计：记录所有 API 请求和响应
 *  - 交易审计中间件：拦截并审计交易操作
 *  - 签名审计中间件：拦截并审计签名操作
 *  - 权限审计中间件：记录权限变更
 *  - 错误捕获和记录
 *  - 性能追踪
 *  - 上下文传递
 */

import {
  AuditAction,
  AuditStatus,
  AuditSeverity,
  AuditCategory,
  AuditLogEntry,
  AuditActor,
  AuditTarget,
  AuditLogMetadata,
  AuditSystemConfig,
  DEFAULT_AUDIT_CONFIG,
  AuditErrorCode,
  AuditError,
} from '../audit.types';
import { AuditLogger, LogEntryOptions } from './audit-logger';

// ============================================================================
// 中间件配置接口
// ============================================================================

export interface AuditMiddlewareConfig {
  enabled?: boolean;
  logRequests?: boolean;
  logResponses?: boolean;
  logErrors?: boolean;
  logPerformance?: boolean;
  captureRequestBody?: boolean;
  captureResponseBody?: boolean;
  maxBodySize?: number;
  sensitiveHeaders?: string[];
  sensitiveBodyFields?: string[];
  includeHeaders?: string[];
  excludePaths?: string[];
  includePaths?: string[];
  onRequest?: (context: AuditRequestContext) => void;
  onResponse?: (context: AuditRequestContext, entry: AuditLogEntry) => void;
  onError?: (context: AuditRequestContext, error: unknown) => void;
}

// ============================================================================
// 请求上下文接口
// ============================================================================

export interface AuditRequestContext {
  requestId: string;
  traceId: string;
  startTime: number;
  method?: string;
  url?: string;
  path?: string;
  headers?: Record<string, string | string[] | undefined>;
  body?: unknown;
  query?: Record<string, unknown>;
  params?: Record<string, string>;
  user?: {
    id?: string;
    walletId?: string;
    address?: string;
    role?: string;
  };
  ipAddress?: string;
  userAgent?: string;
  deviceId?: string;
  statusCode?: number;
  responseBody?: unknown;
  error?: unknown;
  durationMs?: number;
  metadata?: Record<string, unknown>;
}

// ============================================================================
// 审计中间件类
// ============================================================================

export class AuditMiddleware {
  private config: Required<AuditMiddlewareConfig>;
  private auditLogger: AuditLogger;
  private systemConfig: AuditSystemConfig;
  private activeRequests: Map<string, AuditRequestContext> = new Map();
  private requestCounter = 0;

  // ========================================================================
  // 构造函数
  // ========================================================================

  constructor(
    auditLogger: AuditLogger,
    config?: AuditMiddlewareConfig,
    systemConfig?: Partial<AuditSystemConfig>
  ) {
    this.auditLogger = auditLogger;
    this.systemConfig = { ...DEFAULT_AUDIT_CONFIG, ...systemConfig };

    this.config = {
      enabled: true,
      logRequests: true,
      logResponses: true,
      logErrors: true,
      logPerformance: true,
      captureRequestBody: false,
      captureResponseBody: false,
      maxBodySize: 1024 * 1024,
      sensitiveHeaders: ['authorization', 'cookie', 'x-api-key', 'x-auth-token'],
      sensitiveBodyFields: ['password', 'privateKey', 'mnemonic', 'seedPhrase', 'token', 'secret'],
      includeHeaders: [],
      excludePaths: ['/health', '/metrics', '/favicon.ico'],
      includePaths: [],
      onRequest: undefined,
      onResponse: undefined,
      onError: undefined,
      ...config,
    } as Required<AuditMiddlewareConfig>;
  }

  // ========================================================================
  // 请求审计方法
  // ========================================================================

  /**
   * 创建请求审计上下文
   */
  startRequest(context: Partial<AuditRequestContext> = {}): AuditRequestContext {
    const requestId = this.generateRequestId();
    const traceId = context.traceId || this.generateTraceId();

    const fullContext: AuditRequestContext = {
      requestId,
      traceId,
      startTime: Date.now(),
      method: context.method,
      url: context.url,
      path: context.path,
      headers: context.headers,
      body: this.config.captureRequestBody ? context.body : undefined,
      query: context.query,
      params: context.params,
      user: context.user,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      deviceId: context.deviceId,
      metadata: context.metadata || {},
    };

    this.activeRequests.set(requestId, fullContext);

    if (this.config.onRequest) {
      try {
        this.config.onRequest(fullContext);
      } catch (err) {
        console.error('[AuditMiddleware] onRequest callback error:', err);
      }
    }

    return fullContext;
  }

  /**
   * 完成请求并记录审计日志
   */
  endRequest(
    requestId: string,
    result: {
      statusCode?: number;
      responseBody?: unknown;
      error?: unknown;
      metadata?: Record<string, unknown>;
    } = {}
  ): AuditLogEntry | null {
    const context = this.activeRequests.get(requestId);
    if (!context) {
      return null;
    }

    context.statusCode = result.statusCode;
    context.responseBody = this.config.captureResponseBody ? result.responseBody : undefined;
    context.error = result.error;
    context.durationMs = Date.now() - context.startTime;
    context.metadata = { ...context.metadata, ...result.metadata };

    let entry: AuditLogEntry | null = null;

    if (result.error) {
      if (this.config.logErrors) {
        entry = this.logErrorRequest(context);
      }
    } else {
      if (this.config.logResponses) {
        entry = this.logSuccessRequest(context);
      }
    }

    if (this.config.onResponse && entry) {
      try {
        this.config.onResponse(context, entry);
      } catch (err) {
        console.error('[AuditMiddleware] onResponse callback error:', err);
      }
    }

    if (this.config.onError && result.error) {
      try {
        this.config.onError(context, result.error);
      } catch (err) {
        console.error('[AuditMiddleware] onError callback error:', err);
      }
    }

    this.activeRequests.delete(requestId);

    return entry;
  }

  /**
   * 记录成功请求
   */
  private logSuccessRequest(context: AuditRequestContext): AuditLogEntry {
    const action = this.determineActionFromRequest(context);
    const category = this.determineCategoryFromRequest(context);
    const severity = this.determineSeverityFromStatus(context.statusCode || 200);

    const logOptions: LogEntryOptions = {
      action,
      category,
      status: AuditStatus.COMPLETED,
      severity,
      actor: this.buildActorFromContext(context),
      target: this.buildTargetFromContext(context),
      description: `${context.method} ${context.path} - ${context.statusCode}`,
      metadata: this.buildRequestMetadata(context),
      requestId: context.requestId,
      traceId: context.traceId,
      durationMs: context.durationMs,
    };

    return this.auditLogger.log(logOptions);
  }

  /**
   * 记录错误请求
   */
  private logErrorRequest(context: AuditRequestContext): AuditLogEntry {
    const action = this.determineActionFromRequest(context);
    const category = this.determineCategoryFromRequest(context);

    const errorMessage = context.error instanceof Error ? context.error.message : String(context.error);
    const errorCode = context.error instanceof AuditError ? context.error.code : undefined;

    const logOptions: LogEntryOptions = {
      action,
      category,
      status: AuditStatus.FAILED,
      severity: AuditSeverity.HIGH,
      actor: this.buildActorFromContext(context),
      target: this.buildTargetFromContext(context),
      description: `${context.method} ${context.path} - ${context.statusCode || 500}: ${errorMessage}`,
      metadata: {
        ...this.buildRequestMetadata(context),
        error: errorMessage,
        errorStack: context.error instanceof Error ? context.error.stack : undefined,
      },
      requestId: context.requestId,
      traceId: context.traceId,
      durationMs: context.durationMs,
      errorCode,
      errorMessage,
    };

    return this.auditLogger.log(logOptions);
  }

  // ========================================================================
  // 交易审计中间件
  // ========================================================================

  /**
   * 创建交易审计中间件
   */
  createTransactionAuditMiddleware(): TransactionAuditMiddleware {
    return new TransactionAuditMiddleware(this.auditLogger);
  }

  /**
   * 创建签名审计中间件
   */
  createSignatureAuditMiddleware(): SignatureAuditMiddleware {
    return new SignatureAuditMiddleware(this.auditLogger);
  }

  /**
   * 创建权限审计中间件
   */
  createPermissionAuditMiddleware(): PermissionAuditMiddleware {
    return new PermissionAuditMiddleware(this.auditLogger);
  }

  // ========================================================================
  // Express/Next.js 风格中间件
  // ========================================================================

  /**
   * Express 风格中间件处理
   */
  expressMiddleware(): (req: unknown, res: unknown, next: () => void) => void {
    return (req: any, res: any, next: () => void) => {
      if (!this.config.enabled) {
        next();
        return;
      }

      const path = req.path || req.url?.split('?')[0];

      if (this.shouldSkipPath(path)) {
        next();
        return;
      }

      const context = this.startRequest({
        method: req.method,
        url: req.url,
        path,
        headers: req.headers,
        query: req.query,
        params: req.params,
        ipAddress: req.ip || req.headers?.['x-forwarded-for'] || req.connection?.remoteAddress,
        userAgent: req.headers?.['user-agent'],
        user: req.user,
        body: req.body,
      });

      const originalEnd = res.end;
      res.end = (chunk: any, encoding: any, callback: any) => {
        const statusCode = res.statusCode;
        let responseBody: unknown = undefined;

        if (this.config.captureResponseBody && chunk) {
          try {
            const bodyStr = typeof chunk === 'string' ? chunk : chunk?.toString('utf8');
            if (bodyStr && bodyStr.length < this.config.maxBodySize) {
              responseBody = this.safeParseJson(bodyStr);
            }
          } catch {
            responseBody = undefined;
          }
        }

        this.endRequest(context.requestId, {
          statusCode,
          responseBody,
        });

        return originalEnd.call(res, chunk, encoding, callback);
      };

      next();
    };
  }

  // ========================================================================
  // 工具方法
  // ========================================================================

  /**
   * 从请求推断动作类型
   */
  private determineActionFromRequest(context: AuditRequestContext): AuditAction {
    const path = context.path || '';
    const method = context.method?.toUpperCase() || '';

    if (path.includes('/wallet') || path.includes('/wallets')) {
      if (method === 'POST') return AuditAction.WALLET_CREATE;
      if (method === 'DELETE') return AuditAction.WALLET_DELETE;
      if (method === 'PUT' || method === 'PATCH') return AuditAction.WALLET_RENAME;
    }

    if (path.includes('/transaction') || path.includes('/transactions') || path.includes('/tx')) {
      if (method === 'POST') return AuditAction.TRANSACTION_BROADCAST;
      if (path.includes('/sign')) return AuditAction.SIGN_TRANSACTION;
    }

    if (path.includes('/sign')) {
      return AuditAction.SIGN_MESSAGE;
    }

    if (path.includes('/auth') || path.includes('/login')) {
      if (method === 'POST') return AuditAction.LOGIN_SUCCESS;
      if (method === 'DELETE') return AuditAction.LOGOUT;
    }

    if (path.includes('/dapp') || path.includes('/walletconnect')) {
      if (path.includes('/connect')) return AuditAction.DAPP_CONNECT;
      if (path.includes('/disconnect')) return AuditAction.DAPP_DISCONNECT;
    }

    if (path.includes('/permission') || path.includes('/role')) {
      if (method === 'POST' || method === 'PUT') return AuditAction.PERMISSION_GRANT;
      if (method === 'DELETE') return AuditAction.PERMISSION_REVOKE;
    }

    if (path.includes('/withdraw')) {
      return AuditAction.WITHDRAWAL_REQUEST;
    }

    if (path.includes('/deposit')) {
      return AuditAction.DEPOSIT_DETECTED;
    }

    if (path.includes('/swap') || path.includes('/trade')) {
      return AuditAction.SWAP_EXECUTE;
    }

    return AuditAction.CUSTOM_ACTION;
  }

  /**
   * 从请求推断类别
   */
  private determineCategoryFromRequest(context: AuditRequestContext): AuditCategory {
    const path = context.path || '';

    if (path.includes('/wallet') || path.includes('/wallets')) return AuditCategory.WALLET;
    if (path.includes('/transaction') || path.includes('/transactions') || path.includes('/tx')) return AuditCategory.TRANSACTION;
    if (path.includes('/sign')) return AuditCategory.SIGNATURE;
    if (path.includes('/auth') || path.includes('/login') || path.includes('/session')) return AuditCategory.AUTHENTICATION;
    if (path.includes('/dapp') || path.includes('/walletconnect')) return AuditCategory.DAPP;
    if (path.includes('/permission') || path.includes('/role') || path.includes('/admin')) return AuditCategory.PERMISSION;
    if (path.includes('/security') || path.includes('/alert')) return AuditCategory.SECURITY;
    if (path.includes('/compliance') || path.includes('/kyc') || path.includes('/aml')) return AuditCategory.COMPLIANCE;
    if (path.includes('/defi') || path.includes('/swap') || path.includes('/stake') || path.includes('/lending')) return AuditCategory.DEFI;
    if (path.includes('/nft')) return AuditCategory.NFT;
    if (path.includes('/withdraw') || path.includes('/deposit')) return AuditCategory.DEPOSIT_WITHDRAWAL;

    return AuditCategory.CUSTOM;
  }

  /**
   * 从状态码推断严重程度
   */
  private determineSeverityFromStatus(statusCode: number): AuditSeverity {
    if (statusCode >= 500) return AuditSeverity.HIGH;
    if (statusCode >= 400) return AuditSeverity.MEDIUM;
    if (statusCode >= 300) return AuditSeverity.LOW;
    return AuditSeverity.LOW;
  }

  /**
   * 从上下文构建参与者
   */
  private buildActorFromContext(context: AuditRequestContext): AuditActor {
    return {
      type: context.user?.role === 'admin' ? 'admin' : 'user',
      id: context.user?.id,
      userId: context.user?.id,
      walletId: context.user?.walletId,
      address: context.user?.address,
      role: context.user?.role,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      deviceId: context.deviceId,
    };
  }

  /**
   * 从上下文构建目标
   */
  private buildTargetFromContext(context: AuditRequestContext): AuditTarget | undefined {
    const path = context.path || '';

    if (path.includes('/wallet')) {
      return { type: 'wallet', id: context.params?.id };
    }
    if (path.includes('/transaction')) {
      return { type: 'transaction', id: context.params?.id };
    }
    if (path.includes('/dapp')) {
      return { type: 'dapp', name: context.params?.id };
    }

    return undefined;
  }

  /**
   * 构建请求元数据
   */
  private buildRequestMetadata(context: AuditRequestContext): AuditLogMetadata {
    const metadata: AuditLogMetadata = {
      method: context.method,
      path: context.path,
      url: context.url,
      statusCode: context.statusCode,
      durationMs: context.durationMs,
    };

    if (context.query) {
      metadata.query = context.query;
    }

    if (context.params) {
      metadata.params = context.params;
    }

    if (this.config.includeHeaders.length > 0 && context.headers) {
      const filteredHeaders: Record<string, string> = {};
      for (const header of this.config.includeHeaders) {
        const value = context.headers[header.toLowerCase()];
        if (value) {
          filteredHeaders[header] = Array.isArray(value) ? value.join(', ') : value;
        }
      }
      metadata.headers = filteredHeaders;
    }

    if (this.config.captureRequestBody && context.body) {
      metadata.requestBody = this.sanitizeBody(context.body);
    }

    if (this.config.captureResponseBody && context.responseBody) {
      metadata.responseBody = this.sanitizeBody(context.responseBody);
    }

    if (context.metadata) {
      metadata.custom = context.metadata;
    }

    return metadata;
  }

  /**
   * 检查是否应该跳过路径
   */
  private shouldSkipPath(path: string): boolean {
    if (this.config.includePaths.length > 0) {
      return !this.config.includePaths.some((p) => path.startsWith(p));
    }

    return this.config.excludePaths.some((p) => path.startsWith(p));
  }

  /**
   * 清洗请求体中的敏感字段
   */
  private sanitizeBody(body: unknown): unknown {
    if (!body || typeof body !== 'object') return body;

    const sanitized: Record<string, unknown> = {};
    const obj = body as Record<string, unknown>;

    for (const [key, value] of Object.entries(obj)) {
      if (this.config.sensitiveBodyFields.includes(key.toLowerCase())) {
        sanitized[key] = '***REDACTED***';
      } else if (value && typeof value === 'object' && !Array.isArray(value)) {
        sanitized[key] = this.sanitizeBody(value);
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  /**
   * 安全解析 JSON
   */
  private safeParseJson(str: string): unknown {
    try {
      return JSON.parse(str);
    } catch {
      return str;
    }
  }

  /**
   * 生成请求 ID
   */
  private generateRequestId(): string {
    const timestamp = Date.now().toString(36);
    const counter = (this.requestCounter++ % 1000000).toString(36).padStart(5, '0');
    const random = Math.random().toString(36).slice(2, 6);
    return `req_${timestamp}_${counter}_${random}`;
  }

  /**
   * 生成追踪 ID
   */
  private generateTraceId(): string {
    const timestamp = Date.now().toString(16).padStart(16, '0');
    const random = Array.from({ length: 16 }, () =>
      Math.floor(Math.random() * 16).toString(16)
    ).join('');
    return timestamp + random;
  }

  /**
   * 获取活跃请求数量
   */
  getActiveRequestCount(): number {
    return this.activeRequests.size;
  }

  /**
   * 获取所有活跃请求
   */
  getActiveRequests(): AuditRequestContext[] {
    return Array.from(this.activeRequests.values());
  }
}

// ============================================================================
// 交易审计中间件
// ============================================================================

export class TransactionAuditMiddleware {
  private auditLogger: AuditLogger;
  private pendingTransactions: Map<string, AuditLogEntry> = new Map();

  constructor(auditLogger: AuditLogger) {
    this.auditLogger = auditLogger;
  }

  /**
   * 记录交易开始
   */
  startTransaction(
    txId: string,
    walletId: string,
    userId: string,
    chainId: string,
    action: AuditAction = AuditAction.TRANSACTION_BUILD,
    metadata?: AuditLogMetadata
  ): AuditLogEntry {
    const entry = this.auditLogger.log({
      action,
      category: AuditCategory.TRANSACTION,
      status: AuditStatus.PENDING,
      severity: AuditSeverity.MEDIUM,
      actor: { type: 'user', userId, walletId },
      target: { type: 'transaction', id: txId, chainId },
      description: `交易开始: ${action}`,
      metadata,
      requestId: txId,
      chainId,
    });

    this.pendingTransactions.set(txId, entry);
    return entry;
  }

  /**
   * 记录交易完成
   */
  completeTransaction(
    txId: string,
    txHash: string,
    status: AuditStatus = AuditStatus.COMPLETED,
    metadata?: AuditLogMetadata
  ): AuditLogEntry | null {
    const pending = this.pendingTransactions.get(txId);
    if (!pending) return null;

    const entry = this.auditLogger.log({
      action: pending.action,
      category: AuditCategory.TRANSACTION,
      status,
      severity: status === AuditStatus.FAILED ? AuditSeverity.HIGH : AuditSeverity.MEDIUM,
      actor: pending.actor,
      target: { type: 'transaction', id: txHash, chainId: pending.chainId },
      description: `交易${status === AuditStatus.COMPLETED ? '成功' : '失败'}`,
      metadata,
      relatedLogIds: [pending.id],
      txHash,
      chainId: pending.chainId,
      traceId: pending.traceId,
    });

    this.pendingTransactions.delete(txId);
    return entry;
  }

  /**
   * 记录交易失败
   */
  failTransaction(
    txId: string,
    errorMessage: string,
    errorCode?: string,
    metadata?: AuditLogMetadata
  ): AuditLogEntry | null {
    return this.completeTransaction(txId, txId, AuditStatus.FAILED, {
      ...metadata,
      error: errorMessage,
      errorCode,
    });
  }

  /**
   * 获取待处理交易数量
   */
  getPendingCount(): number {
    return this.pendingTransactions.size;
  }
}

// ============================================================================
// 签名审计中间件
// ============================================================================

export class SignatureAuditMiddleware {
  private auditLogger: AuditLogger;

  constructor(auditLogger: AuditLogger) {
    this.auditLogger = auditLogger;
  }

  /**
   * 记录签名请求
   */
  recordSignatureRequest(
    walletId: string,
    userId: string,
    signerAddress: string,
    signType: string,
    dataHash: string,
    dappUrl?: string,
    metadata?: AuditLogMetadata
  ): AuditLogEntry {
    return this.auditLogger.log({
      action: AuditAction.SIGN_MESSAGE,
      category: AuditCategory.SIGNATURE,
      status: AuditStatus.PENDING,
      severity: AuditSeverity.HIGH,
      actor: { type: 'user', userId, walletId, address: signerAddress, dappUrl },
      target: { type: 'wallet', id: walletId, address: signerAddress },
      description: `签名请求: ${signType}`,
      metadata: {
        signType,
        dataHash,
        dappUrl,
        ...metadata,
      },
    });
  }

  /**
   * 记录签名结果
   */
  recordSignatureResult(
    requestId: string,
    signature: string,
    success: boolean,
    errorMessage?: string,
    durationMs?: number
  ): AuditLogEntry {
    return this.auditLogger.log({
      action: AuditAction.SIGN_MESSAGE,
      category: AuditCategory.SIGNATURE,
      status: success ? AuditStatus.COMPLETED : AuditStatus.FAILED,
      severity: success ? AuditSeverity.HIGH : AuditSeverity.CRITICAL,
      actor: { type: 'user' },
      description: success ? '签名成功' : `签名失败: ${errorMessage}`,
      metadata: {
        signature: success ? signature : undefined,
        error: errorMessage,
        durationMs,
      },
      relatedLogIds: [requestId],
      durationMs,
      errorMessage: success ? undefined : errorMessage,
    });
  }
}

// ============================================================================
// 权限审计中间件
// ============================================================================

export class PermissionAuditMiddleware {
  private auditLogger: AuditLogger;

  constructor(auditLogger: AuditLogger) {
    this.auditLogger = auditLogger;
  }

  /**
   * 记录权限授予
   */
  recordPermissionGrant(
    adminUserId: string,
    targetUserId: string,
    permission: string,
    scope?: string,
    metadata?: AuditLogMetadata
  ): AuditLogEntry {
    return this.auditLogger.log({
      action: AuditAction.PERMISSION_GRANT,
      category: AuditCategory.PERMISSION,
      status: AuditStatus.COMPLETED,
      severity: AuditSeverity.HIGH,
      actor: { type: 'admin', userId: adminUserId },
      target: { type: 'account', id: targetUserId },
      description: `授予权限: ${permission}`,
      metadata: {
        permission,
        scope,
        ...metadata,
      },
    });
  }

  /**
   * 记录权限撤销
   */
  recordPermissionRevoke(
    adminUserId: string,
    targetUserId: string,
    permission: string,
    reason?: string,
    metadata?: AuditLogMetadata
  ): AuditLogEntry {
    return this.auditLogger.log({
      action: AuditAction.PERMISSION_REVOKE,
      category: AuditCategory.PERMISSION,
      status: AuditStatus.COMPLETED,
      severity: AuditSeverity.HIGH,
      actor: { type: 'admin', userId: adminUserId },
      target: { type: 'account', id: targetUserId },
      description: `撤销权限: ${permission}`,
      metadata: {
        permission,
        reason,
        ...metadata,
      },
    });
  }

  /**
   * 记录角色分配
   */
  recordRoleAssign(
    adminUserId: string,
    targetUserId: string,
    role: string,
    metadata?: AuditLogMetadata
  ): AuditLogEntry {
    return this.auditLogger.log({
      action: AuditAction.ROLE_ASSIGN,
      category: AuditCategory.PERMISSION,
      status: AuditStatus.COMPLETED,
      severity: AuditSeverity.HIGH,
      actor: { type: 'admin', userId: adminUserId },
      target: { type: 'account', id: targetUserId },
      description: `分配角色: ${role}`,
      metadata: {
        role,
        ...metadata,
      },
    });
  }

  /**
   * 记录角色撤销
   */
  recordRoleRevoke(
    adminUserId: string,
    targetUserId: string,
    role: string,
    reason?: string,
    metadata?: AuditLogMetadata
  ): AuditLogEntry {
    return this.auditLogger.log({
      action: AuditAction.ROLE_REVOKE,
      category: AuditCategory.PERMISSION,
      status: AuditStatus.COMPLETED,
      severity: AuditSeverity.HIGH,
      actor: { type: 'admin', userId: adminUserId },
      target: { type: 'account', id: targetUserId },
      description: `撤销角色: ${role}`,
      metadata: {
        role,
        reason,
        ...metadata,
      },
    });
  }
}

// ============================================================================
// 默认导出
// ============================================================================

export default AuditMiddleware;
