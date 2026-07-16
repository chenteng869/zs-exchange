/**
 * /api/v1/solana-ico/tokens
 *
 * ICO 代币管理 API
 *  - GET    /          列表
 *  - POST   /          创建草稿
 *  - GET    /:id       详情
 *  - POST   /:id/presale    推进到 presale
 *  - POST   /:id/sale       推进到 sale
 *  - POST   /:id/finalize   完成
 *  - POST   /:id/cancel     取消
 *  - GET    /:id/stats      销售统计
 */

import { NextRequest, NextResponse } from 'next/server';
import { IcoTokenService } from '@/lib/solana-ico';
import { withAdminAuth, withUserAuth } from '@/lib/api/middleware';
import { withErrorHandler } from '@/lib/api/error-handler';

const tokenService = new IcoTokenService();

export const GET = withErrorHandler(async (req: NextRequest) => {
  const url = new URL(req.url);
  const status = url.searchParams.get('status') ?? undefined;
  const cluster = url.searchParams.get('cluster') ?? undefined;
  const skip = Number(url.searchParams.get('skip') ?? 0);
  const take = Number(url.searchParams.get('take') ?? 20);

  const result = await tokenService.listTokens({ status, chainCluster: cluster, skip, take });
  return NextResponse.json({ success: true, ...result });
});

export const POST = withErrorHandler(
  withAdminAuth(async (req: NextRequest) => {
    const body = await req.json();
    const token = await tokenService.createToken(body);
    return NextResponse.json({ success: true, data: token }, { status: 201 });
  })
);
