import { NextRequest } from 'next/server';
import { success } from '@/lib/api/response';

export async function GET(_req: NextRequest) {
  return success({
    status: 'ok',
    service: 'zs-exchange-api',
    uptime: 0,
    timestamp: new Date().toISOString(),
  });
}
