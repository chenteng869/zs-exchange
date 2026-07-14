/**
 * FJN Risk Service REST API
 * /api/v1/fjn/risk
 *
 * 文档：H034
 *
 * 支持的 actions:
 *  - GET  ?action=rule-list                   列出规则
 *  - GET  ?action=rule-detail&id=xxx          规则详情
 *  - GET  ?action=rule-by-code&code=xxx       按 code 查规则
 *  - GET  ?action=event-list                  列出事件
 *  - GET  ?action=event-detail&id=xxx         事件详情
 *  - GET  ?action=case-list                   列出案件
 *  - GET  ?action=case-detail&id=xxx          案件详情
 *  - GET  ?action=score-list                  列出用户分数历史
 *  - GET  ?action=score-latest                查最新分数
 *  - GET  ?action=blacklist-list              列出黑名单
 *  - GET  ?action=blacklist-check             检查黑名单 (category, value)
 *  - GET  ?action=device-list                 列出设备
 *  - GET  ?action=device-by-fingerprint       按指纹查设备
 *  - POST action=rule-create                  创建规则 (admin)
 *  - POST action=rule-update                  更新规则 (admin)
 *  - POST action=rule-enable                  启用规则 (admin)
 *  - POST action=rule-disable                 禁用规则 (admin)
 *  - POST action=event-record                 记录事件 (admin)
 *  - POST action=event-review                 审核事件 (admin)
 *  - POST action=event-resolve                解决事件 (admin)
 *  - POST action=event-escalate               升级事件 (admin)
 *  - POST action=case-open                    开案 (admin)
 *  - POST action=case-assign                  分派案件 (admin)
 *  - POST action=case-resolve                 解决案件 (admin)
 *  - POST action=case-close                   关闭案件 (admin)
 *  - POST action=case-reopen                  重开案件 (admin)
 *  - POST action=score-update                 更新分数 (admin)
 *  - POST action=blacklist-add                添加黑名单 (admin)
 *  - POST action=blacklist-remove             移除黑名单 (admin)
 *  - POST action=blacklist-expire             扫描过期黑名单 (admin)
 *  - POST action=device-register              注册设备 (admin)
 */

import { NextRequest } from 'next/server';
import {
  success,
  badRequest,
  notFound,
  serverError,
  created,
} from '@/lib/api/response';
import { handleApiError } from '@/lib/api/error-handler';
import { withAuth, withAdminAuth } from '@/lib/api/middleware';
import { logger } from '@/lib/logger';
import { FjnRiskService } from '@/lib/fjn/services/risk-service';
import { FjnError } from '@/lib/fjn/errors';

// 强制动态路由：使用 nextUrl.searchParams 必须开启
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const action = req.nextUrl.searchParams.get('action');
  switch (action) {
    case 'rule-list':
      return withAuth(req, () => listRules(req));
    case 'rule-detail':
      return withAuth(req, () => getRuleDetail(req));
    case 'rule-by-code':
      return withAuth(req, () => getRuleByCode(req));
    case 'event-list':
      return withAuth(req, (ctx) => listEvents(req, ctx.userId, ctx.user?.userType === 'admin'));
    case 'event-detail':
      return withAuth(req, () => getEventDetail(req));
    case 'case-list':
      return withAuth(req, () => listCases(req));
    case 'case-detail':
      return withAuth(req, () => getCaseDetail(req));
    case 'score-list':
      return withAuth(req, (ctx) => listScores(req, ctx.userId, ctx.user?.userType === 'admin'));
    case 'score-latest':
      return withAuth(req, (ctx) => getLatestScore(req, ctx.userId, ctx.user?.userType === 'admin'));
    case 'blacklist-list':
      return withAuth(req, () => listBlacklists(req));
    case 'blacklist-check':
      return withAuth(req, () => checkBlacklist(req));
    case 'device-list':
      return withAuth(req, (ctx) => listDevices(req, ctx.userId, ctx.user?.userType === 'admin'));
    case 'device-by-fingerprint':
      return withAuth(req, () => getDeviceByFingerprint(req));
    default:
      return badRequest(
        'Invalid action. Supported: rule-list, rule-detail, rule-by-code, event-list, event-detail, case-list, case-detail, score-list, score-latest, blacklist-list, blacklist-check, device-list, device-by-fingerprint',
      );
  }
}

