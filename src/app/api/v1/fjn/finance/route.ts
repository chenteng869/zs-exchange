/**
 * FJN Finance Service REST API
 * /api/v1/fjn/finance
 *
 * 文档：H032
 *
 * 支持的 actions:
 *  - GET  ?action=account-list              列出账户
 *  - GET  ?action=account-detail&id=xxx     账户详情
 *  - GET  ?action=ledger-list               列出流水
 *  - GET  ?action=ledger-detail&id=xxx      流水详情
 *  - GET  ?action=settlement-list           列出结算单
 *  - GET  ?action=settlement-detail&id=xxx  结算单详情
 *  - GET  ?action=summary-account           账户汇总
 *  - GET  ?action=summary-ledger            流水汇总
 *  - GET  ?action=pools                     369 池子列表
 *  - POST action=account-create             创建账户 (admin)
 *  - POST action=account-freeze             冻结账户 (admin)
 *  - POST action=account-unfreeze           解冻账户 (admin)
 *  - POST action=account-close              关闭账户 (admin)
 *  - POST action=ledger-post                入账 (admin)
 *  - POST action=ledger-reverse             冲销流水 (admin)
 *  - POST action=ledger-void                作废流水 (admin)
 *  - POST action=revenue-recognize-369      369 收入确认 (admin)
 *  - POST action=pools-initialize           初始化 369 池子 (admin)
 *  - POST action=settlement-create          创建结算单 (admin)
 *  - POST action=settlement-add-item        添加结算条目 (admin)
 *  - POST action=settlement-approve         审核结算单 (admin)
 *  - POST action=settlement-pay             支付结算单 (admin)
 *  - POST action=settlement-cancel          取消结算单 (admin)
 */

import { NextRequest } from 'next/server';
import {
  success,
  badRequest,
  notFound,
  serverError,
  created,
  forbidden,    // P0-1: IDOR 防护 - ledger-detail 所有权检查需要
} from '@/lib/api/response';
import { handleApiError } from '@/lib/api/error-handler';
import { withAuth, withAdminAuth } from '@/lib/api/middleware';
import { logger } from '@/lib/logger';
import { FjnFinanceService } from '@/lib/fjn/services/finance-service';
import { FjnError } from '@/lib/fjn/errors';

// 强制动态路由：使用 nextUrl.searchParams 必须开启
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const action = req.nextUrl.searchParams.get('action');
  switch (action) {
    // P0-1 IDOR 修复：账户/结算/池子是平台级数据 → 仅 admin 可访问
    // 普通用户应通过 /api/v1/user/finance/... 访问自己的数据
    case 'account-list':
      return withAdminAuth(req, () => listAccounts(req));
    case 'account-detail':
      return withAdminAuth(req, () => getAccountDetail(req));
    // P0-1 IDOR 修复：流水有 userId 字段 → 普通用户仅看自己
    case 'ledger-list':
      return withAuth(req, (ctx) => listLedgers(req, ctx.userId, ctx.user?.userType === 'admin'));
    case 'ledger-detail':
      return withAuth(req, (ctx) =>
        getLedgerDetail(req, ctx.userId, ctx.user?.userType === 'admin'),
      );
    // P0-1 IDOR 修复：结算单是平台级 → 仅 admin 可访问
    case 'settlement-list':
      return withAdminAuth(req, () => listSettlements(req));
    case 'settlement-detail':
      return withAdminAuth(req, () => getSettlementDetail(req));
    // P0-1 IDOR 修复：账户汇总/池子是平台级 → 仅 admin
    case 'summary-account':
      return withAdminAuth(req, () => getAccountSummary(req));
    // P0-1 IDOR 修复：流水汇总有 userId 维度 → 普通用户仅自己
    case 'summary-ledger':
      return withAuth(req, (ctx) =>
        getLedgerSummary(req, ctx.userId, ctx.user?.userType === 'admin'),
      );
    case 'pools':
      return withAdminAuth(req, () => listPools(req));
    default:
      return badRequest(
        'Invalid action. Supported: account-list, account-detail, ledger-list, ledger-detail, settlement-list, settlement-detail, summary-account, summary-ledger, pools',
      );
  }
}

