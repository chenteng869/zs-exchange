/**
 * 告警事件持久化与管理服务 (M-2)
 *
 * 核心功能：
 *  - 记录 MFA 失败事件（用于失败率告警统计）
 *  - 计算 MFA 失败率（滑动窗口）
 *  - 告警事件查询（多维度过滤）
 *  - 告警确认/解决（运维工作流）
 *  - 告警统计（按类型/严重度/时间）
 *
 * 设计目标：
 *  1. 数据库为主：所有告警必须持久化，便于审计与查询
 *  2. 告警与告警配置解耦：阈值可动态调整
 *  3. 滑动窗口统计：支持任意时间窗口的失败率查询
 *  4. 运维工作流：未确认告警需人工介入
 */

import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

// ============================================================
// 类型
// ============================================================

export type MfaFailureType =
  | 'invalid_code'
  | 'expired_code'
  | 'locked'
  | 'backup_code_used'
  | 'webauthn_failed'
  | 'not_enrolled'
  | 'verification_failed';

export interface RecordMfaFailureInput {
  userId?: string;
  failureType: MfaFailureType;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
}

export interface MfaFailureRateResult {
  userId?: string; // null = 全局
  windowMinutes: number;
  failureCount: number;
  threshold: number;
  triggered: boolean;
  byType: Record<string, number>;
}

export interface AlertQueryOptions {
  type?: string;
  severity?: string;
  userId?: string;
  acknowledged?: boolean;
  resolved?: boolean;
  startTime?: Date;
  endTime?: Date;
  page?: number;
  pageSize?: number;
  orderBy?: 'createdAt' | 'severity' | 'type';
  orderDir?: 'asc' | 'desc';
}

export interface AlertStatsResult {
  total: number;
  byType: Record<string, number>;
  bySeverity: Record<string, number>;
  byDeliveryStatus: Record<string, number>;
  unacknowledgedCount: number;
  unresolvedCount: number;
  timeRange: { start: Date; end: Date };
}

// ============================================================
// 配置
// ============================================================

const MFA_FAILURE_RATE_THRESHOLD = parseInt(
  process.env.MFA_FAILURE_RATE_THRESHOLD || '10',
  10,
);
const MFA_FAILURE_RATE_WINDOW_MINUTES = parseInt(
  process.env.MFA_FAILURE_RATE_WINDOW_MINUTES || '5',
  10,
);

// ============================================================
// MFA 失败记录
// ============================================================

/**
 * 记录一次 MFA 失败
 *  - 失败后会触发失败率检测
 *  - 如果超过阈值，触发告警
 */
export async function recordMfaFailure(
  input: RecordMfaFailureInput,
): Promise<{ recorded: boolean; triggeredAlert: boolean }> {
  try {
    await (prisma as any).fjnMfaFailureRecord.create({
      data: {
        userId: input.userId,
        failureType: input.failureType,
        ipAddress: input.ipAddress,
        userAgent: input.userAgent?.slice(0, 500),
        metadata: input.metadata,
      },
    });

    // 异步触发失败率检测（不阻塞主业务）
    checkMfaFailureRate(input.userId).catch((e) => {
      logger.warn(`[alert-mgmt] checkMfaFailureRate failed: ${e.message}`);
    });

    return { recorded: true, triggeredAlert: false };
  } catch (e: any) {
    logger.error(`[alert-mgmt] recordMfaFailure failed: ${e.message}`);
    return { recorded: false, triggeredAlert: false };
  }
}

/**
 * 计算 MFA 失败率（滑动窗口）
 *  - 支持单用户或全局统计
 *  - 返回是否触发告警
 */