export async function POST(req: NextRequest) {
  const action = req.nextUrl.searchParams.get('action');
  switch (action) {
    case 'rule-create':
      return withAdminAuth(req, (ctx) => createRule(req, ctx.userId));
    case 'rule-update':
      return withAdminAuth(req, (ctx) => updateRule(req, ctx.userId));
    case 'rule-enable':
      return withAdminAuth(req, (ctx) => enableRule(req, ctx.userId));
    case 'rule-disable':
      return withAdminAuth(req, (ctx) => disableRule(req, ctx.userId));
    case 'event-record':
      return withAdminAuth(req, (ctx) => recordEvent(req, ctx.userId));
    case 'event-review':
      return withAdminAuth(req, (ctx) => reviewEvent(req, ctx.userId));
    case 'event-resolve':
      return withAdminAuth(req, (ctx) => resolveEvent(req, ctx.userId));
    case 'event-escalate':
      return withAdminAuth(req, (ctx) => escalateEvent(req, ctx.userId));
    case 'case-open':
      return withAdminAuth(req, (ctx) => openCase(req, ctx.userId));
    case 'case-assign':
      return withAdminAuth(req, (ctx) => assignCase(req, ctx.userId));
    case 'case-resolve':
      return withAdminAuth(req, (ctx) => resolveCase(req, ctx.userId));
    case 'case-close':
      return withAdminAuth(req, (ctx) => closeCase(req, ctx.userId));
    case 'case-reopen':
      return withAdminAuth(req, (ctx) => reopenCase(req, ctx.userId));
    case 'score-update':
      return withAdminAuth(req, (ctx) => updateScore(req, ctx.userId));
    case 'blacklist-add':
      return withAdminAuth(req, (ctx) => addBlacklist(req, ctx.userId));
    case 'blacklist-remove':
      return withAdminAuth(req, (ctx) => removeBlacklist(req, ctx.userId));
    case 'blacklist-expire':
      return withAdminAuth(req, () => expireBlacklists());
    case 'device-register':
      return withAdminAuth(req, (ctx) => registerDevice(req, ctx.userId));
    default:
      return badRequest(
        'Invalid action. Supported: rule-create, rule-update, rule-enable, rule-disable, event-record, event-review, event-resolve, event-escalate, case-open, case-assign, case-resolve, case-close, case-reopen, score-update, blacklist-add, blacklist-remove, blacklist-expire, device-register',
      );
  }
}

// ============================================================
// GET handlers
// ============================================================

async function listRules(req: NextRequest) {
  try {
    const p = req.nextUrl.searchParams;
    const ruleType = p.get('ruleType') || undefined;
    const riskLevel = p.get('riskLevel') || undefined;
    const enabled = p.get('enabled');
    const limit = parseInt(p.get('limit') || '50');
    const offset = parseInt(p.get('offset') || '0');
    const svc = new FjnRiskService();
    const result = await svc.listRules({
      ruleType: ruleType as any,
      riskLevel: riskLevel as any,
      enabled: enabled === null ? undefined : enabled === 'true',
      limit,
      offset,
    });
    return success(result);
  } catch (e: any) {
    return handleApiError(e, 'api:fjn/risk rule-list');
  }
}

async function getRuleDetail(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id');
  if (!id) return badRequest('Missing id');
  try {
    const svc = new FjnRiskService();
    const r = await svc.findRuleById(id);
    if (!r) return notFound('Risk rule not found');
    return success(r);
  } catch (e: any) {
    return handleApiError(e, 'api:fjn/risk rule-detail');
  }
}

async function getRuleByCode(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code');
  if (!code) return badRequest('Missing code');
  try {
    const svc = new FjnRiskService();
    const r = await svc.findRuleByCode(code);
    if (!r) return notFound('Risk rule not found');
    return success(r);
  } catch (e: any) {
    return handleApiError(e, 'api:fjn/risk rule-by-code');
  }
}