export async function POST(req: NextRequest) {
  const action = req.nextUrl.searchParams.get('action');
  switch (action) {
    case 'account-create':
      return withAdminAuth(req, (ctx) => createAccount(req, ctx.userId));
    case 'account-freeze':
      return withAdminAuth(req, (ctx) => freezeAccount(req, ctx.userId));
    case 'account-unfreeze':
      return withAdminAuth(req, (ctx) => unfreezeAccount(req, ctx.userId));
    case 'account-close':
      return withAdminAuth(req, (ctx) => closeAccount(req, ctx.userId));
    case 'ledger-post':
      return withAdminAuth(req, (ctx) => postLedger(req, ctx.userId));
    case 'ledger-reverse':
      return withAdminAuth(req, (ctx) => reverseLedger(req, ctx.userId));
    case 'ledger-void':
      return withAdminAuth(req, (ctx) => voidLedger(req, ctx.userId));
    case 'revenue-recognize-369':
      return withAdminAuth(req, (ctx) => recognizeWine369(req, ctx.userId));
    case 'pools-initialize':
      return withAdminAuth(req, (ctx) => initializePools(req, ctx.userId));
    case 'settlement-create':
      return withAdminAuth(req, (ctx) => createSettlement(req, ctx.userId));
    case 'settlement-add-item':
      return withAdminAuth(req, (ctx) => addSettlementItem(req, ctx.userId));
    case 'settlement-approve':
      return withAdminAuth(req, (ctx) => approveSettlement(req, ctx.userId));
    case 'settlement-pay':
      return withAdminAuth(req, (ctx) => paySettlement(req, ctx.userId));
    case 'settlement-cancel':
      return withAdminAuth(req, (ctx) => cancelSettlement(req, ctx.userId));
    default:
      return badRequest(
        'Invalid action. Supported: account-create, account-freeze, account-unfreeze, account-close, ledger-post, ledger-reverse, ledger-void, revenue-recognize-369, pools-initialize, settlement-create, settlement-add-item, settlement-approve, settlement-pay, settlement-cancel',
      );
  }
}

// ============================================================
// GET handlers
// ============================================================

// P0-1: 账户是平台级数据，listAccounts 仅 admin 可访问（已在 GET switch 中用 withAdminAuth 保护）
async function listAccounts(req: NextRequest) {
  try {
    const p = req.nextUrl.searchParams;
    const accountType = p.get('accountType') || undefined;
    const currency = p.get('currency') || undefined;
    const status = p.get('status') || undefined;
    const page = parseInt(p.get('page') || '1');
    const pageSize = parseInt(p.get('pageSize') || '20');

    const svc = new FjnFinanceService();
    const result = await svc.listAccounts({
      accountType: accountType as any,
      currency,
      status: status as any,
      page,
      pageSize,
    });
    return success(result);
  } catch (e: any) {
    return handleApiError(e, 'api:fjn/finance account-list');
  }
}

// P0-1: 账户是平台级数据，getAccountDetail 仅 admin 可访问
async function getAccountDetail(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id');
  if (!id) return badRequest('Missing id');
  try {
    const svc = new FjnFinanceService();
    const acc = await svc.findAccountById(id);
    if (!acc) return notFound('Finance account not found');
    return success(acc);
  } catch (e: any) {
    return handleApiError(e, 'api:fjn/finance account-detail');
  }
}

// P0-1: 流水按 userId 过滤 - 普通用户强制自己；admin 可选 userId
async function listLedgers(req: NextRequest, ctxUserId: string, isAdmin: boolean) {
  try {
    const p = req.nextUrl.searchParams;
    const accountId = p.get('accountId') || undefined;
    const businessType = p.get('businessType') || undefined;
    const direction = p.get('direction') || undefined;
    const orderId = p.get('orderId') || undefined;
    const queryUserId = p.get('userId') || undefined;
    const page = parseInt(p.get('page') || '1');
    const pageSize = parseInt(p.get('pageSize') || '20');

    // IDOR 防护：非 admin 强制使用自己的 userId，忽略 query 中的 userId
    const userId = isAdmin ? queryUserId : ctxUserId;

    const svc = new FjnFinanceService();
    const result = await svc.listLedgers({
      accountId,
      businessType: businessType as any,
      direction: direction as any,
      orderId,
      userId,
      page,
      pageSize,
    });
    return success(result);
  } catch (e: any) {
    return handleApiError(e, 'api:fjn/finance ledger-list');
  }
}

