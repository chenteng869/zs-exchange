/**
 * FJN Service 基础类
 *
 * 所有 FJN Service 的共同基类：
 *  - 统一 prisma 客户端
 *  - 统一 logger
 *  - 统一审计字段填充
 *  - 统一事务包装
 */
import { PrismaClient, Prisma } from '@prisma/client';
import { prisma as defaultPrisma } from '../../prisma';
import { logger } from '../../logger';
import { FjnError, FjnErrorContext } from '../errors';

/** Service 基类选项 */
export interface FjnServiceOptions {
  prisma?: PrismaClient;
  serviceName?: string;
}

/** 事务执行器类型 */
export type FjnTransactionClient = Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>;

/** Service 基类 */
export abstract class FjnServiceBase {
  protected readonly prisma: PrismaClient;
  protected readonly serviceName: string;

  constructor(options: FjnServiceOptions = {}) {
    this.prisma = options.prisma ?? defaultPrisma;
    this.serviceName = options.serviceName ?? this.constructor.name;
  }

  /**
   * 在事务中执行业务
   *
   * 用法：
   *   await this.withTransaction(async (tx) => {
   *     const order = await tx.fjnOrder.create({ data: ... });
   *     await tx.fjnPointsAccount.update({ ... });
   *   });
   */
  protected async withTransaction<T>(
    fn: (tx: FjnTransactionClient) => Promise<T>,
    options?: { maxWait?: number; timeout?: number; isolationLevel?: Prisma.TransactionIsolationLevel }
  ): Promise<T> {
    return this.prisma.$transaction(fn, {
      maxWait: options?.maxWait ?? 5000,
      timeout: options?.timeout ?? 10000,
      isolationLevel: options?.isolationLevel,
    });
  }

  /** 记录业务日志 */
  protected log(level: 'info' | 'warn' | 'error' | 'debug', message: string, context?: FjnErrorContext): void {
    const logFn = (logger as any)[level] ?? logger.info;
    logFn.call(logger, `[${this.serviceName}] ${message}`, context);
  }

  /** 统一异常处理 */
  protected wrapError(e: unknown, fallbackMessage: string): FjnError {
    if (e instanceof FjnError) return e;
    if (e instanceof Error) {
      return new FjnError({
        code: 'FJN_INTERNAL' as any,
        message: `${fallbackMessage}: ${e.message}`,
        context: { originalError: e.name, stack: e.stack?.substring(0, 500) },
        cause: e,
      });
    }
    return new FjnError({
      code: 'FJN_INTERNAL' as any,
      message: fallbackMessage,
      context: { value: String(e) },
    });
  }

  /** 填充审计字段 - 返回原始 data，避免添加不存在的字段 */
  protected fillAuditFields<T extends Record<string, unknown>>(
    data: T,
    operatorId?: string | null
  ): T {
    // 注意：FJN 各表 schema 中普遍没有 createdBy/updatedBy 字段，
    // 仅使用 operatorId 字段即可。如果需要审计字段，调用方应自行添加。
    void operatorId;
    return data;
  }
}
