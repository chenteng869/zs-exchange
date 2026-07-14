/**
 * FJN Tax Service REST API
 * /api/v1/fjn/tax
 *
 * 文档：H033
 *
 * 支持的 actions:
 *  - GET  ?action=rule-list                   列出规则
 *  - GET  ?action=rule-detail&id=xxx          规则详情
 *  - GET  ?action=rule-active                 查激活规则 (ruleCode, regionCode, atDate)
 *  - GET  ?action=record-list                 列出记录
 *  - GET  ?action=record-detail&id=xxx        记录详情
 *  - GET  ?action=report-list                 列出报表
 *  - GET  ?action=report-detail&id=xxx        报表详情
 *  - POST action=calculate                    计算税额 (admin)
 *  - POST action=rule-create                  创建规则 (admin)
 *  - POST action=rule-update                  更新规则 (admin)
 *  - POST action=rule-archive                 归档规则 (admin)
 *  - POST action=rule-deactivate              停用规则 (admin)
 *  - POST action=record-create                记录税务 (admin)
 *  - POST action=record-mark-paid             标记记录已支付 (admin)
 *  - POST action=record-adjust                调整记录 (admin)
 *  - POST action=record-reverse               冲销记录 (admin)
 *  - POST action=report-create                创建报表 (admin)
 *  - POST action=report-submit                提交报表 (admin)
 *  - POST action=report-mark-paid             标记报表已支付 (admin)
 *  - POST action=report-reject                驳回报表 (admin)
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
import { FjnTaxService } from '@/lib/fjn/services/tax-service';
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
    case 'rule-active':
      return withAuth(req, () => getActiveRule(req));
    case 'record-list':
      return withAuth(req, (ctx) => listRecords(req, ctx.userId, ctx.user?.userType === 'admin'));
    case 'record-detail':
      return withAuth(req, () => getRecordDetail(req));
    case 'report-list':
      return withAuth(req, () => listReports(req));
    case 'report-detail':
      return withAuth(req, () => getReportDetail(req));
    default:
      return badRequest(
        'Invalid action. Supported: rule-list, rule-detail, rule-active, record-list, record-detail, report-list, report-detail',
      );
  }
}

export async function POST(req: NextRequest) {
  const action = req.nextUrl.searchParams.get('action');
  switch (action) {
    case 'calculate':
      return withAuth(req, () => calculateTax(req));
    case 'rule-create':
      return withAdminAuth(req, (ctx) => createRule(req, ctx.userId));
    case 'rule-update':
      return withAdminAuth(req, (ctx) => updateRule(req, ctx.userId));
    case 'rule-archive':
      return withAdminAuth(req, (ctx) => archiveRule(req, ctx.userId));
    case 'rule-deactivate':
      return withAdminAuth(req, (ctx) => deactivateRule(req, ctx.userId));
    case 'record-create':
      return withAdminAuth(req, (ctx) => recordTax(req, ctx.userId));
    case 'record-mark-paid':
      return withAdminAuth(req, (ctx) => markRecordPaid(req, ctx.userId));
    case 'record-adjust':
      return withAdminAuth(req, (ctx) => adjustRecord(req, ctx.userId));
    case 'record-reverse':
      return withAdminAuth(req, (ctx) => reverseRecord(req, ctx.userId));
    case 'report-create':
      return withAdminAuth(req, (ctx) => createReport(req, ctx.userId));
    case 'report-submit':
      return withAdminAuth(req, (ctx) => submitReport(req, ctx.userId));
    case 'report-mark-paid':
      return withAdminAuth(req, (ctx) => markReportPaid(req, ctx.userId));
    case 'report-reject':
      return withAdminAuth(req, (ctx) => rejectReport(req, ctx.userId));
    default:
      return badRequest(
        'Invalid action. Supported: calculate, rule-create, rule-update, rule-archive, rule-deactivate, record-create, record-mark-paid, record-adjust, record-reverse, report-create, report-submit, report-mark-paid, report-reject',
      );
  }
}

// ============================================================
// GET handlers
// ============================================================

async function listRules(req: NextRequest) {
  try {
    const p = req.nextUrl.searchParams;
    const taxType = p.get('taxType') || undefined;
    const regionCode = p.get('regionCode') || undefined;
    const status = p.get('status') || undefined;
    const limit = parseInt(p.get('limit') || '50');
    const offset = parseInt(p.get('offset') || '0');
    const svc = new FjnTaxService();
    const result = await svc.listRules({
      taxType: taxType as any,
      regionCode,
      status: status as any,
      limit,
      offset,
    });
    return success(result);
  } catch (e: any) {
    return handleApiError(e, 'api:fjn/tax rule-list');
  }
}

async function getRuleDetail(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id');
  if (!id) return badRequest('Missing id');
  try {
    const svc = new FjnTaxService();
    const r = await svc.findRuleById(id);
    if (!r) return notFound('Tax rule not found');
    return success(r);
  } catch (e: any) {
    return handleApiError(e, 'api:fjn/tax rule-detail');
  }
}

async function getActiveRule(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  const ruleCode = p.get('ruleCode');
  const regionCode = p.get('regionCode');
  if (!ruleCode || !regionCode) return badRequest('Missing required: ruleCode, regionCode');
  try {
    const atDateStr = p.get('atDate');
    const svc = new FjnTaxService();
    const r = await svc.findActiveRule({
      ruleCode,
      regionCode,
      atDate: atDateStr ? new Date(atDateStr) : undefined,
    });
    if (!r) return notFound('No active rule found');
    return success(r);
  } catch (e: any) {
    return handleApiError(e, 'api:fjn/tax rule-active');
  }
}

async function listRecords(req: NextRequest, ctxUserId: string, isAdmin: boolean) {
  try {
    const p = req.nextUrl.searchParams;
    const ruleId = p.get('ruleId') || undefined;
    const taxType = p.get('taxType') || undefined;
    const regionCode = p.get('regionCode') || undefined;
    const status = p.get('status') || undefined;
    const reportPeriod = p.get('reportPeriod') || undefined;
    const orderId = p.get('orderId') || undefined;
    // P1-1 IDOR 防护：非 admin 强制 ctxUserId
    const userId = isAdmin ? (p.get('userId') || undefined) : ctxUserId;
    const limit = parseInt(p.get('limit') || '50');
    const offset = parseInt(p.get('offset') || '0');
    const svc = new FjnTaxService();
    const result = await svc.listRecords({
      ruleId,
      taxType: taxType as any,
      regionCode,
      status: status as any,
      reportPeriod,
      orderId,
      userId,
      limit,
      offset,
    });
    return success(result);
  } catch (e: any) {
    return handleApiError(e, 'api:fjn/tax record-list');
  }
}

async function getRecordDetail(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id');
  if (!id) return badRequest('Missing id');
  try {
    const svc = new FjnTaxService();
    const r = await svc.findRecordById(id);
    if (!r) return notFound('Tax record not found');
    return success(r);
  } catch (e: any) {
    return handleApiError(e, 'api:fjn/tax record-detail');
  }
}

async function listReports(req: NextRequest) {
  try {
    const p = req.nextUrl.searchParams;
    const regionCode = p.get('regionCode') || undefined;
    const taxType = p.get('taxType') || undefined;
    const status = p.get('status') || undefined;
    const reportPeriod = p.get('reportPeriod') || undefined;
    const limit = parseInt(p.get('limit') || '50');
    const offset = parseInt(p.get('offset') || '0');
    const svc = new FjnTaxService();
    const result = await svc.listReports({
      regionCode,
      taxType: taxType as any,
      status: status as any,
      reportPeriod,
      limit,
      offset,
    });
    return success(result);
  } catch (e: any) {
    return handleApiError(e, 'api:fjn/tax report-list');
  }
}

async function getReportDetail(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id');
  if (!id) return badRequest('Missing id');
  try {
    const svc = new FjnTaxService();
    const r = await svc.findReportById(id);
    if (!r) return notFound('Tax report not found');
    return success(r);
  } catch (e: any) {
    return handleApiError(e, 'api:fjn/tax report-detail');
  }
}

// ============================================================
// POST handlers
// ============================================================

async function calculateTax(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      ruleId,
      ruleCode,
      regionCode,
      taxType,
      taxableAmount,
      totalAmount,
      currency,
      taxMode,
    } = body;
    if (!taxableAmount || !currency || !taxMode) {
      return badRequest('Missing required: taxableAmount, currency, taxMode');
    }
    const svc = new FjnTaxService();
    const result = await svc.calculateTax({
      ruleId,
      ruleCode,
      regionCode,
      taxType,
      taxableAmount,
      totalAmount,
      currency,
      taxMode,
    });
    return success(result);
  } catch (e: any) {
    if (e instanceof FjnError) {
      return badRequest(e.message, { code: e.code, context: e.context });
    }
    return handleApiError(e, 'api:fjn/tax calculate');
  }
}

async function createRule(req: NextRequest, operatorId: string) {
  try {
    const body = await req.json();
    const {
      ruleCode,
      taxType,
      regionCode,
      taxRate,
      taxMode,
      applicableScope,
      effectiveFrom,
      effectiveTo,
      description,
    } = body;
    if (!ruleCode || !taxType || !regionCode || !taxRate || !effectiveFrom) {
      return badRequest('Missing required: ruleCode, taxType, regionCode, taxRate, effectiveFrom');
    }
    const svc = new FjnTaxService();
    const result = await svc.createRule({
      ruleCode,
      taxType,
      regionCode,
      taxRate,
      taxMode,
      applicableScope,
      effectiveFrom,
      effectiveTo,
      description,
      operatorId,
    });
    return created(result);
  } catch (e: any) {
    if (e instanceof FjnError) {
      return badRequest(e.message, { code: e.code, context: e.context });
    }
    return handleApiError(e, 'api:fjn/tax rule-create');
  }
}

async function updateRule(req: NextRequest, operatorId: string) {
  try {
    const body = await req.json();
    const { id, taxRate, taxMode, applicableScope, effectiveTo, description } = body;
    if (!id) return badRequest('Missing required: id');
    const svc = new FjnTaxService();
    const result = await svc.updateRule(id, {
      taxRate,
      taxMode,
      applicableScope,
      effectiveTo,
      description,
      operatorId,
    });
    return success(result);
  } catch (e: any) {
    if (e instanceof FjnError) {
      return badRequest(e.message, { code: e.code, context: e.context });
    }
    return handleApiError(e, 'api:fjn/tax rule-update');
  }
}

async function archiveRule(req: NextRequest, operatorId: string) {
  try {
    const body = await req.json();
    const { id, reason } = body;
    if (!id || !reason) return badRequest('Missing required: id, reason');
    const svc = new FjnTaxService();
    const result = await svc.archiveRule(id, { reason, operatorId });
    return success(result);
  } catch (e: any) {
    if (e instanceof FjnError) {
      return badRequest(e.message, { code: e.code, context: e.context });
    }
    return handleApiError(e, 'api:fjn/tax rule-archive');
  }
}

async function deactivateRule(req: NextRequest, operatorId: string) {
  try {
    const body = await req.json();
    const { id, reason } = body;
    if (!id) return badRequest('Missing required: id');
    const svc = new FjnTaxService();
    const result = await svc.deactivateRule(id, { reason, operatorId });
    return success(result);
  } catch (e: any) {
    if (e instanceof FjnError) {
      return badRequest(e.message, { code: e.code, context: e.context });
    }
    return handleApiError(e, 'api:fjn/tax rule-deactivate');
  }
}

async function recordTax(req: NextRequest, operatorId: string) {
  try {
    const body = await req.json();
    const {
      ruleId,
      sourceType,
      sourceId,
      orderId,
      userId,
      taxableAmount,
      taxMode,
      taxAmount,
      currency,
      reportPeriod,
      description,
    } = body;
    if (!ruleId || !sourceType || !sourceId || !taxableAmount) {
      return badRequest('Missing required: ruleId, sourceType, sourceId, taxableAmount');
    }
    const svc = new FjnTaxService();
    const result = await svc.recordTax({
      ruleId,
      sourceType,
      sourceId,
      orderId,
      userId,
      taxableAmount,
      taxMode,
      taxAmount,
      currency,
      reportPeriod,
      description,
      operatorId,
    });
    return created(result);
  } catch (e:any) {
    if (e instanceof FjnError) {
      return badRequest(e.message, { code: e.code, context: e.context });
    }
    return handleApiError(e, 'api:fjn/tax record-create');
  }
}

async function markRecordPaid(req: NextRequest, operatorId: string) {
  try {
    const body = await req.json();
    const { id, paidAt } = body;
    if (!id) return badRequest('Missing required: id');
    const svc = new FjnTaxService();
    const result = await svc.markRecordPaid(id, {
      paidAt: paidAt ? new Date(paidAt) : undefined,
      operatorId,
    });
    return success(result);
  } catch (e: any) {
    if (e instanceof FjnError) {
      return badRequest(e.message, { code: e.code, context: e.context });
    }
    return handleApiError(e, 'api:fjn/tax record-mark-paid');
  }
}

async function adjustRecord(req: NextRequest, operatorId: string) {
  try {
    const body = await req.json();
    const { id, adjustedTaxableAmount, adjustedTaxRate, reason } = body;
    if (!id || !adjustedTaxableAmount || !adjustedTaxRate || !reason) {
      return badRequest('Missing required: id, adjustedTaxableAmount, adjustedTaxRate, reason');
    }
    const svc = new FjnTaxService();
    const result = await svc.adjustRecord(id, {
      adjustedTaxableAmount,
      adjustedTaxRate,
      reason,
      operatorId,
    });
    return success(result);
  } catch (e: any) {
    if (e instanceof FjnError) {
      return badRequest(e.message, { code: e.code, context: e.context });
    }
    return handleApiError(e, 'api:fjn/tax record-adjust');
  }
}

async function reverseRecord(req: NextRequest, operatorId: string) {
  try {
    const body = await req.json();
    const { id, reason } = body;
    if (!id || !reason) return badRequest('Missing required: id, reason');
    const svc = new FjnTaxService();
    const result = await svc.reverseRecord(id, { reason, operatorId });
    return success(result);
  } catch (e: any) {
    if (e instanceof FjnError) {
      return badRequest(e.message, { code: e.code, context: e.context });
    }
    return handleApiError(e, 'api:fjn/tax record-reverse');
  }
}

async function createReport(req: NextRequest, operatorId: string) {
  try {
    const body = await req.json();
    const { regionCode, reportPeriod, taxType, currency } = body;
    if (!regionCode || !reportPeriod || !taxType) {
      return badRequest('Missing required: regionCode, reportPeriod, taxType');
    }
    const svc = new FjnTaxService();
    const result = await svc.createReport({
      regionCode,
      reportPeriod,
      taxType,
      currency,
      operatorId,
    });
    return created(result);
  } catch (e: any) {
    if (e instanceof FjnError) {
      return badRequest(e.message, { code: e.code, context: e.context });
    }
    return handleApiError(e, 'api:fjn/tax report-create');
  }
}

async function submitReport(req: NextRequest, operatorId: string) {
  try {
    const body = await req.json();
    const { id, approverId } = body;
    if (!id || !approverId) return badRequest('Missing required: id, approverId');
    const svc = new FjnTaxService();
    const result = await svc.submitReport(id, { approverId, operatorId });
    return success(result);
  } catch (e: any) {
    if (e instanceof FjnError) {
      return badRequest(e.message, { code: e.code, context: e.context });
    }
    return handleApiError(e, 'api:fjn/tax report-submit');
  }
}

async function markReportPaid(req: NextRequest, operatorId: string) {
  try {
    const body = await req.json();
    const { id, paidAt } = body;
    if (!id) return badRequest('Missing required: id');
    const svc = new FjnTaxService();
    const result = await svc.markReportPaid(id, {
      paidAt: paidAt ? new Date(paidAt) : undefined,
      operatorId,
    });
    return success(result);
  } catch (e: any) {
    if (e instanceof FjnError) {
      return badRequest(e.message, { code: e.code, context: e.context });
    }
    return handleApiError(e, 'api:fjn/tax report-mark-paid');
  }
}

async function rejectReport(req: NextRequest, operatorId: string) {
  try {
    const body = await req.json();
    const { id, reason } = body;
    if (!id || !reason) return badRequest('Missing required: id, reason');
    const svc = new FjnTaxService();
    const result = await svc.rejectReport(id, { reason, operatorId });
    return success(result);
  } catch (e: any) {
    if (e instanceof FjnError) {
      return badRequest(e.message, { code: e.code, context: e.context });
    }
    return handleApiError(e, 'api:fjn/tax report-reject');
  }
}