// P0-1: 流水详情所有权检查 - 普通用户只能看自己的；admin 可看所有
async function getLedgerDetail(req: NextRequest, ctxUserId: string, isAdmin: boolean) {
  const id = req.nextUrl.searchParams.get('id');
  if (!id) return badRequest('Missing id');
  try {
    const svc = new FjnFinanceService();
    const ledger: any = await svc.findLedgerById(id);
    if (!ledger) return notFound('Ledger not found');
    // IDOR 防护：非 admin 必须检查流水归属
    if (!isAdmin && ledger.userId !== ctxUserId) {
      return forbidden('You can only view your own ledgers');
    }
    return success(ledger);
  } catch (e: any) {
    return handleApiError(e, 'api:fjn/finance ledger-detail');
  }
}

// P0-1: 结算单是平台级数据，listSettlements 仅 admin 可访问
async function listSettlements(req: NextRequest) {
  try {
    const p = req.nextUrl.searchParams;
    const settlementType = p.get('settlementType') || undefined;
    const status = p.get('status') || undefined;
    const period = p.get('period') || undefined;
    const page = parseInt(p.get('page') || '1');
    const pageSize = parseInt(p.get('pageSize') || '20');

    const svc = new FjnFinanceService();
    const result = await svc.listSettlements({
      settlementType: settlementType as any,
      status: status as any,
      period,
      page,
      pageSize,
    });
    return success(result);
  } catch (e: any) {
    return handleApiError(e, 'api:fjn/finance settlement-list');
  }
}

// P0-1: 结算单是平台级数据，getSettlementDetail 仅 admin 可访问
async function getSettlementDetail(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id');
  if (!id) return badRequest('Missing id');
  try {
    const svc = new FjnFinanceService();
    const s = await svc.findSettlementById(id);
    if (!s) return notFound('Settlement not found');
    return success(s);
  } catch (e: any) {
    return handleApiError(e, 'api:fjn/finance settlement-detail');
  }
}

// P0-1: 账户汇总是平台级数据，仅 admin 可访问
async function getAccountSummary(req: NextRequest) {
  try {
    const p = req.nextUrl.searchParams;
    const currency = p.get('currency') || undefined;
    const accountType = p.get('accountType') || undefined;

    const svc = new FjnFinanceService();
    const result = await svc.getAccountSummary({ currency, accountType: accountType as any });
    return success(result);
  } catch (e: any) {
    return handleApiError(e, 'api:fjn/finance summary-account');
  }
}

// P0-1: 流水汇总按 userId 过滤 - 普通用户仅自己；admin 可选
async function getLedgerSummary(req: NextRequest, ctxUserId: string, isAdmin: boolean) {
  try {
    const p = req.nextUrl.searchParams;
    const currency = p.get('currency') || undefined;
    const startTime = p.get('startTime') || undefined;
    const endTime = p.get('endTime') || undefined;
    const queryUserId = p.get('userId') || undefined;
    // IDOR 防护：非 admin 强制使用自己的 userId
    const userId = isAdmin ? queryUserId : ctxUserId;

    const svc = new FjnFinanceService();
    const result = await svc.getLedgerSummary({
      currency,
      userId,
      startTime: startTime ? new Date(startTime) : undefined,
      endTime: endTime ? new Date(endTime) : undefined,
    });
    return success(result);
  } catch (e: any) {
    return handleApiError(e, 'api:fjn/finance summary-ledger');
  }
}

// P0-1: 池子是平台级数据，listPools 仅 admin 可访问
async function listPools(req: NextRequest) {
  try {
    const p = req.nextUrl.searchParams;
    const currency = p.get('currency') || 'CNY';
    const svc = new FjnFinanceService();
    const result = await svc.listAccounts({
      accountType: undefined,
      currency,
      page: 1,
      pageSize: 100,
    });
    // 过滤出 369 三池 + 应付/准备金
    const poolTypes = [
      'wine_cost_pool',
      'market_ecosystem_pool',
      'company_pool',
      'referral_reward_payable',
      'team_reward_payable',
      'node_reward_payable',
      'tax_payable',
      'merchant_payable',
      'platform_cash',
      'refund_reserve',
    ];
    const filtered = result.items.filter((it: any) => poolTypes.includes(it.accountType));
    return success({ items: filtered, total: filtered.length, currency });
  } catch (e: any) {
    return handleApiError(e, 'api:fjn/finance pools');
  }
}

// ============================================================
// POST handlers (admin)
// ============================================================

