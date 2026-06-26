import { NextRequest } from 'next/server';
import { success } from '@/lib/api/response';

export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest) {
  return success({
    status: 'ok',
    service: 'zs-exchange-api',
    uptime: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
  });
}
