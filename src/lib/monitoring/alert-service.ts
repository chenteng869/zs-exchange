/**
 * 监控告警通道服务 (M-1)
 *
 * 核心功能：
 *  - 多通道告警投递：SIEM Webhook / Database / Console
 *  - 标准化告警事件 (CEF-like 格式)
 *  - 异步非阻塞投递（不阻塞主业务）
 *  - 失败重试（指数退避，最多 3 次）
 *  - 告警去重（基于 signature，5 分钟窗口）
 *
 * 告警类型 (AlertEventType)：
 *  - replay_attack:     Refresh Token 重放检测
 *  - abnormal_rotation: 异常旋转检测（>= 5 次/60s）
 *  - mfa_failure_rate:  MFA 失败率告警（>= 10 次/5min）
 *  - mfa_locked:        MFA 连续失败锁定
 *  - mfa_disabled:      MFA 异常禁用
 *  - session_revoked:   Session 强制吊销
 *  - device_blacklist:  设备黑名单命中
 *  - impossible_travel: 不可能的旅行（异地登录）
 *
 * 设计目标：
 *  1. 解耦：业务侧只需 emitAlert()，由 service 决定投递通道
 *  2. 降级：SIEM 不可用时降级到 Database + Console
 *  3. 可观测：所有告警都有 traceId / 持久化记录
 *  4. 安全：Webhook URL 走环境变量，失败时 console 而非抛出
 */

import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

// ============================================================
// 类型定义
// ============================================================

export type AlertEventType =
  | 'replay_attack'
  | 'abnormal_rotation'
  | 'mfa_failure_rate'
  | 'mfa_locked'
  | 'mfa_disabled'
  | 'session_revoked'
  | 'device_blacklist'
  | 'impossible_travel'
  | 'webauthn_failed'
  | 'kyc_fraud_suspected'
  // 2026-07-11 新增（Alchemy 集成）
  | 'large_transfer'
  | 'gas_budget_warning'
  | 'webhook_process_error'
  | 'withdrawal_dropped_retry_failed'
  | 'withdrawal_dropped'
  | 'gasless_withdraw_error';

export type AlertSeverity = 'critical' | 'high' | 'medium' | 'low' | 'info';

export type AlertChannel = 'siem_webhook' | 'database' | 'console';

/** 兼容旧调用的 level 字段（映射到 severity） */
export type AlertLevel = AlertSeverity;

export interface AlertEvent {
  type: AlertEventType;
  severity: AlertSeverity;
  userId?: string;
  resourceId?: string; // sessionId / familyId / deviceId
  ipAddress?: string;
  userAgent?: string;
  message: string;
  metadata?: Record<string, any>;
  traceId?: string;
  timestamp?: Date;
}

export interface AlertDeliveryResult {
  channel: AlertChannel;
  success: boolean;
  error?: string;
  responseTimeMs?: number;
  retryCount?: number;
}

export interface AlertDispatchResult {
  alertId: string;
  signature: string;
  deliveries: AlertDeliveryResult[];
  suppressed: boolean; // 是否因去重被抑制
}

// ============================================================
// 配置
// ============================================================

const SIEM_WEBHOOK_URL = process.env.SIEM_WEBHOOK_URL || '';
const SIEM_AUTH_TOKEN = process.env.SIEM_AUTH_TOKEN || '';
const SIEM_TIMEOUT_MS = parseInt(process.env.SIEM_TIMEOUT_MS || '5000', 10);
const SIEM_ENABLED = process.env.SIEM_ENABLED === 'true';
const DATABASE_PERSIST = process.env.ALERT_DATABASE_PERSIST !== 'false'; // 默认 true
const CONSOLE_FALLBACK = process.env.ALERT_CONSOLE_FALLBACK !== 'false'; // 默认 true
const RETRY_MAX_ATTEMPTS = 3;
const RETRY_BASE_DELAY_MS = 500;
const DEDUP_WINDOW_MS = 5 * 60 * 1000; // 5 分钟去重窗口

// ============================================================
// 告警严重度 → 数值
// ============================================================

const SEVERITY_LEVEL: Record<AlertSeverity, number> = {
  critical: 5,
  high: 4,
  medium: 3,
  low: 2,
  info: 1,
};

// ============================================================
// 去重缓存（基于 signature）
// ============================================================

interface DedupEntry {
  signature: string;
  firstSeenAt: number;
  count: number;
}
const dedupCache = new Map<string, DedupEntry>();

/**
 * 生成告警 signature（用于去重）
 *  - 基于 type + userId + resourceId + message
 */
