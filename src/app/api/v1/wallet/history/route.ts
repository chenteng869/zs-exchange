/**
 * H5 端：用户多链交易历史 API（P3-7）
 *
 * GET /api/v1/wallet/history?chain=eth&limit=50
 *
 * 2026-07-11 重大修复：
 * - 平台热钱包是 managed pool（多用户共享地址）
 * - Alchemy getAssetTransfers 对此返回"missing response"（CEX 检测）
 * - 改为从内部 DB（WalletDeposit + WalletWithdrawal）拉取用户自己的记录
 * - DB 已有 deposit=credited, withdrawal=confirmed/pending 完整状态
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api/middleware';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;
  const userId = auth.user.id;

  const { searchParams } = new URL(req.url);
  const chain = (searchParams.get('chain') || 'eth').toLowerCase();
  const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 200);

  try {
    // 1. 拉取该用户所有入金记录
    const deposits = await prisma.walletDeposit.findMany({
      where: { userId },
      include: { currency: true },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    // 2. 拉取该用户所有提现记录
    const withdrawals = await prisma.walletWithdrawal.findMany({
      where: { userId },
      include: { currency: true },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    // 3. 合并为统一 Transfer 格式
    const transfers = [
      ...deposits.map((d) => ({
        id: `deposit-${d.id}`,
        type: 'in' as const,
        chain: (d.currency.blockchain || chain).toLowerCase(),
        asset: d.currency.symbol,
        amount: d.amount.toString(),
        decimals: d.currency.decimals,
        tokenContract: d.currency.contractAddress,
        txHash: d.txHash,
        blockNumber: d.blockNumber ? parseInt(d.blockNumber, 10) : null,
        from: 'external',
        to: 'user',
        status: d.status,
        confirmations: d.confirmations,
        timestamp: d.createdAt.toISOString(),
      })),
      ...withdrawals.map((w) => ({
        id: `withdrawal-${w.id}`,
        type: 'out' as const,
        chain: (w as any).chain || chain,
        asset: w.currency.symbol,
        amount: w.amount.toString(),
        decimals: w.currency.decimals,
        tokenContract: w.currency.contractAddress,
        txHash: w.txHash,
        blockNumber: w.blockNumber ? parseInt(w.blockNumber, 10) : null,
        from: 'user',
        to: w.destinationAddress,
        status: w.status,
        confirmations: null,
        timestamp: w.createdAt.toISOString(),
      })),
    ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return NextResponse.json({
      success: true,
      data: {
        transfers: transfers.slice(0, limit),
        totalCount: transfers.length,
        source: 'internal_db',
      },
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: { code: 'HISTORY_FETCH_FAILED', message: (err as Error).message } },
      { status: 500 },
    );
  }
}