async function listEvents(req: NextRequest, ctxUserId: string, isAdmin: boolean) {
  try {
    const p = req.nextUrl.searchParams;
    const eventType = p.get('eventType') || undefined;
    const riskLevel = p.get('riskLevel') || undefined;
    const status = p.get('status') || undefined;
    // P1-1 IDOR 防护：非 admin 强制 ctxUserId
    const userId = isAdmin ? (p.get('userId') || undefined) : ctxUserId;
    const limit = parseInt(p.get('limit') || '50');
    const offset = parseInt(p.get('offset') || '0');
    const svc = new FjnRiskService();
    const result = await svc.listEvents({
      eventType: eventType as any,
      riskLevel: riskLevel as any,
      status: status as any,
      userId,
      limit,
      offset,
    });
    return success(result);
  } catch (e: any) {
    return handleApiError(e, 'api:fjn/risk event-list');
  }
}

async function getEventDetail(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id');
  if (!id) return badRequest('Missing id');
  try {
    const svc = new FjnRiskService();
    const e = await svc.findEventById(id);
    if (!e) return notFound('Risk event not found');
    return success(e);
  } catch (e: any) {
    return handleApiError(e, 'api:fjn/risk event-detail');
  }
}

async function listCases(req: NextRequest) {
  try {
    const p = req.nextUrl.searchParams;
    const caseType = p.get('caseType') || undefined;
    const riskLevel = p.get('riskLevel') || undefined;
    const caseStatus = p.get('caseStatus') || undefined;
    const userId = p.get('userId') || undefined;
    const limit = parseInt(p.get('limit') || '50');
    const offset = parseInt(p.get('offset') || '0');
    const svc = new FjnRiskService();
    const result = await svc.listCases({
      caseType: caseType as any,
      riskLevel: riskLevel as any,
      status: caseStatus as any,
      userId,
      limit,
      offset,
    });
    return success(result);
  } catch (e: any) {
    return handleApiError(e, 'api:fjn/risk case-list');
  }
}

async function getCaseDetail(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id');
  if (!id) return badRequest('Missing id');
  try {
    const svc = new FjnRiskService();
    const c = await svc.findCaseById(id);
    if (!c) return notFound('Risk case not found');
    return success(c);
  } catch (e: any) {
    return handleApiError(e, 'api:fjn/risk case-detail');
  }
}

async function listScores(req: NextRequest, ctxUserId: string, isAdmin: boolean) {
  // P1-1 IDOR 防护：非 admin 强制 ctxUserId；admin 可选
  const queryUserId = req.nextUrl.searchParams.get('userId');
  const userId = isAdmin ? (queryUserId || ctxUserId) : ctxUserId;
  if (!userId) return badRequest('Missing userId');
  try {
    const p = req.nextUrl.searchParams;
    const scoreType = p.get('scoreType') || undefined;
    const limit = parseInt(p.get('limit') || '20');
    const svc = new FjnRiskService();
    const result = await svc.listUserScores(userId, { scoreType: scoreType as any, limit });
    return success(result);
  } catch (e) {
    return handleApiError(e, 'api:fjn/risk score-list');
  }
}

async function getLatestScore(req: NextRequest, ctxUserId: string, isAdmin: boolean) {
  // P1-1 IDOR 防护：非 admin 强制 ctxUserId
  const queryUserId = req.nextUrl.searchParams.get('userId');
  const userId = isAdmin ? (queryUserId || ctxUserId) : ctxUserId;
  if (!userId) return badRequest('Missing userId');
  try {
    const scoreType = (req.nextUrl.searchParams.get('scoreType') as any) || 'user';
    const svc = new FjnRiskService();
    const r = await svc.getLatestUserScore(userId, scoreType);
    if (!r) return notFound('No score record');
    return success(r);
  } catch (e) {
    return handleApiError(e, 'api:fjn/risk score-latest');
  }
}

async function listBlacklists(req: NextRequest) {
  try {
    const p = req.nextUrl.searchParams;
    const category = p.get('category') || undefined;
    const enabled = p.get('enabled');
    const limit = parseInt(p.get('limit') || '50');
    const offset = parseInt(p.get('offset') || '0');
    const svc = new FjnRiskService();
    const result = await svc.listBlacklists({
      category: category as any,
      enabled: enabled === null ? undefined : enabled === 'true',
      limit,
      offset,
    });
    return success(result);
  } catch (e: any) {
    return handleApiError(e, 'api:fjn/risk blacklist-list');
  }
}

async function checkBlacklist(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  const category = p.get('category');
  const value = p.get('value');
  if (!category || !value) return badRequest('Missing required: category, value');
  try {
    const svc = new FjnRiskService();
    const result = await svc.checkBlacklist(category as any, value);
    return success({ matched: !!result, record: result });
  } catch (e: any) {
    return handleApiError(e, 'api:fjn/risk blacklist-check');
  }
}