function generateSignature(event: AlertEvent): string {
  const parts = [
    event.type,
    event.userId || 'global',
    event.resourceId || 'noresource',
    // 仅取 message 前 100 字符（避免不同 metadata 触发的同一类告警被分别去重）
    (event.message || '').slice(0, 100),
  ];
  return crypto.createHash('sha256').update(parts.join('|')).digest('hex').slice(0, 32);
}

/**
 * 检查是否应抑制（去重）
 */
function shouldSuppress(signature: string): { suppress: boolean; count: number } {
  const now = Date.now();
  const entry = dedupCache.get(signature);

  if (!entry) {
    dedupCache.set(signature, { signature, firstSeenAt: now, count: 1 });
    return { suppress: false, count: 1 };
  }

  // 窗口过期
  if (now - entry.firstSeenAt > DEDUP_WINDOW_MS) {
    dedupCache.set(signature, { signature, firstSeenAt: now, count: 1 });
    return { suppress: false, count: 1 };
  }

  // 窗口内：递增计数
  entry.count += 1;
  return { suppress: true, count: entry.count };
}

// 定期清理 dedupCache（防止内存泄漏）
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of dedupCache.entries()) {
      if (now - entry.firstSeenAt > DEDUP_WINDOW_MS * 2) {
        dedupCache.delete(key);
      }
    }
  }, 60 * 1000).unref?.();
}

// ============================================================
// 标准化告警格式（CEF-like）
// ============================================================

interface NormalizedAlert {
  signature: string;
  alertId: string;
  timestamp: string; // ISO 8601
  type: AlertEventType;
  severity: AlertSeverity;
  severityLevel: number;
  userId: string | null;
  resourceId: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  message: string;
  metadata: Record<string, any>;
  traceId: string;
  source: string; // 服务名
  environment: string;
}

function normalizeAlert(event: AlertEvent, signature: string): NormalizedAlert {
  return {
    signature,
    alertId: crypto.randomUUID(),
    timestamp: (event.timestamp || new Date()).toISOString(),
    type: event.type,
    severity: event.severity,
    severityLevel: SEVERITY_LEVEL[event.severity],
    userId: event.userId || null,
    resourceId: event.resourceId || null,
    ipAddress: event.ipAddress || null,
    userAgent: event.userAgent || null,
    message: event.message,
    metadata: event.metadata || {},
    traceId: event.traceId || crypto.randomUUID(),
    source: 'stock-exchange-dapp',
    environment: process.env.NODE_ENV || 'development',
  };
}

// ============================================================
// 通道投递
// ============================================================

/**
 * 投递到 SIEM Webhook
 */
async function deliverToSiem(
  alert: NormalizedAlert,
): Promise<AlertDeliveryResult> {
  if (!SIEM_ENABLED || !SIEM_WEBHOOK_URL) {
    return {
      channel: 'siem_webhook',
      success: false,
      error: 'SIEM not configured (SIEM_ENABLED=false or SIEM_WEBHOOK_URL empty)',
    };
  }

  const start = Date.now();
  let lastError = '';
  let retryCount = 0;

  for (let attempt = 0; attempt < RETRY_MAX_ATTEMPTS; attempt++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), SIEM_TIMEOUT_MS);

      const response = await fetch(SIEM_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'StockExchangeDapp-AlertChannel/1.0',
          ...(SIEM_AUTH_TOKEN ? { Authorization: `Bearer ${SIEM_AUTH_TOKEN}` } : {}),
          'X-Alert-Signature': alert.signature,
          'X-Alert-Id': alert.alertId,
          'X-Alert-Severity': alert.severity,
          'X-Alert-Type': alert.type,
        },
        body: JSON.stringify(alert),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (response.ok) {
        return {
          channel: 'siem_webhook',
          success: true,
          responseTimeMs: Date.now() - start,
          retryCount,
        };
      }

      lastError = `HTTP ${response.status} ${response.statusText}`;
    } catch (e: any) {
      lastError = e.message || 'Unknown error';
    }

    retryCount++;
    if (attempt < RETRY_MAX_ATTEMPTS - 1) {
      const delay = RETRY_BASE_DELAY_MS * Math.pow(2, attempt);
      await new Promise((r) => setTimeout(r, delay));
    }
  }

  return {
    channel: 'siem_webhook',
    success: false,
    error: lastError,
    responseTimeMs: Date.now() - start,
    retryCount,
  };
}

/**
 * 持久化到 Database
 */
