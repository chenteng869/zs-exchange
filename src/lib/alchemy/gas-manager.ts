/**
 * Alchemy Gas Manager（2026-07-11 新建 · P6-4）
 *
 * 平台代付 Gas 服务
 *  - 查询当前用量
 *  - 申请代付（基于 policy）
 *  - 月度限额监控
 *  - 限额告警
 *
 * 业务场景：
 *  - 新用户冷启动（首次充值/提现免 Gas）
 *  - VIP 用户（每月 N 次免 Gas）
 *  - 营销活动（限时免 Gas）
 */

import { safeConsoleWarn, safeConsoleInfo } from '@/lib/security/safe-logger';
import { alertService } from '@/lib/monitoring/alert-service';

// =============================================================================
// 类型
// =============================================================================

export interface GasUsage {
  totalSponsored: number;        // 已代付 ETH 数量
  totalOperations: number;       // 已代付 op 数量
  monthToDate: number;           // 当月已用
  monthlyLimit: number;          // 当月限额
  usagePercent: number;          // 使用百分比
  periodStart: number;           // 当前周期开始时间
  periodEnd: number;             // 当前周期结束时间
}

export interface GasSponsorRequest {
  /** 平台用户 ID */
  userId: string;
  /** 操作类型 */
  operationType: 'withdraw' | 'transfer' | 'first_deposit' | 'nft_mint';
  /** UserOperation hash */
  userOpHash: string;
  /** 估算 Gas（ETH）*/
  estimatedGasEth: number;
}

export interface GasSponsorResult {
  approved: boolean;
  reason?: 'OVER_LIMIT' | 'POLICY_DENIED' | 'USER_LIMIT_EXCEEDED' | 'RATE_LIMITED';
  /** 实际代付 ETH 数量 */
  sponsored?: number;
  /** 剩余本月额度 */
  remaining?: number;
}

// =============================================================================
// 内存配额跟踪（生产中应存 DB）
// =============================================================================

declare global {
  // eslint-disable-next-line no-var
  var __gasUsageMap: Map<string, { count: number; ethSpent: number; monthKey: string }> | undefined;
}

function getUsageMap() {
  if (!globalThis.__gasUsageMap) {
    globalThis.__gasUsageMap = new Map();
  }
  return globalThis.__gasUsageMap;
}

function currentMonthKey(): string {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

// =============================================================================
// 配额配置
// =============================================================================

const MONTHLY_LIMIT_ETH = parseFloat(process.env.GAS_MONTHLY_LIMIT_ETH || '0.1'); // 0.1 ETH / 月
const PER_USER_DAILY_LIMIT = 5; // 每用户每天 5 次代付
const PER_OPERATION_ETH_CAP = 0.001; // 每次操作最多 0.001 ETH

// =============================================================================
// 配额检查
// =============================================================================

/**
 * 申请 Gas 代付
 */
export async function requestGasSponsorship(req: GasSponsorRequest): Promise<GasSponsorResult> {
  // 1. 检查全局月度限额
  const usage = await getGasUsage();
  if (usage.monthToDate + req.estimatedGasEth > MONTHLY_LIMIT_ETH) {
    safeConsoleWarn(`[gas-manager] monthly limit exceeded for user=${req.userId}`);
    return { approved: false, reason: 'OVER_LIMIT' };
  }

  // 2. 检查单次操作限额
  if (req.estimatedGasEth > PER_OPERATION_ETH_CAP) {
    safeConsoleWarn(`[gas-manager] operation gas too high: ${req.estimatedGasEth} ETH`);
    return { approved: false, reason: 'POLICY_DENIED' };
  }

  // 3. 检查用户日限额
  const map = getUsageMap();
  const key = `${req.userId}:${new Date().toISOString().slice(0, 10)}`;
  const userUsage = map.get(key) || { count: 0, ethSpent: 0, monthKey: currentMonthKey() };
  if (userUsage.count >= PER_USER_DAILY_LIMIT) {
    safeConsoleWarn(`[gas-manager] user daily limit exceeded: user=${req.userId}`);
    return { approved: false, reason: 'USER_LIMIT_EXCEEDED' };
  }

  // 4. 记录使用
  userUsage.count++;
  userUsage.ethSpent += req.estimatedGasEth;
  map.set(key, userUsage);

  // 5. 触发 Alchemy Paymaster
  try {
    // 占位：实际应调 Alchemy Gas Manager API
    // await sdk.paymaster.sponsorOperation({ policyId, userOp: req.userOpHash });
    safeConsoleInfo(`[gas-manager] sponsored ${req.estimatedGasEth} ETH for user=${req.userId} op=${req.userOpHash}`);

    // 6. 80% 阈值告警
    const newUsage = await getGasUsage();
    if (newUsage.usagePercent >= 80 && newUsage.usagePercent < 85) {
      try {
        await alertService.sendAlert({
          type: 'gas_budget_warning',
          level: 'medium',
          message: `[gas-manager] monthly budget at ${newUsage.usagePercent.toFixed(1)}% (${newUsage.monthToDate}/${newUsage.monthlyLimit} ETH)`,
          metadata: { usage: newUsage },
        });
      } catch {
        // 告警失败不阻塞
      }
    }

    return {
      approved: true,
      sponsored: req.estimatedGasEth,
      remaining: MONTHLY_LIMIT_ETH - newUsage.monthToDate,
    };
  } catch (err) {
    safeConsoleWarn(`[gas-manager] sponsor failed: ${(err as Error).message}`);
    return { approved: false, reason: 'POLICY_DENIED' };
  }
}

// =============================================================================
// 用量查询
// =============================================================================

/**
 * 获取当前 Gas 用量
 */
export async function getGasUsage(): Promise<GasUsage> {
  const monthKey = currentMonthKey();
  const map = getUsageMap();
  let totalEth = 0;
  let totalOps = 0;
  for (const v of map.values()) {
    if (v.monthKey === monthKey) {
      totalEth += v.ethSpent;
      totalOps += v.count;
    }
  }

  const now = new Date();
  const periodStart = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1);
  const periodEnd = Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1);

  return {
    totalSponsored: totalEth,
    totalOperations: totalOps,
    monthToDate: totalEth,
    monthlyLimit: MONTHLY_LIMIT_ETH,
    usagePercent: (totalEth / MONTHLY_LIMIT_ETH) * 100,
    periodStart,
    periodEnd,
  };
}

/**
 * 重置用户日配额（管理操作）
 */
export function resetUserDailyLimit(userId: string): void {
  const map = getUsageMap();
  const key = `${userId}:${new Date().toISOString().slice(0, 10)}`;
  map.delete(key);
}