export async function checkMfaFailureRate(
  userId?: string,
  windowMinutes: number = MFA_FAILURE_RATE_WINDOW_MINUTES,
  threshold: number = MFA_FAILURE_RATE_THRESHOLD,
): Promise<MfaFailureRateResult> {
  const windowStart = new Date(Date.now() - windowMinutes * 60 * 1000);

  const where: any = {
    createdAt: { gte: windowStart },
  };
  if (userId) {
    where.userId = userId;
  }

  try {
    const [count, byTypeRecords] = await Promise.all([
      (prisma as any).fjnMfaFailureRecord.count({ where }),
      (prisma as any).fjnMfaFailureRecord.groupBy({
        by: ['failureType'],
        where,
        _count: { id: true },
      }),
    ]);

    const byType: Record<string, number> = {};
    for (const r of byTypeRecords) {
      byType[r.failureType] = r._count.id;
    }

    const triggered = count >= threshold;

    // 触发告警
    if (triggered) {
      // 动态导入避免循环
      const { alertMfaFailureRate } = await import('@/lib/monitoring/alert-service');
      await alertMfaFailureRate({
        userId,
        failureCount: count,
        windowMinutes,
      });
    }

    return {
      userId,
      windowMinutes,
      failureCount: count,
      threshold,
      triggered,
      byType,
    };
  } catch (e: any) {
    logger.error(`[alert-mgmt] checkMfaFailureRate failed: ${e.message}`);
    return {
      userId,
      windowMinutes,
      failureCount: 0,
      threshold,
      triggered: false,
      byType: {},
    };
  }
}

// ============================================================
// 告警事件查询
// ============================================================

/**
 * 查询告警事件
 *  - 多维度过滤：类型/严重度/用户/确认状态
 *  - 分页：默认 20/页
 */
