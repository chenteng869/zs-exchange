/**
 * 管理员操作审计日志服务
 *
 * 功能：
 *  - 记录所有管理员操作
 *  - 操作日志查询与过滤
 *  - 日志上链存证（关键操作）
 *  - 异常行为检测
 */

import { logger } from '@/lib/logger';
import { useAuthStore } from '@/stores/authStore';
import { safeJsonParse } from '@/lib/security/safe-json-parse';

export type AuditLogModule =
  | 'users'
  | 'transactions'
  | 'content'
  | 'finance'
  | 'system'
  | 'risk'
  | 'cex'
  | 'dex'
  | 'defi'
  | 'wallet'
  | 'staking'
  | 'ido'
  | 'quant'
  | 'nft'
  | 'entertainment'
  | 'ecommerce'
  | 'enterprise'
  | 'token'
  | 'listing'
  | 'security'
  | 'command'
  | 'blockchain'
  | 'bpm'
  | 'iot'
  | 'i18n'
  | 'analytics';

export type AuditLogAction =
  | 'view'
  | 'create'
  | 'edit'
  | 'delete'
  | 'freeze'
  | 'unfreeze'
  | 'approve'
  | 'reject'
  | 'login'
  | 'logout'
  | 'export'
  | 'import'
  | 'config_change'
  | 'permission_change'
  | 'password_change'
  | 'role_create'
  | 'role_update'
  | 'role_delete'
  | 'admin_create'
  | 'admin_update'
  | 'admin_delete';

export type AuditLogStatus = 'success' | 'warning' | 'error' | 'info';

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  operatorId: string;
  operatorName: string;
  operatorRole: string;
  module: AuditLogModule;
  action: AuditLogAction;
  targetId?: string;
  targetType?: string;
  ipAddress: string;
  userAgent: string;
  requestId: string;
  beforeData?: Record<string, unknown>;
  afterData?: Record<string, unknown>;
  details: string;
  status: AuditLogStatus;
  approvalId?: string;
  chainTxHash?: string;
}

interface AuditLogFilter {
  operatorId?: string;
  module?: AuditLogModule;
  action?: AuditLogAction;
  status?: AuditLogStatus;
  startTime?: string;
  endTime?: string;
  keyword?: string;
  page?: number;
  pageSize?: number;
}

interface AuditLogQueryResult {
  list: AuditLogEntry[];
  total: number;
  page: number;
  pageSize: number;
}

const LOG_STORAGE_KEY = 'zs-admin-audit-logs';
const MAX_LOGS_IN_MEMORY = 1000;

let inMemoryLogs: AuditLogEntry[] = [];

const generateId = (): string => {
  return `log-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
};

const generateRequestId = (): string => {
  return `req-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
};

const getClientInfo = () => {
  if (typeof window === 'undefined') {
    return { ipAddress: 'unknown', userAgent: 'server' };
  }
  return {
    ipAddress: '127.0.0.1',
    userAgent: navigator.userAgent,
  };
};

const loadLogsFromStorage = (): AuditLogEntry[] => {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(LOG_STORAGE_KEY);
    if (stored) {
      const parsed = safeJsonParse<AuditLogEntry[]>(stored, { context: 'audit-log-storage' });
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    logger.error('[AuditLog] 加载日志失败', e);
  }
  return [];
};

const saveLogsToStorage = (logs: AuditLogEntry[]) => {
  if (typeof window === 'undefined') return;
  try {
    const toSave = logs.slice(0, MAX_LOGS_IN_MEMORY);
    localStorage.setItem(LOG_STORAGE_KEY, JSON.stringify(toSave));
  } catch (e) {
    logger.error('[AuditLog] 保存日志失败', e);
  }
};

if (typeof window !== 'undefined') {
  inMemoryLogs = loadLogsFromStorage();
}

export const createAuditLog = async (
  entry: Omit<AuditLogEntry, 'id' | 'timestamp' | 'ipAddress' | 'userAgent' | 'requestId'>
): Promise<AuditLogEntry> => {
  const authState = useAuthStore.getState();
  const clientInfo = getClientInfo();

  const logEntry: AuditLogEntry = {
    id: generateId(),
    timestamp: new Date().toISOString(),
    operatorId: entry.operatorId || authState.user?.id || 'unknown',
    operatorName: entry.operatorName || authState.user?.username || 'unknown',
    operatorRole: entry.operatorRole || (authState.user?.role as string) || 'unknown',
    module: entry.module,
    action: entry.action,
    targetId: entry.targetId,
    targetType: entry.targetType,
    ipAddress: clientInfo.ipAddress,
    userAgent: clientInfo.userAgent,
    requestId: generateRequestId(),
    beforeData: entry.beforeData,
    afterData: entry.afterData,
    details: entry.details,
    status: entry.status,
    approvalId: entry.approvalId,
  };

  inMemoryLogs.unshift(logEntry);
  if (inMemoryLogs.length > MAX_LOGS_IN_MEMORY) {
    inMemoryLogs = inMemoryLogs.slice(0, MAX_LOGS_IN_MEMORY);
  }

  saveLogsToStorage(inMemoryLogs);

  logger.info(
    `[AuditLog] ${logEntry.module}:${logEntry.action} by ${logEntry.operatorName} - ${logEntry.details}`
  );

  return logEntry;
};

