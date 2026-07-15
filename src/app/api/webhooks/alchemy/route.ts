/**
 * Alchemy Webhook 兼容入口（已迁移）
 *
 * 2026-07-11 升级：原 /api/webhooks/alchemy → /api/webhooks/alchemy/address-activity
 * 此文件保留作为向后兼容层（301/308 永久重定向）
 *
 * 业务实际使用的路由：src/app/api/webhooks/alchemy/address-activity/route.ts
 */

import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest): Promise<NextResponse> {
  // 透明转发到新路由（保留原始方法、headers、body）
  const newUrl = new URL('/api/webhooks/alchemy/address-activity', req.url);
  const newReq = new NextRequest(newUrl, {
    method: 'POST',
    headers: req.headers,
    body: req.body,
  });
  const res = await fetch(newReq);
  // 2026-07-11 修复：直接返回 NextResponse，不再用 as Promise<NextResponse> 强转
  return new NextResponse(res.body, {
    status: res.status,
    statusText: res.statusText,
    headers: res.headers,
  });
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const newUrl = new URL('/api/webhooks/alchemy/address-activity', req.url);
  const res = await fetch(newUrl);
  // 2026-07-11 修复：同上
  return new NextResponse(res.body, {
    status: res.status,
    headers: res.headers,
  });
}
