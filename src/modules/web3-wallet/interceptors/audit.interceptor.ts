/**
 * Web3 钱包模块 - 审计拦截器
 *
 * 提供审计日志自动记录功能
 * 自动拦截 Controller 层的操作，记录审计日志
 */

import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { AuditService } from '../services/audit.service';
import { AuditLogType, OperationStatus } from '../dto/audit.dto';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditInterceptor.name);

  constructor(private readonly auditService: AuditService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const method = request.method;
    const url = request.url;
    const now = Date.now();

    const auditInfo = this.extractAuditInfo(request, context);

    return next.handle().pipe(
      tap(async (data) => {
        const duration = Date.now() - now;
        try {
          await this.recordAuditLog({
            ...auditInfo,
            status: OperationStatus.SUCCESS,
            duration,
            responseData: this.sanitizeData(data),
          });
        } catch (error) {
          this.logger.error('Failed to record audit log:', error);
        }
      }),
      catchError(async (error) => {
        const duration = Date.now() - now;
        try {
          await this.recordAuditLog({
            ...auditInfo,
            status: OperationStatus.FAILED,
            duration,
            errorMessage: error.message,
            errorCode: error.status,
          });
        } catch (logError) {
          this.logger.error('Failed to record error audit log:', logError);
        }
        throw error;
      }),
    );
  }

  /**
   * 提取审计信息
   */
  private extractAuditInfo(request: any, context: ExecutionContext): AuditLogInfo {
    const handler = context.getHandler();
    const className = context.getClass().name;
    const methodName = handler.name;

    const userId = request.user?.userId || this.getUserIdFromRequest(request);
    const ip = this.getClientIp(request);
    const userAgent = request.headers['user-agent'];

    const action = this.determineAction(className, methodName, request.method);
    const logType = this.determineLogType(className);
    const resourceType = this.determineResourceType(className);
    const resourceId = this.extractResourceId(request);
    const description = this.generateDescription(className, methodName, request);

    return {
      userId,
      action,
      logType,
      status: OperationStatus.PENDING,
      resourceType,
      resourceId,
      description,
      ip,
      userAgent,
      requestMethod: request.method,
      requestUrl: request.url,
      requestParams: this.sanitizeData(request.params),
      requestQuery: this.sanitizeData(request.query),
      requestBody: this.sanitizeRequestBody(request.body),
      className,
      methodName,
    };
  }

  /**
   * 记录审计日志
   */
  private async recordAuditLog(auditInfo: AuditLogInfo): Promise<void> {
    try {
      await this.auditService.createAuditLog({
        userId: auditInfo.userId,
        action: auditInfo.action,
        logType: auditInfo.logType,
        status: auditInfo.status,
        resourceType: auditInfo.resourceType,
        resourceId: auditInfo.resourceId,
        description: auditInfo.description,
        ip: auditInfo.ip,
        userAgent: auditInfo.userAgent,
        metadata: {
          requestMethod: auditInfo.requestMethod,
          requestUrl: auditInfo.requestUrl,
          requestParams: auditInfo.requestParams,
          requestQuery: auditInfo.requestQuery,
          requestBody: auditInfo.requestBody,
          duration: auditInfo.duration,
          errorMessage: auditInfo.errorMessage,
          errorCode: auditInfo.errorCode,
          responseData: auditInfo.responseData,
          className: auditInfo.className,
          methodName: auditInfo.methodName,
        },
      });
    } catch (error) {
      this.logger.error('Failed to create audit log:', error);
    }
  }

  /**
   * 从请求中获取用户ID
   */
  private getUserIdFromRequest(request: any): string | undefined {
    if (request.headers['x-user-id']) {
      return request.headers['x-user-id'];
    }
    return undefined;
  }

  /**
   * 获取客户端 IP
   */
  private getClientIp(request: any): string {
    const xForwardedFor = request.headers['x-forwarded-for'];
    if (xForwardedFor) {
      const ips = xForwardedFor.split(',');
      return ips[0].trim();
    }

    const xRealIp = request.headers['x-real-ip'];
    if (xRealIp) {
      return xRealIp;
    }

    return request.ip || request.connection?.remoteAddress || 'unknown';
  }

  /**
   * 确定操作名称
   */
  private determineAction(className: string, methodName: string, httpMethod: string): string {
    const actionMap: Record<string, string> = {
      create: '创建',
      update: '更新',
      delete: '删除',
      remove: '删除',
      get: '查询',
      list: '查询列表',
      find: '查询',
      search: '搜索',
      import: '导入',
      export: '导出',
      sign: '签名',
      verify: '验证',
      broadcast: '广播',
      connect: '连接',
      disconnect: '断开',
      freeze: '冻结',
      unfreeze: '解冻',
      backup: '备份',
      restore: '恢复',
      rotate: '轮换',
      encrypt: '加密',
      decrypt: '解密',
      scan: '扫描',
      evaluate: '评估',
      approve: '批准',
      reject: '拒绝',
      speedUp: '加速',
      speedup: '加速',
      cancel: '取消',
    };

    for (const [key, value] of Object.entries(actionMap)) {
      if (methodName.toLowerCase().includes(key.toLowerCase())) {
        const resource = this.getResourceName(className);
        return `${value}${resource}`;
      }
    }

    const resource = this.getResourceName(className);
    return `${httpMethod.toUpperCase()} ${resource}`;
  }

  /**
   * 确定审计日志类型
   */
  private determineLogType(className: string): AuditLogType {
    if (className.includes('Wallet')) return AuditLogType.WALLET_OPERATION;
    if (className.includes('Key')) return AuditLogType.KEY_OPERATION;
    if (className.includes('Transaction')) return AuditLogType.TRANSACTION;
    if (className.includes('Risk')) return AuditLogType.RISK_EVENT;
    if (className.includes('Audit')) return AuditLogType.ADMIN_ACTION;
    if (className.includes('MPC')) return AuditLogType.KEY_OPERATION;
    if (className.includes('Chain')) return AuditLogType.SYSTEM_EVENT;
    if (className.includes('DApp')) return AuditLogType.USER_ACTION;
    if (className.includes('Address')) return AuditLogType.USER_ACTION;
    if (className.includes('Notification')) return AuditLogType.SYSTEM_EVENT;
    return AuditLogType.USER_ACTION;
  }

  /**
   * 确定资源类型
   */
  private determineResourceType(className: string): string {
    if (className.includes('Wallet')) return 'wallet';
    if (className.includes('Key')) return 'key';
    if (className.includes('Transaction')) return 'transaction';
    if (className.includes('Risk')) return 'risk_rule';
    if (className.includes('MPC')) return 'mpc_wallet';
    if (className.includes('Chain')) return 'chain';
    if (className.includes('DApp')) return 'dapp';
    if (className.includes('Address')) return 'address_book';
    if (className.includes('Notification')) return 'notification';
    return 'unknown';
  }

  /**
   * 提取资源ID
   */
  private extractResourceId(request: any): string | undefined {
    if (request.params && request.params.id) {
      return request.params.id;
    }
    if (request.params && request.params.walletId) {
      return request.params.walletId;
    }
    if (request.body && request.body.id) {
      return request.body.id;
    }
    return undefined;
  }

  /**
   * 生成描述
   */
  private generateDescription(className: string, methodName: string, request: any): string {
    const resource = this.getResourceName(className);
    const action = methodName;
    const id = this.extractResourceId(request);

    if (id) {
      return `${resource} ID: ${id}`;
    }

    return resource;
  }

  /**
   * 获取资源名称
   */
  private getResourceName(className: string): string {
    const names: Record<string, string> = {
      WalletController: '钱包',
      KeyController: '密钥',
      TransactionController: '交易',
      ChainController: '链服务',
      MPCController: 'MPC钱包',
      RiskController: '风控',
      AuditController: '审计',
      AddressBookController: '地址簿',
      DAppController: 'DApp',
      NotificationController: '通知',
    };
    return names[className] || className.replace('Controller', '');
  }

  /**
   * 清理敏感数据
   */
  private sanitizeData(data: any): any {
    if (!data) return data;

    const sensitiveFields = [
      'password',
      'privateKey',
      'mnemonic',
      'seed',
      'secret',
      'token',
      'apiKey',
      'keystore',
      'encryptedData',
    ];

    const sanitize = (obj: any): any => {
      if (!obj || typeof obj !== 'object') return obj;

      if (Array.isArray(obj)) {
        return obj.map((item) => sanitize(item));
      }

      const result: Record<string, any> = {};
      for (const [key, value] of Object.entries(obj)) {
        if (sensitiveFields.includes(key.toLowerCase())) {
          result[key] = '***';
        } else {
          result[key] = sanitize(value);
        }
      }
      return result;
    };

    return sanitize(data);
  }

  /**
   * 清理请求体
   */
  private sanitizeRequestBody(body: any): any {
    if (!body) return undefined;
    return this.sanitizeData(body);
  }
}

/**
 * 审计日志信息接口
 */
interface AuditLogInfo {
  userId?: string;
  action: string;
  logType: AuditLogType;
  status: OperationStatus;
  resourceType?: string;
  resourceId?: string;
  description?: string;
  ip?: string;
  userAgent?: string;
  requestMethod?: string;
  requestUrl?: string;
  requestParams?: any;
  requestQuery?: any;
  requestBody?: any;
  className?: string;
  methodName?: string;
  duration?: number;
  errorMessage?: string;
  errorCode?: number;
  responseData?: any;
}
