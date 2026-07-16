/**
 * /api/v1/solana-ico/tokens/by-symbol/[symbol]
 *  - GET  通过 symbol 查 token
 */

import { NextRequest, NextResponse } from 'next/server';
import { IcoTokenService } from '@/lib/solana-ico';
import { withErrorHandler } from '@/lib/api/error-handler';

const tokenService = new IcoTokenService();

export const GET = withErrorHandler(
  async (req: NextRequest, { params }: { params: { symbol: string } }) => {
    const token = await tokenService.getTokenBySymbol(params.symbol);
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'NOT_FOUND', message: `Token not found: ${params.symbol}` },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, data: token });
  }
);
