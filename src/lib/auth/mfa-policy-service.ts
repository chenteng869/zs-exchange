/**
 * MFA 策略服务 (L-2)
 *
 * 功能：
 *  - 管理员创建/查询/删除 MFA 强制策略
 *  - 评估用户是否需要 MFA（user/role/global 多层级）
 *  - 记录强制触发日志
 *
 * 策略优先级（高→低）：
 *  1. user 级策略（最优先）
 *  2. role 级策略
 *  3. global 级策略
 *  4. KYC 等级触发的临时策略
 */

import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

// ============================================================
// 类型
// ============================================================
export type MfaPolicyScope = 'user' | 'role' | 'global';

export interface CreateMfaPolicyInput {
  scope: MfaPolicyScope;
  userId?: string;
  roleName?: string;
  kycLevel?: string;
  required?: boolean;
  gracePeriodDays?: number;
  exemptRoles?: string[];
  enabledBy?: string;
  enabledByType?: 'admin' | 'system';
  reason?: string;
  expiresAt?: Date;
  metadata?: Record<string, any>;
}

export interface MfaEnforcementResult {
  required: boolean;
  reason: string;
  policyId?: string;
  gracePeriodEndsAt?: Date;
  exempt?: boolean;
}

export interface LogEnforcementInput {
  userId: string;
  policyId?: string;
  trigger: 'kyc_upgrade' | 'admin_enroll' | 'login' | 'sensitive_op' | 'role_change';
  action: 'prompted' | 'enrolled' | 'skipped' | 'blocked' | 'exempted';
  reason?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
}

// ============================================================
// 策略管理（CRUD）
// ============================================================

/**
 * 创建 MFA 策略
 */
export async function createMfaPolicy(input: CreateMfaPolicyInput) {
  // 验证范围
  if (input.scope === 'user' && !input.userId) {
    throw new Error('user scope requires userId');
  }
  if (input.scope === 'role' && !input.roleName) {
    throw new Error('role scope requires roleName');
  }

  // 软删除已存在的同 scope 策略（避免冲突）
  await prisma.fjnMfaPolicy.updateMany({
    where: {
      scope: input.scope,
      userId: input.userId as any,
      roleName: input.roleName,
      disabledAt: null,
    } as any,
    data: { disabledAt: new Date() } as any,
  });

  const policy = await prisma.fjnMfaPolicy.create({
    data: {
      scope: input.scope,
      userId: input.userId as any,
      roleName: input.roleName,
      kycLevel: input.kycLevel,
      required: input.required !== false,
      gracePeriodDays: input.gracePeriodDays ?? 7,
      exemptRoles: input.exemptRoles || [],
      enabledBy: input.enabledBy as any,
      enabledByType: input.enabledByType || 'admin',
      reason: input.reason,
      expiresAt: input.expiresAt,
      metadata: input.metadata as any,
    } as any,
  });

  logger.info(
    `[mfa-policy] Created policy ${(policy as any).id} scope=${input.scope} ` +
      `userId=${input.userId || '-'} roleName=${input.roleName || '-'}`,
  );

  return policy;
}

/**
 * 列出所有活跃策略
 */
export async function listMfaPolicies(filters?: {
  scope?: MfaPolicyScope;
  userId?: string;
  roleName?: string;
}) {
  const where: any = {
    disabledAt: null,
  };
  if (filters?.scope) where.scope = filters.scope;
  if (filters?.userId) where.userId = filters.userId as any;
  if (filters?.roleName) where.roleName = filters.roleName;

  return prisma.fjnMfaPolicy.findMany({
    where,
    orderBy: { enabledAt: 'desc' },
  });
}

/**
 * 禁用策略
 */
export async function disableMfaPolicy(policyId: string, disabledBy?: string) {
  return prisma.fjnMfaPolicy.update({
    where: { id: policyId as any },
    data: {
      disabledAt: new Date(),
      metadata: {
        disabledBy: disabledBy as any,
        disabledAt: new Date().toISOString(),
      } as any,
    } as any,
  });
}

// ============================================================
// 评估（核心）
// ============================================================

/**
 * 评估用户是否需要强制启用 MFA
 *
 * 优先级：user > role > global > kyc-level
 */