async function listDevices(req: NextRequest, ctxUserId: string, isAdmin: boolean) {
  try {
    const p = req.nextUrl.searchParams;
    // P1-1 IDOR 防护：非 admin 强制 ctxUserId
    const userId = isAdmin ? (p.get('userId') || undefined) : ctxUserId;
    const riskLevel = p.get('riskLevel') || undefined;
    const countryCode = p.get('countryCode') || undefined;
    const limit = parseInt(p.get('limit') || '50');
    const offset = parseInt(p.get('offset') || '0');
    const svc = new FjnRiskService();
    const result = await svc.listDevices({
      userId,
      riskLevel: riskLevel as any,
      countryCode,
      limit,
      offset,
    });
    return success(result);
  } catch (e: any) {
    return handleApiError(e, 'api:fjn/risk device-list');
  }
}

async function getDeviceByFingerprint(req: NextRequest) {
  const fp = req.nextUrl.searchParams.get('fingerprint');
  if (!fp) return badRequest('Missing fingerprint');
  try {
    const svc = new FjnRiskService();
    const d = await svc.findDeviceByFingerprint(fp);
    if (!d) return notFound('Device not found');
    return success(d);
  } catch (e: any) {
    return handleApiError(e, 'api:fjn/risk device-by-fingerprint');
  }
}

// ============================================================
// POST handlers (admin)
// ============================================================

async function createRule(req: NextRequest, operatorId: string) {
  try {
    const body = await req.json();
    const {
      ruleCode,
      ruleName,
      ruleType,
      riskLevel,
      action,
      ruleConfig,
      priority,
      enabled,
    } = body;
    if (!ruleCode || !ruleName || !ruleType || !riskLevel || !action || !ruleConfig) {
      return badRequest(
        'Missing required: ruleCode, ruleName, ruleType, riskLevel, action, ruleConfig',
      );
    }
    const svc = new FjnRiskService();
    const result = await svc.createRule({
      ruleCode,
      ruleName,
      ruleType,
      riskLevel,
      action,
      ruleConfig,
      priority,
      enabled,
      operatorId,
    });
    return created(result);
  } catch (e: any) {
    if (e instanceof FjnError) {
      return badRequest(e.message, { code: e.code, context: e.context });
    }
    return handleApiError(e, 'api:fjn/risk rule-create');
  }
}

async function updateRule(req: NextRequest, operatorId: string) {
  try {
    const body = await req.json();
    const { id, ruleName, riskLevel, action, ruleConfig, priority } = body;
    if (!id) return badRequest('Missing required: id');
    const svc = new FjnRiskService();
    const result = await svc.updateRule(id, {
      ruleName,
      riskLevel,
      action,
      ruleConfig,
      priority,
      operatorId,
    });
    return success(result);
  } catch (e: any) {
    if (e instanceof FjnError) {
      return badRequest(e.message, { code: e.code, context: e.context });
    }
    return handleApiError(e, 'api:fjn/risk rule-update');
  }
}

async function enableRule(req: NextRequest, operatorId: string) {
  try {
    const body = await req.json();
    const { id } = body;
    if (!id) return badRequest('Missing required: id');
    const svc = new FjnRiskService();
    const result = await svc.enableRule(id, { operatorId });
    return success(result);
  } catch (e: any) {
    if (e instanceof FjnError) {
      return badRequest(e.message, { code: e.code, context: e.context });
    }
    return handleApiError(e, 'api:fjn/risk rule-enable');
  }
}

async function disableRule(req: NextRequest, operatorId: string) {
  try {
    const body = await req.json();
    const { id, reason } = body;
    if (!id) return badRequest('Missing required: id');
    const svc = new FjnRiskService();
    const result = await svc.disableRule(id, { reason, operatorId });
    return success(result);
  } catch (e: any) {
    if (e instanceof FjnError) {
      return badRequest(e.message, { code: e.code, context: e.context });
    }
    return handleApiError(e, 'api:fjn/risk rule-disable');
  }
}

