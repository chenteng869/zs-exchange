/**
 * Chain Reconciliation API
 * /api/v1/chain/reconciliation
 *
 * 端点：
 *  - GET  ?action=job-list            对账任务列表
 *  - GET  ?action=job-detail&id=...   任务详情
 *  - POST action=create-job           创建任务
 *  - POST action=run-job              运行任务
 *  - POST action=cancel-job           取消任务
 *  - GET  ?action=mismatch-list       差异列表
 *  - GET  ?action=summary             汇总
 *  - POST action=resolve-mismatch     解决差异
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { success, created, badRequest } from '@/lib/api/response';
import { handleApiError } from '@/lib/api/error-handler';
import { withAdminAuth } from '@/lib/api/middleware';
import {
  ChainReconciliationService,
  createChainReconciliationService,
  type CreateChainReconJobInput,
  type FjnChainReconJobType,
} from '@/lib/blockchain/reconciliation';
import { isValidChainType, type ChainType } from '@/lib/blockchain/reconciliation/types';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const svc = createChainReconciliationService();

// ============================================================
// Schema
// ============================================================

const createJobSchema = z.object({
  jobName: z.string().min(1).max(128),
  jobType: z.enum(['full', 'incremental', 'spot']),
  chainType: z.enum(['solana', 'evm']),
  cluster: z.string().optional(),
  businessType: z.string().optional(),
  fromSlot: z.string().optional(),
  toSlot: z.string().optional(),
  fromTime: z.string().datetime().optional(),
  toTime: z.string().datetime().optional(),
  autoResolve: z.boolean().optional(),
  addresses: z.array(z.string()).optional(),
  mints: z.array(z.string()).optional(),
});

const runJobSchema = z.object({
  jobId: z.string().uuid(),
});

const cancelJobSchema = z.object({
  jobId: z.string().uuid(),
});

const resolveMismatchSchema = z.object({
  mismatchId: z.string().uuid(),
  action: z.enum(['resolve', 'ignore']),
  note: z.string().optional(),
});

// ============================================================
// Handlers
// ============================================================

export async function GET(req: NextRequest) {
  const action = req.nextUrl.searchParams.get('action');
  switch (action) {
    case 'job-list':
      return withAdminAuth(req, () => listJobs(req));
    case 'job-detail':
      return withAdminAuth(req, () => getJobDetail(req));
    case 'mismatch-list':
      return withAdminAuth(req, () => listMismatches(req));
    case 'summary':
      return withAdminAuth(req, () => getSummary(req));
    default:
      return badRequest(
        'Invalid action. Supported (GET): job-list, job-detail, mismatch-list, summary'
      );
  }
}

export async function POST(req: NextRequest) {
  const action = req.nextUrl.searchParams.get('action');
  switch (action) {
    case 'create-job':
      return withAdminAuth(req, (ctx) => createJob(req, ctx.userId));
    case 'run-job':
      return withAdminAuth(req, () => runJob(req));
    case 'cancel-job':
      return withAdminAuth(req, () => cancelJob(req));
    case 'resolve-mismatch':
      return withAdminAuth(req, (ctx) => resolveMismatch(req, ctx.userId));
    default:
      return badRequest(
        'Invalid action. Supported (POST): create-job, run-job, cancel-job, resolve-mismatch'
      );
  }
}

// ============================================================
// GET Implementations
// ============================================================

async function listJobs(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  const chainType = p.get('chainType') as ChainType | null;
  const status = (p.get('status') as any) || undefined;
  const jobType = (p.get('jobType') as FjnChainReconJobType | null) ?? undefined;
  const page = parseInt(p.get('page') || '1');
  const pageSize = parseInt(p.get('pageSize') || '20');
  try {
    const result = await svc.listJobs({ chainType: chainType ?? undefined, status, jobType, page, pageSize });
    return success(result);
  } catch (e: any) {
    return handleApiError(e, 'api:chain-reconciliation job-list');
  }
}

async function getJobDetail(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id');
  if (!id) return badRequest('Missing required: id');
  try {
    const job = await svc.getJob(id);
    return success(job);
  } catch (e: any) {
    return handleApiError(e, 'api:chain-reconciliation job-detail');
  }
}

async function listMismatches(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  const jobId = p.get('jobId') || undefined;
  const mismatchType = (p.get('mismatchType') as any) || undefined;
  const status = (p.get('status') as any) || undefined;
  const businessType = p.get('businessType') || undefined;
  const page = parseInt(p.get('page') || '1');
  const pageSize = parseInt(p.get('pageSize') || '20');
  try {
    const result = await svc.listMismatches({ jobId, mismatchType, status, businessType, page, pageSize });
    return success(result);
  } catch (e: any) {
    return handleApiError(e, 'api:chain-reconciliation mismatch-list');
  }
}

async function getSummary(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  const fromTime = p.get('fromTime') ? new Date(p.get('fromTime')!) : undefined;
  const toTime = p.get('toTime') ? new Date(p.get('toTime')!) : undefined;
  try {
    const result = await svc.getSummary({ fromTime, toTime });
    return success(result);
  } catch (e: any) {
    return handleApiError(e, 'api:chain-reconciliation summary');
  }
}

// ============================================================
// POST Implementations
// ============================================================

async function createJob(req: NextRequest, operatorId: string) {
  const body = await req.json();
  const dto = createJobSchema.parse(body);
  if (!isValidChainType(dto.chainType)) {
    return badRequest(`Invalid chainType: ${dto.chainType}`);
  }
  try {
    const input: CreateChainReconJobInput = {
      jobName: dto.jobName,
      jobType: dto.jobType,
      chainType: dto.chainType,
      cluster: dto.cluster,
      businessType: dto.businessType,
      fromSlot: dto.fromSlot ? BigInt(dto.fromSlot) : undefined,
      toSlot: dto.toSlot ? BigInt(dto.toSlot) : undefined,
      fromTime: dto.fromTime ? new Date(dto.fromTime) : undefined,
      toTime: dto.toTime ? new Date(dto.toTime) : undefined,
      autoResolve: dto.autoResolve,
      addresses: dto.addresses,
      mints: dto.mints,
      operatorId,
    };
    const job = await svc.createJob(input);
    return created(job);
  } catch (e: any) {
    if (e?.name === 'ZodError') {
      return badRequest('Validation failed', { issues: e.issues });
    }
    return handleApiError(e, 'api:chain-reconciliation create-job');
  }
}

async function runJob(req: NextRequest) {
  const body = await req.json();
  const dto = runJobSchema.parse(body);
  try {
    const result = await svc.runJob(dto.jobId);
    return success(result);
  } catch (e: any) {
    return handleApiError(e, 'api:chain-reconciliation run-job');
  }
}

async function cancelJob(req: NextRequest) {
  const body = await req.json();
  const dto = cancelJobSchema.parse(body);
  try {
    const result = await svc.cancelJob(dto.jobId);
    return success(result);
  } catch (e: any) {
    return handleApiError(e, 'api:chain-reconciliation cancel-job');
  }
}

async function resolveMismatch(req: NextRequest, operatorId: string) {
  const body = await req.json();
  const dto = resolveMismatchSchema.parse(body);
  try {
    const result = await svc.resolveMismatch({
      mismatchId: dto.mismatchId,
      action: dto.action,
      note: dto.note,
      operatorId,
    });
    return success(result);
  } catch (e: any) {
    return handleApiError(e, 'api:chain-reconciliation resolve-mismatch');
  }
}