async function deliverToDatabase(alert: NormalizedAlert): Promise<AlertDeliveryResult> {
  if (!DATABASE_PERSIST) {
    return {
      channel: 'database',
      success: false,
      error: 'Database persistence disabled',
    };
  }

  const start = Date.now();
  try {
    await (prisma as any).fjnSecurityAlert.create({
      data: {
        id: alert.alertId,
        signature: alert.signature,
        type: alert.type,
        severity: alert.severity,
        severityLevel: alert.severityLevel,
        userId: alert.userId,
        resourceId: alert.resourceId,
        ipAddress: alert.ipAddress,
        userAgent: alert.userAgent,
        message: alert.message,
        metadata: alert.metadata,
        traceId: alert.traceId,
        source: alert.source,
        environment: alert.environment,
        deliveredToSiem: false, // 投递后由调用方更新
        deliveryStatus: 'pending',
        createdAt: new Date(alert.timestamp),
      },
    });
    return {
      channel: 'database',
      success: true,
      responseTimeMs: Date.now() - start,
    };
  } catch (e: any) {
    return {
      channel: 'database',
      success: false,
      error: e.message || 'Unknown error',
      responseTimeMs: Date.now() - start,
    };
  }
}

/**
 * 投递到 Console（兜底）
 */
function deliverToConsole(alert: NormalizedAlert): AlertDeliveryResult {
  if (!CONSOLE_FALLBACK) {
    return { channel: 'console', success: false, error: 'Console fallback disabled' };
  }

  const logFn =
    alert.severity === 'critical' || alert.severity === 'high'
      ? logger.error
      : alert.severity === 'medium'
        ? logger.warn
        : logger.info;

  logFn(
    `[ALERT:${alert.severity.toUpperCase()}] ${alert.type} | user=${alert.userId || 'N/A'} | ${alert.message}`,
    {
      signature: alert.signature,
      alertId: alert.alertId,
      resourceId: alert.resourceId,
      ipAddress: alert.ipAddress,
      metadata: alert.metadata,
    },
  );

  return { channel: 'console', success: true };
}

// ============================================================
// 核心 API
// ============================================================

/**
 * 发出告警事件
 *
 * @param event 告警事件
 * @returns 投递结果
 *
 * 行为：
 *  1. 生成 signature
 *  2. 去重检查（5 分钟窗口内同类告警只投递 1 次，后续计入 count）
 *  3. 并行投递到所有通道：Database / SIEM Webhook / Console
 *  4. 更新数据库记录的 siem_delivered 状态
 *  5. 不抛异常：告警失败不应阻塞主业务
 */
export async function emitAlert(event: AlertEvent): Promise<AlertDispatchResult> {
  const startTime = Date.now();

  try {
    const signature = generateSignature(event);
    const dedup = shouldSuppress(signature);

    if (dedup.suppress) {
      logger.debug(
        `[alert] Suppressed duplicate alert: ${event.type} signature=${signature} count=${dedup.count}`,
      );
      return {
        alertId: '',
        signature,
        deliveries: [],
        suppressed: true,
      };
    }

    const alert = normalizeAlert(event, signature);

    // 并行投递到所有通道
    const [dbResult, siemResult] = await Promise.all([
      deliverToDatabase(alert),
      deliverToSiem(alert),
    ]);
    const consoleResult = deliverToConsole(alert);

    // 更新数据库记录的 siem_delivered 状态
    if (dbResult.success && siemResult.success) {
      try {
        await (prisma as any).fjnSecurityAlert.update({
          where: { id: alert.alertId },
          data: {
            deliveredToSiem: true,
            siemDeliveredAt: new Date(),
            deliveryStatus: 'delivered',
          },
        });
      } catch (e: any) {
        logger.warn(`[alert] Failed to update siem_delivered status: ${e.message}`);
      }
    } else if (dbResult.success) {
      try {
        await (prisma as any).fjnSecurityAlert.update({
          where: { id: alert.alertId },
          data: {
            deliveryStatus: siemResult.success ? 'delivered' : 'partial',
          },
        });
      } catch (e: any) {
        // ignore
      }
    }

    const result: AlertDispatchResult = {
      alertId: alert.alertId,
      signature,
      deliveries: [dbResult, siemResult, consoleResult],
      suppressed: false,
    };

    logger.info(
      `[alert] Dispatched ${event.type} severity=${event.severity} ` +
        `db=${dbResult.success} siem=${siemResult.success} console=${consoleResult.success} ` +
        `total=${Date.now() - startTime}ms`,
    );

    return result;
  } catch (e: any) {
    logger.error(`[alert] emitAlert failed: ${e.message}`, e);
    return {
      alertId: '',
      signature: '',
      deliveries: [],
      suppressed: false,
    };
  }
}

// ============================================================
// 业务侧便捷方法
// ============================================================

/**
 * Refresh Token 重放攻击告警
 */
