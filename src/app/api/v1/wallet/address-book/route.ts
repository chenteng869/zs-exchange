import { NextRequest } from 'next/server';
import { success, badRequest, notFound } from '@/lib/api/response';
import { requireAuth, AuthContext } from '@/lib/api/auth';
import { addressBookRepository } from '@/repositories/address-book.repository';
import { parsePagination, formatPaginatedResult } from '@/lib/api/pagination';

export async function GET(req: NextRequest) {
  return requireAuth(req, async (ctx: AuthContext) => {
    const searchParams = req.nextUrl.searchParams;
    const pagination = parsePagination(searchParams);
    const chainType = searchParams.get('chainType');
    const chainId = searchParams.get('chainId');
    const assetSymbol = searchParams.get('assetSymbol');

    const result = await addressBookRepository.findByUserId(ctx.userId, pagination, {
      chainType: chainType || undefined,
      chainId: chainId || undefined,
      assetSymbol: assetSymbol || undefined,
    });

    return success(formatPaginatedResult(result));
  });
}

export async function POST(req: NextRequest) {
  return requireAuth(req, async (ctx: AuthContext) => {
    const body = await req.json();
    const { chainType, chainId, assetSymbol, address, label } = body;

    if (!chainType || !address || !label) {
      return badRequest('chainType, address, and label are required');
    }

    const exists = await addressBookRepository.findByUserIdAndAddress(ctx.userId, address);
    if (exists) {
      return badRequest('Address already exists in address book');
    }

    const entry = await addressBookRepository.create({
      userId: ctx.userId,
      chainType: chainType as any,
      chainId: chainId || null as any,
      assetSymbol: assetSymbol || null as any,
      address,
      label,
      isBlacklisted: false as any,
      createdAt: new Date() as any,
    } as any);

    return success(entry);
  });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  return requireAuth(req, async (ctx: AuthContext) => {
    const entry = await addressBookRepository.findById(params.id);
    if (!entry) {
      return notFound('Address book entry not found');
    }

    if (entry.userId !== ctx.userId) {
      return badRequest('You can only delete your own address book entries');
    }

    await addressBookRepository.delete(params.id);

    return success({ message: 'Address book entry deleted' });
  });
}