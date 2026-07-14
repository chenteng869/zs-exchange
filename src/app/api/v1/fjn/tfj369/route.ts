/**
 * tFJ369 Service REST API
 * /api/v1/fjn/tfj369
 *
 * 文档：H024 / 工业级最终方案 §5.5.2
 *
 * 端点（18 个）：
 *
 *  GET
 *  - account-list        账户列表（分页 + status 过滤）
 *  - account-detail       账户详情（by userId）
 *  - account-balance      余额（含 available / locked / frozen / inOrder / consumed / burned）
 *  - ledger-list          流水列表（分页 + userId/changeType 过滤）
 *  - ledger-trace         用户最近流水（by userId）
 *  - conversion-list      转换单列表
 *  - conversion-detail    转换单详情（by conversionNo）
 *  - lock-list            锁仓列表
 *  - trade-order-list     交易挂单列表
 *  - market-price         当前市场报价
 *
 *  POST
 *  - open-account         开户
 *  - mint                 铸币
 *  - burn                 销毁
 *  - lock                 锁仓
 *  - unlock               解锁
 *  - request-conversion   申请转换
 *  - approve-conversion   批准转换
 *  - execute-conversion   执行转换（含链上 tx）
 *  - cancel-conversion    取消转换
 *  - freeze-account       冻结账户
 *  - unfreeze-account     解冻账户
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { success, created, badRequest } from '@/lib/api/response';
import { handleApiError } from '@/lib/api/error-handler';
import { withAdminAuth, withUserAuth } from '@/lib/api/middleware';
import { FjnTfj369Service } from '@/lib/fjn/services/tfj369-service';
import { FjnError } from '@/lib/fjn/errors';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// ============================================================
// Zod Schema
// ============================================================

const openAccountSchema = z.object({
  userId: z.string().uuid(),
  metadata: z.record(z.any()).optional(),
});

const mintSchema = z.object({
  userId: z.string().uuid(),
  amount: z.string().min(1),
  sourceType: z.string().min(1),
  sourceId: z.string().optional(),
  bizType: z.string().optional(),
  txHash: z.string().optional(),
  mintAddress: z.string().optional(),
});

const burnSchema = z.object({
  userId: z.string().uuid(),
  amount: z.string().min(1),
  reason: z.string().min(1),
  sourceType: z.string().optional(),
  sourceId: z.string().optional(),
  txHash: z.string().optional(),
});

const lockSchema = z.object({
  userId: z.string().uuid(),
  amount: z.string().min(1),
  lockType: z.enum(['trade', 'convert', 'mall_consume', 'nft_upgrade']),
  sourceType: z.string().optional(),
  sourceId: z.string().optional(),
  expiresAt: z.string().datetime().optional(),
});

const unlockSchema = z.object({
  lockId: z.string().uuid(),
  burnOnUnlock: z.boolean().optional(),
});

const requestConversionSchema = z.object({
  userId: z.string().uuid(),
  cfj369Amount: z.string().min(1),
  memberLevel: z.enum(['standard', 'silver', 'gold', 'platinum', 'diamond']).optional(),
  riskStatus: z.enum(['normal', 'warning', 'restricted', 'blocked']).optional(),
  kycVerified: z.boolean().optional(),
  regionAllowed: z.boolean().optional(),
});

const approveConversionSchema = z.object({
  conversionNo: z.string().min(1),
});

const executeConversionSchema = z.object({
  conversionNo: z.string().min(1),
  txHash: z.string().min(1),
});

const cancelConversionSchema = z.object({
  conversionNo: z.string().min(1),
  reason: z.string().min(1),
});

const userIdSchema = z.object({
  userId: z.string().uuid(),
});

// ============================================================
// GET Handler
// ============================================================

export async function GET(req: NextRequest) {
  const action = req.nextUrl.searchParams.get('action');
  switch (action) {
    // ---- Admin-only ----
    case 'account-list':
      return withAdminAuth(req, () => listAccounts(req));
    case 'ledger-list':
      return withAdminAuth(req, () => listLedgers(req));
    case 'conversion-list':
      return withAdminAuth(req, () => listConversions(req));
    case 'lock-list':
      return withAdminAuth(req, () => listLocks(req));
    case 'trade-order-list':
      return withAdminAuth(req, () => listTradeOrders(req));
    case 'market-price':
      return withAdminAuth(req, () => getMarketPrice(req));

    // ---- User-self ----
    case 'account-detail':
      return withUserAuth(req, (ctx) => getAccountDetail(req, ctx.userId));
    case 'account-balance':
      return withUserAuth(req, (ctx) => getAccountBalance(ctx.userId));
    case 'ledger-trace':
      return withUserAuth(req, (ctx) => getLedgerTrace(req, ctx.userId));
    case 'conversion-detail':
      return withUserAuth(req, (ctx) => getConversionDetail(req, ctx.userId));

    default:
      return badRequest(
        'Invalid action. Supported (GET): account-list, account-detail, account-balance, ledger-list, ledger-trace, conversion-list, conversion-detail, lock-list, trade-order-list, market-price'
      );
  }
}

// ============================================================
// POST Handler
// ============================================================

export async function POST(req: NextRequest) {
  const action = req.nextUrl.searchParams.get('action');
  switch (action) {
    // ---- User-initiated ----
    case 'open-account':
      return withUserAuth(req, (ctx) => openAccount(req, ctx.userId));
    case 'mint':
      return withUserAuth(req, (ctx) => mint(req, ctx.userId));
    case 'burn':
      return withUserAuth(req, (ctx) => burn(req, ctx.userId));
    case 'lock':
      return withUserAuth(req, (ctx) => lock(req, ctx.userId));
    case 'unlock':
      return withUserAuth(req, () => unlock(req));
    case 'request-conversion':
      return withUserAuth(req, (ctx) => requestConversion(req, ctx.userId));

    // ---- Admin-only ----
    case 'approve-conversion':
      return withAdminAuth(req, (ctx) => approveConversion(req, ctx.userId));
    case 'execute-conversion':
      return withAdminAuth(req, (ctx) => executeConversion(req, ctx.userId));
    case 'cancel-conversion':
      return withAdminAuth(req, (ctx) => cancelConversion(req, ctx.userId));
    case 'freeze-account':
      return withAdminAuth(req, (ctx) => freezeAccount(req, ctx.userId));
    case 'unfreeze-account':
      return withAdminAuth(req, (ctx) => unfreezeAccount(req, ctx.userId));

    default:
      return badRequest(
        'Invalid action. Supported (POST): open-account, mint, burn, lock, unlock, request-conversion, approve-conversion, execute-conversion, cancel-conversion, freeze-account, unfreeze-account'
      );
  }
}

// ============================================================
// GET Implementations
// ============================================================

async function listAccounts(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  const page = parseInt(p.get('page') || '1');
  const pageSize = parseInt(p.get('pageSize') || '20');
  const status = (p.get('status') as any) || undefined;
  try {
    const svc = new FjnTfj369Service();
    const result = await svc.listAccounts({ status, page, pageSize });
    return success(result);
  } catch (e: any) {
    return handleFjnError(e, 'api:fjn/tfj369 account-list');
  }
}

async function listLedgers(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  const page = parseInt(p.get('page') || '1');
  const pageSize = parseInt(p.get('pageSize') || '20');
  const userId = p.get('userId') || undefined;
  const changeType = (p.get('changeType') as any) || undefined;
  try {
    const svc = new FjnTfj369Service();
    const result = await svc.listLedgers({ userId, changeType, page, pageSize });
    return success(result);
  } catch (e: any) {
    return handleFjnError(e, 'api:fjn/tfj369 ledger-list');
  }
}

async function listConversions(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  const page = parseInt(p.get('page') || '1');
  const pageSize = parseInt(p.get('pageSize') || '20');
  const userId = p.get('userId') || undefined;
  const status = (p.get('status') as any) || undefined;
  try {
    const svc = new FjnTfj369Service();
    const result = await svc.listConversions({ userId, status, page, pageSize });
    return success(result);
  } catch (e: any) {
    return handleFjnError(e, 'api:fjn/tfj369 conversion-list');
  }
}

async function listLocks(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  const userId = p.get('userId') || undefined;
  const status = p.get('status') || undefined;
  const page = parseInt(p.get('page') || '1');
  const pageSize = parseInt(p.get('pageSize') || '20');
  try {
    const svc = new FjnTfj369Service();
    // 借 listLedgers 的方式查 locks
    const { Prisma } = await import('@prisma/client');
    const where: any = {};
    if (userId) where.userId = userId;
    if (status) where.status = status;
    const [items, total] = await Promise.all([
      (svc as any).prisma.fjnTPointsLock.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      (svc as any).prisma.fjnTPointsLock.count({ where }),
    ]);
    return success({ items, total, page, pageSize });
  } catch (e: any) {
    return handleFjnError(e, 'api:fjn/tfj369 lock-list');
  }
}

async function listTradeOrders(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  const userId = p.get('userId') || undefined;
  const status = p.get('status') || undefined;
  const side = p.get('side') || undefined;
  const page = parseInt(p.get('page') || '1');
  const pageSize = parseInt(p.get('pageSize') || '20');
  try {
    const svc = new FjnTfj369Service();
    const where: any = {};
    if (userId) where.userId = userId;
    if (status) where.status = status;
    if (side) where.side = side;
    const [items, total] = await Promise.all([
      (svc as any).prisma.fjnTPointsTradeOrder.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      (svc as any).prisma.fjnTPointsTradeOrder.count({ where }),
    ]);
    return success({ items, total, page, pageSize });
  } catch (e: any) {
    return handleFjnError(e, 'api:fjn/tfj369 trade-order-list');
  }
}

async function getMarketPrice(req: NextRequest) {
  const symbol = req.nextUrl.searchParams.get('symbol') || 'tFJ369/USDT';
  try {
    const svc = new FjnTfj369Service();
    const items = await (svc as any).prisma.fjnTPointsMarketPrice.findMany({
      where: { symbol },
      orderBy: { createdAt: 'desc' },
      take: 1,
    });
    return success({ symbol, latest: items[0] || null });
  } catch (e: any) {
    return handleFjnError(e, 'api:fjn/tfj369 market-price');
  }
}

async function getAccountDetail(req: NextRequest, currentUserId: string) {
  const p = req.nextUrl.searchParams;
  const userId = p.get('userId') || currentUserId;
  try {
    const svc = new FjnTfj369Service();
    const acc = await svc.getAccount(userId);
    return success(acc);
  } catch (e: any) {
    return handleFjnError(e, 'api:fjn/tfj369 account-detail');
  }
}

async function getAccountBalance(currentUserId: string) {
  try {
    const svc = new FjnTfj369Service();
    const balance = await svc.getBalance(currentUserId);
    return success(balance);
  } catch (e: any) {
    return handleFjnError(e, 'api:fjn/tfj369 account-balance');
  }
}

async function getLedgerTrace(req: NextRequest, currentUserId: string) {
  const p = req.nextUrl.searchParams;
  const userId = p.get('userId') || currentUserId;
  const limit = parseInt(p.get('limit') || '50');
  try {
    const svc = new FjnTfj369Service();
    const items = await svc.getLedgerTrace(userId, limit);
    return success({ items, count: items.length });
  } catch (e: any) {
    return handleFjnError(e, 'api:fjn/tfj369 ledger-trace');
  }
}

async function getConversionDetail(req: NextRequest, currentUserId: string) {
  const p = req.nextUrl.searchParams;
  const conversionNo = p.get('conversionNo');
  if (!conversionNo) return badRequest('Missing required: conversionNo');
  try {
    const svc = new FjnTfj369Service();
    const conv = await svc.getConversion(conversionNo);
    return success(conv);
  } catch (e: any) {
    return handleFjnError(e, 'api:fjn/tfj369 conversion-detail');
  }
}

// ============================================================
// POST Implementations
// ============================================================

async function openAccount(req: NextRequest, currentUserId: string) {
  const body = await req.json();
  const dto = openAccountSchema.parse({ ...body, userId: body.userId || currentUserId });
  try {
    const svc = new FjnTfj369Service();
    const acc = await svc.openAccount({ userId: dto.userId });
    return created(acc);
  } catch (e: any) {
    return handleFjnError(e, 'api:fjn/tfj369 open-account');
  }
}

async function mint(req: NextRequest, currentUserId: string) {
  const body = await req.json();
  const dto = mintSchema.parse({ ...body, userId: body.userId || currentUserId });
  try {
    const svc = new FjnTfj369Service();
    const result = await svc.mint({
      userId: dto.userId,
      amount: dto.amount,
      sourceType: dto.sourceType,
      sourceId: dto.sourceId,
      bizType: dto.bizType,
      txHash: dto.txHash,
      mintAddress: dto.mintAddress,
      operatorId: currentUserId,
    });
    return created(result);
  } catch (e: any) {
    return handleFjnError(e, 'api:fjn/tfj369 mint');
  }
}

async function burn(req: NextRequest, currentUserId: string) {
  const body = await req.json();
  const dto = burnSchema.parse({ ...body, userId: body.userId || currentUserId });
  try {
    const svc = new FjnTfj369Service();
    const result = await svc.burn({
      userId: dto.userId,
      amount: dto.amount,
      reason: dto.reason,
      sourceType: dto.sourceType,
      sourceId: dto.sourceId,
      txHash: dto.txHash,
      operatorId: currentUserId,
    });
    return created(result);
  } catch (e: any) {
    return handleFjnError(e, 'api:fjn/tfj369 burn');
  }
}

async function lock(req: NextRequest, currentUserId: string) {
  const body = await req.json();
  const dto = lockSchema.parse({ ...body, userId: body.userId || currentUserId });
  try {
    const svc = new FjnTfj369Service();
    const result = await svc.lock({
      userId: dto.userId,
      amount: dto.amount,
      lockType: dto.lockType as any,
      sourceType: dto.sourceType,
      sourceId: dto.sourceId,
      expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined,
      operatorId: currentUserId,
    });
    return created(result);
  } catch (e: any) {
    return handleFjnError(e, 'api:fjn/tfj369 lock');
  }
}

async function unlock(req: NextRequest) {
  const body = await req.json();
  const dto = unlockSchema.parse(body);
  try {
    const svc = new FjnTfj369Service();
    const result = await svc.unlock({
      lockId: dto.lockId,
      burnOnUnlock: dto.burnOnUnlock,
    });
    return success(result);
  } catch (e: any) {
    return handleFjnError(e, 'api:fjn/tfj369 unlock');
  }
}

async function requestConversion(req: NextRequest, currentUserId: string) {
  const body = await req.json();
  const dto = requestConversionSchema.parse({ ...body, userId: body.userId || currentUserId });
  try {
    const svc = new FjnTfj369Service();
    const conv = await svc.requestConversion({
      userId: dto.userId,
      cfj369Amount: dto.cfj369Amount,
      memberLevel: dto.memberLevel as any,
      riskStatus: dto.riskStatus as any,
      kycVerified: dto.kycVerified,
      regionAllowed: dto.regionAllowed,
      operatorId: currentUserId,
    });
    return created(conv);
  } catch (e: any) {
    return handleFjnError(e, 'api:fjn/tfj369 request-conversion');
  }
}

async function approveConversion(req: NextRequest, operatorId: string) {
  const body = await req.json();
  const dto = approveConversionSchema.parse(body);
  try {
    const svc = new FjnTfj369Service();
    const result = await svc.approveConversion({
      conversionNo: dto.conversionNo,
      approverId: operatorId,
      operatorId,
    });
    return success(result);
  } catch (e: any) {
    return handleFjnError(e, 'api:fjn/tfj369 approve-conversion');
  }
}

async function executeConversion(req: NextRequest, operatorId: string) {
  const body = await req.json();
  const dto = executeConversionSchema.parse(body);
  try {
    const svc = new FjnTfj369Service();
    const result = await svc.executeConversion({
      conversionNo: dto.conversionNo,
      txHash: dto.txHash,
      operatorId,
    });
    return success(result);
  } catch (e: any) {
    return handleFjnError(e, 'api:fjn/tfj369 execute-conversion');
  }
}

async function cancelConversion(req: NextRequest, operatorId: string) {
  const body = await req.json();
  const dto = cancelConversionSchema.parse(body);
  try {
    const svc = new FjnTfj369Service();
    const result = await svc.cancelConversion(dto.conversionNo, dto.reason, operatorId);
    return success(result);
  } catch (e: any) {
    return handleFjnError(e, 'api:fjn/tfj369 cancel-conversion');
  }
}

async function freezeAccount(req: NextRequest, operatorId: string) {
  const body = await req.json();
  const dto = userIdSchema.parse(body);
  try {
    const svc = new FjnTfj369Service();
    const result = await svc.freezeAccount(dto.userId, operatorId);
    return success(result);
  } catch (e: any) {
    return handleFjnError(e, 'api:fjn/tfj369 freeze-account');
  }
}

async function unfreezeAccount(req: NextRequest, operatorId: string) {
  const body = await req.json();
  const dto = userIdSchema.parse(body);
  try {
    const svc = new FjnTfj369Service();
    const result = await svc.unfreezeAccount(dto.userId, operatorId);
    return success(result);
  } catch (e: any) {
    return handleFjnError(e, 'api:fjn/tfj369 unfreeze-account');
  }
}

// ============================================================
// Helpers
// ============================================================

function handleFjnError(e: any, context: string) {
  if (e instanceof FjnError) {
    return badRequest(e.message, { code: e.code, context: e.context });
  }
  if (e?.name === 'ZodError') {
    return badRequest('Validation failed', { issues: e.issues });
  }
  return handleApiError(e, context);
}
