import { NextRequest } from 'next/server';
import { success, badRequest, notFound } from '@/lib/api/response';
import { requireAuth, AuthContext } from '@/lib/api/auth';
import prisma from '@/lib/prisma';
import { parsePagination, formatPaginatedResult } from '@/lib/api/pagination';

export async function GET(req: NextRequest) {
  return requireAuth(req, async (ctx: AuthContext) => {
    const searchParams = req.nextUrl.searchParams;
    const pagination = parsePagination(searchParams);
    const chainType = searchParams.get('chainType');
    const chainId = searchParams.get('chainId');
    const walletRole = searchParams.get('walletRole');
    const status = searchParams.get('status');

    const where: any = {};
    if (chainType) where.chainType = chainType;
    if (chainId) where.chainId = chainId;
    if (walletRole) where.walletRole = walletRole;
    if (status) where.status = status;

    const result = await prisma.walletHotWallet.findMany({
      where,
      skip: (pagination.page - 1) * pagination.pageSize,
      take: pagination.pageSize,
      orderBy: { createdAt: 'desc' },
    });

    const total = await prisma.walletHotWallet.count({ where });

    return success({
      items: result,
      total,
      page: pagination.page,
      pageSize: pagination.pageSize,
    });
  });
}

export async function POST(req: NextRequest) {
  return requireAuth(req, async (ctx: AuthContext) => {
    const body = await req.json();
    const { chainType, chainId, address, assetSymbol, contractAddress, walletRole, minBalance, maxBalance, sweepThreshold, dailyLimit, singleLimit } = body;

    if (!chainType || !chainId || !address) {
      return badRequest('chainType, chainId, and address are required');
    }

    const exists = await prisma.walletHotWallet.findFirst({
      where: { chainType, chainId, address },
    });

    if (exists) {
      return badRequest('Hot wallet with this address already exists');
    }

    const wallet = await prisma.walletHotWallet.create({
      data: {
        walletNo: `HW-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        chainType: chainType as any,
        chainId,
        address,
        assetSymbol: assetSymbol || null,
        contractAddress: contractAddress || null,
        walletRole: (walletRole || 'hot') as any,
        minBalance: minBalance || 0,
        maxBalance: maxBalance || 0,
        sweepThreshold: sweepThreshold || 0,
        dailyLimit: dailyLimit || null,
        singleLimit: singleLimit || null,
        balance: 0,
        availableBalance: 0,
        lockedBalance: 0,
        status: 'active',
      },
    });

    return success(wallet);
  });
}