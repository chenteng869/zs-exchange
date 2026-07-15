/**
 * H5 端：用户 NFT 资产 API（P3-8）
 *
 * GET /api/v1/wallet/nfts?chain=eth&contract=0x...
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api/middleware';
import { getNFTsForOwner } from '@/lib/alchemy/nft-api';
import { safeConsoleWarn } from '@/lib/security/safe-logger';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;
  const userId = auth.user.id;

  const { searchParams } = new URL(req.url);
  const chain = (searchParams.get('chain') || 'eth').toLowerCase();
  const contract = searchParams.get('contract') || undefined;
  const pageKey = searchParams.get('pageKey') || undefined;

  // 1. 查找用户地址
  const address = await prisma.walletAddress.findFirst({
    where: { userId, status: 'active' },
  });

  if (!address) {
    return NextResponse.json({
      success: true,
      data: { nfts: [], totalCount: 0, pageKey: undefined },
    });
  }

  try {
    const response = await getNFTsForOwner(address.address, chain, {
      contractAddresses: contract ? [contract] : undefined,
      withMetadata: true,
      pageKey,
    });

    return NextResponse.json({
      success: true,
      data: {
        nfts: response.nfts,
        totalCount: response.totalCount,
        pageKey: response.pageKey,
        address: address.address,
      },
    });
  } catch (err) {
    safeConsoleWarn(`[wallet/nfts] chain=${chain} failed: ${(err as Error).message}`);
    return NextResponse.json(
      { success: false, error: { code: 'NFT_FETCH_FAILED', message: (err as Error).message } },
      { status: 500 },
    );
  }
}