async function recordEvent(req: NextRequest, operatorId: string) {
  try {
    const body = await req.json();
    const {
      eventType,
      userId,
      riskScore,
      riskLevel,
      sourceType,
      sourceId,
      ruleId,
      payload,
      action,
    } = body;
    if (!eventType || riskScore === undefined) {
      return badRequest('Missing required: eventType, riskScore');
    }
    const svc = new FjnRiskService();
    const result = await svc.recordEvent({
      eventType,
      userId,
      riskScore,
      riskLevel,
      sourceType,
      sourceId,
      ruleId,
      payload,
      action,
      operatorId,
    });
    return created(result);
  } catch (e: any) {
    if (e instanceof FjnError) {
      return badRequest(e.message, { code: e.code, context: e.context });
    }
    return handleApiError(e, 'api:fjn/risk event-record');
  }
}

async function reviewEvent(req: NextRequest, operatorId: string) {
  try {
    const body = await req.json();
    const { id, reviewerId } = body;
    if (!id || !reviewerId) return badRequest('Missing required: id, reviewerId');
    const svc = new FjnRiskService();
    const result = await svc.reviewEvent(id, { reviewerId, operatorId });
    return success(result);
  } catch (e: any) {
    if (e instanceof FjnError) {
      return badRequest(e.message, { code: e.code, context: e.context });
    }
    return handleApiError(e, 'api:fjn/risk event-review');
  }
}

async function resolveEvent(req: NextRequest, operatorId: string) {
  try {
    const body = await req.json();
    const { id, resolution, reviewNote } = body;
    if (!id || !resolution) return badRequest('Missing required: id, resolution');
    const svc = new FjnRiskService();
    // reviewerId 使用已认证的管理员 ctx.userId（真实 UUID），不信任客户端传入值，避免写入 reviewerId(Uuid) 列时类型不匹配
    const result = await svc.resolveEvent(id, {
      resolution,
      reviewerId: operatorId,
      reviewNote,
      operatorId,
    });
    return success(result);
  } catch (e: any) {
    if (e instanceof FjnError) {
      return badRequest(e.message, { code: e.code, context: e.context });
    }
    return handleApiError(e, 'api:fjn/risk event-resolve');
  }
}

async function escalateEvent(req: NextRequest, operatorId: string) {
  try {
    const body = await req.json();
    const { id, reason, targetLevel } = body;
    if (!id || !reason || !targetLevel) {
      return badRequest('Missing required: id, reason, targetLevel');
    }
    const svc = new FjnRiskService();
    const result = await svc.escalateEvent(id, { reason, targetLevel, operatorId });
    return success(result);
  } catch (e: any) {
    if (e instanceof FjnError) {
      return badRequest(e.message, { code: e.code, context: e.context });
    }
    return handleApiError(e, 'api:fjn/risk event-escalate');
  }
}

async function openCase(req: NextRequest, operatorId: string) {
  try {
    const body = await req.json();
    const { userId, caseType, riskLevel, description, relatedEventIds } = body;
    if (!userId || !caseType || !riskLevel) {
      return badRequest('Missing required: userId, caseType, riskLevel');
    }
    const svc = new FjnRiskService();
    const result = await svc.openCase({
      userId,
      caseType,
      riskLevel,
      description,
      relatedEventIds,
      operatorId,
    });
    return created(result);
  } catch (e: any) {
    if (e instanceof FjnError) {
      return badRequest(e.message, { code: e.code, context: e.context });
    }
    return handleApiError(e, 'api:fjn/risk case-open');
  }
}

async function assignCase(req: NextRequest, operatorId: string) {
  try {
    const body = await req.json();
    const { id, assignedTo } = body;
    if (!id || !assignedTo) return badRequest('Missing required: id, assignedTo');
    const svc = new FjnRiskService();
    const result = await svc.assignCase(id, { assignedTo, operatorId });
    return success(result);
  } catch (e: any) {
    if (e instanceof FjnError) {
      return badRequest(e.message, { code: e.code, context: e.context });
    }
    return handleApiError(e, 'api:fjn/risk case-assign');
  }
}

async function resolveCase(req: NextRequest, operatorId: string) {
  try {
    const body = await req.json();
    const { id, resolution, action } = body;
    if (!id || !resolution || !action) {
      return badRequest('Missing required: id, resolution, action');
    }
    const svc = new FjnRiskService();
    const result = await svc.resolveCase(id, { resolution, action, operatorId });
    return success(result);
  } catch (e: any) {
    if (e instanceof FjnError) {
      return badRequest(e.message, { code: e.code, context: e.context });
    }
    return handleApiError(e, 'api:fjn/risk case-resolve');
  }
}