export const queryAuditLogs = (filter: AuditLogFilter): AuditLogQueryResult => {
  const page = filter.page || 1;
  const pageSize = filter.pageSize || 20;

  let filtered = [...inMemoryLogs];

  if (filter.operatorId) {
    filtered = filtered.filter((log) => log.operatorId === filter.operatorId);
  }

  if (filter.module) {
    filtered = filtered.filter((log) => log.module === filter.module);
  }

  if (filter.action) {
    filtered = filtered.filter((log) => log.action === filter.action);
  }

  if (filter.status) {
    filtered = filtered.filter((log) => log.status === filter.status);
  }

  if (filter.startTime) {
    filtered = filtered.filter((log) => log.timestamp >= filter.startTime!);
  }

  if (filter.endTime) {
    filtered = filtered.filter((log) => log.timestamp <= filter.endTime!);
  }

  if (filter.keyword) {
    const kw = filter.keyword.toLowerCase();
    filtered = filtered.filter(
      (log) =>
        log.operatorName.toLowerCase().includes(kw) ||
        log.details.toLowerCase().includes(kw) ||
        log.module.toLowerCase().includes(kw) ||
        log.action.toLowerCase().includes(kw)
    );
  }

  const total = filtered.length;
  const start = (page - 1) * pageSize;
  const list = filtered.slice(start, start + pageSize);

  return { list, total, page, pageSize };
};

export const getAuditLogById = (id: string): AuditLogEntry | undefined => {
  return inMemoryLogs.find((log) => log.id === id);
};

export const detectAnomalousBehavior = (operatorId: string): string[] => {
  const warnings: string[] = [];
  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const operatorLogs = inMemoryLogs.filter(
    (log) => log.operatorId === operatorId && new Date(log.timestamp) >= oneDayAgo
  );

  if (operatorLogs.length > 100) {
    warnings.push('24小时内操作次数异常偏高（>100次）');
  }

  const nightOperations = operatorLogs.filter((log) => {
    const hour = new Date(log.timestamp).getHours();
    return hour >= 0 && hour < 6;
  });

  if (nightOperations.length > 5) {
    warnings.push('凌晨时段（00:00-06:00）操作频繁');
  }

  const errorCount = operatorLogs.filter((log) => log.status === 'error').length;
  if (errorCount > 10) {
    warnings.push(`24小时内失败操作${errorCount}次，请核查`);
  }

  const highRiskActions = operatorLogs.filter((log) =>
    ['delete', 'freeze', 'permission_change', 'config_change'].includes(log.action)
  );
  if (highRiskActions.length > 10) {
    warnings.push(`24小时内高风险操作${highRiskActions.length}次`);
  }

  return warnings;
};

export const getAuditStatistics = (days: number = 7) => {
  const now = new Date();
  const startTime = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

  const recentLogs = inMemoryLogs.filter(
    (log) => new Date(log.timestamp) >= startTime
  );

  const moduleStats: Record<string, number> = {};
  const actionStats: Record<string, number> = {};
  const statusStats: Record<string, number> = { success: 0, warning: 0, error: 0, info: 0 };
  const operatorStats: Record<string, number> = {};

  recentLogs.forEach((log) => {
    moduleStats[log.module] = (moduleStats[log.module] || 0) + 1;
    actionStats[log.action] = (actionStats[log.action] || 0) + 1;
    statusStats[log.status] = (statusStats[log.status] || 0) + 1;
    operatorStats[log.operatorName] = (operatorStats[log.operatorName] || 0) + 1;
  });

  const dailyStats: { date: string; count: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const dateStr = date.toISOString().split('T')[0];
    const count = recentLogs.filter(
      (log) => log.timestamp.startsWith(dateStr)
    ).length;
    dailyStats.push({ date: dateStr, count });
  }

  return {
    total: recentLogs.length,
    moduleStats,
    actionStats,
    statusStats,
    operatorStats,
    dailyStats,
  };
};

export const exportAuditLogs = (filter: AuditLogFilter, format: 'csv' | 'json' = 'json'): string => {
  const { list } = queryAuditLogs({ ...filter, page: 1, pageSize: 10000 });

  if (format === 'json') {
    return JSON.stringify(list, null, 2);
  }

  const headers = [
    'ID',
    '时间',
    '操作人',
    '角色',
    '模块',
    '操作',
    '状态',
    'IP地址',
    '详情',
  ];

  const rows = list.map((log) => [
    log.id,
    log.timestamp,
    log.operatorName,
    log.operatorRole,
    log.module,
    log.action,
    log.status,
    log.ipAddress,
    log.details.replace(/,/g, '，'),
  ]);

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
};

if (typeof window !== 'undefined') {
  createAuditLog({
    operatorId: 'system',
    operatorName: 'system',
    operatorRole: 'system',
    module: 'system',
    action: 'login',
    details: '审计日志系统初始化',
    status: 'info',
  }).catch(() => {});
}
