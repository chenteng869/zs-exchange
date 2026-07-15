/**
 * H5 端：用户多链资产视图 API（P3-6）
 *
 * GET /api/v1/wallet/assets?chains=eth,bsc,polygon&withPrices=true
 *
 * 返回用户所有 ERC-20 余额 + USD 价值
 *
 * 性能：
 *  - 1 个链 1 次 API 调用 = < 200ms
 *  - 5 链并行 = < 500ms
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api/middleware';
import { getTokenBalances } from '@/lib/alchemy/token-api';
import { safeConsoleWarn } from '@/lib/security/safe-logger';

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;
  const userId = auth.user.id;

  const { searchParams } = new URL(req.url);
  const chainsParam = searchParams.get('chains') || 'eth,bsc,polygon,arbitrum,optimism';
  const withPrices = searchParams.get('withPrices') !== 'false';
  const minValueUsd = parseFloat(searchParams.get('minValueUsd') || '0.01');

  const chains = chainsParam.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);

  // 1. 获取用户主钱包地址（每个链一个）
  //    简化：用一个 ETH 地址 + 各链派生（实际生产中每链独立地址）
  const userWalletAddress = await getUserMainWalletAddress(userId);
  if (!userWalletAddress) {
    return NextResponse.json(
      { success: false, error: { code: 'NO_WALLET', message: 'User has no wallet address' } },
      { status: 400 },
    );
  }

  // 2. 并行查询所有链
  const results = await Promise.allSettled(
    chains.map((chain) =>
      getTokenBalances(userWalletAddress, chain, {
        withPrices,
        minValueUsd,
      }),
    ),
  );

  // 3. 聚合
  const assets: Array<{
    chain: string;
    tokens: any[];
    totalValueUsd: number;
    error?: string;
  }> = [];

  let totalValueUsd = 0;
  for (let i = 0; i < chains.length; i++) {
    const r = results[i];
    if (r.status === 'fulfilled') {
      const chainTotal = r.value.tokens.reduce((sum, t) => sum + (t.valueUsd || 0), 0);
      totalValueUsd += chainTotal;
      assets.push({
        chain: chains[i],
        tokens: r.value.tokens,
        totalValueUsd: chainTotal,
      });
    } else {
      safeConsoleWarn(`[wallet/assets] chain=${chains[i]} failed: ${r.reason?.message}`);
      assets.push({
        chain: chains[i],
        tokens: [],
        totalValueUsd: 0,
        error: r.reason?.message || 'Unknown error',
      });
    }
  }

  return NextResponse.json({
    success: true,
    data: {
      address: userWalletAddress,
      assets,
      totalValueUsd,
      chainCount: chains.length,
      timestamp: Date.now(),
    },
  });
}

// =============================================================================
// 辅助
// =============================================================================

async function getUserMainWalletAddress(userId: string): Promise<string | null> {
  // 简化：取用户主钱包地址（生产中应支持多链地址）
  try {
    const prisma = (await import('@/lib/prisma')).default;
    const address = await prisma.walletAddress.findFirst({
      where: { userId, status: 'active', tag: { contains: 'ethereum' } },
    });
    return address?.address || null;
  } catch {
    return null;
  }
}
