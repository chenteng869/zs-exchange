/**
 * MoonPay Webhook 接收端
 *
 * 路由：POST /api/webhooks/moonpay
 * Header: moonpay-signature: <hex hmac-sha256>
 *
 * 部署：
 *   1. 在 MoonPay Dashboard 创建 Webhook
 *   2. 配置环境变量 MOONPAY_WEBHOOK_SECRET
 *   3. 配置回调 URL = https://your-domain/api/webhooks/moonpay
 *   4. MoonPay Dashboard 设置订阅事件：
 *      - transactionCreated
 *      - transactionUpdated
 *      - transactionCompleted
 *      - transactionFailed
 *
 * 演示降级：未配置 secret 时返回 503，但不影响其他端点。
 *
 * 入账：
 *   - 业务系统可通过 manager.onOrderUpdate(handler) 订阅 'completed' 状态
 *   - 在 handler 内调用充值入账服务
 */

import { NextRequest, NextResponse } from 'next/server';
import { handleMoonPayWebhook } from '@/lib/onramp/webhook-handler';
import {
  MoonPayClient,
  MoonPayTransactionManager,
  type BuyOrder,
} from '@/lib/onramp';

// =============================================================================
// 单例 manager（避免每个请求都重新构造）
// =============================================================================

declare global {
  // eslint-disable-next-line no-var
  var __smyMoonPayManager: MoonPayTransactionManager | undefined;
}

function getManager(): MoonPayTransactionManager {
  if (!globalThis.__smyMoonPayManager) {
    const client = new MoonPayClient();
    const mgr = new MoonPayTransactionManager({ client });

    // 业务订阅：订单进入 'completed' 状态时自动入账
    mgr.onOrderUpdate(async (order: BuyOrder) => {
      if (order.status === 'completed') {
        // eslint-disable-next-line no-console
        console.info(
          `[moonpay] COMPLETED order=${order.id} user=${order.userId} ` +
          `credit ${order.cryptoAmount} ${order.crypto} to ${order.walletAddress}`,
        );
        // 业务系统可在此处：
        //  1. 调 ledger.credit(order.userId, order.crypto, order.cryptoAmount)
        //  2. 落库 deposit 记录
        //  3. 推送到账通知（SMS / push / email）
      } else if (order.status === 'failed') {
        // eslint-disable-next-line no-console
        console.warn(
          `[moonpay] FAILED order=${order.id} user=${order.userId} reason=${order.errorMessage ?? 'unknown'}`,
        );
      }
    });

    globalThis.__smyMoonPayManager = mgr;
  }
  return globalThis.__smyMoonPayManager;
}

// =============================================================================
// POST 处理器
// =============================================================================

export async function POST(req: NextRequest): Promise<NextResponse> {
  const secret = process.env.MOONPAY_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json(
      { ok: false, error: 'MOONPAY_WEBHOOK_SECRET not configured' },
      { status: 503 },
    );
  }

  // 1. 读取 raw body（必须原文以匹配签名）
  const rawBody = await req.text();
  const signature =
    req.headers.get('moonpay-signature') ||
    req.headers.get('Moonpay-Signature') ||
    '';

  // 2. 校验 + 处理
  const manager = getManager();
  const result = await handleMoonPayWebhook(rawBody, signature, secret, manager);

  // 3. 返回
  if (!result.ok) {
    const isSig = result.errors.some((e) => e.includes('SIGNATURE'));
    const status = isSig ? 401 : 400;
    return NextResponse.json(
      { ok: false, processed: result.processed, errors: result.errors },
      { status },
    );
  }
  return NextResponse.json({
    ok: true,
    processed: result.processed,
    events: result.events,
  });
}

// =============================================================================
// 健康检查（GET）
// =============================================================================

export async function GET(): Promise<NextResponse> {
  const manager = getManager();
  return NextResponse.json({
    ok: true,
    orders: manager.size(),
    pending: manager.listPendingOrders().length,
  });
}