export async function alertReplayAttack(params: {
  userId: string;
  familyId: string;
  sessionId: string;
  ipAddress?: string;
  userAgent?: string;
}) {
  return emitAlert({
    type: 'replay_attack',
    severity: 'critical',
    userId: params.userId,
    resourceId: params.familyId,
    ipAddress: params.ipAddress,
    userAgent: params.userAgent,
    message: `Refresh token replay detected. Family ${params.familyId} revoked.`,
    metadata: {
      sessionId: params.sessionId,
      action: 'family_revoked',
    },
  });
}

/**
 * 异常旋转告警
 */
export async function alertAbnormalRotation(params: {
  userId: string;
  rotationCount: number;
  windowSeconds: number;
  ipAddress?: string;
}) {
  return emitAlert({
    type: 'abnormal_rotation',
    severity: 'high',
    userId: params.userId,
    ipAddress: params.ipAddress,
    message: `Abnormal rotation detected: ${params.rotationCount} rotations in ${params.windowSeconds}s`,
    metadata: {
      rotationCount: params.rotationCount,
      windowSeconds: params.windowSeconds,
      threshold: 5,
    },
  });
}

/**
 * MFA 失败率告警
 */
export async function alertMfaFailureRate(params: {
  userId?: string;
  failureCount: number;
  windowMinutes: number;
}) {
  return emitAlert({
    type: 'mfa_failure_rate',
    severity: params.userId ? 'high' : 'critical', // 单用户高 / 全局严重
    userId: params.userId,
    message: `MFA failure rate exceeded: ${params.failureCount} failures in ${params.windowMinutes}min`,
    metadata: {
      failureCount: params.failureCount,
      windowMinutes: params.windowMinutes,
    },
  });
}

/**
 * MFA 锁定告警
 */
export async function alertMfaLocked(params: {
  userId: string;
  failedAttempts: number;
  lockedUntil: Date;
  ipAddress?: string;
}) {
  return emitAlert({
    type: 'mfa_locked',
    severity: 'high',
    userId: params.userId,
    ipAddress: params.ipAddress,
    message: `MFA locked after ${params.failedAttempts} failed attempts`,
    metadata: {
      failedAttempts: params.failedAttempts,
      lockedUntil: params.lockedUntil.toISOString(),
    },
  });
}

/**
 * Session 强制吊告知警
 */
export async function alertSessionRevoked(params: {
  userId: string;
  sessionId: string;
  reason: string;
  ipAddress?: string;
}) {
  return emitAlert({
    type: 'session_revoked',
    severity: 'medium',
    userId: params.userId,
    resourceId: params.sessionId,
    ipAddress: params.ipAddress,
    message: `Session revoked: ${params.reason}`,
    metadata: {
      reason: params.reason,
    },
  });
}

/**
 * 设备黑名单命中告警
 */
export async function alertDeviceBlacklist(params: {
  userId?: string;
  fingerprint: string;
  reason: string;
  ipAddress?: string;
}) {
  return emitAlert({
    type: 'device_blacklist',
    severity: 'high',
    userId: params.userId,
    ipAddress: params.ipAddress,
    message: `Device blacklist hit: ${params.reason}`,
    metadata: {
      fingerprint: params.fingerprint,
      reason: params.reason,
    },
  });
}

// ============================================================
// 配置导出
// ============================================================

export const ALERT_CONFIG = {
  SIEM_WEBHOOK_URL: SIEM_WEBHOOK_URL ? `${SIEM_WEBHOOK_URL.slice(0, 40)}...` : '(not set)',
  SIEM_ENABLED,
  SIEM_TIMEOUT_MS,
  DATABASE_PERSIST,
  CONSOLE_FALLBACK,
  RETRY_MAX_ATTEMPTS,
  DEDUP_WINDOW_MS,
} as const;

// =============================================================================
// 兼容旧调用约定的 alertService 对象
//  - 旧 API: alertService.sendAlert({ type, level, ... })
//  - 新 API: emitAlert({ type, severity, ... })
// =============================================================================

/** 兼容旧调用的 sendAlert 入参（支持 level 字段，自动映射为 severity） */
export interface LegacyAlertInput {
  type: AlertEventType;
  level: AlertLevel;
  userId?: string;
  resourceId?: string;
  ipAddress?: string;
  userAgent?: string;
  message: string;
  metadata?: Record<string, any>;
  traceId?: string;
  timestamp?: Date;
}

export const alertService = {
  /**
   * 兼容旧调用：sendAlert({ type, level, userId, message, metadata })
   * 自动将 level → severity 后调用 emitAlert
   */
  async sendAlert(input: LegacyAlertInput): Promise<AlertDispatchResult> {
    return emitAlert({
      type: input.type,
      severity: input.level,
      userId: input.userId,
      resourceId: input.resourceId,
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
      message: input.message,
      metadata: input.metadata,
      traceId: input.traceId,
      timestamp: input.timestamp,
    });
  },
};
