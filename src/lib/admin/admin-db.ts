import 'server-only';

/**
 * admin-db（2026-07-18 真实化底座）
 *
 * 目标：提供 server-only 的真实化 DB 访问 helper
 *   - 在 server component / route.ts / server action 中调用
 *   - 复用既有 @/lib/prisma 单例
 *   - 统一错误处理
 *   - 统一日志
 *
 * ⚠️ SERVER-ONLY（Q04-3.11.b.h0 升级）：
 *   - 编译期边界：`import 'server-only'` 阻止 client bundle 引用
 *   - 运行期兜底：runtime guard 防止运行时误调
 *   - 不允许在 client component 中 import
 *   - 仅 server component / route.ts / server action 可用
 *
 * 硬约束（Q04-3.11.b 范围）：
 *   - 复用 @/lib/prisma
 *   - 不修改 prisma.ts
 *   - 不修改 schema.prisma
 *   - 不强制任何业务调用
 *
 * Q04-3.11.b.h0 修正：
 *   - 顶部增加 `import 'server-only'` 形成编译期 server-only 边界
 *   - 保留既有 runtime guard 形成运行期兜底
 *   - 注意：需要先 `npm install server-only`（极小包）才能完整生效
 */

// =============================================================================
// SERVER-ONLY GUARD（运行期兜底）
// =============================================================================

if (typeof window !== 'undefined') {
  throw new Error(
    '[admin-db] Forbidden: admin-db.ts is server-only. ' +
    'Do not import from client components. ' +
    'Use adminFetch from "@/lib/admin/admin-fetch" instead.',
  );
}

import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { throwApi } from './api-response-schema';

// =============================================================================
// 类型定义
// =============================================================================

export interface AdminDbFindManyArgs {
  /** 跳过的记录数（分页） */
  skip?: number;
  /** 取多少条 */
  take?: number;
  /** 排序 */
  orderBy?: Record<string, 'asc' | 'desc'> | Array<Record<string, 'asc' | 'desc'>>;
  /** 过滤条件（自由结构，由调用方控制） */
  where?: Record<string, unknown>;
  /** include 关联 */
  include?: Record<string, unknown>;
  /** select 字段 */
  select?: Record<string, unknown>;
}

export interface AdminDbFindManyResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface AdminDbGroupByArgs {
  by: string[];
  where?: Record<string, unknown>;
  _count?: Record<string, boolean>;
  _sum?: Record<string, boolean>;
  _avg?: Record<string, boolean>;
  _min?: Record<string, boolean>;
  _max?: Record<string, boolean>;
}

export interface AdminDbOptions {
  /** 业务上下文（用于日志追踪） */
  context?: string;
  /** 失败时是否抛 ApiError（默认 true） */
  throwOnError?: boolean;
}

// =============================================================================
// findMany
// =============================================================================

/**
 * 真实化 findMany（带分页 + total）
 *
 * 使用示例：
 * ```ts
 * const { items, total } = await adminDbFindMany(
 *   (db) => db.fjnUserKyc.findMany,
 *   { skip: 0, take: 20, where: { status: 'PENDING' } },
 *   { context: 'admin/users/kyc' }
 * );
 * ```
 */
export async function adminDbFindMany<T>(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  modelDelegate: any,
  args: AdminDbFindManyArgs = {},
  options: AdminDbOptions = {},
): Promise<AdminDbFindManyResult<T>> {
  const { skip = 0, take = 20, orderBy, where, include, select } = args;
  const { context = 'admin-db', throwOnError = true } = options;

  try {
    const [items, total] = await Promise.all([
      modelDelegate.findMany({
        skip,
        take,
        orderBy,
        where,
        include,
        select,
      }),
      modelDelegate.count({ where }),
    ]);

    return { items: items as T[], total, page: Math.floor(skip / take) + 1, pageSize: take };
  } catch (e: any) {
    logger.error(`[${context}] adminDbFindMany failed`, e);
    if (throwOnError) {
      throwApi(
        'DB_QUERY_ERROR',
        `数据库查询失败: ${e?.message || 'unknown'}`,
        500,
        { context, where },
      );
    }
    return { items: [], total: 0, page: 1, pageSize: take };
  }
}

// =============================================================================
// findOne
// =============================================================================

/**
 * 真实化 findUnique / findFirst
 */
export async function adminDbFindOne<T>(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  modelDelegate: any,
  args: { where: Record<string, unknown>; include?: Record<string, unknown>; select?: Record<string, unknown> },
  options: AdminDbOptions = {},
): Promise<T | null> {
  const { context = 'admin-db', throwOnError = true } = options;
  try {
    if (typeof modelDelegate.findUnique === 'function') {
      const result = await modelDelegate.findUnique(args);
      return (result as T) ?? null;
    }
    const result = await modelDelegate.findFirst(args);
    return (result as T) ?? null;
  } catch (e: any) {
    logger.error(`[${context}] adminDbFindOne failed`, e);
    if (throwOnError) {
      throwApi(
        'DB_QUERY_ERROR',
        `数据库查询失败: ${e?.message || 'unknown'}`,
        500,
        { context, where: args.where },
      );
    }
    return null;
  }
}

// =============================================================================
// count
// =============================================================================

export async function adminDbCount(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  modelDelegate: any,
  args: { where?: Record<string, unknown> } = {},
  options: AdminDbOptions = {},
): Promise<number> {
  const { context = 'admin-db', throwOnError = true } = options;
  try {
    return await modelDelegate.count({ where: args.where });
  } catch (e: any) {
    logger.error(`[${context}] adminDbCount failed`, e);
    if (throwOnError) {
      throwApi(
        'DB_QUERY_ERROR',
        `数据库 count 失败: ${e?.message || 'unknown'}`,
        500,
        { context, where: args.where },
      );
    }
    return 0;
  }
}

// =============================================================================
// groupBy
// =============================================================================

export async function adminDbGroupBy<T = unknown>(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  modelDelegate: any,
  args: AdminDbGroupByArgs,
  options: AdminDbOptions = {},
): Promise<T[]> {
  const { context = 'admin-db', throwOnError = true } = options;
  try {
    return (await modelDelegate.groupBy(args)) as T[];
  } catch (e: any) {
    logger.error(`[${context}] adminDbGroupBy failed`, e);
    if (throwOnError) {
      throwApi(
        'DB_QUERY_ERROR',
        `数据库 groupBy 失败: ${e?.message || 'unknown'}`,
        500,
        { context },
      );
    }
    return [];
  }
}

// =============================================================================
// transaction wrapper
// =============================================================================

/**
 * 真实化事务包装
 *
 * 使用示例：
 * ```ts
 * await adminDbTransaction(async (tx) => {
 *   await tx.fjnOrder.create({ data: orderData });
 *   await tx.fjnOrderItem.create({ data: itemData });
 * });
 * ```
 */
export async function adminDbTransaction<T>(
  fn: (tx: typeof prisma) => Promise<T>,
  options: AdminDbOptions = {},
): Promise<T> {
  const { context = 'admin-db', throwOnError = true } = options;
  try {
    return await prisma.$transaction(fn);
  } catch (e: any) {
    logger.error(`[${context}] adminDbTransaction failed`, e);
    if (throwOnError) {
      throwApi(
        'DB_TX_ERROR',
        `数据库事务失败: ${e?.message || 'unknown'}`,
        500,
        { context },
      );
    }
    throw e;
  }
}

export { prisma as adminPrisma };
