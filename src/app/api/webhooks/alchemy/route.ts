/**
 * Alchemy Webhook 接收端
 *
 * 路由：POST /api/webhooks/alchemy
 * Header: x-alchemy-signature: <hex hmac-sha256>
 *
 * 部署：
 *   1. 在 Alchemy Dashboard 创建 Address Activity Webhook
 *   2. 配置环境变量 ALCHEMY_WEBHOOK_SIGNING_KEY
 *   3. 配置回调 URL = https://your-domain/api/webhooks/alchemy
 *   4. IP 白名单（Alchemy 出口 IP 段）
 *
 * 演示降级：未配置 signingKey 时返回 503，但不影响其他端点。
 */

import { NextRequest, NextResponse } from 'next/server';
import { handleAlchemyWebhook } from '@/lib/wallet/webhook-handler';
import { DepositMonitor, type DepositEvent } from '@/lib/wallet/deposit-monitor';

// =============================================================================
// 单例 monitor（避免每个请求都启动轮询）
// =============================================================================

declare global {
  // eslint-disable-next-line no-var
  var __smyDepositMonitor: DepositMonitor | undefined;
}

function getMonitor(): DepositMonitor {
  if (!globalThis.__smyDepositMonitor) {
    globalThis.__smyDepositMonitor = new DepositMonitor({
      onError: (err, chain) => {
        // eslint-disable-next-line no-console
        console.warn(`[deposit-monitor] ${chain} poll error:`, err.message);
      },
      onCredited: (event: DepositEvent) => {
        // eslint-disable-next-line no-console
        console.info(
          `[deposit-monitor] CREDITED ${event.amountFormatted} ${event.tokenSymbol} ` +
          `(${event.chain}) to ${event.to} from ${event.from} (tx=${event.txHash})`,
        );
        // 业务系统可在此处入账：调用 DepositService.confirmDeposit 等
      },
    });
    globalThis.__smyDepositMonitor.start();
  }
  return globalThis.__smyDepositMonitor;
}

// =============================================================================
// POST 处理器
// =============================================================================

export async function POST(req: NextRequest): Promise<NextResponse> {
  const signingKey = process.env.ALCHEMY_WEBHOOK_SIGNING_KEY;
  if (!signingKey) {
    return NextResponse.json(
      { ok: false, error: 'ALCHEMY_WEBHOOK_SIGNING_KEY not configured' },
      { status: 503 },
    );
  }

  // 1. 读取 raw body（必须原文以匹配签名）
  const rawBody = await req.text();
  const signature =
    req.headers.get('x-alchemy-signature') ||
    req.headers.get('X-Alchemy-Signature') ||
    '';

  // 2. 校验 + 入账
  const monitor = getMonitor();
  const result = await handleAlchemyWebhook(rawBody, signature, signingKey, monitor);

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
    events: result.events.map((e) => ({
      id: e.id,
      chain: e.chain,
      token: e.tokenSymbol,
      amount: e.amountFormatted,
      to: e.to,
      txHash: e.txHash,
      status: e.status,
    })),
  });
}

// 健康检查（GET）
export async function GET(): Promise<NextResponse> {
  const monitor = getMonitor();
  return NextResponse.json({
    ok: true,
    running: monitor.isRunning(),
    watched: monitor.watchedCount(),
    pending: monitor.getPendingDeposits().length,
    confirmed: monitor.getConfirmedDeposits().length,
  });
}
