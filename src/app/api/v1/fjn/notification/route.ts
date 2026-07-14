/**
 * FJN Notification Service REST API
 * /api/v1/fjn/notification
 *
 * 文档：H015 §5.6.3
 *
 * 端点：
 *  - GET  ?action=list                跨用户通知列表（管理后台）
 *  - POST action=send                 发送通知 (admin)
 *  - POST action=mark-read            标记已读 (admin)
 */

import { NextRequest } from 'next/server';
import { success, badRequest } from '@/lib/api/response';
import { handleApiError } from '@/lib/api/error-handler';
import { withAdminAuth } from '@/lib/api/middleware';
import { FjnNotificationService } from '@/lib/fjn/services/notification-service';
import { FjnNotificationError } from '@/lib/fjn/services/notification-errors';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const action = req.nextUrl.searchParams.get('action');
  switch (action) {
    case 'list':
      return withAdminAuth(req, () => listNotifications(req));
    default:
      return badRequest('Invalid action. Supported (GET): list');
  }
}

export async function POST(req: NextRequest) {
  const action = req.nextUrl.searchParams.get('action');
  switch (action) {
    case 'send':
      return withAdminAuth(req, () => sendNotification(req));
    case 'mark-read':
      return withAdminAuth(req, () => markRead(req));
    default:
      return badRequest('Invalid action. Supported (POST): send, mark-read');
  }
}

async function listNotifications(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  const page = parseInt(p.get('page') || '1');
  const pageSize = parseInt(p.get('pageSize') || '20');
  const userId = p.get('userId') || undefined;
  const type = (p.get('type') as any) || undefined;
  const read = p.get('read') != null ? p.get('read') === 'true' : undefined;
  try {
    const svc = new FjnNotificationService();
    const result = await svc.adminList({ userId, type, read, page, pageSize });
    return success(result);
  } catch (e: any) {
    if (e instanceof FjnNotificationError) return badRequest(e.message, { code: e.code, context: e.context });
    return handleApiError(e, 'api:fjn/notification list');
  }
}

async function sendNotification(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, type, title, content, channels, priority, actionUrl } = body;
    if (!userId || !type || !title || !content) {
      return badRequest('Missing required: userId, type, title, content');
    }
    const svc = new FjnNotificationService();
    const result = await svc.send({ userId, type, title, content, channels, priority, actionUrl, bypassPreference: true });
    return success(result);
  } catch (e: any) {
    if (e instanceof FjnNotificationError) return badRequest(e.message, { code: e.code, context: e.context });
    return handleApiError(e, 'api:fjn/notification send');
  }
}

async function markRead(req: NextRequest) {
  try {
    const { notificationId, userId } = await req.json();
    if (!notificationId || !userId) return badRequest('Missing required: notificationId, userId');
    const svc = new FjnNotificationService();
    const result = await svc.markRead({ notificationId, userId });
    return success(result);
  } catch (e: any) {
    if (e instanceof FjnNotificationError) return badRequest(e.message, { code: e.code, context: e.context });
    return handleApiError(e, 'api:fjn/notification mark-read');
  }
}