async function createAccount(req: NextRequest, operatorId: string) {
  try {
    const body = await req.json();
    const { accountName, accountType, currency } = body;
    if (!accountName || !accountType || !currency) {
      return badRequest('Missing required: accountName, accountType, currency');
    }
    const svc = new FjnFinanceService();
    const result = await svc.createAccount({ accountName, accountType, currency, operatorId });
    return created(result);
  } catch (e: any) {
    if (e instanceof FjnError) {
      return badRequest(e.message, { code: e.code, context: e.context });
    }
    return handleApiError(e, 'api:fjn/finance account-create');
  }
}

async function freezeAccount(req: NextRequest, operatorId: string) {
  try {
    const body = await req.json();
    const { id, reason } = body;
    if (!id || !reason) return badRequest('Missing required: id, reason');
    const svc = new FjnFinanceService();
    const result = await svc.freezeAccount(id, { reason, operatorId });
    return success(result);
  } catch (e: any) {
    if (e instanceof FjnError) {
      return badRequest(e.message, { code: e.code, context: e.context });
    }
    return handleApiError(e, 'api:fjn/finance account-freeze');
  }
}

async function unfreezeAccount(req: NextRequest, operatorId: string) {
  try {
    const body = await req.json();
    const { id, reason } = body;
    if (!id || !reason) return badRequest('Missing required: id, reason');
    const svc = new FjnFinanceService();
    const result = await svc.unfreezeAccount(id, { reason, operatorId });
    return success(result);
  } catch (e: any) {
    if (e instanceof FjnError) {
      return badRequest(e.message, { code: e.code, context: e.context });
    }
    return handleApiError(e, 'api:fjn/finance account-unfreeze');
  }
}

async function closeAccount(req: NextRequest, operatorId: string) {
  try {
    const body = await req.json();
    const { id, reason } = body;
    if (!id || !reason) return badRequest('Missing required: id, reason');
    const svc = new FjnFinanceService();
    const result = await svc.closeAccount(id, { reason, operatorId });
    return success(result);
  } catch (e: any) {
    if (e instanceof FjnError) {
      return badRequest(e.message, { code: e.code, context: e.context });
    }
    return handleApiError(e, 'api:fjn/finance account-close');
  }
}

async function postLedger(req: NextRequest, operatorId: string) {
  try {
    const body = await req.json();
    const {
      accountType,
      businessType,
      direction,
      amount,
      currency,
      sourceType,
      sourceId,
      orderId,
      userId,
      counterpartyId,
      ruleVersion,
      accountingSubject,
      description,
    } = body;
    if (!accountType || !businessType || !direction || !amount || !currency || !sourceType || !sourceId) {
      return badRequest(
        'Missing required: accountType, businessType, direction, amount, currency, sourceType, sourceId',
      );
    }
    const svc = new FjnFinanceService();
    const result = await svc.postLedger({
      accountType,
      businessType,
      direction,
      amount,
      currency,
      sourceType,
      sourceId,
      orderId,
      userId,
      counterpartyId,
      ruleVersion,
      accountingSubject,
      description,
      operatorId,
    });
    return created(result);
  } catch (e: any) {
    if (e instanceof FjnError) {
      return badRequest(e.message, { code: e.code, context: e.context });
    }
    return handleApiError(e, 'api:fjn/finance ledger-post');
  }
}

async function reverseLedger(req: NextRequest, operatorId: string) {
  try {
    const body = await req.json();
    const { id, reason, approvalId } = body;
    if (!id || !reason) return badRequest('Missing required: id, reason');
    const svc = new FjnFinanceService();
    const result = await svc.reverseLedger(id, { reason, approvalId, operatorId });
    return success(result);
  } catch (e: any) {
    if (e instanceof FjnError) {
      return badRequest(e.message, { code: e.code, context: e.context });
    }
    return handleApiError(e, 'api:fjn/finance ledger-reverse');
  }
}

async function voidLedger(req: NextRequest, operatorId: string) {
  try {
    const body = await req.json();
    const { id, reason } = body;
    if (!id || !reason) return badRequest('Missing required: id, reason');
    const svc = new FjnFinanceService();
    const result = await svc.voidLedger(id, { reason, operatorId });
    return success(result);
  } catch (e: any) {
    if (e instanceof FjnError) {
      return badRequest(e.message, { code: e.code, context: e.context });
    }
    return handleApiError(e, 'api:fjn/finance ledger-void');
  }
}

