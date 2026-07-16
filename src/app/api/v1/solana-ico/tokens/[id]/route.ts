/**
 * /api/v1/solana-ico/tokens/[id]
 *
 *  - GET    详情
 *  - GET    /stats  销售统计
 *  - POST   /presale 推进到 presale
 *  - POST   /sale    推进到 sale
 *  - POST   /finalize 完成（需要 scheduleId, merkleRoot）
 *  - POST   /cancel   取消
 *  - POST   /bind-mint  绑定 mint address
 */

import { NextRequest, NextResponse } from 'next/server';
import { IcoTokenService } from '@/lib/solana-ico';
import { withAdminAuth } from '@/lib/api/middleware';
import { withErrorHandler } from '@/lib/api/error-handler';

const tokenService = new IcoTokenService();

export const GET = withErrorHandler(async (req: NextRequest, { params }: { params: { id: string } }) => {
  const token = await tokenService.getToken(params.id);
  return NextResponse.json({ success: true, data: token });
});