async function closeCase(req: NextRequest, operatorId: string) {
  try {
    const body = await req.json();
    const { id, resolution } = body;
    if (!id || !resolution) return badRequest('Missing required: id, resolution');
    const svc = new FjnRiskService();
    const result = await svc.closeCase(id, { resolution, operatorId });
    return success(result);
  } catch (e: any) {
    if (e instanceof FjnError) {
      return badRequest(e.message, { code: e.code, context: e.context });
    }
    return handleApiError(e, 'api:fjn/risk case-close');
  }
}

async function reopenCase(req: NextRequest, operatorId: string) {
  try {
    const body = await req.json();
    const { id, reason } = body;
    if (!id || !reason) return badRequest('Missing required: id, reason');
    const svc = new FjnRiskService();
    const result = await svc.reopenCase(id, { reason, operatorId });
    return success(result);
  } catch (e: any) {
    if (e instanceof FjnError) {
      return badRequest(e.message, { code: e.code, context: e.context });
    }
    return handleApiError(e, 'api:fjn/risk case-reopen');
  }
}

async function updateScore(req: NextRequest, operatorId: string) {
  try {
    const body = await req.json();
    const { userId, scoreType, score, riskLevel, factors } = body;
    if (!userId || !scoreType || score === undefined) {
      return badRequest('Missing required: userId, scoreType, score');
    }
    const svc = new FjnRiskService();
    const result = await svc.updateScore({
      userId,
      scoreType,
      score,
      riskLevel,
      factors,
      operatorId,
    });
    return created(result);
  } catch (e: any) {
    if (e instanceof FjnError) {
      return badRequest(e.message, { code: e.code, context: e.context });
    }
    return handleApiError(e, 'api:fjn/risk score-update');
  }
}

async function addBlacklist(req: NextRequest, operatorId: string) {
  try {
    const body = await req.json();
    const { category, value, reason, userId, source, expiresAt } = body;
    if (!category || !value || !reason) {
      return badRequest('Missing required: category, value, reason');
    }
    const svc = new FjnRiskService();
    const result = await svc.addBlacklist({
      category,
      value,
      reason,
      userId,
      source,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      operatorId,
    });
    return created(result);
  } catch (e: any) {
    if (e instanceof FjnError) {
      return badRequest(e.message, { code: e.code, context: e.context });
    }
    return handleApiError(e, 'api:fjn/risk blacklist-add');
  }
}

async function removeBlacklist(req: NextRequest, operatorId: string) {
  try {
    const body = await req.json();
    const { id, reason } = body;
    if (!id || !reason) return badRequest('Missing required: id, reason');
    const svc = new FjnRiskService();
    const result = await svc.removeBlacklist(id, { reason, operatorId });
    return success(result);
  } catch (e: any) {
    if (e instanceof FjnError) {
      return badRequest(e.message, { code: e.code, context: e.context });
    }
    return handleApiError(e, 'api:fjn/risk blacklist-remove');
  }
}

async function expireBlacklists() {
  try {
    const svc = new FjnRiskService();
    const result = await svc.expireBlacklists();
    return success(result);
  } catch (e: any) {
    if (e instanceof FjnError) {
      return badRequest(e.message, { code: e.code, context: e.context });
    }
    return handleApiError(e, 'api:fjn/risk blacklist-expire');
  }
}

async function registerDevice(req: NextRequest, operatorId: string) {
  try {
    const body = await req.json();
    const {
      fingerprint,
      userId,
      userAgent,
      deviceType,
      osVersion,
      browserVersion,
      screenResolution,
      timezone,
      language,
      ipAddress,
      countryCode,
    } = body;
    if (!fingerprint) return badRequest('Missing required: fingerprint');
    const svc = new FjnRiskService();
    const result = await svc.registerDevice({
      fingerprint,
      userId,
      userAgent,
      deviceType,
      osVersion,
      browserVersion,
      screenResolution,
      timezone,
      language,
      ipAddress,
      countryCode,
      operatorId,
    });
    return created(result);
  } catch (e: any) {
    if (e instanceof FjnError) {
      return badRequest(e.message, { code: e.code, context: e.context });
    }
    return handleApiError(e, 'api:fjn/risk device-register');
  }
}
