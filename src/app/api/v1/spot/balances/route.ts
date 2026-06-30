import { NextRequest } from 'next/server';
import { success, badRequest, internalError } from '@/lib/api/response';
import { requireAuth, AuthContext } from '@/lib/api/auth';
import { spotAccountService } from '@/lib/spot/services';

export async function GET(req: NextRequest) {
  return requireAuth(req, async (ctx: AuthContext) => {
    try {
      const searchParams = req.nextUrl.searchParams;
      const asset = searchParams.get('asset');

      if (asset) {
        const balance = await spotAccountService.getBalance(ctx.userId, asset);
        return success(balance || {});
      }

      const balances = await spotAccountService.getBalances(ctx.userId);
      return success(balances);
    } catch (error) {
      return internalError(error instanceof Error ? error.message : 'Failed to get balances');
    }
  });
}

export async function POST(req: NextRequest) {
  return requireAuth(req, async (ctx: AuthContext) => {
    try {
      const body = await req.json();
      const { asset } = body;

      if (!asset) {
        return badRequest('Asset is required');
      }

      const account = await spotAccountService.ensureAccount(ctx.userId, asset);
      return success(account);
    } catch (error) {
      return internalError(error instanceof Error ? error.message : 'Failed to create account');
    }
  });
}