export async function queryAlerts(options: AlertQueryOptions = {}) {
  const {
    type,
    severity,
    userId,
    acknowledged,
    resolved,
    startTime,
    endTime,
    page = 1,
    pageSize = 20,
    orderBy = 'createdAt',
    orderDir = 'desc',
  } = options;

  const where: any = {};
  if (type) where.type = type;
  if (severity) where.severity = severity;
  if (userId) where.userId = userId;
  if (acknowledged !== undefined) where.acknowledged = acknowledged;
  if (resolved !== undefined) {
    where.resolvedAt = resolved ? { not: null } : null;
  }
  if (startTime || endTime) {
    where.createdAt = {};
    if (startTime) where.createdAt.gte = startTime;
    if (endTime) where.createdAt.lte = endTime;
  }

  const [total, alerts] = await Promise.all([
    (prisma as any).fjnSecurityAlert.count({ where }),
    (prisma as any).fjnSecurityAlert.findMany({
      where,
      orderBy: { [orderBy]: orderDir },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  return {
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
    alerts: alerts.map((a: any) => ({
      id: a.id,
      signature: a.signature,
      type: a.type,
      severity: a.severity,
      severityLevel: a.severityLevel,
      userId: a.userId,
      resourceId: a.resourceId,
      ipAddress: a.ipAddress,
      userAgent: a.userAgent,
      message: a.message,
      metadata: a.metadata,
      traceId: a.traceId,
      source: a.source,
      environment: a.environment,
      deliveredToSiem: a.deliveredToSiem,
      siemDeliveredAt: a.siemDeliveredAt,
      deliveryStatus: a.deliveryStatus,
      acknowledged: a.acknowledged,
      acknowledgedBy: a.acknowledgedBy,
      acknowledgedAt: a.acknowledgedAt,
      resolution: a.resolution,
      resolvedAt: a.resolvedAt,
      resolvedBy: a.resolvedBy,
      createdAt: a.createdAt,
    })),
  };
}

/**
 * 获取告警统计
 *  - 按类型/严重度/投递状态分组
 *  - 默认最近 7 天
 */
export async function getAlertStats(
  days: number = 7,
): Promise<AlertStatsResult> {
  const end = new Date();
  const start = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const where = { createdAt: { gte: start, lte: end } };

  const [total, byType, bySeverity, byDeliveryStatus, unacknowledgedCount, unresolvedCount] =
    await Promise.all([
      (prisma as any).fjnSecurityAlert.count({ where }),
      (prisma as any).fjnSecurityAlert.groupBy({
        by: ['type'],
        where,
        _count: { id: true },
      }),
      (prisma as any).fjnSecurityAlert.groupBy({
        by: ['severity'],
        where,
        _count: { id: true },
      }),
      (prisma as any).fjnSecurityAlert.groupBy({
        by: ['deliveryStatus'],
        where,
        _count: { id: true },
      }),
      (prisma as any).fjnSecurityAlert.count({
        where: { ...where, acknowledged: false },
      }),
      (prisma as any).fjnSecurityAlert.count({
        where: { ...where, resolvedAt: null },
      }),
    ]);

  const byTypeMap: Record<string, number> = {};
  for (const r of byType) byTypeMap[r.type] = r._count.id;
  const bySeverityMap: Record<string, number> = {};
  for (const r of bySeverity) bySeverityMap[r.severity] = r._count.id;
  const byDeliveryMap: Record<string, number> = {};
  for (const r of byDeliveryStatus) byDeliveryMap[r.deliveryStatus] = r._count.id;

  return {
    total,
    byType: byTypeMap,
    bySeverity: bySeverityMap,
    byDeliveryStatus: byDeliveryMap,
    unacknowledgedCount,
    unresolvedCount,
    timeRange: { start, end },
  };
}

// ============================================================
// 告警运维操作
// ============================================================

/**
 * 确认告警（运维人员查看）
 */
export async function acknowledgeAlert(params: {
  alertId: string;
  acknowledgedBy: string;
  note?: string;
}) {
  return (prisma as any).fjnSecurityAlert.update({
    where: { id: params.alertId },
    data: {
      acknowledged: true,
      acknowledgedBy: params.acknowledgedBy,
      acknowledgedAt: new Date(),
    },
  });
}

/**
 * 解决告警
 */
export async function resolveAlert(params: {
  alertId: string;
  resolvedBy: string;
  resolution: string;
}) {
  return (prisma as any).fjnSecurityAlert.update({
    where: { id: params.alertId },
    data: {
      resolvedAt: new Date(),
      resolvedBy: params.resolvedBy,
      resolution: params.resolution,
      acknowledged: true, // 解决的同时自动确认
      acknowledgedBy: params.resolvedBy,
      acknowledgedAt: new Date(),
    },
  });
}

/**
 * 批量确认
 */
export async function batchAcknowledgeAlerts(params: {
  alertIds: string[];
  acknowledgedBy: string;
}) {
  return (prisma as any).fjnSecurityAlert.updateMany({
    where: { id: { in: params.alertIds } },
    data: {
      acknowledged: true,
      acknowledgedBy: params.acknowledgedBy,
      acknowledgedAt: new Date(),
    },
  });
}

/**
 * 重新投递失败告警
 */
export async function retryFailedDelivery(alertId: string): Promise<boolean> {
  const alert = await (prisma as any).fjnSecurityAlert.findUnique({
    where: { id: alertId },
  });
  if (!alert) return false;
  if (alert.deliveredToSiem) return true; // 已投递

  // 重新发送
  const { emitAlert } = await import('@/lib/monitoring/alert-service');
  const result = await emitAlert({
    type: alert.type as any,
    severity: alert.severity as any,
    userId: alert.userId,
    resourceId: alert.resourceId,
    ipAddress: alert.ipAddress,
    userAgent: alert.userAgent,
    message: alert.message,
    metadata: alert.metadata,
    traceId: alert.traceId,
    timestamp: alert.createdAt,
  });

  return result.deliveries.some((d) => d.channel === 'siem_webhook' && d.success);
}

// ============================================================
// 告警配置管理
// ============================================================

/**
 * 列出所有告警配置
 */
export async function listAlertConfigs() {
  return (prisma as any).fjnAlertConfig.findMany({
    orderBy: { alertType: 'asc' },
  });
}

/**
 * 更新告警配置
 */
export async function updateAlertConfig(
  alertType: string,
  updates: {
    enabled?: boolean;
    minSeverity?: string;
    thresholdCount?: number;
    thresholdWindow?: number;
    channels?: string[];
    dedupWindowSec?: number;
    description?: string;
  },
) {
  return (prisma as any).fjnAlertConfig.update({
    where: { alertType },
    data: updates,
  });
}