export async function evaluateMfaRequirement(params: {
  userId: string;
  userRoles?: string[];
  userKycLevel?: string;
}): Promise<MfaEnforcementResult> {
  const { userId, userRoles = [], userKycLevel } = params;

  // 1. user 级策略（最高优先）
  const userPolicy = await prisma.fjnMfaPolicy.findFirst({
    where: {
      scope: 'user',
      userId: userId as any,
      disabledAt: null,
    } as any,
    orderBy: { enabledAt: 'desc' },
  });

  if (userPolicy) {
    return await applyPolicy(userPolicy as any, userId, userRoles);
  }

  // 2. role 级策略
  for (const role of userRoles) {
    const rolePolicy = await prisma.fjnMfaPolicy.findFirst({
      where: {
        scope: 'role',
        roleName: role,
        disabledAt: null,
      } as any,
      orderBy: { enabledAt: 'desc' },
    });
    if (rolePolicy) {
      return await applyPolicy(rolePolicy as any, userId, userRoles);
    }
  }

  // 3. global 级策略
  const globalPolicy = await prisma.fjnMfaPolicy.findFirst({
    where: {
      scope: 'global',
      disabledAt: null,
    } as any,
    orderBy: { enabledAt: 'desc' },
  });
  if (globalPolicy) {
    return await applyPolicy(globalPolicy as any, userId, userRoles);
  }

  // 4. kyc-level 级策略（动态触发）
  if (userKycLevel) {
    const kycPolicies = await prisma.fjnMfaPolicy.findMany({
      where: {
        kycLevel: userKycLevel,
        disabledAt: null,
      } as any,
      orderBy: { enabledAt: 'desc' },
    });
    for (const p of kycPolicies) {
      const result = await applyPolicy(p, userId, userRoles);
      if (result.required) return result;
    }
  }

  return { required: false, reason: 'no_policy_matched' };
}

/**
 * 应用单个策略的检查逻辑
 */
async function applyPolicy(
  policy: any,
  userId: string,
  userRoles: string[],
): Promise<MfaEnforcementResult> {
  // 检查豁免角色
  const exemptRoles: string[] = policy.exemptRoles || [];
  if (userRoles.some((r) => exemptRoles.includes(r))) {
    return {
      required: false,
      reason: 'exempted_by_role',
      policyId: policy.id,
      exempt: true,
    };
  }

  // 检查过期
  if (policy.expiresAt && policy.expiresAt < new Date()) {
    return { required: false, reason: 'policy_expired', policyId: policy.id };
  }

  // 检查宽限期
  if (policy.gracePeriodDays > 0) {
    const graceEnd = new Date(policy.enabledAt);
    graceEnd.setDate(graceEnd.getDate() + policy.gracePeriodDays);
    if (new Date() < graceEnd) {
      return {
        required: policy.required,
        reason: 'in_grace_period',
        policyId: policy.id,
        gracePeriodEndsAt: graceEnd,
      };
    }
  }

  return {
    required: policy.required,
    reason: 'policy_enforced',
    policyId: policy.id,
  };
}

// ============================================================
// 强制触发日志
// ============================================================

/**
 * 记录强制触发日志
 */
export async function logEnforcement(input: LogEnforcementInput) {
  return prisma.fjnMfaEnforcementLog.create({
    data: {
      userId: input.userId as any,
      policyId: input.policyId as any,
      trigger: input.trigger,
      action: input.action,
      reason: input.reason,
      ipAddress: input.ipAddress,
      userAgent: input.userAgent?.slice(0, 500),
      metadata: input.metadata as any,
    } as any,
  });
}

/**
 * 查询用户强制触发历史
 */
export async function getUserEnforcementHistory(userId: string, limit = 50) {
  return prisma.fjnMfaEnforcementLog.findMany({
    where: { userId: userId as any } as any,
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
}

/**
 * 统计强制触发情况
 *  - 用于监控 / 报表
 */
export async function getEnforcementStats(days = 7) {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const result = await (prisma as any).fjnMfaEnforcementLog.groupBy({
    by: ['action'],
    where: { createdAt: { gte: since } },
    _count: { id: true },
  });

  return result.map((r: any) => ({
    action: r.action,
    count: r._count.id,
  }));
}
