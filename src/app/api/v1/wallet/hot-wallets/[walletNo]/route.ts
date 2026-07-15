/**
 * Hot Wallet 单个操作 API
 * GET  /api/v1/wallet/hot-wallets/[walletNo]  - 查询
 * PUT  /api/v1/wallet/hot-wallets/[walletNo]  - 更新配置
 *
 * 2026-07-11 修复：从 hot-wallets/route.ts 拆出 PUT，因为
 * Next.js App Router 的 [walletNo] 动态段需要在子目录文件中实现
 */

import { NextRequest } from 'next/server';
import { success, notFound } from '@/lib/api/response';
import { requireAuth, AuthContext } from '@/lib/api/auth';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest, { params }: { params: { walletNo: string } }) {
  return requireAuth(req, async (ctx: AuthContext) => {
    const wallet = await prisma.walletHotWallet.findUnique({
      where: { walletNo: params.walletNo },
    });
    if (!wallet) return notFound('Hot wallet not found');
    return success(wallet);
  });
}

export async function PUT(req: NextRequest, { params }: { params: { walletNo: string } }) {
  return requireAuth(req, async (ctx: AuthContext) => {
    let body: any = {};
    try {
      body = await req.json();
    } catch {
      return success({ message: 'No body provided, skipping update', walletNo: params.walletNo });
    }
    const { status, minBalance, maxBalance, sweepThreshold, dailyLimit, singleLimit } = body;

    const wallet = await prisma.walletHotWallet.findUnique({
      where: { walletNo: params.walletNo },
    });
    if (!wallet) return notFound('Hot wallet not found');

    const updatedWallet = await prisma.walletHotWallet.update({
      where: { walletNo: params.walletNo },
      data: {
        status: status || undefined,
        minBalance: minBalance !== undefined ? minBalance : undefined,
        maxBalance: maxBalance !== undefined ? maxBalance : undefined,
        sweepThreshold: sweepThreshold !== undefined ? sweepThreshold : undefined,
        dailyLimit: dailyLimit || null,
        singleLimit: singleLimit || null,
      },
    });
    return success(updatedWallet);
  });
}
