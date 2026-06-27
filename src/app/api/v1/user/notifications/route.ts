import { NextRequest } from 'next/server';
import { success, badRequest } from '@/lib/api/response';
import { requireAuth, AuthContext } from '@/lib/api/auth';
import { notificationRepository } from '@/repositories/notification.repository';
import { parsePagination, formatPaginatedResult } from '@/lib/api/pagination';

export async function GET(req: NextRequest) {
  return requireAuth(req, async (ctx: AuthContext) => {
    const params = req.nextUrl.searchParams;
    const pagination = parsePagination(params);
    const unreadOnly = params.get('unread') === 'true';

    const result = unreadOnly
      ? await notificationRepository.findUnreadByUserId(ctx.userId, pagination)
      : await notificationRepository.findByUserId(ctx.userId, pagination);

    const unreadCount = await notificationRepository.countUnread(ctx.userId);

    return success({ ...formatPaginatedResult(result), unreadCount });
  });
}

export async function POST(req: NextRequest) {
  return requireAuth(req, async (ctx: AuthContext) => {
    const body = await req.json();
    const action = String(body.action || '');

    if (action === 'mark-read') {
      const { id } = body;
      if (!id) return badRequest('Notification id is required');
      await notificationRepository.markAsRead(id);
      return success({ ok: true });
    }

    if (action === 'mark-all-read') {
      await notificationRepository.markAllAsRead(ctx.userId);
      return success({ ok: true });
    }

    return badRequest('Unsupported action');
  });
}