async function recognizeWine369(req: NextRequest, operatorId: string) {
  try {
    const body = await req.json();
    const { orderId, userId, currency, totalAmount, sourceId, ruleVersion } = body;
    if (!orderId || !userId || !currency || !totalAmount || !sourceId) {
      return badRequest('Missing required: orderId, userId, currency, totalAmount, sourceId');
    }
    const svc = new FjnFinanceService();
    const result = await svc.recognizeWine369Revenue({
      orderId,
      userId,
      currency,
      totalAmount,
      sourceId,
      ruleVersion,
      operatorId,
    });
    return created(result);
  } catch (e: any) {
    if (e instanceof FjnError) {
      return badRequest(e.message, { code: e.code, context: e.context });
    }
    return handleApiError(e, 'api:fjn/finance revenue-recognize-369');
  }
}

async function initializePools(req: NextRequest, operatorId: string) {
  try {
    const body = await req.json().catch(() => ({}));
    const currency = body.currency || 'CNY';
    const svc = new FjnFinanceService();
    const result = await svc.initializePools(currency, operatorId);
    return created(result);
  } catch (e: any) {
    if (e instanceof FjnError) {
      return badRequest(e.message, { code: e.code, context: e.context });
    }
    return handleApiError(e, 'api:fjn/finance pools-initialize');
  }
}

async function createSettlement(req: NextRequest, operatorId: string) {
  try {
    const body = await req.json();
    const { settlementType, period, currency, description } = body;
    if (!settlementType || !period || !currency) {
      return badRequest('Missing required: settlementType, period, currency');
    }
    const svc = new FjnFinanceService();
    const result = await svc.createSettlement({
      settlementType,
      period,
      currency,
      description,
      operatorId,
    });
    return created(result);
  } catch (e: any) {
    if (e instanceof FjnError) {
      return badRequest(e.message, { code: e.code, context: e.context });
    }
    return handleApiError(e, 'api:fjn/finance settlement-create');
  }
}

async function addSettlementItem(req: NextRequest, operatorId: string) {
  try {
    const body = await req.json();
    const { settlementId, userId, merchantId, nodeId, amount, taxAmount, bankInfo } = body;
    if (!settlementId || !amount) {
      return badRequest('Missing required: settlementId, amount');
    }
    const svc = new FjnFinanceService();
    const result = await svc.addSettlementItem({
      settlementId,
      userId,
      merchantId,
      nodeId,
      amount,
      taxAmount: taxAmount ?? '0',
      bankInfo,
      operatorId,
    });
    return created(result);
  } catch (e: any) {
    if (e instanceof FjnError) {
      return badRequest(e.message, { code: e.code, context: e.context });
    }
    return handleApiError(e, 'api:fjn/finance settlement-add-item');
  }
}

async function approveSettlement(req: NextRequest, operatorId: string) {
  try {
    const body = await req.json();
    const { id, approverId, reviewNote } = body;
    if (!id || !approverId) return badRequest('Missing required: id, approverId');
    const svc = new FjnFinanceService();
    const result = await svc.approveSettlement(id, { approverId, reviewNote, operatorId });
    return success(result);
  } catch (e: any) {
    if (e instanceof FjnError) {
      return badRequest(e.message, { code: e.code, context: e.context });
    }
    return handleApiError(e, 'api:fjn/finance settlement-approve');
  }
}

async function paySettlement(req: NextRequest, operatorId: string) {
  try {
    const body = await req.json();
    const { id, paidAt } = body;
    if (!id) return badRequest('Missing required: id');
    const svc = new FjnFinanceService();
    const result = await svc.paySettlement(id, {
      paidAt: paidAt ? new Date(paidAt) : undefined,
      operatorId,
    });
    return success(result);
  } catch (e: any) {
    if (e instanceof FjnError) {
      return badRequest(e.message, { code: e.code, context: e.context });
    }
    return handleApiError(e, 'api:fjn/finance settlement-pay');
  }
}

async function cancelSettlement(req: NextRequest, operatorId: string) {
  try {
    const body = await req.json();
    const { id, reason } = body;
    if (!id || !reason) return badRequest('Missing required: id, reason');
    const svc = new FjnFinanceService();
    const result = await svc.cancelSettlement(id, { reason, operatorId });
    return success(result);
  } catch (e: any) {
    if (e instanceof FjnError) {
      return badRequest(e.message, { code: e.code, context: e.context });
    }
    return handleApiError(e, 'api:fjn/finance settlement-cancel');
  }
}
